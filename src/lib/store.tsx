import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { dict, type Lang, type MsgKey } from './i18n'
import { setMuted as audioSetMuted, isMuted, startBgm, stopBgm, sfx } from './audio'

interface AppState {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: MsgKey, vars?: Record<string, string>) => string
  dark: boolean
  toggleDark: () => void
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
function initialDark(): boolean {
  const saved = localStorage.getItem('theme')
  if (saved) return saved === 'dark'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [dark, setDark] = useState<boolean>(initialDark)
  const [muted, setMutedState] = useState<boolean>(isMuted())
  const [bgmOn, setBgmOn] = useState<boolean>(localStorage.getItem('bgm') !== '0')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => { setLangState(l) }, [])
  const toggleDark = useCallback(() => { setDark(d => !d) }, [])
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
      if (next) startBgm(); else stopBgm()
      return next
    })
  }, [])

  const t = useCallback((k: MsgKey, vars?: Record<string, string>) => {
    let s = dict[lang][k] ?? k
    if (vars) for (const [key, val] of Object.entries(vars)) s = s.replace(`{${key}}`, val)
    return s
  }, [lang])

  return (
    <Ctx.Provider value={{ lang, setLang, t, dark, toggleDark, muted, toggleMuted, bgmOn, toggleBgm }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}
