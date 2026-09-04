import json
from datetime import datetime, timezone

from ..extensions import db


class ExportLog(db.Model):
    """
    One row per scheduled report that actually fired and was emailed.
    Written by the (not yet built) dispatch job when it runs, this model
    and the GET route below just make the history queryable/displayable.
    There's no POST route for this yet: the dispatch job will live in the
    same backend process and can insert rows directly via this model,
    without needing to go through HTTP.
    """
    __tablename__ = "export_logs"

    id = db.Column(db.Integer, primary_key=True)

    report_types = db.Column(db.Text, nullable=False)  # JSON list, same encoding as ReportSchedule
    format = db.Column(db.String(10), nullable=False)  # PDF | Excel | CSV
    sent_to = db.Column(db.String(255), nullable=False)

    # Nullable: a schedule could be deleted later without losing its export
    # history, and this also allows for a future "generate now" manual
    # export that isn't tied to any saved schedule at all.
    schedule_id = db.Column(db.Integer, db.ForeignKey("report_schedules.id"), nullable=True)

    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "reportTypes": json.loads(self.report_types),
            "format": self.format,
            "sentTo": self.sent_to,
            "scheduleId": self.schedule_id,
            "generatedAt": self.generated_at.isoformat() if self.generated_at else None,
        }

    def __repr__(self):
        return f"<ExportLog {self.id} -> {self.sent_to}>"