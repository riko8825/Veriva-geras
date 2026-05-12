# PROJECT_STATUS — Veriva

**Pradžia**: 2026-05-09
**Paskutinis update**: 2026-05-12 (cookiebot-brief-dark-tier-consent)
**Statusas**: 🟢 DEPLOYED frontend (hero + brief.html dark tier + Cookiebot LT force + consent checkbox live), 🟡 blog automation RUNTIME blocked — 5 Sensitive env vars + Telegram bot + Supabase migration laukia vartotojo input'o; cron'as 2026-05-12 10:00 LT **JAU PRABĖGO** be paleidimo
**Production URL**: https://www.veriva.lt (LIVE su Vercel SSL) | https://veriva.lt (apex SSL ✅)
**Paskutinis commit**: `a467b9c` (docs: s15 status + INC-002 postmortem, 2026-05-12)

---

## PUSLAPIŲ STATUSAS

| Puslapis | Statusas | Pastabos |
|---|---|---|
| `index.html` | 🟢 LIVE hero polish + .h-bottom 96px (2026-05-12, `a467b9c`) | Hero + quiz section live'e su brand-adapted stack (`--ink/--cyan/--gold` + Plus Jakarta Sans + Syne 800 + JetBrains Mono); ticker BALTAS tekstas (rgba(255,255,255,.85)) + canvas particles + GSAP timeline + magnetic CTA + glass quiz card; brief.html link hero secondary CTA outlined button (cyan border, 13px); `.h-bottom margin-bottom: 96px desktop / 64px mobile` (s16 pakeltas iš 64/40); nav padding 128px desktop / 108px mobile; `#hero overflow: clip` + min-height 780/700; Cookiebot script su `data-user-country="LT"` override; **inline `<style>` ~340 lines head'e** (vis dar laukia perkėlimo į index.css); custom cursor `#cur` dead element + cursor JS listener'iai dead code |
| `assets/css/index.css` | 🟡 LIVE 2571 lines + ~150 lines dead CSS | Po hero rewrite: `.widget`, `.w-*`, `.wpd*`, `.wbd*`, `.proof-strip`, `.ps-*`, sena `.hero-w/.hero-eyebrow/.hero-trust` (eil. 55-225) nebenaudojamos. Dead CSS cleanup laukia kitos sesijos. |
| `assets/js/index.js` | 🟡 LIVE ~16KB + dead cursor listener'iai | Po hero rewrite: widget logika adaptuota naujam markup'ui (`buildProgress` progress bar, `renderQ` `.qc-opt`, `pick` `#w-opts .qc-opt`, `showResult` `.qcr-bd-row`); pridėtas hero JS blokas (~110 lines: canvas particles + GSAP timeline + magnetic CTA + custom cursor handler); custom cursor JS listener'iai (~30 lines) liko nors `#cur` `display:none` |
| `blog.html` | 🟢 LIVE premium dark tier | Visa puslapio dark theme (buvo light); hero radial mesh + mono kicker + cyan dot + Syne 800; filterai dark glass + cyan accent; post kortelės `.post`-style premium card su `:has()` sibling dim + grid mask visual; newsletter cyan CTA + glass card; 3 placeholder kortelės disabled (`bc--soon` + "Netrukus" badge, aria-disabled), 3 realūs post'ai aktyvūs (2026-05-10 blog-dark-tier-sync) |
| `brief.html` | 🟢 LIVE premium dark tier + consent | 4 sek × **60 klausimų** (pridėtas privacy_consent checkbox kaip 60-tas), konditional logika sveikatos vs verslo, multi-step progress, validation, 3 states; **2026-05-12 dark tier redesign**: glass card `rgba(12,26,46,.55)` + backdrop-blur 20px + cyan glowing kicker + Syne 800 + dark glass inputs + cyan gradient buttons + consent kortelė su cyan glowing checkmark; privacy_consent privalomas prieš submit (Norėdami pateikti klausimyną, turite sutikti...); **carry-over**: inline `<style>` ~330 lines head'e laukia extract'o į `assets/css/brief.css`; mobile 4-sek click-through realus flow netesttuotas (tik state injection) |
| `blog/template.html` | 🟢 v2 (post-polish) | 24 placeholder'iai, polished CSS, a11y, 4 schema slotai (2026-05-10) |
| `blog/bdar-baudos-lietuvoje.html` | 🟢 PUBLISHED | Pillar 2846ž., audit health 19/20, 4 schemas, 3 SVG (2026-05-10) |
| `blog/nis2-direktyva-lietuvoje.html` | 🟢 PUBLISHED | Pillar 3700ž., audit 19/20 self / 17/20 frontend, 5 schemas, 3 SVG, Author Justinas (2026-05-10) |
| `blog/phishing-mokymai-darbuotojams.html` | 🟢 PUBLISHED | Pillar 3100ž., audit 19/20 self / 17/20 frontend, 5 schemas, 3 SVG, 6 ext šaltiniai (2026-05-10) |
| `paslaugos.html` | ⬜ Nesukurtas | |
| `apie.html` | ⬜ Nesukurtas | |
| `kainos.html` | ⬜ Nesukurtas | |
| `kontaktai.html` | ⬜ Nesukurtas | |
| `privatumas.html` | 🟢 LIVE | 10 skyrių BDAR Privacy Policy (454 lines): duomenų valdytojas, renkami duomenys (kontakto forma, brief.html, susirašinėjimas, techniniai), tikslai+pagrindas (lentelė), saugojimo terminai, sub-processors lentelė (Vercel/Resend/Cookiebot/Hostinger/Zoho), perdavimas už ES (SCC), 8 BDAR teisės, slapukų sutikimo CTA, VDAI skundai (2026-05-10) |
| `slapukai.html` | 🟢 LIVE | 9-skyrių BDAR-compliant politika + Cookiebot CookieDeclaration script + `Cookiebot.renew()` mygtukas (2026-05-10) |
| `404.html` | ⬜ Nesukurtas | |

