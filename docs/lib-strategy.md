# `/lib` Strategy — Vendor Independence and DRY (Veriva)

`lib/` yra svarbiausias architektūrinis sluoksnis. Jis atskiria "Veriva business logic" nuo "konkrečių vendor SDK".

Jei šitą layer'į padarom teisingai, perėjimas iš Resend į Mailgun, ar iš Supabase į Postgres-on-Fly, yra vieno failo pakeitimas. Jei padarom blogai — kiekvienas endpoint'as turi vendor-specific kodo kopiją, ir vendor lock-in'as garantuotas.

Adaptuota iš Empirra `docs/lib-strategy.md`.

---

## Principle 1 — Wrap, do not import

**Rule:** Endpoints under `api/forms/` ir `api/internal/` import from `lib/`, never directly from a vendor SDK.

**Bad:**
```typescript
// api/forms/contact.ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
```

**Good:**
```typescript
// api/forms/contact.ts
import { supabase } from '../../lib/supabase'
```

**Why:**
- Vienas env var validation, ne dešimt
- Viena vieta keisti vendor'į
- Endpoint skaitomas kaip business logic, ne infrastructure plumbing
- Testai gali mock'inti `lib/*`, ne visą SDK surface

---

## Principle 2 — Validate at the boundary

Kiekvienas `lib/*.ts` failas, kuris naudoja env vars, turi validuoti juos module-load metu ir **throw if missing**. Ne pirmo kvietimo metu. Ne tyliai. Throw.

**Pattern:**
```typescript
const apiKey = process.env.RESEND_API_KEY
if (!apiKey) throw new Error('[resend] RESEND_API_KEY env variable is missing')
```

**Why:**
- Endpoint deploys fail fast on missing config (cold-start error in Vercel logs)
- Sužinom apie trūkstamus secrets per deploy, ne per pirmą user request'ą
- Apsaugo nuo blogiausio incident pattern'o: "automation silently no-ops in production"

---

## Principle 3 — One wrapper per vendor, not per use case

**Rule:** `lib/resend.ts` yra vienintelė vieta, kuri liečia Resend SDK. Kiekvienas email-sending endpoint importuoja iš `lib/resend.ts`.

**Anti-pattern:** `lib/contact-email.ts`, `lib/audit-email.ts`, `lib/newsletter-email.ts` — kiekvienas tiesiogiai importuojantis Resend.

**Reason:** Kai Resend keičia kontraktą, lūžta, ar migruojam į Mailgun, keičiam **vieną failą**. Su per-use-case wrappers reikia ieškoti kiekvienos kopijos.

**Application:** Wrappers organizuojami pagal **vendor**, ne pagal **business function**. Business function gyvena `api/forms/<name>.ts` arba `api/internal/<name>.ts`.

---

## Principle 4 — Per-endpoint secrets, not shared keys

**Rule:** Kiekvienas endpoint gauna savo `*_SECRET` env var. Jokio shared `API_KEY`, jokio shared `WEBHOOK_SECRET`.

**Veriva endpoint'ų secrets:**
- `contact-form` → `CONTACT_FORM_SECRET`
- `audit-request` → `AUDIT_REQUEST_SECRET`
- `newsletter` → `NEWSLETTER_SECRET`
- `blog-gen` → `BLOG_GEN_SECRET`
- `blog-approve` → `BLOG_APPROVE_SECRET`
- `blog-publish` → `BLOG_PUBLISH_SECRET`
- `health` → `HEALTH_SECRET`

**Why** (Empirra s21, KI-006 patirtis):
- Leaked secret blast-radius — tik vienas endpoint
- Rotation'as nelaužia kitų endpoint'ų
- Audit logs identifikuoja tikslų endpoint'ą
- Galima revoke per endpoint nesusikoordinuojant su kitais sistemomis

Verification helpers `lib/auth.ts` (`verifyContactAuth`, `verifyAuditAuth`, ir t.t.) enforce'ina šitą pattern'ą. **Nėra `verifyApiKey()` funkcijos ir niekada nebus.**

---

## Principle 5 — No state in `lib/`

**Rule:** `lib/*` modules yra stateless. Jie expose'ina funkcijas ir konfigūruotus klientus. Jie necache'ina, neturi queue, neorchestrate'ina.

**Bad:** `lib/leads.ts` su in-memory cache.

**Good:** `lib/supabase.ts` expose'ina klientą. Caller sprendžia ką skaityti ar cache'inti.

**Why:** Vercel Edge Functions yra stateless ir gali run'inti bet kurioje regione. Module-level state yra foot-gun: veikia dev'e, leak'ina production'e.

---

## Principle 6 — Errors are typed, not strings

**Rule:** Throw `Error` subclasses iš `lib/errors.ts`, ne plain strings.

**Bad:**
```typescript
throw 'Email send failed'
```

**Good:**
```typescript
import { ResendError } from './errors'
throw new ResendError('Email send failed', { cause: err })
```

**Why:**
- Endpoints gali `catch` pagal type ir respond'inti su tinkamu HTTP status
- Logger gali extract'inti error class metrics'ams
- Postmortems gali kategorizuoti incidents pagal error type

---

