import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { BiField, btnDanger, btnGhost, btnPrimary, Field, inputCls, Notice } from './ui'

function useTable<T>(table: string) {
  const [rows, setRows] = useState<T[]>([])
  const load = useCallback(async () => {
    try { setRows(await api.list<T>(table)) } catch { setRows([]) }
  }, [table])
  useEffect(() => { load() }, [load])
  return { rows, load }
}

function PageHead({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <button className={btnPrimary} onClick={onAdd}>+ Tambah</button>
    </div>
  )
}

/* ---------------- SERTIFIKAT ---------------- */
interface CertRow { id: string; title_id: string; title_en: string; issuer: string; year: number; pages: number; sort: number }
export function CertificatesAdmin() {
  const { rows, load } = useTable<CertRow>('certificates')
  const [form, setForm] = useState<Partial<CertRow> | null>(null)
  const [msg, setMsg] = useState('')
  const save = async () => {
    if (!form) return
    const { id, ...payload } = form
    try { if (id) await api.update('certificates', id, payload); else await api.insert('certificates', payload) }
    catch (ex) { setMsg('Gagal: ' + (ex instanceof Error ? ex.message : '')); return }
    setMsg('Sertifikat tersimpan.'); setForm(null); load()
  }
  return (
    <div>
      <PageHead title="Sertifikat (Relics)" onAdd={() => setForm({ title_id: '', title_en: '', issuer: '', year: 2026, pages: 1, sort: rows.length + 1 })} />
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}
      {!form ? (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 divide-y divide-gray-100">
          {rows.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <p className="font-medium text-gray-900 flex-1 min-w-[200px]">{r.title_id} <span className="text-gray-400 font-normal">· {r.issuer} · {r.year}</span></p>
              <button className={btnGhost} onClick={() => setForm(r)}>Ubah</button>
              <button className={btnDanger} onClick={async () => { await api.remove('certificates', r.id); load() }}>Hapus</button>
            </div>
          ))}
          {rows.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada sertifikat.</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 p-5 space-y-4">
          <BiField label="Judul sertifikat" idVal={form.title_id ?? ''} enVal={form.title_en ?? ''}
            onId={v => setForm({ ...form, title_id: v })} onEn={v => setForm({ ...form, title_en: v })} />
          <div className="grid sm:grid-cols-4 gap-3">
            <Field label="Penerbit"><input className={inputCls} value={form.issuer ?? ''} onChange={e => setForm({ ...form, issuer: e.target.value })} /></Field>
            <Field label="Tahun"><input className={inputCls} type="number" value={form.year ?? 2026} onChange={e => setForm({ ...form, year: Number(e.target.value) })} /></Field>
            <Field label="Jumlah halaman"><input className={inputCls} type="number" value={form.pages ?? 1} onChange={e => setForm({ ...form, pages: Number(e.target.value) })} /></Field>
            <Field label="Urutan"><input className={inputCls} type="number" value={form.sort ?? 0} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex gap-2"><button className={btnPrimary} onClick={save}>Simpan</button><button className={btnGhost} onClick={() => setForm(null)}>Batal</button></div>
        </div>
      )}
    </div>
  )
}

