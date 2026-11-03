// Martone & Martone · versione D «Osmo» (rifatta il 3 nov 2026 dal codice della F, che ne era la versione in blu scuro)
// Blocchi di osmo.supply adattati al progetto (licenza Osmo: uso nei progetti dei clienti, non ridistribuire).

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

let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) {
    document.documentElement.classList.add('gsap');
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  }
  initLinkDemo();
  initFermaAnimazioni();
  initLenis();
  initTwostepNav();
  initBottomNav();
  initHighlightText();
  initBouncyTabs();
  initFeaturePills();
  initTabSystem();
  initMarquee();
  initCopyEmail();
  initCurrentTime();
  initFormValidation();
  initFooterParallax();
  initMaskedTextReveal();
  initFiltroRicerca();
  initDirectionalHover();
  initPreviewFollower();
  initProfilo();
  if (conGsap && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
});

function initLinkDemo() {
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
}

function initFermaAnimazioni() {
  const btn = document.querySelector('[data-ferma-animazioni]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    moto.fermo = !moto.fermo;
    document.documentElement.classList.toggle('animazioni-ferme', moto.fermo);
    btn.setAttribute('aria-pressed', String(moto.fermo));
    btn.textContent = moto.fermo ? 'Riprendi le animazioni' : 'Ferma le animazioni';
    moto.avvisa();
  });
}

/* ---------- lenis-smooth-scroll-setup + lenis-scroll-to-anchor-target ---------- */
// Lenis 1.3.27 self-hostato con le impostazioni di A, B e C (durate dai token), raf dal ticker di GSAP.
// Spento da «riduci movimento» e da «Ferma le animazioni», riacceso al cambio
const durata = (nome) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(nome));

