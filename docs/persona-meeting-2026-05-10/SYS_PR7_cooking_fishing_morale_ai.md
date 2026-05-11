# 시스템 — PR7 cooking / fishing / morale AI 도입

> 작성: 시스템 백승호 / 2026-05-11
> 결정: 머지. AI 구현은 완료. K1=0% 변화 없음 — 다음 병목은 lootTable food density (PR8 권고).

---

## 1. 변경

### 1.1 `tools/sim/v2/playerAI.mjs`

세 가지 행동 함수 신규 추가, `runDayAI()`에 우선순위대로 wire.

**`actCook(simInv)`** — food 카테고리 레시피 사전 캐시(`FOOD_BLUEPRINTS`)에서 다음 조건을 모두 만족하는 레시피 중 영양가 최대 산출물 선택, 1회 제작:
- `requiredSkills.cooking ≤ player.skills.cooking.level`
- `_hasAllInputs(simInv, bp)` — 모든 stage requiredItems 충족
- `_hasMeaningfulInputs(bp)` — 모든 stage requiredItems가 비어 있는 레시피(harvest_* 등 구조물 산출)는 제외 (무한 펌프 차단)
- 산출물 `onConsume.nutrition + onConsume.hydration > 0` (가공재 derive 제외)

`requiredTools`(campfire 등 구조물) 체크는 시뮬에서 생략 — simInv는 board card 인스턴스가 없어 구조물 모델링 불가. 음식 회복량 활성화가 목적.

**`actBoostMorale(simInv)`** — `morale.current < 30`일 때 simInv에서 `onConsume.morale` 최대 아이템 1개 소비. 음식 외 morale 회복 아이템도 자동 처리 (preserved_ration·legendary 등).

**`actFish(simInv)`** — `DISTRICTS[currentDistrict].hasFishing === true`이고 `ROD_IDS = [fishing_rod_improved, fishing_rod_basic, fishing_rod]` 중 1개 보유 시 1회 어획 시도:
- chance = `BALANCE.fishing.baseCatchChance + (fishingLv/20) × (max-base)` (+ improved rod bonus)
- 성공 시 `fish_small (55%) / fish_medium (45%)` + rare 확률(`fishingLv/20 × rareFishChanceMax`)로 `fish_large`

**부수 변경:**
- `FOOD_IDS` set 확장 — fish_small/medium/large/cooked, cooked_meat, cooked_noodles, cooked_rice, smoked_meat 추가
- `WATER_IDS` set 확장 — boiled_water, purified_water 추가
- `actDrinkWater` 후보 목록에 distilled_water·purified_water·boiled_water 추가
- `actEat` 후보 목록에 cooked_* 4종 + fish_* 4종 추가
- `actExplore` 오염 필터에 `COOKING_INPUT_ALLOWLIST = {contaminated_water}` — 가공 입력 후보는 채집 허용. `actDrinkWater` 후보에서 contaminated_water는 제외돼 있어 raw drinking은 차단됨.

### 1.2 `tools/sim/v2/gameStateReset.mjs` (P1 부수 보정)

`characters.js` startingSkills가 `GameState.player.skills.{id}.level`에 주입되지 않던 결함 보정.

**이전 상태:**
- `characterAdapter.buildCharacterConfig`은 `cc.skills = {...ch.startingSkills}` 추출
- `resetGameStateForRun()`은 cc.skills를 *읽기만* 하고 GameState.player.skills에 주입하지 않음
- 결과: chef cooking=4·doctor medicine=3·homeless scavenging=4 등 직업 보너스 무효화 → AI 요리 무한 차단(`actCook` skill=0으로 모든 레시피 차단)

**보정:** resetGameStateForRun에 `cc.skills` 순회 + `GameState.player.skills[id].level` 주입 루프 추가. 보정 후 probe로 `GameState.player.skills.cooking.level = 4` 확인.

### 1.3 `tools/sim/v2/run_baseline.mjs`

- `OUTPUT_FILE`: `BAL_SIM_baseline_v1_result.json` → `BAL_SIM_baseline_v3_result.json`
- `buildTag`: `sim-baseline-v1` → `sim-baseline-v3-pr7`

---

## 2. 검증

