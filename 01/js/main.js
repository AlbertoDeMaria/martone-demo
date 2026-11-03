// Martone & Martone · opzione 01 «Notte e ghiaccio», versione 2 (3 nov 2026)
// Blocchi di osmo.supply adattati al progetto (licenza Osmo: uso nei progetti dei clienti, non ridistribuire).
// Base comune con la demo F: pausa delle animazioni, Lenis, odometro, pillole, schede, copia email, modulo.

const html = document.documentElement;
const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 992px)');
const conGsap = typeof window.gsap !== 'undefined';

// Pausa globale (WCAG 2.2.2): bottone «Ferma le animazioni» o «riduci movimento»
const moto = {
  fermo: false,
  ascolta: [],
  ok() { return !this.fermo && !riduci.matches; },
  avvisa() { this.ascolta.forEach((fn) => fn(this.ok())); },
};
riduci.addEventListener('change', () => moto.avvisa());

let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) gsap.registerPlugin(ScrollTrigger, ...[window.Flip, window.SplitText].filter(Boolean));
  initLinkDemo();
  initFermaAnimazioni();
  initLenis();
  initNav();
  initBgZoom();
  initNumberOdometer();
  initFeaturePills();
  initStickySteps();
  initTabs();
  initFiltro();
  initCopyEmail();
  initFormValidation();
  initFitText();
  initRicerca();
  initRivela();
  if (conGsap) {
    ScrollTrigger.refresh();
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
});

