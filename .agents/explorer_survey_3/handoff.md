# Handoff Report: R3 웹 게임 인터랙션, 모바일 터치 제어 및 캔버스 렌더링 전수 조사

**작성 에이전트**: teamwork_preview_explorer (explorer_survey_3)  
**수신 에이전트**: teamwork_preview_orchestrator (parent / ID: `98b025c6-2b0b-4c55-a410-1e2e46c476a1`)  
**조사 일시**: 2026-08-17  
**작업 모드**: Read-only Investigation  

---

## 1. Observation (직접 관측 사실)

1. **전체 게임 디렉토리 및 파일 현황**:
   - `game/` 디렉토리 내에 총 10개의 게임이 존재함을 확인 (`find_by_name` 결과):
     1. `game/slime_jump` (슬라임 점프 - HTML, CSS, JS)
     2. `game/Magnetic_Orbit` (궤도 생존 - HTML, CSS, JS)
     3. `game/3D_ minesweeper` (3D 지뢰찾기 - HTML, CSS, JS)
     4. `game/maze_escape` (3D 미로 탈출 - HTML, CSS, JS)
     5. `game/shadow_puzzle` (그림자 퍼즐 - HTML, CSS, JS)
     6. `game/toto` (삼척 기상 토토 & 사다리 - HTML, CSS, JS)
     7. `game/choi_circle` (최원형 - HTML)
     8. `game/hacking` (해커 CTF - HTML, CSS, JS)
     9. `game/robot` (로봇 인증 - HTML, CSS, JS)
     10. `game/sign_up_for_hell` (지옥의 회원가입 - HTML, CSS, JS)

2. **슬라임 점프 (`game/slime_jump/game.js`) 코드 관측**:
   - **Line 26~55**: `resizeCanvas()`에서 `canvas.width = cw; canvas.height = ch;`로만 설정되고 `window.devicePixelRatio`가 일절 반영되지 않음.
   - **Line 739 & Line 1003**: `function handleMove(e)`가 동일한 이름으로 2회 중복 선언되어 나중 함수가 앞 함수를 호이스팅으로 덮어씀.
   - **Line 773~776 & Line 1037~1043**: `pointerdown`/`pointermove`/`pointerup`과 `mousedown`/`touchstart`/`touchmove` 이벤트 리스너가 동일 캔버스/윈도우에 이중 등록되어 있음.

3. **3D 지뢰찾기 (`game/3D_ minesweeper`) 코드 관측**:
   - **`script.js` Line 1257~1266**: `const isMenuVisible = startMenu && !startMenu.classList.contains('hidden');` 로 스크롤 방지 여부를 판단하나, `startMenuOverlay`는 인라인 스타일 `display: none / flex`로 제어되므로 `.hidden` 클래스를 갖지 않아 `!isMenuVisible`이 항상 `false`가 됨.
   - **`script.js` Line 36**: 초기화 시 `renderer.setPixelRatio`가 호출되나 `resize` 핸들러(Line 1227)에서는 누락됨.
   - **`index.html` Line 11**: CDN `OrbitControls.js`를 불러오고 있으나 `script.js` Line 41에서 자체 Quaternion 컨트롤러를 구현하여 실제로는 사용되지 않음.

4. **궤도 생존 (`game/Magnetic_Orbit/game.js`) 코드 관측**:
   - **Line 35~61**: `resizeCanvas()`에서 `GAME_STATE === 'PLAYING'`일 때 `player.radius`가 스케일 변경 비율에 맞춰 갱신되지 않아 화면 회전 시 플레이어가 즉사하거나 순간이동함.

5. **3D 미로 탈출 (`game/maze_escape/game.js`) 코드 관측**:
   - **Line 144~146 & Line 461~465**: `renderer = new THREE.WebGLRenderer(...)` 및 `onWindowResize`에서 `renderer.setPixelRatio`가 전혀 호출되지 않아 1x 저해상도로 렌더링됨.

6. **그림자 퍼즐 (`game/shadow_puzzle/script.js`) 코드 관측**:
   - **Line 220~232 & Line 427~432**: `adjustLayoutForScreen`에서 `window.innerWidth < 768` 단일 고정 분기만 존재하여 다양한 종횡비(가로세로 비율)에서 그림자 투영판 모서리가 잘리는 문제 확인.

7. **로봇 인증 (`game/robot/index.html`) 코드 관측**:
   - **Line 294**: `<button onclick="location.href='../../index.html'">홈페이지</button>`로 작성되어 있어 실제 존재하지 않는 상위 경로(404 Not Found)로 이동함.

8. **메인 쇼케이스 포털 (`index.html`) 코드 관측**:
   - `game/toto` 게임에 대한 카드 링크가 누락되어 있음.
   - 10개 웹 게임 전반에 메인 포털로 돌아갈 수 있는 일관된 '홈 버튼' UI가 누락되어 있음.

---

## 2. Logic Chain (추론 및 분석 전개)

