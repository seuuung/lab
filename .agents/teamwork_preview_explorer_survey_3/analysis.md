# 승민's 실험실 전체 아키텍처, 빌드/테스트 환경 및 R1/R2 연계점 심층 분석 보고서

**작성일시**: 2026-08-17  
**작성자**: 전체 아키텍처 및 빌드/테스트 환경 탐색관 (teamwork_preview_explorer_survey_3)  
**대상 프로젝트**: `c:\Users\figig\Desktop\project\lab`  
**문서 상태**: Survey 완료 (Complete)

---

## 1. 프로젝트 개요 및 프레임워크/런타임 아키텍처

### 1.1. 프레임워크 및 기술 스택
- **아키텍처 성격**: 순수 정적 웹 애플리케이션 (Pure Static Web Architecture)
  - 별도의 번들러(Webpack, Vite, Rollup, Parcel 등)나 트랜스파일러(Babel, TypeScript), 서버 사이드 프레임워크(Next.js, Nuxt, Remix 등)가 없는 **Vanilla JavaScript ES6+ & HTML5 & CSS3** 기반 구조입니다.
  - 빌드 단계(Build Step) 없이 정적 웹 서버(Nginx, GitHub Pages, Vercel Static, Apache, VSCode Live Server, `npx serve` 등)에서 즉시 서빙 가능합니다.
- **외부 런타임 의존성 (CDN)**:
  - **CSS**: Tailwind CSS CDN (`<script src="https://cdn.tailwindcss.com"></script>`)
  - **3D WebGL 렌더러**: Three.js r128 (`<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`)
  - **분석/로깅**: Google Analytics 4 (gtag.js: `G-T0XQB053HX`)
  - **웹 폰트**: Google Fonts (Outfit, Noto Sans KR)
- **패키지 매니저**:
  - `package.json`이 프로젝트 루트에 존재하지 않으며, npm/yarn/pnpm 종속성에 의존하지 않는 무설치 독립형 구조입니다.
  - 단, E2E 검증 및 정적 분석을 위해 시스템에 설치된 Node.js(v24.13.0) 내장 모듈(`fs`, `path`, `vm`, `child_process`, `assert`)을 활용하는 자체 경량 테스트 러너 프레임워크가 `tests/`에 완비되어 있습니다.

### 1.2. 디렉토리 구조 및 진입점 (Entry Points)
전체 프로젝트는 **메인 포털 1개 + 9개 서브 웹 게임/인터랙티브 프로젝트**로 구성되며, 총 10개의 독립 HTML 엔트리 포인트를 가집니다.

```
c:\Users\figig\Desktop\project\lab/
├── index.html                   # [진입점 1] 메인 쇼케이스 포털 (About Me, 카테고리 필터, 프로젝트 카드 9개)
├── PROJECT.md                   # 프로젝트 아키텍처 및 인터페이스 규약 정의서
├── TEST_INFRA.md                # 4-Tier E2E 테스트 인프라 명세서
├── TEST_READY.md                # 테스트 준비 및 실행 가이드
├── ORIGINAL_REQUEST.md          # 사용자 원본 요구사항 명세서
├── game/                        # 9개 하위 웹 프로젝트 디렉토리
│   ├── 3D_ minesweeper/         # [진입점 2] 3D 지뢰찾기 (Three.js WebGL)
│   ├── Magnetic_Orbit/          # [진입점 3] 궤도 생존 (2D Canvas)
│   ├── choi_circle/             # [진입점 4] 최원형 밈 (Interactive DOM)
│   ├── hacking/                 # [진입점 5] 해커 CTF 터미널 (Interactive DOM)
│   ├── maze_escape/             # [진입점 6] 3D 미로 탈출 (Three.js WebGL + 가상 조이스틱)
│   ├── robot/                   # [진입점 7] 로봇 인증 캡차 밈 (Interactive DOM)
│   ├── shadow_puzzle/           # [진입점 8] 그림자 퍼즐 & SPTI 유형 검사 (Three.js WebGL + 2D Canvas) ★ [R1 & R2 대상]
│   ├── sign_up_for_hell/        # [진입점 9] 지옥의 회원가입 폼 (Interactive DOM/SVG)
│   └── slime_jump/              # [진입점 10] 슬라임 점프 (2D Canvas Slingshot)
├── tests/                       # 31개 자동화 테스트 스위트 및 시뮬레이션 도구
└── .agents/                     # 오케스트레이터 및 서브에이전트 메타데이터
```

---

## 2. 빌드, 린트/타입체크 및 테스트 환경 조사

