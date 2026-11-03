// Martone & Martone · opzione 08 «Fascia panoramica», Versione 2
// Blocchi di osmo.supply adattati al progetto (licenza Osmo: uso nei progetti dei clienti, non ridistribuire).
// Originali e note in osmo/<slug>/.

const html = document.documentElement;
const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const conGsap = typeof window.gsap !== 'undefined';

// Pausa globale delle animazioni continue (WCAG 2.2.2): bottone «Ferma le animazioni» o «riduci movimento»
const moto = {
  fermo: false,
  ascolta: [],
  ok() { return !this.fermo && !riduci.matches; },
  avvisa() { this.ascolta.forEach((fn) => fn(this.ok())); },
};
riduci.addEventListener('change', () => moto.avvisa());

const durata = (nome) => parseFloat(getComputedStyle(html).getPropertyValue(nome));
const mobile = () => window.innerWidth < 992;
// spazio sotto la testata quando è in alto (pillola chiara)
const sottoTestata = () => (document.querySelector('[data-testata]')?.offsetHeight || 64) + (mobile() ? 8 : 16) + 16;
let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) {
    html.classList.add('gsap');
    gsap.registerPlugin(...[window.ScrollTrigger, window.CustomEase, window.Observer, window.Flip].filter(Boolean));
    if (window.CustomEase) {
      CustomEase.create('energy', 'M0,0 C0.32,0.72 0,1 1,1');           // fixed-underlay-navigation
      CustomEase.create('slideshow-wipe', '0.6, 0.08, 0.02, 0.99');      // parallax-image-gallery-with-thumbnails
      CustomEase.create('osmo-ease', '0.625, 0.05, 0, 1');               // centered-looping-slider
    }
  }
  initLinkDemo();
  initPalette();
  initFermaAnimazioni();
  initLenis();
  initTestata();
  initMenu();
  initParallax();
  initGalleria();
  initTimeline();
  initServizi();
  initMarquee();
  initCopyEmail();
  initFormValidation();
  initSlider();
  initProfilo();
  if (conGsap && window.ScrollTrigger && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
});

function initLinkDemo() {
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
}

/* ---------- Palette (solo demo): data-palette sull'html, ricordata fra le pagine ---------- */
function initPalette() {
  const bottoni = document.querySelectorAll('[data-palette-scegli]');
  const metti = (p) => {
    html.dataset.palette = p;
    bottoni.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.paletteScegli === p)));
    try { localStorage.setItem('m08-palette', p); } catch (e) { /* senza storage resta solo su questa pagina */ }
  };
  bottoni.forEach((b) => b.addEventListener('click', () => metti(b.dataset.paletteScegli)));
  metti(html.dataset.palette || '1');
}

function initFermaAnimazioni() {
  const btn = document.querySelector('[data-ferma-animazioni]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    moto.fermo = !moto.fermo;
    html.classList.toggle('animazioni-ferme', moto.fermo);
    btn.setAttribute('aria-pressed', String(moto.fermo));
    btn.textContent = moto.fermo ? 'Riprendi le animazioni' : 'Ferma le animazioni';
    moto.avvisa();
  });
}

