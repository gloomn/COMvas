from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.queue_manager import queue_manager
from app.api.deps import verify_admin

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

class DeleteRequest(BaseModel):
    id: str

@router.get("/objects")
async def get_recent_objects():
    # Return recent objects list (reverse order so newest is first)
    return {"objects": queue_manager.recent_objects[::-1]}

@router.post("/delete", dependencies=[Depends(verify_admin)])
async def delete_object(req: DeleteRequest):
    # Find if it exists
    obj_id = req.id
    await queue_manager.broadcast({
        "event": "DELETE_OBJECT",
        "data": {"id": obj_id}
    })
    return {"status": "success", "message": f"Object {obj_id} deletion broadcasted."}

@router.post("/qr/refresh", dependencies=[Depends(verify_admin)])
async def refresh_qr():
    await queue_manager.broadcast({
        "event": "QR_REFRESH_REQUEST"
    })
    return {"status": "success", "message": "QR refresh broadcasted."}
