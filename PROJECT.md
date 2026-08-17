# Project: SPTI 결과 카드 이미지 저장 및 3D 씬 조명/뷰포트 비율 전면 개선

## Architecture
- **Tech Stack**: Pure Static Web (HTML5, Vanilla JavaScript ES6+, CSS3, Tailwind CSS CDN, Three.js r128 WebGL CDN).
- **Core Module**: `game/shadow_puzzle/`
  - `game/shadow_puzzle/index.html`: 게임 캔버스, UI 오버레이, SPTI 결과지 모달, 플로팅 공유 바, 모바일 고화질 이미지 저장 롱프레스 모달 UI
  - `game/shadow_puzzle/script.js`: Three.js 3D 렌더링(조명, 카메라, 큐브 회전, 그림자 투영), 13개 퍼즐 레벨 및 클리어 판정, SPTI 8대 동물 성향 진단서 고화질 2D Canvas 생성, 모바일 인앱 브라우저 감지 및 Web Share API / 롱프레스 모달 연동
  - `game/shadow_puzzle/style.css`: 캔버스 터치 제스처, 모달 레이아웃 및 롱프레스 터치 최적화 스타일
- **Test Infrastructure**: `tests/run_all_tests.js` (4-Tier E2E 테스트 러너, 214개 Assertions), `tests/verify_shadow_puzzle.js`, `tests/verify_spti_distribution.js`, `tests/verify_zero_distortion.js`, `tests/challenge_r1_adversarial_suite.js`, `tests/verify_challenger2_viewport_r2.js`

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| F1 | 모바일 인앱 브라우저 감지 및 가짜 알림 차단 | Instagram, KakaoTalk, FB, Naver, Line, TikTok 인앱 웹뷰 감지 시 `<a download>` 호출 및 "다운로드되었습니다" 허위 알림 차단 | M1 | ORIGINAL_REQUEST R1 | DONE |
| F2 | 고화질 롱프레스 이미지 저장 모달 직결 | 모바일 인앱 브라우저에서 [이미지 저장] 터치 시 즉시 1080x1920 고화질 롱프레스 저장 풀스크린 뷰어 모달 호출 | M1 | ORIGINAL_REQUEST R1 | DONE |
| F3 | Web Share API 안전 연결 | 모바일 네이티브 브라우저 환경에서 `navigator.canShare({ files })`를 통한 시스템 사진 저장 시트 호출 및 취소(AbortError) 시 안전 처리 | M1 | ORIGINAL_REQUEST R1 | DONE |
| F4 | 데스크톱 브라우저 다운로드 보존 | 데스크톱 환경에서는 기존 `<a download>` 직접 다운로드 및 정상 완료 토스트 유지 | M1 | ORIGINAL_REQUEST R1 | DONE |
| F5 | 3D 씬 조명 밝기 및 선명도 대폭 상향 | ambientLight(1.15), directionalLight(2.50), fillLight(1.20), rimLight(0.95), wallMaterial(0x2a3854) 상향으로 화사하고 선명한 렌더링 | M2 | ORIGINAL_REQUEST R2 | DONE |
| F6 | 카메라 거리 Z=30, 블록 0.82, 쿼터뷰 각도 복원 | 카메라 Z=30 복원, blockSize=0.82 복원, 쿼터뷰 시점(16, 12, 30)으로 꽉 찬 화면 구도 제공 | M2 | ORIGINAL_REQUEST R2 | DONE |
| F7 | 3D 큐브 및 정답 그림자 분리 & 좌우 40px 안전 여백 | 세로 모바일 basePuzzlePos.x=-0.8, baseFov=49(46~58 clamp) 적용으로 320px~430px 전 기종 겹침 0px 및 좌/우 40px+ 안전 여백 보장 | M2 | ORIGINAL_REQUEST R2 | DONE |
| F8 | 전체 E2E 회귀 테스트 및 무결성 검증 | 기존 214개 어서션 및 신규 R1/R2 검증 스위트 전원 통과, Forensic Audit 무결성 통과 | M3 | System Verification | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | R1. 모바일 인앱 브라우저 이미지 저장 모달 및 Web Share 연동 | `game/shadow_puzzle/script.js` (Lines 1649~1741), `game/shadow_puzzle/index.html` (Lines 498~518) | none | DONE |
| M2 | R2. 3D 씬 조명 밝기 및 뷰포트/블록 비율 정상화 | `game/shadow_puzzle/script.js` (Lines 684~717, Lines 821~851, Line 932) | none | DONE |
| M3 | E2E 통합 검증 & Forensic Audit | `tests/` 신규 테스트 추가 및 4-Tier 전체 러너 실행, 정적 무결성 감사 | M1, M2 | DONE |

## Code Layout & Write Ownership
- **Worker 1 (M1 & M2 Implementation)**:
  - `game/shadow_puzzle/index.html` (모달 UI & 스타일 터치 설정)
  - `game/shadow_puzzle/script.js` (Lines 680~720: 조명/벽면 재질, Lines 820~860: `adjustLayoutForScreen`, Line 930~940: `blockSize`, Lines 1640~1750: `downloadShareCard`, `openImageSaveModal`)
- **Reviewer / Challenger / Auditor**:
  - Independent validation, adversarial suites (`tests/challenge_r1_adversarial_suite.js`, `tests/verify_challenger2_viewport_r2.js`, `tests/forensic_audit_suite.js`), and approval.
