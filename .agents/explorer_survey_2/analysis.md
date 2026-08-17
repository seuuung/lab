# 모바일 반응형 및 스타일/Safe-Area 전수 조사 보고서 (R2 Survey & Analysis)

- **조사관**: `teamwork_preview_explorer` (Survey 2: Mobile Responsiveness & Safe-Area Specialist)
- **일시**: 2026-08-17T12:55:00+09:00
- **조사 대상**: 메인 쇼케이스 포털(`index.html`) 및 10개 하위 프로젝트(`game/*`) 전수

---

## 1. 개요 및 핵심 진단 요약

본 조사는 '승민\'s 실험실' 프로젝트의 **R2(완벽한 모바일 반응형 및 Safe-Area 최적화)** 요구사항을 충족하기 위해, 320px~480px 소형 모바일 기기부터 태블릿, 데스크톱에 이르는 레이아웃 안정성, Safe-Area(`env(safe-area-inset-*)`), 터치 타겟 크기(44px+), 글래스모피즘 가독성 및 모바일 성능을 전수 점검하였습니다.

### 🔍 핵심 발견 사항 요약
1. **Safe-Area 및 Viewport 지원 결여**: 메인 포털과 10개 하위 게임 중 `viewport-fit=cover`가 설정된 곳은 2곳(`3D_ minesweeper`, `Magnetic_Orbit`)에 불과하며, CSS에서 실제 `env(safe-area-inset-*)`를 구현한 곳은 `Magnetic_Orbit` 단 1곳뿐입니다. iPhone 노치/Dynamic Island 및 하단 Home Indicator 영역에서 UI가 가려지거나 터치가 방해받는 현상이 전반적으로 발생합니다.
2. **320px~480px 소형 화면 레이아웃 파손**:
   - `choi_circle`: `#truth-alert`에 `width: 500px`, `.orbit-text`에 지름 400px, `.giant-circle`에 300px(scale 시 330px) 고정 너비가 지정되어 소형 모바일에서 심각한 화면 잘림 및 가로 오버플로우 발생.
   - `maze_escape`: `#instructions`의 좌우 120px 패딩과 `font-size: 3.5rem` 제목, 클리어 모달의 좌우 160px 패딩으로 소형 화면에서 심각한 오버플로우 발생.
   - `sign_up_for_hell`: `#main-box`의 20px 돌출 그림자(`shadow-[20px_20px_0px_...]`) 및 과도한 패딩으로 가로 스크롤(`overflow-x`) 유발.
3. **터치 타겟(44px * 44px) 미달 요소 다수 발견**:
   - `3D_ minesweeper`: 하단 5개 모드 버튼 및 상단 메뉴 버튼 높이가 약 **32px**로 기준 미달.
   - `slime_jump`: 시작/재시작 버튼 모바일 패딩(`py-2`)으로 높이 약 **36px**로 기준 미달.
   - `sign_up_for_hell`: 생년월일 STOP 버튼(높이 ~28px), 약관 동의/거절 버튼(높이 ~36px) 기준 미달.
   - `toto`: 칩 빠른 충전 버튼(높이 ~26px), 마켓 탭 버튼(높이 ~36px) 기준 미달.
4. **글래스모피즘 가독성 및 모바일 GPU 부하**:
   - `index.html`의 3개 대형 `blur-[100px]` 앰비언트 라이트 애니메이션과 카드들의 `backdrop-filter: blur(16px)`가 중첩되어 모바일 저사양 기기에서 스크롤 프레임 드랍 위험. 야외 시인성을 위한 텍스트 대비 개선 필요.
5. **공통 내비게이션(포털 복귀 홈 버튼) 부재**:
   - 10개 게임 중 9개 게임에 메인 포털(`index.html`)로 돌아갈 수 있는 뒤로가기/홈 버튼이 전무하여, PWA/웹앱 모드 실행 시 사용자가 게임 내에 고립되는 치명적 UX 결함 존재.

---

## 2. Viewport 및 Safe-Area 전수 조사 결과

