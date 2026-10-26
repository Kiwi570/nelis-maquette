/* NELIS · images réelles et visuels provisoires dessinés en code */
(function () {
  'use strict';
  var IM = window.NELIS_IMAGES || {};
  var mobile = window.matchMedia('(max-width: 700px)');
  var DPR = Math.min(window.devicePixelRatio || 1, 1.6);

  function graine(txt) {
    var s = 2166136261;
    for (var i = 0; i < txt.length; i++) { s ^= txt.charCodeAt(i); s = Math.imul(s, 16777619); }
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  function srcset(nom) {
    return IM[nom].w.map(function (w) { return 'assets/img/' + nom + '-' + w + '.webp ' + w + 'w'; }).join(', ');
  }
  function src(nom) {
    var w = IM[nom].w;
    return 'assets/img/' + nom + '-' + w[Math.min(1, w.length - 1)] + '.webp';
  }

  /* ---------- Dessin : givre en dendrites ---------- */
  function branche(ctx, r, x, y, a, len, prof, alpha) {
    var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(0.5, prof * 0.55) * DPR;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    if (prof <= 0) return;
    var nb = 2 + (r() * 3 | 0);
    for (var i = 1; i <= nb; i++) {
      var t = i / (nb + 1), bx = x + (x2 - x) * t, by = y + (y2 - y) * t, cote = i % 2 ? 1 : -1;
      branche(ctx, r, bx, by, a + cote * (Math.PI / 3) * (0.85 + r() * 0.3), len * (0.28 + r() * 0.18) * (1 - t * 0.5), prof - 1, alpha * 0.75);
    }
    branche(ctx, r, x2, y2, a + (r() - 0.5) * 0.35, len * 0.55, prof - 1, alpha * 0.85);
  }

  function givre(ctx, w, h, r, opts) {
    opts = opts || {};
    var chaud = opts.chaud;
    var n = opts.n || (10 + (r() * 8 | 0));
    var L = Math.min(w, h);
    ctx.lineCap = 'round';
    ctx.strokeStyle = chaud ? 'rgb(255,214,180)' : 'rgb(214,238,255)';
    for (var i = 0; i < n; i++) {
      var e = r() * 4 | 0, x, y, a;
      if (e === 0) { x = r() * w; y = 0; a = Math.PI / 2; }
      else if (e === 1) { x = w; y = r() * h; a = Math.PI; }
      else if (e === 2) { x = r() * w; y = h; a = -Math.PI / 2; }
      else { x = 0; y = r() * h; a = 0; }
      a += (r() - 0.5) * 1.2;
      branche(ctx, r, x, y, a, L * (opts.longueur || (0.18 + r() * 0.22)), opts.prof || 4, opts.alpha || 0.55);
    }
    for (var j = 0; j < 80; j++) {
      ctx.globalAlpha = r() * 0.8; ctx.fillStyle = '#fff';
      var s = (r() * 1.6 + 0.3) * DPR; ctx.fillRect(r() * w, r() * h, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function fondAmbiance(ctx, w, h, r, chaud) {
    var g = ctx.createLinearGradient(0, 0, w * 0.4, h);
    if (chaud) { g.addColorStop(0, '#2c170e'); g.addColorStop(0.6, '#130b0a'); g.addColorStop(1, '#070608'); }
    else { g.addColorStop(0, '#0e1830'); g.addColorStop(0.55, '#080d1a'); g.addColorStop(1, '#04060b'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var cols = chaud ? ['255,138,76', '255,190,120', '169,172,228'] : ['126,201,243', '169,172,228', '196,233,255'];
    for (var i = 0; i < 3; i++) {
      var x = r() * w, y = r() * h, rad = (0.35 + r() * 0.5) * Math.max(w, h);
      var rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(' + cols[i] + ',' + (0.16 + r() * 0.14) + ')');
      rg.addColorStop(1, 'rgba(' + cols[i] + ',0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    }
    if (chaud) {
      ctx.strokeStyle = 'rgba(255,170,110,.14)'; ctx.lineWidth = DPR;
      for (var k = 0; k < 16; k++) {
        var y0 = r() * h; ctx.beginPath();
        for (var xx = 0; xx <= w; xx += 8) { var yy = y0 + Math.sin(xx * 0.02 / DPR + k) * 6 * DPR; if (xx) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
    }
  }

  /* ---------- Dessin : schémas pour les photos produits à venir ---------- */
  function schema(ctx, w, h, r, type) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d1630'); g.addColorStop(1, '#060a16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var pas = Math.max(14 * DPR, Math.round(Math.min(w, h) / 16));
    ctx.strokeStyle = 'rgba(126,201,243,.07)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x < w; x += pas) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (var y = 0; y < h; y += pas) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(196,233,255,.82)';
    ctx.lineWidth = Math.max(1, Math.min(w, h) / 380);
    ctx.lineJoin = 'round';
    var cx = w / 2, base = h * 0.74, i, k;
    function rect(a, b, c, d) { ctx.strokeRect(a, b, c, d); }
    function ligne(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    function cercle(a, b, rr) { ctx.beginPath(); ctx.arc(a, b, rr, 0, Math.PI * 2); ctx.stroke(); }
    if (type === 'split') {
      var uw = w * 0.56, uh = Math.min(h * 0.11, uw * 0.22), ux = cx - uw / 2, uy = h * 0.22;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(ux, uy, uw, uh, uh * 0.35) : ctx.rect(ux, uy, uw, uh); ctx.stroke();
      for (i = 1; i < 4; i++) ligne(ux + uw * 0.08, uy + uh * (0.55 + i * 0.1), ux + uw * 0.92, uy + uh * (0.55 + i * 0.1));
      var ow = Math.min(w * 0.42, h * 0.5), oh = ow * 0.7, ox = cx - ow / 2, oy = h * 0.5;
      rect(ox, oy, ow, oh); cercle(ox + ow * 0.36, oy + oh * 0.5, oh * 0.34); cercle(ox + ow * 0.36, oy + oh * 0.5, oh * 0.08);
      for (i = 0; i < 6; i++) ligne(ox + ow * 0.74, oy + oh * (0.2 + i * 0.12), ox + ow * 0.92, oy + oh * (0.2 + i * 0.12));
    } else if (type === 'pac') {
      var pw = Math.min(w * 0.62, h * 0.7), ph = pw * 0.78, px = cx - pw / 2, py = base - ph;
      rect(px, py, pw, ph); cercle(px + pw * 0.33, py + ph * 0.5, ph * 0.33); cercle(px + pw * 0.33, py + ph * 0.5, ph * 0.06);
      for (k = 0; k < 3; k++) { ctx.beginPath(); var aa = k * 2.094; ctx.moveTo(px + pw * 0.33, py + ph * 0.5); ctx.quadraticCurveTo(px + pw * 0.33 + Math.cos(aa + 0.6) * ph * 0.3, py + ph * 0.5 + Math.sin(aa + 0.6) * ph * 0.3, px + pw * 0.33 + Math.cos(aa) * ph * 0.31, py + ph * 0.5 + Math.sin(aa) * ph * 0.31); ctx.stroke(); }
      rect(px + pw * 0.7, py + ph * 0.15, pw * 0.22, ph * 0.3);
      for (i = 0; i < 4; i++) ligne(px + pw * 0.7, py + ph * (0.6 + i * 0.08), px + pw * 0.92, py + ph * (0.6 + i * 0.08));
      rect(px - 4, base, pw + 8, ph * 0.05);
    } else if (type === 'mobile') {
      var mw = Math.min(w * 0.22, h * 0.3), mh = mw * 2.1, mx = cx - mw * 1.2, my = base - mh;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(mx, my, mw, mh, mw * 0.12) : ctx.rect(mx, my, mw, mh); ctx.stroke();
      for (i = 0; i < 5; i++) ligne(mx + mw * 0.15, my + mh * (0.12 + i * 0.05), mx + mw * 0.85, my + mh * (0.12 + i * 0.05));
      ctx.beginPath(); ctx.moveTo(mx + mw, my + mh * 0.3); ctx.bezierCurveTo(mx + mw * 2, my + mh * 0.2, mx + mw * 2.2, my - mh * 0.1, mx + mw * 2.8, my - mh * 0.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + mw, my + mh * 0.38); ctx.bezierCurveTo(mx + mw * 2, my + mh * 0.3, mx + mw * 2.1, my, mx + mw * 2.8, my + mh * 0.04); ctx.stroke();
    } else if (type === 'lieu') {
      var bx = w * 0.1, bw = w * 0.8, bh = h * 0.42, by = base - bh;
      rect(bx, by, bw, bh); rect(bx + bw * 0.08, by - bh * 0.18, bw * 0.55, bh * 0.14);
      for (i = 0; i < 4; i++) rect(bx + bw * (0.06 + i * 0.235), by + bh * 0.3, bw * 0.19, bh * 0.6);
    } else {
      var gw = Math.min(w * 0.74, h * 1.35), gh = gw * 0.4, gx = cx - gw / 2, gy = base - gh;
      rect(gx, gy, gw, gh);
      var nf = 3;
      for (i = 0; i < nf; i++) {
        var fx = gx + gw * (i + 0.5) / nf;
        ctx.beginPath(); ctx.ellipse(fx, gy, gw / nf * 0.36, gw / nf * 0.08, 0, 0, Math.PI * 2); ctx.stroke();
        ligne(fx, gy - gw / nf * 0.08, fx, gy - gw / nf * 0.18);
      }
      for (k = 1; k < 9; k++) ligne(gx + gw * 0.05, gy + gh * k / 9, gx + gw * 0.56, gy + gh * k / 9);
      rect(gx + gw * 0.62, gy + gh * 0.14, gw * 0.3, gh * 0.72);
      cercle(gx + gw * 0.77, gy + gh * 0.3, gh * 0.04);
      rect(gx - 4, base, gw + 8, gh * 0.07);
      ligne(gx, gy + gh * 0.42, gx - gw * 0.12, gy + gh * 0.42); ligne(gx, gy + gh * 0.62, gx - gw * 0.12, gy + gh * 0.62);
      rect(gx - gw * 0.13, gy + gh * 0.37, gw * 0.02, gh * 0.1); rect(gx - gw * 0.13, gy + gh * 0.57, gw * 0.02, gh * 0.1);
      ctx.setLineDash([4 * DPR, 4 * DPR]); ctx.strokeStyle = 'rgba(196,233,255,.4)';
      ligne(gx, base + gh * 0.22, gx + gw, base + gh * 0.22); ctx.setLineDash([]);
      ligne(gx, base + gh * 0.16, gx, base + gh * 0.28); ligne(gx + gw, base + gh * 0.16, gx + gw, base + gh * 0.28);
    }
    givre(ctx, w, h, r, { n: 6, longueur: 0.12, prof: 3, alpha: 0.4 });
  }

  function peindre(fig) {
    var c = fig.querySelector('.media__in > canvas');
    if (!c) return;
    var rect = fig.getBoundingClientRect();
    var W = Math.max(40, rect.width), H = Math.max(40, rect.height);
    var echelle = Math.min(DPR, 1600 / W);
    var w = Math.round(W * echelle), h = Math.round(H * echelle);
    if (c.width === w && c.height === h) return;
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var r = graine(fig.dataset.img || 'nelis');
    var chaud = fig.dataset.tone === 'chaud';
    var type = fig.dataset.kind;
    if (type === 'produit' || type === 'lieu') schema(ctx, w, h, r, type === 'lieu' ? 'lieu' : (fig.dataset.schema || 'groupe'));
    else { fondAmbiance(ctx, w, h, r, chaud); givre(ctx, w, h, r, { chaud: chaud }); }
  }

  var obs = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { peindre(e.target); obs.unobserve(e.target); } });
  }, { rootMargin: '600px 0px' }) : null;

  function poser(fig) {
    if (fig.dataset.pose) return;
    fig.dataset.pose = '1';
    var nom = fig.dataset.img, mob = fig.dataset.imgMobile;
    var a = IM[nom] ? nom : null, b = mob && IM[mob] ? mob : null;
    var inner = document.createElement('div');
    inner.className = 'media__in';
    fig.insertBefore(inner, fig.firstChild);
    var decoratif = fig.getAttribute('aria-hidden') === 'true';
    if (a || b) {
      var base = a || b;
      var pic = document.createElement('picture');
      if (a && b) {
        var s = document.createElement('source');
        s.media = '(max-width: 700px)'; s.srcset = srcset(b); s.sizes = '100vw';
        pic.appendChild(s);
      }
      var img = document.createElement('img');
      img.srcset = srcset(base);
      img.sizes = fig.dataset.sizes || '(max-width: 760px) 100vw, 50vw';
      img.src = src(base);
      img.alt = decoratif ? '' : (IM[base].alt || '');
      img.decoding = 'async';
      img.loading = fig.closest('[data-hero]') ? 'eager' : 'lazy';
      if (fig.closest('[data-hero]')) img.fetchPriority = 'high';
      var pos = (mobile.matches && fig.dataset.posMobile) || fig.dataset.pos || IM[base].pos;
      if (pos) img.style.objectPosition = pos;
      if (IM[base].fit === 'contain') fig.dataset.fit = 'contain';
      pic.appendChild(img);
      inner.appendChild(pic);
      fig.classList.add('media--reel');
    } else {
      var c = document.createElement('canvas');
      c.setAttribute('aria-hidden', 'true');
      inner.appendChild(c);
      fig.classList.add('media--provisoire');
      fig.setAttribute('aria-hidden', 'true');
      if (!fig.hasAttribute('data-sans-etiquette')) {
        var cap = document.createElement('figcaption');
        cap.className = 'media__provisoire';
        var reel = fig.dataset.kind === 'produit' || fig.dataset.kind === 'lieu';
        cap.innerHTML = (reel ? 'Photo à venir' : 'Visuel provisoire') + ' · <b>' + nom + '</b>';
        fig.appendChild(cap);
      }
      if (obs) obs.observe(fig); else peindre(fig);
    }
  }

  function couvertures() {
    document.querySelectorAll('[data-couv]').forEach(function (el) {
      var nom = el.dataset.couv;
      if (!IM[nom]) return;
      var img = document.createElement('img');
      img.src = src(nom); img.srcset = srcset(nom); img.sizes = '200px';
      img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.className = 'doc__img';
      el.insertBefore(img, el.firstChild);
    });
  }

  function tout() {
    document.querySelectorAll('figure.media[data-img]').forEach(poser);
    couvertures();
  }

  var dernier = window.innerWidth;
  window.addEventListener('resize', function () {
    if (Math.abs(window.innerWidth - dernier) < 60) return;
    dernier = window.innerWidth;
    clearTimeout(window.__nelisPeint);
    window.__nelisPeint = setTimeout(function () {
      document.querySelectorAll('.media--provisoire').forEach(function (f) { if (f.querySelector('canvas').width) peindre(f); });
    }, 250);
  });

  window.NELIS_MEDIA = { tout: tout, peindre: peindre, givre: givre, fondAmbiance: fondAmbiance, graine: graine };
  tout();
})();
