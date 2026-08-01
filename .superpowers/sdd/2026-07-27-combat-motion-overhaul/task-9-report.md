# Task 9 보고서 — 동료 20종 전용 전투 모션

## 수정 라운드 1/5 결과

- Critical: 256×256 셀을 축소해서 보던 기존 검수 방식을 폐기하고, 1536×2048 runtime 원본과 1736×2120 확대 보드를 20종 모두 직접 대조했다. 최신 ranged 정리로 바뀐 15종도 다시 확인했으며, 빈 셀·잘린 신체·이웃 셀 파편·중복 패딩은 없었다.
- Important: `npc_wounded_soldier`, `npc_soldier` 숨은 alias를 제거했다. 부상병은 별도 motion sheet를 가장하지 않고 기존 아이콘 fallback을 명시적으로 사용한다.
- Important: 수동 증거는 20종 확대 보드, 60개 skill, hit/death 40건의 직접 작성한 관찰 메모와 판정을 유지한다. `tools/relink_companion_motion_manual_evidence.mjs`는 경로가 바뀌면 실패하며, 사람이 작성한 note/status는 건드리지 않고 최신 runtime·preview·row 해시만 연결한다.
- Important: recipe/provenance를 version 2 고정 스키마로 강화했다. assembly script, provenance, source 파일·픽셀, target 파일·픽셀, 행·열 매핑의 SHA-256을 검증하고 `-Check` 결정론 검사를 추가했다.

## 구현 및 자산

- `Object.keys(COMPANION_COMBAT_LOADOUTS)`의 정확한 20개 동료 ID와 `COMPANION_SPRITE_KEYS`의 정확한 20개 고유 sheet key를 1:1로 고정했다.
- runtime PNG 20개는 모두 1536×2048, 6×8, 256×256 cell, 8-bit RGBA이다.
- 행 계약은 `idle`, `melee`, `ranged`, `support`, `guard`, `move`, `hit`, `death` 순서이며 `idle`만 loop한다.
- 60개 고유 skill의 `motionKey`와 행 연결을 manifest, recipe, preview, manual evidence, verifier가 함께 검사한다.
- ranged 행 정리 시 작은 분리 component를 무조건 제거하지 않고 투척물·총구 화염·비행 도구를 보존한다. 이 변경으로 sprite audit의 정비공·탑 의사 중심 분산 warn이 사라졌다.
- 기존 Task 6 nurse/soldier 결과물은 `*_task6_after.png`로 보존하고 `task9-companion-motion` superseded lineage를 유지했다. Task 9 재생성으로 바뀐 nurse의 `currentSha256`만 최신 runtime에 다시 연결했으며 `task6AfterSha256`와 보존 원본은 변경하지 않았다.

## 생성 및 조립 provenance

- 생성 도구는 built-in `image_gen`만 사용했고 CLI/API는 사용하지 않았다.
- 동료별 subject, reference, row action, supplement, rejected generation은 `art_sources/combat/task9_companions/generation_provenance.json`에 기록했다.
- 보충 생성물은 원본 chroma와 alpha 변환본을 함께 보존한다. 품질이 맞지 않은 정비공 support 후보도 rejected 상태로 남겨 선택 근거를 추적할 수 있다.
- `tools/build_companion_motion_sheets.ps1`는 적응형 component 추출과 안정적인 total-order 정렬을 사용한다. 동일 입력을 반복 빌드해도 target과 recipe 해시가 변하지 않는다.

## 수동 QA와 자동 검증의 경계

- 직접 관찰 기록: `docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json`
- 자동 검증 결과: `docs/analysis/COMPANION_MOTION_QA.json`
- 확대 보드 20개와 contact index: `art_sources/combat/task9_companions/review_previews/`
- 수동 결과: 20/20 동료, 60/60 skill, 20/20 hit, 20/20 death PASS, open rework 0.
- 자동 verifier는 수동 PASS를 생성하거나 인증하지 않는다. note/status가 이미 존재하는지, preview/runtime/row 해시가 최신 증거와 연결되는지만 검사하며 결과에 `manualEvidenceState: linked-not-authenticated`를 명시한다.
- 원본 20개 runtime과 확대 보드 20개, contact index를 직접 확인했다. 마지막 ranged 정리 후 변경된 15개도 재검수해 투척물·총구 화염·도구 보존과 신체/장비 연속성을 확인했다.

