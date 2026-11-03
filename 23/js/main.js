// Martone & Martone · opzione 23 «Indice» (Tendina), Versione 2
// Blocchi di osmo.supply adattati al progetto (licenza Osmo: uso nei progetti dei clienti, non ridistribuire).
// Originali e note in osmo/<slug>/.

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopHover = window.matchMedia('(hover: hover) and (min-width: 992px)');
const conGsap = typeof window.gsap !== 'undefined';

// Pausa globale delle animazioni continue (WCAG 2.2.2): bottone «Ferma le animazioni» o «riduci movimento»
const moto = {
  fermo: false,
  ascolta: [],
  ok() { return !this.fermo && !riduci.matches; },
  avvisa() { this.ascolta.forEach((fn) => fn(this.ok())); },
};
riduci.addEventListener('change', () => moto.avvisa());

const durata = (nome) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(nome));
let lenis = null;

document.addEventListener('DOMContentLoaded', () => {
  if (conGsap) {
    document.documentElement.classList.add('gsap');
    gsap.registerPlugin(ScrollTrigger, SplitText);
  }
  initLinkDemo();
  initFermaAnimazioni();
  initLenis();
  initMenu();
  initAvanza();
  initMaskedTextReveal();
  initFile();
  initTitoliFissi();
  initAree();
  initServizi();
  initCopyEmail();
  initCurrentTime();
  initFormValidation();
  initFooterParallax();
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

  // Ancore della stessa pagina: le porta Lenis, con l'altezza della testata (lo skip link resta nativo)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.matches('.salta')) return;
    if (a.pathname !== location.pathname || !a.hash) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    const offset = target.id === 'studio' ? -target.offsetTop : -durata('--testata-h');
    if (lenis) lenis.scrollTo(target, { offset, duration: durata('--durata-ancora') });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset });
    history.pushState(null, '', a.hash);
  });
}

// Tab che gira dentro un pannello aperto (menu, profilo): dall'ultimo elemento si torna al primo e viceversa
const FOCUSABILI = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
function giraFocus(e, elementi) {
  if (e.key !== 'Tab') return;
  const el = elementi.filter((x) => !x.closest('[inert]') && x.getClientRects().length);
  if (!el.length) return;
  const i = el.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); el[el.length - 1].focus(); }
  else if (!e.shiftKey && (i === -1 || i === el.length - 1)) { e.preventDefault(); el[0].focus(); }
}

// Menu aperto e profilo: pagina ferma (con Lenis attivo anche la rotella, se no basta overflow)
function bloccaScroll(si) {
  document.documentElement.classList.toggle('scroll-bloccato', si);
  if (si) lenis?.stop(); else lenis?.start();
}

/* ---------- bold-full-screen-navigation ---------- */
// Come l'originale: stato su [data-navigation-status], la CSS fa tutto. Aggiunti inert, aria-expanded, focus ed Esc.
function initMenu() {
  const menu = document.querySelector('[data-navigation-status]');
  const toggle = document.querySelector('[data-navigation-toggle="toggle"]');
  if (!menu || !toggle) return;
  const testo = toggle.querySelector('[data-menu-testo]');
  const icona = toggle.querySelector('[data-menu-icona]');
  const aperto = () => menu.getAttribute('data-navigation-status') === 'active';
  // Menu aperto: il resto della pagina è inert (resta attivo l'header col bottone «Chiudi»)
  const resto = [...document.body.children].filter((el) => el !== menu && !el.contains(toggle) && !['SCRIPT', 'DIALOG'].includes(el.tagName));
  const imposta = (apri) => {
    menu.setAttribute('data-navigation-status', apri ? 'active' : 'not-active');
    menu.inert = !apri;
    resto.forEach((el) => { el.inert = apri; });
    document.documentElement.classList.toggle('menu-aperto', apri);
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
    if (aperto()) giraFocus(e, [toggle, ...menu.querySelectorAll(FOCUSABILI)]);
  });
}

