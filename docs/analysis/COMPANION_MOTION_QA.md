# Companion Motion QA

## 판정 범위와 증거 분리

- 수동 관찰 원본: `docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json`
- 수동 관찰 대상: `art_sources/combat/task9_companions/companion_motion_contact_sheet.png`
- 자동 지표: `docs/analysis/COMPANION_MOTION_QA.json`
- 교차 검증: `node tools/verify_companion_motion_qa.mjs --write`
- 조립 추적성: `art_sources/combat/task9_companions/assembly_recipe.json`, `generation_provenance.json`

수동 판정은 contact sheet에서 동료별 identity, 무기, 8개 의미 행, 6프레임 연속성, 잘림·슬라이드·잘못된 행 재사용 여부를 직접 관찰한 결과다. 자동 verifier는 이 판정을 만들지 않으며, 별도 관찰 데이터의 ID/해시를 manifest, loadout, runtime PNG, recipe와 교차 검증한다.

2026-08-08 fix round 2 선택적 재검토에서는 `old_survivor_companion`과 `sous_chef_companion`의 이동 r5를 다시 교체하고 original 해상도 source alpha·runtime·개별 확대 보드를 셀별로 대조했다. 노년 생존자의 승인된 발/지팡이 phase는 유지됐고 source 여섯 셀의 좌우 gutter가 모두 49px 이상이다. 부주방장은 f1 큰·밝은 near boot toe-up contact → f2 두 발 close true passing → f3 작은·어두운 far boot flat contact와 반대 occlusion → f4 opposite close passing → f5 lowered-pelvis near-leg wide contact → f6 close neutral return으로 읽힌다. runtime normalized lower-alpha IoU는 f1/f6 `0.369`, f2/f5 `0.333`, f1/f3 `0.568`이며 이전 반복 실루엣 수치보다 낮다. 두 source/runtime 모두 셀 경계 alpha와 cross-cell component가 0이고 source 최소 gutter는 각각 49px/33px이며, 다른 188개 비대상 행은 기준선과 동일하다.

## 60개 스킬 수동 판정

각 셀의 세 스킬은 모두 개별 `PASS`다. 상세 관찰 문장은 수동 관찰 원본에 스킬 ID별로 보존한다.

| 동료 ID | 스킬 1 | 스킬 2 | 스킬 3 |
| --- | --- | --- | --- |
| `npc_old_survivor` | `old_survivor_cane_strike→melee` PASS | `old_survivor_warning→support` PASS | `old_survivor_hold_line→guard` PASS |
| `npc_nurse` | `nurse_scalpel→melee` PASS | `nurse_triage→support` PASS | `nurse_encourage→support` PASS |
| `npc_soldier_deserter` | `deserter_rifle_shot→ranged` PASS | `deserter_covering_fire→ranged` PASS | `deserter_reposition→move` PASS |
| `npc_child` | `child_throw_debris→ranged` PASS | `child_hide→guard` PASS | `child_warning→support` PASS |
| `npc_mechanic` | `mechanic_wrench→melee` PASS | `mechanic_field_repair→support` PASS | `mechanic_tripwire→support` PASS |
| `npc_student` | `student_improvised_strike→melee` PASS | `student_first_aid→support` PASS | `student_quick_step→move` PASS |
| `npc_dog` | `dog_bite→melee` PASS | `dog_guard→guard` PASS | `dog_track_weakness→support` PASS |
| `npc_former_colleague` | `colleague_hammer→melee` PASS | `colleague_brace→guard` PASS | `colleague_teamwork→support` PASS |
| `npc_minjun` | `minjun_pistol→ranged` PASS | `minjun_combat_medicine→support` PASS | `minjun_command→support` PASS |
| `npc_sohee` | `sohee_precise_shot→ranged` PASS | `sohee_silent_cover→guard` PASS | `sohee_focus→support` PASS |
| `npc_jisu` | `jisu_scalpel→melee` PASS | `jisu_emergency_care→support` PASS | `jisu_diagnose→support` PASS |
| `npc_yeongcheol` | `yeongcheol_axe→melee` PASS | `yeongcheol_rescue→guard` PASS | `yeongcheol_rally→support` PASS |
| `npc_daehan` | `daehan_wrench→melee` PASS | `daehan_barricade→guard` PASS | `daehan_overcharge→support` PASS |
| `npc_tower_security` | `security_baton→melee` PASS | `security_guard→guard` PASS | `security_taunt→support` PASS |
| `npc_tower_merchant` | `merchant_hidden_blade→melee` PASS | `merchant_supply→support` PASS | `merchant_bargain→support` PASS |
| `npc_tower_cook` | `tower_cook_knife→melee` PASS | `tower_cook_meal→support` PASS | `tower_cook_burn→melee` PASS |
| `npc_tower_engineer` | `tower_engineer_wrench→melee` PASS | `tower_engineer_cover→guard` PASS | `tower_engineer_trap→support` PASS |
| `npc_tower_doctor` | `tower_doctor_scalpel→melee` PASS | `tower_doctor_triage→support` PASS | `tower_doctor_stimulant→support` PASS |
| `npc_sous_chef` | `sous_chef_cleaver→melee` PASS | `sous_chef_ration→support` PASS | `sous_chef_intimidate→support` PASS |
| `npc_kitchen_helper` | `kitchen_helper_pan→melee` PASS | `kitchen_helper_assist→support` PASS | `kitchen_helper_duck→move` PASS |

## 피격·다운 수동 판정

| 동료 ID | `hit` | `death` |
| --- | --- | --- |
| `npc_old_survivor` | PASS | PASS |
| `npc_nurse` | PASS | PASS |
| `npc_soldier_deserter` | PASS | PASS |
| `npc_child` | PASS | PASS |
| `npc_mechanic` | PASS | PASS |
| `npc_student` | PASS | PASS |
| `npc_dog` | PASS | PASS |
| `npc_former_colleague` | PASS | PASS |
| `npc_minjun` | PASS | PASS |
| `npc_sohee` | PASS | PASS |
| `npc_jisu` | PASS | PASS |
| `npc_yeongcheol` | PASS | PASS |
| `npc_daehan` | PASS | PASS |
| `npc_tower_security` | PASS | PASS |
| `npc_tower_merchant` | PASS | PASS |
| `npc_tower_cook` | PASS | PASS |
| `npc_tower_engineer` | PASS | PASS |
| `npc_tower_doctor` | PASS | PASS |
| `npc_sous_chef` | PASS | PASS |
| `npc_kitchen_helper` | PASS | PASS |

## 자동 검사 결과

- 동료/loadout/sprite key: 20/20/20, 전용 sheet key와 runtime path 모두 고유
- 스킬: 60개 고유 ID, `COMBAT_SKILLS.motionKey`와 8행 의미 계약 일치
- PNG: 20개 모두 1536×2048, 8-bit RGBA, 6×8, 셀 256×256
- 셀: 960/960 populated, 960/960 transparent corners
- strict chroma: 새 alpha 2종과 runtime r5 2행에서 각각 `opaqueGreen=0`, `fringeGreen=0`, `hiddenRgb=0`, `boundaryGreen=0`, `removedComponents=0`, `staleAllowlist=0`
- 수동 증거: 스킬 60/60 PASS, hit/death 40/40 PASS

## 종합 판정

`PASS` — 20종 identity와 무기 구분, 60개 스킬 의미 행, 피격/다운, 프레임 연속성 및 투명/chroma 계약을 모두 충족한다. 아군 개는 파란 구조 하네스를 착용한 건강한 진도 믹스 외형이며 `rabid_dog`의 상처·감염 외형을 재사용하지 않는다.
