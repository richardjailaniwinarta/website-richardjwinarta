// Isi iframe pratinjau di admin. Menerima konfigurasi draft dari halaman admin.

import { renderPage } from '/shared/render.js';
import { enhance } from '/js/site.js';

const root = document.querySelector('#root');
let flipped = false;

function notifyFlip(value) {
  flipped = value;
  parent.postMessage({ type: 'flipped', value }, location.origin);
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  const { type, config } = event.data ?? {};
  if (type === 'flip') {
    root.querySelector('[data-card-flip]')?.click();
    return;
  }
  if (type !== 'config') return;
  root.innerHTML = renderPage(config);
  enhance(root, { flipped, onFlip: notifyFlip });
});

// Di pratinjau, link tidak membuka halaman lain.
root.addEventListener('click', (event) => {
  if (event.target.closest('a')) event.preventDefault();
});

parent.postMessage({ type: 'ready' }, location.origin);
