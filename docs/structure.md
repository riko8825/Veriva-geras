# Puslapių struktūra

Detalus kiekvieno puslapio aprašymas — kas yra, kokios sekcijos, kokia paskirtis.

---

## `/` — Pagrindinis (index.html)

**Tikslas**: Pirmas įspūdis. Greitai paaiškinti kas yra Veriva ir kodėl rinktis.

**Sekcijos** (faktinė tvarka pagal index.html):
1. Nav (sticky) + mobile menu
2. Hero (`#top`) — H1 + subhead + 2 CTA + BDAR rizikos testo widget'as
3. Proof strip — 120+ auditų, €0 baudų, 7d., 48h
4. Komanda (`#komanda`)
5. Apie (`#apie`)
6. Paslaugos (`#paslaugos`) — `svc-bg`
7. Auditas / Kaip dirbame (`#auditas`) — `wug-bg`
8. Atsiliepimai / Rezultatai (`#atsiliepimai`) — `testi-bg` + sektorių strip
9. Kainos (`#kainos`) — 3 paketai (Shy / Standard / Advance)
10. **Tinklaraštis (`#blog`) — `blog-bg` — 3 latest posts + "Visi straipsniai" → `/blog.html`**
    - Pirma kortelė (2026-05): `/blog/bdar-baudos-lietuvoje.html` (PUBLISHED)
11. FAQ (`faq-bg`) — **12 klausimų (5 pagerinti + 7 nauji su SEO/GEO)** + FAQPage schema (12 Q&A)
12. Kontaktai (`#kontaktai`) — `contact-bg` — minimal form
13. Footer

**Schema.org** (head): `ProfessionalService` (21 laukai — geo coords, addressRegion, areaServed Country+City, priceRange, taxID/vatID, knowsAbout, contactPoint) + `FAQPage` (12 Q&A, `inLanguage: lt-LT`)

**GEO meta**: `geo.region=LT-VL`, `geo.placename=Vilnius`, `geo.position=54.6800;25.2643`, `ICBM`

**CTA**: Pradėti konsultaciją → `#kontaktai` (primary), Atlikti BDAR rizikos testą → `#main-widget` (secondary)

**Nav linkai**: Paslaugos · Apie mus · Komanda · Kaip dirbame · Rezultatai · Kainos · **Tinklaraštis** · Susisiekti

---

## `/paslaugos.html` — Paslaugos

**Tikslas**: Detaliai paaiškinti, ką siūlome.

**Sekcijos**:
1. Hero — "Visapusiška duomenų apsauga ir IT saugumas"
2. Paslaugų sąrašas (cards):
   - BDAR atitiktis ir auditas
   - DPO outsourcing
   - IT saugumo auditas
   - NIS2 / DORA atitiktis
   - Darbuotojų mokymai
   - Incidentų valdymas
3. Kiekvienai paslaugai — accordion'as su detaliu aprašymu
4. CTA — užsakyti konsultaciją

---

## `/apie.html` — Apie

**Tikslas**: Pasitikėjimas. Komanda, istorija, sertifikatai.

**Sekcijos**:
1. Hero — "Teisė ir IT — viename"
2. Misija / vizija
3. Komanda (DPO, IT specialistai, juristai)
4. Istorija (timeline 2017 → 2026)
5. Sertifikatai (ISO 27001, CIPP/E ir kt.)
6. Vertybės
7. CTA

---

## `/kainos.html` — Kainos

**Tikslas**: Aiškios kainos = pasitikėjimas.

**Sekcijos**:
1. Hero
2. Paketai (3-4 cards):
   - Starter (BDAR pradedantiesiems)
   - Business (vidutinė įmonė)
   - Enterprise (korporacija)
   - Custom
3. Kas įeina (lentelė palyginimui)
4. FAQ
5. CTA

---

## `/blog.html` — Tinklaraštis (listing)

**Tikslas**: SEO + edukacija + lead capture per long-form content. GEO optimizacija (AI search engines).

**Sekcijos**:
1. Nav (dark theme — paveldi iš index)
2. Hero (`bh`) — dark, breadcrumbs + H1 + subhead
3. Filtrai (`bf`) — pills: Visi / BDAR / NIS2 / Kibernetinis saugumas / DPO / Mokymai (client-side `filterPosts()`)
4. Posts grid (`bp-grid`) — kortelės (`.bc`) su `data-cat` atributu filtravimui
5. Newsletter CTA blokas (`nlw`) — el. paštas + prenumeruoti (TODO: prijungti prie `/api/forms/newsletter`)
6. Footer