/* ---------- lenis-smooth-scroll-setup (impostazioni della F) ---------- */
function initLenis() {
  if (typeof window.Lenis === 'undefined') return;
  const aggiorna = (ok) => {
    if (ok && !lenis) {
      lenis = new Lenis({
        autoRaf: !conGsap,
        duration: durata('--durata-scroll'),
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // esponenziale in uscita
      });
      if (conGsap && window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
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

  // Ancore della stessa pagina: le porta Lenis, sotto la testata (lo skip link resta nativo)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.matches('.salta')) return;
    if (a.pathname !== location.pathname || !a.hash) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    vaiA(target.id === 'studio' ? 0 : target.getBoundingClientRect().top + window.scrollY - sottoTestata());
    history.pushState(null, '', a.hash);
  });
}

function vaiA(y) {
  if (lenis) lenis.scrollTo(y, { duration: durata('--durata-ancora') });
  else window.scrollTo({ top: y, behavior: moto.ok() ? 'smooth' : 'auto' });
}

// Menu aperto e profilo: Tab e Shift+Tab girano dentro il pannello, senza passare dal resto della pagina o dal body
function giraFocus(e, pannello) {
  if (e.key !== 'Tab') return;
  const f = [...pannello.querySelectorAll('a[href], button, input, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => el.getClientRects().length);
  if (!f.length) return;
  const dentro = pannello.contains(document.activeElement);
  if (e.shiftKey && (!dentro || document.activeElement === f[0])) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && (!dentro || document.activeElement === f[f.length - 1])) { e.preventDefault(); f[0].focus(); }
}

// Menu aperto e profilo: pagina ferma (con Lenis attivo anche la rotella, se no basta overflow)
function bloccaScroll(si) {
  html.classList.toggle('scroll-bloccato', si);
  if (si) lenis?.stop(); else lenis?.start();
}

/* ---------- scroll-driven-header-styling ---------- */
// Il cambio vetro scuro → pillola chiara lo fa la CSS (animation-timeline). Qui solo la classe «in-cima»,
// che serve dove la CSS non ha la timeline (Firefox) e con «riduci movimento»: cambio netto, senza scorrimento.
function initTestata() {
  const testata = document.querySelector('[data-testata]');
  const fascia = document.querySelector('[data-fascia]');
  if (!testata || !fascia) { html.classList.remove('in-cima'); return; }
  let fine = 0;
  const aggiorna = () => html.classList.toggle('in-cima', window.scrollY < fine);
  const misura = () => {
    fine = fascia.getBoundingClientRect().bottom + window.scrollY - (parseFloat(getComputedStyle(testata).top) + testata.offsetHeight);
    aggiorna();
  };
  window.addEventListener('scroll', aggiorna, { passive: true });
  window.addEventListener('resize', misura);
  misura();
}

/* ---------- fixed-underlay-navigation ---------- */
// Come l'originale (curva «energy», stessa timeline in avanti e indietro), ma la pagina scivola in basso
// invece che di lato e resta visibile il suo bordo tondo: toccarlo richiude. Aggiunti inert, aria-expanded, focus che gira dentro ed Esc.
function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const apri = document.querySelector('[data-menu-apri]');
  const pagina = document.querySelector('[data-pagina]');
  const testata = document.querySelector('[data-testata]');
  if (!menu || !apri || !pagina) return;
  const chiudiBtn = menu.querySelector('[data-menu-chiudi]');
  const voci = menu.querySelectorAll('.menu__voce, .menu__contatti');
  // tutto il resto del body (pagina, testata, skip link, palette…) diventa inerte; il bordo della pagina resta cliccabile
  const fuori = [...document.body.children].filter((el) => el !== menu && !el.matches('.menu-bordo, .sprite, script'));
  let aperto = false;
  let tl = null;

  function apriMenu() {
    if (aperto) return;
    aperto = true;
    const y = window.scrollY;
    const bordo = mobile() ? 8 : 24;
    const raggio = mobile() ? 32 : 40;
    bloccaScroll(true);
    html.classList.add('menu-aperto');
    apri.setAttribute('aria-expanded', 'true');
    menu.classList.add('is--visibile');
    menu.inert = false;
    fuori.forEach((el) => { el.inert = true; });
    tl?.kill();
    if (conGsap) {
      const d = moto.ok() ? 1 : 0;
      tl = gsap.timeline({ defaults: { ease: 'energy', duration: 0.8 * d } })
        .fromTo(pagina, { clipPath: `inset(${y}px 0px 0px 0px round 0px 0px 0px 0px)`, y: 0 },
          { clipPath: `inset(${y}px ${bordo}px 0px ${bordo}px round ${raggio}px ${raggio}px 0px 0px)`, y: durata('--menu-h') }, 0)
        .to(testata, { y: durata('--menu-h') }, 0)
        .fromTo(voci, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6 * d, stagger: 0.05 * d }, 0.1 * d);
    }
    chiudiBtn?.focus();
  }

  function chiudiMenu(poi) {
    if (!aperto) return;
    aperto = false;
    apri.setAttribute('aria-expanded', 'false');
    const fine = () => {
      gsap?.set([pagina, testata], { clearProps: 'transform,clipPath' });
      menu.classList.remove('is--visibile');
      menu.inert = true;
      fuori.forEach((el) => { el.inert = false; });
      html.classList.remove('menu-aperto');
      bloccaScroll(false);
      if (typeof poi === 'function') poi(); else apri.focus();
    };
    if (conGsap && tl) {
      const d = moto.ok() ? 1 : 0;
      tl.kill();
      tl = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: 0.6 * d }, onComplete: fine })
        .to(voci, { autoAlpha: 0, duration: 0.25 * d }, 0)
        .to([pagina, testata], { y: 0 }, 0)
        .to(pagina, { clipPath: pagina.style.clipPath.replace(/inset\(([^ ]+) [^)]*\)/, 'inset($1 0px 0px 0px round 0px 0px 0px 0px)') }, 0);
    } else fine();
  }

  apri.addEventListener('click', apriMenu);
  document.querySelectorAll('[data-menu-chiudi]').forEach((b) => b.addEventListener('click', () => chiudiMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aperto) chiudiMenu(); });
  menu.addEventListener('keydown', (e) => giraFocus(e, menu));

  // voci verso un'ancora della stessa pagina: prima si richiude, poi si scorre
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.pathname !== location.pathname) return;
    const target = a.hash && document.getElementById(a.hash.slice(1));
    e.preventDefault();
    chiudiMenu(() => {
      vaiA(target ? target.getBoundingClientRect().top + window.scrollY - sottoTestata() : 0);
      (target || apri).focus?.({ preventScroll: true });
    });
  });
  menu.querySelectorAll('a[href="./"], a[href="soci.html"]').forEach((a) => {
    if (a.getAttribute('aria-current') === 'page') a.addEventListener('click', (e) => { e.preventDefault(); chiudiMenu(() => vaiA(0)); });
  });
}

