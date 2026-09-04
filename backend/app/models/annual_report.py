from datetime import datetime, timezone

from ..extensions import db


class AnnualReport(db.Model):
    __tablename__ = "annual_reports"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(500), nullable=False)  # Cloudinary URL

    uploaded_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    uploaded_by = db.relationship("User")
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "uploadedBy": self.uploaded_by.name if self.uploaded_by else None,
            "uploadedAt": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }

    def __repr__(self):
        return f"<AnnualReport {self.name}>"