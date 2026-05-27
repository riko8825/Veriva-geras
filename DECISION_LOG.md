# DECISION_LOG — Veriva

Architektūriniai sprendimai. Kiekvienas su data, kontekstu, alternatyvomis, sprendimu.

---

## 2026-05-27 — `NewsArticle` schema hot news straipsniams (NE `BlogPosting`)

**Kontekstas**: Kuriant RC duomenų nutekėjimo straipsnį (s22), reikėjo pasirinkti schema.org tipą. Visi 5 esami Veriva pillarai naudoja `BlogPosting`. Bet RC straipsnis yra hot news su laiko jautrumu (peak 1-2 sav.), ne evergreen pillar.

**Alternatyvos**:
- A) **`NewsArticle`** (Recommended) — Google News indeksacija, prioritetinis Top Stories carousel'is laiko jautriam content'ui, geresnis E-E-A-T signalas naujienoms
- B) `BlogPosting` — atitinka esamą Veriva pattern'ą, paprasčiau
- C) `Article` (parent class) — neutraliausias, bet praranda specifinę naujienų SERP funkcionalumą

**Sprendimas**: **A — NewsArticle** RC straipsniui ir visiems būsimiems hot news straipsniams. `BlogPosting` lieka evergreen pillar'ams (BDAR baudos, DPO, NIS2 vadovai).

**Priežastys**:
- Hot news 1-2 sav. peak'as — Top Stories carousel'is dažnai > organic SERP rank
- `datePublished` su ISO 8601 laiku `2026-05-27T09:00:00+03:00` (NewsArticle reikalauja tikslesnio laiko)
- 2× Person authors (Marina + Justinas) — E-E-A-T stipresnis news context'e

**Reikalavimai**:
- ISO 8601 `datePublished` su laiku + timezone (ne tik data)
- 2× `Person` authors (ne `Organization`)
- `articleSection` aiškus (RC: "Duomenų sauga")
- Image privalo būti accessible URL'u (1200×630 minimum)

---

## 2026-05-27 — SVG OG image konsistencija (palikta, NE konvertuoti į WebP)

**Kontekstas**: SEO agentas pažymėjo P0 bug — `og:image:type` = `image/svg+xml` (RC hero failas). LinkedIn ir Twitter/X palaiko SVG OG image ribotai → social share preview gali nesirodyti.

**Alternatyvos**:
- A) **Palikti SVG, atskira sesija batch konversijai** (Recommended) — visi 5 esami Veriva hero failai SVG. RC straipsnis dabar atitinka sisteminį pattern'ą. Vienkartinis fix RC'ui sukurtų inkonsistenciją.
- B) Konvertuoti tik RC į WebP — vienkartinis fix, bet 5 esami pillarai liks su tuo pačiu problemu
- C) Batch konversija dabar (5+1 failai) — ~30 min su `sharp` arba `puppeteer` SVG→PNG rendering. Bet šios sesijos scope'as buvo straipsnis, ne hero failų refactor

**Sprendimas**: **A — palikta SVG, batch konversija atskiroje sesijoje**

**Priežastys**:
- Konsistencija > vienkartinis fix
- Hot news cycle'as kritinis (greitis = pozicija) — deploy dabar > fix later
- Batch sesija leis vienodai konvertuoti VISUS hero failus, atnaujinti meta tag'us 5 esamuose pillaruose

**Carry-over į atskirą sesiją**: hero SVG → WebP batch (5+1 failai), patikrinti og:image:type meta, social preview validation (LinkedIn Post Inspector, Twitter Card Validator).

---

## 2026-05-26 — Canonical domain: apex `veriva.lt` (NE `www.veriva.lt`)

**Kontekstas**: GSC CSV eksportas atskleidė 8 non-indexed URL kategorijas. Šakninė priežastis — Vercel Project'o primary domain buvo `www.veriva.lt`, bet sitemap'as ir VISI HTML `<link rel="canonical">` tag'ai naudojo apex (`https://veriva.lt/...`). Apex domain 307 redirect'inosi į www — Google interpretavo kaip "alternate URL su canonical not aligned" ir nesindexavo.

**Alternatyvos**:
- A) **apex (`veriva.lt`) canonical primary, www → 308 → apex** (Recommended) — atitinka 24+ esamus canonical tag'us + sitemap'ą. Vienas Vercel UI pakeitimas + 4 canonical tag'ų update + 17 internal href'ų pataisymai.
- B) `www.veriva.lt` primary — atitinka tuometinį Vercel config'ą. Bet reikia perrašyti 24+ canonical tag'us, sitemap.xml ir VISI absolute URL'ai blog/seo puslapiuose. ~80+ failų.
- C) Palikti kaip yra — Google ir toliau nesindexuos, brand chaos (du URL formatai).

**Sprendimas**: **A — apex primary**

