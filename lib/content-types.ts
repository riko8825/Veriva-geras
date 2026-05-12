// lib/content-types.ts — 8 content types for blog generation diversity
// Each type defines unique search intent, H2 structure, FAQ angle, CTA framing, link pattern.
// Used by: blog-prompts.buildBlogUserPrompt, blog-gen route (assignment + validation).

export type ContentTypeKey =
  | 'roi'
  | 'comparison'
  | 'roadmap'
  | 'industry'
  | 'workflow'
  | 'case_study'
  | 'mistakes'
  | 'technical_deep_dive';

export interface ContentTypeSpec {
  key: ContentTypeKey;
  label: string;
  intent: string;
  searchIntent: 'commercial' | 'transactional' | 'informational' | 'navigational';
  h2Skeleton: string[];
  faqAngle: string;
  ctaAngle: string;
  linkPattern: string;
  bannedSections: string[];
  requiredElements: string[];
}

export const CONTENT_TYPE_MATRIX: Record<ContentTypeKey, ContentTypeSpec> = {
  roi: {
    key: 'roi',
    label: 'ROI / Cost-benefit',
    intent: 'Pirkėjas vertina, ar investicija atsipirks (pinigai, laikas, baudos rizika).',
    searchIntent: 'commercial',
    h2Skeleton: [
      'Kiek kainuoja [tema] šiandien (status quo)',
      'Tikroji rizikos kaina: scenarijai su skaičiais',
      'Investicijos struktūra: ką tiksliai mokate',
      'Atsipirkimo laikotarpis: 3 įmonių pavyzdžiai',
      'Hidden costs: ko nematote sąmatoje',
      'Kada investicija NEATSIPIRKS (kontrarinis skyrius)',
    ],
    faqAngle: 'Kainos klausimai: "Kiek kainuoja…", "Ar pigiau…", "Kas įeina į kainą", "Kiek užtruks atsipirkti".',
    ctaAngle: 'Konkreti kainos žinutė + nemokama sąmata. NE generic "susisiekite". Pavyzdys: "Gaukite 7 dienų sąmatą — be įsipareigojimų".',
    linkPattern: 'Privaloma 1× link į /kainos. 1× į konkrečią /paslaugos sekciją. 1× į kainų pavyzdžio blog post.',
    bannedSections: ['Kas yra X', 'Apibrėžimas', 'Istorinis kontekstas'],
    requiredElements: ['Bent 3 atskiri €/val skaičiai stat-hl blokuose', 'ROI skaičiavimo formulė', 'Lentelė su kainų breakdown'],
  },
  comparison: {
    key: 'comparison',
    label: 'Comparison / Versus',
    intent: 'Pirkėjas lygina 2-3 sprendimus arba reglamentus prieš sprendimą.',
    searchIntent: 'commercial',
    h2Skeleton: [
      '[A] vs [B]: greitas verdiktas',
      'Apimties skirtumai: kam taikoma',
      'Reikalavimų skirtumai: lentelė',
      'Baudų ir prievolių palyginimas',
      'Implementacijos laikas ir kaina',
      'Kada rinktis [A], kada [B], kada abu',
    ],
    faqAngle: 'Sprendimo klausimai: "Kuo skiriasi…", "Ar verta…", "Kuris geresnis…", "Galima kombinuoti…".',
    ctaAngle: 'Audito/diagnozės žinutė: padedame nuspręsti per pokalbį. Pavyzdys: "30 min konsultacija — pasakysime, kas Jūsų atveju".',
    linkPattern: 'Privaloma 1× link į kiekvieną lyginamų temų pillar postą (jei egzistuoja). 1× į /paslaugos.',
    bannedSections: ['Pristatymas', 'Bendra apžvalga', 'Kodėl svarbu'],
    requiredElements: ['Privaloma palyginimo lentelė (≥6 eilutės)', 'Verdiktas pirmoje sekcijoje', 'Decision tree arba checklist'],
  },
  roadmap: {
    key: 'roadmap',
    label: 'Roadmap / Step-by-step',
    intent: 'Pirkėjas turi atlikti procesą per X laiko ir nori chronologinio plano.',
    searchIntent: 'transactional',
    h2Skeleton: [
      '[N] dienų / mėnesių planas: santrauka',
      '1 etapas: [pavadinimas] (savaitė 1-2)',
      '2 etapas: [pavadinimas] (savaitė 3-4)',
      '3 etapas: [pavadinimas] (savaitė 5-6)',
      'Resursų reikalavimai: kas, kada, kiek valandų',
      'Kontrolės taškai ir signalai, kad einate ne ten',
    ],
    faqAngle: 'Proceso klausimai: "Per kiek laiko…", "Kokia eilė…", "Ką pradėti pirma…", "Kas atsakingas".',
    ctaAngle: 'Project kickoff žinutė: padedame įgyvendinti planą. Pavyzdys: "Pasiruošę pradėti? Suplanuokime kickoff per 7 dienas".',
    linkPattern: '1× į kiekvieno etapo gilesnį blog post (jei yra). 1× į /paslaugos sekciją, kuri atitinka procesą.',
    bannedSections: ['Apibrėžimas', 'Istorinis kontekstas', 'Kodėl tai svarbu'],
    requiredElements: ['HowTo schema (post_howto_schema_json) PRIVALOMA', 'Konkretūs skaičiai (savaitė N, X val)', 'Checklist pabaigoje'],
  },
  industry: {
    key: 'industry',
    label: 'Industry-specific',
    intent: 'Pirkėjas iš konkretaus sektoriaus (sveikatos, finansų, e-commerce) — generic patarimai netinka.',
    searchIntent: 'commercial',
    h2Skeleton: [
      '[Sektorius] specifika: kuo skiriasi nuo kitų',
      'Sektoriniai teisės aktai (be bendro BDAR/NIS2)',
      'Tipiniai pažeidimai šiame sektoriuje (LT pavyzdžiai)',
      '3-5 sektoriaus įmonių case studies',
      'Sektorinė checklist: kas privaloma',
      'Priežiūros institucijos ir komunikacija',
    ],
    faqAngle: 'Sektoriaus klausimai: "Ar mums taikoma…", "Kuo mūsų atvejis…", "Ar užtenka [generic sprendimo]…".',
    ctaAngle: 'Sektoriaus ekspertizės žinutė. Pavyzdys: "Dirbame su [sektorius] įmonėmis nuo 2017 m. — patikrinsime jūsų atitiktį".',
    linkPattern: '1× į /paslaugos sektoriaus paketą (jei yra). 1× į gretimus blog postus tos pačios industrijos.',
    bannedSections: ['Bendras BDAR įvadas', 'Generic patarimai', 'Bet kokiai įmonei'],
    requiredElements: ['Sektoriaus pavadinimas pasikartoja ≥10× tekste', '≥2 sektoriaus įmonių pavyzdžiai (anonimizuoti)', 'Sektorinių aktų sąrašas'],
  },
  workflow: {
    key: 'workflow',
    label: 'Workflow / Process template',
    intent: 'Pirkėjas turi šabloną/procesą paruošti ir jam reikia struktūros + pavyzdžių.',
    searchIntent: 'informational',
    h2Skeleton: [
      'Šablono struktūra: kokie skyriai privalomi',
      'Skyrius po skyriaus: ką rašyti',
      'Realus pavyzdys: pilnas ištraukos blokas',
      'Tipinės klaidos šablonuose',
      'Versijų valdymas ir atnaujinimai',
      'Kada šablono nepakanka — kreipkitės',
    ],
    faqAngle: 'Šablono klausimai: "Ar galiu naudoti…", "Kaip pritaikyti…", "Ką daryti, jei…", "Kur saugoti".',
    ctaAngle: 'Šablono download/customization žinutė. Pavyzdys: "Reikia šablono jūsų atvejui? Paruošime per 3 darbo dienas".',
    linkPattern: '1× į /paslaugos paketo sekciją. 1× į susijusį workflow blog postą.',
    bannedSections: ['Apibrėžimas', 'Bendras kontekstas', 'Kodėl reikia'],
    requiredElements: ['Bent 1× <pre> arba <code> blokas su realiu pavyzdžiu', 'Skyrių checklist', 'Versijų table'],
  },
  case_study: {
    key: 'case_study',
    label: 'Case study / Incident analysis',
    intent: 'Pirkėjas mokosi iš realių incidentų — kas atsitiko, kas neveikė, ką daryti kitaip.',
    searchIntent: 'informational',
    h2Skeleton: [
      'Įvykio chronologija (data → data)',
      'Kas iš tikrųjų atsitiko: faktai',
      'Kur buvo silpnoji vieta',
      'Kaip institucija reagavo (VDAI, NKSC)',
      'Pasekmės įmonei: skaičiai',
      'Pamokos kitoms LT įmonėms (3-5 punktai)',
    ],
    faqAngle: 'Analizės klausimai: "Kaip to išvengti…", "Ar mums galėtų atsitikti…", "Ką darytų [institucija] jei…".',
    ctaAngle: 'Prevencijos audito žinutė. Pavyzdys: "Nenorite tapti kitų case study? Užsisakykite prevencinį auditą".',
    linkPattern: '1× į VDAI/NKSC oficialų sprendimą (eur-lex, vdai.lrv.lt, vrm.lrv.lt). 1× į susijusį prevencijos blog postą.',
    bannedSections: ['Bendras BDAR/NIS2 įvadas', 'Apibrėžimai', 'Generic prevencija'],
    requiredElements: ['Konkreti data (YYYY-MM-DD) chronologijoje', '≥1 link į oficialų šaltinį (vdai/eur-lex/vrm)', 'Skaičiai apie pasekmes (€, val, %)'],
  },
  mistakes: {
    key: 'mistakes',
    label: 'Mistakes / Anti-patterns',
    intent: 'Pirkėjas nori sužinoti, kur LT įmonės dažniausiai klysta, kad nepasikartotų.',
    searchIntent: 'informational',
    h2Skeleton: [
      'TOP 5-7 klaidos (ranked by frequency)',
      'Klaida #1: [pavadinimas] — kodėl ji kartojasi',
      'Klaida #2: [pavadinimas] — kodėl ji kartojasi',
      'Klaida #3: [pavadinimas] — kodėl ji kartojasi',
      'Klaida #4: [pavadinimas] — kodėl ji kartojasi',
      'Klaida #5: [pavadinimas] — kodėl ji kartojasi',
      'Kaip pasitikrinti, ar nepadarėte (3 min testas)',
    ],
    faqAngle: 'Self-diagnosis klausimai: "Kaip žinoti…", "Ar mes klystame…", "Kaip patikrinti…", "Ką taisyti pirmiausia".',
    ctaAngle: 'Audito žinutė: padedame surasti klaidas anksčiau, nei jas suranda VDAI. Pavyzdys: "Prevencinis 4 val auditas — €490".',
    linkPattern: '1× į /paslaugos audito sekciją. 1× į blog postą su gilesniu vienos klaidos analizės.',
    bannedSections: ['Bendras kontekstas', 'Apibrėžimai', 'Istorija'],
    requiredElements: ['Numeruota klaidų lentelė (rank + dažnumas %)', '≥3 atskiri pataisymo žingsniai per klaidą', 'Self-check checklist'],
  },
  technical_deep_dive: {
    key: 'technical_deep_dive',
    label: 'Technical deep dive',
    intent: 'IT/teisės profesionalas nori techninių detalių, str. nuorodų, edge cases.',
    searchIntent: 'informational',
    h2Skeleton: [
      'Techninis kontekstas: ką reikia žinoti pirma',
      'Reglamento str. analizė (paragrafas po paragrafo)',
      'Implementacijos sluoksniai (technical / organizational)',
      'Edge cases: 3 netipiniai scenarijai',
      'Audito takelis: ką saugoti, kiek metų',
      'Integracija su esamais procesais (ISO/ITIL)',
    ],
    faqAngle: 'Profesionalų klausimai: "Kaip techniškai…", "Kuris str. taikomas, kai…", "Ar leistina…", "Audito takelio reikalavimai".',
    ctaAngle: 'Eksperto konsultacijos žinutė. Pavyzdys: "Sudėtingas atvejis? 60 min su DPO — €180".',
    linkPattern: '≥2× link į oficialų teisės akto puslapį (eur-lex.europa.eu, e-tar.lt). 1× į /paslaugos.',
    bannedSections: ['Bendras įvadas', 'Kas yra X (basic)', 'Marketing pranašumai'],
    requiredElements: ['≥3 konkrečios str. nuorodos su numeriu (BDAR 32 str., NIS2 21 str. ir pan.)', '≥1 lentelė su techninių reikalavimų matrix', 'Edge case sekcija'],
  },
};

