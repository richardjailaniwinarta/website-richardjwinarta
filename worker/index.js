// Cloudflare Worker: rute halaman, login, dan API admin.
// File statis di folder public/ dilayani langsung oleh Cloudflare sebelum sampai ke sini.

import { checkCredentials, COOKIE, createSession, isConfigured, isSignedIn } from './auth.js';
import { adminHtml, loginHtml, previewHtml, publicHtml } from './pages.js';
import { getPublished, getState, publish, readUpload, saveDraft, saveUpload } from './store.js';

const MAX_UPLOAD = 8 * 1024 * 1024;
const MAX_JSON = 256 * 1024;
const UPLOAD_NAME = /^[0-9a-f]{32}\.(png|jpg|webp)$/;
const IMAGE_TYPE = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'"
].join('; ');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}

function html(body) {
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

const redirect = (location) => new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });

function imageExtension(bytes) {
  if (bytes.length < 12) return null;
  const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  return null;
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_JSON) throw new HttpError(413, 'Data terlalu besar.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Data yang dikirim tidak valid.');
  }
}

function cookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function login(request, env) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'lokal';
  const limit = await env.LOGIN_LIMITER?.limit({ key: ip });
  if (limit && !limit.success) return json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, 429);
  if (!isConfigured(env)) return json({ error: 'Akun admin belum diatur di Cloudflare.' }, 503);
  const body = await readJson(request);
  if (!(await checkCredentials(env, body?.email ?? '', body?.password ?? ''))) {
    return json({ error: 'Email atau kata sandi salah.' }, 401);
  }
  const session = await createSession(env);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, session.token, session.maxAge) });
}

async function upload(request, env) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD) return json({ error: 'File terlalu besar. Maksimal 8 MB.' }, 413);
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > MAX_UPLOAD) return json({ error: 'File terlalu besar. Maksimal 8 MB.' }, 413);
  const extension = imageExtension(new Uint8Array(buffer, 0, Math.min(12, buffer.byteLength)));
  if (!extension) return json({ error: 'Gunakan gambar berformat JPG, PNG, atau WebP.' }, 415);
  return json({ url: await saveUpload(env, buffer, extension) });
}

async function serveUpload(name, env) {
  if (!UPLOAD_NAME.test(name)) return new Response('Tidak ditemukan.', { status: 404 });
  const data = await readUpload(env, name);
  if (!data) return new Response('Tidak ditemukan.', { status: 404 });
  return new Response(data, {
    headers: { 'Content-Type': IMAGE_TYPE[name.split('.').pop()], 'Cache-Control': 'public, max-age=31536000, immutable' }
  });
}

async function route(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method === 'HEAD' ? 'GET' : request.method;

  // Admin dan API-nya nonaktif secara default. Aktifkan dengan variabel ADMIN_PAGE = "on".
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/');
  if (isAdminPath && env.ADMIN_PAGE !== 'on') {
    return new Response('Halaman tidak ditemukan.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  if (method === 'GET') {
    if (pathname === '/links' && env.LINKS_PAGE === 'on') return html(publicHtml(await getPublished(env), url.origin));
    if (pathname === '/admin/login') {
      if (await isSignedIn(request, env)) return redirect('/admin');
      return html(loginHtml(await getPublished(env), isConfigured(env)));
    }
    if (pathname === '/admin' || pathname === '/admin/preview') {
      if (!(await isSignedIn(request, env))) return redirect('/admin/login');
      return html(pathname === '/admin' ? adminHtml() : previewHtml());
    }
    if (pathname.startsWith('/uploads/')) return serveUpload(pathname.slice('/uploads/'.length), env);
  }

  if (pathname.startsWith('/api/')) {
    if (!isSameOrigin(request)) return json({ error: 'Permintaan ditolak.' }, 403);
    const key = `${method} ${pathname}`;
    if (key === 'POST /api/login') return login(request, env);
    if (key === 'POST /api/logout') return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, '', 0) });

    const handlers = {
      'GET /api/state': () => getState(env).then((state) => json(state)),
      'PUT /api/draft': async () => json(await saveDraft(env, await readJson(request))),
      'POST /api/publish': async () => json(await publish(env, await readJson(request))),
      'POST /api/upload': () => upload(request, env)
    };
    if (!handlers[key]) return json({ error: 'Tidak ditemukan.' }, 404);
    if (!(await isSignedIn(request, env))) return json({ error: 'Sesi berakhir. Silakan masuk lagi.' }, 401);
    return handlers[key]();
  }

  return new Response('Halaman tidak ditemukan.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function secured(response) {
  const result = new Response(response.body, response);
  result.headers.set('Content-Security-Policy', CSP);
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return result;
}

export default {
  async fetch(request, env) {
    try {
      return secured(await route(request, env));
    } catch (err) {
      if (err instanceof HttpError) return secured(json({ error: err.message }, err.status));
      console.error(err);
      if (/429|too many/i.test(String(err?.message))) {
        return secured(json({ error: 'Batas simpan harian habis. Coba lagi setelah pukul 07.00 WIB.' }, 503));
      }
      return secured(json({ error: 'Terjadi kesalahan di server.' }, 500));
    }
  }
};
