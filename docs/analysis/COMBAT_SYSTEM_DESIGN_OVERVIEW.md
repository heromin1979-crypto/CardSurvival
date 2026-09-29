# 전투 시스템 기획 정리 (구현 기준)

> 최종 갱신: 2026-09-29 · 기준 커밋 `69e7645` (브랜치 `codex/career-progression`)
> 이전 판(2026-06-29)은 "플레이어 1인 + 전열/후열" 구조를 설명했다. 그 뒤 **4칸 진형·최대 3인 직접 조작·스킬 바·토큰·스트레스·죽음의 문턱** 구조로 개편됐고(설계: `docs/superpowers/specs/2026-06-15-seoul-rank-combat-overhaul-design.md`), 2026-09-26에 **전투 연출 개선**(파티클·타격감·날씨/광원)이 들어갔다. 이 문서는 현재 코드가 실제로 하는 일을 적는다.

주요 파일:

| 영역 | 파일 |
| --- | --- |
| 전투 흐름·턴·판정(허브) | `js/systems/CombatSystem.js` (+ 믹스인 `combat/CombatAiTurns.js`, `combat/CombatRankedEffects.js`) |
| 진형·이니셔티브·전투원 | `combat/FormationSystem.js`, `combat/InitiativeSystem.js`, `combat/CombatantAdapter.js`, `combat/EnemyCombatAdapter.js` |
| 스킬·아이템 | `js/data/combatSkills.js`, `combat/CombatSkillSystem.js` |
| 판정 수학(순수 함수) | `combat/CombatResolution.js` |
| 상태이상·토큰·피해·스트레스 | `combat/CombatStatusSystem.js` |
| 적 의도·실행·보스 | `combat/EnemyActionPlanner.js`, `combat/EnemyActionExecutor.js`, `combat/BossPatternController.js` |
| 관계 반응 | `combat/RelationshipCombatSystem.js` |
| 탄창·장전 | `js/systems/WeaponAmmoSystem.js` |
| 수치 | `js/data/gameBalance.js` → `combat` |
| 적 데이터 | `js/data/enemies.js`(일반 12종 + 조우 테이블), `js/data/secretEnemies.js`(보스·희귀 42종, 보스 패턴 21종) |
| 화면 | `js/ui/CombatUI.js`, `css/screens-combat.css` |
| 연출 | `js/ui/combat/CombatFxPlayer.js`, `CombatFxCanvas.js`, `CombatStageRenderer.js`, `js/ui/combat/fx/*`, `js/data/combatFxConfig.js` |

---

## 1. 한눈에 보기

- **턴제 진형 전투.** 아군(플레이어 + 동료 최대 2명)과 적이 각각 **4칸 진형**에 선다. 화면 왼쪽이 아군(`4·3·2·1`), 오른쪽이 적(`1·2·3·4`).
- **라운드마다 이니셔티브를 굴려** 행동 순서를 정한다(`speed + 0~3`).
- 아군은 **플레이어와 동료 모두 직접 조작**한다. 각자 스킬 바에서 스킬을 고르고 → 대상을 고르고 → 확정한다.
- 스킬마다 **사용 가능 위치(`usableFrom`)와 대상 위치(`target.ranks`)**가 있어 자리 선정이 곧 전술이다.
- 적은 **다음 행동(의도)을 미리 공개**한다(Into the Breach 방식). 보스는 체력이 30% 이하가 되면 궁극기를 예고한다.
- 1회성 **토큰**(막기·회피·강화·표식 등), **스트레스(0~10)**, **죽음의 문턱**이 단기 전술과 생존 상태를 잇는다.
- 소음·탄약·내구도·감염·스태미나 같은 **생존 자원이 스킬 비용**으로 붙는다.

## 2. 전투 진입

