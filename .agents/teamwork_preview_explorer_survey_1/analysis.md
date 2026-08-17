# SPTI 결과 카드 모바일 인앱 브라우저 이미지 저장 및 Web Share API 심층 분석 보고서

## 1. 조사 개요 및 배경

### 1.1 조사 목적
- **미션**: R1. 모바일 인앱 브라우저(인스타그램, 카카오톡 등) 전용 이미지 길게 눌러 저장 모달 직결 및 거짓 알림 제거
- **배경**: 인스타그램, 카카오톡, 페이스북, 네이버 등 모바일 인앱 웹뷰(In-App WebView) 환경에서는 보안 및 샌드박스 정책상 `<a download>` 트리거를 통한 파일 직접 다운로드가 정상 작동하지 않거나 무시됩니다.
- **핵심 목표**: 가짜 다운로드 링크 클릭 및 허위 다운로드 완료 알림을 차단하고, 모바일/인앱 환경에서는 고화질(1080x1920) 결과 카드를 즉시 길게 눌러 갤러리에 저장할 수 있는 풀스크린 뷰어 모달을 띄우거나 Web Share API 시트를 안전하게 연결하는 구조를 명확히 설계합니다.

---

## 2. SPTI 관련 컴포넌트 및 유틸리티 전수 조사

SPTI(3D Spatial Type Indicator, 공간 지각력 유형 검사) 결과 화면 및 이미지 저장/공유 기능은 `game/shadow_puzzle` 디렉토리에 모듈화되어 구현되어 있습니다.

### 2.1 주요 파일 구성 및 경로
| 파일 경로 | 역할 및 구성 요소 |
|---|---|
| `game/shadow_puzzle/index.html` | 결과 화면 모달(`#ending-modal`), 플로팅 공유 바(`#result-float-bar`), 모바일 이미지 저장 모달(`#image-save-modal`), 유형 상세 오버레이(`#type-detail-overlay`) |
| `game/shadow_puzzle/script.js` | 결과 렌더링(`renderResultScreen`), 고화질 캔버스 생성(`generateBackgroundMasterCanvas`), 다운로드/공유 핸들러(`downloadShareCard`, `copyShareCardToClipboard`), 모달 제어(`openImageSaveModal`, `closeImageSaveModal`) |
| `game/shadow_puzzle/style.css` | 공유 버튼 스타일(`.share-btn-download`, `.share-btn-insta`), 플로팅 바 애니메이션, 모달 백드롭 및 반응형 스타일 |

### 2.2 DOM 구조 상세 (`game/shadow_puzzle/index.html`)

1. **SPTI 결과지 모달 (Line 261 ~ 417)**:
   - ID: `#ending-modal` (`class="fixed inset-0 modal-backdrop hidden flex-col ... z-40 pointer-events-auto"`)
   - 구성: 상단 카테고리 뱃지, 캐릭터 카드(`#final-type-icon`, `#final-type-title`, `#final-type-desc`), 4대 능력치 막대 바(Speed, Spatial, Precision, Focus), 특징 3줄 리스트(`#final-traits-list`), 궁합 카드(`#final-match-good`, `#final-match-bad`), 완주 기록(`#final-time-text`, `#final-rot-text`), 다른 유형 살펴보기 아코디언(`#explore-types-grid`).

2. **플로팅 공유 바 (Line 419 ~ 453)**:
   - ID: `#result-float-bar` (`class="hidden fixed bottom-0 left-0 right-0 z-45 pointer-events-auto"`)
   - 플레이어 이름 입력 인풋: `<input id="player-name-input" type="text" maxlength="20" placeholder="이름 입력 시 카드에 반영돼요 ✨" />` (Line 429)
   - 이미지 저장 버튼: `<button id="download-card-btn" class="share-btn share-btn-download flex-1">` (Line 434)
   - 링크 복사 버튼: `<button id="copy-story-btn" class="share-btn share-btn-insta flex-1">` (Line 439)
   - 공유 상태 메시지: `<p id="share-status-msg" class="text-[10px] text-center text-emerald-400 ..."></p>` (Line 450)

