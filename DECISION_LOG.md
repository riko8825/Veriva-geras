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

## 2026-05-09 — Empirra parity: pilna projekto sąranga, bet hooks/sync NEPERKELTI

**Kontekstas**: User paprašė "kurk tokį patį kaip Empirra. ir kad taip pat viskas būtų nustatyta". Reikia nuspręsti, kuriuos Empirra elementus kopijuoti 1:1, kuriuos adaptuoti, kuriuos praleisti.

**Alternatyvos**:
- A) 1:1 copy iš Empirra (visi failai + struktūra)
- B) Selective copy + adaptation (struktūra ta pati, turinys adaptuotas Veriva specifikai)
- C) Tik docs, be `.claude/`/`.github/`

**Sprendimas**: B — selective copy + adaptation.

**Kas perkelta 1:1 (struktūriškai):**
- `docs/automation-standards.md`, `services-and-limits.md`, `build-process.md`, `lib-strategy.md`
- `INCIDENT_LOG.md`, `KNOWN_ISSUES.md`, `ROLLBACK_CHECKLIST.md`, `TEST_PROTOCOL.md`, `WORKFLOW.md` šablonai
- `.github/dependabot.yml` (tas pats Europe/Vilnius schedule)
- `.claude/commands/deploy.md` šablonas

**Kas adaptuota (Veriva-specific):**
- Import paths: Empirra `api/automations/[name]/route.ts` (3 lygiai į `lib/`) → Veriva `api/forms/[name].ts` (2 lygiai)
- Per-endpoint secrets katalogas: `CONTACT_FORM_SECRET`, `AUDIT_REQUEST_SECRET`, `NEWSLETTER_SECRET`, `BLOG_GEN_SECRET`, `BLOG_APPROVE_SECRET`, `BLOG_PUBLISH_SECRET`, `HEALTH_SECRET`
- Pridėti BDAR-specific testai `TEST_PROTOCOL.md` (Cookiebot, consent flow, DPO)
- `KNOWN_ISSUES.md` — Veriva 8 issues (KI-001..KI-008), Empirra issues neperkelti
- `WORKFLOW.md` — pridėtas § 11 "Veriva-specific taisyklės" (BDAR-first, LT kalba)

