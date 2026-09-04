from datetime import datetime

from app.extensions import db


class Donation(db.Model):


    __tablename__ = "donations"

    STATUSES = ("Pending", "Completed", "Failed")

    id = db.Column(db.Integer, primary_key=True)

    donor_name = db.Column(db.String(160), nullable=False, default="Anonymous")
    email = db.Column(db.String(160), nullable=True)
    phone = db.Column(db.String(32), nullable=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(8), nullable=False, default="KES")  # KES | USD

    # 'mpesa' -> Paystack mobile_money channel, 'card' -> Paystack card channel,
    # 'manual' -> entered directly by an admin (cash, offline mpesa, etc.)
    method = db.Column(db.String(20), nullable=False, default="mpesa")

    reference = db.Column(db.String(64), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="Pending")

    paystack_channel = db.Column(db.String(40), nullable=True)
    gateway_response = db.Column(db.String(255), nullable=True)
    send_whatsapp_receipt = db.Column(db.Boolean, nullable=False, default=False)

    recorded_by_id = db.Column(db.Integer, nullable=True)

    paid_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def mask_phone(self) -> str:
        if not self.phone:
            return "+254 7•• ••• 000"
        digits = "".join(ch for ch in self.phone if ch.isdigit())
        last3 = digits[-3:].rjust(3, "0")
        return f"+254 7•• ••• {last3}"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "donor": self.donor_name,
            "email": self.email,
            "amount": float(self.amount),
            "currency": self.currency,
            "method": self.method,
            "phone": self.phone or "", 
            "reference": self.reference,
            "status": self.status,
            "paystack_channel": self.paystack_channel,
            "date": self.created_at.strftime("%d %b %Y, %H:%M") if self.created_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "month": "current" if self._is_current_month() else "prior",
        }

    def to_public_dict(self) -> dict:
        return {
            "id": self.id,
            "donor": self.donor_name,
            "amount": float(self.amount),
            "currency": self.currency,
            "phone": self.mask_phone(),  
            "reference": self.reference,
            "status": self.status,
            "date": self.created_at.strftime("%d %b %Y, %H:%M") if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def _is_current_month(self) -> bool:
        now = datetime.utcnow()
        return (
            self.created_at is not None
            and self.created_at.year == now.year
            and self.created_at.month == now.month
        )

    def __repr__(self) -> str:
        return f"<Donation {self.reference} {self.amount} {self.currency} {self.status}>"