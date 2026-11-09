// POST /api/login — {email, password} => {token, email}
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSession, verifyAdmin } from './_lib/auth.js'
import { ApiError, methodNotAllowed, readBody, send, withApi } from './_lib/http.js'

export default withApi(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const b = readBody(req)
  const email = String(b.email ?? '')
  const password = String(b.password ?? '')
  if (!email || !(await verifyAdmin(email, password))) {
    throw new ApiError(401, 'Email atau password salah.')
  }
  const token = await createSession(email)
  send(res, 200, { token, email })
})
