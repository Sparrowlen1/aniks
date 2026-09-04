from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.event import Event
from app.models.registration import REGISTRATION_STATUSES, Registration
from app.models.whatsapp_conversation import WhatsAppConversation
from app.utils.phone import normalize_phone


def find_event_by_title(title):
    """Find an event by its title (case-insensitive)."""
    if not title:
        return None
    return Event.query.filter(
        db.func.lower(Event.title) == title.strip().lower()
    ).first()


def sync_event_seats(event, delta):
    """Bump an event's registered count and flip status between Live/Full.

    Registered count never goes below 0. If the event hits capacity it is
    marked Full (unless already Ended); freeing a seat returns it to Live.
    """
    if not event:
        return
    event.registered = max(0, (event.registered or 0) + delta)
    if event.status == "Ended":
        return
    if event.capacity and event.registered >= event.capacity:
        event.status = "Full"
    elif event.status == "Full" and event.registered < (event.capacity or 0):
        event.status = "Live"

registrations_bp = Blueprint("registrations", __name__, url_prefix="/api/registrations")


@registrations_bp.post("")
def create_registration():
    """
    Register for an event (public). Also opens/updates a WhatsApp thread for
    the registrant so the assistant flow (confirmation, reminders) can run.
    ---
    tags:
      - Registrations
    summary: Register for an event
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name, phone, eventTitle]
          properties:
            name: {type: string}
            phone: {type: string}
            email: {type: string}
            eventTitle: {type: string}
            source: {type: string, enum: [web, whatsapp, manual]}
            consent: {type: boolean}
    responses:
      201:
        description: Registration created
      400:
        description: Validation error
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    event_title = (data.get("eventTitle") or data.get("event") or "").strip()
    if not name or not phone or not event_title:
        return jsonify({"error": "name, phone and eventTitle are required"}), 400
    phone = normalize_phone(phone)
    if not phone:
      return jsonify({"error": "phone must be a valid international number including country code"}), 400

    registration = Registration(
        name=name,
        phone=phone,
        email=data.get("email"),
        event_title=event_title,
        source=data.get("source", "web"),
        consent=bool(data.get("consent", False)),
        status="Confirmed",
    )
    db.session.add(registration)

    # Keep the linked event's seat count in sync with real registrations.
    sync_event_seats(find_event_by_title(event_title), +1)

    # Open/update a WhatsApp thread for the registrant (assistant flow).
    conversation = WhatsAppConversation.query.filter_by(phone=phone).first()
    message = {
        "from": "them",
        "text": f"Hello, I just registered for {event_title}.",
        "time": "now",
    }
    if conversation:
        conversation.messages = (conversation.messages or []) + [message]
        conversation.preview = message["text"]
        conversation.unread = (conversation.unread or 0) + 1
        conversation.intent = "registration"
    else:
        conversation = WhatsAppConversation(
            name=name,
            phone=phone,
            intent="registration",
            unread=1,
            preview=message["text"],
            messages=[message],
        )
        db.session.add(conversation)

    db.session.commit()
    current_app.logger.info(
        "Registration created: id=%s event=%r", registration.id, event_title
    )

    # Auto-send the WhatsApp confirmation (Anika Assistant outbound flow).
    try:
        from app.services import anika_assistant

        anika_assistant.send_registration_confirmation(registration)
    except Exception:
        current_app.logger.exception(
            "Failed to run registration confirmation for #%s", registration.id
        )

    return jsonify(registration.to_dict()), 201


@registrations_bp.get("")
def list_registrations():
    """
    List registrations (admin), newest first.
    ---
    tags:
      - Registrations
    summary: List registrations
    parameters:
      - name: status
        in: query
        type: string
        enum: [Confirmed, Pending, Waitlist, Canceled]
    responses:
      200:
        description: List of registrations
    """
    status = request.args.get("status")
    query = Registration.query
    if status and status != "All":
        query = query.filter_by(status=status)
    rows = query.order_by(Registration.created_at.desc()).all()
    return jsonify([r.to_dict() for r in rows])


@registrations_bp.patch("/<int:reg_id>")
def update_registration(reg_id):
    """
    Update a registration (admin) - e.g. change status.
    ---
    tags:
      - Registrations
    summary: Update a registration
    parameters:
      - name: reg_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name: {type: string}
            phone: {type: string}
            email: {type: string}
            eventTitle: {type: string}
            consent: {type: boolean}
            source: {type: string}
            status: {type: string, enum: [Confirmed, Pending, Waitlist, Canceled]}
    responses:
      200:
        description: Updated registration
      400:
        description: Invalid status
      404:
        description: Registration not found
    """
    reg = Registration.query.get_or_404(reg_id)
    data = request.get_json(silent=True) or {}
    if "phone" in data:
      data["phone"] = normalize_phone(data["phone"])
      if not data["phone"]:
        return jsonify({"error": "phone must be a valid international number including country code"}), 400

    if "status" in data:
        if data["status"] not in REGISTRATION_STATUSES:
            return jsonify(
                {"error": f"Invalid status. Must be one of {REGISTRATION_STATUSES}"}
            ), 400
        old_status = reg.status
        reg.status = data["status"]
        if old_status != reg.status:
            event = find_event_by_title(reg.event_title)
            if old_status == "Canceled" and reg.status != "Canceled":
                sync_event_seats(event, +1)
            elif reg.status == "Canceled" and old_status != "Canceled":
                sync_event_seats(event, -1)
    for field in ("name", "phone", "email", "consent", "source"):
        if field in data:
            setattr(reg, field, data[field])
    if "eventTitle" in data:
      reg.event_title = data["eventTitle"]
    db.session.commit()
    return jsonify(reg.to_dict())


@registrations_bp.delete("/<int:reg_id>")
def delete_registration(reg_id):
    """
    Delete a registration (admin).
    ---
    tags:
      - Registrations
    summary: Delete a registration
    parameters:
      - name: reg_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Deleted
      404:
        description: Registration not found
    """
    reg = Registration.query.get_or_404(reg_id)
    if reg.status != "Canceled":
        sync_event_seats(find_event_by_title(reg.event_title), -1)
    db.session.delete(reg)
    db.session.commit()
    return jsonify({"message": "Registration deleted", "id": reg_id})
