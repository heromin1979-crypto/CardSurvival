# Task 9 보고서: 동료 20종 전용 전투 모션

## 구현 결과

- `Object.keys(COMPANION_COMBAT_LOADOUTS)`의 정확한 20개 동료 ID를 `COMPANION_SPRITE_KEYS`의 20개 고유 sheet key와 1:1 결선했다.
- 20개 runtime PNG를 모두 1536×2048, 6×8, 256×256 cell, 8-bit RGBA로 제작했다.
- 행 계약은 `idle`, `melee`, `ranged`, `support`, `guard`, `move`, `hit`, `death` 순서이며 `idle`만 loop한다.
- 60개 고유 스킬의 `motionKey`와 manifest 행을 테스트 및 verifier로 고정했다.
- 간호사의 메스 공격과 치료/격려를 `melee`/`support`로 분리했고, 탈영병의 소총 사격/엄호 사격/재배치를 `ranged`/`ranged`/`move`로 분리했다.
- 아군 개는 건강한 진도 믹스와 파란 구조 하네스 외형으로 새로 제작해 `rabid_dog` 자산을 재사용하지 않았다.
- 기존 Task 6 nurse/soldier 결과물은 `*_task6_after.png`로 exact SHA-256 보존하고 `task9-companion-motion` superseded lineage로 등록했다.

## 생성·조립 provenance

- 생성 도구: built-in `image_gen`만 사용했다. CLI/API 및 native-transparency fallback은 사용하지 않았다.
- 공통 prompt 계약: dark industrial post-apocalyptic Seoul, realistic hand-painted 2D sprite, exact semantic 6×8 contact sheet, flat chroma backdrop, full-body padding, no text/grid/extra character/infected ally.
- 동료별 subject, reference, row action, supplement, rejected generation은 `art_sources/combat/task9_companions/generation_provenance.json`에 보존했다.
- chroma 원본, alpha 승격본, 조립 행/열 provenance와 runtime SHA-256은 같은 build-only 디렉터리의 `assembly_recipe.json`에 보존했다.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`: `20 deterministic targets verified`.

## TDD RED → GREEN

- RED: `npx.cmd vitest run tests/unit/CombatMotionManifest.test.js`
  - 신규 계약 기준 3 failed / 기존 16 passed.
  - 실패 범위: 20개 ID mapping, 20개 6×8 전용 manifest/file, 60개 skill motion row.
- GREEN: `npx.cmd vitest run tests/unit/CombatMotionManifest.test.js tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatUIRankLineup.int.test.js`
  - 3 files / 43 tests passed.

## 수동 QA와 자동 지표 분리

- 수동 관찰 데이터: `docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json`
- 수동 판정 문서: `docs/analysis/COMPANION_MOTION_QA.md`
- 자동 지표: `docs/analysis/COMPANION_MOTION_QA.json`
- contact sheet: `art_sources/combat/task9_companions/companion_motion_contact_sheet.png`
- 수동 결과: 60/60 skill PASS, 20/20 hit PASS, 20/20 death PASS.
- 관찰 항목: 동료 identity, 무기, 동작 의미, 6프레임 연속성, 잘림, slide, 잘못된 행 재사용.
- `node tools/verify_companion_motion_qa.mjs --write`: 20 companions, 20 unique sheets, 60 skills, 40 hit/death, 960 populated cells, 960 transparent-corner cells, strict chroma exact 0 PASS.
- negative path: 잘못된 contact hash와 malformed recipe를 각각 verifier가 거부함을 확인했다.

## 필수 검증

- `node tools/audit_combat_sprites.mjs --check`: 46 total / 46 referenced / 46 pass / 0 warn / 0 fail.
- `node js/data/validate.js`: combat skills 81 errors 0, displayed sheets 46 errors 0, 전체 errors 0 / 기존 warnings 215, `ALL CLEAR`.
- `npm.cmd test`: 136 files / 1623 tests passed.
  - 최초에는 Task 6 verifier가 교체된 nurse를 descendant drift로 거부했다. 역사 PNG 보존 및 명시적 superseded lineage 추가 후 관련 verifier와 전체 테스트가 통과했다.
  - Web build와 병렬 실행한 한 차례는 worker 자원 경합으로 135/136에서 종료됐고, 단독 재실행 결과 전부 통과했다.
- Task 6 독립 검증: `python tools/verify_combat_chroma_cleanup.py --check` → 23 sheets, historical unexpected alpha loss 0.
- `npm.cmd run build:web`: PASS.
- `npm.cmd run build:dir`: sandbox 내 Electron cache 접근은 거부됐고 승인된 동일 명령 재실행은 PASS.
- Web package: Task 9 build-only leak 0, companion runtime sheets 20.
- Electron `app.asar`: Task 9 build-only leak 0, companion runtime sheets 20.
- `git diff --check`: PASS.

## Self-review

- loadout ID, sprite key, manifest key, recipe target, manual evidence를 verifier가 같은 집합으로 비교한다.
- 20개 runtime path와 sheet key는 서로 고유하며 플레이어/다른 동료 sheet를 공유하지 않는다.
- 모든 runtime hash는 recipe hash와 일치하고, 모든 cell이 populated이며 네 corner가 투명하다.
- strict chroma `opaqueGreen`, `fringeGreen`, `hiddenRgb`, `removedComponents`, `staleAllowlist`가 모두 exact 0이다.
- build-only chroma/alpha/contact/provenance는 Web 및 Electron package에 포함되지 않는다.
- 기존 사용자 미커밋 변경은 수정하거나 stage하지 않았다.

## 남은 우려

- Node가 package `type` 미지정에 따른 `MODULE_TYPELESS_PACKAGE_JSON` 성능 경고를 출력하지만 기능/테스트 실패는 아니다.
- Vite가 기존 static/dynamic import 중복 경고를 출력하지만 Task 9 asset 결선과 무관하며 build는 성공했다.
