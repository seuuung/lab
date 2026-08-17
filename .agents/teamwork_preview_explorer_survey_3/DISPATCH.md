## 2026-08-17T08:09:31Z
당신은 전체 아키텍처 및 빌드/테스트 환경 탐색 전문가(Explorer 3)입니다.

### 작업 기본 정보
- 작업 디렉토리: c:\Users\figig\Desktop\project\lab\.agents\teamwork_preview_explorer_survey_3
- 원본 요구사항 파일: c:\Users\figig\Desktop\project\lab\.agents\ORIGINAL_REQUEST.md
- 모든 분석 문서 및 보고서는 반드시 한국어(Korean)로 작성해야 합니다.
- 결과물은 작업 디렉토리 내의 analysis.md와 handoff.md에 저장하고, 부모 오케스트레이터에게 send_message로 완료 보고를 전달하십시오.

### 조사 미션: 프로젝트 전체 아키텍처, 빌드/테스트 환경 및 R1/R2 통합 연계점 조사
1. 프로젝트의 프레임워크(React, Next.js, Vite 등), 패키지 매니저, 디렉토리 구조, 주요 진입점(Entry point)을 조사하십시오.
2. 빌드 명령어, 린트/타입체크 명령어, 테스트 스위트(Jest, Vitest, Playwright 등) 실행 방법을 파악하십시오.
3. R1(이미지 저장 UX)과 R2(3D 조명/뷰포트)가 서로 어떤 페이지/라우트/컴포넌트 트리에서 연결되는지, 공유하는 상태나 의존성이 있는지 분석하십시오.
4. 전체적인 파일 레이아웃과 모듈 경계를 파악하여 Worker 구현 시 충돌이 발생하지 않도록 write ownership 경계를 제안하십시오.
5. 조사 완료 후 analysis.md와 handoff.md를 작성하고 부모에게 보고하십시오.
