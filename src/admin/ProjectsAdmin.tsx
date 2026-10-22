import { useCallback, useEffect, useState } from 'react'
import { sb } from './supabaseClient'
import { BiField, btnDanger, btnGhost, btnPrimary, Field, inputCls, Notice } from './ui'

interface BossForm { tid: string; ten: string; bid: string; ben: string }
interface FormState {
  id?: string; slug: string; name: string; difficulty: number; grad: string; hue: string
  short_id: string; short_en: string; role_id: string; role_en: string
  duration_id: string; duration_en: string; stack: string
  features: { id: string; en: string }[]; boss: BossForm[]
  demo: string; repo: string; sort: number; published: boolean
}

const GRADS = [
  'linear-gradient(135deg,#7fa3c0,#4e7396)',
  'linear-gradient(135deg,#d9a7b8,#b5533c)',
  'linear-gradient(135deg,#a7c4a0,#5f7f52)',
  'linear-gradient(135deg,#e3cf8f,#c9a227)',
  'linear-gradient(135deg,#9aa7bd,#2e3d4e)',
]

const empty: FormState = {
  slug: '', name: '', difficulty: 2, grad: GRADS[0], hue: '', short_id: '', short_en: '',
  role_id: '', role_en: '', duration_id: '', duration_en: '', stack: '',
  features: [{ id: '', en: '' }], boss: [], demo: '', repo: '', sort: 0, published: true,
}

interface Row {
  id: string; slug: string; name: string; difficulty: number; grad: string; hue: string
  short_id: string; short_en: string; role_id: string; role_en: string
  duration_id: string; duration_en: string; stack: string[]
  features: { id: string; en: string }[]
  boss: { title: { id: string; en: string }; body: { id: string; en: string } }[]
  demo: string; repo: string; sort: number; published: boolean
}