function initLenis() {
  if (typeof window.Lenis === 'undefined') return;
  const aggiorna = (ok) => {
    if (ok && !lenis) {
      lenis = new Lenis({
        autoRaf: !conGsap,
        duration: durata('--durata-scroll'),
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // esponenziale in uscita
      });
      if (conGsap) lenis.on('scroll', ScrollTrigger.update);
      if (document.documentElement.classList.contains('scroll-bloccato')) lenis.stop();
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

  // Ancore della stessa pagina: link veri, li porta Lenis (il salto nativo lo annullerebbe). Lo skip link resta nativo (sposta il focus)
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

// Menu aperti e modale: pagina ferma (con Lenis attivo anche la rotella, se no basta overflow)
function bloccaScroll(si) {
  document.documentElement.classList.toggle('scroll-bloccato', si);
  if (si) lenis?.stop(); else lenis?.start();
}

// Menu aperto: il resto della pagina diventa inert, così Tab e lettori di schermo restano nel menu
function isola(nav, si) {
  [...document.body.children].forEach((el) => { if (el !== nav && !el.matches('svg.sprite')) el.inert = si; });
}

/* ---------- two-step-scaling-navigation (vanilla, come l'originale) ---------- */
function initTwostepNav() {
  const nav = document.querySelector('[data-twostep-nav]');
  if (!nav) return;
  const toggle = nav.querySelector('[data-nav-toggle="toggle"]');
  const aperto = () => nav.getAttribute('data-nav-status') === 'active';
  const imposta = (apri) => {
    nav.setAttribute('data-nav-status', apri ? 'active' : 'not-active');
    toggle.setAttribute('aria-expanded', String(apri));
    toggle.setAttribute('aria-label', apri ? 'Chiudi il menu' : 'Apri il menu');
    bloccaScroll(apri);
    isola(nav, apri);
  };
  toggle.addEventListener('click', () => imposta(!aperto()));
  nav.querySelectorAll('[data-nav-toggle="close"], .twostep__link a').forEach((el) => el.addEventListener('click', () => imposta(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aperto()) { imposta(false); toggle.focus(); }
  });
}

/* ---------- expanding-bottom-navigation ---------- */
function initBottomNav() {
  const nav = document.querySelector('[data-bottom-nav-init]');
  if (!nav) return;
  const inner = nav.querySelector('[data-bottom-nav-inner]');
  const bar = nav.querySelector('[data-bottom-nav-bar]');
  const panel = nav.querySelector('[data-bottom-nav-panel]');
  const toggle = nav.querySelector('[data-bottom-nav-toggle]');
  const reveals = panel.querySelectorAll('[data-bottom-nav-reveal]');
  const barTop = toggle.querySelector('.is--top');
  const barBot = toggle.querySelector('.is--btm');
  const divider = nav.querySelector('[data-bottom-nav-divider]');
  let isOpen = false;

  function setState(open) {
    isOpen = open;
    nav.setAttribute('data-bottom-nav-open', String(open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    panel.setAttribute('aria-hidden', String(!open));
    bloccaScroll(open);
    isola(nav, open);
  }

  if (!conGsap) {
    toggle.addEventListener('click', () => setState(!isOpen));
    return;
  }

  CustomEase.create('osmo', 'M0,0 C0.625,0.05 0,1 1,1');
  let enterEnd = 0;
  let dims = { closedW: 0, closedH: 0, openW: 0, openH: 0 };
  let tl;

  function measure() {
    const w = inner.style.width;
    const h = inner.style.height;
    inner.style.width = 'var(--open-width)';
    inner.style.height = 'auto';
    const openW = inner.offsetWidth;
    const openH = inner.offsetHeight;
    inner.style.width = 'var(--closed-width)';
    const closedW = inner.offsetWidth;
    inner.style.width = w;
    inner.style.height = h;
    return { closedW, closedH: bar.offsetHeight, openW, openH };
  }

  function build() {
    tl = gsap.timeline({ paused: true, defaults: { ease: 'osmo', easeReverse: 'power2.inOut' } });
    tl.to(inner, { width: () => dims.openW, height: () => dims.openH, duration: 0.65 }, 0)
      .to(barTop, { y: 2, rotation: 45, scaleX: 1.1, duration: 0.4, ease: 'back.out(2)', easeReverse: 'power3.out' }, 0.05)
      .to(barBot, { y: -2, rotation: -45, scaleX: 1.1, duration: 0.4, ease: 'back.out(2)', easeReverse: 'power3.out' }, 0.05)
      .set(panel, { autoAlpha: 1 }, 0.1)
      .fromTo(reveals, { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.6, stagger: 0.03 }, 0.1)
      .fromTo(divider, { scaleX: 0, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 1.1 }, 0);
    enterEnd = tl.duration();
    tl.addPause();
    tl.to(reveals, { autoAlpha: 0, yPercent: 10, duration: 0.25, stagger: { each: 0.01, from: 'end' } })
      .to(inner, { width: () => dims.closedW, height: () => dims.closedH, duration: 0.45, ease: 'power3.inOut' }, '<')
      .to([barTop, barBot], { y: 0, rotation: 0, scaleX: 1, duration: 0.3, ease: 'power3.in' }, '<')
      .set(panel, { autoAlpha: 0 });
  }

  function toggleNav() {
    setState(!isOpen);
    tl.timeScale(riduci.matches ? 20 : 1);
    if (isOpen) {
      tl.invalidate();
      if (tl.time() >= enterEnd) tl.restart(); else tl.play();
    } else if (tl.time() < enterEnd) {
      tl.reverse();
    } else {
      tl.play();
    }
  }

  dims = measure();
  gsap.set(inner, { width: dims.closedW, height: dims.closedH });
  gsap.set(panel, { autoAlpha: 0 });
  build();

  toggle.addEventListener('click', toggleNav);
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (isOpen) toggleNav(); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) { toggleNav(); toggle.focus(); }
  });
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      dims = measure();
      if (isOpen) gsap.set(inner, { width: dims.openW, height: dims.openH });
      else { tl.invalidate(); gsap.set(inner, { width: dims.closedW, height: dims.closedH }); }
    }, 150);
  });
}

/* ---------- highlight-text-on-scroll ---------- */
function initHighlightText() {
  if (!conGsap) return;
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    document.querySelectorAll('[data-highlight-text]').forEach((heading) => {
      // per parole e non per lettere: lo split in lettere toglie la crenatura e cambia gli a capo rispetto al Figma
      SplitText.create(heading, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          return gsap.timeline({
            scrollTrigger: { scrub: true, trigger: heading, start: 'top 90%', end: 'center 40%' },
          }).from(self.words, { autoAlpha: 0.14, stagger: 0.1, ease: 'linear' });
        },
      });
    });
  });
}

