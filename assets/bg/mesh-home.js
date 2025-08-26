// Orange network mesh for HOME
(() => {
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.id = 'bg-net-home';
  document.body.prepend(c);
  const ctx = c.getContext('2d');

  let W=0, H=0, pts=[], links=[];
  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * DPR; c.height = H * DPR;
    c.style.width = W+'px'; c.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  function build(){
    pts = [];
    const gap = Math.max(50, Math.min(90, Math.floor(W/18))); // adaptive density
    for(let y=-20; y<H+40; y+=gap){
      for(let x=-20; x<W+40; x+=gap){
        const jx = x + (Math.random()*gap*0.4 - gap*0.2);
        const jy = y + (Math.random()*gap*0.4 - gap*0.2);
        pts.push({x: jx, y: jy, z: Math.random()*2*Math.PI});
      }
    }
    // connect k-nearest (~2) for long filaments
    links = [];
    const k = 2;
    for(let i=0;i<pts.length;i++){
      const pi = pts[i];
      const dists = [];
      for(let j=0;j<pts.length;j++){
        if(i===j) continue;
        const pj = pts[j];
        const dx = pi.x-pj.x, dy = pi.y-pj.y;
        dists.push([dx*dx+dy*dy, j]);
      }
      dists.sort((a,b)=>a[0]-b[0]);
      for(let n=0;n<k;n++){
        links.push([i, dists[n][1]]);
      }
    }
  }

  function draw(tms){
    const t = (tms||0)/1000;
    ctx.clearRect(0,0,W,H);

    // soft orange blooms
    const g1 = ctx.createRadialGradient(W*0.25, H*0.45, 0, W*0.25, H*0.45, 520);
    g1.addColorStop(0,'rgba(255,107,0,0.10)'); g1.addColorStop(1,'rgba(0,0,0,0)');
    const g2 = ctx.createRadialGradient(W*0.75, H*0.65, 0, W*0.75, H*0.65, 480);
    g2.addColorStop(0,'rgba(255,107,0,0.06)'); g2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g1; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = g2; ctx.fillRect(0,0,W,H);

    // animate nodes a tiny bit (breathing)
    for(const p of pts){
      p.rx = p.x + Math.sin(t*0.6 + p.z)*3;
      p.ry = p.y + Math.cos(t*0.5 + p.z)*3;
    }

    // long orange filaments
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,107,0,0.35)';
    ctx.beginPath();
    for(const [a,b] of links){
      const p = pts[a], q = pts[b];
      ctx.moveTo(p.rx, p.ry); ctx.lineTo(q.rx, q.ry);
    }
    ctx.stroke();

    // subtle nodes
    for(const p of pts){
      const r = 0.9 + 0.5*Math.sin(t*1.3 + p.z);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.arc(p.rx, p.ry, r, 0, Math.PI*2); ctx.fill();
      // warm cores
      if(Math.random()<0.02){
        ctx.fillStyle = 'rgba(255,107,0,0.65)';
        ctx.beginPath(); ctx.arc(p.rx, p.ry, 1.1, 0, Math.PI*2); ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize(); requestAnimationFrame(draw);
})();