## Principle 7 — Logging is structured, not freeform

**Rule:** Naudoti `lib/logger.ts` production logging'ui. Jokio `console.log`. Jokio `console.error` su template strings.

**Bad:**
```typescript
console.log('Lead saved: ' + email)
```

**Good:**
```typescript
import { log } from './logger'
log.info('lead_saved', { email, source: 'contact-form', request_id })
```

**Why:**
- Vercel log search tampa naudingas (`event:lead_saved`)
- Galima grep'inti event'us neskaitant prozos
- Structured logs ship'inami į observability tools švariai
- PII gali būti redacted'inami vienoje vietoje

---

## Kas eina į `lib/` (ir kas ne)

### Eina į `lib/`

- Vendor SDK wrapperiai (Supabase, Resend, Claude, Cookiebot)
- Cross-cutting concerns (auth, rate limiting, logging, errors, timeouts, response helpers)
- Mažos pure functions naudojamos kelių endpoint'ų (`validate.ts`)
- Domain helpers shared across endpoints

### **Ne**eina į `lib/`

- Business logic specific'i vienam endpoint'ui — gyvena `api/forms/<name>.ts`
- Configuration kuri yra environment-specific — gyvena env vars
- Templates / prompts — gyvena šalia endpoint'o, kuris naudoja
- Tests — gyvena `tests/`
- Scripts run manually — gyvena `scripts/`

Jei failas `lib/` importuojamas tiksliai vieno endpoint'o — turbūt turi pereiti į to endpoint'o directory.

---

## Kada pridėti naują `lib/` modulį

Pridėk naują failą į `lib/` kai **visi trys** yra true:

1. Funkcionalumas calls external vendor arba crosses infrastructure boundary
2. Reikalingas **dviem ar daugiau** endpoint'ų (arba bus per ateinančias dvi savaites)
3. Nėra esamo wrapper'io, kuris gali absorb'inti naują funkcionalumą

Jei tik (1) yra true ir funkcija naudojama vieno endpoint'o, parašyk ją endpoint'e ir **promote'uok vėliau** kai atsiras antras caller'is. Premature abstraction yra blogesnis failure mode nei duplication.

---

## Kaip pakeisti vendor (this strategy's test)

Priežastis kodėl visa tai darom — kad šitas žingsnių sąrašas liktų trumpas.

**Pavyzdys: switching Resend → Mailgun**

1. Pridėti `MAILGUN_API_KEY` į Vercel env (visi environments)
2. Perrašyti `lib/resend.ts` kviesti Mailgun vietoj Resend — išlaikyti function signatures (`sendEmail(...)`)
3. Optionally rename'inti failą į `lib/email.ts` (function names yra contract, ne file name)
4. Update'inti endpoint imports jei file renamed (find/replace)
5. Deploy į preview, send vieną test email, verify
6. Deploy į production
7. Pašalinti `RESEND_API_KEY` iš Vercel po 7 dienų clean Mailgun logs

**Jokio endpoint kodo keitimo.** Tai yra goal'as.

---

## Esamas `lib/` inventory (Veriva)

Iš Empirra sukopijuota:
- `auth.ts` — per-endpoint `x-api-key` verify (Edge runtime variantas)
- `errors.ts` — typed Error subclasses
- `logger.ts` — structured logging
- `ratelimit.ts` — IP-based rate limiting
- `resend.ts` — Resend wrapper
- `response.ts` — JSON response helpers (Edge runtime variantas)
- `supabase.ts` — Supabase service-role client

**Trūksta** (sukurti kai prireiks):
- `claude.ts` — Claude API wrapper (kai blog-gen automatika)
- `validate.ts` — `requireFields`, `validateEmail`, `sanitizeString`
- `timeout.ts` — `withTimeout(promise, ms)` helper
- `slack.ts` — alert webhook (jei reikės monitoring)

---

## Anti-patterns (mokinamės iš Empirra)

| Pattern | Kodėl failed | Replacement |
|---------|--------------|-------------|
| Shared `API_KEY` across endpoints | Vienas leak compromise'ino viską (Empirra s21 KI-006) | Per-endpoint `*_SECRET` (`lib/auth.ts`) |
| Inline `createClient(...)` endpoint'e | 8 endpoint'ai, 8 kopijos, drift'inančios versijos | Single `lib/supabase.ts` import |
| Bare-string errors | Negalėjom kategorizuoti incidents | Typed errors `lib/errors.ts` |
| `console.log` everywhere | Vercel log search useless | Structured logs per `lib/logger.ts` |
| Module-level caches | Veikė dev'e, leak'ino prod'e | Stateless wrappers, caller sprendžia |
| Per-use-case email wrappers | Kiekvienas Resend change lūžo 4 failus | Vienas `lib/resend.ts`, callers compose'ina |

---

## NEVER

- Importuoti vendor SDKs tiesiogiai endpoint'uose
- Reuse'inti secret across endpoints
- Pridėti module-level mutable state
- Throw'inti strings vietoje typed errors
- `console.log` production code paths
- Kurti wrapper'į "just in case" — laukti antro caller'io
- Tyliai swallow'inti vendor errors `lib/` viduje
