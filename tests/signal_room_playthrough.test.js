'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rules = require('../game/signal_room/rules.js');

for (const color of rules.colors) {
    const switches = { A: color.exit === 'amber' || color.exit === 'violet' ? 1 : 0, B: color.exit === 'cyan' ? 1 : 0, C: color.exit === 'violet' ? 1 : 0 };
    const first = rules.nextNode('A', switches);
    const exit = rules.nextNode(first, switches);
    assert.equal(exit, color.exit, `${color.name} can reach its destination`);
    assert.equal(rules.isCorrectExit(color, exit), true);
}
assert.equal(rules.createSequence(() => 0).length, 24);
assert.deepEqual([0, 6, 12, 18].map(rules.waveFor), [1, 2, 3, 4]);

class Element {
    constructor() {
        this.listeners = new Map();
        this.children = [];
        this.style = { setProperty() {} };
        this.attrs = {};
        this.textContent = '';
        this.firstChild = { textContent: '' };
        this.hidden = false;
    }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    fire(type, props = {}) { this.listeners.get(type)?.({ preventDefault() {}, clientX: 0, clientY: 0, ...props }); }
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    get childElementCount() { return this.children.filter(child => typeof child !== 'string').length; }
    setAttribute(name, value) { this.attrs[name] = value; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 450 }; }
    querySelector(selector) { return this.nodes[selector]; }
}

function makeGame(colorId, size = { width: 800, height: 450 }) {
    const context2d = new Proxy({}, { get: (target, key) => target[key] || (() => {}) });
    const ids = Object.fromEntries([
        'board', 'board-shell', 'overlay', 'overlay-kicker', 'overlay-title', 'overlay-text', 'overlay-detail',
        'overlay-button', 'pause-button', 'sound-button', 'help-button', 'score-value', 'progress-value', 'success-value', 'combo-value', 'health-value',
        'best-value', 'wave-value', 'wave-toast', 'queue-items', 'announcement'
    ].map(id => [id, new Element()]));
    ids.board.getContext = () => context2d;
    ids.board.getBoundingClientRect = ids['board-shell'].getBoundingClientRect = () => ({ left: 0, top: 0, ...size });
    ids['sound-button'].nodes = { '.sound-label': new Element() };
    const buttons = ['A', 'B', 'C'].map(id => {
        const button = new Element();
        button.dataset = { switch: id };
        button.nodes = { small: new Element(), '.switch-arrow': new Element() };
        return button;
    });
    const document = new Element();
    document.getElementById = id => ids[id];
    document.querySelectorAll = () => buttons;
    document.querySelector = () => ({ classList: { add() {} } });
    document.createElement = () => new Element();
    const window = new Element();
    window.devicePixelRatio = 1;
    window.scrollTo = () => {};
    const callbacks = [];
    let now = 0;
    const storage = new Map();
    const context = vm.createContext({
        window, document, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
        SignalRules: rules, performance: { now: () => now }, requestAnimationFrame: callback => callbacks.push(callback),
        Math, console
    });
    window.SignalRules = { ...rules, createSequence: () => Array(24).fill(rules.colors.find(color => color.id === colorId)) };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../game/signal_room/game.js'), 'utf8'), context);
    function frame() {
        now += 50;
        const callback = callbacks.shift();
        assert.ok(callback, 'animation loop exists');
        callback(now);
    }
    return { ids, buttons, document, window, frame, storage };
}

