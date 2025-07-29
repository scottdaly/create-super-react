type CsrfBundle = { nonce: string; token: string; exp: number }
let csrfCache: CsrfBundle | null = null

async function fetchCsrf(): Promise<CsrfBundle | null> {
  try {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function ensureCsrf(): Promise<CsrfBundle | null> {
  const now = Date.now()
  if (csrfCache && csrfCache.exp - 5000 > now) return csrfCache
  const fresh = await fetchCsrf()
  if (fresh) csrfCache = fresh
  return fresh
}

export async function apiFetch<T = any>(
  input: string,
  opts: { method?: string; body?: any; headers?: Record<string, string>; allowNoCsrf?: boolean } = {}
): Promise<Response> {
  const method = (opts.method || 'GET').toUpperCase()
  const headers: Record<string, string> = { ...(opts.headers || {}) }
  let body: BodyInit | undefined = undefined

  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    body = JSON.stringify(opts.body)
  } else {
    body = opts.body
  }

  const unsafe = !['GET','HEAD','OPTIONS'].includes(method)
  if (unsafe && !opts.allowNoCsrf) {
    const b = await ensureCsrf()
    if (b) {
      headers['X-CSRF-Nonce'] = b.nonce
      headers['X-CSRF-Token'] = b.token
    }
  }

  return fetch(input, { method, headers, body, credentials: 'include' })
}