3. **📱 모바일 이미지 저장 프리뷰 팝업 모달 (Line 498 ~ 518)**:
   - ID: `#image-save-modal` (`class="fixed inset-0 z-50 hidden flex-col items-center justify-center p-4" style="background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);"`)
   - 닫기 버튼: `<button id="close-image-modal" ...>✕</button>` (Line 506)
   - 저장용 고화질 이미지: `<img id="save-preview-img" src="" alt="SPTI 공간 지각력 진단서" class="w-full h-auto object-contain max-h-[75vh] select-auto" style="-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto;" />` (Line 512)
   - 안내 문구: "이미지를 1초간 길게 눌러 [사진에 저장]하세요" 및 "인앱 브라우저(인스타그램, 카카오톡 등)에서는 이미지를 길게 누르면 바로 갤러리에 저장할 수 있습니다."

---

## 3. 현재 이미지 생성 및 다운로드/알림 로직 분석

### 3.1 이미지 생성 방식
- **구현 함수**: `generateBackgroundMasterCanvas(myType, timeFormatted, totalRot, playerName = '')` (`game/shadow_puzzle/script.js:1288-1485`)
- **렌더링 방식**:
  - `html2canvas`나 `dom-to-image`와 같은 무거운 DOM 스크린샷 외부 라이브러리를 일절 사용하지 않습니다.
  - 브라우저 내장 **HTML5 Canvas 2D API (`document.createElement('canvas')`)**를 직접 사용하여 인스타 스토리 표준 규격인 **1080 × 1920 해상도(9:16 비율)**로 즉각 드로잉합니다.
  - 배경 그라데이션, 방사형 앰비언트 글로우, 이중 카드 프레임, 이모지, 4대 능력치 바, 불릿 포인트 특징 텍스트, 궁합 박스, 푸터 및 워터마크를 단 15~30ms 내에 생성하여 전역 `cachedMasterCanvas`에 캐싱합니다.
  - 플레이어가 이름을 입력하거나 수정하면 즉시 `cachedMasterCanvas`를 재생성합니다.

### 3.2 다운로드 및 공유 트리거 로직 현황
- **핸들러 함수**: `downloadShareCard()` (`game/shadow_puzzle/script.js:1649-1724`)
- **현재 실행 흐름**:
  ```javascript
  // 1. Web Share API 시도
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
          await navigator.share({ files: [file], title: '...', text: '...' });
          return;
      } catch (shareErr) {
          if (shareErr.name === 'AbortError') return;
          console.warn('Native Share failed, proceeding to direct download:', shareErr);
      }
  }

  // 2. 브라우저 파일 직접 다운로드 강제 트리거 (<a download>)
  try {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = blobUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  } catch (downloadErr) { ... }

  // 3. 인앱 브라우저 감지 후 모달 띄우기
  const isAppWebView = /Instagram|FB|KAKAOTALK|NAVER|Line/i.test(navigator.userAgent);
  if (isAppWebView) {
      openImageSaveModal(cachedMasterCanvas.toDataURL('image/png'));
  }
  ```

### 3.3 현재 구조의 문제점 및 한계 분석
1. **가짜 다운로드 링크 클릭 실행 (`link.click()` 선행 실행 문제)**:
   - 인앱 브라우저(카카오톡, 인스타그램 등)에서 Web Share API가 지원되지 않는 경우, 코드 2단계의 `link.click()`이 무조건 실행됩니다.
   - iOS WKWebView 기반 인앱 브라우저에서는 `<a download>`가 완전히 무시되거나 빈 페이지가 열리는 이상 동작이 발생합니다.
   - 데스크톱이 아닌 모바일 인앱 브라우저에서는 `<a download>`를 실행하지 않고 즉시 모달로 진입해야 합니다.
2. **이중 동작(Double Trigger) 및 불명확한 분기**:
   - `link.click()`으로 다운로드를 시도한 후 연이어 `if (isAppWebView)` 모달을 여는 비순차적 흐름으로 인해, 모바일 유저에게 불필요한 혼란을 줍니다.
