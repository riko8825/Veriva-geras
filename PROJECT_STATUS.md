# PROJECT_STATUS — Veriva

**Pradžia**: 2026-05-09
**Paskutinis update**: 2026-05-10 (vercel-migration)
**Statusas**: 🟢 PRODUCTION LIVE — DNS migration WP→Vercel ✅, 10 URL 200 OK ant www.veriva.lt, apex SSL pending
**Production URL**: https://www.veriva.lt (LIVE su Vercel SSL) | https://veriva.lt (apex 307 → www, SSL dar laukia)

---

## PUSLAPIŲ STATUSAS

| Puslapis | Statusas | Pastabos |
|---|---|---|
| `index.html` | 🟢 LIVE + KI-004 split done | 1127 lines (was 1995, -43%); CSS+JS extract'inta į /assets; FAQ 2 cols, plain email, BDAR widget realūs duomenys, brief.html link (2026-05-10) |
| `assets/css/index.css` | 🟢 NEW | 590 lines, 32K — pagrindinis CSS + slideUp keyframe (2026-05-10) |
| `assets/js/index.js` | 🟢 NEW | 276 lines, 11K — widget logic, FAQ, modals, cookie banner (2026-05-10) |
| `blog.html` | 🟢 LIVE + nav parity | Listing + filtrai + newsletter CTA; nav 8 punktų sync su index.html (`position:fixed`, mobile 900px breakpoint) |
| `brief.html` | 🟢 NEW + LIVE | 4 sekcijos × 59 klausimai, konditional logika sveikatos vs verslo, multi-step progress, validation, 3 states (2026-05-10) |
| `blog/template.html` | 🟢 v2 (post-polish) | 24 placeholder'iai, polished CSS, a11y, 4 schema slotai (2026-05-10) |
| `blog/bdar-baudos-lietuvoje.html` | 🟢 PUBLISHED | Pillar 2846ž., audit health 19/20, 4 schemas, 3 SVG (2026-05-10) |
| `blog/nis2-direktyva-lietuvoje.html` | 🟢 PUBLISHED | Pillar 3700ž., audit 19/20 self / 17/20 frontend, 5 schemas, 3 SVG, Author Justinas (2026-05-10) |
| `blog/phishing-mokymai-darbuotojams.html` | 🟢 PUBLISHED | Pillar 3100ž., audit 19/20 self / 17/20 frontend, 5 schemas, 3 SVG, 6 ext šaltiniai (2026-05-10) |
| `paslaugos.html` | ⬜ Nesukurtas | |
| `apie.html` | ⬜ Nesukurtas | |
| `kainos.html` | ⬜ Nesukurtas | |
| `kontaktai.html` | ⬜ Nesukurtas | |
| `privatumas.html` | ⬜ Nesukurtas | BDAR privaloma |
| `slapukai.html` | ⬜ Nesukurtas | BDAR privaloma |
| `404.html` | ⬜ Nesukurtas | |

## BACKEND STATUSAS

| Endpoint | Statusas | Funkcija |
|---|---|---|
| `POST /api/forms/contact` | 🟡 Sukurtas, neištestuotas | Kontakto formos lead capture |
| `POST /api/forms/audit-request` | ⬜ Nesukurtas | BDAR audito užklausa |
| `POST /api/forms/newsletter` | ⬜ Nesukurtas | Newsletter prenumerata (blog.html naudoja) |
| `GET /api/internal/health` | 🟡 Sukurtas, neištestuotas | Health check |
| `POST /api/internal/blog-gen` | ⬜ Nesukurtas | Claude API blog generavimas (docs paruošti) |
| `POST /api/internal/blog-publish` | ⬜ Nesukurtas | Write į `/blog/{slug}.html` + sitemap update |

## INTEGRACIJOS

| Servisas | Statusas | Tikslas |
|---|---|---|
| Vercel | 🟢 Production LIVE | Hosting active, build #2 (`6974806`) READY 27s, 10 URL 200 OK, domain'ai (veriva.lt + www.veriva.lt) attached, apex SSL pending |
| Hostinger DNS | 🟢 Migrated | A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com; Zoho email DNS (DKIM/SPF/MX×3) išsaugoti |
| Zoho Mail | 🟢 Aktyvus (nepaliesta) | info@veriva.lt — MX/SPF/DKIM/verification record'ai DNS Zone'oje veikia toliau |
| Supabase | ⬜ | Leads DB |
| Resend | ⬜ | Email notifications |
| GA4 + GTM | ⬜ | Analytics |
| Cookiebot | ⬜ | Consent management |

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
| Privacy Policy (BDAR) | ⬜ Privaloma |
| Cookie Policy | ⬜ Privaloma |
| RLS politikos Supabase | ⬜ |
| `x-api-key` ant webhook'ų | ⬜ |
| Rate limiting | ⬜ |
| HTTPS + HSTS | ⬜ Vercel default |

## KNOWN ISSUES

Visi išsamiai dokumentuoti `KNOWN_ISSUES.md` (KI-001..KI-010):
- **KI-005 🔴 Critical**: privatumas.html + slapukai.html neegzistuoja (BDAR teisinis pažeidimas) — svetainė LIVE be jų
- **KI-008 🟠 High**: Supabase project'as nesetup'intas, migrations neištaisytos
- **KI-001 🟠 High**: 3/6 placeholder blog kortelės → 404 (3 padaryta: bdar-baudos-lietuvoje, nis2-direktyva-lietuvoje, phishing-mokymai-darbuotojams)
- **KI-002 🟠 High**: `blog.html:467` newsletter forma — tik `alert()`, duomenys prarandami
- **KI-007 🟠 High**: API endpoint'ai (`contact.ts`, `health.ts`) niekada nepaleisti production'e
- **KI-009 🟡 Medium**: 8 P1 audit fixes nepatraukti naujuose blog postuose
- **KI-011 🟡 Medium (NEW)**: apex SSL sertifikatas (`https://veriva.lt/`) dar neissued — `www.veriva.lt` veikia, apex 307→www
- ~~**KI-003 ✅ FIXED**~~ (2026-05-10): sitemap.xml su blog post URL + image:image namespace
- ~~**KI-004 ✅ FIXED**~~ (2026-05-10): index.html split → assets/css/index.css + assets/js/index.js (-43% lines)
- ~~**KI-006 ✅ FIXED**~~ (2026-05-10): blog naršyklėje 200 OK
- ~~**KI-010 ✅ FIXED**~~ (2026-05-10): live veriva.lt patvirtinta po DNS migration (10 URL 200 OK)

## PRIORITETAI

1. **P0**: Apex SSL + naršyklės verifikacija — `https://veriva.lt/` (be www) atsidaro be SSL warning'o, FAQ 2 cols veikia, brief.html progress bar, BDAR widget realūs duomenys
2. **P0**: Test email į `info@veriva.lt` (Zoho) — patvirtinti DNS migration nesulaužė email'o
3. **P0**: Sukurti `privatumas.html` + `slapukai.html` (BDAR privaloma — KI-005)
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
