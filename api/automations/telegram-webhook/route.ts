// api/automations/telegram-webhook/route.ts
// Veriva Telegram callback handler
// Routes: P (Publikuoti) → blog-approve | R (Revise) → text reply | S (Skip) → delete branch
//
// Auth: X-Telegram-Bot-Api-Secret-Token header must match TELEGRAM_WEBHOOK_SECRET
// State: revise multi-turn state stored in Supabase (veriva_telegram_revise_state)

import { deleteBranch, commitFileToBranch, listBranches } from '../../../lib/github';
import { sendTelegramMessage, answerCallbackQuery, slugHash } from '../../../lib/telegram';
import { verifyTelegramWebhookAuth } from '../../../lib/auth';

// Node.js runtime + Fluid Compute. telegram-webhook gali deleguoti į blog-approve
// (POST publish) — laukia atsakymo, todėl irgi gali viršyti 25s. maxDuration apsaugo.
export const maxDuration = 60;

const GITHUB_API = 'https://api.github.com/repos/riko8825/Veriva-geras';
const VERIVA_TABLE = 'veriva_telegram_revise_state';

// Telegram visada turi gauti 200, kad nekartotų webhook (retry storm prevencija)
function ok200(): Response {
  return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}

interface TopicEntry {
  keyword: string;
  status: string;
  post_type?: string;
  pillar?: string;
  author_key?: string;
}

async function fetchTopics(): Promise<{ topics: TopicEntry[]; [k: string]: unknown }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('[tg] GITHUB_TOKEN is not set');

  const url = `${GITHUB_API}/contents/topics.json?ref=main`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`[tg] fetchTopics GitHub API ${res.status}: ${text.slice(0, 200)}`);
  const file = JSON.parse(text) as { content: string };
  return JSON.parse(b64decodeUtf8(file.content));
}

// Edge-safe base64 → UTF-8 (Buffer neprieinamas)
function b64decodeUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// ───────────────────────────────────────────────────────────
// Revise state (Supabase) — survives webhook restarts
// ───────────────────────────────────────────────────────────
async function getReviseState(chatId: string): Promise<{ branch: string; slug: string; keyword: string } | null> {
  try {
    const { supabase } = await import('../../../lib/supabase');
    const { data, error } = await supabase
      .from(VERIVA_TABLE)
      .select('branch, slug, keyword')
      .eq('chat_id', chatId)
      .single();
    if (error || !data) return null;
    return data as { branch: string; slug: string; keyword: string };
  } catch {
    return null;
  }
}

