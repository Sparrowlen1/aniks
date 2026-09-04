import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import ROLES, User
from app.utils.decorators import require_role
from app.utils.email import send_team_invite_email

logger = logging.getLogger(__name__)

team_bp = Blueprint("team", __name__, url_prefix="/api/team")


@team_bp.get("")
@require_role("leadership")
def list_team():
    """
    List everyone with a dashboard account.
    ---
    tags:
      - Team
    summary: List team members
    security:
      - Bearer: []
    responses:
      200:
        description: All users, oldest account first
      401:
        description: Missing/invalid token
      403:
        description: Caller isn't leadership
    """
    users = User.query.order_by(User.created_at.asc()).all()
    return jsonify([u.to_dict() for u in users])


@team_bp.post("")
@require_role("leadership")
def create_team_member():
    """
    Invite a new team member (creates a real account immediately).
    ---
    tags:
      - Team
    summary: Create a team member
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email, password, role]
          properties:
            name: {type: string, example: "Amara K."}
            email: {type: string, example: "amara@anikainitiative.com"}
            password: {type: string, example: "changeme123"}
            role: {type: string, enum: [leadership, comms, programs, mel]}
    responses:
      201:
        description: Created
      400:
        description: Validation error
      409:
        description: Email already in use
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role")

    if not name or not email or not password:
        return jsonify({"error": "name, email, and password are required"}), 400
    if role not in ROLES:
        return jsonify({"error": f"role must be one of {ROLES}"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "A user with that email already exists"}), 409

    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Email failures should never break account creation itself
    try:
        send_team_invite_email(user, password)
    except Exception:
        logger.exception("Failed to send invite email to %s", user.email)

    return jsonify(user.to_dict()), 201


@team_bp.patch("/<int:user_id>")
@require_role("leadership")
def update_team_member(user_id):
    """
    Edit a team member's name, email, role, or active status.
    ---
    tags:
      - Team
    summary: Update a team member
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        required: true
        type: integer
      - in: body
        name: body
        schema:
          type: object
          properties:
            name: {type: string}
            email: {type: string}
            role: {type: string, enum: [leadership, comms, programs, mel]}
            isActive: {type: boolean}
    responses:
      200:
        description: Updated
      400:
        description: Validation error
      404:
        description: Not found
      409:
        description: Email already in use by another account
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        user.name = name

    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if not email:
            return jsonify({"error": "email cannot be empty"}), 400
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != user.id:
            return jsonify({"error": "A user with that email already exists"}), 409
        user.email = email

    if "role" in data:
        role = data.get("role")
        if role not in ROLES:
            return jsonify({"error": f"role must be one of {ROLES}"}), 400
        user.role = role

    if "isActive" in data:
        user.is_active = bool(data.get("isActive"))

    db.session.commit()
    return jsonify(user.to_dict())


@team_bp.delete("/<int:user_id>")
@require_role("leadership")
def delete_team_member(user_id):
    """
    Remove a team member's account.
    ---
    tags:
      - Team
    summary: Delete a team member
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        required: true
        type: integer
    responses:
      204:
        description: Deleted
      400:
        description: Can't delete yourself or the last leadership account
      404:
        description: Not found
    """
    user = User.query.get_or_404(user_id)

    if str(user.id) == get_jwt_identity():
        return jsonify({"error": "You can't remove your own account"}), 400

    if user.role == "leadership":
        remaining = User.query.filter_by(role="leadership").filter(User.id != user.id).count()
        if remaining == 0:
            return jsonify({"error": "Can't remove the last leadership account"}), 400

    db.session.delete(user)
    db.session.commit()
    return "", 204
