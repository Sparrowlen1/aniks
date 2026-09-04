"""
app/routes/settings.py

Endpoints:
    GET   /api/settings              -> org profile + notification prefs
    PUT   /api/settings/org          -> update org profile
    PUT   /api/settings/notifications-> update notification toggles
    PUT   /api/settings/account      -> update the logged-in admin's name/email/password
    POST  /api/settings/reset        -> danger-zone: password-gated bulk delete

Auth: every route requires a valid JWT (@jwt_required). Settings-changing
routes (org, notifications, reset) additionally require a role with
access to the "settings" resource (role_has_access), which today means
leadership only — see app/utils/decorators.py's RESOURCE_ACCESS. The
reset route also re-verifies the caller's own password server-side.
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import Application, Contact, Donation, User
from app.models.settings import Settings
from app.utils.decorators import role_has_access
from app.utils.validation import load_json_or_400
from app.schemas.settings_schema import (
    update_account_schema,
    update_notifications_schema,
    update_org_schema,
)

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

logger = logging.getLogger(__name__)


def _current_user():
    user_id = get_jwt_identity()
    if user_id:
        return User.query.get(int(user_id))
    return None


def _has_settings_access():
    role = get_jwt().get("role")
    return role_has_access(role, "settings")


# ---- profile / notifications --------------------------------------------

@settings_bp.get("")
@jwt_required()
def get_settings():
    """
    Get org profile + notification preferences.
    ---
    tags:
      - Settings
    responses:
      200:
        description: Settings object
      401:
        description: Unauthorized
    """
    user = _current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    settings = Settings.get_singleton()
    return jsonify(settings.to_dict()), 200


@settings_bp.put("/org")
@jwt_required()
def update_org():
    """
    Update organisation profile.
    ---
    tags:
      - Settings
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name: {type: string}
            email: {type: string}
            phone: {type: string}
    responses:
      200:
        description: Updated settings object
      400:
        description: Validation error
      401:
        description: Unauthorized
      403:
        description: Permission denied
    """
    user = _current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if not _has_settings_access():
        return jsonify({"error": "Permission denied"}), 403

    data, error = load_json_or_400(update_org_schema)
    if error:
        return error

    settings = Settings.get_singleton()
    if "name" in data:
        settings.org_name = data["name"].strip() or settings.org_name
    if "email" in data:
        settings.org_email = data["email"]
    if "phone" in data:
        settings.org_phone = data["phone"]

    db.session.commit()
    logger.info("Org settings updated by user %s", get_jwt_identity())
    return jsonify(settings.to_dict()), 200


@settings_bp.put("/notifications")
@jwt_required()
def update_notifications():
    """
    Update notification preferences.
    ---
    tags:
      - Settings
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            donationAlerts: {type: boolean}
            applicationAlerts: {type: boolean}
            whatsappAlerts: {type: boolean}
            weeklyDigest: {type: boolean}
    responses:
      200:
        description: Updated settings object
      400:
        description: Validation error
      401:
        description: Unauthorized
      403:
        description: Permission denied
    """
    user = _current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if not _has_settings_access():
        return jsonify({"error": "Permission denied"}), 403

    data, error = load_json_or_400(update_notifications_schema)
    if error:
        return error

    settings = Settings.get_singleton()
    if "donationAlerts" in data:
        settings.donation_alerts = data["donationAlerts"]
    if "applicationAlerts" in data:
        settings.application_alerts = data["applicationAlerts"]
    if "whatsappAlerts" in data:
        settings.whatsapp_alerts = data["whatsappAlerts"]
    if "weeklyDigest" in data:
        settings.weekly_digest = data["weeklyDigest"]

    db.session.commit()
    logger.info("Notification prefs updated by user %s", get_jwt_identity())
    return jsonify(settings.to_dict()), 200


# ---- admin account --------------------------------------------------------

@settings_bp.put("/account")
@jwt_required()
def update_account():
    """
    Update the logged-in admin's own name / email / password.
    ---
    tags:
      - Settings
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name: {type: string}
            email: {type: string}
            currentPassword:
              type: string
              description: Required if `password` is being changed
            password:
              type: string
              description: New password (optional)
    responses:
      200:
        description: Updated user object
      400:
        description: Validation error, or currentPassword missing/wrong
      401:
        description: Unauthorized
      404:
        description: User not found
    """
    user = _current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    data, error = load_json_or_400(update_account_schema)
    if error:
        return error

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()

    if "email" in data and data["email"].strip():
        new_email = data["email"].strip().lower()
        if new_email != user.email and User.query.filter_by(email=new_email).first():
            return jsonify({"error": "Email already in use"}), 400
        user.email = new_email

    new_password = data.get("password")
    if new_password:
        current_password = data.get("currentPassword") or ""
        if not user.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 400
        user.set_password(new_password)

    db.session.commit()
    logger.info("Account updated for user %s", user.id)
    return jsonify(user.to_dict()), 200


# ---- danger zone ------------------------------------------------------

def _delete_donations():
    count = db.session.query(Donation).delete(synchronize_session=False)
    return count


def _delete_applications():
    count = db.session.query(Application).delete(synchronize_session=False)
    return count


def _delete_partners():
    # Delete partners (contacts with source="partnership")
    count = (
        db.session.query(Contact)
        .filter(Contact.source == "partnership")
        .delete(synchronize_session=False)
    )
    return count


RESET_HANDLERS = {
    "partners": _delete_partners,
    "donations": _delete_donations,
    "applications": _delete_applications,
}


@settings_bp.post("/reset")
@jwt_required()
def reset_data():
    """
    Danger zone: permanently delete selected data types.
    Requires the caller's own current password.
    ---
    tags:
      - Settings
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [password, types]
          properties:
            password:
              type: string
            types:
              type: object
              properties:
                partners: {type: boolean}
                donations: {type: boolean}
                applications: {type: boolean}
    responses:
      200:
        description: Deleted counts per type
      400:
        description: No types selected or invalid request
      401:
        description: Unauthorized or incorrect password
      403:
        description: Permission denied
    """
    try:
        # Get current user
        user = _current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        # Get request data
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid request body"}), 400

        password = data.get("password", "")
        types = data.get("types", {})

        # Debug logging
        logger.info(f"Reset request from user {user.id} with password provided: {bool(password)}")
        logger.info(f"Types selected: {types}")

        # Check settings access (role-based, same as org/notifications)
        if not _has_settings_access():
            role = get_jwt().get("role")
            logger.warning(f"User {user.id} (role={role}) does not have settings access")
            return jsonify({"error": "Permission denied"}), 403

        # Validate password
        if not password:
            logger.warning(f"Reset attempt without password from user {user.id}")
            return jsonify({"error": "Password is required"}), 401

        if not user.check_password(password):
            logger.warning(f"Invalid password attempt from user {user.id}")
            return jsonify({"error": "Invalid password"}), 401

        # Get selected data types
        selected = []
        if types.get("partners"):
            selected.append("partners")
        if types.get("donations"):
            selected.append("donations")
        if types.get("applications"):
            selected.append("applications")

        if not selected:
            logger.warning(f"Reset attempt with no data types selected by user {user.id}")
            return jsonify({"error": "Select at least one data type to reset"}), 400

        # Perform deletions
        results = {}
        for data_type in selected:
            try:
                count = RESET_HANDLERS[data_type]()
                results[data_type] = count
                logger.info(f"Deleted {count} {data_type} records")
            except Exception as e:
                logger.error(f"Error deleting {data_type}: {str(e)}")
                return jsonify({"error": f"Error deleting {data_type}: {str(e)}"}), 500

        # Commit the transaction
        db.session.commit()
        
        logger.warning(f"DATA RESET completed by user {user.id}: {results}")
        return jsonify({"deleted": results}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Reset data error: {str(e)}")
        return jsonify({"error": f"Reset failed: {str(e)}"}), 500