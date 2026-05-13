# 시스템 — PR5 Player AI 도입 보고

> 작성: 시스템 백승호 / 2026-05-11
> 대상: `tools/sim/v2/playerAI.mjs` + runner 통합 + active baseline 700회
> 결정: 머지. 단 **자원 채집 행동(탐색·제작) 부재 한계 명시.** 추가 PR5.5 권고.

---

## 1. 산출물

- `tools/sim/v2/playerAI.mjs` — 1차 기본 AI (수면·수분·영양)
- `runner.mjs` — day 시작 시 `runDayAI(simInv)` 호출, AI actions / remainingInv trace
- active baseline 700회 재실행 — 6.3초 (PR4 4.0초 + AI 호출 2.3초)

## 2. 1차 AI 행동 우선순위

1. **수면**: fatigue > 60 → fatigue=10 + HP+10 (1일 1회)
2. **수분**: hydration < 80 → water_bottle 소비 (+50 hydration)
3. **영양**: nutrition < 30 → canned_food / preserved_ration / energy_bar / sandwich / baked_bread 우선순위로 1개 소비 (+30 nutrition)

자원 채집·이동·전투·제작은 PR5에서 제외 (PR5.5 후속).

## 3. active baseline 실측 — 직업 격차 첫 측정

| 직업 | 평균 사망일 | 비고 |
|------|------------|------|
| **chef** | **4.0** | knife_mastery startingItems PR 효과 |
| doctor | 3.9 | medical_supply 12개 시작 |
| soldier | 3.0 | tactical_gear 5개 |
| firefighter | 3.0 | rope+hand_axe 3개 |
| homeless | 3.0 | street_kit 5개 |
| engineer | 3.0 | scrap+wire 3개 |
| pharmacist | 3.0 | pharma_kit 5개 (P0 hotfix v2) |

→ **chef·doctor가 다른 5직업보다 +1일 생존.** Player AI가 startInv를 사용하므로 시작 인벤토리 수량이 곧 K3 차이로 발현.

## 4. 사망 원인 분포

| 원인 | 회차 수 | 비율 |
|------|---------|------|
| 아사 | 500 | 71.4% |
| 탈수 | 174 | 24.9% |
| 절망 | 26 | 3.7% |

`fatigue` 사망 0건 (PR5 sleep AI 효과). **다음 임계는 nutrition.** Player AI가 보유 음식을 모두 소비한 후 day 3~4에 아사.

## 5. 한계 — 자원 채집 부재

PR5는 **보유 자원 사용**만 한다. 자원 보충(탐색·제작) 없음. 결과:
- 시작 인벤토리 소진 = day 3~4 사망 보장
- K1 100일 생존 = 0% 전 직업
- 메인 퀘스트 진행 0% (NPC 영입·이동 없음)
- chef cook_intuition 7일 grace 효과 측정 불가 (day 7 도달 전 사망)

## 6. PR5.5 후속 (M2 추가 권고)

| 행동 | 트리거 | 효과 |
|------|--------|------|
| 자동 탐색 | 매일 1회, 시작 구 | lootCountMin~Max에서 랜덤 자원 |
| 이동 | 시작 구 자원 < 50% 시 인접 dangerLevel 낮은 구로 | travelCostTP 적용 |
| 인벤토리 보충 | 탐색 결과 자동 inv 추가 | |

K1 0% → 5~20% 범위 도달 예상. active baseline v2 가능.

## 7. 결정

PR5 머지. baseline의 직업 차이(K3 +1일 chef/doctor) 측정 가치 있음. K1·E1·legendary 도달은 PR5.5 후 측정.

`BAL_SIM_baseline_v1_result.json` 갱신됨 (active 700회).

---

*문서 끝. PR5.5는 M2 진입 시 시스템 백승호 후속.*
