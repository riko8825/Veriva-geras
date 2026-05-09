async function dbInsert(row: Record<string, unknown>): Promise<void> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const ac = new AbortController()
  setTimeout(() => ac.abort(), 3000)
  await fetch(`${url}/rest/v1/automation_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(row),
    signal: ac.signal
  })
}

interface LogEntry {
  workflow: string
  status: 'success' | 'error' | 'warning' | 'step'
  request_id?: string
  step?: string
  error_code?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  duration_ms?: number
}

export async function log(entry: LogEntry): Promise<void> {
  try {
    await dbInsert(entry as unknown as Record<string, unknown>)
  } catch {
    console.error('[logger] Failed to write log:', entry.workflow, entry.status)
  }
}

export async function logStep(
  workflow: string,
  requestId: string,
  step: string,
  data?: Record<string, unknown>,
  status: 'success' | 'error' | 'warning' = 'success'
): Promise<void> {
  try {
    await dbInsert({
      workflow,
      status,
      request_id: requestId,
      step,
      output: data ?? {},
    })
  } catch {
    console.error('[logger] Failed to write step log:', workflow, step)
  }
}
