from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import Token, TokenStatus
from app.core.security import generate_unique_token
from config.settings import settings

def create_token(db: Session, expire_minutes: int = settings.TOKEN_EXPIRE_MINUTES) -> Token:
    """Create a new active 1-time token."""
    token_str = generate_unique_token()
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=expire_minutes)
    
    token = Token(
        value=token_str,
        created_at=now,
        expires_at=expires_at,
        status=TokenStatus.ACTIVE
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token

def check_token_validity(db: Session, token_str: str) -> bool:
    """Check if token exists, is ACTIVE, and not expired."""
    token = db.query(Token).filter(Token.value == token_str).first()
    if not token:
        return False
    if token.status != TokenStatus.ACTIVE:
        return False
    if token.expires_at < datetime.utcnow():
        token.status = TokenStatus.EXPIRED
        db.commit()
        return False
    return True

def verify_and_consume_token(db: Session, token_str: str) -> bool:
    """
    Atomically verify token and mark as USED.
    Returns True if token was valid and consumed, False otherwise.
    """
    token = db.query(Token).filter(Token.value == token_str).with_for_update().first()
    if not token or token.status != TokenStatus.ACTIVE or token.expires_at < datetime.utcnow():
        if token and token.expires_at < datetime.utcnow():
            token.status = TokenStatus.EXPIRED
            db.commit()
        return False
    
    token.status = TokenStatus.USED
    token.used_at = datetime.utcnow()
    db.commit()
    return True
