(() => {
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-net-home';
  Object.assign(canvas.style, { position:'fixed', inset:'0', zIndex:'0', pointerEvents:'none' });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W=0, H=0, pts=[];
  const DENSITY = 0.55;   // lower => fewer points
  const RANGE   = 110;
  const ORANGE  = (a)=>`rgba(255,107,0,${a})`;

  function resize(){
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }
  function build(){
    pts = [];
    const nx = Math.ceil(W/90), ny = Math.ceil(H/90);
    for(let y=0;y<=ny;y++){
      for(let x=0;x<=nx;x++){
        if(Math.random() < DENSITY){
          pts.push({ x:(x+(y%2?0.5:0))*(W/nx), y:y*(H/ny), p:Math.random()*Math.PI*2 });
        }
      }
    }
  }
  function draw(t){
    const time=(t||0)/1000;
    ctx.clearRect(0,0,W,H);
    const g = ctx.createRadialGradient(W*0.22, H*0.42, 0, W*0.22, H*0.42, Math.max(W,H)*0.6);
    g.addColorStop(0, ORANGE(0.09)); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    ctx.lineWidth = 0.8;
    for(let i=0;i<pts.length;i++){
      const p=pts[i];
      for(let j=i+1;j<pts.length;j++){
        const q=pts[j], dx=p.x-q.x, dy=p.y-q.y, d=Math.hypot(dx,dy);
        if(d<RANGE){
          ctx.globalAlpha = 0.10*(1-d/RANGE);
          ctx.strokeStyle = ORANGE(0.35);
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha=1;
    for(const p of pts){
      const r = 1 + 0.7*Math.sin(time*1.2 + p.p);
      ctx.fillStyle=ORANGE(0.35);
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  addEventListener('resize', resize);
  resize(); requestAnimationFrame(draw);
})();
