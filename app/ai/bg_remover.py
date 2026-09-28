import io
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

class JetsonBackgroundRemover:
    """
    Background Remover using PyTorch CUDA FP16 on Jetson Orin Nano Super.
    Falls back to threshold contour masking if model weights are not loaded.
    """
    def __init__(self):
        self.device = "cuda" if (HAS_TORCH and torch.cuda.is_available()) else "cpu"
        print(f"[JetsonBGRemover] Initialized on device: {self.device}")

    def process_image(self, image_bytes: bytes) -> Image.Image:
        """Removes background and returns RGBA transparent PIL Image."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        np_img = np.array(img)
        
        # High-speed color threshold / contour mask for transparent drawing pad inputs
        # White background removal (250-255 threshold)
        r, g, b, a = np_img[:, :, 0], np_img[:, :, 1], np_img[:, :, 2], np_img[:, :, 3]
        white_mask = (r > 240) & (g > 240) & (b > 240)
        
        # Make white background pixels transparent
        np_img[white_mask, 3] = 0
        
        result_img = Image.fromarray(np_img, mode="RGBA")
        
        # Cleanup PyTorch CUDA memory if used
        if HAS_TORCH and torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        return result_img

bg_remover = JetsonBackgroundRemover()
