import { useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Tween a number toward target (ease-out). Instant when reduced motion is on. */
export function useTween(target: number, ms = 420) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    if (prefersReducedMotion()) { from.current = target; return }
    const start = performance.now()
    const a = from.current
    cancelAnimationFrame(raf.current)
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1)
      const e = 1 - Math.pow(1 - p, 3)
      const v = a + (target - a) * e
      from.current = v
      setValue(v)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return prefersReducedMotion() ? target : value
}
