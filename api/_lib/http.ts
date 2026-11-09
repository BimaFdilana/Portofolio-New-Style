// Util HTTP untuk Vercel Serverless Functions (Node runtime).
import type { VercelRequest, VercelResponse } from '@vercel/node'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function send(res: VercelResponse, status: number, data: unknown): void {
  res.status(status).json(data)
}

/** Body JSON — Vercel sudah mem-parse bila content-type JSON; tetap tahan string. */
export function readBody(req: VercelRequest): Record<string, unknown> {
  const b = (req as unknown as { body?: unknown }).body
  if (!b) return {}
  if (typeof b === 'string') {
    try {
      const d = JSON.parse(b)
      return d && typeof d === 'object' ? (d as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  return b as Record<string, unknown>
}

/** Bungkus handler: siapkan DB dulu, lalu ubah error jadi JSON yang rapi. */
export function withApi(
  fn: (req: VercelRequest, res: VercelResponse) => Promise<void>,
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req, res) => {
    try {
      const { ensureReady } = await import('./db.js')
      await ensureReady()
      await fn(req, res)
    } catch (e) {
      if (e instanceof ApiError) return send(res, e.status, { error: e.message })
      console.error(e)
      return send(res, 500, { error: 'Terjadi kesalahan server.' })
    }
  }
}

export function methodNotAllowed(res: VercelResponse): void {
  send(res, 405, { error: 'Metode tidak didukung.' })
}
