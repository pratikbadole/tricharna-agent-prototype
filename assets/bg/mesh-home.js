(() => {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // get or create the canvas
  let c = document.getElementById('bg-net');
  if (!c) {
    c = document.createElement('canvas');
    c.id = 'bg-net';
    document.body.prepend(c);
  }
  const ctx = c.getContext('2d');

  function resize() {
    const w = Math.max(document.documentElement.clientWidth,  window.innerWidth  || 0);
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.width  = '100vw';
    c.style.height = '100vh';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '0';
    c.width  = Math.round(w * DPR);
    c.height = Math.round(h * DPR);
    build();
  }

  let pts = [];
  function build() {
    pts = [];
    const W = c.width / DPR, H = c.height / DPR;
    const spacing = 36, jitter = 10;
    for (let y = -20; y < H + 40; y += spacing) {
      for (let x = -20; x < W + 40; x += spacing) {
        pts.push({ x: x + (Math.random()*jitter - jitter/2),
                   y: y + (Math.random()*jitter - jitter/2),
                   ph: Math.random()*Math.PI*2 });
      }
    }
  }

  const LINE='rgba(255,107,0,0.18)', GLOW='rgba(255,107,0,0.10)', NODE='rgba(255,200,150,0.28)';

  function draw(t=0){
    const time=t/1000;
    const W=c.width/DPR, H=c.height/DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);

    const g=ctx.createRadialGradient(W*0.35,H*0.45,0,W*0.35,H*0.45,Math.max(W,H)*0.65);
    g.addColorStop(0,GLOW); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    const TH=70; ctx.lineWidth=1;
    for (let i=0;i<pts.length;i++){
      const p=pts[i], px=p.x+Math.sin(time*0.6+p.ph)*0.8, py=p.y+Math.cos(time*0.5+p.ph)*0.8;
      for (let j=i+1;j<pts.length;j++){
        const q=pts[j], qx=q.x+Math.sin(time*0.6+q.ph)*0.8, qy=q.y+Math.cos(time*0.5+q.ph)*0.8;
        const d=Math.hypot(px-qx,py-qy);
        if(d<TH){ ctx.globalAlpha=0.16*(1-d/TH); ctx.strokeStyle=LINE; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(qx,qy); ctx.stroke(); }
      }
    }
    ctx.globalAlpha=1;
    for(const p of pts){
      const r=0.8+0.5*Math.sin(time*1.2+p.ph);
      const px=p.x+Math.sin(time*0.6+p.ph)*0.8, py=p.y+Math.cos(time*0.5+p.ph)*0.8;
      ctx.fillStyle=NODE; ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize',resize);
  resize();
  requestAnimationFrame(draw);
})();
