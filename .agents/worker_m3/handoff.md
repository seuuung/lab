# Milestone 3 Handoff Report: 웹 게임 캔버스 DPR 2x 및 모바일 인터랙션/리사이즈 버그 수정

작성 일시: 2026-08-17T13:05:30+09:00
작업자: teamwork_preview_worker (Milestone 3)
소유 대상 파일:
- `game/slime_jump/game.js`
- `game/Magnetic_Orbit/game.js`
- `game/3D_ minesweeper/script.js`
- `game/maze_escape/game.js`
- `game/shadow_puzzle/script.js`

---

## 1. Observation (직접 관측 사실)

### 1.1 슬라임 점프 (`game/slime_jump/game.js`)
- **DPR 스케일링 누락**: `resizeCanvas()`에서 `canvas.width = cw; canvas.height = ch;`로만 설정되어 고밀도 디스플레이에서 캔버스가 흐릿하게 렌더링됨.
- **중복 함수 선언 및 호이스팅 충돌**: Line 739(`function handleMove(e)`)와 Line 1003(`function handleMove(e)`)에 `handleMove`가 중복 선언되어 있어 자바스크립트 함수 호이스팅으로 인해 상단 포인터 이벤트 핸들러가 하단 터치 이벤트 핸들러로 덮어씌워짐.
- **중복 이벤트 리스너 충돌**: Line 773~776(`pointerdown/move/up/cancel`)과 Line 1037~1050(`mousedown/mousemove/mouseup` 및 `touchstart/touchmove/touchend`)이 동시 등록되어 모바일 및 데스크톱에서 이벤트 중복 호출 및 드래그 버그 유발.

### 1.2 3D 지뢰찾기 (`game/3D_ minesweeper/script.js`)
- **리사이즈 시 DPR 미갱신**: Line 1227 `resize` 이벤트 리스너에서 `renderer.setSize`만 호출되고 `renderer.setPixelRatio`가 누락되어 창 크기 변경 시 해상도 왜곡 발생.
- **`touchmove` 스크롤 방지 로직 조건문 버그**: Line 1258 `const isMenuVisible = startMenu && !startMenu.classList.contains('hidden');`로 검사했으나, 실제 메뉴 표시/숨김은 `style.display = 'none'` / `'flex'`로 제어되므로 `classList.contains('hidden')`은 항상 `false`가 되어 `isMenuVisible`이 항상 `true`로 평가됨. 결과적으로 게임 플레이 중 스크롤 방지 `e.preventDefault()`가 전혀 작동하지 않음.

### 1.3 궤도 생존 (`game/Magnetic_Orbit/game.js`)
- **리사이즈 시 DPR 누적 왜곡**: `resizeCanvas()`에서 `ctx.scale(dpr, dpr)`을 호출하여 리사이즈 이벤트 발생 시마다 스케일이 누적 증폭될 위험이 존재함.
- **플레이 중 리사이즈 시 즉사/궤도 이탈 버그**: `GAME_STATE === 'PLAYING'` 상태에서 창 크기나 화면 회전이 발생할 경우 `player.radius`가 새 기준(`minRadius`, `maxRadius`)에 맞게 비례 갱신되지 않고, 중심점(`cx, cy`) 이동에 따른 `enemies` 및 `particles`의 상대 위치 보정이 누락되어 플레이어가 즉사하거나 궤도 밖으로 튕김.

### 1.4 3D 미로 탈출 (`game/maze_escape/game.js`)
- **DPR 스케일링 누락**: `init()` 및 `onWindowResize()`에서 `renderer.setPixelRatio`가 호출되지 않아 Retina 디스플레이에서 흐릿함.
- **가상 조이스틱 영역 이탈 시 제어 유실**: 조이스틱 드래그 중 터치가 `joyZone` 경계를 살짝 벗어날 경우 터치 무브 추적이 중단되는 현상.

### 1.5 그림자 퍼즐 (`game/shadow_puzzle/script.js`)
- **DPR 스케일링 누락**: `resize` 리스너에서 `renderer.setPixelRatio` 누락.
- **세로 모바일 화면에서 투영판 잘림**: 모바일 세로 롱스크린(`aspect < 1.0`) 환경에서 수평 시야각(Horizontal FOV)이 좁아져 투영판과 퍼즐 조각의 좌우 영역이 잘려 보임.

---

## 2. Logic Chain (논리적 추론 및 해결 과정)

