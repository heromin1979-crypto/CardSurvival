# 밸런스 — baseline v9 측정 보고 (PR13 후)

> 작성: 밸런스 권지나 / 2026-05-12
> 측정 대상: PR13(homeless `street_solace` + engineer `workshop_focus` Tier-2 abilities + 신규 자원 `worn_photo` + `sketch_notebook` + `newspaper_bundle` onConsume.morale 부여) 머지 후
> 결정: **K1 0% 10회 연속** (PR5 → PR13). R8-1 부분 완화 단정 (절망 v8 405 → v9 377, -28건). homeless 절망 단독 -22건. R10-1 폭증 일부 회수.
>       **R13-1 신규 위험 등록 단언** — Tier-2 ability 가산 분기 `tools/sim/v2/playerAI.mjs` 미구현으로 `moraleRecoveryBonus`·`moraleOnCraft`·`moraleOnDismantle`·`sketchNotebookBonus` 무작용. SCN_QUEST 추정-실측 격차 일차 원인 단정.
>       R11-1 미발동 (모니터링 유지) — chef 격차 정의 2 v8 +0.60d → v9 **+0.50d** 임계 경계 도달이나 액션 트리거 미충족. engineer K3 v8 4.4 → v9 **4.9** (+0.5d) 단독 향상.

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR13 누적). PR13 변경 라인 4 파일 +52/-2:
  - `js/data/characters.js` — homeless abilities `street_solace` 추가 + engineer abilities `workshop_focus` 추가 + 양 직업 `startingItems` 확장
  - `js/data/items.js` (또는 `items_misc.js`) — `worn_photo` 신규 등록 + `newspaper_bundle` `onConsume.morale` 부여 + `sketch_notebook` 신규 등록
  - `js/data/stackConfig.js` — 신규 2 아이템 stack 규칙 등록
  - `js/data/districts.js` — `newspaper_bundle` 25구 lootTable 가중치 확인
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 700 runs (7직업 × 100회), `RUNS_PER_CHARACTER=100`, `SEED_BASE=0`
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: **11.3초** (`meta.totalDurationMs = 11265`)
- BALANCE leaf 합: 227 (`drift.balanceLeafTotal`), **fingerprint `len316-h242a5b5f`** — v3·v4·v5·v6·v7·v8과 동일 (**v3~v9 7연속 유지**)
- 결과 파일: `BAL_SIM_baseline_v9_result.json`
- buildTag: `sim-baseline-v9-pr13`
- bootstrapErrors 합: **0/700** (전 회차 시스템 init 정상, `runs[*].bootstrapErrors` 합산 0)

### 1.2 PR13 적용 차이 (v8 대비)

PR13 머지 결과 (시스템 백승호 1차 단정 인용):
- 4 파일 +52/-2 라인 — 신규 아이템 4곳 등록 룰(items / stackConfig / districts / CardFactory) 충족
- `validate.js` Errors 0 / Warnings 252 / ALL CLEAR
- `sketch_notebook` dismantle 결과: `paper` 아이템 미정의로 보수적 `[]` 처리 — PR13 머지 시 차후 paper 정의 또는 cloth 폴백 결정 위임

**characters.js 신규 abilities 사양 (SCN_QUEST 두 파일 §8 인용):**

```js
// homeless street_solace
effect: { moraleRecoveryBonus: 1.5, lowMoraleRecoveryFatigueBonus: -5, startingItems: ['worn_photo'] }

// engineer workshop_focus
effect: { moraleOnCraft: 5, moraleOnDismantle: 5, sketchNotebookBonus: true, startingItems: ['sketch_notebook'] }
```

**신규 자원:**
- `worn_photo` — 1회 소비형. onConsume.morale 추정 +12 (homeless 시작 인벤토리 1개)
- `sketch_notebook` — 1회 소비형. 소비 시 morale·fatigue 가산 (engineer 시작 인벤토리 1개)
- `newspaper_bundle` — 기존 아이템에 onConsume.morale 부여 + 25구 lootTable 등장

BALANCE 객체 미관여 — fingerprint 영향 0 정합. PR13 효과는 (a) characters.js abilities effect, (b) items onConsume 가산, (c) lootTable 분배 3 경로.

### 1.3 fingerprint 단정 — v3~v9 7연속 유지 + drift 측정 한계 재인용

`drift.balanceLeafTotal = 227`, fingerprint `len316-h242a5b5f` — **v3·v4·v5·v6·v7·v8·v9 모두 동일** (7연속 유지).

