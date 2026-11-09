import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../lib/store'
import { sfx } from '../lib/audio'

type Expr = 'happy' | 'sad' | 'laugh' | 'laugh2' | 'angry' | 'think' | 'wow' | 'kiss' | 'smug' | 'wink-wow' | 'wink-tongue' | 'surprised'
const SPRITES: Record<Expr, string> = {
  happy: '/assets/mascot/happy.webp', sad: '/assets/mascot/sad.webp',
  laugh: '/assets/mascot/laugh.webp', laugh2: '/assets/mascot/laugh2.webp',
  angry: '/assets/mascot/angry.webp', think: '/assets/mascot/think.webp',
  wow: '/assets/mascot/wow.webp', kiss: '/assets/mascot/kiss.webp',
  smug: '/assets/mascot/smug.webp', 'wink-wow': '/assets/mascot/wink-wow.webp',
  'wink-tongue': '/assets/mascot/wink-tongue.webp', surprised: '/assets/mascot/surprised.webp',
}
const ALL = Object.keys(SPRITES) as Expr[]
const TIPS = ['mascot.tip1', 'mascot.tip2', 'mascot.tip3', 'mascot.tip4'] as const
const SIZE = 104 // lebar tampilan maskot (px); dipakai juga untuk clamp posisi
const OFFSET_X = -72 // maskot melayang di kiri-atas kursor, supaya tidak menutupi yang diklik
const OFFSET_Y = -118

/** Pemandu karakter interaktif: mengikuti kursor dengan jeda kenyal, bereaksi
 *  dengan ekspresi (senang / kaget / cium / berpikir / sedih saat dicuekin),
 *  bisa disembunyikan & dipanggil lagi. Hormat reduced-motion: diam di pojok. */
