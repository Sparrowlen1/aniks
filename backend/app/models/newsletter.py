# app/models/newsletter.py
from datetime import datetime
from app.extensions import db

class NewsletterSubscriber(db.Model):
    __tablename__ = "newsletter_subscribers"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    unsubscribed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "subscribed_at": self.subscribed_at.isoformat() + "Z",
            "is_active": self.is_active,
        }

    def __repr__(self):
        return f"<NewsletterSubscriber {self.email}>"