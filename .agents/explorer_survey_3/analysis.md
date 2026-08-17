# R3 웹 게임 인터랙션, 터치 컨트롤 및 캔버스 렌더링 전수 조사 분석 보고서

**작성일시**: 2026-08-17  
**조사관**: teamwork_preview_explorer (explorer_survey_3)  
**대상 프로젝트**: 승민's 실험실 (Lab)  
**중점 영역**: R3 (웹 게임 모바일 터치 인터랙션, 가상 컨트롤러, 캔버스 DPR 렌더링 및 화면 왜곡 방지, 런타임 에러 전수 진단)

---

## 1. 전체 웹 게임 인벤토리 현황

프로젝트 내 존재하는 총 10개 웹 게임의 기술 스택, 렌더링 엔진, 입력 제어 및 주요 상태를 정리한 내역입니다.

| 번호 | 게임 디렉토리 | 게임명 | 렌더링 엔진 | 현재 입력 제어 방식 | 모바일 터치 지원 수준 | DPR 스케일링 적용 |
|---|---|---|---|---|---|---|
| 1 | `game/slime_jump` | 쫀득쫀득 슬라임 점프 | HTML5 2D Canvas | Pointer / Touch / Mouse (중복) | 슬링샷 드래그 (중복 리스너 버그) | ❌ 미적용 (1x 고정, 레티나 흐림) |
| 2 | `game/Magnetic_Orbit` | 궤도 생존 (Magnetic Orbit) | HTML5 2D Canvas | Screen Hold / Release (Touch/Mouse) | 터치 홀드/릴리즈 지원 (리사이즈 시 궤도 왜곡) | ⚠️ 부분 적용 (`ctx.scale` 누적 위험) |
| 3 | `game/3D_ minesweeper` | 3D 지뢰찾기 | Three.js (WebGL) | Pointer + Custom Quaternion + 탭/롱프레스 | 하단 모드 버튼 + 핀치 줌 (스크롤 방어 오작동) | ⚠️ 초기만 적용 (Resize 시 미갱신) |
| 4 | `game/maze_escape` | 3D 미로 탈출 | Three.js (WebGL) | PointerLock (PC) / 가상 조이스틱 (모바일) | 가상 조이스틱 + 룩 존 + 액션 버튼 | ❌ 미적용 (`setPixelRatio` 누락) |
| 5 | `game/shadow_puzzle` | 그림자 퍼즐 | Three.js (WebGL) | Pointer Drag 3D 회전 | 3D 터치 회전 (화면비 변경 시 중심축 왜곡) | ⚠️ 초기만 적용 (Resize 시 미갱신) |
| 6 | `game/toto` | 삼척 날씨 토토 & 기상 사다리 | DOM + 2D Canvas | DOM 버튼 탭 / Canvas 렌더링 | 모바일 슬립 바텀시트 / 사다리 캔버스 | ⚠️ 사다리 캔버스 0x0 예외 미방어 |
| 7 | `game/choi_circle` | 최원형 (Ultimate Circle) | DOM / MathJax | Mousemove + Click | ❌ 마우스무브 전용 (모바일 팝업 overflow) | N/A (DOM) |
| 8 | `game/hacking` | 해커 CTF (Linux Terminal) | DOM / Terminal | Keyboard Input | ⚠️ 가상 키보드 가림 / 모바일 퀵 커맨드 부재 | N/A (DOM) |
| 9 | `game/robot` | 로봇 인증 (10단계) | DOM / HTML5 | Hover / Click / Touch / Drag | ⚠️ 반자성 터치 좌표 오차 / `../../` 404 링크 | N/A (DOM) |
| 10 | `game/sign_up_for_hell` | 지옥의 회원가입 | DOM / SVG | Drag / Click / Touch | 터치 제스처 지원 (홈 버튼 부재) | N/A (DOM) |

---

## 2. 게임별 정밀 기술 분석 및 문제점 진단

---

### 2.1. 슬라임 점프 (`game/slime_jump`)

#### (1) 현재 입력 방식 및 터치 제어 평가
- **이벤트 리스너 중복 및 함수 재정의 충돌**:
  - `game.js` 739번 라인에서 `function handleMove(e)`가 정의되어 있고, 773~776번 라인에서 `pointerdown`, `pointermove`, `pointerup`을 등록함.
  - 그러나 1003번 라인에서 **동일한 이름의 `function handleMove(e)`가 또 다시 선언**되어 JS 호이스팅에 의해 앞선 739번 함수가 완전히 덮어씌워짐.
  - 1037~1043번 라인에서 `mousedown`/`mousemove`/`mouseup`과 `touchstart`/`touchmove`/`touchend`가 추가로 중복 등록됨.
  - **증상**: 모바일 디바이스에서 터치 시 Pointer 이벤트와 Touch 이벤트가 동시에 발생하여 드래그 궤적 계산이 이중으로 처리되거나 화면 떨림(Jitter) 발생.

