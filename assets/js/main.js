/* NELIS · comportements communes à toutes les pages */
(function () {
  'use strict';
  var html = document.documentElement;
  var calme = html.classList.contains('calme');
  var fin = window.matchMedia('(pointer: fine)').matches;
  var bureau = window.matchMedia('(min-width: 1024px)');
  var G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var stockage = {
    lire: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    ecrire: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  };
  if (G && ST) G.registerPlugin(ST);
  if (G && SPLIT) G.registerPlugin(SPLIT);
  var anime = !!(G && ST) && !calme;

  var NELIS = window.NELIS = { calme: calme, fin: fin, bureau: bureau, anime: anime, lenis: null, $: $, $$: $$, stockage: stockage };

  /* ---------- Hauteurs réelles : en-tête (urgence + navigation) et barre du bas ---------- */
  (function () {
    var u = $('.urgence'), n = $('.nav'), barre = $('[data-barre-bas]');
    function mesurer() {
      html.style.setProperty('--entete-h', ((u ? u.offsetHeight : 0) + (n ? n.offsetHeight : 0)) + 'px');
      html.style.setProperty('--barres-h', (barre && getComputedStyle(barre).display !== 'none' ? barre.offsetHeight : 0) + 'px');
    }
    mesurer();
    if (window.ResizeObserver) { var ro = new ResizeObserver(mesurer); [u, n, barre].forEach(function (el) { if (el) ro.observe(el); }); }
    window.addEventListener('resize', mesurer);
    if (!barre || !('IntersectionObserver' in window)) return;
    /* La barre s'efface tant que le hero, le formulaire ou le pied de page est à l'écran */
    var zones = $$('[data-hero], #devis, .pied'), vues = [];
    var obs = new IntersectionObserver(function (en) {
      en.forEach(function (e) { vues[zones.indexOf(e.target)] = e.isIntersecting; });
      barre.classList.toggle('is-cache', vues.some(Boolean));
    });
    zones.forEach(function (z) { obs.observe(z); });
  })();

  function temp(t) {
    var v = Math.round(t);
    return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' °C';
  }
  NELIS.temp = temp;

  /* ---------- Défilement fluide ---------- */
  if (anime && window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    NELIS.lenis = lenis;
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  function hautFixe() { var n = $('.nav'), u = $('.urgence'); return (n ? n.offsetHeight : 0) + (u ? u.offsetHeight : 0) + 12; }
  function allerA(cible) {
    if (!cible) return;
    if (NELIS.lenis) NELIS.lenis.scrollTo(cible, { offset: -hautFixe(), duration: 1.4 });
    else cible.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Liens : ancres, transitions, présélection ---------- */
  function memePage(url) { return url.origin === location.origin && url.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '') === location.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, ''); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute('href');
    if (/^(tel:|mailto:)/.test(href) || a.target === '_blank') return;
    if (a.dataset.preselection) {
      try { window.sessionStorage.setItem('nelis-preselection', a.dataset.preselection); } catch (err) { /* rien */ }
      document.dispatchEvent(new CustomEvent('nelis:preselection', { detail: a.dataset.preselection }));
    }
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.hash && memePage(url)) {
      var cible = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (cible) { e.preventDefault(); fermerMenu(); allerA(cible); }
      return;
    }
    if (!anime) return;
    var gel = $('#gel');
    if (!gel) return;
    e.preventDefault();
    gel.style.display = '';
    var m = { v: 110 };
    G.to(m, { v: -14, duration: 0.55, ease: 'power3.in', onUpdate: function () { gel.style.setProperty('--trou', m.v + '%'); }, onComplete: function () { location.href = a.href; } });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { var g = $('#gel'); if (g) g.style.display = 'none'; } });

  /* ---------- Menu et barre de navigation ---------- */
  var burger = $('[data-burger]'), menu = $('#menu');
  function fermerMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; burger.setAttribute('aria-expanded', 'false');
    if (NELIS.lenis) NELIS.lenis.start();
    document.body.style.overflow = '';
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var ouvrir = menu.hidden;
      if (!ouvrir) { fermerMenu(); return; }
      menu.hidden = false; burger.setAttribute('aria-expanded', 'true');
      if (NELIS.lenis) NELIS.lenis.stop();
      document.body.style.overflow = 'hidden';
      if (anime) G.from($$('.menu__liens a', menu), { yPercent: 60, opacity: 0, stagger: 0.04, duration: 0.6, ease: 'expo.out' });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerMenu(); });
  }
  var nav = $('#nav'), dernierY = 0;
  function surDefilement(y) {
    if (!nav) return;
    nav.classList.toggle('is-solide', y > 24);
    var bas = y > dernierY + 4, haut = y < dernierY - 4;
    if (bas && y > 160 && (!menu || menu.hidden)) nav.classList.add('is-cache');
    else if (haut || y < 160) nav.classList.remove('is-cache');
    dernierY = y;
    thermometre(y);
  }
  if (NELIS.lenis) NELIS.lenis.on('scroll', function (l) { surDefilement(l.scroll); });
  else window.addEventListener('scroll', function () { surDefilement(window.scrollY); }, { passive: true });

  /* ---------- Thermomètre de lecture ---------- */
  var thNiv = $('[data-thermo-niveau]'), thVal = $('[data-thermo-val]');
  function thermometre(y) {
    if (!thNiv) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    var t = 24 - 64 * p;
    thNiv.style.setProperty('--t', Math.max(0.05, (t + 40) / 64).toFixed(3));
    thNiv.closest('.thermo').classList.toggle('is-visible', y > window.innerHeight * 0.5 && p < 0.985);
    thVal.textContent = temp(t);
  }
  thermometre(window.scrollY);

  /* ---------- Mode calme ---------- */
  $$('[data-calme]').forEach(function (b) {
    b.setAttribute('aria-pressed', calme ? 'true' : 'false');
    b.textContent = calme ? 'Réactiver les animations' : 'Réduire les animations';
    b.addEventListener('click', function () {
      stockage.ecrire('nelis-calme', calme ? '0' : '1');
      location.reload();
    });
  });

  /* ---------- Magasin ouvert maintenant ---------- */
  var HORAIRES = { 0: [], 1: [[840, 1080]], 2: [[570, 720], [840, 1080]], 3: [[570, 720], [840, 1080]], 4: [[570, 720], [840, 1080]], 5: [[570, 720], [840, 1080]], 6: [[570, 720], [840, 1080]] };
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function heure(min) { var h = Math.floor(min / 60), m = min % 60; return h + '\u00a0h\u00a0' + (m < 10 ? '0' : '') + m; }
  function maintenantParis() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var j = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
    return { jour: j, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  function etatMagasin() {
    var n = maintenantParis(), plages = HORAIRES[n.jour];
    for (var i = 0; i < plages.length; i++) {
      if (n.min >= plages[i][0] && n.min < plages[i][1]) return { ouvert: true, court: 'Magasin ouvert, ferme à ' + heure(plages[i][1]), jour: n.jour };
    }
    for (var k = 0; k < plages.length; k++) {
      if (n.min < plages[k][0]) return { ouvert: false, court: 'Magasin fermé, ouvre à ' + heure(plages[k][0]), jour: n.jour };
    }
    for (var d = 1; d <= 7; d++) {
      var jj = (n.jour + d) % 7;
      if (HORAIRES[jj].length) return { ouvert: false, court: 'Magasin fermé, ouvre ' + (d === 1 ? 'demain' : JOURS[jj]) + ' à ' + heure(HORAIRES[jj][0][0]), jour: n.jour };
    }
    return { ouvert: false, court: 'Magasin fermé', jour: n.jour };
  }
  function majOuvert() {
    var e;
    try { e = etatMagasin(); } catch (err) { return; }
    $$('[data-ouvert-court]').forEach(function (el) { el.textContent = e.court; });
    $$('[data-ouvert-long]').forEach(function (el) { el.textContent = e.court.replace('Magasin', 'Magasin de Vesoul'); });
    $$('[data-ouvert-pastille]').forEach(function (el) { el.classList.toggle('pastille--ok', e.ouvert); el.classList.toggle('pastille--off', !e.ouvert); });
    var groupe = e.jour === 0 ? '0' : e.jour === 1 ? '1' : '2';
    $$('[data-horaires] [data-jour]').forEach(function (el) { el.classList.toggle('is-aujourdhui', el.dataset.jour === groupe); });
  }
  majOuvert();
  setInterval(majOuvert, 60000);

  /* ---------- Son d'ambiance (généré en direct, après un clic) ---------- */
  var Son = {
    ctx: null, master: null, actif: false,
    bruit: function (ctx, sec, brun) {
      var b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0), last = 0;
      for (var i = 0; i < d.length; i++) {
        var w = Math.random() * 2 - 1;
        if (brun) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return b;
    },
    creer: function () {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      var ctx = this.ctx = new AC();
      var master = this.master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      var eau = ctx.createBufferSource(); eau.buffer = this.bruit(ctx, 4, true); eau.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      var lfoG = ctx.createGain(); lfoG.gain.value = 260; lfo.connect(lfoG); lfoG.connect(bp.frequency);
      var gEau = ctx.createGain(); gEau.gain.value = 0.55;
      eau.connect(bp); bp.connect(gEau); gEau.connect(master);
      var air = ctx.createBufferSource(); air.buffer = this.bruit(ctx, 3, false); air.loop = true;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
      var gAir = ctx.createGain(); gAir.gain.value = 0.018;
      air.connect(hp); hp.connect(gAir); gAir.connect(master);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      var gHum = ctx.createGain(); gHum.gain.value = 0.05; lp.connect(gHum); gHum.connect(master);
      [[50, 0.6], [100, 0.32], [150, 0.14], [200, 0.06]].forEach(function (h) {
        var o = ctx.createOscillator(); o.frequency.value = h[0];
        var g = ctx.createGain(); g.gain.value = h[1]; o.connect(g); g.connect(lp); o.start();
      });
      var trem = ctx.createOscillator(); trem.frequency.value = 0.21;
      var tremG = ctx.createGain(); tremG.gain.value = 0.012; trem.connect(tremG); tremG.connect(gHum.gain);
      eau.start(); air.start(); lfo.start(); trem.start();
      return true;
    },
    basculer: function () {
      if (!this.ctx && !this.creer()) return false;
      var t = this.ctx.currentTime;
      this.actif = !this.actif;
      if (this.actif) { this.ctx.resume(); this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(0.16, t, 0.6); }
      else { this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(0, t, 0.25); }
      return this.actif;
    }
  };
  $$('[data-son]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = Son.basculer();
      $$('[data-son]').forEach(function (x) {
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
        x.setAttribute('aria-label', on ? 'Couper le son d’ambiance' : 'Activer le son d’ambiance');
        var t = $('[data-son-txt]', x); if (t) t.textContent = on ? 'Son activé' : 'Son';
      });
    });
  });
  document.addEventListener('visibilitychange', function () {
    if (!Son.ctx || !Son.actif) return;
    if (document.hidden) Son.ctx.suspend(); else Son.ctx.resume();
  });

  /* ---------- Ouverture gelée ---------- */
  var pretFait = false;
  function pret() {
    if (pretFait) return;
    pretFait = true;
    html.classList.add('is-pret');
    document.dispatchEvent(new CustomEvent('nelis:pret'));
  }
  NELIS.surPret = function (fn) { if (pretFait) fn(); else document.addEventListener('nelis:pret', fn, { once: true }); };

  function ouverture() {
    var gel = $('#gel');
    if (!anime || !gel) { if (gel) gel.style.display = 'none'; pret(); return; }
    var court = html.classList.contains('intro-courte');
    var c = $('.gel__canvas', gel);
    if (c && window.NELIS_MEDIA) {
      var w = c.width = Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5));
      var h = c.height = Math.round(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.5));
      var ctx = c.getContext('2d'), r = window.NELIS_MEDIA.graine('gel'), tex = $('.gel__texture', gel);
      if (tex && window.NELIS_IMAGES && window.NELIS_IMAGES['g-texture-givre']) {
        window.NELIS_MEDIA.givre(ctx, w, h, r, { n: 12, longueur: 0.22, prof: 3, alpha: 0.35 });
        G.fromTo(tex, { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'expo.out' });
      } else {
        if (tex) tex.remove();
        window.NELIS_MEDIA.fondAmbiance(ctx, w, h, r, false);
        window.NELIS_MEDIA.givre(ctx, w, h, r, { n: 26, longueur: 0.3, prof: 4, alpha: 0.6 });
      }
    }
    var tl = G.timeline({ onComplete: function () { gel.style.display = 'none'; } });
    if (!court) {
      var o = { t: 24 }, el = $('[data-gel-temp]', gel);
      tl.from($('.gel__mono', gel), { scale: 0.7, opacity: 0, duration: 0.7, ease: 'expo.out' }, 0);
      tl.to(o, { t: -40, duration: 1.1, ease: 'power2.inOut', onUpdate: function () { el.textContent = temp(o.t); } }, 0.1);
    }
    var m = { v: -14 };
    tl.to(m, { v: 115, duration: court ? 0.75 : 1.05, ease: 'power3.in', onUpdate: function () { gel.style.setProperty('--trou', m.v + '%'); } }, court ? 0.05 : 1.15);
    tl.call(pret, null, court ? 0.3 : 1.6);
  }

  /* ---------- Entrée du hero et révélations ---------- */
  function polices(fn) {
    var fait = false;
    function go() { if (!fait) { fait = true; fn(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 1200);
  }

  function entreeHero() {
    var hero = $('[data-hero]');
    if (!hero || !anime) return;
    var titre = $('[data-split-hero]', hero);
    if (titre && SPLIT) {
      var s = SPLIT.create(titre, { type: 'words,lines', mask: 'lines', linesClass: 'ligne', wordsClass: 'mot' });
      G.from(s.words, { yPercent: 115, duration: 1.2, stagger: 0.07, ease: 'expo.out' });
    }
    var app = $$('[data-apparait], .surtitre, .fil', hero);
    if (app.length) G.from(app, { y: 24, opacity: 0, duration: 1, stagger: 0.08, delay: 0.35, ease: 'expo.out' });
    var med = $('.hero__fond .media__in', hero);
    if (med) G.fromTo(med, { scale: 1.14 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
    var pied = $('.hero__pied', hero);
    if (pied) G.from(pied, { opacity: 0, duration: 1, delay: 0.8 });
  }

  function revelations() {
    if (!anime) return;
    $$('[data-split]').forEach(function (el) {
      if (!SPLIT) return;
      var s = SPLIT.create(el, { type: 'words,lines', mask: 'lines' });
      G.from(s.lines, { yPercent: 105, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
    $$('[data-degivre]').forEach(function (el) {
      if (!SPLIT) return;
      var s = SPLIT.create(el, { type: 'lines' });
      G.fromTo(s.lines, { opacity: 0.35, filter: 'blur(7px)', color: '#c4e9ff' }, { opacity: 1, filter: 'blur(0px)', color: '#e8eef9', stagger: 0.12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 62%', scrub: true } });
    });
    $$('[data-apparait]').forEach(function (el) {
      if (el.closest('[data-hero]')) return;
      G.from(el, { y: 32, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('figure.media').forEach(function (fig) {
      if (fig.closest('[data-hero]') || fig.classList.contains('media--fond') || fig.closest('.pied__givre') || fig.closest('.apps.is-epingle') || fig.closest('[data-scenario-media]') || fig.closest('.colonne.is-epingle')) return;
      var inner = $('.media__in', fig);
      if (!inner) return;
      G.fromTo(inner, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.16, filter: 'brightness(1.8) saturate(0.3) blur(10px)' },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, filter: 'brightness(1) saturate(1) blur(0px)', duration: 1.5, ease: 'expo.out', clearProps: 'filter',
          scrollTrigger: { trigger: fig, start: 'top 88%', once: true } });
    });
    $$('figure.media[data-parallax]').forEach(function (fig) {
      var p = parseFloat(fig.dataset.parallax) || 0.1, inner = $('.media__in', fig);
      if (!inner) return;
      if (fig.closest('[data-hero]')) {
        G.to(inner, { yPercent: p * 60, ease: 'none', scrollTrigger: { trigger: fig.closest('[data-hero]'), start: 'top top', end: 'bottom top', scrub: true } });
      } else {
        fig.classList.add('media--parallaxe');
        G.fromTo($('picture, canvas', inner), { yPercent: -p * 50 }, { yPercent: p * 50, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });
    $$('[data-compte]').forEach(function (el) {
      var fin2 = parseFloat(el.dataset.compte), o = { v: 0 };
      G.to(o, { v: fin2, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  /* ---------- Bandeau défilant ---------- */
  function bandeau() {
    var p = $('[data-bandeau]');
    if (!p || !anime) return;
    p.innerHTML += p.innerHTML;
    var tw = G.to(p, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    if (NELIS.lenis) NELIS.lenis.on('scroll', function (l) {
      var v = Math.min(5, 1 + Math.abs(l.velocity) / 6);
      G.to(tw, { timeScale: l.direction < 0 ? -v : v, duration: 0.4, overwrite: true });
    });
  }

  /* ---------- Curseur, aimants, inclinaisons, buée ---------- */
  function interactions() {
    if (!anime || !fin) return;
    html.classList.add('curseur-actif');
    var cur = $('.curseur'), anneau = $('.curseur__anneau', cur), point = $('.curseur__point', cur), label = $('[data-curseur-label]', cur);
    var ax = G.quickTo(anneau, 'x', { duration: 0.45, ease: 'power3' }), ay = G.quickTo(anneau, 'y', { duration: 0.45, ease: 'power3' });
    var px = G.quickTo(point, 'x', { duration: 0.08 }), py = G.quickTo(point, 'y', { duration: 0.08 });
    var lx = G.quickTo(label, 'x', { duration: 0.45, ease: 'power3' }), ly = G.quickTo(label, 'y', { duration: 0.45, ease: 'power3' });
    var vu = false;
    G.set(cur, { opacity: 0 });
    window.addEventListener('pointermove', function (e) {
      if (!vu) { vu = true; G.set([anneau, point, label], { x: e.clientX, y: e.clientY }); G.to(cur, { opacity: 1, duration: 0.3 }); }
      ax(e.clientX); ay(e.clientY); px(e.clientX); py(e.clientY); lx(e.clientX); ly(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var lien = e.target.closest('a, button, summary, label, [role="tab"], input[type="range"]');
      cur.classList.toggle('is-lien', !!lien);
      var b = e.target.closest('[data-buee]');
      var txt = b ? 'Désembuer' : (e.target.closest('[data-curseur]') ? e.target.closest('[data-curseur]').dataset.curseur : '');
      label.textContent = txt;
      cur.classList.toggle('has-label', !!txt);
    });
    document.addEventListener('pointerleave', function () { G.to(cur, { opacity: 0, duration: 0.2 }); });
    document.addEventListener('pointerenter', function () { if (vu) G.to(cur, { opacity: 1, duration: 0.2 }); });

    $$('[data-magnetic]').forEach(function (el) {
      var span = el.firstElementChild;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        G.to(el, { x: dx * 0.28, y: dy * 0.38, duration: 0.5, ease: 'power3.out' });
        if (span) G.to(span, { x: dx * 0.12, y: dy * 0.14, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () {
        G.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
        if (span) G.to(span, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        G.to(el, { rotateY: x * 9, rotateX: -y * 7, transformPerspective: 1100, duration: 0.6, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () { G.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: 'power3.out' }); });
    });

    $$('[data-buee]').forEach(buee);
  }

  function buee(fig) {
    var c = document.createElement('canvas');
    c.className = 'media__buee'; c.setAttribute('aria-hidden', 'true');
    fig.appendChild(c);
    var ctx = c.getContext('2d'), tex = document.createElement('canvas'), w = 0, h = 0, raf = 0, dedans = false, regel = 0;
    function preparer() {
      var r = fig.getBoundingClientRect();
      w = c.width = tex.width = Math.max(40, Math.round(r.width / 2));
      h = c.height = tex.height = Math.max(40, Math.round(r.height / 2));
      var t = tex.getContext('2d');
      var g = t.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(225,240,255,.55)'); g.addColorStop(1, 'rgba(196,220,245,.38)');
      t.fillStyle = g; t.fillRect(0, 0, w, h);
      var rr = window.NELIS_MEDIA.graine(fig.dataset.img + 'buee');
      for (var i = 0; i < 260; i++) { t.fillStyle = 'rgba(255,255,255,' + (rr() * 0.35) + ')'; var s = rr() * 2.2 + 0.4; t.beginPath(); t.arc(rr() * w, rr() * h, s, 0, 7); t.fill(); }
      ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, w, h); ctx.drawImage(tex, 0, 0);
    }
    function boucle() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = dedans ? 0.006 : 0.03;
      ctx.drawImage(tex, 0, 0);
      ctx.globalAlpha = 1;
      regel++;
      if (!dedans && regel > 160) { ctx.clearRect(0, 0, w, h); ctx.drawImage(tex, 0, 0); raf = 0; return; }
      raf = requestAnimationFrame(boucle);
    }
    fig.addEventListener('pointerenter', function () { if (!w) preparer(); dedans = true; regel = 0; if (!raf) raf = requestAnimationFrame(boucle); });
    fig.addEventListener('pointerleave', function () { dedans = false; regel = 0; if (!raf) raf = requestAnimationFrame(boucle); });
    fig.addEventListener('pointermove', function (e) {
      if (!w) preparer();
      var r = fig.getBoundingClientRect(), x = (e.clientX - r.left) / 2, y = (e.clientY - r.top) / 2, rad = Math.max(w, h) * 0.16;
      ctx.globalCompositeOperation = 'destination-out';
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      ctx.globalCompositeOperation = 'source-over';
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { preparer(); io.disconnect(); } }, { rootMargin: '200px' });
      io.observe(fig);
    } else preparer();
  }

  /* ---------- Démarrage ---------- */
  ouverture();
  function demarrer() {
    polices(function () {
      NELIS.surPret(entreeHero);
      document.dispatchEvent(new CustomEvent('nelis:structure'));
      revelations();
      bandeau();
      interactions();
      document.dispatchEvent(new CustomEvent('nelis:mise-en-place'));
      if (ST) ST.refresh();
    });
  }
  if (document.readyState === 'complete') demarrer();
  else document.addEventListener('DOMContentLoaded', demarrer);
  window.addEventListener('load', function () { if (ST) ST.refresh(); });
})();
