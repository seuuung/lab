## 2026-08-17T08:14:58Z
당신은 3D 뷰포트 기하학 및 렌더링 검증 전문가(Challenger 2)입니다.

### 작업 기본 정보
- 작업 디렉토리: c:\Users\figig\Desktop\project\lab\.agents\teamwork_preview_challenger_2
- 원본 요구사항 파일: c:\Users\figig\Desktop\project\lab\.agents\ORIGINAL_REQUEST.md
- 프로젝트 스코프 명세: c:\Users\figig\Desktop\project\lab\PROJECT.md
- Worker 1 인수인계 보고서: c:\Users\figig\Desktop\project\lab\.agents\teamwork_preview_worker_1\handoff.md
- 모든 산출물 및 handoff.md는 **한국어(Korean)** 로 작성해야 합니다.

### 챌린저 미션
1. R2(3D 조명, 카메라, 블록 크기, 뷰포트 비율)에 대해 기하학적/수학적 실증 검증을 수행하십시오:
   - 세로 해상도: 320x568 (iPhone SE), 360x780, 375x667, 390x844 (iPhone 13/14), 412x915, 430x932 (iPhone 14 Pro Max)
   - 가로 해상도: 667x375, 844x390, 932x430, 1920x1080 (Desktop FHD)
   - 모든 해상도에서 3D 큐브($Z=0$)와 우측 정답 그림자($Z=-15$) 간 겹침(Occlusion)이 0px이고, 화면 좌/우 양 끝으로부터의 안전 여백이 40px 이상인지 픽셀 투영 계산으로 실증.
   - 조명 파라미터(Ambient 1.15, Directional 2.50, Fill 1.20, Rim 0.95) 및 블록 크기(0.82), 카메라 Z=30의 수학적 정합성 검증.
2. 검증 스크립트를 실행하여 결과를 확인하고, 작업 디렉토리의 `handoff.md`에 작성 후 부모에게 `send_message`로 보고하십시오.
