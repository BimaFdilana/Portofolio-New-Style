import type { ReactNode } from 'react'

export const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
export const labelCls = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide'
export const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md'
export const btnGhost = 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-3 py-2 rounded-md'
export const btnDanger = 'bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold px-3 py-2 rounded-md'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

export function BiField({ label, idVal, enVal, onId, onEn, textarea = false }: {
  label: string; idVal: string; enVal: string
  onId: (v: string) => void; onEn: (v: string) => void; textarea?: boolean
}) {
  const Input = textarea ? 'textarea' : 'input'
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field label={`${label} (ID)`}>
        <Input className={inputCls} value={idVal} rows={textarea ? 3 : undefined} onChange={e => onId(e.target.value)} />
      </Field>
      <Field label={`${label} (EN)`}>
        <Input className={inputCls} value={enVal} rows={textarea ? 3 : undefined} onChange={e => onEn(e.target.value)} />
      </Field>
    </div>
  )
}

export function Notice({ kind, children }: { kind: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    ok: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  }[kind]
  return <div className={`border rounded-md px-4 py-3 text-sm ${styles}`}>{children}</div>
}
