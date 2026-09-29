'use strict';

const assert = require('node:assert/strict');
const { distances, nextStep, spawnCell } = require('../game/maze_escape/chase_rules.js');

const maze = [
    '1111111',
    '1000101',
    '1010101',
    '1010001',
    '1011101',
    '1000001',
    '1111111'
].map(row => [...row].map(Number));
const start = { x: 1, z: 1 };
const exit = { x: 5, z: 1 };
let cell = start;
for (let steps = 0; steps < 30 && (cell.x !== exit.x || cell.z !== exit.z); steps++) {
    const next = nextStep(maze, cell, exit);
    assert.ok(next, 'a route exists through the corridor');
    assert.equal(Math.abs(next.x - cell.x) + Math.abs(next.z - cell.z), 1, 'monster moves to an adjacent cell');
    assert.notEqual(maze[next.z][next.x], 1, 'monster never enters a wall');
    cell = next;
}
assert.deepEqual(cell, exit, 'monster reaches its target around the wall');
assert.equal(nextStep(maze, exit, exit), null, 'no next tile is needed in the target cell');
assert.equal(nextStep(maze, { x: 5, z: 1 }, { x: 0, z: 0 }), null, 'an invalid target cannot produce a wall-crossing path');
assert.equal(nextStep(maze, { x: -1, z: 1 }, exit), null, 'out-of-bounds positions are ignored safely');

const corridor = [Array(22).fill(1), [1, ...Array(20).fill(0), 1], Array(22).fill(1)];
const player = { x: 1, z: 1 };
const candidate = spawnCell(corridor, player, () => 0);
const pathDistance = distances(corridor, player)[candidate.z][candidate.x];
assert.ok(pathDistance >= 12 && pathDistance <= 18, 'monster spawns several turns away from the player');
assert.equal(spawnCell([[0]], { x: 0, z: 0 }), null, 'tiny maps do not spawn on the player');

console.log('Maze chase rules: wall-safe routes, target handling and fair spawning passed');
