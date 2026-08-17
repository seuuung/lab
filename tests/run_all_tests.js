/**
 * 통합 E2E 테스트 러너 (Integrated Test Runner)
 * 
 * 4-Tier Opaque-box 테스트 스위트를 순차 실행하고,
 * 각 티어별 결과 및 총 Assertion 집계 리포트를 출력합니다.
 * 
 * 사용법: node tests/run_all_tests.js
 */

const { resetStats, getStats } = require('./test_helper');
const { runTier1Tests } = require('./tier1_feature_test');
const { runTier2Tests } = require('./tier2_boundary_test');
const { runTier3Tests } = require('./tier3_pairwise_test');
const { runTier4Tests } = require('./tier4_realworld_test');

async function main() {
    console.log('===============================================================');
    console.log("  🧪 승민's 실험실 (Seungmin's Lab) 4-Tier E2E Test Suite");
    console.log('===============================================================');
    const startTime = Date.now();

    const tierResults = [];

    // --- Tier 1 ---
    resetStats();
    try {
        runTier1Tests();
    } catch (e) {
        console.error('Tier 1 Execution Error:', e);
    }
    const t1Stats = { ...getStats() };
    tierResults.push({ name: 'Tier 1: Feature Tests (기능 전수 검증)', stats: t1Stats });

    // --- Tier 2 ---
    resetStats();
    try {
        runTier2Tests();
    } catch (e) {
        console.error('Tier 2 Execution Error:', e);
    }
    const t2Stats = { ...getStats() };
    tierResults.push({ name: 'Tier 2: Boundary Tests (경계값/뷰포트/DPR)', stats: t2Stats });

    // --- Tier 3 ---
    resetStats();
    try {
        runTier3Tests();
    } catch (e) {
        console.error('Tier 3 Execution Error:', e);
    }
    const t3Stats = { ...getStats() };
    tierResults.push({ name: 'Tier 3: Pairwise Tests (결합 시나리오)', stats: t3Stats });

    // --- Tier 4 ---
    resetStats();
    try {
        runTier4Tests();
    } catch (e) {
        console.error('Tier 4 Execution Error:', e);
    }
    const t4Stats = { ...getStats() };
    tierResults.push({ name: 'Tier 4: Real-World Tests (E2E 유저 여정)', stats: t4Stats });

    const totalDurationMs = Date.now() - startTime;

    // --- 종합 리포트 출력 ---
    console.log('===============================================================');
    console.log('  📊 E2E TEST SUMMARY REPORT');
    console.log('===============================================================');

    let totalAsserts = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    tierResults.forEach((tr, idx) => {
        const { assertCount, passCount, failCount } = tr.stats;
        totalAsserts += assertCount;
        totalPassed += passCount;
        totalFailed += failCount;
        const status = failCount === 0 ? '✅ PASSED' : '❌ FAILED';
        console.log(`  [${status}] ${tr.name}`);
        console.log(`           Assertions: ${assertCount} | Passed: ${passCount} | Failed: ${failCount}`);
    });

    console.log('---------------------------------------------------------------');
    console.log(`  Total Assertions : ${totalAsserts}`);
    console.log(`  Passed           : ${totalPassed}`);
    console.log(`  Failed           : ${totalFailed}`);
    console.log(`  Duration         : ${totalDurationMs} ms`);
    console.log('===============================================================');

    if (totalFailed > 0) {
        console.log('\n❌ FAILED TEST DETAILS:');
        tierResults.forEach(tr => {
            if (tr.stats.failures.length > 0) {
                console.log(`\n--- ${tr.name} ---`);
                tr.stats.failures.forEach(f => console.log(`  - ${f.message}`));
            }
        });
        console.log('\n');
        process.exit(1);
    } else {
        console.log('\n🎉 ALL 4-TIER TESTS PASSED PERFECTLY!\n');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
});
