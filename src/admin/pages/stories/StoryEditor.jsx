// admin/pages/stories/StoryEditor.jsx
import { useMemo, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Undo2,
  Redo2,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImagePlus,
  ArrowLeft,
  X,
  Check,
  UploadCloud,
} from 'lucide-react'
import { PILLARS, STATUS_LABELS } from './data/pillars'
import { storiesStore } from '../../../data/storiesStore'

// Same light/dark palette as Partners.jsx
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

// Gallery images from AdminGallery
const GALLERY_IMAGES = [
  { id: 1, caption: "ANIKA team", src: "/anika team.jpg" },
  { id: 2, caption: "Jaaziya", src: "/jaaziya.jpg" },
  { id: 3, caption: "KWAJ", src: "/KWAJ.jpg" },
  { id: 4, caption: "PHYL", src: "/PHYL.jpg" },
  { id: 5, caption: "RAYA1", src: "/RAYA1.jpg" },
  { id: 6, caption: "Jojo", src: "/jojo.jpg" },
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors disabled:opacity-30 ${
        active
          ? 'bg-coral/15 text-coral'
          : 'text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-cream/70 dark:hover:bg-white/10 dark:hover:text-cream'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-2xl border border-b-0 border-ink/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 size={16} />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-ink/10 dark:bg-white/10" />

      <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <BoldIcon size={16} />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <ItalicIcon size={16} />
      </ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={16} />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-ink/10 dark:bg-white/10" />

      <ToolbarButton
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="font-display text-xs">H2</span>
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="font-display text-xs">H3</span>
      </ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-ink/10 dark:bg-white/10" />

      <ToolbarButton
        title="Link"
        active={editor.isActive('link')}
        onClick={() => {
          const url = window.prompt('Link URL:', 'https://')
          if (url) editor.chain().focus().setLink({ href: url }).run()
          else if (url === '') editor.chain().focus().unsetLink().run()
        }}
      >
        <LinkIcon size={16} />
      </ToolbarButton>
    </div>
  )
}

