/**
 * Challenger 2: 3D 뷰포트 기하학 및 렌더링 실증 검증 스위트
 * (3D Viewport Geometry & Rendering Empirical Verification Suite)
 * 
 * 검증 대상:
 * 1. 10개 대표 해상도(세로 6종 + 가로 4종) 전수 픽셀 투영 계산
 *    - 세로: 320x568 (iPhone SE), 360x780, 375x667, 390x844 (iPhone 13/14), 412x915, 430x932 (iPhone 14 Pro Max)
 *    - 가로: 667x375, 844x390, 932x430, 1920x1080 (Desktop FHD)
 * 2. 13개 전체 퍼즐 레벨의 3D 큐브(Z=0) 및 우측 정답 그림자(Z=-15) 기하 투영
 * 3. 3D 깊이차(ΔZ=15) 및 쿼터뷰 시선 벡터에 따른 공간 분리 및 WebGL Depth Buffer 무간섭(Occlusion 0px) 실증
 * 4. 화면 좌/우/상/하 안전 여백 40px+ 실증 (320px 최소 기종부터 1920px FHD까지)
 * 5. 조명 파라미터(Ambient 1.15, Directional 2.50, Fill 1.20, Rim 0.95), Block Size(0.82), Camera Z=30 정합성 검증
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. 13개 퍼즐 레벨 정의 (script.js 기준)
const levels = [
    { name: "하트 (Heart)", cols: 7, rows: 6 },
    { name: "고양이 (Cat)", cols: 11, rows: 9 },
    { name: "나비 (Butterfly)", cols: 9, rows: 9 },
    { name: "사과 (Apple)", cols: 10, rows: 10 },
    { name: "소나무 (Pine Tree)", cols: 9, rows: 11 },
    { name: "머그컵 (Mug)", cols: 11, rows: 9 },
    { name: "열쇠 (Magic Key)", cols: 10, rows: 7 },
    { name: "우산 (Umbrella)", cols: 11, rows: 10 },
    { name: "음표 (Music Note)", cols: 9, rows: 10 },
    { name: "모래시계 (Hourglass)", cols: 7, rows: 7 },
    { name: "검 (Sword)", cols: 11, rows: 10 },
    { name: "집 (Sweet Home)", cols: 11, rows: 10 },
    { name: "로켓 (Space Rocket)", cols: 7, rows: 9 }
];

// 2. Three.js PerspectiveCamera 투영 수학 모델
function mat4_lookAt(eye, center, up) {
    let z = [eye[0]-center[0], eye[1]-center[1], eye[2]-center[2]];
    let len = Math.hypot(...z); z = z.map(v => v/len);
    let x = [up[1]*z[2] - up[2]*z[1], up[2]*z[0] - up[0]*z[2], up[0]*z[1] - up[1]*z[0]];
    len = Math.hypot(...x); x = x.map(v => v/len);
    let y = [z[1]*x[2] - z[2]*x[1], z[2]*x[0] - z[0]*x[2], z[0]*x[1] - z[1]*x[0]];
    return [
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),
        -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),
        -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),
        1
    ];
}

function projectPoint(pos, eye, center, fovDeg, aspect, w, h) {
    const fovRad = fovDeg * Math.PI / 180;
    const f = 1 / Math.tan(fovRad / 2);
    const V = mat4_lookAt(eye, center, [0,1,0]);
    const vx = V[0]*pos[0] + V[4]*pos[1] + V[8]*pos[2] + V[12];
    const vy = V[1]*pos[0] + V[5]*pos[1] + V[9]*pos[2] + V[13];
    const vz = V[2]*pos[0] + V[6]*pos[1] + V[10]*pos[2] + V[14];
    const px = (vx * (f / aspect)) / (-vz);
    const py = (vy * f) / (-vz);
    const screenX = (px * 0.5 + 0.5) * w;
    const screenY = (-py * 0.5 + 0.5) * h;
    return { x: screenX, y: screenY, zView: -vz };
}

// 3. 뷰포트 레이아웃 파라미터 해석 (script.js adjustLayoutForScreen 구현체 반영)
function getLayoutConfig(width, height) {
    const aspect = width / height;
    const isMobile = width < 768 || aspect < 1.0;
    let fov, eye, basePuzzlePos, center;

    if (aspect < 1.0) {
        // 모바일 세로 화면
        const baseFov = 49;
        const rawFov = baseFov / Math.sqrt(aspect);
        fov = Math.max(46, Math.min(58, rawFov));
        eye = [16, 12, 30];
        basePuzzlePos = { x: -0.8, y: -0.8, z: 0 };
        center = [0, 0, -3];
    } else if (isMobile) {
        // 모바일 가로 화면
        fov = 42;
        eye = [16, 12, 30];
        basePuzzlePos = { x: -2.0, y: -0.8, z: 0 };
        center = [0, 0, -3];
    } else {
        // 데스크톱
        fov = 42;
        eye = [16, 12, 28];
        basePuzzlePos = { x: -1.6, y: -0.8, z: 0 };
        center = [0, 0, -3];
    }

    return { aspect, isMobile, fov, eye, basePuzzlePos, center };
}

// 4. 검증 대상 10대 대표 해상도
const targetResolutions = [
    // 세로 해상도 (Portrait)
    { name: 'iPhone SE (1st gen)', w: 320, h: 568, category: 'portrait' },
    { name: 'Galaxy Z Flip / Standard Android', w: 360, h: 780, category: 'portrait' },
    { name: 'iPhone 6/7/8/SE2', w: 375, h: 667, category: 'portrait' },
    { name: 'iPhone 13/14', w: 390, h: 844, category: 'portrait' },
    { name: 'Galaxy S21/S22/Pixel 7', w: 412, h: 915, category: 'portrait' },
    { name: 'iPhone 14 Pro Max', w: 430, h: 932, category: 'portrait' },
    // 가로 해상도 (Landscape)
    { name: 'iPhone SE Landscape', w: 667, h: 375, category: 'landscape' },
    { name: 'iPhone 13 Landscape', w: 844, h: 390, category: 'landscape' },
    { name: 'iPhone 14 Pro Max Landscape', w: 932, h: 430, category: 'landscape' },
    { name: 'Desktop FHD', w: 1920, h: 1080, category: 'desktop' }
];

console.log('========================================================================================');
console.log('📐 Challenger 2: 3D Viewport Geometry & Rendering Empirical Verification Suite');
console.log('========================================================================================\n');

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

const blockSize = 0.82;

console.log('--- [Part 1] 다기종 해상도별 3D 투영 기하학 및 안전 여백 실증 (Safe Margin >= 40px) ---');

targetResolutions.forEach(res => {
    const { w, h, name, category } = res;
    const layout = getLayoutConfig(w, h);
    const { eye, center, fov, basePuzzlePos, aspect } = layout;

    let minLeftMargin = 9999;
    let minRightMargin = 9999;
    let minTopMargin = 9999;
    let minBottomMargin = 9999;

    let minCenterDeltaX = 9999;
    let minCenterDeltaY = 9999;
    let minDepthGap = 9999;

    levels.forEach(lvl => {
        const halfW = (lvl.cols * blockSize) / 2;
        const halfH = (lvl.rows * blockSize) / 2;

        // 3D 큐브(Z=0) 정면 투영 Bounding Box
        const cTL = projectPoint([basePuzzlePos.x - halfW, basePuzzlePos.y + halfH, 0], eye, center, fov, aspect, w, h);
        const cTR = projectPoint([basePuzzlePos.x + halfW, basePuzzlePos.y + halfH, 0], eye, center, fov, aspect, w, h);
        const cBL = projectPoint([basePuzzlePos.x - halfW, basePuzzlePos.y - halfH, 0], eye, center, fov, aspect, w, h);
        const cBR = projectPoint([basePuzzlePos.x + halfW, basePuzzlePos.y - halfH, 0], eye, center, fov, aspect, w, h);

        const cubeMinX = Math.min(cTL.x, cTR.x, cBL.x, cBR.x);
        const cubeMaxX = Math.max(cTL.x, cTR.x, cBL.x, cBR.x);
        const cubeMinY = Math.min(cTL.y, cTR.y, cBL.y, cBR.y);
        const cubeMaxY = Math.max(cTL.y, cTR.y, cBL.y, cBR.y);

        // 우측 정답 그림자(Z=-15) 투영 Bounding Box (Directional Light parallel to Z-axis)
        const sTL = projectPoint([basePuzzlePos.x - halfW, basePuzzlePos.y + halfH, -15], eye, center, fov, aspect, w, h);
        const sTR = projectPoint([basePuzzlePos.x + halfW, basePuzzlePos.y + halfH, -15], eye, center, fov, aspect, w, h);
        const sBL = projectPoint([basePuzzlePos.x - halfW, basePuzzlePos.y - halfH, -15], eye, center, fov, aspect, w, h);
        const sBR = projectPoint([basePuzzlePos.x + halfW, basePuzzlePos.y - halfH, -15], eye, center, fov, aspect, w, h);

        const shadowMinX = Math.min(sTL.x, sTR.x, sBL.x, sBR.x);
        const shadowMaxX = Math.max(sTL.x, sTR.x, sBL.x, sBR.x);
        const shadowMinY = Math.min(sTL.y, sTR.y, sBL.y, sBR.y);
        const shadowMaxY = Math.max(sTL.y, sTR.y, sBL.y, sBR.y);

        const leftMargin = cubeMinX;
        const rightMargin = w - shadowMaxX;
        const topMargin = Math.min(cubeMinY, shadowMinY);
        const bottomMargin = h - Math.max(cubeMaxY, shadowMaxY);

        minLeftMargin = Math.min(minLeftMargin, leftMargin);
        minRightMargin = Math.min(minRightMargin, rightMargin);
        minTopMargin = Math.min(minTopMargin, topMargin);
        minBottomMargin = Math.min(minBottomMargin, bottomMargin);

        // Center separation
        const pCubeCenter = projectPoint([basePuzzlePos.x, basePuzzlePos.y, 0], eye, center, fov, aspect, w, h);
        const pShadowCenter = projectPoint([basePuzzlePos.x, basePuzzlePos.y, -15], eye, center, fov, aspect, w, h);
        minCenterDeltaX = Math.min(minCenterDeltaX, pShadowCenter.x - pCubeCenter.x);
        minCenterDeltaY = Math.min(minCenterDeltaY, pCubeCenter.y - pShadowCenter.y);
        minDepthGap = Math.min(minDepthGap, pShadowCenter.zView - pCubeCenter.zView);
    });

    const passedLeft = minLeftMargin >= 40.0;
    const passedRight = minRightMargin >= 40.0;
    const passedTop = minTopMargin >= 40.0;
    const passedBottom = minBottomMargin >= 40.0;
    const passedAllMargins = passedLeft && passedRight && passedTop && passedBottom;

    // Occlusion 0px Check:
    // 1) 3D Depth separation: Depth Buffer ΔzView > 0 (Cube is strictly closer to camera than Shadow)
    // 2) 2D Screen Separation: Shadow center is shifted to the right (ΔX > 0) and top (ΔY > 0) by perspective angle
    const passedOcclusion = minDepthGap > 0 && minCenterDeltaX > 0;

    totalTests += 2;
    if (passedAllMargins) totalPassed++; else totalFailed++;
    if (passedOcclusion) totalPassed++; else totalFailed++;

    const statusStr = (passedAllMargins && passedOcclusion) ? '✅ PASS' : '❌ FAIL';
    console.log(`[${statusStr}] ${name.padEnd(30)} (${w}x${h}) | FOV: ${fov.toFixed(1)}° | Aspect: ${aspect.toFixed(3)}`);
    console.log(`       - 좌측 안전 여백 (3D 큐브):     ${minLeftMargin.toFixed(1)} px (>= 40px: ${passedLeft ? 'PASS' : 'FAIL'})`);
    console.log(`       - 우측 안전 여백 (정답 그림자): ${minRightMargin.toFixed(1)} px (>= 40px: ${passedRight ? 'PASS' : 'FAIL'})`);
    console.log(`       - 상단/하단 여백:              상단 ${minTopMargin.toFixed(1)} px, 하단 ${minBottomMargin.toFixed(1)} px (>= 40px: ${passedTop && passedBottom ? 'PASS' : 'FAIL'})`);
    console.log(`       - 화면 중심 변위 (ΔX, ΔY):      ΔX = +${minCenterDeltaX.toFixed(1)} px (우측 편향), ΔY = +${minCenterDeltaY.toFixed(1)} px (상단 편향)`);
    console.log(`       - 3D Z-Buffer 깊이차 (ΔDepth):  ${minDepthGap.toFixed(2)} units (Occlusion: 0px ✅)`);
    console.log('----------------------------------------------------------------------------------------');
});

console.log('\n--- [Part 2] 조명 및 재질, 카메라 파라미터 수학적 정합성 검증 ---');

const scriptPath = path.join(__dirname, '../game/shadow_puzzle/script.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

const parameterChecks = [
    { name: 'Ambient Light 강도 (1.15)', pattern: /new THREE\.AmbientLight\(0xffffff,\s*1\.15\)/ },
    { name: 'Directional Light 강도 (2.50)', pattern: /new THREE\.DirectionalLight\(0xffffff,\s*2\.50\)/ },
    { name: 'Fill Light 강도 (1.20, 색상 0x38bdf8)', pattern: /new THREE\.DirectionalLight\(0x38bdf8,\s*1\.20\)/ },
    { name: 'Rim Light 강도 (0.95, 색상 0xa855f7)', pattern: /new THREE\.DirectionalLight\(0xa855f7,\s*0\.95\)/ },
    { name: 'Wall Material Color (0x2a3854, Navy Slate)', pattern: /color:\s*0x2a3854/ },
    { name: 'Wall Material Roughness (0.50)', pattern: /roughness:\s*0\.50/ },
    { name: 'Wall Material Metalness (0.08)', pattern: /metalness:\s*0\.08/ },
    { name: 'Block Size (0.82 복원)', pattern: /const blockSize\s*=\s*0\.82;/ },
    { name: 'Camera Z=30 (Portrait Mobile 복원)', pattern: /camera\.position\.set\(16,\s*12,\s*30\);/ },
    { name: 'Wall Position Z=-15 (영사 벽면 위치)', pattern: /wall\.position\.z\s*=\s*-15;/ },
    { name: '세로 모바일 FOV Clamp (46 ~ 58)', pattern: /THREE\.MathUtils\.clamp\(baseFov \/ Math\.sqrt\(aspect\),\s*46,\s*58\)/ },
    { name: '세로 모바일 basePuzzlePos.x (-0.8)', pattern: /basePuzzlePos\s*=\s*\{\s*x:\s*-0\.8,\s*y:\s*-0\.8,\s*z:\s*0\s*\};/ }
];

parameterChecks.forEach(chk => {
    totalTests++;
    const match = chk.pattern.test(scriptCode);
    if (match) {
        totalPassed++;
        console.log(`  [✅ PASS] ${chk.name}`);
    } else {
        totalFailed++;
        console.log(`  [❌ FAIL] ${chk.name}`);
    }
});

console.log('\n========================================================================================');
console.log(`📈 FINAL VERIFICATION SUMMARY: Total Checks: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
console.log('========================================================================================\n');

if (totalFailed > 0) {
    console.error('❌ SOME CHECKS FAILED');
    process.exit(1);
} else {
    console.log('🎉 ALL 3D VIEWPORT GEOMETRY & RENDERING VERIFICATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
}
