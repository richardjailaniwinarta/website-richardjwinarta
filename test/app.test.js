import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import worker from '../worker/index.js';
import { renderPage, safeUrl } from '../public/shared/render.js';
import { cleanConfig } from '../public/shared/schema.js';
import { contrast, defaultConfig } from '../public/shared/themes.js';

const BASE = 'https://contoh.test';
const EMAIL = 'admin@example.test';
const PASSWORD = 'kata-sandi-tes-123';

function fakeKv() {
  const items = new Map();
  return {
    items,
    async get(key, options) {
      if (!items.has(key)) return null;
      const value = items.get(key);
      if (options?.type === 'json') return JSON.parse(value);
      return value;
    },
    async put(key, value) {
      items.set(key, value);
    }
  };
}

let env;
beforeEach(() => {
  env = { DATA: fakeKv(), ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD: PASSWORD };
});

const call = (path, init) => worker.fetch(new Request(BASE + path, init), env);
const postJson = (path, body, headers = {}) => call(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body)
});

async function login() {
  const res = await postJson('/api/login', { email: EMAIL, password: PASSWORD });
  assert.equal(res.status, 200);
  const header = res.headers.get('set-cookie');
  assert.match(header, /HttpOnly/);
  assert.match(header, /Secure/);
  return header.split(';')[0];
}

test('safeUrl hanya menerima protokol aman', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,x'), '');
  assert.equal(safeUrl('[link produk]'), '');
  assert.equal(safeUrl(''), '');
  assert.equal(safeUrl('wa.me/62812'), 'https://wa.me/62812');
  assert.equal(safeUrl('https://contoh.com/a?b=1'), 'https://contoh.com/a?b=1');
  assert.equal(safeUrl('mailto:a@b.com'), 'mailto:a@b.com');
});

test('renderPage meng-escape isi dan menyembunyikan link tanpa URL aman', () => {
  const config = defaultConfig();
  config.name = '<script>alert(1)</script>';
  config.links = [
    { id: 'a', title: '"><img src=x>', sub: '', url: 'https://contoh.com', on: true, primary: false, thumb: '', icon: 'link' },
    { id: 'b', title: 'JAHAT', sub: '', url: 'javascript:alert(1)', on: true, primary: false, thumb: '', icon: 'link' },
    { id: 'c', title: 'MATI', sub: '', url: 'https://contoh.com/mati', on: false, primary: false, thumb: '', icon: 'link' }
  ];
  for (const theme of ['logam', 'sinema', 'kaca', 'galeri']) {
    const html = renderPage({ ...config, theme });
    assert.ok(!html.includes('<script>'), theme);
    assert.ok(!html.includes('<img src=x>'), theme);
    assert.ok(!html.includes('JAHAT'), theme);
    assert.ok(!html.includes('MATI'), theme);
    assert.ok(html.includes('https://contoh.com'), theme);
  }
});

test('cleanConfig membuang nilai berbahaya', () => {
  const clean = cleanConfig({
    theme: '__proto__',
    colors: { logam: { panel: 'red;background:url(x)' } },
    photo: { url: 'https://jahat.com/a.png', zoom: 9999 },
    links: [
      { id: 'a', title: 'A', url: 'x', on: true, primary: true, thumb: '/../secret' },
      { id: 'b', title: 'B', url: 'y', on: true, primary: true },
      { id: 'a', title: 'duplikat' },
      { id: 'tidak valid!', title: 'C' }
    ]
  });
  assert.equal(clean.theme, 'logam');
  assert.equal(clean.colors.logam.panel, '#fb8d00');
  assert.equal(clean.photo.url, '/assets/photo-default.jpg');
  assert.equal(clean.photo.zoom, 220);
  assert.equal(clean.links.length, 2);
  assert.equal(clean.links[0].thumb, '');
  assert.equal(clean.links.filter((l) => l.primary).length, 1);
});

test('warna awal tema Kartu Logam mudah dibaca', () => {
  const { panel, nameInk } = defaultConfig().colors.logam;
  assert.ok(contrast(panel, nameInk) >= 4.5);
});

test('halaman public tampil tanpa data tersimpan dan punya header keamanan', async () => {
  const res = await call('/links');
  assert.equal(res.status, 200);
  assert.ok((await res.text()).includes('Richard J. Winarta'));
  assert.ok(res.headers.get('content-security-policy').includes("script-src 'self'"));
});

