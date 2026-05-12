// lib/uniqueness.ts — anti-duplication scoring against recent posts
// Used by: blog-gen (validation gate after generateBlogJSON, before commit).
//
// Scoring strategy:
//   - H2/H3 overlap: token-set Jaccard similarity per recent post, max wins.
//   - Stat repetition: count exact stat-hl-num strings repeated across recents.
//   - Phrase repetition: count exact CTA heading reuse.
//   - Intent overlap: same content_type + same pillar slug → near-duplicate flag.
//
// Thresholds (tuned for retry-friendly behavior):
//   - PASS  if uniquenessScore ≥ 60 (i.e. <40% outline overlap with worst neighbor)
//   - WARN  if 60 > score ≥ 40 (allowed, surfaced in Telegram)
//   - FAIL  if score < 40 OR exact slug-intent collision

import type { RecentPostMeta } from './recent-posts';

export interface UniquenessReport {
  score: number; // 0-100, higher = more unique
  verdict: 'pass' | 'warn' | 'fail';
  worstNeighborSlug: string | null;
  h2OverlapPct: number;
  duplicatedStats: string[];
  duplicatedCtas: string[];
  intentCollisionSlug: string | null;
  reasons: string[];
}

export const UNIQUENESS_PASS_THRESHOLD = 60;
export const UNIQUENESS_WARN_THRESHOLD = 40;

// Stop-words skipped from H2 token comparison (LT + structural words)
const STOP_WORDS = new Set([
  'ir', 'arba', 'bet', 'kaip', 'kas', 'kur', 'kada', 'kodel', 'kodėl',
  'į', 'iš', 'už', 'su', 'ant', 'po', 'per', 'prie', 'be',
  'tai', 'tas', 'ta', 'tie', 'tos', 'jis', 'ji', 'jie',
  'vs', 'arba', 'gali', 'turi', 'yra', 'buti', 'būti',
  'lt', 'lietuvoje', 'lietuvos',
  'a', 'b', 'c', 'd', '1', '2', '3', '4', '5',
]);

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 3 && !STOP_WORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Compare new post H2 list against one recent post H2 list.
 * Returns max pairwise Jaccard (worst-case match) — high value = high overlap.
 */
function maxH2Similarity(newH2s: string[], recentH2s: string[]): number {
  if (newH2s.length === 0 || recentH2s.length === 0) return 0;
  const newTokens = newH2s.map(tokenize);
  const recentTokens = recentH2s.map(tokenize);

  let max = 0;
  for (const a of newTokens) {
    for (const b of recentTokens) {
      const sim = jaccard(a, b);
      if (sim > max) max = sim;
    }
  }
  return max;
}

/**
 * Average overlap across all H2 pairs — gives "outline duplication %".
 */
function avgH2OverlapPct(newH2s: string[], recentH2s: string[]): number {
  if (newH2s.length === 0 || recentH2s.length === 0) return 0;
  const newTokens = newH2s.map(tokenize);
  const recentTokens = recentH2s.map(tokenize);

  // For each new H2, find its best match among recent H2s. Average those.
  let sum = 0;
  for (const a of newTokens) {
    let best = 0;
    for (const b of recentTokens) {
      const sim = jaccard(a, b);
      if (sim > best) best = sim;
    }
    sum += best;
  }
  return Math.round((sum / newTokens.length) * 100);
}

export interface UniquenessInput {
  slug: string;
  contentType: string;
  pillar?: string;
  h2List: string[];
  h3List: string[];
  statHighlights: string[];
  ctaPhrases: string[];
}