**Priežastys**:
- **Mažesnis pakeitimų skaičius** (~32 failai vs 80+) — apex jau buvo canonical visuose tag'uose, tereikėjo apsukti Vercel domain config + `.html` → clean URL alignment
- **Brand simplicity** — `veriva.lt` trumpiau, lengviau diktuoti, atitinka domain registration (NE www subdomain)
- **Standard'as** — modernios svetainės default'as apex be www (Google, GitHub, Vercel patys)
- **Sitemap matching** — visi `<loc>` jau apex formate, nereikia regen'inti

**Implementation**: Vercel Dashboard → veriva-geras → Domains: `veriva.lt` `Connect to environment: Production`, `www.veriva.lt` `Redirect to Another Domain: 308 Permanent → veriva.lt`. + commit `3282627` su HTML/sitemap/vercel.json updates.

**Trade-off acknowledged**: 2-hop redirect'ai persistuoja sausais kraštais (`www.veriva.lt/brief.html` → www→apex→clean = 2 hops). Vercel `redirects` nepalaiko hostname matching → reikalauja Edge Middleware. Acceptable Google'ui kol nėra Edge Middleware.

---

## 2026-05-23 — SEO engine deploy contract: empty new batch = no-op exit 0 (NE failure exit 1)

**Kontekstas**: `riko8825/SEO-Claude-code` `scripts/deploy_veriva.py` (deploy step `Weekly SEO Generation` workflow'e) exit'indavo 1 kai `_validated_slugs()` grąžindavo tuščią sąrašą. Tai įvykdavo NORMALIAI kai:
- Naujas page'as validator-rejected (HARD_BLOCK — pvz. `faq count 0 < 4`, `external_links 1 < 2`)
- Quality_os pažymėdavo naują page'ą cannibalization loser (žemesnis score nei prior pillar) ir demotindavo į status='failed'

Abiem atvejais prior published puslapiai (pvz., `bdar-6-straipsnis`, `bdar-baudos`) lieka GYVI veriva.lt, jokios žalos. Bet workflow fail'indavo → GitHub Actions failure email vartotojui. Tai create'ino "wolf cried" pattern'ą — kiekviena validator rejection siunčia paging signal'ą.

**Alternatyvos**:
- A) **Distinguish empty DB (real failure, exit 1) nuo "no-op this run" (exit 0)** (Recommended) — `_batch_integrity()` jau grąžina `client_live`. Jei `client_live > 0` (prior published exists) ir `slugs` tuščias → no-op + log warning + exit 0. Jei `client_live == 0` → tikra failure (DB tuščia arba unreachable), exit 1
- B) Skip cannibalization demote'ą per bootstrap fazę (kai `client_live < threshold`) — kvepia conditional logic'a, sunku tune'inti, palieka pillar/supporting overlap'ą be sprendimo
- C) `_validated_slugs` fall-back į PRIOR batch'ą — relaxes strict isolation, gali deploy'inti stale puslapį dukart, sumaišyti `generation_batch_id` semantics
- D) Exit 0 visada kai slugs tuščias — slepia tikrą "DB visiškai tuščia" failure (gen'eration step crash'ino prieš write)

**Sprendimas**: **A — distinguish empty DB vs no-op via `client_live` check**

**Priežastys**:
- **Operatorius gauna page'inimą TIK kai reikia rankinio veiksmo** — DB tuščia = config error / cache miss. Validator rejection = generator quality issue (sprendžiamas prompt iteration'u, ne urgent intervention'u)
- **Workflow ✓ green grąžina signal'o vertę** — failure'ai dabar reiškia REAL infrastructure problemą, ne content issue
- **Atskleidžia generator quality issues per logs, ne per pager** — `NO-OP: this batch produced no deploy-ready pages` log line + Quality OS reports artifact užfiksuoja faktą be alarm fatigue
- **Atitinka Empirra deploy filosofiją** — gate'ai EGZISTUOJA, kad blokuotų prastą content'ą; kai gate'as blokuoja → tai sėkmė, ne nesėkmė

**Implementation**: `scripts/deploy_veriva.py` `main()` ~line 259, commit `673401e` SEO-Claude-code repo'e. Naują logic'ą covered'ina 6 LIVE workflow runs verification (NE pytest test'as — technical debt).

**Pamoka**: Pre-deploy gate failure ≠ workflow failure. Jei gate'as BY DESIGN sustabdo prastą page'ą, exit code turi reflect'inti "system worked as intended" (0), ne "operator must investigate" (1). Pager fatigue iš false-positives slopina dėmesį tikriems incident'ams.

---

## 2026-05-23 — Veriva chrome FAQ markup yra blog-parity (`<div class="faq-item">`), NE `<details>`

