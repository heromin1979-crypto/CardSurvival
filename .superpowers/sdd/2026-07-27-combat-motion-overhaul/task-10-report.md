# Task 10 구현 보고서

## 결과

`SECRET_ENEMIES`의 보스 21종 전부에 전용 1536×2048 RGBA, 6열×8행 시트를 제공했다. 행 계약은 `idle/basic_a/basic_b/special/ultimate/hit/charge/death`이며, 84개 실제 action ID를 네 의미 행에 직접 alias하고 data의 movement와 manifest locomotion을 일치시켰다.

`boss_feral_dog_alpha`는 기존 포효 재사용 문제를 제거했다. `neck_bite`와 `frenzy_bite`는 별도의 직접 공격 행, `pack_howl`은 special, `alpha_hunt`는 ultimate, charge는 공격 효과 없는 준비 행이다.

## 자산과 provenance

- built-in `image_gen` chroma-key 생성만 사용했다. CLI/API 또는 native-transparency 생성 fallback은 사용하지 않았다.
- 생성 원본, alpha 변환본, prompt/actions, rejected 생성본, Task 6 baseline, 조립 recipe, immutable component contract, 수동 검수 보드는 `art_sources/combat/task10_bosses/`에 보존했다.
- 기존 전용 시트 7종의 Task 6 descendant를 `<sheet>_task6_after.png`로 보존하고 `task6_chroma/evidence_manifest.json`에서 `task10-boss-motion` superseded lineage로 연결했다.
- full-resolution에서 panel clipping을 발견한 8종은 다시 생성했다. Patient Zero의 잘못된 8×7 생성본도 폐기하고 6×8로 교체했다.
- 분리된 이펙트/투사체 222개 선택은 source cell, bbox, area, mask hash가 포함된 별도 immutable contract로 고정했다. 일반 build/check는 이 계약을 생성하거나 갱신할 수 없다.

증거 hash:

- assembly recipe: `20cccba2bbe817e5b1117dee31da707733da432a316da4ccd3d37512f4df1e7c`
- detached component contract: `4cf691c6423236aed75fa8f771cb4527e42a49650f553141a4836da7422da145`
- generation provenance: `08ecc56cea34781c87ad62734c641a07a122c325ae852db3b1194493fdbed2d1`
- manual review evidence: `9f1b5ae92a1795b87b2e5700464d704b9857fa9b11c53125f154609eb6ab12eb`
- 21종 contact sheet: `64918b1960c8daf65554637a30d3b7d12762709db2d283a36eb4fab653be4307`

21개 runtime PNG의 개별 file/pixel hash는 `assembly_recipe.json`의 target별로 고정했고 `build_boss_motion_sheets.py --check`와 `verify_boss_motion_qa.mjs`가 현재 파일과 교차 검증한다.

## 수동 QA와 자동 검증 경계

자동 renderer는 수동 PASS를 만들지 않는다. 사람이 21개 1:1 runtime 확대 보드와 contact sheet를 직접 보고 147개 의미 행을 판정했으며, 결과와 관찰 메모를 `manual_review_evidence.json`에 작성했다. 자동 verifier는 해당 PASS를 인증하지 않고 현재 preview/runtime/hash와 연결됐는지만 확인해 `manualEvidenceState: linked-not-authenticated`를 출력한다.

- 수동 검수: 21 bosses / 147 semantic rows PASS / open rework 0
- 자동 검사: 1,008 cells / strict chroma issues 0 / empty frame 0 / duplicate frame 0
- sprite audit: displayed 60 / referenced 60 / pass 57 / warn 3 / fail 0
- 프리뷰: active enemy 21 / unique sheet 21 / missing 0 / invalid dimension 0 / empty row 0

세부 판정과 재작업 이력은 `docs/analysis/BOSS_MOTION_QA.md`에 기록했다.

## 검증 결과

- `python tools/materialize_boss_component_contract.py --check`: detached component contract verified
- `python tools/build_boss_motion_sheets.py --check`: 21 deterministic boss targets verified
- `node tools/verify_boss_motion_qa.mjs`: 21 bosses, 147 semantic rows, 1,008 cells, strict chroma 0, open rework 0
- `node tools/export_combat_motion_manifest.mjs --check`: up to date
- `node tools/audit_combat_sprites.mjs --check`: 60 referenced, 57 pass, 3 warn, 0 fail
- `python tools/verify_combat_chroma_cleanup.py --check`: 23 pinned Task 6 sheets, historical unexpected alpha loss 0
- 보스 집중 Vitest 6 files / 92 tests: PASS
- 전체 `npm test`: 137 files / 1,648 tests PASS
- `node js/data/validate.js`: boss 21 errors 0, motion sheet 60 errors 0, 전체 errors 0. 기존 stackConfig warnings 215는 유지된다.
- `npm run build:web`: PASS, `dist-web` build-only source leak 0
- `npm run build`: Windows x64 portable package PASS. 첫 sandbox 실행은 Electron cache 접근 권한으로 실패했으나 승인된 동일 명령 재실행은 성공했다.
- packaged `app.asar`: boss runtime sheets 21, `art_sources/task10_bosses` leak 0

## 변경 범위

- production: `js/data/combatMotionManifest.js`, `js/ui/combat/combatUiAssets.js`, exported runtime manifest, 보스 runtime PNG 21개
- source/provenance: `art_sources/combat/task10_bosses/`, Task 6 evidence lineage/report
- QA/tooling: Task 10 build·component contract·source preparation·verifier 도구, manifest 회귀 테스트, sprite audit, boss QA 문서
- 사용자 소유의 다른 미커밋 파일은 stage하지 않는다.

예정 커밋 메시지: `feat(assets): add semantic motion rows for named bosses`
