# INCIDENT LOG — Veriva

Production incidentų istorija. Atnaujinti po kiekvieno rollback'o, downtime'o, ar kritinio bug'o.

**Kiekvienas incidentas dokumentuojamas:**
- Kada nutiko (UTC + LT laikas)
- Kuris commit/deploy sukėlė
- Simptomas (kaip pasireiškė)
- Detection (kaip aptikta — user report, monitoring, manual check)
- Impact (kiek user'ių, kiek leads/duomenų prarasta)
- Resolution (ką darėme — rollback, hotfix, config change)
- Root cause (tikra priežastis)
- Prevention (kas pasikeičia, kad nepasikartotų)

---

## Aktyvūs incidentai

*Nėra šiuo metu.*

---

## INC-003 — SEO engine workflow fail loop'as (FAQ markup + empirra leak + empty batch)

**Kada:** 2026-05-23 ~07:16 — 08:35 UTC (~10:16 — 11:35 LT), ~1h 19min iki pirmo fix'o effective; reali sistema affected'inta nuo s10 (2026-05-10 SEO engine veriva onboarding) — visi LT runs fail'indavo silent'iškai iki cron'as paleisdavo manual'iai

**Repo:** `riko8825/SEO-Claude-code` (NE Veriva-geras — auto-deploy source). Veriva-geras live veriva.lt nebuvo paveikta (prior published `seo/*` puslapiai gyveno toliau)

**Sukėlęs commit/deploy:** Multiple — pillar issues:
- `templates/_chrome_veriva.html` blog-parity FAQ rewrite (~s10) NEsuderintas su `src/validator/checks_content.py:_check_faq`
- `templates/_chrome_veriva.html:159` CSS komentaras paliktas su "empirra" substring'u
- `scripts/deploy_veriva.py` exit code'as nepalankesnis pre-deploy gate signal'ams

**Simptomas:** `Weekly SEO Generation` workflow 4 paeiliui failure runs (`26326713815`, `26327072641`, `26327170842`, `26327902666`). Email'ai vartotojui. Visi runs validate'indavo page'us su HARD_BLOCK `faq count 0 < 4` (validator counted 0 nors HTML turėjo 10 `.faq-item` div'us). Po faq fix'o — sekantis runs gavo multi-client leakage scan exit 3 dėl CSS komentaro. Po to — cannibalization-demoted page'as fail'ino deploy step su "no validated pages".

**Detection:** Vartotojas pranešė ("man laiškus pastoviai siunčia"), pridėdamas 2 screenshot'us workflow failure UI + Annotations panel'io

**Impact:**
- 0 user'ių (internal automation workflow)
- 0 leads / duomenų prarasta
- Veriva.lt live'as nepaveiktas — prior published `seo/*` puslapiai (`bdar-baudos`, `bdar-6-straipsnis`, etc.) gyveno toliau
- Pažaboto SEO content growth — nuo s10 iki s20 (12 dienų) NIEKADA nedeploy'inta LT `seo/*` puslapio (visi crash'indavo ant FAQ validator gate'o)

**Resolution:**
1. Pirmas false attempt: `FREEZE_VERIVA_UNTIL='2026-12-31'` `weekly_generate.yml` (commit `04dca01`) — sustabdo runs bet vis tiek exit 1 → email'ai. Vartotojas perorientavo: "ne emailus reikia sustabdyti o klaida istaisyti"
- Antras false attempt: `gh workflow disable 268202578` — pilnai išjungta, email'ai sustojo, bet tai NE fix'as. Re-enable'inta po vartotojo direktyvos
- Tikra fix sequence:
  - `a7b09b4` — `src/validator/checks_content.py` `_check_faq`: `max(details_count, faq_item_count)` + `faq-sec` exempt
  - `e7f7489` — `templates/_chrome_veriva.html:159`: "empirra" → "default" CSS komentare
  - `673401e` — `scripts/deploy_veriva.py`: empty batch + `client_live > 0` → exit 0 no-op (nebenotifina operatoriaus)
- Verifikacija: 7 workflow_dispatch loop'as, 6 ✓ runs paeiliui, 5 nauji LIVE `seo/*` puslapiai deployed

