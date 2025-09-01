(() => {
  const c = document.getElementById('bg-net') || document.getElementById('bg-mesh');
  if (!c) { console.warn('MESH_HOME: no canvas'); return; }

  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const ctx = c.getContext('2d');

  function size(){
    const W = window.innerWidth, H = window.innerHeight;
    c.width = W * DPR; c.height = H * DPR;
    c.style.position = 'fixed'; c.style.inset = '0';
    c.style.zIndex = '0'; c.style.pointerEvents = 'none';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  // brand palette
  const LINK = 'rgba(255,130,40,0.08)';
  const NODE = 'rgba(255,190,120,0.28)';

  let pts = [], W = 0, H = 0;

  function build(){
    W = window.innerWidth; H = window.innerHeight;
    pts = [];
    const step = 54, jitter = 14;
    const cols = Math.ceil(W/step), rows = Math.ceil(H/step);
    for(let y=0;y<=rows;y++){
      for(let x=0;x<=cols;x++){
        pts.push({
          x: x*step + (Math.random()-0.5)*jitter,
          y: y*step + (Math.random()-0.5)*jitter,
          ph: Math.random()*Math.PI*2
        });
      }
    }
  }

  function draw(t=0){
    const time = t/1000;
    ctx.clearRect(0,0,c.width,c.height);

    // subtle brand bloom
    const g = ctx.createRadialGradient(W*0.30, H*0.42, 0, W*0.30, H*0.42, 620);
    g.addColorStop(0,'rgba(255,120,20,0.09)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // links
    const TH = 95;
    ctx.lineWidth = 1;
    for(let i=0;i<pts.length;i++){
      const p = pts[i];
      for(let j=i+1;j<pts.length;j++){
        const q = pts[j];
        const d = Math.hypot(p.x-q.x, p.y-q.y);
        if(d<TH){
          ctx.globalAlpha = 0.12*(1-d/TH);
          ctx.strokeStyle = LINK;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
        }
      }
    }

    // nodes
    ctx.globalAlpha = 1;
    for(const p of pts){
      const r = 1.0 + 0.7*Math.sin(time*1.6 + p.ph);
      ctx.fillStyle = NODE;
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  console.log('MESH_HOME: init');
  size(); build(); requestAnimationFrame(draw);
  addEventListener('resize', ()=>{ size(); build(); });
})();
