from datetime import datetime

from app.extensions import db

REGISTRATION_STATUSES = ("Confirmed", "Pending", "Waitlist", "Canceled")


class Registration(db.Model):
    __tablename__ = "registrations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    event_title = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(20), nullable=False, default="web")
    consent = db.Column(db.Boolean, nullable=False, default=False)
    status = db.Column(db.String(20), nullable=False, default="Confirmed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def humanized_date(self):
        delta = datetime.utcnow() - self.created_at
        if delta.days <= 0:
            return "Today"
        if delta.days == 1:
            return "Yesterday"
        return f"{delta.days} days ago"

    def to_dict(self):
        """Shape consumed by the admin Registrations page (Registrations.jsx)."""
        return {
            "id": self.id,
            "name": self.name,
            "event": self.event_title,
            "eventTitle": self.event_title,
            "phone": self.phone,
            "email": self.email,
            "date": self.humanized_date(),
            "source": self.source.capitalize(),
            "consent": self.consent,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Registration {self.name} -> {self.event_title}>"
