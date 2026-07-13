# 몬스터 리스트, 설정, 공격 패턴 정리

최신화 기준: `master` HEAD `1e8d582` / 2026-06-29  
작성 기준 파일:

- 일반 몬스터 데이터: `js/data/enemies.js`
- 시크릿 보스 데이터: `js/data/secretEnemies.js`
- 통합 등록: `js/data/GameData.js`
- 전투 AI/패턴 실행부: `js/systems/CombatSystem.js`
- 타이밍 압박 수치: `js/data/gameBalance.js`
- 보스 패턴 테스트: `tests/unit/CombatBossPatterns.test.js`
- 신규 일반 적 테스트: `tests/unit/CombatNewEnemies.test.js`

## 전체 구성

`GameData.enemies`는 `ENEMIES`와 `SECRET_ENEMIES`를 병합한다.

| 구분 | 수 | 소스 | 비고 |
|---|---:|---|---|
| 일반 전투 몬스터 | 12 | `ENEMIES` | 위험도/소음 기반 랜덤 조우 |
| 시크릿 보스 | 21 | `SECRET_ENEMIES` | 지역, 날짜, 계절, 날씨, 캐릭터, 숨겨진 장소 조건 |
| 합계 | 33 | `GameData.enemies` | `GameData.js`에서 병합 |

## AI 대상 선택 패턴

`CombatSystem._decideNextIntent()`는 다음 턴 의도를 만들고, `_pickTargetByPattern()`에서 대상 선택을 결정한다.

| AI 패턴 | 실제 대상 선택 기준 |
|---|---|
| `normal` | 플레이어 우선 |
| `aggressive` | 플레이어와 동료 중 HP 비율이 가장 낮은 대상 |
| `defensive` | 원거리 무기를 든 플레이어 우선, 없으면 플레이어 |
| `horde` | 플레이어/동료 중 무작위 |
| `sniper` | `npc_nurse`, `npc_doctor` 우선, 없으면 플레이어 |
| `predator` | 출혈, 감염, 화상, 산성 화상 상태 대상 우선, 없으면 플레이어 |

## 일반 몬스터 12종

| ID | 타입 | HP | 공격 | 방어 | XP | AI | 핵심 패턴 |
|---|---|---:|---|---:|---:|---|---|
| `zombie_patient_dormant` | zombie | 18-30 | 10-16 / 65% | 0 | 14 | aggressive | 병원 기습형, 감염 25%, blade/fire 약점 |
| `zombie_common` | zombie | 25-40 | 8-15 / 60% | 0 | 10 | normal | 기본 좀비, 감염 20%, fire/blade 약점 |
| `zombie_runner` | zombie | 18-28 | 12-20 / 75% | 0 | 18 | aggressive | 빠른 전열 근접, 출혈 3턴, 감염 30% |
| `zombie_brute` | zombie | 75-110 | 20-35 / 55% | 3 | 40 | defensive | `slam`, 30-45 피해, 3턴 쿨다운, 50% 기절 |
| `raider` | human | 35-55 | 14-22 / 68% | 2 | 25 | aggressive | 원거리 인간 적, morale 데이터 보유 |
| `raider_elite` | human | 55-80 | 18-28 / 72% | 4 | 45 | sniper | 후열 저격, healer 우선, `aimed_shot` |
| `zombie_horde` | zombie | 100-145 | 6-12 / 65% | 0 | 35 | horde | 라운드당 2회 공격, 감염 30% |
| `rabid_dog` | animal | 20-35 | 8-14 / 72% | 0 | 15 | aggressive | 라운드당 2회 공격, 출혈 2턴 |
| `zombie_acid` | zombie | 38-60 | 8-14 / 72% | 0 | 30 | predator | 후열 원거리 산성 피해, `acid_burn` |
| `zombie_bloater` | zombie | 45-65 | 4-8 / 55% | 0 | 32 | normal | `self_destruct`, 3턴 카운트, 충전 중 일반 공격 |
| `zombie_screamer` | zombie | 30-45 | 5-9 / 60% | 0 | 28 | normal | `summon_horde`, 3턴 카운트, 충전 중 일반 공격 |
| `zombie_charger` | zombie | 35-55 | 6-10 / 60% | 1 | 30 | aggressive | `charge_strike`, 1턴 카운트, 충전 중 공격 없음 |

## timedThreat 상세

`timedThreat`는 `_chargeRemaining`으로 초기화되고, 의도 UI에는 카운트다운으로 표시된다.

| 적 | 위협 | 카운트 | 충전 중 행동 | 발동 효과 | 카운터 |
|---|---|---:|---|---|---|
| `zombie_bloater` | `self_destruct` | 3 | 일반 공격 후 카운트 -1 | 플레이어+동료 전체 25-40 피해, 감염 +15, 자신 사망 | 기절 시 카운트 +1, fire/explosive 처치 시 사체 폭발 방지 |
| `zombie_screamer` | `summon_horde` | 3 | 일반 공격 후 카운트 -1 | 위험도 기반 적 1-2마리 전열 소환, 소음 +25 | 기절 시 카운트 +1, 비은밀 처치 시 죽음의 비명으로 소음 +25 |
| `zombie_charger` | `charge_strike` | 1 | 공격하지 않고 대기 | 35-55 강타, 플레이어 기절 1턴, 큰 피격 연출 | 기절 시 카운트가 초기값으로 리셋 |

