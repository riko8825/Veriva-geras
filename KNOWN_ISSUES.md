# KNOWN ISSUES — Veriva

Bug registras. Atnaujinti kai aptinkama problema arba ji išsprendžiama.
Uždarytus issues perkelti į `## Išspręsta` skyrių (ne trinti).

**SLA klasifikacija:**
- 🔴 Critical — sistema neveikia, leads pametami, BDAR breach (fix šią sesiją)
- 🟠 High — svarbi funkcija sulaužyta, workaround yra (fix šią savaitę)
- 🟡 Medium — veikia, bet neoptimaliai (fix kai leidžia laikas)
- ⚪ Low — kosmetika, dokumentacija (fix kai patogu)

---

## Aktyvūs issues

### KI-001 — Blog placeholder linkai veda į 404 (4/6 pataisyta)
- **SLA:** 🟠 High
- **Paveiktas blokas:** `index.html` blog teaser + `blog.html` listing
- **Statusas:** Partial (4/6 fixed)
- **Aprašas:** ~~6~~ **2** placeholder blog kortelės blog.html nukreipia į neegzistuojančius URL'us: `/blog/incidentu-valdymas-72h.html`, `/blog/darbuotoju-bdar-mokymai.html`.
- **Pataisyta (2026-05-10 nis2-phishing-publish):**
  - ~~`/blog/nis2-direktyva-praktiskai.html`~~ → `/blog/nis2-direktyva-lietuvoje.html` (PUBLISHED, 3700ž., 5 schemas)
  - ~~`/blog/phishing-darbuotoju-mokymai.html`~~ → `/blog/phishing-mokymai-darbuotojams.html` (PUBLISHED, 3100ž., 5 schemas)
- **Pataisyta (2026-05-10 blog-polish-publish):** `/blog/bdar-baudos-lietuvoje.html` (PUBLISHED, audit 19/20)
- **Pataisyta (2026-05-12 dpo-pillar-publish):** `/blog/dpo-funkcija-vadovas.html` (PUBLISHED, ~2977ž., 4 schemas — BlogPosting+Breadcrumb+FAQPage+HowTo. Pre-publish 4-agent ratas: frontend 16/20 + SEO 15/20 + QA 18/20 + marketing 15/20 po P0/P1 fix'ų)
- **Workaround:** Kortelėms uždėti `aria-disabled="true"` + `pointer-events:none` arba sukurti likusius post'us
- **Fix:** Sukurti likusius 2 post'us naudojant `blog/template.html` v2 + `/audit` + `/polish` workflow + pre-publish 4-agent ratas
- **Atidarytas:** 2026-05-09 | **Paskutinis update:** 2026-05-12

---

### KI-002 — Newsletter forma neturi backend endpoint'o
- **SLA:** 🟠 High
- **Paveiktas blokas:** `blog.html:467` newsletter CTA
- **Statusas:** Open
- **Aprašas:** Forma rodo `alert()` po submit'o ir NESIUNČIA POST request'o. User įveda email — duomenys prarandami.
- **Workaround:** Nėra (UX wise'as bug'as — user mano, kad pavyko)
- **Fix:** Sukurti `api/forms/newsletter.ts` + Supabase `newsletter_subscribers` lentelė + Resend confirmation email
- **Atidarytas:** 2026-05-09

---

### KI-003 — sitemap.xml neapima blog URL'ų ✅ FIXED
- **SLA:** 🟡 Medium
- **Paveiktas blokas:** SEO indexavimas
- **Statusas:** **Fixed (2026-05-10)**
- **Aprašas:** `sitemap.xml` neturėjo `blog.html` ir blog post URL'ų — Google neindex'uotų blog turinio.
- **Resolution:**
  - Pridėtas `<image:image>` namespace (`xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`)
  - Pridėtas `/blog/bdar-baudos-lietuvoje.html` su `lastmod`, `priority` ir `image:image` (Google Image Search)
  - Atnaujinta `/blog` → `/blog.html` (faktinis URL)
- **Future**: Kai bus `api/internal/blog-publish.ts` — auto-update sitemap.xml po kiekvieno publish
- **Atidarytas:** 2026-05-09 | **Uždarytas:** 2026-05-10

---

### KI-004 — index.html monolitas (~1700 eil.) ✅ FIXED
- **SLA:** ~~🟡 Medium~~ → ✅ FIXED (2026-05-10 vercel-migration)
- **Paveiktas blokas:** maintainability, token cost
- **Statusas:** ✅ FIXED — CSS+JS extract'inta į /assets, index.html 1995 → 1127 lines (-43%)
- **Implementacija (commit `9328cef`):**
  - `assets/css/index.css` (590 lines, 32K) — pagrindinis CSS + slideUp keyframe
  - `assets/js/index.js` (276 lines, 11K) — widget logic, FAQ, modals, cookie banner
  - Cache-buster `?v=20260510` ant CSS+JS
  - JSON-LD schemos palikau inline (SEO geriau)
- **Token sutaupymas:** CSS keitimui 110K → 8K (-92%), JS keitimui 110K → 3K (-97%)
- **Liko (žemo prioriteto):** index.html dar 339K (1127 lines) — viršija Read 25K limit'ą. HTML kontento (modal'ų) extract'inimas reikalautų JS fetch'inio infrastruktūros — out of scope. Žr. DECISION_LOG.
- **Atidarytas:** 2026-05-09 | **Uždarytas:** 2026-05-10

