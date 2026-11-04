// Martone & Martone · «asciutta 2»: la Osmo 2 snellita (3 nov 2026, dopo la call)
// Restano due blocchi di osmo.supply: menu a tutto schermo e scroll morbido (licenza Osmo: non ridistribuire).
// 4 nov: niente più foto della Cassazione in testa, il logo grande sta al centro (A) o su una fascia navy (B).

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
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
// la testata è fissa: si arriva sotto di lei grazie allo scroll-margin-top, che Lenis rispetta come lo scroll nativo
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

/* ---------- logo in evidenza: nella home il logo della testata parte grande e si rimpicciolisce scorrendo ---------- */
// All'inizio il logo (fisso nella testata) è spostato e ingrandito sul segnaposto della vetrina; scorrendo torna alla sua
// misura (280 px) mentre il segnaposto sale con la pagina, poi resta fermo. Con «riduci movimento» resta sempre nella testata.
function initLogo() {
  const segnaposto = document.querySelector('[data-logo-grande] .logo');
  const logo = document.querySelector('.testata__logo');
  if (!segnaposto || !logo || !conGsap) return;
  // B: bianco finché il centro del logo sta sulla fascia navy, navy da quando entra nella testata chiara
  const fascia = segnaposto.closest('.vetrina--fascia');
  const testata = document.querySelector('[data-testata]');
  const colore = () => {
    if (!fascia) return;
    const r = logo.getBoundingClientRect();
    html.classList.toggle('logo-su-fascia', r.top + r.height / 2 > testata.offsetHeight);
  };
  let tween = null;
  const misura = () => {
    const a = logo.getBoundingClientRect();
    const b = segnaposto.getBoundingClientRect();
    return { x: b.left - a.left, y: b.top + scrollY - a.top, k: b.width / a.width };
  };
  const costruisci = () => {
    tween?.scrollTrigger?.kill();
    tween?.kill();
    tween = null;
    gsap.set(logo, { clearProps: 'transform' });
    html.classList.toggle('logo-scala', moto.ok());
    html.classList.remove('logo-su-fascia');
    if (!moto.ok()) { ScrollTrigger.refresh(); return; }
    let m = misura();
    tween = gsap.fromTo(logo, { x: () => m.x, y: () => m.y, scale: () => m.k }, {
      x: 0, y: 0, scale: 1, ease: 'none',
      scrollTrigger: { start: 0, end: () => m.y, scrub: true, invalidateOnRefresh: true, onRefreshInit: () => { gsap.set(logo, { clearProps: 'transform' }); m = misura(); }, onUpdate: colore, onRefresh: colore },
    });
    ScrollTrigger.refresh();
    colore();
  };
  costruisci();
  moto.ascolta.push(costruisci);
}