function initLinkDemo() {
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
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

/* ---------- lenis-smooth-scroll-setup + lenis-scroll-to-anchor-target (impostazioni della F) ---------- */
const durata = (nome) => parseFloat(getComputedStyle(html).getPropertyValue(nome));

function initLenis() {
  if (typeof window.Lenis === 'undefined') return;
  const aggiorna = (ok) => {
    if (ok && !lenis) {
      lenis = new Lenis({
        autoRaf: !conGsap,
        duration: durata('--durata-scroll'),
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
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

  // Ancore della stessa pagina: le porta Lenis. Lo skip link resta nativo (sposta il focus)
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

function bloccaScroll(si) {
  html.classList.toggle('scroll-bloccato', si);
  if (si) lenis?.stop(); else lenis?.start();
}

/* ---------- two-step-scaling-navigation ---------- */
// Pillola larga in cima; dopo una schermata diventa stretta (logo + «Menu»), al clic si allarga nella card.
function initNav() {
  const nav = document.querySelector('[data-twostep-nav]');
  if (!nav) return;
  const toggle = nav.querySelector('[data-nav-toggle="toggle"]');
  const testo = nav.querySelector('[data-nav-toggle-testo]');
  const pannello = nav.querySelector('.nav__bottom');
  const aperto = () => nav.getAttribute('data-nav-status') === 'active';
  pannello.inert = true;

  // con il menu aperto il resto della pagina è inerte: il Tab resta nel menu
  const fuori = [...document.body.children].filter((el) => el !== nav && !el.matches('svg.sprite'));
  const imposta = (apri, rendiFocus, daTastiera) => {
    nav.setAttribute('data-nav-status', apri ? 'active' : 'not-active');
    toggle.setAttribute('aria-expanded', String(apri));
    testo.textContent = apri ? 'Chiudi' : 'Menu';
    pannello.inert = !apri;
    fuori.forEach((el) => { el.inert = apri; });
    bloccaScroll(apri);
    // il focus entra nel pannello solo se si è aperto da tastiera (col mouse l'anello sulla prima voce disturba)
    if (apri && daTastiera) nav.querySelector('.nav__grandi a')?.focus({ preventScroll: true });
    else if (rendiFocus) toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', (e) => imposta(!aperto(), true, e.detail === 0));
  nav.querySelector('[data-nav-toggle="close"]').addEventListener('click', () => imposta(false, true));
  nav.querySelectorAll('.nav__corpo a').forEach((el) => el.addEventListener('click', () => imposta(false, false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aperto()) imposta(false, true);
  });

  let frame = null;
  const stretta = () => {
    frame = null;
    const si = window.scrollY > window.innerHeight * 0.9;
    if ((nav.getAttribute('data-nav-stretta') === 'true') !== si) nav.setAttribute('data-nav-stretta', String(si));
  };
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(stretta); }, { passive: true });
  stretta();
}

/* ---------- image-to-background-zoom + highlight-text-on-scroll ---------- */
// Come l'originale Osmo (Flip.fit da start a end, scrub lineare), ma con il pannello fermo (sticky):
// la foto incassata si allarga fino a riempire il pannello notte, il titolo sfuma, compare il metodo e si accende parola per parola.
function initBgZoom() {
  const root = document.querySelector('[data-bg-zoom-init]');
  if (!root) return;
  const endEl = root.querySelector('[data-bg-zoom-end]');
  const content = root.querySelector('[data-bg-zoom-content]');
  const didascalia = root.querySelector('[data-bg-zoom-didascalia]');
  const heroTesto = root.querySelector('[data-hero-testo]');
  const metodo = root.querySelector('[data-bg-zoom-metodo]');
  const velo = root.querySelector('[data-bg-zoom-dark]');
  const metodoTesto = root.querySelector('[data-metodo-testo]');
  const manifesto = root.querySelector('[data-highlight-text]');
  const pronto = conGsap && window.Flip && window.SplitText;
  let tl = null;
  let split = null;

  const pulisci = () => {
    if (tl) { tl.scrollTrigger?.kill(); tl.kill(); tl = null; }
    gsap.set([content, didascalia, heroTesto, velo, metodoTesto], { clearProps: 'all' });
  };

  const costruisci = () => {
    if (!pronto) return;
    pulisci();
    if (!moto.ok()) {
      html.classList.remove('zoom');
      split?.revert();
      split = null;
      ScrollTrigger.refresh();
      return;
    }
    html.classList.add('zoom');
    if (!split) split = SplitText.create(manifesto, { type: 'words' });
    const raggioFine = getComputedStyle(endEl).borderRadius;
    const parole = split.words;
    const fineZoom = 0.38;
    const inizioParole = 0.48;
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onToggle: (self) => metodo.classList.toggle('is--attivo', self.progress > inizioParole),
      },
    });
    tl.add(Flip.fit(content, endEl, { duration: fineZoom, ease: 'none', scale: false }), 0)
      .to(content, { borderRadius: raggioFine, duration: fineZoom }, 0)
      .to(didascalia, { autoAlpha: 0, duration: 0.06 }, 0)
      .to(heroTesto, { autoAlpha: 0, duration: 0.22 }, 0)
      .to(velo, { opacity: 1, duration: inizioParole - fineZoom }, fineZoom)
      .fromTo(metodoTesto, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: inizioParole - fineZoom }, fineZoom)
      .fromTo(parole, { opacity: 0.32 }, { opacity: 1, duration: 0.05, stagger: (1 - inizioParole - 0.05) / Math.max(1, parole.length - 1) }, inizioParole);
    ScrollTrigger.refresh();
  };

  if (!pronto) return;
  costruisci();
  moto.ascolta.push(costruisci);
  let t;
  let larghezza = window.innerWidth;
  window.addEventListener('resize', () => {
    // sul telefono la barra degli indirizzi cambia solo l'altezza: si ricostruisce solo se cambia la larghezza
    if (window.innerWidth === larghezza) return;
    larghezza = window.innerWidth;
    clearTimeout(t);
    t = setTimeout(costruisci, 150);
  });
}

/* ---------- number-odometer (dalla F: ogni cifra è un elemento, una volta sola) ---------- */
function initNumberOdometer() {
  if (!conGsap || !moto.ok()) return;
  const d = { duration: 1.2, ease: 'power3.out', elementStagger: 0.1, digitCycles: 2, triggerStart: 'top 85%' };
  document.querySelectorAll('[data-odometer-group]').forEach((group) => {
    const data = Array.from(group.querySelectorAll('[data-odometer-element]')).map((el) => {
      const testo = el.textContent.trim();
      const fine = parseInt(testo, 10);
      el.replaceChildren();
      const mask = document.createElement('span');
      mask.setAttribute('data-odometer-part', 'mask');
      mask.style.height = '1em';
      mask.style.lineHeight = '1';
      const roller = document.createElement('span');
      roller.setAttribute('data-odometer-part', 'roller');
      roller.style.lineHeight = '1';
      roller.textContent = Array.from({ length: 10 * d.digitCycles }, (_, i) => i % 10).join('\n');
      mask.appendChild(roller);
      el.appendChild(mask);
      return { el, testo, roller, target: fine > 0 ? fine : 10 };
    });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: group, start: d.triggerStart, once: true },
      onComplete() { data.forEach(({ el, testo }) => { el.textContent = testo; }); },
    });
    data.forEach(({ roller, target }, i) => {
      tl.to(roller, { y: -target + 'em', duration: d.duration, ease: d.ease, force3D: true }, i * d.elementStagger);
    });
  });
}

