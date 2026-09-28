import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

def test_environment():
    print("==================================================")
    print("      Jetson Orin Nano Environment Check          ")
    print("==================================================")

    # 1. PyTorch & CUDA Check
    try:
        import torch
        print(f"[✓] PyTorch Version: {torch.__version__}")
        cuda_avail = torch.cuda.is_available()
        print(f"[✓] CUDA Available: {cuda_avail}")
        if cuda_avail:
            print(f"[✓] Device Name: {torch.cuda.get_device_name(0)}")
            print(f"[✓] Device Capability: {torch.cuda.get_device_capability(0)}")
        else:
            print("[⚠️] WARNING: CUDA is NOT available to PyTorch!")
    except ImportError:
        print("[❌] PyTorch is NOT installed.")

    # 2. OpenCV Check
    try:
        import cv2
        print(f"[✓] OpenCV Version: {cv2.__version__}")
    except ImportError:
        print("[❌] OpenCV is NOT installed.")

    # 3. Pillow Check
    try:
        from PIL import Image
        print(f"[✓] Pillow Version: {Image.__version__}")
    except ImportError:
        print("[❌] Pillow is NOT installed.")

    # 4. Test Background Removal Module
    try:
        from app.ai.bg_remover import bg_remover
        test_img = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
        import io
        buf = io.BytesIO()
        test_img.save(buf, format="PNG")
        res = bg_remover.process_image(buf.getvalue())
        print(f"[✓] AI Background Removal Pipeline Test: Success ({res.size})")
    except Exception as e:
        print(f"[❌] AI Pipeline Error: {e}")

    print("==================================================")

if __name__ == "__main__":
    test_environment()
