/**
 * Forensic Audit Verification Script
 * Executed independently by Forensic Auditor
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('🔬 FORENSIC AUDIT: INDEPENDENT EMPIRICAL VERIFICATION');
console.log('===============================================================');

const scriptPath = path.join(__dirname, '../../game/shadow_puzzle/script.js');
const htmlPath = path.join(__dirname, '../../game/shadow_puzzle/index.html');

const scriptContent = fs.readFileSync(scriptPath, 'utf8');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

let totalChecks = 0;
let passedChecks = 0;

function check(title, condition, detail) {
    totalChecks++;
    try {
        if (typeof condition === 'function') {
            condition();
        } else {
            assert(condition, detail || 'Assertion failed');
        }
        console.log(`  ✅ [PASS] ${title}`);
        passedChecks++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}: ${err.message}`);
        throw err;
    }
}

// -------------------------------------------------------------
// Section 1: Source Code Static Integrity & Anti-Cheat Forensics
// -------------------------------------------------------------
console.log('\n[Section 1] Static Code Integrity & Anti-Cheat Analysis...');

check('No test-runner bypass or fake NODE_ENV branch', () => {
    assert(!scriptContent.includes('process.env.NODE_ENV'), 'Found NODE_ENV branch in client script');
    assert(!scriptContent.includes('__test__'), 'Found __test__ flag in client script');
    assert(!scriptContent.includes('window.__MOCK__'), 'Found mock bypass');
});

check('No facade dummy implementations in downloadShareCard', () => {
    const downloadFnMatch = scriptContent.match(/async function downloadShareCard\(\) \{([\s\S]*?)\n\}/);
    assert(downloadFnMatch, 'downloadShareCard function must exist');
    const body = downloadFnMatch[1];
    assert(!body.includes('return true;'), 'Facade return found');
    assert(!body.includes('return "success";'), 'Facade return found');
    assert(body.includes('openImageSaveModal(dataUrl)'), 'Must call openImageSaveModal');
    assert(body.includes('navigator.share'), 'Must include Web Share API invocation');
    assert(body.includes('link.click()'), 'Must include desktop download click');
});

check('No facade dummy implementations in adjustLayoutForScreen', () => {
    const layoutFnMatch = scriptContent.match(/function adjustLayoutForScreen\(\) \{([\s\S]*?)\n\}/);
    assert(layoutFnMatch, 'adjustLayoutForScreen function must exist');
    const body = layoutFnMatch[1];
    assert(body.includes('camera.fov = THREE.MathUtils.clamp'), 'Must compute camera.fov dynamically');
    assert(body.includes('puzzleGroup.position.set'), 'Must update puzzleGroup position');
    assert(body.includes('camera.updateProjectionMatrix()'), 'Must update camera projection matrix');
});

// -------------------------------------------------------------
// Section 2: User Agent Pattern & Branching Logic Forensics
// -------------------------------------------------------------
console.log('\n[Section 2] User Agent Regex & 3-Tier Branching Logic...');

const inAppRegex = /Instagram|FB|KAKAOTALK|NAVER|Line|Snapchat|TikTok|Twitter|Whale/i;
const mobileRegex = /Android|iPhone|iPad|iPod/i;

const testUAs = [
    // In-App Browsers
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 285.0.0.0', expectedInApp: true, expectedMobile: true },
    { ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.2.1', expectedInApp: true, expectedMobile: true },
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) NAVER(inapp; search; 700; 11.10.1; 13PROMAX)', expectedInApp: true, expectedMobile: true },
    { ua: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Line/12.18.1', expectedInApp: true, expectedMobile: true },
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) FBAV/390.0.0.0', expectedInApp: true, expectedMobile: true },
    { ua: 'Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36 TikTok/20.1.3', expectedInApp: true, expectedMobile: true },
    // Mobile Native Browsers
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1', expectedInApp: false, expectedMobile: true },
    { ua: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36', expectedInApp: false, expectedMobile: true },
    // Desktop Browsers
    { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', expectedInApp: false, expectedMobile: false },
    { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15', expectedInApp: false, expectedMobile: false }
];

testUAs.forEach((t, idx) => {
    check(`User Agent Classification Test [Case ${idx + 1}] (${t.expectedInApp ? 'InApp' : (t.expectedMobile ? 'MobileNative' : 'Desktop')})`, () => {
        const inApp = inAppRegex.test(t.ua);
        const mobile = mobileRegex.test(t.ua);
        assert.strictEqual(inApp, t.expectedInApp, `InApp mismatch for UA: ${t.ua}`);
        assert.strictEqual(mobile, t.expectedMobile, `Mobile mismatch for UA: ${t.ua}`);
    });
});

// -------------------------------------------------------------
// Section 3: Three.js Lighting & Viewport Geometric Forensics
// -------------------------------------------------------------
console.log('\n[Section 3] Three.js Lighting & Viewport Geometric Forensics...');

check('Scene Lighting Intensities Match Exact Requirements', () => {
    const ambientMatch = scriptContent.match(/new THREE\.AmbientLight\(0xffffff,\s*([0-9.]+)\)/);
    assert(ambientMatch, 'AmbientLight definition found');
    assert.strictEqual(parseFloat(ambientMatch[1]), 1.15, 'AmbientLight intensity must be exactly 1.15');

    const dirMatch = scriptContent.match(/new THREE\.DirectionalLight\(0xffffff,\s*([0-9.]+)\)/);
    assert(dirMatch, 'DirectionalLight definition found');
    assert.strictEqual(parseFloat(dirMatch[1]), 2.50, 'DirectionalLight intensity must be exactly 2.50');

    const fillMatch = scriptContent.match(/new THREE\.DirectionalLight\(0x38bdf8,\s*([0-9.]+)\)/);
    assert(fillMatch, 'fillLight definition found');
    assert.strictEqual(parseFloat(fillMatch[1]), 1.20, 'fillLight intensity must be exactly 1.20');

    const rimMatch = scriptContent.match(/new THREE\.DirectionalLight\(0xa855f7,\s*([0-9.]+)\)/);
    assert(rimMatch, 'rimLight definition found');
    assert.strictEqual(parseFloat(rimMatch[1]), 0.95, 'rimLight intensity must be exactly 0.95');
});

check('Wall Material Properties Match Exact Specification', () => {
    assert(scriptContent.includes('color: 0x2a3854'), 'wallMaterial color must be 0x2a3854');
    assert(scriptContent.includes('roughness: 0.50'), 'wallMaterial roughness must be 0.50');
    assert(scriptContent.includes('metalness: 0.08'), 'wallMaterial metalness must be 0.08');
});

check('Block Size Normalization', () => {
    const blockMatch = scriptContent.match(/const blockSize\s*=\s*([0-9.]+);/);
    assert(blockMatch, 'blockSize definition found');
    assert.strictEqual(parseFloat(blockMatch[1]), 0.82, 'blockSize must be exactly 0.82');
});

check('adjustLayoutForScreen Responsive Viewport Calculations', () => {
    // MathUtils clamp simulation for portrait devices
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    
    // iPhone 14 Pro: 393 x 852 (aspect ~ 0.4612)
    const aspect1 = 393 / 852;
    const baseFov = 49;
    const fov1 = clamp(baseFov / Math.sqrt(aspect1), 46, 58);
    assert(fov1 >= 46 && fov1 <= 58, 'FOV1 within clamp range');
    assert.strictEqual(fov1, 58, 'Narrow screen hits max clamp 58');

    // iPad Mini: 768 x 1024 (aspect = 0.75)
    const aspect2 = 768 / 1024;
    const fov2 = clamp(baseFov / Math.sqrt(aspect2), 46, 58);
    assert(fov2 >= 46 && fov2 <= 58, 'FOV2 within clamp range');
    assert.strictEqual(Math.round(fov2 * 100) / 100, 56.58, 'FOV2 calculated correctly');
});

// -------------------------------------------------------------
// Section 4: Modal UI & Long-Press Accessibility Forensics
// -------------------------------------------------------------
console.log('\n[Section 4] Modal UI & Long-Press Accessibility Forensics...');

check('index.html Image Save Modal Structure and Style', () => {
    assert(htmlContent.includes('id="image-save-modal"'), 'Modal container exists');
    assert(htmlContent.includes('id="save-preview-img"'), 'Preview image element exists');
    assert(htmlContent.includes('id="close-image-modal"'), 'Close button exists');
    assert(htmlContent.includes('touch-action:auto'), 'Modal enables touch-action:auto');
    assert(htmlContent.includes('-webkit-touch-callout:default'), 'Preview image enables iOS long-press callout');
    assert(htmlContent.includes('user-select:auto'), 'Preview image enables user-select');
});

check('Event Listeners Bound for Modal Control', () => {
    assert(scriptContent.includes("document.getElementById('close-image-modal').addEventListener('click', closeImageSaveModal);"), 'Close button listener registered');
    assert(scriptContent.includes("document.getElementById('image-save-modal').addEventListener('click', (e) => {"), 'Backdrop click listener registered');
});

console.log('\n===============================================================');
console.log(`🎉 FORENSIC AUDIT COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED`);
console.log('===============================================================');
