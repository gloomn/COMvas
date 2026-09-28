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
        data = np.array(img)
        
        # Calculate distance from white (255, 255, 255)
        r, g, b, a = data.T
        
        # Prevent numpy uint8 overflow by casting to int32!
        r_i = r.astype(np.int32)
        g_i = g.astype(np.int32)
        b_i = b.astype(np.int32)
        
        # If it's pure white (which is the canvas background) or very close, make it transparent
        # 1000 is a safe squared distance for "near white"
        white_dist = (255 - r_i)**2 + (255 - g_i)**2 + (255 - b_i)**2
        transparent_areas = white_dist < 1000
        
        # Keep original colors, just make the background transparent
        data[..., 3][transparent_areas.T] = 0
        
        # DILATE THE ALPHA CHANNEL!
        # If the user drew thin lines (e.g. didn't refresh cache), Animated Drawings will shred them into dots.
        # By artificially thickening the alpha channel (mask), the mesh becomes a solid block, keeping lines intact!
        alpha = data[..., 3]
        kernel = np.ones((5, 5), np.uint8)
        thick_alpha = cv2.dilate(alpha, kernel, iterations=1)
        data[..., 3] = thick_alpha
        
        return Image.fromarray(data)

bg_remover = LineDrawingBackgroundRemover()
