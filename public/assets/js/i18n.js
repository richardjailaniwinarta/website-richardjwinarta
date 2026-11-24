/* Richard J Winarta — i18n.js
   Dua bahasa: English (default) dan Bahasa Indonesia.
   HTML ditulis dalam bahasa Inggris. Terjemahan Indonesia ada di i18n-id.js
   (window.RJW_ID: teks Inggris -> teks Indonesia). Pilihan bahasa disimpan di
   localStorage ("rjw-lang"); ?lang=id atau ?lang=en juga bisa dipakai.
   Halaman produk (/produk, Kit Operasional, Studio Kartun 3D) tidak memuat file ini. */
(function () {
  "use strict";

  var STORE = "rjw-lang";
  var DICT = window.RJW_ID || {};
  var ATTRS = ["alt", "title", "aria-label", "placeholder", "data-detail", "data-aria", "data-note", "data-label-on", "data-label-off"];
  var ATTR_SEL = ATTRS.map(function (a) { return "[" + a + "]"; }).join(",");
  var META_SEL = 'meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"],meta[name="twitter:title"],meta[name="twitter:description"]';
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, svg: 1, SVG: 1 };
  var BLOCKISH = "svg,img,button,a,video,input,ul,ol,li,div,p,figure,section,table,h1,h2,h3,h4,h5,h6";
  var DEBUG = /[?&]i18n-debug\b/.test(location.search);

  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function hasLetters(s) { return /[A-Za-z]{2}/.test(s); }
  function has(k) { return Object.prototype.hasOwnProperty.call(DICT, k); }

  function readLang() {
    var m = /[?&]lang=(en|id)\b/.exec(location.search);
    if (m) {
      try { localStorage.setItem(STORE, m[1]); } catch (e) {}
      return m[1];
    }
    try {
      var v = localStorage.getItem(STORE);
      if (v === "id" || v === "en") return v;
    } catch (e) {}
    return "en";
  }

  var lang = readLang();
  var root = document.documentElement;
  var touchedEls = [];
  var touchedText = [];
  var touchedAttrs = [];
  var misses = {};
  var ready = false;

  root.lang = lang;
  if (lang === "id") {
    // Sembunyikan halaman sebentar supaya teks Inggris tidak sempat terlihat.
    root.classList.add("i18n-wait");
    var st = document.createElement("style");
    st.textContent = "html.i18n-wait body{visibility:hidden}";
    document.head.appendChild(st);
    setTimeout(function () { root.classList.remove("i18n-wait"); }, 2500);
  }

  /* Terjemahan teks biasa untuk string yang dibuat oleh JavaScript. */
  function t(en) {
    if (lang !== "id") return en;
    var k = norm(en);
    if (!has(k)) { if (DEBUG) misses[k] = "t"; return en; }
    var v = DICT[k];
    if (v.indexOf("<") >= 0) { var d = document.createElement("div"); d.innerHTML = v; return d.textContent; }
    return v;
  }

  function skipped(el) { return el.hasAttribute("data-i18n-skip"); }

  function applyText(node) {
    var raw = node.data, k = norm(raw);
    if (!hasLetters(k)) return;
    if (!has(k)) { if (DEBUG) misses[k] = "text"; return; }
    var v = DICT[k];
    if (v.indexOf("<") >= 0) { var d = document.createElement("div"); d.innerHTML = v; v = d.textContent; }
    var lead = /^\s*/.exec(raw)[0], trail = /\s*$/.exec(raw)[0];
    touchedText.push({ node: node, data: raw });
    node.data = lead + v + trail;
  }

  function walk(el) {
    if (SKIP_TAGS[el.tagName] || skipped(el)) return;
    var hasDirect = false, hasElemChild = false, i, c;
    for (i = 0; i < el.childNodes.length; i++) {
      c = el.childNodes[i];
      if (c.nodeType === 3 && hasLetters(c.data)) hasDirect = true;
      else if (c.nodeType === 1) hasElemChild = true;
    }
    if (hasDirect && hasElemChild && !el.querySelector(BLOCKISH)) {
      var ek = norm(el.textContent);
      if (has(ek) && DICT[ek].indexOf("<") >= 0) {
        touchedEls.push({ el: el, html: el.innerHTML });
        el.innerHTML = DICT[ek];
        return;
      }
      if (DEBUG) misses[ek] = "html";
    }
    var kids = Array.prototype.slice.call(el.childNodes);
    for (i = 0; i < kids.length; i++) {
      c = kids[i];
      if (c.nodeType === 3) applyText(c);
      else if (c.nodeType === 1) walk(c);
    }
  }

  function applyAttrs(scope) {
    var list = Array.prototype.slice.call(scope.querySelectorAll(ATTR_SEL));
    if (scope.nodeType === 1 && scope.matches(ATTR_SEL)) list.unshift(scope);
    list.forEach(function (el) {
      if (el.closest("[data-i18n-skip]") || SKIP_TAGS[el.tagName]) return;
      ATTRS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var raw = el.getAttribute(a), k = norm(raw);
        if (!hasLetters(k)) return;
        if (has(k)) {
          touchedAttrs.push({ el: el, name: a, val: raw });
          el.setAttribute(a, DICT[k]);
        } else if (DEBUG) misses[k] = "attr:" + a;
      });
    });
  }

  function applyHead() {
    var k = norm(document.title);
    if (has(k)) { touchedAttrs.push({ el: document, name: "title", val: document.title }); document.title = DICT[k]; }
    else if (DEBUG) misses[k] = "title";
    document.querySelectorAll(META_SEL).forEach(function (m) {
      var raw = m.getAttribute("content") || "", kk = norm(raw);
      if (has(kk)) { touchedAttrs.push({ el: m, name: "content", val: raw }); m.setAttribute("content", DICT[kk]); }
      else if (DEBUG && kk) misses[kk] = "meta";
    });
  }

  function apply(scope) {
    scope = scope || document.body;
    if (lang !== "id") return;
    walk(scope);
    applyAttrs(scope);
  }

  function restore() {
    touchedEls.forEach(function (x) { x.el.innerHTML = x.html; });
    touchedText.forEach(function (x) { x.node.data = x.data; });
    touchedAttrs.forEach(function (x) {
      if (x.name === "title" && x.el === document) document.title = x.val;
      else x.el.setAttribute(x.name, x.val);
    });
    touchedEls = []; touchedText = []; touchedAttrs = [];
  }

  function paintSwitch() {
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
  }

  function set(next) {
    if (next !== "en" && next !== "id") return;
    if (next === lang && ready) return;
    restore();
    lang = next;
    root.lang = lang;
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    if (lang === "id") { apply(document.body); applyHead(); }
    paintSwitch();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  function buildSwitch() {
    document.querySelectorAll("[data-lang-switch]").forEach(function (mount) {
      mount.textContent = "";
      mount.classList.add("langsw");
      mount.setAttribute("role", "group");
      mount.setAttribute("aria-label", "Language / Bahasa");
      [["en", "EN", "English"], ["id", "ID", "Bahasa Indonesia"]].forEach(function (L) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "langsw-btn";
        b.setAttribute("data-set-lang", L[0]);
        b.setAttribute("lang", L[0]);
        b.setAttribute("aria-label", L[2]);
        b.textContent = L[1];
        b.addEventListener("click", function () { set(L[0]); });
        mount.appendChild(b);
      });
    });
    paintSwitch();
  }

  function init() {
    buildSwitch();
    if (lang === "id") { apply(document.body); applyHead(); }
    ready = true;
    root.classList.remove("i18n-wait");
    paintSwitch();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang, initial: true } }));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.I18N = {
    get lang() { return lang; },
    t: t,
    apply: apply,
    set: set,
    misses: function () { return misses; }
  };
})();
