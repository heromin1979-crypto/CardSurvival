# 시스템 — `CharCreate.js:296` decay 하드코딩 검증

> 작성: 시스템 백승호 / 2026-05-10
> 대상: `CharCreate.js:296~298`의 `decayPerTP` 하드코딩 vs `gameBalance.js` 변경 이력
> 결정: **P0 아님 (false alarm).** hydration·nutrition·morale은 런타임 오버라이드. fatigue만 dead store. P3 정리 권고.

---

## 1. 의심 (Initial Concern)

`SIM_AUDIT_v1.md`·`REVIEW_sim_v2_v1.md` 검토 중 발견.

`js\screens\CharCreate.js:296~298`:
```js
gs.stats.hydration.decayPerTP   = 2.0;
gs.stats.nutrition.decayPerTP   = 0.5;
gs.stats.fatigue.decayPerTP     = 0.8;
```

`js\data\gameBalance.js:14~21`:
```js
stats: {
  hydrationDecayPerTP:  1.0,   // (기존 2.0 → 1.5 → 1.0으로 완화)
  nutritionDecayPerTP:  0.5,
  moraleDecayPerTP:     0.2,
  fatigueGainPerTP:     0.8,
  staminaRegenPerTP:    1.2,   // (기존 1.5 → 1.2로 완화)
},
```

**의심:** hydration이 캐릭터 생성 시점에 2.0으로 박혀 BALANCE의 1.0이 무시되는 것 아닌가. 그렇다면 게임 자체가 의도된 1.0 환경이 아니라 옛날 2.0 환경에서 돌고 있어 P0 결함.

---

## 2. 검증 절차

### 2.1 StatSystem.onTP() 분석

`js\systems\StatSystem.js:30~62` 읽음.

```js
onTP() {
  const gs = GameState;
  if (!gs.player.isAlive) return;
  const seasonMod = SeasonSystem.getModifiers();

  for (const [key, s] of Object.entries(gs.stats)) {
    if (s.decayPerTP === 0) continue;

    const isAccumulator = ['radiation', 'infection', 'fatigue'].includes(key);
    if (!isAccumulator) {
      let decay = s.decayPerTP;
      // BALANCE 상수에서 수분/영양/사기 감소율 오버라이드
      if (key === 'hydration') {
        decay = BALANCE.stats.hydrationDecayPerTP;       // ← 1.0으로 강제
        decay *= (seasonMod.hydrationDecayMult ?? 1.0);
      } else if (key === 'nutrition') {
        decay = BALANCE.stats.nutritionDecayPerTP;       // ← 0.5로 강제
      } else if (key === 'morale') {
        decay = BALANCE.stats.moraleDecayPerTP;          // ← 0.2로 강제
      }
      gs.modStat(key, -decay);
    }
  }

  // Fatigue 자연 증가
  const moraleTier = this.getMoraleTier();
  gs.modStat('fatigue', gs.stats.fatigue.decayPerTP * (moraleTier.fatigueGainMult ?? 1.0));
  // ↑ fatigue는 BALANCE 오버라이드 없음. gs.stats.fatigue.decayPerTP 값 그대로 사용.
  ...
}
```

### 2.2 grep 결과

`grep "BALANCE\.stats\." js/` 결과 — `StatSystem.js`에서만 hydrationDecayPerTP / nutritionDecayPerTP / moraleDecayPerTP / staminaRegenPerTP 사용. **fatigueGainPerTP는 어디서도 사용되지 않음.**

```
js\systems\StatSystem.js:48: decay = BALANCE.stats.hydrationDecayPerTP
js\systems\StatSystem.js:51: decay = BALANCE.stats.nutritionDecayPerTP
js\systems\StatSystem.js:53: decay = BALANCE.stats.moraleDecayPerTP
js\systems\StatSystem.js:472: BALANCE.stats.staminaRegenPerTP
(BALANCE.stats.fatigueGainPerTP — 0건)
```

---

## 3. 결론

### 3.1 hydration / nutrition / morale — **P0 아님 (false alarm)**

`CharCreate.js:296~297`의 `decayPerTP = 2.0` / `0.5` 할당은 **dead store**. 매 TP마다 `StatSystem.onTP()`가 `BALANCE.stats.*DecayPerTP`로 오버라이드. 게임 런타임은 BALANCE 값(hydration 1.0 / nutrition 0.5 / morale 0.2) 사용 중.

단, dead store 자체는 코드 가독성·유지보수에 해롭다. 이후 누군가가 "decayPerTP를 변경하면 게임 동작이 바뀐다"고 잘못 추론할 수 있음.

### 3.2 fatigue — **dead store 아님. 우연히 BALANCE와 일치**

`gs.stats.fatigue.decayPerTP`는 `StatSystem.onTP():62`에서 직접 사용됨 (오버라이드 없음).

| 출처 | 값 |
|------|----|
| `GameState.js:29` 기본값 | 0.8 |
| `CharCreate.js:298` 캐릭터 생성 시 리셋 | 0.8 |
| `gameBalance.js:19` `fatigueGainPerTP` | 0.8 |

