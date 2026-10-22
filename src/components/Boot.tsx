import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { sfx } from '../lib/audio'
import { owner } from '../data/content'

export function StartScreen({ onStart }: { onStart: () => void }) {
  const { t } = useApp()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStart() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])
  return (
    <div className="fixed inset-0 z-[80] bg-world flex flex-col items-center justify-start pt-[7vh] cursor-pointer select-none"
      onClick={onStart} role="button" aria-label="Press start">
      <p className="font-pixel text-[10px] sm:text-xs text-parchment" style={{ textShadow: '2px 2px 0 rgba(43,33,24,.5)' }}>
        © 2026 {t('boot.copyright')}
      </p>
      <h1 className="font-pixel text-5xl sm:text-7xl text-parchment mt-4" style={{ textShadow: '5px 5px 0 rgba(43,33,24,.5)' }}>
        {owner.brand.replace('.', '')}<span className="text-[#a9bc8e]">.</span>
      </h1>
      <div className="mt-6 inline-block bg-night/50 border-[3px] border-parchment/90 px-6 sm:px-10 py-4 text-center">
        <p className="font-pixel text-[10px] sm:text-xs text-parchment" style={{ textShadow: '2px 2px 0 rgba(43,33,24,.45)' }}>
          — {t('boot.tagline')} —
        </p>
        <div className="mt-4 flex justify-center gap-[6px]" aria-hidden>
          {['#b5533c', '#b5533c', '#c9a227', '#c9a227', '#55606e', '#55606e', '#55606e'].map((c, i) => (
            <span key={i} className="inline-block w-4 h-4 border-2 border-ink" style={{ background: c }} />
          ))}
        </div>
        <p className="font-pixel text-sm sm:text-base text-white mt-5 anim-blink" style={{ textShadow: '2.5px 2.5px 0 rgba(43,33,24,.55)' }}>
          {t('boot.press')}
        </p>
        <p className="mt-3 text-[13px] font-bold text-parchment" style={{ textShadow: '1.5px 1.5px 0 rgba(43,33,24,.5)' }}>{t('boot.hint')}</p>
        <p className="mt-1 text-[12px] font-bold text-[#ede3cb]" style={{ textShadow: '1.5px 1.5px 0 rgba(43,33,24,.5)' }}>{t('boot.secret')}</p>
      </div>
    </div>
  )
}

const ASSET_STEPS = ['WORLD', 'INVENTORY', 'DUNGEONS', 'RELICS']

export function LoadingScreen({ done }: { done: () => void }) {
  const { t } = useApp()
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const iv = window.setInterval(() => {
      const elapsed = performance.now() - start
      const p = Math.min(96, Math.round((elapsed / 1500) * 100))
      setPct(p)
    }, 60)
    const to = window.setTimeout(() => { setPct(100); sfx.door(); setTimeout(done, 260) }, 1650)
    return () => { clearInterval(iv); clearTimeout(to) }
  }, [done])
  const step = ASSET_STEPS[Math.min(ASSET_STEPS.length - 1, Math.floor(pct / 30))]
  return (
    <div className="fixed inset-0 z-[80] bg-world flex items-start justify-center pt-[9vh]">
      <div className="bg-parchment/[.97] border-[3px] border-ink shadow-[6px_6px_0_rgba(43,33,24,.4)] px-8 sm:px-12 py-8 text-center max-w-[92vw]">
        <p className="font-pixel text-base sm:text-xl">
          FULL STACK <span className="text-terra">DEVELOPER</span>
        </p>
        <p className="font-pixel text-base sm:text-xl text-sage mt-2">{owner.brand}</p>
        <div className="text-[44px] leading-none mt-4 anim-floaty inline-block" aria-hidden>♜</div>
        <p className="font-pixel text-[9px] sm:text-[10px] mt-3 text-[#6b5b3e]">{t('boot.loading')}</p>
        <div className="w-[min(430px,70vw)] mx-auto mt-5">
          <div className="flex items-center gap-2">
            <span className="text-ochre" aria-hidden>⚔</span>
            <div className="bar-seg flex-1 !h-[18px]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${pct}%`, background: '#c9a227' }} />
            </div>
            <span className="font-pixel text-[10px]">{pct}%</span>
          </div>
          <p className="font-pixel text-[8px] text-left mt-2 text-[#8a7f63]">{t('boot.assets')}: {step}</p>
        </div>
      </div>
    </div>
  )
}
