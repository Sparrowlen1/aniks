import Reveal from "../Reveal";

export default function ImpactHeader() {
  return (
    
      <section className='relative bg-charcoal text-cream py-16 overflow-hidden'>
        <img 
          src="/anika-gold-blob.png"
          className='absolute -top-10 right-0 w-64 h-64 md:w-80 md:h-80 object-contain pointer-events-none select-none'
        />

        <Reveal>
          <div className='relative z-10 mx-auto max-w-6xl px-6'>
            <h1 className='font-display text-5xl md:text-6xl'>IMPACT</h1>
            <p className='font-editorial italic text-gold mt-4 max-w-md text-lg'>
              Numbers matter, but the change lives in the rooms, the mics and the people.
            </p>
          </div>
        </Reveal>
        
      </section>
  );
}