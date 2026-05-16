"""
JWT Token Blocklist — tracks revoked tokens to enforce proper logout.
Uses a database-backed approach for persistence across restarts.
"""
from datetime import datetime, timezone
from app.models.base import db


class TokenBlocklist(db.Model):
    """Stores JTIs (JWT Token IDs) of revoked tokens."""
    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    revoked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f'<TokenBlocklist jti={self.jti}>'


def add_token_to_blocklist(jti):
    """Add a token JTI to the blocklist (call on logout)."""
    entry = TokenBlocklist(jti=jti)
    db.session.add(entry)
    db.session.commit()


def is_token_revoked(jti):
    """Check if a token JTI has been revoked."""
    return db.session.query(
        TokenBlocklist.query.filter_by(jti=jti).exists()
    ).scalar()
