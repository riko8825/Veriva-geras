# SESSION_STATUS

**Data**: 2026-06-10
**Sesijos tikslas**: Marinos BDAR klausimyno korekcijos (Q2/Q25/Q28/Q39) → naujas blog straipsnis (duomenų subjekto teisės) → blog automation atblokavimas (ESM crash + Edge timeout fix, env vars iš Empirra).

---

## Paskutinė sesija: 2026-06-10 — blog-automation-unblock + marina-klausimynas + blog-straipsnis

### Ką padarėme

Trys atskiri darbai vienoje sesijoje:

**1. Marinos BDAR klausimyno korekcijos** (commit `6470803`, LIVE) — Marina užpildė `/bdar-auditas` ir pateikė pastabas:
- **Q2**: consent išnaša patikslinta (asmens duomenų tvarkymo formuluotė)
- **Q25** saugojimo vieta: `single` → `multi` (kelios duomenų saugojimo vietos)
- **Q28** IT saugumo priemonės: `single` → `multi` su konkrečiomis priemonėmis + „Kita" laukas. Naujas `MULTI_SCORED_QUESTIONS` proporcinis scoring: (pažymėta/5)×10×weight(2). Max balas **290 nepakitęs**.
- **Q39** turimi dokumentai: atskirtas vidaus tvarkymo aprašas nuo viešos privatumo politikos.
- **BUG rastas+ištaisytas** (`37c3c6b`): `EMAIL_RE` pagaudavo trailing kablelį iš „Vardas, email, tel" formato → Resend „Invalid to" → `emailSent:false`. Domeno galas → `[a-zA-Z]{2,}`, exclude `,;`. Backend+frontend.
- **Testai**: TSC 0, FE↔BE sync 42 klausimai, scoring 9 scenarijų, validacija, wizard collection, 3 production E2E (email → pinigine1@gmail.com, 100%/71%/1% atitiktis). 5 nepriklausomi raundai, 0 likusių klaidų.
- Dokumentacija fix: `docs/bdar-scoring-matrica.md` max 300→290 (pasenęs s24 faktas).

**2. Naujas blog straipsnis** (commit `be66497`, LIVE) — „Duomenų subjekto teisės (BDAR 15-22 str.)", ~2600ž, kategorija BDAR, autorė Marina. Schema BlogPosting+FAQPage(10)+HowTo(6), dedikuotas hero SVG. 2 audit agentai (seo-specialistas 3 P0 fix, frontend-revizorius PUBLISH READY). blog.html kortelė + sitemap.

