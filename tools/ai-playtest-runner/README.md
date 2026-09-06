# Card Survival AI Playtest Runner

웹 빌드를 런별로 복사하고, Codex CLI가 화면 전용 MCP 도구로 플레이하도록 실행하는 로컬 도구다.

## 현재 지원 범위

- 지원: web 어댑터, first_time_player, hook, 신규 Chromium 프로필, 화면 캡처·좌표 입력·체크포인트·JSON/Markdown 보고서
- 미지원: qa, regression, Electron, Android, iOS

## 실행

~~~powershell
npm run playtest:doctor
npm run playtest:prepare -- --mode hook
npm run playtest -- --mode first_time_player --persona casual
~~~

prepare와 run은 먼저 npm run build:web를 실행한다. 이미 존재하는 빌드 산출물을 확인만 할 때는 --skip-build를 사용할 수 있다.

각 런의 복사 게임, 브라우저 프로필, 증거, 보고서는 .ai-playtest/runs/<run-id>/에 생성된다. 런에 문제가 생겨도 원본 게임 소스나 개발 저장 데이터는 수정하지 않는다.