PR13은 characters.js·items.js·stackConfig.js·districts.js 4 파일 +52/-2 변경이나 fingerprint 무영향. `tools/sim/v2/drift.mjs`가 BALANCE 객체 leaf 트리 구조만 추적 + characters/items/stackConfig/districts 데이터 파일은 fingerprint 추적 범위 외임을 단정.

**drift 측정 한계 (협의서 v4 §13.6 인용):** leaf 값 회귀 검증 + 데이터 파일 회귀 검증을 fingerprint 단독으로 보장 못함. 본 보고에서는 PR13 변경 4 파일을 §1.2에 명시 인용으로 보강. M4+ 도구 트랙에서 leaf 값 hash + 데이터 파일 hash 컬럼 추가 권고.

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3~v8과 동일 시드·동일 runner 흐름. 차이는 PR13의 characters/items/stackConfig/districts 4 파일 데이터 변경
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4·v5·v6·v7·v8·v9 모두 `len316-h242a5b5f`
- bootstrapErrors 0/700 — 전 회차 시스템 init 정상 (`runs[*].bootstrapErrors` 합산 0)
- 결정성 100% (협의서 v3 §12.5 기준: 두 번째 재실행 K3/K5/fingerprint 동일 단언 적용)
- 사망 원인 집계: `BAL_SIM_baseline_v9_result.json:runs[*]` 700건 `deathCause` 빈도 — Node 직접 집계 결과 `절망 377 / 아사 288 / 극도 피로 22 / 탈수 13` 단정

---

## 3. K1 — 100일 생존율 (목표 ≥ 5%)

| 직업 | 생존율 v9 | ±CI95p | survived/runs | v8 비교 | v7 비교 |
|------|-----------|--------|---------------|---------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p). `kpi.survivalRate.crossCharacterGapPct = 0`.

**판단: K1 목표(≥ 5%) 미달. baseline 10회 연속 0%** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10 → PR11 → PR12+T1 → PR13). ±3%p 신뢰구간 안에서 100% 0%.

PR13 효과는 **K3 engineer +0.5d 단독 향상에 머무름** (§4.2). day 100 도달 0건 유지. SCN_QUEST 두 파일 추정 K3 향상 (homeless +1.0~1.5d / engineer +0.9~1.4d) 대비 실측 (homeless 0d / engineer +0.5d) **격차 단정** (§4.3, §6.2). 격차 원인은 R13-1 신규 위험으로 등록 단언.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v9) | median (v9) | mean (v8) | mean (v7) | mean (v6) | Δv8→v9 |
|------|-----------|-------------|-----------|-----------|-----------|--------|
| doctor | 4.90 | 5 | 4.90 | 4.00 | 4.00 | 0 |
| soldier | 4.50 | 4 | 4.50 | 3.00 | 3.00 | 0 |
| firefighter | 5.00 | 5 | 5.00 | 3.00 | 3.00 | 0 |
| homeless | 4.20 | 4 | 4.20 | 4.10 | 4.10 | **0** ★ |
| chef | 5.20 | 5 | 5.20 | 5.20 | 5.20 | 0 |
| **engineer** | **4.90** | 5 | 4.40 | 3.10 | 3.10 | **+0.50** ★ |
| pharmacist | 4.10 | 4 | 4.10 | 4.10 | 4.10 | 0 |

### 4.1 chef K3 격차 측정 (정의 1·2) — R11-1 임계 경계 단정

**정의 1: chef vs 다른 6직업 평균 (v4~v8 사용 정의)**
- v8: chef 5.20 / others6 ((4.90+4.50+5.00+4.20+4.40+4.10)/6 = 4.52) / gap **+0.68d**
- v9: chef 5.20 / others6 ((4.90+4.50+5.00+4.20+**4.90**+4.10)/6 = **4.60**) / gap **+0.60d** (Δv8→v9: -0.08d)

**정의 2: chef vs cooking lv 0 5직업 평균 (pharmacist 제외, 동질 비교)**
- v8: chef 5.20 / others5 ((4.90+4.50+5.00+4.20+4.40)/5 = 4.60) / gap **+0.60d**
- v9: chef 5.20 / others5 ((4.90+4.50+5.00+4.20+**4.90**)/5 = **4.70**) / gap **+0.50d** (Δv8→v9: -0.10d)

