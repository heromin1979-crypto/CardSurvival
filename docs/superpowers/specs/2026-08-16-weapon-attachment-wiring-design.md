# 무기 부착물 배선 통합 설계

작성일: 2026-08-16

전투 관련 데이터 중 **선언은 있으나 읽는 코드가 없어 아무 동작도 하지 않는 것들**을 한 번에 배선한다. 출발점은 미배선 강화품 4종이었으나, 조사 과정에서 같은 성격의 결함이 여러 층에서 드러나 함께 다룬다.

## 배경

`subtype: 'enhancement'` 아이템 8종 중 4종이 **제작만 되고 쓰이지 않는다**. 시크릿 조합으로 카드를 만들 수 있고 발견 메시지가 효과를 약속하지만, 그 효과를 무기나 플레이어에 적용하는 코드가 없다.

| 아이템 | 조합 재료 | 발견 시 약속하는 효과 | 실제 |
|---|---|---|---|
| 너클 랩 `knuckle_wrap` | 천 + 천 | "맨손 데미지가 증가한다" | 카드만 생성 |
| 무기 정비유 `weapon_oil` | 약초 + 고무 | "무기 내구도 감소가 줄었다" | 카드만 생성 |
| 톱니 개조 키트 `serrated_mod` | 못 + 근접무기 + 철사 | "출혈 효과가 추가됐다" | 카드만 생성 |
| 방어 자세 키트 `guard_stance_kit` | 가죽 + 밧줄 | "가드 효율이 올랐다" | 카드만 생성 |

이 4종의 id를 전체 코드에서 검색하면 나오는 참조는 두 가지뿐이다.
- `js/systems/SecretCombinationSystem.js`의 `SKILL_HINTS` — 조합 id를 가리킬 뿐
- `js/ui/CardFactory.js` — 카드 이미지 경로

즉 그리는 코드는 있고 소비하는 코드가 없다.

## 진짜 문제: 인스턴스 보정이 랭크 스킬 경로에서 죽는다

조사 과정에서 더 근본적인 결함이 드러났다. 이 게임에는 플레이어 공격 경로가 두 개 있다.

| 경로 | 진입점 | 데미지 계산 |
|---|---|---|
| 레거시 다이렉트 | `js/ui/CombatUI.js:1366` → `CombatSystem.resolveAction('melee', null)` | `CombatSystem._attackAction` (`js/systems/CombatSystem.js:1894`) |
| 랭크 스킬 | `js/ui/CombatUI.js:774` → `selectSkill` → `confirmAction` | `CombatRankedEffects._applyRankedDamageEffect` (`js/systems/combat/CombatRankedEffects.js:575`) |

무기 카드에 붙는 개조 효과 대부분이 **레거시 경로에서만** 읽힌다.

| 인스턴스 필드 | 붙이는 아이템 | 레거시 | 랭크 스킬 |
|---|---|---|---|
| `_quality` | 제작 품질 | `CombatSystem.js:1909` | `CombatRankedEffects.js:889` |
| `_defensePierce` | 탄약 개조 키트 | `CombatSystem.js:2051` | `CombatRankedEffects.js:660` |
| `accuracyBonus` | 조준경·가죽 그립 | `CombatSystem.js:1911` | **없음** |
| `damageBonus` | 연마·못 개조·유리 박기 | `CombatSystem.js:1910` | **없음** |
| `_poisonDamage` | 독날 | `CombatSystem.js:2049` | **없음** |
| `_suppressor` / `_noiseReduction` | 소음기 | `CombatSystem.js:1923` | **없음** |

원인은 한 곳이다. 무기를 스킬로 변환하는 함수가 **정의만 받고 카드 인스턴스를 받지 않는다**.

```javascript
// js/systems/combat/CombatSkillSystem.js:269
export function buildEquipmentSkill(instanceId, definition) { ...
// :326
  accuracy: clamp(combat.accuracy, 0, 1, 0.7),   // 정의값 고정 — 인스턴스 보정 없음
```

여기에 신규 4종을 개별 배선으로 얹으면 "레거시로 싸우면 되고 스킬로 싸우면 안 되는" 효과가 계속 늘어난다. 따라서 **공통 보정 지점을 먼저 세우고 그 위에 4종을 얹는다.**

## 목표