const success = makeGame('coral');
success.ids['sound-button'].fire('click');
assert.equal(success.ids['sound-button'].attrs['aria-pressed'], 'true', 'sound preference can be enabled without Web Audio');
assert.equal(success.storage.get('little-loop-bus-sound-v1'), 'on');
success.ids['overlay-button'].fire('click');
assert.equal(success.ids.overlay.hidden, true, 'start closes instructions');
assert.equal(success.buttons[0].disabled, false, 'route controls become active');
assert.equal(success.ids['queue-items'].children.length, 3, 'three upcoming buses are shown');
const firstBus = success.ids['queue-items'].children[0];
assert.equal(firstBus.children[0].className, 'queue-bus', 'upcoming route uses a bus silhouette');
assert.equal(firstBus.children[0].children[1].textContent, '●', 'bus roof carries the route symbol');
assert.match(firstBus.attrs['aria-label'], /딸기 정류장/, 'upcoming bus destination is announced');
success.ids['help-button'].fire('click');
assert.equal(success.ids['overlay-title'].textContent, '버스길 안내', 'help can be reopened during a round');
for (let i = 0; i < 100; i++) success.frame();
assert.equal(success.ids['progress-value'].textContent, '0 / 24', 'help pauses the round');
success.ids['overlay-button'].fire('click');
success.document.fire('keydown', { code: 'Space', target: { closest: () => success.ids['pause-button'] } });
assert.equal(success.ids.overlay.hidden, true, 'space on a focused button is left to its native click');
success.ids['pause-button'].fire('click');
for (let i = 0; i < 100; i++) success.frame();
assert.equal(success.ids['progress-value'].textContent, '0 / 24', 'pause freezes the round');
success.ids['overlay-button'].fire('click');
for (let i = 0; i < 1800 && success.ids['overlay-title'].textContent !== '운행 성공!'; i++) success.frame();
assert.equal(success.ids['overlay-title'].textContent, '운행 성공!', 'all correct routes can finish the full game');
assert.equal(success.ids['progress-value'].textContent, '24 / 24');
assert.equal(success.ids['success-value'].textContent, '24 / 20');
assert.equal(success.ids['combo-value'].textContent, '24', 'success streak is visible');
assert.equal(success.ids['wave-toast'].textContent, '마지막 운행!', 'later waves are announced');
assert.match(success.ids['overlay-detail'].textContent, /★★★.*최고 연속 24대/, 'clear result summarizes performance');
assert.ok(Number(success.ids['score-value'].textContent) > 2400);
assert.equal(success.storage.get('signal-room-best-v1'), success.ids['score-value'].textContent.replace(/^0+/, ''));

const alternateRoute = makeGame('violet');
alternateRoute.ids['overlay-button'].fire('click');
alternateRoute.ids.board.fire('pointerdown', { clientX: 240, clientY: 225 });
alternateRoute.buttons[2].fire('click');
assert.equal(alternateRoute.buttons[0].querySelector('small').textContent, 'C 방향', 'tapping A on the board changes the first route');
assert.equal(alternateRoute.buttons[2].querySelector('small').textContent, '▲ 꽃길 정류장', 'button changes the second route');
for (let i = 0; i < 1800 && alternateRoute.ids['overlay-title'].textContent !== '운행 성공!'; i++) alternateRoute.frame();
assert.equal(alternateRoute.ids['overlay-title'].textContent, '운행 성공!', 'alternate branch can clear the full game');

const phone = makeGame('violet', { width: 375, height: 270 });
phone.ids['overlay-button'].fire('click');
phone.ids.board.fire('pointerdown', { clientX: 187.5, clientY: 94.5 });
assert.equal(phone.buttons[0].querySelector('small').textContent, 'C 방향', 'compact phone board keeps its A junction tappable');

const failure = makeGame('violet');
failure.ids['overlay-button'].fire('click');
for (let i = 0; i < 1000 && failure.ids['overlay-title'].textContent !== '운행 종료'; i++) failure.frame();
assert.equal(failure.ids['overlay-title'].textContent, '운행 종료', 'five wrong exits end the game');
assert.equal(failure.ids['health-value'].attrs['aria-label'], '남은 실수 0회');
failure.buttons[0].fire('click');
assert.equal(failure.buttons[0].querySelector('small').textContent, 'B 방향', 'finished round ignores further input');

console.log('Little Loop Bus original routing rules, pause, full clear, failure and locked controls passed');
