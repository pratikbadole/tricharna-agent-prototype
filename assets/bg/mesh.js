(function(){
  console.debug('[bg-mesh] init');
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  const LINE_MAIN = 'rgba(70, 210, 230, 0.32)';
  const LINE_DIM  = 'rgba(70, 210, 230, 0.18)';
  const NODE      = 'rgba(120, 240, 255, 0.30)';
  const GLOW      = 'rgba(255, 107, 0, 0.10)';

  let c = document.getElementById('bg-mesh');
  if(!c){
    c = document.createElement('canvas');
    c.id = 'bg-mesh';
    document.body.prepend(c);
  }
  const ctx = c.getContext('2d');

  let W=0, H=0, pts=[];
  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    W = Math.floor(w * DPR); H = Math.floor(h * DPR);
    c.width = W; c.height = H;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    build();
  }

  function build(){
    pts.length = 0;
    const spacing = Math.max(34, Math.min(64, Math.floor(window.innerWidth/22)));
    const r = spacing/2, hexH = Math.sqrt(3)*r;
    const rows = Math.ceil(window.innerHeight / hexH) + 2;
    const cols = Math.ceil(window.innerWidth  / spacing) + 3;

    for(let y=0; y<rows; y++){
      for(let x=0; x<cols; x++){
        const off = (y % 2) ? spacing/2 : 0;
        const px = (x*spacing + off);
        const py = (y*hexH*0.9);
        const jitter = (Math.random()-0.5)*0.3*r;
        const a = 0.14 + Math.random()*0.2;
        const glow = Math.random() < 0.03;
        pts.push({x:px,y:py,jx:jitter*(Math.random()*0.8+0.2),
                  jy:jitter*(Math.random()*0.8+0.2), a, glow});
      }
    }
  }

  function draw(tms){
    const t = (tms || 0)/1000;
    ctx.clearRect(0,0,W,H);
    ctx.save(); ctx.scale(DPR,DPR);

    // small drift
    for(const p of pts){
      const dx = Math.sin((p.x + t*12)*0.004) * p.jx;
      const dy = Math.cos((p.y + t*10)*0.004) * p.jy;
      p.rx = p.x + dx; p.ry = p.y + dy;
    }

    // connections
    const rc = Math.min(window.innerWidth, window.innerHeight) * 0.12;
    ctx.globalCompositeOperation = 'lighter';

    ctx.lineWidth = 1;
    for(let i=0;i<pts.length;i++){
      const a = pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b = pts[j];
        const dx=a.rx-b.rx, dy=a.ry-b.ry, d=Math.hypot(dx,dy);
        if(d < rc){
          const k = 1 - d/rc;
          const o = (0.08 + 0.25*k) * ((a.a+b.a)/2);
          ctx.strokeStyle = k > 0.55 ? LINE_MAIN : LINE_DIM;
          ctx.globalAlpha = o;
          ctx.beginPath(); ctx.moveTo(a.rx,a.ry); ctx.lineTo(b.rx,b.ry); ctx.stroke();
        }
      }
    }

    // nodes
    for(const p of pts){
      const r = 1.8 + p.a*1.8;
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.glow ? GLOW : NODE;
      ctx.beginPath(); ctx.arc(p.rx,p.ry,r,0,Math.PI*2); ctx.fill();

      if(!p.glow){
        ctx.globalAlpha = Math.min(0.45, p.a+0.1);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath(); ctx.arc(p.rx,p.ry,0.8,0,Math.PI*2); ctx.fill();
      }
    }

    ctx.restore();
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, {passive:true});
  resize();
  requestAnimationFrame(draw);
})();
