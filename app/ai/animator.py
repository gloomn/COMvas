import os
import io
import base64
from PIL import Image

from animated_drawings import render
from config.settings import settings
import yaml
import random
import numpy as np

class MetaAnimator:
    """
    Animator that uses Meta's Animated Drawings to create
    realistic dance animations for photos on Jetson.
    """
    def __init__(self):
        pass

    def generate_dance_frames(self, char_dir: str, requested_motion: str = "random", progress_callback=None) -> list:
        """
        Runs Meta Animated Drawings pipeline.
        Returns a list of base64 PNG frames for PIXI.AnimatedSprite.
        """
        output_gif = os.path.join(char_dir, "video.gif")
        
        # Define available dynamic motions and their corresponding retarget configs
        available_motions = {
            'breakdance_freeze': ('motion/breakdance_freeze.yaml', 'retarget/mixamo_standard.yaml'),
            'flair': ('motion/flair.yaml', 'retarget/mixamo_standard.yaml'),
            'hiphopdancing': ('motion/hiphopdancing.yaml', 'retarget/mixamo_standard.yaml'),
            'gangnamstyle': ('motion/gangnamstyle.yaml', 'retarget/mixamo_standard.yaml')
        }
        
        # Select motion
        if requested_motion in available_motions:
            chosen_motion, chosen_retarget = available_motions[requested_motion]
        else:
            chosen_motion, chosen_retarget = random.choice(list(available_motions.values()))
        
        motion_cfg = os.path.join(settings.BASE_DIR, 'examples/config', chosen_motion)
        retarget_cfg = os.path.join(settings.BASE_DIR, 'examples/config', chosen_retarget)
        
        # Build the MVC config exactly as Animated Drawings expects
        mvc_cfg = {
            'scene': {
                'ANIMATED_CHARACTERS': [{
                    'character_cfg': os.path.join(char_dir, 'char_cfg.yaml'),
                    'motion_cfg': motion_cfg,
                    'retarget_cfg': retarget_cfg
                }]
            },
            'view': {
                'USE_TRACKING_CAMERA': False,
                'WINDOW_DIMENSIONS': [512, 512]
            },
            'controller': {
                'MODE': 'video_render',
                'OUTPUT_VIDEO_PATH': output_gif
            }
        }
        
        mvc_cfg_path = os.path.join(char_dir, 'mvc_cfg.yaml')
        with open(mvc_cfg_path, 'w') as f:
            yaml.dump(mvc_cfg, f)

        # Render the animation (it only takes the single mvc config path)
        try:
            render.start(mvc_cfg_path, progress_callback=progress_callback)
        except Exception as e:
            print(f"[Animator] Error rendering animation: {e}")
            import traceback
            os.makedirs(settings.DATA_DIR, exist_ok=True)
            with open(os.path.join(settings.DATA_DIR, "error_log.txt"), "w") as err_f:
                err_f.write(traceback.format_exc())
            return [], chosen_motion.split('/')[-1].split('.')[0]

        # Extract frames from generated GIF
        frames_b64 = []
        if os.path.exists(output_gif):
            with Image.open(output_gif) as gif:
                extracted_frames = []
                for frame_idx in range(gif.n_frames):
                    gif.seek(frame_idx)
                    extracted_frames.append(gif.convert("RGBA"))
                
                import concurrent.futures

                def process_frame(frame):
                    # Make pure white background transparent (Vectorized with NumPy for speed)
                    frame_array = np.array(frame)
                    # Mask where R, G, B are all > 240
                    white_mask = (frame_array[:, :, 0] > 240) & (frame_array[:, :, 1] > 240) & (frame_array[:, :, 2] > 240)
                    frame_array[white_mask, 3] = 0 # Set alpha to 0
                    processed_frame = Image.fromarray(frame_array)
                    
                    buffered = io.BytesIO()
                    # compress_level=1 is significantly faster than default (usually 15s -> 2.6s for 250 frames)
                    processed_frame.save(buffered, format="PNG", compress_level=1)
                    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

                # Use ThreadPoolExecutor to parallelize I/O bound image encoding
                frames_b64 = [None] * len(extracted_frames)
                total_f = len(extracted_frames)
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    futures = {executor.submit(process_frame, frame): i for i, frame in enumerate(extracted_frames)}
                    completed = 0
                    for future in concurrent.futures.as_completed(futures):
                        idx = futures[future]
                        frames_b64[idx] = future.result()
                        completed += 1
                        if progress_callback and completed % 5 == 0:
                            pct = 80 + int((completed / total_f) * 19) # 80% to 99%
                            progress_callback(pct, f"비디오 변환 중... ({completed} / {total_f} 프레임)")
                    
            # Cleanup
            try:
                os.remove(output_gif)
                os.remove(mvc_cfg_path)
            except:
                pass
                
        return frames_b64, chosen_motion.split('/')[-1].split('.')[0]

animator = MetaAnimator()
