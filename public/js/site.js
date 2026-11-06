// Interaksi Kartu Logam: miring mengikuti kursor atau jari, dan berbalik saat diklik.

export function enhance(root, { flipped = false, onFlip } = {}) {
  const stage = root.querySelector('[data-card-stage]');
  if (!stage) return;
  const card = stage.querySelector('[data-card]');
  const flipButton = stage.querySelector('[data-card-flip]');
  const tiltEnabled = stage.dataset.tilt === 'true' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rest = tiltEnabled ? { rx: 4, ry: -7 } : { rx: 0, ry: 0 };
  let tilt = rest;

  const apply = () => {
    card.style.transform = `rotateX(${tilt.rx}deg) rotateY(${tilt.ry + (flipped ? 180 : 0)}deg)`;
    flipButton.setAttribute('aria-label', flipped ? 'Lihat sisi depan kartu' : 'Balik kartu');
  };

  flipButton.addEventListener('click', () => {
    flipped = !flipped;
    apply();
    onFlip?.(flipped);
  });

  if (tiltEnabled) {
    const follow = (event) => {
      const box = stage.getBoundingClientRect();
      const nx = (event.clientX - box.left) / box.width - 0.5;
      const ny = (event.clientY - box.top) / box.height - 0.5;
      tilt = { rx: Math.round(-ny * 18), ry: Math.round(nx * 22) };
      apply();
    };
    const release = () => {
      tilt = rest;
      apply();
    };
    stage.addEventListener('pointerdown', follow);
    stage.addEventListener('pointermove', follow);
    stage.addEventListener('pointerleave', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse') release();
    });
  }

  apply();
}

if (!document.querySelector('#root')) enhance(document);
