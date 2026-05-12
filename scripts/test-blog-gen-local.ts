// scripts/test-blog-gen-local.ts — local dry-run of blog-gen pipeline
// Calls REAL OpenAI gpt-4.1 with new content-type prompts.
// Skips GitHub/Pexels/Telegram — uses local blog/*.html as "recents".
//
// Usage: npx tsx scripts/test-blog-gen-local.ts
// Requires: .env.local with OPENAI_API_KEY

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from 'dotenv';

import { runPrompt } from '../lib/claude';
import {
  BLOG_SYSTEM_PROMPT,
  KEYWORD_EXPAND_SYSTEM,
  buildBlogUserPrompt,
  buildKeywordExpandPrompt,
  type BlogBrief,
} from '../lib/blog-prompts';
import { resolveContentType } from '../lib/content-types';
import { parsePostMeta, type RecentPostMeta } from '../lib/recent-posts';
import { scoreUniqueness } from '../lib/uniqueness';
import { validatePostData, type BlogPostData } from '../lib/blog-template';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not loaded — check .env.local');
  process.exit(1);
}

const blogDir = path.join(__dirname, '..', 'blog');
const outDir = path.join(__dirname, '..', '.dry-run');

interface TestCase {
  keyword: string;
  pillar: string;
  postType: 'cluster' | 'pillar';
  contentTypeKey: string;
  author: { name: string; role: string };
}

const TEST_CASES: TestCase[] = [
  {
    keyword: 'DPO outsourcing kainos Lietuvoje',
    pillar: 'dpo',
    postType: 'cluster',
    contentTypeKey: 'roi',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
  {
    keyword: 'NIS2 incidentų pranešimas 24 valandos',
    pillar: 'nis2',
    postType: 'cluster',
    contentTypeKey: 'roadmap',
    author: { name: 'Justinas', role: 'IT saugumo ekspertas' },
  },
  {
    keyword: 'GDPR vs BDAR: skirtumai LT',
    pillar: 'bdar',
    postType: 'cluster',
    contentTypeKey: 'comparison',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
  {
    keyword: 'BDAR smulkiam verslui',
    pillar: 'bdar',
    postType: 'cluster',
    contentTypeKey: 'industry',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
  {
    keyword: 'cookie banner sutikimas BDAR',
    pillar: 'bdar',
    postType: 'cluster',
    contentTypeKey: 'workflow',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
  {
    keyword: 'duomenų pažeidimas 72 valandos',
    pillar: 'bdar',
    postType: 'cluster',
    contentTypeKey: 'case_study',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
  {
    keyword: 'VDAI patikrinimas: kaip pasiruošti',
    pillar: 'bdar',
    postType: 'cluster',
    contentTypeKey: 'mistakes',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
  {
    keyword: 'BDAR sutikimo formos reikalavimai',
    pillar: 'bdar',
    postType: 'cluster',
    contentTypeKey: 'technical_deep_dive',
    author: { name: 'Marina', role: 'Teisės ekspertė, BDAR' },
  },
];

async function loadRecents(): Promise<RecentPostMeta[]> {
  const slugs = ['bdar-baudos-lietuvoje', 'nis2-direktyva-lietuvoje', 'phishing-mokymai-darbuotojams'];
  const out: RecentPostMeta[] = [];
  for (const s of slugs) {
    const html = await readFile(path.join(blogDir, `${s}.html`), 'utf-8');
    out.push(parsePostMeta(s, html));
  }
  return out;
}

interface ExpandedKeywords {
  primary: string;
  secondary: string;
  longTail: string;
  lsi: string[];
}

async function expandKeywords(seed: string): Promise<ExpandedKeywords> {
  const raw = await runPrompt({
    system: KEYWORD_EXPAND_SYSTEM,
    user: buildKeywordExpandPrompt(seed),
    maxTokens: 500,
  });
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error(`expandKeywords parse fail: ${cleaned.slice(0, 200)}`);
  }
}

async function generatePost(brief: BlogBrief, slugForDebug: string): Promise<Partial<BlogPostData>> {
  const raw = await runPrompt({
    system: BLOG_SYSTEM_PROMPT,
    user: buildBlogUserPrompt(brief),
    maxTokens: 8000, // upped from prod 5000 for dry-run capacity test
  });

  // ALWAYS save raw FIRST — so even on parse fail we can inspect what AI returned
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, `${slugForDebug}-RAW.txt`), raw);
  console.log(`  📝 raw output: ${raw.length} chars saved → ${slugForDebug}-RAW.txt`);

  let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(cleaned); } catch (e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch {}
    }
    throw new Error(`generatePost JSON parse fail (${(e as Error).message}). Raw saved to ${slugForDebug}-RAW.txt — first 500 chars: ${cleaned.slice(0, 500)}`);
  }
}

function header(s: string) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(' ' + s);
  console.log('══════════════════════════════════════════════════════════');
}

