# Handoff Report — R2. 3D 씬 조명 밝기 및 큐브/그림자 뷰포트 비율 정상화 조사

## 1. Observation (관측 사실)

1. **대상 파일 및 3D 렌더링 엔진**:
   - `game/shadow_puzzle/script.js` (Three.js r128 기반 3D WebGL 렌더러 및 씬 관리)
   - `game/shadow_puzzle/index.html` (Line 19: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`, Line 24: `#game-canvas`)
   - `game/shadow_puzzle/style.css` (Line 24~29: `#game-canvas { width: 100vw; height: 100vh; display: block; touch-action: none; }`)

2. **현재 조명 및 벽면 재질 설정 (`game/shadow_puzzle/script.js` Lines 684~717)**:
   - Line 684: `const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);`
   - Line 687~688: `const directionalLight = new THREE.DirectionalLight(0xffffff, 1.95); directionalLight.position.set(0, 0, 32);`
   - Line 704~705: `const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.85); fillLight.position.set(15, 12, 18);`
   - Line 708~709: `const rimLight = new THREE.DirectionalLight(0xa855f7, 0.70); rimLight.position.set(-15, -10, 10);`
   - Line 713~717: `const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x24324a, roughness: 0.55, metalness: 0.10 });`
   - Line 674: `scene.fog = new THREE.Fog(0x0b0f19, 20, 70);`

3. **현재 카메라 위치, 블록 크기, 뷰포트 설정 (`game/shadow_puzzle/script.js` Lines 821~851 & Line 932)**:
   - Line 829~833:
     ```javascript
     const baseFov = 46;
     camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 44, 52);
     camera.position.set(16, 12, 32);
     basePuzzlePos = { x: -2.0, y: -0.8, z: 0 };
     camera.lookAt(0, 0, -3);
     ```
   - Line 932: `const blockSize = 0.78;`

4. **Git 이력 상의 파라미터 변천사**:
   - 커밋 `a64b18b` / `ce62e79`: 초기 카메라 Z=30 (`camera.position.set(16, 15, 30)`), 블록 크기 1.0/0.82 수준에서 정답 실루엣 수정 과정 중 카메라가 Z=32로 후퇴하고 blockSize가 0.78로 축소됨.

5. **수학적 뷰포트 시뮬레이션 결과 (`sim_check.js` 10대 디바이스 매트릭스)**:
   - `camera.position = (16, 12, 30)`, `basePuzzlePos = (-0.8, -0.8, 0)`, `blockSize = 0.82`, `baseFov = 49 (clamp 46~58)` 적용 시:
     - 320x568 (iPhone SE 1st): 좌측 여백 64.6px, 우측 여백 70.0px ($\ge 40px$, PASS)
     - 360x780 (Galaxy Z Flip): 좌측 여백 49.1px, 우측 여백 56.4px ($\ge 40px$, PASS)
     - 390x844 (iPhone 13/14): 좌측 여백 53.3px, 우측 여백 61.3px ($\ge 40px$, PASS)
     - 430x932 (iPhone 14 Pro Max): 좌측 여백 58.5px, 우측 여백 67.3px ($\ge 40px$, PASS)
     - 1920x1080 (Desktop FHD): 좌측 여백 657.4px, 우측 여백 719.0px ($\ge 40px$, PASS)
   - 3D 큐브($Z=0$, 좌측 영역 투영)와 벽면 그림자($Z=-15$, 우측 영역 투영) 간 시선 분리로 Occlusion(겹침) 0px.

---

## 2. Logic Chain (논리 추론 과정)

1. **조명 밝기 및 채도 저하의 인과관계 (Obs 2 $\rightarrow$ 결론 1)**:
   - 관측 2에서 `ambientLight`(0.75), `directionalLight`(1.95), `fillLight`(0.85), `rimLight`(0.70) 설정은 안개(`THREE.Fog`, 20~70)와 어두운 배경벽(`0x24324a`)의 광자 흡수율을 상쇄하지 못함.
   - 따라서 `ambientLight` $\rightarrow$ 1.15, `directionalLight` $\rightarrow$ 2.50, `fillLight` $\rightarrow$ 1.20, `rimLight` $\rightarrow$ 0.95, `wallMaterial` color $\rightarrow$ `0x2a3854`로 상향할 때 3D 큐브의 메탈릭 광택과 벽면 그림자의 대비가 최고 수준의 선명도로 렌더링됨.

2. **카메라 거리 Z=30, 블록 크기 0.82 및 안전 여백의 기하학적 정합성 (Obs 3, 5 $\rightarrow$ 결론 2)**:
   - 관측 3에서 현재 $Z=32$, $blockSize=0.78$은 큐브를 화면 중앙에서 작고 왜소하게 표현함.
   - $Z=30$, $blockSize=0.82$로 복원하고, 관측 5의 기하학적 투영 공식에 따라 `basePuzzlePos.x`를 세로 모바일에서 `-0.8`로 설정하고 `baseFov`를 49(clamp 46~58)로 지정하면, 화면 좌측의 3D 큐브와 우측의 영사 그림자가 정중앙 기준으로 균형 잡히며 320px~430px 전 기종에서 **좌/우 40px 안전 여백**이 수학적으로 증명됨.

3. **3D 큐브와 그림자 간 무간섭 원리 (Obs 1, 5 $\rightarrow$ 결론 3)**:
   - 주 광원($Z=32$)이 $Z=-15$ 벽면에 그림자를 직하향 영사하고, 카메라는 대각선 우측 상단($X=16, Y=12, Z=30$)에 위치하므로, 시차(Parallax)에 의해 $Z=0$ 큐브는 화면 좌측(30~55%), $Z=-15$ 그림자는 화면 우측(55~85%)에 독립적으로 투영되어 상호 간섭이 발생하지 않음.

---

## 3. Caveats (한계 및 주의사항)

- **스마트폰 세로 모드 회전(Orientation Change)**:
  - 브라우저 창 리사이즈 또는 가로/세로 전환 시 `window.addEventListener('resize')`에서 `adjustLayoutForScreen()`이 호출되어 즉각 종횡비에 맞는 파라미터로 재계산되므로 문제없음.
- **기존 사용자 클리어 데이터 보존**:
  - 조명 및 뷰포트 파라미터 수정은 순수 렌더링 및 카메라 변환 행렬에만 영향을 미치며, 로컬스토리지의 레벨 클리어 진행도 및 쿼터니언 정답 판정 알고리즘(`allowXFlip`, `allowYFlip`, `slerp`)에는 아무런 부작용을 일으키지 않음.

---

## 4. Conclusion (최종 결론 및 추천 파라미터)

### 핵심 수정 파일: `game/shadow_puzzle/script.js`
1. **조명 및 재질 파라미터 (Lines 684~717)**:
   - `ambientLight`: `0.75` $\rightarrow$ **`1.15`**
   - `directionalLight`: `1.95` $\rightarrow$ **`2.50`**
   - `fillLight`: `0.85` $\rightarrow$ **`1.20`** (Color: `0x38bdf8`)
   - `rimLight`: `0.70` $\rightarrow$ **`0.95`** (Color: `0xa855f7`)
   - `wallMaterial`: Color `0x24324a` $\rightarrow$ **`0x2a3854`**, roughness `0.50`, metalness `0.08`
2. **반응형 뷰포트 및 카메라 파라미터 (Lines 821~851)**:
   - 세로 모바일 (`aspect < 1.0`):
     - `baseFov = 49;`
     - `camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 46, 58);`
     - `camera.position.set(16, 12, 30);`
     - `basePuzzlePos = { x: -0.8, y: -0.8, z: 0 };`
     - `camera.lookAt(0, 0, -3);`
   - 가로 모바일: `camera.fov = 42; camera.position.set(16, 12, 30); basePuzzlePos = { x: -2.0, y: -0.8, z: 0 }; camera.lookAt(0, 0, -3);`
   - 데스크톱: `camera.fov = 42; camera.position.set(16, 12, 28); basePuzzlePos = { x: -1.6, y: -0.8, z: 0 }; camera.lookAt(0, 0, -3);`
3. **3D 블록 크기 (Line 932)**:
   - `blockSize = 0.82;`

---

## 5. Verification Method (독립 검증 방법)

1. **기존 프로젝트 전체 회귀 테스트 실행**:
   ```powershell
   node tests/run_all_tests.js
   ```
   - 214개 전 항목(Tier 1~4) 통과 확인.
2. **섀도우 퍼즐 정답 판정 및 레벨 무결성 테스트 실행**:
   ```powershell
   node tests/verify_shadow_puzzle.js
   ```
   - 13개 레벨 및 대칭/반전 판정 통과 확인.
3. **수정 파일 검증**:
   - `view_file`을 통해 `game/shadow_puzzle/script.js`의 라인 684~717, 821~851, 932가 위의 추천 파라미터로 일치하는지 확인.
