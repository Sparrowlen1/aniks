"""
app/models/settings.py

Single-row table holding org profile + notification preferences for the
admin desk. There's only ever one row (id=1) — treat it like a config
object, not a resource collection.
"""
from datetime import datetime, timezone

from ..extensions import db


class Settings(db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)

    # Organisation profile
    org_name = db.Column(db.String(200), nullable=False, default="ANIKA Initiative")
    org_email = db.Column(db.String(255), nullable=True)
    org_phone = db.Column(db.String(30), nullable=True)

    # Notification preferences
    donation_alerts = db.Column(db.Boolean, nullable=False, default=True)
    application_alerts = db.Column(db.Boolean, nullable=False, default=True)
    whatsapp_alerts = db.Column(db.Boolean, nullable=False, default=True)
    weekly_digest = db.Column(db.Boolean, nullable=False, default=False)

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @classmethod
    def get_singleton(cls):
        """Fetch the one settings row, creating it with defaults if missing."""
        settings = cls.query.get(1)
        if settings is None:
            settings = cls(id=1)
            db.session.add(settings)
            db.session.commit()
        return settings

    def to_dict(self):
        return {
            "org": {
                "name": self.org_name,
                "email": self.org_email,
                "phone": self.org_phone,
            },
            "notifications": {
                "donationAlerts": self.donation_alerts,
                "applicationAlerts": self.application_alerts,
                "whatsappAlerts": self.whatsapp_alerts,
                "weeklyDigest": self.weekly_digest,
            },
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Settings org={self.org_name!r}>"