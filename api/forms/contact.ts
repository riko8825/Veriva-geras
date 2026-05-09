// POST /api/forms/contact
// Kontakto formos lead capture
// Auth: x-api-key (CONTACT_FORM_SECRET)
// Flow: validate → save to Supabase → send Resend notification → return 200

import { json, fail, methodNotAllowed } from '../../lib/response';
import { verifyContactFormAuth } from '../../lib/auth';

export const config = { runtime: 'edge' };

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  service?: string;
  source?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(p: Partial<ContactPayload>): string | null {
  if (!p.name || p.name.trim().length < 2) return 'Vardas privalomas';
  if (!p.email || !EMAIL_REGEX.test(p.email)) return 'Neteisingas el. pašto formatas';
  if (p.message && p.message.length > 5000) return 'Žinutė per ilga';
  if (p.name.length > 200) return 'Vardas per ilgas';
  return null;
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT ?? 'veriva-default-salt';
  const data = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  if (!verifyContactFormAuth(req)) return fail('Unauthorized', 'AUTH', 401);

  let payload: Partial<ContactPayload>;
  try {
    payload = await req.json();
  } catch {
    return fail('Neteisingas JSON', 'BAD_JSON', 400);
  }

  const validationError = validate(payload);
  if (validationError) return fail(validationError, 'VALIDATION', 400);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? 'unknown';
  const ipHash = await hashIp(ip);

  // TODO: Insert į Supabase (kai bus įdiegta DB)
  // const supabase = createServiceClient();
  // const { error } = await supabase.from('leads').insert({ ...payload, ip_hash: ipHash, user_agent: userAgent });
  // if (error) return fail('DB klaida', 'DB_ERROR', 500);

  // TODO: Resend notifikacija į info@veriva.lt
  // await sendNotification({ subject: 'Naujas lead', payload });

  console.log('[contact] new lead', { email: payload.email, ipHash });

  return json({ message: 'Žinutė gauta. Susisieksime per 24 val.' });
}
