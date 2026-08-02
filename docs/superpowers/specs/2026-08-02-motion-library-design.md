# 전투 모션 라이브러리화 설계

> 2026-08-02 승인. 애니메이션 툴(`tools/sprite-anim-editor.html`)에서 제작한 캐릭터·몬스터 모션을
> (A) 게임이 자동으로 로드하고 (B) 에디터에서 원클릭으로 재편집할 수 있게 라이브러리화한다.

## 배경 (실측 진단)

1. `applyCombatSpriteManifest()`(`js/ui/combat/combatUiAssets.js:62`)는 테스트에서만 호출되고,
   프로덕션 코드는 어떤 모션 JSON도 fetch하지 않는다. 에디터 저장 결과가 게임에 반영되지 않음.
2. `assets/images/combat/spritesheets/manifest.json`은 `tools/export_combat_motion_manifest.mjs`가
   `COMBAT_MOTION_MANIFEST`에서 export하는 산출물이며, `--check` 모드가 의미적 일치를 강제한다
   (`tests/unit/CombatSpriteSheetAssets.test.js:253`). 에디터 저장 API가 여기에 basename 키를
   추가하면 drift-check가 깨진다 — 현행 저장 경로의 잠재 버그.
3. frameDur 유실 버그: 에디터는 프레임별 완급 `meta.frameDur`를 전송하지만 `serve.js`
   `/api/save-sheet`(약 319행)와 `tools/sprite-anim-server.mjs`(약 173행) 모두 cols/rows/rowFrames만
   기록하고 frameDur를 버린다. 에디터 UI 안내문("manifest.frameDur로 기록")은 현재 거짓.
4. 에디터 작업본(`.anim.json`)은 브라우저 다운로드로만 저장된다. 재편집하려면 다운로드 폴더에서
   수동 업로드 + 시트 이미지 별도 로드가 필요하다.

## A. 런타임 모션 라이브러리

- 새 파일 `assets/images/combat/spritesheets/motionLibrary.json` — 에디터 전용 오버라이드 저장소.
  키는 시트 파일명(`doctor_f_sheet.png`) — `applyCombatSpriteManifest`의 조회 키
  (`sheet.src.split('/').pop()`)와 일치. 값은 `{ cols, rows, rowFrames?, frameDur? }`.
- 서버 2곳(`serve.js` `/api/save-sheet`, `tools/sprite-anim-server.mjs` `handleSaveSheet`)의 기록
  대상을 `manifest.json` → `motionLibrary.json`으로 변경하고 `meta.frameDur`를 함께 기록한다.
- 게임 부팅: `js/main.js` init 경로에서 `fetch('assets/images/combat/spritesheets/motionLibrary.json')`
  → 성공 시 `applyCombatSpriteManifest(json)` 호출. 404/파싱 실패 시 조용히 JS 레지스트리 기본값
  사용, 부팅을 막지 않는다. 모든 배포 환경(Electron=로컬 HTTP `loadURL`, Vite dev, Capacitor)이
  HTTP 기반이므로 fetch 가능.
- `manifest.json`은 계속 QA export 산출물로만 유지 — 무변경.

## B. 에디터 프로젝트 라이브러리

- 저장 위치 `art_sources/combat/anim_projects/<시트파일명>.anim.json` (게임 빌드 미포함 아트 소스 폴더).
- 서버 API(두 서버 공통):
  - `GET /api/anim-projects` — 목록 (파일명·시트 경로·수정시각)
  - `POST /api/save-anim-project` — `{ name, project }` 저장 (경로 검증: anim_projects 하위 .json만)
  - `GET /api/anim-project?name=` — 단건 로드
- 에디터 UI(`tools/sprite-anim-editor.html`):
  - 내보내기 카드에 "라이브러리 저장" 버튼 — 현재 프로젝트(`saveProject()` 직렬화 결과)를 서버에 저장.
  - 헤더 시트 선택 시 라이브러리에 해당 시트의 프로젝트가 있으면 시트 로드 후 자동 적용
    (`applyProject` 재사용 — 수동 박스·완급·레이어 복원). `_src.png` 우선 로드 유지.
  - 기존 파일 다운로드/업로드 방식은 백업 용도로 유지.

## 범위 제외 (YAGNI)

- 신규 캐릭터 시트의 자동 등록: 시트 키 추가는 기존대로 `combatMotionManifest.js` +
  `PLAYER/COMPANION/ENEMY_SPRITE_KEYS` 수동 등록 유지. motions 행 의미 정의도 JS 레지스트리가 기준.
- 모션 프리셋(타이밍 템플릿) 교차 적용 — 이번 범위 아님.

## 검증

- vitest: motionLibrary 로드·적용 단위 테스트(fetch 모킹), 저장 API가 frameDur를 기록하는지 테스트.
- `node tools/export_combat_motion_manifest.mjs --check` 통과 유지(`manifest.json` 무변경 확인).
- 기존 `tests/unit/CombatSpriteSheetAssets.test.js` 등 전투 스프라이트 테스트 통과.
