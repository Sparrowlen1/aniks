# app/routes/newsletter.py
from datetime import datetime
from flask import Blueprint, current_app, jsonify, request
from flask_mail import Message

from app.extensions import db, mail
from app.models.application import Application
from app.utils.contact_utils import create_contact_from_data
from app.utils.decorators import require_permission

newsletter_bp = Blueprint("newsletter", __name__, url_prefix="/api/newsletter")


@newsletter_bp.post("/subscribe")
def subscribe():
    """
    Subscribe to the newsletter (public).
    Creates an Application (status: New) and a Contact.
    The user is NOT added to the subscriber list until an admin accepts the application.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip() or None

    if not email:
        return jsonify({"error": "Email is required"}), 400

    current_app.logger.info(f"Newsletter subscription attempt for {email}")


    existing_app = Application.query.filter_by(email=email, subject='newsletter').first()
    if existing_app and existing_app.status == 'Accepted':

        return jsonify({"message": "You're already an approved subscriber!"}), 200
    if existing_app:
        return jsonify({"message": "You already have a pending application. We'll notify you once it's reviewed."}), 200


    try:
        create_contact_from_data(
            name=name or email,
            email=email,
            phone=None,
            message="Newsletter subscription",
            source='getinvolved',
            subject='newsletter',
            country=None,
            status='new'
        )
        current_app.logger.info(f"Contact record created for {email}")
    except Exception as e:
        current_app.logger.error(f"Failed to create contact for {email}: {e}")


    try:
        app_entry = Application(
            name=name or email,
            email=email,
            phone=None,
            organisation=None,
            country=None,
            subject='newsletter',
            message="Subscribed to newsletter",
            whatsapp_opt_in=False,
            status='New'   
        )
        db.session.add(app_entry)
        db.session.commit()
        current_app.logger.info(f"Application record created for {email}")
    except Exception as e:
        current_app.logger.error(f"Failed to create application for {email}: {e}")
        return jsonify({"error": "Failed to process subscription. Please try again."}), 500

    try:
        msg = Message(
            subject="Thank you for subscribing to ANIKA Newsletter!",
            sender=("ANIKA", current_app.config["MAIL_DEFAULT_SENDER"]),
            recipients=[email],
            body=f"""
Hello {name or "there"},

Thank you for subscribing to the ANIKA newsletter!

Your subscription is pending approval. You will receive a confirmation email once your application is reviewed by our team.

We look forward to sharing our updates with you!

Warm regards,
The ANIKA Team
"""
        )
        mail.send(msg)
        current_app.logger.info(f"Confirmation email sent to {email}")
    except Exception as e:
        current_app.logger.error(f"Failed to send confirmation email: {e}")

    return jsonify({"message": "Thank you! We'll review your subscription and notify you once approved."}), 201


@newsletter_bp.post("/unsubscribe")
def unsubscribe():
    """Unsubscribe from the newsletter (public)."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    
    from app.models.newsletter import NewsletterSubscriber
    subscriber = NewsletterSubscriber.query.filter_by(email=email).first()
    if not subscriber:
        return jsonify({"message": "Email not found in our subscriber list."}), 200

    subscriber.is_active = False
    subscriber.unsubscribed_at = datetime.utcnow()
    db.session.commit()
    current_app.logger.info(f"Email {email} unsubscribed (public)")

    return jsonify({"message": "You've been unsubscribed from the newsletter."}), 200


@newsletter_bp.get("/subscribers")
@require_permission("newsletter")
def list_subscribers():
    """List all active subscribers (admin)."""
    from app.models.newsletter import NewsletterSubscriber
    subscribers = NewsletterSubscriber.query.filter_by(is_active=True).order_by(
        NewsletterSubscriber.subscribed_at.desc()
    ).all()
    current_app.logger.info(f"Returning {len(subscribers)} active subscribers")
    return jsonify([s.to_dict() for s in subscribers])


@newsletter_bp.patch("/<int:subscriber_id>")
@require_permission("newsletter")
def deactivate_subscriber(subscriber_id):
    """Admin deactivates a subscriber (soft delete)."""
    from app.models.newsletter import NewsletterSubscriber
    subscriber = NewsletterSubscriber.query.get_or_404(subscriber_id)
    subscriber.is_active = False
    subscriber.unsubscribed_at = datetime.utcnow()
    db.session.commit()
    current_app.logger.info(f"Admin deactivated subscriber {subscriber.email}")
    return jsonify({"message": "Subscriber deactivated."}), 200


@newsletter_bp.post("/send")
@require_permission("newsletter")
def send_newsletter():
    """
    Send a newsletter ONLY to active subscribers.
    """
    from app.models.newsletter import NewsletterSubscriber
    data = request.get_json(silent=True) or {}
    subject = data.get("subject")
    content = data.get("content")

    if not subject or not content:
        return jsonify({"error": "Subject and content are required"}), 400

    subscribers = NewsletterSubscriber.query.filter_by(is_active=True).all()
    if not subscribers:
        return jsonify({"message": "No active subscribers."}), 200

    success_count = 0
    fail_count = 0

    for subscriber in subscribers:
        try:
            msg = Message(
                subject=subject,
                sender=("ANIKA Newsletter", current_app.config["MAIL_DEFAULT_SENDER"]),
                recipients=[subscriber.email],
                html=content,
                body=content,
            )
            mail.send(msg)
            success_count += 1
        except Exception as e:
            current_app.logger.error(f"Failed to send to {subscriber.email}: {e}")
            fail_count += 1

    current_app.logger.info(
        f"Newsletter sent: {success_count} succeeded, {fail_count} failed"
    )

    return jsonify({
        "message": f"Newsletter sent to {success_count} subscribers.",
        "sent_count": success_count,
        "failed_count": fail_count,
    }), 200