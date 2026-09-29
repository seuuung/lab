'use strict';

(() => {
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    function distances(maze, start) {
        const height = maze.length;
        const width = maze[0].length;
        const result = Array.from({ length: height }, () => Array(width).fill(-1));
        if (!maze[start.z] || maze[start.z][start.x] === undefined || maze[start.z][start.x] === 1) return result;
        const queue = [start];
        result[start.z][start.x] = 0;
        for (let head = 0; head < queue.length; head++) {
            const cell = queue[head];
            for (const [dx, dz] of directions) {
                const x = cell.x + dx, z = cell.z + dz;
                if (x < 0 || x >= width || z < 0 || z >= height || maze[z][x] === 1 || result[z][x] !== -1) continue;
                result[z][x] = result[cell.z][cell.x] + 1;
                queue.push({ x, z });
            }
        }
        return result;
    }

    function nextStep(maze, from, target) {
        const map = distances(maze, target);
        if (map[from.z]?.[from.x] === undefined || map[from.z][from.x] <= 0) return null;
        for (const [dx, dz] of directions) {
            const x = from.x + dx, z = from.z + dz;
            if (map[z]?.[x] === map[from.z][from.x] - 1) return { x, z };
        }
        return null;
    }

    function spawnCell(maze, player, random = Math.random) {
        const map = distances(maze, player);
        const preferred = [];
        let farthest = null, farthestDistance = -1;
        for (let z = 0; z < maze.length; z++) {
            for (let x = 0; x < maze[z].length; x++) {
                const distance = map[z][x];
                if (distance >= 12 && distance <= 18) preferred.push({ x, z });
                if (distance > farthestDistance) { farthestDistance = distance; farthest = { x, z }; }
            }
        }
        if (preferred.length) return preferred[Math.min(preferred.length - 1, Math.floor(random() * preferred.length))];
        return farthestDistance > 0 ? farthest : null;
    }

    const rules = Object.freeze({ distances, nextStep, spawnCell });
    if (typeof module !== 'undefined' && module.exports) module.exports = rules;
    if (typeof window !== 'undefined') window.MazeChaseRules = rules;
})();
