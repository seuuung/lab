# Implementation Plan & Orchestration Plan

## 1. 개요
SPTI 결과 카드 이미지 저장 방식 개선 및 3D 씬 조명/뷰포트 비율 정상화 미션을 완수하기 위한 종합 계획.

## 2. 조사 (Survey) 단계
3명의 Explorer를 병렬로 투입하여 코드베이스 전수 조사:
- **Explorer 1 (R1 전담 - 이미지 저장 UX)**:
  - SPTI 결과 카드 컴포넌트, 이미지 생성 로직(html2canvas, dom-to-image 등), 다운로드 트리거 함수 분석
  - 인앱 브라우저 감지 로직(isKakaoTalk, isInstagram, isMobile 등) 및 Web Share API 지원 현황
  - 풀스크린 이미지 뷰어 모달 구현 위치 및 모바일 롱프레스 저장 최적화 방안
- **Explorer 2 (R2 전담 - 3D 씬 조명 및 렌더링)**:
  - Three.js / R3F / Canvas 씬 내 조명 설정 (Directional, Ambient, Fill, Rim Light 강도 및 위치)
  - 큐브 크기, 카메라 파라미터(FOV, Position Z=30), 쿼터뷰 각도, 반응형 비율
  - 우측 정답 그림자(Shadow projection) 및 좌/우 40px 안전 여백 구조 분석
- **Explorer 3 (빌드/테스트 환경 및 전체 아키텍처)**:
  - 프로젝트 패키지 매니저(npm/pnpm/yarn), 빌드 스크립트, 테스트 스위트 구조
  - TypeScript 에러, 린트, 번들 설정 파악

## 3. 구현 (Implementation) 단계
- Worker를 투입하여 R1과 R2 변경사항을 정밀하게 적용
- R1: 인앱 브라우저 감지 + Web Share API + 모바일 전용 롱프레스 저장 풀스크린 모달 UI/UX 구현
- R2: 3D 씬 조명(Directional, Ambient, Fill, Rim) 밝기 상향, 카메라 Z=30, 블록 0.82, 쿼터뷰 각도, 좌우 40px 안전 여백 설정

## 4. 검증 (Verification) & 게이트 (Gate) 단계
- Reviewer 2명: 코드 품질, 인터페이스 적합성, 기능 완성도 리뷰
- Challenger 2명: 모바일/인앱/데스크톱 다양한 환경 시뮬레이션 및 3D 씬 렌더링 경계 테스트
- Forensic Auditor 1명: 무결성 검증 (하드코딩, 더미 구현 방지)
- Gate 통과 후 최종 Handoff 작성 및 사용자 보고
