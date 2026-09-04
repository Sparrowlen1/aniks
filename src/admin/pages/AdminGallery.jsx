import { useRef, useState, useEffect } from "react";
import { X, Trash2, Pencil, Check, Upload } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest } from "../utils/api"; 

// configuring light and dark theme
const lightColors = {
  bg: "#fafaf8",
  border: "#e8e5df",
  text: "#1c1a17",
  muted: "#8c8579",
  panel: "#ffffff",
  placeholder: "#f4f1ea",
  overlay: "rgba(0,0,0,0.45)",
  buttonBg: "#1c1a17",
  buttonText: "#ffffff",
  dragBg: "#e8e5df",
};

const darkColors = {
  bg: "#1a1a1a",
  border: "#3a3a3a",
  text: "#f0f0f0",
  muted: "#aaaaaa",
  panel: "#2a2a2a",
  placeholder: "#3a3a3a",
  overlay: "rgba(0,0,0,0.75)",
  buttonBg: "#f0f0f0",
  buttonText: "#1a1a1a",
  dragBg: "#3a3a3a",
};

// ----- Delete Confirmation Modal -----
function DeleteConfirmModal({ item, onClose, onConfirm, colors }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: colors.overlay }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.panel,
          border: `1px solid ${colors.border}`,
        }}
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>
            Confirm Delete
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5"
          >
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="p-5">
          <p style={{ color: colors.text }}>
            Are you sure you want to delete <strong>{item.caption}</strong>?
            This action cannot be undone.
          </p>
        </div>

        <div
          className="flex justify-end gap-2 p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold px-3 py-2"
            style={{ color: colors.muted }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
            style={{
              background: "#b23b3b",
              color: "#ffffff",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({ item, onCaptionChange, onOpen, colors, onDeleteClick }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.caption);

  function save() {
    onCaptionChange(item.id, draft.trim() || "Untitled");
    setEditing(false);
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden group"
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.placeholder,
        aspectRatio: "4 / 3",
        cursor: "pointer",
      }}
      onClick={() => onOpen(item)}
    >
      {item.src ? (
        <img src={item.src} alt={item.caption} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs" style={{ color: "#c9c3b6" }}>
            No image
          </span>
        </div>
      )}

      <div
        className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.45))",
        }}
      >
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-full"
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            title="Edit caption"
          >
            <Pencil size={13} color={colors.text} />
          </button>
          <button
            onClick={() => onDeleteClick(item)}
            className="p-1.5 rounded-full"
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            title="Delete photo"
          >
            <Trash2 size={13} color="#b23b3b" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-3 py-2" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="text-xs px-2 py-1 rounded-md flex-1 outline-none"
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.panel,
                color: colors.text,
              }}
            />
            <button onClick={save} className="p-1 rounded-full bg-white">
              <Check size={13} color="#2d7a43" />
            </button>
          </div>
        ) : (
          <span className="text-xs font-semibold" style={{ color: item.src ? "#fff" : colors.muted }}>
            {item.caption}
          </span>
        )}
      </div>
    </div>
  );
}

function ImageModal({ item, onClose, colors }) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: colors.overlay }}
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.src && (
          <img
            src={item.src}
            alt={item.caption}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          <X size={24} color="#fff" />
        </button>
        {item.caption && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-full">
            {item.caption}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery() {
  const { theme } = useOutletContext();
  const COLORS = theme === "dark" ? darkColors : lightColors;

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchImages = async () => {
    try {
      const data = await apiRequest('/api/gallery');
      setImages(data);
    } catch (err) {
      console.error('Error loading gallery:', err);
      setError(err.message);
      toast.error('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const uploadFile = async (file, caption = '') => {
    if (!file || !(file instanceof File)) {
      toast.error('Invalid file – please select an image.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);

    try {
      const newImage = await apiRequest('/api/gallery', {
        method: 'POST',
        body: formData,
      });
      setImages((prev) => [newImage, ...prev]);
      toast.success(`"${newImage.caption}" uploaded successfully`);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    let uploadedCount = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const caption = file.name.replace(/\.[^/.]+$/, '') || 'Untitled';
      uploadFile(file, caption);
      uploadedCount++;
    }
    if (uploadedCount === 0) {
      toast.warning('No valid image files selected');
    }
  }

  const performDelete = async (id) => {
    try {
      await apiRequest(`/api/gallery/${id}`, { method: 'DELETE' });
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success('Image deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const updateCaption = async (id, newCaption) => {
    try {
      const updated = await apiRequest(`/api/gallery/${id}`, {
        method: 'PATCH',
        body: { caption: newCaption },
      });
      setImages((prev) => prev.map((img) => (img.id === id ? updated : img)));
      toast.success('Caption updated');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(`Update failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div
        style={{ background: COLORS.bg, minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100%', padding: '2rem' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100%' }} className="p-6 font-sans">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Gallery
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Photography from ANIKA's work. Click any image to enlarge.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              background: COLORS.buttonBg,
              color: COLORS.buttonText,
            }}
            className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5"
          >
            <Upload size={14} /> UPLOAD
          </button>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${dragOver ? COLORS.text : COLORS.border}`,
          background: dragOver ? COLORS.dragBg : COLORS.panel,
          transition: 'all 0.2s ease',
        }}
        className="rounded-xl mb-5 p-6 text-center text-sm transition-colors"
      >
        <span style={{ color: COLORS.text }}>
          {dragOver ? 'Drop your images here' : 'Howdy! drag and drop photos here, or use the Upload button above.'}
        </span>
      </div>

      {images.length === 0 ? (
        <div
          style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel }}
          className="rounded-xl p-14 text-center"
        >
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
            No photos yet
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
            Upload the first image to start building the gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {images.map((item) => (
            <Tile
              key={item.id}
              item={item}
              onDelete={performDelete}
              onCaptionChange={updateCaption}
              onOpen={setSelected}
              colors={COLORS}
              onDeleteClick={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ImageModal item={selected} onClose={() => setSelected(null)} colors={COLORS} />

      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={performDelete}
          colors={COLORS}
        />
      )}
    </div>
  );
}