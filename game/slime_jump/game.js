const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreText = document.getElementById('scoreText');
const seedText = document.getElementById('seedText');
const abilityText = document.getElementById('abilityText');
const gameStatus = document.getElementById('gameStatus');
const highScoreText = document.getElementById('highScoreText');
const finalScore = document.getElementById('finalScore');
const finalSeeds = document.getElementById('finalSeeds');
const finalHighScore = document.getElementById('finalHighScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const MAX_PLAY_WIDTH = 720;
const MAX_PLAY_ASPECT = 1.1;
const FRICTION = 0.995;
const HIGH_SCORE_KEY = 'slimeIslandJumpHigh';
let cw = 0;
let ch = 0;
let dpr = 1;
let GAME_SCALE = 1;
let GRAVITY = 0.42;
let MAX_SPEED = 16;
let MAX_DRAG_DIST = 170;
let slime = null;
let walls = [];
let seeds = [];
let particles = [];
let clouds = [];
let cameraY = 0;
let scoreOriginY = 0;
let scoreOffset = 0;
let score = 0;
let seedCount = 0;
let islandCount = 0;
let routeAnchor = null;
let layoutDeck = [];
let mergeNext = false;
let statusTimer = 0;
let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
let state = 'MENU';
let drag = null;
let elapsed = 0;
const keys = { left: false, right: false };
highScoreText.textContent = highScore;
canvas.style.touchAction = 'none';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function resizeCanvas() {
    const oldWidth = cw;
    const oldHeight = ch;
    const oldScale = GAME_SCALE;
    cw = Math.min(window.innerWidth, MAX_PLAY_WIDTH, Math.round(window.innerHeight * MAX_PLAY_ASPECT));
    ch = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    GAME_SCALE = clamp(Math.min(cw, ch) / 620, 0.55, 1.15);
    GRAVITY = 0.42 * GAME_SCALE;
    MAX_SPEED = 16 * GAME_SCALE;
    MAX_DRAG_DIST = clamp(Math.min(cw, ch) * 0.42, 110, 190);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.style.marginLeft = (window.innerWidth - cw) / 2 + 'px';
    uiLayer.style.maxWidth = cw + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (oldWidth && oldHeight && slime) {
        const widthRatio = cw / oldWidth;
        const heightChange = ch - oldHeight;
        const scaleRatio = GAME_SCALE / oldScale;
        const previousAltitude = scoreOffset + Math.max(0, scoreOriginY - slime.y - slime.radius) / (10 * oldScale);
        slime.x *= widthRatio;
        slime.y += heightChange;
        slime.vx *= scaleRatio;
        slime.vy *= scaleRatio;
        slime.radius = 32 * GAME_SCALE;
        slime.trail.forEach(point => {
            point.x *= widthRatio;
            point.y += heightChange;
        });
        walls.forEach(island => {
            island.x *= widthRatio;
            island.baseX *= widthRatio;
            island.w *= widthRatio;
            island.range *= widthRatio;
            island.y += heightChange;
        });
        seeds.forEach(seed => {
            seed.x *= widthRatio;
            seed.y += heightChange;
        });
        particles.forEach(particle => {
            particle.x *= widthRatio;
            particle.y += heightChange;
        });
        cameraY += heightChange;
        scoreOriginY += heightChange;
        // The first island remains attached to the bottom after orientation changes.
        if (slime.platform) slime.y = slime.platform.y - slime.radius;
        scoreOffset = previousAltitude - Math.max(0, scoreOriginY - slime.y - slime.radius) / (10 * GAME_SCALE);
        clouds = makeClouds();
    }
}
window.addEventListener('resize', resizeCanvas);

function makeClouds() {
    const result = [];
    for (let i = 0; i < 18; i++) {
        result.push({
            x: (i * 0.61803398875 % 1) * cw,
            y: (i * 197) % (ch + 360) - 140,
            size: (36 + (i * 37) % 85) * GAME_SCALE,
            depth: 0.12 + (i % 3) * 0.08
        });
    }
    return result;
}

class Island {
    constructor(x, y, w, ground = false, type = 'normal') {
        this.x = x;
        this.baseX = x;
        this.y = y;
        this.w = w;
        this.h = ground ? 95 * GAME_SCALE : 85 * GAME_SCALE;
        this.ground = ground;
        this.type = type;
        this.range = type === 'moving' ? 16 * GAME_SCALE : 0;
        this.phase = Math.random() * Math.PI * 2;
        this.dx = 0;
        this.fragileTimer = null;
        this.collapsed = false;
    }

    update() {
        if (this.type === 'moving') {
            const nextX = this.baseX + Math.sin(elapsed * 0.032 + this.phase) * this.range;
            this.dx = nextX - this.x;
            this.x = nextX;
        }
        if (this.fragileTimer !== null && !this.collapsed) {
            this.fragileTimer--;
            if (this.fragileTimer <= 0) {
                this.collapsed = true;
                scatter(this.x + this.w / 2, this.y, 16);
                if (slime.platform === this) {
                    slime.platform = null;
                    slime.canJump = false;
                    slime.airHopReady = true;
                    showStatus('섬이 무너졌어요! 공중 도약으로 탈출', 110);
                    updateAbility();
                }
            }
        }
    }

    draw() {
        if (this.collapsed) return;
        const x = this.x;
        const y = this.y;
        const w = this.w;
        const h = this.h;
        ctx.save();
        ctx.shadowColor = 'rgba(119, 81, 72, 0.24)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 16;
        const rock = ctx.createLinearGradient(x, y, x + w * 0.7, y + h * 1.5);
        rock.addColorStop(0, this.type === 'spring' ? '#e5f3c0' : '#ffe3bd');
        rock.addColorStop(0.45, this.type === 'moving' ? '#e6a8ac' : '#f2ac87');
        rock.addColorStop(1, this.type === 'spring' ? '#8db79c' : '#ba7280');
        ctx.fillStyle = rock;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.04, y + 5);
        ctx.lineTo(x + w * 0.96, y + 5);
        ctx.bezierCurveTo(x + w * 0.94, y + h * 0.52, x + w * 0.76, y + h * 0.72, x + w * 0.62, y + h * 0.91);
        ctx.bezierCurveTo(x + w * 0.43, y + h * 1.14, x + w * 0.24, y + h * 0.69, x + w * 0.08, y + h * 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = 'rgba(255, 241, 218, 0.54)';
        ctx.lineWidth = 4 * GAME_SCALE;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.08, y + h * 0.2);
        ctx.bezierCurveTo(x + w * 0.27, y + h * 0.32, x + w * 0.31, y + h * 0.27, x + w * 0.43, y + h * 0.31);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(157, 85, 91, 0.15)';
        ctx.lineWidth = 3 * GAME_SCALE;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y + h * 0.4);
        ctx.quadraticCurveTo(x + w * 0.68, y + h * 0.48, x + w * 0.79, y + h * 0.35);
        ctx.stroke();

        ctx.fillStyle = 'rgba(153, 80, 88, 0.15)';
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + w * (i / 4), y + 12);
            ctx.lineTo(x + w * (i / 4 + 0.025), y + h * (0.45 + i % 2 * 0.16));
            ctx.lineTo(x + w * (i / 4 - 0.015), y + h * 0.55);
            ctx.fill();
        }
        const turf = ctx.createLinearGradient(0, y - 10, 0, y + 11);
        turf.addColorStop(0, '#d9ef80');
        turf.addColorStop(0.52, '#91c95c');
        turf.addColorStop(1, '#568d58');
        ctx.fillStyle = turf;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 2, w / 2, 13 * GAME_SCALE, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fff1d2';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 1, w * 0.47, 5 * GAME_SCALE, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#789d49';
        for (const side of [0.1, 0.84]) {
            for (let i = 0; i < 3; i++) {
                const bx = x + w * side + i * 7 * GAME_SCALE;
                ctx.beginPath();
                ctx.arc(bx, y - (4 + i % 2 * 5) * GAME_SCALE, (6 + i % 2 * 3) * GAME_SCALE, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (!this.ground) {
            const plantX = x + w * 0.78;
            ctx.strokeStyle = '#6f974b';
            ctx.lineWidth = 2 * GAME_SCALE;
            ctx.beginPath();
            ctx.moveTo(plantX, y - 4 * GAME_SCALE);
            ctx.quadraticCurveTo(plantX + 6 * GAME_SCALE, y - 13 * GAME_SCALE, plantX + 3 * GAME_SCALE, y - 23 * GAME_SCALE);
            ctx.stroke();
            ctx.fillStyle = '#91b64d';
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.ellipse(plantX + side * 6 * GAME_SCALE, y - 17 * GAME_SCALE,
                    7 * GAME_SCALE, 4 * GAME_SCALE, side * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (this.type === 'spring') {
            const padX = x + w / 2;
            ctx.fillStyle = '#52c7b9';
            ctx.beginPath();
            ctx.ellipse(padX, y - 5 * GAME_SCALE, 25 * GAME_SCALE, 7 * GAME_SCALE, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#eaffd4';
            ctx.lineWidth = 3 * GAME_SCALE;
            ctx.beginPath();
            ctx.moveTo(padX - 8 * GAME_SCALE, y - 9 * GAME_SCALE);
            ctx.lineTo(padX, y - 15 * GAME_SCALE);
            ctx.lineTo(padX + 8 * GAME_SCALE, y - 9 * GAME_SCALE);
            ctx.stroke();
        } else if (this.type === 'fragile') {
            ctx.strokeStyle = '#b36d63';
            ctx.lineWidth = 2 * GAME_SCALE;
            ctx.beginPath();
            ctx.moveTo(x + w * 0.4, y + 2);
            ctx.lineTo(x + w * 0.46, y + h * 0.22);
            ctx.lineTo(x + w * 0.53, y + h * 0.12);
            ctx.lineTo(x + w * 0.59, y + h * 0.35);
            ctx.stroke();
            if (this.fragileTimer !== null) {
                ctx.fillStyle = '#ffbb5a';
                ctx.fillRect(x + w * 0.14, y - 16 * GAME_SCALE,
                    w * 0.72 * Math.max(0, this.fragileTimer / 85), 4 * GAME_SCALE);
            }
        } else if (this.type === 'moving') {
            ctx.fillStyle = '#866db9';
            for (const direction of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(x + w / 2 + direction * 24 * GAME_SCALE, y - 15 * GAME_SCALE);
                ctx.lineTo(x + w / 2 + direction * 34 * GAME_SCALE, y - 8 * GAME_SCALE);
                ctx.lineTo(x + w / 2 + direction * 24 * GAME_SCALE, y - 1 * GAME_SCALE);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

class Slime {
    constructor(ground) {
        this.radius = 32 * GAME_SCALE;
        this.x = cw / 2;
        this.y = ground.y - this.radius;
        this.vx = 0;
        this.vy = 0;
        this.platform = ground;
        this.canJump = true;
        this.airHopReady = false;
        this.trail = [];
        this.squish = 0;
    }

    update() {
        const wasGrounded = !!this.platform;
        const previousBottom = this.y + this.radius;
        if (this.platform) {
            this.x += this.platform.dx;
            this.y = this.platform.y - this.radius;
            this.vx *= 0.78;
            if (Math.abs(this.vx) < 0.04) this.vx = 0;
            if (this.x + this.radius * 0.45 < this.platform.x ||
                this.x - this.radius * 0.45 > this.platform.x + this.platform.w) {
                this.platform = null;
                this.canJump = false;
            }
        } else {
            this.vy += GRAVITY;
            this.vx *= FRICTION;
        }
        this.x += this.vx;
        if (!this.platform) this.y += this.vy;
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx) * 0.35;
        } else if (this.x > cw - this.radius) {
            this.x = cw - this.radius;
            this.vx = -Math.abs(this.vx) * 0.35;
        }
        if (!this.platform && this.vy >= 0) {
            for (const island of walls) {
                if (!island.collapsed && previousBottom <= island.y + 7 * GAME_SCALE &&
                    this.y + this.radius >= island.y &&
                    this.x + this.radius * 0.7 > island.x &&
                    this.x - this.radius * 0.7 < island.x + island.w) {
                    this.platform = island;
                    this.canJump = true;
                    this.airHopReady = false;
                    this.y = island.y - this.radius;
                    this.vy = 0;
                    this.vx *= 0.45;
                    this.squish = 0.34;
                    scatter(this.x, island.y, 7);
                    if (island.type === 'fragile') {
                        if (island.fragileTimer === null) island.fragileTimer = 85;
                        showStatus('금이 간 섬! 빨리 다음 섬으로 점프', 85);
                    } else if (island.type === 'spring') {
                        showStatus('탄성 섬! 다음 점프가 더 높아져요', 90);
                    } else if (island.type === 'moving') {
                        showStatus('움직이는 섬! 타이밍을 맞추세요', 90);
                    }
                    updateAbility();
                    break;
                }
            }
        }
        if (!this.platform) {
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > 9) this.trail.pop();
        } else if (!wasGrounded) {
            this.trail.length = 0;
        }
        this.squish *= 0.82;
    }

    draw() {
        ctx.save();
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const point = this.trail[i];
            ctx.fillStyle = 'rgba(158, 225, 40, ' + (0.035 + (9 - i) * 0.013) + ')';
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * (0.22 + (9 - i) * 0.035), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.translate(this.x, this.y);
        const stretch = this.platform ? 1 - this.squish : clamp(1 + Math.abs(this.vy) * 0.012, 1, 1.25);
        ctx.scale(1 / stretch, stretch);
        const r = this.radius;
        ctx.shadowColor = 'rgba(132, 214, 39, 0.5)';
        ctx.shadowBlur = 18;
        const jelly = ctx.createRadialGradient(-r * 0.37, -r * 0.56, r * 0.06, 0, 0, r * 1.2);
        jelly.addColorStop(0, '#f7ffba');
        jelly.addColorStop(0.3, '#b5f349');
        jelly.addColorStop(0.72, '#6fce3f');
        jelly.addColorStop(1, '#43aa66');
        ctx.fillStyle = jelly;
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, r * 0.35);
        ctx.bezierCurveTo(-r * 1.1, -r * 0.7, -r * 0.5, -r * 1.1, 0, -r);
        ctx.bezierCurveTo(r * 0.55, -r * 1.05, r * 1.05, -r * 0.55, r * 0.92, r * 0.35);
        ctx.quadraticCurveTo(r * 0.8, r, 0, r);
        ctx.quadraticCurveTo(-r * 0.8, r, -r * 0.9, r * 0.35);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,235,0.9)';
        ctx.lineWidth = 2.5 * GAME_SCALE;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.66)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.45, -r * 0.62, r * 0.14, r * 0.3, -0.5, 0, Math.PI * 2);
        ctx.fill();
        for (const eye of [-0.32, 0.32]) {
            ctx.fillStyle = '#fffdf0';
            ctx.beginPath();
            ctx.ellipse(r * eye, -r * 0.2, r * 0.23, r * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#28372b';
            ctx.beginPath();
            ctx.ellipse(r * eye + r * 0.04, -r * 0.16, r * 0.13, r * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(r * eye - r * 0.01, -r * 0.25, r * 0.055, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = '#4c6637';
        ctx.lineWidth = 1.5 * GAME_SCALE;
        ctx.beginPath();
        ctx.arc(0, r * 0.18, r * 0.11, 0.15, Math.PI - 0.15);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,160,144,0.62)';
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(side * r * 0.64, r * 0.19, r * 0.13, r * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function scatter(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5 * GAME_SCALE,
            vy: -Math.random() * 4 * GAME_SCALE,
            life: 28 + Math.random() * 15
        });
    }
}

function addSeed(island, fraction) {
    seeds.push({
        x: island.x + island.w * fraction,
        y: island.y - 42 * GAME_SCALE,
        island,
        fraction,
        phase: Math.random() * Math.PI * 2
    });
}

function nextLayout() {
    if (mergeNext) {
        mergeNext = false;
        return 'merge';
    }
    if (islandCount === 1) return 'near';
    if (islandCount === 2) return 'center';
    if (!layoutDeck.length) {
        layoutDeck = ['near', 'cross', 'center', 'fork', 'near'];
        for (let i = layoutDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [layoutDeck[i], layoutDeck[j]] = [layoutDeck[j], layoutDeck[i]];
        }
    }
    return layoutDeck.pop();
}

function generateWall(previous) {
    const index = ++islandCount;
    const motif = nextLayout();
    const difficulty = Math.min(1, Math.max(0, index - 5) / 30);
    const previousCenter = previous.x + previous.w / 2;
    let center;
    let widthRatio;
    let step;
    if (motif === 'near') {
        const direction = previousCenter < cw * 0.28 ? 1 : previousCenter > cw * 0.72 ? -1 : Math.random() < 0.5 ? -1 : 1;
        center = clamp(previousCenter + direction * cw * (0.13 + Math.random() * 0.13), cw * 0.18, cw * 0.82);
        widthRatio = 0.32;
        step = 96 + Math.random() * 20;
    } else if (motif === 'cross') {
        center = cw * (previousCenter < cw / 2 ? 0.69 + Math.random() * 0.06 : 0.25 + Math.random() * 0.06);
        widthRatio = 0.38;
        step = 125 + Math.random() * 22;
    } else if (motif === 'fork') {
        center = cw * (previousCenter < cw / 2 ? 0.3 : 0.7);
        widthRatio = 0.28;
        step = 116 + Math.random() * 16;
        mergeNext = true;
    } else {
        center = cw * (motif === 'merge' ? 0.45 + Math.random() * 0.1 : 0.42 + Math.random() * 0.16);
        widthRatio = motif === 'merge' ? 0.4 : 0.34;
        step = motif === 'merge' ? 106 + Math.random() * 17 : 103 + Math.random() * 17;
    }
    const width = clamp(cw * (widthRatio - difficulty * 0.035), 90 * GAME_SCALE, 250 * GAME_SCALE);
    const margin = 8 + 18 * GAME_SCALE;
    const x = clamp(center - width / 2, margin, cw - width - margin);
    const y = previous.y - (step + difficulty * 10) * GAME_SCALE;
    const type = index % 7 === 2 ? 'spring' : index % 7 === 4 ? 'fragile' : index % 7 === 5 ? 'moving' : 'normal';
    const island = new Island(x, y, width, false, type);
    island.motif = motif;
    walls.push(island);
    routeAnchor = island;
    if (index % 2 === 0) addSeed(island, index % 4 === 0 ? 0.2 : 0.8);

    if (motif === 'fork') {
        // Two landing choices share a height; the following center island rejoins both routes.
        const branchCenter = cw - center;
        const branchWidth = width * 0.88;
        const branchX = clamp(branchCenter - branchWidth / 2, margin, cw - branchWidth - margin);
        const branch = new Island(branchX, y + 4 * GAME_SCALE, branchWidth);
        branch.motif = 'fork';
        branch.optional = true;
        walls.push(branch);
        addSeed(branch, 0.5);
    }
    return island;
}

function showStatus(message, frames = 85) {
    gameStatus.textContent = message;
    gameStatus.classList.add('visible');
    statusTimer = frames;
}

function updateAbility() {
    abilityText.textContent = slime.platform ? '준비 완료' : slime.airHopReady ? '공중 도약 가능' : '공중 도약 사용';
}

function resetWorld() {
    cameraY = 0;
    scoreOriginY = 0;
    scoreOffset = 0;
    score = 0;
    seedCount = 0;
    islandCount = 0;
    routeAnchor = null;
    layoutDeck = [];
    mergeNext = false;
    statusTimer = 0;
    elapsed = 0;
    drag = null;
    particles = [];
    seeds = [];
    clouds = makeClouds();
    const ground = new Island(-12, ch - 75 * GAME_SCALE, cw + 24, true);
    scoreOriginY = ground.y;
    walls = [ground];
    slime = new Slime(ground);
    let top = ground;
    for (let i = 0; i < 12; i++) top = generateWall(top);
    scoreText.textContent = '0';
    seedText.textContent = '0';
    gameStatus.classList.remove('visible');
    updateAbility();
}

function initGame() {
    resetWorld();
    state = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function gameOver() {
    state = 'GAMEOVER';
    finalScore.textContent = score;
    finalSeeds.textContent = seedCount;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        highScoreText.textContent = highScore;
    }
    finalHighScore.textContent = highScore;
    gameOverScreen.classList.remove('hidden');
}

function launch(dx, dy) {
    if (state !== 'PLAYING' || !slime.canJump) return;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) return;
    const factor = Math.min(1, MAX_DRAG_DIST / distance);
    const spring = slime.platform && slime.platform.type === 'spring';
    slime.vx = clamp(dx * factor * 0.12, -MAX_SPEED, MAX_SPEED);
    slime.vy = -clamp(-dy * factor * 0.12, 8 * GAME_SCALE, 16 * GAME_SCALE);
    if (spring) {
        // Longer airtime should add height without overshooting the next island.
        slime.vx *= 0.78;
        slime.vy *= 1.22;
        showStatus('탄성 점프!', 55);
    }
    slime.platform = null;
    slime.canJump = false;
    slime.airHopReady = true;
    slime.squish = -0.22;
    scatter(slime.x, slime.y + slime.radius, 10);
    updateAbility();
}

function airHop(dx = 0) {
    if (state !== 'PLAYING' || slime.platform || !slime.airHopReady) return false;
    slime.airHopReady = false;
    slime.vx = clamp(slime.vx + dx * 0.08, -MAX_SPEED, MAX_SPEED);
    slime.vy = -10 * GAME_SCALE;
    slime.squish = -0.18;
    scatter(slime.x, slime.y + slime.radius, 12);
    showStatus('공중 도약!', 55);
    updateAbility();
    return true;
}

function handleDown(event) {
    if (state !== 'PLAYING' || (!slime.canJump && !slime.airHopReady) || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, currentX: event.clientX, currentY: event.clientY };
    if (canvas.setPointerCapture && event.pointerId !== undefined) canvas.setPointerCapture(event.pointerId);
}

function handleMove(event) {
    if (!drag || (drag.id !== undefined && event.pointerId !== drag.id)) return;
    drag.currentX = event.clientX;
    drag.currentY = event.clientY;
}

function handleUp(event) {
    if (!drag || (drag.id !== undefined && event.pointerId !== drag.id)) return;
    const dx = drag.x - (event.clientX === undefined ? drag.currentX : event.clientX);
    const dy = drag.y - (event.clientY === undefined ? drag.currentY : event.clientY);
    drag = null;
    if (slime.canJump) launch(dx, dy);
    else airHop(dx);
}

canvas.addEventListener('pointerdown', handleDown);
window.addEventListener('pointermove', handleMove);
window.addEventListener('pointerup', handleUp);
window.addEventListener('pointercancel', () => { drag = null; });
window.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) event.preventDefault();
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = true;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = true;
    if ((event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') &&
        state === 'PLAYING' && !event.repeat) {
        if (slime.canJump) launch((keys.right - keys.left) * 110 * GAME_SCALE, -140 * GAME_SCALE);
        else airHop((keys.right - keys.left) * 90 * GAME_SCALE);
    }
});
window.addEventListener('keyup', event => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = false;
});

