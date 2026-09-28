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
        # We output a GIF to extract frames from
        output_gif = os.path.join(char_dir, "video.gif")
        
        # Find absolute paths to configs within the animated_drawings package
        import animated_drawings
        from pathlib import Path
        ad_pkg_dir = Path(animated_drawings.__file__).parent
        
        motion_cfg = str(ad_pkg_dir / 'config' / 'motion' / 'jesse_dance.yaml')
        retarget_cfg = str(ad_pkg_dir / 'config' / 'retarget' / 'fair1_ppf.yaml')
        
        # Render the animation
        try:
            render.start(
                char_dir,
                motion_cfg,
                retarget_cfg,
                output_video_path=output_gif
            )
        except Exception as e:
            print(f"[Animator] Error rendering animation: {e}")
            return []

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
            except:
                pass
                
        return frames_b64

animator = MetaAnimator()
