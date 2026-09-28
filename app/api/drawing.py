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
    motion: str = Form("random"),
    drawing_type: str = Form("person"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Atomically consume token (or bypass for admin keepdraw)
    if token != "semicolon2026!":
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

    if drawing_type == "static":
        import base64
        b64_img = "data:image/png;base64," + base64.b64encode(image_bytes).decode('utf-8')
        
        await queue_manager.broadcast({
            "type": "NEW_STATIC",
            "data": {
                "image_data": b64_img,
                "motion": motion
            }
        })
        return {
            "status": "COMPLETED",
            "task_id": "static_" + uuid.uuid4().hex[:8],
            "message": "Static drawing broadcasted instantly."
        }

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
    await queue_manager.enqueue_task(task_id, image_bytes, custom_skeleton, motion)

    return {
        "status": "ACCEPTED",
        "task_id": task_id,
        "message": "Drawing received and queued for stage dance animation."
    }

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    progress = queue_manager.task_progress.get(task_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Task not found or not yet started.")
    return progress
