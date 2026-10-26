/* NELIS · demande de devis en 4 étapes (démonstration : rien n'est envoyé) */
(function () {
  'use strict';
  var N = window.NELIS || {};
  var G = window.gsap;

  function kwDe(v) { return Math.pow(500, v / 100); }
  function fmtKw(kw) {
    if (kw < 10) return kw.toFixed(1).replace('.', ',') + ' kW';
    if (kw < 100) return Math.round(kw) + ' kW';
    return Math.round(kw / 5) * 5 + ' kW';
  }
  function fmtTemp(t) { return (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + ' °C'; }
  function fmtDuree(s) { return s === 1 ? '1 semaine' : s < 52 ? s + ' semaines' : '1 an ou plus'; }

  function orientation(d) {
    var kw = d.kwInconnu ? null : d.kw, t = d.temp, process = ['process', 'plasturgie', 'laser', 'agro', 'vin'].indexOf(d.application) >= 0;
    var bt = t <= -10 ? ' Basse température : une spécialité de notre service, avec refroidissement en cascade si nécessaire.' : '';
    if (d.besoin === 'service' || d.besoin === 'urgence') {
      return '<strong>Intervention de nos frigoristes certifiés</strong>, sur nos équipements comme sur ceux des autres marques.' + (d.besoin === 'urgence' ? ' En urgence, appelez le +33 3 84 68 96 50.' : ' Contrôle annuel d’étanchéité sur demande.');
    }
    if (d.besoin === 'location') {
      if (t < 5 || process || d.equipement === 'groupe') return '<strong>Groupe d’eau glacée mobile CF Chiller</strong>, piloté à distance' + (kw && kw > 150 ? ', éventuellement plusieurs unités' : '') + '.' + bt;
      if (kw === null) return '<strong>À définir avec nos experts</strong> : climatiseur mobile ou grand système raccordé à un groupe d’eau glacée.';
      if (kw <= 3.5) return '<strong>Climatiseur mobile avec gaine d’évacuation</strong> (3,5 kW).';
      if (kw <= 6.7) return '<strong>Climatiseur mobile sans gaine</strong>, raccordement par tuyau d’eau (4 à 6,7 kW).';
      if (kw <= 9) return '<strong>Climatiseur avec gaine d’air froid</strong> (7 kW), ou deux appareils mobiles.';
      if (kw < 15) return '<strong>Plusieurs climatiseurs mobiles</strong> ou un grand système : à étudier avec nos experts.';
      if (kw <= 150) return '<strong>Grand système de climatisation</strong> raccordé à un groupe d’eau glacée (15 à 150 kW par unité).';
      return '<strong>Groupes d’eau glacée mobiles CF Chiller</strong>, plusieurs unités selon le besoin.';
    }
    if (d.equipement === 'pac') {
      if (kw === null) return '<strong>Pompe à chaleur CF Chiller</strong> : air-eau 8 à 420 kW, eau-eau 6 à 400 kW, sur mesure 6 à 420 kW.';
      var l = [];
      if (kw >= 8 && kw <= 420) l.push('air-eau (8 à 420 kW)');
      if (kw >= 6 && kw <= 400) l.push('eau-eau (6 à 400 kW)');
      if (kw >= 6 && kw <= 420) l.push('sur mesure (6 à 420 kW)');
      return l.length ? '<strong>Pompe à chaleur CF Chiller</strong> : ' + l.join(', ') + '.' : '<strong>Hors des gammes publiées</strong> : nos experts étudient une solution adaptée.';
    }
    if (d.equipement === 'split') {
      if (kw !== null && kw > 15) return '<strong>Plusieurs unités AUX ou système VRF</strong> : 2,05 à 15 kW par appareil.';
      return '<strong>Système split AUX</strong>, de 2,05 à 15 kW par appareil : murale, cassette, plafond-sol ou gainable.';
    }
    if (d.equipement === 'mobile') return '<strong>Climatiseur mobile</strong> de 3,5 à 7 kW, à l’achat ou à la location.';
    return '<strong>Groupe d’eau glacée CF Chiller</strong>, dimensionné sur mesure sans surcoût.' + bt;
  }

  function init(form) {
    var section = form.closest('section');
    var etapes = Array.prototype.slice.call(form.querySelectorAll('[data-etape]'));
    var liste = section.querySelectorAll('[data-etapes-liste] li');
    var conduite = section.querySelector('[data-conduite]');
    var prec = form.querySelector('[data-prec]'), suiv = form.querySelector('[data-suiv]'), envoyer = form.querySelector('[data-envoyer]');
    var compteur = form.querySelector('[data-compteur]'), resultat = form.querySelector('[data-resultat]'), navForm = form.querySelector('[data-nav-form]');
    var kw = form.querySelector('[data-kw]'), kwInc = form.querySelector('[data-kw-inconnu]'), tp = form.querySelector('[data-temp]'), du = form.querySelector('[data-duree]');
    var sKw = form.querySelector('[data-sortie-kw]'), sT = form.querySelector('[data-sortie-temp]'), sD = form.querySelector('[data-sortie-duree]');
    var orient = form.querySelector('[data-orientation]'), erreur = form.querySelector('[data-erreur]');
    var courante = 0;

    function donnees() {
      var b = form.querySelector('input[name="besoin"]:checked');
      return {
        besoin: b ? b.value : null,
        equipement: form.equipement.value,
        application: form.application.value,
        kw: kwDe(+kw.value), kwInconnu: kwInc.checked,
        temp: +tp.value, duree: +du.value
      };
    }
    function piste(r) { var p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); }
    function maj() {
      var d = donnees();
      sKw.textContent = d.kwInconnu ? 'à définir' : '≈ ' + fmtKw(d.kw);
      kw.disabled = d.kwInconnu;
      sT.textContent = fmtTemp(d.temp);
      sD.textContent = fmtDuree(d.duree);
      [kw, tp, du].forEach(piste);
      orient.innerHTML = orientation(d);
      form.querySelector('[data-si-urgence]').hidden = d.besoin !== 'urgence';
      form.querySelector('[data-si-location]').hidden = d.besoin !== 'location';
    }
    function aller(i) {
      courante = Math.max(0, Math.min(etapes.length - 1, i));
      etapes.forEach(function (f, k) { f.classList.toggle('is-actif', k === courante); });
      Array.prototype.forEach.call(liste, function (li, k) { li.classList.toggle('is-actif', k === courante); li.classList.toggle('is-fait', k < courante); });
      if (conduite) conduite.style.setProperty('--avance', ((courante + 1) / etapes.length).toFixed(3));
      prec.hidden = courante === 0;
      suiv.hidden = courante === etapes.length - 1;
      envoyer.hidden = courante !== etapes.length - 1;
      compteur.textContent = 'Étape ' + (courante + 1) + ' sur ' + etapes.length;
      if (erreur) erreur.hidden = true;
      if (G && N.anime) G.from(etapes[courante], { opacity: 0, x: 24, duration: 0.6, ease: 'expo.out', clearProps: 'all' });
    }
    function valider(i) {
      if (i === 0 && !donnees().besoin) { montrerErreur(etapes[0], 'Choisissez votre besoin pour continuer.'); return false; }
      if (i === 3) {
        var ok = true, premier = null;
        etapes[3].querySelectorAll('[data-requis]').forEach(function (c) {
          var inp = c.querySelector('input');
          var bon = inp.value.trim() !== '' && (inp.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()));
          c.classList.toggle('is-erreur', !bon);
          inp.setAttribute('aria-invalid', bon ? 'false' : 'true');
          if (!bon) { ok = false; premier = premier || inp; }
        });
        var rgpd = form.consentement;
        if (!rgpd.checked) { ok = false; premier = premier || rgpd; }
        if (!ok) { montrerErreur(etapes[3], 'Complétez l’entreprise, le nom, une adresse e-mail valide et cochez le consentement.'); if (premier) premier.focus(); return false; }
      }
      return true;
    }
    function montrerErreur(fs, txt) {
      var p = fs.querySelector('.erreur');
      if (!p) { p = document.createElement('p'); p.className = 'erreur'; p.setAttribute('role', 'alert'); fs.appendChild(p); }
      p.textContent = txt; p.hidden = false;
    }

    suiv.addEventListener('click', function () { if (valider(courante)) aller(courante + 1); });
    prec.addEventListener('click', function () { aller(courante - 1); });
    form.addEventListener('input', maj);
    form.addEventListener('change', function (e) {
      maj();
      if (e.target.name === 'besoin') { var p = etapes[0].querySelector('.erreur'); if (p) p.hidden = true; }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valider(3)) return;
      var d = donnees(), fd = new FormData(form);
      var lignes = [
        ['Besoin', { achat: 'Achat d’équipement', location: 'Location', service: 'Entretien ou réparation', urgence: 'Urgence' }[d.besoin]],
        ['Équipement', form.equipement.options[form.equipement.selectedIndex].text],
        ['Application', form.application.options[form.application.selectedIndex].text],
        ['Puissance', d.kwInconnu ? 'À définir' : '≈ ' + fmtKw(d.kw)],
        ['Température', fmtTemp(d.temp)]
      ];
      if (d.besoin === 'location') lignes.push(['Durée', fmtDuree(d.duree)]);
      if (fd.get('code_postal')) lignes.push(['Code postal', fd.get('code_postal')]);
      if (fd.get('date')) lignes.push(['Date souhaitée', new Date(fd.get('date')).toLocaleDateString('fr-FR')]);
      var sur = fd.getAll('sur_place'); if (sur.length) lignes.push(['Sur place', sur.join(', ')]);
      lignes.push(['Contact', [fd.get('civilite'), fd.get('prenom'), fd.get('nom')].filter(Boolean).join(' ') + ', ' + fd.get('entreprise')]);
      lignes.push(['E-mail', fd.get('email')]);
      if (fd.get('telephone')) lignes.push(['Téléphone', fd.get('telephone')]);
      lignes.push(['Orientation', orient.textContent]);
      var dl = form.querySelector('[data-recap]');
      dl.innerHTML = '';
      lignes.forEach(function (l) { var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = l[0]; dd.textContent = l[1]; dl.appendChild(dt); dl.appendChild(dd); });
      etapes.forEach(function (f) { f.classList.remove('is-actif'); });
      navForm.hidden = true;
      resultat.hidden = false;
      Array.prototype.forEach.call(liste, function (li) { li.classList.remove('is-actif'); li.classList.add('is-fait'); });
      if (conduite) conduite.style.setProperty('--avance', '1');
      resultat.focus();
      if (G && N.anime) G.from(resultat, { opacity: 0, y: 20, duration: 0.8, ease: 'expo.out' });
    });
    form.querySelector('[data-recommencer]').addEventListener('click', function () {
      form.reset(); resultat.hidden = true; navForm.hidden = false;
      if (form.dataset.mode === 'location') form.querySelector('input[value="location"]').checked = true;
      maj(); aller(0);
    });

    function preselection(v) {
      var r = form.querySelector('input[name="besoin"][value="' + v + '"]');
      if (r) { r.checked = true; maj(); }
    }
    document.addEventListener('nelis:preselection', function (e) { preselection(e.detail); });
    try { var pre = window.sessionStorage.getItem('nelis-preselection'); if (pre) { preselection(pre); window.sessionStorage.removeItem('nelis-preselection'); } } catch (e) { /* rien */ }

    maj(); aller(0);
  }

  document.querySelectorAll('[data-form]').forEach(init);
})();