#### (2) Canvas DPR 및 리사이즈 왜곡 진단
- **DPR 스케일링 누락**:
  - `resizeCanvas()` (lines 26~55):
    ```javascript
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw;
    canvas.height = ch;
    ```
  - `window.devicePixelRatio`를 전혀 고려하지 않아 Retina 및 최신 스마트폰(DPR 2~3)에서 캔버스 내부 네온 글로우, 텍스트, 슬라임 외곽선이 흐릿하게 렌더링됨.
  - 화면 리사이즈 시 `GAME_SCALE`을 계산하지만, `canvas.style.width`와 실제 픽셀 버퍼 크기가 1:1로 고정되어 있어 고해상도 모바일에서 해상도 손실 발생.

#### (3) 런타임 에러 가능성 및 누락 사항
- 홈(쇼케이스 포털)으로 돌아갈 수 있는 **상단 네비게이션 버튼이 전무**함.
- `highScore`가 `localStorage.getItem('slimeWallJumpHigh')`로 로드될 때 NaN 처리 방어 미흡.

#### (4) 수정 제안 (Code Proposal)
```javascript
// game/slime_jump/game.js: resizeCanvas 수정
function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // DPR 스케일링 매핑
    
    GAME_SCALE = Math.min(cw, ch) / 800;
    GAME_SCALE = Math.max(0.4, Math.min(GAME_SCALE, 1.2));
    GRAVITY = 0.4 * GAME_SCALE;
    SLIDE_SPEED = 1.8 * GAME_SCALE;
    MAX_SPEED = 20 * GAME_SCALE;
    WALL_EDGE_WIDTH = 15 * GAME_SCALE;
    MAX_DRAG_DIST = Math.max(100, Math.min(220, Math.min(cw, ch) * 0.45));
    if (slime) slime.radius = 14 * GAME_SCALE;
}

// 이벤트 리스너 단일화: PointerEvents로 통합하고 touch/mouse 중복 등록 제거
canvas.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove, { passive: false });
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);
```

---

### 2.2. 3D 지뢰찾기 (`game/3D_ minesweeper`)

#### (1) 현재 입력 방식 및 터치 제어 평가
- **터치 스크롤 방지 로직의 조건문 버그**:
  - `script.js` line 1257~1266:
    ```javascript
    document.addEventListener('touchmove', function (e) {
        const startMenu = document.getElementById('start-menu-overlay');
        const isMenuVisible = startMenu && !startMenu.classList.contains('hidden');
        if (!isMenuVisible) { e.preventDefault(); }
    }, { passive: false });
    ```
  - `startMenuOverlay`는 `style.display = 'none'` / `'flex'`로 토글되며 `.hidden` 클래스를 사용하지 않음. 따라서 `startMenu.classList.contains('hidden')`은 항상 `false`가 되어 `!isMenuVisible`이 영원히 `false`로 평가됨. 결과적으로 게임 플레이 중 터치 드래그 시 모바일 브라우저의 기본 제스처(당겨서 새로고침, 뒤로가기)가 차단되지 않음.
- **모바일 조작 모드 및 오인식**:
  - `dragThreshold` (8px)가 모바일 터치 환경에서는 너무 좁아, 카메라 회전을 시도하다가 블록을 터치(Dig)하여 즉시 폭사하는 사례 발생.
  - 하단 HUD에 5개 모드(이동, 파기, 깃발, 탐색, 연쇄)가 제공되고 있으나, 모바일에서는 기본 모드를 '이동(Pan)' 또는 블록 선택 확인창으로 두거나 드래그 허용 오차를 `12px` 이상으로 상향 필요.

