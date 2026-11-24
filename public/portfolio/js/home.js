(function () {
  var SERVICES = [
    { id: 'lead', title: 'Lead Generation', lead: 'Fill your pipeline with the right buyers.', bg: '#fdbc43', fg: '#363641', feat: true, tilt: '-1.4deg',
      icon: 'M12 3a9 9 0 109 9M12 7a5 5 0 105 5M12 11a1 1 0 101 1M13 11l7-7M17 4h3v3',
      items: ['Prospect research', 'Lead magnet strategy', 'Landing page setup', 'SEO keyword research'] },
    { id: 'email', title: 'Email Marketing', lead: 'Turn leads into conversations and sales.', bg: '#7d1633', fg: '#ffffff', tilt: '1.2deg',
      icon: 'M3 6h18v12H3zM3 7l9 6 9-6',
      items: ['Develop email marketing strategies', 'Create and write email content', 'Manage email campaign execution', 'Analyze and optimize campaign performance'] },
    { id: 'research', title: 'Research', lead: 'Know your market before you move.', bg: '#fb8d00', fg: '#363641', tilt: '-1deg',
      icon: 'M10 17a7 7 0 100-14 7 7 0 000 14zM21 21l-6-6',
      items: ['Internet research', 'Market research', 'Competitor analysis', 'Trend analysis', 'Product research'] },
    { id: 'data', title: 'Data Analytics', lead: 'Clear numbers for better decisions.', bg: '#082c8c', fg: '#ffffff', tilt: '1.4deg',
      icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
      items: ['Data visualization', 'Data analysis', 'Reporting', 'Data cleaning', 'Business intelligence', 'Decision making'] },
    { id: 'admin', title: 'Administrative Task', lead: 'Your day-to-day, handled.', bg: '#485d7c', fg: '#ffffff', tilt: '-0.8deg',
      icon: 'M5 4h14v17H5zM9 2h6v4H9zM8.5 11h7M8.5 15h4',
      items: ['Calendar or schedule management', 'Email management', 'File organization', 'Customer support', 'Assistance'] }
  ];

  // Teks ditulis dalam bahasa Inggris; T() menerjemahkannya lewat /assets/js/i18n.js.
  function T(s) { return window.I18N ? window.I18N.t(s) : s; }

  var grid = document.getElementById('svc-grid');
  var flipAllBtn = document.getElementById('flip-all');
  var open = {};
  var cards = {};

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build(d, i) {
    var num = '0' + (i + 1);
    var wrap = el('div', 'svcwrap');
    wrap.style.setProperty('--d', (i * 0.12) + 's');
    var card = el('article', 'svccard shut');
    card.style.setProperty('--tilt', d.tilt);
    card.style.setProperty('--c', d.bg);

    var items = d.items.map(function (it, k) { return '<li style="--i:' + k + '">' + T(it) + '</li>'; }).join('');
    card.innerHTML =
      '<div class="svcinner">' +
        '<div class="svcface svcfront" style="background:' + d.bg + ';color:' + d.fg + '">' +
          (d.feat ? '<span class="svcfeat label">' + T('Core service') + '</span>' : '') +
          '<span class="svcicon" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#363641" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d.icon + '"/></svg></span>' +
          '<h3 class="svctitle">' + T(d.title) + '</h3>' +
          '<span class="label" style="opacity:.85">' + d.items.length + ' ' + T('services') + '</span>' +
          '<span class="svchint label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M3 12a9 9 0 0115.5-6.3L21 8M21 3v5h-5"/></svg>' + T('See what\'s inside') + '</span>' +
          '<span class="svcnum" aria-hidden="true">' + num + '</span>' +
        '</div>' +
        '<div class="svcface svcback">' +
          '<span class="label" style="color:#5c5c64;margin-bottom:6px">' + num + ' · ' + T(d.title) + '</span>' +
          '<h3 class="svcbacktitle">' + T(d.lead) + '</h3>' +
          '<ul class="svclist">' + items + '</ul>' +
          '<span class="svchint label" style="color:#5c5c64"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M21 12a9 9 0 01-15.5 6.3L3 16M3 21v-5h5"/></svg>' + T('Flip back') + '</span>' +
        '</div>' +
      '</div>';

    var btn = el('button', 'svcbtn');
    btn.type = 'button';
    btn.addEventListener('click', function () { toggle(d.id); });
    card.appendChild(btn);
    wrap.appendChild(card);
    cards[d.id] = { card: card, btn: btn, def: d, timer: null };
    return wrap;
  }

  function paint(id) {
    var c = cards[id], isOpen = !!open[id];
    c.card.classList.toggle('open', isOpen);
    c.card.classList.toggle('shut', !isOpen);
    c.btn.setAttribute('aria-expanded', String(isOpen));
    c.btn.setAttribute('aria-label', T(isOpen ? 'Hide services:' : 'Show services:') + ' ' + T(c.def.title));
  }

  // The 3D flip class only lives for the duration of the animation so resting text stays crisp.
  function animate(id) {
    var c = cards[id];
    c.card.classList.add('anim');
    clearTimeout(c.timer);
    c.timer = setTimeout(function () { c.card.classList.remove('anim'); }, 760);
  }

  function allOpen() { return SERVICES.every(function (d) { return open[d.id]; }); }

  function syncFlipAll() {
    var a = allOpen();
    flipAllBtn.setAttribute('aria-pressed', String(a));
    flipAllBtn.querySelector('span').textContent = T(a ? 'Flip all back' : 'Flip all cards');
  }

  function toggle(id) {
    open[id] = !open[id];
    paint(id); animate(id); syncFlipAll();
  }

  flipAllBtn.addEventListener('click', function () {
    var target = !allOpen();
    SERVICES.forEach(function (d) {
      if (!!open[d.id] !== target) { open[d.id] = target; paint(d.id); animate(d.id); }
    });
    syncFlipAll();
  });

  function render() {
    grid.textContent = '';
    SERVICES.forEach(function (d, i) { grid.appendChild(build(d, i)); paint(d.id); });
    syncFlipAll();
  }
  render();
  // Ganti bahasa: bangun ulang kartu, status buka/tutup tetap dipertahankan.
  document.addEventListener('langchange', render);

  // project tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (j < 0) return;
      var n = tabs[(j + tabs.length) % tabs.length];
      select(n); n.focus(); e.preventDefault();
    });
  });
})();
