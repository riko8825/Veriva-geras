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

*Nėra. Production dar nedeploy'inta (2026-05-09).*

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
