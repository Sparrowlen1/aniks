import cloudinary


def init_cloudinary(app):
    cloudinary.config(
        cloud_name=app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=app.config["CLOUDINARY_API_KEY"],
        api_secret=app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )

    if not app.config["CLOUDINARY_CLOUD_NAME"]:
        app.logger.warning(
            "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME is empty). "
            "Gallery uploads will fail until CLOUDINARY_* env vars are set."
        )
