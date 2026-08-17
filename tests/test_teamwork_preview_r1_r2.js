const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('🧪 R1 & R2 Dedicated Implementation Verification Test');
console.log('===============================================================');

// 1. Check script.js content
const scriptPath = path.join(__dirname, '../game/shadow_puzzle/script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

const htmlPath = path.join(__dirname, '../game/shadow_puzzle/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// --- R1 Check ---
console.log('\n[R1] Checking In-App Modal & Web Share Branching...');

// isInApp regex check
assert(scriptContent.includes('const isInApp = /Instagram|FB|KAKAOTALK|NAVER|Line|Snapchat|TikTok|Twitter|Whale/i.test(ua);'), 'isInApp regex must match specification');
console.log('✔ isInApp regex verified.');

// isMobile regex check
assert(scriptContent.includes('const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);'), 'isMobile regex must match specification');
console.log('✔ isMobile regex verified.');

// 1단계: openImageSaveModal(dataUrl) immediate call on isInApp
assert(scriptContent.includes('if (isInApp) {\n        openImageSaveModal(dataUrl);\n        return;\n    }'), 'isInApp branch must immediately open modal');
console.log('✔ 1단계 isInApp branch verified.');

// 2단계: Web Share API call & AbortError quiet handling & modal fallback
assert(scriptContent.includes('if (navigator.canShare && typeof navigator.canShare === \'function\' && navigator.canShare({ files: [file] }))'), 'Web Share API check verified.');
assert(scriptContent.includes('if (shareErr.name === \'AbortError\') {\n                            return;\n                        }'), 'AbortError handling verified.');
console.log('✔ 2단계 isMobile Web Share API & AbortError verified.');

// 3단계: Desktop direct download & toast
assert(scriptContent.includes('link.download = fileName;'), 'Desktop download attribute verified.');
assert(scriptContent.includes('showShareStatus(\'💾 진단서 이미지가 다운로드되었습니다.\');'), 'Desktop download toast verified.');
console.log('✔ 3단계 Desktop download & toast verified.');

// HTML touch styles
assert(htmlContent.includes('id="image-save-modal" class="fixed inset-0 z-50 hidden flex-col items-center justify-center p-4" style="background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);touch-action:auto;-webkit-user-select:auto;user-select:auto;"'), 'Modal touch-action style verified.');
assert(htmlContent.includes('id="save-preview-img" src="" alt="SPTI 공간 지각력 진단서" class="w-full h-auto object-contain max-h-[75vh] select-auto" style="-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto;touch-action:auto;"'), 'Preview img touch & callout style verified.');
console.log('✔ HTML touch-action and long-press accessibility verified.');

// --- R2 Check ---
console.log('\n[R2] Checking 3D Lighting & Viewport / Block Size Normalization...');

// Ambient light 1.15
assert(scriptContent.includes('const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);'), 'ambientLight must be 1.15');
console.log('✔ ambientLight 1.15 verified.');

// Directional light 2.50
assert(scriptContent.includes('const directionalLight = new THREE.DirectionalLight(0xffffff, 2.50);'), 'directionalLight must be 2.50');
console.log('✔ directionalLight 2.50 verified.');

// Fill light 1.20 (0x38bdf8)
assert(scriptContent.includes('const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.20);'), 'fillLight must be 1.20, color 0x38bdf8');
console.log('✔ fillLight 1.20 (0x38bdf8) verified.');

// Rim light 0.95 (0xa855f7)
assert(scriptContent.includes('const rimLight = new THREE.DirectionalLight(0xa855f7, 0.95);'), 'rimLight must be 0.95, color 0xa855f7');
console.log('✔ rimLight 0.95 (0xa855f7) verified.');

// Wall material 0x2a3854, roughness 0.50, metalness 0.08
assert(scriptContent.includes('color: 0x2a3854,\n    roughness: 0.50,\n    metalness: 0.08'), 'wallMaterial properties verified.');
console.log('✔ wallMaterial color 0x2a3854, roughness 0.50, metalness 0.08 verified.');

// blockSize = 0.82
assert(scriptContent.includes('const blockSize = 0.82;'), 'blockSize must be 0.82');
console.log('✔ blockSize 0.82 verified.');

// adjustLayoutForScreen
assert(scriptContent.includes('const baseFov = 49;'), 'baseFov must be 49');
assert(scriptContent.includes('camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 46, 58);'), 'camera.fov clamp must be 46~58');
assert(scriptContent.includes('camera.position.set(16, 12, 30);'), 'camera.position must be (16, 12, 30)');
assert(scriptContent.includes('basePuzzlePos = { x: -0.8, y: -0.8, z: 0 };'), 'basePuzzlePos.x must be -0.8 in portrait mobile');
console.log('✔ adjustLayoutForScreen parameters verified.');

console.log('\n===============================================================');
console.log('🎉 ALL R1 & R2 DEDICATED IMPLEMENTATION CHECKS PASSED!');
console.log('===============================================================');
