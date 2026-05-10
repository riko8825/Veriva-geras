# Blog Content Rules — Veriva

Šios taisyklės yra **single source of truth** Veriva blog turiniui. Privaloma:
- Žmogui rašant straipsnį — laikytis šių taisyklių
- Claude API blog-gen automatizacijai — `docs/blog-system-prompt.md` referencuoja šį failą
- QA prieš publikuojant — `qa-tester` agent tikrina pagal šį checklist'ą

---

## 1. Brand tonas (LT, B2B, teisinis + IT)

### Charakteris
**Profesionalus. Autoritetingas. Faktais paremtas. Be marketingo bullshit'o.**

Veriva — teisės + IT firma su 8 metų patirtimi, 120+ klientų, €0 VDAI baudų. Kalbame kaip ekspertai, kurie jau matė viską. Be hype, be FOMO, be "revoliucinių sprendimų".

### Žodynas

| ✅ Vartoti | ❌ Vengti |
|---|---|
| BDAR atitiktis | "GDPR compliance solution" (ne LT) |
| Duomenų pažeidimas | "Data breach incident situation" |
| VDAI patikrinimas | "VDAI proceso eiga" (per oficialus) |
| Praktiškai | "Iš esmės", "iš principo" |
| Pavyzdžiui | "Pvz. tarkime" |
| Teisės aktas reikalauja | "Yra svarbu suprasti, jog…" |
| 72 valandos | "Per pakankamai trumpą laiką" |
| €20M arba 4% | "Didelės baudos" |

### Sakinių taisyklės
- **Sakiniai ≤20 žodžių** (LT — kiek ilgiau nei EN dėl morfologijos)
- **Aktyvi forma** — "VDAI tikrina", ne "yra tikrinamas VDAI"
- **Pirmo asmens vengti** — "Veriva mato", ne "mes matome" (autoritetas, ne pasakojimas)
- **Skaičius vietoj prieveiksmių** — "120+ auditų", ne "daug auditų"

### Pavyzdžiai

❌ **Bullshit**:
> Mūsų patyrę specialistai, naudodamiesi naujausiomis technologijomis, padės jums efektyviai spręsti BDAR atitikties iššūkius ir užtikrinti aukščiausio lygio duomenų apsaugą jūsų organizacijoje.

✅ **Veriva**:
> BDAR auditas trunka 5-7 darbo dienas. Pirmoji ataskaita — per 48 valandas. €0 VDAI baudų klientams nuo 2017 m.

---

## 2. Straipsnio struktūra

### Privalomi elementai

```
1. H1                         — vienas, primary keyword pirmuose 60 simb.
2. Definition paragraph       — 40-60 žodžių, atsakymas į pagrindinį klausimą (featured snippet)
3. Table of Contents (TOC)    — auto-numbered, 4-7 H2 punktų
4. H2 sekcijos                — 5-8 H2, kiekvienas su keyword variantu
5. H3 sub-sekcijos             — pagal poreikį (jei H2 ilgas)
6. Bent 1× callout             — "SVARBU" / "PASTABA" / "PRAKTIŠKAI"
7. Bent 1× stat-highlight      — skaičius + paaiškinimas
8. Bent 1× blockquote          — citata su autoritetu (teisės aktas, VDAI gairė, klientas)
9. Inline CTA blokas           — kvietimas užsakyti auditą / testą
10. FAQ sekcija                 — 5 klausimai (FAQPage schema)
11. Related posts              — 2-3 susiję straipsniai
```

### Straipsnio ilgis

| Tipas | Žodžių sk. | Skaitymo trukmė |
|---|---|---|
| Greitas paaiškinimas | 800–1 200 | 4–6 min |
| Pilnas vadovas | 1 500–2 500 | 7–12 min |
| Pillar straipsnis | 3 000+ | 15+ min |

**Default**: 1 500–2 000 žodžių (geriausia SEO + skaitomumas).

