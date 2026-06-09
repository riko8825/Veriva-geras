/* assets/js/bdar-questions-data.js
 * BDAR audito klausimyno duomenys FRONTEND'UI (rodymas).
 * Balai NEįtraukti — vertinimas vyksta serveryje (lib/bdar-scoring.ts).
 * Sinchronizuota su lib/bdar-questions.ts pagal `n` ir `id`.
 * Jei keiti klausimus — keisk ABU failus.
 */
window.BDAR_INTRO =
  'Šis klausimynas skirtas pirminiam Jūsų organizacijos asmens duomenų tvarkymo situacijos įvertinimui. ' +
  'Atsakymai padės nustatyti, kokių dokumentų, procesų ar papildomų veiksmų gali reikėti. ' +
  'Jeigu į konkretų klausimą atsakymo nežinote, pasirinkite „Nežinau" – tai normalu ir padės tiksliau įvertinti situaciją.';

window.BDAR_SECTIONS = [
  {
    id: 'bendrieji',
    title: 'Bendrieji duomenys apie organizaciją',
    questions: [
      { n: 1, id: 'org-pavadinimas', type: 'open', required: true, text: 'Organizacijos pavadinimas.' },
      { n: 2, id: 'kontaktinis-asmuo', type: 'open', required: true, text: 'Kontaktinis asmuo, pareigos, el. paštas ir telefono numeris.', help: 'Nurodytu el. paštu atsiųsime Jūsų išvadą. Pateiktus kontaktinius duomenis tvarkome vadovaudamiesi mūsų privatumo politika ir Jūsų sutikimu, išreikštu pateikiant atsakymus į šį klausimyną.' },
      { n: 3, id: 'veikla', type: 'single', text: 'Kokią veiklą vykdo Jūsų organizacija?', options: [
        ['paslaugos','Paslaugos'],['prekyba','Prekyba'],['el-prekyba','Elektroninė prekyba'],['gamyba','Gamyba'],
        ['svietimas','Švietimas / mokymai'],['it','IT / technologijos'],['personalas','Personalo atranka'],
        ['sveikata','Sveikatos / socialinės paslaugos'],['finansai','Finansinės / apskaitos paslaugos'],
        ['nt','Nekilnojamojo turto / nuomos veikla'],['kita','Kita'] ] },
      { n: 4, id: 'darbuotoju-skaicius', type: 'single', text: 'Kiek darbuotojų dirba organizacijoje?', options: [
        ['1-5','1–5'],['6-10','6–10'],['11-50','11–50'],['51-250','51–250'],['250+','Daugiau kaip 250'] ] },
      { n: 5, id: 'skaitmenine-platforma', type: 'single', text: 'Ar organizacija turi interneto svetainę, elektroninę parduotuvę, klientų savitarnos paskyrą, mobiliąją programėlę ar kitą skaitmeninę platformą?', options: [
        ['taip','Taip'],['ne','Ne'],['planuojama','Planuojama'],['nezinau','Nežinau'] ], comment: 'Nurodykite nuorodą arba trumpai aprašykite.' },
    ],
  },
  {
    id: 'apimtis',
    title: 'Asmens duomenų tvarkymo apimtis',
    questions: [
      { n: 6, id: 'asmenu-kategorijos', type: 'multi', text: 'Kokių asmenų duomenis tvarko organizacija?', options: [
        ['klientu','Klientų / paslaugų gavėjų'],['potencialiu','Potencialių klientų'],['darbuotoju','Darbuotojų'],
        ['kandidatu','Kandidatų į darbuotojus'],['tiekeju','Tiekėjų / partnerių kontaktinių asmenų'],
        ['lankytoju','Svetainės lankytojų'],['naujienlaiskio','Naujienlaiškio gavėjų'],['vaiku','Vaikų / nepilnamečių'],
        ['specialiu','Specialių kategorijų duomenų subjektų'],['kita','Kita'] ] },
      { n: 7, id: 'duomenu-kategorijos', type: 'multi', text: 'Kokias asmens duomenų kategorijas organizacija tvarko?', options: [
        ['vardas','Vardas, pavardė, kontaktai'],['asmens-kodas','Asmens kodas / gimimo data'],['adresas','Gyvenamosios vietos adresas'],
        ['sutartiniai','Sutartiniai / užsakymų duomenys'],['mokejimu','Mokėjimų / finansiniai duomenys'],
        ['darbo-santykiu','Darbuotojų darbo santykių duomenys'],['cv','Kandidatų CV ir atrankos duomenys'],['vaizdo','Vaizdo duomenys'],
        ['ip','IP adresai, slapukai, naršymo duomenys'],['sveikatos','Sveikatos duomenys'],['biometriniai','Biometriniai duomenys'],
        ['teistumas','Duomenys apie teistumą / pažeidimus'],['vaiku','Vaikų duomenys'],['kita','Kita'] ] },
      { n: 8, id: 'tvarkymo-tikslai', type: 'multi', text: 'Kokiais pagrindiniais tikslais tvarkomi asmens duomenys?', options: [
        ['paslaugos','Paslaugų teikimas / užsakymų vykdymas'],['klientu-adm','Klientų administravimas'],['apskaita','Buhalterinė apskaita'],
        ['personalo-adm','Personalo administravimas'],['atranka','Kandidatų atranka'],['rinkodara','Tiesioginė rinkodara'],
        ['analitika','Svetainės analitika / slapukai'],['vaizdo-stebejimas','Vaizdo stebėjimas / turto apsauga'],
        ['vidine','Vidinė komunikacija'],['skundai','Skundų, prašymų ar ginčų administravimas'],
        ['teisines','Teisinių prievolių vykdymas'],['kita','Kita'] ] },
    ],
  },
  {
    id: 'dokumentai',
    title: 'Turimi dokumentai ir duomenų tvarkymo pagrindai',
    questions: [
      { n: 9, id: 'duomenu-zemelapis', type: 'single', text: 'Ar organizacija turi aiškų supratimą, kuriose sistemose, dokumentuose ar platformose laikomi asmens duomenys?', options: [
        ['taip','Taip, turime aiškų sąrašą'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ],
        comment: 'Nurodykite pagrindines sistemas, pvz., el. paštas, CRM, buhalterinė programa, Google Drive, Microsoft 365, serveris, popierinės bylos.' },
      { n: 10, id: 'atsakingas-asmuo', type: 'single', text: 'Ar organizacijoje aišku, kas atsakingas už asmens duomenų apsaugos klausimus?', options: [
        ['taip-formaliai','Taip, paskirtas konkretus asmuo'],['taip-neformaliai','Taip, bet neformaliai'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 11, id: 'privatumo-politika-klientai', type: 'single', text: 'Ar organizacija turi klientams / paslaugų gavėjams skirtą privatumo politiką arba privatumo pranešimą?', options: [
        ['taip-aktualu','Taip, aktualų ir naudojamą'],['taip-seniai','Taip, bet seniai neperžiūrėtą'],['ne','Ne'],['nezinau','Nežinau'],['netaikoma','Netaikoma'] ] },
      { n: 12, id: 'privatumo-pranesimas-darbuotojai', type: 'single', text: 'Ar organizacija turi darbuotojams ir kandidatams skirtą privatumo pranešimą?', options: [
        ['taip-aktualu','Taip, aktualų ir naudojamą'],['taip-seniai','Taip, bet seniai neperžiūrėtą'],['ne','Ne'],['nezinau','Nežinau'],['netaikoma','Netaikoma'] ] },
      { n: 13, id: 'vidines-taisykles', type: 'single', text: 'Ar organizacija turi vidines asmens duomenų tvarkymo taisykles, politiką ar kitą vidaus dokumentą dėl asmens duomenų tvarkymo?', options: [
        ['taip-taikoma','Taip, patvirtintą ir taikomą'],['taip-formaliai','Taip, bet tik formaliai / neperžiūrėtą'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 14, id: 'veiklos-irasai', type: 'single', text: 'Ar organizacija turi duomenų tvarkymo veiklos įrašus arba duomenų tvarkymo žemėlapį, kuriame matyti, kokie duomenys, kokiais tikslais, pagrindais, terminais ir kam perduodami?', options: [
        ['taip','Taip'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 15, id: 'teisiniai-pagrindai', type: 'single', text: 'Ar organizacija yra nusistačiusi asmens duomenų tvarkymo teisinius pagrindus, pvz., sutarties vykdymas, teisinė prievolė, sutikimas, teisėtas interesas?', options: [
        ['taip','Taip, kiekvienam pagrindiniam tikslui'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 16, id: 'saugojimo-terminai', type: 'single', text: 'Ar organizacija yra nusistačiusi, kiek laiko saugo skirtingus asmens duomenis ir kada jie turi būti ištrinami / sunaikinami?', options: [
        ['taip','Taip, turime saugojimo terminų taisykles'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 17, id: 'perziura-data', type: 'single', text: 'Kada paskutinį kartą buvo peržiūrėti BDAR dokumentai?', options: [
        ['12men','Per paskutinius 12 mėn.'],['1-2metai','Prieš 1–2 metus'],['2+metai','Daugiau kaip prieš 2 metus'],['niekada','Niekada'],['nezinau','Nežinau'] ] },
    ],
  },
  {
    id: 'tretieji',
    title: 'Tretieji asmenys, tiekėjai ir duomenų perdavimas',
    questions: [
      { n: 18, id: 'perdavimas-tretiesiems', type: 'multi', text: 'Kam organizacija perduoda arba leidžia pasiekti asmens duomenis?', options: [
        ['buhalteriai','Buhalteriams'],['it-tiekejai','IT tiekėjams'],['debesija','Debesijos / hostingo tiekėjams'],
        ['crm','CRM / platformos tiekėjams'],['mokejimai','Mokėjimų paslaugų teikėjams'],['kurjeriai','Kurjeriams'],
        ['rinkodara','Rinkodaros paslaugų teikėjams'],['teisininkai','Teisininkams / konsultantams'],
        ['institucijos','Valstybės institucijoms'],['susijusios','Susijusioms įmonėms'],['kita','Kita'],['nezinau','Nežinau'] ] },
      { n: 19, id: 'dpa-sutartys', type: 'single', text: 'Ar su tiekėjais, kurie organizacijos vardu tvarko asmens duomenis, yra sudarytos asmens duomenų tvarkymo sutartys arba sutarties priedai dėl duomenų tvarkymo?', options: [
        ['taip-visi','Taip, su visais'],['taip-dalis','Taip, bet tik su dalimi'],['ne','Ne'],['nezinau','Nežinau'],['netaikoma','Netaikoma'] ] },
      { n: 20, id: 'perdavimas-uz-es', type: 'single', text: 'Ar organizacija naudoja paslaugų teikėjus arba sistemas, kurių duomenys gali būti tvarkomi už ES / EEE ribų, pvz., JAV paslaugų teikėjai, tarptautinės debesijos, el. pašto, rinkodaros ar analitikos platformos?', options: [
        ['taip','Taip'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 21, id: 'treciuju-prasymai', type: 'single', text: 'Ar organizacija turi aiškią tvarką, kaip vertinami trečiųjų asmenų prašymai pateikti asmens duomenis, pvz., advokatų, antstolių, policijos, institucijų ar kitų asmenų paklausimai?', options: [
        ['taip','Taip'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
    ],
  },
  {
    id: 'teises',
    title: 'Duomenų subjektų teisės ir komunikacija',
    questions: [
      { n: 22, id: 'prasymu-tvarka', type: 'single', text: 'Ar organizacija turi aiškią tvarką, kaip nagrinėjami asmenų prašymai dėl jų duomenų, pvz., susipažinti, ištaisyti, ištrinti, apriboti tvarkymą, nesutikti su tvarkymu?', options: [
        ['taip','Taip'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 23, id: 'gauti-skundai', type: 'single', text: 'Ar organizacijoje buvo gauta prašymų, skundų ar pretenzijų dėl asmens duomenų tvarkymo per paskutinius 3 metus?', options: [
        ['taip','Taip'],['ne','Ne'],['nezinau','Nežinau'] ], comment: 'Trumpai nurodykite pobūdį, jei žinoma.' },
      { n: 24, id: 'duomenu-paieska', type: 'single', text: 'Ar organizacija gali praktiškai surasti konkretaus asmens duomenis ir pateikti jam informaciją ar kopiją, jei toks prašymas būtų gautas?', options: [
        ['taip','Taip'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
    ],
  },
  {
    id: 'saugumas',
    title: 'Informacinis saugumas ir organizacinės priemonės',
    questions: [
      { n: 25, id: 'duomenu-saugojimo-vieta', type: 'multi', text: 'Kur saugomi organizacijos tvarkomi asmens duomenys?', options: [
        ['kompiuteriai','Darbuotojų kompiuteriuose'],['serveris','Vietiniame serveryje'],['debesija','Debesijos paslaugose'],
        ['tiekejai','Tiekėjų sistemose'],['el-pastas','El. pašto dėžutėse'],['popierines','Popierinėse bylose'],['misriai','Mišriai'],['nezinau','Nežinau'] ] },
      { n: 26, id: 'prieigos-kontrole', type: 'single', text: 'Ar prieigos prie sistemų ir dokumentų suteikiamos pagal darbuotojų funkcijas, t. y. tik tiems asmenims, kuriems duomenys reikalingi darbui?', options: [
        ['taip-dokumentuota','Taip, dokumentuota ir taikoma'],['taip-neformaliai','Taip, bet neformaliai'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 27, id: 'individualios-paskyros', type: 'single', text: 'Ar darbuotojai naudoja individualias paskyras ir slaptažodžius, o bendros paskyros nėra naudojamos arba yra ribojamos?', options: [
        ['taip','Taip'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 28, id: 'it-saugumo-priemones', type: 'multi', text: 'Kurios bazinės IT saugumo priemonės taikomos organizacijoje?', options: [
        ['slaptazodziai','Slaptažodžių taisyklės'],['mfa','MFA / dviejų veiksnių autentifikavimas'],
        ['ekrano-uzrakinimas','Automatinis ekrano užrakinimas'],['antivirusine','Antivirusinė apsauga'],
        ['atnaujinimai','Reguliarūs atnaujinimai'],['ne','Netaikomos'],['nezinau','Nežinau'] ],
        comment: 'Kita — nurodykite kitas taikomas priemones (jei yra).' },
      { n: 29, id: 'atsargines-kopijos', type: 'single', text: 'Ar daromos atsarginės duomenų kopijos ir ar organizacija žino, kaip prireikus atkurti duomenis?', options: [
        ['taip-testuota','Taip, kopijos daromos ir atkūrimas testuotas'],['taip-netestuota','Kopijos daromos, bet atkūrimas netestuotas'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 30, id: 'incidentu-tvarka', type: 'single', text: 'Ar organizacija turi incidentų / asmens duomenų saugumo pažeidimų registravimo ir reagavimo tvarką?', options: [
        ['taip-dokumentuota','Taip, yra dokumentuota ir darbuotojai žino, ką daryti'],['taip-neaisku','Taip, bet neaišku, ar veikia praktikoje'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 31, id: 'konfidencialumo-isipareigojimai', type: 'single', text: 'Ar darbuotojai yra pasirašę konfidencialumo įsipareigojimus arba darbo sutartyse / vidaus taisyklėse yra nustatyta pareiga saugoti asmens duomenų paslaptį?', options: [
        ['taip','Taip'],['is-dalies','Iš dalies'],['ne','Ne'],['nezinau','Nežinau'] ] },
      { n: 32, id: 'darbuotoju-mokymai', type: 'single', text: 'Ar darbuotojai yra apmokomi ar bent supažindinami su asmens duomenų apsauga, konfidencialumu, sukčiavimo / phishing ir saugaus darbo su informacija principais?', options: [
        ['taip-periodiskai','Taip, periodiškai'],['tik-priemimo','Tik priėmimo į darbą metu'],['ne','Ne'],['nezinau','Nežinau'] ] },
    ],
  },
  {
    id: 'rizikos',
    title: 'Papildomos rizikos sritys',
    questions: [
      { n: 33, id: 'vaizdo-stebejimas', type: 'single', text: 'Ar organizacija vykdo vaizdo stebėjimą, garso įrašymą, darbuotojų veiklos stebėseną, GPS sekimą ar kitą panašią kontrolę?', options: [
        ['taip','Taip'],['ne','Ne'],['nezinau','Nežinau'] ], comment: 'Jei taip, trumpai aprašykite.' },
      { n: 34, id: 'rinkodara', type: 'single', text: 'Ar organizacija siunčia naujienlaiškius, vykdo tiesioginę rinkodarą, naudoja reklamos auditorijas, remarketingą ar panašias rinkodaros priemones?', options: [
        ['taip','Taip'],['ne','Ne'],['planuojama','Planuojama'],['nezinau','Nežinau'] ] },
      { n: 35, id: 'slapukai', type: 'single', text: 'Ar svetainėje naudojami slapukai, analitikos įrankiai, reklamos pikseliai ar kitos sekimo technologijos?', options: [
        ['taip','Taip'],['ne','Ne'],['nezinau','Nežinau'],['neturime','Neturime svetainės'] ] },
      { n: 36, id: 'jautresni-duomenys', type: 'single', text: 'Ar organizacija tvarko jautresnius duomenis, pvz., sveikatos duomenis, biometrinius duomenis, vaikų duomenis, duomenis apie teistumą, finansinius duomenis, psichologinio vertinimo / testavimo rezultatus?', options: [
        ['taip','Taip'],['ne','Ne'],['nezinau','Nežinau'] ], comment: 'Jei taip, nurodykite kokius.' },
      { n: 37, id: 'automatizuotas-vertinimas', type: 'single', text: 'Ar organizacija naudoja automatizuotą vertinimą, profiliavimą, testus, reitingavimą, rizikos balus, AI įrankius ar kitus sprendimus, kurie gali daryti įtaką asmeniui?', options: [
        ['taip','Taip'],['ne','Ne'],['planuojama','Planuojama'],['nezinau','Nežinau'] ] },
      { n: 38, id: 'didelis-mastas', type: 'single', text: 'Ar organizacija reguliariai arba dideliu mastu tvarko asmens duomenis, pvz., turi didelę klientų duomenų bazę, nuolat stebi vartotojų elgesį, tvarko daug jautrių duomenų ar teikia paslaugas pažeidžiamiems asmenims?', options: [
        ['taip','Taip'],['ne','Ne'],['nezinau','Nežinau'] ] },
    ],
  },
  {
    id: 'poreikis',
    title: 'Paslaugų poreikis',
    questions: [
      { n: 39, id: 'turimi-dokumentai', type: 'multi', text: 'Kokius BDAR / duomenų apsaugos dokumentus organizacija jau turi?', options: [
        ['tvarkymo-aprasas','Asmens duomenų tvarkymo aprašas / politika (vidaus)'],['privatumo-politika','Privatumo politika (viešai svetainėje)'],['darbuotoju-pranesimas','Darbuotojų privatumo pranešimas'],
        ['kandidatu-pranesimas','Kandidatų privatumo pranešimas'],['slapuku-politika','Slapukų politika'],
        ['sutikimu-formos','Sutikimų formos'],['veiklos-irasai','Duomenų tvarkymo veiklos įrašai'],
        ['saugojimo-terminai','Duomenų saugojimo terminų sąrašas'],['dpa-sutartys','Duomenų tvarkymo sutartys su tiekėjais'],
        ['incidentu-tvarka','Incidentų valdymo tvarka'],['prasymu-tvarka','Duomenų subjektų prašymų nagrinėjimo tvarka'],
        ['vaizdo-dokumentai','Vaizdo stebėjimo dokumentai'],['neturime','Neturime'],['nezinau','Nežinau'] ] },
      { n: 40, id: 'reikalinga-pagalba', type: 'multi', text: 'Kokios pagalbos šiuo metu tikitės?', options: [
        ['pirminis-auditas','Pirminio BDAR audito'],['privatumo-politika','Privatumo politikos parengimo / atnaujinimo'],
        ['darbuotoju-dokumentai','Darbuotojų dokumentų sutvarkymo'],['dpa-sutartys','Sutarčių su duomenų tvarkytojais parengimo'],
        ['slapuku-dokumentai','Slapukų / svetainės dokumentų sutvarkymo'],['vaizdo-dokumentai','Vaizdo stebėjimo dokumentų'],
        ['veiklos-irasai','Duomenų tvarkymo veiklos įrašų'],['saugojimo-terminai','Saugojimo terminų nustatymo'],
        ['incidentu-tvarka','Incidentų valdymo tvarkos'],['mokymai','Darbuotojų mokymų'],
        ['dpo','DPO / nuolatinės konsultacijos'],['rekomendacija','Nežinome, reikia rekomendacijos'] ] },
      { n: 41, id: 'dokumentai-ivertinimui', type: 'single', text: 'Ar galite pateikti turimus dokumentus pirminiam įvertinimui?', options: [
        ['taip','Taip'],['ne','Ne'],['veliau','Pateiksime vėliau'] ],
        comment: 'Galite išvardinti: privatumo politika, darbuotojų pranešimai, slapukų politika, sutartys su tiekėjais, incidentų tvarka, kita.' },
      { n: 42, id: 'terminas-situacija', type: 'single', text: 'Ar yra konkretus terminas arba situacija, dėl kurios reikalinga BDAR pagalba?', options: [
        ['nauja-svetaine','Nauja svetainė / platforma'],['kliento-klausimas','Gautas kliento ar institucijos klausimas'],
        ['auditas','Planuojamas auditas'],['incidentas','Incidentas'],['naujas-modelis','Naujas paslaugų modelis'],
        ['sutartis','Sutartis su partneriu'],['susitvarkymas','Bendras dokumentų susitvarkymas'],['kita','Kita'] ] },
    ],
  },
];
