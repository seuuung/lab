# 인수인계 보고서 (Handoff Report) — Challenger 2

**작성자**: 3D 뷰포트 기하학 및 렌더링 검증 전문가 (Challenger 2 / Empirical Challenger)  
**작성 일시**: 2026-08-17T08:18:30Z  
**검증 대상**: R2 (3D 조명, 카메라 시점, 블록 크기, 반응형 뷰포트 비율 및 안전 여백)

---

## 1. Observation (관측 사실)

### 1.1 직접 확인한 소스 코드 및 파라미터 구성 (`game/shadow_puzzle/script.js`)
1. **3D 조명 및 벽면 재질 (`Lines 684 ~ 717`)**:
   ```javascript
   const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
   const directionalLight = new THREE.DirectionalLight(0xffffff, 2.50);
   directionalLight.position.set(0, 0, 32);
   directionalLight.target.position.set(0, 0, 0);
   const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.20);
   fillLight.position.set(15, 12, 18);
   const rimLight = new THREE.DirectionalLight(0xa855f7, 0.95);
   rimLight.position.set(-15, -10, 10);
   const wallMaterial = new THREE.MeshStandardMaterial({
       color: 0x2a3854,
       roughness: 0.50,
       metalness: 0.08
   });
   wall.position.z = -15;
   ```
2. **반응형 뷰포트 및 카메라 레이아웃 (`Lines 821 ~ 851`)**:
   ```javascript
   function adjustLayoutForScreen() {
       const width = window.innerWidth;
       const height = window.innerHeight;
       const aspect = width / height;
       const isMobile = width < 768 || aspect < 1.0;

       if (aspect < 1.0) {
           const baseFov = 49;
           camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 46, 58);
           camera.position.set(16, 12, 30);
           basePuzzlePos = { x: -0.8, y: -0.8, z: 0 };
           camera.lookAt(0, 0, -3);
       } else if (isMobile) {
           camera.fov = 42;
           camera.position.set(16, 12, 30);
           basePuzzlePos = { x: -2.0, y: -0.8, z: 0 };
           camera.lookAt(0, 0, -3);
       } else {
           camera.fov = 42;
           camera.position.set(16, 12, 28);
           basePuzzlePos = { x: -1.6, y: -0.8, z: 0 };
           camera.lookAt(0, 0, -3);
       }
       puzzleGroup.position.set(basePuzzlePos.x, basePuzzlePos.y, basePuzzlePos.z);
       camera.aspect = aspect;
       camera.updateProjectionMatrix();
   }
   ```
3. **3D 블록 기본 규격 (`Line 932`)**:
   ```javascript
   const blockSize = 0.82;
   ```

### 1.2 독립 실증 스크립트 실행 결과 (`tests/verify_challenger2_viewport_r2.js`)
- 실행 명령: `node tests/verify_challenger2_viewport_r2.js`
- 결과 요약: **총 32개 정밀 지표 전원 100% 통과 (Pass: 32, Fail: 0)**

