from datetime import datetime

from app.extensions import db

INTENTS = ("escalation", "faq", "alliance", "donation", "registration", "general")


class WhatsAppConversation(db.Model):
    __tablename__ = "whatsapp_conversations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40), nullable=False)
    intent = db.Column(db.String(20), nullable=False, default="general")
    unread = db.Column(db.Integer, nullable=False, default=0)
    preview = db.Column(db.String(300), nullable=True)
    resolved = db.Column(db.Boolean, nullable=False, default=False)
    opted_out = db.Column(db.Boolean, nullable=False, default=False)
    messages = db.Column(db.JSON, nullable=False, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Shape consumed by the admin WhatsApp Inbox + Assistant pages."""
        msgs = self.messages or []
        last_text = msgs[-1]["text"] if msgs else ""
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "intent": self.intent,
            "unread": self.unread,
            "time": self.updated_at.strftime("%H:%M") if self.updated_at else "",
            "preview": self.preview or last_text,
            "last": self.preview or last_text,
            "resolved": self.resolved,
            "optedOut": self.opted_out,
            "messages": msgs,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<WhatsAppConversation {self.name} ({self.intent})>"
