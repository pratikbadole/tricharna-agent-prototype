(function(){
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  // Brand palette (soft, subtle)
  const BG      = '#0b0b0f';
  const GRID    = 'rgba(255,255,255,0.05)';        // existing grid stays from CSS
  const LINE    = 'rgba(40, 200, 220, 0.25)';       // muted cyan-teal
  const NODE    = 'rgba(80, 220, 235, 0.30)';
  const LINE_DIM= 'rgba(40, 200, 220, 0.14)';
  const GLOW    = 'rgba(255, 107, 0, 0.10)';        // faint orange glow (rare)

  // Create & insert canvas once
  let c = document.getElementById('bg-mesh');
  if(!c){
    c = document.createElement('canvas');
    c.id = 'bg-mesh';
    document.body.prepend(c);
  }
  const ctx = c.getContext('2d');

  let W=0, H=0;
  function resize(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    W = Math.floor(w * DPR);
    H = Math.floor(h * DPR);
    c.width = W;
    c.height= H;
    c.style.width  = w + 'px';
    c.style.height = h + 'px';
    // rebuild points on resize
    build();
  }
  window.addEventListener('resize', resize, {passive:true});

  // Hex grid params
  let pts = [];
  let t0 = performance.now();
  function build(){
    pts.length = 0;
    const spacing = Math.max(36, Math.min(68, Math.floor(window.innerWidth/24)));
    const hexR = spacing/2;
    const hexH = Math.sqrt(3)*hexR;
    // staggered rows
    let rows = Math.ceil(window.innerHeight / hexH) + 2;
    let cols = Math.ceil(window.innerWidth  / spacing) + 3;

    for(let r=0; r<rows; r++){
      for(let q=0; q<cols; q++){
        const offset = (r % 2) ? spacing/2 : 0;
        const x = (q*spacing + offset);
        const y = (r*hexH*0.86);
        // randomness for depth
        const jitter = (Math.random()-0.5)*0.35*hexR;
        const alpha  = 0.10 + Math.random()*0.18; // 0.10–0.28
        // small probability to be an orange glow node (very rare)
        const glow   = Math.random() < 0.03;
        pts.push({
          x: x, y: y,
          jx: jitter*(Math.random()*0.8+0.2),
          jy: jitter*(Math.random()*0.8+0.2),
          a: alpha,
          glow
        });
      }
    }
  }

  function draw(now){
    const t = (now - t0)/1000;
    ctx.clearRect(0,0,W,H);

    ctx.save();
    ctx.scale(DPR, DPR);

    // Subtle vignette is handled in CSS via radial-gradients,
    // here we only render network (lines + nodes)

    // Connect neighbors in a local radius
    const rConn = Math.min(window.innerWidth, window.innerHeight) * 0.08;

    // Slight drift to keep it alive
    for(const p of pts){
      const dx = Math.sin((p.x + t*12)*0.004) * p.jx;
      const dy = Math.cos((p.y + t*10)*0.004) * p.jy;
      p.rx = p.x + dx;
      p.ry = p.y + dy;
    }

    // Lines first (dim + main highlights)
    ctx.lineWidth = 1;
    for(let i=0;i<pts.length;i++){
      const a = pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b = pts[j];
        const dx = a.rx - b.rx, dy = a.ry - b.ry;
        const d  = Math.hypot(dx,dy);
        if(d < rConn){
          // opacity falls with distance
          const k = 1 - (d/rConn);
          const o = (0.06 + 0.18*k) * ((a.a+b.a)/2);
          // alternating dim/main
          ctx.strokeStyle = k > 0.5 ? LINE : LINE_DIM;
          ctx.globalAlpha = o;
          ctx.beginPath();
          ctx.moveTo(a.rx, a.ry);
          ctx.lineTo(b.rx, b.ry);
          ctx.stroke();
        }
      }
    }

    // Nodes
    for(const p of pts){
      const r = 1.5 + p.a*1.5; // 1.5–3
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.glow ? GLOW : NODE;
      ctx.beginPath();
      ctx.arc(p.rx, p.ry, r, 0, Math.PI*2);
      ctx.fill();
      // faint core
      if(!p.glow){
        ctx.globalAlpha = Math.min(0.35, p.a+0.08);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(p.rx, p.ry, 0.7, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();
    requestAnimationFrame(draw);
  }

  resize(); // sets up + build
  requestAnimationFrame(draw);
})();
