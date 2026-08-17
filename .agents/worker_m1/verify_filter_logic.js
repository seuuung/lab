const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Parse articles and their data-category
const cardMatches = [...html.matchAll(/<article[^>]*data-category=["']([^"']+)["'][^>]*>/g)];
const cards = cardMatches.map(m => m[1]);

console.log('=== TAB FILTER SIMULATION TEST ===');
console.log(`Total Cards Found: ${cards.length}`);

// Test count logic
const counts = {
    all: cards.length,
    app: cards.filter(c => c === 'app').length,
    game: cards.filter(c => c === 'game').length,
    lab: cards.filter(c => c === 'lab').length
};

console.log('Calculated Category Counts:', counts);

// Test filter visibility logic
function simulateFilter(category) {
    const visible = cards.filter(c => category === 'all' || c === category);
    return visible.length;
}

const tests = [
    { cat: 'all', expected: 12, actual: simulateFilter('all') },
    { cat: 'app', expected: 2, actual: simulateFilter('app') },
    { cat: 'game', expected: 6, actual: simulateFilter('game') },
    { cat: 'lab', expected: 4, actual: simulateFilter('lab') }
];

let allPass = true;
tests.forEach(t => {
    const pass = t.actual === t.expected;
    console.log(`${pass ? '✅ PASS' : '❌ FAIL'}: Category '${t.cat}' -> Expected: ${t.expected}, Actual Visible: ${t.actual}`);
    if (!pass) allPass = false;
});

if (!allPass) {
    process.exit(1);
}
console.log('\nFilter simulation test succeeded without errors!');