| 페이지 경로 | Viewport 설정 | `viewport-fit=cover` | Safe-Area CSS (`env(...)`) | 주요 문제점 및 모바일 영향 |
| :--- | :--- | :---: | :---: | :--- |
| `index.html` (메인 포털) | `width=device-width, initial-scale=1.0` | ❌ 미적용 | ❌ 미적용 | iOS Safari/Chrome에서 노치 및 하단 홈 바 영역 여백 처리 부재 |
| `game/3D_ minesweeper` | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover` | ✅ 적용 | ❌ 미적용 | Viewport는 선언되었으나 CSS에 Safe-Area가 없어 상단바/하단 5개 버튼이 노치/홈바에 가림 |
| `game/Magnetic_Orbit` | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover` | ✅ 적용 | ⚠️ 부분 적용 (`.safe-padding`) | 점수판 UI는 Safe-Area 지원하나 시작/게임오버 모달 패널에는 미적용 |
| `game/choi_circle` | `width=device-width, initial-scale=1.0` | ❌ 미적용 | ❌ 미적용 | 상단 전광판(`top: 10px`)이 노치에 가려지고, 하단 입력창(`bottom: 20px`)이 홈 바와 겹침 |
| `game/hacking` | `width=device-width, initial-scale=1.0` | ❌ 미적용 | ❌ 미적용 | 터미널 텍스트 상단/하단 영역이 Safe-Area 미반영으로 가장자리 잘림 |
| `game/maze_escape` | `width=device-width, initial-scale=1.0, user-scalable=no` | ❌ 미적용 | ❌ 미적용 | 상단 HUD 타이머(`top: 20px`) 노치 간섭, 우하단 액션 버튼(`bottom: 40px`) 홈 바 간섭 |
| `game/robot` | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` | ❌ 미적용 | ❌ 미적용 | 상단 헤더(`p-4`) 및 각 단계 하단 액션 버튼이 노치/홈 바와 겹침 |
| `game/shadow_puzzle` | `width=device-width, initial-scale=1.0, user-scalable=no` | ❌ 미적용 | ❌ 미적용 | 상단 헤더(`p-6`) 및 하단 가이드/다음 버튼(`bottom-10`)이 Safe-Area 미적용 |
| `game/sign_up_for_hell` | `width=device-width, initial-scale=1.0` | ❌ 미적용 | ❌ 미적용 | 상단 전광판 및 하단 제출 버튼 영역 Safe-Area 미반영 |
| `game/slime_jump` | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` | ❌ 미적용 | ❌ 미적용 | 상단 고도/최고기록 UI(`p-2 sm:p-5`)가 노치에 의해 가려짐 |
| `game/toto` | `width=device-width, initial-scale=1.0` | ❌ 미적용 | ❌ 미적용 | 하단 플로팅 슬립 바(`height: 60px; bottom: 0;`) 및 바텀 시트가 홈 바와 겹쳐 터치 오작동 |

---

## 3. 320px~480px 소형 모바일 레이아웃 및 가로 스크롤(overflow-x) 상세 진단

### 1) 메인 쇼케이스 포털 (`index.html`)
- **320px 진단**:
  - `body`의 `p-4`(32px) + `main`의 `px-2`(16px) = 기본 좌우 48px 소모.
  - `.glass-card` 내부: 패딩 32px + 썸네일(64px) + gap(16px) = 112px 소모.
  - 텍스트 가용 너비가 160px에 불과하여 제목(예: "지옥의 회원가입")과 뱃지("Meme")가 한 줄에 들어가지 못하고 줄바꿈 발생.
  - 헤더 타이틀 `text-4xl`(36px) "승민's 실험실"은 320px에서 약 280px를 차지하여 여백이 극히 부족.
- **개선안**:
  - 모바일 소형 화면(`< 640px`)에서는 `p-3` 또는 `px-2.5`, 카드 내부 패딩을 `p-3.5`, 썸네일을 `w-12 h-12`(48px)로 유연하게 축소하고, 타이틀 폰트를 `text-3xl sm:text-5xl md:text-7xl`로 조정.

### 2) 3D 지뢰찾기 (`game/3D_ minesweeper`)
- **320px 진단**:
  - 하단 5개 모드 버튼이 한 줄에 배치되어 버튼 너비가 54px 이하로 축소됨.
  - 게임 설명 오버레이(`#game-help-overlay`)의 `padding: 2rem`(좌우 64px)로 인해 소형 화면에서 가용 너비가 256px 이하로 좁아짐.
- **개선안**:
  - 모바일에서는 5개 모드 버튼을 2단 또는 아이콘 중심 + 유동 텍스트 형태로 조정하거나, 버튼 폰트와 패딩을 최적화하고 최소 높이 44px를 확보. 오버레이 패딩을 `p-4 sm:p-8`로 반응형 전환.

