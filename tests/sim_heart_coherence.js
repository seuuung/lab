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

// Check real block projection for Heart shape level
const heartGrid = [
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0]
];

function testHeartShadowOnWall(eye, center, cubePos, lightPos, fov) {
    const w = 390, h = 844, aspect = w / h;
    const Dx = 0 - lightPos[0];
    const Dy = 0 - lightPos[1];
    const Dz = 0 - lightPos[2];
    
    // Simulate each block of heart
    const blockSize = 1.0;
    const rows = heartGrid.length;
    const cols = heartGrid[0].length;
    
    const projectedPixels = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (heartGrid[y][x] === 1) {
                const posX = cubePos[0] + (x - cols/2 + 0.5) * blockSize;
                const posY = cubePos[1] - (y - rows/2 + 0.5) * blockSize;
                // Random posZ as in game (-4 to +4)
                const posZ = (Math.sin(x*13 + y*37) * 0.5) * 8.5;
                
                // Shadow on wall z = -15
                const t = (-15 - posZ) / Dz;
                const shadowX = posX + t * Dx;
                const shadowY = posY + t * Dy;
                const shadowZ = -15;
                
                const pt = project([shadowX, shadowY, shadowZ], eye, center, fov, aspect, w, h);
                projectedPixels.push({ x, y, sx: pt.x, sy: pt.y });
            }
        }
    }
    
    // Check if relative alignment of grid is preserved (x step and y step)
    const p01 = projectedPixels.find(p => p.x === 1 && p.y === 1);
    const p02 = projectedPixels.find(p => p.x === 2 && p.y === 1);
    const p11 = projectedPixels.find(p => p.x === 1 && p.y === 2);
    
    const stepX = p02.sx - p01.sx;
    const stepY = p11.sy - p01.sy;
    
    console.log(`Light: [${lightPos.join(',')}] | Eye: [${eye.join(',')}]`);
    console.log(`  Heart Shadow on screen: (x=1,y=1) -> (${p01.sx.toFixed(1)}, ${p01.sy.toFixed(1)})`);
    console.log(`  StepX: ${stepX.toFixed(2)}px, StepY: ${stepY.toFixed(2)}px`);
}

console.log('--- Case 1: Bad Angled Light [0, -7.5, 30] ---');
testHeartShadowOnWall([16, 14, 28], [0, 0, -4], [-2.2, 0, 0], [0, -7.5, 30], 48);

console.log('\n--- Case 2: Perfect Orthogonal Light [0, 0, 32] with Eye [10, 8, 25] ---');
testHeartShadowOnWall([10, 8, 25], [0, 0, -4], [-2.2, 0, 0], [0, 0, 32], 48);

console.log('\n--- Case 3: Perfect Orthogonal Light [0, 0, 32] with Balanced Eye [12, 10, 27] ---');
testHeartShadowOnWall([12, 10, 27], [0, 0, -4], [-2.2, 0, 0], [0, 0, 32], 48);
