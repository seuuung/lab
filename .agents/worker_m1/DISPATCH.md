# DISPATCH — 2026-08-17T13:02:01+09:00

당신은 '승민's 실험실'의 포털 UI/UX 고도화 전문 구현 작업자(teamwork_preview_worker)입니다.

## 작업 환경 및 지침
- 작업 디렉토리: c:\Users\figig\Desktop\project\lab\.agents\worker_m1
- 프로젝트 루트: c:\Users\figig\Desktop\project\lab
- 사용자 원본 요청서: c:\Users\figig\Desktop\project\lab\.agents\ORIGINAL_REQUEST.md (반드시 가장 먼저 읽을 것)
- 프로젝트 설계서: c:\Users\figig\Desktop\project\lab\PROJECT.md
- 독점 소유 파일: `c:\Users\figig\Desktop\project\lab\index.html`

## 구현 임무 (Milestone 1)
1. **About Me 프로필 카드 신설**:
   - `index.html` 상단에 개발자 프로필/아바타 영역, 매력적인 자기소개 문구("창의적인 인터랙티브 웹과 모바일 앱을 만듭니다"), GitHub 프로필(`https://github.com/seuuung`) 링크, 기술 스택 뱃지(JavaScript, HTML5/CSS3, Tailwind, Three.js, Canvas 2D 등)를 글래스모피즘 카드로 미려하게 배치.
2. **4단계 카테고리 탭 필터링 시스템 구현**:
   - 탭 버튼: `전체 (All)`, `📱 모바일 앱 (Mobile Apps)`, `🎮 웹 게임 (Web Games)`, `🧪 밈 & 실험실 (Memes & Experiments)`
   - 모든 프로젝트 카드에 `data-category` 속성 부여 (`app`, `game`, `lab`)
   - 바닐라 JS로 부드러운 탭 전환 및 활성 탭 하이라이트/글로우 애니메이션 구현.
3. **'삼척 기상토토' (`game/toto`) 쇼케이스 카드 신규 추가**:
   - `game/toto/index.html`로 연결되는 인터랙티브 쇼케이스 카드 추가 (네온 테마, 태그, 설명 완비).
4. **글래스모피즘 디자인 & 브랜딩 고도화**:
   - `backdrop-filter: blur(16px)`, 은은한 네온/퍼플 보더 글로우, 호버 트랜지션, 반응형 그리드 최적화.
   - 뷰포트 메타 태그에 `viewport-fit=cover` 적용.
   - 푸터 브랜딩을 `© 2026 승민's 실험실 (Seungmin's Lab). All rights reserved.`로 통일.
   - 순수 정적 파일(HTML, Vanilla JS, Tailwind CDN) 구조 엄격 유지.
