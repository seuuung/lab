# Handoff Report — Explorer 3 (전체 아키텍처 및 빌드/테스트 환경 탐색)

**작성일시**: 2026-08-17  
**작성자**: Explorer 3 (`teamwork_preview_explorer_survey_3`)  
**수신자**: Orchestrator (`8bcd3821-06ad-4dc0-b3f1-1b8d1584dcc5`)  
**미션**: 프로젝트 전체 아키텍처, 빌드/테스트 환경 및 R1/R2 통합 연계점 조사  
**핸드오프 유형**: Hard Handoff (조사 미션 완료)

---

## 1. Observation (직접 관측 사실)

1. **기술 스택 및 프레임워크**:
   - `c:\Users\figig\Desktop\project\lab/` 루트에 `package.json`, `webpack.config.js`, `vite.config.js`, `tsconfig.json` 등의 빌드 설정 파일이 전혀 존재하지 않음 (`find_by_name` 결과: 0 files).
   - 모든 프로젝트는 순수 정적 웹(Pure Static Web: HTML5, Vanilla JavaScript ES6+, CSS3)으로 구현되어 있으며, 외부 라이브러리는 CDN을 통해 로드됨:
     - Tailwind CSS CDN: `<script src="https://cdn.tailwindcss.com"></script>` (`game/shadow_puzzle/index.html` Line 18)
     - Three.js WebGL: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>` (`game/shadow_puzzle/index.html` Line 19)
     - Google Analytics 4: `<script async src="https://www.googletagmanager.com/gtag/js?id=G-T0XQB053HX"></script>` (`game/shadow_puzzle/index.html` Line 6)

2. **디렉토리 구조 및 엔트리 포인트**:
   - 총 10개의 독립 HTML 진입점 확인:
     - 메인 포털: `index.html`
     - 9개 하위 게임: `game/3D_ minesweeper/index.html`, `game/Magnetic_Orbit/index.html`, `game/choi_circle/index.html`, `game/hacking/index.html`, `game/maze_escape/index.html`, `game/robot/index.html`, `game/shadow_puzzle/index.html`, `game/sign_up_for_hell/index.html`, `game/slime_jump/index.html`.

3. **테스트 인프라 및 실행 결과**:
   - `node tests/run_all_tests.js` 실행 시:
     - Tier 1 (Feature): 78 / 78 Passed
     - Tier 2 (Boundary): 84 / 84 Passed
     - Tier 3 (Pairwise): 30 / 30 Passed
     - Tier 4 (Real-World): 22 / 22 Passed
     - **총 214개 Assertion 전원 통과 (0 Failure, 소요 시간 41ms, Exit Code 0)**.
   - `node tests/verify_shadow_puzzle.js` 실행: 13개 레벨 및 대칭/판정 로직 100% 정상 통과.
   - `node tests/verify_spti_distribution.js` 실행: 10,000회 몬테카를로 시뮬레이션 결과 8개 동물 성향이 6%~24%로 균등 분포됨.

4. **R1 및 R2 요구사항의 물리적 위치**:
   - **R1(이미지 저장 UX)** 과 **R2(3D 조명/뷰포트)** 가 모두 **`game/shadow_puzzle/` 단일 디렉토리** 내의 `index.html` 및 `script.js`에 집중되어 있음.
   - **R2 관련 코드 관측 (`game/shadow_puzzle/script.js`)**:
     - 조명: Line 684 (`ambientLight = 0.75`), Line 687 (`directionalLight = 1.95`), Line 704 (`fillLight = 0.85`), Line 708 (`rimLight = 0.70`).
     - 카메라/뷰포트: Line 676 (`PerspectiveCamera(45)`), Line 821~851 (`adjustLayoutForScreen()`, `camera.position.set(16, 12, 32)` / `30` / `28`).
     - 블록 크기: Line 932 (`blockSize = 0.78` -> 요구사항은 0.82 복원).
     - 큐브 위치: Line 832 (`basePuzzlePos = { x: -2.0, y: -0.8, z: 0 }`).
   - **R1 관련 코드 관측 (`game/shadow_puzzle/index.html`, `script.js`)**:
     - 진단서 생성: `script.js` Line 1285~1540 (`generateBackgroundMasterCanvas()`).
     - 다운로드/공유: `script.js` Line 1649~1724 (`downloadShareCard()`, `cachedMasterCanvas.toBlob()`).
     - 모바일 이미지 모달: `index.html` Line 498~518 (`#image-save-modal`, `#save-preview-img`), `script.js` Line 1726~1741 (`openImageSaveModal()`, `closeImageSaveModal()`).

