Deploy į production (veriva.lt):

1. Patikrink ar nėra nesukomitintų pakeitimų: `git status`
2. Jei reikia — `/greitas-patikrinimas` (HTML/CSS/JS quick check)
3. `git add -A && git status` — patikrink kas keičiasi
4. **Paprašyk patvirtinimo prieš commit ir push** (production deploy = privaloma klausti)
5. `git commit -m "{message}"`
6. `git push origin main`
7. Palaukyk deploy: `npx vercel ls` — tikrink kol "Ready"
8. Patikrink ar svetainė veikia: `curl -s -o /dev/null -w "%{http_code}\n" https://veriva.lt`
9. Patikrink Vercel logs: `npx vercel logs --prod`

Deployment taisyklės:
- Niekada deploy'inti be testavimo (žr. `TEST_PROTOCOL.md`)
- Staging pirma (preview URL), production po patvirtinimo
- Po deploy — patikrink Vercel logs (5xx? 4xx?)
- Jei production fail — žr. `ROLLBACK_CHECKLIST.md`
