"""Anika Assistant - the WhatsApp bot engine.

Processes inbound WhatsApp messages, answers the FAQ menu, escalates HELP to
staff, handles STOP opt-outs and persists every interaction into the inbox
(WhatsAppConversation) so the admin dashboard and assistant page reflect it.

Keep this module free of web/Flask request concerns: routes call
``handle_inbound_message(payload)`` with a raw Graph API payload and the
module does the rest.
"""

import logging

from flask import current_app

from app.extensions import db
from app.models.whatsapp_conversation import WhatsAppConversation
from app.models.whatsapp_settings import (
    DEFAULT_ANSWERS,
    DEFAULT_FLOWS,
    DEFAULT_GREETING,
    WhatsAppSettings,
)
from app.services import whatsapp_cloud

logger = logging.getLogger(__name__)

# Keywords that map a visitor message to one of the FAQ answers.
_EVENTS_WORDS = ("1", "event", "events", "upcoming", "when")
_APPLY_WORDS = ("2", "apply", "alliance", "join", "member", "membership")
_DONATE_WORDS = ("3", "donate", "donation", "support", "gift")
_HUMAN_WORDS = ("4", "human", "agent", "person", "talk")
_STOP_WORDS = ("stop", "stop all", "unsubscribe", "optout", "opt out", "quit")


def load_settings():
    """Return the assistant settings row (created from defaults on first use)."""
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


def _mentions(words, text):
    lowered = text.lower()
    for w in words:
        if lowered == w or lowered.startswith(w) or f" {w} " in f" {lowered} ":
            return True
    return False


def resolve_reply(text, settings):
    """Map a visitor message to (reply_text, flags).

    flags is a dict with: opt_out, escalate, intent.
    """
    stripped = (text or "").strip()
    upper = stripped.upper()
    flows = settings.flows or DEFAULT_FLOWS
    answers = settings.answers or DEFAULT_ANSWERS

    if flows.get("optOut", True) and _mentions(_STOP_WORDS, stripped):
        return (
            (
                "You have been unsubscribed from ANIKA updates. "
                "You will not receive any more messages from us. "
                "Reply any time to opt back in."
            ),
            {"opt_out": True, "escalate": False, "intent": "general"},
        )

    if flows.get("humanEscalation", True) and (
        upper == "HELP"
        or upper.startswith("HELP ")
        or _mentions(_HUMAN_WORDS, stripped)
    ):
        return (
            answers.get("human", DEFAULT_ANSWERS["human"]),
            {"opt_out": False, "escalate": True, "intent": "escalation"},
        )

    if _mentions(_EVENTS_WORDS, stripped):
        return (
            answers.get("events", DEFAULT_ANSWERS["events"]),
            {"opt_out": False, "escalate": False, "intent": "faq"},
        )
    if _mentions(_APPLY_WORDS, stripped):
        return (
            answers.get("apply", DEFAULT_ANSWERS["apply"]),
            {"opt_out": False, "escalate": False, "intent": "alliance"},
        )
    if _mentions(_DONATE_WORDS, stripped):
        return (
            answers.get("donate", DEFAULT_ANSWERS["donate"]),
            {"opt_out": False, "escalate": False, "intent": "donation"},
        )

    return (
        answers.get("default", DEFAULT_ANSWERS["default"]),
        {"opt_out": False, "escalate": False, "intent": "faq"},
    )


def parse_inbound_payload(payload):
    """Extract (from_name, from_phone, text) from a Graph API webhook payload."""
    try:
        entry = payload["entry"][0]
        change = entry["changes"][0]["value"]
        message = change["messages"][0]
        contact = (change.get("contacts") or [{}])[0]
        name = contact.get("profile", {}).get("name") or (entry.get("id") or "Visitor")
        phone = message.get("from", "")
        text = ""
        if message.get("type") == "text":
            text = message["text"].get("body", "")
        return name, phone, text
    except (KeyError, IndexError, TypeError):
        return None, None, None


