# 몬스터 핵심 패턴

> 출처: `js/data/enemies.js` (정의·등장 테이블) + `js/systems/CombatSystem.js` (소비 로직) + `js/data/gameBalance.js` (수치 상수)
> 기준: 실제 파일 대조. 추측 없음. 수치는 데이터 원본 인용.

---

## 1. 개요

현재 몬스터는 **12종**이며, type 3분류로 갈린다.

| type | 몬스터 | 정체성 |
|------|--------|--------|
| `zombie` | 9종 | 물량·디버프·타이밍 위협 |
| `human` | 2종 (raider, raider_elite) | 고스탯·사기(morale)·총기 소음 |
| `animal` | 1종 (rabid_dog) | 고속 다단 공격 |

차별화 핵심 축 5가지: **①AI 타겟팅 패턴 ②타이밍 위협(충전형) ③다단 공격 ④명중/처치 시 디버프 ⑤약점·저항**.

---

## 2. 몬스터 일람

| ID | 이름 | type | HP | defense | aiPattern | 핵심 기믹 |
|----|------|------|----|---------|-----------|-----------|
| `zombie_patient_dormant` | 잠복 환자 좀비 | zombie | 18–30 | 0 | aggressive | 기습형 약체 (병원 야간 진입) |
| `zombie_common` | 감염 좀비 | zombie | 25–40 | 0 | normal | 기본형 |
| `zombie_runner` | 러너 좀비 | zombie | 18–28 | 0 | aggressive | 명중 시 출혈(bleed 3턴) |
| `zombie_brute` | 거대 좀비 | zombie | 75–110 | 3 | defensive | 강타 스킬(쿨3·기절50%), blunt/blade 저항 |
| `zombie_horde` | 좀비 무리 | zombie | 100–145 | 0 | horde | attacksPerRound 2 |
| `zombie_acid` | 특수 감염자 | zombie | 38–60 | 0 | normal | onHitEffect(감염+15·방사선+8), acid_burn 부여 |
| `zombie_bloater` | 블로터 | zombie | 45–65 | 0 | normal | timedThreat: self_destruct (3턴 자폭) |
| `zombie_screamer` | 스크리머 | zombie | 30–45 | 0 | normal | timedThreat: summon_horde (2턴 증원) |
| `zombie_charger` | 돌진자 | zombie | 35–55 | 1 | aggressive | timedThreat: charge_strike (1턴 강타) |
| `rabid_dog` | 광견병 걸린 개 | animal | 20–35 | 0 | aggressive | attacksPerRound 2 + 출혈 + onHitEffect(감염+5) |
| `raider` | 약탈자 | human | 35–55 | 2 | aggressive | morale 80–120, bullet 저항, 소음 25 |
| `raider_elite` | 정예 약탈자 | human | 55–80 | 4 | aggressive | morale 110–150, 정조준 스킬(쿨3), bullet/blade 저항 |

---

## 3. 핵심 메커닉 패턴

### ① AI 타겟팅 패턴 (`aiPattern`)

`CombatSystem.js:811 _pickTargetByPattern` — 적이 매 턴 타겟을 결정하는 분기.

| 패턴 | 동작 | 사용 몬스터 |
|------|------|-------------|
| `aggressive` | HP **비율 최저** 대상 우선 (파티 마무리) | patient_dormant, runner, charger, rabid_dog, raider, raider_elite |
| `normal` | 플레이어 고정 | common, acid, bloater, screamer |
| `defensive` | **원거리 무기 든 플레이어** 우선 | brute |
| `horde` | 무작위 대상 | horde |
| `sniper` | 힐러 클래스 동료 우선 → 플레이어 | ⚠️ **미사용** (코드만 존재) |
| `predator` | 상태이상(bleed/infection/burn/acid_burn) 대상 우선 | ⚠️ **미사용** (코드만 존재) |

> `sniper`/`predator`는 구현되어 있으나 현재 어떤 몬스터도 채택하지 않음 → **코드 수정 없이 신규 행동 몬스터 추가 가능**.

### ② 타이밍 위협 (`timedThreat`)

`_chargeRemaining` 카운트다운 후 `CombatSystem.js:1050 _resolveTimedThreat` 발동. 수치는 `gameBalance.js combat.timedThreats`.

| 위협 ID | 몬스터 | 충전 | 발동 효과 | 카운터 |
|---------|--------|------|-----------|--------|
| `self_destruct` | 블로터 | 3턴 | 광역 피해 25–40 + 감염운 15 (플레이어+동료), 자폭사 | **약점 무기(fire/explosive)로 처치** 시 자폭 무력화 (`cleanKill`, 1246). 시체 폭발 8–14 |
| `summon_horde` | 스크리머 | 2턴 | 적 1–2마리 증원 + 소음 25 | **무음(silent) 처치** 시 봉쇄 (1256) / 기절로 지연 |
| `charge_strike` | 돌진자 | 1턴 | 강타 30–45 + 기절 1턴 (방어 시 카운터 ×2.0) | **충전 중 기절**시키면 카운트 리셋 (`stunDelays`, 449) |

> 공통 카운터 키: `counters.weakness / silentSuppress / stunDelays`. **처치 방식·무음·기절** 이라는 서로 다른 대응을 요구해 무기/스텔스 빌드 선택을 유도한다.

