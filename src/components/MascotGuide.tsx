import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../lib/store'
import { useContent } from '../lib/content'
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

/** Pemandu karakter full-body di KANAN BAWAH website (posisi tetap, tidak
 *  lagi memanjat mengikuti scroll). Dia BERJALAN (siklus 2 frame) selama
 *  pengguna meng-scroll; saat diam dia berdiri santai.
 *
 *  Dia juga HIDUP SENDIRI: sesekali (tiap ~16–26 dtk, saat halaman terlihat
 *  & pengguna sedang diam) dia melambai + berbicara sendiri — menyapa sesuai
 *  waktu, mengomentari section yang sedang dibaca, atau berbagi tips acak.
 *  Klik dia untuk melambai + tips acak.
 *
 *  Tombol 💬 di pojok karakternya membuka CHAT SUPPORT — gelembung dialog
 *  tempat pengunjung bertanya (proyek, rate, CV, kontak, teknologi) dan
 *  dijawab otomatis oleh pemandu; untuk hal di luar catatan, diarahkan ke
 *  WhatsApp Bima. Ucapan otomatis berhenti sementara saat chat terbuka.
 *
 *  Android/HP (lebar < 640px): ukuran mengecil (72x96); gelembung dialog
 *  mengecil. Hormat reduced-motion: tanpa animasi jalan & tanpa ucapan
 *  otomatis. */
type ChatMsg = { from: 'me' | 'bot'; text: string; link?: { label: string; href: string } }

