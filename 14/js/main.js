// Martone & Martone · opzione 14 «Capitoli che si impilano» (Azzurro polvere invertita), Versione 2
// Blocchi di osmo.supply adattati al progetto (licenza Osmo: uso nei progetti dei clienti, non ridistribuire).
// Originali in osmo/<slug>/. Con «riduci movimento» niente scrub, pin, Flip né smooth scroll: la pagina resta leggibile e statica.

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const conGsap = typeof window.gsap !== 'undefined';
const moto = { ok: () => !riduci.matches };
const pad = (n) => String(n).padStart(2, '0');
const durata = (nome) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(nome));

let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) {
    document.documentElement.classList.add('gsap');
    gsap.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase);
  }
  initLinkDemo();
  initLenis();
  initNav();
  initFlipFoto();
  initEvidenziatore();
  initPila();
  initOrizzontale();
  initServizi();
  initListaGriglia();
  initSelect();
  initFormValidation();
  initDock();
  initCollage();
  initProfilo();
  if (conGsap && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
});

function initLinkDemo() {
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
}

/* ---------- Lenis (impostazioni della F), raf dal ticker di GSAP ---------- */
function initLenis() {
  if (typeof window.Lenis === 'undefined') return;
  const aggiorna = () => {
    if (moto.ok() && !lenis) {
      lenis = new Lenis({
        autoRaf: !conGsap,
        duration: durata('--durata-scroll'),
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      if (conGsap) lenis.on('scroll', ScrollTrigger.update);
      if (document.documentElement.classList.contains('scroll-bloccato')) lenis.stop();
    } else if (!moto.ok() && lenis) {
      lenis.destroy();
      lenis = null;
    }
  };
  if (conGsap) {
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  aggiorna();
  riduci.addEventListener('change', aggiorna);

  // Ancore della stessa pagina: le porta Lenis (il salto nativo lo annullerebbe). Lo skip link resta nativo
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!lenis || !a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.matches('.salta')) return;
    if (a.pathname !== location.pathname || !a.hash) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: durata('--durata-ancora') });
    history.pushState(null, '', a.hash);
  });
}

// Tab che gira dentro un pannello aperto (menu, profilo): dall'ultimo elemento si torna al primo e viceversa
function giraFocus(e, box) {
  if (e.key !== 'Tab') return;
  const el = [...box.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((x) => !x.closest('[inert]') && x.getClientRects().length);
  if (!el.length) return;
  const primo = el[0], ultimo = el[el.length - 1];
  if (e.shiftKey && (document.activeElement === primo || !box.contains(document.activeElement))) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && (document.activeElement === ultimo || !box.contains(document.activeElement))) { e.preventDefault(); primo.focus(); }
}

function bloccaScroll(si) {
  document.documentElement.classList.toggle('scroll-bloccato', si);
  if (si) lenis?.stop(); else lenis?.start();
}

/* ---------- centered-scaling-navigation-bar: la pillola si allarga in card ---------- */
function initNav() {
  const nav = document.querySelector('[data-navigation-status]');
  if (!nav) return;
  const pillola = nav.querySelector('.nav__pillola');
  const toggle = nav.querySelector('[data-navigation-toggle="toggle"]');
  const pannello = nav.querySelector('.nav__pannello');
  const aperto = () => nav.getAttribute('data-navigation-status') === 'active';

  // Voci in cascata come l'originale (0.05 s l'una), solo in apertura
  nav.querySelectorAll('[data-navigation-item]').forEach((el, i) => el.style.setProperty('--ritardo', `${0.15 + i * 0.05}s`));

  // La larghezza chiusa si misura: serve un valore in px per animarla verso la card
  const misura = () => {
    if (aperto()) return;
    pillola.style.removeProperty('--nav-chiusa');
    pillola.style.setProperty('--nav-chiusa', `${pillola.offsetWidth}px`);
  };
  misura();
  document.fonts?.ready.then(misura);
  window.addEventListener('resize', misura);

  // Menu aperto: il resto della pagina diventa inert, così Tab e lettori di schermo restano nel menu
  const resto = [...document.body.children].filter((el) => el !== nav && !['SCRIPT', 'DIALOG'].includes(el.tagName) && !el.classList.contains('sprite'));
  const imposta = (si) => {
    nav.setAttribute('data-navigation-status', si ? 'active' : 'not-active');
    toggle.setAttribute('aria-expanded', String(si));
    pannello.inert = !si;
    resto.forEach((el) => { el.inert = si; });
    bloccaScroll(si);
  };
  toggle.addEventListener('click', () => imposta(!aperto()));
  nav.querySelectorAll('[data-navigation-toggle="close"], .nav__pannello a').forEach((el) => el.addEventListener('click', () => imposta(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aperto()) { imposta(false); toggle.focus(); }
    if (aperto()) giraFocus(e, nav);
  });
}

