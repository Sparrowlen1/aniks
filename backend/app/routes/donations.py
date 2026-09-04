import logging
import secrets
import string
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models import Donation
from app.schemas.donation_schema import create_donation_schema, update_donation_schema
from app.services.paystack import (
    PaystackError,
    initialize_transaction,
    verify_transaction,
    verify_webhook_signature,
)
from app.utils.contact_utils import create_contact_from_data
from app.utils.decorators import require_permission
from app.utils.validation import load_json_or_400

donations_bp = Blueprint("donations", __name__, url_prefix="/api/donations")


logger = logging.getLogger(__name__)


def send_whatsapp_receipt(phone, amount, currency, reference, donor_name):
    """Sends a WhatsApp receipt (placeholder)."""
    phone = phone.lstrip('+').strip()
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone

    message = (
        f"Thank you, {donor_name}!\n"
        f"Your donation of {currency} {amount:.2f} was received.\n"
        f"Reference: {reference}\n"
        "Your support keeps the rooms open."
    )
    # will be replaced with actual WhatsApp API call (Twilio, etc.)
    print(f" WhatsApp receipt to {phone}: {message}")
    logger.info(f"WhatsApp receipt sent to {phone} for reference {reference}")


def _generate_reference() -> str:
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(9))
    return f"ANK{suffix}"


def _apply_paystack_result(donation: Donation, data: dict) -> None:
    """Update donation from Paystack verification data."""
    paystack_status = data.get("status")
    donation.gateway_response = data.get("gateway_response")
    donation.paystack_channel = data.get("channel")

    if paystack_status == "success":
        donation.status = "Completed"
        paid_at = data.get("paid_at")
        if paid_at:
            try:
                donation.paid_at = datetime.strptime(paid_at, "%Y-%m-%dT%H:%M:%S.%fZ")
            except ValueError:
                donation.paid_at = datetime.utcnow()
        else:
            donation.paid_at = datetime.utcnow()
    elif paystack_status in ("failed", "abandoned", "reversed"):
        donation.status = "Failed"
    else:
        donation.status = "Pending"


@donations_bp.post("")
def create_donation():
    """
    Create a donation (M-Pesa, card, or manual)
    ---
    tags:
      - Donations
    summary: Initialize a donation
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [amount, method]
          properties:
            donor_name:
              type: string
              example: "Jennifer K"
            email:
              type: string
              example: "jennifer@example.com"
            amount:
              type: number
              example: 1000
            method:
              type: string
              enum: [mpesa, card, manual]
              example: mpesa
            phone:
              type: string
              example: "0712345678"
            currency:
              type: string
              enum: [KES, USD]
              example: KES
            send_whatsapp_receipt:
              type: boolean
              example: false
            status:
              type: string
              enum: [Pending, Completed, Failed]
              description: Only for manual mode
    responses:
      201:
        description: Donation created. For mpesa/card, includes `authorization_url`.
      400:
        description: Validation error
      502:
        description: Paystack error
    """
    data, error = load_json_or_400(create_donation_schema)
    if error:
        logger.warning("Donation creation validation failed: %s", error)
        return error

    method = data["method"]
    amount = data["amount"]
    donor_name = (data.get("donor_name") or "Anonymous").strip() or "Anonymous"
    phone = (data.get("phone") or "").strip() or None

    # Log the incoming donation request with all details
    logger.info(
        "Donation request: method=%s, amount=%.2f, currency=%s, email=%s, phone=%s, donor=%s",
        method, amount, data.get("currency", "KES"), data.get("email"), phone, donor_name
    )

    if method == "manual":
        donation = Donation(
            donor_name=donor_name,
            email=data.get("email"),
            phone=phone,
            amount=amount,
            currency=data.get("currency") or "KES",
            method="manual",
            reference=_generate_reference(),
            status=data["status"],
            paid_at=datetime.utcnow() if data["status"] == "Completed" else None,
        )
        db.session.add(donation)

        create_contact_from_data(
            name=donor_name,
            email=data.get("email"),
            phone=phone,
            message=None,
            source='donation',
            subject=None,
            country=None,
            status='new'
        )

        db.session.commit()
        logger.info("Manual donation recorded: ref=%s, amount=%s", donation.reference, amount)
        return jsonify(donation.to_dict()), 201

    # method is 'mpesa' or 'card' -> go through Paystack
    email = data.get("email") or "donor@anika.org"
    currency = (data.get("currency") or "KES").upper()
    
    # Validate currency/method combinations
    if method == "mpesa" and currency != "KES":
        logger.warning("M-Pesa donation with non-KES currency: %s (rejected)", currency)
        return jsonify({"error": "M-Pesa only supports KES currency"}), 400
    if method == "card" and currency not in ("KES", "USD"):
        logger.warning("Card donation with unsupported currency: %s (rejected)", currency)
        return jsonify({"error": "Card donations only support KES or USD"}), 400
    if currency == "USD" and method != "card":
        logger.warning("USD donation attempted with method %s (rejected)", method)
        return jsonify({"error": "USD donations only supported via card."}), 400

    amount_in_smallest_unit = int(amount * 100)
    channels = ["mobile_money"] if method == "mpesa" else ["card"]
    reference = _generate_reference()

    donation = Donation(
        donor_name=donor_name,
        email=email,
        phone=phone,
        amount=amount,
        currency=currency,
        method=method,
        reference=reference,
        status="Pending",
        send_whatsapp_receipt=bool(data.get("send_whatsapp_receipt")),
    )
    db.session.add(donation)

    create_contact_from_data(
        name=donor_name,
        email=email,
        phone=phone,
        message=None,
        source='donation',
        subject=None,
        country=None,
        status='new'
    )

    db.session.commit()

    try:
        logger.info(
            "Initializing Paystack: ref=%s, amount=%d (subunit), currency=%s, channels=%s",
            reference, amount_in_smallest_unit, currency, channels
        )
        result = initialize_transaction(
            email=email,
            amount=amount_in_smallest_unit,
            currency=currency,
            reference=reference,
            callback_url=current_app.config["DONATION_CALLBACK_URL"],
            channels=channels,
            metadata={"donor_name": donor_name, "phone": phone, "donation_id": donation.id},
        )
        logger.info(
            "Paystack initialization successful for ref=%s, auth_url=%s, access_code=%s",
            reference, result.get("authorization_url"), result.get("access_code")
        )
    except PaystackError as exc:
        logger.error(
            "Paystack error for ref=%s: status=%s, message=%s, payload=%s",
            reference, exc.status_code, exc.message, exc.payload
        )
        donation.status = "Failed"
        donation.gateway_response = exc.message
        db.session.commit()
        return jsonify({"error": exc.message, **donation.to_dict()}), exc.status_code

    payload = donation.to_dict()
    payload["authorization_url"] = result.get("authorization_url")
    payload["access_code"] = result.get("access_code")
    return jsonify(payload), 201


