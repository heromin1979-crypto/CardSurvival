# 시스템 — fatigue P1 일관화 PR

> 작성: 시스템 백승호 / 2026-05-11
> 대상: `StatSystem.onTP():62` + `CharCreate.js:260/310/296~298`
> 결정: 머지 완료.

---

## 1. 컨텍스트

`SYS_REVIEW_charcreate_decay_hardcode.md` § 3.2 발견:
- `gs.stats.fatigue.decayPerTP`가 StatSystem에서 직접 사용 (BALANCE 오버라이드 없음)
- `BALANCE.stats.fatigueGainPerTP` (0.8) grep 0건 → 미사용
- CharCreate.js 296행에서 `decayPerTP = 0.8`로 하드코딩하지만 BALANCE 변경 시 자동 반영 안 됨

## 2. 변경

### 2.1 `js/systems/StatSystem.js:62`
```diff
- gs.modStat('fatigue', gs.stats.fatigue.decayPerTP * (moraleTier.fatigueGainMult ?? 1.0));
+ const fatigueMult = (gs.player.fatigueDecayMult ?? 1.0);
+ gs.modStat('fatigue', BALANCE.stats.fatigueGainPerTP * fatigueMult * (moraleTier.fatigueGainMult ?? 1.0));
```

### 2.2 `js/screens/CharCreate.js`
```diff
- if (e.fatigueDecay !== undefined) gs.stats.fatigue.decayPerTP = 0.8 * (1 + e.fatigueDecay);
+ if (e.fatigueDecay !== undefined) gs.player.fatigueDecayMult = 1 + e.fatigueDecay;
```
(258행대 + 310행대 2곳 동시 변경)

### 2.3 `js/screens/CharCreate.js:296~298` dead store 정리
```diff
- gs.stats.hydration.decayPerTP = 2.0;
- gs.stats.nutrition.decayPerTP = 0.5;
- gs.stats.fatigue.decayPerTP   = 0.8;
+ // stats.{hydration|nutrition|morale}.decayPerTP은 StatSystem.onTP()가 BALANCE.stats로 매 TP 오버라이드
+ // (이전 하드코딩 2.0/0.5/0.8은 dead store. fatigue도 BALANCE 일관화로 dead.)
```

## 3. 검증

- ✅ `validate.js`: Errors: 0 / ALL CLEAR
- ✅ active baseline 700회: 회귀 없음 (이전과 동일 K3 분포)
- ✅ 시뮬 단위 검사 6/6 회귀 없음

## 4. 효과

- **BALANCE.stats.fatigueGainPerTP 단일 진리.** 향후 밸런스가 0.8 → 0.6 변경 시 게임 자동 반영.
- **player.fatigueDecayMult 분리.** 직업 ability 보정 명확화 (soldier `field_endurance: -0.3` → `fatigueDecayMult: 0.7`).
- **dead store 3건 제거.** `CharCreate.js:296~298` 정리.

## 5. PR5 player AI 영향

시뮬 player AI는 매일 sleep으로 fatigue를 10으로 reset. 매 TP 누적 0.8 × 72 = 57.6/day 누적되어도 이튿날 reset. K3 (day 3~4 사망) 동일.

## 6. 후속 (PD 백로그)

- soldier `field_endurance: -0.3` → `fatigueDecayMult: 0.7`로 표시 일관화 (어휘 정정. 정합 효과 동일)
- doctor·firefighter abilities에도 fatigueDecay 보정 있다면 같은 패턴

---

*문서 끝. game data 표면 정합 외 동작 변경 0건.*
