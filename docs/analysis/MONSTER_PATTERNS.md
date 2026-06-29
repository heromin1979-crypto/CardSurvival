# 몬스터 리스트, 설정, 공격 패턴 정리

작성 기준: 현재 코드 기준

- 일반 몬스터 데이터: `js/data/enemies.js`
- 시크릿 보스 데이터: `js/data/secretEnemies.js`
- 통합 등록: `js/data/GameData.js`
- 전투 AI 실행부: `js/systems/CombatSystem.js`
- 보스 발견/스폰/보상 처리: `js/systems/HiddenElementSystem.js`

## 전체 구성

현재 `GameData.enemies`에는 일반 적 12종과 시크릿 보스 21종, 총 33종이 등록된다.

| 구분 | 수 | 소스 | 비고 |
|---|---:|---|---|
| 일반 전투 몬스터 | 12 | `ENEMIES` | 위험도/소음 기반 랜덤 조우 |
| 시크릿 보스 | 21 | `SECRET_ENEMIES` | 지역, 날짜, 계절, 날씨, 캐릭터, 숨겨진 장소 조건 |
| 합계 | 33 | `GameData.enemies` | `GameData.js`에서 병합 |

## 일반 몬스터 12종

| ID | 타입 | HP | 공격 | 방어 | XP | AI | 핵심 패턴 |
|---|---|---:|---|---:|---:|---|---|
| `zombie_patient_dormant` | zombie | 18-30 | 10-16 / 65% | 0 | 14 | aggressive | 병원 기습형, 감염 25%, blade/fire 약점 |
| `zombie_common` | zombie | 25-40 | 8-15 / 60% | 0 | 10 | normal | 기본 좀비, 감염 20%, fire/blade 약점 |
| `zombie_runner` | zombie | 18-28 | 12-20 / 75% | 0 | 18 | aggressive | 빠른 전열 근접, 출혈 3턴, 감염 30% |
| `zombie_brute` | zombie | 75-110 | 20-35 / 55% | 3 | 40 | defensive | 높은 체력, `slam`, blunt/blade 저항 |
| `raider` | human | 35-55 | 14-22 / 68% | 2 | 25 | aggressive | 원거리 인간 적, morale 데이터 보유 |
| `raider_elite` | human | 55-80 | 18-28 / 72% | 4 | 45 | sniper | 후열 저격, healer 우선, `aimed_shot` |
| `zombie_horde` | zombie | 100-145 | 6-12 / 65% | 0 | 35 | horde | 라운드당 2회 공격, 감염 30% |
| `rabid_dog` | animal | 20-35 | 8-14 / 72% | 0 | 15 | aggressive | 라운드당 2회 공격, 출혈 2턴 |
| `zombie_acid` | zombie | 38-60 | 8-14 / 72% | 0 | 30 | predator | 후열 원거리 산성 피해, 감염/방사능 보정 |
| `zombie_bloater` | zombie | 45-65 | 4-8 / 55% | 0 | 32 | normal | `timedThreat: self_destruct`, 3턴 후 폭발 |
| `zombie_screamer` | zombie | 30-45 | 5-9 / 60% | 0 | 28 | normal | `timedThreat: summon_horde`, 3턴 후 증원 |
| `zombie_charger` | zombie | 35-55 | 6-10 / 60% | 1 | 30 | aggressive | `timedThreat: charge_strike`, 1턴 후 강타 |

## 시크릿 보스 21종

