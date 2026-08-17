const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const jsFiles = [
  'game/3D_ minesweeper/script.js',
  'game/Magnetic_Orbit/game.js',
  'game/maze_escape/game.js',
  'game/robot/script.js',
  'game/shadow_puzzle/script.js',
  'game/sign_up_for_hell/script.js',
  'game/slime_jump/game.js',
  'game/toto/script.js',
  'game/hacking/script.js'
];

let hasError = false;
console.log('=== Checking Standalone JS Files ===');
jsFiles.forEach(relPath => {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    try {
      new vm.Script(code, { filename: relPath });
      console.log('✔ OK:', relPath);
    } catch (e) {
      console.error('❌ ERROR in ' + relPath + ':', e.message);
      hasError = true;
    }
  } else {
    console.log('⚠️ NOT FOUND:', relPath);
  }
});

console.log('\n=== Checking Inline Scripts in HTML Files ===');
const htmlFiles = [
  'index.html',
  'game/choi_circle/index.html',
  'game/hacking/index.html',
  'game/maze_escape/index.html',
  'game/robot/index.html',
  'game/shadow_puzzle/index.html',
  'game/sign_up_for_hell/index.html',
  'game/slime_jump/index.html',
  'game/toto/index.html',
  'game/3D_ minesweeper/index.html',
  'game/Magnetic_Orbit/index.html'
];

htmlFiles.forEach(relPath => {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error('❌ HTML not found:', relPath);
    hasError = true;
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const scripts = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
  scripts.forEach((s, idx) => {
    // If it has src and no body, skip
    const body = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    if (!body.trim()) return;
    try {
      new vm.Script(body, { filename: relPath + ':inline_' + idx });
      console.log('✔ OK inline script:', relPath, `(index ${idx})`);
    } catch (e) {
      console.error('❌ ERROR inline script in ' + relPath + ':inline_' + idx + ':', e.message);
      hasError = true;
    }
  });
});

console.log('\nTotal Syntax Validation Status:', hasError ? 'FAILED' : 'ALL PASSED');
process.exit(hasError ? 1 : 0);
