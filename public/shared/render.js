// Menyusun HTML halaman public. Fungsi yang sama dipakai server (halaman asli)
// dan browser (pratinjau admin), sehingga pratinjau selalu sama dengan hasilnya.

import { THEMES, readableInk } from './themes.js';
import { safeImage } from './schema.js';

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

// Mengembalikan URL yang aman, atau '' jika tidak valid. "wa.me/62..." dianggap https.
export function safeUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  const candidate = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(value) ? `https://${value}` : value;
  try {
    const url = new URL(candidate);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function visibleLinks(config) {
  return config.links.filter((link) => link.on && safeUrl(link.url));
}

const svg = (width, stroke, paths) => `<svg width="${width}" height="${width}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICON = {
  chevron: svg(16, 1.6, '<path d="M9 6l6 6-6 6"/>'),
  arrow: svg(18, 1.3, '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>'),
  diagonal: svg(16, 1.6, '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>'),
  chat: svg(19, 1.8, '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/>'),
  briefcase: svg(22, 1.4, '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>'),
  link: svg(22, 1.4, '<path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>')
};

function photo(config, className = '') {
  const { url, x, y, zoom } = config.photo;
  const base = THEMES[config.theme].photoBase;
  const left = base === null ? x : Math.min(100, Math.max(0, base + (x - 50)));
  const position = `${left}% ${y}%`;
  const src = safeImage(url) || '/assets/photo-default.jpg';
  return `<img class="photo ${className}" src="${esc(src)}" alt="Foto ${esc(config.name)}" style="object-position:${position};transform:scale(${zoom / 100});transform-origin:${position}">`;
}

function ctaButton(link) {
  if (!link) return '';
  const isChat = /wa\.me|whatsapp/i.test(link.url);
  return `<a class="cta" href="${esc(safeUrl(link.url))}" style="color:var(--cta-ink)">${isChat ? ICON.chat : ''}<span>${esc(link.title)}</span></a>`;
}

function linkText(link) {
  const sub = link.sub ? `<span class="link-sub">${esc(link.sub)}</span>` : '';
  return `<span class="link-text"><span class="link-title">${esc(link.title)}</span>${sub}</span>`;
}

function linkMedia(link) {
  const thumb = safeImage(link.thumb);
  if (thumb) return `<img class="link-thumb" src="${esc(thumb)}" alt="">`;
  return `<span class="link-icon">${ICON[link.icon] ?? ICON.link}</span>`;
}

function splitLinks(config) {
  const shown = visibleLinks(config);
  return { others: shown.filter((l) => !l.primary), primary: shown.find((l) => l.primary) };
}

const emptyNote = (config) => (visibleLinks(config).length ? '' : '<p class="empty-note">Belum ada link yang tampil.</p>');

function logam(config) {
  const { others, primary } = splitLinks(config);
  const { effects } = config;
  const rosetteClass = effects.spin ? 'rosette rosette-main spin' : 'rosette rosette-main';
  const opacity = (effects.pattern / 140).toFixed(3);
  const rows = others.map((link) => `<a class="link" href="${esc(safeUrl(link.url))}">${linkMedia(link)}${linkText(link)}<span class="link-end">${ICON.chevron}</span></a>`).join('');
  return `
  <img class="${rosetteClass}" src="/assets/guilloche.svg" alt="" style="opacity:${opacity}">
  <img class="rosette rosette-corner" src="/assets/guilloche.svg" alt="" style="opacity:${(opacity * 0.48).toFixed(3)}">
  <div class="col">
    <div class="card-stage" data-card-stage data-tilt="${effects.tilt}">
      <div class="card" data-card>
        <div class="face front">
          ${photo(config)}
          <div class="panel-fade" aria-hidden="true"></div>
          ${effects.sheen ? '<div class="sheen" aria-hidden="true"></div>' : ''}
          <div class="nameplate">
            <h1>${esc(config.name)}</h1>
            <p>${esc(config.role)}</p>
          </div>
        </div>
        <div class="face back">
          <div class="stripe"></div>
          <p class="foil">${esc(config.bio)}</p>
        </div>
      </div>
      <button class="card-flip" type="button" data-card-flip aria-label="Balik kartu"></button>
    </div>
    <nav class="links" aria-label="Tautan">${rows}${emptyNote(config)}</nav>
    ${ctaButton(primary)}
  </div>`;
}

function sinema(config) {
  const { others, primary } = splitLinks(config);
  const rows = others.map((link) => `<a class="link" href="${esc(safeUrl(link.url))}">${linkText(link)}<span class="link-end">${ICON.arrow}</span></a>`).join('');
  return `
  <div class="glow" aria-hidden="true"></div>
  <div class="col">
    <div class="photo-frame">${photo(config)}</div>
    <header class="intro">
      <p class="role">${esc(config.role)}</p>
      <h1>${esc(config.name)}</h1>
      <p class="bio">${esc(config.bio)}</p>
    </header>
    <nav class="links" aria-label="Tautan">${rows}${emptyNote(config)}</nav>
    ${ctaButton(primary)}
  </div>`;
}

function kaca(config) {
  const { others, primary } = splitLinks(config);
  const rows = others.map((link) => `<a class="link" href="${esc(safeUrl(link.url))}">${linkMedia(link)}${linkText(link)}<span class="link-end">${ICON.diagonal}</span></a>`).join('');
  return `
  <div class="embers" aria-hidden="true"><div class="ember ember-a"></div><div class="ember ember-b"></div></div>
  <div class="col">
    <header class="intro">
      <div class="photo-frame">${photo(config)}</div>
      <h1>${esc(config.name)}</h1>
    </header>
    <section class="sheet">
      <p class="bio">${esc(config.role)}. ${esc(config.bio)}</p>
      <nav class="links" aria-label="Tautan">${rows}${emptyNote(config)}${ctaButton(primary)}</nav>
    </section>
  </div>`;
}

function galeri(config) {
  const { others, primary } = splitLinks(config);
  const rows = others.map((link, i) => `<a class="link" href="${esc(safeUrl(link.url))}"><span class="link-no">${i + 1}.</span>${linkText(link)}<span class="link-end">${ICON.arrow}</span></a>`).join('');
  const button = primary ? ctaButton(primary).replace('</a>', '<span class="dot" aria-hidden="true"></span></a>') : '';
  return `
  <div class="col">
    <header class="intro">
      <figure class="frame"><div class="photo-frame">${photo(config)}</div></figure>
      <h1>${esc(config.name)}</h1>
      <p class="bio">${esc(config.role)}. ${esc(config.bio)}</p>
    </header>
    <div class="bottom">
      <nav class="links" aria-label="Tautan">${rows}${emptyNote(config)}</nav>
      ${button}
    </div>
  </div>`;
}

const RENDERERS = { logam, sinema, kaca, galeri };

// HTML satu elemen <main> berisi halaman untuk tema yang aktif.
export function renderPage(config) {
  const colors = config.colors[config.theme];
  const vars = Object.entries(colors).map(([slot, hex]) => `--c-${slot}:${esc(hex)}`);
  vars.push(`--cta-ink:${readableInk(colors.cta)}`);
  return `<main class="page theme-${config.theme}" style="${vars.join(';')}">${RENDERERS[config.theme](config)}</main>`;
}
