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
        """
        The frontend now sends a transparent PNG (signature style).
        We simply return the image as-is, which preserves the original crisp strokes 100%.
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        return img

bg_remover = LineDrawingBackgroundRemover()