/* ---------- expanding-feature-pills (dalla F) ---------- */
// Pillola chiusa a misura del testo; aperta diventa una card notte larga quanto la colonna. Le altre restano chiuse.
function initFeaturePills() {
  document.querySelectorAll('[data-feature-pills-init]').forEach((wrap, w) => {
    const items = Array.from(wrap.querySelectorAll('[data-feature-pills-item]'));
    const larghezzaChiusa = new Map();
    const attivo = () => items.findIndex((it) => it.getAttribute('data-active') === 'true');
    const altezzaBottone = (item) => Math.ceil(item.querySelector('[data-feature-pills-button]').getBoundingClientRect().height);
    const altezzaInner = (item) => Math.ceil(item.querySelector('[data-feature-pills-inner]').getBoundingClientRect().height);
    const misuraChiuse = () => items.forEach((item) => {
      const prev = item.style.width;
      item.style.width = '';
      larghezzaChiusa.set(item, Math.ceil(item.getBoundingClientRect().width));
      item.style.width = prev;
    });
    const anima = (el, vars, istante) => {
      if (!conGsap) { el.style.width = typeof vars.width === 'number' ? vars.width + 'px' : vars.width; el.style.height = vars.height + 'px'; return; }
      gsap.killTweensOf(el);
      if (istante || !moto.ok()) gsap.set(el, vars);
      else gsap.to(el, { ...vars, duration: 0.6, ease: 'expo.out', overwrite: true });
    };
    const setA11y = (item, open) => {
      item.querySelector('[data-feature-pills-button]').setAttribute('aria-expanded', String(open));
      item.querySelector('[data-feature-pills-content]').inert = !open;
    };
    const apri = (item, istante) => {
      item.setAttribute('data-active', 'true');
      setA11y(item, true);
      // misura dell'interno alla larghezza piena, prima dell'animazione
      const prev = item.style.width;
      item.style.width = '100%';
      const h = Math.max(altezzaBottone(item), altezzaInner(item));
      item.style.width = prev;
      anima(item, { height: h, width: '100%' }, istante);
    };
    const chiudi = (item) => {
      item.setAttribute('data-active', 'false');
      setA11y(item, false);
      anima(item, { height: altezzaBottone(item), width: larghezzaChiusa.get(item) });
    };
    const vaiA = (i) => {
      const cur = attivo();
      if (cur === i) return;
      if (cur > -1) chiudi(items[cur]);
      apri(items[i]);
      items[i].querySelector('[data-feature-pills-close]').focus({ preventScroll: true });
    };
    const chiudiTutto = () => {
      const cur = attivo();
      if (cur === -1) return;
      chiudi(items[cur]);
      items[cur].querySelector('[data-feature-pills-button]').focus({ preventScroll: true });
    };

    items.forEach((item, i) => {
      const btn = item.querySelector('[data-feature-pills-button]');
      const content = item.querySelector('[data-feature-pills-content]');
      btn.id = `valori-${w}-voce-${i}`;
      content.id = `valori-${w}-pannello-${i}`;
      btn.setAttribute('aria-controls', content.id);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', btn.id);
      btn.addEventListener('click', () => vaiA(i));
      item.querySelector('[data-feature-pills-close]').addEventListener('click', chiudiTutto);
      setA11y(item, false);
      item.style.height = `${altezzaBottone(item)}px`;
    });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') chiudiTutto(); });

    misuraChiuse();
    const iniziale = parseInt(wrap.dataset.aperto, 10);
    if (items[iniziale]) apri(items[iniziale], true);

    // si rimisura quando cambia la larghezza e quando arriva il font vero (le pillole chiuse sono larghe quanto il testo)
    const rimisura = () => {
      items.forEach((item) => { if (conGsap) gsap.killTweensOf(item); item.style.width = ''; item.style.height = ''; });
      misuraChiuse();
      items.forEach((item) => {
        if (item.getAttribute('data-active') === 'true') apri(item, true);
        else item.style.height = `${altezzaBottone(item)}px`;
      });
      if (conGsap) ScrollTrigger.refresh();
    };
    if (document.fonts) document.fonts.ready.then(rimisura);
    let t;
    let larghezza = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === larghezza) return;
      larghezza = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(rimisura, 200);
    }, { passive: true });
  });
}

