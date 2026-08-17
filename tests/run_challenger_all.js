/**
 * ⚔️ MASTER CHALLENGER 2 RUNNER
 * 
 * Executes all 3 challenger test suites:
 *  1. Canvas & WebGL DPR Scaling & 100x Resize Stress Suite
 *  2. Adversarial Fuzzing & Static Analysis Suite
 *  3. Navigation Loop & Cross-Link Integrity Suite
 */

const { execSync } = require('child_process');
const path = require('path');

const suites = [
    { name: 'Canvas & WebGL DPR / Resize Matrix', file: 'tests/challenge_dpr_resize_matrix.js' },
    { name: 'Navigation Loop & Cross-Link Integrity', file: 'tests/challenge_navigation_integrity.js' },
    { name: 'Adversarial Fuzzing & Static Analysis', file: 'tests/challenge_fuzzing_static_analysis.js' }
];

console.log('===============================================================');
console.log('🚀 RUNNING ALL CHALLENGER 2 VERIFICATION SUITES');
console.log('===============================================================\n');

let allPassed = true;

suites.forEach((suite, idx) => {
    console.log(`\n---------------------------------------------------------------`);
    console.log(`[${idx + 1}/${suites.length}] Running Suite: ${suite.name}`);
    console.log(`---------------------------------------------------------------`);
    try {
        const out = execSync(`node "${suite.file}"`, { stdio: 'inherit' });
    } catch (e) {
        allPassed = false;
        console.error(`❌ Suite Failed: ${suite.name}`);
    }
});

console.log('\n===============================================================');
if (allPassed) {
    console.log('🎉 ALL CHALLENGER 2 SUITES PASSED! VERDICT: APPROVE');
} else {
    console.log('⚠️ SOME SUITES REPORTED ADVERSARIAL FINDINGS.');
}
console.log('===============================================================\n');
