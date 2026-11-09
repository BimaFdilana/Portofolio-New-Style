import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../lib/store'
import { sfx } from '../lib/audio'
import type { MsgKey } from '../lib/i18n'

type Frame = 'idle' | 'walk-a' | 'walk-b' | 'wave'
const SPRITES: Record<Frame, string> = {
  idle: '/assets/mascot/idle.webp',
  'walk-a': '/assets/mascot/walk-a.webp',
  'walk-b': '/assets/mascot/walk-b.webp',
  wave: '/assets/mascot/wave.webp',
}
const ALL = Object.keys(SPRITES) as Frame[]
const TIPS: MsgKey[] = ['mascot.tip1', 'mascot.tip2', 'mascot.tip3', 'mascot.tip4']
const SAYS: MsgKey[] = ['mascot.say1', 'mascot.say2', 'mascot.say3', 'mascot.say4', 'mascot.say5', 'mascot.say6']
type SectionId = 'hero' | 'skills' | 'projects' | 'certs' | 'contact'
const SECTION_LINES: Record<SectionId, MsgKey> = {
  hero: 'mascot.sec_hero',
  skills: 'mascot.sec_skills',
  projects: 'mascot.sec_projects',
  certs: 'mascot.sec_certs',
  contact: 'mascot.sec_contact',
}
const SECTION_IDS: SectionId[] = ['skills', 'projects', 'certs', 'contact']
const CHAT_MIN = 16000 // jeda minimum antar ucapan mandiri
const CHAT_MAX = 26000 // jeda maksimum (acak di antaranya)
const CHAT_QUIET_AFTER_CLICK = 10000 // jangan bicara 10 dtk setelah diklik
const CHAT_MIN_IDLE = 1200 // jangan bicara saat baru selesai scroll
const WALK_GAP = 260 // ms tanpa scroll sebelum dianggap berhenti jalan
const STEP_MS = 150 // pergantian frame langkah saat jalan

/** Pemandu karakter full-body di TEPI KANAN website. Dia tidak lagi mengikuti
 *  kursor — posisinya naik mengikuti progres scroll (makin jauh di-scroll,
 *  makin tinggi dia "memanjat" tepi kanan), dan dia BERJALAN (siklus 2 frame)
 *  selama pengguna meng-scroll; saat diam dia berdiri santai.
 *
 *  Dia juga HIDUP SENDIRI: sesekali (tiap ~16–26 dtk, saat halaman terlihat
 *  & pengguna sedang diam) dia melambai + berbicara sendiri — menyapa sesuai
 *  waktu, mengomentari section yang sedang dibaca, atau berbagi tips acak.
 *  Klik dia untuk melambai + tips acak. Bisa disembunyikan & dipanggil lagi.
 *
 *  Android/HP (lebar < 640px): ukuran mengecil (72x96), dan dia tinggal di
 *  bagian bawah layar (80% -> 58% tinggi layar) supaya tidak menutupi konten
 *  bacaan; gelembung dialog mengecil. Hormat reduced-motion: parkir di kanan
 *  bawah, tanpa animasi jalan & tanpa ucapan otomatis. */
