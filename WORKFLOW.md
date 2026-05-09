# CLAUDE CODE — DARBO INSTRUKCIJA (Veriva)

**Tikslas:** mažiau token'ų, daugiau rezultato. Vienas šaltinis, jokių pakartojimų.
Adaptuota iš Empirra `WORKFLOW.md`.

---

## 1. AUKSO TAISYKLĖS (token taupymas)

1. **Pradėk siaurai** — vienas konkretus klausimas, ne "padaryk viską"
2. **Nurodyk failą** — `index.html:120` (ne "kažkur indekse")
3. **Nesakyk "patikrink visą projektą"** — tai sudegina 50k+ token'ų
4. **Naudok skills** — jie pakeičia 10 promptų į 1 komandą
5. **Naudok agents tik kai reikia** — paralelinėms užduotims arba kontekstui apsaugoti
6. **`/start-task` sesijos pradžioje** — perskaito 4 failus už tave (memory-first)
7. **`/close-session` pabaigoje** — atnaujina dokumentus, kitą kartą nereikės klausinėti
8. **Nedubliuok info** — jei yra `CLAUDE.md` ar `MEMORY.md`, neaiškink iš naujo
9. **Trumpai rašyk** — "fix nav padding mobile" geriau nei 3 paragrafai
10. **Stop & verify** — po deploy patikrink, neprašyk Claude'o "ar viskas gerai?"

---

## 2. SESIJOS PIPELINE (visada ta pati seka)

```
/start-task
  ↓
darbas (build / fix / test)
  ↓
/greitas-patikrinimas  (jei keitei HTML/CSS/JS)
  ↓
/docs-sync  (jei keitei struktūrą)
  ↓
/git-commit
  ↓
/deploy
  ↓
/close-session
```

**Niekada neskakti per žingsnį.**

---

## 3. PAGRINDINIAI SKILLS (top 10 — naudoti dažnai)

| Skill | Kada naudoti |
|-------|--------------|
| `/start-task` | **Visada** sesijos pradžioje |
| `/close-session` | **Visada** sesijos pabaigoje |
| `/greitas-patikrinimas` | Po HTML/CSS/JS pakeitimų |
| `/git-commit` | Prieš deploy — paruošia commit message |
| `/deploy` | Į production (push + Vercel verify) |
| `/debug-flow` | Kai automatizacija neveikia (7 lygiai) |
| `/docs-sync` | Po struktūrinių pakeitimų |
| `/mobilios-versijos` | Mobile responsive fix |
| `/security-review` | Prieš auth/payment/forma backend |
| `/copy-editing` | Copy audit (LT brand voice) |

**Specializuoti (rečiau):**
- `/puslapis-naujas` — naujas puslapis nuo brief
- `/automacija-nauja` — nauja automatizacija nuo nulio
- `/n8n-konvertuoti` — n8n JSON → TypeScript
- `/seo-tekstai` — SEO/GEO copy (LT keywords)
- `/pilnas-auditas` — visapusis svetainės auditas (SEO+frontend+backend)

---

## 4. AGENTAI (kada paleisti)

**Taisyklė:** agentai = paralelinės užduotys arba kontekstas, kuris užterštų pagrindinį pokalbį.

| Agentas | Kada |
|---------|------|
| `solution-architect` | **PIRMA** prieš bet kokį backend kodą |
| `backend-engineer` | Po architect patvirtinimo |
| `database-designer` | Nauja Supabase lentelė/RLS |
| `integration-specialist` | Resend / Apollo / Cookiebot wrapperis |
| `qa-tester` | **PRIVALOMAI prieš deploy** |
| `debugger` | Kai automatizacija lūžta |
| `frontend-revizorius` | CSS/HTML/JS auditas |
| `seo-specialistas` | SEO meta/schema |
| `page-builder` | HTML/CSS/JS puslapis |
| `Explore` | Greitas read-only paieškos užduotys |

---

## 5. NAUJA SVETAINĖ / PUSLAPIS — VEIKSMŲ PLANAS

### Etapas 1 — BRIEF & ARCHITEKTŪRA

```
1. Parašyk brief: tikslas, ICP (LT B2B), CTA, sekcijos, raktažodžiai (LT)
2. /puslapis-naujas  ← skill paims brief ir sudarys planą
3. solution-architect  ← patvirtina struktūrą
```

### Etapas 2 — CONTENT & SEO

```
4. /seo-tekstai  ← meta tags (LT), H1/H2, copy
5. /copy-editing  ← brand tone audit (Veriva: profesionalus, autoritetingas, faktais paremtas)
```

### Etapas 3 — BUILD

