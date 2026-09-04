import Reveal from '../Reveal';

export default function ReportBanner() {
    const hasReport = false; //change to true once report PDF is sent
    const reportUrl = '/documents/annual-impact-report.pdf'; //report link placeholder

  return (
    <Reveal>
        <section className='bg-anika-blue text-white py-16'>
            <div className='mx-auto max-w-6xl px-6 flex flex-col md:flex-row md:items-center md:justify-center gap-40'>
                <div>
                    <h3 className='font-display text-2xl md:text-3xl mb-2'>
                        Annual Report 2025
                    </h3>
                    
                    <p className='text-white/80 max-w-lg'>
                        The full picture, programmes, reach, partnerships and stories from the year.
                    </p>
                </div>

                {hasReport ? (
                    <a 
                        href={reportUrl}
                        download
                        className='inline-block border-2 border-white px-6 py-3 uppercase text-sm font-semibold tracking-wide hover:bg-white hover:text-anika-blue transition-colors duration-200 whitespace-nowrap'
                    >
                        Download PDF 
                    </a>
                    ) : (
                        <button
                            disabled
                            title='Report coming soon'
                            className='inline-block border-2 border-white/50 text-white/40 px-6 py-3 uppercase text-sm font-semibold tracking-wide cursor-not-allowed whitespace-nowrap'
                        >
                            Download PDF
                        </button>
                    )
                }
            </div>
        </section>
    </Reveal>
  )
}
