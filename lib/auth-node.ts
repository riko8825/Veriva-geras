// lib/auth-node.ts — Node runtime auth helpers (IncomingMessage)
// Naudoja: blog-gen, blog-approve, telegram-webhook (Vercel @vercel/node)
// Edge runtime endpoint'ai naudoja lib/auth.ts (Request)

import type { IncomingMessage } from 'http';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getBearer(req: IncomingMessage): string {
  const authHeader = req.headers['authorization'] ?? '';
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  return token.replace(/^Bearer\s+/i, '').trim();
}

function getApiKey(req: IncomingMessage): string {
  const k = req.headers['x-api-key'] ?? '';
  return (Array.isArray(k) ? (k[0] ?? '') : k).trim();
}

// Blog generation endpoint — accept either CRON_SECRET (Vercel cron) or BLOG_TRIGGER_SECRET (manual)
export function verifyBlogTriggerAuth(req: IncomingMessage): boolean {
  const bearer = getBearer(req);
  const apiKey = getApiKey(req);

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && bearer.length > 0 && constantTimeEqual(bearer, cronSecret)) return true;

  const triggerSecret = process.env.BLOG_TRIGGER_SECRET;
  if (triggerSecret && apiKey.length > 0 && constantTimeEqual(apiKey, triggerSecret)) return true;

  return false;
}

// Blog approve endpoint — server-to-server only (called by telegram-webhook)
export function verifyBlogApproveAuth(req: IncomingMessage): boolean {
  const apiKey = getApiKey(req);
  const expected = process.env.BLOG_APPROVE_SECRET;
  if (!expected) return false;
  return constantTimeEqual(apiKey, expected);
}

// Telegram webhook — header X-Telegram-Bot-Api-Secret-Token must match
export function verifyTelegramWebhookAuth(req: IncomingMessage): boolean {
  const h = req.headers['x-telegram-bot-api-secret-token'];
  const got = (Array.isArray(h) ? (h[0] ?? '') : (h ?? '')).trim();
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  return constantTimeEqual(got, expected);
}