---

### KI-005 — Privatumas.html ir slapukai.html neegzistuoja ✅ FIXED
- **SLA:** 🟠 High → ✅ resolved
- **Paveiktas blokas:** BDAR atitiktis
- **Statusas:** ✅ FIXED 2026-05-10 (privatumas-html sesija, commit `9efb0d0`)
- **Aprašas:** Veriva = duomenų apsaugos kompanija. Savo svetainė BE Privacy Policy ir Cookie Policy = brand'ui kritinė problema + teisinis pažeidimas.
- **Full fix progress:**
  - ✅ `slapukai.html` — LIVE (commit `0e51dcf`, 2026-05-10 cookiebot-integration): 9-skyrių BDAR-compliant politika + Cookiebot CookieDeclaration auto-list + `Cookiebot.renew()` mygtukas
  - ✅ Cookiebot CMP — LIVE auto-blocking režimu (Domain group ID `bc31b2c9-a2b7-44e8-a3a2-624b027ba646`), 6 puslapiuose
  - ✅ `privatumas.html` — LIVE (commit `9efb0d0`, 2026-05-10 privatumas-html): 10 skyrių BDAR Privacy Policy (454 lines) — duomenų valdytojas, renkami duomenys (kontakto forma + brief.html + susirašinėjimas + techniniai), tikslai+pagrindas (lentelė: 7 tikslai × BDAR 6 str.), saugojimo terminai (7 kategorijos), sub-processors lentelė (Vercel/Resend/Cookiebot/Hostinger/Zoho), perdavimas už ES (SCC 2021/914), 8 BDAR teisės (15-22 str.), Cookiebot.renew CTA, VDAI skundai
  - ✅ 6 footer link sync: index.html modal-privacy + cf-privacy → `/privatumas.html`; 4 blog files (3 post + template) `/#kontaktai` → `/privatumas.html` + `/slapukai.html`
- **Production verify:** `https://veriva.lt/privatumas` 200 OK, Vercel build Ready 12s
- **Atidarytas:** 2026-05-09 | **Partial fix:** 2026-05-10 cookiebot | **FULL FIX:** 2026-05-10 privatumas-html

---

### KI-006 — Šios sesijos pakeitimai NIEKADA NEPATIKRINTI naršyklėje ✅ FIXED
- **SLA:** 🟠 High
- **Paveiktas blokas:** `index.html` blog teaser, `blog.html` listing, `blog/template.html`, `blog/bdar-baudos-lietuvoje.html`
- **Statusas:** **Fixed (2026-05-10)**
- **Aprašas:** Joks dev server nebuvo paleistas, joks Vercel preview nedeploy'intas.
- **Resolution:**
  - Paleistas `python -m http.server 8000` lokaliai
  - Live HTTP statusų patikrinimas: visi 200 OK (`/`, `/blog.html`, `/blog/bdar-baudos-lietuvoje.html`, `/sitemap.xml`, SVG iliustracijos)
  - Vizualinis testavimas: nav (Ctrl+F5 su naujais šriftais), FAQ accordion (12 Q&A), CTA mygtukų matomumas, hero typography
  - Audit health 19/20 po polish pass
- **Future**: Vercel preview deploy testavimas po pirmo `git push origin main`
- **Atidarytas:** 2026-05-09 | **Uždarytas:** 2026-05-10