**Kas NEPERKELTA (sąmoningai):**
- `.claude/settings.json` PostToolUse hook (`src/pages/X.html` → root sync) — Veriva turi flat root, sync nereikalingas
- `.claude/commands/sync-pages.md` — neaktualu (nėra `src/pages/`)
- `.claude/commands/test-lead.md` → adaptuota į `test-contact.md` (Empirra naudoja `lead-capture` endpoint'ą, Veriva — `forms/contact`)
- `.github/workflows/booking-check.yml` ir `weekly-digest.yml` — Empirra-specific endpoint'ai (booking-monitor, weekly-digest), Veriva tų neturi. Vietoje to: `health-check.yml` šablonas
- Empirra incidentai (KI-001..KI-003 iš Empirra `KNOWN_ISSUES.md`) — neperkelti, nes susiję su Empirra Supabase production state'u

**Priežastis (B vs A)**:
- 1:1 copy būtų sukūręs neveikiančias pavyzdžių importus (path levels skiriasi) ir Empirra-specific endpoint'ų testus, kurie neegzistuoja Veriva
- 1:1 copy būtų `KNOWN_ISSUES.md` užpildęs Empirra problemomis, kurios neaktualios Veriva → wrong source-of-truth
- BDAR konteksas (Veriva = duomenų apsaugos kompanija) reikalauja pridėti specifinius reikalavimus, kurių Empirra šablonuose nėra

**Priežastis (B vs C)**:
- C praleidžia GitHub Actions automation (dependabot security updates, daily health-check) — tai yra production hygiene baseline, ne nice-to-have
- Empirra `.claude/settings.local.json` permissions modelis (Vercel CLI, Resend WebFetch) tinka Veriva 1:1 — be to kiekvienas Vercel komandos kvietimas reikalautų patvirtinimo

**Trade-off**: Adaptaciją reikia mažiau verifikuoti negu 1:1 copy, bet daugiau negu C. Specifiškai — `docs/automation-standards.md` import paths nepatikrinti vs faktinis Veriva `api/forms/contact.ts` (matomas SESSION_STATUS.md "Kas liko nepatvirtinta").

**Implementacija**: commit `93cf7b7` (16 failų, +1488 / -5).

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

---

## 2026-05-10 — Blog post quality bar: audit → polish workflow privalomas

**Kontekstas**: Pirmasis blog post'as buvo parašytas kaip "pillar standartas". Po publish — vartotojas pasiteiravo apie kokybę. Atlikus `/audit` skill'ą, iš pradžių radome 16/20 (P0×3, P1×7, P2×9, P3×5).

**Sprendimas**: Privaloma seka kiekvienam blog post'ui prieš publish:
1. `/audit blog/{slug}.html` → P0-P3 ataskaita
2. `/polish blog/{slug}.html` → P0+P1 fixes (P2 jei laikas)
3. Re-`/audit` → audit health 18+/20 prieš publish
4. Tik tada `noindex,nofollow` → `index,follow`

**Priežastis**:
- Pirmojo posto fix'ai parodė pasikartojančias problemas: trūksta `<main>`, callout kontrasto, FAQ aria-expanded, hover (hover:hover) wraps. Be audit'o — nematomi.
- Be šitų — postas vis tiek atrodo "shipped", bet a11y/CLS/touch target'ai tyliai prastesni.
- 30 min audit + polish prieš deploy = mažiau "user finds bugs" iteracijų po deploy.

**Trade-off**: Lėtesnis publish (30-45 min papildomai per postą), bet:
- Audit health score yra konkretus metric'as ataskaitose
- A11y compliance prieš LT teisinius reikalavimus (BDAR + neviešumo įstatymai)
- Geresnis Lighthouse score → SEO + Core Web Vitals

**Implementacija**: 3 nauji skills nukopijuoti iš Empirra: `audit`, `polish`, `emil-design-eng` (`.claude/skills/`). `/impeccable` dependencija pakeista į Veriva-specific kontekstą (CLAUDE.md + emil-design-eng skill).

---

## 2026-05-10 — Blog template v2: post-polish komponentai standartu

**Kontekstas**: Pirmasis postas po polish'o turėjo daug komponentų ir CSS pagerinimų, kurių template v1 neturėjo: `<main>` landmark, skip-link, `:focus-visible`, FAQ `aria-expanded`, `<header class="ah">`, testimonial blokas, hero figure, HowTo + Review schemas, 2-stulpelių FAQ grid, `(hover: hover)` wraps, naujieji tokens (`--gold-strong`, `--red`, `--g500` darker, `--g600`, easing tokens).

**Sprendimas**: Atnaujinti `blog/template.html` (v2) su pilnai polished CSS + 24 placeholder'iais. Visi būsimi postai privalo naudoti šią template'ą. `docs/blog-system-prompt.md` atnaujintas su naujais komponentais ir QA checklist'u.

**Priežastis**:
- Standartas: vienas template, visi postai vienodi.
- Audit health score 18+/20 garantuojamas iš template'o.
- Claude API blog-gen automatizacija (kai bus sukurta) generuos teisingą structure'ą iš pirmo karto.

**Trade-off**: Template'o failo dydis didesnis (~28 KB vs ~15 KB v1). Bet — tai vienkartinis CSS, kuris kopijuojamas į kiekvieną postą. Šiuo metu CSS extract'inti į `assets/css/blog.css` neapsimoka, kol nėra 5+ postų.

**Reference implementation**: `blog/bdar-baudos-lietuvoje.html` (audit health 19/20).

---

## 2026-05-10 — Author'ių sistema: vardai be pavardžių (M / J / V)

**Kontekstas**: Pirmajame poste autorius buvo "Marina Kazlauskienė", inicialai "MK". Vartotojas paprašė pakeisti į "Marina" (be pavardės). Realiai — pavardę sugalvojau be pagrindo (fact fabrication).

**Sprendimas**: Nuo šiol — tik vardai. Author'ių sistema:
| Vardas | Initial | Rolė | Sritis |
|---|---|---|---|
| Marina | M | Teisės ekspertė, BDAR | BDAR, DPO, teisė |
| Justinas | J | IT saugumo ekspertas | NIS2, kibernetinis saugumas, IT auditas |
| Veriva komanda | V | Veriva ekspertų komanda | Bendro pobūdžio |

**Priežastis**:
- Be realios pavardės — dropping "Kazlauskienė" išvengia LT teisinės atsakomybės už neegzistuojantį asmenį
- Initial 1 simbolis vietoj 2 simbolių — vizualiai švariau (M vs MK)
- Schema.org Person.name lieka galiojantis (tik vardas)

**Trade-off**: Kai bus realūs Veriva komandos nariai — galima atnaujinti į pilnus vardus (pavyzdžiui, kai vartotojas patvirtins realų DPO vardą). Iki tol — generic personas.

**Implementacija**: atnaujinta visuose 5 vietose poste (HTML, JSON-LD, OG, meta tag, avatar). Atnaujinta `docs/blog-content-rules.md` lentelė ir `docs/blog-system-prompt.md` output schema.

---

## 2026-05-10 — Pre-publish workflow: 4-agent ratas privalomas prieš push

**Kontekstas**: Sukūrus 2 naujus pillar postus (NIS2 + Phishing) per `page-builder` agent, mano self-audit (`/audit` skill) tvirtino 19/20. User paklausė, ar naudoju visus skill'us ir agentus — atvirai pripažinau, kad ne. Vartotojas paprašė paleisti pilną pre-publish ratą.

**Rezultatas**: 4 nepriklausomi agentai (`seo-specialistas`, `qa-tester`, `frontend-revizorius`, `marketing-analitikas`) rado **6 P0 blockers** + 14 P1 fixes, kurių self-audit nepastebėjo:
- P0 #1: Phishing JSON-LD parse error (line 208) — LT quote `„Shame and blame"` sulaužė FAQPage schema
- P0 #2-3: Meta description per ilgos (NIS2 186 chr, Phishing 212 chr) — Google trims
- P0 #4: NIS2 title 66 chr — Google trims
- P0 #5: Phishing primary KW neatitikimas tarp H1 ir search intent
- P0 #6: CTA #2 mygtukai abu generic ("Susisiekti su ekspertu")
- Slug rename optimizacijai (kol nedeploy'inta — be 301 problemos)

**Sprendimas**: Nuo šiol — privaloma blog post quality bar atnaujinta į **5 fazes** (vietoj ankstesnių 4):

```
1. /audit blog/{slug}.html → P0-P3 ataskaita
2. /polish blog/{slug}.html → P0+P1 fixes
3. Re-/audit → audit health 18+/20
4. PRE-PUBLISH 4-AGENT RATAS (NAUJAS):
   - seo-specialistas (keyword density, meta tags, schema, competitor benchmarking)
   - qa-tester (HTML validation, JSON-LD parse, security, links)
   - frontend-revizorius (CSS/HTML/a11y nepriklausomas review)
   - marketing-analitikas (CTA copy, conversion funnel, trust signals)
5. Tik tada `noindex,nofollow` → `index,follow` + git push
```

**Priežastis**:
- Self-audit per optimistic — frontend-revizorius nustatė 17/20 (ne 19/20 self-rated). Skirtumas: `<time datetime>` ir FAQ IIFE — sisteminiai trūkumai paveldėti iš template'o, kurių self-audit negalėjo objektyviai įvertinti
- 4 agentai veikia paraleliai — pridedama tik ~3-5 min. iki workflow'o
- Vienas kritinis bug'as (JSON-LD parse error) sulaužytų Google Rich Results FAQ schema visoje publikacijoje — fix išvengtas TIK pre-publish rato
- SEO skores: NIS2 7→8.5/10, Phishing 6.5→8.5/10 po P0 fixes — measurable improvement

**Trade-off**: Pre-publish ratas užtrunka ~10-15 min. (4 agentai paraleliai + P0 fixes ~30 min.). Bet: išvengia post-publish embarrassment'o (broken FAQ schema, 404 broken links per renamed slug, generic CTA).

**Implementacija**:
- Privaloma kiekvienam blog postui prieš push į main
- Reference: `blog/nis2-direktyva-lietuvoje.html` + `blog/phishing-mokymai-darbuotojams.html` (commits `fa35e51`, `e382d2e`, `d9cc6e7`)
- BDAR postas (`blog/bdar-baudos-lietuvoje.html`) — published su tais pačiais sisteminiais P1 trūkumais (`<time datetime>`, FAQ IIFE) — KI-009 batch fix sekanti sesija

---

## 2026-05-10 — KI-004 index.html split: tik CSS/JS extract, NE HTML komponentai

**Kontekstas**: index.html yra 1995 lines (376K) — viršija Read 25K token limit'ą, kiekvienas pakeitimas brangiai kainuoja token'us. Token analizė rodo CSS+JS sudaro ~42KB iš 376KB.

**Alternatyvos**:
- A) Extract'inti TIK inline `<style>` + `<script>` blokus (CSS + JS)
- B) A + ištraukti modal'us (privatumas/slapukai/terms HTML) į atskirus failus per JS fetch
- C) A + B + pereiti į static site generator (Eleventy / Astro) build-time partials

