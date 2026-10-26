/* NELIS · givre WebGL sur le titre d'ouverture (OGL), avec repli CSS */
(function () {
  'use strict';
  var html = document.documentElement;

  var VERT = 'attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }';

  var FRAG = [
    'precision highp float;',
    'uniform float uTime; uniform vec2 uRes; uniform sampler2D uMelt; uniform float uGrow; uniform vec4 uTitle; uniform float uBord;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }',
    'float ridge(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ float n = 1.0 - abs(noise(p) * 2.0 - 1.0); v += a * n * n; p = p * 2.17 + vec2(3.1, 1.3); a *= 0.5; } return v; }',
    'float voro(vec2 x){ vec2 n = floor(x), f = fract(x); float d1 = 8.0, d2 = 8.0;',
    '  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){ vec2 g = vec2(float(i), float(j)); vec2 r = g + hash2(n + g) - f; float d = dot(r, r);',
    '    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2){ d2 = d; } }',
    '  return sqrt(d2) - sqrt(d1); }',
    'void main(){',
    '  vec2 uv = vUv; float asp = uRes.x / uRes.y; vec2 p = vec2(uv.x * asp, uv.y);',
    '  float edge = min(min(uv.x, 1.0 - uv.x) * max(asp, 1.0), uv.y * 1.15);',
    '  float n = fbm(p * 2.5 + 3.0);',
    '  float edgeF = 1.0 - smoothstep(0.0, uBord, edge * 1.1 + (n - 0.5) * uBord * 0.85);',
    '  vec2 tc = uTitle.xy + uTitle.zw * 0.5; vec2 td = abs(uv - tc) - uTitle.zw * 0.5;',
    '  float tdist = length(max(td * vec2(asp, 1.0), 0.0));',
    '  float inside = 1.0 - smoothstep(0.0, 0.025, tdist);',
    '  float titleF = (1.0 - smoothstep(0.0, 0.07, tdist)) * (0.45 + 0.55 * fbm(p * 4.0 + 7.0));',
    '  float dens = max(edgeF, titleF * 0.62);',
    '  float t = 1.3 - uGrow * 1.5;',
    '  float front = edgeF * 0.65 + titleF * 0.3 + n * 0.35;',
    '  dens *= smoothstep(t, t + 0.16, front);',
    '  float melt = texture2D(uMelt, uv).a;',
    '  float m = smoothstep(0.08, 0.55, melt);',
    '  dens *= 1.0 - m * 0.97;',
    '  float cr = ridge(p * 7.0 + n * 1.5);',
    '  float fine = ridge(p * 19.0 + vec2(5.2, 1.7));',
    '  float cells = 1.0 - smoothstep(0.0, 0.06, voro(p * 6.0 + n));',
    '  float pat = clamp(0.12 + cr * 0.9 + fine * 0.55 + cells * 0.22, 0.0, 1.3);',
    '  vec3 col = mix(vec3(0.72, 0.86, 1.0), vec3(0.96, 0.99, 1.0), fine);',
    '  col = mix(col, vec3(0.66, 0.67, 0.89), cells * 0.55);',
    '  float rim = smoothstep(0.04, 0.2, melt) * (1.0 - smoothstep(0.2, 0.5, melt));',
    '  float tw = step(0.9965, hash(floor(p * 160.0) + floor(uTime * 1.2))) * dens;',
    '  float a = dens * pat * 0.6 + rim * dens * 0.35 + tw * 0.5;',
    '  a = min(a, mix(1.0, 0.36, inside));',
    '  a = clamp(a, 0.0, 0.92);',
    '  gl_FragColor = vec4(col * a, a);',
    '}'
  ].join('\n');

  function creer(canvas, hero, cible) {
    if (!window.OGL) return null;
    var O = window.OGL, renderer, gl;
    var petit = window.matchMedia('(max-width: 760px)').matches;
    try {
      renderer = new O.Renderer({ canvas: canvas, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, dpr: Math.min(window.devicePixelRatio || 1, petit ? 0.85 : 1.25) });
      gl = renderer.gl;
    } catch (e) { return null; }
    if (!gl) return null;
    gl.clearColor(0, 0, 0, 0);

    var MW = 256, MH = 160;
    var fonte = document.createElement('canvas'); fonte.width = MW; fonte.height = MH;
    var mx = fonte.getContext('2d');
    var tex = new O.Texture(gl, { image: fonte, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    var u = { uTime: { value: 0 }, uRes: { value: [1, 1] }, uMelt: { value: tex }, uGrow: { value: 0 }, uTitle: { value: [0.1, 0.3, 0.6, 0.3] }, uBord: { value: 0.3 } };
    var program;
    try { program = new O.Program(gl, { vertex: VERT, fragment: FRAG, uniforms: u, transparent: true, depthTest: false, depthWrite: false }); }
    catch (e) { return null; }
    var mesh = new O.Mesh(gl, { geometry: new O.Triangle(gl), program: program });

    function mesurer() {
      var r = hero.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      u.uRes.value = [r.width, r.height];
      u.uBord.value = r.width < 700 ? 0.13 : 0.3;
      if (cible) {
        var rg = document.createRange(); rg.selectNodeContents(cible);
        var t = rg.getBoundingClientRect();
        if (!t.width) t = cible.getBoundingClientRect();
        u.uTitle.value = [(t.left - r.left) / r.width, 1 - (t.bottom - r.top) / r.height, t.width / r.width, t.height / r.height];
      }
    }
    mesurer();
    window.addEventListener('resize', mesurer);

    function fondre(x, y, rayon, force) {
      var g = mx.createRadialGradient(x, y, 0, x, y, rayon);
      g.addColorStop(0, 'rgba(255,255,255,' + force + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      mx.globalCompositeOperation = 'lighter';
      mx.fillStyle = g; mx.fillRect(x - rayon, y - rayon, rayon * 2, rayon * 2);
      mx.globalCompositeOperation = 'source-over';
      tex.needsUpdate = true;
    }
    var dx = null, dy = null;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width * MW, y = (e.clientY - r.top) / r.height * MH;
      var v = dx === null ? 0 : Math.hypot(x - dx, y - dy);
      dx = x; dy = y;
      fondre(x, y, 14 + Math.min(v, 30) * 0.7, 0.32);
    }, { passive: true });

    var visible = true, image = 0, dernier = 0, raf = 0;
    function boucle(t) {
      raf = requestAnimationFrame(boucle);
      if (!visible || document.hidden) return;
      if (t - dernier < 22) return;
      dernier = t;
      image++;
      if (image % 4 === 0) {
        mx.globalCompositeOperation = 'destination-out';
        mx.fillStyle = 'rgba(0,0,0,0.03)';
        mx.fillRect(0, 0, MW, MH);
        mx.globalCompositeOperation = 'source-over';
        tex.needsUpdate = true;
      }
      u.uTime.value = t / 1000;
      renderer.render({ scene: mesh });
    }
    raf = requestAnimationFrame(boucle);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    }

    return {
      pousser: function () {
        if (window.gsap) {
          window.gsap.to(u.uGrow, { value: 1, duration: 2.4, ease: 'power2.out' });
          if (cible) {
            var o = { p: 0 };
            window.gsap.to(o, { p: 1, duration: 1.5, delay: 1.5, ease: 'power1.inOut', onUpdate: function () {
              var r = hero.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(cible); var tt = rg.getBoundingClientRect();
              var x = (tt.left - r.left + tt.width * o.p) / r.width * MW;
              var lignes = Math.max(1, Math.round(tt.height / 90));
              for (var i = 0; i < lignes; i++) {
                var yy = (tt.top - r.top + tt.height * (i + 0.5) / lignes + Math.sin(o.p * 9 + i) * 14) / r.height * MH;
                fondre(x, yy, 18, 0.22);
              }
            } });
          }
        } else u.uGrow.value = 1;
      },
      mesurer: mesurer
    };
  }

  window.NELIS_GIVRE = function (hero) {
    if (!hero) return null;
    var canvas = hero.querySelector('[data-givre]');
    if (!canvas || html.classList.contains('calme')) return null;
    var g = creer(canvas, hero, hero.querySelector('[data-givre-cible]'));
    if (!g) { html.classList.add('sans-webgl'); return null; }
    return g;
  };

  function givreStatique(hero) {
    var boite = hero.querySelector('.hero__givre-css');
    if (!boite || !window.NELIS_MEDIA || boite.querySelector('canvas')) return;
    var c = document.createElement('canvas'), r = hero.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 1.5);
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    boite.appendChild(c);
    var M = window.NELIS_MEDIA;
    M.givre(c.getContext('2d'), c.width, c.height, M.graine('givre-hero'), { n: 30, longueur: 0.24, prof: 4, alpha: 0.6 });
  }

  if (window.NELIS) {
    window.NELIS.surPret(function () {
      var hero = document.querySelector('[data-hero]');
      if (!hero || !hero.querySelector('[data-givre]')) return;
      if (html.classList.contains('calme')) { givreStatique(hero); return; }
      var delai = hero.hasAttribute('data-hero-chaleur') && window.NELIS.anime ? 1500 : 150;
      setTimeout(function () {
        var g = window.NELIS_GIVRE(hero);
        if (g) { g.mesurer(); g.pousser(); } else givreStatique(hero);
      }, delai);
    });
  }
})();
