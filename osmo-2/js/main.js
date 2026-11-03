// Martone & Martone · proposta «Osmo 2» (stessa famiglia della D)
// Blocchi di osmo.supply adattati dalle nostre demo (licenza Osmo: uso nei progetti dei clienti, non ridistribuire).
// Originali e note in osmo/<slug>/.

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 992px)');
const conGsap = typeof window.gsap !== 'undefined';
const html = document.documentElement;
const pad = (n) => String(n).padStart(2, '0');
const durata = (nome) => parseFloat(getComputedStyle(html).getPropertyValue(nome));

// «riduci movimento» spegne tutto, anche a pagina aperta
const moto = {
  ascolta: [],
  ok() { return !riduci.matches; },
};
riduci.addEventListener('change', () => moto.ascolta.forEach((fn) => fn(moto.ok())));

let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) {
    html.classList.add('gsap');
    gsap.registerPlugin(ScrollTrigger, Flip);
  }
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  initLenis();
  initMenu();
  initAvanzamento();
  initZoom();
  initSlider();
  initAree();
  initDock();
  initAccordion();
  initCoda();
  initCopyEmail();
  initCurrentTime();
  initFormValidation();
  initGalleria();
  initListaGriglia();
  initFiltri();
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

/* ---------- scroll-progress-bar (dalla 14, qui sulla pagina intera) ---------- */
function initAvanzamento() {
  const barra = document.querySelector('[data-progress-bar]');
  if (!barra) return;
  let rif = 0;
  const aggiorna = () => {
    rif = 0;
    const max = html.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!rif) rif = requestAnimationFrame(aggiorna); }, { passive: true });
  addEventListener('resize', aggiorna);
  aggiorna();
}

/* ---------- image-to-background-zoom (dalla 01, semplificato) ---------- */
// La foto parte incassata come nel Figma (larga quanto il contenuto, alta 460 o 260 px) e scorrendo si apre
// fino a fare da sfondo al metodo; poi compaiono il velo e il testo. Con «riduci movimento» restano due blocchi fermi.
function initZoom() {
  const root = document.querySelector('[data-bg-zoom]');
  if (!root || !conGsap) return;
  const foto = root.querySelector('[data-bg-zoom-foto]');
  const velo = root.querySelector('[data-bg-zoom-velo]');
  const testo = root.querySelector('[data-bg-zoom-testo]');
  let tl = null;
  const costruisci = () => {
    tl?.scrollTrigger?.kill();
    tl?.kill();
    tl = null;
    gsap.set([foto, velo, testo], { clearProps: 'all' });
    html.classList.toggle('zoom-attivo', moto.ok());
    if (!moto.ok()) { ScrollTrigger.refresh(); return; }
    const lato = getComputedStyle(root).getPropertyValue('--incasso').trim();
    const alta = desktop.matches ? 460 : 260;
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top 75%', end: 'bottom bottom', scrub: true },
    })
      .fromTo(foto, { clipPath: `inset(0px ${lato} calc(100% - ${alta}px) ${lato} round 10px)` }, { clipPath: 'inset(0px 0px 0% 0px round 0px)', duration: 0.5 }, 0)
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

/* ---------- centered-looping-slider (dalla 08, qui con le cinque carte in fila che girano) ---------- */
function initSlider() {
  const root = document.querySelector('[data-slider]');
  if (!root) return;
  const carte = [...root.querySelectorAll('[data-slide]')];
  const num = document.querySelector('[data-slider-num]');
  const stato = root.querySelector('[data-slider-stato]');
  const n = carte.length;
  let corrente = 2; // come nel Figma: «03 / 05», Efficacia al centro
  const posDi = (i) => ((i - corrente + n + 2) % n) - 2;
  const disponi = (annuncia) => {
    carte.forEach((c, i) => {
      const p = posDi(i);
      const prima = c.dataset.pos === undefined ? p : Number(c.dataset.pos);
      // la carta che passa da un capo all'altro non attraversa la fila: rientra in dissolvenza
      if (Math.abs(p - prima) > 2) {
        c.setAttribute('data-salto', '');
        requestAnimationFrame(() => requestAnimationFrame(() => c.removeAttribute('data-salto')));
      }
      c.dataset.pos = String(p);
      c.style.setProperty('--pos', p);
    });
    num.textContent = pad(corrente + 1);
    if (annuncia) stato.textContent = `${carte[corrente].querySelector('.t-h3').textContent}, valore ${corrente + 1} di ${n}`;
  };
  const vai = (d) => { corrente = (corrente + d + n) % n; disponi(true); };
  document.querySelector('[data-slider-prev]').addEventListener('click', () => vai(-1));
  document.querySelector('[data-slider-next]').addEventListener('click', () => vai(1));
  carte.forEach((c, i) => c.addEventListener('click', () => { const p = posDi(i); if (p) vai(p); }));
  // trascinamento col dito sul telefono
  let x0 = null;
  root.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') x0 = e.clientX; });
  root.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) vai(e.clientX < x0 ? 1 : -1); x0 = null; });
  root.style.touchAction = 'pan-y';
  disponi(false);
}

