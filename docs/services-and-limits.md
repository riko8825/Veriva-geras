# EXTERNAL SERVICES + APRIBOJIMAI — Veriva

## EXTERNAL SERVICES

| Servisas | Kritinis? | Fallback | Blokuoja production? |
|---|---|---|---|
| Vercel | ✅ Kritinis | Nėra | Taip |
| Supabase | ✅ Kritinis | Nėra | Taip |
| Resend | ✅ Kritinis (forms) | DB log only | Ne (async) |
| Claude API | ⚠️ Papildomas (blog-gen) | — | Ne (tik blog automation) |
| GA4 + GTM | ⚠️ Papildomas | — | Ne |
| Cookiebot | ⚠️ Papildomas | — | Ne |
| Slack alerts | ⚠️ Papildomas | — | Ne |

---

## ŽINOMI APRIBOJIMAI

- Vercel Edge Function timeout: **25s** — ilgos operacijos turi grįžti response iš karto, background tęsti async
- Resend free plan: 100 emails/day, 3,000/mo
- Supabase free plan: 500MB storage, 2GB bandwidth
- Claude API: rate limits pagal planą — žr. Anthropic dashboard
- Edge Functions neturi Node.js `fs` modulio — tik Web APIs
- BDAR / GDPR — DPO kontaktas privalomas privatumo politikoje (`privatumas.html`)
- LT BDAR baudų precedentai: nuo 2017 m. €0 — tai yra konkurencinis asset'as, neperžengti šito skaičiaus

---

## COMMIT KONVENCIJA

```
feat: trumpas aprašas — ką pridėta
fix: kas sulaužyta ir kaip ištaisyta
refactor: kas pertvarkytas be funkcionalumo pokyčio
docs: dokumentacijos atnaujinimas
chore: sync, cleanup, config
```

Pvz.: `fix: contact form — sanitize message field, prevent XSS in admin notification`

---

## CLI CONVENTIONS

### Env vars per CLI — VISADA `printf`, NE `echo`

`echo` priduria trailing `\n`. Vercel/GitHub Secrets išsaugoja jį kaip dalį value — token'as su trailing newline'u **lūš auth check'us** (Bearer header tikslus byte-match).

**❌ BAD:**
```bash
echo "abc123" | npx vercel env add MY_TOKEN production
echo "abc123" | gh secret set MY_TOKEN
```

**✅ GOOD:**
```bash
printf "abc123" | npx vercel env add MY_TOKEN production
printf "abc123" | gh secret set MY_TOKEN
```

**Patvirtinimas po set'o:**
```bash
npx vercel env pull .env.tmp
cat .env.tmp | grep MY_TOKEN  # patikrinti, kad nėra trailing newline
rm .env.tmp                    # NIEKADA neignoruoti — turi secrets
```

**Empirra patirtis (s38):** weekly-digest token set'inant per `echo` — endpoint'as grąžino 401, debug'as užtruko ~15 min kol identifikavom newline. Antras attempt'as su `printf` veikė iš karto.

### Token rotation

Atnaujinant esamą token'ą — **rm + re-add** abiejose vietose (Vercel + GitHub), tada `npx vercel --prod` redeploy:

```bash
npx vercel env rm MY_TOKEN production
printf "$NEW_TOKEN" | npx vercel env add MY_TOKEN production
gh secret delete MY_TOKEN
printf "$NEW_TOKEN" | gh secret set MY_TOKEN
npx vercel --prod
```

---

## BDAR / TEISINIAI APRIBOJIMAI

Veriva = duomenų apsaugos kompanija → savo svetainė turi būti **nepriekaištingai BDAR-compliant**:

- **Privatumas.html privalomas** — duomenų valdytojas, tikslai, teisinis pagrindas, saugojimo terminai, teisės, DPO kontaktas
- **Slapukai.html privalomas** — visi cookies + Cookiebot consent flow
- **Cookie consent banneris** — privalomas prieš GA4/GTM scripts (consent mode v2)
- **Forma duomenų rinkimo įrašas** — Supabase `leads` lentelė turi audit trail (created_at, ip_hash, consent_given)
- **Duomenų ištrynimo procesas** — endpoint'as `POST /api/forms/delete-data` (vėliau)