function update() {
    if (state !== 'PLAYING') return;
    elapsed++;
    if (statusTimer > 0 && --statusTimer === 0) gameStatus.classList.remove('visible');
    walls.forEach(island => island.update());
    if (keys.left) slime.vx = clamp(slime.vx - 0.35 * GAME_SCALE, -MAX_SPEED * 0.8, MAX_SPEED);
    if (keys.right) slime.vx = clamp(slime.vx + 0.35 * GAME_SCALE, -MAX_SPEED, MAX_SPEED * 0.8);
    slime.update();
    for (let i = seeds.length - 1; i >= 0; i--) {
        const seed = seeds[i];
        seed.x = seed.island.x + seed.island.w * seed.fraction;
        if (Math.hypot(slime.x - seed.x, slime.y - seed.y) < slime.radius + 11 * GAME_SCALE) {
            seeds.splice(i, 1);
            seedCount++;
            seedText.textContent = seedCount;
            slime.airHopReady = !slime.platform;
            scatter(seed.x, seed.y, 14);
            showStatus('별씨앗 +1 · 공중 도약 충전!', 85);
            updateAbility();
        }
    }
    const altitude = Math.floor(Math.max(0, scoreOffset + (scoreOriginY - slime.y - slime.radius) / (10 * GAME_SCALE)));
    if (altitude > score) {
        score = altitude;
        scoreText.textContent = score;
    }
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += GRAVITY * 0.3;
        particle.life--;
    });
    particles = particles.filter(particle => particle.life > 0);
    if (slime.y < cameraY + ch * 0.44) {
        cameraY = slime.y - ch * 0.44;
    }
    while (routeAnchor && routeAnchor.y > cameraY - ch * 0.7) {
        generateWall(routeAnchor);
    }
    while (walls.length > 1 && walls[0].y > cameraY + ch + 250) walls.shift();
    seeds = seeds.filter(seed => seed.y < cameraY + ch + 250);
    if (slime.y > cameraY + ch + 80 && cameraY < -ch * 0.15) gameOver();
}