3. **허위 알림 차단 필요**:
   - 모바일 환경에서 다운로드가 실제 완료되지 않았음에도 "다운로드되었습니다" 등의 성공 메시지가 출력되면 유저가 갤러리에 저장된 줄 알고 브라우저를 닫아버리는 치명적 이탈이 발생합니다.

---

## 4. 환경 감지(UserAgent / Mobile / In-App) 및 Web Share API 지원 분석

### 4.1 플랫폼 및 브라우저 환경 판별 매트릭스

| 환경 구분 | UserAgent / Feature 특징 | 권장 UX 전략 |
|---|---|---|
| **모바일 인앱 브라우저**<br>(Instagram, KakaoTalk, NAVER, Facebook, Line 등) | `navigator.userAgent`에 `Instagram`, `KAKAOTALK`, `NAVER`, `FBAN`, `FBAV`, `Line`, `everytimeApp`, `DaumApps` 등 포함 | `<a download>` 완전 차단.<br>즉각 고화질 롱프레스 뷰어 모달(`#image-save-modal`) 오픈. |
| **모바일 네이티브 브라우저**<br>(iOS Safari, Android Chrome, Samsung Internet) | `isMobile` 참, `isInApp` 거짓, `navigator.canShare({ files })` 지원 | 1순위: `navigator.share({ files })`로 시스템 공유/사진 저장 시트 오픈.<br>2순위(실패/미지원 시): 롱프레스 뷰어 모달 호출. |
| **데스크톱 브라우저**<br>(PC Chrome, Edge, Firefox, Mac Safari) | `isMobile` 거짓 | Blob URL 생성 및 `<a download>`를 통한 직접 파일 다운로드 실행 + 완료 안내 토스트 노출. |

### 4.2 Web Share API 호환성 세부 사항
- `navigator.canShare`: 반드시 boolean 함수 체크 (`typeof navigator.canShare === 'function'`)
- `navigator.canShare({ files: [file] })`: 브라우저가 File 공유를 지원하는지 사전 검증.
- `navigator.share` 호출 시 발생할 수 있는 오류:
  - `AbortError`: 사용자가 공유 팝업에서 [취소]를 누른 정상 케이스 (모달을 띄우지 않고 조용히 리턴).
  - `NotAllowedError` / `TypeError`: 권한 또는 사용자 제스처 소실 오류 (이 경우 모달로 fallback).

---

## 5. 개선 구현 설계 (Exact File Paths, Line Numbers, Code Structures)

### 5.1 수정 대상 파일 목록
1. `game/shadow_puzzle/script.js` (Lines 1649 ~ 1741): `downloadShareCard` 및 모달 헬퍼 함수
2. `game/shadow_puzzle/index.html` (Lines 498 ~ 518): `#image-save-modal` 및 안내 UI
3. `game/shadow_puzzle/style.css`: 모달 터치 상호작용(`touch-action: auto`) 및 Safe-Area 보장

### 5.2 `downloadShareCard()` 함수 재설계 (제안 구조)

