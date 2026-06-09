# PROJECT_STATUS — Veriva

**Pradžia**: 2026-05-09
**Paskutinis update**: 2026-06-09 (fonts-hanken-grotesk-visur, s27)
**Statusas**: 🟢 **Hanken Grotesk visoje svetainėje** (s27 — vieno-šrifto sistema, Syne/Jakarta/JetBrains/Inter pašalinti, 55 failai, footer WCAG AA) · 🟢 **BDAR audito klausimynas LIVE** (s24 — 42 kl. wizard + AI + Supabase + Resend) · 🟢 8 LIVE blog straipsniai (s26) + 21 indeksuojami seo/* (s25: 17 noindex thin) · 🟢 SEO architecture stable · 🟢 Supabase+Resend+OpenAI Production LIVE · 🟡 blog automation RUNTIME blocked (5 Sensitive env vars) + greičiausiai ESM crash (Node endpointai) · 🟡 scoring matrica laukia MasterLegal · 🟡 KI-012 hero SVG carry-over
**Production URL**: https://veriva.lt (LIVE apex primary, www → 308 → apex) | SSL ✅
**Paskutinis commit Veriva-geras**: `4a8866b` (s27 fonts → Hanken Grotesk, 55 failai, push LIVE). s26 `6acc7f9` (2 blog straipsniai).
**Vercel Domain config**: `veriva.lt` Production primary, `www.veriva.lt` 308 Permanent Redirect → apex

---

## PUSLAPIŲ STATUSAS

| Puslapis | Statusas | Pastabos |
|---|---|---|
| `index.html` | 🟢 LIVE hero polish + .h-bottom 96px (2026-05-12, `a467b9c`) | Hero + quiz section live'e su brand-adapted stack (`--ink/--cyan/--gold` + Hanken Grotesk (vieno-šrifto, s27)); ticker BALTAS tekstas (rgba(255,255,255,.85)) + canvas particles + GSAP timeline + magnetic CTA + glass quiz card; brief.html link hero secondary CTA outlined button (cyan border, 13px); `.h-bottom margin-bottom: 96px desktop / 64px mobile` (s16 pakeltas iš 64/40); nav padding 128px desktop / 108px mobile; `#hero overflow: clip` + min-height 780/700; Cookiebot script su `data-user-country="LT"` override; **inline `<style>` ~340 lines head'e** (vis dar laukia perkėlimo į index.css); custom cursor `#cur` dead element + cursor JS listener'iai dead code |
| `assets/css/index.css` | 🟡 LIVE 2571 lines + ~150 lines dead CSS | Po hero rewrite: `.widget`, `.w-*`, `.wpd*`, `.wbd*`, `.proof-strip`, `.ps-*`, sena `.hero-w/.hero-eyebrow/.hero-trust` (eil. 55-225) nebenaudojamos. Dead CSS cleanup laukia kitos sesijos. |
| `assets/js/index.js` | 🟡 LIVE ~16KB + dead cursor listener'iai | Po hero rewrite: widget logika adaptuota naujam markup'ui (`buildProgress` progress bar, `renderQ` `.qc-opt`, `pick` `#w-opts .qc-opt`, `showResult` `.qcr-bd-row`); pridėtas hero JS blokas (~110 lines: canvas particles + GSAP timeline + magnetic CTA + custom cursor handler); custom cursor JS listener'iai (~30 lines) liko nors `#cur` `display:none` |
| `blog.html` | 🟢 LIVE premium dark tier | Visa puslapio dark theme (buvo light); hero radial mesh + mono kicker + cyan dot + Hanken Grotesk (s27); filterai dark glass + cyan accent; post kortelės `.post`-style premium card su `:has()` sibling dim + grid mask visual; newsletter cyan CTA + glass card; 3 placeholder kortelės disabled (`bc--soon` + "Netrukus" badge, aria-disabled), 3 realūs post'ai aktyvūs (2026-05-10 blog-dark-tier-sync) |
| `brief.html` | 🟢 LIVE premium dark tier + consent | 4 sek × **60 klausimų** (pridėtas privacy_consent checkbox kaip 60-tas), konditional logika sveikatos vs verslo, multi-step progress, validation, 3 states; **2026-05-12 dark tier redesign**: glass card `rgba(12,26,46,.55)` + backdrop-blur 20px + cyan glowing kicker + Hanken Grotesk (s27, buvo Syne) + dark glass inputs + cyan gradient buttons + consent kortelė su cyan glowing checkmark; privacy_consent privalomas prieš submit (Norėdami pateikti klausimyną, turite sutikti...); **carry-over**: inline `<style>` ~330 lines head'e laukia extract'o į `assets/css/brief.css`; mobile 4-sek click-through realus flow netesttuotas (tik state injection) |
| `blog/template.html` | 🟢 v2 (post-polish) | 24 placeholder'iai, polished CSS, a11y, 4 schema slotai (2026-05-10); footer © 2026 (2026-05-12) |
| `blog/bdar-baudos-lietuvoje.html` | 🟢 PUBLISHED | Pillar 2846ž., audit health 19/20, 4 schemas, 3 SVG (2026-05-10); footer © 2026 (2026-05-12 hotfix) |
| `blog/nis2-direktyva-lietuvoje.html` | 🟢 PUBLISHED | Pillar 3700ž., audit 19/20 self / 17/20 frontend, 5 schemas, 3 SVG, Author Justinas (2026-05-10); footer © 2026 (2026-05-12 hotfix) |
| `blog/phishing-mokymai-darbuotojams.html` | 🟢 PUBLISHED | Pillar 3100ž., audit 19/20 self / 17/20 frontend, 5 schemas, 3 SVG, 6 ext šaltiniai (2026-05-10); footer © 2026 (2026-05-12 hotfix) |
| `blog/dpo-funkcija-vadovas.html` | 🟢 PUBLISHED (2026-05-12 dpo-pillar-publish, `bc481ea`) | Pillar 2979ž., primary KW "duomenų apsaugos pareigūnas" (480/mo P0), author Marina, 8 H2 + 12 FAQ + HowTo 5 steps, 4 schemas (BlogPosting+Breadcrumb+FAQPage+HowTo), pre-publish 4-agent ratas: frontend 16/20 + SEO 15/20 + QA 18/20 + marketing 15/20 → 12 P0/P1 fix'ai pritaikyti; post-deploy 4-agent verifikacija: PRODUCTION_VERIFIED + INDEXABLE (su KI-013) + CONVERSION_READY + PRODUCTION_READY. **Carry-over**: KW tankis 2.69×/1000 (kiek žemiau target 3-5), VDAI tankis 35×/2979 (over-optimization risk), hero SVG placeholder (KI-012). 3 CTA chain, pricing transparency 6-18k vs 35-60k €/m, testimonial Rasa J. |
| `blog/bdar-6-straipsnis-teiseto-tvarkymo-pagrindai.html` | 🟢 PUBLISHED (2026-05-12 bdar-6-pillar-publish, `9bb9a89`) | Pillar 3060ž., primary KW `bdar 6 straipsnis` (info+law intent, 4.7×/1000), author Marina, 8 H2 + 12 FAQ + HowTo 5 steps, 4 schemas (BlogPosting+Breadcrumb+FAQPage+HowTo), 16 raktažodžių iš keyword bank natūraliai integruoti, pre-publish 4-agent ratas: frontend 15/20 + SEO 18/20 INDEXABLE + QA 16/20 + marketing 14/20 → 12 P0/P1 fix'ai pritaikyti (gramatika 4×, NIS2 datos prieštaravimas, ADTAĮ data, mid+final CTA copy, testimonial reposition, aria-hidden 12×, BDAR principai exact frazė pridėta). 2 CTA (mid + final), pricing transparency netaikoma (BDAR auditas), testimonial Tomas K. **Carry-over**: hero SVG placeholder (KI-012 — 2-oji sesija), post-deploy 4-agent verifikacija praleista, KW tankis `bdar duomenų tvarkymas` 1× (target 2-3), Google rich-results test neatliktas. |
| `blog/registru-centro-duomenu-nutekejimas-2026.html` | 🟢 PUBLISHED HOT NEWS (2026-05-27 rc-nutekejimo-blog-post, `966d666`) | News pillar ~2400ž., primary KW "Registrų centro duomenų nutekėjimas" (hot news, peak 1-2 sav.), 2× Person authors (Marina + Justinas), 6 H2 + 12 FAQ + custom timeline komponentas, 2 schemas (NewsArticle+Breadcrumb+FAQPage), 7 inline citations + 7 šaltinių sąrašas (LRT, 15min, VDAI). Pre-publish 2-agent ratas: frontend (NEEDS WORK → FIXED 4 P1: inline CSS → `.status-stolen` klasė, `.table-wrap` overflow, `.callout-red` kontrasto WCAG AA, `<section rel>` aria-label, 12× rel="noopener noreferrer") + SEO (FIX FIRST → 2/3 FIXED: ISO 8601 datePublished, FAQ schema↔HTML sync, Person authors, definition 74→58 ž.). Hero SVG dedicated 1200×630 (`rc-nutekejimo-hero.svg`, page-builder agent). Custom `.bc-hot-badge` raudonas "Aktualu" badge blog index'e PIRMOJE vietoje. **Carry-over**: og:image SVG (sisteminis Veriva pattern, ne RC straipsnio specifika), straipsnis nr. 4 verslo atsakomybės cikle planuojamas, internal link į DPO pillarą verslo CTA neprid. |
| `paslaugos.html` | ⬜ Nesukurtas | |
| `apie.html` | ⬜ Nesukurtas | |
| `kainos.html` | ⬜ Nesukurtas | |
| `kontaktai.html` | ⬜ Nesukurtas | |
| `privatumas.html` | 🟢 LIVE | 10 skyrių BDAR Privacy Policy (454 lines): duomenų valdytojas, renkami duomenys (kontakto forma, brief.html, susirašinėjimas, techniniai), tikslai+pagrindas (lentelė), saugojimo terminai, sub-processors lentelė (Vercel/Resend/Cookiebot/Hostinger/Zoho), perdavimas už ES (SCC), 8 BDAR teisės, slapukų sutikimo CTA, VDAI skundai (2026-05-10) |
| `slapukai.html` | 🟢 LIVE | 9-skyrių BDAR-compliant politika + Cookiebot CookieDeclaration script + `Cookiebot.renew()` mygtukas (2026-05-10) |
| `404.html` | ⬜ Nesukurtas | |
| `bdar-auditas.html` | 🟢 LIVE (2026-06-08 s24, `5f004d0`) | **BDAR audito wizard** — 42 klausimai / 8 sekcijos, single/multi/open, step-by-step + progress bar, Veriva dark tier brand, mobile-first, a11y (role=alert, focus-visible, fieldset/group, progressbar ARIA). 3 consent checkbox (privatumo* + naujienlaiškiai + rinkodara). Hero mygtukas index.html → /bdar-auditas (balta rėmelis). Duomenys: `assets/js/bdar-questions-data.js` (frontui, be balų) sync su `lib/bdar-questions.ts` (serveriui, su balais). CSS `assets/css/pages/bdar-auditas.css`. Cache-buster v=20260608a. |

## SEO ENGINE — AUTO-GENERATED `seo/*` PUSLAPIAI

**Šaltinis**: `riko8825/SEO-Claude-code` repo (atskiras, NE Veriva-geras). Cron `Weekly SEO Generation` 06/12/18 UTC daily, 1 page/run. Auto-deploy commits į Veriva-geras `seo/` per `Empirra SEO Bot`. Detalės: `memory/reference_seo_engine.md`.

| Puslapis | Statusas | Šaltinis |
|---|---|---|
| `seo/bdar-6-straipsnis/` | 🟢 LIVE | s20 prior (ankstesni SEO Bot runs) |
| `seo/bdar-baudos/` | 🟢 LIVE | s20 prior |
| `seo/bdar-auditas-lietuvoje/` | 🟢 LIVE | s20 prior |
| `seo/bdar-baudu-dydziai/` | 🟢 LIVE | s20 prior |
| `seo/bdar-buhalterijoms/` | 🟢 LIVE | s20 prior |
| `seo/bdar-e-parduotuvei/` | 🟢 LIVE | s20 prior |
| `seo/bdar-klinikoms-lietuvoje/` | 🟢 LIVE | s20 prior |
| `seo/bdar-konsultacija-vilniuje/` | 🟢 LIVE | s20 prior |
| `seo/dpo-paslaugos/` | 🟢 LIVE | s20 prior |
| `seo/nacionalinio-kibernetinio-saugumo-centro-mokymai/` | 🟢 LIVE | s20 prior |
| `seo/nis2-kam-taikoma/` | 🟢 LIVE | s20 prior |
| `seo/privatumo-politika-svetainei/` | 🟢 LIVE | s20 prior |
| `seo/duomenu-apsaugos-pareigunas/` | 🟢 LIVE NEW (2026-05-23, iter 3) | s20 |
| `seo/duomenu-apsaugos-pareiguno-paslaugos-bvpz/` | 🟢 LIVE NEW (2026-05-23, iter 4) | s20 |
| `seo/nis2-atitiktis/` | 🟢 LIVE NEW (2026-05-23, iter 5) | s20 |
| `seo/nis2-direktyva-kam-taikoma/` | 🟢 LIVE NEW (2026-05-23, iter 6) | s20 |
| `seo/nis2-reikalavimai/` | 🟢 LIVE NEW (2026-05-23, iter 7) | s20 |
| `seo/kibernetinio-saugumo-mokymai/` | 🟢 LIVE (post-s20 SEO Bot) | s21 rebase merge |
| `seo/tis2-istatymas/` | 🟢 LIVE (post-s20 SEO Bot) | s21 rebase merge |
| `seo/valdymo-sistemos-kibernetinio-saugumo-auditas/` | 🟢 LIVE (post-s20 SEO Bot) | s21 rebase merge |
| `seo/duomenu-tvarkymo-sutartis/` | 🟢 LIVE (2026-05-26 SEO Bot) | s22 rebase merge |
| `seo/informacijos-saugumo-politika/` | 🟢 LIVE (2026-05-26 SEO Bot) | s22 rebase merge |
| `seo/sutikimas-tvarkyti-asmens-duomenis/` | 🟢 LIVE (2026-05-27 SEO Bot) | s22 rebase merge |

**Indeksavimo strategija (s25, 2026-06-09 gsc-indexing-fix)**:
- **38 seo puslapiai „crawled, currently not indexed"** GSC'e → priežastis: naujas domenas + 38 panašūs puslapiai per 3 sav. → crawl budget taupymas (NE techninė klaida; tag'ai teisingi).
- **noindex 17 thin/dublikatų** (`91b6323`): ~1550-1820ž. puslapiai → `noindex,follow` + išimti iš sitemap (49→32 URL). Strategija kokybė>kiekis: koncentruoti crawl trust 21 stipriam (3000ž.). Link equity teka per follow.
- **noindex'inti**: valdymo-sistemos-kibernetinio-saugumo-auditas, internal-gdpr-documentation, kibernetinio-saugumo-istatymas-aktuali-redakcija/e-tar, duomenu-perdavimo-tinklo-prieziura, apple-irenginiu-valdymo-mokymai, nacionalinio-kibernetinio-saugumo-centro-mokymai, ivairoves-ir-itraukties-politika, informacijos-saugumo-politika, public-it-technologiju-proverzis-ir-saugumas, kibernetines-higienos-mokymai, bdar-paslaugos-mon-ms, duomenu-privatumo-politika, bdar-dokumentai-monei, bdar-paslaugos-verslui, duomenu-apsaugos-pareiguno-paslaugos-bvpz, nis2-atitiktis.
- **UTF-8 mojibake fix** (`4aa217f`): bdar-dokumentai-monei + bdar-paslaugos-mon-ms H1/breadcrumb „ä¯monei"→„įmonei" (double-encoded `į`, generator pipeline bug).
- **Generator carry-over (SEO-Claude-code)**: (a) encoding validacija prieš deploy, (b) uždrausti šabloną „Sužinokite, kaip…" meta desc (33/38), (c) nepublikuoti masiškai (5-8/sav. max).
- **noindex grąžinimas**: po 4-8 sav., jei 21 stiprus indeksuojasi — nuimti palaipsniui.

**SEO engine fixes 2026-05-23 (s20, riko8825/SEO-Claude-code main)**:
1. `a7b09b4` — `src/validator/checks_content.py`: `_check_faq` skaičiavo TIK `<details>`, veriva chrome naudoja `.faq-item` → 100% LT runs HARD_BLOCK. Fix: `max(details_count, faq_item_count)`
2. `e7f7489` — `templates/_chrome_veriva.html:159`: CSS komentaras "empirra chrome animates" → multi-client leakage scan exit 3. Fix: `empirra` → `default`
3. `673401e` — `scripts/deploy_veriva.py`: empty batch (validator rejected ARBA cannibalization loser) → exit 1 → false workflow failure. Fix: distinguish empty DB vs no-op

## BACKEND STATUSAS

| Endpoint | Statusas | Funkcija |
|---|---|---|
| `POST /api/forms/contact` | 🟡 Sukurtas, neištestuotas (Edge, bet TODO insert/email) | Kontakto formos lead capture |
| `POST /api/forms/audit-request` | ⬜ Nesukurtas (failas yra, bet 404 + greičiausiai ESM crash kaip kiti Node) | BDAR audito užklausa |
| `POST /api/forms/bdar-audit` | 🟢 **LIVE Production** (2026-06-08 s24, Edge) | **BDAR audito klausimynas** — validate(honeypot+origin+rate-limit+consent) → scoreAnswers() → runPrompt() AI išvada (gpt-4.1) → Supabase `bdar_audit_responses` insert + newsletter upsert → Resend email klientui + Veriva. E2E patikrinta production. Rate limit 3/min per IP (KI-014: per-isolate). |
| `POST /api/forms/newsletter` | 🟡 Dalinai (per bdar-audit consent → newsletter_subscribers upsert) | Newsletter prenumerata (blog.html naudoja — atskiras endpoint dar nesukurtas) |
| `GET /api/internal/health` | 🟢 LIVE 200 OK | Health check. s23 (`6e591f9`): pridėtas rewrite `/api/internal/health`→`.ts` (Vercel @vercel/node reikalauja explicit rewrite). GitHub Actions Health Check workflow → success. Env flags: supabase_url/key ✅, resend_key ✅, resend_from ⬜ |
| `POST /api/automations/blog-gen` | 🟡 DEPLOYED (553 lines), RUNTIME BLOCKED | Cron blog post generation: topics.json → AI (OpenAI gpt-4.1) → 10 validators → template injection → GitHub draft branch → Telegram notification (Publikuoti/Taisyti/Praleisti). DEPLOYED su `f2f2cdb`, bet runtime laukia 5 Sensitive env vars + Telegram bot + Supabase migration. Cron'as 2026-05-12 10:00 LT crash'ins. |
| `POST /api/automations/telegram-webhook` | 🟡 DEPLOYED (319 lines), RUNTIME BLOCKED | Telegram callback handler: P → blog-approve, R → save Supabase state + ask text reply, S → delete branch + topics.status=skipped. DEPLOYED, bet Supabase `veriva_telegram_revise_state` lentelė neegzistuoja. |
| `POST /api/automations/blog-approve` | 🟡 DEPLOYED (406 lines), RUNTIME BLOCKED | Publish flow: addBlogCardToGrid (.bp-grid) + linkInternal forward+reverse + updateSitemap + topics.status=published + mergeBranchToMain + deleteBranch + Telegram confirmation. DEPLOYED, bet `GITHUB_TOKEN` env var laukia. |

## INTEGRACIJOS

| Servisas | Statusas | Tikslas |
|---|---|---|
| Vercel | 🟢 Production LIVE | Hosting active, build #2 (`6974806`) READY 27s, 10 URL 200 OK, domain'ai (veriva.lt + www.veriva.lt) attached, apex SSL pending |
| Hostinger DNS | 🟢 Migrated | A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com; Zoho email DNS (DKIM/SPF/MX×3) išsaugoti |
| Zoho Mail | 🟢 Aktyvus (nepaliesta) | info@veriva.lt — MX/SPF/DKIM/verification record'ai DNS Zone'oje veikia toliau |
| Supabase | 🟢 Production naudojamas (BDAR auditas LIVE) | **Projektas `aqppyvamzdjydnfpgccu` ("Empirra", riko8825's Org) — shared su Veriva** (NE `vaqzleubdim`/riko8825's Project). s24: paleistos `001_init.sql` + `003_bdar_audit.sql` (leads, audit_requests, newsletter_subscribers, bdar_audit_responses). `002_blog_automation.sql` vis dar NEPALEISTA. ⚠️ Vercel SUPABASE_URL=`aqppyvamzdjydr...` |
| Resend | 🟢 Production LIVE | **veriva.lt domenas VERIFIED** (s24, DKIM+SPF+MX Hostinger). RESEND_FROM_EMAIL=RESEND_NOTIFY_EMAIL=`info@veriva.lt`. Email klientui + Veriva notif veikia (BDAR auditas). Raktas atnaujintas (buvo iš kitos paskyros). |
| OpenAI | 🟢 Production LIVE (BDAR auditas naudoja) | gpt-4.1 — BDAR išvada (~11s, $0.01-0.02/audit) + blog generavimui. OPENAI_API_KEY Vercel'yje veikia. |
| Pexels | 🔴 API key NEPUSH'INTAS (Sensitive flag — laukia rankinio pateikimo) | Hero images blog post'ams (LT→EN query translation map sukurtas lib/pexels.ts) |
| GitHub API | 🔴 GITHUB_TOKEN NEPUSH'INTAS (Sensitive flag — laukia rankinio pateikimo) | Branch create/commit/merge per blog automation pipeline, repo `riko8825/Veriva-geras` |
| Telegram bot | 🔴 NESUKURTAS — vartotojas turi sukurti `@VerivaBlogBot` per @BotFather (atskiras nuo Empirra) | Blog draft approve flow su 3 inline buttons (Publikuoti/Taisyti/Praleisti) |
| GA4 + GTM | ⬜ | Analytics |
| Cookiebot | 🟢 LIVE + rescan'inta + force LT | CMP auto-blocking, CBID `bc31b2c9-a2b7-44e8-a3a2-624b027ba646`, įdiegtas **9 HTML failuose** su `data-user-country="LT"` override (force GDPR scope visiems regionams, ne tik ES — Free planas neturi dashboard toggle). Rescan'as 2026-05-11 14:26 UTC: 1 slapukas (`CookieConsent` Necessary), seni WP markeriai išvalyti. Headless puppeteer verify (4 URL): dialog `#CybotCookiebotDialog` `display:flex`, `userCountry:LT`, `gdprApplies:true`, CookieDeclaration lentelė renderinasi DOM'e `/slapukai` puslapyje |

## SEO / CONTENT

| Element | Statusas |
|---|---|
| Meta tags (kiekvienas puslapis) | 🟢 index.html + blog.html + blog/template.html + bdar-baudos-lietuvoje.html |
| `robots.txt` | 🟡 Sukurtas, neverifikuotas production'e |
| `sitemap.xml` | 🟢 Atnaujinta su blog post URL + `<image:image>` namespace (2026-05-10) |
| Schema.org (ProfessionalService + GEO/LocalBusiness) | 🟢 index.html — 21 laukai (geo coords, addressRegion, areaServed, taxID, contactPoint) |
| Schema.org (FAQPage 12 Q&A) | 🟢 index.html (Veriva home FAQ) |
| Schema.org (BlogPosting + BreadcrumbList + FAQPage + HowTo + Review) | 🟢 3 postai (BDAR + NIS2 + Phishing) — visi turi 5 schemas |
| OG images | 🟢 3 SVG hero (1200×630): bdar-baudos, nis2-direktyva, phishing-mokymai. Standartas: `/assets/img/blog/{slug}-hero.svg` |
| GEO meta (geo.region, geo.position, ICBM) | 🟢 index.html — Vilnius, LT-VL, 54.6800;25.2643 |
| Blog content rules | 🟢 `docs/blog-content-rules.md` (atnaujinta — author'ių sistema) |
| Blog keyword bank (LT) | 🟢 `docs/blog-keywords.md` — 8 pillar + 30+ cluster |
| Blog system prompt (Claude API) | 🟢 `docs/blog-system-prompt.md` (atnaujinta su naujais komponentais 2026-05-10) |
| Realūs blog post'ai | 🟢 3 PUBLISHED (BDAR + NIS2 + Phishing) — placeholder linkai liko 3/6 (KI-001) |

## SAUGUMAS

| Element | Statusas |
|---|---|
| Privacy Policy (BDAR) | ⬜ Privaloma — `privatumas.html` nesukurtas |
| Cookie Policy | 🟢 LIVE — `slapukai.html` (Cookiebot CMP + 9-skyrių politika, 2026-05-10) |
| RLS politikos Supabase | ⬜ |
| `x-api-key` ant webhook'ų | ⬜ |
| Rate limiting | ⬜ |
| HTTPS + HSTS | ⬜ Vercel default |

## KNOWN ISSUES

Visi išsamiai dokumentuoti `KNOWN_ISSUES.md` (KI-001..KI-010):
- **KI-005 🟠 High (partial fix 2026-05-10)**: `slapukai.html` ✅ LIVE su Cookiebot CMP. Liko `privatumas.html` (Privacy Policy — BDAR privaloma)
- **KI-008 🟠 High**: Supabase project'as nesetup'intas, migrations neištaisytos
- **KI-001 🟡 Medium (partial fix 2026-05-10)**: 3 placeholder kortelės (DPO, Incidentai, Mokymai) DISABLED su "Netrukus" badge (`<a href>` → `<div>`, aria-disabled, opacity .55, no hover) — 404 link'ai pašalinti, bet realūs post'ai dar nesukurti
- **KI-002 🟠 High**: `blog.html:467` newsletter forma — tik `alert()`, duomenys prarandami
- **KI-007 🟠 High**: API endpoint'ai (`contact.ts`, `health.ts`) niekada nepaleisti production'e
- **KI-009 🟡 Medium**: 8 P1 audit fixes nepatraukti naujuose blog postuose
- ~~**KI-011 ✅ FIXED**~~ (2026-05-10): apex SSL auto-issued ~1.5h after DNS migration
- ~~**KI-003 ✅ FIXED**~~ (2026-05-10): sitemap.xml su blog post URL + image:image namespace
- ~~**KI-004 ✅ FIXED**~~ (2026-05-10): index.html split → assets/css/index.css + assets/js/index.js (-43% lines)
- ~~**KI-006 ✅ FIXED**~~ (2026-05-10): blog naršyklėje 200 OK
- ~~**KI-010 ✅ FIXED**~~ (2026-05-10): live veriva.lt patvirtinta po DNS migration (10 URL 200 OK)

## PRIORITETAI

1. **P0**: Cookiebot dashboard config — kalba LT, domeno whitelisting (veriva.lt + www.veriva.lt), GCM (kai bus GA4)
2. **P0**: Test email į `info@veriva.lt` (Zoho) — patvirtinti DNS migration nesulaužė email'o
3. **P0**: Sukurti `privatumas.html` (BDAR Privacy Policy — KI-005 likęs blocker)
4. **P0**: Google Search Console — add property, submit sitemap, request indexing 3 blog URL'us
5. **P0**: Multi-page skeletons (paslaugos, apie, kainos, kontaktai, 404)
6. **P0**: Vercel/Supabase/Resend backend setup (KI-007, KI-008) + contact endpoint smoke test
7. **P0**: Aktyvuoti `health-check.yml` workflow — pridėti `HEALTH_SECRET` GitHub Secrets
8. **P1**: Sukurti likusius 3/6 blog post'us (KI-001 — placeholder linkai 404)
9. **P1**: Newsletter endpoint (KI-002)
10. **P1**: P1 batch fixes blog postams (KI-009): `<time datetime>`, keyword density dilution, TL;DR, cross-link, FAQ IIFE
11. **P1**: WordPress hosting cancellation (po 7d stabilumo)
12. **P2**: Blog-gen automation (`api/internal/blog-gen.ts`) — docs paruošti, kodas dar ne
13. **P2**: ~~KI-004 index.html split~~ ✅ 2026-05-10 (CSS+JS extract'inta į /assets, -43% lines)
14. **P2**: ~~KI-010 Vercel deploy fix + DNS migration~~ ✅ 2026-05-10 (PRODUCTION LIVE)
15. **P2**: ~~Empirra parity~~ ✅ 2026-05-09
16. **P2**: ~~Blog struktūra~~ ✅ 2026-05-09
17. **P2**: ~~SEO foundation~~ 🟢
18. **P2**: ~~3 pillar postai~~ ✅ 2026-05-10
