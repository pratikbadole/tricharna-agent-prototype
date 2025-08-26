/**
 * StrataMind BG Network — orange, long links, full-screen coverage
 * Non-intrusive: creates/updates a fixed <canvas id="bg-net"> behind the UI.
 */
(function(){
  const ORANGE = 'rgba(255,107,0,0.22)';           // link color (brand orange)
  const ORANGE_STRONG = 'rgba(255,107,0,0.35)';    // stronger when closer
  const NODE_FILL = 'rgba(255,255,255,0.25)';      // tiny node core
  const GLOW_ORANGE = 'rgba(255,107,0,0.20)';      // soft bloom
  const GRID_OVERLAY = 'rgba(255,255,255,0.03)';   // faint grid overlay

  // Reuse/insert canvas
  let c = document.getElementById('bg-net');
  if (!c) {
    c = document.createElement('canvas');
    c.id = 'bg-net';
    Object.assign(c.style, {
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none'
    });
    // Put canvas behind everything, but above body background
    document.body.prepend(c);
  }
  const ctx = c.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let W=0, H=0, PTS=[], lastT=0;

  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    c.width  = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    c.style.width  = W + 'px';
    c.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  // Build a fairly uniform scatter with velocity (covers entire screen)
  function build(){
    PTS.length = 0;
    // density tuned for long links without being heavy
    const count = Math.round((W*H) / 8000); // ~120–250 on desktop
    for (let i=0;i<count;i++){
      PTS.push({
        x: Math.random()*W,
        y: Math.random()*H,
        vx: (Math.random()-0.5)*0.12,  // gentle drift
        vy: (Math.random()-0.5)*0.12,
        ph: Math.random()*Math.PI*2
      });
    }
  }

  function wrap(p){
    if (p.x < -50) p.x = W+50;
    if (p.x > W+50) p.x = -50;
    if (p.y < -50) p.y = H+50;
    if (p.y > H+50) p.y = -50;
  }

  function draw(t=0){
    const dt = Math.min(32, t - lastT || 16) / 16.6667; // ~frames
    lastT = t;

    // Clear
    ctx.clearRect(0,0,W,H);

    // Background orange bloom (left/center)
    const g = ctx.createRadialGradient(W*0.28, H*0.5, 0, W*0.28, H*0.5, Math.max(W,H)*0.9);
    g.addColorStop(0, GLOW_ORANGE);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // Subtle grid to match UI
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = GRID_OVERLAY;
    ctx.lineWidth = 1;
    const step = 32;
    for (let x=0; x<=W; x+=step){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for (let y=0; y<=H; y+=step){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }
    ctx.restore();

    // Update points with a slight sine wobble
    for (const p of PTS){
      p.x += p.vx * dt + 0.08*Math.sin(t*0.001 + p.ph);
      p.y += p.vy * dt + 0.08*Math.cos(t*0.0012 + p.ph);
      wrap(p);
    }

    // Long links: connect points within a large threshold
    // Use screen diagonal to scale the distance -> long elegant lines
    const MAXD = Math.hypot(W,H) * 0.18; // increase for even longer links
    ctx.lineWidth = 1;

    for (let i=0;i<PTS.length;i++){
      const p = PTS[i];
      for (let j=i+1;j<PTS.length;j++){
        const q = PTS[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d  = Math.hypot(dx,dy);
        if (d < MAXD){
          // closer -> stronger orange
          const k = 1 - d/MAXD;
          ctx.globalAlpha = 0.08 + 0.22*k; // 0.08..0.30
          ctx.strokeStyle = k > 0.5 ? ORANGE_STRONG : ORANGE;
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(q.x,q.y);
          ctx.stroke();
        }
      }
    }

    // Tiny nodes with slight pulse
    for (const p of PTS){
      const r = 0.8 + 0.8*Math.sin(t*0.002 + p.ph);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = NODE_FILL;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI*2);
      ctx.fill();

      // micro orange halo
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = ORANGE_STRONG;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r*2.2, 0, Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, {passive:true});
  resize();
  requestAnimationFrame(draw);
})();