export function MascotGuide() {
  const { t } = useApp()
  const { pathname } = useLocation()
  const [hidden, setHidden] = useState(() => localStorage.getItem('mascot-hidden') === '1')
  const [frame, setFrame] = useState<Frame>('idle')
  const [bubble, setBubble] = useState<string | null>(null)
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  const [hearts, setHearts] = useState<number[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const topRef = useRef(0)
  const targetTopRef = useRef(0)
  const lastScrollRef = useRef(0)
  const waveUntilRef = useRef(0)
  const frameRef = useRef<Frame>('idle')
  const bubbleTimer = useRef<number | null>(null)
  const lastClickRef = useRef(0)
  const lastSpeakRef = useRef(0)
  const bubbleVisibleRef = useRef(false)
  const tRef = useRef(t)
  tRef.current = t

  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const showBubble = (text: string, ms = 4200) => {
    setBubble(text)
    bubbleVisibleRef.current = true
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => {
      setBubble(null)
      bubbleVisibleRef.current = false
    }, ms)
  }

  // Preload semua sprite supaya ganti frame instan (di luar muatan awal).
  useEffect(() => {
    ALL.forEach(f => { const im = new Image(); im.src = SPRITES[f] })
  }, [])

  // Layar kecil = mode HP (Android): ukuran & posisi menyesuaikan.
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Sapaan sekali per sesi.
  useEffect(() => {
    if (sessionStorage.getItem('mascot-greeted')) return
    sessionStorage.setItem('mascot-greeted', '1')
    const id = window.setTimeout(() => showBubble(t('mascot.hi'), 5200), 1200)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Target posisi dari progres scroll. Desktop: 60% -> 12% tinggi layar.
  // HP: 80% -> 58% (tinggal di bawah, dekat jempol, tak menutupi bacaan).
  useEffect(() => {
    const H = mobile ? 96 : 128
    const [top0, top1] = mobile ? [0.80, 0.58] : [0.60, 0.12]
    const updateTarget = () => {
      const vh = window.innerHeight
      const max = Math.max(1, document.documentElement.scrollHeight - vh)
      const p = Math.min(1, Math.max(0, window.scrollY / max))
      targetTopRef.current = Math.min(
        Math.max(vh * (top0 - p * (top0 - top1)), 8),
        vh - H - 8,
      )
    }
    const onScroll = () => {
      lastScrollRef.current = performance.now()
      updateTarget()
    }
    updateTarget()
    topRef.current = targetTopRef.current
    wrapRef.current?.style.setProperty('transform', `translateY(${topRef.current}px)`)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateTarget)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateTarget)
    }
  }, [mobile])

  // Loop: lerp posisi ke target + tentukan frame (jalan / diam / melambai).
  // Semua jam pakai performance.now() (campur Date.now() bikin override
  // tidak pernah kedaluwarsa — bug yang pernah ketemu di versi kursor).
  useEffect(() => {
    if (reduced) return
    let raf = 0
    const tick = (now: number) => {
      const top = topRef.current + (targetTopRef.current - topRef.current) * 0.12
      topRef.current = top
      const walking = now - lastScrollRef.current < WALK_GAP
      const bob = walking ? Math.sin(now / 90) * 3 : Math.sin(now / 900) * 2
      wrapRef.current?.style.setProperty('transform', `translateY(${top + bob}px)`)
      let next: Frame
      if (now < waveUntilRef.current) next = 'wave'
      else if (walking) next = Math.floor(now / STEP_MS) % 2 === 0 ? 'walk-a' : 'walk-b'
      else next = 'idle'
      if (next !== frameRef.current) {
        frameRef.current = next
        setFrame(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  // Ngobrol sendiri: sesekali melambai + berbicara tanpa diminta — menyapa
  // sesuai waktu, mengomentari section yang sedang dibaca, atau tips acak.
  // Hanya saat: tidak disembunyikan, tab terlihat, pengguna sedang diam
  // (tidak baru scroll / klik), tidak ada gelembung tampil, dan sudah cukup
  // lama sejak ucapan terakhir. Tanpa reduced-motion: diam total.
  useEffect(() => {
    if (reduced || hidden) return
    let alive = true
    let timer = 0
    const currentSection = (): SectionId => {
      const mid = window.innerHeight * 0.5
      let current: SectionId = 'hero'
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= mid) current = id
      }
      return current
    }
    const timeLine = (): MsgKey => {
      const h = new Date().getHours()
      if (h < 11) return 'mascot.morning'
      if (h < 15) return 'mascot.afternoon'
      if (h < 19) return 'mascot.evening'
      return 'mascot.night'
    }
    const speak = () => {
      const r = Math.random()
      let key: MsgKey
      if (r < 0.45) key = SECTION_LINES[currentSection()]
      else if (r < 0.6) key = timeLine()
      else key = SAYS[Math.floor(Math.random() * SAYS.length)]
      wave(1800)
      showBubble(tRef.current(key), 5500)
      lastSpeakRef.current = performance.now()
    }
    const tick = () => {
      if (!alive) return
      const now = performance.now()
      const canSpeak = document.visibilityState === 'visible'
        && now - lastScrollRef.current > CHAT_MIN_IDLE
        && now - lastClickRef.current > CHAT_QUIET_AFTER_CLICK
        && now - lastSpeakRef.current > CHAT_MIN
        && now >= waveUntilRef.current
        && !bubbleVisibleRef.current
      if (canSpeak) {
        speak()
        timer = window.setTimeout(tick, CHAT_MIN + Math.random() * (CHAT_MAX - CHAT_MIN))
      } else {
        timer = window.setTimeout(tick, 4000)
      }
    }
    timer = window.setTimeout(tick, 14000 + Math.random() * 8000)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, hidden])

  if (pathname === '/game') return null

  const wave = (ms = 1400) => {
    waveUntilRef.current = performance.now() + ms
    frameRef.current = 'wave'
    setFrame('wave')
  }
  const onMascotClick = () => {
    sfx.pickup()
    lastClickRef.current = performance.now()
    wave()
    setHearts(h => [...h, Date.now()])
    window.setTimeout(() => setHearts(h => h.slice(1)), 950)
    // Di HP tidak ada keyboard fisik — jangan tawarkan rahasia "ketik coin".
    const pool = mobile ? TIPS.filter(k => k !== 'mascot.tip4') : TIPS
    showBubble(t(pool[Math.floor(Math.random() * pool.length)]))
  }
  const onHide = () => {
    wave(900)
    showBubble(t('mascot.bye'), 2600)
    window.setTimeout(() => {
      localStorage.setItem('mascot-hidden', '1')
      setHidden(true)
    }, 900)
  }
  const onShow = () => {
    localStorage.setItem('mascot-hidden', '0')
    setHidden(false)
    sfx.coin()
    wave()
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
      className="fixed right-2 top-0 z-[60] pointer-events-none will-change-transform"
      style={reduced ? { top: 'auto', bottom: 16 } : undefined}>
      <div className="relative">
        {bubble && (
          <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-max dialog-rpg px-3 py-2 text-center pointer-events-none ${mobile ? 'max-w-[180px]' : 'max-w-[220px]'}`}>
            <p className={`leading-snug font-bold text-ink ${mobile ? 'text-[12px]' : 'text-[13px]'}`}>{bubble}</p>
            <span className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-cream border-t-2 border-r-2 border-ink rotate-45" />
          </div>
        )}
        <button ref={btnRef} onClick={onMascotClick} aria-label="Pemandu karakter"
          className={`pointer-events-auto relative block drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95 ${mobile ? 'w-[72px] h-[96px]' : 'w-[96px] h-[128px]'}`}>
          <img src={SPRITES[frame]} alt="" draggable={false}
            className={`w-full h-full object-contain select-none ${bubble ? 'anim-mascot-talk' : ''}`} />
          {hearts.map(id => (
            <span key={id} className="anim-heart-rise absolute text-xl pointer-events-none"
              style={{ left: `${18 + Math.random() * 56}px`, top: 6 }}>💗</span>
          ))}
        </button>
        <button onClick={onHide} aria-label={t('mascot.hide')}
          className="pointer-events-auto absolute -top-1 -left-1 w-6 h-6 rounded-full bg-white border-2 border-ink text-[11px] leading-none text-ink shadow-sm">
          ✕
        </button>
      </div>
    </div>
  )
}
