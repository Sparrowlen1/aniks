from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.whatsapp_conversation import WhatsAppConversation, INTENTS
from app.models.whatsapp_broadcast import WhatsAppBroadcast, BROADCAST_STATUSES
from app.models.whatsapp_settings import (
    WhatsAppSettings,
    DEFAULT_ANSWERS,
    DEFAULT_FLOWS,
    DEFAULT_GREETING,
)
from app.utils.phone import normalize_phone
import time

whatsapp_bp = Blueprint("whatsapp", __name__)


# ---- Inbox ---------------------------------------------------------------

@whatsapp_bp.get("/api/whatsapp-inbox")
def list_conversations():
    """
    List WhatsApp conversations (admin inbox), most recently active first.
    ---
    tags:
      - WhatsApp
    summary: List inbox conversations
    responses:
      200:
        description: List of conversations
    """
    rows = WhatsAppConversation.query.order_by(
        WhatsAppConversation.updated_at.desc()
    ).all()
    return jsonify([c.to_dict() for c in rows])


@whatsapp_bp.post("/api/whatsapp-inbox")
def create_conversation():
    """
    Create a WhatsApp conversation thread (admin / internal).
    ---
    tags:
      - WhatsApp
    summary: Create a conversation
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name, phone]
          properties:
            name: {type: string}
            phone: {type: string}
            intent: {type: string, enum: [escalation, faq, alliance, donation, registration, general]}
            unread: {type: integer}
            preview: {type: string}
            resolved: {type: boolean}
            optedOut: {type: boolean}
            messages: {type: array}
    responses:
      201:
        description: Conversation created
      400:
        description: Validation error
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    if not name or not phone:
        return jsonify({"error": "name and phone are required"}), 400
    phone = normalize_phone(phone)
    if not phone:
      return jsonify({"error": "phone must be a valid international number including country code"}), 400
    conv = WhatsAppConversation(
        name=name,
        phone=phone,
        intent=data.get("intent", "general"),
        unread=int(data.get("unread") or 0),
        preview=data.get("preview"),
        resolved=bool(data.get("resolved", False)),
        opted_out=bool(data.get("optedOut", False)),
        messages=data.get("messages") or [],
    )
    db.session.add(conv)
    db.session.commit()
    return jsonify(conv.to_dict()), 201


@whatsapp_bp.patch("/api/whatsapp-inbox/<int:conv_id>")
def update_conversation(conv_id):
    """
    Update a conversation (admin) - reply, resolve, opt-out, escalate.
    ---
    tags:
      - WhatsApp
    summary: Update a conversation
    parameters:
      - name: conv_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            intent: {type: string, enum: [escalation, faq, alliance, donation, registration, general]}
            unread: {type: integer}
            preview: {type: string}
            resolved: {type: boolean}
            optedOut: {type: boolean}
            messages: {type: array}
    responses:
      200:
        description: Updated conversation
      400:
        description: Invalid intent
      404:
        description: Conversation not found
    """
    conv = WhatsAppConversation.query.get_or_404(conv_id)
    data = request.get_json(silent=True) or {}
    if "intent" in data:
        if data["intent"] not in INTENTS:
            return jsonify({"error": f"Invalid intent. Must be one of {INTENTS}"}), 400
        conv.intent = data["intent"]
    if "messages" in data:
        conv.messages = data["messages"]
    if "preview" in data:
        conv.preview = data["preview"]
    if "unread" in data:
        conv.unread = int(data["unread"] or 0)
    if "resolved" in data:
        conv.resolved = bool(data["resolved"])
    if "optedOut" in data:
        conv.opted_out = bool(data["optedOut"])
    db.session.commit()
    return jsonify(conv.to_dict())


# ---- Broadcasts ----------------------------------------------------------

@whatsapp_bp.get("/api/whatsapp-broadcasts")
def list_broadcasts():
    """
    List WhatsApp broadcasts (admin), newest first.
    ---
    tags:
      - WhatsApp
    summary: List broadcasts
    responses:
      200:
        description: List of broadcasts
    """
    rows = WhatsAppBroadcast.query.order_by(
        WhatsAppBroadcast.created_at.desc()
    ).all()
    return jsonify([b.to_dict() for b in rows])


@whatsapp_bp.post("/api/whatsapp-broadcasts")
def create_broadcast():
    """
    Create a WhatsApp broadcast (admin).
    ---
    tags:
      - WhatsApp
    summary: Create a broadcast
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [title]
          properties:
            title: {type: string}
            audience: {type: string}
            channel: {type: string}
            recipients: {type: integer}
            date: {type: string}
            status: {type: string, enum: [Sent, Delivered, Scheduled, Failed]}
    responses:
      201:
        description: Broadcast created
      400:
        description: Validation error
    """
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400
    status = data.get("status", "Sent")
    if status not in BROADCAST_STATUSES:
        return jsonify(
            {"error": f"Invalid status. Must be one of {BROADCAST_STATUSES}"}
        ), 400
    b = WhatsAppBroadcast(
        title=title,
        audience=data.get("audience", "All opted-in"),
        channel=data.get("channel", "WhatsApp"),
        recipients=int(data.get("recipients") or 0),
        date=data.get("date"),
        status=status,
    )
    db.session.add(b)
    db.session.commit()
    return jsonify(b.to_dict()), 201


# ---- Settings ------------------------------------------------------------

def _get_or_create_settings():
    settings = WhatsAppSettings.query.filter_by(key="assistant").first()
    if not settings:
        settings = WhatsAppSettings(
            key="assistant",
            menu_enabled=True,
            greeting=DEFAULT_GREETING,
            answers=DEFAULT_ANSWERS,
            flows=DEFAULT_FLOWS,
        )
        db.session.add(settings)
        db.session.commit()
    return settings


@whatsapp_bp.get("/api/whatsapp-settings")
def get_settings():
    """
    Get the WhatsApp assistant settings (creates defaults on first call).
    ---
    tags:
      - WhatsApp
    summary: Get assistant settings
    responses:
      200:
        description: Assistant settings
    """
    return jsonify(_get_or_create_settings().to_dict())



@whatsapp_bp.post("/api/whatsapp-settings")
def create_settings():
    """
    Create/upsert the WhatsApp assistant settings (admin). If a record with
    key "assistant" already exists it is updated instead, so the frontend
    can safely save on first use.
    ---
    tags:
      - WhatsApp
    summary: Create or update assistant settings (upsert)
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            key: {type: string}
            menuEnabled: {type: boolean}
            greeting: {type: string}
            answers: {type: object}
            flows: {type: object}
    responses:
      200:
        description: Settings saved (existing record updated)
      201:
        description: Settings created
    """
    data = request.get_json(silent=True) or {}
    settings = WhatsAppSettings.query.filter_by(
        key=data.get("key", "assistant")
    ).first()
    if settings:
        if "menuEnabled" in data:
            settings.menu_enabled = bool(data["menuEnabled"])
        if "greeting" in data:
            settings.greeting = data["greeting"]
        if "answers" in data:
            settings.answers = data["answers"]
        if "flows" in data:
            settings.flows = data["flows"]
        db.session.commit()
        return jsonify(settings.to_dict()), 200
    settings = WhatsAppSettings(
        key=data.get("key", "assistant"),
        menu_enabled=bool(data.get("menuEnabled", True)),
        greeting=data.get("greeting", DEFAULT_GREETING),
        answers=data.get("answers") or DEFAULT_ANSWERS,
        flows=data.get("flows") or DEFAULT_FLOWS,
    )
    db.session.add(settings)
    db.session.commit()
    return jsonify(settings.to_dict()), 201


@whatsapp_bp.patch("/api/whatsapp-settings/<int:settings_id>")
def update_settings(settings_id):
    """
    Update the WhatsApp assistant settings (admin).
    ---
    tags:
      - WhatsApp
    summary: Update assistant settings
    parameters:
      - name: settings_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            menuEnabled: {type: boolean}
            greeting: {type: string}
            answers: {type: object}
            flows: {type: object}
    responses:
      200:
        description: Updated settings
      404:
        description: Settings not found
    """
    settings = WhatsAppSettings.query.get_or_404(settings_id)
    data = request.get_json(silent=True) or {}
    if "menuEnabled" in data:
        settings.menu_enabled = bool(data["menuEnabled"])
    if "greeting" in data:
        settings.greeting = data["greeting"]
    if "answers" in data:
        settings.answers = data["answers"]
    if "flows" in data:
        settings.flows = data["flows"]
    db.session.commit()
    return jsonify(settings.to_dict())


# ---- Stats ---------------------------------------------------------------

@whatsapp_bp.get("/api/whatsapp/stats")
def whatsapp_stats():
    """
    Aggregate WhatsApp live-state shared across Assistant / Inbox / Broadcast.
    ---
    tags:
      - WhatsApp
    summary: Get WhatsApp stats
    responses:
      200:
        description: Aggregated counts
    """
    rows = WhatsAppConversation.query.all()
    return jsonify(
        {
            "threads": len(rows),
            "optedOut": sum(1 for c in rows if c.opted_out),
            "escalated": sum(
                1 for c in rows if c.intent == "escalation" and not c.resolved
            ),
            "unread": sum(c.unread or 0 for c in rows),
        }
    )


# ---- Webhook (Anika Assistant) -------------------------------------------

@whatsapp_bp.get("/api/whatsapp/webhook")
def whatsapp_webhook_verify():
    """
    Meta webhook verification handshake (GET).
    ---
    tags:
      - WhatsApp
    summary: Verify the webhook subscription with Meta
    parameters:
      - name: hub.mode
        in: query
        type: string
        required: true
      - name: hub.verify_token
        in: query
        type: string
        required: true
      - name: hub.challenge
        in: query
        type: string
        required: true
    responses:
      200:
        description: Returns the challenge when verified
      403:
        description: Verification token mismatch
    """
    from app.services import whatsapp_cloud

    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    result = whatsapp_cloud.verify_webhook(mode, token, challenge)
    if result is None:
        current_app.logger.warning("WhatsApp webhook verification rejected")
        return jsonify({"error": "Verification failed"}), 403
    return result, 200


@whatsapp_bp.post("/api/whatsapp/webhook")
def whatsapp_webhook_receive():
    """
    Receive inbound WhatsApp messages from Meta and let the assistant answer.
    ---
    tags:
      - WhatsApp
    summary: Inbound message webhook (Anika Assistant)
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
    responses:
      200:
        description: Acknowledged (assistant handled the message)
      404:
        description: Not a WhatsApp business account event
    """
    from app.services import anika_assistant

    data = request.get_json(silent=True) or {}
    if data.get("object") != "whatsapp_business_account":
        return jsonify({"error": "Unknown webhook event"}), 404

    anika_assistant.handle_inbound_message(data)
    return jsonify({"status": "received"}), 200


@whatsapp_bp.post("/api/whatsapp/simulate")
def whatsapp_simulate():
    """
    Run the Anika Assistant on a visitor message (dashboard live test).

    Builds a synthetic Meta webhook payload so the exact same bot engine as
    production processes the message. The reply is persisted to the inbox but
    never pushed through the WhatsApp Cloud API, regardless of credentials.
    ---
    tags:
      - WhatsApp
    summary: Simulate a visitor message through the assistant
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [phone, message]
          properties:
            name: {type: string}
            phone: {type: string}
            message: {type: string}
    responses:
      200:
        description: Assistant reply
      400:
        description: Validation error
    """
    from app.services import anika_assistant

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "Visitor").strip()
    phone = (data.get("phone") or "").strip()
    message = (data.get("message") or "").strip()
    if not phone or not message:
        return jsonify({"error": "phone and message are required"}), 400
    phone = normalize_phone(phone)
    if not phone:
      return jsonify({"error": "phone must be a valid international number including country code"}), 400

    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "simulated_waid",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "contacts": [
                                {"profile": {"name": name}, "wa_id": phone}
                            ],
                            "messages": [
                                {
                                    "from": phone,
                                    "id": f"sim_{int(time.time() * 1000)}",
                                    "type": "text",
                                    "text": {"body": message},
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }

    handled = anika_assistant.handle_inbound_message(payload, send_out=False)
    if not handled:
        return jsonify({"status": "ignored", "message": message}), 200

    conversation = WhatsAppConversation.query.filter_by(phone=phone).first()
    reply = None
    if conversation:
        for msg in reversed(conversation.messages or []):
            if msg.get("from") == "me":
                reply = msg.get("text")
                break

    return jsonify(
        {
            "status": "replied",
            "reply": reply or "",
            "conversation": conversation.to_dict() if conversation else None,
        }
    ), 200


@whatsapp_bp.get("/api/whatsapp/status")
def whatsapp_status():
    """
    Report whether the WhatsApp Cloud API is configured for real sending.
    ---
    tags:
      - WhatsApp
    summary: Assistant connection status
    responses:
      200:
        description: Configuration status
    """
    from app.services import whatsapp_cloud

    cfg = current_app.config
    return jsonify(
        {
            "configured": whatsapp_cloud.is_configured(),
            "tokenSet": bool(cfg.get("WHATSAPP_TOKEN")),
            "phoneIdSet": bool(cfg.get("WHATSAPP_PHONE_ID")),
            "verifyTokenSet": bool(cfg.get("WHATSAPP_VERIFY_TOKEN")),
            "simulated": not whatsapp_cloud.is_configured(),
        }
    )
