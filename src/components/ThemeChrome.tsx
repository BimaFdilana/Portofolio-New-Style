import { useApp } from '../lib/store'

/** Strip khas tiap tema di bawah navbar: Space jadi strip koordinat misi.
 *  Terminal tidak punya strip lagi — konsol interaktifnya sendiri
 *  (TerminalConsole di Home) adalah strip-nya. Tema lain tidak punya
 *  strip — karakternya sudah di CSS. */
export function ThemeChrome() {
  const { theme } = useApp()
  if (theme === 'space') {
    return (
      <div className="border-b-[3px] border-ink bg-[#020617] px-3 py-1.5 overflow-hidden">
        <p className="max-w-6xl mx-auto text-[11px] sm:text-xs text-[#7dd3fc] truncate">
          ◆ SAT-01 · ORBIT STABLE · LAT 1.35°N · LON 103.82°E · 6 THEMES ONLINE
        </p>
      </div>
    )
  }
  return null
}