/* ---------- onepage-progress-navigation ---------- */
// Come l'originale: un ScrollTrigger per sezione ('0% 50%' → '100% 50%') sposta l'indicatore sulla tappa.
// In più, come nel Figma: le tappe già passate tengono il nome, e su mobile la stessa logica muove la barra «01 / 06 · Studio».
function initAvanza() {
  const lista = document.querySelector('[data-progress-nav-list]');
  if (!lista || !conGsap) return;
  const tappe = Array.from(lista.querySelectorAll('[data-progress-nav-target]'));
  const nomi = tappe.map((t) => t.querySelector('.avanza__nome'));
  const ind = lista.querySelector('.avanza__indicatore');
  const riempi = document.querySelector('[data-avanza-riempi]');
  const numEl = document.querySelector('[data-avanza-num]');
  const nomeEl = document.querySelector('[data-avanza-nome]');
  const totEl = document.querySelector('[data-avanza-totale]');
  const due = (n) => String(n).padStart(2, '0');
  if (totEl) totEl.textContent = due(tappe.length);
  let attiva = -1;
  // posizione della tappa nella pillola, al sottopixel (offsetLeft arrotonda)
  const misura = (t) => {
    const r = t.getBoundingClientRect();
    return { x: r.left - lista.getBoundingClientRect().left, w: r.width };
  };

  const vai = (i, subito) => {
    if (i === attiva) return;
    attiva = i;
    const d = subito || !moto.ok() ? 0 : durata('--dur-indicatore');
    gsap.killTweensOf([...nomi, ind]);
    const prima = nomi.map((n) => n.offsetWidth);
    gsap.set(nomi, { clearProps: 'width' });
    tappe.forEach((t, k) => {
      t.classList.toggle('is--active', k === i);
      t.classList.toggle('is--visto', k <= i);
      if (k === i) t.setAttribute('aria-current', 'location'); else t.removeAttribute('aria-current');
    });
    // misure finali prima dei fromTo, che rimettono subito le larghezze di partenza
    const dopo = nomi.map((n) => n.offsetWidth);
    const { x, w } = misura(tappe[i]);
    nomi.forEach((n, k) => {
      if (prima[k] !== dopo[k]) gsap.fromTo(n, { width: prima[k] }, { width: dopo[k], duration: d, ease: 'expo.out', clearProps: 'width' });
    });
    gsap.to(ind, { x, width: w, duration: d, ease: 'expo.out' });
    if (riempi) riempi.style.width = `${((i + 1) / tappe.length) * 100}%`;
    if (numEl) numEl.textContent = due(i + 1);
    if (nomeEl) nomeEl.textContent = nomi[i].textContent;
  };

  tappe.forEach((tappa, i) => {
    const sezione = document.querySelector(tappa.getAttribute('data-progress-nav-target'));
    if (!sezione) return;
    ScrollTrigger.create({
      trigger: sezione,
      start: '0% 50%',
      end: '100% 50%',
      onEnter: () => vai(i),
      onEnterBack: () => vai(i),
    });
  });
  vai(0, true);
  // dopo il caricamento dei font o un resize l'indicatore si riallinea senza animare
  ScrollTrigger.addEventListener('refresh', () => {
    const t = tappe[attiva];
    if (t) { const { x, w } = misura(t); gsap.set(ind, { x, width: w }); }
  });
}

/* ---------- masked-text-reveal ---------- */
function initMaskedTextReveal() {
  const titoli = document.querySelectorAll('[data-split="heading"]');
  if (!titoli.length) return;
  if (!conGsap) { titoli.forEach((t) => { t.style.visibility = 'visible'; }); return; }
  const via = () => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set(titoli, { autoAlpha: 1 }); });
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      titoli.forEach((heading) => {
        gsap.set(heading, { autoAlpha: 1 });
        SplitText.create(heading, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          linesClass: 'line',
          // in vista al caricamento parte subito (versione «base» del blocco), se no allo scroll; una volta sola
          onSplit(inst) {
            if (heading.dataset.rivelato) return null;
            heading.dataset.rivelato = '1';
            const anim = { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'expo.out' };
            if (heading.getBoundingClientRect().top < window.innerHeight * 0.8) return gsap.from(inst.lines, { ...anim, stagger: 0.1, delay: 0.15 });
            return gsap.from(inst.lines, { ...anim, scrollTrigger: { trigger: heading, start: 'clamp(top 80%)', once: true } });
          },
        });
      });
    });
  };
  if (document.fonts) document.fonts.ready.then(via); else via();
}