### ③ 다단 공격 (`attacksPerRound`)

`CombatSystem.js:1041` — 한 라운드에 N회 연속 공격. 저데미지·고빈도 위협.

- `zombie_horde` = 2회 (damage 6–12)
- `rabid_dog` = 2회 (damage 8–14)

### ④ 명중/처치 시 디버프

| 필드 | 동작 | 보유 몬스터 |
|------|------|-------------|
| `statusInflict` | 공격 명중 시 지속 디버프 부여 | runner(bleed), rabid_dog(bleed), acid(acid_burn) |
| `onHitEffect` | 명중 즉시 스탯 변동 (감염·방사선) — 1177 | acid(감염+15·방사선+8), rabid_dog(감염+5) |
| `infectionChance` | 라운드별 감염 판정 (0.20~0.45) — 1189 | 좀비·개 전반 (인간은 0) |

> `doctor` 직업은 감염 확률을 별도 보정한다 (`CombatSystem.js:1329`).

### ⑤ 약점·저항 (`weaknesses` / `resistances`)

`CombatSystem.js:420` — 무기 데미지 타입별 배수 적용.

- 데미지 타입: `blade` / `bullet` / `fire` / `blunt` / `explosive`
- 좀비 다수: **fire 약점** 공통
- 인간 약탈자: **bullet 저항 / blade 약점** (총격전보다 근접 유리)
- 거대 좀비: blunt·blade 저항 (fire/explosive로만 효율적)

### ⑥ 특수 스킬 (`specialSkills`)

쿨다운 기반 강공격. `_skillCooldowns`로 관리, 쿨 0이면 의도 예고에 표시 (`CombatSystem.js:884`).

| 몬스터 | 스킬 | 데미지 | 쿨다운 | 부가 |
|--------|------|--------|--------|------|
| zombie_brute | 강타(slam) | 30–45 | 3 | 기절 50% |
| raider_elite | 정조준(aimed_shot) | 25–40 | 3 | 기절 30% |

### ⑦ 인간 전용 — 사기(morale)

`type:'human'`만 `morale` 보유. `instantiateEnemy`(393)가 `currentMorale` 초기화. 사기 격파 시 패주(`gameBalance.js combat.moraleBreak`: 치명타 -25, 아군 사망 -30, 패주 시 루팅 ×0.5).

---

## 4. 등장 로직 (스폰 패턴)

### 위험도별 인카운터 테이블 (`ENCOUNTER_TABLES`)

`enemies.js:337` — 노드 위험도(DL) 1~5별 가중치 풀. 고위험일수록 약체 제거, 강적 비중 증가.

| DL | 성격 | 주력 (높은 가중치) |
|----|------|--------------------|
| 1 | 안전 구역 | zombie_common(65), rabid_dog(20) — 특수 감염자 5% 드묾 |
| 2 | 보통 구역 | common(30), runner(25), raider(20) |
| 3 | 위험 구역 | runner(20), brute/acid/raider(각15) + 타이밍 위협 3종 등장 |
| 4 | 고위험 구역 | brute(25), horde(20), 타이밍 위협 빈출, 정예 약탈자(15) |
| 5 | 극위험 구역 | brute(30), horde(30), raider_elite(20) — 약체 거의 없음 |

### 소음 연동 그룹 생성 (`rollEnemyGroup`)

`enemies.js:429` — **소음이 적 수와 강도를 결정**. 스텔스 플레이의 핵심 보상 구조.

| 소음 수치 | 적 수 | 유효 위험도 |
|-----------|-------|-------------|
| 0–29 | 1마리 | DL −1 (약한 적) |
| 30–64 | 2마리 | DL 그대로 |
| 65+ | 3마리 | DL +1 (강한 적) |

> 공격마다 `noiseOnAttack`이 누적되며 (총기 25, 좀비 3~10), 소음이 다음 인카운터 난이도로 직결된다.

### 인스턴스화 (`instantiateEnemy`)

`enemies.js:393` — HP 범위 내 난수 1회 고정(`currentHp`=`maxHp`), `_skillCooldowns`/`_statusEffects` 초기화, 타이밍 위협 `_chargeRemaining` 세팅, 인간은 `currentMorale` 부여.

---

## 5. 설계 관점 요약

- **좀비**: 물량(horde)·디버프(acid·runner)·타이밍 위협(bloater·screamer·charger)으로 다양성 확보. fire 약점 공통.
- **인간(약탈자)**: 고스탯 + morale 격파 + 총기 소음 트레이드오프. bullet 저항으로 근접 유도.
- **동물(개)**: 고속 2단 공격 + 감염 누적.
- 가장 정교한 축은 **타이밍 위협 3종** — 각각 *약점 무기 처치·무음·기절* 이라는 다른 카운터를 요구.
- **확장 여지**: `sniper`/`predator` AI 패턴이 코드에 구현됐으나 미사용 → 데이터만 추가하면 신규 행동 몬스터 즉시 가능.

---

*문서 끝. 신규 몬스터 추가 시 `enemies.js` `ENEMIES` + `ENCOUNTER_TABLES` 등록, 타이밍 위협 도입 시 `gameBalance.js combat.timedThreats` + `CombatSystem.js _resolveTimedThreat` 분기 추가 필요.*
