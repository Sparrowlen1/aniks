from flask import Blueprint, current_app, jsonify, request

from app.utils.decorators import require_permission

from ..extensions import db
from ..models import Application
from ..models.application import STATUSES, SUBJECTS
from ..utils.contact_utils import create_contact_from_data
from ..utils.email import (
    send_org_notification,
    send_status_update_email,
    send_user_confirmation,
)
from ..models.newsletter import NewsletterSubscriber  
from app.utils.phone import normalize_phone

applications_bp = Blueprint("applications", __name__, url_prefix="/api/applications")

REQUIRED_FIELDS = ["name", "email", "subject"]


@applications_bp.get("")
@require_permission("applications")
def list_applications():
    """
    List all Get Involved applications
    ---
    tags:
      - Applications
    summary: Get all applications (admin)
    parameters:
      - name: status
        in: query
        type: string
        enum: [New, Shortlisted, Accepted, Rejected]
        description: Filter by status
      - name: subject
        in: query
        type: string
        enum: [volunteer, partnership, artist, newsletter, event, other]
        description: Filter by subject
    responses:
      200:
        description: List of applications, newest first
        schema:
          type: array
          items:
            type: object
    """
    query = Application.query
    status = request.args.get("status")
    subject = request.args.get("subject")

    if status and status != "All":
        query = query.filter_by(status=status)
    if subject:
        query = query.filter_by(subject=subject)

    apps = query.order_by(Application.created_at.desc()).all()
    current_app.logger.info(
        "Listed %d applications (status=%s, subject=%s)", len(apps), status, subject
    )
    return jsonify([a.to_dict() for a in apps])


@applications_bp.post("")
def create_application():
    """
    Submit a Get Involved form entry
    ---
    tags:
      - Applications
    summary: Submit a new application (public)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email, subject]
          properties:
            name:
              type: string
              example: "Joan Mueni"
            email:
              type: string
              example: "joan@example.com"
            phone:
              type: string
              example: "+254712345678"
            organisation:
              type: string
              example: "Kayole Youth Collective"
            country:
              type: string
              example: "Kenya"
            subject:
              type: string
              enum: [volunteer, partnership, artist, newsletter, event, other]
              example: volunteer
            message:
              type: string
              example: "I'd like to help run workshops."
            whatsapp_opt_in:
              type: boolean
              example: true
    responses:
      201:
        description: Application created. Triggers emails.
      400:
        description: Validation error
    """
    data = request.get_json(silent=True) or {}

    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        current_app.logger.warning("Rejected application submission, missing fields: %s", missing)
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    subject = data.get("subject")
    if subject not in SUBJECTS:
        current_app.logger.warning("Rejected application submission, invalid subject: %s", subject)
        return jsonify({"error": f"Invalid subject. Must be one of {SUBJECTS}"}), 400

    phone = (data.get("phone") or "").strip() or None
    if phone:
      phone = normalize_phone(phone)
      if not phone:
        return jsonify({"error": "phone must be a valid international number including country code"}), 400

    entry = Application(
        name=data["name"].strip(),
        email=data["email"].strip(),
        phone=phone,
        organisation=(data.get("organisation") or "").strip() or None,
        country=(data.get("country") or "").strip() or None,
        subject=subject,
        message=(data.get("message") or "").strip() or None,
        whatsapp_opt_in=bool(data.get("whatsapp_opt_in", False)),
        status="New",
    )

    db.session.add(entry)

    create_contact_from_data(
        name=entry.name,
        email=entry.email,
        phone=entry.phone,
        message=entry.message,
        source='getinvolved',
        subject=entry.subject,
        country=entry.country,
        status='new'
    )

    db.session.commit()
    current_app.logger.info(
        "New application #%s created (email=%s, subject=%s)", entry.id, entry.email, subject
    )

    try:
        send_org_notification(entry)
    except Exception:
        current_app.logger.exception(
            "Failed to send org notification email for application #%s", entry.id
        )

    try:
        send_user_confirmation(entry)
    except Exception:
        current_app.logger.exception(
            "Failed to send confirmation email to %s for application #%s", entry.email, entry.id
        )

    return jsonify(entry.to_dict()), 201


@applications_bp.patch("/<int:app_id>")
@require_permission("applications")
def update_application(app_id):
    """
    Update an application's status (e.g. Shortlisted, Accepted, Rejected)
    ---
    tags:
      - Applications
    summary: Update application status (admin)
    parameters:
      - name: app_id
        in: path
        required: true
        type: integer
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [status]
          properties:
            status:
              type: string
              enum: [New, Shortlisted, Accepted, Rejected]
              example: Shortlisted
    responses:
      200:
        description: Updated application
      400:
        description: Invalid status
      404:
        description: Application not found
    """
    entry = Application.query.get_or_404(app_id)
    data = request.get_json(silent=True) or {}
    status = data.get("status")

    if status not in STATUSES:
        current_app.logger.warning("Rejected status update for #%s: %s", app_id, status)
        return jsonify({"error": f"Invalid status. Must be one of {STATUSES}"}), 400

    entry.status = status
    db.session.commit()
    current_app.logger.info("Application #%s status updated to %s", app_id, status)

   
    if entry.subject == 'newsletter' and status == 'Accepted':
        try:
            subscriber = NewsletterSubscriber.query.filter_by(email=entry.email).first()
            if subscriber:

                subscriber.name = entry.name
                if not subscriber.is_active:
                    subscriber.is_active = True
                    subscriber.unsubscribed_at = None
                    db.session.commit()
                    current_app.logger.info(f"Newsletter subscriber re‑activated for {entry.email}")
                else:
                    db.session.commit()
                    current_app.logger.info(f"Newsletter subscriber already active: {entry.email}")
            else:
                new_sub = NewsletterSubscriber(
                    email=entry.email,
                    name=entry.name,
                    is_active=True
                )
                db.session.add(new_sub)
                db.session.commit()
                current_app.logger.info(f"Newsletter subscriber created for {entry.email}")
        except Exception as e:
            current_app.logger.error(f"Failed to create/activate subscriber for {entry.email}: {e}")

  
    try:
        send_status_update_email(entry, status)
    except Exception:
        current_app.logger.exception(
            "Failed to send status update email for application #%s to %s",
            entry.id, entry.email
        )

    return jsonify(entry.to_dict())


@applications_bp.delete("/<int:app_id>")
@require_permission("applications")
def delete_application(app_id):
    """
    Delete an application
    ---
    tags:
      - Applications
    summary: Delete an application (admin)
    parameters:
      - name: app_id
        in: path
        required: true
        type: integer
    responses:
      204:
        description: Deleted
      404:
        description: Application not found
    """
    entry = Application.query.get_or_404(app_id)
    db.session.delete(entry)
    db.session.commit()
    current_app.logger.info("Application #%s deleted", app_id)
    return "", 204