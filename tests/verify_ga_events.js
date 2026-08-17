// ============================================================================
// 구글 태그(GA4) G-T0XQB053HX 전수 삽입 및 이벤트 트래킹 검증 스크립트
// ============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');

const htmlFiles = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'game', 'shadow_puzzle', 'index.html'),
    path.join(rootDir, 'game', 'slime_jump', 'index.html'),
    path.join(rootDir, 'game', 'Magnetic_Orbit', 'index.html'),
    path.join(rootDir, 'game', '3D_ minesweeper', 'index.html'),
    path.join(rootDir, 'game', 'maze_escape', 'index.html'),
    path.join(rootDir, 'game', 'hacking', 'index.html'),
    path.join(rootDir, 'game', 'choi_circle', 'index.html'),
    path.join(rootDir, 'game', 'robot', 'index.html'),
    path.join(rootDir, 'game', 'sign_up_for_hell', 'index.html')
];

console.log('===============================================================');
console.log('  🧪 GA4 (G-T0XQB053HX) Tag & Custom Event Verification');
console.log('===============================================================');

// 1. 10개 HTML 파일에 gtag.js 및 G-T0XQB053HX 삽입 검증
console.log('\n[1] Checking GA4 Tag in all 10 HTML files...');
htmlFiles.forEach(f => {
    const relPath = path.relative(rootDir, f);
    assert(fs.existsSync(f), `File exists: ${relPath}`);
    const content = fs.readFileSync(f, 'utf8');
    assert(content.includes('https://www.googletagmanager.com/gtag/js?id=G-T0XQB053HX'), `Includes gtag script in ${relPath}`);
    assert(content.includes("gtag('config', 'G-T0XQB053HX');"), `Includes gtag config in ${relPath}`);
    console.log(`  ✔ Verified GA4 Tag: ${relPath}`);
});

// 2. 메인 포털 유입 및 클릭 이벤트 검증
console.log('\n[2] Checking Main Portal Event Tracking...');
const portalContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert(portalContent.includes("trackEvent('game_enter'"), 'Includes game_enter event tracking');
assert(portalContent.includes("trackEvent('category_filter'"), 'Includes category_filter event tracking');
assert(portalContent.includes("trackEvent('profile_click'"), 'Includes profile_click event tracking');
console.log('  ✔ Verified Main Portal Acquisition & Exploration Events');

// 3. 섀도우 퍼즐 핵심 퍼널 이벤트 검증
console.log('\n[3] Checking Shadow Puzzle In-game Funnel Events...');
const shadowJs = fs.readFileSync(path.join(rootDir, 'game', 'shadow_puzzle', 'script.js'), 'utf8');
assert(shadowJs.includes("trackEvent('game_start'"), 'Includes game_start event tracking');
assert(shadowJs.includes("trackEvent('hint_view'"), 'Includes hint_view event tracking');
assert(shadowJs.includes("trackEvent('level_clear'"), 'Includes level_clear event tracking');
assert(shadowJs.includes("trackEvent('spti_complete'"), 'Includes spti_complete event tracking');
assert(shadowJs.includes("trackEvent('viral_share'"), 'Includes viral_share event tracking');
console.log('  ✔ Verified Shadow Puzzle Complete Funnel Events (start -> hint -> clear -> spti -> share)');

console.log('\n===============================================================');
console.log('🎉 ALL 10 GA4 TAGS & CUSTOM EVENT LOGGINGS VERIFIED PERFECTLY!');
console.log('===============================================================');
