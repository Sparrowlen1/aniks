import json
import uuid

import cloudinary.uploader
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity

from ..extensions import db
from ..models.export_log import ExportLog
from ..models.annual_report import AnnualReport
from ..models.report_schedule import ReportSchedule
from ..utils.decorators import require_permission, require_role

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

VALID_REPORT_TYPES = {"donor", "event", "impact", "contacts"}
VALID_FREQUENCIES = {"Weekly", "Monthly", "Quarterly", "Annually"}
VALID_FORMATS = {"PDF", "Excel", "CSV"}


def _can_manage_schedule(schedule):
    """Leadership can manage any schedule; MEL only their own."""
    role = get_jwt().get("role")
    if role == "leadership":
        return True
    return str(schedule.created_by_id) == str(get_jwt_identity())


def _validate_schedule_payload(data):
    report_types = data.get("reportTypes")
    if not isinstance(report_types, list) or not report_types:
        return "reportTypes must be a non-empty list"
    if not set(report_types).issubset(VALID_REPORT_TYPES):
        return f"reportTypes must be a subset of {sorted(VALID_REPORT_TYPES)}"

    frequency = data.get("frequency")
    if frequency not in VALID_FREQUENCIES:
        return f"frequency must be one of {sorted(VALID_FREQUENCIES)}"

    if frequency == "Weekly" and not data.get("weekday"):
        return "weekday is required when frequency is Weekly"
    if frequency in ("Monthly", "Quarterly") and not data.get("dayOfMonth"):
        return "dayOfMonth is required when frequency is Monthly or Quarterly"
    if frequency == "Annually" and not data.get("specificDate"):
        return "specificDate is required when frequency is Annually"

    if not data.get("sendTo"):
        return "sendTo is required"

    if data.get("format") not in VALID_FORMATS:
        return f"format must be one of {sorted(VALID_FORMATS)}"

    return None


# SCHEDULES

@reports_bp.get("/schedules")
@require_permission("reports")
def list_schedules():
    """Leadership and MEL both see every schedule -- the frontend hides
    edit/delete controls per-row based on ownership, this just returns
    everything so nothing's hidden from either role."""
    schedules = ReportSchedule.query.order_by(ReportSchedule.created_at.desc()).all()
    return jsonify([s.to_dict() for s in schedules]), 200


@reports_bp.post("/schedules")
@require_permission("reports")
def create_schedule():
    data = request.get_json(silent=True) or {}
    error = _validate_schedule_payload(data)
    if error:
        return jsonify({"error": error}), 400

    schedule = ReportSchedule(
        report_types=json.dumps(data["reportTypes"]),
        frequency=data["frequency"],
        weekday=data.get("weekday"),
        day_of_month=data.get("dayOfMonth"),
        specific_date=data.get("specificDate"),
        send_to=data["sendTo"],
        format=data["format"],
        created_by_id=int(get_jwt_identity()),
    )
    db.session.add(schedule)
    db.session.commit()
    return jsonify(schedule.to_dict()), 201


@reports_bp.patch("/schedules/<int:schedule_id>")
@require_permission("reports")
def update_schedule(schedule_id):
    schedule = ReportSchedule.query.get_or_404(schedule_id)
    if not _can_manage_schedule(schedule):
        return jsonify({
            "error": "forbidden",
            "message": "You can only edit schedules you created",
        }), 403

    data = request.get_json(silent=True) or {}
    error = _validate_schedule_payload(data)
    if error:
        return jsonify({"error": error}), 400

    schedule.report_types = json.dumps(data["reportTypes"])
    schedule.frequency = data["frequency"]
    schedule.weekday = data.get("weekday")
    schedule.day_of_month = data.get("dayOfMonth")
    schedule.specific_date = data.get("specificDate")
    schedule.send_to = data["sendTo"]
    schedule.format = data["format"]

    db.session.commit()
    return jsonify(schedule.to_dict()), 200


@reports_bp.delete("/schedules/<int:schedule_id>")
@require_permission("reports")
def delete_schedule(schedule_id):
    schedule = ReportSchedule.query.get_or_404(schedule_id)
    if not _can_manage_schedule(schedule):
        return jsonify({
            "error": "forbidden",
            "message": "You can only delete schedules you created",
        }), 403

    db.session.delete(schedule)
    db.session.commit()
    return jsonify({"deleted": True, "id": schedule_id}), 200

# EXPORT HISTORY

@reports_bp.get("/exports")
@require_permission("reports")
def list_exports():
    """History of scheduled reports that actually fired and were emailed.
    Empty until the dispatch job exists and runs for the first time --
    that's expected, not a bug: nothing's fired yet, so nothing's here yet."""
    exports = ExportLog.query.order_by(ExportLog.generated_at.desc()).limit(50).all()
    return jsonify([e.to_dict() for e in exports]), 200


# ANNUAL REPORT

@reports_bp.get("/annual")
def get_annual_report_public():
    """Public -- no auth. This is what the public site's impact/downloads
    page calls to show the current annual report link to donors/partners."""
    report = AnnualReport.query.order_by(AnnualReport.uploaded_at.desc()).first()
    if not report:
        return jsonify({"error": "No annual report uploaded yet"}), 404
    return jsonify(report.to_dict()), 200


@reports_bp.post("/annual")
@require_permission("reports")
def upload_annual_report():
    """Leadership and MEL can upload/replace. Only one record ever exists --
    uploading a new one deletes whatever was there before."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "" or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "A PDF file is required"}), 400

    try:
        result = cloudinary.uploader.upload(
            file,
            folder="anika_reports",
            public_id=str(uuid.uuid4()),
            resource_type="raw",
        )
    except Exception as exc: 
        current_app.logger.error("Cloudinary annual report upload failed: %s", exc)
        return jsonify({"error": "Upload to storage provider failed"}), 502

    # Replace-only: remove whatever was there before, so there's always
    # exactly one row, matching the "latest report only" spec.
    AnnualReport.query.delete()

    report = AnnualReport(
        name=file.filename,
        url=result["secure_url"],
        uploaded_by_id=int(get_jwt_identity()),
    )
    db.session.add(report)
    db.session.commit()

    return jsonify(report.to_dict()), 201


@reports_bp.delete("/annual")
@require_role("leadership")
def delete_annual_report():
    AnnualReport.query.delete()
    db.session.commit()
    return jsonify({"deleted": True}), 200