// Mesin suara WebAudio: SFX 8-bit disintesis (0 KB file) + BGM chiptune loop.
// Semua pemanggilan aman sebelum interaksi pertama (context dibuat saat gesture).

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = typeof localStorage !== 'undefined' && localStorage.getItem('muted') === '1'

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(m: boolean) {
  muted = m
  localStorage.setItem('muted', m ? '1' : '0')
  if (master && ctx) master.gain.setValueAtTime(m ? 0 : 0.5, ctx.currentTime)
  if (m) stopBgm()
}
export function isMuted() { return muted }

function tone(freq: number, dur = 0.08, type: OscillatorType = 'square', vol = 0.5, when = 0, slideTo?: number) {
  const c = ac(); if (!c || !master || muted) return
  const t0 = c.currentTime + when
  const o = c.createOscillator(); const g = c.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  o.connect(g); g.connect(master)
  o.start(t0); o.stop(t0 + dur + 0.02)
}

export const sfx = {
  click() { tone(620, 0.06, 'square', 0.35) },
  hover() { tone(880, 0.03, 'square', 0.12) },
  back() { tone(420, 0.07, 'square', 0.3) },
  coin() { tone(988, 0.07, 'square', 0.4); tone(1319, 0.16, 'square', 0.4, 0.07) },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.4, i * 0.11)) },
  door() { tone(300, 0.16, 'triangle', 0.5, 0, 520) },
  pickup() { tone(784, 0.08, 'square', 0.4); tone(1175, 0.14, 'square', 0.4, 0.08) },
  hurt() { tone(220, 0.2, 'sawtooth', 0.35, 0, 90) },
  win() { [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.45, i * 0.12)) },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, 'triangle', 0.4, i * 0.14)) },
}

/** Bunyi klik khas tiap tema — dipakai SFX klik global (lihat App).
 *  Semua lewat tone(), jadi tetap patuh mute global dan hanya berbunyi
 *  setelah gestur pengguna. */
export type ThemeSound = 'game' | 'terminal' | 'retro' | 'neon' | 'space' | 'solarized'
const THEME_CLICKS: Record<ThemeSound, () => void> = {
  game: () => tone(620, 0.06, 'square', 0.35),
  terminal: () => { tone(1400, 0.02, 'square', 0.22); tone(1800, 0.02, 'square', 0.18, 0.03) },
  retro: () => { tone(880, 0.05, 'square', 0.35); tone(1318, 0.07, 'square', 0.35, 0.05) },
  neon: () => tone(1400, 0.09, 'sawtooth', 0.35, 0, 300),
  space: () => tone(900, 0.16, 'sine', 0.4, 0, 180),
  solarized: () => tone(980, 0.03, 'sine', 0.2),
}
export function themeClick(theme: ThemeSound) { (THEME_CLICKS[theme] ?? THEME_CLICKS.game)() }

/** Bunyi ketikan konsol Terminal/CLI — satu tick pendek per tombol.
 *  Hanya berbunyi sebagai respons langsung atas ketikan pengguna dan
 *  tetap patuh mute global (tone() diam bila muted). */
export function typeTick() { tone(1400, 0.015, 'square', 0.12) }

// --- BGM: melodi chiptune orisinal, loop ringan ---
const MELODY = [523, 659, 784, 659, 587, 659, 784, 880, 784, 659, 587, 523, 440, 523, 587, 659]
const BASS = [131, 165, 196, 165, 147, 165, 196, 220, 196, 165, 147, 131, 110, 131, 147, 165]
/** Varian BGM per tema: melodi & tempo yang sama "rasanya" dengan tema.
 *  Game & Retro memakai chiptune orisinal; sisanya variasi ringan. */
const BGM_THEMES: Record<ThemeSound, { melody: number[]; bass: number[]; interval: number; wave: OscillatorType; vol: number; bassVol: number }> = {
  game: { melody: MELODY, bass: BASS, interval: 215, wave: 'square', vol: 0.10, bassVol: 0.12 },
  retro: { melody: MELODY, bass: BASS, interval: 215, wave: 'square', vol: 0.10, bassVol: 0.12 },
  solarized: { melody: [440, 523, 659, 523, 587, 659, 784, 659, 587, 523, 440, 523, 587, 659], bass: [110, 131, 165, 131, 147, 165, 196, 165], interval: 300, wave: 'triangle', vol: 0.08, bassVol: 0.10 },
  terminal: { melody: [220, 220, 330, 220, 196, 220, 262, 220], bass: [110, 110, 131, 110], interval: 300, wave: 'triangle', vol: 0.07, bassVol: 0.09 },
  neon: { melody: [523, 659, 784, 1047, 784, 659, 784, 1047], bass: [131, 165, 196, 131], interval: 160, wave: 'square', vol: 0.08, bassVol: 0.10 },
  space: { melody: [392, 494, 587, 494, 440, 587, 659, 587, 523, 587, 659, 784], bass: [98, 123, 147, 123], interval: 480, wave: 'sine', vol: 0.12, bassVol: 0.10 },
}
let bgmTimer: number | null = null
let bgmStep = 0
export function startBgm(theme: ThemeSound = 'game') {
  if (bgmTimer !== null || muted) return
  const cfg = BGM_THEMES[theme] ?? BGM_THEMES.game
  const step = () => {
    const i = bgmStep % cfg.melody.length
    tone(cfg.melody[i], 0.16, cfg.wave, cfg.vol)
    if (i % 2 === 0) tone(cfg.bass[i % cfg.bass.length], 0.3, 'triangle', cfg.bassVol)
    bgmStep++
  }
  step()
  bgmTimer = window.setInterval(step, cfg.interval)
}
/** Ganti BGM ke varian tema aktif — hanya bila BGM sedang jalan (tidak
 *  pernah memulai suara sendiri; BGM tetap opt-in lewat tombol ♪). */
export function restartBgm(theme: ThemeSound) {
  if (bgmTimer === null) return
  stopBgm(); bgmStep = 0; startBgm(theme)
}
export function stopBgm() {
  if (bgmTimer !== null) { clearInterval(bgmTimer); bgmTimer = null }
}
export function bgmPlaying() { return bgmTimer !== null }