### 2.1. 빌드 및 배포
- **빌드 명령어**: 빌드 과정 불필요 (`N/A`)
- **로컬 실행 방법**:
  - Python 로컬 서버: `python -m http.server 8000`
  - Node.js npx serve: `npx serve .`
  - 또는 브라우저에서 `index.html` 또는 `game/shadow_puzzle/index.html`을 직접 열람

### 2.2. 정적 분석, 린트 및 무결성 검증
Node.js 내장 `vm.Script`와 파일 파싱을 활용하여 정적 문법 및 링크 무결성을 검증합니다.
- **정적 문법 및 DOM ID/링크 무결성 검사**:
  ```bash
  node tests/challenge_fuzzing_static_analysis.js
  ```
  - 모든 `.js` 파일 및 HTML 인라인 `<script>`의 ES6+ 문법 유효성 파싱
  - 404 깨진 링크(CSS, JS, Image, Canvas asset) 전수 탐색
  - JS `document.getElementById` 호출 대상과 HTML ID 매핑 및 Null Safety 가드 여부 전수 검증
  - 인라인 이벤트 핸들러(`onclick`, `onchange` 등) 함수 유효성 전수 검사

### 2.3. 테스트 스위트 구조 및 실행 방법
프로젝트에는 다계층(Tiered) 불투명 박스(Opaque-box) 테스트 및 특화 검증 러너가 구축되어 있습니다.

| 테스트 유형 | 실행 명령어 | 주요 검증 내용 | 총 Assertion 수 |
|---|---|---|---|
| **통합 4-Tier E2E 러너** | `node tests/run_all_tests.js` | 기능(T1), 경계값/Safe-Area(T2), 조합(T3), 실제 유저 여정(T4) 전수 검증 | **214건 전수 통과 (0 Fail)** |
| **마스터 챌린저 스위트** | `node tests/run_challenger_all.js` | DPR 리사이즈 스트레스, 내비게이션 루프 무결성, 정적 퍼징/결함 탐색 | 3개 서브 스위트 순차 실행 |
| **섀도우 퍼즐 승리/대칭 검증** | `node tests/verify_shadow_puzzle.js` | 13개 레벨 대칭 쿼터니언 매핑, 800ms 판정 딜레이, 레벨 데이터 무결성 | 단일 스위트 통과 |
| **SPTI 동물 성향 분포 검증** | `node tests/verify_spti_distribution.js` | 8대 동물 성향 도달성(100%) 및 10,000명 몬테카를로 통계 분포(6%~24%) | 10,000회 시뮬레이션 통과 |
| **SPTI 화학/궁합 매트릭스** | `node tests/verify_chemistry.js` | 8개 유형 상호 환상/환장 짝꿍 대칭성 및 링크 정합성 검증 | 전수 통과 |
| **3D 씬 왜곡 방지 검증** | `node tests/verify_zero_distortion.js` | 화면비별 FOV/카메라 거리, 큐브-그림자 간 수직/수평 거리 및 왜곡률 측정 | 전수 통과 |

---

## 3. R1(이미지 저장 UX)과 R2(3D 조명/뷰포트) 통합 연계점 및 상태 공유 분석

### 3.1. R1과 R2의 위치 및 단일 호스트 식별
R1과 R2의 모든 요구사항은 독립된 별개의 페이지에 분산되어 있는 것이 아니라, **`game/shadow_puzzle/` 단일 프로젝트 내에 완전히 통합**되어 있습니다.

```
[game/shadow_puzzle/index.html & script.js]
 ├── Phase 1 (R2 영역): 3D 공간 게임플레이
 │    ├── 3D WebGL Canvas (#game-canvas)
 │    ├── 4대 조명 시스템 (Ambient, Directional, Fill, Rim)
 │    ├── 카메라 구도 (Z=30, FOV, 쿼터뷰) & 블록 크기 (0.82)
 │    └── 좌/우 40px 안전 여백 및 큐브-그림자 간섭 방지
 │
 ├── Phase 2 (연계 전환점): 13레벨 완료 및 통계 산출
 │    ├── progress.stats (총 소요 시간, 총 회전 횟수, 레벨별 기록)
 │    └── determineAnimalType() -> 8대 SPTI 성향 결정
 │
 └── Phase 3 (R1 영역): SPTI 진단서 카드 생성 및 모바일 저장 UX
      ├── 결과지 모달 (#ending-modal) & 플로팅 바 (#result-float-bar)
      ├── 1080x1920 HD 진단서 캔버스 렌더링 (generateBackgroundMasterCanvas)
      ├── 모바일 롱프레스 뷰어 모달 (#image-save-modal, #save-preview-img)
      ├── Web Share API 네이티브 공유 시트 연결
      └── 가짜 <a download> 클릭 및 허위 "다운로드되었습니다" 알림 전면 차단
```

