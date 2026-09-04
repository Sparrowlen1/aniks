"""
Single shared instances of every Flask extension.

Import these into models/routes instead of creating new instances, e.g.:
    from app.extensions import db

NOTE: auth (flask-jwt-extended, flask-bcrypt) was removed for now -- the
donation routes are open. When auth comes back, re-add `jwt`/`bcrypt` here,
re-add app/models/user.py, app/routes/auth.py, app/utils/decorators.py,
and re-protect the admin routes in app/routes/donations.py.
"""
from flasgger import Swagger
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
cors = CORS()
swagger = Swagger()
mail = Mail()
jwt = JWTManager()
