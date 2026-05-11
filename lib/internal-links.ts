// lib/internal-links.ts — forward + reverse internal link injection
// Adapt'inta Veriva template'ui (plain <article>, klasės: cta-inline, callout, definition, stat-hl, faq-*)

import {
  MAX_OUTBOUND_PER_POST,
  MAX_INBOUND_SATURATION,
  MIN_KEYWORD_OFFSET_CHARS,
  REVERSE_TARGETS_COUNT,
  findSkipRanges,
  isInsideSkipRange,
  findArticleBodyStart,
  findArticleBodyEnd,
  rankCandidatesByLength,
  buildKeywordRegex,
} from './link-constraints';
import type { LinkTarget } from './link-map';

export interface InjectedLink {
  keyword: string;
  url: string;
  slug: string;
  anchorText: string;
}

export interface InjectResult {
  html: string;
  injected: InjectedLink[];
  skipped: Array<{ keyword: string; reason: string }>;
}

export function injectForwardLinks(
  postHTML: string,
  candidates: LinkTarget[],
  currentSlug: string
): InjectResult {
  const skipped: Array<{ keyword: string; reason: string }> = [];
  const injected: InjectedLink[] = [];

  const bodyStart = findArticleBodyStart(postHTML);
  const bodyEnd = findArticleBodyEnd(postHTML);
  if (bodyStart === -1 || bodyEnd === -1) {
    return { html: postHTML, injected: [], skipped: [{ keyword: '*', reason: 'article_body_not_found' }] };
  }

  const eligible = candidates
    .filter(c => c.slug !== currentSlug)
    .filter(c => c.outboundCount < MAX_INBOUND_SATURATION);

  const ranked = rankCandidatesByLength(eligible);

  let html = postHTML;
  const usedUrls = new Set<string>();
  const usedKeywords = new Set<string>();

  for (const target of ranked) {
    if (injected.length >= MAX_OUTBOUND_PER_POST) break;
    if (usedUrls.has(target.url)) continue;
    if (usedKeywords.has(target.keyword)) continue;

    const skipRanges = findSkipRanges(html);
    const re = buildKeywordRegex(target.keyword);

    const offsetBody = findArticleBodyStart(html);
    const endBody = findArticleBodyEnd(html);
    if (offsetBody === -1 || endBody === -1) break;

    const minPos = offsetBody + MIN_KEYWORD_OFFSET_CHARS;
    const searchFrom = Math.min(minPos, endBody);
    const slice = html.slice(searchFrom, endBody);
    const m = slice.match(re);

    if (!m || m.index === undefined) {
      skipped.push({ keyword: target.keyword, reason: 'no_match' });
      continue;
    }

    const absolutePos = searchFrom + m.index;

    if (isInsideSkipRange(absolutePos, skipRanges)) {
      skipped.push({ keyword: target.keyword, reason: 'inside_skip_range' });
      continue;
    }

    const matchedText = m[0];
    const anchor = `<a href="${target.url}">${matchedText}</a>`;
    html = html.slice(0, absolutePos) + anchor + html.slice(absolutePos + matchedText.length);

    injected.push({
      keyword: target.keyword,
      url: target.url,
      slug: target.slug,
      anchorText: matchedText,
    });
    usedUrls.add(target.url);
    usedKeywords.add(target.keyword);
  }

  return { html, injected, skipped };
}

export interface ReverseTarget {
  slug: string;
  url: string;
  matchedKeyword: string;
}

export function pickReverseTargets(
  newPostKeyword: string,
  newPostH1: string,
  candidates: LinkTarget[],
  currentSlug: string
): ReverseTarget[] {
  const newKw = newPostKeyword.toLowerCase();
  const h1Tokens = new Set(
    newPostH1.toLowerCase().split(/\s+/).filter(t => t.length > 3)
  );

  const scored = candidates
    .filter(c => c.slug !== currentSlug)
    .filter(c => !c.slug.startsWith('service:'))  // skip service pages — they don't have internal-links section
    .filter(c => c.outboundCount < MAX_INBOUND_SATURATION)
    .map(c => {
      const ckw = c.keyword.toLowerCase();
      const ckwTokens = new Set(ckw.split(/\s+/).filter(t => t.length > 3));

      let score = 0;
      const newKwTokens = newKw.split(/\s+/).filter(t => t.length > 3);
      for (const t of newKwTokens) {
        if (ckwTokens.has(t)) score += 3;
      }
      for (const t of h1Tokens) {
        if (ckwTokens.has(t)) score += 1;
      }

      // Recency bonus: published in last 90 days gets +1-3
      // (Veriva slugs DON'T have date prefix, so we skip date-based bonus — use weight instead)
      score += c.weight * 0.5;

      return { target: c, score };
    })
    .filter(s => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, REVERSE_TARGETS_COUNT);

  return scored.map(s => ({
    slug: s.target.slug,
    url: s.target.url,
    matchedKeyword: s.target.keyword,
  }));
}

export interface ReverseInjectResult {
  html: string;
  ok: boolean;
  reason?: string;
}

export function injectReverseLink(
  oldPostHTML: string,
  newPostUrl: string,
  newPostTitle: string,
  _newPostKeyword: string
): ReverseInjectResult {
  if (oldPostHTML.includes(`href="${newPostUrl}"`)) {
    return { html: oldPostHTML, ok: false, reason: 'already_linked' };
  }

  // Veriva template uses: <ul class="internal-links">...</ul>
  // (already in template, blog-system-prompt.md generates 2-4 li items)
  const linksSectionRe = /<ul[^>]*class="[^"]*internal-links[^"]*"[^>]*>([\s\S]*?)<\/ul>/i;
  const match = oldPostHTML.match(linksSectionRe);

  if (!match) {
    return { html: oldPostHTML, ok: false, reason: 'internal_links_section_not_found' };
  }

  const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const newLi = `\n  <li><a href="${escapeAttr(newPostUrl)}">${escapeText(newPostTitle)}</a></li>`;

  const liCount = (match[1].match(/<li>/g) || []).length;
  if (liCount >= MAX_OUTBOUND_PER_POST) {
    return { html: oldPostHTML, ok: false, reason: 'reverse_target_already_full' };
  }

  const updatedSection = match[0].replace('</ul>', `${newLi}\n</ul>`);
  const html = oldPostHTML.replace(match[0], updatedSection);
  return { html, ok: true };
}

export function extractH1Title(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').trim();
}
