# PROJECT_STATUS — Veriva

**Pradžia**: 2026-05-09
**Paskutinis update**: 2026-05-10 (nis2-phishing-publish)
**Statusas**: 🟢 First deploy — 3 pillar postai live (BDAR + NIS2 + Phishing), Vercel auto-deploy iš `d9cc6e7`
**Production URL**: https://veriva.lt (live, deploy nepatvirtintas naršyklėje šios sesijos pabaigoje)

---

## PUSLAPIŲ STATUSAS

| Puslapis | Statusas | Pastabos |
|---|---|---|
| `index.html` | 🟢 Yra + FAQ 12Q (SEO/GEO) + blog teaser | Monolitas; reikia išskirstyti CSS/JS (KI-004); FAQPage + ProfessionalService schema (2026-05-09) |
| `blog.html` | 🟢 Sukurtas | Listing + filtrai + newsletter CTA; pirma kortelė rodo realų postą (2026-05-10) |
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
| Vercel | 🟡 Auto-deploy active | Hosting + Edge Functions (3 commits push'inti, build status nepatvirtintas) |
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

Visi išsamiai dokumentuoti `KNOWN_ISSUES.md` (KI-001..KI-008):
- **KI-005 🔴 Critical**: privatumas.html + slapukai.html neegzistuoja (BDAR teisinis pažeidimas)
- **KI-008 🔴 Critical (kai bus deploy)**: Supabase migrations neištaisytos production'e (Supabase project gali būti dar nesetup'intas)
- **KI-001 🟠 High**: 3/6 placeholder blog kortelės → 404 (3 patvarkyti: bdar-baudos-lietuvoje, nis2-direktyva-lietuvoje, phishing-mokymai-darbuotojams)
- **KI-002 🟠 High**: `blog.html:467` newsletter forma — tik `alert()`, duomenys prarandami
- ~~**KI-006 🟠 High**: blog teaser/listing/template nepatikrinti naršyklėje~~ ✅ Patikrinta 2026-05-10 (live test 200 OK)
- **KI-007 🟠 High**: API endpoint'ai (`contact.ts`, `health.ts`) niekada nepaleisti
- ~~**KI-003 🟡 Medium**: `sitemap.xml` neapima blog URL'ų~~ ✅ Atnaujinta 2026-05-10 (image:image namespace)
- **KI-004 🟡 Medium**: `index.html` ~1700 eil. monolitas (CSS + JS inline)

## PRIORITETAI

1. **P0**: Live veriva.lt verifikacija po pirmo push (commit `d9cc6e7`) — Schema Rich Results, PageSpeed, 3 blog URL'ai 200 OK
2. **P0**: Sukurti privatumas.html + slapukai.html (BDAR privaloma — KI-005)
3. **P0**: Vercel/Supabase/Resend setup + first deploy + contact endpoint smoke test (KI-007, KI-008)
4. **P0**: Aktyvuoti `health-check.yml` workflow — pridėti `HEALTH_SECRET` GitHub Secrets
5. **P0**: Išskirstyti `index.html` CSS/JS į atskirus failus (KI-004)
6. **P1**: Multi-page skeletons (paslaugos, apie, kainos, kontaktai, 404)
7. **P1**: Sukurti likusius 5/6 blog post'us (KI-001 — placeholder linkai vis dar veikia į 404)
8. **P1**: Newsletter endpoint (KI-002)
9. **P1**: Po deploy — Google Search Console: submit sitemap + request indexing pirmajam postui
10. **P2**: Blog-gen automation (`api/internal/blog-gen.ts`) — docs paruošti, kodas dar ne
11. **P2**: ~~Empirra parity (docs/root files/.claude/.github)~~ ✅ 2026-05-09 (`93cf7b7`)
12. **P2**: ~~Blog struktūra~~ ✅ 2026-05-09 (teaser + listing + template v2 polished)
13. **P2**: ~~SEO foundation~~ 🟢 (robots/sitemap + image schema + GEO meta + index FAQPage)
14. **P2**: ~~Pirmas pillar postas~~ ✅ 2026-05-10 (BDAR baudos Lietuvoje, audit 19/20)
