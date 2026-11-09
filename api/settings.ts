// GET / PUT /api/settings — pengaturan situs (butuh login).
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from './_lib/auth.js'
import { getClient } from './_lib/db.js'
import { methodNotAllowed, readBody, send, withApi } from './_lib/http.js'

export default withApi(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req)
  const db = getClient()
  if (req.method === 'GET') {
    const row = await db.execute('SELECT data FROM site_settings WHERE id = 1')
    const data = row.rows[0]?.data
    let parsed: unknown = []
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data)
      } catch {
        parsed = []
      }
    }
    return send(res, 200, { data: parsed })
  }
  if (req.method === 'PUT') {
    const b = readBody(req)
    await db.execute({
      sql: 'INSERT OR REPLACE INTO site_settings (id, data) VALUES (1, ?)',
      args: [JSON.stringify(b.data ?? [])],
    })
    return send(res, 200, { ok: true })
  }
  return methodNotAllowed(res)
})
