import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.database import init_db
from app.services.queue_manager import queue_manager
from app.api.auth import router as auth_router
from app.api.drawing import router as drawing_router
from app.api.admin import router as admin_router
from config.settings import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup initialization
    init_db()
    queue_manager.start_worker()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Include API routers
app.include_router(auth_router)
app.include_router(drawing_router)
app.include_router(admin_router)

# Mount outputs & static files
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=settings.OUTPUT_DIR), name="outputs")

frontend_dir = os.path.join(settings.BASE_DIR, "frontend")
app.mount("/frontend", StaticFiles(directory=frontend_dir), name="frontend")

# WebSockets endpoint for Display Viewer
@app.websocket("/ws/stage")
async def stage_websocket_endpoint(websocket: WebSocket):
    await queue_manager.register_websocket(websocket)
    try:
        while True:
            # Keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        queue_manager.unregister_websocket(websocket)

# HTML Page Routes
@app.get("/draw")
async def get_drawing_pad():
    # When a user scans the QR code and visits this page, let the QR screen know to refresh!
    await queue_manager.broadcast({"event": "QR_SCANNED"})
    pad_html = os.path.join(frontend_dir, "pages", "pad", "index.html")
    return FileResponse(pad_html)

@app.get("/viewer")
async def get_stage_viewer():
    viewer_html = os.path.join(frontend_dir, "pages", "viewer", "index.html")
    return FileResponse(viewer_html)

@app.get("/qrcode")
async def get_qrcode_page():
    qr_html = os.path.join(frontend_dir, "pages", "qrcode", "index.html")
    return FileResponse(qr_html)

@app.get("/keepdraw")
async def get_keepdraw_page():
    keepdraw_html = os.path.join(frontend_dir, "pages", "keepdraw", "index.html")
    return FileResponse(keepdraw_html)

@app.get("/admin")
async def get_admin_page():
    admin_html = os.path.join(frontend_dir, "pages", "admin", "index.html")
    return FileResponse(admin_html)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "viewer_url": "/viewer",
        "draw_pad_url": "/draw",
        "qrcode_url": "/qrcode"
    }
