// lib/bdar-audit-prompt.ts
// AI išvados promptas BDAR audito klausimynui.
// Balai jau suskaičiuoti serveryje (lib/bdar-scoring.ts) — AI TIK rašo personalizuotą
// orientacinę išvadą pagal pateiktus balus, spragas ir rizikos žymeklius.
// AI NEvertina iš naujo ir NEkeičia procentų.

import { RISK_LEVEL_LT, type ScoringResult } from './bdar-scoring'
import { QUESTION_BY_ID } from './bdar-questions'

export const BDAR_AUDIT_SYSTEM = `Tu esi Veriva (veriva.lt) duomenų apsaugos ekspertas — teisės ir IT komanda, padedanti Lietuvos įmonėms pasiekti BDAR atitiktį.

Tavo užduotis: parašyti TRUMPĄ, KONKREČIĄ, ORIENTACINĘ pirminio BDAR atitikties įvertinimo išvadą organizacijos vadovui, remiantis JAU SUSKAIČIUOTAIS balais ir nustatytomis spragomis.

GRIEŽTOS TAISYKLĖS:
- Rašyk LIETUVIŠKAI, profesionaliai, dalykiškai. Be marketingo, be perdėto draugiškumo, be šauktukų.
- NEKEISK pateikto atitikties procento ar rizikos lygio — jie jau apskaičiuoti.
- NESUKURK faktų, kurių nėra duomenyse. Remkis TIK pateiktomis spragomis ir žymekliais.
- Tai ORIENTACINIS įvertinimas, NE teisinė išvada ir NE auditas. Tai privalo aiškiai matytis.
- Nenurodyk konkrečių baudų sumų ar grėsmių, kurių negali pagrįsti.
- 3–5 pastraipos, ~250–350 žodžių. Aiškiai struktūruota.

IŠVADOS STRUKTŪRA (grąžink TIK HTML su <p>, <ul>, <li>, <strong> — JOKIO <html>/<body>/<style>):
1. <p> Bendras vertinimas: pamink atitikties lygį ir ką jis reiškia praktiškai (1–2 sakiniai).
2. <p><strong>Svarbiausios spragos:</strong></p> + <ul> su 3–5 konkrečiomis spragomis iš duomenų. Kiekviena spraga — kodėl tai svarbu BDAR požiūriu.
3. Jei yra rizikos žymeklių — <p><strong>Papildomo dėmesio sritys:</strong></p> + jas trumpai paaiškink.
4. <p><strong>Rekomenduojami kiti žingsniai:</strong></p> — 2–3 konkretūs veiksmai, susiję su spragomis. Susiek su Veriva paslaugomis natūraliai (pvz. „rekomenduojame pradėti nuo dokumentų tvarkymo veiklos įrašų parengimo").
5. <p> Pabaiga: pasiūlymas susisiekti dėl išsamesnio įvertinimo. Trumpas, be spaudimo.`

export function buildBdarAuditUserPrompt(score: ScoringResult, answers: Record<string, unknown>): string {
  const lines: string[] = []

  // Prompt injection apsauga (P1-2): apribojam ilgį (output sanitizuojamas allowlist'u)
  lines.push(`ORGANIZACIJA: ${(score.lead.orgName || '(nenurodyta)').slice(0, 120)}`)
  lines.push('')
  lines.push(`ATITIKTIES LYGIS: ${score.compliancePct}% — ${RISK_LEVEL_LT[score.riskLevel]}`)
  lines.push(`(${score.earnedPoints}/${score.maxPoints} balų)`)
  lines.push('')

  // Kontekstas (informaciniai atsakymai)
  const veikla = labelOf('veikla', answers['veikla'])
  const dydis = labelOf('darbuotoju-skaicius', answers['darbuotoju-skaicius'])
  if (veikla) lines.push(`Veikla: ${veikla}`)
  if (dydis) lines.push(`Darbuotojų: ${dydis}`)

  const pagalba = answers['reikalinga-pagalba']
  if (Array.isArray(pagalba) && pagalba.length) {
    const labels = pagalba.map((v) => labelOf('reikalinga-pagalba', v)).filter(Boolean)
    if (labels.length) lines.push(`Tikisi pagalbos su: ${labels.join(', ')}`)
  }
  const terminas = labelOf('terminas-situacija', answers['terminas-situacija'])
  if (terminas) lines.push(`Situacija/terminas: ${terminas}`)
  lines.push('')

  // Sekcijų balai
  lines.push('SEKCIJŲ ATITIKTIS:')
  score.sectionScores.forEach((s) => {
    if (s.pct !== null) lines.push(`- ${s.title}: ${s.pct}%`)
  })
  lines.push('')

  // Spragos
  if (score.gaps.length) {
    lines.push('NUSTATYTOS SPRAGOS (pirmos = svarbiausios):')
    score.gaps.slice(0, 8).forEach((g) => {
      lines.push(`- [${g.weight === 2 ? 'KRITINĖ' : 'svarbi'}] ${shortQ(g.question)} → atsakymas: „${g.answerLabel}"`)
    })
  } else {
    lines.push('SPRAGŲ NENUSTATYTA — atitiktis gera.')
  }
  lines.push('')

  // Rizikos žymekliai
  if (score.riskFlags.length) {
    lines.push('RIZIKOS ŽYMEKLIAI (reikia papildomo dėmesio):')
    score.riskFlags.forEach((f) => lines.push(`- ${f.label}`))
    lines.push('')
  }

  lines.push('Parašyk orientacinę išvadą pagal sistemos taisykles. Grąžink TIK HTML turinį.')
  return lines.join('\n')
}

function labelOf(qid: string, value: unknown): string {
  if (!value || typeof value !== 'string') return ''
  const q = QUESTION_BY_ID[qid]
  return q?.options?.find((o) => o.value === value)?.label ?? ''
}

function shortQ(text: string): string {
  // Pirmas sakinys arba iki 100 simbolių
  const first = text.split('?')[0]
  return (first.length > 100 ? first.slice(0, 100) + '…' : first) + '?'
}