async function setReviseState(chatId: string, branch: string, slug: string, keyword: string): Promise<void> {
  try {
    const { supabase } = await import('../../../lib/supabase');
    await supabase.from(VERIVA_TABLE).upsert({
      chat_id: chatId,
      branch,
      slug,
      keyword,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[tg] setReviseState (non-critical): ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function clearReviseState(chatId: string): Promise<void> {
  try {
    const { supabase } = await import('../../../lib/supabase');
    await supabase.from(VERIVA_TABLE).delete().eq('chat_id', chatId);
  } catch {
    /* non-critical */
  }
}

// ───────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────
async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') { return ok200(); }

  if (!verifyTelegramWebhookAuth(req)) {
    console.warn('[tg] Unauthorized webhook call — invalid X-Telegram-Bot-Api-Secret-Token');
    return ok200();  // return 200 to avoid Telegram retry storms
  }

  let update: {
    callback_query?: {
      id: string;
      data?: string;
      from?: { id: number };
      message?: { message_id: number; chat: { id: number } };
    };
    message?: {
      text?: string;
      from?: { id: number };
      chat?: { id: number };
    };
  };

  try {
    const body = await req.text();
    update = JSON.parse(body);
  } catch {
    console.error('[tg] body parse failed');
    return ok200();
  }

  try {
    // ───────────────────────────────────────────────
    // Text message (revise text reply)
    // ───────────────────────────────────────────────
    if (update.message?.text && update.message.chat?.id) {
      const chatId = String(update.message.chat.id);
      const text = update.message.text.trim();

      // Slash commands not implemented (Empirra had /intake — Veriva-specific commands TBD)
      if (text.startsWith('/')) { return ok200(); }

      const state = await getReviseState(chatId);
      if (!state) { return ok200(); }  // not in revise mode

      const { branch, keyword } = state;
      await clearReviseState(chatId);
      console.log(`[tg] REVISE text — keyword:${keyword} note:${text.slice(0, 60)}`);

      try {
        await deleteBranch(branch);

        // Reset topic to pending so next cron run regenerates it
        const data = await fetchTopics();
        const idx = data.topics.findIndex(t => t.keyword === keyword);
        if (idx !== -1) {
          data.topics[idx].status = 'pending';
          await commitFileToBranch(
            'main',
            'topics.json',
            JSON.stringify(data, null, 2),
            `chore: reset "${keyword}" to pending (revise requested)`,
          );
        }

        await sendTelegramMessage(
          `🔄 <b>Atstatyta į pending</b>\n\nPastaba: <i>${escapeHtml(text)}</i>\n\nStraipsnis bus regeneruotas kito cron run metu (antradienis arba ketvirtadienis 10:00 LT) arba paleisk rankomis.`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[tg] REVISE error: ${msg}`);
        await sendTelegramMessage(`❌ Revize klaida:\n<code>${msg.slice(0, 300)}</code>`).catch(() => {/* ignore */});
      }

      return ok200();
    }

    // ───────────────────────────────────────────────
    // Callback (inline button)
    // ───────────────────────────────────────────────
    const cq = update.callback_query;
    if (!cq?.data) { return ok200(); }

    const parts = cq.data.split('|');
    if (parts.length < 2) { return ok200(); }

    const [rawAction, hashOrSlug] = parts;
    const actionMap: Record<string, string> = { P: 'POST', R: 'REVISE', S: 'SKIP' };
    const action = actionMap[rawAction] ?? rawAction;
    const chatId = String(cq.message?.chat?.id ?? cq.from?.id ?? '');

    // Resolve hash → branch (lookup against draft-blog-* branches)
    let slug = '';
    let branch = '';
    const isHash = /^[a-f0-9]{6}$/.test(hashOrSlug);

    if (isHash) {
      try {
        const draftBranches = await listBranches('draft-blog-');
        const match = draftBranches.find(b => slugHash(b.replace(/^draft-blog-/, '')) === hashOrSlug);
        if (!match) {
          console.error(`[tg] hash unresolved: ${hashOrSlug} — branches: ${draftBranches.length}`);
          await sendTelegramMessage(`❌ Draft branch nerastas pagal hash: <code>${hashOrSlug}</code>`).catch(() => {/* ignore */});
          return ok200();
        }
        branch = match;
        slug = match.replace(/^draft-blog-/, '');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[tg] listBranches failed: ${msg}`);
        await sendTelegramMessage(`❌ Branch lookup nepavyko:\n<code>${msg.slice(0, 200)}</code>`).catch(() => {/* ignore */});
        return ok200();
      }
    } else {
      slug = hashOrSlug.startsWith('draft-blog-') ? hashOrSlug.replace(/^draft-blog-/, '') : hashOrSlug;
      branch = hashOrSlug.startsWith('draft-blog-') ? hashOrSlug : `draft-blog-${hashOrSlug}`;
    }

    console.log(`[tg] action=${action} branch=${branch}${isHash ? ' (hash-resolved)' : ''}`);

    if (!branch) {
      await sendTelegramMessage(`❌ branch tuščias — callback_data: ${cq.data}`).catch(() => {/* ignore */});
      return ok200();
    }

    // ─── POST (Publikuoti) ───────────────────────────────
    if (action === 'POST') {
      try { await answerCallbackQuery(cq.id, '⏳ Publikuojama...'); } catch { /* non-critical */ }

      // Get keyword from topics.json (status=draft for this slug)
      let keyword = '';
      try {
        const data = await fetchTopics();
        keyword = data.topics.find(t => t.status === 'draft')?.keyword ?? '';
      } catch (err) {
        console.error(`[tg] fetchTopics failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Delegate to blog-approve
      const approveSecret = process.env.BLOG_APPROVE_SECRET;
      if (!approveSecret) {
        console.error('[tg] BLOG_APPROVE_SECRET env not set');
        await sendTelegramMessage(`❌ <b>Publish nepavyko</b>\n\n<code>BLOG_APPROVE_SECRET env nenustatyta</code>`).catch(() => {/* ignore */});
      } else {
        try {
          const approveRes = await fetch('https://veriva.lt/api/automations/blog-approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': approveSecret },
            body: JSON.stringify({ branch, slug, action: 'POST', keyword }),
          });
          const approveText = await approveRes.text();
          if (!approveRes.ok) {
            console.error(`[tg] blog-approve ${approveRes.status}: ${approveText.slice(0, 300)}`);
            await sendTelegramMessage(`❌ <b>Publish nepavyko (${approveRes.status})</b>\n\n<code>${escapeHtml(approveText.slice(0, 300))}</code>`).catch(() => {/* ignore */});
          } else {
            console.log(`[tg] POST delegated to blog-approve: ${approveText.slice(0, 200)}`);
            // blog-approve sends its own success Telegram message
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[tg] blog-approve fetch failed: ${msg}`);
          await sendTelegramMessage(`❌ <b>Publish crash</b>\n\n<code>${escapeHtml(msg.slice(0, 300))}</code>`).catch(() => {/* ignore */});
        }
      }

    // ─── SKIP (Praleisti) ───────────────────────────────
    } else if (action === 'SKIP') {
      try { await answerCallbackQuery(cq.id, '⏭ Praleidžiama...'); } catch { /* non-critical */ }

      try {
        const data = await fetchTopics();
        const idx = data.topics.findIndex(t => t.status === 'draft');
        if (idx !== -1) {
          const kw = data.topics[idx].keyword;
          data.topics[idx].status = 'skipped';
          await commitFileToBranch('main', 'topics.json', JSON.stringify(data, null, 2), `chore: mark "${kw}" as skipped`);
        }
        await deleteBranch(branch);
        await sendTelegramMessage(`⏭ <b>Praleista:</b> <code>${slug}</code>`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[tg] SKIP error: ${msg}`);
        await sendTelegramMessage(`❌ SKIP klaida:\n<code>${escapeHtml(msg.slice(0, 200))}</code>`).catch(() => {/* ignore */});
      }

    // ─── REVISE (Taisyti) ───────────────────────────────
    } else if (action === 'REVISE') {
      try { await answerCallbackQuery(cq.id, '✏️ Aprašyk ką taisyti'); } catch { /* non-critical */ }

      try {
        const data = await fetchTopics();
        const draftTopic = data.topics.find(t => t.status === 'draft');
        const keyword = draftTopic?.keyword ?? '';
        if (chatId) await setReviseState(chatId, branch, slug, keyword);
        await sendTelegramMessage(`✏️ <b>Ką reikia taisyti?</b>\n\nAtsakyk tekstu — aprašyk pakeitimus. Straipsnis bus atstatytas į pending ir regeneruotas kitam cron run'ui.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[tg] REVISE setup error: ${msg}`);
      }

    } else {
      console.error(`[tg] unknown action: ${rawAction}`);
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tg] UNCAUGHT: ${msg}`);
    await sendTelegramMessage(`❌ Webhook crash:\n<code>${escapeHtml(msg.slice(0, 300))}</code>`).catch(() => {/* ignore */});
  }

  return ok200();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Vercel Node runtime — Web-standard fetch export (palaiko Request/Response + maxDuration)
export default { fetch: handler };
