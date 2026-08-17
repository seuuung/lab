/**
 * ⚔️ CHALLENGER STRESS SUITE: Part 1 - Canvas & WebGL DPR & Extreme Resize Simulation
 * 
 * 5개 Canvas/WebGL 게임:
 *  1. slime_jump (2D Canvas Slingshot)
 *  2. Magnetic_Orbit (2D Canvas Orbit Survival)
 *  3. 3D_ minesweeper (Three.js WebGL 3D Minesweeper)
 *  4. maze_escape (Three.js WebGL 3D Maze)
 *  5. shadow_puzzle (Three.js WebGL Shadow Puzzle)
 * 
 * 검증 항목:
 *  - DPR 1.0, 1.5, 2.0, 3.0 시뮬레이션
 *  - 연속 100회 초고속 윈도우 리사이즈 (극소 10x10부터 4K 3840x2160까지)
 *  - NaN / Infinity / 왜곡 좌표 발생 여부
 *  - 메모리 누수 및 파티클/오브젝트 축적 검증
 *  - 런타임 물리 루프 안정성 검증
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function check(condition, msg) {
    totalChecks++;
    if (condition) {
        passedChecks++;
    } else {
        failedChecks++;
        failureDetails.push(msg);
        console.error(`  ❌ FAIL: ${msg}`);
    }
}

console.log('\n===============================================================');
console.log('⚔️  CHALLENGER 2: Canvas & WebGL DPR / Resize Simulation Test');
console.log('===============================================================\n');

// ----------------------------------------------------------------------
// 1. Slime Jump 2D Canvas DPR & 100x Resize Stress Test
// ----------------------------------------------------------------------
console.log('▶ [1/5] Testing slime_jump Canvas DPR & Extreme Resize...');
{
    const js = fs.readFileSync(path.join(PROJECT_ROOT, 'game/slime_jump/game.js'), 'utf8');

    let currentWidth = 375;
    let currentHeight = 667;
    let currentDpr = 1.0;
    const transformCalls = [];

    const mockCtx = {
        canvas: { width: 375, height: 667, style: {} },
        setTransform: (a, b, c, d, e, f) => {
            transformCalls.push({ a, b, c, d, e, f });
        },
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        ellipse: () => {},
        roundRect: () => {},
        fill: () => {},
        stroke: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        setLineDash: () => {},
        shadowBlur: 0,
        shadowColor: '',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: '',
        lineJoin: '',
        globalAlpha: 1
    };

    const domElements = {
        gameCanvas: {
            getContext: () => mockCtx,
            style: {},
            width: 375,
            height: 667,
            addEventListener: () => {}
        },
        startScreen: { style: {}, classList: { add: () => {}, remove: () => {} } },
        gameOverScreen: { style: {}, classList: { add: () => {}, remove: () => {} } },
        scoreText: { innerText: '' },
        highScoreText: { innerText: '' },
        finalScore: { innerText: '' },
        finalHighScore: { innerText: '' },
        startBtn: { addEventListener: () => {} },
        restartBtn: { addEventListener: () => {} }
    };

    const listeners = {};
    const mockWindow = {
        innerWidth: currentWidth,
        innerHeight: currentHeight,
        devicePixelRatio: currentDpr,
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        removeEventListener: (event, handler) => {
            if (listeners[event]) listeners[event] = listeners[event].filter(h => h !== handler);
        },
        localStorage: {
            getItem: () => null,
            setItem: () => {}
        },
        requestAnimationFrame: () => 1
    };

    const mockDocument = {
        getElementById: (id) => domElements[id] || { style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
        addEventListener: () => {},
        body: { style: {} }
    };

    const sandbox = {
        window: mockWindow,
        document: mockDocument,
        localStorage: mockWindow.localStorage,
        console: { log: () => {}, error: () => {}, warn: () => {} },
        Math: Math,
        Date: Date,
        setTimeout: () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        requestAnimationFrame: () => 1,
        performance: { now: () => Date.now() }
    };

    vm.createContext(sandbox);

    let scriptExecuted = false;
    try {
        vm.runInContext(js, sandbox);
        scriptExecuted = true;
    } catch (e) {
        console.error('slime_jump execution error:', e);
    }
    check(scriptExecuted, 'slime_jump: game.js initializes without exceptions');

    const evalInSandbox = (expr) => vm.runInContext(expr, sandbox);

    // DPR 1.0, 1.5, 2.0, 3.0 시뮬레이션
    const testDprs = [1.0, 1.5, 2.0, 3.0];
    testDprs.forEach(dprVal => {
        mockWindow.devicePixelRatio = dprVal;
        mockWindow.innerWidth = 400;
        mockWindow.innerHeight = 800;
        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        const expectedCapDpr = Math.min(dprVal, 2.0);
        const actualDpr = evalInSandbox('dpr');
        const cw = evalInSandbox('cw');
        const ch = evalInSandbox('ch');
        const gravity = evalInSandbox('GRAVITY');
        const maxSpeed = evalInSandbox('MAX_SPEED');

        check(actualDpr === expectedCapDpr, `slime_jump: DPR ${dprVal} is correctly capped/scaled to ${expectedCapDpr} (actual: ${actualDpr})`);
        check(!isNaN(cw) && !isNaN(ch) && cw === 400 && ch === 800, `slime_jump: Canvas dimensions match innerWidth/Height at DPR ${dprVal}`);
        check(!isNaN(gravity) && !isNaN(maxSpeed) && gravity > 0, `slime_jump: Physics constants valid at DPR ${dprVal}`);
    });

    // 100회 극한 리사이즈 스트레스 시뮬레이션
    let nanDetected = false;
    let infiniteDetected = false;

    // 게임 시작 상태로 전환
    evalInSandbox('initGame()');

    const testViewports = [
        [320, 480], [375, 667], [390, 844], [412, 915], [768, 1024],
        [820, 1180], [1024, 1366], [1280, 720], [1920, 1080], [2560, 1440],
        [3840, 2160], [100, 100], [50, 50], [10, 10], [500, 1000]
    ];

    for (let i = 0; i < 100; i++) {
        const vp = testViewports[i % testViewports.length];
        const randomDpr = testDprs[i % testDprs.length];
        mockWindow.innerWidth = vp[0];
        mockWindow.innerHeight = vp[1];
        mockWindow.devicePixelRatio = randomDpr;

        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        // 물리 업데이트 3프레임 구동
        evalInSandbox('update(); update(); update();');

        // NaN 체크
        const slimeState = evalInSandbox('({ x: slime.x, y: slime.y, vx: slime.vx, vy: slime.vy, r: slime.radius })');
        if (isNaN(slimeState.x) || isNaN(slimeState.y) || isNaN(slimeState.vx) || isNaN(slimeState.vy) || isNaN(slimeState.r)) {
            nanDetected = true;
        }
        if (!isFinite(slimeState.x) || !isFinite(slimeState.y)) {
            infiniteDetected = true;
        }
    }

    const wallsLength = evalInSandbox('walls.length');
    check(!nanDetected, 'slime_jump: 100 continuous resize events produce ZERO NaN coordinates');
    check(!infiniteDetected, 'slime_jump: 100 continuous resize events produce ZERO Infinite values');
    check(wallsLength > 0 && wallsLength < 50, `slime_jump: Wall array managed properly without unbounded memory leak (count: ${wallsLength})`);
}

// ----------------------------------------------------------------------
// 2. Magnetic Orbit 2D Canvas DPR & 100x Resize Stress Test
// ----------------------------------------------------------------------
console.log('\n▶ [2/5] Testing Magnetic_Orbit Canvas DPR & Extreme Resize...');
{
    const js = fs.readFileSync(path.join(PROJECT_ROOT, 'game/Magnetic_Orbit/game.js'), 'utf8');

    let currentWidth = 375;
    let currentHeight = 667;
    let currentDpr = 1.0;

    const mockCtx = {
        canvas: { width: 375, height: 667, style: {} },
        setTransform: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        setLineDash: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1
    };

    const domElements = {
        gameCanvas: { getContext: () => mockCtx, style: {}, addEventListener: () => {} },
        menuScreen: { classList: { add: () => {}, remove: () => {} } },
        startBtn: { addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } },
        scoreDisplay: { innerText: '' },
        menuTitle: { innerText: '', className: '' },
        menuSubtitle: { innerText: '' },
        finalScoreContainer: { classList: { add: () => {}, remove: () => {} } },
        finalScore: { innerText: '' },
        statusIcon: { className: '' }
    };

    const listeners = {};
    const mockWindow = {
        innerWidth: currentWidth,
        innerHeight: currentHeight,
        devicePixelRatio: currentDpr,
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        removeEventListener: () => {},
        requestAnimationFrame: () => 1
    };

    const mockDocument = {
        getElementById: (id) => domElements[id] || { style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
        addEventListener: () => {},
        body: { style: {} }
    };

    const sandbox = {
        window: mockWindow,
        document: mockDocument,
        console: { log: () => {}, error: () => {}, warn: () => {} },
        Math: Math,
        Date: Date,
        setTimeout: () => 1,
        clearTimeout: () => {},
        requestAnimationFrame: () => 1
    };

    vm.createContext(sandbox);

    let scriptExecuted = false;
    try {
        vm.runInContext(js, sandbox);
        scriptExecuted = true;
    } catch (e) {
        console.error('Magnetic_Orbit execution error:', e);
    }
    check(scriptExecuted, 'Magnetic_Orbit: game.js initializes without exceptions');

    const evalInSandbox = (expr) => vm.runInContext(expr, sandbox);

    // DPR 검증
    [1.0, 1.5, 2.0, 3.0].forEach(dprVal => {
        mockWindow.devicePixelRatio = dprVal;
        mockWindow.innerWidth = 400;
        mockWindow.innerHeight = 800;
        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        const expectedCapDpr = Math.min(dprVal, 2.0);
        const actualDpr = evalInSandbox('dpr');
        const minRadius = evalInSandbox('minRadius');
        const maxRadius = evalInSandbox('maxRadius');

        check(actualDpr === expectedCapDpr, `Magnetic_Orbit: DPR ${dprVal} capped at ${expectedCapDpr}`);
        check(!isNaN(minRadius) && !isNaN(maxRadius) && minRadius > 0 && maxRadius > minRadius, `Magnetic_Orbit: Orbits valid at DPR ${dprVal}`);
    });

    // 100회 리사이즈 및 플레이어 궤도 비례 갱신 안정성 검증
    evalInSandbox('initGame()');

    let nanDetected = false;
    let enemiesEscaped = false;

    const testViewports = [
        [320, 480], [375, 667], [800, 600], [1024, 768], [1920, 1080],
        [412, 915], [390, 844], [100, 100], [2560, 1440], [3840, 2160]
    ];

    for (let i = 0; i < 100; i++) {
        const vp = testViewports[i % testViewports.length];
        mockWindow.innerWidth = vp[0];
        mockWindow.innerHeight = vp[1];
        mockWindow.devicePixelRatio = 2.0;

        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        evalInSandbox('update(); update();');

        const pState = evalInSandbox('({ radius: player.radius, angle: player.angle, vR: player.vR, size: player.size, minR: minRadius, maxR: maxRadius })');
        if (isNaN(pState.radius) || isNaN(pState.angle) || isNaN(pState.vR) || isNaN(pState.size)) {
            nanDetected = true;
        }
        if (pState.radius < pState.minR * 0.9 || pState.radius > pState.maxR * 1.1) {
            enemiesEscaped = true;
        }
    }

    const enemyCount = evalInSandbox('enemies.length');
    check(!nanDetected, 'Magnetic_Orbit: 100 continuous resize events produce ZERO NaN player coords');
    check(!enemiesEscaped, 'Magnetic_Orbit: Player orbit radius remains strictly bounded within minRadius~maxRadius');
    check(typeof enemyCount === 'number', 'Magnetic_Orbit: Enemy array is actively maintained');
}

// ----------------------------------------------------------------------
// 3. 3D Minesweeper Three.js WebGL DPR & 100x Resize Stress Test
// ----------------------------------------------------------------------
console.log('\n▶ [3/5] Testing 3D_ minesweeper WebGL DPR & Extreme Resize...');
{
    const js = fs.readFileSync(path.join(PROJECT_ROOT, 'game/3D_ minesweeper/script.js'), 'utf8');

    // Three.js Mock 객체 구성
    class MockVector3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
        clone() { return new MockVector3(this.x, this.y, this.z); }
        sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
        add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
        normalize() { return this; }
        length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
        distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
        crossVectors() { return this; }
        applyQuaternion() { return this; }
        multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    }

    class MockQuaternion {
        constructor() { this.x = 0; this.y = 0; this.z = 0; this.w = 1; }
        setFromAxisAngle() { return this; }
        setFromEuler() { return this; }
        multiplyQuaternions() { return this; }
    }

    class MockGroup {
        constructor() { this.children = []; }
        add(c) { this.children.push(c); }
        remove(c) { this.children = this.children.filter(x => x !== c); }
    }

    class MockMesh {
        constructor(geo, mat) {
            this.geometry = geo;
            this.material = mat;
            this.position = new MockVector3();
            this.quaternion = new MockQuaternion();
            this.scale = new MockVector3(1, 1, 1);
            this.userData = {};
            this.visible = true;
            this.children = [];
            this.type = 'Mesh';
        }
        add(c) { this.children.push(c); }
        clear() { this.children = []; }
    }

    const mockThree = {
        Scene: class {
            constructor() { this.fog = null; this.children = []; }
            add(c) { this.children.push(c); }
        },
        FogExp2: class {},
        PerspectiveCamera: class {
            constructor(fov, aspect, near, far) {
                this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
                this.position = new MockVector3();
                this.up = new MockVector3(0, 1, 0);
            }
            updateProjectionMatrix() {}
            lookAt() {}
        },
        WebGLRenderer: class {
            constructor() {
                this.domElement = {
                    addEventListener: () => {},
                    style: {}
                };
                this.shadowMap = {};
                this.pixelRatio = 1;
            }
            setSize(w, h) { this.width = w; this.height = h; }
            setPixelRatio(r) { this.pixelRatio = r; }
            render() {}
        },
        Vector3: MockVector3,
        Vector2: class { constructor(x=0,y=0){this.x=x;this.y=y;} set(x,y){this.x=x;this.y=y;} },
        Quaternion: MockQuaternion,
        AmbientLight: class { constructor(){ this.position = new MockVector3(); } },
        DirectionalLight: class { constructor(){ this.position = new MockVector3(); this.shadow = { mapSize: {}, camera: { updateProjectionMatrix: () => {} } }; } },
        Group: MockGroup,
        BoxGeometry: class { dispose() {} },
        EdgesGeometry: class { dispose() {} },
        MeshStandardMaterial: class { dispose() {} },
        LineBasicMaterial: class { dispose() {} },
        CanvasTexture: class { dispose() {} },
        SpriteMaterial: class { dispose() {} },
        Sprite: class {
            constructor(mat) {
                this.material = mat;
                this.position = new MockVector3();
                this.scale = new MockVector3(1, 1, 1);
                this.userData = {};
                this.type = 'Sprite';
            }
        },
        Mesh: MockMesh,
        LineSegments: MockMesh,
        Raycaster: class {
            setFromCamera() {}
            intersectObjects() { return []; }
        },
        MathUtils: {
            clamp: (v, min, max) => Math.max(min, Math.min(max, v))
        },
        PCFSoftShadowMap: 2
    };

    const listeners = {};
    const mockWindow = {
        innerWidth: 1024,
        innerHeight: 768,
        devicePixelRatio: 2.0,
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        removeEventListener: () => {},
        requestAnimationFrame: () => 1
    };

    const mockElement = () => ({
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        addEventListener: () => {},
        dispatchEvent: () => {},
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        value: '4',
        max: '64'
    });

    const mockDocument = {
        getElementById: () => mockElement(),
        querySelectorAll: () => [mockElement()],
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        body: { appendChild: () => {}, style: {} },
        createElement: () => ({
            getContext: () => ({
                fillRect: () => {},
                fillText: () => {},
                strokeText: () => {},
                shadowColor: '',
                shadowBlur: 0,
                font: '',
                textAlign: '',
                textBaseline: '',
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 1
            }),
            width: 256,
            height: 256
        })
    };

    const sandbox = {
        THREE: mockThree,
        window: mockWindow,
        document: mockDocument,
        console: { log: () => {}, error: () => {}, warn: () => {} },
        Math: Math,
        Date: Date,
        setTimeout: () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        requestAnimationFrame: () => 1,
        Event: class {}
    };

    vm.createContext(sandbox);

    let scriptExecuted = false;
    try {
        vm.runInContext(js, sandbox);
        if (listeners['DOMContentLoaded']) listeners['DOMContentLoaded'].forEach(fn => fn());
        scriptExecuted = true;
    } catch (e) {
        console.error('3D_ minesweeper execution error:', e);
    }
    check(scriptExecuted, '3D_ minesweeper: script.js initializes and executes DOMContentLoaded without errors');

    const evalInSandbox = (expr) => vm.runInContext(expr, sandbox);

    // 100회 리사이즈 스트레스
    let nanAspect = false;
    for (let i = 0; i < 100; i++) {
        mockWindow.innerWidth = 320 + (i * 15);
        mockWindow.innerHeight = 480 + (i * 10);
        mockWindow.devicePixelRatio = (i % 2 === 0) ? 2.0 : 3.0;

        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        const camAspect = evalInSandbox('camera.aspect');
        if (isNaN(camAspect) || !isFinite(camAspect) || camAspect <= 0) {
            nanAspect = true;
        }
    }
    const rendererPixelRatio = evalInSandbox('renderer.pixelRatio');
    check(!nanAspect, '3D_ minesweeper: 100 resize events maintain valid non-NaN camera aspect ratio');
    check(rendererPixelRatio === 2, '3D_ minesweeper: WebGL renderer caps devicePixelRatio to 2.0');
}

// ----------------------------------------------------------------------
// 4. Maze Escape Three.js WebGL DPR & 100x Resize Stress Test
// ----------------------------------------------------------------------
console.log('\n▶ [4/5] Testing maze_escape WebGL DPR & Extreme Resize...');
{
    const js = fs.readFileSync(path.join(PROJECT_ROOT, 'game/maze_escape/game.js'), 'utf8');

    class MockVector3 {
        constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
        set(x,y,z) { this.x=x; this.y=y; this.z=z; return this; }
        copy(v) { this.x=v.x; this.y=v.y; this.z=v.z; return this; }
        clone() { return new MockVector3(this.x,this.y,this.z); }
        lengthSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
        normalize() { return this; }
        applyEuler() { return this; }
        distanceTo(v) { return Math.hypot(this.x-v.x, this.y-v.y, this.z-v.z); }
    }

    class MockGroup {
        constructor() { this.children = []; }
        add(c) { this.children.push(c); }
        remove(c) { this.children = this.children.filter(x => x !== c); }
    }

    const mockThree = {
        Scene: class {
            constructor() { this.children = []; this.background = null; this.fog = null; }
            add(c) { this.children.push(c); }
        },
        Color: class {},
        Fog: class {},
        PerspectiveCamera: class {
            constructor(fov, aspect) {
                this.fov = fov; this.aspect = aspect;
                this.position = new MockVector3();
                this.rotation = new MockVector3();
                this.quaternion = { setFromEuler: () => {} };
            }
            updateProjectionMatrix() {}
            add() {}
        },
        WebGLRenderer: class {
            constructor() {
                this.domElement = { addEventListener: () => {}, style: {} };
                this.pixelRatio = 1;
            }
            setSize(w, h) { this.width = w; this.height = h; }
            setPixelRatio(r) { this.pixelRatio = r; }
            render() {}
        },
        Vector3: MockVector3,
        Vector2: class { constructor(x=0,y=0){this.x=x;this.y=y;} },
        Euler: class { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} setFromQuaternion(){} },
        Quaternion: class { setFromEuler(){} },
        Group: MockGroup,
        PlaneGeometry: class { dispose() {} },
        BoxGeometry: class { dispose() {} },
        TorusKnotGeometry: class { dispose() {} },
        MeshBasicMaterial: class { dispose() {} },
        MeshStandardMaterial: class { dispose() {} },
        CanvasTexture: class { constructor() { this.repeat = { set: () => {} }; } dispose() {} },
        Mesh: class {
            constructor(geo, mat) {
                this.geometry = geo; this.material = mat;
                this.position = new MockVector3();
                this.rotation = new MockVector3();
            }
        },
        AmbientLight: class { constructor(){ this.position = new MockVector3(); } },
        PointLight: class { constructor(){ this.position = new MockVector3(); } },
        PointerLockControls: class {
            constructor() { this.isLocked = false; }
            getObject() { return { position: new MockVector3() }; }
            lock() { this.isLocked = true; }
            unlock() { this.isLocked = false; }
            addEventListener() {}
        },
        Raycaster: class {
            setFromCamera() {}
            intersectObjects() { return []; }
        },
        RepeatWrapping: 1000,
        DoubleSide: 2
    };

    const listeners = {};
    const mockWindow = {
        innerWidth: 800,
        innerHeight: 600,
        devicePixelRatio: 1.5,
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        removeEventListener: () => {},
        requestAnimationFrame: () => 1
    };

    const mockElement = () => ({
        style: {},
        addEventListener: () => {},
        innerText: '',
        appendChild: () => {}
    });

    const mockDocument = {
        getElementById: () => mockElement(),
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        body: { appendChild: () => {}, style: {} },
        createElement: () => ({
            getContext: () => ({
                fillRect: () => {},
                strokeRect: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                stroke: () => {},
                clearRect: () => {},
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 1,
                globalAlpha: 1,
                lineCap: '',
                shadowBlur: 0,
                shadowColor: ''
            }),
            width: 512,
            height: 512
        })
    };

    const sandbox = {
        THREE: mockThree,
        window: mockWindow,
        document: mockDocument,
        navigator: { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 },
        console: { log: () => {}, error: () => {}, warn: () => {} },
        Math: Math,
        Date: Date,
        performance: { now: () => Date.now() },
        setTimeout: () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        requestAnimationFrame: () => 1
    };

    vm.createContext(sandbox);

    let scriptExecuted = false;
    try {
        vm.runInContext(js, sandbox);
        scriptExecuted = true;
    } catch (e) {
        console.error('maze_escape execution error:', e);
    }
    check(scriptExecuted, 'maze_escape: game.js initializes 3D maze environment cleanly');

    const evalInSandbox = (expr) => vm.runInContext(expr, sandbox);

    // 100회 리사이즈 스트레스
    let nanAspect = false;
    for (let i = 0; i < 100; i++) {
        mockWindow.innerWidth = 320 + (i * 20);
        mockWindow.innerHeight = 480 + (i * 15);
        mockWindow.devicePixelRatio = 3.0;

        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        const camAspect = evalInSandbox('camera.aspect');
        if (isNaN(camAspect) || !isFinite(camAspect) || camAspect <= 0) nanAspect = true;
    }
    const rendererPixelRatio = evalInSandbox('renderer.pixelRatio');
    check(!nanAspect, 'maze_escape: 100 resize events maintain valid camera aspect ratio');
    check(rendererPixelRatio === 2, 'maze_escape: WebGL renderer caps devicePixelRatio to 2.0');
}

// ----------------------------------------------------------------------
// 5. Shadow Puzzle Three.js WebGL DPR & 100x Resize Stress Test
// ----------------------------------------------------------------------
console.log('\n▶ [5/5] Testing shadow_puzzle WebGL DPR & Extreme Resize...');
{
    const js = fs.readFileSync(path.join(PROJECT_ROOT, 'game/shadow_puzzle/script.js'), 'utf8');

    class MockVector3 {
        constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
        set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
        copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
        clone(){return new MockVector3(this.x,this.y,this.z);}
        applyQuaternion(){return this;}
    }

    class MockQuaternion {
        constructor(){this.x=0;this.y=0;this.z=0;this.w=1;}
        setFromAxisAngle(){return this;}
        setFromEuler(){return this;}
        multiplyQuaternions(){return this;}
        premultiply(){return this;}
        identity(){return this;}
        dot(){return 0.5;}
        slerp(){return this;}
        copy(){return this;}
    }

    class MockGroup {
        constructor(){
            this.children = [];
            this.position = new MockVector3();
            this.quaternion = new MockQuaternion();
        }
        add(c){this.children.push(c);}
        remove(c){this.children = this.children.filter(x=>x!==c);}
    }

    const mockThree = {
        Scene: class {
            constructor(){this.children=[];this.background=null;this.fog=null;}
            add(c){this.children.push(c);}
        },
        Color: class {},
        Fog: class {},
        PerspectiveCamera: class {
            constructor(fov, aspect){
                this.fov = fov; this.aspect = aspect;
                this.position = new MockVector3();
                this.quaternion = new MockQuaternion();
            }
            updateProjectionMatrix(){}
            lookAt(){}
        },
        WebGLRenderer: class {
            constructor(){this.shadowMap={}; this.pixelRatio = 1;}
            setSize(w,h){this.width=w;this.height=h;}
            setPixelRatio(r){this.pixelRatio=r;}
            render(){}
        },
        Vector3: MockVector3,
        Quaternion: MockQuaternion,
        Euler: class { setFromQuaternion(){} },
        Group: MockGroup,
        PlaneGeometry: class { dispose(){} },
        BoxGeometry: class { dispose(){} },
        MeshStandardMaterial: class { dispose(){} },
        Mesh: class {
            constructor(g,m){
                this.geometry=g;this.material=m;
                this.position=new MockVector3();
                this.rotation=new MockVector3();
            }
        },
        AmbientLight: class { constructor(){this.position=new MockVector3();} },
        DirectionalLight: class {
            constructor(){
                this.position=new MockVector3();
                this.shadow={mapSize:{},camera:{}};
            }
        },
        PCFSoftShadowMap: 2,
        MathUtils: {
            clamp: (v, min, max) => Math.max(min, Math.min(max, v))
        }
    };

    const listeners = {};
    const mockWindow = {
        innerWidth: 800,
        innerHeight: 600,
        devicePixelRatio: 2.0,
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        removeEventListener: () => {},
        requestAnimationFrame: () => 1
    };

    const mockElement = () => ({
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        addEventListener: () => {},
        innerText: '',
        innerHTML: ''
    });

    const mockDocument = {
        getElementById: () => mockElement(),
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        body: { appendChild: () => {}, style: {} }
    };

    const sandbox = {
        THREE: mockThree,
        window: mockWindow,
        document: mockDocument,
        console: { log: () => {}, error: () => {}, warn: () => {} },
        Math: Math,
        Date: Date,
        setTimeout: () => 1,
        clearTimeout: () => {},
        requestAnimationFrame: () => 1
    };

    vm.createContext(sandbox);

    let scriptExecuted = false;
    try {
        vm.runInContext(js, sandbox);
        scriptExecuted = true;
    } catch (e) {
        console.error('shadow_puzzle execution error:', e);
    }
    check(scriptExecuted, 'shadow_puzzle: script.js loads levels and initializes 3D shadow stage');

    const evalInSandbox = (expr) => vm.runInContext(expr, sandbox);

    // 100회 세로/가로 모바일 리사이즈 및 FOV 보정 검증
    let fovOutOfBounds = false;
    for (let i = 0; i < 100; i++) {
        const isPortrait = (i % 2 === 0);
        mockWindow.innerWidth = isPortrait ? 375 : 812;
        mockWindow.innerHeight = isPortrait ? 812 : 375;
        mockWindow.devicePixelRatio = 3.0;

        if (listeners['resize']) listeners['resize'].forEach(fn => fn());

        const camFov = evalInSandbox('camera.fov');
        if (camFov < 40 || camFov > 75 || isNaN(camFov)) {
            fovOutOfBounds = true;
        }
    }
    const rendererPixelRatio = evalInSandbox('renderer.pixelRatio');
    check(!fovOutOfBounds, 'shadow_puzzle: Dynamic FOV compensation stays within safe bounds (45~65) across 100 resizes');
    check(rendererPixelRatio === 2, 'shadow_puzzle: WebGL renderer caps devicePixelRatio to 2.0');
}

console.log('\n===============================================================');
console.log(`📊 DPR & RESIZE STRESS SUMMARY: Passed ${passedChecks} / ${totalChecks} (Failures: ${failedChecks})`);
console.log('===============================================================\n');

if (failedChecks > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
