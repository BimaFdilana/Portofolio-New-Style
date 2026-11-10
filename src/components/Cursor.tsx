import { useEffect, useRef, useState } from 'react'

/** Kursor custom ala game: cincin bulat yang mengikuti mouse dengan jeda
 *  halus + titik di tengahnya. Cincin membesar saat mengarah ke elemen
 *  yang bisa diklik. Hanya di perangkat ber-pointer halus (mouse) dan
 *  nonaktif bila pengguna minta reduced-motion — di HP & reduced-motion
 *  kursor bawaan tetap dipakai. */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return
    setEnabled(true)
    document.documentElement.classList.add('has-custom-cursor')

    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    const onMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY }
    const onOver = (e: MouseEvent) => {
      const hit = !!(e.target as HTMLElement).closest('a,button,[role="button"],input,textarea,select,label')
      ringRef.current?.classList.toggle('cursor-hover', hit)
    }
    const onLeave = () => {
      ringRef.current?.classList.add('cursor-hidden')
      dotRef.current?.classList.add('cursor-hidden')
    }
    const onEnter = () => {
      ringRef.current?.classList.remove('cursor-hidden')
      dotRef.current?.classList.remove('cursor-hidden')
    }
    let raf = 0
    const loop = () => {
      // Titik menempel di kursor; cincin menyusul dengan lerp (efek tertinggal).
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  if (!enabled) return null
  return (
    <>
      <div ref={ringRef} aria-hidden className="custom-cursor-ring" />
      <div ref={dotRef} aria-hidden className="custom-cursor-dot" />
    </>
  )
}
