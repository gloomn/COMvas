import mediapipe as mp
import numpy as np
from PIL import Image

class AutomaticPoseEstimator:
    """
    Automated pose estimator using MediaPipe to generate 
    Meta Animated Drawings compatible skeleton configurations.
    Optimized for Jetson Orin Nano Super.
    """
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )

    def get_aligned_skeleton(self, transparent_image_path: str) -> dict:
        """
        Extracts pose from the image and returns a char_cfg.yaml style dictionary.
        """
        img = Image.open(transparent_image_path).convert("RGB")
        w, h = img.size
        img_np = np.array(img)
        
        results = self.pose.process(img_np)
        
        # Default fallback skeleton if no pose is found
        if not results.pose_landmarks:
            print("[PoseEstimator] No pose found, using fallback.")
            return self._get_fallback_skeleton(w, h)
            
        landmarks = results.pose_landmarks.landmark
        
        def get_pt(idx):
            lm = landmarks[idx]
            return [int(lm.x * w), int(lm.y * h)]
            
        l_sh = get_pt(11)
        r_sh = get_pt(12)
        l_el = get_pt(13)
        r_el = get_pt(14)
        l_wr = get_pt(15)
        r_wr = get_pt(16)
        l_hp = get_pt(23)
        r_hp = get_pt(24)
        l_kn = get_pt(25)
        r_kn = get_pt(26)
        l_an = get_pt(27)
        r_an = get_pt(28)
        
        # Calculate center points for spine
        neck = [int((l_sh[0] + r_sh[0])/2), int((l_sh[1] + r_sh[1])/2)]
        hip = [int((l_hp[0] + r_hp[0])/2), int((l_hp[1] + r_hp[1])/2)]
        torso = [int((neck[0] + hip[0])/2), int((neck[1] + hip[1])/2)]
        root = [hip[0], hip[1] + 10]
        
        skeleton = [
            {"loc": root, "name": "root", "parent": None},
            {"loc": hip, "name": "hip", "parent": "root"},
            {"loc": torso, "name": "torso", "parent": "hip"},
            {"loc": neck, "name": "neck", "parent": "torso"},
            
            {"loc": r_sh, "name": "right_shoulder", "parent": "torso"},
            {"loc": r_el, "name": "right_elbow", "parent": "right_shoulder"},
            {"loc": r_wr, "name": "right_hand", "parent": "right_elbow"},
            
            {"loc": l_sh, "name": "left_shoulder", "parent": "torso"},
            {"loc": l_el, "name": "left_elbow", "parent": "left_shoulder"},
            {"loc": l_wr, "name": "left_hand", "parent": "left_elbow"},
            
            {"loc": r_hp, "name": "right_hip", "parent": "root"},
            {"loc": r_kn, "name": "right_knee", "parent": "right_hip"},
            {"loc": r_an, "name": "right_foot", "parent": "right_knee"},
            
            {"loc": l_hp, "name": "left_hip", "parent": "root"},
            {"loc": l_kn, "name": "left_knee", "parent": "left_hip"},
            {"loc": l_an, "name": "left_foot", "parent": "left_knee"},
        ]
        
        return {
            "width": w,
            "height": h,
            "skeleton": skeleton
        }
        
    def _get_fallback_skeleton(self, w, h):
        cx = w // 2
        cy = h // 2
        return {
            "width": w,
            "height": h,
            "skeleton": [
                {"loc": [cx, cy+50], "name": "root", "parent": None},
                {"loc": [cx, cy+40], "name": "hip", "parent": "root"},
                {"loc": [cx, cy], "name": "torso", "parent": "hip"},
                {"loc": [cx, cy-40], "name": "neck", "parent": "torso"},
                
                {"loc": [cx-30, cy-40], "name": "right_shoulder", "parent": "torso"},
                {"loc": [cx-50, cy-10], "name": "right_elbow", "parent": "right_shoulder"},
                {"loc": [cx-60, cy+20], "name": "right_hand", "parent": "right_elbow"},
                
                {"loc": [cx+30, cy-40], "name": "left_shoulder", "parent": "torso"},
                {"loc": [cx+50, cy-10], "name": "left_elbow", "parent": "left_shoulder"},
                {"loc": [cx+60, cy+20], "name": "left_hand", "parent": "left_elbow"},
                
                {"loc": [cx-20, cy+50], "name": "right_hip", "parent": "root"},
                {"loc": [cx-20, cy+100], "name": "right_knee", "parent": "right_hip"},
                {"loc": [cx-20, cy+150], "name": "right_foot", "parent": "right_knee"},
                
                {"loc": [cx+20, cy+50], "name": "left_hip", "parent": "root"},
                {"loc": [cx+20, cy+100], "name": "left_knee", "parent": "left_hip"},
                {"loc": [cx+20, cy+150], "name": "left_foot", "parent": "left_knee"},
            ]
        }

pose_estimator = AutomaticPoseEstimator()
