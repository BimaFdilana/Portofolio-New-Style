import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'
import { useContent } from '../lib/content'
import { useInView } from '../lib/useInView'
import { DialogBox, Hearts } from './ui'

/** Hero: panel karakter ber-parallax ringan (bergerak lebih lambat dari
 *  scroll) + awan yang melayang dengan kecepatan berbeda — memberi
 *  kedalaman tanpa gambar baru. Bar EXP terisi animasi saat terlihat.
 *  Tanpa reduced-motion: semua diam. */
export function Hero() {
  const { t, lang } = useApp()
  const { owner, projects, certificates } = useContent()
  const { ref: expRef, inView: expInView } = useInView<HTMLDivElement>()
  const asideWrapRef = useRef<HTMLDivElement>(null)
  const cloudRefs = useRef<(HTMLSpanElement | null)[]>([])
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return
    let raf = 0
    const update = () => {
      const y = window.scrollY
      if (asideWrapRef.current) {
        asideWrapRef.current.style.transform = `translateY(${Math.max(-40, -y * 0.05)}px)`
      }
      cloudRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `translateY(${y * (0.12 + i * 0.08)}px)`
      })
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [reduced])

  const clouds = [
    { top: '10%', left: '3%', size: 'text-4xl', opacity: 'opacity-60' },
    { top: '30%', left: '42%', size: 'text-3xl', opacity: 'opacity-40' },
    { top: '6%', left: '78%', size: 'text-5xl', opacity: 'opacity-50' },
  ]

  return (
    <section className="relative overflow-hidden max-w-6xl mx-auto px-3 sm:px-4 pt-8 sm:pt-10 pb-4 grid md:grid-cols-[1.15fr_.85fr] gap-8 items-start">
      {clouds.map((c, i) => (
        <span key={i} aria-hidden ref={el => { cloudRefs.current[i] = el }}
          className={`hero-cloud pointer-events-none absolute select-none ${c.size} ${c.opacity} will-change-transform`}
          style={{ top: c.top, left: c.left }}>☁️</span>
      ))}
      <div className="anim-fade-up">
        <span className="inline-block bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink border-[3px] border-ink rounded-full font-game text-[10px] sm:text-xs px-4 py-2 shadow-[3px_3px_0_var(--color-ink)]">
          {t('hero.badge')}
        </span>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.15] mt-5 text-ink dark:text-parchment"
          style={{ filter: 'drop-shadow(0 3px 0 rgba(30,37,71,.85))' }}>
          {t('hero.hi')}{' '}
          <span className="title-chunky" style={{ filter: 'none' }}>BIMA</span>
        </h1>
        <DialogBox text={t('hero.dialog')} className="mt-6 max-w-xl" />
        <div className="mt-6 flex items-center gap-4 flex-wrap">
          <Hearts n={5} />
        </div>
        <div className="mt-7 flex gap-3 flex-wrap">
          <a href="#projects" className="btn-game btn-red">{t('hero.viewProjects')}</a>
          <a href="#contact" className="btn-game btn-night">{t('hero.battleMe')}</a>
          <a href={owner.cvUrl} className="btn-game btn-blue" download>{t('hero.cv')}</a>
        </div>
        <p className="inline-flex mt-6 bg-parchment/95 dark:bg-night/95 border-[3px] border-ink rounded-full px-4 py-2 shadow-[3px_3px_0_var(--color-ink)] font-extrabold text-sm gap-4 flex-wrap">
          <a className="hover:text-terra" href={owner.github} target="_blank" rel="noreferrer">● GitHub</a>
          <a className="hover:text-terra" href={owner.linkedin} target="_blank" rel="noreferrer">● LinkedIn</a>
          <a className="hover:text-terra" href={owner.instagram} target="_blank" rel="noreferrer">● Instagram</a>
          <span className="sr-only">{lang === 'id' ? 'Tautan sosial' : 'Social links'}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3" aria-label={t('hero.stats.label')}>
          {[
            { v: owner.expYears, k: 'hero.stats.years' },
            { v: String(projects.length), k: 'hero.stats.projects' },
            { v: String(certificates.length), k: 'hero.stats.certs' },
            { v: '100', k: 'hero.stats.companies' },
          ].map(s => (
            <div key={s.k} className="bg-parchment/95 dark:bg-night/95 border-[3px] border-ink rounded-2xl px-4 py-3 shadow-[3px_3px_0_var(--color-ink)] text-center min-w-[104px] flex-1 sm:flex-none">
              <p className="font-display text-2xl leading-none">{s.v}</p>
              <p className="font-game text-[9px] mt-2 leading-relaxed">{t(s.k as never)}</p>
            </div>
          ))}
        </div>
      </div>

      <div ref={asideWrapRef} className="will-change-transform">
      <aside className="card-pixel p-4 anim-fade-up rotate-1" aria-label="Character panel">
        <div className="flex justify-between items-baseline">
          <p className="font-game text-[11px]">BIMA <span className="text-terra">HERO</span></p>
          <p className="font-game text-[10px] text-terra">HP {owner.hp}</p>
        </div>
        <div className="mt-3 h-[170px] border-[3px] border-ink rounded-2xl bg-gradient-to-br from-[#6ec1ff] via-[#8b5cf6] to-[#e93ec8] flex flex-col items-center justify-center text-parchment hero-avatar">
          <span className="font-display text-7xl" style={{ filter: 'drop-shadow(0 3px 0 rgba(30,37,71,.6))' }}>B</span>
          <span className="font-game text-[9px] mt-3 opacity-90">[ FOTO / AVATAR HERO DI SINI ]</span>
        </div>
        <div className="mt-3 text-sm font-bold space-y-2">
          <p>{t('hero.class')}: {owner.role} · Lv. {owner.level}</p>
          <div ref={expRef} className="bar-hero">
            <p className="mb-1">{t('hero.exp')} {owner.expYears} {t('hero.years')}</p>
            <div className="bar-seg"><i style={{ width: expInView ? '82%' : '0%', background: 'linear-gradient(180deg,#ffe066,#ffb800)' }} /></div>
          </div>
          <p>{t('hero.mastery')}: <b>{owner.mastery}</b> · {t('hero.weakness')}: <b>{owner.weakness}</b> · {t('hero.resistance')}: <b>{owner.resistance}</b></p>
          <p>
            <span className="chip !bg-ochre">LARAVEL</span>
            <span className="chip">REACT</span>
            <span className="chip">MYSQL</span>
          </p>
          <p className="text-xs opacity-70">📍 {owner.location} · <Link className="underline" to="/game">⚔ Mini Dungeon</Link></p>
        </div>
      </aside>
      </div>
    </section>
  )
}
