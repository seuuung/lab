/**
 * 승민's 실험실 E2E Test Suite Common Helper
 * 
 * Node.js 내장 모듈(fs, path, vm, assert)만을 사용하여 정적 분석, DOM 구조 파싱,
 * 런타임 스크립트 구문 및 모의 실행을 안정적으로 지원하는 테스트 프레임워크 헬퍼.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Test State
let assertCount = 0;
let passCount = 0;
let failCount = 0;
const failures = [];

function resetStats() {
    assertCount = 0;
    passCount = 0;
    failCount = 0;
    failures.length = 0;
}

function getStats() {
    return { assertCount, passCount, failCount, failures: [...failures] };
}

function assert(condition, message) {
    assertCount++;
    if (!condition) {
        failCount++;
        const err = new Error(message || 'Assertion failed');
        failures.push({ message: err.message, stack: err.stack });
        console.error(`  ❌ FAIL: ${message}`);
    } else {
        passCount++;
        // console.log(`  ✓ PASS: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    const passed = (actual === expected);
    const msg = message ? `${message} (expected: ${JSON.stringify(expected)}, actual: ${JSON.stringify(actual)})` : `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`;
    assert(passed, msg);
}

function assertMatch(actual, regex, message) {
    const passed = typeof actual === 'string' && regex.test(actual);
    const msg = message ? `${message} (matches ${regex})` : `String should match ${regex}`;
    assert(passed, msg);
}

function assertIncludes(actual, substring, message) {
    const passed = typeof actual === 'string' && actual.includes(substring);
    const msg = message ? `${message} (includes "${substring}")` : `Expected string to include "${substring}"`;
    assert(passed, msg);
}

function assertNotIncludes(actual, substring, message) {
    const passed = typeof actual === 'string' && !actual.includes(substring);
    const msg = message ? `${message} (does NOT include "${substring}")` : `Expected string NOT to include "${substring}"`;
    assert(passed, msg);
}

function assertGreaterOrEqual(actual, expected, message) {
    const passed = actual >= expected;
    const msg = message ? `${message} (${actual} >= ${expected})` : `Expected ${actual} >= ${expected}`;
    assert(passed, msg);
}

function assertFileExists(filePath, message) {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
    const exists = fs.existsSync(absPath);
    assert(exists, message || `File exists: ${filePath}`);
    return exists;
}

function readFile(filePath) {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(absPath)) {
        throw new Error(`File not found: ${absPath}`);
    }
    return fs.readFileSync(absPath, 'utf8');
}

/**
 * 정적 HTML 파싱 헬퍼 함수들
 */
function extractMetaViewport(html) {
    const match = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                  html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']viewport["'][^>]*>/i);
    return match ? match[1] : null;
}

function extractAllTags(html, tagName) {
    const regex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>|<${tagName}\\b([^>]*)\\/?>`, 'gi');
    const matches = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
        const fullMatch = m[0];
        const attributesRaw = m[1] || m[3] || '';
        const innerHTML = m[2] || '';
        
        // 속성 파싱
        const attributes = {};
        const attrRegex = /([a-zA-Z0-9_\-:@]+)(?:=["']([^"']*)["'])?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesRaw)) !== null) {
            attributes[attrMatch[1].toLowerCase()] = attrMatch[2] !== undefined ? attrMatch[2] : true;
        }
        
        matches.push({
            fullTag: fullMatch,
            attributes,
            innerHTML,
            rawAttributes: attributesRaw
        });
    }
    return matches;
}

function checkJavaScriptSyntax(jsCode, filename = 'inline.js') {
    try {
        new vm.Script(jsCode, { filename });
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

/**
 * 10개 하위 게임 디렉토리 목록
 */
const SUBPROJECT_DIRS = [
    'game/3D_ minesweeper',
    'game/Magnetic_Orbit',
    'game/choi_circle',
    'game/hacking',
    'game/maze_escape',
    'game/robot',
    'game/shadow_puzzle',
    'game/sign_up_for_hell',
    'game/slime_jump'
];

module.exports = {
    PROJECT_ROOT,
    SUBPROJECT_DIRS,
    resetStats,
    getStats,
    assert,
    assertEqual,
    assertMatch,
    assertIncludes,
    assertNotIncludes,
    assertGreaterOrEqual,
    assertFileExists,
    readFile,
    extractMetaViewport,
    extractAllTags,
    checkJavaScriptSyntax
};