export function MascotGuide() {
  const { t } = useApp()
  const { pathname } = useLocation()
  const [hidden, setHidden] = useState(() => localStorage.getItem('mascot-hidden') === '1')
  const [expr, setExpr] = useState<Expr>('happy')
  const [bubble, setBubble] = useState<string | null>(null)
  const [bubbleBelow, setBubbleBelow] = useState(false)
  const [hearts, setHearts] = useState<number[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const lastMoveRef = useRef(Date.now())
  const overrideRef = useRef<{ expr: Expr; until: number } | null>(null)
  const exprRef = useRef<Expr>('happy')
  const bubbleTimer = useRef<number | null>(null)

  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const showBubble = (text: string, ms = 4200) => {
    // Kalau maskot dekat tepi atas, gelembung tampil DI BAWAH supaya tidak terpotong.
    setBubbleBelow(posRef.current.y < 160)
    setBubble(text)
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms)
  }
  const override = (e: Expr, ms: number) => {
    overrideRef.current = { expr: e, until: performance.now() + ms }
    setExpr(e)
  }

  // Preload semua sprite supaya ganti ekspresi instan (di luar muatan awal).
  useEffect(() => {
    ALL.forEach(e => { const im = new Image(); im.src = SPRITES[e] })
  }, [])

  // Sapaan sekali per sesi.
  useEffect(() => {
    if (sessionStorage.getItem('mascot-greeted')) return
    sessionStorage.setItem('mascot-greeted', '1')
    const id = window.setTimeout(() => showBubble(t('mascot.hi'), 5200), 1200)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Posisi awal: pojok kanan bawah (di atas tombol Mini Dungeon).
  useEffect(() => {
    const rest = { x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 96 }
    posRef.current = rest
    targetRef.current = rest
  }, [])

  // Ikuti kursor.
  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      // Kalau kursor sudah dekat, maskot diam (supaya bisa diklik / dielus).
      const c = posRef.current
      if (Math.hypot(e.clientX - (c.x + SIZE / 2), e.clientY - (c.y + SIZE / 2)) < 150) {
        targetRef.current = { ...c } // berhenti mengejar: tahan posisi sekarang
        lastMoveRef.current = Date.now()
        return
      }
      targetRef.current = {
        x: Math.min(Math.max(e.clientX + OFFSET_X, 8), window.innerWidth - SIZE - 8),
        y: Math.min(Math.max(e.clientY + OFFSET_Y, 8), window.innerHeight - SIZE - 8),
      }
      lastMoveRef.current = Date.now()
    }
    const onDown = (e: PointerEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return // klik maskot ditangani tombolnya
      override('wink-wow', 550)
      lastMoveRef.current = Date.now()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [reduced])

  // Loop gerak + ekspresi dari kecepatan & waktu diam.
  useEffect(() => {
    if (reduced) return
    let raf = 0
    let lastT = performance.now()
    let lastX = posRef.current.x
    let lastY = posRef.current.y
    let flip = 1
    const tick = (now: number) => {
      const dt = Math.max(1, now - lastT)
      lastT = now
      const p = posRef.current
      const tg = targetRef.current
      const nx = p.x + (tg.x - p.x) * 0.14
      const ny = p.y + (tg.y - p.y) * 0.14
      const speed = (Math.hypot(nx - lastX, ny - lastY) / dt) * 1000 // px/detik
      if (nx - lastX > 2) flip = 1
      else if (nx - lastX < -2) flip = -1
      lastX = nx; lastY = ny
      p.x = nx; p.y = ny
      const bob = Math.sin(now / 320) * 4
      wrapRef.current?.style.setProperty('transform', `translate(${nx}px, ${ny + bob}px)`)
      // Hadap mengikuti arah gerak — hanya gambarnya yang dibalik, BUKAN
      // gelembung/tombolnya (kalau wrapper ikut dibalik, teks jadi terbalik).
      imgRef.current?.style.setProperty('transform', `scaleX(${flip})`)
      // Ekspresi (override menang selama waktunya).
      const ov = overrideRef.current
      let next: Expr
      if (ov && now < ov.until) next = ov.expr
      else {
        if (ov) overrideRef.current = null
        const idle = Date.now() - lastMoveRef.current
        if (idle > 14000) next = 'sad'
        else if (idle > 6000) next = 'think'
        else if (speed > 950) next = 'surprised'
        else if (speed > 420) next = 'wow'
        else next = 'happy'
      }
      if (next !== exprRef.current) {
        exprRef.current = next
        setExpr(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  // Sesekali iseng sendiri (kedip / ketawa kecil) saat tidak diam lama.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || hidden) return
      const idle = Date.now() - lastMoveRef.current
      if (idle > 6000 || overrideRef.current) return
      const pick: Expr[] = ['wink-tongue', 'laugh2', 'smug']
      override(pick[Math.floor(Math.random() * pick.length)], 900)
    }, 9000)
    return () => window.clearInterval(id)
  }, [hidden])

  if (pathname === '/game') return null

  const onMascotClick = () => {
    sfx.pickup()
    override('kiss', 1100)
    setHearts(h => [...h, Date.now()])
    window.setTimeout(() => setHearts(h => h.slice(1)), 950)
    showBubble(t(TIPS[Math.floor(Math.random() * TIPS.length)]))
  }
  const onHide = () => {
    override('angry', 700)
    showBubble(t('mascot.bye'), 2600)
    window.setTimeout(() => {
      localStorage.setItem('mascot-hidden', '1')
      setHidden(true)
    }, 700)
  }
  const onShow = () => {
    localStorage.setItem('mascot-hidden', '0')
    setHidden(false)
    sfx.coin()
    override('laugh', 1100)
    window.setTimeout(() => showBubble(t('mascot.hi'), 4200), 300)
  }

  if (hidden) {
    return (
      <button onClick={onShow} aria-label={t('mascot.show')}
        className="fixed right-3 bottom-24 z-[60] w-11 h-11 rounded-full bg-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] text-xl anim-floaty">
        💗
      </button>
    )
  }

  return (
    <div ref={wrapRef}
      className="fixed left-0 top-0 z-[60] pointer-events-none will-change-transform"
      style={reduced ? { transform: `translate(${typeof window !== 'undefined' ? window.innerWidth - SIZE - 16 : 0}px, ${typeof window !== 'undefined' ? window.innerHeight - SIZE - 96 : 0}px)` } : undefined}>
      <div className="relative">
        {bubble && (
          <div className={`absolute left-1/2 -translate-x-1/2 w-max max-w-[220px] dialog-rpg px-3 py-2 text-center pointer-events-none ${bubbleBelow ? 'top-full mt-2' : 'bottom-full mb-1'}`}>
            <p className="text-[13px] leading-snug font-bold text-ink">{bubble}</p>
            <span className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-cream border-ink rotate-45 ${bubbleBelow ? '-top-[7px] border-t-2 border-l-2' : '-bottom-[7px] border-b-2 border-r-2'}`} />
          </div>
        )}
        <button ref={btnRef} onClick={onMascotClick} aria-label="Pemandu karakter"
          className="pointer-events-auto relative block w-[104px] h-[104px] drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95">
          <span key={expr} className="anim-mascot-pop block w-full h-full">
            <img ref={imgRef} src={SPRITES[expr]} alt="" draggable={false}
              className="w-full h-full object-contain select-none" />
          </span>
          {hearts.map(id => (
            <span key={id} className="anim-heart-rise absolute text-xl pointer-events-none"
              style={{ left: `${18 + Math.random() * 56}px`, top: 6 }}>💗</span>
          ))}
        </button>
        <button onClick={onHide} aria-label={t('mascot.hide')}
          className="pointer-events-auto absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-ink text-[11px] leading-none text-ink shadow-sm">
          ✕
        </button>
      </div>
    </div>
  )
}
