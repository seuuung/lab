const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../game/Magnetic_Orbit/game.js'), 'utf8');

class Element {
    constructor() {
        this.style = {};
        this.listeners = new Map();
        this.classes = new Set();
        this.classList = {
            add: name => this.classes.add(name),
            remove: name => this.classes.delete(name),
            contains: name => this.classes.has(name)
        };
    }

    addEventListener(type, handler) {
        const handlers = this.listeners.get(type) || [];
        handlers.push(handler);
        this.listeners.set(type, handlers);
    }

    dispatch(type, event) {
        for (const handler of this.listeners.get(type) || []) handler(event);
    }
}

function createGame() {
    const ids = ['gameCanvas', 'menuScreen', 'startBtn', 'scoreDisplay', 'menuTitle',
        'menuSubtitle', 'howToPlay', 'finalScoreContainer', 'finalScore', 'statusIcon'];
    const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
    elements.gameCanvas.getContext = () => ({ setTransform() {} });
    const window = new Element();
    Object.assign(window, { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1 });
    const context = vm.createContext({
        document: { getElementById: id => elements[id] },
        window,
        setTimeout: callback => callback()
    });
    vm.runInContext(source, context);
    return { elements, window, context };
}

function input(target) {
    return {
        target,
        cancelable: true,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }
    };
}

test('home navigation is never canceled while canvas press and release still control orbit', () => {
    const { elements, window, context } = createGame();
    const homeLink = new Element();

    const menuHome = input(homeLink);
    window.dispatch('mousedown', menuHome);
    assert.equal(menuHome.defaultPrevented, false);

    elements.startBtn.dispatch('click', input(elements.startBtn));
    assert.equal(vm.runInContext('GAME_STATE', context), 'PLAYING');

    const gamePress = input(elements.gameCanvas);
    window.dispatch('mousedown', gamePress);
    assert.equal(gamePress.defaultPrevented, true);
    assert.equal(vm.runInContext('isPressing', context), true);

    const playingHome = input(homeLink);
    window.dispatch('mouseup', playingHome);
    assert.equal(playingHome.defaultPrevented, false);
    assert.equal(vm.runInContext('isPressing', context), false);

    const touchHome = input(homeLink);
    window.dispatch('touchstart', touchHome);
    assert.equal(touchHome.defaultPrevented, false);

    vm.runInContext('gameOver()', context);
    assert.equal(elements.howToPlay.hidden, true);
    const gameOverHome = input(homeLink);
    window.dispatch('mousedown', gameOverHome);
    assert.equal(gameOverHome.defaultPrevented, false);
});
