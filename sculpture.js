'use strict';
/* A self-contained WebGL sculpture: every plate, rib and fastener is real geometry. */
(() => {
  const canvas = document.getElementById('sculpture');
  if (!canvas) return;
  const stage = canvas.closest('.sculpture-stage');
  const root = document.documentElement;
  const note = stage.querySelector('.sculpture-note');
  const fallback = () => {
    canvas.removeAttribute('tabindex');
    canvas.setAttribute('aria-label', '기계식 나비 조형');
    note.hidden = true;
  };

  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' }); }
  catch (_) { fallback(); return; }
  if (!gl) { fallback(); return; }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    attribute float aWing;
    uniform vec2 uRotation;
    uniform float uAspect;
    uniform float uFlap;
    uniform float uFloat;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying vec3 vPosition;
    mat3 rotateX(float a) {
      float c = cos(a), s = sin(a);
      return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);
    }
    mat3 rotateY(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c,0.,-s, 0.,1.,0., s,0.,c);
    }
    void main() {
      vec3 p = aPosition;
      vec3 n = aNormal;
      if (aWing != 0.) {
        float pivot = aWing * .13;
        p.x -= pivot;
        mat3 hinge = rotateY(-uFlap * aWing);
        p = hinge * p;
        p.x += pivot;
        n = hinge * n;
      }
      mat3 attitude = rotateY(uRotation.y) * rotateX(uRotation.x);
      p = attitude * p;
      n = attitude * n;
      p.y += uFloat;
      vPosition = p;
      vNormal = n;
      vColor = aColor;
      gl_Position = vec4(p.x * .52 / max(uAspect, 1.), p.y * .52, -p.z * .18, 1.);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying vec3 vPosition;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 view = normalize(vec3(0., 0., 5.) - vPosition);
      vec3 key = normalize(vec3(-.56, .79, 1.2));
      vec3 fill = normalize(vec3(.83, -.2, .72));
      float diffuse = max(dot(n, key), 0.);
      float bounce = max(dot(n, fill), 0.);
      float rim = pow(1. - max(dot(n, view), 0.), 2.2);
      float spec = pow(max(dot(reflect(-key, n), view), 0.), 28.);
      float strip = pow(max(dot(reflect(-fill, n), view), 0.), 74.);
      vec3 color = vColor * (.49 + .56 * diffuse + .18 * bounce);
      color += vec3(1., .83, .58) * spec * .54;
      color += vec3(.67, .88, .96) * strip * .42;
      color += vec3(.56, .72, .75) * rim * .22;
      color = color / (color + vec3(.48));
      gl_FragColor = vec4(pow(color, vec3(.94)), 1.);
    }
  `;

  const palette = {
    void: [.045, .075, .088], graphite: [.105, .14, .16], carbon: [.14, .2, .22],
    teal: [.17, .31, .34], petrol: [.09, .21, .25], ceramic: [.68, .76, .72],
    silver: [.55, .64, .65], titanium: [.36, .46, .48], brass: [.73, .47, .22],
    gold: [.91, .66, .31], light: [.42, .9, .88], amber: [.98, .4, .17]
  };
  const positions = [], normals = [], colors = [], wings = [], indices = [];
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const normalise = v => { const length = Math.hypot(...v) || 1; return v.map(x => x / length); };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function vertex(p, n, color, wing) {
    const index = positions.length / 3;
    positions.push(...p); normals.push(...normalise(n)); colors.push(...color); wings.push(wing);
    return index;
  }
  function triangle(a, b, c, color, wing) {
    const n = normalise(cross(sub(b, a), sub(c, a)));
    indices.push(vertex(a, n, color, wing), vertex(b, n, color, wing), vertex(c, n, color, wing));
  }
  function panel(points, face, edge, wing, thickness = .035) {
    const center = points.reduce((sum, p) => sum.map((v, i) => v + p[i] / points.length), [0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      triangle(center, a, b, i % 3 === 0 ? mix(face, palette.teal, .24) : face, wing);
      const back = p => [p[0], p[1], p[2] - thickness];
      triangle(back(center), back(b), back(a), edge, wing);
      triangle(a, back(a), b, edge, wing);
      triangle(b, back(a), back(b), edge, wing);
    }
  }
  function tube(path, radius, color, wing = 0, sides = 7) {
    if (path.length < 2) return;
    const start = positions.length / 3;
    for (let i = 0; i < path.length; i++) {
      const tangent = normalise(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(0, i - 1)]));
      const reference = Math.abs(tangent[2]) > .85 ? [0, 1, 0] : [0, 0, 1];
      const u = normalise(cross(tangent, reference)), v = normalise(cross(tangent, u));
      for (let j = 0; j < sides; j++) {
        const angle = j * Math.PI * 2 / sides;
        const n = u.map((value, k) => value * Math.cos(angle) + v[k] * Math.sin(angle));
        vertex(path[i].map((value, k) => value + n[k] * radius), n, color, wing);
      }
    }
    for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < sides; j++) {
      const a = start + i * sides + j, b = start + i * sides + (j + 1) % sides;
      const c = a + sides, d = b + sides;
      indices.push(a, b, c, b, d, c);
    }
  }
  const rod = (a, b, radius, color, wing = 0) => tube([a, b], radius, color, wing);
  function ellipsoid(center, radii, color, wing = 0, slices = 12, stacks = 7) {
    const start = positions.length / 3;
    for (let i = 0; i <= stacks; i++) {
      const latitude = Math.PI * i / stacks;
      for (let j = 0; j <= slices; j++) {
        const longitude = Math.PI * 2 * j / slices;
        const direction = [Math.sin(latitude) * Math.cos(longitude), Math.cos(latitude), Math.sin(latitude) * Math.sin(longitude)];
        vertex(center.map((v, k) => v + direction[k] * radii[k]), direction.map((v, k) => v / radii[k]), color, wing);
      }
    }
    for (let i = 0; i < stacks; i++) for (let j = 0; j < slices; j++) {
      const a = start + i * (slices + 1) + j, b = a + slices + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  function ring(center, radii, color, wing, radius = .012, steps = 20) {
    tube(Array.from({ length: steps + 1 }, (_, i) => {
      const angle = i * Math.PI * 2 / steps;
      return [center[0] + Math.cos(angle) * radii[0], center[1] + Math.sin(angle) * radii[1], center[2]];
    }), radius, color, wing, 5);
  }

  const upper = [[.13,.27],[.31,.7],[.65,1.24],[1.04,1.49],[1.45,1.4],[1.79,1.04],[1.82,.66],[1.55,.35],[1.13,.21],[.59,.16]];
  const lower = [[.14,.12],[.59,.13],[1.12,.08],[1.52,-.19],[1.68,-.61],[1.42,-1.13],[1.01,-1.25],[.67,-.94],[.34,-.52],[.16,-.22]];
  for (const side of [-1, 1]) {
    const point = (p, z) => [p[0] * side, p[1], z];
    for (const [outline, center, tint] of [
      [upper, [.85,.78], palette.petrol], [lower, [.83,-.48], palette.teal]
    ]) {
      // Individual inset panels leave dark, precise seams between the titanium ribs.
      const c = point(center, .015);
      for (let i = 0; i < outline.length; i++) {
        const a = point(outline[i], .015), b = point(outline[(i + 1) % outline.length], .015);
        const tile = [mix(c, a, .15), mix(c, a, .84), mix(c, b, .84), mix(c, b, .15)];
        panel(tile, i % 4 === 0 ? palette.carbon : tint, palette.void, side);
        if (i % 2 === 0) {
          const seam = [mix(c, a, .24), mix(c, a, .7), mix(c, b, .7), mix(c, b, .24)];
          panel(seam.map(p => [p[0], p[1], p[2] + .048]), i % 4 === 0 ? palette.titanium : palette.graphite, palette.void, side, .012);
        }
        if (i > 1 && i < outline.length - 1) {
          const rivet = mix(c, a, .78);
          ellipsoid([rivet[0], rivet[1], .09], [.023,.023,.012], palette.gold, side, 7, 4);
        }
      }
      tube(outline.map(p => point(p, .06)).concat([point(outline[0], .06)]), .027, palette.silver, side);
      tube(outline.map(p => point(p, -.015)).concat([point(outline[0], -.015)]), .013, palette.brass, side, 5);
      for (let i = 1; i < outline.length; i += 2) {
        const target = point(outline[i], .075);
        tube([point([.17,.11], .08), mix(point([.17,.11], .08), target, .5).map((v, k) => k === 2 ? v + .07 : v), target], .016, i % 3 ? palette.titanium : palette.brass, side, 6);
      }
      for (const fraction of [.38,.63]) {
        const arc = outline.slice(1, -1).map(p => mix(c, point(p, .1), fraction));
        tube(arc, fraction === .38 ? .012 : .009, fraction === .38 ? palette.brass : palette.silver, side, 5);
      }
    }
    // Wing drive: toothed bearing, linked levers, concentric seals and amber axis light.
    const hinge = [side * .19, .08, .19];
    ring(hinge, [.14,.14], palette.brass, side, .028, 24);
    ring([hinge[0],hinge[1],.205], [.105,.105], palette.graphite, side, .022, 24);
    ellipsoid([hinge[0],hinge[1],.24], [.062,.062,.035], palette.gold, side);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      ellipsoid([hinge[0]+Math.cos(angle)*.147,hinge[1]+Math.sin(angle)*.147,.2], [.025,.025,.027], palette.silver, side, 6, 4);
    }
    rod([side*.28,.06,.15],[side*.83,.74,.17],.027,palette.brass,side);
    rod([side*.28,-.02,.13],[side*.95,-.48,.16],.023,palette.titanium,side);
    for (const [x,y] of [[1.39,1.16],[1.55,.7],[1.31,-.85],[.95,-.93]]) {
      const c = [x*side,y,.125];
      ring(c,[.065,.065],palette.brass,side,.012,14);
      ellipsoid([c[0],c[1],.128],[.027,.027,.014],palette.amber,side,8,4);
    }
  }

  // Segmented abdomen, exposed lateral actuators and a ceramic thorax shell.
  ellipsoid([0,-.38,.02],[.17,.68,.2],palette.graphite);
  ellipsoid([0,.18,.13],[.22,.39,.23],palette.titanium);
  ellipsoid([0,.21,.32],[.125,.29,.065],palette.ceramic);
  for (let i = 0; i < 7; i++) {
    const y = -.13 - i*.115, taper = 1 - i*.085;
    ellipsoid([0,y,.15],[.16*taper,.058,.115*taper],i%2 ? palette.titanium : palette.silver,0,12,6);
    ring([0,y,.25],[.095*taper,.034],palette.brass,0,.011,16);
  }
  for (const side of [-1,1]) {
    rod([side*.15,.48,.04],[side*.24,-.48,.04],.032,palette.brass);
    for (let i = 0; i < 4; i++) {
      const y = .38 - i*.19;
      rod([side*.19,y,.23],[side*.29,y-.09,.12],.014,palette.silver);
      ellipsoid([side*.19,y,.23],[.027,.027,.027],palette.gold);
    }
    const antenna = Array.from({length:18},(_,i) => {
      const t=i/17;
      return [side*(.075+.12*t+.27*t*t),.62+.39*t+.38*t*t,.04+.12*t];
    });
    tube(antenna,.012,palette.silver,0,6);
    ellipsoid(antenna.at(-1),[.037,.037,.037],palette.amber);
    rod([side*.1,.58,.12],[side*.27,.72,.16],.014,palette.brass);
  }
  ellipsoid([0,.6,.11],[.18,.17,.2],palette.graphite);
  ellipsoid([0,.64,.25],[.105,.085,.065],palette.ceramic);
  for (const side of [-1,1]) {
    ellipsoid([side*.11,.64,.27],[.055,.047,.044],palette.light,0,10,6);
    ring([side*.11,.64,.29],[.055,.047],palette.brass,0,.01,16);
  }
  ring([0,.22,.39],[.068,.15],palette.brass,0,.012,20);
  ellipsoid([0,.2,.405],[.034,.08,.022],palette.amber);

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertexShader); gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Butterfly shader linking failed');
    if (positions.length / 3 > 65535) throw new Error('Butterfly mesh exceeds WebGL index limit');
    gl.useProgram(program);
    for (const [name, data, size] of [
      ['aPosition', positions, 3], ['aNormal', normals, 3]
    ]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, name);
      if (attribute >= 0) { gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0); }
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    for (const [name, data, size] of [['aColor',colors,3],['aWing',wings,1]]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, name);
      if (attribute >= 0) { gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0); }
    }
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0);
  } catch (_) { fallback(); return; }

  const rotationUniform = gl.getUniformLocation(program,'uRotation');
  const aspectUniform = gl.getUniformLocation(program,'uAspect');
  const flapUniform = gl.getUniformLocation(program,'uFlap');
  const floatUniform = gl.getUniformLocation(program,'uFloat');
  let rotationX = -.08, rotationY = -.16, targetX = -.08, targetY = -.16;
  let hoverX = 0, hoverY = 0, phase = 0, frame = 0, previousTime = 0;
  let active = true, lost = false, dragging = false, pointerX = 0, pointerY = 0;
  const isPaused = () => root.dataset.motion === 'paused';
  function draw() {
    if (lost) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 600 ? 1.5 : 2);
    const width = Math.round(rect.width*dpr), height = Math.round(rect.height*dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height; gl.viewport(0,0,width,height);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(rotationUniform,rotationX+hoverY,rotationY+hoverX);
    gl.uniform1f(aspectUniform,width/height);
    gl.uniform1f(flapUniform,.13+.25*(.5+.5*Math.sin(phase*4.8)));
    gl.uniform1f(floatUniform,.025*Math.sin(phase*2.2));
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  }
  function tick(time) {
    frame = 0;
    if (!active || document.hidden || lost || isPaused()) return;
    const delta = Math.min(previousTime ? (time-previousTime)/1000 : 0,.045);
    previousTime = time;
    phase += delta;
    if (!dragging) {
      targetY = -.16 + Math.sin(phase*.48)*.1;
      targetX = -.08 + Math.sin(phase*.39)*.045;
    }
    rotationX += (targetX-rotationX)*.1;
    rotationY += (targetY-rotationY)*.1;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(frame); frame=0; }
  function resume() {
    if (!frame && active && !document.hidden && !lost && !isPaused()) {
      previousTime=0; frame=requestAnimationFrame(tick);
    }
  }
  function updateManual() { rotationX=targetX; rotationY=targetY; draw(); }
  canvas.addEventListener('pointerdown',event => {
    if (event.button !== 0) return;
    dragging=true; pointerX=event.clientX; pointerY=event.clientY;
    hoverX=0; hoverY=0; canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event => {
    if (dragging) {
      targetY=Math.max(-.72,Math.min(.72,targetY+(event.clientX-pointerX)*.006));
      targetX=Math.max(-.55,Math.min(.55,targetX+(event.clientY-pointerY)*.006));
      pointerX=event.clientX; pointerY=event.clientY; updateManual();
    } else if (event.pointerType === 'mouse' && !isPaused()) {
      const rect=canvas.getBoundingClientRect();
      hoverX=((event.clientX-rect.left)/rect.width-.5)*.12;
      hoverY=((event.clientY-rect.top)/rect.height-.5)*.09;
    }
  });
  const release=() => { dragging=false; };
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('pointerleave',() => { hoverX=0; hoverY=0; });
  canvas.addEventListener('keydown',event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key==='ArrowLeft') targetY-=.12;
    if (event.key==='ArrowRight') targetY+=.12;
    if (event.key==='ArrowUp') targetX-=.12;
    if (event.key==='ArrowDown') targetX+=.12;
    if (event.key==='Home') { targetX=-.08; targetY=-.16; }
    targetX=Math.max(-.55,Math.min(.55,targetX));
    targetY=Math.max(-.72,Math.min(.72,targetY));
    updateManual();
  });
  window.addEventListener('lab:motion',() => { if (isPaused()) stop(); else resume(); });
  document.addEventListener('visibilitychange',() => { if (document.hidden) stop(); else resume(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    active=entries[0].isIntersecting; if (active) resume(); else stop();
  },{rootMargin:'80px'}).observe(canvas);
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
  else window.addEventListener('resize',draw,{passive:true});
  canvas.addEventListener('webglcontextlost',event => {
    event.preventDefault(); lost=true; stop();
    stage.classList.remove('sculpture-ready'); fallback();
  });
  draw(); stage.classList.add('sculpture-ready'); resume();
})();
