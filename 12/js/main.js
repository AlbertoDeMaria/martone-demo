// Martone & Martone · opzione 12 «Segno +», Versione 2. Il + guida ogni movimento.
// Blocchi di osmo.supply adattati al progetto (licenza Osmo: uso nei progetti dei clienti, non ridistribuire), originali in osmo/.

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
const conGsap = typeof window.gsap !== 'undefined';
const root = document.documentElement;
const css = (nome) => getComputedStyle(root).getPropertyValue(nome).trim();
const durata = (nome) => parseFloat(css(nome));

let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) {
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create('loader', '0.65, 0.01, 0.05, 0.99');
  }
  initLinkDemo();
  initLenis();
  initMenu();
  initLoader();
  initCursore();
  initSomme();
  initOnda();
  initAccordion();
  initToggle();
  initSoci();
  initFiltri();
  initMagnete();
  initCopiaEmail();
  initModulo();
  if (conGsap && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
});

function initLinkDemo() {
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
}

/* ---------- lenis-smooth-scroll-setup (impostazioni della F) ---------- */
function initLenis() {
  if (typeof window.Lenis === 'undefined') return;
  const aggiorna = () => {
    if (!riduci.matches && !lenis) {
      lenis = new Lenis({ autoRaf: !conGsap, duration: durata('--durata-scroll'), easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      if (conGsap) lenis.on('scroll', ScrollTrigger.update);
      if (root.classList.contains('scroll-bloccato')) lenis.stop();
    } else if (riduci.matches && lenis) {
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

  // Ancore della stessa pagina con Lenis; lo skip link resta nativo (sposta il focus)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!lenis || !a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.matches('.salta')) return;
    if (a.pathname !== location.pathname || !a.hash) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: durata('--durata-ancora'), offset: -24 });
    history.pushState(null, '', a.hash);
  });
}

// Tutto il resto della pagina diventa inerte: il Tab (e lo screen reader) non escono dall'elemento aperto
function isola(el, si) {
  [...document.body.children].forEach((c) => { if (c !== el && c.tagName !== 'SCRIPT') c.inert = si; });
}

function bloccaScroll(si) {
  root.classList.toggle('scroll-bloccato', si);
  root.style.overflow = si ? 'hidden' : '';
  if (si) lenis?.stop(); else lenis?.start();
}