```
6. page-builder agentas  ← HTML/CSS/JS pagal brief
   - mobile-first
   - flat root (NE src/pages/ kaip Empirra)
   - assets/css/ (be inline)
   - assets/js/ (be inline)
```

### Etapas 4 — QUALITY

```
7. /greitas-patikrinimas  ← duplikatai, broken links
8. /mobilios-versijos  ← responsive 375px
9. /pilnas-auditas  ← a11y + perf + Core Web Vitals
```

### Etapas 5 — DEPLOY

```
10. qa-tester  ← privaloma checklist
11. /git-commit
12. /deploy  ← klausia patvirtinimo prieš push
13. Production verify (manual: open URL, test CTA, BDAR cookie banner)
14. /docs-sync  ← structure.md update
15. /close-session
```

---

## 6. NAUJA AUTOMATIZACIJA — VEIKSMŲ PLANAS

```
1. /start-task
2. /automacija-nauja  ← brief → architektūra
3. solution-architect  ← patvirtina flow + endpoints + env (PER-ENDPOINT SECRET)
4. database-designer  ← jei reikia naujos lentelės (RLS privaloma)
5. backend-engineer  ← rašo /api/forms/[name].ts arba /api/internal/[name].ts
6. integration-specialist  ← /lib wrapperiai (resend/claude/etc)
7. /test-contact arba custom curl  ← 5+ real inputs
8. /debug-flow  ← jei lūžta
9. /security-review + qa-tester  ← security + QA
10. /git-commit + /deploy
11. Production verify (Vercel logs + Supabase + Resend)
12. /docs-sync (PROJECT_STATUS.md statusą į ✅ Live)
13. /close-session
```

---

## 7. KO **NIEKADA** NEDARYTI

- ❌ Neklausti "ar gali padaryti X?" — tiesiog liepk
- ❌ Nesakyti "patikrink projektą" — nurodyk konkretų failą
- ❌ Nedaryti deploy be `/test-contact` arba qa-tester
- ❌ Nekeisti architektūros be `solution-architect`
- ❌ Nerašyti inline CSS/JS (išskyrus critical CSS hero'jui)
- ❌ Nedaryti `git reset --hard` arba `git push --force` — naudoti `git revert`
- ❌ Neklausti to paties du kartus — patikrink `CLAUDE.md` / memory
- ❌ Shared `API_KEY` per kelis endpoint'us — visada per-endpoint `*_SECRET`
- ❌ Deploy be BDAR atitikties (privatumas + slapukai privalomi)
- ❌ `echo` token set'inant — visada `printf` (trailing newline lūžimas)

---

## 8. TOKEN-SAVING PROMPT TEMPLATES

**Bug fix:**
> fix [konkretus failas:eilutė] — [kas blogai] → [ko nori]

**Naujas feature:**
> add [feature] į [failas]. Naudok esamą [class/funkciją]. Be naujo CSS bloko.

**Debug:**
> /debug-flow — [endpoint] grąžina [klaida]

**Sesija:**
> /start-task → [užduotis] → /close-session

---

## 9. DAŽNIAUSIA SEKA (90% atvejų)

```
/start-task
→ "fix [X] in [file:line]"
→ /greitas-patikrinimas
→ /git-commit
→ /deploy
→ /close-session
```

Tai viskas. Jei daugiau nei 5 promptai vienai užduočiai — kažką darai blogai.

---

## 10. KAI ĮSTRINGI

1. **Stop** — neprašyk Claude'o "pabandyk dar kartą"
2. `/debug-flow` — leisk skill'ui rasti root cause
3. Jei vis tiek lūžta — `debugger` agentas + Vercel logs + Supabase logs
4. Rollback: `git revert HEAD` + `git push origin main` (žr. `ROLLBACK_CHECKLIST.md`)
5. Atnaujinti `INCIDENT_LOG.md`

---

## 11. VERIVA-SPECIFIC TAISYKLĖS

- **BDAR-first** — privatumas.html ir slapukai.html visada privalomi prieš production
- **LT kalba** — visi user-facing tekstai (meta, h1, copy, error messages)
- **Cookiebot** — consent flow privalomas prieš GA4/GTM
- **Empirra reuse** — `lib/*` failai kopijuojami iš Empirra, NE importuojami
- **Per-endpoint secrets** — kiekvienas endpoint'as turi savo `*_SECRET` (Empirra s21 patirtis)
- **DPO kontaktas** — privalomas privatumas.html (BDAR reikalavimas)

---

*Žr. `WORKFLOW.md` Empirra projekte (kelias: `C:\Users\pinig\OneDrive\Stalinis kompiuteris\Automatiomm_empirra\empirra-website\`) jei reikia originalaus konteksto.*
