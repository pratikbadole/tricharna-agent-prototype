(function(){
  // Use a new canvas so we don't depend on previous inline code
  if (document.getElementById('bg-net')) return;

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.id = 'bg-net';
  document.body.prepend(c);
  const ctx = c.getContext('2d');

  let W = 0, H = 0, pts = [], links = [];
  const NODES = 140;               // total points (tweak for density/perf)
  const CLUSTERS = 3;              // how many attractors
  const SPEED = 0.06;              // base drift speed
  const LINK_DIST = 150;           // how far we connect lines
  const NODE_COLOR = 'rgba(180,240,255,0.9)';
  const LINE_COLOR = 'rgba(0,193,255,0.35)'; // cyan
  const HAZE_COLOR = 'rgba(0,0,0,0.85)';     // vignette base

  // Create attractor centers in % of screen so it adapts to resize
  let centers = [];

  function rand(a,b){ return a + Math.random()*(b-a); }

  function resetCenters(){
    centers = [
      { x: 0.30, y: 0.42 },
      { x: 0.62, y: 0.58 },
      { x: 0.45, y: 0.78 }
    ].slice(0, CLUSTERS);
  }

  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = Math.floor(W * DPR);
    c.height = Math.floor(H * DPR);
    c.style.width = W+'px';
    c.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  function build(){
    pts = [];
    links = [];
    resetCenters();

    // Seed points around the attractors with slight random offsets
    for (let i = 0; i < NODES; i++){
      const k = i % centers.length;
      const cx = centers[k].x * W;
      const cy = centers[k].y * H;
      const spread = Math.min(W,H) * rand(0.08, 0.18);  // cluster radius
      const ang = Math.random() * Math.PI * 2;
      const r = spread * Math.sqrt(Math.random());      // denser core
      pts.push({
        x: cx + Math.cos(ang)*r,
        y: cy + Math.sin(ang)*r,
        vx: rand(-SPEED, SPEED),
        vy: rand(-SPEED, SPEED),
        z: Math.random(),               // pseudo-depth 0..1
        ph: Math.random()*Math.PI*2     // pulse phase
      });
    }
  }

  function step(dt){
    for (const p of pts){
      // soft pull back toward nearest center (gives "net" cohesion)
      let best=null, bd=1e9;
      for (const c of centers){
        const cx = c.x*W, cy = c.y*H;
        const dx = cx - p.x, dy = cy - p.y;
        const d = dx*dx+dy*dy;
        if (d < bd){ bd=d; best={cx,cy}; }
      }
      if (best){
        p.vx += (best.cx - p.x)*0.00002;
        p.vy += (best.cy - p.y)*0.00002;
      }

      // subtle drift
      p.x += p.vx*(0.6+0.7*p.z);
      p.y += p.vy*(0.6+0.7*p.z);

      // soft wrap
      if (p.x < -50) p.x = W+50;
      if (p.x > W+50) p.x = -50;
      if (p.y < -50) p.y = H+50;
      if (p.y > H+50) p.y = -50;
    }
  }

  function draw(t){
    const time = (t||0)/1000;

    // Clear
    ctx.clearRect(0,0,W,H);

    // Subtle vignette to keep center readable
    const v = ctx.createRadialGradient(W*0.35,H*0.45,Math.min(W,H)*0.15, W*0.5,H*0.6, Math.max(W,H)*0.9);
    v.addColorStop(0, 'rgba(0,0,0,0.0)');
    v.addColorStop(1, HAZE_COLOR);
    ctx.fillStyle = v;
    ctx.fillRect(0,0,W,H);

    // Connections
    ctx.lineWidth = 1;
    for (let i=0;i<pts.length;i++){
      const p = pts[i];
      for (let j=i+1;j<pts.length;j++){
        const q = pts[j];
        const dx = p.x-q.x, dy = p.y-q.y;
        const d = Math.hypot(dx,dy);
        if (d < LINK_DIST){
          // depth: thinner/fainter if farther and if nodes are "deep"
          const depth = (p.z+q.z)*0.5;
          const a = 0.35 * (1 - d/LINK_DIST) * (0.6 + 0.4*(1-depth));
          ctx.globalAlpha = a;
          ctx.strokeStyle = LINE_COLOR;
          ctx.shadowColor = 'rgba(0,193,255,0.35)';
          ctx.shadowBlur = 6*(1-depth);
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(q.x,q.y);
          ctx.stroke();
        }
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Nodes (pulsing a bit)
    for (const p of pts){
      const r = 1.0 + 1.2*(1-p.z) + 0.6*Math.sin(time*1.8 + p.ph);
      // Outer glow
      ctx.fillStyle = 'rgba(0,193,255,0.18)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r*3.2, 0, Math.PI*2);
      ctx.fill();
      // Core
      ctx.fillStyle = NODE_COLOR;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  let last=0;
  function loop(ts){ const dt = (ts-last)||16; last=ts; step(dt/16); draw(ts); requestAnimationFrame(loop); }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);

  console.log('MESH_NET_OK');
})();