/* ---------- sticky-features (dalla 14): la foto resta ferma e cambia con l'area ---------- */
function initAree() {
  const w = document.querySelector('[data-sticky-feature-wrap]');
  if (!w) return;
  const foto = [...w.querySelectorAll('[data-sticky-feature-visual]')];
  const items = [...w.querySelectorAll('[data-sticky-feature-item]')];
  const etichetta = w.querySelector('[data-sticky-feature-label]');
  const nomi = items.map((li) => li.querySelector('.area__n').textContent.split(' · ')[1]);
  let attuale = 0;
  const vai = (i, subito) => {
    if (i === attuale) return;
    items.forEach((li, k) => { li.classList.toggle('is-attivo', k === i); li.setAttribute('aria-expanded', String(k === i)); });
    etichetta.textContent = `${pad(i + 1)} / ${pad(items.length)} · ${nomi[i]}`;
    foto.forEach((img, k) => {
      if (k === 0) return;
      const da = k <= attuale;
      const a = k <= i;
      if (da === a) return;
      const clipPath = `inset(${a ? 0 : 50}% round 10px)`;
      if (subito || !conGsap) img.style.clipPath = clipPath;
      else gsap.to(img, { clipPath, duration: 0.75, ease: 'power4.inOut', overwrite: 'auto' });
    });
    attuale = i;
  };
  // il clic su un'area resta sempre disponibile (è l'unico modo con «riduci movimento» e sul telefono)
  items.forEach((li, k) => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-expanded', String(k === 0));
    li.addEventListener('click', (e) => { if (!e.target.closest('a')) vai(k, !moto.ok()); });
    li.addEventListener('keydown', (e) => { if (e.target === li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); vai(k, !moto.ok()); } });
  });
  if (!conGsap) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-width: 992px)', () => {
    const passi = items.length - 1;
    const st = ScrollTrigger.create({
      trigger: w,
      start: 'center center',
      end: () => `+=${passi * 45}%`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = Math.min(self.progress, 0.9) / 0.9;
        vai(Math.max(0, Math.min(passi, Math.floor(p * passi + 1e-6))));
      },
    });
    return () => st.kill();
  });
}

/* ---------- section-anchor-dock (dalla 14): pillola in basso con la sezione in vista, su e giù ---------- */
function initDock() {
  const dock = document.querySelector('[data-section-dock]');
  if (!dock) return;
  const etichetta = dock.querySelector('[data-section-dock-label]');
  const sezioni = [...document.querySelectorAll('[data-dock-sezione]')];
  let corrente = 0;
  const visibili = new Set();
  const io = new IntersectionObserver((voci) => {
    voci.forEach((v) => (v.isIntersecting ? visibili.add(v.target) : visibili.delete(v.target)));
    const i = sezioni.findIndex((s) => visibili.has(s));
    // si vede dalle aree in poi, come nel Figma; sparisce nella hero e nel footer
    const mostra = i >= 2;
    if (!mostra && dock.contains(document.activeElement)) document.activeElement.blur();
    dock.toggleAttribute('data-nascosto', !mostra);
    if (i < 0) return;
    corrente = i;
    etichetta.textContent = `${pad(i + 1)} · ${sezioni[i].dataset.dockSezione}`;
  }, { rootMargin: '-45% 0px -55% 0px' });
  sezioni.forEach((s) => io.observe(s));
  dock.querySelectorAll('[data-dock-vai]').forEach((b) => b.addEventListener('click', () => {
    const i = Math.max(0, Math.min(sezioni.length - 1, corrente + Number(b.dataset.dockVai)));
    vaiA(sezioni[i]);
  }));
}

