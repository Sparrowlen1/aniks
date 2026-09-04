from datetime import datetime

from app.extensions import db

EVENT_STATUSES = ("Live", "Draft", "Full", "Ended")


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(64), nullable=True)
    time = db.Column(db.String(64), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    pillar = db.Column(db.String(64), nullable=True)
    capacity = db.Column(db.Integer, nullable=False, default=0)
    registered = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default="Live")
    image = db.Column(db.String(500), nullable=True)
    image_alt = db.Column(db.String(300), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Shape consumed by the admin Events page (Events.jsx)."""
        return {
            "id": self.id,
            "title": self.title,
            "date": self.date,
            "time": self.time,
            "location": self.location,
            "pillar": self.pillar,
            "capacity": self.capacity,
            "registered": self.registered,
            "status": self.status,
            "image": self.image,
            "imageAlt": self.image_alt,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_public_dict(self):
        """Shape consumed by the public Events page (EventList.jsx)."""
        return {
            "id": self.id,
            "pillar": (self.pillar or "").upper(),
            "title": self.title,
            "image": self.image or "/image6.jpg",
            "location": self.location or "Nairobi",
            "dateStr": self.date or "",
            "timeStr": self.time or "",
            "seats": f"{self.capacity} seats" if self.capacity else "Open",
            "description": self.description or "",
            "status": self.status,
        }

    def __repr__(self):
        return f"<Event {self.title} ({self.status})>"
