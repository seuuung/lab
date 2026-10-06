'use strict';
/* Three.js citrus tree. The SVG scene remains available when WebGL or the CDN is unavailable. */
(() => {
  const stage = document.querySelector('.tree-stage');
  const fallback = document.getElementById('citrus-tree');
  if (!stage || !fallback || !window.THREE) return;
  const T = window.THREE;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (_) {
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setClearColor(0xffffff, 0);
  renderer.domElement.className = 'tree-canvas';
  renderer.domElement.setAttribute('aria-label', '3D 귤나무. 열매를 누르거나 나무를 드래그해 흔들 수 있습니다.');
  renderer.domElement.setAttribute('role', 'img');
  stage.insertBefore(renderer.domElement, fallback);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, .1, 100);
  const root = new T.Group();
  scene.add(root);
  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();
  const count = document.getElementById('fruit-count');
  const bark = new T.MeshStandardMaterial({ color: 0x874225, roughness: .84, metalness: 0 });
  const barkLight = new T.MeshStandardMaterial({ color: 0xc0734d, roughness: .86 });
  const leafColors = [0x0e4d2e, 0x236b38, 0x185737, 0x397a42, 0x1d6239, 0x4b813b];
  const leafMaterials = leafColors.map(color => new T.MeshStandardMaterial({ color, roughness: .78, side: T.DoubleSide }));
  const calyxMaterial = new T.MeshStandardMaterial({ color: 0x427a46, roughness: .72, side: T.DoubleSide });
  const fruitMaterial = new T.MeshStandardMaterial({ color: 0xff4e12, roughness: .24, metalness: .02 });
  const groundMaterial = new T.MeshStandardMaterial({ color: 0xe38767, roughness: .92, side: T.DoubleSide });
  let seed = 1907;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const fruits = [];
  const fruitTargets = [];
  const fruitAnchors = [];
  const falling = [];
  let harvested = 0;
  let frame = 0;
  let lastTime = 0;
  let visible = true;
  let drag = null;
  const pull = { x: 0, z: 0, vx: 0, vz: 0, targetX: 0, targetZ: 0 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const paused = () => document.documentElement.dataset.motion === 'paused' || matchMedia('(prefers-reduced-motion: reduce)').matches;

  scene.add(new T.HemisphereLight(0xfff9ee, 0x6c7460, .32));
  const sun = new T.DirectionalLight(0xfff4e2, .76);
  sun.position.set(-3.5, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -5;
  sun.shadow.normalBias = .045;
  sun.shadow.bias = -.0002;
  sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new T.DirectionalLight(0xe7f5df, .13);
  fill.position.set(5, 4, -3);
  scene.add(fill);
  const rim = new T.DirectionalLight(0xffc69c, .1);
  rim.position.set(2, 5, -5);
  scene.add(rim);

  const island = new T.Mesh(new T.SphereGeometry(1, 48, 16), groundMaterial);
  island.scale.set(2.6, .105, 1.55);
  island.position.y = -.12;
  island.receiveShadow = true;
  scene.add(island);
  const groundShadow = new T.Mesh(
    new T.CircleGeometry(3.6, 64),
    new T.MeshBasicMaterial({ color: 0x9c755e, transparent: true, opacity: .055, depthWrite: false })
  );
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.set(.2, -.22, -.15);
  groundShadow.scale.y = .64;
  scene.add(groundShadow);

  // Curved strips give the citrus leaves a smooth outline and a raised midrib.
  const leafGeometry = new T.BufferGeometry();
  const leafVertices = [];
  const leafIndices = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const width = .12 * Math.pow(Math.sin(Math.PI * t), .85);
    const x = t * .47;
    const curve = Math.sin(Math.PI * t) * .035;
    leafVertices.push(x, width, -.012, x, 0, curve, x, -width, -.012);
    if (i < 8) {
      const a = i * 3, b = a + 3;
      leafIndices.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  }
  leafGeometry.setAttribute('position', new T.Float32BufferAttribute(leafVertices, 3));
  leafGeometry.setIndex(leafIndices);
  leafGeometry.computeVertexNormals();
  const fruitGeometry = new T.SphereGeometry(1, 24, 16);
  const stemGeometry = new T.CylinderGeometry(.012, .02, .12, 6);

  function taperedTube(points, bottom, top, material) {
    const curve = new T.CatmullRomCurve3(points);
    const vertices = [];
    const indices = [];
    const sides = 12;
    const segments = Math.max(8, points.length * 5);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const at = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const across = new T.Vector3(0, 0, 1).cross(tangent).normalize();
      const around = tangent.clone().cross(across).normalize();
      const radius = (bottom * (1 - t) + top * t) * (1 + Math.sin(Math.PI * t) * .035);
      for (let side = 0; side <= sides; side++) {
        const theta = side / sides * Math.PI * 2;
        const point = at.clone().addScaledVector(across, Math.cos(theta) * radius).addScaledVector(around, Math.sin(theta) * radius);
        vertices.push(point.x, point.y, point.z);
        if (i < segments && side < sides) {
          const a = i * (sides + 1) + side;
          const b = a + sides + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  }
  function cylinder(start, end, bottom, top, material, castShadow = true) {
    const direction = new T.Vector3().subVectors(end, start);
    const mesh = new T.Mesh(new T.CylinderGeometry(top, bottom, direction.length(), 9, 1), material);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = castShadow;
    root.add(mesh);
    return mesh;
  }
  function leafAt(position, angle, scale, material) {
    const leaf = new T.Mesh(leafGeometry, material);
    leaf.position.copy(position);
    leaf.rotation.set((random() - .5) * .85, (random() - .5) * 1.35, angle);
    leaf.scale.setScalar(scale);
    leaf.receiveShadow = true;
    root.add(leaf);
  }
  function leafCluster(center, size = 1) {
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.399 + random() * .45;
      const radius = (.1 + random() * .47) * size;
      const at = center.clone().add(new T.Vector3(Math.cos(angle) * radius, (random() - .5) * .45 * size, Math.sin(angle) * radius * .8));
      leafAt(at, angle + (random() - .5) * .8, (.72 + random() * .54) * size, leafMaterials[Math.floor(random() * leafMaterials.length)]);
    }
  }
  function addFruit(anchor, position, radius) {
    const group = new T.Group();
    group.position.copy(position);
    const sphere = new T.Mesh(fruitGeometry, fruitMaterial);
    sphere.scale.set(radius, radius * 1.03, radius);
    sphere.castShadow = true;
    group.add(sphere);
    const stem = new T.Mesh(stemGeometry, bark);
    stem.position.y = radius + .045;
    group.add(stem);
    for (let i = 0; i < 5; i++) {
      const leaf = new T.Mesh(leafGeometry, calyxMaterial);
      leaf.position.set(0, radius + .02, 0);
      leaf.rotation.set(-.5, i * Math.PI * 2 / 5, i * Math.PI * 2 / 5);
      leaf.scale.setScalar(.32);
      group.add(leaf);
    }
    root.add(group);
    const twig = cylinder(
      anchor,
      position.clone().add(new T.Vector3(0, radius + .1, 0)),
      .018, .009, bark, false
    );
    const fruit = { group, sphere, twig, home: position.clone(), radius, attached: true, velocity: new T.Vector3(), spin: 0 };
    sphere.userData.fruit = fruit;
    fruits.push(fruit);
    fruitTargets.push(sphere);
  }

  taperedTube([
    new T.Vector3(-.02, -.02, 0), new T.Vector3(.07, .8, .02),
    new T.Vector3(.05, 1.42, -.015), new T.Vector3(-.04, 2.07, 0)
  ], .29, .15, bark);
  cylinder(new T.Vector3(-.08, .13, .17), new T.Vector3(-.02, 1.7, .19), .025, .012, barkLight, false);
  cylinder(new T.Vector3(.08, .14, -.09), new T.Vector3(.05, 1.65, -.11), .018, .009, barkLight, false);

  function branch(start, vector, radius, depth) {
    const end = start.clone().add(vector);
    const midpoint = start.clone().lerp(end, .53).add(new T.Vector3((random() - .5) * .1, .035, (random() - .5) * .12));
    taperedTube([start, midpoint, end], radius, radius * .58, bark);
    if (depth <= 2) leafCluster(end, depth === 2 ? .72 : depth ? .93 : 1.12);
    if (Math.abs(end.x) < 3.35 && end.y > 2.8 && end.y < 5) fruitAnchors.push(end.clone());
    if (!depth) return;
    for (let side of [-1, 1]) {
      const next = vector.clone().multiplyScalar(depth === 2 ? .64 : .62);
      next.x += side * (depth === 2 ? .38 : .3) + (random() - .5) * .18;
      next.y = Math.max(.34, next.y * .68 + random() * .22);
      next.z += (random() - .5) * .52;
      branch(end, next, radius * .58, depth - 1);
    }
  }
  const origin = new T.Vector3(-.04, 1.96, 0);
  [
    [-1.67, 1.12, -.27], [-1.18, 1.5, .22], [-.35, 1.7, -.4],
    [.43, 1.75, .1], [1.14, 1.51, -.37], [1.68, 1.08, .3]
  ].forEach(([x, y, z], i) => branch(origin.clone().add(new T.Vector3((i - 2.5) * .035, 0, 0)), new T.Vector3(x, y, z), .15, 2));
  // Select real branch tips against an editorial spread, rather than placing floating fruit.
  const fruitLayout = [
    [-2.8, 3.2], [-2.55, 3.85], [-2.1, 2.65], [-1.8, 4.15],
    [-1.4, 3.55], [-1.05, 4.2], [-.7, 2.65], [-.35, 3.9],
    [.18, 4.25], [.55, 2.65], [.9, 3.8], [1.25, 4.25],
    [1.65, 2.65], [1.95, 3.85], [2.4, 2.65], [2.75, 3.75]
  ];
  const availableAnchors = fruitAnchors.slice();
  for (const [targetX, targetY] of fruitLayout) {
    if (!availableAnchors.length) break;
    const drop = targetY < 3 ? .43 + random() * .1 : .22 + random() * .1;
    let best = 0, bestScore = Infinity;
    for (let i = 0; i < availableAnchors.length; i++) {
      const anchor = availableAnchors[i];
      const score = (anchor.x - targetX) ** 2 + (anchor.y - targetY - drop) ** 2 * .85 +
        (anchor.z - .45) ** 2 * .28;
      if (score < bestScore) { best = i; bestScore = score; }
    }
    const anchor = availableAnchors.splice(best, 1)[0];
    const radius = .185 + random() * .035;
    const position = anchor.clone().add(new T.Vector3((random() - .5) * .1, -drop, .18 + random() * .2));
    addFruit(anchor, position, radius);
  }

  function sizeScene() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 3.25, width < 600 ? Math.max(14.5, 14.5 * 374 / width) : 12.4);
    camera.lookAt(0, 2.35, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  function settle(fruit) {
    fruit.group.position.y = fruit.radius + .02;
    fruit.group.rotation.z = 0;
  }
  function pluck(fruit) {
    if (!fruit.attached) return;
    fruit.group.updateWorldMatrix(true, false);
    const worldPosition = fruit.group.getWorldPosition(new T.Vector3());
    root.remove(fruit.group);
    scene.add(fruit.group);
    fruit.group.position.copy(worldPosition);
    fruit.twig.visible = false;
    fruit.attached = false;
    count.textContent = String(++harvested).padStart(2, '0');
    if (paused()) {
      settle(fruit);
      renderer.render(scene, camera);
    } else {
      fruit.velocity.set((random() - .5) * .055, .02, (random() - .5) * .045);
      fruit.spin = (random() - .5) * .12;
      falling.push(fruit);
      schedule();
    }
  }
  function dropFruit() {
    const available = fruits.filter(fruit => fruit.attached);
    for (let i = 0; i < Math.min(3, available.length); i++) {
      pluck(available.splice(Math.floor(random() * available.length), 1)[0]);
    }
  }
  function reset() {
    falling.length = 0;
    harvested = 0;
    count.textContent = '00';
    fruits.forEach(fruit => {
      scene.remove(fruit.group);
      root.add(fruit.group);
      fruit.group.position.copy(fruit.home);
      fruit.group.rotation.set(0, 0, 0);
      fruit.twig.visible = true;
      fruit.attached = true;
    });
    root.rotation.set(0, 0, 0);
    Object.assign(pull, { x: 0, z: 0, vx: 0, vz: 0, targetX: 0, targetZ: 0 });
    drag = null;
    renderer.render(scene, camera);
  }
  function render(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min((time - (lastTime || time)) / 16.67, 2);
    lastTime = time;
    if (!paused()) {
      const stiffness = drag ? .18 : .065;
      const damping = Math.pow(drag ? .72 : .84, dt);
      pull.vz = (pull.vz + (pull.targetZ - pull.z) * stiffness * dt) * damping;
      pull.vx = (pull.vx + (pull.targetX - pull.x) * stiffness * dt) * damping;
      pull.z += pull.vz * dt;
      pull.x += pull.vx * dt;
      root.rotation.z = pull.z + (drag ? 0 : Math.sin(time * .0009) * .02);
      root.rotation.x = pull.x + (drag ? 0 : Math.sin(time * .0007 + 1.2) * .006);
      if (!drag) root.rotation.y += (Math.sin(time * .00055 + .4) * .014 - root.rotation.y) * Math.min(1, .045 * dt);
      for (let i = falling.length - 1; i >= 0; i--) {
        const fruit = falling[i];
        fruit.velocity.y -= .0095 * dt;
        fruit.group.position.addScaledVector(fruit.velocity, dt);
        fruit.group.rotation.z += fruit.spin * dt;
        if (fruit.group.position.y <= fruit.radius + .02) {
          fruit.group.position.y = fruit.radius + .02;
          fruit.velocity.y *= -.36;
          fruit.velocity.x *= .82;
          if (Math.abs(fruit.velocity.y) < .012) {
            settle(fruit);
            falling.splice(i, 1);
          }
        }
      }
    }
    renderer.render(scene, camera);
    if (!paused()) schedule();
  }
  function schedule() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(fruitTargets.filter(mesh => mesh.userData.fruit.attached), false)[0];
    if (hit) pluck(hit.object.userData.fruit);
  }
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, distance: 0 };
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!drag) return;
    drag.distance = Math.max(drag.distance, Math.hypot(event.clientX - drag.x, event.clientY - drag.y));
    if (drag.distance > 6) {
      const rect = renderer.domElement.getBoundingClientRect();
      pull.targetZ = clamp((drag.x - event.clientX) / rect.width * .85, -.2, .2);
      pull.targetX = clamp((event.clientY - drag.y) / rect.height * .6, -.15, .15);
      root.rotation.y = clamp(root.rotation.y + (event.clientX - drag.lastX) * .0018, -.34, .34);
      if (paused()) {
        pull.z = pull.targetZ;
        pull.x = pull.targetX;
        root.rotation.z = pull.z;
        root.rotation.x = pull.x;
        renderer.render(scene, camera);
      } else schedule();
    }
    drag.lastX = event.clientX;
  });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!drag) return;
    const distance = Math.max(drag.distance, Math.hypot(event.clientX - drag.x, event.clientY - drag.y));
    const releasedZ = pull.z;
    drag = null;
    pull.targetZ = 0;
    pull.targetX = 0;
    if (distance > 25) {
      dropFruit();
      if (!paused()) pull.vz -= releasedZ * .12;
    }
    else if (distance < 8) pick(event);
    if (paused()) {
      pull.z = pull.x = 0;
      root.rotation.z = root.rotation.x = root.rotation.y = 0;
      renderer.render(scene, camera);
    } else schedule();
  });
  renderer.domElement.addEventListener('pointercancel', () => {
    drag = null;
    pull.targetZ = pull.targetX = 0;
    schedule();
  });
  document.getElementById('reset-tree').addEventListener('click', reset);
  window.addEventListener('lab:motion', () => {
    if (paused()) {
      falling.splice(0).forEach(settle);
      Object.assign(pull, { x: 0, z: 0, vx: 0, vz: 0, targetX: 0, targetZ: 0 });
      root.rotation.x = root.rotation.y = root.rotation.z = 0;
      renderer.render(scene, camera);
    } else schedule();
  });
  document.addEventListener('visibilitychange', () => { lastTime = 0; if (!document.hidden) schedule(); });
  if ('ResizeObserver' in window) new ResizeObserver(sizeScene).observe(stage);
  else window.addEventListener('resize', sizeScene);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    lastTime = 0;
    if (visible) schedule();
  }).observe(stage);
  sizeScene();
  stage.classList.add('tree-3d-ready');
  window.tree3dReady = true;
  schedule();
})();
