import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { THEMES } from '../lib/themes'
import { sfx } from '../lib/audio'
import { useContent } from '../lib/content'
import { scrollToEl } from '../lib/smoothScroll'
import { ScrollExp } from './ScrollExp'

const LINKS = [
  { to: '/', hash: '', key: 'nav.home' },
  { to: '/', hash: '#skills', key: 'nav.skills' },
  { to: '/', hash: '#projects', key: 'nav.projects' },
  { to: '/', hash: '#certs', key: 'nav.certs' },
  { to: '/', hash: '#contact', key: 'nav.contact' },
] as const

export function goSection(navigate: (p: string) => void, pathname: string, hash: string) {
  if (!hash) { scrollToEl(0); return }
  if (pathname !== '/') { navigate('/'); setTimeout(() => scrollToEl(hash), 120) }
  else scrollToEl(hash)
}

export function Navbar() {
  const { t, lang, setLang, theme, themeSource, setTheme, cycleTheme, shuffleTheme, setRandomMode, pro, togglePro, muted, toggleMuted, bgmOn, toggleBgm } = useApp()
  const { owner } = useContent()
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [active, setActive] = useState('')
  useEffect(() => {
    if (pathname !== '/') { setActive(''); return }
    const ids = ['#skills', '#projects', '#certs', '#contact']
    const onScroll = () => { if (window.scrollY < 120) setActive('') }
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`)
    }, { rootMargin: '-25% 0px -65% 0px' })
    ids.forEach(id => { const el = document.querySelector(id); if (el) obs.observe(el) })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [pathname])

  const nav = (hash: string) => { setOpen(false); setActive(hash); goSection(navigate, pathname, hash) }
  const current = THEMES.find(x => x.id === theme) ?? THEMES[0]
  const pick = (id: typeof theme) => { setTheme(id); setThemeOpen(false) }

  return (
    <header className="sticky top-0 z-50 bg-parchment/85 dark:bg-nightdeep/85 backdrop-blur-md border-b-[3px] border-ink dark:border-black shadow-[0_2px_16px_rgba(30,37,71,.15)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-[58px] flex items-center gap-2">
        <button className="font-display text-xl sm:text-2xl shrink-0 ml-1 title-chunky" onClick={() => nav('')}>
          {owner.brand}
        </button>

        <nav className="hidden md:flex items-center gap-5 ml-8" aria-label="Utama">
          {LINKS.map(l => (
            <button key={l.key} onClick={() => nav(l.hash)} aria-current={active === l.hash ? true : undefined}
              className={`font-game text-xs transition-colors ${active === l.hash ? 'text-terra underline decoration-[3px] underline-offset-4' : 'hover:text-terra'}`}>
              {t(l.key as never)}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleBgm} aria-pressed={bgmOn}
            className="hidden sm:inline-block font-game text-[10px] px-2 py-2 border-[3px] border-ink rounded-[10px] bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
            ♪ {bgmOn ? 'ON' : 'OFF'}
          </button>
          {/* Pemilih tema: tombol siklus (ikon + nama tema aktif) + acak + daftar pilih. */}
          <div className="relative flex items-center gap-2">
            <button data-testid="theme-cycle" onClick={cycleTheme} aria-label={t('theme.cycle')} title={t('theme.cycle')}
              className="flex items-center gap-1.5 h-[34px] px-2 border-[3px] border-ink rounded-[10px] bg-white text-ink shadow-[2px_2px_0_var(--color-ink)] font-game text-[10px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
              <span aria-hidden>{current.icon}</span>
              <span className="hidden sm:inline">{themeSource !== 'saved' ? '🎲 ' : ''}{t(current.nameKey as never)}</span>
            </button>
            <button data-testid="theme-shuffle" onClick={shuffleTheme} aria-label={t('theme.shuffle')} title={t('theme.shuffle')}
              className="w-[34px] h-[34px] border-[3px] border-ink rounded-[10px] bg-white text-base shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
              🎲
            </button>
            <button data-testid="theme-picker" onClick={() => setThemeOpen(o => !o)} aria-expanded={themeOpen} aria-label={t('theme.pick')} title={t('theme.pick')}
              className="hidden sm:flex w-[34px] h-[34px] items-center justify-center border-[3px] border-ink rounded-[10px] bg-white text-ink shadow-[2px_2px_0_var(--color-ink)] font-game text-[10px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
              ▾
            </button>
            {themeOpen && (
              <>
                <div className="fixed inset-0 z-[70]" onClick={() => setThemeOpen(false)} aria-hidden />
                <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-60 bg-parchment dark:bg-night border-[3px] border-ink rounded-2xl shadow-[5px_5px_0_var(--color-ink)] p-2" role="menu" aria-label={t('theme.pick')}>
                  {THEMES.map(th => (
                    <button key={th.id} data-testid={`theme-option-${th.id}`} role="menuitemradio" aria-checked={theme === th.id}
                      onClick={() => pick(th.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 font-game text-[11px] rounded-xl text-left ${theme === th.id ? 'bg-ochre text-ink' : 'text-ink dark:text-parchment hover:bg-ink/5'}`}>
                      <span>{th.icon} {t(th.nameKey as never)}</span>
                      {theme === th.id && <span aria-hidden>✓</span>}
                    </button>
                  ))}
                  <div className="border-t-2 border-ink/20 my-1" />
                  <button data-testid="theme-random-mode" role="menuitemradio" aria-checked={themeSource !== 'saved'}
                    onClick={() => { setRandomMode(); setThemeOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 font-game text-[11px] rounded-xl text-left ${themeSource !== 'saved' ? 'bg-ochre text-ink' : 'text-ink dark:text-parchment hover:bg-ink/5'}`}>
                    <span>{t('theme.randomMode')}</span>
                    {themeSource !== 'saved' && <span aria-hidden>✓</span>}
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={togglePro} aria-pressed={pro} aria-label={pro ? t('nav.gameMode') : t('nav.pro')}
            className={`font-game text-[10px] px-2 py-2 border-[3px] border-ink rounded-[10px] shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${pro ? 'bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink' : 'bg-gradient-to-b from-[#c084fc] to-[#8b5cf6] text-white'}`}>
            {pro ? t('nav.gameMode') : t('nav.pro')}
          </button>
          <div className="flex border-[3px] border-ink rounded-[10px] shadow-[2px_2px_0_var(--color-ink)] overflow-hidden" role="group" aria-label="Language">
            {(['id', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`font-game text-[10px] px-2 py-2 ${lang === l ? 'bg-terra text-white' : 'bg-white text-ink'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/game" className="btn-game btn-red hidden sm:inline-block" aria-label="Play mini dungeon">
            ⚔ {t('nav.game')}
          </Link>
          <button className="md:hidden border-[3px] border-ink rounded-[10px] bg-white px-2 py-1 shadow-[2px_2px_0_var(--color-ink)]"
            onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Menu">☰</button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t-[3px] border-ink bg-parchment dark:bg-nightdeep px-4 py-3 flex flex-col gap-3" aria-label="Menu seluler">
          {LINKS.map(l => (
            <button key={l.key} className={`font-game text-[13px] text-left ${active === l.hash ? 'text-terra' : ''}`}
              onClick={() => nav(l.hash)}>{active === l.hash ? '▶ ' : ''}{t(l.key as never)}</button>
          ))}
          <Link to="/game" className="font-game text-[13px] text-terra" onClick={() => setOpen(false)}>⚔ {t('nav.game')}</Link>
          <p className="font-game text-[11px] mt-1">{t('theme.pick')}</p>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map(th => (
              <button key={th.id} onClick={() => { setTheme(th.id); setOpen(false) }} aria-pressed={theme === th.id}
                className={`font-game text-[11px] px-2 py-2 border-[3px] border-ink rounded-[10px] text-left ${theme === th.id ? 'bg-ochre text-ink' : 'bg-white text-ink'}`}>
                {th.icon} {t(th.nameKey as never)}
              </button>
            ))}
            <button className="font-game text-[11px] px-2 py-2 border-[3px] border-ink rounded-[10px] bg-white text-ink text-left"
              onClick={() => { shuffleTheme(); setOpen(false) }}>🎲 {t('theme.shuffle')}</button>
            <button className="font-game text-[11px] px-2 py-2 border-[3px] border-ink rounded-[10px] bg-white text-ink text-left"
              onClick={() => { setRandomMode(); setOpen(false) }}>{t('theme.randomMode')}</button>
          </div>
          <button className="font-game text-[13px] text-left" onClick={toggleBgm}>♪ BGM: {bgmOn ? 'ON' : 'OFF'}</button>
          <button className="font-game text-[13px] text-left" onClick={toggleMuted}>{muted ? '🔇 UNMUTE SFX' : '🔊 MUTE SFX'}</button>
        </nav>
      )}
      <ScrollExp />
    </header>
  )
}

