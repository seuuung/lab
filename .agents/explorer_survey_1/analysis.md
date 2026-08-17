# '승민's 실험실' 포털 및 전반 구조 정밀 분석 보고서

- **작성 일시**: 2026-08-17
- **분석 에이전트**: `teamwork_preview_explorer` (explorer_survey_1)
- **분석 대상**: 프로젝트 루트 (`index.html`), 하위 디렉토리 (`game/*` 10개 프로젝트), 전체 링크 및 내비게이션 구조

---

## 1. 핵심 요약 (Executive Summary)

1. **프로젝트 현황**:
   - 본 리포지토리는 웹 기반 개인 포트폴리오 및 실험실 웹사이트로, **외부 모바일 앱 2개(Google Play 링크)** 와 **로컬 하위 웹 프로젝트 10개**를 보유하고 있습니다.
   - 메인 포털 `index.html`은 빌드 도구 없이 Tailwind CSS CDN과 바닐라 HTML/JS로 구성되어 있으며, 글래스모피즘(Glassmorphism) 다크 테마를 채택하고 있습니다.

2. **주요 결함 및 미흡점**:
   - **[R1] About Me / 프로필 소개 영역 부재**: `index.html` 상단에 단순 제목과 슬로건만 존재하며, 개발자 프로필, 자기소개, GitHub/소셜 링크, 기술 스택 뱃지 등이 전무합니다.
   - **[R1] 누락된 고아 프로젝트 존재 (`game/toto`)**: `game/toto` (삼척기상토토, 약 1,745줄의 완성도 높은 날씨 베팅/사다리 시뮬레이터)가 로컬에 완비되어 있으나 `index.html`에 전혀 링크되어 있지 않습니다.
   - **[R1] 단순 나열식 카테고리 분류**: 현재 2개 섹션("모바일 앱", "웹 게임 실험실")으로만 나뉘어 있고, 9개 게임이 필터링 없이 한 화면에 일괄 나열되어 있어 탐색성이 떨어집니다.
   - **[R4] '홈으로 가기' 내비게이션 전수 부재**: 10개 하위 프로젝트 중 9개 프로젝트에 메인 포털로 복귀할 수 있는 버튼이나 링크가 전혀 없습니다. (유일하게 `game/robot`의 11단계 클리어 화면에만 존재하여 인게임 플레이 중에는 복귀 불가).
   - **[R4] 경로 및 메타 태그 불일치**: `game/3D_ minesweeper` 폴더명의 공백 문제, `game/robot/index.html`의 Open Graph URL 오타 (`games/robot`), 메타 태그 `viewport-fit=cover` 미적용 등.

---

## 2. 전체 프로젝트 및 디렉토리 구조 맵 (Project Inventory)

```
c:\Users\figig\Desktop\project\lab\
├── index.html                     # 메인 쇼케이스 포털 (HTML + Tailwind CDN + Glassmorphism)
├── .gitignore
├── game/
│   ├── 3D_ minesweeper/          # 3D 큐브 지뢰찾기 (Three.js 기반)
│   │   ├── index.html
│   │   ├── script.js
│   │   ├── style.css
│   │   └── DESIGN_DOC.md
│   ├── Magnetic_Orbit/           # 궤도 생존 아케이드 (Canvas 2D, 물리 시뮬레이션)
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   ├── choi_circle/              # 최원형 밈 인터랙티브 페이지 (MathJax, 도망가는 버튼)
│   │   └── index.html
│   ├── hacking/                  # Linux Hacker CTF 시뮬레이터 (가상 터미널 및 파일시스템)
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── maze_escape/              # 3D 1인칭 미로 탈출 (Three.js PointerLock / 모바일 가상 조이스틱)
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   ├── robot/                    # 10단계 잉여력/로봇 방지 인증 (인터랙티브 밈 퍼즐)
│   │   ├── index.html
│   │   ├── script.js
│   │   ├── style.css
│   │   └── readme.md
│   ├── shadow_puzzle/            # 3D 그림자 맞추기 퍼즐 (Three.js)
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── sign_up_for_hell/         # 지옥의 회원가입 폼 (UI/UX 밈 인터랙션)
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── slime_jump/               # 쫀득쫀득 네온 슬라임 점프 (Canvas 2D 종스크롤 아케이드)
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   └── toto/                     # 삼척 기상 토토 (Tailwind, Web Audio, 실시간 베팅/사다리 시뮬레이터)
│       ├── index.html
│       ├── app.js
│       └── style.css
└── .agents/                      # 멀티 에이전트 메타데이터 (프로덕션 배포 대상 아님)
```

---

## 3. 메인 포털 (`index.html`) 정밀 분석

