// assets/bg/mesh-home.js
// Clustered, non-uniform orange mesh — optimized (spatial grid + link caps)

(() => {
  const BRAND = 'rgba(255,107,0,1)';
  const LINE  = 'rgba(255,107,0,0.55)';   // line color
  const GLOW  = 'rgba(255,107,0,0.9)';    // glow color
  const NODE  = 'rgba(255,255,255,0.28)';

  // Tunables (picked to be gentle on CPU/GPU)
  const GLOBAL_ALPHA   = 0.14;   // background bloom
  const SPEED          = 0.11;   // animation speed
  const GRID_SPACING   = 92;     // base grid spacing (bigger = fewer points)
  const BASE_DENSITY   = 0.10;   // baseline probability to keep a point
  const LINK_DIST_BASE = 130;    // base max link distance (px)
  const MAX_LINKS      = 6;      // per-node link cap (keeps O(n)ish)
  const NODE_RADIUS    = 1.15;
  const SHADOW_BLUR    = 12;

  // Cluster field: more points & longer links near these centers
  const CLUSTERS = 4;            // number of clusters
  const SIGMA    = 260;          // cluster radius
  const BOOST    = 0.55;         // how much density is added near a center
  const LINK_BOOST= 40;          // increase link range near centers

  // Canvas
  const c = document.getElementById('bg-net') || (() => {
    const el = document.createElement('canvas');
    el.id = 'bg-net';
    document.body.prepend(el);
    return el;
  })();
  const ctx = c.getContext('2d', { alpha:true });
  Object.assign(c.style, { position:'fixed', inset:'0', zIndex:'0', pointerEvents:'none' });

  let DPR = Math.max(1, Math.floor(devicePixelRatio || 1));
  let W=0, H=0;
  let nodes = [];
  let centers = [];

  // Spatial grid for fast neighbor search
  let CELL = LINK_DIST_BASE;
  let buckets = new Map(); // key => array of node indices
  function key(ix,iy){ return ix+'_'+iy; }

  function reseedCenters(){
    centers = [];
    for(let i=0;i<CLUSTERS;i++){
      centers.push({
        x: (0.2 + 0.6*Math.random())*W,
        y: (0.2 + 0.6*Math.random())*H
      });
    }
  }

  function clusterProb(x,y){
    // Sum of Gaussians + base
    let p = BASE_DENSITY;
    const s2 = SIGMA*SIGMA*2;
    for(const c of centers){
      const dx=x-c.x, dy=y-c.y, d2=dx*dx+dy*dy;
      p += BOOST * Math.exp(-d2/s2);
    }
    // clamp
    return Math.max(0, Math.min(0.95, p));
  }

  function localLinkBoost(x,y){
    // Longer links near cluster cores
    let b = 0;
    const s2 = SIGMA*SIGMA*2;
    for(const c of centers){
      const dx=x-c.x, dy=y-c.y, d2=dx*dx+dy*dy;
      b = Math.max(b, LINK_BOOST * Math.exp(-d2/s2));
    }
    return b;
  }

  function build(){
    nodes = [];
    buckets.clear();
    CELL = LINK_DIST_BASE;

    const sp = GRID_SPACING;
    const dx = sp * Math.sqrt(3)/2;
    let row = 0;

    for(let y=-sp; y<H+sp; y+=sp, row++){
      const offset = (row%2) ? dx*0.5 : 0;
      for(let x=-dx; x<W+dx; x+=dx){
        const px = x + offset;
        const py = y;
        if (Math.random() < clusterProb(px,py)){
          const jitter = (Math.random()-0.5)*sp*0.35;
          const jitterY= (Math.random()-0.5)*sp*0.35;
          nodes.push({
            x: px + jitter,
            y: py + jitterY,
            phx: Math.random()*Math.PI*2,
            phy: Math.random()*Math.PI*2,
            amp: 6 + Math.random()*10,
            ldist: LINK_DIST_BASE + localLinkBoost(px,py) + (Math.random()*18-9) // small random
          });
        }
      }
    }

    // bucket them
    for(let i=0;i<nodes.length;i++){
      const n = nodes[i];
      const ix = Math.floor(n.x/CELL);
      const iy = Math.floor(n.y/CELL);
      const k = key(ix,iy);
      if(!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i);
    }
  }

  function resize(){
    DPR = Math.max(1, Math.floor(devicePixelRatio||1));
    W = innerWidth; H = innerHeight;
    c.width = Math.floor(W*DPR);
    c.height= Math.floor(H*DPR);
    c.style.width = W+'px';
    c.style.height= H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    reseedCenters();
    build();
  }

  function draw(ts){
    const t = (ts||0)/1000;

    // background bloom
    ctx.clearRect(0,0,W,H);
    ctx.globalAlpha = GLOBAL_ALPHA;
    const g = ctx.createRadialGradient(W*0.30, H*0.45, 0, W*0.30, H*0.45, Math.max(W,H)*0.8);
    g.addColorStop(0, 'rgba(255,107,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;

    // animate positions
    const pos = nodes.map(n=>{
      const ox = Math.sin(t*SPEED + n.phx)*n.amp;
      const oy = Math.cos(t*SPEED*0.9 + n.phy)*(n.amp*0.8);
      return { x:n.x+ox, y:n.y+oy, ldist:n.ldist };
    });

    // links with spatial grid + per-node cap
    ctx.lineWidth = 1;
    ctx.shadowBlur = SHADOW_BLUR;
    ctx.shadowColor = GLOW;

    for(let i=0;i<pos.length;i++){
      const p = pos[i];
      const ix = Math.floor(p.x/CELL);
      const iy = Math.floor(p.y/CELL);
      let links = 0;

      // check 9 neighbor cells
      for(let gx=ix-1; gx<=ix+1; gx++){
        for(let gy=iy-1; gy<=iy+1; gy++){
          const arr = buckets.get(key(gx,gy));
          if(!arr) continue;
          for(const j of arr){
            if(j<=i) continue;
            const q = pos[j];
            const dx=p.x-q.x, dy=p.y-q.y;
            const d2 = dx*dx+dy*dy;
            const L  = Math.min(p.ldist, q.ldist);
            if (d2 < L*L){
              const d = Math.sqrt(d2), fade = 1 - d/L;
              ctx.globalAlpha = 0.22*fade;
              ctx.strokeStyle = LINE;
              ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
              links++; if(links >= MAX_LINKS) break;
            }
          }
          if(links >= MAX_LINKS) break;
        }
        if(links >= MAX_LINKS) break;
      }
    }

    // nodes
    ctx.shadowBlur = 0;
    for(let i=0;i<pos.length;i++){
      const p = pos[i];
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = NODE;
      ctx.beginPath(); ctx.arc(p.x,p.y,NODE_RADIUS,0,Math.PI*2); ctx.fill();
      if(i%7===0){
        ctx.globalAlpha=0.9; ctx.fillStyle=BRAND;
        ctx.beginPath(); ctx.arc(p.x,p.y,0.6,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize, { passive:true });
  resize(); requestAnimationFrame(draw);
})();