/* ---------- logo-reveal-loader: il sito si apre dal + ---------- */
function initLoader() {
  const wrap = document.querySelector('[data-loader]');
  if (!wrap || !root.classList.contains('con-loader')) return;
  const fine = () => {
    isola(wrap, false);
    root.classList.remove('con-loader');
    try { sessionStorage.setItem('martone12-loader', '1'); } catch (e) {}
  };
  if (!conGsap || riduci.matches) { fine(); return; }
  isola(wrap, true);

  const q = (s) => wrap.querySelector(s);
  const piu = q('[data-loader-piu]');
  gsap.set(q('[data-loader-parole]'), { '--apre': 50 });
  gsap.set(piu, { color: css('--colore-oro'), scale: 1.25, autoAlpha: 0, transformOrigin: '50% 50%' });
  gsap.set(q('[data-loader-cerchio]'), { scale: 0.6, autoAlpha: 0 });
  gsap.set(q('[data-loader-claim]'), { autoAlpha: 0, y: 8 });

  gsap.timeline({ defaults: { ease: 'loader' }, onComplete: fine })
    // 1 · solo il +, in oro su notte
    .to(q('[data-loader-cerchio]'), { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 0)
    .to(piu, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0.05)
    // 2 · dal + si aprono le due parole
    .to(q('[data-loader-parole]'), { '--apre': 0, duration: 0.8 }, 0.45)
    .to(piu, { scale: 1, color: css('--colore-testo-su-scuro'), duration: 0.6 }, 0.45)
    .to(q('[data-loader-cerchio]'), { scale: 1.3, autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 0.45)
    // 3 · logo intero, poi il velo sale
    .to(q('[data-loader-claim]'), { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.95)
    .to(q('[data-loader-centro]'), { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 1.4)
    .to(q('[data-loader-fondo]'), { yPercent: -101, duration: 0.6 }, 1.4);
}

/* ---------- scaling-hamburger-navigation: «Menu +», il + diventa × con due tratti ---------- */
function initMenu() {
  const nav = document.querySelector('[data-menu]');
  if (!nav) return;
  const box = nav.querySelector('[data-menu-box]');
  const toggle = nav.querySelector('[data-navigation-toggle="toggle"]');
  const [a, b] = toggle.querySelectorAll('line');
  const PIU = { a: { x1: 5, y1: 12, x2: 19, y2: 12 }, b: { x1: 12, y1: 5, x2: 12, y2: 19 } };
  const PER = { a: { x1: 6.6, y1: 6.6, x2: 17.4, y2: 17.4 }, b: { x1: 17.4, y1: 6.6, x2: 6.6, y2: 17.4 } };
  const aperto = () => nav.getAttribute('data-navigation-status') === 'active';

  // Il fondo della card parte dalla larghezza della pillola «Menu +», e la testata le tiene il posto
  const misura = () => root.style.setProperty('--pill-w', `${toggle.offsetWidth}px`);
  misura();
  window.addEventListener('resize', misura);
  document.fonts?.ready.then(misura);

  const tratti = (forma) => {
    if (conGsap && !riduci.matches) {
      gsap.to(a, { attr: forma.a, duration: durata('--durata-menu'), ease: 'expo.out' });
      gsap.to(b, { attr: forma.b, duration: durata('--durata-menu'), ease: 'expo.out' });
    } else {
      Object.entries(forma.a).forEach(([k, v]) => a.setAttribute(k, v));
      Object.entries(forma.b).forEach(([k, v]) => b.setAttribute(k, v));
    }
  };

  const imposta = (apri) => {
    nav.setAttribute('data-navigation-status', apri ? 'active' : 'not-active');
    toggle.setAttribute('aria-expanded', String(apri));
    toggle.setAttribute('aria-label', apri ? 'Chiudi il menu' : 'Apri il menu');
    tratti(apri ? PER : PIU);
    bloccaScroll(apri);
    isola(nav, apri);
    if (apri) setTimeout(() => nav.querySelector('.menu__voce')?.focus({ preventScroll: true }), 120);
  };

  toggle.addEventListener('click', () => imposta(!aperto()));
  nav.querySelector('[data-navigation-toggle="close"]').addEventListener('click', () => { imposta(false); toggle.focus(); });
  nav.querySelectorAll('.menu__voce').forEach((el) => el.addEventListener('click', () => imposta(false)));
  document.addEventListener('keydown', (e) => {
    if (!aperto()) return;
    if (e.key === 'Escape') { imposta(false); toggle.focus(); return; }
    if (e.key !== 'Tab') return;
    // Oltre a inert: dall'ultimo elemento si torna al primo invece di finire nella barra del browser
    const f = [...box.querySelectorAll('a, button')].filter((el) => el.offsetParent !== null);
    const primo = f[0], ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
  });
}

/* ---------- dynamic-custom-text-cursor: sulle foto il cursore dice cosa si guarda ---------- */
function initCursore() {
  const cursor = document.querySelector('[data-cursor]');
  const testo = cursor?.querySelector('[data-cursor-text-target]');
  if (!cursor || !conGsap || !mouse.matches) return;
  root.classList.add('ha-cursore');

  let x = 0, y = 0, mosso = false;
  const dur = () => (riduci.matches ? 0.01 : 0.4);
  let xTo = gsap.quickTo(cursor, 'x', { duration: dur(), ease: 'power3.out' });
  let yTo = gsap.quickTo(cursor, 'y', { duration: dur(), ease: 'power3.out' });
  riduci.addEventListener('change', () => {
    xTo = gsap.quickTo(cursor, 'x', { duration: dur(), ease: 'power3.out' });
    yTo = gsap.quickTo(cursor, 'y', { duration: dur(), ease: 'power3.out' });
  });

  const aggiorna = () => {
    const sopra = document.elementFromPoint(x, y)?.closest('[data-cursor-hover]');
    const bordo = x + cursor.offsetWidth >= window.innerWidth;
    cursor.setAttribute('data-cursor', sopra ? (bordo ? 'active-edge' : 'active') : '');
    if (sopra) testo.textContent = sopra.getAttribute('data-cursor-text');
  };
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY; mosso = true;
    xTo(x); yTo(y);
    requestAnimationFrame(aggiorna);
  });
  window.addEventListener('scroll', () => { if (mosso) requestAnimationFrame(aggiorna); }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.setAttribute('data-cursor', ''));
}

/* ---------- queued-scroll-reveal: ogni somma si compone in coda ---------- */
function initSomme() {
  const gruppi = document.querySelectorAll('[data-queued-reveal-group]');
  if (!gruppi.length || !conGsap || riduci.matches) return;
  const coda = [];
  let inCorso = false;
  const travel = css('--coda-travel');
  const dur = durata('--coda-durata');
  const passo = durata('--coda-passo');

  const rivela = (el) => {
    gsap.to(el, { opacity: 1, duration: dur, ease: 'power1.out', clearProps: 'opacity' });
    gsap.to(el, { y: 0, duration: dur, ease: 'expo.out', clearProps: 'transform' });
  };
  const prossimo = () => {
    const el = coda.shift();
    if (!el) { inCorso = false; return; }
    rivela(el);
    gsap.delayedCall(passo, prossimo);
  };

  gruppi.forEach((g) => {
    g.querySelectorAll('[data-queued-reveal-item]').forEach((el) => {
      if (el.getBoundingClientRect().bottom <= 0) return;
      gsap.set(el, { opacity: 0, y: travel }); // solo opacità: i link restano raggiungibili da tastiera
      ScrollTrigger.create({
        trigger: el,
        start: 'top 95%',
        once: true,
        onEnter: () => {
          coda.push(el);
          if (coda.length > 14) rivela(coda.shift());
          if (!inCorso) { inCorso = true; gsap.delayedCall(0.1, prossimo); }
        },
      });
    });
  });
  // Se a pagina aperta si chiede di ridurre il movimento, tutto compare subito
  riduci.addEventListener('change', () => {
    if (!riduci.matches) return;
    gsap.set('[data-queued-reveal-item]', { clearProps: 'opacity,transform' });
  });
}

/* ---------- gradient-wave-text-on-scroll: l'equazione dei valori si accende parola per parola, i + restano oro ---------- */
function initOnda() {
  const frase = document.querySelector('[data-onda]');
  if (!frase || !conGsap) return;

  // Parole in span (i + oro restano fuori: sono i punti fermi della frase)
  [...frase.childNodes].forEach((n) => {
    if (n.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach((pezzo) => {
      if (!pezzo) return;
      if (/^\s+$/.test(pezzo)) { frag.append(pezzo); return; }
      const s = document.createElement('span');
      s.className = 'onda__parola';
      s.textContent = pezzo;
      frag.append(s);
    });
    n.replaceWith(frag);
  });
  const parole = [...frase.querySelectorAll('.onda__parola')];
  const spento = css('--colore-testo-spento-su-scuro');
  const onda = css('--colore-testo-2-su-scuro');
  const fine = css('--colore-testo-su-scuro');

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const accese = new Set();
    const stato = { v: 0 };
    let pronto = false;
    const allinea = () => {
      const n = Math.round(stato.v * parole.length);
      parole.forEach((p, i) => {
        gsap.killTweensOf(p);
        gsap.set(p, { color: i < n ? fine : spento });
        if (i < n) accese.add(p); else accese.delete(p);
      });
    };
    gsap.set(parole, { color: spento });
    gsap.to(stato, {
      v: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: frase, start: 'top 85%', end: 'bottom 45%', scrub: 0.1,
        onRefresh: () => { pronto = false; allinea(); requestAnimationFrame(() => { pronto = true; }); },
      },
      onUpdate: () => {
        if (!pronto) return;
        const n = Math.round(stato.v * parole.length);
        parole.forEach((p, i) => {
          if (i < n && !accese.has(p)) {
            accese.add(p);
            gsap.killTweensOf(p);
            gsap.timeline().to(p, { color: onda, duration: 0.18, ease: 'power2.out' }).to(p, { color: fine, duration: 0.42, ease: 'power2.in' });
          } else if (i >= n && accese.has(p)) {
            accese.delete(p);
            gsap.killTweensOf(p);
            gsap.to(p, { color: spento, duration: 0.3, ease: 'none' });
          }
        });
      },
    });
    return () => gsap.set(parole, { clearProps: 'color' });
  });
}

