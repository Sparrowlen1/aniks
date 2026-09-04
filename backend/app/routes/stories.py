from datetime import date as date_cls

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.story import Story, content_to_excerpt, generate_slug
from app.schemas.story_schema import create_story_schema, update_story_schema
from app.utils.validation import load_json_or_400
from app.utils.decorators import require_permission

stories_bp = Blueprint("stories", __name__)


# helpers

def _unique_slug(base_slug, exclude_id=None):
    slug = base_slug
    counter = 1
    while True:
        query = Story.query.filter_by(slug=slug)
        if exclude_id is not None:
            query = query.filter(Story.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


# public routes

@stories_bp.get("/api/stories")
def list_published_stories():
    """
    List published stories.
    ---
    tags:
      - Stories
    parameters:
      - name: pillar
        in: query
        type: string
        required: false
        description: Filter by pillar slug (e.g. arts-and-culture)
    responses:
      200:
        description: List of published stories
    """
    pillar = request.args.get("pillar")
    query = Story.query.filter_by(status="published")
    if pillar and pillar != "all":
        query = query.filter_by(pillar=pillar)
    stories = query.order_by(Story.published_date.desc()).all()
    return jsonify([s.to_public_dict() for s in stories])


@stories_bp.get("/api/stories/<slug>")
def get_story_by_slug(slug):
    """
    Get a single published story by slug.
    ---
    tags:
      - Stories
    parameters:
      - name: slug
        in: path
        type: string
        required: true
    responses:
      200:
        description: The story
      404:
        description: Story not found
    """
    story = Story.query.filter_by(slug=slug, status="published").first()
    if not story:
        return jsonify({"error": "Story not found"}), 404
    return jsonify(story.to_public_dict())


# admin routes --

@stories_bp.get("/api/admin/stories")
@require_permission("stories")
def list_all_stories():
    """
    List all stories, any status.
    ---
    tags:
      - Stories (admin)
    parameters:
      - name: status
        in: query
        type: string
        required: false
        description: Filter by status (draft, review, published)
    responses:
      200:
        description: List of stories
    """
    status = request.args.get("status")
    query = Story.query
    if status and status != "all":
        query = query.filter_by(status=status)
    stories = query.order_by(Story.updated_at.desc()).all()
    return jsonify([s.to_admin_dict() for s in stories])


@stories_bp.get("/api/admin/stories/<int:story_id>")
@require_permission("stories")
def get_story_by_id(story_id):
    """
    Get a single story by id, any status.
    ---
    tags:
      - Stories (admin)
    parameters:
      - name: story_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: The story
      404:
        description: Story not found
    """
    story = Story.query.get_or_404(story_id)
    return jsonify(story.to_admin_dict())


@stories_bp.post("/api/admin/stories")
@require_permission("stories")
def create_story():
    """
    Create a story.
    ---
    tags:
      - Stories (admin)
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title: {type: string}
            pillar: {type: string}
            content: {type: string}
            status: {type: string}
            author: {type: string}
            thumbnail: {type: string}
    responses:
      201:
        description: Created story
      400:
        description: Validation error
    """
    data, error = load_json_or_400(create_story_schema)
    if error:
        return error

    title = data["title"].strip() or "Untitled"
    status = data["status"]

    base_slug = data.get("slug") or generate_slug(title)
    slug = _unique_slug(base_slug)

    published_date = None
    if status == "published":
        published_date = date_cls.today()
    elif data.get("date"):
        published_date = data["date"]

    story = Story(
        slug=slug,
        pillar=data["pillar"],
        title=title,
        excerpt=data.get("excerpt") or content_to_excerpt(data.get("content", "")),
        content=data.get("content", ""),
        thumbnail=data.get("thumbnail"),
        status=status,
        author=data["author"],
        published_date=published_date,
    )
    db.session.add(story)
    db.session.commit()
    return jsonify(story.to_admin_dict()), 201


@stories_bp.put("/api/admin/stories/<int:story_id>")
@require_permission("stories")
def update_story(story_id):
    """
    Update a story.
    ---
    tags:
      - Stories (admin)
    parameters:
      - name: story_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
    responses:
      200:
        description: Updated story
      400:
        description: Validation error
      404:
        description: Story not found
    """
    story = Story.query.get_or_404(story_id)
    data, error = load_json_or_400(update_story_schema)
    if error:
        return error

    if "pillar" in data:
        story.pillar = data["pillar"]

    if "status" in data:
        if data["status"] == "published" and not story.published_date:
            story.published_date = date_cls.today()
        story.status = data["status"]

    if "title" in data:
        story.title = data["title"].strip() or story.title
    if "content" in data:
        story.content = data["content"]
    if "excerpt" in data:
        story.excerpt = data["excerpt"]
    if "thumbnail" in data:
        story.thumbnail = data["thumbnail"]
    if "author" in data:
        story.author = data["author"]
    if data.get("date"):
        story.published_date = data["date"]
    if data.get("slug") and data["slug"] != story.slug:
        story.slug = _unique_slug(data["slug"], exclude_id=story.id)

    db.session.commit()
    return jsonify(story.to_admin_dict())


@stories_bp.delete("/api/admin/stories/<int:story_id>")
@require_permission("stories")
def delete_story(story_id):
    """
    Delete a story.
    ---
    tags:
      - Stories (admin)
    parameters:
      - name: story_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      404:
        description: Story not found
    """
    story = Story.query.get_or_404(story_id)
    db.session.delete(story)
    db.session.commit()
    return "", 204