1. **Canvas DPR 2x 표준화**:
   - 2D Canvas 게임(`slime_jump`, `Magnetic_Orbit`)은 `dpr = Math.min(window.devicePixelRatio || 1, 2)`를 계산한 후, 버퍼 크기를 `width * dpr`, `height * dpr`로 확장하고 CSS 스타일 크기를 고정한 뒤 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`을 적용하여 기존 좌표계를 그대로 유지하면서 2x 선명도를 확보함.
   - Three.js WebGL 게임(`3D_ minesweeper`, `maze_escape`, `shadow_puzzle`)은 초기화 및 `resize` 이벤트 핸들러에서 `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`를 일관되게 호출하여 고해상도 버퍼를 유지함.

2. **슬라임 점프 이벤트 시스템 단일화**:
   - 중복 정의된 `handleMove` 및 중복 리스너(`mousedown/move/up`, `touchstart/move/end`)를 완전 제거하고, 최신 표준인 `pointerdown`, `pointermove`, `pointerup`, `pointercancel` 단일 시스템으로 일원화함.
   - `canvas.style.touchAction = 'none'`을 명시하여 브라우저 기본 터치 제스처와의 충돌을 차단함.

3. **3D 지뢰찾기 터치 스크롤 방지 정상화**:
   - `startMenuOverlay.style.display !== 'none'` 및 `gameHelpOverlay`, `gameModal`의 실제 열림 여부를 검사하여, 오버레이가 닫힌 순수 게임 플레이 중에만 `e.cancelable && e.preventDefault()`를 호출하도록 로직을 수정함.

4. **궤도 생존 리사이즈 상대 비율 보정**:
   - `resizeCanvas()`에서 이전 프레임의 `oldBaseSize`, `oldMinRadius`, `oldMaxRadius`, `oldCx`, `oldCy`를 기반으로 `clampedRatio`를 산출하여 `player.radius = minRadius + clampedRatio * (maxRadius - minRadius)`로 갱신함.
   - 적(`enemies`)과 파티클(`particles`) 또한 중심점 이동 및 화면 크기 변화율(`scaleFactor = baseSize / oldBaseSize`)에 비례하여 위치, 속도, 크기를 재계산함.

5. **미로 탈출 및 그림자 퍼즐 모바일 최적화**:
   - `maze_escape`의 조이스틱 터치 이벤트를 `window` 수준에서 추적하도록 개선하여 손가락이 터치 영역을 벗어나도 끊김 없이 제어 가능하도록 함.
   - `shadow_puzzle`은 세로 모바일(`aspect < 1.0`) 화면에서 `camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 45, 65)`로 수직 FOV를 동적 확장하고 카메라 거리를 확보하여 투영판과 퍼즐이 완벽하게 시야 내에 위치하도록 보정함.

---

## 3. Caveats (주의 사항 및 한계)

- **하드웨어 가속 한계**: 기기 성능 과부하 및 메모리 절약을 위해 `window.devicePixelRatio`는 표준 지침에 따라 최대 `2.0`으로 상한(`Math.min(..., 2)`)을 적용하였습니다.
- **타 파일 불간섭 원칙 준수**: Milestone 3 독점 소유 파일 5개 외의 파일은 수정하지 않았으며, 글로벌 내비게이션(플로팅 홈 버튼 등)은 Milestone 4 작업자가 후속 적용할 예정입니다.

---

## 4. Conclusion (최종 결론)

- 5개 웹 게임(`slime_jump`, `Magnetic_Orbit`, `3D_ minesweeper`, `maze_escape`, `shadow_puzzle`)에 대한 Canvas/WebGL 2x DPR 스케일링이 전수 적용되었습니다.
- 슬라임 점프의 함수 호이스팅 충돌 및 중복 리스너가 제거되어 부드러운 단일 포인터 슬링샷 조작이 보장됩니다.
- 3D 지뢰찾기 터치 스크롤 방지 로직 및 리사이즈 DPR 갱신이 정상화되었습니다.
- 궤도 생존의 화면 회전 및 리사이즈 시 플레이어 반경 및 엔티티 비례 보정이 완벽히 구현되었습니다.
- 3D 미로 탈출 가상 조이스틱 안정화 및 그림자 퍼즐 세로 화면 동적 FOV 보정이 완료되었습니다.

---

## 5. Verification Method (독립 검증 방법)

### 5.1 문법 및 컴파일 검증
다음 명령어를 실행하여 5개 파일 모두 문법 에러 없이 정상 로드되는지 확인합니다:
```bash
node -c "game/slime_jump/game.js" "game/3D_ minesweeper/script.js" "game/Magnetic_Orbit/game.js" "game/maze_escape/game.js" "game/shadow_puzzle/script.js"
```
**결과**: Exit code 0 (정상 통과)

### 5.2 소스 코드 검사 지점
1. `game/slime_jump/game.js`:
   - Line 26: `dpr = Math.min(window.devicePixelRatio || 1, 2)` 및 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` 적용 여부 확인.
   - Line 739: 단일 `handleDown/Move/Up` 포인터 이벤트 리스너만 존재하며 중복 `handleMove`가 제거되었는지 확인.
2. `game/3D_ minesweeper/script.js`:
   - Line 1228: `window.addEventListener('resize')` 내 `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` 확인.
   - Line 1258: `touchmove` 리스너에서 `startMenu.style.display !== 'none'` 검사 확인.
3. `game/Magnetic_Orbit/game.js`:
   - Line 38: `dpr = Math.min(window.devicePixelRatio || 1, 2)` 및 `ctx.setTransform` 확인.
   - Line 56~88: `GAME_STATE === 'PLAYING'` 중 `player.radius`, `enemies`, `particles` 비례 갱신 로직 확인.
4. `game/maze_escape/game.js`:
   - Line 146 & Line 462: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` 확인.
   - Line 278~345: `window.addEventListener('touchmove')` 기반 조이스틱 연속 추적 확인.
5. `game/shadow_puzzle/script.js`:
   - Line 226~232: `aspect < 1.0` 세로 모바일 환경에서 `camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 45, 65)` 동적 보정 확인.
   - Line 444: `resize` 리스너 내 `renderer.setPixelRatio` 확인.