/* ---------- marquee-with-scroll-direction ---------- */
// Logica dell'originale (collezione clonata, tween in loop, verso che si inverte con lo scorrimento, spinta in vw durante lo scroll).
// Differenze: a riposo la fila va nel verso del suo attributo; si ferma fuori schermo, con «riduci movimento» e con «Ferma le animazioni».
function initFile() {
  if (!conGsap) return;
  document.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((fila) => {
    const coll = fila.querySelector('[data-marquee-collection-target]');
    const scroll = fila.querySelector('[data-marquee-scroll-target]');
    if (!coll || !scroll) return;
    const { marqueeSpeed, marqueeDirection, marqueeDuplicate, marqueeScrollSpeed } = fila.dataset;
    const base = marqueeDirection === 'right' ? -1 : 1; // timeScale positivo = verso sinistra
    const spinta = parseFloat(marqueeScrollSpeed);
    for (let i = 0; i < parseInt(marqueeDuplicate || 0, 10); i++) {
      const copia = coll.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      scroll.appendChild(copia);
    }
    const colls = fila.querySelectorAll('[data-marquee-collection-target]');
    scroll.style.marginLeft = `${-spinta}%`;
    scroll.style.width = `${spinta * 2 + 100}%`;
    const molt = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
    const anim = gsap.to(colls, { xPercent: -100, repeat: -1, duration: parseFloat(marqueeSpeed) * (coll.offsetWidth / window.innerWidth) * molt, ease: 'none' }).totalProgress(0.5);
    let verso = base;
    let inVista = false;
    const stato = () => {
      if (moto.ok() && inVista) { anim.timeScale(verso); anim.play(); } else anim.pause();
    };

    ScrollTrigger.create({
      trigger: fila,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { inVista = self.isActive; stato(); },
      onUpdate: (self) => {
        verso = self.direction === 1 ? base : -base;
        fila.setAttribute('data-marquee-status', verso === base ? 'normal' : 'inverted');
        stato();
      },
    });

    const spingi = gsap.timeline({ scrollTrigger: { trigger: fila, start: '0% 100%', end: '100% 0%', scrub: 0 } })
      .fromTo(scroll, { x: `${base * spinta}vw` }, { x: `${-base * spinta}vw`, ease: 'none' });
    const accendi = (ok) => {
      spingi.scrollTrigger[ok ? 'enable' : 'disable'](false);
      if (!ok) gsap.set(scroll, { x: 0 });
      stato();
    };
    accendi(moto.ok());
    moto.ascolta.push(accendi);
  });
}

/* ---------- sticky-title-scroll-effect ---------- */
// Struttura dell'originale (contenitore alto, titoli impilati, timeline con scrub). Nel Figma della 23 il passaggio è diverso:
// «Il metodo.» resta fermo mentre scorre il testo, poi «I valori.» sale e si posa al suo posto e il primo esce in alto.
function initTitoliFissi() {
  if (!conGsap) return;
  const wrap = document.querySelector('[data-sticky-title="wrap"]');
  if (!wrap) return;
  const [primo, secondo] = wrap.querySelectorAll('[data-sticky-title="heading"]');
  const valori = wrap.querySelector('[data-sticky-title="valori"]');
  const colore = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const passo = () => secondo.offsetTop - primo.offsetTop;
    gsap.timeline({ scrollTrigger: { trigger: valori, start: 'top 80%', end: 'top 35%', scrub: true, invalidateOnRefresh: true } })
      .to([primo, secondo], { y: () => -passo(), ease: 'none' }, 0)
      .to(primo, { color: colore('--acciaio'), opacity: 0.55, ease: 'none' }, 0)
      .to(secondo, { color: colore('--inchiostro'), ease: 'none' }, 0);
  });
}

