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

function test(name, eye, center, cubePos, fov, blockSize) {
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
    
    const overlapX = Math.max(0, Math.min(maxCubeX, maxShadowX) - Math.max(minCubeX, minShadowX));
    const overlapY = Math.max(0, Math.min(maxCubeY, maxShadowY) - Math.max(minCubeY, minShadowY));
    const isOverlapping = overlapX > 0 && overlapY > 0;
    
    const minAllX = Math.min(minCubeX, minShadowX);
    const maxAllX = Math.max(maxCubeX, maxShadowX);
    const minAllY = Math.min(minCubeY, minShadowY);
    const maxAllY = Math.max(maxCubeY, maxShadowY);
    
    console.log(`\n[${name}]`);
    console.log(`  All Bounds X: [${minAllX.toFixed(1)}px ~ ${maxAllX.toFixed(1)}px] (Left Marg: ${minAllX.toFixed(1)}px, Right Marg: ${(w-maxAllX).toFixed(1)}px)`);
    console.log(`  All Bounds Y: [${minAllY.toFixed(1)}px ~ ${maxAllY.toFixed(1)}px] (Top Marg: ${minAllY.toFixed(1)}px, Bot Marg: ${(h-maxAllY).toFixed(1)}px)`);
    console.log(`  Cube Bounds:   X=[${minCubeX.toFixed(1)} ~ ${maxCubeX.toFixed(1)}], Y=[${minCubeY.toFixed(1)} ~ ${maxCubeY.toFixed(1)}]`);
    console.log(`  Shadow Bounds: X=[${minShadowX.toFixed(1)} ~ ${maxShadowX.toFixed(1)}], Y=[${minShadowY.toFixed(1)} ~ ${maxShadowY.toFixed(1)}]`);
    console.log(`  Fit Status:    ${minAllX >= 20 && maxAllX <= w-20 ? '✅ 100% IN SCREEN (20px+ MARGIN)' : '❌ OUT OF SCREEN'}`);
    console.log(`  Occlusion:     ${isOverlapping ? '❌ OVERLAPPING (' + overlapX.toFixed(0) + 'x' + overlapY.toFixed(0) + 'px)' : '✅ ZERO OCCLUSION (100% CLEAN)'}`);
}

// Fine tuning diagonal zoom out
test('Setup 1: Eye [22, 16, 44], Center [0, 0, -4], Cube [-3.0, -1.2, 0], FOV 48, Block 0.62', 
    [22, 16, 44], [0, 0, -4], [-3.0, -1.2, 0], 48, 0.62);

test('Setup 2: Eye [24, 18, 46], Center [0, 0, -4], Cube [-3.2, -1.2, 0], FOV 48, Block 0.60', 
    [24, 18, 46], [0, 0, -4], [-3.2, -1.2, 0], 48, 0.60);

test('Setup 3: Eye [22, 17, 45], Center [0, 0, -4], Cube [-3.0, -1.5, 0], FOV 48, Block 0.58', 
    [22, 17, 45], [0, 0, -4], [-3.0, -1.5, 0], 48, 0.58);
