// GET /api/internal/health
// Smoke test — patikrina, ar Edge Function deployed + env vars yra

import { json } from '../../lib/response';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const checks = {
    runtime: 'edge',
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: !!process.env.SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      resend_key: !!process.env.RESEND_API_KEY,
      resend_from: !!process.env.RESEND_FROM_EMAIL,
    },
  };

  return json({ status: 'ok', checks });
}
