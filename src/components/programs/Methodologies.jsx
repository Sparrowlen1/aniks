import { accentBorder } from '../../utils/accentClasses';
import Reveal from '../Reveal';

export default function Methodologies({ methodologies, quote}) {
  return (
    <section className='bg-charcoal pt-11 pb-18 text-cream'>
        <div className='mx-auto max-w-6xl px-6'>
        
            <Reveal>
                <h2 className='mb-10 font-editorial text-5xl italic'>
                    Methodologies
                </h2> 
            </Reveal>

            <Reveal>
                <div className='grid gap-4 md:grid-cols-3'>
                    {methodologies.map((m) => (
                        <div 
                            key={m.id}
                            className={`border-t-2 pt-3 pb-4 px-4 bg-white/5 ${accentBorder[m.accentClass]}`}
                        >
                            <h3 className='font-display mb-2 text-lg'>
                                {m.title}
                            </h3>

                            <p className='text-base text-cream/70'>
                                {m.description}
                            </p>
                        </div>   
                    ))}

                    <div className='bg-coral flex items-center justify-center p-4'>
                        <p className='font-editorial italic uppercase text-lg text-white'>
                            {quote}
                        </p>
                    </div>
                </div>   
            </Reveal>
        </div>
    </section>
  );
}
