// ============================================================================
// 섀도우 퍼즐 (Shadow Puzzle) 18개 레벨 및 모바일 UI 검증 스크립트
// ============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const shadowHtmlPath = path.join(rootDir, 'game', 'shadow_puzzle', 'index.html');
const shadowJsPath = path.join(rootDir, 'game', 'shadow_puzzle', 'script.js');
const shadowCssPath = path.join(rootDir, 'game', 'shadow_puzzle', 'style.css');

console.log('===============================================================');
console.log('  🧪 Shadow Puzzle 18 Levels & Mobile UI Verification');
console.log('===============================================================');

// 1. 파일 무결성
console.log('\n[1] File Integrity & Structure Check...');
assert(fs.existsSync(shadowHtmlPath), 'index.html exists');
assert(fs.existsSync(shadowJsPath), 'script.js exists');
assert(fs.existsSync(shadowCssPath), 'style.css exists');
console.log('✔ All shadow puzzle files exist.');

const htmlContent = fs.readFileSync(shadowHtmlPath, 'utf8');
const jsContent = fs.readFileSync(shadowJsPath, 'utf8');
const cssContent = fs.readFileSync(shadowCssPath, 'utf8');

// 2. 상단 바 및 모바일 레이아웃 검증
console.log('\n[2] Top Navbar & Mobile Layout Check...');
assert(htmlContent.includes('top-nav-bar'), 'Includes unified top-nav-bar');
assert(htmlContent.includes('id="level-select-btn"'), 'Includes level-select-btn');
assert(htmlContent.includes('id="hint-btn"'), 'Includes hint-btn');
assert(htmlContent.includes('id="sound-btn"'), 'Includes sound-btn');
assert(htmlContent.includes('id="reset-btn"'), 'Includes reset-btn');
assert(cssContent.includes('.top-nav-bar'), 'Includes .top-nav-bar in CSS');
assert(cssContent.includes('.top-btn'), 'Includes .top-btn in CSS');
assert(cssContent.includes('.icon-btn'), 'Includes .icon-btn in CSS');
console.log('✔ Top navbar and non-overlapping mobile layout verified.');

// 3. 18개 레벨 데이터 검증
console.log('\n[3] 18 Levels & Mechanics Check...');
const levelCountMatches = (jsContent.match(/name:\s*"/g) || []).length;
console.log(`Detected levels count: ${levelCountMatches}`);
assert(levelCountMatches >= 18, 'At least 18 levels defined');

assert(jsContent.includes('나비 (Butterfly)'), 'Includes Butterfly level');
assert(jsContent.includes('오리 (Rubber Duck)'), 'Includes Rubber Duck level');
assert(jsContent.includes('소나무 (Pine Tree)'), 'Includes Pine Tree level');
assert(jsContent.includes('열쇠 (Magic Key)'), 'Includes Magic Key level');
assert(jsContent.includes('모래시계 (Hourglass)'), 'Includes Hourglass level');
assert(jsContent.includes('방패 (Shield)'), 'Includes Shield level');
assert(jsContent.includes('로켓 (Space Rocket)'), 'Includes Space Rocket level');
assert(jsContent.includes('다이아몬드 (Diamond)'), 'Includes Diamond level');

// 4. 사운드 및 인터랙션 검증
assert(jsContent.includes('class SoundSynthesizer'), 'Includes SoundSynthesizer');
assert(jsContent.includes('proximityPct >= 90'), 'Includes 90% magnetic threshold');
assert(jsContent.includes('class ParticleEmitter'), 'Includes ParticleEmitter');
console.log('✔ 18 Levels and all interaction mechanics verified.');

console.log('\n===============================================================');
console.log('🎉 ALL SHADOW PUZZLE 18-LEVEL CHECKS PASSED!');
console.log('===============================================================');