| ID | 타입 | HP | 공격 | 방어 | XP | AI | 핵심 패턴 |
|---|---|---:|---|---:|---:|---|---|
| `boss_patient_zero` | zombie | 200 | 30-50 / 70% | 3 | 200 | aggressive | 재생 10, `viral_burst`, 감염 on-hit |
| `boss_radiation_colossus` | zombie | 350 | 40-65 / 55% | 8 | 350 | defensive | `ground_slam`, 방사능 on-hit, AOE |
| `boss_acid_queen` | zombie | 180 | 25-40 / 72% | 2 | 180 | aggressive | `acid_spray`, `acid_pool`, 부식 |
| `boss_horde_mother` | zombie | 250 | 20-35 / 65% | 4 | 250 | horde | `screech`, 체력 구간 소환 |
| `boss_frozen_giant` | zombie | 300 | 35-55 / 55% | 10 | 300 | defensive | `frost_breath`, `ice_armor`, 체온 저하 |
| `boss_raider_warlord` | human | 150 | 30-50 / 75% | 5 | 200 | aggressive | `aimed_barrage`, `call_reinforcements` |
| `boss_phantom_sniper` | human | 80 | 50-80 / 85% | 2 | 250 | defensive | `headshot`, `camouflage`, 저격형 보스 |
| `boss_cult_leader` | human | 120 | 20-35 / 70% | 3 | 220 | normal | `fanatic_bomb`, `sermon`, 공포 |
| `boss_mutant_alpha_tiger` | animal | 220 | 35-55 / 80% | 4 | 220 | aggressive | 라운드당 2회 공격, `pounce`, `roar` |
| `boss_sewer_king` | animal | 280 | 30-50 / 65% | 7 | 280 | defensive | `death_roll`, `submerge`, 감염 상처 |
| `boss_swarm_queen_bee` | animal | 100 | 15-25 / 80% | 1 | 160 | aggressive | 라운드당 3회 공격, 독, 회복 |
| `boss_feral_dog_alpha` | animal | 160 | 25-40 / 80% | 2 | 160 | aggressive | 무리 소환, `pack_howl`, `frenzy` |
| `boss_penthouse_survivor` | human | 100 | 40-60 / 70% | 3 | 200 | aggressive | 2회 공격, `golden_gun`, 경호원 소환 |
| `boss_escaped_experiment` | zombie | 400 | 30-45 / 70% | 5 | 500 | aggressive | 재생 15, `resistance_shift`, `toxic_blood` |
| `boss_blizzard_wraith` | zombie | 160 | 25-40 / 75% | 3 | 200 | aggressive | `frost_touch`, `blizzard_cloak`, 동결 |
| `boss_soldier_nemesis` | human | 160 | 35-55 / 78% | 5 | 230 | aggressive | `flashbang`, 탈영병 소환 |
| `boss_firefighter_nemesis` | zombie | 200 | 30-45 / 70% | 4 | 240 | aggressive | 재생 5, `fire_axe`, `burning_charge` |
| `boss_homeless_nemesis` | human | 120 | 25-45 / 75% | 3 | 200 | aggressive | `intimidate`, 불량배 소환 |
| `boss_chef_nemesis` | zombie | 150 | 22-38 / 74% | 2 | 220 | normal | `cleaver_slash`, `boiling_splash` |
| `boss_doctor_nemesis` | zombie | 180 | 25-40 / 75% | 3 | 250 | aggressive | `surgical_strike`, `inject_virus` |
| `food_warlord` | human | 200 | 25-40 / 75% | 6 | 260 | aggressive | `starvation_strike`, `call_raiders`, 일반 `raider` 소환 |

## 삭제 처리한 저완성도 적

다음 8종은 활성 적 등록에서 제거했다. 이유는 전투 규칙이 아직 충분히 구현되지 않았거나, 역할이 기존 적과 겹치거나, 별도 보스로 유지할 완성도가 낮았기 때문이다.

