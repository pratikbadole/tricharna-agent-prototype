(() => {
  // Reuse #bg-net if present, otherwise create it
  let c = document.getElementById('bg-net');
  if (!c) {
    c = document.createElement('canvas');
    c.id = 'bg-net';
    document.body.prepend(c);
  }
  Object.assign(c.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '0',
    pointerEvents: 'none'
  });

  const ctx = c.getContext('2d');
  const DPR = Math.max(1, Math.floor(devicePixelRatio || 1));
  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * DPR;
    c.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  // Build a loose point field
  const PTS = [];
  function build() {
    PTS.length = 0;
    const cols = Math.ceil(W / 90);
    const rows = Math.ceil(H / 90);
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        const jitterX = (Math.random() - 0.5) * 40;
        const jitterY = (Math.random() - 0.5) * 40;
        PTS.push({
          x: x * 90 + jitterX,
          y: y * 90 + jitterY,
          ph: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function draw(t) {
    const time = (t || 0) / 1000;

    // Clear and soft vignette
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W*0.3, H*0.45, 0, W*0.3, H*0.45, Math.max(W,H)*0.7);
    g.addColorStop(0, 'rgba(255,107,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Orange network lines
    const TH = 140; // link distance
    ctx.lineWidth = 1;
    for (let i = 0; i < PTS.length; i++) {
      const p = PTS[i];
      for (let j = i + 1; j < PTS.length; j++) {
        const q = PTS[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < TH) {
          ctx.globalAlpha = 0.13 * (1 - d / TH);
          ctx.strokeStyle = 'rgba(255,107,0,0.65)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    // Nodes (subtle)
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const p of PTS) {
      const r = 1.1 + 0.6 * Math.sin(time * 1.7 + p.ph);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // Safety console log so you can verify it runs
  console.log('MESH_HOME: init', { DPR });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
