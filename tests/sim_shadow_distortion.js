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

// Check distortion for blocks with Z from -4 to +4
function testDistortion(lightPos, lightTarget) {
    const Dx = lightTarget[0] - lightPos[0];
    const Dy = lightTarget[1] - lightPos[1];
    const Dz = lightTarget[2] - lightPos[2];
    
    // Block at (0, 0, +4) and Block at (0, 0, -4)
    const tA = (-15 - 4) / Dz;
    const tB = (-15 - (-4)) / Dz;
    const shadowA_Y = 0 + tA * Dy;
    const shadowB_Y = 0 + tB * Dy;
    const shadowOffset = Math.abs(shadowA_Y - shadowB_Y);
    
    console.log(`Light Pos: [${lightPos.join(', ')}] -> Shadow Y parallax between Z=+4 and Z=-4: ${shadowOffset.toFixed(2)} units ${shadowOffset === 0 ? '✅ 100% PERFECT SHAPE' : '❌ DISTORTED & BROKEN'}`);
}

console.log('=== SHADOW DISTORTION PARALLAX CHECK ===');
testDistortion([0, -7.5, 30], [0, 0, 0]); // Distorted by 2.00 units!
testDistortion([0, 0, 32], [0, 0, 0]);    // 0.00 units = 100% Perfect!

// Now find camera setup that gives zero occlusion with pure parallel light [0,0,32]
function testCameraWithCleanLight(name, eye, center, cubePos, fov, w, h) {
    const shadowCenter = [cubePos[0], cubePos[1], -15]; // Exact orthogonal shadow
    const aspect = w / h;
    const sCube = project(cubePos, eye, center, fov, aspect, w, h);
    const sShadow = project(shadowCenter, eye, center, fov, aspect, w, h);
    
    const halfH = 4.5;
    const cubeTop = project([cubePos[0], cubePos[1] + halfH, cubePos[2] + 3.0], eye, center, fov, aspect, w, h);
    const cubeBottom = project([cubePos[0], cubePos[1] - halfH, cubePos[2] - 3.0], eye, center, fov, aspect, w, h);
    
    const shadowTop = project([shadowCenter[0], shadowCenter[1] + halfH, -15], eye, center, fov, aspect, w, h);
    const shadowBottom = project([shadowCenter[0], shadowCenter[1] - halfH, -15], eye, center, fov, aspect, w, h);
    
    console.log(`\n[${name}] (${w}x${h})`);
    console.log(`  Cube Screen: (${sCube.x.toFixed(1)}, ${sCube.y.toFixed(1)}) | Y: [${cubeTop.y.toFixed(1)} ~ ${cubeBottom.y.toFixed(1)}]`);
    console.log(`  Shadow Screen: (${sShadow.x.toFixed(1)}, ${sShadow.y.toFixed(1)}) | Y: [${shadowTop.y.toFixed(1)} ~ ${shadowBottom.y.toFixed(1)}]`);
    console.log(`  Screen Center X: Cube=${sCube.x.toFixed(1)}px, Shadow=${sShadow.x.toFixed(1)}px (Screen Width: ${w}px)`);
}

console.log('\n=== MOBILE PORTRAIT (390x844) WITH PERFECT ORTHOGONAL LIGHT ===');
// When camera is at [15, 12, 28] looking at [-1, 0, -5], with cube at [-2.5, -0.5, 0]:
testCameraWithCleanLight('Setup M1', [15, 12, 28], [-1, 0, -5], [-2.5, -0.5, 0], 52, 390, 844);
testCameraWithCleanLight('Setup M2', [14, 11, 26], [0, 0, -4], [-2.0, 0, 0], 52, 390, 844);
testCameraWithCleanLight('Setup M3', [16, 12, 28], [0, 0, -5], [-2.2, 0, 0], 50, 390, 844);
