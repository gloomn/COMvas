import asyncio
import json
import traceback
from typing import Set
from fastapi import WebSocket
from app.services.ai_pipeline import process_sketch_pipeline

class JetsonAIQueueManager:
    """
    Single-worker Async Queue Manager for NVIDIA Jetson Orin Nano Super.
    Prevents CUDA Out-Of-Memory (OOM) by running AI processing tasks sequentially.
    """
    def __init__(self):
        self.queue = asyncio.Queue()
        self.active_websockets: Set[WebSocket] = set()
        self.worker_task = None
        self.task_progress = {}
        self.recent_objects = []
        self.loop = None

    def server_log(self, message: str):
        print(message)
        if self.loop is not None and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self.broadcast({"type": "SERVER_LOG", "message": message}), 
                self.loop
            )

    def update_progress(self, task_id: str, progress: int, status: str):
        self.task_progress[task_id] = {"progress": progress, "status": status}
        self.server_log(f"[Task {task_id}] {progress}% - {status}")
        self.broadcast_queue_status()

    def broadcast_queue_status(self):
        queue_items = [{"task_id": t[0], "motion": t[3]} for t in list(self.queue._queue)]
        active_tasks = {k: v for k, v in self.task_progress.items() if v["progress"] < 100}
        message = {
            "type": "QUEUE_STATUS",
            "active_tasks": active_tasks,
            "queue": queue_items
        }
        if self.loop is not None and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self.broadcast(message), 
                self.loop
            )

    def start_worker(self, num_workers=3):
        if not getattr(self, 'workers_started', False):
            self.loop = asyncio.get_running_loop()
            for _ in range(num_workers):
                asyncio.create_task(self._worker_loop())
            self.workers_started = True
            self.server_log(f"{num_workers} concurrent worker loops started.")

    async def register_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        self.server_log(f"WebSocket connected. Total clients: {len(self.active_websockets)}")

    def unregister_websocket(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)
        self.server_log(f"WebSocket disconnected. Remaining clients: {len(self.active_websockets)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected Stage Display Viewers."""
        
        # Track objects for Admin and Stage restoration
        event_type = message.get("type") or message.get("event")
        if event_type in ["NEW_STATIC", "NEW_CHARACTER"]:
            data = message.get("data", {})
            obj_id = data.get("id") or data.get("character_id")
            if obj_id:
                thumb = data.get("image_data") or data.get("image_base64")
                if not thumb and data.get("frames"):
                    thumb = data.get("frames")[0]
                
                self.recent_objects.append({
                    "id": obj_id,
                    "type": "STATIC" if event_type == "NEW_STATIC" else "CHARACTER",
                    "thumbnail": thumb,
                    "full_message": message # Store full payload for Stage Viewer refresh
                })
                if len(self.recent_objects) > 50:
                    self.recent_objects.pop(0)
                    
        # Remove deleted objects from recent list
        if event_type == "DELETE_OBJECT":
            obj_id = message.get("data", {}).get("id")
            self.recent_objects = [obj for obj in self.recent_objects if obj["id"] != obj_id]

        if not self.active_websockets:
            return
        payload = json.dumps(message)
        disconnected = set()
        for ws in list(self.active_websockets):
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.unregister_websocket(ws)

    async def enqueue_task(self, task_id: str, image_bytes: bytes, custom_skeleton: dict = None, motion: str = "random"):
        self.update_progress(task_id, 0, "대기열 진입 중...")
        await self.queue.put((task_id, image_bytes, custom_skeleton, motion))
        self.server_log(f"Enqueued task {task_id}. Queue size: {self.queue.qsize()}")
        self.broadcast_queue_status()

    async def _worker_loop(self):
        while True:
            task_id, image_bytes, custom_skeleton, motion = await self.queue.get()
            try:
                self.update_progress(task_id, 5, "처리 준비 중...")
                
                # We pass a callback to ai_pipeline to update progress!
                def progress_cb(p, s):
                    self.update_progress(task_id, p, s)

                # The pipeline contains heavily CPU-bound synchronous code (OpenCV, MediaPipe, rendering).
                # We MUST run it in a thread, otherwise it blocks the entire FastAPI event loop,
                # causing progress polling requests to hang until it's finished!
                result = await asyncio.to_thread(
                    process_sketch_pipeline, task_id, image_bytes, custom_skeleton, progress_cb, motion
                )
                
                self.update_progress(task_id, 100, "완료!")
                # Broadcast new character to HDMI WebGL viewer
                await self.broadcast({
                    "event": "NEW_CHARACTER",
                    "data": result
                })
                self.server_log(f"Successfully completed task {task_id}.")
            except Exception as e:
                self.server_log(f"Error processing task {task_id}: {e}")
                traceback.print_exc()
            finally:
                self.queue.task_done()

queue_manager = JetsonAIQueueManager()
