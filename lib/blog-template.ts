// lib/blog-template.ts — JSON → HTML template injection
// Naudoja: blog-gen po AI response parse, paima blog/template.html ir įstato placeholder reikšmes
//
// Veriva template.html naudoja {{PLACEHOLDER}} sintax (žr. blog-system-prompt.md).
// AI gražina JSON su 30 lauk'ų atitinkančių placeholders.

import { getFileFromBranch } from './github';

/**
 * BlogPostData — matches JSON output structure from blog-system-prompt.md
 * All fields are required unless marked optional.
 */
export interface BlogPostData {
  post_title: string;
  post_description: string;
  post_slug: string;
  post_category: string;        // "BDAR" | "NIS2" | etc.
  post_cat_key?: string;         // "bdar" | "nis2" | etc. (not used in template, used for blog-card)
  post_date: string;             // "2026-05-11"
  post_date_human: string;       // "2026 m. gegužės 11 d."
  post_read_min: number;
  post_word_count: number;
  post_author: string;           // "Marina" | "Justinas" | "Veriva komanda"
  post_author_role: string;
  post_author_initial: string;   // "M" | "J" | "V"
  post_hero_img: string;         // "/assets/img/blog/{slug}-hero.svg" OR Pexels URL
  post_hero_alt: string;
  post_hero_caption: string;
  post_keywords_csv: string;
  post_keywords_meta: string;
  post_definition: string;
  post_toc_html: string;
  post_body_html: string;
  post_faq_html: string;
  post_faq_schema_json: string;
  post_howto_schema_json?: string | null;
  post_review_schema_json?: string | null;
  post_testimonial_html?: string;
  // Optional — pulled from keyword expansion
  kw_primary?: string;
  kw_secondary?: string;
  kw_longtail?: string;
  kw_lsi?: string;               // comma-separated
  related_posts_html?: string;   // internal-links section, populated by blog-approve
}

/**
 * Map AI JSON keys → template placeholder names.
 * Template uses UPPER_SNAKE_CASE, JSON uses lower_snake_case.
 */
const PLACEHOLDER_MAP: Record<string, keyof BlogPostData> = {
  POST_TITLE:              'post_title',
  POST_DESCRIPTION:        'post_description',
  POST_SLUG:               'post_slug',
  POST_CATEGORY:           'post_category',
  POST_DATE:               'post_date',
  POST_DATE_HUMAN:         'post_date_human',
  POST_READ_MIN:           'post_read_min' as keyof BlogPostData,
  POST_WORD_COUNT:         'post_word_count' as keyof BlogPostData,
  POST_AUTHOR:             'post_author',
  POST_AUTHOR_ROLE:        'post_author_role',
  POST_AUTHOR_INITIAL:     'post_author_initial',
  POST_HERO_IMG:           'post_hero_img',
  POST_HERO_ALT:           'post_hero_alt',
  POST_HERO_CAPTION:       'post_hero_caption',
  POST_KEYWORDS_CSV:       'post_keywords_csv',
  POST_KEYWORDS_META:      'post_keywords_meta',
  POST_DEFINITION:         'post_definition',
  POST_TOC_HTML:           'post_toc_html',
  POST_BODY_HTML:          'post_body_html',
  POST_FAQ_HTML:           'post_faq_html',
  POST_FAQ_SCHEMA_JSON:    'post_faq_schema_json',
  POST_HOWTO_SCHEMA_JSON:  'post_howto_schema_json',
  POST_REVIEW_SCHEMA_JSON: 'post_review_schema_json',
  POST_TESTIMONIAL_HTML:   'post_testimonial_html',
  KW_PRIMARY:              'kw_primary',
  KW_SECONDARY:            'kw_secondary',
  KW_LONGTAIL:             'kw_longtail',
  KW_LSI:                  'kw_lsi',
  RELATED_POSTS_HTML:      'related_posts_html',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Validate required fields are present and non-empty.
 * Returns array of missing/invalid field names (empty = all OK).
 */
export function validatePostData(data: Partial<BlogPostData>): string[] {
  const errors: string[] = [];
  const required: Array<keyof BlogPostData> = [
    'post_title', 'post_description', 'post_slug',
    'post_category', 'post_date', 'post_date_human',
    'post_author', 'post_author_role', 'post_author_initial',
    'post_hero_img', 'post_hero_alt',
    'post_definition', 'post_toc_html', 'post_body_html',
    'post_faq_html', 'post_faq_schema_json',
  ];

  for (const f of required) {
    const v = data[f];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim().length === 0)) {
      errors.push(f);
    }
  }

  // Numeric fields
  if (typeof data.post_read_min !== 'number' || data.post_read_min < 1 || data.post_read_min > 60) {
    errors.push('post_read_min (must be 1-60)');
  }
  if (typeof data.post_word_count !== 'number' || data.post_word_count < 500) {
    errors.push('post_word_count (must be ≥500)');
  }

  // Slug format
  if (data.post_slug && !/^[a-z0-9-]+$/.test(data.post_slug)) {
    errors.push('post_slug (must be lowercase kebab-case, no diacritics)');
  }

  // Title length
  if (data.post_title && data.post_title.length > 70) {
    errors.push(`post_title too long (${data.post_title.length}/60)`);
  }

  // Description length
  if (data.post_description) {
    const len = data.post_description.length;
    if (len < 120 || len > 180) {
      errors.push(`post_description length (${len}, target 140-160)`);
    }
  }

  // Author whitelist
  if (data.post_author && !['Marina', 'Justinas', 'Veriva komanda'].includes(data.post_author)) {
    errors.push(`post_author "${data.post_author}" (must be Marina | Justinas | Veriva komanda)`);
  }

  return errors;
}

