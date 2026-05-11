# 밸런스 — baseline v3 측정 보고 (PR7 후)

> 작성: 밸런스 권지나 / 2026-05-11
> 결정: K1 측정 보류. K3 격차 chef +1.5d 확정. 다음 측정은 PR8(lootTable food density) 후 v4.

---

## 1. 실측 환경

- 시뮬: `tools/sim/v2/` (PR1~PR7 누적)
- 진입점: `node tools/sim/v2/run_baseline.mjs`
- 700 runs (7직업 × 100회)
- 시드: SEED_BASE=0, mulberry32, Math.random monkey-patch 결정성 보장
- TARGET_DAYS=100, TP_PER_DAY=72
- 실행 시간: 6.7초
- BALANCE leaf 합: 227, fingerprint: `len316-h242a5b5f`
- 결과 파일: `BAL_SIM_baseline_v3_result.json`

PR7 추가 행동: actCook · actBoostMorale · actFish (자세히 `SYS_PR7_cooking_fishing_morale_ai.md`).
PR7 부수 보정: gameStateReset이 characters.js startingSkills를 GameState.player.skills.{id}.level에 주입하도록 변경.

---

## 2. K1 — 100일 생존율 (목표 10~20%)

| 직업 | 생존율 | ±CI95p | survived/runs |
|------|--------|--------|---------------|
| doctor | 0.00% | 0.00 | 0/100 |
| soldier | 0.00% | 0.00 | 0/100 |
| firefighter | 0.00% | 0.00 | 0/100 |
| homeless | 0.00% | 0.00 | 0/100 |
| chef | 0.00% | 0.00 | 0/100 |
| engineer | 0.00% | 0.00 | 0/100 |
| pharmacist | 0.00% | 0.00 | 0/100 |

직업 간 최대 격차: 0.00%p (목표 ≤ 5%p).

**판단: K1 측정 목표(10~20%) 미달. baseline 5회 연속 0% (PR5 → PR5.5 → PR6 → PR7-pre → PR7).** 다음 절에서 잔여 병목 분석.

---

## 3. K3 — 평균 사망일 (사망 회차 한정)

| 직업 | mean | median | deaths |
|------|------|--------|--------|
| doctor | 4 | 4 | 100 |
| chef | **4.5** | **5** | 100 |
| soldier | 3 | 3 | 100 |
| firefighter | 3 | 3 | 100 |
| homeless | 3 | 3 | 100 |
| engineer | 3 | 3 | 100 |
| pharmacist | 3 | 3 | 100 |

**핵심 K3 격차: chef +1.5d**. doctor도 +1d 격차 유지. 두 직업은 startInv 효과가 의미 있는 수준에서 측정됨.

K3는 PR5(Player AI) → PR5.5(자원 채집) → PR6(onConsume derive) → PR7(cooking/fishing/morale AI) 누적 결과로 PR6 대비 변동 없음. PR7의 추가 AI는 무탈 작동하나 **실질 발동이 자원 게이팅으로 차단됨** (자세히 §5).

---

## 4. K5 — 사망 원인 분포 (전 직업 합산)

| 원인 | PR5 | PR5.5 | PR6 | PR7 |
|------|-----|-------|-----|-----|
| 아사 | 500 | 588 | 569 | **569** |
| 탈수 | 174 | 48 | 20 | **20** |
| 절망 | 26 | 64 | 110 | **110** |
| 극도 피로 | 0 | 0 | 1 | **1** |

PR7은 PR6과 동일. PR5.5→PR6 전환에서 탈수↓·절망↑·아사↓ 흐름이 관찰된 이후 안정화 — **아사가 주된 사망 사유로 고정**.

---

## 5. K1=0% 잔여 병목 (PR7 발견)

PR7의 3 AI는 정상 구현됐으나 다음 자원 게이팅으로 실질 발동 못함:

| AI | 발동 빈도 (단일 회차 probe) | 원인 |
|----|---------------------------|------|
| actCook | 0 (가드 보정 후) | 시작 구 lootTable에 raw cooking 입력(rice, raw_meat, herb, instant_noodles, wild_berry) 미포함 |
| actFish | 0 | 7직업 startInv에 fishing_rod 없음. rod blueprint는 day 3 사망 안에 제작 불가 (재료 부족) |
| actBoostMorale | 낮음 | 회차 대부분이 day 3 아사 → morale<30 도달 전 사망 |

부수 보정으로 `gameStateReset.mjs`가 cooking·harvesting·scavenging 등 직업별 startingSkills를 GameState에 주입하기 시작했으나(이전: 시뮬 회차 내내 level=0 고정), 직업 보너스가 발동하려면 *해당 skill을 사용하는 시스템*이 실질 동작해야 함. AI 측 게이팅이 그것을 막고 있음.

---

## 6. 다음 단계 (PR8 권고)

**PR8 — lootTable food density 보강** 또는 **시작 인벤토리 조정**:

| 옵션 | 효과 | 비용 |
|------|------|------|
| A. lootTable에 herb/wild_berry/raw_meat 가중치 추가 | AI cooking 발동 가능. scavenging 직업 보너스 실측 가능 | 25 구 × 가중치 검토 (중) |
| B. startInv에 cooking 입력 직접 추가 | chef cooking AI 즉시 발동 | day 0 자원 추가 — 직업별 정합 검토 |
| C. fishing landmark에서 rod 자동 지급 | actFish 활성 | landmarks.js 변경 (소) |

A+C 조합 권장. baseline v4는 PR8 후 측정.

---

## 7. R 위험 상태 갱신

| ID | 이전 | 현재 |
|----|------|------|
| R7-1 요리·낚시 AI 부재 | ⏳ PR7 권고 | ✅ 구현, 발동 차단 (자원 부재) |
| R7-2 morale 관리 AI 부재 | ⏳ PR7 권고 | ✅ 구현, 발동 빈도 낮음 |
| R7-3 (신규) lootTable food density | — | ⏳ PR8 권고 |
| R8 cook_intuition 효과 측정 불가 | ⏳ PR7 후 | ⏳ K3 +1.5d 격차 측정. encounterMultDays 효과 가시 (DIR 검수 통과) |

---

## 8. K3 chef +1.5d 분해

chef가 다른 직업 대비 +1.5d 더 생존하는 구성:
1. **startInv 5개** (knife + canned_food×2 + preserved_ration) — knife_mastery ability의 startingItems 효과 (`SCN_PR_chef_knife_mastery.md`)
2. **cook_intuition 7일 grace** — encounter ×0.5 → 자원 채집 안전성 ↑ (`DIR_GATE_chef_start_environment.md`)
3. **cooking lv 4** — PR7 cooking AI 잠재 발동 (자원 부재로 미발동 중)
4. **preserved_ration onConsume**: nutrition+40, morale+5 — PR6 derive로 정합화

doctor는 startInv 12개(`medical_supply` ability)로 +1d, 다만 chef의 startInv 5개와의 차이가 +1.5d에서 +0.5d 좁혀짐 — preserved_ration의 nutrition·morale 종합 효과가 의료 startInv보다 K3에 더 기여.

---

## 9. 결정

K1 측정 보류, K3 chef +1.5d 확정. PR8(lootTable food density) 머지 후 baseline v4 측정. v4까지 cook_intuition 수치(`days=7, mult=0.5`) 변경 권고 없음 (`BAL_TUNING_chef_grace.md` 참조).

---

*문서 끝.*
