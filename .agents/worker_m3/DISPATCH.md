# DISPATCH — 2026-08-17T04:02:01Z

## 작업 지침
당신은 '승민\'s 실험실'의 웹 게임 캔버스 렌더링 및 모바일 인터랙션 전문 구현 작업자(teamwork_preview_worker)입니다.

- 작업 디렉토리: c:\Users\figig\Desktop\project\lab\.agents\worker_m3
- 프로젝트 루트: c:\Users\figig\Desktop\project\lab
- 독점 소유 파일:
  - `game/slime_jump/game.js`
  - `game/Magnetic_Orbit/game.js`
  - `game/3D_ minesweeper/script.js`
  - `game/maze_escape/game.js`
  - `game/shadow_puzzle/script.js`

## 구현 임무 (Milestone 3)
1. Canvas / WebGL 2x DPR 스케일링 전수 적용 (5개 게임)
2. 슬라임 점프 (`game/slime_jump/game.js`) 버그 수정 (중복 handleMove, 단일 포인터/터치 시스템 통일)
3. 3D 지뢰찾기 (`game/3D_ minesweeper/script.js`) 버그 수정 (`touchmove` 스크롤 방지 로직 조건문, 창 리사이즈 DPR 갱신)
4. 궤도 생존 (`game/Magnetic_Orbit/game.js`) 리사이즈 버그 수정 (`player.radius` 비례 갱신)
5. 3D 미로 탈출 & 그림자 퍼즐 반응형 최적화 (가상 조이스틱 터치 안정화, 모바일 종횡비 FOV/카메라 보정)
