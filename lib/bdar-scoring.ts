// lib/bdar-scoring.ts
// Deterministinis BDAR atitikties scoring. Naudoja lib/bdar-questions.ts kaip šaltinį.
//
// METODOLOGIJA (DRAFT — teisinis review: docs/bdar-scoring-matrica.md):
//   1. Vertinami TIK "single" klausimai, kurie turi atitikties prasmę (score variantai).
//   2. Kiekvienas klausimas duoda 0–10 balų × weight (1 arba 2 kritiniams).
//   3. Atitiktis % = surinkti balai / max galimi balai.
//   4. Rizikos žymekliai (už-ES, skundai, vaizdo, jautrūs, AI, mastas) NEmažina %,
//      o pridedami kaip atskiras rizikos profilis (riskFlags) AI išvadai.
//   5. Spragos (gaps) — visi atitikties klausimai kur score < 5, surūšiuoti pagal svorį.
//
// Slenksčiai (rizikos lygis pagal atitikties %):
//   ≥80%  : low      — gera bazė
//   60–79%: medium   — yra spragų
//   40–59%: high     — reikšmingos spragos
//   <40%  : critical — sisteminga rizika

import { QUESTIONS, QUESTION_BY_ID, type Question } from './bdar-questions'

export type Answers = Record<string, string | string[]>

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Gap {
  n: number
  id: string
  section: string
  question: string
  answerLabel: string
  weight: number
  score: number
}

export interface RiskFlag {
  n: number
  id: string
  label: string
}

export interface SectionScore {
  id: string
  title: string
  pct: number | null // null jei sekcijoje nėra vertinamų klausimų
}

export interface ScoringResult {
  /** Bendra atitiktis 0–100. */
  compliancePct: number
  riskLevel: RiskLevel
  earnedPoints: number
  maxPoints: number
  gaps: Gap[]
  riskFlags: RiskFlag[]
  sectionScores: SectionScore[]
  /** Kontaktiniai/lead laukai ištraukti iš open klausimų. */
  lead: { orgName: string; contact: string }
}

// Klausimai kurie yra RIZIKOS ŽYMEKLIAI, ne atitikties matas.
// "taip" čia reiškia padidintą dėmesį, ne spragą — neįtraukiami į % skaičiavimą.
const RISK_FLAG_QUESTIONS: Record<string, { triggerValue: string; label: string }> = {
  'perdavimas-uz-es': {
    triggerValue: 'taip',
    label: 'Duomenys gali būti tvarkomi už ES / EEE ribų — reikia perdavimo garantijų vertinimo',
  },
  'gauti-skundai': {
    triggerValue: 'taip',
    label: 'Per 3 metus gauta prašymų / skundų dėl duomenų tvarkymo',
  },
  'vaizdo-stebejimas': {
    triggerValue: 'taip',
    label: 'Vykdomas vaizdo stebėjimas / darbuotojų stebėsena — reikia atskiro teisinio pagrindo ir dokumentų',
  },
  'jautresni-duomenys': {
    triggerValue: 'taip',
    label: 'Tvarkomi specialių kategorijų / jautrūs duomenys — padidinti reikalavimai (BDAR 9 str.)',
  },
  'automatizuotas-vertinimas': {
    triggerValue: 'taip',
    label: 'Naudojamas profiliavimas / automatizuotas vertinimas (BDAR 22 str.) — galimas DPIA poreikis',
  },
  'didelis-mastas': {
    triggerValue: 'taip',
    label: 'Duomenys tvarkomi dideliu mastu — galimas DPIA ir DPO skyrimo poreikis',
  },
}

// MULTI tipo klausimai kurie VERTINAMI atitikties balais proporcingai pažymėtoms
// "geroms" priemonėms. Balas = (pažymėta gerų / iš viso gerų) × 10 × weight.
// "ne" / "nezinau" pažymėjimas geru nelaikomas (proporcija nedidėja).
const MULTI_SCORED_QUESTIONS: Record<string, { goodValues: string[]; label: string }> = {
  'it-saugumo-priemones': {
    // 5 bazinės IT saugumo priemonės (BDAR 32 str. — tinkamos techninės priemonės)
    goodValues: ['slaptazodziai', 'mfa', 'ekrano-uzrakinimas', 'antivirusine', 'atnaujinimai'],
    label: 'Bazinės IT saugumo priemonės',
  },
}

// Klausimai kurie NEvertinami atitikties balais (informaciniai / poreikio / vietos).
// Šie eina į AI kontekstą bet ne į %.
const NON_SCORED_QUESTIONS = new Set<string>([
  'veikla', // 3 — informacinis
  'darbuotoju-skaicius', // 4 — informacinis (lemia DPO/mastą atskirai)
  'skaitmenine-platforma', // 5 — informacinis
  'asmenu-kategorijos', // 6 — apimtis
  'duomenu-kategorijos', // 7 — apimtis
  'tvarkymo-tikslai', // 8 — apimtis
  'perdavimas-tretiesiems', // 18 — apimtis
  'duomenu-saugojimo-vieta', // 25 — informacinis
  'rinkodara', // 34 — poreikis/rizika informacinis
  'slapukai', // 35 — informacinis
  'turimi-dokumentai', // 39 — poreikis
  'reikalinga-pagalba', // 40 — poreikis (svarbu sales, ne atitikčiai)
  'dokumentai-ivertinimui', // 41 — poreikis
  'terminas-situacija', // 42 — poreikis
])

