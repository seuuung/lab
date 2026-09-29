'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const chaseRules = require('../game/maze_escape/chase_rules.js');

const source = fs.readFileSync(path.join(__dirname, '../game/maze_escape/game.js'), 'utf8');
const start = source.indexOf('function updateMonster(delta) {');
const end = source.indexOf('function build3DMaze() {', start);
assert.ok(start >= 0 && end > start, 'chase and result flow exists');
const flow = source.slice(start, end);

function round(mode) {
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, {
            style: {}, textContent: '', innerText: '',
            classList: { toggle() {} }
        });
        return elements.get(id);
    };
    element('timer-display').innerText = '00:09';
    const monster = { position: { x: 10, z: 10 }, lookAt() {} };
    const context = vm.createContext({
        mode, gameEnded: false, chaseDelay: 0, monster,
        monsterCell: { x: 1, z: 1 }, monsterNext: null,
        maze: [[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1]],
        camera: { position: { x: 20, z: 10 } },
        CELL_SIZE: 10, MONSTER_SPEED: 17, chaseRules,
        playerCell() { return { x: 2, z: 1 }; },
        updateObjective() {},
        document: { getElementById: element },
        timerInterval: 1, clearInterval() {},
        isMobile: true, resetMobileInput() {}, Math
    });
    vm.runInContext(flow, context);
    return { context, element, monster };
}

const explore = round('explore');
vm.runInContext('updateMonster(1)', explore.context);
assert.equal(explore.monster.position.x, 10, 'explore mode never moves a monster');
assert.equal(explore.context.gameEnded, false);

const chase = round('chase');
for (let frame = 0; frame < 10 && !chase.context.gameEnded; frame++) vm.runInContext('updateMonster(0.1)', chase.context);
assert.equal(chase.context.gameEnded, true, 'monster catches a player in the same corridor');
assert.equal(chase.element('result-title').textContent, '괴물에게 잡혔어요');
assert.equal(chase.element('win-screen').style.display, 'flex', 'caught result is displayed');
assert.equal(chase.element('mobile-ui').style.display, 'none', 'controls close on catch');

const escape = round('explore');
vm.runInContext('finishRound(true)', escape.context);
assert.equal(escape.element('result-title').textContent, '탈출 성공!', 'classic mode still finishes at the exit');

const modeStart = source.indexOf('function selectMode(nextMode) {');
const modeEnd = source.indexOf('// --- 모바일 대응 ---', modeStart);
assert.ok(modeStart >= 0 && modeEnd > modeStart, 'mode selection flow exists');
const modeButtons = ['explore', 'chase'].map(mode => ({ dataset: { mode }, attrs: {}, classList: { toggle() {} }, setAttribute(key, value) { this.attrs[key] = value; } }));
const modeElements = {
    'start-button': { firstChild: { textContent: '' } },
    hud: { classList: { toggle() {} } },
    'objective-text': { textContent: '' }
};
let rebuilds = 0;
const modeContext = vm.createContext({
    startTime: null, mode: 'explore', MAZE_SIZE: 25, MODE_SIZES: { explore: 25, chase: 21 }, maze: Array(25),
    gameStarted: false, gameEnded: false, chaseDelay: 0, monster: null, CELL_SIZE: 10,
    document: { querySelectorAll: () => modeButtons, getElementById: id => modeElements[id] },
    resetGame() { rebuilds++; }
});
vm.runInContext(source.slice(modeStart, modeEnd), modeContext);
vm.runInContext("selectMode('chase')", modeContext);
assert.equal(modeContext.MAZE_SIZE, 21, 'chase mode uses its smaller maze');
assert.equal(rebuilds, 1, 'changing mode regenerates the waiting maze');
assert.equal(modeButtons[1].attrs['aria-pressed'], 'true');
modeContext.startTime = 1;
vm.runInContext("selectMode('explore')", modeContext);
assert.equal(modeContext.MAZE_SIZE, 21, 'mode cannot change mid-round');

console.log('Maze modes: no chase in exploration, monster catch, and exit result passed');
