import os
import io
import uuid
import base64
from PIL import Image
from app.ai.bg_remover import bg_remover
from app.ai.pose_estimator import pose_estimator
from app.ai.animator import animator
from config.settings import settings

os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

async def process_sketch_pipeline(task_id: str, image_bytes: bytes) -> dict:
    """
    Executes complete AI pipeline:
    1. Removes background (PyTorch CUDA FP16)
    2. Auto-aligns pose skeleton with fixed Vitruvian Da-ja template
    3. Generates dance keyframes / sprite sheet
    """
    # 1. Background removal
    transparent_img = bg_remover.process_image(image_bytes)
    
    # Save processed image
    img_filename = f"{task_id}_transparent.png"
    output_path = os.path.join(settings.OUTPUT_DIR, img_filename)
    transparent_img.save(output_path, "PNG")
    
    # Convert image to base64 for real-time WebSocket broadcast to Stage Viewer
    buffered = io.BytesIO()
    transparent_img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    # 2. Skeleton alignment
    skeleton_data = pose_estimator.get_aligned_skeleton(output_path)
    
    # 3. Animation generation
    dance_frames = animator.generate_dance_sprites(transparent_img, skeleton_data)
    
    return {
        "character_id": task_id,
        "image_url": f"/outputs/{img_filename}",
        "image_base64": f"data:image/png;base64,{img_b64}",
        "skeleton": skeleton_data,
        "frame_count": len(dance_frames)
    }
