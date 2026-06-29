# 몬스터 패턴 점수 평가 및 개선/삭제 이력

작성 기준: `js/data/enemies.js`, `js/data/secretEnemies.js`, `js/systems/CombatSystem.js`

## 평가 기준

10점 만점으로 평가했다.

| 항목 | 배점 | 기준 |
|---|---:|---|
| 콘셉트 적합도 | 3 | 이름, 타입, 스폰 조건, 행동이 설정과 맞는가 |
| 유니크 패턴 | 3 | 다른 적과 구분되는 전투 규칙이 있는가 |
| 대응법/카운터 | 2 | 플레이어가 행동으로 대응할 여지가 있는가 |
| 실제 구현 체감 | 2 | 데이터가 실제 전투 로직에서 실행되는가 |

## 총평

일반 몬스터 12종은 역할 구분이 비교적 명확하다. 특히 `zombie_bloater`, `zombie_screamer`, `zombie_charger`는 timed threat가 있어 대응법이 분명하다.

시크릿 보스는 기존 29종에서 21종으로 줄였다. 완성도가 낮고 실제 전투에서 개성이 충분히 드러나지 않는 8종은 과감히 삭제했다. 남긴 보스는 현재 구현된 효과 처리와 연결되거나, 숨겨진 장소/캐릭터 전용 보스로 유지 가치가 있는 적들이다.

## 삭제 처리한 저완성도 적

| ID | 기존 판단 | 처리 |
|---|---|---|
| `food_raider` | 일반 `raider`와 전투 역할이 거의 겹침 | 삭제, `food_warlord` 소환은 `raider`로 대체 |
| `black_market_dealer` | 거래 이벤트 콘셉트가 강하고 전투 보스로는 낮은 완성도 | 삭제 |
| `boss_summer_inferno` | 폭염/자폭이 기존 자폭 좀비와 겹침 | 삭제 |
| `boss_monsoon_leviathan` | 홍수/구조물 파괴가 실제 전장 상태로 구현되지 않음 | 삭제 |
| `boss_acid_rain_horror` | 산성비/부식이 약하고 `boss_acid_queen`과 중복 | 삭제 |
| `boss_train_conductor` | 열차 레일/위치 이동 규칙이 없어 콘셉트 체감이 약함 | 삭제 |
| `boss_military_ai` | EMP와 전자장비 봉쇄가 전투 시스템에서 충분히 구현되지 않음 | 삭제 |
| `boss_engineer_rival` | 터렛이 별도 전장 장치로 남지 않아 핵심 패턴이 미완성 | 삭제 |

## 일반 몬스터 평가

| ID | 점수 | 평가 |
|---|---:|---|
| `zombie_patient_dormant` | 6.5 | 병원 기습 콘셉트는 있으나 일반 전투에서 러너와 구분은 약하다. |
| `zombie_common` | 5.0 | 기본 몬스터로 적절하다. 낮은 개성은 역할상 문제 없음. |
| `zombie_runner` | 7.0 | 빠른 출혈 압박이 명확하다. |
| `zombie_brute` | 7.5 | 높은 HP/방어, 강타, 저항이 역할과 맞는다. |
| `raider` | 7.0 | 원거리 사기/소음으로 인간 적의 역할이 있다. |
| `raider_elite` | 8.0 | 후열 저격과 healer 우선 타겟팅으로 존재감이 있다. |
| `zombie_horde` | 7.5 | 2회 공격과 무작위 타겟으로 무리 압박을 만든다. |
| `rabid_dog` | 7.5 | 2회 공격, 출혈, 감염이 동물형 위협과 맞는다. |
| `zombie_acid` | 8.0 | 후열 원거리 predator AI와 산성/감염/방사능 보정이 좋다. |
| `zombie_bloater` | 8.5 | 3턴 자폭, 약점 처치, 시체 폭발이 명확하다. |
| `zombie_screamer` | 8.5 | 증원 카운트다운과 무음 처치 보상이 좋다. |
| `zombie_charger` | 8.0 | 1턴 예고 강타와 기절 카운터가 직관적이다. |

## 유지 보스 평가

