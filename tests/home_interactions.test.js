const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(base, 'home.css'), 'utf8');
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
  const grid = new Element(), github = new Element();
  document.querySelectorAll = selector => ({ '.tab-btn': buttons, '.project-item': items, '.project-card': cards, 'a[href*="github.com"]': [github] }[selector] || []);
  document.querySelector = selector => ({ '.project-grid': grid }[selector]);
  document.getElementById = id => ids[id];
  const context = { document, window, matchMedia: () => media, location: { hash }, history: { replaceState(a, b, value) { context.location.hash = value; } }, Event: class { constructor(type) { this.type = type; } }, innerHeight: 800, scrollY: 300, requestAnimationFrame: () => 1, Date };
  vm.runInNewContext(code, context);
  return { context, items, cards, buttons, ids, grid, root, window, document, media, events, github };
}

test('13 projects remain available without JavaScript, with valid destinations and safe external links', () => {
  const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)];
  assert.equal(articles.length, 13);
  for (const [, attributes, content] of articles) {
    assert.doesNotMatch(attributes, /\bhidden\b/);
    const link = content.match(/<a\b([^>]+)>/)[1];
    const href = link.match(/href="([^"]+)"/)[1];
    if (href.startsWith('game/')) assert.ok(fs.existsSync(path.join(base, decodeURIComponent(href))), href);
    else { assert.match(link, /target="_blank"/); assert.match(link, /rel="noopener noreferrer"/); }
  }
});

test('game cards use generated artwork while app cards keep store artwork with local fallbacks', () => {
  const gameImages = [...html.matchAll(/<article class="project-item" data-category="game"[\s\S]*?<img class="project-thumbnail game-thumbnail" src="([^"]+)"/g)].map(match => match[1]);
  const appImages = [...html.matchAll(/<article class="project-item" data-category="app"[\s\S]*?<img class="project-thumbnail app-thumbnail" src="([^"]+)" data-fallback="([^"]+)"/g)];
  assert.equal(gameImages.length, 10);
  assert.ok(gameImages.every(src => /-art\.(png|svg)$/.test(src) && fs.existsSync(path.join(base, src))));
  assert.equal(appImages.length, 3);
  assert.ok(appImages.every(([, src, fallback]) => src.startsWith('https://play-lh.googleusercontent.com/') && /^assets\/thumbnails\/.+\.(png|jpg)$/.test(fallback)));
});