/* ---------- bouncy-content-tabs ---------- */
function initBouncyTabs() {
  if (!conGsap) return;
  const config = { travel: 0.45, settle: 0.3, squashDown: 0.15, squashBack: 0.4, overshoot: 4, cardSquash: 0.2, cardInflate: 0.5 };
  let n = 0;

  document.querySelectorAll('[data-bouncy-tabs-init]').forEach((root) => {
    const nav = root.querySelector('[data-bouncy-tabs-nav]');
    const indicator = root.querySelector('[data-bouncy-tabs-indicator]');
    const ghost = root.querySelector('[data-bouncy-tabs-ghost]');
    const buttons = Array.from(nav.querySelectorAll('[data-bouncy-tabs-button]'));
    const card = root.querySelector('[data-bouncy-tabs-card]');
    const panelsWrap = root.querySelector('[data-bouncy-tabs-panels]');
    const panels = Array.from(panelsWrap.querySelectorAll('[data-bouncy-tabs-panel]'));
    n += 1;
    buttons.forEach((b, i) => {
      b.id = b.id || `aree-${n}-tab-${i + 1}`;
      panels[i].id = panels[i].id || `aree-${n}-pannello-${i + 1}`;
      b.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('aria-labelledby', b.id);
    });

    let active = Math.max(0, buttons.findIndex((b) => b.hasAttribute('data-active')));
    const pos = { left: 0, right: 0 };
    let ghostOn = false;
    const dur = (x) => (riduci.matches ? 0 : x);

    function syncButtons() {
      buttons.forEach((b, i) => {
        b.toggleAttribute('data-active', i === active);
        b.setAttribute('aria-selected', String(i === active));
        b.tabIndex = i === active ? 0 : -1;
      });
    }
    const rectFor = (b) => ({ left: b.offsetLeft, right: b.offsetLeft + b.offsetWidth, top: b.offsetTop, height: b.offsetHeight });
    const render = () => gsap.set(indicator, { x: pos.left, width: pos.right - pos.left });
    function place(i) {
      const t = rectFor(buttons[i]);
      pos.left = t.left; pos.right = t.right;
      gsap.killTweensOf([pos, indicator]);
      gsap.set(indicator, { scaleY: 1, y: t.top, height: t.height });
      render();
    }
    const setHeight = () => gsap.set(panelsWrap, { height: panels[active].offsetHeight });

    function swapInstant() {
      panels.forEach((p, i) => {
        gsap.killTweensOf(p);
        gsap.set(p, { autoAlpha: i === active ? 1 : 0, x: 0 });
        p.toggleAttribute('data-active', i === active);
      });
      gsap.set(card, { scaleX: 1, scaleY: 1, x: 0 });
      setHeight();
    }

    function transitionCard(prev, right) {
      const dir = right ? 1 : -1;
      const inc = panels[active];
      const out = panels[prev];
      panels.forEach((p) => {
        if (p !== inc && p !== out) { gsap.killTweensOf(p); gsap.set(p, { autoAlpha: 0, x: 0 }); p.removeAttribute('data-active'); }
      });
      inc.setAttribute('data-active', '');
      out.removeAttribute('data-active');
      gsap.killTweensOf([card, panelsWrap, inc, out]);
      gsap.set(card, { transformOrigin: '50% 50%' });
      gsap.timeline()
        .to(card, { scaleX: 0.995, scaleY: 1, x: dir * 3, duration: config.cardSquash, ease: 'power2.out' }, 0)
        .to(out, { x: dir * -16, autoAlpha: 0, duration: 0.25, ease: 'power2.out' }, 0)
        .to(panelsWrap, { height: inc.offsetHeight, duration: 0.3, ease: 'power2.inOut' }, 0.1)
        .fromTo(inc, { x: dir * 16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' }, config.cardSquash)
        .to(card, { scaleX: 1, scaleY: 1, x: 0, duration: config.cardInflate, ease: 'power3.out' }, config.cardSquash)
        .set(out, { x: 0 });
    }

    function goTo(i) {
      if (i === active) return;
      const prev = active;
      const right = i > active;
      active = i;
      syncButtons();
      if (riduci.matches) { place(i); swapInstant(); return; }
      transitionCard(prev, right);
      const t = rectFor(buttons[i]);
      gsap.killTweensOf([pos, indicator]);
      const hDir = t.left === pos.left ? (right ? 1 : -1) : (t.left > pos.left ? 1 : -1);
      let over = gsap.utils.clamp(6, Math.max(6, config.overshoot), Math.abs(t.left - pos.left) * 0.08) * hDir;
      over = hDir > 0 ? Math.min(over, nav.clientWidth - t.right) : Math.max(over, -t.left);
      gsap.set(indicator, { transformOrigin: '50% 50%' });
      gsap.to(indicator, { y: t.top, height: t.height, duration: config.travel, ease: 'power3.out' });
      gsap.timeline()
        .to(pos, { left: t.left + over, right: t.right + over, duration: config.travel, ease: 'power3.out', onUpdate: render })
        .to(pos, { left: t.left, right: t.right, duration: config.settle, ease: 'power2.inOut', onUpdate: render });
      gsap.timeline()
        .to(indicator, { scaleY: 0.94, duration: config.squashDown, ease: 'power2.out' })
        .to(indicator, { scaleY: 1, duration: config.squashBack, ease: 'power3.out' });
    }

    function moveGhost(b) {
      const t = rectFor(b);
      const vars = { x: t.left, y: t.top, width: t.right - t.left, height: t.height };
      if (!ghostOn) {
        ghostOn = true;
        gsap.killTweensOf(ghost);
        gsap.set(ghost, vars);
        gsap.to(ghost, { autoAlpha: 1, duration: dur(0.25), ease: 'power2.out' });
      } else {
        gsap.to(ghost, { ...vars, autoAlpha: 1, duration: dur(0.3), ease: 'power3.out' });
      }
    }
    function hideGhost() {
      ghostOn = false;
      gsap.to(ghost, { autoAlpha: 0, duration: dur(0.2), ease: 'power1.out' });
    }
    function refresh() { place(active); setHeight(); }

    buttons.forEach((b, i) => {
      b.addEventListener('click', () => goTo(i));
      b.addEventListener('mouseenter', () => { if (!b.hasAttribute('data-active')) moveGhost(b); else hideGhost(); });
    });
    nav.addEventListener('mouseleave', hideGhost);
    nav.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: Math.min(buttons.length - 1, active + 1), ArrowLeft: Math.max(0, active - 1), Home: 0, End: buttons.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      goTo(keys[e.key]);
      buttons[keys[e.key]].focus();
    });
    window.addEventListener('resize', refresh);
    if (document.fonts) document.fonts.ready.then(refresh);
    gsap.set(ghost, { autoAlpha: 0 });
    panels.forEach((p, i) => gsap.set(p, { autoAlpha: i === active ? 1 : 0 }));
    syncButtons();
    refresh();
    nav.classList.add('is--pronto');
  });
}

