(function () {
  // Tab groups: buttons carry data-group + data-target; panels carry data-group + id.
  // Optional on the button: data-url, data-aria, data-note update #<group>-url / -screen / -note.
  var groups = {};
  document.querySelectorAll('[role="tab"][data-group]').forEach(function (b) {
    (groups[b.dataset.group] = groups[b.dataset.group] || []).push(b);
  });
  Object.keys(groups).forEach(function (g) {
    var tabs = groups[g];
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.dataset.target);
        if (panel) panel.hidden = !on;
      });
      var url = document.getElementById(g + '-url');
      if (url && tab.dataset.url) url.textContent = tab.dataset.url;
      var screen = document.getElementById(g + '-screen');
      if (screen && tab.dataset.aria) screen.setAttribute('aria-label', tab.dataset.aria);
      var note = document.getElementById(g + '-note');
      if (note && tab.dataset.note) note.textContent = tab.dataset.note;
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
  });

  // Zoom toggles
  document.querySelectorAll('[data-zoom]').forEach(function (btn) {
    var screen = document.getElementById(btn.dataset.zoom);
    btn.addEventListener('click', function () {
      var on = screen.classList.toggle('zoomed');
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? btn.dataset.labelOn : btn.dataset.labelOff;
    });
  });

  // Accordion steppers: <button class="stepbtn" data-detail="...">
  document.querySelectorAll('.steps').forEach(function (list) {
    var btns = Array.prototype.slice.call(list.querySelectorAll('.stepbtn'));
    var detail = null;
    function close() {
      if (detail) { detail.remove(); detail = null; }
      btns.forEach(function (b) { b.classList.remove('sel'); b.setAttribute('aria-expanded', 'false'); });
    }
    function open(b) {
      close();
      b.classList.add('sel');
      b.setAttribute('aria-expanded', 'true');
      detail = document.createElement('p');
      detail.className = 'stepdetail';
      detail.textContent = b.dataset.detail;
      b.after(detail);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { b.classList.contains('sel') ? close() : open(b); });
    });
    if (btns.length) open(btns[0]);
  });

  // Email page: subject line styles
  var slTabs = document.querySelectorAll('.sl-tab');
  if (slTabs.length) {
    var DEFS = {
      curiosity: { why: 'Opens a loop the reader wants closed, ideal for a welcome email.', lines: ['You won’t believe what can shift in your first coaching session…', 'Something powerful is about to begin…', 'This one mindset shift changed everything for my client…'] },
      proof: { why: 'Social proof makes the reader feel others already trust you.', lines: ['Join 100+ clients who started their transformation here', 'Breakthroughs begin here – real results, real stories'] },
      benefit: { why: 'Tells the reader exactly what they gain by opening, perfect for value emails.', lines: ['How to overcome limiting beliefs in 3 simple steps', 'Rewire your thinking, transform your results'] },
      urgency: { why: 'A real deadline turns interest into action, used in the promotional email.', lines: ['Only 3 coaching slots left – Book yours now!', 'Last chance: Discovery call applications close tonight!'] }
    };
    var box = document.getElementById('sl-box');
    var ICON = '<span class="sl-ic" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 7l9 6 9-6"/></svg></span>';
    var tabsArr = Array.prototype.slice.call(slTabs);
    var showSl = function (tab) {
      tabsArr.forEach(function (t) {
        t.setAttribute('aria-selected', String(t === tab));
        t.tabIndex = t === tab ? 0 : -1;
      });
      var d = DEFS[tab.dataset.style];
      box.innerHTML = '';
      var why = document.createElement('p');
      why.className = 'sl-why';
      why.textContent = d.why;
      box.appendChild(why);
      d.lines.forEach(function (l) {
        var row = document.createElement('div');
        row.className = 'sl-line';
        row.innerHTML = ICON;
        var s = document.createElement('span');
        s.textContent = l;
        row.appendChild(s);
        box.appendChild(row);
      });
      // restart the entrance animation
      box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
    };
    tabsArr.forEach(function (t, i) {
      t.addEventListener('click', function () { showSl(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (j < 0) return;
        var n = tabsArr[(j + tabsArr.length) % tabsArr.length];
        showSl(n); n.focus(); e.preventDefault();
      });
    });
    showSl(tabsArr[0]);
  }
})();
