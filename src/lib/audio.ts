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

// --- BGM: melodi chiptune orisinal, loop ringan ---
const MELODY = [523, 659, 784, 659, 587, 659, 784, 880, 784, 659, 587, 523, 440, 523, 587, 659]
const BASS = [131, 165, 196, 165, 147, 165, 196, 220, 196, 165, 147, 131, 110, 131, 147, 165]
let bgmTimer: number | null = null
let bgmStep = 0
export function startBgm() {
  if (bgmTimer !== null || muted) return
  const step = () => {
    const i = bgmStep % MELODY.length
    tone(MELODY[i], 0.16, 'square', 0.10)
    if (i % 2 === 0) tone(BASS[i], 0.3, 'triangle', 0.12)
    bgmStep++
  }
  step()
  bgmTimer = window.setInterval(step, 215)
}
export function stopBgm() {
  if (bgmTimer !== null) { clearInterval(bgmTimer); bgmTimer = null }
}
export function bgmPlaying() { return bgmTimer !== null }