이 작업의 일관된 주제는 **"선언되어 있으나 동작하지 않는 것을 동작하게 만든다"** 이다.

1. 무기 인스턴스 보정을 두 전투 경로가 동일하게 읽는다 (1절)
2. 미배선 강화품 4종을 동작시킨다 (2~5절)
3. 기존 부착물(조준경·소음기·독날·연마)의 랭크 경로 누락을 해소한다 (1절)
4. 사문화 필드를 살린다 — 기절 무기, `bleedChance`, `cureAllBleeding`, `onTrigger` (6·10절)
5. 표기와 실동작이 어긋난 곳을 맞춘다 — `critReduction`, 가드 UI, 장비 모달 (7~9절)
6. 중복 키를 제거한다 — `sling` (11절)

조사 과정에서 4~6번이 추가로 드러났고, 전부 이번 범위에 포함한다.

## 범위 밖

- 시크릿 조합 `addEffect`가 `poisonDamage` 키만 처리하는 문제 (`SecretCombinationSystem.js:144-148`). `sc_shield_mod`의 `defense: 5`, `sc_quench_blade`의 `damage: 5`가 여전히 무시된다
- `characters.js:154`의 `weaponSynergies` — 읽는 코드가 없다
- 공격 예상 패널(`CombatSystem.previewAttack`)이 `damageBonus`를 누락하는 문제. 1절 공통 모듈 교체로 자연히 해소될 수 있으나, 예상 피해 표시가 바뀌므로 별도 확인 후 판단한다

---

## 1. 공통 보정 모듈 — `js/systems/WeaponModifiers.js` (신규)

무기 카드 한 장에 붙은 개조 효과를 한 곳에서 정규화해 반환한다.

```javascript
export function getWeaponModifiers(instance) {
  return {
    damageBonus:    num(instance?.damageBonus),
    accuracyBonus:  num(instance?.accuracyBonus),
    defensePierce:  nonneg(instance?._defensePierce),
    poisonDamage:   nonneg(instance?._poisonDamage),
    noiseReduction: instance?._suppressor ? clamp01(instance._noiseReduction ?? 0.5) : 0,
    durabilitySave: clamp01(instance?._durabilitySave),
    statusInflict:  instance?._statusInflict ?? null,
  };
}
```

인스턴스가 `null`/`undefined`여도 0으로 채운 동일 형태를 반환한다. 호출부에서 옵셔널 체이닝을 반복하지 않기 위함이다.

### 소비 지점

**레거시** — 기존의 개별 읽기를 이 호출로 교체한다. 값이 같으므로 동작 변화가 없어야 한다.

| 보정 | 현재 위치 |
|---|---|
| `damageBonus` | `CombatSystem.js:1909` |
| `accuracyBonus` | `CombatSystem.js:1910` |
| `noiseReduction` | `CombatSystem.js:1923` |
| `durabilitySave` | `CombatSystem.js:1935` (신규 가산) |
| `poisonDamage` | `CombatSystem.js:2049` |
| `statusInflict` | `CombatSystem.js:2071` |

**랭크 스킬** — 새로 연결한다.

| 보정 | 연결 지점 | 방법 |
|---|---|---|
| `accuracyBonus` | `_rankedAimProfile` (`CombatRankedEffects.js:199`) | `composeAccuracy`에 항목 추가 |
| `damageBonus` | `_applyPlayerDamageSuite` (`CombatRankedEffects.js:884-909`) | 배율 적용 후 가산 |
| `poisonDamage` | `_applyRankedDamageEffect`의 방어 차감 이후 (`CombatRankedEffects.js:657-663`) | 방어 무시 가산 피해 |
| `noiseReduction` | `_consumeRankedCosts` (`CombatRankedEffects.js:61-62`) | `noise * (1 - noiseReduction)` |
| `durabilitySave` | `_consumeRankedCosts` (`CombatRankedEffects.js:68-70`) | `durSaveChance`에 가산 |
| `statusInflict` | `buildEquipmentSkill` (`CombatSkillSystem.js:294-299`) | 인스턴스 인자 추가 |

**프리뷰** — `CombatSystem.previewAttack`(`:2819`)은 이미 `accuracyBonus`와 `_defensePierce`를 반영한다. 공통 모듈로 교체하되 표시 값이 바뀌지 않아야 한다.

