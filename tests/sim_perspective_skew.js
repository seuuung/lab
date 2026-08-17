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

function testForeshortening(name, eye, center, cubePos, fov, w, h) {
    const shadowCenter = [cubePos[0], cubePos[1], -15];
    const aspect = w / h;
    
    // A square of 8x8 on the wall z = -15
    const pTL = project([shadowCenter[0]-4, shadowCenter[1]+4, -15], eye, center, fov, aspect, w, h);
    const pTR = project([shadowCenter[0]+4, shadowCenter[1]+4, -15], eye, center, fov, aspect, w, h);
    const pBL = project([shadowCenter[0]-4, shadowCenter[1]-4, -15], eye, center, fov, aspect, w, h);
    const pBR = project([shadowCenter[0]+4, shadowCenter[1]-4, -15], eye, center, fov, aspect, w, h);
    
    const topWidth = Math.hypot(pTR.x - pTL.x, pTR.y - pTL.y);
    const botWidth = Math.hypot(pBR.x - pBL.x, pBR.y - pBL.y);
    const leftHeight = Math.hypot(pBL.x - pTL.x, pBL.y - pTL.y);
    const rightHeight = Math.hypot(pBR.x - pTR.x, pBR.y - pTR.y);
    
    const widthRatio = topWidth / botWidth; // 1.0 is perfect square, != 1.0 is trapezoid
    const heightRatio = leftHeight / rightHeight;
    const avgWidth = (topWidth + botWidth) / 2;
    const avgHeight = (leftHeight + rightHeight) / 2;
    const shapeAspectRatio = avgWidth / avgHeight; // Should be ~1.0 for square
    
    const sCube = project(cubePos, eye, center, fov, aspect, w, h);
    const sShadow = project(shadowCenter, eye, center, fov, aspect, w, h);
    
    console.log(`\n[${name}] Eye=[${eye.join(', ')}]`);
    console.log(`  Shadow Square Distortion: W-ratio=${widthRatio.toFixed(3)}, H-ratio=${heightRatio.toFixed(3)}, Aspect=${shapeAspectRatio.toFixed(3)} ${Math.abs(shapeAspectRatio - 1.0) < 0.1 ? '✅ SQUARE & CLEAN' : '❌ SKEWED'}`);
    console.log(`  Cube Screen: (${sCube.x.toFixed(1)}, ${sCube.y.toFixed(1)}) | Shadow Screen: (${sShadow.x.toFixed(1)}, ${sShadow.y.toFixed(1)})`);
}

console.log('=== MOBILE PERSPECTIVE SKEW ANALYSIS (390x844) ===');
testForeshortening('Current Heavy Skew (X=16, Y=14, Z=28)', [16, 14, 28], [0, 0, -4], [-2.2, 0, 0], 55, 390, 844);
testForeshortening('Moderate Angled (X=6, Y=5, Z=26)', [6, 5, 26], [0, 0, -3], [-1.2, -1.0, 0], 48, 390, 844);
testForeshortening('Gentle 3D Angle (X=4, Y=3.5, Z=26)', [4, 3.5, 26], [0, 0, -3], [-0.8, -1.2, 0], 48, 390, 844);
testForeshortening('Subtle 3D Depth (X=3, Y=2.5, Z=25)', [3, 2.5, 25], [0, 0, -3], [-0.5, -1.5, 0], 46, 390, 844);
