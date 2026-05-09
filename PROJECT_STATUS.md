# PROJECT_STATUS — Veriva

**Pradžia**: 2026-05-09
**Statusas**: 🟡 Inicializacija
**Production URL**: https://veriva.lt (dar nedeploy'inta)

---

## PUSLAPIŲ STATUSAS

| Puslapis | Statusas | Pastabos |
|---|---|---|
| `index.html` | 🟢 Yra + blog teaser | Monolitas (1700+ eil.); reikia išskirstyti CSS/JS |
| `blog.html` | 🟢 Sukurtas | Listing + filtrai + newsletter CTA (2026-05-09) |
| `blog/template.html` | 🟢 Sukurtas | 19 placeholder'ių, paruošta automatizacijai (2026-05-09) |
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
| Vercel | ⬜ | Hosting + Edge Functions |
| Supabase | ⬜ | Leads DB |
| Resend | ⬜ | Email notifications |
| GA4 + GTM | ⬜ | Analytics |
| Cookiebot | ⬜ | Consent management |

## SEO / CONTENT

| Element | Statusas |
|---|---|
| Meta tags (kiekvienas puslapis) | 🟡 index.html + blog.html + blog/template.html turi pilnus |
| `robots.txt` | 🟡 Sukurtas, neverifikuotas production'e |
| `sitemap.xml` | 🟡 Sukurtas, NEAPIMA naujų blog post'ų (auto-update TODO) |
| Schema.org (Organization + LocalBusiness + Service) | 🟡 index.html turi |
| Schema.org (Blog + BlogPosting + FAQPage + BreadcrumbList) | 🟢 blog.html + blog/template.html |
| OG images | ⬜ Reikia 1200×630px assets |
| Blog content rules | 🟢 `docs/blog-content-rules.md` |
| Blog keyword bank (LT) | 🟢 `docs/blog-keywords.md` — 8 pillar + 30+ cluster |
| Blog system prompt (Claude API) | 🟢 `docs/blog-system-prompt.md` |
| Realūs blog post'ai | ⬜ 0/X (placeholder linkai)|

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

- `index.html` 354KB — viskas inline (CSS + JS), reikia išskirstyti
- Nėra dokumentacijos apie esamą turinį (kas yra section'uose)

## PRIORITETAI

1. **P0**: Išskirstyti `index.html` CSS/JS į atskirus failus
2. **P0**: Sukurti privatumas.html + slapukai.html (BDAR privaloma)
3. **P1**: Multi-page skeletons (paslaugos, apie, kainos, kontaktai)
4. **P1**: Kontakto formos backend (smoke test)
5. **P1**: Blog-gen automation (`api/internal/blog-gen.ts`) — docs paruošti, kodas dar ne
6. **P2**: ~~Blog struktūra~~ ✅ 2026-05-09 (teaser + listing + template)
7. **P2**: ~~SEO foundation~~ 🟡 (robots/sitemap yra, OG images dar ne)
