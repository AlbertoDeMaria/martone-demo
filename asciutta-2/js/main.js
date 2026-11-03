// Martone & Martone · «asciutta 2»: la Osmo 2 snellita (3 nov 2026, dopo la call)
// Restano tre blocchi di osmo.supply: menu a tutto schermo, zoom della foto, scroll morbido (licenza Osmo: non ridistribuire).

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 992px)');
const conGsap = typeof window.gsap !== 'undefined';
const html = document.documentElement;
const durata = (nome) => parseFloat(getComputedStyle(html).getPropertyValue(nome));

// «riduci movimento» spegne tutto, anche a pagina aperta
const moto = {
  ascolta: [],
  ok() { return !riduci.matches; },
};
riduci.addEventListener('change', () => moto.ascolta.forEach((fn) => fn(moto.ok())));

let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  initLenis();
  initMenu();
  initZoom();
  initLogo();
  if (conGsap && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
});

/* ---------- lenis-smooth-scroll-setup + lenis-scroll-to-anchor-target (impostazioni della F) ---------- */
function initLenis() {
  if (typeof window.Lenis === 'undefined') return;
  const aggiorna = (ok) => {
    if (ok && !lenis) {
      lenis = new Lenis({ autoRaf: !conGsap, duration: durata('--durata-scroll'), easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      if (conGsap) lenis.on('scroll', ScrollTrigger.update);
      if (html.classList.contains('scroll-bloccato')) lenis.stop();
    } else if (!ok && lenis) {
      lenis.destroy();
      lenis = null;
    }
  };
  if (conGsap) {
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  aggiorna(moto.ok());
  moto.ascolta.push(aggiorna);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.matches('.salta')) return;
    if (a.pathname !== location.pathname || !a.hash) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    vaiA(target);
    history.pushState(null, '', a.hash);
  });
}
function vaiA(el) {
  if (lenis) lenis.scrollTo(el, { duration: durata('--durata-ancora') });
  else el.scrollIntoView();
}

// Tab che gira dentro un pannello aperto: dall'ultimo elemento si torna al primo e viceversa
const FOCUSABILI = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
function giraFocus(e, elementi) {
  if (e.key !== 'Tab') return;
  const el = elementi.filter((x) => !x.closest('[inert]') && x.getClientRects().length);
  if (!el.length) return;
  const i = el.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); el[el.length - 1].focus(); }
  else if (!e.shiftKey && (i === -1 || i === el.length - 1)) { e.preventDefault(); el[0].focus(); }
}
function bloccaScroll(si) {
  html.classList.toggle('scroll-bloccato', si);
  if (si) lenis?.stop(); else lenis?.start();
}

/* ---------- bold-full-screen-navigation (dalla 23) ---------- */
// Stato su [data-navigation-status], la CSS fa tutto. Il resto della pagina è inert, resta attiva la testata col «Chiudi».
function initMenu() {
  const menu = document.querySelector('[data-navigation-status]');
  const toggle = document.querySelector('[data-navigation-toggle="toggle"]');
  if (!menu || !toggle) return;
  const testo = toggle.querySelector('[data-menu-testo]');
  const icona = toggle.querySelector('[data-menu-icona]');
  const testata = toggle.closest('[data-testata]');
  const aperto = () => menu.getAttribute('data-navigation-status') === 'active';
  const resto = [...document.body.children].filter((el) => el !== menu && el !== testata && !['SCRIPT'].includes(el.tagName) && !el.matches('svg.sprite'));
  const imposta = (apri) => {
    menu.setAttribute('data-navigation-status', apri ? 'active' : 'not-active');
    menu.inert = !apri;
    resto.forEach((el) => { el.inert = apri; });
    html.classList.toggle('menu-aperto', apri);
    toggle.setAttribute('aria-expanded', String(apri));
    testo.textContent = apri ? 'Chiudi' : 'Menu';
    icona.setAttribute('href', apri ? '#i-x' : '#i-menu');
    bloccaScroll(apri);
    if (apri) menu.querySelector('a')?.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => imposta(!aperto()));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (aperto()) imposta(false); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aperto()) { imposta(false); toggle.focus(); }
    if (aperto()) giraFocus(e, [...testata.querySelectorAll(FOCUSABILI), ...menu.querySelectorAll(FOCUSABILI)]);
  });
}

/* ---------- image-to-background-zoom (dalla 01, semplificato) ---------- */
// La foto parte incassata (larga quanto il contenuto, alta 460 o 260 px) e scorrendo si apre
// fino a fare da sfondo al titolo del testo; poi compaiono il velo e il titolo. Con «riduci movimento» restano due blocchi fermi.
function initZoom() {
  const root = document.querySelector('[data-bg-zoom]');
  if (!root || !conGsap) return;
  const foto = root.querySelector('[data-bg-zoom-foto]');
  const img = foto.querySelector('img');
  const velo = root.querySelector('[data-bg-zoom-velo]');
  const testo = root.querySelector('[data-bg-zoom-testo]');
  let tl = null;
  const costruisci = () => {
    tl?.scrollTrigger?.kill();
    tl?.kill();
    tl = null;
    gsap.set([foto, img, velo, testo], { clearProps: 'all' });
    html.classList.toggle('zoom-attivo', moto.ok());
    if (!moto.ok()) { ScrollTrigger.refresh(); return; }
    const lato = getComputedStyle(root).getPropertyValue('--incasso').trim();
    const alta = desktop.matches ? 460 : 260;
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top 75%', end: 'bottom bottom', scrub: true },
    })
      .fromTo(foto, { clipPath: `inset(0px ${lato} calc(100% - ${alta}px) ${lato} round 10px)` }, { clipPath: 'inset(0px 0px 0% 0px round 0px)', duration: 0.5 }, 0)
      // all'inizio la finestra incassata mostra la facciata (come nel Figma), non il cielo: la foto sale e torna giù mentre si apre
      .fromTo(img, { yPercent: -37 }, { yPercent: 0, duration: 0.5 }, 0)
      .fromTo(velo, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.38)
      .fromTo(testo, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.22 }, 0.48)
      .to({}, { duration: 0.3 });
    ScrollTrigger.refresh();
  };
  costruisci();
  moto.ascolta.push(costruisci);
  let larghezza = innerWidth;
  let t;
  addEventListener('resize', () => {
    if (innerWidth === larghezza) return;
    larghezza = innerWidth;
    clearTimeout(t);
    t = setTimeout(costruisci, 150);
  });
}

/* ---------- logo in evidenza: nella home il logo della testata compare quando quello grande esce dallo schermo ---------- */
function initLogo() {
  const grande = document.querySelector('[data-logo-grande]');
  if (!grande) return;
  new IntersectionObserver(([v]) => html.classList.toggle('logo-grande-in-vista', v.isIntersecting), { rootMargin: '-60px 0px 0px 0px' }).observe(grande);
}