| ID | 삭제 이유 | 대체/후속 방향 |
|---|---|---|
| `food_raider` | 셰프 이벤트용 특수 적이지만 일반 `raider`와 차별성이 약함 | `food_warlord`의 소환 대상은 일반 `raider`로 대체 |
| `black_market_dealer` | 거래/기습 이벤트 성격인데 전투 보스로는 패턴 완성도가 낮음 | 상인 이벤트 시스템이 생길 때 비전투 NPC로 재검토 |
| `boss_summer_inferno` | 폭염/자폭 콘셉트가 `zombie_bloater`와 겹치고 전용 timed threat가 없음 | 폭염 전장 규칙이 생기면 재기획 |
| `boss_monsoon_leviathan` | 홍수/구조물 파괴가 실제 전장 상태로 남지 않음 | 침수 전장/구조물 내구도 시스템 이후 재기획 |
| `boss_acid_rain_horror` | 산성비와 장비 부식이 약하고 `boss_acid_queen`과 역할 중복 | 산성 계열은 `boss_acid_queen`으로 집중 |
| `boss_train_conductor` | 열차/레일 위치 규칙이 없어 콘셉트가 전투에서 충분히 드러나지 않음 | 전장 레인/돌진 규칙이 생기면 재기획 |
| `boss_military_ai` | EMP/전자장비 봉쇄가 상태이상 수준에 머묾 | 전자 장비 태그와 봉쇄 규칙 이후 재기획 |
| `boss_engineer_rival` | 터렛이 별도 소환체/전장 장치로 남지 않음 | 터렛 오브젝트 구현 후 재기획 |

## 실제 AI 처리 흐름

`CombatSystem._decideNextIntent()`는 적의 다음 행동 의도를 만들고, 대상 선택은 `aiPattern`으로 결정한다.

| AI 패턴 | 실제 대상 선택 기준 |
|---|---|
| `normal` | 플레이어 우선 |
| `aggressive` | 플레이어와 동료 중 HP 비율이 가장 낮은 대상 |
| `defensive` | 원거리 무기를 든 플레이어 우선, 없으면 플레이어 |
| `horde` | 플레이어/동료 중 무작위 |
| `sniper` | healer 동료 우선, 없으면 플레이어 |
| `predator` | 출혈/감염/화상/산성 피해 상태 대상 우선, 없으면 플레이어 |

## 구현된 보스 효과

현재 전투 로직에 연결된 주요 효과는 다음과 같다.

| 데이터 필드 | 실제 처리 |
|---|---|
| `specialSkills[].damage`, `cooldown`, `stunChance` | `_runEnemyAI()`에서 사용 |
| `specialSkills[].effect` | `_applyEnemySkillEffect()`에서 회복, 소환, DOT, 중독, 감염/방사능/체온, 기절, 스태미나/사기 감소, 방어 증가, 회피, 무적, 다단/연속 사격, AOE 일부 처리 |
| `attacksPerRound` | `_runEnemyAI()`에서 기본 공격 반복 |
| `onHitEffect` | `_enemyAttack()`에서 감염/방사능 적용 |
| `statusInflict` | `_enemyAttack()`에서 플레이어 상태이상 적용 |
| `infectionChance` | `_enemyAttack()`에서 감염 확률 보정 |
| `timedThreat` | 일반 몬스터 3종에서 처리 |
| `regeneration` | `_applyEnemyTurnStartTraits()`에서 보스 턴 시작 시 회복 |
| `phaseThresholds` | `_applyBossPhaseTriggers()`에서 체력 구간 1회성 트리거 |
| `summon` | 체력 구간 진입 시 지정 적 소환 |
| `aoeAttack` | 체력 구간 진입 시 파티 광역 피해 |

## 남은 기획 과제

삭제 후에도 남은 보스 중 일부는 추가 구현 여지가 있다.

1. `boss_phantom_sniper`: `executeThreshold`를 처형/치명 저격 패턴으로 연결
2. `boss_acid_queen`: `durabilityLoss`를 장착 방어구/무기 내구도에 적용
3. `boss_escaped_experiment`: `resistance_shift`를 받은 피해 속성에 대한 저항 변화로 연결
4. `food_warlord`: 식량 카드 약탈/잠금/오염 같은 자원 압박 패턴 추가
5. `boss_blizzard_wraith`: 무기 동결/행동 지연을 실제 행동 제한으로 연결