블로터는 카운트가 `3`, `2`, `1`인 턴에도 `chargingAttacks: true`라서 일반 공격을 먼저 하고 카운트를 줄인다. 카운트가 `0`인 자기 턴에는 일반 공격 대신 자폭한다.

## 시크릿 보스 21종

| ID | 타입 | HP | 공격 | 방어 | XP | AI | 스킬/패턴 |
|---|---|---:|---|---:|---:|---|---|
| `boss_patient_zero` | zombie | 200 | 30-50 / 70% | 3 | 200 | aggressive | 재생 10, 50% 페이즈, `viral_burst`, `viral_fever` |
| `boss_radiation_colossus` | zombie | 350 | 40-65 / 55% | 8 | 350 | defensive | 60%/30% 페이즈, AOE 35-50, `ground_slam`, 방사선 중독 |
| `boss_acid_queen` | zombie | 180 | 25-40 / 72% | 2 | 180 | aggressive | 40% 페이즈, AOE 15-25, `acid_spray`, `acid_pool`, 산성 부식 |
| `boss_horde_mother` | zombie | 250 | 20-35 / 65% | 4 | 250 | horde | 50%/25% 페이즈, `zombie_common` 2마리 소환, `screech` |
| `boss_frozen_giant` | zombie | 300 | 35-55 / 55% | 10 | 300 | defensive | 50% 페이즈, `frost_breath`, `ice_armor`, 동상 |
| `boss_raider_warlord` | human | 150 | 30-50 / 75% | 5 | 200 | aggressive | 40% 페이즈, `raider` 2명 소환, `aimed_barrage`, `call_reinforcements` |
| `boss_phantom_sniper` | human | 80 | 50-80 / 85% | 2 | 250 | defensive | 30% 페이즈, `headshot`, `camouflage`, 출혈 |
| `boss_cult_leader` | human | 120 | 20-35 / 70% | 3 | 220 | normal | 50%/20% 페이즈, AOE 25-35, `fanatic_bomb`, `sermon`, 공포 |
| `boss_mutant_alpha_tiger` | animal | 220 | 35-55 / 80% | 4 | 220 | aggressive | 40% 페이즈, 2회 공격, `pounce`, `roar`, 출혈 |
| `boss_sewer_king` | animal | 280 | 30-50 / 65% | 7 | 280 | defensive | 50%/25% 페이즈, `death_roll`, `submerge`, 감염된 상처 |
| `boss_swarm_queen_bee` | animal | 100 | 15-25 / 80% | 1 | 160 | aggressive | 30% 페이즈, 3회 공격, `swarm_cloud`, `royal_jelly_heal`, 독 |
| `boss_feral_dog_alpha` | animal | 160 | 25-40 / 80% | 2 | 160 | aggressive | 50%/20% 페이즈, `rabid_dog` 3마리 소환, `pack_howl`, `frenzy` |
| `boss_penthouse_survivor` | human | 100 | 40-60 / 70% | 3 | 200 | aggressive | 40% 페이즈, `raider_elite` 1명 소환, 2회 공격, `golden_gun`, `call_bodyguard` |
| `boss_escaped_experiment` | zombie | 400 | 30-45 / 70% | 5 | 500 | aggressive | 재생 15, 70%/40%/15% 페이즈, `resistance_shift`, `toxic_blood` |
| `boss_blizzard_wraith` | zombie | 160 | 25-40 / 75% | 3 | 200 | aggressive | 40% 페이즈, `frost_touch`, `blizzard_cloak`, 동상 |
| `boss_soldier_nemesis` | human | 160 | 35-55 / 78% | 5 | 230 | aggressive | 40% 페이즈, `raider` 2명 소환, `flashbang`, `call_deserters` |
| `boss_firefighter_nemesis` | zombie | 200 | 30-45 / 70% | 4 | 240 | aggressive | 재생 5, 50%/20% 페이즈, `fire_axe`, `burning_charge`, 화상 |
| `boss_homeless_nemesis` | human | 120 | 25-45 / 75% | 3 | 200 | aggressive | 50%/20% 페이즈, `raider` 2명 소환, `intimidate`, `call_thugs`, 공포 |
| `boss_chef_nemesis` | zombie | 150 | 22-38 / 74% | 2 | 220 | normal | 50%/20% 페이즈, AOE 12-20, `cleaver_slash`, `boiling_splash`, 화상 |
| `boss_doctor_nemesis` | zombie | 180 | 25-40 / 75% | 3 | 250 | aggressive | 50%/20% 페이즈, `surgical_strike`, `inject_virus`, 바이러스 감염 |
| `food_warlord` | human | 200 | 25-40 / 75% | 6 | 260 | aggressive | 50%/20% 페이즈, `raider` 2명 소환, `starvation_strike`, `call_raiders`, 기아 |