### Definition paragraph (featured snippet)

Po H1, prieš TOC. **40–60 žodžių**. Atsako į pagrindinį klausimą tiesiogiai. Tikslas — Google "featured snippet" pozicija + GEO (AI search engines).

**Formulė**:
```
[Subjektas] yra [apibrėžimas]. [Pagrindinis kontekstas]. [Praktinė reikšmė].
```

**Pvz.:**
> NIS2 direktyva yra ES kibernetinio saugumo įstatymas, taikomas vidutinėms ir didelėms įmonėms 18 sektorių. Lietuvoje įsigaliojo 2024 m. spalio 17 d. Privalo atitikti įmonės su 50+ darbuotojų arba €10M+ apyvarta.

---

## 3. SEO taisyklės (LT)

### Title tag
- **≤60 simbolių** (LT diakritikai skaičiuojami kaip 1)
- **Primary keyword pirmuose 30 simb.**
- **Formatas**: `[Pirminis KW + nauda] — Veriva`
- ❌ "Sužinokite viską apie BDAR" (per bendra)
- ✅ "BDAR auditas: kaip pasiruošti VDAI patikrinimui — Veriva"

### Meta description
- **140–160 simbolių**
- **Primary keyword pirmuose 60 simb.**
- **Turi**: 1× primary KW + skaičius/faktas + CTA
- ❌ "Šiame straipsnyje rasite informacijos apie BDAR ir kaip ji veikia"
- ✅ "BDAR auditas iš teisės + IT ekspertų. 120+ klientų, €0 VDAI baudų nuo 2017 m. Sužinokite, kaip pasiruošti per 7 dienas."

### URL slug
- **Kebab-case, BE diakritikų**: `bdar-auditas-vadovas`, ne `bdar-auditų-vadovas`
- **3–6 žodžiai**
- **Primary keyword apima**
- ❌ `/blog/2026-05-09-bdar-auditas-pilnas-vadovas-pradzios-vartotojams.html`
- ✅ `/blog/bdar-auditas-vadovas.html`

### H tagų hierarchija

```
H1 — 1 puslapyje, primary KW, ≤70 simb.
  H2 — 5-8 sekcijos, kiekvienas turi KW variantą
    H3 — sub-elementai pagal poreikį
```

**Veriva H1 šablonai:**
- "[Tema]: pilnas vadovas Lietuvos verslui"
- "Kaip [veiksmas]: praktiniai patarimai iš [N] auditų"
- "[Tema] 2026 m.: ko tikėtis ir kaip pasiruošti"

**Veriva H2 šablonai:**
- "Kas yra [tema] ir kam ji taikoma"
- "Dažniausi klaidingi įsitikinimai"
- "Praktinis žingsnis po žingsnio vadovas"
- "Realūs atvejai iš mūsų patirties"
- "Baudų rizika ir kaip jos išvengti"
- "Ką daryti dabar: konkretus checklist'as"

### Keyword tankis
- **Primary**: 3–5× per 1 000 žodžių (nepriverstinai)
- **Secondary**: 2–3× per straipsnį
- **Long-tail**: 1× (intro arba 1 H2)
- **LSI**: po 1× (callout, list, blockquote)

**Niekada**:
- Stuffing — to paties KW kartoti tame pačiame paragrafe
- Per jėgą įterpti KW į H tagą, jei nesiskamba natūraliai

---

## 4. GEO optimizavimas (AI search engines)

Tikslas — **ChatGPT, Perplexity, Claude, Gemini cituoja veriva.lt** kaip šaltinį.

### Taktikos

1. **Direktūs atsakymai** — pirmas paragrafas po H1 atsako į klausimą tiesiogiai (definition)
2. **Numeruoti sąrašai** — AI search engines mėgsta struktūruotus duomenis
3. **Tikslūs skaičiai** — "€20M arba 4% apyvartos", ne "didelės baudos"
4. **Šaltinio nuorodos** — VDAI, teisės aktai, ES dokumentai (autoritetas)
5. **FAQ sekcija** — 5 klausimai su `FAQPage` schema (kiekvienas straipsnis)
6. **HowTo schema** — jei straipsnis yra step-by-step (`{{POST_HOWTO_SCHEMA}}`)

