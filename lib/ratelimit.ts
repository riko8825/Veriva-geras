// Simple in-memory rate limiter for Vercel serverless functions
// Kiekvienas cold start turi savo store — pakanka spam apsaugai, ne production DDoS
//
// Per-endpoint limits (s45):
//   lead-capture:  5/min  (truly public — form spam target)
//   proposal-gen: 10/min  (auth-protected — secondary defense)
// Default 10/min back-compat callers without explicit max.

const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000  // 1 minutė
const DEFAULT_MAX_REQUESTS = 10

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(ip: string, maxRequests: number = DEFAULT_MAX_REQUESTS): RateLimitResult {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000)
    }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterSeconds: 0 }
}

export function getClientIp(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  const forwarded = req.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() ?? 'unknown'
  return forwarded?.split(',')[0]?.trim() ?? 'unknown'
}
