// --- 게임 설정 및 상태 관리 (Game Configuration & State) ---
const CONFIG = {
    gridSize: 5,            // 기본 격자 크기 (N x N x N)
    boardShape: 'cube',     // 블록들이 모여 이루는 전체 지뢰밭의 형태
    mineCount: 15,          // 기본 지뢰 개수
    blockSize: 1,           // 블록 하나의 물리적 크기
    spacing: 1.05,          // 블록 간의 간격 (1.0이면 밀착, 1.05면 약간의 틈 발생)
    dragThreshold: 8,       // 드래그로 간주되는 최소 이동 거리 (px)
    longPressDuration: 300, // 꾹 누르기 판정 시간 (ms)
    highlightScale: 1.4,    // 강조 시 숫자 확대 비율
    autoMineRatio: 0.15     // 자동 지뢰 비율 (15%)
};

const BOARD_SHAPE_NAMES = {
    cube: '정육면체', cross: '십자가', torus: '도넛', pyramid: '피라미드', sphere: '구'
};
const RANDOM_BOARD_SHAPES = ['cross', 'torus', 'pyramid', 'sphere'];

function hasBoardCell(x, y, z, size, shape) {
    if (shape === 'cube') return true;
    const center = (size - 1) / 2;
    const dx = x - center;
    const dy = y - center;
    const dz = z - center;
    if (shape === 'cross') {
        const arm = Math.max(0.5, Math.floor(size / 5));
        return (Math.abs(dx) <= arm && Math.abs(dy) <= arm) ||
            (Math.abs(dx) <= arm && Math.abs(dz) <= arm) ||
            (Math.abs(dy) <= arm && Math.abs(dz) <= arm);
    }
    if (shape === 'torus') {
        const ring = Math.hypot(dx, dz) - size * 0.34;
        return ring * ring + dy * dy <= Math.pow(size * 0.16, 2);
    }
    if (shape === 'pyramid') {
        const radius = (size - 1 - y) / 2;
        return Math.abs(dx) <= radius && Math.abs(dz) <= radius;
    }
    if (shape === 'sphere') return dx * dx + dy * dy + dz * dz <= Math.pow(size * 0.48, 2);
    throw new Error(`Unknown board shape: ${shape}`);
}

function countBoardCells(size, shape) {
    let count = 0;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                if (hasBoardCell(x, y, z, size, shape)) count++;
            }
        }
    }
    return count;
}

const STATE = {
    cells: [],          // 전체 셀 데이터를 담는 선형 배열
    cellGrid: [],       // 💡 3D 인덱스 배열 — 좌표(x,y,z)로 셀에 즉시 접근하기 위함 (O(1))
    safeCellsRemaining: 0, // 💡 남은 안전 셀 카운터 — 0이 되면 승리 판정 (성능 최적화)
    isFirstClick: true, // 첫 클릭 시 지뢰를 배치하여 무조건 안전하게 시작하도록 함
    status: 'menu',     // 현재 상태: menu, playing, won, lost, review
    prevStatus: 'playing', // 메뉴에서 돌아올 때 이전 상태를 복구하기 위함
    currentMode: 'dig', // 현재 조작 모드: dig, flag, highlight, chord, pan
    minesLeft: 0,       // HUD에 표시될 남은 지뢰 개수 (깃발 수에 따라 변함)
    hoveredCell: null,  // 마우스/터치가 올려진 현재 셀
    highlightedCells: [], // 강조(투시) 모드에서 밝게 표시된 셀 목록
    activeSprite: null,  // 현재 상호작용 중인 숫자(Sprite) 객체 (단일)
    highlightedSprites: [] // 탐색 롱프레스 시 다중으로 강조된 숫자(Sprite) 객체 배열
};

// --- Three.js 초기 설정 (Three.js Setup) ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1e293b, 0.015); // 배경과 어우러지는 안개 효과

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 성능을 위해 최대 픽셀비 2로 제한
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 부드러운 그림자 설정
document.body.appendChild(renderer.domElement);

// 💡 커스텀 카메라 컨트롤 상태 (OrbitControls 대체 - 순수 Quaternion 기반)
const CAM_STATE = {
    target: new THREE.Vector3(),
    distance: 15,

    minDistance: 5,
    maxDistance: 50
};

/**
 * 💡 카메라를 타겟 주위로 Quaternion 회전시킵니다.
 * Spherical 좌표계를 사용하지 않아 극점 제한이 없습니다.
 */
function applyCameraRotation(deltaTheta, deltaPhi) {
    const offset = camera.position.clone().sub(CAM_STATE.target);

    // 좌우 회전: 월드 Y축 기준 (카메라가 뒤집힌 경우 방향 보정)
    const ySign = camera.up.y >= 0 ? 1 : -1;
    const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaTheta * ySign);
    offset.applyQuaternion(quatY);
    camera.up.applyQuaternion(quatY);

    // 상하 회전: 카메라의 로컬 Right 축 기준
    const right = new THREE.Vector3().crossVectors(camera.up, offset).normalize();
    const quatX = new THREE.Quaternion().setFromAxisAngle(right, deltaPhi);
    offset.applyQuaternion(quatX);
    camera.up.applyQuaternion(quatX);

    camera.position.copy(CAM_STATE.target).add(offset);
    camera.lookAt(CAM_STATE.target);
}

/**
 * 카메라를 초기 위치로 재설정합니다. (Spherical 변환 없이 직접 포지션 설정)
 */