#### (2) Canvas DPR 및 렌더링 진단
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));`가 초기화 시 1회만 호출되고, `window.resize` 시에는 호출되지 않음.
- `index.html`에 `OrbitControls.js`가 CDN으로 로드되고 있으나 실제 코드는 커스텀 Quaternion 기반 회전(`applyCameraRotation`)을 사용하여 불필요한 네트워크 리소스 낭비.

#### (3) 런타임 에러 및 누락 사항
- 홈(쇼케이스 포털)으로 돌아갈 수 있는 **상단 홈 버튼 부재**.
- 폴더명에 공백(`3D_ minesweeper`)이 포함되어 있어 웹 서버 및 URL 라우팅 환경에 따라 인코딩(`3D_%20minesweeper`) 오류가 발생할 위험성 상존.

#### (4) 수정 제안 (Code Proposal)
```javascript
// game/3D_ minesweeper/script.js: 스크롤 방지 조건식 교정
document.addEventListener('touchmove', function (e) {
    const startMenu = document.getElementById('start-menu-overlay');
    const isMenuVisible = startMenu && (startMenu.style.display !== 'none' && !startMenu.classList.contains('hidden'));
    const isHelpVisible = gameHelpOverlay && !gameHelpOverlay.classList.contains('hidden');
    if (!isMenuVisible && !isHelpVisible) {
        e.preventDefault();
    }
}, { passive: false });

// resize 시 DPR 갱신
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

### 2.3. 궤도 생존 (`game/Magnetic_Orbit`)

#### (1) 현재 입력 방식 및 터치 제어 평가
- 전 화면 터치 홀드(중력 가속) / 릴리즈(원심력 팽창) 방식으로 모바일 터치 친화적임.
- 그러나 `handleInteractionStart(e)`에서 `e.target.closest('#menuScreen')` 확인 시, 게임오버/메뉴 상태에서 `#menuScreen`이 열릴 때 지연(`setTimeout 1000ms`) 동안 터치가 씹히거나 게임 시작 버튼 터치가 중복 발생할 수 있음.

#### (2) Canvas DPR 및 리사이즈 물리 왜곡 진단
- **화면 리사이즈 시 플레이어 궤도 붕괴 버그**:
  - `game.js` lines 56~60:
    ```javascript
    if (GAME_STATE !== 'PLAYING') {
        player.radius = (minRadius + maxRadius) / 2;
    }
    ```
  - 게임 플레이(`GAME_STATE === 'PLAYING'`) 도중에 모바일 화면을 가로/세로로 회전하거나 브라우저 주소창 토글로 뷰포트 크기가 바뀌면, `baseSize`, `minRadius`, `maxRadius`는 즉시 변경되지만 `player.radius`는 이전의 절대 픽셀 값 그대로 유지됨.
  - **증상**: 가로 모드(예: 800px)에서 세로 모드(예: 390px)로 회전 시, 기존 `player.radius`가 새로 바뀐 `maxRadius`를 한참 초과하여 플레이어가 화면 밖으로 즉사 판정되거나 궤도 밖으로 순간이동함.

#### (3) 수정 제안 (Code Proposal)
```javascript
// game/Magnetic_Orbit/game.js: 리사이즈 시 비율 보존 로직 적용
function resizeCanvas() {
    const oldMin = minRadius || 1;
    const oldMax = maxRadius || 2;
    const currentRatio = (player.radius - oldMin) / (oldMax - oldMin);

    dpr = window.devicePixelRatio || 1;
    logicalWidth = window.innerWidth;
    logicalHeight = window.innerHeight;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = logicalWidth / 2;
    cy = logicalHeight / 2;
    baseSize = Math.min(logicalWidth, logicalHeight);
    minRadius = baseSize * 0.05;
    maxRadius = baseSize * 0.25;

    if (GAME_STATE !== 'PLAYING') {
        player.radius = (minRadius + maxRadius) / 2;
    } else {
        // 기존 궤도 비율을 신규 반지름 범위에 매핑하여 순간이동 방지
        const clampedRatio = Math.max(0, Math.min(1, isNaN(currentRatio) ? 0.5 : currentRatio));
        player.radius = minRadius + clampedRatio * (maxRadius - minRadius);
    }
    player.size = baseSize * 0.012 + 3;
}
```

---

### 2.4. 3D 미로 탈출 (`game/maze_escape`)

#### (1) 현재 입력 방식 및 모바일 가상 컨트롤러 진단
- **모바일 환경 감지 한계**:
  - `game.js` lines 1~5:
    ```javascript
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) { isMobile = true; }
    ```
  - 데스크톱 브라우저의 반응형 모드(F12 DevTools 모바일 뷰)나 터치 지원 윈도우/크롬북 환경에서 `isMobile`이 `false`가 되어 PointerLock만 기다리고 가상 조이스틱이 나타나지 않음.
- **터치 인터랙션 구성**:
  - 좌측: 가상 조이스틱 (`#joystick-zone`, `#joystick-base`, `#joystick-thumb`)
  - 우측: 시야 회전 (`#look-zone`)
  - 우측 하단: 마커 액션 버튼 (`#action-btn`)
  - 터치 영역 구분이 잘 되어 있으나, 화면 리사이즈나 회전 시 터치 좌표 캐시 초기화가 누락되어 조이스틱 중심점이 어긋나는 현상 발생.

