import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useApp } from '../lib/store'
import { projects } from '../data/content'
import { Footer } from '../components/Sections'
import { Stars } from '../components/ui'

export function ProjectDetail() {
  const { slug } = useParams()
  const { t, lang } = useApp()
  const p = projects.find(x => x.slug === slug)
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (!p) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-6xl">🗺️</p>
          <h1 className="font-pixel text-xl mt-6">{t('detail.notfound')}</h1>
          <p className="font-bold mt-3">{t('detail.notfoundBody')}</p>
          <Link to="/" className="btn-pixel !bg-night mt-6">{t('detail.back')}</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-10">
        <Link to="/" className="font-pixel text-[10px] bg-parchment border-2 border-ink px-3 py-2 inline-block shadow-[3px_3px_0_rgba(43,33,24,.4)] dark:text-ink">
          {t('detail.back')}
        </Link>
        <div className="h-[240px] sm:h-[300px] border-[3px] border-ink mt-5 relative shadow-[6px_6px_0_var(--color-ink)]" style={{ background: p.grad }}>
          <span className="absolute bottom-3 left-3 bg-parchment/95 border-2 border-ink px-2 py-1 font-pixel text-[8px]">[ SCREENSHOT PROYEK ]</span>
          <span className="absolute top-3 right-3 bg-ochre border-2 border-ink font-pixel text-[9px] px-2 py-[6px]">{p.hue}</span>
        </div>
        <div className="card-pixel p-5 sm:p-6 mt-6">
          <div className="flex flex-wrap justify-between gap-3 items-start">
            <h1 className="font-pixel text-base sm:text-xl leading-relaxed">{p.name.toUpperCase()}</h1>
            <Stars n={p.difficulty} />
          </div>
          <p className="font-bold mt-2">{p.short[lang]}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {p.demo && <a className="btn-pixel !bg-terra" href={p.demo} target="_blank" rel="noreferrer">{t('detail.visit')}</a>}
            {p.repo && <a className="btn-pixel !bg-night" href={p.repo} target="_blank" rel="noreferrer">{t('detail.github')}</a>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm font-bold">
            <p className="dialog-rpg !shadow-none p-3">👤 {t('detail.role')}: {p.role[lang]}</p>
            <p className="dialog-rpg !shadow-none p-3">⏱️ {t('detail.duration')}: {p.duration[lang]}</p>
          </div>

          <h2 className="font-pixel text-xs mt-8 text-terra">{t('detail.about')}</h2>
          <p className="font-bold leading-relaxed mt-2">{p.short[lang]}</p>

          <h2 className="font-pixel text-xs mt-8 text-terra">{t('detail.loot')}</h2>
          <ul className="mt-2 space-y-2 font-bold">
            {p.features.map((f, i) => <li key={i}>⚔ {f[lang]}</li>)}
          </ul>

          <h2 className="font-pixel text-xs mt-8 text-terra">{t('detail.boss')}</h2>
          <div className="space-y-3 mt-2">
            {p.boss.map((b, i) => (
              <div key={i} className="dialog-rpg !shadow-none p-4">
                <p className="font-pixel text-[9px]">👹 {b.title[lang]}</p>
                <p className="font-bold text-sm mt-2 leading-relaxed">{b.body[lang]}</p>
              </div>
            ))}
          </div>

          <h2 className="font-pixel text-xs mt-8 text-terra">{t('detail.items')}</h2>
          <p className="mt-3">{p.stack.map(s => <span key={s} className="chip">{s}</span>)}</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
