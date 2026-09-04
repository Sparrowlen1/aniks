import logging
from flask import current_app
from flask_mail import Message
from ..extensions import mail


logger = logging.getLogger(__name__)


def send_org_notification(application):
    """
    Send an email to the organisation admin when a new application is submitted.

    Uses ORG_NOTIFICATION_EMAIL from config (fallback to ADMIN_EMAIL).
    """
    subject = f"New Application: {application.subject} from {application.name}"

    # mail body maybe jinja at the end
    body = (
        f"New application #{application.id}\n"
        f"Name: {application.name}\n"
        f"Email: {application.email}\n"
        f"Phone: {application.phone or 'N/A'}\n"
        f"Organisation: {application.organisation or 'N/A'}\n"
        f"Country: {application.country or 'N/A'}\n"
        f"Subject: {application.subject}\n"
        f"Message:\n{application.message or 'No message provided'}\n"
        f"WhatsApp opt‑in: {'Yes' if application.whatsapp_opt_in else 'No'}"
    )

    # Prefer ORG_NOTIFICATION_EMAIL, fallback to ADMIN_EMAIL, then a default
    admin_email = current_app.config.get("ORG_NOTIFICATION_EMAIL") or \
                  current_app.config.get("ADMIN_EMAIL", "admin@example.com")
    recipients = [admin_email]

    msg = Message(
        subject=subject,
        recipients=recipients,
        body=body,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@example.com"),
    )

    # Optional: you can also send HTML content using render_template_string
    # msg.html = render_template_string("...", application=application)

    mail.send(msg)
    logger.info("Organisation notification sent for application #%s", application.id)


def send_user_confirmation(application):
    """
    Send a confirmation email to the user who submitted the form.
    """
    subject = "Thank you for your interest – Anika Initiative"

    body = (
        f"Dear {application.name},\n\n"
        f"Thank you for reaching out to us through the '{application.subject}' form.\n"
        f"We have received your application and will review it shortly.\n\n"
        f"Here is a summary of your submission:\n"
        f"Name: {application.name}\n"
        f"Email: {application.email}\n"
        f"Phone: {application.phone or 'N/A'}\n"
        f"Organisation: {application.organisation or 'N/A'}\n"
        f"Country: {application.country or 'N/A'}\n"
        f"Subject: {application.subject}\n"
        f"Message: {application.message or 'No message provided'}\n\n"
        f"Best regards,\nThe Anika Initiative Team"
    )

    recipients = [application.email]

    msg = Message(
        subject=subject,
        recipients=recipients,
        body=body,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@example.com"),
    )

    mail.send(msg)
    logger.info("Confirmation email sent to %s for application #%s", application.email, application.id)


def send_team_invite_email(user, password):
    """
    Email a newly-invited team member their login credentials.
    """
    subject = "You've been added to the ANIKA dashboard"

    origins = current_app.config.get("CORS_ORIGINS") or []
    frontend_url = origins[0] if origins else "http://localhost:5173"

    body = (
        f"Hi {user.name},\n\n"
        f"An account has been created for you on the ANIKA admin dashboard as {user.role}.\n\n"
        f"Log in at: {frontend_url}/admin/login\n"
        f"Email: {user.email}\n"
        f"Temporary password: {password}\n\n"
        f"Please log in and change your password as soon as possible.\n\n"
        f"Best regards,\nThe Anika Initiative Team"
    )

    msg = Message(
        subject=subject,
        recipients=[user.email],
        body=body,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@example.com"),
    )

    mail.send(msg)
    logger.info("Invite email sent to %s (role=%s)", user.email, user.role)


def send_status_update_email(application, new_status):
    """
    Send an email to the applicant when their application status changes.

    Args:
        application: Application model instance.
        new_status: string (e.g. "Shortlisted", "Accepted", "Rejected").
    """
    subject = f"Your application status has been updated – Anika Initiative"

    body = (
        f"Dear {application.name},\n\n"
        f"Your application for '{application.subject}' has been updated.\n"
        f"New status: **{new_status}**\n\n"
        f"Thank you for your interest in Anika Initiative.\n"
        f"Best regards,\nThe Anika Initiative Team"
    )

    if new_status == "Shortlisted":
        body += "\n\nWe are pleased to inform you that you have been shortlisted. We will contact you shortly with next steps."
    elif new_status == "Accepted":
        body += "\n\nCongratulations! We are happy to accept your application. More information will follow."
    elif new_status == "Rejected":
        body += "\n\nWe appreciate your interest, but we are unable to offer you a place at this time. Thank you for your understanding."

    msg = Message(
        subject=subject,
        recipients=[application.email],
        body=body,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@example.com"),
    )

    mail.send(msg)
    logger.info("Status update email sent to %s for application #%s (status: %s)",
                application.email, application.id, new_status)