- 시작점: 상태 전환이 `combat`이 되면 `CombatSystem._setupCombat(data)`.
- 적 목록: `data.enemies`가 있으면 그대로 쓰고, 없으면 `rollEnemyGroup(위험도, 소음, 파티 규모)`로 생성. 위험도 기본값 2.
- 전투 시작 문구는 일반 / 호드 웨이브 / 약탈자 습격으로 갈린다. 캐릭터 전투 시작 대사도 이때 나간다.
- 진입 함정: 보드에 내구도가 남은 `subtype: 'trap'` 카드가 있으면 첫 적에게 `onTrigger` 피해·출혈을 준다(`_triggerCombatEntryTraps`).
- `data.ambushFailed`(선제 제압 실패)면 첫 행동 전에 적이 먼저 반응한다.
- 랭크 전투 상태 구성(`_setupRankedCombatState`):
  - `combatants` — 플레이어, 살아 있는 동료 **최대 2명**(`gs.companions` 앞에서부터), 적. 각자 `hp·speed·stress·tokens·deathsDoor·deathResist`를 가진다.
  - `formations` — 아군은 1랭크부터 빈칸 없이, 적은 적 데이터 순서대로 배치.
  - 모든 적이 첫 의도를 정한다.
- 전투 배경: `combatAssets.js`의 `scenes`. 현재 `GameState.combat.sceneId`를 정하는 코드가 없어 **항상 `jongno_subway_ruin`(종로 지하철)**. 실외 `overpass_rail`은 등록만 돼 있다.

## 3. 진형 규칙 (`FormationSystem`)

| 규칙 | 내용 |
| --- | --- |
| 칸 수 | 양 진영 4칸 |
| 아군 빈칸 | 이동·밀치기·당기기·사망으로 생긴 빈칸을 **자동으로 메우지 않는다**. 되돌리려면 `reposition` 등 이동 스킬을 쓴다 |
| 적 빈칸 | 적이 죽으면 살아 있는 적을 앞으로 당겨 **압축한다**(`compactEnemyFormation`) |
| 이동 | 다른 전투원을 통과하지 않는다. 목적지가 비어 있을 때만 이동 |
| 위치 검증 | `validateSkillPosition` — 사용자 랭크가 `usableFrom`에, 대상 랭크가 `target.ranks`에 들어야 한다 |
| 위치 시너지 | 3~4랭크 원거리 스킬 명중 +10%, 1랭크 근접 스킬 피해 ×1.1, 4랭크(벽)에 막힌 강제 밀치기는 충돌 고정 피해 4 |

## 4. 라운드와 행동 순서 (`InitiativeSystem`)

- 라운드 시작마다 `buildInitiativeQueue`: 이니셔티브 = `speed + floor(난수 × (initiativeRollMax + 1))`. 높은 순, 동점이면 id 순.
- 기본 speed: 플레이어 5, 동료 5(`npcs.states[id].combatSpeed`로 개별 지정 가능), 적 4(적 데이터 `speed`로 지정 가능). `speed` 토큰은 다음 라운드 굴림 +4.
- 행동 불가: 사망했거나 `effect.skipTurn` 상태(기절 등)면 건너뛴다. 아군이 기절이면 그 턴을 소모만 한다.
- 라운드 시작 처리(`_onRoundStart`): 상태이상 틱 → 사망 처리 → 승패 판정 → **야간 스트레스**(광원 카드 없으면 아군 전원 +1) → 순서 재구성.
- 진행: `processUntilAllyTurn()`이 적 턴을 차례로 돌리다 아군 차례가 오면 `phase = 'await_ally_input'`에서 멈춘다.

## 5. 아군 행동 — 스킬 바

### 5.1 구성 (`buildAllyLoadout`)

| 전투원 | 스킬 바 |
| --- | --- |
| 플레이어 | **공격 스킬**: 주무기 슬롯(`weapon_main`, 원거리)의 장비 스킬 + 보조 슬롯(`weapon_sub`, 근접)의 장비 스킬. 근접 무기가 없으면 맨손 `basic_strike`<br>**직업 스킬 중 공격이 아닌 것**(`CHARACTER_COMBAT_LOADOUTS`) |
| 동료 | 동료 고유 스킬 3개(`COMPANION_COMBAT_LOADOUTS`) + 공용 `guard`, `reposition` |

- 공용 스킬: `basic_strike`(1~2랭크 → 적 1~2랭크, 피해 4~7, 명중 0.8), `guard`(피해 25% 감소), `reposition`(자동 방향 1칸 이동).
- 장비 스킬(`buildEquipmentSkill`): 무기 카드의 `combat` 정의에서 만든다. `requiresAmmo`가 있으면 원거리. 상태이상은 **장전 화살 > 부착물 > 무기 정의** 순으로 하나만 실린다.
- 직업 스킬(6직업 × 3): 의사 `precise_cut / triage / diagnose`, 군인 `burst_fire / suppressive_fire / tactical_shift`, 소방관 `axe_swing / rescue_guard / force_advance`, 노숙인 `dirty_fighting / slip_away / scavenge_weapon`, 요리사 `knife_flurry / field_ration / hot_pan`, 엔지니어 `wrench_strike / improvised_cover / shock_trap`.
- 동료 스킬: 20명 × 3(간호사, 탈영병, 아이, 정비공, 학생, 개, 전 동료, 민준, 소희, 지수, 영철, 대한, 타워 경비·상인·요리사·엔지니어·의사, 수셰프, 주방 보조, 노인 생존자).