### 3.2. 상태 및 데이터 의존성 흐름
1. **플레이 데이터 축적**: 
   - `game/shadow_puzzle/script.js` 내 전역 변수 `progress.stats` (`totalTime`, `totalRotations`, `levelRecords`)가 R2 3D 플레이 도중 축적됩니다.
2. **SPTI 결과 생성 트리거**:
   - 13번째 레벨 클리어 시 `loadLevel(13)` -> `showEndingModal()` 호출.
   - `determineAnimalType(totalSec, totalRot)`이 실행되어 8대 동물 성향 객체(`myType`) 도출.
3. **HD 진단서 캔버스 렌더링**:
   - `generateBackgroundMasterCanvas(myType, timeFormatted, totalRot, playerName)`가 1080x1920 해상도의 2D Canvas 버퍼(`cachedMasterCanvas`)를 백그라운드 생성.
4. **저장 인터랙션 실행 (R1)**:
   - 사용자가 `#download-card-btn` 터치 시 `downloadShareCard()` 실행.
   - 모바일/인앱 브라우저 여부에 따라 분기 처리:
     - **인앱 브라우저 / 모바일 환경**: 가짜 알림을 일절 띄우지 않고, 즉시 `openImageSaveModal(dataUrl)`을 호출하여 `#save-preview-img`를 담은 풀스크린 뷰어 모달을 띄움.
     - **Web Share API 지원 환경**: `navigator.canShare({ files: [file] })` 검증 후 OS 사진 앱 저장 시트 호출.

### 3.3. 상세 파일 및 라인 번호 매핑

| 요구사항 ID | 관련 기능 | 대상 파일 | 관련 라인 번호 | 주요 컴포넌트 / 함수 |
|---|---|---|---|---|
| **R1** | 인앱 브라우저 감지 및 Safari/크롬 탈출 안내 | `game/shadow_puzzle/index.html`<br>`game/shadow_puzzle/script.js` | HTML: 26~43, 93~130<br>JS: 2005~2045 | `<script>` 인라인, `#inapp-guide-modal`, `checkInAppBrowser()` |
| **R1** | 모바일 이미지 롱프레스 저장 모달 UI | `game/shadow_puzzle/index.html` | HTML: 498~518 | `#image-save-modal`, `#save-preview-img`, `#close-image-modal` |
| **R1** | 플로팅 저장 바 및 다운로드 버튼 | `game/shadow_puzzle/index.html` | HTML: 420~453 | `#result-float-bar`, `#download-card-btn`, `#player-name-input` |
| **R1** | HD 진단서 캔버스 생성기 | `game/shadow_puzzle/script.js` | JS: 1285~1540 | `generateBackgroundMasterCanvas()` |
| **R1** | 이미지 저장/공유 핸들러 & 허위 알림 제거 | `game/shadow_puzzle/script.js` | JS: 1599~1742 | `copyShareCardToClipboard()`, `downloadShareCard()`, `openImageSaveModal()`, `closeImageSaveModal()` |
| **R2** | 3D 씬 조명 (Directional, Ambient, Fill, Rim) | `game/shadow_puzzle/script.js` | JS: 683~711 | `ambientLight`, `directionalLight`, `fillLight`, `rimLight` |
| **R2** | 뷰포트 반응형 및 카메라 거리/FOV/안전 여백 | `game/shadow_puzzle/script.js` | JS: 676, 820~852 | `camera`, `adjustLayoutForScreen()`, `basePuzzlePos` |
| **R2** | 3D 블록 크기 및 그리드 생성 | `game/shadow_puzzle/script.js` | JS: 928~960 | `blockSize = 0.82`, `THREE.BoxGeometry`, `loadLevel()` |
| **R2** | 배경 투영 벽면 및 바닥 재질 | `game/shadow_puzzle/script.js` | JS: 712~730 | `wallMaterial`, `wallGeometry`, `wall`, `floor` |

---

## 4. 파일 레이아웃 및 Worker 구현 시 Write Ownership 경계 제안

R1과 R2의 구현 코드가 `game/shadow_puzzle/` 내의 `script.js` 및 `index.html`에 공존하므로, 다중 워커 병렬 작업 시 Git 충돌 및 덮어쓰기를 방지하기 위해 명확한 **Write Ownership 분할 가이드**를 제안합니다.