export function ProjectsAdmin() {
  const [rows, setRows] = useState<Row[]>([])
  const [form, setForm] = useState<FormState | null>(null)
  const [msg, setMsg] = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await sb().from('projects').select('*').order('sort')
    setRows((data as Row[]) ?? [])
  }, [])
  useEffect(() => { load() }, [load])

  const edit = (r: Row) => setForm({
    id: r.id, slug: r.slug, name: r.name, difficulty: r.difficulty, grad: r.grad, hue: r.hue,
    short_id: r.short_id, short_en: r.short_en, role_id: r.role_id, role_en: r.role_en,
    duration_id: r.duration_id, duration_en: r.duration_en, stack: (r.stack ?? []).join(', '),
    features: r.features?.length ? r.features : [{ id: '', en: '' }],
    boss: (r.boss ?? []).map(b => ({ tid: b.title.id, ten: b.title.en, bid: b.body.id, ben: b.body.en })),
    demo: r.demo ?? '', repo: r.repo ?? '', sort: r.sort ?? 0, published: r.published,
  })

  const save = async () => {
    if (!form) return
    const payload = {
      slug: form.slug.trim(), name: form.name.trim(), difficulty: form.difficulty,
      grad: form.grad, hue: form.hue, short_id: form.short_id, short_en: form.short_en,
      role_id: form.role_id, role_en: form.role_en, duration_id: form.duration_id, duration_en: form.duration_en,
      stack: form.stack.split(',').map(s => s.trim()).filter(Boolean),
      features: form.features.filter(f => f.id || f.en),
      boss: form.boss.filter(b => b.tid || b.bid).map(b => ({ title: { id: b.tid, en: b.ten }, body: { id: b.bid, en: b.ben } })),
      demo: form.demo, repo: form.repo, sort: form.sort, published: form.published,
    }
    const res = form.id
      ? await sb().from('projects').update(payload).eq('id', form.id)
      : await sb().from('projects').insert(payload)
    if (res.error) { setMsg('Gagal menyimpan: ' + res.error.message); return }
    setMsg('Proyek tersimpan. Perubahan sudah live di situs.')
    setForm(null); load()
  }

  const del = async (id: string) => {
    await sb().from('projects').delete().eq('id', id)
    setConfirmDel(null); setMsg('Proyek dihapus.'); load()
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => (f ? { ...f, [k]: v } : f))

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Proyek (Dungeons)</h1>
        <button className={btnPrimary} onClick={() => { setMsg(''); setForm({ ...empty, sort: rows.length + 1 }) }}>+ Tambah Proyek</button>
      </div>
      {msg && <div className="mt-4"><Notice kind="ok">{msg}</Notice></div>}

      {!form && (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Sulit</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.slug}</td>
                  <td className="px-4 py-3">{'★'.repeat(r.difficulty)}</td>
                  <td className="px-4 py-3">{r.published ? 'Tayang' : 'Draf'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className={btnGhost} onClick={() => edit(r)}>Ubah</button>
                      {confirmDel === r.id ? (
                        <>
                          <button className={btnDanger} onClick={() => del(r.id)}>Yakin hapus?</button>
                          <button className={btnGhost} onClick={() => setConfirmDel(null)}>Batal</button>
                        </>
                      ) : (
                        <button className={btnDanger} onClick={() => setConfirmDel(r.id)}>Hapus</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>Belum ada proyek. Klik "+ Tambah Proyek".</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="bg-white border border-gray-200 rounded-lg mt-5 p-5 space-y-4">
          <p className="font-semibold text-gray-900">{form.id ? 'Ubah Proyek' : 'Proyek Baru'}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nama proyek"><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
            <Field label="Slug (URL, tanpa spasi)"><input className={inputCls} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="nama-proyek" /></Field>
            <Field label="Kesulitan (1-3)">
              <select className={inputCls} value={form.difficulty} onChange={e => set('difficulty', Number(e.target.value))}>
                <option value={1}>★ Mudah</option><option value={2}>★★ Sedang</option><option value={3}>★★★ Sulit</option>
              </select>
            </Field>
            <Field label="Label sampul (mis. LKPM)"><input className={inputCls} value={form.hue} onChange={e => set('hue', e.target.value)} /></Field>
            <Field label="Warna sampul (gradasi)">
              <select className={inputCls} value={form.grad} onChange={e => set('grad', e.target.value)}>
                {GRADS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Urutan tampil"><input className={inputCls} type="number" value={form.sort} onChange={e => set('sort', Number(e.target.value))} /></Field>
            <Field label="Link demo (opsional)"><input className={inputCls} value={form.demo} onChange={e => set('demo', e.target.value)} placeholder="https://" /></Field>
            <Field label="Link GitHub (opsional)"><input className={inputCls} value={form.repo} onChange={e => set('repo', e.target.value)} placeholder="https://" /></Field>
          </div>
          <BiField label="Deskripsi singkat" idVal={form.short_id} enVal={form.short_en} onId={v => set('short_id', v)} onEn={v => set('short_en', v)} textarea />
          <BiField label="Peran" idVal={form.role_id} enVal={form.role_en} onId={v => set('role_id', v)} onEn={v => set('role_en', v)} />
          <BiField label="Durasi" idVal={form.duration_id} enVal={form.duration_en} onId={v => set('duration_id', v)} onEn={v => set('duration_en', v)} />
          <Field label="Tech stack (pisahkan koma)"><input className={inputCls} value={form.stack} onChange={e => set('stack', e.target.value)} placeholder="Laravel, MySQL, React" /></Field>

          <div>
            <p className={btnGhost + ' !border-0 !px-0 font-semibold text-gray-800'}>Fitur utama (Loot)</p>
            {form.features.map((f, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mt-2">
                <input className={inputCls} placeholder="Fitur (ID)" value={f.id} onChange={e => set('features', form.features.map((x, xi) => xi === i ? { ...x, id: e.target.value } : x))} />
                <input className={inputCls} placeholder="Feature (EN)" value={f.en} onChange={e => set('features', form.features.map((x, xi) => xi === i ? { ...x, en: e.target.value } : x))} />
                <button className={btnDanger} onClick={() => set('features', form.features.filter((_, xi) => xi !== i))}>✕</button>
              </div>
            ))}
            <button className={`${btnGhost} mt-2`} onClick={() => set('features', [...form.features, { id: '', en: '' }])}>+ Fitur</button>
          </div>

          <div>
            <p className="font-semibold text-gray-800">Tantangan & solusi (Boss Battle)</p>
            {form.boss.map((b, i) => (
              <div key={i} className="border border-gray-200 rounded-md p-3 mt-2 space-y-2">
                <BiField label="Judul tantangan" idVal={b.tid} enVal={b.ten}
                  onId={v => set('boss', form.boss.map((x, xi) => xi === i ? { ...x, tid: v } : x))}
                  onEn={v => set('boss', form.boss.map((x, xi) => xi === i ? { ...x, ten: v } : x))} />
                <BiField label="Solusi" textarea idVal={b.bid} enVal={b.ben}
                  onId={v => set('boss', form.boss.map((x, xi) => xi === i ? { ...x, bid: v } : x))}
                  onEn={v => set('boss', form.boss.map((x, xi) => xi === i ? { ...x, ben: v } : x))} />
                <button className={btnDanger} onClick={() => set('boss', form.boss.filter((_, xi) => xi !== i))}>Hapus tantangan</button>
              </div>
            ))}
            <button className={`${btnGhost} mt-2`} onClick={() => set('boss', [...form.boss, { tid: '', ten: '', bid: '', ben: '' }])}>+ Tantangan</button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} /> Tayang di situs
          </label>
          <div className="flex gap-2 pt-2">
            <button className={btnPrimary} onClick={save}>Simpan</button>
            <button className={btnGhost} onClick={() => setForm(null)}>Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}