### Klausimų formuluotės (GEO friendly)

✅ **Geri**:
- "Kas yra DPO ir kada jo reikia?"
- "Kaip pasiruošti VDAI patikrinimui?"
- "Ar BDAR taikoma smulkiam verslui?"
- "Kokios yra baudos už BDAR pažeidimus?"
- "Kuo skiriasi DPIA nuo PIA?"

❌ **Blogi**:
- "Sužinokite daugiau apie DPO" (ne klausimas)
- "BDAR ir smulkus verslas" (ne klausimas)

---

## 5. Schema.org

### Privaloma kiekviename straipsnyje
```json
{
  "@type": "BlogPosting",
  "headline": "...",
  "datePublished": "YYYY-MM-DD",
  "dateModified": "YYYY-MM-DD",
  "author": {"@type": "Person", "name": "..."},
  "publisher": {"@type": "Organization", ...},
  "wordCount": 1850,
  "keywords": "kw1, kw2, kw3, kw4, kw5",
  "articleSection": "BDAR | NIS2 | ..."
}
```

### Pridedama jei aktualu
- `FAQPage` — kai yra FAQ sekcija (visada)
- `HowTo` — kai straipsnis yra step-by-step vadovas
- `LegalService` (Veriva organization) — visada per `@graph`

---

## 6. Vidiniai linkai (internal linking)

### Privaloma
- **2-4 vidiniai linkai** kiekviename straipsnyje
- **Linkuoti į**: kitus blog'us, paslaugų sekcijas (`/#paslaugos`), kainas (`/#kainos`)
- **Anchor text** — keyword, ne "spauskite čia"

### Strategija
1. Kiekvienas straipsnis turi nuorodą į **bent 1 kitą blog'ą** (related concept)
2. **1× nuoroda į konversijos puslapį** (`/#kontaktai`, `/#top` BDAR testas)
3. **1× nuoroda į paslaugų aprašymą** (`/#paslaugos`)