export function scoreUniqueness(
  candidate: UniquenessInput,
  recents: RecentPostMeta[],
): UniquenessReport {
  if (recents.length === 0) {
    return {
      score: 100,
      verdict: 'pass',
      worstNeighborSlug: null,
      h2OverlapPct: 0,
      duplicatedStats: [],
      duplicatedCtas: [],
      intentCollisionSlug: null,
      reasons: ['no recent posts to compare'],
    };
  }

  // ── 1. H2/H3 overlap analysis ───────────────────────────
  let worstNeighbor: { slug: string; sim: number; overlap: number } = { slug: '', sim: 0, overlap: 0 };
  for (const r of recents) {
    if (r.slug === candidate.slug) continue; // ignore self (shouldn't happen, defensive)
    const combinedNew = [...candidate.h2List, ...candidate.h3List];
    const combinedRecent = [...r.h2List, ...r.h3List];
    const sim = maxH2Similarity(combinedNew, combinedRecent);
    const overlap = avgH2OverlapPct(candidate.h2List, r.h2List);
    if (sim > worstNeighbor.sim) {
      worstNeighbor = { slug: r.slug, sim, overlap };
    }
  }

  // ── 2. Stat repetition ──────────────────────────────────
  const allRecentStats = new Set<string>();
  for (const r of recents) for (const s of r.statHighlights) allRecentStats.add(s.toLowerCase());
  const duplicatedStats = candidate.statHighlights.filter(s => allRecentStats.has(s.toLowerCase()));

  // ── 3. CTA phrase repetition ────────────────────────────
  const allRecentCtas = new Set<string>();
  for (const r of recents) for (const c of r.ctaPhrases) allRecentCtas.add(c.toLowerCase().trim());
  const duplicatedCtas = candidate.ctaPhrases.filter(c => allRecentCtas.has(c.toLowerCase().trim()));

  // ── 4. Intent collision ────────────────────────────────
  // Two signals trigger collision flag:
  //   (a) same content_type meta tag + same slug stem (legacy, requires meta)
  //   (b) candidate slug starts with an existing slug (e.g. "bdar-baudos-2026" ⊃ "bdar-baudos-lietuvoje")
  //       OR shares ≥2 leading slug tokens AND ≥30% H2 overlap
  let intentCollisionSlug: string | null = null;
  const candStem3 = candidate.slug.split('-').slice(0, 3).join('-');
  const candStem2 = candidate.slug.split('-').slice(0, 2).join('-');
  for (const r of recents) {
    const rStem3 = r.slug.split('-').slice(0, 3).join('-');
    const rStem2 = r.slug.split('-').slice(0, 2).join('-');

    // (a) explicit content_type match + slug stem overlap
    if (r.contentType && r.contentType === candidate.contentType && candStem2 === rStem2) {
      intentCollisionSlug = r.slug;
      break;
    }

    // (b) strong slug stem overlap regardless of meta
    if (candStem3 === rStem3 && rStem3.length > 5) {
      intentCollisionSlug = r.slug;
      break;
    }
    if (candStem2 === rStem2 && rStem2.length > 5 && worstNeighbor.slug === r.slug && worstNeighbor.overlap >= 25) {
      intentCollisionSlug = r.slug;
      break;
    }
  }

  // ── 5. Composite score ─────────────────────────────────
  // Start at 100, deduct penalties.
  let score = 100;
  const reasons: string[] = [];

  // H2 overlap penalty: 0% overlap → 0 deduction; 100% overlap → 70 deduction (capped)
  const h2Penalty = Math.min(70, Math.round(worstNeighbor.overlap * 0.7));
  score -= h2Penalty;
  if (h2Penalty > 0) reasons.push(`H2 overlap ${worstNeighbor.overlap}% with ${worstNeighbor.slug} (-${h2Penalty})`);

  // Worst-pair similarity bonus penalty (catches single near-identical H2 pair)
  if (worstNeighbor.sim >= 0.7) {
    score -= 15;
    reasons.push(`Near-identical H2 pair vs ${worstNeighbor.slug} (jaccard ${worstNeighbor.sim.toFixed(2)}, -15)`);
  }

  // Stat repetition penalty: each duplicated stat = -5 (cap -20)
  const statPenalty = Math.min(20, duplicatedStats.length * 5);
  score -= statPenalty;
  if (statPenalty > 0) reasons.push(`${duplicatedStats.length} stat(s) reused across recents (-${statPenalty})`);

  // CTA repetition penalty: each duplicated CTA = -8 (cap -16)
  const ctaPenalty = Math.min(16, duplicatedCtas.length * 8);
  score -= ctaPenalty;
  if (ctaPenalty > 0) reasons.push(`${duplicatedCtas.length} CTA heading(s) reused (-${ctaPenalty})`);

  // Intent collision: hard penalty
  if (intentCollisionSlug) {
    score -= 30;
    reasons.push(`Intent collision: same content_type + slug stem as ${intentCollisionSlug} (-30)`);
  }

  if (score < 0) score = 0;

  let verdict: 'pass' | 'warn' | 'fail';
  if (intentCollisionSlug) verdict = 'fail';
  else if (score >= UNIQUENESS_PASS_THRESHOLD) verdict = 'pass';
  else if (score >= UNIQUENESS_WARN_THRESHOLD) verdict = 'warn';
  else verdict = 'fail';

  return {
    score,
    verdict,
    worstNeighborSlug: worstNeighbor.slug || null,
    h2OverlapPct: worstNeighbor.overlap,
    duplicatedStats,
    duplicatedCtas,
    intentCollisionSlug,
    reasons,
  };
}

/**
 * Build "AVOID" instruction block for retry prompt.
 * Lists recent H2s + duplicated stats so AI explicitly steers away.
 */
export function buildAvoidInstructions(recents: RecentPostMeta[], failedReport: UniquenessReport): string {
  if (recents.length === 0) return '';

  const recentH2s = recents.flatMap(r => r.h2List).slice(0, 30);
  const recentStats = [...new Set(recents.flatMap(r => r.statHighlights))].slice(0, 15);

  const lines = [
    '═══════════════════════════════════════════════════════',
    'AVOID — DUPLICATION FROM RECENT POSTS',
    '═══════════════════════════════════════════════════════',
    '',
    `Ankstesnis bandymas atmesta dėl: ${failedReport.reasons.join('; ')}`,
    '',
    'NEKURK H2 panašių į šiuos (perfrazavimas neužskaitomas — keisk angle):',
    ...recentH2s.map(h => `  ✗ ${h}`),
    '',
    'NENAUDOK šių stat-hl-num skaičių (panaudoti kituose Veriva straipsniuose):',
    ...recentStats.map(s => `  ✗ ${s}`),
    '',
  ];

  if (failedReport.duplicatedCtas.length > 0) {
    lines.push('NEPERRAŠYK šių CTA antraščių žodis-žodin:');
    failedReport.duplicatedCtas.forEach(c => lines.push(`  ✗ ${c}`));
    lines.push('');
  }

  lines.push('Pasirink kitokį intent angle, kitokią H2 struktūrą, kitokius skaičius.');

  return lines.join('\n');
}