/** Tombol melayang: Spirit Guide (kontak cepat). Jalan pintas Mini Dungeon
 *  dihapus — game tetap bisa dibuka lewat menu ⚔ GAME di navbar. */
export function FloatingButtons() {
  const { t } = useApp()
  const { owner } = useContent()
  const [guide, setGuide] = useState(false)
  const { pathname } = useLocation()
  if (pathname === '/game') return null
  const wa = `https://wa.me/${owner.whatsapp}`
  return (
    <>
      <button onClick={() => { sfx.pickup(); setGuide(true) }} aria-label={t('guide.open')}
        className="fixed left-3 bottom-4 z-[60] w-14 h-14 rounded-full bg-gradient-to-b from-[#ff7a86] to-[#c81e32] text-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] text-2xl anim-floaty">
        🧚
        <span className="absolute -top-2 -right-2 bg-ochre text-ink font-game text-[9px] px-1 py-[3px] border-2 border-ink rounded-full">NEW</span>
      </button>
      {guide && (
        <div className="fixed inset-0 z-[70] bg-ink/60 flex items-center justify-center p-4" onClick={() => setGuide(false)}>
          <div className="dialog-rpg max-w-sm w-full p-5" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('guide.title')}>
            <p className="font-game text-[11px] mb-3">🧚 {t('guide.title')}</p>
            <div className="flex flex-col gap-2 font-extrabold">
              <a className="underline" href={wa} target="_blank" rel="noreferrer">💬 WhatsApp — {t('contact.chat')}</a>
              <a className="underline" href={`mailto:${owner.email}`}>✉️ {owner.email}</a>
              <a className="underline" href={owner.github} target="_blank" rel="noreferrer">🐙 GitHub — {t('contact.repos')}</a>
              <a className="underline" href={owner.linkedin} target="_blank" rel="noreferrer">💼 LinkedIn — {t('contact.follow')}</a>
            </div>
            <button className="btn-game btn-night mt-4" onClick={() => setGuide(false)}>{t('contact.close')}</button>
          </div>
        </div>
      )}
    </>
  )
}