### Pavyzdys (BDAR straipsnyje)
> Daugiau apie [DPO funkcijos pasirinkimą](/blog/dpo-funkcija-kada-reikia.html) — vidinis vs outsourcing.
> [Atlikite nemokamą BDAR rizikos testą](/#top) per 60 sekundžių.
> Užsakykite [pilną BDAR auditą](/#paslaugos) — 7 darbo dienos, garantija raštu.

---

## 7. CTA strategija straipsnyje

### Vietos (3 CTA per straipsnį)

1. **Po definition paragraph** (ankstyvas — high-intent skaitytojui)
   - Soft: "Atlikite [BDAR rizikos testą](/#top) per 60 sek."

2. **Vidury straipsnio** (po stat-highlight arba 3-4 H2)
   - Inline CTA blokas (komponentas `cta-inline`)
   - Header: "Reikia pagalbos su [tema]?"

3. **Pabaigoje, prieš FAQ**
   - Strong: "Užsakyti pilną auditą — 7 dienos, garantija raštu"

### CTA copy taisyklės
- ❌ "Susisiekite su mumis"
- ❌ "Sužinokite daugiau"
- ✅ "Atlikti BDAR testą — nemokamai, 60 sek."
- ✅ "Užsakyti BDAR auditą — atsakymas per 24h"

---

## 8. Vizualiniai komponentai (kada naudoti)

### `<p class="definition">` — featured snippet
- **Po H1, prieš TOC**
- 40-60 žodžių, tiesioginis atsakymas

### `<div class="callout">` — svarbi pastaba
- **1-2 per straipsnį**
- Kai paryškinama: terminas, baudos suma, deadline'as, teisės akto reikalavimas
- Header: "SVARBU" / "PASTABA" / "PRAKTIŠKAI" / "DĖMESIO"

### `<div class="stat-hl">` — skaičiaus paryškinimas
- **1-2 per straipsnį**
- Kai yra įsimintinas skaičius (€20M, 72h, 120+, 4%, 0)

### `<blockquote>` — citata
- **0-1 per straipsnį**
- Šaltiniai: VDAI gairė, ES reglamento straipsnis, kliento atsiliepimas, teismų praktika

### `<table>` — palyginimas
- Naudoti kai yra A vs B vs C palyginimas (DPO vidinis vs outsourcing, NIS2 vs DORA, ir pan.)

---

## 9. Privalomas QA checklist'as prieš publikuojant

### SEO
- [ ] `<title>` ≤60 simb., primary KW pirmuose 30 simb.
- [ ] `<meta description>` 140–160 simb., primary KW pirmuose 60 simb.
- [ ] `<h1>` vienas, primary KW įtrauktas
- [ ] Slug — kebab-case, be diakritikų, 3–6 žodžiai
- [ ] Canonical URL teisingas
- [ ] OG tags pilni (title, description, type=article, url)
- [ ] Schema.org `BlogPosting` + `BreadcrumbList` + `FAQPage`

### Turinys
- [ ] Definition paragraph yra (40-60 žodžių)
- [ ] TOC yra (4-7 H2 punktų)
- [ ] 5-8 H2, kiekvienas su KW variantu
- [ ] Bent 1× callout, 1× stat-hl, 1× blockquote
- [ ] Žodžių skaičius — 1500-2500 (default)
- [ ] FAQ sekcija — 5 klausimai

### Kalba
- [ ] Sakiniai ≤20 žodžių (>80% straipsnio)
- [ ] Jokio "mūsų patyrę specialistai", "efektyvūs sprendimai", "aukščiausio lygio"
- [ ] LT diakritikai teisingi (ą, č, ę, ė, į, š, ų, ū, ž)
- [ ] LT skyrybos (kabutės: „abc" arba „abc")

### Linkai
- [ ] 2-4 vidiniai linkai
- [ ] 1 link į konversijos puslapį
- [ ] Bent 1 išorinis link su autoritetu (VDAI, ES, teisės aktas)

### Konversija
- [ ] 3 CTA blokai (po definition, vidury, pabaigoje)
- [ ] Inline CTA blokas yra
- [ ] Related posts — 2-3 kortelės

---

## 10. Veriva ekspertai (autoriai)

| Vardas | Sritis | Initials | Role |
|---|---|---|---|
| Marina | BDAR, teisė | M | Teisės ekspertė, BDAR |
| Justinas | IT saugumas, NIS2 | J | IT saugumo ekspertas |
| Veriva komanda | Bendro pobūdžio | V | Veriva ekspertų komanda |

**Taisyklė**: BDAR / DPO / teisės straipsniai → Marina. NIS2 / kibernetinis saugumas / IT auditas → Justinas. Mokymai / bendro pobūdžio → komanda.

---

## 11. Failo path konvencija

```
/blog/{slug}.html                  ← straipsnio failas (slug-only, BE datos prefix)
/blog/template.html                ← template (placeholder'iai)
/sitemap.xml                       ← auto-update po publikavimo
/blog.html                         ← listing (auto-update post sąrašo, arba static)
```

**Slug pavyzdžiai (geri):**
- `bdar-auditas-vadovas`
- `nis2-direktyva-praktiskai`
- `dpo-funkcija-kada-reikia`
- `phishing-darbuotoju-mokymai`
- `incidentu-valdymas-72h`

**Slug pavyzdžiai (blogi):**
- `2026-05-09-bdar-auditas` (data ne reikalinga)
- `pilnas-vadovas-apie-bdar-audita-lietuvos-versluiams` (per ilgas)
- `bdar-auditas` (per bendras, daug straipsnių pretenduos)
