// assets/bg/mesh-home.js
// Home background: dark, glowing, animated network (lightweight)

(() => {
  const c = document.getElementById('bg-net') || (() => {
    const el = document.createElement('canvas');
    el.id = 'bg-net';
    document.body.prepend(el);
    return el;
  })();

  const ctx = c.getContext('2d', { alpha: true });

  // ---- Tuning knobs --------------------------
  const BRAND = 'rgba(255,107,0,1)';         // brand orange core
  const LINE  = 'rgba(255,107,0,0.45)';      // darker orange lines
  const NODE  = 'rgba(255,255,255,0.28)';    // faint node dots
  const GLOW  = 'rgba(255,107,0,0.75)';      // glow color

  const GLOBAL_ALPHA = 0.14;                 // darkness
  const SHADOW_BLUR  = 10;                   // glow blur
  const SPEED        = 0.12;                 // motion speed
  const GRID_SPACING = 88;                   // node spacing
  const LINK_DIST    = 120;                  // link threshold
  const NODE_RADIUS  = 1.1;                  // node size
  // --------------------------------------------

  let DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  let W = 0, H = 0, nodes = [];

  function build() {
    nodes = [];
    const sp = GRID_SPACING;
    const dx = sp * Math.sqrt(3) / 2;
    let row = 0;
    for (let y = -sp; y < H + sp; y += sp, row++) {
      const offset = (row % 2) ? dx * 0.5 : 0;
      for (let x = -dx; x < W + dx; x += dx) {
        const px = x + offset;
        const py = y;
        nodes.push({
          x: px, y: py,
          phx: Math.random() * Math.PI * 2,
          phy: Math.random() * Math.PI * 2,
          amp: 6 + Math.random() * 10
        });
      }
    }
  }

  function resize() {
    DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    W = window.innerWidth;
    H = window.innerHeight;
    c.width  = Math.floor(W * DPR);
    c.height = Math.floor(H * DPR);
    c.style.width  = W + 'px';
    c.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function draw(ts) {
    const t = (ts || 0) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = GLOBAL_ALPHA;
    const g = ctx.createRadialGradient(W*0.30, H*0.45, 0, W*0.30, H*0.45, Math.max(W,H)*0.8);
    g.addColorStop(0, 'rgba(255,107,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    const pos = nodes.map(n => {
      const ox = Math.sin(t * SPEED + n.phx) * n.amp;
      const oy = Math.cos(t * SPEED * 0.9 + n.phy) * (n.amp * 0.8);
      return { x: n.x + ox, y: n.y + oy };
    });

    ctx.lineWidth = 1;
    ctx.shadowBlur = SHADOW_BLUR;
    ctx.shadowColor = GLOW;
    for (let i=0;i<pos.length;i++){
      const p = pos[i];
      for (let j=i+1;j<pos.length;j++){
        const q = pos[j];
        const dx=p.x-q.x, dy=p.y-q.y;
        const d=dx*dx+dy*dy;
        if (d < LINK_DIST*LINK_DIST){
          const dd=Math.sqrt(d);
          const fade=1-dd/LINK_DIST;
          ctx.globalAlpha = 0.22*fade;
          ctx.strokeStyle=LINE;
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(q.x,q.y);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur=0;
    for (let i=0;i<pos.length;i++){
      const p=pos[i];
      ctx.globalAlpha=0.6;
      ctx.fillStyle=NODE;
      ctx.beginPath();
      ctx.arc(p.x,p.y,NODE_RADIUS,0,Math.PI*2);
      ctx.fill();
      if(i%7===0){
        ctx.globalAlpha=0.9;
        ctx.fillStyle=BRAND;
        ctx.beginPath();
        ctx.arc(p.x,p.y,0.6,0,Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(draw);
  }

  c.style.position='fixed';
  c.style.inset='0';
  c.style.zIndex='0';
  c.style.pointerEvents='none';

  window.addEventListener('resize', resize, { passive:true });
  resize();
  requestAnimationFrame(draw);
})();
