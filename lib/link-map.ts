// lib/link-map.ts — builds keyword→URL map from published posts + topics.json
// Includes Veriva service pages as static link targets

import { getFileFromBranch } from './github';

export interface LinkTarget {
  keyword: string;
  url: string;
  slug: string;        // 'service:bdar' for service pages, blog slug for posts
  weight: number;      // 3=pillar, 2=cluster, 1=standalone, 4=service page
  outboundCount: number;
}

export interface TopicEntry {
  keyword: string;
  status: string;
  post_type?: 'pillar' | 'cluster' | 'standalone';
  pillar?: string;
  author_key?: 'marina' | 'justinas' | 'veriva';
}

// Veriva service page anchors — high-priority link targets
// These give cluster posts a path to convert (paslaugos → kontaktai → brief)
const SERVICE_TARGETS: LinkTarget[] = [
  { keyword: 'bdar auditas',        url: '/paslaugos#bdar',     slug: 'service:bdar',    weight: 4, outboundCount: 0 },
  { keyword: 'nis2 atitiktis',      url: '/paslaugos#nis2',     slug: 'service:nis2',    weight: 4, outboundCount: 0 },
  { keyword: 'dpo paslaugos',       url: '/paslaugos#dpo',      slug: 'service:dpo',     weight: 4, outboundCount: 0 },
  { keyword: 'darbuotojų mokymai',  url: '/paslaugos#mokymai',  slug: 'service:mokymai', weight: 4, outboundCount: 0 },
  { keyword: 'kibernetinio saugumo auditas', url: '/paslaugos#audit', slug: 'service:audit', weight: 4, outboundCount: 0 },
];

const POST_LINK_RE = /\/blog\/([\w\d-]+)\.html/g;

export function extractPublishedSlugsFromBlogHTML(blogHTML: string): Set<string> {
  const slugs = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(POST_LINK_RE.source, 'g');
  while ((m = re.exec(blogHTML)) !== null) {
    slugs.add(m[1]);
  }
  return slugs;
}

// LT slugify — same as blog-gen route.ts, kept here for keyword↔slug matching
function ltSlugify(s: string): string {
  const map: Record<string, string> = {
    'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i',
    'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
    'Ą': 'a', 'Č': 'c', 'Ę': 'e', 'Ė': 'e', 'Į': 'i',
    'Š': 's', 'Ų': 'u', 'Ū': 'u', 'Ž': 'z',
  };
  return s
    .split('')
    .map(c => map[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function slugFromKeyword(keyword: string, publishedSlugs: Set<string>): string | null {
  const normalized = ltSlugify(keyword);
  for (const slug of publishedSlugs) {
    if (slug === normalized || slug.includes(normalized)) return slug;
  }
  return null;
}

function extractH1FromHTML(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').trim();
}

export interface BuildLinkMapOpts {
  branch: string;
  excludeSlugs?: string[];
  includeServicePages?: boolean;  // default true
}

export async function buildLinkMap(opts: BuildLinkMapOpts): Promise<LinkTarget[]> {
  const { branch, excludeSlugs = [], includeServicePages = true } = opts;
  const exclude = new Set(excludeSlugs);

  const blogHTML = await getFileFromBranch(branch, 'blog.html');
  const publishedSlugs = extractPublishedSlugsFromBlogHTML(blogHTML);

  let topicsData: { topics: TopicEntry[] } = { topics: [] };
  try {
    const topicsRaw = await getFileFromBranch(branch, 'topics.json');
    topicsData = JSON.parse(topicsRaw) as { topics: TopicEntry[] };
  } catch {
    console.warn('[link-map] topics.json not found — using H1-only fallback');
  }

  const inboundCounts = new Map<string, number>();
  for (const slug of publishedSlugs) inboundCounts.set(slug, 0);

  let m: RegExpExecArray | null;
  const allRefRe = /\/blog\/([\w\d-]+)\.html/g;
  while ((m = allRefRe.exec(blogHTML)) !== null) {
    inboundCounts.set(m[1], (inboundCounts.get(m[1]) ?? 0) + 1);
  }

  const targets: LinkTarget[] = [];

  // Add published posts from topics.json
  for (const topic of topicsData.topics) {
    if (topic.status !== 'published') continue;
    const slug = slugFromKeyword(topic.keyword, publishedSlugs);
    if (!slug) continue;
    if (exclude.has(slug)) continue;

    const weight = topic.post_type === 'pillar' ? 3 : topic.post_type === 'cluster' ? 2 : 1;

    targets.push({
      keyword: topic.keyword.toLowerCase(),
      url: `/blog/${slug}.html`,
      slug,
      weight,
      outboundCount: inboundCounts.get(slug) ?? 0,
    });
  }

  // Add posts found in blog.html but missing from topics.json (fallback via H1)
  for (const slug of publishedSlugs) {
    if (exclude.has(slug)) continue;
    if (targets.some(t => t.slug === slug)) continue;

    try {
      const postHTML = await getFileFromBranch(branch, `blog/${slug}.html`);
      const h1 = extractH1FromHTML(postHTML);
      if (!h1) continue;

      const keyword = h1.toLowerCase().replace(/[^a-ząčęėįšųūž0-9\s-]/gi, '').trim();
      if (keyword.length < 8 || keyword.length > 80) continue;

      targets.push({
        keyword,
        url: `/blog/${slug}.html`,
        slug,
        weight: 1,
        outboundCount: inboundCounts.get(slug) ?? 0,
      });
    } catch {
      // skip
    }
  }

  // Add service pages (high-priority for cluster posts that need a conversion path)
  if (includeServicePages) {
    targets.push(...SERVICE_TARGETS);
  }

  return targets;
}