---

### KI-007 — Joks API endpoint nepaleistas/neištestuotas
- **SLA:** 🟠 High
- **Paveiktas blokas:** `api/forms/contact.ts`, `api/internal/health.ts`
- **Statusas:** Open
- **Aprašas:** Endpoint'ai parašyti, bet niekada nesiųsta nei vieno test request'o. Validacijos, auth, DB write — visa neverified.
- **Workaround:** Nėra
- **Fix:** Naudoti `/test-contact` skill'ą po Vercel preview deploy. Smoke test'as iš `TEST_PROTOCOL.md`.
- **Atidarytas:** 2026-05-09

---

### KI-008 — Supabase migracijos production neištaisytos
- **SLA:** 🔴 Critical (kai bus deploy)
- **Paveiktas blokas:** `migrations/001_init.sql`
- **Statusas:** Open
- **Aprašas:** `migrations/001_init.sql` turi `leads`, `audit_requests`, `newsletter_subscribers` lenteles + RLS. SQL niekada nepaleistas Supabase production projekte (Supabase dar ne setup).
- **Workaround:** Negalima deploy'inti Vercel be Supabase setup'o
- **Fix:** Sukurti Supabase projektą → paleisti `001_init.sql` SQL Editor'iuje → patikrinti RLS politikas → pridėti `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` į Vercel env
- **Atidarytas:** 2026-05-09

---

