(() => {
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

  // Tunables (dial these later if you want)
  const STEP_X   = 80;   // smaller = denser grid
  const STEP_Y   = 68;
  const JITTER   = 36;   // random offset per node
  const DRIFT_A  = 10;   // node drift amplitude (px)
  const SPEED    = 0.55; // node drift speed
  const SWAY_A   = 24;   // slow global sway amplitude
  const SWAY_S   = 0.06; // slow global sway speed
  const LINK_TH  = 160;  // link distance threshold (px)
  const LINK_OP  = 0.18; // link opacity
  const NODE_OP  = 0.45; // node opacity

  let c, ctx, W = 0, H = 0, pts = [];

  function ensureCanvas() {
    c = document.getElementById('bg-net');
    if (!c) {
      c = document.createElement('canvas');
      c.id = 'bg-net';
      document.body.prepend(c);
    }
    Object.assign(c.style, {
      position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none'
    });
    return c;
  }

  function resize() {
    ensureCanvas();
    W = innerWidth; H = innerHeight;
    c.width = W * DPR; c.height = H * DPR;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx = c.getContext('2d');
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  function build() {
    pts = [];
    const cols = Math.ceil(W/STEP_X)+2;
    const rows = Math.ceil(H/STEP_Y)+2;
    for (let y=0; y<rows; y++) {
      for (let x=0; x<cols; x++) {
        const px = x*STEP_X + (y%2 ? STEP_X/2 : 0) + (Math.random()*JITTER - JITTER/2);
        const py = y*STEP_Y + (Math.random()*JITTER - JITTER/2);
        pts.push({ x:px, y:py, phase: Math.random()*Math.PI*2 });
      }
    }
  }

  function draw(t=0) {
    const time = t/1000;

    // Clear + soft orange bloom behind hero area
    ctx.clearRect(0,0,W,H);
    const bloom = ctx.createRadialGradient(W*0.30, H*0.45, 0, W*0.30, H*0.45, Math.max(W,H)*0.7);
    bloom.addColorStop(0,'rgba(255,107,0,0.10)');
    bloom.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0,0,W,H);

    // Global slow sway so the whole field breathes a bit
    const swayX = Math.sin(time*SWAY_S) * SWAY_A;
    const swayY = Math.cos(time*SWAY_S*0.8) * SWAY_A;

    // Per-node drift
    for (const p of pts) {
      const a = p.phase + time * SPEED * 2.0;
      p.rx = p.x + Math.cos(a) * DRIFT_A + swayX;
      p.ry = p.y + Math.sin(a*0.9) * (DRIFT_A*0.75) + swayY;
    }

    // Links
    ctx.lineWidth = 1.15;
    for (let i=0;i<pts.length;i++){
      const p = pts[i];
      for (let j=i+1;j<pts.length;j++){
        const q = pts[j];
        const dx=p.rx-q.rx, dy=p.ry-q.ry, d=Math.hypot(dx,dy);
        if (d < LINK_TH){
          ctx.globalAlpha = LINK_OP*(1-d/LINK_TH);
          ctx.strokeStyle = 'rgba(255,107,0,0.55)';
          ctx.beginPath(); ctx.moveTo(p.rx,p.ry); ctx.lineTo(q.rx,q.ry); ctx.stroke();
        }
      }
    }

    // Nodes with gentle twinkle
    ctx.globalAlpha = NODE_OP;
    for (const p of pts) {
      const r = 1.0 + 0.7*Math.sin(time*1.8 + p.phase*1.2);
      ctx.fillStyle = 'rgba(255,165,120,0.75)';
      ctx.beginPath(); ctx.arc(p.rx,p.ry,r,0,Math.PI*2); ctx.fill();
      // tiny bright core
      ctx.globalAlpha = Math.min(0.35, NODE_OP+0.15);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(p.rx,p.ry,0.7,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = NODE_OP;
    }

    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize);
  resize(); requestAnimationFrame(draw);
})();
