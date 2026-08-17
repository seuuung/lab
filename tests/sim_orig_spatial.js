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

function testOriginalSpatial(name, lightY) {
    const w = 390, h = 844, aspect = w / h;
    const eye = [16, 15, 30];
    const center = [0, 0, 0];
    const cubePos = [-2.2, 0, 0];
    const lightPos = [0, lightY, 30];
    const lightTarget = [0, 0, 0];
    const fov = 55;
    
    const Dx = lightTarget[0] - lightPos[0];
    const Dy = lightTarget[1] - lightPos[1];
    const Dz = lightTarget[2] - lightPos[2];
    const t = (-15 - cubePos[2]) / Dz;
    const shadowCenter = [cubePos[0] + t * Dx, cubePos[1] + t * Dy, -15];
    
    const sCube = project(cubePos, eye, center, fov, aspect, w, h);
    const sShadow = project(shadowCenter, eye, center, fov, aspect, w, h);
    
    const halfH = 4.5;
    const cubeTop = project([cubePos[0], cubePos[1] + halfH, cubePos[2] + 3.0], eye, center, fov, aspect, w, h);
    const cubeBottom = project([cubePos[0], cubePos[1] - halfH, cubePos[2] - 3.0], eye, center, fov, aspect, w, h);
    
    const shadowTop = project([shadowCenter[0], shadowCenter[1] + halfH, -15], eye, center, fov, aspect, w, h);
    const shadowBottom = project([shadowCenter[0], shadowCenter[1] - halfH, -15], eye, center, fov, aspect, w, h);
    
    console.log(`\n[${name}] Light Y=${lightY}`);
    console.log(`  Shadow 3D Pos: (${shadowCenter[0].toFixed(1)}, ${shadowCenter[1].toFixed(1)}, ${shadowCenter[2].toFixed(1)})`);
    console.log(`  Cube Screen: (${sCube.x.toFixed(1)}, ${sCube.y.toFixed(1)}) | Y-range: [${cubeTop.y.toFixed(1)} ~ ${cubeBottom.y.toFixed(1)}]`);
    console.log(`  Shadow Screen: (${sShadow.x.toFixed(1)}, ${sShadow.y.toFixed(1)}) | Y-range: [${shadowTop.y.toFixed(1)} ~ ${shadowBottom.y.toFixed(1)}]`);
}

testOriginalSpatial('Original Light', 0);
testOriginalSpatial('Light Y = -6', -6);
testOriginalSpatial('Light Y = -8', -8);
testOriginalSpatial('Light Y = -10', -10);
