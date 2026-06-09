# BDAR audito klausimyno scoring matrica — TEISINIS REVIEW

> **Statusas: DRAFT.** Šie balai sukurti automatiškai pagal BDAR logiką, NĖRA patvirtinti teisininko.
> **PRIEŠ production paleidimą MasterLegal turi peržiūrėti ir patvirtinti šią matricą.**
> Šaltinis: `lib/bdar-questions.ts` + `lib/bdar-scoring.ts`. Klausimynas: `docs/bdar-auditas-klausimynas.xlsx`.

---

## Metodologija

1. **Atitikties balas (0–100%)** skaičiuojamas TIK iš vertinamų klausimų. Kiekvienas duoda 0–10 balų.
2. **Kritiniai klausimai turi svorį ×2** (žymimi 🔴 žemiau). Tai klausimai, kurių spraga = didelė BDAR rizika.
3. **Rizikos žymekliai** (Q20, Q23, Q33, Q36, Q37, Q38) NEmažina %. Jie rodo kontekstą, dėl kurio reikia papildomo dėmesio (DPIA, perdavimo garantijos ir pan.). Eina į išvadą atskirai.
4. **Informaciniai / poreikio klausimai** (Q3–8, 18, 25, 34, 35, 39–42) į % neįeina — jie naudojami AI išvados personalizavimui ir sales kvalifikacijai.
5. **„Netaikoma"** atsakymas išmeta klausimą iš skaičiavimo (nedidina ir nemažina %).

## Rizikos lygiai pagal atitikties %

| Atitiktis | Lygis | Reikšmė |
|---|---|---|
| ≥ 80% | 🟢 Žema rizika | Gera bazė, taisymai kosmetiniai |
| 60–79% | 🟡 Vidutinė rizika | Yra spragų, reikia susitvarkyti dokumentus |
| 40–59% | 🟠 Aukšta rizika | Reikšmingos spragos keliose srityse |
| < 40% | 🔴 Kritinė rizika | Sisteminga rizika, reikia pilno audito |

---

## VERTINAMI klausimai (įeina į atitikties %)

Balai: **10** = pilnai atitinka · **5–6** = iš dalies · **4** = formaliai/pasenę · **0** = ne/nežinau.

| # | Klausimas (sutrumpintai) | Svoris | Variantų balai |
|---|---|---|---|
| 5 | Skaitmeninė platforma | 1 | Taip 10 / Ne 10 / Planuojama 5 / Nežinau 0 |
| 9 🔴 | Duomenų žemėlapis (kur laikomi) | **×2** | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 10 | Atsakingas asmuo | 1 | Paskirtas 10 / Neformaliai 5 / Ne 0 / Nežinau 0 |
| 11 🔴 | Privatumo politika klientams | **×2** | Aktuali 10 / Sena 4 / Ne 0 / Nežinau 0 / Netaikoma — |
| 12 | Privatumo pranešimas darbuotojams | 1 | Aktualus 10 / Senas 4 / Ne 0 / Nežinau 0 / Netaikoma — |
| 13 | Vidinės taisyklės | 1 | Taikoma 10 / Formaliai 4 / Ne 0 / Nežinau 0 |
| 14 🔴 | Duomenų tvarkymo veiklos įrašai | **×2** | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 15 🔴 | Teisiniai pagrindai | **×2** | Kiekvienam tikslui 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 16 | Saugojimo terminai | 1 | Taisyklės 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 17 | Dokumentų peržiūros data | 1 | 12 mėn 10 / 1–2 m 6 / 2+ m 2 / Niekada 0 / Nežinau 0 |
| 19 🔴 | DPA sutartys su tiekėjais | **×2** | Su visais 10 / Su dalimi 5 / Ne 0 / Nežinau 0 / Netaikoma — |
| 21 | Trečiųjų prašymų tvarka | 1 | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 22 🔴 | Subjektų prašymų nagrinėjimo tvarka | **×2** | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 24 | Praktinis duomenų suradimas | 1 | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 26 | Prieigų kontrolė pagal funkcijas | 1 | Dokumentuota 10 / Neformaliai 5 / Ne 0 / Nežinau 0 |
| 27 | Individualios paskyros | 1 | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 28 🔴 | Bazinės IT saugumo priemonės (MFA ir kt.) | **×2** | **MULTI** — balas proporcingas pažymėtoms iš 5 priemonių: (pažymėta / 5) × 10. Pvz. 5/5=10, 3/5=6, 2/5=4. „Netaikomos" / „Nežinau" = 0 |
| 29 🔴 | Atsarginės kopijos + atkūrimas | **×2** | Testuota 10 / Netestuota 6 / Ne 0 / Nežinau 0 |
| 30 🔴 | Incidentų reagavimo tvarka | **×2** | Dokumentuota 10 / Neaišku 5 / Ne 0 / Nežinau 0 |
| 31 | Konfidencialumo įsipareigojimai | 1 | Taip 10 / Iš dalies 5 / Ne 0 / Nežinau 0 |
| 32 | Darbuotojų mokymai | 1 | Periodiškai 10 / Tik priėmime 5 / Ne 0 / Nežinau 0 |

