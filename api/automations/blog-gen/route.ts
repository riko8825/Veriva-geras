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

import type { IncomingMessage, ServerResponse } from 'http';
import { runPrompt } from '../../../lib/claude';
import { sendTelegramDraftNotification } from '../../../lib/telegram';
import { createDraftBranch, commitFileToBranch, deleteBranch, branchExists, getFileFromBranch } from '../../../lib/github';
import { getImage } from '../../../lib/pexels';
import { renderTemplate, validatePostData, type BlogPostData } from '../../../lib/blog-template';
import {
  BLOG_SYSTEM_PROMPT,
  KEYWORD_EXPAND_SYSTEM,
  buildBlogUserPrompt,
  buildKeywordExpandPrompt,
  type BlogBrief,
} from '../../../lib/blog-prompts';

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
  status: 'pending' | 'draft' | 'published' | 'skipped';
  post_type?: 'pillar' | 'cluster' | 'standalone';
  pillar?: string;
  author_key?: 'marina' | 'justinas' | 'veriva';
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
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8')) as TopicsData;
}

async function getNextTopic(): Promise<{ entry: TopicEntry; index: number } | null> {
  const data = await fetchTopics();
  const idx = data.topics.findIndex(t => t.status === 'pending');
  if (idx === -1) return null;
  return { entry: data.topics[idx], index: idx };
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
    maxTokens: 5000,
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

  // Required fields + numeric/format checks
  const baseErrors = validatePostData(data);
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

  // H2 count check
  const h2Count = (data.post_body_html ?? '').match(/<h2\s/gi)?.length ?? 0;
  const minH2 = postType === 'pillar' ? 8 : 5;
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
// Main generation with retry
// ───────────────────────────────────────────────────────────
async function generateWithRetry(brief: BlogBrief, maxAttempts = 2): Promise<BlogPostData> {
  let lastReasons: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[blog-gen] AI attempt ${attempt}/${maxAttempts}`);
    const partial = await generateBlogJSON(brief);

    const result = validatePost(partial, brief.postType);
    if (result.ok) {
      console.log(`[blog-gen] AI attempt ${attempt} ✅ validation passed`);
      return partial as BlogPostData;
    }

    lastReasons = result.reasons;
    console.warn(`[blog-gen] AI attempt ${attempt} ❌ validation failed:\n  - ${result.reasons.join('\n  - ')}`);
    if (attempt < maxAttempts) {
      console.log(`[blog-gen] retrying with same brief...`);
    }
  }

  throw new Error(`[blog-gen] all ${maxAttempts} AI attempts failed validation:\n  - ${lastReasons.join('\n  - ')}`);
}

// ───────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────
function sendJson(res: ServerResponse, status: number, data: unknown): void {
  if (res.headersSent) return;
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Auth: Vercel cron Bearer CRON_SECRET OR manual x-api-key BLOG_TRIGGER_SECRET
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const incomingKey = req.headers['x-api-key'];
    const triggerSecret = process.env.BLOG_TRIGGER_SECRET;
    if (!triggerSecret) {
      console.error('[blog-gen] BLOG_TRIGGER_SECRET env is not set');
      sendJson(res, 500, { error: 'Server misconfiguration' });
      return;
    }
    if (incomingKey !== triggerSecret) {
      console.warn('[blog-gen] Unauthorized — invalid x-api-key');
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
    console.log('[blog-gen] Authorized via x-api-key (manual)');
  } else {
    console.log('[blog-gen] Authorized via Vercel cron');
  }

  let force = false;
  if (req.method === 'POST') {
    const text = await readBody(req);
    try { const b = JSON.parse(text); force = b.force === true; } catch { /* ignore */ }
  }

  const startedAt = Date.now();

  try {
    if (!force) {
      const hasPending = await pendingDraftExists();
      if (hasPending) {
        console.log('[blog-gen] pending draft branch exists — skipping');
        sendJson(res, 200, { skipped: true, reason: 'pending_draft_exists' });
        return;
      }
    }

    const next = await getNextTopic();
    if (!next) {
      console.log('[blog-gen] no pending topics');
      sendJson(res, 200, { skipped: true, reason: 'no_pending_topics' });
      return;
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
    };

    // Generate + validate (with retry)
    const [postData, heroImageUrl] = await Promise.all([
      generateWithRetry(brief, 2),
      getImage(topic.keyword),
    ]);

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

    // Telegram notification
    const tgOk = await sendTelegramDraftNotification({
      keyword: topic.keyword,
      slug,
      branch: branchName,
      articleHTML: fullHTML,
    });

    if (!tgOk) {
      console.error('[blog-gen] Telegram notification FAILED — check TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID');
    }

    const duration = Date.now() - startedAt;
    console.log(`[blog-gen] ✅ done — branch: ${branchName}, telegram: ${tgOk ? 'ok' : 'failed'}, duration: ${duration}ms`);
    sendJson(res, 200, {
      success: true,
      slug,
      branch: branchName,
      keyword: topic.keyword,
      word_count: finalData.post_word_count,
      telegram: tgOk,
      duration_ms: duration,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - startedAt;
    console.error(`[blog-gen] ❌ error after ${duration}ms:`, msg);
    sendJson(res, 500, { success: false, error: msg, duration_ms: duration });
  }
}
