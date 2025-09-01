// assets/bg/mesh-home.js
// Home background mesh with presets + quick toggle (console + URL + persisted)

(() => {
  // --- Read desired preset: URL (?mesh=strong) > localStorage > default('balanced')
  const urlPreset = new URLSearchParams(location.search).get('mesh');
  const savedPreset = localStorage.getItem('mesh:preset');
  const PRESET_NAME = (urlPreset || savedPreset || 'balanced').toLowerCase();

  // Expose helper to switch quickly from DevTools:
  //   MESH_PRESET('strong')  -> saves & reloads
  window.MESH_PRESET = (name='balanced') => {
    localStorage.setItem('mesh:preset', name);
    location.reload();
  };

  // --- Preset definitions (tune here only)
  const PRESETS = {
    soft: {
      GLOBAL_ALPHA: 0.10, SHADOW_BLUR: 6,  SPEED: 0.10,
      GRID_SPACING: 96, LINK_DIST: 110, NODE_RADIUS: 1.0,
      LINE: 'rgba(255,107,0,0.30)', GLOW: 'rgba(255,107,0,0.45)'
    },
    balanced: {
      GLOBAL_ALPHA: 0.14, SHADOW_BLUR: 10, SPEED: 0.12,
      GRID_SPACING: 88, LINK_DIST: 120, NODE_RADIUS: 1.1,
      LINE: 'rgba(255,107,0,0.45)', GLOW: 'rgba(255,107,0,0.75)'
    },
    strong: {
      GLOBAL_ALPHA: 0.18, SHADOW_BLUR: 14, SPEED: 0.16,
      GRID_SPACING: 82, LINK_DIST: 135, NODE_RADIUS: 1.2,
      LINE: 'rgba(255,107,0,0.62)', GLOW: 'rgba(255,107,0,0.95)'
    }
  };

  const BRAND = 'rgba(255,107,0,1)';
  const NODE  = 'rgba(255,255,255,0.28)';

  const CFG = PRESETS[PRESET_NAME] || PRESETS.balanced;
  console.log('MESH_HOME preset ->', PRESET_NAME, CFG);

  const c = document.getElementById('bg-net') || (() => {
    const el = document.createElement('canvas');
    el.id = 'bg-net';
    document.body.prepend(el);
    return el;
  })();
  const ctx = c.getContext('2d', { alpha: true });

  let DPR = Math.max(1, Math.floor(devicePixelRatio || 1));
  let W = 0, H = 0, nodes = [];

  function build() {
    nodes = [];
    const sp = CFG.GRID_SPACING;
    const dx = sp * Math.sqrt(3) / 2;
    let row = 0;
    for (let y = -sp; y < H + sp; y += sp, row++) {
      const offset = (row % 2) ? dx * 0.5 : 0;
      for (let x = -dx; x < W + dx; x += dx) {
        const px = x + offset, py = y;
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
    DPR = Math.max(1, Math.floor(devicePixelRatio || 1));
    W = innerWidth; H = innerHeight;
    c.width = Math.floor(W * DPR);
    c.height = Math.floor(H * DPR);
    c.style.width = W + 'px';
    c.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  function draw(ts) {
    const t = (ts || 0) / 1000;

    // subtle orange bloom to match hero
    ctx.clearRect(0,0,W,H);
    ctx.globalAlpha = CFG.GLOBAL_ALPHA;
    const g = ctx.createRadialGradient(W*0.30, H*0.45, 0, W*0.30, H*0.45, Math.max(W,H)*0.8);
    g.addColorStop(0, 'rgba(255,107,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;

    // node positions (animated)
    const pos = nodes.map(n => {
      const ox = Math.sin(t * CFG.SPEED + n.phx) * n.amp;
      const oy = Math.cos(t * CFG.SPEED * 0.9 + n.phy) * (n.amp * 0.8);
      return { x: n.x + ox, y: n.y + oy };
    });

    // links + glow
    ctx.lineWidth = 1;
    ctx.shadowBlur = CFG.SHADOW_BLUR;
    ctx.shadowColor = CFG.GLOW;
    const L2 = CFG.LINK_DIST * CFG.LINK_DIST;
    for (let i=0;i<pos.length;i++){
      const p=pos[i];
      for (let j=i+1;j<pos.length;j++){
        const q=pos[j];
        const dx=p.x-q.x, dy=p.y-q.y, d2=dx*dx+dy*dy;
        if(d2<L2){
          const d=Math.sqrt(d2), fade=1-d/CFG.LINK_DIST;
          ctx.globalAlpha = 0.22*fade;
          ctx.strokeStyle = CFG.LINE;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
        }
      }
    }

    // nodes
    ctx.shadowBlur = 0;
    for (let i=0;i<pos.length;i++){
      const p=pos[i];
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = NODE;
      ctx.beginPath(); ctx.arc(p.x,p.y,CFG.NODE_RADIUS,0,Math.PI*2); ctx.fill();
      if (i%7===0){
        ctx.globalAlpha=0.9; ctx.fillStyle=BRAND;
        ctx.beginPath(); ctx.arc(p.x,p.y,0.6,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  // layer
  Object.assign(c.style, { position:'fixed', inset:'0', zIndex:'0', pointerEvents:'none' });

  addEventListener('resize', resize, { passive:true });
  resize(); requestAnimationFrame(draw);
})();
