// lib/bdar-questions.ts
// BDAR audito klausimyno SINGLE SOURCE OF TRUTH.
// Backend (scoring + endpoint) ir frontend (wizard) naudoja TĄ PATĮ šaltinį.
// Šaltinis: docs/bdar-auditas-klausimynas.xlsx (MasterLegal LT, 2026-06-07).
//
// Tipai:
//   - "open"   : laisvas tekstas (lead identity / komentarai) — NEvertinama balais
//   - "single" : vienas variantas — vertinama balais
//   - "multi"  : keli variantai — vertinama pagal pasirinkimų rinkinį
//
// Kiekvienas vertinamas variantas turi `score` (0–10). Aukštesnis = geresnė atitiktis.
// "nežinau" / "ne" paprastai = 0. Scoring logika: lib/bdar-scoring.ts.
// SVARBU: balai yra DRAFT. Teisinis review — docs/bdar-scoring-matrica.md.

export type QuestionType = 'open' | 'single' | 'multi'

export interface Option {
  value: string
  label: string
  /** Balas 0–10 (tik single/multi). open klausimams nenaudojama. */
  score?: number
}

/** Sub-laukas „open" klausimui, kuris dalijasi į kelis atskirus įvedimo laukus (pvz. Q2). */
export interface SubField {
  /** Unikalus key answers žemėlapyje (pvz. "kontaktinis-el-pastas"). */
  key: string
  label: string
  /** HTML input tipas — email/tel renderina specializuotą lauką + validaciją. */
  inputType: 'email' | 'tel' | 'text'
  required?: boolean
}

export interface Question {
  /** Originalus numeris klausimyne (1–42). */
  n: number
  id: string
  section: string
  type: QuestionType
  text: string
  options?: Option[]
  /** Ar yra papildomas komentaro/nuorodos laukas. */
  comment?: boolean
  commentLabel?: string
  /** „open" klausimui — keli atskiri įvedimo laukai vietoj vieno. */
  fields?: SubField[]
  /** Ar privalomas (open identity laukai). */
  required?: boolean
  /** Klausimo svoris bendrame score (default 1). Kritiniai = 2. */
  weight?: number
}

export interface Section {
  id: string
  title: string
  questions: Question[]
}

export const INTRO =
  'Šis klausimynas skirtas pirminiam Jūsų organizacijos asmens duomenų tvarkymo situacijos įvertinimui. ' +
  'Atsakymai padės nustatyti, kokių dokumentų, procesų ar papildomų veiksmų gali reikėti, kad asmens duomenų ' +
  'tvarkymas būtų aiškus, pagrįstas ir atitiktų BDAR reikalavimus. Jeigu į konkretų klausimą atsakymo nežinote, ' +
  'pasirinkite „Nežinau" – tai normalu ir padės tiksliau įvertinti situaciją.'

// ─────────────────────────────────────────────────────────────
// Standartiniai balų rinkiniai (DRY)
// ─────────────────────────────────────────────────────────────

/** taip / iš dalies / ne / nežinau */
const YES_PARTIAL_NO_UNK = (): Option[] => [
  { value: 'taip', label: 'Taip', score: 10 },
  { value: 'is-dalies', label: 'Iš dalies', score: 5 },
  { value: 'ne', label: 'Ne', score: 0 },
  { value: 'nezinau', label: 'Nežinau', score: 0 },
]

/** taip / ne / nežinau */
const YES_NO_UNK = (): Option[] => [
  { value: 'taip', label: 'Taip', score: 10 },
  { value: 'ne', label: 'Ne', score: 0 },
  { value: 'nezinau', label: 'Nežinau', score: 0 },
]