/* ---------- expanding-feature-pills ---------- */
function initFeaturePills() {
  if (!conGsap) return;
  document.querySelectorAll('[data-feature-pills-init]').forEach((wrap, w) => {
    const items = Array.from(wrap.querySelectorAll('[data-feature-pills-item]'));
    const visuals = Array.from(wrap.querySelectorAll('[data-feature-pills-visual]'));
    const cover = wrap.querySelector('[data-feature-pills-cover]');
    const badge = wrap.querySelector('[data-pills-badge]');
    const ease = 'expo.out';
    const durata = 0.6;
    const larghezza = () => getComputedStyle(wrap).getPropertyValue('--content-item-expanded').trim();
    const attivo = () => items.findIndex((it) => it.getAttribute('data-active') === 'true');
    const larghezzaChiusa = new Map();

    const setWrap = (on) => {
      wrap.setAttribute('data-feature-pills-active', String(on));
      if (cover) cover.setAttribute('data-active', String(!on));
    };
    const setVisual = (i) => {
      visuals.forEach((v, k) => v.setAttribute('data-active', String(k === i)));
      if (badge && i !== null) badge.textContent = `0${i + 1} / 0${items.length} · ${items[i].dataset.nome}`;
    };
    const setA11y = (item, open) => {
      item.querySelector('[data-feature-pills-button]').setAttribute('aria-expanded', String(open));
      item.querySelector('[data-feature-pills-content]').setAttribute('aria-hidden', String(!open));
    };
    const altezzaBottone = (item) => Math.ceil(item.querySelector('[data-feature-pills-button]').getBoundingClientRect().height);
    const altezzaInner = (item) => {
      const mask = item.querySelector('.pillola__maschera');
      mask.style.overflow = 'visible';
      const h = Math.ceil(item.querySelector('[data-feature-pills-inner]').getBoundingClientRect().height);
      mask.style.overflow = '';
      return h;
    };
    const misuraChiuse = () => items.forEach((item) => {
      const prev = item.style.width;
      item.style.width = '';
      larghezzaChiusa.set(item, Math.ceil(item.getBoundingClientRect().width));
      item.style.width = prev;
    });
    const anima = (el, vars, istante) => {
      gsap.killTweensOf(el);
      if (istante || riduci.matches) gsap.set(el, vars);
      else gsap.to(el, { ...vars, duration: durata, ease, overwrite: true });
    };
    const apri = (item, istante) => {
      item.setAttribute('data-active', 'true');
      setA11y(item, true);
      setWrap(true);
      anima(item, { height: Math.max(altezzaBottone(item), altezzaInner(item)), width: larghezza() }, istante);
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
      setVisual(i);
      items[i].querySelector('[data-feature-pills-close]').focus({ preventScroll: true });
    };
    const chiudiTutto = () => {
      const cur = attivo();
      if (cur === -1) return;
      chiudi(items[cur]);
      setVisual(null);
      setWrap(false);
      items[cur].querySelector('[data-feature-pills-button]').focus({ preventScroll: true });
    };

    items.forEach((item, i) => {
      const btn = item.querySelector('[data-feature-pills-button]');
      const content = item.querySelector('[data-feature-pills-content]');
      btn.id = `pillole-${w}-voce-${i}`;
      content.id = `pillole-${w}-pannello-${i}`;
      btn.setAttribute('aria-controls', content.id);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', btn.id);
      btn.addEventListener('click', () => vaiA(i));
      item.querySelector('[data-feature-pills-close]').addEventListener('click', chiudiTutto);
      item.setAttribute('data-active', 'false');
      setA11y(item, false);
      item.style.height = `${altezzaBottone(item)}px`;
    });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') chiudiTutto(); });

    misuraChiuse();
    apri(items[0], true);
    setVisual(0);

    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        items.forEach((item) => { if (item.getAttribute('data-active') !== 'true') item.style.width = ''; });
        misuraChiuse();
        items.forEach((item) => {
          if (item.getAttribute('data-active') === 'true') gsap.set(item, { height: Math.max(altezzaBottone(item), altezzaInner(item)), width: larghezza() });
          else item.style.height = `${altezzaBottone(item)}px`;
        });
      }, 200);
    }, { passive: true });
  });
}