### `buildEquipmentSkill` 시그니처 변경

```javascript
// 현재
export function buildEquipmentSkill(instanceId, definition)
// 변경 후
export function buildEquipmentSkill(instanceId, definition, instance = null)
```

호출부는 `CombatSkillSystem.js:374`, `:378`(weapon_main / weapon_sub). 두 곳 모두 `GameState.cards[instanceId]`를 함께 넘긴다.

`statusInflict`는 **인스턴스 우선 → 정의 폴백**으로 병합한다. 정의에 `statusInflict`가 있는 무기(예: `spiked_pipe`)에 톱니 개조 키트를 달면 인스턴스 값이 이긴다. 두 효과를 겹쳐 쌓지 않는 이유는 `_applyEnemyStatusInflict`가 상태이상 하나만 받기 때문이다.

### 밸런스 영향 (의도된 변화)

이 연결로 연마·못 개조·독날·소음기·조준경이 **랭크 스킬 공격에서 처음으로 효과를 낸다.** 기존 세이브의 개조 무기가 체감상 강해진다. 부작용이 아니라 원래 의도대로 동작하게 되는 것이지만, 밸런스 변화로 기록해 둔다.

---

## 2. 무기 정비유 — 근접무기 부착, 내구도 절약 +15%p

**대상**: 근접무기. `js/data/interactions.js`의 `_isPoisonableWeapon`(`:8`)과 동일한 판정 기준을 쓴다 (`type === 'weapon'` + `melee`/`blade` 태그 또는 `subtype`/`weaponType`).

**상호작용**: `apply_weapon_oil` / `apply_weapon_oil_rev` 쌍. 소음기·조준경과 동일한 구조.

```javascript
weaponInst._weaponOil = true;
weaponInst._durabilitySave = (weaponInst._durabilitySave ?? 0) + 0.15;
```

**소비**: 두 경로의 `durSave` 확률 굴림에 가산한다.

```javascript
// CombatSystem.js:1934-1936
const durSave = skillId === 'melee'
  && Math.random() < (SkillSystem.getBonus('melee', 'durSaveChance') + mods.durabilitySave);

// CombatRankedEffects.js:68-70 — 동일하게 가산
```

근접 전용이라는 기존 규칙을 그대로 따른다. 원거리는 지금도 항상 차감한다(`skillId === 'melee'` / `isMeleeEquipment` 조건).

스킬 `durSaveChance`는 최대 10%(`skillDefs.js:46-51`)이므로 정비유를 바르면 최대 25%가 된다. `clamp01`로 상한을 둔다.

**표시**: 카드 이름에 `(정비유)`, 효과 줄에 `내구 절약 +15%`.

---

## 3. 톱니 개조 키트 — 근접무기 부착, 출혈 부여

**대상**: 무기 정비유와 동일한 근접무기 판정.

**적용**: 기존 무기 정의의 `statusInflict`와 **동일한 구조**를 인스턴스에 심는다.

```javascript
weaponInst._serratedMod = true;
weaponInst._statusInflict = {
  id: 'bleed', name: '출혈', duration: 2,
  effect: { hpPerRound: -3 },
  chance: 0.25,
};
```

`spiked_pipe`(`items_combat.js:117`)가 같은 형태를 쓰고 있고, `_normalizeStatusInflict`(`CombatSystem.js:1459-1471`)가 `hpPerRound` → `hpLossPerRound`로 정규화한다. FX(`kind:'status'`)와 라운드 틱(`CombatActions.js:248-301`)은 기존 배선을 그대로 탄다.

**레거시 소비**: `CombatSystem.js:2070-2071`이 정의 대신 병합값을 읽는다.

**랭크 소비**: `buildEquipmentSkill`이 병합값을 `{ type:'status', status }` 이펙트로 변환한다(`CombatSkillSystem.js:294-299`). 적용은 `CombatRankedEffects.js:486-499`가 이미 처리한다.

### 인접 버그 동시 수정

`CombatSystem.js:2081`은 `statusInflict`가 없는 무기에도 난수를 굴린다.

```javascript
if (stunDef?.id !== 'stun' && enemy.currentHp > 0 && Math.random() < (stunDef?.chance ?? 1)) {
```

