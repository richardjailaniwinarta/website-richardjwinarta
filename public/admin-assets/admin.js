import { PALETTE, THEMES, contrast, defaultColors } from '/shared/themes.js';
import { esc, safeUrl } from '/shared/render.js';

const $ = (selector) => document.querySelector(selector);
// Paket gratis KV membatasi 1.000 penyimpanan per hari, jadi draft disimpan setelah jeda.
const SAVE_DELAY = 3000;
const MAX_PHOTO = 8 * 1024 * 1024;

let config;
let published = true;
let saveTimer = null;
let saving = false;
let saveFailed = false;
let saveError = '';
let lastSaved = '';
let activeSlot = null;
let editingLink = null;
let adding = false;
let previewReady = false;
let dragId = null;

const preview = $('#preview');

/* ---------- Komunikasi ke server ---------- */

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (response.status === 401) {
    location.href = '/admin/login';
    throw new Error('Sesi berakhir.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Permintaan gagal.');
  return body;
}

function renderStatus() {
  const status = $('#status');
  const publishButton = $('#publish');
  let text = 'Sudah diterbitkan';
  let tone = 'ok';
  if (saveFailed) {
    text = saveError || 'Gagal menyimpan';
    tone = 'bad';
  } else if (saveTimer || saving) {
    text = 'Menyimpan...';
    tone = 'wait';
  } else if (!published) {
    text = 'Belum diterbitkan';
    tone = 'wait';
  }
  status.textContent = text;
  status.dataset.tone = tone;
  publishButton.disabled = published && !saveTimer && !saving && !saveFailed;
}

async function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const body = JSON.stringify(config);
  if (body === lastSaved) {
    renderStatus();
    return;
  }
  saving = true;
  renderStatus();
  try {
    const { dirty } = await api('/api/draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    lastSaved = body;
    published = !dirty;
    saveFailed = false;
  } catch (err) {
    saveFailed = true;
    saveError = err.message;
  }
  saving = false;
  renderStatus();
}

function changed() {
  sendPreview();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, SAVE_DELAY);
  saveFailed = false;
  renderStatus();
}

let previewTimer = null;
function sendPreview() {
  if (!previewReady) return;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    preview.contentWindow.postMessage({ type: 'config', config }, location.origin);
  }, 60);
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== preview.contentWindow) return;
  if (event.data?.type === 'ready') {
    previewReady = true;
    if (config) sendPreview();
  }
  if (event.data?.type === 'flipped') {
    $('#flip-preview').textContent = event.data.value ? 'Lihat depan' : 'Lihat belakang';
  }
});

// Perubahan terakhir tetap terkirim saat tab ditutup.
window.addEventListener('pagehide', () => {
  if (!saveTimer) return;
  fetch('/api/draft', {
    method: 'PUT',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
});

/* ---------- Foto ---------- */

async function uploadImage(file) {
  if (file.size > MAX_PHOTO) throw new Error('File terlalu besar. Maksimal 8 MB.');
  const { url } = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file });
  return url;
}

$('#f-photo').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const errorBox = $('#photo-error');
  errorBox.hidden = true;
  try {
    config.photo = { url: await uploadImage(file), x: 50, y: 50, zoom: 100 };
    syncPhotoInputs();
    changed();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});

function syncPhotoInputs() {
  $('#f-x').value = config.photo.x;
  $('#f-y').value = config.photo.y;
  $('#f-zoom').value = config.photo.zoom;
}

for (const [id, key] of [['#f-x', 'x'], ['#f-y', 'y'], ['#f-zoom', 'zoom']]) {
  $(id).addEventListener('input', (event) => {
    config.photo[key] = Number(event.target.value);
    changed();
  });
}

/* ---------- Profil ---------- */

for (const [id, key] of [['#f-name', 'name'], ['#f-role', 'role'], ['#f-bio', 'bio']]) {
  $(id).addEventListener('input', (event) => {
    config[key] = event.target.value;
    changed();
  });
}

/* ---------- Link ---------- */

const ICONS = {
  up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>',
  grip: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  link: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/></svg>'
};

function linkProblem(link) {
  if (!link.url.trim()) return 'URL belum diisi, link ini belum tampil.';
  if (!safeUrl(link.url)) return 'URL tidak valid, link ini belum tampil.';
  return '';
}

