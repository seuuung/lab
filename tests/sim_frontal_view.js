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

function simulateMobile(name, eye, center, cubePos, fov) {
    const w = 390, h = 844, aspect = w / h;
    const shadowCenter = [cubePos[0], cubePos[1] + 4.5, -15]; // Place shadow plane/target nicely
    
    // Heart shape corners (-4 to +4) on wall
    const pTL = project([shadowCenter[0]-4, shadowCenter[1]+4, -15], eye, center, fov, aspect, w, h);
    const pTR = project([shadowCenter[0]+4, shadowCenter[1]+4, -15], eye, center, fov, aspect, w, h);
    const pBL = project([shadowCenter[0]-4, shadowCenter[1]-4, -15], eye, center, fov, aspect, w, h);
    const pBR = project([shadowCenter[0]+4, shadowCenter[1]-4, -15], eye, center, fov, aspect, w, h);
    
    const width = Math.hypot(pTR.x - pTL.x, pTR.y - pTL.y);
    const height = Math.hypot(pBL.x - pTL.x, pBL.y - pTL.y);
    const skew = (pTR.x - pTL.x) / (pBR.x - pBL.x);
    
    const sCube = project(cubePos, eye, center, fov, aspect, w, h);
    const sShadow = project(shadowCenter, eye, center, fov, aspect, w, h);
    
    console.log(`\n[${name}]`);
    console.log(`  Shadow Dimensions on Screen: ${width.toFixed(1)}px x ${height.toFixed(1)}px | Skew Ratio: ${skew.toFixed(4)} (1.0 = Perfect Shape)`);
    console.log(`  Shadow Center Screen: (${sShadow.x.toFixed(1)}, ${sShadow.y.toFixed(1)})`);
    console.log(`  Cube Center Screen:   (${sCube.x.toFixed(1)}, ${sCube.y.toFixed(1)})`);
    console.log(`  Vertical Distance: ${(sCube.y - sShadow.y).toFixed(1)}px`);
}

// Option 1: Clean Frontal (Eye: [0, 0, 27], Center: [0, 0, 0], Cube: [0, -3.2, 0])
// To give shadow its own upper position, wall shadow is at [0, 2.5, -15]
simulateMobile('Clean Frontal View', [0, 0, 27], [0, 0, 0], [0, -3.2, 0], 50);

// Option 2: Gentle Eye Level (Eye: [0, 1.0, 26], Center: [0, 0, -3], Cube: [0, -3.0, 0])
simulateMobile('Gentle Eye Level', [0, 1.0, 26], [0, 0, -3], [0, -3.0, 0], 50);
