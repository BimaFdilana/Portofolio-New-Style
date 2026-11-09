// Tabel & normalisasi baris — port 1:1 dari server/api.php (PHP).
// Bentuk JSON yang dikembalikan HARUS sama persis, karena panel admin
// (src/admin) dan situs publik (src/lib/db.ts) sudah mengandalkannya.

export const TABLES: Record<string, string[]> = {
  projects: ['slug', 'name', 'difficulty', 'grad', 'hue', 'short_id', 'short_en', 'role_id', 'role_en', 'duration_id', 'duration_en', 'stack', 'features', 'boss', 'demo', 'repo', 'sort', 'published'],
  certificates: ['title_id', 'title_en', 'issuer', 'year', 'pages', 'sort'],
  skill_categories: ['icon', 'title_id', 'title_en', 'items', 'sort'],
  journey: ['period', 'title_id', 'title_en', 'body_id', 'body_en', 'active', 'sort'],
}

export const JSON_COLS = ['stack', 'features', 'boss', 'items']
export const INT_COLS = ['difficulty', 'year', 'pages', 'sort', 'published', 'active']

export type Row = Record<string, unknown>

const toInt = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

/** Baris DB -> JSON untuk admin (id string, kolom JSON jadi array, flag jadi boolean). */
export function decodeRow(row: Row): Row {
  const out: Row = { ...row }
  if (out.id !== undefined) out.id = String(out.id)
  for (const c of JSON_COLS) {
    if (out[c] !== undefined) {
      try {
        const d = typeof out[c] === 'string' ? JSON.parse(out[c]) : out[c]
        out[c] = Array.isArray(d) ? d : []
      } catch {
        out[c] = []
      }
    }
  }
  for (const c of ['difficulty', 'year', 'pages', 'sort']) {
    if (out[c] !== undefined) out[c] = toInt(out[c])
  }
  if (out.published !== undefined) out.published = toInt(out.published) === 1
  if (out.active !== undefined) out.active = toInt(out.active) === 1
  return out
}

/** Nilai dari body request -> nilai siap simpan (kolom JSON jadi string, flag jadi 0/1). */
export function encodeRow(vals: Row): Row {
  const out: Row = { ...vals }
  for (const c of JSON_COLS) {
    if (Array.isArray(out[c])) out[c] = JSON.stringify(out[c])
  }
  for (const c of INT_COLS) {
    if (out[c] !== undefined && out[c] !== null) out[c] = toInt(out[c])
  }
  if (out.published !== undefined) out.published = toInt(out.published) === 1 ? 1 : 0
  if (out.active !== undefined) out.active = toInt(out.active) === 1 ? 1 : 0
  return out
}

export const bi = (r: Row, k: string): { id: string; en: string } => ({
  id: String(r[`${k}_id`] ?? ''),
  en: String(r[`${k}_en`] ?? ''),
})