**3. Blog automation atblokavimas** (PAGRINDINIS darbas) — kodas buvo deployed nuo s14, bet NIEKADA neveikė (patikrinta git: 0 `draft:` commit'ų). Du blokeriai (s24 minėti) + nauji, atrasti per realų production testavimą:
- **`96c9178`+`a2f4147`**: 3 endpointai Node→Edge→Node runtime. ESM crash diagnozė per runtime logus.
- **`163dd15`+`8a6e656`** ESM TIKRASIS fix: `type:module` (lūžo `ERR_MODULE_NOT_FOUND`, ESM reikalauja .js plėtinio) → tsconfig **CommonJS + moduleResolution:node** (suvienodinta su Empirra donor projektu, kur VEIKĖ).
- **`c0b160c`**: Edge 25s timeout (`FUNCTION_INVOCATION_TIMEOUT`) → Node + Fluid Compute, maxDuration 90→180s, AI timeout 75→140s.
- **`d0289a2`+`22ee4bb`**: validator — desc 190→prompt sustiprintas, pillar H2 8→6 riba.
- **Edge-safe lib pakeitimai**: github.ts Buffer→atob/btoa, telegram.ts slugHash node:crypto→FNV-1a sinchroninis, auth.ts +3 Edge funkcijos.
- **Env vars iš Empirra**: TELEGRAM_BOT_TOKEN+CHAT_ID perkelti per CLI; GITHUB_TOKEN+PEXELS_API_KEY user įkėlė į .env.local → Vercel. GitHub token write teisės (Contents+PR Read/write — user pridėjo GitHub UI).
- **REZULTATAS**: blog-gen `success:true` — draft branch sukurtas, uniqueness 89-93 pass, Telegram išsiųstas. **Pirmas kartas kai blog automation suveikė nuo pradžios iki galo (80-167s).**

### Kas liko / nepatvirtinta

- **🔴 BLOCKER: Telegram webhook → empirra.com (NE veriva.lt)** — atrasta pačioje pabaigoje per `getWebhookInfo`. Bendras bot'as, webhook gali rodyti tik į vieną URL. User „Publikuoti" callback'ai eina į Empirra → „401 GitHub API". **Publish grandinė (blog-approve) NIEKADA netestuota end-to-end.** Sprendimas (laukia user): atskiras Veriva bot'as ARBA perjungti webhook (Empirra blog nustotų).
- **🟡 blog-approve token write patikrintas izoliuotai (GitHub API 201/204/404), bet realus telegram-webhook→blog-approve→merge srautas nepatikrintas** (dėl webhook konflikto).
- **🟡 2 debug commit'ai git istorijoje** (`f110451`, `b4948f9`) — switarinti debug, paskui pašalinti.
- **🟡 GITHUB_TOKEN+PEXELS Veriva Vercel NE Sensitive** (Empirra juos turi Sensitive) — nenuoseklumas.
- **🟡 Marinos klausimyno carry-over s24** (email logo, scoring MasterLegal review) — nepaliesta.
- **🟡 1 draft branch likęs** `draft-blog-bdar-auditas-imonems-2026` — laukia publish testo.

### Kitas žingsnis

1. **Telegram webhook sprendimas** (user action) — atskiras Veriva bot'as (per @BotFather, naujas token+chat) ARBA perjungti esamą webhook į veriva.lt (Empirra blog nustos). Po to — `setWebhook` į veriva.lt + TELEGRAM_WEBHOOK_SECRET sutapimas.
2. **Publish grandinės E2E testas** — kai webhook teisingas, paspausti „Publikuoti" → patikrinti blog-approve: kortelė+links+sitemap+merge→main→veriva.lt/blog (404→200).
3. **Cron monitorinimas** — pirmas auto-run antradienį/ketvirtadienį 8:00 UTC; patikrinti ar generuoja be force.

### Production verifikacija (live)

| Test | Statusas |
|---|---|
| Marinos Q2/Q25/Q28/Q39 LIVE (`/bdar-auditas`) | ✅ |
| bdar-audit email fix — 4 E2E → pinigine1@gmail.com | ✅ |
| Naujas blog straipsnis `/blog/duomenu-subjekto-teises-bdar` 200 | ✅ |
| blog-gen `success:true` (draft branch + Telegram) | ✅ |
| Visi endpointai (health/bdar-audit/blog-gen/approve/webhook) ne-500 | ✅ |
| **blog-approve publish E2E (telegram→merge→live)** | ⬜ BLOCKED (webhook→empirra) |

---

## Sesija #27: 2026-06-09 — fonts-hanken-grotesk-visur

### Ką padarėme

**Kontekstas**: MasterLegal'ui nepatiko dabartiniai Veriva šriftai. User pateikė referencą questumtraining.com. Užduotis: išanalizuoti referenco šriftus, palyginti, pakeisti visur. Per sesiją papildomai: footer tekstas per tamsus (pasimeta).

**Analizė (curl + theme CSS)**:
- questumtraining.com = WordPress + custom „questum" tema. Visa tipografija = **vienas custom šriftas „Rules"** (self-hosted .woff2/.woff/.otf, komercinis — NE Google Fonts). Geometrinis grotesk, neutralus, korporatyvus. Antraštės+tekstas tas pats šriftas, kontrastas per dydį/storį.
- Veriva turėjo 3 šriftus: Syne (display, ekspresyvus „dizaineriškas") + Plus Jakarta Sans (body) + JetBrains Mono. Diagnozė: **Syne** duoda agentūros, ne teisės/saugumo toną → tikriausiai būtent jis netiko.

**Sprendimas (AskUserQuestion → user pasirinko)**: **Hanken Grotesk** (nemokamas OFL, artimiausias „Rules" grotesk). Vieno-šrifto sistema (`--ff`=`--ffd`=`--ffm` visi Hanken).

**Pakeista (55 failai, commit `4a8866b`, push LIVE)**:
- **52 HTML** (index, blog ×9 + template, brief, privatumas, slapukai, bdar-auditas, 38 seo/) + **2 CSS** (index.css, bdar-auditas.css).
- Google Fonts link: Syne+Jakarta+JetBrains → tik Hanken Grotesk (mažiau užklausų).
- `--ff`/`--ffd`/`--ffm` → Hanken; inline logotipo `font-family:Syne` → Hanken.
- **letter-spacing sušvelnintas** (Hanken tankesnis nei Syne): neigiami `-.025/-.028/-.03em`→`-.016/-.018em`; mono uppercase `.14/.16/.18em`→`.06/.07/.08em` (per frontend-revizorius auditą index.css'e, tada batch visur).
- **1 outlier seo failas** (`nacionalinio-kibernetinio-saugumo-centro-mokymai`) naudojo **Inter** (kitos kartos SEO engine) → Hanken.
- **Footer kontrastas index.html → WCAG AA**: buvo alpha .16–.38 (1.53–3.51:1, FAIL), dabar .48–.62 (4.97–7.71:1, AA✓). 8 selektoriai.
- Cache-buster bump: index.css + bdar-auditas.css `?v=20260609b`.

### Kas liko / nepatvirtinta

- **🟡 Vizualiai naršyklėje NEPERŽIŪRĖTA** — verifikacija buvo TIK curl (font link, HTTP 200, CSS turinys). Realus rendering (hero antraštės, mobile, Hanken proporcijos) nepatikrintas.
- **🟡 Footer kontrastas tik index.html** — bdar-auditas.html ir kiti puslapiai turi SAVO footer markup'ą; WCAG AA fix jiems NEtaikytas (ar jie turi tą pačią problemą — nepatikrinta).
- **🟡 Letter-spacing globalus euristinis** — visi `-.028em`→`-.018em` vienodai, ne per-komponentinis. Kai kur galėjo tikti tikslesnė reikšmė.
- **🟡 Chat botas** — user diegia chat botą; aptarta kad nesikirs (iframe/Shadow DOM izoliacija), bet botas dar neįdiegtas, z-index/overflow konfliktas nepatikrintas.

### Kitas žingsnis

1. **Vizuali peržiūra naršyklėje** — index, 1 blog, 1 seo, bdar-auditas (desktop + mobile). Patvirtinti Hanken rendering OK; jei reikia — koreguoti tracking/dydžius.
2. **Footer kontrasto auditas kituose puslapiuose** — patikrinti bdar-auditas/blog/seo footer WCAG, taikyti tą patį AA fix jei reikia.
3. **Chat boto integracija** — kai user įdiegs, patikrinti z-index/overflow konfliktą su Veriva + parinkti Hanken Grotesk boto admin panelėje (vizualus suderinamumas).

### Production verifikacija (live, curl — NE vizuali)

| Test | Statusas |
|---|---|
| veriva.lt font link = Hanken Grotesk | ✅ |
| index.css `?v=20260609b` LIVE, 0 Syne/Jakarta | ✅ |
| /, /blog, /bdar-auditas, 2 seo, 1 blog post → 200 | ✅ |
| outlier seo (Inter→Hanken) LIVE | ✅ |
| 0 senų šriftų likučių bet kur | ✅ |
| Vizualus rendering naršyklėje | ⬜ NEPATIKRINTA |

---

## Sesija #26: 2026-06-09 — gsc-indexing-fix

### Ką padarėme

**Kontekstas**: User pateikė 2 GSC screenshot'us — (1) legacy WP URL'ai „Patvirtinimas nepavyko" (2026-05-30), (2) `/seo/*` puslapiai „Crawled, currently not indexed". Klausimas: kodėl neindeksuojami + kaip ateityje išvengti. „tikrink ir taisyk ir testuok".

**Diagnozė (gyvi curl testai + content audit):**
1. **Legacy URL redirect hops** — Vercel `trailingSlash:false` normalizuoja PRIEŠ redirects/middleware → 2-3 hops double-slash (`//`) WP artefaktams. 2-hop Google'ui priimtinas (iki 5 OK).
2. **`/seo/*` neindeksavimas NE techninė klaida** — self-canonical✅, index,follow✅, sitemap✅, robots.txt leidžia✅. Tai „crawled-not-indexed": naujas domenas + 38 panašūs puslapiai per 3 sav. → crawl budget taupymas (#1 priežastis). + AI-šablono pėdsakas (33/38 meta desc „Sužinokite, kaip…").
3. **UTF-8 mojibake** — `bdar-dokumentai-monei` H1 „ä¯monei", `bdar-paslaugos-mon-ms` „ä¯monäms" (double-encoded `į`). 2 failai, po 4 vietas (H1, breadcrumb schema, img alt, figcaption).

**Fix'ai (4 commit'ai į main, visi LIVE):**
1. **`8ad2d4e` vercel.json** — WP redirect patterns praplėsti (`/wp-json` be slash, `/xmlrpc.php`, `/feed`, `/author`, `/category`, `/tag`), `:slash*` wildcard.
2. **`bf03f11`→`c2fd632`** — Edge middleware bandymas legacy 1-hop; PATVIRTINTA kad neapeina trailingSlash (Vercel order: trailingSlash→middleware→redirects), **revert'inta**. middleware.ts NEEGZISTUOJA.
3. **`4aa217f`** — UTF-8 mojibake fix (2 seo failai, „Bdar"→„BDAR").
4. **`91b6323`** — noindex 17 thin/dublikatų seo (~1550-1820ž.) → `noindex,follow` + išimti iš sitemap (49→32 URL). Strategija **kokybė>kiekis** (user pasirinko AskUserQuestion): koncentruoti crawl trust 21 stipriam (3000ž.). Link equity teka per follow.

**noindex'inti 17**: valdymo-sistemos-kibernetinio-saugumo-auditas, internal-gdpr-documentation, kibernetinio-saugumo-istatymas-aktuali-redakcija/e-tar, duomenu-perdavimo-tinklo-prieziura, apple-irenginiu-valdymo-mokymai, nacionalinio-kibernetinio-saugumo-centro-mokymai, ivairoves-ir-itraukties-politika, informacijos-saugumo-politika, public-it-technologiju-proverzis-ir-saugumas, kibernetines-higienos-mokymai, bdar-paslaugos-mon-ms, duomenu-privatumo-politika, bdar-dokumentai-monei, bdar-paslaugos-verslui, duomenu-apsaugos-pareiguno-paslaugos-bvpz, nis2-atitiktis.

### Kas liko / nepatvirtinta

- **🟡 Šabloninės meta description** — 33/38 prasideda „Sužinokite, kaip…" (mass-generated signalas). Identifikuota, NE fix'inta. Reikia generator prompt fix SEO-Claude-code repo.
- **🟡 Encoding bug šaltinis nepatikrintas** — sutaisyti 2 paveikti failai, bet KODĖL generatorius sukūrė `į`→`ä¯` lieka neištirta → gali pasikartoti.
- **🟡 GSC user action** — submit sitemap (32 URL), URL Inspection + Request Indexing 21 stipriam, re-validate legacy URL fix. Rezultatas per kelias dienas–2 sav.
- **🟡 noindex grąžinimas** — augant autoritetui nuimti palaipsniui (po 4-8 sav., jei stiprieji indeksuojasi).

### Kitas žingsnis

1. **GSC user action** — submit sitemap.xml + Request Indexing 21 likusiam stipriam seo + re-validate legacy URL „Patvirtinimas".
2. **SEO-Claude-code generator fix** (atskira sesija) — (a) encoding validacija prieš deploy, (b) uždrausti šabloną „Sužinokite, kaip…" meta desc.
3. **Stebėti 4-8 sav.** — ar 21 stiprus seo pradeda indeksuotis; jei taip — nuimti noindex palaipsniui.

### Production verifikacija (live, curl)

| Test | Statusas |
|---|---|
| Encoding fix LIVE: H1 „BDAR dokumentai įmonei" / „BDAR paslaugos įmonėms" | ✅ |
| noindex LIVE: 17 silpnų → `noindex, follow` | ✅ |
| Stiprūs lieka `index, follow` | ✅ |
| sitemap.xml → 32 `<loc>`, 0 noindex'intų | ✅ |
| Legacy URL'ai → 308→200, canonical=root | ✅ |
| Mojibake nerasta niekur (visi seo+blog) | ✅ |

---

## Sesija #25: 2026-06-09 — blog-2-straipsniai-incidentai-mokymai

### Ką padarėme

**Kontekstas**: blog.html turėjo 2 „Netrukus" placeholder korteles. User paprašė parašyti abu straipsnius su SEO/GEO taisyklėmis, raktažodžiais, anti-AI tekstu.

**Sukurta (5 nauji failai)**:
- `blog/incidentu-valdymas-72-valandos-bdar.html` (~2850ž, Kibernetinis saugumas) — BDAR 33/34 str. protokolas: 6 reagavimo etapai, „sužinojimo" momentas, rizikos vertinimas, pranešimas VDAI, subjektų informavimas, pažeidimų registras, tvarkytojo vaidmuo, 5 dažniausios klaidos. Autorius Justinas.
- `blog/darbuotoju-bdar-mokymai.html` (~2400ž, Mokymai) — BDAR 39 str. + atskaitomybės principas (5 str. 2 d.): 6 principai, subjektų teisės 15-22 str., role-based mokymai, dokumentavimas. Dublio su phishing-mokymai vengta (teisinė pusė, ne IT). Autorė Marina.
- 3 brand SVG: `incidentu-valdymas-hero.svg` (72h laikrodis), `incidentu-valdymas-etapai.svg` (6 nodes diagrama), `darbuotoju-bdar-mokymai-hero.svg` (checklist board).

**Pakeisti**: `blog.html` (2 placeholder div → live `<a class="bc">` kortelės, filtrai sauga/mokymai), `sitemap.xml` (+2 URL, lastmod 2026-06-09, priority 0.8).

**SEO/GEO**: pilnas schema @graph kiekvienam (BlogPosting+BreadcrumbList+FAQPage 12 Q/A+HowTo 6 žingsnių+Review). `.definition` GEO snippet pirma pastraipa. Title ≤54, meta desc ≤149, canonical==og:url clean URL. Internal links į 4 esamus pillarus (clean URL). Konkretūs straipsnių numeriai (33/34/39/5/32 str., EDPB 9/2022).

**Anti-AI**: varijuojami sakinių ilgiai, konkretūs LT scenarijai (penktadienio incidentas, HR „teisės būti pamirštam" užklausa), AI klišių vengta, bullet+tankūs paragrafai.

**Metodas**: 2 page-builder agentai nutrūko (network socket, 9 min) prieš Write → straipsnius parašiau pats sekvenciškai (CSS chrome kopijuotas 1:1 iš phishing-mokymai). 2 audito agentai (seo-specialistas + frontend-revizorius) post-hoc.

**Ištaisyta eigoje**: FAQPage JSON klaida (ASCII closing `"` po `„kažkada prieš metus"` → lietuviška `"`), meta desc 166→149 simb., og:title 62→51 simb.

### Kas liko / nepatvirtinta

- **🟡 Production NEPATIKRINTA po deploy** — curl 200 / hero SVG 200 / blog kortelių filtras naršyklėje neverifikuoti (push'inta be live verifikacijos).
- **🟡 Hero SVG vizualiai neperžiūrėti** — ypač `incidentu-valdymas-etapai.svg` (6 nodes ankštai, galimas teksto overflow).
- **🟡 og:image lieka SVG** — LinkedIn/Twitter share preview ribotas (sisteminis Veriva pattern, s22 DECISION_LOG; batch WebP — atskira sesija).
- **🟡 Frontend agentas false-positive** — pranešė „etapai.svg img be alt" (faktiškai alt yra, eil. 664). Tikro defekto nebuvo.

### Kitas žingsnis

1. **Production verifikacija** — curl `/blog/incidentu-valdymas-72-valandos-bdar` + `/blog/darbuotoju-bdar-mokymai` → 200; hero SVG → 200; blog.html kortelių filtras naršyklėje.
2. **GSC** — pateikti 2 naujus URL indeksavimui; submit sitemap update.
3. **Hero SVG vizuali peržiūra** — ypač etapai.svg 6 nodes išdėstymas mobile/desktop.

---

## Sesija #24: 2026-06-08 — bdar-auditas-klausimynas

### Ką padarėme

**Kontekstas**: Vartotojas pateikė MasterLegal 42 klausimų BDAR atitikties klausimyną (Excel). Reikalavimas: mygtukas svetainėje → klausimynas atskirame lange → klientas pildo → AI vertina → išvada į el. paštą + lead į sistemą + newsletter.

**Sprendimai (AskUserQuestion)**: Hibridas scoring (balai → %, AI rašo išvadą) · lead → Supabase · išvada → kliento email · UI → atskiras puslapis `/bdar-auditas` (ne modal, dėl 42 kl. mobile UX + SEO).

**Sukurta (10 naujų failų)**:
- `lib/bdar-questions.ts` — 42 klausimai, 8 sekcijos, tipai single/multi/open (single source). Excel tvarka atstatyta (numeracija buvo sulaužyta).
- `lib/bdar-scoring.ts` — deterministinis % (21 vertinamas kl., 9 kritiniai ×2, max 290). Rizikos žymekliai (Q20/23/33/36/37/38) NEmažina %. „netaikoma"→išmetama.
- `lib/bdar-audit-prompt.ts` — AI orientacinės išvados promptas (gpt-4.1 via lib/claude.ts, kuris faktiškai OpenAI).
- `api/forms/bdar-audit.ts` — **EDGE** endpoint: validate→score→AI→Supabase→Resend. Viešas (be x-api-key): honeypot+origin+rate-limit+consent.
- `bdar-auditas.html` + CSS + 2× JS — wizard, Veriva brand, mobile-first, a11y.
- `migrations/003_bdar_audit.sql` — `bdar_audit_responses` (RLS service-role-only).
- `docs/bdar-scoring-matrica.md` — teisinis review MasterLegal.
- `assets/img/logo-email.png` — email logotipas (SVG→PNG, nes Gmail nerodo inline SVG).

**Pakeisti**: `index.html` (hero mygtukas "Pilnas BDAR auditas" → /bdar-auditas, balta rėmelis), `sitemap.xml`, `vercel.json` (build+rewrite), `.env.example` (IP_HASH_SALT), `KNOWN_ISSUES.md` (KI-014).

**QA (2 agentai + E2E)**: TS 0 klaidų. Scoring lokalus 0/100/46%. XSS sanitize 10/10. E2E production naršyklėje: 8 sekcijos→consent→submit→success, 0 console klaidų. Ištaisyta: 3 P0 + 5 P1 (rate limit, allowlist HTML sanitize, IP hash crypto.subtle, consent, a11y role=alert/focus-visible, await log Edge, 500 detail leak).

**Išspręstos krizės eigoje**:
1. **Node ESM crash** (`Failed to load the ES module`) — tsconfig `module:ESNext` lūžino @vercel/node CJS → konvertuota į Edge runtime (kaip contact.ts/health.ts).
2. **2 Supabase projektai** — migracija ėjo į `vaqzleubdim` (riko8825's Project), Vercel rodo į `aqppyvamzdjydnfpgccu` (projektas "Empirra", shared su Veriva). Paleista teisingame.
3. **Resend "domain not verified"** — Vercel raktas iš kitos paskyros; atnaujintas + redeploy (env reikalauja redeploy).
4. **Bug "SEKCIJA 9 IŠ 8 / 113%"** — goToStep clamp [0, len-1].
5. **1→3 consent checkbox** (privatumo* + naujienlaiškiai + rinkodara, kaip user pageidavo).
6. **Email logotipas + brand spalvos** (cyan akcento linija).

**User-pataisymai**: hero spalva (cyan→balta), dviguba rodyklė, consent 3 checkbox, email logotipas.

### Kas liko / nepatvirtinta

- **🟡 Scoring matrica NEpatvirtinta teisiškai** — balai DRAFT, [docs/bdar-scoring-matrica.md](docs/bdar-scoring-matrica.md) laukia MasterLegal review (kritiniai kl., „sena/formali"=4 balas, slenksčiai 80/60/40).
- **🟡 Email logotipas vizualiai nepatikrintas** — Playwright peržiūra nepavyko, test email išsiųstas (user turi patvirtinti Gmail).
- **🟡 Q41 multi-select** — user pradėjo klausti ar Q41 (dokumentai įvertinimui) turi būti multi-select, liko neišspręsta (pertrauktas).
- **🟡 UX rizika** — pirmas variantas visada „taip" → per lengva netyčia 100% (palikta sąmoningai, be įspėjimo).
- **🟡 KI-014** — rate limit per-isolate Edge (cost-DoS limitacija, dokumentuota).

### Kitas žingsnis

1. **User patvirtina email logotipą** Gmail'e (LOGO TEST UAB laiškas) — ar dydis/spalvos OK.
2. **Scoring teisinis review** — MasterLegal peržiūri docs/bdar-scoring-matrica.md, balai koreguojami lib/bdar-questions.ts.
3. **Q41 multi-select sprendimas** — jei reikia, dokumentai-ivertinimui → multi (lib/bdar-questions.ts + bdar-questions-data.js + scoring NON_SCORED).

### Production verifikacija (live)

| Test | Statusas |
|---|---|
| `/bdar-auditas` → 200, 42 kl./8 sekcijos | ✅ |
| Endpoint POST (taip→100%, ne→0%, mišrus→tarpinis) | ✅ |
| E2E naršyklėje: wizard→consent(3 checkbox)→submit→success | ✅ |
| Supabase insert `bdar_audit_responses` (`aqppyvamzdjydnfpgccu`) | ✅ |
| Email klientui + Veriva notif (Resend, veriva.lt verified) | ✅ |
| Email logotipas `logo-email.png` → 200 | ✅ (vizualiai user tvirtina) |
| Newsletter consent → `newsletter_subscribers` upsert | ✅ |

---

## Sesija #23: 2026-05-29 — prod-health-404-env-fix

### Ką padarėme

**Kontekstas**: Vartotojas pateikė 4 atskiras production problemas screenshot'ais: (1) Google sitelink'ai `/kontaktai` + `/bdar-atitiktis` → 404, (2) Health Check GitHub Actions workflow #17 fail loop'as (17+ fail'inusių run'ų), (3) `supabase_key:false` health'e — pasibaigęs raktas, (4) GMB Maps nuoroda `/apie-imone` → 404.

**1. GMB/GSC 404 redirect'ai (commit `d4f6153` + `5514b29`, `vercel.json`)**:
- Diagnozė: Google/GMB indeksavo URL'us, kurių failai neegzistuoja. `cleanUrls:true` darė 308 `.html`→clean, bet originalų `.html` nėra → 404.
- `/kontaktai` + `/kontaktai/` → `/#kontaktai` (index.html:1883 anchor, kontaktinė sekcija)
- `/bdar-atitiktis` + `/bdar-atitiktis/` → `/seo/bdar-auditas-lietuvoje` (200 OK, semantiškai artimiausias)
- `/apie-imone` + `/apie-imone/` + `/apie` → `/#apie` (index.html:1090 about sekcija)

**2. Health Check workflow fix (commit `6e591f9`, `vercel.json`)**:
- Šaknis: `/api/internal/health` → 404, bet `/api/internal/health.ts` → 200. Vercel `@vercel/node` builder neatlieka automatinio `.ts` suffix strip'o — reikia explicit rewrite. Kiti API endpoint'ai (blog-gen/blog-approve/telegram-webhook) jau turėjo rewrite, health.ts + forms/* buvo užmiršti.
- Pridėti 3 rewrites: `/api/internal/health`, `/api/forms/contact`, `/api/forms/audit-request` → `*.ts`
- Verifikacija: workflow_dispatch run [#26511932270](https://github.com/riko8825/Veriva-geras/actions/runs/26511932270) → ✅ success 9s (anksčiau loop fail)

**3. Supabase raktas atnaujintas (commit `f8753d7` redeploy trigger)**:
- `SUPABASE_SERVICE_ROLE_KEY` Vercel'yje (Added May 5) turėjo seną/pasibaigusį raktą → `supabase_key:false`
- User atnaujino nauju Supabase `sb_secret_D2fyy...` formato raktu (naujasis Supabase API key formatas, pakeitė seną JWT `eyJ...`) — abiejuose projektuose
- `lib/supabase.ts` `createClient` suderinamas su nauju formatu be pakeitimų
- Empty commit redeploy → health: `supabase_key:true` ✅

### Kas liko / nepatvirtinta

- **`RESEND_FROM_EMAIL` vis dar `false`** — niekada nebuvo įdėtas į Vercel (NE pasibaigęs, paprastas string). Reikia įdėti `hello@veriva.lt`, BET pirma patvirtinti veriva.lt domeną [Resend → Domains](https://resend.com/domains)
- **`/apie` veda į anchor, ne realų puslapį** — GMB tikisi pilno "apie įmonę" puslapio. Laikinas sprendimas kol `apie.html` nesukurtas
- **2-hop redirect'ai** acceptable Google'ui: `/apie.html`→`/apie`→`/#apie`, `/kontaktai/`→`/kontaktai`→`/#kontaktai`
- **GMB profilio nuorodų peržiūra nepadaryta** — šablonas kartojasi (3 GMB/GSC 404 šią sesiją). Verta peržiūrėti GSC „Pages → Not indexed" + GMB nuorodas vienu kartu

### Kitas žingsnis

1. **`RESEND_FROM_EMAIL` setup** (TU) — patvirtinti veriva.lt [Resend Domains](https://resend.com/domains), tada Vercel env var `hello@veriva.lt` → redeploy → `resend_from:true`
2. **GSC + GMB 404 audit** (~30 min) — peržiūrėti [GSC](https://search.google.com/search-console) „Not indexed" visus 404 + GMB profilio nuorodas, sutaisyti likusius vienu batch'u
3. **Multi-page skeletons** (paslaugos/apie/kainos/kontaktai/404) — pakeisti laikinus anchor redirect'us realiais puslapiais

### Production verifikacija (live)

| Test | Statusas |
|---|---|
| `/kontaktai` → 308 → `/#kontaktai` | ✅ |
| `/bdar-atitiktis` → 308 → `/seo/bdar-auditas-lietuvoje` (200) | ✅ |
| `/apie-imone` + `/apie` → 308 → `/#apie` | ✅ |
| `/api/internal/health` → 200 OK | ✅ |
| Health Check workflow #26511932270 → success | ✅ |
| health `supabase_key:true` | ✅ |
| health `resend_from:false` | ⬜ (user action) |

---

## Sesija #22: 2026-05-27 — rc-nutekejimo-blog-post

### Ką padarėme

**Kontekstas**: Vartotojas pateikė konkretų brief'ą: slug `/blog/registru-centro-duomenu-nutekejimas-2026`, struktūra (chronologija + duomenys + RC savitarna + scam'ai + verslo CTA), 4 target keywords, info iš interneto (hot news). Greitis = pozicija — Google dabar indeksuoja viską apie šį įvykį.

**1. Info gathering (4× WebSearch lygiagrečiai)**:
- LRT, 15min, Respublika, tv3.lt — chronologija (sausis–balandis ataka, 04-03 pirmas signalas ne iš RC, 04-13 RC preliminarus, 05-07 oficialus VDAI pranešimas), faktai (600k+ įrašų, €111k žala, asmens kodai + NT adresai pavogti, telefonai/email/banko/sandoriai nenutekėjo)
- VDAI pareiškimas: iki €60k bauda RC (viešojo sektoriaus lubų dydis), atskirų skundų NEnagrinės
- Atakos vektorius: Migracijos departamento paskyros, prisijungimai iš užsienio valstybės
- RC paleidžia savitarnos modulį asmeniniam patikrinimui

**2. Failo struktūra (commit `966d666`, +1108/-5)**:
- `blog/registru-centro-duomenu-nutekejimas-2026.html` — 947 lines, ~2400 ž., 11 min skaitymo
  - NewsArticle (ne BlogPosting — hot news E-E-A-T) + BreadcrumbList + FAQPage (12 Q/A)
  - 2× Person authors (Marina + Justinas) su `jobTitle` ir `worksFor`
  - 6 H2: chronologija (timeline su `::before` dot'ais), kokie duomenys (lentelė), kaip pasitikrinti (žingsniai + external link), ko tikėtis (scam patterns + VDAI), 6 žingsniai gyventojui, 3 pamokos verslui
  - 7 šaltinių sąrašas straipsnio gale + inline citations
  - 2 CTA blokai (vidury verslo focus, pabaigoje universalus)
- `assets/img/blog/rc-nutekejimas-hero.svg` — 129 lines, 1200×630, Veriva brand (page-builder agent)
- `blog.html` — nauja kortelė PIRMOJE vietoje su `.bc-hot-badge` raudonu "Aktualu"; bonus: 5 esamų straipsnių `.html` suffix'ai pakeisti į clean URLs (atitinka s21 KI-013)
- `sitemap.xml` — naujas URL `priority 0.9`, `changefreq daily`, `lastmod 2026-05-27`

**3. 3 paraleliai paleisti audit agentai**:
- **page-builder** — sukūrė hero SVG (DB cilindrų stack + sulaužyta spyna + €111k žalos kortelė, layout identiškas `bdar-baudos-hero.svg`)
- **frontend-revizorius** (verdict: NEEDS WORK → FIXED) — 4 P1 fix'ai:
  - Inline `style="color:var(--red)"` lentelėje → `.status-stolen` klasė (4×)
  - Lentelė į `.table-wrap` su `overflow-x:auto` mobile saugumui
  - `.callout-red strong` kontrasto fix #dc2626 → #b91c1c (WCAG AA)
  - `<section class="rel">` + `aria-label="Susiję straipsniai"` (landmark)
  - 12× `rel="noopener"` → `rel="noopener noreferrer"`
- **seo-specialistas** (verdict: FIX FIRST → 2/3 FIXED) — P0/P1 fix'ai:
  - `datePublished` ISO 8601 su laiku `2026-05-27T09:00:00+03:00` (article meta + schema)
  - FAQ schema ↔ HTML 8 klausimai sinchronizuoti (Google rich result reikalauja exact match)
  - `author` Organization → 2× Person (Marina + Justinas)
  - Definition trumpinta 74 → 58 ž. (AI Overview snippet'as netrimina)

**4. Git operations**:
- Stash unstaged docs (4 docs + token-audit.mjs orphan)
- `git pull --rebase origin main` — 3 SEO Bot auto-deploy commits (`b133c96`, `8577e60`, `60fcfe3`) integruoti per rebase
- Sitemap'as auto-resolved (SEO Bot pridėjo 3 naujus seo/* — `duomenu-tvarkymo-sutartis`, `informacijos-saugumo-politika`, `sutikimas-tvarkyti-asmens-duomenis`)
- Push OK → final commit `966d666`
- Stash unstash'as → docs/* atgal į working tree

**5. Production verifikacija (curl, ~70s po push)**:
- ✅ `/blog/registru-centro-duomenu-nutekejimas-2026` → 200 OK, 0 redirect hops
- ✅ `.html` versija → 308 → clean URL
- ✅ Hero SVG → 200 OK (7.8KB)
- ✅ Blog index 200, sitemap 200 su RC URL įrašu
- ✅ Lokalus HTTP serveris stoppped post-deploy

### Kas liko / nepatvirtinta

**GSC actions (TAVO action)**:
- Manual URL Inspection + Request Indexing GSC'e — kritinis greičiui hot news cycle'e
- Submit sitemap update (auto-discover su nauju `lastmod 2026-05-27` turi veikti, bet manual nudge geriau)
- Monitor SERP positions per 7-14 dienų primary KW (predicted: 3-8 rank "RC duomenų nutekėjimas 2026", 1-3 FAQ rich result "ar mano duomenys pavogti")

**Šios sesijos technical debt**:
- **og:image yra SVG** — sisteminis Veriva pattern'as (visi 4 hero failai SVG). LinkedIn/Twitter share preview gali nesirodyti dalyje platformų. Reikia atskiros sesijos: konvertuoti visus blog hero SVG → 1200×630 WebP per `sharp` arba `puppeteer` SVG→PNG rendering. P1, ne šio scope'o
- **Hero SVG nepatikrintas vizualiai** — tikiu page-builder agentu, bet nepamatačiau Chrome'e prieš commit. Galimas vizualinis bug live'e
- **Internal link į DPO pillarą** verslo CTA sekcijoje nepridėtas (yra tik straipsnio pamokų sekcijoje). SEO P1
- **Definition `<strong>` tag dubliuoja** schema'os `description` formuluotę (per žemas KW density risk, ne kritinis)
- **Straipsnis nr. 4 (planuojamas)** — paliktas tekstinis teaser callout'e be hard link'o (kaip vartotojas pasirinko brief'e). Reikės kurti atskirą "verslo atsakomybės" straipsnį

**Carry-over nuo s21** (nepasikeitė):
- ~~KI-013 Redirect Architecture~~ — ✅ UŽDARYTAS s21
- KI-012 hero SVG placeholder DPO + BDAR 6 str. pillaruose (vis dar laukia)
- SEO engine generator quality (atskira sesija SEO-Claude-code)
- Frontend P0 sisteminis (inline styles, figure testimonial, h3 CTA) 5 pillaruose
- 5 Sensitive env vars blog automation runtime
- Multi-page skeletons (paslaugos/apie/kainos/kontaktai/404)
- brief.html inline `<style>` extract
- `scripts/token-audit.mjs` orphan untracked failas (ne šios sesijos)

### Kitas žingsnis

1. **GSC submit + monitoring** (TU, šiandien + 7-14d) — Request Indexing GSC'e, monitor SERP positions ir FAQ rich result aktyvavimą primary KW
2. **Straipsnis nr. 4 — verslo atsakomybė po RC incidento** (~2-3h, kol news momentum aktyvus) — pillar fokusas: 3rd-party rizika, DPA sutartys, kada esi „valdytojas" / „tvarkytojas" pagal BDAR
3. **Hero SVG → WebP konversija batch'as** (~30 min, jei nori) — visiems 5 esamiems blog hero failams + naujam RC hero, kad social share preview veiktų visose platformose

### Production verifikacija (live)

| Test | Statusas |
|---|---|
| `/blog/registru-centro-duomenu-nutekejimas-2026` → 200 OK, 0 hops | ✅ |
| `.html` → 308 → clean URL | ✅ |
| Hero SVG 200 OK (7.8KB) | ✅ |
| Blog index 200 (nauja kortelė pirma, "Aktualu" badge) | ✅ |
| Sitemap 200 su RC URL, priority 0.9 daily | ✅ |
| Commit `966d666` push'intas main | ✅ |
| Vercel deploy READY ~40s | ✅ |

---

## Sesija #21: 2026-05-26 — gsc-non-indexed-fix

### Ką padarėme

**Kontekstas**: Vartotojas pateikė 5 CSV failus su GSC non-indexed URL'ais. 8 unikalios problemų kategorijos: apex/www canonical konfliktas, double redirect chain (307→308), canonical/cleanURL mismatch, WordPress legacy URLs (`/wp-login.php`, `/wp-json/`, `/privatumo-politika/`, `/kibernetinis-saugumas/`, `/mokymai/`, `/pagrindinis/`), trailing slash normalization.

**1. Diagnozė (curl-driven)**:
- **Bug #1** — apex → www buvo **307 (temp)**, ne 301. Google neinterpret'ino kaip nuolatinį canonical.
- **Bug #2** — Double redirect chain: `veriva.lt/brief.html` → 307 → `www.veriva.lt/brief.html` → 308 → `www.veriva.lt/brief` (2 hops).
- **Bug #3** — Canonical mismatch: sitemap'ai ir HTML canonical tag'ai naudojo apex (`https://veriva.lt/...`), bet Vercel primary domain buvo `www.veriva.lt` → apex 307 redirect'ino į www → Google sumišęs.
- **Bug #4** — WordPress legacy URLs 307 redirect'inosi į www, kur 404. Reikėjo redirect į home (Vercel nepalaiko 410 status code custom redirects).
- **Bug #5** — `brief.html` canonical = `/brief.html`, bet Vercel `cleanUrls: true` reiškia, kad `/brief` yra real URL. Canonical turi sutapti su clean URL.

**2. Fix'ai (commit `3282627`, 32 failai)**:
- **Vercel Domains UI**: `veriva.lt` (apex) padarytas Primary Production, `www.veriva.lt` → 308 Permanent Redirect → apex. Tai apsuko anksčiau buvusią kryptį.
- **`vercel.json` redirects** (+25 redirects): 8 `.html` → cleanURL (brief/blog/slapukai/privatumas/paslaugos/apie/kainos/kontaktai), 5 WP legacy (`/wp-login.php`, `/wp-admin/*`, `/wp-json/*`, `/wp-includes/*`, `/wp-content/*` → `/`), 4 LT path (`/privatumo-politika` → `/privatumas`, `/pagrindinis` → `/`, `/kibernetinis-saugumas` → `/`, `/mokymai` → `/`).
- **Canonical + og:url tags** (11 files): `.html` pašalinta iš canonical ir og:url visuose root HTML + blog/*.html + blog/template.html.
- **Internal hrefs** (17 HTML files batch sed'u): visi `href="/blog.html"`, `/brief.html`, `/privatumas.html`, `/slapukai.html`, ir absolute `https://veriva.lt/*.html` → clean URL (apima root + blog + seo).
- **Sitemap.xml**: 12 → 28 URLs. Pridėti: `/`, `/blog`, `/privatumas`, `/slapukai`, 5 blog posts, 3 nauji seo (`/seo/kibernetinio-saugumo-mokymai`, `/seo/tis2-istatymas`, `/seo/valdymo-sistemos-kibernetinio-saugumo-auditas` — atsirado per rebase merge nuo SEO Bot per sesijos vidurį).
- **blog/template.html**: schema.org JSON-LD `@id`, `url`, `mainEntityOfPage` + 3 social share linkų `{{POST_SLUG}}.html` → `{{POST_SLUG}}`.

**3. Verifikacija (curl post-deploy)**:
- ✅ `veriva.lt/` → 200 OK
- ✅ `www.veriva.lt/` → 308 → apex (vienas hop)
- ✅ `veriva.lt/{brief,blog,slapukai,privatumas}.html` → 308 → clean
- ✅ `veriva.lt/blog/bdar-baudos-lietuvoje.html` → 308 → `/blog/bdar-baudos-lietuvoje`
- ✅ WP legacy (be slash): `/wp-login.php`, `/wp-json` → 308 → `/`
- ✅ Sitemap accessible, 28 `<loc>` entries
- ⚠️ `www.veriva.lt/brief.html` → 2 hops (www→apex.html→clean). Acceptable Google'ui.
- ⚠️ WP legacy su trailing slash → 2 hops (`/wp-json/` → `/wp-json` → `/`). Acceptable.

**4. Git operations**:
- Push REJECTED — remote turėjo 3 SEO Bot commits (per sesijos vidurį auto-deploy nauji seo puslapiai)
- `git stash` (4 docs) + `git pull --rebase` → CONFLICT `sitemap.xml`
- Manual merge: paimti SEO Bot pridėtus 3 naujus seo URL'us + mano pridėtus 9 core URLs
- Naujiems seo puslapiams pritaikytas tas pats sed (internal `.html` link'ai → clean)
- `git rebase --continue` → final commit `3282627` (32 files, +397/-328)
- Push OK, Vercel deploy READY ~40s

### Kas liko / nepatvirtinta

**GSC veiksmai (TAVO action, ne mano)**:
- Pateikti "Indeksavimo užklausą" Tier 1-3 URL'ams (limit ~10-12/dieną)
- Validate fix kiekvienai non-indexed kategorijai (`Page with redirect`, `Duplicate without canonical`, `Alternate page with canonical`, `Crawled — not indexed`)
- Resubmit sitemap.xml (jei dar nesubmittintas po naujo deploy'o)
- Timeline: 1-3d Tier 1, 3-7d Tier 2, 7-30d Tier 3, 14-60d WP legacy išmetimas

**Technical debt (šios sesijos)**:
- Nepatikrinta ar `og:image` URL'ai dar turi `.html` referensų (paskubėjau sed'u, neaudit'inau visų OG/Twitter meta)
- `<lastmod>` trūksta core sitemap URL'ams (`/`, `/blog`, `/privatumas`, `/slapukai`) — tik blog posts ir seo turi
- 2-hop redirect'ai (`www→apex→clean` su `.html`) — nereparable be Edge Middleware (Vercel `redirects` neturi hostname matching)
- WP legacy trailing slash 2-hop (`/wp-json/` → `/wp-json` → `/`) — nereparable be `trailingSlash: true` config

**Carry-over nuo s20**:
- SEO engine generator quality (hallucinated URLs, repetitive phrasing, external_links floor) — atskira sesija SEO-Claude-code projekte
- KI-012 hero SVG placeholder (DPO + BDAR 6 str.)
- ~~KI-013 Redirect Architecture~~ — **UŽDARYTAS šios sesijos** (apex canonical + clean URLs fix)
- Frontend P0 sisteminiai carry-over (inline styles, figure testimonial, h3 CTA)
- 5 Sensitive env vars blog automation runtime
- Multi-page skeletons (paslaugos/apie/kainos/kontaktai/404) NĖRA — vercel.json jau turi jiems redirect'us (no-op kol nesukurti)

### Kitas žingsnis

1. **GSC monitoring** (TU, 2-3d) — pateikti indeksavimo užklausas Tier 1-3 URL'ams, validate fix kiekvienai non-indexed kategorijai
2. **Multi-page skeletons** (~2-3h) — `/paslaugos`, `/apie`, `/kainos`, `/kontaktai`, `/404` minimum viable. Vercel.json jau parengtas (redirect'ai aktyvūs, bet 404 grąžinama kol nesukurti)
3. **Generator quality fix** (atskira sesija SEO-Claude-code) — hallucinated URLs allowlist, varied phrasing, external_links 2+ floor

### Production verifikacija (live)

| Test | Statusas |
|---|---|
| `https://veriva.lt/` → 200 OK | ✅ |
| `https://www.veriva.lt/` → 308 → apex (1 hop) | ✅ |
| `.html` → clean URL (5 root) | ✅ visi 308 |
| `.html` → clean URL (5 blog posts) | ✅ visi 308 |
| Sitemap 28 URLs accessible | ✅ |
| WP legacy → `/` | ✅ (1 hop be slash, 2 hop su slash) |
| Vercel deploy ddfb6b1→3282627 | ✅ Ready |
| Commit `3282627` push'intas main | ✅ |

---

## Sesija #20: 2026-05-23 — seo-engine-fix

### Ką padarėme

**Kontekstas**: Vartotojas atsiuntė 2 screenshot'us — `Weekly SEO Generation` workflow (`riko8825/SEO-Claude-code` repo, ne Veriva-geras!) fail'ino su `ERROR: no validated pages in Veriva DB`. 4 failed runs eilę.

**1. Diagnozė (4 root causes per loop)**:
- **Bug #1 — validator FAQ markup mismatch**: `src/validator/checks_content.py` `_check_faq` skaičiavo TIK `<details>` elementus. Bet `templates/base.html:424-451` veriva chrome (`client_chrome == 'veriva'`) renderina `<div class="faq-item">` (blog-parity rewrite). Generated HTML turėjo 10 FAQ items, validator matydavo 0 → `faq count 0 < 4` HARD_BLOCK. 100% LT runs failed.
- **Bug #2 — empirra CSS comment leak**: `templates/_chrome_veriva.html:159` turėjo komentarą `/* span the empirra chrome animates ... */`. Multi-client leakage scan substring'iniu būdu žiūri kiekvieną byte'ą HTML'e → `exit 3`.
- **Bug #3 — empty batch = failure**: `scripts/deploy_veriva.py:259-261` exit'indavo 1 kai `_validated_slugs` grąžindavo tuščią sąrašą (validator-rejected ARBA quality_os cannibalization-demoted page). Net jei prior published puslapiai gyvi — workflow failure → email.
- **Bug #4 — generator content quality (NE blocker, atskleista)**: hallucinated external URLs (fake delfi/15min/lrytas/vz slugs → 404), repetitive phrasing (16× "BDAR konsultacija gali"), external_links 2+ floor, pillar/supporting cannibalization.

**2. Fix'ai SEO-Claude-code repo'e (3 commits)**:
- `a7b09b4` — `fix(validator): count veriva .faq-item markup in addition to <details>` (`src/validator/checks_content.py`, +10/-2): `max(details_count, faq_item_count)` + `faq-sec` exempt iš `_check_empty_sections`
- `e7f7489` — `fix(veriva-chrome): drop 'empirra' substring from CSS comment` (`templates/_chrome_veriva.html`, +1/-1): `empirra` → `default`
- `673401e` — `fix(deploy-veriva): empty new batch is a no-op, not a failure` (`scripts/deploy_veriva.py`, +17/-2): distinguish `client_live==0` (real failure, exit 1) nuo "nothing new to ship" (no-op, exit 0)

**3. Verifikacija — 7 workflow_dispatch loop'as**:
- Iter 1 ❌ (post-faq-fix) — atskleidė deploy_veriva no-op bug
- Iter 2 ✓ NO-OP (`dpo-paslaugos` validator-rejected: `external_links 1 < 2`)
- Iter 3 ✓ deployed `duomenu-apsaugos-pareigunas`
- Iter 4 ✓ deployed `duomenu-apsaugos-pareiguno-paslaugos-bvpz`
- Iter 5 ✓ deployed `nis2-atitiktis`
- Iter 6 ✓ deployed `nis2-direktyva-kam-taikoma`
- Iter 7 ✓ deployed `nis2-reikalavimai`

6 ✓ runs paeiliui, 5 nauji LIVE `seo/*` puslapiai. Visi pre-deploy gate'ai (validator + quality_os + multi-client leakage + runtime predeploy) veikia teisingai — gaudo bug'us, leidžia gerus puslapius pro.

**4. Lokalūs testai**: 1012 passed, 3 skipped (`DRY_RUN=true GROQ_API_KEY=test-key-not-real python -m pytest tests/`).

**5. Memory dokumentacija**:
- **NEW** `memory/reference_seo_engine.md` — pilnas workflow flow (12 steps), 3 sutaisytos klaidos su file:line citations, "Ko NEdaryti" taisyklės, diagnostikos žingsniai (`gh run view`, artifact download, CSV inspection), exit code reference
- Atnaujinta `memory/MEMORY.md` index su pointer'iu
- Atnaujinta `memory/project_state.md` — snapshot 2026-05-23 s20, 5 nauji `seo/*` moduliai LIVE statuso lentelėje

**6. Veriva-geras repo gavo 5 auto-deploy commits iš `Empirra SEO Bot`** (paskutinis `nis2-reikalavimai` ~10:58 UTC). Sitemap'as auto-atnaujintas kiekvienam puslapiui.

### Kas liko / nepatvirtinta

**SEO engine generator quality** (atskleista per loop'ą, NE šios sesijos scope):
- **Hallucinated external URLs** — generator gen'ina fake delfi.lt/15min.lt/lrytas.lt/vz.lt slugus, validator gaudo per `EMPIRRA_VALIDATE_EXTERNAL_LINKS=true`. Fix priklauso citation resolver'iui (`data/verified_citations.yaml` allowlist'as) — atskira sesija SEO-Claude-code projekte
- **Repetitive phrasing** — `bdar-konsultacija` page'as turėjo 16× "BDAR konsultacija gali" (LT keyword'ai 2-žodžių leidžia trigram'as build'inti pasikartojančius patternus). Validator gaudo per `_check_lt_repetitive_phrasing`, BET tai content quality issue — fix per prompt engineering, ne per validator threshold tweaking
- **External_links floor (2+)** — `dpo-paslaugos` page'as turėjo tik 1 cited source. Reikia prompt'ui reikalauti `MIN_EXTERNAL_LINKS=2`
- **Pillar/supporting cannibalization** — `bdar-6-straipsnis-1-dalis` (supporting) 100% primary_keyword overlap su `bdar-6-straipsnis` (pillar). Tai nėra TIKRAS cannibalization (skirtingas content scope), BET detector žiūri tik keyword'ą. Reikia arba whitelist'o pillar→supporting pairs, arba keyword'ų geresnio differentiation'o

**Šios sesijos technical debt**:
- **Ne'parašytas pytest test'as `deploy_veriva` no-op path'ui** (`673401e`) — verified tik 6 LIVE workflow runs, ne unit testais. Future regression risk
- **LT `FAQ_MIN_COUNT=4` per žemas pillar'iams** — Veriva blog'as faktiškai naudoja 10-12 FAQ. Validator floor tinka SUPPORTING puslapiams, bet pillar'ams turėtų būti 8+. Reikia thresholds matrix per page_type

**Veriva-geras projekto carry-over** (nepasikeitė nuo s19):
- KI-012 hero SVG placeholder (DPO + BDAR 6 str. — 2 pillarai dabar)
- KI-013 Redirect Architecture (Medium, atskira sesija ~30-60 min, prieš GSC submit)
- Frontend P0 sisteminiai carry-over (inline styles, figure testimonial, h3 CTA hierarchy)
- 5 Sensitive env vars blog automation runtime
- Multi-page skeletons (paslaugos/apie/kainos/kontaktai/404) NĖRA
- brief.html inline `<style>` ~330 lines extract
- KI-002 newsletter, KI-007 contact/audit-request endpoints

### Kitas žingsnis

1. **Generator quality fix (atskira sesija SEO-Claude-code projekte)** — prompt iteration: drausti hallucinated URLs (verified_citations.yaml allowlist), varied phrasing templates LT 2-žodžių keyword'ams, external_links 2+ floor. NE Veriva-geras scope
2. **KI-012 sisteminis fix** (~30-40 min) — 2 dedicated hero SVG (DPO + BDAR 6 str. pillar'ams), 1200×630, brand spalvomis
3. **KI-013 Redirect Architecture** (~30-60 min) — PRIEŠ Google Search Console submit. 5-step plan KNOWN_ISSUES.md

### Production verifikacija (live)

| URL | Statusas |
|---|---|
| `https://veriva.lt/seo/duomenu-apsaugos-pareigunas/` | 307 (apex→www) → 200 OK |
| `https://veriva.lt/seo/duomenu-apsaugos-pareiguno-paslaugos-bvpz/` | 307 → 200 OK |
| `https://veriva.lt/seo/nis2-atitiktis/` | 307 → 200 OK |
| `https://veriva.lt/seo/nis2-direktyva-kam-taikoma/` | 307 → 200 OK |
| `https://veriva.lt/seo/nis2-reikalavimai/` | 307 → 200 OK |
| SEO Bot commits Veriva-geras main | 5/5 push'inti, sitemap.xml updated |
| GitHub Actions runs paskutiniai 6 | ✓ success eilėje |

---

## Sesija #19: 2026-05-12 — bdar-6-pillar-publish

### Ką padarėme

**1. BDAR raktažodžių banko išsaugojimas (memory):**
- Vartotojas pateikė 5 Google autocomplete screenshot'us su BDAR temos raktažodžiais
- Sukurtas `memory/reference_keywords_bank.md` — 50+ raktažodžių sugrupuoti į 7 kategorijas: A. BDAR straipsniai (teisinis intent), B. Duomenų subjekto teisės, C. Teisėtumo/sutikimo tema, D. Bendri info, E. Komerciniai/paslaugų (Veriva taikinys), F. VDAI ekosistema, G. Pažeidimų/atsakomybės
- Pažymėti **netinkami** (`bdar angliškai`, `bdar definition`, `badr dental`) ir **jau aprėpti** (DPO, baudos, phishing-mokymai) raktažodžiai
- 7 strateginių temų idėjos ateities pillarams su slug + KW mapping
- Atnaujinta `MEMORY.md` index su pointer'iu į keyword bank

**2. BDAR 6 straipsnis pillar (blog/bdar-6-straipsnis-teiseto-tvarkymo-pagrindai.html, 3060 ž., commit `9bb9a89`):**
- Primary KW: `bdar 6 straipsnis` (info+law intent, 4.7×/1000 density)
- Autorius: Marina (Teisės ekspertė, BDAR)
- Title 52 simb.: "BDAR 6 straipsnis: 6 teisėto tvarkymo pagrindai (LT vadovas)"
- Meta description 157 simb.
- 8 H2 sekcijos: kas yra + 6 pagrindai sąrašas + sutikimas + teisėtas interesas+LIA + palyginimo lentelė + 5 žingsnių vadovas + dažniausios klaidos + baudų rizika
- 12 FAQ klausimų (FAQPage schema su acceptedAnswer.text)
- 5 žingsnių HowTo schema
- 4 schemos: BlogPosting + BreadcrumbList + FAQPage + HowTo (3 JSON-LD blokai)
- 16 raktažodžių iš keyword bank natūraliai integruoti į body: `bdar 6 straipsnis` (primary), `bdar 6 str`, `kam taikomas bdar`, `bdar duomenų tvarkymas`, `bdar duomenų valdytojas`, `bdar principai`, `bdar sutikimas`, `bdar reglamentas`, `bdar įstatymas`, `bdar 5 straipsnis`, `bdar 9 straipsnis`, `bdar 32 straipsnis`, `ar organizacija gali tvarkyti asmens duomenis be sutikimo`, `asmens duomenų apsaugos įstatymas`, `teisėtas interesas`, VDAI praktika
- Komponentai: definition paragraph (featured snippet), TOC 8 punktai, 2 callout + 2 stat-hl + 1 blockquote + 2 cta-inline + testimonial Tomas K. + 3 related cards (BDAR baudos, DPO, NIS2)
- 2 CTA: mid-article (po `#kaip-pasirinkti`, "Patikrinkite visus 6 BDAR pagrindus...") + final ("Užtikrinkite BDAR 6 str. atitiktį...")
- Internal links: 4× į `/blog/bdar-baudos-lietuvoje`, `/blog/dpo-funkcija-vadovas`, `/blog/nis2-direktyva-lietuvoje` + `/#kontaktai`
- External links: eur-lex.europa.eu (BDAR), vdai.lrv.lt, edpb.europa.eu (5/2020 sutikimo + 06/2024 teisėto intereso gairės)
- Hero img placeholder `bdar-baudos-hero.svg` (KI-012 carry-over)

**3. Pre-publish 4-agent ratas (paraleliai):**
- frontend-revizorius 15/20 → P0 inline styles (sisteminis), P0 figure testimonial (sisteminis), P0 h3 viduje CTA (sisteminis), P1 faq-ico aria-hidden, P1 og:image SVG
- seo-specialistas 18/20 INDEXABLE → P1 SVG og:image, P1 `bdar principai` 0× → pridėti exact frazę, P2 HowTo step 4 gramatika
- qa-tester 16/20 → P0-1 "paskutinė pasirinkimas" → "paskutinis pasirinkimas" (4 vietos!), P0-2 NIS2 datos prieštaravimas (`2025 m. spalio galioja` vs `2024 m. spalio įsigaliojo`), P1 "Ne pakanka" → "Nepakanka" 2 vietose, P1 "pirma, ką tikrina" → "pirmiausia", P2 ADTAĮ data 2018-07-01 → 2018-07-16
- marketing-analitikas 14/20 → P0 mid-CTA pozicija (klausimas → imperatyvas), P0 testimonial repozicionavimas (perkelti prieš `#klaidos`, ne tarp neigiamų sekcijų), P1 final CTA we-focused → you-focused

**4. 12 P0/P1 fix'ai pritaikyti prieš commit:**
- Gramatika "paskutinė pasirinkimas" → "paskutinis pasirinkimas" (FAQ schema + HowTo schema + h3 + FAQ HTML, 4 vietos)
- "Ne pakanka" → "Nepakanka" (FAQ schema + HTML)
- "Šie dokumentai pirma, ką tikrina" → "Šių dokumentų VDAI patikrinime ieško pirmiausia"
- NIS2 data unified: "Lietuvoje NIS2 taikoma nuo 2025 m. spalio 17 d., kai įsigaliojo KSĮ" (vietoj prieštaringų 2024 vs 2025)
- Related card NIS2: "LT NIS2 taikoma nuo 2025-10-17 (KSĮ įsigaliojimas)"
- ADTAĮ data: 2018-07-01 → 2018-07-16
- Mid-CTA copy: klausimas "Reikia BDAR audito?" → imperatyvas "Patikrinkite visus 6 BDAR pagrindus per 5 dienas su Veriva auditu" + btn "Gauti nemokamą konsultaciją"
- Final CTA copy: we-focused "Užsakykite ir patikrinkime" → you-focused "Užtikrinkite BDAR 6 str. atitiktį — auditas per 5 dienas" + urgency "Klaidingas pagrindas — bauda iki 20 mln. EUR"
- Testimonial repozicionuotas: dabar po mid-CTA, prieš `#klaidos` (ne tarp neigiamų sekcijų)
- `faq-ico` `+` simbolis — `aria-hidden="true"` ant 12 vietų (a11y screen reader fix)
- Pridėta naują pastraipą su `BDAR principai` exact fraze (po ADTAĮ paragrafo, secondary KW boost iš 0× → 1×)
- Intro urgency: "Klaidingas pagrindas — bauda iki 20 mln. EUR arba 4% apyvartos. Patikrinkite per 5 dienas — nemokama konsultacija per 24 val."
- `wordCount` schema atnaujintas: 2900 → 3060 (po BDAR principai pastraipos)

**5. Blog.html + sitemap.xml + memory atnaujinimai:**
- `blog.html`: nauja `<a class="bc" data-cat="bdar">` kortelė PIRMA vieta (prieš BDAR baudos), excerpt "Sutikimas — tik vienas iš šešių pagrindų ir dažnai netinkamas..."
- `sitemap.xml`: +naujas URL su image:image namespace (bdar-baudos-hero.svg placeholder), lastmod 2026-05-12
- `memory/reference_keywords_bank.md` NEW: 50+ raktažodžių bankas
- `memory/MEMORY.md`: pridėtas pointer'is į keyword bank

**Git commit + push (1 naujas):**
- `9bb9a89` — feat(blog): BDAR 6 straipsnis pillar (3 files, +1077/-0)

**Production verifikacija (limited):**
- Vercel deploy: Ready 17s (`9bb9a89`)
- `https://www.veriva.lt/blog/bdar-6-straipsnis-teiseto-tvarkymo-pagrindai.html` → 308 → 200 OK (standartinis KI-013 redirect chain pattern)
- `https://www.veriva.lt/sitemap.xml` → 200 OK, 1 paminėjimas `bdar-6-straipsnis`

### Kas liko / nepatvirtinta

**BDAR 6 straipsnio carry-over:**
- **KI-012 carry-over (2-oji sesija paeiliui)**: dedicated `bdar-6-straipsnis-hero.svg` 1200×630 — vis dar naudojamas placeholder. KI-012 dabar apima 2 straipsnius (DPO + BDAR 6 str.). Reikia spręsti sistemiškai
- **Post-deploy 4-agent verifikacija praleista** — s18 standartas buvo "pre + post" agent ratas, šioje sesijoje pakako pre+commit
- **Frontend P0 sisteminiai carry-over neišspręsti**: inline styles, `<figure>` testimonial semantic violation, `<h3>` viduje `.cta-inline` heading hierarchy break — pasikartoja visuose 5 pillaruose (BDAR baudos, NIS2, Phishing, DPO, BDAR 6 str.), reikia sisteminio fix'o
- **Mobile real flow nepatikrintas** — agentai naudojo WebFetch (ne puppeteer), FAQ accordion + TOC + responsive nesutikrintas live
- **Google rich-results test'as** neatliktas (4 schemas parse'inti agentų, bet ne pateikti į search.google.com/test/rich-results)
- **KW tankis `bdar duomenų tvarkymas` exact frazė tik 1×** (target 2-3×) — gali natūraliai pridėti 1× į `#sesi-pagrindai` sekciją

**Projekto-lygio (perimti iš s18):**
- **5 Sensitive env vars blog-gen automation** (`GITHUB_TOKEN`, `PEXELS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) — cron ketv. 2026-05-14 10:00 LT crash'ins iki pateikimo (2 dienos liko)
- **KI-013 Redirect Architecture** (Medium, atskira sesija ~30-60 min)
- **s17 P1 carry-over** (~2.5h): self-collision skip, cache invalidation, chronological sort, warn regression, Vercel timeout audit, sanitizeKeyword prompt injection, escapeHtml `"`
- **brief.html inline `<style>` ~330 lines** extract
- **`POST /api/forms/audit-request`** neegzistuoja (KI-007)

### Kitas žingsnis

1. **Blog automation runtime finalization** ⚠️ KRITINIS — cron ketv. 2026-05-14 10:00 LT (2 dienos). Vartotojas pateikia 5 Sensitive env vars + sukuria @VerivaBlogBot per @BotFather + paleidžia `migrations/002_blog_automation.sql`
2. **KI-012 sisteminis fix**: sukurti 2 dedicated hero SVG (`dpo-funkcija-vadovas-hero.svg` + `bdar-6-straipsnis-hero.svg`) 1200×630 brand spalvomis + atnaujinti meta tags + sitemap.xml (~30-40 min)
3. **KI-013 Redirect Architecture atskira sesija** (~30-60 min)
4. **Frontend P0 sisteminis carry-over**: inline styles + figure testimonial + h3 CTA hierarchy 5 pillaruose (~60 min)

### Production verifikacija (live)

| URL | Statusas |
|---|---|
| `https://www.veriva.lt/blog/bdar-6-straipsnis-teiseto-tvarkymo-pagrindai.html` | 308 → 200 OK (KI-013 pattern) |
| `https://www.veriva.lt/sitemap.xml` (+BDAR 6 str. URL) | 200 OK, 1 paminėjimas |
| Vercel deploy `9bb9a89` | Ready 17s |

---

## Sesija #18: 2026-05-12 — dpo-pillar-publish

### Ką padarėme

**1. DPO pillar straipsnis (blog/dpo-funkcija-vadovas.html, 2979 ž., commit `bc481ea`):**
- Primary KW: "duomenų apsaugos pareigūnas" (480/mo, Medium difficulty, P0 iš blog-keywords.md)
- Autorius: Marina (Teisės ekspertė, BDAR)
- Title 53 simb. + geo: "Duomenų apsaugos pareigūnas: vadovas Lietuvos verslui"
- Meta description 152 simb.
- 8 H2 sekcijos: kas yra DPO + 3 atvejai BDAR 37 str. + užduotys 39 str. + kvalifikacija + vidinis vs outsourcing + 5 žingsnių vadovas + dažniausios klaidos + baudų rizika
- 12 FAQ klausimų (FAQPage schema su acceptedAnswer.text)
- 5 žingsnių HowTo schema (su position+name+text)
- 4 schemos: BlogPosting + BreadcrumbList + FAQPage + HowTo (3 JSON-LD blokai, visi valid parse)
- Komponentai: definition paragraph (40 ž., featured snippet), TOC 8 punktai, 2 callout + 17 stat-hl + 2 blockquote + 2 cta-inline + testimonial su Rasa J. + 3 related cards
- 3 CTA: po definition (`/#top` BDAR testas) + vidury po H2 #6 (`/#kontaktai` su €6 000/m) + pabaiga ("Gauti DPO pasiūlymą — per 24 val.")
- Pricing transparency: 6-18k €/m outsourcing vs 35-60k €/m vidinis, €30K+ savings stat
- Social proof 3×: 120+ klientų, €0 VDAI baudų, Teisė + IT vienoje komandoje
- Hero img placeholder bdar-baudos-hero.svg (KI-012)

**2. 4-agent pre-publish ratas (paraleliai) + P0/P1 fix'ai:**
- frontend-revizorius 16/20 → P0 typo `strategin` + P1 hover transforms + inline styles
- seo-specialistas 15/20 → P1 meta desc 172→156, title geo, KW tankis `DPO outsourcing` 14× per daug
- qa-tester 18/20 → P1 gramatika 7× `negali patys savęs auditų` (įskaitant JSON-LD FAQPage schema — Google parsina!)
- marketing-analitikas 15/20 → P1 CTA copy "Susisiekti su ekspertu" generic
- 12 fix'ų pritaikyti prieš publish: robots noindex→index, title 68→53, meta 172→156, gramatika 7× → `atlikti savęs auditų`, typo `strateginis`, KW stuffing 14→12×, `DPO Lietuvoje` 0→1×, CTA `Gauti DPO pasiūlymą — per 24 val.`, © 2025→2026

**3. 4-agent post-deploy verifikacija (paraleliai):**
- qa-tester PRODUCTION_VERIFIED — 6/6 URL'ų HTTP 200, gramatikos fix patvirtintas live (0× `patys savęs auditų`, 0× `strategin`, 0× `Susisiekti su ekspertu`)
- frontend-revizorius PRODUCTION_READY — HTML valid, 0 placeholder'ių, 12 FAQ items, 3 related cards, nav/footer/share parity su bdar-baudos
- seo-specialistas INDEXABLE — meta tags OK, schemas valid, KW tankis OK po fix'o, **aptiko KI-013** (double redirect chain, pre-existing projekto problema)
- marketing-analitikas CONVERSION_READY — 3 CTA chain veikia, pricing transparency, social proof, 5-step BOFU

**4. Copyright hotfix project-wide (commit `e24eb78`):**
- 6 failai: `index.html`, `blog.html`, `blog/bdar-baudos-lietuvoje.html`, `blog/nis2-direktyva-lietuvoje.html`, `blog/phishing-mokymai-darbuotojams.html`, `blog/template.html`
- 0× `© 2025` projekte, 9× `© 2026` full consistency
- Live verify: `https://veriva.lt/` ir `bdar-baudos` rodo `© 2026 Veriva`

**5. Listing + sitemap + KNOWN_ISSUES atnaujinimai:**
- `blog.html`: DPO "Netrukus" placeholder kortelė → aktyvi `<a class="bc">` su pilna CTA
- `sitemap.xml`: +DPO URL su image:image, lastmod 2026-05-12, blog.html lastmod atnaujintas
- `KNOWN_ISSUES.md`: KI-001 3/6 → 4/6 fixed; **+KI-012 hero SVG placeholder** (Low); **+KI-013 Redirect Architecture Normalization** (Medium, atskira sesija, su 5-step fix plan + 5 rizikomis + pre-fix checklist)

**Git commits + push (2 nauji):**
1. `bc481ea` — feat(blog): DPO pillar straipsnis (4 files, +1154/-13)
2. `e24eb78` — fix(footer): © 2025→2026 (6 failai) + KI-013 (7 files, +70/-6)

**Production verifikacija:**
- Vercel deploys: 2 Ready (13s + 14s)
- DPO live URL `https://veriva.lt/blog/dpo-funkcija-vadovas.html` → 200, ~1.8s response
- HTTP 200 visi 6 verifikacijos URL'ai (DPO, blog.html, sitemap, index, 2 regression checks)

### Kas liko / nepatvirtinta

**DPO straipsnio carry-over:**
- **KI-012**: dedicated `dpo-funkcija-vadovas-hero.svg` 1200×630 dailininkui (low priority, social share preview)
- **Primary KW tankis 2.69×/1000 ž.** po anti-stuffing fix'o (target 3-5×) — galimai reikės natūraliai pridėti 1-2× `duomenų apsaugos pareigūnas`
- **VDAI tankis 35× per 2979 ž.** (11.7×/1000) — aukštas, gali triggerinti Google over-optimization filtrą. Dalies pakeisti į `priežiūros institucija` arba pilną pavadinimą
- **Mobile real flow nepatikrintas** — agentai naudojo WebFetch (NE puppeteer), FAQ accordion interaktyvumas + mobile reading flow + TOC mobile scroll nesutikrintas
- **Schema rich-results test'as Google'e** neatliktas (agentai parsino JSON, bet ne pateikė į `search.google.com/test/rich-results`)

**Projekto-lygio:**
- **KI-013 Redirect Architecture** (Medium, ATSKIRA SESIJA) — double redirect chain apex→www→stripping .html, canonical mismatch, sitemap inconsistency. NE quick fix. 5-step plan dokumentuotas KNOWN_ISSUES.md
- **5 Sensitive env vars blog-gen automation** (`GITHUB_TOKEN`, `PEXELS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) — cron ketv. 2026-05-14 10:00 LT crash'ins iki pateikimo
- **s17 P1 carry-over** (~2.5h): self-collision intent skip, cache invalidation po publish, chronological sort, warn-warn regression check, Vercel timeout audit, sanitizeKeyword prompt injection, escapeHtml `"`
- **brief.html inline `<style>` ~330 lines** (s16 carry-over) — extract į `assets/css/brief.css`
- **`POST /api/forms/audit-request`** neegzistuoja (KI-007)

### Kitas žingsnis

1. **Blog automation runtime finalization** (KRITINIS — cron ketv. 2026-05-14 10:00 LT) — vartotojas pateikia 5 Sensitive env vars + sukuria @VerivaBlogBot per @BotFather + paleidžia `migrations/002_blog_automation.sql`
2. **KI-013 Redirect Architecture atskira sesija** (~30-60 min) — redirect audit + canonical decision + sitemap normalization + internal link cleanup + vercel.json consolidation
3. **DPO hero SVG** (KI-012) — sukurti `dpo-funkcija-vadovas-hero.svg` 1200×630 brand spalvomis (BDAR 37 str. ikonografija)

### Production verifikacija (live)

| URL | Statusas |
|---|---|
| `https://veriva.lt/blog/dpo-funkcija-vadovas.html` | 200 OK, ~1.8s |
| `https://veriva.lt/blog.html` (DPO kortelė aktyvi) | 200 OK |
| `https://veriva.lt/sitemap.xml` (+DPO URL) | 200 OK |
| `https://veriva.lt/` (© 2026) | 200 OK |
| `https://veriva.lt/blog/bdar-baudos-lietuvoje.html` (no regression, © 2026) | 200 OK |
| `https://veriva.lt/blog/nis2-direktyva-lietuvoje.html` (no regression, © 2026) | 200 OK |

---

## Sesija #16: 2026-05-12 — cookiebot-brief-dark-tier-consent

### Ką padarėme

**1. Cookiebot consent banner force LT (9 HTML failai):**
- Diagnozė: vartotojas incognito nematė consent banner'io po atnaujinto scan'o (2026-05-11 14:26 UTC, 1 slapukas `CookieConsent`, seni WP markeriai `wpEmoji/_pk_*/_ga` dingo). Root cause: Cookiebot default GDPR scope ribotas 31 ES regionui (`gdpr:["at","be","bg","cy","cz","de","dk","es","ee","fi","fr","gb","gr","hr","hu","ie","it","lt","lu","lv","mt","nl","pl","pt","ro","sk","si","se","li","no","is"]`) — vartotojas testavo ne iš ES IP
- Cookiebot Free planas neturi dashboard "Geographic regulations" toggle (vartotojo screenshot patvirtino — tik Overview ekranas, ne Configuration)
- **Fix: `data-user-country="LT"` atributas** pridėtas `<script id="Cookiebot">` tag'e visuose 9 HTML failuose (index, blog, brief, slapukai, privatumas, blog/template + 3 pillarai) — Cookiebot vidinė vars'a `userCountry` hardcode'inta į "LT" → `gdprApplies: true` visiems
- **Headless verifikacija (puppeteer)**: 4/4 URL: dialog `#CybotCookiebotDialog` `display: flex`, `userCountry: "LT"`, `gdprApplies: true`, `isOutsideEU: false`, `hasResponse: false`, `/slapukai` `CookieDeclarationType` lentelė renderinasi DOM'e
- Commit `9076d1c` push'inta production'e — verify 8/8 URL turi `data-user-country="LT"` markerį

**2. Hero `.h-bottom` margin-bottom papildomas pakėlimas:**
- Vartotojo prašymas: "pakelk auksciau dar truputi" (po s15 pakelinimo nuo 0→64px desktop / 40px mobile)
- Fix: desktop 64→**96px** (+32px), mobile 40→**64px** (+24px)
- Commit `fc0efaa`, verify production turi `margin-bottom: 96px`

**3. brief.html premium dark tier redesign (full conversion):**
- Brief.html buvo light/cream stiliuje su gold accent — nesutapo su index.html dark premium tier
- **Pilnas dark tier konvertavimas (~250 lines CSS rewrite)**:
  - Body: cream → `--ink` + white text
  - Card: white shadow → glass `rgba(12,26,46,.55)` + `backdrop-filter: blur(20px)` + cyan hairline `::before` + radial mesh `::after`
  - Hero: gold accent → cyan glowing dot mono kicker + Syne 800 56px + radial mesh
  - Inputs/textareas/select: white → dark glass `rgba(7,17,31,.4)` + cyan focus glow + custom cyan SVG arrow ant select
  - Radio/checkbox opcijos: dark glass + cyan glowing mark + translateX hover
  - Buttons: flat blue → btn-hero-primary cyan gradient `#00e8ff→#00b4d8` + glow shadow (suvienodinta su index.html `.btn-hero-primary`)
  - Progress bar: cyan gradient + glow
  - Required `*`: red → cyan
  - States (success/error): cyan/red glow icons + Syne 800
  - Pridėta JetBrains Mono font preload
  - Pridėta `prefers-reduced-motion` respect
- **Headless QA puppeteer (17/17 computed style checks PASS)**: body bg ink, card backdrop blur 20px, button gradient cyan, progress fill cyan gradient, 4 klausimai 1-oje sekcijoje
- **Screenshots saved**: desktop 1280×900 + mobile 390×844 — vizualus rezultatas atitinka index.html brand
- Commit `936bc6a` push'inta production'e (`/brief` 200 OK su `rgba(12,26,46`)

**4. Privatumo politikos sutikimo checkbox (60-tas klausimas, blokuoja submit):**
- Vartotojo prašymas: gale klausimyno pridėti sutikimo varnelę, kuri privalo būti pažymėta prieš submit
- **Naujas `consent` klausimo tipas** pridėtas į `SECTIONS[3].questions` (paskutinė sekcija "Papildoma informacija"):
  - `id: 'privacy_consent'`, `type: 'consent'`, `required: true`
  - Label: `Sutinku, kad mano pateikti duomenys būtų tvarkomi pagal <a href="/privatumas.html" target="_blank" rel="noopener">privatumo politiką</a>...`
  - Custom error message: `Norėdami pateikti klausimyną, turite sutikti su privatumo politika.`
- **Render logika `renderSection()`**: jei `q.type === 'consent'` → custom markup `<label.bf-consent>` su `<input type="checkbox">` + `<span.bf-consent-mark>` + `<span.bf-consent-text>` (HTML link allowed). Pridėtas `bf-q-consent` modifier klasė per `qEl.classList`.
- **Validation `validateSection()`**: branch `q.type === 'consent'` → `valid = a === true` (strict boolean check)
- **CSS `.bf-consent`**: dark glass kortelė su top hairline border-top atskirianti nuo įprastų klausimų; cyan glowing checkmark via `transform: rotate(45deg) scale(.4→1)` border trick + drop-shadow glow; invalid state raudonas border; `:has(input:checked)` selector for state update
- **Payload integration**: `state.answers.privacy_consent = true` pateks į `JSON.stringify({...state.answers, _meta})` per submit handler
- **Bug rastas + fix'intas (regression iš s16 brief redesign)**: po consent push'o naršyklės screenshot rodė 2 mygtukus paskutiniame ekrane (`Toliau →` + `Pateikti klausimyną →`). Root cause: brief redesign metu pakeičiau `.bf-btn` base klasę į `display:inline-flex`, kuris override'ino native `[hidden]` attribute. CSS turėjo tik `.bf-btn-prev[hidden]` taisyklę, ne `.bf-btn-next/.bf-btn-submit`. **Fix**: `.bf-btn[hidden]{display:none !important}` (universal selektor + `!important` kad prebijotų base `inline-flex`). Commit `5b8c658`.
- **Headless QA puppeteer (3 testai)**: (1) before check — submit visible, consent rendered su mark + label tekstu; (2) after invalid submit — `hasInvalidClass: true`, `errVisible: true`, `successShown: false` (submit blokuojamas); (3) after click consent — `checkboxState: true`, `state.answers.privacy_consent: true`, invalid class pašalinta. Screenshots: brief-consent-unchecked.png, brief-consent-error.png, brief-consent-checked.png
- Commit `fece4c9` + fix `5b8c658` push'inta production'e

**Git commits + push (5 nauji + 1 docs):**
1. `9076d1c` — fix(cookiebot): data-user-country="LT" — force GDPR banner visiems regionams (9 HTML)
2. `fc0efaa` — fix(hero): .h-bottom margin-bottom 64→96px desktop / 40→64px mobile
3. `936bc6a` — feat(brief): premium dark tier redesign — matchina index.html brand (137+ / 77-)
4. `fece4c9` — feat(brief): privatumo politikos sutikimas checkbox prieš submit (76+ lines)
5. `5b8c658` — fix(brief): `.bf-btn[hidden]` display:none — slėpti next/submit per nav state
6. `a467b9c` — docs: s15 session status (bundle-push-hero-polish) + INC-002 postmortem (carry-over s15 docs)

**Production verifikacija (curl + headless):**
- 8/8 puslapių turi `data-user-country="LT"` markerį
- `https://www.veriva.lt/` H.bottom margin-bottom 96px verified
- `https://www.veriva.lt/brief` glass card `rgba(12,26,46,.55)` verified, `bf-consent-mark` selector rastas
- Vercel auto-deploy'ai: 5+ builds Ready, ~14s each

### Kas liko / nepatvirtinta

**Brief.html carry-over:**
- **Inline `<style>` ~250 lines `brief.html` head'e** — laužia CLAUDE.md "niekada inline" taisyklę; turi būti extracted į `assets/css/brief.css` ar `assets/css/pages/brief.css` (s16 pridėjo ~80 lines naujo CSS bet pilnas extract'as neatliktas)
- **Mobile flow testing nepilnas**: turiu screenshot 390×844, bet pilno 4-sekcijų click-through (Toliau → Toliau → Toliau → consent → submit) su realiomis užpildomis sveikatos vs verslo branching'u neatlikau — tik state injection per `evaluate()` (cheat'as)
- **Submit endpoint NE veikia**: `POST /api/forms/audit-request` neegzistuoja → consent visada `success state` matomas per localStorage fallback (KI-007). Tikras submit niekada neištestuotas.

**Cookiebot follow-up:**
- Banner force LT'ui veikia, BET CookieDeclaration intro tekstas `/slapukai` puslapyje vis dar gali turėti pasenusio scan'o nuorodą `veriva.lt/privatumo-politika-2/` (404 — sena WP URL) — paskutinis žinomas scan'as 2026-05-11 buvo naujesnis bet vartotojas neverify'avo
- Headless puppeteer testavime visi 4 URL gavo banner — bet vartotojas vis dar nematė chrome incognito (galimai cookie cache iš ankstesnių testavimo sesijų; sprendimas: hard refresh + clear cookies `consent.cookiebot.com`)

**Carry-over (iš s12, s13, s14, s15 — NEIŠSPRĘSTA):**
- Hero rewrite cleanup: dead CSS ~150 lines `assets/css/index.css`, inline `<style>` ~340 lines `index.html`, `#cur` dead code ~30 lines `assets/js/index.js`
- Blog automation runtime: 5 Sensitive env vars (vartotojas iki šiol nepateikė) + Telegram bot + Supabase migration — cron'as 2026-05-12 antradienis 10:00 LT **JAU CRASH'INO** šiandien rytą (užduotis prabėgo per laiką šios sesijos eigoje)
- Naršyklės QA index.html mobile <900px (5-q quiz flow + prefers-reduced-motion + GSAP defer + LCP)

### Kitas žingsnis

**Option A (P0)**: Brief.html inline `<style>` extract į `assets/css/brief.css` (~330 lines) + verify production HTML/CSS bundle (~30 min). Saugu, contained scope.

**Option B (P0)**: Realus naršyklės testavimas brief.html 4-sekcijų flow su mobile 390px (Toliau × 3, sveikatos branching, consent checkbox, submit fail handling). ~45 min.

**Option C (P0 KRITIŠKAI overdue)**: Blog automation runtime — vartotojo 5 Sensitive env vars + Telegram bot + Supabase migration. Cron jau nepasileido šįryt — iki kito antradienio 2026-05-19.

**Option D (P1 carry-over)**: Hero rewrite cleanup (dead CSS + inline style extract iš index.html).

### Tools naudoti

- `Read` × 8, `Edit` × 12, `Write` × 4 (puppeteer test scripts), `Grep` × 6, `Glob` × 1, `Bash` × 25+ (curl × 8, vercel ls × 2, git × 12, puppeteer headless × 4), `AskUserQuestion` × 3
- **Puppeteer headless testing**: pirma kartą šiame projekte — įdiegtas `/c/Users/pinig/AppData/Local/Temp/cookietest/` (gitignored), 4 test scripts (cookie banner DOM verify, brief stilius verify, consent validation flow, real navigation flow). Visi screenshots saved temp dir.

---

## Sesija #15: 2026-05-12 — bundle-push-hero-polish

### Ką padarėme

**Git bundle push (9 commits push'inti į origin/main):**
1. `2512730` — feat: bundle s12+s14 (43 files, +9136/-326) — hero rewrite + blog automation pipeline + topics.json + migration + vercel.json + docs
2. `4ee35d1` — chore: trigger redeploy po CRON_SECRET whitespace fix
3. `caa5f01` — fix: `.h-bottom` cramped 900-1100px viewport zone (minmax + intermediate breakpoint)
4. `d708d90` — fix: ticker baltas tekstas (cyan rgba(0,180,216,.7) → rgba(255,255,255,.85))
5. `e88719f` — fix: `.h-bottom` margin-bottom 64px desktop / 40px mobile (pakeltas aukščiau nuo apačios)
6. `c91c675` — chore: force vercel rebuild (3 commits buvo missing Vercel deployments sąraše)
7. `50d409c` — feat: hero secondary CTA `#kontaktai` → `/brief.html` (54 kl, 10-15 min)
8. `9d1b367` — fix: `.btn-hero-secondary` text-link (11px mono 55% opacity) → outlined button (13px + cyan border + transparent fill + translateY hover)
9. `f2f2cdb` — fix: nav nelimpa ant H1 (padding-top 96→128px desktop, 80→108px mobile) + `.h-sub` neoverflow (`#hero overflow: hidden → clip`, min-height 720→780 / 640→700)

**Incident I-001: Vercel build failed po pirmo push'o** (root cause + fix):
- Build `hx362gc6v` ● Error 3s — `CRON_SECRET` env var trailing whitespace (newline iš `openssl rand -hex 32` per s14 push'ą)
- Vercel klaida: "The `CRON_SECRET` environment variable contains leading or trailing whitespace, which is not allowed in HTTP header values."
- Fix: `vercel env rm CRON_SECRET production --yes` → `printf "%s" "$(openssl rand -hex 32 | tr -d '\n\r\t ')" | vercel env add CRON_SECRET production`
- Trigger empty commit (`4ee35d1`) → build `fkbcoi4q2` ● Ready 14s ✅

**Vercel webhook tylus delay** (untracked anomaly):
- 3 commits (`d708d90`, `e88719f`, `50d409c`) push'inta į GitHub bet nepasiekė Vercel deployments sąrašo (production curl rodė missing markers)
- Empty commit `c91c675` force-trigger'ino rebuild — build `7gqawzb8d` apjungė visus 3 + trigger į vieną deploy
- Tikrasis root cause neidentifikuotas (GitHub webhook lag arba Vercel ignored deploy events)

**Frontend-revizorius agent panaudotas** paskutiniam fix'ui (nav padding + overflow):
- Diagnozavo root cause #1: nav apačia (top:30px + height:60px = 90px) prie `.hero-inner padding-top:96px` paliko tik 6px iki `.h-label` — vizualiai nulis
- Diagnozavo root cause #2: `overflow: hidden` kuria scroll context'ą + flex container'is negali augti virš `height:100vh` jei content per didelis → paskutinė `.h-sub` eilutė ("neatsitiks — raštu") nukerpta
- Fix: `overflow: hidden → clip` (vizualiai identiškas, nesukuria scroll context'o) + `min-height` bump

**Vercel build status (6 production builds Ready, 1 Error):**
- `hx362gc6v` ● Error 3s (CRON_SECRET whitespace)
- `fkbcoi4q2` ● Ready 14s (post env fix)
- `9qjlcfqs3` ● Ready 14s (caa5f01)
- `k0n4yaf90` ● Ready 13s
- `oivxqjxk8` ● Ready 13s
- `7gqawzb8d` ● Ready 13s (3 missing commits bundle)
- `d2m7sa0c4` ● Ready ~13s (brief link)
- (paskutinis post f2f2cdb push) — laukia auto-deploy ~14s

**Production verifikacija (curl + cache-busting):**
- `https://veriva.lt` (apex) → 308 → `https://www.veriva.lt` 200 OK
- Baltas ticker color rasta production HTML'e (2 markers)
- `.h-bottom margin-bottom: 64px` rasta production HTML'e
- `Pildyti detalų klausimyną` link rasta production HTML'e

### Kas liko / nepatvirtinta

**Hero rewrite carry-over (iš s12, vis dar neišspręsta):**
- Dead CSS ~150 lines `assets/css/index.css` (`.widget`, `.w-*`, `.wpd*`, `.wbd*`, `.proof-strip`, `.ps-*`, sena `.hero-w/.hero-eyebrow/.hero-trust`) — nebenaudojamos po hero rewrite
- Inline `<style>` ~340 lines `index.html` head'e — vis dar laužia CLAUDE.md "niekada inline" taisyklę, laukia extracted į index.css
- `#cur` div + cursor JS listener'iai (~30 lines `assets/js/index.js`) — dead code po custom cursor pašalinimo

**Blog automation deploy blockers (iš s14, vis dar neišspręsta):**
- 5 Sensitive env vars vartotojo input pending: `GITHUB_TOKEN`, `PEXELS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Empirra Vercel UI "Show value") + `TELEGRAM_BOT_TOKEN` (naujas `@VerivaBlogBot` per @BotFather) + `TELEGRAM_CHAT_ID` (getUpdates po `/start`)
- Supabase migration `migrations/002_blog_automation.sql` nepaleistas (veriva_telegram_revise_state + veriva_blog_runs lentelės neegzistuoja Empirra Supabase)
- 3 esami pillarai NETURI `<ul class="internal-links">` sekcijos → reverse linking fail'ins per pirmus publish'us
- `lib/blog-card.ts extractBlogCardMeta()` fallback nepridėtas (`<span class="post-cat">` template'e nėra)
- 3027 lines TS UNTESTED — runtime nepatikrintas

**Naršyklės QA neatlikta:**
- Mobile <900px (hero, ticker, .h-bottom stack, naujas outlined button)
- 5-q quiz flow (s12 carry-over)
- prefers-reduced-motion (canvas particles + GSAP)
- GSAP CDN `defer` atributas + Core Web Vitals patikra

**Vercel webhook lag tikslus root cause** neidentifikuotas — gali kartotis ateityje.

**Cron'as crash'ins 2026-05-12 10:00 LT** (šiandien antradienis) jei env vars nepateikti per kelias valandas:
- `https://veriva.lt/api/automations/blog-gen` su `Authorization: Bearer $CRON_SECRET` → fail'ins per `GITHUB_TOKEN` undefined arba `validateBlogTriggerAuth` (jei CRON_SECRET nelinks su Vercel value)

### Kitas žingsnis

**Option A (P0 KRITIŠKAI — laikas iki cron'o)**: Vartotojas pateikia 5 Sensitive env vars + sukuria `@VerivaBlogBot` + paleidžia Supabase migration. Tada: `vercel env add` × 5 → Vercel auto-redeploy → `setWebhook` Telegram → smoke test `curl POST /api/automations/blog-gen -H "x-api-key: $BLOG_TRIGGER_SECRET" -d '{"force":true}'`. Expected: Telegram pranešimas su 3 inline buttons per 60-90s.

**Option B (P0)**: Pre-deploy fix'ai prieš blog automation runtime — pridėti `<ul class="internal-links">` 3 esamiems pillarams + template.html, `lib/blog-card.ts extractBlogCardMeta()` fallback (`<meta>` arba topics.json pillar lookup).

**Option C (P1)**: Hero rewrite cleanup carry-over — dead CSS removal (~150 lines `index.css`), inline `<style>` extract į `index.css` (~340 lines), `#cur` cursor cleanup (~30 lines `index.js`).

**Option D (P1)**: Naršyklės QA (mobile <900px + 5-q quiz flow + prefers-reduced-motion + GSAP defer + LCP/Core Web Vitals patikra).

---

## Sesija #14: 2026-05-11 — blog-automation-port

### Ką padarėme

**Architektūra (solution-architect agent):**
- Detali 11-sekcijų adaptacijos plano analizė Empirra → Veriva (file-by-file mapping, env vars, schema, internal links, Telegram setup, GitHub, Supabase migration, system prompt diff, fazes, rizikos)
- Sprendimai: OpenAI gpt-4.1 (kaip Empirra), atskiras Veriva Telegram bot, share OpenAI+Pexels keys, share Empirra Supabase (Veriva lenteles `veriva_*` prefix), 2×/sav cron (Tue+Thu 10:00 LT), JSON+template injection output

**14 lib failų (1748 lines TS):**
- `lib/claude.ts` (82) — OpenAI gpt-4.1 wrapper, 75s timeout, 4500 max tokens
- `lib/github.ts` (171) — GitHub API (createDraftBranch, commitFileToBranch, mergeBranchToMain, deleteBranch, branchExists, listBranches, getFileFromBranch, listDirFromBranch) — repo `riko8825/Veriva-geras`
- `lib/telegram.ts` (205) — bot wrapper + LT pranešimai + sendTelegramDraftNotification su Publikuoti/Taisyti/Praleisti inline keyboard + slugHash callback_data
- `lib/pexels.ts` (94) — hero images su LT→EN translation map (18 BDAR/NIS2/DPO keyword mappings)
- `lib/blog-card.ts` (163) — Veriva `.bc` card markup (matches blog.html .bp-grid struct), `normalizeCategory()` BDAR/NIS2/DPO/Sauga/Mokymai, LT-aware excerpt extraction
- `lib/blog-template.ts` (197) — JSON → template.html injection (29 placeholder map, RAW_HTML_FIELDS set, validatePostData() su 6 required field checks)
- `lib/blog-prompts.ts` (228) — Veriva LT sistem prompt (export const, ~3000 chars) + buildBlogUserPrompt(brief) + pillar context per topic
- `lib/link-map.ts` (157) — KW→URL map + 5 service page targets (`/paslaugos#bdar/nis2/dpo/mokymai/audit` su weight=4), LT ltSlugify(), topics.json read
- `lib/link-constraints.ts` (103) — Veriva-specific SKIP_BLOCK_CLASSES (toc, callout, definition, stat-hl, faq-*, cta-inline, internal-links), plain `<article>` body anchor, LT diacritic word-boundary regex
- `lib/internal-links.ts` (196) — forward injection + reverse linking, service: targets skipped in reverse, weight-based scoring
- `lib/sitemap-update.ts` (85) — Veriva 8 static pages + /blog/*.html, sutvarkyta image:image namespace, BASE_URL https://veriva.lt
- `lib/auth-node.ts` (56) — Node runtime auth (constantTimeEqual, verifyBlogTriggerAuth, verifyBlogApproveAuth, verifyTelegramWebhookAuth)
- `lib/timeout.ts` (7) + `lib/flags.ts` (17) — utility (paliktas DISABLE_AI / DISABLE_TELEGRAM)

**3 API endpoint'ai (1278 lines TS):**
- `api/automations/blog-gen/route.ts` (553) — full pipeline: auth dual-mode (cron+manual) → fetchTopics → getNextTopic → expandKeywords (gpt-4.1, 500 max) → generateBlogJSON (gpt-4.1, 5000 max) → validatePost (10 checks: required, BANNED_LT_PHRASES, source whitelist, FAQ count, FAQ schema, inline styles, H2 count, CTA brand mention) → renderTemplate → createDraftBranch + commitFileToBranch (post + topics.status=draft) → sendTelegramDraftNotification. Su LT slugify (transliteruoja ą→a, č→c, š→s, ž→z), formatDateHuman (LT žodžiu), resolveAuthor (Marina/Justinas/Veriva komanda per author_key arba pillar fallback)
- `api/automations/telegram-webhook/route.ts` (319) — verifyTelegramWebhookAuth → text message handler (revise state via Supabase veriva_telegram_revise_state, slash commands NO-OP — pašalintas Empirra /intake) → callback_query handler (P/R/S 6-char hash matching draft-blog-* branches) → POST delegates to blog-approve via https://veriva.lt URL → SKIP marks topics.status=skipped + deleteBranch → REVISE saves Supabase state + asks text reply
- `api/automations/blog-approve/route.ts` (406) — verifyBlogApproveAuth → POST flow (addBlogCardToGrid → linkInternal forward+reverse → updateSitemap → mark topics.status=published on branch → mergeBranchToMain → deleteBranch → Telegram confirm) + SKIP + REVISE branches. Service: target skip in reverse linking. Vienas blog.html path (NE dual kaip Empirra src/pages/).

**Konfigūracija (4 failai):**
- `topics.json` — 21 keyword queue (3 published Veriva pillarai + 18 pending, BDAR/NIS2/DPO/Sauga/Mokymai distribution). Pridėta author_key + post_type + pillar fields per topic (extends Empirra schema).
- `vercel.json` — Pridėta `builds` array (3 automation endpoints + 3 form endpoints + static), `rewrites` (3 automation URLs), `crons` (`0 8 * * 2,4` = antradienis+ketvirtadienis 08:00 UTC), maxDuration 60-90s per endpoint
- `migrations/002_blog_automation.sql` — `veriva_telegram_revise_state` (chat_id PK) + `veriva_blog_runs` (analytics log). RLS enabled, service_role only access, 3 indexes
- `.env.example` — 17 env vars dokumentuota (8 nauji blog automation)

**Docs:**
- `docs/blog-automation-deploy.md` — 7-step deploy guide su Telegram bot setup, Supabase migration, secrets generation, Vercel push, webhook setup, smoke test, troubleshooting (timeouts, validation failures, linking debug), cost estimate ($0.05-0.08/post, $0.40-0.64/mo)

**Vercel env vars push (7 vars production):**
- `vercel env pull` iš Empirra → push į Veriva: `OPENAI_API_KEY`, `SUPABASE_URL`, `RESEND_API_KEY`, `BLOG_TRIGGER_SECRET` (gen new), `BLOG_APPROVE_SECRET` (gen new), `CRON_SECRET` (gen new), `TELEGRAM_WEBHOOK_SECRET` (gen new)
- Vercel CLI grąžina TUŠČIUS values for Sensitive flag vars: `GITHUB_TOKEN`, `PEXELS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_CHAT_ID` — REIKIA rankiniu būdu iš Vercel UI "Show value" arba edit dialog'o

**TypeScript type check: ✅ PASS (zero errors)** po 2 fix'ų `lib/auth-node.ts` (env var undefined handling)

### Kas liko / nepatvirtinta

**KRITINIAI blockers (5 env vars vartotojo pateikti + 3 setup steps):**
1. `GITHUB_TOKEN` (Empirra Vercel UI) — Sensitive flag, CLI nepull'ina
2. `PEXELS_API_KEY` (Empirra Vercel UI) — Sensitive flag
3. `SUPABASE_SERVICE_ROLE_KEY` (Empirra Vercel UI) — Sensitive flag
4. `TELEGRAM_BOT_TOKEN` — VARTOTOJAS turi sukurti naują `@VerivaBlogBot` per @BotFather (atskiras nuo Empirra)
5. `TELEGRAM_CHAT_ID` — VARTOTOJAS turi gauti per `getUpdates` po `/start` su nauju bot'u
6. **Supabase migration** — vartotojas turi paleisti `migrations/002_blog_automation.sql` Empirra Supabase SQL Editor'yje
7. **Git commit + push** — visi pakeitimai dar neužcommit'inti (35 untracked + 19 modified failai)
8. **Telegram webhook setup** — po deploy, vykdyti `setWebhook` su naujo bot'o token + `TELEGRAM_WEBHOOK_SECRET`
9. **Smoke test** — manual `POST /api/automations/blog-gen` su `BLOG_TRIGGER_SECRET` + `{"force":true}` body

**Žinomi rizikai (untested code paths):**
- `lib/blog-card.ts` `extractBlogCardMeta()` regex'as gali fail'inti jei AI grąžins HTML be `class="post-cat"` / `class="article-cat"` (template'as šitų klasių neturi default'iškai) → fail su `extract_meta_failed`
- `lib/link-map.ts` `slugFromKeyword()` LT slugify gali nesutapti su Veriva esamais slug'ais (`BDAR baudos Lietuvoje` → `bdar-baudos-lietuvoje` vs faktinis slug `bdar-baudos-lietuvoje`) — testintina su debug log po pirmo run'o
- 3 esami Veriva pillarai NETURI `<ul class="internal-links">` sekcijos → reverse linking fail'ins su `internal_links_section_not_found` per pirmus 3-5 publish'us (skip — nekritiška)
- AI prompt'as nepatikrintas su realia OpenAI gpt-4.1 — LT diakritikai, JSON parsing, FAQ schema struktūra, BANNED phrases enforcement nebūtinai veiks 100% iš pirmo karto. Reikia 2-3 smoke test'ų ir prompt iteracijos jei rejection rate >50%.

**Carry-over iš ankstesnės sesijos (NEIŠSPRĘSTA):**
- Sesija #12 hero-quiz-redesign UNCOMMITTED — `index.html` + `assets/js/index.js` modifikuoti, bet šios sesijos commit'as juos viską sujungs
- Cookiebot crawl pasenęs (2026-04-23) — laukia support email response arba auto-scan 2026-05-23

### Kitas žingsnis

1. **Vartotojas: pateikia 5 Sensitive env vars + sukuria Telegram bot + paleidžia Supabase migration** (~15 min rankų darbo)
2. **Aš: push 5 likusius env vars + git commit + git push origin main + Vercel auto-deploy + setWebhook + smoke test** (~20 min)
3. **Jei smoke test fail'ina**: debug `vercel logs --since 1h | grep blog-gen` → fix prompt arba validators → iterate

---

## ATLIKTA ANKSČIAU (2026-05-11 — cookiebot-debug)

### Ką padarėme

**Diagnostika (zero code change):**
- Patikrintas Cookiebot scripts placement'as `index.html` (eil. 7) + `slapukai.html` (eil. 206) — `<script id="Cookiebot">` su CBID `bc31b2c9-a2b7-44e8-a3a2-624b027ba646` ir `<script id="CookieDeclaration">` vietoje
- Patikrintas CDN endpoint'as `https://consent.cookiebot.com/bc31b2c9-.../cd.js` (HTTP 200, OK loader script)
- Patikrintas data endpoint'as `cdreport.js?referer=www.veriva.lt` ir `?referer=veriva.lt` — abu HTTP 200, grąžina pilną CookieDeclaration HTML lentelę su `Būtini (2)`, `Statistika (4)`
- Headless Chrome render testas (`--virtual-time-budget=15000`) — lentelė renderinasi DOM'e su 2 `Statistika+Būtini` blokais, `CookieDeclarationTable`, `CookieDeclarationTableCell` × N
- Patikrinti security headers (`X-Frame-Options: DENY`, jokio CSP) — Cookiebot script'as nėra blokuojamas
- Patikrintas `vercel.json` — headers OK, redirect'ai OK

**Tikroji problema rasta:**
- Cookiebot crawl iš **`2026-04-23`** rodo seną WordPress versiją: slapukai `wpEmojiSettingsSupports`, Piwik `_pk_id#` + `_pk_ses#`, Google Analytics `_ga` + `_ga_#` (visi NEEGZISTUOJA naujoje Vercel svetainėje)
- CookieDeclaration intro tekstas turi link'ą į `https://veriva.lt/privatumo-politika-2/` (404 — sena WP URL struktūra)
- WP→Vercel migracija buvo 2026-05-10, bet Cookiebot scan'as buvo 2026-04-23 — 17 dienų prieš migraciją
- Domain group `veriva.lt` patvirtinta apex'e, `www.veriva.lt` automatinis aliasas (Cookiebot grąžino "Domain is already registered with its variant" pridedant alias)

**Dashboard navigation (3 ekranai):**
- ❌ `Domains & Aliases > veriva.lt` — tik GCM Consent Mode Check, nėra `Re-scan` mygtuko
- ❌ `Cookies & Reports > Cookies and Trackers` tab — tik manuali `Add cookie / tracker` opcija
- ❌ `Cookies & Reports > Reports` tab — vartotojas patvirtino, kad ten irgi nėra `Scan now`

**Pricing patikra (WebFetch + WebSearch):**
- Default `Monthly` scan'as — **įtraukta į Premium**
- `Daily` scan'as — **+€62-99/mėn už domeną** (Cookiebot Premium add-on)
- `Weekly` — nedokumentuota, greičiausiai irgi extra
- **Sprendimas:** nedidinti scan frequency (per brangu vienam pakeitimui)

**Pateikta vartotojui:**
- Cookiebot Domain Group ID (CBID) verify: `bc31b2c9-a2b7-44e8-a3a2-624b027ba646`
- Paruoštas EN support email template (siusti į `support@cookiebot.com` su prašymu manual rescan)

### Testai atlikti

- `curl -sI https://consent.cookiebot.com/.../cd.js` — HTTP 200, `Cache-Control: max-age=1200`
- `curl -s .../cdreport.js?referer=www.veriva.lt -o veriva_cd_www.js` — 10676 bytes (pilna lentelė LT)
- `curl -s .../cdreport.js?referer=veriva.lt -o veriva_cd_apex.js` — 10668 bytes (identiškas turinys, skiriasi tik domain referer)
- Headless Chrome × 2 (5s + 15s budget) → DOM įrašė `CookieDeclarationTable` × 2 + `wpEmojiSettings` + `_ga` + `_pk_*` įrašus
- CSS verify: `.cookiebot-wrap` border, `--border` var apibrėžtas eil. 32

### Deploy

- **Code change: 0** (grynai diagnostika)
- **Commits: 0**
- **Push: 0**

### Kas liko / nepatvirtinta

- **Support email NEIŠSIUSTAS** — vartotojas turi pats išsiųsti `support@cookiebot.com` su CBID + manual rescan prašymu (template paruoštas)
- **Auto-scan trigger'ins savaime ~2026-05-23** (Monthly frequency) jei support nenudirbs anksčiau
- **Incognito test'as nepatvirtintas** — vartotojas atsakė "nera", bet screenshot ar specifika nepateikta (neaišku, ar lentelė nematoma naršyklės render'yje, ar visas Cookies & Reports puslapis dashboard'e). Galima Adblock/uBlock blokuoja `consent.cookiebot.com` arba pasenusi crawl rodo seną WP turinį
- **Cookies & Reports `wpEmojiSettings`, `_pk_*`, `_ga` įrašai** — vis dar rodomi dashboard'e + live `/slapukai` puslapyje. Sprendimas: laukti rescan'o
- **`veriva.lt/privatumo-politika-2/` 404 link** CookieDeclaration intro tekste — pasens kartu su pilnu rescan'u

### Kitas žingsnis

1. **Vartotojas: išsiųsti support email** `support@cookiebot.com` su CBID `bc31b2c9-a2b7-44e8-a3a2-624b027ba646` + manual rescan prašymu. ETA atsakymo ~24h. Po rescan'o lentelė rodys tik `CookieConsent` (1 slapukas) iki kol bus pridėta GA4/GTM.
2. **Carry-over iš sesijos #12: hero rewrite cleanup + commit + push** — dead CSS ~150 lines, inline `<style>` ~340 lines, `#cur` dead code (žr. sesijos #12 carry-over apačioje).
3. **Carry-over: naršyklės QA** (mobile <900px + 5-q quiz flow + prefers-reduced-motion + GSAP defer).

### Tools naudoti

- `Read` × 5, `Grep` × 4, `Bash` × 11 (curl × 5, headless Chrome × 2, where × 2, git × 2)
- `WebFetch` × 1 (Cookiebot pricing)
- `WebSearch` × 1 (scan frequency cost)
- `Edit` × 0, `Write` × 0
- Sukurta + ištrinta laikina: `veriva_slapukai.html`, `veriva_cd.js`, `veriva_rendered.html`, `veriva_rendered2.html`

### Mokyklėlė šiai sesijai

- **Cookiebot diagnostiką pradėti nuo `cdreport.js?referer=` curl'o** — tai parodo, kokius slapukus Cookiebot ŽINO apie domeną. Jei lentelė tuščia ten — markup problema. Jei pilna ten, bet nesimato naršyklėje — render/adblock problema.
- **Premium scan frequency: NIEKADA nedidinti be pricing patikros** — `Daily` kainuoja €62-99/mėn už 1 domain. Vartotojas vos nesumokėjo, nes nepaklausė pirmas.
- **Cookiebot `cd.js` yra loader, ne data** — pats `cd.js` tik ~12KB JS engine'as, kuris fetch'ina `cdreport.js?referer=<hostname>` su tikru turiniu. Be šito skirtumo supratimo galima diagnostikuoti neteisingą failą.

---

## ATLIKTA ANKSČIAU (2026-05-11 — hero-quiz-redesign)

### Ką padarėme

**Pradinė užduotis** — vartotojas pateikė pilnai kitokio dizaino HTML (canvas particles + custom cursor + DM Sans + cyan #00cffc + #030a14 + GSAP) ir paprašė įdėti vietoj esamo hero. Po 3 pivot'ų pasiekta brand-aligned versija.

**`index.html`** — hero + quiz section pilnas perrašymas
- **Pašalinta**: senas `.hero` su `.widget` 5-q embed + `.proof-strip` 4-stat blokas (eil. 271-361, ~95 lines)
- **Pridėta**: naujas `#hero` su canvas particles + radial mesh + ticker + h-rule stat strip + Syne 800 massive headline (`€0 VDAI baudų. / Garantuota raštu.`) + scroll-hint
- **Pridėta**: atskira `#quiz-section` (2-col grid: pitch H2 + 5-q widget glass card su cyan hairline ::before, glass mesh ::after, brand mygtukai)
- **Pridėta**: fixed ticker `<div>` virš nav (9 brand žodžiai × 2 loop, mono font 10.5px)
- **Pridėta**: `<style>` blokas head'e ~340 lines (scope: #hero + #quiz-section, NEpaliečia kitų sekcijų)
- **Brand adaptacija (3 pivot)**: `#030a14` → `var(--ink) #07111f`; `#00cffc` → `var(--cyan) #00b4d8`; `#c9a84c` → `var(--gold) #c8962a`; DM Sans → Plus Jakarta Sans + Syne 800 + JetBrains Mono kicker; clip-path corners → border-radius 8/10/16px; `cursor:none` → standartinis cursor
- **Custom cursor `#cur`**: `display:none !important` (pašalinta funkcionalumas, paliktas div + JS dead listener'iai)
- **Cache-buster**: `v=20260510b` → `v=20260511c` (3 bump'ai dėl 3 pivot'ų)
- **Nav**: `top: 0` → `top: 28px` (dėl fixed ticker virš)
- **Google Fonts**: pridėtas `Syne 400` weight + `DM Sans` (po pivot'o pašalintas) → galutinis stack: Syne 700+800 + Plus Jakarta Sans + JetBrains Mono

**`assets/js/index.js`** — widget logika adaptuota naujam markup'ui
- `buildProgress()` perdaryta — 5 dot'ų (`wpd0..4`) → progress bar fill (`w-qfill` width % + `w-qpct` text label)
- `renderQ()` — `.w-opt` markup → `.qc-opt` su `qco-inner` (icon + text) + `qco-arr`
- `pick()` — selector'ius `.w-opt` → `#w-opts .qc-opt`
- `showResult()` breakdown — markup `.wbd/.wbd-name/.wbd-val` → `.qcr-bd-row/.qcr-bd-name/.qcr-bd-val`
- Pridėtas hero JS blokas gale (~110 lines): canvas particles (80 mėlynos taškės + 105px line connections + mouse attraction) + GSAP entrance timeline + magnetic CTA + custom cursor handler (paliktas, bet display:none)
- Visi handler'iai gerbia `prefers-reduced-motion` ir `(hover:hover)`

### Testai atlikti

- Lokalus HTTP servas (port 5174) — HTTP 200 OK, 6 critical elementai grep verify (`#cur`, `.ticker`, `#hero`, `#quiz-section`, `#main-widget`, `#w-question`, `#w-result`)
- JS adaptacijos verify: `qc-opt`, `qcr-bd-row`, `w-qfill`, GSAP timeline, frame() canvas loop
- HTML balansas: 11 `<section>` open/close balanced
- Vartotojo screenshot'ai (2 pivot'ai):
  - Pirma — balta juosta virš ticker (cream body bg pro `padding-top:28px` skylę → fix: solid #030a14 ticker bg + pašalintas padding-top)
  - Antra — hero/quiz nesutampa su komandos stiliumi (cyan #00cffc + DM Sans — fix: brand adaptacija į `--ink/--cyan/--gold` + Plus Jakarta Sans + Syne 800)

### Deploy

- **Production deploy NEpadarytas** — vartotojas patvirtino `ok` po brand adaptacijos, bet nepaprašė push'inti
- Commit nepadarytas — uncommitted likučiai laukia kitos sesijos commit'o (kartu su cleanup)

### Kas liko / nepatvirtinta

- **Dead CSS `assets/css/index.css`** ~150 lines (eil. 55-225): `.widget`, `.w-top/title/badge`, `.w-progress`, `.wpd`, `.w-qscreen`, `.w-qlabel`, `.w-question`, `.w-opts`, `.w-opt`, `.w-result`, `.w-r-*`, `.w-ring*`, `.w-fine*`, `.w-breakdown`, `.wbd*`, `.w-cta*`, `.w-reset`, `.proof-strip`, `.ps-*`, sena `.hero` (jei egzistuoja), `.hero-grid`, `.hero-w`, `.hero-eyebrow`, `.hero-sub`, `.hero-trust`, `.ht-*` — visi nebenaudojami po hero rewrite
- **Inline `<style>` blokas index.html head'e** (~340 lines) laužia CLAUDE.md `niekada inline CSS/JS` taisyklę — vartotojo `daryti taip kaip kode` leido, bet po brand adaptacijos taisyklė vėl tinka. Reikia perkelti į `assets/css/index.css`
- **Custom cursor `#cur` div** ir JS event listener'iai (~30 lines `index.js` end) — funkcionalumas pašalintas (`display:none !important`), bet kodas liko kaip dead code
- **Naršyklės QA nepadarytas**: 1) mobile breakpoint <900px (h-rule line'ai paslepiami, hero padding-top:80px); 2) widget 5-q flow su naujais `.qc-opt` mygtukais — vartotojas spaudžia option, ar `pick()` veikia, ar progress bar atsinaujina, ar result screen rendering'as su naujais `.qcr-*` markup'u; 3) GSAP timeline veikia su `prefers-reduced-motion`; 4) canvas particles performance ant lower-end prietaiso
- **GSAP CDN ~70KB blocking** `<script src>` head'e be `defer` — Core Web Vitals impact nepatikrintas (LCP gali pablogėti)
- **Cookiebot dashboard verify** carry-over iš ankstesnių sesijų (LT kalba, domeno whitelist)
- **Modal `#modal-privacy` + `#modal-terms` cleanup** carry-over iš ankstesnės sesijos

### Kitas žingsnis

1. **Cleanup po hero rewrite** — pašalinti dead CSS (~150 lines `index.css`) + perkelti inline `<style>` iš `index.html` head'e į `index.css` + pašalinti `#cur` div + dead cursor JS listener'ius. Po to commit + push.
2. **Mobile + widget QA** — naršyklėje incognito 1) hero <900px ar h-rule wrap'ina; 2) 5-q quiz flow nuo pirmo klausimo iki result screen su VDAI baudos prognoze; 3) `prefers-reduced-motion` (Chrome DevTools) kad GSAP + canvas + ticker animation būtų išjungta.
3. **Modal `#modal-privacy` + `#modal-terms` cleanup** (~150 lines) — grep verify, kad niekas nešaukia `openModal('modal-privacy/terms')`, tada ištrinti.

### Tools naudoti

- `Read` × 6, `Edit` × 17, `Bash` × 8, `Grep` × 5, `Glob` × 0
- `AskUserQuestion` × 4 (apimtis, standartai, nav scope, brand kryptis)
- Lokalus HTTP servas (port 5174) × 2 paleidimai prieš pivot'us

### Pivot'ų istorija

1. **Pivot 1** (pradinis): paliktas pateiktas kodas kaip yra (DM Sans + #00cffc + #030a14 + cursor:none + GSAP) → balta juosta virš ticker (cream body bg pro padding-top skylę)
2. **Pivot 2** (balta juosta fix): solid `#030a14` ticker bg + pašalintas `body { padding-top:28px }` + nav `top:28px` → vartotojas patvirtino balta juosta dingo, bet "neatitinka spalvinės ir stiliaus gamos"
3. **Pivot 3** (brand adaptacija): visas `<style>` blokas perrašytas su `var(--ink)/--cyan/--gold` + Plus Jakarta Sans + Syne 800 + JetBrains Mono mono kicker + glass kortelė su radial mesh + brand mygtukai (be clip-path) → vartotojas patvirtino `ok`

---

## ATLIKTA ANKSČIAU (2026-05-10 — privatumas-html)

### Ką padarėme

**`privatumas.html` NEW (454 lines, commit `9efb0d0`)**
- 10 skyrių BDAR Privacy Policy (LT, BDAR + LR ADTAĮ atitiktis)
- Hero su crumbs + meta info, dark theme identiškas `slapukai.html`
- **Skyriai**: 1) Duomenų valdytojas, 2) Renkami duomenys (kontakto forma, brief.html 59 atsakymai, susirašinėjimas, techniniai duomenys), 3) Tikslai+pagrindas (lentelė: 7 tikslai × BDAR 6 str. punktai), 4) Saugojimo terminai (7 kategorijos), 5) Sub-processors (Vercel Inc. JAV/SCC, Resend Inc. JAV/SCC, Cybot A/S Danija, Hostinger Kipras, Zoho EU), 6) Perdavimas už ES (SCC 2021/914 + DPF), 7) 8 BDAR teisės (15-22 str.), 8) Slapukai (Cookiebot.renew CTA), 9) VDAI skundai (kontaktai), 10) Pakeitimai+kontaktai
- `.proc-table` responsive (mobile cards via `data-label` pattern)
- Cookiebot CMP įdėtas (consistency su slapukai.html)
- Callout box: aktyviai vengiame BDAR 9 str. specialių kategorijų

**6 footer link sync** (uniform su `/privatumas.html` + `/slapukai.html`):
- `index.html` × 2: footer modal `openModal('modal-privacy')` → `/privatumas.html`; cf-privacy `<a href="#" onclick="return false">` → `/privatumas.html` (broken link fix)
- `blog/bdar-baudos-lietuvoje.html`: footer `/#kontaktai` × 2 → `/privatumas.html` + `/slapukai.html`
- `blog/nis2-direktyva-lietuvoje.html`: tas pats pattern
- `blog/phishing-mokymai-darbuotojams.html`: tas pats pattern
- `blog/template.html`: tas pats pattern (būsimi blog post'ai inherit'ins)

**`sitemap.xml` patobulinimas**
- `https://veriva.lt/privatumas` ir `/slapukai` entries: pridėta `lastmod 2026-05-10`, priority `0.3 → 0.4`

### Testai atlikti

- HTML struktūra balansuota: h2 10/10, div 18/18, ul 15/15, table 2/2, tr 14/14
- Internal links verify: 9 nuorodos (blog, slapukai, brief, kontaktai, javascript:Cookiebot.renew())
- HTTP verify production: `https://www.veriva.lt/privatumas.html` → 308 → `/privatumas` → 200 OK
- Title verify: `<title>Privatumo politika — Veriva</title>` rendered
- Hero markup verify: `class="bh-crumbs"` matched

### Deploy

- Commit `9efb0d0` push'inta į origin/main
- Vercel build: ✅ Ready 12s (no errors, no warnings)
- Production URL LIVE: `https://veriva.lt/privatumas`

### Kas liko / nepatvirtinta

- **Modal `#modal-privacy` block neištrinta** iš `index.html` (eil. 1367-1440, ~75 lines dead code) — funkcija `openModal('modal-privacy')` daugiau nešaukiama, bet HTML lieka
- **Pre-publish 4-agent ratas nedarytas** privatumas.html — privacy puslapiui galbūt overkill (legal turinys), bet standartas yra (DECISION_LOG)
- **Naršyklės QA nepadarytas** — privatumas.html mobile/desktop vizualiai neperžiūrėtas (curl HTTP only)
- **Cookiebot dashboard verify** carry-over iš ankstesnės sesijos
- **Hero sekcija index.html dark tier sync** carry-over

### Kitas žingsnis

1. **Hero sekcija index.html premium dark tier sync** — vienintelė sekcija, kuri liko ankstesnio stiliaus (radial mesh + mono kicker + Syne 800 + cyan accent), kad svetainė būtų 100% vientisa.
2. **Cleanup `index.html` modal-privacy + modal-terms blocks** — ~150 lines dead code, jei nei vienas link'as jų nešaukia (greitas grep verify).
3. **Cookiebot dashboard config + naršyklės verify** — LT kalba, domeno whitelist, incognito test.

### Tools naudoti

- `Read` × 4, `Edit` × 7, `Write` × 1, `Bash` × 14, `Grep` × 4, `Glob` × 0
- AskUserQuestion × 3 (next task pick, plan approval, footer link strategy)
- TodoWrite × 4

---

## ATLIKTA ANKSČIAU (2026-05-10 — blog-dark-tier-sync)

### blog.html premium dark tier perdirbimas (commit `2ca8177`)
- **Visa puslapio body** dark (`--ink`) — buvo light (`--cream`)
- **Hero (`.bh`)**: mono kicker `Tinklaraštis` + glowing cyan dot (vietoj gold tag), Syne 800 H1, `em` accent baltas-50% (vietoj gold), radial mesh (matches `.about-bg` / `.blog-bg` index'e)
- **Filterai (`.bf-btn`)**: dark glass `rgba(255,255,255,.04)` + cyan border on hover; aktyvus = cyan tinted background, ne ink black
- **Post kortelės (`.bc`)**: `.post`-style premium card iš index — radial mesh background, top hairline cyan gradient line (`::before`), `:has()` sibling dim hover, gradient block visual su SVG grid mask, mono cat label su cyan glowing dot, white-on-dark titles, cyan arrow translateX hover
- **Newsletter (`.nlw`)**: glass card su top hairline + mono kicker `Naujienlaiškis`, em accent baltas-50%, **cyan CTA mygtukas** (vietoj blue)
- **Footer**: pridėtas `border-top` hairline
- **Reduced-motion**: `prefers-reduced-motion` respect
- **Fontai**: pridėtas JetBrains Mono preload
- **CSS balansas**: 103/103 braces (po šios sesijos commit'o), 113/113 (po placeholder fix)

### blog.html 3 placeholder cards disabled (commit `f74415f`)
- **DPO, Incidentai, Mokymai** kortelės: `<a href="/blog/...">` → `<div>` (404 link'ai pašalinti — KI-001 partial fix)
- Pridėtas `Netrukus` badge viršuje dešinėje (mono font, glass background `rgba(7,17,31,.7)` + backdrop-filter)
- Disabled state: `.bc--soon` su `opacity:.55`, no hover transform, "Skaityti straipsnį →" → "Netrukus"
- `aria-disabled="true"` accessibility
- 3 realūs post'ai (BDAR, NIS2, Phishing) lieka aktyvūs su pilnu hover state
- Filterai vis dar veikia (`data-cat` išsaugotas ir disabled kortelėse)

### Production verifikacija
- Push'inta į origin/main: `2ca8177..f74415f`
- Vercel build #2 (commit `f74415f`): Ready 13s
- `https://www.veriva.lt/blog.html` → HTTP 200 (su 308 redirect → /blog)
- 6× "Netrukus" string, 11× `bc--soon` class refs production HTML

### Tools naudoti
- `Read` × 6, `Edit` × 9, `Bash` × 12, `Grep` × 6, `Glob` × 1
- Lokalus HTTP servas (port 5174) prieš commit verifikacijai

### Neužbaigta / nepatvirtinta
- Naršyklės QA nepadarytas (mobile @768px, hover `:has()` sibling dim)
- Cookiebot banner kontrastas su nauja dark paletė nepatikrintas
- Newsletter CTA mygtukas pakeistas blue → cyan be A/B testo (per drąsus brand pakeitimas)
- 3 disabled kortelės užima vietą — UX galėtų būti švaresnis visiškai paslėpus

---

## ATLIKTA ANKSČIAU (2026-05-10 — cookiebot-integration)

### Cookiebot CMP įdiegtas (auto-blocking modelis)
- **Domain group ID**: `bc31b2c9-a2b7-44e8-a3a2-624b027ba646`
- **Mode**: Auto blocking (visi ne-būtinieji slapukai blokuojami iki sutikimo)
- **Įdėtas į 6 puslapius** (kaip pirmas script `<head>`):
  - `index.html`, `slapukai.html`, `blog.html`, `brief.html`, `blog/template.html`
  - 3 blog post'ai: bdar-baudos, nis2-direktyva, phishing-mokymai
- **Cookiebot CDN verified**: uc.js 200 OK, cd.js 200 OK

### `slapukai.html` NEW (KI-005 BDAR partial fix)
- **9-skyrių slapukų politika** (LT, BDAR/e-Privatumo direktyvos atitiktis)
- **CookieDeclaration script** (auto-generuoja realių slapukų sąrašą per Cookiebot CMP)
- **"Atnaujinti slapukų sutikimą" mygtukas** via `Cookiebot.renew()`
- Nav + footer sync su `blog.html` (toks pat stilius)
- Hero sekcija: dark theme + crumbs + meta info
- Skyriai: 1) Kas yra slapukai, 2) Tipai (4 kategorijos), 3) Sąrašas (Cookiebot), 4) Valdymas (per skydą + naršyklę), 5) Trečiosios šalys, 6) Teisinis pagrindas (BDAR + e-Privatumo + LR ERĮ 73 str.), 7) Teisės, 8) Pakeitimai, 9) Kontaktai

### Pašalinta (custom cookie banner — XSS rizika)
- **HTML**: `#cookie-banner` div'as (16 lines, inline `onmouseover` rizika)
- **JS**: `acceptCookies()` + auto-show timer + localStorage logic (14 lines)
- **CSS**: `@keyframes slideUp` (2 lines)
- **Modal**: `#modal-cookies` orphan (32 lines, niekam nebereikalingas)

### Atnaujinta
- Footer linkas `Slapukų politika`: `openModal('modal-cookies')` → `/slapukai.html`
- Cache-buster: `v=20260510` → `v=20260510b`

### Bundle commit `0e51dcf` (push'intas į main)
Vienas commit'as su:
- Cookiebot integracija (šios sesijos darbu)
- Sesijos #8 premium dark tier 9 sekcijų darbu (uncommitted nuo 2026-05-10 vakar)
- Sesijos #8 docs (PROJECT_STATUS, SESSION_STATUS, structure.md)

**Failai**: 13 changed, +3516 / -571 lines | NEW: `slapukai.html`

### Production verifikacija (po push)
- Vercel build: 🟢 Ready 15s
- `https://www.veriva.lt/` — 200 OK su Cookiebot script
- `https://www.veriva.lt/slapukai` (Vercel clean URL) — 200 OK
- `/blog`, `/brief`, 3 blog post'ai — visi 200 OK (308→200 redirect)
- CSS asset (83KB) + JS asset (12KB) — 200 OK
- Custom cookie banner — production neturi (XSS pašalinta)
- Footer linkas — `/slapukai.html` veikia

### Tools naudoti
- `AskUserQuestion` ×2 (custom banner sprendimas, GCM, declaration page; bundle commit scope)
- `Grep` × 12, `Edit` × 11, `Read` × 9, `Bash` × 14
- Lokalus HTTP servas (port 5174) prieš commit verifikacijai

---

## ATLIKTA ANKSČIAU (2026-05-10 — premium-dark-tier-redesign)

### Brand language: premium dark tier (taikoma visose perdirbtose sekcijose)
- `--ink` background + radial mesh (cyan + blue blobs)
- Mono kicker (`var(--ffm)` JetBrains Mono 11px, `.18em` letter-spacing) + glowing cyan dot
- H2: Syne 800, `clamp(36px,4.4vw,56-60px)`, `<em>` accent rgba(255,255,255,.5) monotone
- Cards: glass `rgba(255,255,255,.04→.02)` + 1px white .07 border + 20px radius + cyan glow shadow ant hover
- Top accent line `::before` (cyan gradient hairline, opacity .5→1 ant hover)
- Sibling dim per `:has()` selector (Linear focus pattern)
- All transitions su `--ease-out:cubic-bezier(.23,1,.32,1)` (Kowalski strong curve)
- All hovers gate'inti už `@media (hover:hover) and (pointer:fine)`
- All animations respect `@media (prefers-reduced-motion:reduce)`
- Pridėtos 2 fonts (JetBrains Mono 400/500) iš Google Fonts
- Pridėtas `<svg>` sprite po `<body>` su `procGrad` linearGradient + `procGlow` filter (reuse'inami visose dark sekcijose)

### Sekcijos perdirbtos (7 viso)

**1. `#paslaugos` — `.svc-bg` premium dark tier**
- HTML: 3 `<article class="sc">` su `data-r` stagger reveal
- 3 unikalūs CTA pagal paslaugos kontekstą: "Užsisakyti BDAR auditą" / "Įvertinti IT rizikas" / "Suplanuoti mokymus"
- Stat block: €0 / 90 d. / 34→4% (vietoj generic ✅)
- Cursor-follow cyan glow per JS (`pointermove` ant `.svc-grid`, rAF debounced, CSS `--mx`/`--my` vars)
- Step indeksai: `01/03`, `02/03`, `03/03` mono top-right corner
- Schema.org `ItemList` su 3× `Service` (provider, areaServed=LT)

**2. `#auditas` — `.proc-bg` premium dark tier**
- 5-step zigzag layout (alternating left/right)
- Custom 5 SVG illustrations (400×320 viewBox, scenic compositions su `procGrad` gradient + `procGlow` filter)
- Mono `Step 01 / 05` indeksas vietoj outline 140px Syne (Linear/Stripe pattern)
- 5 P0 + 5 P1 + 4 P2 polish fix'ai (vertical rhythm, typography hierarchy, hover micro-interactions)

**3. `#komanda` — `.team-bg` premium dark tier**
- 2-col grid (`.team-grid` repeat(2,1fr) max-width 920px)
- HTML perstatymas: pašalinti VISI inline `style` ir `onmouseover/onmouseout` (XSS rizika)
- Justinas: 96×96 photo su dual-layer ring (1px white inset + 4px cyan halo .08)
- Marina: premium monogram (radial blue+cyan + ink gradient + grid pattern + Syne 38px su cyan text-shadow)
- Mono trust badges: "9+ METAI · NIS2 · INCIDENT RESPONSE" / "8+ METAI · BDAR · DPO · VDAI"
- LinkedIn ikona (30×30 button) greta tel:
- Avatar reveal sub-animation: `scale(.85)→1` su delay
- Schema.org `Person` JSON-LD ×2 (jobTitle, telephone, knowsAbout, worksFor:#organization)

**4. `#apie` — `.about-bg` premium dark tier**
- H2 reframe: "BDAR atitiktis ir kibernetinis saugumas — teisė ir IT vienoje komandoje" → **"8 metai. 120 audituotų įmonių. €0 VDAI baudų."** (data-driven, ne dubliuoja H1)
- Linear hairline stats strip (4-col, 1px gradient separators)
- Count-up scroll-in animacija per JS: `0 → 8+/120+/€0/15+` per 1.4s ease-out quart, threshold .5
- Manifesto stilius: lede (Syne 22) + 2 tight body paragraphs (~80 žodžių)
- "Why Veriva" hairline list (4 differentiators, no boxes)
- Įmonės info — hairline-top mono block (no card)
- CTA ghost link: "Susipažinkite su mūsų darbo metodika →"
- Schema.org `Organization` enhanced: `numberOfEmployees:5`, `slogan`, `award:"€0 VDAI baudų..."`
- ⚠️ Pirmoji versija buvo light tier (`--g50` cream), bet vartotojas paprašė atstatyti brand consistency → konvertuota į dark

**5. `#atsiliepimai` — `.case-bg` premium dark tier**
- 3 case studies (`<article class="case">`) — Logistika / Medicina / Fintech
- Top stat block: "34% → 4%" / "€150K+" / "3h → €0" su tabular-nums
- Mono `.case-tag` su glowing cyan dot
- `.case-outcome`: cyan check SVG + drop-shadow (vietoj ✅ green box)
- Sektorių pills strip viduje sekcijos (8 sektorių, hover cyan)
- Bug fix: orphan markup po `</section>` (sektorių strip buvo už parent container'io)

**6. `#kainos` — `.price-bg` premium dark tier (perdirbtas 2× — Empirra style remake)**
- **v1**: 3 planai (Shy / Standard `plan-hi` / Advance) su CSS-only checkmark, cyan glow, tabular-nums, white CTA-hi
- **v2 (Empirra remake)**: vartotojas parodė screenshot'ą "tekstas suluzęs, nera vieno dominavimo plano, marketinginiu atzvilgiu labai silpanas sprendimas". Padaryta pilnas remake pagal Empirra `.plan.featured` pattern:
  - Featured kortelė `transform:scale(1.04) z-index:2` + ★ "Dažniausiai pasirenkamas" cyan gradient eyebrow viršuje + sibling `.plan-dim{opacity:.78}`
  - Tier badges (Starter/Growth/Premium) su skirtingomis spalvomis (white/cyan/gold)
  - Plan name: Syne 26-30px (vietoj 11px mono)
  - Plan tag (sub-headline): "Bazinė BDAR atitiktis. Viskas, ko reikia... Per 14 d."
  - Price `white-space:nowrap` + sumažintas font (clamp 26-32px) — tilpsta vienoje eilutėje
  - **NEW** `.plan-replaces` — ką klientas nustoja mokėti ("BDAR konsultantą įmonėje · 3 500–6 000 €/mėn")
  - **NEW** `.plan-payback` — ROI signalas ("Atsiperka: ~2 mėn.")
  - **NEW** `.plan-saves` (TIK featured) — "~3 500 € sutaupote per metus" su cyan glowing big number
  - **NEW** `.plan-guarantee` — gold accent box ("Garantija: Atitiktis per 7 d. — arba toliau dirbame nemokamai")
  - **NEW** `.plan-list-no` — excluded items su gray dash (rodo, ką gauti upgrade'inus)
  - Outcome-driven CTA: Standard "Atitiktis per 7 d. — garantuojame raštu" (vietoj "Pasirinkti planą")

**7. `#blog` — `.blog-bg` premium dark tier**
- 3 post kortelės (`<a class="post">`) su gradient mesh top visual + grid pattern + masked corners
- `.post-cat-mark` — didelis Syne 800 kategorijos žymeklis ant vizualo
- Sibling dim per `:has()` Linear focus pattern
- `.blog-all-cta` ghost mygtukas su arrow translateX hover

**8. `#faq` — `.faq-bg` premium dark tier**
- 12 Q&A 2-col grid (max 1040px), mono kicker + Syne 800 H2 + sub paragraph
- **+ ikona** (12 vietų) → SVG plus icon (rotate 45° ant `.open`)
- Cyan accent ant rotate'into ikono + border-bottom .18 cyan tint kai atviras
- `aria-expanded` toggle + a11y compliant
- `:focus-visible` cyan outline
- HTML balanso bug ištaisytas (orphan `</div>` po `.faq-inner` wrapper'io pašalinimo)

**9. `#kontaktai` — `.contact-bg` refreshed**
- Mono kicker `.contact-tag` su glowing cyan dot
- H2 Syne 800 + `<em>` rgba(.5) monotone
- `<span>` semantic + `aria-labelledby`

### Cleanup (CSS dead code pašalinta)
- `.svc-grid + .sc-line/-ico/-title/-desc/-items/-result/-link` (light cream variant)
- `.testi-bg + .tc + .tc-stars/-text/-author/-av/-name/-role/-result/-result-hero/-av-wrap/-av-verified/-sector` (light variant)
- `.pgrid + .pc/.pc-name/.pc-price/.pc-cycle/.pc-desc/.pc-outcome/.pc-list/.pc-chk/.pc-badge/.pc.hi + .btn-pw/.btn-po/.btn-pb` (~30 lines dead)
- `.blog-bg{white}/.bc/.bc-img/.bc-meta/.bc-cat/.bc-dot/.bc-title/.bc-excerpt/.bc-read/.bc-read-arrow/.btn-blog-all` (~16 lines)
- `.faq-bg{white}/.faq-inner/.faq-list 1fr 1fr/.faq-col light/.fq light hover/.fi-ico circle/.fi.open .fi-ico/.fa-in light` (~10 lines)
- `.contact-tag{old cyan UPPERCASE}/.contact-h em{cyan}` (sena versija)
- `.plan-badge{old}/.plan-cycle/.plan-desc/.plan-outcome cyan box` (po Empirra remake)
- Mobile rules: `.testi-grid`, `.pgrid`, `.pc.hi{transform:none}` pašalinti
- Visi inline `style="..."` HTML perdirbtose sekcijose (~50+ atributai)
- Visi `onmouseover/onmouseout` (XSS rizika) — komandos kortelėse
- 12× `<span class="fi-ico">+</span>` emoji → SVG plus ikonos (FAQ accordion)

### Skill / agent / tool naudojimas
- `emil-design-eng` skill — design tokens + Before/After lentelės kiekvienai sekcijai (Kowalski lygis)
- `polish` skill — P0+P1+P2 audit ant `.svc-*` (26 issues fixed)
- `marketing-analitikas` agent — copy/SEO/CTA/Schema rekomendacijos
- `general-purpose` agent — automationempire.ai layout research (zigzag pattern)
- WebFetch — Stripe Atlas / Linear / Mercury / Vercel premium kortelių patternai

### CSS metrikai (po visų pakeitimų)
- `assets/css/index.css`: 590 → **2573 lines** (~83KB), 708/708 braces valid
- `assets/js/index.js`: 276 → **324 lines** (count-up + cursor-follow + faq() rewrite)
- `index.html`: 1127 → ~1500 lines, **0 inline styles** perdirbtose sekcijose, **0 inline JS handlers** (išskyrus 2 footer link colors `#kontaktai` cf-note bloke)

### Schema.org enhancements
- `Organization`: pridėta `numberOfEmployees`, `slogan`, `award`
- `ItemList` × 3 `Service` (#paslaugos)
- `Person` × 2 (Justinas, Marina, #komanda)

---

## SAVO ĮVERTINIMAS

**SAVO ĮVERTINIMAS: 7/10**

**Iki 10 trūksta:**
- C žingsnis (QA naršyklėje) NEPADARYTAS — visi pakeitimai verifikuoti tik per curl/CSS token check'us, ne reali Chrome/Firefox/mobile DevTools sesija. Pricing tekstas suluzęs problema atrasta per vartotojo screenshot'ą, ne mano paties verifikaciją.
- `#apie` sekcija padaryta 2× (pirma light tier, vartotojas paprašė atstatyti dark) — turėjau klausti pirma, prieš pradėdamas darbą su skirtingu tier'iu.
- Pricing perdarytas 3× — reikėjo iškart palyginti su Empirra (donor projektu), o ne po vartotojo nepasitenkinimo.
- HTML balansas FAQ sekcijoje sumažintas 2× netaisyklingai prieš pataisydamas (`___DUMMY___` artefaktas, orphan `</div>`).
- Likę 2 inline styles `#kontaktai` bloko cf-note (footer link colors `style="color:rgba(255,255,255,.38)"`).
- Privatumas.html `<p><strong><strong>` paveldėtas HTML klaidą — pamatyta, bet ne ištaisyta (palikta kaip "out of scope").

---

## P1 NEPATRAUKTI (sekantis sesijos kandidatai)
- ✅ Blog/FAQ/Contact PERTVARKYTOS šioje sesijoje (nebe `nepertvarkytos` kaip ankstesniame snapshot'e)
- C žingsnis: realus QA naršyklėje (Chrome + Firefox + mobile DevTools + Lighthouse)
- A žingsnis: git commit + push į main (production deploy ant veriva.lt)
- Hero sekcija lieka NEPERTVARKYTA — sąmoningai (atskaitos taškas)
- Real foto Marinai (dabar premium monogram fallback)
- Realūs LinkedIn URL'ai (dabar `https://www.linkedin.com/` placeholder)
- Pavardės publikuoti? (dabar tik vardai)
- Likę 2 inline styles `#kontaktai` cf-note (footer link colors)
- Privatumas.html paveldėta klaidą `<p><strong><strong>` (eil. 1061)

---

## ANKSTESNĖ SESIJA (2026-05-10 — vercel-migration)
**Data**: 2026-05-10
**Sesijos tikslas**: UX patobulinimai (FAQ, email, nav) + brief audit klausimynas + KI-004 index.html split + Vercel deploy fix + DNS migration WP → Vercel

---

## ATLIKTA ANKSČIAU (2026-05-10 — vercel-migration)

### UX patobulinimai
- ✅ **FAQ 2 stulpeliai** — index.html 12 Q&A perdaryta į grid 2 cols (6+6) desktop / 1 col ≤760px su animation-safe `align-items:start`
- ✅ **Plain email vietoj Cloudflare obfuscation** — pašalinta 7 vietose (`[email protected]` → `info@veriva.lt` mailto), nes Cloudflare `email-decode.min.js` neveikia ne-Cloudflare hosting'e
- ✅ **Nav parity blog.html ↔ index.html** — blog.html nav perdaryta į 8 punktų meniu (Paslaugos/Apie/Komanda/Kaip dirbame/Rezultatai/Kainos/Tinklaraštis/Susisiekti), `position:fixed` (60px), mobile breakpoint 768→900px, full-screen overlay menu
- ✅ **BDAR widget realūs duomenys** — index.html widget'as perdarytas su VDAI 2018-2025 baudų statistika (3K/12K/75K/350K vietoje sugalvotų 5K/25K/120K/600K), pažeidimo tipo koeficientai (sveikatos 3x, saugumo 2.5x, dok. 1.5x), cap pagal įmonės dydį, Vinted €2.4M outlier disclaimer 250+ + kritinė rizika scenarijuje, šaltinis "Pagal VDAI 2018–2025 baudų statistiką"

### `brief.html` — pirminis BDAR/duomenų saugos klausimynas (NEW)
- ✅ 4 sekcijos × 59 klausimai (originalūs Google Form 56 + 3 papildomi neprivalomi: prioritetai, timeline, komentarai)
- ✅ Konditional logika: K3 "Kokia veikla" → filtruoja medicinos vs verslo opcijas; `{pacientų/klientų}` placeholder'iai dinamiškai keičiasi
- ✅ 5 multi-select klausimai (K7,K8,K11,K45,K47) — patobulinimas vs Google Form radio'ų
- ✅ Progress bar (sekcija X iš 4 + procentai), validation, 3 states (form/success/error)
- ✅ Submit fallback: POST /api/forms/audit-request → localStorage backup
- ✅ Veriva brand (Syne + Plus Jakarta Sans, --ink/--blue/--gold), noindex,nofollow
- ✅ Link'as iš index.html BDAR widget'o rezultato sekcijos: "Norite tikslesnio vertinimo? → užpildyti detalų klausimyną"

### KI-004 index.html split (token optimizavimas)
- ✅ `assets/css/index.css` (590 lines, 32K) — pagrindinis CSS + slideUp keyframe
- ✅ `assets/js/index.js` (276 lines, 11K) — widget logic, FAQ, modals, cookie banner
- ✅ index.html: 1995 → 1127 lines (-43%, -868 lines)
- ✅ Pašalintas Cloudflare email-decode `<script src>` (nereikalingas)
- ✅ Cache-buster `?v=20260510` ant CSS+JS
- ✅ Visi 10 inline event handler'ių (faq, widgetCTA, openModal, ...) verifikuoti — defer load veikia
- ✅ JSON-LD schemos (ProfessionalService + FAQPage) palieku inline (SEO)
- 📊 Token sutaupymas: CSS keitimui 110K → 8K (-92%), JS keitimui 110K → 3K (-97%)

### Vercel deploy fix (kritinis blocker)
- 🔴 **Diagnozė**: Vercel build fail'inosi 9 kartus per 21h (Production + Preview), paskutinis sėkmingas deploy 48 dienų senas. Visi commit'ai nepasiekė production'o.
- ✅ **Fix #1** (`fca76a9`): pašalintas invalid `"runtime": "edge"` blokas iš `vercel.json` `functions` (formatas deprecated, runtime jau deklaruotas TS failuose per `export const config = { runtime: 'edge' }`)
- ✅ **Fix #2** (`6974806`): pridėtas `"buildCommand": null` + `"outputDirectory": "."` (statinė svetainė root'e, ne `/public/`)
- ✅ Build #1 po fix #1 — Error (output dir missing)
- ✅ Build #2 po fix #2 — **READY** (deploy `lyvbrbbmk`, 27s build)
- ✅ Visi 10 URL'ų ant `veriva-geras.vercel.app` → 200 OK

### DNS migration WordPress → Vercel
- ✅ Vercel domain'ai pridėti (vartotojo): `veriva.lt` + `www.veriva.lt`
- ✅ Hostinger DNS pakeitimas (vartotojo, 4 veiksmai per UI):
  - Ištrinta: `A @ 35.198.136.225` (sena WP)
  - Ištrinta: `CNAME www → veriva.lt` (sena WP)
  - Pridėta: `A @ 76.76.21.21` (Vercel)
  - Pridėta: `CNAME www → cname.vercel-dns.com` (Vercel)
- ✅ Email konfigūracija išsaugota: 5 record'ai NEPALIESTI (Zoho `_zmail._domainkey` DKIM, SPF, verification, 3× MX → `mx{1,2,3}.zoho.eu`)
- ✅ DNS propagation patvirtinta 6 globaliais resolvers'ais (Google 8.8.8.8/8.8.4.4, Cloudflare 1.1.1.1, Quad9 9.9.9.9, OpenDNS, Yandex)
- ✅ HTTPS test: `www.veriva.lt` → 200 OK, **Server: Vercel**, visi 10 URL'ų live
- ✅ WordPress mirė: `/wp-admin/` → 307 redirect į Vercel
- ⏳ **Apex SSL sertifikatas** (`https://veriva.lt/` be www) dar neissued — paliktas background task, vartotojui matomas warning naršyklėje

### Vercel CLI setup (claude code dirbtų)
- ✅ Patvirtinta auth: `pinigine1-6549` user
- ✅ Repo link'inta su projektu: `vercel link --yes --project veriva-geras` → `.vercel/project.json` sukurtas (gitignored)
- ✅ Galiu daryti `vercel ls`, `vercel inspect`, `vercel project inspect` (read-only) — DNS endpoint'ams reikia atskiros prieigos

### Commit'ai (6 viso, push'inta į origin main)
- `c5e14e6` feat(blog): BDAR baudos pillar postas + template v2 polish (sesijų 4-5 likučiai)
- `d011841` feat(ui): FAQ 2 stulpeliai, plain email, nav parity, BDAR widget realūs duomenys
- `60f9d56` feat(brief): pirminis BDAR ir duomenų saugos klausimynas
- `9328cef` refactor(index): KI-004 — extract inline CSS/JS to /assets
- `fca76a9` fix(vercel): remove invalid functions runtime config
- `6974806` fix(vercel): static site config — outputDirectory + buildCommand

---

## P1 NEPATRAUKTI (palikti kitai sesijai)
- **Apex SSL sertifikatas** dar neissued — `https://veriva.lt/` browser'iui rodo SSL warning. Vercel išduos auto, bet sesijos pabaigoje nepatvirtinta.
- **Email integration test** — `info@veriva.lt` Zoho turi veikti (DNS record'ai nepaliesti), bet realus test email nepasiųstas
- **Google Search Console** — sitemap submit + 3 blog URL request indexing dar nepadaryta
- **WordPress hosting cancellation** — Hostinger WP instalacija vis dar veikia, niekas į ją nepatenka. Palauti 7 dienas, paskui cancel.
- **Vercel primary domain** — pasirinkti ar `veriva.lt` ar `www.veriva.lt` kaip primary (Vercel UI: Domains → set primary). Šiuo metu apex 307 → www.

---

## ANKSTESNĖ SESIJA (2026-05-10 — nis2-phishing-publish)

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

1. **`privatumas.html` (paskutinis KI-005 BDAR blocker)** — teisinis reikalavimas BDAR. Stilius identiškas `slapukai.html` (cream bg + dark hero + 9-10 skyrių). Reikia: duomenų valdytojas (Veriva UAB), kontaktai, tvarkymo tikslai (lead form, newsletter, BDAR widget), teisinis pagrindas (BDAR 6 str.), saugojimo terminai, jūsų teisės, DPO kontaktas.
2. **Hero sekcija index.html premium dark tier sync** — vienintelė sekcija, kuri dar liko ankstesnio stiliaus. Reikia perdaryti pagal naują brand language (radial mesh + mono kicker + Syne 800 H2 + cyan accent), kad svetainė būtų 100% vientisa.
3. **Cookiebot dashboard verify** — patikrinti LT kalba, domeno whitelisting (`veriva.lt` + `www.veriva.lt`), incognito naršyklėje patvirtinti banner pasirodo. Jei nepasirodo — domeno whitelist'as Cookiebot dashboard'e neatliktas.

**Alternatyvos:**
- 🅰️ **Multi-page skeletons** (paslaugos.html, apie.html, kainos.html, kontaktai.html, 404.html) — visi linkai iš nav vis dar `/#section`, tikriausiai veiks tik scroll'inant index'e
- 🅱️ **Likę 3/6 placeholder blog post'ai** (KI-001 full fix): dpo-funkcija, incidentu-valdymas-72h, darbuotoju-bdar-mokymai — naudojant template v2 + 4-agent pre-publish ratas
- 🅲 **Backend setup** (KI-007, KI-008): Supabase project + migrations + env vars Vercel'yje, Resend API key, contact endpoint live test
- 🅳 **Google Search Console** — add property, submit sitemap, request indexing 3 blog URL'ams
- 🅴 **WordPress hosting cancellation** (po 7 dienų stabilumo verifikacijos) — sutaupys hosting mokestį
- 🅵 **Newsletter endpoint** (KI-002): `/api/forms/newsletter`, dabar tik `alert()` — duomenys prarandami

**Rekomendacija**: 1 (paskutinis BDAR teisinis blocker) → 2 (vizualinis polish 100% brand consistency) → 3 (Cookiebot verify 5 min). Po to — 🅰️ multi-page skeletons.

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
| 2026-05-10 (vercel-migration) | UX patobulinimai + brief klausimynas + KI-004 split + Vercel deploy fix + DNS WP→Vercel | `c5e14e6`, `d011841`, `60f9d56`, `9328cef`, `fca76a9`, `6974806` | UX: FAQ 2 cols, plain email (7 vietos), nav parity (8 punktai blog.html), BDAR widget realūs VDAI duomenys; NEW brief.html (4 sek × 59 kl, konditional logika sveikatos vs verslo); KI-004 index.html split → assets/css/index.css (590 lines) + assets/js/index.js (276 lines), -43% lines, -92% token cost CSS keitimui; Vercel build fix #1 (invalid runtime:edge) + #2 (outputDirectory) → Production READY; DNS migration: Hostinger A 35.198.136.225 → Vercel 76.76.21.21 + CNAME www → cname.vercel-dns.com (vartotojo per UI, Zoho email DNS nepaliesti); 10 URL'ų LIVE ant www.veriva.lt 200 OK; apex SSL pending |
| 2026-05-10 (premium-dark-tier-redesign) | 9 sekcijų index.html perdirbimas į premium dark tier (Stripe/Linear lygis) | bundle'inta `0e51dcf` | 9 sekcijos perdirbtos (paslaugos/auditas/komanda/apie/atsiliepimai/kainos/blog/FAQ/kontaktai), brand language unified (radial mesh + mono kicker + cyan dot + Syne 800 + cyan accent), CSS 590→2573 lines (708/708 braces), JS 276→324 lines (count-up + cursor-follow + faq a11y), schema enhancements ×3, 12× emoji+ → SVG icons, ~80 lines dead CSS removed, visi inline styles + onmouseover XSS pašalinti |
| 2026-05-10 (cookiebot-integration) | Cookiebot CMP įdiegimas (BDAR/e-Privatumo atitiktis) + slapukai.html + bundle commit | `0e51dcf` | Cookiebot CMP auto-blocking 6 puslapiuose (Domain ID `bc31b2c9-...`), slapukai.html NEW (9-skyrių BDAR politika + CookieDeclaration + Cookiebot.renew btn), pašalintas custom #cookie-banner (XSS rizika su inline onmouseover): HTML 16 + JS 14 + CSS 2 + modal-cookies orphan 32 lines, footer linkas modal → /slapukai.html, bundle commit'as su sesija #8 (3516+/571-), production verify 7/7 URL 200 OK + Cookiebot CDN 200 OK |
| 2026-05-10 (blog-dark-tier-sync) | blog.html premium dark tier sync su index.html + 3 placeholder cards disabled | `2ca8177`, `f74415f` | blog.html visas dark theme (buvo light cream): hero su mono kicker + cyan dot + Syne 800 + radial mesh, filterai dark glass + cyan accent, post kortelės `.post`-style premium card su top hairline cyan + `:has()` sibling dim + grid mask visual, newsletter cyan CTA + glass card, footer hairline, JetBrains Mono preload, prefers-reduced-motion respect; KI-001 partial: 3 placeholder kortelės (DPO/Incidentai/Mokymai) `<a href>` → `<div>` su Netrukus badge (glass + backdrop-filter) + opacity .55 + aria-disabled, 404 link'ai pašalinti, filterai vis dar veikia; production LIVE 200 OK, 6× Netrukus + 11× bc--soon refs |
| 2026-05-10 (privatumas-html) | privatumas.html NEW (BDAR Privacy Policy) + 6 footer link sync | `9efb0d0` | privatumas.html NEW 454 lines, 10 skyrių BDAR Privacy Policy (LT, BDAR + LR ADTAĮ atitiktis), sub-processors lentelė (Vercel/Resend/Cookiebot/Hostinger/Zoho su SCC + DPF), 7 saugojimo terminai, 8 BDAR teisės (15-22 str.), Cookiebot.renew CTA, `.proc-table` responsive (data-label mobile cards); 6 footer link sync (index×2 + 4 blog post'ai/template: modal openModal('modal-privacy') + broken `<a href="#" onclick="return false">` → /privatumas.html); sitemap lastmod + priority bump 0.3→0.4; production verify 308→200 OK; KI-005 FULL FIX |
| 2026-05-11 (hero-quiz-redesign) | index.html hero + quiz section perdarymas pagal vartotojo HTML + brand adaptacija | UNCOMMITTED | Hero + quiz pilnas perrašymas (canvas particles + ticker + glass quiz card + Syne 800 + mono kicker + cyan accent); 3 pivot'ai (DM Sans/cyan #00cffc → balta juosta debug → solid #030a14 ticker bg → brand adaptacija į --ink/--cyan/--gold + Plus Jakarta Sans + Syne 800 + JetBrains Mono); pašalintas `.hero` + `.widget` + `.proof-strip` (~95 lines), pridėtas naujas markup; `#cur` custom cursor display:none + dead JS listener'iai; inline `<style>` ~340 lines head'e laužia CLAUDE.md; cache-buster v=20260510b→20260511c; nav top: 0→28px; widget JS adaptuota (qc-opt, qcr-bd-row, w-qfill); hero JS gale (~110 lines: canvas + GSAP + magnetic CTA); production lieka ant `9efb0d0` — UNCOMMITTED |
| 2026-05-11 (cookiebot-debug) | CookieDeclaration lentelės diagnostika + Cookiebot pricing patikra | — (zero code change) | Patikrinta: scripts placement OK, CDN endpoint'ai HTTP 200, cdreport.js?referer= grąžina pilną lentelę, headless Chrome render parodė DOM lentelę su Būtini(2)+Statistika(4). Root cause: Cookiebot crawl iš 2026-04-23 (PRIEŠ WP→Vercel migraciją) rodo seną WP versiją (wpEmojiSettings, _pk_id#, _pk_ses#, _ga, _ga_#, link į veriva.lt/privatumo-politika-2/ 404). `www.veriva.lt` automatinis aliasas apex'ui (Cookiebot grąžino "already registered with its variant"). Dashboard `Re-scan` mygtuko Premium UI NĖRA (3 ekranai patikrinti). Pricing tyrimas: Daily +€62-99/mėn/domain — neaktyvinti. Sprendimas: vartotojas siunčia support email su CBID `bc31b2c9-a2b7-44e8-a3a2-624b027ba646` + manual rescan prašymu, arba laukti auto-scan ~2026-05-23 |
| 2026-05-11 (blog-automation-port) | Blog automation pipeline full port iš Empirra (3 endpoint'ai + 14 lib failai + topics.json + migration + vercel.json + docs) | UNCOMMITTED (code-done, deploy pending) | Solution-architect 11-sekcijų plano analizė; 14 lib failų (1748 lines TS): claude/github/telegram/pexels/blog-card/blog-template/blog-prompts/link-map/link-constraints/internal-links/sitemap-update/auth-node/timeout/flags — visi adapted Verivai (LT slugify, LT→EN Pexels translation, .bc card markup, LT diacritic regex, service: page targets, veriva.lt URLs); 3 API endpoint'ai (1278 lines TS): blog-gen 553 lines (LT validators × 10), telegram-webhook 319 lines (LT pranešimai, veriva_telegram_revise_state), blog-approve 406 lines (single blog.html path, branch-level topics.json update); topics.json 21 keywords (3 published + 18 pending); migrations/002_blog_automation.sql (veriva_telegram_revise_state + veriva_blog_runs, RLS, service_role only); vercel.json updated (builds array + crons "0 8 * * 2,4" + 60-90s maxDuration); docs/blog-automation-deploy.md 7-step guide ($0.05-0.08/post cost); 7/12 env vars push'inta į Veriva Vercel (OPENAI_API_KEY, SUPABASE_URL, RESEND_API_KEY + 4 gen secrets); 5 Sensitive vars CLI nepull'ina (GITHUB_TOKEN, PEXELS_API_KEY, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN/CHAT_ID) — vartotojo input pending; TypeScript zero errors |
| 2026-05-12 (bundle-push-hero-polish) | Bundle commit + push s12+s14 į production + hero polish iteracijos | `2512730`, `4ee35d1`, `caa5f01`, `d708d90`, `e88719f`, `c91c675`, `50d409c`, `9d1b367`, `f2f2cdb` | Bundle commit s12+s14 (43 files, +9136/-326) į origin/main. INC-001: Vercel build fail po pirmo push'o — CRON_SECRET trailing whitespace iš openssl rand -hex 32, fix: `vercel env rm` + `printf %s | tr -d \\n\\r\\t` + redeploy. Vercel webhook lag anomaly: 3 commits (d708d90+e88719f+50d409c) push'inta į GitHub bet missing Vercel deployments — force trigger empty commit (c91c675) reabsorbavo. Hero iteracijos: ticker baltas, .h-bottom margin-bottom 64/40, .btn-hero-secondary text-link→outlined button, nav padding 96→128/80→108, #hero overflow hidden→clip + min-height 720→780/640→700. Frontend-revizorius agent panaudotas paskutiniam fix'ui. Brief.html prilinkintas hero secondary CTA (buvo tik quiz result screen'e). 6 Vercel builds Ready (13-14s avg), production LIVE ant `f2f2cdb` |
