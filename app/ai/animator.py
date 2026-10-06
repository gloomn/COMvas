import os
import io
import base64
from PIL import Image

from animated_drawings import render
from config.settings import settings
import yaml
import random
import numpy as np
import multiprocessing as mp

def _render_process_worker(mvc_cfg_path, queue):
    # This runs in a pristine main thread of a new process, keeping GLFW happy on Mac!
    def local_callback(pct, msg):
        queue.put((pct, msg))
    try:
        from animated_drawings import render
        render.start(mvc_cfg_path, progress_callback=local_callback)
    except Exception as e:
        import traceback
        queue.put(("ERROR", traceback.format_exc()))
    finally:
        queue.put(None)

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
            'gangnamstyle': ('motion/gangnamstyle.yaml', 'retarget/mixamo_standard.yaml'),
            'bellydance': ('motion/bellydance.yaml', 'retarget/mixamo_standard.yaml'),
            'wave': ('motion/wave.yaml', 'retarget/mixamo_standard.yaml')
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

        # Render the animation in an isolated process to allow macOS main-thread GLFW initialization
        try:
            ctx = mp.get_context('spawn')
            queue = ctx.Queue()
            p = ctx.Process(target=_render_process_worker, args=(mvc_cfg_path, queue))
            p.start()
            
            while True:
                update = queue.get()
                if update is None:
                    break
                if isinstance(update, tuple) and update[0] == "ERROR":
                    raise Exception(update[1])
                pct, msg = update
                if progress_callback:
                    progress_callback(pct, msg)
            
            p.join()
            if p.exitcode != 0:
                raise Exception(f"Render process crashed with exit code {p.exitcode}")
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
                            progress_callback(pct, f"프레임 송신 준비 중... ({completed} / {total_f} 프레임)")
                    
            # Cleanup
            try:
                os.remove(output_gif)
                os.remove(mvc_cfg_path)
            except:
                pass
                
        return frames_b64, chosen_motion.split('/')[-1].split('.')[0]

animator = MetaAnimator()