`stunDef`가 `undefined`면 `undefined !== 'stun'`이 참이고 `stunDef?.chance ?? 1`이 1이므로 거의 항상 조건을 통과해 `_applyEnemyStatusInflict(enemy, undefined)`를 호출한다. `_normalizeStatusInflict`의 가드(`:1460`) 덕에 무해하지만 **RNG 시퀀스를 소비한다**. 공통 모듈이 `statusInflict: null`을 반환하므로 null 가드를 앞에 두면 자연히 해소된다.

`id === 'stun'` 무기가 기절을 부여하지 않는 문제는 범위 밖이다.

**표시**: 카드 이름에 `(톱니)`, 효과 줄에 `출혈 25% 2턴`.

---

## 4. 너클 랩 — 장갑에 부착, 맨손 피해 +2

맨손 공격에는 붙일 무기 인스턴스가 없다. 장갑 카드에 부착한다.

**대상**: `type === 'armor'` + `subtype === 'hands'`. 현재 4종이다.

| id | 이름 | `onWear.unarmedDmgBonus` |
|---|---|---|
| `work_gloves` | 작업장갑 | 없음 |
| `work_gloves_plus` | 정밀 작업장갑 | 없음 |
| `combat_gloves` | 전투 장갑 | 2 |
| `iron_gauntlet` | 철권 건틀릿 | 5 |

**적용**:

```javascript
glovesInst._knuckleWrap = true;
glovesInst._unarmedDmgBonus = (glovesInst._unarmedDmgBonus ?? 0) + 2;
```

**레거시 소비**: `CombatSystem.js:1951-1954`가 현재 정의값만 읽는다. 인스턴스 값을 더한다.

```javascript
const handsInst  = handsId ? gs.cards[handsId] : null;
const handsBonus = (handsDef?.onWear?.unarmedDmgBonus ?? 0) + (handsInst?._unarmedDmgBonus ?? 0);
```

**랭크 소비**: 랭크 맨손 공격(`basic_strike`)에는 **장갑 효과 자체가 없다**. `_applyPlayerDamageSuite`의 `basic_strike` 분기(`CombatRankedEffects.js:894-896`)에 같은 값을 연결한다.

```javascript
} else if (skill?.id === 'basic_strike') {
  damage = Math.floor(damage * SkillSystem.getBonus('unarmed', 'dmgMult')) + handsUnarmedBonus();
}
```

장갑 보너스 계산은 `WeaponModifiers.js`에 `getUnarmedGloveBonus(gameState)`로 함께 둔다. 무기 인스턴스 보정과 성격이 같고(카드 인스턴스에서 전투 보정을 읽는다), 두 경로가 같은 값을 보게 하는 것이 이 모듈의 존재 이유이기 때문이다.

**게이트**: 천 2장으로 만드는 커먼 아이템이지만 장갑을 먼저 구해야 쓸 수 있다. 전투 장갑(+2)에 감으면 +4가 된다.

**표시**: 장갑 카드 이름에 `(너클 랩)`, 효과 줄에 `맨손 피해 +2`.

---

## 5. 방어 자세 키트 — 다음 방어 1회 강화 +15%p

아이템 설명이 "사용 시 가드 효율이 **일시적으로** 상승한다"이므로 영구 부착이 아니라 1회 소비형으로 만든다.

**아이템 정의**에 `onConsume: { guardBoost: 0.15 }`를 추가한다.

**사용 경로**는 두 곳 모두 이미 존재한다. `temporaryAttackBoost`가 같은 방식으로 배선되어 있다.
- 전투 중: `CombatSystem._useItemAction` (`:2175`, `def.onConsume`을 읽음)
- 전투 밖: `StatSystem` (`:769-770`과 같은 위치)

둘 다 `gs.player.pendingGuardBoost = value`를 설정한다.

**소비**: `guardAction()`(`js/systems/CombatActions.js:15-24`)이 읽고 즉시 비운다.

```javascript
damageReduce: Math.min(0.85,
  BALANCE.combat.guardDamageReduction        // 0.40
  + (effects.guardDamageReduceBonus ?? 0)    // 소방관 +0.15
  + consumePendingGuardBoost()),             // 방어 자세 키트 +0.15 (1회)
```

캐릭터 보정(`characters.js:241`)이 같은 자리에 더해지는 선례가 있어 기존 구조와 어긋나지 않는다.

