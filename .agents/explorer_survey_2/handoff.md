# Handoff Report — Survey 2: Mobile Responsiveness & Safe-Area Investigation

- **작성자**: `teamwork_preview_explorer` (Survey 2)
- **작성일시**: 2026-08-17T12:56:00+09:00
- **수신자**: `parent` (teamwork_preview_orchestrator / 98b025c6-2b0b-4c55-a410-1e2e46c476a1)
- **핸드오프 유형**: Hard Handoff (조사 임무 완료)

---

## 1. Observation (직접 관찰 결과)

1. **Viewport Meta 태그 전수 점검**:
   - `index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (`viewport-fit=cover` 미지정)
   - `game/3D_ minesweeper/index.html:6-7`: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` (지정됨)
   - `game/Magnetic_Orbit/index.html:6-7`: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` (지정됨)
   - `game/choi_circle/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (`viewport-fit=cover` 미지정)
   - `game/hacking/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (`viewport-fit=cover` 미지정)
   - `game/maze_escape/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` (`viewport-fit=cover` 미지정)
   - `game/robot/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` (`viewport-fit=cover` 미지정)
   - `game/shadow_puzzle/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` (`viewport-fit=cover` 미지정)
   - `game/sign_up_for_hell/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (`viewport-fit=cover` 미지정)
   - `game/slime_jump/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` (`viewport-fit=cover` 미지정)
   - `game/toto/index.html:6`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (`viewport-fit=cover` 미지정)

2. **Safe-Area CSS (`env(safe-area-inset-*)`) 전수 점검**:
   - `game/Magnetic_Orbit/style.css:29-34`:
     ```css
     .safe-padding {
         padding-top: env(safe-area-inset-top, 1rem);
         padding-bottom: env(safe-area-inset-bottom, 1rem);
         padding-left: env(safe-area-inset-left, 1rem);
         padding-right: env(safe-area-inset-right, 1rem);
     }
     ```
   - 이외 메인 포털(`index.html`) 및 9개 하위 게임 프로젝트 CSS/HTML에는 `env(safe-area-inset-*)`가 전혀 정의되어 있지 않음 (grep 검색 결과 0건).

3. **320px~480px 소형 모바일 레이아웃 및 오버플로우 요인**:
   - `game/choi_circle/index.html:242`: `#truth-alert { width: 500px; }` (500px 고정 너비로 320px 화면 초과 및 가로 스크롤/잘림)
   - `game/choi_circle/index.html:78, 127`: `.giant-circle { width: 300px; height: 300px; }` (pulse scale 1.1 시 330px로 320px 초과), `.orbit-text { width: 400px; height: 400px; }` (지름 400px 고정으로 좌우 잘림)
   - `game/maze_escape/style.css:33, 47, 224`: `#instructions { padding: 50px 60px; }` (좌우 패딩 120px 소모), `h1 { font-size: 3.5rem; }` (56px "MAZE RUNNER" 11자 오버플로우), `.win-panel { padding: 60px 80px; }` (좌우 패딩 160px 소모)
   - `game/sign_up_for_hell/index.html:32`: `#main-box`에 `shadow-[20px_20px_0px_rgba(0,0,255,0.5)]` 적용으로 우측 20px 그림자가 320px 화면을 뚫고 나가 가로 스크롤 발생
   - `index.html:124, 147`: 헤더 `text-4xl` 및 썸네일 `thumb-container (w-16 h-16)` + 내부 패딩으로 320px에서 텍스트 가용 너비가 160px로 협소해짐

4. **터치 타겟(44px * 44px) 크기 미달 요소**:
   - `game/3D_ minesweeper/style.css:460`: `.mode-btn { padding: 0.5rem 0.1rem !important; font-size: 0.75rem !important; }` → 렌더링 높이 약 32px
   - `game/slime_jump/index.html:65, 97`: `#startBtn`, `#restartBtn`의 `px-6 py-2 text-base` → 렌더링 높이 약 36px
   - `game/sign_up_for_hell/index.html:56, 147`: `#btn-year` 등 STOP 버튼 `py-1 text-sm` → 약 28px, `#btn-yes` `py-2 text-sm` → 약 36px
   - `game/toto/index.html:356`: 칩 퀵 입력 버튼 `text-[10px] py-1` → 약 26px

5. **공통 홈 버튼 (포털 복귀 내비게이션) 부재**:
   - `index.html`을 제외한 10개 게임 중 `robot`(11단계 수료식)을 제외한 9개 게임 전체에 메인 포털 복귀 버튼이 전무함.

---

## 2. Logic Chain (추론 과정)

1. **[Observation 1, 2] → Safe-Area 결여로 인한 모바일 UI 훼손**:
   - 최신 모바일 기기(iOS Safari Notch/Dynamic Island, 하단 Home Indicator)는 상단 약 44~59px, 하단 약 34px의 시스템 영역을 차지함.
   - `viewport-fit=cover`가 없으면 레터박스가 발생하거나, 반대로 safe-area padding이 없으면 상단 HUD(타이머, 점수, 헤더)와 하단 컨트롤 버튼(모드 버튼, 슬립 바, 액션 버튼)이 시스템 UI와 겹쳐 터치 오작동 및 시각적 잘림이 필연적으로 발생함.

