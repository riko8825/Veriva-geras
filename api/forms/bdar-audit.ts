// api/forms/bdar-audit.ts
// BDAR audito klausimyno apdorojimas (VIEŠAS endpoint — be x-api-key).
// Apsauga: honeypot + origin check + payload validacija + rate-limit (best-effort).
//
// Flow:
//   1. validate (honeypot, consent-implicit, email, privalomi laukai, payload dydis)
//   2. scoreAnswers() — deterministinis balų skaičiavimas (lib/bdar-scoring.ts)
//   3. runPrompt() — AI orientacinė išvada (gpt-4.1 via lib/claude.ts)
//   4. Supabase insert (bdar_audit_responses) — best-effort, neblokuoja email
//   5. Resend → klientui (išvada) + Veriva (lead notifikacija)
//   6. return 200
//
// Runtime: Node (reikia supabase-js + ilgesnio AI call).
// maxDuration konfigūruojamas per vercel.json builds (60s), NE in-file config
// (atitinka blog-gen patternq — in-file config Node funkcijoms gali konfliktuoti su @vercel/node).

import type { IncomingMessage, ServerResponse } from 'http'
import { runPrompt } from '../../lib/claude'
import { sendEmail } from '../../lib/resend'
import { scoreAnswers, RISK_LEVEL_LT, type Answers, type ScoringResult } from '../../lib/bdar-scoring'
import { BDAR_AUDIT_SYSTEM, buildBdarAuditUserPrompt } from '../../lib/bdar-audit-prompt'
import { QUESTIONS } from '../../lib/bdar-questions'
import { checkRateLimit, getClientIp } from '../../lib/ratelimit'
import { log } from '../../lib/logger'

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/
const MAX_BODY = 60_000 // ~60KB — pakanka 42 atsakymams
const MAX_COMMENT_LEN = 1000 // P2-2: stored data poisoning apsauga
const CONSENT_VERSION = '2026-06-07' // P2-1: consent įrodymo versija

interface Payload {
  answers?: Answers
  comments?: Record<string, string>
  consent?: boolean // P2-1: realus sutikimo įrodymas
  meta?: { durationMs?: number; ua?: string; source?: string }
  website?: string // honeypot
}

// ─── Node helpers ───
function sendJson(res: ServerResponse, status: number, data: unknown): void {
  if (res.headersSent) return
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) { reject(new Error('payload_too_large')); req.destroy() }
      else data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function hashIp(ip: string): Promise<string> {
  // P1-4: jokio hardcoded fallback — known salt = IP de-anonimizacija (BDAR).
  const salt = process.env.IP_HASH_SALT
  if (!salt) throw new Error('IP_HASH_SALT_MISSING')
  const { createHash } = await import('crypto')
  return createHash('sha256').update(ip + salt).digest('hex')
}

// ─── Validacija ───
function validate(p: Payload): { ok: true; email: string } | { ok: false; error: string } {
  // Honeypot — botas užpildė nematomą lauką
  if (p.website && p.website.trim().length > 0) return { ok: false, error: 'spam' }

  if (!p.answers || typeof p.answers !== 'object') return { ok: false, error: 'Trūksta atsakymų' }

  // P2-1: realus consent įrodymas (frontend privalo siųsti consent:true)
  if (p.consent !== true) return { ok: false, error: 'Trūksta sutikimo' }

  const orgName = String(p.answers['org-pavadinimas'] ?? '').trim()
  if (orgName.length < 2) return { ok: false, error: 'Nenurodytas organizacijos pavadinimas' }

  const contact = String(p.answers['kontaktinis-asmuo'] ?? '').trim()
  const emailMatch = contact.match(EMAIL_RE)
  if (!emailMatch) return { ok: false, error: 'Nenurodytas galiojantis el. paštas' }

  // Bent pusė vertinamų klausimų atsakyta (anti-garbage)
  const answeredCount = QUESTIONS.filter((q) => {
    const v = p.answers![q.id]
    return Array.isArray(v) ? v.length > 0 : Boolean(v)
  }).length
  if (answeredCount < 10) return { ok: false, error: 'Per mažai atsakymų' }

  return { ok: true, email: emailMatch[0] }
}

