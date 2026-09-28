import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.token_service import verify_and_consume_token
from app.services.queue_manager import queue_manager

router = APIRouter(prefix="/api/v1/drawing", tags=["Drawing Submission"])

@router.post("/submit")
async def submit_drawing(
    token: str = Form(...),
    skeleton_json: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Submits drawing from mobile pad:
    1. Verifies and atomically consumes token (flips to USED).
    2. Pushes image bytes into Jetson single-worker AI queue.
    3. Returns 202 Accepted.
    """
    # 1. Atomically consume token
    success = verify_and_consume_token(db, token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Token is invalid, expired, or already consumed."
        )

    # 2. Read image bytes
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file provided.")

    # Parse custom skeleton if provided
    custom_skeleton = None
    if skeleton_json:
        import json
        try:
            custom_skeleton = json.loads(skeleton_json)
        except:
            pass

    # 3. Create task ID and enqueue for AI processing
    task_id = f"char_{uuid.uuid4().hex[:8]}"
    await queue_manager.enqueue_task(task_id, image_bytes, custom_skeleton)

    return {
        "status": "ACCEPTED",
        "task_id": task_id,
        "message": "Drawing received and queued for stage dance animation."
    }
