import os
import sys
import qrcode

# Add base directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from app.core.database import SessionLocal, init_db
from app.services.token_service import create_token

def generate_qr_batch(count: int = 20, host_url: str = "http://192.168.0.100:8000"):
    init_db()
    db = SessionLocal()
    
    qr_dir = os.path.join(BASE_DIR, "data", "qr_codes")
    os.makedirs(qr_dir, exist_ok=True)
    
    print(f"=== Generating {count} One-Time QR Codes ===")
    print(f"Host URL: {host_url}")
    print(f"Saving QR images to: {qr_dir}\n")

    for i in range(count):
        token = create_token(db, expire_minutes=120)  # 2 hours validity for booth
        draw_url = f"{host_url}/draw?token={token.value}"
        
        # Generate QR Code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(draw_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        filename = f"qr_{i+1:03d}_{token.value[:8]}.png"
        file_path = os.path.join(qr_dir, filename)
        img.save(file_path)
        
        print(f"[{i+1}/{count}] Token: {token.value} -> {filename}")

    db.close()
    print("\nBatch generation complete!")

if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    num = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    generate_qr_batch(count=num, host_url=host)