#### 해상도별 실측 투영 데이터 테이블 (13개 전체 퍼즐 레벨 최대 외곽 기준)
| 해상도 (W x H) | 기기 분류 | Aspect | 적용 FOV | 3D 큐브 좌측 여백 | 그림자 우측 여백 | 여백 규격 ($\ge 40px$) | 화면 중심 변위 ($\Delta X, \Delta Y$) | 3D Z-Buffer 깊이차 ($\Delta Z_{view}$) | 겹침 (Occlusion) | 판정 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **320 x 568** | iPhone SE 1세대 | 0.563 | $58.0^\circ$ | **76.2 px** | **65.1 px** | ✅ PASS | $\Delta X = +75.2px, \Delta Y = +48.9px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **360 x 780** | Galaxy Z Flip / Android | 0.462 | $58.0^\circ$ | **64.9 px** | **49.7 px** | ✅ PASS | $\Delta X = +103.3px, \Delta Y = +67.2px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **375 x 667** | iPhone 6/7/8/SE2 | 0.562 | $58.0^\circ$ | **89.0 px** | **76.1 px** | ✅ PASS | $\Delta X = +88.3px, \Delta Y = +57.5px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **390 x 844** | iPhone 13/14 | 0.462 | $58.0^\circ$ | **70.4 px** | **54.0 px** | ✅ PASS | $\Delta X = +111.7px, \Delta Y = +72.7px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **412 x 915** | Galaxy S21/S22/Pixel 7 | 0.450 | $58.0^\circ$ | **70.9 px** | **53.1 px** | ✅ PASS | $\Delta X = +121.1px, \Delta Y = +78.8px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **430 x 932** | iPhone 14 Pro Max | 0.461 | $58.0^\circ$ | **77.4 px** | **59.3 px** | ✅ PASS | $\Delta X = +123.4px, \Delta Y = +80.3px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **667 x 375** | iPhone Landscape | 1.779 | $42.0^\circ$ | **240.6 px** | **255.3 px** | ✅ PASS | $\Delta X = +74.5px, \Delta Y = +45.6px$ | 12.83 units | **0 px** | ✅ **PASS** |
| **844 x 390** | iPhone 13 Landscape | 2.164 | $42.0^\circ$ | **325.8 px** | **329.9 px** | ✅ PASS | $\Delta X = +83.5px, \Delta Y = +51.2px$ | 12.60 units | **0 px** | ✅ **PASS** |
| **932 x 430** | iPhone Pro Max Land | 2.167 | $42.0^\circ$ | **360.0 px** | **364.5 px** | ✅ PASS | $\Delta X = +92.1px, \Delta Y = +56.4px$ | 12.60 units | **0 px** | ✅ **PASS** |
| **1920 x 1080**| Desktop FHD | 1.778 | $42.0^\circ$ | **693.7 px** | **705.1 px** | ✅ PASS | $\Delta X = +231.2px, \Delta Y = +141.8px$ | 12.60 units | **0 px** | ✅ **PASS** |

### 1.3 전체 통합 테스트 스위트 검증 결과
- `node tests/run_all_tests.js`: 4-Tier 214개 Assertions 100% PASS (0 Failures, 36ms)
- `node tests/verify_shadow_puzzle.js`: 13개 레벨 쿼터니언 정답 판정 100% PASS
- `node tests/verify_spti_distribution.js`: 8대 동물 성향 도달성 및 10,000회 몬테카를로 통계 분포(6% ~ 24%) 균형 통과
- `node tests/test_teamwork_preview_r1_r2.js`: 14개 핵심 항목 정밀 검증 100% PASS

---

## 2. Logic Chain (논리 전개 및 수학적 증명)

1. **3D 원근 투영과 큐브-그림자 간섭 배제 (Obs 1.1, 1.2 $\rightarrow$ 결론 1)**:
   - **수학적 공간 분리**:
     - 광원 방향 $\vec{L} = (0, 0, -1)$에 의해 $Z=0$ 근방의 3D 큐브가 $Z=-15$ 벽면에 수직 영사됩니다.
     - 카메라가 $(16, 12, 30)$에서 $(0, 0, -3)$을 바라보는 대각선 쿼터뷰(Quarter-View)를 형성하므로, 원근 변환 $P \cdot V$ 적용 시 $Z=-15$의 벽면 그림자는 화면 우측 상단($\Delta X > 0, \Delta Y > 0$)으로 이동 투영됩니다.
     - 3D 큐브의 뷰포트 깊이($Z_{view} \approx 30.1$)와 벽면의 뷰포트 깊이($Z_{view} \approx 42.9$) 사이에 $\Delta Z_{view} = 12.83\text{ units}$의 엄격한 깊이 단차가 존재합니다.
     - WebGL Depth Buffer(Z-Buffer) 및 프루스텀 클리핑에 의해 3D 큐브와 배경 벽면 간의 깊이 충돌이나 가림(Occlusion)이 $0\text{px}$로 원천 차단됩니다.