### 5.2 스킬 데이터 형식

```
{ id, icon, target: { side: 'enemy'|'ally', ranks: [...] }, usableFrom: [...],
  effects: [{ type: 'damage'|'heal'|'guard'|'token'|'status'|'stress'|'move'|'flee', ... }],
  costs: { stamina, noise, ammo? }, accuracy?, cooldown?, motionKey }
```

- 원거리 스킬은 기본 `usableFrom: [2,3,4]`, 근접은 `[1,2]`. 총기 스킬은 탄약·소음 비용이 붙는다.
- 모션 키(`SKILL_MOTION_KEYS`: `melee·ranged·support·guard·move`)가 스프라이트 시트 행을 고른다.

### 5.3 명령 흐름

1. `selectSkill(skillId)` → 가능한 대상 강조
2. `selectTarget(targetId)` → `confirmAction()`
3. `executeSkillCommand` → 비용 지불 → 명중·치명 판정 → 효과 적용 → 연출 이벤트(`fxQueue`)
4. 관계 반응 판정(아래 9절) → `advanceTurn()` → `processUntilAllyTurn()`

그 밖의 명령:

| 명령 | 함수 | 내용 |
| --- | --- | --- |
| 아이템 | `useCombatItem(instanceId)` | 의료품 등 사용(의사 의료 배율 등 캐릭터 정체성 반영) |
| 장전 | `reloadActiveWeapon(instanceId)` | 탄창 무기에 같은 탄종 팩을 넣는다. 탄창 기본 20발, 부착물로 증가 |
| 이동 | `useActiveSkillByEffect('move')` | 이동 효과 스킬 사용 |
| 도주 | `attemptFlee()` | 상황식 확률(아래 8절) |
| 취소 | `cancelSelection()` | 선택 해제 |

- **동료도 직접 조작한다.** 동료 차례에도 입력을 기다린다(`isManualCompanionTurn`). 스킬 쿨다운은 그 동료의 턴 시작에 1씩 줄어든다.
- 참고: 자동 전술 모듈 `combat/CompanionTactics.js`(`planCompanionTurn`, `data/companionTactics.js`의 동료별 우선순위)는 **현재 게임 흐름에 연결돼 있지 않다** — 테스트에서만 호출된다.

## 6. 판정 (`CombatResolution`)

- 명중: `composeAccuracy`(스킬/무기 명중 + 토큰 `accuracy` + 위치 보너스 − 야간 − 동요 등) → `resolveHitRoll`. 아군 기본 회피 5%와 `dodge` 토큰이 추가로 막는다.
- 치명: `rollCrit`(`focus` 토큰 +15%). 적 치명 기본 10%, ×1.5. 방어구 `critReduction`이 낮춘다.
- 피해: `modifyOutgoingDamage`(공격자 토큰·죽음의 문턱 ×0.7) → 방어 → `modifyIncomingDamage`(대상 `block`·`vulnerable`·`marked`).
- 방어 바닥: 정액 방어가 피해를 30% 아래로 깎지 못한다(`defenseFloorRatio`).
- 약점 ×1.5 / 저항 ×0.6(`weaponAffinityMult`, 무기 `weaponType` 대 적 `weaknesses/resistances`).
- 야간 명중 −15%(광원 카드 있으면 −7%).
- 처형: 무기 `combat.special: 'execute'`는 남은 체력이 50% 미만이면 즉사.
- 무기 독: 1회 도포 +3, 독버섯 직접 도포 상한 3, 추출 독 상한 9(방어 무시 피해라 상한을 둠).

## 7. 토큰 · 상태이상 · 스트레스 · 죽음의 문턱

### 7.1 토큰 (1회 소비형, `gameBalance.combat.tokens`)