**Kontekstas**: `templates/base.html:424-451` SEO engine'e turi conditional `{% if client_chrome == 'veriva' %}` block'ą, kuris renderina FAQ kaip `<div class="faq-item">` su `<button class="faq-q">` + `<div class="faq-a">` (blog-parity styling, kad SEO puslapiai atrodytų lygiai taip pat kaip Veriva blog post'ai). Tai yra design intent, ne bug. Bet validator (`src/validator/checks_content.py:_check_faq`) skaičiavo TIK `<details>` elementus — empirra client'o markup'ą. Veriva runs visada gaudavo `faq count 0 < 4` HARD_BLOCK.

**Alternatyvos**:
- A) **Validator skaičiuoja BOTH markups: `max(details_count, faq_item_count)`** (Recommended) — single source of truth template'as, validator follows. Future-proof'as papildomiems chrome'ams (pridėti naują markup tipą — `.accordion-item`, etc. — paprasta extend'inti)
- B) Keisti veriva chrome į `<details>` — break'ina blog-parity styling (Veriva blog naudoja button+div accordion JS toggle, ne native `<details>`)
- C) Per-client validator instances su skirtingais selektoriais — overengineered, sunkiau maintain'inti
- D) Validator parse'ja JSON-LD FAQPage schema (10 Question entries) ne HTML — keičia kontraktą, schema gali būti out-of-sync su rendered HTML (silent breakage risk)

**Sprendimas**: **A — `max(details_count, faq_item_count)` validator'e**

**Priežastys**:
- **Template yra design source of truth** — validator turi follow'inti, ne kitaip
- **Veriva blog-parity styling intentional** — Veriva blog'e button.faq-q + JS toggle aria-expanded yra established UX pattern (s10 set'as)
- **Trivialus pakeitimas** — 2 eilutės kodo, 0 tests sulaužyta, 0 backward incompatibility
- **Pridėtas `faq-sec` į `_check_empty_sections` exempt sąrašą** — section class veriva chrome'e yra `.faq-sec`, ne `.faq`. Be šito secondary fix'o validator markin'tų visą FAQ sekciją kaip "empty" (jos content yra div'uose, ne `<p>`)

**Implementation**: `src/validator/checks_content.py` `_check_faq` + `_check_empty_sections`, commit `a7b09b4` SEO-Claude-code repo'e. Lokalus sanity check'as ant downloadinto bdar-konsultacija HTML patvirtino: `errors=[]` po fix'o (anksčiau: `faq count 0 < 4`).

**Pamoka**: Kai client chrome'as override'ina komponento markup'ą, validator turi būti markup-agnostic'as (count by semantic role, ne by specific tag). Hardcoded element selector'iai validator'uose = future maintenance trap.

---

## 2026-05-12 — Cookiebot GeoIP override: `data-user-country="LT"` (Free planas, force visiems)

**Kontekstas**: Po Cookiebot scan'o atnaujinimo (2026-05-11 14:26 UTC, seni WP markeriai išvalyti) vartotojas vis dar incognito nematė consent banner'io. Diagnozavus `cdreport.js` aptikta, kad Cookiebot pagal default rodo banner'į TIK ES regionams (31 šalies sąrašas `gdpr:[...]` iš `uc.js`). Vartotojas testavo ne iš LT IP. Cookiebot Free planas neturi dashboard "Geographic regulations" toggle (vartotojo screenshot patvirtino).

**Alternatyvos**:
- A) **`data-user-country="LT"` HTML override 9 failuose** (Recommended) — hardcode'inti userCountry kaip LT → `gdprApplies: true` visiems pasaulyje. Be backend pakeitimo, kodu valdoma.
- B) Upgrade Cookiebot į Premium (~€16/mėn) → atrakina Geographic regulations toggle (visi regions)
- C) `data-georegions='{"region":"001","cbid":"..."}'` (worldwide wildcard) — netinkamas, georegions skirta CBID switching, ne force scope
- D) Custom inline JS pre-uc.js: `window.CookieConsent.regulations.gdprApplies = true` — fragile (race condition su Cookiebot init)

**Sprendimas**: **A — `data-user-country="LT"` 9 HTML failuose**

**Priežastys**:
- Veriva yra **B2B LT only** business — target audience visada LT, jokio CCPA/LGPD compliance reikalavimo
- Free planas (Veriva neturi reklamos budget'o Premium tier'ui dabar)
- Single attribute change, lengvai reversible jei strategijai keisis (find/replace)
- Headless puppeteer verify patvirtino: `userCountry: "LT"`, `gdprApplies: true`, `isOutsideEU: false` visiems pasauliniams IP

**Pamoka**: Cookiebot Free GDPR scope ne global — visada testuoti su VPN (ne ES IP) prieš deploy'inant CMP. Force-LT pattern saugus jei target audience yra vienos šalies B2B.

---

## 2026-05-12 — Privatumo politikos sutikimas: `consent` klausimo tipas + strict boolean validation

**Kontekstas**: brief.html (59 klausimai, 4 sekcijos) submit'as veikė be jokio explicit privatumo politikos sutikimo — BDAR 6 str. 1a (sutikimo pagrindas) neoptimaliai aiškiai dokumentuotas. Vartotojas paprašė pridėti varnelę gale klausimyno, kuri privaloma prieš submit.

