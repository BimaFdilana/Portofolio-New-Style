import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { api } from './api'
import { btnPrimary, Field, inputCls, Notice } from './ui'
import { ProjectsAdmin } from './ProjectsAdmin'
import { CertificatesAdmin, JourneyAdmin, SettingsAdmin, SkillsAdmin } from './SimpleAdmin'

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await api.login(email, password)
      onDone()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Login gagal. Pastikan server API (folder server/) sudah terpasang & config.php sudah diisi.')
    }
    setBusy(false)
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Admin Portofolio</h1>
          <p className="text-sm text-gray-500">Masuk untuk mengelola konten situs.</p>
        </div>
        {err && <Notice kind="error">{err}</Notice>}
        <Field label="Email"><input className={inputCls} type="email" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className={inputCls} type="password" required value={password} onChange={e => setPassword(e.target.value)} /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        <Link to="/" className="block text-center text-sm text-gray-500">← Lihat situs</Link>
      </form>
    </div>
  )
}

function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number | string>>({})
  useEffect(() => {
    const tables = ['projects', 'certificates', 'skill_categories', 'journey']
    tables.forEach(async tb => {
      try {
        const rows = await api.list(tb)
        setCounts(c => ({ ...c, [tb]: rows.length }))
      } catch {
        setCounts(c => ({ ...c, [tb]: '!' }))
      }
    })
  }, [])
  const cards = [
    { to: 'projects', label: 'Proyek (Dungeons)', table: 'projects', desc: 'Tambah, ubah, hapus proyek yang tampil di situs.' },
    { to: 'certificates', label: 'Sertifikat (Relics)', table: 'certificates', desc: 'Kelola daftar sertifikat.' },
    { to: 'skills', label: 'Keahlian (Inventory)', table: 'skill_categories', desc: 'Kategori skill beserta levelnya.' },
    { to: 'journey', label: 'Perjalanan (Adventure Log)', table: 'journey', desc: 'Riwayat karier di halaman utama.' },
    { to: 'settings', label: 'Pengaturan Situs', table: '', desc: 'Kontak, tautan sosial, panel karakter hero.' },
  ]
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">Semua perubahan di sini langsung tampil di situs publik setelah disimpan. Data tersimpan di SQLite server.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {cards.map(c => (
          <Link key={c.to} to={c.to} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow transition-shadow">
            <p className="font-semibold text-gray-900">{c.label}</p>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
            {c.table && <p className="text-2xl font-bold text-blue-600 mt-3">{counts[c.table] ?? '…'}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}

const NAV = [
  { to: '', label: 'Dashboard', end: true },
  { to: 'projects', label: 'Proyek', end: false },
  { to: 'certificates', label: 'Sertifikat', end: false },
  { to: 'skills', label: 'Keahlian', end: false },
  { to: 'journey', label: 'Perjalanan', end: false },
  { to: 'settings', label: 'Pengaturan', end: false },
]

function Layout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row">
      <aside className="sm:w-60 shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-gray-200 p-4">
        <p className="font-bold text-gray-900">Admin Portofolio</p>
        <p className="text-xs text-gray-500 truncate">{api.email()}</p>
        <nav className="flex sm:flex-col gap-1 mt-4 overflow-x-auto">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex sm:flex-col gap-1 mt-2 sm:mt-6">
          <Link to="/" className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">Lihat Situs ↗</Link>
          <button onClick={async () => { await api.logout(); onLogout() }} className="text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">Keluar</button>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 max-w-5xl">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="certificates" element={<CertificatesAdmin />} />
          <Route path="skills" element={<SkillsAdmin />} />
          <Route path="journey" element={<JourneyAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Routes>
      </main>
    </div>
  )
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean>(Boolean(api.token()))
  if (!authed) return <Login onDone={() => setAuthed(true)} />
  return <Layout onLogout={() => setAuthed(false)} />
}
