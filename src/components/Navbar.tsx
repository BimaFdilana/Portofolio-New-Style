import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { sfx } from '../lib/audio'
import { owner } from '../data/content'

const LINKS = [
  { to: '/', hash: '', key: 'nav.home' },
  { to: '/', hash: '#skills', key: 'nav.skills' },
  { to: '/', hash: '#projects', key: 'nav.projects' },
  { to: '/', hash: '#certs', key: 'nav.certs' },
  { to: '/', hash: '#contact', key: 'nav.contact' },
] as const

export function goSection(navigate: (p: string) => void, pathname: string, hash: string) {
  if (!hash) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  if (pathname !== '/') { navigate('/'); setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120) }
  else document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
}

export function Navbar() {
  const { t, lang, setLang, dark, toggleDark, muted, toggleMuted, bgmOn, toggleBgm } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [questFlash, setQuestFlash] = useState(false)

  // Penanda quest baru: berkedip 3 hari pertama setiap bulan (sentuhan tema).
  useEffect(() => { setQuestFlash(new Date().getDate() <= 3) }, [])

  const nav = (hash: string) => { setOpen(false); goSection(navigate, pathname, hash) }

  return (
    <header className="sticky top-0 z-50 bg-parchment dark:bg-nightdeep border-b-[3px] border-ink dark:border-black shadow-[0_3px_0_rgba(43,33,24,.35)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-[58px] flex items-center gap-2">
        <span className={`hidden lg:inline font-pixel text-[9px] text-terra ${questFlash ? 'anim-blink' : ''}`}>!</span>
        <button className="font-pixel text-[11px] text-terra shrink-0" onClick={() => nav('')} aria-label="New quest - home">
          NEW QUEST
        </button>
        <span className={`hidden lg:inline font-pixel text-[9px] text-terra ${questFlash ? 'anim-blink' : ''}`}>!</span>
        <button className="font-pixel text-base sm:text-lg shrink-0 ml-1" onClick={() => nav('')}>
          {owner.brand}
        </button>

        <nav className="hidden md:flex items-center gap-5 ml-8" aria-label="Utama">
          {LINKS.map(l => (
            <button key={l.key} onClick={() => nav(l.hash)}
              className="font-pixel text-[10px] hover:text-terra transition-colors">
              {t(l.key as never)}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleBgm} aria-pressed={bgmOn}
            className="font-pixel text-[8px] px-2 py-[7px] border-2 border-ink bg-ochre text-ink shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
            ♪ {bgmOn ? 'ON' : 'OFF'}
          </button>
          <button onClick={toggleDark} aria-label="Toggle theme"
            className="w-[30px] h-[30px] border-2 border-ink bg-white dark:bg-night text-sm shadow-[2px_2px_0_var(--color-ink)]">
            {dark ? '☀️' : '🌙'}
          </button>
          <div className="flex border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] overflow-hidden" role="group" aria-label="Language">
            {(['id', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`font-pixel text-[8px] px-2 py-[8px] ${lang === l ? 'bg-terra text-white' : 'bg-white dark:bg-night dark:text-parchment'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/game" className="btn-pixel !bg-terra hidden sm:inline-block" aria-label="Play mini dungeon">
            ⚔ {t('nav.game')}
          </Link>
          <button className="md:hidden border-2 border-ink bg-white dark:bg-night px-2 py-[5px] shadow-[2px_2px_0_var(--color-ink)]"
            onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Menu">☰</button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t-[3px] border-ink bg-parchment dark:bg-nightdeep px-4 py-3 flex flex-col gap-3" aria-label="Menu seluler">
          {LINKS.map(l => (
            <button key={l.key} className="font-pixel text-[11px] text-left" onClick={() => nav(l.hash)}>{t(l.key as never)}</button>
          ))}
          <Link to="/game" className="font-pixel text-[11px] text-terra" onClick={() => setOpen(false)}>⚔ {t('nav.game')}</Link>
          <button className="font-pixel text-[11px] text-left" onClick={toggleMuted}>{muted ? '🔇 UNMUTE SFX' : '🔊 MUTE SFX'}</button>
        </nav>
      )}
    </header>
  )
}

/** Tombol melayang: Spirit Guide (kontak cepat) + jalan pintas game. */
export function FloatingButtons() {
  const { t } = useApp()
  const [guide, setGuide] = useState(false)
  const { pathname } = useLocation()
  if (pathname === '/game') return null
  const wa = `https://wa.me/${owner.whatsapp}`
  return (
    <>
      <button onClick={() => { sfx.pickup(); setGuide(true) }} aria-label={t('guide.open')}
        className="fixed left-3 bottom-4 z-[60] w-14 h-14 rounded-full bg-terra text-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] text-2xl anim-floaty">
        🧚
        <span className="absolute -top-2 -right-2 bg-ochre text-ink font-pixel text-[7px] px-1 py-[3px] border-2 border-ink">NEW</span>
      </button>
      <Link to="/game" aria-label="Mini Dungeon"
        className="fixed right-3 bottom-4 z-[60] btn-pixel !bg-terra flex items-center gap-2">
        ⚔ MINI DUNGEON
        <span className="absolute -top-3 -right-2 bg-ochre text-ink font-pixel text-[7px] px-1 py-[3px] border-2 border-ink">NEW</span>
      </Link>
      {guide && (
        <div className="fixed inset-0 z-[70] bg-ink/60 flex items-center justify-center p-4" onClick={() => setGuide(false)}>
          <div className="dialog-rpg max-w-sm w-full p-5" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('guide.title')}>
            <p className="font-pixel text-[11px] mb-3">🧚 {t('guide.title')}</p>
            <div className="flex flex-col gap-2 font-extrabold">
              <a className="underline" href={wa} target="_blank" rel="noreferrer">💬 WhatsApp — {t('contact.chat')}</a>
              <a className="underline" href={`mailto:${owner.email}`}>✉️ {owner.email}</a>
              <a className="underline" href={owner.github} target="_blank" rel="noreferrer">🐙 GitHub — {t('contact.repos')}</a>
              <a className="underline" href={owner.linkedin} target="_blank" rel="noreferrer">💼 LinkedIn — {t('contact.follow')}</a>
            </div>
            <button className="btn-pixel !bg-night mt-4" onClick={() => setGuide(false)}>{t('contact.close')}</button>
          </div>
        </div>
      )}
    </>
  )
}