function summarizeCase(tc: TestCase, post: Partial<BlogPostData>, uniqReport: ReturnType<typeof scoreUniqueness>) {
  const h2List = (post.post_body_html ?? '').match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) ?? [];
  console.log(`\n  📋 GENERATED:`);
  console.log(`    title: ${post.post_title}`);
  console.log(`    slug:  ${post.post_slug}`);
  console.log(`    word_count: ${post.post_word_count}`);
  console.log(`    H2 count: ${h2List.length}`);
  console.log(`\n  📊 H2 STRUCTURE (top 5):`);
  h2List.slice(0, 5).forEach((h, i) => {
    const text = h.replace(/<[^>]+>/g, '').trim();
    console.log(`    ${i + 1}. ${text}`);
  });
  console.log(`\n  🎯 UNIQUENESS:`);
  console.log(`    score:    ${uniqReport.score}/100 (${uniqReport.verdict})`);
  console.log(`    H2 overlap: ${uniqReport.h2OverlapPct}% vs ${uniqReport.worstNeighborSlug ?? 'n/a'}`);
  console.log(`    intent collision: ${uniqReport.intentCollisionSlug ?? 'none'}`);
  if (uniqReport.reasons.length) {
    console.log(`    reasons:`);
    uniqReport.reasons.forEach(r => console.log(`      - ${r}`));
  }
}

async function runCase(tc: TestCase, recents: RecentPostMeta[]) {
  header(`CASE: ${tc.keyword} → ${tc.contentTypeKey}`);

  const contentType = resolveContentType(tc.contentTypeKey, tc.pillar, tc.postType);
  console.log(`  resolved content_type: ${contentType.key} (${contentType.label})`);
  console.log(`  intent: ${contentType.intent}`);

  console.log(`\n  ⏳ expanding keywords...`);
  const t0 = Date.now();
  const kws = await expandKeywords(tc.keyword);
  console.log(`  ✓ ${Date.now() - t0}ms — primary="${kws.primary}", longTail="${kws.longTail}"`);

  const brief: BlogBrief = {
    primary: kws.primary,
    secondary: kws.secondary,
    longTail: kws.longTail,
    lsi: kws.lsi,
    category: tc.pillar.toUpperCase(),
    author: tc.author.name,
    authorRole: tc.author.role,
    postType: tc.postType,
    pillar: tc.pillar,
    contentType,
  };

  const slugForDebug = `${tc.contentTypeKey}-${tc.pillar}`;

  // Save prompt FIRST (independent of generation success)
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, `${slugForDebug}-prompt.txt`),
    `SYSTEM:\n${BLOG_SYSTEM_PROMPT}\n\n═══ USER ═══\n${buildBlogUserPrompt(brief)}`,
  );

  console.log(`\n  ⏳ generating blog post (gpt-4.1, ~30-60s)...`);
  const t1 = Date.now();
  const post = await generatePost(brief, slugForDebug);
  console.log(`  ✓ ${Date.now() - t1}ms`);

  await writeFile(
    path.join(outDir, `${slugForDebug}-output.json`),
    JSON.stringify(post, null, 2),
  );

  // Structural validation (basics — full validatePost is in route.ts)
  const baseErrors = validatePostData(post);
  console.log(`\n  🔍 STRUCTURAL VALIDATION: ${baseErrors.length === 0 ? '✅ pass' : `❌ ${baseErrors.length} issue(s)`}`);
  if (baseErrors.length) baseErrors.forEach(e => console.log(`    - ${e}`));

  // Uniqueness check
  const candidateMeta = parsePostMeta(
    post.post_slug ?? 'dry-run-slug',
    `${post.post_body_html ?? ''}\n${post.post_faq_html ?? ''}`,
  );
  const uniqReport = scoreUniqueness({
    slug: post.post_slug ?? 'dry-run-slug',
    contentType: contentType.key,
    pillar: tc.pillar,
    h2List: candidateMeta.h2List,
    h3List: candidateMeta.h3List,
    statHighlights: candidateMeta.statHighlights,
    ctaPhrases: candidateMeta.ctaPhrases,
  }, recents);

  summarizeCase(tc, post, uniqReport);

  return {
    keyword: tc.keyword,
    contentType: contentType.key,
    structuralPass: baseErrors.length === 0,
    structuralErrors: baseErrors,
    uniquenessScore: uniqReport.score,
    uniquenessVerdict: uniqReport.verdict,
    h2Count: (post.post_body_html ?? '').match(/<h2/gi)?.length ?? 0,
    bannedSectionsHit: contentType.bannedSections.filter(b =>
      (post.post_body_html ?? '').toLowerCase().includes(b.toLowerCase()),
    ),
  };
}

async function main() {
  console.log('🧪 Veriva blog-gen LOCAL DRY-RUN');
  console.log(`   Test cases: ${TEST_CASES.length}`);
  console.log(`   Recents source: ${blogDir} (3 published posts)`);
  console.log(`   Output dir: ${outDir}`);

  const recents = await loadRecents();
  console.log(`   Loaded ${recents.length} recents for uniqueness comparison`);

  const results = [];
  for (const tc of TEST_CASES) {
    try {
      const r = await runCase(tc, recents);
      results.push({ ...r, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n  ❌ CASE FAILED: ${msg}`);
      results.push({ keyword: tc.keyword, contentType: tc.contentTypeKey, error: msg } as any);
    }
  }

  header('FINAL SUMMARY');
  console.table(results.map(r => ({
    keyword: r.keyword.slice(0, 35),
    type: r.contentType,
    'struct OK': r.error ? 'CRASH' : (r.structuralPass ? 'yes' : 'no'),
    'uniq score': r.error ? 'CRASH' : r.uniquenessScore,
    'verdict': r.error ? '—' : r.uniquenessVerdict,
    H2: r.h2Count ?? '—',
    banned: r.bannedSectionsHit?.length ?? '—',
  })));

  console.log(`\n📁 Full outputs: ${outDir}/`);
  const failures = results.filter(r => r.error || !r.structuralPass || r.uniquenessVerdict === 'fail').length;
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(2);
});
