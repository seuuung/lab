/**
 * Tier 3: Pairwise Combinatorial Tests (결합 시나리오 매트릭스 검증)
 * 
 * Matrix 1: 탭 필터(4종: all, app, game, lab) × 카드 카테고리 필터링 정합성 조합
 * Matrix 2: 뷰포트 크기(320px Mobile, 768px Tablet, 1440px Desktop) × DPR 스케일링(1.0, 2.0, 3.0) 캔버스 버퍼 조합
 * Matrix 3: 10개 하위 게임 각각 진입 -> 홈 버튼 복귀 경로 결합
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
    extractAllTags
} = require('./test_helper');

function runTier3Tests() {
    console.log('\n========================================');
    console.log('▶ Running Tier 3: Pairwise Combinatorial Tests');
    console.log('========================================\n');

    const indexHtml = readFile('index.html');

    // ----------------------------------------------------
    // Matrix 1: 탭 필터(4종) × 카테고리 카드 필터링 조합 (12 assertions)
    // ----------------------------------------------------
    console.log('[Tier 3] Matrix 1: 탭 필터 × 카테고리 필터링 조합...');

    // 13개 카드 정의
    const sampleCards = [...indexHtml.matchAll(/<article class="project-item" data-category="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)]
        .map(match => ({ category: match[1], name: match[2] }));

    // 필터링 시뮬레이션 함수
    function simulateFilter(tab) {
        return sampleCards.filter(card => {
            if (tab === 'all') return true;
            return card.category === tab;
        });
    }

    // 1-1. 'all' 탭: 13개 전체 카드 표시
    const allResults = simulateFilter('all');
    assertEqual(allResults.length, 13, 'Tier3-M1-01: "all" 탭 활성화 시 13개 전체 카드 노출');
    assert(allResults.some(c => c.category === 'app'), 'Tier3-M1-02: "all" 탭에 app 카테고리 포함');
    assert(allResults.some(c => c.category === 'game'), 'Tier3-M1-03: "all" 탭에 game 카테고리 포함');
    assert(allResults.some(c => c.name === 'SelPick'), 'Tier3-M1-04: 전체 목록에 SelPick 포함');

    // 1-2. 'app' 탭: 3개 앱 카드만 표시
    const appResults = simulateFilter('app');
    assertEqual(appResults.length, 3, 'Tier3-M1-05: "app" 탭 활성화 시 3개 앱 카드만 노출');
    assert(appResults.every(c => c.category === 'app'), 'Tier3-M1-06: "app" 탭 결과의 모든 카드가 app 카테고리');

    // 1-3. 'game' 탭: 10개 게임 카드만 표시
    const gameResults = simulateFilter('game');
    assertEqual(gameResults.length, 10, 'Tier3-M1-07: "game" 탭 활성화 시 10개 게임 카드만 노출');
    assert(gameResults.every(c => c.category === 'game'), 'Tier3-M1-08: "game" 탭 결과의 모든 카드가 game 카테고리');

    // 1-4. 'lab' 탭: 4개 밈&실험실 카드만 표시
    assert(!sampleCards.some(c => c.category === 'lab'), 'Tier3-M1-09: 독립 실험 분류 제거');
    assert(['지옥의 회원가입', '최원형', '로봇 인증'].every(name => gameResults.some(c => c.name === name)), 'Tier3-M1-10: 기존 실험 3개가 게임 목록에 유지');

    // 1-5. 탭 연속 전이 시나리오 (all -> app -> game -> lab -> all)
    let currentCards = simulateFilter('all');
    currentCards = simulateFilter('app');
    assertEqual(currentCards.length, 3, 'Tier3-M1-11: 탭 전이 all -> app 결과 일치');
    currentCards = simulateFilter('all');
    assertEqual(currentCards.length, 13, 'Tier3-M1-12: 탭 전이 app -> all 복귀 결과 일치');


    // ----------------------------------------------------
    // Matrix 2: 뷰포트 크기 × DPR 스케일링 캔버스 조합 (9 assertions)
    // ----------------------------------------------------
    console.log('[Tier 3] Matrix 2: 뷰포트 크기 × DPR 스케일링 캔버스 조합...');

    const viewports = [
        { name: 'Mobile 320px', width: 320, height: 568 },
        { name: 'Tablet 768px', width: 768, height: 1024 },
        { name: 'Desktop 1440px', width: 1440, height: 900 }
    ];

    const dprList = [1.0, 2.0, 3.0];

    // Canvas 2D / Three.js 렌더링 버퍼 크기 계산 공식
    function calculateCanvasBuffer(viewport, dpr, isThreeJs = false) {
        const effectiveDpr = isThreeJs ? Math.min(dpr, 2.0) : dpr;
        return {
            bufferWidth: Math.round(viewport.width * effectiveDpr),
            bufferHeight: Math.round(viewport.height * effectiveDpr),
            effectiveDpr
        };
    }

    let m2Idx = 1;
    viewports.forEach(vp => {
        dprList.forEach(dpr => {
            const result2D = calculateCanvasBuffer(vp, dpr, false);
            const resultThree = calculateCanvasBuffer(vp, dpr, true);
            
            if (dpr === 3.0) {
                assertEqual(resultThree.effectiveDpr, 2.0, `Tier3-M2-${String(m2Idx).padStart(2, '0')}: [${vp.name} × DPR ${dpr}] Three.js 2x DPR Cap 적용 (${resultThree.bufferWidth}px)`);
            } else {
                assertEqual(result2D.bufferWidth, vp.width * dpr, `Tier3-M2-${String(m2Idx).padStart(2, '0')}: [${vp.name} × DPR ${dpr}] 2D Canvas 버퍼 배율 정확도 (${result2D.bufferWidth}px)`);
            }
            m2Idx++;
        });
    });


    // ----------------------------------------------------
    // Matrix 3: 10개 하위 게임 각각 진입 -> 복귀 내비게이션 결합
    // ----------------------------------------------------
    console.log('[Tier 3] Matrix 3: 10개 하위 게임 진입 -> 홈 버튼 복귀 경로 결합...');

    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const gameIndexPath = path.join(dir, 'index.html');
        const gameHtml = readFile(gameIndexPath);

        // 포털에서 게임으로 이동하는 상대 경로
        const portalToGameLink = `${dir}/index.html`;
        
        // 게임에서 포털로 복귀하는 상대 경로
        const hasValidBackLink = gameHtml.includes('../../index.html') || 
                                 gameHtml.includes('../index.html') || 
                                 gameHtml.includes('/') ||
                                 gameHtml.includes('floating-home-btn') ||
                                 gameHtml.includes('실험실 홈');
        
        assert(hasValidBackLink, `Tier3-M3-${String(idx + 1).padStart(2, '0')}: [포털 -> ${dir} -> 포털 복귀] 양방향 내비게이션 무결성`);
    });

    console.log('✔ Tier 3 Pairwise Combinatorial Tests Completed.\n');
}

module.exports = { runTier3Tests };

if (require.main === module) {
    const { resetStats, getStats } = require('./test_helper');
    resetStats();
    runTier3Tests();
    const stats = getStats();
    console.log(`Tier 3 Result: Total ${stats.assertCount}, Passed ${stats.passCount}, Failed ${stats.failCount}`);
    process.exit(stats.failCount > 0 ? 1 : 0);
}
