import { getImage } from './pexels';

const TELEGRAM_TIMEOUT_MS = 10000;
const TELEGRAM_MAX_RETRIES = 3;
const TELEGRAM_RETRY_DELAY_MS = 800;

const REPO_OWNER = 'riko8825';
const REPO_NAME = 'Veriva-geras';

// 6-hex deterministinis hash branch identifikatoriui callback_data'oje (NE kriptografinis).
// Edge runtime nepalaiko sinchroninio node:crypto createHash — FNV-1a sinchroniškas ir stabilus.
// Abi pusės (telegram.ts generuoja, telegram-webhook atstato) naudoja TĄ PAČIĄ funkciją.
export function slugHash(slug: string): string {
  let h = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  // 32-bit → 8 hex, paimam 6 (pakanka unikalumui tarp ~kelių draft branch'ų)
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6);
}

function getCredentials(): { token: string; chatId: string } {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token) throw new Error('[telegram] TELEGRAM_BOT_TOKEN is not set');
  if (!chatId) throw new Error('[telegram] TELEGRAM_CHAT_ID is not set');
  return { token, chatId };
}

function maskChatId(chatId: string): string {
  if (chatId.length <= 4) return '****';
  return '*'.repeat(chatId.length - 4) + chatId.slice(-4);
}

