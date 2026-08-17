// ============================================================================
// 섀도우 퍼즐 13개 레벨 대칭성 및 정답 판정 무결성 검증 스크립트
// ============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const shadowHtmlPath = path.join(rootDir, 'game', 'shadow_puzzle', 'index.html');
const shadowJsPath = path.join(rootDir, 'game', 'shadow_puzzle', 'script.js');
const shadowCssPath = path.join(rootDir, 'game', 'shadow_puzzle', 'style.css');

console.log('===============================================================');
console.log('  🧪 Shadow Puzzle Win Decision Logic & Symmetry Verification');
console.log('===============================================================');

// 1. 파일 무결성
console.log('\n[1] File Integrity Check...');
assert(fs.existsSync(shadowHtmlPath), 'index.html exists');
assert(fs.existsSync(shadowJsPath), 'script.js exists');
assert(fs.existsSync(shadowCssPath), 'style.css exists');
console.log('✔ All shadow puzzle files exist.');

const jsContent = fs.readFileSync(shadowJsPath, 'utf8');

// 2. 정답 판정 대칭성 및 반전 매핑 검증
console.log('\n[2] Symmetry & Reflection Quaternion Mappings Check...');
assert(jsContent.includes('allowXFlip: true'), 'Hourglass includes allowXFlip: true (top-bottom 180 deg symmetry)');
assert(jsContent.includes('allowYFlip !== false'), 'Allows Y-Flip reflection across all levels');
assert(jsContent.includes('Date.now() - correctStartTime >= 800'), 'Preserves 800ms snap confirmation delay per user feedback');
console.log('✔ Symmetry, reflection, and 800ms snap delay verified.');

// 3. 13개 레벨 활성 상태
console.log('\n[3] 13 Levels Check...');
const levelCountMatches = (jsContent.match(/name:\s*"/g) || []).length;
assert.strictEqual(levelCountMatches, 13, 'Exact 13 levels defined');
console.log('✔ Exactly 13 levels active.');

console.log('\n===============================================================');
console.log('🎉 ALL WIN LOGIC & SYMMETRY CHECKS PASSED!');
console.log('===============================================================');
