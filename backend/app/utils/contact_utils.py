from app.extensions import db
from app.models.contact import Contact

def create_contact_from_data(name, email, phone, message, source, subject=None, country=None, status='new'):
    try:
        contact = Contact(
            name=name,
            email=email,
            phone=phone,
            message=message,
            source=source,
            subject=subject,
            country=country,
            status=status
        )
        db.session.add(contact)
        db.session.commit()
        return contact
    except Exception:
        return None