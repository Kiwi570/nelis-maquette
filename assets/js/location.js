/* NELIS · page Location : chaleur qui se fige, scénarios, parc, orbite, raccords, filtres */
(function () {
  'use strict';
  var N = window.NELIS, G = window.gsap, ST = window.ScrollTrigger;
  var $ = N.$, $$ = N.$$;

  /* ---------- Ouverture : la chaleur ondule puis se fige ---------- */
  function chaleur() {
    var hero = $('[data-hero-chaleur]');
    if (!hero || !N.anime) return;
    var fig = $('.hero__fond .media', hero), bruit = $('[data-chaleur-bruit]'), dep = $('[data-chaleur-deplacement]');
    if (!fig || !bruit || !dep) return;
    var inner = $('.media__in', fig);
    inner.style.filter = 'url(#chaleur)';
    var o = { s: 34, f: 0 };
    G.timeline({ onComplete: function () { inner.style.filter = ''; } })
      .to(o, { f: 1, duration: 2.6, ease: 'none', onUpdate: function () { bruit.setAttribute('baseFrequency', (0.008 + o.f * 0.004).toFixed(4) + ' ' + (0.03 + Math.sin(o.f * 6) * 0.006).toFixed(4)); } }, 0)
      .to(o, { s: 0, duration: 2.2, ease: 'power2.inOut', onUpdate: function () { dep.setAttribute('scale', o.s.toFixed(2)); } }, 0.4)
      .fromTo($('picture, canvas', inner), { filter: 'saturate(1.3) brightness(1.1)' }, { filter: 'saturate(1) brightness(1)', duration: 2.6, ease: 'power1.inOut', clearProps: 'filter' }, 0);
  }

  /* ---------- Scénarios ---------- */
  var TEXTES = {
    panne: ['Panne de climatisation', 'Votre installation s’arrête, le froid continue.', 'Nos groupes d’eau glacée de location s’adaptent à votre réseau de froid et fonctionnent avec une fiabilité absolue, le temps de remettre votre installation en état.'],
    urgence: ['Urgence', 'Livré et installé le jour même si nécessaire.', 'En cas d’urgence frigorifique, nous sommes à votre disposition. Notre stock est paré à toute éventualité et nos équipements se raccordent rapidement à votre installation actuelle.'],
    ete: ['Pic de charge en été', 'Le renfort qu’il faut quand la chaleur monte.', 'Pour absorber un pic de charge, nos groupes mobiles et nos climatiseurs complètent votre installation existante, raccordés rapidement et simplement.'],
    travaux: ['Travaux sur votre réseau', 'Vos travaux, sans couper le froid.', 'Pendant des travaux de modification sur votre réseau, une installation de location prend le relais. Raccords à brides, couplage rapide, échangeurs, réservoirs et modules de pompage sont en stock.'],
    process: ['Froid de procédé', 'L’alimentation en froid de vos procédés.', 'Plasturgie, laser, fermentation, lait, galvanoplastie, essais : nos groupes d’eau glacée alimentent vos procédés industriels aussi longtemps que nécessaire.'],
    clim: ['Climatisation temporaire', 'Foires, salons, bureaux, salles serveurs, halles.', 'Grâce à nos grands groupes d’eau glacée et à nos pompes à chaleur, nous pouvons climatiser pratiquement tous les espaces, jusqu’aux halles industrielles.']
  };
  function scenarios() {
    var bloc = $('[data-scenarios]');
    if (!bloc) return;
    var tabs = $$('[role="tab"]', bloc), panel = $('#p-scenario', bloc), figs = $$('[data-scenario-fig]', bloc);
    var tag = $('[data-st-tag]', bloc), titre = $('[data-st-titre]', bloc), txt = $('[data-st-txt]', bloc), cour = 'panne';
    function choisir(id, focus) {
      if (id === cour) return;
      cour = id;
      tabs.forEach(function (t) { var on = t.dataset.scenario === id; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      panel.setAttribute('aria-labelledby', 't-' + id);
      var nouv = figs.filter(function (f) { return f.dataset.scenarioFig === id; })[0];
      figs.forEach(function (f) { if (f !== nouv) f.hidden = true; });
      nouv.hidden = false;
      if (window.NELIS_MEDIA) window.NELIS_MEDIA.peindre(nouv);
      var d = TEXTES[id];
      if (N.anime) {
        G.fromTo(nouv, { clipPath: 'circle(0% at 0% 50%)' }, { clipPath: 'circle(150% at 0% 50%)', duration: 1.1, ease: 'expo.out' });
        G.fromTo($('.media__in', nouv), { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
        G.to([tag, titre, txt], { opacity: 0, y: -10, duration: 0.2, onComplete: function () {
          tag.textContent = d[0]; titre.textContent = d[1]; txt.textContent = d[2];
          G.fromTo([tag, titre, txt], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out' });
        } });
      } else { tag.textContent = d[0]; titre.textContent = d[1]; txt.textContent = d[2]; }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { choisir(t.dataset.scenario); });
      t.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); choisir(tabs[j].dataset.scenario, true); }
      });
    });
  }

  /* ---------- Parc : jauges en échelle logarithmique ---------- */
  function parc() {
    var lg = function (v) { return Math.log(v) / Math.log(500) * 100; };
    $$('.equip__jauge').forEach(function (j) {
      var de = parseFloat(j.dataset.de), a = parseFloat(j.dataset.a), i = $('i', j);
      i.style.setProperty('--de', lg(de).toFixed(2) + '%');
      i.style.setProperty('--l', Math.max(1.4, lg(a) - lg(de)).toFixed(2) + '%');
      if (N.anime) G.from(i, { scaleX: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: j, start: 'top 92%', once: true } });
    });
  }

  /* ---------- Orbite des atouts ---------- */
  function orbite() {
    var o = $('[data-orbite]');
    if (!o || !N.anime || !N.bureau.matches) return;
    o.classList.add('is-orbite');
    var atouts = $$('.atout', o), n = atouts.length, etat = { a: -90 };
    function placer() {
      var W = o.clientWidth, H = o.clientHeight, rx = W * 0.4, ry = H * 0.4;
      atouts.forEach(function (el, i) {
        var ang = (etat.a + i * 360 / n) * Math.PI / 180;
        G.set(el, { x: Math.cos(ang) * rx, y: Math.sin(ang) * ry, xPercent: -50, yPercent: -50, left: '50%', top: '50%' });
      });
    }
    placer();
    G.to(etat, { a: -30, ease: 'none', onUpdate: placer, scrollTrigger: { trigger: o, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    window.addEventListener('resize', placer);
    G.from(atouts, { opacity: 0, scale: 0.85, stagger: 0.08, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: o, start: 'top 70%', once: true } });
  }

  /* ---------- Raccords qui s'assemblent ---------- */
  function raccords() {
    var items = $$('.raccord');
    if (!N.anime) { items.forEach(function (r) { r.classList.add('is-raccorde'); }); return; }
    items.forEach(function (r, i) {
      ST.create({ trigger: r, start: 'top 85%', once: true, onEnter: function () { setTimeout(function () { r.classList.add('is-raccorde'); }, i * 90); } });
    });
  }

  /* ---------- Filtres d'applications ---------- */
  function filtres() {
    var bt = $$('[data-filtre]'), li = $$('[data-liste-apps] li');
    bt.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.filtre;
        bt.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        li.forEach(function (l) { l.classList.toggle('is-estompe', f !== 'tout' && l.dataset.f !== f); });
      });
    });
  }

  N.surPret(chaleur);
  document.addEventListener('nelis:mise-en-place', function () {
    scenarios(); parc(); orbite(); raccords(); filtres();
  });
})();
