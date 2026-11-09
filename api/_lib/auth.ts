// Auth admin — port 1:1 dari server/api.php (PHP).
// Token acak 32 byte (hex) disimpan sebagai sha256 di tabel sessions, 7 hari.
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { VercelRequest } from '@vercel/node'
import { getClient } from './db.js'
import { ApiError } from './http.js'

export const nowSec = (): number => Math.floor(Date.now() / 1000)
export const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex')

export async function requireAuth(req: VercelRequest): Promise<string> {
  const h = req.headers?.authorization ?? ''
  if (!h.startsWith('Bearer ')) throw new ApiError(401, 'Belum login.')
  const hash = sha256(h.slice(7))
  const db = getClient()
  const res = await db.execute({
    sql: 'SELECT email FROM sessions WHERE token_hash = ? AND expires > ?',
    args: [hash, nowSec()],
  })
  const email = res.rows[0]?.email
  if (!email || typeof email !== 'string') {
    throw new ApiError(401, 'Sesi tidak berlaku / sudah kedaluwarsa.')
  }
  return email
}

export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  const db = getClient()
  const res = await db.execute({ sql: 'SELECT passhash FROM admins WHERE email = ?', args: [email] })
  const hash = res.rows[0]?.passhash
  if (!hash || typeof hash !== 'string') return false
  return bcrypt.compare(password, hash)
}

export async function createSession(email: string): Promise<string> {
  const db = getClient()
  const token = randomBytes(32).toString('hex')
  await db.execute({
    sql: 'INSERT INTO sessions (token_hash, email, expires) VALUES (?, ?, ?)',
    args: [sha256(token), email, nowSec() + 7 * 24 * 3600],
  })
  await db.execute({ sql: 'DELETE FROM sessions WHERE expires <= ?', args: [nowSec()] })
  return token
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const db = getClient()
  await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [sha256(token)] })
}
