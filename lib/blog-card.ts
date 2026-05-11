// lib/blog-card.ts — extracts meta from generated post + builds .bc card for blog.html grid
// Veriva blog.html uses .bc class structure (not .blog-card from Empirra)

export interface BlogCardMeta {
  category: string;     // BDAR | NIS2 | DPO | Saugumas | Mokymai
  categorySlug: string; // data-cat value: bdar | nis2 | dpo | sauga | mokymai
  title: string;
  excerpt: string;
  readingTime: string;  // "15 min"
  slug: string;
  ariaLabel: string;
  catBadge: string;     // Short uppercase text for bc-img-icon (e.g. "BDAR", "NIS2")
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
};

function decodeEntities(s: string): string {
  return s.replace(/&[a-z#0-9]+;/gi, m => HTML_ENTITIES[m] ?? m);
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trimExcerpt(text: string, maxChars = 180): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastPeriod = slice.lastIndexOf('.');
  if (lastPeriod > 80) return slice.slice(0, lastPeriod + 1);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…';
}

// Veriva kategorijos (matching blog.html filterai: data-cat)
function normalizeCategory(raw: string): { name: string; slug: string; badge: string } {
  const r = raw.toLowerCase();
  if (r.includes('bdar') || r.includes('gdpr') || r.includes('duomenų apsaug')) {
    return { name: 'BDAR', slug: 'bdar', badge: 'BDAR' };
  }
  if (r.includes('nis2') || r.includes('nis 2')) {
    return { name: 'NIS2', slug: 'nis2', badge: 'NIS2' };
  }
  if (r.includes('dpo') || r.includes('duomenų apsaugos pareigūn')) {
    return { name: 'DPO', slug: 'dpo', badge: 'DPO' };
  }
  if (r.includes('mokym') || r.includes('phishing') || r.includes('training')) {
    return { name: 'Mokymai', slug: 'mokymai', badge: 'EDU' };
  }
  if (r.includes('saugum') || r.includes('kibernet') || r.includes('it')) {
    return { name: 'Kibernetinis saugumas', slug: 'sauga', badge: 'IT' };
  }
  return { name: 'BDAR', slug: 'bdar', badge: 'BDAR' };
}

/**
 * Extract meta from generated Veriva blog post HTML.
 * Veriva template uses {{POST_CATEGORY}} placeholder OR plain <article> with <h1> + <p class="lead">.
 */
export function extractBlogCardMeta(articleHTML: string, slug: string): BlogCardMeta | null {
  // Try multiple selectors — Veriva post can use template structure OR direct markup
  const catMatch =
    articleHTML.match(/<span class="post-cat"[^>]*>([\s\S]*?)<\/span>/i) ||
    articleHTML.match(/<span class="article-cat"[^>]*>([\s\S]*?)<\/span>/i) ||
    articleHTML.match(/class="meta-cat"[^>]*>([\s\S]*?)</i);

  const h1Match = articleHTML.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (!h1Match) {
    console.error('[blog-card] extractBlogCardMeta — missing H1');
    return null;
  }

  const title = stripTags(h1Match[1]);
  if (!title) {
    console.error('[blog-card] extractBlogCardMeta — empty H1');
    return null;
  }

  // Category — fallback to slug if no explicit category
  const catRaw = catMatch ? stripTags(catMatch[1]) : slug;
  const cat = normalizeCategory(catRaw);

  // Excerpt: try <p class="lead">, <meta description>, or first <p> in article
  let excerpt = '';
  const leadMatch = articleHTML.match(/<p[^>]*class="[^"]*lead[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  if (leadMatch) excerpt = stripTags(leadMatch[1]);
  if (!excerpt) {
    const metaMatch = articleHTML.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (metaMatch) excerpt = decodeEntities(metaMatch[1]);
  }
  if (!excerpt) {
    const firstP = articleHTML.match(/<article[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    if (firstP) excerpt = stripTags(firstP[1]);
  }
  if (!excerpt) {
    console.error('[blog-card] extractBlogCardMeta — no intro paragraph found');
    return null;
  }
  excerpt = trimExcerpt(excerpt, 180);

  // Reading time: count words in article body (LT avg 180 wpm)
  const wordCount = stripTags(articleHTML).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(wordCount / 180));
  const readingTime = `${mins} min`;

  const ariaLabel = `Skaityti: ${title.replace(/"/g, '')}`.slice(0, 120);

  return {
    category: cat.name,
    categorySlug: cat.slug,
    title,
    excerpt,
    readingTime,
    slug,
    ariaLabel,
    catBadge: cat.badge,
  };
}

/**
 * Build .bc post card HTML matching Veriva blog.html structure.
 */
export function buildBlogCardHTML(meta: BlogCardMeta): string {
  return `      <!-- Auto-published: ${meta.slug} -->
      <a href="/blog/${escapeAttr(meta.slug)}.html" class="bc" data-cat="${escapeAttr(meta.categorySlug)}" aria-label="${escapeAttr(meta.ariaLabel)}">
        <div class="bc-img"><span class="bc-img-icon">${escapeText(meta.catBadge)}</span></div>
        <div class="bc-body">
          <div class="bc-meta"><span class="bc-cat">${escapeText(meta.category)}</span><span class="bc-dot"></span><span class="bc-time">${escapeText(meta.readingTime)}</span></div>
          <h3 class="bc-title">${escapeText(meta.title)}</h3>
          <p class="bc-excerpt">${escapeText(meta.excerpt)}</p>
          <span class="bc-read">Skaityti straipsnį <svg class="bc-read-arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4-4 4M21 12H3"/></svg></span>
        </div>
      </a>`;
}

// Veriva anchor: <div class="bp-grid" id="bp-grid">. Insert new cards right after the opening tag.
const GRID_OPEN_RE = /<div class="bp-grid"[^>]*id="bp-grid"[^>]*>/i;

export interface InsertResult { html: string; inserted: boolean; reason?: string }

export function insertCardAfterFeatured(blogHTML: string, cardHTML: string, slug: string): InsertResult {
  if (blogHTML.includes(`Auto-published: ${slug}`) || blogHTML.includes(`/blog/${slug}.html"`)) {
    return { html: blogHTML, inserted: false, reason: 'card_already_present' };
  }

  if (!GRID_OPEN_RE.test(blogHTML)) {
    return { html: blogHTML, inserted: false, reason: 'grid_anchor_not_found' };
  }

  const updated = blogHTML.replace(GRID_OPEN_RE, m => `${m}\n\n${cardHTML}`);
  return { html: updated, inserted: true };
}
