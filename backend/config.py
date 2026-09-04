import os

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
    CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "info@anika.org")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    ) or "sqlite:///" + os.path.join(BASE_DIR, "instance", "anika.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")
    PAYSTACK_PUBLIC_KEY = os.environ.get("PAYSTACK_PUBLIC_KEY", "")
    PAYSTACK_BASE_URL = os.environ.get("PAYSTACK_BASE_URL", "https://api.paystack.co")

    DONATION_CALLBACK_URL = os.environ.get(
        "DONATION_CALLBACK_URL", "http://localhost:5173/donate/thank-you"
    )
    # Flask-Mail
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', '1', 'yes']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', '1', 'yes']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@anika.org')

    # Custom emails
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'dannymuthui118@gmail.com')
    ORG_NOTIFICATION_EMAIL = os.environ.get('ORG_NOTIFICATION_EMAIL', ADMIN_EMAIL)
    CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'mumod758@gmail.com')

    CORS_ORIGINS = [
        o.strip()
        for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]

    # WhatsApp Business Cloud API (Meta). When TOKEN / PHONE_ID are empty the
    # assistant still runs in simulated mode: inbound messages are processed
    # and stored, but outbound sends are logged instead of hitting Graph API.
    WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN", "")
    WHATSAPP_PHONE_ID = os.environ.get("WHATSAPP_PHONE_ID", "")
    WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")
    WHATSAPP_BASE_URL = os.environ.get(
        "WHATSAPP_BASE_URL", "https://graph.facebook.com/v21.0"
    )
     # Cloudinary (gallery image storage)
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