**Alternatyvos**:
- A) **Naujas `consent` tipas su custom render + strict `=== true` validation** (Recommended) — atskira semantic kategorija, savitas markup (visas tekstas klikinamas su HTML link viduje), atskira CSS klasė `bf-q-consent` su top hairline border atskiriantis nuo įprastų klausimų
- B) Reuse `checkbox` tipas su `required: true` + 1 opcija — generic, bet semantiškai sutapatina su "pasirinkite kategorijas" klausimais
- C) HTML5 native `<input type="checkbox" required>` su FormData — paprasta, bet nebūtų konsistentu su state.answers JSON modelin, ir custom error message reikalautų atskiro markup
- D) Modal popup po Submit'o click'o — friction, blogiau a11y, dažnas anti-pattern

**Sprendimas**: **A — atskiras `consent` tipas**

**Priežastys**:
- Semantinis aiškumas: `consent` ≠ `checkbox` (skirtingos BDAR pasekmės — sutikimas yra teisinis pagrindas, ne data category)
- Custom markup leidžia HTML link viduje teksto (`<a href="/privatumas.html" target="_blank">`)
- Atskira CSS klasė leidžia vizualinį atskyrimą (top hairline border-top + atskira kortelė) nuo įprastų klausimų — vartotojas IŠKART supranta, kad tai NE įprastas klausimas
- Strict `valid = a === true` (boolean) — checkbox `valid = Array.isArray(a) && a.length > 0` būtų buvęs platus
- `state.answers.privacy_consent: true` pateks į payload su aiškia `_consent` semantic dimension

**BDAR compliance kontekstas**: Sutikimo language "Sutinku, kad mano pateikti duomenys būtų tvarkomi pagal privatumo politiką, siekiant parengti preliminarias rekomendacijas. Suprantu, kad galiu bet kada atsiimti sutikimą" — atitinka BDAR 7 str. (sutikimas turi būti aiškus, informuotas, atšaukiamas). Privatumo politikos link tikslus dokumentas (`/privatumas.html` su 10 BDAR skyriais).

---

## 2026-05-12 — brief.html `.bf-btn[hidden]` regression fix po dark tier redesign

**Kontekstas**: brief.html dark tier redesign metu (s16 commit `936bc6a`) pakeičiau `.bf-btn` base klasę į `display:inline-flex; align-items:center; gap:8px` (kad buttons turėtų konsistentų layout su SVG arrows). Originaliame brief.html CSS turėjo TIK `.bf-btn-prev[hidden]{display:none}` — paskutiniame ekrane consent push'o screenshot rodė 2 mygtukus (`Toliau →` + `Pateikti klausimyną →`) vienu metu, nors `next.hidden = true` per `updateNav()` set'inta. CSS `display:inline-flex` override'ino native `[hidden]` attribute.

**Alternatyvos**:
- A) **`.bf-btn[hidden]{display:none !important}`** (Recommended) — universal selector + `!important` kad pribijotų base flex
- B) Atstatyti `.bf-btn-prev[hidden]` + pridėti `.bf-btn-next[hidden]` + `.bf-btn-submit[hidden]` (specific selectors) — verbose, lengvas miss naujam button tipui
- C) Naudoti `style.display = 'none'` JS handler'yje vietoj `hidden = true` — keičiamas API, refactor reikalauja `updateNav()` perdarymas
- D) Pakeisti `.bf-btn` iš `display:inline-flex` į `display:inline` + wrap'inti turinį flex container'iu — palieka `[hidden]` natūralį behavior'ą bet keičia visą button layout

**Sprendimas**: **A — `.bf-btn[hidden]{display:none !important}`**

**Priežastys**:
- Specificity match base klasei + `!important` užtikrina, kad nei viena future modifier klasė neperrašys
- Universal pattern — jei pridėsim naują button tipą `.bf-btn-cancel[hidden]` veiks be papildomo CSS
- Native `[hidden]` semantic išsaugotas (a11y screen reader'iai supranta attribute)
- Minimalus diff (1 line keičiama)

**Pamoka**: Po **base klasės modifications** (`display`, `position`, `overflow`) **ALWAYS check** ar `[hidden]`/`[disabled]` attribute'ai vis dar veikia per pažymėtus naudojimo case'us. Šitas regression'as įvyko, nes dark tier redesign'as turėjo per platų scope'ą — turėjau du atskirus commit'us (dark tier separately + button additions separately), ne vieną bundle.

---

## 2026-05-12 — Hero `.btn-hero-secondary` stilius: text-link → outlined button

**Kontekstas**: Po `feat: hero secondary CTA → /brief.html` (commit `50d409c`) vartotojas pasakė "kur tas mygtukas, aš nematau". Reikėjo nuspręsti kaip stipriai diferencijuoti secondary CTA nuo primary.

**Alternatyvos**:
- A) **Antras tikras outlined button** (Recommended) — 13px font, padding 14×24, cyan border 55%, transparent fill, baltas tekstas, hover cyan border + 8% cyan bg + translateY(-2px). Konsistencija su .btn-hero-primary (border-radius 12px, gap 10px) bet aiškiai antrinis (be solid gradient + glow + box-shadow primary'ui)
- B) **Sustiprintas text-link** — opacity 55→85%, font 11→13px, palieka diskretiškumą
- C) **Du tikri mygtukai (vienas dydis)** — confusion kuris primary
- D) **Solid gold accent button** — išklysta iš brand uniformity (cyan = primary action color)

