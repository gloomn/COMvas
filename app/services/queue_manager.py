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

    def start_worker(self):
        if self.worker_task is None:
            self.worker_task = asyncio.create_task(self._worker_loop())
            print("[JetsonAIQueueManager] Single worker loop started.")

    async def register_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        print(f"[JetsonAIQueueManager] WebSocket connected. Total clients: {len(self.active_websockets)}")

    def unregister_websocket(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)
        print(f"[JetsonAIQueueManager] WebSocket disconnected. Remaining clients: {len(self.active_websockets)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected Stage Display Viewers."""
        if not self.active_websockets:
            return
        payload = json.dumps(message)
        disconnected = set()
        for ws in self.active_websockets:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.unregister_websocket(ws)

    async def enqueue_task(self, task_id: str, image_bytes: bytes, custom_skeleton: dict = None):
        await self.queue.put((task_id, image_bytes, custom_skeleton))
        print(f"[JetsonAIQueueManager] Enqueued task {task_id}. Queue size: {self.queue.qsize()}")

    async def _worker_loop(self):
        while True:
            task_id, image_bytes, custom_skeleton = await self.queue.get()
            try:
                print(f"[JetsonAIQueueManager] Processing task {task_id}...")
                result = await process_sketch_pipeline(task_id, image_bytes, custom_skeleton)
                
                # Broadcast new character to HDMI WebGL viewer
                await self.broadcast({
                    "event": "NEW_CHARACTER",
                    "data": result
                })
                print(f"[JetsonAIQueueManager] Successfully completed task {task_id}.")
            except Exception as e:
                print(f"[JetsonAIQueueManager] Error processing task {task_id}: {e}")
                traceback.print_exc()
            finally:
                self.queue.task_done()

queue_manager = JetsonAIQueueManager()
