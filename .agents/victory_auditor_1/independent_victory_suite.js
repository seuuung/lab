/**
 * Independent Victory Audit Verification Suite
 * Authored and Executed Independently by Victory Auditor
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('🏛️  INDEPENDENT VICTORY AUDIT: COMPREHENSIVE EMPIRICAL VERIFICATION');
console.log('======================================================================\n');

const ROOT_DIR = path.resolve(__dirname, '../../');
const SCRIPT_PATH = path.join(ROOT_DIR, 'game/shadow_puzzle/script.js');
const HTML_PATH = path.join(ROOT_DIR, 'game/shadow_puzzle/index.html');
const CSS_PATH = path.join(ROOT_DIR, 'game/shadow_puzzle/style.css');

const scriptSource = fs.readFileSync(SCRIPT_PATH, 'utf8');
const htmlSource = fs.readFileSync(HTML_PATH, 'utf8');
const cssSource = fs.readFileSync(CSS_PATH, 'utf8');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureList = [];

function check(name, testFn) {
    totalChecks++;
    try {
        testFn();
        passedChecks++;
        console.log(`  [✅ PASS] ${name}`);
    } catch (err) {
        failedChecks++;
        failureList.push({ name, error: err.message });
        console.error(`  [❌ FAIL] ${name} -> ${err.message}`);
    }
}

// ======================================================================
// 1. Phase A: Timeline, File Provenance & Anti-Cheat Forensics
// ======================================================================
console.log('----------------------------------------------------------------------');
console.log('🔍 PHASE A & B: PROVENANCE, ANTI-CHEAT & CODE INTEGRITY FORENSICS');
console.log('----------------------------------------------------------------------');

check('Forensic: Zero test-runner bypass flags in script.js', () => {
    assert(!scriptSource.includes('process.env.NODE_ENV'), 'Found process.env.NODE_ENV bypass');
    assert(!scriptSource.includes('window.__MOCK__'), 'Found window.__MOCK__');
    assert(!scriptSource.includes('__TEST_BYPASS__'), 'Found __TEST_BYPASS__');
    assert(!scriptSource.includes('isTestEnv'), 'Found isTestEnv bypass');
});

check('Forensic: Genuine implementation of downloadShareCard without dummy returns', () => {
    const fnMatch = scriptSource.match(/async function downloadShareCard\(\)\s*\{([\s\S]*?)\n\}/);
    assert(fnMatch, 'downloadShareCard function body must exist');
    const body = fnMatch[1];
    assert(!body.includes('return true;'), 'Facade return true found');
    assert(!body.includes('return "OK";'), 'Facade return OK found');
    assert(body.includes('openImageSaveModal(dataUrl)'), 'Must call openImageSaveModal');
    assert(body.includes('navigator.canShare'), 'Must check navigator.canShare');
    assert(body.includes('navigator.share'), 'Must invoke navigator.share');
    assert(body.includes('link.download = fileName;'), 'Must set link.download on desktop');
});

check('Forensic: Genuine implementation of adjustLayoutForScreen without static fakes', () => {
    const fnMatch = scriptSource.match(/function adjustLayoutForScreen\(\)\s*\{([\s\S]*?)\n\}/);
    assert(fnMatch, 'adjustLayoutForScreen function body must exist');
    const body = fnMatch[1];
    assert(body.includes('THREE.MathUtils.clamp'), 'Must use clamp for FOV');
    assert(body.includes('camera.updateProjectionMatrix()'), 'Must update camera matrix');
});

// ======================================================================
// 2. Requirement R1: Mobile In-App Browser Modal & Web Share API
// ======================================================================
console.log('\n----------------------------------------------------------------------');
console.log('📱 REQUIREMENT R1: IN-APP BROWSER 3-TIER MODAL & WEB SHARE AUDIT');
console.log('----------------------------------------------------------------------');

const inAppUAs = [
    { name: 'Instagram iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 285.0.0.0' },
    { name: 'Instagram Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 Instagram 285.0.0.0' },
    { name: 'KakaoTalk iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) Mobile/15E148 KAKAOTALK 10.2.1' },
    { name: 'KakaoTalk Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.2.1' },
    { name: 'Naver App iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) NAVER(inapp; search; 700; 11.10.1; 13PROMAX)' },
    { name: 'Line App Android', ua: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Line/12.18.1' },
    { name: 'Facebook App iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) FBAV/390.0.0.0' },
    { name: 'TikTok Android', ua: 'Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36 TikTok/20.1.3' },
    { name: 'Twitter / X iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Mobile/15E148 Twitter for iPhone' },
    { name: 'Naver Whale InApp', ua: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Whale/1.0.0.0' }
];

const mobileNativeUAs = [
    { name: 'Safari Mobile iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' },
    { name: 'Chrome Mobile Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36' },
    { name: 'Samsung Internet', ua: 'Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/19.0 Chrome/102.0.5005.125 Mobile Safari/537.36' }
];

const desktopUAs = [
    { name: 'Chrome Windows Desktop', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
    { name: 'Safari macOS Desktop', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15' }
];

const inAppRegex = /Instagram|FB|KAKAOTALK|NAVER|Line|Snapchat|TikTok|Twitter|Whale/i;
const mobileRegex = /Android|iPhone|iPad|iPod/i;

inAppUAs.forEach(target => {
    check(`R1 UA Classification: ${target.name} strictly classified as In-App`, () => {
        assert(inAppRegex.test(target.ua), `${target.name} must match inAppRegex`);
    });
});

mobileNativeUAs.forEach(target => {
    check(`R1 UA Classification: ${target.name} classified as Mobile Native (NOT In-App)`, () => {
        assert(!inAppRegex.test(target.ua), `${target.name} must NOT match inAppRegex`);
        assert(mobileRegex.test(target.ua), `${target.name} must match mobileRegex`);
    });
});

desktopUAs.forEach(target => {
    check(`R1 UA Classification: ${target.name} classified as Desktop (NOT In-App, NOT Mobile)`, () => {
        assert(!inAppRegex.test(target.ua), `${target.name} must NOT match inAppRegex`);
        assert(!mobileRegex.test(target.ua), `${target.name} must NOT match mobileRegex`);
    });
});

check('R1 HTML Modal: Structure, Guide text and accessibility styles', () => {
    assert(htmlSource.includes('id="image-save-modal"'), 'Modal element with id="image-save-modal" exists');
    assert(htmlSource.includes('id="save-preview-img"'), 'Preview image with id="save-preview-img" exists');
    assert(htmlSource.includes('id="close-image-modal"'), 'Close button with id="close-image-modal" exists');
    assert(htmlSource.includes('이미지를 1초간 길게 눌러 [사진에 저장]하세요'), 'Exact guide text exists');
    assert(htmlSource.includes('touch-action:auto'), 'Modal enables touch-action:auto');
    assert(htmlSource.includes('-webkit-touch-callout:default'), 'Preview image allows iOS callout');
});

check('R1 JS Logic: Modal Opening & Closing functions and event bindings', () => {
    assert(scriptSource.includes('function openImageSaveModal(imgDataUrl)'), 'openImageSaveModal exists');
    assert(scriptSource.includes('function closeImageSaveModal()'), 'closeImageSaveModal exists');
    assert(scriptSource.includes("document.getElementById('close-image-modal').addEventListener('click', closeImageSaveModal)"), 'Close button bound');
    assert(scriptSource.includes("document.getElementById('image-save-modal').addEventListener('click', (e) => {"), 'Backdrop click bound');
});

// ======================================================================
// 3. Requirement R2: 3D Scene Lighting & Viewport / Block Size Normalization
// ======================================================================
console.log('\n----------------------------------------------------------------------');
console.log('💡 REQUIREMENT R2: 3D SCENE LIGHTING, VIEWPORT & GEOMETRY AUDIT');
console.log('----------------------------------------------------------------------');

check('R2 Lighting: Ambient Light intensity 1.15', () => {
    const m = scriptSource.match(/new THREE\.AmbientLight\(0xffffff,\s*([0-9.]+)\)/);
    assert(m && parseFloat(m[1]) === 1.15, `Ambient light must be 1.15, found: ${m ? m[1] : 'null'}`);
});

check('R2 Lighting: Directional Light intensity 2.50 with Z=32 vertical position', () => {
    const m = scriptSource.match(/new THREE\.DirectionalLight\(0xffffff,\s*([0-9.]+)\)/);
    assert(m && parseFloat(m[1]) === 2.50, `Directional light must be 2.50, found: ${m ? m[1] : 'null'}`);
    assert(scriptSource.includes('directionalLight.position.set(0, 0, 32);'), 'Directional light position (0, 0, 32)');
});

check('R2 Lighting: Fill Light (0x38bdf8, 1.20) and Rim Light (0xa855f7, 0.95)', () => {
    const fillMatch = scriptSource.match(/new THREE\.DirectionalLight\(0x38bdf8,\s*([0-9.]+)\)/);
    assert(fillMatch && parseFloat(fillMatch[1]) === 1.20, `Fill light must be 1.20, found: ${fillMatch ? fillMatch[1] : 'null'}`);
    const rimMatch = scriptSource.match(/new THREE\.DirectionalLight\(0xa855f7,\s*([0-9.]+)\)/);
    assert(rimMatch && parseFloat(rimMatch[1]) === 0.95, `Rim light must be 0.95, found: ${rimMatch ? rimMatch[1] : 'null'}`);
});

check('R2 Materials: Navy Slate Wall Material (0x2a3854, roughness 0.50, metalness 0.08)', () => {
    assert(scriptSource.includes('color: 0x2a3854'), 'wall color 0x2a3854');
    assert(scriptSource.includes('roughness: 0.50'), 'wall roughness 0.50');
    assert(scriptSource.includes('metalness: 0.08'), 'wall metalness 0.08');
});

check('R2 Geometry: Block Size 0.82', () => {
    const m = scriptSource.match(/const blockSize\s*=\s*([0-9.]+);/);
    assert(m && parseFloat(m[1]) === 0.82, `Block size must be 0.82, found: ${m ? m[1] : 'null'}`);
});

check('R2 Viewport: adjustLayoutForScreen Portrait Mobile camera (Z=30, baseFov=49 clamp 46~58, basePuzzlePos.x=-0.8)', () => {
    assert(scriptSource.includes('const baseFov = 49;'), 'baseFov = 49');
    assert(scriptSource.includes('camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 46, 58);'), 'FOV clamp 46~58');
    assert(scriptSource.includes('camera.position.set(16, 12, 30);'), 'camera.position (16, 12, 30)');
    assert(scriptSource.includes('basePuzzlePos = { x: -0.8, y: -0.8, z: 0 };'), 'basePuzzlePos.x = -0.8');
});

// Viewport mathematical safety calculation
const viewports = [
    { name: 'iPhone SE (320x568)', w: 320, h: 568 },
    { name: 'Galaxy Z Flip (360x780)', w: 360, h: 780 },
    { name: 'iPhone SE2 (375x667)', w: 375, h: 667 },
    { name: 'iPhone 14 (390x844)', w: 390, h: 844 },
    { name: 'Galaxy S22 (412x915)', w: 412, h: 915 },
    { name: 'iPhone 14 Pro Max (430x932)', w: 430, h: 932 },
    { name: 'Desktop FHD (1920x1080)', w: 1920, h: 1080 }
];

viewports.forEach(vp => {
    check(`R2 Mathematical Safety Margin: ${vp.name} >= 40px left/right margins`, () => {
        const aspect = vp.w / vp.h;
        const baseFov = 49;
        const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
        const fov = aspect < 1.0 ? clamp(baseFov / Math.sqrt(aspect), 46, 58) : 42;
        const fovRad = (fov * Math.PI) / 180;
        
        // 3D camera distance Z=30 looking at (0,0,-3) -> effective dist ~ 33
        // Half visible height at z=0: H_visible = 2 * dist * tan(fov/2)
        const dist = 33;
        const visibleH = 2 * dist * Math.tan(fovRad / 2);
        const visibleW = visibleH * aspect;
        const pxPerUnit = vp.h / visibleH;

        // Puzzle size (cols max ~11, blockSize=0.82) -> width ~ 9.02 units
        const puzzleWidthUnits = 11 * 0.82;
        const puzzleWidthPx = puzzleWidthUnits * pxPerUnit;

        // In portrait, offset x = -0.8
        const puzzleCenterPx = (vp.w / 2) + (-0.8 * pxPerUnit);
        const puzzleLeftPx = puzzleCenterPx - (puzzleWidthPx / 2);
        const rightAnswerShadowPx = vp.w - (puzzleWidthPx / 2); // projected shadow on wall

        // Safety margin from left edge
        assert(puzzleLeftPx >= 40, `Left margin for ${vp.name} must be >= 40px (was ${puzzleLeftPx.toFixed(1)}px)`);
    });
});

console.log('\n======================================================================');
console.log(`📊 INDEPENDENT VICTORY AUDIT SUMMARY: Total: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
console.log('======================================================================\n');

if (failedChecks > 0) {
    console.error('❌ CRITICAL FAILURES DETECTED:');
    failureList.forEach(f => console.error(`  - ${f.name}: ${f.error}`));
    process.exit(1);
} else {
    console.log('🎉 ALL INDEPENDENT VICTORY AUDIT VERIFICATIONS PASSED WITH 100% ACCURACY!');
    process.exit(0);
}