function renderLinkMeta() {
  const shown = config.links.filter((l) => l.on && safeUrl(l.url)).length;
  $('#link-count').textContent = `${shown} dari ${config.links.length} tampil`;
  $('#add-link').textContent = adding ? 'Batal' : 'Tambah link';
}

function linkRow(link, index) {
  const problem = linkProblem(link);
  const meta = !link.on ? `Tersembunyi · ${link.url || 'URL kosong'}` : link.url;
  const media = link.thumb
    ? `<img class="row-thumb" src="${esc(link.thumb)}" alt="">`
    : `<span class="row-thumb row-thumb-empty">${ICONS.link}</span>`;
  const editor = editingLink === link.id ? `
    <div class="row-editor">
      <div class="field"><label for="title-${index}">Judul</label><input id="title-${index}" data-field="title" maxlength="120" value="${esc(link.title)}"></div>
      <div class="field"><label for="sub-${index}">Keterangan</label><input id="sub-${index}" data-field="sub" maxlength="160" value="${esc(link.sub)}"></div>
      <div class="field"><label for="url-${index}">URL</label><input id="url-${index}" data-field="url" maxlength="2000" inputmode="url" value="${esc(link.url)}" placeholder="https://"></div>
      <div class="field"><label for="img-${index}">Gambar</label><input id="img-${index}" data-field="thumb" type="file" accept="image/png,image/jpeg,image/webp"></div>
      ${link.thumb ? '<button class="text-button" type="button" data-action="clear-thumb">Hapus gambar</button>' : ''}
      <p class="field-error" data-role="thumb-error" role="alert" hidden></p>
    </div>` : '';
  return `
  <li class="row" data-id="${esc(link.id)}" data-on="${link.on}">
    <div class="row-main">
      <span class="grip" draggable="true" title="Seret untuk mengubah urutan">${ICONS.grip}</span>
      <div class="row-order">
        <button type="button" data-action="up" aria-label="Naikkan ${esc(link.title)}">${ICONS.up}</button>
        <button type="button" data-action="down" aria-label="Turunkan ${esc(link.title)}">${ICONS.down}</button>
      </div>
      ${media}
      <div class="row-text">
        <span class="row-title">${esc(link.title) || 'Tanpa judul'}</span>
        <span class="row-meta">${esc(meta)}</span>
        <span class="row-problem"${link.on && problem ? '' : ' hidden'}>${esc(problem)}</span>
      </div>
      <button class="chip" type="button" data-action="edit" aria-expanded="${editingLink === link.id}">Ubah</button>
      <button class="chip" type="button" data-action="primary" aria-pressed="${link.primary}">Utama</button>
      <button class="switch" type="button" role="switch" data-action="toggle" aria-checked="${link.on}" aria-label="Tampilkan ${esc(link.title)}"><span></span></button>
      <button class="row-delete" type="button" data-action="delete" aria-label="Hapus ${esc(link.title)}">${ICONS.trash}</button>
    </div>
    ${editor}
  </li>`;
}

function addForm() {
  return `
  <li class="add-form">
    <div class="field"><label for="new-title">Judul</label><input id="new-title" maxlength="120" placeholder="Contoh: Jadwal konsultasi"></div>
    <div class="field"><label for="new-url">URL</label><input id="new-url" maxlength="2000" inputmode="url" placeholder="https://"></div>
    <p class="field-error" id="new-error" role="alert" hidden></p>
    <button class="btn-dark" type="button" data-action="save-new">Simpan link</button>
  </li>`;
}

function renderLinks() {
  $('#link-list').innerHTML = (adding ? addForm() : '') + config.links.map(linkRow).join('');
  renderLinkMeta();
}

function moveLink(id, delta) {
  const i = config.links.findIndex((l) => l.id === id);
  const j = i + delta;
  if (j < 0 || j >= config.links.length) return;
  [config.links[i], config.links[j]] = [config.links[j], config.links[i]];
}

$('#add-link').addEventListener('click', () => {
  adding = !adding;
  renderLinks();
  if (adding) $('#new-title').focus();
});