2. **[Observation 3] → 320px 고정 픽셀 및 과도한 패딩으로 인한 가로 스크롤/잘림**:
   - CSS에 `width: 500px`, `padding: 60px 80px`, `font-size: 3.5rem` 등 고정 단위가 하드코딩된 경우, 320px~480px 화면에서 컨테이너 가용 너비를 즉시 초과함.
   - 이로 인해 모바일에서 의도치 않은 가로 스크롤(`overflow-x`)이나 중요한 버튼 및 텍스트가 화면 밖으로 밀려나 사용자 조작이 불가능해짐.

3. **[Observation 4] → 터치 타겟 44px 미달로 인한 인터랙션 피로도**:
   - WCAG 2.1 및 Apple HIG에 따르면 모바일 터치 타겟의 최소 권장 크기는 44px * 44px임.
   - 26px~36px 크기의 버튼은 모바일 엄지손가락 터치 시 빗맞거나 주변 요소를 오터치할 확률이 급격히 증가하므로 패딩 확장(`py-3` 이상) 및 `min-height: 44px` 강제가 필수적임.

4. **[Observation 5] → 내비게이션 부재로 인한 사용자 고립**:
   - 사용자가 모바일 브라우저 PWA 또는 전체화면 모드로 게임에 진입했을 때 홈 버튼이 없으면 메인 포털로 돌아갈 수 없으므로, 모든 하위 페이지에 일관된 플로팅 홈 버튼을 좌상단 Safe-Area와 함께 배치해야 함.

---

## 3. Caveats (한계 및 가정 사항)

1. **Read-only 조사 원칙 준수**: 본 조사는 소스 코드를 직접 수정하지 않고 정적 분석 및 구조 진단만을 수행하였습니다. 실제 픽셀 단위 렌더링 검증은 Implementer 에이전트의 구현 및 후속 테스트 단계에서 브라우저 디바이스 툴로 확인되어야 합니다.
2. **단말별 Safe-Area Inset 차이**: Safe-Area 크기는 iPhone 모델별, Android 제조사 펀치홀 위치별로 상이하므로 고정 픽셀이 아닌 CSS `env(safe-area-inset-*, fallback)` 함수 및 `max()` 함수 조합을 필수로 사용해야 합니다.

---

## 4. Conclusion (최종 진단 및 권고사항)

- **핵심 결론**: '승민\'s 실험실' 웹사이트는 데스크톱 중심의 고정 픽셀, 누락된 `viewport-fit=cover` 및 `env(safe-area-inset-*)`, 44px 미만의 소형 터치 버튼, 홈 내비게이션 부재로 인해 모바일(320px~480px) 환경에서 심각한 사용성 저하를 겪고 있습니다.
- **R2 최적화를 위한 필수 조치 4단계**:
  1. **전수 Viewport 및 Safe-Area 적용**: 모든 HTML에 `viewport-fit=cover` 추가 및 주요 컨테이너에 `padding: max(..., env(safe-area-inset-*))` 적용.
  2. **320px 대응 반응형 유동 레이아웃 전환**: `choi_circle`, `maze_escape`, `sign_up_for_hell`의 고정 픽셀(`500px`, `3.5rem`, 돌출 그림자 등)을 `min(vw, px)` 및 `clamp()`로 가변 처리.
  3. **44px 터치 타겟 확보**: 3D 지뢰찾기 하단 버튼, 슬라임 점프 버튼, 날씨 토토 버튼, 룰렛 STOP 버튼에 `min-h-[44px]` 및 터치 패딩 증대.
  4. **표준 플로팅 홈 버튼 전수 삽입**: 모든 10개 하위 게임 좌상단에 Safe-Area 인셋을 고려한 반투명 글래스 홈 버튼(`🏠 홈`) 일괄 제공.

상세 분석 내용 및 코드 수정 제안표는 `.agents/explorer_survey_2/analysis.md`에 상세히 기록되어 있습니다.

---

## 5. Verification Method (독립 검증 방법)

1. **Viewport & Safe-Area 검증**:
   - `grep_search`로 모든 `.html` 파일의 `<meta name="viewport">` 내 `viewport-fit=cover` 포함 여부 확인.
   - `grep_search`로 각 `.css` 및 `.html` 파일의 `env(safe-area-inset-top)` / `bottom` / `left` / `right` 적용 여부 확인.
2. **320px~480px 화면 반응형 검증**:
   - 브라우저 개발자 도구(Device Mode)에서 화면 너비를 320px(iPhone SE), 360px(Galaxy S20), 390px(iPhone 14/15)로 설정하고 가로 스크롤(`document.documentElement.scrollWidth > window.innerWidth`) 발생 여부 확인.
3. **터치 타겟 높이 검증**:
   - 개발자 도구 요소 검사(Inspect Element)로 `.mode-btn`, `#startBtn`, STOP 버튼 등의 `getBoundingClientRect().height`가 44px 이상인지 확인.
4. **홈 버튼 내비게이션 검증**:
   - 각 하위 게임 페이지에서 좌상단 홈 버튼 클릭 시 루트 `index.html`로 정상 이동하는지 확인.