### 3.1 현재 구성 요소 분석
1. **Header (헤더 영역, Lines 123-131)**:
   - 제목: `승민's 실험실` (그라디언트 텍스트 및 네온 효과)
   - 부제: `사이드 프로젝트를 즐겨보세요!`
   - **문제점**: 작성자(승민)에 대한 프로필, 자기소개(About Me), 깃허브 링크, 이메일, 기술 스택 요약 등이 전혀 존재하지 않음.
2. **모바일 앱 섹션 (Lines 136-188)**:
   - `온식 (OnSic)`: Google Play 스토어 링크 (`com.onsic.app`), 식단 아카이빙 앱.
   - `Spatial Mine`: Google Play 스토어 링크 (`spatialmine.app`), 3D 지뢰찾기 앱.
   - UI 스타일: 가로형 2열 그리드 (`grid-cols-1 lg:grid-cols-2`), 썸네일 + 설명 + 배지.
3. **웹 게임 실험실 섹션 (Lines 191-412)**:
   - 등록된 9개 게임:
     1. 슬라임 점프 (`game/slime_jump/index.html`): Arcade
     2. 궤도 생존 (`game/Magnetic_Orbit/index.html`): Arcade
     3. 미로 탈출 (`game/maze_escape/index.html`): Puzzle
     4. 해커 CTF (`game/hacking/index.html`): Simulation
     5. 그림자 퍼즐 (`game/shadow_puzzle/index.html`): Puzzle
     6. 3D 지뢰찾기 (`game/3D_ minesweeper/index.html`): Puzzle
     7. 지옥의 회원가입 (`game/sign_up_for_hell/index.html`): Meme
     8. 최원형 (`game/choi_circle/index.html`): Meme
     9. 로봇 인증 (`game/robot/index.html`): Meme
     10. Coming Soon 플레이스홀더 카드 (Lines 400-408)
   - **문제점**:
     - `game/toto` (삼척 기상토토)가 완전히 누락되어 있음.
     - 게임의 성격(아케이드 게임 vs 3D 퍼즐 vs 밈/인터랙티브 실험작)이 섞여 있으나 필터 탭이나 세부 분류가 없음.
4. **Footer (푸터 영역, Lines 414-416)**:
   - `&copy; 2026 Arcade Portal. All rights reserved.`
   - **문제점**: 사이트명인 '승민's 실험실'과 일치하지 않는 generic 명칭(`Arcade Portal`) 사용. 깃허브 링크 및 소셜 링크 부재.

---

## 4. 링크 정합성 및 고아 프로젝트 전수 조사

| # | 대상 프로젝트 | 실제 파일 존재 여부 | `index.html` 링크 상태 | 문제점 및 비고 |
|---|---|---|---|---|
| 1 | 온식 (OnSic) | Google Play Store | 정상 연결 (`https://play.google.com/...`) | 외부 링크 (`target="_blank"`, `rel="noopener noreferrer"`) |
| 2 | Spatial Mine | Google Play Store | 정상 연결 (`https://play.google.com/...`) | 외부 링크 (`target="_blank"`, `rel="noopener noreferrer"`) |
| 3 | 슬라임 점프 | `game/slime_jump/index.html` | 정상 연결 (`game/slime_jump/index.html`) | 정상 작동 |
| 4 | 궤도 생존 | `game/Magnetic_Orbit/index.html` | 정상 연결 (`game/Magnetic_Orbit/index.html`) | 정상 작동 |
| 5 | 미로 탈출 | `game/maze_escape/index.html` | 정상 연결 (`game/maze_escape/index.html`) | 정상 작동 |
| 6 | 해커 CTF | `game/hacking/index.html` | 정상 연결 (`game/hacking/index.html`) | 정상 작동 |
| 7 | 그림자 퍼즐 | `game/shadow_puzzle/index.html` | 정상 연결 (`game/shadow_puzzle/index.html`) | 정상 작동 |
| 8 | 3D 지뢰찾기 | `game/3D_ minesweeper/index.html` | 연결됨 (`game/3D_ minesweeper/index.html`) | ⚠️ 폴더명에 공백(` `) 포함. URL 인코딩(`3D_%20minesweeper`) 또는 폴더명 표준화 권장 |
| 9 | 지옥의 회원가입 | `game/sign_up_for_hell/index.html` | 정상 연결 (`game/sign_up_for_hell/index.html`) | 정상 작동 |
| 10 | 최원형 | `game/choi_circle/index.html` | 정상 연결 (`game/choi_circle/index.html`) | 정상 작동 |
| 11 | 로봇 인증 | `game/robot/index.html` | 정상 연결 (`game/robot/index.html`) | ⚠️ `og:url` 오타 (`games/robot` -> `game/robot`) |
| 12 | **삼척 기상토토** | `game/toto/index.html` | ❌ **완전 누락 (고아 프로젝트)** | **즉시 메인 포털에 쇼케이스 카드 추가 필수** |