**Sprendimas**: A — tik CSS/JS extract.

**Priežastis**:
- 88% mano darbo index.html'e yra CSS/JS pakeitimai (FAQ, widget, animations, BDAR logic). Tik ~12% — HTML kontento pakeitimai.
- Po A: CSS keitimui Read 590 lines (~8K tokens) vietoj 1995 lines (~108K) — **-92% token cost**
- B reikalauja JS fetch'inio infrastruktūros (kuri turi loading state, error handling) — pridėtinis komplekso lygmuo už ribotą sutaupymą
- C reikalauja build step'o ir keičia visą project setup (vanilla → SSG) — out of scope

**Trade-off**: index.html vis dar 339K (1127 lines) — viršija single Read call limit'ą. HTML kontento pakeitimai (modal'ai, hero, footer) dar reikalauja Grep + offset workaround'ų. Bet **CSS/JS keitimai dabar paprastai veikia per Edit įrankį.**

**Implementacija**: commit `9328cef` — `assets/css/index.css` (590 lines) + `assets/js/index.js` (276 lines), cache-buster `?v=20260510`, JSON-LD schemos palieku inline (SEO geriau apdoroja).

---

## 2026-05-10 — Vercel deploy fix: pašalinti `vercel.json` `functions` blokas

**Kontekstas**: Vercel build fail'inosi 9 kartus per 21h su klaida `Function Runtimes must have a valid version, for example "now-php@1.0.0"`. Visi commit'ai nuo 2026-03-23 nepasiekė production'o.