/* ---------------- KEAHLIAN ---------------- */
interface SkillRow { id: string; icon: string; title_id: string; title_en: string; items: { name: string; level: number }[]; sort: number }
export function SkillsAdmin() {
  const { rows, load } = useTable<SkillRow>('skill_categories')
  const [form, setForm] = useState<SkillRow | null>(null)
  const [msg, setMsg] = useState('')
  const save = async () => {
    if (!form) return
    const { id, ...payload } = form
    const clean = { ...payload, items: payload.items.filter(i => i.name) }
    try { if (id) await api.update('skill_categories', id, clean); else await api.insert('skill_categories', clean) }
    catch (ex) { setMsg('Gagal: ' + (ex instanceof Error ? ex.message : '')); return }
    setMsg('Keahlian tersimpan.'); setForm(null); load()
  }
  return (
    <div>
      <PageHead title="Keahlian (Inventory)" onAdd={() => setForm({ id: '', icon: '🧰', title_id: '', title_en: '', items: [{ name: '', level: 50 }], sort: rows.length + 1 })} />
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}
      {!form ? (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 divide-y divide-gray-100">
          {rows.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <p className="font-medium text-gray-900 flex-1 min-w-[200px]">{r.icon} {r.title_id} <span className="text-gray-400 font-normal">· {r.items?.length ?? 0} item</span></p>
              <button className={btnGhost} onClick={() => setForm(r)}>Ubah</button>
              <button className={btnDanger} onClick={async () => { await api.remove('skill_categories', r.id); load() }}>Hapus</button>
            </div>
          ))}
          {rows.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada kategori keahlian.</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 p-5 space-y-4">
          <div className="grid sm:grid-cols-[80px_1fr] gap-3">
            <Field label="Ikon"><input className={inputCls} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></Field>
            <Field label="Urutan"><input className={inputCls} type="number" value={form.sort} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></Field>
          </div>
          <BiField label="Nama kategori" idVal={form.title_id} enVal={form.title_en}
            onId={v => setForm({ ...form, title_id: v })} onEn={v => setForm({ ...form, title_en: v })} />
          <div>
            <p className="font-semibold text-gray-800 text-sm">Item keahlian & level (0-100)</p>
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 mt-2">
                <input className={inputCls} placeholder="Nama skill" value={it.name} onChange={e => setForm({ ...form, items: form.items.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x) })} />
                <input className={inputCls} type="number" min={0} max={100} value={it.level} onChange={e => setForm({ ...form, items: form.items.map((x, xi) => xi === i ? { ...x, level: Number(e.target.value) } : x) })} />
                <button className={btnDanger} onClick={() => setForm({ ...form, items: form.items.filter((_, xi) => xi !== i) })}>✕</button>
              </div>
            ))}
            <button className={`${btnGhost} mt-2`} onClick={() => setForm({ ...form, items: [...form.items, { name: '', level: 50 }] })}>+ Item</button>
          </div>
          <div className="flex gap-2"><button className={btnPrimary} onClick={save}>Simpan</button><button className={btnGhost} onClick={() => setForm(null)}>Batal</button></div>
        </div>
      )}
    </div>
  )
}

/* ---------------- PERJALANAN ---------------- */
interface JourneyRow { id: string; period: string; title_id: string; title_en: string; body_id: string; body_en: string; active: boolean; sort: number }
export function JourneyAdmin() {
  const { rows, load } = useTable<JourneyRow>('journey')
  const [form, setForm] = useState<Partial<JourneyRow> | null>(null)
  const [msg, setMsg] = useState('')
  const save = async () => {
    if (!form) return
    const { id, ...payload } = form
    try { if (id) await api.update('journey', id, payload); else await api.insert('journey', payload) }
    catch (ex) { setMsg('Gagal: ' + (ex instanceof Error ? ex.message : '')); return }
    setMsg('Perjalanan tersimpan.'); setForm(null); load()
  }
  return (
    <div>
      <PageHead title="Perjalanan (Adventure Log)" onAdd={() => setForm({ period: '', title_id: '', title_en: '', body_id: '', body_en: '', active: false, sort: rows.length + 1 })} />
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}
      {!form ? (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 divide-y divide-gray-100">
          {rows.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <p className="font-medium text-gray-900 flex-1 min-w-[220px]">{r.period} — {r.title_id} {r.active && <span className="text-green-600 text-xs font-bold">AKTIF</span>}</p>
              <button className={btnGhost} onClick={() => setForm(r)}>Ubah</button>
              <button className={btnDanger} onClick={async () => { await api.remove('journey', r.id); load() }}>Hapus</button>
            </div>
          ))}
          {rows.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada catatan perjalanan.</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Periode (mis. 2025 — SEKARANG)"><input className={inputCls} value={form.period ?? ''} onChange={e => setForm({ ...form, period: e.target.value })} /></Field>
            <Field label="Urutan"><input className={inputCls} type="number" value={form.sort ?? 0} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></Field>
          </div>
          <BiField label="Judul" idVal={form.title_id ?? ''} enVal={form.title_en ?? ''} onId={v => setForm({ ...form, title_id: v })} onEn={v => setForm({ ...form, title_en: v })} />
          <BiField label="Isi" textarea idVal={form.body_id ?? ''} enVal={form.body_en ?? ''} onId={v => setForm({ ...form, body_id: v })} onEn={v => setForm({ ...form, body_en: v })} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.active ?? false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Tandai sebagai quest aktif (🚩)
          </label>
          <div className="flex gap-2"><button className={btnPrimary} onClick={save}>Simpan</button><button className={btnGhost} onClick={() => setForm(null)}>Batal</button></div>
        </div>
      )}
    </div>
  )
}

