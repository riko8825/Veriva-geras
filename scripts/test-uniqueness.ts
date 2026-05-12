// scripts/test-uniqueness.mjs — smoke test for uniqueness scoring
// Compiles lib/ via tsx, parses 3 real Veriva blog posts, runs scoreUniqueness against
// (a) a clone of bdar-baudos as candidate → should FAIL (near-100% overlap)
// (b) a fresh ROI-type DPO outline → should PASS (score ≥60)
// (c) a near-clone with same content_type + slug stem → should FAIL via intent collision

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parsePostMeta } from '../lib/recent-posts.ts';
import { scoreUniqueness } from '../lib/uniqueness.ts';
import { CONTENT_TYPE_MATRIX, resolveContentType, renderContentTypeInstructions } from '../lib/content-types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '..', 'blog');

async function loadPost(slug) {
  const html = await readFile(path.join(blogDir, `${slug}.html`), 'utf-8');
  return parsePostMeta(slug, html);
}

function header(s) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(' ' + s);
  console.log('══════════════════════════════════════════════════════════');
}

function summarize(report, expected) {
  console.log(`  score: ${report.score}/100`);
  console.log(`  verdict: ${report.verdict} (expected ${expected})`);
  console.log(`  h2OverlapPct: ${report.h2OverlapPct}%`);
  console.log(`  worstNeighbor: ${report.worstNeighborSlug ?? '(none)'}`);
  console.log(`  duplicatedStats: ${report.duplicatedStats.length}`);
  console.log(`  duplicatedCtas: ${report.duplicatedCtas.length}`);
  console.log(`  intentCollision: ${report.intentCollisionSlug ?? '(none)'}`);
  if (report.reasons.length) console.log(`  reasons:\n    - ${report.reasons.join('\n    - ')}`);
  const ok = report.verdict === expected;
  console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}`);
  return ok;
}

async function main() {
  // Load 3 published Veriva posts as "recents"
  const bdar = await loadPost('bdar-baudos-lietuvoje');
  const nis2 = await loadPost('nis2-direktyva-lietuvoje');
  const phishing = await loadPost('phishing-mokymai-darbuotojams');
  const recents = [bdar, nis2, phishing];

  console.log(`\nLoaded ${recents.length} recent posts:`);
  for (const r of recents) {
    console.log(`  - ${r.slug}: ${r.h2List.length} H2, ${r.statHighlights.length} stats, ${r.ctaPhrases.length} CTAs`);
  }

  let passCount = 0;
  let totalTests = 0;

  // ── Test 1: exact clone of bdar-baudos → should FAIL ──
  header('TEST 1: exact clone of bdar-baudos-lietuvoje as new "bdar-baudos-2026"');
  totalTests++;
  const clone1 = scoreUniqueness({
    slug: 'bdar-baudos-2026',
    contentType: 'case_study',
    pillar: 'bdar',
    h2List: bdar.h2List,
    h3List: bdar.h3List,
    statHighlights: bdar.statHighlights,
    ctaPhrases: bdar.ctaPhrases,
  }, recents);
  if (summarize(clone1, 'fail')) passCount++;

  // ── Test 2: completely fresh DPO ROI post → should PASS ──
  header('TEST 2: fresh DPO ROI outline (no overlap)');
  totalTests++;
  const fresh = scoreUniqueness({
    slug: 'dpo-outsourcing-kainos-lietuvoje',
    contentType: 'roi',
    pillar: 'dpo',
    h2List: [
      'Kiek kainuoja DPO šiandien (status quo)',
      'Tikroji rizikos kaina: 3 LT scenarijai su skaičiais',
      'Investicijos struktūra: ką tiksliai mokate €450/mėn',
      'Atsipirkimo laikotarpis: 3 įmonių pavyzdžiai per 18 mėn',
      'Hidden costs: ko nematote sąmatoje',
      'Kada DPO outsourcing NEATSIPIRKS jūsų atveju',
    ],
    h3List: ['ROI formulė', 'Mėnesinis breakdown', 'Sutartis 12 vs 24 mėn'],
    statHighlights: ['€450', '18 mėn', '€2,38M'],
    ctaPhrases: ['Gaukite 7 dienų DPO sąmatą — be įsipareigojimų'],
  }, recents);
  if (summarize(fresh, 'pass')) passCount++;

  // ── Test 3: near-clone same content_type + same slug stem → FAIL via intent collision ──
  header('TEST 3: near-clone, same content_type=case_study, slug stem "bdar-baudos"');
  totalTests++;
  const collision = scoreUniqueness({
    slug: 'bdar-baudos-2026-naujausios',
    contentType: 'case_study',
    pillar: 'bdar',
    h2List: ['Naujos BDAR baudos 2026', 'VDAI veikla 2026', 'Kaip išvengti baudų 2026'],
    h3List: [],
    statHighlights: ['€500K'],
    ctaPhrases: ['Susisiekite'],
  }, recents);
  if (summarize(collision, 'fail')) passCount++;

  // ── Test 4: partial overlap → expect no false collision, verdict pass/warn ──
  header('TEST 4: partial overlap (some shared H2 themes, no slug collision)');
  totalTests++;
  const partial = scoreUniqueness({
    slug: 'bdar-smulkiam-verslui',
    contentType: 'industry',
    pillar: 'bdar',
    h2List: [
      bdar.h2List[0] ?? 'Apžvalga',
      bdar.h2List[1] ?? 'Reglamentas',
      'Smulkaus verslo specifika BDAR atitikčiai',
      'Tipiniai mažų LT įmonių pažeidimai',
      'Checklist: 8 punktai smulkiam verslui',
    ],
    h3List: [],
    statHighlights: ['€500', '15 darbuotojų'],
    ctaPhrases: ['Smulkaus verslo paketas — €290/mėn'],
  }, recents);
  console.log(`  score: ${partial.score}/100, verdict: ${partial.verdict}, intentCollision: ${partial.intentCollisionSlug ?? '(none)'}`);
  const t4ok = partial.intentCollisionSlug === null && (partial.verdict === 'pass' || partial.verdict === 'warn');
  if (t4ok) { console.log('  ✅ no false collision, verdict acceptable'); passCount++; }
  else { console.log('  ❌ unexpected'); }

  // ── Test 5: content-type matrix sanity ──
  header('TEST 5: CONTENT_TYPE_MATRIX has 8 types with unique skeletons');
  totalTests++;
  const types = Object.keys(CONTENT_TYPE_MATRIX);
  console.log(`  types: ${types.join(', ')}`);
  const allUnique = types.length === 8 && new Set(types).size === 8;
  const allSkeletonsUnique = new Set(
    Object.values(CONTENT_TYPE_MATRIX).map(s => s.h2Skeleton.join('|'))
  ).size === 8;
  if (allUnique && allSkeletonsUnique) {
    console.log('  ✅ 8 types, all skeletons unique');
    passCount++;
  } else {
    console.log(`  ❌ count=${types.length}, allSkeletonsUnique=${allSkeletonsUnique}`);
  }

  // ── Test 6: resolveContentType priority ──
  header('TEST 6: resolveContentType — explicit > heuristic');
  totalTests++;
  const r1 = resolveContentType('roi', 'bdar', 'cluster');
  const r2 = resolveContentType(undefined, 'bdar', 'pillar');
  const r3 = resolveContentType('invalid_key', 'sauga', 'cluster');
  const ok = r1.key === 'roi' && r2.key === 'technical_deep_dive' && r3.key === 'workflow';
  console.log(`  explicit "roi" → ${r1.key} (expect roi)`);
  console.log(`  fallback bdar+pillar → ${r2.key} (expect technical_deep_dive)`);
  console.log(`  invalid+sauga+cluster → ${r3.key} (expect workflow)`);
  if (ok) { console.log('  ✅'); passCount++; } else { console.log('  ❌'); }

  // ── Test 7: type instructions render properly ──
  header('TEST 7: renderContentTypeInstructions output sanity');
  totalTests++;
  const rendered = renderContentTypeInstructions(CONTENT_TYPE_MATRIX.roi);
  const hasIntent = rendered.includes('INTENT:');
  const hasSkeleton = rendered.includes('H2 SKELETON');
  const hasBanned = rendered.includes('DRAUDŽIAMOS SEKCIJOS');
  const hasRequired = rendered.includes('PRIVALOMI ELEMENTAI');
  if (hasIntent && hasSkeleton && hasBanned && hasRequired) {
    console.log(`  ✅ instructions render (${rendered.length} chars, all 4 sections present)`);
    passCount++;
  } else {
    console.log(`  ❌ missing sections: intent=${hasIntent} skeleton=${hasSkeleton} banned=${hasBanned} required=${hasRequired}`);
  }

  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(` SUMMARY: ${passCount}/${totalTests} tests passed`);
  console.log(`══════════════════════════════════════════════════════════`);
  process.exit(passCount === totalTests ? 0 : 1);
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(2);
});