/* ---------- image-preview-cursor-follower ---------- */
// Logica dell'originale (quickTo sul mouse, foto clonata che entra ed esce in verticale secondo il verso).
// Adattata al Figma: la foto è 360×260 con l'angolo in basso a sinistra sul puntatore, e la riga sotto il mouse si apre col testo.
// Su mobile niente cursore: la riga si apre al tocco e la foto è dentro la riga.
function initAree() {
  document.querySelectorAll('[data-follower-wrap]').forEach((wrap) => {
    const collezione = wrap.querySelector('[data-follower-collection]');
    const voci = Array.from(wrap.querySelectorAll('[data-follower-item]'));
    const segui = wrap.querySelector('[data-follower-cursor]');
    const dentro = wrap.querySelector('[data-follower-cursor-inner]');
    const apri = (voce, si) => {
      voce.classList.toggle('is--aperta', si);
      voce.querySelector('.area__apri')?.setAttribute('aria-expanded', String(si));
    };
    const soloQuesta = (voce) => voci.forEach((v) => apri(v, v === voce));
    // su mobile parte aperta la riga d'esempio del Figma
    if (!desktopHover.matches) voci.forEach((v) => { if (v.hasAttribute('data-aperto-mobile')) apri(v, true); });

    voci.forEach((voce) => {
      const btn = voce.querySelector('.area__apri');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        // soci: sul desktop il clic apre il profilo (initProfilo). Aree: col mouse la riga si apre già al passaggio,
        // il clic conta da tastiera e al tocco
        if (desktopHover.matches && (voce.classList.contains('socio') || e.detail > 0)) return;
        const si = !voce.classList.contains('is--aperta');
        voci.forEach((v) => apri(v, v === voce && si));
      });
    });

    if (!conGsap || !segui) return;
    let prev = null;
    let primo = true;
    const offset = 100;
    const ease = 'power2.inOut';
    const dur = () => (moto.ok() ? 0.5 : 0);
    gsap.set(segui, { xPercent: 0, yPercent: -100 });
    const xTo = gsap.quickTo(segui, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(segui, 'y', { duration: 0.6, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      if (moto.ok()) { xTo(e.clientX); yTo(e.clientY); } else gsap.set(segui, { x: e.clientX, y: e.clientY });
    });

    const togli = (dir) => dentro.querySelectorAll('[data-follower-visual]').forEach((el) => {
      gsap.killTweensOf(el);
      gsap.to(el, { yPercent: dir, duration: dur(), ease, overwrite: 'auto', onComplete: () => el.remove() });
    });
    const mostra = (voce, index) => {
      const avanti = prev === null || index > prev;
      prev = index;
      togli(avanti ? -offset : offset);
      const visual = voce.querySelector('[data-follower-visual]');
      if (!visual) return;
      const clone = visual.cloneNode(true);
      clone.removeAttribute('loading');
      clone.removeAttribute('class');
      clone.alt = '';
      dentro.appendChild(clone);
      if (!primo) gsap.fromTo(clone, { yPercent: avanti ? offset : -offset }, { yPercent: 0, duration: dur(), ease, overwrite: 'auto' });
      primo = false;
    };

    voci.forEach((voce, index) => {
      voce.addEventListener('mouseenter', () => {
        if (!desktopHover.matches) return;
        if (voce.classList.contains('area')) soloQuesta(voce);
        segui.classList.add('is--attivo');
        mostra(voce, index);
      });
    });
    collezione.addEventListener('mouseleave', () => {
      if (!desktopHover.matches) return;
      segui.classList.remove('is--attivo');
      voci.forEach((v) => { if (v.classList.contains('area')) apri(v, false); });
      dentro.querySelectorAll('[data-follower-visual]').forEach((el) => { gsap.killTweensOf(el); gsap.delayedCall(0.5, () => el.remove()); });
      primo = true;
      prev = null;
    });
  });
}