def handle_inbound_message(payload, send_out=True):
    """Process one inbound webhook payload end to end.

    Persists the visitor message + bot reply in the conversation, honours
    opt-out / escalation, and sends the reply (simulated when unconfigured).
    ``send_out`` is turned off by the simulate endpoint so exercising the bot
    from the dashboard never pushes a real WhatsApp message.
    """
    name, phone, text = parse_inbound_payload(payload)
    if not text or not phone:
        logger.info("Ignored non-text WhatsApp event")
        return False

    settings = load_settings()
    reply, flags = resolve_reply(text, settings)

    conversation = WhatsAppConversation.query.filter_by(phone=phone).first()
    bot_message = {"from": "me", "text": reply, "time": "now"}
    user_message = {"from": "them", "text": text, "time": "now"}

    resubscribed = False
    if conversation:
        # Re-subscribe: any message after opting out (that is not itself an
        # opt-out command) brings the contact back into the audience.
        if conversation.opted_out and not flags["opt_out"]:
            conversation.opted_out = False
            resubscribed = True
        conversation.messages = (conversation.messages or []) + [
            user_message, bot_message
        ]
        conversation.preview = text
        conversation.unread = 0
        if flags["opt_out"]:
            conversation.opted_out = True
        if flags["escalate"]:
            conversation.intent = "escalation"
            conversation.resolved = False
        else:
            conversation.intent = flags["intent"]
    else:
        conversation = WhatsAppConversation(
            name=name,
            phone=phone,
            intent=flags["intent"],
            unread=0,
            preview=text,
            opted_out=flags["opt_out"],
            resolved=False,
            messages=[user_message, bot_message],
        )
        db.session.add(conversation)
        resubscribed = False

    if resubscribed:
        resub_message = {
            "from": "me",
            "text": (
                "Welcome back! You are subscribed to ANIKA updates again. "
                "Reply 1 for events, 2 to apply, 3 to donate, or 4 to talk to a human."
            ),
            "time": "now",
        }
        conversation.messages = (conversation.messages or []) + [resub_message]
        reply = resub_message["text"]

    db.session.commit()

    current_app.logger.info(
        "Assistant: %s (%s) -> intent=%s opt_out=%s",
        name, phone, conversation.intent, flags["opt_out"],
    )

    if send_out:
        try:
            result = whatsapp_cloud.send_text_message(phone, reply)
            current_app.logger.info(
                "Assistant reply to %s: %s", phone, result["status"]
            )
        except Exception:
            current_app.logger.exception("Assistant failed to send reply to %s", phone)

    return True


def send_registration_confirmation(registration):
    """Send the event-registration confirmation to a registrant's phone."""
    settings = load_settings()
    flows = settings.flows or DEFAULT_FLOWS
    if not flows.get("confirmRegistration", True):
        return None

    body = (
        f"Thank you, {registration.name}!\n"
        f"Your seat for '{registration.event_title}' is confirmed.\n"
        "You will receive a reminder 24 hours before the event. "
        "Reply HELP to talk to a human, or STOP to unsubscribe."
    )

    conversation = WhatsAppConversation.query.filter_by(
        phone=registration.phone
    ).first()
    bot_message = {"from": "me", "text": body, "time": "now"}
    user_message = {
        "from": "them",
        "text": f"Hello, I just registered for {registration.event_title}.",
        "time": "now",
    }
    if conversation:
        conversation.messages = (conversation.messages or []) + [bot_message]
    else:
        conversation = WhatsAppConversation(
            name=registration.name,
            phone=registration.phone,
            intent="registration",
            unread=0,
            preview=user_message["text"],
            messages=[user_message, bot_message],
        )
        db.session.add(conversation)
    db.session.commit()

    try:
        return whatsapp_cloud.send_text_message(registration.phone, body)
    except Exception:
        current_app.logger.exception(
            "Failed to send registration confirmation to %s", registration.phone
        )
        return None
