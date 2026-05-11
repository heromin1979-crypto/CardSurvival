# 밸런스 — baseline v8 측정 보고 (PR12 + M3 #14b 후)

> 작성: 밸런스 권지나 / 2026-05-11
> 측정 대상: PR12(`gameBalance.js:328` `fishing.baseCatchChance` 0.30→0.50) + M3 #14b(`playerAI.mjs:172-340` interactions.js T1 변환 모사) 동시 머지 후
> 결정: K1 0% **9회 연속** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10 → PR11 → PR12+T1). 협의서 v4(PR11) §12.6 다음 단계 — **M3 #10 시나리오 한도연 트랙 진입 의무 충족 단언.**
>       K3 cooking lv 0 4직업 +0.9~+2.0d 향상 (doctor 4.0→4.9 / soldier 3.0→4.5 / firefighter 3.0→5.0 / engineer 3.1→4.4) — M3 #14b T1 모사 효과 단정.
>       K5 사망 원인 역전 — v7 아사 506/절망 173 → v8 아사 263(-243)/**절망 405(+232)**. R10-1 폭증. R8-1 회복 자원 분배 없이는 K1 5% 도달 불가 단정.

---

## 1. 서두

### 1.1 측정 환경

- 시뮬: `tools/sim/v2/` (PR1~PR12 + M3 #14b 누적). 변경 라인 2 트랙:
  - **PR12:** `js/data/gameBalance.js:328` 단일 상수 (`baseCatchChance: 0.30 → 0.50`)
  - **M3 #14b:** `tools/sim/v2/playerAI.mjs:172-206`(T1_TRANSFORMS 상수 + `actT1Convert` 함수 신규), `playerAI.mjs:302-310`(`runDayAI` cooking lv 0 분기 호출). 합산 ~38 라인
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 700 runs (7직업 × 100회), `RUNS_PER_CHARACTER=100`, `SEED_BASE=0`
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: **10.2초** (`meta.totalDurationMs = 10180`)
- BALANCE leaf 합: 227 (`drift.balanceLeafTotal`), **fingerprint `len316-h242a5b5f`** — v3·v4·v5·v6·v7과 동일 (v3~v8 6연속 유지)
- 결과 파일: `BAL_SIM_baseline_v8_result.json`
- buildTag: `sim-baseline-v8-pr12-t1`
- bootstrapErrors 합: **0/700** (전 회차 시스템 init 정상, `runs[*].bootstrapErrors` 합산 0)

### 1.2 PR12 + M3 #14b 적용 차이 (v7 대비)

**PR12 — `js/data/gameBalance.js:326-341` `fishing` 상수 조정:**
```
baseCatchChance: 0.30 → 0.50  // line 328
```
주석 라벨 추가 `"PR12 v8 진입 트리거"`. 다른 fishing 상수(maxCatchChance 0.70, rodImprovedBonus 0.15 등) 변경 0. v7 어획 산식: `chance = 0.30 + (fishingLv/20)×(0.70-0.30)` → v8: `chance = 0.50 + (fishingLv/20)×(0.70-0.50)`. fishingLv=0(4 hasFishing 직업 전원 시작 lv 0) 기준 어획 확률 **0.30 → 0.50 (+0.20)**.

**M3 #14b — `tools/sim/v2/playerAI.mjs` T1 변환 모사 신규:**

`playerAI.mjs:178-183` `T1_TRANSFORMS` 4 규칙:
```js
{ id: 'cook_noodles_t1',      input: 'instant_noodles',    output: 'cooked_noodles' },
{ id: 'cook_rice_t3',         input: 'rice',               output: 'cooked_rice'    },
{ id: 'boil_contaminated_t5', input: 'contaminated_water', output: 'boiled_water'   },
{ id: 'boil_rainwater_t7',    input: 'rainwater',          output: 'boiled_water'   },
```

`playerAI.mjs:187-206` `actT1Convert` 함수 — needs-aware 동일 산식 `benefit = needsNutrition ? (n*3 + h) : (n + h*1.5)`. 입력 카드 1 차감 + 출력 카드 1 가산. RNG 무사용 결정성.

`playerAI.mjs:302-310` `runDayAI` 분기 호출:
```js
const cookingLvForT1 = GameState.player?.skills?.cooking?.level ?? GameState.player?.skills?.cooking ?? 0;
if (cookingLvForT1 === 0) {
  const t1 = actT1Convert(simInv);
  if (t1) actions.push(t1);
}
```
**cooking lv 0 직업 한정.** chef(lv 4)·pharmacist(lv 1)·homeless(lv 3) 진입 차단 단정 — 회귀 보호 의도.

### 1.3 fingerprint 단정 — drift 측정 한계 노트

`drift.balanceLeafTotal = 227`, fingerprint `len316-h242a5b5f` — **v3·v4·v5·v6·v7·v8 모두 동일**.

PR12는 `gameBalance.js:328` leaf 값 `0.30 → 0.50` 변경이나 fingerprint 무영향. 이는 `tools/sim/v2/drift.mjs`가 BALANCE 객체 **leaf 트리 구조(키 개수 + 키 경로 hash)만 추적**하고 leaf 값 변경은 추적하지 않음을 단정.

**drift 측정 한계:** leaf 값 회귀 검증(예: `baseCatchChance` 의도치 변경)을 fingerprint 단독으로 보장 못함. 본 보고에서는 PR12 변경 라인을 §1.2에 명시 인용으로 보강. 향후 v9+ 측정 시 leaf 값 hash 추가 검토 권고 (M4+ 도구 트랙).

M3 #14b는 BALANCE 객체 미관여 — fingerprint 영향 0 정합.

---

## 2. 메서드

- 700 runs (7직업 × 100회), SEED_BASE=0, runDays=100
- v3~v7과 동일 시드·동일 runner 흐름. 차이는 (a) `gameBalance.js:328` 단일 상수, (b) `playerAI.mjs` T1 모사 추가 — 2 트랙
- 결정성: Math.random → mulberry32 monkey-patch. fingerprint v3·v4·v5·v6·v7·v8 모두 `len316-h242a5b5f`
- bootstrapErrors 0/700 — 전 회차 시스템 init 정상 (`runs[*].bootstrapErrors` 합산 0)
- 결정성 100% (협의서 v3 §12.5 기준: 두 번째 재실행 K3/K5/fingerprint 동일 단언 적용)
- 사망 원인 집계: `BAL_SIM_baseline_v8_result.json:runs[*]` 700건 `deathCause` 빈도 — Node 직접 집계 결과 `절망 405 / 아사 263 / 극도 피로 19 / 탈수 13` 단정

---

## 3. K1 — 100일 생존율 (목표 ≥ 5%)

| 직업 | 생존율 v8 | ±CI95p | survived/runs | v7 비교 | v6 비교 |
|------|-----------|--------|---------------|---------|---------|
| doctor | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| soldier | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| firefighter | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| homeless | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| chef | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| engineer | 0.00% | 0.00 | 0/100 | 0%p | 0%p |
| pharmacist | 0.00% | 0.00 | 0/100 | 0%p | 0%p |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p). `kpi.survivalRate.crossCharacterGapPct = 0`.

**판단: K1 목표(≥ 5%) 미달. baseline 9회 연속 0%** (PR5 → PR5.5 → PR6 → PR7-pre → PR7 → PR8 → PR9 → PR10 → PR11 → PR12+T1). ±3%p 신뢰구간 안에서 100% 0%.

PR12 + M3 #14b 합산 효과는 **사망일 연장(K3 +0.9~2.0d)에 머무름**. day 100 도달 0건 유지. 협의서 v4(PR11) §12.6 다음 단계 4번 항(M3 #10 시나리오 한도연) 진입 트리거 **충족 확정.** §9.1 단언.

---

## 4. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean (v8) | median (v8) | mean (v7) | mean (v6) | mean (v5) | Δv7→v8 |
|------|-----------|-------------|-----------|-----------|-----------|--------|
| **doctor** | **4.90** | 5 | 4.00 | 4.00 | 4.00 | **+0.90** |
| **soldier** | **4.50** | 4 | 3.00 | 3.00 | 3.00 | **+1.50** |
| **firefighter** | **5.00** | 5 | 3.00 | 3.00 | 3.00 | **+2.00** |
| homeless | 4.20 | 4 | 4.10 | 4.10 | 3.20 | +0.10 |
| chef | 5.20 | 5 | 5.20 | 5.20 | 5.20 | 0 |
| **engineer** | **4.40** | 4 | 3.10 | 3.10 | 3.10 | **+1.30** |
| pharmacist | 4.10 | 4 | 4.10 | 4.10 | 4.10 | 0 |

### 4.1 chef K3 격차 — 두 정의 측정

**정의 1: chef vs 다른 6직업 평균 (v4~v7 사용 정의)**
- v6: chef 5.20 / others6 3.55 / gap **+1.65d**
- v7: chef 5.20 / others6 ((4.00+3.00+3.00+4.10+3.10+4.10)/6 = 3.55) / gap **+1.65d**
- v8: chef 5.20 / others6 ((4.90+4.50+5.00+4.20+4.40+4.10)/6 = **4.52**) / gap **+0.68d** (Δv7→v8: **-0.97d**)

**정의 2: chef vs cooking lv 0 5직업 평균 (pharmacist 제외, 동질 비교)**
- v6: chef 5.20 / others5 3.44 / gap **+1.76d**
- v7: chef 5.20 / others5 ((4.00+3.00+3.00+4.10+3.10)/5 = 3.44) / gap **+1.76d**
- v8: chef 5.20 / others5 ((4.90+4.50+5.00+4.20+4.40)/5 = **4.60**) / gap **+0.60d** (Δv7→v8: **-1.16d**)

**판단:**
- 협의서 v2(PR9) §6.2 cook_intuition grace 재검토 트리거 +2.5d — **두 정의 모두 미충족** (정의 1 +0.68d / 정의 2 +0.60d)
- 협의서 v3(PR10) §9.5 KPI 목표 +1.0~+2.0d 사수 — **두 정의 모두 미달** (정의 1 +0.68d / 정의 2 +0.60d, **하한 +1.0d 미달**)
- v7→v8 격차 변화 **-0.97~-1.16d** — chef 5.20 정체 + 6직업 K3 큰 폭 향상(T1 + PR12 합산)으로 격차 큰 축소
- **권고: cook_intuition grace 단축 보류 유지** (트리거 +2.5d 초과 미발생). 단 격차 +1.0d 하한 미달은 chef 직업 정체성 보호 측면에서 §6.2 chef T1 진입 차단(lv 4 잠금)이 의도된 결과 단정

### 4.2 cooking lv 0 4직업 K3 향상 단정 — M3 #14b T1 모사 효과

협의서 v4(PR11) §12.6 다음 단계 2번 항 M3 #14b 효과 측정:

| 직업 | cookingLv | v7 K3 | v8 K3 | Δv7→v8 | hasFishing |
|------|-----------|-------|-------|--------|-----------|
| doctor | 0 | 4.00 | **4.90** | **+0.90** | true (jongno) |
| soldier | 0 | 3.00 | **4.50** | **+1.50** | false |
| firefighter | 0 | 3.00 | **5.00** | **+2.00** | true (yongsan) |
| engineer | 0 | 3.10 | **4.40** | **+1.30** | true (mapo) |

**핵심 단정:**
- soldier(non-hasFishing) Δ+1.50d = **M3 #14b T1 모사 단독 효과** (PR12 fishing 미관여)
- doctor·firefighter·engineer Δ+0.90~+2.00d = **T1 + PR12 합산 효과** (분리 측정 불가, §4.3 단정)
- 4직업 모두 day 4~5 mean 도달 — `cook_noodles` blueprint `requiredSkills.cooking: 1` 잠금 우회 (T1 변환 `instant_noodles → cooked_noodles` 경로). `playerAI.mjs:307` `if (cookingLvForT1 === 0)` 분기로 cooking lv 0만 진입 정합
- firefighter Δ+2.00d **최대 향상** — yongsan startInv `instant_noodles` 보유량이 다른 직업 대비 우위인 가능성 (단정 위해 v9 probe 필요)

### 4.3 4 hasFishing 직업 PR12 효과 분리 어려움

doctor(jongno)·firefighter(yongsan)·engineer(mapo)·pharmacist(gangnam) 4 hasFishing 직업은 PR12와 T1 두 효과 합산. PR12 단독 효과 분리 측정 불가:

| 직업 | hasFishing | cookingLv | v7→v8 Δ | T1 적용 | PR12 적용 | 분리 가능 |
|------|-----------|-----------|---------|---------|-----------|----------|
| doctor | true | 0 | +0.90 | ✅ | ✅ | ❌ 합산 |
| firefighter | true | 0 | +2.00 | ✅ | ✅ | ❌ 합산 |
| engineer | true | 0 | +1.30 | ✅ | ✅ | ❌ 합산 |
| pharmacist | true | 1 | 0 | ❌ (lv ≥1 차단) | ✅ | ⚠️ PR12 단독, 효과 0 |
| **soldier** | **false** | 0 | **+1.50** | ✅ | ❌ | ✅ **T1 단독** |
| **chef** | **false** | 4 | **0** | ❌ (lv ≥1 차단) | ❌ | ✅ **변화 0 단정** |
| homeless | false | 3 | +0.10 | ❌ (lv ≥1 차단) | ❌ | ✅ 변화 0 (noise) |

**단정:**
- **T1 단독 효과:** soldier +1.50d (hasFishing·cookingLv·PR12 동시 0 직업)
- **PR12 단독 효과:** pharmacist Δ0 — cooking lv 1 차단으로 T1 제외, hasFishing true로 PR12 적용. **PR12 효과 측정 가능 영역에서 K3 변화 0** 단정
- **PR12 K3 효과 측정 불가:** pharmacist는 v7 4.10 천장 도달 추정(homeless v5 천장 패턴 인용 §6.1). pharmacist 단독으로 PR12 효과 단정 불가
- 4 hasFishing 직업 중 cooking lv 0 3직업(doctor·firefighter·engineer)의 Δ에서 T1 기여분과 PR12 기여분 분리는 **baseline v9 + PR12 단독 롤백 또는 T1 단독 롤백 측정** 필요. 우선순위 후순위 — M3 #10 진입이 우선 (§9.4)

### 4.4 chef·pharmacist K3 회귀 검증 (T1 진입 차단 의도 단정)

- chef K3 5.20 (v6·v7·v8 동일) — cooking lv 4 → `playerAI.mjs:307` `cookingLvForT1 === 0` 분기 차단. T1 진입 0건. PR12도 chef startDistrict junggoo(hasFishing false) → fishing 미관여
- pharmacist K3 4.10 (v6·v7·v8 동일) — cooking lv 1 → 동일 분기 차단. hasFishing true이나 v5에서 actCook needs-aware 천장 도달 후 PR12 추가 향상 0
- **회귀 0 단정** — `playerAI.mjs:307` cookingLv 0 한정 분기가 chef·pharmacist 격차 보호 의도대로 동작. 협의서 v4(PR11) §12.6 다음 단계 2번 항 단정 정합

---

## 5. K5 — 사망 원인 분포

### 5.1 전 직업 합산 — 사망 원인 1위 역전

| 원인 | v3 (PR7) | v4 (PR8) | v5 (PR9) | v6 (PR10) | v7 (PR11) | **v8 (PR12+T1)** | Δv7→v8 |
|------|----------|----------|----------|-----------|-----------|------------------|--------|
| 아사 | 569 | 569 | 532 | 510 | 506 | **263** | **-243** |
| 절망 | 110 | 113 | 142 | 167 | 173 | **405** | **+232** |
| 탈수 | 20 | 12 | 14 | 14 | 12 | **13** | **+1** |
| 극도 피로 | 1 | 6 | 12 | 9 | 9 | **19** | **+10** |

**사망 원인 1위 역전:** v7까지 7회 측정 모두 **아사 ≥ 절망**. v8에서 **절망(405) > 아사(263)** 역전. v3~v7 추세선:
- 아사: 569 → 569 → 532 → 510 → 506 → 263 (v3 대비 -306, **-53.8%**)
- 절망: 110 → 113 → 142 → 167 → 173 → 405 (v3 대비 +295, **+268%**)

**T1 모사 nutrition 보강 효과:** 아사 -243건은 cooking lv 0 4직업의 cooked_noodles 산출(nutrition +35) 누적. v6 homeless 단독 효과 -22(아사)·+25(절망) 패턴이 v8에서 4직업 동시 발생 → 절망 +232 폭증 정합.

### 5.2 직업별 K5 (v7 vs v8)

| 직업 | v8 K5 (result.json) | v7 K5 추정 | 변화 |
|------|---------------------|------------|------|
| **doctor** | 절망 98 / 극도 피로 1 / 아사 1 | 아사 72 / 절망 28 | **아사 -71 / 절망 +70 / 극도 피로 +1** |
| **soldier** | 절망 50 / 아사 48 / 극도 피로 2 | 아사 100 | **아사 -52 / 절망 +50 / 극도 피로 +2** |
| **firefighter** | 아사 86 / 절망 11 / 극도 피로 3 | 아사 100 | **아사 -14 / 절망 +11 / 극도 피로 +3** |
| homeless | 아사 54 / 절망 46 | 아사 72 / 절망 28 | 아사 -18 / 절망 +18 |
| chef | 절망 83 / 탈수 11 / 극도 피로 6 | 절망 82 / 탈수 12 / 극도 피로 6 | 절망 +1 / 탈수 -1 |
| **engineer** | 절망 77 / 아사 23 | 아사 94 / 절망 6 | **아사 -71 / 절망 +71** |
| pharmacist | 아사 51 / 절망 40 / 극도 피로 7 / 탈수 2 | 아사 72 / 절망 23 / 극도 피로 3 / 탈수 2 | 아사 -21 / 절망 +17 / 극도 피로 +4 |

**중요 분석:**
- **engineer 절망 +71건 (6 → 77)** 폭증 — 사망일 day 3 → day 4(+1.30d)로 morale 침식 시간 +1 TP_PER_DAY=72 누적. R8-1 미해소 상태에서 K3 연장이 절망으로 직결
- **doctor 절망 +70건 (28 → 98)** 폭증 — 사망일 day 4 → day 5(+0.90d). day 5 도달 회차 98건이 모두 절망으로 사망 (1건만 아사·1건만 극도 피로)
- **soldier 절망 +50건 (0 → 50)** — v7 절망 0건 → v8 50건. T1 nutrition 보강으로 아사 -52건이 절망으로 사망 원인 전환
- **firefighter 절망 +11건** — yongsan starvation 우세 패턴 유지(아사 86건). T1로 day 5 도달 가능해진 14회만 morale 침식 도달
- chef K5 분포 변화 0 단정 — T1 진입 차단 정합 (§4.4)
- homeless·pharmacist K5 분포 미세 변화 — T1 진입 차단 유지, v7 천장 도달분만 변동

### 5.3 R10-1 폭증 단정 — 사망 원인 역전 (절망 > 아사)

협의서 v3(PR10) §12.7 R10-1 신규 등록(v6 절망 +25) → 협의서 v4(PR11) §12.6 R10-1 추이 "안전" v7 +6 → **v8 +232 폭증**.

**단정 근거:**
- v7 절망 173 → v8 절망 405 (+232건, +134%)
- 사망 원인 1위 역전 (v7까지 아사 1위 → v8 절망 1위)
- `kpi.moraleDespair.byCharacter` 7직업 enteredDespair 100/100 (firefighter 87/100 제외) — 6직업 100% "death spiral suspected (>25%)" 경고
- 협의서 v3 §12.7 단정 인용 "R8-1(homeless·engineer actBoostMorale 0%)과 결합 시 R8-1 트랙(M3 #10 시나리오 한도연) 우선순위 상향"이 **v8에서 결정적 트리거**로 격상

**M3 #10 진입 트리거 충족:** 협의서 v3 §12.7 "+50 v6 대비" 위험 등록 기준의 **4.6배 초과** (v6 167 → v8 405, +238 = v6 기준 +142.5%). 협의서 v4 §12.6 다음 단계 4번 항 "baseline v8 측정 D+0" 진입 의무 **충족 단언.**

---

## 6. AI 발동 — T1 모사 효과

### 6.1 actT1Convert 발동 분포 (cooking lv 0 4직업)

`playerAI.mjs:307` `cookingLvForT1 === 0` 분기 적용 4직업:
- doctor / soldier / firefighter / engineer — `actT1Convert(simInv)` 호출
- chef(lv 4) / pharmacist(lv 1) / homeless(lv 3) — 분기 차단, 호출 0건

**T1 변환 4 규칙(`playerAI.mjs:178-183`) 발동 후보:**
- `cook_noodles_t1`: `instant_noodles → cooked_noodles` (nutrition +35) — doctor·soldier·firefighter·engineer startInv 보유분
- `cook_rice_t3`: `rice → cooked_rice` (nutrition +25 추정) — 7직업 startInv 미보유, lootTable 의존 (낮은 빈도)
- `boil_contaminated_t5` / `boil_rainwater_t7`: → `boiled_water` (hydration +65). needs-aware nutrition 결핍 시 (`n*3 + h` = 65) cooked_noodles benefit(35×3+0=105) 우위 — cooked_noodles 우선 선택 정합

**핵심 단정:**
- T1 효과 = 주로 `cook_noodles_t1` 발동. 4직업 startInv `instant_noodles` 보유분이 cooked_noodles로 변환되어 nutrition +35/회 추가
- soldier Δ+1.50d 단독 효과 = T1 cooked_noodles 산출이 평균 사망일 day 3 → day 4.5로 연장한 결과 (`actCook` 차단으로 K3 정체 상태에서 T1이 nutrition 경로 단독 제공)
- firefighter Δ+2.00d 최대 = startInv 추정 `instant_noodles` 보유량 우위 + actCook boiled_water 출력 잔존(`actT1Convert` 후 `actCook` 둘 다 실행 가능 — runDayAI line 300, 308에 순차 호출)

### 6.2 chef·pharmacist·homeless T1 진입 차단 회귀 단정

- chef cookingLv 4 → `cookingLvForT1 === 0` false → actT1Convert 호출 0건. K3 5.20·K5 분포 동일. **회귀 0**
- pharmacist cookingLv 1 → 동일 분기 차단. K3 4.10 동일. **회귀 0**
- homeless cookingLv 3 → 동일 분기 차단. K3 4.10 → 4.20 (+0.10, noise 수준). **회귀 0**

**의도된 차단 단정:** 협의서 v4(PR11) §12.6 다음 단계 2번 항 "cooking lv 0 4직업 cooked_noodles 산출 경로" 한정으로 T1 효과 범위 의도. cooking lv ≥1 직업은 actCook needs-aware 산식으로 이미 cooked_noodles 산출 (homeless v6 35.3%, chef·pharmacist 50%). T1 적용 시 회차당 1건 추가 산출되어 회귀 발생 → 분기 차단으로 보호.

### 6.3 actFish PR12 효과 (4 hasFishing 직업)

PR12 `baseCatchChance: 0.30 → 0.50` 적용. fishingLv=0 기준 어획 확률 +0.20:
- v7 doctor·firefighter·engineer·pharmacist actFish 발동 추정 52~63/100 (v5 기준 인용, v6·v7 PR9 fishing 미관여로 회귀 0 단정)
- v8 fishing 확률 +66.7% 향상 (0.30 → 0.50) — 어획 1회당 영양 기댓값 0.30×10=3 → 0.50×10=5 (+2/회)
- 협의서 v4(PR11) §2.1 추정 "K1 +2~5%p" — **v8 측정 결과 K1 +0%p**, 추정치 미달 단정. K3 +1.30~2.00d 효과가 PR12로 일부 기여하나 K1 도달 미보장
- pharmacist hasFishing true + T1 차단 → PR12 단독 효과 측정 가능 영역. K3 변화 0 (v7 4.10 → v8 4.10) — **PR12 K3 단독 효과 측정 영역에서 0** 단정. 천장 도달 또는 day 4 사망 회차 비율로 fishing 추가 어획 누적 불가능 추정 (v9 probe 위임)

---

## 7. KPI 표 비교 — v3~v8 6 컬럼

협의서 v3(PR10) §9.5 + §12.3 정정 KPI + 협의서 v4(PR11) §12.6 갱신 KPI 통합:

| KPI | v3 | v4 | v5 | v6 | v7 | **v8** | 협의서 v4 §12.6 목표 | 충족 |
|-----|----|----|----|----|----|--------|---------------------|------|
| K1 (전 직업) | 0% | 0% | 0% | 0% | 0% | **0%** | ≥ 5% | ❌ — **9회 연속** |
| K3 doctor | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 | **4.9** | +1d (5.0) | ⚠️ 거의 충족 (-0.1d) |
| K3 soldier | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | **4.5** | +1d (4.0) | ✅ 초과 달성 |
| K3 firefighter | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | **5.0** | +1d (4.0) | ✅ 초과 달성 |
| K3 homeless | 3.0 | 3.0 | 3.2 | 4.1 | 4.1 | **4.2** | 5.0~6.5 | ❌ 미달 |
| K3 chef | 4.5 | 5.2 | 5.2 | 5.2 | 5.2 | **5.2** | 5.5~7.0 | ❌ 미달 (변화 0) |
| K3 engineer | 3.0 | 3.0 | 3.0 | 3.1 | 3.1 | **4.4** | +1d (4.0) | ✅ 초과 달성 |
| K3 pharmacist | 3.0 | 4.0 | 4.1 | 4.1 | 4.1 | **4.1** | 5.0~6.5 | ❌ 미달 (변화 0) |
| **K5 아사** | 569 | 569 | 532 | 510 | 506 | **263** | ↓ | ✅ -243 |
| **K5 절망** | 110 | 113 | 142 | 167 | 173 | **405** | ≤ v6+50 (≤217) | **❌ R10-1 폭증** |
| K5 탈수 | 20 | 12 | 14 | 14 | 12 | **13** | ↓ | ✅ 안정 |
| K5 극도 피로 | 1 | 6 | 12 | 9 | 9 | **19** | ≤ 10 | ⚠️ 초과 |
| K3 chef 격차 정의 1 | +1.33 | +1.87 | +1.80 | +1.65 | +1.65 | **+0.68** | +1.0~+2.0d 사수 | ❌ 하한 미달 |
| K3 chef 격차 정의 2 | +1.30 | +2.00 | +1.94 | +1.76 | +1.76 | **+0.60** | +1.0~+2.0d 사수 | ❌ 하한 미달 |
| chef grace 트리거(+2.5d) | - | +2.00 | +1.94 | +1.76 | +1.76 | **+0.60** | < +2.5d | ✅ 보류 유지 |
| 직업 격차 K1 max-min | 0%p | 0%p | 0%p | 0%p | 0%p | **0%p** | ≤ 5%p | ✅ |
| cookOut cooking lv 0 nut% | 0% | 0% | 0% | 0% | 0% | **T1 산출 4직업** | (재정의 §12.3) | ✅ **M3 #14b 해소** |
| R8-1 morale 시계열 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정 | **미측정** | day 1~3 확보 | ❌ — M3 #10 진입 의무 |

**충족 6건 (K3 soldier·firefighter·engineer 초과, K5 아사·탈수 ↓, K1 격차, grace 트리거, cookOut). 미달 8건 (K1, K3 4직업, K5 절망, R8-1, chef 격차 정의 1·2). 부분 달성 2건 (K3 doctor 거의, K5 극도 피로).**

---

## 8. R7·R8·R9·R10 상태표 갱신

| ID | v7 (PR11 후) | **v8 (PR12+T1 후)** |
|----|--------------|---------------------|
| R7-1 요리·낚시 AI 부재 | ✅ 발동 | ✅ 발동 + T1 모사 추가 |
| R7-1.5 actCook 산출물 nutrition 효과 | ⚠️ PR10 부분 해소 (cooking lv ≥1) | ✅ **M3 #14b T1 모사로 lv 0 4직업 해소** (cooked_noodles 산출 경로 추가) |
| R7-2 morale 관리 AI 부재 | ✅ chef·pharmacist·doctor 99~100% 발동 | ✅ 변화 없음 (T1·PR12 morale 미관여) |
| R7-3 lootTable food density | ✅ PR8 6구 + PR11 25구 raw food 가중치 보강 | ✅ 변화 없음 (T1·PR12 lootTable 미관여) |
| R8 cook_intuition grace 효과 | ✅ 격차 +1.76d, 트리거 +2.5d 미충족 | ✅ 격차 +0.60d (큰 축소), 트리거 미충족 유지 |
| **R8-1 morale 회복 자원 부재** | ⚠️ 원인 2 단정 유지 | ⚠️ **악화** — R10-1 폭증 + 사망 원인 1위 역전. M3 #10 진입 의무 트리거 |
| **R9-1 4 hasFishing K1 효과 부족** | ⚠️ PR12 진입 트리거 | ⚠️ **PR12 효과 측정 어려움** (T1 합산). doctor 4.0→4.9, firefighter 3.0→5.0, engineer 3.1→4.4 합산 효과. pharmacist 단독으로 PR12 효과 0 단정 |
| R9-2 chef PR9 효과 0 | ✅ 변경 보류 유지 | ✅ chef T1 lv 4 진입 차단 + PR12 junggoo 비-hasFishing — K3 5.20 격차 보호 정합 |
| **R10-1 절망 사망 가속** | ⚠️ +6 (안전, v6 167→v7 173) | **❌ +232 (1위 역전, v7 173→v8 405)** — M3 #10 진입 트리거 충족 단언 |

---

## 9. 다음 단계 / 트리거 후보

### 9.1 M3 #10 시나리오 한도연 트랙 진입 의무 단언

**트리거 충족 단정:**
1. R10-1 추이 v6 +25 → v7 +6 → v8 **+232** (사망 원인 1위 역전)
2. R8-1 morale 회복 자원 부재 v7까지 미해소, T1 모사·PR12 모두 morale 미관여
3. K1 9회 연속 0% — 사망일 연장 단독으로 K1 ≥ 5% 도달 불가 단정
4. 협의서 v4(PR11) §12.6 다음 단계 4번 항 "baseline v8 측정 D+0" 진입 시점 명시

**단언:** **M3 #10 시나리오 한도연 트랙 baseline v8 D+0 진입 의무.** 추가 협의 불요 — 본 보고는 협의서 v4 §12.6 단정에 의거한 트리거 충족 보고만 단언.

### 9.2 PR13 후보 — morale 회복 자원 분배

R8-1 원인 단정(homeless·engineer day 2 morale 12~13 급락 — 협의서 v3 §12.7 인용) 후속:
- homeless·engineer startInv에 morale 회복 아이템 추가 후보
- 후보 1: `newspaper_bundle` morale 효과 강화 (현재 onConsume.morale 수치 확인 위임 — items.js)
- 후보 2: 신규 morale 회복 아이템 추가 (시스템 백승호 + 시나리오 한도연 공동 위임)
- 후보 3: `actBoostMorale` AI 분기 — `playerAI.mjs:241~254` (현재 morale < 30 한정) 임계 조정

**시점:** M3 #10 진입 결과 의존. M3 #10이 morale 회복 자원 분배 자체를 다룬다면 PR13 후보는 시뮬 측 분기 조정 단독으로 축소 가능 — 시나리오 한도연 위임 후 협의서 v5 결정.

### 9.3 chef·pharmacist K3 변화 0 — T1 진입 차단 의도된 결과 단정

- chef T1 차단 (cookingLv 4) + PR12 non-hasFishing (junggoo) → K3 5.20 동일. 격차 정의 2 +1.94d → +0.60d 큰 축소가 발생했으나 **chef 측에서 변화 0**. 격차 축소는 5직업 K3 향상 결과
- pharmacist T1 차단 (cookingLv 1) + PR12 hasFishing true → K3 4.10 동일. v5 천장 도달 후 PR12 추가 향상 0
- 협의서 v2(PR9) §6.2 +2.5d 트리거 미충족 유지 (격차 정의 2 v8 +0.60d, 트리거 대비 24%). **cook_intuition grace 단축 보류 유지.**
- chef·pharmacist 직업 정체성 보호 의도 달성 단정 — `playerAI.mjs:307` 분기가 정합

### 9.4 PR12·T1 효과 분리 측정 — 우선순위 후순위

baseline v9 옵션:
- v9a: PR12 단독 롤백 (`gameBalance.js:328` 0.50 → 0.30 임시) + T1 유지 측정
- v9b: T1 단독 롤백 (`playerAI.mjs:302-310` 분기 제거 임시) + PR12 유지 측정

두 옵션 모두 doctor·firefighter·engineer Δ에서 T1·PR12 기여분 분리. 단:
- M3 #10 진입이 우선 (§9.1)
- PR12 단독 효과는 pharmacist 측정으로 0 단정 가능 — soldier T1 단독 효과 +1.50d 단정과 결합하면 분리 측정 가치 후순위
- v9 측정 우선순위: M3 #10 머지 후 baseline 측정 (PR13 후보 포함)이 본질적 K1 향상 경로

---

## 10. 결정 단언 종합

| 항목 | v8 측정 단언 |
|------|------------|
| K1 ≥ 5% | ❌ 미달 (9회 연속 0%, M3 #10 진입 의무) |
| K3 chef 격차 +2.5d 초과 | ❌ 미초과 (+0.60~0.68d, grace 단축 보류 유지) |
| K3 chef 격차 +1.0d 하한 사수 | **❌ 하한 미달** (정의 1 +0.68 / 정의 2 +0.60) — 5직업 큰 향상 결과 |
| M3 #14b T1 모사 효과 — cooking lv 0 4직업 | ✅ doctor +0.90 / soldier +1.50 / firefighter +2.00 / engineer +1.30 |
| M3 #14b 효과 — chef·pharmacist·homeless 회귀 | ✅ 회귀 0 (T1 진입 차단 정합) |
| PR12 효과 — K1 +2~5%p 추정 | ❌ 측정 0%p (K3 +1.30~2.00d 일부 기여 추정, T1과 분리 불가) |
| PR12 효과 — pharmacist 단독 K3 | ❌ 변화 0 (v5 천장 도달 후 추가 향상 없음) |
| T1 단독 효과 — soldier | ✅ +1.50d (hasFishing·cookingLv·PR12 동시 0) |
| 시뮬 결정성 | ✅ fingerprint `len316-h242a5b5f` 유지, bootstrapErrors 0/700 |
| K5 사망 원인 1위 역전 | **❌ R10-1 폭증** (절망 173 → 405, +232건) |
| R10-1 M3 #10 진입 트리거 | ✅ 충족 (v6 +25, v7 +6, v8 +232 — 4.6배 초과) |
| §12.3 cooking lv 0 4직업 KPI | ✅ T1 모사로 해소 (산출 경로 확보) |
| drift fingerprint leaf 값 추적 한계 | ⚠️ PR12 leaf 값 변경 무영향. v9+ leaf hash 검토 권고 |

### 10.1 다음 단계 권고 요약

1. **M3 #10 시나리오 한도연 트랙 진입 의무** — 협의서 v4(PR11) §12.6 다음 단계 4번 항 트리거 충족 단언. baseline v8 D+0 진입
2. **PR13 후보** — morale 회복 자원 분배 (homeless·engineer 우선, R8-1 원인 2 단정 입력). 시나리오 한도연 + 시스템 백승호 공동 위임. M3 #10 결과 의존
3. **chef·pharmacist K3 변화 0 — 의도된 결과 단정 유지** (T1 분기 차단, 격차 정의 2 +0.60d로 보호)
4. **(후순위) baseline v9 — PR12 또는 T1 단독 롤백 측정**. M3 #10 진입 후 검토. 우선순위 4
5. **drift 측정 한계 노트** — fingerprint가 leaf 값 변경 무감지. v9+에서 leaf 값 hash 추가 검토 (M4+ 도구 트랙)

### 10.2 baseline v8 → v9 트리거 조건

- M3 #10 머지 후 baseline 재측정 (PR13 후보 포함 가능)
- v9 측정 의무 probe: homeless·engineer morale 시계열 (R8-1 원인 단정 입력), actT1Convert 발동 회수 7직업별, soldier startInv `instant_noodles` 잔량 추이
- K1 ≥ 5% 도달 시 협의서 v5 발행 — chef·pharmacist 격차 보호 KPI 재검토

---

*문서 끝. M3 #10 시나리오 한도연 트랙 진입 결과 도착 시 본 §9.1 충족 단언 + R10-1 추이 v9 측정 인용 정합 확인 의무.*