기본 40% → 55%, 소방관이면 70%. 하드코딩 상한 85%(`CombatActions.js:20`)에 걸리지 않는다.

**표시**: 카드 효과 줄에 `다음 방어 피해감소 +15%`.

---

## 6. 기절 무기 — 부여 배선 + 확률 하향

무기 2종이 `statusInflict: { id: 'stun', ... }`을 선언하지만 기절이 걸리지 않는다.

| 무기 | 위치 | 선언 확률 | 조정 후 |
|---|---|---|---|
| 전기 무기 | `items_combat.js:165` | 0.35 | **0.18** |
| 목공 망치 | `items_combat.js:500` | 0.20 | **0.10** |

**원인**: `CombatSystem.js:2072`의 `id === 'stun'` 분기는 충전 중인 적을 방해하는 처리만 하고 `_applyEnemyStatusInflict`를 부르지 않는다. 실제 부여를 담당하는 `:2081`은 `id !== 'stun'` 조건으로 stun을 제외한다.

**수정**: `:2081`이 stun도 부여하도록 조건을 제거하고, 난수 굴림을 한 번만 수행해 인터럽트와 부여가 같은 판정을 공유하게 한다. 충전 인터럽트는 그대로 유지한다.

**소비는 이미 배선되어 있다.** `CombatAiTurns.js:663`과 `CombatSystem.js:1200`이 `s?.id === 'stun' || s?.effect?.skipTurn === true`로 턴 스킵을 처리한다. 부여만 연결하면 즉시 동작한다.

**확률 하향 이유**: 선언값 그대로면 전기 무기가 세 번에 한 번꼴로 적의 턴을 지운다. 사문화 해소로 난이도가 급락하지 않도록 절반 수준으로 낮춘다.

---

## 7. 적 치명타 신설 + `critReduction` 실동작화

방어구 14종이 `critReduction`을 선언하지만(헬멧 0.3, 강화 헬멧 0.45, 파워 엑소수트 0.4 등) **줄일 대상이 없다.** 적이 플레이어를 때리는 모든 경로에서 `isCrit`가 `false`로 하드코딩되어 있다 (`CombatAiTurns.js:1019, 1022, 1498, 1824, 2067`). 치명타 판정은 플레이어 공격에만 존재한다(`CombatSystem.js:1994`).

현재 `critReduction`의 유일한 실사용처는 적 특수스킬의 기절 확률 감소다(`CombatAiTurns.js:1811-1814`).

### 7-1. 밸런스 상수

`gameBalance.js`의 `combat`에 추가한다.

```javascript
enemyCritChance:     0.10,  // 적 기본 치명타 확률
enemyCritMultiplier: 1.5,   // 적 치명타 배율
```

적 정의(`enemies.js` 12종, `secretEnemies.js` 21종)에는 필드를 넣지 않는다. 33종에 값을 일일이 붙이는 대신 기본 상수로 시작하고, 개체별 차등이 필요해지면 `critChance` 오버라이드를 나중에 추가한다.

### 7-2. 판정과 감소

적 피해 계산 경로에 공통 헬퍼를 두고 위 5개 지점이 호출한다.

```javascript
// 방어구 critReduction이 확률을 낮춘다
const effectiveCritChance = enemyCritChance * (1 - armor.critReduction);
const isCrit = Math.random() < effectiveCritChance;
if (isCrit) damage = Math.floor(damage * enemyCritMultiplier);
```

`armor.critReduction`은 `StatSystem.getArmorEffects()`가 이미 집계하며 캡은 `BALANCE.armor.critReductionCap`(0.70)이다. 기존 기절 확률 감소(`:1811-1814`)는 **그대로 유지**한다 — 방어구가 두 가지를 함께 줄이는 것으로 정리한다.

### 7-3. 표시

`combat.lastHit.isCrit`은 지금 기록만 되고 읽는 코드가 없다. 실제 값을 기록하고, 적 치명타 시 전투 로그에 표시한다. 플레이어 치명타 연출과 동일한 경로를 재사용한다.

### 7-4. 밸런스 영향

적이 10% 확률로 1.5배 피해를 준다. 방어구를 갖추면 최대 70%까지 확률이 낮아진다(3%). **전투 난이도가 올라가는 변경이며, 방어구의 가치가 함께 올라간다.**

