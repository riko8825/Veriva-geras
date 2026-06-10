// api/automations/blog-gen/route.ts
// Veriva blog post generator — JSON+template injection workflow
// Triggered by: Vercel cron (Bearer CRON_SECRET) OR manual (x-api-key BLOG_TRIGGER_SECRET)
//
// Flow:
//   1. fetchTopics() → getNextTopic() (pending → marked draft after commit)
//   2. expandKeywords() — OpenAI gpt-4.1 (cheap, 400 tokens)
//   3. generateBlogJSON() — OpenAI gpt-4.1 (full article, 4500 tokens, JSON output)
//   4. validatePost() — 10 quality checks (LT, structure, BANNED phrases)
//   5. getImage() — Pexels hero
//   6. renderTemplate() — inject 30 fields into blog/template.html
//   7. createDraftBranch + commitFileToBranch (post + topics.json status=draft)
//   8. sendTelegramDraftNotification — Publikuoti/Taisyti/Praleisti buttons

import { runPrompt } from '../../../lib/claude';
import { sendTelegramDraftNotification } from '../../../lib/telegram';
import { createDraftBranch, commitFileToBranch, deleteBranch, branchExists, getFileFromBranch } from '../../../lib/github';
import { getImage } from '../../../lib/pexels';
import { renderTemplate, validateAIResponse, validatePostData, type BlogPostData } from '../../../lib/blog-template';
import {
  BLOG_SYSTEM_PROMPT,
  KEYWORD_EXPAND_SYSTEM,
  buildBlogUserPrompt,
  buildKeywordExpandPrompt,
  type BlogBrief,
} from '../../../lib/blog-prompts';
import { resolveContentType, type ContentTypeKey } from '../../../lib/content-types';
import { fetchRecentPosts, parsePostMeta } from '../../../lib/recent-posts';
import {
  scoreUniqueness,
  buildAvoidInstructions,
  UNIQUENESS_PASS_THRESHOLD,
  type UniquenessReport,
} from '../../../lib/uniqueness';
import { verifyBlogTriggerAuth } from '../../../lib/auth';

// Node.js runtime + Fluid Compute (NE Edge): blog-gen daro AI generavimą (8000 tokenų,
// ~80-130s) + ~10 GitHub commitų. Edge 25s limitas netiktų. Fluid Compute Hobby leidžia
// iki 300s. 180s = 140s AI (claude.ts) + ~30s GitHub + atsarga. Web-standard fetch export.
export const maxDuration = 180;

const GITHUB_API = 'https://api.github.com/repos/riko8825/Veriva-geras';

// ───────────────────────────────────────────────────────────
// LT slugify — transliteruoja diakritikus + kebab-case
// ───────────────────────────────────────────────────────────
const LT_TRANSLIT: Record<string, string> = {
  'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i',
  'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
  'Ą': 'a', 'Č': 'c', 'Ę': 'e', 'Ė': 'e', 'Į': 'i',
  'Š': 's', 'Ų': 'u', 'Ū': 'u', 'Ž': 'z',
};

