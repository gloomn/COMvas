import io
import numpy as np
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
        
        # If it's pure white (which is the canvas background) or very close, make it transparent
        # 1000 is a safe squared distance for "near white"
        white_dist = (255 - r)**2 + (255 - g)**2 + (255 - b)**2
        transparent_areas = white_dist < 1000
        
        data[..., 3][transparent_areas.T] = 0
        
        # To make sure Animated Drawings gets a solid mesh, we should make sure the lines are 100% opaque
        # and any anti-aliased edge is preserved.
        return Image.fromarray(data)

bg_remover = LineDrawingBackgroundRemover()