```javascript
// 정확한 위치: game/shadow_puzzle/script.js (Line 1649 ~)
async function downloadShareCard() {
    trackEvent('viral_share', { action_type: 'download_card' });

    const nameInput = document.getElementById('player-name-input');
    const playerName = nameInput ? nameInput.value.trim() : '';

    const totalSec = progress.stats.totalTime || 0;
    const totalRot = progress.stats.totalRotations || 0;
    const totalMin = Math.floor(totalSec / 60);
    const totalSecRem = Math.floor(totalSec % 60);
    const timeFormatted = `${String(totalMin).padStart(2, '0')}분 ${String(totalSecRem).padStart(2, '0')}초`;
    const myType = determineAnimalType(totalSec, totalRot);

    generateBackgroundMasterCanvas(myType, timeFormatted, totalRot, playerName);

    if (!cachedMasterCanvas) {
        showShareStatus('⚠️ 카드 생성에 실패했습니다. 다시 시도해주세요.', true);
        return;
    }

    const namePart = playerName ? `_${playerName}` : '';
    const fileName = `shadow_puzzle_spti${namePart}_${Date.now()}.png`;

    // 1. 디바이스 및 인앱 브라우저 정밀 판별
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) || (window.innerWidth < 768);
    const isInApp = /Instagram|FBAN|FBAV|FB_IAB|FB4A|KAKAOTALK|NAVER|Line|everytimeApp|DaumApps/i.test(ua);

    // 캔버스 DataURL 준비 (모달 및 범용 이미지 뷰어용)
    const dataUrl = cachedMasterCanvas.toDataURL('image/png');

    // 2. 인앱 브라우저 (카카오톡, 인스타그램 등) -> 가짜 다운로드 없이 즉시 모달 직결
    if (isInApp) {
        openImageSaveModal(dataUrl);
        return;
    }

    // 3. 모바일 네이티브 브라우저 -> Web Share API 우선 시도
    if (isMobile) {
        try {
            cachedMasterCanvas.toBlob(async (blob) => {
                if (!blob) {
                    openImageSaveModal(dataUrl);
                    return;
                }

                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.canShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'SPTI 나의 공간 지각력 유형 진단서',
                            text: `🧩 나의 3D 공간 지각 유형: ${myType.name}!`
                        });
                        return; // 공유 창 성공 또는 닫힘
                    } catch (shareErr) {
                        if (shareErr.name === 'AbortError') {
                            // 사용자가 직접 닫은 경우
                            return;
                        }
                        console.warn('Native Share failed, opening modal:', shareErr);
                    }
                }

                // Web Share API 미지원 또는 실패 시 모달로 안전 fallback
                openImageSaveModal(dataUrl);
            }, 'image/png');
            return;
        } catch (e) {
            openImageSaveModal(dataUrl);
            return;
        }
    }

    // 4. 데스크톱 브라우저 -> <a> download 태그를 통한 직접 다운로드
    try {
        cachedMasterCanvas.toBlob((blob) => {
            if (!blob) {
                const link = document.createElement('a');
                link.download = fileName;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showShareStatus('💾 진단서 이미지가 다운로드되었습니다.');
                return;
            }

            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = blobUrl;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
            showShareStatus('💾 진단서 이미지가 다운로드되었습니다.');
        }, 'image/png');
    } catch (downloadErr) {
        console.warn('Desktop download failed, fallback to modal:', downloadErr);
        openImageSaveModal(dataUrl);
    }
}
```

### 5.3 모달 UI 및 스타일 보강
1. **터치 및 선택 속성 강화 (`index.html:498-518`)**:
   - `body` 태그의 `touch-none`, `select-none`이 `#image-save-modal` 내부 이미지 길게 누르기(Long-press) 동작을 방해하지 않도록, `#image-save-modal` 및 `#save-preview-img`에 명시적으로 `touch-action: auto`, `user-select: auto`, `-webkit-touch-callout: default`, `pointer-events: auto` 스타일을 부여합니다.
2. **모달 닫기 제어**:
   - 닫기 버튼(`#close-image-modal`) 및 모달 바깥 배경 터치(`e.target === e.currentTarget`) 시 `closeImageSaveModal()`이 즉각 호출되도록 보장합니다.

---

## 6. 검증 계획 (Verification Plan)

1. **정적 문법 및 파일 무결성 검증**:
   - `node tests/run_all_tests.js` 실행으로 전체 4-Tier 214개 어설션 통과 여부 확인.
2. **브라우저 분기 동작 검증 시뮬레이션**:
   - `UserAgent`를 `iPhone KakaoTalk`, `iPhone Instagram`, `Android Chrome`, `Desktop Chrome`으로 주입하여:
     - 인앱 브라우저 환경에서 `downloadShareCard()` 실행 시 `openImageSaveModal`이 즉시 호출되고 `<a download>`가 호출되지 않는지 검증.
     - Web Share API 지원 환경에서 `navigator.share`가 호출되는지 검증.
     - 데스크톱 환경에서만 `<a download>` 및 완료 토스트가 정상 트리거되는지 검증.
