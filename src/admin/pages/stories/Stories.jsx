// admin/pages/stories/Stories.jsx
import { useMemo, useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { getPillar, STATUS_STYLES, STATUS_LABELS } from './data/pillars'
import StoryEditor from './StoryEditor'
import { storiesStore } from '../../../data/storiesStore'

// Same delete-confirmation pattern as Partners.jsx
function DeleteConfirmModal({ isOpen, onClose, onConfirm, storyTitle, colors, isDeleting }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(20,18,15,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border }}>
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>
            Delete Story
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm" style={{ color: colors.text }}>
            Are you sure you want to delete <span className="font-bold">{storyTitle}</span>?
          </p>
          <p className="text-xs" style={{ color: colors.muted }}>
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: colors.border }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-sm font-semibold px-3 py-2"
            style={{ color: colors.muted }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ background: "#dc2626", color: "#ffffff" }}
            className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Same light/dark palette shape as Partners.jsx
const lightColors = {
  bg: "#fafaf8",
  border: "#e8e5df",
  text: "#1c1a17",
  muted: "#8c8579",
  panel: "#ffffff",
  panelAlt: "#faf8f2",
  buttonBg: "#1c1a17",
  buttonText: "#ffffff",
  inputBg: "#ffffff",
  inputPlaceholder: "#8c8579",
};

const darkColors = {
  bg: "#1a1a1a",
  border: "#3a3a3a",
  text: "#f0f0f0",
  muted: "#aaaaaa",
  panel: "#2a2a2a",
  panelAlt: "#242424",
  buttonBg: "#f0f0f0",
  buttonText: "#1a1a1a",
  inputBg: "#2a2a2a",
  inputPlaceholder: "#aaaaaa",
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'Submissions' },
]

