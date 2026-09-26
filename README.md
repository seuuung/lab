# 승민의 실험실

게임과 앱을 모아 둔 개인 프로젝트 사이트입니다. 브라우저에서 실행하는 게임 10개와 Android 앱 3개를 소개하며, 정적 파일을 GitHub Pages로 제공합니다.

**사이트:** [seuuung.github.io/lab](https://seuuung.github.io/lab/)

## 구성

| 경로 | 내용 |
| --- | --- |
| `index.html`, `home.css`, `home.js`, `sculpture.js` | 메인 화면과 인터랙션 |
| `assets/` | 썸네일과 시각 자산 |
| `game/` | 각 게임의 HTML, CSS, JavaScript |
| `tests/` | 기능·반응형·내비게이션 회귀 검사 |

메인 화면에는 전체·게임·앱 필터가 있습니다. 게임은 사이트 안에서 실행되고, 앱 카드는 Google Play로 연결됩니다. 별도 빌드 과정 없이 정적 파일을 제공하는 구조입니다. 일부 게임은 Three.js 등 외부 CDN을 사용하므로 해당 리소스를 불러올 수 있어야 합니다.

## 로컬 실행

저장소 루트에서 정적 서버를 실행한 뒤 `http://127.0.0.1:8000/`을 엽니다.

```bash
python -m http.server 8000 --bind 127.0.0.1
```

## 테스트

Node.js로 기본 회귀 검사를 실행합니다.

```bash
node tests/run_all_tests.js
```

통합 러너는 기능, 뷰포트·터치 영역·DPR 경계값, 필터·화면 크기 조합, 프로젝트 진입과 복귀 흐름을 네 단계로 검사합니다. 각 단계만 실행하려면 다음 파일을 직접 실행합니다.

```bash
node tests/tier1_feature_test.js
node tests/tier2_boundary_test.js
node tests/tier3_pairwise_test.js
node tests/tier4_realworld_test.js
```

게임별 조작과 진행 경로는 `tests/*playthrough.test.js`, `tests/magnetic_orbit_controls.test.js`, `tests/maze_mobile_controls.test.js` 등의 개별 검사로 확인합니다. 자동 검사는 실제 모바일 인앱 브라우저의 저장 동작이나 모든 WebGL 기기의 화면을 대신하지 않으므로, 해당 환경에서는 직접 확인이 필요합니다.

## 그림자 퍼즐: 이미지 저장과 3D 화면

그림자 퍼즐(`game/shadow_puzzle/`)에는 SPTI 결과 카드 저장 흐름과 3D 화면 개선 사항이 반영되어 있습니다.

- Instagram·KakaoTalk 등의 인앱 브라우저에서는 결과 카드의 가짜 다운로드 성공 알림을 피하고, 이미지를 길게 눌러 저장할 수 있는 뷰어를 엽니다. 뷰어에는 저장 안내가 있으며 닫기 버튼이나 배경 터치로 닫을 수 있습니다.
- 지원되는 모바일 브라우저에서는 Web Share API를 시도하고, 사용할 수 없거나 실패하면 이미지 뷰어로 돌아갑니다. 데스크톱에서는 이미지 다운로드를 제공합니다.
- 3D 퍼즐은 조명, 카메라 거리, 블록 크기와 모바일 배치를 조정해 큐브와 정답 그림자를 구분하기 쉽게 합니다.
