// Klien API admin (PHP + SQLite). Token sesi disimpan di localStorage.
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''
const TOKEN_KEY = 'admin_token'
const EMAIL_KEY = 'admin_email'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T
  if (!res.ok) {
    if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY) }
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  token: () => localStorage.getItem(TOKEN_KEY),
  email: () => localStorage.getItem(EMAIL_KEY),
  async login(email: string, password: string) {
    const res = await fetch(`${BASE}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = (await res.json().catch(() => ({}))) as { token?: string; email?: string; error?: string }
    if (!res.ok || !data.token) throw new Error(data.error || 'Login gagal.')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(EMAIL_KEY, data.email ?? email)
  },
  async logout() {
    try { await req('/logout', { method: 'POST' }) } catch { /* abaikan */ }
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY)
  },
  list: <T,>(table: string) => req<T[]>(`/${table}`),
  insert: (table: string, payload: unknown) => req(`/${table}`, { method: 'POST', body: JSON.stringify(payload) }),
  update: (table: string, id: string, payload: unknown) => req(`/${table}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (table: string, id: string) => req(`/${table}/${id}`, { method: 'DELETE' }),
  getSettings: () => req<{ data: Record<string, unknown> }>('/settings'),
  saveSettings: (data: Record<string, unknown>) => req('/settings', { method: 'PUT', body: JSON.stringify({ data }) }),
}