function drawCloud(x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = size * 0.2;
    for (const [ox, oy, rx, ry] of [[-0.45, 0.08, 0.42, 0.22], [-0.15, -0.12, 0.4, 0.34],
        [0.25, -0.05, 0.43, 0.29], [0.55, 0.09, 0.36, 0.2]]) {
        ctx.beginPath();
        ctx.ellipse(x + ox * size, y + oy * size, rx * size, ry * size, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, '#70b8ee');
    sky.addColorStop(0.48, '#b5d9f5');
    sky.addColorStop(1, '#fff1db');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);
    const sun = ctx.createRadialGradient(cw * 0.86, ch * 0.1, 3, cw * 0.86, ch * 0.1, cw * 0.44);
    sun.addColorStop(0, 'rgba(255,255,230,0.96)');
    sun.addColorStop(0.17, 'rgba(255,247,213,0.78)');
    sun.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, cw, ch);
    for (const cloud of clouds) {
        const period = ch + 360;
        const y = ((cloud.y - cameraY * cloud.depth) % period + period) % period - 180;
        drawCloud(cloud.x, y, cloud.size, 0.35 + cloud.depth);
    }
    // Faint distant islands and waterfalls give the cover's floating-world depth.
    for (let i = 0; i < 4; i++) {
        const x = cw * ([0.16, 0.79, 0.38, 0.9][i]);
        const y = ((ch * (0.16 + i * 0.23) - cameraY * 0.18) % (ch + 320) + ch + 320) % (ch + 320) - 100;
        const w = (45 + i % 2 * 25) * GAME_SCALE;
        ctx.fillStyle = 'rgba(135, 175, 132, 0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y, w, w * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 163, 151, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x - w * 0.8, y + 3);
        ctx.lineTo(x + w * 0.8, y + 3);
        ctx.lineTo(x + w * 0.17, y + w * 0.95);
        ctx.lineTo(x - w * 0.3, y + w * 0.75);
        ctx.fill();
        const fall = ctx.createLinearGradient(0, y, 0, y + ch * 0.34);
        fall.addColorStop(0, 'rgba(246, 253, 255, 0.44)');
        fall.addColorStop(1, 'rgba(246, 253, 255, 0)');
        ctx.fillStyle = fall;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.18, y + 5);
        ctx.lineTo(x + w * 0.39, y + 5);
        ctx.lineTo(x + w * 0.33, y + ch * 0.34);
        ctx.lineTo(x + w * 0.21, y + ch * 0.34);
        ctx.fill();
    }
}

