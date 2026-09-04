import Reveal from "../Reveal";

export default function CaseStudies({ caseStudies}) {
  return (
    <section className='mx-auto max-w-6xl px-6 pt-8 pb-20'>
        <Reveal>
            <p className='text-coral text-xs uppercase tracking-wide font-semibold mb-4'>
                Case Studies
            </p>
        </Reveal>
        
        <Reveal>
            <h2 className='font-display text-4xl md:text-5xl text-ink mb-8'>
                WHERE THE CHANGE LIVES.
            </h2>
        </Reveal>
       
        <Reveal>
            <div className='grid gap-8 md:grid-cols-3'>
                {caseStudies.map((study) => (
                    <div key={study.id}>
                        <img 
                            src={study.image} 
                            alt={study.title}
                            className='w-full h-56 object-cover mb-5' 
                        />
                        
                        <h3 className='font-display text-lg text-ink mb-3'>
                            {study.title}
                        </h3>
                        
                        <p className='text-sm text-ink/70'>
                            {study.description}
                        </p>
                    </div>
                ))}
            </div>
        </Reveal>      
    </section>
  )
}
