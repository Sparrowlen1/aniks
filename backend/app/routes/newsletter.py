# app/routes/newsletter.py
from datetime import datetime
from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.application import Application
from app.utils.contact_utils import create_contact_from_data
from app.utils.decorators import require_permission
from app.utils.email import send_brevo_email  # <-- import from shared email module

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

    # Create contact
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

    # Create application
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

    # Send confirmation email via Brevo API
    try:
        subject = "Thank you for subscribing to ANIKA Newsletter!"
        html_content = f"""
        <h2>Hello {name or "there"}!</h2>
        <p>Thank you for subscribing to the <strong>ANIKA</strong> newsletter!</p>
        <p>Your subscription is pending approval. You will receive a confirmation email once your application is reviewed by our team.</p>
        <p>We look forward to sharing our updates with you!</p>
        <br>
        <p>Warm regards,<br>The ANIKA Team</p>
        """
        text_content = f"""
        Hello {name or "there"}!

        Thank you for subscribing to the ANIKA newsletter!

        Your subscription is pending approval. You will receive a confirmation email once your application is reviewed by our team.

        We look forward to sharing our updates with you!

        Warm regards,
        The ANIKA Team
        """
        send_brevo_email(email, name or email, subject, html_content, text_content)
    except Exception as e:
        current_app.logger.error(f"Failed to send confirmation email: {e}")
        # Don't fail the request – the subscription was still saved

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
            # Use Brevo API here as well for consistency, but keep Flask-Mail for now
            # if you prefer. We'll use the Brevo API for better reliability.
            html_content = content  # content is already HTML
            text_content = content  # or you can strip tags
            result = send_brevo_email(
                to_email=subscriber.email,
                to_name=subscriber.name or "Subscriber",
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            if result:
                success_count += 1
            else:
                fail_count += 1
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