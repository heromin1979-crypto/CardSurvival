# 시스템 — PR6 음식 회복량 game 정합화 (R7 해소)

> 작성: 시스템 백승호 / 2026-05-11
> 결정: 머지. R7 해소 (NUTRITION_RESTORE hardcoded → items.js derive). chef K3 +0.5일.

## 1. 변경

`playerAI.mjs`:
- HYDRATION_RESTORE_PER_BOTTLE=50, NUTRITION_RESTORE_PER_FOOD=30 하드코딩 → 폐기
- `applyOnConsume(itemId)` 신규 — `ITEMS[itemId].onConsume`의 모든 stat 변경 적용
- `actDrinkWater` / `actEat` 후보 목록 확장 (distilled_water, herbal_tea, meat_stew 등)

## 2. items.js onConsume 활용

| 아이템 | onConsume |
|--------|-----------|
| preserved_ration | nutrition +40, morale +5 |
| canned_food | (확인 필요, 대략 nutrition +20~30) |
| energy_bar | hydration +5, nutrition +20, fatigue -15 |
| water_bottle | (hydration +N, 대략 30~50) |

→ 시뮬이 game 실측 효과 그대로 적용. fatigue·morale 부수 효과도 반영 (energy_bar의 fatigue -15 등).

## 3. baseline 변화

| 직업 | PR5.5 K3 | PR6 K3 |
|------|---------|--------|
| chef | 4.0 | **4.5** (median 5) — preserved_ration 활용 |
| doctor | 3.9 | 3.9 |
| 다른 5직업 | 3.0 | 3.0 |

사망 원인:
| 원인 | PR5.5 | PR6 | 변화 |
|------|-------|-----|------|
| 아사 | 588 | 569 | -19 |
| 탈수 | 48 | 20 | -28 (음식의 hydration 부수 효과) |
| 절망 | 64 | 110 | +46 (음식의 morale 부수 효과 활성 → 인벤토리 고갈 시 morale 급락) |

## 4. K1 여전 0% — 다음 한계

R7은 해소됐으나 K1=0% 유지. 잔여 원인:
- morale 관리 시스템 미모델링 (chef warm_meal 동료 사기, doctor heal 등)
- 100일 = 음식 ~120개 필요. 시뮬 탐색으로 모이는 음식 < 필요량
- 캠프파이어·요리 제작 미모델링

→ **K1 측정 가능화는 PR7 (제작·요리 AI) 후속** (M2 신규).

## 5. R7 → R7-1 (분할)

| ID | 상태 |
|----|------|
| R7 (NUTRITION_RESTORE 추정값) | ✅ 해소 |
| R7-1 (제작·요리 AI 부재) | ⏳ PR7 권고 |
| R7-2 (morale 관리 AI 부재) | ⏳ PR7 권고 |

## 6. 결정

PR6 머지. chef K3 +0.5일은 의미 있는 측정 효과 (preserved_ration이 chef startInv에 있어 직업 보너스로 드러남).

K1 측정은 PR7 후 active baseline v3.

---

*문서 끝.*
