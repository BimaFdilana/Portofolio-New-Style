import { useEffect, useRef, useState } from 'react'

/** Sekali terlihat, tetap terlihat: IntersectionObserver yang menandai
 *  elemen saat masuk viewport (untuk reveal & animasi bar). Tanpa
 *  IntersectionObserver, atau bila pengguna minta reduced-motion,
 *  langsung dianggap terlihat — konten tidak pernah tertahan. */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setInView(true); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, inView }
}