/* ---------- global-parallax-setup ---------- */
// Solo sulle fasce foto, mai sul testo: 80 px in tutto (da +40 a -40).
function initParallax() {
  if (!conGsap || !window.ScrollTrigger) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
      const target = trigger.querySelector('[data-parallax="target"]') || trigger;
      gsap.fromTo(target, { y: 40 }, {
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger, start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: true },
      });
    });
  });
}

/* ---------- parallax-image-gallery-with-thumbnails ---------- */
// Logica dell'originale (slide e foto interna in direzioni opposte, curva «slideshow-wipe», Observer per il trascinamento).
// In più: cambia da sola ogni 7 s (ferma sopra col mouse, col focus dentro, fuori schermo e con «riduci movimento»),
// pannello del testo che segue la foto, miniature come bottoni con aria-pressed.
function initGalleria() {
  const el = document.querySelector('[data-slideshow="wrap"]');
  if (!el) return;
  const slides = [...el.querySelectorAll('[data-slideshow="slide"]')];
  const inner = [...el.querySelectorAll('[data-slideshow="parallax"]')];
  const thumbs = [...el.querySelectorAll('[data-slideshow="thumb"]')];
  const panels = [...el.querySelectorAll('[data-slideshow="panel"]')];
  const fascia = el.querySelector('[data-slideshow="fascia"]');
  const n = slides.length;
  let current = 0;
  let animating = false;
  let timer = null;
  let inVista = false;
  let sopra = false;

  function programma() {
    clearTimeout(timer);
    if (moto.ok() && inVista && !sopra) timer = setTimeout(() => navigate(1), 7000);
  }

  function navigate(direction, targetIndex = null) {
    if (animating) return;
    const previous = current;
    current = targetIndex ?? (current + direction + n) % n;
    if (current === previous) return;

    thumbs.forEach((t, i) => { t.classList.toggle('is--current', i === current); t.setAttribute('aria-pressed', String(i === current)); });
    panels.forEach((p, i) => { p.hidden = i !== current; });

    if (!conGsap || !moto.ok()) {
      slides[previous].classList.remove('is--current');
      slides[current].classList.add('is--current');
      if (conGsap) gsap.set([slides[current], inner[current]], { xPercent: 0 });
      programma();
      return;
    }
    animating = true;
    gsap.fromTo(panels[current], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power2.out', clearProps: 'all' });
    gsap.timeline({
      defaults: { duration: 0.9, ease: 'slideshow-wipe' },
      onStart: () => slides[current].classList.add('is--current'),
      onComplete: () => { slides[previous].classList.remove('is--current'); animating = false; },
    })
      .to(slides[previous], { xPercent: -direction * 100 }, 0)
      .to(inner[previous], { xPercent: direction * 50 }, 0)
      .fromTo(slides[current], { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(inner[current], { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
    programma();
  }

  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => {
    if (i !== current) navigate(i > current ? 1 : -1, i);
  }));
  el.querySelectorAll('[data-slideshow="next"]').forEach((b) => b.addEventListener('click', () => {
    navigate(1);
    panels[current].querySelector('[data-slideshow="next"]')?.focus({ preventScroll: true });
  }));

  if (conGsap && window.Observer) {
    Observer.create({
      target: fascia,
      type: 'touch,pointer',
      onLeft: () => navigate(1),
      onRight: () => navigate(-1),
      tolerance: 24,
      lockAxis: true,
    });
  }

  el.addEventListener('pointerenter', () => { sopra = true; programma(); });
  el.addEventListener('pointerleave', () => { sopra = false; programma(); });
  el.addEventListener('focusin', () => { sopra = true; programma(); });
  el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) { sopra = false; programma(); } });
  new IntersectionObserver(([entry]) => { inVista = entry.isIntersecting; programma(); }, { threshold: 0.4 }).observe(el);
  moto.ascolta.push(programma);
}

