# 동료·일반 몬스터 패턴 통합 QA

> 명령: `node tools/simulate_companion_monster_patterns.mjs --runs 500 --seed 20260727 --out docs/analysis/COMPANION_MONSTER_PATTERN_QA.md`
> 범위: 동료 20종 × 일반 몬스터 12종 = 240조합, 조합당 500회 × 3행동
> 결정적 seed: `20260727`

## 데이터 계약

| 계약 | 기대 | 실제 | 결과 |
|---|---:|---:|---|
| 동료 roster | 20 | 20 | PASS |
| 고유 동료 기술 ID | 60 | 60 | PASS |
| 일반 몬스터 roster | 12 | 12 | PASS |

roster 수, ID 완전성, 동료별 3개 loadout, 기술 정의 존재 여부는 시뮬레이션 전에 hard fail로 검사한다.

## Production 기본 동료 자세 smoke

| 동료 | profile 기본 | production 기본 | state stance 미설정 | 결과 |
|---|---|---|---|---|
| `npc_old_survivor` | `hold` | `hold` | 예 | PASS |
| `npc_nurse` | `heal` | `heal` | 예 | PASS |
| `npc_soldier_deserter` | `support` | `support` | 예 | PASS |
| `npc_child` | `support` | `support` | 예 | PASS |
| `npc_mechanic` | `support` | `support` | 예 | PASS |
| `npc_student` | `support` | `support` | 예 | PASS |
| `npc_dog` | `support` | `support` | 예 | PASS |
| `npc_former_colleague` | `hold` | `hold` | 예 | PASS |
| `npc_minjun` | `support` | `support` | 예 | PASS |
| `npc_sohee` | `support` | `support` | 예 | PASS |
| `npc_jisu` | `heal` | `heal` | 예 | PASS |
| `npc_yeongcheol` | `support` | `support` | 예 | PASS |
| `npc_daehan` | `hold` | `hold` | 예 | PASS |
| `npc_tower_security` | `hold` | `hold` | 예 | PASS |
| `npc_tower_merchant` | `support` | `support` | 예 | PASS |
| `npc_tower_cook` | `support` | `support` | 예 | PASS |
| `npc_tower_engineer` | `hold` | `hold` | 예 | PASS |
| `npc_tower_doctor` | `heal` | `heal` | 예 | PASS |
| `npc_sous_chef` | `support` | `support` | 예 | PASS |
| `npc_kitchen_helper` | `support` | `support` | 예 | PASS |

## 판정

**PASS** — 허용 기준은 모든 오류 지표 0이다.

| 지표 | 관측 | 허용 | 결과 |
|---|---:|---:|---|
| 무효 기술 선택 | 0 | 0 | PASS |
| 무효 대상 선택 | 0 | 0 | PASS |
| 무효 위치 선택 | 0 | 0 | PASS |
| 중복 지원 효과 낭비 | 0 | 0 | PASS |
| 치료 미보유 동료의 치유 | 0 | 0 | PASS |
| UI 의도/실행 행동 ID 불일치 | 0 | 0 | PASS |
| UI 의도/실행 대상 불일치 | 0 | 0 | PASS |
| 동료 대상 연속 공격 횟수 손실 | 0 | 0 | PASS |
| 동료 대상 상태이상 손실 | 0 | 0 | PASS |
| 선언됐지만 실행되지 않는 카운터 | 0 | 0 | PASS |
| 유효하지 않은 motionKey | 0 | 0 | PASS |
| production 기본 동료 자세 불일치 | 0 | 0 | PASS |

## 동료별 production 기술 사용 분포

| 동료 | 기술 1 | 기술 2 | 기술 3 | 계획 | 실행 | no-plan |
|---|---:|---:|---:|---:|---:|---:|
| `npc_old_survivor` | `old_survivor_cane_strike` 6000 (33.3%) | `old_survivor_warning` 6000 (33.3%) | `old_survivor_hold_line` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_nurse` | `nurse_scalpel` 6000 (33.3%) | `nurse_triage` 6000 (33.3%) | `nurse_encourage` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_soldier_deserter` | `deserter_rifle_shot` 6000 (33.3%) | `deserter_covering_fire` 6000 (33.3%) | `deserter_reposition` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_child` | `child_throw_debris` 6000 (33.3%) | `child_hide` 6000 (33.3%) | `child_warning` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_mechanic` | `mechanic_wrench` 6000 (33.3%) | `mechanic_field_repair` 6000 (33.3%) | `mechanic_tripwire` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_student` | `student_improvised_strike` 6000 (33.3%) | `student_first_aid` 6000 (33.3%) | `student_quick_step` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_dog` | `dog_bite` 6000 (33.3%) | `dog_guard` 6000 (33.3%) | `dog_track_weakness` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_former_colleague` | `colleague_hammer` 6000 (33.3%) | `colleague_brace` 6000 (33.3%) | `colleague_teamwork` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_minjun` | `minjun_pistol` 6000 (33.3%) | `minjun_combat_medicine` 6000 (33.3%) | `minjun_command` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_sohee` | `sohee_precise_shot` 6000 (33.3%) | `sohee_silent_cover` 6000 (33.3%) | `sohee_focus` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_jisu` | `jisu_scalpel` 6000 (33.3%) | `jisu_emergency_care` 6000 (33.3%) | `jisu_diagnose` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_yeongcheol` | `yeongcheol_axe` 6000 (33.3%) | `yeongcheol_rescue` 6000 (33.3%) | `yeongcheol_rally` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_daehan` | `daehan_wrench` 6000 (33.3%) | `daehan_barricade` 6000 (33.3%) | `daehan_overcharge` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_tower_security` | `security_baton` 6000 (33.3%) | `security_guard` 6000 (33.3%) | `security_taunt` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_tower_merchant` | `merchant_hidden_blade` 6000 (33.3%) | `merchant_supply` 6000 (33.3%) | `merchant_bargain` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_tower_cook` | `tower_cook_knife` 6000 (33.3%) | `tower_cook_meal` 6000 (33.3%) | `tower_cook_burn` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_tower_engineer` | `tower_engineer_wrench` 6000 (33.3%) | `tower_engineer_cover` 6000 (33.3%) | `tower_engineer_trap` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_tower_doctor` | `tower_doctor_scalpel` 6000 (33.3%) | `tower_doctor_triage` 6000 (33.3%) | `tower_doctor_stimulant` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_sous_chef` | `sous_chef_cleaver` 6000 (33.3%) | `sous_chef_ration` 6000 (33.3%) | `sous_chef_intimidate` 6000 (33.3%) | 18000 | 18000 | 0 |
| `npc_kitchen_helper` | `kitchen_helper_pan` 6000 (33.3%) | `kitchen_helper_assist` 6000 (33.3%) | `kitchen_helper_duck` 6000 (33.3%) | 18000 | 18000 | 0 |

