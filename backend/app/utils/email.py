# app/utils/email.py
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)


def send_brevo_email(to_email, to_name, subject, html_content, text_content=None):
    """Send email using Brevo Transactional API."""
    api_key = current_app.config.get("BREVO_API_KEY")
    if not api_key:
        logger.error("BREVO_API_KEY not configured – email not sent")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "sender": {
            "email": current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@anika.org"),
            "name": "ANIKA Initiative"
        },
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content or "",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in (200, 201, 202):
            logger.info(f"Brevo email sent to {to_email}")
            return True
        else:
            logger.error(f"Brevo API error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Brevo email failed: {e}")
        return False


def send_org_notification(application):
    """
    Send an email to the organisation admin when a new application is submitted.
    Uses ORG_NOTIFICATION_EMAIL from config (fallback to ADMIN_EMAIL).
    """
    subject = f"New Application: {application.subject} from {application.name}"

    html = f"""
    <h2>New Get Involved Application #{application.id}</h2>
    <p><strong>Name:</strong> {application.name}</p>
    <p><strong>Email:</strong> {application.email}</p>
    <p><strong>Phone:</strong> {application.phone or 'N/A'}</p>
    <p><strong>Organisation:</strong> {application.organisation or 'N/A'}</p>
    <p><strong>Country:</strong> {application.country or 'N/A'}</p>
    <p><strong>Subject:</strong> {application.subject}</p>
    <p><strong>Message:</strong><br>{application.message or 'No message provided'}</p>
    <p><strong>WhatsApp opt‑in:</strong> {'Yes' if application.whatsapp_opt_in else 'No'}</p>
    """
    text = (
        f"New application #{application.id}\n"
        f"Name: {application.name}\n"
        f"Email: {application.email}\n"
        f"Phone: {application.phone or 'N/A'}\n"
        f"Organisation: {application.organisation or 'N/A'}\n"
        f"Country: {application.country or 'N/A'}\n"
        f"Subject: {application.subject}\n"
        f"Message: {application.message or 'No message provided'}\n"
        f"WhatsApp opt‑in: {'Yes' if application.whatsapp_opt_in else 'No'}"
    )

    admin_email = current_app.config.get("ORG_NOTIFICATION_EMAIL") or \
                  current_app.config.get("ADMIN_EMAIL", "admin@example.com")
    return send_brevo_email(
        to_email=admin_email,
        to_name="ANIKA Admin",
        subject=subject,
        html_content=html,
        text_content=text
    )


def send_user_confirmation(application):
    """Send a confirmation email to the user who submitted the form."""
    subject = "Thank you for your interest – Anika Initiative"

    html = f"""
    <h2>Hello {application.name}!</h2>
    <p>Thank you for reaching out to us through the <strong>'{application.subject}'</strong> form.</p>
    <p>We have received your application and will review it shortly.</p>
    <p>Here is a summary of your submission:</p>
    <ul>
        <li><strong>Name:</strong> {application.name}</li>
        <li><strong>Email:</strong> {application.email}</li>
        <li><strong>Phone:</strong> {application.phone or 'N/A'}</li>
        <li><strong>Organisation:</strong> {application.organisation or 'N/A'}</li>
        <li><strong>Country:</strong> {application.country or 'N/A'}</li>
        <li><strong>Subject:</strong> {application.subject}</li>
        <li><strong>Message:</strong> {application.message or 'No message provided'}</li>
    </ul>
    <p>We will be in touch soon.</p>
    <br>
    <p>Best regards,<br>The Anika Initiative Team</p>
    """
    text = (
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
        f"We will be in touch soon.\n\n"
        f"Best regards,\nThe Anika Initiative Team"
    )

    return send_brevo_email(
        to_email=application.email,
        to_name=application.name,
        subject=subject,
        html_content=html,
        text_content=text
    )


def send_team_invite_email(user, password):
    """Email a newly-invited team member their login credentials."""
    subject = "You've been added to the ANIKA dashboard"

    origins = current_app.config.get("CORS_ORIGINS") or []
    frontend_url = origins[0] if origins else "http://localhost:5173"

    html = f"""
    <h2>Hi {user.name},</h2>
    <p>An account has been created for you on the <strong>ANIKA</strong> admin dashboard as <strong>{user.role}</strong>.</p>
    <p><strong>Log in at:</strong> <a href="{frontend_url}/admin/login">{frontend_url}/admin/login</a></p>
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Temporary password:</strong> {password}</p>
    <p>Please log in and change your password as soon as possible.</p>
    <br>
    <p>Best regards,<br>The Anika Initiative Team</p>
    """
    text = (
        f"Hi {user.name},\n\n"
        f"An account has been created for you on the ANIKA admin dashboard as {user.role}.\n\n"
        f"Log in at: {frontend_url}/admin/login\n"
        f"Email: {user.email}\n"
        f"Temporary password: {password}\n\n"
        f"Please log in and change your password as soon as possible.\n\n"
        f"Best regards,\nThe Anika Initiative Team"
    )

    return send_brevo_email(
        to_email=user.email,
        to_name=user.name,
        subject=subject,
        html_content=html,
        text_content=text
    )


def send_status_update_email(application, new_status):
    """Send an email to the applicant when their application status changes."""
    subject = f"Your application status has been updated – Anika Initiative"

    # Additional message based on status
    extra = ""
    if new_status == "Shortlisted":
        extra = "We are pleased to inform you that you have been shortlisted. We will contact you shortly with next steps."
    elif new_status == "Accepted":
        extra = "Congratulations! We are happy to accept your application. More information will follow."
    elif new_status == "Rejected":
        extra = "We appreciate your interest, but we are unable to offer you a place at this time. Thank you for your understanding."

    html = f"""
    <h2>Dear {application.name},</h2>
    <p>Your application for <strong>'{application.subject}'</strong> has been updated.</p>
    <p><strong>New status:</strong> {new_status}</p>
    <p>{extra}</p>
    <p>Thank you for your interest in Anika Initiative.</p>
    <br>
    <p>Best regards,<br>The Anika Initiative Team</p>
    """
    text = (
        f"Dear {application.name},\n\n"
        f"Your application for '{application.subject}' has been updated.\n"
        f"New status: {new_status}\n\n"
        f"{extra}\n\n"
        f"Thank you for your interest in Anika Initiative.\n"
        f"Best regards,\nThe Anika Initiative Team"
    )

    return send_brevo_email(
        to_email=application.email,
        to_name=application.name,
        subject=subject,
        html_content=html,
        text_content=text
    )