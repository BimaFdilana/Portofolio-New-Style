import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { useContent } from '../lib/content'
import { THEMES, type ThemeId } from '../lib/themes'
import { typeTick } from '../lib/audio'

/** Konsol Terminal/CLI — pengalaman CLI penuh, bukan sekadar warna gelap.
 *  Hanya dirender saat tema Terminal aktif (lihat Home). Jendela perintah
 *  sungguhan: prompt $, kursor blok berkedip, perintah bisa diketik:
 *  help, whoami, projects/ls, skills, contact, cv, theme, clear, echo,
 *  date, sudo, exit. Suara ketikan: satu tick pendek per tombol, hanya
 *  sebagai respons langsung atas ketikan pengguna dan patuh mute global
 *  (typeTick memakai tone(), yang diam bila muted). */
type Line = { text: string; kind: 'cmd' | 'out' | 'err' }

export function TerminalConsole() {
  const { t, lang, setTheme } = useApp()
  const { owner, projects, skills } = useContent()
  const tRef = useRef(t)
  tRef.current = t
  const [lines, setLines] = useState<Line[]>(() => [
    { text: t('term.welcome1'), kind: 'out' },
  ])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = outRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const push = (ls: Line[]) => setLines(prev => [...prev, ...ls])
  const out = (text: string, kind: Line['kind'] = 'out') => ({ text, kind })

  const run = (raw: string) => {
    const cmdLine = raw.trim()
    const [cmd, ...args] = cmdLine.toLowerCase().split(/\s+/).filter(Boolean)
    const echo: Line = { text: cmdLine, kind: 'cmd' }
    if (!cmd) { push([echo]); return }
    switch (cmd) {
      case 'help':
        push([echo, out(t('term.helpTitle')),
          out('  help           — ' + t('term.helpHelp')),
          out('  whoami         — ' + t('term.helpWhoami')),
          out('  projects | ls  — ' + t('term.helpProjects')),
          out('  skills         — ' + t('term.helpSkills')),
          out('  contact        — ' + t('term.helpContact')),
          out('  cv             — ' + t('term.helpCv')),
          out('  theme [nama]   — ' + t('term.helpTheme')),
          out('  clear          — ' + t('term.helpClear')),
          out('  echo <teks>'),
          out('  date'),
          out('  sudo'),
          out('  exit'),
        ])
        break
      case 'whoami':
        push([echo,
          out(`${owner.name} — ${owner.role}`),
          out(`${t('term.whoamiLevel')}: ${owner.level}  ·  ${t('term.whoamiExp')}: ${owner.expYears}`),
          out(`${t('term.whoamiLoc')}: ${owner.location}`),
        ])
        break
      case 'projects':
      case 'ls':
        push([echo, out(t('term.projectsTitle')),
          ...projects.map(p => out(`  ${p.name}  ${'★'.repeat(p.difficulty)}${'☆'.repeat(3 - p.difficulty)} — ${p.short[lang]}`)),
        ])
        break
      case 'skills':
        push([echo, out(t('term.skillsTitle')),
          ...skills.flatMap(cat => [
            out(`  ${cat.title[lang]}:`),
            ...cat.items.map((it, i) => out(`    ${it} — ${cat.levels[i]}%`)),
          ]),
        ])
        break
      case 'contact':
        push([echo,
          out(`${t('term.contactWa')}: https://wa.me/${owner.whatsapp}`),
          out(`${t('term.contactEmail')}: ${owner.email}`),
          out(`${t('term.contactGithub')}: ${owner.github}`),
        ])
        break
      case 'cv':
        push([echo, out(`${t('term.cvLine')} ${owner.cvUrl}`)])
        break
      case 'theme': {
        const name = args[0]
        if (!name) {
          push([echo, out(t('term.themeList')), ...THEMES.map(x => out(`  ${x.id}`))])
        } else {
          const found = THEMES.find(x => x.id === name) as { id: ThemeId } | undefined
          if (found) {
            setTheme(found.id)
            push([echo, out(`${t('term.themeOk')} ${found.id}`)])
          } else {
            push([echo, out(`${t('term.themeBad')} ${THEMES.map(x => x.id).join(', ')}`, 'err')])
          }
        }
        break
      }
      case 'clear':
        setLines([])
        break
      case 'echo':
        push([echo, out(args.join(' ') || '')])
        break
      case 'date':
        push([echo, out(new Date().toLocaleString(lang === 'id' ? 'id-ID' : 'en-US'))])
        break
      case 'sudo':
        push([echo, out(t('term.sudo'))])
        break
      case 'exit':
        push([echo, out(t('term.exit'))])
        break
      default:
        push([echo, out(`bash: ${cmd}: ${t('term.notFound')}`, 'err')])
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const v = value
      setHistory(h => (v.trim() ? [v, ...h].slice(0, 50) : h))
      setHistIdx(-1)
      setValue('')
      run(v)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      if (history[next] !== undefined) { setHistIdx(next); setValue(history[next]) }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = histIdx - 1
      if (next < 0) { setHistIdx(-1); setValue('') }
      else { setHistIdx(next); setValue(history[next]) }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      typeTick()
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-3 sm:px-4 pt-6" aria-label="Terminal">
      <div
        className="border-2 rounded-md overflow-hidden text-left"
        style={{ borderColor: '#22c55e', backgroundColor: '#050805', boxShadow: '0 10px 28px rgba(0,0,0,.45)' }}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#14532d', backgroundColor: '#0a0f0a' }}>
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#ef4444' }} />
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#facc15' }} />
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#22c55e' }} />
          <span className="ml-2 font-mono text-[12px] tracking-wide" style={{ color: '#4ade80' }}>{t('term.title')}</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-widest" style={{ color: '#86efac' }}>BFLNA SHELL</span>
        </div>
        <div ref={outRef} className="font-mono text-[13px] leading-relaxed px-3 py-3 h-64 overflow-y-auto whitespace-pre-wrap break-words" style={{ color: '#86efac' }}>
          {lines.map((l, i) => (
            <div key={i} className={l.kind === 'cmd' ? 'font-bold' : undefined} style={l.kind === 'cmd' ? { color: '#4ade80' } : l.kind === 'err' ? { color: '#f87171' } : undefined}>
              {l.kind === 'cmd' ? '$ ' : ''}{l.text}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 border-t font-mono text-[13px]" style={{ borderColor: '#14532d' }}>
          <span className="font-bold shrink-0" style={{ color: '#4ade80' }}>$</span>
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label={t('term.placeholder')}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="bg-transparent outline-none min-w-0"
            style={{ color: '#bbf7d0', caretColor: 'transparent', width: `${Math.max(1, value.length)}ch` }}
          />
          <span className="type-caret shrink-0" aria-hidden="true" />
          {value === '' && (
            <span className="truncate pointer-events-none select-none" style={{ color: '#4d7c5f' }}>{t('term.placeholder')}</span>
          )}
        </div>
      </div>
    </section>
  )
}
