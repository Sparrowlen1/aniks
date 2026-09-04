
import os
 
from app import create_app
from app.extensions import db
from app.models.user import User
 
# One entry per role. Each pulls its email/password/name from a
# role-specific set of env vars, e.g. SEED_LEADERSHIP_EMAIL.
ROLES = ["leadership", "comms", "programs", "mel"]
 
 
def load_role_config(role):
    prefix = f"SEED_{role.upper()}_"
    return {
        "role": role,
        "email": os.getenv(f"{prefix}EMAIL"),
        "password": os.getenv(f"{prefix}PASSWORD"),
        "name": os.getenv(f"{prefix}NAME", role.capitalize()),
    }
 
 
def seed_user(name, email, role, password):
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f"Already exists: {email} (role={existing.role}) -- skipping.")
        return
    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    print(f"Created {role} user: {email}")
 
 
app = create_app()
 
with app.app_context():
    for role in ROLES:
        config = load_role_config(role)
        if not config["email"] or not config["password"]:
            print(f"SEED_{role.upper()}_EMAIL / SEED_{role.upper()}_PASSWORD not set -- skipping {role}.")
            continue
        seed_user(config["name"], config["email"], config["role"], config["password"])
 