| 항목 | 결과 |
|------|------|
| `node --check tools/sim/v2/playerAI.mjs` | OK (syntax) |
| `node tools/sim/v2/run_baseline.mjs` | 700 runs in 6.7s |
| skill 주입 probe (chef 회차) | `cooking.level = 4` 확인 |
| cooking 가드 동작 | `cook:harvest_vegetable->vegetable` 발화 사라짐 |
| Math.random monkey-patch 결정성 | `balanceFingerprint: len316-h242a5b5f` 안정 |

---

## 3. baseline v3 결과 (PR7 적용)

700 runs. PR6 대비 K3 변화 없음.

| 직업 | mean death | median | PR6 비교 |
|------|------------|--------|----------|
| doctor | 4 | 4 | 동일 |
| chef | 4.5 | 5 | 동일 |
| 다른 5직업 | 3 | 3 | 동일 |

| 사망 원인 | PR7 | PR6 | 변화 |
|-----------|-----|-----|------|
| 아사 | 569 | 569 | 0 |
| 절망 | 110 | 110 | 0 |
| 탈수 | 20 | 20 | 0 |
| 극도 피로 | 1 | 1 | 0 |

K1 모든 직업 0%. K3 격차 chef +1.5d (vs 다른 5직업) 유지.

---

## 4. K1=0% 원인 분석 (PR7 발견)

PR7의 3 AI는 모두 정상 구현됐으나 **자원 게이팅으로 실질 발동 안 됨**.

### 4.1 actCook
- 시뮬 발동 0건 (cooking 가드 보정 후) — junggoo·gangnam 등 시작 구의 lootTable이 raw cooking 입력 (`rice`, `raw_meat`, `instant_noodles`, `herb`, `wild_berry`) 미포함
- 즉 chef cooking=4의 잠재력은 *blueprint 충족이 안 돼* 측정 불가
- 단, gameStateReset 보정으로 cooking·harvesting 등 *다른 시스템*에서 직업 보너스가 활성화될 수 있음 (간접 효과)

### 4.2 actFish
- 시뮬 발동 0건 — 모든 7직업 startInv에 `fishing_rod*` 없음
- 낚싯대는 `craft_improved_fishing_rod` 등 blueprint로만 생산 가능 (재료: 천·실·금속), 게임 초반(day 3 사망 평균) 안에 제작 불가능

### 4.3 actBoostMorale
- 시뮬 발동 빈도 낮음 — 대부분 회차가 day 3 아사로 morale 누적 부족
- morale 보호는 절망 사망 110건 → 측정 의미 있는 수준이나, raw food 부족이 더 우선 병목

---

## 5. R7-1 / R7-2 상태

| ID | 이전 상태 | PR7 후 |
|----|-----------|--------|
| R7-1 요리·낚시 AI 부재 | ⏳ PR7 권고 | ✅ 구현 완료, 발동 가능 자원 부재 |
| R7-2 morale 관리 AI 부재 | ⏳ PR7 권고 | ✅ 구현 완료, 발동 빈도 낮음 |
| R7-3 (신규) lootTable food density 부족 | — | ⏳ PR8 권고 |

---

## 6. 다음 권고 (M3 후속)

**PR8 — lootTable food density 보강** 또는 **시작 인벤토리 조정**:

1. 옵션 A: 각 구 lootTable에 `herb`/`wild_berry`/`raw_meat` 가중치 추가 (`scavenging` skill로 활성화)
2. 옵션 B: chef startInv에 `instant_noodles ×2 + contaminated_water ×3` 추가 → cooking AI 실제 발동
3. 옵션 C: hangang 등 fishing 가능 랜드마크 접근 시 자동 fishing_rod_basic 지급

baseline v3가 측정한 진짜 KPI는 **K3 격차 chef +1.5d** (cook_intuition + preserved_ration 효과). chef cook_intuition Director 검수는 `DIR_VERIFY_chef_grace_v2.md`에서 별도 통과.

---

## 7. 결정

PR7 머지. 시뮬 인프라 결함(skill 미주입) 부수 보정. K1 측정 가능화는 PR8(lootTable·startInv) 후 active baseline v4 권고.

---

*문서 끝.*
