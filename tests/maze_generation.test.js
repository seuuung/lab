'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const chaseRules = require('../game/maze_escape/chase_rules.js');

const source = fs.readFileSync(path.join(__dirname, '../game/maze_escape/game.js'), 'utf8');
const start = source.indexOf('function generateMaze() {');
const end = source.indexOf('function createExitDoor() {', start);
assert.ok(start >= 0 && end > start, 'maze generator exists');
const generate = new Function('MAZE_SIZE', 'randomMath', 'chaseRules', 'mode', `let maze = []; const Math = randomMath; ${source.slice(start, end)}; generateMaze(); return maze;`);

function seededRandom(seed) {
    let state = seed >>> 0;
    return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}

for (const [size, openLimit, maxRoute, mode] of [[25, 350, 90, 'explore'], [21, 240, 70, 'chase']]) {
    for (let seed = 1; seed <= 100; seed++) {
        const maze = generate(size, { random: seededRandom(seed), floor: Math.floor }, chaseRules, mode);
        assert.equal(maze.length, size);
        assert.equal(maze[0].length, size);
        const reach = chaseRules.distances(maze, { x: 1, z: 1 });
        let open = 0, reachable = 0;
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                if (maze[z][x] !== 1) open++;
                if (reach[z][x] >= 0) reachable++;
            }
        }
        assert.equal(maze[size - 2][size - 2], 2, 'exit is placed in the maze');
        assert.equal(reachable, open, 'every corridor and the exit are reachable');
        assert.ok(open <= openLimit, 'mode stays within its exploration size');
        assert.ok(reach[size - 2][size - 2] <= maxRoute, 'extreme detours are rejected');
    }
}

console.log('Maze generation: 200 mode-sized maps have reachable exits and bounded exploration areas');
