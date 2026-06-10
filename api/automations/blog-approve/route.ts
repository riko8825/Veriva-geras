// api/automations/blog-approve/route.ts
// Veriva blog publish flow:
//   1. Add post card to blog.html grid (.bp-grid anchor)
//   2. Inject forward internal links into new post + reverse links into related published posts
//   3. Regenerate sitemap.xml
//   4. Merge branch to main + delete branch (triggers Vercel deploy)
//   5. Send Telegram confirmation
//
// Auth: x-api-key BLOG_APPROVE_SECRET
// Called by: api/automations/telegram-webhook (action=POST)

import { mergeBranchToMain, deleteBranch, commitFileToBranch, getFileFromBranch } from '../../../lib/github';
import { sendTelegramMessage } from '../../../lib/telegram';
import { extractBlogCardMeta, buildBlogCardHTML, insertCardAfterFeatured } from '../../../lib/blog-card';
import { buildLinkMap } from '../../../lib/link-map';
import { injectForwardLinks, pickReverseTargets, injectReverseLink, extractH1Title } from '../../../lib/internal-links';
import { buildSitemapFromBranch } from '../../../lib/sitemap-update';
import { verifyBlogApproveAuth } from '../../../lib/auth';

export const config = { runtime: 'edge' };

const GITHUB_API = 'https://api.github.com/repos/riko8825/Veriva-geras';

async function fetchTopics(): Promise<{ topics: Array<{ keyword: string; status: string }> }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('[blog-approve] GITHUB_TOKEN is not set');

  const url = `${GITHUB_API}/contents/topics.json?ref=main`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`[blog-approve] fetchTopics ${res.status}: ${text.slice(0, 200)}`);
  const file = JSON.parse(text) as { content: string };
  return JSON.parse(b64decodeUtf8(file.content));
}

// Edge-safe base64 → UTF-8
function b64decodeUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

interface CardResult { ok: boolean; reason?: string }
interface LinkResult {
  ok: boolean;
  reason?: string;
  forwardCount: number;
  reverseCount: number;
  reverseFailed: number;
}
interface SitemapResult { ok: boolean; reason?: string; urlCount: number }

