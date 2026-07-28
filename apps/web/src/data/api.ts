const BASE = '/api/v1'

/**
 * Thrown for any non-2xx response. Callers read `.body.error` — the API returns
 * `{ error, ... }` for every failure path (see server/auth.ts `json`).
 */
export class ApiError extends Error {
  readonly status: number
  readonly body: any

  constructor(status: number, body: any) {
    super(typeof body?.error === 'string' ? body.error : `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    // Session lives in an HttpOnly SameSite=Lax cookie on the same origin.
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text()
  let parsed: any = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) throw new ApiError(res.status, parsed)
  return parsed as T
}

export const apiGet = <T>(path: string) => request<T>('GET', path)
export const apiPost = <T>(path: string, body: unknown = {}) => request<T>('POST', path, body)
export const apiPut = <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body)
export const apiDelete = <T>(path: string) => request<T>('DELETE', path)