### 3) 최원형 (`game/choi_circle`)
- **320px 진단**:
  - `#truth-alert`에 고정 `width: 500px;` 지정 → 320px~480px 화면에서 모달이 오른쪽 화면 밖으로 크게 튀어나가 잘림.
  - `.orbit-text`에 고정 `width: 400px; height: 400px; margin-left: -200px;` 및 `radius = 200px` 지정 → 320px 화면에서 궤도 텍스트가 좌우로 40px씩 잘려나감.
  - `.giant-circle`에 고정 `width: 300px; height: 300px;` + `scale(1.1)` 애니메이션 → 최대 330px로 320px 화면 너비 초과.
- **개선안**:
  - `#truth-alert`: `width: min(90vw, 500px); max-height: 85vh; overflow-y: auto;`
  - `.giant-circle`: `width: min(70vw, 300px); height: min(70vw, 300px);`
  - `.orbit-text`: 뷰포트 너비에 맞추어 `radius = Math.min(window.innerWidth * 0.4, 200)`으로 동적 계산.

### 4) 해킹 CTF (`game/hacking`)
- **320px 진단**:
  - 모바일 가상 키보드 팝업 시 화면 높이가 줄어들며 입력 프롬프트가 가려지거나 스크롤이 어긋남.
- **개선안**:
  - 터미널 폰트 크기 `clamp(12px, 3.5vw, 16px)` 반응형 적용.
  - 모바일 전용 퀵 커맨드 터치 바 추가 (`ls`, `cat`, `help`, `clear` 등 44px 터치 버튼).

### 5) 미로 탈출 (`game/maze_escape`)
- **320px 진단**:
  - `#instructions`에 `padding: 50px 60px;` 고정 (좌우 120px 패딩).
  - `h1`에 `font-size: 3.5rem;`(56px) 적용 → "MAZE RUNNER" 텍스트가 320px 화면을 심각하게 초과하여 잘림.
  - `.win-panel`에 `padding: 60px 80px;` (좌우 160px 패딩) → 승리 모달 내용 잘림.
- **개선안**:
  - `#instructions`, `.win-panel`: `padding: 2rem 1rem; width: min(90vw, 480px);`
  - `h1`: `font-size: clamp(1.8rem, 8vw, 3.5rem);`

### 6) 로봇 인증 (`game/robot`)
- **320px 진단**:
  - `body`의 `dynamic-h`와 `overflow-hidden`은 모바일 뷰포트에 적절하나, 수료증 모달(`#cert-wrap`)이 `border-[12px] p-8 max-w-lg`로 되어 있어 320px 화면에서 상하 스크롤이 필요하거나 텍스트가 넘침.
- **개선안**:
  - 수료증 모달: `p-4 sm:p-8 border-[6px] sm:border-[12px] max-h-[85vh] overflow-y-auto`.

### 7) 그림자 퍼즐 (`game/shadow_puzzle`)
- **320px 진단**:
  - 상단 헤더 "섀도우 퍼즐"(`text-3xl`)과 "💡 드래그하여 회전" 배지가 320px에서 충돌.
- **개선안**:
  - 헤더 폰트 `text-xl sm:text-3xl`, 상단 Safe-Area 패딩 `pt-[max(1rem,env(safe-area-inset-top))]`.

### 8) 지옥의 회원가입 (`game/sign_up_for_hell`)
- **320px 진단**:
  - `#main-box`의 `shadow-[20px_20px_0px_rgba(0,0,255,0.5)]`로 인해 우측 20px 그림자가 320px 화면 밖으로 돌출되어 가로 스크롤(`overflow-x`) 발생.
  - 생년월일 룰렛 박스 3개 및 STOP 버튼이 320px에서 타이트하여 텍스트 줄바꿈 위험.
  - `#terms-container` 질문과 2개 버튼이 단일 행으로 배치되어 축소 시 버튼이 찌그러짐.
- **개선안**:
  - `#main-box`: 모바일에서는 그림자 오프셋을 `shadow-[8px_8px_0px_rgba(0,0,255,0.5)] sm:shadow-[20px_20px_0px_...]`로 완화하고, 컨테이너 너비를 `w-[calc(100%-1.5rem)]`로 마진 확보.
  - `#terms-container`: `flex-col sm:flex-row gap-3` 반응형 적용.

### 9) 슬라임 점프 (`game/slime_jump`)
- **320px 진단**:
  - 레이아웃은 전반적으로 안정적이나, 버튼 패딩이 `py-2`로 터치 타겟이 작음.
- **개선안**:
  - 버튼 클래스 `py-3 px-8 text-base min-h-[44px]` 적용.

