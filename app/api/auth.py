from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.token_service import create_token, check_token_validity

router = APIRouter(prefix="/api/v1/auth", tags=["Auth & Tokens"])

@router.post("/token/generate")
def generate_token_endpoint(db: Session = Depends(get_db)):
    """Generates a new 1-time active token (for QR code kiosk / admin)."""
    token = create_token(db)
    return {
        "token": token.value,
        "expires_at": token.expires_at.isoformat(),
        "draw_url": f"/draw?token={token.value}"
    }

@router.get("/token/verify")
def verify_token_endpoint(token: str, db: Session = Depends(get_db)):
    """Verifies if the QR token is currently valid."""
    is_valid = check_token_validity(db, token)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token is invalid, expired, or already used."
        )
    return {"valid": True, "token": token}

from pydantic import BaseModel
import secrets
from app.api.deps import ACTIVE_ADMIN_TOKENS, ADMIN_MASTER_TOKEN

class AdminLoginRequest(BaseModel):
    password: str

@router.post("/admin/login")
def admin_login(req: AdminLoginRequest):
    """Verifies admin password and issues a session token."""
    if req.password == "semicolon2026!":
        return {"admin_token": ADMIN_MASTER_TOKEN}
    raise HTTPException(status_code=401, detail="Invalid password")
