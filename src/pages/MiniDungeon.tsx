import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'
import { sfx } from '../lib/audio'
import { Footer } from '../components/Sections'
import { Hearts, spawnConfetti } from '../components/ui'
import type { MsgKey } from '../lib/i18n'

// Legenda peta: # dinding · . lantai · D pintu terkunci · K kunci · C peti · P ramuan · E musuh · H hero · R relic
const MAPS: { name: string; rows: string[] }[] = [
  {
    name: 'DUNGEON I — RUANG PEMULA',
    rows: [
      '#############',
      '#H....#..K..#',
      '#.##.......##',
      '#..#..###D###',
      '#C.#....#R..#',
      '#..###..#...#',
      '#....#..##..#',
      '#P...#....E.#',
      '#############',
    ],
  },
  {
    name: 'DUNGEON II — LORONG BATU',
    rows: [
      '#############',
      '#H..#...#.K.#',
      '#.##.#.#.#.##',
      '#K...#.#.#..#',
      '####D#.#.##.#',
      '#P...#E.....#',
      '#.####.##D#.#',
      '#..C...#...R#',
      '#############',
    ],
  },
  {
    name: 'DUNGEON III — SARANG BOSS',
    rows: [
      '###############',
      '#H...#....#C..#',
      '#.##.#.##.#.###',
      '#..#...#..#...#',
      '##.#####D####.#',
      '#P.....#....#.#',
      '#.####.#.##.#.#',
      '#C...#E#..#D#R#',
      '#....#..K#....#',
      '###############',
    ],
  },
]

const key = (x: number, y: number) => `${x},${y}`

interface Enemy { x: number; y: number; axis: 'h' | 'v'; dir: number; home: string }

function parse(rows: string[]) {
  const walls = new Set<string>()
  const items = new Map<string, string>()
  const enemies: Enemy[] = []
  let hero = { x: 1, y: 1 }
  rows.forEach((row, y) => row.split('').forEach((ch, x) => {
    if (ch === '#') walls.add(key(x, y))
    else if (ch === 'H') hero = { x, y }
    else if (ch === 'E') enemies.push({ x, y, axis: 'h', dir: 1, home: key(x, y) })
    else if ('DKCPR'.includes(ch)) items.set(key(x, y), ch)
  }))
  return { walls, items, enemies, hero }
}

