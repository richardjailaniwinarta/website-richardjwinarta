// Kerangka HTML untuk halaman yang disusun Worker.

import { fontsUrl } from '../public/shared/themes.js';
import { esc, renderPage } from '../public/shared/render.js';

const ADMIN_FONT = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap';
const FONT_HOSTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';

export function publicHtml(config, origin) {
  const title = esc(config.name || 'Halaman link');
  const description = esc(config.bio);
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${esc(origin)}/links">
<meta property="og:image" content="${esc(origin + config.photo.url)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${FONT_HOSTS}
<link rel="stylesheet" href="${esc(fontsUrl([config.theme]))}">
<link rel="stylesheet" href="/css/site.css">
<script type="module" src="/js/site.js"></script>
</head>
<body>
${renderPage(config)}
</body>
</html>`;
}

export function previewHtml() {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pratinjau</title>
${FONT_HOSTS}
<link rel="stylesheet" href="${esc(fontsUrl(['logam', 'sinema', 'kaca', 'galeri']))}">
<link rel="stylesheet" href="/css/site.css">
<script type="module" src="/js/preview.js"></script>
</head>
<body><div id="root"></div></body>
</html>`;
}

export function loginHtml(config, configured) {
  const notice = configured
    ? ''
    : '<p class="login-error" role="alert">Akun admin belum diatur. Tambahkan Secret <code>ADMIN_EMAIL</code> dan <code>ADMIN_PASSWORD</code> (minimal 10 karakter) di pengaturan Worker pada dashboard Cloudflare.</p>';
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Masuk ke admin</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${FONT_HOSTS}
<link rel="stylesheet" href="${ADMIN_FONT}">
<link rel="stylesheet" href="/admin-assets/admin.css">
<script type="module" src="/admin-assets/login.js"></script>
</head>
<body class="login-body">
<form class="login" id="login-form">
  <img class="login-photo" src="${esc(config.photo.url)}" alt="" style="object-position:88% 50%">
  <h1>Masuk untuk mengatur halamanmu</h1>
  ${notice}
  <p class="login-error" id="login-error" role="alert" hidden></p>
  <div class="field">
    <label for="login-email">Email</label>
    <input id="login-email" name="email" type="email" autocomplete="username" required placeholder="nama@email.com">
  </div>
  <div class="field">
    <label for="login-password">Kata sandi</label>
    <input id="login-password" name="password" type="password" autocomplete="current-password" required>
  </div>
  <button class="btn-primary" type="submit" id="login-submit">Masuk</button>
  <a class="login-back" href="/">Kembali ke halaman public</a>
</form>
</body>
</html>`;
}

export function adminHtml() {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Admin halaman</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${FONT_HOSTS}
<link rel="stylesheet" href="${ADMIN_FONT}">
<link rel="stylesheet" href="/admin-assets/admin.css">
<script type="module" src="/admin-assets/admin.js"></script>
</head>
<body>
<header class="topbar">
  <div class="topbar-title">
    <strong>Halaman Richard</strong>
    <span id="theme-note"></span>
  </div>
  <span class="status" id="status" role="status"></span>
  <a class="btn-ghost" href="/links" target="_blank" rel="noopener">Lihat halaman</a>
  <button class="btn-ghost" type="button" id="logout">Keluar</button>
  <button class="btn-primary" type="button" id="publish">Terbitkan</button>
</header>

<main class="workspace">
  <div class="column column-content">
    <section class="panel" aria-labelledby="h-profil">
      <h2 id="h-profil">Profil</h2>
      <div class="grid-2">
        <div class="field"><label for="f-name">Nama</label><input id="f-name" maxlength="80"></div>
        <div class="field"><label for="f-role">Jabatan</label><input id="f-role" maxlength="80"></div>
      </div>
      <div class="field"><label for="f-bio" id="f-bio-label">Bio</label><textarea id="f-bio" rows="2" maxlength="280"></textarea></div>
    </section>

    <section class="panel" aria-labelledby="h-foto">
      <div class="panel-head">
        <h2 id="h-foto">Foto</h2>
        <label class="btn-outline file-button" for="f-photo"><span>Ganti foto</span><input id="f-photo" type="file" accept="image/png,image/jpeg,image/webp"></label>
      </div>
      <p class="field-error" id="photo-error" role="alert" hidden></p>
      <div class="grid-3">
        <div class="field"><label for="f-x">Geser kiri-kanan</label><input id="f-x" type="range" min="0" max="100"></div>
        <div class="field"><label for="f-y">Geser atas-bawah</label><input id="f-y" type="range" min="0" max="100"></div>
        <div class="field"><label for="f-zoom">Zoom</label><input id="f-zoom" type="range" min="100" max="220"></div>
      </div>
    </section>

    <section class="panel" aria-labelledby="h-link">
      <div class="panel-head">
        <h2 id="h-link">Link</h2>
        <span class="muted" id="link-count"></span>
        <button class="btn-outline" type="button" id="add-link">Tambah link</button>
      </div>
      <ul class="link-list" id="link-list"></ul>
    </section>
  </div>

  <section class="panel column column-look" aria-labelledby="h-tampilan">
    <h2 id="h-tampilan">Tampilan</h2>
    <div class="group">
      <h3>Tema</h3>
      <div class="theme-grid" id="theme-grid"></div>
    </div>
    <div class="group">
      <div class="group-head">
        <h3 id="color-title">Warna</h3>
        <button class="text-button" type="button" id="reset-colors">Kembalikan warna awal</button>
      </div>
      <div class="slot-grid" id="slot-grid"></div>
      <div class="swatch-grid" id="swatch-grid"></div>
      <div class="hex-row">
        <label for="f-hex">Kode warna</label>
        <input id="f-hex" spellcheck="false" maxlength="7">
        <span class="field-error" id="hex-error" role="alert" hidden>Contoh format: #fb8d00</span>
      </div>
      <p class="warning" id="contrast-warning" role="alert" hidden></p>
    </div>
    <div class="group" id="effects-group">
      <h3>Efek</h3>
      <div class="field"><label for="f-pattern">Kekuatan pola garis</label><input id="f-pattern" type="range" min="0" max="100"></div>
      <div id="effect-list"></div>
    </div>
  </section>

  <section class="column column-preview" aria-labelledby="h-preview">
    <div class="preview-head">
      <h2 id="h-preview">Pratinjau</h2>
      <button class="btn-outline btn-small" type="button" id="flip-preview">Lihat belakang</button>
    </div>
    <iframe class="preview-frame" id="preview" src="/admin/preview" title="Pratinjau halaman public"></iframe>
  </section>
</main>
</body>
</html>`;
}
