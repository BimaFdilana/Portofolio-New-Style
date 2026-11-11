import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../lib/useInView'

/** Pembungkus reveal-on-scroll: konten muncul (naik + memudar masuk)
 *  saat pertama masuk viewport. `delay` (ms) untuk efek berurutan
 *  di dalam grid. Tanpa reduced-motion: tampil langsung. */
export function Reveal({ children, className = '', delay = 0, style }: {
  children: ReactNode
  className?: string
  delay?: number
  style?: CSSProperties
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, ...style }}
      className={`reveal ${inView ? 'reveal-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}