## 검증 결과

- `node tools/verify_companion_motion_qa.mjs --write`: 20 companions, 20 unique sheets, 60 skills, 40 hit/death records, 960 cells, quality issues 0, open manual rework 0, PASS.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`: 20 deterministic targets verified.
- verifier negative tests: git 없는 복제 root PASS, source/runtime/recipe/assembly script/manual preview 해시 변조 5종 모두 거부.
- `node tools/audit_combat_sprites.mjs --check`: 46 total / 46 referenced / 46 pass / 0 warn / 0 fail.
- `python tools/verify_combat_chroma_cleanup.py --check`: 23 sheets / current pinned 23 / historical unexpected alpha loss 0.
- `node js/data/validate.js`: errors 0, 기존 stackConfig warnings 215, ALL CLEAR.
- `npm.cmd test`: 137 files / 1630 tests passed.
- `npm.cmd run build:web`: PASS, 264 modules transformed.
- `npm.cmd run build:dir`: sandbox 내 Electron cache 접근은 거부됐고 승인된 동일 명령으로 PASS.
- Web package: Task 9 runtime 20/20, Task 9 build-only leak 0.
- Electron `app.asar`: Task 9 runtime 20/20, Task 9 build-only leak 0.

## Self-review

- loadout ID, sprite key, runtime path, recipe target, preview, manual evidence의 집합과 매핑을 exact-key 방식으로 비교한다.
- runtime 20개는 서로 다른 sheet key와 경로를 사용한다. 숨은 alias로 누락을 가리는 경로는 없다.
- runtime/preview/row/recipe/provenance/script 해시를 모두 고정해 입력이나 빌더가 바뀌면 verifier 또는 `-Check`가 실패한다.
- 자동 QA는 사람의 판정을 생성하지 않으며, 기계적 해시 재연결 도구도 note/status/reviewedAt을 보존한다.
- full-resolution 진단은 960셀의 opaque component, 점유 면적, 높이, clipping, fragment, 연속성을 검사했다.
- 기존 사용자 변경은 stage하지 않았고 Task 9 수정과 필요한 Task 6 lineage 해시만 커밋 대상으로 제한한다.

## 남은 우려

- Node의 package `type` 미지정에 따른 `MODULE_TYPELESS_PACKAGE_JSON` 경고와 Vite의 기존 dynamic import/plugin timing 경고가 남아 있다. 이번 변경의 기능·테스트·패키징 실패는 아니다.

## 수정 라운드 2/5

### 수동 증거 재연결 fail-closed 전환

- `tools/relink_companion_motion_manual_evidence.mjs`를 쓰기 도구에서 읽기 전용 검사기로 전환했다. runtime, preview, preview row, recipe, contact sheet 중 하나라도 기존 수동 PASS와 달라지면 `fresh manual review required`로 실패하며 수동 증거 파일은 수정하지 않는다.
- 변경되지 않은 증거만 `already-linked-unchanged`로 통과한다. 실제 runtime 변경, 실제 preview 변경, row hash 변경을 각각 주입한 테스트에서 모두 비정상 종료했고, 각 실패 전후 `COMPANION_MOTION_MANUAL_OBSERVATIONS.json` 바이트가 동일함을 확인했다.
- 자동 verifier의 경계는 계속 `manualEvidenceState: linked-not-authenticated`이다. 자동 도구는 PASS, note, `reviewedAt`을 만들거나 갱신하지 않는다.

### ranged fragment 제한 계약

- ranged 2행 전체를 작은 파편 검사에서 제외하던 예외를 제거했다. 대신 20개 sheet × 6개 ranged frame에서 현재 확인된 분리 투사체·총구 화염·비행 도구 81개만 local alpha mask fingerprint로 고정한 `art_sources/combat/task9_companions/ranged_component_contract.json`을 추가했다.
- analyzer는 sheet, frame column, bbox, area, alpha mask가 계약과 정확히 일치하는 component만 허용한다. 계약 파일 자체도 고정 SHA-256과 exact sheet set으로 검증하므로 임의 항목 추가나 stale contract가 통과하지 않는다.
- builder는 저장 전 System.Drawing 표현 차이를 수용하는 제한된 bbox/area 후보만 보존하고, 저장 직후 공용 Node validator로 exact mask fingerprint를 다시 검사한다. source/recipe 재빌드는 계약을 자동 생성하거나 갱신하지 않는다.
- `nurse_companion` ranged 셀의 가장자리와 내부에 각각 임의 20×20 component를 주입한 테스트는 모두 실패했다. 같은 melee 주입도 실패했고, 실제 20개 runtime ranged 투사체는 모두 통과했다.

### 증거와 자산 상태

- runtime PNG 20개는 수정 라운드 1 이후 바이트 변경이 없다. 따라서 기존 수동 runtime, preview, row 관찰 해시와 사람의 note/status/reviewedAt을 그대로 유지했다.
- 빌더·검증 계약이 강화되어 바뀐 `assembly_recipe.json` 해시만 사람이 수동 증거 상단에 연결했다. 그 뒤 읽기 전용 relinker와 verifier가 변경 없는 상태를 확인했다.
- runtime 픽셀이 바뀌지 않았으므로 새 시각 판정이나 기존 PASS 자동 재인증은 수행하지 않았다.

### 검증 결과

- `tests/unit/CompanionMotionQuality.test.js`: 16/16 PASS. fail-closed 원자성, runtime/preview/row 변조, ranged edge/internal/melee 주입, stale/변조 contract, git 없는 복제 root를 포함한다.
- `npm.cmd test`: 137 files / 1639 tests PASS.
- `node tools/verify_companion_motion_qa.mjs --write`: 20 companions / 60 skills / 40 hit-death / 960 cells / quality issues 0 / open rework 0 / `linked-not-authenticated` / PASS.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`: 20 deterministic targets verified.
- `node tools/audit_combat_sprites.mjs --check`: 46 total / 46 referenced / 46 pass / 0 warn / 0 fail.
- `python tools/verify_combat_chroma_cleanup.py --check`: 23 sheets / changed 20 / current pinned 23 / historical unexpected alpha loss 0.
- `node js/data/validate.js`: errors 0 / 기존 stackConfig warnings 215 / ALL CLEAR.
- `npm.cmd run build:web`: PASS, 264 modules transformed. Web package runtime 20/20, build-only leak 0.
- `npm.cmd run build:dir`: sandbox의 Electron cache 접근 제한 후 승인된 동일 명령으로 PASS. `app.asar` runtime 20/20, build-only leak 0.
- 정확히 네 개의 agent 생성 `.pyc`만 제거했다: `build_normal_enemy_motion_sheets`, `normalize_combat_sprite_sheets`, `render_player_motion_preview`, `verify_combat_chroma_cleanup`의 Python 3.12 cache. 다른 사용자 파일은 삭제하지 않았다.