/**
 * Render template.html with data — replaces {{PLACEHOLDER}} occurrences.
 * Unknown placeholders are left as-is (logged warning).
 * Empty/null optional fields → replaced with empty string.
 */
export function renderTemplate(templateHTML: string, data: BlogPostData): string {
  let html = templateHTML;

  for (const [placeholder, key] of Object.entries(PLACEHOLDER_MAP)) {
    const pattern = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
    const raw = data[key];

    let value: string;
    if (raw === null || raw === undefined) {
      value = '';
    } else if (typeof raw === 'number') {
      value = String(raw);
    } else {
      value = raw;
    }

    // Sanity: title/description go into <title>, <meta>, etc. — must be HTML-safe.
    // post_body_html, post_toc_html, post_faq_html, schema JSON — already HTML, no escape.
    const RAW_HTML_FIELDS = new Set<string>([
      'POST_TOC_HTML', 'POST_BODY_HTML', 'POST_FAQ_HTML',
      'POST_FAQ_SCHEMA_JSON', 'POST_HOWTO_SCHEMA_JSON', 'POST_REVIEW_SCHEMA_JSON',
      'POST_TESTIMONIAL_HTML', 'RELATED_POSTS_HTML',
    ]);
    const safe = RAW_HTML_FIELDS.has(placeholder) ? value : escapeHtml(value);

    html = html.replace(pattern, safe);
  }

  // Warn about unreplaced placeholders (template has them, but data didn't)
  const remaining = html.match(/\{\{[A-Z_]+\}\}/g);
  if (remaining) {
    console.warn(`[blog-template] Unreplaced placeholders: ${[...new Set(remaining)].join(', ')}`);
    // Strip them so output is clean HTML
    html = html.replace(/\{\{[A-Z_]+\}\}/g, '');
  }

  return html;
}

/**
 * Fetch template.html from branch and render it.
 */
export async function buildBlogPostHTML(branch: string, data: BlogPostData): Promise<string> {
  const template = await getFileFromBranch(branch, 'blog/template.html');
  return renderTemplate(template, data);
}
