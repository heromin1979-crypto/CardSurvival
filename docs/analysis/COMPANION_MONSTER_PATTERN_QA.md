# 동료·일반 몬스터 패턴 통합 QA

> 명령: `node tools/simulate_companion_monster_patterns.mjs --runs 500 --seed 20260727 --out docs/analysis/COMPANION_MONSTER_PATTERN_QA.md`
> 범위: 동료 20종 × 일반 몬스터 12종 = 240조합, 조합당 500회, 회당 3개 행동 라운드
> 결정성: seed `20260727`; 같은 데이터·Node 버전·인자로 실행하면 같은 분포를 생성한다.

## 판정

**PASS** — 허용 기준은 모든 오류 지표 0이다.

| 지표 | 관측 | 허용 | 결과 |
|---|---:|---:|---|
| 무효 기술 선택 | 0 | 0 | PASS |
| 무효 대상 선택 | 0 | 0 | PASS |
| 무효 위치 선택 | 0 | 0 | PASS |
| 중복 지원기 낭비 | 0 | 0 | PASS |
| 치료 미보유 동료의 치유 | 0 | 0 | PASS |
| 의도/실행 행동 ID 불일치 | 0 | 0 | PASS |
| 의도/실행 대상 불일치 | 0 | 0 | PASS |
| 동료 대상 연속공격 타격 소실 | 0 | 0 | PASS |
| 동료 대상 상태이상 소실 | 0 | 0 | PASS |
| 선언됐지만 실행되지 않는 카운터 | 0 | 0 | PASS |
| 유효하지 않은 실행 motionKey | 0 | 0 | PASS |

## 동료별 실제 기술 사용 분포

| 동료 | 기술 1 | 기술 2 | 기술 3 | 실행 명령 | 계획 없음 |
|---|---:|---:|---:|---:|---:|
| `npc_old_survivor` | `old_survivor_cane_strike` 0 (0.0%) | `old_survivor_warning` 12000 (66.7%) | `old_survivor_hold_line` 6000 (33.3%) | 18000 | 0 |
| `npc_nurse` | `nurse_scalpel` 6000 (33.3%) | `nurse_triage` 6000 (33.3%) | `nurse_encourage` 6000 (33.3%) | 18000 | 0 |
| `npc_soldier_deserter` | `deserter_rifle_shot` 0 (0.0%) | `deserter_covering_fire` 17424 (96.8%) | `deserter_reposition` 576 (3.2%) | 18000 | 0 |
| `npc_child` | `child_throw_debris` 0 (0.0%) | `child_hide` 6000 (33.3%) | `child_warning` 12000 (66.7%) | 18000 | 0 |
| `npc_mechanic` | `mechanic_wrench` 6000 (33.3%) | `mechanic_field_repair` 6000 (33.3%) | `mechanic_tripwire` 6000 (33.3%) | 18000 | 0 |
| `npc_student` | `student_improvised_strike` 0 (0.0%) | `student_first_aid` 6000 (33.3%) | `student_quick_step` 12000 (66.7%) | 18000 | 0 |
| `npc_dog` | `dog_bite` 6000 (33.3%) | `dog_guard` 6000 (33.3%) | `dog_track_weakness` 6000 (33.3%) | 18000 | 0 |
| `npc_former_colleague` | `colleague_hammer` 0 (0.0%) | `colleague_brace` 6000 (33.3%) | `colleague_teamwork` 12000 (66.7%) | 18000 | 0 |
| `npc_minjun` | `minjun_pistol` 5697 (32.2%) | `minjun_combat_medicine` 6000 (33.9%) | `minjun_command` 6000 (33.9%) | 17697 | 303 |
| `npc_sohee` | `sohee_precise_shot` 5488 (31.4%) | `sohee_silent_cover` 6000 (34.3%) | `sohee_focus` 6000 (34.3%) | 17488 | 512 |
| `npc_jisu` | `jisu_scalpel` 6000 (33.3%) | `jisu_emergency_care` 6000 (33.3%) | `jisu_diagnose` 6000 (33.3%) | 18000 | 0 |
| `npc_yeongcheol` | `yeongcheol_axe` 6000 (33.3%) | `yeongcheol_rescue` 6000 (33.3%) | `yeongcheol_rally` 6000 (33.3%) | 18000 | 0 |
| `npc_daehan` | `daehan_wrench` 0 (0.0%) | `daehan_barricade` 6000 (33.3%) | `daehan_overcharge` 12000 (66.7%) | 18000 | 0 |
| `npc_tower_security` | `security_baton` 4660 (25.9%) | `security_guard` 6000 (33.3%) | `security_taunt` 7340 (40.8%) | 18000 | 0 |
| `npc_tower_merchant` | `merchant_hidden_blade` 0 (0.0%) | `merchant_supply` 0 (0.0%) | `merchant_bargain` 18000 (100.0%) | 18000 | 0 |
| `npc_tower_cook` | `tower_cook_knife` 12000 (66.7%) | `tower_cook_meal` 6000 (33.3%) | `tower_cook_burn` 0 (0.0%) | 18000 | 0 |
| `npc_tower_engineer` | `tower_engineer_wrench` 6000 (33.3%) | `tower_engineer_cover` 6000 (33.3%) | `tower_engineer_trap` 6000 (33.3%) | 18000 | 0 |
| `npc_tower_doctor` | `tower_doctor_scalpel` 0 (0.0%) | `tower_doctor_triage` 6000 (33.3%) | `tower_doctor_stimulant` 12000 (66.7%) | 18000 | 0 |
| `npc_sous_chef` | `sous_chef_cleaver` 0 (0.0%) | `sous_chef_ration` 0 (0.0%) | `sous_chef_intimidate` 18000 (100.0%) | 18000 | 0 |
| `npc_kitchen_helper` | `kitchen_helper_pan` 0 (0.0%) | `kitchen_helper_assist` 18000 (100.0%) | `kitchen_helper_duck` 0 (0.0%) | 18000 | 0 |

