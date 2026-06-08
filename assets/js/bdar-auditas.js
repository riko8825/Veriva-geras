/* assets/js/bdar-auditas.js
 * BDAR audito wizard — render, navigacija, validacija, submit.
 * Duomenys: window.BDAR_SECTIONS (bdar-questions-data.js).
 * Submit → POST /api/forms/bdar-audit.
 */
(function () {
  'use strict';

  var SECTIONS = window.BDAR_SECTIONS || [];
  var ENDPOINT = '/api/forms/bdar-audit';

  // Būsena
  var answers = {};      // { questionId: value | [values] }
  var comments = {};     // { questionId: "tekstas" }
  var current = 0;       // dabartinė sekcija
  var startedAt = Date.now();

  // El. į/išvestis
  var $ = function (id) { return document.getElementById(id); };
  var EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  // ─── Stage perjungimas ───
  var STAGES = ['ba-intro', 'ba-wizard', 'ba-consent', 'ba-loading', 'ba-success', 'ba-error'];
  function showStage(id) {
    STAGES.forEach(function (s) { var el = $(s); if (el) el.hidden = (s !== id); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus management (P1-3): perkeliam focus į naujos stage antraštę
    var heading = document.querySelector('#' + id + ' h1, #' + id + ' h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }

  // ─── Render visų sekcijų ───
  function render() {
    var wrap = $('ba-steps');
    wrap.innerHTML = '';
    SECTIONS.forEach(function (section, si) {
      var step = document.createElement('div');
      step.className = 'ba-step' + (si === 0 ? ' active' : '');
      step.setAttribute('data-step', si);

      var sub = document.createElement('p');
      sub.className = 'ba-step-sub';
      sub.textContent = (si + 1).toString().padStart(2, '0') + ' / ' + SECTIONS.length.toString().padStart(2, '0');
      step.appendChild(sub);
      var title = document.createElement('h2');
      title.className = 'ba-step-title';
      title.textContent = section.title;
      step.appendChild(title);

      section.questions.forEach(function (q) { step.appendChild(renderQuestion(q)); });
      wrap.appendChild(step);
    });
  }

  function renderQuestion(q) {
    var box = document.createElement('div');
    box.className = 'ba-q';
    box.setAttribute('data-qid', q.id);
    box.setAttribute('data-type', q.type);
    box.setAttribute('data-required', q.required ? '1' : '0');

    var labelId = 'qlabel-' + q.id;
    var inputId = 'qinput-' + q.id;

    if (q.type === 'open') {
      // Tikras <label for> ↔ <input id> ryšys (P0-1)
      var label = document.createElement('label');
      label.className = 'ba-q-label';
      label.id = labelId;
      label.setAttribute('for', inputId);
      label.innerHTML = '<span class="ba-q-num">' + q.n + '.</span>' + esc(q.text);
      box.appendChild(label);
      appendHelp(box, q);

      var input = q.id === 'kontaktinis-asmuo'
        ? document.createElement('textarea')
        : document.createElement('input');
      if (input.tagName === 'INPUT') input.type = 'text';
      input.className = 'ba-input';
      input.id = inputId;
      input.setAttribute('data-input', q.id);
      input.addEventListener('input', function () {
        answers[q.id] = input.value.trim();
        clearError(box);
      });
      box.appendChild(input);
    } else {
      // Pasirinkimų grupė — role="group" + aria-labelledby (P2-3)
      box.setAttribute('role', 'group');
      box.setAttribute('aria-labelledby', labelId);
      var glabel = document.createElement('div');
      glabel.className = 'ba-q-label';
      glabel.id = labelId;
      glabel.innerHTML = '<span class="ba-q-num">' + q.n + '.</span>' + esc(q.text);
      box.appendChild(glabel);
      appendHelp(box, q);

      if (q.type === 'multi') {
        var hint = document.createElement('p');
        hint.className = 'ba-q-multi-hint';
        hint.textContent = 'Galima žymėti kelis variantus';
        box.appendChild(hint);
      }
      var opts = document.createElement('div');
      opts.className = 'ba-options';
      (q.options || []).forEach(function (pair) {
        opts.appendChild(renderOption(q, pair[0], pair[1]));
      });
      box.appendChild(opts);
    }

    if (q.comment) {
      var cw = document.createElement('div');
      cw.className = 'ba-comment';
      var commentId = 'qcomment-' + q.id;
      var cl = document.createElement('label');
      cl.className = 'ba-comment-label';
      cl.setAttribute('for', commentId);
      cl.textContent = q.comment;
      var ci = document.createElement('input');
      ci.type = 'text';
      ci.className = 'ba-input';
      ci.id = commentId;
      ci.addEventListener('input', function () { comments[q.id] = ci.value.trim(); });
      cw.appendChild(cl);
      cw.appendChild(ci);
      box.appendChild(cw);
    }

    var err = document.createElement('p');
    err.className = 'ba-q-error';
    err.textContent = 'Pasirinkite atsakymą';
    box.appendChild(err);

    return box;
  }

  function appendHelp(box, q) {
    if (!q.help) return;
    var help = document.createElement('p');
    help.className = 'ba-q-help';
    help.textContent = q.help;
    box.appendChild(help);
  }

  function renderOption(q, value, text) {
    var opt = document.createElement('label');
    opt.className = 'ba-opt';
    opt.setAttribute('data-type', q.type);
    opt.setAttribute('data-value', value);

    var input = document.createElement('input');
    input.type = q.type === 'multi' ? 'checkbox' : 'radio';
    input.name = q.id;
    input.value = value;

    var boxEl = document.createElement('span');
    boxEl.className = 'ba-opt-box';
    boxEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';

    var txt = document.createElement('span');
    txt.className = 'ba-opt-text';
    txt.textContent = text;

    opt.appendChild(input);
    opt.appendChild(boxEl);
    opt.appendChild(txt);

    input.addEventListener('change', function () { onSelect(q, opt, value); });
    return opt;
  }

  function onSelect(q, optEl, value) {
    var qBox = optEl.closest('.ba-q');
    clearError(qBox);
    if (q.type === 'single') {
      // nuimti checked nuo kitų
      qBox.querySelectorAll('.ba-opt').forEach(function (o) { o.classList.remove('checked'); });
      optEl.classList.add('checked');
      answers[q.id] = value;
    } else {
      optEl.classList.toggle('checked');
      var arr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
      if (optEl.classList.contains('checked')) {
        if (arr.indexOf(value) === -1) arr.push(value);
      } else {
        arr = arr.filter(function (v) { return v !== value; });
      }
      answers[q.id] = arr;
    }
  }

  // ─── Validacija dabartinės sekcijos ───
  function validateSection(si) {
    var section = SECTIONS[si];
    var ok = true;
    var firstError = null;
    section.questions.forEach(function (q) {
      var box = document.querySelector('.ba-q[data-qid="' + q.id + '"]');
      var valid = true;
      if (q.type === 'open') {
        var val = (answers[q.id] || '').trim();
        if (q.required && val.length < 2) { valid = false; setErrorText(box, 'Užpildykite šį lauką'); }
        // kontaktinis asmuo turi turėti el. paštą
        if (q.id === 'kontaktinis-asmuo' && val && !EMAIL_RE.test(val)) {
          valid = false;
          setErrorText(box, 'Nurodykite galiojantį el. paštą');
        }
      } else if (q.type === 'single') {
        if (!answers[q.id]) { valid = false; setErrorText(box, 'Pasirinkite atsakymą'); }
      } else if (q.type === 'multi') {
        if (!Array.isArray(answers[q.id]) || answers[q.id].length === 0) { valid = false; setErrorText(box, 'Pasirinkite bent vieną variantą'); }
      }
      if (!valid) {
        ok = false;
        box.classList.add('has-error');
        if (!firstError) firstError = box;
      }
    });
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return ok;
  }

  function clearError(box) {
    box.classList.remove('has-error');
    var err = box.querySelector('.ba-q-error');
    if (err) err.textContent = 'Pasirinkite atsakymą';
  }
  function setErrorText(box, msg) {
    var err = box.querySelector('.ba-q-error');
    if (err) err.textContent = msg;
  }

  // ─── Navigacija ───
  function goToStep(si) {
    document.querySelectorAll('.ba-step').forEach(function (s) { s.classList.remove('active'); });
    var step = document.querySelector('.ba-step[data-step="' + si + '"]');
    if (step) step.classList.add('active');
    current = si;
    updateProgress();
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    // P2-4: rodom efektyvų pildymo progresą (current+1), ne 0% pirmoje sekcijoje
    var pct = Math.round(((current + 1) / SECTIONS.length) * 100);
    $('ba-progress-fill').style.width = pct + '%';
    $('ba-step-label').textContent = 'Sekcija ' + (current + 1) + ' iš ' + SECTIONS.length;
    $('ba-step-count').textContent = pct + '%';
    var bar = $('ba-progress-bar-el');
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }

  function updateNavButtons() {
    $('ba-prev').hidden = current === 0;
    var last = current === SECTIONS.length - 1;
    $('ba-next').hidden = last;
    $('ba-submit').hidden = !last;
  }

  // ─── Submit ───
  function buildPayload() {
    return {
      answers: answers,
      comments: comments,
      consent: !!($('ba-consent-check') && $('ba-consent-check').checked),
      meta: {
        durationMs: Date.now() - startedAt,
        ua: navigator.userAgent,
        source: 'bdar-auditas'
      },
      website: $('ba-form').website ? $('ba-form').website.value : '' // honeypot
    };
  }

  function extractEmail() {
    var c = answers['kontaktinis-asmuo'] || '';
    var m = c.match(EMAIL_RE);
    return m ? m[0] : '';
  }

  async function submit() {
    showStage('ba-loading');
    var payload = buildPayload();
    try {
      var res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
      var email = extractEmail();
      if (email) {
        $('ba-success-text').textContent =
          'Orientacinę BDAR atitikties išvadą išsiuntėme adresu ' + email +
          '. Patikrinkite ir „šlamšto" aplanką.';
      }
      showStage('ba-success');
    } catch (err) {
      $('ba-error-text').textContent =
        'Nepavyko apdoroti užklausos. Bandykite dar kartą arba susisiekite tiesiogiai. (' +
        (err && err.message ? err.message : 'klaida') + ')';
      showStage('ba-error');
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ─── Init ───
  function init() {
    var yr = $('ba-year'); if (yr) yr.textContent = new Date().getFullYear();
    var introText = $('ba-intro-text'); if (introText) introText.textContent = window.BDAR_INTRO || '';

    // Guard: jei klausimų duomenys neįsikrovė — neleidžiam pradėti (P2-5)
    if (!Array.isArray(SECTIONS) || SECTIONS.length === 0) {
      console.error('[bdar-auditas] BDAR_SECTIONS neįkeltas — klausimynas neveiks');
      var startBtn = $('ba-start');
      if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Klaida įkeliant klausimyną'; }
      return;
    }
    render();

    $('ba-start').addEventListener('click', function () {
      showStage('ba-wizard');
      goToStep(0);
    });

    $('ba-next').addEventListener('click', function () {
      if (!validateSection(current)) return;
      goToStep(current + 1);
    });
    $('ba-prev').addEventListener('click', function () {
      goToStep(Math.max(0, current - 1));
    });

    $('ba-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateSection(current)) return;
      // pereinam į consent stage
      $('ba-progress-fill').style.width = '100%';
      showStage('ba-consent');
    });

    // Consent
    $('ba-consent-check').addEventListener('change', function () {
      $('ba-consent-submit').disabled = !this.checked;
    });
    $('ba-consent-back').addEventListener('click', function () {
      showStage('ba-wizard');
    });
    $('ba-consent-submit').addEventListener('click', function () {
      if (!$('ba-consent-check').checked) return;
      submit();
    });

    // Retry
    $('ba-retry').addEventListener('click', function () {
      showStage('ba-consent');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
