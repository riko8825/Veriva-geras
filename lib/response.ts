// Edge runtime response helpers

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: JSON_HEADERS,
  });
}

export function fail(error: string, code: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error, code }), {
    status,
    headers: JSON_HEADERS,
  });
}

export function methodNotAllowed(allowed: string[]): Response {
  return new Response(JSON.stringify({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }), {
    status: 405,
    headers: { ...JSON_HEADERS, Allow: allowed.join(', ') },
  });
}
