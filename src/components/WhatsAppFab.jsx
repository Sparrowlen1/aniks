import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { whatsappUrl } from '../lib/whatsapp'

const intents = [
	{ label: 'Ask a question', message: 'Hello ANIKA, I have a question.' },
	{ label: 'Join the Alliance', message: 'Hello ANIKA, I would like to learn about the Pan-African Arts Alliance.' },
	{ label: 'Attend an event', message: 'Hello ANIKA, I would like information about upcoming events.' },
	{ label: 'Submit art or a story', message: 'Hello ANIKA, I would like to submit art or a story.' },
]

function WhatsAppFab() {
	const [open, setOpen] = useState(false)

	return (
		<div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
			{open && (
				<div className="w-[min(20rem,calc(100vw-2.5rem))] border border-ink/15 bg-cream p-5 shadow-2xl">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-anika-green">
								WhatsApp
							</p>
							<h2 className="mt-2 font-display text-2xl uppercase leading-tight text-ink">
								Air it out.
							</h2>
							<p className="mt-2 font-body text-sm leading-6 text-ink/70">
								Start a conversation with the ANIKA team.
							</p>
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Close WhatsApp options"
							className="text-ink/60 transition-colors hover:text-ink"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="mt-4 space-y-2">
						{intents.map((intent) => (
							<a
								key={intent.label}
								href={whatsappUrl(intent.message)}
								target="_blank"
								rel="noreferrer"
								onClick={() => setOpen(false)}
								className="block border border-ink/15 bg-white px-3 py-2.5 font-body text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-anika-green hover:text-anika-green"
							>
								{intent.label}
							</a>
						))}
					</div>

					<a
						href={whatsappUrl()}
						target="_blank"
						rel="noreferrer"
						onClick={() => setOpen(false)}
						className="mt-4 flex items-center justify-center gap-2 bg-anika-green px-4 py-3 font-body text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
					>
						<MessageCircle className="h-4 w-4" />
						Open WhatsApp
					</a>
				</div>
			)}

			<button
				type="button"
				onClick={() => setOpen((isOpen) => !isOpen)}
				aria-label={open ? 'Close WhatsApp options' : 'Open WhatsApp options'}
				aria-expanded={open}
				className="flex h-14 w-14 items-center justify-center rounded-full bg-anika-green text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-anika-green/30"
			>
				{open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
			</button>
		</div>
	)
}

export default WhatsAppFab
