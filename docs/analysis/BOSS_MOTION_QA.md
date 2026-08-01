# 보스 전투 모션 QA

검수 일자: 2026-08-01

대상: `SECRET_ENEMIES`의 `isBoss: true` 21종

계약: 1536×2048 RGBA, 256px 셀, 6열×8행(`idle/basic_a/basic_b/special/ultimate/hit/charge/death`)

## 결론

보스 21종의 전용 시트와 147개 의미 행(`idle` 제외 21×7)을 원본 해상도로 검수했다. 열린 재작업은 0건이다. 특히 `boss_feral_dog_alpha`는 직접 물기 2종, 소환 울부짖음, 사냥 돌진이 서로 다른 행으로 분리됐다.

자동 검증과 사람의 시각 판정은 분리한다. 자동 도구는 PNG 구조·투명도·manifest 결선·hash만 검사하며 아래 수동 PASS를 생성하거나 갱신하지 않는다.

## 자동 검증

- `node tools/audit_combat_sprites.mjs --check`: 전체 전투 시트 60/60 참조, PASS 57, WARN 3, FAIL 0. Task 10 보스의 strict chroma, 반투명 green fringe, alpha=0 RGB 잔여는 모두 0이다.
- `npx vitest run tests/unit/CombatMotionManifest.test.js tests/unit/CombatSpriteSheetAssets.test.js`: 36/36 통과. 21종 ID 집합, 6×8 행 계약, 84개 action alias, locomotion을 검사한다.
- `python tools/materialize_boss_component_contract.py --check`: 사람이 고정한 분리 이펙트 222개 선택의 source cell, bbox, area, mask hash를 검사한다.
- `python tools/build_boss_motion_sheets.py --check`: generation source, immutable component contract, runtime PNG와 조립 recipe의 결정성을 검사한다.

자동 증거 hash:

- `assembly_recipe.json`: `20cccba2bbe817e5b1117dee31da707733da432a316da4ccd3d37512f4df1e7c`
- `detached_component_contract.json`: `4cf691c6423236aed75fa8f771cb4527e42a49650f553141a4836da7422da145`
- `generation_provenance.json`: `08ecc56cea34781c87ad62734c641a07a122c325ae852db3b1194493fdbed2d1`

## 수동 원본 해상도 검수

21종 contact sheet와 각 보스의 1:1 runtime pixel 확대 보드를 직접 대조했다. 판정 기준은 동작 실루엣 구분, 6프레임 진행, 신체·무기·이펙트 완전성, 이웃 셀 파편, 빈 프레임, 공격 없는 charge, death 종결 자세다.

- contact sheet: `art_sources/combat/task10_bosses/boss_motion_contact_sheet.png`
- contact sheet SHA-256: `64918b1960c8daf65554637a30d3b7d12762709db2d283a36eb4fab653be4307`
- 사람 작성 원본: `art_sources/combat/task10_bosses/manual_review_evidence.json`
- 수동 증거 SHA-256: `9f1b5ae92a1795b87b2e5700464d704b9857fa9b11c53125f154609eb6ab12eb`

| 보스 | basic A | basic B | special | ultimate | hit | charge | death | 관찰 요약 |
|---|---|---|---|---|---|---|---|---|
| `boss_patient_zero` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 돌진·폭발·재생·폭주의 실루엣 분리 |
| `boss_radiation_colossus` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 주먹과 지면 강타 분리, 방사 효과 비가림 |
| `boss_acid_queen` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 분사/꼬리 방향 분리, 웅덩이 셀 내 보존 |
| `boss_horde_mother` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 밀치기/휘두르기 분리, 소환과 포식 단계 명확 |
| `boss_frozen_giant` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 원거리 숨결/직접 주먹 분리, 감옥 완전성 |
| `boss_raider_warlord` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 사격 자세 분리, 호출/명령 제스처 명확 |
| `boss_phantom_sniper` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 재생성 후 소총·망토 clipping 해소 |
| `boss_cult_leader` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 재생성 후 단검·투척물 clipping 해소 |
| `boss_mutant_alpha_tiger` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 꼬리·발톱 완전, 도약/난무/포효/사냥 분리 |
| `boss_sewer_king` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 회전/꼬리 분리, 잠수·오수 효과 셀 내 유지 |
| `boss_swarm_queen_bee` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 여왕·날개 완전, 네 공격/지원 효과 분리 |
| `boss_feral_dog_alpha` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 직접 공격 2종, 포효 special, 사냥 ultimate 분리 |
| `boss_penthouse_survivor` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 단발/폭발탄 반동과 호출/선고 분리 |
| `boss_escaped_experiment` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 할퀴기/분사 전달 방식과 변이 단계 분리 |
| `boss_blizzard_wraith` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 재생성 후 눈보라 clipping 해소, 4개 효과 분리 |
| `boss_soldier_nemesis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 점사/섬광탄과 호출/교차사격 분리 |
| `boss_firefighter_nemesis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 재생성 후 도끼·화염 clipping 해소 |
| `boss_homeless_nemesis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 파이프/협박 타이밍과 소환/추심 분리 |
| `boss_chef_nemesis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 재생성 후 식칼·갈고리·기름 장판 완전성 확보 |
| `boss_doctor_nemesis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 타격/주입과 처치/수술 준비 동작 분리 |
| `food_warlord` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 강타/갈고리와 식량 탈취/굶주림 지배 분리 |

각 확대 보드의 전체 SHA-256, 147개 행 판정과 개별 관찰 메모는 수동 증거 JSON에 고정돼 있다. runtime 또는 preview가 바뀌면 verifier가 새 수동 검수를 요구해야 하며 기존 PASS를 자동 재연결해서는 안 된다.

## 재작업 이력

첫 생성본의 panel clipping을 원본 해상도에서 발견해 `boss_cult_leader`, `boss_phantom_sniper`, `boss_mutant_alpha_tiger`, `boss_sewer_king`, `boss_swarm_queen_bee`, `boss_blizzard_wraith`, `boss_firefighter_nemesis`, `boss_chef_nemesis`를 재생성했다. `boss_patient_zero`의 잘못된 8×7 생성본도 폐기하고 6×8로 다시 만들었다. 폐기본은 provenance 용도로만 보존되며 조립 입력에는 포함되지 않는다.