## 일반 몬스터 production 실행 분포

| 몬스터 | `_executeEnemyCommittedAction`에서 관찰한 행동 |
|---|---|
| `zombie_patient_dormant` | `basic_attack` 20000, `startled_lunge` 10000 |
| `zombie_common` | `basic_attack` 30000 |
| `zombie_runner` | `basic_attack` 20000, `runner_rush` 10000 |
| `zombie_brute` | `basic_attack` 20000, `slam` 10000 |
| `raider` | `basic_attack` 30000 |
| `raider_elite` | `aimed_shot` 10000, `raider_elite_basic_shot` 20000 |
| `zombie_horde` | `basic_attack` 30000 |
| `rabid_dog` | `basic_attack` 30000 |
| `zombie_acid` | `acid_lash` 10000, `basic_attack` 20000 |
| `zombie_bloater` | `bloater_swipe` 30000 |
| `zombie_screamer` | `screamer_spit` 30000 |
| `zombie_charger` | `charge_strike` 30000 |

## 20×12 조합 오류 매트릭스

각 셀은 해당 조합의 오류 지표 합계이며, ★는 브라우저 대표 조합이다.

| 동료 \ 몬스터 | `zombie_patient_dormant` | `zombie_common` | `zombie_runner` | `zombie_brute` | `raider` | `raider_elite` | `zombie_horde` | `rabid_dog` | `zombie_acid` | `zombie_bloater` | `zombie_screamer` | `zombie_charger` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `npc_old_survivor` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_nurse` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★0 | 0 | 0 | 0 |
| `npc_soldier_deserter` | 0 | 0 | 0 | 0 | 0 | ★0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_child` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★0 | 0 | 0 | 0 | 0 |
| `npc_mechanic` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★0 | 0 | 0 |
| `npc_student` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_dog` | 0 | 0 | 0 | 0 | 0 | 0 | ★0 | 0 | 0 | 0 | 0 | 0 |
| `npc_former_colleague` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_minjun` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_sohee` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_jisu` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_yeongcheol` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★0 |
| `npc_daehan` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_security` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_merchant` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_cook` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_engineer` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_doctor` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_sous_chef` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_kitchen_helper` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 선언 카운터 production probe

| 몬스터 | 카운터 | 실행 근거 | 결과 |
|---|---|---|---|
| `zombie_bloater` | `weakness` | counter HP 100, non-counter HP 92 | PASS |
| `zombie_bloater` | `stunDelays` | normal 3→2, production stun 3→3, action=self_destruct | PASS |
| `zombie_screamer` | `quietKill` | quiet noise 0, loud noise 25 | PASS |
| `zombie_screamer` | `stunDelays` | normal 3→2, production stun 3→3, action=summon_horde | PASS |
| `zombie_charger` | `stunDelays` | normal 1→0, production stun 1→1, action=charge_strike | PASS |

## 관찰 경고 (비차단)

zero-use와 no-plan은 오류를 숨기지 않기 위해 별도 경고로 보고한다. 이는 production 전술 우선순위·위치·포화 회피 때문에 현재 fixture에서 선택 경로가 없을 수 있다는 뜻이며, 기술 무효를 자동으로 뜻하지 않는다.

- 없음

## 계측 경계

- 동료는 production `_setupCombat()` 뒤 `_prepareCompanionTurn()` → `_planCompanionAction()` → `_executePlannedCompanionAction()`으로만 계획·실행한다. simulator는 효과 adapter를 재구현하지 않는다.
- simulator의 동료 state에는 `stance`를 주입하지 않으며, 별도 smoke가 `CombatSystem._getCompanionStance()`의 production 기본값을 20종 `preferredStance`와 대조한다.
- 몬스터는 UI가 읽는 `enemy._nextIntent`를 값 snapshot으로 보존하고, 그 사이에 동료 행동을 삽입한 뒤 production `_runSingleEnemyTurn()`을 진행한다.
- 실제 행동·대상·다중타격은 `_executeEnemyCommittedAction()` 호출을 observation wrapper로 관찰한다. wrapper는 production 결과를 바꾸지 않고 즉시 복원된다.
- `stunDelays`는 `advanceEnemyAction()` 정상 진행이 1 감소하는 negative control, 선언값 `true`, production stun 부여 후 `_runSingleEnemyTurn()`에서 같은 committed action과 countdown이 보존되는지를 모두 요구한다.
- 카운터 probe와 전체 simulator는 변경한 `GameState` top-level 참조, `Math.random`, `SystemRegistry` 등록을 `finally`에서 복원한다.
