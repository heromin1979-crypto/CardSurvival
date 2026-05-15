# 밸런스 — chef cook_intuition grace 수치 확정

> 작성: 밸런스 권지나 / 2026-05-11
> 결정: **현재 값 유지** — `days = 7`, `mult = 0.5`. baseline v3 측정 격차 +1.5d K3가 목표 범위에 부합.

---

## 1. 현재 수치

| 필드 | 값 | 위치 |
|------|----|----|
| `effect.encounterMultDays.days` | 7 | `js/data/characters.js` chef `cook_intuition` ability |
| `effect.encounterMultDays.mult` | 0.5 | 동상 |

게임 측 합성: `ExploreSystem.encounterChance × charGraceMult` (charGraceMult = mult while day ≤ encounterMultDaysEnd).
사망 day → encounter 만남 → 전투 → fatality 흐름에서 day 1~7 chef encounter는 **절반**.

---

## 2. baseline v3 측정 격차

`BAL_SIM_baseline_v3_report.md` §3:

| 직업 | mean K3 |
|------|---------|
| chef | **4.5** |
| doctor | 4.0 |
| 다른 5직업 | 3.0 |

chef vs 다른 5직업: **+1.5d**. PR5(Player AI)부터 시작해 PR6(onConsume derive)에서 +1.5d로 안정.

---

## 3. 튜닝 검토 시나리오

### 3.1 days 단축 (예: 5일)
- 가설: grace 짧으면 chef 격차 ↓
- 시뮬 미실측 (baseline v3 한 점 측정). 추정: chef 4.5 → ~4.0 (격차 -0.5d)
- 권고: **변경 없음.** +1.5d 격차가 직업 정체성으로 인식 가능한 최소 단위.

### 3.2 days 연장 (예: 14일)
- 가설: grace 길면 chef 격차 ↑
- 추정: chef 4.5 → ~5.0 (격차 +0.5d). 단 day 8~13 구간 encounter 절감 효과는 fatigue·morale 등 다른 사망 사유에 의해 marginal.
- 권고: 본 게임의 사망 분포(아사 569 / 절망 110)를 고려하면 encounter 절감만으로 격차 ↑ 한계 명확. **변경 없음.**

### 3.3 mult 강화 (예: 0.3)
- 가설: encounter ×0.3 → chef 격차 ↑
- 추정: 미실측. encounter 사망 자체가 K5에서 의미 있는 비중 아님(주된 사망: 아사·절망) → marginal 효과.
- 권고: **변경 없음.**

### 3.4 mult 약화 (예: 0.7)
- 가설: encounter ×0.7 → chef 격차 ↓
- 추정: 격차 -0.3~-0.5d
- 권고: **변경 없음** (현재 +1.5d가 의도된 격차 — 직업 정체성 비대칭 해소가 chef gate의 목적).

---

## 4. 변경 권고 시점

다음 조건 충족 시 재검토:

| 조건 | 트리거 |
|------|--------|
| K1 측정 가능화 (PR8 lootTable food density 후 baseline v4) | chef K1이 다른 5직업 K1 대비 +20%p 이상 ↑ → days 단축 검토 |
| chef cooking lv 4 실측 발동 | actCook 빈도 실측 후 cook_intuition + cooking lv 4 효과 분리 측정 필요 시 |
| 다른 직업 abilities 추가 (M3 5직업 Tier-2) | 직업 간 격차 재정렬 시 |

**baseline v4 측정 결과에 따라 본 문서 갱신.** v4까지 *변경 없음*.

---

## 5. R 위험 갱신

| ID | 이전 | 현재 |
|----|------|------|
| R8 cook_intuition 효과 측정 불가 | ⏳ PR7 후 | ✅ 해소 (baseline v3 K3 +1.5d 측정) |

---

## 6. 결정

`days=7, mult=0.5` 유지. PR8 후 baseline v4 결과에 따라 재검토.

---

*문서 끝. M3 진입 후속 #4 종결.*
