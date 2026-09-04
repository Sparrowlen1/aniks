import { Link } from 'react-router-dom'
import Reveal from '../Reveal'

export default function PartnerCTA() {
  return (
    <section className='bg-cream text-center px-6 py-20'>
        
        <Reveal>
            <h2 className='font-editorial italic text-4xl md:text-5xl text-center mb-4 text-ink mx-auto max-w-6xl px-6'>
                Want to Participate?
            </h2>
        </Reveal>

        <Reveal>
            <p className='text-ink/60 mb-8 mx-auto max-w-6xl px-6'>
                ANIKA works with artists, communities, civil societies and institutions.
            </p>
       
            <Link
                to='/get-involved'
                className='mx-auto max-w-6xl px-6 inline-block bg-charcoal text-cream/80 py-3 uppercase text-sm font-semibold tracking-wide transition-colors duration-200 hover:bg-coral cursor-pointer'
            >
                Get Involved
            </Link>
        </Reveal>
    </section>
  )
}
