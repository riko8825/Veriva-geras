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
