'use strict';

(() => {
    const colors = [
        { id: 'coral', name: '코랄', symbol: '●', hex: '#ff7d78', exit: 'coral' },
        { id: 'cyan', name: '시안', symbol: '◆', hex: '#54e4f2', exit: 'cyan' },
        { id: 'amber', name: '앰버', symbol: '■', hex: '#ffd46a', exit: 'amber' },
        { id: 'violet', name: '바이올렛', symbol: '▲', hex: '#ba9cff', exit: 'violet' }
    ];
    const exits = ['coral', 'cyan', 'amber', 'violet'];
    const routes = {
        A: ['B', 'C'],
        B: ['coral', 'cyan'],
        C: ['amber', 'violet']
    };

    function nextNode(node, switches) {
        const options = routes[node];
        return options ? options[switches[node] === 1 ? 1 : 0] : null;
    }

    function waveFor(index) {
        return Math.min(4, Math.floor(index / 6) + 1);
    }

    function intervalFor(wave) {
        return [0, 2.75, 2.3, 1.95, 1.6][wave];
    }

    function travelTimeFor(wave) {
        return [0, 1.25, 1.2, 1.15, 1.1][wave];
    }

    function createSequence(random = Math.random) {
        const sequence = [];
        for (let wave = 1; wave <= 4; wave++) {
            const available = wave === 1 ? colors.slice(0, 2) : wave === 2 ? colors.slice(0, 3) : colors;
            const bag = Array.from({ length: 6 }, (_, index) => available[index % available.length]);
            for (let index = bag.length - 1; index > 0; index--) {
                const swap = Math.min(index, Math.floor(random() * (index + 1)));
                [bag[index], bag[swap]] = [bag[swap], bag[index]];
            }
            sequence.push(...bag);
        }
        return sequence;
    }

    function isCorrectExit(color, exit) {
        return color.exit === exit;
    }

    const rules = Object.freeze({ colors, exits, nextNode, waveFor, intervalFor, travelTimeFor, createSequence, isCorrectExit });
    if (typeof module !== 'undefined' && module.exports) module.exports = rules;
    if (typeof window !== 'undefined') window.SignalRules = rules;
})();