/* ---------- accordion-css-animation (dalla 12): uno aperto per volta, la CSS anima l'altezza ---------- */
function initAccordion() {
  document.querySelectorAll('[data-accordion-css-init]').forEach((acc) => {
    const imposta = (voce, apri) => {
      voce.setAttribute('data-accordion-status', apri ? 'active' : 'not-active');
      voce.querySelector('[data-accordion-toggle]').setAttribute('aria-expanded', String(apri));
    };
    acc.addEventListener('click', (e) => {
      const t = e.target.closest('[data-accordion-toggle]');
      if (!t) return;
      const voce = t.closest('[data-accordion-status]');
      const apri = voce.getAttribute('data-accordion-status') !== 'active';
      if (apri) acc.querySelectorAll('[data-accordion-status="active"]').forEach((v) => imposta(v, false));
      imposta(voce, apri);
    });
  });
}

/* ---------- queued-scroll-reveal (dalla 12): le materie compaiono una dopo l'altra ---------- */
function initCoda() {
  const gruppi = document.querySelectorAll('[data-queued-reveal-group]');
  if (!gruppi.length || !conGsap || !moto.ok()) return;
  const coda = [];
  let inCorso = false;
  const rivela = (el) => {
    gsap.to(el, { opacity: 1, duration: 0.5, ease: 'power1.out', clearProps: 'opacity' });
    gsap.to(el, { y: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform' });
  };
  const prossimo = () => {
    const el = coda.shift();
    if (!el) { inCorso = false; return; }
    rivela(el);
    gsap.delayedCall(0.06, prossimo);
  };
  gruppi.forEach((g) => g.querySelectorAll('[data-queued-reveal-item]').forEach((el) => {
    if (el.getBoundingClientRect().bottom <= 0) return;
    gsap.set(el, { opacity: 0, y: 24 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        coda.push(el);
        if (!inCorso) { inCorso = true; gsap.delayedCall(0.05, prossimo); }
      },
    });
  }));
  riduci.addEventListener('change', () => { if (riduci.matches) gsap.set('[data-queued-reveal-item]', { clearProps: 'opacity,transform' }); });
}

/* ---------- copy-email-to-clipboard-button ---------- */
function initCopyEmail() {
  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    const email = btn.getAttribute('data-copy-email');
    const testo = btn.querySelector('[data-copy-testo]');
    const stato = btn.querySelector('[data-copy-stato]');
    const iniziale = testo.textContent;
    const mostra = (t, annuncio) => { testo.textContent = t; btn.setAttribute('data-copiata', ''); stato.textContent = annuncio; };
    const fallisce = () => mostra(email, `Copia non riuscita, l'indirizzo è ${email}`);
    btn.addEventListener('click', () => {
      if (!navigator.clipboard) { fallisce(); return; }
      navigator.clipboard.writeText(email).then(() => mostra('Email copiata', `Email copiata: ${email}`)).catch(fallisce);
    });
    const reset = () => { testo.textContent = iniziale; btn.removeAttribute('data-copiata'); stato.textContent = ''; };
    btn.addEventListener('mouseleave', reset);
    btn.addEventListener('blur', reset);
  });
}