| ID | 현재 점수 | 목표 점수 | 평가 및 다음 개선 방향 |
|---|---:|---:|---|
| `boss_patient_zero` | 6.5 | 8.0 | 재생, 감염 폭발, 바이러스 레이어가 체감된다. 전용 페이즈 연출이 있으면 더 좋다. |
| `boss_radiation_colossus` | 6.0 | 7.5 | 방사능 on-hit와 기절 강타가 좋다. 방사능 지속 지대가 있으면 강해진다. |
| `boss_acid_queen` | 6.5 | 8.0 | 산성 DOT와 장비 손상 데이터가 있다. 내구도 손상 연결이 필요하다. |
| `boss_horde_mother` | 6.5 | 8.5 | 소환형 보스로 개선 효과가 크다. 체력 구간 소환으로 정체성이 명확하다. |
| `boss_frozen_giant` | 6.0 | 8.0 | 체온 저하, 방어 강화, 기절이 작동한다. 겨울/눈보라 보스 콘셉트와 맞다. |
| `boss_raider_warlord` | 6.5 | 8.5 | 지원군 호출과 강한 사격이 살아났다. 인간형 보스 사기 초기화는 추가 확인 필요. |
| `boss_phantom_sniper` | 6.0 | 7.5 | 고명중 저격과 회피 버프가 작동한다. `executeThreshold` 연결이 필요하다. |
| `boss_cult_leader` | 5.5 | 8.0 | 자폭 유도 AOE와 공포 회복이 살아났다. 공포/사기 연동을 더하면 좋아진다. |
| `boss_mutant_alpha_tiger` | 7.0 | 8.0 | 2회 공격, 도약, 포효 기절, 다단 효과가 맞다. |
| `boss_sewer_king` | 6.0 | 8.0 | death roll 다단, 잠수 회복/무적이 살아났다. 비 오는 하수도 보스답다. |
| `boss_swarm_queen_bee` | 7.0 | 8.5 | 3회 공격, 독 구름, 회복으로 swarm 콘셉트가 선명하다. |
| `boss_feral_dog_alpha` | 7.5 | 8.5 | 무리 소환과 광분 다단 공격이 잘 맞는다. |
| `boss_penthouse_survivor` | 7.0 | 8.5 | 2회 공격, 황금총 doubleShot, 경호원 호출로 인간 보스 개성이 좋다. |
| `boss_escaped_experiment` | 7.0 | 8.0 | 높은 체력, 재생, 감염, 독성 혈액이 살아있다. 저항 변화 구현이 남았다. |
| `boss_blizzard_wraith` | 6.0 | 8.0 | 냉기, 회피 망토, 무기 동결 콘셉트가 좋다. 무기 동결은 후속 구현 필요. |
| `boss_soldier_nemesis` | 6.0 | 8.0 | 섬광탄 기절과 탈영병 호출이 살아있다. 군인 캐릭터 네메시스답다. |
| `boss_firefighter_nemesis` | 6.5 | 8.0 | 화염도끼, 돌진, 화상, 재생이 맞다. 화염 지속 패턴이 있으면 더 좋다. |
| `boss_homeless_nemesis` | 5.5 | 7.5 | 협박 사기 감소와 부하 호출이 살아있다. 빚/공포 자원 압박을 더하면 좋다. |
| `boss_chef_nemesis` | 6.5 | 8.0 | 식칼 출혈, 끓는 액체 DOT/AOE가 살아있다. 식량 오염 패턴을 추가하면 좋다. |
| `boss_doctor_nemesis` | 6.5 | 8.0 | 감염 주입과 외과 공격이 명확하다. 치료 방해 패턴을 추가하면 더 독특하다. |
| `food_warlord` | 6.0 | 8.0 | 식량 약탈단 호출과 굶주림 압박이 살아있다. 식량 카드 강탈 패턴이 필요하다. |

## 우선 개선 대상

| 우선순위 | 대상 | 이유 | 다음 개선 |
|---:|---|---|---|
| 1 | `boss_phantom_sniper` | `headshot.executeThreshold`가 즉사/처형 패턴으로 처리되지 않는다. | HP 30% 이하 대상에게 추가 피해 또는 처형 판정 |
| 2 | `boss_acid_queen` | 산성/부식 콘셉트인데 장비 내구도 손상이 약하다. | `durabilityLoss`를 장착 방어구/무기 내구도에 적용 |
| 3 | `boss_escaped_experiment` | `resistance_shift`가 아직 저항 변화로 작동하지 않는다. | 받은 피해 속성에 대한 저항을 올리는 페이즈 패턴 |
| 4 | `food_warlord` | 굶주림 보스인데 식량 자원 압박이 부족하다. | 인벤토리/바닥의 식량 카드 훔치기 또는 오염 |
| 5 | `boss_blizzard_wraith` | 무기 동결 데이터가 행동 제한으로 이어지지 않는다. | 공격/무기 사용 지연 또는 명중률 감소 |

## 이번 코드 개선으로 실제 추가된 처리

`js/systems/CombatSystem.js`에 다음 처리가 연결되어 있다.

- `_applyEnemySkillEffect()`: 보스 특수기 `effect` 공통 처리
- `_applyEnemyTurnStartTraits()`: 보스 재생과 페이즈 트리거 처리
- `_applyBossPhaseTriggers()`: 체력 구간 진입 시 1회성 소환/AOE/쿨다운 초기화
- `_applyEnemyAoeAttack()`: 보스 광역 공격 처리
- `_summonEnemyById()`: 지정 ID 기반 지원군 소환

검증 테스트:

- `tests/unit/CombatBossPatterns.test.js`
- `tests/unit/SecretEnemiesCuration.test.js`
