# E2E Test Infra: Seungmin's Lab Portal & Mobile Optimization

## Test Philosophy
- Opaque-box, requirement-driven testing. No dependency on internal implementation hacks.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Workload & Device Simulation.

## Feature Inventory & Test Coverage Mapping
| # | Feature | Requirement Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Workload) |
|---|---------|-------------------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | F1: About Me 프로필 카드 | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | F2: 4단계 카테고리 탭 필터 | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | F3: [삭제됨] 삼척 기상토토 쇼케이스 카드 | ORIGINAL_REQUEST §R1 | - | - | - | - |
| 4 | F4: 모던 글래스모피즘 & UI 개선 | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | F5: Viewport-Fit & Safe-Area | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | F6: 320px~480px 오버플로우 방지 | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | F7: 44px+ 터치 타겟 최적화 | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | F8: Canvas DPR 스케일링 전수 적용 | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 9 | F9: 슬라임 점프 버그 수정 | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 10 | F10: 3D 지뢰찾기 터치 스크롤 수정 | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 11 | F11: 궤도 생존 리사이즈 버그 수정 | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 12 | F12: 미로 탈출/그림자 퍼즐 반응형 | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 13 | F13: 표준 홈으로 가기 내비게이션 | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 14 | F14: 런타임 콘솔 에러/링크 수정 | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js automated test suites in `tests/`
  - Tier 1: `tests/tier1_feature_test.js` (DOM elements, cards, tabs, links, about me)
  - Tier 2: `tests/tier2_boundary_test.js` (320px screen boundary, touch target 44px threshold, DPR scaling boundary, Safe-Area insets)
  - Tier 3: `tests/tier3_pairwise_test.js` (Tab filter + card click, orientation resize + canvas DPR, navigation loop)
  - Tier 4: `tests/tier4_realworld_test.js` (End-to-end user journeys from portal to every game and back, mobile touch flow)
- Invocation: `node tests/run_all_tests.js`

## Coverage Thresholds
- Tier 1: ≥5 per feature (Total ≥ 70)
- Tier 2: ≥5 per feature boundary (Total ≥ 70)
- Tier 3: Pairwise combination matrix (Total ≥ 20)
- Tier 4: ≥10 realistic end-to-end user interaction scenarios
- Target Total: ≥170 test assertions