**Schema.org**: `Organization` + `Blog` + `BreadcrumbList`

**Filtravimas**: client-side JS (be reload'o). Default — visi straipsniai.

**Pagination**: NĖRA šiuo metu (planuojama tik kai pasieks 30+ post'ų — tada serveris arba JS pagination).

**Blog posts path**: `/blog/[slug].html` (slug-only, BE datos prefix — žr. `docs/blog-content-rules.md`)

**Susiję docs**:
- `docs/blog-content-rules.md` — turinio + SEO + GEO taisyklės
- `docs/blog-keywords.md` — LT keyword bank
- `docs/blog-system-prompt.md` — Claude API prompt'as automatizacijai

---

## `/blog/template.html` — Blog post template (v2 post-polish)

**Tikslas**: Vienas template'as visiems blog post'ams. Reference implementation: `/blog/bdar-baudos-lietuvoje.html` (audit health 19/20).

**Placeholder sintaksė**: `{{KEY}}` — pipeline'as `replaceAll()` keičia į turinį.

**Privalomi placeholder laukai** (24 unikalūs, pilnas sąrašas template komentaruose):
- Meta: `{{POST_TITLE}}`, `{{POST_DESCRIPTION}}`, `{{POST_SLUG}}`, `{{POST_CATEGORY}}`, `{{POST_DATE}}`, `{{POST_DATE_HUMAN}}`, `{{POST_READ_MIN}}`, `{{POST_WORD_COUNT}}`
- Author: `{{POST_AUTHOR}}`, `{{POST_AUTHOR_ROLE}}`, `{{POST_AUTHOR_INITIAL}}` (vienas simbolis — M/J/V, NE pavardės)
- Image: `{{POST_HERO_IMG}}`, `{{POST_HERO_ALT}}` (180-300 chr), `{{POST_HERO_CAPTION}}`
- Content: `{{POST_DEFINITION}}`, `{{POST_TOC_HTML}}`, `{{POST_BODY_HTML}}`, `{{POST_FAQ_HTML}}`, `{{POST_TESTIMONIAL_HTML}}`
- Schema: `{{POST_FAQ_SCHEMA_JSON}}`, `{{POST_HOWTO_SCHEMA_JSON}}`, `{{POST_REVIEW_SCHEMA_JSON}}`
- SEO: `{{POST_KEYWORDS_CSV}}` (5+ schema), `{{POST_KEYWORDS_META}}` (10+ meta tag)
- Related: `{{RELATED_POSTS_HTML}}`

**Sekcijos**:
1. Nav (`<nav aria-label="Pagrindinis meniu">`, fixed top:0, height:60px) — 1:1 su index.html
2. Skip-to-content link (a11y, focus-visible only)
3. `<main id="main" tabindex="-1">` (a11y landmark)
4. Article header (`<header class="ah">` — buvo `<section>`) — breadcrumbs + meta + H1 + sub + author block
5. Article body (`ab`) — `prose` klasė viduje:
   - `<figure class="figure-dark">` — featured hero image (1200×630 SVG, eager loading)
   - `<p class="definition">` — featured snippet (po hero)
   - `<div class="toc">` — auto-numbered TOC (lt: "Šiame straipsnyje")
   - Main body — H2/H3/p/ul/ol/blockquote/callout/stat-hl/figure/testimonial
6. FAQ sekcija (`faq-sec` su `.faq-grid` 2 stulpeliai) — 5-12 klausimų + FAQPage schema
7. Inline CTA blokas (`cta-inline`) pabaigoje — privalomas
8. Share mygtukai (LinkedIn / Facebook / Email) — touch target 40-44px
9. Related posts (`rel`) — 2-3 susiję straipsniai
10. Footer

**Schema.org** (4-5 blokai):
- `BlogPosting` (su `image` array, `wordCount`, `keywords`, `articleSection`, `inLanguage: lt-LT`)
- `BreadcrumbList`
- `FAQPage` (5-12 Q&A)
- `HowTo` (jei step-by-step — optional)
- `Review` (jei testimonial — optional)

**Komponentai body'je** (CSS klasės):
- `.definition` — featured snippet paragrafas (privaloma)
- `.callout` su `<strong>SVARBU</strong>` (bent 1×, color: `--gold-strong` 5.96:1 kontrastui)
- `.stat-hl` — skaičiaus paryškinimas (bent 1×)
- `<blockquote>` — citata (bent 1×)
- `<figure>` body images (1100×360 schemos, 1100×480 procesai) su aspect-ratio fallbacks
- `<figure class="testimonial">` — social proof (Review microdata)
- `.cta-inline` — 1× cluster, 2× pillar (privaloma pabaigoje)

**Design tokens** (4 nauji po polish):
- `--gold-strong: #7d5b14` (5.96:1 contrast — WCAG AA)
- `--red: #dc2626`
- `--g500: #6f6a5e` (5.03:1 — ankstesnė versija buvo 3.78)
- `--g600: #5a564c`

**Easing tokens** (Kowalski patterns):
- `--ease-out-quint: cubic-bezier(.23,1,.32,1)`
- `--ease-out-cubic: cubic-bezier(.33,1,.68,1)`
- `--ease-in-out-cubic: cubic-bezier(.645,.045,.355,1)`

**A11Y privaloma**:
- `<main>` landmark + skip-link
- `:focus-visible` global (2px outline, blue2 / gold2 CTA'ams)
- FAQ `aria-expanded` + `aria-controls` (per JS dinamiškai)
- Hamburger `aria-expanded` toggle
- Image `width`/`height` + aspect-ratio fallbacks (CLS prevention)
- `(hover: hover)` media wrap visiems hover'iams
- `prefers-reduced-motion` respect

**JS funkcijos**:
- `toggleMob()` / `closeMob()` — mob menu su `aria-expanded` sync
- FAQ accordion forEach — pridėta `aria-expanded` toggle + dinaminiai `aria-controls`/`id`
- IntersectionObserver — scroll-triggered fade-in/slide-up (`.reveal` klasė)

**Author'ių sistema**:
| Vardas | Initial | Rolė | Sritis |
|---|---|---|---|
| Marina | M | Teisės ekspertė, BDAR | BDAR, DPO, teisė |
| Justinas | J | IT saugumo ekspertas | NIS2, kibernetinis saugumas, IT auditas |
| Veriva komanda | V | Veriva ekspertų komanda | Bendro pobūdžio |

---

## `/blog/bdar-baudos-lietuvoje.html` — Pirmas pillar postas (PUBLISHED)

**Status**: 🟢 PUBLISHED (2026-05-09), `index, follow`

**Specs**:
- Word count: 2846 | Reading: 15 min
- Audit Health: 19/20 (post-polish)
- Author: Marina (M)
- Hero image: `/assets/img/blog/bdar-baudos-hero.svg` (1200×630)
- Body images: `vdai-baudos-skaiciavimas.svg` (1100×360), `bdar-atitiktis-5-zingsniai.svg` (1100×480)
- 4 JSON-LD blocks: BlogPosting + BreadcrumbList + FAQPage (12) + HowTo (5 steps) + Review

**Linkavimas**: nuoroda iš `index.html` (#blog kortelė) ir `blog.html` (pirma kortelė) + `sitemap.xml`

---

## `/kontaktai.html` — Kontaktai

**Tikslas**: Pagrindinis lead capture.

**Sekcijos**:
1. Hero
2. Kontakto forma (vardas, įmonė, email, tel, žinutė, paslauga)
3. Kontaktinė informacija (adresas, tel, email)
4. Map (Google Maps embed)
5. Working hours

---

## `/privatumas.html` — Privatumo politika

**Tikslas**: BDAR reikalavimas. Ironiška, jei Veriva neturi.

**Sekcijos**:
1. Kas mes esame
2. Kokius duomenis renkam
3. Tikslai
4. Pagrindas (BDAR str. 6)
5. Saugojimo terminai
6. Subjekto teisės
7. Slapukai (link į /slapukai.html)
8. Kontaktai (DPO)

---

## `/slapukai.html` — Cookie policy

**Tikslas**: Cookie compliance.

**Sekcijos**:
1. Kas yra slapukai
2. Kokius naudojam (būtini, analitiniai, marketing)
3. Lentelė su visais slapukais
4. Kaip valdyti / atšaukti

---

## `/404.html` — Klaidos puslapis

**Tikslas**: Vartotojas neradęs puslapio — paguodos žodis + nukreipimas.

---

## Bendri komponentai (kartojasi visuose puslapiuose)

- **Nav** — fixed top, logo + meniu + CTA
- **Footer** — kontaktai, paslaugos, įmonė, social, legal links
- **Cookie banner** — pirmąkart apsilankius
- **Newsletter signup** — footer'yje

Komponentų stiliai: `assets/css/components.css`