function Stories() {
  // Pull theme from AdminLayout via Outlet context
  const { theme } = useOutletContext();
  const COLORS = theme === 'dark' ? darkColors : lightColors;

  const [stories, setStories] = useState([])
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list')
  const [editingStory, setEditingStory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load stories from the API
  const loadStories = async () => {
    setIsLoading(true)
    try {
      const allStories = await storiesStore.getAll()
      setStories(allStories)
      setError(null)
    } catch (err) {
      console.error('Failed to load stories:', err)
      setError('Failed to load stories. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and subscribe to changes
  useEffect(() => {
    loadStories()
    const unsubscribe = storiesStore.subscribe(loadStories)
    return unsubscribe
  }, [])

  const filteredStories = useMemo(
    () => filter === 'all' ? stories : stories.filter((s) => s.status === filter),
    [stories, filter]
  )

  function openNewStory() {
    setEditingStory(null)
    setView('editor')
  }

  async function openEditStory(story) {
    try {
      const fullStory = await storiesStore.getById(story.id)
      setEditingStory(fullStory)
      setView('editor')
    } catch (err) {
      console.error('Failed to load story for editing:', err)
    }
  }

  function handleDelete(story) {
    setDeleteConfirm(story)
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      await storiesStore.delete(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete story:', err)
      setError('Failed to delete story. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSave(payload) {
    // Let storiesStore.save() errors propagate to the caller (StoryEditor)
    // so it can show "Save failed" and keep the unsaved edits on screen
    // instead of silently reporting success.
    await storiesStore.save(payload)
    setView('list')
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (view === 'editor') {
    return <StoryEditor story={editingStory} onCancel={() => setView('list')} onSave={handleSave} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: COLORS.text }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <style>{`
        .stories-input::placeholder {
          color: ${COLORS.inputPlaceholder};
          opacity: 1;
        }
      `}</style>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Stories
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Publish and manage stories, on brand voice.
          </p>
        </div>
        <button
          onClick={openNewStory}
          style={{ background: COLORS.buttonBg, color: COLORS.buttonText }}
          className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5"
        >
          <Plus size={14} /> NEW STORY
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ background: '#b23b3b1a', color: '#b23b3b' }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-5">
        {FILTERS.map((f) => {
          const count = f.key === 'all' ? stories.length : stories.filter(s => s.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? COLORS.text : COLORS.panel,
                color: filter === f.key ? COLORS.panel : COLORS.text,
                border: `1px solid ${filter === f.key ? COLORS.text : COLORS.border}`,
              }}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl" style={{ 
        background: COLORS.panel, 
        border: `1px solid ${COLORS.border}` 
      }}>
        <div
          className="grid text-xs font-bold tracking-wide px-5 py-3 border-b min-w-205"
          style={{
            color: COLORS.muted,
            borderColor: COLORS.border,
            gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1.2fr 1fr 0.8fr",
          }}
        >
          <div>TITLE</div>
          <div>PILLAR</div>
          <div>AUTHOR</div>
          <div>STATUS</div>
          <div>PUBLISHED DATE</div>
          <div>UPDATED</div>
          <div></div>
        </div>

        {filteredStories.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
            No stories in this view yet. Click "New story" to create one.
          </div>
        )}

        {filteredStories.map((story) => {
          const pillar = getPillar(story.pillar)
          const isPublished = story.status === 'published'
          const statusStyle = STATUS_STYLES[story.status] || STATUS_STYLES.draft
          
          return (
            <div
              key={story.id}
              className="grid items-center px-5 py-4 border-b last:border-b-0 min-w-205"
              style={{
                borderColor: COLORS.border,
                gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1.2fr 1fr 0.8fr",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md" style={{ background: COLORS.panelAlt }}>
                  {story.thumbnail && (
                    <img src={story.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="font-semibold text-sm" style={{ color: COLORS.text }}>
                  {story.title}
                </span>
              </div>
              <div>
                {pillar && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pillar.chipClass}`}>
                    {pillar.label}
                  </span>
                )}
              </div>
              <div className="text-sm" style={{ color: COLORS.muted }}>
                {story.author}
              </div>
              <div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle}`}>
                  {STATUS_LABELS[story.status] || story.status}
                </span>
                {isPublished && (
                  <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-anika-green animate-pulse"></span>
                )}
              </div>
              <div className="text-sm" style={{ color: COLORS.muted }}>
                {story.date ? new Date(story.date).toLocaleDateString() : '—'}
              </div>
              <div className="text-sm" style={{ color: COLORS.muted }}>
                {new Date(story.updated).toLocaleDateString()}
              </div>
              <div className="flex justify-end gap-2">
                {isPublished && (
                  <a
                    href={`/stories/${story.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-black/5"
                    title="View on website"
                  >
                    <Eye size={16} style={{ color: COLORS.muted }} />
                  </a>
                )}
                <button
                  onClick={() => openEditStory(story)}
                  className="p-1.5 rounded-lg hover:bg-black/5"
                  title="Edit story"
                >
                  <Edit size={16} style={{ color: COLORS.muted }} />
                </button>
                <button
                  onClick={() => handleDelete(story)}
                  className="p-1.5 rounded-lg hover:bg-black/5"
                  title="Delete story"
                >
                  <Trash2 size={16} style={{ color: "#b23b3b" }} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredStories.map((story) => {
          const pillar = getPillar(story.pillar)
          const isPublished = story.status === 'published'
          const isExpanded = expandedId === story.id
          const statusStyle = STATUS_STYLES[story.status] || STATUS_STYLES.draft

          return (
            <div
              key={story.id}
              style={{ 
                background: COLORS.panel, 
                border: `1px solid ${COLORS.border}` 
              }}
              className="rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: COLORS.panelAlt }}>
                  {story.thumbnail && (
                    <img src={story.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: COLORS.text }}>
                    {story.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {pillar && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pillar.chipClass}`}>
                        {pillar.label}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
                      {STATUS_LABELS[story.status] || story.status}
                    </span>
                    {isPublished && (
                      <span className="inline-block h-2 w-2 rounded-full bg-anika-green animate-pulse"></span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(story.id)}
                  className="shrink-0 p-1 rounded-lg hover:bg-black/5"
                >
                  {isExpanded ? <ChevronUp size={20} style={{ color: COLORS.muted }} /> : <ChevronDown size={20} style={{ color: COLORS.muted }} />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs" style={{ color: COLORS.muted }}>Author</p>
                      <p className="font-medium" style={{ color: COLORS.text }}>{story.author}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: COLORS.muted }}>Published Date</p>
                      <p className="font-medium" style={{ color: COLORS.text }}>
                        {story.date ? new Date(story.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs" style={{ color: COLORS.muted }}>Last Updated</p>
                      <p className="font-medium" style={{ color: COLORS.text }}>
                        {new Date(story.updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                    {isPublished && (
                      <a
                        href={`/stories/${story.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          border: `1px solid ${COLORS.border}`, 
                          background: COLORS.panel, 
                          color: COLORS.text 
                        }}
                        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold"
                      >
                        <Eye size={14} />
                        View
                      </a>
                    )}
                    <button
                      onClick={() => openEditStory(story)}
                      style={{ 
                        border: `1px solid ${COLORS.border}`, 
                        background: COLORS.panel, 
                        color: COLORS.text 
                      }}
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold hover:border-current"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(story)}
                      style={{ 
                        border: `1px solid ${COLORS.border}`, 
                        background: COLORS.panel, 
                        color: COLORS.text 
                      }}
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold hover:border-red-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filteredStories.length === 0 && (
          <div
            style={{ background: COLORS.panel, border: `1px dashed ${COLORS.border}`, color: COLORS.muted }}
            className="rounded-xl p-10 text-center text-sm"
          >
            No stories in this view yet. Click "New story" to create one.
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        storyTitle={deleteConfirm?.title || ""}
        colors={COLORS}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default Stories