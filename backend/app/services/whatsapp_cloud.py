"""WhatsApp Business Cloud API client.

Sends outbound messages through Meta's Graph API. When WHATSAPP_TOKEN /
WHATSAPP_PHONE_ID are not configured the service runs in *simulated* mode: the
call still returns a success-shaped result and logs the message so the product
stays fully testable before real credentials are added.
"""

import logging

import requests
from flask import current_app

logger = logging.getLogger(__name__)


def is_configured():
    cfg = current_app.config
    return bool(cfg.get("WHATSAPP_TOKEN") and cfg.get("WHATSAPP_PHONE_ID"))


def normalize_phone(raw):
    """Return a bare E.164 number (digits only, leading 254) for a raw input."""
    if not raw:
        return ""
    digits = "".join(ch for ch in str(raw) if ch.isdigit())
    if digits.startswith("0"):
        digits = "254" + digits[1:]
    elif digits.startswith("254"):
        pass
    else:
        digits = "254" + digits
    return digits


def send_text_message(to, body):
    """Send a plain text WhatsApp message to `to`.

    Returns {"status": "sent" | "simulated", "to": ...}. Raises on real API
    failures so callers can log without breaking their own work.
    """
    phone = normalize_phone(to)
    if not phone:
        raise ValueError("Cannot send WhatsApp message without a phone number")

    if not is_configured():
        logger.info("WhatsApp simulated send to %s: %r", phone, body)
        return {"status": "simulated", "to": phone}

    cfg = current_app.config
    url = f"{cfg['WHATSAPP_BASE_URL']}/{cfg['WHATSAPP_PHONE_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {cfg['WHATSAPP_TOKEN']}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": body, "preview_url": False},
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    if not resp.ok:
        logger.error(
            "WhatsApp send failed %s: %s", resp.status_code, resp.text[:500]
        )
        raise RuntimeError(f"WhatsApp send failed with {resp.status_code}")
    data = resp.json()
    logger.info("WhatsApp send OK to %s (message id=%s)", phone, data.get("messages", [{}])[0].get("id"))
    return {"status": "sent", "to": phone, "message_id": data.get("messages", [{}])[0].get("id")}


def verify_webhook(mode, token, challenge):
    """Return the challenge string when the webhook subscription is valid."""
    cfg = current_app.config
    expected = cfg.get("WHATSAPP_VERIFY_TOKEN", "")
    if mode == "subscribe" and expected and token == expected:
        return challenge
    return None