// lib/sitemap-update.ts — rebuilds sitemap.xml from GitHub branch contents
// Veriva: static pages + dynamic blog/*.html (excluding template.html)

import { listDirFromBranch } from './github';

const BASE_URL = 'https://veriva.lt';

// Veriva static pages — clean URLs (Vercel rewrites .html → no extension)
const STATIC_PAGES: Array<{ url: string; priority: string; changefreq: string }> = [
  { url: '/',             priority: '1.0', changefreq: 'weekly'  },
  { url: '/paslaugos',    priority: '0.9', changefreq: 'monthly' },
  { url: '/apie',         priority: '0.7', changefreq: 'monthly' },
  { url: '/kainos',       priority: '0.8', changefreq: 'monthly' },
  { url: '/blog.html',    priority: '0.8', changefreq: 'weekly'  },
  { url: '/kontaktai',    priority: '0.9', changefreq: 'monthly' },
  { url: '/privatumas',   priority: '0.4', changefreq: 'yearly'  },
  { url: '/slapukai',     priority: '0.4', changefreq: 'yearly'  },
];

const BLOG_SKIP = new Set<string>([
  'template.html',
  '_template.html',
]);

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function renderUrl(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return [
    '  <url>',
    `    <loc>${BASE_URL}${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

export interface BuildSitemapOptions {
  branch: string;
  newPostSlug?: string;  // bumps blog.html lastmod to today
}

export async function buildSitemapFromBranch(opts: BuildSitemapOptions): Promise<string> {
  const today = todayUTC();
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  for (const p of STATIC_PAGES) {
    lines.push(renderUrl(p.url, today, p.priority, p.changefreq));
  }

  let entries;
  try {
    entries = await listDirFromBranch(opts.branch, 'blog');
  } catch (err) {
    throw new Error(`[sitemap] listDirFromBranch(blog) failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const posts = entries
    .filter(e => e.type === 'file' && e.name.endsWith('.html') && !BLOG_SKIP.has(e.name))
    .map(e => {
      const slug = e.name.replace(/\.html$/, '');
      const lastmod = opts.newPostSlug && slug === opts.newPostSlug ? today : today;
      return { name: e.name, lastmod };
    });

  posts.sort((a, b) => a.name.localeCompare(b.name));

  for (const p of posts) {
    lines.push(renderUrl(`/blog/${p.name}`, p.lastmod, '0.9', 'monthly'));
  }

  lines.push('</urlset>');
  lines.push('');
  return lines.join('\n');
}