---

## 8. 가드 UI 표시 정정

```html
<!-- CombatUI.js:1243-1244 — 현재 하드코딩 -->
<div class="ac-row"><span>피해 감소</span><strong>-55%</strong></div>
<div class="ac-row"><span>반격 보너스</span><strong>+30%</strong></div>
```

55% / 30%는 소방관 캐릭터의 보정(`characters.js:241-242`, `+0.15` / `+0.05`)을 더한 값이다. 기본값은 `gameBalance.js:201-202`의 40% / 25%이므로 **소방관 전용 수치를 전 캐릭터에게 보여주고 있다.**

`guardAction()`이 쓰는 것과 동일한 계산을 조회 전용 함수로 빼고 UI가 그것을 호출한다. 5절의 방어 자세 키트 보정도 여기 포함되어, 키트를 쓴 상태에서는 올라간 수치가 표시된다.

```javascript
// CombatActions.js — guardAction()과 UI가 공유
export function previewGuardEffect() {
  return { damageReduce, counterBonus };  // 캐릭터 보정 + 대기 중인 키트 보정 포함
}
```

키트 보정은 **미리보기에서 소비하지 않는다.** `consumePendingGuardBoost()`는 실제 `guardAction()`에서만 호출한다.

---

## 9. 장비 모달 방어구 효과 계산 통합

`EquipmentModal._getEffects`(`js/ui/EquipmentModal.js:268-289`)가 `StatSystem.getArmorEffects`(`js/systems/StatSystem.js:642-676`)와 같은 로직을 다시 구현했고 두 가지가 어긋난다.

| | `StatSystem.getArmorEffects` (전투 실제) | `EquipmentModal._getEffects` (표시) |
|---|---|---|
| 방어연고 `_damageReductionBonus` | 반영 (`:659`, `:669`) | **누락** |
| 피해 감소 상한 | `BALANCE.armor.damageReductionCap` = 0.50 | 하드코딩 `0.75` |
| 치명 감소 상한 | `BALANCE.armor.critReductionCap` = 0.70 | 하드코딩 `0.90` |

**수정**: `_getEffects`의 중복 구현을 삭제하고 `StatSystem.getArmorEffects()`를 호출한다. 반환 필드가 `damageReduction`, `critReduction`, `radiationMult`, `contaminationMult`, `infectionMult`로 동일한지 확인하고, 모달이 쓰는 필드가 빠지면 그때만 어댑터를 둔다.

방어연고를 바른 방어구의 보너스가 모달에 나타나고 상한 표시가 실제 전투와 일치하게 된다.

---

## 10. 사문화 필드 3종

### 10-1. `bleedChance` → `statusInflict` 이관

`items_misc.js:1369`의 깨진 병이 `combat` 블록 **바깥**에 `bleedChance: 0.25`를 선언한다. 읽는 코드는 없다.

3절에서 확립하는 `statusInflict` 규약으로 옮긴다.

```javascript
combat: {
  damage: [3, 6], accuracy: 0.75, noiseOnUse: 2, durabilityLoss: 50,
  statusInflict: { id: 'bleed', name: '출혈', duration: 2, effect: { hpPerRound: -3 }, chance: 0.25 },
},
// bleedChance 필드 삭제
```

별도 코드 없이 동작한다. 규약이 하나로 모이는 부수 효과가 있다.

### 10-2. `cureAllBleeding` → 플레이어 출혈 제거

`legendaryItems.js:820`의 고급 외상 키트가 `onConsume: { hp: 80, infection: -30, cureAllBleeding: true }`를 선언한다. 읽는 코드는 없다.

플레이어에게 출혈이 붙는 경로는 존재한다 — `EnemyActionExecutor.statusDefinitionsFor`(`:132-141`)가 `effect.dot ?? effect.bleed`를 플레이어 대상 상태이상으로 조립한다.

**수정**: `CombatSystem._useItemAction`(`:2175`)과 전투 밖 소비 경로가 `cureAllBleeding`을 읽어 `combat.playerStatus`에서 `id === 'bleed'`인 항목을 제거한다. 랭크 파이프라인의 `combatants.player.statusEffects`도 함께 동기화한다 — `CombatSystem.js:833`이 이미 두 표현을 잇는 선례다.

