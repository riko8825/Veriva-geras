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

### KI-001 — Blog placeholder linkai veda į 404 (3/6 pataisyta)
- **SLA:** 🟠 High
- **Paveiktas blokas:** `index.html` blog teaser + `blog.html` listing
- **Statusas:** Partial (3/6 fixed)
- **Aprašas:** ~~6~~ **3** placeholder blog kortelės blog.html nukreipia į neegzistuojančius URL'us: `/blog/dpo-funkcija-kada-reikia.html`, `/blog/incidentu-valdymas-72h.html`, `/blog/darbuotoju-bdar-mokymai.html`.
- **Pataisyta (2026-05-10 nis2-phishing-publish):**
  - ~~`/blog/nis2-direktyva-praktiskai.html`~~ → `/blog/nis2-direktyva-lietuvoje.html` (PUBLISHED, 3700ž., 5 schemas)
  - ~~`/blog/phishing-darbuotoju-mokymai.html`~~ → `/blog/phishing-mokymai-darbuotojams.html` (PUBLISHED, 3100ž., 5 schemas)
- **Pataisyta (2026-05-10 blog-polish-publish):** `/blog/bdar-baudos-lietuvoje.html` (PUBLISHED, audit 19/20)
- **Workaround:** Kortelėms uždėti `aria-disabled="true"` + `pointer-events:none` arba sukurti likusius post'us
- **Fix:** Sukurti likusius 3 post'us naudojant `blog/template.html` v2 + `/audit` + `/polish` workflow + pre-publish 4-agent ratas (lessons learned iš nis2-phishing-publish)
- **Atidarytas:** 2026-05-09 | **Paskutinis update:** 2026-05-10

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

### KI-005 — Privatumas.html ir slapukai.html neegzistuoja
- **SLA:** 🔴 Critical
- **Paveiktas blokas:** BDAR atitiktis
- **Statusas:** Open
- **Aprašas:** Veriva = duomenų apsaugos kompanija. Savo svetainė BE Privacy Policy ir Cookie Policy = brand'ui kritinė problema + teisinis pažeidimas.
- **Workaround:** Negalima deploy'inti į production be šių puslapių
- **Fix:**
  - `privatumas.html` — duomenų valdytojas, tikslai, teisinis pagrindas, saugojimo terminai, teisės, DPO kontaktas
  - `slapukai.html` — visi naudojami cookies + Cookiebot consent flow
  - Cookie consent banneris (Cookiebot) prieš GA4
- **Atidarytas:** 2026-05-09

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

### KI-011 — Apex SSL sertifikatas (`https://veriva.lt/`) dar neissued
- **SLA:** 🟡 Medium
- **Paveiktas blokas:** Vercel SSL, apex domain
- **Statusas:** Open (auto-fix laukiama)
- **Aprašas:** Po DNS migration (Hostinger A/CNAME → Vercel) `www.veriva.lt` gavo Let's Encrypt SSL sertifikatą per ~5 min. Bet apex `veriva.lt` (be www) sertifikato dar neturi — naršyklė rodo `SEC_E_WRONG_PRINCIPAL` warning'ą. HTTP atsako Vercel 307 → www.veriva.lt, bet TLS handshake fail'ina.
- **Workaround:** Naudoti `https://www.veriva.lt/` — apex 307 redirect veiks po SSL issue'o
- **Fix:** Vercel automatiškai išduos kai DNS pilnai propaguosis (per 1-24h). Jei per 24h ne — Vercel UI Domains → veriva.lt → "Refresh" mygtukas. Jei dar fail — ištrinti ir pridėti domain'ą iš naujo.
- **Atidarytas:** 2026-05-10

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
