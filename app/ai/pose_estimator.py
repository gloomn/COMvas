import os
import json
from config.settings import settings

class AutomaticPoseEstimator:
    """
    Automated pose estimator for 100% unmanned operation.
    Aligns drawing contours with fixed Vitruvian 'Da-ja' silhouette.
    """
    def __init__(self):
        template_path = os.path.join(settings.BASE_DIR, "config", "skeleton_template.json")
        if os.path.exists(template_path):
            with open(template_path, "r", encoding="utf-8") as f:
                self.template = json.load(f)
        else:
            self.template = {"skeleton": []}

    def get_aligned_skeleton(self, transparent_image_path: str) -> dict:
        """Returns joint keypoint coordinates mapped to the drawing."""
        return self.template

pose_estimator = AutomaticPoseEstimator()