/* ---------- sticky-steps-basic (vanilla, come l'originale) ---------- */
// Attivo = il passo con l'ancora più vicina al centro dello schermo. La foto ferma cambia col passo.
function initStickySteps() {
  document.querySelectorAll('[data-sticky-steps-init]').forEach((container) => {
    const items = [...container.querySelectorAll('[data-sticky-steps-item]')];
    const visuals = [...container.querySelectorAll('[data-sticky-steps-visual]')];
    const numero = container.querySelector('[data-sticky-steps-numero]');
    const barre = [...container.querySelectorAll('.indicatore__barre span')];
    if (!items.length) return;
    let attuale = -1;
    let frame = null;

    function updateSteps() {
      frame = null;
      // sul mobile la foto sta in alto: il riferimento è subito sotto la foto, non il centro dello schermo
      const media = container.querySelector('.aree__media');
      const riferimento = desktop.matches ? window.innerHeight / 2 : media.getBoundingClientRect().bottom + 80;
      let closestIndex = 0;
      let closestDistance = Infinity;
      items.forEach((item, index) => {
        const rect = item.querySelector('[data-sticky-steps-anchor]').getBoundingClientRect();
        const distance = Math.abs(riferimento - (rect.top + rect.height / 2));
        if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
      });
      if (closestIndex === attuale) return;
      attuale = closestIndex;
      items.forEach((item, index) => {
        item.setAttribute('data-sticky-steps-item-status', index < closestIndex ? 'before' : index > closestIndex ? 'after' : 'active');
      });
      visuals.forEach((v, i) => v.classList.toggle('is--attiva', i === closestIndex));
      barre.forEach((b, i) => b.classList.toggle('is--attiva', i === closestIndex));
      if (numero) numero.textContent = `0${closestIndex + 1} / 0${items.length}`;
    }
    const pianifica = () => { if (!frame) frame = requestAnimationFrame(updateSteps); };
    window.addEventListener('scroll', pianifica, { passive: true });
    window.addEventListener('resize', pianifica);
    updateSteps();
  });
}

