const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const code = fs.readFileSync(path.join(base, 'home.js'), 'utf8');
const sculptureCode = fs.readFileSync(path.join(base, 'sculpture.js'), 'utf8');

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.listeners = new Map();
    this.attrs = {};
    this.hidden = false;
    this.properties = {};
    this.style = { setProperty: (k, v) => this.properties[k] = v, removeProperty: k => delete this.properties[k] };
    const classes = new Set();
    this.classList = { add: k => classes.add(k), remove: k => classes.delete(k), contains: k => classes.has(k), toggle: (k, state) => state ? classes.add(k) : classes.delete(k) };
    this.textContent = '';
  }
  addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) || []), fn]); }
  dispatchEvent(event) { (this.listeners.get(event.type) || []).forEach(fn => fn(event)); }
  fire(type, args = {}) { this.dispatchEvent({ type, ...args }); }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  getBoundingClientRect() { return { width: 480, height: 480, left: 0, top: 0 }; }
  setPointerCapture() {}
}
function makeHome({ hash = '', reduced = false } = {}) {
  const root = new Element(); root.scrollHeight = 2000;
  const document = new Element(); document.documentElement = root; document.hidden = false;
  const window = new Element();
  const events = []; window.gtag = (...args) => events.push(args);
  const media = new Element(); media.matches = reduced;
  const ids = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const items = [...html.matchAll(/<article class="project-item" data-category="([^"]+)"/g)].map(m => new Element({ category: m[1] }));
  const cards = [...html.matchAll(/<a class="project-card" data-name="([^"]+)" href="([^"]+)"/g)].map((m, i) => {
    const card = new Element({ name: m[1] });
    card.attrs.href = m[2].replaceAll('&amp;', '&');
    card.closest = () => items[i];
    const scene = new Element(); card.querySelector = () => scene;
    return card;
  });
  const buttons = [...html.matchAll(/class="tab-btn[^"]*" data-filter="([^"]+)"/g)].map(m => new Element({ filter: m[1] }));
  const grid = new Element(), featured = new Element(), github = new Element();
  document.querySelectorAll = selector => ({ '.tab-btn': buttons, '.project-item': items, '.project-card': cards, 'a[href*="github.com"]': [github] }[selector] || []);
  document.querySelector = selector => ({ '.project-grid': grid, '.hero-bottom a': featured }[selector]);
  document.getElementById = id => ids[id];
  const context = { document, window, matchMedia: () => media, location: { hash }, history: { replaceState(a, b, value) { context.location.hash = value; } }, Event: class { constructor(type) { this.type = type; } }, innerHeight: 800, scrollY: 300, requestAnimationFrame: () => 1, Date };
  vm.runInNewContext(code, context);
  return { context, items, cards, buttons, ids, grid, root, window, document, media, events, github, featured };
}

test('11 projects remain available without JavaScript, with valid destinations and safe external links', () => {
  const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)];
  assert.equal(articles.length, 11);
  for (const [, attributes, content] of articles) {
    assert.doesNotMatch(attributes, /\bhidden\b/);
    const link = content.match(/<a\b([^>]+)>/)[1];
    const href = link.match(/href="([^"]+)"/)[1];
    if (href.startsWith('game/')) assert.ok(fs.existsSync(path.join(base, decodeURIComponent(href))), href);
    else { assert.match(link, /target="_blank"/); assert.match(link, /rel="noopener noreferrer"/); }
  }
});

test('all visible interface copy is Korean', () => {
  const visible = html.split('<body>')[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /[A-Za-z]{3,}/);
});

test('category filters show exactly the right projects and accessible pressed state', () => {
  const env = makeHome();
  for (const button of env.buttons) {
    button.fire('click');
    const category = button.dataset.filter;
    const visible = env.items.filter(item => !item.hidden);
    assert.equal(visible.length, { all: 11, game: 6, app: 2, lab: 3 }[category]);
    assert.ok(visible.every(item => category === 'all' || item.dataset.category === category));
    assert.equal(env.buttons.filter(b => b.attrs['aria-pressed'] === 'true').length, 1);
    assert.equal(button.attrs['aria-pressed'], 'true');
    assert.equal(env.context.location.hash, '#' + category);
    assert.equal(env.ids['result-count'].textContent, `총 ${visible.length}개의 실험`);
  }
});

test('deep links and hash navigation restore filters; section anchors do not clear selection', () => {
  const env = makeHome({ hash: '#app' });
  assert.equal(env.items.filter(item => !item.hidden).length, 2);
  env.context.location.hash = '#lab'; env.window.fire('hashchange');
  assert.equal(env.items.filter(item => !item.hidden).length, 3);
  env.context.location.hash = '#about'; env.window.fire('hashchange');
  assert.equal(env.items.filter(item => !item.hidden).length, 3);
  env.context.location.hash = ''; env.window.fire('hashchange');
  assert.equal(env.items.filter(item => !item.hidden).length, 11);
});

test('unknown or inherited category hashes leave the full list usable', () => {
  for (const hash of ['#not-a-category', '#constructor', '#__proto__']) {
    const env = makeHome({ hash });
    assert.equal(env.items.filter(item => !item.hidden).length, 11);
  }
});