/* ---------- tab-system-with-autoplay-option ---------- */
function initTabSystem() {
  if (!conGsap) return;
  document.querySelectorAll('[data-tabs="wrapper"]').forEach((wrapper) => {
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');
    const badge = wrapper.querySelector('[data-tabs-badge-testo]');
    const durata = parseInt(wrapper.dataset.tabsAutoplayDuration, 10) || 5000;
    let autoplay = wrapper.dataset.tabsAutoplay === 'true';
    let activeContent = null;
    let activeVisual = null;
    let isAnimating = false;
    let barra = null;
    let inVista = false;
    let sopra = false;

    const puoAvanzare = () => autoplay && inVista && !sopra && moto.ok();
    function aggiornaBarra() {
      if (!barra) return;
      if (puoAvanzare()) barra.resume(); else barra.pause();
    }

    function startProgressBar(index) {
      if (barra) barra.kill();
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
      gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
      if (!autoplay) return;
      barra = gsap.to(bar, {
        scaleX: 1,
        duration: durata / 1000,
        ease: 'power1.inOut',
        paused: !puoAvanzare(),
        onComplete: () => { if (!isAnimating) switchTab((index + 1) % contentItems.length); },
      });
    }

    function switchTab(index) {
      if (isAnimating || contentItems[index] === activeContent) return;
      isAnimating = true;
      if (barra) barra.kill();
      const outC = activeContent;
      const outV = activeVisual;
      const inC = contentItems[index];
      const inV = visualItems[index];
      outC?.classList.remove('active');
      outV?.classList.remove('active');
      outC?.setAttribute('aria-expanded', 'false');
      inC.classList.add('active');
      inV.classList.add('active');
      inC.setAttribute('aria-expanded', 'true');
      if (badge) badge.textContent = inC.dataset.nome;
      const tl = gsap.timeline({
        defaults: { duration: riduci.matches ? 0 : 0.65, ease: 'power3' },
        onComplete: () => { activeContent = inC; activeVisual = inV; isAnimating = false; startProgressBar(index); },
      });
      if (outC) {
        const outBar = outC.querySelector('[data-tabs="item-progress"]');
        tl.set(outBar, { transformOrigin: 'right center' })
          .to(outBar, { scaleX: 0, duration: riduci.matches ? 0 : 0.3 }, 0)
          .to(outV, { autoAlpha: 0, xPercent: 3 }, 0)
          .to(outC.querySelector('[data-tabs="item-details"]'), { height: 0 }, 0);
      }
      tl.fromTo(inV, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0 }, outC ? 0.3 : 0)
        .fromTo(inC.querySelector('[data-tabs="item-details"]'), { height: 0 }, { height: 'auto' }, 0)
        .set(inC.querySelector('[data-tabs="item-progress"]'), { scaleX: 0, transformOrigin: 'left center' }, 0);
    }

    visualItems.forEach((v, i) => gsap.set(v, { autoAlpha: i === 0 ? 1 : 0 }));
    contentItems.forEach((item, i) => {
      item.setAttribute('aria-expanded', 'false');
      item.addEventListener('click', () => {
        autoplay = false; // dopo una scelta dell'utente l'autoplay si ferma
        if (barra) barra.kill();
        switchTab(i);
      });
    });
    wrapper.addEventListener('pointerenter', () => { sopra = true; aggiornaBarra(); });
    wrapper.addEventListener('pointerleave', () => { sopra = false; aggiornaBarra(); });
    wrapper.addEventListener('focusin', () => { sopra = true; aggiornaBarra(); });
    wrapper.addEventListener('focusout', () => { sopra = false; aggiornaBarra(); });
    new IntersectionObserver(([e]) => { inVista = e.isIntersecting; aggiornaBarra(); }, { threshold: 0.3 }).observe(wrapper);
    moto.ascolta.push(aggiornaBarra);
    switchTab(0);
  });
}

