function drawVitruvianSilhouette() {
  const guideCanvas = document.getElementById('guideCanvas');
  if (!guideCanvas) return;
  const ctx = guideCanvas.getContext('2d');
  
  const w = guideCanvas.width;
  const h = guideCanvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  ctx.strokeStyle = '#475569';
  ctx.fillStyle = 'rgba(71, 85, 105, 0.15)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(256, 90, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Neck
  ctx.beginPath();
  ctx.moveTo(256, 116);
  ctx.lineTo(256, 140);
  ctx.stroke();

  // Torso / Body
  ctx.beginPath();
  ctx.moveTo(200, 160);
  ctx.lineTo(312, 160);
  ctx.lineTo(292, 270);
  ctx.lineTo(220, 270);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Arm (Da-ja extension)
  ctx.beginPath();
  ctx.moveTo(200, 160);
  ctx.lineTo(140, 160);
  ctx.lineTo(80, 160);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(80, 160, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Left Arm (Da-ja extension)
  ctx.beginPath();
  ctx.moveTo(312, 160);
  ctx.lineTo(372, 160);
  ctx.lineTo(432, 160);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(432, 160, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Right Leg (Spread pose)
  ctx.beginPath();
  ctx.moveTo(220, 270);
  ctx.lineTo(180, 370);
  ctx.lineTo(150, 460);
  ctx.stroke();

  // Left Leg (Spread pose)
  ctx.beginPath();
  ctx.moveTo(292, 270);
  ctx.lineTo(332, 370);
  ctx.lineTo(362, 460);
  ctx.stroke();

  // Joint Dots
  const joints = [
    [256, 90], [200, 160], [312, 160], [140, 160], [372, 160],
    [80, 160], [432, 160], [220, 270], [292, 270], [180, 370],
    [332, 370], [150, 460], [362, 460]
  ];
  
  ctx.fillStyle = '#64748b';
  joints.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

document.addEventListener('DOMContentLoaded', drawVitruvianSilhouette);