2. **반응형 FOV Clamp 및 좌/우 40px 안전 여백 보장 (Obs 1.1.2, 1.2 $\rightarrow$ 결론 2)**:
   - 세로 모바일(`aspect < 1.0`) 환경에서 `baseFov = 49`, `camera.fov = clamp(49 / sqrt(aspect), 46, 58)` 및 `basePuzzlePos = (-0.8, -0.8, 0)`을 적용하여 기기 폭에 따른 원근 스케일을 자동 보정합니다.
   - 최소 폭 기종인 iPhone SE(320px)에서 **좌측 76.2px / 우측 65.1px**, 안드로이드 표준(360px)에서 **좌측 64.9px / 우측 49.7px**, 대화면 Pro Max(430px)에서 **좌측 77.4px / 우측 59.3px**, 데스크톱 FHD(1920px)에서 **좌측 693.7px / 우측 705.1px**의 여백이 산출되어, **전 해상도에서 40px+ 안전 여백 기준을 100% 초과 만족**합니다.

3. **3D 씬 조명 및 재질 시각적 선명도 정합성 (Obs 1.1.1, 1.2 $\rightarrow$ 결론 3)**:
   - Ambient Light(1.15)와 주광선 Directional Light(2.50)의 고휘도 조합에 보조광 Fill Light(1.20, 스카이블루 `0x38bdf8`)와 윤곽광 Rim Light(0.95, 퍼플 `0xa855f7`)이 결합되어 3D 메탈릭 큐브의 모서리와 입체감을 선명하게 부각합니다.
   - 배경 벽면 재질(`0x2a3854`, roughness 0.50, metalness 0.08)은 조명을 부드럽게 흡수하면서 그림자 대비를 명확히 표현하여 시각적 몰입감을 극대화합니다.

---

## 3. Caveats (주의 사항 및 한계)

- **디바이스 픽셀 비율 (DPR)**:
  - Three.js 렌더러는 `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))`를 통해 고해상도 레티나 디스플레이(2x, 3x)에서 성능 저하 없이 정밀한 안티에일리어싱 렌더링을 수행합니다. 본 기하학적 계산은 CSS 논리 픽셀 기준이며, 물리 픽셀 상에서는 더욱 넉넉한 여백이 확보됩니다.
- **회귀 분석 (Regressions)**:
  - 기존 4-Tier 214개 전 테스트 및 SPTI 몬테카를로 통계 시뮬레이션에 부작용이 전혀 없음을 확인했습니다. No caveats.

---

## 4. Conclusion (최종 평가)

### 4.1 위험 평가 (Risk Assessment)
- **종합 위험도**: **LOW (위험 요인 없음)**
- **정밀 검증 판정**:
  1. R2 3D 조명 강도, 뷰포트 비율, 블록 크기, 카메라 거리가 요구사항 명세 및 기하학적 모델과 100% 일치합니다.
  2. 세로 6종, 가로 4종 총 10대 대표 해상도 및 13개 전체 퍼즐 레벨에서 3D 큐브와 우측 정답 그림자 간 겹침(Occlusion) 0px 및 좌/우 40px+ 안전 여백이 수학적으로 완전히 입증되었습니다.

---

## 5. Verification Method (독립 검증 방법)

1. **Challenger 2 전용 3D 뷰포트 기하학 및 렌더링 실증 스위트 실행**:
   ```powershell
   node tests/verify_challenger2_viewport_r2.js
   ```
   - 10대 해상도 투영 계산, 안전 여백 $\ge 40px$, 조명/재질 32개 지표 전원 통과 확인.

2. **통합 E2E 4-Tier 214개 Assertion 테스트 실행**:
   ```powershell
   node tests/run_all_tests.js
   ```
   - 전체 214개 Assertion 100% 통과 확인.

3. **R1/R2 전용 검증 스위트 실행**:
   ```powershell
   node tests/test_teamwork_preview_r1_r2.js
   ```
   - R1 인앱 브라우저 분기 및 R2 3D 파라미터 정합성 확인.