function slugify(text: string): string {
  return text
    .split('')
    .map(c => LT_TRANSLIT[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ───────────────────────────────────────────────────────────
// Topics.json fetch (always from main branch)
// ───────────────────────────────────────────────────────────
interface TopicEntry {
  keyword: string;
  status: 'pending' | 'draft' | 'published' | 'skipped' | 'blocked_duplication';
  post_type?: 'pillar' | 'cluster' | 'standalone';
  pillar?: string;
  author_key?: 'marina' | 'justinas' | 'veriva';
  content_type?: ContentTypeKey;
}

interface TopicsData {
  topics: TopicEntry[];
  [k: string]: unknown;
}

async function fetchTopics(): Promise<TopicsData> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('[blog-gen] GITHUB_TOKEN is not set');

  const url = `${GITHUB_API}/contents/topics.json?ref=main`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`[blog-gen] fetchTopics fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  clearTimeout(timer);

  const text = await res.text();
  if (!res.ok) throw new Error(`[blog-gen] fetchTopics GitHub API ${res.status}: ${text.slice(0, 200)}`);

  const file = JSON.parse(text) as { content: string };
  return JSON.parse(b64decodeUtf8(file.content)) as TopicsData;
}

async function getNextTopic(): Promise<{ entry: TopicEntry; index: number } | null> {
  const data = await fetchTopics();
  const idx = data.topics.findIndex(t => t.status === 'pending');
  if (idx === -1) return null;
  return { entry: data.topics[idx], index: idx };
}

/**
 * Mark a topic as blocked_duplication on main branch with race-safe retry.
 * commitFileToBranch already includes sha guard → GitHub returns 409 if sha changed mid-write.
 * We retry up to 3 times with fresh fetch to handle concurrent commits (e.g. blog-approve).
 */
async function markTopicBlocked(index: number, keyword: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const td = await fetchTopics();
      td.topics[index].status = 'blocked_duplication';
      await commitFileToBranch('main', 'topics.json', JSON.stringify(td, null, 2), `chore: block "${keyword}" — duplication`);
      console.log(`[blog-gen] markTopicBlocked attempt ${attempt} ✅ committed`);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is409 = msg.includes('409') || msg.includes('does not match') || msg.includes('conflict');
      if (is409 && attempt < maxRetries) {
        const delay = 500 * attempt;
        console.warn(`[blog-gen] markTopicBlocked attempt ${attempt} → 409 conflict, retry in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

async function pendingDraftExists(): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `${GITHUB_API}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return false;
    const branches = JSON.parse(await res.text()) as Array<{ name: string }>;
    return branches.some(b => b.name.startsWith('draft-blog-'));
  } catch {
    clearTimeout(timer);
    return false;
  }
}

// ───────────────────────────────────────────────────────────
// Author lookup (matches docs/blog-system-prompt.md authors)
// ───────────────────────────────────────────────────────────
function resolveAuthor(authorKey: string | undefined, pillar: string | undefined): { name: string; role: string; initial: string } {
  // Explicit author_key wins
  if (authorKey === 'marina') return { name: 'Marina',          role: 'Teisės ekspertė, BDAR',           initial: 'M' };
  if (authorKey === 'justinas') return { name: 'Justinas',      role: 'IT saugumo ekspertas',            initial: 'J' };
  if (authorKey === 'veriva')   return { name: 'Veriva komanda', role: 'Veriva ekspertų komanda',       initial: 'V' };

  // Fallback by pillar
  const p = (pillar ?? '').toLowerCase();
  if (p === 'bdar' || p === 'dpo')               return { name: 'Marina',         role: 'Teisės ekspertė, BDAR',     initial: 'M' };
  if (p === 'nis2' || p === 'sauga' || p === 'mokymai') return { name: 'Justinas', role: 'IT saugumo ekspertas',     initial: 'J' };
  return { name: 'Veriva komanda', role: 'Veriva ekspertų komanda', initial: 'V' };
}

// ───────────────────────────────────────────────────────────
// KEYWORD EXPANSION
// ───────────────────────────────────────────────────────────
interface ExpandedKeywords {
  primary: string;
  secondary: string;
  longTail: string;
  lsi: string[];
}

async function expandKeywords(seedKeyword: string): Promise<ExpandedKeywords> {
  const raw = await runPrompt({
    system: KEYWORD_EXPAND_SYSTEM,
    user: buildKeywordExpandPrompt(seedKeyword),
    maxTokens: 500,
  });

  try {
    return JSON.parse(raw) as ExpandedKeywords;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ExpandedKeywords;
    throw new Error(`[blog-gen] expandKeywords: failed to parse JSON. Raw: ${raw.slice(0, 200)}`);
  }
}

// ───────────────────────────────────────────────────────────
// BLOG JSON GENERATION
// ───────────────────────────────────────────────────────────
async function generateBlogJSON(brief: BlogBrief): Promise<Partial<BlogPostData>> {
  const raw = await runPrompt({
    system: BLOG_SYSTEM_PROMPT,
    user: buildBlogUserPrompt(brief),
    // 2026-05-12 dry-run: naujas content-type prompt + pillar (3500ž.) reikalauja ~16K chars output.
    // Senas 5000 max_tokens kerpa JSON vidury → JSON.parse fail. 8000 saugu, gpt-4.1 limit'as palaiko.
    maxTokens: 8000,
  });

  // Strip ```json fences if model ignored "raw JSON only" instruction
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  try {
    return JSON.parse(cleaned) as Partial<BlogPostData>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as Partial<BlogPostData>;
    throw new Error(`[blog-gen] generateBlogJSON: failed to parse JSON. Raw: ${cleaned.slice(0, 300)}`);
  }
}

// ───────────────────────────────────────────────────────────
// CONTENT VALIDATORS
// ───────────────────────────────────────────────────────────
const BANNED_LT_PHRASES = [
  'mūsų patyrę specialistai',
  'efektyvūs sprendimai',
  'aukščiausio lygio',
  'iš esmės',
  'iš principo',
  'tarkime',
  'be abejonės',
  'revoliucinis',
  'išskirtinis sprendimas',
];

function validateBannedPhrases(data: Partial<BlogPostData>): string | null {
  const body = `${data.post_body_html ?? ''} ${data.post_definition ?? ''} ${data.post_faq_html ?? ''}`;
  const text = body.replace(/<[^>]+>/g, ' ').toLowerCase();
  const hits = BANNED_LT_PHRASES.filter(p => text.includes(p));
  if (hits.length > 0) return `Banned LT phrases found: ${hits.join(', ')}`;
  return null;
}

const SOURCE_DOMAIN_WHITELIST = [
  'vdai.lrv.lt', 'eur-lex.europa.eu', 'e-tar.lt', 'edpb.europa.eu',
  'lrs.lt', 'lrt.lt', 'vrm.lrv.lt', 'enisa.europa.eu',
  'ico.org.uk', 'cnil.fr', 'bsigroup.com',
  'veriva.lt',
];

function validateSourceUrls(data: Partial<BlogPostData>): string | null {
  const html = data.post_body_html ?? '';
  const linkRe = /<a\s+href="(https?:\/\/[^"]+)"/gi;
  const offenders: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    let host = '';
    try { host = new URL(m[1]).hostname.replace(/^www\./, ''); } catch { offenders.push(m[1]); continue; }
    if (!SOURCE_DOMAIN_WHITELIST.some(d => host === d || host.endsWith(`.${d}`))) {
      offenders.push(m[1]);
    }
  }
  if (offenders.length > 0) return `Non-whitelisted source URLs: ${offenders.slice(0, 3).join(', ')}`;
  return null;
}

