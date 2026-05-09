# Automation Standards — Veriva

Šis dokumentas yra Edge Function autoritetas backend režimui. Adaptuota iš Empirra `docs/automation-standards.md`.

## Kodo standartas (kiekviena Edge Function)

```typescript
import { withTimeout } from '../../lib/timeout'
import { log, logStep } from '../../lib/logger'
import { sendEmail } from '../../lib/resend'
import { ok, fail } from '../../lib/response'
import { checkRateLimit, getClientIp } from '../../lib/ratelimit'
import { requireFields, validateEmail, sanitizeString } from '../../lib/validate'
import { verifyContactAuth } from '../../lib/auth'

export default async function handler(req: Request) {
  const start = Date.now()
  const requestId = crypto.randomUUID()
  const workflow = 'contact-form'
  try {
    // 1. Auth (x-api-key per endpoint)
    if (!verifyContactAuth(req)) return fail('unauthorized', 401)
    // 2. Rate limit
    const ip = getClientIp(req)
    if (!await checkRateLimit(ip, workflow)) return fail('rate_limit_exceeded', 429)
    // 3. Parse + validate + sanitize
    const body = await req.json()
    requireFields(body, ['name', 'email', 'message'])
    await logStep(workflow, requestId, 'validated')
    // 4. DB save
    const id = await saveLead({ ...body, request_id: requestId })
    await logStep(workflow, requestId, 'db_saved', { id })
    // 5. Return response (< 2s)
    const response = ok({ success: true, id })
    // 6. Async heavy work (email, AI)
    sendEmailAsync({ ... }).catch(() => {})
    await log({ workflow, status: 'success', request_id: requestId, duration_ms: Date.now() - start })
    return response
  } catch (error) {
    await log({ workflow, status: 'error', request_id: requestId, error_code: 'internal_error', error: String(error) })
    return fail('internal_error', 500)
  }
}
```

## Correlation ID taisyklė

Kiekvienas request gauna `requestId = crypto.randomUUID()` pačioje pradžioje.
Visi `logStep()` ir `log()` kvietimai perduoda šį `requestId`.
Supabase filtras debug metu: `select * from automation_logs where request_id = 'abc-123' order by created_at`.

## Step log žingsniai (standartiniai)

| Step | Kada |
|------|------|
| `received` | Request gautas |
| `validated` | Validacija praėjo |
| `db_saved` | Įrašyta į DB |
| `ai_done` | AI atsakė |
| `ai_skipped` | AI nepavyko (timeout/error) |
| `db_updated` | DB atnaujinta po AI |
| `email_lead_sent` | Email lead'ui išsiųstas |
| `email_lead_failed` | Email lead'ui nepavyko |
| `email_owner_sent` | Email owner'ui išsiųstas |
| `completed` | Viskas baigta |

## Error kategorijos

| Kodas | Priežastis |
|-------|-----------|
| `validation_error` | Trūksta laukų arba neteisingas formatas |
| `db_error` | Supabase insert/update nepavyko |
| `ai_timeout` | Claude API neatsako per 10s |
| `ai_error` | Claude API grąžino klaidą |
| `email_error` | Resend nepavyko išsiųsti |
| `rate_limit_exceeded` | Per daug requestų iš vieno IP |
| `unauthorized` | x-api-key trūksta arba neteisingas |
| `internal_error` | Nenumatyta klaida |

## Thin endpoint taisyklė (privaloma)

User-facing route daro TIK:
1. Auth (`x-api-key`)
2. Rate limit tikrinimas
3. Input parse + validate + sanitize
4. DB save
5. Return response (< 2s)

Sunkūs darbai vyksta ATSKIRAI po response:
- AI generavimas / kvalifikacija
- Email siuntimas (Resend)
- Slack alertai
- CRM sync

```typescript
// ✅ Teisingai
return ok({ success: true })                          // pirma atsakyti
sendEmailAsync(...).catch(() => {})                   // po to sunkūs darbai

// ❌ Blogai
const aiResult = await runPrompt(...)                 // blokuoja response
await sendEmail(...)                                  // timeout rizika
return ok({ success: true })
```

## Retry policy

**Retry tinka:**
| Servisas | Retry | Backoff |
|----------|-------|---------|
| Claude API | 3x | 1s → 2s → 4s (automatiškai `lib/claude.ts`) |
| Slack webhook | 1x | nėra (nekritinė) |