## BACKEND STATUSAS

| Endpoint | Statusas | Funkcija |
|---|---|---|
| `POST /api/forms/contact` | 🟡 Sukurtas, neištestuotas | Kontakto formos lead capture |
| `POST /api/forms/audit-request` | ⬜ Nesukurtas | BDAR audito užklausa |
| `POST /api/forms/newsletter` | ⬜ Nesukurtas | Newsletter prenumerata (blog.html naudoja) |
| `GET /api/internal/health` | 🟡 Sukurtas, neištestuotas | Health check |
| `POST /api/automations/blog-gen` | 🟡 DEPLOYED (553 lines), RUNTIME BLOCKED | Cron blog post generation: topics.json → AI (OpenAI gpt-4.1) → 10 validators → template injection → GitHub draft branch → Telegram notification (Publikuoti/Taisyti/Praleisti). DEPLOYED su `f2f2cdb`, bet runtime laukia 5 Sensitive env vars + Telegram bot + Supabase migration. Cron'as 2026-05-12 10:00 LT crash'ins. |
| `POST /api/automations/telegram-webhook` | 🟡 DEPLOYED (319 lines), RUNTIME BLOCKED | Telegram callback handler: P → blog-approve, R → save Supabase state + ask text reply, S → delete branch + topics.status=skipped. DEPLOYED, bet Supabase `veriva_telegram_revise_state` lentelė neegzistuoja. |
| `POST /api/automations/blog-approve` | 🟡 DEPLOYED (406 lines), RUNTIME BLOCKED | Publish flow: addBlogCardToGrid (.bp-grid) + linkInternal forward+reverse + updateSitemap + topics.status=published + mergeBranchToMain + deleteBranch + Telegram confirmation. DEPLOYED, bet `GITHUB_TOKEN` env var laukia. |

## INTEGRACIJOS

| Servisas | Statusas | Tikslas |
|---|---|---|
| Vercel | 🟢 Production LIVE | Hosting active, build #2 (`6974806`) READY 27s, 10 URL 200 OK, domain'ai (veriva.lt + www.veriva.lt) attached, apex SSL pending |
| Hostinger DNS | 🟢 Migrated | A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com; Zoho email DNS (DKIM/SPF/MX×3) išsaugoti |
| Zoho Mail | 🟢 Aktyvus (nepaliesta) | info@veriva.lt — MX/SPF/DKIM/verification record'ai DNS Zone'oje veikia toliau |
| Supabase | 🟡 Shared Empirra project (URL pushed to Veriva env), migration 002_blog_automation.sql code-done bet NEPALEISTA | Veriva lenteles atskiria `veriva_*` prefix (veriva_telegram_revise_state, veriva_blog_runs). SERVICE_ROLE_KEY laukia rankinio pateikimo iš Empirra Vercel UI (Sensitive flag) |
| Resend | 🟡 API key pushed į Veriva Vercel | Email notifications (contact form + audit-request) — endpoint'ai dar neištestuoti |
| OpenAI | 🟡 API key pushed (shared with Empirra) | gpt-4.1 blog generavimui, $0.05-0.08/post estimate |
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
