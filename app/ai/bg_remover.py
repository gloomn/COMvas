import io
from PIL import Image
from rembg import remove, new_session

class RealPhotoBackgroundRemover:
    """
    Removes background from real photos using rembg (U-2-Net).
    Optimized for Jetson Orin Nano Super 8GB by loading the session once.
    """
    def __init__(self):
        print("[BGRemover] Initializing rembg session for Jetson...")
        # 'u2net' is highly accurate for general human segmentation
        self.session = new_session("u2net")
        print("[BGRemover] Session initialized.")

    def process_image(self, image_bytes: bytes) -> Image.Image:
        """Removes background and returns RGBA transparent PIL Image."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        
        # Remove background
        result_img = remove(img, session=self.session)
        
        return result_img

bg_remover = RealPhotoBackgroundRemover()