**Retry NETINKA:**
| Scenarijus | Kodėl |
|------------|-------|
| DB insert be duplicate apsaugos | Sukurs duplikatus |
| Email siuntimas be idempotency | Du emailai tam pačiam žmogui |
| Webhook į išorinius servisus | Gali duplikuoti veiksmą |

**Taisyklė:** retry tik idempotent operacijoms. Jei abejoji — geriau ne.

## Auth pattern (per-endpoint secrets)

Kiekvienas endpoint turi atskirą `*_SECRET` env var. NĖRA shared `API_KEY`.

```typescript
// lib/auth.ts
export function verifyContactAuth(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  return key === process.env.CONTACT_FORM_SECRET
}

export function verifyAuditAuth(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  return key === process.env.AUDIT_REQUEST_SECRET
}

export function verifyNewsletterAuth(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  return key === process.env.NEWSLETTER_SECRET
}
```

**Kodėl** (Empirra s21, KI-006 patirtis): leaked secret blast-radius — tik vienas endpoint. Rotation be kitų endpoint'ų breakage'o. Audit logs identifikuoja tikslų endpoint'ą.

## Error handling standartas

```typescript
import { ERR } from '../../lib/errors'

const err = ERR.DB(dbError.message)
await log({ ..., error_code: err.code, error: err.message })
return new Response(JSON.stringify({ success: false, error: err.message, code: err.code }), {
  status: err.status,
  headers: { 'Content-Type': 'application/json' }
})
```

## Kūrimo flow

```
1. UŽDUOTIS    → tikslas + input + output
2. LOGIKA      → flow schema, if/else, integracijos
3. ARCHITEKTŪRA → solution-architect approve
4. KODAS       → TypeScript + validacija + step logs + error kategorijos
5. TESTAI      → qa-tester (5+ inputs, edge cases)
6. DEPLOY      → staging → approve → production
```

## Failų struktūra

```
api/forms/[name].ts       ← user-facing (contact, audit-request, newsletter)
api/internal/[name].ts    ← internal (health, blog-gen, blog-publish)
lib/supabase.ts · lib/claude.ts · lib/resend.ts · lib/logger.ts
lib/timeout.ts · lib/response.ts · lib/ratelimit.ts · lib/auth.ts
lib/validate.ts · lib/errors.ts
```

- Kiekvienas endpoint = vienas `.ts` failas
- Importuoti iš `/lib` — niekada kopijuoti
- Logging privalomas (success + error)
- `process.env.*` tik — jokių hardcode

## Logging schema

```sql
create table automation_logs (
  id          uuid        default gen_random_uuid() primary key,
  workflow    text        not null,
  status      text        check (status in ('success', 'error', 'warning', 'step')),
  request_id  text,
  step        text,
  error_code  text,
  input       jsonb,
  output      jsonb,
  error       text,
  duration_ms int,
  created_at  timestamptz default now()
);
```

## Edge Cases biblioteka

| Klaida | Priežastis | Sprendimas |
|--------|-----------|------------|
| `Row violates RLS policy` | Naudojamas `anon` key | `lib/supabase.ts` naudoja `SUPABASE_SERVICE_ROLE_KEY` |
| `Cannot read properties of undefined` | Trūksta lauko | `requireFields()` prieš bet kokią logiką |
| `502 Bad Gateway` | Viršytas 25s timeout | Async modelis — sunkūs darbai po response |
| `Claude API: overloaded_error` | Per daug requestų | Automatinis retry 3x (lib/claude.ts) |
| `Resend: rate_limit_exceeded` | >10 emails/s | Queue arba `setTimeout` tarp siuntimų |
| `Supabase: JWT expired` | Key pasibaigė | Patikrinti `SUPABASE_SERVICE_ROLE_KEY` Vercel |
| `CORS error` | Trūksta CORS headers | `'Access-Control-Allow-Origin': 'https://veriva.lt'` |
| Duplicate lead | Email jau egzistuoja | `upsert` su `onConflict: 'email'` |
| Claude grąžina ne JSON | Prompt per laisvas | System prompte: `Atsakyk TIK JSON.` |
| Vercel cron nepaleidžiamas | `vercel.json` formatas | `"schedule": "0 9 * * 1"` |
| Trailing newline `*_SECRET` | `echo` vietoje `printf` | Visada `printf "$VAL" \| vercel env add` |