### 10) 삼척 날씨 토토 (`game/toto`)
- **320px 진단**:
  - `#gate-card`의 `padding: 2.25rem 2rem;`로 인해 내부 입력창이 좁아짐.
  - 관리자 정산 시뮬레이터 2열 그리드 셀 내의 셀렉트박스 텍스트 잘림.
- **개선안**:
  - 게이트 카드 패딩 `p-5 sm:p-8`, 정산 시뮬레이터 그리드 `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`.

---

## 4. 터치 타겟 크기 (최소 44px * 44px) 및 모바일 인터랙션 분석

| 프로젝트 | UI 컴포넌트 | 현재 높이/너비 | 44px 규격 충족 여부 | 개선 제안 |
| :--- | :--- | :---: | :---: | :--- |
| `3D_ minesweeper` | 하단 5개 모드 버튼 (`.mode-btn`) | ~32px | ❌ 미달 | `min-height: 44px; padding: 0.6rem 0.2rem;` |
| `3D_ minesweeper` | 상단 정렬/메뉴 버튼 (`#btn-recenter`, `#btn-restart`) | ~32px | ❌ 미달 | `min-height: 44px; padding: 0.6rem 0.8rem;` |
| `slime_jump` | 시작 및 재시작 버튼 (`#startBtn`, `#restartBtn`) | ~36px | ❌ 미달 | `py-3 px-8 text-base min-h-[44px]` |
| `sign_up_for_hell` | 생년월일 STOP 버튼 (`#btn-year`, `#btn-month`, `#btn-day`) | ~28px | ❌ 미달 | `py-2.5 text-sm min-h-[44px]` |
| `sign_up_for_hell` | 약관 동의/거절 버튼 (`#btn-yes`, `#btn-no`) | ~36px | ❌ 미달 | `py-2.5 px-5 min-h-[44px]` |
| `toto` | 칩 퀵 입력 버튼 (`+1만`, `+5만`, `+10만`, `+50만`) | ~26px | ❌ 미달 | `py-2.5 text-xs min-h-[40px]` |
| `toto` | 마켓 탭 버튼 (`.market-tab`) | ~36px | ❌ 미달 | `py-2.5 px-4 min-h-[44px]` |
| `choi_circle` | 도망가는 버튼 (`runawayBtn`) | 50px (충족) | ⚠️ 터치 이벤트 불일치 | 모바일 터치(`touchstart`/`touchmove`) 이벤트 핸들러 추가 보정 |
| `sign_up_for_hell` | 도망가는 가입 버튼 (`runaway-btn`) | 56px (충족) | ⚠️ 터치 이벤트 불일치 | 모바일 터치 접근 시 도망 기믹 작동하도록 터치 리스너 보강 |
| `hacking` | 터미널 명령어 입력 | 인풋창만 존재 | ❌ 가상 키보드 피로도 극심 | 44px 높이의 퀵 커맨드 바 버튼(`ls`, `cat`, `help`, `clear`) 추가 |

---

## 5. 글래스모피즘 가독성 및 모바일 GPU 성능 분석

### 1) 텍스트 대비(Contrast Ratio) 및 가독성
- **문제점**:
  - `index.html`의 카드는 `rgba(255, 255, 255, 0.03)`의 극도로 얇은 반투명 레이어를 사용하고 있어, 뒷배경의 네온 앰비언트 라이트가 지나갈 때 본문 회색 텍스트(`text-slate-400`)의 대비율이 WCAG AA 기준(4.5:1) 아래로 일시 저하됨.
  - `3D_ minesweeper`의 HUD 및 안내창도 3D 큐브 배경이 회전할 때 흰색/회색 텍스트 시인성이 저하됨.
- **개선안**:
  - `index.html` `.glass-card` 배경을 `rgba(15, 23, 42, 0.65)` ~ `rgba(30, 41, 59, 0.5)`로 조정하여 카드 영역의 배경 명도를 안정화하고, 텍스트에 부드러운 텍스트 섀도우를 추가하여 야외 직사광선 아래에서도 또렷하게 읽히도록 개선.

### 2) 모바일 GPU 렌더링 부하 최적화
- **문제점**:
  - `index.html`에서 3개의 거대한 `filter: blur(100px)` 레이어가 무한 CSS float 애니메이션으로 움직이고 있으며, 그 위에 각 카드가 `backdrop-filter: blur(16px)`를 동시에 연산함.
  - 저사양 모바일 기기(아이폰 구형 모델 및 보급형 안드로이드)에서 복합 블러 필터로 인한 스크롤 시 프레임 레이트 저하(Jank)가 발생할 수 있음.