**Alternatyvos**:
- A) Pakeisti `"runtime": "edge"` → `"runtime": "@vercel/edge@1.0.0"` (pilnas semver)
- B) Pašalinti `functions` bloką iš `vercel.json` ir palikti runtime config TIK TS failuose per `export const config = { runtime: 'edge' }`
- C) Naudoti `vercel.json` `functions` block'ą su `runtime: "@vercel/edge"` be versijos (auto-pin)

**Sprendimas**: B — pašalinti `functions` bloką.

**Priežastis**:
- Modern Vercel best practice: runtime declared **per-file** TS export'e, ne globaliai `vercel.json`'e
- Mūsų TS failai (`api/forms/contact.ts`, `api/internal/health.ts`) jau turi `export const config = { runtime: 'edge' }` — dubliuoja konfiguraciją
- A reikalauja nuolatinės versijos sinchronizacijos kai Vercel išleidžia naujas major versijas
- C deprecated, gali fail'inti ateityje

**Trade-off**: jei pridėsim naują API endpoint'ą, **privalu** pridėti `export const config = { runtime: 'edge' }` TS faile, kitaip Vercel default'ins į Node.js runtime (kuris su mūsų `lib/` wrapperiais nesuderinta). Sprendimas dokumentuotas `docs/automation-standards.md`.

