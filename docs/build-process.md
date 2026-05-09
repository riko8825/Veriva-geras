# BUILD PROCESS — pilna seka (Veriva)

## 8-žingsnių tvarka (neskakti pirmyn)

1. **Design** — blokų schema: kokie moduliai, duomenų srautas, kas critical/optional
2. **Approval** — patvirtinti schemą prieš rašant kodą
3. **Block build** — vienas blokas vienu metu, su input/output contract + logging + fallback
4. **Block test** — testuoti tik tą bloką (success / fail / invalid input / timeout / empty)
5. **Integration** — jungti 2 blokus, testuoti srautą
6. **Smoke test** — pilnas greitas testas (forma → API → DB → email → UI)
7. **Deploy** — tik po testavimo, Slack alert
8. **Production verify** — realus testinis submit + logų patikra + status update

---

## AUTOMATIZACIJŲ DIZAINO PRINCIPAI

**Taisyklė 1 — Vienas blokas = viena atsakomybė**
Ne monolitas. Kiekvienas modulis daro vieną dalyką:
`contact-form` → `email-notify` → `crm-sync` (vėliau)
`blog-gen` → `blog-approve` → `blog-publish`

**Taisyklė 2 — Kiekvienas blokas turi kontraktą**

```
Input:  { name, email, company, message, consent }
Action: validuoja → rašo DB → grąžina lead_id
Output: { success: true, lead_id: "abc123", next_step: "email-notify" }
Error:  { success: false, code: "DB_WRITE_FAILED", message: "Lead not saved" }
Log:    start | success/fail | request_id | timestamp
```

**Taisyklė 3 — Validation prieš veiksmą**
Joks blokas nepradeda darbo kol nepatikrinta:
- Ar laukai užpildyti
- Ar env kintamieji egzistuoja
- Ar service wrapper gyvas (`lib/*` validation at module-load)
- Ar `x-api-key` teisingas (per endpoint)

**Taisyklė 4 — Fallback privalomas**
- Jei email-send nepavyko → įrašyti `email_status=failed` į DB + Slack alert
- Jei DB write nepavyko → negrąžinti success UI
- Jei response ne JSON → `r.text()` + try/catch JSON.parse (ne `r.json()`)

**Taisyklė 5 — Timeout logika**
Edge Function timeout: 25s. Ilgos operacijos: grąžinti response iš karto, tęsti async.

---

## STRUCTURE

```
api/forms/[name].ts            ← user-facing (contact, audit-request, newsletter)
api/internal/[name].ts         ← internal (health, blog-gen, blog-publish)
lib/supabase.ts                ← shared DB client
lib/claude.ts                  ← shared AI wrapper (kai bus blog-gen)
lib/resend.ts                  ← shared email wrapper
lib/logger.ts                  ← shared logging
lib/validate.ts                ← input validation
lib/auth.ts                    ← per-endpoint x-api-key verify
migrations/00X_*.sql           ← DB schema (run in Supabase SQL Editor)
docs/env-variables.md          ← env variables reference
```

- Kiekvienas endpoint = vienas `.ts` failas
- Importuoti iš `/lib` — niekada kopijuoti
- Logging privalomas (success + error)
- `process.env.*` tik — jokių hardcode

---

## NAUJOS AUTOMATIZACIJOS CHECKLIST

Prieš rašant kodą:

- [ ] Brief (input/output/integracijos)
- [ ] `solution-architect` approve
- [ ] Env vars sąrašas (`docs/env-variables.md` update)
- [ ] DB schema (jei reikia) — `migrations/00X_*.sql`
- [ ] `lib/auth.ts` `verify*Auth()` funkcija (per-endpoint secret)
- [ ] Endpoint'o `*_SECRET` env var sukurta Vercel + GitHub Secrets

Po kodo:

- [ ] Local test (`/test-contact` ar custom curl)
- [ ] `qa-tester` agent
- [ ] Vercel preview deploy
- [ ] Smoke test preview URL'e
- [ ] Production deploy
- [ ] Production verify (Vercel logs + Supabase + Resend)
- [ ] `PROJECT_STATUS.md` update — endpoint'as → 🟢 Live
- [ ] `DECISION_LOG.md` įrašas (jei buvo architektūrinis sprendimas)
