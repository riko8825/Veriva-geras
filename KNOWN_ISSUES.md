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

### KI-001 — Blog placeholder linkai veda į 404
- **SLA:** 🟠 High
- **Paveiktas blokas:** `index.html` blog teaser + `blog.html` listing
- **Statusas:** Open
- **Aprašas:** 6 placeholder blog kortelės nukreipia į `/blog/bdar-baudos-2026.html`, `/blog/nis2-direktyva.html` ir kt. — failai NEEGZISTUOJA. Production'e produktyš 404.
- **Workaround:** Kortelėms uždėti `aria-disabled="true"` + `pointer-events:none` arba sukurti vieną realų pillar straipsnį
- **Fix:**
  - Variantas A: sukurti realius post'us pagal `blog/template.html` (žr. `docs/blog-content-rules.md`)
  - Variantas B: padaryti kortelės non-clickable kol post'ai dar negeneruoti
- **Atidarytas:** 2026-05-09

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

### KI-003 — sitemap.xml neapima blog URL'ų
- **SLA:** 🟡 Medium
- **Paveiktas blokas:** SEO indexavimas
- **Statusas:** Open
- **Aprašas:** `sitemap.xml` neturi `blog.html` ir blog post URL'ų — Google neindex'uos blog turinio.
- **Workaround:** Manual `sitemap.xml` update kol bus auto-generation
- **Fix:**
  - Trumpalaikis: rankiniu būdu pridėti `blog.html` ir esamus blog post'us
  - Ilgalaikis: `api/internal/blog-publish.ts` automatizuotai update'ina sitemap po publish
- **Atidarytas:** 2026-05-09

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

### KI-006 — Šios sesijos pakeitimai NIEKADA NEPATIKRINTI naršyklėje
- **SLA:** 🟠 High
- **Paveiktas blokas:** `index.html` blog teaser, `blog.html` listing, `blog/template.html`
- **Statusas:** Open
- **Aprašas:** Joks dev server nepaleistas, joks Vercel preview nedeploy'intas. Blog teaser desktop/mobile responsive, blog.html `filterPosts()` JS, `blog/template.html` FAQ accordion — visi gali turėti vizualinių/funkcinių bug'ų.
- **Workaround:** Nėra — reikia testuoti
- **Fix:** Paleisti dev server (`npx vercel dev` arba `python -m http.server`), patikrinti visus 3 puslapius mobile + desktop
- **Atidarytas:** 2026-05-09

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
