import os
import io
import json
import yaml
import base64
import numpy as np
from PIL import Image
from app.ai.bg_remover import bg_remover
from app.ai.pose_estimator import pose_estimator
from app.ai.animator import animator
from config.settings import settings

os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

def process_sketch_pipeline(task_id: str, image_bytes: bytes, custom_skeleton: dict = None, progress_callback=None) -> dict:
    """
    Executes complete Meta Animated Drawings AI pipeline:
    1. Removes background to create `texture.png` and `mask.png`
    2. Auto-aligns pose using MediaPipe (or uses custom skeleton from UI) to create `char_cfg.yaml`
    3. Generates rendered GIF frames of a normal dance
    """
    if progress_callback: progress_callback(10, "이미지 저장 및 배경 처리 중...")
    
    # Create specific character directory for Meta Animated Drawings
    char_dir = os.path.join(settings.OUTPUT_DIR, task_id)
    os.makedirs(char_dir, exist_ok=True)
    
    # 1. Background removal
    transparent_img = bg_remover.process_image(image_bytes)
    
    # Save texture.png (Required by Meta Animated Drawings)
    texture_path = os.path.join(char_dir, "texture.png")
    transparent_img.save(texture_path, "PNG")
    
    # Save mask.png (Required by Meta Animated Drawings)
    # Extract alpha channel to create a binary mask
    import cv2
    np_img = np.array(transparent_img)
    mask = (np_img[:, :, 3] > 0).astype(np.uint8) * 255
    
    # 널럴하게(Aggressively) dilate the mask to ensure skeleton points fall inside the mesh!
    kernel = np.ones((35, 35), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)
    
    mask_img = Image.fromarray(mask, mode="L")
    mask_path = os.path.join(char_dir, "mask.png")
    mask_img.save(mask_path, "PNG")
    
    # Convert base image to Base64 for the frontend payload
    buffered = io.BytesIO()
    transparent_img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    if progress_callback: progress_callback(30, "AI 골격 분석 중...")
    
    # 2. Skeleton alignment
    if custom_skeleton:
        skeleton_data = custom_skeleton
    else:
        skeleton_data = pose_estimator.get_aligned_skeleton(texture_path)
    
    # Save char_cfg.yaml (Required by Meta Animated Drawings)
    char_cfg_path = os.path.join(char_dir, "char_cfg.yaml")
    with open(char_cfg_path, 'w', encoding='utf-8') as f:
        yaml.dump(skeleton_data, f, sort_keys=False)
    
    if progress_callback: progress_callback(50, "애니메이션 렌더링 중... (최대 30초 소요)")
    
    # 3. Meta Animated Drawings render to GIF -> extract frames
    dance_frames_b64 = animator.generate_dance_frames(char_dir)
    
    if progress_callback: progress_callback(99, "비디오 변환 및 전송 준비 중...")
    
    return {
        "character_id": task_id,
        "image_url": f"/outputs/{task_id}/texture.png",
        "image_base64": f"data:image/png;base64,{img_b64}",
        "frames": dance_frames_b64,
        "skeleton": skeleton_data,
        "frame_count": len(dance_frames_b64)
    }