전투 밖에서는 지속 출혈 개념이 없으므로 아무 일도 하지 않고, 알림만 생략한다.

### 10-3. `onTrigger` → 전투 진입 시 1회 발동

`items_structures.js:125`의 가시 트랩이 `onTrigger: { damage: 20, bleed: true }`를 선언한다. 읽는 코드는 없다.

기존 `TrapSystem.js`는 **동물 포획 덫**용이다 — `def.subtype === 'trap' && def.trapData`를 보고 `{ targetCard, baitTags, tpToTrigger, successRate }`로 동작한다(`items_tools.js:405-448`). 가시 트랩의 "적 접근 시 자동 피해"와는 다른 개념이라 재사용할 수 없다.

**수정**: 전용 시스템을 만들지 않고 **전투 진입 시 1회 발동**으로 구현한다.

- 훅: `CombatSystem`이 `gs.combat = { active: true, ... }`를 세우고 턴 큐를 구성한 직후(`:130-160` 구간 끝)
- 조건: 보드에 `subtype === 'trap'`이고 `onTrigger`를 가진 구조물이 있고 내구도 > 0
- 효과: 선두 적 1기에게 `onTrigger.damage` 피해, `bleed: true`면 3절의 `statusInflict` 규약으로 출혈 부여
- 비용: 트랩 내구도를 **10** 소모한다. `defaultDurability`가 80이므로 8회 발동 후 파괴된다. 파괴 처리는 무기 파괴와 동일하게 `removeCardInstance` + `cardRemoved` 이벤트를 따른다
- 로그: 전투 로그 첫 줄에 발동 사실을 남긴다

전투당 1회로 제한해 별도 상태 추적이 필요 없다. 매 라운드 발동이나 적 접근 판정은 진형 시스템과 얽히므로 다루지 않는다.

---

## 11. `sling` 중복 키 제거

같은 키가 두 파일에 선언되어 있고, 애그리게이터 병합 순서상 의료 쪽이 이긴다.

| 위치 | 정의 | 실제 |
|---|---|---|
| `items_medical.js:365` | 삼각건 — 골절 고정, `consumable`/`medical` | **게임에 존재** |
| `items_misc.js:374` | 슬링 — 원거리 무기, `weapon`/`ranged` | 도달 불가능 |

**수정**: `items_misc.js`의 슬링 정의를 삭제한다. 현재 게임 동작과 동일하므로 밸런스 변화가 없다.

삭제 전 확인할 것 — `stackConfig.js`, `districts.js` lootTable, `CardFactory.js` CARD_IMAGES에 슬링 전용 항목이 있는지. 삼각건과 키를 공유하므로 항목 자체는 남겨야 하며, 무기 이미지를 가리키고 있다면 의료 아이템 이미지로 정정한다.

`sc_sling` 조합(`천 + 밧줄`)은 삼각건을 만들고 있고 `SecretComboNaming.test.js:33-36`이 이를 검증한다. 조합은 손대지 않는다.

---

## 12. 테스트

TDD로 진행한다. 각 테스트는 **구현 전에 실패를 확인**한 뒤 구현한다.