/* ---------- step-by-step-timeline ---------- */
// Come l'originale: binario misurato dal primo all'ultimo pallino, riempimento con scrub fra «top 50%» e «bottom 50%».
// Gli stati non attivi restano leggibili (AA): cambiano solo il pallino e il colore del titolo.
function initTimeline() {
  const root = document.querySelector('[data-step-timeline-init]');
  if (!root) return;
  const line = root.querySelector('[data-step-timeline-line]');
  const fill = root.querySelector('[data-step-timeline-fill]');
  const items = [...root.querySelectorAll('[data-step-timeline-item]')];
  const anchors = items.map((item) => item.querySelector('[data-step-timeline-marker]') || item);
  const lastIndex = items.length - 1;
  let fractions = [0];

  function measureLine() {
    const base = root.getBoundingClientRect().top;
    const centers = anchors.map((a) => { const b = a.getBoundingClientRect(); return b.top + b.height / 2 - base; });
    const span = centers[lastIndex] - centers[0];
    line.style.top = centers[0] + 'px';
    line.style.height = span + 'px';
    fractions = centers.map((c) => (span > 0 ? (c - centers[0]) / span : 0));
  }

  let currentIndex = -2;
  function setCurrentIndex(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    items.forEach((item, i) => {
      item.setAttribute('data-status', index >= 0 && i <= index ? 'active' : 'inactive');
      item.toggleAttribute('data-current', i === index);
    });
  }
  const indexFor = (reached, progress) => {
    if (!reached) return -1;
    let index = 0;
    fractions.forEach((f, i) => { if (progress + 0.0001 >= f) index = i; });
    return index;
  };
  const update = (self) => setCurrentIndex(indexFor(self.isActive || self.progress >= 1, self.progress));

  measureLine();
  window.addEventListener('resize', measureLine);
  if (!conGsap || !window.ScrollTrigger) return;
  ScrollTrigger.addEventListener('refreshInit', measureLine);

  gsap.matchMedia()
    .add('(prefers-reduced-motion: no-preference)', () => {
      setCurrentIndex(-1);
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: line, start: 'top 50%', end: 'bottom 50%', scrub: true, onUpdate: update, onToggle: update, onRefresh: update },
      });
    })
    .add('(prefers-reduced-motion: reduce)', () => {
      setCurrentIndex(lastIndex);
      gsap.set(fill, { scaleY: 1 });
    });
}

/* ---------- sticky-section-tabs-css ---------- */
// Le linguette impilate sono solo CSS (position: sticky con top crescente). Qui solo il clic su una linguetta:
// porta il servizio nella sua posizione da fermo, con le linguette precedenti sopra.
function initServizi() {
  const lista = document.querySelector('[data-servizi]');
  if (!lista) return;
  const servizi = [...lista.children];
  lista.addEventListener('click', (e) => {
    const a = e.target.closest('.servizio__linguetta');
    if (!a) return;
    e.preventDefault();
    const li = a.closest('.servizio');
    const i = servizi.indexOf(li);
    const gap = parseFloat(getComputedStyle(lista).rowGap) || 0;
    const prima = servizi.slice(0, i).reduce((somma, s) => somma + s.offsetHeight + gap, 0);
    const listaTop = lista.getBoundingClientRect().top + window.scrollY;
    vaiA(listaTop + prima - parseFloat(getComputedStyle(li).top));
    history.replaceState(null, '', a.hash);
  });
}

