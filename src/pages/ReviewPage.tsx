import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../lib/store'
import { useContent } from '../lib/content'
import { API_BASE } from '../lib/db'
import { decodeCredential, initGoogleButton, loadGis, type GoogleUser } from '../lib/google'
import { Footer } from '../components/Sections'
import { Stars } from '../components/ui'
import { scrollToEl } from '../lib/smoothScroll'

/** Halaman ulasan publik per proyek: /review/:slug (alias /ulasan/:slug).
 *  Link ini dibagikan Bima ke pemberi ulasan. Alurnya:
 *  1. Pemberi ulasan masuk dengan akun Google-nya (Google Identity Services).
 *  2. Mengisi form singkat: bintang 1–5, peran (opsional), ulasan singkat
 *     (kinerja, jalannya aplikasi, saran & kritik, atau keluh kesah).
 *  3. Ulasan masuk sebagai testimoni TERSEMBUNYI — Bima menyetujuinya di
 *     /admin (menu Testimoni) sebelum tampil di halaman detail proyek.
 *  Login Google butuh VITE_GOOGLE_CLIENT_ID (Client ID OAuth Web dari
 *  Google Cloud Console, diisi di Environment Variables Vercel); tanpa itu
 *  halaman menampilkan pemberitahuan bahwa login belum diatur. */
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''

export function ReviewPage() {
  const { slug } = useParams()
  const { t, lang } = useApp()
  const { projects } = useContent()
  const p = projects.find(x => x.slug === slug)
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [phase, setPhase] = useState<'login' | 'form' | 'done'>('login')
  const [rating, setRating] = useState(5)
  const [role, setRole] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [gisError, setGisError] = useState('')
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollToEl(0, true) }, [slug])

  // Tombol Google resmi — hanya bila Client ID terisi.
  useEffect(() => {
    if (!CLIENT_ID || !p) return
    let alive = true
    loadGis()
      .then(() => {
        if (!alive || !btnRef.current) return
        initGoogleButton(btnRef.current, CLIENT_ID, (credential) => {
          const info = decodeCredential(credential)
          if (!info) { setGisError(t('review.errLogin')); return }
          setUser({ ...info, credential })
          setPhase('form')
        })
      })
      .catch(() => { if (alive) setGisError(t('review.errLogin')) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p])

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

  const submit = async () => {
    if (!user) return
    if (text.trim().length < 10) { setError(t('review.errText')); return }
    setError('')
    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_slug: p.slug, id_token: user.credential, rating, role: role.trim(), text: text.trim() }),
      })
      if (!res.ok) {
        if (res.status === 401) setError(t('review.errSession'))
        else if (res.status === 409) setError(t('review.errDuplicate'))
        else if (res.status === 503) setError(t('review.notConfigured'))
        else setError(t('review.errGeneric'))
        return
      }
      setPhase('done')
    } catch {
      setError(t('review.errGeneric'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-10">
        <div className="h-[120px] border-[3px] border-ink rounded-2xl relative shadow-[6px_6px_0_var(--color-ink)]" style={{ background: p.grad }}>
          <span className="absolute top-3 right-3 bg-gradient-to-b from-[#ffe066] to-[#ffb800] text-ink border-[3px] border-ink rounded-[10px] font-game text-[10px] px-2 py-[6px]">{p.hue}</span>
        </div>
        <div className="card-pixel p-5 sm:p-6 mt-6">
          <div className="flex flex-wrap justify-between gap-3 items-start">
            <div>
              <p className="font-game text-[10px] text-terra">✍️ {t('review.title')}</p>
              <h1 className="font-display text-2xl sm:text-3xl leading-tight title-chunky mt-1">{p.name.toUpperCase()}</h1>
            </div>
            <Stars n={p.difficulty} />
          </div>
          <p className="font-bold mt-2">{p.short[lang]}</p>

          {phase === 'login' && (
            <div className="mt-6">
              <p className="font-bold leading-relaxed text-sm">{t('review.loginBody')}</p>
              {!CLIENT_ID ? (
                <p className="dialog-rpg !shadow-none p-4 mt-4 font-bold text-sm">🔧 {t('review.notConfigured')}</p>
              ) : (
                <div className="mt-5 flex flex-col items-center gap-3">
                  <div ref={btnRef} />
                  {gisError && <p className="font-bold text-sm text-terra">{gisError}</p>}
                  <p className="text-xs font-bold text-ink/60 dark:text-white/60 text-center">{t('review.loginNote')}</p>
                </div>
              )}
            </div>
          )}

          {phase === 'form' && user && (
            <div className="mt-6 space-y-4">
              <div className="dialog-rpg !shadow-none p-3 flex items-center gap-3">
                {user.picture
                  ? <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover border-2 border-ink shrink-0" />
                  : <span className="w-11 h-11 rounded-full bg-steel text-white border-2 border-ink flex items-center justify-center font-game text-[11px] shrink-0">{user.name.slice(0, 1).toUpperCase()}</span>}
                <div className="min-w-0">
                  <p className="font-game text-[11px] leading-relaxed">{t('review.as')} {user.name}</p>
                  <p className="text-xs font-bold text-ink/60 dark:text-white/60 truncate">{user.email}</p>
                </div>
              </div>

              <div>
                <p className="font-game text-[11px] mb-2">{t('review.rating')}</p>
                <div className="flex gap-1" role="radiogroup" aria-label={t('review.rating')}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n}
                      onClick={() => setRating(n)} aria-label={`${n} / 5`}
                      className={`text-3xl leading-none transition-transform hover:scale-110 ${n <= rating ? 'text-ochre' : 'text-ink/25 dark:text-white/25'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-role" className="font-game text-[11px]">{t('review.role')}</label>
                <input id="review-role" value={role} maxLength={100}
                  onChange={e => setRole(e.target.value)} placeholder={t('review.rolePh')}
                  className="mt-2 w-full border-[3px] border-ink rounded-xl px-3 py-2 text-sm font-bold bg-white text-ink" />
              </div>

              <div>
                <label htmlFor="review-text" className="font-game text-[11px]">{t('review.text')}</label>
                <textarea id="review-text" value={text} maxLength={1000} rows={5}
                  onChange={e => setText(e.target.value)} placeholder={t('review.textPh')}
                  className="mt-2 w-full border-[3px] border-ink rounded-xl px-3 py-2 text-sm font-bold bg-white text-ink resize-y" />
                <div className="flex justify-between mt-1">
                  <p className="text-xs font-bold text-ink/60 dark:text-white/60">{t('review.textHint')}</p>
                  <p className="text-xs font-bold text-ink/60 dark:text-white/60 shrink-0">{text.length}/1000</p>
                </div>
              </div>

              {error && <p className="font-bold text-sm text-terra" role="alert">{error}</p>}
              <button className="btn-game btn-green w-full" onClick={submit} disabled={sending}>
                {sending ? t('review.sending') : t('review.submit')}
              </button>
              <p className="text-xs font-bold text-ink/60 dark:text-white/60 text-center">{t('review.moderationNote')}</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-6 text-center">
              <p className="text-5xl">🎉</p>
              <h2 className="font-display text-2xl mt-4">{t('review.doneTitle')}</h2>
              <p className="font-bold mt-2 leading-relaxed text-sm">{t('review.doneBody')}</p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link to={`/dungeon/${p.slug}`} className="btn-game btn-red">{t('review.backProject')}</Link>
                <Link to="/" className="btn-game btn-night">{t('review.backHome')}</Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
