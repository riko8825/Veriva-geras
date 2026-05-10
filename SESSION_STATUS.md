# SESSION_STATUS

**Data**: 2026-05-10
**Sesijos tikslas**: blog.html premium dark tier sync su index.html brand language + 3 placeholder kortelių 404 link'ų pašalinimas (KI-001 partial fix)

---

## ATLIKTA ŠIOJE SESIJOJE (2026-05-10 — blog-dark-tier-sync)

### blog.html premium dark tier perdirbimas (commit `2ca8177`)
- **Visa puslapio body** dark (`--ink`) — buvo light (`--cream`)
- **Hero (`.bh`)**: mono kicker `Tinklaraštis` + glowing cyan dot (vietoj gold tag), Syne 800 H1, `em` accent baltas-50% (vietoj gold), radial mesh (matches `.about-bg` / `.blog-bg` index'e)
- **Filterai (`.bf-btn`)**: dark glass `rgba(255,255,255,.04)` + cyan border on hover; aktyvus = cyan tinted background, ne ink black
- **Post kortelės (`.bc`)**: `.post`-style premium card iš index — radial mesh background, top hairline cyan gradient line (`::before`), `:has()` sibling dim hover, gradient block visual su SVG grid mask, mono cat label su cyan glowing dot, white-on-dark titles, cyan arrow translateX hover
- **Newsletter (`.nlw`)**: glass card su top hairline + mono kicker `Naujienlaiškis`, em accent baltas-50%, **cyan CTA mygtukas** (vietoj blue)
- **Footer**: pridėtas `border-top` hairline
- **Reduced-motion**: `prefers-reduced-motion` respect
- **Fontai**: pridėtas JetBrains Mono preload
- **CSS balansas**: 103/103 braces (po šios sesijos commit'o), 113/113 (po placeholder fix)

### blog.html 3 placeholder cards disabled (commit `f74415f`)
- **DPO, Incidentai, Mokymai** kortelės: `<a href="/blog/...">` → `<div>` (404 link'ai pašalinti — KI-001 partial fix)
- Pridėtas `Netrukus` badge viršuje dešinėje (mono font, glass background `rgba(7,17,31,.7)` + backdrop-filter)
- Disabled state: `.bc--soon` su `opacity:.55`, no hover transform, "Skaityti straipsnį →" → "Netrukus"
- `aria-disabled="true"` accessibility
- 3 realūs post'ai (BDAR, NIS2, Phishing) lieka aktyvūs su pilnu hover state
- Filterai vis dar veikia (`data-cat` išsaugotas ir disabled kortelėse)

### Production verifikacija
- Push'inta į origin/main: `2ca8177..f74415f`
- Vercel build #2 (commit `f74415f`): Ready 13s
- `https://www.veriva.lt/blog.html` → HTTP 200 (su 308 redirect → /blog)
- 6× "Netrukus" string, 11× `bc--soon` class refs production HTML

### Tools naudoti
- `Read` × 6, `Edit` × 9, `Bash` × 12, `Grep` × 6, `Glob` × 1
- Lokalus HTTP servas (port 5174) prieš commit verifikacijai

### Neužbaigta / nepatvirtinta
- Naršyklės QA nepadarytas (mobile @768px, hover `:has()` sibling dim)
- Cookiebot banner kontrastas su nauja dark paletė nepatikrintas
- Newsletter CTA mygtukas pakeistas blue → cyan be A/B testo (per drąsus brand pakeitimas)
- 3 disabled kortelės užima vietą — UX galėtų būti švaresnis visiškai paslėpus

---

## ATLIKTA ANKSČIAU (2026-05-10 — cookiebot-integration)

### Cookiebot CMP įdiegtas (auto-blocking modelis)
- **Domain group ID**: `bc31b2c9-a2b7-44e8-a3a2-624b027ba646`
- **Mode**: Auto blocking (visi ne-būtinieji slapukai blokuojami iki sutikimo)
- **Įdėtas į 6 puslapius** (kaip pirmas script `<head>`):
  - `index.html`, `slapukai.html`, `blog.html`, `brief.html`, `blog/template.html`
  - 3 blog post'ai: bdar-baudos, nis2-direktyva, phishing-mokymai
- **Cookiebot CDN verified**: uc.js 200 OK, cd.js 200 OK

### `slapukai.html` NEW (KI-005 BDAR partial fix)
- **9-skyrių slapukų politika** (LT, BDAR/e-Privatumo direktyvos atitiktis)
- **CookieDeclaration script** (auto-generuoja realių slapukų sąrašą per Cookiebot CMP)
- **"Atnaujinti slapukų sutikimą" mygtukas** via `Cookiebot.renew()`
- Nav + footer sync su `blog.html` (toks pat stilius)
- Hero sekcija: dark theme + crumbs + meta info
- Skyriai: 1) Kas yra slapukai, 2) Tipai (4 kategorijos), 3) Sąrašas (Cookiebot), 4) Valdymas (per skydą + naršyklę), 5) Trečiosios šalys, 6) Teisinis pagrindas (BDAR + e-Privatumo + LR ERĮ 73 str.), 7) Teisės, 8) Pakeitimai, 9) Kontaktai

### Pašalinta (custom cookie banner — XSS rizika)
- **HTML**: `#cookie-banner` div'as (16 lines, inline `onmouseover` rizika)
- **JS**: `acceptCookies()` + auto-show timer + localStorage logic (14 lines)
- **CSS**: `@keyframes slideUp` (2 lines)
- **Modal**: `#modal-cookies` orphan (32 lines, niekam nebereikalingas)

### Atnaujinta
- Footer linkas `Slapukų politika`: `openModal('modal-cookies')` → `/slapukai.html`
- Cache-buster: `v=20260510` → `v=20260510b`

### Bundle commit `0e51dcf` (push'intas į main)
Vienas commit'as su:
- Cookiebot integracija (šios sesijos darbu)
- Sesijos #8 premium dark tier 9 sekcijų darbu (uncommitted nuo 2026-05-10 vakar)
- Sesijos #8 docs (PROJECT_STATUS, SESSION_STATUS, structure.md)

**Failai**: 13 changed, +3516 / -571 lines | NEW: `slapukai.html`

### Production verifikacija (po push)
- Vercel build: 🟢 Ready 15s
- `https://www.veriva.lt/` — 200 OK su Cookiebot script
- `https://www.veriva.lt/slapukai` (Vercel clean URL) — 200 OK
- `/blog`, `/brief`, 3 blog post'ai — visi 200 OK (308→200 redirect)
- CSS asset (83KB) + JS asset (12KB) — 200 OK
- Custom cookie banner — production neturi (XSS pašalinta)
- Footer linkas — `/slapukai.html` veikia

### Tools naudoti
- `AskUserQuestion` ×2 (custom banner sprendimas, GCM, declaration page; bundle commit scope)
- `Grep` × 12, `Edit` × 11, `Read` × 9, `Bash` × 14
- Lokalus HTTP servas (port 5174) prieš commit verifikacijai

---

## ATLIKTA ANKSČIAU (2026-05-10 — premium-dark-tier-redesign)