**Root cause:**
1. **Template/validator drift** — `templates/base.html:424-451` conditional rendering pagal `client_chrome` flag'ą buvo įvestas s10, bet `_check_faq` validator'iuje liko hardcoded `<details>` skaičiavimas. Code review'as neapėmė validator side'o
2. **CSS comment substring sensitivity** — `client_leakage_scanner` substring'iniu būdu žiūri kiekvieną byte'ą HTML output'e. CSS komentarai paliekami HTML'e (ne strip'inami). Nei vienas commit message neminėjo "empirra" žodžio kaip leak source'o, todėl `git log -S empirra` paieška būtų missed
3. **Exit code semantics confusion** — deploy script'as treat'ina visus "no slugs to deploy" atvejus kaip failure, nors pre-deploy gate'as (validator/quality_os) BY DESIGN gali sustabdyti visus naujo batch'o puslapius

**Prevention:**
1. **Memory dokumentacija**: `memory/reference_seo_engine.md` NEW — pilnas workflow flow su file:line citations, "Ko NEdaryti" taisyklės (#1: nederinti template ir validator atskirai; #2: nepalikti `empirra`/`Empirra` substring'o veriva chrome'e net komentaruose; #3: empty batch ≠ error)
2. **DECISION_LOG entries (2)**: empty batch contract change + veriva FAQ markup design intent — abu objektyvūs reminder'iai future'iui
3. **CLAUDE.md scope clarity** — Veriva-geras CLAUDE.md eksplicitiškai mini SEO-Claude-code kaip atskirą repo (atnaujinta per reference_seo_engine.md pointer'ius)
4. **Pre-deploy gate signal interpretation** — vystytojas (Claude / žmogus) reading workflow failure turi visada patikrinti `Deploy validated pages to Veriva` step log'ą: ar tai `client-leakage-scan: FAIL` (TRUE leak — fix template), ar `ERROR: no validated pages` (validator/quality_os rejection — quality issue, ne deploy issue)
5. **Technical debt** — `deploy_veriva.py` no-op path'as NETESTUOTAS pytest'u (verified tik 6 LIVE workflow runs). Reikia pridėti `tests/test_scripts.py::test_deploy_veriva_no_op_empty_batch` ateityje

**Detection delay:** ~12 dienų (s10 → s20). Cron paleidžiamas 3×/dieną, bet kiekvienas failure run sukėlė email'ą — vartotojas matyt filtravo / ignoravo iki šio piko (4 manual workflow_dispatch'ai per <1h, kurie generuoja koncentruotą email volume'ą). Ateityje: GitHub Actions failure notifications turėtų eiti į atskirą Slack/Telegram kanalą (ne email), kad signal'as būtų akivaizdesnis.

---

## INC-002 — Vercel build fail po pirmo bundle push'o (CRON_SECRET trailing whitespace)

**Kada:** 2026-05-12 ~09:25 UTC (~16:25 LT)
**Sukėlęs commit/deploy:** `2512730` bundle commit (s12+s14 push) — Vercel deployment `veriva-geras-hx362gc6v` ● Error 3s
**Simptomas:** `vercel ls` rodė ● Error status'ą paskutiniam deploy'ui. Production lieka ant ankstesnio Ready build'o (s11 privatumas, `9efb0d0`). `vercel inspect --logs` grąžino:
```
2026-05-12T09:25:21.798Z  Error: The `CRON_SECRET` environment variable contains leading or trailing whitespace, which is not allowed in HTTP header values.
2026-05-12T09:25:21.799Z  Learn More: https://vercel.link/securing-cron-jobs
```
Build pasibaigė per 3s (prieš install/build steps).

**Detection:** Manual `vercel ls` patikra po push'o (CLAUDE.md "Vercel CLI workflow" 2026-05-10 standartas, INC-001 prevention). Be šios privalomos patikros incident'as būtų likęs silent (cron'as 2026-05-12 10:00 LT būtų bandęs paleisti su missing env var).

**Impact:** 0 production user'ių paveiktų (production lieka ant ankstesnio Ready build'o). Hero rewrite + blog automation kodas nepasiekė production'o ~5 min.

**Resolution:**
1. `vercel env rm CRON_SECRET production --yes` — pašalintas blogas value
2. `printf "%s" "$(openssl rand -hex 32 | tr -d '\n\r\t ')" | vercel env add CRON_SECRET production` — naujas value, explicit whitespace strip
3. `git commit --allow-empty -m "chore: trigger redeploy after CRON_SECRET whitespace fix" && git push` — trigger empty commit (`4ee35d1`)
4. Build `fkbcoi4q2` ● Ready 14s ✅

**Root cause:** Per s14 blog-automation-port sesiją (2026-05-11) buvo paleista `openssl rand -hex 32 | vercel env add CRON_SECRET production`. Komanda `openssl rand -hex 32` įvairiose terminal versijose grąžina trailing newline (`\n`). Vercel env value išsaugojo su šiuo newline. Build'o metu Vercel validuoja `CRON_SECRET` kaip Authorization header value (`Bearer $CRON_SECRET`), o HTTP header standardas (RFC 7230 §3.2.4) neleidžia whitespace prefix/suffix.

**Prevention:**
- ✅ NAUJAS STANDARTAS: visi secret generation pipe'ai į `vercel env add` per `printf "%s" "$(... | tr -d '\n\r\t ')"` — žr. DECISION_LOG 2026-05-12
- ✅ Atnaujinti `docs/blog-automation-deploy.md` 7-step guide su šituo patternu (carry-over)
- ✅ Pridėti į `WORKFLOW.md` secret rotation checklist'ą: visada `tr -d` arba `printf "%s"` prieš `vercel env add`
- ❌ NIEKADA `openssl rand -hex 32 | vercel env add ...` be whitespace strip

---

## INC-001 — Vercel auto-deploy fail'inosi 9× per 21h (silent)

**Kada:** 2026-05-09 ~10:00 UTC – 2026-05-10 08:30 UTC (~21h trukmės silent failure)
**Sukėlęs commit/deploy:** Pirmas push `c2bd4ff` (2026-05-09) — bet tikra priežastis senesnė: `vercel.json` `functions` blokas su `"runtime": "edge"` egzistavo nuo projekto inicializacijos (`48e6830`, 2026-05-09 init)
**Simptomas:** Visi `git push origin main` commit'ai (6+) nepasiekė `veriva-geras.vercel.app`. Production rodo seną deploy'ą iš 2026-03-23 (48 dienų senas). User'iui — niekas nesikeitė.
**Detection:** 2026-05-10 (vercel-migration sesija) — vartotojas pranešė, kad veriva.lt vis dar rodo WordPress. Curl test'ai parodė `Last-Modified: 2026-05-04`, `Age: 506261s`. Vercel CLI `vercel ls` parodė 9 paskutinius deploy'us → ❌ Error per 2-3s.
**Impact:** 0 production user'ių (DNS dar rodė WordPress, niekas nepateko į Vercel). 6 commit'ai sėdėjo GitHub'e be deploy'o ~21h. Brand image risk minimalus, bet vidinio darbo waste reikšmingas.
**Resolution:**
- Fix #1 (`fca76a9`): pašalintas `functions` blokas iš `vercel.json` (deprecated runtime format)
- Fix #2 (`6974806`): pridėtas `"buildCommand": null` + `"outputDirectory": "."` (statinė svetainė root'e)
- Build #2 → Ready 27s
**Root cause:** `vercel.json` turėjo `"functions": { "api/**/*.ts": { "runtime": "edge" } }`. Vercel reikalauja arba pilno semver'o (`@vercel/edge@1.0.0`) arba per-file deklaracijos TS faile per `export const config`. TS failai jau turėjo per-file config, bet `vercel.json` blokas perrašė ir fail'ino build'ą su klaida `Function Runtimes must have a valid version`. Build trukmė 2-3s atspindėjo, kad failure'as įvyko prieš install/build steps, todėl jokio output'o naudotojui nebuvo (silent fail).
**Prevention:**
- ❌ NIEKADA neturėk tos pačios konfigūracijos dviejose vietose (`vercel.json` + per-file `export const config`) — vienos iš jų pašalink
- ✅ Po kiekvieno push'o tikrinti `vercel ls` (CLI) — automatinis darbo flow turi įtraukti šią patikrą prieš pereinant į kitą task'ą
- ✅ Pridėti `vercel inspect <url> --logs` patikrą į `WORKFLOW.md` deploy step'ą
- ✅ Health-check workflow (`.github/workflows/health-check.yml`) reikia įjungti — jis būtų pranešęs apie production seną state'ą per cron run

---

## Incident šablonas (naujam incident'ui)

```
### INC-XXX — [Trumpas pavadinimas]

**Kada:** YYYY-MM-DD HH:MM (LT) / HH:MM (UTC)
**Sukėlęs commit/deploy:** `abc1234` / Vercel deployment ID
**Simptomas:** [Kas matėsi user'iui ar logs]
**Detection:** [Kaip aptikta — user report / Vercel logs / Resend dashboard / Supabase]
**Impact:**
- Affected user'ių skaičius: [N]
- Prarasti leads/duomenys: [taip/ne, detalės]
- Downtime trukmė: [N min]

**Timeline:**
- HH:MM — incidentas prasidėjo
- HH:MM — aptikta
- HH:MM — rollback atliktas
- HH:MM — production verified working

**Resolution:** [Rollback `git revert`? Hotfix? Env var update?]
**Root cause:** [Tikra priežastis — ne simptomas]
**Prevention:**
- [Konkretus pakeitimas — naujas test? CI gate? alert?]
- [Update'inti `KNOWN_ISSUES.md` jei bug'as išliko]
- [Update'inti `TEST_PROTOCOL.md` jei test gap'as]

**Susiję commits/PRs:** [linkai]
```

---

## Išspręsti incidentai

*Tuščia.*
