// scripts/test-uniqueness-edgecases.ts — DEBUG repro tests for uniqueness gate
// Targets bugs A/B/C/E from debugger audit. Does NOT modify lib/.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parsePostMeta } from '../lib/recent-posts.ts';
import { scoreUniqueness } from '../lib/uniqueness.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '..', 'blog');

async function loadPost(slug: string) {
  const html = await readFile(path.join(blogDir, `${slug}.html`), 'utf-8');
  return parsePostMeta(slug, html);
}

function header(s: string) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(' ' + s);
  console.log('══════════════════════════════════════════════════════════');
}

function dump(label: string, r: any) {
  console.log(`[${label}] score=${r.score} verdict=${r.verdict} h2overlap=${r.h2OverlapPct}% worst=${r.worstNeighborSlug} intent=${r.intentCollisionSlug ?? 'none'}`);
  if (r.reasons.length) console.log('  reasons:\n    - ' + r.reasons.join('\n    - '));
}

async function main() {
  const bdar = await loadPost('bdar-baudos-lietuvoje');
  const nis2 = await loadPost('nis2-direktyva-lietuvoje');
  const phishing = await loadPost('phishing-mokymai-darbuotojams');
  const recents = [bdar, nis2, phishing];

  // ── BUG A.1: H2 cap math when overlap=100 ──────────────
  // Penalties: H2(70) + nearpair(15) + stat(20) + cta(16) + intent(30) = 151
  // Score 100 - 151 = -51, then floor to 0. Clamp works. But if intent NOT collision,
  // verdict = fail (score < 40). Test: collision-free clone to confirm score floors at 0.
  header('BUG A.1: max penalty stack — score must clamp at 0 (not negative)');
  const maxPenalty = scoreUniqueness({
    slug: 'visiskai-nesusijes-slug-zodis-be-bdar', // no slug stem collision
    contentType: 'unrelated_xyz',
    pillar: 'unknown',
    h2List: bdar.h2List,
    h3List: bdar.h3List,
    statHighlights: bdar.statHighlights,
    ctaPhrases: bdar.ctaPhrases,
  }, recents);
  dump('A.1', maxPenalty);
  console.log(`  → score >= 0 ? ${maxPenalty.score >= 0 ? 'PASS' : 'FAIL clamp broken'}`);

  // ── BUG A.2: double-counting same neighbor (h2 + nearpair) ─
  // H2 penalty (-70 max) + nearpair (-15) both target SAME worst neighbor.
  // Confirmed in code lines 184-192 — that's by design, but worth documenting.
  header('BUG A.2: H2 overlap + near-pair both apply to SAME neighbor');
  console.log('  By inspection: lines 184-192 deduct both penalties using worstNeighbor.');
  console.log('  This is double-counting if author intent was "either/or".');
  console.log(`  Above test A.1: H2 reason + near-pair reason should both reference same neighbor.`);
  const sameNeighbor = maxPenalty.reasons.filter(r => r.includes(maxPenalty.worstNeighborSlug ?? '')).length;
  console.log(`  Reasons mentioning "${maxPenalty.worstNeighborSlug}": ${sameNeighbor} (expect 2 = double-count confirmed)`);

  // ── BUG A.3: LT diakritikų / case-sensitive stat compare ──
  // recent stat "€20M" vs candidate "€20m" — should be detected as duplicate (lowercase OK)
  // BUT what about €20 mln. vs €20M — no normalization, those would NOT match.
  header('BUG A.3: stat normalization');
  const statCase = scoreUniqueness({
    slug: 'foobar-different-topic',
    contentType: 'roi',
    pillar: 'sauga',
    h2List: ['Tema A', 'Tema B', 'Tema C'],
    h3List: [],
    statHighlights: bdar.statHighlights.map(s => s.toUpperCase()), // CASE SHIFT
    ctaPhrases: ['Pilnai unikalus CTA'],
  }, recents);
  console.log(`  candidate stats (uppercased): ${bdar.statHighlights.slice(0, 3).map(s => s.toUpperCase()).join(', ')}`);
  console.log(`  duplicatedStats detected: ${statCase.duplicatedStats.length} / ${bdar.statHighlights.length}`);
  console.log(`  → case-insensitive compare ${statCase.duplicatedStats.length === bdar.statHighlights.length ? 'WORKS' : 'BROKEN'}`);
  console.log('  Note: NO unicode/whitespace/punctuation normalization. "€20 mln." ≠ "€20M".');

  // ── BUG B: warn verdict on attempt 1 retries — but if attempt 2 = worse score? ─
  // Code path: attempt 1 = warn → retry. attempt 2 = warn → accept (line 412).
  // What if attempt 2 = FAIL (score 35)? Look at logic:
  //   line 407: pass → return
  //   line 412: warn && attempt==max → return
  //   line 417-421: log + retry (FAIL on attempt 1, FAIL on attempt 2 → falls through to throw)
  // BUT: attempt=2, verdict=fail → line 412 condition false (verdict != warn) → 417 logs → 418 attempt < max FALSE → loop ends → line 426 throw.
  // OK that's correct. BUT: attempt 1 = warn (returns retry block) → attempt 2 = warn (line 412 hit) → accept.
  // The bug: attempt 1 = pass might NEVER happen, but warn-warn ACCEPTS without checking if score got WORSE.
  header('BUG B: warn-on-last-attempt accepts even if score regressed');
  console.log('  By inspection (route.ts line 412): if attempt==max && verdict==warn, accept regardless of score delta.');
  console.log('  Scenario: attempt 1 score=58 (warn), retry, attempt 2 score=42 (warn) → ACCEPTED with WORSE score.');
  console.log('  No comparison "if (attempt2.score < attempt1.score) reject".');

  // ── BUG E: slug stem collision — short slug (1-2 dashes) matches itself or super-set ──
  // candidate slug = "bdar" (no dashes). slice(0,3).join('-') = "bdar". length=4, NOT > 5 → skip.
  // candidate slug = "bdar-baudos" (1 dash). slice(0,3) = ["bdar","baudos"], join = "bdar-baudos". length=11 > 5.
  // recent slug = "bdar-baudos-lietuvoje" (2 dashes). slice(0,3) = ["bdar","baudos","lietuvoje"]. rStem3 = "bdar-baudos-lietuvoje".
  // candStem3 ("bdar-baudos") !== rStem3 ("bdar-baudos-lietuvoje") → no collision via stem3.
  // candStem2 = "bdar-baudos", rStem2 = "bdar-baudos" → MATCH → check overlap >= 25.
  header('BUG E: short candidate slug "bdar-baudos" vs recent "bdar-baudos-lietuvoje"');
  const shortSlug = scoreUniqueness({
    slug: 'bdar-baudos',
    contentType: 'guide',
    pillar: 'bdar',
    h2List: ['Visai kitokia tema 1', 'Visai kitokia 2', 'Naujas angle 3'],
    h3List: [],
    statHighlights: ['€999M unique'],
    ctaPhrases: ['Visai unikalus CTA'],
  }, recents);
  dump('E.1', shortSlug);
  console.log('  Expectation: stem2 match "bdar-baudos" should trigger via path (b) only if overlap >= 25%.');
  console.log(`  H2 overlap = ${shortSlug.h2OverlapPct}% → collision ${shortSlug.h2OverlapPct >= 25 ? 'should fire' : 'should NOT fire'}`);

  // candidate slug == recent slug exactly — defensive `if (r.slug === candidate.slug) continue;`
  // skips H2 comparison BUT NOT intent collision loop (line 157 separate loop).
  // So self-comparison in intent loop CAN trigger collision against self.
  header('BUG E.2: candidate slug === recent slug (re-publish scenario)');
  const selfClone = scoreUniqueness({
    slug: 'bdar-baudos-lietuvoje', // EXACT match to recent
    contentType: 'guide',
    pillar: 'bdar',
    h2List: ['Visai naujas H2'],
    h3List: [],
    statHighlights: [],
    ctaPhrases: [],
  }, recents);
  dump('E.2', selfClone);
  console.log(`  → intent collision against SELF? ${selfClone.intentCollisionSlug === 'bdar-baudos-lietuvoje' ? 'YES (BUG)' : 'NO (OK)'}`);
  console.log(`  → worstNeighbor skipped self in H2 loop (line 129) — but intent loop (line 157) does NOT skip self.`);

  // candidate slug EXACT match against existing — content_type also matches → path (a) fires.
  header('BUG E.3: regenerate same slug w/ same content_type triggers collision against SELF');
  const sameSelf = scoreUniqueness({
    slug: 'bdar-baudos-lietuvoje',
    contentType: 'case_study', // assume original was case_study (would fire path a)
    pillar: 'bdar',
    h2List: ['Tema'],
    h3List: [],
    statHighlights: [],
    ctaPhrases: [],
  }, recents);
  dump('E.3', sameSelf);
  console.log('  Note: parsed recents have contentType=undefined (no veriva:content_type meta yet).');
  console.log('  So path (a) does NOT fire — only path (b) stem3 == self → likely fires.');

  // ── BUG F: race condition — module-level cache ────────────
  // Cannot reproduce in test (single process). Documenting only.
  header('BUG F: module-level cache — race condition theoretical');
  console.log('  By inspection: `let cache: CacheEntry | null = null` is module scope.');
  console.log('  Vercel Edge Function reuses isolate across warm invocations → shared cache.');
  console.log('  Two parallel cron triggers in DIFFERENT cold isolates → DIFFERENT cache.');
  console.log('  Risk: post published in cron-A is invisible to cron-B for 5 min.');
  console.log('  Combined w/ Bug D (no clearRecentPostsCache call) → uniqueness gate uses STALE recents.');

  // ── BUG C: alphabetical slice(-limit) ────────────────────
  header('BUG C: chronological vs alphabetical ordering');
  const sorted = [...['aaa-newest-2026', 'bbb-old', 'mmm-medium', 'zzz-ancient']].sort();
  const last3 = sorted.slice(-3);
  console.log(`  alpha sort: ${sorted.join(', ')}`);
  console.log(`  slice(-3): ${last3.join(', ')} → drops "aaa-newest-2026" even though it might be NEWEST`);
  console.log('  After 15+ posts published, slug like "ai-saugumas-2027" (alphabetically early)');
  console.log('  would be MISSING from recents → false-pass uniqueness vs that post.');

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(' DEBUG SCAN COMPLETE — see findings above');
  console.log('══════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(2);
});
