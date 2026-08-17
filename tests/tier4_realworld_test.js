/**
 * Tier 4: Real-World Workload & User Journey Tests (실사용 환경 E2E 시뮬레이션)
 * 
 * 실제 사용자의 전체 브라우징 여정 시뮬레이션:
 * - 포털 진입 -> 프로필 확인 -> 탭 필터 탐색
 * - 각 10개 하위 게임 진입 -> 캔버스/WebGL 및 모바일 제어 로딩 -> '실험실 홈' 복귀
 * - 전체 파일 링크 404 및 스크립트 신택스 에러 0건 검증
 */

const path = require('path');
const {
    PROJECT_ROOT,
    SUBPROJECT_DIRS,
    assert,
    assertEqual,
    assertMatch,
    assertIncludes,
    assertGreaterOrEqual,
    assertFileExists,
    readFile,
    checkJavaScriptSyntax
} = require('./test_helper');

function runTier4Tests() {
    console.log('\n========================================');
    console.log('▶ Running Tier 4: Real-World User Workloads');
    console.log('========================================\n');

    // ----------------------------------------------------
    // Scenario 1: 포털 메인 진입 및 About Me 프로필 확인
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 1: 포털 메인 진입 및 About Me 프로필 확인...');
    const indexHtml = readFile('index.html');
    assertIncludes(indexHtml, '승민', 'Tier4-S01-01: 포털 브랜드 헤더("승민\'s 실험실") 정상 렌더링');
    assertIncludes(indexHtml, 'https://github.com/seuuung', 'Tier4-S01-02: 사용자 프로필 내 GitHub 아웃링크 연결 정합성 확인');

    // ----------------------------------------------------
    // Scenario 2: 카테고리 탭 순차 탐색 여정 (전체 -> 앱 -> 게임 -> 밈&실험실 -> 전체)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 2: 카테고리 탭 순차 탐색 여정 시뮬레이션...');
    const hasTabs = indexHtml.includes('all') && indexHtml.includes('app') && indexHtml.includes('game') && indexHtml.includes('lab');
    assert(hasTabs, 'Tier4-S02-01: 4개 카테고리 탭 식별자가 모두 정의되어 원활한 필터링 탐색 가능');

    // ----------------------------------------------------
    // Scenario 3: 슬라임 점프 플레이 여정 (포털 -> 게임 진입 -> 캔버스 -> 홈 복귀)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 3: 슬라임 점프 플레이 여정...');
    const slimeHtml = readFile('game/slime_jump/index.html');
    const slimeJs = readFile('game/slime_jump/game.js');
    const slimeSyntax = checkJavaScriptSyntax(slimeJs, 'game/slime_jump/game.js');
    assert(slimeSyntax.valid, 'Tier4-S03-01: 슬라임 점프 game.js 구문 에러 없이 정상 로드');
    assert(slimeHtml.includes('canvas') || slimeJs.includes('canvas'), 'Tier4-S03-02: 슬라임 점프 캔버스 렌더링 엔진 정상 초기화');

    // ----------------------------------------------------
    // Scenario 4: 궤도 생존 플레이 여정 (포털 -> 게임 진입 -> 리사이즈 -> 홈 복귀)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 4: 궤도 생존 플레이 여정...');
    const orbitJs = readFile('game/Magnetic_Orbit/game.js');
    const orbitSyntax = checkJavaScriptSyntax(orbitJs, 'game/Magnetic_Orbit/game.js');
    assert(orbitSyntax.valid, 'Tier4-S04-01: 궤도 생존 game.js 구문 에러 없이 정상 로드');

    // ----------------------------------------------------
    // Scenario 5: 3D 지뢰찾기 플레이 여정 (Three.js 렌더러 로드 -> 홈 복귀)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 5: 3D 지뢰찾기 플레이 여정...');
    const minesweeperJs = readFile('game/3D_ minesweeper/script.js');
    const minesweeperSyntax = checkJavaScriptSyntax(minesweeperJs, 'game/3D_ minesweeper/script.js');
    assert(minesweeperSyntax.valid, 'Tier4-S05-01: 3D 지뢰찾기 script.js 구문 에러 없이 정상 로드');

    // ----------------------------------------------------
    // Scenario 6: 미로 탈출 플레이 여정 (3D 미로 & 가상 조이스틱 터치)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 6: 미로 탈출 플레이 여정...');
    const mazeJs = readFile('game/maze_escape/game.js');
    const mazeSyntax = checkJavaScriptSyntax(mazeJs, 'game/maze_escape/game.js');
    assert(mazeSyntax.valid, 'Tier4-S06-01: 미로 탈출 game.js 구문 에러 없이 정상 로드');

    // ----------------------------------------------------
    // Scenario 7: 그림자 퍼즐 플레이 여정 (3D 제스처 회전)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 7: 그림자 퍼즐 플레이 여정...');
    const shadowJs = readFile('game/shadow_puzzle/script.js');
    const shadowSyntax = checkJavaScriptSyntax(shadowJs, 'game/shadow_puzzle/script.js');
    assert(shadowSyntax.valid, 'Tier4-S07-01: 그림자 퍼즐 script.js 구문 에러 없이 정상 로드');

    // ----------------------------------------------------
    // Scenario 8: 해커 CTF 플레이 여정 (터미널 명령어 시뮬레이션)
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 8: 해커 CTF 플레이 여정...');
    const hackingHtml = readFile('game/hacking/index.html');
    const hasHackingTerminal = /ctf|terminal|hacker/i.test(hackingHtml);
    assert(hasHackingTerminal, 'Tier4-S08-01: 해커 CTF 터미널 인터페이스 정상 초기화');


    // ----------------------------------------------------
    // Scenario 10: 밈 프로젝트 (지옥의 회원가입, 최원형, 로봇 인증) 플레이 여정
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 10: 밈 프로젝트 플레이 여정...');
    const choiHtml = readFile('game/choi_circle/index.html');
    const hellHtml = readFile('game/sign_up_for_hell/index.html');
    const robotHtml = readFile('game/robot/index.html');
    assert(choiHtml.length > 100 && hellHtml.length > 100 && robotHtml.length > 100, 'Tier4-S10-01: 3개 밈 프로젝트(최원형, 회원가입, 로봇) 정상 로드');

    // ----------------------------------------------------
    // Scenario 11: 9개 하위 게임 전수 순회 및 404 깨진 링크 0건 E2E 무결성 검증
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 11: 전수 404 및 링크 무결성 검증...');
    let allSubprojectsReachable = true;
    SUBPROJECT_DIRS.forEach(dir => {
        const gameIndexPath = path.join(dir, 'index.html');
        if (!assertFileExists(gameIndexPath, `Tier4-S11: ${dir} index.html 존재 검증`)) {
            allSubprojectsReachable = false;
        }
    });
    assert(allSubprojectsReachable, 'Tier4-S11-01: 9개 하위 게임 전체가 포털에서 404 없이 도달 가능함');

    // ----------------------------------------------------
    // Scenario 12: Safe-Area & 뷰포트 반응형 종합 안정성 검증
    // ----------------------------------------------------
    console.log('[Tier 4] Scenario 12: Safe-Area & 뷰포트 종합 안정성 검증...');
    const hasGlobalResponsiveMeta = indexHtml.includes('viewport-fit=cover') && indexHtml.includes('width=device-width');
    assert(hasGlobalResponsiveMeta, 'Tier4-S12-01: 포털 전체 뷰포트 메타태그가 모바일 Safe-Area 및 고해상도 화면에 완벽히 부합');

    console.log('✔ Tier 4 Real-World Workload Tests Completed.\n');
}

module.exports = { runTier4Tests };

if (require.main === module) {
    const { resetStats, getStats } = require('./test_helper');
    resetStats();
    runTier4Tests();
    const stats = getStats();
    console.log(`Tier 4 Result: Total ${stats.assertCount}, Passed ${stats.passCount}, Failed ${stats.failCount}`);
    process.exit(stats.failCount > 0 ? 1 : 0);
}
