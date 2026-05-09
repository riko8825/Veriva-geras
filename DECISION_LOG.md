# DECISION_LOG — Veriva

Architektūriniai sprendimai. Kiekvienas su data, kontekstu, alternatyvomis, sprendimu.

---

## 2026-05-09 — Stack: Vercel + Supabase + Resend

**Kontekstas**: Reikia parinkti backend stack naujam Veriva projektui.

**Alternatyvos**:
- A) Vercel Edge Functions + Supabase + Resend (Empirra stack)
- B) Tik Vercel Edge Functions (be DB)
- C) Next.js full-stack

**Sprendimas**: A — toks pat kaip Empirra.

**Priežastis**:
- Reusable `/lib/` wrapperiai jau yra Empirra projekte
- Ta pati env var konvencija (atskiri `*_SECRET` per endpoint)
- Greitesnis development — known patterns
- Be vendor lock-in (galim migruoti)

**Trade-off**: Reikia kopijuoti `/lib/*` failus iš Empirra (NE importuoti — kiekvienas projektas save-contained).

---

## 2026-05-09 — Multi-page architektūra (ne SPA)

**Kontekstas**: `index.html` yra 354KB monolitas. Reikia spręsti — tęsti single-page ar pereiti į multi-page.

**Alternatyvos**:
- A) Single-page (visi sections viename HTML)
- B) Multi-page (atskiri HTML failai per puslapį)
- C) SPA (React/Vue)

**Sprendimas**: B — multi-page (HTML/CSS/JS).

**Priežastis**:
- SEO: kiekvienas puslapis = atskira indexable entity, atskira meta strategija
- Performance: mažesni bundle'ai per puslapį, geriau Core Web Vitals
- Maintenance: lengviau atnaujinti vieną puslapį be visumos
- Empirra naudoja tą patį — patikrinta praktika
- BDAR puslapio reikalavimai (privatumas, slapukai) — privalomi atskiri puslapiai

**Trade-off**: Komponentų reuse per HTML kopijavimą (nav, footer kartojasi). Sprendimas — `assets/css/components.css` ir bendri JS moduliai.

---

## 2026-05-09 — Frontend: vanilla HTML/CSS/JS (be framework'o)

**Kontekstas**: Pasirinkti frontend stack.

**Sprendimas**: Vanilla HTML/CSS/JS, be framework'o.

**Priežastis**:
- Empirra konvencija
- Geriausias Core Web Vitals score
- Mažesnis JS bundle = greitesnis FCP/LCP
- Nereikia build pipeline (išskyrus minify)
- Lengviau debug'inti

---

## 2026-05-09 — Globalūs agentai/skills, ne projekto-specific

**Kontekstas**: Reikia pasiimti Empirra agentus ir skills į šį projektą.

**Sprendimas**: NIEKO nekopijuoti — visi agentai/skills jau global'ūs (`~/.claude/agents/`, `~/.claude/skills/`), prieinami iš bet kurio projekto.

**Priežastis**:
- DRY — vienas šaltinis
- Atnaujinimai automatiški visiems projektams
- Projekto `.claude/` paliekam tuščią — naudosim TIK jei reikės projekto-specific override

**Trade-off**: Jei kuriam projektui reikės custom logikos — dėsim į projekto `.claude/agents/` (override'ina global).

---

## 2026-05-09 — Blog post URL: slug-only (be datos prefix)

**Kontekstas**: Empirra blog post'ai naudoja `/blog/2026-05-09-slug.html` formatą (data + slug). Reikia spręsti — laikytis tos pačios konvencijos ar keisti.

**Alternatyvos**:
- A) `/blog/{YYYY-MM-DD}-{slug}.html` (Empirra)
- B) `/blog/{slug}.html` (slug-only)
- C) `/blog/{category}/{slug}.html` (nested by category)

**Sprendimas**: B — slug-only.