/**
 * Resolve content type for a topic.
 * Priority: explicit topic.content_type > pillar+postType heuristic > 'mistakes' default.
 */
export function resolveContentType(
  explicit: string | undefined,
  pillar: string | undefined,
  postType: 'pillar' | 'cluster' | 'standalone',
): ContentTypeSpec {
  if (explicit && explicit in CONTENT_TYPE_MATRIX) {
    return CONTENT_TYPE_MATRIX[explicit as ContentTypeKey];
  }

  // Heuristic fallback
  if (postType === 'pillar') {
    if (pillar === 'bdar' || pillar === 'nis2') return CONTENT_TYPE_MATRIX.technical_deep_dive;
    if (pillar === 'sauga') return CONTENT_TYPE_MATRIX.roadmap;
    return CONTENT_TYPE_MATRIX.industry;
  }

  // Cluster fallback — rotate by pillar to avoid same type stacking
  const fallback: Record<string, ContentTypeKey> = {
    bdar: 'mistakes',
    nis2: 'comparison',
    dpo: 'roi',
    sauga: 'workflow',
    mokymai: 'case_study',
  };
  const key = fallback[(pillar ?? '').toLowerCase()] ?? 'mistakes';
  return CONTENT_TYPE_MATRIX[key];
}

/**
 * Render type-specific instructions for AI prompt.
 * Replaces the old generic skeleton in BLOG_SYSTEM_PROMPT.
 */
export function renderContentTypeInstructions(spec: ContentTypeSpec): string {
  return `═══════════════════════════════════════════════════════
CONTENT TYPE: ${spec.label.toUpperCase()} (${spec.key})
═══════════════════════════════════════════════════════

INTENT: ${spec.intent}
SEARCH INTENT: ${spec.searchIntent}

H2 SKELETON (privaloma laikytis ŠIO šablono — adaptuok pavadinimus, NE keisk struktūros):
${spec.h2Skeleton.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}

FAQ ANGLE: ${spec.faqAngle}

CTA ANGLE: ${spec.ctaAngle}

INTERNAL LINK PATTERN: ${spec.linkPattern}

DRAUDŽIAMOS SEKCIJOS (NEKURK šių H2 — jos jau yra kituose Veriva tipų straipsniuose):
${spec.bannedSections.map(s => `  ✗ ${s}`).join('\n')}

PRIVALOMI ELEMENTAI (be jų straipsnis bus atmestas):
${spec.requiredElements.map(s => `  ✓ ${s}`).join('\n')}`;
}