**Sprendimas**: **A — outlined button (cyan border + transparent + baltas tekstas)**

**Priežastys**:
- Žodis "mygtukas" iš vartotojo signalizuoja, kad lankytojas neidentifikavo link'o kaip clickable action (font 11px + 55% opacity per silpnas signal)
- Outlined variantas yra industry-standard secondary CTA pattern (Stripe, Linear, Anthropic visi naudoja); konsistentus su brand cyan accent
- Aiški vizualinė hierarchija: solid cyan + glow + box-shadow = primary; transparent + cyan border = secondary
- 13px font su uppercase pašalintas — gerai skaitomas iš toli, bet ne perdaug agresyvus

**Pamoka**: Pristatant naują CTA visada paklausti vartotojo apie tipą (text-link vs outlined vs solid) PRIEŠ implementaciją. Šįkart pridėjus link'ą su esamu silpnu stiliumi, gavau extra round-trip'ą.

---

## 2026-05-12 — Vercel CRON_SECRET whitespace incident: openssl pipe į vercel env add

**Kontekstas**: Po pirmo bundle push'o (`2512730`) Vercel build fail'ino 3s su `Error: The CRON_SECRET environment variable contains leading or trailing whitespace, which is not allowed in HTTP header values.` Per s14 secret generation buvo naudota `openssl rand -hex 32 | vercel env add CRON_SECRET production` — newline iš `openssl` pateko į env value.

**Alternatyvos po incident'o**:
- A) **`printf "%s" "$(openssl rand -hex 32 | tr -d '\n\r\t ')" | vercel env add`** (Recommended) — explicit whitespace strip, paranoidiškas
- B) `echo -n "..."` — POSIX echo -n nerelijobenoring (Windows cmd echo neignoruoja -n)
- C) `vercel env add CRON_SECRET production` rankiniu būdu paste'inant — patikima, bet ne automatable

**Sprendimas**: **A — printf + tr -d**

**Priežastys**:
- `tr -d '\n\r\t '` apima visus whitespace variantus (Unix `\n`, Windows `\r\n`, tab, space)
- `printf "%s"` nepriededa trailing newline (skirtingai nei `echo`)
- Veikia identiškai PowerShell + bash + zsh + Vercel CLI input pipe
- Future automation skriptai (rotation, multi-env push) gauna stabilų patterną

**Naujas standartas Veriva projekte**: Visi secret generation pipe'ai į `vercel env add` per `printf "%s" "$(... | tr -d '\n\r\t ')"`. Atnaujinti `docs/blog-automation-deploy.md` 7-step guide su šituo patternu (nepadariau šioje sesijoje — carry-over).

---

## 2026-05-11 — Blog automation: OpenAI gpt-4.1 vietoj Anthropic Claude (despite Veriva docs)

**Kontekstas**: Portuojant Empirra blog automation Verivai, AI provider sprendimas. `docs/blog-system-prompt.md` rašytas su Claude API (`claude-sonnet-4-6` su prompt caching, `cache_control: ephemeral`), bet Empirra production'e veikia OpenAI gpt-4.1 (`lib/claude.ts` istorinis pavadinimas — iš tikrųjų OpenAI SDK).

**Alternatyvos**:
- A) **OpenAI gpt-4.1** (kaip Empirra production) — proven 6 mėn., ~$4-5 per 100 postų, žinomas timeout profile (50-65s 4500 token output), copy-paste lib/claude.ts as-is
- B) **Anthropic Claude Sonnet 4.6** (kaip Veriva docs) — geresnė LT kalbos kokybė, prompt caching 90% pigiau cached tokens, bet reikalauja perrašyti lib/claude.ts į `@anthropic-ai/sdk` + system: [{type:'text', text:..., cache_control}], $3/$15 vs OpenAI $0.40/1M tokens (5-10× brangiau be cache)
- C) **Hibridas**: gpt-4.1 keyword expansion + Claude Sonnet article gen — 2 API keys, optimalus cost/quality, bet sudėtingiau

**Sprendimas**: **A** — OpenAI gpt-4.1, ta pati lib/claude.ts as-is su `OPENAI_API_KEY` shared iš Empirra Vercel.

**Priežastys**:
- Empirra Empirra production validavo OpenAI gpt-4.1 su panašiu LT prompt'u (Empirra prompts EN, bet output struktūra identiška su Veriva — JSON 24+ fields)
- Switching į Claude reiškia rewrite lib/claude.ts + 1-2 sav debug API ergonomic'ai (`messages` vs `chat.completions`, content `[]` vs string) + naujas billing'as
- Cost saving (Claude cache) negalioja jei prompt mažas (~3KB system + 2KB user = 5KB ≈ 1250 tokens, $0.004 cached vs $0.0011 OpenAI input) — netaupom
- Kokybės klausimas: smoke test'as Faza 5 parodys ar gpt-4.1 LT 80%+ pass rate. Jei FAIL — swap'inti į Claude vienos lib pakeitimu (zero impact į blog-gen route.ts ar prompts)