| 파일 | 잠그는 것 |
|---|---|
| `tests/unit/WeaponModifiers.test.js` | 모듈 자체. 인스턴스 없음/음수/비정상값 방어, 필드별 정규화 |
| `tests/unit/RankedInstanceModifiers.test.js` | 조준경·소음기·독날·연마가 랭크 경로에서 반영되는지. 이번 갭의 회귀 테스트 |
| `tests/unit/WeaponOilDurability.test.js` | 두 경로의 내구도 절약 확률 가산, `clamp01` 상한, 원거리 미적용 |
| `tests/unit/SerratedModBleed.test.js` | 인스턴스 출혈 부여, 정의 폴백, 인스턴스 우선 병합. `CombatWeaponStatusInflict.test.js:72-105` 패턴 재사용 |
| `tests/unit/KnuckleWrapUnarmed.test.js` | 장갑 부착 판정(무기 거부), 두 경로 맨손 피해 가산 |
| `tests/unit/GuardStanceKit.test.js` | 플래그 1회 소비, 캡 동작, 미사용 시 기존값 유지 |
| `tests/unit/WeaponStunInflict.test.js` | stun 무기가 실제로 기절을 부여하는지, 충전 인터럽트가 유지되는지, 조정된 확률값 |
| `tests/unit/EnemyCritical.test.js` | 적 치명타 판정, `critReduction`에 의한 확률 감소, 캡(0.70), `lastHit.isCrit` 기록 |
| `tests/unit/GuardPreview.test.js` | UI 표시값이 캐릭터 보정·키트 보정을 반영하는지, 미리보기가 키트를 소비하지 않는지 |
| `tests/unit/ArmorEffectsParity.test.js` | `EquipmentModal._getEffects`와 `StatSystem.getArmorEffects`가 같은 값을 내는지 (방어연고 포함) |
| `tests/unit/BrokenBottleBleed.test.js` | 깨진 병의 `statusInflict` 이관, `bleedChance` 필드 제거 |
| `tests/unit/TraumaKitCureBleed.test.js` | 고급 외상 키트가 플레이어 출혈만 제거하고 다른 상태이상은 남기는지 |
| `tests/unit/SpikeTrapCombatEntry.test.js` | 전투 진입 시 1회 발동, 내구도 소모, 트랩 없을 때 무동작 |
| `tests/unit/SlingDuplicateKey.test.js` | `sling`이 삼각건 하나로만 해석되는지 (중복 키 재발 방지) |

**RNG 소비 회귀**: `CombatSystem.js:2081`의 난수 소비 제거는 `Math.random`을 mock한 상태에서 호출 횟수로 검증한다.

**전체 회귀**: `npx vitest run` (현재 209 파일 / 2862 테스트)와 `node js/data/validate.js`를 마지막에 실행하고 결과를 그대로 보고한다.

---

## 13. 구현 순서

의존 관계상 아래 순서를 따른다. 각 단계는 독립적으로 검증 가능하다.

**1군 — 공통 기반**
1. `WeaponModifiers.js` 신설 + 모듈 테스트
2. 레거시 경로를 공통 모듈로 교체 (동작 변화 없음을 기존 테스트로 확인)
3. 랭크 경로 연결 + `buildEquipmentSkill` 인스턴스 인자 추가 — 조준경 갭 해소

**2군 — 미배선 강화품 4종**
4. 무기 정비유 (`_durabilitySave`)
5. 톱니 개조 키트 (`_statusInflict`) + RNG 소비 버그 수정
6. 너클 랩 (장갑 `_unarmedDmgBonus`)
7. 방어 자세 키트 (`pendingGuardBoost`)

**3군 — 사문화 해소**
8. 기절 무기 부여 배선 + 확률 하향
9. 깨진 병 `bleedChance` → `statusInflict` 이관
10. 고급 외상 키트 `cureAllBleeding`
11. 가시 트랩 전투 진입 발동

**4군 — 표시·정합성**
12. 적 치명타 신설 + `critReduction` 실동작화
13. 가드 UI 표시 정정 (`previewGuardEffect`)
14. 장비 모달 계산 통합
15. `sling` 중복 키 제거
16. 표시 계층 마무리 (`ItemEffectSystem` 태그·효과 줄, `locales.js` 한/영 키)

**위험 지점 두 곳**

- **2단계**는 동작을 바꾸지 않는 리팩터링이다. 여기서 기존 테스트가 하나라도 깨지면 교체가 잘못된 것이다
- **12단계**는 유일하게 난이도를 올리는 변경이다. 적이 10% 확률로 1.5배 피해를 주기 시작하므로, 방어구를 갖추지 않은 초반 플레이어가 체감상 가장 크게 영향받는다. 3군까지 끝낸 뒤 독립적으로 넣어 되돌리기 쉽게 한다

**밸런스가 바뀌는 항목 정리** (되돌릴 때 참조)

| 항목 | 방향 | 단계 |
|---|---|---|
| 개조 무기가 랭크 스킬에서 효과 발휘 | 플레이어 유리 | 3 |
| 기절 무기가 실제로 기절 부여 (확률 하향) | 플레이어 유리 | 8 |
| 깨진 병 출혈, 가시 트랩 발동 | 플레이어 유리 | 9, 11 |
| 적 치명타 신설 | **플레이어 불리** | 12 |
| 방어구 `critReduction`이 실제로 작동 | 플레이어 유리 | 12 |
