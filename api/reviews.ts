// POST /api/reviews — ulasan publik per proyek (tanpa login admin).
// Pemberi ulasan masuk dengan Google (Google Identity Services) di halaman
// /review/:slug; ID token-nya dikirim ke sini dan DIVERIFIKASI ke Google
// sebelum disimpan. Ulasan masuk sebagai testimonials dengan published = 0
// — Bima menyetujuinya dulu di /admin (menu Testimoni) sebelum tampil
// di halaman detail proyek.
//
// Satu env var: VITE_GOOGLE_CLIENT_ID (Client ID OAuth Web dari Google
// Cloud Console; dipakai frontend untuk tombol login DAN backend untuk
// memeriksa `aud` token). Tanpa var ini, endpoint menjawab 503.
// Verifikasi token dilakukan DULU tanpa menyentuh DB — permintaan tanpa
// login Google yang valid tidak sampai ke database.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ApiError, methodNotAllowed, readBody, send } from './_lib/http.js'

interface GooglePayload {
  sub?: string
  name?: string
  email?: string
  picture?: string
  aud?: string
  iss?: string
  exp?: number
}

async function verifyGoogleToken(idToken: string, clientId: string): Promise<GooglePayload> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) throw new ApiError(401, 'Token Google tidak valid.')
  const g = (await res.json()) as GooglePayload
  const issOk = g.iss === 'https://accounts.google.com' || g.iss === 'accounts.google.com'
  if (g.aud !== clientId || !issOk || !g.sub || !g.name || (g.exp ?? 0) * 1000 <= Date.now()) {
    throw new ApiError(401, 'Token Google tidak valid.')
  }
  return g
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') return methodNotAllowed(res)
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID ?? ''
    if (!clientId) throw new ApiError(503, 'Login Google untuk ulasan belum dikonfigurasi.')
    const body = readBody(req)
    const idToken = String(body.id_token ?? '')
    if (!idToken) throw new ApiError(401, 'Token Google tidak ada.')
    const g = await verifyGoogleToken(idToken, clientId)

    const slug = String(body.project_slug ?? '').trim()
    const rating = Math.trunc(Number(body.rating))
    const role = String(body.role ?? '').trim().slice(0, 100)
    const text = String(body.text ?? '').trim()
    if (!slug) throw new ApiError(400, 'Proyek tidak dipilih.')
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'Bintang harus 1–5.')
    if (text.length < 10) throw new ApiError(400, 'Ulasan terlalu pendek (minimal 10 karakter).')
    if (text.length > 1000) throw new ApiError(400, 'Ulasan terlalu panjang (maksimal 1000 karakter).')

    const { ensureReady, getClient } = await import('./_lib/db.js')
    await ensureReady()
    const db = getClient()
    const found = await db.execute({ sql: 'SELECT slug FROM projects WHERE slug = ?', args: [slug] })
    if (found.rows.length === 0) throw new ApiError(404, 'Proyek tidak ditemukan.')

    // Penjaga kirim ganda: ulasan yang sama persis dari nama yang sama.
    const dup = await db.execute({
      sql: 'SELECT id FROM testimonials WHERE project_slug = ? AND name = ? AND text_id = ? LIMIT 1',
      args: [slug, g.name, text],
    })
    if (dup.rows.length > 0) throw new ApiError(409, 'Ulasan yang sama sudah pernah dikirim.')

    const maxSort = await db.execute({
      sql: 'SELECT MAX(sort) AS m FROM testimonials WHERE project_slug = ?',
      args: [slug],
    })
    const sort = Number(maxSort.rows[0]?.m ?? 0) + 1
    // text_en diisi teks yang sama: pemberi ulasan menulis sekali, dan
    // slider testimoni merender text[lang] — bila text_en kosong, tampilan
    // EN akan kosong. Bima bisa menerjemahkannya lewat /admin bila perlu.
    await db.execute({
      sql: `INSERT INTO testimonials (project_slug, name, role, text_id, text_en, rating, sort, published, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [slug, g.name, role, text, text, rating, sort, g.picture ?? ''],
    })
    send(res, 201, { ok: true })
  } catch (e) {
    if (e instanceof ApiError) return send(res, e.status, { error: e.message })
    console.error(e)
    return send(res, 500, { error: 'Terjadi kesalahan server.' })
  }
}
