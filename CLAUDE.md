# CLAUDE.md — Veriva projektas

Kalba: **lietuvių**. Visada atsakyk lietuviškai.
Stack: HTML/CSS/JS · Vercel Edge Functions (TypeScript) · Supabase · Resend

---

## PROJEKTAS

**Veriva** — Duomenų apsauga (BDAR) ir kibernetinis saugumas Lietuvoje.
URL: https://veriva.lt
Domain: veriva.lt
Tikslinė auditorija: LT įmonės (B2B), kurioms reikia BDAR atitikties + IT saugumo
Konkurencinis pranašumas: **Teisė + IT vienoje komandoje**, 120+ klientų, €0 VDAI baudų nuo 2017 m.

---

## STACK

- **Frontend**: HTML/CSS/JS (multi-page, mobile-first, vanilla, be framework'ų)
- **Backend**: Vercel Edge Functions (TypeScript)
- **DB**: Supabase (Postgres + RLS)
- **Email**: Resend
- **Hosting**: Vercel
- **Analytics**: GA4 + GTM (vėliau)

Stack identiškas Empirra — naudojame tuos pačius `/lib/` wrapperius (kopijuojame iš Empirra, NE importuojame).

---

## PUSLAPIŲ STRUKTŪRA

| Puslapis | URL | Tikslas |
|---|---|---|
| Pagrindinis | `/` (index.html) | Hero, value prop, social proof, CTA |
| Paslaugos | `/paslaugos.html` | BDAR, IT auditas, DPO outsourcing, mokymai |
| Apie | `/apie.html` | Komanda, istorija, sertifikatai |
| Kainos | `/kainos.html` | Paketai, kainodara, FAQ |
| Blog | `/blog.html` | SEO straipsniai (BDAR, NIS2, DORA) |
| Blog post | `/blog/[slug].html` | Atskiras straipsnis |
| Kontaktai | `/kontaktai.html` | Forma, kontaktinė informacija |
| Privatumas | `/privatumas.html` | Privacy policy (BDAR — privaloma) |
| Slapukai | `/slapukai.html` | Cookie policy |
| 404 | `/404.html` | Klaidos puslapis |

---

## FOLDER STRUKTŪRA

```
Veriva-geras/
├── CLAUDE.md                 # Šis failas — projekto autoritetas
├── SESSION_STATUS.md         # Dabartinės sesijos status
├── PROJECT_STATUS.md         # Bendras projekto statusas
├── DECISION_LOG.md           # Architektūriniai sprendimai
├── README.md                 # Public README
├── .gitignore
├── .env.example              # Env variables šablonas
├── package.json              # TypeScript dev deps
├── tsconfig.json
├── vercel.json               # Vercel konfigūracija
│
├── index.html                # Pagrindinis
├── paslaugos.html
├── apie.html
├── kainos.html
├── blog.html
├── kontaktai.html
├── privatumas.html
├── slapukai.html
├── 404.html
├── robots.txt
├── sitemap.xml
│
├── assets/
│   ├── css/                  # Atskiri CSS failai (NE inline)
│   │   ├── base.css          # Reset, variables, typography
│   │   ├── components.css    # Buttons, cards, forms
│   │   └── pages/            # Page-specific styles
│   ├── js/                   # JS moduliai
│   │   ├── main.js           # Nav, mobile menu
│   │   └── forms.js          # Form validation + submit
│   └── img/                  # Optimizuoti paveikslėliai (WebP)
│
├── api/                      # Vercel Edge Functions
│   ├── forms/
│   │   ├── contact.ts        # Kontakto forma
│   │   └── audit-request.ts  # BDAR audito užklausa
│   └── internal/
│       └── health.ts         # Health check
│
├── lib/                      # Reusable wrapperiai (iš Empirra)
│   ├── auth.ts               # x-api-key validacija
│   ├── errors.ts             # Standartinės klaidos
│   ├── logger.ts             # Structured logging
│   ├── ratelimit.ts          # Rate limiting
│   ├── resend.ts             # Email wrapper
│   ├── response.ts           # JSON response helpers
│   └── supabase.ts           # Supabase client
│
├── docs/
│   ├── structure.md          # Detalus puslapių aprašymas
│   ├── brand-guidelines.md   # Spalvos, fontai, tonas
│   ├── seo-strategy.md       # Keywords, meta strategija
│   ├── env-variables.md      # Env vars dokumentacija
│   └── deploy.md             # Deploy procesas
│
├── migrations/
│   └── 001_init.sql          # Supabase schema
│
└── .claude/
    ├── agents/               # Projekto-specific agents (jei reikia)
    └── skills/               # Projekto-specific skills (jei reikia)
```

---

## DARBO REŽIMAI

| Režimas | Failas autoritetas | DoD |
|---|---|---|
| **Frontend** | šis CLAUDE.md, `docs/structure.md` | Veikia naršyklėje, mobile pass, Core Web Vitals OK |
| **Backend** | `docs/automation-standards.md` (iš Empirra) | Endpoint 200, logs clean, integracija OK |
| **Content/SEO** | `docs/seo-strategy.md` | Meta + H tags + schema.org pass |
| **Docs** | tas pats failas, ką redaguoju | Commit'inta |

---

## KONTROLĖS TAISYKLĖS

- Niekada inline CSS/JS (išskyrus critical CSS hero'jui)
- Niekada API keys į frontend ar git
- Webhook endpoints — `x-api-key` auth privalomas
- Atskiras `*_SECRET` env var per endpoint, NE shared
- Supabase RLS — visada įjungta
- Mobile-first — kiekvienas naujas komponentas
- LT kalba meta/copy, EN tik techninei dokumentacijai

---

## SESIJOS WORKFLOW

**Pradžia**: `/start-task` — perskaito CLAUDE.md, SESSION_STATUS.md, PROJECT_STATUS.md
**Pabaiga**: `/close-session` — atnaujina SESSION_STATUS.md, PROJECT_STATUS.md, DECISION_LOG.md

---

## AGENTAI (global, prieinami iš `~/.claude/agents/`)

- `page-builder` — naujų puslapių kūrimas
- `frontend-revizorius` — CSS/HTML/JS auditas, a11y, responsive
- `seo-specialistas` — meta tags, schema.org, keyword analizė
- `backend-engineer` — Vercel Edge Functions
- `integration-specialist` — Resend, išorinės integracijos
- `database-designer` — Supabase schema, RLS
- `solution-architect` — architektūra prieš kodą
- `debugger` — root cause analizė
- `qa-tester` — pre-deploy QA + security
- `marketing-analitikas` — CTA, conversion funnel
- `ai-prompt-engineer` — AI logika (jei bus AI funkcijos)

## SKILLS (global, prieinami iš `~/.claude/skills/`)

- `puslapis-naujas` — naujo puslapio workflow
- `mobilios-versijos` — mobile audit/fix
- `greitas-patikrinimas` — HTML/CSS/JS quick check
- `automacija-nauja` — backend automatizacija nuo nulio
- `debug-flow` — debug 7 lygiais
- `security-review` — saugumo checklist
- `seo-tekstai` — SEO + GEO tekstai
- `copy-editing` — copy auditas
- `pilnas-auditas` — visapusis auditas
- `start-task` / `close-session` / `docs-sync` — workflow

---

## BRAND (iš index.html)

```css
--ink: #07111f       /* pagrindinė tamsa */
--ink2: #0c1a2e
--blue: #1a47cc      /* pagrindinė akcento spalva */
--blue2: #2255e0
--cyan: #00b4d8
--red: #dc2626
--gold: #c8962a
--gold2: #e8b84b
--cream: #f8f7f4     /* fonas */
```

Fontai: **Syne** (display, h1-h2) + **Plus Jakarta Sans** (body)
Tonas: Profesionalus, autoritetingas, faktais paremtas. Be marketing'inio bullshit'o.

---

## REFERENCE: Empirra projektas

Empirra projekto kelias: `C:\Users\pinig\OneDrive\Stalinis kompiuteris\Automatiomm_empirra\empirra-website\`
Naudoti kaip referenciją:
- `lib/*` failai — kopijuoti į šį projektą
- `docs/automation-standards.md` — backend taisyklės
- `docs/env-variables.md` — env var konvencijos
- `vercel.json` struktūra
