# SEO strategija — Veriva

Tikslas: organic LT traffic įmonėms, ieškančioms BDAR/IT saugumo paslaugų.

---

## Target keywords (LT)

### Primary (high intent)

| Keyword | Volume (est.) | Difficulty | Puslapis |
|---|---|---|---|
| `bdar atitiktis` | 1.2k/mo | Medium | `/paslaugos.html` |
| `duomenų apsaugos pareigūnas` | 880/mo | Medium | `/paslaugos.html#dpo` |
| `dpo paslaugos` | 320/mo | Low | `/paslaugos.html#dpo` |
| `bdar auditas` | 590/mo | Medium | `/paslaugos.html#auditas` |
| `kibernetinio saugumo auditas` | 480/mo | Medium | `/paslaugos.html#it` |
| `nis2 direktyva` | 720/mo | High | `/blog/nis2-direktyva.html` |
| `bdar konsultacija` | 390/mo | Low | `/kontaktai.html` |

### Secondary (informational)

- `kas yra bdar`
- `bdar baudos lietuvoje`
- `vdai patikrinimas`
- `asmens duomenų pažeidimas`
- `duomenų subjekto teisės`
- `slapukų sutikimas`
- `iso 27001 sertifikatas lietuvoje`
- `dora reglamentas`

### Long-tail (blog content)

- `kaip pasiruosti vdai patikrinimui`
- `bdar reikalavimai uab`
- `kiek kainuoja bdar auditas`
- `dpo ar reikia kiekvienai imonei`
- `kaip apsaugoti įmonės duomenis`

---

## Page-level SEO

### Pagrindinis (`/`)

```html
<title>Veriva — Duomenų apsauga ir kibernetinis saugumas Lietuvoje</title>
<meta name="description" content="BDAR atitiktis ir kibernetinis saugumas. Teisė + IT vienoje komandoje. 120+ klientų, €0 VDAI baudų nuo 2017 m.">
```
Target: `bdar atitiktis lietuvoje`, `duomenų apsauga lietuvoje`

### Paslaugos (`/paslaugos.html`)

```html
<title>BDAR ir IT saugumo paslaugos | Veriva</title>
<meta name="description" content="DPO outsourcing, BDAR auditas, IT saugumo testai, NIS2 ir DORA atitiktis. Teisinė + techninė kompetencija viename.">
```

### Apie (`/apie.html`)

```html
<title>Apie Veriva — Teisės ir IT specialistai | BDAR ekspertai</title>
<meta name="description" content="Veriva komanda — DPO, juristai, IT auditoriai. 120+ klientų, ISO 27001 sertifikatas, 8 metų patirtis duomenų apsaugos srityje.">
```

### Kainos (`/kainos.html`)

```html
<title>BDAR ir DPO paslaugų kainos | Veriva</title>
<meta name="description" content="Aiškios BDAR konsultacijos ir DPO outsourcing kainos. Paketai nuo €X/mėn. Be paslėptų mokesčių.">
```

### Blog (`/blog.html`)

```html
<title>BDAR, NIS2 ir IT saugumo blogas | Veriva</title>
<meta name="description" content="Praktiniai patarimai apie BDAR atitiktį, NIS2 direktyvą, kibernetinio saugumo audito reikalavimus.">
```

---

## Schema.org

Privalomi tipai:
1. **Organization** (kiekviename puslapyje)
2. **LocalBusiness** (LegalService) — pagrindiniame
3. **Service** — paslaugų puslapyje
4. **BreadcrumbList** — ne-pagrindiniuose
5. **Article** — blog post'uose
6. **FAQPage** — FAQ sekcijose
7. **WebSite** + SearchAction — pagrindiniame

Pavyzdys (Organization):
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Veriva",
  "url": "https://veriva.lt",
  "logo": "https://veriva.lt/assets/img/logo.svg",
  "sameAs": [
    "https://www.linkedin.com/company/veriva"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+370-...",
    "contactType": "customer service",
    "areaServed": "LT",
    "availableLanguage": ["Lithuanian", "English"]
  }
}
```

---

## Technical SEO

- ✅ `robots.txt` (allow all + sitemap link)
- ✅ `sitemap.xml` (auto-generated po deploy)
- ✅ Canonical URL kiekviename puslapyje
- ✅ HTTPS (Vercel default)
- ✅ Mobile-first responsive
- ✅ Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- ✅ Lazy loading paveikslėliams
- ✅ WebP + AVIF formatai
- ✅ Preload critical fonts
- ✅ Inline critical CSS hero'jui
- ✅ Defer non-critical JS

---

## Local SEO

- Google Business Profile (vėliau)
- LT katalogai: rekvizitai.lt, 1588.lt, vle.lt
- LinkedIn Company Page (link iš site)

---

## Content kalendorius (pirmi 3 mėnesiai)

### Mėnuo 1 — foundation
1. "Kas yra BDAR ir kodėl ji svarbi 2026 m."
2. "VDAI patikrinimas — kaip pasiruošti per 30 dienų"
3. "BDAR baudos Lietuvoje — top 10 atvejų 2024-2025"

### Mėnuo 2 — DPO
4. "Ar jūsų įmonei reikia DPO? Praktinis testas"
5. "DPO outsourcing vs. vidinis specialistas — kainos ir privalumai"
6. "Duomenų subjekto teisės — kaip atsakyti į užklausas"

### Mėnuo 3 — NIS2 / DORA
7. "NIS2 direktyva — kas keičiasi 2025 m. Lietuvos įmonėms"
8. "DORA reglamentas finansų sektoriui — atitikties checklist"
9. "Asmens duomenų pažeidimas — pirmieji 72 valandos"

---

## Tracking

- Google Search Console (po deploy)
- GA4 + GTM
- Ahrefs / SEMrush keyword monitoring
- Monthly position report blog post'ams