## 보스 패턴 실행 규칙

| 데이터 필드 | 실제 처리 |
|---|---|
| `specialSkills[].damage` | 스킬 명중 시 스킬 피해를 적용한다. |
| `specialSkills[].cooldown` | 스킬별 쿨다운이 0일 때 우선 사용하고, 사용 후 쿨다운을 설정한다. |
| `specialSkills[].stunChance` | 명중 시 확률로 플레이어 기절 상태를 추가한다. |
| `specialSkills[].effect.selfHeal` | 보스가 즉시 회복한다. |
| `specialSkills[].effect.summon` | 지정 적을 전열에 소환하고 턴 큐에 추가한다. |
| `specialSkills[].effect.dot`, `bleed`, `poison` | 플레이어 상태이상으로 추가한다. |
| `specialSkills[].effect.infection`, `radiation`, `bodyTemp` | 감염, 방사능, 체온 스탯을 조정한다. |
| `specialSkills[].effect.staminaDrain`, `moraleDrain` | 플레이어 스태미나/사기를 감소시킨다. |
| `specialSkills[].effect.defenseBoost`, `evasion`, `invulnerable` | 보스 임시 버프로 적용하고 턴 시작 시 지속시간을 감소시킨다. |
| `specialSkills[].effect.multiHit`, `doubleShot` | 추가 피해를 한 번 더 적용한다. |
| `specialSkills[].effect.aoe` | 플레이어에게 준 피해만큼 동료에게도 적용한다. |
| `attacksPerRound` | 기본 공격을 여러 번 반복한다. |
| `onHitEffect` | 기본 공격 명중 시 감염/방사능 등을 적용한다. |
| `statusInflict` | 기본 공격 명중 시 플레이어 상태이상을 적용한다. |
| `infectionChance` | 기본 공격 명중 시 감염 수치를 확률로 올린다. |
| `regeneration` | 보스 턴 시작 시 HP를 회복한다. |
| `phaseThresholds` | 체력 비율이 기준 이하가 되면 1회만 발동한다. |
| `summon` | 페이즈 발동 시 지정 적을 소환한다. |
| `aoeAttack` | 페이즈 발동 시 플레이어와 살아있는 동료 전체에게 광역 피해를 준다. |

## 삭제/비활성 처리된 저완성도 적

다음 8종은 현재 활성 적 등록에서 제외되어 `GameData.enemies`에 들어가지 않는다.

| ID | 삭제 이유 | 대체/후속 방향 |
|---|---|---|
| `food_raider` | 일반 `raider`와 역할 차별성이 약함 | `food_warlord`의 소환 대상은 일반 `raider`로 대체 |
| `black_market_dealer` | 거래/기습 이벤트 성격인데 전투 보스로는 패턴 완성도가 낮음 | 비전투 상인 이벤트로 재검토 |
| `boss_summer_inferno` | 폭염/자폭 콘셉트가 `zombie_bloater`와 겹침 | 폭염 전장 규칙 이후 재기획 |
| `boss_monsoon_leviathan` | 침수/구조물 파괴가 실제 전장 상태로 남지 않음 | 침수 전장 시스템 이후 재기획 |
| `boss_acid_rain_horror` | 산성비와 장비 부식이 약하고 `boss_acid_queen`과 중복 | 산성 계열은 `boss_acid_queen`으로 집중 |
| `boss_train_conductor` | 열차/레일 위치 규칙이 없음 | 전장 레인/돌진 규칙 이후 재기획 |
| `boss_military_ai` | EMP/전자장비 봉쇄가 상태이상 수준에 머묾 | 전자 장비 태그와 봉쇄 규칙 이후 재기획 |
| `boss_engineer_rival` | 터렛이 별도 소환체/전장 장치로 남지 않음 | 터렛 오브젝트 구현 후 재기획 |

## 현재 구현 한계와 후속 과제

1. `boss_phantom_sniper`: 데이터의 처형/저격 콘셉트는 있으나 HP 임계 처형 로직은 별도 구현이 필요하다.
2. `boss_acid_queen`: `durabilityLoss`는 상태 효과 데이터에 있으나 장비 내구도 감소와 직접 연결되지 않았다.
3. `boss_escaped_experiment`: `resistance_shift`는 스킬로 등록되어 있으나 최근 받은 피해 속성에 따라 저항을 바꾸는 전용 로직은 아직 약하다.
4. `food_warlord`: 기아 상태는 들어가지만 식량 카드 약탈/잠금/오염 같은 자원 압박 패턴은 별도 구현이 필요하다.
5. `boss_blizzard_wraith`: 동상/체온 저하는 있으나 무기 동결, 행동 지연 같은 전용 행동 제한은 추가 구현이 필요하다.