/* ---------- tab-system-with-autoplay-option (dalla F, come schede vere) ---------- */
// Barra che si riempie in 6 s e passa alla scheda dopo; si ferma col mouse sopra, col focus, fuori schermo e con «riduci movimento».
function initTabs() {
  document.querySelectorAll('[data-tabs="wrapper"]').forEach((wrapper) => {
    const tabs = [...wrapper.querySelectorAll('[data-tabs="tab"]')];
    const panels = [...wrapper.querySelectorAll('[data-tabs="panel"]')];
    const visuals = [...wrapper.querySelectorAll('[data-tabs="visual"]')];
    const strip = wrapper.querySelector('[role="tablist"]');
    const durataMs = durata('--autoplay-servizi') || 6000;
    let autoplay = wrapper.dataset.tabsAutoplay === 'true' && conGsap;
    let attiva = 0;
    let barra = null;
    let inVista = false;
    let sopra = false;

    const puoAvanzare = () => autoplay && inVista && !sopra && moto.ok();
    const aggiornaBarra = () => { if (barra) { if (puoAvanzare()) barra.resume(); else barra.pause(); } };

    function avviaBarra(i) {
      barra?.kill();
      tabs.forEach((t) => { const p = t.querySelector('[data-tabs="item-progress"]'); if (conGsap) gsap.set(p, { scaleX: 0 }); });
      if (!autoplay) return;
      barra = gsap.to(tabs[i].querySelector('[data-tabs="item-progress"]'), {
        scaleX: 1,
        duration: durataMs / 1000,
        ease: 'none',
        paused: !puoAvanzare(),
        onComplete: () => vai((i + 1) % tabs.length, false),
      });
    }

    function vai(i, daUtente) {
      if (daUtente) { autoplay = false; barra?.kill(); barra = null; }
      attiva = i;
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      panels.forEach((p, k) => { p.hidden = k !== i; });
      visuals.forEach((v, k) => v.classList.toggle('is--attiva', k === i));
      // sul mobile la fila scorre: la scheda attiva resta in vista senza muovere la pagina
      if (strip.scrollWidth > strip.clientWidth) {
        const sinistra = strip.scrollLeft + tabs[i].getBoundingClientRect().left - strip.getBoundingClientRect().left - parseFloat(getComputedStyle(strip).paddingLeft);
        strip.scrollTo({ left: sinistra, behavior: moto.ok() ? 'smooth' : 'auto' });
      }
      avviaBarra(i);
    }

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => vai(i, true));
      t.addEventListener('keydown', (e) => {
        const passo = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabs.length - 1 - i }[e.key];
        if (passo === undefined) return;
        e.preventDefault();
        const n = (i + passo + tabs.length) % tabs.length;
        vai(n, true);
        tabs[n].focus();
      });
    });
    wrapper.addEventListener('pointerenter', () => { sopra = true; aggiornaBarra(); });
    wrapper.addEventListener('pointerleave', () => { sopra = false; aggiornaBarra(); });
    wrapper.addEventListener('focusin', () => { sopra = true; aggiornaBarra(); });
    wrapper.addEventListener('focusout', () => { sopra = false; aggiornaBarra(); });
    new IntersectionObserver(([e]) => { inVista = e.isIntersecting; aggiornaBarra(); }, { threshold: 0.3 }).observe(wrapper);
    moto.ascolta.push(aggiornaBarra);
    vai(attiva, false);
  });
}

/* ---------- basic-filter-setup (come l'originale, più l'annuncio del numero) ---------- */
function initFiltro() {
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter-target]');
    const items = group.querySelectorAll('[data-filter-name]');
    const annuncio = group.querySelector('[data-filter-annuncio]');
    if (!buttons.length) return;
    const pausa = () => (moto.ok() ? durata('--dur-filtro') * 1000 : 0);
    let t;

    const filtra = (target, nome) => {
      items.forEach((item) => {
        if (item.getAttribute('data-filter-status') === 'active') item.setAttribute('data-filter-status', 'transition-out');
      });
      clearTimeout(t);
      t = setTimeout(() => {
        let n = 0;
        items.forEach((item) => {
          const on = target === 'all' || item.getAttribute('data-filter-name') === target;
          if (on) n++;
          item.setAttribute('data-filter-status', on ? 'active' : 'not-active');
          item.setAttribute('aria-hidden', String(!on));
        });
        if (annuncio) annuncio.textContent = `${n} materie: ${nome}`;
        if (conGsap) ScrollTrigger.refresh();
      }, pausa());
      buttons.forEach((b) => {
        const on = b.getAttribute('data-filter-target') === target;
        b.setAttribute('data-filter-status', on ? 'active' : 'not-active');
        b.setAttribute('aria-pressed', String(on));
      });
    };

    buttons.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('data-filter-status') === 'active') return;
      filtra(b.getAttribute('data-filter-target'), b.firstChild.textContent.trim());
    }));
  });
}

