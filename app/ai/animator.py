import os
import io
import base64
from PIL import Image

from animated_drawings import render
from config.settings import settings
import yaml

class MetaAnimator:
    """
    Animator that uses Meta's Animated Drawings to create
    realistic dance animations for photos on Jetson.
    """
    def __init__(self):
        pass

    def generate_dance_frames(self, char_dir: str) -> list:
        """
        Runs Meta Animated Drawings pipeline.
        Returns a list of base64 PNG frames for PIXI.AnimatedSprite.
        """
        output_gif = os.path.join(char_dir, "video.gif")
        
        import random
        
        # Define available dynamic motions and their corresponding retarget configs
        available_motions = [
            ('motion/dab.yaml', 'retarget/fair1_ppf.yaml'),
            ('motion/jumping.yaml', 'retarget/fair1_ppf.yaml'),          # running jump
            ('motion/jumping_jacks.yaml', 'retarget/cmu1_pfp.yaml'),
            ('motion/jesse_dance.yaml', 'retarget/mixamo_fff.yaml')
        ]
        
        # Randomly select a motion for this character
        chosen_motion, chosen_retarget = random.choice(available_motions)
        
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
                'USE_TRACKING_CAMERA': True,
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
            render.start(mvc_cfg_path)
        except Exception as e:
            print(f"[Animator] Error rendering animation: {e}")
            return [], chosen_motion.split('/')[-1].split('.')[0]

        # Extract frames from generated GIF
        frames_b64 = []
        if os.path.exists(output_gif):
            with Image.open(output_gif) as gif:
                for frame_idx in range(gif.n_frames):
                    gif.seek(frame_idx)
                    frame = gif.convert("RGBA")
                    
                    buffered = io.BytesIO()
                    frame.save(buffered, format="PNG")
                    b64_str = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
                    frames_b64.append(b64_str)
                    
            # Cleanup
            try:
                os.remove(output_gif)
                os.remove(mvc_cfg_path)
            except:
                pass
                
        return frames_b64, chosen_motion.split('/')[-1].split('.')[0]

animator = MetaAnimator()