function validateFAQCount(data: Partial<BlogPostData>, postType: string): string | null {
  const html = data.post_faq_html ?? '';
  const itemMatches = html.match(/<div\s+class="faq-item"/gi);
  const count = itemMatches ? itemMatches.length : 0;
  const min = postType === 'pillar' ? 10 : 5;
  const max = postType === 'pillar' ? 14 : 7;
  if (count < min) return `FAQ count ${count} < ${min} (${postType} type)`;
  if (count > max) return `FAQ count ${count} > ${max} (${postType} type)`;
  return null;
}

function validateFAQSchema(data: Partial<BlogPostData>): string | null {
  const raw = data.post_faq_schema_json;
  if (!raw) return 'post_faq_schema_json missing';
  try {
    const parsed = JSON.parse(raw);
    if (parsed['@type'] !== 'FAQPage') return 'FAQ schema @type must be FAQPage';
    if (parsed.inLanguage !== 'lt-LT') return 'FAQ schema inLanguage must be lt-LT';
    if (!Array.isArray(parsed.mainEntity) || parsed.mainEntity.length < 5) {
      return `FAQ schema mainEntity must have ≥5 questions`;
    }
  } catch (e) {
    return `FAQ schema JSON invalid: ${e instanceof Error ? e.message : String(e)}`;
  }
  return null;
}

