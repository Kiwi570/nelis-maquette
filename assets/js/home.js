/* NELIS · accueil : colonne de puissance, applications, supervision, carte */
(function () {
  'use strict';
  var N = window.NELIS, G = window.gsap, ST = window.ScrollTrigger;
  var $ = N.$, $$ = N.$$;

  /* ---------- Étapes clé en main ---------- */
  function etapes() {
    var bloc = $('[data-etapes]');
    if (!bloc) return;
    var items = $$('.etape', bloc), trait = $('[data-conduite-etapes]', bloc);
    if (!N.anime) { items.forEach(function (i) { i.classList.add('is-actif'); }); if (trait) trait.style.strokeDashoffset = 0; return; }
    ST.create({
      trigger: bloc, start: 'top 78%', end: 'bottom 55%', scrub: true,
      onUpdate: function (s) {
        if (trait) trait.style.strokeDashoffset = (1 - s.progress).toFixed(3);
        items.forEach(function (it, i) { it.classList.toggle('is-actif', s.progress >= i / items.length + 0.02 || s.progress > 0.98); });
      }
    });
  }

  /* ---------- Colonne : de 2 kW à 420 kW, puis −40 °C ---------- */
  function niveau(kw) { return Math.max(0.06, Math.min(1, Math.log(kw) / Math.log(450))); }
  function colonne() {
    var sec = $('[data-colonne]');
    if (!sec) return;
    var paliers = $$('.palier', sec), puces = $$('[data-puces] span', sec);
    var echelle = $('[data-echelle]', sec);
    [2, 5, 15, 50, 150, 420].forEach(function (v) {
      var li = document.createElement('li'); li.style.setProperty('--p', niveau(v).toFixed(3)); li.textContent = v + ' kW'; echelle.appendChild(li);
    });
    if (!N.anime || !N.bureau.matches) return;
    sec.classList.add('is-epingle');
    var tube = $('[data-niveau]', sec), lecture = $('[data-lecture]', sec), unite = $('[data-unite]', sec), cour = -1;
    function activer(i) {
      if (i === cour) return;
      cour = i;
      var p = paliers[i];
      paliers.forEach(function (x, k) { x.classList.toggle('is-actif', k === i); });
      puces.forEach(function (x, k) { x.classList.toggle('is-actif', k <= i); });
      tube.style.setProperty('--niv', niveau(parseFloat(p.dataset.kw)).toFixed(3));
      var gel = p.dataset.temp !== undefined;
      sec.classList.toggle('is-gel', gel);
      lecture.textContent = p.dataset.lectureTxt;
      unite.textContent = gel ? '°C' : 'kW';
      G.fromTo(lecture, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    }
    activer(0);
    ST.create({
      trigger: sec, start: 'top top', end: '+=' + (paliers.length * 70) + '%', pin: $('.colonne__epingle', sec), scrub: true,
      onUpdate: function (s) { activer(Math.min(paliers.length - 1, Math.floor(s.progress * paliers.length * 0.999))); }
    });
  }

  /* ---------- Applications : du chaud au froid ---------- */
  function applications() {
    var sec = $('[data-apps]');
    if (!sec) return;
    var piste = $('[data-apps-piste]', sec), cartes = $$('.app', piste);
    function froid() {
      var vw = window.innerWidth;
      cartes.forEach(function (c) {
        var r = c.getBoundingClientRect(), cx = r.left + r.width / 2;
        var f = Math.max(0, Math.min(1, (vw * 0.82 - cx) / (vw * 0.42)));
        c.style.setProperty('--froid', f.toFixed(3));
      });
    }
    if (!N.anime) return;
    if (N.bureau.matches) {
      sec.classList.add('is-epingle');
      var dist = function () { return Math.max(0, piste.scrollWidth - window.innerWidth); };
      G.to(piste, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: froid, onRefresh: froid }
      });
      froid();
    } else {
      piste.addEventListener('scroll', froid, { passive: true });
      froid();
    }
  }

  /* ---------- Écran de supervision (données illustratives) ---------- */
  function ecran() {
    var el = $('[data-ecran]');
    if (!el) return;
    var dep = $('[data-kpi="depart"]', el), ret = $('[data-kpi="retour"]', el), ch = $('[data-kpi="charge"]', el);
    var lD = $('[data-ligne-depart]', el), lR = $('[data-ligne-retour]', el), aire = $('[data-aire]', el), pt = $('[data-point]', el), journal = $('[data-journal]', el);
    var n = 48, hd = [], hr = [], vd = 7, vr = 12.1, vc = 64;
    for (var i = 0; i < n; i++) { vd += (7 - vd) * 0.2 + (Math.random() - 0.5) * 0.25; vr += (12 - vr) * 0.2 + (Math.random() - 0.5) * 0.35; hd.push(vd); hr.push(vr); }
    function y(v) { return 140 - (v - 4) / 10 * 130; }
    function chemin(h) { return h.map(function (v, k) { return (k ? 'L' : 'M') + (k * 600 / (n - 1)).toFixed(1) + ' ' + y(v).toFixed(1); }).join(''); }
    function dessiner() {
      lD.setAttribute('d', chemin(hd)); lR.setAttribute('d', chemin(hr));
      aire.setAttribute('d', chemin(hd) + 'L600 150L0 150Z');
      pt.setAttribute('cx', 600); pt.setAttribute('cy', y(hd[n - 1]).toFixed(1));
      dep.textContent = hd[n - 1].toFixed(1).replace('.', ',');
      ret.textContent = hr[n - 1].toFixed(1).replace('.', ',');
      ch.textContent = Math.round(vc);
    }
    var MSG = ['Contrôle de l’installation : conforme', 'Consigne de départ 7,0 °C confirmée', 'By-pass automatique en position normale', 'Filtre à eau : aucune alarme', 'Vitesse des ventilateurs ajustée', 'Programme de nuit chargé à distance', 'Pompe de circulation : fonctionnement normal'];
    var im = 0;
    function heure() { return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(new Date()); }
    function ecrire() {
      var li = document.createElement('li');
      li.innerHTML = '<time>' + heure() + '</time><span>' + MSG[im++ % MSG.length] + '</span>';
      journal.insertBefore(li, journal.firstChild);
      while (journal.children.length > 4) journal.removeChild(journal.lastChild);
      if (G && N.anime) G.from(li, { opacity: 0, x: -10, duration: 0.6 });
    }
    for (var k = 0; k < 3; k++) ecrire();
    dessiner();
    if (!N.anime) return;
    var t1 = 0, t2 = 0;
    function tic() {
      vd += (7 - vd) * 0.18 + (Math.random() - 0.5) * 0.22; vr += (12 - vr) * 0.18 + (Math.random() - 0.5) * 0.3; vc += (64 - vc) * 0.1 + (Math.random() - 0.5) * 5;
      vc = Math.max(48, Math.min(82, vc));
      hd.push(vd); hr.push(vr); hd.shift(); hr.shift(); dessiner();
    }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!t1) { t1 = setInterval(tic, 1400); t2 = setInterval(ecrire, 3800); } }
      else { clearInterval(t1); clearInterval(t2); t1 = t2 = 0; }
    }).observe(el);
  }

  /* ---------- Carte France – Suisse en points ---------- */
  var FRANCE = [[2.37, 51.03], [1.6, 50.87], [1.55, 50.2], [0.1, 49.5], [-1.25, 49.7], [-1.62, 49.65], [-1.5, 48.75], [-2.0, 48.65], [-3.0, 48.82], [-4.49, 48.62], [-4.75, 48.33], [-4.3, 48.15], [-4.73, 48.03], [-4.2, 47.8], [-3.37, 47.7], [-2.75, 47.5], [-2.2, 47.27], [-2.1, 46.85], [-1.8, 46.5], [-1.15, 46.16], [-1.03, 45.62], [-1.25, 45.2], [-1.17, 44.66], [-1.3, 44.2], [-1.56, 43.48], [-1.78, 43.36], [-1.0, 43.05], [0.0, 42.8], [0.7, 42.85], [1.45, 42.6], [2.5, 42.43], [3.17, 42.43], [3.05, 42.7], [3.1, 43.15], [3.7, 43.4], [4.0, 43.55], [4.6, 43.4], [5.37, 43.3], [5.93, 43.1], [6.65, 43.27], [7.27, 43.7], [7.5, 43.78], [7.6, 44.15], [7.0, 44.2], [6.9, 44.7], [7.05, 45.2], [6.8, 45.8], [6.85, 46.1], [6.15, 46.2], [6.1, 46.6], [6.45, 46.95], [6.95, 47.3], [7.58, 47.58], [7.6, 48.1], [7.8, 48.6], [8.2, 48.97], [7.95, 49.05], [7.1, 49.15], [6.5, 49.45], [6.1, 49.5], [5.8, 49.55], [4.9, 49.8], [4.85, 50.15], [4.2, 50.0], [3.95, 50.3], [3.3, 50.5], [3.1, 50.75], [2.6, 50.85]];
  var CORSE = [[9.4, 43.0], [9.45, 42.7], [9.55, 42.1], [9.4, 41.85], [9.28, 41.6], [9.15, 41.39], [8.9, 41.67], [8.73, 41.92], [8.6, 42.13], [8.68, 42.27], [8.75, 42.57], [8.94, 42.63], [9.3, 42.68], [9.35, 43.0]];
  var SUISSE = [[6.0, 46.15], [6.8, 46.0], [7.17, 45.87], [7.85, 45.95], [8.1, 46.25], [8.45, 46.45], [8.6, 46.1], [9.0, 45.82], [9.25, 46.3], [9.6, 46.3], [10.1, 46.25], [10.45, 46.55], [10.45, 46.85], [9.9, 46.95], [9.55, 47.05], [9.6, 47.5], [9.17, 47.66], [8.6, 47.78], [8.2, 47.62], [7.58, 47.58], [7.3, 47.44], [6.95, 47.3], [6.45, 46.95], [6.1, 46.6]];
  var LIEUX = [{ nom: 'Vesoul', sous: 'NELIS France SAS', lon: 6.155, lat: 47.62, cote: -1 }, { nom: 'Villmergen', sous: 'NELIS GmbH', lon: 8.25, lat: 47.35, cote: 1 }];
  function dedans(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function carte() {
    var c = $('[data-carte]');
    if (!c) return;
    var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, k, ox, oy, points = [], avance = N.anime ? 0 : 1, t0 = 0, raf = 0, visible = false;
    var lon0 = -5.4, lon1 = 10.9, lat0 = 41.1, lat1 = 51.4, cosl = Math.cos(46.5 * Math.PI / 180);
    function proj(lon, lat) { return [ox + (lon - lon0) * cosl * k, oy + (lat1 - lat) * k]; }
    function inv(x, y) { return [(x - ox) / (cosl * k) + lon0, lat1 - (y - oy) / k]; }
    function preparer() {
      var r = c.getBoundingClientRect(); W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      k = Math.min((W - 24) / ((lon1 - lon0) * cosl), (H - 24) / (lat1 - lat0));
      ox = (W - (lon1 - lon0) * cosl * k) / 2; oy = (H - (lat1 - lat0) * k) / 2;
      points = [];
      var pas = Math.max(7, W / 64);
      for (var y = oy; y < H; y += pas) for (var x = ox; x < W; x += pas) {
        var g = inv(x, y);
        var ch = dedans(g[0], g[1], SUISSE), fr = !ch && (dedans(g[0], g[1], FRANCE) || dedans(g[0], g[1], CORSE));
        if (ch || fr) points.push([x, y, ch ? 1 : 0, Math.random()]);
      }
    }
    function dessiner(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var a = proj(LIEUX[0].lon, LIEUX[0].lat), b = proj(LIEUX[1].lon, LIEUX[1].lat);
      points.forEach(function (p) {
        var d = Math.hypot(p[0] - a[0], p[1] - a[1]);
        var tw = N.anime ? 0.15 * Math.sin(t / 900 + p[3] * 6.28) : 0;
        ctx.fillStyle = p[2] ? 'rgba(169,172,228,' + (0.55 + tw) + ')' : 'rgba(165,176,200,' + (0.42 + tw + Math.max(0, 0.35 - d / 380)) + ')';
        ctx.beginPath(); ctx.arc(p[0], p[1], p[2] ? 1.9 : 1.6, 0, 6.283); ctx.fill();
      });
      var mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.55;
      ctx.strokeStyle = 'rgba(196,233,255,.9)'; ctx.lineWidth = 1.6; ctx.setLineDash([]);
      ctx.beginPath();
      var steps = 60, s = Math.round(steps * avance);
      for (var i = 0; i <= s; i++) { var u = i / steps, x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      LIEUX.forEach(function (l, j) {
        var p = proj(l.lon, l.lat);
        var ph = N.anime ? ((t / 2400 + j * 0.5) % 1) : 0.4;
        ctx.strokeStyle = 'rgba(196,233,255,' + (0.6 * (1 - ph)) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], 6 + ph * 22, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#c4e9ff'; ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, 6.283); ctx.fill();
        ctx.font = '600 11px "Geist Mono", monospace'; ctx.textBaseline = 'middle';
        var tx = l.cote < 0 ? p[0] - 14 : p[0] + 14; ctx.textAlign = l.cote < 0 ? 'right' : 'left';
        ctx.fillStyle = '#e8eef9'; ctx.fillText(l.nom.toUpperCase(), tx, p[1] + (l.cote < 0 ? -8 : 10));
        ctx.font = '500 10px "Geist Mono", monospace'; ctx.fillStyle = '#a5b0c8';
        ctx.fillText(l.sous.toUpperCase(), tx, p[1] + (l.cote < 0 ? 7 : 25));
      });
    }
    function boucle(t) { if (!visible) { raf = 0; return; } dessiner(t); raf = requestAnimationFrame(boucle); }
    preparer(); dessiner(0);
    window.addEventListener('resize', function () { preparer(); dessiner(performance.now()); });
    if (N.anime) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(boucle);
        if (visible && !t0) { t0 = 1; G.to({ v: 0 }, { v: 1, duration: 1.8, delay: 0.3, ease: 'power2.inOut', onUpdate: function () { avance = this.targets()[0].v; } }); }
      }).observe(c);
    }
    if (document.fonts) document.fonts.ready.then(function () { dessiner(performance.now()); });
  }

  document.addEventListener('nelis:structure', function () {
    colonne();
    applications();
  });
  document.addEventListener('nelis:mise-en-place', function () {
    etapes();
    ecran();
    carte();
  });
})();
