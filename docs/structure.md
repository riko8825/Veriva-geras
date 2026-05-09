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
11. FAQ (`faq-bg`)
12. Kontaktai (`#kontaktai`) — `contact-bg` — minimal form
13. Footer

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

## `/blog/template.html` — Blog post template

**Tikslas**: Vienas template'as visiems blog post'ams. Naudojamas `blog-gen` automatizacijos (TODO: dar nesukurta).

**Placeholder sintaksė**: `{{KEY}}` — pipeline'as `replaceAll()` keičia į turinį.

**Privalomi placeholder laukai** (pilnas sąrašas template komentaruose):
- Meta: `{{POST_TITLE}}`, `{{POST_DESCRIPTION}}`, `{{POST_SLUG}}`, `{{POST_CATEGORY}}`, `{{POST_CAT_KEY}}`, `{{POST_CAT_BADGE}}`, `{{POST_DATE}}`, `{{POST_DATE_HUMAN}}`, `{{POST_READ_MIN}}`, `{{POST_WORD_COUNT}}`
- Author: `{{POST_AUTHOR}}`, `{{POST_AUTHOR_ROLE}}`, `{{POST_AUTHOR_INITIALS}}`
- Content: `{{POST_DEFINITION}}`, `{{POST_TOC_HTML}}`, `{{POST_BODY_HTML}}`, `{{POST_FAQ_HTML}}`, `{{POST_FAQ_SCHEMA_JSON}}`, `{{POST_KEYWORDS_CSV}}`, `{{RELATED_POSTS_HTML}}`

**Sekcijos**:
1. Nav (dark, paveldi iš index)
2. Article hero (`ah`) — breadcrumbs + meta + H1 + sub + author block
3. Article body (`ab`) — `prose` klasė viduje:
   - `<p class="definition">` — featured snippet (po H1)
   - `<div class="toc">` — auto-numbered TOC
   - Main body — H2/H3/p/ul/ol/blockquote/callout/stat-hl
4. Inline CTA blokas (`cta-inline`) — kvietimas atlikti rizikos testą
5. Share mygtukai (LinkedIn / Facebook / Email)
6. FAQ sekcija (`faq-sec`) — 5 klausimai (accordion JS) + `FAQPage` schema
7. Related posts (`rel`) — 2-3 susiję straipsniai
8. Footer

**Schema.org**: `BlogPosting` (su `wordCount` + `keywords` + `articleSection`) + `BreadcrumbList` + `FAQPage`

**Komponentai body'je**:
- `.definition` — featured snippet paragrafas
- `.callout` — su `<strong>SVARBU</strong>` header'iu
- `.stat-hl` — skaičiaus paryškinimas
- `<blockquote>` — citata
- `.cta-inline` — vidury straipsnio CTA blokas

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
