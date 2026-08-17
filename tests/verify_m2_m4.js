const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const games = [
    { dir: 'game/3D_ minesweeper', html: 'index.html', css: 'style.css' },
    { dir: 'game/Magnetic_Orbit', html: 'index.html', css: 'style.css' },
    { dir: 'game/choi_circle', html: 'index.html', css: null }, // inline style
    { dir: 'game/hacking', html: 'index.html', css: 'style.css' },
    { dir: 'game/maze_escape', html: 'index.html', css: 'style.css' },
    { dir: 'game/robot', html: 'index.html', css: 'style.css' },
    { dir: 'game/shadow_puzzle', html: 'index.html', css: 'style.css' },
    { dir: 'game/sign_up_for_hell', html: 'index.html', css: 'style.css' },
    { dir: 'game/slime_jump', html: 'index.html', css: 'style.css' },
    { dir: 'game/toto', html: 'index.html', css: 'style.css' },
];

let totalTests = 0;
let passedTests = 0;
const errors = [];

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ [PASS] ${message}`);
    } else {
        console.error(`  ❌ [FAIL] ${message}`);
        errors.push(message);
    }
}

console.log('=== [M2 & M4] 승민\'s 실험실 모바일 최적화 및 플로팅 홈 내비게이션 전수 검증 ===\n');

// 1. 10개 프로젝트 전수 Viewport 및 플로팅 홈 버튼 검증
console.log('1. Viewport & Floating Home Button Verification:');
games.forEach(g => {
    const htmlPath = path.join(projectRoot, g.dir, g.html);
    assert(fs.existsSync(htmlPath), `${g.dir}/${g.html} 파일 존재`);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // 1-1. viewport-fit=cover 검증
    const hasViewportFit = htmlContent.includes('viewport-fit=cover');
    assert(hasViewportFit, `${g.dir} viewport-fit=cover 메타태그 설정`);

    // 1-2. floating-home-btn 검증
    const hasHomeBtn = htmlContent.includes('class="floating-home-btn"') && htmlContent.includes('href="../../index.html"');
    assert(hasHomeBtn, `${g.dir} 표준 플로팅 홈 버튼(../../index.html) 탑재`);

    // 1-3. CSS에 floating-home-btn 정의 여부 검증
    let cssContent = '';
    if (g.css) {
        const cssPath = path.join(projectRoot, g.dir, g.css);
        assert(fs.existsSync(cssPath), `${g.dir}/${g.css} 파일 존재`);
        cssContent = fs.readFileSync(cssPath, 'utf8');
    } else {
        cssContent = htmlContent;
    }
    const hasHomeBtnCss = cssContent.includes('.floating-home-btn');
    assert(hasHomeBtnCss, `${g.dir} .floating-home-btn CSS 규칙 정의`);
});

// 2. 320px 모바일 오버플로우 방지 검증 (F6)
console.log('\n2. 320px Mobile Overflow & Fixed Size Remediation (F6):');
// 2-1. choi_circle
const choiHtml = fs.readFileSync(path.join(projectRoot, 'game/choi_circle/index.html'), 'utf8');
assert(choiHtml.includes('width: min(90vw, 500px)') || choiHtml.includes('min(90vw'), 'choi_circle: #truth-alert 팝업 min(90vw, 500px) 유동화');
assert(choiHtml.includes('width: min(75vw, 280px)') || choiHtml.includes('min(75vw'), 'choi_circle: .giant-circle 모바일 반응형 유동화');

// 2-2. maze_escape
const mazeCss = fs.readFileSync(path.join(projectRoot, 'game/maze_escape/style.css'), 'utf8');
assert(mazeCss.includes('clamp('), 'maze_escape: h1 및 패딩 clamp() 반응형 적용');

// 2-3. sign_up_for_hell
const hellHtml = fs.readFileSync(path.join(projectRoot, 'game/sign_up_for_hell/index.html'), 'utf8');
assert(hellHtml.includes('w-[calc(100%-16px)]') || hellHtml.includes('calc('), 'sign_up_for_hell: #main-box 320px 섀도우 돌출 방지 유동 폭 적용');

// 3. 44px+ 터치 타겟 규격 준수 검증 (F7)
console.log('\n3. 44px+ Touch Target Compliance (F7):');
// 3-1. 3D 지뢰찾기 모드 버튼
const mineCss = fs.readFileSync(path.join(projectRoot, 'game/3D_ minesweeper/style.css'), 'utf8');
assert(mineCss.includes('min-height: 44px'), '3D 지뢰찾기: .mode-btn 최소 44px 높이 규격 확보');

// 3-2. 슬라임 점프 버튼
const slimeHtml = fs.readFileSync(path.join(projectRoot, 'game/slime_jump/index.html'), 'utf8');
assert(slimeHtml.includes('min-h-[44px]'), '슬라임 점프: startBtn/restartBtn 44px+ 터치 타겟 확보');

// 3-3. 지옥의 회원가입 STOP 버튼
assert(hellHtml.includes('min-h-[44px]'), '지옥의 회원가입: 생년월일 STOP 버튼 44px+ 터치 타겟 확보');

// 4. 링크 정합성 및 버그 수정 검증 (F14)
console.log('\n4. Link Integrity & Bug Fixes (F14):');
const robotHtml = fs.readFileSync(path.join(projectRoot, 'game/robot/index.html'), 'utf8');
assert(robotHtml.includes('https://seuuung.github.io/game/robot/index.html'), '로봇 인증: og:url games/robot -> game/robot 오타 수정 완료');
assert(!robotHtml.includes('games/robot/index.html'), '로봇 인증: 구버전 잘못된 링크 잔존 없음');
assert(robotHtml.includes("location.href='../../index.html'"), '로봇 인증: 수료식 홈페이지 이동 링크 상대경로 확인');

console.log('\n==================================================');
console.log(`검증 결과: ${passedTests} / ${totalTests} 통과 (${Math.round(passedTests / totalTests * 100)}%)`);
if (errors.length === 0) {
    console.log('🎉 모든 M2 & M4 검증 항목을 완벽히 통과하였습니다!');
    process.exit(0);
} else {
    console.error('❌ 실패 항목:', errors);
    process.exit(1);
}
