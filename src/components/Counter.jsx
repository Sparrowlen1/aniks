// src/components/Counter.jsx
import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { onSplashDone } from '../lib/splash'

function Counter({ to = 0, suffix = '', duration = 1.5 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [splashDone, setSplashDone] = useState(false)
  const [value, setValue] = useState(0)

  // Ensure `to` is a valid number
  const target = typeof to === 'number' ? to : Number(to)
  const safeTarget = Number.isFinite(target) ? target : 0
  const isInteger = Number.isInteger(safeTarget)

  useEffect(() => onSplashDone(() => setSplashDone(true)), [])

  useEffect(() => {
    // Only animate if inView, splash done, and we have a valid target
    if (!inView || !splashDone || safeTarget === 0) {
      // If target is 0, we don't need to animate, just set value to 0
      if (safeTarget === 0) setValue(0)
      return
    }

    const controls = animate(0, safeTarget, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        // If the target is an integer, round; otherwise keep one decimal
        const rounded = isInteger ? Math.round(v) : Math.round(v * 10) / 10
        setValue(rounded)
      },
    })
    return () => controls.stop()
  }, [inView, splashDone, safeTarget, duration, isInteger])

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}

export default Counter