async function telegramPost(token: string, method: string, body: object): Promise<boolean> {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= TELEGRAM_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[telegram] ${method} attempt ${attempt}/${TELEGRAM_MAX_RETRIES} fetch failed: ${msg}`);
      lastErr = err;
      if (attempt < TELEGRAM_MAX_RETRIES) await new Promise(r => setTimeout(r, TELEGRAM_RETRY_DELAY_MS * attempt));
      continue;
    }
    clearTimeout(timer);

    if (res.status === 429 || res.status >= 500) {
      const retryAfter = res.headers.get('Retry-After');
      const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : TELEGRAM_RETRY_DELAY_MS * attempt;
      console.warn(`[telegram] ${method} attempt ${attempt}/${TELEGRAM_MAX_RETRIES} → ${res.status}, retry in ${wait}ms`);
      lastErr = new Error(`HTTP ${res.status}`);
      if (attempt < TELEGRAM_MAX_RETRIES) await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[telegram] ${method} failed — status ${res.status}: ${errBody.slice(0, 300)}`);
      return false;
    }

    return true;
  }

  console.error(`[telegram] ${method} all ${TELEGRAM_MAX_RETRIES} retries failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
  return false;
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const { token, chatId } = getCredentials();
  console.log(`[telegram] sendMessage → chat_id: ${maskChatId(chatId)}`);
  return telegramPost(token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

function extractPlanFromTemplate(articleHTML: string, topN = 5): string {
  // Veriva template uses {{POST_TITLE}} placeholder OR plain <h1>...</h1>
  const h1Match = articleHTML.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const h2s: string[] = [];
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(articleHTML)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text) h2s.push(text);
  }
  const totalH2 = h2s.length;
  const topH2 = h2s.slice(0, topN).map(t => `  · ${t}`);
  if (totalH2 > topN) topH2.push(`  · …+${totalH2 - topN} dar`);
  return [h1 ? `<b>${h1}</b>` : '', ...topH2].filter(Boolean).join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function verdictEmoji(v: 'pass' | 'warn' | 'fail'): string {
  if (v === 'pass') return '🟢';
  if (v === 'warn') return '🟡';
  return '🔴';
}

async function githubBranchExists(branch: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${encodeURIComponent(branch)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    return res.status === 200;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export interface DraftNotificationContentType {
  key: string;
  label: string;
  intent: string;
}

export interface DraftNotificationUniqueness {
  score: number;
  verdict: 'pass' | 'warn' | 'fail';
  worstNeighborSlug: string | null;
  h2OverlapPct: number;
  intentCollisionSlug: string | null;
}

export async function sendTelegramDraftNotification(params: {
  keyword: string;
  slug: string;
  branch: string;
  articleHTML?: string;
  contentType?: DraftNotificationContentType;
  uniqueness?: DraftNotificationUniqueness;
}): Promise<boolean> {
  const { token, chatId } = getCredentials();
  console.log(`[telegram] sendTelegramDraftNotification → chat_id: ${maskChatId(chatId)}, slug: ${params.slug}`);

  const { keyword, slug, branch, articleHTML, contentType, uniqueness } = params;

  const [branchExists, photoUrl] = await Promise.all([
    githubBranchExists(branch),
    getImage(keyword),
  ]);
  console.log(`[telegram] branch exists: ${branchExists} — "${branch}"`);
  console.log(`[telegram] photo: ${photoUrl}`);

  const previewUrl = branchExists
    ? `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${branch}/blog/${slug}.html`
    : null;

  const plan = articleHTML ? extractPlanFromTemplate(articleHTML, 5) : '';

  const ctLine = contentType
    ? `<b>Content type:</b> ${escapeHtml(contentType.label)} <code>${escapeHtml(contentType.key)}</code>`
    : null;
  const intentLine = contentType
    ? `<b>Intent:</b> <i>${escapeHtml(contentType.intent)}</i>`
    : null;

  let uniqLines: string[] | null = null;
  if (uniqueness) {
    const emoji = verdictEmoji(uniqueness.verdict);
    uniqLines = [
      `${emoji} <b>Uniqueness:</b> ${uniqueness.score}/100 (${uniqueness.verdict.toUpperCase()})`,
      `<b>H2 overlap:</b> ${uniqueness.h2OverlapPct}%${uniqueness.worstNeighborSlug ? ` vs <code>${escapeHtml(uniqueness.worstNeighborSlug)}</code>` : ''}`,
    ];
    if (uniqueness.verdict === 'warn') {
      uniqLines.push(`⚠️ <b>Cannibalization warning</b> — peržiūrėk H2 prieš publikuojant`);
    }
    if (uniqueness.intentCollisionSlug) {
      uniqLines.push(`🚨 <b>Intent collision:</b> tas pats content_type+slug stem kaip <code>${escapeHtml(uniqueness.intentCollisionSlug)}</code>`);
    }
  }

  const msgText = [
    `📝 <b>Naujas straipsnis paruoštas</b>`,
    ``,
    `<b>Tema:</b> ${escapeHtml(keyword)}`,
    `<b>Slug:</b> <code>${escapeHtml(slug)}</code>`,
    ctLine,
    intentLine,
    uniqLines ? `\n${uniqLines.join('\n')}` : null,
    plan ? `\n<b>Top H2 (5):</b>\n${plan}` : null,
    previewUrl ? `\n<a href="${previewUrl}">👁 Peržiūrėti GitHub</a>` : null,
    ``,
    `Pasirink veiksmą:`,
  ].filter(Boolean).join('\n');

  // callback_data limit is 64 bytes. Use 6-char SHA-1 hash of slug (10 bytes total: "P|abc123").
  // Webhook resolves hash → branch via listBranches('draft-blog-') match.
  const h = slugHash(slug);
  const reply_markup = {
    inline_keyboard: [[
      { text: '✅ Publikuoti', callback_data: `P|${h}` },
      { text: '✏️ Taisyti', callback_data: `R|${h}` },
      { text: '⏭ Praleisti', callback_data: `S|${h}` },
    ]],
  };

  // Send photo first (no buttons), then message with plan + buttons
  const photoController = new AbortController();
  const photoTimer = setTimeout(() => photoController.abort(), TELEGRAM_TIMEOUT_MS);
  try {
    const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl }),
      signal: photoController.signal,
    });
    clearTimeout(photoTimer);
    if (photoRes.ok) {
      console.log(`[telegram] sendPhoto OK`);
    } else {
      const err = await photoRes.text();
      console.error(`[telegram] sendPhoto failed ${photoRes.status}: ${err.slice(0, 200)}`);
    }
  } catch (err) {
    clearTimeout(photoTimer);
    console.error(`[telegram] sendPhoto fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const ok = await telegramPost(token, 'sendMessage', {
    chat_id: chatId,
    text: msgText,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup,
  });
  if (!ok) {
    console.error(`[telegram] sendMessage FAILED`);
    return false;
  }
  console.log(`[telegram] sendMessage OK`);
  return true;
}

export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[telegram] answerCallbackQuery — TELEGRAM_BOT_TOKEN not set');
    return;
  }
  await telegramPost(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}
