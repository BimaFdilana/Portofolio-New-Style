import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'
import { sfx } from '../lib/audio'
import { certificates, journey, owner, projects, skillCategories } from '../data/content'
import { DialogBox, SectionTitle, Stars, spawnConfetti } from './ui'

/* ---------------- INVENTORY (SKILLS) ---------------- */
export function Inventory() {
  const { t, lang } = useApp()
  return (
    <section id="skills" className="max-w-6xl mx-auto px-3 sm:px-4 py-14">
      <SectionTitle icon="🎒" a={t('skills.title.a')} b={t('skills.title.b')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {skillCategories.map((cat, ci) => (
          <div key={ci} className="card-pixel p-4">
            <p className="font-pixel text-[10px] leading-relaxed">{cat.icon} {cat.title[lang]}</p>
            <div className="mt-3 space-y-2">
              {cat.items.map((item, ii) => (
                <div key={ii}>
                  <div className="flex justify-between text-[13px] font-extrabold"><span>{item}</span><span>Lv {cat.levels[ii]}</span></div>
                  <div className="bar-seg mt-[3px]"><i style={{ width: `${cat.levels[ii]}%`, background: 'var(--color-sage)' }} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- DUNGEONS (PROJECTS) ---------------- */
const PER_PAGE = 9
export function Dungeons() {
  const { t, lang } = useApp()
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(projects.length / PER_PAGE))
  const shown = useMemo(() => projects.slice((page - 1) * PER_PAGE, page * PER_PAGE), [page])
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return (
    <section id="projects" className="max-w-6xl mx-auto px-3 sm:px-4 py-14">
      <SectionTitle icon="🏰" a={t('projects.title.a')} b={t('projects.title.b')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shown.map((p, i) => {
          const idx = (page - 1) * PER_PAGE + i
          return (
            <article key={p.slug} className="card-pixel overflow-hidden flex flex-col">
              <div className="h-[130px] border-b-[3px] border-ink relative" style={{ background: p.grad }}>
                <span className="absolute bottom-2 left-2 bg-parchment/95 border-2 border-ink px-2 py-[3px] font-pixel text-[7px]">[ SCREENSHOT PROYEK ]</span>
                <span className="absolute top-2 right-2 bg-ink/70 text-parchment font-pixel text-[8px] px-2 py-1">{p.hue}</span>
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="font-pixel text-[11px] leading-relaxed">DUNGEON {ROMAN[idx]} — {p.name.toUpperCase()}</h3>
                <Stars n={p.difficulty} />
                <DialogBox text={p.short[lang]} className="!p-3 text-[13px]" />
                <div className="mt-auto pt-2 flex gap-2">
                  <Link to={`/dungeon/${p.slug}`} className="btn-pixel !bg-night">{t('projects.detail')}</Link>
                  {p.demo && <a href={p.demo} target="_blank" rel="noreferrer" className="btn-pixel !bg-terra">{t('projects.visit')}</a>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button className="btn-pixel !bg-ochre !text-ink" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>◀</button>
          <span className="font-pixel text-xs bg-parchment border-2 border-ink px-3 py-2 dark:text-ink">{page} / {pages}</span>
          <button className="btn-pixel !bg-ochre !text-ink" disabled={page === pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>▶</button>
        </div>
      )}
    </section>
  )
}

/* ---------------- HALL OF RELICS (CERTIFICATES) ---------------- */
export function Relics() {
  const { t, lang } = useApp()
  const [view, setView] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const cert = view !== null ? certificates[view] : null
  return (
    <section id="certs" className="max-w-6xl mx-auto px-3 sm:px-4 py-14">
      <SectionTitle icon="🏆" a={t('certs.title.a')} b={t('certs.title.b')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((c, i) => (
          <button key={i} onClick={() => { sfx.pickup(); setView(i); setPage(1) }}
            className="card-pixel p-4 text-left hover:-translate-y-1 transition-transform">
            <div className="h-[110px] bg-gradient-to-br from-[#e9dfc8] to-[#d8c9a3] dark:from-[#3c5a78] dark:to-[#2e3d4e] border-[3px] border-ink flex items-center justify-center text-4xl">🏅</div>
            <p className="font-extrabold mt-3 leading-snug">{c.title[lang]}</p>
            <p className="text-[13px] opacity-80">{c.issuer} · {c.year} · {c.pages} {t('certs.pages')}</p>
          </button>
        ))}
      </div>
      {cert && (
        <div className="fixed inset-0 z-[70] bg-ink/70 flex items-center justify-center p-4" onClick={() => setView(null)}>
          <div className="card-pixel max-w-lg w-full p-5" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="h-[260px] bg-gradient-to-br from-[#e9dfc8] to-[#d8c9a3] dark:from-[#3c5a78] dark:to-[#2e3d4e] border-[3px] border-ink flex flex-col items-center justify-center gap-2">
              <span className="text-6xl">🏅</span>
              <span className="font-pixel text-[8px]">[ {t('certs.pages')} {page} / {cert.pages} ]</span>
            </div>
            <p className="font-extrabold mt-3">{cert.title[lang]}</p>
            <p className="text-sm opacity-80">{cert.issuer} · {cert.year}</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {cert.pages > 1 && (
                <>
                  <button className="btn-pixel !bg-ochre !text-ink" disabled={page === 1} onClick={() => setPage(p => p - 1)}>◀</button>
                  <button className="btn-pixel !bg-ochre !text-ink" disabled={page === cert.pages} onClick={() => setPage(p => p + 1)}>▶</button>
                </>
              )}
              <button className="btn-pixel !bg-night" onClick={() => setView(null)}>{t('contact.close')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ---------------- ADVENTURE LOG (JOURNEY) ---------------- */
export function AdventureLog() {
  const { t, lang } = useApp()
  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-4 py-14">
      <SectionTitle icon="📜" a={t('journey.title.a')} b={t('journey.title.b')} />
      <div className="max-w-3xl mx-auto space-y-5">
        {journey.map((j, i) => (
          <div key={i} className="dialog-rpg p-5 flex gap-4 items-start">
            <span className="text-3xl shrink-0">{j.active ? '🚩' : '✔️'}</span>
            <div>
              <p className="font-pixel text-[9px] text-terra">{j.period}{j.active ? ` · ${t('journey.active')}` : ''}</p>
              <p className="font-extrabold mt-1">{j.title[lang]}</p>
              <p className="text-sm mt-1 leading-relaxed">{j.body[lang]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- FINAL QUEST (CONTACT) + FOOTER ---------------- */
export function FinalQuest() {
  const { t } = useApp()
  const [sent, setSent] = useState<string | null>(null)
  const cards = [
    { icon: '💬', label: 'WhatsApp', note: 'Chat langsung', href: `https://wa.me/${owner.whatsapp}`, cta: t('contact.chat'), bg: '!bg-sage' },
    { icon: '📸', label: 'Instagram', note: '@ Akun Instagram', href: owner.instagram, cta: t('contact.follow'), bg: '!bg-terra' },
    { icon: '🐙', label: 'GitHub', note: 'BimaFdilana', href: owner.github, cta: t('contact.repos'), bg: '!bg-night' },
    { icon: '💼', label: 'LinkedIn', note: 'Profil profesional', href: owner.linkedin, cta: t('contact.follow'), bg: '!bg-steel' },
  ]
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const email = String(fd.get('email') || '')
    const msg = String(fd.get('message') || '')
    // v1 tanpa backend: kirim via klien email pengunjung (lihat README untuk EmailJS).
    window.location.href = `mailto:${owner.email}?subject=${encodeURIComponent(`[QUEST] dari ${name}`)}&body=${encodeURIComponent(`${msg}\n\n— ${name} (${email})`)}`
    sfx.fanfare(); spawnConfetti(70)
    setSent(name)
    e.currentTarget.reset()
  }
  return (
    <section id="contact" className="max-w-6xl mx-auto px-3 sm:px-4 py-14">
      <SectionTitle icon="⚔️" a={t('contact.title.a')} b={t('contact.title.b')} />
      <p className="text-center font-extrabold -mt-4 mb-8 bg-parchment/90 dark:bg-night/80 dark:text-parchment inline-block relative left-1/2 -translate-x-1/2 px-4 py-1 border-2 border-ink">{t('contact.lead')}</p>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <a key={i} href={c.href} target="_blank" rel="noreferrer"
              className={`btn-pixel ${c.bg} !p-4 !text-left block`}>
              <span className="text-2xl block">{c.icon}</span>
              <span className="block mt-2">{c.label}</span>
              <span className="block font-sans font-bold text-[12px] mt-1 normal-case">{c.note}</span>
              <span className="block font-sans font-bold text-[11px] mt-2 underline">{c.cta}</span>
            </a>
          ))}
        </div>
        <form onSubmit={submit} className="dialog-rpg p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-pixel text-[9px]">{t('contact.name')}</span>
              <input required name="name" placeholder={t('contact.namePh')}
                className="mt-2 w-full border-[3px] border-ink p-[10px] font-bold bg-white text-ink" />
            </label>
            <label className="block">
              <span className="font-pixel text-[9px]">{t('contact.email')}</span>
              <input required type="email" name="email" placeholder={t('contact.emailPh')}
                className="mt-2 w-full border-[3px] border-ink p-[10px] font-bold bg-white text-ink" />
            </label>
          </div>
          <label className="block">
            <span className="font-pixel text-[9px]">{t('contact.message')}</span>
            <textarea required name="message" rows={4} placeholder={t('contact.msgPh')}
              className="mt-2 w-full border-[3px] border-ink p-[10px] font-bold bg-white text-ink" />
          </label>
          <button type="submit" className="btn-pixel !bg-terra w-full sm:w-auto">{t('contact.submit')}</button>
        </form>
      </div>
      {sent !== null && (
        <div className="fixed inset-0 z-[70] bg-ink/70 flex items-center justify-center p-4" onClick={() => setSent(null)}>
          <div className="dialog-rpg max-w-md w-full p-6 text-center" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <p className="text-5xl">⚔️</p>
            <p className="font-pixel text-sm mt-3">{t('contact.sent')}</p>
            <p className="font-bold mt-3 leading-relaxed">{t('contact.sentBody', { name: sent || 'Hero' })}</p>
            <button className="btn-pixel !bg-night mt-5" onClick={() => setSent(null)}>{t('contact.close')}</button>
          </div>
        </div>
      )}
    </section>
  )
}

export function Footer() {
  const { t } = useApp()
  return (
    <footer className="bg-dirtdeep text-parchment border-t-[3px] border-ink mt-6">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <p className="font-pixel text-[10px]">© 2026 {owner.brand} {owner.role.toUpperCase()}</p>
        <nav className="flex gap-5 font-pixel text-[9px]" aria-label="Footer">
          <a className="hover:text-ochre" href="#skills">INVENTORY</a>
          <a className="hover:text-ochre" href="#projects">DUNGEONS</a>
          <a className="hover:text-ochre" href="#certs">RELICS</a>
          <a className="hover:text-ochre" href="#contact">QUEST</a>
        </nav>
        <button className="font-pixel text-[9px] underline" onClick={() => { sfx.back(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          ↑ {t('footer.made')}
        </button>
      </div>
    </footer>
  )
}