export function MascotGuide() {
  const { t, lang } = useApp()
  const { owner } = useContent()
  const { pathname } = useLocation()
  const [frame, setFrame] = useState<Frame>('idle')
  const [bubble, setBubble] = useState<string | null>(null)
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  const [hearts, setHearts] = useState<number[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatOpened, setChatOpened] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)
  const chatOpenRef = useRef(false)
  const typingTimer = useRef<number | null>(null)
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
  // Bersihkan juga penanda sembunyi dari versi lama — karakter kini selalu
  // tampil di kanan bawah (tombol ✕ sudah diganti tombol chat).
  useEffect(() => {
    ALL.forEach(f => { const im = new Image(); im.src = SPRITES[f] })
    localStorage.removeItem('mascot-hidden')
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

  // Loop: tentukan frame (jalan / diam / melambai). Posisi karakter TETAP
  // di kanan bawah — yang bergerak hanya sprite-nya (jalan di tempat saat
  // pengguna meng-scroll). Semua jam pakai performance.now() (campur
  // Date.now() bikin override tidak pernah kedaluwarsa — bug yang pernah
  // ketemu di versi kursor).
  useEffect(() => {
    const onScroll = () => { lastScrollRef.current = performance.now() }
    window.addEventListener('scroll', onScroll, { passive: true })
    if (reduced) return () => window.removeEventListener('scroll', onScroll)
    let raf = 0
    const tick = (now: number) => {
      const walking = now - lastScrollRef.current < WALK_GAP
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
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduced])

  // Ngobrol sendiri: sesekali melambai + berbicara tanpa diminta — menyapa
  // sesuai waktu, mengomentari section yang sedang dibaca, atau tips acak.
  // Hanya saat: tab terlihat, pengguna sedang diam (tidak baru scroll /
  // klik), tidak ada gelembung tampil, sudah cukup lama sejak ucapan
  // terakhir, dan CHAT TIDAK sedang terbuka. Tanpa reduced-motion: diam total.
  useEffect(() => {
    if (reduced) return
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
        && !chatOpenRef.current
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
  }, [reduced])

  // ---- Chat support: jawaban otomatis berdasarkan kata kunci ----
  const waLink = `https://wa.me/${owner.whatsapp}`
  const replyFor = (raw: string): ChatMsg => {
    const q = raw.toLowerCase()
    const tr = tRef.current
    if (/(proyek|project|dungeon|portofolio|porto)/.test(q)) {
      return { from: 'bot', text: tr('chat.rProjects'), link: { label: tr('chat.rProjectsLink'), href: '#projects' } }
    }
    if (/(harga|rate|biaya|price|cost|tarif|ongkos|bayar|fee)/.test(q)) {
      return { from: 'bot', text: tr('chat.rRate'), link: { label: tr('chat.waLink'), href: waLink } }
    }
    if (/(kontak|contact|whatsapp|\bwa\b|email|hubungi|telepon|telpon)/.test(q)) {
      return { from: 'bot', text: tr('chat.rContact'), link: { label: tr('chat.waLink'), href: waLink } }
    }
    if (/(cv|resume)/.test(q)) {
      return { from: 'bot', text: tr('chat.rCv'), link: { label: tr('chat.rCvLink'), href: owner.cvUrl } }
    }
    if (/(teknologi|tech|stack|laravel|react|typescript|mysql|tailwind|vue|php|node)/.test(q)) {
      return { from: 'bot', text: tr('chat.rTech'), link: { label: tr('chat.rTechLink'), href: '#skills' } }
    }
    if (/(tersedia|available|siap|kosong|sibuk|jadwal|jam|waktu|kapan)/.test(q)) {
      return owner.available
        ? { from: 'bot', text: tr('chat.rAvailYes'), link: { label: tr('chat.waLink'), href: waLink } }
        : { from: 'bot', text: tr('chat.rAvailNo') }
    }
    if (/(halo|hai|\bhi\b|hello|pagi|siang|sore|malam|hei|permisi)/.test(q)) {
      return { from: 'bot', text: tr('chat.rHello') }
    }
    if (/(terima kasih|makasih|thanks|thank)/.test(q)) {
      return { from: 'bot', text: tr('chat.rThanks') }
    }
    return { from: 'bot', text: tr('chat.rDefault'), link: { label: tr('chat.waLink'), href: waLink } }
  }
  const sendChat = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    setMessages(m => [...m, { from: 'me', text }])
    setInput('')
    setTyping(true)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {
      setMessages(m => [...m, replyFor(text)])
      setTyping(false)
    }, 700)
  }
  const openChat = () => {
    sfx.pickup()
    setBubble(null)
    bubbleVisibleRef.current = false
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current)
    chatOpenRef.current = true
    setChatOpen(true)
    setChatOpened(true)
    wave(1200)
    setMessages(m => (m.length === 0 ? [{ from: 'bot', text: t('chat.greet') }] : m))
  }
  const closeChat = () => {
    chatOpenRef.current = false
    setChatOpen(false)
  }

  // Gulir daftar pesan ke bawah setiap ada pesan / status mengetik baru.
  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing, chatOpen])

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

  const quickReplies: MsgKey[] = ['chat.qProjects', 'chat.qRate', 'chat.qCv', 'chat.qWa']
  const quickTexts: Record<string, string> = {
    'chat.qProjects': lang === 'id' ? 'Lihat proyek Bima' : 'Show me Bima\'s projects',
    'chat.qRate': lang === 'id' ? 'Berapa rate proyek?' : 'What are your project rates?',
    'chat.qCv': lang === 'id' ? 'Minta CV Bima' : 'Send me Bima\'s CV',
    'chat.qWa': lang === 'id' ? 'Hubungi via WhatsApp' : 'Contact via WhatsApp',
  }

  return (
    <div className="fixed right-3 bottom-4 z-[60]">
      {/* Panel chat support — gelembung dialog di atas karakter. */}
      {chatOpen && (
        <div className="dialog-rpg absolute bottom-[calc(100%+12px)] right-0 w-[min(340px,calc(100vw-24px))] pointer-events-auto flex flex-col overflow-hidden" role="dialog" aria-label={t('chat.title')}>
          <div className="flex items-center gap-2 px-3 py-2 border-b-[3px] border-ink bg-gradient-to-b from-[#ffe066] to-[#ffb800]">
            <img src={SPRITES.idle} alt="" className="w-8 h-8 object-contain shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-game text-[13px] leading-none">BIMA · {t('chat.title')}</p>
              <p className="text-[11px] font-bold text-ink/70 mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-[#2f9e1d] border border-ink" /> {t('chat.online')}
              </p>
            </div>
            <button onClick={closeChat} aria-label={t('chat.close')}
              className="w-7 h-7 rounded-full bg-white border-2 border-ink text-[12px] leading-none text-ink shadow-sm shrink-0">✕</button>
          </div>
          <div ref={msgsRef} className="px-3 py-3 space-y-2 overflow-y-auto max-h-[240px] bg-parchment/60 dark:bg-transparent">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 text-[13px] font-bold leading-snug border-2 border-ink ${
                  m.from === 'me'
                    ? 'bg-gradient-to-b from-[#7cc4ff] to-[#2f9bff] text-white rounded-2xl rounded-br-sm shadow-[2px_2px_0_var(--color-ink)]'
                    : 'bg-white dark:bg-night rounded-2xl rounded-bl-sm shadow-[2px_2px_0_var(--color-ink)]'
                }`}>
                  <p>{m.text}</p>
                  {m.link && (
                    <a href={m.link.href} target={m.link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                      onClick={() => setChatOpen(false)}
                      className="inline-block mt-2 font-game text-[11px] bg-white text-ink border-2 border-ink rounded-full px-3 py-1 shadow-[2px_2px_0_var(--color-ink)]">
                      {m.link.label} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="px-3 py-2 text-[13px] font-bold bg-white dark:bg-night border-2 border-ink rounded-2xl rounded-bl-sm shadow-[2px_2px_0_var(--color-ink)]">
                  {t('chat.typing')}
                </div>
              </div>
            )}
          </div>
          <div className="px-3 pt-1 pb-2 flex gap-1 flex-wrap">
            {quickReplies.map(k => (
              <button key={k} onClick={() => sendChat(quickTexts[k])}
                className="font-game text-[10px] bg-white dark:bg-night border-2 border-ink rounded-full px-2 py-1 shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                {t(k)}
              </button>
            ))}
          </div>
          <form className="flex gap-2 px-3 pb-3" onSubmit={e => { e.preventDefault(); sendChat(input) }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('chat.placeholder')}
              aria-label={t('chat.placeholder')}
              className="min-w-0 flex-1 border-[3px] border-ink rounded-xl px-3 py-2 text-sm font-bold bg-white text-ink" />
            <button type="submit" className="btn-game btn-green !px-3 !py-2 shrink-0" aria-label={t('chat.send')}>➤</button>
          </form>
        </div>
      )}
      <div className="relative">
        {bubble && !chatOpen && (
          <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-max dialog-rpg px-3 py-2 text-center pointer-events-none ${mobile ? 'max-w-[180px]' : 'max-w-[220px]'}`}>
            <p className={`leading-snug font-bold text-ink dark:text-parchment ${mobile ? 'text-[12px]' : 'text-[13px]'}`}>{bubble}</p>
            <span className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-cream dark:bg-[#2c355e] border-t-2 border-r-2 border-ink rotate-45" />
          </div>
        )}
        <button onClick={onMascotClick} aria-label="Pemandu karakter"
          className={`pointer-events-auto relative block drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95 ${mobile ? 'w-[72px] h-[96px]' : 'w-[96px] h-[128px]'}`}>
          <img src={SPRITES[frame]} alt="" draggable={false}
            className={`w-full h-full object-contain select-none ${bubble ? 'anim-mascot-talk' : ''}`} />
          {hearts.map(id => (
            <span key={id} className="anim-heart-rise absolute text-xl pointer-events-none"
              style={{ left: `${18 + Math.random() * 56}px`, top: 6 }}>💗</span>
          ))}
        </button>
        {/* Tombol pesan — ganti tombol ✕: buka chat support. Melayang di
          ATAS karakter dengan jarak 8px (tidak lagi menempel di bahunya);
          disembunyikan saat chat terbuka supaya tidak menumpuk panel. */}
        {!chatOpen && (
          <button onClick={openChat} aria-label={t('chat.open')}
            className="pointer-events-auto absolute bottom-[calc(100%+8px)] left-0 h-8 rounded-full bg-white border-[3px] border-ink shadow-[2px_2px_0_var(--color-ink)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 px-2">
            <span className="text-base leading-none">💬</span>
            <span className="font-game text-[11px] leading-none">{t('chat.ask')}</span>
            {!chatOpened && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-terra text-white border-2 border-ink text-[9px] font-black leading-[14px]">1</span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