/* ---------- copy-email-to-clipboard-button ---------- */
function initCopyEmail() {
  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    const email = btn.getAttribute('data-copy-email');
    const stato = btn.querySelector('[data-copy-stato]');
    const label = btn.querySelector('[data-copy-label]');
    const testo = label.textContent;
    const mostra = (etichetta, annuncio) => {
      label.textContent = etichetta;
      btn.setAttribute('data-copy-button', 'copied');
      stato.textContent = annuncio;
    };
    const reset = () => { btn.removeAttribute('data-copy-button'); label.textContent = testo; stato.textContent = ''; };
    // se gli appunti non ci sono, l'indirizzo resta scritto e si copia a mano
    const fallisce = () => mostra('Copiate l’indirizzo a mano', `Copia non riuscita, l'indirizzo è ${email}`);
    btn.addEventListener('click', () => {
      if (!navigator.clipboard) { fallisce(); return; }
      navigator.clipboard.writeText(email).then(() => mostra('Email copiata', `Email copiata: ${email}`)).catch(fallisce);
    });
    btn.addEventListener('mouseleave', reset);
    btn.addEventListener('blur', reset);
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
        esito.textContent = '';
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
    });
  });
}

/* ---------- fit-text-to-width ---------- */
// Desktop e tablet largo: il claim riempie la riga. Sul mobile va su due righe (Figma), quindi si toglie.
function initFitText() {
  const elements = [...document.querySelectorAll('[data-fit-width]')];
  if (!elements.length) return;
  const availableWidth = (parent) => {
    const cs = getComputedStyle(parent);
    return parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  };
  const fit = (el) => {
    el.style.fontSize = '';
    if (!desktop.matches) return;
    const available = availableWidth(el.parentElement);
    let size = parseFloat(getComputedStyle(el).fontSize) || 16;
    for (let i = 0; i < 5; i++) {
      const width = el.getBoundingClientRect().width;
      if (width <= 0) break;
      const ratio = available / width;
      if (Math.abs(ratio - 1) < 0.002) break;
      size = Math.min(size * ratio, 400); // tetto: se la misura non risponde il ciclo non esplode
      el.style.fontSize = size + 'px';
    }
  };
  let frame = null;
  const refit = () => { frame = null; elements.forEach(fit); };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(refit); };
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(schedule);
    elements.forEach((el) => ro.observe(el.parentElement));
  }
  window.addEventListener('resize', schedule);
  refit();
  if (document.fonts) document.fonts.ready.then(refit);
}

/* ---------- live-search-list-js (riscritta senza List.js, come nella F) ---------- */
// Filtra soci, collaboratori e staff per nome o ruolo mentre si scrive; i contatori dicono quanti ne restano.
function initRicerca() {
  const input = document.querySelector('[data-live-search-input]');
  if (!input) return;
  const persone = [...document.querySelectorAll('[data-live-search-item]')];
  const totale = document.querySelector('[data-live-search-count]');
  const vuoto = document.querySelector('[data-live-search-not-found]');
  const gruppi = [...document.querySelectorAll('[data-live-search-group]')];
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const testi = new Map(persone.map((p) => [p, norm(p.getAttribute('data-live-search-item'))]));

  const applica = () => {
    const q = norm(input.value.trim());
    let n = 0;
    persone.forEach((p) => {
      const on = !q || testi.get(p).includes(q);
      if (on) n++;
      p.setAttribute('aria-hidden', String(!on));
    });
    totale.textContent = n;
    totale.nextElementSibling.textContent = n === 1 ? 'risultato' : 'risultati';
    gruppi.forEach((g) => {
      const tutti = g.querySelectorAll('[data-live-search-item]');
      const visibili = g.querySelectorAll('[data-live-search-item][aria-hidden="false"]');
      g.querySelector('[data-live-search-group-count]').textContent = `${visibili.length} di ${persone.length}`;
      g.hidden = tutti.length > 0 && visibili.length === 0;
    });
    vuoto.textContent = n ? '' : `Nessuna persona per «${input.value.trim()}».`;
    if (conGsap) ScrollTrigger.refresh();
  };
  input.addEventListener('input', applica);
  input.closest('form')?.addEventListener('submit', (e) => e.preventDefault());
  applica();
}

/* ---------- Ingressi sotto la piega (bibbia 04: IntersectionObserver + classe, animazione in CSS) ---------- */
function initRivela() {
  const els = document.querySelectorAll('[data-rivela]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('visibile')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => { e.target.classList.add('visibile'); io.unobserve(e.target); });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
}
