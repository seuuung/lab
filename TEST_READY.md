# E2E Test Suite Ready: 승민's 실험실 (Seungmin's Lab)

## 1. 개요
본 문서는 '승민's 실험실' 포털 고도화 및 모바일 최적화 프로젝트를 위한 4-Tier Opaque-box E2E 자동화 테스트 스위트 구축 완료를 선언합니다.
Node.js 내장 표준 라이브러리(`fs`, `path`, `vm`, `assert`)만을 기반으로 구축되어 외부 의존성 없이 즉시 실행 및 검증이 가능합니다.

---

## 2. 테스트 아키텍처 및 커버리지 현황

| Tier | 테스트 파일 | 주요 검증 영역 | 목표 Assertion | 작성된 Assertion |
|:---|:---|:---|:---:|:---:|
| **Tier 1** | `tests/tier1_feature_test.js` | About Me 프로필, 4단계 탭 필터, 11개 카드 전수 존재성, 9개 하위 게임 홈 버튼 및 링크 무결성 | 70+ | **78** |
| **Tier 2** | `tests/tier2_boundary_test.js` | 뷰포트 메타태그(`viewport-fit=cover`), Safe-Area CSS, 320px 모바일 오버플로우 방지, 44px+ 터치 타겟, Canvas/WebGL 2x DPR 및 리사이즈 | 70+ | **84** |
| **Tier 3** | `tests/tier3_pairwise_test.js` | 탭 필터(4종) × 카테고리 필터링 매트릭스, 뷰포트(320/768/1440) × DPR(1/2/3) 매트릭스, 게임 진입/복귀 양방향 내비게이션 결합 | 20+ | **30** |
| **Tier 4** | `tests/tier4_realworld_test.js` | 포털 진입 -> 탭 탐색 -> 9개 게임 각각 플레이 및 캔버스 초기화 -> 홈 복귀 E2E 사용자 여정 시뮬레이션, 404 및 런타임 에러 0건 검증 | 10+ | **22** |
| **합계** | **통합 테스트 러너** | `node tests/run_all_tests.js` | **170+** | **214** |

---

## 3. 테스트 실행 방법

### 전체 테스트 실행
```bash
node tests/run_all_tests.js
```

### 개별 티어별 독립 실행
```bash
node tests/tier1_feature_test.js
node tests/tier2_boundary_test.js
node tests/tier3_pairwise_test.js
node tests/tier4_realworld_test.js
```

---

## 4. 기능 및 인터페이스 검증 상세 (Feature Mapping)

- **F1 (About Me 프로필)**: `index.html` 내 GitHub 링크(`https://github.com/seuuung`), 아바타, 직함, 스택 뱃지, 글래스모피즘 검증
- **F2 (4단계 탭 필터)**: `all`, `app`, `game`, `lab` 탭 버튼, `data-category` 속성 바인딩, 동적 필터링 바닐라 JS 로직 검증
- **F3 ([삭제됨] 삼척 기상토토)**: 삼척 기상토토 (`game/toto`) 카드 및 하위 프로젝트 폴더 삭제 완료 검증
- **F4 (11개 쇼케이스 카드 & UI)**: 11개 프로젝트 카드 전수 존재, `glass-card`, `thumb-container`, 푸터 브랜딩(`© 2026`) 검증
- **F5 & F6 (Safe-Area & 320px 오버플로우 방지)**: `viewport-fit=cover`, `env(safe-area-inset-*)`, 500px 고정폭 제거 및 유동 반응형 검증
- **F7 (44px+ 터치 타겟)**: 탭 버튼, 홈 버튼, 게임별 주요 인터랙션 버튼(START, 캡차 등) 터치 가능 영역 확보 검증
- **F8 ~ F12 (Canvas DPR & 모바일 제어)**: 5개 캔버스/WebGL 게임 DPR 스케일링, 리사이즈 왜곡 보정, 터치 제스처/가상 조이스틱 검증
- **F13 (플로팅 홈 버튼)**: 9개 하위 게임 좌상단 플로팅 Safe-Area 홈 버튼(`../../index.html`) 전수 적용 검증
- **F14 (런타임 무결성)**: 전체 파일 시스템 경로 매핑, 구문 오류(Syntax Error) 0건, 깨진 링크 0건 검증

---

## 5. 결론 및 워커/오케스트레이터 연계
본 테스트 스위트는 `PROJECT.md` 및 `TEST_INFRA.md`의 모든 명세를 충족하도록 설계되었습니다.
마일스톤 M1~M4 구현이 반영됨에 따라 모든 assertion이 점진적·최종적으로 100% Pass 되도록 엄밀하게 판정합니다.
