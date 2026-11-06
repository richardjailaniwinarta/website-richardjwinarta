// Login admin tunggal. Email dan kata sandi disimpan sebagai Secret di Cloudflare,
// sesi berupa cookie bertanda tangan yang otomatis batal saat kata sandi diganti.

export const COOKIE = 'rva_session';
export const MIN_PASSWORD = 10;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();

const toHex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

function sameText(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export function isConfigured(env) {
  return Boolean(env.ADMIN_EMAIL) && String(env.ADMIN_PASSWORD ?? '').length >= MIN_PASSWORD;
}

export async function checkCredentials(env, email, password) {
  if (!isConfigured(env)) return false;
  const [given, expected] = await Promise.all([sha256(String(password)), sha256(env.ADMIN_PASSWORD)]);
  const passwordOk = sameText(given, expected);
  const emailOk = String(email).trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase();
  return passwordOk && emailOk;
}

const signature = (env, expires) => hmac(`rva-session:${env.ADMIN_PASSWORD}`, String(expires));

export async function createSession(env) {
  const expires = Date.now() + SESSION_SECONDS * 1000;
  return { token: `${expires}.${await signature(env, expires)}`, maxAge: SESSION_SECONDS };
}

function readCookie(header, name) {
  for (const part of String(header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

export async function isSignedIn(request, env) {
  if (!isConfigured(env)) return false;
  const token = readCookie(request.headers.get('cookie'), COOKIE);
  if (!token) return false;
  const [expires, given] = token.split('.');
  if (!given || !(Number(expires) > Date.now())) return false;
  return sameText(given, await signature(env, expires));
}