**판단:**
- 협의서 v2(PR9) §6.2 cook_intuition grace 재검토 트리거 +2.5d — **두 정의 모두 미충족** (정의 1 +0.60d / 정의 2 +0.50d)
- 협의서 v3(PR10) §9.5 KPI 목표 +1.0~+2.0d 사수 — **두 정의 모두 하한 미달** (정의 1 +0.60d / 정의 2 +0.50d)
- **R11-1 액션 트리거 미발동 단정:** 협의서 v4 §13.2 트리거 정의 = "chef K3 < 5.0 또는 격차 +0.5d 미만 추가 좁힘". chef K3 5.20 ≥ 5.0 충족 + 정의 2 격차 +0.50d = 트리거 임계 경계(0.50d ≥ 0.50d). **임계 경계 도달이나 액션 트리거 미충족** — R11-1 모니터링 모드 유지
- 격차 추가 좁힘은 engineer K3 +0.5d 단독 향상 결과 (homeless K3 0d). homeless ability 미발동(§4.3 + R13-1)이 격차 +0.5d 미만 도달을 차단한 결과

### 4.2 engineer K3 +0.5d 단독 향상 단정

engineer K3 v8 4.40 → v9 4.90 (+0.50d). 향상 경로 단정:

| 후보 경로 | 적용 여부 | 추정 기여 |
|-----------|----------|----------|
| `workshop_focus.moraleOnCraft: +5` (ability effect) | ❌ 미적용 (R13-1) | 0d |
| `workshop_focus.moraleOnDismantle: +5` (ability effect) | ❌ 미적용 (R13-1) | 0d |
| `workshop_focus.sketchNotebookBonus: true` (ability effect) | ❌ 미적용 (R13-1) | 0d |
| `sketch_notebook` startInv 1개 소비 (onConsume.morale 기본 적용) | ✅ 적용 | +0.3~0.5d 추정 |
| `newspaper_bundle` 25구 lootTable + onConsume.morale 부여 | ✅ 적용 (engineer mapo startDistrict 등장 가능) | +0.0~0.2d 추정 |
| `worn_photo` startInv (homeless 전용) | engineer 미적용 | 0d |

**단정:** engineer +0.5d는 `sketch_notebook` 1개 startInv 소비(`applyOnConsume` 기본 분기 = `onConsume.morale` 기본값 적용) + `newspaper_bundle` 25구 lootTable 등장 가능성 합산. **ability effect 무작용 단정** — R13-1 일차 원인.

### 4.3 homeless K3 Δ 0 — 추정-실측 격차 단정 (R13-1 신규)

`SCN_QUEST_homeless_tier2.md` 추정 K3 향상 +1.0~1.5d (homeless v8 4.2 → v9 5.2~5.7). **실측 v9 4.20** (Δv8→v9 0).

| 후보 경로 | 적용 여부 | 단정 |
|-----------|----------|------|
| `street_solace.moraleRecoveryBonus: 1.5` (소비 시 1.5배 가산) | ❌ 미적용 (R13-1) | sim AI ability 가산 분기 미구현 |
| `street_solace.lowMoraleRecoveryFatigueBonus: -5` (저사기 회복 보너스) | ❌ 미적용 (R13-1) | 동일 |
| `worn_photo` startInv 1개 소비 (onConsume.morale 기본 +12) | ✅ 적용 | day 3 seed 0·1 morale 56.8 회복 관측 |
| `newspaper_bundle` 25구 lootTable + onConsume.morale 부여 | ✅ 적용 (homeless yangchun startDistrict 등장 가능) | 소비 시점 모호 |

**격차 원인 단정 (시스템 백승호 1차 단정 + SCN_QUEST §11 위험 노트 인용):**

(a) **Tier-2 ability `moraleRecoveryBonus` sim AI 미구현** — `tools/sim/v2/playerAI.mjs` `applyOnConsume` 분기에 `GameState.player.abilities` 중 `moraleRecoveryBonus` effect를 가산하는 분기 부재. 기본 `onConsume.morale`만 적용. homeless 입장에서 `worn_photo` morale +12를 +18로 가산하지 못함. SCN_QUEST §11 위험 노트 사전 등록 정합

(b) **`worn_photo`·`sketch_notebook` 1회 소비형 + startInv 1개 보유** — day 3 이후 소진. seed 0·1 homeless day 3 morale 56.8 회복 관측은 worn_photo 1회 소비로 일시 회복 후 day 4~5 morale<30 재진입 사망. R8-1 회복 자원 분배 의도이나 1회 소비분만으로는 100일 도달 미보장

