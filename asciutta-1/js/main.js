/* Martone & Martone · «asciutta 1» · scroll morbido, comparse leggere; niente altro */
const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
let lenis = null;

/* ---------- Scroll morbido (Lenis, come nelle altre demo); spento con «riduci movimento» ---------- */
function initLenis() {
  const avvia = () => {
    if (!riduci.matches && !lenis && window.Lenis) {
      lenis = new Lenis({ autoRaf: true, duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else if (riduci.matches && lenis) {
      lenis.destroy();
      lenis = null;
    }
  };
  avvia();
  riduci.addEventListener('change', avvia);

  // Ancore interne: scorrimento morbido, poi il focus va alla sezione
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.origin !== location.origin || a.pathname !== location.pathname || !a.hash || a.hash === '#') return;
    const meta = document.querySelector(a.hash);
    if (!meta) return;
    e.preventDefault();
    const fine = () => {
      if (!meta.hasAttribute('tabindex')) meta.setAttribute('tabindex', '-1');
      meta.focus({ preventScroll: true });
      history.replaceState(null, '', a.hash);
    };
    if (lenis) lenis.scrollTo(meta, { onComplete: fine });
    else { meta.scrollIntoView({ behavior: 'auto' }); fine(); }
  });
}

/* ---------- Comparsa leggera allo scroll (solo CSS se il movimento è consentito) ---------- */
function initComparsa() {
  const el = document.querySelectorAll('[data-comparsa]');
  if (!('IntersectionObserver' in window)) { el.forEach((x) => x.classList.add('is--visibile')); return; }
  const io = new IntersectionObserver((voci) => voci.forEach((v) => {
    if (v.isIntersecting) { v.target.classList.add('is--visibile'); io.unobserve(v.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  el.forEach((x) => io.observe(x));
}

/* ---------- «Curriculum»: segnaposto, ancora da decidere con lo Studio ---------- */
document.addEventListener('click', (e) => { if (e.target.closest('[data-segnaposto]')) e.preventDefault(); });

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initComparsa();
});