/* ---------- css-marquee ---------- */
// Lista duplicata e pausa fuori schermo come l'originale; un giro ogni 60 s (in CSS), ferma al passaggio del mouse.
// Con «riduci movimento» il nastro è fermo e le pillole vanno a capo, così si leggono tutte.
function initMarquee() {
  const nastri = document.querySelectorAll('[data-css-marquee]');
  if (!nastri.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle('is--fuori', !en.isIntersecting)));
  nastri.forEach((nastro) => {
    nastro.querySelectorAll('[data-css-marquee-list]').forEach((lista) => {
      const copia = lista.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      nastro.appendChild(copia);
    });
    io.observe(nastro);
  });
}

/* ---------- copy-email-to-clipboard-button ---------- */
function initCopyEmail() {
  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    const email = btn.getAttribute('data-copy-email');
    const stato = btn.parentElement.querySelector('[data-copy-stato]');
    const icona = btn.querySelector('[data-copia-icona]');
    let timer;
    const reset = () => {
      btn.removeAttribute('data-copy-button');
      icona?.setAttribute('href', '#i-copia');
    };
    // se gli appunti non sono disponibili si annuncia l'indirizzo, che resta comunque scritto accanto
    const fallisce = () => { if (stato) stato.textContent = `Copia non riuscita, l'indirizzo è ${email}`; };
    btn.addEventListener('click', () => {
      if (!navigator.clipboard) { fallisce(); return; }
      navigator.clipboard.writeText(email).then(() => {
        btn.setAttribute('data-copy-button', 'copied');
        icona?.setAttribute('href', '#i-spunta');
        if (stato) stato.textContent = `Email copiata: ${email}`;
        clearTimeout(timer);
        timer = setTimeout(reset, 2400);
      }).catch(fallisce);
    });
    btn.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(reset, 900); });
  });
}

/* ---------- live-form-validation-basic (demo: nessun invio) ---------- */
function initFormValidation() {
  document.querySelectorAll('[data-form-validate]').forEach((form) => {
    const gruppi = form.querySelectorAll('[data-validate]');
    const esito = form.querySelector('[data-form-esito]');
    const campo = (g) => g.querySelector('input, textarea');

    function valido(g) {
      const input = campo(g);
      if (input.type === 'checkbox') return input.checked;
      const v = input.value.trim();
      if (input.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const min = parseInt(input.getAttribute('min'), 10) || 1;
      return v.length >= min;
    }
    function aggiorna(g) {
      const input = campo(g);
      const ok = valido(g);
      g.classList.toggle('is--success', ok);
      g.classList.toggle('is--error', !ok && input.__avviata);
      input.setAttribute('aria-invalid', String(!ok && !!input.__avviata));
    }

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
      gruppi.forEach((g) => {
        campo(g).__avviata = true;
        aggiorna(g);
        if (!valido(g) && !primo) primo = campo(g);
      });
      if (primo) { primo.focus(); return; }
      esito.textContent = 'Questa è una demo: il modulo non invia.';
      esito.classList.add('is--visibile');
    });
  });
}

