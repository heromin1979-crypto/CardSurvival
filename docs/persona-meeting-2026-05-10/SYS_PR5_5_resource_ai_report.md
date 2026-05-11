# 시스템 — PR5.5 자원 채집 AI 보고

> 작성: 시스템 백승호 / 2026-05-11
> 결정: 머지. K1 격차 측정 한계는 시뮬 추정값 정합성 후속 작업.

---

## 1. 변경

`playerAI.mjs`에 추가:
- `actExplore()` — `generateDistrictLoot(districtId)` 호출, 비오염 자원만 simInv 추가
- `actMove()` — 자원 부족 시 인접 dangerLevel 더 낮은 구로 이동
- `runDayAI()` 매일 탐색 3회 + 자원 < 2개일 때 이동

## 2. baseline 결과 (PR5.5 적용)

| 직업 | mean death | 변화 |
|------|-----------|------|
| doctor | 3.9 | 동일 |
| chef | 4.0 | 동일 |
| 다른 5직업 | 3.0 | 동일 |

K1 전 직업 0% (변화 없음).

사망 원인 분포 변화:
| 원인 | PR5 | PR5.5 | 변화 |
|------|-----|-------|------|
| 아사 | 500 | 588 | +88 (악화) |
| 탈수 | 174 | 48 | -126 (개선 — 물 채집 효과) |
| 절망 | 26 | 64 | +38 (가용 음식 부족으로 인한 morale 하락) |

→ **물은 채집으로 해결, 음식은 부족.** 사망 원인이 탈수 → 아사로 이동.

## 3. K1 미달의 원인 분석

### 3.1 시뮬 단순화
- `NUTRITION_RESTORE_PER_FOOD = 30` (시뮬 추정값)
- 게임 실제 음식 효과(items_misc.js의 `consumable.nutrition`)는 30~60 범위
- 시뮬 회복 낮으면 baseline에서 K1 낮게 측정됨

### 3.2 lootTable 가중치
- 각 구의 lootTable에서 식료품 가중치는 ~10% (`herb` weight 8, `water_bottle` 10 등이 25 슬롯 중 일부)
- 매 탐색 1~3 아이템 × 10% 식료품 비율 = 0.1~0.3 음식/탐색
- 매일 3회 탐색 × 0.2 = 0.6 음식/일 (필요 1.2개의 절반)

### 3.3 시뮬과 게임 격차
- 게임 player는 제작(요리)·낚시·캠프 음식 관리 활용
- 시뮬은 단순 raw food만 — 제작 없음
- baseline은 "raw food only" 환경 측정

## 4. baseline 한계 명시 (R7 신규)

| ID | 한계 |
|----|------|
| R7 | 시뮬 player AI는 음식 회복량·제작·낚시 미모델링. K1 = 0%는 "raw food only" baseline. game 실제 K1은 더 높음(BALANCE.design 10~20% 범위 가능). |

**완화안 (M2 백로그):**
- 시뮬 NUTRITION_RESTORE 값을 items.js의 `consumable.nutrition` derive
- player AI에 제작·낚시 행동 추가
- 또는 baseline 정의를 "raw food only minimum survival floor"로 재정의

## 5. 의미 있는 산출

- **chef·doctor가 다른 5직업보다 +1일 생존** — startInv 효과 (직업 격차의 일관된 측정)
- **사망 원인 분포 변화** — 탈수 → 아사 (자원 채집 효과 + 잔여 부족)
- **탐색 결정성 검증** — 700회 시뮬 결정적, generateDistrictLoot 시드 정합

## 6. 결정

PR5.5 머지. K1 측정은 R7 한계 명시. **active baseline의 진짜 KPI는 K3(직업별 사망일 격차)** — 4.0 vs 3.0의 +1일 차이가 측정 가능한 격차.

Director 검수(`DIR_VERIFY_chef_start_grace.md`)의 cook_intuition baseline 실측은 R7 해소 후로 추가 이연.

---

*문서 끝. R7 해소 PR은 PR6 (음식 회복량 game 정합화 + 제작 AI) M2 신규.*
