/* NELIS · page Groupes d'eau glacée : schéma de principe piloté par le défilement */
(function () {
  'use strict';
  var N = window.NELIS, G = window.gsap, ST = window.ScrollTrigger;
  var $ = N.$, $$ = N.$$;

  function schema() {
    var sec = $('[data-schema-section]');
    if (!sec) return;
    var etapes = $$('[data-schema-etapes] li', sec), svg = $('svg', sec), cour = -1;
    var comps = $$('[data-c]', svg), flux = $$('[data-s]', svg);
    function activer(i) {
      if (i === cour) return;
      cour = i;
      var pas = String(i + 1);
      etapes.forEach(function (li, k) { li.classList.toggle('is-actif', k === i); });
      comps.forEach(function (c) {
        var on = c.dataset.c === pas || (pas === '4' && c.dataset.c === '1') || (pas === '3' && c.dataset.c === '4');
        c.classList.toggle('is-actif', on);
      });
      flux.forEach(function (f) {
        var on = f.dataset.s.split(' ').indexOf(pas) >= 0;
        f.style.opacity = on ? '1' : '0.28';
        f.style.transition = 'opacity .5s';
      });
    }
    if (!N.anime) { etapes.forEach(function (li) { li.classList.add('is-actif'); }); comps.forEach(function (c) { c.classList.add('is-actif'); }); return; }
    activer(0);
    if (N.bureau.matches) {
      sec.classList.add('is-epingle');
      ST.create({
        trigger: sec, start: 'top top', end: '+=' + (etapes.length * 60) + '%', pin: $('.schema__epingle', sec), scrub: true,
        onUpdate: function (s) { activer(Math.min(etapes.length - 1, Math.floor(s.progress * etapes.length * 0.999))); }
      });
    } else {
      var t = 0;
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !t) t = setInterval(function () { activer((cour + 1) % etapes.length); }, 3200);
        else if (!en[0].isIntersecting) { clearInterval(t); t = 0; }
      }).observe(svg);
    }
  }

  document.addEventListener('nelis:structure', schema);
})();
