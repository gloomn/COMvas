import time
import os
from app.ai.animator import MetaAnimator
from config.settings import settings

char_dir = os.path.join(settings.OUTPUT_DIR, "test_char")
os.makedirs(char_dir, exist_ok=True)
# We need char_cfg.yaml for the test to work, but let's just profile the GIF reading part if we have a GIF.