### Self-review

- relinker에는 파일 쓰기 경로가 없고, 모든 불일치는 첫 변경 전 실패한다. 수동 PASS를 최신 바이트에 자동 이식하는 경로가 남아 있지 않다.
- ranged 허용은 행 번호만으로 결정하지 않고 pinned contract의 sheet/column/exact mask로 제한한다. builder와 analyzer가 동일한 사후 저장 validator를 사용해 해석 차이를 줄였다.
- contract는 생성 입력이나 recipe에서 파생되지 않아 재빌드가 새 파편을 자동 승인하지 않는다. 변경하려면 사람이 계약 파일과 고정 SHA를 명시적으로 검토해야 한다.
- runtime 자산은 변경되지 않았고, 수정 범위는 검증 도구·계약·recipe·QA 증거·테스트·본 보고서로 제한했다.

### 남은 우려

- Node의 기존 `MODULE_TYPELESS_PACKAGE_JSON`, Vite의 기존 dynamic import/plugin timing, `package.json` author 누락 경고가 남아 있다. 이번 수정의 테스트·검증·패키징 실패는 아니다.

## 수정 라운드 3/5

### ranged 대형 detached component 우회 제거

- ranged 2행의 계약 비교 대상을 `smallFragments`가 아니라 각 셀의 주체 component를 제외한 `components.slice(1)` 전체로 변경했다. 면적이나 edge 여부와 관계없이 모든 detached non-major component가 exact contract 비교 대상이다.
- contract entry의 정체성은 sheet key와 frame column의 구조적 위치, 그리고 bbox·area·local alpha mask SHA-256을 담은 fingerprint의 조합으로 고정된다. 정상 runtime 20종의 ranged 120셀을 다시 계수한 결과 detached component는 총 81개이고 기존 명시 계약 81개와 정확히 일치했다.
- `ranged_component_contract.json`은 수정하거나 재생성하지 않았다. 고정 SHA-256 `df6a3f1eb29a37730bcbaccf645de474a9f6c372ffe3ca41adc7534ad4d9d2c7`과 recipe/verifier 결속을 유지하며, build/check 경로에는 계약 생성·갱신 동작이 없다.
- builder의 ranged 행에서 `component.Area > fragmentLimit` 보존 우회를 제거했다. pre-save 표현 차이를 허용하는 기존 제한 후보에 일치하지 않는 ranged detached component는 삭제해서 숨기지 않고 즉시 실패하며, 저장 후 공용 validator가 exact mask와 stale contract entry를 다시 검사한다. support 및 다른 행의 기존 정리 정책은 변경하지 않았다.