**R13-1 신규 위험 등록 단언:**
- ID: R13-1
- 정의: Tier-2 ability 효과의 sim AI 미구현으로 SCN_QUEST 결정-실측 정합 깨짐. 향후 모든 ability bonus 사양 PR가 동일 패턴 발생 위험
- 트리거: SCN_QUEST 추정 K3 향상 ≥ +0.5d 대비 실측 ≤ +0.2d 격차
- 해소 경로: `tools/sim/v2/playerAI.mjs` `applyOnConsume`·`actInteractCraft`·`actBoostMorale` 등에서 `GameState.player.abilities` effect 가산 분기 구현 (PR15 후보, §9.1)

---

## 5. K5 — 사망 원인 분포

### 5.1 합산 v8→v9 — 절망 -28 부분 완화

| 원인 | v3 | v4 | v5 | v6 | v7 | v8 | **v9** | Δv8→v9 |
|------|----|----|----|----|----|----|--------|--------|
| 아사 | 569 | 569 | 532 | 510 | 506 | 263 | **288** | **+25** |
| 절망 | 110 | 113 | 142 | 167 | 173 | 405 | **377** | **-28** |
| 탈수 | 20 | 12 | 14 | 14 | 12 | 13 | **13** | 0 |
| 극도 피로 | 1 | 6 | 12 | 9 | 9 | 19 | **22** | +3 |

**부분 완화 단정:**
- v7 → v8 절망 +232 폭증 → v8 → v9 절망 -28 부분 회수 (R10-1 폭증분의 12.1% 회수)
- 아사 +25는 homeless·engineer K5 사망원인 전환 결과 (절망 → 아사). homeless 절망 v8 46 → v9 24 (-22), 아사 v8 54 → v9 76 (+22)
- 사망원인 1위 절망 유지 (v8 405 / v9 377), v7까지 절망 < 아사 패턴은 미회복

### 5.2 직업별 K5 (v8 vs v9)

| 직업 | v9 K5 | v8 K5 | 변화 |
|------|-------|-------|------|
| doctor | 절망 98 / 극도 피로 1 / 아사 1 | 절망 98 / 극도 피로 1 / 아사 1 | 0 |
| soldier | 절망 50 / 아사 48 / 극도 피로 2 | 절망 50 / 아사 48 / 극도 피로 2 | 0 |
| firefighter | 아사 86 / 절망 11 / 극도 피로 3 | 아사 86 / 절망 11 / 극도 피로 3 | 0 |
| **homeless** | **절망 24 / 아사 76** | 절망 46 / 아사 54 | **절망 -22 / 아사 +22** ★ |
| chef | 탈수 11 / 절망 83 / 극도 피로 6 | 탈수 11 / 절망 83 / 극도 피로 6 | 0 |
| **engineer** | **절망 71 / 아사 26 / 극도 피로 3** | 절망 77 / 아사 23 | **절망 -6 / 아사 +3 / 극도 피로 +3** |
| pharmacist | 절망 40 / 아사 51 / 극도 피로 7 / 탈수 2 | 절망 40 / 아사 51 / 극도 피로 7 / 탈수 2 | 0 |

**중요 분석:**
- **homeless 절망 -22건** — R8-1 회복 자원 분배 단독 효과. `worn_photo` 1회 소비 + `newspaper_bundle` 25구 lootTable 등장으로 day 3 morale 일시 회복. 단 day 4 평균 사망으로 K3 향상 0 = morale 회복은 day 3 한정, day 4에 아사 사망으로 사망원인 전환
- **engineer 절망 -6건** — 미세 완화. `sketch_notebook` 1회 소비 + craft·dismantle 행위 빈도 ↑ → 부분 morale 침식 지연. K3 +0.5d 향상이 morale 침식 시간 +0.5×72=36 TP 누적이나 절망 -6 단독 부족 = ability effect 미적용(R13-1) 일차 단정
- doctor·soldier·firefighter·chef·pharmacist K5 변화 0 — PR13 효과 5직업 미관여 (Tier-2 abilities 미보유 + worn_photo·sketch_notebook startInv 미보유)

### 5.3 R8-1 부분 완화 단정 (homeless 절망 -22 단독)

R8-1 (morale 회복 자원 부재) 정의: homeless·engineer 직업 morale 회복 자원 분배 결여로 day 2~3 morale 12~13 급락 → death spiral.

v9 측정 단정:
- homeless 절망 v8 46 → v9 24 (**-22건, -47.8%**) ★ — `worn_photo` startInv 1개 + `newspaper_bundle` 25구 lootTable 직접 효과
- engineer 절망 v8 77 → v9 71 (-6건, -7.8%) — `sketch_notebook` startInv 1개 효과 미약 (R13-1 ability 미발동 결합)
- 합산 절망 v8 405 → v9 377 (**-28건, -6.9%**)

