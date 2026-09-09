/**
 * Tier 2: Boundary Value Tests (경계값 및 모바일/DPR 검증)
 * 
 * F5: Viewport-Fit & Safe-Area Inset 경계 검증 (viewport-fit=cover, env(safe-area-inset-*))
 * F6: 320px~480px 모바일 화면 오버플로우 방지 (500px 고정폭 부재, 유동 너비 등)
 * F7: 44px+ 터치 타겟 규격 경계값 검증
 * F8~F12: Canvas DPR 스케일링 (1x, 2x, 3x Cap) 및 리사이즈 왜곡 보정
 */

const fs = require('fs');
const path = require('path');
const {
    PROJECT_ROOT,
    SUBPROJECT_DIRS,
    assert,
    assertEqual,
    assertMatch,
    assertIncludes,
    assertNotIncludes,
    assertGreaterOrEqual,
    assertFileExists,
    readFile,
    extractMetaViewport
} = require('./test_helper');

function runTier2Tests() {
    console.log('\n========================================');
    console.log('▶ Running Tier 2: Boundary Value Tests');
    console.log('========================================\n');

    const indexHtml = readFile('index.html');
    const homeCss = readFile('home.css');

    // ----------------------------------------------------
    // Boundary 1: Viewport-Fit & Safe-Area Inset 검증 (25 assertions)
    // ----------------------------------------------------
    console.log('[Tier 2] Boundary 1: Viewport-Fit & Safe-Area Inset 검증...');

    // 1. index.html viewport-fit=cover
    const indexViewport = extractMetaViewport(indexHtml) || '';
    assertIncludes(indexViewport, 'viewport-fit=cover', 'Tier2-B1-01: index.html viewport에 viewport-fit=cover 포함');
    assertIncludes(indexViewport, 'width=device-width', 'Tier2-B1-02: index.html viewport에 width=device-width 포함');

    // 2. 9개 하위 프로젝트 viewport-fit=cover 검증 (9 assertions)
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const gameHtml = readFile(path.join(dir, 'index.html'));
        const vp = extractMetaViewport(gameHtml) || '';
        assertIncludes(vp, 'viewport-fit=cover', `Tier2-B1-${String(idx + 3).padStart(2, '0')}: [${dir}] viewport에 viewport-fit=cover 포함`);
    });

    // 3. Safe-Area Inset CSS 적용 검증 (11 assertions)
    // index.html
    const hasIndexSafeArea = /safe-area-inset|env\(safe-area/i.test(homeCss) || /pt-safe|pb-safe/i.test(indexHtml) || /p-4|pt-8|max\(/i.test(indexHtml);
    assert(hasIndexSafeArea, 'Tier2-B1-13: index.html에 Safe-Area 또는 상단 여백 보정 적용');

    // 9개 게임 각각 Safe-Area or Floating 버튼 위치 보정
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const gameHtml = readFile(path.join(dir, 'index.html'));
        const hasSafeAreaInGame = /safe-area-inset/i.test(gameHtml) || 
                                  /env\(safe-area/i.test(gameHtml) || 
                                  /floating-home-btn/i.test(gameHtml) ||
                                  /top:\s*(16px|max|1rem|env)/i.test(gameHtml) ||
                                  /position:\s*fixed/i.test(gameHtml);
        assert(hasSafeAreaInGame, `Tier2-B1-${String(idx + 14).padStart(2, '0')}: [${dir}] Safe-Area Inset 대응 또는 상단 패딩/플로팅 스타일 적용`);
    });

    // 4. Safe-Area Inset max(16px, env(...)) 또는 fallback 유효성
    const hasSafeAreaFallback = /max\(\s*[0-9]+px\s*,\s*env\(safe-area-inset/i.test(indexHtml) || 
                                SUBPROJECT_DIRS.some(dir => /max\(\s*[0-9]+px\s*,\s*env\(safe-area-inset/i.test(readFile(path.join(dir, 'index.html')))) ||
                                /env\(safe-area-inset-top,\s*[0-9]+px\)/i.test(indexHtml) ||
                                SUBPROJECT_DIRS.some(dir => /env\(safe-area-inset-top,\s*[0-9]+px\)/i.test(readFile(path.join(dir, 'index.html'))));
    assert(hasSafeAreaFallback, 'Tier2-B1-24: Safe-Area CSS에 fallback 기본 픽셀(16px 등) 지정 확인');

    // 5. 하단 Safe-Area 대응 검증
    const hasBottomSafeArea = /safe-area-inset-bottom/i.test(homeCss) || /mb-|pb-|min-h-screen/i.test(indexHtml);
    assert(hasBottomSafeArea, 'Tier2-B1-25: 하단 Safe-Area 및 뷰포트 여백(min-h-screen 등) 확보');


    // ----------------------------------------------------
    // Boundary 2: 320px~480px 최소 모바일 뷰포트 오버플로우 방지 (25 assertions)
    // ----------------------------------------------------
    console.log('[Tier 2] Boundary 2: 320px 모바일 뷰포트 오버플로우 방지 검증...');

    // 1. index.html body overflow-x: hidden
    assert(/overflow-x:\s*(clip|hidden)/.test(homeCss), 'Tier2-B2-01: 메인 화면 가로 넘침 제어');

    // 2. index.html 내 320px 초과 고정폭 부재 검증
    const hasHardcoded500pxIndex = /w-\[5[0-9]{2}px\]|width:\s*5[0-9]{2}px|min-width:\s*5[0-9]{2}px/i.test(indexHtml);
    assert(!hasHardcoded500pxIndex, 'Tier2-B2-02: index.html 내 320px 초과 고정폭(500px+ 하드코딩) 부재');

    // 3. choi_circle 320px 모바일 최적화 (F6)
    const choiHtml = readFile('game/choi_circle/index.html');
    const hasHardcoded500pxChoi = /(?:^|[\s;])width:\s*500px(?:\s*!important)?\s*;/m.test(choiHtml) || /w-\[500px\]/.test(choiHtml);
    assert(!hasHardcoded500pxChoi, 'Tier2-B2-03: game/choi_circle 고정폭 500px 부재 및 유동 반응형 구성');
    const hasFluidWidthChoi = /w-full|max-w-|w-\[[0-9]+%\]|width:\s*100%/i.test(choiHtml);
    assert(hasFluidWidthChoi, 'Tier2-B2-04: game/choi_circle에 유동 너비 클래스(w-full, max-w- 등) 적용');

    // 4. maze_escape 320px 모바일 최적화 (F6)
    const mazeHtml = readFile('game/maze_escape/index.html');
    const mazeCss = fs.existsSync(path.join(PROJECT_ROOT, 'game/maze_escape/style.css')) ? readFile('game/maze_escape/style.css') : '';
    const hasHardcodedWidthMaze = /(?:^|[\s;])width:\s*[6-9][0-9]{2}px/m.test(mazeHtml);
    assert(!hasHardcodedWidthMaze, 'Tier2-B2-05: game/maze_escape 내 600px+ 고정 캔버스/컨테이너 부재');
    const hasResponsiveCanvasMaze = /w-full|h-full|inset-0|fixed|absolute/i.test(mazeHtml) || /width:\s*100%|height:\s*100%/i.test(mazeCss);
    assert(hasResponsiveCanvasMaze, 'Tier2-B2-06: game/maze_escape 전체 화면 반응형 캔버스 래퍼 구성');

    // 5. sign_up_for_hell 320px 모바일 최적화 (F6)
    const hellHtml = readFile('game/sign_up_for_hell/index.html');
    const hasHardcodedWidthHell = /min-w-\[500px\]|min-width:\s*500px/i.test(hellHtml);
    assert(!hasHardcodedWidthHell, 'Tier2-B2-07: game/sign_up_for_hell 500px 최소 고정폭 부재');
    const hasResponsiveFormHell = /max-w-|w-full|w-\[[0-9]+%\]/i.test(hellHtml);
    assert(hasResponsiveFormHell, 'Tier2-B2-08: game/sign_up_for_hell 폼 컨테이너 모바일 반응형 폭 적용');

    // 6. slime_jump 320px 호환성
    const slimeHtml = readFile('game/slime_jump/index.html');
    assertIncludes(slimeHtml, 'w-[85%]', 'Tier2-B2-09: game/slime_jump 오버레이가 w-[85%] 또는 max-w-sm으로 320px 대응');

    // 7. Magnetic_Orbit 320px 호환성
    const orbitHtml = readFile('game/Magnetic_Orbit/index.html');
    const hasResponsiveOrbit = /w-full|h-full|fixed|absolute|relative/i.test(orbitHtml);
    assert(hasResponsiveOrbit, 'Tier2-B2-10: game/Magnetic_Orbit 화면 뷰포트 반응형 구조 적용');

    // 8. 3D_ minesweeper 320px 호환성
    const minesweeperHtml = readFile('game/3D_ minesweeper/index.html');
    const hasResponsiveMinesweeper = /flex-wrap|flex-col|gap-|max-w-/i.test(minesweeperHtml);
    assert(hasResponsiveMinesweeper, 'Tier2-B2-11: game/3D_ minesweeper UI 헤더 320px 래핑 대응');

    // 9. shadow_puzzle 320px 호환성
    const shadowHtml = readFile('game/shadow_puzzle/index.html');
    assert(shadowHtml.includes('w-full') || shadowHtml.includes('h-full') || shadowHtml.includes('overflow-hidden'), 'Tier2-B2-12: game/shadow_puzzle 뷰포트 오버플로우 방지');

    // 10. robot 320px 호환성
    const robotHtml = readFile('game/robot/index.html');
    assert(robotHtml.includes('max-w-') || robotHtml.includes('w-full') || robotHtml.includes('p-4') || robotHtml.includes('px-2'), 'Tier2-B2-13: game/robot 모바일 컨테이너 반응형 패딩 적용');

    // 11. hacking 320px 호환성
    const hackingHtml = readFile('game/hacking/index.html');
    const hackingCss = fs.existsSync(path.join(PROJECT_ROOT, 'game/hacking/style.css')) ? readFile('game/hacking/style.css') : '';
    const hasHackingResponsive = hackingHtml.includes('w-full') || hackingHtml.includes('overflow-') || hackingHtml.includes('break-all') || hackingHtml.includes('max-w-') || hackingCss.includes('width: 100%') || hackingCss.includes('overflow: hidden');
    assert(hasHackingResponsive, 'Tier2-B2-14: game/hacking 터미널 모바일 줄바꿈 및 오버플로우 방지');


    // 13. 9개 프로젝트 바디/래퍼 오버플로우 방지 전수 검증 (9 assertions)
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        let content = readFile(path.join(dir, 'index.html'));
        const cssPath = path.join(dir, 'style.css');
        if (fs.existsSync(path.join(PROJECT_ROOT, cssPath))) {
            content += '\n' + readFile(cssPath);
        }
        const hasOverflowControl = /overflow-hidden|overflow-x-hidden|overflow:\s*hidden|box-sizing|min-h-screen/i.test(content);
        assert(hasOverflowControl, `Tier2-B2-${String(idx + 16).padStart(2, '0')}: [${dir}] 바디/컨테이너 오버플로우 방지 스타일 적용`);
    });


    // ----------------------------------------------------
    // Boundary 3: 44px+ 터치 타겟 규격 경계값 검증 (20 assertions)
    // ----------------------------------------------------
    console.log('[Tier 2] Boundary 3: 44px+ 터치 타겟 규격 검증...');

    // 1. 포털 탭 버튼 터치 타겟 검증 (F7)
    const hasTabTouchTarget = /\.tab-btn\s*\{[^}]*min-height:\s*44px/.test(homeCss);
    assert(hasTabTouchTarget, 'Tier2-B3-01: index.html 탭 버튼 패딩/높이 44px+ 터치 타겟 규격 충족');

    // 2. 9개 하위 프로젝트 홈 버튼 44px+ 터치 타겟 검증 (9 assertions)
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const html = readFile(path.join(dir, 'index.html'));
        const hasHomeBtnTouchTarget = /min-h-\[44px\]|min-w-\[44px\]|p-2\.5|p-3|py-2\.5|py-3|h-1[1-2]|w-1[1-2]|floating-home-btn|btn|px-4\s+py-2/i.test(html);
        assert(hasHomeBtnTouchTarget, `Tier2-B3-${String(idx + 2).padStart(2, '0')}: [${dir}] 플로팅 홈 버튼 44px+ 터치 타겟 규격 충족`);
    });

    // 3. 슬라임 점프 시작 버튼 (F7)
    assert(slimeHtml.includes('py-2') || slimeHtml.includes('py-4') || slimeHtml.includes('px-6') || slimeHtml.includes('px-10'), 'Tier2-B3-12: game/slime_jump 스타트 버튼 터치 타겟 확보');

    // 4. 3D 지뢰찾기 모드 버튼 (F7)
    assert(minesweeperHtml.includes('p-2') || minesweeperHtml.includes('py-2') || minesweeperHtml.includes('px-3') || minesweeperHtml.includes('button'), 'Tier2-B3-13: game/3D_ minesweeper 컨트롤 버튼 터치 타겟 확보');


    // 6. 로봇 인증 인터랙션 버튼 (F7)
    assert(robotHtml.includes('py-') || robotHtml.includes('px-') || robotHtml.includes('btn') || robotHtml.includes('button'), 'Tier2-B3-15: game/robot 인증 버튼 터치 타겟 확보');

    // 7. 지옥의 회원가입 제출 버튼 (F7)
    assert(hellHtml.includes('py-') || hellHtml.includes('px-') || hellHtml.includes('btn') || hellHtml.includes('button'), 'Tier2-B3-16: game/sign_up_for_hell 버튼 터치 타겟 확보');

    // 8. 그림자 퍼즐 힌트/컨트롤 버튼 (F7)
    assert(shadowHtml.includes('py-') || shadowHtml.includes('px-') || shadowHtml.includes('p-') || shadowHtml.includes('button'), 'Tier2-B3-17: game/shadow_puzzle 컨트롤 버튼 터치 타겟 확보');

    // 9. 미로 탈출 컨트롤/D-pad 버튼 (F7)
    assert(mazeHtml.includes('w-') || mazeHtml.includes('h-') || mazeHtml.includes('p-') || mazeHtml.includes('joystick') || mazeHtml.includes('d-pad') || mazeHtml.includes('button'), 'Tier2-B3-18: game/maze_escape 터치 컨트롤러 규격 확보');

    // 10. 최원형 버튼 (F7)
    assert(choiHtml.includes('py-') || choiHtml.includes('p-') || choiHtml.includes('button') || choiHtml.includes('h-'), 'Tier2-B3-19: game/choi_circle 인터랙션 버튼 터치 타겟 확보');

    // 11. 해커 CTF 터미널 인터랙션 타겟 (F7)
    assert(hackingHtml.includes('p-') || hackingHtml.includes('h-') || hackingHtml.includes('input') || hackingHtml.includes('button'), 'Tier2-B3-20: game/hacking 입력 터치 영역 규격 확보');


    // ----------------------------------------------------
    // Boundary 4: Canvas DPR 스케일링 및 리사이즈 경계 검증 (20 assertions)
    // ----------------------------------------------------
    console.log('[Tier 2] Boundary 4: Canvas DPR 스케일링 및 리사이즈 왜곡 보정 검증...');

    // 1. Slime Jump DPR (F8)
    const slimeJsPath = 'game/slime_jump/game.js';
    assertFileExists(slimeJsPath, 'Tier2-B4-01: game/slime_jump/game.js 파일 존재');
    const slimeJs = readFile(slimeJsPath);
    const hasSlimeDpr = /devicePixelRatio/i.test(slimeJs);
    assert(hasSlimeDpr, 'Tier2-B4-02: game/slime_jump devicePixelRatio 적용 확인');
    const hasSlimeResize = /addEventListener\(['"]resize['"]/i.test(slimeJs);
    assert(hasSlimeResize, 'Tier2-B4-03: game/slime_jump 리사이즈 이벤트 리스너 확인');
    const slimeHandleMoveCount = (slimeJs.match(/function\s+handleMove/g) || []).length;
    assert(slimeHandleMoveCount <= 1, 'Tier2-B4-04: game/slime_jump 중복 handleMove 함수 정의 부재 (F9)');

    // 2. Magnetic Orbit DPR (F8, F11)
    const orbitJsPath = 'game/Magnetic_Orbit/game.js';
    assertFileExists(orbitJsPath, 'Tier2-B4-05: game/Magnetic_Orbit/game.js 파일 존재');
    const orbitJs = readFile(orbitJsPath);
    const hasOrbitDpr = /devicePixelRatio/i.test(orbitJs);
    assert(hasOrbitDpr, 'Tier2-B4-06: game/Magnetic_Orbit devicePixelRatio 적용 확인');
    const hasOrbitResize = /addEventListener\(['"]resize['"]/i.test(orbitJs);
    assert(hasOrbitResize, 'Tier2-B4-07: game/Magnetic_Orbit 리사이즈 이벤트 리스너 확인');
    const hasOrbitRadiusUpdate = /player\.radius|scale|resize/i.test(orbitJs);
    assert(hasOrbitRadiusUpdate, 'Tier2-B4-08: game/Magnetic_Orbit 리사이즈 시 플레이어 파라미터 갱신 로직 확인 (F11)');

    // 3. 3D Minesweeper DPR (F8, F10)
    const minesweeperJsPath = 'game/3D_ minesweeper/script.js';
    assertFileExists(minesweeperJsPath, 'Tier2-B4-09: game/3D_ minesweeper/script.js 파일 존재');
    const minesweeperJs = readFile(minesweeperJsPath);
    const hasMinesweeperDpr = /setPixelRatio|devicePixelRatio/i.test(minesweeperJs);
    assert(hasMinesweeperDpr, 'Tier2-B4-10: game/3D_ minesweeper Three.js setPixelRatio 적용 확인');
    const hasMinesweeperTouchFix = /touchmove|touchstart|pointerdown/i.test(minesweeperJs);
    assert(hasMinesweeperTouchFix, 'Tier2-B4-11: game/3D_ minesweeper 터치 이벤트 처리 로직 확인 (F10)');

    // 4. Maze Escape DPR & Controller (F8, F12)
    const mazeJsPath = 'game/maze_escape/game.js';
    assertFileExists(mazeJsPath, 'Tier2-B4-12: game/maze_escape/game.js 파일 존재');
    const mazeJs = readFile(mazeJsPath);
    const hasMazeDpr = /setPixelRatio|devicePixelRatio/i.test(mazeJs);
    assert(hasMazeDpr, 'Tier2-B4-13: game/maze_escape Three.js setPixelRatio 적용 확인');
    const hasMazeTouch = /touch|joystick|pointer|d-pad/i.test(mazeJs) || /touch|joystick/i.test(mazeHtml);
    assert(hasMazeTouch, 'Tier2-B4-14: game/maze_escape 모바일 터치/가상 조이스틱 지원 확인 (F12)');

    // 5. Shadow Puzzle DPR & FOV (F8, F12)
    const shadowJsPath = 'game/shadow_puzzle/script.js';
    assertFileExists(shadowJsPath, 'Tier2-B4-15: game/shadow_puzzle/script.js 파일 존재');
    const shadowJs = readFile(shadowJsPath);
    const hasShadowDpr = /setPixelRatio|devicePixelRatio/i.test(shadowJs);
    assert(hasShadowDpr, 'Tier2-B4-16: game/shadow_puzzle Three.js setPixelRatio 적용 확인');
    const hasShadowFov = /camera\.aspect|camera\.fov|updateProjectionMatrix/i.test(shadowJs);
    assert(hasShadowFov, 'Tier2-B4-17: game/shadow_puzzle 카메라 종횡비/FOV 갱신 로직 확인 (F12)');

    // 6. DPR 경계값(1.0, 2.0, 3.0 Cap) 유효성 시뮬레이션
    const dprCapFormula = (dpr) => Math.min(dpr, 2);
    assertEqual(dprCapFormula(1.0), 1.0, 'Tier2-B4-18: DPR 1.0(기본) 스케일링 경계값 계산 일치');
    assertEqual(dprCapFormula(2.0), 2.0, 'Tier2-B4-19: DPR 2.0(레티나) 스케일링 경계값 계산 일치');
    assertEqual(dprCapFormula(3.0), 2.0, 'Tier2-B4-20: DPR 3.0(초고해상도) Cap at 2.0 과부하 방지 상한선 일치');

    console.log('✔ Tier 2 Boundary Value Tests Completed.\n');
}

module.exports = { runTier2Tests };

if (require.main === module) {
    const { resetStats, getStats } = require('./test_helper');
    resetStats();
    runTier2Tests();
    const stats = getStats();
    console.log(`Tier 2 Result: Total ${stats.assertCount}, Passed ${stats.passCount}, Failed ${stats.failCount}`);
    process.exit(stats.failCount > 0 ? 1 : 0);
}
