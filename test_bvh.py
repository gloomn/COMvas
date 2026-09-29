import os
import yaml
from animated_drawings.model.bvh import BVH

bvh_path = 'examples/bvh/mixamo/hiphopdancing.bvh'
print(f"Testing BVH parsing for: {bvh_path}")
try:
    my_bvh = BVH(bvh_path)
    print("Joints found:", my_bvh.joint_names)
except Exception as e:
    import traceback
    traceback.print_exc()

print("\nTesting animator with dummy char...")
from app.ai.animator import animator
from PIL import Image
import numpy as np

os.makedirs('test_char', exist_ok=True)

# Create dummy char_cfg.yaml
dummy_skeleton = [{"loc": [256, 256], "name": "root"}]
with open('test_char/char_cfg.yaml', 'w') as f:
    yaml.dump({'width': 512, 'height': 512, 'skeleton': dummy_skeleton}, f)

# Create dummy images
Image.fromarray(np.zeros((512, 512, 4), dtype=np.uint8)).save('test_char/texture.png')
Image.fromarray(np.zeros((512, 512), dtype=np.uint8)).save('test_char/mask.png')

frames, motion = animator.generate_dance_frames('test_char', 'hiphopdancing')
print(f"Generated frames: {len(frames)}, Motion: {motion}")