/* ---------- css-marquee ---------- */
function initMarquee() {
  const pxAlSecondo = 40;
  document.querySelectorAll('[data-css-marquee]').forEach((marquee) => {
    const list = marquee.querySelector('[data-css-marquee-list]');
    const copia = list.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    marquee.appendChild(copia);
    const durata = () => {
      marquee.querySelectorAll('[data-css-marquee-list]').forEach((l) => { l.style.animationDuration = `${list.offsetWidth / pxAlSecondo}s`; });
    };
    durata();
    window.addEventListener('resize', durata);
    new IntersectionObserver(([e]) => marquee.classList.toggle('is--in-vista', e.isIntersecting), { threshold: 0 }).observe(marquee);
  });
}

/* ---------- copy-email-to-clipboard-button ---------- */
function initCopyEmail() {
  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    const email = btn.getAttribute('data-copy-email');
    const stato = btn.querySelector('[data-copy-stato]');
    const esito = btn.querySelector('.copia-email__el:nth-child(3)');
    const testoOk = esito.textContent;
    const mostra = (testo, annuncio) => {
      esito.textContent = testo;
      btn.setAttribute('data-copy-button', 'copied');
      if (stato) stato.textContent = annuncio;
    };
    const reset = () => { btn.removeAttribute('data-copy-button'); esito.textContent = testoOk; if (stato) stato.textContent = ''; };
    // se gli appunti non sono disponibili si mostra l'indirizzo, così si può copiare a mano
    const fallisce = () => mostra(email, `Copia non riuscita, l'indirizzo è ${email}`);
    btn.addEventListener('click', () => {
      if (!navigator.clipboard) { fallisce(); return; }
      navigator.clipboard.writeText(email).then(() => mostra(testoOk, `Email copiata: ${email}`)).catch(fallisce);
    });
    btn.addEventListener('mouseleave', reset);
    btn.addEventListener('blur', reset);
  });
}

/* ---------- dynamic-current-time ---------- */
function initCurrentTime() {
  const els = document.querySelectorAll('[data-current-time]');
  if (!els.length) return;
  const aggiorna = () => {
    els.forEach((el) => {
      const parti = new Intl.DateTimeFormat('it-IT', { timeZone: el.getAttribute('data-current-time') || 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const val = (t) => parti.find((p) => p.type === t)?.value;
      el.querySelector('[data-current-time-hours]').textContent = val('hour');
      el.querySelector('[data-current-time-minutes]').textContent = val('minute');
    });
  };
  aggiorna();
  setInterval(aggiorna, 1000);
}

/* ---------- live-form-validation-basic (demo: nessun invio) ---------- */
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
      g.classList.toggle('is--filled', !!input.value.trim());
      g.classList.toggle('is--success', ok);
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

/* ---------- footer-parallax-effect ---------- */
function initFooterParallax() {
  if (!conGsap) return;
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    document.querySelectorAll('[data-footer-parallax]').forEach((el) => {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'clamp(top bottom)', end: 'clamp(top top)', scrub: true } })
        .from(el.querySelector('[data-footer-parallax-inner]'), { yPercent: -25, ease: 'linear' })
        .from(el.querySelector('[data-footer-parallax-dark]'), { opacity: 0.5, ease: 'linear' }, '<');
    });
  });
}