test('admin dan API tertutup tanpa login', async () => {
  const page = await call('/admin');
  assert.equal(page.status, 302);
  assert.equal(page.headers.get('location'), '/admin/login');
  assert.equal((await call('/admin/preview')).status, 302);
  assert.equal((await call('/api/state')).status, 401);
  assert.equal((await postJson('/api/publish', {})).status, 401);
  assert.equal((await call('/api/draft', { method: 'PUT', body: '{}' })).status, 401);
  assert.equal((await call('/api/upload', { method: 'POST', body: 'x' })).status, 401);
});

test('login salah ditolak, sesi palsu ditolak', async () => {
  assert.equal((await postJson('/api/login', { email: EMAIL, password: 'salah' })).status, 401);
  assert.equal((await postJson('/api/login', { email: 'lain@example.test', password: PASSWORD })).status, 401);
  const forged = `${Date.now() + 100000}.${'a'.repeat(64)}`;
  assert.equal((await call('/api/state', { headers: { cookie: `rva_session=${forged}` } })).status, 401);
});

test('ganti kata sandi membatalkan sesi lama', async () => {
  const cookie = await login();
  assert.equal((await call('/api/state', { headers: { cookie } })).status, 200);
  env.ADMIN_PASSWORD = 'kata-sandi-baru-456';
  assert.equal((await call('/api/state', { headers: { cookie } })).status, 401);
});

test('login tertutup jika Secret belum diatur', async () => {
  env.ADMIN_PASSWORD = 'pendek';
  assert.equal((await postJson('/api/login', { email: EMAIL, password: 'pendek' })).status, 503);
  assert.ok((await (await call('/admin/login')).text()).includes('Akun admin belum diatur'));
});

test('pembatas login menolak saat melewati batas', async () => {
  env.LOGIN_LIMITER = { limit: async () => ({ success: false }) };
  assert.equal((await postJson('/api/login', { email: EMAIL, password: PASSWORD })).status, 429);
});

test('permintaan dari situs lain ditolak', async () => {
  const cookie = await login();
  const res = await postJson('/api/publish', {}, { cookie, origin: 'https://jahat.example' });
  assert.equal(res.status, 403);
});

test('draft tidak tampil di public sampai diterbitkan', async () => {
  const cookie = await login();
  const { draft } = await (await call('/api/state', { headers: { cookie } })).json();
  draft.name = 'Nama Baru Tes';
  const saved = await call('/api/draft', {
    method: 'PUT',
    headers: { cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  });
  assert.deepEqual(await saved.json(), { dirty: true });
  assert.ok(!(await (await call('/links')).text()).includes('Nama Baru Tes'));

  const done = await postJson('/api/publish', draft, { cookie });
  assert.deepEqual(await done.json(), { dirty: false });
  assert.ok((await (await call('/links')).text()).includes('Nama Baru Tes'));

  const state = await (await call('/api/state', { headers: { cookie } })).json();
  assert.equal(state.dirty, false);
});

test('batas simpan KV memberi pesan yang jelas', async () => {
  const cookie = await login();
  env.DATA.put = async () => {
    throw new Error('KV PUT failed: 429 Too Many Requests');
  };
  const res = await call('/api/draft', { method: 'PUT', headers: { cookie }, body: '{}' });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /Batas simpan harian/);
});

test('upload hanya menerima gambar asli dan bisa dibuka kembali', async () => {
  const cookie = await login();
  const send = (body) => call('/api/upload', { method: 'POST', headers: { cookie }, body });

  const svg = await send('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.equal(svg.status, 415);

  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(32).fill(0)]);
  const ok = await send(png);
  assert.equal(ok.status, 200);
  const { url } = await ok.json();
  assert.match(url, /^\/uploads\/[0-9a-f]{32}\.png$/);

  env.DATA.get = async (key) => env.DATA.items.get(key) ?? null;
  const image = await call(url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal((await image.arrayBuffer()).byteLength, png.length);

  assert.equal((await call('/uploads/..%2fdraft')).status, 404);
  assert.equal((await call('/uploads/draft')).status, 404);

  assert.equal((await send(new Uint8Array(9 * 1024 * 1024))).status, 413);
});
