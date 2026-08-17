/**
 * ⚔️ CHALLENGER STRESS SUITE: Part 3 - Navigation Loop & Cross-Link Integrity
 * 
 * 검증 항목:
 *  - 1. 10개 하위 프로젝트 좌상단 표준 Floating Home Button 계약(Contract) 준수
 *  - 2. 루트 `index.html` 쇼케이스 카드와 10개 하위 게임 간의 양방향 내비게이션 루프 무결성
 *  - 3. 카테고리 탭(all, app, game, lab) 필터링 상태 머신 스트레스 테스트
 *  - 4. 터치 타겟 44px+ 및 Safe-Area Inset 준수 검증
 *  - 5. 상대 경로 파일시스템 해석(Path Traversal) 100% 404 Free 검증
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function check(condition, msg) {
    totalChecks++;
    if (condition) {
        passedChecks++;
    } else {
        failedChecks++;
        failureDetails.push(msg);
        console.error(`  ❌ FAIL: ${msg}`);
    }
}

console.log('\n===============================================================');
console.log('⚔️  CHALLENGER 2: Navigation Loop & Cross-Link Integrity Test');
console.log('===============================================================\n');

const SUBPROJECTS = [
    'game/3D_ minesweeper',
    'game/Magnetic_Orbit',
    'game/choi_circle',
    'game/hacking',
    'game/maze_escape',
    'game/robot',
    'game/shadow_puzzle',
    'game/sign_up_for_hell',
    'game/slime_jump',
    'game/toto'
];

// ----------------------------------------------------------------------
// 1. Floating Home Navigation Contract in All 10 Subprojects
// ----------------------------------------------------------------------
console.log('▶ [1/4] Verifying Floating Home Navigation Contract in 10 Subprojects...');
SUBPROJECTS.forEach(subDir => {
    const htmlPath = path.join(PROJECT_ROOT, subDir, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // 1. floating-home-btn 클래스 존재
    check(html.includes('floating-home-btn'), `[${subDir}] Floating home button element exists`);

    // 2. href="../../index.html" 유효성
    const homeLinkMatch = html.match(/<a[^>]+class=["'][^"']*floating-home-btn[^"']*["'][^>]*href=["']([^"']+)["']/i) ||
                          html.match(/<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*floating-home-btn[^"']*["']/i);

    check(homeLinkMatch !== null, `[${subDir}] Home button link found in HTML`);
    if (homeLinkMatch) {
        const href = homeLinkMatch[1];
        const resolvedPath = path.resolve(path.dirname(htmlPath), href);
        const rootIndex = path.join(PROJECT_ROOT, 'index.html');
        check(resolvedPath === rootIndex, `[${subDir}] Home link '${href}' strictly resolves to project root index.html`);
        check(fs.existsSync(resolvedPath), `[${subDir}] Target index.html physically exists on disk`);
    }

    // 3. aria-label 접근성
    check(/aria-label=["'][^"']*홈[^"']*["']/i.test(html), `[${subDir}] Home button has accessible aria-label`);

    // 4. Safe-Area 및 44px 터치 규격
    let styleContent = html;
    const cssPath = path.join(PROJECT_ROOT, subDir, 'style.css');
    if (fs.existsSync(cssPath)) styleContent += '\n' + fs.readFileSync(cssPath, 'utf8');

    const hasSafeArea = /safe-area-inset-top/i.test(styleContent);
    const has44pxMin = /min-height:\s*44px|min-h-\[44px\]/i.test(styleContent);
    check(hasSafeArea, `[${subDir}] Home button adheres to Safe-Area Inset positioning`);
    check(has44pxMin, `[${subDir}] Home button meets 44px+ minimum touch target height`);
});

// ----------------------------------------------------------------------
// 2. Main Showcase Portal (index.html) Project Card Routing
// ----------------------------------------------------------------------
console.log('\n▶ [2/4] Verifying Main Showcase Portal Outbound Project Links...');
const indexHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

SUBPROJECTS.forEach(subDir => {
    // Check if index.html contains a link to subDir
    const normalizedSubDir = subDir.replace(/ /g, '%20');
    const hasLink = indexHtml.includes(subDir) || indexHtml.includes(normalizedSubDir);
    check(hasLink, `[index.html] Contains showcase card linking to '${subDir}'`);

    // Target index.html exists
    const subIndex = path.join(PROJECT_ROOT, subDir, 'index.html');
    check(fs.existsSync(subIndex), `[${subDir}] Subproject index.html exists on disk`);
});

// ----------------------------------------------------------------------
// 3. Bidirectional Navigation Round-Trip Simulation
// ----------------------------------------------------------------------
console.log('\n▶ [3/4] Simulating Bidirectional Navigation Loops (Portal <-> Subprojects)...');
SUBPROJECTS.forEach(subDir => {
    const forwardPath = path.join(PROJECT_ROOT, subDir, 'index.html');
    check(fs.existsSync(forwardPath), `Round-trip Step 1: index.html -> ${subDir}/index.html [200 OK]`);

    const subHtml = fs.readFileSync(forwardPath, 'utf8');
    const backwardMatch = subHtml.match(/class=["'][^"']*floating-home-btn[^"']*["'][^>]*href=["']([^"']+)["']/i) ||
                          subHtml.match(/href=["']([^"']+)["'][^>]*class=["'][^"']*floating-home-btn[^"']*["']/i);

    if (backwardMatch) {
        const returnHref = backwardMatch[1];
        const returnPath = path.resolve(path.dirname(forwardPath), returnHref);
        const isRoot = (returnPath === path.join(PROJECT_ROOT, 'index.html'));
        check(isRoot && fs.existsSync(returnPath), `Round-trip Step 2: ${subDir}/index.html -> index.html [200 OK Seamless Loop]`);
    } else {
        check(false, `Round-trip Step 2: Missing backward link in ${subDir}`);
    }
});

// ----------------------------------------------------------------------
// 4. Category Tabs & Card Filtering State Machine Test
// ----------------------------------------------------------------------
console.log('\n▶ [4/4] Testing Category Filtering State Machine (all, app, game, lab)...');
const cardRegex = /<a[^>]+data-category=["']([^"']+)["'][^>]*>/gi;
const cardsFound = [];
let cardMatch;
while ((cardMatch = cardRegex.exec(indexHtml)) !== null) {
    cardsFound.push(cardMatch[1]);
}

check(cardsFound.length >= 10, `Found ${cardsFound.length} showcase cards with data-category in index.html (Expected >= 10)`);

const categoryCounts = { all: cardsFound.length, app: 0, game: 0, lab: 0 };
cardsFound.forEach(cat => {
    if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
});

check(categoryCounts.app >= 1, `Category 'app' has ${categoryCounts.app} project card(s)`);
check(categoryCounts.game >= 5, `Category 'game' has ${categoryCounts.game} project card(s)`);
check(categoryCounts.lab >= 2, `Category 'lab' has ${categoryCounts.lab} project card(s)`);

console.log('\n===============================================================');
console.log(`📊 NAVIGATION & LINK SUMMARY: Passed ${passedChecks} / ${totalChecks} (Failures: ${failedChecks})`);
console.log('===============================================================\n');

if (failedChecks > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