function validateInlineStyles(data: Partial<BlogPostData>): string | null {
  const html = `${data.post_body_html ?? ''} ${data.post_faq_html ?? ''}`;
  if (/\sstyle\s*=\s*["']/i.test(html)) return 'Inline style="" attributes not allowed';
  return null;
}

function validatePost(data: Partial<BlogPostData>, postType: string): { ok: true } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];

  // AI-time required fields (excludes injected post_date/post_author/post_hero_img — added by route after AI gen)
  const baseErrors = validateAIResponse(data);
  reasons.push(...baseErrors);

  // Content checks
  const phraseErr = validateBannedPhrases(data);
  if (phraseErr) reasons.push(phraseErr);

  const sourceErr = validateSourceUrls(data);
  if (sourceErr) reasons.push(sourceErr);

  const faqCountErr = validateFAQCount(data, postType);
  if (faqCountErr) reasons.push(faqCountErr);

  const faqSchemaErr = validateFAQSchema(data);
  if (faqSchemaErr) reasons.push(faqSchemaErr);

  const stylesErr = validateInlineStyles(data);
  if (stylesErr) reasons.push(stylesErr);

  // H2 count check (pillar min 6 — 7 H2 yra kokybiškas pillar; 8 buvo per griežta,
  // sukeldavo nereikalingus AI retry'us, s28)
  const h2Count = (data.post_body_html ?? '').match(/<h2\s/gi)?.length ?? 0;
  const minH2 = postType === 'pillar' ? 6 : 5;
  const maxH2 = postType === 'pillar' ? 12 : 8;
  if (h2Count < minH2 || h2Count > maxH2) {
    reasons.push(`H2 count ${h2Count} not in range ${minH2}-${maxH2} (${postType} type)`);
  }

  // CTA inline check (≥1)
  const ctaCount = (data.post_body_html ?? '').match(/<div\s+class="cta-inline"/gi)?.length ?? 0;
  if (ctaCount < 1) reasons.push('No <div class="cta-inline"> block found in body');

  // Brand mention in cta-inline-p
  const ctaPMatch = (data.post_body_html ?? '').match(/<p\s+class="cta-inline-p"[^>]*>([\s\S]*?)<\/p>/i);
  if (ctaPMatch && !/120\+\s*klient/i.test(ctaPMatch[1]) && !/€0\s*VDAI/i.test(ctaPMatch[1])) {
    reasons.push('cta-inline-p missing brand mention (120+ klientų / €0 VDAI)');
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true };
}

// ───────────────────────────────────────────────────────────
// HTML helpers
// ───────────────────────────────────────────────────────────
function formatDateHuman(dateStr: string): string {
  const months = [
    'sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio',
    'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio',
  ];
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${year} m. ${month} ${day} d.`;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

// ───────────────────────────────────────────────────────────
// Main generation with retry — combines structural validation + uniqueness gate
// ───────────────────────────────────────────────────────────
import type { RecentPostMeta } from '../../../lib/recent-posts';

interface GenerationResult {
  postData: BlogPostData;
  uniqueness: UniquenessReport;
}

async function generateWithRetry(
  brief: BlogBrief,
  slug: string,
  recents: RecentPostMeta[],
  maxAttempts = 2,
): Promise<GenerationResult> {
  let lastReasons: string[] = [];
  let lastUniqueness: UniquenessReport | null = null;
  let workingBrief = brief;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[blog-gen] AI attempt ${attempt}/${maxAttempts}`);
    const partial = await generateBlogJSON(workingBrief);

    const structResult = validatePost(partial, workingBrief.postType);
    if (!structResult.ok) {
      lastReasons = structResult.reasons;
      console.warn(`[blog-gen] AI attempt ${attempt} ❌ structural validation failed:\n  - ${structResult.reasons.join('\n  - ')}`);
      if (attempt < maxAttempts) {
        console.log(`[blog-gen] retrying with same brief...`);
        continue;
      }
      throw new Error(`[blog-gen] all ${maxAttempts} AI attempts failed structural validation:\n  - ${lastReasons.join('\n  - ')}`);
    }

    // Structural pass — now run uniqueness gate
    const candidateMeta = parsePostMeta(slug, [
      partial.post_body_html ?? '',
      partial.post_faq_html ?? '',
    ].join('\n'));
    const uniqueness = scoreUniqueness({
      slug,
      contentType: workingBrief.contentType.key,
      pillar: workingBrief.pillar,
      h2List: candidateMeta.h2List,
      h3List: candidateMeta.h3List,
      statHighlights: candidateMeta.statHighlights,
      ctaPhrases: candidateMeta.ctaPhrases,
    }, recents);

    lastUniqueness = uniqueness;
    console.log(`[blog-gen] uniqueness attempt ${attempt}: score=${uniqueness.score} verdict=${uniqueness.verdict} worst=${uniqueness.worstNeighborSlug ?? 'n/a'} h2overlap=${uniqueness.h2OverlapPct}%`);

    if (uniqueness.verdict === 'pass') {
      console.log(`[blog-gen] AI attempt ${attempt} ✅ structural + uniqueness PASS (score ${uniqueness.score})`);
      return { postData: partial as BlogPostData, uniqueness };
    }

    if (uniqueness.verdict === 'warn' && attempt === maxAttempts) {
      console.warn(`[blog-gen] AI attempt ${attempt} ⚠️ uniqueness WARN (score ${uniqueness.score}) — accepting on last attempt with warning`);
      return { postData: partial as BlogPostData, uniqueness };
    }

    console.warn(`[blog-gen] AI attempt ${attempt} ❌ uniqueness ${uniqueness.verdict} (score ${uniqueness.score}):\n  - ${uniqueness.reasons.join('\n  - ')}`);
    if (attempt < maxAttempts) {
      const avoidBlock = buildAvoidInstructions(recents, uniqueness);
      workingBrief = { ...brief, avoidBlock };
      console.log(`[blog-gen] retrying with AVOID block (${avoidBlock.length} chars)`);
    }
  }

  const finalReasons = lastUniqueness?.reasons ?? lastReasons;
  throw new Error(`[blog-gen] all ${maxAttempts} AI attempts failed uniqueness gate (last score=${lastUniqueness?.score ?? 'n/a'}):\n  - ${finalReasons.join('\n  - ')}`);
}

