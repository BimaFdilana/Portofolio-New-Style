import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import type { MsgKey } from '../lib/i18n'
import { Hero } from '../components/Hero'
import { AdventureLog, Dungeons, FinalQuest, Footer, Inventory, Relics } from '../components/Sections'

/** Toast "TERBUKA" saat sebuah section pertama kali tercapai dengan scroll
 *  — seperti membuka area baru di peta. Sekali per section, 2,6 detik,
 *  lalu hilang sendiri.
 *
 *  Penting: beberapa section bisa tercapai dalam satu tick yang sama
 *  (section pendek + viewport tinggi — mis. #certs dan #journey terlihat
 *  bersamaan). Karena itu toast diANTRE, bukan diganti: kalau tidak,
 *  yang pertama tertelan dan pengguna tidak pernah melihatnya. Antrean
 *  pending dibatasi 2 — kalau pengguna meluncur cepat melewati semua
 *  section, toast lama yang belum tampil dibuang supaya tidak menumpuk. */
const UNLOCKS: { id: string; key: MsgKey }[] = [
  { id: 'skills', key: 'unlock.skills' },
  { id: 'projects', key: 'unlock.projects' },
  { id: 'certs', key: 'unlock.certs' },
  { id: 'journey', key: 'unlock.journey' },
  { id: 'contact', key: 'unlock.contact' },
]

const TOAST_MS = 2600

export function Home() {
  const { t } = useApp()
  const [toast, setToast] = useState<string | null>(null)
  const seenRef = useRef(new Set<string>())
  const queueRef = useRef<MsgKey[]>([])
  const busyRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    const showNext = () => {
      const next = queueRef.current.shift()
      if (!next) {
        busyRef.current = false
        setToast(null)
        return
      }
      busyRef.current = true
      setToast(tRef.current(next))
      timerRef.current = window.setTimeout(showNext, TOAST_MS)
    }
    const enqueue = (key: MsgKey) => {
      if (queueRef.current.length >= 2) queueRef.current.shift()
      queueRef.current.push(key)
      if (!busyRef.current) showNext()
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const id = (e.target as HTMLElement).id
        if (seenRef.current.has(id)) continue
        seenRef.current.add(id)
        const u = UNLOCKS.find(x => x.id === id)
        if (u) enqueue(u.key)
      }
    }, { threshold: 0.3 })
    UNLOCKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => {
      io.disconnect()
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <>
      <Hero />
      <Inventory />
      <Dungeons />
      <Relics />
      <AdventureLog />
      <FinalQuest />
      <Footer />
      {toast && (
        <div className="fixed bottom-36 sm:bottom-6 left-1/2 -translate-x-1/2 z-[65] dialog-rpg px-5 py-3 font-game text-[11px] anim-fade-up pointer-events-none whitespace-nowrap" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
