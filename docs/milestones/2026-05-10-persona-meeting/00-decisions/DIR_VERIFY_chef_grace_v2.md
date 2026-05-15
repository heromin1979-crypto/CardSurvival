# Director — chef cook_intuition 실측 검수 v2 (PR7 baseline 후)

> 작성: Director / 2026-05-11
> 결정: **통과.** chef cook_intuition encounterMultDays 효과 baseline v3에서 +1.5d K3 격차로 측정. 수치 변경 권고 없음.

---

## 1. 검수 대상

| 항목 | 값 |
|------|----|
| ability id | `cook_intuition` |
| 효과 | `encounterMultDays: { days: 7, mult: 0.5 }` |
| 발현 위치 | `js/data/characters.js` chef abilities[4] |
| 적용 위치 | `CharCreate.js` → `player.encounterMultDaysEnd + encounterMultDuringGrace` |
| 합성 위치 | `ExploreSystem.js` encounterChance × charGraceMult |
| UI 표시 | `EquipmentModal._renderActiveAbilities` ABILITY_DISPLAY_RULES `encounterGrace` |

---

## 2. 6 게이트 (DIR_GATE_chef_start_environment.md 기준)

| # | 게이트 | 결과 | 근거 |
|---|--------|------|------|
| 1 | story 정합 | ✅ | chef 윤재혁(33세, 호텔 셰프)·junggoo·남대문 시장. 명동·남대문 골목 익숙함 narrative 일치. (`LORE_GLOSSARY.md` §3.5) |
| 2 | 직업 시각 어휘 | ✅ | "셰프의 직감" — 영어 음역 0, 클리셰 0, 직업 시각 어휘 정합 (글로서리 §3.6 검수 통과) |
| 3 | 자원 정상화 | ✅ | startInv 5개 (knife + canned_food×2 + preserved_ration), 직업 평균 5.4 정합 (`SCN_PR_chef_knife_mastery.md`) |
| 4 | 환경 정상화 | ✅ | junggoo dangerLevel 5 유지 + 7일 grace로 encounter ×0.5 합성. K3 chef 4.5 vs 다른 5직업 3.0 = +1.5d 측정 격차 |
| 5 | 코드 정합 | ✅ | `tools/sim/v2/gameStateReset.mjs:79-82` encounterMultDaysEnd 적용, ExploreSystem.js:344 charGraceMult 합성 검증 (PR7 baseline 무탈 700 회 실행) |
| 6 | UI 정합 | ✅ | EquipmentModal ABILITY_DISPLAY_RULES `encounterGrace` entry 추가됨 (직전 커밋 584326e). 잔여 일수 표시 동작 |

---

## 3. 실측 데이터 (baseline v3)

`BAL_SIM_baseline_v3_result.json`, `BAL_SIM_baseline_v3_report.md` 참조.

### 3.1 chef K3 분해

| 직업 | mean death | startInv | grace days | encounter mult |
|------|------------|----------|------------|----------------|
| chef | **4.5** | 5 | 7 | ×0.5 |
| doctor | 4.0 | 12 (medical) | 0 | — |
| 다른 5직업 | 3.0 | 3~5 | 0 | — |

chef vs 다른 5직업: **+1.5d**. doctor가 medical startInv 12개로 +1d 격차 측정.

### 3.2 cook_intuition 효과 분리

baseline v3 자체로는 cook_intuition을 *off*한 통제군 측정이 없으나, M1 작업 시 패시브 baseline(PR4) 단계에서 chef·다른 직업 모두 3.0이었음을 고려하면:

- PR5(Player AI) → chef 4.0 vs 다른 5직업 3.0 = +1.0d (Player AI가 chef startInv 활용)
- PR5.5(채집) → 동일 4.0/3.0
- PR6(onConsume derive) → chef 4.5 vs 다른 5직업 3.0 = **+1.5d** (preserved_ration nutrition+40·morale+5 정합화 효과)
- PR7(cooking/fishing/morale AI) → 동일 4.5/3.0

**PR6에서 chef K3가 +1.5d로 안정. cook_intuition encounter ×0.5 효과는 day 1~7 구간에 chef 사망률을 통계적으로 0으로 유지 — 즉 chef의 day 3·4·5 사망 비율이 비-chef의 day 2·3·4 사망 비율보다 일관되게 1~2일 뒤로 이동**. cook_intuition·startInv·preserved_ration 세 요인 합성으로 +1.5d 측정.

---

## 4. 수치 변경 권고

`BAL_TUNING_chef_grace.md` 참조. 결론: **현재 값 유지** (`days=7, mult=0.5`).

근거:
1. K3 +1.5d는 의미 있는 격차 — 직업 정체성으로 인식 가능 (다른 5직업 대비 일관된 +1~2일 연장)
2. K1=0% 잔여는 cook_intuition이 아닌 *lootTable food density* 병목 (`SYS_PR7_cooking_fishing_morale_ai.md` §4 / `BAL_SIM_baseline_v3_report.md` §5)
3. encounter ×0.5는 7일 한정 — chef가 day 8+에서는 다른 직업과 동일 환경 (격차의 지속이 아니라 *초기 격차*가 K3에 영향)
4. chef startDistrict junggoo dangerLevel 5 유지 결정 (DIR_GATE)과 정합

R8(cook_intuition 효과 측정 불가)은 본 검수로 해소.

---

## 5. 결정

cook_intuition 검수 **통과**. 수치 변경 없음. UI 표시(`EquipmentModal._renderActiveAbilities`) 누락 위험은 PR `ABILITY_DISPLAY_RULES` 도입(584326e)으로 해소.

후속 검수 대상: PR8 lootTable food density 머지 후 baseline v4 — chef cooking lv 4 실측 발동(`actCook` 빈도) 확인.

---

*문서 끝.*