test('sound toggle works without an AudioContext implementation and never blocks links', () => {
  const env = makeHome();
  env.ids['sfx-toggle-btn'].fire('click');
  assert.equal(env.ids['sfx-label'].textContent, '소리 켬');
  assert.equal(env.ids['sfx-toggle-btn'].attrs['aria-pressed'], 'true');
  env.cards[0].fire('click');
  env.ids['sfx-toggle-btn'].fire('click');
  assert.equal(env.ids['sfx-label'].textContent, '소리 끔');
});

test('motion starts paused for reduced-motion users and updates with preference changes', () => {
  const env = makeHome({ reduced: true });
  assert.equal(env.root.dataset.motion, 'paused');
  env.ids['motion-toggle'].fire('click');
  assert.equal(env.root.dataset.motion, 'running');
  env.media.matches = true; env.media.fire('change');
  assert.equal(env.root.dataset.motion, 'paused');
});

test('analytics retains original project identities and destinations after Korean renaming', () => {
  const env = makeHome();
  env.cards.forEach(card => card.fire('click'));
  const clicks = env.events.filter(event => event[1] === 'game_enter');
  assert.equal(clicks.length, 11);
  clicks.forEach((event, index) => {
    assert.equal(event[2].game_name, env.cards[index].dataset.name);
    assert.equal(event[2].target_url, env.cards[index].attrs.href);
  });
  env.github.fire('click');
  assert.equal(env.events.at(-1)[1], 'profile_click');
});

function makeSculpture(mode = 'supported') {
  const root = new Element(); root.dataset.motion = 'running';
  const document = new Element(); document.documentElement = root; document.hidden = false;
  const canvas = new Element(), stage = new Element(), note = new Element();
  const window = new Element(); window.devicePixelRatio = 3;
  const uploads = [], rotations = [], frames = new Map(); let next = 1, draws = 0;
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, ELEMENT_ARRAY_BUFFER: 6,
    createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => true, deleteShader() {},
    createProgram: () => ({}), attachShader() {}, linkProgram() {}, getProgramParameter: () => true, useProgram() {},
    bindBuffer() {}, createBuffer: () => ({}), bufferData: (type, data) => uploads.push({ type, data }),
    getAttribLocation: () => 0, enableVertexAttribArray() {}, vertexAttribPointer() {}, enable() {}, clearColor() {},
    getUniformLocation: (_, name) => name, viewport() {}, clear() {}, uniform2f: (_, x, y) => rotations.push([x, y]), uniform1f() {}, drawElements: () => draws++
  };
  canvas.getContext = () => { if (mode === 'throw') throw new Error('GPU unavailable'); return mode === 'unsupported' ? null : gl; };
  canvas.closest = () => stage; stage.querySelector = () => note;
  document.getElementById = () => canvas;
  const context = { document, window, requestAnimationFrame: fn => { const id = next++; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id), Float32Array, Uint16Array };
  vm.runInNewContext(sculptureCode, context);
  return { root, document, canvas, stage, note, window, uploads, rotations, frames, get draws() { return draws; } };
}

test('sculpture geometry has finite vertices, unit normals, and valid triangle indices', () => {
  const env = makeSculpture();
  const [positions, normals, indices] = env.uploads.map(x => x.data);
  assert.equal(positions.length, normals.length);
  assert.equal(indices.length % 3, 0);
  assert.ok([...positions].every(Number.isFinite));
  for (let i = 0; i < normals.length; i += 3) assert.ok(Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) < .00001);
  assert.ok([...indices].every(index => index < positions.length / 3));
  assert.equal(env.canvas.width, 720, 'mobile DPR is capped at 1.5');
});

test('WebGL unavailable or blocked falls back cleanly without an unusable keyboard target', () => {
  for (const mode of ['unsupported', 'throw']) {
    const env = makeSculpture(mode);
    assert.equal(env.note.hidden, true);
    assert.equal(env.canvas.attrs.tabindex, undefined);
    assert.equal(env.frames.size, 0);
  }
});

test('keyboard rotation still works when automatic motion is paused', () => {
  const env = makeSculpture();
  env.root.dataset.motion = 'paused'; env.window.fire('lab:motion');
  assert.equal(env.frames.size, 0);
  const before = env.rotations.at(-1)[1]; let prevented = false;
  env.canvas.fire('keydown', { key: 'ArrowRight', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.ok(env.rotations.at(-1)[1] > before);
  assert.equal(env.frames.size, 0);
});

test('hidden pages and WebGL context loss stop animation', () => {
  const env = makeSculpture();
  assert.equal(env.frames.size, 1);
  env.document.hidden = true; env.document.fire('visibilitychange');
  assert.equal(env.frames.size, 0);
  env.document.hidden = false; env.document.fire('visibilitychange');
  assert.equal(env.frames.size, 1);
  env.canvas.fire('webglcontextlost', { preventDefault() {} });
  assert.equal(env.frames.size, 0);
  assert.equal(env.stage.classList.contains('sculpture-ready'), false);
});