#### (2) Canvas DPR 및 렌더링 진단
- **DPR 미설정으로 인한 1x 블러 현상**:
  - `renderer = new THREE.WebGLRenderer({ antialias: true });`
  - `renderer.setSize(window.innerWidth, window.innerHeight);`
  - `renderer.setPixelRatio` 호출이 완전히 누락됨. 고해상도 모바일 화면에서 사이버펑크 격자 텍스처와 마커가 뿌옇게 렌더링됨.

#### (3) 수정 제안 (Code Proposal)
```javascript
// game/maze_escape/game.js: DPR 및 뷰포트 반응형 처리
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
}
```

---

### 2.5. 그림자 퍼즐 (`game/shadow_puzzle`)

#### (1) 현재 입력 및 모바일 터치 진단
- Pointer Events(`pointerdown`, `pointermove`, `pointerup`) 기반으로 모바일 터치 드래그를 자연스럽게 수용함.
- 다만, `touch-action: none`이 `body`에만 적용되어 있어 일부 브라우저에서 캔버스 터치 시 주소창 숨김/표시 제스처와 충돌할 가능성 존재.

#### (2) Canvas DPR 및 카메라 뷰포트 왜곡 진단
- `adjustLayoutForScreen()` (lines 220~232):
  - `isMobile = window.innerWidth < 768` 단일 분기문으로만 카메라 거리와 `puzzleGroup.position.x`를 변경.
  - 최신 롱 스크린 스마트폰(예: 20:9 비율, 390x844)에서 세로 높이가 길어질 때 그림자 투영 판(`wallGeometry`, z=-15)의 위아래 영역이 왜곡되거나 그림자 모서리가 프레임 밖으로 벗어나는 문제 발생.
- `window.addEventListener('resize', ...)` 시 `renderer.setPixelRatio` 미갱신.

#### (3) 수정 제안 (Code Proposal)
```javascript
// game/shadow_puzzle/script.js: 화면 종횡비에 맞춘 동적 FOV/카메라 거리 계산
function adjustLayoutForScreen() {
    const aspect = window.innerWidth / window.innerHeight;
    const isMobile = aspect < 1.0 || window.innerWidth < 768;

    puzzleGroup.position.x = isMobile ? -3.5 : -2.0;
    if (isMobile) {
        camera.fov = Math.max(45, 45 / aspect);
        camera.position.set(22, 16, 30);
    } else {
        camera.fov = 45;
        camera.position.set(18, 14, 25);
    }
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
}
```

---

### 2.6. 기상 토토 & 사다리 (`game/toto`)

#### (1) 현재 입력 및 모바일 UI 진단
- 모바일 바텀시트(`mobile-slip-sheet`), 플로팅 슬립 바(`mobile-slip-bar`)가 완비되어 있어 모바일 터치 UX가 매우 우수함.
- 단, 메인 포털 `index.html`에 이 게임의 **카드 링크가 누락**되어 있어 포털에서 직접 진입할 수 없는 치명적인 라우팅 누락 확인됨.

#### (2) Canvas DPR 및 렌더링 진단
- 사다리 미니게임 캔버스(`ladderGame`):
  - `this.canvas.width = rect.width * window.devicePixelRatio;`
  - `this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);`
  - DPR 처리가 정석적으로 작성되어 있으나, 탭이 숨겨진 상태에서 `init()` 또는 `resizeCanvas()`가 호출될 경우 `rect.width`가 0이 되어 `canvas.width = 0` 에러를 발생시킬 수 있으므로 기본 너비 폴백(`rect.width || 360`) 필요.

---

### 2.7. 최원형 (`game/choi_circle`)

#### (1) 문제점 및 모바일 터치 진단
- `document.addEventListener('mousemove', ...)`로만 도망가는 버튼(`runawayBtn`)을 처리하여, 모바일 환경에서는 사용자가 손가락을 대기 전까지 마우스무브가 발생하지 않아 도망가지 않고 바로 터치됨.
- `#truth-alert` 팝업 레이어의 고정 폭 `width: 500px;` (line 242) 설정으로 인해 320px~480px 모바일 기기에서 좌우 스크롤바가 생기고 화면 레이아웃이 깨짐.
- 홈 버튼 누락.

#### (2) 수정 제안
- CSS `#truth-alert`에 `width: min(90vw, 500px); max-width: 90vw; box-sizing: border-box;` 적용.
- 모바일 터치 시 `touchstart` 이벤트로 도망가는 로직 연동.

---

### 2.8. 해커 CTF (`game/hacking`)

