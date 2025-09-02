/**
 * CTA–Footer gap fix (non-destructive)
 * Pull the footer up so it's ~16px below the CTA card.
 */
(() => {
  const cta   = document.querySelector('#cta-promo');
  const foot  = document.querySelector('footer');
  if (!cta || !foot) return;

  // Find the visible CTA card box to measure from
  const card = cta.querySelector('.glass') || cta.firstElementChild || cta;

  // Recompute on load & on resize to keep the gap consistent
  const adjust = () => {
    const b = card.getBoundingClientRect();
    const f = foot.getBoundingClientRect();
    const currentGap = Math.max(0, Math.round(f.top - b.bottom));

    const desired = 16;                   // target visual gap, px
    const pull = Math.max(0, currentGap - desired);

    foot.style.marginTop = pull ? `-${pull}px` : '0';
  };

  // run now and whenever viewport changes
  window.addEventListener('load', adjust, { once: true });
  window.addEventListener('resize', adjust, { passive: true });
  // also run shortly after DOM ready, in case fonts shift layout
  adjust();
})();
