import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { dict, type Lang, type MsgKey } from './i18n'
import { setMuted as audioSetMuted, isMuted, startBgm, stopBgm, restartBgm, sfx } from './audio'
import { THEME_POOL, applyThemeToDocument, isValidTheme, migrateTheme, pickRandomTheme, type ThemeId } from './themes'

/** Dari mana tema aktif berasal: 'saved' = pilihan eksplisit pengunjung
 *  (localStorage, selalu menang), 'session' = hasil acak sesi ini yang
 *  bertahan saat reload, 'random' = baru diundi saat kunjungan ini. */
export type ThemeSource = 'saved' | 'session' | 'random'

interface AppState {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: MsgKey, vars?: Record<string, string>) => string
  theme: ThemeId
  themeSource: ThemeSource
  setTheme: (id: ThemeId) => void
  cycleTheme: () => void
  shuffleTheme: () => void
  /** Kembali ke acak: hapus pilihan tersimpan, undi tema baru untuk sesi ini. */
  setRandomMode: () => void
  /** Mode PRO: tampilan bersih (tanpa langit pixel, judul solid, tombol
   *  datar) untuk klien korporat — kelas .pro di <html>, di atas tema apa pun. */
  pro: boolean
  togglePro: () => void
  muted: boolean
  toggleMuted: () => void
  bgmOn: boolean
  toggleBgm: () => void
}

const Ctx = createContext<AppState | null>(null)

function initialLang(): Lang {
  const saved = localStorage.getItem('lang')
  if (saved === 'id' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'id' // default Bahasa Indonesia
}

/** Tema awal: head script di index.html sudah memilih & menerapkan tema
 *  sebelum paint — store tinggal membaca hasilnya (tanpa mengundi ulang).
 *  Klasifikasi sumber: cocok dengan localStorage → 'saved', cocok dengan
 *  sessionStorage → 'session', sisanya undian baru sesi ini → 'random'. */
function initialTheme(): { id: ThemeId; source: ThemeSource } {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr && isValidTheme(attr)) {
    const saved = migrateTheme(localStorage.getItem('theme'))
    if (saved === attr) return { id: attr, source: 'saved' }
    const sess = sessionStorage.getItem('theme-session')
    if (sess === attr) return { id: attr, source: 'session' }
    return { id: attr, source: 'random' }
  }
  // Cadangan bila head script belum jalan (tidak seharusnya terjadi):
  const saved = migrateTheme(localStorage.getItem('theme'))
  if (saved) return { id: saved, source: 'saved' }
  const sess = sessionStorage.getItem('theme-session')
  if (sess && isValidTheme(sess)) return { id: sess, source: 'session' }
  const id = pickRandomTheme()
  sessionStorage.setItem('theme-session', id)
  return { id, source: 'random' }
}

function initialPro(): boolean {
  return localStorage.getItem('mode') === 'pro'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [themeState, setThemeState] = useState<{ id: ThemeId; source: ThemeSource }>(initialTheme)
  const [pro, setPro] = useState<boolean>(initialPro)
  const [muted, setMutedState] = useState<boolean>(isMuted())
  const [bgmOn, setBgmOn] = useState<boolean>(localStorage.getItem('bgm') !== '0')
  const themeRef = useRef<ThemeId>(themeState.id)

  useEffect(() => {
    themeRef.current = themeState.id
    applyThemeToDocument(themeState.id)
    if (themeState.source === 'saved') localStorage.setItem('theme', themeState.id)
    if (themeState.source === 'random') sessionStorage.setItem('theme-session', themeState.id)
    // BGM ikut ganti varian bila sedang jalan; restartBgm diam bila BGM mati.
    if (bgmOn) restartBgm(themeState.id)
  }, [themeState, bgmOn])

  useEffect(() => {
    document.documentElement.classList.toggle('pro', pro)
    localStorage.setItem('mode', pro ? 'pro' : 'game')
  }, [pro])

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => { setLangState(l) }, [])
  const setTheme = useCallback((id: ThemeId) => { setThemeState({ id, source: 'saved' }) }, [])
  const cycleTheme = useCallback(() => {
    setThemeState(prev => {
      const i = THEME_POOL.indexOf(prev.id)
      return { id: THEME_POOL[(i + 1) % THEME_POOL.length], source: 'saved' }
    })
  }, [])
  const shuffleTheme = useCallback(() => {
    setThemeState(prev => ({ id: pickRandomTheme(prev.id), source: 'saved' }))
  }, [])
  const setRandomMode = useCallback(() => {
    localStorage.removeItem('theme')
    setThemeState(prev => ({ id: pickRandomTheme(prev.id), source: 'random' }))
  }, [])
  const togglePro = useCallback(() => { setPro(p => !p) }, [])
  const toggleMuted = useCallback(() => {
    setMutedState(m => {
      const next = !m
      audioSetMuted(next)
      if (!next) sfx.coin()
      return next
    })
  }, [])
  const toggleBgm = useCallback(() => {
    setBgmOn(on => {
      const next = !on
      localStorage.setItem('bgm', next ? '1' : '0')
      if (next) startBgm(themeRef.current); else stopBgm()
      return next
    })
  }, [])

  const t = useCallback((k: MsgKey, vars?: Record<string, string>) => {
    let s = dict[lang][k] ?? k
    if (vars) for (const [key, val] of Object.entries(vars)) s = s.replace(`{${key}}`, val)
    return s
  }, [lang])

  return (
    <Ctx.Provider value={{
      lang, setLang, t,
      theme: themeState.id, themeSource: themeState.source,
      setTheme, cycleTheme, shuffleTheme, setRandomMode,
      pro, togglePro, muted, toggleMuted, bgmOn, toggleBgm,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}
