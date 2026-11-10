import Lenis from 'lenis'

let lenis: Lenis | null = null
let rafId = 0

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Nyalakan smooth scroll (Lenis): roda mouse jadi berinersia, lompatan
 *  antar-section meluncur. Nonaktif bila pengguna minta reduced-motion —
 *  semua pemanggil tetap jalan lewat fallback native. */
export function initSmoothScroll(): void {
  if (lenis) return
  if (reducedMotion()) return
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
  const raf = (time: number) => {
    lenis?.raf(time)
    rafId = requestAnimationFrame(raf)
  }
  rafId = requestAnimationFrame(raf)
  // Klik anchor dalam halaman (#skills, #projects, ...) juga lewat Lenis
  // supaya tidak bentrok dengan animasi raf-nya.
  document.addEventListener('click', onAnchorClick)
}

export function destroySmoothScroll(): void {
  cancelAnimationFrame(rafId)
  document.removeEventListener('click', onAnchorClick)
  lenis?.destroy()
  lenis = null
}

function onAnchorClick(e: MouseEvent): void {
  const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
  if (!a) return
  const hash = a.getAttribute('href')
  if (!hash || hash.length < 2) return
  const el = document.querySelector(hash)
  if (!el) return
  e.preventDefault()
  scrollToEl(hash)
}

/** Gulir ke selector ('#skills'), elemen, atau posisi Y. `immediate`
 *  dipakai untuk reset posisi saat pindah halaman. */
export function scrollToEl(target: string | number | HTMLElement, immediate = false): void {
  if (lenis) {
    lenis.scrollTo(target as never, { immediate, duration: immediate ? 0 : 1.1 })
    return
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  el?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' })
}
