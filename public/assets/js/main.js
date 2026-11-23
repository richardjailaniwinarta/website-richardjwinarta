/* Richard J Winarta — main.js
   Interaksi: tab layanan, pilihan paket, testimoni, filter produk.
   Konten awal sudah ada di HTML, jadi halaman tetap terbaca tanpa JavaScript. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(pathData, color, size) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", size || 26);
    svg.setAttribute("height", size || 26);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", color);
    svg.setAttribute("stroke-width", "1.7");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", pathData);
    svg.appendChild(path);
    return svg;
  }

  /* ---------- Tab layanan ---------- */
  var PANELS = {
    jasa: {
      eyebrow: "Jasa Executive Virtual Assistant",
      headline: "Dari calon pembeli sampai klien tetap.",
      blurb: "Tiga layanan untuk menemukan calon pembeli, mengelolanya, dan mengubahnya jadi klien tetap.",
      cta: "Tanya layanan ini",
      href: "#kontak",
      external: false,
      items: [
        { title: "Landing Pages", body: "Satu tugas: penawaran jelas, copy yang menjual, jalur mudah menuju ya", color: "#F66C2D", ink: "#363641", d: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M3 9.5h18 M7 7.25h.01 M10 7.25h.01" },
        { title: "Lead Generation", body: "Lead magnet, CRM data management, outreach sampai discovery call", color: "#FDBC43", ink: "#363641", d: "M3 4h18l-7 8.5V19l-4 2v-8.5z" },
        { title: "Email Marketing", body: "Strategi, rangkaian email, subject line, dan copy", color: "#4691CC", ink: "#363641", d: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M3 7l9 6.5L21 7" }
      ]
    },
    portfolio: {
      eyebrow: "Portfolio",
      headline: "Hasil kerja yang bisa Anda lihat sendiri.",
      blurb: "Contoh pekerjaan nyata: landing page, lead generation, dan email marketing untuk klien.",
      cta: "Lihat case study",
      href: "/portfolio/#work",
      external: false,
      items: [
        { title: "Lesson ReVAmp with Richard", body: "Funnel dan pendaftaran event", color: "#7D1633", ink: "#F0EBDF", d: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M4 9h16 M8 2.5v3 M16 2.5v3 M9 14l2 2 4-4" },
        { title: "Ocean Smith Fitness", body: "Lead magnet dan opt-in", color: "#485D7C", ink: "#F0EBDF", d: "M4 12h2 M18 12h2 M6 8v8 M18 8v8 M9 6v12 M15 6v12 M9 12h6" },
        { title: "PassionSwirls Creative", body: "Welcome series dan newsletter", color: "#F97C39", ink: "#363641", d: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" }
      ]
    },
    produk: {
      eyebrow: "Produk Digital",
      headline: "Siap pakai, tinggal unduh dan jalankan.",
      blurb: "Panduan dan toolkit yang bisa langsung Anda pakai.",
      cta: "Lihat semua produk",
      href: "/produk",
      external: false,
      items: [
        { title: "English Survival Kit", body: "Contekan kalimat Inggris kerja remote", color: "#082C8C", ink: "#F0EBDF", d: "M21 8l-9-5-9 5v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8" },
        { title: "Studio Kartun 3D dengan Claude Code", body: "Panduan video animasi kartun 3D", color: "#FB8D00", ink: "#363641", d: "M12 3v12 M7 10l5 5 5-5 M4 20h16" },
        { title: "Checklist: Legit atau Scam?", body: "Gratis untuk calon VA dan pekerja remote", color: "#FFD5C7", ink: "#7D1633", d: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z M14 3v5h5 M9 13h6 M9 17h6" }
      ]
    }
  };

  var tabs = document.querySelectorAll("[data-tab]");
  var panelEyebrow = document.getElementById("panel-eyebrow");
  if (tabs.length && panelEyebrow) {
    var panelHeadline = document.getElementById("panel-headline");
    var panelBlurb = document.getElementById("panel-blurb");
    var panelCta = document.getElementById("panel-cta");
    var panelItems = document.getElementById("panel-items");

    var showTab = function (id) {
      var data = PANELS[id];
      if (!data) return;
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-tab") === id;
        tab.setAttribute("aria-pressed", String(on));
        tab.querySelector(".tab-pill").textContent = on ? "Dipilih" : "Lihat";
      });
      panelEyebrow.textContent = data.eyebrow;
      panelHeadline.textContent = data.headline;
      panelBlurb.textContent = data.blurb;
      panelCta.textContent = data.cta + " →";
      panelCta.setAttribute("href", data.href);
      if (data.external) {
        panelCta.setAttribute("target", "_blank");
        panelCta.setAttribute("rel", "noopener");
      } else {
        panelCta.removeAttribute("target");
        panelCta.removeAttribute("rel");
      }
      panelItems.textContent = "";
      data.items.forEach(function (it) {
        var row = el("div", "item lift");
        var ic = el("span", "item-icon");
        ic.style.background = it.color;
        ic.appendChild(icon(it.d, it.ink));
        var txt = el("span");
        txt.appendChild(el("span", "item-title", it.title));
        txt.appendChild(el("span", "item-body", it.body));
        row.appendChild(ic);
        row.appendChild(txt);
        panelItems.appendChild(row);
      });
    };

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { showTab(tab.getAttribute("data-tab")); });
    });
  }

  /* ---------- Pilihan paket ---------- */
  var plans = document.querySelectorAll(".plan");
  plans.forEach(function (plan) {
    plan.addEventListener("click", function () {
      plans.forEach(function (p) {
        var on = p === plan;
        p.setAttribute("aria-pressed", String(on));
        p.querySelector(".plan-pill").textContent = on ? "Dipilih" : "Pilih";
      });
    });
  });

  /* ---------- Testimoni ---------- */
  var TESTIMONIALS = [
    { quote: "“Richard communicated clearly during the presentation and was able to share ideas and suggestions to support his team.”", who: "Yeo Lee Ling Grace", role: "Co-founder, Nature Sanctuary Pte Ltd" },
    { quote: "“Richard has a sense of humor, he can also present himself and his ideas well. I like how he is straight to the point and kept his emails short.”", who: "Boh Jia Min", role: "Founder, PassionSwirls Creative" },
    { quote: "“Richard is a reliable team leader who consistently demonstrates strong leadership and support for his team.”", who: "Gianytha C.", role: "CDP Lead Generation Supervisor, SGB" },
    { quote: "“His concept for a 3-part welcome series was particularly strong and showed a clear understanding of strategy.”", who: "Reni Dwi Astuti Handayani", role: "CDP Email Marketing Supervisor, SGB" }
  ];
  var quoteEl = document.getElementById("testi-quote");
  var dotsWrap = document.getElementById("testi-dots");
  if (quoteEl && dotsWrap) {
    var whoEl = document.getElementById("testi-who");
    var roleEl = document.getElementById("testi-role");
    var showTesti = function (i) {
      var t = TESTIMONIALS[i];
      quoteEl.textContent = t.quote;
      whoEl.textContent = t.who;
      roleEl.textContent = t.role;
      dotsWrap.querySelectorAll(".dot-btn").forEach(function (b, n) {
        b.setAttribute("aria-pressed", String(n === i));
      });
    };
    TESTIMONIALS.forEach(function (t, i) {
      var b = el("button", "dot-btn");
      b.type = "button";
      b.setAttribute("aria-label", "Testimoni dari " + t.who);
      b.setAttribute("aria-pressed", String(i === 0));
      b.appendChild(el("span"));
      b.addEventListener("click", function () { showTesti(i); });
      dotsWrap.appendChild(b);
    });
  }

  /* ---------- Filter produk ---------- */
  var filters = document.querySelectorAll("[data-filter]");
  var products = document.querySelectorAll(".product");
  var countEl = document.getElementById("filter-count");
  if (filters.length && products.length) {
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        var shown = 0;
        filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        products.forEach(function (p) {
          var match = f === "semua" || p.getAttribute("data-cat") === f;
          p.hidden = !match;
          if (match) shown += 1;
        });
        if (countEl) countEl.textContent = "Menampilkan " + shown + " dari " + products.length + " produk";
      });
    });
  }
})();
