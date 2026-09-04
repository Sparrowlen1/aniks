from datetime import datetime

from app.extensions import db


class GalleryImage(db.Model):
    __tablename__ = "gallery_images"

    id = db.Column(db.Integer, primary_key=True)
    caption = db.Column(db.String(200), nullable=False, default="Untitled")
    url = db.Column(db.String(500), nullable=False)
    public_id = db.Column(db.String(300), nullable=True)
    extension = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        """
        Shaped to match what Gallery.jsx (public) and Gallery.jsx (admin)
        already expect: `src` + `alt` for the public page, `caption` for
        the admin tiles. Both are included so neither file needs remapping.
        """
        return {
            "id": self.id,
            "src": self.url,
            "alt": self.caption,
            "caption": self.caption,
            "extension": self.extension,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<GalleryImage id={self.id} caption={self.caption!r}>"
