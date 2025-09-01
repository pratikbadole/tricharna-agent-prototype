(() => {
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let c = document.getElementById('bg-net');
  if (!c) {
    c = document.createElement('canvas');
    c.id = 'bg-net';
    document.body.prepend(c);
  }
  const ctx = c.getContext('2d');

  let W = 0, H = 0, nodes = [];
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    c.style.width = W + 'px';
    c.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  // dense network across whole screen (not clumped)
  function build() {
    nodes = [];
    const spacing = 72;                         // grid base spacing
    const jitter  = 22;                         // random offset per node
    const dx = spacing * Math.sqrt(3) / 2;     // hex offset
    for (let y = -40, row = 0; y < H+60; y += spacing, row++) {
      const offset = (row % 2) ? dx/2 : 0;
      for (let x = -40; x < W+60; x += dx) {
        nodes.push({
          x: x + offset + (Math.random()*2-1)*jitter,
          y: y + (Math.random()*2-1)*jitter,
          phase: Math.random()*Math.PI*2,
          speed: 0.4 + Math.random()*0.6
        });
      }
    }
  }

  function draw(t=0) {
    const time = t/1000;
    // clean + subtle dark base
    ctx.clearRect(0,0,W,H);

    // soft orange bloom (brand)
    const g = ctx.createRadialGradient(W*0.25, H*0.38, 0, W*0.25, H*0.38, Math.max(W,H)*0.7);
    g.addColorStop(0, 'rgba(255,107,0,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // animated node positions (tiny breathing)
    const AMP = 1.5;
    for (const p of nodes) {
      p.rx = p.x + Math.sin(time*p.speed + p.phase)*AMP;
      p.ry = p.y + Math.cos(time*p.speed + p.phase)*AMP;
    }

    // long orange links (brand color)
    const LINK = 'rgba(255,107,0,0.35)';
    const THRESH = 130;        // longer connections than login
    ctx.lineWidth = 1;
    for (let i=0;i<nodes.length;i++){
      const a = nodes[i];
      for (let j=i+1;j<nodes.length;j++){
        const b = nodes[j];
        const dx = a.rx-b.rx, dy = a.ry-b.ry, d = Math.hypot(dx,dy);
        if (d < THRESH) {
          ctx.globalAlpha = 0.09 * (1 - d/THRESH);
          ctx.strokeStyle = LINK;
          ctx.beginPath();
          ctx.moveTo(a.rx, a.ry);
          ctx.lineTo(b.rx, b.ry);
          ctx.stroke();
        }
      }
    }

    // subtle nodes
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (const p of nodes) {
      const r = 1.1 + 0.5*Math.sin(time*1.3 + p.phase);
      ctx.beginPath(); ctx.arc(p.rx, p.ry, r, 0, Math.PI*2); ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize);
  resize(); requestAnimationFrame(draw);
})();