/* ---------- accordion-css-animation: servizi a indice, il + diventa − ---------- */
function initAccordion() {
  document.querySelectorAll('[data-accordion-css-init]').forEach((acc) => {
    const chiudiAltri = acc.getAttribute('data-accordion-close-siblings') === 'true';
    const imposta = (voce, apri) => {
      voce.setAttribute('data-accordion-status', apri ? 'active' : 'not-active');
      voce.querySelector('[data-accordion-toggle]').setAttribute('aria-expanded', String(apri));
    };
    const apri = (voce) => {
      if (chiudiAltri) acc.querySelectorAll('[data-accordion-status="active"]').forEach((v) => v !== voce && imposta(v, false));
      imposta(voce, true);
    };
    acc.addEventListener('click', (e) => {
      const t = e.target.closest('[data-accordion-toggle]');
      if (!t) return;
      const voce = t.closest('[data-accordion-status]');
      if (voce.getAttribute('data-accordion-status') === 'active') imposta(voce, false); else apri(voce);
    });
    // Le foto della hero aprono il servizio che nominano
    document.querySelectorAll('[data-apri-servizio]').forEach((a) => a.addEventListener('click', () => {
      const voce = document.getElementById(`servizio-${a.getAttribute('data-apri-servizio')}`);
      if (voce) apri(voce);
    }));
  });
}