| 토큰 | 효과 |
| --- | --- |
| `block` | 받는 피해 ×0.5 |
| `dodge` | 다음 공격 회피 |
| `strength` · `power` · `improvised` | 다음 공격 피해 ×1.3(공격당 하나만 소비) |
| `accuracy` | 다음 공격 명중 +15% |
| `focus` | 다음 공격 치명 +15% |
| `speed` | 다음 라운드 이니셔티브 +4, 도주 +15% |
| `vulnerable` | 받는 피해 ×1.3 |
| `hesitation` | 다음 공격 피해 ×0.7 |
| `marked` | 받는 피해 ×1.5(집중 사격 시너지) |
| `taunted` | 아군에게 붙어 적 공격을 끌어온다(도발) |

### 7.2 상태이상

- 적 상태는 `enemy._statusEffects`, 아군은 전투원 `statusEffects` / `combat.playerStatus`, 전장 전체는 `battlefieldStatuses`.
- 주로 쓰이는 id: `stun`(행동 불가), `bleed`, `burn`, `poison`, `rooted`, `shock`, `infection`, 산성 계열(`ACID_STATUS_IDS` — `acidImmunity` 장비가 막는다), 보스 고유 상태(예: `viral_fever` 라운드당 HP −5·감염 +10).
- 라운드 시작에 틱: 지속 피해, 감염, 지속시간 감소, 쿨다운 감소, 방어 소모.

### 7.3 스트레스 (0~10)

| 쌓이는 경우 | 양 |
| --- | --- |
| 한 번에 15 이상 피해 | +1 |
| 죽음의 문턱 진입 | +2 |
| 동료 다운 목격 | +2 |
| 야간 라운드(광원 없음) | +1 |
| 관계 간섭(9절) | +1 |

- 7 이상 **동요**: 명중 −5%.
- 10 도달 시 판정:
  - 10% **각오** → 스트레스 3, `strength` 토큰
  - 90% **붕괴** → 스트레스 2, `vulnerable` 토큰, 공격 스킬 하나가 다음 라운드까지 잠김
- 회복: `nurse_encourage`(−12), `yeongcheol_rally`(−14) 같은 `stress` 효과, 관계 지원(−1).

### 7.4 죽음의 문턱

- HP가 0이 되면 바로 죽지 않고 **죽음의 문턱**에 들어간다(저항 75%).
- 문턱 상태에서 다시 맞으면 저항 판정을 하고, 판정마다 저항이 10%p씩 줄어든다(최저 5%). 실패하면 사망.
- 문턱 상태에서 가하는 피해 ×0.7. 치료로 벗어난다.

## 8. 방어 · 도주 · 은신

- 방어: `guard` 계열 효과(스킬마다 값이 다름, 공용 25%·소방관 35%·대한 바리케이드 40% 등).
- 도주(`_situationalFleeChance`):
  - 기본 50%
  - 가산: 적 전열이 비었으면 +20%, 자신에게 `speed` 토큰이 있으면 +15%, 살아 있는 적이 전원 기절·주저 상태면 +15%
  - 상한 90%
  - 시도하면 소음 +10, 성공하면 피로 +10. 실패하면 등을 보인 대가로 받는 피해 ×1.5
  - 노숙인 `slip_away`는 +20%
  - 호드 웨이브와 보라매병원 습격(`isSiege`)에서의 도주는 별도 후처리(습격은 패배 취급)
  - 소음·피로 값은 코드에 직접 적혀 있다. `gameBalance`의 `fleeNoise`·`fleeFatigue`는 읽히지 않는다
- 은신(`_stealthAction`): 살아 있는 적 `stealthDifficulty` 최댓값 기준(기본 0.5). **구(비랭크) 전투 화면에만 버튼이 있고 현재 진형 전투 화면에는 없다.**

## 9. 관계 반응 (`RelationshipCombatSystem`)

- 아군 행동 직후 판정한다.
  - 유대가 높은 동료: 18% 확률로 **지원** — 스트레스 −1
  - 유대가 낮은 동료: 15% 확률로 **간섭** — 스트레스 +1
- 관계에 따라 스킬 효과 보정이 붙는다(`getRelationshipSkillEffects`).

## 10. 적 AI

### 10.1 의도와 실행

