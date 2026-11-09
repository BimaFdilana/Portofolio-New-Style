// GET /api/content — konten publik ternormalisasi (tanpa login).
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getClient } from './_lib/db.js'
import { methodNotAllowed, send, withApi } from './_lib/http.js'
import { bi, decodeRow, type Row } from './_lib/rows.js'

export default withApi(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return methodNotAllowed(res)
  const db = getClient()

  const projects: unknown[] = []
  const pr = await db.execute('SELECT * FROM projects WHERE published = 1 ORDER BY sort, id')
  for (const raw of pr.rows as Row[]) {
    const r = decodeRow(raw)
    projects.push({
      slug: r.slug,
      name: r.name,
      difficulty: r.difficulty,
      grad: r.grad,
      hue: r.hue,
      short: bi(r, 'short'),
      role: bi(r, 'role'),
      duration: bi(r, 'duration'),
      stack: r.stack,
      features: r.features,
      boss: r.boss,
      demo: r.demo,
      repo: r.repo,
    })
  }

  const certs: unknown[] = []
  const cr = await db.execute('SELECT * FROM certificates ORDER BY sort, id')
  for (const raw of cr.rows as Row[]) {
    const r = decodeRow(raw)
    certs.push({
      title: bi(r, 'title'),
      issuer: r.issuer,
      year: Number(r.year),
      pages: Number(r.pages),
    })
  }

  const skills: unknown[] = []
  const sr = await db.execute('SELECT * FROM skill_categories ORDER BY sort, id')
  for (const raw of sr.rows as Row[]) {
    const r = decodeRow(raw)
    const items = Array.isArray(r.items) ? r.items : []
    skills.push({
      icon: r.icon,
      title: bi(r, 'title'),
      items: items.map((i) => (i as Row).name ?? ''),
      levels: items.map((i) => Number((i as Row).level ?? 0)),
    })
  }

  const journey: unknown[] = []
  const jr = await db.execute('SELECT * FROM journey ORDER BY sort, id')
  for (const raw of jr.rows as Row[]) {
    const r = decodeRow(raw)
    journey.push({
      period: r.period,
      title: bi(r, 'title'),
      body: bi(r, 'body'),
      active: r.active,
    })
  }

  let settings: unknown = []
  const srow = await db.execute('SELECT data FROM site_settings WHERE id = 1')
  const data = srow.rows[0]?.data
  if (typeof data === 'string') {
    try {
      settings = JSON.parse(data)
    } catch {
      settings = []
    }
  }

  send(res, 200, { projects, certificates: certs, skills, journey, settings })
})
