from datetime import datetime

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.contact import Contact
from app.utils.decorators import require_permission
from app.utils.phone import normalize_phone

contacts_bp = Blueprint('contacts', __name__, url_prefix='/api/contacts')

@contacts_bp.route('', methods=['POST'])
def create_contact():
    """
    Create a new contact (for internal use or admin)
    ---
    tags:
      - Contacts
    summary: Create a contact
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name, email, source]
          properties:
            name:
              type: string
              example: "John Doe"
            email:
              type: string
              example: "john@example.com"
            phone:
              type: string
              example: "+254712345678"
            message:
              type: string
            source:
              type: string
              enum: [donation, getinvolved]
            subject:
              type: string
            country:
              type: string
            status:
              type: string
              default: new
    responses:
      201:
        description: Contact created
      400:
        description: Validation error
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    required = ['name', 'email', 'source']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    if data['source'] not in ('donation', 'getinvolved'):
        return jsonify({'error': 'Invalid source.'}), 400
    phone = data.get('phone')
    if phone:
      phone = normalize_phone(phone)
      if not phone:
        return jsonify({'error': 'phone must be a valid international number including country code'}), 400

    contact = Contact(
        name=data['name'],
        email=data['email'],
        phone=phone,
        message=data.get('message'),
        source=data['source'],
        subject=data.get('subject'),
        country=data.get('country'),
        status=data.get('status', 'new')
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify(contact.to_dict()), 201

@contacts_bp.route('', methods=['GET'])
@require_permission("contacts")
def list_contacts():
    """
    List contacts with pagination and optional filters
    ---
    tags:
      - Contacts
    summary: List all contacts
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 20
        maximum: 100
      - name: source
        in: query
        type: string
        enum: [donation, getinvolved]
      - name: status
        in: query
        type: string
        enum: [new, contacted, converted]
    responses:
      200:
        description: Paginated list
        schema:
          type: object
          properties:
            contacts:
              type: array
              items:
                type: object
            total:
              type: integer
            page:
              type: integer
            per_page:
              type: integer
            pages:
              type: integer
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    source = request.args.get('source')
    status = request.args.get('status')

    query = Contact.query
    if source:
        query = query.filter_by(source=source)
    if status:
        query = query.filter_by(status=status)

    query = query.order_by(Contact.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'contacts': [c.to_dict() for c in paginated.items],
        'total': paginated.total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages,
    }), 200

@contacts_bp.route('/<int:contact_id>', methods=['GET'])
@require_permission("contacts")
def get_contact(contact_id):
    """
    Get a single contact by ID
    ---
    tags:
      - Contacts
    summary: Retrieve a contact
    parameters:
      - name: contact_id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: Contact object
      404:
        description: Not found
    """
    contact = Contact.query.get_or_404(contact_id)
    return jsonify(contact.to_dict()), 200

@contacts_bp.route('/<int:contact_id>', methods=['PUT'])
@require_permission("contacts")
def update_contact(contact_id):
    """
    Update a contact (e.g. change status or details)
    ---
    tags:
      - Contacts
    summary: Update a contact
    parameters:
      - name: contact_id
        in: path
        required: true
        type: integer
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            email:
              type: string
            phone:
              type: string
            message:
              type: string
            status:
              type: string
              enum: [new, contacted, converted]
    responses:
      200:
        description: Updated contact
      404:
        description: Not found
    """
    contact = Contact.query.get_or_404(contact_id)
    data = request.get_json() or {}
    if data.get('phone'):
      data['phone'] = normalize_phone(data['phone'])
      if not data['phone']:
        return jsonify({'error': 'phone must be a valid international number including country code'}), 400
    allowed = ['name', 'email', 'phone', 'message', 'status']
    for field in allowed:
        if field in data:
            setattr(contact, field, data[field])
    contact.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(contact.to_dict()), 200

@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
@require_permission("contacts")
def delete_contact(contact_id):
    """
    Delete a contact
    ---
    tags:
      - Contacts
    summary: Delete a contact
    parameters:
      - name: contact_id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: Deleted
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: Not found
    """
    contact = Contact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    return jsonify({'message': 'Contact deleted'}), 200