/* ---------- scaling-element-on-scroll-gsap-flip: la foto dell'hero cresce fino a tutta larghezza ---------- */
function initFlipFoto() {
  const wrappers = [...document.querySelectorAll('[data-flip-element="wrapper"]')];
  const target = document.querySelector('[data-flip-element="target"]');
  if (!conGsap || wrappers.length < 2 || !target) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const html = document.documentElement;
    const arrivo = wrappers[wrappers.length - 1];
    const raggio = () => getComputedStyle(arrivo.querySelector('img')).borderRadius;
    let tl;
    const costruisci = () => {
      tl?.scrollTrigger?.kill();
      tl?.kill();
      gsap.set(target, { clearProps: 'all' });
      tl = gsap.timeline({
        scrollTrigger: { trigger: wrappers[0], start: 'center center', endTrigger: arrivo, end: 'center center', scrub: 0.25 },
      });
      // scale: false = width/height veri, così il raggio resta tondo e si può animare
      tl.add(Flip.fit(target, arrivo, { duration: 1, ease: 'none', scale: false }), 0)
        .to(target, { borderRadius: raggio(), duration: 1, ease: 'none' }, 0);
    };
    html.classList.add('flip-attivo');
    costruisci();
    let timer;
    const alResize = () => { clearTimeout(timer); timer = setTimeout(() => { costruisci(); ScrollTrigger.refresh(); }, 150); };
    window.addEventListener('resize', alResize);
    return () => {
      window.removeEventListener('resize', alResize);
      tl?.scrollTrigger?.kill();
      tl?.kill();
      gsap.set(target, { clearProps: 'all' });
      html.classList.remove('flip-attivo');
    };
  });
}

/* ---------- highlight-marker-text-reveal: barre azzurre che si ritirano riga per riga ---------- */
function initEvidenziatore() {
  if (!conGsap) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const pulizie = [];
    const colore = getComputedStyle(document.documentElement).getPropertyValue('--colore-accento').trim();
    document.querySelectorAll('[data-highlight-marker-reveal]').forEach((el) => {
      let tl, st;
      const split = SplitText.create(el, {
        type: 'lines',
        linesClass: 'highlight-marker-line',
        autoSplit: true,
        onSplit(self) {
          tl?.kill();
          st?.kill();
          tl = gsap.timeline({ paused: true });
          self.lines.forEach((riga, i) => {
            riga.style.position = 'relative';
            const barra = document.createElement('span');
            barra.className = 'highlight-marker-bar';
            barra.style.backgroundColor = colore;
            barra.style.transformOrigin = 'right center';
            riga.appendChild(barra);
            tl.to(barra, { scaleX: 0, duration: 0.6, ease: 'power3.inOut' }, i * 0.1);
          });
          gsap.set(el, { autoAlpha: 1 });
          st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
        },
      });
      pulizie.push(() => { tl?.kill(); st?.kill(); split.revert(); gsap.set(el, { clearProps: 'visibility,opacity' }); });
    });
    return () => pulizie.forEach((fn) => fn());
  });
}

