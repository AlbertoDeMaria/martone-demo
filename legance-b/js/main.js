/* Martone & Martone · Proposta B «Respiro» · interazioni semplici, niente librerie oltre Lenis */
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

/* ---------- Dialog modali (menu mobile e profilo): showModal tiene il Tab dentro, Esc chiude ---------- */
function apriDialog(dialog, bottone) {
  dialog._bottone = bottone;
  document.documentElement.classList.add('bloccato');
  if (lenis) lenis.stop();
  dialog.showModal();
}
function initDialog(dialog) {
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('bloccato');
    if (lenis) lenis.start();
    if (dialog._bottone) dialog._bottone.focus();
  });
  // clic sul velo fuori dal contenuto
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
}

function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const apri = document.querySelector('[data-menu-apri]');
  if (!menu || !apri) return;
  initDialog(menu);
  apri.addEventListener('click', () => apriDialog(menu, apri));
  menu.querySelector('[data-menu-chiudi]').addEventListener('click', () => menu.close());
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    menu._bottone = null;
    menu.close();
    document.documentElement.classList.remove('bloccato');
    if (lenis) lenis.start();
  }));
  // se si allarga la finestra col menu aperto, si chiude
  window.matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches && menu.open) menu.close(); });
}

function initProfilo() {
  const dialog = document.querySelector('[data-profilo-dialog]');
  if (!dialog) return;
  initDialog(dialog);
  const nome = dialog.querySelector('[data-profilo-nome]');
  const ruolo = dialog.querySelector('[data-profilo-ruolo]');
  const bio = dialog.querySelector('[data-profilo-bio]');
  const foto = dialog.querySelector('[data-profilo-foto]');
  document.querySelectorAll('[data-profilo]').forEach((b) => {
    b.addEventListener('click', () => {
      nome.textContent = b.closest('[data-nome]').dataset.nome;
      ruolo.textContent = b.dataset.ruolo;
      foto.src = b.dataset.foto;
      bio.textContent = b.dataset.bio || bio.dataset.segnaposto;
      bio.classList.toggle('is--segnaposto', !b.dataset.bio);
      apriDialog(dialog, b);
      dialog.scrollTop = 0;
    });
  });
  dialog.querySelector('[data-profilo-chiudi]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-demo]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
}

/* ---------- Filtri e ricerca nella pagina soci ---------- */
function initFiltri() {
  const pillole = document.querySelectorAll('[data-filtro]');
  const cerca = document.querySelector('[data-cerca]');
  const vuoto = document.querySelector('[data-vuoto]');
  if (!pillole.length) return;
  let filtro = 'tutti';
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aggiorna = () => {
    const q = cerca ? norm(cerca.value.trim()) : '';
    let visibili = 0;
    document.querySelectorAll('[data-voce]').forEach((v) => {
      const ok = (filtro === 'tutti' || v.dataset.voce === filtro) && (!q || norm(v.dataset.nome).includes(q));
      v.hidden = !ok;
      if (ok) { visibili++; v.classList.add('is--visibile'); }
    });
    document.querySelectorAll('[data-gruppo]').forEach((g) => { g.hidden = !g.querySelector('[data-voce]:not([hidden])'); });
    vuoto.textContent = visibili ? '' : 'Nessun nome corrisponde alla ricerca.';
  };
  pillole.forEach((p) => p.addEventListener('click', () => {
    filtro = p.dataset.filtro;
    pillole.forEach((x) => x.setAttribute('aria-pressed', String(x === p)));
    aggiorna();
  }));
  if (cerca) cerca.addEventListener('input', aggiorna);
}

/* ---------- Modulo: valida e non invia (è una demo) ---------- */
function initModulo() {
  document.querySelectorAll('[data-modulo]').forEach((form) => {
    const esito = form.querySelector('[data-esito]');
    const campi = [...form.querySelectorAll('[required]')];
    const valido = (i) => {
      const v = i.value.trim();
      if (i.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return v.length >= (parseInt(i.getAttribute('minlength'), 10) || 1);
    };
    const segna = (i) => {
      const ok = valido(i);
      i.closest('.campo').classList.toggle('is--errore', !ok);
      i.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    campi.forEach((i) => {
      i.addEventListener('blur', () => { if (i.value.trim()) segna(i); });
      i.addEventListener('input', () => { if (i.closest('.campo').classList.contains('is--errore')) segna(i); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errati = campi.filter((i) => !segna(i));
      if (errati.length) {
        esito.textContent = '';
        errati[0].focus();
        return;
      }
      esito.textContent = 'Grazie. Questa è una demo: il modulo non invia.';
      form.reset();
      campi.forEach((i) => i.removeAttribute('aria-invalid'));
    });
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

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initMenu();
  initProfilo();
  initFiltri();
  initModulo();
  initComparsa();
});
