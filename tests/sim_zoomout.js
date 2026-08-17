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

function testZoom(name, eye, center, cubePos, fov, blockSize) {
    const w = 390, h = 844, aspect = w / h;
    const shadowCenter = [cubePos[0], cubePos[1], -15];
    
    // Extreme 3D bounds for 11x9 grid rotated in all directions (sphere radius 6.0 * blockSize)
    const rad = 5.2 * blockSize;
    const sLeft = project([cubePos[0] - rad, cubePos[1], cubePos[2] + rad*0.8], eye, center, fov, aspect, w, h);
    const sRight = project([cubePos[0] + rad, cubePos[1], cubePos[2] - rad*0.8], eye, center, fov, aspect, w, h);
    const sTop = project([cubePos[0], cubePos[1] + rad, cubePos[2] + rad*0.8], eye, center, fov, aspect, w, h);
    const sBottom = project([cubePos[0], cubePos[1] - rad, cubePos[2] - rad*0.8], eye, center, fov, aspect, w, h);
    
    const sCenter = project(cubePos, eye, center, fov, aspect, w, h);
    const sShadow = project(shadowCenter, eye, center, fov, aspect, w, h);
    
    console.log(`\n[${name}]`);
    console.log(`  Cube Screen Box X: [${sLeft.x.toFixed(1)}px ~ ${sRight.x.toFixed(1)}px] (Screen Width: ${w}px)`);
    console.log(`  Cube Screen Box Y: [${sTop.y.toFixed(1)}px ~ ${sBottom.y.toFixed(1)}px] (Screen Height: ${h}px)`);
    console.log(`  Left Margin: ${sLeft.x.toFixed(1)}px, Right Margin: ${(w - sRight.x).toFixed(1)}px`);
    console.log(`  Fit Status: ${sLeft.x >= 25 && sRight.x <= w - 25 ? '✅ PERFECT FIT IN SCREEN' : '❌ CLIPPED'}`);
}

// Search for ideal setup
console.log('=== ZOOMED-OUT SAFE MARGIN SEARCH ===');
testZoom('Zoom Setup 1: Eye [8, 8, 34], Center [0, 0, -4], Cube [0.5, 0, 0], FOV 50, Block 0.8', [8, 8, 34], [0, 0, -4], [0.5, 0, 0], 50, 0.8);
testZoom('Zoom Setup 2: Eye [8, 7, 34], Center [0, 0, -3], Cube [0.8, 0, 0], FOV 50, Block 0.78', [8, 7, 34], [0, 0, -3], [0.8, 0, 0], 50, 0.78);
testZoom('Zoom Setup 3: Eye [9, 8, 35], Center [0, 0, -3], Cube [1.0, 0, 0], FOV 50, Block 0.76', [9, 8, 35], [0, 0, -3], [1.0, 0, 0], 50, 0.76);
testZoom('Zoom Setup 4: Eye [10, 8, 36], Center [0, 0, -3], Cube [1.0, 0, 0], FOV 50, Block 0.75', [10, 8, 36], [0, 0, -3], [1.0, 0, 0], 50, 0.75);