### Brand language: premium dark tier (taikoma visose perdirbtose sekcijose)
- `--ink` background + radial mesh (cyan + blue blobs)
- Mono kicker (`var(--ffm)` JetBrains Mono 11px, `.18em` letter-spacing) + glowing cyan dot
- H2: Syne 800, `clamp(36px,4.4vw,56-60px)`, `<em>` accent rgba(255,255,255,.5) monotone
- Cards: glass `rgba(255,255,255,.04→.02)` + 1px white .07 border + 20px radius + cyan glow shadow ant hover
- Top accent line `::before` (cyan gradient hairline, opacity .5→1 ant hover)
- Sibling dim per `:has()` selector (Linear focus pattern)
- All transitions su `--ease-out:cubic-bezier(.23,1,.32,1)` (Kowalski strong curve)
- All hovers gate'inti už `@media (hover:hover) and (pointer:fine)`
- All animations respect `@media (prefers-reduced-motion:reduce)`
- Pridėtos 2 fonts (JetBrains Mono 400/500) iš Google Fonts
- Pridėtas `<svg>` sprite po `<body>` su `procGrad` linearGradient + `procGlow` filter (reuse'inami visose dark sekcijose)

### Sekcijos perdirbtos (7 viso)

**1. `#paslaugos` — `.svc-bg` premium dark tier**
- HTML: 3 `<article class="sc">` su `data-r` stagger reveal
- 3 unikalūs CTA pagal paslaugos kontekstą: "Užsisakyti BDAR auditą" / "Įvertinti IT rizikas" / "Suplanuoti mokymus"
- Stat block: €0 / 90 d. / 34→4% (vietoj generic ✅)
- Cursor-follow cyan glow per JS (`pointermove` ant `.svc-grid`, rAF debounced, CSS `--mx`/`--my` vars)
- Step indeksai: `01/03`, `02/03`, `03/03` mono top-right corner
- Schema.org `ItemList` su 3× `Service` (provider, areaServed=LT)

**2. `#auditas` — `.proc-bg` premium dark tier**
- 5-step zigzag layout (alternating left/right)
- Custom 5 SVG illustrations (400×320 viewBox, scenic compositions su `procGrad` gradient + `procGlow` filter)
- Mono `Step 01 / 05` indeksas vietoj outline 140px Syne (Linear/Stripe pattern)
- 5 P0 + 5 P1 + 4 P2 polish fix'ai (vertical rhythm, typography hierarchy, hover micro-interactions)

**3. `#komanda` — `.team-bg` premium dark tier**
- 2-col grid (`.team-grid` repeat(2,1fr) max-width 920px)
- HTML perstatymas: pašalinti VISI inline `style` ir `onmouseover/onmouseout` (XSS rizika)
- Justinas: 96×96 photo su dual-layer ring (1px white inset + 4px cyan halo .08)
- Marina: premium monogram (radial blue+cyan + ink gradient + grid pattern + Syne 38px su cyan text-shadow)
- Mono trust badges: "9+ METAI · NIS2 · INCIDENT RESPONSE" / "8+ METAI · BDAR · DPO · VDAI"
- LinkedIn ikona (30×30 button) greta tel:
- Avatar reveal sub-animation: `scale(.85)→1` su delay
- Schema.org `Person` JSON-LD ×2 (jobTitle, telephone, knowsAbout, worksFor:#organization)

**4. `#apie` — `.about-bg` premium dark tier**
- H2 reframe: "BDAR atitiktis ir kibernetinis saugumas — teisė ir IT vienoje komandoje" → **"8 metai. 120 audituotų įmonių. €0 VDAI baudų."** (data-driven, ne dubliuoja H1)
- Linear hairline stats strip (4-col, 1px gradient separators)
- Count-up scroll-in animacija per JS: `0 → 8+/120+/€0/15+` per 1.4s ease-out quart, threshold .5
- Manifesto stilius: lede (Syne 22) + 2 tight body paragraphs (~80 žodžių)
- "Why Veriva" hairline list (4 differentiators, no boxes)
- Įmonės info — hairline-top mono block (no card)
- CTA ghost link: "Susipažinkite su mūsų darbo metodika →"
- Schema.org `Organization` enhanced: `numberOfEmployees:5`, `slogan`, `award:"€0 VDAI baudų..."`
- ⚠️ Pirmoji versija buvo light tier (`--g50` cream), bet vartotojas paprašė atstatyti brand consistency → konvertuota į dark

**5. `#atsiliepimai` — `.case-bg` premium dark tier**
- 3 case studies (`<article class="case">`) — Logistika / Medicina / Fintech
- Top stat block: "34% → 4%" / "€150K+" / "3h → €0" su tabular-nums
- Mono `.case-tag` su glowing cyan dot
- `.case-outcome`: cyan check SVG + drop-shadow (vietoj ✅ green box)
- Sektorių pills strip viduje sekcijos (8 sektorių, hover cyan)
- Bug fix: orphan markup po `</section>` (sektorių strip buvo už parent container'io)

**6. `#kainos` — `.price-bg` premium dark tier (perdirbtas 2× — Empirra style remake)**
- **v1**: 3 planai (Shy / Standard `plan-hi` / Advance) su CSS-only checkmark, cyan glow, tabular-nums, white CTA-hi
- **v2 (Empirra remake)**: vartotojas parodė screenshot'ą "tekstas suluzęs, nera vieno dominavimo plano, marketinginiu atzvilgiu labai silpanas sprendimas". Padaryta pilnas remake pagal Empirra `.plan.featured` pattern:
  - Featured kortelė `transform:scale(1.04) z-index:2` + ★ "Dažniausiai pasirenkamas" cyan gradient eyebrow viršuje + sibling `.plan-dim{opacity:.78}`
  - Tier badges (Starter/Growth/Premium) su skirtingomis spalvomis (white/cyan/gold)
  - Plan name: Syne 26-30px (vietoj 11px mono)
  - Plan tag (sub-headline): "Bazinė BDAR atitiktis. Viskas, ko reikia... Per 14 d."
  - Price `white-space:nowrap` + sumažintas font (clamp 26-32px) — tilpsta vienoje eilutėje
  - **NEW** `.plan-replaces` — ką klientas nustoja mokėti ("BDAR konsultantą įmonėje · 3 500–6 000 €/mėn")
  - **NEW** `.plan-payback` — ROI signalas ("Atsiperka: ~2 mėn.")
  - **NEW** `.plan-saves` (TIK featured) — "~3 500 € sutaupote per metus" su cyan glowing big number
  - **NEW** `.plan-guarantee` — gold accent box ("Garantija: Atitiktis per 7 d. — arba toliau dirbame nemokamai")
  - **NEW** `.plan-list-no` — excluded items su gray dash (rodo, ką gauti upgrade'inus)
  - Outcome-driven CTA: Standard "Atitiktis per 7 d. — garantuojame raštu" (vietoj "Pasirinkti planą")

**7. `#blog` — `.blog-bg` premium dark tier**
- 3 post kortelės (`<a class="post">`) su gradient mesh top visual + grid pattern + masked corners
- `.post-cat-mark` — didelis Syne 800 kategorijos žymeklis ant vizualo
- Sibling dim per `:has()` Linear focus pattern
- `.blog-all-cta` ghost mygtukas su arrow translateX hover

**8. `#faq` — `.faq-bg` premium dark tier**
- 12 Q&A 2-col grid (max 1040px), mono kicker + Syne 800 H2 + sub paragraph
- **+ ikona** (12 vietų) → SVG plus icon (rotate 45° ant `.open`)
- Cyan accent ant rotate'into ikono + border-bottom .18 cyan tint kai atviras
- `aria-expanded` toggle + a11y compliant
- `:focus-visible` cyan outline
- HTML balanso bug ištaisytas (orphan `</div>` po `.faq-inner` wrapper'io pašalinimo)

**9. `#kontaktai` — `.contact-bg` refreshed**
- Mono kicker `.contact-tag` su glowing cyan dot
- H2 Syne 800 + `<em>` rgba(.5) monotone
- `<span>` semantic + `aria-labelledby`

### Cleanup (CSS dead code pašalinta)
- `.svc-grid + .sc-line/-ico/-title/-desc/-items/-result/-link` (light cream variant)
- `.testi-bg + .tc + .tc-stars/-text/-author/-av/-name/-role/-result/-result-hero/-av-wrap/-av-verified/-sector` (light variant)
- `.pgrid + .pc/.pc-name/.pc-price/.pc-cycle/.pc-desc/.pc-outcome/.pc-list/.pc-chk/.pc-badge/.pc.hi + .btn-pw/.btn-po/.btn-pb` (~30 lines dead)
- `.blog-bg{white}/.bc/.bc-img/.bc-meta/.bc-cat/.bc-dot/.bc-title/.bc-excerpt/.bc-read/.bc-read-arrow/.btn-blog-all` (~16 lines)
- `.faq-bg{white}/.faq-inner/.faq-list 1fr 1fr/.faq-col light/.fq light hover/.fi-ico circle/.fi.open .fi-ico/.fa-in light` (~10 lines)
- `.contact-tag{old cyan UPPERCASE}/.contact-h em{cyan}` (sena versija)
- `.plan-badge{old}/.plan-cycle/.plan-desc/.plan-outcome cyan box` (po Empirra remake)
- Mobile rules: `.testi-grid`, `.pgrid`, `.pc.hi{transform:none}` pašalinti
- Visi inline `style="..."` HTML perdirbtose sekcijose (~50+ atributai)
- Visi `onmouseover/onmouseout` (XSS rizika) — komandos kortelėse
- 12× `<span class="fi-ico">+</span>` emoji → SVG plus ikonos (FAQ accordion)

### Skill / agent / tool naudojimas
- `emil-design-eng` skill — design tokens + Before/After lentelės kiekvienai sekcijai (Kowalski lygis)
- `polish` skill — P0+P1+P2 audit ant `.svc-*` (26 issues fixed)
- `marketing-analitikas` agent — copy/SEO/CTA/Schema rekomendacijos
- `general-purpose` agent — automationempire.ai layout research (zigzag pattern)
- WebFetch — Stripe Atlas / Linear / Mercury / Vercel premium kortelių patternai

### CSS metrikai (po visų pakeitimų)
- `assets/css/index.css`: 590 → **2573 lines** (~83KB), 708/708 braces valid
- `assets/js/index.js`: 276 → **324 lines** (count-up + cursor-follow + faq() rewrite)
- `index.html`: 1127 → ~1500 lines, **0 inline styles** perdirbtose sekcijose, **0 inline JS handlers** (išskyrus 2 footer link colors `#kontaktai` cf-note bloke)

### Schema.org enhancements
- `Organization`: pridėta `numberOfEmployees`, `slogan`, `award`
- `ItemList` × 3 `Service` (#paslaugos)
- `Person` × 2 (Justinas, Marina, #komanda)

---

## SAVO ĮVERTINIMAS

**SAVO ĮVERTINIMAS: 7/10**

**Iki 10 trūksta:**
- C žingsnis (QA naršyklėje) NEPADARYTAS — visi pakeitimai verifikuoti tik per curl/CSS token check'us, ne reali Chrome/Firefox/mobile DevTools sesija. Pricing tekstas suluzęs problema atrasta per vartotojo screenshot'ą, ne mano paties verifikaciją.
- `#apie` sekcija padaryta 2× (pirma light tier, vartotojas paprašė atstatyti dark) — turėjau klausti pirma, prieš pradėdamas darbą su skirtingu tier'iu.
- Pricing perdarytas 3× — reikėjo iškart palyginti su Empirra (donor projektu), o ne po vartotojo nepasitenkinimo.
- HTML balansas FAQ sekcijoje sumažintas 2× netaisyklingai prieš pataisydamas (`___DUMMY___` artefaktas, orphan `</div>`).
- Likę 2 inline styles `#kontaktai` bloko cf-note (footer link colors `style="color:rgba(255,255,255,.38)"`).
- Privatumas.html `<p><strong><strong>` paveldėtas HTML klaidą — pamatyta, bet ne ištaisyta (palikta kaip "out of scope").

---

## P1 NEPATRAUKTI (sekantis sesijos kandidatai)
- ✅ Blog/FAQ/Contact PERTVARKYTOS šioje sesijoje (nebe `nepertvarkytos` kaip ankstesniame snapshot'e)
- C žingsnis: realus QA naršyklėje (Chrome + Firefox + mobile DevTools + Lighthouse)
- A žingsnis: git commit + push į main (production deploy ant veriva.lt)
- Hero sekcija lieka NEPERTVARKYTA — sąmoningai (atskaitos taškas)
- Real foto Marinai (dabar premium monogram fallback)
- Realūs LinkedIn URL'ai (dabar `https://www.linkedin.com/` placeholder)
- Pavardės publikuoti? (dabar tik vardai)
- Likę 2 inline styles `#kontaktai` cf-note (footer link colors)
- Privatumas.html paveldėta klaidą `<p><strong><strong>` (eil. 1061)

---

## ANKSTESNĖ SESIJA (2026-05-10 — vercel-migration)
**Data**: 2026-05-10
**Sesijos tikslas**: UX patobulinimai (FAQ, email, nav) + brief audit klausimynas + KI-004 index.html split + Vercel deploy fix + DNS migration WP → Vercel

---

## ATLIKTA ANKSČIAU (2026-05-10 — vercel-migration)

### UX patobulinimai
- ✅ **FAQ 2 stulpeliai** — index.html 12 Q&A perdaryta į grid 2 cols (6+6) desktop / 1 col ≤760px su animation-safe `align-items:start`
- ✅ **Plain email vietoj Cloudflare obfuscation** — pašalinta 7 vietose (`[email protected]` → `info@veriva.lt` mailto), nes Cloudflare `email-decode.min.js` neveikia ne-Cloudflare hosting'e
- ✅ **Nav parity blog.html ↔ index.html** — blog.html nav perdaryta į 8 punktų meniu (Paslaugos/Apie/Komanda/Kaip dirbame/Rezultatai/Kainos/Tinklaraštis/Susisiekti), `position:fixed` (60px), mobile breakpoint 768→900px, full-screen overlay menu
- ✅ **BDAR widget realūs duomenys** — index.html widget'as perdarytas su VDAI 2018-2025 baudų statistika (3K/12K/75K/350K vietoje sugalvotų 5K/25K/120K/600K), pažeidimo tipo koeficientai (sveikatos 3x, saugumo 2.5x, dok. 1.5x), cap pagal įmonės dydį, Vinted €2.4M outlier disclaimer 250+ + kritinė rizika scenarijuje, šaltinis "Pagal VDAI 2018–2025 baudų statistiką"

### `brief.html` — pirminis BDAR/duomenų saugos klausimynas (NEW)
- ✅ 4 sekcijos × 59 klausimai (originalūs Google Form 56 + 3 papildomi neprivalomi: prioritetai, timeline, komentarai)
- ✅ Konditional logika: K3 "Kokia veikla" → filtruoja medicinos vs verslo opcijas; `{pacientų/klientų}` placeholder'iai dinamiškai keičiasi
- ✅ 5 multi-select klausimai (K7,K8,K11,K45,K47) — patobulinimas vs Google Form radio'ų
- ✅ Progress bar (sekcija X iš 4 + procentai), validation, 3 states (form/success/error)
- ✅ Submit fallback: POST /api/forms/audit-request → localStorage backup
- ✅ Veriva brand (Syne + Plus Jakarta Sans, --ink/--blue/--gold), noindex,nofollow
- ✅ Link'as iš index.html BDAR widget'o rezultato sekcijos: "Norite tikslesnio vertinimo? → užpildyti detalų klausimyną"

### KI-004 index.html split (token optimizavimas)
- ✅ `assets/css/index.css` (590 lines, 32K) — pagrindinis CSS + slideUp keyframe
- ✅ `assets/js/index.js` (276 lines, 11K) — widget logic, FAQ, modals, cookie banner
- ✅ index.html: 1995 → 1127 lines (-43%, -868 lines)
- ✅ Pašalintas Cloudflare email-decode `<script src>` (nereikalingas)
- ✅ Cache-buster `?v=20260510` ant CSS+JS
- ✅ Visi 10 inline event handler'ių (faq, widgetCTA, openModal, ...) verifikuoti — defer load veikia
- ✅ JSON-LD schemos (ProfessionalService + FAQPage) palieku inline (SEO)
- 📊 Token sutaupymas: CSS keitimui 110K → 8K (-92%), JS keitimui 110K → 3K (-97%)

### Vercel deploy fix (kritinis blocker)
- 🔴 **Diagnozė**: Vercel build fail'inosi 9 kartus per 21h (Production + Preview), paskutinis sėkmingas deploy 48 dienų senas. Visi commit'ai nepasiekė production'o.
- ✅ **Fix #1** (`fca76a9`): pašalintas invalid `"runtime": "edge"` blokas iš `vercel.json` `functions` (formatas deprecated, runtime jau deklaruotas TS failuose per `export const config = { runtime: 'edge' }`)
- ✅ **Fix #2** (`6974806`): pridėtas `"buildCommand": null` + `"outputDirectory": "."` (statinė svetainė root'e, ne `/public/`)
- ✅ Build #1 po fix #1 — Error (output dir missing)
- ✅ Build #2 po fix #2 — **READY** (deploy `lyvbrbbmk`, 27s build)
- ✅ Visi 10 URL'ų ant `veriva-geras.vercel.app` → 200 OK

### DNS migration WordPress → Vercel
- ✅ Vercel domain'ai pridėti (vartotojo): `veriva.lt` + `www.veriva.lt`
- ✅ Hostinger DNS pakeitimas (vartotojo, 4 veiksmai per UI):
  - Ištrinta: `A @ 35.198.136.225` (sena WP)
  - Ištrinta: `CNAME www → veriva.lt` (sena WP)
  - Pridėta: `A @ 76.76.21.21` (Vercel)
  - Pridėta: `CNAME www → cname.vercel-dns.com` (Vercel)
- ✅ Email konfigūracija išsaugota: 5 record'ai NEPALIESTI (Zoho `_zmail._domainkey` DKIM, SPF, verification, 3× MX → `mx{1,2,3}.zoho.eu`)
- ✅ DNS propagation patvirtinta 6 globaliais resolvers'ais (Google 8.8.8.8/8.8.4.4, Cloudflare 1.1.1.1, Quad9 9.9.9.9, OpenDNS, Yandex)
- ✅ HTTPS test: `www.veriva.lt` → 200 OK, **Server: Vercel**, visi 10 URL'ų live
- ✅ WordPress mirė: `/wp-admin/` → 307 redirect į Vercel
- ⏳ **Apex SSL sertifikatas** (`https://veriva.lt/` be www) dar neissued — paliktas background task, vartotojui matomas warning naršyklėje

### Vercel CLI setup (claude code dirbtų)
- ✅ Patvirtinta auth: `pinigine1-6549` user
- ✅ Repo link'inta su projektu: `vercel link --yes --project veriva-geras` → `.vercel/project.json` sukurtas (gitignored)
- ✅ Galiu daryti `vercel ls`, `vercel inspect`, `vercel project inspect` (read-only) — DNS endpoint'ams reikia atskiros prieigos

### Commit'ai (6 viso, push'inta į origin main)
- `c5e14e6` feat(blog): BDAR baudos pillar postas + template v2 polish (sesijų 4-5 likučiai)
- `d011841` feat(ui): FAQ 2 stulpeliai, plain email, nav parity, BDAR widget realūs duomenys
- `60f9d56` feat(brief): pirminis BDAR ir duomenų saugos klausimynas
- `9328cef` refactor(index): KI-004 — extract inline CSS/JS to /assets
- `fca76a9` fix(vercel): remove invalid functions runtime config
- `6974806` fix(vercel): static site config — outputDirectory + buildCommand

---

## P1 NEPATRAUKTI (palikti kitai sesijai)
- **Apex SSL sertifikatas** dar neissued — `https://veriva.lt/` browser'iui rodo SSL warning. Vercel išduos auto, bet sesijos pabaigoje nepatvirtinta.
- **Email integration test** — `info@veriva.lt` Zoho turi veikti (DNS record'ai nepaliesti), bet realus test email nepasiųstas
- **Google Search Console** — sitemap submit + 3 blog URL request indexing dar nepadaryta
- **WordPress hosting cancellation** — Hostinger WP instalacija vis dar veikia, niekas į ją nepatenka. Palauti 7 dienas, paskui cancel.
- **Vercel primary domain** — pasirinkti ar `veriva.lt` ar `www.veriva.lt` kaip primary (Vercel UI: Domains → set primary). Šiuo metu apex 307 → www.

---

## ANKSTESNĖ SESIJA (2026-05-10 — nis2-phishing-publish)

### 2 nauji pillar postai (audit health 19/20 self / 17/20 frontend-revizorius)
- ✅ `blog/nis2-direktyva-lietuvoje.html` (1194 eil., ~3700 ž.) — NIS2 direktyva Lietuvoje 2026
  - 10 H2 sekcijų, 12 FAQ Q&A, 5 schemas (BlogPosting + Breadcrumb + FAQPage + HowTo + Review)
  - Author: Justinas (IT saugumo ekspertas)
  - 3 SVG: hero (1200×630), subjektų klasifikacija (1100×360), 10 saugumo priemonių (1100×480)
- ✅ `blog/phishing-mokymai-darbuotojams.html` (1118 eil., ~3100 ž.) — Phishing mokymai
  - 10 H2, 12 FAQ, 5 schemas
  - Author: Justinas
  - 3 SVG: hero (phishing email mockup), 5 etapų atakos anatomija, 12 mėn. mokymų bar chart
  - 6 oficialūs ext šaltiniai: Verizon DBIR, KnowBe4, IBM, FBI IC3, ENISA, EDPB

### Pre-publish audit ratas (4 nepriklausomi agentai)
- ✅ `seo-specialistas` — NIS2 7/10, Phishing 6.5/10. Rado 6 P0 + 14 P1 fixes
- ✅ `qa-tester` — NIS2 PASS, Phishing FAIL (1 P0: JSON-LD parse error line 208)
- ✅ `frontend-revizorius` — abu 17/20 (ne 19/20 self) — `<time datetime>` ir FAQ IIFE trūksta
- ✅ `marketing-analitikas` — NIS2 7.5/10, Phishing 8/10. CTA #2 mygtukai abu generic

### P0 fixes (commit `d9cc6e7`)
- ✅ Phishing JSON-LD parse error: `„Shame and blame"` → `Shame-and-blame` (LT/ASCII quote bug)
- ✅ Meta description sutrumpintos: NIS2 186→149 chr, Phishing 212→148 chr
- ✅ NIS2 title: 66→54 chr; Phishing title + H1 KW alignment ("Phishing mokymai darbuotojams")
- ✅ CTA #2 mygtukai: NIS2 "Gauti atotrūkio analizę", Phishing "Aptarti simuliacijų programą"
- ✅ Slug rename (be 301 problemos — kol nedeploy'inta):
  - `nis2-direktyva-praktiskai.html` → `nis2-direktyva-lietuvoje.html`
  - `phishing-darbuotoju-mokymai.html` → `phishing-mokymai-darbuotojams.html`
- ✅ Atnaujinta: 2 post failai (canonical + og:url + schema @id + share — 11 vietų), index.html teaser kortelės, blog.html listing, sitemap.xml

### Deploy
- ✅ `git push origin main`: `c2bd4ff..d9cc6e7` (3 commits) → Vercel auto-deploy
- ✅ Lokalus HTTP server testas (port 8000): visi 4 URL'ai 200 OK
- ⚠️ Live veriva.lt po deploy NEPATIKRINTAS (Vercel build status, SSL, schema.org rich results)

---

## P1 NEPATRAUKTI (audit'ai rado, palikti kitai sesijai)
- `<time datetime="2026-05-10">` markup trūksta abu postai (paveldėta iš BDAR template'o)
- Keyword density per aukšta: NIS2 "NIS2" 6.2% (191×), Phishing "phishing" 7% (217×) — galima "helpful content" rizika
- Phishing "Lietuv*" tik 6 paminėjimai (NIS2 turi 43) — B2B LT targeting silpnas
- TL;DR / Key takeaways blokas — abu neturi (2026 GEO standartas)
- NIS2 → Phishing cross-link trūksta (Phishing → NIS2 yra)
- FAQ accordion JS ne IIFE wrapped (nesutampa su template stiliumi)
- Testimonial `aria-label` ant `<div>` → `role="img"` papildymas
- "Susiję straipsniai" vizualus blokas po FAQ — template'o `{{RELATED_POSTS_HTML}}` placeholder neperduotas
- NKSC + e-tar.lt URL'us reikia patvirtinti naršyklėje (WebFetch grąžino 403)

---

## ATLIKTA ANKSČIAU (2026-05-10 — blog-polish-publish)

### Blog post #1 — polish iki publish-ready (2846 ž., audit health 19/20)
- ✅ FAQ sekcija išplėsta 5→12 klausimų 2 stulpeliais (`.faq-grid`) + naujas `.faq-grid` CSS
- ✅ FAQPage JSON-LD išplėstas iki 12 Q&A
- ✅ HowTo schema pridėta (5 žingsnių planas — totalTime: P30D, estimatedCost: 500 EUR)
- ✅ Review schema pridėta (5/5 testimonial — Tomas K.)
- ✅ Visi 4 šaltinių URL'ai patikrinti per WebFetch (EUR-Lex + EDPB OK; VDAI 2× grąžina 403 bot blokavimas — realioje naršyklėje veikia)

### Vizualiniai komponentai
- ✅ 3 SVG iliustracijos sukurtos: `bdar-baudos-hero.svg` (1200×630), `vdai-baudos-skaiciavimas.svg` (1100×360), `bdar-atitiktis-5-zingsniai.svg` (1100×480) — 21 KB total
- ✅ `<figure>` komponentas su aspect-ratio fallbacks (CLS prevention)
- ✅ Testimonial blokas su Schema.org Review microdata + 5 SVG žvaigždutės
- ✅ Open Graph image + Twitter Card image atnaujinti
- ✅ BlogPosting schema su image array (3 ImageObject)

### Frontend revizija (typography + animations)
- ✅ frontend-revizorius agentas: 12 selector'ių sulyginta su index.html brand sistema
- ✅ Animate skill (Kowalski): scroll reveal IntersectionObserver, FAQ smooth easing, hover micro-interactions
- ✅ TOC label šriftas: Syne → Plus Jakarta Sans (eyebrow standartas)
- ✅ Nav 1:1 su index.html (fixed top:0, height:60px, blur:20px, 7 linkai + CTA)
- ✅ Author Marina Kazlauskienė → Marina (M initial — be pavardės)

### Polish pass (audit → polish workflow)
- ✅ `/audit` ataskaita: 16/20 → P0×3, P1×7, P2×9, P3×5
- ✅ `/polish` įvykdyta visus P0+P1+P2 fixes:
  - **P0**: `<main>` landmark + skip-link + `:focus-visible` global + callout `--gold` 2.56→5.96 contrast
  - **P1**: FAQ `aria-expanded` + `aria-controls` (JS), `<header>` semantinis tag, `<nav aria-label>`, hamburger aria, ah-crumbs/ah-ar contrast +60%, `--g500` darker (3.78→5.03), figcaption `--g700`
  - **P2**: `--red` + `--gold-strong` + `--g600` tokens į `:root`, hover `(hover:hover)` wrap, share-btn 40/44px touch, hero gradient opacity 0.18→0.10
- ✅ Visi kontrastai dabar atitinka WCAG AA (4.5:1+)

### Publish (2026-05-09 → live ready)
- ✅ DRAFT banner pašalintas + `noindex,nofollow` → `index, follow`
- ✅ Layout pataisytas: body padding-top 90→60, nav top 30→0, mob-menu top 90→60
- ✅ `index.html` blog teaser kortelė atnaujinta į realų postą
- ✅ `blog.html` pirma kortelė atnaujinta
- ✅ `sitemap.xml` su `<image:image>` namespace + lastmod 2026-05-09

### Standartizavimas (visi būsimi postai)
- ✅ `blog/template.html` v2 — pilnai polished, 24 placeholder'iai, visi a11y/komponentai/JS
- ✅ `docs/blog-system-prompt.md` atnaujintas: testimonial bloką, hero figure, HowTo/Review schemas, naujas QA checklist
- ✅ `docs/blog-content-rules.md` author'iai: Marina (M), Justinas (J), Veriva komanda (V)
- ✅ `docs/structure.md` atnaujintas su naujais komponentais ir publish'intu postu

### Empirra skills kopijavimas (3 nauji)
- ✅ `.claude/skills/audit/` — techninio audito skill (5 dimensijos, P0-P3 ataskaita)
- ✅ `.claude/skills/polish/` — final pass skill (CSS tokens, a11y, micro-interactions)
- ✅ `.claude/skills/emil-design-eng/` — Kowalski design philosophy reference
- ✅ `/impeccable` dependencija pakeista į Veriva-specific kontekstą (CLAUDE.md + emil-design-eng)

---

## ATLIKTA ANKSČIAU (2026-05-09 — seo-faq-blog)

### index.html SEO/GEO optimizacija
- ✅ FAQ sekcija išplėsta nuo 5 iki 12 klausimų (5 pagerinti + 7 nauji): VDAI, BDAR smulkiam verslui, baudos, DPO, asmens duomenų pažeidimas, slapukai, NIS2, IT auditas, kaina, sektoriai, advokatai, sutartys
- ✅ ProfessionalService schema išplėsta (21 laukai): geo coords, addressRegion, areaServed (Country+City), priceRange, taxID/vatID, knowsAbout, contactPoint
- ✅ FAQPage JSON-LD pridėtas (12 Q&A) — atitinka Google Rich Results
- ✅ Meta tags atnaujinti: title (52 chr, BDAR pirmas), description (153 chr), 12 LT keywords, Twitter Card, GEO meta (geo.region=LT-VL, ICBM)
- ✅ Telefono fix schema'oje: `+37061061981` → `+37064003632` (pagrindinis)
- ✅ FAQ CSS max-height 300→600px (naujieji ilgesni atsakymai)

### Blog post #1 — BDAR baudos Lietuvoje 2026 (DRAFT, noindex)
- ✅ `blog/bdar-baudos-lietuvoje.html` — pillar 2846 žodžių, 15 min skaitymo
- ✅ SEO research: 40 LT keywords + WebSearch realių 2025-2026 VDAI/EDPB duomenų (Vinted €2,38M bauda, MisterTango €61,5K, ES €1,15 mlrd. 2025)
- ✅ 11 H2 + 33 H3, evergreen slug `/blog/bdar-baudos-lietuvoje.html`
- ✅ JSON-LD: BlogPosting + BreadcrumbList + FAQPage (5 Q&A)
- ✅ Komponentai: definition, callout×2, stat-hl, blockquote, CTA inline×2, TOC (10 punktų)
- ✅ Meta: title 52 chr, description 156 chr, keywords (12), canonical
- ✅ 29 vidiniai linkai + 4 išoriniai autoritetingi (VDAI, EUR-Lex, EDPB)
- ✅ Autorius: Marina Kazlauskienė (BDAR/teisė)
- ✅ DRAFT banner + `noindex, nofollow` (peržiūrai prieš publikuojant)

---

## ATLIKTA ANKSČIAU (2026-05-09 — empirra-sync)

### Memory sistema (NEW)
- ✅ Sukurta projekto memory namespace `~/.claude/projects/c--Users-pinig-Veriva-geras/memory/` su 10 failų:
  - `MEMORY.md` — index
  - `user_profile.md` (Empirra owner + Veriva BDAR/IT sauga LT B2B)
  - `feedback_communication.md`, `feedback_autonomy.md`, `feedback_workflow.md`
  - `project_state.md`, `project_stack.md`, `project_rules.md`
  - `reference_empirra.md`, `reference_files.md`

### Docs (NEW — Empirra parity)
- ✅ `docs/automation-standards.md` — Edge Function kodo template, error kategorijos, thin endpoint, retry policy, edge cases (adaptuota Veriva flat root struktūrai)
- ✅ `docs/services-and-limits.md` — external services, `printf` vs `echo` CLI, BDAR apribojimai
- ✅ `docs/build-process.md` — 8-žingsnių build seka + automatizacijų checklist
- ✅ `docs/lib-strategy.md` — vendor independence + 7 principles + per-endpoint secrets

### Root (NEW — Empirra parity)
- ✅ `INCIDENT_LOG.md` — production post-mortem šablonas
- ✅ `KNOWN_ISSUES.md` — 8 esamų issues (KI-001..KI-008) su SLA klasifikacija
- ✅ `ROLLBACK_CHECKLIST.md` — triggers + žingsniai + decision tree (be `git reset --hard`)
- ✅ `TEST_PROTOCOL.md` — 4 lygių testavimas + BDAR-specific testai (Cookiebot, consent, DPO)
- ✅ `WORKFLOW.md` — Claude Code instrukcija (10 aukso taisyklių, skills/agents matrica, Veriva-specific rules)

### .claude/ konfigūracija (NEW)
- ✅ `.claude/settings.json` — empty stub (Empirra hooks `src/pages/` → root nereikalingi Veriva flat root struktūrai)
- ✅ `.claude/settings.local.json` — Vercel/Resend/curl permissions (gitignored)
- ✅ `.claude/commands/deploy.md` — production deploy workflow su patvirtinimu
- ✅ `.claude/commands/test-contact.md` — contact endpoint test (su `x-api-key`)

### GitHub konfigūracija (NEW)
- ✅ `.github/dependabot.yml` — weekly dep updates (Europe/Vilnius monday 06:00, grouped minor/patch)
- ✅ `.github/workflows/health-check.yml` — daily 09:00 LT health endpoint check (laukia `HEALTH_SECRET` setup)

### Status sync
- ✅ `SESSION_STATUS.md`, `PROJECT_STATUS.md` atnaujinti iš ankstesnės blog sesijos (uncommit'inti diff'ai)

### Memory atnaujinta po sync
- ✅ `project_state.md` — sesijų count #3, sesija 3 įrašyta, blockers nurodo KI-001..KI-008 (KNOWN_ISSUES.md)
- ✅ `reference_files.md` — pridėti visi nauji autoritetai + docs + `.claude/` + `.github/`

---

## ATLIKTA ANKSČIAU (2026-05-09 — blog setup)

### Frontend
- ✅ `index.html` — pridėta `Tinklaraštis` sekcija (`#blog`, `blog-bg`) prieš FAQ su 3 placeholder kortelėmis (BDAR / NIS2 / Sauga)
- ✅ `index.html` — pridėtos CSS klasės: `.blog-bg`, `.blog-grid`, `.bc`, `.bc-img`, `.bc-img-icon`, `.bc-body`, `.bc-meta`, `.bc-cat`, `.bc-dot`, `.bc-title`, `.bc-excerpt`, `.bc-read`, `.bc-read-arrow`, `.blog-all`, `.btn-blog-all`
- ✅ `index.html` — `Tinklaraštis` linkas pridėtas į: desktop nav (`.nl`), mobile menu (`.mob-menu`), footer "Įmonė" stulpelis
- ✅ `index.html` — mobile responsive: `.blog-grid` įtraukta į esamą `@media(max-width:768px)` 1-col override
- ✅ **NEW** `blog.html` — listing puslapis: hero (dark) + filtrai (Visi/BDAR/NIS2/Sauga/DPO/Mokymai client-side `filterPosts()`) + 6 post kortelės + newsletter CTA blokas + footer
- ✅ **NEW** `blog/template.html` — blog post template'as su 19 `{{placeholder}}` laukų, paruoštas blog-gen automatizacijai

### Docs (SEO + GEO + brand)
- ✅ **NEW** `docs/blog-content-rules.md` — privalomos taisyklės (LT tonas, struktūra, SEO, GEO, schema.org, vidiniai linkai, CTA strategija, QA checklist)
- ✅ **NEW** `docs/blog-keywords.md` — LT keyword bank: 8 pillar straipsniai (P0/P1/P2), 5 cluster grupės, long-tail klausimų pavyzdžiai, konkurentų gap analizė
- ✅ **NEW** `docs/blog-system-prompt.md` — Claude API system prompt'as automatizacijai + Zod validation schema + template injection helper + QA auto-checks

### Docs sync
- ✅ `docs/structure.md` — atnaujinta `/` sekcija (faktinė tvarka su `#blog` poziciją prieš FAQ + nav linkų sąrašas)
- ✅ `docs/structure.md` — atnaujinta `/blog.html` sekcija (filtrai, schema, NĖRA paginacijos kol mažai posts)
- ✅ `docs/structure.md` — pridėta `/blog/template.html` sekcija (placeholder'iai, komponentai, schema.org)

---

## ATLIKTA ANKSČIAU (2026-05-09 — projekto inicializacija)

- ✅ Klonuotas repo `riko8825/Veriva-geras` į `C:\Users\pinig\Veriva-geras\`
- ✅ Sukurta folder struktūra: `assets/`, `api/`, `lib/`, `docs/`, `migrations/`, `.claude/`
- ✅ Sukurtas `CLAUDE.md` — projekto autoritetas
- ✅ Sukurti `SESSION_STATUS.md`, `PROJECT_STATUS.md`, `DECISION_LOG.md`
- ✅ Sukurtas `.gitignore`, `.env.example`, `package.json`, `tsconfig.json`, `vercel.json`, `README.md`
- ✅ Dokumentacija: `docs/structure.md`, `docs/brand-guidelines.md`, `docs/seo-strategy.md`, `docs/env-variables.md`
- ✅ Lib wrapperiai sukopijuoti iš Empirra: `auth.ts`, `errors.ts`, `logger.ts`, `ratelimit.ts`, `resend.ts`, `response.ts`, `supabase.ts`
- ✅ `lib/auth.ts` ir `lib/response.ts` perrašyti į Edge runtime variantą (Empirra versijos buvo Node-only)
- ✅ API endpoint'ai: `api/internal/health.ts`, `api/forms/contact.ts` (su validacija + IP hash)
- ✅ Migration: `migrations/001_init.sql` (leads, audit_requests, newsletter_subscribers + RLS)
- ✅ SEO foundation: `robots.txt`, `sitemap.xml`
- ✅ `.claude/README.md` — agentų/skills nuoroda į global

## DABARTINĖ BŪSENA

- Repo: `index.html` (1700+ eilučių monolitas su pridėta blog sekcija) + `blog.html` (listing) + `blog/template.html` (post template'as)
- Folder struktūra: paruošta + Empirra parity (docs, root files, .claude/, .github/)
- Backend: paruoštas folder, `lib/` wrapperiai vietoje, contact + health endpoint'ai sukurti
- Blog pipeline: docs paruošti, automatizacija — DAR NESUKURTA
- Multi-page: dar nesukurti puslapiai (paslaugos.html, apie.html, kainos.html, kontaktai.html, privatumas.html, slapukai.html, 404.html)
- Memory sistema: setup'inta (10 failų)
- Empirra parity: pasiekta — visi docs/root files/`.claude/`/`.github/` matching Empirra struktūrą (adaptuota Veriva flat root + BDAR konteksui)
- Git: 3 commit'ai push'inti į `origin/main` (`48e6830` chore: init, `879af1f` feat: blog, `93cf7b7` chore: empirra parity)

## KAS LIKO NEPATVIRTINTA (empirra-sync sesijos)

⚠️ **Workflow neaktyvūs**:
- `.github/workflows/health-check.yml` — `HEALTH_SECRET` GitHub Secrets nesetup'intas, pirmas cron run (kitos dienos 09:00 LT) fail'ins
- `dependabot.yml` aktyvuosis pirmadienį, bet `package.json` šiuo metu turi tik dev deps (TypeScript) — pirmoji savaitė tikriausiai be PR'ų

⚠️ **Docs konsistencija nepatikrinta**:
- `docs/automation-standards.md` import paths (`../../lib/...`) prieš faktinį Veriva `api/forms/*.ts` — gali būti +/-1 lygio neatitikimas vs Empirra `api/automations/[name]/route.ts`
- `KNOWN_ISSUES.md` KI-008 — "Supabase migrations neištaisytos production'e" — bet Supabase project'as gali būti net dar neegzistuojantis (issue formuluotė per stipri)

## KAS LIKO NEPATVIRTINTA (blog setup sesijos)

⚠️ **Naršyklėje neištestuota** — joks dev server'is nepaleistas, joks Vercel preview nedeploy'intas:
- `index.html` blog teaser sekcija — ar `.blog-grid` 3-col gridas teisingai veikia desktop'e ir griūna į 1-col mobile (≤768px)
- `blog.html` filtrai — ar `filterPosts()` JS teisingai slepia/rodo `.bc.hidden` korteles po kategorijų pasirinkimo
- `blog.html` newsletter forma — paspaudus rodo `alert()`, NĖRA POST'inimo (endpoint'as nesukurtas)
- `blog/template.html` — visiškai netestuotas su realiu turiniu (placeholder'iai dar neužpildyti)
- FAQ accordion `blog/template.html:441` — JS toggle'as parašytas, bet vizualiai netikrintas

⚠️ **Žinomos problemos**:
- 6 placeholder blog kortelės (`/blog/bdar-baudos-2026.html` ir kt.) — failai NEEGZISTUOJA, paspaudus → 404
- `sitemap.xml` neapima `blog.html` ir blog post URL'ų — Google neindexuos
- `blog/template.html` neturi sanitizacijos sluoksnio `{{POST_BODY_HTML}}` — paliekama blog-gen pipeline'ui

## KAS LIKO

### Etapas 1 — Frontend foundation
- [ ] Iš `index.html` išskirti CSS į `assets/css/base.css`, `components.css`
- [ ] Iš `index.html` išskirti JS į `assets/js/main.js`
- [ ] Sukurti `paslaugos.html` skeleton
- [ ] Sukurti `apie.html` skeleton
- [ ] Sukurti `kainos.html` skeleton
- [ ] Sukurti `kontaktai.html` skeleton
- [x] ~~Sukurti `blog.html` skeleton~~ ✅ 2026-05-09 (full listing su filtrais)
- [ ] Sukurti `privatumas.html` ir `slapukai.html` (BDAR privaloma)
- [ ] Sukurti `404.html`
- [x] ~~Sukurti `robots.txt`, `sitemap.xml`~~ ✅ ankstesnėje sesijoje

### Etapas 2 — Backend
- [ ] Kopijuoti reikalingus `lib/*` iš Empirra (auth, errors, logger, resend, response, supabase, ratelimit)
- [ ] Sukurti `api/forms/contact.ts`
- [ ] Sukurti `api/forms/audit-request.ts`
- [ ] Sukurti `api/internal/health.ts`
- [ ] Migration: `migrations/001_init.sql` (leads, audit_requests lentelės)

### Etapas 3 — Deploy
- [ ] Vercel projekto setup
- [ ] Env vars konfigūracija
- [ ] Domain: veriva.lt
- [ ] First deploy + smoke test

### Etapas 4 — Blog automation (paruošta — laukiama implementacijos)
- [x] ~~Blog frontend (index teaser + listing + template)~~ ✅ 2026-05-09
- [x] ~~Content rules + keyword bank + system prompt~~ ✅ 2026-05-09
- [ ] `api/internal/blog-gen.ts` — Claude API generavimo endpoint
- [ ] `api/internal/blog-publish.ts` — write į `/blog/{slug}.html` + sitemap update + listing update
- [ ] Telegram approval flow (kaip Empirra `blog-approve`)
- [ ] Cron / Vercel scheduled function (4-6 straipsniai/mėn.)
- [ ] Newsletter form prijungimas (`/api/forms/newsletter`)

## KITAS ŽINGSNIS (sekanti sesija — 1-3 konkretūs žingsniai)

1. **`privatumas.html` (paskutinis KI-005 BDAR blocker)** — teisinis reikalavimas BDAR. Stilius identiškas `slapukai.html` (cream bg + dark hero + 9-10 skyrių). Reikia: duomenų valdytojas (Veriva UAB), kontaktai, tvarkymo tikslai (lead form, newsletter, BDAR widget), teisinis pagrindas (BDAR 6 str.), saugojimo terminai, jūsų teisės, DPO kontaktas.
2. **Hero sekcija index.html premium dark tier sync** — vienintelė sekcija, kuri dar liko ankstesnio stiliaus. Reikia perdaryti pagal naują brand language (radial mesh + mono kicker + Syne 800 H2 + cyan accent), kad svetainė būtų 100% vientisa.
3. **Cookiebot dashboard verify** — patikrinti LT kalba, domeno whitelisting (`veriva.lt` + `www.veriva.lt`), incognito naršyklėje patvirtinti banner pasirodo. Jei nepasirodo — domeno whitelist'as Cookiebot dashboard'e neatliktas.

**Alternatyvos:**
- 🅰️ **Multi-page skeletons** (paslaugos.html, apie.html, kainos.html, kontaktai.html, 404.html) — visi linkai iš nav vis dar `/#section`, tikriausiai veiks tik scroll'inant index'e
- 🅱️ **Likę 3/6 placeholder blog post'ai** (KI-001 full fix): dpo-funkcija, incidentu-valdymas-72h, darbuotoju-bdar-mokymai — naudojant template v2 + 4-agent pre-publish ratas
- 🅲 **Backend setup** (KI-007, KI-008): Supabase project + migrations + env vars Vercel'yje, Resend API key, contact endpoint live test
- 🅳 **Google Search Console** — add property, submit sitemap, request indexing 3 blog URL'ams
- 🅴 **WordPress hosting cancellation** (po 7 dienų stabilumo verifikacijos) — sutaupys hosting mokestį
- 🅵 **Newsletter endpoint** (KI-002): `/api/forms/newsletter`, dabar tik `alert()` — duomenys prarandami

**Rekomendacija**: 1 (paskutinis BDAR teisinis blocker) → 2 (vizualinis polish 100% brand consistency) → 3 (Cookiebot verify 5 min). Po to — 🅰️ multi-page skeletons.

---

## ISTORIJA

| Data | Sesijos tikslas | Komitai | Atlikta |
|---|---|---|---|
| 2026-05-09 (init) | Projekto inicializacija | `48e6830` | Folder struktūra, `lib/` iš Empirra, config files, contact + health endpoint'ai, migrations, `docs/structure.md` + brand + SEO + env docs |
| 2026-05-09 (blog) | Blog sistemos paruošimas | `879af1f` | index teaser + `blog.html` listing + `blog/template.html` (19 placeholder'ių) + 3 docs (`blog-content-rules.md`, `blog-keywords.md`, `blog-system-prompt.md`) + docs sync |
| 2026-05-09 (empirra-sync) | Empirra parity — full project setup | `93cf7b7` | Memory (10 failų), 4 docs (automation-standards/services-and-limits/build-process/lib-strategy), 5 root files (INCIDENT_LOG/KNOWN_ISSUES/ROLLBACK_CHECKLIST/TEST_PROTOCOL/WORKFLOW), `.claude/` config + 2 commands, `.github/dependabot.yml` + `health-check.yml` workflow |
| 2026-05-09 (seo-faq-blog) | index.html FAQ SEO/GEO + pirmasis blog draft | uncommitted | index FAQ 5→12 Q&A + ProfessionalService schema (21 laukai) + GEO meta + 12 keywords; `blog/bdar-baudos-lietuvoje.html` pillar 2846ž. (DRAFT, noindex); 40 LT keywords + WebSearch (Vinted €2,38M, MisterTango €61,5K, ES €1,15 mlrd.) |
| 2026-05-10 (blog-polish-publish) | Audit→polish workflow, template v2, publish-ready | uncommitted | 3 SVG iliustracijos (21KB), FAQ 12Q 2 cols, HowTo + Review schemas, testimonial blokas, 12 selector typography sync su index, Kowalski animations (IntersectionObserver, FAQ smooth, hover wraps); `/audit` 16/20 → `/polish` P0+P1+P2 → 19/20 health; DRAFT/noindex pašalinti, sitemap + image:image; template v2 + atnaujinti docs; 3 nauji skills (audit/polish/emil-design-eng) iš Empirra |
| 2026-05-10 (nis2-phishing-publish) | 2 nauji pillar postai + pre-publish audit ratas + first push į main | `fa35e51`, `e382d2e`, `d9cc6e7` | 2 nauji pillar postai (NIS2 1194 eil. 3700ž., Phishing 1118 eil. 3100ž.), 6 nauji SVG (~46KB), 4 nepriklausomi audit'ai (SEO 7→8.5/10, QA PASS, Frontend 17/20, Marketing 8/10), 6 P0 fixes (JSON parse bug, meta desc abu, NIS2 title, Phishing H1+title KW alignment, CTA #2 mygtukai, slug rename), atnaujinta sitemap.xml + index.html + blog.html, push origin main → Vercel auto-deploy (live veriva.lt nepatvirtintas) |
| 2026-05-10 (vercel-migration) | UX patobulinimai + brief klausimynas + KI-004 split + Vercel deploy fix + DNS WP→Vercel | `c5e14e6`, `d011841`, `60f9d56`, `9328cef`, `fca76a9`, `6974806` | UX: FAQ 2 cols, plain email (7 vietos), nav parity (8 punktai blog.html), BDAR widget realūs VDAI duomenys; NEW brief.html (4 sek × 59 kl, konditional logika sveikatos vs verslo); KI-004 index.html split → assets/css/index.css (590 lines) + assets/js/index.js (276 lines), -43% lines, -92% token cost CSS keitimui; Vercel build fix #1 (invalid runtime:edge) + #2 (outputDirectory) → Production READY; DNS migration: Hostinger A 35.198.136.225 → Vercel 76.76.21.21 + CNAME www → cname.vercel-dns.com (vartotojo per UI, Zoho email DNS nepaliesti); 10 URL'ų LIVE ant www.veriva.lt 200 OK; apex SSL pending |
| 2026-05-10 (premium-dark-tier-redesign) | 9 sekcijų index.html perdirbimas į premium dark tier (Stripe/Linear lygis) | bundle'inta `0e51dcf` | 9 sekcijos perdirbtos (paslaugos/auditas/komanda/apie/atsiliepimai/kainos/blog/FAQ/kontaktai), brand language unified (radial mesh + mono kicker + cyan dot + Syne 800 + cyan accent), CSS 590→2573 lines (708/708 braces), JS 276→324 lines (count-up + cursor-follow + faq a11y), schema enhancements ×3, 12× emoji+ → SVG icons, ~80 lines dead CSS removed, visi inline styles + onmouseover XSS pašalinti |
| 2026-05-10 (cookiebot-integration) | Cookiebot CMP įdiegimas (BDAR/e-Privatumo atitiktis) + slapukai.html + bundle commit | `0e51dcf` | Cookiebot CMP auto-blocking 6 puslapiuose (Domain ID `bc31b2c9-...`), slapukai.html NEW (9-skyrių BDAR politika + CookieDeclaration + Cookiebot.renew btn), pašalintas custom #cookie-banner (XSS rizika su inline onmouseover): HTML 16 + JS 14 + CSS 2 + modal-cookies orphan 32 lines, footer linkas modal → /slapukai.html, bundle commit'as su sesija #8 (3516+/571-), production verify 7/7 URL 200 OK + Cookiebot CDN 200 OK |
| 2026-05-10 (blog-dark-tier-sync) | blog.html premium dark tier sync su index.html + 3 placeholder cards disabled | `2ca8177`, `f74415f` | blog.html visas dark theme (buvo light cream): hero su mono kicker + cyan dot + Syne 800 + radial mesh, filterai dark glass + cyan accent, post kortelės `.post`-style premium card su top hairline cyan + `:has()` sibling dim + grid mask visual, newsletter cyan CTA + glass card, footer hairline, JetBrains Mono preload, prefers-reduced-motion respect; KI-001 partial: 3 placeholder kortelės (DPO/Incidentai/Mokymai) `<a href>` → `<div>` su Netrukus badge (glass + backdrop-filter) + opacity .55 + aria-disabled, 404 link'ai pašalinti, filterai vis dar veikia; production LIVE 200 OK, 6× Netrukus + 11× bc--soon refs |