- 적은 자기 턴 **전에** 다음 행동을 확정해 둔다(`EnemyActionPlanner.commitEnemyAction`). UI는 의도 아이콘·대상·카운트다운으로 보여 준다.
- 의도 종류: 공격 / 특수 스킬(쿨다운) / 전진(후열 근접 적) / 타이밍 위협(카운트다운).
- 대상: 기본은 플레이어. 20% 확률로 동료를 노린다(`companionTargetChance`). 도발(`taunted`)이 우선한다. 대상이 사라지면 다시 조준한다(`retargetCommittedAction`).
- 실행: `EnemyActionExecutor.executeEnemyAction`. 공격 소음(`noiseOnAttack`)이 누적된다.

### 10.2 타이밍 위협 (`timedThreat`)

| 적 | 위협 | 내용 |
| --- | --- | --- |
| 부푼 좀비(bloater) | `self_destruct` | 광역 25~40, 시체 폭발 8~14, 감염 구름 15 |
| 비명 좀비(screamer) | `summon_horde` | 좀비 1~2 소환, 소음 25 |
| 돌격 좀비(charger) | `charge_strike` | 30~45 + 기절 1, 방어로 받으면 반격 ×2 |

### 10.3 보스 패턴 (`BossPatternController`, `secretEnemies.js`의 `BOSS_PATTERNS` 21종)

- 구성:
  - `basicAttacks`: 기본기 2종. 각각 `targetPolicy`(frontmost/random 등), 강제 이동, 상태이상 등의 효과를 가진다
  - `specialSkill`: 특수기 1종
  - `ultimate`: 궁극기 1종. 기본 **HP 30% 이하**에서 예고 후 한 번 사용
- 같은 기본기를 연속으로 쓰지 않도록 직전 기본기를 기억한다.
- 보스는 출현 조건(`spawnConditions`: 구·최소 일차·계절·날씨·캐릭터 등)과 확정 드롭을 가진다.

### 10.4 사기

인간형 적은 사기(`currentMorale`)가 0이 되면 도주할 수 있고, 도주한 적은 보상 배율이 낮다.

## 11. 승리 · 패배

- **승리**(적 전원 사망): 전투 종료, 결과 `victory`, 사기·피로 변화, 드롭(일반 적 드롭 80%, 의사는 좀비 처치 시 의료품 30% 추가), XP(처치 5·명중 2·치명 +2·방어 1), NPC 후처리, 승리 대사, 결과 화면.
- **패배**(플레이어 사망): 결과 `defeat`, 패배 대사, 게임오버 흐름.
- 전투가 끝나면 전투원 HP·스트레스를 원래 상태(`gs.player`, `npcs.states`)로 되돌려 쓴다(`syncCombatantsToGameState`).

## 12. 전투 화면

| 영역 | 내용 |
| --- | --- |
| 상단 HUD | 전투 정보, 위험도, 날씨 칩, `연출 ×1/×2` 배속 토글 |
| 라운드 트랙 | 이니셔티브 순서 초상화 + 라운드 번호 |
| 전장 | 랭크 표시(1~4), 좌 아군·우 적 라인업, 의도 아이콘, HP·스트레스·상태 오브 |
| 상세 팝오버 | 전투원을 누르면(스킬 미선택 시) 상세 표시 |
| 커맨드 덱 | 활성 전투원의 스킬 버튼(비용·수치 표시), 장전, 아이템 슬롯, 이동·도주 |

- 빈 전장을 누르면 진행 중인 연출을 건너뛴다(상태는 이미 반영돼 있음).
- 캐릭터·적은 **스프라이트 시트**(`assets/images/combat/spritesheets/manifest.json`, 시트 60종, 6열 × 모션 행)로 모션을 재생한다.

## 13. 전투 연출 (2026-09-26 개선)

전투 규칙과 무관한 표현층이다. **설정 > 전투 연출 > "개선 연출"**을 끄면 이전 연출(PNG 오버레이, 히트스톱 70/120ms)로 돌아간다. 수치는 모두 `js/data/combatFxConfig.js` 한 곳에 있다.

