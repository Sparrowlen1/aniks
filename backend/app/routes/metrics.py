from flask import Blueprint, jsonify

from app.models.registration import Registration
from app.models.application import Application
from app.models.donation import Donation
from app.models.event import Event
from app.models.whatsapp_conversation import WhatsAppConversation
from app.models.whatsapp_broadcast import WhatsAppBroadcast

metrics_bp = Blueprint("metrics", __name__, url_prefix="/api/metrics")


@metrics_bp.get("")
def metrics():
    """
    Aggregate counts for the dashboard.
    ---
    tags:
      - Metrics
    summary: Get dashboard metrics
    responses:
      200:
        description: Counts per collection
    """
    return jsonify(
        {
            "registrations": Registration.query.count(),
            "applications": Application.query.count(),
            "donations": Donation.query.count(),
            "events": Event.query.count(),
            "whatsAppInbox": WhatsAppConversation.query.count(),
            "whatsAppBroadcasts": WhatsAppBroadcast.query.count(),
            "waOptIns": Registration.query.filter_by(consent=True).count(),
        }
    )