**Carry-over**: jei pirmi 3 smoke test'ai grąžins <80% validatorių pass rate — switch'inti į Claude su prompt caching (lib/claude.ts rewrite, 1-2h darbo).

---

## 2026-05-11 — Blog automation: JSON+template injection vietoj inline HTML output

**Kontekstas**: AI output format'as blog automation pipeline'ui. Empirra grąžina raw HTML string'ą (1800-2400ž., inline į buildFullPage() su layout headeriu/footeriu). Veriva turi paruoštą `blog/template.html` v2 su 29 `{{PLACEHOLDER}}` slots ir `docs/blog-system-prompt.md` su Zod schema 24+ fields JSON spec'u.

**Alternatyvos**:
- A) **JSON output + template injection** (Veriva docs) — AI grąžina 29-field JSON, `renderTemplate()` lib funkcija įstato į esamą template.html. Atskiria turinį nuo HTML, lengviau validuoti per-field, atitinka template.html v2 standartą (audit 19/20 baseline)
- B) **Inline HTML output** (Empirra) — AI grąžina pilną HTML, blog-gen kopijuoja į branch tiesiogiai. Mažiau code (no renderTemplate, no validatePostData), bet sunkiau validuoti, jei template.html keisis — kiekvienas naujas post gauna seną layout'ą

**Sprendimas**: **A** — JSON + template injection per `lib/blog-template.ts` + `renderTemplate()`.

**Priežastys**:
- Veriva esami 3 pillar postai (BDAR baudos, NIS2, Phishing) jau yra audit 19/20 standartas — nauji generated postai turi atitikti TAIP PAT layout'ą, ne tik content'ą. Template injection garantuoja layout consistency
- Validation easier: 10 validators (banned phrases, FAQ count, source whitelist, FAQ schema, H2 count, CTA brand mention) veikia ant per-field strings'ų, ne ant viso HTML output'o
- Template.html v2 turi 4 schema slot'us (FAQ + HowTo + Review + BlogPosting via template) — AI grąžina tik post_faq_schema_json + post_howto_schema_json + post_review_schema_json, BlogPosting + Author schema automatiškai per template
- Jei template.html keisis (pvz., naujas tier'as), 1 file change → visi nauji postai gauna naują layout. Empirra approach reikalautų prompt update'o + 5 dienų testing'o

**Carry-over**: pirmas smoke test parodys ar AI laikosi visų 29 field spec'o (kai kurie optional — howto/review/testimonial). Jei AI grąžina <70% required fields su realiom reikšmėmis — sumažinti required field count į absolute minimum (12 fields), padaryti rest'us optional.

---

## 2026-05-11 — Blog automation: shared Empirra Supabase su `veriva_*` table prefix

**Kontekstas**: Veriva blog automation reikia DB lentelės `telegram_revise_state` (multi-turn Telegram state). Veriva Supabase project'as NEISTEIGTAS (KI-008 blocker dar prieš šią sesiją). Variantai: A) sukurti naują Supabase project, B) naudoti Empirra Supabase su namespace isolation, C) palikti revise state in-memory (lose state on cold start).

**Alternatyvos**:
- A) **Atskiras Veriva Supabase project** — clean separation, atskira billing'a, KI-008 fix'as. **Kaina**: 10 min rankų darbo vartotojui (kurti project + pateikti 3 raktus), nauja maintenance burden (2 projects to monitor)
- B) **Shared Empirra Supabase + `veriva_*` prefix** — `veriva_telegram_revise_state`, `veriva_blog_runs` lentelės atskirtos pavadinimo lygmenyje. SUPABASE_URL+SERVICE_ROLE_KEY shared iš Empirra Vercel
- C) **In-memory revise state** (no DB) — paprastas, bet state lost ant kiekvieno cold start. Veriva blog gen run'as kas 3.5 dienos, cold start labai tikėtinas tarp draft notification ir user click'o

**Sprendimas**: **B** — shared Empirra Supabase + `veriva_*` prefix.

**Priežastys**:
- KI-008 (Veriva Supabase setup) lieka blocker'iu kontaktų formai (`/api/forms/contact` neištestuotas), bet NETURI būti blocker'iu blog automation'ui dabar
- Empirra Supabase Free tier'as turi limit'us, bet Veriva 2 lentelės × low volume (~10 rows/savaitė kiekvienoje) = nominalus overhead
- Migration'as `migrations/002_blog_automation.sql` rašytas su `veriva_` prefix VISUOSE namespace artifact'uose (table name + RLS policy name + index name + comment) — copy-paste-safe į atskirą Veriva Supabase, kai bus setup'intas (rename'inti per `ALTER TABLE veriva_x RENAME TO x` migration)
- RLS politika `service_role only` — Veriva nematys Empirra lentelių ir atvirkščiai (service_role token'ai atskiri per project; Veriva naudoja Empirra service_role, kuris turi access į VISKAS Empirra DB — accept'inta rizika)

