import Reveal from '../Reveal';

export default function ProgramsHeader() {
  return (
    
      <section className='relative overflow-hidden bg-charcoal py-16 text-cream'>
        
        <img 
          src="/anika-gold-blob.png"
          className='absolute -top-10 right-0 w-64 h-64 md:w-80 md:h-80 object-contain pointer-events-none select-none'
        />
        <Reveal>
          <div className='relative z-10 mx-auto max-w-6xl px-6'>
          <h1 className='font-display text-5xl md:text-6xl'>
            PROGRAMS
          </h1>
          <p className='font-editorial italic text-gold mt-4 max-w-md text-lg'>
            We operate across 5 structural pilars, using targeted art mediums to drive continuous dialogue, fight injustice and support young African creatives.
          </p>
        </div>
        </Reveal>
        
      </section>
  );
}
