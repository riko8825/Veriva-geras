// lib/claude.ts — AI wrapper (OpenAI gpt-4.1)
// Eksportuoja runPrompt() — naudojamas blog-gen automatizacijai
//
// Pavadinimas istorinis (originaliai Anthropic Claude), dabar OpenAI gpt-4.1.
// Empirra projekte praeitos: gpt-4o-mini → gpt-4o (timeout) → Claude Sonnet 4.6 (no credits) → gpt-4.1 (current).
// Vercel maxDuration=90s. Budget: 75s AI + ~15s GitHub commits = 90s.

const RETRY_DELAYS: number[] = []
const REQUEST_TIMEOUT_MS = 75_000

export async function runPrompt(params: {
  system: string
  user: string
  model?: string
  maxTokens?: number
  signal?: AbortSignal
}): Promise<string> {
  const model = params.model ?? 'gpt-4.1'
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('[ai] OPENAI_API_KEY env variable is missing')

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    // Forward parent abort if provided
    const onParentAbort = () => controller.abort()
    if (params.signal) {
      if (params.signal.aborted) controller.abort()
      else params.signal.addEventListener('abort', onParentAbort, { once: true })
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_tokens: params.maxTokens ?? 1024,
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
        }),
      })

      if (!response.ok) {
        const err = await response.json() as { error?: { type?: string; message?: string } }
        const type = err.error?.type ?? 'api_error'
        // Retry tik rate limit ir server errors
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`ai_timeout:${type}`)
        }
        throw new Error(`ai_error:${type}:${err.error?.message ?? response.statusText}`)
      }

      const data = await response.json() as { choices: { message: { content: string } }[] }
      return data.choices?.[0]?.message?.content ?? ''

    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (params.signal?.aborted) throw lastError
      if (lastError.message.startsWith('ai_error:')) throw lastError
      if (lastError.name === 'AbortError') {
        throw new Error(`ai_timeout:request_aborted_after_${REQUEST_TIMEOUT_MS}ms`)
      }
      if (attempt === RETRY_DELAYS.length) throw lastError
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]))
    } finally {
      clearTimeout(timer)
      if (params.signal) params.signal.removeEventListener('abort', onParentAbort)
    }
  }

  throw lastError
}