// Gallery Picker Modal Component
function GalleryPicker({ onClose, onSelect }) {
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
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
          <h3 className="font-display text-lg tracking-wide">Choose Cover Image</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink dark:text-cream/50 dark:hover:text-cream">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-ink/10 px-5 pt-3 dark:border-white/10">
          <button
            className="rounded-t-lg px-4 py-2 text-sm font-medium bg-coral/15 text-coral"
          >
            Choose from gallery
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GALLERY_IMAGES.map((img) => {
              const active = selectedUrl === img.src
              return (
                <button
                  key={img.id}
                  onClick={() => setSelectedUrl(img.src)}
                  className={`group relative overflow-hidden rounded-xl border text-left transition-colors ${
                    active ? 'border-coral ring-2 ring-coral' : 'border-ink/10 dark:border-white/10'
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-ink/5 dark:bg-white/5">
                    <img src={img.src} alt={img.caption} className="h-full w-full object-cover" />
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

          {/* Upload option */}
          <div className="mt-6 pt-6 border-t border-ink/10 dark:border-white/10">
            <p className="text-xs font-medium text-ink/60 dark:text-cream/60 mb-3">Or upload a new image</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/15 py-6 text-ink/50 hover:border-coral hover:text-coral dark:border-white/15 dark:text-cream/50"
            >
              <UploadCloud size={28} />
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs text-ink/40 dark:text-cream/40">JPG or PNG, up to 5MB</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {uploadPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
                <img src={uploadPreview} alt="Preview" className="aspect-video w-full object-cover" />
              </div>
            )}
          </div>
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

function StoryEditor({ story, onCancel, onSave }) {
  // Get theme from outlet context
  const { theme } = useOutletContext();
  const COLORS = theme === 'dark' ? darkColors : lightColors;

  const [title, setTitle] = useState(story?.title || '')
  const [pillarSlug, setPillarSlug] = useState(() => {
    const mapping = {
      'arts-and-culture': 'arts-culture',
      'youth-and-migration': 'youth-migration',
    };
    const slug = story?.pillar || null;
    return mapping[slug] || slug;
  })
  const [thumbnail, setThumbnail] = useState(story?.thumbnail || null)
  const [isUploading, setIsUploading] = useState(false)
  const [saveState, setSaveState] = useState('Saved')
  const [errors, setErrors] = useState({})
  const [content, setContent] = useState(story?.content || '<p></p>')
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit to include all default extensions
        // including bold, italic, link, etc.
      }),
      Placeholder.configure({ placeholder: 'Start airing the story…' }),
    ],
    content: content,
    onUpdate: ({ editor: e }) => {
      setSaveState('Unsaved changes')
      const html = e.getHTML()
      setContent(html)
    },
  })

  const activePillar = useMemo(() => PILLARS.find((p) => p.slug === pillarSlug), [pillarSlug])

  const handleThumbnailUpload = async (file) => {
    setIsUploading(true);
    try {
      const base64 = await storiesStore.uploadThumbnail(file);
      setThumbnail(base64);
      setSaveState('Unsaved changes');
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      setErrors((prev) => ({ ...prev, thumbnail: 'Failed to upload image. Please try again.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, thumbnail: 'Image must be less than 5MB' }));
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, thumbnail: 'Please upload an image file' }));
      return;
    }
    
    handleThumbnailUpload(file);
  };

  const handleGallerySelect = (url) => {
    setThumbnail(url);
    setSaveState('Unsaved changes');
    setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    setShowGalleryPicker(false);
  };

  function validate() {
    const nextErrors = {}
    if (!pillarSlug) nextErrors.pillar = 'Select a pillar before saving.'
    if (!thumbnail) nextErrors.thumbnail = 'Add a cover image before saving.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload(status) {
    const pillarMapping = {
      'arts-culture': 'arts-and-culture',
      'youth-migration': 'youth-and-migration',
    };
    const publicPillar = pillarMapping[pillarSlug] || pillarSlug;

    return {
      id: story?.id,
      title: title.trim() || 'Untitled story',
      pillar: publicPillar,
      thumbnail: thumbnail,
      content: content,
      status: status,
      author: story?.author || 'You',
      excerpt: story?.excerpt || '',
      date: story?.date || null,
    }
  }

  const [isSaving, setIsSaving] = useState(false)

  async function handleSaveDraft() {
    if (!validate()) return
    setIsSaving(true)
    setSaveState('Saving…')
    try {
      await onSave(buildPayload('draft'))
      setSaveState('Saved')
    } catch (error) {
      console.error('Failed to save draft:', error)
      setSaveState('Save failed — try again')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!validate()) return
    setIsSaving(true)
    setSaveState('Saving…')
    try {
      await onSave(buildPayload('published'))
      setSaveState('Saved')
    } catch (error) {
      console.error('Failed to publish story:', error)
      setSaveState('Save failed — try again')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <style>{`
        .story-editor-input::placeholder {
          color: ${COLORS.inputPlaceholder};
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <button
          onClick={onCancel}
          style={{ 
            border: `1px solid ${COLORS.border}`,
            background: COLORS.panel,
            color: COLORS.text
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 self-start"
        >
          <ArrowLeft size={16} />
          Stories
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: saveState === 'Save failed — try again' ? '#b23b3b' : COLORS.muted }}
          >
            {saveState}
          </span>
          {story?.status === 'published' && story?.slug && (
            <a
              href={`/stories/${story.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-anika-blue/20 px-3 py-2 text-sm font-medium text-anika-blue hover:bg-anika-blue/5"
            >
              View on website
            </a>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            style={{ 
              border: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              color: COLORS.text
            }}
            className="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            style={{ background: COLORS.buttonBg, color: COLORS.buttonText }}
            className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : story?.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Errors */}
      {(errors.pillar || errors.thumbnail) && (
        <div className="rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral mb-6">
          Can't save yet — {[errors.pillar, errors.thumbnail].filter(Boolean).join(' ')}
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left Column - Editor */}
        <div className="flex flex-col">
          {/* Title Input */}
          <div style={{ 
            border: `1px solid ${COLORS.border}`,
            borderBottom: 'none',
            background: COLORS.panel,
          }} className="rounded-t-xl p-4 pb-0">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSaveState('Unsaved changes')
              }}
              placeholder="Story title"
              className="story-editor-input w-full bg-transparent text-xl sm:text-2xl font-bold outline-none"
              style={{ color: COLORS.text }}
            />
          </div>
          
          {/* Toolbar */}
          <Toolbar editor={editor} />
          
          {/* Editor Content */}
          <div style={{ 
            border: `1px solid ${COLORS.border}`,
            background: COLORS.panel,
          }} className="flex-1 rounded-b-xl p-4 sm:p-6 min-h-[300px]">
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none h-full font-body focus:outline-none dark:prose-invert
                [&_.ProseMirror]:h-full [&_.ProseMirror]:focus:outline-none
                prose-headings:font-display prose-headings:font-normal prose-headings:uppercase prose-headings:tracking-wide
                prose-blockquote:font-['Cormorant_Garamond'] prose-blockquote:text-lg prose-blockquote:not-italic prose-blockquote:italic
                prose-blockquote:border-coral prose-blockquote:opacity-90
                prose-a:text-anika-blue prose-a:no-underline hover:prose-a:underline
                [&_.is-editor-empty:first-child]:before:pointer-events-none
                [&_.is-editor-empty:first-child]:before:float-left
                [&_.is-editor-empty:first-child]:before:h-0
                [&_.is-editor-empty:first-child]:before:text-ink/30
                dark:[&_.is-editor-empty:first-child]:before:text-cream/30
                [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
            />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Cover Image */}
          <div style={{ 
            background: COLORS.panel, 
            border: `1px solid ${errors.thumbnail ? '#b23b3b' : COLORS.border}` 
          }} className="rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wide" style={{ color: COLORS.muted }}>
              Cover image <span className="text-coral">*</span>
            </h3>
            <div className="mt-3 aspect-video overflow-hidden rounded-lg" style={{ background: COLORS.panelAlt }}>
              {thumbnail ? (
                <img 
                  src={storiesStore.getImageUrl(thumbnail)} 
                  alt="Story cover" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="flex h-full items-center justify-center" style={{ color: COLORS.muted }}>
                  <ImagePlus size={28} />
                </div>
              )}
            </div>
            
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setShowGalleryPicker(true)}
                className="w-full rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-center gap-2"
                style={{ 
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.panel,
                  color: COLORS.text
                }}
              >
                <ImagePlus size={16} />
                Choose from gallery
              </button>
              
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <div 
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.panel,
                    color: COLORS.text
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Or upload new image'}
                </div>
              </label>
            </div>
            
            {errors.thumbnail && <p className="mt-2 text-xs text-coral">{errors.thumbnail}</p>}
            {thumbnail && storiesStore.getImageUrl(thumbnail).startsWith('data:image/') && (
              <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                ✓ Image saved in localStorage
              </p>
            )}
          </div>

          {/* Gallery Picker Modal */}
          {showGalleryPicker && (
            <GalleryPicker
              onClose={() => setShowGalleryPicker(false)}
              onSelect={handleGallerySelect}
              colors={COLORS}
            />
          )}

          {/* Pillar Selection */}
          <div style={{ 
            background: COLORS.panel, 
            border: `1px solid ${errors.pillar ? '#b23b3b' : COLORS.border}` 
          }} className="rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wide" style={{ color: COLORS.muted }}>
              Pillar <span className="text-coral">*</span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {PILLARS.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => {
                    setPillarSlug(p.slug)
                    setErrors((prev) => ({ ...prev, pillar: undefined }))
                  }}
                  style={{
                    border: `1px solid ${pillarSlug === p.slug ? 'transparent' : COLORS.border}`,
                    background: pillarSlug === p.slug ? COLORS.text : COLORS.panel,
                    color: pillarSlug === p.slug ? COLORS.panel : COLORS.text,
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    pillarSlug === p.slug ? p.ringClass : ''
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {activePillar ? (
              <p className="mt-3 text-xs leading-relaxed" style={{ color: COLORS.muted }}>{activePillar.description}</p>
            ) : (
              <p className="mt-3 text-xs leading-relaxed" style={{ color: COLORS.muted }}>No pillar selected yet.</p>
            )}
            {errors.pillar && <p className="mt-2 text-xs text-coral">{errors.pillar}</p>}
          </div>

          {/* Publication Info */}
          <div style={{ 
            background: COLORS.panel, 
            border: `1px solid ${COLORS.border}` 
          }} className="hidden sm:block rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wide" style={{ color: COLORS.muted }}>
              Publication Info
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.muted }}>Status</span>
                <span className={`font-medium ${
                  story?.status === 'published' 
                    ? 'text-anika-green' 
                    : story?.status === 'review' 
                    ? 'text-anika-blue' 
                    : 'text-gold'
                }`}>
                  {story?.status ? STATUS_LABELS[story.status] || story.status : 'Draft'}
                </span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.muted }}>Published Date</span>
                <span className="font-medium" style={{ color: COLORS.text }}>
                  {story?.date ? new Date(story.date).toLocaleDateString() : 'Not published yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: COLORS.muted }}>Last Updated</span>
                <span className="font-medium" style={{ color: COLORS.muted }}>
                  {story?.updated ? new Date(story.updated).toLocaleString() : 'Just now'}
                </span>
              </div>
              {story?.status === 'published' && story?.date && (
                <div className="mt-2 rounded-lg bg-anika-green/10 px-3 py-2 text-xs text-anika-green">
                  ✓ Published on {new Date(story.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              )}
              {story?.status === 'draft' && (
                <div className="mt-2 rounded-lg bg-gold/10 px-3 py-2 text-xs text-gold">
                  ⏳ Draft - Will be hidden from the website until published
                </div>
              )}
            </div>
          </div>

          {/* Brand Voice Check */}
          <div style={{ 
            background: COLORS.panel, 
            border: `1px solid ${COLORS.border}` 
          }} className="hidden sm:block rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wide" style={{ color: COLORS.muted }}>
              Brand voice check
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Bold', 'Human', 'Expressive', 'Provocative', 'Hopeful'].map((word) => (
                <span
                  key={word}
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ 
                    background: COLORS.panelAlt,
                    color: COLORS.muted
                  }}
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="mt-3 space-y-2 text-xs leading-relaxed">
              <p style={{ color: COLORS.muted }}>
                <span className="mr-1.5 rounded bg-anika-green/15 px-1.5 py-0.5 font-semibold uppercase text-anika-green">Do</span>
                Centre the storyteller's own words and agency. People before programmes.
              </p>
              <p style={{ color: COLORS.muted }}>
                <span className="mr-1.5 rounded bg-coral/15 px-1.5 py-0.5 font-semibold uppercase text-coral">Avoid</span>
                Pity or saviour language — say <em>participant / survivor</em>, not <em>beneficiary / victim</em>.
              </p>
            </div>

            <p className="mt-3 pt-3 font-serif text-sm italic text-coral" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              "Silence Kills. Art Airs."
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default StoryEditor