---

## 5. '홈으로 가기' (Back to Home) 내비게이션 전수 점검

| # | 서브 프로젝트 | 현재 홈 버튼 유무 | 복귀 가능 여부 | 필요한 개선 조치 |
|---|---|---|---|---|
| 1 | 3D 지뢰찾기 (`3D_ minesweeper`) | ❌ 없음 | 불가 (브라우저 뒤로가기만 가능) | 상단 HUD 좌측 또는 시작 메뉴에 홈 버튼 추가 |
| 2 | 궤도 생존 (`Magnetic_Orbit`) | ❌ 없음 | 불가 | 상단 UI 레이어 좌측에 홈 플로팅 버튼 추가 |
| 3 | 최원형 (`choi_circle`) | ❌ 없음 | 불가 | 상단 좌측/우측에 플로팅 홈 버튼 추가 |
| 4 | 해커 CTF (`hacking`) | ❌ 없음 | 불가 | 터미널 상단 타이틀바 / 플로팅 홈 버튼 추가 |
| 5 | 미로 탈출 (`maze_escape`) | ❌ 없음 | 불가 | HUD / 블로커 안내 화면 / 클리어 화면에 홈 버튼 추가 |
| 6 | 로봇 인증 (`robot`) | ⚠️ 11단계 수료식에만 존재 | 1~10단계 플레이 중 불가 | 상단 파란색 헤더 바에 '실험실 홈' 버튼 상시 배치 |
| 7 | 그림자 퍼즐 (`shadow_puzzle`) | ❌ 없음 | 불가 | 상단 HUD 좌측에 홈 플로팅 버튼 추가 |
| 8 | 지옥의 회원가입 (`sign_up_for_hell`) | ❌ 없음 | 불가 | 메인 박스 상단 또는 플로팅 홈 버튼 추가 |
| 9 | 슬라임 점프 (`slime_jump`) | ❌ 없음 | 불가 | 상단 UI Layer 및 시작/게임오버 화면에 홈 버튼 추가 |
| 10 | 삼척 기상토토 (`toto`) | ❌ 없음 | 불가 | 상단 고정 헤더(`header`) 로고 좌측/우측에 '실험실 홈' 링크 추가 |

---

## 6. R1 (쇼케이스 포털 고도화) 개선 요구사항 및 구체적 구현 방안

### 6.1 프로필 / 소개 (About Me) 섹션 신설
- **위치**: Header 바로 아래, 카테고리 탭 상단.
- **UI 구조**:
  - 글래스모피즘 프로필 카드 (`glass-card rounded-3xl p-6 sm:p-8`)
  - 개발자 아바타/아이콘 (네온 글로우 효과)
  - 자기소개 텍스트: "창의적인 인터랙티브 웹과 모바일 앱을 만드는 개발자 승민의 포트폴리오 & 실험실입니다."
  - 소셜 & 링크 뱃지: GitHub (`https://github.com/seuuung`), Email/Contact, Google Play Developer 링크.
  - 핵심 기술 스택 태그: `JavaScript (ES6+)`, `Three.js / WebGL`, `Canvas 2D`, `Tailwind CSS`, `Android / Kotlin`, `Interactive UI/UX`.

### 6.2 카테고리 분류 체계화 및 인터랙티브 필터 탭 도입
- **분류 체계**:
  1. `전체보기 (All)` - 모든 프로젝트 (12개: 앱 2개 + 게임 10개)
  2. `📱 모바일 앱 (Mobile Apps)` - OnSic, Spatial Mine
  3. `🎮 웹 게임 (Web Games)` - 슬라임 점프, 궤도 생존, 미로 탈출, 3D 지뢰찾기, 그림자 퍼즐
  4. `🧪 밈 & 실험실 (Lab & Memes)` - 삼척 기상토토, 로봇 인증, 해커 CTF, 지옥의 회원가입, 최원형
- **인터랙티브 탭 UI**:
  - 활성화된 탭에 네온 그래디언트 하이라이트.
  - 바닐라 JS 필터링 함수 (`filterProjects(category)`)로 카드 표시/숨김 처리 (부드러운 페이드 인 애니메이션).

### 6.3 삼척 기상토토 (`game/toto`) 카드 디자인 추가
- **카드 스펙**:
  - 제목: `삼척 기상토토`
  - 뱃지: `Simulation` / `Web App` (에메랄드/테일 테마)
  - 설명: "2026년 7월 17일 삼척 날씨를 실시간 데이터와 기상 모형으로 예측하는 위트 있는 시뮬레이션 배팅 게임!"
  - 링크: `game/toto/index.html`
  - 썸네일: `☁️⚡` 기상 특보 애니메이션 및 네온 에메랄드 테두리.