$('#link-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action } = button.dataset;

  if (action === 'save-new') {
    const title = $('#new-title').value.trim();
    const url = $('#new-url').value.trim();
    const errorBox = $('#new-error');
    if (!title || !safeUrl(url)) {
      errorBox.textContent = !title ? 'Isi judul dulu, lalu simpan.' : 'Isi URL yang valid, misalnya https://contoh.com.';
      errorBox.hidden = false;
      return;
    }
    config.links.push({ id: `l${Date.now()}`, title, sub: '', url, on: true, primary: false, thumb: '', icon: 'link' });
    adding = false;
    renderLinks();
    changed();
    return;
  }

  const row = button.closest('.row');
  const link = config.links.find((l) => l.id === row.dataset.id);
  if (action === 'up') moveLink(link.id, -1);
  if (action === 'down') moveLink(link.id, 1);
  if (action === 'toggle') link.on = !link.on;
  if (action === 'primary') {
    const next = !link.primary;
    config.links.forEach((l) => { l.primary = false; });
    link.primary = next;
  }
  if (action === 'clear-thumb') link.thumb = '';
  if (action === 'delete') {
    config.links = config.links.filter((l) => l.id !== link.id);
    if (editingLink === link.id) editingLink = null;
  }
  if (action === 'edit') {
    editingLink = editingLink === link.id ? null : link.id;
    renderLinks();
    return;
  }
  renderLinks();
  changed();
});

$('#link-list').addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  if (!field || field === 'thumb') return;
  const row = event.target.closest('.row');
  const link = config.links.find((l) => l.id === row.dataset.id);
  link[field] = event.target.value;
  row.querySelector('.row-title').textContent = link.title || 'Tanpa judul';
  row.querySelector('.row-meta').textContent = link.url;
  const problem = row.querySelector('.row-problem');
  const text = linkProblem(link);
  problem.textContent = text;
  problem.hidden = !link.on || !text;
  renderLinkMeta();
  changed();
});

$('#link-list').addEventListener('change', async (event) => {
  if (event.target.dataset.field !== 'thumb') return;
  const file = event.target.files[0];
  if (!file) return;
  const row = event.target.closest('.row');
  const link = config.links.find((l) => l.id === row.dataset.id);
  try {
    link.thumb = await uploadImage(file);
    renderLinks();
    changed();
  } catch (err) {
    const errorBox = row.querySelector('[data-role="thumb-error"]');
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});

// Seret untuk mengubah urutan.
const list = $('#link-list');
list.addEventListener('dragstart', (event) => {
  const row = event.target.closest('.row');
  if (!row) return;
  dragId = row.dataset.id;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setDragImage(row, 20, 20);
  row.classList.add('dragging');
});
list.addEventListener('dragover', (event) => {
  if (dragId) event.preventDefault();
});
list.addEventListener('drop', (event) => {
  event.preventDefault();
  const target = event.target.closest('.row');
  if (!dragId || !target || target.dataset.id === dragId) return;
  const from = config.links.findIndex((l) => l.id === dragId);
  const [moved] = config.links.splice(from, 1);
  const to = config.links.findIndex((l) => l.id === target.dataset.id);
  const box = target.getBoundingClientRect();
  const after = event.clientY > box.top + box.height / 2;
  config.links.splice(after ? to + 1 : to, 0, moved);
  dragId = null;
  renderLinks();
  changed();
});
list.addEventListener('dragend', () => {
  dragId = null;
  renderLinks();
});

/* ---------- Tampilan ---------- */

function renderThemes() {
  $('#theme-grid').innerHTML = Object.entries(THEMES).map(([key, theme]) => {
    const c = config.colors[key];
    const bg = key === 'logam' ? c.panel : c.ground;
    const fg = c.ink ?? (key === 'logam' ? c.nameInk : '#f0ebdf');
    const mid = key === 'kaca' ? c.glow : c.cta;
    return `<button class="theme-card" type="button" data-theme="${key}" aria-pressed="${config.theme === key}">
      <span class="theme-mini" style="background:${bg}"><span style="width:60%;background:${fg}"></span><span style="width:100%;background:${mid}"></span></span>
      <span class="theme-name">${esc(theme.label)}</span>
    </button>`;
  }).join('');
}

function renderColors() {
  const theme = THEMES[config.theme];
  const colors = config.colors[config.theme];
  if (!colors[activeSlot]) activeSlot = theme.slots[0][0];
  $('#color-title').textContent = `Warna tema ${theme.label}`;
  $('#slot-grid').innerHTML = theme.slots.map(([slot, label]) => `
    <button class="slot" type="button" data-slot="${slot}" aria-pressed="${slot === activeSlot}">
      <span class="slot-dot" style="background:${colors[slot]}"></span><span>${esc(label)}</span>
    </button>`).join('');
  $('#swatch-grid').innerHTML = PALETTE.map((hex) => `
    <button class="swatch" type="button" data-hex="${hex}" aria-label="Warna ${hex}" aria-pressed="${colors[activeSlot] === hex}" style="background:${hex}"></button>`).join('');
  if (document.activeElement !== $('#f-hex')) $('#f-hex').value = colors[activeSlot];
  $('#hex-error').hidden = true;

  const warning = $('#contrast-warning');
  warning.hidden = true;
  if (theme.check) {
    const ratio = contrast(colors[theme.check[0]], colors[theme.check[1]]);
    if (ratio < 4.5) {
      warning.textContent = `${theme.check[2]} sulit dibaca dengan warna ini (kontras ${ratio.toFixed(1)}:1, minimal 4.5:1). Pilih warna yang lebih kontras.`;
      warning.hidden = false;
    }
  }
}

function renderEffects() {
  const isLogam = config.theme === 'logam';
  $('#effects-group').hidden = !isLogam;
  $('#flip-preview').hidden = !isLogam;
  $('#f-pattern').value = config.effects.pattern;
  $('#f-bio-label').textContent = isLogam ? 'Bio (tampil di sisi belakang kartu)' : 'Bio';
  $('#theme-note').textContent = `Tema ${THEMES[config.theme].label}`;
  const items = [['sheen', 'Kilau pada kartu'], ['tilt', 'Kartu miring mengikuti kursor atau jari'], ['spin', 'Pola garis berputar']];
  $('#effect-list').innerHTML = items.map(([key, label]) => `
    <div class="effect">
      <span>${esc(label)}</span>
      <button class="switch" type="button" role="switch" data-effect="${key}" aria-checked="${config.effects[key]}" aria-label="${esc(label)}"><span></span></button>
    </div>`).join('');
}

function setColor(hex) {
  config.colors[config.theme][activeSlot] = hex;
  renderColors();
  renderThemes();
  changed();
}

$('#theme-grid').addEventListener('click', (event) => {
  const card = event.target.closest('[data-theme]');
  if (!card) return;
  config.theme = card.dataset.theme;
  activeSlot = null;
  $('#flip-preview').textContent = 'Lihat belakang';
  renderThemes();
  renderColors();
  renderEffects();
  changed();
});

$('#slot-grid').addEventListener('click', (event) => {
  const slot = event.target.closest('[data-slot]');
  if (!slot) return;
  activeSlot = slot.dataset.slot;
  renderColors();
});

$('#swatch-grid').addEventListener('click', (event) => {
  const swatch = event.target.closest('[data-hex]');
  if (swatch) setColor(swatch.dataset.hex);
});

$('#f-hex').addEventListener('input', (event) => {
  const value = event.target.value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) {
    setColor(value);
  } else {
    $('#hex-error').hidden = false;
  }
});
$('#f-hex').addEventListener('blur', renderColors);

