export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
  signal?: AbortSignal
  attachments?: Array<{ filename: string; content: string }>  // base64 encoded
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('[resend] RESEND_API_KEY env variable is missing')

  const body: Record<string, unknown> = {
    from: params.from ?? 'Empirra <hello@empirra.com>',
    to: params.to,
    subject: params.subject,
    html: params.html,
    reply_to: params.replyTo ?? 'hello@empirra.com',
  }

  if (params.attachments?.length) {
    body.attachments = params.attachments
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal: params.signal,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json() as { message?: string; name?: string }
    throw new Error(`email_error:${err.name ?? response.status}:${err.message ?? response.statusText}`)
  }

  return response.json()
}
