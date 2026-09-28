class SkeletonUI {
  constructor(layerId) {
    this.layer = document.getElementById(layerId);
    this.joints = {};
    this.isDragging = false;
    this.activeJoint = null;
    
    // Standard 16 joints required by Animated Drawings
    // Default coordinates matched roughly to the Da-ja guide silhouette
    this.defaultJoints = {
      root: [256, 260],
      hip: [256, 260],
      torso: [256, 200],
      neck: [256, 140],
      right_shoulder: [200, 150],
      right_elbow: [150, 150],
      right_hand: [100, 150],
      left_shoulder: [312, 150],
      left_elbow: [362, 150],
      left_hand: [412, 150],
      right_hip: [220, 260],
      right_knee: [190, 350],
      right_foot: [160, 440],
      left_hip: [292, 260],
      left_knee: [322, 350],
      left_foot: [352, 440]
    };
    
    this.init();
    this.bindEvents();
  }

  init() {
    this.layer.innerHTML = '';
    
    for (const [name, pos] of Object.entries(this.defaultJoints)) {
      const dot = document.createElement('div');
      dot.className = 'joint-dot';
      dot.dataset.name = name;
      dot.style.position = 'absolute';
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.backgroundColor = 'red';
      dot.style.border = '2px solid white';
      dot.style.borderRadius = '50%';
      dot.style.transform = 'translate(-50%, -50%)';
      dot.style.cursor = 'grab';
      dot.style.pointerEvents = 'auto'; // allow dragging
      
      // Create label
      const label = document.createElement('div');
      label.textContent = name.replace('_', ' ');
      label.style.position = 'absolute';
      label.style.top = '-20px';
      label.style.left = '50%';
      label.style.transform = 'translateX(-50%)';
      label.style.color = 'white';
      label.style.background = 'rgba(0,0,0,0.5)';
      label.style.padding = '2px 4px';
      label.style.fontSize = '10px';
      label.style.borderRadius = '4px';
      label.style.pointerEvents = 'none';
      label.style.whiteSpace = 'nowrap';
      
      dot.appendChild(label);
      this.layer.appendChild(dot);
      
      this.joints[name] = { el: dot, x: pos[0], y: pos[1] };
      this.updateDotPos(name);
    }
  }

  updateDotPos(name) {
    const joint = this.joints[name];
    joint.el.style.left = `${joint.x}px`;
    joint.el.style.top = `${joint.y}px`;
  }

  show() {
    this.layer.classList.remove('hidden');
    this.layer.style.pointerEvents = 'auto'; // Block canvas drawing, allow dragging
  }

  hide() {
    this.layer.classList.add('hidden');
    this.layer.style.pointerEvents = 'none';
  }

  bindEvents() {
    const startDrag = (e) => {
      if (e.target.classList.contains('joint-dot')) {
        this.isDragging = true;
        this.activeJoint = e.target.dataset.name;
        e.target.style.cursor = 'grabbing';
      }
    };

    const doDrag = (e) => {
      if (!this.isDragging || !this.activeJoint) return;
      e.preventDefault();
      
      const rect = this.layer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      let x = clientX - rect.left;
      let y = clientY - rect.top;
      
      // Clamp to bounds
      x = Math.max(0, Math.min(x, rect.width));
      y = Math.max(0, Math.min(y, rect.height));
      
      // Map back to 512x512 virtual canvas space
      const scaleX = 512 / rect.width;
      const scaleY = 512 / rect.height;
      
      this.joints[this.activeJoint].x = Math.round(x * scaleX);
      this.joints[this.activeJoint].y = Math.round(y * scaleY);
      this.updateDotPos(this.activeJoint);
    };

    const endDrag = (e) => {
      if (this.activeJoint) {
        this.joints[this.activeJoint].el.style.cursor = 'grab';
      }
      this.isDragging = false;
      this.activeJoint = null;
    };

    this.layer.addEventListener('mousedown', startDrag);
    this.layer.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', endDrag);

    this.layer.addEventListener('touchstart', startDrag, {passive: false});
    this.layer.addEventListener('touchmove', doDrag, {passive: false});
    window.addEventListener('touchend', endDrag);
  }

  exportSkeleton() {
    const exported = [];
    // Need to provide hierarchy as expected by Animated Drawings
    const parentMap = {
      root: null,
      hip: 'root',
      torso: 'hip',
      neck: 'torso',
      right_shoulder: 'torso',
      right_elbow: 'right_shoulder',
      right_hand: 'right_elbow',
      left_shoulder: 'torso',
      left_elbow: 'left_shoulder',
      left_hand: 'left_elbow',
      right_hip: 'root',
      right_knee: 'right_hip',
      right_foot: 'right_knee',
      left_hip: 'root',
      left_knee: 'left_hip',
      left_foot: 'left_knee'
    };
    
    for (const [name, joint] of Object.entries(this.joints)) {
      exported.push({
        name: name,
        parent: parentMap[name],
        loc: [joint.x, joint.y]
      });
    }
    
    return {
      width: 512,
      height: 512,
      skeleton: exported
    };
  }
}
window.SkeletonUI = SkeletonUI;