// ───────────────────────────────────────────────────────────
// 1. Add grid card to blog.html (.bp-grid anchor)
// ───────────────────────────────────────────────────────────
async function addBlogCardToGrid(branch: string, slug: string): Promise<CardResult> {
  const postPath = `blog/${slug}.html`;
  let postHTML: string;
  try {
    postHTML = await getFileFromBranch(branch, postPath);
  } catch (err) {
    return { ok: false, reason: `fetch_post_failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const meta = extractBlogCardMeta(postHTML, slug);
  if (!meta) return { ok: false, reason: 'extract_meta_failed' };

  const cardHTML = buildBlogCardHTML(meta);

  const blogPath = 'blog.html';
  let currentHTML: string;
  try {
    currentHTML = await getFileFromBranch(branch, blogPath);
  } catch (err) {
    return { ok: false, reason: `fetch_blog_html_failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const result = insertCardAfterFeatured(currentHTML, cardHTML, slug);
  if (!result.inserted) {
    if (result.reason === 'card_already_present') {
      console.log(`[blog-approve] card already in blog.html — skip`);
      return { ok: true };
    }
    return { ok: false, reason: `insert_blog_html_failed: ${result.reason}` };
  }

  try {
    await commitFileToBranch(branch, blogPath, result.html, `chore: add blog grid card — ${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `commit_blog_html_failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ───────────────────────────────────────────────────────────
// 2. Internal links — forward (new post) + reverse (old posts)
// ───────────────────────────────────────────────────────────
async function linkInternal(branch: string, slug: string, keyword: string): Promise<LinkResult> {
  const result: LinkResult = { ok: false, forwardCount: 0, reverseCount: 0, reverseFailed: 0 };

  let map;
  try {
    map = await buildLinkMap({ branch, excludeSlugs: [slug] });
  } catch (err) {
    result.reason = `link_map_build_failed: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  if (map.length === 0) {
    result.ok = true;
    result.reason = 'no_link_targets';
    return result;
  }

  const postPath = `blog/${slug}.html`;
  let postHTML: string;
  try {
    postHTML = await getFileFromBranch(branch, postPath);
  } catch (err) {
    result.reason = `fetch_post_failed: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  const newPostH1 = extractH1Title(postHTML) ?? keyword;

  // Forward — inject links FROM new post TO related published posts
  const forwardResult = injectForwardLinks(postHTML, map, slug);
  if (forwardResult.injected.length > 0) {
    try {
      await commitFileToBranch(
        branch,
        postPath,
        forwardResult.html,
        `chore: add ${forwardResult.injected.length} internal links — ${slug}`,
      );
      result.forwardCount = forwardResult.injected.length;
      console.log(`[blog-approve] forward links: ${forwardResult.injected.length} injected (${forwardResult.skipped.length} skipped)`);
    } catch (err) {
      result.reason = `forward_commit_failed: ${err instanceof Error ? err.message : String(err)}`;
      return result;
    }
  } else {
    console.log(`[blog-approve] forward links: 0 injected (${forwardResult.skipped.length} skipped)`);
  }

  // Reverse — inject links FROM related old posts TO new post (internal-links section)
  const reverseTargets = pickReverseTargets(keyword, newPostH1, map, slug);
  const newPostUrl = `/blog/${slug}.html`;

  for (const target of reverseTargets) {
    if (target.slug.startsWith('service:')) continue;  // service pages don't have internal-links section

    const oldPath = `blog/${target.slug}.html`;
    let oldHTML: string;
    try {
      oldHTML = await getFileFromBranch(branch, oldPath);
    } catch {
      result.reverseFailed++;
      continue;
    }

    const reverseResult = injectReverseLink(oldHTML, newPostUrl, newPostH1, keyword);
    if (!reverseResult.ok) {
      result.reverseFailed++;
      console.log(`[blog-approve] reverse skip ${target.slug}: ${reverseResult.reason}`);
      continue;
    }

    try {
      await commitFileToBranch(
        branch,
        oldPath,
        reverseResult.html,
        `chore: add reverse link to ${slug} — ${target.slug}`,
      );
      result.reverseCount++;
    } catch (err) {
      result.reverseFailed++;
      console.error(`[blog-approve] reverse commit failed ${target.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  result.ok = true;
  return result;
}

// ───────────────────────────────────────────────────────────
// 3. Sitemap update
// ───────────────────────────────────────────────────────────
async function updateSitemap(branch: string, slug: string): Promise<SitemapResult> {
  let xml: string;
  try {
    xml = await buildSitemapFromBranch({ branch, newPostSlug: slug });
  } catch (err) {
    return { ok: false, reason: `build_failed: ${err instanceof Error ? err.message : String(err)}`, urlCount: 0 };
  }

  const urlCount = (xml.match(/<url>/g) || []).length;

  try {
    await commitFileToBranch(branch, 'sitemap.xml', xml, `chore: update sitemap.xml — ${slug}`);
  } catch (err) {
    return { ok: false, reason: `commit_failed: ${err instanceof Error ? err.message : String(err)}`, urlCount };
  }

  return { ok: true, urlCount };
}

// ───────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────
function sendJson(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return sendJson(405, { error: 'Method not allowed' });
  }

  if (!verifyBlogApproveAuth(req)) {
    console.warn('[blog-approve] Unauthorized — invalid x-api-key');
    return sendJson(401, { error: 'Unauthorized' });
  }

  const text = await req.text();
  let body: { branch: string; slug: string; action: 'POST' | 'SKIP' | 'REVISE'; keyword?: string };
  try {
    body = JSON.parse(text);
  } catch {
    return sendJson(400, { error: 'Invalid JSON' });
  }

  const { branch, slug, action, keyword } = body;

  if (!branch || !slug || !action) {
    return sendJson(400, { error: 'Missing: branch, slug, action' });
  }

  if (!['POST', 'SKIP', 'REVISE'].includes(action)) {
    return sendJson(400, { error: 'action must be POST | SKIP | REVISE' });
  }

  try {
    // ─── POST (Publikuoti) ───────────────────────────────
    if (action === 'POST') {
      // Step 1: Add card to blog.html grid
      const cardResult = await addBlogCardToGrid(branch, slug);
      if (!cardResult.ok) {
        console.error(`[blog-approve] grid card update failed: ${cardResult.reason}`);
      } else {
        console.log(`[blog-approve] grid card added to blog.html`);
      }

      // Step 2: Internal linking
      let linkResult: LinkResult = { ok: false, forwardCount: 0, reverseCount: 0, reverseFailed: 0, reason: 'not_attempted' };
      if (keyword) {
        try {
          linkResult = await linkInternal(branch, slug, keyword);
          if (!linkResult.ok) {
            console.error(`[blog-approve] internal linking failed: ${linkResult.reason}`);
          } else {
            console.log(`[blog-approve] internal linking: ${linkResult.forwardCount} forward, ${linkResult.reverseCount} reverse, ${linkResult.reverseFailed} failed`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[blog-approve] internal linking crash: ${msg}`);
          linkResult.reason = `crash: ${msg}`;
        }
      } else {
        linkResult.reason = 'no_keyword_in_request';
      }

      // Step 3: Sitemap update
      let sitemapResult: SitemapResult = { ok: false, reason: 'not_attempted', urlCount: 0 };
      try {
        sitemapResult = await updateSitemap(branch, slug);
        if (!sitemapResult.ok) {
          console.error(`[blog-approve] sitemap update failed: ${sitemapResult.reason}`);
        } else {
          console.log(`[blog-approve] sitemap updated: ${sitemapResult.urlCount} URLs`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[blog-approve] sitemap crash: ${msg}`);
        sitemapResult.reason = `crash: ${msg}`;
      }

      // Step 4: Update topics.json status (draft → published) on the branch BEFORE merge
      if (keyword) {
        try {
          const data = await fetchTopics();
          const idx = data.topics.findIndex(t => t.keyword === keyword);
          if (idx !== -1) {
            data.topics[idx].status = 'published';
            await commitFileToBranch(
              branch,
              'topics.json',
              JSON.stringify(data, null, 2),
              `chore: mark "${keyword}" as published`,
            );
          }
        } catch (err) {
          console.error(`[blog-approve] topics.json update failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // Step 5: Merge + delete branch (triggers Vercel deploy)
      await mergeBranchToMain(branch, `feat: publish blog post — ${slug}`);
      try {
        await deleteBranch(branch);
      } catch (err) {
        console.warn(`[blog-approve] deleteBranch (non-critical): ${err instanceof Error ? err.message : String(err)}`);
      }

      // Step 6: Telegram confirmation
      const liveMsg = `✅ <b>Publikuota:</b> /blog/${slug}.html\n\nVercel deploy paleistas. Live ~30s.`;
      const cardWarn = cardResult.ok ? '' : `\n\n⚠️ Grid kortelė NEPRIDĖTA (${cardResult.reason}) — pridėk rankomis į blog.html.`;
      const linkInfo = linkResult.ok && (linkResult.forwardCount > 0 || linkResult.reverseCount > 0)
        ? `\n\n🔗 Internal links: ${linkResult.forwardCount} forward + ${linkResult.reverseCount} reverse`
        : linkResult.ok
          ? ''
          : `\n\n⚠️ Internal linking failed: ${linkResult.reason}`;
      const sitemapInfo = sitemapResult.ok
        ? `\n\n🗺 Sitemap: ${sitemapResult.urlCount} URLs`
        : `\n\n⚠️ Sitemap update failed: ${sitemapResult.reason}`;

      await sendTelegramMessage(liveMsg + cardWarn + linkInfo + sitemapInfo).catch(() => {/* non-critical */});

      console.log(`[blog-approve] published: ${slug}`);
      return sendJson(200, {
        success: true,
        action: 'published',
        slug,
        gridCardAdded: cardResult.ok,
        linksForward: linkResult.forwardCount,
        linksReverse: linkResult.reverseCount,
        sitemapUrls: sitemapResult.urlCount,
      });
    }

    // ─── SKIP ───────────────────────────────
    if (action === 'SKIP') {
      if (keyword) {
        const data = await fetchTopics();
        const idx = data.topics.findIndex(t => t.keyword === keyword);
        if (idx !== -1) {
          data.topics[idx].status = 'skipped';
          await commitFileToBranch('main', 'topics.json', JSON.stringify(data, null, 2), `chore: mark "${keyword}" as skipped`);
        }
      }
      await deleteBranch(branch);
      await sendTelegramMessage(`⏭ <b>Praleista:</b> ${slug}`).catch(() => {});
      console.log(`[blog-approve] skipped: ${slug}`);
      return sendJson(200, { success: true, action: 'skipped', slug });
    }

    // ─── REVISE ───────────────────────────────
    if (action === 'REVISE') {
      await deleteBranch(branch);
      if (keyword) {
        const data = await fetchTopics();
        const idx = data.topics.findIndex(t => t.keyword === keyword);
        if (idx !== -1) {
          data.topics[idx].status = 'pending';
          await commitFileToBranch('main', 'topics.json', JSON.stringify(data, null, 2), `chore: reset "${keyword}" to pending for revision`);
        }
      }
      await sendTelegramMessage(`🔄 <b>Revizija:</b> ${slug}\nTopic reset to pending — bus regeneruotas kito cron run metu.`).catch(() => {});
      console.log(`[blog-approve] revision: ${slug}`);
      return sendJson(200, { success: true, action: 'revise', slug });
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[blog-approve] error:', msg);
    return sendJson(500, { success: false, error: msg });
  }

  // action validuotas anksčiau (POST/SKIP/REVISE) — fallback TS exhaustiveness
  return sendJson(400, { error: 'Unhandled action' });
}
