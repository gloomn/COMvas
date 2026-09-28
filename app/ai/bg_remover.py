import io
import numpy as np
import cv2
from PIL import Image

class LineDrawingBackgroundRemover:
    """
    Removes white background from line drawings using simple thresholding.
    This prevents the U-2-Net AI from incorrectly erasing thin stick figures
    or failing to create a solid external contour mask.
    """
    def __init__(self):
        print("[BGRemover] Initialized Drawing-optimized background remover.")

    def process_image(self, image_bytes: bytes) -> Image.Image:
        """Removes white background and returns RGBA transparent PIL Image."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        data = np.array(img).astype(np.float32)
        
        r = data[..., 0]
        g = data[..., 1]
        b = data[..., 2]
        
        # Calculate alpha based on the darkest channel
        min_rgb = np.min(data[..., :3], axis=2)
        alpha = 255.0 - min_rgb
        
        # Un-premultiply the RGB colors to mathematically remove the white background mixing.
        # This completely eliminates "white halos" and keeps the drawing perfectly crisp!
        alpha_norm = np.maximum(alpha, 1.0) / 255.0
        
        data[..., 0] = np.clip(255.0 + (r - 255.0) / alpha_norm, 0, 255)
        data[..., 1] = np.clip(255.0 + (g - 255.0) / alpha_norm, 0, 255)
        data[..., 2] = np.clip(255.0 + (b - 255.0) / alpha_norm, 0, 255)
        
        # Heavy threshold to make the drawing "찡하게" (crisp)
        # We boost the alpha curve so that even light strokes become fully opaque
        boosted_alpha = np.clip(alpha * 1.5, 0, 255)
        data[..., 3] = boosted_alpha
        
        return Image.fromarray(data.astype(np.uint8))

bg_remover = LineDrawingBackgroundRemover()
