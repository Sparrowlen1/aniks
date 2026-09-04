import { useState } from 'react'
import { programs } from '../data/programs'
import { methodologies, methodologyQuote } from '../data/methodologies'
import ProgramsHeader from '../components/programs/ProgramsHeader'
import ProgramTabs from '../components/programs/ProgramTabs'
import ProgramCard from '../components/programs/ProgramCard'
import Methodologies from '../components/programs/Methodologies'
import PartnerCTA from '../components/programs/ParticipateCTA'

export default function Programs() {
  const [activeId, setActiveId] = useState(programs[0].id);
  const activeProgram = programs.find((p) => p.id === activeId);

  return (
    <>
      <ProgramsHeader />
      <ProgramTabs programs={programs} activeId={activeId} onSelect={setActiveId} />
      <ProgramCard program={activeProgram} />
      <Methodologies methodologies={methodologies} quote={methodologyQuote} />
      <PartnerCTA />
    </>
  )
}
