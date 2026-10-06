class SkeletonUI {
  constructor(layerId) {
    this.layer = document.getElementById(layerId);
    this.joints = {};
    this.isDragging = false;
    this.activeJoint = null;
    
    // Parent map for hierarchy and drawing lines
    this.parentMap = {
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
    
    // Standard 16 joints required by Animated Drawings
    this.defaultJoints = {
      root: [256, 270],
      hip: [256, 270],
      torso: [256, 200],
      neck: [256, 140],
      right_shoulder: [200, 160],
      right_elbow: [140, 160],
      right_hand: [80, 160],
      left_shoulder: [312, 160],
      left_elbow: [372, 160],
      left_hand: [432, 160],
      right_hip: [220, 270],
      right_knee: [180, 370],
      right_foot: [150, 460],
      left_hip: [292, 270],
      left_knee: [332, 370],
      left_foot: [362, 460]
    };
    
    this.init();
    this.bindEvents();
  }

  init() {
    this.layer.innerHTML = '';
    
    // Create SVG for skeleton lines
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.style.top = '0';
    this.svg.style.left = '0';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.pointerEvents = 'none';
    this.layer.appendChild(this.svg);
    
    for (const [name, pos] of Object.entries(this.defaultJoints)) {
      const dot = document.createElement('div');
      dot.className = 'joint-dot';
      dot.dataset.name = name;
      dot.style.position = 'absolute';
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.backgroundColor = '#ec4899';
      dot.style.border = '2px solid white';
      dot.style.borderRadius = '50%';
      dot.style.transform = 'translate(-50%, -50%)';
      dot.style.cursor = 'grab';
      dot.style.pointerEvents = 'auto'; // allow dragging
      dot.style.boxShadow = '0 0 5px rgba(236,72,153,0.8)';
      
      // Create label
      const label = document.createElement('div');
      const koreanNames = {
        root: '중심',
        hip: '골반',
        torso: '몸통',
        neck: '목',
        right_shoulder: '오른쪽 어깨',
        right_elbow: '오른쪽 팔꿈치',
        right_hand: '오른손',
        left_shoulder: '왼쪽 어깨',
        left_elbow: '왼쪽 팔꿈치',
        left_hand: '왼손',
        right_hip: '오른쪽 엉덩이',
        right_knee: '오른쪽 무릎',
        right_foot: '오른발',
        left_hip: '왼쪽 엉덩이',
        left_knee: '왼쪽 무릎',
        left_foot: '왼발'
      };
      label.textContent = koreanNames[name] || name.replace('_', ' ');
      label.style.position = 'absolute';
      label.style.top = '-20px';
      label.style.left = '50%';
      label.style.transform = 'translateX(-50%)';
      label.style.color = 'white';
      label.style.background = 'rgba(0,0,0,0.6)';
      label.style.padding = '2px 4px';
      label.style.fontSize = '9px';
      label.style.borderRadius = '4px';
      label.style.pointerEvents = 'none';
      label.style.whiteSpace = 'nowrap';
      
      dot.appendChild(label);
      this.layer.appendChild(dot);
      
      this.joints[name] = { el: dot, x: pos[0], y: pos[1] };
    }
    
    this.updateAllLines();
    for (const name of Object.keys(this.joints)) {
      this.updateDotPos(name);
    }
  }

  updateAllLines() {
    this.svg.innerHTML = '';
    for (const [name, joint] of Object.entries(this.joints)) {
      const parentName = this.parentMap[name];
      if (parentName && this.joints[parentName]) {
        const parentJoint = this.joints[parentName];
        
        const pctX1 = (joint.x / 512) * 100;
        const pctY1 = (joint.y / 512) * 100;
        const pctX2 = (parentJoint.x / 512) * 100;
        const pctY2 = (parentJoint.y / 512) * 100;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${pctX1}%`);
        line.setAttribute('y1', `${pctY1}%`);
        line.setAttribute('x2', `${pctX2}%`);
        line.setAttribute('y2', `${pctY2}%`);
        line.setAttribute('stroke', '#a855f7');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-linecap', 'round');
        line.dataset.child = name;
        this.svg.appendChild(line);
      }
    }
  }

  updateDotPos(name) {
    const joint = this.joints[name];
    const pctX = (joint.x / 512) * 100;
    const pctY = (joint.y / 512) * 100;
    joint.el.style.left = `${pctX}%`;
    joint.el.style.top = `${pctY}%`;
    
    const lines = this.svg.querySelectorAll('line');
    lines.forEach(line => {
      const childName = line.dataset.child;
      if (childName === name) {
        line.setAttribute('x1', `${pctX}%`);
        line.setAttribute('y1', `${pctY}%`);
      } else if (this.parentMap[childName] === name) {
        line.setAttribute('x2', `${pctX}%`);
        line.setAttribute('y2', `${pctY}%`);
      }
    });
  }

  setJoints(skeletonArray) {
    skeletonArray.forEach(j => {
      if (this.joints[j.name]) {
        this.joints[j.name].x = j.loc[0];
        this.joints[j.name].y = j.loc[1];
        this.updateDotPos(j.name);
      }
    });
    this.updateAllLines();
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
      
      x = Math.max(0, Math.min(x, rect.width));
      y = Math.max(0, Math.min(y, rect.height));
      
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
    for (const [name, joint] of Object.entries(this.joints)) {
      exported.push({
        name: name,
        parent: this.parentMap[name],
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