| 항목 | 구현 | 수치(개선) |
| --- | --- | --- |
| 이펙트 | `CombatFxCanvas` — 노드 그래프 파티클(`js/ui/combat/fx`). 게임 fx 키 15종 → `FX_PARTICLE_MAP`. 이펙트 광원 포함 | 내장 11종 |
| 정지 | 히트스톱 + 정지 중 대상 진동 | 90 / 치명 160ms, 진동 4px |
| 반동 | 넉백(맞은 쪽) · 공격자 반동 | 36px / 14px |
| 흔들림 · 섬광 · 줌 | 명중마다 흔들림, 피격 흰 섬광, 치명 줌 | 6px(치명·처치 16px) / 90ms / 3.5% |
| 처치 | 전장 애니메이션·파티클 슬로모션 | ×0.3, 320ms |
| 발동 | 접근 공격 흙먼지+잔상, 사격 예광탄, 스킬 기 모으기 | 잔상 5장 |
| 무대 | `CombatStageRenderer` — 시간대 어둠 + 광원(손전등·불·비상등·이펙트), 빛줄기, 안개, 원경 흐림·패럴랙스, 발밑 그림자, 비·눈·번개 | 30fps, 반해상도 |

- 입력: `GameState.weather.id`, `GameState.time.hour` + `NightSystem.isNight()`, 보드의 `light_source`/`light` 카드, 배경 `env` 메타.
- 어둠은 배경에만 깔고 HP·의도 UI는 어둡게 하지 않는다.
- 캐릭터별 이펙트 부착점 보정: `SOCKET_OVERRIDES`.
- 연출 조정 툴: `tools/combat-fx-lab/`(전/후 비교, 노드 편집, 바인딩 타임라인, 타격감).

## 14. 알려진 이슈 · 결정 필요

| 항목 | 현재 상태 |
| --- | --- |
| 동료 자동 전술 | `CompanionTactics` 모듈과 동료별 우선순위 데이터가 있으나 게임에 미연결(동료도 전원 수동). 연결할지, 수동을 유지할지 결정 필요 |
| 전투 배경 선택 | `sceneId`를 정하는 규칙 없음 → 항상 종로 지하철. 구·랜드마크별 배경 규칙과 실외 와이드 아트 필요 |
| 스트레스 회복량 | 스트레스 척도는 0~10인데 일부 스킬이 −12·−14로 선언돼 있다(한 번에 0까지 회복). 의도한 값인지 확인 필요 |
| 에셋 | `soldier_m_sheet.png` 피격 행 3번째 칸에 인물 2명. 두 전투원 사이에 스프라이트 조각이 비치는 현상(개선 연출과 무관) |
| 미사용 설정값 | `gameBalance.combat.fleeNoise`·`fleeFatigue`는 도주 코드가 읽지 않는다(값이 직접 박혀 있음). `fleeChance`(60%)는 `flee` 설정이 없을 때만 쓰는 폴백 |
| 은신 | 진형 전투 화면에 은신 명령이 없음 — 유지할지 결정 필요 |
| 레거시 경로 | `combat.enemies` / `playerStatus` / `turnQueue`(구 구조)와 `combatants` / `formations`(랭크 구조)를 동기화하며 병행 사용 중 — 수정 시 양쪽 동기화 함수(`_syncLegacy*`, `_syncRanked*`)를 함께 볼 것 |

## 15. 조정할 때 보는 곳

| 목적 | 위치 |
| --- | --- |
| 속도·토큰·스트레스·도주·위치 보너스·방어 바닥 | `gameBalance.js` → `combat` |
| 직업/동료 스킬 구성과 효과 | `combatSkills.js` (`*_COMBAT_LOADOUTS`, 효과 표, `SKILL_MOTION_KEYS`) |
| 무기 스킬 | 아이템 카드의 `combat` 필드(`damage`, `requiresAmmo`, `statusInflict`, `special`) |
| 일반 적 · 조우 | `enemies.js` (`ENEMIES`, `ENCOUNTER_TABLES`) |
| 보스 | `secretEnemies.js` (`BOSS_PATTERNS`, `spawnConditions`) |
| 연출 수치 | `combatFxConfig.js` — 먼저 `tools/combat-fx-lab`에서 비교 |
| 전투 테스트 | `tools/combat/`(전투 시뮬레이터), `combat-test.html`, `tests/unit`(전투 관련 41개), `tests/integration`(19개) |

## 16. 한 줄 요약

**4칸 진형 위에서 플레이어와 동료 최대 2명을 모두 직접 조작하는 이니셔티브 턴제 전투.** 위치 제약이 있는 스킬 바, 적 의도 예고와 보스 궁극기 예고, 1회성 토큰, 스트레스와 죽음의 문턱, 생존 자원 비용으로 짜여 있다. 그 위에 파티클·타격감·날씨/광원 연출층이 설정으로 켜고 끌 수 있게 얹혀 있다.
