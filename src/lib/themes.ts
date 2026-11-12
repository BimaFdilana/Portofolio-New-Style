import type { MsgKey } from './i18n'

/** Sistem tema portofolio: 6 tema (game + 5 tema baru).
 *
 *  - Pilihan eksplisit pengunjung disimpan di localStorage 'theme' dan
 *    SELALU menang.
 *  - Tanpa pilihan eksplisit, tema diundi per sesi: hasilnya hanya
 *    disimpan di sessionStorage 'theme-session' (BUKAN localStorage,
 *    karena undian bukan pilihan).
 *  - Migrasi: nilai lama 'light' → 'game', 'dark' → 'terminal'
 *    (tema Dark lama dihapus; pengalaman gelap = Terminal/CLI). */
export type ThemeId = 'game' | 'terminal' | 'retro' | 'neon' | 'space' | 'solarized'

export const THEMES: { id: ThemeId; icon: string; nameKey: MsgKey }[] = [
  { id: 'game', icon: '🎮', nameKey: 'theme.game' },
  { id: 'terminal', icon: '>_', nameKey: 'theme.terminal' },
  { id: 'retro', icon: '👾', nameKey: 'theme.retro' },
  { id: 'neon', icon: '⚡', nameKey: 'theme.neon' },
  { id: 'space', icon: '🚀', nameKey: 'theme.space' },
  { id: 'solarized', icon: '{}', nameKey: 'theme.solarized' },
]

export const THEME_POOL: ThemeId[] = THEMES.map(t => t.id)

/** Tema gelap (memakai kelas .dark turunan, seperti dark mode lama). */
export const DARK_THEMES: ThemeId[] = ['terminal', 'retro', 'neon', 'space', 'solarized']

/** Warna tema untuk <meta name="theme-color"> (chrome browser HP). */
export const THEME_COLORS: Record<ThemeId, string> = {
  game: '#232a4d',
  terminal: '#0a0f0a',
  retro: '#1a1836',
  neon: '#050508',
  space: '#030712',
  solarized: '#002b36',
}

export function isValidTheme(v: string | null): v is ThemeId {
  return !!v && (THEME_POOL as string[]).includes(v)
}

/** Migrasi nilai localStorage 'theme' lama: 'light' → game, 'dark' (tema
 *  lama yang dihapus) → terminal, supaya situs tidak rusak/blank. */
export function migrateTheme(saved: string | null): ThemeId | null {
  if (!saved) return null
  if (saved === 'light') return 'game'
  if (saved === 'dark') return 'terminal'
  return isValidTheme(saved) ? saved : null
}

export function pickRandomTheme(exclude?: ThemeId): ThemeId {
  const pool = exclude ? THEME_POOL.filter(t => t !== exclude) : THEME_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Terapkan tema ke dokumen: atribut data-theme + kelas .dark turunan
 *  (supaya varian Tailwind `dark:` dan aturan .dark di CSS tetap jalan)
 *  + warna theme-color. Dipakai store dan (dalam bentuk inline) head script. */
export function applyThemeToDocument(id: ThemeId) {
  const root = document.documentElement
  root.setAttribute('data-theme', id)
  root.classList.toggle('dark', id !== 'game')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[id])
}
