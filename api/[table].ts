// GET /api/{tabel} — daftar baris mentah (login)
// POST /api/{tabel} — tambah baris (login)
// Tabel: projects, certificates, skill_categories, journey, testimonials
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from './_lib/auth.js'
import { getClient } from './_lib/db.js'
import { ApiError, methodNotAllowed, readBody, send, withApi } from './_lib/http.js'
import { decodeRow, encodeRow, TABLES, type Row } from './_lib/rows.js'

export default withApi(async (req: VercelRequest, res: VercelResponse) => {
  const table = String((req.query as Record<string, unknown>).table ?? '')
  if (!TABLES[table]) throw new ApiError(404, 'Rute tidak ditemukan.')
  await requireAuth(req)
  const db = getClient()
  const cols = TABLES[table]

  if (req.method === 'GET') {
    const r = await db.execute(`SELECT * FROM ${table} ORDER BY sort, id`)
    return send(res, 200, (r.rows as Row[]).map(decodeRow))
  }

  if (req.method === 'POST') {
    const b = readBody(req)
    const vals: Row = {}
    for (const c of cols) vals[c] = b[c] ?? null
    const row = encodeRow(vals)
    try {
      const r = await db.execute({
        sql: `INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        args: cols.map((c) => row[c] as string | number | null),
      })
      return send(res, 201, { id: String(r.lastInsertRowid ?? '') })
    } catch (e) {
      throw new ApiError(409, `Gagal menyimpan (slug mungkin sudah dipakai): ${(e as Error).message}`)
    }
  }

  return methodNotAllowed(res)
})