@donations_bp.get("")
@require_permission("donations")
def list_donations():
    """
    List donations with optional filters
    ---
    tags:
      - Donations
    summary: Get all donations (admin)
    parameters:
      - name: search
        in: query
        type: string
        description: Filter by donor name (partial match)
      - name: status
        in: query
        type: string
        enum: [Pending, Completed, Failed]
        description: Filter by status
    responses:
      200:
        description: Array of donations (newest first)
        schema:
          type: array
          items:
            type: object
    """
    query = Donation.query
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()

    if search:
        query = query.filter(Donation.donor_name.ilike(f"%{search}%"))
    if status in Donation.STATUSES:
        query = query.filter(Donation.status == status)

    donations = query.order_by(Donation.created_at.desc()).all()
    logger.info("Listed %d donations (search='%s', status='%s')", len(donations), search, status)
    return jsonify([d.to_dict() for d in donations]), 200


@donations_bp.patch("/<int:donation_id>")
@require_permission("donations")
def update_donation(donation_id):
    """
    Update a donation (e.g. change status)
    ---
    tags:
      - Donations
    summary: Update donation fields
    parameters:
      - name: donation_id
        in: path
        required: true
        type: integer
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            status:
              type: string
              enum: [Pending, Completed, Failed]
            donor_name:
              type: string
            phone:
              type: string
            amount:
              type: number
    responses:
      200:
        description: Updated donation object
      400:
        description: Validation error
      404:
        description: Donation not found
    """
    donation = Donation.query.get_or_404(donation_id)
    data, error = load_json_or_400(update_donation_schema)
    if error:
        return error

    if "donor_name" in data:
        donation.donor_name = data["donor_name"]
    if "phone" in data:
        donation.phone = data["phone"]
    if "amount" in data:
        donation.amount = data["amount"]
    if "status" in data:
        donation.status = data["status"]
        if donation.status == "Completed" and not donation.paid_at:
            donation.paid_at = datetime.utcnow()

    db.session.commit()
    logger.info("Donation %d updated: status=%s", donation.id, donation.status)
    return jsonify(donation.to_dict()), 200


@donations_bp.delete("/<int:donation_id>")
@require_permission("donations")
def delete_donation(donation_id):
    """
    Delete a donation
    ---
    tags:
      - Donations
    summary: Delete a donation
    parameters:
      - name: donation_id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: Deleted
        schema:
          type: object
          properties:
            deleted:
              type: boolean
            id:
              type: integer
      404:
        description: Donation not found
    """
    donation = Donation.query.get_or_404(donation_id)
    db.session.delete(donation)
    db.session.commit()
    logger.info("Donation %d deleted", donation_id)
    return jsonify({"deleted": True, "id": donation_id}), 200


# EXTRA ROUTES – PAYSTACK WEBHOOK & VERIFICATION

