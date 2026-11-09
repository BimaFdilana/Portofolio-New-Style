// PUT /api/{tabel}/{id} — ubah baris (login)
// DELETE /api/{tabel}/{id} — hapus baris (login)
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth.js'
import { getClient } from '../_lib/db.js'
import { ApiError, methodNotAllowed, readBody, send, withApi } from '../_lib/http.js'
import { encodeRow, TABLES, type Row } from '../_lib/rows.js'

export default withApi(async (req: VercelRequest, res: VercelResponse) => {
  const q = req.query as Record<string, unknown>
  const table = String(q.table ?? '')
  const id = Number(q.id ?? NaN)
  if (!TABLES[table] || !Number.isInteger(id)) throw new ApiError(404, 'Rute tidak ditemukan.')
  await requireAuth(req)
  const db = getClient()
  const cols = TABLES[table]

  if (req.method === 'PUT') {
    const b = readBody(req)
    const vals: Row = {}
    for (const c of cols) if (c in b) vals[c] = b[c]
    if (Object.keys(vals).length > 0) {
      const row = encodeRow(vals)
      const keys = Object.keys(row)
      const set = keys.map((c) => `${c} = ?`).join(',')
      try {
        await db.execute({
          sql: `UPDATE ${table} SET ${set} WHERE id = ?`,
          args: [...keys.map((c) => row[c] as string | number | null), id],
        })
      } catch (e) {
        throw new ApiError(409, `Gagal mengubah (slug mungkin sudah dipakai): ${(e as Error).message}`)
      }
    }
    return send(res, 200, { ok: true })
  }

  if (req.method === 'DELETE') {
    await db.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [id] })
    return send(res, 200, { ok: true })
  }

  return methodNotAllowed(res)
})