**Priežastis**:
- Geriau SEO — trumpesni URL'ai, lengviau dalintis
- Date prefix nereikalingas — `datePublished` yra schema.org metaduomenyse
- Lengviau redirect'inti jei reikia perpublikuoti / atnaujinti turinį (data nesikeičia URL'e)
- Nesikartoja konkurentų klaida (TGS Baltic, Sorainen naudoja date prefix → ilgesni URL'ai)

**Trade-off**: Reikia rūpintis slug unikalumu — pipeline'as (`blog-gen`) turės tikrinti ar slug jau egzistuoja.

**Implementacija**: žr. `docs/blog-content-rules.md` § 11.

---

## 2026-05-09 — Blog filtravimas: client-side, be paginacijos

**Kontekstas**: `blog.html` listing reikia parodyti post'us su kategorijų filtru. Spręstina — server-side ar client-side, su pagination ar be.

**Alternatyvos**:
- A) Static HTML su client-side filtru (visi post'ai DOM'e iš karto)
- B) Server-side rendering + URL params (`/blog.html?cat=bdar`)
- C) JS framework (React/Vue) su API call

**Sprendimas**: A — static HTML, client-side `filterPosts()`, BE paginacijos.

**Priežastis**:
- Pradinėje stadijoje (0-30 post'ų) — visi telpa į vieną HTML failą
- Be paginacijos — geriau UX (vienas filter click = momentinis rezultatas)
- Ne reikia backend endpoint'o ar JS framework'o
- SEO friendly — visi post'ai indexable iš vieno URL'o
- Performance OK kol < 50 post'ų DOM'e

**Trade-off**: Kai pasieks 30+ post'ų — reikės migruoti į server-side rendering arba pagination JS'u. Tai yra **planuotas re-architecture point**.

**Migracijos trigger**: Kai blog.html viršys 200KB arba > 30 post'ų.

---

## 2026-05-09 — Blog docs: 3 failai (rules + keywords + system prompt), ne 1

**Kontekstas**: Reikia paruošti dokumentaciją blog-gen automatizacijai. Pasirinkimas — vienas didelis dokumentas ar suskirstyti.

**Alternatyvos**:
- A) Vienas `docs/blog.md` su viskuo
- B) Trys atskiri: `blog-content-rules.md` + `blog-keywords.md` + `blog-system-prompt.md`
- C) Du: `blog-content.md` + `blog-automation.md`

**Sprendimas**: B — trys atskiri failai.

**Priežastis**:
- **Atsakomybės atskyrimas**: rules = žmogui rašyti, keywords = SEO strategui, system prompt = pipeline'ui
- **Atnaujinimo dažnumas skiriasi**: rules — retai, keywords — kas 2-3 mėn., system prompt — kai keičiasi Claude API arba template
- **Claude API context**: blog-gen pipeline pakraus TIK `blog-system-prompt.md` (~150 eil.) į system prompt — netraukti viso 600+ eilučių rules dokumento
- **Skaitomumas**: 200-300 eil. failai > 800+ eil. monolito

**Trade-off**: Reikia palaikyti cross-references tarp 3 failų (žr. § "Susiję failai" kiekvieno gale).

---

## 2026-05-09 — Blog template'as: client-side filtras vs server-rendered

**Kontekstas**: `blog/template.html` turi 19 `{{placeholder}}` laukų. Spręsta — naudoti SSR template engine (Eta/Handlebars) ar paprastą `replaceAll()`.

**Sprendimas**: Paprastas `template.replaceAll('{{KEY}}', value)` Vercel Edge Function viduje.

**Priežastis**:
- Edge runtime nepalaiko Node.js template engine'ų lengvai
- 19 placeholder'ių — užtenka native string ops
- Be papildomos dependency
- Lengviau debug'inti — paleidi `cat template.html | sed ...` ir matai output'ą

**Trade-off**: Jei template'as išaugs (50+ placeholder'ių) arba reikės conditional rendering — migruosim į Eta arba simply move logic into the post body.
