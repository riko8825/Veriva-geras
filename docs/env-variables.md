# Env Variables — Veriva

Visos env reikšmės. NIEKADA nekomitinti `.env` su realiomis reikšmėmis.

---

## Setup

### Lokaliai

```bash
cp .env.example .env.local
# Užpildyti reikšmes
```

### Production (Vercel)

Vercel Dashboard → Project Settings → Environment Variables.
Aplinkos: Development, Preview, Production — užpildyti TIK ten kur reikia.

---

## Privalomi (visada)

### `SUPABASE_URL`
- **Tipas**: URL
- **Reikšmė**: `https://[project-ref].supabase.co`
- **Kur gauti**: Supabase Dashboard → Project Settings → API
- **Kur naudojama**: visi `api/*` endpointai per `lib/supabase.ts`

### `SUPABASE_SERVICE_ROLE_KEY`
- **Tipas**: JWT (slaptas)
- **Reikšmė**: `eyJ...`
- **Kur gauti**: Supabase Dashboard → Project Settings → API → `service_role`
- **PERSPĖJIMAS**: NIEKADA frontend'e. Tik Edge Functions.

### `RESEND_API_KEY`
- **Tipas**: API key (slaptas)
- **Reikšmė**: `re_xxxxx`
- **Kur gauti**: resend.com/api-keys
- **Kur naudojama**: `api/forms/*` per `lib/resend.ts`

### `RESEND_FROM_EMAIL`
- **Tipas**: Email
- **Reikšmė**: `hello@veriva.lt` (turi būti verifikuotas Resend)
- **Pastaba**: Domain verifikacija privaloma — DKIM + SPF + DMARC

### `RESEND_NOTIFY_EMAIL`
- **Tipas**: Email
- **Reikšmė**: `info@veriva.lt`
- **Naudojimas**: kur siunčiamos vidinės notifikacijos (naujas lead ir pan.)

---

## Webhook auth (atskiri per endpoint)

Kiekvienas endpoint'as turi SAVO secret. NE shared.

### `CONTACT_FORM_SECRET`
- **Tipas**: random hex string
- **Generacija**: `openssl rand -hex 32`
- **Naudojimas**: `api/forms/contact.ts` → `x-api-key` header validation

### `AUDIT_REQUEST_SECRET`
- **Tipas**: random hex string
- **Naudojimas**: `api/forms/audit-request.ts`

### `HEALTH_CHECK_SECRET`
- **Tipas**: random hex string
- **Naudojimas**: `api/internal/health.ts`

---

## Optional

### `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- **Tikslas**: rate limiting (jei reikės)
- **Kur gauti**: upstash.com
- **Pastaba**: Galima atidėti, kol nebus traffic'o

### Analytics (frontend)

Šie keliauja į HTML, NE Edge Functions:
- `GA4_MEASUREMENT_ID` — `G-XXXXXXXXXX`
- `GTM_ID` — `GTM-XXXXXXX`
- `COOKIEBOT_ID` — Cookiebot script ID

---

## Konvencijos

1. **Atskiras secret per endpoint** (s21 sprendimas Empirra projekte) — jei vienas leak'ina, kiti saugūs
2. **`process.env.*`** tik Edge Function viduje — niekada hardcode
3. **Rotation**: kas 6 mėnesius (planuojama 2026-11-09)
4. **Backup**: 1Password vault `veriva-prod`

---

## Validacija

Edge Function pradžioje VISADA:

```typescript
const SECRET = process.env.CONTACT_FORM_SECRET;
if (!SECRET) {
  throw new Error('CONTACT_FORM_SECRET not configured');
}
```

Niekada nesileisti tylėti — fail loudly, kad pamatytume Vercel logs.
