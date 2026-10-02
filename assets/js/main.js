/* =========================================================
   ANTMANWEB v2 — interacciones y coreografía de scroll
   ========================================================= */
(function () {
  'use strict';

  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const Q = window.Quantum || { set() {} };
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (reduced) html.classList.add('reduced');
  let closeMenu = () => {};

  // la experiencia empieza siempre desde arriba (tamaño real)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  /* ---------- Split text en palabras + letras ---------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach((word, wi, arr) => {
      const w = document.createElement('span');
      w.className = 'wd';
      w.setAttribute('aria-hidden', 'true');
      [...word].forEach(ch => {
        const c = document.createElement('span');
        c.className = 'ch';
        c.textContent = ch;
        w.appendChild(c);
      });
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('[data-split]').forEach(splitChars);

  // palabras del manifiesto (preserva los <span class="hl">)
  $$('[data-words]').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('hl')) { n.classList.add('w'); } else walk(n);
        }
      });
    };
    walk(el);
  });

  /* ---------- Sin GSAP: fallback limpio ---------- */
  if (!hasGsap) {
    const l = $('.loader'); if (l) l.remove();
    $$('.manifesto__text .w').forEach(w => w.style.opacity = 1);
    html.classList.add('reduced');
    initMenu(null);
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  if (!reduced) html.classList.add('anim');

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 2, easing: t => 1 - Math.pow(1 - t, 4) });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2 && id !== '#') return;
      const target = id === '#top' || id === '#' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    });
  });

  /* ---------- Menú móvil ---------- */
  function initMenu(lenisRef) {
    const burger = $('.nav__burger');
    const menu = $('.menu');
    if (!burger || !menu) return;
    const set = open => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', !open);
      if (lenisRef) open ? lenisRef.stop() : lenisRef.start();
    };
    burger.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    closeMenu = () => { if (document.body.classList.contains('menu-open')) set(false); };
  }
  initMenu(lenis);

  /* ---------- Cursor personalizado ---------- */
  const cursor = $('.cursor');
  if (finePointer && cursor && !reduced) {
    html.classList.add('has-cursor');
    const dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    gsap.set([dot, ring], { x: innerWidth / 2, y: innerHeight / 2 });
    window.addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: .3 }));
    document.addEventListener('pointerenter', () => gsap.to(cursor, { opacity: 1, duration: .3 }));

    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, .chips li');
      if (!t) return;
      const txt = t.getAttribute('data-cursor');
      if (txt) { label.textContent = txt; cursor.classList.add('has-label'); }
      else cursor.classList.add('is-hover');
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor], a, button, .chips li');
      if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      cursor.classList.remove('has-label', 'is-hover');
    });
  }

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach(el => {
      const strength = el.classList.contains('contact__orb') ? .45 : .3;
      const xTo = gsap.quickTo(el, 'x', { duration: .8, ease: 'elastic.out(1, .4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .8, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Texto scramble en el nav ---------- */
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#ΔΣΩµ01';
  $$('[data-scramble]').forEach(a => {
    const node = [...a.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const original = node.textContent;
    let raf, frame = 0;
    a.addEventListener('mouseenter', () => {
      cancelAnimationFrame(raf); frame = 0;
      const tick = () => {
        const progress = frame / 18;
        node.textContent = [...original].map((c, i) =>
          c === ' ' ? ' ' : (i < progress * original.length ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
        ).join('');
        frame++;
        if (progress < 1) raf = requestAnimationFrame(tick); else node.textContent = original;
      };
      tick();
    });
  });

  /* ---------- Tarjetas: spotlight + tilt ---------- */
  $$('.tcard').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
  if (finePointer && !reduced) {
    $$('.pcard__link').forEach(card => {
      const rxTo = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' });
      const ryTo = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        ryTo(((e.clientX - r.left) / r.width - .5) * 10);
        rxTo(-((e.clientY - r.top) / r.height - .5) * 10);
      });
      card.addEventListener('pointerleave', () => { rxTo(0); ryTo(0); });
    });
  }

  /* ---------- HUD ---------- */
  const hudScale = $('[data-hud-scale]');
  const hudIndex = $('[data-hud-index]');
  const hudBar = $('.hud__progress span');
  let lastScale = '';
  function setScale(v) {
    if (!hudScale || v === lastScale) return;
    lastScale = v;
    hudScale.textContent = v;
    gsap.fromTo(hudScale, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
  }
  $$('[data-section]').forEach(sec => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: self => {
        if (!self.isActive) return;
        if (hudIndex) hudIndex.textContent = sec.dataset.section;
        if (sec.dataset.scale) setScale(sec.dataset.scale);
        $$('.nav__links a').forEach(a => a.classList.toggle('is-active', sec.id && a.getAttribute('href') === '#' + sec.id));
      }
    });
  });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => { if (hudBar) hudBar.style.transform = `scaleY(${self.progress})`; }
  });

  /* ---------- Nav: ocultar al bajar ---------- */
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (document.body.classList.contains('menu-open')) return;
      nav.classList.toggle('is-hidden', self.direction === 1 && y > innerHeight * .8);
    }
  });

  /* ---------- Velocidad de scroll -> partículas + marquee ---------- */
  let velocity = 0;
  if (lenis) lenis.on('scroll', e => { velocity = e.velocity; });

  /* ---------- Marquee infinito con inercia ---------- */
  $$('.marquee__row').forEach((row, i) => {
    const track = $('.marquee__track', row);
    // clona hasta cubrir 2x el ancho
    const base = track.innerHTML;
    track.innerHTML = base + base + base + base;
    const dir = row.classList.contains('marquee__row--rev') ? 1 : -1;
    let x = 0;
    gsap.ticker.add((t, dtMs) => {
      const w = track.scrollWidth / 4;
      const dt = Math.min(dtMs, 50) / 1000;
      const speed = (60 + Math.min(Math.abs(velocity) * 40, 900)) * (reduced ? 0 : 1);
      x += dir * speed * dt;
      if (x <= -w) x += w;
      if (x >= 0) x -= w;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });

  /* ---------- Bucle: alimenta el campo cuántico ---------- */
  gsap.ticker.add(() => {
    Q.set({ boost: Math.min(Math.abs(velocity) / 80, .8) });
    velocity *= .92;
  });

  if (reduced) {
    // Sin coreografía: todo visible y estático
    const l = $('.loader'); if (l) l.remove();
    $$('.manifesto__text .w').forEach(w => w.style.opacity = 1);
    return;
  }

  /* =========================================================
     LOADER + INTRO
     ========================================================= */
  const loader = $('.loader');
  const num = $('.loader__num');
  const bar = $('.loader__bar span');
  const counter = { v: 0 };
  Q.set({ opacity: 0 });

  const assetsReady = new Promise(res => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
    setTimeout(res, 4000);
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  const loadTl = gsap.timeline({ paused: true })
    .to(counter, {
      v: 100, duration: 2.2, ease: 'power3.inOut',
      onUpdate: () => {
        const v = Math.round(counter.v);
        num.textContent = String(v).padStart(3, '0');
        bar.style.transform = `scaleX(${counter.v / 100})`;
      }
    });

  // el contador avanza y, si aún falta algo por cargar, espera en ~80%
  let ready = false;
  loadTl.call(() => { if (!ready) loadTl.pause(); }, null, 1.6);
  loadTl.play();
  Promise.all([assetsReady, fontsReady]).then(() => {
    ready = true;
    if (loadTl.paused()) gsap.delayedCall(.15, () => loadTl.play());
  });
  loadTl.eventCallback('onComplete', intro);

  function intro() {
    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    tl.to('.loader__inner', { opacity: 0, scale: .6, filter: 'blur(10px)', duration: .6, ease: 'power3.in' })
      .add(() => Q.set({ opacity: scrollY > innerHeight * 3 ? .35 : 1, warp: 1.2 }), '-=.2')
      .to('.loader__panel--top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '<')
      .to('.loader__panel--bottom', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
      .add(() => Q.set({ warp: 0 }), '-=.6')
      .to('.hero .hero__line .ch', { y: 0, duration: 1.3, ease: 'expo.out', stagger: .035 }, '-=.75')
      .fromTo('.hero__mascot', { opacity: 0, scale: .05, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.6, ease: 'elastic.out(1, .6)' }, '-=1.1')
      .fromTo('.reveal-line', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .1 }, '-=1.3')
      .fromTo(['.hero__meta', '.hero__actions', '.hero__scroll'], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .1 }, '-=1');
  }

  /* =========================================================
     HERO — parallax al salir
     ========================================================= */
  const heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  heroTl
    .to('.hero__line:first-child', { xPercent: -18, ease: 'none' }, 0)
    .to('.hero__line--outline', { xPercent: 14, ease: 'none' }, 0)
    .to('.hero__mascot', { scale: .25, yPercent: 60, rotate: 25, opacity: 0, ease: 'none' }, 0)
    .to('.hero__bottom', { y: -80, opacity: 0, ease: 'none' }, 0);

  // contorno del título se rellena al pasar el ratón
  $$('.hero__line--outline .ch').forEach(ch => {
    ch.addEventListener('pointerenter', () => {
      gsap.fromTo(ch, { color: '#ff2a3d' }, { color: 'rgba(0,0,0,0)', duration: 1.4, ease: 'power2.out' });
    });
  });

  // mascota sigue ligeramente al ratón
  if (finePointer) {
    const m = $('.hero__mascot img');
    const mx = gsap.quickTo(m, 'x', { duration: 1.2, ease: 'power3' });
    const my = gsap.quickTo(m, 'y', { duration: 1.2, ease: 'power3' });
    window.addEventListener('pointermove', e => {
      mx((e.clientX / innerWidth - .5) * 40);
      my((e.clientY / innerHeight - .5) * 30);
    }, { passive: true });
  }

  /* =========================================================
     MANIFIESTO — palabras se encienden con el scroll
     ========================================================= */
  gsap.to('.manifesto__text .w', {
    opacity: 1, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  ScrollTrigger.create({
    trigger: '.manifesto', start: 'top bottom', end: 'bottom top',
    onUpdate: s => Q.set({ opacity: 1 - s.progress * .45 })
  });

  /* =========================================================
     SCALE DIVE — viaje a través de las escalas
     ========================================================= */
  const layers = $$('.dive__layer');
  const rings = $$('.dive__rings i');
  const diveTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.dive', start: 'top top', end: 'bottom bottom', scrub: 1,
      onUpdate: s => {
        Q.set({ dive: s.progress, opacity: .55 + Math.sin(s.progress * Math.PI) * .45 });
        const idx = Math.min(layers.length - 1, Math.floor(s.progress * layers.length * 1.02));
        setScale(layers[idx].dataset.diveScale);
      },
      onLeave: () => Q.set({ dive: 0, opacity: .45 }),
      onEnterBack: () => Q.set({ opacity: 1 })
    }
  });
  const seg = 1;
  layers.forEach((layer, i) => {
    const at = i * seg;
    const last = i === layers.length - 1;
    if (i === 0) diveTl.fromTo(layer, { scale: .7, opacity: .25 }, { scale: 1, opacity: 1, duration: seg * .3 }, 0);
    else diveTl.fromTo(layer, { scale: .12, opacity: 0 }, { scale: 1, opacity: 1, duration: seg * .45 }, at);
    if (!last) diveTl.to(layer, { scale: 7, opacity: 0, duration: seg * .55, ease: 'power1.in' }, at + seg * .5);
    else diveTl.to(layer, { scale: 1.08, duration: seg * .55 }, at + seg * .45);
  });
  const ringDur = layers.length * seg * .5;
  rings.forEach((r, i) => {
    const at = i * (layers.length * seg / rings.length) * .8;
    diveTl.fromTo(r, { scale: .2 }, { scale: 9, duration: ringDur, ease: 'power1.in' }, at);
    diveTl.fromTo(r, { opacity: 0 }, { keyframes: { opacity: [0, .9, 0] }, duration: ringDur }, at);
  });

  /* =========================================================
     TÍTULOS DE SECCIÓN
     ========================================================= */
  $$('.section-head').forEach(head => {
    const chars = $$('.ch', head);
    const line = $('.section-head__line', head);
    const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%' } });
    tl.to(chars, { y: 0, duration: 1.1, ease: 'expo.out', stagger: .03 });
    if (line) tl.from(line, { scaleX: 0, duration: 1.4, ease: 'expo.out' }, '<.2');
    tl.from($('.section-head__num', head), { opacity: 0, x: -20, duration: .8 }, '<');
  });

  /* =========================================================
     ABOUT
     ========================================================= */
  gsap.fromTo('.about__photo-frame',
    { clipPath: 'inset(100% 0% 0% 0% round 20px)' },
    { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.about__photo', start: 'top 80%' } });
  gsap.fromTo('.about__photo-frame img', { yPercent: -12, scale: 1.25 }, {
    yPercent: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.from('.about__badge', { scale: 0, rotate: -180, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.about__photo', start: 'top 60%' } });
  gsap.from(['.about__big', '.about__text', '.stats'], {
    y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '.about__content', start: 'top 80%' }
  });
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 2, ease: 'power2.out',
      onUpdate: () => el.textContent = Math.round(o.v),
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  /* =========================================================
     STACK
     ========================================================= */
  gsap.from('.atom', {
    scale: .2, opacity: 0, rotate: -90, duration: 1.8, ease: 'expo.out',
    scrollTrigger: { trigger: '.stack__grid', start: 'top 75%' }
  });
  gsap.from('.tcard', {
    y: 80, opacity: 0, rotateX: -25, transformOrigin: '50% 100%', duration: 1.2, ease: 'power4.out', stagger: .1,
    scrollTrigger: { trigger: '.stack__cards', start: 'top 80%' }
  });
  gsap.fromTo('.marquee', { rotate: -8, scale: 1.1 }, {
    rotate: 2, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  /* =========================================================
     PROYECTOS — scroll horizontal (desktop) / apilado (móvil)
     ========================================================= */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 641px)', () => {
    const track = $('.projects__track');
    const pin = $('.projects__pin');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: () => '+=' + dist(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: s => { $('.projects__bar span').style.transform = `scaleX(${s.progress})`; }
      }
    });
    $$('.pcard').forEach(card => {
      gsap.from($('.pcard__art', card), {
        clipPath: 'inset(0 0 0 100%)', ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 55%', scrub: true }
      });
    });
    return () => gsap.set(track, { clearProps: 'x' });
  });
  mm.add('(max-width: 640px)', () => {
    $$('.pcard').forEach(card => {
      gsap.from(card, { y: 80, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    });
  });

  /* =========================================================
     TRAYECTO
     ========================================================= */
  gsap.to('.timeline__line span', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: true }
  });
  $$('.tl-item').forEach(item => {
    gsap.from(item.children, {
      x: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08,
      scrollTrigger: { trigger: item, start: 'top 80%' }
    });
    ScrollTrigger.create({
      trigger: item, start: 'top 60%',
      onEnter: () => item.classList.add('is-on'),
      onLeaveBack: () => item.classList.remove('is-on')
    });
  });

  /* =========================================================
     CONTACTO + FOOTER
     ========================================================= */
  gsap.to('.contact__title .ch', {
    y: 0, duration: 1.2, ease: 'expo.out', stagger: .025,
    scrollTrigger: { trigger: '.contact__title', start: 'top 80%' }
  });
  gsap.from('.contact__orb', { scale: 0, rotate: 120, duration: 1.6, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: '.contact__orb', start: 'top 90%' } });
  gsap.from('.social', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: '.socials', start: 'top 95%' } });
  ScrollTrigger.create({
    trigger: '.contact', start: 'top 70%', end: 'bottom bottom',
    onEnter: () => Q.set({ opacity: .9, warp: .25 }),
    onLeaveBack: () => Q.set({ opacity: .45, warp: 0 })
  });
  gsap.from('.footer__big', {
    yPercent: 60, scale: .7, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
  });

  /* =========================================================
     EASTER EGG — "Modo Hormiga": la web entera se encoge
     ========================================================= */
  const mascot = $('.hero__mascot');
  let shrinking = false;
  function shrinkWorld() {
    if (shrinking) return;
    shrinking = true;
    const main = $('main');
    const y = (lenis ? lenis.scroll : scrollY);
    const origin = `50% ${y + innerHeight / 2}px`;
    if (lenis) lenis.stop();
    Q.set({ warp: 1.4 });
    setScale('1 mm');
    gsap.timeline({ onComplete: () => { shrinking = false; if (lenis) lenis.start(); gsap.set(main, { clearProps: 'transform,filter' }); } })
      .to(main, { scale: .04, rotate: 8, filter: 'blur(2px)', transformOrigin: origin, duration: 1.1, ease: 'expo.in' })
      .add(() => { Q.set({ warp: 0 }); setScale('10⁻³⁵ m'); })
      .to(main, { scale: 1, rotate: 0, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out' }, '+=.35')
      .add(() => setScale('1 m'));
  }
  if (mascot) mascot.addEventListener('click', shrinkWorld);
  document.addEventListener('keydown', e => {
    if ((e.key === 'q' || e.key === 'Q') && !/input|textarea/i.test(document.activeElement.tagName)) shrinkWorld();
  });

  console.log('%c ANTMANWEB %c Pulsa "Q" o haz clic en Ant-Man para entrar al Reino Cuántico ',
    'background:#ff2a3d;color:#fff;font-weight:bold;padding:4px 8px', 'color:#3df2ff');

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
