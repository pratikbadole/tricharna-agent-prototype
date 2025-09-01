(()=> {
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

  function ensureCanvas() {
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
    return c;
  }

  let c, ctx, W=0, H=0, pts=[];

  function resize() {
    c = ensureCanvas();
    W = window.innerWidth;
    H = window.innerHeight;
    c.width  = W * DPR;
    c.height = H * DPR;
    c.style.width  = W + 'px';
    c.style.height = H + 'px';
    ctx = c.getContext('2d');
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  function build() {
    pts = [];
    const COLS = Math.ceil(W/70)+2;
    const ROWS = Math.ceil(H/70)+2;
    const jitter = 28;
    for (let y=0; y<ROWS; y++){
      for (let x=0; x<COLS; x++){
        const px = x*70 + (y%2?35:0) + (Math.random()*jitter-jitter/2);
        const py = y*60 + (Math.random()*jitter-jitter/2);
        pts.push({x:px, y:py, p:Math.random()*Math.PI*2});
      }
    }
  }

  function draw(t=0) {
    const time = t/1000;

    // clear
    ctx.clearRect(0,0,W,H);

    // subtle orange bloom
    const g = ctx.createRadialGradient(W*0.3,H*0.45,0, W*0.3,H*0.45, Math.max(W,H)*0.6);
    g.addColorStop(0,'rgba(255,107,0,0.10)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // update jitter
    for (const p of pts){
      const a = p.p + time*0.35;
      p.rx = p.x + Math.cos(a)*4;
      p.ry = p.y + Math.sin(a)*4;
    }

    // links
    ctx.lineWidth = 1;
    for (let i=0;i<pts.length;i++){
      const p = pts[i];
      for (let j=i+1;j<pts.length;j++){
        const q = pts[j];
        const dx = p.rx-q.rx, dy=p.ry-q.ry, d=Math.hypot(dx,dy);
        if (d<110){
          ctx.globalAlpha = 0.08*(1-d/110);
          ctx.strokeStyle = 'rgba(255,107,0,0.35)';
          ctx.beginPath(); ctx.moveTo(p.rx,p.ry); ctx.lineTo(q.rx,q.ry); ctx.stroke();
        }
      }
    }

    // nodes
    ctx.globalAlpha = 0.7;
    for (const p of pts){
      const r = 0.7 + 0.6*Math.sin(time*1.5 + p.p);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.arc(p.rx,p.ry,r,0,Math.PI*2); ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
