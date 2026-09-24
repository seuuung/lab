'use strict';
/* The body stays perched while four transparent, jewelled wings flap in 3D. */
(() => {
  const sculpture = document.getElementById('sculpture');
  if (!sculpture) return;
  const stage = sculpture.closest('.sculpture-stage');
  const figure = sculpture.querySelector('.butterfly-figure');
  const note = stage.querySelector('.sculpture-note');
  const images = [...figure.querySelectorAll('img')];
  const showPoster = () => {
    sculpture.removeAttribute('tabindex');
    note.hidden = true;
  };

  // Keep the complete artwork visible until every animated layer can render.
  Promise.all(images.map(image => {
    if (image.decode) return image.decode();
    if (image.complete) return image.naturalWidth ? Promise.resolve() : Promise.reject(new Error('Image unavailable'));
    return new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    });
  })).then(() => stage.classList.add('sculpture-ready'), showPoster);

  let pitch = -3, yaw = 8, dragging = false, pointerX = 0, pointerY = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function setView() {
    figure.style.setProperty('--butterfly-x', `${pitch}deg`);
    figure.style.setProperty('--butterfly-y', `${yaw}deg`);
  }
  sculpture.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !stage.classList.contains('sculpture-ready')) return;
    dragging = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    sculpture.setPointerCapture(event.pointerId);
  });
  sculpture.addEventListener('pointermove', event => {
    if (!dragging) return;
    yaw = clamp(yaw + (event.clientX - pointerX) * .16, -25, 25);
    pitch = clamp(pitch - (event.clientY - pointerY) * .12, -18, 18);
    pointerX = event.clientX;
    pointerY = event.clientY;
    setView();
  });
  const release = () => { dragging = false; };
  sculpture.addEventListener('pointerup', release);
  sculpture.addEventListener('pointercancel', release);
  sculpture.addEventListener('lostpointercapture', release);
  sculpture.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') yaw -= 5;
    if (event.key === 'ArrowRight') yaw += 5;
    if (event.key === 'ArrowUp') pitch += 5;
    if (event.key === 'ArrowDown') pitch -= 5;
    if (event.key === 'Home') { pitch = -3; yaw = 8; }
    pitch = clamp(pitch, -18, 18);
    yaw = clamp(yaw, -25, 25);
    setView();
  });
})();
