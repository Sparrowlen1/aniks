"""
app/schemas/settings_schema.py

Follows the same shape as donation_schema.py / story_schema.py in your
codebase. If your project uses a different validation lib than
marshmallow, swap this file for the equivalent — load_json_or_400() is
the only thing settings_routes.py depends on.
"""
from marshmallow import Schema, fields, validate


class UpdateOrgSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=200))
    email = fields.Email(allow_none=True)
    phone = fields.String(allow_none=True, validate=validate.Length(max=30))


class UpdateNotificationsSchema(Schema):
    donationAlerts = fields.Boolean()
    applicationAlerts = fields.Boolean()
    whatsappAlerts = fields.Boolean()
    weeklyDigest = fields.Boolean()


class UpdateAccountSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=120))
    email = fields.Email()
    currentPassword = fields.String()
    password = fields.String(validate=validate.Length(min=8))


update_org_schema = UpdateOrgSchema()
update_notifications_schema = UpdateNotificationsSchema()
update_account_schema = UpdateAccountSchema()