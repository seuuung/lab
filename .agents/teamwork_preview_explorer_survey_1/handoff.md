# 인수인계 보고서 (Handoff Report) — Explorer 1

## 1. Observation (관측 사실)

### 1.1 주요 파일 및 라인별 구현 현황
- **SPTI 결과지 모달**: `game/shadow_puzzle/index.html` (Lines 261 ~ 417, `#ending-modal`)
  - 완주 시 8대 동물 성향 캐릭터, 4대 공간 지각 능력치, 특징 리스트, 궁합 표시.
- **플로팅 공유 바**: `game/shadow_puzzle/index.html` (Lines 419 ~ 453, `#result-float-bar`)
  - 이름 입력(`#player-name-input`), 이미지 저장 버튼(`#download-card-btn`), 링크 복사 버튼(`#copy-story-btn`), 상태 메시지(`#share-status-msg`).
- **모바일 이미지 저장 모달**: `game/shadow_puzzle/index.html` (Lines 498 ~ 518, `#image-save-modal`)
  - 고화질 미리보기 이미지(`<img id="save-preview-img">`) 및 닫기 버튼(`<button id="close-image-modal">`).
  - 안내 문구: "이미지를 1초간 길게 눌러 [사진에 저장]하세요".
- **고화질 캔버스 생성기**: `game/shadow_puzzle/script.js` (Lines 1288 ~ 1485, `generateBackgroundMasterCanvas`)
  - 외부 라이브러리(html2canvas 등) 없이 순수 HTML5 2D Canvas로 1080x1920 해상도 카드 렌더링.
  - 전역 변수 `cachedMasterCanvas`에 저장.
- **이미지 다운로드/공유 핸들러**: `game/shadow_puzzle/script.js` (Lines 1649 ~ 1724, `downloadShareCard`)
  - Lines 1686~1701: `navigator.share({ files: [file] })` 시도
  - Lines 1704~1716: `<a download>` 생성 및 `link.click()` 강제 실행
  - Lines 1719~1722: `const isAppWebView = /Instagram|FB|KAKAOTALK|NAVER|Line/i.test(navigator.userAgent); if (isAppWebView) openImageSaveModal(...)`
- **모달 열기/닫기**: `game/shadow_puzzle/script.js` (Lines 1726 ~ 1741, `openImageSaveModal`, `closeImageSaveModal`)
- **이벤트 바인딩**: `game/shadow_puzzle/script.js` (Lines 1978 ~ 2002)

---

## 2. Logic Chain (논리 전개)

1. **관측 1.1 (`script.js:1704-1722`)에 근거한 문제점**:
   - 현재 `downloadShareCard()`는 `navigator.share` 실패 후 데스크톱/모바일 구분 없이 무조건 `link.click()`을 트리거한 뒤, 그 아래에서 `isAppWebView` 조건을 확인하여 모달을 띄우는 후행(Post-fallback) 구조입니다.
2. **모바일 인앱 브라우저(카카오톡, 인스타그램, 페이스북, 네이버 등)의 특성**:
   - iOS WKWebView 및 안드로이드 웹뷰 환경에서는 `<a download>` 속성이 지원되지 않거나 무시되며, 일부 브라우저는 흰 화면 이동 또는 먹통 현상을 초래합니다.
   - 따라서 인앱 브라우저에서는 `link.click()`을 호출하는 것 자체가 비정상적인 가짜 다운로드 시도입니다.
3. **분기 순서의 정상화 필요성**:
   - 1순위: 인앱 브라우저(`isInApp`)인 경우, 가짜 다운로드 시도 없이 즉시 `openImageSaveModal(dataUrl)`을 띄워 유저가 길게 눌러 갤러리에 저장하도록 유도.
   - 2순위: 모바일 네이티브 브라우저(`isMobile`)인 경우, `navigator.canShare({ files })`를 통해 Web Share API를 시도하고, 실패 시 모달로 안전하게 fallback.
   - 3순위: 데스크톱 브라우저인 경우에만 `<a download>`를 통한 직접 다운로드 및 완료 토스트를 출력.
4. **허위 알림 차단**:
   - 모바일 환경에서 다운로드가 실제 완료되지 않았음에도 "다운로드되었습니다" 알림을 표시하면 사용자가 저장이 완료된 것으로 오인하고 이탈하므로, 모바일에서는 알림 대신 명확한 롱프레스 안내 모달을 제공해야 합니다.

---

## 3. Caveats (주의 사항 및 한계)

- **iOS 사파리/웹뷰의 CSS 상속 이슈**:
  - `body` 태그에 지정된 `touch-none`, `select-none` 클래스가 모달 내부 이미지의 길게 누르기(Long-press) 및 돋보기 제스처를 방해하지 않도록, `#image-save-modal` 및 `#save-preview-img`에 `touch-action: auto`, `user-select: auto`, `-webkit-touch-callout: default`가 확실히 적용되어야 합니다.
- **Web Share API `AbortError` 처리**:
  - 유저가 시스템 공유 시트를 띄운 후 [취소]를 눌렀을 때(`shareErr.name === 'AbortError'`), 에러로 취급하여 불필요하게 롱프레스 모달을 띄우지 않도록 예외 처리해야 합니다.

---

## 4. Conclusion (결론)

1. **SPTI 결과 카드 이미지 저장 개선 포인트**:
   - `game/shadow_puzzle/script.js`의 `downloadShareCard()` 함수를 플랫폼별(인앱 브라우저, 모바일 네이티브 브라우저, 데스크톱 브라우저) 3단계 엄격 분기 구조로 리팩토링합니다.
   - 인앱 브라우저에서는 가짜 `<a download>` 및 허위 알림을 완전히 차단하고 즉시 고화질 롱프레스 뷰어 모달(`#image-save-modal`)을 호출합니다.
   - Web Share API 지원 환경에서는 시스템 사진 저장 시트를 안전하게 연결합니다.
2. **문서 전달**:
   - 상세 분석 내용은 `analysis.md`에 완비되어 있으며, 후속 구현 작업자(Worker)가 즉시 적용할 수 있도록 정확한 코드 스니펫과 라인 정보를 제공합니다.

---

## 5. Verification Method (독립 검증 방법)

1. **기존 4-Tier 통합 테스트 스위트 실행**:
   ```bash
   node tests/run_all_tests.js
   ```
   - 전체 214개 어설션 통과 확인.
2. **인앱 브라우저 및 플랫폼별 분기 로직 테스트**:
   - `navigator.userAgent`를 모바일 인앱(Instagram, KakaoTalk), 모바일 사파리, 데스크톱 크롬으로 각각 모킹하여 `downloadShareCard()`를 호출했을 때:
     - 인앱 환경: `openImageSaveModal` 즉시 호출 확인, `<a download>` 미호출 확인.
     - 모바일 사파리 환경: `navigator.share` 호출 및 에러 시 모달 호출 확인.
     - 데스크톱 환경: `<a download>` 생성 및 클릭, 토스트 출력 확인.