export function MiniDungeon() {
  const { t } = useApp()
  const unlocked = Number(localStorage.getItem('dungeonCleared') || '0') // jumlah dungeon yang sudah ditaklukkan
  const [level, setLevel] = useState(() => Math.min(unlocked, MAPS.length - 1))
  const parsed = useMemo(() => parse(MAPS[level].rows), [level])
  const W = MAPS[level].rows[0].length
  const H = MAPS[level].rows.length

  const [hero, setHero] = useState(parsed.hero)
  const [hearts, setHearts] = useState(4)
  const [keys, setKeys] = useState(0)
  const [gems, setGems] = useState(0)
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [opened, setOpened] = useState<Set<string>>(new Set())
  const [enemies, setEnemies] = useState<Enemy[]>(parsed.enemies)
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [msg, setMsg] = useState<MsgKey>('game.msg.start')
  const [seconds, setSeconds] = useState(0)
  const invulnUntil = useRef(0)

  const reset = useCallback((lv = level) => {
    const p = parse(MAPS[lv].rows)
    setHero(p.hero); setEnemies(p.enemies)
    setHearts(4); setKeys(0); setGems(0)
    setTaken(new Set()); setOpened(new Set())
    setStatus('playing'); setMsg('game.msg.start'); setSeconds(0)
  }, [level])

  useEffect(() => { reset(level) }, [level]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    if (status !== 'playing') return
    const iv = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [status])

  const hurt = useCallback(() => {
    if (Date.now() < invulnUntil.current) return
    invulnUntil.current = Date.now() + 1200
    sfx.hurt()
    setMsg('game.msg.hurt')
    setHearts(h => {
      const next = h - 1
      if (next <= 0) { setStatus('lost'); sfx.lose(); setMsg('game.msg.lose') }
      return Math.max(0, next)
    })
    setHero(parsed.hero)
  }, [parsed.hero])

  // Gerakan musuh (patroli)
  useEffect(() => {
    if (status !== 'playing') return
    const iv = window.setInterval(() => {
      setEnemies(prev => prev.map(e => {
        const nx = e.axis === 'h' ? e.x + e.dir : e.x
        const ny = e.axis === 'v' ? e.y + e.dir : e.y
        const blocked = parsed.walls.has(key(nx, ny)) || (parsed.items.get(key(nx, ny)) === 'D' && !opened.has(key(nx, ny)))
        if (blocked) return { ...e, dir: -e.dir }
        return { ...e, x: nx, y: ny }
      }))
    }, 430)
    return () => clearInterval(iv)
  }, [status, parsed, opened])

  // Tabrakan musuh
  useEffect(() => {
    if (status === 'playing' && enemies.some(e => e.x === hero.x && e.y === hero.y)) hurt()
  }, [enemies, hero, status, hurt])

  const move = useCallback((dx: number, dy: number) => {
    if (status !== 'playing') return
    const nx = hero.x + dx, ny = hero.y + dy
    const k = key(nx, ny)
    if (parsed.walls.has(k)) { sfx.click(); return }
    const item = taken.has(k) ? undefined : parsed.items.get(k)
    if (item === 'D' && !opened.has(k)) {
      if (keys > 0) {
        setKeys(c => c - 1); setOpened(new Set(opened).add(k)); sfx.door(); setMsg('game.msg.doorOpen')
      } else { setMsg('game.msg.doorLocked'); sfx.click() }
      return
    }
    setHero({ x: nx, y: ny })
    if (enemies.some(e => e.x === nx && e.y === ny)) { hurt(); return }
    if (!item) return
    if (item === 'K') { setKeys(c => c + 1); setTaken(new Set(taken).add(k)); sfx.pickup(); setMsg('game.msg.key') }
    else if (item === 'C') { setGems(g => g + 25); setTaken(new Set(taken).add(k)); sfx.coin(); setMsg('game.msg.chest') }
    else if (item === 'P') { setHearts(h => Math.min(5, h + 1)); setTaken(new Set(taken).add(k)); sfx.pickup(); setMsg('game.msg.potion') }
    else if (item === 'R') {
      setStatus('won'); setMsg('game.msg.win'); sfx.win(); spawnConfetti(80)
      const cleared = Math.max(Number(localStorage.getItem('dungeonCleared') || '0'), level + 1)
      localStorage.setItem('dungeonCleared', String(cleared))
      const best = Math.max(Number(localStorage.getItem('dungeonBest') || '0'), gems + 25)
      localStorage.setItem('dungeonBest', String(best))
    }
  }, [status, hero, parsed, taken, opened, keys, enemies, hurt, level, gems])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
      }
      const m = map[e.key]
      if (m) { e.preventDefault(); move(m[0], m[1]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  const cell = (x: number, y: number) => {
    const k = key(x, y)
    const isWall = parsed.walls.has(k)
    const item = taken.has(k) ? undefined : parsed.items.get(k)
    const isDoor = item === 'D' && !opened.has(k)
    const enemy = enemies.find(e => e.x === x && e.y === y)
    const isHero = hero.x === x && hero.y === y
    let bg = '#26313d'
    if (isWall) bg = (x + y) % 2 ? '#8a6b4f' : '#7d6247'
    if (isDoor) bg = '#a8842c'
    return (
      <div key={k} className="relative flex items-center justify-center border border-black/25"
        style={{ background: bg, aspectRatio: '1' }}>
        {isDoor && <span className="text-[clamp(10px,2.6vw,20px)]">🚪</span>}
        {item === 'K' && <span className="text-[clamp(10px,2.6vw,20px)]">🔑</span>}
        {item === 'C' && <span className="text-[clamp(10px,2.6vw,20px)]">🧰</span>}
        {item === 'P' && <span className="text-[clamp(10px,2.6vw,20px)]">🧪</span>}
        {item === 'R' && <span className="text-[#ffd94d] font-pixel text-[clamp(9px,2.2vw,16px)]" style={{ textShadow: '0 0 8px #ffd94d' }}>▲</span>}
        {enemy && status === 'playing' && <span className="text-[clamp(11px,2.8vw,22px)]">👹</span>}
        {isHero && <span className="text-[clamp(12px,3vw,24px)] drop-shadow">🧝</span>}
      </div>
    )
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <>
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/" className="font-pixel text-[10px] bg-parchment border-2 border-ink px-3 py-2 shadow-[3px_3px_0_rgba(43,33,24,.4)] dark:text-ink">← HOME</Link>
          <h1 className="font-pixel text-lg sm:text-2xl text-ink dark:text-parchment" style={{ textShadow: '3px 3px 0 rgba(255,248,231,.85)' }}>
            ⚔ {t('game.title')}
          </h1>
        </div>

        <div className="flex gap-2 mt-5 flex-wrap" role="tablist" aria-label="Pilih dungeon">
          {MAPS.map((m, i) => {
            const lockedLv = i > unlocked
            return (
              <button key={i} disabled={lockedLv} onClick={() => setLevel(i)}
                className={`font-pixel text-[9px] px-3 py-[9px] border-[3px] border-ink shadow-[3px_3px_0_rgba(43,33,24,.4)] ${i === level ? 'bg-terra text-white' : 'bg-parchment text-ink'} ${lockedLv ? 'opacity-40' : ''}`}>
                {lockedLv ? '🔒 ' : i < unlocked ? '✔ ' : ''}DUNGEON {['I', 'II', 'III'][i]}
              </button>
            )
          })}
        </div>

        <div className="card-pixel mt-4 p-3 sm:p-4 !bg-nightdeep">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-parchment font-pixel text-[9px] sm:text-[10px]">
            <Hearts n={hearts} />
            <span>🔑 × {keys} <span className="opacity-60">{t('game.key')}</span></span>
            <span>💎 {gems} {t('game.gems')}</span>
            <span>⏱ {mm}:{ss}</span>
            <span className="ml-auto text-ochre">{t('game.objective')}</span>
          </div>
          <p className="font-pixel text-[9px] text-parchment/80 mt-2">{MAPS[level].name}</p>
          <div className="grid mt-3 border-[3px] border-black" style={{ gridTemplateColumns: `repeat(${W}, 1fr)` }} role="img" aria-label={MAPS[level].name}>
            {Array.from({ length: H }).map((_, y) => Array.from({ length: W }).map((_, x) => cell(x, y)))}
          </div>
          <div className="dialog-rpg mt-3 p-3 text-sm">
            <p className="font-bold">{t(msg)}</p>
          </div>
          {status !== 'playing' && (
            <div className="text-center mt-4">
              <p className="font-pixel text-base text-ochre">{status === 'won' ? `🏆 ${t('game.win')}` : `💀 ${t('game.lose')}`}</p>
              <p className="text-parchment font-bold mt-2">💎 {gems} · ⏱ {mm}:{ss}</p>
              <div className="flex gap-2 justify-center mt-3 flex-wrap">
                <button className="btn-pixel !bg-terra" onClick={() => reset()}>{status === 'won' ? t('game.again') : t('game.tryAgain')}</button>
                {status === 'won' && level < MAPS.length - 1 && (
                  <button className="btn-pixel !bg-sage" onClick={() => setLevel(level + 1)}>{t('game.next')}</button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mt-4 gap-4">
          <p className="font-bold text-sm bg-parchment/90 border-2 border-ink px-3 py-2 dark:bg-night/80 dark:text-parchment">{t('game.controls')}</p>
          <div className="grid grid-cols-3 gap-1 w-[132px] shrink-0" aria-label="D-pad">
            <span />
            <button className="btn-pixel !bg-night !px-0 text-center" onClick={() => move(0, -1)} aria-label="Up">▲</button>
            <span />
            <button className="btn-pixel !bg-night !px-0 text-center" onClick={() => move(-1, 0)} aria-label="Left">◀</button>
            <button className="btn-pixel !bg-night !px-0 text-center" onClick={() => move(0, 1)} aria-label="Down">▼</button>
            <button className="btn-pixel !bg-night !px-0 text-center" onClick={() => move(1, 0)} aria-label="Right">▶</button>
          </div>
          <button className="btn-pixel !bg-ochre !text-ink" onClick={() => reset()}>{t('game.reset')}</button>
        </div>
      </main>
      <Footer />
    </>
  )
}
