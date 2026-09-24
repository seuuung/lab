const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../game/slime_jump/game.js'), 'utf8');
const events = {};
const canvas = { style: {}, getContext: () => ({ setTransform() {} }), addEventListener() {}, setPointerCapture() {} };
const elements = { gameCanvas: canvas, 'ui-layer': { style: {} } };
for (const id of ['startScreen', 'gameOverScreen', 'scoreText', 'seedText', 'abilityText',
    'gameStatus', 'highScoreText', 'finalScore', 'finalSeeds', 'finalHighScore', 'startBtn', 'restartBtn']) {
    elements[id] = { style: {}, classList: { add() {}, remove() {} }, addEventListener() {}, textContent: '' };
}
const viewport = {
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    addEventListener(name, handler) { events[name] = handler; }
};
const context = vm.createContext({
    window: viewport,
    document: { getElementById: id => elements[id] },
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame() {}
});
vm.runInContext(source.replace(/gameLoop\(\);\s*$/, ''), context);
const read = expression => vm.runInContext(expression, context);
const resize = (width, height) => {
    viewport.innerWidth = width;
    viewport.innerHeight = height;
    events.resize();
};

for (const [width, height] of [[320, 568], [390, 844], [844, 390],
    [768, 1024], [1024, 600], [1920, 1080], [3840, 2160]]) {
    resize(width, height);
    read('initGame()');
    const arenaWidth = Math.min(width, 720, Math.round(height * 1.1));
    assert.equal(read('cw'), arenaWidth);
    assert.equal(canvas.style.marginLeft, (width - arenaWidth) / 2 + 'px');
    assert.equal(elements['ui-layer'].style.maxWidth, arenaWidth + 'px');
    assert.equal(read("['spring','fragile','moving'].every(type => walls.some(wall => wall.type === type))"), true);
    assert.equal(read('walls.some(wall => wall.optional)'), true, 'forked landing choice is generated');
    assert.equal(read("['near','cross','center','fork','merge'].every(motif => walls.some(wall => wall.motif === motif))"), true);
    assert.equal(read("new Set(walls.filter(wall => !wall.ground).map(wall => wall.x + wall.w / 2 < cw / 3 ? 'left' : wall.x + wall.w / 2 > cw * 2 / 3 ? 'right' : 'center')).size"), 3);

    // Directed jumps must keep an upward route through mixed layouts and forks.
    const climbed = read(`
        var hops = 0;
        var failure = null;
        for (var hop = 0; hop < 12; hop++) {
            var source = slime.platform;
            var choices = walls.filter(wall => !wall.collapsed && wall.y < source.y - 50 * GAME_SCALE)
                .sort((a, b) => b.y - a.y);
            var nextY = choices[0].y;
            var target = choices.filter(wall => Math.abs(wall.y - nextY) < 15 * GAME_SCALE)
                .sort((a, b) => Math.abs(a.x + a.w / 2 - slime.x) - Math.abs(b.x + b.w / 2 - slime.x))[0];
            var center = target.x + target.w / 2;
            launch((center - slime.x) / 48 / 0.12, -14 * GAME_SCALE / 0.12);
            var reached = false;
            for (var frame = 0; frame < 115; frame++) {
                update();
                if (slime.platform && slime.platform.y < source.y - 50 * GAME_SCALE) { reached = true; break; }
            }
            if (!reached) {
                failure = { hop, sourceType: source.type, sourceX: source.x, targetX: target.x,
                    targetW: target.w, playerX: slime.x, playerY: slime.y, targetY: target.y,
                    landedOn: slime.platform && slime.platform.type };
                break;
            }
            hops++;
        }
        ({hops, failure});
    `);
    assert.equal(climbed.hops, 12, width + 'x' + height + ': twelve islands are reachable ' + JSON.stringify(climbed.failure));
    assert.ok(read('score > 0'), width + 'x' + height + ': climbing earns altitude');
}

resize(390, 844);
read('initGame(); slime.platform = walls[1]; slime.y = walls[1].y - slime.radius; cameraY = -200; score = 30');
const before = read('({x: slime.x, feet: slime.y + slime.radius, platformY: slime.platform.y, cameraY, score, altitude: scoreOffset + (scoreOriginY - slime.y - slime.radius) / (10 * GAME_SCALE)})');
resize(1920, 1080);
const after = read('({x: slime.x, feet: slime.y + slime.radius, platformY: slime.platform.y, cameraY, score, altitude: scoreOffset + (scoreOriginY - slime.y - slime.radius) / (10 * GAME_SCALE)})');
assert.equal(after.x / before.x, 720 / 390);
assert.ok(Math.abs(after.feet - before.feet - (1080 - 844)) < 1e-9);
assert.ok(Math.abs(after.platformY - before.platformY - (1080 - 844)) < 1e-9);
assert.equal(after.cameraY - before.cameraY, 1080 - 844);
assert.equal(after.score, before.score);
assert.ok(Math.abs(after.altitude - before.altitude) < 1e-9);

read("initGame(); var spring = walls.find(wall => wall.type === 'spring'); slime.platform = spring; slime.y = spring.y - slime.radius; launch(90 * GAME_SCALE, -140 * GAME_SCALE)");
assert.ok(read('slime.vy < -16 * GAME_SCALE'), 'spring island increases launch power');
assert.equal(read('slime.airHopReady'), true);
assert.equal(read('airHop(30 * GAME_SCALE)'), true);
assert.equal(read('airHop(30 * GAME_SCALE)'), false);

read("initGame(); var fragile = walls.find(wall => wall.type === 'fragile'); slime.platform = fragile; slime.y = fragile.y - slime.radius; fragile.fragileTimer = 1; update()");
assert.equal(read('fragile.collapsed'), true);
assert.equal(read('slime.platform === fragile'), false);
assert.equal(read('slime.airHopReady'), true);

read("initGame(); var moving = walls.find(wall => wall.type === 'moving'); slime.platform = moving; slime.x = moving.x + moving.w / 2; slime.y = moving.y - slime.radius; moving.phase = 0; elapsed = 0; var offset = slime.x - moving.x; update()");
assert.ok(Math.abs(read('slime.x - moving.x - offset')) < 1e-9, 'moving island carries the slime');

read('initGame(); var seed = seeds[0]; slime.platform = null; slime.x = seed.x; slime.y = seed.y; slime.vx = 0; slime.vy = 0; slime.airHopReady = false; update()');
assert.equal(read('seedCount'), 1);
assert.equal(read('slime.airHopReady'), true);
assert.equal(elements.seedText.textContent, 1);

read('initGame(); cameraY = -ch; slime.platform = null; slime.y = 100; update()');
assert.equal(read('state'), 'GAMEOVER');
assert.equal(elements.finalScore.textContent, read('score'));

console.log('Slime Jump island reachability and resize checks passed.');
