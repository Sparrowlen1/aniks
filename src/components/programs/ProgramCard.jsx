import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { accentBg } from '../../utils/accentClasses'
import { ArrowRight } from 'lucide-react';

export default function ProgramCard({ program }) {
  return (
    <div className='mx-auto max-w-6xl px-6 grid gap-10 pt-7 pb-16 md:grid-cols-2'>

      <AnimatePresence mode="wait">
        <motion.div
          key={program.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >

          <div className='flex items-center gap-4 mb-4'>
              <span className={`w-10 h-10 flex items-center justify-center text-white font-display ${accentBg[program.accentClass]}`}>
                  {program.letter}
              </span>

              <div>
                  <h2 className='font-display text-2xl uppercase text-ink'>
                      {program.title}
                  </h2>
                  <p className='text-xs uppercase tracking-wide text-ink/50'>
                      {program.subtitle}
                  </p>
              </div>
          </div>

          <p className='text-ink/80 mb-6 text-base'>
              {program.description}
          </p>

          <h3 className='font-display uppercase tracking-wide text-ink/70 mb-2'>
              How We Work
          </h3>

          <ul className='space-y-1'>
              {program.howWeWork.map((item, i) => (
                  <li key={i}
                      className='flex items-center gap-2 text-base text-ink/80'>
                          <span className={`w-2 h-2 inline-block ${accentBg[program.accentClass]}`} />
                          {item}
                  </li>
              ))}
          </ul>

          <Link
              to={`/stories?pillar=${program.id}`}
              className= {`inline-flex items-center gap-2 mt-4 text-sm font-semibold uppercase tracking-wide text-white px-5 py-2.5 transition-opacity duration-200 hover:opacity-90 ${accentBg[program.accentClass]}`}
          >
              Read {program.title} Stories
          </Link>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={program.id}
          className='mx-auto max-w-6xl pl-6'
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        >
          <img src={program.image} alt={program.title} className='w-full h-80 object-cover' />
          <p className='font-editorial italic bg-charcoal text-cream text-lg text-center py-3'>
              "{program.quote}"
          </p>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}