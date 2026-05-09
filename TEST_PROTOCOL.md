# TEST PROTOCOL — Veriva

Testavimo seka prieš kiekvieną deploy. 4 lygiai — neskakti.

---

## Lygis 1 — Local Check (prieš staging push)

```bash
# 1. JS sintaksės patikra
node --check assets/js/main.js
node --check assets/js/forms.js

# 2. TypeScript patikra
npx tsc --noEmit

# 3. Env kintamųjų patikra (ar visi Vercel nustatyti?)
# Žr. docs/env-variables.md — pilnas sąrašas
npx vercel env pull .env.tmp
grep -E "^(SUPABASE_URL|RESEND_API_KEY|CONTACT_FORM_SECRET)" .env.tmp
rm .env.tmp
```

Patikrinti rankiniu būdu (lokalus dev server):
```
□ index.html atsidaro naršyklėje
□ Nav linkai veikia (visi 9 puslapiai + blog)
□ Mobile menu (≤768px) atsidaro
□ Cookie banneris rodosi pirmą kartą
□ Forma rodo laukus (name, email, company, message)
□ Submit → Network tab → POST /api/forms/contact → 200
□ Success box rodosi, error box — ne
□ Console — 0 klaidų
```

**GO →** jei visi ✅ | **STOP →** jei bet kuris ❌

---

## Lygis 2 — Staging Verify (po push į branch / PR)

Prieš production deploy patikrinti Vercel preview URL'e:

```
□ Puslapis atsidaro (HTTPS, be console klaidų)
□ Visi puslapiai grąžina 200 (index, paslaugos, apie, kainos, blog, kontaktai, privatumas, slapukai)
□ 404.html veikia ant /nonexistent
□ Forma submitina → gaunamas 200
□ Supabase → Table Editor → leads → naujas įrašas atsirado (su request_id)
□ Resend → Emails tab → admin notification email išsiųstas
□ Resend → Emails tab → user confirmation email išsiųstas
□ Success UI rodosi po submit
□ Error UI — nerodosi kai viskas OK
□ Mobile (375px) — forma matosi ir veikia
□ Cookiebot — consent flow veikia
□ Schema.org — Google Rich Results Test pass
```

**GO →** visi ✅ | **NO-GO →** bet kuris ❌ → fix → re-test

---

## Lygis 3 — Smoke Test (critical flow)

Minimalus 4-žingsnių testas prieš production:

```
Test 1 — Forma submit (happy path)
  Input:  name="Test User", email="test@veriva.lt", company="Test UAB",
          message="BDAR audito užklausa"
  Laukiama: 200, success box rodosi, įrašas Supabase leads, 2 email Resend

Test 2 — Forma submit (invalid input)
  Input:  email="" (tuščias)
  Laukiama: forma neišsiunčiama (HTML5 required) arba 400, error box rodosi

Test 3 — Forma submit (XSS attempt)
  Input:  message="<script>alert('xss')</script>"
  Laukiama: sanitized in DB (be raw <script>), email gaunamas tekstu, ne HTML executable

Test 4 — Puslapio gyvybingumas
  Atidaryti: veriva.lt (production / staging URL)
  Laukiama: page load < 3s, hero sekcija matoma, 0 console klaidų,
            Cookiebot banner rodomas, schema.org Org + LocalBusiness validuoja
```

**GO →** visi 4 testai ✅ | **NO-GO →** bet kuris ❌

---

## Lygis 4 — Production Verification (po deploy)

Iš karto po `git push origin main` arba `vercel --prod`:

```
□ veriva.lt atsidaro (HTTPS)
□ Realus test submit su tikrais duomenimis
□ Vercel → Functions → Logs → 200, be 5xx klaidų
□ Supabase → leads → įrašas su request_id atsirado
□ Resend → Emails tab → abu emailai išsiųsti
□ Success UI rodosi
□ automation_logs → success įrašas (ne error)
□ GA4 → real-time → puslapio peržiūra registruojama (jei integruota)
□ Cookiebot consent log → įrašas yra
```

**PASS →** deploy patvirtintas | **FAIL →** žr. `ROLLBACK_CHECKLIST.md`

---

## Debugging Workflow (kai kažkas lūžta)

Tvarka — niekada keisti:

```
1. Naršyklė / DevTools  → ar forma siunčia request'ą? gaunamas 200? Console klaidos?
2. Vercel logs           → ar API gauna request'ą? grąžina 200? `npx vercel logs --prod`
3. Resend → Emails tab   → ar email išsiųstas? Status?
4. Supabase → leads      → ar įrašas atsirado? Su correlation_id?
5. Supabase → automation_logs → trace pagal request_id
6. Cookiebot Console     → ar consent log'inamas?
7. Browser cache / CDN   → hard reload (Ctrl+Shift+R), Vercel deployment cache check
```

Neskakti prie kodo kol nepatvirtinta, kuriame žingsnyje lūžta.

---

## Env Variables Checklist (prieš kiekvieną deploy)

```
□ SUPABASE_URL                — Vercel → Settings → Environment Variables
□ SUPABASE_SERVICE_ROLE_KEY   — Vercel → Settings → Environment Variables
□ RESEND_API_KEY              — Vercel → Settings → Environment Variables
□ CONTACT_FORM_SECRET         — Vercel → Settings → Environment Variables (per-endpoint)
□ AUDIT_REQUEST_SECRET        — Vercel → Settings → Environment Variables (per-endpoint)
□ NEWSLETTER_SECRET           — Vercel → Settings → Environment Variables (per-endpoint)
□ HEALTH_SECRET               — Vercel → Settings → Environment Variables (per-endpoint)
□ OWNER_EMAIL                 — Vercel → Settings → Environment Variables (notifications)
□ CLAUDE_API_KEY              — Vercel → Settings → Environment Variables (kai blog-gen)
□ COOKIEBOT_DOMAIN_ID         — Vercel → Settings → Environment Variables (consent)
```

Pilnas sąrašas: `docs/env-variables.md`

**Verification per CLI:**
```bash
npx vercel env pull .env.tmp
cat .env.tmp | grep -E "^(SUPABASE|RESEND|CONTACT|AUDIT|NEWSLETTER|HEALTH|CLAUDE|COOKIEBOT|OWNER)"
rm .env.tmp  # NIEKADA neignoruoti — turi secrets
```

---

## BDAR-specific testai (Veriva privalomas)

```
□ Pirmą kartą atsidarius — Cookie banneris rodomas, GA4 nesusiranda kol consent neduotas
□ "Atmesti visus" — GA4/GTM nesigrąžina, jokie tracking cookies
□ "Sutinku" — GA4 inicializuojasi, consent log'as Cookiebot dashboard'e
□ Privatumas.html — DPO email matosi, duomenų valdytojas nurodytas
□ Slapukai.html — visi cookies sąraše (Cookiebot scan match)
□ Forma — `consent` checkbox required, false → submit blokuojamas
□ Supabase leads — `consent_given` ir `ip_hash` (ne raw IP) saugomi
```

---

*Žr. `ROLLBACK_CHECKLIST.md` — kai production verification fail*
*Žr. `.claude/commands/deploy.md` — pilnas deploy workflow*
