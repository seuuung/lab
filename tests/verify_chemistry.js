const fs = require('fs');

// Read script.js and extract animalTypes
const js = fs.readFileSync('game/shadow_puzzle/script.js', 'utf8');

// Evaluate animalTypes safely
const match = js.match(/const animalTypes = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('animalTypes not found');
    process.exit(1);
}

const animalTypes = eval(match[1]);

console.log('=== SPTI 8 ANIMAL TYPES CHEMISTRY MATRIX CHECK ===\n');

let allValid = true;

animalTypes.forEach(t => {
    // 1. Check if goodMatch exists
    const goodTarget = animalTypes.find(a => t.goodMatch.includes(a.emoji));
    const badTarget = animalTypes.find(a => t.badMatch.includes(a.emoji));
    
    const goodValid = !!goodTarget;
    const badValid = !!badTarget;
    
    if (!goodValid || !badValid) allValid = false;
    
    // Check mutual symmetry
    const isGoodMutual = goodTarget && goodTarget.goodMatch.includes(t.emoji);
    const isBadMutual = badTarget && badTarget.badMatch.includes(t.emoji);
    
    console.log(`[${t.emoji} ${t.name}]`);
    console.log(`  🤝 환상의 짝꿍: ${t.goodMatch} -> ${goodTarget ? (isGoodMutual ? '✅ 상호 일치' : '➡️ 편도 연결 (' + goodTarget.name + '의 짝꿍은 ' + goodTarget.goodMatch + ')') : '❌ 존재하지 않음'}`);
    console.log(`  💔 환장의 짝꿍: ${t.badMatch} -> ${badTarget ? (isBadMutual ? '✅ 상호 일치' : '➡️ 편도 연결 (' + badTarget.name + '의 짝꿍은 ' + badTarget.badMatch + ')') : '❌ 존재하지 않음'}`);
    console.log('');
});

console.log('All targets exist in 8 types:', allValid ? '✅ PASS' : '❌ FAIL');