/* ---------- stacking-cards-parallax: ogni valore sale e copre il precedente, che si stringe ---------- */
// Adattato: la pila si blocca (pin) sotto il menu e le card salgono una alla volta fino al loro posto,
// lasciando visibile la testata di quelle sotto. Al posto di yPercent e rotate dell'originale le card sotto
// rientrano di --pila-rientro per lato a ogni card che arriva (niente rotazioni). Senza movimento: card in colonna.
function initPila() {
  const pila = document.querySelector('[data-stacking-cards]');
  if (!conGsap || !pila) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const cards = [...pila.querySelectorAll('[data-stacking-cards-item]')];
    const val = (nome) => parseFloat(getComputedStyle(pila).getPropertyValue(nome)) || 0;
    pila.classList.add('pila--animata');
    // Passo e altezza delle card li decide la CSS in base alla finestra: si leggono dal layout
    const passoPila = () => cards[1].offsetTop - cards[0].offsetTop;
    const passo = () => cards[0].offsetHeight - passoPila();
    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      scrollTrigger: {
        trigger: pila,
        start: () => `top ${val('--pila-alto')}px`,
        end: () => `+=${passo() * (cards.length - 1)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    cards.slice(1).forEach((card, k) => {
      const i = k + 1;
      // parte col bordo alto in fondo allo schermo
      tl.fromTo(card, { y: () => window.innerHeight - val('--pila-alto') - i * passoPila() }, { y: 0 }, k);
      cards.slice(0, i).forEach((sotto, j) => {
        tl.fromTo(sotto, { '--rientro': () => `${(i - 1 - j) * val('--pila-rientro')}px` }, { '--rientro': () => `${(i - j) * val('--pila-rientro')}px` }, k);
      });
    });
    return () => { tl.scrollTrigger.kill(); tl.kill(); gsap.set(cards, { clearProps: 'transform,--rientro' }); pila.classList.remove('pila--animata'); };
  });
}

/* ---------- horizontal-scrolling-sections + scroll-progress-bar: le aree scorrono di lato ---------- */
// Desktop e tablet: sezione bloccata, il nastro scorre con lo scroll verticale e la barra segna 01/03.
// Mobile e «riduci movimento»: scorrimento orizzontale nativo (col dito), la barra segue lo stesso.
function initOrizzontale() {
  const wrap = document.querySelector('[data-horizontal-scroll-wrap]');
  if (!wrap) return;
  const binario = wrap.querySelector('[data-binario]');
  const nastro = wrap.querySelector('[data-binario-nastro]');
  const conta = wrap.querySelector('[data-avanzamento-conta]');
  const pieno = wrap.querySelector('[data-avanzamento-pieno]');
  const n = nastro.children.length;
  const segna = (p) => {
    pieno.style.transform = `scaleX(${(1 + p * (n - 1)) / n})`;
    conta.textContent = pad(Math.round(p * (n - 1)) + 1);
  };
  binario.addEventListener('scroll', () => {
    const max = binario.scrollWidth - binario.clientWidth;
    if (max > 0) segna(binario.scrollLeft / max);
  }, { passive: true });
  if (!conGsap) return;
  gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    binario.classList.add('binario--bloccato');
    binario.scrollLeft = 0;
    const distanza = () => nastro.offsetWidth - binario.clientWidth;
    const tween = gsap.to(nastro, {
      x: () => -distanza(),
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        start: 'center center',
        end: () => `+=${distanza()}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => segna(self.progress),
      },
    });
    return () => { tween.scrollTrigger.kill(); tween.kill(); gsap.set(nastro, { clearProps: 'transform' }); binario.classList.remove('binario--bloccato'); segna(0); };
  });
}

/* ---------- sticky-features: la foto resta ferma e cambia col servizio ---------- */
function initServizi() {
  const w = document.querySelector('[data-sticky-feature-wrap]');
  if (!w) return;
  const foto = [...w.querySelectorAll('[data-sticky-feature-visual]')];
  const items = [...w.querySelectorAll('[data-sticky-feature-item]')];
  const etichetta = w.querySelector('[data-sticky-feature-label]');
  const nomi = items.map((li) => li.querySelector('.t-h3').textContent);
  const raggio = () => getComputedStyle(w.querySelector('.servizi__foto')).borderTopLeftRadius;
  let attuale = 0;

  const vai = (i, subito) => {
    if (i === attuale) return;
    items.forEach((li, k) => li.classList.toggle('is-attivo', k === i));
    etichetta.textContent = `${pad(i + 1)} / ${pad(items.length)} · ${nomi[i]}`;
    foto.forEach((img, k) => {
      if (k === 0) return;
      const da = k <= attuale, a = k <= i;
      if (da === a) return;
      const clipPath = `inset(${a ? 0 : 50}% round ${raggio()})`;
      if (subito || !conGsap) img.style.clipPath = clipPath;
      else gsap.to(img, { clipPath, duration: 0.75, ease: 'power4.inOut', overwrite: 'auto' });
    });
    attuale = i;
  };

  // Clic su un servizio: sempre disponibile (è l'unico modo con «riduci movimento»)
  items.forEach((li, k) => {
    li.tabIndex = 0;
    li.addEventListener('click', () => vai(k, !moto.ok()));
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vai(k, !moto.ok()); } });
  });

  if (!conGsap) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
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

