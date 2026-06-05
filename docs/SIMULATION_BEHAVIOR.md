# 시뮬 행동 프로파일 (baseline v16)

> **작성: 2026-06-06 / 데이터: `BAL_SIM_baseline_v16_result.json` `kpi.behaviorProfile`.**
> 시뮬 player AI가 "실제로 무엇을 하는가"를 직업별로 집계 — 탐색 구·제작·소비·낚시·이동·전투·퀘스트.
> 캡처 방식: `runner.mjs`가 일별 행동 문자열(`aiLog`)을 보존 → `reporters/behaviorProfile.mjs`가 파싱·집계. **playerAI/RNG 무변경**이라 결정성·KPI·fingerprint 불변(v15 동일).

---

## 1. ★ 구조적 한계 먼저 (중요)

**시뮬 AI는 전 직업 day 4~8에 아사**한다(K1 0%). 그래서 중후반 게임플레이를 도달하지 못해 일부 데이터가 구조적으로 비어 있다.

| 데이터 | 값 | 이유 |
|--------|----|------|
| **전투** (kills/combats) | **전 직업 0** | playerAI에 공격 행동 없음 + `actExplore`가 인카운터 우회. 전투 미발생 |
| **이동** | **~0** (chef만 100회 중 1건) | `actMove`는 음식+물<2 & day>3에만 — 그 전에 아사 |
| **후반 이벤트** (siege/raid/horde) | **0** | day 60~100 발생인데 미생존 |
| 탐색·제작·소비·낚시 | 실데이터 | day 1~8 행동 |
| 퀘스트 시작 | 실데이터 (620~1015) | 초기 퀘스트 체인 로드 |
| 퀘스트 완료 | 실데이터 (94~216) | **초반 자동/조건 충족 퀘스트** (사망 전 완료분) |

→ 전투·이동 데이터가 0인 건 버그가 아니라 **시뮬 AI의 보수성(아사 우선 사망)** 때문. 이것 자체가 M4 "시뮬-본체 격차"의 정체.

---

## 2. 직업별 행동 프로파일 (100회 합산)

### 공통 패턴
모든 직업이 **시작 구에 머물며 탐색·요리·소비를 반복**하다 아사. 행동 비중: 탐색 > 소비 > 수면 > 제작.

| 직업 | 평균 행동/회차 | 탐색 구 (loot 합) | 낚시 | 퀘스트 시작/완료 |
|------|--------------|------------------|------|----------------|
| doctor | 19.6 | dongjak (2,810) | 0 | 620 / 134 |
| soldier | 26.0 | dobong (3,813) | 0 | 650 / 100 |
| firefighter | 24.9 | eunpyeong (3,924) | 0 | 647 / 94 |
| homeless | 27.0 | gwangjin (3,635) | 213 | 651 / 102 |
| **chef** | **42.6** | junggoo (7,480) + dongdaemun (32) | 336 | 1,015 / 216 |
| engineer | 28.6 | yongsan (4,651) | 205 | 650 / 100 |

> chef가 행동·탐색·퀘스트가 압도적으로 많은 건 **단독 최장 생존(day 7.7)** 때문 — 더 오래 사니 더 많이 행동.

### 제작 아이템 (직업 공통)
전 직업 `boiled_water`(물 끓이기) + `cooked_noodles`(T1 변환) 2종만 제작. 100~357회.
→ 시뮬 craft는 **생존 직결 2종에 집중**, 다양한 레시피 미활용.

### 소비 아이템 (직업별 특색)
| 직업 | 주요 소비 (상위) |
|------|----------------|
| doctor | canned_food 200 · water_bottle 167 · stethoscope 13 |
| soldier | cooked_noodles 200 · water_bottle 136 · herb 63 |
| firefighter | cooked_noodles 200 · water_bottle 146 · herb 84 |
| homeless | cooked_noodles 200 · water_bottle 182 · **fish_medium 54 · fish_small 34** |
| **chef** | water_bottle 369 · canned_food 138 · **hearty_stew 100 · chef_meal_kit 100 · preserved_ration 100 · chef_journal 66 · spice_blend 60** |
| engineer | cooked_noodles 200 · water_bottle 100 · fish_medium 55 |

> chef만 **전용 자원(hearty_stew·chef_meal_kit·spice_blend·chef_journal)을 실제 소비** — M3 PR17 chef 정체성 강화가 시뮬에서 발현됨을 확인(actEat candidates 5곳 등록 효과).

### 낚시 (hasFishing 직업만)
- **homeless 213 · chef 336 · engineer 205** / doctor·soldier·firefighter **0**
- hasFishing 구 + 낚싯대 보유 직업만 발동 (협의서 PR9 firstEnterReward 정합)

---

## 3. 횡단 관찰

1. **이동 부재** — 6직업 전부 시작 구 고착. 시뮬 AI는 자원 고갈로 강제 이동(day 3+) 전에 아사 → 도시 동선·인접 구 탐색이 측정 불가.
2. **전투 부재** — 시뮬은 전투를 일으키지 않음(인카운터 우회). 직업별 전투 스탯(`characterAdapter` SIM_COMBAT_DEFAULTS)은 정의돼 있으나 미발현.
3. **제작 단조** — boiled_water·cooked_noodles 2종에 집중. blueprint 다양성 미활용(생존 우선).
4. **chef 정체성 발현** — 전용 자원 소비로 PR17 효과 확인. 반대로 다른 직업은 Tier-2 자원(family_photo·worn_photo 등) 소비가 미미(1~2회).
5. **퀘스트** — 초기 체인이 로드되고 일부 자동 완료되나, 메인 퀘스트 진행은 사망으로 중단.

---

## 4. 데이터 위치 · 재생성

```bash
# 재측정 (행동 프로파일 포함)
node tools/sim/v2/run_baseline.mjs
#   → BAL_SIM_baseline_v16_result.json  kpi.behaviorProfile.byCharacter[직업]
#   → 콘솔에 직업별 요약 출력

# 단일 직업 행동 추적 (디버그)
node tools/sim/v2/index.mjs --char chef --runs 1
```

`behaviorProfile` 필드 구조:
```jsonc
byCharacter.<직업>: {
  runs, avgActionsPerRun,
  actionCounts:      { explore, consume, sleep, craft, fish, move, ... },
  exploreByDistrict: { 구: loot합 },
  craftedItems:      { 아이템: 횟수 },
  consumedItems:     { 아이템: 횟수 },
  moves:   { total, routes },
  fishing: { total, byDistrict },
  combat:  { totalKills, combats },   // 구조적 0
  quests:  { started, completed },
}
```

---

## 5. 관련 문서

| 문서 | 위치 |
|------|------|
| 시뮬 툴 레퍼런스 | `docs/SIMULATION_TOOL.md` |
| baseline v15 보고서 (KPI·결정성) | `simulation-data/baselines/reports/BAL_SIM_baseline_v15_report.md` |
| 진행 트랙 | `prompt_plan.md` §M4 |

---

*문서 끝. 행동 캡처 로직(`behaviorProfile.mjs`) 변경 시 본 문서 우선 갱신.*
