// ============================================================================
// SPTI 유형 분포 및 점수 밸런스 종합 검증 스크립트
// ============================================================================
const fs = require('fs');
const path = require('path');

const jsContent = fs.readFileSync(path.resolve(__dirname, '../game/shadow_puzzle/script.js'), 'utf8');
const extractFn = new Function(`
    ${jsContent.substring(jsContent.indexOf('const levels ='), jsContent.indexOf('// --- 3. 사운드'))}
    return { levels, animalTypes, determineAnimalType };
`);
const { levels, animalTypes, determineAnimalType } = extractFn();

let hasError = false;

// ─── A. 점수 밸런스 검증 ───────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  A. 8대 유형 4개 능력치 점수 분포 검증');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const statFields = ['speed', 'spatial', 'precision', 'focus'];
const statLabels = { speed: '⚡순발력', spatial: '🧭공간지각', precision: '🎯정밀도', focus: '🧠집중도' };

const allScores = [];
animalTypes.forEach(t => {
    statFields.forEach(f => allScores.push(t.stats[f]));
});

// 헤더
process.stdout.write(`${'유형'.padEnd(16)}  `);
statFields.forEach(f => process.stdout.write(` ${statLabels[f].padEnd(8)}`));
console.log('  | 평균   최소   최대');

animalTypes.forEach(t => {
    const scores = statFields.map(f => t.stats[f]);
    const avg = (scores.reduce((a,b)=>a+b,0)/4).toFixed(1);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    process.stdout.write(`${(t.emoji+' '+t.name).padEnd(18)}`);
    scores.forEach(s => process.stdout.write(`  ${String(s).padStart(4)}   `));
    console.log(` | ${avg.padStart(5)}  ${String(min).padStart(4)}  ${String(max).padStart(4)}`);

    // 범위 이상치 감지
    scores.forEach((s, i) => {
        if (s < 70) {
            console.log(`  ⚠️  ${t.name}의 ${statLabels[statFields[i]]}(${s})이 70 미만 — 지나치게 낮음`);
            hasError = true;
        }
        if (s > 99) {
            console.log(`  ⚠️  ${t.name}의 ${statLabels[statFields[i]]}(${s})이 99 초과 — 지나치게 높음`);
            hasError = true;
        }
    });
});

const globalAvg = (allScores.reduce((a,b)=>a+b,0)/allScores.length).toFixed(1);
const globalMin = Math.min(...allScores);
const globalMax = Math.max(...allScores);
console.log('─'.repeat(62));
console.log(`전체 평균: ${globalAvg}  전체 최솟값: ${globalMin}  전체 최댓값: ${globalMax}`);

// 같은 능력치가 모든 유형에서 극단적으로 높거나 낮은지 체크
statFields.forEach(f => {
    const vals = animalTypes.map(t => t.stats[f]);
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const spread = mx - mn;
    const tag = spread < 5 ? '  ⚠️  변별력 부족 (편차 < 5)' : spread > 30 ? '  ⚠️  과도한 편차 (> 30)' : '  ✔';
    console.log(`  ${statLabels[f].padEnd(10)}: 평균 ${avg.toFixed(1).padStart(5)}  편차 ${String(spread).padStart(3)}${tag}`);
    if (spread < 5 || spread > 30) hasError = true;
});

// ─── B. 유형 분포 시뮬레이션 ─────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  B. 10,000명 몬테카를로 플레이어 유형 분포 시뮬레이션');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const N = 10000;
const counts = {};
animalTypes.forEach(t => counts[t.id] = 0);

function randomNormal(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std + mean;
}

// 3세그먼트 모델: 스피드형 25% / 표준형 50% / 신중형 25%
for (let i = 0; i < N; i++) {
    const seg = Math.random();
    let secPerLevel, rotPerLevel;

    if (seg < 0.25) {
        secPerLevel = Math.max(2.0, randomNormal(5.2, 1.3));
        rotPerLevel = Math.max(3.0, randomNormal(11.5, 4.0));
    } else if (seg < 0.75) {
        secPerLevel = Math.max(5.0, randomNormal(10.0, 2.5));
        rotPerLevel = Math.max(4.0, randomNormal(12.0, 4.0));
    } else {
        secPerLevel = Math.max(11.0, randomNormal(16.5, 3.5));
        rotPerLevel = Math.max(5.0, randomNormal(14.5, 4.5));
    }
    const type = determineAnimalType(secPerLevel * 13, Math.round(rotPerLevel * 13));
    counts[type.id]++;
}

let allInRange = true;
animalTypes.forEach(t => {
    const cnt = counts[t.id];
    const pct = ((cnt / N) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 1.5));
    const warn = cnt < N * 0.04 ? '  ⚠️  < 4% 편중 주의' : cnt > N * 0.30 ? '  ⚠️  > 30% 독점 주의' : '';
    if (warn) { allInRange = false; hasError = true; }
    console.log(`  ${t.emoji} ${t.name.padEnd(12)} : ${String(cnt).padStart(5)}회 (${String(pct).padStart(5)}%)  ${bar}${warn}`);
});

// ─── C. 결정론적 8유형 도달 검증 ─────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  C. 결정론적 8유형 1:1 도달 가능성 검증');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const probes = [
    { label: 'Fast+LowRot',     s: 4.0*13, r: 5*13,  expect: 'cheetah' },
    { label: 'Normal+LowRot',   s: 9.5*13, r: 6*13,  expect: 'owl'     },
    { label: 'Fast+HighRot',    s: 5.0*13, r: 16*13, expect: 'hawk'    },
    { label: 'Normal+HighRot',  s: 9.5*13, r: 17*13, expect: 'fox'     },
    { label: 'Deep+LowRot',     s: 17.0*13,r: 6*13,  expect: 'turtle'  },
    { label: 'Deep+HighRot',    s: 17.0*13,r: 17*13, expect: 'dolphin' },
    { label: 'Normal+MedRot',   s: 9.5*13, r: 11*13, expect: 'wolf'    },
    { label: 'Fast+MedRot',     s: 5.0*13, r: 11*13, expect: 'lion'    },
];

probes.forEach(p => {
    const result = determineAnimalType(p.s, p.r);
    const ok = result.id === p.expect;
    if (!ok) hasError = true;
    console.log(`  ${ok ? '✔' : '✘'} ${p.label.padEnd(18)} → ${result.emoji} ${result.name.padEnd(12)} (기대: ${p.expect})`);
});

// ─── 종합 결론 ──────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasError) {
    console.log('  ⚠️  일부 검증 항목에서 문제가 감지되었습니다. 위 내용 확인 후 조정 필요.');
} else {
    console.log('  ✅ 모든 검증 통과 — 유형 분포 및 점수 밸런스 모두 정상 범위 내');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
