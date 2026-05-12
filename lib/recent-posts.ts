// lib/recent-posts.ts — fetch + parse last N published blog posts for duplication checks
// Used by: blog-gen (uniqueness gate). Cached per-process to avoid GitHub rate-limit hammer.

import { listDirFromBranch, getFileFromBranch } from './github';

export interface RecentPostMeta {
  slug: string;
  title: string;
  description: string;
  h2List: string[];
  h3List: string[];
  contentType?: string;
  intent?: string;
  statHighlights: string[];
  ctaPhrases: string[];
}

interface CacheEntry {
  data: RecentPostMeta[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — short enough for cron freshness
const RECENT_LIMIT = 10;
const PILLAR_FILES = new Set(['template.html']); // skip non-post files

let cache: CacheEntry | null = null;

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractMatches(html: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1]);
    if (text) out.push(text);
  }
  return out;
}

export function parsePostMeta(slug: string, html: string): RecentPostMeta {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : '';

  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const description = descMatch ? descMatch[1] : '';

  const h2List = extractMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h3List = extractMatches(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi);

  // Optional meta tags written by future blog-approve
  const ctMatch = html.match(/<meta\s+name="veriva:content_type"\s+content="([^"]+)"/i);
  const intentMatch = html.match(/<meta\s+name="veriva:intent"\s+content="([^"]+)"/i);

  // Stat highlights from .stat-hl-num blocks (numeric callouts get reused most)
  const statHighlights = extractMatches(
    html,
    /<div\s+class="stat-hl-num"[^>]*>([\s\S]*?)<\/div>/gi,
  );

  // CTA phrases from .cta-inline-h (heading is the most distinctive CTA marker)
  const ctaPhrases = extractMatches(
    html,
    /<h3\s+class="cta-inline-h"[^>]*>([\s\S]*?)<\/h3>/gi,
  );

  return {
    slug,
    title,
    description,
    h2List,
    h3List,
    contentType: ctMatch ? ctMatch[1] : undefined,
    intent: intentMatch ? intentMatch[1] : undefined,
    statHighlights,
    ctaPhrases,
  };
}

/**
 * Fetch last N published posts from main branch. Cached per-process for 5 min.
 * Skips template.html and dotfiles. Best-effort: errors per-file are logged + skipped.
 */
export async function fetchRecentPosts(limit = RECENT_LIMIT): Promise<RecentPostMeta[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    console.log(`[recent-posts] cache hit (age ${Math.round((now - cache.fetchedAt) / 1000)}s, ${cache.data.length} posts)`);
    return cache.data.slice(0, limit);
  }

  console.log(`[recent-posts] fetching from GitHub blog/ ...`);
  let entries;
  try {
    entries = await listDirFromBranch('main', 'blog');
  } catch (err) {
    console.warn(`[recent-posts] listDir failed — returning empty: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }

  const htmlFiles = entries
    .filter(e => e.type === 'file' && e.name.endsWith('.html') && !PILLAR_FILES.has(e.name))
    .map(e => ({ slug: e.name.replace(/\.html$/, ''), path: e.path }));

  // Newest first — GitHub doesn't guarantee order, but slugs with dates would sort.
  // For now, take last N alphabetically — close enough for duplication detection.
  const targets = htmlFiles.slice(-limit);

  const results: RecentPostMeta[] = [];
  for (const t of targets) {
    try {
      const html = await getFileFromBranch('main', t.path);
      results.push(parsePostMeta(t.slug, html));
    } catch (err) {
      console.warn(`[recent-posts] skip ${t.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  cache = { data: results, fetchedAt: now };
  console.log(`[recent-posts] fetched ${results.length} posts, cached`);
  return results;
}

export function clearRecentPostsCache(): void {
  cache = null;
}
