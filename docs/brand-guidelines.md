# Brand Guidelines — Veriva

Pagrindas paimtas iš esamo `index.html`. Nepakeičiame.

---

## Spalvos

```css
:root {
  /* Pagrindinės */
  --ink:    #07111f;   /* tamsiausia, hero, headlines */
  --ink2:   #0c1a2e;   /* sekundinė tamsa */
  --blue:   #1a47cc;   /* pagrindinė akcento spalva, CTA */
  --blue2:  #2255e0;   /* hover state */
  --cyan:   #00b4d8;   /* akcentas, tech / saugumo asociacija */

  /* Statuso */
  --red:    #dc2626;   /* warning, klaidos */
  --gold:   #c8962a;   /* premium, akcentas */
  --gold2:  #e8b84b;   /* gold hover */

  /* Neutralios */
  --white:  #fff;
  --cream:  #f8f7f4;   /* body background */
  --g50:    #f3f2ee;
  --g100:   #eae8e2;
  --g300:   #c5c2b8;
  --g500:   #837e72;
  --g700:   #44413b;

  /* Borders */
  --border:  rgba(7,17,31,.09);
  --border2: rgba(7,17,31,.15);
}
```

### Kada naudoti

- **`--ink`**: hero fonas, headlines ant cream
- **`--blue`**: primary CTA, links
- **`--cyan`**: tech/saugumo akcentai (icons, badges)
- **`--gold`**: "premium" arba ypatingo dėmesio elementai (sertifikatai, awards)
- **`--cream`**: body fonas (NIEKADA white)

---

## Tipografija

### Fontai

```css
--ff:  'Plus Jakarta Sans', system-ui, sans-serif;  /* body */
--ffd: 'Syne', system-ui, sans-serif;                /* display, h1-h2 */
```

Įkrauti per Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

### Hierarchija

| Element | Font | Weight | Size (desktop) | Size (mobile) |
|---|---|---|---|---|
| H1 | Syne | 800 | 64px | 40px |
| H2 | Syne | 700 | 48px | 32px |
| H3 | Plus Jakarta Sans | 700 | 28px | 22px |
| H4 | Plus Jakarta Sans | 600 | 20px | 18px |
| Body | Plus Jakarta Sans | 400 | 16px | 16px |
| Small | Plus Jakarta Sans | 500 | 13px | 13px |
| Eyebrow | Plus Jakarta Sans | 600 | 12px (uppercase, letter-spacing 1.5px) | sama |

---

## Layout

```css
--max: 1140px;     /* container max-width */
```

- **Padding**: 24px desktop, 20px mobile
- **Section spacing**: 96px desktop, 64px mobile
- **Grid gap**: 32px default, 24px tight, 56px loose

---

## Komponentai

### Buttons

**Primary** (mėlynas):
```css
background: var(--blue);
color: #fff;
padding: 14px 28px;
border-radius: 10px;
font-weight: 700;
transition: all .2s var(--ease);
```
Hover: `background: var(--blue2); transform: translateY(-1px);`

**Secondary** (outlined):
```css
border: 1.5px solid var(--ink);
color: var(--ink);
background: transparent;
```

**CTA Gold** (ypatingas):
```css
background: linear-gradient(135deg, var(--gold), var(--gold2));
color: var(--ink);
```

### Cards

```css
background: #fff;
border: 1px solid var(--border);
border-radius: 16px;
padding: 32px;
transition: all .3s var(--ease);
```
Hover: `border-color: var(--border2); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,.06);`

---

## Easing

```css
--ease: cubic-bezier(.4, 0, .2, 1);
--t: .2s var(--ease);  /* default transition */
```

---

## Iconography

- Style: outline/stroke, NE filled
- Stroke width: 1.5-2px
- Size: 20-24px standartas, 32-40px feature sections
- Color: `var(--ink)` arba `var(--blue)` priklausomai nuo konteksto

---

## Tonas (copywriting)

**Esmė**: Profesionalus, autoritetingas, faktais paremtas. **Be marketing'inio bullshit'o.**

### TAIP ✅

- "120+ klientų, €0 VDAI baudų nuo 2017 m."
- "BDAR auditas — per 14 dienų"
- "Teisė ir IT vienoje komandoje"
- "Atitiktis. Be baudų. Be streso."

### NE ❌

- "Inovatyvūs sprendimai" (vandeningas)
- "Šiuolaikiškas požiūris" (banalus)
- "Mūsų komanda padės jums..." (be specifikos)
- Emoji headlines ("🚀 Greitai!")

### Headlines pavyzdžiai

- "BDAR atitiktis — be teisinių spragų ir IT skylių"
- "Vienas auditas. Du specialistai. Nulis nustebimų."
- "Kol jūs dirbate — mes saugom duomenis"

### CTA pavyzdžiai

- "Užsakyti BDAR auditą"
- "Nemokama 30 min konsultacija"
- "Patikrinti atitiktį"
- ❌ NE "Sužinokite daugiau" (slabas)
- ❌ NE "Susisiekite" (be paskatos)

---

## Logo

(TBD — logo failai laukiami)

Reikia: SVG (versija šviesi + tamsi), PNG @1x @2x @3x, favicon (ICO + 32x32 + 192x192 + apple-touch-icon)

---

## Imagery

- Real photography > stock (jei įmanoma)
- Color treatment: cool tone, šiek tiek desaturated
- NE "happy diverse business people" stock'as
- LT konteksto akcentas (Vilniaus skyline, real biuras)
