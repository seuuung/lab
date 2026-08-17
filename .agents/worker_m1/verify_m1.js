const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const tests = [
    { name: '1. Viewport-fit meta tag check', pass: html.includes('viewport-fit=cover') },
    { name: '2. About Me profile name & intro text', pass: html.includes('승민 (Seungmin)') && html.includes('창의적인 인터랙티브 웹과 모바일 앱을 만듭니다') },
    { name: '3. GitHub link URL', pass: html.includes('https://github.com/seuuung') },
    { name: '4. Tech stack badges', pass: html.includes('JavaScript (ES6+)') && html.includes('Tailwind CSS') && html.includes('Three.js (WebGL)') && html.includes('Canvas 2D API') },
    { name: '5. 4-stage category tab buttons', pass: html.includes('data-filter="all"') && html.includes('data-filter="app"') && html.includes('data-filter="game"') && html.includes('data-filter="lab"') },
    { name: '6. Samcheok Weather Toto card', pass: html.includes('game/toto/index.html') && html.includes('삼척 기상토토') },
    { name: '7. Footer branding check', pass: html.includes("© 2026 승민's 실험실 (Seungmin's Lab). All rights reserved.") },
    { name: '8. Glassmorphism backdrop-filter CSS', pass: html.includes('backdrop-filter: blur(16px)') && html.includes('backdrop-filter: blur(20px)') },
    { name: '9. Card Category counts (App=2, Game=6, Lab=4, Total=12)', pass: (html.match(/data-category="app"/g) || []).length === 2 && (html.match(/data-category="game"/g) || []).length === 6 && (html.match(/data-category="lab"/g) || []).length === 4 }
];

console.log('=== MILESTONE 1 VERIFICATION RESULTS ===');
let allPass = true;
tests.forEach(t => {
    console.log((t.pass ? '✅ PASS: ' : '❌ FAIL: ') + t.name);
    if (!t.pass) allPass = false;
});

const appMatches = (html.match(/data-category="app"/g) || []).length;
const gameMatches = (html.match(/data-category="game"/g) || []).length;
const labMatches = (html.match(/data-category="lab"/g) || []).length;
console.log(`\nCategory Counts -> App: ${appMatches}, Game: ${gameMatches}, Lab: ${labMatches}, Total: ${appMatches + gameMatches + labMatches}`);

if (!allPass) {
    console.error('Some tests failed!');
    process.exit(1);
} else {
    console.log('\nAll Milestone 1 verification tests passed successfully!');
}
