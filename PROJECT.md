# Project: 승민's 실험실 (Seungmin's Lab) 포털 고도화 및 모바일 최적화

## Architecture
- **Tech Stack**: Pure Static Web (HTML5, Vanilla JavaScript ES6+, Tailwind CSS CDN, Canvas 2D API, Three.js WebGL)
- **Directory Structure**:
  - `index.html` (메인 쇼케이스 포털)
  - `game/` (9개 웹 게임 및 인터랙티브 프로젝트)
    - `game/3D_ minesweeper/` (3D 지뢰찾기 - Three.js)
    - `game/Magnetic_Orbit/` (궤도 생존 - 2D Canvas)
    - `game/choi_circle/` (최원형 - Interactive Meme)
    - `game/hacking/` (해커 CTF - Interactive Terminal)
    - `game/maze_escape/` (3D 미로 탈출 - Three.js & 가상 조이스틱)
    - `game/robot/` (로봇 인증 - 10단계 캡차 밈)
    - `game/shadow_puzzle/` (그림자 퍼즐 - Three.js)
    - `game/sign_up_for_hell/` (지옥의 회원가입 - 인터랙티브 폼)
    - `game/slime_jump/` (슬라임 점프 - 2D Canvas Slingshot)
  - `.agents/` (오케스트레이터 및 하위 에이전트 메타데이터)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | About Me 프로필 카드 | 아바타, 자기소개, GitHub(`https://github.com/seuuung`) 링크, 기술 스택 뱃지 | M1 | Survey / R1 |
| F2 | 4단계 카테고리 탭 필터 | 전체, 모바일 앱, 웹 게임, 밈 & 실험실 동적 필터링 바닐라 JS | M1 | Survey / R1 |
| F3 | [삭제됨] 삼척 기상토토 쇼케이스 카드 | [삭제됨] game/toto 쇼케이스 카드 제거 완료 | M1 | Survey / R1 |
| F4 | 모던 글래스모피즘 & UI 개선 | Backdrop-filter, 호버 글로우, 배지, 일관된 푸터 브랜딩 | M1 | Survey / R1 |
| F5 | Viewport-Fit & Safe-Area | 전수 `viewport-fit=cover` 및 CSS `env(safe-area-inset-*)` 적용 | M2 | Survey / R2 |
| F6 | 320px~480px 모바일 오버플로우 해소 | `choi_circle`, `maze_escape`, `sign_up_for_hell` 고정 픽셀 유동화 | M2 | Survey / R2 |
| F7 | 44px+ 터치 타겟 최적화 | 지뢰찾기 모드 버튼, 슬라임 점프 시작 버튼, 룰렛/토토 버튼 크기 개선 | M2 | Survey / R2 |
| F8 | Canvas DPR 스케일링 전수 적용 | `slime_jump`, `Magnetic_Orbit`, `3D_ minesweeper`, `maze_escape`, `shadow_puzzle` 2x DPR | M3 | Survey / R3 |
| F9 | 슬라임 점프 버그 수정 | 중복 `handleMove` 함수 및 중복 `pointer`/`touch` 이벤트 리스너 통합 | M3 | Survey / R3 |
| F10 | 3D 지뢰찾기 터치 스크롤 버그 수정 | `style.display !== 'none'` 조건 교정 및 미사용 CDN 정리 | M3 | Survey / R3 |
| F11 | 궤도 생존 리사이즈 버그 수정 | 화면 회전/리사이즈 시 `player.radius` 비례 갱신 적용 | M3 | Survey / R3 |
| F12 | 미로 탈출 & 그림자 퍼즐 반응형 최적화 | 가상 조이스틱 활성화 및 모바일 세로 뷰포트 FOV 보정 | M3 | Survey / R3 |
| F13 | 표준 '홈으로 가기' 내비게이션 전수 적용 | 10개 하위 프로젝트 좌상단 Safe-Area 준수 플로팅 글래스 홈 버튼 적용 | M4 | Survey / R4 |
| F14 | 런타임 콘솔 에러 및 링크 오타 전수 수정 | `game/robot` OG 링크/수료식 링크 수정 및 콘솔 에러 제거 | M4 | Survey / R4 |
| F15 | E2E 테스트 및 품질 검증 | 4-Tier Opaque-box 테스트 및 Reviewer/Challenger/Auditor 게이트 통과 | M5 | R1~R4 검증 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 포털 UI/UX 고도화 & 카테고리 필터링 | `index.html` About Me, 탭 필터링, `toto` 카드 추가, 글래스모피즘 디자인 | Survey 완료 | DONE |
| M2 | 모바일 반응형 & Safe-Area & 터치 타겟 | Viewport-fit, `env(safe-area-inset-*)`, 320px 오버플로우 방지, 44px 타겟 | M1 | DONE |
| M3 | 웹 게임 모바일 터치 & Canvas DPR/리사이즈 왜곡 수정 | 5개 Canvas/WebGL 게임 DPR, 리사이즈 왜곡 수정, 슬라임 점프 버그 수정 | M1 | DONE |
| M4 | 표준 글로벌 내비게이션 & 버그 전수 수정 | 9개 하위 게임 좌상단 플로팅 홈 버튼 전수 적용 및 콘솔 런타임 에러 제거 | M2, M3 | DONE |
| M5 | E2E 테스트 검증 & Adversarial Hardening & Audit | 전체 기능 및 모바일 반응형 검증, Reviewer/Challenger/Auditor 게이트 | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Floating Home Navigation Contract
- Target: All 9 subprojects (`game/*/index.html`)
- UI Element: Floating Glassmorphism Button at top-left (`position: fixed; top: max(16px, env(safe-area-inset-top, 16px)); left: max(16px, env(safe-area-inset-left, 16px)); z-index: 9999;`)
- HTML Snippet:
  ```html
  <a href="../../index.html" class="floating-home-btn" aria-label="실험실 홈으로 이동">
    <svg ...></svg>
    <span>실험실 홈</span>
  </a>
  ```
- Touch Target: Minimum height 44px, minimum touch padding, smooth hover/active backdrop effect.

### Category Tab Contract (`index.html`)
- Tabs: `all` (전체), `app` (모바일 앱), `game` (웹 게임), `lab` (밈 & 실험실)
- DOM Target: `data-category` attribute on all project cards (`app`, `game`, `lab`).
- Interactive State: Active tab highlighted with blue-purple gradient glow, inactive tabs semi-transparent glass.

### Canvas DPR Scaling Contract
- All Canvas/WebGL games must scale canvas buffer size:
  - 2D Canvas: `canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);`
  - Three.js: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(width, height);`

## Code Layout
- `index.html`: Main showcase portal
- `game/3D_ minesweeper/*`: 3D Minesweeper Three.js
- `game/Magnetic_Orbit/*`: Magnetic Orbit 2D Canvas
- `game/choi_circle/*`: Choi Circle Meme
- `game/hacking/*`: Hacker CTF Simulator
- `game/maze_escape/*`: Maze Escape Three.js
- `game/robot/*`: Robot Captcha Meme
- `game/shadow_puzzle/*`: Shadow Puzzle Three.js
- `game/sign_up_for_hell/*`: Hell Signup Form Meme
- `game/slime_jump/*`: Slime Jump 2D Canvas
- `tests/`: E2E verification test suites and runners