**Maksimalus balas:** 20 vertinamų klausimų, iš jų 9 kritiniai (×2), 11 paprastų (×1). Max = 11×10 + 9×20 = **290 balų** (jei nė vienas „netaikoma"). Q28 — multi tipo, balas proporcingas pažymėtoms priemonėms (×2).

---

## RIZIKOS ŽYMEKLIAI (NEįeina į %, eina į išvadą atskirai)

Jei atsakymas „Taip" → pridedamas dėmesio žymeklis išvadoje:

| # | Klausimas | „Taip" reiškia |
|---|---|---|
| 20 | Perdavimas už ES/EEE | Reikia perdavimo garantijų (SCC, adekvatumo sprendimas) vertinimo |
| 23 | Gauti skundai per 3 m. | Padidinta priežiūros rizika |
| 33 | Vaizdo stebėjimas / stebėsena | Atskiras teisinis pagrindas + dokumentai |
| 36 | Jautrūs duomenys | BDAR 9 str. — padidinti reikalavimai |
| 37 | Profiliavimas / AI | BDAR 22 str. — galimas DPIA |
| 38 | Didelis mastas | Galimas DPIA + DPO skyrimo poreikis |

---

## INFORMACINIAI klausimai (kontekstas, ne balai)

Q1, Q2 (lead identity), Q3 veikla, Q4 darbuotojų sk., Q6–8 apimtis, Q18 perdavimas, Q25 saugojimo vieta, Q34 rinkodara, Q35 slapukai, Q39 turimi dok., Q40 reikalinga pagalba, Q41–42 poreikis.

> Q40 („Kokios pagalbos tikitės") — **svarbiausias sales signalas.** AI išvada turi sieti spragas su konkrečiomis Veriva paslaugomis.

---

## KĄ MASTERLEGAL TURI PERŽIŪRĖTI

1. **Kritinių klausimų sąrašas (🔴 ×2)** — ar sutariate, kad būtent šie 9 yra kritiniai? (Žemėlapis, privatumo politika, veiklos įrašai, teisiniai pagrindai, DPA, prašymų tvarka, IT saugumas, kopijos, incidentai.)
2. **„Sena/formali" balas = 4** — ar pasenęs dokumentas vertas 40%? Galbūt mažiau/daugiau.
3. **Rizikos lygių slenksčiai** — ar 80/60/40 ribos tinkamos? Galbūt norite griežčiau.
4. **Rizikos žymeklių formuluotės** — ar teisingai aprašytos teisinės pasekmės (DPIA, 9 str., 22 str.)?
5. **Ar Q4 (darbuotojų sk. >250) ir Q38 (mastas) turėtų automatiškai trigerinti DPO rekomendaciją?**

Pakeitimai daromi `lib/bdar-questions.ts` (balai variantuose) ir `lib/bdar-scoring.ts` (slenksčiai, kritiniai klausimai).
