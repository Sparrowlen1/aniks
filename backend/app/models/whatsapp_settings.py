from datetime import datetime

from app.extensions import db

DEFAULT_ANSWERS = {
    "events": "Our next events are posted on anikainitiative.com/events. Sema-Anika Forum is coming up soon, want me to share the registration link?",
    "apply": "You can apply to the Pan-African Arts Alliance at anikainitiative.com/alliance. Reply ALLIANCE and I will guide you through it.",
    "donate": "You can support ANIKA at anikainitiative.com/donate with M-Pesa or card. Every donation gets an instant receipt.",
    "human": "Switching you to a member of the ANIKA team now. Someone will reply here shortly.",
    "default": "Sorry, I did not quite catch that. Reply 1 for events, 2 to apply, 3 to donate, or 4 to talk to a human.",
}

DEFAULT_FLOWS = {
    "confirmRegistration": True,
    "sendReminder24h": True,
    "sendFeedback24h": True,
    "humanEscalation": True,
    "optOut": True,
}

DEFAULT_GREETING = (
    "Hello! Welcome to ANIKA Initiative. Reply with a number:\n"
    "1) Upcoming events\n2) How to apply\n3) How to donate\n4) Talk to a human"
)


class WhatsAppSettings(db.Model):
    __tablename__ = "whatsapp_settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(40), nullable=False, unique=True, default="assistant")
    menu_enabled = db.Column(db.Boolean, nullable=False, default=True)
    greeting = db.Column(db.Text, nullable=False, default=DEFAULT_GREETING)
    answers = db.Column(db.JSON, nullable=False, default=dict)
    flows = db.Column(db.JSON, nullable=False, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Shape consumed by the admin WhatsApp Assistant page."""
        return {
            "id": self.id,
            "key": self.key,
            "menuEnabled": self.menu_enabled,
            "greeting": self.greeting,
            "answers": self.answers or DEFAULT_ANSWERS,
            "flows": self.flows or DEFAULT_FLOWS,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<WhatsAppSettings {self.key}>"
