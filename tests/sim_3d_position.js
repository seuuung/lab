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

function findBestMobile() {
    const w = 390, h = 844, aspect = w / h;
    const lightDir = [0, 0, -1];
    
    // Grid search for optimal camera, cube pos, scale
    let best = null;
    let maxMargin = -999;

    for (let camX = 10; camX <= 18; camX += 2) {
        for (let camY = 12; camY <= 22; camY += 2) {
            for (let camZ = 24; camZ <= 34; camZ += 2) {
                for (let cubeX = -5.0; cubeX <= -2.5; cubeX += 0.5) {
                    for (let cubeY = -4.0; cubeY <= -1.0; cubeY += 0.5) {
                        for (let fov = 50; fov <= 62; fov += 3) {
                            const eye = [camX, camY, camZ];
                            const center = [0, 0, -4];
                            const cubePos = [cubeX, cubeY, 0];
                            const shadowCenter = [cubeX, cubeY, -15];
                            
                            const sCube = project(cubePos, eye, center, fov, aspect, w, h);
                            const sShadow = project(shadowCenter, eye, center, fov, aspect, w, h);
                            
                            // Bounds of screen: 10% ~ 90%
                            if (sCube.x < 30 || sCube.x > w - 30 || sCube.y < 50 || sCube.y > h - 80) continue;
                            if (sShadow.x < 30 || sShadow.x > w - 30 || sShadow.y < 50 || sShadow.y > h - 80) continue;
                            
                            const blockHalfExt = 3.8; // with slight scale
                            const sCubeEdge = project([cubePos[0]+blockHalfExt, cubePos[1]+blockHalfExt, cubePos[2]+3.0], eye, center, fov, aspect, w, h);
                            const cubeRad = Math.hypot(sCubeEdge.x - sCube.x, sCubeEdge.y - sCube.y);
                            
                            const sShadowEdge = project([shadowCenter[0]+blockHalfExt, shadowCenter[1]+blockHalfExt, -15], eye, center, fov, aspect, w, h);
                            const shadowRad = Math.hypot(sShadowEdge.x - sShadow.x, sShadowEdge.y - sShadow.y);
                            
                            const dist = Math.hypot(sShadow.x - sCube.x, sShadow.y - sCube.y);
                            const margin = dist - (cubeRad + shadowRad);
                            
                            if (margin > maxMargin) {
                                maxMargin = margin;
                                best = { eye, center, cubePos, fov, sCube, sShadow, cubeRad, shadowRad, dist, margin };
                            }
                        }
                    }
                }
            }
        }
    }
    
    console.log('=== BEST MOBILE CONFIG ===');
    console.log('Camera Eye:', best.eye);
    console.log('Camera Center:', best.center);
    console.log('Cube Pos:', best.cubePos);
    console.log('FOV:', best.fov);
    console.log(`Cube Screen: (${best.sCube.x.toFixed(1)}, ${best.sCube.y.toFixed(1)}) rad=${best.cubeRad.toFixed(1)}px`);
    console.log(`Shadow Screen: (${best.sShadow.x.toFixed(1)}, ${best.sShadow.y.toFixed(1)}) rad=${best.shadowRad.toFixed(1)}px`);
    console.log(`Distance: ${best.dist.toFixed(1)}px | Safety Margin: ${best.margin.toFixed(1)}px ✅`);
}

findBestMobile();
