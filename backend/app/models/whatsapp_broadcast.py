from datetime import datetime

from app.extensions import db

BROADCAST_STATUSES = ("Sent", "Delivered", "Scheduled", "Failed")


class WhatsAppBroadcast(db.Model):
    __tablename__ = "whatsapp_broadcasts"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    audience = db.Column(db.String(120), nullable=False, default="All opted-in")
    channel = db.Column(db.String(40), nullable=False, default="WhatsApp")
    recipients = db.Column(db.Integer, nullable=False, default=0)
    date = db.Column(db.String(64), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="Sent")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Shape consumed by the admin WhatsApp Broadcast page."""
        return {
            "id": self.id,
            "title": self.title,
            "audience": self.audience,
            "channel": self.channel,
            "recipients": self.recipients,
            "date": self.date or (self.created_at.strftime("%d %b %Y") if self.created_at else ""),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<WhatsAppBroadcast {self.title} ({self.status})>"
