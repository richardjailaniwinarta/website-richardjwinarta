// Penyimpanan di Cloudflare KV: draft, versi terbit, dan foto upload.

import { cleanConfig } from '../public/shared/schema.js';
import { defaultConfig } from '../public/shared/themes.js';

const UPLOAD_PREFIX = 'upload:';

async function readConfig(env, key) {
  const saved = await env.DATA.get(key, { type: 'json' });
  return saved ? cleanConfig(saved) : null;
}

export async function getPublished(env) {
  return (await readConfig(env, 'published')) ?? defaultConfig();
}

export async function getState(env) {
  const [draft, published] = await Promise.all([readConfig(env, 'draft'), getPublished(env)]);
  const current = draft ?? published;
  return { draft: current, published, dirty: JSON.stringify(current) !== JSON.stringify(published) };
}

export async function saveDraft(env, input) {
  const draft = cleanConfig(input);
  await env.DATA.put('draft', JSON.stringify(draft));
  const published = await getPublished(env);
  return { dirty: JSON.stringify(draft) !== JSON.stringify(published) };
}

// Isi yang diterbitkan dikirim langsung dari admin, sehingga selalu versi terakhir
// meskipun data KV belum sempat tersebar ke semua lokasi Cloudflare.
export async function publish(env, input) {
  const config = JSON.stringify(cleanConfig(input));
  await env.DATA.put('published', config);
  await env.DATA.put('draft', config);
  return { dirty: false };
}

export async function saveUpload(env, buffer, extension) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const name = `${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}.${extension}`;
  await env.DATA.put(UPLOAD_PREFIX + name, buffer);
  return `/uploads/${name}`;
}

export function readUpload(env, name) {
  return env.DATA.get(UPLOAD_PREFIX + name, { type: 'arrayBuffer', cacheTtl: 86400 });
}
