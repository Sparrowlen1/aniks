import { useRef, useState } from 'react'
import { X, UploadCloud, Check } from 'lucide-react'

// TODO: replace with the real Gallery data source (shared with the Gallery
// admin page) once it's wired to the backend. Captions match the gallery
// mockup so this reads consistently in the meantime.
const GALLERY_IMAGES = [
  { id: 'g1', caption: 'Open mic · Nairobi', url: 'https://picsum.photos/seed/anika-openmic/480/360' },
  { id: 'g2', caption: 'Community forum', url: 'https://picsum.photos/seed/anika-forum/480/360' },
  { id: 'g3', caption: 'Spoken word', url: 'https://picsum.photos/seed/anika-spokenword/480/360' },
  { id: 'g4', caption: 'The ANIKA team', url: 'https://picsum.photos/seed/anika-team/480/360' },
  { id: 'g5', caption: 'Art therapy', url: 'https://picsum.photos/seed/anika-arttherapy/480/360' },
  { id: 'g6', caption: 'Sema-Anika', url: 'https://picsum.photos/seed/anika-sema/480/360' },
  { id: 'g7', caption: 'Gaining Grip', url: 'https://picsum.photos/seed/anika-gaininggrip/480/360' },
  { id: 'g8', caption: 'Youth workshop', url: 'https://picsum.photos/seed/anika-youth/480/360' },
  { id: 'g9', caption: 'Heritage festival', url: 'https://picsum.photos/seed/anika-heritage/480/360' },
]

function ThumbnailPicker({ initialUrl, onClose, onSelect }) {
  const [tab, setTab] = useState('gallery')
  const [selectedUrl, setSelectedUrl] = useState(initialUrl || null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // TODO: swap for an actual upload call (e.g. to Supabase storage) and
    // use the returned public URL instead of a local object URL.
    const localUrl = URL.createObjectURL(file)
    setUploadPreview(localUrl)
    setSelectedUrl(localUrl)
  }

  function confirmSelection() {
    if (selectedUrl) onSelect(selectedUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-charcoal">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 dark:border-white/10">
          <h3 className="font-display text-lg tracking-wide">Cover image</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink dark:text-cream/50 dark:hover:text-cream">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-ink/10 px-5 pt-3 dark:border-white/10">
          {[
            { key: 'gallery', label: 'Choose from gallery' },
            { key: 'upload', label: 'Upload new' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-coral/15 text-coral'
                  : 'text-ink/50 hover:text-ink dark:text-cream/50 dark:hover:text-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'gallery' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GALLERY_IMAGES.map((img) => {
                const active = selectedUrl === img.url
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedUrl(img.url)}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-colors ${
                      active ? 'border-coral ring-2 ring-coral' : 'border-ink/10 dark:border-white/10'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-ink/5 dark:bg-white/5">
                      <img src={img.url} alt={img.caption} className="h-full w-full object-cover" />
                    </div>
                    <p className="truncate px-2 py-1.5 text-xs text-ink/70 dark:text-cream/70">{img.caption}</p>
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/15 py-10 text-ink/50 hover:border-coral hover:text-coral dark:border-white/15 dark:text-cream/50"
              >
                <UploadCloud size={28} />
                <span className="text-sm font-medium">Click to choose an image</span>
                <span className="text-xs text-ink/40 dark:text-cream/40">JPG or PNG, up to 5MB</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

              {uploadPreview && (
                <div className="w-full overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
                  <img src={uploadPreview} alt="Selected upload preview" className="aspect-video w-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-ink/10 px-5 py-4 dark:border-white/10">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink dark:text-cream/60 dark:hover:text-cream"
          >
            Cancel
          </button>
          <button
            onClick={confirmSelection}
            disabled={!selectedUrl}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use this image
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThumbnailPicker