// Klien Turso (libSQL) + skema + seed + bootstrap admin.
// Satu database untuk semua function; klien di-cache antar-invocation hangat.
import { createClient, type Client } from '@libsql/client'
import bcrypt from 'bcryptjs'
import { SEED } from './seedData.js'
import { TABLES } from './rows.js'

let client: Client | null = null
let ready: Promise<void> | null = null

export function getClient(): Client {
  if (client) return client
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url) {
    throw new Error(
      'Database belum dikonfigurasi — isi TURSO_DATABASE_URL (dan TURSO_AUTH_TOKEN) di Environment Variables Vercel.',
    )
  }
  client = createClient({ url, authToken })
  return client
}

// DDL sama persis dengan server/api.php (SQLite dialect — Turso memakainya apa adanya).
const SCHEMA: string[] = [
  'CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, passhash TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL)',
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT '',
    difficulty INTEGER NOT NULL DEFAULT 2, grad TEXT NOT NULL DEFAULT '', hue TEXT NOT NULL DEFAULT '',
    short_id TEXT NOT NULL DEFAULT '', short_en TEXT NOT NULL DEFAULT '',
    role_id TEXT NOT NULL DEFAULT '', role_en TEXT NOT NULL DEFAULT '',
    duration_id TEXT NOT NULL DEFAULT '', duration_en TEXT NOT NULL DEFAULT '',
    stack TEXT NOT NULL DEFAULT '[]', features TEXT NOT NULL DEFAULT '[]', boss TEXT NOT NULL DEFAULT '[]',
    demo TEXT NOT NULL DEFAULT '', repo TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title_id TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '',
    issuer TEXT NOT NULL DEFAULT '', year INTEGER NOT NULL DEFAULT 2026, pages INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS skill_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, icon TEXT NOT NULL DEFAULT '', title_id TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '', items TEXT NOT NULL DEFAULT '[]', sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS journey (
    id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL DEFAULT '', title_id TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '', body_id TEXT NOT NULL DEFAULT '', body_en TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT, project_slug TEXT NOT NULL DEFAULT '', name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '', text_id TEXT NOT NULL DEFAULT '', text_en TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 5, sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1,
    photo TEXT NOT NULL DEFAULT '')`,
  'CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY, data TEXT NOT NULL DEFAULT \'{}\')',
]

async function init(): Promise<void> {
  const db = getClient()
  for (const stmt of SCHEMA) await db.execute(stmt)

  // Seed sekali, saat tabel projects masih kosong.
  const count = await db.execute('SELECT COUNT(*) AS n FROM projects')
  if (Number(count.rows[0]?.n ?? 0) === 0) {
    for (const t of ['projects', 'certificates', 'skill_categories', 'journey'] as const) {
      const cols = TABLES[t]
      const sql = `INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
      for (const row of SEED[t]) {
        const args = cols.map((c) => {
          const v = row[c]
          if (Array.isArray(v)) return JSON.stringify(v)
          if (v === undefined) return null
          return v as string | number | null
        })
        await db.execute({ sql, args })
      }
    }
    await db.execute({
      sql: 'INSERT OR REPLACE INTO site_settings (id, data) VALUES (1, ?)',
      args: [JSON.stringify(SEED.settings)],
    })
  }

  // Seed testimoni secara mandiri (tidak ikut gerbang projects di atas):
  // DB live sudah berisi proyek sejak awal, jadi blok seed proyek tidak akan
  // jalan lagi — testimoni harus diisi sendiri saat tabelnya masih kosong.
  const tcount = await db.execute('SELECT COUNT(*) AS n FROM testimonials')
  if (Number(tcount.rows[0]?.n ?? 0) === 0) {
    const cols = TABLES.testimonials
    const sql = `INSERT INTO testimonials (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
    for (const row of SEED.testimonials) {
      const args = cols.map((c) => {
        const v = row[c]
        if (v === undefined) return null
        return v as string | number | null
      })
      await db.execute({ sql, args })
    }
  }

  // Migrasi ringan: tabel testimonials yang dibuat sebelum kolom photo ada
  // (deploy 10 Nov) perlu ditambah kolomnya — CREATE TABLE IF NOT EXISTS
  // tidak mengubah tabel yang sudah ada.
  const hasPhoto = await db.execute(
    "SELECT COUNT(*) AS n FROM pragma_table_info('testimonials') WHERE name = 'photo'",
  )
  if (Number(hasPhoto.rows[0]?.n ?? 0) === 0) {
    await db.execute("ALTER TABLE testimonials ADD COLUMN photo TEXT NOT NULL DEFAULT ''")
  }

  // Bootstrap akun admin dari env (hanya saat tabel admins masih kosong).
  // Password admin selanjutnya hidup di DB, bukan di env — mengganti env
  // tidak mengubah password yang sudah tersimpan.
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    const n = await db.execute('SELECT COUNT(*) AS n FROM admins')
    if (Number(n.rows[0]?.n ?? 0) === 0) {
      const hash = await bcrypt.hash(password, 10)
      await db.execute({ sql: 'INSERT INTO admins (email, passhash) VALUES (?, ?)', args: [email, hash] })
    }
  }
}

export function ensureReady(): Promise<void> {
  if (!ready) {
    ready = init().catch((e) => {
      ready = null
      throw e
    })
  }
  return ready
}