1. **[관측 2 기반] 슬라임 점프 입력/렌더링 문제**:
   - 함수명이 중복된 `handleMove`와 이중 등록된 `pointer` vs `touch/mouse` 이벤트로 인해, 모바일 터치 시 포인터 이벤트와 터치 이벤트가 중첩 실행되어 슬링샷 드래그 궤적과 감도가 왜곡됨.
   - DPR 미적용으로 인해 고밀도 디스플레이에서 캔버스 블러 현상이 발생하므로, DPR 2x 스케일링(`ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`) 및 포인터 이벤트 단일화가 필수적임.

2. **[관측 3 기반] 3D 지뢰찾기 터치 스크롤 버그**:
   - `.classList.contains('hidden')` 조건문 오류로 인해 게임 플레이 중 `touchmove`가 방지되지 않아 카메라 회전 시 브라우저 스크롤/새로고침 제스처가 간섭됨. `startMenu.style.display !== 'none'`으로 수정해야 함.

3. **[관측 4 기반] 궤도 생존 리사이즈 버그**:
   - 화면 회전 시 캔버스 물리 스케일(`baseSize`, `minRadius`, `maxRadius`)은 변경되나 현재 플레이어 위치(`player.radius`)가 비례 보정되지 않아 궤도 밖으로 튕김. 궤도 비율 매핑 공식 적용이 필요함.

4. **[관측 5 기반] 3D 미로 탈출 해상도 저하**:
   - `renderer.setPixelRatio` 누락으로 인한 WebGL 캔버스 품질 저하가 확인되었으므로 `Math.min(window.devicePixelRatio, 2)` 설정이 필요함.

5. **[관측 7, 8 기반] 라우팅 및 네비게이션 결함**:
   - `robot`의 `../../index.html` 404 링크 및 `toto` 포털 카드 누락, 전 게임 공통 홈 버튼 부재는 사용자 이동 흐름을 차단하므로 전사적 표준 홈 플로팅 버튼 적용이 요구됨.

---

## 3. Caveats (한계 및 제약 사항)

- 본 조사는 코드 및 에셋에 대한 **Read-only 정적 분석**을 기반으로 수행되었습니다.
- 실제 디바이스(iOS Safari, Android Chrome 등)의 특정 OS 버전별 하드웨어 가속/터치 레이턴시는 추후 구현(Worker) 및 검증(Reviewer) 단계에서 실기기 뷰포트 에뮬레이션 테스트가 수반되어야 합니다.
- `choi_circle`, `sign_up_for_hell` 등 일부 밈(Meme)/개그 게임은 고의적인 인터랙션 방해(도망가는 버튼 등)가 핵심 게임성이므로, 완전한 조작 자동화보다는 모바일 터치 가능성 및 레이아웃 깨짐(Overflow) 방지에 초점을 맞추어야 합니다.

---

## 4. Conclusion (최종 결론 및 액션 플랜)

1. **R3 관점 웹 게임 주요 수정 대상 5대 핵심 과제**:
   - **과제 1**: 2D/3D Canvas 게임 5종(`slime_jump`, `Magnetic_Orbit`, `3D_ minesweeper`, `maze_escape`, `shadow_puzzle`)에 표준 DPR 스케일링(`devicePixelRatio`) 및 화면 회전 시 물리/카메라 보정 로직 전면 적용.
   - **과제 2**: `slime_jump`의 `handleMove` 중복 정의 및 `pointer`/`touch` 리스너 충돌 버그 제거.
   - **과제 3**: `3D_ minesweeper`의 `touchmove` 차단 조건식 교정 및 불필요한 `OrbitControls` CDN 제거.
   - **과제 4**: `game/robot`의 `../../index.html` 404 링크 수정 및 `index.html`에 `game/toto` 카드 등록.
   - **과제 5**: 10개 모든 게임에 Safe Area Top을 준수하는 일관된 "🏠 홈으로" 플로팅 네비게이션 버튼 일괄 탑재.

---

## 5. Verification Method (검증 방법)

1. **상세 분석 문서 확인**:
   - 파일 경로: `c:\Users\figig\Desktop\project\lab\.agents\explorer_survey_3\analysis.md`
2. **코드 위치 및 버그 재현 포인트 검증**:
   - `slime_jump/game.js`: 739행 및 1003행 `handleMove` 중복 확인
   - `3D_ minesweeper/script.js`: 1258행 `!startMenu.classList.contains('hidden')` 로직 확인
   - `Magnetic_Orbit/game.js`: 56행 `resizeCanvas` 내 `GAME_STATE === 'PLAYING'` 시 `player.radius` 미갱신 확인
   - `maze_escape/game.js`: 144행 `renderer.setPixelRatio` 부재 확인
   - `robot/index.html`: 294행 `location.href='../../index.html'` 404 경로 확인
3. **무효화 조건 (Invalidation Conditions)**:
   - 해당 파일의 라인 번호가 이미 수정되었거나 대상 파일이 이동된 경우 재스캔 필요.