세 곳이 우연히 일치. 만약 미래에 `BALANCE.stats.fatigueGainPerTP`를 0.6으로 완화해도 **CharCreate가 0.8로 다시 박아 변경이 무효화됨.** 이건 잠재적 P1.

### 3.3 staminaRegenPerTP — 정상

`StatSystem.js:472`에서 `BALANCE.stats.staminaRegenPerTP` 사용. `CharCreate.js:228`에서는 `decayPerTP: 0`으로 설정 (스태미나는 별도 _updateStamina 경로). 충돌 없음.

---

## 4. 권고 액션

### 4.1 P3 — 정리 (`CharCreate.js` decayPerTP 하드코딩 제거)

**보완안:** `CharCreate.js:296~297` 두 줄 삭제. hydration·nutrition·morale은 어차피 BALANCE 오버라이드라 무의미.

```diff
   // ── 스탯 리셋 ────────────────────────────────────────────
-  gs.stats.hydration.decayPerTP   = 2.0;
-  gs.stats.nutrition.decayPerTP   = 0.5;
   gs.stats.fatigue.decayPerTP     = 0.8;
   gs.stats.hydration.current      = 200;
   gs.stats.nutrition.current      = 80;
```

morale은 `decayPerTP` 설정이 295~304행에 없음. 무관.

### 4.2 P1 — fatigue도 BALANCE 오버라이드 일관화

**보완안:** `StatSystem.onTP():62`를 다음과 같이 변경.

```diff
-  gs.modStat('fatigue', gs.stats.fatigue.decayPerTP * (moraleTier.fatigueGainMult ?? 1.0));
+  gs.modStat('fatigue', BALANCE.stats.fatigueGainPerTP * (moraleTier.fatigueGainMult ?? 1.0));
```

`CharCreate.js:298`의 `gs.stats.fatigue.decayPerTP = 0.8` 라인도 dead store가 되어 같이 정리 가능.

장점:
- `BALANCE.stats.fatigueGainPerTP` 변경이 즉시 게임에 반영.
- 4 stat이 모두 BALANCE 단일 진리.

위험:
- character abilities effect의 `fatigueDecay` 보정(`CharCreate.js:260, 310`)이 BALANCE에 적용 안 됨. 직업별 보정 별도 처리 필요.

```js
// CharCreate.js:260
if (e.fatigueDecay !== undefined) gs.stats.fatigue.decayPerTP = 0.8 * (1 + e.fatigueDecay);
```

이 보정을 BALANCE 우선 구조에 결합하려면 player에 `fatigueDecayMult` 플레이어 보정 필드 추가 + StatSystem이 적용하는 형태. 즉:

```diff
-  gs.modStat('fatigue', gs.stats.fatigue.decayPerTP * (moraleTier.fatigueGainMult ?? 1.0));
+  const fatigueMult = (gs.player.fatigueDecayMult ?? 1.0);
+  gs.modStat('fatigue', BALANCE.stats.fatigueGainPerTP * fatigueMult * (moraleTier.fatigueGainMult ?? 1.0));
```

직업 보정·CharCreate 동작은 별도 PR (`CharCreate.js`도 이에 맞춰 정리).

---

## 5. 시뮬 v2 v2 §14 갱신 트리거

`SYS_DESIGN_sim_v2_v2.md` §14에 본 결함을 P0 의심으로 등록했음. 본 검증 결과로 **P0 아님 (false alarm)**으로 갱신.

- §14 hydration/nutrition/morale 부분 — "dead store, BALANCE 오버라이드 작동 중" 확인.
- §12 R6 — "P0 의심" 표현을 "P3 정리 권고 (dead store 제거) + P1 fatigue 일관화 권고"로 갱신.

본 보완은 `SYS_DESIGN_sim_v2_v2.md` v3에서 반영 예정. 현재 v2는 별도 후속 메모로 첨부.

---

## 6. 결론·후속

| 항목 | 분류 | 후속 |
|------|------|------|
| hydration / nutrition / morale 하드코딩 dead store | **P3** | 정리 PR (시스템 백승호) — 시뮬 v2 작업과 별개로 가능 |
| fatigue BALANCE 오버라이드 누락 | **P1** | 통합 PR (StatSystem.onTP():62 + CharCreate fatigueDecay 결합) |
| `BALANCE.stats.fatigueGainPerTP` 미사용 grep 결과 | 정상 (현재 우연히 일치) | fatigue P1 PR 후 자동 해소 |

**시뮬 v2 보완판은 영향 없음.** 게임 측 개선과 분리.

---

*문서 끝. P3 정리 PR과 P1 fatigue 일관화 PR은 시뮬 v2 PR1과 병렬 가능. 단 PR4a의 statTickChain 단위 검사가 fatigue chain을 검증하므로 P1 fatigue 일관화 PR이 PR4a보다 선행 권고.*
