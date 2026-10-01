/* Mobile menu toggle, draft mode (?draft), prototype-only form validation. No network. */
(function () {
  var btn = document.querySelector('.burger');
  var nav = document.getElementById('mobile-nav');
  var closeBtn = nav && nav.querySelector('.mobile-nav__close');
  var lockY = 0;
  /* While the menu is open everything behind it is inert (+ aria-hidden fallback for browsers without `inert`). */
  var behind = Array.prototype.slice.call(document.querySelectorAll('main, .site-footer, .mobile-bar, .skip, .site-header > .container'));
  function setBehind(hide) {
    behind.forEach(function (el) {
      if (hide) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    });
  }
  function setNav(open, restoreFocus) {
    var root = document.documentElement, body = document.body;
    var wasOpen = root.classList.contains('nav-open');
    if (open === wasOpen) return;
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (open) {
      lockY = window.pageYOffset;
      body.style.top = (-lockY) + 'px';
      root.classList.add('nav-open');
      setBehind(true);
      var a = nav.querySelector('ul a'); if (a) a.focus({ preventScroll: true });
    } else {
      root.classList.remove('nav-open');
      setBehind(false);
      body.style.top = '';
      window.scrollTo({ top: lockY, left: 0, behavior: 'instant' });
      if (restoreFocus) btn.focus({ preventScroll: true });
    }
  }
  if (btn && nav) {
    btn.addEventListener('click', function () {
      setNav(btn.getAttribute('aria-expanded') !== 'true', true);
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { setNav(false, true); });
    document.addEventListener('keydown', function (e) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setNav(false, true); return; }
      if (e.key === 'Tab') { /* focus trap: close button + menu items */
        var items = Array.prototype.slice.call(nav.querySelectorAll('a[href], button'));
        var i = items.indexOf(document.activeElement);
        if (i === -1) { e.preventDefault(); items[e.shiftKey ? items.length - 1 : 0].focus(); }
        else if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false, false);
      else if (e.target === nav || e.target.tagName === 'UL' || e.target.classList.contains('mobile-nav__cta')) setNav(false, true); /* tap on empty backdrop area */
    });
    /* nothing to scroll inside the menu: swallow wheel/touch so no scroll chains to the (locked) page */
    ['wheel', 'touchmove'].forEach(function (t) {
      nav.addEventListener(t, function (e) {
        if (nav.scrollHeight <= nav.clientHeight + 1 && e.cancelable) e.preventDefault();
      }, { passive: false });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1100 && btn.getAttribute('aria-expanded') === 'true') setNav(false, false);
    });
  }

  /* ---------- Consult dialog «Безкоштовна консультація» ----------
     Opens from any [data-consult] link (href stays as the no-JS fallback).
     Native showModal() = top layer + inert page; we add: Tab trap, Esc/backdrop/close button,
     body scroll lock without jump (same technique as the menu), focus return, service preselect,
     visualViewport sizing so the sheet and its submit stay above the on-screen keyboard. */
  var dlg = document.getElementById('consult');
  if (dlg && typeof dlg.showModal === 'function') {
    var dForm = dlg.querySelector('form');
    var dTitle = dlg.querySelector('#consult-title');
    var svcBox = dlg.querySelector('.consult__service');
    var svcName = dlg.querySelector('.consult__service-name');
    var svcInput = dlg.querySelector('input[name="service"]');
    var dSelect = dlg.querySelector('select[name="practice"]');
    var opener = null, dLockY = 0;
    var root = document.documentElement;

    function focusables() {
      return Array.prototype.filter.call(dlg.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'), function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
    }
    function setService(name) {
      svcInput.value = name || '';
      svcName.textContent = name || '';
      svcName.title = name || '';
      svcBox.hidden = !name;
    }
    function fitViewport() {
      var vv = window.visualViewport; if (!vv) return;
      dlg.style.setProperty('--vvh', vv.height + 'px');
      var kb = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      dlg.style.setProperty('--kb', kb + 'px');
    }
    function resetScroll() {
      dlg.scrollTop = 0;
      var a = dlg.querySelector('.consult__scroll'), b = dlg.querySelector('.consult__body');
      if (a) a.scrollTop = 0;
      if (b) b.scrollTop = 0;
    }
    function openDialog(from) {
      if (dlg.open) return;
      opener = from || document.activeElement;
      setService(from && from.getAttribute('data-service'));
      var pr = from && from.getAttribute('data-practice');
      if (dSelect) dSelect.value = pr && dSelect.querySelector('option[value="' + pr + '"]') ? pr : '';
      var st = dlg.querySelector('[role="status"]'); if (st) st.textContent = '';
      clearErr(dForm);
      var sbw = window.innerWidth - root.clientWidth;
      dLockY = window.pageYOffset;
      root.style.setProperty('--sbw', sbw + 'px');
      document.body.style.top = (-dLockY) + 'px';
      root.classList.add('modal-open');
      fitViewport();
      dlg.showModal();
      resetScroll();
      /* desktop: straight to the first field; touch: the title (no keyboard pops up over the sheet) */
      if (window.matchMedia('(pointer: fine)').matches) dlg.querySelector('#m-name').focus({ preventScroll: true });
      else dTitle.focus({ preventScroll: true });
      resetScroll();
    }
    function closeDialog() {
      if (!dlg.open) return;
      dlg.close();
      root.classList.remove('modal-open');
      document.body.style.top = '';
      root.style.removeProperty('--sbw');
      window.scrollTo({ top: dLockY, left: 0, behavior: 'instant' });
      var back = opener && opener.offsetParent !== null ? opener : (btn && btn.offsetParent !== null ? btn : null);
      if (back) back.focus({ preventScroll: true });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-consult]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      /* opened from the burger menu: the menu closes first (its own click handler), then the dialog opens */
      openDialog(a);
    });
    dlg.querySelector('.consult__close').addEventListener('click', closeDialog);
    dlg.querySelector('.consult__service-clear').addEventListener('click', function () {
      setService(''); if (dSelect) dSelect.focus();
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(); }); /* Esc */
    dlg.addEventListener('click', function (e) { /* backdrop: click lands on <dialog> itself, outside its box */
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog();
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (i === -1) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    /* keep the focused field visible inside the scrolling sheet body */
    dlg.addEventListener('focusin', function (e) {
      if (!e.target.matches('input, select, textarea')) return;
      setTimeout(function () { e.target.scrollIntoView({ block: 'nearest' }); }, 250);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { if (dlg.open) fitViewport(); });
      window.visualViewport.addEventListener('scroll', function () { if (dlg.open) fitViewport(); });
    }
  }

  if (/[?&]draft(=|&|$)/.test(location.search)) {
    document.documentElement.classList.add('draft-mode');
    var note = document.createElement('div');
    note.className = 'draft-note';
    note.textContent = 'Режим чернетки: пунктир — наші тексти, хвиля — одруківки в анкетах';
    document.body.appendChild(note);
  }

  /* Sticky bar safety net: some browsers ignore scroll-padding for partially visible focus targets. */
  var bar = document.querySelector('.mobile-bar');
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.closest && el.closest('dialog')) return;
    if (!bar || !el.form || bar.offsetParent === null && getComputedStyle(bar).display === 'none') return;
    var limit = window.innerHeight - bar.offsetHeight - 16;
    var r = el.getBoundingClientRect();
    if (r.bottom > limit) window.scrollBy(0, r.bottom - limit);
  });

  function clearErr(f) {
    f.querySelectorAll('.field--error, .check--error').forEach(function (n) {
      n.classList.remove('field--error', 'check--error');
    });
    f.querySelectorAll('[data-err]').forEach(function (n) { n.remove(); });
    f.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
  }
  function showErr(el) {
    var isCheck = el.type === 'checkbox';
    var box = el.closest(isCheck ? '.check' : '.field');
    if (!box) return;
    box.classList.add(isCheck ? 'check--error' : 'field--error');
    el.setAttribute('aria-invalid', 'true');
    var m = document.createElement('span');
    m.setAttribute('data-err', '');
    m.className = isCheck ? 'check__err' : 'hint err';
    m.textContent = isCheck ? 'Потрібна згода, щоб надіслати заявку' : (el.type === 'tel' ? 'Вкажіть телефон' : 'Заповніть це поле');
    box.appendChild(m);
  }
  document.querySelectorAll('form[data-proto]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = f.querySelector('[role="status"]');
      clearErr(f);
      if (!f.checkValidity()) {
        var bad = Array.prototype.filter.call(f.elements, function (el) { return el.willValidate && !el.checkValidity(); });
        bad.forEach(showErr);
        if (s) s.textContent = 'Перевірте позначені поля.';
        bad[0].focus();
        return;
      }
      if (s) s.textContent = 'Прототип: заявку не надіслано (форма без підключення).';
    });
    f.addEventListener('input', function (e) {
      var el = e.target, box = el.closest('.field, .check');
      if (box && el.checkValidity()) {
        box.classList.remove('field--error', 'check--error');
        box.querySelectorAll('[data-err]').forEach(function (n) { n.remove(); });
        el.removeAttribute('aria-invalid');
      }
    });
  });
})();
