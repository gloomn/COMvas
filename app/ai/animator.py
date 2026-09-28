import os
import math
import io
import base64
import numpy as np
from PIL import Image, ImageDraw

class JointKeyframeRig:
    """
    2D Skeletal Forward Kinematics (FK) Animation Rig for Jetson.
    Segments drawing into jointed limbs and calculates frame-by-frame joint rotations
    for authentic Breakdancing (B-boying) and Hip-Hop dance motions.
    """
    def __init__(self):
        pass

    def _rotate_point(self, cx, cy, angle_rad, px, py):
        """Rotates point (px, py) around center (cx, cy)."""
        s = math.sin(angle_rad)
        c = math.cos(angle_rad)
        dx = px - cx
        dy = py - cy
        return [cx + (dx * c - dy * s), cy + (dx * s + dy * c)]

    def generate_bboy_dance_frames(self, transparent_img: Image.Image, skeleton_data: dict) -> list:
        """
        Extracts anatomical body parts (Head, Torso, Right Arm, Left Arm, Right Leg, Left Leg)
        and applies skeletal joint angle keyframes to create a real breakdance / dance sequence.
        Returns a list of base64 PNG frame strings for PIXI.AnimatedSprite.
        """
        w, h = transparent_img.size
        num_frames = 16  # 16-frame B-boying dance loop
        
        # Convert PIL image to RGBA numpy array
        np_img = np.array(transparent_img.convert("RGBA"))

        # Joint keypoint locations from Vitruvian Da-ja template
        head_pt = [256, 90]
        neck_pt = [256, 140]
        root_pt = [256, 260]
        r_shoulder = [200, 160]
        r_elbow = [140, 160]
        r_wrist = [80, 160]
        l_shoulder = [312, 160]
        l_elbow = [372, 160]
        l_wrist = [432, 160]
        r_hip = [220, 270]
        r_knee = [180, 370]
        r_ankle = [150, 460]
        l_hip = [292, 270]
        l_knee = [332, 370]
        l_ankle = [362, 460]

        # 1. Segment Image into Body Parts with Masks
        # Mask 1: Head (0 ~ 130y)
        head_mask = np.zeros((h, w), dtype=bool)
        head_mask[:130, :] = True

        # Mask 2: Torso (130y ~ 270y, between shoulders)
        torso_mask = np.zeros((h, w), dtype=bool)
        torso_mask[130:270, 190:322] = True

        # Mask 3: Right Arm (x < 200, 120y < y < 220)
        r_arm_mask = np.zeros((h, w), dtype=bool)
        r_arm_mask[120:220, :200] = True

        # Mask 4: Left Arm (x > 312, 120y < y < 220)
        l_arm_mask = np.zeros((h, w), dtype=bool)
        l_arm_mask[120:220, 312:] = True

        # Mask 5: Right Leg (x < 256, y > 270)
        r_leg_mask = np.zeros((h, w), dtype=bool)
        r_leg_mask[270:, :256] = True

        # Mask 6: Left Leg (x >= 256, y > 270)
        l_leg_mask = np.zeros((h, w), dtype=bool)
        l_leg_mask[270:, 256:] = True

        # Extract segmented PIL Images with alpha channel
        def extract_part(mask):
            part_arr = np_img.copy()
            part_arr[~mask, 3] = 0
            return Image.fromarray(part_arr, mode="RGBA")

        head_img = extract_part(head_mask)
        torso_img = extract_part(torso_mask)
        r_arm_img = extract_part(r_arm_mask)
        l_arm_img = extract_part(l_arm_mask)
        r_leg_img = extract_part(r_leg_mask)
        l_leg_img = extract_part(l_leg_mask)

        frames_b64 = []

        # 2. Keyframe Joint Angle Generator (B-boy Wave, Knee Flex & Arm Wave Motion)
        for f in range(num_frames):
            t = (f / num_frames) * 2 * math.pi
            
            # Joint Rotations (in degrees)
            r_shoulder_deg = math.sin(t) * 45 + 15      # Right Arm Swing (-30 to 60 deg)
            l_shoulder_deg = -math.sin(t) * 45 - 15     # Left Arm Counter Swing
            r_hip_deg = math.sin(t * 2) * 35            # Right Leg B-boy Kick
            l_hip_deg = -math.sin(t * 2) * 35           # Left Leg B-boy Kick
            head_deg = math.sin(t) * 15                 # Head Bop
            body_tilt_deg = math.sin(t) * 10            # Torso Bounce

            # Composite Frame
            frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))

            # Render Torso & Head
            rot_torso = torso_img.rotate(body_tilt_deg, resample=Image.BICUBIC, center=(root_pt[0], root_pt[1]))
            rot_head = head_img.rotate(head_deg + body_tilt_deg, resample=Image.BICUBIC, center=(neck_pt[0], neck_pt[1]))
            
            # Render Limbs pivoting around Shoulder and Hip joints
            rot_r_arm = r_arm_img.rotate(r_shoulder_deg, resample=Image.BICUBIC, center=(r_shoulder[0], r_shoulder[1]))
            rot_l_arm = l_arm_img.rotate(l_shoulder_deg, resample=Image.BICUBIC, center=(l_shoulder[0], l_shoulder[1]))
            rot_r_leg = r_leg_img.rotate(r_hip_deg, resample=Image.BICUBIC, center=(r_hip[0], r_hip[1]))
            rot_l_leg = l_leg_img.rotate(l_hip_deg, resample=Image.BICUBIC, center=(l_hip[0], l_hip[1]))

            # Paste in depth order: Back Limbs -> Torso/Head -> Front Limbs
            frame.paste(rot_l_leg, (0, 0), rot_l_leg)
            frame.paste(rot_r_leg, (0, 0), rot_r_leg)
            frame.paste(rot_torso, (0, 0), rot_torso)
            frame.paste(rot_head, (0, 0), rot_head)
            frame.paste(rot_l_arm, (0, 0), rot_l_arm)
            frame.paste(rot_r_arm, (0, 0), rot_r_arm)

            # Convert to Base64
            buffered = io.BytesIO()
            frame.save(buffered, format="PNG")
            b64_str = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
            frames_b64.append(b64_str)

        return frames_b64

animator = JointKeyframeRig()