/* ---------- directional-list-hover ---------- */
// Logica dell'originale (lato d'ingresso, tile fuori da quel lato senza transizione, reflow, poi a 0).
// In più: la riga «piena» cambia i colori del testo; su mobile il tocco riempie la riga e la apre (una alla volta).
function initServizi() {
  // 101%: a 100% il bordo del tile resta visibile come un filo sull'angolo arrotondato
  const fuori = { top: 'translateY(-101%)', bottom: 'translateY(101%)', left: 'translateX(-101%)', right: 'translateX(101%)' };
  document.querySelectorAll('[data-directional-hover]').forEach((container) => {
    const type = container.getAttribute('data-type') || 'all';
    const items = Array.from(container.querySelectorAll('[data-directional-hover-item]'));
    const lato = (e, el) => {
      const { left, top, width: w, height: h } = el.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      if (type === 'y') return y < h / 2 ? 'top' : 'bottom';
      if (type === 'x') return x < w / 2 ? 'left' : 'right';
      return Object.entries({ top: y, right: w - x, bottom: h - y, left: x }).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    };
    const entra = (item, d) => {
      const tile = item.querySelector('[data-directional-hover-tile]');
      tile.style.transition = 'none';
      tile.style.transform = fuori[d];
      void tile.offsetHeight;
      tile.style.transition = '';
      tile.style.transform = 'translate(0%, 0%)';
      item.setAttribute('data-status', `enter-${d}`);
      item.classList.add('is--pieno');
    };
    const esce = (item, d) => {
      item.querySelector('[data-directional-hover-tile]').style.transform = fuori[d];
      item.setAttribute('data-status', `leave-${d}`);
      item.classList.remove('is--pieno');
    };
    // su mobile parte aperta la riga d'esempio del Figma
    if (!desktopHover.matches) items.forEach((item) => {
      if (!item.hasAttribute('data-aperto-mobile')) return;
      item.classList.add('is--aperto');
      item.querySelector('.servizio__apri')?.setAttribute('aria-expanded', 'true');
      entra(item, 'top');
    });
    items.forEach((item) => {
      item.addEventListener('mouseenter', (e) => { if (desktopHover.matches) entra(item, lato(e, item)); });
      item.addEventListener('mouseleave', (e) => { if (desktopHover.matches) esce(item, lato(e, item)); });
      // al tocco la riga si riempie dall'alto e si svuota quando si alza il dito
      item.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch' || item.classList.contains('is--aperto')) return;
        entra(item, 'top');
        const fine = () => {
          setTimeout(() => { if (!item.classList.contains('is--aperto')) esce(item, 'bottom'); }, 350);
          window.removeEventListener('pointerup', fine);
          window.removeEventListener('pointercancel', fine);
        };
        window.addEventListener('pointerup', fine);
        window.addEventListener('pointercancel', fine);
      });
      const btn = item.querySelector('.servizio__apri');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const si = !item.classList.contains('is--aperto');
        items.forEach((altro) => {
          const on = altro === item && si;
          if (altro.classList.contains('is--aperto') && !on) esce(altro, 'top');
          altro.classList.toggle('is--aperto', on);
          altro.querySelector('.servizio__apri')?.setAttribute('aria-expanded', String(on));
        });
        if (si) entra(item, 'top');
      });
    });
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

/* ---------- basic-modal-setup (pagina soci) ---------- */
// Stato aperto/chiuso dell'originale, ma su <dialog>: focus dentro, Esc e sfondo inerte li dà il browser.
// La tendina navy entra da destra sopra la foto (su mobile la scheda sale dal basso).
function initProfilo() {
  const dialog = document.querySelector('[data-modal]');
  if (!dialog) return;
  const nome = dialog.querySelector('[data-profilo-nome]');
  const ruolo = dialog.querySelector('[data-profilo-ruolo]');
  const gruppo = dialog.querySelector('[data-profilo-gruppo]');
  const foto = dialog.querySelector('[data-profilo-foto]');

  document.querySelectorAll('[data-profilo]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      // su mobile la riga del socio si apre (initAree); il profilo parte da «Scopri il profilo»
      if (trigger.classList.contains('area__apri') && !desktopHover.matches) return;
      nome.textContent = trigger.dataset.nome;
      ruolo.textContent = trigger.dataset.ruolo;
      gruppo.textContent = trigger.dataset.gruppo;
      compilaBio(dialog, trigger);
      foto.src = trigger.dataset.foto;
      if (dialog.open) return;
      dialog.showModal();
      bloccaScroll(true);
      requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is--aperto')));
    });
  });
  dialog.addEventListener('close', () => { dialog.classList.remove('is--aperto'); bloccaScroll(false); });
  dialog.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('keydown', (e) => giraFocus(e, [...dialog.querySelectorAll(FOCUSABILI)]));
}