**부분 완화 단정:**
- R8-1 회복 자원 분배 자체는 효과 단정 (homeless 절망 -22 단독)
- 단 SCN_QUEST 추정 K3 향상 (homeless +1.0~1.5d) 대비 실측 0d는 R13-1 ability 미구현 일차 원인
- M3 #10 시나리오 한도연 트랙 진입 결과(homeless·engineer 2직업) 단독으로 K1 ≥ 5% 도달 미충족. 협의서 v4 §13.7 다음 단계 4번 항(나머지 3직업 firefighter·soldier·pharmacist) 진입 의무 충족 시 K1 도달 재측정 필요

---

## 6. AI 발동 — Tier-2 ability + 신규 자원

### 6.1 worn_photo·sketch_notebook 발동 분포

**worn_photo (homeless startInv 1개):**
- seed 0·1 homeless day 3 morale 56.8 회복 관측 (probe 1 인용, §6.2)
- day 3 1회 소비 + day 4 morale<30 재진입 추정 → 일시 회복 후 소진
- 100 runs 중 99~100건 day 3 morale<30 도달 (probe 1 단정)

**sketch_notebook (engineer startInv 1개):**
- engineer K3 4.40 → 4.90 향상의 일차 경로 (§4.2)
- `applyOnConsume` 기본 morale 분기 적용 (ability effect 가산 분기 미구현)
- engineer day 4 사망 회차 대부분에서 day 2~3 1회 소비 추정

**newspaper_bundle (25구 lootTable 신규 등장 + onConsume.morale 부여):**
- 합산 절망 -28 효과 중 engineer·homeless 외 5직업 효과 0건 단정 (5직업 K5 변화 0)
- newspaper_bundle 발견 빈도는 result.json `eventsCount` 차이로 정량화 곤란. v9 probe 추가 측정 위임

### 6.2 R13-1 신규 위험 — Tier-2 ability 가산 분기 sim AI 미구현

**Probe 1 — morale<30 도달율 (homeless·engineer):**
- homeless: v8 99/100 → v9 **98/100** (-1, 1건 회피)
- engineer: v8 100/100 → v9 **100/100** (0, 변화 없음)
- seed 0·1 homeless day 3 56.8 회복 관측 = worn_photo 1회 소비 효과. day 4 재진입 패턴

**Probe 2 — 절망 사망 직업별 변화:**
| 직업 | v8 절망 | v9 절망 | Δ |
|------|---------|---------|---|
| homeless | 46 | 24 | **-22** ★ |
| engineer | 77 | 71 | -6 |
| doctor·soldier·firefighter·chef·pharmacist | (5직업 합산) | (동일) | 0 |

**R13-1 단정 근거:**
- SCN_QUEST_homeless_tier2.md §3.3: "`moraleRecoveryBonus: 1.5` — `onConsume.morale` 적용 시 1.5배 적용 (시스템 백승호 위임: `applyOnConsume()` 또는 등가에서 ability 가산 분기 추가)"
- SCN_QUEST_homeless_tier2.md §11 사전 위험 노트: "트리거: `tools/sim/v2/playerAI.mjs` 또는 등가에서 `moraleRecoveryBonus` ability 가산 분기 미구현 → Tier-2 ability effect 무작용"
- 시스템 백승호 1차 단정 인용: "PR13 적용 4 파일 +52/-2은 데이터 등록만 포함. `playerAI.mjs:applyOnConsume` 등 sim AI 분기는 미수정"
- 실측 추정 격차:
  - homeless 추정 +1.0~1.5d → 실측 0d (Δ -1.0~-1.5d 격차)
  - engineer 추정 +0.9~1.4d → 실측 +0.5d (Δ -0.4~-0.9d 격차)

