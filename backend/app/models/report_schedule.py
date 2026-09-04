import json
from datetime import datetime, timezone

from ..extensions import db


class ReportSchedule(db.Model):
    __tablename__ = "report_schedules"

    id = db.Column(db.Integer, primary_key=True)

    # Stored as a JSON-encoded list of report type ids, e.g. '["donor","impact"]'
    # -- SQLite/Postgres both handle this fine as text; avoids needing a
    # separate join table for what's really just a small fixed checklist.
    report_types = db.Column(db.Text, nullable=False)

    frequency = db.Column(db.String(20), nullable=False)  # Weekly | Monthly | Quarterly | Annually
    weekday = db.Column(db.String(20), nullable=True)      # set when frequency == Weekly
    day_of_month = db.Column(db.Integer, nullable=True)    # set when Monthly or Quarterly
    specific_date = db.Column(db.String(10), nullable=True)  # ISO date string, set when Annually

    send_to = db.Column(db.String(255), nullable=False)
    format = db.Column(db.String(10), nullable=False)  # PDF | Excel

    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_by = db.relationship("User")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "reportTypes": json.loads(self.report_types),
            "frequency": self.frequency,
            "weekday": self.weekday,
            "dayOfMonth": self.day_of_month,
            "specificDate": self.specific_date,
            "sendTo": self.send_to,
            "format": self.format,
            "createdBy": self.created_by.name if self.created_by else None,
            "createdByEmail": self.created_by.email if self.created_by else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ReportSchedule {self.id} {self.frequency} -> {self.send_to}>"