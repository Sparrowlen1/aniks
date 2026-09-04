import re
from datetime import datetime, timezone

from app.extensions import db

# Canonical pillar slugs — matches src/data/pillars.js on the public site.
# The admin UI uses shorter slugs (arts-culture, youth-migration) and converts
# them to these before saving (see StoryEditor.jsx `buildPayload`), so the
# backend only ever needs to know about this canonical set.
ALLOWED_PILLARS = (
    "arts-and-culture",
    "youth-and-migration",
    "expressions",
    "gender-equality",
    "governance",
)

ALLOWED_STATUSES = ("draft", "review", "published")


def generate_slug(title):
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug or "story"


def content_to_body(html):
    """Mirrors formatContentToBody() from the old storiesStore.js so the
    public site keeps getting a `body` array of plain-text paragraphs."""
    if not html:
        return []
    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", html, flags=re.DOTALL | re.IGNORECASE)
    if paragraphs:
        cleaned = [re.sub(r"<[^>]+>", "", p).strip() for p in paragraphs]
        return [p for p in cleaned if p]
    text = re.sub(r"<[^>]+>", "", html).strip()
    return [text] if text else []


def content_to_excerpt(html, length=160):
    text = re.sub(r"<[^>]+>", "", html or "").strip()
    return text[:length] + ("..." if len(text) > length else "")


class Story(db.Model):
    __tablename__ = "stories"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    pillar = db.Column(db.String(64), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    excerpt = db.Column(db.String(300))
    content = db.Column(db.Text, default="")
    # Plain string for now (gallery path or base64) — swap for an S3/Cloudinary
    # URL once uploads move off localStorage/base64.
    thumbnail = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default="draft")
    author = db.Column(db.String(120), default="You")
    published_date = db.Column(db.Date)  # maps to `date` in the frontend shape
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ---- Serializers -----------------------------------------------------

    def to_admin_dict(self):
        """Shape consumed by admin/pages/stories/Stories.jsx + StoryEditor.jsx."""
        return {
            "id": self.id,
            "slug": self.slug,
            "pillar": self.pillar,
            "title": self.title,
            "excerpt": self.excerpt,
            "content": self.content,
            "body": content_to_body(self.content),
            "thumbnail": self.thumbnail,
            "status": self.status,
            "author": self.author,
            "date": self.published_date.isoformat() if self.published_date else None,
            "updated": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_public_dict(self):
        """Shape consumed by the public Stories feature (StoryCard, StoryDetail)."""
        return {
            "id": self.id,
            "slug": self.slug,
            "pillar": self.pillar,
            "date": self.published_date.isoformat() if self.published_date else None,
            "title": self.title,
            "excerpt": self.excerpt or content_to_excerpt(self.content),
            "image": self.thumbnail or "/placeholder-image.jpg",
            "body": content_to_body(self.content),
        }

    def __repr__(self):
        return f"<Story {self.slug} ({self.status})>"