// ─── Email šablonai ───
const BRAND_WRAP = (inner: string): string => `<!DOCTYPE html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f8f7f4;font-family:'Segoe UI',Arial,sans-serif;color:#07111f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:24px 0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid rgba(7,17,31,.08)">
<tr><td style="background:#07111f;padding:24px 32px">
<span style="font-family:'Syne',Arial,sans-serif;font-size:20px;font-weight:800;color:#fff;letter-spacing:.04em">VERIVA</span>
</td></tr>
<tr><td style="padding:32px">${inner}</td></tr>
<tr><td style="padding:20px 32px;background:#f3f2ee;font-size:12px;color:#837e72;line-height:1.6">
Veriva UAB · <a href="https://veriva.lt" style="color:#1a47cc;text-decoration:none">veriva.lt</a> · BDAR atitiktis ir kibernetinis saugumas<br>
Tai automatinis pirminis orientacinis įvertinimas, ne teisinė išvada ar auditas.
</td></tr>
</table></td></tr></table></body></html>`

function riskBadge(score: ScoringResult): string {
  const colors: Record<string, string> = { low: '#16a34a', medium: '#c8962a', high: '#ea580c', critical: '#dc2626' }
  const c = colors[score.riskLevel] ?? '#837e72'
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr>
<td style="background:${c};border-radius:10px;padding:16px 24px;text-align:center">
<div style="font-size:34px;font-weight:800;color:#fff;line-height:1;font-family:'Syne',Arial,sans-serif">${score.compliancePct}%</div>
<div style="font-size:13px;color:rgba(255,255,255,.9);margin-top:4px;letter-spacing:.04em">${RISK_LEVEL_LT[score.riskLevel]}</div>
</td></tr></table>`
}

function clientEmailHtml(orgName: string, score: ScoringResult, aiHtml: string): string {
  return BRAND_WRAP(`
<h1 style="font-family:'Syne',Arial,sans-serif;font-size:22px;margin:0 0 8px">Jūsų BDAR atitikties įvertinimas</h1>
<p style="font-size:14px;color:#44413b;margin:0 0 20px">Organizacija: <strong>${esc(orgName)}</strong></p>
${riskBadge(score)}
<div style="font-size:14px;line-height:1.65;color:#07111f">${aiHtml}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px"><tr>
<td style="background:#1a47cc;border-radius:10px"><a href="https://veriva.lt/#kontaktai" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:14px">Susisiekti dėl išsamaus įvertinimo →</a></td>
</tr></table>
<p style="font-size:12px;color:#837e72;line-height:1.6;margin:20px 0 0;padding-top:20px;border-top:1px solid rgba(7,17,31,.08)">
Šis įvertinimas pagrįstas Jūsų pateiktais atsakymais ir yra orientacinis. Jis nepakeičia išsamaus BDAR audito ar teisinės konsultacijos. Galutinė atitiktis nustatoma tik atlikus detalų patikrinimą.
</p>`)
}

function vivaNotifHtml(orgName: string, contact: string, email: string, score: ScoringResult, answers: Answers): string {
  const gapsRows = score.gaps.slice(0, 8).map((g) =>
    `<tr><td style="padding:4px 8px;font-size:12px;color:${g.weight === 2 ? '#dc2626' : '#44413b'}">${g.weight === 2 ? '🔴' : '•'} ${esc(g.question.slice(0, 70))}</td><td style="padding:4px 8px;font-size:12px;color:#837e72">${esc(g.answerLabel)}</td></tr>`
  ).join('')
  const flags = score.riskFlags.map((f) => `<li style="font-size:12px;color:#ea580c">${esc(f.label)}</li>`).join('')
  const pagalba = Array.isArray(answers['reikalinga-pagalba']) ? (answers['reikalinga-pagalba'] as string[]).join(', ') : '—'

  return BRAND_WRAP(`
<h1 style="font-family:'Syne',Arial,sans-serif;font-size:20px;margin:0 0 16px">🔔 Naujas BDAR audito lead</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;line-height:1.6;margin-bottom:20px">
<tr><td style="color:#837e72;padding:3px 0;width:130px">Organizacija</td><td style="color:#07111f"><strong>${esc(orgName)}</strong></td></tr>
<tr><td style="color:#837e72;padding:3px 0">Kontaktas</td><td style="color:#07111f">${esc(contact)}</td></tr>
<tr><td style="color:#837e72;padding:3px 0">El. paštas</td><td><a href="mailto:${esc(email)}" style="color:#1a47cc">${esc(email)}</a></td></tr>
<tr><td style="color:#837e72;padding:3px 0">Atitiktis</td><td style="color:#07111f"><strong>${score.compliancePct}% — ${RISK_LEVEL_LT[score.riskLevel]}</strong></td></tr>
<tr><td style="color:#837e72;padding:3px 0">Tikisi pagalbos</td><td style="color:#07111f">${esc(pagalba)}</td></tr>
</table>
<p style="font-size:13px;font-weight:600;margin:0 0 6px">Svarbiausios spragos:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f3f2ee;border-radius:8px;padding:4px">${gapsRows}</table>
${flags ? `<p style="font-size:13px;font-weight:600;margin:16px 0 6px">Rizikos žymekliai:</p><ul style="margin:0;padding-left:18px">${flags}</ul>` : ''}
<p style="font-size:12px;color:#837e72;margin-top:20px">Pilnas įrašas — Supabase: bdar_audit_responses.</p>`)
}

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

// ─── Handler (top-level guard — kad crash grąžintų JSON, ne FUNCTION_INVOCATION_FAILED) ───
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await handleRequest(req, res)
  } catch (e) {
    console.error('[bdar-audit] FATAL', e instanceof Error ? e.stack : e)
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Vidinė klaida', detail: e instanceof Error ? e.message : String(e) })
    }
  }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestId = randomId()
  if (req.method !== 'POST') { sendJson(res, 405, { error: 'Method not allowed' }); return }

  // Origin check (best-effort CSRF apsauga viešai formai)
  const origin = (req.headers['origin'] as string) ?? ''
  const allowed = ['https://veriva.lt', 'https://www.veriva.lt']
  if (origin && !allowed.some((a) => origin.startsWith(a)) && process.env.NODE_ENV === 'production') {
    sendJson(res, 403, { error: 'Forbidden origin' }); return
  }

  // P0-1: rate limit — viešas AI+email endpointas (kaštų DoS apsauga).
  // 3/min per IP (AI brangus). In-memory: stabdo trivialų loop'ą, ne distributed DDoS.
  const clientIp = getClientIp(req)
  const rl = checkRateLimit(`bdar-audit:${clientIp}`, 3)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    sendJson(res, 429, { error: 'Per daug užklausų. Bandykite po minutės.' }); return
  }

  let payload: Payload
  try {
    const raw = await readBody(req)
    payload = JSON.parse(raw)
  } catch (e) {
    const msg = e instanceof Error && e.message === 'payload_too_large' ? 'Per didelė užklausa' : 'Neteisingas JSON'
    sendJson(res, 400, { error: msg }); return
  }

  const v = validate(payload)
  if (!v.ok) {
    // Honeypot — grąžinam 200 botui (neatskleidžiam, kad atpažinom)
    if (v.error === 'spam') { sendJson(res, 200, { ok: true }); return }
    sendJson(res, 400, { error: v.error }); return
  }

  const answers = payload.answers as Answers
  const email = v.email

  // 2. Scoring (deterministinis)
  let score: ScoringResult
  try {
    score = scoreAnswers(answers)
  } catch (e) {
    console.error('[bdar-audit] scoring error', e)
    void log({ workflow: 'bdar-audit', status: 'error', request_id: requestId, step: 'scoring', error: errMsg(e) })
    sendJson(res, 500, { error: 'Vertinimo klaida' }); return
  }

  // 3. AI išvada
  let aiHtml = ''
  let aiModel = 'gpt-4.1'
  try {
    aiHtml = await runPrompt({
      system: BDAR_AUDIT_SYSTEM,
      user: buildBdarAuditUserPrompt(score, answers),
      maxTokens: 1200,
    })
    aiHtml = sanitizeAiHtml(aiHtml)
  } catch (e) {
    console.error('[bdar-audit] AI error', e)
    void log({ workflow: 'bdar-audit', status: 'warning', request_id: requestId, step: 'ai', error_code: 'AI_FALLBACK', error: errMsg(e) })
    aiHtml = fallbackConclusion(score)
    aiModel = 'fallback'
  }

  // 4. Supabase insert (best-effort — neblokuoja email klientui)
  const ip = ((req.headers['x-forwarded-for'] as string) ?? '').split(',')[0].trim() || 'unknown'
  let ipHash: string | null = null
  try { ipHash = await hashIp(ip) } catch { ipHash = null } // IP_HASH_SALT trūksta → nesaugom IP (data minimization)
  try {
    const { supabase } = await import('../../lib/supabase')
    const { error } = await supabase.from('bdar_audit_responses').insert({
      org_name: score.lead.orgName,
      contact_raw: score.lead.contact,
      email,
      consent: payload.consent === true,
      consent_version: CONSENT_VERSION,
      answers,
      comments: clampComments(payload.comments),
      compliance_pct: score.compliancePct,
      risk_level: score.riskLevel,
      earned_points: score.earnedPoints,
      max_points: score.maxPoints,
      gaps: score.gaps,
      risk_flags: score.riskFlags,
      section_scores: score.sectionScores,
      ai_conclusion: aiHtml,
      ai_model: aiModel,
      duration_ms: payload.meta?.durationMs ?? null,
      ip_hash: ipHash,
      user_agent: payload.meta?.ua ?? (req.headers['user-agent'] as string) ?? null,
      source: payload.meta?.source ?? 'bdar-auditas',
    })
    if (error) console.error('[bdar-audit] supabase insert error', error.message)
  } catch (e) {
    console.error('[bdar-audit] supabase unavailable', e instanceof Error ? e.message : e)
  }

  // 5. Email — klientui (privaloma) + Veriva (notifikacija)
  const from = process.env.RESEND_FROM_EMAIL ?? 'Veriva <hello@veriva.lt>'
  const notifyTo = process.env.RESEND_NOTIFY_EMAIL ?? 'info@veriva.lt'

  let clientEmailSent = false
  try {
    await sendEmail({
      to: email,
      from,
      replyTo: notifyTo,
      subject: `Jūsų BDAR atitikties įvertinimas — ${score.compliancePct}%`,
      html: clientEmailHtml(score.lead.orgName, score, aiHtml),
    })
    clientEmailSent = true
  } catch (e) {
    console.error('[bdar-audit] client email failed', errMsg(e))
    void log({ workflow: 'bdar-audit', status: 'error', request_id: requestId, step: 'email-client', error_code: 'EMAIL_FAIL', error: errMsg(e) })
  }

  // Veriva notifikacija (best-effort)
  try {
    await sendEmail({
      to: notifyTo,
      from,
      replyTo: email,
      subject: `🔔 BDAR lead: ${score.lead.orgName} (${score.compliancePct}% — ${RISK_LEVEL_LT[score.riskLevel]})`,
      html: vivaNotifHtml(score.lead.orgName, score.lead.contact, email, score, answers),
    })
  } catch (e) {
    console.error('[bdar-audit] notify email failed', e instanceof Error ? e.message : e)
  }

  void log({
    workflow: 'bdar-audit', status: 'success', request_id: requestId, step: 'complete',
    output: { compliancePct: score.compliancePct, riskLevel: score.riskLevel, gaps: score.gaps.length, emailSent: clientEmailSent, aiModel },
    duration_ms: payload.meta?.durationMs,
  })

  if (!clientEmailSent) {
    // Lead išsaugotas, bet email nepavyko — pranešam, kad susisieksim
    sendJson(res, 200, { ok: true, emailSent: false, message: 'Atsakymai gauti. Susisieksime per 24 val.' })
    return
  }

  sendJson(res, 200, { ok: true, emailSent: true })
}

function randomId(): string {
  // requestId — užtenka nekriptografinio, varijuojam pagal laiką+atsitiktinumą
  return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// AI HTML saugumas (P1-1): ALLOWLIST, ne blacklist.
// Leidžiam TIK <p> <ul> <li> <strong> <br> be jokių atributų. Visa kita šalinama.
function sanitizeAiHtml(html: string): string {
  let s = html.trim().replace(/^```html\s*/i, '').replace(/```\s*$/, '')
  // Pašalinam pavojingus elementus KARTU su turiniu (kad neliktų plain-text liekanų)
  s = s.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  // Pašalinam VISKĄ, kas nėra leistinas tag'as (atidarantis/uždarantis)
  s = s.replace(/<(?!\/?(?:p|ul|li|strong|br)\b)[^>]*>/gi, '')
  // Likusiuose leistinuose tag'uose pašalinam visus atributus (onerror, href, style ir t.t.)
  s = s.replace(/<(\/?(?:p|ul|li|strong|br))\b[^>]*>/gi, '<$1>')
  return s
}

function clampComments(comments: Record<string, string> | undefined): Record<string, string> {
  if (!comments || typeof comments !== 'object') return {}
  const out: Record<string, string> = {}
  let n = 0
  for (const [k, v] of Object.entries(comments)) {
    if (n++ >= 50) break // P2-2: max 50 komentaro laukų
    if (typeof v === 'string' && v.trim()) out[String(k).slice(0, 60)] = v.slice(0, MAX_COMMENT_LEN)
  }
  return out
}

function fallbackConclusion(score: ScoringResult): string {
  const top = score.gaps.slice(0, 4).map((g) => `<li>${esc(g.question.slice(0, 90))}</li>`).join('')
  return `<p>Pagal Jūsų atsakymus, organizacijos BDAR atitiktis įvertinta <strong>${score.compliancePct}%</strong> (${RISK_LEVEL_LT[score.riskLevel]}).</p>
${top ? `<p><strong>Svarbiausios sritys, kurioms reikia dėmesio:</strong></p><ul>${top}</ul>` : ''}
<p>Rekomenduojame susisiekti su Veriva komanda dėl išsamesnio įvertinimo ir konkretaus veiksmų plano.</p>`
}