### TDD 증거

- RED: nurse ranged 셀에 20×20, 40×40, 41×41, 45×45 정사각형을 edge/internal 위치에 주입했다. 기존 구현에서 22개 중 정확히 41×41·45×45 네 사례가 실패하여 1,600px 상한 우회를 재현했다.
- GREEN: analyzer를 detached 전체 비교로 변경한 뒤 focused 22/22가 통과했다. 여덟 ranged 주입 모두 `ranged detached component fingerprint mismatch`로 거부되고, 동일 melee 주입, stale contract, contract mutation, no-git fixture 검증도 유지됐다.
- 정상 runtime의 실제 projectile/prop 81개는 모두 통과했다. runtime PNG 20개는 재빌드 전후 Git diff 0건이므로 새 시각 판정이나 수동 PASS 재인증은 수행하지 않았다.

### 검증 결과

- `npm.cmd test -- tests/unit/CompanionMotionQuality.test.js`: 22/22 PASS.
- `npm.cmd test`: 137 files / 1645 tests PASS.
- `node tools/verify_companion_motion_qa.mjs --write`: 20 companions / 60 skills / 40 hit-death / 960 cells / quality issues 0 / open rework 0 / `linked-not-authenticated` / PASS.
- `node tools/relink_companion_motion_manual_evidence.mjs`: `already-linked-unchanged`, 수동 PASS 변경 없음.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`: 20 deterministic targets verified.
- `node tools/audit_combat_sprites.mjs --check`: 46 total / 46 referenced / 46 pass / 0 warn / 0 fail.
- `python tools/verify_combat_chroma_cleanup.py --check`: 23 sheets / changed 20 / historical unexpected alpha loss 0 / current pinned 23.
- `node js/data/validate.js`: errors 0 / 기존 stackConfig warnings 215 / ALL CLEAR.
- `npm.cmd run build:web`: PASS, 264 modules transformed. Web package runtime 20/20, build-only leak 0.
- `npm.cmd run build:dir`: PASS. Electron `app.asar` runtime 20/20, build-only leak 0.
- Task 6 Python 검증이 다시 생성한 지정 agent `.pyc` 네 개만 제거했고, 다른 사용자 파일은 삭제하지 않았다.

### Self-review

- analyzer에서 ranged 계약 비교가 size threshold를 참조하는 경로는 없다. 1,600px 경계 바로 위와 더 큰 edge/internal component를 실제 decoded image 동작으로 검증했다.
- builder는 ranged 미등록 component를 면적 기준으로 보존하거나 자동 계약화하지 않는다. 관측된 미등록 component는 build 중 실패하고, 관측되지 않은 contract entry는 저장 후 exact validator에서 실패한다.
- runtime, preview, row hash와 사람이 작성한 note/status/reviewedAt은 변경하지 않았다. 도구 해시 변경으로 재생성된 recipe SHA만 수동 증거 상단에 연결했고 relinker가 변경 없는 증거 상태를 확인했다.
- 수정 범위는 analyzer, builder, 회귀 테스트, recipe/QA hash 연결, 본 보고서로 제한하며 다른 dirty worktree는 stage하지 않는다.

### 남은 우려

- 기존 Node module type, Vite dynamic import/plugin timing, `package.json` author 누락 경고가 남아 있다. 이번 변경의 테스트·검증·패키징 실패는 아니다.