/* ---------- dynamic-current-time ---------- */
function initCurrentTime() {
  const els = document.querySelectorAll('[data-current-time]');
  if (!els.length) return;
  const aggiorna = () => els.forEach((el) => {
    const parti = new Intl.DateTimeFormat('it-IT', { timeZone: el.getAttribute('data-current-time'), hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const val = (t) => parti.find((p) => p.type === t)?.value;
    el.querySelector('[data-current-time-hours]').textContent = val('hour');
    el.querySelector('[data-current-time-minutes]').textContent = val('minute');
  });
  aggiorna();
  setInterval(aggiorna, 10000);
}

/* ---------- live-form-validation-basic (demo: nessun invio), come nella D ---------- */
function initFormValidation() {
  document.querySelectorAll('[data-form-validate]').forEach((form) => {
    const gruppi = form.querySelectorAll('[data-validate]');
    const esito = form.querySelector('[data-form-esito]');
    const campo = (g) => g.querySelector('input, textarea');
    const valido = (g) => {
      const input = campo(g);
      const v = input.value.trim();
      if (input.type === 'checkbox') return input.checked;
      if (input.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return v.length >= (parseInt(input.getAttribute('min'), 10) || 1);
    };
    const aggiorna = (g) => {
      const input = campo(g);
      const ok = valido(g);
      g.classList.toggle('is--error', !ok && input.__avviata);
      input.setAttribute('aria-invalid', String(!ok && !!input.__avviata));
    };
    gruppi.forEach((g) => {
      const input = campo(g);
      input.__avviata = false;
      input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
        if (!input.__avviata && valido(g)) input.__avviata = true;
        if (input.__avviata) aggiorna(g);
        esito.classList.remove('is--visibile');
      });
      input.addEventListener('blur', () => { if (input.type !== 'checkbox' && input.value.trim()) input.__avviata = true; aggiorna(g); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let primo = null;
      gruppi.forEach((g) => { campo(g).__avviata = true; aggiorna(g); if (!valido(g) && !primo) primo = campo(g); });
      if (primo) { primo.focus(); return; }
      esito.textContent = 'Questa è una demo: il modulo non invia.';
      esito.classList.add('is--visibile');
    });
  });
}

/* ---------- parallax-image-gallery-with-thumbnails (dalla 08): un socio per volta ---------- */
function initGalleria() {
  const el = document.querySelector('[data-slideshow="wrap"]');
  if (!el) return;
  const slides = [...el.querySelectorAll('[data-slideshow="slide"]')];
  const inner = [...el.querySelectorAll('[data-slideshow="parallax"]')];
  const thumbs = [...el.querySelectorAll('[data-slideshow="thumb"]')];
  const panels = [...el.querySelectorAll('[data-slideshow="panel"]')];
  let current = 0;
  let animating = false;
  const navigate = (direction, target) => {
    if (animating || target === current) return;
    const previous = current;
    current = target;
    thumbs.forEach((t, i) => { t.classList.toggle('is--current', i === current); t.setAttribute('aria-pressed', String(i === current)); });
    panels.forEach((p, i) => { p.hidden = i !== current; });
    if (!conGsap || !moto.ok()) {
      slides[previous].classList.remove('is--current');
      slides[current].classList.add('is--current');
      return;
    }
    animating = true;
    gsap.fromTo(panels[current], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power2.out', clearProps: 'all' });
    gsap.timeline({
      defaults: { duration: 0.9, ease: 'expo.inOut' },
      onStart: () => slides[current].classList.add('is--current'),
      onComplete: () => { slides[previous].classList.remove('is--current'); animating = false; },
    })
      .to(slides[previous], { xPercent: -direction * 100 }, 0)
      .to(inner[previous], { xPercent: direction * 50 }, 0)
      .fromTo(slides[current], { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(inner[current], { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
  };
  thumbs.forEach((t, i) => t.addEventListener('click', () => navigate(i > current ? 1 : -1, i)));
}

/* ---------- list-grid-toggle-flip (dalla 14): il team in griglia o in elenco ---------- */
function initListaGriglia() {
  document.querySelectorAll('[data-list-grid-init]').forEach((root) => {
    const toggles = [...root.querySelectorAll('[data-list-grid-toggle]')];
    const items = [...root.querySelectorAll('[data-list-grid-flip]')];
    let flip;
    toggles.forEach((t) => t.addEventListener('click', () => {
      const vista = t.getAttribute('data-list-grid-toggle');
      if (vista === root.getAttribute('data-list-grid-view')) return;
      const anima = conGsap && moto.ok();
      flip?.progress(1).kill();
      const parti = items.flatMap((it) => [it, ...it.querySelectorAll('.persona__foto, .persona__nome, .persona__ruolo')]);
      const stato = anima ? Flip.getState(parti) : null;
      root.setAttribute('data-list-grid-view', vista);
      toggles.forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      if (anima) flip = Flip.from(stato, { duration: 0.8, ease: 'expo.inOut', nested: true, absolute: false, stagger: 0.01 });
      ScrollTrigger?.refresh();
    }));
  });
}

/* ---------- basic-filter-setup: Tutti / Soci / Collaboratori / Staff ---------- */
function initFiltri() {
  const group = document.querySelector('[data-filter-group]');
  if (!group) return;
  const buttons = [...group.querySelectorAll('[data-filter-target]')];
  const galleria = document.querySelector('[data-filter-section="soci"]');
  const team = document.querySelector('[data-filter-section="team"]');
  const persone = [...team.querySelectorAll('[data-filter-name]')];
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    const c = btn.dataset.filterTarget;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    galleria.hidden = !(c === 'all' || c === 'soci');
    team.hidden = c === 'soci';
    persone.forEach((p) => p.toggleAttribute('data-filtrato', c !== 'all' && c !== 'soci' && p.dataset.filterName !== c));
    if (conGsap) ScrollTrigger.refresh();
  }));
}
