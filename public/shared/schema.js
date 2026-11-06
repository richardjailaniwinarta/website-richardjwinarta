// Membersihkan konfigurasi yang masuk supaya aman disimpan dan ditampilkan.
// URL link disimpan apa adanya agar admin bisa mengetik bertahap; pemeriksaan
// keamanan URL dilakukan oleh safeUrl saat halaman dirender.

import { THEMES, defaultColors } from './themes.js';

const HEX = /^#[0-9a-f]{6}$/;
const IMAGE = /^\/(uploads|assets)\/[A-Za-z0-9._-]+$/;
const LINK_ID = /^[A-Za-z0-9_-]{1,40}$/;
export const MAX_LINKS = 50;

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

function number(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function safeImage(value) {
  return typeof value === 'string' && IMAGE.test(value) && !value.includes('..') ? value : '';
}

function cleanColors(input) {
  const base = defaultColors();
  for (const theme of Object.keys(base)) {
    for (const slot of Object.keys(base[theme])) {
      const value = input?.[theme]?.[slot];
      if (typeof value === 'string' && HEX.test(value.toLowerCase())) base[theme][slot] = value.toLowerCase();
    }
  }
  return base;
}

function cleanLinks(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  let hasPrimary = false;
  const links = [];
  for (const raw of input.slice(0, MAX_LINKS)) {
    if (!raw || typeof raw !== 'object' || !LINK_ID.test(raw.id) || seen.has(raw.id)) continue;
    seen.add(raw.id);
    const primary = raw.primary === true && !hasPrimary;
    if (primary) hasPrimary = true;
    links.push({
      id: raw.id,
      title: text(raw.title, 120),
      sub: text(raw.sub, 160),
      url: text(raw.url, 2000),
      on: raw.on === true,
      primary,
      thumb: safeImage(raw.thumb),
      icon: raw.icon === 'briefcase' ? 'briefcase' : 'link'
    });
  }
  return links;
}

export function cleanConfig(input) {
  const src = input && typeof input === 'object' ? input : {};
  return {
    name: text(src.name, 80),
    role: text(src.role, 80),
    bio: text(src.bio, 280),
    theme: Object.hasOwn(THEMES, src.theme) ? src.theme : 'logam',
    colors: cleanColors(src.colors),
    photo: {
      url: safeImage(src.photo?.url) || '/assets/photo-default.jpg',
      x: number(src.photo?.x, 0, 100, 50),
      y: number(src.photo?.y, 0, 100, 50),
      zoom: number(src.photo?.zoom, 100, 220, 100)
    },
    effects: {
      pattern: number(src.effects?.pattern, 0, 100, 70),
      sheen: src.effects?.sheen !== false,
      tilt: src.effects?.tilt !== false,
      spin: src.effects?.spin !== false
    },
    links: cleanLinks(src.links)
  };
}
