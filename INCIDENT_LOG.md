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
