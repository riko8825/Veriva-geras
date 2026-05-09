# ROLLBACK CHECKLIST — Veriva

Naudoti kai production verification fail arba po deploy aptikta kritinė klaida.

---

## Rollback Triggeriai (privaloma rollback jei bet kuris)

```
□ Smoke test fail production
□ Kontakto forma nebeveikia (ne 200)
□ API grąžina 5xx
□ Success UI nerodosi po 200
□ Supabase nustojo rašyti įrašus
□ Email delivery nutrūko po deploy
□ automation_logs rodo error chain > 3 iš eilės
□ Cookie banner / Cookiebot nustojo veikti (BDAR risk)
□ Privatumas.html / slapukai.html grąžina 404
```

Jei net vienas ✅ — rollback be diskusijų.

---

## Rollback Žingsniai

### 1. Identifikuoti paskutinį veikusį commit'ą

```bash
git log --oneline -5
```

### 2. Grįžti atgal (NIEKADA git reset --hard)

```bash
git revert HEAD
git push origin main
```

Vercel automatiškai redeploy'ins iš naujo.

### 3. Patikrinti ar rollback deployment'as sėkmingas

```
□ Vercel → Deployments → naujausias deployment = žalias (Ready)
□ veriva.lt atsidaro
□ Forma submitina → 200
□ Success UI rodosi
□ Cookie banner veikia
```

### 4. Patvirtinti production veikia

```bash
# Test submit (rankiniu būdu):
# Atidaryti veriva.lt/kontaktai
# Įvesti: name, email, company, message → submit
# Laukiama: 200, success box, Supabase įrašas, Resend email
```

Arba CLI:
```bash
curl -X POST "https://veriva.lt/api/forms/contact" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CONTACT_FORM_SECRET" \
  -d '{"name":"Rollback Test","email":"test@veriva.lt","company":"Test","message":"verify"}'
```

---

## Post-Rollback Veiksmai

```
□ Dokumentuoti incidentą INCIDENT_LOG.md:
    - Kada nutiko (UTC + LT)
    - Kuris commit'as sukėlė
    - Koks simptomas
    - Kaip patvirtinta

□ Atnaujinti SESSION_STATUS.md — "rollback atliktas, priežastis: ..."
□ Atnaujinti PROJECT_STATUS.md — pažymėti automatizacijos būseną
□ Tikra priežastis išspręsta PRIEŠ kitą deploy bandymą
□ Update'inti KNOWN_ISSUES.md jei bug'as išliko
```

---

## Rollback Decision Tree

```
Production fail
    ↓
Ar problema izoliuota (vienas komponentas)?
    → Taip → Fix → re-deploy (po staging test)
    → Ne   → git revert HEAD → git push origin main
                ↓
           Patikrinti rollback (4 žingsniai aukščiau)
                ↓
           Dokumentuoti INCIDENT_LOG.md
                ↓
           Root cause → fix → re-test staging → deploy
```

---

## Niekada

- `git reset --hard` — sunaikina istoriją
- `git push --force` — overwrite'ina remote (kiti dirbantieji praranda darbą)
- Deploy fix be staging testo — net jei "triviali" korekcija
- Ignoruoti INCIDENT_LOG.md po rollback — pasikartojimas garantuotas
- Pamesti correlation ID iš logs — be jo neįmanoma trace'inti

---

*Žr. `TEST_PROTOCOL.md` — production verification žingsniai*
*Žr. `.claude/commands/deploy.md` — pilnas deploy workflow*
