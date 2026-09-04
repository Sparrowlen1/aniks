from app.routes.donations import donations_bp
from app.routes.gallery import gallery_bp
from app.routes.stories import stories_bp

from .applications import applications_bp
from .auth import auth_bp
from .contacts import contacts_bp
from .events import events_bp
from .health import health_bp
from .metrics import metrics_bp
from .registrations import registrations_bp
from .reports import reports_bp
from .team import team_bp
from .settings import settings_bp
from .whatsapp import whatsapp_bp

__all__ = [
    "applications_bp",
    "auth_bp",
    "contacts_bp",
    "donations_bp",
    "events_bp",
    "gallery_bp",
    "health_bp",
    "metrics_bp",
    "registrations_bp",
    "reports_bp",
    "settings_bp",
    "stories_bp",
    "team_bp",
    "whatsapp_bp",
]