/* ---------- list-grid-toggle-flip: materie in griglia o in elenco ---------- */
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
      const stato = anima ? Flip.getState(items, { props: 'backgroundColor,borderRadius,padding' }) : null;
      root.setAttribute('data-list-grid-view', vista);
      toggles.forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      if (!anima) return;
      flip = Flip.from(stato, { duration: 0.8, ease: 'expo.inOut', stagger: 0.01 });
      const nuovi = root.querySelectorAll(`[data-list-grid-fade="${vista}"]`);
      if (nuovi.length) gsap.fromTo(nuovi, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, delay: 0.55, stagger: { amount: 0.2 } });
    }));
  });
}

/* ---------- custom-select-single-multiple (qui solo singola): la select nativa resta la fonte dei dati ---------- */
function initSelect() {
  document.querySelectorAll('[data-select]').forEach((wrap, w) => {
    const select = wrap.querySelector('[data-select-input]');
    const toggle = wrap.querySelector('[data-select-toggle]');
    const testo = wrap.querySelector('[data-select-text]');
    const lista = wrap.querySelector('[data-select-list]');
    const modello = lista?.querySelector('[data-select-option]');
    if (!select || !toggle || !testo || !modello) return;
    const id = `${select.id || 'select'}-${w}`;
    const predefinito = testo.textContent;

    toggle.setAttribute('role', 'combobox');
    toggle.setAttribute('aria-haspopup', 'listbox');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', `${id}-lista`);
    lista.id = `${id}-lista`;
    lista.setAttribute('role', 'listbox');
    lista.replaceChildren();

    const opzioni = [...select.options].map((option, i) => {
      const el = modello.cloneNode(true);
      el.querySelector('[data-select-option-text]').textContent = option.text;
      el._option = option;
      el.id = `${id}-opzione-${i}`;
      el.setAttribute('role', 'option');
      if (option.hasAttribute('data-select-default')) el.setAttribute('data-select-default', '');
      lista.append(el);
      return el;
    }).filter((el) => !el.hasAttribute('data-select-default'));

    let attiva = -1;
    const aggiorna = () => {
      const scelta = select.selectedOptions[0];
      const vuota = !scelta || scelta.hasAttribute('data-select-default');
      toggle.toggleAttribute('data-default', vuota);
      testo.textContent = vuota ? predefinito : scelta.text;
      opzioni.forEach((el) => el.setAttribute('aria-selected', String(el._option.selected)));
    };
    const apri = () => toggle.setAttribute('aria-expanded', 'true');
    const chiudi = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.removeAttribute('aria-activedescendant');
      opzioni.forEach((el) => el.removeAttribute('data-active'));
      attiva = -1;
    };
    const evidenzia = (i) => {
      attiva = (i + opzioni.length) % opzioni.length;
      opzioni.forEach((el, k) => el.toggleAttribute('data-active', k === attiva));
      toggle.setAttribute('aria-activedescendant', opzioni[attiva].id);
    };
    const scegli = (el) => {
      select.value = el._option.value;
      aggiorna();
      select.dispatchEvent(new Event('change', { bubbles: true }));
      chiudi();
      toggle.focus();
    };

    opzioni.forEach((el) => el.addEventListener('click', () => scegli(el)));
    toggle.addEventListener('click', () => (toggle.getAttribute('aria-expanded') === 'true' ? chiudi() : apri()));
    toggle.addEventListener('keydown', (e) => {
      const aperta = toggle.getAttribute('aria-expanded') === 'true';
      const dir = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (dir) {
        e.preventDefault();
        if (!aperta) apri();
        evidenzia(attiva < 0 ? (dir > 0 ? 0 : opzioni.length - 1) : attiva + dir);
      }
      if ((e.key === 'Enter' || e.key === ' ') && aperta && attiva >= 0) { e.preventDefault(); scegli(opzioni[attiva]); }
      if (e.key === 'Escape' && aperta) { e.preventDefault(); e.stopPropagation(); chiudi(); }
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) chiudi(); });
    aggiorna();
  });
}