### 6.4 모바일 반응형 및 터치 타겟 최적화
- 모든 카드에 `min-h-[44px]` 터치 영역 확보.
- 320px~480px 화면에서 카드 내 텍스트 줄바꿈(`break-keep`), 썸네일 크기(4rem -> 모바일 최적화), Safe Area 패딩(`p-4 sm:p-8 pb-safe`) 적용.
- 가로 스크롤(Overflow-x) 방지 확인.

### 6.5 푸터 브랜딩 정상화
- `&copy; 2026 승민's 실험실 (Seungmin's Lab). All rights reserved.`
- GitHub 프로필 바로가기 링크 추가.

---

## 7. R4 (전반적 버그 및 내비게이션) 개선 요구사항 및 구체적 구현 방안

### 7.1 표준화된 '홈으로 가기' (Back to Home) 공통 컴포넌트 규격
모든 하위 10개 프로젝트에 적용할 표준 내비게이션 요소를 정의합니다.

#### 규격 A: 전체화면 캔버스 / 게임용 플로팅 홈 버튼 (Floating Home Button)
- **적용 대상**: `slime_jump`, `Magnetic_Orbit`, `maze_escape`, `3D_ minesweeper`, `shadow_puzzle`, `choi_circle`, `sign_up_for_hell`, `hacking`
- **HTML 구조**:
  ```html
  <a href="../../index.html" class="home-nav-btn" title="승민's 실험실 홈으로">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
      <span>실험실 홈</span>
  </a>
  ```
- **CSS 스타일**:
  ```css
  .home-nav-btn {
      position: fixed;
      top: max(1rem, env(safe-area-inset-top));
      left: max(1rem, env(safe-area-inset-left));
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.85rem;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      color: #f8fafc;
      font-size: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.25s ease;
      user-select: none;
      min-height: 44px;
      min-width: 44px;
  }
  .home-nav-btn:hover {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(6, 182, 212, 0.5);
      color: #38bdf8;
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(6, 182, 212, 0.25);
  }
  .home-nav-btn:active {
      transform: scale(0.95);
  }
  ```

#### 규격 B: 상단 헤더 내장형 홈 버튼 (Header Integrated Home Button)
- **적용 대상**: `robot`, `toto`
- **방식**: 기존 상단 헤더 바 좌측/우측에 동일한 홈 이동 링크 배치.
- `robot`: 파란색 상단 헤더에 `<a href="../../index.html">` 링크 버튼 추가.
- `toto`: 상단 고정 헤더의 로고 옆 또는 우측에 '실험실 홈' 버튼 추가.

### 7.2 메타 태그 및 뷰포트 정합성 전수 정비
1. 모든 HTML 문서 `<head>`의 뷰포트에 `viewport-fit=cover` 옵션 누락분 보강.
2. `game/robot/index.html`의 Open Graph 메타 태그 URL 오타 수정:
   - 수정 전: `https://seuuung.github.io/game/games/robot/index.html`
   - 수정 후: `https://seuuung.github.io/game/robot/index.html`
3. 폴더명 `game/3D_ minesweeper`의 경로 참조를 안전하게 유지하거나 표준화.

---

## 8. 단계별 구현 권장 순서 (Implementation Roadmap for Workers)

1. **Step 1: 메인 포털 `index.html` 전면 개편 (R1)**
   - About Me 프로필 카드 추가 (프로필, 자기소개, 깃허브 링크, 기술 스택)
   - 카테고리 필터 탭 (전체, 모바일 앱, 웹 게임, 밈/실험실) 및 바닐라 JS 필터링 로직 구현
   - `game/toto` 삼척 기상토토 쇼케이스 카드 추가
   - 푸터 브랜딩 갱신
2. **Step 2: 하위 10개 프로젝트 '홈으로 가기' 내비게이션 전수 적용 (R4)**
   - 8개 캔버스/풀스크린 게임: 공통 글래스모피즘 플로팅 홈 버튼 추가
   - 2개 헤더형 프로젝트 (`robot`, `toto`): 헤더 연동 홈 버튼 추가
3. **Step 3: 메타 태그, Safe Area, 뷰포트 정합성 정비 (R2, R4)**
   - `viewport-fit=cover` 및 OG 태그 수정
4. **Step 4: 브라우저 및 모바일 반응형 종합 검증 (Verification)**
   - 모든 링크 클릭 시 정상 이동 및 뒤로가기/홈 복귀 흐름 점검
