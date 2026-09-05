import logging
import os
from logging.handlers import RotatingFileHandler

from config import BASE_DIR, Config
from flask import Flask, jsonify
from flask_migrate import Migrate
from sqlalchemy import inspect, text

from app.extensions import cors, db, jwt, mail, swagger
from app.utils.cloudinary_config import init_cloudinary

# db.create_all() only creates missing tables, never alters existing ones --
# so columns added to a model after the table already exists (e.g. on
# someone's already-seeded local db) need to be patched in by hand here.
# Safe to run on every boot: skips any column that's already there.
_PENDING_COLUMNS = [
    ("users", "avatar_url", "VARCHAR(500)"),
]


def _apply_pending_migrations():
    inspector = inspect(db.engine)
    with db.engine.connect() as conn:
        for table, column, ddl_type in _PENDING_COLUMNS:
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column in existing:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
            conn.commit()


# ----- NEW: apply missing indexes on startup (no migrations needed) -----
def _apply_pending_indexes():
    """Create missing indexes (e.g. on contacts table) if they don't exist."""
    with db.engine.connect() as conn:
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at);"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts (source);"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);"
        ))
        conn.commit()


SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "ANIKA API",
        "description": (
            "Backend for the ANIKA dashboard, public donation form, and (later) the "
            "WhatsApp assistant. Donations are processed through Paystack. "
            "Auth is not implemented yet -- all routes are currently open."
        ),
        "version": "1.0.0",
    },
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [{"endpoint": "apispec", "route": "/apispec.json", "rule_filter": lambda rule: True}],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/",
}

def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    os.makedirs(os.path.join(BASE_DIR, "instance"), exist_ok=True)

    db.init_app(app)
    # ----- Flask-Migrate initialization -----
    migrate = Migrate(app, db)  # <-- Registers 'flask db' command
    # -----------------------------------------
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    jwt.init_app(app)

    app.config["SWAGGER"] = SWAGGER_CONFIG
    swagger.template = SWAGGER_TEMPLATE
    swagger.init_app(app)
    mail.init_app(app)

    init_cloudinary(app)

    if not app.debug:
        app.logger.setLevel(logging.INFO)
        log_dir = os.path.join(BASE_DIR, "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "anika.log")

        file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
        file_handler.setLevel(logging.INFO)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)

        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        app.logger.addHandler(file_handler)
        app.logger.addHandler(console_handler)

    
    # Import all models
    from app.models.annual_report import AnnualReport
    from app.models.application import Application
    from app.models.contact import Contact
    from app.models.donation import Donation
    from app.models.event import Event
    from app.models.gallery import GalleryImage
    from app.models.registration import Registration
    from app.models.report_schedule import ReportSchedule
    from app.models.settings import Settings
    from app.models.story import Story
    from app.models.user import User
    from app.models.whatsapp_broadcast import WhatsAppBroadcast
    from app.models.whatsapp_conversation import WhatsAppConversation
    from app.models.whatsapp_settings import WhatsAppSettings
    from app.models.newsletter import NewsletterSubscriber   
    from app.models.export_log import ExportLog

    from app.routes import (
        applications_bp,
        auth_bp,
        contacts_bp,
        donations_bp,
        events_bp,
        gallery_bp,
        health_bp,
        metrics_bp,
        registrations_bp,
        reports_bp,
        team_bp,
        settings_bp,
        stories_bp,
        whatsapp_bp,
    )
    from app.routes.newsletter import newsletter_bp          

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(donations_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(gallery_bp)
    app.register_blueprint(stories_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(registrations_bp)
    app.register_blueprint(whatsapp_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(newsletter_bp)                    

    with app.app_context():
        db.create_all()
        _apply_pending_migrations()
        # ----- Create missing indexes -----
        _apply_pending_indexes()
        # ---------------------------------
        # ----- Dispose the engine so each Gunicorn worker gets its own connection -----
        db.engine.dispose()
        app.logger.info("Database engine disposed after initialization")

        # ----- SEED ADMIN USER ON STARTUP (temporary) -----
        try:
            admin_email = os.getenv("SEED_LEADERSHIP_EMAIL", "admin@anikainitiative.com")
            admin_password = os.getenv("SEED_LEADERSHIP_PASSWORD", "admin123")
            admin_name = os.getenv("SEED_LEADERSHIP_NAME", "Admin")

            if not User.query.filter_by(email=admin_email).first():
                user = User(name=admin_name, email=admin_email, role="leadership")
                user.set_password(admin_password)
                db.session.add(user)
                db.session.commit()
                app.logger.info(f"✅ Seeded admin user: {admin_email}")
            else:
                app.logger.info(f"ℹ️ Admin user {admin_email} already exists")
        except Exception as e:
            app.logger.error(f"❌ Failed to seed admin user: {e}")

    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(_err):
        return jsonify({"error": "Internal server error"}), 500

    return app