### 4.1. Write Ownership 분할 매트릭스

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Worker R1 (모바일 인앱 이미지 저장 UX 담당)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • 소유 파일:                                                                │
│   - game/shadow_puzzle/index.html (Line 420~453, 498~518)                    │
│   - game/shadow_puzzle/script.js (Line 1599~1742, 1978~2045)                 │
│ • 핵심 변경 범위:                                                            │
│   - 인앱 브라우저(Instagram, KakaoTalk 등) 및 모바일 환경 정확한 감지        │
│   - [이미지 저장] 클릭 시 허위 <a download> 및 가짜 성공 알림 원천 차단      │
│   - 모바일 환경에서 즉시 고화질 이미지를 담은 #image-save-modal 호출         │
│   - "이미지를 1초간 길게 눌러 사진에 저장하세요" 안내 가이드 및 닫기 UX 보강  │
│   - Web Share API 지원 환경의 File 공유 안전 래핑                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Worker R2 (3D 조명 밝기 및 큐브/그림자 뷰포트 정상화 담당)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ • 소유 파일:                                                                │
│   - game/shadow_puzzle/script.js (Line 676~735, Line 820~852, Line 928~960) │
│ • 핵심 변경 범위:                                                            │
│   - 조명 강도 대폭 상향:                                                     │
│     * AmbientLight: 0.75 -> 0.95~1.10                                       │
│     * DirectionalLight: 1.95 -> 2.40~2.80                                   │
│     * FillLight: 0.85 -> 0.95~1.10                                          │
│     * RimLight: 0.70 -> 0.85~1.00                                           │
│   - 카메라 거리 및 황금비 쿼터뷰 복원:                                       │
│     * camera.position.set(16, 12, 30) (Z=30 고정)                           │
│     * camera.fov 모바일 세로 44~48 보정                                     │
│   - 블록 크기 정상화:                                                        │
│     * blockSize = 0.82 복원                                                 │
│   - 안전 여백 확보:                                                          │
│     * 좌측 3D 큐브와 우측 정답 그림자 비간섭 유지 (좌/우 40px+ 안전 여백)    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Test Writer / Auditor (테스트 작성 및 게이트 검증 담당)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ • 소유 파일:                                                                │
│   - tests/ (tests/tier1~4, verify_shadow_puzzle.js, verify_spti_*.js 등)   │
│ • 핵심 작업:                                                                │
│   - R1 롱프레스 모달 및 허위 알림 차단 자동화 검증 어서션 추가              │
│   - R2 조명 파라미터 및 뷰포트 안전 여백 자동화 검증 어서션 추가            │
│   - node tests/run_all_tests.js 무결성 회귀 검증 유지                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. 충돌 방지 세부 지침
1. **단일 파일 동시 수정 지양**:
   - `game/shadow_puzzle/script.js`를 수정할 때 Worker R1은 하단부(Line 1599 이후의 이미지/공유 함수), Worker R2는 상/중단부(Line 676~960의 3D 조명/카메라/블록 함수)로 작업 범위를 분리하거나, 순차적으로 적용(Sequential apply)하여 라인 충돌을 방지합니다.
2. **전역 변수 스코프 보존**:
   - `cachedMasterCanvas`, `progress`, `puzzleGroup`, `scene`, `camera`, `renderer` 등 전역 객체의 참조명을 변경하지 않고 유지합니다.

---

## 5. 종합 요약 및 오케스트레이터 전달 제언

1. **아키텍처 단순성**: 빌드 파이프라인이 없는 순수 정적 웹이므로 번들링 에러 위험이 없으며, 수정 즉시 브라우저 및 Node.js 테스트에서 피드백을 확인할 수 있습니다.
2. **테스트 검증 안정성**: `node tests/run_all_tests.js`로 기존 214개 어서션이 100% 통과되는 상태이므로, 신규 R1/R2 요구사항 적용 시 기존 회귀 없이 안전하게 변경을 검증할 수 있습니다.
3. **작업 우선순위 제안**:
   - **Step 1**: Worker R2가 `game/shadow_puzzle/script.js`의 조명 파라미터(Ambient, Directional, Fill, Rim), 카메라 거리(Z=30), 블록 크기(0.82), 뷰포트 여백(40px+)을 복원.
   - **Step 2**: Worker R1이 `game/shadow_puzzle/script.js` 및 `index.html`의 인앱 브라우저 감지, 가짜 `<a download>` 및 허위 알림 차단, 모바일 롱프레스 모달 직결 로직을 고도화.
   - **Step 3**: Test Writer가 R1/R2 특화 E2E 테스트를 보강하고 전체 회귀 테스트 통과를 확인.
