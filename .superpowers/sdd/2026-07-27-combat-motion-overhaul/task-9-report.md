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