/* ---------- toggle-open-close-with-javascript: «+ Mostra tutte» (e il profilo dei soci) ---------- */
function initToggle() {
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    const box = btn.closest('[data-toggle-status]');
    if (!box) return;
    btn.addEventListener('click', () => {
      const apri = box.getAttribute('data-toggle-status') !== 'open';
      box.setAttribute('data-toggle-status', apri ? 'open' : 'closed');
      btn.setAttribute('aria-expanded', String(apri));
    });
  });
}

/* ---------- soci: il ritratto apre il profilo sotto la riga (stesso interruttore delle materie) ---------- */
function initSoci() {
  const pannello = document.querySelector('#profilo[data-toggle-status]');
  if (!pannello) return;
  const bottoni = document.querySelectorAll('[data-socio]');
  const voci = pannello.querySelectorAll('[data-profilo]');
  const segna = (btn, aperto) => {
    btn.setAttribute('aria-expanded', String(aperto));
    btn.setAttribute('data-cursor-text', aperto ? 'Chiudi il profilo' : 'Apri il profilo');
  };
  bottoni.forEach((btn) => btn.addEventListener('click', () => {
    const chi = btn.getAttribute('data-socio');
    const giaAperto = btn.getAttribute('aria-expanded') === 'true';
    bottoni.forEach((b) => segna(b, false));
    if (giaAperto) { pannello.setAttribute('data-toggle-status', 'closed'); }
    else {
      voci.forEach((v) => { v.hidden = v.getAttribute('data-profilo') !== chi; });
      pannello.setAttribute('data-toggle-status', 'open');
      segna(btn, true);
      // Se il profilo resta sotto la piega, la pagina lo porta in vista
      if (pannello.getBoundingClientRect().top > window.innerHeight * 0.6) {
        if (lenis) lenis.scrollTo(pannello, { offset: -200, duration: durata('--durata-ancora') });
        else pannello.scrollIntoView({ behavior: riduci.matches ? 'auto' : 'smooth', block: 'center' });
      }
    }
    document.querySelector('[data-cursor-text-target]') && (document.querySelector('[data-cursor-text-target]').textContent = btn.getAttribute('data-cursor-text'));
  }));
  // Esc (dal ritratto o da dentro il profilo) chiude e riporta il focus al ritratto che l'ha aperto
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || pannello.getAttribute('data-toggle-status') !== 'open') return;
    if (!pannello.contains(document.activeElement) && !document.activeElement.matches('[data-socio]')) return;
    const aperto = document.querySelector('[data-socio][aria-expanded="true"]');
    aperto?.click();
    aperto?.focus({ preventScroll: true });
  });
}

