from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import get_jwt, verify_jwt_in_request

RESOURCE_ACCESS = {
    "leadership": "__all__", 
    "comms": {
        "dashboard", "contacts", "stories", "gallery",
        "whatsapp_broadcast", "whatsapp_inbox", "messages", "impact",
        "newsletter",
    },
    "programs": {
        "dashboard", "contacts", "events", "registrations",
        "applications", "partners", "messages",
    },
    "mel": {
        "dashboard", "contributions", "donations", "impact", "reports",
    },
}

def role_has_access(role: str, resource: str) -> bool:
    allowed = RESOURCE_ACCESS.get(role)
    if allowed == "__all__":
        return True
    if allowed is None:
        return False
    return resource in allowed

def require_permission(resource: str):
    """
    Guards a route by resource name, e.g.:
 
        @donations_bp.route("/api/donations", methods=["GET"])
        @require_permission("donations")
        def list_donations():
            ...
 
    Checks (in order): is there a valid JWT at all, and does the role in
    that JWT have access to this resource. Returns 401 if the token is
    missing/invalid, 403 if the role just isn't allowed here.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
          
            if request.method == "OPTIONS":
                return fn(*args, **kwargs)
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if not role_has_access(role, resource):
                return jsonify({
                    "error": "forbidden",
                    "message": f"Role '{role}' does not have access to '{resource}'",
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def require_role(*roles: str):
    """
    For the rarer case where you want to check role identity directly
    rather than a mapped resource (e.g. leadership-only account creation).
 
        @team_bp.route("/api/team", methods=["POST"])
        @require_role("leadership")
        def create_team_member():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return fn(*args, **kwargs)
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in roles:
                return jsonify({
                    "error": "forbidden",
                    "message": f"Role '{role}' is not permitted to perform this action",
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator