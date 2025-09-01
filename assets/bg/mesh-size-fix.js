(() => {
  function forceSize() {
    const c = document.getElementById('bg-net');
    if (!c) return;
    const DPR = window.devicePixelRatio || 1;

    // CSS sizing
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.width = '100vw';
    c.style.height = '100vh';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '0';

    // Backing store size for crisp drawing
    const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    c.width  = Math.round(w * DPR);
    c.height = Math.round(h * DPR);

    // If your mesh.js exposes a resize hook, try to call it
    if (typeof window._meshResize === 'function') {
      try { window._meshResize(); } catch (_) {}
    }
  }

  window.addEventListener('load', forceSize);
  window.addEventListener('resize', forceSize);
  forceSize();
})();
