import { Link, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { useContent } from '../lib/content'
import { Footer } from '../components/Sections'
import { Stars } from '../components/ui'
import type { Testimonial } from '../data/content'

/** Foto pemberi ulasan — gambar bila ada, kalau tidak lingkaran inisial nama. */
const AVATAR_COLORS = [
  ['#2fae1e', '#fff8e7'],
  ['#ef3546', '#fff8e7'],
  ['#e8a100', '#1e2547'],
  ['#2f9bff', '#fff8e7'],
  ['#e93ec8', '#fff8e7'],
] as const
function Avatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) {
    return <img src={photo} alt={`Foto ${name}`} className="w-12 h-12 rounded-full object-cover border-2 border-ink shrink-0 shadow-[2px_2px_0_var(--color-ink)]" />
  }
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  const [bg, fg] = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  return (
    <span aria-hidden className="w-12 h-12 rounded-full border-2 border-ink shrink-0 shadow-[2px_2px_0_var(--color-ink)] flex items-center justify-center font-game text-[11px]" style={{ background: bg, color: fg }}>
      {initials}
    </span>
  )
}

/** Slider horizontal ulasan — kartu berdampingan, digeser (bukan ditumpuk ke bawah). */
function TestimonialsSlider({ items, lang }: { items: Testimonial[]; lang: 'id' | 'en' }) {
  const { t } = useApp()
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const updateEnds = () => {
    const el = trackRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }
  useEffect(() => {
    updateEnds()
    window.addEventListener('resize', updateEnds)
    return () => window.removeEventListener('resize', updateEnds)
  }, [])
  const slide = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(':scope > *')
    const step = (card ? card.offsetWidth + 16 : 320)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }
  const arrowCls = (disabled: boolean) =>
    `font-game text-[10px] border-[3px] border-ink rounded-[10px] px-2 py-[6px] shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
      disabled ? 'bg-white/60 text-ink/30 dark:bg-night dark:text-white/30' : 'bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink'
    }`
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-game text-sm text-terra">{t('detail.testimonials')}</h2>
        <div className="flex gap-2 shrink-0">
          <button className={arrowCls(atStart)} disabled={atStart} onClick={() => slide(-1)} aria-label={t('detail.testiPrev')}>◀</button>
          <button className={arrowCls(atEnd)} disabled={atEnd} onClick={() => slide(1)} aria-label={t('detail.testiNext')}>▶</button>
        </div>
      </div>
      <p className="text-xs font-bold text-ink/60 dark:text-white/60 mt-1">{t('detail.testimonialsHint')}</p>
      <div
        ref={trackRef}
        onScroll={updateEnds}
        className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory mt-3 pb-2 -mx-1 px-1"
        role="region"
        aria-label={t('detail.testimonials')}
      >
        {items.map((item, i) => (
          <figure key={i} className="dialog-rpg !shadow-none p-4 snap-start shrink-0 w-[78vw] max-w-[320px] sm:w-[320px] flex flex-col">
            <div className="flex items-center gap-3">
              <Avatar name={item.name} photo={item.photo} />
              <figcaption className="min-w-0">
                <p className="font-game text-[10px] leading-relaxed">{item.name}</p>
                <p className="text-xs font-bold text-ink/60 dark:text-white/60 mt-1">{item.role}</p>
              </figcaption>
            </div>
            <span className="text-ochre tracking-[2px] mt-3" aria-label={`rating ${item.rating}/5`}>
              {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
            </span>
            <blockquote className="font-bold text-sm leading-relaxed mt-2 flex-1">“{item.text[lang]}”</blockquote>
          </figure>
        ))}
      </div>
    </div>
  )
}

export function ProjectDetail() {
  const { slug } = useParams()
  const { t, lang } = useApp()
  const { projects } = useContent()
  const p = projects.find(x => x.slug === slug)
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (!p) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-6xl">🗺️</p>
          <h1 className="font-display text-2xl mt-6">{t('detail.notfound')}</h1>
          <p className="font-bold mt-3">{t('detail.notfoundBody')}</p>
          <Link to="/" className="btn-game btn-night mt-6">{t('detail.back')}</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-10">
        <Link to="/" className="font-game text-[11px] bg-parchment border-[3px] border-ink rounded-[10px] px-3 py-2 inline-block shadow-[3px_3px_0_var(--color-ink)] dark:text-ink">
          {t('detail.back')}
        </Link>
        <div className="h-[240px] sm:h-[300px] border-[3px] border-ink rounded-2xl mt-5 relative shadow-[6px_6px_0_var(--color-ink)]" style={{ background: p.grad }}>
          <span className="absolute bottom-3 left-3 bg-parchment/95 border-[3px] border-ink rounded-[8px] px-2 py-1 font-game text-[9px]">[ SCREENSHOT PROYEK ]</span>
          <span className="absolute top-3 right-3 bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink border-[3px] border-ink rounded-[10px] font-game text-[10px] px-2 py-[6px]">{p.hue}</span>
        </div>
        <div className="card-pixel p-5 sm:p-6 mt-6">
          <div className="flex flex-wrap justify-between gap-3 items-start">
            <h1 className="font-display text-2xl sm:text-4xl leading-tight title-chunky">{p.name.toUpperCase()}</h1>
            <Stars n={p.difficulty} />
          </div>
          <p className="font-bold mt-2">{p.short[lang]}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {p.demo && <a className="btn-game btn-red" href={p.demo} target="_blank" rel="noreferrer">{t('detail.visit')}</a>}
            {p.repo && <a className="btn-game btn-night" href={p.repo} target="_blank" rel="noreferrer">{t('detail.github')}</a>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm font-bold">
            <p className="dialog-rpg !shadow-none p-3">👤 {t('detail.role')}: {p.role[lang]}</p>
            <p className="dialog-rpg !shadow-none p-3">⏱️ {t('detail.duration')}: {p.duration[lang]}</p>
          </div>

          <h2 className="font-game text-sm mt-8 text-terra">{t('detail.about')}</h2>
          <p className="font-bold leading-relaxed mt-2">{p.short[lang]}</p>

          <h2 className="font-game text-sm mt-8 text-terra">{t('detail.loot')}</h2>
          <ul className="mt-2 space-y-2 font-bold">
            {p.features.map((f, i) => <li key={i}>⚔ {f[lang]}</li>)}
          </ul>

          <h2 className="font-game text-sm mt-8 text-terra">{t('detail.boss')}</h2>
          <div className="space-y-3 mt-2">
            {p.boss.map((b, i) => (
              <div key={i} className="dialog-rpg !shadow-none p-4">
                <p className="font-game text-[9px]">👹 {b.title[lang]}</p>
                <p className="font-bold text-sm mt-2 leading-relaxed">{b.body[lang]}</p>
              </div>
            ))}
          </div>

          <h2 className="font-game text-sm mt-8 text-terra">{t('detail.items')}</h2>
          <p className="mt-3">{p.stack.map(s => <span key={s} className="chip">{s}</span>)}</p>

          {(p.testimonials?.length ?? 0) > 0 && (
            <div className="mt-8">
              <TestimonialsSlider items={p.testimonials ?? []} lang={lang} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
