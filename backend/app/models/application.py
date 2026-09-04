from datetime import datetime

from ..extensions import db

STATUSES = ["New", "Shortlisted", "Accepted", "Rejected"]
SUBJECTS = ["volunteer", "partnership", "artist", "newsletter", "event", "other"]

SUBJECT_LABELS = {
    "volunteer": "Volunteer Sign-up",
    "partnership": "Partnership Enquiry",
    "artist": "Artist Application / Residency",
    "newsletter": "Newsletter Subscription",
    "event": "Event Participation",
    "other": "Other",
}


class Application(db.Model):
    
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(40), nullable=True)
    organisation = db.Column(db.String(200), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    subject = db.Column(db.String(50), nullable=False, default="other")
    message = db.Column(db.Text, nullable=True)
    whatsapp_opt_in = db.Column(db.Boolean, nullable=False, default=False)
    status = db.Column(db.String(20), nullable=False, default="New")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def humanized_submitted(self):
        delta = datetime.utcnow() - self.created_at
        if delta.days <= 0:
            return "Today"
        if delta.days == 1:
            return "Yesterday"
        return f"{delta.days} days ago"

    def to_dict(self):
        """Shape matches what the admin dashboard (Applications.jsx) expects."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "organisation": self.organisation,
            "country": self.country,
            "subject": self.subject,
            "programme": SUBJECT_LABELS.get(self.subject, self.subject),
            "message": self.message,
            "summary": self.message or "No message submitted.",
            "experience": self.organisation or "-",
            "whatsapp_opt_in": self.whatsapp_opt_in,
            "status": self.status,
            "submitted": self.humanized_submitted(),
            "created_at": self.created_at.isoformat() + "Z",
        }