- **개선안**:
  - 앰비언트 라이트 요소에 `will-change: transform; transform: translateZ(0);` 하드웨어 가속 힌트 부여.
  - 모바일 뷰(`@media (max-width: 640px)`)에서는 블러 반경을 `blur-[60px]`로 축소하고, 카드의 `backdrop-filter`를 `blur(10px)`로 최적화.

---

## 6. 공통 내비게이션(포털 복귀 홈 버튼) 설계

### 1) 현황
- 메인 포털에서 게임으로 이동한 후 메인 포털로 돌아올 수 있는 UI 버튼이 10개 중 9개 게임에 전무함 (`robot`의 11단계 수료식에만 존재).
- 모바일 PWA 환경이나 브라우저 주소창/내비게이션이 숨겨진 전체화면 웹앱 모드에서 심각한 사용자 고립 현상 발생.

### 2) 표준 플로팅 홈 버튼 컴포넌트 설계안
- **위치**: 좌측 상단 (`top: max(0.75rem, env(safe-area-inset-top)); left: max(0.75rem, env(safe-area-inset-left));`)
- **스타일**:
  ```html
  <a href="../../index.html" class="fixed z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-lg transition-all active:scale-95 min-h-[44px]" style="top: max(0.75rem, env(safe-area-inset-top)); left: max(0.75rem, env(safe-area-inset-left));" aria-label="메인 포털로 돌아가기">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
      <span>홈</span>
  </a>
  ```

---

## 7. R2 모바일 반응형 및 Safe-Area 최적화 구체적 수정 제안표

| 대상 파일 | 수정 항목 | 구체적 CSS / Tailwind / HTML 변경안 |
| :--- | :--- | :--- |
| **모든 HTML 파일 공통** | Viewport Meta 태그 | `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` 전수 적용 |
| **모든 게임 HTML 파일 공통** | 공통 홈 버튼 | 좌상단 Safe-Area 대응 고정형 포털 복귀 버튼(`floating-home-btn`, 최소 44px) 추가 |
| `index.html` | Safe-Area 패딩 | `body`에 `padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));` 적용 |
| `index.html` | 소형 화면 타이틀 & 카드 | `h1`을 `text-3xl sm:text-6xl md:text-7xl`로 반응형 조정, `.thumb-container`를 `w-12 h-12 sm:w-24 sm:h-24`로 모바일 압축 완화 |
| `3D_ minesweeper/style.css` | 모드 버튼 터치 크기 & Safe-Area | `#ui-layer`에 Safe-Area 패딩 적용 (`padding: max(0.5rem, env(safe-area-inset-*))`). `.mode-btn`에 `min-height: 44px; padding: 0.6rem 0.2rem;` |
| `choi_circle/index.html` | 모달/궤도 고정폭 제거 | `#truth-alert`에 `width: min(92vw, 500px); max-height: 85vh;`, `.giant-circle`에 `width: min(70vw, 300px); height: min(70vw, 300px);`, 궤도 반지름 동적 계산 |
| `maze_escape/style.css` | 패딩 및 타이틀 축소 | `#instructions`, `.win-panel` 패딩을 `2rem 1rem`으로 축소, `h1`을 `clamp(1.8rem, 8vw, 3.5rem)`로 가변 처리 |
| `sign_up_for_hell/index.html` | 돌출 그림자 & 버튼 크기 | `#main-box` 너비를 `w-[calc(100%-1.5rem)]`, 그림자 오프셋 모바일 완화(`shadow-[8px_8px_0px_...]`). STOP 버튼에 `min-h-[44px]` 적용 |
| `slime_jump/index.html` | 버튼 터치 크기 & Safe-Area | `#startBtn`, `#restartBtn`에 `py-3 px-8 min-h-[44px]`, `#ui-layer`에 Safe-Area 인셋 반영 |
| `toto/style.css` & `index.html` | 하단 슬립 바 Safe-Area | `#mobile-slip-bar`에 `padding-bottom: env(safe-area-inset-bottom); height: calc(60px + env(safe-area-inset-bottom));`, 바텀시트 Safe-Area 패딩 추가 |
| `hacking/style.css` & `index.html` | 퀵 커맨드 바 & 반응형 | 하단에 `min-h-[44px]` 크기의 모바일 터치 커맨드 바(`ls`, `cat`, `help`, `clear`) 추가 |
