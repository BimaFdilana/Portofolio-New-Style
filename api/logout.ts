// POST /api/logout — batalkan sesi Bearer (tanpa login pun aman dipanggil).
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteSessionByToken } from './_lib/auth.js'
import { methodNotAllowed, send, withApi } from './_lib/http.js'

export default withApi(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const h = req.headers?.authorization ?? ''
  if (h.startsWith('Bearer ')) await deleteSessionByToken(h.slice(7))
  send(res, 200, { ok: true })
})