/* ---------- live-form-validation-basic (demo: nessun invio), come nella F ---------- */
function initFormValidation() {
  document.querySelectorAll('[data-form-validate]').forEach((form) => {
    const gruppi = form.querySelectorAll('[data-validate]');
    const esito = form.querySelector('[data-form-esito]');
    const campo = (g) => g.querySelector('input, textarea');

    function valido(g) {
      const input = campo(g);
      const v = input.value.trim();
      if (input.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const min = parseInt(input.getAttribute('min'), 10) || 1;
      return v.length >= min;
    }
    function aggiorna(g) {
      const input = campo(g);
      const ok = valido(g);
      g.classList.toggle('is--error', !ok && input.__avviata);
      input.setAttribute('aria-invalid', String(!ok && !!input.__avviata));
    }

    gruppi.forEach((g) => {
      const input = campo(g);
      input.__avviata = false;
      input.addEventListener('input', () => {
        if (!input.__avviata && valido(g)) input.__avviata = true;
        if (input.__avviata) aggiorna(g);
        esito.classList.remove('is--visibile');
      });
      input.addEventListener('blur', () => { if (input.value.trim()) input.__avviata = true; aggiorna(g); });
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

/* ---------- section-anchor-dock: pillola in basso con la sezione in vista ---------- */
// Adattato in versione «smooth» (niente overshoot né squash dell'originale): l'etichetta cambia con la sezione,
// la pillola si apre verso l'alto in un elenco (hover col mouse, tocco sul telefono).
function initDock() {
  const dock = document.querySelector('[data-section-dock]');
  if (!dock) return;
  const toggle = dock.querySelector('[data-section-dock-toggle]');
  const etichetta = dock.querySelector('[data-section-dock-label]');
  const lista = dock.querySelector('#dock-lista');
  const links = [...dock.querySelectorAll('[data-section-dock-link]')];
  const sezioni = links.map((a) => document.querySelector(a.hash));
  const conHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  const apri = (si) => {
    dock.toggleAttribute('data-aperto', si);
    toggle.setAttribute('aria-expanded', String(si));
    lista.inert = !si;
  };
  const attiva = (i) => {
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    etichetta.textContent = `${pad(i + 1)} · ${links[i].lastChild.textContent.trim()}`;
  };

  // Col mouse si apre già al passaggio: il clic non deve richiuderla
  toggle.addEventListener('click', () => apri(conHover.matches || !dock.hasAttribute('data-aperto')));
  dock.addEventListener('pointerenter', () => { if (conHover.matches) apri(true); });
  dock.addEventListener('pointerleave', () => { if (conHover.matches) apri(false); });
  dock.addEventListener('focusout', (e) => { if (!dock.contains(e.relatedTarget)) apri(false); });
  links.forEach((a) => a.addEventListener('click', () => apri(false)));
  document.addEventListener('click', (e) => { if (!dock.contains(e.target)) apri(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dock.hasAttribute('data-aperto')) { apri(false); toggle.focus(); } });

  // Sezione in vista e visibilità: IntersectionObserver su una linea al 45% dello schermo (come «top 45%» dell'originale)
  const visibili = new Set();
  const io = new IntersectionObserver((voci) => {
    voci.forEach((v) => (v.isIntersecting ? visibili.add(v.target) : visibili.delete(v.target)));
    const i = sezioni.findIndex((s) => visibili.has(s));
    dock.toggleAttribute('data-nascosto', i < 0);
    if (i < 0) apri(false); else attiva(i);
  }, { rootMargin: '-45% 0px -55% 0px' });
  sezioni.forEach((s) => s && io.observe(s));
}

/* ---------- collage-focus-card-on-hover: il socio sotto il mouse viene avanti ---------- */
// Adattato: oltre a scala e spinta laterale dell'originale, le card non attive si velano (opacità 0.45 del Figma).
// Si attiva anche passando sui nomi. Tocco: primo tocco mette a fuoco, secondo apre il profilo.
function initCollage() {
  const root = document.querySelector('[data-collage]');
  if (!root) return;
  const carte = [...root.querySelectorAll('[data-collage-carta]')];
  const voci = [...root.querySelectorAll('[data-collage-voce]')];
  const conHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (conGsap) CustomEase.create('move', '0.3, 0.075, 0, 1');
  let attiva = -1;

  const anima = (el, vars) => {
    if (conGsap && moto.ok()) gsap.to(el, { ...vars, duration: 0.8, ease: 'move', overwrite: true });
    else if (conGsap) gsap.set(el, vars);
  };
  const metti = (i) => {
    if (i === attiva) return;
    attiva = i;
    root.toggleAttribute('data-collage-attivo', i >= 0);
    carte.forEach((c, k) => {
      c.classList.toggle('is-attiva', k === i);
      const dentro = c.querySelector('.collage__dentro');
      if (i < 0) return anima(dentro, { xPercent: 0, yPercent: 0, scale: 1 });
      if (k === i) return anima(dentro, { xPercent: 0, yPercent: 0, scale: 1.075 });
      const d = Math.abs(k - i);
      anima(dentro, { xPercent: (k < i ? -1 : 1) * 8 / d, yPercent: 0, scale: 0.9 });
    });
    voci.forEach((v, k) => v.classList.toggle('is-attivo', k === i));
  };

  carte.forEach((c, k) => {
    c.addEventListener('pointerenter', () => { if (conHover.matches) metti(k); });
    c.addEventListener('focus', () => metti(k));
  });
  voci.forEach((v, k) => {
    v.addEventListener('pointerenter', () => { if (conHover.matches) metti(k); });
    v.addEventListener('focus', () => metti(k));
    v.addEventListener('click', () => apriProfilo?.(carte[k]));
  });
  root.addEventListener('pointerleave', () => { if (conHover.matches) metti(-1); });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) metti(-1); });
  // Sul tocco il primo tap mette a fuoco: il clic che apre il profilo arriva solo al secondo
  carte.forEach((c, k) => c.addEventListener('click', (e) => {
    if (!conHover.matches && attiva !== k) { e.stopImmediatePropagation(); metti(k); }
  }, true));
}

// Biografia e ambiti della persona (data-bio, data-aree); chi non li ha ancora tiene il segnaposto
function compilaBio(box, t) {
  const bio = box.querySelector('[data-profilo-bio]');
  const titolo = box.querySelector('[data-profilo-aree-titolo]');
  const aree = box.querySelector('[data-profilo-aree]');
  if (!bio || !titolo || !aree) return;
  box._bioSegnaposto ??= { bio: bio.textContent, titolo: titolo.textContent, aree: aree.innerHTML };
  const def = box._bioSegnaposto;
  bio.textContent = t.dataset.bio || def.bio;
  titolo.textContent = t.dataset.bio ? 'Aree di pratica' : def.titolo;
  aree.innerHTML = def.aree;
  if (!t.dataset.aree) return;
  const modello = aree.firstElementChild;
  aree.replaceChildren(...t.dataset.aree.split('|').map((x) => { const li = modello.cloneNode(); li.textContent = x; return li; }));
}

/* ---------- Profilo: si apre dal ritratto con GSAP Flip (riuso di scaling-element-on-scroll-gsap-flip) ---------- */
let apriProfilo = null;
function initProfilo() {
  const dialogo = document.querySelector('[data-profilo-dialogo]');
  if (!dialogo) return;
  const foto = dialogo.querySelector('[data-profilo-foto]');
  const campi = { nome: dialogo.querySelector('[data-profilo-nome]'), ruolo: dialogo.querySelector('[data-profilo-ruolo]'), tipo: dialogo.querySelector('[data-profilo-tipo]') };
  const testo = dialogo.querySelector('.scheda-profilo__testo');
  let origine = null;

  apriProfilo = (el) => {
    const img = el.querySelector('img');
    origine = el;
    campi.nome.textContent = el.dataset.nome;
    campi.ruolo.textContent = el.dataset.ruolo;
    campi.tipo.textContent = el.dataset.tipo;
    compilaBio(dialogo, el);
    foto.src = img.currentSrc || img.src;
    foto.alt = img.alt;
    const anima = conGsap && moto.ok();
    const stato = anima ? Flip.getState(img) : null;
    dialogo.showModal();
    bloccaScroll(true);
    if (!anima) return;
    // La foto parte dal rettangolo del ritratto cliccato e arriva al suo posto nella scheda
    Flip.fit(foto, stato, { scale: true });
    gsap.to(foto, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'expo.inOut', clearProps: 'transform' });
    gsap.fromTo(testo, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power3.out', clearProps: 'all' });
    gsap.fromTo(dialogo.querySelector('.scheda-profilo'), { backgroundColor: 'rgba(14, 27, 61, 0)' }, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--colore-fondo').trim(), duration: 0.4, ease: 'power2.out', clearProps: 'backgroundColor' });
  };

  document.querySelectorAll('[data-profilo]').forEach((el) => el.addEventListener('click', () => apriProfilo(el)));
  dialogo.querySelector('[data-profilo-chiudi]').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  dialogo.addEventListener('keydown', (e) => giraFocus(e, dialogo));
  dialogo.addEventListener('close', () => { bloccaScroll(false); origine?.focus({ preventScroll: true }); });
}