---

## 2. Logic Chain (논리적 추론 체계)

1. **[Observation 1, 2]로부터**: 별도의 빌드 단계(Build Step)나 번들러가 없으므로 파일 수정 즉시 런타임에 반영되며, 빌드 파이프라인 오류에 의한 장애 가능성이 없습니다.
2. **[Observation 3]로부터**: Node.js 기반의 4-Tier Opaque-box 테스트 러너(`tests/run_all_tests.js`)가 이미 완비되어 있어, 코드 수정 전후의 회귀(Regression)를 즉각적이고 엄밀하게 검증할 수 있습니다.
3. **[Observation 4]로부터**: R1과 R2는 서로 다른 디렉토리가 아닌 동일한 `game/shadow_puzzle/` 내에서 실행 라이프사이클(1단계: 3D 게임플레이 -> 2단계: 13레벨 클리어 통계 산출 -> 3단계: SPTI 결과 카드 생성 및 저장)로 순차 연결되어 있습니다.
4. **[Observation 4]로부터**: 따라서 Worker가 `game/shadow_puzzle/script.js`를 동시 수정할 경우 라인 충돌(Merge Conflict)이 발생할 수 있으므로, **R2(3D 조명/카메라/블록: Line 676~960)** 와 **R1(결과 카드/모바일 롱프레스 모달: Line 1599~1742)** 의 파일 내 라인 소유권(Line Ownership)을 엄격히 분리하거나 순차 적용하는 전략이 필수적입니다.

---

## 3. Caveats (주의사항 및 한계점)

1. **라이브 모바일 인앱 브라우저 테스트 환경**: 인스타그램 및 카카오톡 실제 인앱 브라우저 웹뷰 환경의 User-Agent 및 Web Share API 동작은 데스크톱 브라우저 환경에서 완벽히 네이티브로 재현하기 어려우므로, 정적 User-Agent 모킹 및 브라우저 시뮬레이션으로 검증해야 합니다.
2. **CDN 의존성**: Three.js 및 Tailwind CSS가 외부 CDN 링크로 로드되므로 오프라인 환경에서는 CDN 캐시 상태를 확인해야 합니다.

---

## 4. Conclusion (최종 결론 및 제안)

1. **아키텍처**: 순수 정적 웹 (Vanilla JS + CDN Three.js/Tailwind). 별도 빌드 명령어 불필요.
2. **테스트 환경**: `node tests/run_all_tests.js` (기본 214개 어서션 100% 통과).
3. **R1/R2 통합 연계점**: `game/shadow_puzzle/` 단일 프로젝트에서 3D 인터랙션(R2) 완료 후 SPTI 결과 진단서 카드 생성 및 모바일 저장(R1)으로 자연스럽게 이어지는 파이프라인 구조.
4. **Write Ownership 경계 권고**:
   - **Worker R2**: `game/shadow_puzzle/script.js` (Line 676~960: 조명 강도 상향, 카메라 Z=30, blockSize=0.82, 안전 여백 40px+ 확보).
   - **Worker R1**: `game/shadow_puzzle/script.js` (Line 1599~1742: 인앱 브라우저 감지, 가짜 알림 차단, 모바일 롱프레스 모달 직결) 및 `game/shadow_puzzle/index.html` (Line 498~518: 모달 UI).
   - **Test Writer**: `tests/` 내 R1/R2 신규 요구사항 단위/통합 테스트 추가.

---

## 5. Verification Method (독립 검증 방법)

1. **전체 통합 E2E 테스트 실행**:
   ```bash
   node tests/run_all_tests.js
   ```
   - 예상 결과: 4-Tier 214개 Assertions 전수 통과 (`Passed: 214, Failed: 0`).
2. **정적 무결성 및 구문 검사**:
   ```bash
   node tests/challenge_fuzzing_static_analysis.js
   ```
3. **섀도우 퍼즐 및 SPTI 검증 스위트 실행**:
   ```bash
   node tests/verify_shadow_puzzle.js
   node tests/verify_spti_distribution.js
   node tests/verify_zero_distortion.js
   ```
4. **수정 대상 파일 직접 확인**:
   - `game/shadow_puzzle/index.html`
   - `game/shadow_puzzle/script.js`