function drawAim() {
    if (!drag || !slime.canJump) return;
    let dx = drag.x - drag.currentX;
    let dy = drag.y - drag.currentY;
    const length = Math.hypot(dx, dy);
    if (length < 8) return;
    const factor = Math.min(1, MAX_DRAG_DIST / length);
    dx *= factor;
    dy *= factor;
    let vx = clamp(dx * 0.12, -MAX_SPEED, MAX_SPEED);
    let vy = -clamp(-dy * 0.12, 8 * GAME_SCALE, 16 * GAME_SCALE);
    let x = slime.x;
    let y = slime.y;
    ctx.save();
    ctx.fillStyle = 'rgba(57, 142, 75, 0.75)';
    for (let i = 0; i < 42; i++) {
        vy += GRAVITY;
        vx *= FRICTION;
        x += vx;
        y += vy;
        if (i % 3 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, (3 - i * 0.035) * GAME_SCALE, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawSeed(seed) {
    ctx.save();
    ctx.translate(seed.x, seed.y + Math.sin(elapsed * 0.07 + seed.phase) * 3 * GAME_SCALE);
    ctx.shadowColor = '#ffd85d';
    ctx.shadowBlur = 18 * GAME_SCALE;
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 15 * GAME_SCALE);
    glow.addColorStop(0, 'rgba(255, 252, 186, 0.85)');
    glow.addColorStop(1, 'rgba(255, 225, 126, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 15 * GAME_SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffc950';
    ctx.beginPath();
    ctx.moveTo(0, -10 * GAME_SCALE);
    ctx.quadraticCurveTo(10 * GAME_SCALE, -3 * GAME_SCALE, 0, 10 * GAME_SCALE);
    ctx.quadraticCurveTo(-10 * GAME_SCALE, -3 * GAME_SCALE, 0, -10 * GAME_SCALE);
    ctx.fill();
    ctx.fillStyle = '#fff4b2';
    ctx.beginPath();
    ctx.ellipse(-2 * GAME_SCALE, -3 * GAME_SCALE, 2 * GAME_SCALE, 3 * GAME_SCALE, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground();
    ctx.save();
    ctx.translate(0, -cameraY);
    for (const island of walls) {
        if (island.y > cameraY - 120 && island.y < cameraY + ch + 140) island.draw();
    }
    for (const seed of seeds) {
        if (seed.y > cameraY - 80 && seed.y < cameraY + ch + 80) drawSeed(seed);
    }
    ctx.fillStyle = '#c6eb67';
    for (const particle of particles) {
        ctx.globalAlpha = Math.min(1, particle.life / 20);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2.5 * GAME_SCALE, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawAim();
    slime.draw();
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
resizeCanvas();
resetWorld();
gameLoop();
