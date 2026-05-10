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

### KI-004 — index.html monolitas (~1700 eil.)
- **SLA:** 🟡 Medium
- **Paveiktas blokas:** maintainability, page load time
- **Statusas:** Open
- **Aprašas:** `index.html` turi visą CSS ir JS inline. Reikia išskirti į `assets/css/` + `assets/js/`.
- **Workaround:** Veikia, bet sunku maintain'inti
- **Fix:** Išskirti CSS į `base.css` + `components.css` + `pages/index.css`; JS į `main.js`. Pasiremti `CLAUDE.md` "Niekada inline CSS/JS" taisykle.
- **Atidarytas:** 2026-05-09

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

### KI-010 — Live veriva.lt po pirmo deploy (`d9cc6e7`) NEPATVIRTINTAS
- **SLA:** 🟠 High
- **Paveiktas blokas:** Vercel deploy, 3 blog URL'ai, schema.org Rich Results
- **Statusas:** Open
- **Aprašas:** Po `git push origin main` (commit `d9cc6e7`, 3 commits) Vercel auto-deploy paleistas, bet sesijos pabaigoje NEPATVIRTINTA:
  - Vercel build status (sėkmingas / fail)
  - 3 blog URL'ų HTTP 200 (`https://veriva.lt/blog/{bdar,nis2,phishing}-...html`)
  - Schema.org Rich Results test (FAQ + HowTo + Review schemos atpažintos)
  - PageSpeed Insights mobile/desktop scores
  - SSL/HTTPS handshake
  - NKSC + e-tar.lt ext URL'us reikia patikrinti naršyklėje (WebFetch grąžino 403)
- **Workaround:** Lokalus HTTP server testas (port 8000) — visi 4 URL'ai 200 OK lokaliai
- **Fix:** Sekanti sesija — 1 žingsnis: `https://search.google.com/test/rich-results` su 3 URL'ais + PageSpeed test + Vercel dashboard build log peržiūra
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
