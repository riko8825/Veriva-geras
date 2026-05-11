// lib/link-constraints.ts — internal linking rules
// Adapt'inta Veriva template'ui — skip Veriva-specific block classes

export const MAX_OUTBOUND_PER_POST = 5;
export const MAX_INBOUND_SATURATION = 8;
export const MIN_KEYWORD_OFFSET_CHARS = 600;
export const REVERSE_TARGETS_COUNT = 3;

// HTML tags whose content should NEVER be linked (h1-h6, code, tables, nav, etc.)
const SKIP_TAG_RE = /<(h1|h2|h3|h4|h5|h6|a|code|pre|table|thead|tbody|tr|th|td|blockquote|nav|figure|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

// Veriva-specific block classes — never inject links inside these
const SKIP_BLOCK_CLASSES = [
  // Structural / navigation
  'toc', 'toc-list', 'toc-label',
  'ah-crumbs', 'ah-meta', 'ah-author',
  // Content blocks (CTAs, callouts, definitions, stats)
  'cta-inline', 'cta-block', 'cta-inline-btn',
  'callout',
  'definition',
  'stat-hl', 'stat-hl-body', 'stat-hl-label', 'stat-hl-num', 'stat-hl-sub',
  // FAQ section (already linked elsewhere)
  'faq-sec', 'faq-list', 'faq-grid', 'faq-item', 'faq-q', 'faq-a',
  // Internal links section (reverse-link target)
  'related', 'internal-links', 'article-links-section',
  // Footer/aside
  'article-footer', 'sidebar',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findSkipRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  const tagRe = new RegExp(SKIP_TAG_RE.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  for (const cls of SKIP_BLOCK_CLASSES) {
    const re = new RegExp(`<(div|section|aside|ul|ol|figure|nav|p)[^>]*class="[^"]*\\b${escapeRegex(cls)}\\b[^"]*"[^>]*>[\\s\\S]*?<\\/\\1>`, 'gi');
    let bm: RegExpExecArray | null;
    while ((bm = re.exec(html)) !== null) {
      ranges.push([bm.index, bm.index + bm[0].length]);
    }
  }

  return ranges.sort((a, b) => a[0] - b[0]);
}

export function isInsideSkipRange(pos: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (pos >= start && pos < end) return true;
    if (pos < start) return false;
  }
  return false;
}

// Veriva template uses plain <article> — find body start/end
export function findArticleBodyStart(html: string): number {
  const m = html.match(/<article\b[^>]*>/i);
  return m ? m.index! + m[0].length : -1;
}

export function findArticleBodyEnd(html: string): number {
  const start = findArticleBodyStart(html);
  if (start === -1) return -1;

  // Find matching </article> — simple search (article doesn't nest in Veriva template)
  const closeIdx = html.indexOf('</article>', start);
  return closeIdx === -1 ? html.length : closeIdx;
}

export interface KeywordCandidate {
  keyword: string;
  url: string;
  slug: string;
  weight: number;
}

export interface InjectedAnchor {
  keyword: string;
  url: string;
  slug: string;
  position: number;
}

export function rankCandidatesByLength(candidates: KeywordCandidate[]): KeywordCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.keyword.length !== a.keyword.length) return b.keyword.length - a.keyword.length;
    return b.weight - a.weight;
  });
}

// Word boundary regex — handles LT diacritics (ą, č, š, ž, ė, į, ų, ū)
export function buildKeywordRegex(keyword: string): RegExp {
  const escaped = escapeRegex(keyword);
  // \w in JS doesn't cover LT chars, so we use custom char class
  return new RegExp(`(?<![\\wąčęėįšųūžĄČĘĖĮŠŲŪŽ-])${escaped}(?![\\wąčęėįšųūžĄČĘĖĮŠŲŪŽ-])`, 'i');
}