/** Ar klausimas įtraukiamas į atitikties % skaičiavimą. */
function isScored(q: Question): boolean {
  if (q.type !== 'single') return false
  if (NON_SCORED_QUESTIONS.has(q.id)) return false
  if (RISK_FLAG_QUESTIONS[q.id]) return false
  if (!q.options?.some((o) => typeof o.score === 'number')) return false
  return true
}

function optionLabel(q: Question, value: string): string {
  return q.options?.find((o) => o.value === value)?.label ?? value
}

function riskLevelFromPct(pct: number): RiskLevel {
  if (pct >= 80) return 'low'
  if (pct >= 60) return 'medium'
  if (pct >= 40) return 'high'
  return 'critical'
}

export function scoreAnswers(answers: Answers): ScoringResult {
  let earned = 0
  let max = 0
  const gaps: Gap[] = []
  const riskFlags: RiskFlag[] = []

  // Sekcijų agregavimas
  const sectionAgg: Record<string, { earned: number; max: number; title: string }> = {}

  for (const q of QUESTIONS) {
    // Rizikos žymekliai
    const flag = RISK_FLAG_QUESTIONS[q.id]
    if (flag) {
      if (answers[q.id] === flag.triggerValue) {
        riskFlags.push({ n: q.n, id: q.id, label: flag.label })
      }
      continue
    }

    // Multi tipo vertinami klausimai (proporcingai pažymėtoms priemonėms)
    const multi = MULTI_SCORED_QUESTIONS[q.id]
    if (multi) {
      const selected = answers[q.id]
      const picked = Array.isArray(selected) ? selected : selected ? [selected] : []
      const goodCount = multi.goodValues.filter((v) => picked.includes(v)).length
      const score = multi.goodValues.length > 0 ? (goodCount / multi.goodValues.length) * 10 : 0
      const weight = q.weight ?? 1
      const weighted = score * weight
      const weightedMax = 10 * weight

      earned += weighted
      max += weightedMax

      const agg = (sectionAgg[q.section] ??= { earned: 0, max: 0, title: sectionTitle(q.section) })
      agg.earned += weighted
      agg.max += weightedMax

      if (score < 5) {
        gaps.push({
          n: q.n,
          id: q.id,
          section: q.section,
          question: q.text,
          answerLabel: goodCount > 0 ? `Taikoma ${goodCount} iš ${multi.goodValues.length} priemonių` : 'Nepažymėta priemonių',
          weight,
          score: Math.round(score),
        })
      }
      continue
    }

    if (!isScored(q)) continue

    const raw = answers[q.id]
    const value = Array.isArray(raw) ? raw[0] : raw
    const opt = q.options?.find((o) => o.value === value)
    const score = opt?.score ?? 0
    const weight = q.weight ?? 1

    // "netaikoma" (score -1) — klausimas išmetamas iš skaičiavimo
    if (score < 0) continue

    const weighted = score * weight
    const weightedMax = 10 * weight

    earned += weighted
    max += weightedMax

    // Sekcija
    const agg = (sectionAgg[q.section] ??= { earned: 0, max: 0, title: sectionTitle(q.section) })
    agg.earned += weighted
    agg.max += weightedMax

    // Spraga jei silpnas atsakymas
    if (score < 5) {
      gaps.push({
        n: q.n,
        id: q.id,
        section: q.section,
        question: q.text,
        answerLabel: value ? optionLabel(q, value) : 'Neatsakyta',
        weight,
        score,
      })
    }
  }

  const compliancePct = max > 0 ? Math.round((earned / max) * 100) : 0

  // Spragos: pirma kritinės (weight 2), tada pagal žemiausią balą
  gaps.sort((a, b) => b.weight - a.weight || a.score - b.score || a.n - b.n)

  const sectionScores: SectionScore[] = Object.entries(sectionAgg).map(([id, v]) => ({
    id,
    title: v.title,
    pct: v.max > 0 ? Math.round((v.earned / v.max) * 100) : null,
  }))

  return {
    compliancePct,
    riskLevel: riskLevelFromPct(compliancePct),
    earnedPoints: earned,
    maxPoints: max,
    gaps,
    riskFlags,
    sectionScores,
    lead: {
      orgName: String(answers['org-pavadinimas'] ?? '').trim(),
      contact: String(answers['kontaktinis-asmuo'] ?? '').trim(),
    },
  }
}

function sectionTitle(id: string): string {
  const map: Record<string, string> = {
    bendrieji: 'Bendrieji duomenys',
    apimtis: 'Tvarkymo apimtis',
    dokumentai: 'Dokumentai ir pagrindai',
    tretieji: 'Tretieji asmenys',
    teises: 'Subjektų teisės',
    saugumas: 'Informacinis saugumas',
    rizikos: 'Rizikos sritys',
    poreikis: 'Paslaugų poreikis',
  }
  return map[id] ?? id
}

export const RISK_LEVEL_LT: Record<RiskLevel, string> = {
  low: 'Žema rizika',
  medium: 'Vidutinė rizika',
  high: 'Aukšta rizika',
  critical: 'Kritinė rizika',
}
