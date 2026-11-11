import { useEffect, useState } from 'react'

/** Bar EXP di tepi bawah navbar: terisi sesuai progres scroll halaman
 *  (0% di atas, 100% di bawah) — seperti naik level saat membaca.
 *  Di-update lewat rAF saat scroll/resize; state hanya berubah saat
 *  nilainya bergerak (1 desimal) supaya tidak re-render tiap piksel. */
export function ScrollExp() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    let last = -1
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const v = Math.min(1, Math.max(0, window.scrollY / max))
      const pct = Math.round(v * 1000) / 10
      if (pct !== last) { last = pct; setP(pct) }
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-ink/10 dark:bg-white/10"
      role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} aria-label="Progres membaca">
      <div className="h-full bg-gradient-to-r from-[#ffe066] via-[#ffb800] to-[#ef3546] relative scroll-exp-fill"
        style={{ width: `${p}%` }}>
        {p > 1 && p < 99 && (
          <span className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-[#ff7a00] border-2 border-ink" />
        )}
      </div>
    </div>
  )
}
