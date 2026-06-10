// Edge-compatible auth helpers
// Constant-time string compare apsaugo nuo timing attacks

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getApiKey(req: Request): string {
  return req.headers.get('x-api-key')?.trim() ?? '';
}

function getBearer(req: Request): string {
  const auth = req.headers.get('authorization') ?? '';
  return auth.replace(/^Bearer\s+/i, '').trim();
}

export function verifyContactFormAuth(req: Request): boolean {
  const expected = process.env.CONTACT_FORM_SECRET;
  if (!expected) return false;
  return constantTimeEqual(getApiKey(req), expected);
}

export function verifyAuditRequestAuth(req: Request): boolean {
  const expected = process.env.AUDIT_REQUEST_SECRET;
  if (!expected) return false;
  return constantTimeEqual(getApiKey(req), expected);
}

export function verifyHealthCheckAuth(req: Request): boolean {
  const expected = process.env.HEALTH_CHECK_SECRET;
  if (!expected) return true;
  return constantTimeEqual(getBearer(req), expected);
}

// ─── Blog automation (Edge) — atitinka lib/auth-node.ts logiką, bet Request ─────

// Blog generation — CRON_SECRET (Vercel cron Bearer) ARBA BLOG_TRIGGER_SECRET (manual x-api-key)
export function verifyBlogTriggerAuth(req: Request): boolean {
  const bearer = getBearer(req);
  const apiKey = getApiKey(req);

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && bearer.length > 0 && constantTimeEqual(bearer, cronSecret)) return true;

  const triggerSecret = process.env.BLOG_TRIGGER_SECRET;
  if (triggerSecret && apiKey.length > 0 && constantTimeEqual(apiKey, triggerSecret)) return true;

  return false;
}

// Blog approve — server-to-server (kviečia telegram-webhook), x-api-key == BLOG_APPROVE_SECRET
export function verifyBlogApproveAuth(req: Request): boolean {
  const expected = process.env.BLOG_APPROVE_SECRET;
  if (!expected) return false;
  return constantTimeEqual(getApiKey(req), expected);
}

// Telegram webhook — header X-Telegram-Bot-Api-Secret-Token == TELEGRAM_WEBHOOK_SECRET
export function verifyTelegramWebhookAuth(req: Request): boolean {
  const got = req.headers.get('x-telegram-bot-api-secret-token')?.trim() ?? '';
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  return constantTimeEqual(got, expected);
}