**Implementacija**: commit `fca76a9` — pašalintas `functions` blokas iš `vercel.json`. Po to commit `6974806` pridėjo `outputDirectory: "."` + `buildCommand: null` (statinė svetainė root'e).

---

## 2026-05-10 — DNS migration WP→Vercel: išsaugoti Zoho email DNS record'us

**Kontekstas**: Hostinger DNS Zone turėjo 8 record'us — 2 WP-related (A `@` + CNAME `www`), 6 email-related (3× MX Zoho, 2× TXT SPF/verification, 1× TXT DKIM). Migracijai į Vercel reikia pakeisti A + CNAME, bet email turi veikti toliau.

**Alternatyvos**:
- A) Wipe visus DNS record'us ir pradėti iš naujo (saugu, bet sulaužytų email'ą)
- B) Išsaugoti TIK email record'us (DKIM + SPF + verification + 3× MX), pakeisti tik A + CNAME `www`
- C) Migruoti DNS valdymą į Vercel Nameservers (`ns1.vercel-dns.com`)

**Sprendimas**: B — surgical replace.

**Priežastis**:
- `info@veriva.lt` aktyvi business email per Zoho — wipe'as sulaužytų LT klientų komunikaciją (kritinis)
- A net su backup screenshot'u būtų rizikinga (DKIM rakto turinys ilgas, copy-paste klaidos tikimybė)
- C reikalauja registrar'o (Hostinger registratorius) nameserver pakeitimo, kuris gali užtrukti 24-72h propagation + paliktų email valdymą Vercel'e (kuris neturi pilno email DNS UI kaip Hostinger)

**Trade-off**: turime palaikyti DNS valdymą dviejuose vietose (Vercel Domains + Hostinger DNS Zone) — bet praktikoje DNS keitimas vyksta retai (~1× per metus).

**Implementacija**: vartotojas per Hostinger UI ištrynė 2 WP record'us, pridėjo 2 Vercel record'us. 6 email DNS record'ai NEPALIESTI. Verify: 6 globalūs DNS resolvers'ai propaguoti per ~30 min, MX `mx{1,2,3}.zoho.eu` rodo toliau.

---

## 2026-05-10 — Cookiebot CMP vietoj custom cookie banner

**Kontekstas**: `index.html` turėjo custom `#cookie-banner` su localStorage logika ir 2 mygtukais ("Tik būtinieji" / "Sutinku su visais"). Pseudo-sutikimo banner — neatitiko BDAR/e-Privatumo direktyvos reikalavimų:
- Negalėjo blokuoti realių slapukų (tik vizualinis baner'is)
- Nebuvo tiekėjų sąrašo (TCF/IAB framework)
- Inline `onmouseover`/`onmouseout` = XSS rizika
- Visiems lankytojams to paties statuso (jokio per-kategorijų sutikimo)

**Alternatyvos**:
- A) Custom CMP iš nulio (privacy-by-design, bet ~5-10 dienų darbas, reikia auto-blocking JS)
- B) Cookiebot (Usercentrics) — komercinė CMP, įdiegta 2 minutės
- C) Klaro / OneTrust open-source variantas — vidutinis darbo kiekis

**Sprendimas**: B — Cookiebot.