#### (1) 문제점 및 모바일 터치 진단
- 순수 텍스트 터미널 구조로, 모바일 기기에서 키보드가 화면의 절반 이상을 덮을 때 명령어 입력창(`input#cmd`)이 가려져 타이핑 피드백 확인 불가.
- 모바일 가상 단축 버튼 바(Quick Command Bar: `help`, `hint`, `ls -la`, `cat`, `cd`, `reboot` 등)가 제공되지 않아 터치스크린에서 긴 명령어를 타이핑하기 극도로 난해함.
- 홈 버튼 누락.

#### (2) 수정 제안
- 모바일 감지 시 터미널 하단에 원터치 명령어 버튼 칩(`ls`, `cat`, `help`, `hint`, `Tab`)을 추가하여 모바일 터치 친화적 CTF 플레이 지원.

---

### 2.9. 로봇 인증 (`game/robot`)

#### (1) 문제점 및 모바일 터치 진단
- **치명적 404 라우팅 버그**:
  - `robot/index.html` line 294:
    `<button onclick="location.href='../../index.html'" class="...">홈페이지</button>`
  - 현재 파일 위치가 `game/robot/index.html`이므로 `../../index.html`은 프로젝트 루트(`lab/`)를 벗어난 상위 디렉토리를 가리켜 404 Not Found 발생.
  - 올바른 상대 경로는 `../../index.html`이 아니라 `../index.html` 또는 `/index.html`이어야 함.
- 8단계 반자성(anti-magnet) 박스 터치 시 `rect` 좌표 계산에 스크롤 오프셋 방어 필요.
- 1~10단계 진행 중 상단 홈 버튼 부재.

---

### 2.10. 지옥의 회원가입 (`game/sign_up_for_hell`)

#### (1) 문제점 및 모바일 터치 진단
- 룰렛(생년월일), 슬라이더(전화번호), 도망가는 버튼, 바퀴벌레 터치 등 모바일 `touchstart`/`touchmove` 이벤트가 구현되어 있음.
- 다만 홈으로 돌아가는 네비게이션 버튼이 전무함.

---

## 3. 공통 개선 과제 (Cross-Cutting Requirements)

### 3.1. 전 게임 공통 홈(Home) 네비게이션 표준화
- **현황**: 10개 게임 중 다수에서 포털(`index.html`)로 돌아갈 수 있는 상단 바 또는 뒤로가기 버튼이 누락되어 있거나, `robot`처럼 잘못된 경로(`../../index.html`)가 지정되어 있음.
- **개선안**: 모든 게임 상단 좌측/우측에 일관된 반투명 글래스모피즘 스타일의 **"🏠 홈으로"** 플로팅 버튼을 통일적으로 배치하고, Safe Area Top(`env(safe-area-inset-top)`)을 준수하도록 구현.

### 3.2. Canvas DPR 스케일링 표준 패턴
2D Canvas 및 Three.js WebGL 게임에 적용해야 하는 표준 리사이즈 템플릿:
```javascript
// 2D Canvas 표준 패턴
function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Three.js WebGL 표준 패턴
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
}
```

### 3.3. 모바일 터치 제어 및 터치 액션 격리
- 게임 캔버스 및 조작 컨테이너에 `touch-action: none;` 및 `-webkit-user-select: none; user-select: none;`을 명시하여 스크롤 충돌 및 텍스트 블록 드래그 방지.
- 멀티터치(핀치 줌, 2-Finger Pan)와 단일 터치를 명확히 분기하여 제어 지터 해소.

---

## 4. 결론 및 권고 수정 우선순위

1. **우선순위 1 (치명적 버그 & 라우팅)**:
   - `index.html`에 `game/toto` 카드 링크 추가 및 `game/robot`의 `../../index.html` 404 경로 수정.
   - `game/slime_jump`의 `handleMove` 중복 정의 및 중복 이벤트 리스너 통합.
   - `game/3D_ minesweeper`의 `isMenuVisible` 판단 로직 교정.
2. **우선순위 2 (Canvas DPR & 모바일 화면 회전 왜곡)**:
   - `slime_jump`, `Magnetic_Orbit`, `maze_escape`, `3D_ minesweeper`, `shadow_puzzle`에 DPR 2x 스케일링 및 리사이즈 궤도/카메라 보존 로직 적용.
3. **우선순위 3 (모바일 터치 편의성 & 네비게이션)**:
   - 모든 10개 게임에 통일된 '홈으로 가기' 플로팅 버튼 적용.
   - `game/choi_circle` 팝업 500px 오버플로우 수정 및 `game/hacking` 모바일 퀵 커맨드 바 추가.
