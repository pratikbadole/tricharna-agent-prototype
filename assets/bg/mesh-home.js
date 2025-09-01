(() => {
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  let c, ctx, W = 0, H = 0, pts = [];

  function ensureCanvas() {
    c = document.getElementById('bg-net');
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
    const stepX = 90, stepY = 80, jitter = 28;
    const cols = Math.ceil(W/stepX)+2;
    const rows = Math.ceil(H/stepY)+2;
    for (let y=0; y<rows; y++){
      for (let x=0; x<cols; x++){
        const px = x*stepX + (y%2? stepX/2 : 0) + (Math.random()*jitter - jitter/2);
        const py = y*stepY + (Math.random()*jitter - jitter/2);
        pts.push({x:px, y:py, p:Math.random()*Math.PI*2});
      }
    }
  }

  function draw(t=0) {
    const time = t/1000;

    // clear and soft orange bloom
    ctx.clearRect(0,0,W,H);
    const bloom = ctx.createRadialGradient(W*0.30, H*0.45, 0, W*0.30, H*0.45, Math.max(W,H)*0.65);
    bloom.addColorStop(0,'rgba(255,107,0,0.10)');
    bloom.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0,0,W,H);

    // animate slight jitter
    for (const p of pts) {
      const a = p.p + time*0.35;
      p.rx = p.x + Math.cos(a)*4.5;
      p.ry = p.y + Math.sin(a)*4.5;
    }

    // network links (longer, denser)
    const TH = 140;
    ctx.lineWidth = 1.15;
    for (let i=0;i<pts.length;i++){
      const p = pts[i];
      for (let j=i+1;j<pts.length;j++){
        const q = pts[j];
        const dx=p.rx-q.rx, dy=p.ry-q.ry, d=Math.hypot(dx,dy);
        if (d<TH){
          ctx.globalAlpha = 0.16*(1-d/TH);
          ctx.strokeStyle = 'rgba(255,107,0,0.55)';
          ctx.beginPath(); ctx.moveTo(p.rx,p.ry); ctx.lineTo(q.rx,q.ry); ctx.stroke();
        }
      }
    }

    // nodes
    ctx.globalAlpha = 0.35;
    for (const p of pts){
      const r = 0.9 + 0.55*Math.sin(time*1.6 + p.p);
      ctx.fillStyle = 'rgba(255,165,120,0.65)'; // warm node
      ctx.beginPath(); ctx.arc(p.rx,p.ry,r,0,Math.PI*2); ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize);
  resize(); requestAnimationFrame(draw);
})();
