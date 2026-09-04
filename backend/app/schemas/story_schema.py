from marshmallow import Schema, fields, validate, EXCLUDE

from app.models.story import ALLOWED_PILLARS, ALLOWED_STATUSES


class CreateStorySchema(Schema):
    class Meta:
        unknown = EXCLUDE
    """
    POST /api/admin/stories -- creates a story. `title`/`status`/`author`
    all fall back to sane defaults if omitted, matching the old
    storiesStore.js behaviour (Untitled / draft / You), but pillar is
    always required -- there's no sensible default for that one.
    """

    title = fields.Str(load_default="Untitled", validate=validate.Length(max=255))
    pillar = fields.Str(required=True, validate=validate.OneOf(list(ALLOWED_PILLARS)))
    content = fields.Str(load_default="")
    excerpt = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=300))
    thumbnail = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default="draft", validate=validate.OneOf(list(ALLOWED_STATUSES)))
    author = fields.Str(load_default="You", validate=validate.Length(max=120))
    slug = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=255))
    date = fields.Date(load_default=None, allow_none=True)


class UpdateStorySchema(Schema):
    class Meta:
        unknown = EXCLUDE
    """PUT /api/admin/stories/<id> -- every field optional, only given ones are changed."""

    title = fields.Str(validate=validate.Length(min=1, max=255))
    pillar = fields.Str(validate=validate.OneOf(list(ALLOWED_PILLARS)))
    content = fields.Str()
    excerpt = fields.Str(allow_none=True, validate=validate.Length(max=300))
    thumbnail = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(list(ALLOWED_STATUSES)))
    author = fields.Str(validate=validate.Length(max=120))
    slug = fields.Str(validate=validate.Length(max=255))
    date = fields.Date(allow_none=True)


create_story_schema = CreateStorySchema()
update_story_schema = UpdateStorySchema(partial=True)
