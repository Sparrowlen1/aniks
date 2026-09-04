"""
Thin wrapper around the Paystack REST API.
Docs: https://paystack.com/docs/api/transaction/
"""
import hashlib
import hmac
import logging

import requests
from flask import current_app

logger = logging.getLogger(__name__)


class PaystackError(Exception):
    """Raised whenever Paystack's API returns status: false, or the request fails."""
    def __init__(self, message, status_code=502, payload=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}


def _headers():
    secret_key = current_app.config.get("PAYSTACK_SECRET_KEY")
    if not secret_key:
        logger.error("PAYSTACK_SECRET_KEY not configured")
        raise PaystackError("PAYSTACK_SECRET_KEY is not configured on the server.", status_code=500)
    return {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json",
    }


def to_subunit(amount) -> int:
    """Convert amount to smallest currency unit (cents/kobo)."""
    return int(round(float(amount) * 100))


def initialize_transaction(
    *,
    email: str,
    amount,
    currency: str,
    reference: str,
    callback_url: str,
    channels=None,
    metadata=None,
):
    """
    Kick off a Paystack transaction. Returns the JSON `data` block.
    """
    base_url = current_app.config["PAYSTACK_BASE_URL"]
    payload = {
        "email": email,
        "amount": to_subunit(amount),
        "currency": currency,
        "reference": reference,
        "callback_url": callback_url,
    }
    if channels:
        payload["channels"] = channels
    if metadata:
        payload["metadata"] = metadata

    # Log the full request details (mask email for privacy)
    masked_email = email[:3] + "..." if len(email) > 3 else email
    logger.info(
        "Paystack initialize: ref=%s, amount=%s %s, currency=%s, channels=%s, email=%s",
        reference, amount, currency, currency, channels, masked_email
    )
    
    # Log the raw payload (excluding email for privacy)
    safe_payload = {**payload}
    if "email" in safe_payload:
        safe_payload["email"] = masked_email
    logger.debug(f"Paystack payload: {safe_payload}")

    try:
        resp = requests.post(
            f"{base_url}/transaction/initialize", json=payload, headers=_headers(), timeout=15
        )
        # Log the response status and first 200 chars of body for debugging
        logger.info("Paystack response status: %s, body snippet: %s", resp.status_code, resp.text[:200])
        
        body = resp.json() if resp.content else {}
        if not resp.ok or not body.get("status"):
            logger.error(
                "Paystack initialize failed: status_code=%s, message=%s, body=%s",
                resp.status_code, body.get("message"), body
            )
            raise PaystackError(
                body.get("message", "Failed to initialize Paystack transaction"),
                status_code=resp.status_code or 502,
                payload=body,
            )
        logger.info("Paystack initialize success for ref=%s, auth_url=%s", reference, body["data"].get("authorization_url"))
        return body["data"]
    except requests.exceptions.RequestException as e:
        logger.error("Paystack request failed (network error): %s", e)
        raise PaystackError(str(e), status_code=502)


def verify_transaction(reference: str):
    """Verify a Paystack transaction."""
    base_url = current_app.config["PAYSTACK_BASE_URL"]
    logger.info("Paystack verify: ref=%s", reference)
    try:
        resp = requests.get(
            f"{base_url}/transaction/verify/{reference}", headers=_headers(), timeout=15
        )
        logger.info("Paystack verify response status: %s, body snippet: %s", resp.status_code, resp.text[:200])
        body = resp.json() if resp.content else {}
        if not resp.ok or not body.get("status"):
            logger.error("Paystack verify failed: status=%s, msg=%s, body=%s", resp.status_code, body.get("message"), body)
            raise PaystackError(
                body.get("message", "Failed to verify Paystack transaction"),
                status_code=resp.status_code or 502,
                payload=body,
            )
        logger.info("Paystack verify success for ref=%s, status=%s", reference, body["data"].get("status"))
        return body["data"]
    except requests.exceptions.RequestException as e:
        logger.error("Paystack verify network error: %s", e)
        raise PaystackError(str(e), status_code=502)


def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """Verify Paystack webhook signature using HMAC-SHA512."""
    secret_key = current_app.config.get("PAYSTACK_SECRET_KEY")
    if not secret_key or not signature_header:
        logger.warning("Webhook signature verification failed: missing key or header")
        return False
    expected = hmac.new(secret_key.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    result = hmac.compare_digest(expected, signature_header)
    if not result:
        logger.warning("Webhook signature mismatch: expected=%s, got=%s", expected[:8], signature_header[:8])
    else:
        logger.info("Webhook signature verified successfully")
    return result