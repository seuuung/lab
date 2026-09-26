const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../game/maze_escape/game.js'), 'utf8');
const start = source.indexOf('function setupMobileControls() {');
const end = source.indexOf('function startTimer() {', start);
assert.ok(start >= 0 && end > start, 'mobile control function exists');
const controlSource = source.slice(start, end);

function eventTarget(rect) {
    const listeners = new Map();
    return {
        style: {},
        addEventListener(type, listener) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(listener);
        },
        emit(type, properties = {}) {
            const event = {
                pointerType: 'touch', button: 0, preventDefault() {}, stopPropagation() {},
                ...properties
            };
            for (const listener of listeners.get(type) || []) listener(event);
        },
        setPointerCapture(id) { this.captured = id; },
        getBoundingClientRect() { return rect; }
    };
}

const elements = {
    'joystick-zone': eventTarget(),
    'look-zone': eventTarget(),
    'joystick-base': eventTarget({ left: 10, top: 10, width: 112, height: 112 }),
    'joystick-thumb': eventTarget(),
    'action-btn': eventTarget()
};
const document = eventTarget();
document.hidden = false;
document.getElementById = id => elements[id];
const window = eventTarget();
const camera = {
    quaternion: {
        x: 0, y: 0,
        setFromEuler(euler) { this.x = euler.x; this.y = euler.y; }
    }
};
let markerCount = 0;
const context = vm.createContext({
    document, window, camera,
    joyDelta: { x: 0, y: 0 },
    resetMobileInput() {},
    gameStarted: true, gameWon: false,
    handleMarkerAction() { markerCount++; },
    THREE: {
        Euler: class {
            setFromQuaternion(quaternion) {
                this.x = quaternion.x;
                this.y = quaternion.y;
            }
        }
    }
});
vm.runInContext(controlSource + '\nsetupMobileControls();', context);

const joy = elements['joystick-zone'];
const look = elements['look-zone'];
joy.emit('pointerdown', { pointerId: 1, clientX: 66, clientY: 66 });
assert.equal(context.joyDelta.x, 0);
joy.emit('pointermove', { pointerId: 1, clientX: 110, clientY: 66 });
assert.ok(context.joyDelta.x > 0.99, 'full right drag moves right');
joy.emit('pointerdown', { pointerId: 2, clientX: 20, clientY: 66 });
joy.emit('pointermove', { pointerId: 2, clientX: 20, clientY: 66 });
assert.ok(context.joyDelta.x > 0.99, 'second finger cannot take over joystick');

look.emit('pointerdown', { pointerId: 2, clientX: 200, clientY: 200 });
look.emit('pointermove', { pointerId: 2, clientX: 250, clientY: 220 });
assert.ok(camera.quaternion.y < 0, 'other finger turns camera while moving');
assert.ok(camera.quaternion.x < 0, 'vertical drag changes pitch');
joy.emit('pointerup', { pointerId: 1 });
assert.equal(context.joyDelta.x, 0, 'release stops movement');
assert.equal(elements['joystick-thumb'].style.transform, 'translate(-50%, -50%)');

joy.emit('pointerdown', { pointerId: 3, clientX: 110, clientY: 66 });
joy.emit('pointercancel', { pointerId: 3 });
assert.equal(context.joyDelta.x, 0, 'cancel stops movement');
look.emit('pointerup', { pointerId: 2 });
const oldYaw = camera.quaternion.y;
look.emit('pointermove', { pointerId: 2, clientX: 300, clientY: 220 });
assert.equal(camera.quaternion.y, oldYaw, 'release stops camera movement');

joy.emit('pointerdown', { pointerId: 4, clientX: 110, clientY: 66 });
window.emit('blur');
assert.equal(context.joyDelta.x, 0, 'losing focus stops movement');

elements['action-btn'].emit('pointerdown', { pointerId: 5 });
elements['action-btn'].emit('click', { detail: 1 });
assert.equal(markerCount, 1, 'touch action fires once');
elements['action-btn'].emit('click', { detail: 0 });
assert.equal(markerCount, 2, 'keyboard action also works');
context.gameWon = true;
elements['action-btn'].emit('pointerdown', { pointerId: 6 });
assert.equal(markerCount, 2, 'action is disabled after win');

console.log('Maze mobile controls: movement, look, cancel, focus loss, action passed');
