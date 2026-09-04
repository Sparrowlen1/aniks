import os
import uuid

import cloudinary.uploader
from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.gallery import GalleryImage
from app.utils.decorators import require_permission

gallery_bp = Blueprint("gallery", __name__, url_prefix="/api/gallery")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB


def _extension_of(filename):
    if "." not in filename:
        return None
    return filename.rsplit(".", 1)[1].lower()


@gallery_bp.route("", methods=["GET"])
def list_images():
    """
    List all gallery images, newest first.
    ---
    tags:
      - Gallery
    responses:
      200:
        description: Array of gallery images (newest first)
        schema:
          type: array
          items:
            type: object
            properties:
              id: {type: integer}
              src: {type: string, description: "Public image URL"}
              alt: {type: string}
              caption: {type: string}
              extension: {type: string}
              created_at: {type: string}
    """
    images = GalleryImage.query.order_by(GalleryImage.created_at.desc()).all()
    return jsonify([img.to_dict() for img in images]), 200


@gallery_bp.route("", methods=["POST"])
@require_permission("gallery")
def upload_image():
    """
    Upload a new gallery image (admin).
    ---
    tags:
      - Gallery
    consumes:
      - multipart/form-data
    parameters:
      - name: image
        in: formData
        type: file
        required: true
        description: jpg, jpeg, png, gif or webp -- max 8MB
      - name: caption
        in: formData
        type: string
        required: false
        description: Defaults to the filename if omitted
    responses:
      201:
        description: Image created
      400:
        description: Missing file, bad extension, or file too large
      502:
        description: Upload to Cloudinary failed
    """
    if "image" not in request.files:
        current_app.logger.warning("Gallery upload attempted with no file part")
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        current_app.logger.warning("Gallery upload attempted with empty filename")
        return jsonify({"error": "No file selected"}), 400

    extension = _extension_of(file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        current_app.logger.warning("Gallery upload rejected: bad extension '%s'", extension)
        return jsonify({
            "error": f"Unsupported file type '.{extension}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
        }), 400

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        current_app.logger.warning("Gallery upload rejected: file too large (%s bytes)", size)
        return jsonify({"error": "File too large. Max 8MB."}), 400

    caption = request.form.get("caption", "").strip() or file.filename.rsplit(".", 1)[0]

    try:
        result = cloudinary.uploader.upload(
            file,
            folder="anika_gallery",
            public_id=str(uuid.uuid4()),
            resource_type="image",
        )
    except Exception as exc:  # cloudinary raises assorted exception types
        current_app.logger.error("Cloudinary upload failed: %s", exc)
        return jsonify({"error": "Image upload to storage provider failed"}), 502

    image = GalleryImage(
        caption=caption,
        url=result["secure_url"],
        public_id=result["public_id"],
        extension=extension,
    )
    db.session.add(image)
    db.session.commit()

    current_app.logger.info("Gallery image uploaded: id=%s caption=%r", image.id, image.caption)
    return jsonify(image.to_dict()), 201


@gallery_bp.route("/<int:image_id>", methods=["PATCH"])
@require_permission("gallery")
def update_image(image_id):
    """
    Edit a gallery image's caption (admin).
    ---
    tags:
      - Gallery
    parameters:
      - name: image_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            caption:
              type: string
    responses:
      200:
        description: Updated image
      400:
        description: No caption provided
      404:
        description: Image not found
    """
    image = GalleryImage.query.get(image_id)
    if not image:
        current_app.logger.warning("Edit attempted on missing gallery image id=%s", image_id)
        return jsonify({"error": "Image not found"}), 404

    data = request.get_json(silent=True) or {}
    caption = (data.get("caption") or "").strip()
    if not caption:
        return jsonify({"error": "caption is required"}), 400

    old_caption = image.caption
    image.caption = caption
    db.session.commit()

    current_app.logger.info(
        "Gallery image caption updated: id=%s %r -> %r", image.id, old_caption, caption
    )
    return jsonify(image.to_dict()), 200


@gallery_bp.route("/<int:image_id>", methods=["DELETE"])
@require_permission("gallery")
def delete_image(image_id):
    """
    Delete a gallery image (admin).
    ---
    tags:
      - Gallery
    parameters:
      - name: image_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Image deleted
      404:
        description: Image not found
    """
    image = GalleryImage.query.get(image_id)
    if not image:
        current_app.logger.warning("Delete attempted on missing gallery image id=%s", image_id)
        return jsonify({"error": "Image not found"}), 404

    if image.public_id:
        try:
            cloudinary.uploader.destroy(image.public_id)
        except Exception as exc:
            # Don't block DB cleanup if the remote asset is already gone/unreachable
            current_app.logger.error(
                "Cloudinary delete failed for public_id=%s: %s", image.public_id, exc
            )

    db.session.delete(image)
    db.session.commit()

    current_app.logger.info("Gallery image deleted: id=%s caption=%r", image_id, image.caption)
    return jsonify({"message": "Image deleted", "id": image_id}), 200
