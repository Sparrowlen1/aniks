from flask import jsonify, request
from marshmallow import ValidationError


class SchemaValidationFailed(Exception):
    """Raised internally so routes can `return validated_or_error(...)` in one line."""

    def __init__(self, response):
        self.response = response


def load_json_or_400(schema):
    """
    Validate the current request's JSON body against a marshmallow schema.
    Returns (data, None) on success, or (None, (response, 400)) on failure --
    so a route can do:

        data, error = load_json_or_400(my_schema)
        if error:
            return error
    """
    payload = request.get_json(silent=True) or {}
    try:
        data = schema.load(payload)
        return data, None
    except ValidationError as err:
        return None, (jsonify({"error": "Validation failed", "details": err.messages}), 400)
