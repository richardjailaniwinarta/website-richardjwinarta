// Definisi tema dan warna. Dipakai oleh server dan browser.

export const PALETTE = [
  '#7d1633', '#363641', '#5c5c64', '#ffd5c7', '#f0ebdf', '#b2ada5', '#dfdfdf',
  '#f66c2d', '#f97c39', '#fb8d00', '#f0af30', '#fdbc43', '#e7e419', '#ffef75',
  '#082c8c', '#4691cc', '#485d7c'
];

const FONT = {
  logam: 'family=Marcellus&family=Figtree:wght@400;500;600',
  sinema: 'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Jost:wght@400;500',
  kaca: 'family=Geist:wght@200;300;400;500;600',
  galeri: 'family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Karla:wght@400;500'
};

// photoBase: posisi horizontal foto bawaan agar wajah pas di bingkai tiap tema.
export const THEMES = {
  logam: {
    label: 'Kartu Logam',
    slots: [['panel', 'Panel kartu'], ['nameInk', 'Teks nama'], ['back', 'Sisi belakang'], ['ground', 'Latar'], ['glow', 'Cahaya'], ['cta', 'Tombol utama']],
    colors: { panel: '#fb8d00', nameInk: '#363641', back: '#7d1633', ground: '#363641', glow: '#fb8d00', cta: '#fdbc43' },
    check: ['panel', 'nameInk', 'Teks nama'],
    photoBase: null,
    font: FONT.logam
  },
  sinema: {
    label: 'Sinema Malam',
    slots: [['ground', 'Latar'], ['glow', 'Cahaya'], ['ink', 'Teks'], ['cta', 'Tombol utama']],
    colors: { ground: '#363641', glow: '#7d1633', ink: '#f0ebdf', cta: '#fdbc43' },
    check: ['ground', 'ink', 'Teks'],
    photoBase: 100,
    font: FONT.sinema
  },
  kaca: {
    label: 'Kaca Bara',
    slots: [['ground', 'Latar'], ['glow', 'Bara pertama'], ['back', 'Bara kedua'], ['cta', 'Tombol utama']],
    colors: { ground: '#363641', glow: '#f66c2d', back: '#7d1633', cta: '#f0ebdf' },
    check: null,
    photoBase: 88,
    font: FONT.kaca
  },
  galeri: {
    label: 'Galeri Putih',
    slots: [['ground', 'Dinding'], ['ink', 'Teks'], ['glow', 'Titik tombol'], ['cta', 'Tombol utama']],
    colors: { ground: '#f0ebdf', ink: '#363641', glow: '#f66c2d', cta: '#363641' },
    check: ['ground', 'ink', 'Teks'],
    photoBase: 78,
    font: FONT.galeri
  }
};

export function fontsUrl(themeKeys) {
  const families = themeKeys.map((k) => THEMES[k].font).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export function defaultColors() {
  const colors = {};
  for (const key of Object.keys(THEMES)) colors[key] = { ...THEMES[key].colors };
  return colors;
}

export function defaultConfig() {
  return {
    name: 'Richard J. Winarta',
    role: 'Virtual Assistant',
    bio: 'Helping you stay organized and efficient.',
    theme: 'logam',
    colors: defaultColors(),
    photo: { url: '/assets/photo-default.jpg', x: 50, y: 50, zoom: 100 },
    effects: { pattern: 70, sheen: true, tilt: true, spin: true },
    links: [
      { id: 'kit', title: 'English Survival Kit', sub: '138 Kalimat Kerja Remote', url: '', on: true, primary: false, thumb: '/assets/kit.png', icon: 'link' },
      { id: 'porto', title: 'Portfolio', sub: '', url: '', on: true, primary: false, thumb: '', icon: 'briefcase' },
      { id: 'wa', title: 'Chat di WhatsApp', sub: '', url: '', on: true, primary: true, thumb: '', icon: 'link' }
    ]
  };
}

function luminance(hex) {
  const channel = (i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function readableInk(background) {
  return contrast(background, '#363641') >= contrast(background, '#f0ebdf') ? '#363641' : '#f0ebdf';
}
