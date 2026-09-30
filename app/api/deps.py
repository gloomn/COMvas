from app.core.database import get_db
import secrets
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
ACTIVE_ADMIN_TOKENS = set()
ADMIN_MASTER_TOKEN = "semicolon_master_token_2026"

def verify_admin(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != ADMIN_MASTER_TOKEN and credentials.credentials not in ACTIVE_ADMIN_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

# Re-export get_db for route dependencies
__all__ = ["get_db", "verify_admin", "ACTIVE_ADMIN_TOKENS", "ADMIN_MASTER_TOKEN"]
