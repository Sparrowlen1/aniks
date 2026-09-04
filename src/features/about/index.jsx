import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Reveal from './components/Reveal'
import AboutHero from './components/AboutHero'
import OriginStory from './components/OriginStory'
import PoemSpotlight from './components/PoemSpotlight'
import MissionVision from './components/MissionVision'
import Objectives from './components/Objectives'
import HistoryTimeline from './components/HistoryTimeline'
import Governance from './components/Governance'
import CoreValues from './components/CoreValues'
import Partners from './components/Partners'
import JoinCTA from './components/JoinCTA'

export default function AboutSection() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return

    // Wait a tick so the section has mounted before we measure/scroll to it.
    const id = hash.replace('#', '')
    const scrollToTarget = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const raf = requestAnimationFrame(scrollToTarget)
    return () => cancelAnimationFrame(raf)
  }, [hash])

  return (
    <>
      {/* Hero renders immediately — no reveal, it's the first thing visible on load */}
      <AboutHero />

      <Reveal>
        <OriginStory />
      </Reveal>

      <Reveal>
        <PoemSpotlight />
      </Reveal>

      <Reveal>
        <MissionVision />
      </Reveal>

      <Reveal>
        <Objectives />
      </Reveal>

      <Reveal>
        <Governance />
      </Reveal>

      <Reveal>
        <HistoryTimeline />
      </Reveal>

      <Reveal>
        <CoreValues />
      </Reveal>

      <Reveal>
        <Partners />
      </Reveal>

      <Reveal>
        <JoinCTA />
      </Reveal>
    </>
  )
}

// Named exports too, in case a page wants to compose the sections itself.
export {
  AboutHero,
  OriginStory,
  PoemSpotlight,
  MissionVision,
  Objectives,
  HistoryTimeline,
  Governance,
  CoreValues,
  Partners,
  JoinCTA,
}