export const SECTIONS: Section[] = [
  // ─── 1. Bendrieji duomenys ───
  {
    id: 'bendrieji',
    title: 'Bendrieji duomenys apie organizaciją',
    questions: [
      {
        n: 1,
        id: 'org-pavadinimas',
        section: 'bendrieji',
        type: 'open',
        text: 'Organizacijos pavadinimas.',
        required: true,
      },
      {
        n: 2,
        id: 'kontaktinis-asmuo',
        section: 'bendrieji',
        type: 'open',
        text: 'Kontaktiniai duomenys.',
        required: true,
        fields: [
          { key: 'kontaktinis-asmuo-vardas', label: 'Atsakingas asmuo ir pareigos', inputType: 'text', required: true },
          { key: 'kontaktinis-el-pastas', label: 'El. paštas', inputType: 'email', required: true },
          { key: 'kontaktinis-telefonas', label: 'Telefono numeris', inputType: 'tel', required: false },
        ],
      },
      {
        n: 3,
        id: 'veikla',
        section: 'bendrieji',
        type: 'single',
        text: 'Kokią veiklą vykdo Jūsų organizacija?',
        options: [
          { value: 'paslaugos', label: 'Paslaugos' },
          { value: 'prekyba', label: 'Prekyba' },
          { value: 'el-prekyba', label: 'Elektroninė prekyba' },
          { value: 'gamyba', label: 'Gamyba' },
          { value: 'svietimas', label: 'Švietimas / mokymai' },
          { value: 'it', label: 'IT / technologijos' },
          { value: 'personalas', label: 'Personalo atranka' },
          { value: 'sveikata', label: 'Sveikatos / socialinės paslaugos' },
          { value: 'finansai', label: 'Finansinės / apskaitos paslaugos' },
          { value: 'nt', label: 'Nekilnojamojo turto / nuomos veikla' },
          { value: 'kita', label: 'Kita' },
        ],
      },
      {
        n: 4,
        id: 'darbuotoju-skaicius',
        section: 'bendrieji',
        type: 'single',
        text: 'Kiek darbuotojų dirba organizacijoje?',
        options: [
          { value: '1-5', label: '1–5' },
          { value: '6-10', label: '6–10' },
          { value: '11-50', label: '11–50' },
          { value: '51-250', label: '51–250' },
          { value: '250+', label: 'Daugiau kaip 250' },
        ],
      },
      {
        n: 5,
        id: 'skaitmenine-platforma',
        section: 'bendrieji',
        type: 'single',
        text:
          'Ar organizacija turi interneto svetainę, elektroninę parduotuvę, klientų savitarnos ' +
          'paskyrą, mobiliąją programėlę ar kitą skaitmeninę platformą?',
        options: [
          { value: 'taip', label: 'Taip', score: 10 },
          { value: 'ne', label: 'Ne', score: 10 },
          { value: 'planuojama', label: 'Planuojama', score: 5 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
        comment: true,
        commentLabel: 'Nurodykite nuorodą arba trumpai aprašykite.',
      },
    ],
  },

  // ─── 2. Asmens duomenų tvarkymo apimtis ───
  {
    id: 'apimtis',
    title: 'Asmens duomenų tvarkymo apimtis',
    questions: [
      {
        n: 6,
        id: 'asmenu-kategorijos',
        section: 'apimtis',
        type: 'multi',
        text: 'Kokių asmenų duomenis tvarko organizacija?',
        options: [
          { value: 'klientu', label: 'Klientų / paslaugų gavėjų' },
          { value: 'potencialiu', label: 'Potencialių klientų' },
          { value: 'darbuotoju', label: 'Darbuotojų' },
          { value: 'kandidatu', label: 'Kandidatų į darbuotojus' },
          { value: 'tiekeju', label: 'Tiekėjų / partnerių kontaktinių asmenų' },
          { value: 'lankytoju', label: 'Svetainės lankytojų' },
          { value: 'naujienlaiskio', label: 'Naujienlaiškio gavėjų' },
          { value: 'vaiku', label: 'Vaikų / nepilnamečių' },
          { value: 'specialiu', label: 'Specialių kategorijų duomenų subjektų' },
          { value: 'kita', label: 'Kita' },
        ],
      },
      {
        n: 7,
        id: 'duomenu-kategorijos',
        section: 'apimtis',
        type: 'multi',
        text: 'Kokias asmens duomenų kategorijas organizacija tvarko?',
        options: [
          { value: 'vardas', label: 'Vardas, pavardė, kontaktai' },
          { value: 'asmens-kodas', label: 'Asmens kodas / gimimo data' },
          { value: 'adresas', label: 'Gyvenamosios vietos adresas' },
          { value: 'sutartiniai', label: 'Sutartiniai / užsakymų duomenys' },
          { value: 'mokejimu', label: 'Mokėjimų / finansiniai duomenys' },
          { value: 'darbo-santykiu', label: 'Darbuotojų darbo santykių duomenys' },
          { value: 'cv', label: 'Kandidatų CV ir atrankos duomenys' },
          { value: 'vaizdo', label: 'Vaizdo duomenys' },
          { value: 'ip', label: 'IP adresai, slapukai, naršymo duomenys' },
          { value: 'sveikatos', label: 'Sveikatos duomenys' },
          { value: 'biometriniai', label: 'Biometriniai duomenys' },
          { value: 'teistumas', label: 'Duomenys apie teistumą / pažeidimus' },
          { value: 'vaiku', label: 'Vaikų duomenys' },
          { value: 'kita', label: 'Kita' },
        ],
      },
      {
        n: 8,
        id: 'tvarkymo-tikslai',
        section: 'apimtis',
        type: 'multi',
        text: 'Kokiais pagrindiniais tikslais tvarkomi asmens duomenys?',
        options: [
          { value: 'paslaugos', label: 'Paslaugų teikimas / užsakymų vykdymas' },
          { value: 'klientu-adm', label: 'Klientų administravimas' },
          { value: 'apskaita', label: 'Buhalterinė apskaita' },
          { value: 'personalo-adm', label: 'Personalo administravimas' },
          { value: 'atranka', label: 'Kandidatų atranka' },
          { value: 'rinkodara', label: 'Tiesioginė rinkodara' },
          { value: 'analitika', label: 'Svetainės analitika / slapukai' },
          { value: 'vaizdo-stebejimas', label: 'Vaizdo stebėjimas / turto apsauga' },
          { value: 'vidine', label: 'Vidinė komunikacija' },
          { value: 'skundai', label: 'Skundų, prašymų ar ginčų administravimas' },
          { value: 'teisines', label: 'Teisinių prievolių vykdymas' },
          { value: 'kita', label: 'Kita' },
        ],
      },
    ],
  },

  // ─── 3. Turimi dokumentai ir duomenų tvarkymo pagrindai ───
  {
    id: 'dokumentai',
    title: 'Turimi dokumentai ir duomenų tvarkymo pagrindai',
    questions: [
      {
        n: 9,
        id: 'duomenu-zemelapis',
        section: 'dokumentai',
        type: 'single',
        weight: 2,
        text:
          'Ar organizacija turi aiškų supratimą, kuriose sistemose, dokumentuose ar platformose ' +
          'laikomi asmens duomenys?',
        options: [
          { value: 'taip', label: 'Taip, turime aiškų sąrašą', score: 10 },
          { value: 'is-dalies', label: 'Iš dalies', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
        comment: true,
        commentLabel:
          'Nurodykite pagrindines sistemas, pvz., el. paštas, CRM, buhalterinė programa, ' +
          'personalo sistema, Google Drive, Microsoft 365, serveris, popierinės bylos.',
      },
      {
        n: 10,
        id: 'atsakingas-asmuo',
        section: 'dokumentai',
        type: 'single',
        text: 'Ar organizacijoje aišku, kas atsakingas už asmens duomenų apsaugos klausimus?',
        options: [
          { value: 'taip-formaliai', label: 'Taip, paskirtas konkretus asmuo', score: 10 },
          { value: 'taip-neformaliai', label: 'Taip, bet neformaliai', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 11,
        id: 'privatumo-politika-klientai',
        section: 'dokumentai',
        type: 'single',
        weight: 2,
        text:
          'Ar organizacija turi klientams / paslaugų gavėjams skirtą privatumo politiką arba ' +
          'privatumo pranešimą?',
        options: [
          { value: 'taip-aktualu', label: 'Taip, aktualų ir naudojamą', score: 10 },
          { value: 'taip-seniai', label: 'Taip, bet seniai neperžiūrėtą', score: 4 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
          { value: 'netaikoma', label: 'Netaikoma', score: -1 },
        ],
      },
      {
        n: 12,
        id: 'privatumo-pranesimas-darbuotojai',
        section: 'dokumentai',
        type: 'single',
        text: 'Ar organizacija turi darbuotojams ir kandidatams skirtą privatumo pranešimą?',
        options: [
          { value: 'taip-aktualu', label: 'Taip, aktualų ir naudojamą', score: 10 },
          { value: 'taip-seniai', label: 'Taip, bet seniai neperžiūrėtą', score: 4 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
          { value: 'netaikoma', label: 'Netaikoma', score: -1 },
        ],
      },
      {
        n: 13,
        id: 'vidines-taisykles',
        section: 'dokumentai',
        type: 'single',
        text:
          'Ar organizacija turi vidines asmens duomenų tvarkymo taisykles, politiką ar kitą vidaus ' +
          'dokumentą dėl asmens duomenų tvarkymo?',
        options: [
          { value: 'taip-taikoma', label: 'Taip, patvirtintą ir taikomą', score: 10 },
          { value: 'taip-formaliai', label: 'Taip, bet tik formaliai / neperžiūrėtą', score: 4 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 14,
        id: 'veiklos-irasai',
        section: 'dokumentai',
        type: 'single',
        weight: 2,
        text:
          'Ar organizacija turi duomenų tvarkymo veiklos įrašus arba duomenų tvarkymo žemėlapį, ' +
          'kuriame matyti, kokie duomenys, kokiais tikslais, pagrindais, terminais ir kam perduodami?',
        options: YES_PARTIAL_NO_UNK(),
      },
      {
        n: 15,
        id: 'teisiniai-pagrindai',
        section: 'dokumentai',
        type: 'single',
        weight: 2,
        text:
          'Ar organizacija yra nusistačiusi asmens duomenų tvarkymo teisinius pagrindus, pvz., ' +
          'sutarties vykdymas, teisinė prievolė, sutikimas, teisėtas interesas?',
        options: [
          { value: 'taip', label: 'Taip, kiekvienam pagrindiniam tikslui', score: 10 },
          { value: 'is-dalies', label: 'Iš dalies', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 16,
        id: 'saugojimo-terminai',
        section: 'dokumentai',
        type: 'single',
        text:
          'Ar organizacija yra nusistačiusi, kiek laiko saugo skirtingus asmens duomenis ir kada ' +
          'jie turi būti ištrinami / sunaikinami?',
        options: [
          { value: 'taip', label: 'Taip, turime saugojimo terminų taisykles', score: 10 },
          { value: 'is-dalies', label: 'Iš dalies', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 17,
        id: 'perziura-data',
        section: 'dokumentai',
        type: 'single',
        text: 'Kada paskutinį kartą buvo peržiūrėti BDAR dokumentai?',
        options: [
          { value: '12men', label: 'Per paskutinius 12 mėn.', score: 10 },
          { value: '1-2metai', label: 'Prieš 1–2 metus', score: 6 },
          { value: '2+metai', label: 'Daugiau kaip prieš 2 metus', score: 2 },
          { value: 'niekada', label: 'Niekada', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
    ],
  },

  // ─── 4. Tretieji asmenys, tiekėjai ir duomenų perdavimas ───
  {
    id: 'tretieji',
    title: 'Tretieji asmenys, tiekėjai ir duomenų perdavimas',
    questions: [
      {
        n: 18,
        id: 'perdavimas-tretiesiems',
        section: 'tretieji',
        type: 'multi',
        text: 'Kam organizacija perduoda arba leidžia pasiekti asmens duomenis?',
        options: [
          { value: 'buhalteriai', label: 'Buhalteriams' },
          { value: 'it-tiekejai', label: 'IT tiekėjams' },
          { value: 'debesija', label: 'Debesijos / hostingo tiekėjams' },
          { value: 'crm', label: 'CRM / platformos tiekėjams' },
          { value: 'mokejimai', label: 'Mokėjimų paslaugų teikėjams' },
          { value: 'kurjeriai', label: 'Kurjeriams' },
          { value: 'rinkodara', label: 'Rinkodaros paslaugų teikėjams' },
          { value: 'teisininkai', label: 'Teisininkams / konsultantams' },
          { value: 'institucijos', label: 'Valstybės institucijoms' },
          { value: 'susijusios', label: 'Susijusioms įmonėms' },
          { value: 'kita', label: 'Kita' },
          { value: 'nezinau', label: 'Nežinau' },
        ],
      },
      {
        n: 19,
        id: 'dpa-sutartys',
        section: 'tretieji',
        type: 'single',
        weight: 2,
        text:
          'Ar su tiekėjais, kurie organizacijos vardu tvarko asmens duomenis, yra sudarytos asmens ' +
          'duomenų tvarkymo sutartys arba sutarties priedai dėl duomenų tvarkymo?',
        options: [
          { value: 'taip-visi', label: 'Taip, su visais', score: 10 },
          { value: 'taip-dalis', label: 'Taip, bet tik su dalimi', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
          { value: 'netaikoma', label: 'Netaikoma', score: -1 },
        ],
      },
      {
        n: 20,
        id: 'perdavimas-uz-es',
        section: 'tretieji',
        type: 'single',
        text:
          'Ar organizacija naudoja paslaugų teikėjus arba sistemas, kurių duomenys gali būti tvarkomi ' +
          'už ES / EEE ribų, pvz., JAV paslaugų teikėjai, tarptautinės debesijos, el. pašto, rinkodaros ' +
          'ar analitikos platformos?',
        // "taip" čia = rizikos žymeklis (reikalauja papildomų garantijų), ne gerai/blogai.
        // Vertinama atskirai scoring'e kaip rizikos flag, ne kaip atitiktis.
        options: YES_NO_UNK(),
      },
      {
        n: 21,
        id: 'treciuju-prasymai',
        section: 'tretieji',
        type: 'single',
        text:
          'Ar organizacija turi aiškią tvarką, kaip vertinami trečiųjų asmenų prašymai pateikti ' +
          'asmens duomenis, pvz., advokatų, antstolių, policijos, institucijų ar kitų asmenų paklausimai?',
        options: YES_PARTIAL_NO_UNK(),
      },
    ],
  },

  // ─── 5. Duomenų subjektų teisės ir komunikacija ───
  {
    id: 'teises',
    title: 'Duomenų subjektų teisės ir komunikacija',
    questions: [
      {
        n: 22,
        id: 'prasymu-tvarka',
        section: 'teises',
        type: 'single',
        weight: 2,
        text:
          'Ar organizacija turi aiškią tvarką, kaip nagrinėjami asmenų prašymai dėl jų duomenų, pvz., ' +
          'susipažinti, ištaisyti, ištrinti, apriboti tvarkymą, nesutikti su tvarkymu?',
        options: YES_PARTIAL_NO_UNK(),
      },
      {
        n: 23,
        id: 'gauti-skundai',
        section: 'teises',
        type: 'single',
        text:
          'Ar organizacijoje buvo gauta prašymų, skundų ar pretenzijų dėl asmens duomenų tvarkymo per ' +
          'paskutinius 3 metus?',
        // Rizikos žymeklis — "taip" rodo padidintą dėmesį, ne atitikties trūkumą.
        options: YES_NO_UNK(),
        comment: true,
        commentLabel: 'Trumpai nurodykite pobūdį, jei žinoma.',
      },
      {
        n: 24,
        id: 'duomenu-paieska',
        section: 'teises',
        type: 'single',
        text:
          'Ar organizacija gali praktiškai surasti konkretaus asmens duomenis ir pateikti jam informaciją ' +
          'ar kopiją, jei toks prašymas būtų gautas?',
        options: YES_PARTIAL_NO_UNK(),
      },
    ],
  },

  // ─── 6. Informacinis saugumas ir organizacinės priemonės ───
  {
    id: 'saugumas',
    title: 'Informacinis saugumas ir organizacinės priemonės',
    questions: [
      {
        n: 25,
        id: 'duomenu-saugojimo-vieta',
        section: 'saugumas',
        type: 'multi',
        text: 'Kur saugomi organizacijos tvarkomi asmens duomenys?',
        // Vieta pati savaime nėra gerai/blogai — informacinis klausimas (NON_SCORED).
        // Multi: organizacija realiai naudoja kelias duomenų saugojimo vietas / sistemas.
        options: [
          { value: 'kompiuteriai', label: 'Darbuotojų kompiuteriuose' },
          { value: 'serveris', label: 'Vietiniame serveryje' },
          { value: 'debesija', label: 'Debesijos paslaugose' },
          { value: 'tiekejai', label: 'Tiekėjų sistemose' },
          { value: 'el-pastas', label: 'El. pašto dėžutėse' },
          { value: 'popierines', label: 'Popierinėse bylose' },
          { value: 'misriai', label: 'Mišriai' },
          { value: 'nezinau', label: 'Nežinau' },
        ],
      },
      {
        n: 26,
        id: 'prieigos-kontrole',
        section: 'saugumas',
        type: 'single',
        text:
          'Ar prieigos prie sistemų ir dokumentų suteikiamos pagal darbuotojų funkcijas, t. y. tik tiems ' +
          'asmenims, kuriems duomenys reikalingi darbui?',
        options: [
          { value: 'taip-dokumentuota', label: 'Taip, dokumentuota ir taikoma', score: 10 },
          { value: 'taip-neformaliai', label: 'Taip, bet neformaliai', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 27,
        id: 'individualios-paskyros',
        section: 'saugumas',
        type: 'single',
        text:
          'Ar darbuotojai naudoja individualias paskyras ir slaptažodžius, o bendros paskyros nėra ' +
          'naudojamos arba yra ribojamos?',
        options: YES_PARTIAL_NO_UNK(),
      },
      {
        n: 28,
        id: 'it-saugumo-priemones',
        section: 'saugumas',
        type: 'multi',
        weight: 2,
        // Multi: klientas žymi konkrečias taikomas priemones. Scoring — proporcingai
        // pažymėtų bazinių priemonių skaičiui (žr. MULTI_SCORED_QUESTIONS lib/bdar-scoring.ts).
        text: 'Kurios bazinės IT saugumo priemonės taikomos organizacijoje?',
        options: [
          { value: 'slaptazodziai', label: 'Slaptažodžių taisyklės' },
          { value: 'mfa', label: 'MFA / dviejų veiksnių autentifikavimas' },
          { value: 'ekrano-uzrakinimas', label: 'Automatinis ekrano užrakinimas' },
          { value: 'antivirusine', label: 'Antivirusinė apsauga' },
          { value: 'atnaujinimai', label: 'Reguliarūs atnaujinimai' },
          { value: 'ne', label: 'Netaikomos' },
          { value: 'nezinau', label: 'Nežinau' },
        ],
        comment: true,
        commentLabel: 'Kita — nurodykite kitas taikomas priemones (jei yra).',
      },
      {
        n: 29,
        id: 'atsargines-kopijos',
        section: 'saugumas',
        type: 'single',
        weight: 2,
        text:
          'Ar daromos atsarginės duomenų kopijos ir ar organizacija žino, kaip prireikus atkurti duomenis?',
        options: [
          { value: 'taip-testuota', label: 'Taip, kopijos daromos ir atkūrimas testuotas', score: 10 },
          { value: 'taip-netestuota', label: 'Kopijos daromos, bet atkūrimas netestuotas', score: 6 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 30,
        id: 'incidentu-tvarka',
        section: 'saugumas',
        type: 'single',
        weight: 2,
        text:
          'Ar organizacija turi incidentų / asmens duomenų saugumo pažeidimų registravimo ir reagavimo tvarką?',
        options: [
          { value: 'taip-dokumentuota', label: 'Taip, yra dokumentuota ir darbuotojai žino, ką daryti', score: 10 },
          { value: 'taip-neaisku', label: 'Taip, bet neaišku, ar veikia praktikoje', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
      {
        n: 31,
        id: 'konfidencialumo-isipareigojimai',
        section: 'saugumas',
        type: 'single',
        text:
          'Ar darbuotojai yra pasirašę konfidencialumo įsipareigojimus arba darbo sutartyse / vidaus ' +
          'taisyklėse yra nustatyta pareiga saugoti asmens duomenų paslaptį?',
        options: YES_PARTIAL_NO_UNK(),
      },
      {
        n: 32,
        id: 'darbuotoju-mokymai',
        section: 'saugumas',
        type: 'single',
        text:
          'Ar darbuotojai yra apmokomi ar bent supažindinami su asmens duomenų apsauga, konfidencialumu, ' +
          'sukčiavimo / phishing ir saugaus darbo su informacija principais?',
        options: [
          { value: 'taip-periodiskai', label: 'Taip, periodiškai', score: 10 },
          { value: 'tik-priemimo', label: 'Tik priėmimo į darbą metu', score: 5 },
          { value: 'ne', label: 'Ne', score: 0 },
          { value: 'nezinau', label: 'Nežinau', score: 0 },
        ],
      },
    ],
  },

  // ─── 7. Papildomos rizikos sritys ───
  {
    id: 'rizikos',
    title: 'Papildomos rizikos sritys',
    questions: [
      {
        n: 33,
        id: 'vaizdo-stebejimas',
        section: 'rizikos',
        type: 'single',
        text:
          'Ar organizacija vykdo vaizdo stebėjimą, garso įrašymą, darbuotojų veiklos stebėseną, GPS sekimą ' +
          'ar kitą panašią kontrolę?',
        options: YES_NO_UNK(),
        comment: true,
        commentLabel: 'Jei taip, trumpai aprašykite.',
      },
      {
        n: 34,
        id: 'rinkodara',
        section: 'rizikos',
        type: 'single',
        text:
          'Ar organizacija siunčia naujienlaiškius, vykdo tiesioginę rinkodarą, naudoja reklamos auditorijas, ' +
          'remarketingą ar panašias rinkodaros priemones?',
        options: [
          { value: 'taip', label: 'Taip' },
          { value: 'ne', label: 'Ne' },
          { value: 'planuojama', label: 'Planuojama' },
          { value: 'nezinau', label: 'Nežinau' },
        ],
      },
      {
        n: 35,
        id: 'slapukai',
        section: 'rizikos',
        type: 'single',
        text:
          'Ar svetainėje naudojami slapukai, analitikos įrankiai, reklamos pikseliai ar kitos sekimo technologijos?',
        options: [
          { value: 'taip', label: 'Taip' },
          { value: 'ne', label: 'Ne' },
          { value: 'nezinau', label: 'Nežinau' },
          { value: 'neturime', label: 'Neturime svetainės' },
        ],
      },
      {
        n: 36,
        id: 'jautresni-duomenys',
        section: 'rizikos',
        type: 'single',
        text:
          'Ar organizacija tvarko jautresnius duomenis, pvz., sveikatos duomenis, biometrinius duomenis, vaikų ' +
          'duomenis, duomenis apie teistumą, finansinius duomenis, psichologinio vertinimo / testavimo rezultatus?',
        options: YES_NO_UNK(),
        comment: true,
        commentLabel: 'Jei taip, nurodykite kokius.',
      },
      {
        n: 37,
        id: 'automatizuotas-vertinimas',
        section: 'rizikos',
        type: 'single',
        text:
          'Ar organizacija naudoja automatizuotą vertinimą, profiliavimą, testus, reitingavimą, rizikos balus, ' +
          'AI įrankius ar kitus sprendimus, kurie gali daryti įtaką asmeniui?',
        options: [
          { value: 'taip', label: 'Taip' },
          { value: 'ne', label: 'Ne' },
          { value: 'planuojama', label: 'Planuojama' },
          { value: 'nezinau', label: 'Nežinau' },
        ],
      },
      {
        n: 38,
        id: 'didelis-mastas',
        section: 'rizikos',
        type: 'single',
        text:
          'Ar organizacija reguliariai arba dideliu mastu tvarko asmens duomenis, pvz., turi didelę klientų duomenų ' +
          'bazę, nuolat stebi vartotojų elgesį, tvarko daug jautrių duomenų ar teikia paslaugas pažeidžiamiems asmenims?',
        options: YES_NO_UNK(),
      },
    ],
  },

  // ─── 8. Paslaugų poreikis ───
  {
    id: 'poreikis',
    title: 'Paslaugų poreikis',
    questions: [
      {
        n: 39,
        id: 'turimi-dokumentai',
        section: 'poreikis',
        type: 'multi',
        text: 'Kokius BDAR / duomenų apsaugos dokumentus organizacija jau turi?',
        options: [
          { value: 'tvarkymo-aprasas', label: 'Asmens duomenų tvarkymo aprašas / politika (vidaus)' },
          { value: 'privatumo-politika', label: 'Privatumo politika (viešai svetainėje)' },
          { value: 'darbuotoju-pranesimas', label: 'Darbuotojų privatumo pranešimas' },
          { value: 'kandidatu-pranesimas', label: 'Kandidatų privatumo pranešimas' },
          { value: 'slapuku-politika', label: 'Slapukų politika' },
          { value: 'sutikimu-formos', label: 'Sutikimų formos' },
          { value: 'veiklos-irasai', label: 'Duomenų tvarkymo veiklos įrašai' },
          { value: 'saugojimo-terminai', label: 'Duomenų saugojimo terminų sąrašas' },
          { value: 'dpa-sutartys', label: 'Duomenų tvarkymo sutartys su tiekėjais' },
          { value: 'incidentu-tvarka', label: 'Incidentų valdymo tvarka' },
          { value: 'prasymu-tvarka', label: 'Duomenų subjektų prašymų nagrinėjimo tvarka' },
          { value: 'vaizdo-dokumentai', label: 'Vaizdo stebėjimo dokumentai' },
          { value: 'neturime', label: 'Neturime' },
          { value: 'nezinau', label: 'Nežinau' },
        ],
      },
      {
        n: 40,
        id: 'reikalinga-pagalba',
        section: 'poreikis',
        type: 'multi',
        text: 'Kokios pagalbos šiuo metu tikitės?',
        options: [
          { value: 'pirminis-auditas', label: 'Pirminio BDAR audito' },
          { value: 'privatumo-politika', label: 'Privatumo politikos parengimo / atnaujinimo' },
          { value: 'darbuotoju-dokumentai', label: 'Darbuotojų dokumentų sutvarkymo' },
          { value: 'dpa-sutartys', label: 'Sutarčių su duomenų tvarkytojais parengimo' },
          { value: 'slapuku-dokumentai', label: 'Slapukų / svetainės dokumentų sutvarkymo' },
          { value: 'vaizdo-dokumentai', label: 'Vaizdo stebėjimo dokumentų' },
          { value: 'veiklos-irasai', label: 'Duomenų tvarkymo veiklos įrašų' },
          { value: 'saugojimo-terminai', label: 'Saugojimo terminų nustatymo' },
          { value: 'incidentu-tvarka', label: 'Incidentų valdymo tvarkos' },
          { value: 'mokymai', label: 'Darbuotojų mokymų' },
          { value: 'dpo', label: 'DPO / nuolatinės konsultacijos' },
          { value: 'rekomendacija', label: 'Nežinome, reikia rekomendacijos' },
        ],
      },
      {
        n: 41,
        id: 'dokumentai-ivertinimui',
        section: 'poreikis',
        type: 'single',
        text: 'Ar galite pateikti turimus dokumentus pirminiam įvertinimui?',
        options: [
          { value: 'taip', label: 'Taip' },
          { value: 'ne', label: 'Ne' },
          { value: 'veliau', label: 'Pateiksime vėliau' },
        ],
        comment: true,
        commentLabel:
          'Galite išvardinti: privatumo politika, darbuotojų privatumo pranešimai, slapukų politika, ' +
          'BDAR politika, sutartys su tiekėjais, incidentų tvarka, kita.',
      },
      {
        n: 42,
        id: 'terminas-situacija',
        section: 'poreikis',
        type: 'single',
        text: 'Ar yra konkretus terminas arba situacija, dėl kurios reikalinga BDAR pagalba?',
        options: [
          { value: 'nauja-svetaine', label: 'Nauja svetainė / platforma' },
          { value: 'kliento-klausimas', label: 'Gautas kliento ar institucijos klausimas' },
          { value: 'auditas', label: 'Planuojamas auditas' },
          { value: 'incidentas', label: 'Incidentas' },
          { value: 'naujas-modelis', label: 'Naujas paslaugų modelis' },
          { value: 'sutartis', label: 'Sutartis su partneriu' },
          { value: 'susitvarkymas', label: 'Bendras dokumentų susitvarkymas' },
          { value: 'kita', label: 'Kita' },
        ],
      },
    ],
  },
]

/** Visi klausimai plokščiame masyve, surūšiuoti pagal n. */
export const QUESTIONS: Question[] = SECTIONS.flatMap((s) => s.questions).sort((a, b) => a.n - b.n)

/** Greitas lookup pagal id. */
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
)

export const TOTAL_QUESTIONS = QUESTIONS.length