**Rizikos**:
- Veriva service_role key = Empirra service_role key. Jei Veriva backend'e bus security bug → atakanti gali pasiekti Empirra leads/intake data. Mitigation: zero user input prie service_role queries (visi blog-* endpoint'ai daro tik fixed `from(VERIVA_TABLE)` su PK lookup, jokio dynamic SQL)
- Cost: Empirra Free tier database limit ~500MB. Veriva 2 lentelės × 100 rows × 1KB = 0.1MB — negali sukelti

**Carry-over**: Kai Veriva Supabase project bus setup'intas (po KI-008 fix), migrate `veriva_telegram_revise_state` + `veriva_blog_runs` į jį, perrašyti `SUPABASE_URL` env, run `ALTER TABLE` rename, RLS update.

---

## 2026-05-11 — Cookiebot rescan: support email vietoj Daily scan frequency upgrade

**Kontekstas**: Vartotojas pranešė, kad `/slapukai` puslapyje CookieDeclaration lentelė rodo seną WordPress versiją (`wpEmojiSettingsSupports`, Piwik `_pk_*`, GA `_ga`, link į `veriva.lt/privatumo-politika-2/` 404). Diagnostika parodė, kad markup/CDN/render veikia, problema crawl lygyje — Cookiebot scan'as buvo `2026-04-23` (17 dienų prieš WP→Vercel migraciją). Cookiebot Premium UI'e `Re-scan` mygtuko nėra (3 ekranai patikrinti).

**Alternatyvos**:
- A) **Daily scan frequency** (`Monthly` → `Daily` per Domains & Aliases save) — **+€62-99/mėn už domain** (Cookiebot Premium add-on, WebSearch patvirtino). Greitas rescan per ~1h, bet recurring cost.
- B) **Support email su CBID + manual rescan prašymu** — nemokama, ETA ~24h. Cookiebot KB straipsniuose patvirtinta, kad support team daro manual rescans nemokamai jei yra pagrįsta priežastis (WP→Vercel migracija = pagrįsta).
- C) **Laukti auto-scan ~2026-05-23** — Monthly frequency, sekantis scan'as savaime. 12 dienų laukti, bet visiškai nemokama ir be jokios action.

**Sprendimas**: **B** — Vartotojas siunčia support email su CBID `bc31b2c9-a2b7-44e8-a3a2-624b027ba646` ir paaiškinimu apie migraciją.