### KI-009 — P1 audit fixes nepatraukti naujuose 2 postuose (NIS2 + Phishing)
- **SLA:** 🟡 Medium
- **Paveiktas blokas:** `blog/nis2-direktyva-lietuvoje.html`, `blog/phishing-mokymai-darbuotojams.html`
- **Statusas:** Open
- **Aprašas:** Pre-publish audit ratas (SEO + QA + frontend + marketing) rado 14 P1 fixes. Push'inta tik su 6 P0 fixes. Likę 8 P1:
  1. `<time datetime="2026-05-10">` markup trūksta abu (paveldėta iš BDAR template'o)
  2. Keyword density per aukšta: NIS2 "NIS2" 6.2% (191×) → ≤3% per sinonimus, Phishing "phishing" 7% (217×) → ≤3%
  3. Phishing "Lietuv*" tik 6 paminėjimai (NIS2 turi 43) — B2B LT targeting silpnas
  4. TL;DR / Key takeaways blokas — abu neturi (2026 GEO standartas)
  5. NIS2 → Phishing cross-link trūksta (Phishing → NIS2 yra)
  6. FAQ accordion JS ne IIFE wrapped (nesutampa su template stiliumi)
  7. Testimonial `aria-label` ant `<div>` → `role="img"` papildymas
  8. "Susiję straipsniai" vizualus blokas po FAQ — template'o `{{RELATED_POSTS_HTML}}` placeholder neperduotas
- **Workaround:** Yra (postai veikia, score 17-19/20)
- **Fix:** P1 batch sesija per `frontend-revizorius` + `seo-specialistas` polish workflow. ~1.5 val. darbo abiem postams. Po fix → re-audit → score ~20/20.
- **Atidarytas:** 2026-05-10

---

### KI-010 — Live veriva.lt po pirmo deploy (`d9cc6e7`) NEPATVIRTINTAS ✅ FIXED
- **SLA:** ~~🟠 High~~ → ✅ FIXED (2026-05-10 vercel-migration)
- **Paveiktas blokas:** Vercel deploy, DNS, SSL
- **Statusas:** ✅ FIXED — root cause: Vercel build fail'inosi 9× per 21h dėl invalid `runtime: edge` config
- **Aprašas (originalus):** Po `git push origin main` (commit `d9cc6e7`) deploy buvo paleistas, bet patikrinus per Vercel CLI rasta — visi 9 paskutiniai deploy'ai (Production + Preview) → Error per 2-3s. Paskutinis sėkmingas deploy 48 dienų senas (commit'ai nepasiekė production'o).
- **Root cause:** `vercel.json` `functions` blokas su `"runtime": "edge"` — formatas deprecated, Vercel reikalauja arba pilnos versijos arba runtime'o per-file
- **Fix #1 (`fca76a9`):** Pašalintas `functions` blokas iš `vercel.json` (TS failai jau turi `export const config = { runtime: 'edge' }`)
- **Fix #2 (`6974806`):** Pridėtas `"buildCommand": null` + `"outputDirectory": "."` (statinė svetainė root'e, ne `/public/`)
- **Verify:** Build #2 (`lyvbrbbmk`) READY 27s, 10 URL 200 OK ant `veriva-geras.vercel.app`, DNS propagated, `www.veriva.lt` LIVE su Vercel SSL
- **Atidarytas:** 2026-05-10 | **Uždarytas:** 2026-05-10

---

### KI-011 — Apex SSL sertifikatas (`https://veriva.lt/`) dar neissued ✅ FIXED
- **SLA:** ~~🟡 Medium~~ → ✅ FIXED (2026-05-10 ~09:20 UTC)
- **Paveiktas blokas:** Vercel SSL, apex domain
- **Statusas:** ✅ FIXED — Let's Encrypt sertifikatas išduotas auto per ~1.5h po DNS migration
- **Aprašas:** Po DNS migration (~07:50 UTC) `www.veriva.lt` gavo SSL per ~5 min, bet apex `veriva.lt` (be www) sertifikato dar neturėjo — Vercel laukė pilno DNS propagation. Naršyklė rodė `SEC_E_WRONG_PRINCIPAL` warning'ą.
- **Resolution (auto, 09:20 UTC):** Vercel auto-issued Let's Encrypt sertifikatą `CN=veriva.lt`. Verify: `https://veriva.lt/` → 307 redirect → `https://www.veriva.lt/` su `Server: Vercel`, HSTS `max-age=63072000`, jokio TLS warning'o.
- **Atidarytas:** 2026-05-10 | **Uždarytas:** 2026-05-10 (~1.5h trukmė)

---

### KI-012 — DPO straipsnis naudoja bdar-baudos hero SVG (placeholder)
- **SLA:** ⚪ Low
- **Paveiktas blokas:** `blog/dpo-funkcija-vadovas.html` hero img, og:image, twitter:image, BlogPosting schema image, HowTo schema image (5 vietos), sitemap.xml image:image
- **Statusas:** Open — placeholder accepted, dedicated SVG laukia dailininko
- **Aprašas:** Naujas DPO pillar straipsnis publikuotas naudojant `bdar-baudos-hero.svg` kaip placeholder (kito straipsnio hero). OG/Twitter share preview rodys klaidingą vaizdą.
- **Impact:** Mažas — turinys teisingas, schema valid, SEO nepaveiktas; tik socialinis dalinimasis rodo klaidingą paveiksliuką
- **Workaround:** Hero img alt teisingas (DPO/BDAR 37 str.); placeholder kontekste tinkamas (BDAR brand)
- **Fix:** Sukurti dedicated `dpo-funkcija-vadovas-hero.svg` 1200×630, brand spalvos (--ink fone, --blue + --gold accent), tema: BDAR 37 str. ikonografija + DPO pasirinkimo grafas. Atnaujinti 6 vietas (5 HTML + 1 sitemap.xml).
- **Atidarytas:** 2026-05-12

---

### KI-013 — Redirect Architecture Normalization (apex ↔ www + .html stripping inconsistency)
- **SLA:** 🟡 Medium
- **Paveiktas blokas:** Vercel routing visam projektui (`vercel.json`), `sitemap.xml`, kanoninės URL'ai visuose HTML failuose, vidiniai linkai
- **Statusas:** Open — atskira sesija reikalinga (NE quick fix, didelė rizika)
- **Aptiktas:** 2026-05-12 s18 post-deploy SEO verification (seo-specialistas agent)

**Aprašas — double redirect chain:**

`https://veriva.lt/blog/dpo-funkcija-vadovas.html` rezultatas:
1. `veriva.lt/blog/dpo-funkcija-vadovas.html` → **307 Temporary Redirect** → `www.veriva.lt/blog/dpo-funkcija-vadovas.html`
2. `www.veriva.lt/blog/dpo-funkcija-vadovas.html` → **308 Permanent Redirect** → `www.veriva.lt/blog/dpo-funkcija-vadovas` (be `.html`)

**Konfliktai:**
- **Canonical mismatch**: HTML `<link rel="canonical">` rodo `https://veriva.lt/blog/dpo-funkcija-vadovas.html` (apex + .html), bet galutinis live URL = `https://www.veriva.lt/blog/dpo-funkcija-vadovas` (www + be .html)
- **Sitemap inconsistency**: `sitemap.xml` rodo apex URL'us su `.html` blog'ams ir be `.html` paslaugų puslapiams (kiti puslapiai: `/paslaugos`, `/apie`, `/kainos` — be ext)
- **Schema.org `@id` mismatch**: BlogPosting `@id` = apex + .html, bet faktinis indeksuojamas URL = www be .html
- **Internal links mix**: HTML faile vidiniai linkai naudoja `/blog/{slug}.html` formatą (su .html), Vercel reasigna juos į be .html

**Impact:**
- **PageRank dilution**: Google index'uoja www be .html, bet canonical signal'as veda kitur — split signal'ai
- **Crawl budget waste**: kiekvienas crawl'as = 2 redirect'ai prieš final URL
- **PSI/PageSpeed score**: papildomas 200-400ms RTT per redirect'us
- **Mobile users**: 2× DNS lookup + TLS handshake (jei www naudojamas pirmą kartą)
- **Vis tiek INDEXUOJAMAS**: nestabdo Google'o, bet ne optimalu

**Paveikti URL tipai** (visi 12+ puslapių):
- `/` (apex root)
- `/blog.html` ir `/blog/{slug}.html` (4 postai)
- `/paslaugos`, `/apie`, `/kainos`, `/kontaktai` (planuojami)
- `/privatumas`, `/slapukai` (jau live)
- `sitemap.xml`, `robots.txt`

**Workaround (current):** None. Google'as vis tiek indeksuoja, tik mažiau efektyviai.

**Fix (atskira sesija, ~30-60 min):**

1. **Redirect audit**: `curl -ILv` visiems 12+ URL'ams (apex ir www, su .html ir be) — užfiksuoti pilną redirect grafiką
2. **Canonical audit**: visi HTML failai → grep `<link rel="canonical">` + `schema:url` + `schema:@id` → pasirinkti vieną source of truth
3. **Sitemap normalization**: visi URL'ai vienodu formatu (vienas iš: `apex + .html`, `www + .html`, `apex be .html`, `www be .html`)
4. **Internal link cleanup**: visi HTML failai → konsistencijos atvejis (visi linkai į `/blog/{slug}.html` ARBA visi į `/blog/{slug}` — bet ne mix)
5. **vercel.json consolidation**: vienas redirect'as (NE chain'as):
   - Variantas A: `www → apex` + palikti `.html` (mažiau pakeitimų)
   - Variantas B: `apex → www` + nustatyti `cleanUrls: true` (geriau, bet daug canonical pakeitimų)

