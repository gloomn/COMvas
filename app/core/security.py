import uuid

def generate_unique_token() -> str:
    """Generates a secure 1-time token string for QR codes."""
    return str(uuid.uuid4()).replace("-", "")