**Priežastys**:
- Daily upgrade'as kainuoja per daug (€62-99/mėn) feature'ui, kurio reikia 1 kartą po migracijos. Po rescan'o turės būti grąžinta į Monthly.
- Pereinant į Daily nuolat — pinigai išleidžiami už realią vertę 0 (vienas slapukas `CookieConsent`, GA4/GTM dar nesetup'inti).
- Support manual rescan dokumentuota kaip standartinė Cookiebot praktika po migracijų — neprieina prie weird "hack" sprendimo.
- Auto-scan (C) 12 dienų yra per ilgai — vartotojui reikia, kad lentelė rodytų teisingus duomenis dabar.

**Pamoka**: **NIEKADA nesiūlyti scan frequency keitimo be pricing patikros pirma.** Pradinis impulsas buvo siūlyti `Monthly → Weekly + Save` kaip "force rescan hack" — vartotojas paklausė `daily ar weekly apmokestinama papildomai`, o aš nežinojau atsakymo. Po WebSearch paaiškėjo, kad būtų buvęs €99/mėn netikėtas billing. **Visada tikrinti pricing PRIEŠ siūlant feature toggle.**

---

## 2026-05-11 — Hero rewrite: brand adaptacija per 3 pivot'us, ne `as-is`

**Kontekstas**: Vartotojas pateikė pilną HTML failą (canvas particles + custom cursor + DM Sans + cyan #00cffc + #030a14 + GSAP + clip-path corners) ir paprašė įdėti vietoj esamo hero. Pradžioje pasakė `daryti taip kaip kode. po to taisysime jei ka` — leidimas palikti laužomas projekto taisykles (inline CSS, cursor:none, GSAP CDN). Po pirmojo deploy'o vartotojas pamatė balta juosta (cream body bg pro padding-top skylę). Po antrojo deploy'o pamatė, kad cyan #00cffc + DM Sans nesutampa su likusia svetaine (`--ink #07111f` + Plus Jakarta Sans + Syne 800 + JetBrains Mono mono kicker).

**Alternatyvos**:
- A) `As-is` — palikti pateiktą kodą be brand adaptacijos. Greita, bet hero atrodo kaip kitas produktas (Stripe/Linear estetika su elektriniu cyan + DM Sans 700 + canvas — neatitinka legal/IT B2B premium dark tier brand'o).
- B) Tik `--ink/--cyan/--gold` token swap (1 pivot'as) — pakeisti tik spalvas, palikti DM Sans + clip-path corners + custom cursor. Vidurio variantas, bet hero ir komanda vis tiek atrodytų skirtingai dėl tipografijos.
- C) Pilna brand adaptacija (3 pivot'ai): tokens + fontai (Plus Jakarta Sans + Syne 800 + JetBrains Mono) + geometry (border-radius 8/10/16px vietoj clip-path corners) + mono kicker su glowing cyan dot vietoj uppercase line + radial mesh kaip team-bg::before. Hero matchina 9 jau perdirbtas sekcijas.

**Sprendimas**: C (po klausimo vartotojui — pasirinko "Adaptuoti hero į esamą brand"). Pirmas pivot'as paliko `as-is` (vartotojo instrukcija), antras pivot'as fix'ino balta juostą (solid #030a14 ticker bg), trečias pivot'as buvo brand adaptacija.

**Pasekmė**:
- **Pamoka**: Pradinis brand audit'as turėjo būti pirmas žingsnis, ne paskutinis — `daryti taip kaip kode` instrukcija reikšmingai vėluoja, jei vizualinis rezultatas neatitinka brand'o. Reikėjo iš karto klausti `Kuri kryptis: as-is, hibridas, ar brand adaptacija?` prieš pirmą Edit.
- **Inline `<style>` ~340 lines liko head'e** — vartotojas leido `taip kaip kode`, bet po brand adaptacijos vis tiek laukia perkėlimo į `assets/css/index.css` (CLAUDE.md `niekada inline` taisyklė).
- **GSAP CDN ~70KB blocking** liko be `defer` — Core Web Vitals impact nepatikrintas, gali pablogėti LCP.
- **Custom cursor `#cur` div + JS listener'iai** liko kaip dead code — pašalinta funkcija (`display:none !important`), bet ne kodas. Cleanup laukia kitos sesijos.

---

## 2026-05-10 — Privacy Policy: real sub-processors lentelė, ne generic copy-paste

**Kontekstas**: `privatumas.html` turinys — ankstesnis modal'as `index.html` turėjo netikslius sub-processors (Formspree, Google Analytics, Cloudflare), kurie realiai NIEKADA neegzistavo Veriva stack'e. Klaidingas Privacy Policy = BDAR pažeidimas pats savaime (BDAR 13 str. 1 d. e p. — duomenų gavėjai turi būti tiksliai nurodyti).

**Alternatyvos**:
- A) Copy-paste iš modal'o (greita, bet teisinis pažeidimas — Formspree/GA/Cloudflare nenaudojami)
- B) Generic Privacy Policy template (greita, bet ne-mūsų teisinė padėtis — sub-processors privalomi BDAR 13 str.)
- C) Sub-processors lentelė pagal realią architektūrą — Vercel Inc. (JAV/SCC), Resend Inc. (JAV/SCC), Cybot A/S (Danija), Hostinger (Kipras), Zoho (EU)

**Sprendimas**: C — sub-processors lentelė atspindi realią architektūrą šiandien. Callout box: "Šiuo metu nenaudojame Google Analytics, Meta Pixel, LinkedIn Insight Tag" — eksplicitiškai aiškus, kas NĖRA naudojama (apsauga nuo „o kodėl GA neminite?" klausimo).

**Pasekmė**: Kai įdiegsime GA4 (P0 prioritetas) ar Supabase (KI-008) — privatumas.html sub-processors lentelė reikės atnaujinti per tą pačią sesiją. NIEKADA nedeploy'inti naujo tracker'io be Privacy Policy update'o.

---

## 2026-05-10 — Footer link uniformity: visi 5 puslapiai → /privatumas.html + /slapukai.html

**Kontekstas**: 4 blog files (3 post + template) turėjo footer'yje `<a href="/#kontaktai">Privatumo politika</a>` — totally broken (rodė į kontaktų sekciją vietoj privacy puslapio). Index.html turėjo modal `openModal('modal-privacy')` + cf-privacy `<a href="#" onclick="return false">` (taip pat broken).

**Alternatyvos**:
- A) Tik nauji blog post'ai naudoja `/privatumas.html`, seni blog post'ai paliekami su modal/broken
- B) Visi puslapiai (5 footers + 1 cf-privacy form'a) sync'inami į `/privatumas.html` + `/slapukai.html`
- C) Modal'ai dinamiškai įkrauna privatumas.html turinį (komplikuotas JS, dubliuotas turinys)

**Sprendimas**: B — bundle commit'as su 6 footer/link fix'ais kartu su nauju puslapiu. Vienas autoritetas (`/privatumas.html`), nereikia maintain'inti modal turinio. `index.html` `#modal-privacy` block (~75 lines) liko kaip dead code — bus išvalytas vėliau, kai bus tikras potencialas naudoti modal'us kažkam kitkam.

**Pasekmė**: `blog/template.html` taisymas reiškia kad visi būsimi blog post'ai inherit'ins teisingus footer link'us automatiškai.

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