/* ---------- centered-looping-slider (pagina soci) ---------- */
// Semplificato rispetto all'originale: 3 soci, quindi niente horizontalLoop/Draggable/Inertia.
// Tre posti (sinistra, centro, destra) in una griglia CSS; il cambio lo anima Flip con la curva «osmo-ease»,
// la carta che fa il giro rientra dall'altro lato in dissolvenza. Frecce, punti, clic sui lati e trascinamento (Observer).
function initSlider() {
  const root = document.querySelector('[data-slider]');
  if (!root) return;
  const carte = [...root.querySelectorAll('[data-socio]')];
  const punti = [...document.querySelectorAll('[data-slider-punto]')];
  const num = document.querySelector('[data-slider-num]');
  const stato = root.querySelector('[data-slider-stato]');
  const palco = root.querySelector('[data-slider-palco]');
  const n = carte.length;
  let corrente = carte.findIndex((c) => c.dataset.pos === 'centro');
  let animando = false;

  const posDi = (i, c) => (i === c ? 'centro' : i === (c - 1 + n) % n ? 'sx' : 'dx');

  function vai(nuovo, dir) {
    nuovo = (nuovo + n) % n;
    if (animando || nuovo === corrente) return;
    const animare = conGsap && window.Flip && moto.ok();
    const foto = carte.map((c) => c.querySelector('.socio__foto'));
    const statoFlip = animare ? Flip.getState([...carte, ...foto]) : null;
    const prima = carte.map((c) => c.dataset.pos);
    corrente = nuovo;
    carte.forEach((c, i) => {
      c.dataset.pos = posDi(i, corrente);
      c.setAttribute('aria-hidden', String(i !== corrente));
    });
    punti.forEach((p, i) => p.setAttribute('aria-current', String(i === corrente)));
    if (num) num.textContent = String(corrente + 1).padStart(2, '0');
    if (stato) stato.textContent = `${carte[corrente].querySelector('.socio__nome').textContent}, socio ${corrente + 1} di ${n}`;
    if (!animare) return;

    // la carta che passa da un lato all'altro non attraversa la scena: esce e rientra in dissolvenza
    const salto = carte.find((c, i) => (prima[i] === 'sx' && c.dataset.pos === 'dx') || (prima[i] === 'dx' && c.dataset.pos === 'sx'));
    animando = true;
    Flip.from(statoFlip, {
      targets: [...carte, ...foto].filter((el) => !salto || !salto.contains(el)),
      duration: 0.8,
      ease: 'osmo-ease',
      nested: true,
      scale: false,
      onComplete: () => { animando = false; },
    });
    if (salto) gsap.fromTo(salto, { autoAlpha: 0, x: dir * 80 }, { autoAlpha: 1, x: 0, duration: 0.6, delay: 0.2, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
    gsap.fromTo(carte[corrente].querySelector('.socio__profilo'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.35, ease: 'power2.out', clearProps: 'all' });
  }

  document.querySelector('[data-slider-prev]')?.addEventListener('click', () => vai(corrente - 1, -1));
  document.querySelector('[data-slider-next]')?.addEventListener('click', () => vai(corrente + 1, 1));
  punti.forEach((p, i) => p.addEventListener('click', () => vai(i, i > corrente ? 1 : -1)));
  carte.forEach((c) => c.addEventListener('click', () => {
    if (c.dataset.pos === 'sx') vai(corrente - 1, -1);
    if (c.dataset.pos === 'dx') vai(corrente + 1, 1);
  }));
  if (conGsap && window.Observer) {
    Observer.create({ target: palco, type: 'touch,pointer', onLeft: () => vai(corrente + 1, 1), onRight: () => vai(corrente - 1, -1), tolerance: 40, lockAxis: true });
  }
}

/* ---------- Profilo del team (pagina soci) ---------- */
// <dialog> nativo: focus dentro, Esc e sfondo inerte li dà il browser. Si chiude anche cliccando fuori dalla scheda.
function initProfilo() {
  const dialog = document.querySelector('[data-modal]');
  if (!dialog) return;
  const nome = dialog.querySelector('[data-profilo-nome]');
  const ruolo = dialog.querySelector('[data-profilo-ruolo]');
  const gruppo = dialog.querySelector('[data-profilo-gruppo]');
  const foto = dialog.querySelector('[data-profilo-foto]');
  let ultimo = null;

  document.querySelectorAll('[data-profilo]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      ultimo = trigger;
      nome.textContent = trigger.dataset.nome;
      ruolo.textContent = trigger.dataset.ruolo;
      gruppo.textContent = trigger.dataset.gruppo;
      foto.src = trigger.dataset.foto;
      dialog.showModal();
      bloccaScroll(true);
    });
  });
  dialog.querySelectorAll('[data-modal-chiudi]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => giraFocus(e, dialog));
  dialog.addEventListener('close', () => { bloccaScroll(false); ultimo?.focus(); });
}
