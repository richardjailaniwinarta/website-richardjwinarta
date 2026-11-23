/* Landing page Kit Operasional Klien VA: kalkulator tarif, UTM, dan tombol beli di HP.
   Teks awal sudah ada di HTML, jadi halaman tetap bisa dipakai tanpa JavaScript. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- UTM diteruskan ke checkout Lynk.id ---------- */
  var params = new URLSearchParams(location.search);
  var utm = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].filter(function (k) { return params.get(k); });
  if (utm.length) {
    document.querySelectorAll("[data-cta]").forEach(function (a) {
      var url = new URL(a.href);
      utm.forEach(function (k) { url.searchParams.set(k, params.get(k)); });
      a.href = url.toString();
    });
  }

  /* ---------- Kalkulator (rumus sama dengan sheet Kalkulator Tarif) ---------- */
  var KURS = 16300, CUTI = 0.10, PAJAK = 0.03, FEE = 0.02, TERTAGIH = 0.80, MINGGU = 4.33;
  var rp = function (n) { return "Rp" + Math.round(n).toLocaleString("id-ID"); };
  var usd = function (n) { return "US$" + n.toFixed(2); };

  function hitung() {
    var target = +$("k-target").value, biaya = +$("k-biaya").value, jam = +$("k-jam").value, tarif = +$("k-tarif").value;
    var kotor = (target + biaya) * (1 + CUTI) / (1 - PAJAK) / (1 - FEE);
    var perJam = kotor / (jam * MINGGU * TERTAGIH);
    var min = perJam / KURS;
    $("o-target").textContent = rp(target);
    $("o-biaya").textContent = rp(biaya);
    $("o-jam").textContent = jam + " jam";
    $("o-tarif").textContent = usd(tarif);
    $("r-usd").textContent = usd(min);
    $("r-idr").textContent = rp(perJam) + " per jam";
    $("r-verdict").textContent =
      tarif < min ? "Tarifmu " + usd(min - tarif) + " per jam di bawah minimum."
      : tarif < min * 1.2 ? "Di atas minimum, tapi tipis. Masih ada ruang naik."
      : "Sehat. Pertahankan dengan scope yang jelas.";
  }
  ["k-target", "k-biaya", "k-jam", "k-tarif"].forEach(function (id) { $(id).addEventListener("input", hitung); });
  hitung();

  /* ---------- Tombol beli di HP: muncul saat tombol beli lain tidak terlihat ---------- */
  var sticky = $("k-sticky");
  if (sticky && "IntersectionObserver" in window) {
    var terlihat = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) terlihat.add(e.target); else terlihat.delete(e.target);
      });
      sticky.classList.toggle("is-off", terlihat.size > 0);
    });
    document.querySelectorAll("main [data-cta]").forEach(function (a) { io.observe(a); });
  }
})();