## 일반 몬스터 실제 행동 분포

| 몬스터 | 실행 행동 분포 |
|---|---|
| `zombie_patient_dormant` | `basic_attack` 14818, `startled_lunge` 15182 |
| `zombie_common` | `basic_attack` 30000 |
| `zombie_runner` | `basic_attack` 21271, `runner_rush` 8729 |
| `zombie_brute` | `basic_attack` 21234, `slam` 8766 |
| `raider` | `basic_attack` 30000 |
| `raider_elite` | `aimed_shot` 8769, `raider_elite_basic_shot` 21231 |
| `zombie_horde` | `basic_attack` 30000 |
| `rabid_dog` | `basic_attack` 30000 |
| `zombie_acid` | `acid_lash` 8730, `basic_attack` 21270 |
| `zombie_bloater` | `bloater_swipe` 24000, `self_destruct` 6000 |
| `zombie_screamer` | `screamer_spit` 24000, `summon_horde` 6000 |
| `zombie_charger` | `charge_strike` 6000, `charger_lunge` 24000 |

## 20×12 조합 오류 매트릭스

각 셀은 해당 조합의 모든 허용 기준 위반 합계다. `★`는 브라우저 E2E 대표 조합이다.

| 동료 \ 몬스터 | `zombie_patient_dormant` | `zombie_common` | `zombie_runner` | `zombie_brute` | `raider` | `raider_elite` | `zombie_horde` | `rabid_dog` | `zombie_acid` | `zombie_bloater` | `zombie_screamer` | `zombie_charger` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `npc_old_survivor` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_nurse` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★ 0 | 0 | 0 | 0 |
| `npc_soldier_deserter` | 0 | 0 | 0 | 0 | 0 | ★ 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_child` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★ 0 | 0 | 0 | 0 | 0 |
| `npc_mechanic` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★ 0 | 0 | 0 |
| `npc_student` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_dog` | 0 | 0 | 0 | 0 | 0 | 0 | ★ 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_former_colleague` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_minjun` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_sohee` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_jisu` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_yeongcheol` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | ★ 0 |
| `npc_daehan` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_security` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_merchant` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_cook` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_engineer` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_tower_doctor` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_sous_chef` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `npc_kitchen_helper` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 선언 카운터 실행 프로브

| 몬스터 | 카운터 | 실제 실행 프로브 | 결과 |
|---|---|---|---|
| `zombie_bloater` | `weakness` | clean HP 100, non-counter HP 92 | PASS |
| `zombie_bloater` | `stunDelays` | stun 3→3 | PASS |
| `zombie_screamer` | `quietKill` | quiet noise 0, loud noise 25 | PASS |
| `zombie_screamer` | `stunDelays` | stun 3→3 | PASS |
| `zombie_charger` | `stunDelays` | stun 1→1 | PASS |

## 계측 계약

- 동료 선택은 실제 `COMPANION_TACTICS`와 60개 로드아웃을 `planCompanionTurn()`에 넣고, 선택 결과를 `validateSkillCommand()`와 `executeSkillCommand()`로 실행했다.
- 대상·위치 검증은 실제 `validateSkillPosition()`을 사용하며, 지원 중복은 런타임이 비중첩으로 취급하는 `block`, `focus`, `marked`, `vulnerable`, `rooted` 상태를 실행 직전에 관측했다.
- 적 행동은 실제 데이터에서 `commitEnemyAction()` 또는 `commitTimedThreatAction()`으로 한 번 예약하고, 예고 상태를 `advanceEnemyAction()`으로 진행한 뒤 같은 객체를 `executeEnemyAction()`에 전달했다.
- 타격, 상태이상, 강제 이동, FX의 실제 콜백 인자에서 행동 ID·대상·타격 수·`motionKey`를 비교했다. 결과 숫자는 하드코딩하지 않는다.
- `weakness`, `quietKill`, `stunDelays`는 각각 실제 약점 배율/사망 처리, 소음 처리, committed-action 지연 동작을 행동 프로브로 검증했다.
