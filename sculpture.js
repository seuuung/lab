'use strict';
/* A real, locally rendered torus-knot sculpture. No CDN or 3D framework needed. */
(() => {
  const canvas = document.getElementById('sculpture');
  const stage = canvas.closest('.sculpture-stage');
  const root = document.documentElement;
  function showFallback() {
    canvas.removeAttribute('tabindex');
    canvas.setAttribute('aria-label', '금속 매듭 조형');
    stage.querySelector('.sculpture-note').hidden = true;
  }
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' }); }
  catch (_) { showFallback(); return; }
  if (!gl) {
    showFallback();
    return;
  }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform vec2 uRotation;
    uniform float uAspect;
    varying vec3 vNormal;
    varying vec3 vPosition;
    mat3 rotateX(float a) {
      float c = cos(a), s = sin(a);
      return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);
    }
    mat3 rotateY(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c,0.,-s, 0.,1.,0., s,0.,c);
    }
    mat3 rotateZ(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c,s,0., -s,c,0., 0.,0.,1.);
    }
    void main() {
      mat3 rotation = rotateZ(-.35) * rotateY(uRotation.y) * rotateX(uRotation.x);
      vec3 p = rotation * aPosition;
      vNormal = rotation * aNormal;
      vPosition = p;
      float focal = 1.85 * min(uAspect, 1.);
      float distance = 9.2 - p.z;
      gl_Position = vec4(p.x * focal / uAspect, p.y * focal + .12, (distance - 1.) * .88, distance);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    vec3 studio(vec3 r) {
      float sky = smoothstep(-.28, .65, r.y);
      vec3 color = mix(vec3(.12,.145,.115), vec3(.82,.86,.78), sky);
      float horizon = exp(-pow((r.y + .04) * 7., 2.));
      color *= 1. - horizon * .78;
      float softbox = pow(max(0., dot(r, normalize(vec3(-.45,.6,1.)))), 12.);
      color += vec3(1.1,1.08,.92) * softbox * 1.8;
      float strip = pow(max(0., dot(r, normalize(vec3(.75,.35,.7)))), 44.);
      color += vec3(.95,.99,.86) * strip * 2.;
      float warm = pow(max(0., dot(r, normalize(vec3(.7,-.25,.8)))), 5.);
      color = mix(color, vec3(.92,.25,.09), warm * .68);
      float edge = pow(max(0., dot(r, normalize(vec3(-.8,-.1,-.4)))), 12.);
      color += vec3(.65,.75,.66) * edge;
      return color;
    }
    void main() {
      vec3 n = normalize(vNormal);
      vec3 view = normalize(vec3(0.,0.,9.2) - vPosition);
      vec3 reflection = reflect(-view, n);
      float facing = max(dot(n,view),0.);
      float fresnel = pow(1. - facing, 3.);
      vec3 color = studio(reflection);
      float diffuse = max(0.,dot(n,normalize(vec3(-.5,.8,1.))));
      color = color * (.82 + fresnel * .32) + vec3(.09,.105,.075) * diffuse;
      color *= .84 + .16 * smoothstep(-1.,2.,vPosition.y);
      color = color / (color + vec3(.6));
      color = pow(color,vec3(.82));
      gl_FragColor = vec4(color,1.);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  // Parallel-transport-like radial frame avoids poles along the knot's path.
  const center = t => [(2 + Math.cos(3 * t)) * Math.cos(2 * t), (2 + Math.cos(3 * t)) * Math.sin(2 * t), Math.sin(3 * t)];
  const normalize = v => { const length = Math.hypot(...v); return v.map(x => x / length); };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const positions = [], normals = [], indices = [];
  const segments = 300, sides = 24;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2;
    const p = center(t), next = center(t + .001), prev = center(t - .001);
    const tangent = normalize(next.map((value, j) => value - prev[j]));
    const normal = normalize(cross(tangent, [0, 0, 1]));
    const binormal = normalize(cross(tangent, normal));
    for (let j = 0; j <= sides; j++) {
      const a = j / sides * Math.PI * 2;
      const n = normal.map((value, k) => value * Math.cos(a) + binormal[k] * Math.sin(a));
      positions.push(...p.map((value, k) => (value + n[k] * .49) * .96));
      normals.push(...n);
      if (i < segments && j < sides) {
        const index = i * (sides + 1) + j;
        indices.push(index, index + 1, index + sides + 1, index + 1, index + sides + 2, index + sides + 1);
      }
    }
  }
  let program;
  try {
    program = gl.createProgram();
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
    gl.useProgram(program);
    for (const [name, data] of [['aPosition', positions], ['aNormal', normals]]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  } catch (_) {
    showFallback();
    return;
  }

  const rotationUniform = gl.getUniformLocation(program, 'uRotation');
  const aspectUniform = gl.getUniformLocation(program, 'uAspect');
  let rotationX = .45, rotationY = -.2, targetX = .45, targetY = -.2;
  let frame = 0, previousTime = 0, active = true, lost = false, dragging = false;
  let pointerX = 0, pointerY = 0, hoverX = 0, hoverY = 0;
  const isPaused = () => root.dataset.motion === 'paused';

  function draw() {
    if (lost) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 600 ? 1.5 : 2);
    const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(rotationUniform, rotationX + hoverY, rotationY + hoverX);
    gl.uniform1f(aspectUniform, width / height);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
  function tick(time) {
    frame = 0;
    if (!active || document.hidden || lost || isPaused()) return;
    const delta = Math.min(previousTime ? (time - previousTime) / 1000 : 0, .045);
    previousTime = time;
    if (!dragging) targetY += delta * .09;
    rotationX += (targetX - rotationX) * .1;
    rotationY += (targetY - rotationY) * .1;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (!frame && active && !document.hidden && !lost && !isPaused()) {
      previousTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function updateManual() {
    rotationX = targetX;
    rotationY = targetY;
    draw();
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = true;
    pointerX = event.clientX; pointerY = event.clientY;
    hoverX = 0; hoverY = 0;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (dragging) {
      const dx = event.clientX - pointerX, dy = event.clientY - pointerY;
      targetY += dx * .008;
      targetX = Math.max(-1.3, Math.min(1.3, targetX + dy * .008));
      pointerX = event.clientX; pointerY = event.clientY;
      updateManual();
    } else if (event.pointerType === 'mouse' && !isPaused()) {
      const rect = canvas.getBoundingClientRect();
      hoverX = ((event.clientX - rect.left) / rect.width - .5) * .13;
      hoverY = ((event.clientY - rect.top) / rect.height - .5) * .1;
    }
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', () => { hoverX = 0; hoverY = 0; });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') targetY -= .15;
    if (event.key === 'ArrowRight') targetY += .15;
    if (event.key === 'ArrowUp') targetX -= .15;
    if (event.key === 'ArrowDown') targetX += .15;
    if (event.key === 'Home') { targetX = .45; targetY = -.2; }
    targetX = Math.max(-1.3, Math.min(1.3, targetX));
    updateManual();
  });
  window.addEventListener('lab:motion', () => { if (isPaused()) stop(); else resume(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else resume(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
      if (active) resume(); else stop();
    }, { rootMargin: '80px' }).observe(canvas);
  }
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
  else window.addEventListener('resize', draw, { passive: true });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; stop();
    stage.classList.remove('sculpture-ready');
    canvas.removeAttribute('tabindex');
    canvas.setAttribute('aria-label', '금속 매듭 조형');
    stage.querySelector('.sculpture-note').hidden = true;
  });
  // Keep the graceful CSS fallback after context loss; a reload reinitializes WebGL.
  draw();
  stage.classList.add('sculpture-ready');
  resume();
})();