@donations_bp.post("/webhook")
def paystack_webhook():
    """
    Paystack webhook receiver
    ---
    tags:
      - Donations
    summary: Paystack webhook for charge.success/failed
    responses:
      200:
        description: Event processed or ignored.
      400:
        description: Invalid signature or malformed payload.
    """
    signature = request.headers.get("x-paystack-signature", "")
    if not verify_webhook_signature(request.get_data(), signature):
        logger.warning("Webhook signature verification failed")
        return jsonify({"error": "Invalid signature"}), 400

    event = request.get_json(silent=True) or {}
    if event.get("event") not in ("charge.success", "charge.failed"):
        logger.info("Webhook event ignored: %s", event.get("event"))
        return jsonify({"status": "ignored"}), 200

    reference = (event.get("data") or {}).get("reference")
    if not reference:
        logger.warning("Webhook missing reference")
        return jsonify({"status": "ignored"}), 200

    donation = Donation.query.filter_by(reference=reference).first()
    if not donation:
        logger.warning("Webhook reference %s not found", reference)
        return jsonify({"status": "unknown reference"}), 200

    logger.info("Webhook received for reference %s", reference)

    # Re-verify with Paystack
    try:
        verified = verify_transaction(reference)
    except PaystackError as e:
        logger.error("Verification failed for %s: %s", reference, e.message)
        return jsonify({"status": "verification failed, will rely on retry"}), 200

    _apply_paystack_result(donation, verified)
    db.session.commit()
    logger.info("Donation %s status updated to %s", reference, donation.status)

    # Send WhatsApp receipt if completed and requested
    if donation.status == "Completed" and donation.send_whatsapp_receipt and donation.phone:
        try:
            send_whatsapp_receipt(
                phone=donation.phone,
                amount=donation.amount,
                currency=donation.currency,
                reference=donation.reference,
                donor_name=donation.donor_name
            )
        except Exception as e:
            logger.error("Failed to send WhatsApp receipt: %s", e)

    return jsonify({"status": "processed"}), 200


@donations_bp.get("/verify/<reference>")
def verify_donation(reference):
    """
    Check a donation's status (used by the thank‑you page)
    ---
    tags:
      - Donations
    summary: Verify a donation by reference
    parameters:
      - name: reference
        in: path
        required: true
        type: string
    responses:
      200:
        description: Current donation status
      404:
        description: Unknown reference
    """
    donation = Donation.query.filter_by(reference=reference).first()
    if not donation:
        logger.warning("Verify called for unknown reference %s", reference)
        return jsonify({"error": "Unknown reference"}), 404

    if donation.status == "Pending":
        try:
            verified = verify_transaction(reference)
            _apply_paystack_result(donation, verified)
            db.session.commit()
            logger.info("Verify: updated donation %s to %s", reference, donation.status)
        except PaystackError:
            logger.warning("Verify: Paystack verification failed for %s (kept Pending)", reference)
            pass

    return jsonify(donation.to_dict()), 200


@donations_bp.get("/stats")
@require_permission("donations")
def donation_stats():
    """
    Aggregate donation statistics for dashboard
    ---
    tags:
      - Donations
    summary: Get donation stats (monthly, yearly, pie chart)
    responses:
      200:
        description: Statistics including totals and percentages
        schema:
          type: object
          properties:
            thisMonthTotal:
              type: number
            totalThisYear:
              type: number
            avgGift:
              type: number
            totalGifts:
              type: integer
            pctUnder:
              type: integer
            pctMid:
              type: integer
            pctOver:
              type: integer
    """
    completed = Donation.query.filter_by(status="Completed").all()

    now = datetime.utcnow()
    this_month_total = sum(
        float(d.amount)
        for d in completed
        if d.created_at.year == now.year and d.created_at.month == now.month
    )
    year_total = sum(float(d.amount) for d in completed if d.created_at.year == now.year)
    total_gifts = len(completed)
    avg_gift = round(year_total / total_gifts) if total_gifts else 0

    under = sum(1 for d in completed if float(d.amount) < 1000)
    mid = sum(1 for d in completed if 1000 <= float(d.amount) <= 5000)
    over = sum(1 for d in completed if float(d.amount) > 5000)
    total = total_gifts or 1
    pct_under = round(under / total * 100)
    pct_mid = round(mid / total * 100)
    pct_over = 100 - pct_under - pct_mid

    logger.info("Stats computed: thisMonth=%s, year=%s, avg=%s, gifts=%s",
                this_month_total, year_total, avg_gift, total_gifts)

    return jsonify(
        {
            "thisMonthTotal": this_month_total,
            "totalThisYear": year_total,
            "avgGift": avg_gift,
            "totalGifts": total_gifts,
            "pctUnder": pct_under,
            "pctMid": pct_mid,
            "pctOver": pct_over,
        }
    ), 200