// ───────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────
function sendJson(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

// Edge-safe base64 → UTF-8 (Buffer neprieinamas Edge runtime)
function b64decodeUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function handler(req: Request): Promise<Response> {
  // Auth: constant-time comparison via lib/auth.ts (accepts CRON_SECRET Bearer OR BLOG_TRIGGER_SECRET x-api-key)
  if (!process.env.CRON_SECRET && !process.env.BLOG_TRIGGER_SECRET) {
    console.error('[blog-gen] Neither CRON_SECRET nor BLOG_TRIGGER_SECRET env is set');
    return sendJson(500, { error: 'Server misconfiguration' });
  }
  if (!verifyBlogTriggerAuth(req)) {
    console.warn('[blog-gen] Unauthorized — invalid Bearer or x-api-key');
    return sendJson(401, { error: 'Unauthorized' });
  }
  console.log('[blog-gen] Authorized (constant-time auth ok)');

  let force = false;
  if (req.method === 'POST') {
    const text = await req.text();
    try { const b = JSON.parse(text); force = b.force === true; } catch { /* ignore */ }
  }

  const startedAt = Date.now();

  try {
    if (!force) {
      const hasPending = await pendingDraftExists();
      if (hasPending) {
        console.log('[blog-gen] pending draft branch exists — skipping');
        return sendJson(200, { skipped: true, reason: 'pending_draft_exists' });
      }
    }

    const next = await getNextTopic();
    if (!next) {
      console.log('[blog-gen] no pending topics');
      return sendJson(200, { skipped: true, reason: 'no_pending_topics' });
    }

    const { entry: topic, index } = next;
    const dateStr = new Date().toISOString().split('T')[0];
    const slug = slugify(topic.keyword);
    const branchName = `draft-blog-${slug}`;
    const filePath = `blog/${slug}.html`;

    console.log(`[blog-gen] generating: "${topic.keyword}" → ${filePath}`);

    // Category resolution
    const catKeyMap: Record<string, string> = {
      bdar: 'BDAR',
      nis2: 'NIS2',
      dpo: 'DPO',
      sauga: 'Kibernetinis saugumas',
      mokymai: 'Mokymai',
    };
    const catKey = topic.pillar ?? 'bdar';
    const category = catKeyMap[catKey] ?? 'BDAR';

    // Author resolution
    const author = resolveAuthor(topic.author_key, topic.pillar);

    // Content type resolution (explicit topics.json field > heuristic fallback)
    const contentType = resolveContentType(topic.content_type, topic.pillar, topic.post_type ?? 'cluster');
    console.log(`[blog-gen] content_type: ${contentType.key} (${contentType.label}) — intent: ${contentType.intent.slice(0, 60)}...`);

    // Fetch recent posts for uniqueness comparison (cached per process)
    const recents = await fetchRecentPosts(10);
    console.log(`[blog-gen] comparing against ${recents.length} recent posts`);

    // Expand keywords + build brief
    const kws = await expandKeywords(topic.keyword);
    const brief: BlogBrief = {
      primary: kws.primary,
      secondary: kws.secondary,
      longTail: kws.longTail,
      lsi: kws.lsi,
      category,
      author: author.name,
      authorRole: author.role,
      postType: topic.post_type ?? 'cluster',
      pillar: topic.pillar,
      contentType,
    };

    // Generate + validate + uniqueness gate (with retry).
    // ANY retry-loop exit (uniqueness fail OR structural fail) → mark topic blocked, prevent next-cron loop.
    let genResult;
    try {
      genResult = await generateWithRetry(brief, slug, recents, 2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryExhaust = msg.includes('all 2 AI attempts') || msg.includes('uniqueness gate') || msg.includes('failed structural validation');
      if (isRetryExhaust) {
        console.error(`[blog-gen] RETRY EXHAUSTED for "${topic.keyword}" — marking topics.status=blocked_duplication on main to prevent loop`);
        try {
          await markTopicBlocked(index, topic.keyword);
        } catch (markErr) {
          console.error(`[blog-gen] failed to mark blocked_duplication: ${markErr instanceof Error ? markErr.message : String(markErr)}`);
        }
      }
      throw err;
    }
    const { postData, uniqueness } = genResult;
    const heroImageUrl = await getImage(topic.keyword);

    // Inject computed fields (not from AI)
    const finalData: BlogPostData = {
      ...postData,
      post_slug: slug,
      post_date: dateStr,
      post_date_human: formatDateHuman(dateStr),
      post_author: author.name,
      post_author_role: author.role,
      post_author_initial: author.initial,
      post_hero_img: heroImageUrl,
      post_category: category,
      post_cat_key: catKey,
      kw_primary: kws.primary,
      kw_secondary: kws.secondary,
      kw_longtail: kws.longTail,
      kw_lsi: kws.lsi.join(', '),
      // Re-compute word count from final HTML (AI may underreport)
      post_word_count: countWords(postData.post_body_html ?? '') || postData.post_word_count,
    };

    // Final validation AFTER computed fields injected (post_date, post_author, post_hero_img)
    const finalErrors = validatePostData(finalData);
    if (finalErrors.length > 0) {
      throw new Error(`[blog-gen] finalData validation failed (post-inject):\n  - ${finalErrors.join('\n  - ')}`);
    }

    // Fetch template from main, render
    const templateHTML = await getFileFromBranch('main', 'blog/template.html');
    const fullHTML = renderTemplate(templateHTML, finalData);

    // Clean up stale branch if exists
    if (await branchExists(branchName)) {
      console.log(`[blog-gen] deleting stale branch: ${branchName}`);
      await deleteBranch(branchName);
    }

    // Create branch + commit post
    await createDraftBranch(branchName);
    await commitFileToBranch(branchName, filePath, fullHTML, `draft: ${topic.keyword}`);

    // Mark topic as 'draft' in topics.json
    const topicsData = await fetchTopics();
    topicsData.topics[index].status = 'draft';
    await commitFileToBranch(
      branchName,
      'topics.json',
      JSON.stringify(topicsData, null, 2),
      `chore: mark "${topic.keyword}" as draft`,
    );

    // Telegram notification (now includes content type + uniqueness report)
    const tgOk = await sendTelegramDraftNotification({
      keyword: topic.keyword,
      slug,
      branch: branchName,
      articleHTML: fullHTML,
      contentType: { key: contentType.key, label: contentType.label, intent: contentType.intent },
      uniqueness: {
        score: uniqueness.score,
        verdict: uniqueness.verdict,
        worstNeighborSlug: uniqueness.worstNeighborSlug,
        h2OverlapPct: uniqueness.h2OverlapPct,
        intentCollisionSlug: uniqueness.intentCollisionSlug,
      },
    });

    if (!tgOk) {
      console.error('[blog-gen] Telegram notification FAILED — check TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID');
    }

    const duration = Date.now() - startedAt;
    console.log(`[blog-gen] ✅ done — branch: ${branchName}, telegram: ${tgOk ? 'ok' : 'failed'}, duration: ${duration}ms`);
    return sendJson(200, {
      success: true,
      slug,
      branch: branchName,
      keyword: topic.keyword,
      content_type: contentType.key,
      uniqueness_score: uniqueness.score,
      uniqueness_verdict: uniqueness.verdict,
      word_count: finalData.post_word_count,
      telegram: tgOk,
      duration_ms: duration,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - startedAt;
    console.error(`[blog-gen] ❌ error after ${duration}ms:`, msg);
    return sendJson(500, { success: false, error: msg, duration_ms: duration });
  }
}

// Vercel Node runtime — Web-standard fetch export (palaiko Request/Response + maxDuration)
export default { fetch: handler };
