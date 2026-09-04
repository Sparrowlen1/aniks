
import uuid
from datetime import timedelta

import cloudinary.uploader
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

ACCESS_TOKEN_EXPIRY = timedelta(hours=8)
REFRESH_TOKEN_EXPIRY = timedelta(days=30)

ALLOWED_AVATAR_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_AVATAR_SIZE_BYTES = 4 * 1024 * 1024  # 4 MB


def _extension_of(filename):
    if "." not in filename:
        return None
    return filename.rsplit(".", 1)[1].lower()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify ({"error": "Email and Password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password) or not user.is_active:
        return jsonify({"error": "Invalid Credentials"}), 401

    # token

    additional_claims = {"role": user.role}

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
        expires_delta=ACCESS_TOKEN_EXPIRY,
    )

    # refresh token for expired access token
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims=additional_claims,
        expires_delta=REFRESH_TOKEN_EXPIRY
    )

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)

def refresh():
    identity = get_jwt_identity()
    role = get_jwt().get("role")

    new_access_token = create_access_token(
        identity=identity,
        additional_claims={"role": role},
        expires_delta=ACCESS_TOKEN_EXPIRY,
    )
    return jsonify({"access_token": new_access_token}), 200


@auth_bp.route("/password", methods=["PATCH"])
@jwt_required()
def change_password():
    """
    Let the logged-in user change their own password.
    ---
    tags:
      - Auth
    summary: Change your own password
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [currentPassword, newPassword]
          properties:
            currentPassword: {type: string}
            newPassword: {type: string, example: "at least 8 characters"}
    responses:
      200:
        description: Password changed
      400:
        description: Validation error (missing fields, new password too short)
      401:
        description: Current password is wrong, or token missing/invalid
    """
    data = request.get_json(silent=True) or {}
    current_password = data.get("currentPassword") or ""
    new_password = data.get("newPassword") or ""

    if not current_password or not new_password:
        return jsonify({"error": "currentPassword and newPassword are required"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user = User.query.get_or_404(int(get_jwt_identity()))

    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """
    Get the logged-in user's own profile.
    ---
    tags:
      - Auth
    summary: Get your own profile
    security:
      - Bearer: []
    responses:
      200:
        description: The current user
    """
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.to_dict())


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    """
    Update your own display name. Email, role, and active status are not
    self-editable -- these are shared role logins (comms@..., programs@...,
    etc), not personal accounts, so the login email has to stay whatever the
    team has on record. Leadership can still correct it via /api/team.
    ---
    tags:
      - Auth
    summary: Update your own display name
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name]
          properties:
            name: {type: string}
    responses:
      200:
        description: Updated
      400:
        description: Validation error
    """
    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name cannot be empty"}), 400
    user.name = name

    db.session.commit()
    return jsonify(user.to_dict())


@auth_bp.route("/me/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """
    Upload/replace your own profile picture.
    ---
    tags:
      - Auth
    summary: Upload your avatar
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - name: avatar
        in: formData
        type: file
        required: true
        description: jpg, jpeg, png, gif or webp -- max 4MB
    responses:
      200:
        description: Updated
      400:
        description: Missing file, bad extension, or file too large
      502:
        description: Upload to storage provider failed
    """
    if "avatar" not in request.files:
        return jsonify({"error": "No avatar file provided"}), 400

    file = request.files["avatar"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    extension = _extension_of(file.filename)
    if extension not in ALLOWED_AVATAR_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported file type '.{extension}'. Allowed: {sorted(ALLOWED_AVATAR_EXTENSIONS)}"
        }), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_AVATAR_SIZE_BYTES:
        return jsonify({"error": "File too large. Max 4MB."}), 400

    user = User.query.get_or_404(int(get_jwt_identity()))

    try:
        result = cloudinary.uploader.upload(
            file,
            folder="anika_avatars",
            public_id=f"user-{user.id}-{uuid.uuid4()}",
            resource_type="image",
        )
    except Exception as exc:  # cloudinary raises assorted exception types
        current_app.logger.error("Cloudinary avatar upload failed: %s", exc)
        return jsonify({"error": "Image upload to storage provider failed"}), 502

    user.avatar_url = result["secure_url"]
    db.session.commit()

    return jsonify(user.to_dict())
