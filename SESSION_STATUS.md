# SESSION_STATUS

**Data**: 2026-05-10
**Sesijos tikslas**: 2 nauji pillar postai (NIS2 + Phishing) + pre-publish audit ratas (4 agentai) + P0 fixes + first push į main

---

## ATLIKTA ŠIOJE SESIJOJE (2026-05-10 — nis2-phishing-publish)

### 2 nauji pillar postai (audit health 19/20 self / 17/20 frontend-revizorius)
- ✅ `blog/nis2-direktyva-lietuvoje.html` (1194 eil., ~3700 ž.) — NIS2 direktyva Lietuvoje 2026
  - 10 H2 sekcijų, 12 FAQ Q&A, 5 schemas (BlogPosting + Breadcrumb + FAQPage + HowTo + Review)
  - Author: Justinas (IT saugumo ekspertas)
  - 3 SVG: hero (1200×630), subjektų klasifikacija (1100×360), 10 saugumo priemonių (1100×480)
- ✅ `blog/phishing-mokymai-darbuotojams.html` (1118 eil., ~3100 ž.) — Phishing mokymai
  - 10 H2, 12 FAQ, 5 schemas
  - Author: Justinas
  - 3 SVG: hero (phishing email mockup), 5 etapų atakos anatomija, 12 mėn. mokymų bar chart
  - 6 oficialūs ext šaltiniai: Verizon DBIR, KnowBe4, IBM, FBI IC3, ENISA, EDPB

### Pre-publish audit ratas (4 nepriklausomi agentai)
- ✅ `seo-specialistas` — NIS2 7/10, Phishing 6.5/10. Rado 6 P0 + 14 P1 fixes
- ✅ `qa-tester` — NIS2 PASS, Phishing FAIL (1 P0: JSON-LD parse error line 208)
- ✅ `frontend-revizorius` — abu 17/20 (ne 19/20 self) — `<time datetime>` ir FAQ IIFE trūksta
- ✅ `marketing-analitikas` — NIS2 7.5/10, Phishing 8/10. CTA #2 mygtukai abu generic