/* ---------- masked-text-reveal ---------- */
function initMaskedTextReveal() {
  const titoli = document.querySelectorAll('[data-split="heading"]');
  if (!titoli.length) return;
  if (!conGsap) { titoli.forEach((t) => { t.style.visibility = 'visible'; }); return; }
  const via = () => gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    titoli.forEach((heading) => {
      gsap.set(heading, { autoAlpha: 1 });
      SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        linesClass: 'line',
        // già in vista al caricamento parte subito (versione «base» del blocco), se no allo scroll; una volta sola
        onSplit(inst) {
          if (heading.dataset.rivelato) return null;
          heading.dataset.rivelato = '1';
          const anim = { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'expo.out' };
          if (heading.getBoundingClientRect().top < window.innerHeight * 0.8) return gsap.from(inst.lines, { ...anim, stagger: 0.1 });
          return gsap.from(inst.lines, { ...anim, scrollTrigger: { trigger: heading, start: 'clamp(top 80%)', once: true } });
        },
      });
    });
  });
  if (document.fonts) document.fonts.ready.then(via); else via();
}

/* ---------- basic-filter-setup + ricerca per nome (live-search-list-js) ---------- */
// La ricerca è riscritta senza List.js: List.js toglie le voci dal DOM e non si combina con i filtri su due elenchi.
function initFiltroRicerca() {
  const group = document.querySelector('[data-filter-group]');
  if (!group) return;
  const buttons = group.querySelectorAll('[data-filter-target]');
  const input = group.querySelector('[data-live-search-input]');
  const vuoto = group.querySelector('[data-live-search-not-found]');
  const items = Array.from(document.querySelectorAll('[data-filter-name]'));
  const sezioni = document.querySelectorAll('[data-filter-section]');
  const pausa = riduci.matches ? 0 : 300;
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nome = (item) => norm(item.querySelector('.t-name, .persona__nome').textContent);
  let categoria = 'all';
  let t;

  function applica() {
    const q = norm(input ? input.value.trim() : '');
    const visibile = (item) => (categoria === 'all' || item.dataset.filterName === categoria) && (!q || nome(item).includes(q));
    items.forEach((item) => { if (item.getAttribute('data-filter-status') === 'active') item.setAttribute('data-filter-status', 'transition-out'); });
    clearTimeout(t);
    t = setTimeout(() => {
      items.forEach((item) => {
        const on = visibile(item);
        item.setAttribute('data-filter-status', on ? 'active' : 'not-active');
        item.setAttribute('aria-hidden', String(!on));
      });
      sezioni.forEach((s) => { s.hidden = !s.querySelector('[data-filter-status="active"]'); });
      const nessuno = !items.some(visibile);
      vuoto.textContent = nessuno ? `Nessun risultato per «${input.value.trim()}».` : '';
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, pausa);
  }

  buttons.forEach((btn) => btn.addEventListener('click', () => {
    if (btn.getAttribute('data-filter-status') === 'active') return;
    categoria = btn.getAttribute('data-filter-target');
    buttons.forEach((b) => {
      const on = b === btn;
      b.setAttribute('data-filter-status', on ? 'active' : 'not-active');
      b.setAttribute('aria-pressed', String(on));
    });
    applica();
  }));
  if (input) input.addEventListener('input', applica);
}

/* ---------- directional-list-hover ---------- */
function initDirectionalHover() {
  const fuori = { top: 'translateY(-100%)', bottom: 'translateY(100%)', left: 'translateX(-100%)', right: 'translateX(100%)' };
  document.querySelectorAll('[data-directional-hover]').forEach((container) => {
    const type = container.getAttribute('data-type') || 'all';
    const lato = (e, el) => {
      const { left, top, width: w, height: h } = el.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      if (type === 'y') return y < h / 2 ? 'top' : 'bottom';
      if (type === 'x') return x < w / 2 ? 'left' : 'right';
      return Object.entries({ top: y, right: w - x, bottom: h - y, left: x }).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    };
    container.querySelectorAll('[data-directional-hover-item]').forEach((item) => {
      const tile = item.querySelector('[data-directional-hover-tile]');
      item.addEventListener('mouseenter', (e) => {
        const d = lato(e, item);
        tile.style.transition = 'none';
        tile.style.transform = fuori[d];
        void tile.offsetHeight;
        tile.style.transition = '';
        tile.style.transform = 'translate(0%, 0%)';
        item.setAttribute('data-status', `enter-${d}`);
      });
      item.addEventListener('mouseleave', (e) => {
        const d = lato(e, item);
        item.setAttribute('data-status', `leave-${d}`);
        tile.style.transform = fuori[d];
      });
    });
  });
}

/* ---------- image-preview-cursor-follower (+ anteprima al tocco su mobile) ---------- */
function initPreviewFollower() {
  if (!conGsap) return;
  document.querySelectorAll('[data-follower-wrap]').forEach((wrap) => {
    const collection = wrap.querySelector('[data-follower-collection]');
    const items = wrap.querySelectorAll('[data-follower-item]');
    const follower = wrap.querySelector('[data-follower-cursor]');
    const inner = wrap.querySelector('[data-follower-cursor-inner]');
    let prev = null;
    let primo = true;
    const offset = 100;
    const duration = riduci.matches ? 0 : 0.5;
    const ease = 'power2.inOut';
    gsap.set(follower, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(follower, 'x', { duration: riduci.matches ? 0 : 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: riduci.matches ? 0 : 0.6, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });

    const togli = (dir) => inner.querySelectorAll('[data-follower-visual]').forEach((el) => {
      gsap.killTweensOf(el);
      gsap.to(el, { yPercent: dir, duration, ease, overwrite: 'auto', onComplete: () => el.remove() });
    });
    const mostra = (item, index) => {
      const avanti = prev === null || index > prev;
      prev = index;
      togli(avanti ? -offset : offset);
      const clone = item.querySelector('[data-follower-visual]').cloneNode(true);
      clone.removeAttribute('loading');
      inner.appendChild(clone);
      if (!primo) gsap.fromTo(clone, { yPercent: avanti ? offset : -offset }, { yPercent: 0, duration, ease, overwrite: 'auto' });
      primo = false;
    };

    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => mostra(item, index));
      item.addEventListener('mouseleave', () => togli(-offset));
      item.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        const riga = item.querySelector('.persona');
        gsap.set(follower, { x: e.clientX, y: e.clientY });
        mostra(item, index);
        riga.classList.add('is--tocco');
        wrap.classList.add('is--tocco');
        const fine = () => {
          setTimeout(() => { riga.classList.remove('is--tocco'); wrap.classList.remove('is--tocco'); }, 250);
          window.removeEventListener('pointerup', fine);
          window.removeEventListener('pointercancel', fine);
        };
        window.addEventListener('pointerup', fine);
        window.addEventListener('pointercancel', fine);
      });
    });
    collection.addEventListener('mouseleave', () => {
      inner.querySelectorAll('[data-follower-visual]').forEach((el) => { gsap.killTweensOf(el); gsap.delayedCall(duration, () => el.remove()); });
      primo = true;
      prev = null;
    });
  });
}

