'use strict';
/* Seeded vector tree: the silhouette is stable while every orange can be harvested. */
(() => {
  const svg = document.getElementById('citrus-tree');
  if (!svg || window.tree3dReady) return;
  const crown = document.getElementById('tree-crown');
  const fallenLayer = document.getElementById('fallen-fruit');
  const count = document.getElementById('fruit-count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  let seed, fruits, falling, harvested, frame = 0, lastFrame = 0, dragStart;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const node = (tag, attrs, parent) => {
    const result = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) result.setAttribute(key, value);
    parent.appendChild(result);
    return result;
  };
  const fixed = value => value.toFixed(1);
  function leaf(parent, x, y, angle, scale, variant) {
    const group = node('g', { transform: `translate(${fixed(x)} ${fixed(y)}) rotate(${fixed(angle)}) scale(${fixed(scale)})` }, parent);
    node('path', { d: 'M0 0 C8 -13 24 -16 37 0 C24 15 8 12 0 0Z', fill: `url(#leaf-${variant})`, stroke: '#25583e', 'stroke-width': '.65' }, group);
    node('path', { d: 'M2 0 Q18 -2 34 0', fill: 'none', stroke: '#c7d49a', 'stroke-opacity': '.55', 'stroke-width': '.9' }, group);
  }
  function orange(parent, fruit, interactive) {
    const group = node('g', { class: interactive ? 'tree-fruit' : 'fallen-orange', transform: `translate(${fixed(fruit.x)} ${fixed(fruit.y)})` }, parent);
    const r = fruit.r;
    node('circle', { r, fill: 'url(#fruit-skin)', stroke: '#be512b', 'stroke-width': '1.1' }, group);
    node('ellipse', { cx: -r * .25, cy: -r * .49, rx: r * .21, ry: r * .11, fill: '#fff4cf', opacity: '.78', transform: 'rotate(-32)' }, group);
    node('path', { d: `M0 ${-r + 3} q-2 -7 2 -12`, fill: 'none', stroke: '#77503a', 'stroke-width': '2', 'stroke-linecap': 'round' }, group);
    node('path', { d: `M1 ${-r + 2} Q-8 ${-r - 12} -15 ${-r - 8} Q-9 ${-r - 1} 1 ${-r + 2} M1 ${-r + 2} Q9 ${-r - 12} 16 ${-r - 7} Q10 ${-r + 1} 1 ${-r + 2}`, fill: '#52804d', stroke: '#3a6845', 'stroke-width': '.8' }, group);
    if (interactive) {
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.setAttribute('aria-label', '귤 따기');
      node('circle', { r: Math.max(r + 8, 24), fill: 'transparent' }, group);
      group.addEventListener('click', event => { event.stopPropagation(); pluck(fruit); });
      group.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        pluck(fruit);
      });
    }
    fruit.node = group;
  }
  function buildTree() {
    seed = 7429;
    harvested = 0;
    fruits = [];
    falling = [];
    count.textContent = '00';
    cancelAnimationFrame(frame);
    frame = 0;
    crown.replaceChildren();
    crown.classList.remove('tree-pulling');
    crown.classList.remove('tree-releasing');
    fallenLayer.replaceChildren();
    const branches = node('g', { class: 'tree-branches' }, crown);
    const back = node('g', { class: 'tree-leaves' }, crown);
    const front = node('g', { class: 'tree-leaves' }, crown);
    const fruitLayer = node('g', { class: 'tree-fruits' }, crown);
    node('path', { d: 'M419 570 C433 520 428 477 420 435 C410 394 421 368 443 333 C458 362 458 389 466 424 C474 463 459 522 480 570Z', fill: 'url(#bark)' }, branches);
    node('path', { d: 'M433 563 C445 510 436 470 432 428 C427 391 433 370 444 352', fill: 'none', stroke: '#f2bb95', 'stroke-opacity': '.55', 'stroke-width': '5', 'stroke-linecap': 'round' }, branches);
    node('path', { d: 'M455 485 Q463 516 471 563', fill: 'none', stroke: '#783c2a', 'stroke-opacity': '.35', 'stroke-width': '3' }, branches);
    function grow(x, y, length, angle, width, depth) {
      const bend = (random() - .5) * 13;
      const ex = x + Math.sin(angle) * length + bend;
      const ey = y - Math.cos(angle) * length;
      const path = `M${fixed(x)} ${fixed(y)} Q${fixed(x + (ex - x) * .52 + bend)} ${fixed(y + (ey - y) * .53)} ${fixed(ex)} ${fixed(ey)}`;
      node('path', { d: path, fill: 'none', stroke: 'url(#bark)', 'stroke-width': fixed(width), 'stroke-linecap': 'round' }, branches);
      if (width > 4) node('path', { d: path, fill: 'none', stroke: '#f3ae83', 'stroke-opacity': '.3', 'stroke-width': fixed(width * .15), 'stroke-linecap': 'round', transform: 'translate(-2 -2)' }, branches);
      if (depth <= 3) {
        for (let i = 0; i < (depth === 3 ? 2 : depth ? 3 : 5); i++) {
          const t = .48 + random() * .66;
          const px = x + (ex - x) * t + (random() - .5) * 24;
          const py = y + (ey - y) * t + (random() - .5) * 20;
          const direction = angle * 57.3 + (random() - .5) * 145;
          leaf(i % 2 ? back : front, px, py, direction, .72 + random() * .45, random() > .5 ? 'a' : 'b');
          if (!depth && i % 2 === 0) leaf(front, px + 4, py + 5, direction + 105, .65 + random() * .34, 'b');
        }
      }
      if (depth <= 2) {
        if (random() > .6 && ex > 115 && ex < 785 && ey > 95 && ey < 385) {
          fruits.push({ x: ex + (random() - .5) * 25, y: ey + 13 + random() * 17, r: 16 + random() * 5, attached: true });
        }
      }
      if (!depth) {
        return;
      }
      const spread = depth >= 3 ? .53 : .67;
      grow(ex, ey, length * (.69 + random() * .08), angle - spread + (random() - .5) * .22, width * .64, depth - 1);
      grow(ex, ey, length * (.64 + random() * .13), angle + spread + (random() - .5) * .22, width * .61, depth - 1);
    }
    grow(438, 366, 154, -.84, 25, 4);
    grow(450, 354, 170, -.22, 19, 4);
    grow(454, 363, 169, .73, 24, 4);
    grow(447, 348, 153, .23, 17, 4);
    [[261, 374, 20], [348, 390, 18], [538, 402, 20], [647, 364, 19], [710, 318, 17]].forEach(([x, y, r]) => fruits.push({ x, y, r, attached: true }));
    fruits.forEach(fruit => orange(fruitLayer, fruit, true));
  }
  function fall(now) {
    const dt = Math.min((now - (lastFrame || now)) / 16.67, 2);
    lastFrame = now;
    falling = falling.filter(fruit => {
      fruit.vy += .53 * dt;
      fruit.y += fruit.vy * dt;
      fruit.x += fruit.vx * dt;
      fruit.rotation += fruit.spin * dt;
      if (fruit.y >= 580 - fruit.r) {
        fruit.y = 580 - fruit.r;
        fruit.vy *= -.38;
        fruit.vx *= .84;
        if (Math.abs(fruit.vy) < 1.3) {
          fruit.node.setAttribute('transform', `translate(${fixed(fruit.x)} ${fixed(fruit.y)}) rotate(${fixed(fruit.rotation)})`);
          return false;
        }
      }
      fruit.node.setAttribute('transform', `translate(${fixed(fruit.x)} ${fixed(fruit.y)}) rotate(${fixed(fruit.rotation)})`);
      return true;
    });
    frame = falling.length ? requestAnimationFrame(fall) : 0;
    if (!frame) lastFrame = 0;
  }
  function pluck(fruit) {
    if (!fruit.attached) return;
    fruit.attached = false;
    fruit.node.remove();
    count.textContent = String(++harvested).padStart(2, '0');
    orange(fallenLayer, fruit, false);
    if (reduced.matches || document.documentElement.dataset.motion === 'paused') {
      fruit.y = 580 - fruit.r;
      fruit.node.setAttribute('transform', `translate(${fixed(fruit.x)} ${fixed(fruit.y)})`);
      return;
    }
    fruit.vy = -2 - random() * 2;
    fruit.vx = (random() - .5) * 4;
    fruit.spin = (random() - .5) * 5;
    fruit.rotation = 0;
    falling.push(fruit);
    if (!frame) frame = requestAnimationFrame(fall);
  }
  function dropAttachedFruit() {
    const available = fruits.filter(fruit => fruit.attached);
    for (let i = 0; i < Math.min(3, available.length); i++) {
      pluck(available.splice(Math.floor(random() * available.length), 1)[0]);
    }
  }
  document.getElementById('reset-tree').addEventListener('click', buildTree);
  crown.addEventListener('animationend', event => {
    if (event.animationName === 'tree-return') crown.classList.remove('tree-releasing');
  });
  svg.addEventListener('pointerdown', event => {
    if (event.target.closest('.tree-fruit')) return;
    crown.classList.remove('tree-releasing');
    dragStart = { x: event.clientX, y: event.clientY, angle: 0 };
  });
  svg.addEventListener('pointermove', event => {
    if (!dragStart) return;
    const distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    if (distance < 6) return;
    dragStart.angle = Math.max(-12, Math.min(12, (dragStart.x - event.clientX) / svg.getBoundingClientRect().width * 36));
    crown.style.setProperty('--pull-angle', `${dragStart.angle}deg`);
    crown.classList.add('tree-pulling');
  });
  svg.addEventListener('pointerup', event => {
    if (!dragStart) return;
    const distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    const angle = dragStart.angle;
    dragStart = null;
    crown.classList.remove('tree-pulling');
    if (distance > 6 && !reduced.matches && document.documentElement.dataset.motion !== 'paused') {
      crown.style.setProperty('--release-angle', `${angle}deg`);
      crown.style.setProperty('--counter-angle', `${-angle * .22}deg`);
      crown.classList.add('tree-releasing');
    }
    if (distance > 22) dropAttachedFruit();
  });
  svg.addEventListener('pointercancel', () => {
    dragStart = null;
    crown.classList.remove('tree-pulling');
  });
  window.addEventListener('lab:motion', () => {
    if (document.documentElement.dataset.motion !== 'paused' || !falling.length) return;
    cancelAnimationFrame(frame);
    frame = 0;
    falling.forEach(fruit => {
      fruit.y = 580 - fruit.r;
      fruit.node.setAttribute('transform', `translate(${fixed(fruit.x)} ${fixed(fruit.y)})`);
    });
    falling = [];
  });
  buildTree();
})();