**R13-1 등록 단언:**
- ⚠️ 신규 위험. SCN_QUEST 추정-실측 격차 일차 원인
- 향후 ability effect 사양 PR(M3 #10 나머지 3직업) 진입 시 동일 패턴 재발 위험
- 해소 경로: PR15 `tools/sim/v2/playerAI.mjs` ability 가산 분기 구현 (시스템 백승호 위임)

### 6.3 actT1Convert·actFish 회귀 단정

PR13은 BALANCE 미관여 + playerAI.mjs 미수정. v8 도입된 T1 모사·v8 fishing 0.50 모두 영향 0:

- actT1Convert: cooking lv 0 4직업 (doctor·soldier·firefighter·engineer) K3 v8 대비 변화 0 (engineer 제외) — T1 모사 효과 회귀 0 단정. engineer +0.5d는 sketch_notebook 1회 소비 효과로 분리
- actFish: 4 hasFishing 직업(doctor·firefighter·engineer·pharmacist) K3 v8 대비 변화 0 (engineer 제외) — fishing 효과 회귀 0 단정
- chef·pharmacist·homeless K3 변화 0 (homeless 4.20 동일, engineer 외) — T1 진입 차단(cookingLv ≥1) 유지

---

## 7. KPI 표 비교 — v3~v9 7컬럼

협의서 v3(PR10) §9.5 + 협의서 v4(PR11) §13.7 통합 KPI:

| KPI | v3 | v4 | v5 | v6 | v7 | v8 | **v9** | 목표 | 충족 |
|-----|----|----|----|----|----|----|--------|------|------|
| K1 (전 직업) | 0% | 0% | 0% | 0% | 0% | 0% | **0%** | ≥ 5% | ❌ **10회 연속** |
| K3 doctor | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 | 4.9 | **4.9** | +1d (5.0) | ⚠️ 거의 충족 (-0.1d) |
| K3 soldier | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 4.5 | **4.5** | +1d (4.0) | ✅ 초과 달성 |
| K3 firefighter | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 5.0 | **5.0** | +1d (4.0) | ✅ 초과 달성 |
| K3 homeless | 3.0 | 3.0 | 3.2 | 4.1 | 4.1 | 4.2 | **4.2** | 5.0~6.5 | ❌ 미달 (Δ 0, R13-1) |
| K3 chef | 4.5 | 5.2 | 5.2 | 5.2 | 5.2 | 5.2 | **5.2** | 5.5~7.0 | ❌ 미달 (변화 0) |
| **K3 engineer** | 3.0 | 3.0 | 3.0 | 3.1 | 3.1 | 4.4 | **4.9** | +1d (4.0) | ✅ **초과 달성 (+0.5d)** ★ |
| K3 pharmacist | 3.0 | 4.0 | 4.1 | 4.1 | 4.1 | 4.1 | **4.1** | 5.0~6.5 | ❌ 미달 (변화 0) |
| **K5 절망** | 110 | 113 | 142 | 167 | 173 | 405 | **377** | ↓ | ⚠️ **부분 완화 -28** |
| K5 아사 | 569 | 569 | 532 | 510 | 506 | 263 | **288** | ↓ | +25 (homeless 사망원인 전환) |
| K5 탈수 | 20 | 12 | 14 | 14 | 12 | 13 | **13** | ↓ | ✅ 안정 |
| K5 극도 피로 | 1 | 6 | 12 | 9 | 9 | 19 | **22** | ≤ 10 | ⚠️ 초과 (+3) |
| chef 격차 정의 1 | +1.33 | +1.87 | +1.80 | +1.65 | +1.65 | +0.68 | **+0.60** | +1.0~+2.0d | ⚠️ 하한 미달 유지 |
| chef 격차 정의 2 | +1.30 | +2.00 | +1.94 | +1.76 | +1.76 | +0.60 | **+0.50** | +1.0~+2.0d | ⚠️ **임계 경계 (R11-1 미발동)** |
| chef grace 트리거(+2.5d) | - | +2.00 | +1.94 | +1.76 | +1.76 | +0.60 | **+0.50** | < +2.5d | ✅ 보류 유지 |
| 직업 격차 K1 max-min | 0%p | 0%p | 0%p | 0%p | 0%p | 0%p | **0%p** | ≤ 5%p | ✅ |
| R8-1 morale 시계열 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | **부분 측정 (probe 1)** | day 1~3 확보 | ⚠️ probe 단정 |
| **R13-1 ability sim AI 미구현** | - | - | - | - | - | - | **⚠️ 신규** | ability 가산 분기 구현 | ❌ 미해소 |

**충족 6건. 미달 8건. 부분 달성 3건 (K3 doctor 거의, K5 절망 부분 완화, R8-1 probe 부분 측정). R13-1 신규 미해소.**

---

## 8. R7·R8·R9·R10·R11·R13 상태표 갱신

| ID | v8 (PR12+T1 후) | **v9 (PR13 후)** |
|----|-----------------|-------------------|
| R7-1 요리·낚시 AI 부재 | ✅ 발동 + T1 모사 추가 | ✅ 유지 (PR13 미관여) |
| R7-1.5 actCook 산출물 nutrition 효과 | ✅ T1 모사로 lv 0 4직업 해소 | ✅ 유지 |
| R7-2 morale 관리 AI 부재 | ✅ chef·pharmacist·doctor 99~100% 발동 | ✅ 유지 |
| R7-3 lootTable food density | ✅ PR8 6구 + PR11 25구 raw food 가중치 보강 | ✅ 유지 + newspaper_bundle 추가 |
| R8 cook_intuition grace 효과 | ✅ 격차 +0.60d, 트리거 +2.5d 미충족 | ✅ 격차 +0.50d, 트리거 미충족 유지 |
| **R8-1 morale 회복 자원 부재** | ⚠️ **악화** (절망 +232, 사망원인 1위 역전) | ⚠️ **부분 완화 -28 (homeless 절망 단독 -22)** ★ |
| R9-1 4 hasFishing K1 효과 부족 | ⚠️ PR12 단독 효과 0 (T1 합산 분리 불가) | ⚠️ **변화 0** (PR13 fishing 미관여) |
| R9-2 chef PR9 효과 0 | ✅ chef T1 차단 + PR12 junggoo 비-hasFishing 격차 보호 | ✅ 유지 |
| **R10-1 절망 사망 가속** | ❌ +232 (1위 역전) | ⚠️ **-28 부분 완화** (M3 #10 나머지 3직업 진입 필요) |
| **R11-1 chef 격차 하한 깨짐** | ⚠️ 신규 등록 (정의 2 +0.60d) | ⚠️ **미발동** (정의 2 +0.50d 임계 경계, 액션 트리거 미충족) |
| **R13-1 (신규) Tier-2 ability sim AI 미구현** | - | ⚠️ **신규 등록** — `moraleRecoveryBonus`·`moraleOnCraft`·`moraleOnDismantle`·`sketchNotebookBonus` 무작용. SCN_QUEST 추정-실측 격차 일차 원인 |

---

## 9. 다음 단계 / 트리거 후보

### 9.1 R13-1 해소 — sim AI ability 가산 분기 구현 (PR15 후보)

**작업 사양:**
- 위치: `tools/sim/v2/playerAI.mjs`
- 함수: `applyOnConsume`·`actInteractCraft`·`actBoostMorale`·`actDismantle` 등에서 `GameState.player.abilities` effect 가산 분기 추가
- 영향 abilities:
  - `moraleRecoveryBonus: 1.5` (homeless street_solace) — onConsume.morale 1.5배 가산
  - `moraleOnCraft: 5` (engineer workshop_focus) — craft 1회당 morale +5 가산
  - `moraleOnDismantle: 5` (engineer workshop_focus) — dismantle 1회당 morale +5 가산
  - `sketchNotebookBonus: true` (engineer workshop_focus) — sketch_notebook 소비 시 추가 morale·fatigue 가산
- 추가 영향(향후): `lowMoraleRecoveryFatigueBonus: -5` (homeless 저사기 회복 fatigue 보너스)
- 담당: 시스템 백승호 (시뮬 로직 PR)
- 트리거: 본 보고서 단언 직후. PR15 진입 의무

**추정 K1·K3 효과 (PR15 머지 시):**
- homeless K3 4.2 → 5.2~5.7 (+1.0~1.5d, SCN_QUEST 추정치 회복)
- engineer K3 4.9 → 5.3~5.8 (+0.4~0.9d, ability effect 추가 발동)
- K1 도달 가능성: 5%~12% 추정 (homeless·engineer 단독, 정확도 ±3%p)

### 9.2 M3 #10 나머지 3직업 Tier-2 진입 시점 단언

**대상:** firefighter·soldier·pharmacist Tier-2 abilities (시나리오 한도연 위임)

**진입 시점 단정:**
- **PR15 머지 + baseline v10 측정 후 진입 권고** — R13-1 미해소 상태에서 진입 시 firefighter·soldier·pharmacist도 SCN_QUEST 추정-실측 격차 재발 위험. homeless·engineer 격차 패턴이 3직업 더 누적되어 보고서 해석 곤란
- 사유: ability effect sim AI 발동 검증 후 5직업 동시 진입이 추정-실측 정합 보장
- 협의서 v4 §13.7 다음 단계 4번 항 갱신 — "baseline v9 측정 D+0" → **"baseline v10 측정 D+0 (PR15 머지 후)"**

### 9.3 R11-1 모니터링 유지 + chef 정체성 강화 트랙 보류

- 현재 chef 격차 정의 2 v9 +0.50d = 트리거 임계 경계(+0.5d 미만 추가 좁힘 시 발동)
- **R11-1 액션 트리거 미발동 단정** — chef K3 5.20 ≥ 5.0 + 격차 정의 2 +0.50d ≥ +0.50d
- 향후 PR15 머지 후 baseline v10에서 homeless·engineer K3 추가 향상으로 chef 격차 정의 2 +0.5d 미만 추가 좁힘 시 **R11-1 액션 트리거 발동** → chef 정체성 강화 트랙 진입 의무
- 본 v9 측정 시점에서는 chef 정체성 강화 트랙 보류 단정

### 9.4 sketch_notebook dismantle paper 정의 (시스템 백승호 위임)

- PR13 머지 시 `sketch_notebook` dismantle 결과 보수적 `[]` 처리 (paper 아이템 미정의)
- 후속 PR 결정 후보:
  - 후보 A: `paper` 신규 아이템 정의 + sketch_notebook dismantle paper 1~2개 산출
  - 후보 B: 기존 `cloth` 폴백 (sketch_notebook → cloth 1개)
- 시스템 백승호 영역. 본 보고서는 단정 위임만 명시

---

## 10. 결정 단언 종합

| 항목 | v9 측정 단언 |
|------|------------|
| K1 ≥ 5% | ❌ 미달 (**10회 연속 0%**, M3 #10 나머지 3직업 진입 + R13-1 해소 의무) |
| K3 engineer +0.5d 단독 향상 | ✅ 단정 (sketch_notebook 1회 소비 + newspaper_bundle 25구 등장) |
| K3 homeless Δ 0 — 추정-실측 격차 | ❌ 단정 (SCN_QUEST 추정 +1.0~1.5d 대비 실측 0d) |
| **R13-1 신규 위험 등록** | **⚠️ 단언** (Tier-2 ability sim AI 미구현 — moraleRecoveryBonus·moraleOnCraft·moraleOnDismantle·sketchNotebookBonus 무작용) |
| R8-1 부분 완화 | ⚠️ 단정 (절망 v8 405 → v9 377, **-28건**. homeless 절망 단독 **-22건**) |
| R10-1 부분 회수 | ⚠️ 단정 (v7 173 → v8 405 폭증 → v9 377, 12.1% 회수) |
| R11-1 액션 트리거 미발동 | ⚠️ 단정 (정의 2 +0.50d 임계 경계, chef K3 5.20 ≥ 5.0, 모니터링 유지) |
| K3 chef 격차 +1.0d 하한 사수 | ❌ 두 정의 모두 미달 (정의 1 +0.60d / 정의 2 +0.50d) |
| 시뮬 결정성 | ✅ fingerprint `len316-h242a5b5f` **v3~v9 7연속 유지**, bootstrapErrors 0/700 |
| drift fingerprint leaf 값 추적 한계 | ⚠️ 협의서 v4 §13.6 재인용. PR13 4 파일 변경 무영향 |

### 10.1 다음 단계 권고 요약

1. **R13-1 해소 — PR15 sim AI ability 가산 분기 구현 의무.** 시스템 백승호 위임. `tools/sim/v2/playerAI.mjs` `applyOnConsume`·`actInteractCraft`·`actBoostMorale`·`actDismantle` 등 분기 추가. 시뮬 로직 PR
2. **M3 #10 나머지 3직업 Tier-2 진입 — PR15 머지 + baseline v10 측정 후 진입 권고.** R13-1 미해소 상태 진입 시 추정-실측 격차 재발 위험
3. **R11-1 모니터링 유지** — 임계 경계 도달이나 미발동. PR15·M3 #10 나머지 3직업 진입 후 chef 격차 +0.5d 미만 추가 좁힘 시 chef 정체성 강화 트랙 진입 의무
4. **sketch_notebook dismantle paper 정의** — 시스템 백승호 후속 PR 결정 (paper 신규 또는 cloth 폴백)

### 10.2 baseline v9 → v10 트리거 조건

- PR15 머지 (R13-1 해소) 후 baseline 재측정
- v10 측정 의무 probe:
  - homeless·engineer morale 시계열 day 1~5 (R8-1 추가 단정 입력)
  - `worn_photo`·`sketch_notebook` 소비 회수 7직업별
  - `moraleRecoveryBonus`·`moraleOnCraft`·`moraleOnDismantle`·`sketchNotebookBonus` ability 가산 분기 발동 회수
  - chef 격차 정의 2 측정 (R11-1 액션 트리거 발동 검증)
- K1 ≥ 5% 도달 시 협의서 v5 발행 — chef·pharmacist 격차 보호 KPI 재검토

---

*문서 끝. PR15 (R13-1 해소) 머지 후 baseline v10 측정 트리거 충족 시 본 §9.1 단언 + §10.2 probe 측정 의무.*