test('project names retain their source language instead of forced Korean translations', () => {
  const names = Object.fromEntries([...html.matchAll(/<a class="project-card"[^>]*href="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)].map(m => [m[1], m[2]]));
  assert.equal(names['game/Magnetic_Orbit/index.html'], 'Magnetic Orbit');
  assert.equal(names['game/hacking/index.html'], 'Linux Hacker CTF');
  assert.equal(names['game/shadow_puzzle/index.html'], 'Shadow Puzzle');
  assert.equal(names['game/slime_jump/index.html'], 'Neon Slime Jump');
  assert.equal(names['game/maze_escape/index.html'], 'Maze Runner');
  assert.equal(names['game/3D_%20minesweeper/index.html'], '3D 지뢰찾기');
  assert.equal(names['game/choi_circle/index.html'], '최원형');
  assert.equal(names['game/signal_room/index.html'], 'Signal Room');
  assert.ok(Object.values(names).includes('Spatial Mine'));
});

test('decorative slogans and redundant project instructions are removed', () => {
  assert.doesNotMatch(html, /호기심을 가지고 놀다|호기심의 결과물|손끝으로 시작되는 세계|브라우저에서 바로 플레이|정해진 답 없이|계속 만드는 중/);
  assert.doesNotMatch(html, /class="(?:hero-bottom|collection-end|sculpture-index|art-topline)"/);
  assert.match(html, /id="projects-title">프로젝트<\/h2>/);
});

test('category filters show exactly the right projects and accessible pressed state', () => {
  const env = makeHome();
  assert.deepEqual(env.buttons.map(button => button.dataset.filter), ['all', 'game', 'app']);
  for (const button of env.buttons) {
    button.fire('click');
    const category = button.dataset.filter;
    const visible = env.items.filter(item => !item.hidden);
    assert.equal(visible.length, { all: 13, game: 10, app: 3 }[category]);
    assert.ok(visible.every(item => category === 'all' || item.dataset.category === category));
    assert.equal(env.buttons.filter(b => b.attrs['aria-pressed'] === 'true').length, 1);
    assert.equal(button.attrs['aria-pressed'], 'true');
    assert.equal(env.context.location.hash, '#' + category);
    assert.equal(env.ids['result-count'].textContent, `총 ${visible.length}개`);
  }
});

test('deep links and hash navigation restore filters; section anchors do not clear selection', () => {
  const env = makeHome({ hash: '#app' });
  assert.equal(env.items.filter(item => !item.hidden).length, 3);
  env.context.location.hash = '#lab'; env.window.fire('hashchange');
  assert.equal(env.items.filter(item => !item.hidden).length, 10);
  env.context.location.hash = '#about'; env.window.fire('hashchange');
  assert.equal(env.items.filter(item => !item.hidden).length, 10);
  env.context.location.hash = ''; env.window.fire('hashchange');
  assert.equal(env.items.filter(item => !item.hidden).length, 13);
});

test('unknown or inherited category hashes leave the full list usable', () => {
  for (const hash of ['#not-a-category', '#constructor', '#__proto__']) {
    const env = makeHome({ hash });
    assert.equal(env.items.filter(item => !item.hidden).length, 13);
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

test('analytics retains established project identities and destinations independently of display names', () => {
  const env = makeHome();
  env.cards.forEach(card => card.fire('click'));
  const clicks = env.events.filter(event => event[1] === 'game_enter');
  assert.equal(clicks.length, 13);
  clicks.forEach((event, index) => {
    assert.equal(event[2].game_name, env.cards[index].dataset.name);
    assert.equal(event[2].target_url, env.cards[index].attrs.href);
  });
  env.github.fire('click');
  assert.equal(env.events.at(-1)[1], 'profile_click');
});

function makeSculpture(mode = 'loaded') {
  const document = new Element();
  const sculpture = new Element(), stage = new Element(), figure = new Element(), note = new Element();
  const images = Array.from({ length: 5 }, () => ({ decode: () => mode === 'loaded' ? Promise.resolve() : Promise.reject(new Error('Image unavailable')) }));
  sculpture.closest = () => stage;
  sculpture.querySelector = () => figure;
  stage.querySelector = () => note;
  figure.querySelectorAll = () => images;
  document.getElementById = () => sculpture;
  vm.runInNewContext(sculptureCode, { document });
  return { sculpture, stage, figure, note, images };
}

test('jewel butterfly has four separately moving wings and a stationary body layer', () => {
  assert.equal((html.match(/class="butterfly-wing wing-/g) || []).length, 4);
  assert.match(html, /class="butterfly-body"/);
  assert.match(html, /class="sculpture-fallback"/);
  assert.match(css, /@keyframes wing-upper-left-beat/);
  assert.match(css, /@keyframes wing-lower-right-beat/);
  assert.match(css, /\.motion-paused \*[^\n]*animation-play-state: paused/);
  for (const name of ['poster', 'wings', 'body']) {
    assert.ok(fs.existsSync(path.join(base, 'assets', 'hero', `robot-butterfly-${name}.webp`)));
  }
});

test('loaded image layers replace the poster and remain keyboard inspectable', async () => {
  const env = makeSculpture();
  await new Promise(setImmediate);
  assert.equal(env.stage.classList.contains('sculpture-ready'), true);
  env.sculpture.fire('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.equal(env.figure.properties['--butterfly-y'], '13deg');
  env.sculpture.fire('keydown', { key: 'Home', preventDefault() {} });
  assert.equal(env.figure.properties['--butterfly-y'], '8deg');
});

test('failed image decoding keeps the complete poster and removes the keyboard target', async () => {
  const env = makeSculpture('failed');
  await new Promise(setImmediate);
  assert.equal(env.stage.classList.contains('sculpture-ready'), false);
  assert.equal(env.note.hidden, true);
  assert.equal(env.sculpture.attrs.tabindex, undefined);
});

test('drag changes the 3D viewing angle while the body remains anchored', async () => {
  const env = makeSculpture();
  await new Promise(setImmediate);
  env.sculpture.fire('pointerdown', { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
  env.sculpture.fire('pointermove', { clientX: 60, clientY: 35 });
  assert.equal(env.figure.properties['--butterfly-y'], '16deg');
  assert.equal(env.figure.properties['--butterfly-x'], '-6deg');
  env.sculpture.fire('pointerup');
  env.sculpture.fire('pointermove', { clientX: 90, clientY: 90 });
  assert.equal(env.figure.properties['--butterfly-y'], '16deg');
});


test('SelPick appears only in all and app filters, with the supplied Play Store destination', () => {
  const env = makeHome();
  const index = env.cards.findIndex(card => card.dataset.name === 'SelPick');
  assert.ok(index >= 0);
  const card = env.cards[index];
  assert.equal(card.attrs.href, 'https://play.google.com/store/apps/details?id=com.selpick.app&pcampaignid=web_share');
  for (const category of ['app', 'game', 'all']) {
    env.buttons.find(button => button.dataset.filter === category).fire('click');
    assert.equal(env.items[index].hidden, category === 'game');
  }
  card.fire('click');
  assert.equal(env.events.at(-1)[2].category, 'app');
});
