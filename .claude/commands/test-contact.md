Testuok contact-form endpoint naudodamas bypass token (jei Vercel Protection įjungtas).

1. Paimk naujausią deployment URL iš `npx vercel ls`
2. Siųsk POST request:
   ```
   curl -X POST "{deployment}/api/forms/contact?x-vercel-protection-bypass={BYPASS_TOKEN}" \
     -H "Content-Type: application/json" \
     -H "x-api-key: {CONTACT_FORM_SECRET}" \
     -d '{"name":"Test User","email":"test@veriva.lt","company":"Test UAB","message":"BDAR audito užklausa","source":"contact-form"}'
   ```
3. Parodyk response (laukiama: 200 + `{"success":true,"id":"..."}`)
4. Patikrink Vercel logs: `npx vercel logs --prod`
5. Patikrink Supabase → `leads` lentelė → ar atsirado įrašas
6. Patikrink Resend → Emails tab → ar išsiųstas notification

Jei 401 / 403 → patikrink `x-api-key` (atskiras `*_SECRET` per endpoint)
Jei 500 → Vercel logs + Supabase logs