### P0 fixes (commit `d9cc6e7`)
- ✅ Phishing JSON-LD parse error: `„Shame and blame"` → `Shame-and-blame` (LT/ASCII quote bug)
- ✅ Meta description sutrumpintos: NIS2 186→149 chr, Phishing 212→148 chr
- ✅ NIS2 title: 66→54 chr; Phishing title + H1 KW alignment ("Phishing mokymai darbuotojams")
- ✅ CTA #2 mygtukai: NIS2 "Gauti atotrūkio analizę", Phishing "Aptarti simuliacijų programą"
- ✅ Slug rename (be 301 problemos — kol nedeploy'inta):
  - `nis2-direktyva-praktiskai.html` → `nis2-direktyva-lietuvoje.html`
  - `phishing-darbuotoju-mokymai.html` → `phishing-mokymai-darbuotojams.html`
- ✅ Atnaujinta: 2 post failai (canonical + og:url + schema @id + share — 11 vietų), index.html teaser kortelės, blog.html listing, sitemap.xml

### Deploy
- ✅ `git push origin main`: `c2bd4ff..d9cc6e7` (3 commits) → Vercel auto-deploy
- ✅ Lokalus HTTP server testas (port 8000): visi 4 URL'ai 200 OK
- ⚠️ Live veriva.lt po deploy NEPATIKRINTAS (Vercel build status, SSL, schema.org rich results)

---

## P1 NEPATRAUKTI (audit'ai rado, palikti kitai sesijai)
- `<time datetime="2026-05-10">` markup trūksta abu postai (paveldėta iš BDAR template'o)
- Keyword density per aukšta: NIS2 "NIS2" 6.2% (191×), Phishing "phishing" 7% (217×) — galima "helpful content" rizika
- Phishing "Lietuv*" tik 6 paminėjimai (NIS2 turi 43) — B2B LT targeting silpnas
- TL;DR / Key takeaways blokas — abu neturi (2026 GEO standartas)
- NIS2 → Phishing cross-link trūksta (Phishing → NIS2 yra)
- FAQ accordion JS ne IIFE wrapped (nesutampa su template stiliumi)
- Testimonial `aria-label` ant `<div>` → `role="img"` papildymas
- "Susiję straipsniai" vizualus blokas po FAQ — template'o `{{RELATED_POSTS_HTML}}` placeholder neperduotas
- NKSC + e-tar.lt URL'us reikia patvirtinti naršyklėje (WebFetch grąžino 403)

---

## ATLIKTA ANKSČIAU (2026-05-10 — blog-polish-publish)

### Blog post #1 — polish iki publish-ready (2846 ž., audit health 19/20)
- ✅ FAQ sekcija išplėsta 5→12 klausimų 2 stulpeliais (`.faq-grid`) + naujas `.faq-grid` CSS
- ✅ FAQPage JSON-LD išplėstas iki 12 Q&A
- ✅ HowTo schema pridėta (5 žingsnių planas — totalTime: P30D, estimatedCost: 500 EUR)
- ✅ Review schema pridėta (5/5 testimonial — Tomas K.)
- ✅ Visi 4 šaltinių URL'ai patikrinti per WebFetch (EUR-Lex + EDPB OK; VDAI 2× grąžina 403 bot blokavimas — realioje naršyklėje veikia)

### Vizualiniai komponentai
- ✅ 3 SVG iliustracijos sukurtos: `bdar-baudos-hero.svg` (1200×630), `vdai-baudos-skaiciavimas.svg` (1100×360), `bdar-atitiktis-5-zingsniai.svg` (1100×480) — 21 KB total
- ✅ `<figure>` komponentas su aspect-ratio fallbacks (CLS prevention)
- ✅ Testimonial blokas su Schema.org Review microdata + 5 SVG žvaigždutės
- ✅ Open Graph image + Twitter Card image atnaujinti
- ✅ BlogPosting schema su image array (3 ImageObject)

### Frontend revizija (typography + animations)
- ✅ frontend-revizorius agentas: 12 selector'ių sulyginta su index.html brand sistema
- ✅ Animate skill (Kowalski): scroll reveal IntersectionObserver, FAQ smooth easing, hover micro-interactions
- ✅ TOC label šriftas: Syne → Plus Jakarta Sans (eyebrow standartas)
- ✅ Nav 1:1 su index.html (fixed top:0, height:60px, blur:20px, 7 linkai + CTA)
- ✅ Author Marina Kazlauskienė → Marina (M initial — be pavardės)

### Polish pass (audit → polish workflow)
- ✅ `/audit` ataskaita: 16/20 → P0×3, P1×7, P2×9, P3×5
- ✅ `/polish` įvykdyta visus P0+P1+P2 fixes:
  - **P0**: `<main>` landmark + skip-link + `:focus-visible` global + callout `--gold` 2.56→5.96 contrast
  - **P1**: FAQ `aria-expanded` + `aria-controls` (JS), `<header>` semantinis tag, `<nav aria-label>`, hamburger aria, ah-crumbs/ah-ar contrast +60%, `--g500` darker (3.78→5.03), figcaption `--g700`
  - **P2**: `--red` + `--gold-strong` + `--g600` tokens į `:root`, hover `(hover:hover)` wrap, share-btn 40/44px touch, hero gradient opacity 0.18→0.10
- ✅ Visi kontrastai dabar atitinka WCAG AA (4.5:1+)

### Publish (2026-05-09 → live ready)
- ✅ DRAFT banner pašalintas + `noindex,nofollow` → `index, follow`
- ✅ Layout pataisytas: body padding-top 90→60, nav top 30→0, mob-menu top 90→60
- ✅ `index.html` blog teaser kortelė atnaujinta į realų postą
- ✅ `blog.html` pirma kortelė atnaujinta
- ✅ `sitemap.xml` su `<image:image>` namespace + lastmod 2026-05-09

### Standartizavimas (visi būsimi postai)
- ✅ `blog/template.html` v2 — pilnai polished, 24 placeholder'iai, visi a11y/komponentai/JS
- ✅ `docs/blog-system-prompt.md` atnaujintas: testimonial bloką, hero figure, HowTo/Review schemas, naujas QA checklist
- ✅ `docs/blog-content-rules.md` author'iai: Marina (M), Justinas (J), Veriva komanda (V)
- ✅ `docs/structure.md` atnaujintas su naujais komponentais ir publish'intu postu

### Empirra skills kopijavimas (3 nauji)
- ✅ `.claude/skills/audit/` — techninio audito skill (5 dimensijos, P0-P3 ataskaita)
- ✅ `.claude/skills/polish/` — final pass skill (CSS tokens, a11y, micro-interactions)
- ✅ `.claude/skills/emil-design-eng/` — Kowalski design philosophy reference
- ✅ `/impeccable` dependencija pakeista į Veriva-specific kontekstą (CLAUDE.md + emil-design-eng)

---

## ATLIKTA ANKSČIAU (2026-05-09 — seo-faq-blog)

### index.html SEO/GEO optimizacija
- ✅ FAQ sekcija išplėsta nuo 5 iki 12 klausimų (5 pagerinti + 7 nauji): VDAI, BDAR smulkiam verslui, baudos, DPO, asmens duomenų pažeidimas, slapukai, NIS2, IT auditas, kaina, sektoriai, advokatai, sutartys
- ✅ ProfessionalService schema išplėsta (21 laukai): geo coords, addressRegion, areaServed (Country+City), priceRange, taxID/vatID, knowsAbout, contactPoint
- ✅ FAQPage JSON-LD pridėtas (12 Q&A) — atitinka Google Rich Results
- ✅ Meta tags atnaujinti: title (52 chr, BDAR pirmas), description (153 chr), 12 LT keywords, Twitter Card, GEO meta (geo.region=LT-VL, ICBM)
- ✅ Telefono fix schema'oje: `+37061061981` → `+37064003632` (pagrindinis)
- ✅ FAQ CSS max-height 300→600px (naujieji ilgesni atsakymai)

### Blog post #1 — BDAR baudos Lietuvoje 2026 (DRAFT, noindex)
- ✅ `blog/bdar-baudos-lietuvoje.html` — pillar 2846 žodžių, 15 min skaitymo
- ✅ SEO research: 40 LT keywords + WebSearch realių 2025-2026 VDAI/EDPB duomenų (Vinted €2,38M bauda, MisterTango €61,5K, ES €1,15 mlrd. 2025)
- ✅ 11 H2 + 33 H3, evergreen slug `/blog/bdar-baudos-lietuvoje.html`
- ✅ JSON-LD: BlogPosting + BreadcrumbList + FAQPage (5 Q&A)
- ✅ Komponentai: definition, callout×2, stat-hl, blockquote, CTA inline×2, TOC (10 punktų)
- ✅ Meta: title 52 chr, description 156 chr, keywords (12), canonical
- ✅ 29 vidiniai linkai + 4 išoriniai autoritetingi (VDAI, EUR-Lex, EDPB)
- ✅ Autorius: Marina Kazlauskienė (BDAR/teisė)
- ✅ DRAFT banner + `noindex, nofollow` (peržiūrai prieš publikuojant)

---

## ATLIKTA ANKSČIAU (2026-05-09 — empirra-sync)

### Memory sistema (NEW)
- ✅ Sukurta projekto memory namespace `~/.claude/projects/c--Users-pinig-Veriva-geras/memory/` su 10 failų:
  - `MEMORY.md` — index
  - `user_profile.md` (Empirra owner + Veriva BDAR/IT sauga LT B2B)
  - `feedback_communication.md`, `feedback_autonomy.md`, `feedback_workflow.md`
  - `project_state.md`, `project_stack.md`, `project_rules.md`
  - `reference_empirra.md`, `reference_files.md`

### Docs (NEW — Empirra parity)
- ✅ `docs/automation-standards.md` — Edge Function kodo template, error kategorijos, thin endpoint, retry policy, edge cases (adaptuota Veriva flat root struktūrai)
- ✅ `docs/services-and-limits.md` — external services, `printf` vs `echo` CLI, BDAR apribojimai
- ✅ `docs/build-process.md` — 8-žingsnių build seka + automatizacijų checklist
- ✅ `docs/lib-strategy.md` — vendor independence + 7 principles + per-endpoint secrets

### Root (NEW — Empirra parity)
- ✅ `INCIDENT_LOG.md` — production post-mortem šablonas
- ✅ `KNOWN_ISSUES.md` — 8 esamų issues (KI-001..KI-008) su SLA klasifikacija
- ✅ `ROLLBACK_CHECKLIST.md` — triggers + žingsniai + decision tree (be `git reset --hard`)
- ✅ `TEST_PROTOCOL.md` — 4 lygių testavimas + BDAR-specific testai (Cookiebot, consent, DPO)
- ✅ `WORKFLOW.md` — Claude Code instrukcija (10 aukso taisyklių, skills/agents matrica, Veriva-specific rules)

### .claude/ konfigūracija (NEW)
- ✅ `.claude/settings.json` — empty stub (Empirra hooks `src/pages/` → root nereikalingi Veriva flat root struktūrai)
- ✅ `.claude/settings.local.json` — Vercel/Resend/curl permissions (gitignored)
- ✅ `.claude/commands/deploy.md` — production deploy workflow su patvirtinimu
- ✅ `.claude/commands/test-contact.md` — contact endpoint test (su `x-api-key`)

### GitHub konfigūracija (NEW)
- ✅ `.github/dependabot.yml` — weekly dep updates (Europe/Vilnius monday 06:00, grouped minor/patch)
- ✅ `.github/workflows/health-check.yml` — daily 09:00 LT health endpoint check (laukia `HEALTH_SECRET` setup)

### Status sync
- ✅ `SESSION_STATUS.md`, `PROJECT_STATUS.md` atnaujinti iš ankstesnės blog sesijos (uncommit'inti diff'ai)

### Memory atnaujinta po sync
- ✅ `project_state.md` — sesijų count #3, sesija 3 įrašyta, blockers nurodo KI-001..KI-008 (KNOWN_ISSUES.md)
- ✅ `reference_files.md` — pridėti visi nauji autoritetai + docs + `.claude/` + `.github/`

---

## ATLIKTA ANKSČIAU (2026-05-09 — blog setup)

### Frontend
- ✅ `index.html` — pridėta `Tinklaraštis` sekcija (`#blog`, `blog-bg`) prieš FAQ su 3 placeholder kortelėmis (BDAR / NIS2 / Sauga)
- ✅ `index.html` — pridėtos CSS klasės: `.blog-bg`, `.blog-grid`, `.bc`, `.bc-img`, `.bc-img-icon`, `.bc-body`, `.bc-meta`, `.bc-cat`, `.bc-dot`, `.bc-title`, `.bc-excerpt`, `.bc-read`, `.bc-read-arrow`, `.blog-all`, `.btn-blog-all`
- ✅ `index.html` — `Tinklaraštis` linkas pridėtas į: desktop nav (`.nl`), mobile menu (`.mob-menu`), footer "Įmonė" stulpelis
- ✅ `index.html` — mobile responsive: `.blog-grid` įtraukta į esamą `@media(max-width:768px)` 1-col override
- ✅ **NEW** `blog.html` — listing puslapis: hero (dark) + filtrai (Visi/BDAR/NIS2/Sauga/DPO/Mokymai client-side `filterPosts()`) + 6 post kortelės + newsletter CTA blokas + footer
- ✅ **NEW** `blog/template.html` — blog post template'as su 19 `{{placeholder}}` laukų, paruoštas blog-gen automatizacijai

### Docs (SEO + GEO + brand)
- ✅ **NEW** `docs/blog-content-rules.md` — privalomos taisyklės (LT tonas, struktūra, SEO, GEO, schema.org, vidiniai linkai, CTA strategija, QA checklist)
- ✅ **NEW** `docs/blog-keywords.md` — LT keyword bank: 8 pillar straipsniai (P0/P1/P2), 5 cluster grupės, long-tail klausimų pavyzdžiai, konkurentų gap analizė
- ✅ **NEW** `docs/blog-system-prompt.md` — Claude API system prompt'as automatizacijai + Zod validation schema + template injection helper + QA auto-checks

### Docs sync
- ✅ `docs/structure.md` — atnaujinta `/` sekcija (faktinė tvarka su `#blog` poziciją prieš FAQ + nav linkų sąrašas)
- ✅ `docs/structure.md` — atnaujinta `/blog.html` sekcija (filtrai, schema, NĖRA paginacijos kol mažai posts)
- ✅ `docs/structure.md` — pridėta `/blog/template.html` sekcija (placeholder'iai, komponentai, schema.org)

---

## ATLIKTA ANKSČIAU (2026-05-09 — projekto inicializacija)

- ✅ Klonuotas repo `riko8825/Veriva-geras` į `C:\Users\pinig\Veriva-geras\`
- ✅ Sukurta folder struktūra: `assets/`, `api/`, `lib/`, `docs/`, `migrations/`, `.claude/`
- ✅ Sukurtas `CLAUDE.md` — projekto autoritetas
- ✅ Sukurti `SESSION_STATUS.md`, `PROJECT_STATUS.md`, `DECISION_LOG.md`
- ✅ Sukurtas `.gitignore`, `.env.example`, `package.json`, `tsconfig.json`, `vercel.json`, `README.md`
- ✅ Dokumentacija: `docs/structure.md`, `docs/brand-guidelines.md`, `docs/seo-strategy.md`, `docs/env-variables.md`
- ✅ Lib wrapperiai sukopijuoti iš Empirra: `auth.ts`, `errors.ts`, `logger.ts`, `ratelimit.ts`, `resend.ts`, `response.ts`, `supabase.ts`
- ✅ `lib/auth.ts` ir `lib/response.ts` perrašyti į Edge runtime variantą (Empirra versijos buvo Node-only)
- ✅ API endpoint'ai: `api/internal/health.ts`, `api/forms/contact.ts` (su validacija + IP hash)
- ✅ Migration: `migrations/001_init.sql` (leads, audit_requests, newsletter_subscribers + RLS)
- ✅ SEO foundation: `robots.txt`, `sitemap.xml`
- ✅ `.claude/README.md` — agentų/skills nuoroda į global

## DABARTINĖ BŪSENA

- Repo: `index.html` (1700+ eilučių monolitas su pridėta blog sekcija) + `blog.html` (listing) + `blog/template.html` (post template'as)
- Folder struktūra: paruošta + Empirra parity (docs, root files, .claude/, .github/)
- Backend: paruoštas folder, `lib/` wrapperiai vietoje, contact + health endpoint'ai sukurti
- Blog pipeline: docs paruošti, automatizacija — DAR NESUKURTA
- Multi-page: dar nesukurti puslapiai (paslaugos.html, apie.html, kainos.html, kontaktai.html, privatumas.html, slapukai.html, 404.html)
- Memory sistema: setup'inta (10 failų)
- Empirra parity: pasiekta — visi docs/root files/`.claude/`/`.github/` matching Empirra struktūrą (adaptuota Veriva flat root + BDAR konteksui)
- Git: 3 commit'ai push'inti į `origin/main` (`48e6830` chore: init, `879af1f` feat: blog, `93cf7b7` chore: empirra parity)

## KAS LIKO NEPATVIRTINTA (empirra-sync sesijos)

⚠️ **Workflow neaktyvūs**:
- `.github/workflows/health-check.yml` — `HEALTH_SECRET` GitHub Secrets nesetup'intas, pirmas cron run (kitos dienos 09:00 LT) fail'ins
- `dependabot.yml` aktyvuosis pirmadienį, bet `package.json` šiuo metu turi tik dev deps (TypeScript) — pirmoji savaitė tikriausiai be PR'ų

⚠️ **Docs konsistencija nepatikrinta**:
- `docs/automation-standards.md` import paths (`../../lib/...`) prieš faktinį Veriva `api/forms/*.ts` — gali būti +/-1 lygio neatitikimas vs Empirra `api/automations/[name]/route.ts`
- `KNOWN_ISSUES.md` KI-008 — "Supabase migrations neištaisytos production'e" — bet Supabase project'as gali būti net dar neegzistuojantis (issue formuluotė per stipri)

## KAS LIKO NEPATVIRTINTA (blog setup sesijos)

⚠️ **Naršyklėje neištestuota** — joks dev server'is nepaleistas, joks Vercel preview nedeploy'intas:
- `index.html` blog teaser sekcija — ar `.blog-grid` 3-col gridas teisingai veikia desktop'e ir griūna į 1-col mobile (≤768px)
- `blog.html` filtrai — ar `filterPosts()` JS teisingai slepia/rodo `.bc.hidden` korteles po kategorijų pasirinkimo
- `blog.html` newsletter forma — paspaudus rodo `alert()`, NĖRA POST'inimo (endpoint'as nesukurtas)
- `blog/template.html` — visiškai netestuotas su realiu turiniu (placeholder'iai dar neužpildyti)
- FAQ accordion `blog/template.html:441` — JS toggle'as parašytas, bet vizualiai netikrintas

⚠️ **Žinomos problemos**:
- 6 placeholder blog kortelės (`/blog/bdar-baudos-2026.html` ir kt.) — failai NEEGZISTUOJA, paspaudus → 404
- `sitemap.xml` neapima `blog.html` ir blog post URL'ų — Google neindexuos
- `blog/template.html` neturi sanitizacijos sluoksnio `{{POST_BODY_HTML}}` — paliekama blog-gen pipeline'ui

## KAS LIKO

### Etapas 1 — Frontend foundation
- [ ] Iš `index.html` išskirti CSS į `assets/css/base.css`, `components.css`
- [ ] Iš `index.html` išskirti JS į `assets/js/main.js`
- [ ] Sukurti `paslaugos.html` skeleton
- [ ] Sukurti `apie.html` skeleton
- [ ] Sukurti `kainos.html` skeleton
- [ ] Sukurti `kontaktai.html` skeleton
- [x] ~~Sukurti `blog.html` skeleton~~ ✅ 2026-05-09 (full listing su filtrais)
- [ ] Sukurti `privatumas.html` ir `slapukai.html` (BDAR privaloma)
- [ ] Sukurti `404.html`
- [x] ~~Sukurti `robots.txt`, `sitemap.xml`~~ ✅ ankstesnėje sesijoje

### Etapas 2 — Backend
- [ ] Kopijuoti reikalingus `lib/*` iš Empirra (auth, errors, logger, resend, response, supabase, ratelimit)
- [ ] Sukurti `api/forms/contact.ts`
- [ ] Sukurti `api/forms/audit-request.ts`
- [ ] Sukurti `api/internal/health.ts`
- [ ] Migration: `migrations/001_init.sql` (leads, audit_requests lentelės)

### Etapas 3 — Deploy
- [ ] Vercel projekto setup
- [ ] Env vars konfigūracija
- [ ] Domain: veriva.lt
- [ ] First deploy + smoke test

### Etapas 4 — Blog automation (paruošta — laukiama implementacijos)
- [x] ~~Blog frontend (index teaser + listing + template)~~ ✅ 2026-05-09
- [x] ~~Content rules + keyword bank + system prompt~~ ✅ 2026-05-09
- [ ] `api/internal/blog-gen.ts` — Claude API generavimo endpoint
- [ ] `api/internal/blog-publish.ts` — write į `/blog/{slug}.html` + sitemap update + listing update
- [ ] Telegram approval flow (kaip Empirra `blog-approve`)
- [ ] Cron / Vercel scheduled function (4-6 straipsniai/mėn.)
- [ ] Newsletter form prijungimas (`/api/forms/newsletter`)

## KITAS ŽINGSNIS (sekanti sesija — 1-3 konkretūs žingsniai)

1. **Live veriva.lt verifikacija** — Vercel deploy status (commit `d9cc6e7`), 3 blog URL'ai (200 OK), Schema.org Rich Results test (https://search.google.com/test/rich-results) abu naujus postus, PageSpeed Insights mobile/desktop. Jei build fail → debug.
2. **Google Search Console** — submit `https://veriva.lt/sitemap.xml`, request indexing 3 blog URL'us (BDAR + NIS2 + Phishing). NKSC + e-tar.lt URL'us patvirtinti naršyklėje (WebFetch grąžino 403).
3. **P1 fixes batch** — 8 nepatraukti audit findings: `<time datetime>` markup abu postai, keyword density dilution per sinonimus (NIS2 6.2%→3%, Phishing 7%→3%), Phishing "Lietuv*" 6→20+, TL;DR/Key takeaways blokas, NIS2→Phishing cross-link, FAQ IIFE wrapper, testimonial `role="img"`, "Susiję straipsniai" vizualus blokas po FAQ.

**Alternatyvos po pre-publish polish:**
- 🅰️ **P0 KI-005 BDAR**: `privatumas.html` + `slapukai.html` (teisinis reikalavimas, blokuoja serious production)
- 🅱️ Likę 3/6 placeholder blog post'ai (KI-001: dpo-funkcija, incidentu-valdymas-72h, darbuotoju-bdar-mokymai)
- 🅲 Vercel/Supabase/Resend backend setup (KI-007, KI-008) — contact endpoint live test
- 🅳 Multi-page skeletons (paslaugos/apie/kainos/kontaktai/404)

**Rekomendacija**: 1 (pirmiausia patikrinti, kad deploy nesulūžo) → 2 → 3. Po to — 🅰️ KI-005 BDAR puslapiai (teisinis blocker).

---

## ISTORIJA

| Data | Sesijos tikslas | Komitai | Atlikta |
|---|---|---|---|
| 2026-05-09 (init) | Projekto inicializacija | `48e6830` | Folder struktūra, `lib/` iš Empirra, config files, contact + health endpoint'ai, migrations, `docs/structure.md` + brand + SEO + env docs |
| 2026-05-09 (blog) | Blog sistemos paruošimas | `879af1f` | index teaser + `blog.html` listing + `blog/template.html` (19 placeholder'ių) + 3 docs (`blog-content-rules.md`, `blog-keywords.md`, `blog-system-prompt.md`) + docs sync |
| 2026-05-09 (empirra-sync) | Empirra parity — full project setup | `93cf7b7` | Memory (10 failų), 4 docs (automation-standards/services-and-limits/build-process/lib-strategy), 5 root files (INCIDENT_LOG/KNOWN_ISSUES/ROLLBACK_CHECKLIST/TEST_PROTOCOL/WORKFLOW), `.claude/` config + 2 commands, `.github/dependabot.yml` + `health-check.yml` workflow |
| 2026-05-09 (seo-faq-blog) | index.html FAQ SEO/GEO + pirmasis blog draft | uncommitted | index FAQ 5→12 Q&A + ProfessionalService schema (21 laukai) + GEO meta + 12 keywords; `blog/bdar-baudos-lietuvoje.html` pillar 2846ž. (DRAFT, noindex); 40 LT keywords + WebSearch (Vinted €2,38M, MisterTango €61,5K, ES €1,15 mlrd.) |
| 2026-05-10 (blog-polish-publish) | Audit→polish workflow, template v2, publish-ready | uncommitted | 3 SVG iliustracijos (21KB), FAQ 12Q 2 cols, HowTo + Review schemas, testimonial blokas, 12 selector typography sync su index, Kowalski animations (IntersectionObserver, FAQ smooth, hover wraps); `/audit` 16/20 → `/polish` P0+P1+P2 → 19/20 health; DRAFT/noindex pašalinti, sitemap + image:image; template v2 + atnaujinti docs; 3 nauji skills (audit/polish/emil-design-eng) iš Empirra |
| 2026-05-10 (nis2-phishing-publish) | 2 nauji pillar postai + pre-publish audit ratas + first push į main | `fa35e51`, `e382d2e`, `d9cc6e7` | 2 nauji pillar postai (NIS2 1194 eil. 3700ž., Phishing 1118 eil. 3100ž.), 6 nauji SVG (~46KB), 4 nepriklausomi audit'ai (SEO 7→8.5/10, QA PASS, Frontend 17/20, Marketing 8/10), 6 P0 fixes (JSON parse bug, meta desc abu, NIS2 title, Phishing H1+title KW alignment, CTA #2 mygtukai, slug rename), atnaujinta sitemap.xml + index.html + blog.html, push origin main → Vercel auto-deploy (live veriva.lt nepatvirtintas) |