/* ---------- basic-modal-setup (con <dialog>: focus, Esc e sfondo inerte dal browser) ---------- */
function initProfilo() {
  const dialog = document.querySelector('[data-modal]');
  if (!dialog) return;
  const nomeEl = dialog.querySelector('[data-profilo-nome]');
  const ruoloEl = dialog.querySelector('[data-profilo-ruolo]');
  const fotoEl = dialog.querySelector('[data-profilo-foto]');
  const bioEl = dialog.querySelector('[data-profilo-bio]');
  const pillole = dialog.querySelectorAll('.profilo__pillole [data-profilo]');

  function riempi(trigger) {
    nomeEl.textContent = trigger.dataset.nome;
    ruoloEl.textContent = trigger.dataset.ruolo;
    fotoEl.src = trigger.dataset.foto;
    bioEl.textContent = trigger.dataset.bio || bioEl.dataset.segnaposto;
    pillole.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.nome === trigger.dataset.nome)));
  }

  document.querySelectorAll('[data-profilo]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      riempi(trigger);
      if (!dialog.open) { dialog.showModal(); bloccaScroll(true); }
    });
  });
  dialog.addEventListener('close', () => bloccaScroll(false));
  dialog.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.classList.contains('profilo__scorri')) dialog.close();
  });
}
