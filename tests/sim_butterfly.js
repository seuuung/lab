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

function verifySetup(name, eye, center, cubePos, fov, blockSize) {
    const w = 390, h = 844, aspect = w / h;
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
                    const sc = project([posX, posY, posZ], eye, center, fov, aspect, w, h);
                    minCubeX = Math.min(minCubeX, sc.x);
                    maxCubeX = Math.max(maxCubeX, sc.x);
                    minCubeY = Math.min(minCubeY, sc.y);
                    maxCubeY = Math.max(maxCubeY, sc.y);
                }
                
                const ss = project([posX, posY, -15], eye, center, fov, aspect, w, h);
                minShadowX = Math.min(minShadowX, ss.x);
                maxShadowX = Math.max(maxShadowX, ss.x);
                minShadowY = Math.min(minShadowY, ss.y);
                maxShadowY = Math.max(maxShadowY, ss.y);
            }
        }
    }
    
    const verticalGap = minCubeY - maxShadowY;
    const leftMargin = minCubeX;
    const rightMargin = w - maxCubeX;
    
    console.log(`\n[${name}]`);
    console.log(`  Cube Box X:     [${minCubeX.toFixed(1)}px ~ ${maxCubeX.toFixed(1)}px] (Left Marg: ${leftMargin.toFixed(1)}px, Right Marg: ${rightMargin.toFixed(1)}px)`);
    console.log(`  Cube Box Y:     [${minCubeY.toFixed(1)}px ~ ${maxCubeY.toFixed(1)}px]`);
    console.log(`  Shadow Box Y:   [${minShadowY.toFixed(1)}px ~ ${maxShadowY.toFixed(1)}px]`);
    console.log(`  Vertical Gap:   ${verticalGap.toFixed(1)}px ${verticalGap > 15 ? '✅ 100% CLEAR (NO OCCLUSION)' : '❌ OCCLUDED (' + verticalGap.toFixed(1) + 'px)'}`);
    console.log(`  Screen Fit:     ${leftMargin >= 30 && rightMargin >= 30 ? '✅ PERFECT FIT WITH 30px+ MARGIN' : '❌ OUT OF SCREEN'}`);
}

console.log('=== TESTING HIGH ANGLE SEPARATION ===');
verifySetup('Setup D: Eye [2, 16, 33], Center [0, -1.8, -4], Cube [0, -4.0, 0], FOV 48, Block 0.56', 
    [2, 16, 33], [0, -1.8, -4], [0, -4.0, 0], 48, 0.56);

verifySetup('Setup E: Eye [2.5, 17, 33], Center [0, -2.0, -4], Cube [0, -4.2, 0], FOV 48, Block 0.54', 
    [2.5, 17, 33], [0, -2.0, -4], [0, -4.2, 0], 48, 0.54);

verifySetup('Setup F: Eye [2.5, 18, 34], Center [0, -2.0, -4], Cube [0, -4.2, 0], FOV 48, Block 0.52', 
    [2.5, 18, 34], [0, -2.0, -4], [0, -4.2, 0], 48, 0.52);
