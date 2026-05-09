export type ErrorCode =
  | 'validation_error'
  | 'db_error'
  | 'ai_timeout'
  | 'ai_error'
  | 'email_error'
  | 'rate_limit_exceeded'
  | 'internal_error'
  | 'unauthorized'
  | 'not_found'
  | 'duplicate'

export interface AppError {
  code: ErrorCode
  message: string
  status: number
}

const STATUS_MAP: Record<ErrorCode, number> = {
  validation_error:    400,
  duplicate:           409,
  unauthorized:        401,
  not_found:           404,
  rate_limit_exceeded: 429,
  db_error:            500,
  ai_timeout:          500,
  ai_error:            500,
  email_error:         500,
  internal_error:      500,
}

export function makeError(code: ErrorCode, message: string): AppError {
  return { code, message, status: STATUS_MAP[code] }
}

export function httpStatus(code: ErrorCode): number {
  return STATUS_MAP[code]
}

// Tipiniai klaidos tekstai — naudoti kaip default
export const ERR = {
  VALIDATION:    (message?: string) => makeError('validation_error', message ?? 'Invalid input'),
  INVALID_EMAIL: () => makeError('validation_error', 'Invalid email format'),
  DB:            (msg: string)   => makeError('db_error', msg),
  AI_TIMEOUT:    ()              => makeError('ai_timeout', 'AI request timed out'),
  AI:            (msg: string)   => makeError('ai_error', msg),
  EMAIL:         (msg: string)   => makeError('email_error', msg),
  RATE_LIMIT:    ()              => makeError('rate_limit_exceeded', 'Too many requests'),
  INTERNAL:      ()              => makeError('internal_error', 'Internal server error'),
  UNAUTHORIZED:  ()              => makeError('unauthorized', 'Unauthorized'),
  DUPLICATE:     ()              => makeError('duplicate', 'Duplicate request'),
} as const
