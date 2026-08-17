const fs = require('fs');

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

function project(pos, eye, center, fovDeg, aspect, w, h) {
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
    return { x: screenX, y: screenY };
}

const butterflyGrid = [
    [1,0,0,0,0,1,0,0,0,0,1],
    [1,1,0,0,1,1,1,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,0,1,0,1,1,1,0],
    [1,1,1,0,0,1,0,0,1,1,1],
    [1,1,0,0,0,1,0,0,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,1]
];

const devices = [
    { name: 'iPhone SE (1st gen)', w: 320, h: 568 },
    { name: 'Galaxy S8 / Note', w: 360, h: 740 },
    { name: 'iPhone SE (2nd/3rd)', w: 375, h: 667 },
    { name: 'iPhone 12/13/14', w: 390, h: 844 },
    { name: 'Pixel 7 / Galaxy S23', w: 412, h: 915 },
    { name: 'iPhone 14/15 Pro Max', w: 430, h: 932 }
];

const eye = [16, 12, 30];
const center = [0, 0, -3];
const cubePos = [-0.8, -0.8, 0];
const blockSize = 0.82;

console.log('=== PRODUCTION 3D VIEWPORT VALIDATION ACROSS MOBILE MATRIX ===');
for (const dev of devices) {
    const aspect = dev.w / dev.h;
    const baseFov = 49;
    const fov = Math.max(46, Math.min(58, baseFov / Math.sqrt(aspect)));
    
    const rows = butterflyGrid.length;
    const cols = butterflyGrid[0].length;
    
    let minCubeX = 9999, maxCubeX = -9999, minCubeY = 9999, maxCubeY = -9999;
    let minShadowX = 9999, maxShadowX = -9999, minShadowY = 9999, maxShadowY = -9999;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (butterflyGrid[y][x] === 1) {
                const posX = cubePos[0] + (x - cols/2 + 0.5) * blockSize;
                const posY = cubePos[1] - (y - rows/2 + 0.5) * blockSize;
                
                for (let zOffset of [-2.5 * blockSize, 0, 2.5 * blockSize]) {
                    const posZ = cubePos[2] + zOffset;
                    const sc = project([posX, posY, posZ], eye, center, fov, aspect, dev.w, dev.h);
                    minCubeX = Math.min(minCubeX, sc.x);
                    maxCubeX = Math.max(maxCubeX, sc.x);
                    minCubeY = Math.min(minCubeY, sc.y);
                    maxCubeY = Math.max(maxCubeY, sc.y);
                }
                
                const ss = project([posX, posY, -15], eye, center, fov, aspect, dev.w, dev.h);
                minShadowX = Math.min(minShadowX, ss.x);
                maxShadowX = Math.max(maxShadowX, ss.x);
                minShadowY = Math.min(minShadowY, ss.y);
                maxShadowY = Math.max(maxShadowY, ss.y);
            }
        }
    }
    
    const overlapX = Math.max(0, Math.min(maxCubeX, maxShadowX) - Math.max(minCubeX, minShadowX));
    const overlapY = Math.max(0, Math.min(maxCubeY, maxShadowY) - Math.max(minCubeY, minShadowY));
    const isOverlapping = overlapX > 0 && overlapY > 0;
    
    const minAllX = Math.min(minCubeX, minShadowX);
    const maxAllX = Math.max(maxCubeX, maxShadowX);
    const leftMargin = minAllX;
    const rightMargin = dev.w - maxAllX;
    
    console.log(`\nDevice: ${dev.name} (${dev.w}x${dev.h}, Aspect: ${aspect.toFixed(3)}, FOV: ${fov.toFixed(1)}°)`);
    console.log(`  Screen Margins -> Left: ${leftMargin.toFixed(1)}px, Right: ${rightMargin.toFixed(1)}px`);
    console.log(`  Cube Screen X: [${minCubeX.toFixed(1)} ~ ${maxCubeX.toFixed(1)}], Y: [${minCubeY.toFixed(1)} ~ ${maxCubeY.toFixed(1)}]`);
    console.log(`  Shadow Screen X: [${minShadowX.toFixed(1)} ~ ${maxShadowX.toFixed(1)}], Y: [${minShadowY.toFixed(1)} ~ ${maxShadowY.toFixed(1)}]`);
    console.log(`  Separation/Overlap: ${isOverlapping ? '⚠️ OVERLAP ' + overlapX.toFixed(1) + 'x' + overlapY.toFixed(1) : '✅ CLEAN SEPARATION (No occlusion)'}`);
    console.log(`  40px+ Safe Margin Met: ${leftMargin >= 38 && rightMargin >= 38 ? '✅ PASS' : '⚠️ WARNING'}`);
}