/* ---------------- PENGATURAN SITUS ---------------- */
const SETTING_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: 'name', label: 'Nama lengkap' },
  { key: 'role', label: 'Peran / jabatan' },
  { key: 'location', label: 'Lokasi' },
  { key: 'email', label: 'Email publik' },
  { key: 'whatsapp', label: 'Nomor WhatsApp', hint: 'Format internasional tanpa + (mis. 62812xxxxxxx)' },
  { key: 'github', label: 'URL GitHub' },
  { key: 'linkedin', label: 'URL LinkedIn' },
  { key: 'instagram', label: 'URL Instagram' },
  { key: 'cvUrl', label: 'URL file CV' },
  { key: 'mastery', label: 'Keahlian utama (panel hero)' },
  { key: 'weakness', label: 'Kelemahan (panel hero)' },
  { key: 'resistance', label: 'Resistensi (panel hero)' },
  { key: 'expYears', label: 'Pengalaman (mis. 4+)' },
]
export function SettingsAdmin() {
  const [data, setData] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    api.getSettings().then(({ data: d }) => {
      setData((d as Record<string, string>) ?? {}); setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])
  const save = async () => {
    const payload: Record<string, unknown> = { ...data, hp: Number(data.hp || 99), level: Number(data.level || 12), available: data.available !== 'false' }
    try { await api.saveSettings(payload); setMsg('Pengaturan tersimpan & live di situs.') }
    catch (ex) { setMsg('Gagal: ' + (ex instanceof Error ? ex.message : '')) }
  }
  if (!loaded) return <p className="text-sm text-gray-500">Memuat…</p>
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Pengaturan Situs</h1>
      <p className="text-sm text-gray-500 mt-1">Kontak, tautan sosial, dan panel karakter yang tampil di halaman utama.</p>
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}
      <div className="bg-white border border-gray-200 rounded-lg mt-5 p-5 grid sm:grid-cols-2 gap-4">
        {SETTING_FIELDS.map(f => (
          <Field key={f.key} label={f.label}>
            <input className={inputCls} value={data[f.key] ?? ''} onChange={e => setData({ ...data, [f.key]: e.target.value })} />
            {f.hint && <span className="text-xs text-gray-400">{f.hint}</span>}
          </Field>
        ))}
        <Field label="HP (panel hero)"><input className={inputCls} type="number" value={data.hp ?? 99} onChange={e => setData({ ...data, hp: e.target.value })} /></Field>
        <Field label="Level (panel hero)"><input className={inputCls} type="number" value={data.level ?? 12} onChange={e => setData({ ...data, level: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
          <input type="checkbox" checked={data.available !== 'false'} onChange={e => setData({ ...data, available: String(e.target.checked) })} />
          Tampilkan badge "Siap menerima quest baru"
        </label>
      </div>
      <button className={`${btnPrimary} mt-4`} onClick={save}>Simpan Pengaturan</button>
    </div>
  )
}