function resetCamera(center, distance) {
    CAM_STATE.target.copy(center);
    CAM_STATE.distance = distance;

    // 대각선 위쪽에서 아래를 내려다보는 초기 시점
    camera.position.set(
        center.x + distance * 0.5,
        center.y + distance * 0.6,
        center.z + distance * 0.7
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(CAM_STATE.target);
}

// 조명(Lighting) 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65); // 전체적으로 밝혀주는 은은한 빛
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); // 특정 방향에서 비추는 강한 빛 (그림자 생성)
dirLight.position.set(15, 25, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
scene.add(dirLight);

// 모든 블록을 담을 그룹 (한꺼번에 이동/회전 시 용이)
const gridGroup = new THREE.Group();
scene.add(gridGroup);

/**
 * 💡 통합 텍스처 생성 헬퍼: 256x256 Canvas에 배경색과 여러 이모지 레이어를 그립니다.
 * @param {string} bgColor - 배경색 (CSS 컬러 값)
 * @param {Array<{emoji: string, fontSize?: number, x?: number, y?: number}>} layers - 이모지 레이어 배열
 */
function createCanvasTexture(bgColor, layers) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;

    layers.forEach(({ emoji, fontSize = 140, x = 128, y = 140 }) => {
        ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`;
        ctx.fillText(emoji, x, y);
    });

    return new THREE.CanvasTexture(canvas);
}

const texFlag = createCanvasTexture('#f59e0b', [{ emoji: '🚩' }]);
const texMine = createCanvasTexture('#ef4444', [{ emoji: '💣' }]);
const texFlagCorrect = createCanvasTexture('#10b981', [
    { emoji: '💣', fontSize: 110, y: 150 },     // 지뢰 (배경)
    { emoji: '🚩', fontSize: 110, x: 110, y: 110 } // 깃발 (전경)
]); // 💡 정답인 깃발 (초록색 배경 + 지뢰 + 깃발)
const texFlagFalse = createCanvasTexture('#fca5a5', [
    { emoji: '🚩', fontSize: 130 },  // 깃발 (중앙)
    { emoji: '❌', fontSize: 160 }    // ❌ 겹침
]); // 💡 ❌ 오답 깃발 표시용 (연빨강 바탕 + 깃발 + ❌)

// 💡 Material Registry 패턴: 기본(base)과 강조(highlight) 쌍을 구조화하여 관리
const MATERIALS = {
    hidden: {
        base: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.1 }),
        highlight: new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.1, metalness: 0.2, emissive: 0x3b0764 })
    },
    hovered: { base: new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.1, metalness: 0.2, emissive: 0x112244 }) },
    flagged: {
        base: new THREE.MeshStandardMaterial({ map: texFlag, color: 0xffffff, roughness: 0.4, emissive: 0x442200 }),
        highlight: new THREE.MeshStandardMaterial({ map: texFlag, color: 0xffffff, roughness: 0.1, metalness: 0.2, emissive: 0x4c1d95 })
    },
    mine: {
        base: new THREE.MeshStandardMaterial({ map: texMine, color: 0xffffff, roughness: 0.2, emissive: 0x330000 }),
        highlight: new THREE.MeshStandardMaterial({ map: texMine, color: 0xffffff, roughness: 0.1, metalness: 0.2, emissive: 0x4c1d95 })
    },
    flagCorrect: {
        base: new THREE.MeshStandardMaterial({ map: texFlagCorrect, color: 0xffffff, roughness: 0.2, emissive: 0x064e3b }),
        highlight: new THREE.MeshStandardMaterial({ map: texFlagCorrect, color: 0xffffff, roughness: 0.1, metalness: 0.2, emissive: 0x4c1d95 })
    },
    flagFalse: {
        base: new THREE.MeshStandardMaterial({ map: texFlagFalse, color: 0xffffff, roughness: 0.2, emissive: 0x4c0519 }),
        highlight: new THREE.MeshStandardMaterial({ map: texFlagFalse, color: 0xffffff, roughness: 0.1, metalness: 0.2, emissive: 0x4c1d95 })
    },
};
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true });


// Geometry
const blockGeo = new THREE.BoxGeometry(CONFIG.blockSize, CONFIG.blockSize, CONFIG.blockSize);
const edgesGeo = new THREE.EdgesGeometry(blockGeo);

// 💡 공유 Geometry 참조 — initGame에서 dispose하지 않도록 보호하기 위한 집합
const sharedGeometries = new Set([blockGeo, edgesGeo]);

// UI Elements (DOMContentLoaded 이후에 초기화해야 하므로 let으로 선언)
let elMineCount, elGridDisplay, btnModeDig, btnModeFlag, btnModeHighlight, btnModeChord, btnModePan, btnResume, modal, modalTitle, modalDesc, startMenuOverlay, gameHelpOverlay, elModeDesc;


document.addEventListener('DOMContentLoaded', () => {
    elMineCount = document.getElementById('mine-count');
    elGridDisplay = document.getElementById('grid-size-display');
    btnModeDig = document.getElementById('btn-mode-dig');
    btnModeFlag = document.getElementById('btn-mode-flag');
    btnModeHighlight = document.getElementById('btn-mode-highlight'); // 💡 강조 버튼 추가
    btnModePan = document.getElementById('btn-mode-pan'); // 💡 이동 모드 버튼 (상단 let에 통합)
    btnResume = document.getElementById('btn-resume'); // 💡 돌아가기 버튼 추가
    const btnRecenter = document.getElementById('btn-recenter'); // 💡 중앙 정렬 버튼 추가
    modal = document.getElementById('message-modal');
    modalTitle = document.getElementById('message-title');
    modalDesc = document.getElementById('message-desc');
    startMenuOverlay = document.getElementById('start-menu-overlay');
    gameHelpOverlay = document.getElementById('game-help-overlay');
    elModeDesc = document.getElementById('mode-desc-text'); // 💡 하단 동적 설명 컴포넌트 추가
    const btnModalReview = document.getElementById('btn-modal-review'); // 💡 복기 버튼 변수 추가


    // UI Listeners setup
    document.getElementById('btn-restart').addEventListener('click', showStartMenu);
    document.getElementById('btn-modal-restart').addEventListener('click', showStartMenu);
    btnResume.addEventListener('click', resumeGame); // 💡 돌아가기 이벤트 연결

    // 💡 복기용 이벤트 연결 (완료된 게임을 관찰하기 위한 리뷰 모드로 변환)
    btnModalReview.addEventListener('click', () => {
        modal.classList.add('hidden');
        STATE.status = 'review';
        STATE.currentMode = 'highlight'; // 💡 기본값을 탐색으로 설정

        // 파기, 깃발, 연쇄파기 조작 숨김 (탐색과 이동만 허용)
        btnModeDig.style.display = 'none';
        btnModeFlag.style.display = 'none';
        btnModeChord.style.display = 'none';

        updateUI();
    });

    // 💡 게임 설명 열기/닫기 이벤트 연결
    document.getElementById('btn-game-help').addEventListener('click', () => {
        gameHelpOverlay.classList.remove('hidden');
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
        gameHelpOverlay.classList.add('hidden');
    });


    // 💡 각 모드 버튼 클릭 시 상태 변경 (탐색/연쇄 선택은 유지됨 — 사용자가 직접 해제할 때만 초기화)
    btnModeDig.addEventListener('click', () => {
        STATE.currentMode = 'dig';
        updateUI();
    });

    btnModeFlag.addEventListener('click', () => {
        STATE.currentMode = 'flag';
        updateUI();
    });

    btnModeHighlight.addEventListener('click', () => {
        STATE.currentMode = 'highlight';
        updateUI();
    });

    btnModePan.addEventListener('click', () => {
        STATE.currentMode = 'pan';
        // 💡 이동 모드로 전환해도 탐색/연쇄 선택은 유지
        updateUI();
    });

    btnRecenter.addEventListener('click', () => {
        // 💡 큐브의 실제 중심 좌표를 계산하여 회전 타겟(pivot)으로 설정
        const size = CONFIG.gridSize;
        const center = (size - 1) * CONFIG.spacing / 2;
        const centerVec = new THREE.Vector3(center, center, center);
        resetCamera(centerVec, size * 2.5);
    });

    btnModeChord = document.getElementById('btn-mode-chord');
    btnModeChord.addEventListener('click', () => {
        STATE.currentMode = 'chord';
        // 💡 연쇄 모드로 전환 시 탐색에서 선택한 블록이 그대로 연동됨 (꾹 누르면 즉시 연쇄 파기 가능)
        updateUI();
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const size = parseInt(e.currentTarget.dataset.size);
            const mines = parseInt(e.currentTarget.dataset.mines);
            startGame(size, mines);
        });
    });

    document.getElementById('btn-random-shape').addEventListener('click', () => {
        const choices = RANDOM_BOARD_SHAPES.filter(shape => shape !== CONFIG.boardShape);
        const shape = choices[Math.floor(Math.random() * choices.length)];
        const size = 7;
        const mines = Math.max(1, Math.floor(countBoardCells(size, shape) * CONFIG.autoMineRatio));
        startGame(size, mines, shape);
    });

    const checkAutoMines = document.getElementById('custom-auto-mines');
    const inputCustomSize = document.getElementById('custom-size');
    const inputCustomMines = document.getElementById('custom-mines');
    const displayTotalBlocks = document.getElementById('custom-total-blocks');
    const valCustomSize = document.getElementById('custom-size-val'); // 💡 크기 라벨 변수 추가

    function updateTotalBlocks() {
        if (!displayTotalBlocks) return;
        const size = parseInt(inputCustomSize.value) || 4;
        const total = Math.pow(size, 3);

        if (valCustomSize) valCustomSize.textContent = size; // 💡 슬라이더 값에 맞춰 텍스트 업데이트

        displayTotalBlocks.textContent = `(총 ${total}개 블록)`;

        const displayMinesRange = document.getElementById('custom-mines-range');
        if (displayMinesRange) {
            const maxMines = Math.max(1, total - 2);
            inputCustomMines.max = maxMines; // 💡 최대 가능 지뢰수 동적으로 슬라이더 max 속성에 덮어쓰기
            displayMinesRange.textContent = `(최대 허용: ${maxMines})`;

            // 💡 수동 모드에서 사이즈가 줄어들어 현재 지뢰 개수가 최대 허용치를 넘었을 때 지뢰 개수를 최대값으로 제한(Clamp)
            if (!checkAutoMines.checked && parseInt(inputCustomMines.value) > maxMines) {
                inputCustomMines.value = maxMines;
            }
        }
    }

    function calculateAutoMines() {
        if (checkAutoMines.checked) {
            const size = parseInt(inputCustomSize.value) || 4;
            // 게임성에 맞는 15% 정도의 쾌적한 지뢰 비율
            let autoMines = Math.floor(Math.pow(size, 3) * CONFIG.autoMineRatio);
            if (autoMines < 1) autoMines = 1;
            inputCustomMines.value = autoMines;
            inputCustomMines.disabled = true;
            inputCustomMines.readOnly = true;
            inputCustomMines.style.pointerEvents = 'none';
        } else {
            inputCustomMines.disabled = false;
            inputCustomMines.readOnly = false;
            inputCustomMines.style.pointerEvents = 'auto';
        }
    }

    // 💡 사용자가 수동으로 지뢰 개수를 타이핑 시 허용 범위를 넘지 않게 실시간 치환
    inputCustomMines.addEventListener('input', () => {
        const maxMines = parseInt(inputCustomMines.max);
        if (parseInt(inputCustomMines.value) > maxMines) {
            inputCustomMines.value = maxMines;
        }
    });

    // 초기 상태 반영
    updateTotalBlocks();
    calculateAutoMines();

    const triggerAutoCalc = () => {
        updateTotalBlocks();
        if (checkAutoMines.checked) {
            calculateAutoMines();
        }
    };

    ['input', 'change', 'keyup', 'click'].forEach(evt => {
        inputCustomSize.addEventListener(evt, triggerAutoCalc);
    });

    checkAutoMines.addEventListener('change', calculateAutoMines);

    document.getElementById('btn-custom-start').addEventListener('click', () => {
        const size = parseInt(document.getElementById('custom-size').value);
        const mines = parseInt(document.getElementById('custom-mines').value);
        const errObj = document.getElementById('custom-error');

        if (isNaN(size) || size < 2 || size > 20) {
            errObj.textContent = "크기는 2에서 20 사이로 입력해주세요.";
            errObj.classList.remove('hidden');
            return;
        }

        // 💡 최소 2개의 안전 셀을 보장하여 게임 플레이 가능하도록 제한
        const maxMines = Math.pow(size, 3) - 2;
        if (isNaN(mines) || mines < 1 || mines > maxMines) {
            errObj.textContent = `지뢰 개수는 1개에서 ${maxMines}개 사이여야 합니다.`;
            errObj.classList.remove('hidden');
            return;
        }

        startGame(size, mines);
    });


    function updateCellMaterial(cell) {
        // 💡 열려있는 블럭 중에서도 지뢰 블럭(밟아서 터진 폭탄)은 예외적으로 지나가도록 허용합니다.
        if (cell.state === 'revealed' && !cell.isMine) return;

        let baseMat = MATERIALS.hidden.base;
        const isGameEnded = STATE.status === 'lost' || STATE.status === 'won' || STATE.status === 'review';

        // 💡 게임 종료 후(복기 포함)에는 노출된 지뢰와 오답 깃발의 시각적 정보를 덮어쓰지 않고 보존
        if (isGameEnded) {
            if (cell.isMine) {
                baseMat = (cell.state === 'flagged') ? MATERIALS.flagCorrect.base : MATERIALS.mine.base;
            } else if (cell.state === 'flagged') {
                baseMat = MATERIALS.flagFalse.base;
            } else {
                baseMat = MATERIALS.hidden.base;
            }
        } else {
            baseMat = (cell.state === 'flagged') ? MATERIALS.flagged.base : MATERIALS.hidden.base;
        }

        if (STATE.highlightedCells.includes(cell)) {
            // 💡 게임 종료(복기) 후에는 지뢰나 오답 깃발, 정답 깃발 등 중요 상태의 시각적 보존을 위해 색상을 섞어(Emissive + texture) 표시함
            if (isGameEnded && baseMat !== MATERIALS.hidden.base) {
                if (baseMat === MATERIALS.mine.base) cell.mesh.material = MATERIALS.mine.highlight;
                else if (baseMat === MATERIALS.flagCorrect.base) cell.mesh.material = MATERIALS.flagCorrect.highlight;
                else if (baseMat === MATERIALS.flagFalse.base) cell.mesh.material = MATERIALS.flagFalse.highlight;
                else cell.mesh.material = baseMat; // 예비용 폴백
            } else if (cell.state === 'flagged' || baseMat === MATERIALS.flagCorrect.base) {
                cell.mesh.material = MATERIALS.flagged.highlight;
            } else {
                cell.mesh.material = MATERIALS.hidden.highlight;
            }
            return;
        }

        if (STATE.hoveredCell === cell && baseMat === MATERIALS.hidden.base) {
            cell.mesh.material = MATERIALS.hovered.base;
            return;
        }

        cell.mesh.material = baseMat;
    }

    function clearHighlight() {
        if (STATE.highlightedCells && STATE.highlightedCells.length > 0) {
            const cellsToUpdate = [...STATE.highlightedCells];
            STATE.highlightedCells = [];
            cellsToUpdate.forEach(n => updateCellMaterial(n));
        }
        // 💡 강조되었던 단일 숫자(Sprite)가 있다면 원래 크기 및 색상으로 복구
        if (STATE.activeSprite) {
            STATE.activeSprite.scale.set(1.0, 1.0, 1.0);
            STATE.activeSprite.material.color.setHex(0xffffff);
            STATE.activeSprite = null;
        }
        // 💡 롱프레스로 다중 강조되었던 숫자(Sprite) 배열 복구
        if (STATE.highlightedSprites && STATE.highlightedSprites.length > 0) {
            STATE.highlightedSprites.forEach(s => {
                s.scale.set(1.0, 1.0, 1.0);
                s.material.color.setHex(0xffffff);
            });
            STATE.highlightedSprites = [];
        }
    }

    /**
     * 💡 공통 강조 함수: 숫자(Sprite)를 선택하여 주변 셀을 강조 표시합니다.
     * 클릭/꾹 누르기 양쪽에서 동일한 로직을 재사용합니다.
     */
    function highlightNeighbors(sprite) {
        if (sprite === STATE.activeSprite) return false;
        clearHighlight();
        STATE.activeSprite = sprite;
        sprite.scale.set(CONFIG.highlightScale, CONFIG.highlightScale, CONFIG.highlightScale);
        sprite.material.color.setHex(0xd8b4fe); // 💡 기본색에 보라색(퍼플 틴트) 혼합
        const cell = sprite.userData.cell;
        const neighbors = getNeighbors(cell);
        STATE.highlightedCells = neighbors.filter(n => n.state === 'hidden' || n.state === 'flagged' || n.isMine);
        STATE.highlightedCells.forEach(n => updateCellMaterial(n));
        return true;
    }

    // --- Game Setup Logic ---

    function startGame(size, mines, shape = 'cube') {
        CONFIG.gridSize = size;
        CONFIG.mineCount = mines;
        CONFIG.boardShape = shape;

        const d = size * 1.5;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.updateProjectionMatrix();

        CAM_STATE.minDistance = size * 0.8;
        CAM_STATE.maxDistance = size * 3.5;

        const center = (size - 1) * CONFIG.spacing / 2;
        const centerVec = new THREE.Vector3(center, center, center);
        resetCamera(centerVec, size * 2.5);

        startMenuOverlay.style.display = 'none';
        elGridDisplay.textContent = shape === 'cube'
            ? `정육면체 · ${size} × ${size} × ${size}`
            : `${BOARD_SHAPE_NAMES[shape]} · ${countBoardCells(size, shape)}칸`;

        initGame();
    }

    function showStartMenu() {
        if (STATE.status !== 'menu') {
            STATE.prevStatus = STATE.status; // 💡 현재 상태 저장 (playing, won, lost)
        }
        STATE.status = 'menu';
        startMenuOverlay.style.display = 'flex';
        modal.classList.add('hidden');

        const elCustomSize = document.getElementById('custom-size');
        elCustomSize.value = CONFIG.gridSize;
        elCustomSize.dispatchEvent(new Event('input')); // 💡 초기 렌더링 시 값 동기화 트리거

        document.getElementById('custom-mines').value = CONFIG.mineCount;
        document.getElementById('custom-error').classList.add('hidden');

        // 💡 진행 중인 게임이 있고, 아직 플레이 중일 때만 돌아가기 버튼 표시
        if (STATE.cells.length > 0 && STATE.prevStatus === 'playing') {
            btnResume.classList.remove('hidden');
        } else {
            btnResume.classList.add('hidden');
        }
    }

    /**
     * 일시 정지(메뉴) 상태에서 다시 게임으로 돌아갑니다.
     */
    function resumeGame() {
        startMenuOverlay.style.display = 'none';
        STATE.status = STATE.prevStatus;
    }

    /**
     * 배경과 격자를 초기화하고 새로운 게임을 준비합니다.
     */
    function initGame() {
        STATE.isFirstClick = true;
        STATE.status = 'playing';
        STATE.minesLeft = CONFIG.mineCount;
        STATE.safeCellsRemaining = 0;
        STATE.hoveredCell = null;
        STATE.highlightedCells = [];
        document.body.style.cursor = 'default';
        STATE.currentMode = 'dig'; // 초기 모드 명시적 설정

        // 버튼 디스플레이 복구 (복기 모드에서 숨겨졌을 수 있음)
        btnModeDig.style.display = '';
        btnModeFlag.style.display = '';
        btnModeChord.style.display = '';

        updateUI();
        modal.classList.add('hidden');

        // 기존에 생성된 격자 및 숫자(Sprite) 객체들을 메모리에서 해제하고 제거
        while (gridGroup.children.length > 0) {
            const child = gridGroup.children[0];
            if (child.type === 'Sprite' && child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
            // 💡 Mesh 자식(LineSegments 등)도 정리하여 메모리 누수 방지
            if (child.type === 'Mesh') {
                child.children.forEach(sub => {
                    if (sub.geometry && !sharedGeometries.has(sub.geometry)) sub.geometry.dispose();
                    if (sub.material && sub.material !== lineMaterial) sub.material.dispose();
                });
                child.clear(); // 모든 자식 제거
            }
            gridGroup.remove(child);
        }
        STATE.cells = [];
        STATE.cellGrid = [];

        // 3D 인덱스 배열 초기화 및 셀(Mesh) 생성
        for (let x = 0; x < CONFIG.gridSize; x++) {
            STATE.cellGrid[x] = [];
            for (let y = 0; y < CONFIG.gridSize; y++) {
                STATE.cellGrid[x][y] = [];
                for (let z = 0; z < CONFIG.gridSize; z++) {
                    if (!hasBoardCell(x, y, z, CONFIG.gridSize, CONFIG.boardShape)) continue;
                    const mesh = new THREE.Mesh(blockGeo, MATERIALS.hidden.base);
                    mesh.position.set(x * CONFIG.spacing, y * CONFIG.spacing, z * CONFIG.spacing);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    // 블록의 테두리(Edges) 추가
                    const edges = new THREE.LineSegments(edgesGeo, lineMaterial);
                    mesh.add(edges);
                    gridGroup.add(mesh);

                    const cell = {
                        x, y, z, mesh,
                        isMine: false, neighborMines: 0, state: 'hidden'
                    };
                    mesh.userData.cell = cell; // 💡 역참조: mesh에서 cell로 O(1) 접근
                    STATE.cells.push(cell);
                    STATE.cellGrid[x][y][z] = cell;
                }
            }
        }
        STATE.safeCellsRemaining = STATE.cells.length - CONFIG.mineCount;
    }

    /**
     * 💡 3D 인덱스 배열을 활용한 O(1) 셀 접근 함수.
     * 격자 범위를 벗어나는 경우 null을 반환합니다.
     */
    function getCell(x, y, z) {
        if (x < 0 || x >= CONFIG.gridSize || y < 0 || y >= CONFIG.gridSize || z < 0 || z >= CONFIG.gridSize) return null;
        return STATE.cellGrid[x][y][z] || null;
    }

    /**
     * 특정 셀의 인접한 26개(3x3x3 - 자신) 셀 목록을 가져옵니다.
     */
    function getNeighbors(cell) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue;
                    const n = getCell(cell.x + dx, cell.y + dy, cell.z + dz);
                    if (n) neighbors.push(n);
                }
            }
        }
        return neighbors;
    }

    /**
     * 💡 Fisher-Yates 셔플 기반 지뢰 배치.
     * 첫 클릭 셀(safeCell) 주변을 보호하여 쾌적한 시작을 보장합니다.
     */
    function placeMines(safeCell) {
        // 💡 3x3x3 등 작은 맵에서는 주변 26방향을 모두 보호하면 거의 모든 칸이 안전해질 수 있음.
        // 따라서 N < 4 인 경우 클릭한 셀 본인만 보호하여 게임성을 확보함.
        let safeZone = new Set();
        if (CONFIG.gridSize >= 4) {
            getNeighbors(safeCell).forEach(n => safeZone.add(n));
        }
        safeZone.add(safeCell);

        // 안전 구역을 제외한 배치 가능 셀 목록 구성
        let candidates = STATE.cells.filter(c => !safeZone.has(c));

        // 예외 상황: 안전 구역 제외 후 지뢰 자리가 부족하면 첫 클릭 셀만 보호
        if (candidates.length < CONFIG.mineCount) {
            candidates = STATE.cells.filter(c => c !== safeCell);
        }

        // Fisher-Yates 알고리즘으로 무작위 셔플 (O(N))
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // 셔플된 배열의 앞부분에서 mineCount만큼 지뢰로 설정
        const mineCountToPlace = Math.min(CONFIG.mineCount, candidates.length);
        for (let i = 0; i < mineCountToPlace; i++) {
            candidates[i].isMine = true;
        }

        // 각 셀의 인접 지뢰 수(neighborMines) 미리 계산
        STATE.cells.forEach(cell => {
            if (!cell.isMine) {
                cell.neighborMines = getNeighbors(cell).filter(n => n.isMine).length;
            }
        });
    }

    /**
     * 셀 안에 표시될 숫자(1~8 등) 애니메이션 스프라이트를 생성합니다.
     */
    function createTextSprite(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // 숫자에 따른 색상 팔레트 (전통적인 지뢰찾기 스타일 + 모던)
        const colors = ['#ffffff', '#60a5fa', '#4ade80', '#f87171', '#c084fc', '#fbbf24', '#22d3ee', '#f472b6', '#e2e8f0'];

        ctx.font = '900 80px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 텍스트 테두리(stroke) 추가로 가독성 확보
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#0f172a';
        ctx.strokeText(number.toString(), 64, 66);

        ctx.fillStyle = colors[number] || '#ffffff';
        ctx.fillText(number.toString(), 64, 66);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.85, 0.85, 0.85); // 기본 크기 설정
        return sprite;
    }

    /**
     * 💡 BFS 기반 셀 열기 로직.
     * 빈 칸 클릭 시 주변 칸들을 연쇄적으로 탐색하여 엽니다. (재귀 대신 큐 사용으로 스택 오버플로우 방지)
     */
    function revealCell(startCell) {
        if (startCell.state !== 'hidden' || STATE.status !== 'playing') return;

        // 지뢰를 밟은 경우 즉시 패배 처리
        if (startCell.isMine) {
            startCell.state = 'revealed';
            startCell.mesh.material = MATERIALS.mine.base;
            gameOver(false);
            return;
        }

        // BFS 탐색 큐 시작
        const queue = [startCell];
        while (queue.length > 0) {
            const cell = queue.shift();
            if (cell.state !== 'hidden') continue;

            cell.state = 'revealed';
            cell.mesh.visible = false; // 격자 큐브를 숨겨 내부를 보이게 함
            STATE.safeCellsRemaining--;

            if (cell.neighborMines > 0) {
                // 숫자가 있는 칸이면 스프라이트 생성하여 배치
                const sprite = createTextSprite(cell.neighborMines);
                sprite.position.copy(cell.mesh.position);
                sprite.userData = { cell: cell };
                cell.sprite = sprite; // 💡 O(1) 역참조: cell을 통해 언제든 sprite 접근 가능
                gridGroup.add(sprite);
            } else {
                // 인접 지뢰가 없는 빈 칸(0)이면 주변 26개 칸을 모두 큐에 추가 (BFS 연쇄 오픈)
                getNeighbors(cell).forEach(n => {
                    if (n.state === 'hidden') queue.push(n);
                });
            }
        }

        checkWinCondition();
    }

    /**
     * 특정 셀에 깃발을 꽂거나 뽑습니다.
     */
    function toggleFlag(cell) {
        if (STATE.status !== 'playing') return;
        if (cell.state === 'revealed') return;

        if (cell.state === 'hidden') {
            // 💡 클래식 룰: 무제한으로 깃발을 꽂을 수 있어도(음수 허용) 제지하지 않음
            cell.state = 'flagged';
            STATE.minesLeft--;
        } else if (cell.state === 'flagged') {
            cell.state = 'hidden';
            STATE.minesLeft++;
        }
        updateCellMaterial(cell); // 머티리얼 업데이트 (🚩 텍스처 적용 등)
        updateUI();
    }

    /**
     * 💡 Chording(한번에 파기) 기능: 
     * 열려 있는 숫자 칸 주변에 숫만큼의 깃발이 이미 꽂혀 있다면, 나머지 hidden 블록들을 한꺼번에 엽니다.
     */
    function performChording(cell) {
        if (cell.state !== 'revealed' || cell.neighborMines === 0) return;

        const neighbors = getNeighbors(cell);
        const flaggedCount = neighbors.filter(n => n.state === 'flagged').length;

        // 주변 깃발 수가 숫자와 일치할 때만 동작 (전통적인 지뢰찾기 고급 편의 기능)
        if (flaggedCount === cell.neighborMines) {
            neighbors.forEach(n => {
                if (n.state === 'hidden') {
                    // 🚨 잘못된 깃발이 꽂혀 있었다면 여기서 지뢰를 밟아 게임 오버될 수 있습니다.
                    revealCell(n);
                }
            });
        }
    }

    /**
     * 게임 종료(승리 또는 패배)를 처리합니다.
     */
    function gameOver(isWin) {
        STATE.status = isWin ? 'won' : 'lost';

        // 💡 클래식 지뢰찾기 디테일: 승리/패배 시의 시각적 피드백 강화
        STATE.cells.forEach(c => {
            if (isWin) {
                // 승리 시: 찾지 못하고 남겨둔 지뢰에도 자동으로 깃발이 꼽히게 함
                if (c.isMine) {
                    c.state = 'flagged';
                    c.mesh.material = MATERIALS.flagCorrect.base;
                    c.mesh.visible = true;
                }
            } else {
                // 패배 시
                if (c.isMine) {
                    if (c.state === 'flagged') {
                        // 성공적으로 찾은 지뢰: 깃발과 지뢰 아이콘이 겹쳐진 녹색 머티리얼 적용
                        c.mesh.material = MATERIALS.flagCorrect.base;
                    } else {
                        // 발견하지 못한 지뢰: 빨간색 지뢰 노출
                        c.mesh.material = MATERIALS.mine.base;
                    }
                    c.mesh.visible = true; // 가려졌던 지뢰 블록을 노출
                } else if (!c.isMine && c.state === 'flagged') {
                    // 💡 오답 깃발 (False Flag): 깃발 위에 X 표시가 겹쳐진 머티리얼 적용
                    c.mesh.material = MATERIALS.flagFalse.base;
                }
            }
        });

        if (isWin) {
            STATE.minesLeft = 0; // 모든 지뢰를 찾은 것으로 간주해 남은 갯수를 0으로 강제 교정
            updateUI();
        }

        // 결과에 따른 토스트 모달 스타일 및 메시지 설정
        modal.classList.remove('toast-lost', 'toast-won');
        if (!isWin) {
            modal.classList.add('toast-lost');
            modalTitle.textContent = "게임 오버!";
            modalTitle.className = "font-black text-gradient status-lost";
            modalDesc.textContent = "지뢰를 건드렸습니다 💥";
        } else {
            modal.classList.add('toast-won');
            modalTitle.textContent = "승리!";
            modalTitle.className = "font-black text-gradient status-won";
            modalDesc.textContent = "모든 지뢰를 찾아냈습니다 🎉";
        }

        modal.classList.remove('hidden'); // 모달 표시
    }

    /**
     * 💡 승리 조건을 체크합니다 (남은 안전한 칸이 0이면 승리).
     * O(1) 성능의 카운터 기반 체크 방식을 사용하여 매 클릭 시 부하를 최소화했습니다.
     */
    function checkWinCondition() {
        if (STATE.safeCellsRemaining === 0) {
            gameOver(true);
        }
    }

    /**
     * 현재 게임 모드(파기, 깃발, 강조 등)에 따라 하단 UI 버튼의 스타일을 동적으로 변경합니다.
     */
    function updateUI() {
        elMineCount.textContent = STATE.minesLeft;

        // 모든 버튼에서 활성화 스타일(active-*) 제거
        [btnModeDig, btnModeFlag, btnModeHighlight, btnModeChord, btnModePan].forEach(btn => {
            btn.classList.remove('active-dig', 'active-flag', 'active-highlight', 'active-chord', 'active-pan');
        });

        // 현재 선택된 모드 버튼에만 활성화 스타일 추가
        if (STATE.currentMode === 'dig') btnModeDig.classList.add('active-dig');
        else if (STATE.currentMode === 'flag') btnModeFlag.classList.add('active-flag');
        else if (STATE.currentMode === 'highlight') btnModeHighlight.classList.add('active-highlight');
        else if (STATE.currentMode === 'chord') btnModeChord.classList.add('active-chord');
        else if (STATE.currentMode === 'pan') btnModePan.classList.add('active-pan'); // 💡 판(Pan) 모드 시각적 활성화

        // 💡 이동(Pan) 모드는 커스텀 카메라 시스템에서 pointermove 이벤트 내에서 직접 처리됨

        // 💡 하단 모드 가이드 설명 동적 갱신
        if (elModeDesc) {
            if (STATE.currentMode === 'dig') elModeDesc.innerHTML = '⛏️ <b>파기</b>: 안전하다고 확신하는 의심 없는 블록을 터치해 까냅니다.';
            else if (STATE.currentMode === 'flag') elModeDesc.innerHTML = '🚩 <b>깃발</b>: 지뢰가 의심되는 곳에 깃발을 꽂아 표시합니다.';
            else if (STATE.currentMode === 'pan') elModeDesc.innerHTML = '✋ <b>이동</b>: 화면을 <b>상하좌우로 끌어서 이동</b>하는 안전한 관찰 모드입니다.';
            else if (STATE.currentMode === 'highlight') elModeDesc.innerHTML = '🔍 <b>탐색</b>: 숫자(클릭) → 주변 블록 표시, 안 풀린 블록(꾹 누르기) → 주변 숫자 표시';
            else if (STATE.currentMode === 'chord') elModeDesc.innerHTML = '⚡ <b>연쇄 파기</b>: "숫자=주변 깃발 수"일 때 <b>숫자를 선택(터치) 후 0.3초간 꾹 누르면</b> 나머지를 팝니다!';
        }
    }

    // --- 사용자 조작 및 상호작용 (Interaction Logic) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let mouseDownPos = { x: 0, y: 0 };
    let longPressTimer = null;
    let isLongPressing = false;
    let activePointers = 0;
    let isMultiTouch = false;
    let pointerCache = []; // 멀티터치(핀치 줌) 포인터 추적용
    let prevPinchDist = -1;
    let mouseDown = false;    // 💡 마우스/터치 누름 상태 추적 (관성 처리용)
    let isDragging = false;   // 💡 드래그 중 여부
    let lastPosX = 0;         // 💡 마지막 포인터 X 위치
    let lastPosY = 0;         // 💡 마지막 포인터 Y 위치

    // 우클릭 시 브라우저 기본 컨텍스트 메뉴 차단
    document.addEventListener('contextmenu', e => e.preventDefault());

    /**
     * 클릭/터치 좌표를 기반으로 3D 공간 내의 객체와 상호작용을 처리합니다.
     */
    function handleInteraction(clientX, clientY, isRightClick) {
        // 정규화된 디바이스 좌표(NDC) 계산
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // 💡 팬(Pan) 모드 중 캔버스를 단순 클릭하거나 터치하면 어떠한 블록 상호작용 및 모드 전환도 발생하지 않음 (오직 드래그 후 다른 조작 버튼을 눌러야만 해제)
        if (STATE.currentMode === 'pan') {
            return;
        }

        // 💡 깃발/파기 모드에서는 숫자를 무시하고 블록에만 레이캐스팅이 집중되도록 처리
        if (STATE.currentMode !== 'flag' && STATE.currentMode !== 'dig') {
            // 숫자(Sprite) 객체와의 충돌 검사
            const spriteIntersects = raycaster.intersectObjects(gridGroup.children, false).filter(hit => hit.object.type === 'Sprite');
            if (spriteIntersects.length > 0) {
                let selectedSprite = spriteIntersects[0].object;

                // 💡 겹쳐진 숫자 처리: 이미 활성화된 숫자가 가장 앞에 있다면 뒤의 숫자를 선택할 수 있게 함
                if (spriteIntersects.length > 1 && selectedSprite === STATE.activeSprite) {
                    selectedSprite = spriteIntersects[1].object;
                }

                const cell = selectedSprite.userData ? selectedSprite.userData.cell : null;
                if (cell && cell.state === 'revealed') {

                    // 한번에 파기(Chord) 또는 강조(Highlight) 모드 처리
                    if (STATE.currentMode === 'chord' || STATE.currentMode === 'highlight') {
                        // 같은 숫자를 다시 클릭한 경우: 파기 수행 대신 선택 해제 (꾹 누르기 방식으로 전환됨)
                        if (selectedSprite === STATE.activeSprite) {
                            clearHighlight();
                            return;
                        }

                        // 새로운 숫자를 클릭한 경우: 이전 강조를 지우고 새로운 숫자를 확대 강조
                        // 💡 공통 강조 함수로 중복 로직 제거
                        highlightNeighbors(selectedSprite);
                    }
                    return;
                }
            }
        }

        // 강조/파기 모드 활성화 중에 빈 공간 클릭 시 강조 초기화
        if (STATE.currentMode === 'highlight' || STATE.currentMode === 'chord') {
            clearHighlight();
            return;
        }

        // --- 일반 블록(Cube Mesh)과의 상호작용 --- (💡 gridGroup 직접 레이캐스트로 배열 재생성 제거)
        const intersects = raycaster.intersectObjects(gridGroup.children, false)
            .filter(hit => hit.object.type === 'Mesh' && hit.object.userData.cell && hit.object.userData.cell.state !== 'revealed');

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const cell = clickedMesh.userData.cell; // 💡 O(1) 역참조 (기존 find() 제거)

            // 💡 복기 모드 시 실제 블록 파기/깃발 등 지뢰 상호작용은 차단
            if (cell && STATE.status !== 'review') {
                const actionIsFlag = isRightClick || STATE.currentMode === 'flag';

                if (actionIsFlag) {
                    toggleFlag(cell);
                } else {
                    // 첫 클릭 시 지뢰 배치 (무조건 안전한 시작 보장)
                    if (STATE.isFirstClick) {
                        placeMines(cell);
                        STATE.isFirstClick = false;
                    }
                    revealCell(cell);
                }
            }
        }
    }

    renderer.domElement.addEventListener('pointerdown', (e) => {
        pointerCache.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
        activePointers = pointerCache.length;
        if (activePointers > 1) isMultiTouch = true; // 멀티터치 감지 (확대/축소 시 조작 차단용)
        mouseDown = true;     // 💡 마우스 누름 상태 활성화
        isDragging = false;
        lastPosX = e.clientX;
        lastPosY = e.clientY;

        if (STATE.status !== 'playing' && STATE.status !== 'review') return;
        mouseDownPos = { x: e.clientX, y: e.clientY };
        isLongPressing = false;

        // 💡 꾹 누르기(Long Press) 탐색 및 연쇄 지원: 0.3초간 누르고 있으면 액션 발동
        // 파기(dig) 모드에서는 즉각적인 피드백을 위해 꾹 누르기 기능을 비활성화함 (나머지는 허용)
        if (STATE.currentMode !== 'dig') {
            longPressTimer = setTimeout(() => {
                isLongPressing = true;

                // 💡 [연쇄 방식 변경] 겹쳐있는 블록 구분을 위해, 이미 선택된 숫자(activeSprite)가 있을 시 꾹 누르면 그 숫자 기준으로 연쇄 폭파 실행
                if (STATE.currentMode === 'chord' && STATE.activeSprite) {
                    performChording(STATE.activeSprite.userData.cell);
                    clearHighlight();
                    return; // 추가적인 레이캐스팅 무시
                }

                mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);

                if (STATE.currentMode === 'highlight') {
                    // 💡 탐색 모드 롱프레스: 숫자 뒤에 위치한 블록이라도 명확하게 찾아서 선택 우선순위를 부여함
                    let intersects = raycaster.intersectObjects(gridGroup.children, false);
                    let targetBlockHit = null;
                    let targetSpriteHit = null;

                    // 레이캐스팅된 모든 객체 중, 가장 가까운 유효 타겟(안 풀린 블럭 / 숫자)을 각각 탐색
                    for (let hit of intersects) {
                        if (!targetBlockHit && hit.object.type === 'Mesh') {
                            const c = hit.object.userData.cell;
                            // 이미 파인(revealed) 블록의 Mesh가 잡히더라도 무시하고 뒤쪽의 안 풀린 블록(hidden/flagged)을 찾음
                            if (c && (c.state === 'hidden' || c.state === 'flagged')) {
                                targetBlockHit = hit;
                            }
                        }
                        if (!targetSpriteHit && hit.object.type === 'Sprite') {
                            // 이미 선택된 숫자를 한 번 더 잡는 것은 무시
                            if (hit.object !== STATE.activeSprite) {
                                targetSpriteHit = hit;
                            }
                        }
                    }

                    // 💡 판단: 숫자가 앞에 있더라도 안 풀린 블록이 같이 감지되면 블록을 무조건 우선 선택("숫자 무시하고 블럭 선택")
                    if (targetBlockHit) {
                        const cell = targetBlockHit.object.userData.cell;
                        clearHighlight();
                        const neighbors = getNeighbors(cell);
                        const numberNeighbors = neighbors.filter(n => n.state === 'revealed' && n.neighborMines > 0 && n.sprite);

                        STATE.highlightedSprites = [];
                        numberNeighbors.forEach(n => {
                            n.sprite.scale.set(CONFIG.highlightScale, CONFIG.highlightScale, CONFIG.highlightScale);
                            n.sprite.material.color.setHex(0xd8b4fe); // 퍼플 틴트
                            STATE.highlightedSprites.push(n.sprite);
                        });

                        // 💡 선택된 기준(안 풀린 블록) 시각적 하이라이트 적용
                        STATE.highlightedCells = [cell];
                        updateCellMaterial(cell);
                    } else if (targetSpriteHit) {
                        // 허공이나 풀린 블록 허점 클릭 방지, 만약 숫자만 덩그러니 있다면 숫자 롱프레스도 일반 터치처럼 지원
                        const sprite = targetSpriteHit.object;
                        if (sprite.userData && sprite.userData.cell) {
                            highlightNeighbors(sprite);
                        }
                    }
                } else {
                    // 기본 로직: (Flag, Pan, Chord 모드) 숫자 스프라이트에 레이캐스팅
                    let spriteIntersects = raycaster.intersectObjects(gridGroup.children, false).filter(hit => hit.object.type === 'Sprite');

                    // 💡 이미 강조된 숫자를 관통하여 뒤의 객체를 잡지 못하게 방지
                    if (spriteIntersects.length > 1 && spriteIntersects[0].object === STATE.activeSprite) {
                        spriteIntersects.shift();
                    }

                    if (spriteIntersects.length > 0) {
                        const sprite = spriteIntersects[0].object;
                        if (sprite.userData && sprite.userData.cell) {
                            highlightNeighbors(sprite);
                        }
                    }
                }
            }, CONFIG.longPressDuration);
        }
    });

    renderer.domElement.addEventListener('pointermove', (e) => {
        // 포인터 위치 갱신
        const index = pointerCache.findIndex(p => p.id === e.pointerId);
        if (index !== -1) {
            pointerCache[index].x = e.clientX;
            pointerCache[index].y = e.clientY;
        }

        // 💡 핀치 줌 (모바일 터치 확대/축소) - 충돌 제한 없이 무제한 관통
        if (pointerCache.length === 2) {
            const dx = pointerCache[0].x - pointerCache[1].x;
            const dy = pointerCache[0].y - pointerCache[1].y;
            const curPinchDist = Math.hypot(dx, dy);

            if (prevPinchDist > 0) {
                // 거리가 멀어지면 zoomFactor < 1 (확대), 가까워지면 > 1 (축소)
                const zoomFactor = prevPinchDist / curPinchDist;

                const offset = camera.position.clone().sub(CAM_STATE.target);
                const currentDist = offset.length();
                let newDist = THREE.MathUtils.clamp(currentDist * zoomFactor, CAM_STATE.minDistance, CAM_STATE.maxDistance);

                offset.normalize().multiplyScalar(newDist);
                camera.position.copy(CAM_STATE.target).add(offset);
                camera.lookAt(CAM_STATE.target);
            }
            prevPinchDist = curPinchDist;
            return; // 핀치 줌 중에는 다른 회전/이동 무시
        }

        // 💡 카메라 회전/이동 처리 (mouseDown 상태일 때만)
        if (mouseDown && pointerCache.length === 1) { // 터치가 하나일 때만 이동/회전
            const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);

            if (dist > CONFIG.dragThreshold) {
                isDragging = true;

                const moveX = e.clientX - lastPosX;
                const moveY = e.clientY - lastPosY;

                if (STATE.currentMode === 'pan') {
                    // ✋ 상하좌우 이동 (Panning)
                    const camDist = camera.position.distanceTo(CAM_STATE.target);
                    const panSpeed = 0.01 * (camDist / 10);
                    const vRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
                    const vUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
                    const panVector = vRight.multiplyScalar(-moveX * panSpeed)
                        .add(vUp.multiplyScalar(moveY * panSpeed));
                    CAM_STATE.target.add(panVector);
                    camera.position.add(panVector);
                    camera.lookAt(CAM_STATE.target);
                } else {
                    // 🔄 회전 (Rotation) - 관성 없이 즉각적으로 반영
                    const rotateSpeed = 0.005;
                    applyCameraRotation(-moveX * rotateSpeed, -moveY * rotateSpeed);
                }

                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        }

        if (STATE.status !== 'playing' && STATE.status !== 'review') return;

        // 터치/클릭 후 일정 거리 이상 움직이면 꾹 누르기 타이머 취소
        const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
        if (dist > CONFIG.dragThreshold) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (isLongPressing) {
                clearHighlight();
                isLongPressing = false;
            }
        }

        // 마우스 호버 효과 (PC 전용, 드래그 중이 아닐 때만)
        if (e.pointerType === 'mouse' && !isDragging) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            // 💡 gridGroup의 모든 자식에 대해 레이캐스트 후 userData.cell로 직접 접근 (배열 재생성 제거)
            const intersects = raycaster.intersectObjects(gridGroup.children, false)
                .filter(hit => hit.object.type === 'Mesh' && hit.object.userData.cell && hit.object.userData.cell.state !== 'revealed');

            if (intersects.length > 0) {
                const cell = intersects[0].object.userData.cell;
                if (cell !== STATE.hoveredCell) {
                    const oldHovered = STATE.hoveredCell;
                    STATE.hoveredCell = cell;
                    if (oldHovered) updateCellMaterial(oldHovered);
                    if (STATE.hoveredCell) updateCellMaterial(STATE.hoveredCell);
                    document.body.style.cursor = 'pointer';
                }
            } else {
                // 호버 중인 셀이 없으면 커서와 머티리얼 복구
                if (STATE.hoveredCell && STATE.hoveredCell.state !== 'revealed') {
                    const oldHovered = STATE.hoveredCell;
                    STATE.hoveredCell = null;
                    updateCellMaterial(oldHovered);
                }
                document.body.style.cursor = 'default';
            }
        }
    });

    function handlePointerRemove(e) {
        pointerCache = pointerCache.filter(p => p.id !== e.pointerId);
        activePointers = pointerCache.length;
        if (activePointers < 2) prevPinchDist = -1;
        if (activePointers === 0) isMultiTouch = false;
    }

    renderer.domElement.addEventListener('pointerup', (e) => {
        handlePointerRemove(e);
        mouseDown = false;    // 💡 마우스 놓음 상태
        isDragging = false;

        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        if (STATE.status !== 'playing' && STATE.status !== 'review') {
            if (activePointers === 0) isMultiTouch = false;
            return;
        }

        // 멀티터치(줌/회전) 종료 시 터치 동작 무시
        if (isMultiTouch) {
            if (activePointers === 0) isMultiTouch = false;
            return;
        }

        // 꾹 누르고 있었다면 터치 무시 및 표시 해제 (단, 강조 모드일 때는 유지)
        if (isLongPressing) {
            if (STATE.currentMode !== 'highlight' && STATE.currentMode !== 'chord') {
                clearHighlight();
            }
            isLongPressing = false;
            return;
        }

        // 클릭으로 간주하기 위한 이동 거리 임계값 체크
        const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
        if (dist > CONFIG.dragThreshold) return;

        const isRightClick = e.button === 2;
        handleInteraction(e.clientX, e.clientY, isRightClick);

        if (activePointers === 0) isMultiTouch = false;
    });

    renderer.domElement.addEventListener('pointercancel', (e) => {
        handlePointerRemove(e);
        if (activePointers === 0) isMultiTouch = false;

        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        isLongPressing = false;
        clearHighlight();
    });

    // 💡 마우스 휠을 이용한 확대/축소 (Zoom)
    window.addEventListener('wheel', (e) => {
        const offset = camera.position.clone().sub(CAM_STATE.target);
        const currentDist = offset.length();

        // 휠 방향에 따라 거리 조절 (부드러운 비율 기반)
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        let newDist = THREE.MathUtils.clamp(currentDist * zoomFactor, CAM_STATE.minDistance, CAM_STATE.maxDistance);

        offset.normalize().multiplyScalar(newDist);
        camera.position.copy(CAM_STATE.target).add(offset);
        camera.lookAt(CAM_STATE.target);
    }, { passive: true });

    // 화면 크기 변경 시 대응
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    /**
     * 프레임별 실시간 애니메이션 및 렌더링 루프
     */
    function animate() {
        requestAnimationFrame(animate);

        // 💡 카메라 타겟(시점 중심)을 격자 범위 내로 부드럽게 제한
        const margin = CONFIG.gridSize * 1.5;
        const maxBound = (CONFIG.gridSize - 1) * CONFIG.spacing + margin;
        const minBound = -margin;

        CAM_STATE.target.x = THREE.MathUtils.clamp(CAM_STATE.target.x, minBound, maxBound);
        CAM_STATE.target.y = THREE.MathUtils.clamp(CAM_STATE.target.y, minBound, maxBound);
        CAM_STATE.target.z = THREE.MathUtils.clamp(CAM_STATE.target.z, minBound, maxBound);

        renderer.render(scene, camera); // Three.js 렌더링 실행
    }

    showStartMenu(); // 시작 메뉴 표시
    animate(); // 애니메이션 루프 시작

    // ==========================================
    // 💡 모바일 브라우저 전용 터치 및 스와이프 차단 로직
    // ==========================================
    document.addEventListener('touchmove', function (e) {
        const startMenu = document.getElementById('start-menu-overlay');
        const gameHelp = document.getElementById('game-help-overlay');
        const modalEl = document.getElementById('game-modal');

        const isStartMenuOpen = startMenu && (startMenu.style.display !== 'none' && window.getComputedStyle(startMenu).display !== 'none');
        const isHelpOpen = gameHelp && !gameHelp.classList.contains('hidden');
        const isModalOpen = modalEl && !modalEl.classList.contains('hidden');

        // 시작 메뉴, 도움말, 모달 등이 열려 있는 경우 모달 내부 스크롤 허용
        if (isStartMenuOpen || isHelpOpen || isModalOpen) {
            return;
        }

        // 게임을 플레이 중이거나 캔버스를 터치/드래그하는 상태에서는
        // 스와이프(뒤로가기, 앞으로가기) 및 상하 드래그(당겨서 새로고침, 인앱 브라우저 닫기)를 차단.
        if (e.cancelable) {
            e.preventDefault();
        }
    }, { passive: false }); // passive: false를 주어야 preventDefault 적용이 가능합니다.
});