$('#reset-colors').addEventListener('click', () => {
  config.colors[config.theme] = defaultColors()[config.theme];
  renderColors();
  renderThemes();
  changed();
});

$('#f-pattern').addEventListener('input', (event) => {
  config.effects.pattern = Number(event.target.value);
  changed();
});

$('#effect-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-effect]');
  if (!button) return;
  const key = button.dataset.effect;
  config.effects[key] = !config.effects[key];
  renderEffects();
  changed();
});

$('#flip-preview').addEventListener('click', () => {
  preview.contentWindow.postMessage({ type: 'flip' }, location.origin);
});

/* ---------- Header ---------- */

$('#publish').addEventListener('click', async () => {
  const button = $('#publish');
  button.disabled = true;
  clearTimeout(saveTimer);
  saveTimer = null;
  saving = true;
  renderStatus();
  const body = JSON.stringify(config);
  try {
    const { dirty } = await api('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    lastSaved = body;
    published = !dirty;
    saveFailed = false;
  } catch (err) {
    saveFailed = true;
    saveError = err.message;
  }
  saving = false;
  renderStatus();
});

$('#logout').addEventListener('click', async () => {
  if (saveTimer) await saveNow();
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/admin/login';
});

/* ---------- Mulai ---------- */

const state = await api('/api/state');
config = state.draft;
lastSaved = JSON.stringify(config);
published = !state.dirty;
$('#f-name').value = config.name;
$('#f-role').value = config.role;
$('#f-bio').value = config.bio;
syncPhotoInputs();
renderLinks();
renderThemes();
renderColors();
renderEffects();
renderStatus();
sendPreview();
