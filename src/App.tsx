import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store'
import { sfx, startBgm } from './lib/audio'
import { LoadingScreen, StartScreen } from './components/Boot'
import { FloatingButtons, Navbar } from './components/Navbar'
import { spawnConfetti } from './components/ui'
import { Home } from './pages/Home'
import { ProjectDetail } from './pages/ProjectDetail'

const MiniDungeon = lazy(() => import('./pages/MiniDungeon').then(m => ({ default: m.MiniDungeon })))

type BootPhase = 'start' | 'loading' | 'site'

function Site() {
  const { t, bgmOn } = useApp()
  const [phase, setPhase] = useState<BootPhase>(() => (sessionStorage.getItem('booted') === '1' ? 'site' : 'start'))
  const [toast, setToast] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  // SFX klik global: setiap klik menu/tombol berbunyi (syarat pemilik).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('a,button,input,textarea,select,[role="button"]')) sfx.click()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Easter egg: ketik "coin"
  useEffect(() => {
    let buf = ''
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      buf = (buf + e.key.toLowerCase()).slice(-4)
      if (buf === 'coin') {
        sfx.coin(); spawnConfetti(90); setToast(true)
        setTimeout(() => setToast(false), 3600)
        buf = ''
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const start = useCallback(() => { sfx.fanfare(); setPhase('loading') }, [])
  const loaded = useCallback(() => {
    sessionStorage.setItem('booted', '1')
    setPhase('site')
    if (bgmOn) startBgm()
  }, [bgmOn])

  if (phase === 'start') return <StartScreen onStart={start} />
  if (phase === 'loading') return <LoadingScreen done={loaded} />

  return (
    <div className="min-h-screen bg-world bg-cream dark:bg-nightdeep">
      <Navbar />
      <Suspense fallback={<div className="p-16 text-center font-pixel text-xs">LOADING…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dungeon/:slug" element={<ProjectDetail />} />
          <Route path="/game" element={<MiniDungeon />} />
          <Route path="*" element={
            <main className="max-w-xl mx-auto px-4 py-24 text-center">
              <p className="text-6xl">🗺️</p>
              <h1 className="font-pixel text-lg mt-6">404 — {t('detail.notfound')}</h1>
              <p className="font-bold mt-3">{t('detail.notfoundBody')}</p>
              <Link to="/" className="btn-pixel !bg-night mt-6">← HOME</Link>
            </main>
          } />
        </Routes>
      </Suspense>
      <FloatingButtons />
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[85] dialog-rpg px-5 py-3 font-pixel text-[10px]" role="status">
          🪙 {t('egg.found')}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Site />
    </AppProvider>
  )
}