**Rizikos (kodėl NE quick fix):**
- ❌ Redirect loop'ai (jei misconfig'as)
- ❌ Existing indexed URLs (Google jau indeksavo www be .html — naujas redirect'as sukurs 404/301 spike)
- ❌ Sitemap.xml broken state — Google Search Console errors
- ❌ Canonical → live URL mismatch persists, jei tik dalis stack'o atnaujinta
- ❌ Backward links iš LinkedIn share'ų / kitų puslapių su senais URL'ais

**Pre-fix checklist:**
- [ ] Pasidaryti `vercel.json` backup
- [ ] Užfiksuoti current redirect chain visiems URL'ams
- [ ] Google Search Console patikrinti, kokius URL'us Google jau indeksuoja
- [ ] Test stage'inant `vercel deploy --prod` ant preview before production

**Decision needed:** kuris URL formatas = canonical (rekomendacija: `https://www.veriva.lt/{path}` su `.html` — minimum pakeitimų, Google jau indeksuoja www).

- **Atidarytas:** 2026-05-12 (s18 post-deploy verification)
- **Priority:** Medium — neblokuoja core veiklos, bet kenkia SEO efektyvumui

---

## Issue šablonas (naujam issue)

```
### KI-XXX — [Trumpas pavadinimas]
- **SLA:** 🔴 Critical / 🟠 High / 🟡 Medium / ⚪ Low
- **Paveiktas blokas:** [endpoint / lib / puslapis / integration]
- **Statusas:** Open / In Progress / Fixed
- **Aprašas:** [Kas neveikia ir kada pastebėta]
- **Workaround:** [Kaip apeiti kol neišspręsta]
- **Fix:** [Ką reikia padaryti]
- **Correlation ID pavyzdys:** [jei yra iš automation_logs]
- **Atidarytas:** [data]
```

---

## Išspręsta

*Tuščia.*
