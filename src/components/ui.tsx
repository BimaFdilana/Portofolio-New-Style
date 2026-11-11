import { useEffect, useRef, useState } from 'react'

/* Satu warna aksen per section: lencana judul + garis bawah memakai
 *  gradasi aksen section itu saja, supaya mata tidak diserang semua warna
 *  sekaligus di satu layar. Default 'gold' (dipakai halaman lain). */
const ACCENTS = {
  gold: 'from-[#ffe066] to-[#ff9d00]',
  green: 'from-[#7ed957] to-[#2f9e1d]',
  red: 'from-[#ff7a86] to-[#c81e32]',
  blue: 'from-[#6ec1ff] to-[#1b6fe0]',
  purple: 'from-[#c084fc] to-[#8b5cf6]',
} as const
export type Accent = keyof typeof ACCENTS

export function SectionTitle({ icon, a, b, accent = 'gold' }: { icon: string; a: string; b: string; accent?: Accent }) {
  return (
    <div className="text-center mb-10">
      <span className={`inline-block bg-gradient-to-b ${ACCENTS[accent]} text-ink border-[3px] border-ink rounded-2xl shadow-[4px_4px_0_var(--color-ink)] px-3 py-2 text-xl leading-none`}>{icon}</span>
      <h2 className="font-display text-3xl sm:text-5xl mt-5 leading-tight">
        <span className="title-chunky">{a}</span>{' '}
        <span className="title-chunky-blue">{b}</span>
      </h2>
      <div className={`w-28 h-[8px] bg-gradient-to-r ${ACCENTS[accent]} mx-auto mt-4 border-[3px] border-ink rounded-full`} />
    </div>
  )
}

export function Hearts({ n, max = 5, size = 18 }: { n: number; max?: number; size?: number }) {
  return (
    <span aria-label={`${n}/${max} hearts`} className="inline-flex gap-[2px]">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: size }} className={i < n ? 'text-heart' : 'text-ink/25 dark:text-white/25'}>♥</span>
      ))}
    </span>
  )
}

export function Stars({ n }: { n: number }) {
  return <span className="text-ochre tracking-[2px]" aria-label={`difficulty ${n}/3`}>{'★'.repeat(n)}{'☆'.repeat(3 - n)}</span>
}

/** Kotak dialog RPG dengan efek typewriter. */
export function DialogBox({ text, className = '' }: { text: string; className?: string }) {
  const [shown, setShown] = useState(0)
  const timer = useRef<number | null>(null)
  useEffect(() => {
    setShown(0)
    let i = 0
    timer.current = window.setInterval(() => {
      i += 1
      setShown(i)
      if (i >= text.length && timer.current) { clearInterval(timer.current); timer.current = null }
    }, 16)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [text])
  return (
    <div className={`dialog-rpg relative p-4 pr-8 font-extrabold leading-relaxed cursor-pointer ${className}`}
      onClick={() => setShown(text.length)} role="button" aria-label={text}>
      <p>{text.slice(0, shown)}{shown < text.length && <span className="type-caret ml-[2px]" />}</p>
      <span className="absolute right-2 bottom-1 text-terra anim-blink">▼</span>
    </div>
  )
}

/** Confetti pixel sederhana (DOM, tanpa library). */
export function spawnConfetti(n = 60) {
  const colors = ['#c9a227', '#b5533c', '#5f7f52', '#4e7396', '#c4554d']
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span')
    const size = 6 + Math.random() * 7
    el.className = 'confetti-bit'
    el.style.left = `${Math.random() * 100}vw`
    el.style.width = `${size}px`
    el.style.height = `${size * (Math.random() > 0.5 ? 1 : 0.5)}px`
    el.style.background = colors[i % colors.length]
    el.style.animationDuration = `${2.2 + Math.random() * 2.2}s`
    el.style.animationDelay = `${Math.random() * 0.35}s`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 5200)
  }
}
