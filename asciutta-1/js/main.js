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
    // la testata è fissa: Lenis e scrollIntoView rispettano lo scroll-margin-top del CSS
    if (lenis) lenis.scrollTo(meta, { onComplete: fine });
    else { meta.scrollIntoView({ behavior: 'auto' }); fine(); }
  });
}

/* ---------- Comparsa leggera allo scroll (solo CSS se il movimento è consentito) ---------- */
function initComparsa() {
  const el = document.querySelectorAll('[data-comparsa], [data-titolo], [data-foto]');
  if (!('IntersectionObserver' in window)) { el.forEach((x) => x.classList.add('is--visibile')); return; }
  const io = new IntersectionObserver((voci) => voci.forEach((v) => {
    if (v.isIntersecting) { v.target.classList.add('is--visibile'); io.unobserve(v.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  el.forEach((x) => io.observe(x));
}

/* ---------- highlight-text-on-scroll (come il metodo della D), senza librerie ---------- */
function initEvidenzia() {
  const blocchi = document.querySelectorAll('[data-evidenzia]');
  if (riduci.matches || !blocchi.length) return;
  blocchi.forEach((b) => {
    // ogni parola in uno span, anche dentro il corsivo; gli spazi restano testo
    const testi = [];
    const giro = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    while (giro.nextNode()) testi.push(giro.currentNode);
    testi.forEach((t) => {
      const frammento = document.createDocumentFragment();
      t.textContent.split(/(\s+)/).forEach((pezzo) => {
        if (!pezzo) return;
        if (/^\s+$/.test(pezzo)) { frammento.append(pezzo); return; }
        const s = document.createElement('span');
        s.className = 'parola is--spenta';
        s.textContent = pezzo;
        frammento.append(s);
      });
      t.replaceWith(frammento);
    });
    b._parole = [...b.querySelectorAll('.parola')];
  });
  const aggiorna = () => blocchi.forEach((b) => {
    const r = b.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 quando il blocco entra dal basso, 1 quando è salito oltre metà schermo
    const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (r.height * 0.6 + vh * 0.4)));
    const accese = Math.round(p * b._parole.length);
    b._parole.forEach((w, i) => w.classList.toggle('is--spenta', i >= accese));
  });
  let attesa = false;
  window.addEventListener('scroll', () => { if (!attesa) { attesa = true; requestAnimationFrame(() => { aggiorna(); attesa = false; }); } }, { passive: true });
  aggiorna();
}

/* ---------- «Curriculum»: segnaposto, ancora da decidere con lo Studio ---------- */
document.addEventListener('click', (e) => { if (e.target.closest('[data-segnaposto]')) e.preventDefault(); });

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initComparsa();
  initEvidenzia();
});