**Priežastis**:
- Veriva = duomenų apsaugos kompanija → savo svetainė turi BŪTI etalonas (ne tik atitikti minimumą)
- Cookiebot pritaikytas ES + LT rinkai (LT lokalizacija, BDAR-templates)
- Auto-blocking režimas — nereikia rankiniu būdu pažymėti scripts (Cookiebot pats blokuoja iki sutikimo)
- TCF v2.2 + Google Consent Mode v2 ready (kai bus GA4)
- Vartotojas jau turėjo Premium prenumeratą — €0 papildomai
- Auto-generuojamas slapukų sąrašas (`CookieDeclaration` script) — nereikia rankiniu būdu palaikyti
- Pasirinktas `data-blockingmode="auto"` (vs `manual`) — manual reikalautų `data-cookieconsent="statistics"` ant kiekvieno script'o

**Trade-off**: vendor lock-in (jei keisim CMP, reikia perdiegti); recurring fee.

**Implementacija**: 
- Cookiebot script (`<script id="Cookiebot">`) įdėtas kaip PIRMAS script `<head>` 6 puslapiuose (auto-blocking reikalauja first-position)
- Custom `#cookie-banner` HTML + JS + CSS pašalintas (16+14+2 lines)
- `modal-cookies` orphan modal pašalintas (32 lines)
- `slapukai.html` NEW — 9-skyrių BDAR politika + `<script id="CookieDeclaration">` cd.js (auto-generuoja realių slapukų sąrašą su pavadinimais, paskirtimi, saugojimo trukme)
- Footer linkas `Slapukų politika` → `/slapukai.html` (vietoj modal)
- "Atnaujinti slapukų sutikimą" mygtukas via `Cookiebot.renew()`

**Trūkumai (sekantis sprendimas)**:
- Cookiebot dashboard config: kalba LT, domeno whitelisting (`veriva.lt` + `www.veriva.lt`), GCM aktyvuoti kai bus GA4

---

## 2026-05-10 — Bundle commit: Cookiebot + sesijos #8 premium dark tier kartu

**Kontekstas**: Pradedant cookiebot-integration sesiją, repo turėjo 5 uncommitted failus iš sesijos #8 (premium-dark-tier-redesign): `index.html` (9 sekcijos perdarytos), `assets/css/index.css` (590→2571 lines), `assets/js/index.js` (276→324 lines), `SESSION_STATUS.md`, `docs/structure.md`. Cookiebot integracija lietė tuos pačius 3 kodo failus → diff'o izoliuoti negalima.

**Alternatyvos**:
- A) Stash sesijos #8, padaryti tik Cookiebot commit, unstash, padaryti antrą commit (sudėtinga, didelė konflikto rizika `index.html` ir `index.css`)
- B) Vienas bundle commit: sesija #8 + Cookiebot kartu
- C) Atskiri commits per failą (ne'atomic, lūžę intermediate state'ai)

**Sprendimas**: B — vienas bundle commit `0e51dcf`.

**Priežastis**:
- Sesijos #8 darbas jau patikrintas CSS token'ais (705/705 braces, 2571 lines), JS syntax OK
- Stash konfliktai būtų užtrukę ilgiau, nei pati Cookiebot integracija
- Production buvo "senas" jau 8h — leisti vienam commit'ui go-live yra greičiau ir saugiau nei dvi atskiri push'ai
- Commit message aiškiai dokumentuoja abu darbus (Cookiebot + premium dark tier)

**Trade-off**: didelis commit (+3516/-571 lines, 13 failų), atrast bug'ą būtų sudėtingiau git bisect'u. Mitigation: gerai paaiškintas commit message, žinau kas kur pridėta.

**Verifikacija po push**: Vercel build READY 15s, 7/7 production URL'ai 200 OK, Cookiebot script veikia, custom banner pašalintas, footer linkas → `/slapukai.html`.

**Pamoka ateičiai**: nepradėti naujos sesijos jei yra uncommitted darbas iš ankstesnės. Workflow: `/close-session` → commit → push prieš `/start-task`.
