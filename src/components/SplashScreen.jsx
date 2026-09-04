import { useEffect, useState } from 'react'
import { markSplashDone } from '../lib/splash'

function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2400)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      markSplashDone()
    }, 2800)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-charcoal transition-opacity duration-400 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src="/anika-logo.png"
        alt="Anika Initiative"
        className="w-40 animate-pulse sm:w-56"
      />
    </div>
  )
}

export default SplashScreen