/* ---------- filtri dei soci (solo mobile, come nel Figma 390) ---------- */
function initFiltri() {
  const bottoni = document.querySelectorAll('[data-filtro]');
  const main = document.querySelector('main');
  bottoni.forEach((b) => b.addEventListener('click', () => {
    bottoni.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    main.setAttribute('data-filtro', b.getAttribute('data-filtro'));
    if (conGsap) ScrollTrigger.refresh();
  }));
}

/* ---------- magnetic-hover-effect: il grande + segue il cursore di 16 px, senza rimbalzi ---------- */
function initMagnete() {
  if (!conGsap || !mouse.matches) return;
  const max = durata('--magnete-max');
  document.querySelectorAll('[data-magnete]').forEach((zona) => {
    const cerchio = zona.querySelector('[data-magnete-cerchio]');
    const xTo = gsap.quickTo(cerchio, 'x', { duration: 0.8, ease: 'power3.out' });
    const yTo = gsap.quickTo(cerchio, 'y', { duration: 0.8, ease: 'power3.out' });
    zona.addEventListener('mousemove', (e) => {
      if (riduci.matches) return;
      const r = cerchio.getBoundingClientRect();
      const cx = r.left + r.width / 2 - gsap.getProperty(cerchio, 'x');
      const cy = r.top + r.height / 2 - gsap.getProperty(cerchio, 'y');
      const clamp = gsap.utils.clamp(-max, max);
      xTo(clamp(((e.clientX - cx) / (r.width / 2)) * max));
      yTo(clamp(((e.clientY - cy) / (r.height / 2)) * max));
    });
    zona.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- copia l'email (riga «Email» del mobile) ---------- */
function initCopiaEmail() {
  document.querySelectorAll('[data-copia-email]').forEach((btn) => {
    const valore = btn.querySelector('[data-copia-esito]');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.getAttribute('data-copia-email'));
        valore.textContent = 'Indirizzo copiato';
      } catch (e) {
        location.href = `mailto:${btn.getAttribute('data-copia-email')}`;
        return;
      }
      setTimeout(() => { valore.textContent = btn.getAttribute('data-copia-email'); }, 2000);
    });
  });
}

/* ---------- live-form-validation-basic (come la F): valida, non invia ---------- */
function initModulo() {
  document.querySelectorAll('[data-form-validate]').forEach((form) => {
    const gruppi = form.querySelectorAll('[data-validate]');
    const esito = form.querySelector('[data-form-esito]');
    const campo = (g) => g.querySelector('input, textarea');
    const valido = (g) => {
      const input = campo(g);
      if (input.type === 'checkbox') return input.checked;
      const v = input.value.trim();
      if (input.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return v.length >= (parseInt(input.getAttribute('minlength'), 10) || 1);
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
