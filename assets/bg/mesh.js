(() => {
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.id = 'bg-mesh';
  document.body.prepend(c);
  const ctx = c.getContext('2d');

  let W = 0, H = 0, pts = [];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * DPR;
    c.height = H * DPR;
    c.style.width = W + 'px';
    c.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    pts = [];
    const sp = 64;                       // spacing of grid points
    const dx = sp * Math.sqrt(3) / 2;    // hex offset
    for (let y = -32, row = 0; y < H + 64; y += sp, row++) {
      const offset = (row % 2) ? dx / 2 : 0;
      for (let x = -32; x < W + 64; x += dx) {
        pts.push({ x: x + offset, y, ph: Math.random() * Math.PI * 2 });
      }
    }
  }

  function draw(t) {
    const time = (t || 0) / 1000;

    // soft orange bloom to match the hero
    const g = ctx.createRadialGradient(W * 0.28, H * 0.45, 0, W * 0.28, H * 0.45, 520);
    g.addColorStop(0, 'rgba(255,107,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // cyan network lines
    const TH = 95; // link distance threshold
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < TH) {
          ctx.globalAlpha = 0.08 * (1 - d / TH);
          ctx.strokeStyle = 'rgba(0,194,255,0.35)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    // subtle white nodes
    ctx.globalAlpha = 1;
    for (const p of pts) {
      const r = 1.1 + 0.6 * Math.sin(time * 1.5 + p.ph);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
