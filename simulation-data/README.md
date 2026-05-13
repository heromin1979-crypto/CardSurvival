# Simulation Data — Card Survival: Ruined City

> 시뮬레이션 baseline 측정 데이터 + 튜닝 결정. 시뮬레이터 런타임은 `/tools/sim/v2/`.
> 측정 인덱스: M3 트랙 baseline v1~v14 (15회 측정, M0~M3 트랙 마감).

---

## 디렉토리 구조

```
simulation-data/
├── README.md                                # 본 문서
├── baselines/
│   ├── plans/                               # 측정 계획 (2건)
│   │   ├── BAL_SIM_baseline_v1.md           # 6직업 100회 시뮬 계획·양식
│   │   └── BAL_SIM_event_overlap_day60_100.md  # 후반 이벤트 폭주 측정 계획
│   ├── reports/                             # 측정 보고서 (13건)
│   │   ├── BAL_SIM_baseline_v1_report.md    # M1 baseline 700회 1차 측정
│   │   ├── BAL_SIM_baseline_v3_report.md    # M3 PR7 후
│   │   ├── BAL_SIM_baseline_v4_report.md    # M3 PR8 후
│   │   ├── BAL_SIM_baseline_v5_report.md    # M3 PR9 후
│   │   ├── BAL_SIM_baseline_v6_report.md    # M3 PR10 후
│   │   ├── BAL_SIM_baseline_v8_report.md    # M3 PR12 + T1 모사
│   │   ├── BAL_SIM_baseline_v9_report.md    # M3 PR13 후
│   │   ├── BAL_SIM_baseline_v10_report.md   # M3 PR15 후
│   │   ├── BAL_SIM_baseline_v11_report.md   # M3 PR14·PR16 후
│   │   ├── BAL_SIM_baseline_v12_report.md   # M3 PR14.1+PR16.1 후
│   │   ├── BAL_SIM_baseline_v13_report.md   # M3 PR16 craft 빈도 후
│   │   └── BAL_SIM_baseline_v14_report.md   # ★ M3 PR17 후 (R11-1 완전 해소)
│   └── raw/                                 # raw JSON (13건, v1·v3~v14)
└── tuning/
    └── BAL_TUNING_chef_grace.md             # chef cook_intuition 튜닝
```

> **v2·v7 누락:** v2는 측정 폐기 (PR5 직후 sanity 실패). v7은 1차/2차 fingerprint 변동 0으로 reports 폴더에 정식 보고 없음 (raw JSON만 보존).

---

## baseline 측정 진행 (v3 → v14)

| ver | 트랙 | buildTag | fingerprint | K1 (전직업) | chef K3 | 핵심 단정 |
|-----|------|----------|-------------|-------------|---------|-----------|
| v3 | PR7 후 baseline | `sim-baseline-v3-pr7` | `len316-h242a5b5f` | 0% | 4.5 | actCook/Fish/BoostMorale 3 AI 도입 |
| v4 | PR8 후 (lootTable + startInv) | `sim-baseline-v4-pr8` | `len316-h242a5b5f` | 0% | 5.2 | chef 격차 +2.2d / R8-1 발견 |
| v5 | PR9 후 (hangang rod 자동) | `sim-baseline-v5-pr9` | `len316-h242a5b5f` | 0% | 5.2 | actFish 52~63/100 발동 / R9-1 등록 |
| v6 | PR10 후 (needs-aware) | `sim-baseline-v6-pr10` | `len316-h242a5b5f` | 0% | 5.2 | homeless +0.9d / R10-1 신규 |
| v7 | PR11 옵션 2 (raw food) | `sim-baseline-v7-pr11` | `len316-h242a5b5f` | 0% | 5.2 | **PR11 옵션 2 설계 결함 단정** |
| v8 | PR12 + T1 모사 | `sim-baseline-v8-pr12-t1` | `len316-h242a5b5f` | 0% | 5.2 | cooking lv 0 4직업 K3 +0.9~2.0d ↑ |
| v9 | PR13 후 (homeless·engineer Tier-2) | `sim-baseline-v9-pr13` | `len316-h242a5b5f` | 0% | 5.2 | R8-1 부분 완화 / R13-1 신규 |
| v10 | PR15 후 (ability 가산 sim AI) | `sim-baseline-v10-pr15` | `len316-h242a5b5f` | 0% | 5.2 | R11-1 액션 트리거 발동 / R15-1 신규 |
| v11 | PR14·PR16 후 (4 SCN_QUEST) | `sim-baseline-v11-pr14` | `len316-h242a5b5f` | 0% | 5.40 | **R11-1 정의 2 해소** / **R8-1 완전 해소** |
| v12 | PR14.1+PR16.1 (재조정) | `sim-baseline-v12-pr14-1` | `len316-h242a5b5f` | 0% | 5.38 | R14-1·R14-2 미해소 / 구조적 한계 단정 |
| v13 | PR16 craft 빈도 보강 | `sim-baseline-v13-pr16` | `len316-h242a5b5f` | 0% | 5.40 | 트랙 A 실패 / R15-1 완전 해소 |
| v14 | PR17 후 (chef supply) | `sim-baseline-v14-pr17` | `len316-h242a5b5f` | 0% | **6.10** | ★ **시뮬 R11-1 완전 해소 단언** |

**fingerprint `len316-h242a5b5f` v3~v14 12연속 유지 단언** — BALANCE leaf 결정성 완전 보존.

---

## 시뮬 측정 절차

### 측정 실행
```bash
# tools/sim/v2/run_baseline.mjs 의 OUTPUT_FILE / buildTag 갱신 후
node tools/sim/v2/run_baseline.mjs
```

### 결과물
- `simulation-data/baselines/raw/BAL_SIM_baseline_v{N}_result.json` — raw 데이터 (자동 출력)
- `simulation-data/baselines/reports/BAL_SIM_baseline_v{N}_report.md` — 밸런스 페르소나 정식 보고서 (수기 작성)

### 측정 환경 단정
- 7직업 × 100회 = 700 runs
- seed 결정성 100% (seedBase=0)
- bootstrapErrors 0/700 검증
- balanceFingerprint drift 검증 (v3~v14 12연속 유지 단언)

---

## 핵심 KPI 추세 (M3 트랙 마감 시점)

| KPI | v3 → v14 | 목표 | 충족 |
|-----|----------|------|------|
| K1 (전 직업) | 0% (15회 연속) | ≥ 5% | ❌ (시뮬-게임 본체 분리 단정, M4 텔레메트리 이전) |
| K3 chef | 4.5 → 6.10 | ≤ 6.5 | ✅ (3차 KPI, 마진 0.4d 안전) |
| K3 chef 격차 정의 1 | +1.5 → +1.29d | ≥ +1.0d | ✅ (1차 KPI, 1.29배) |
| K3 chef 격차 정의 2 | +1.33 → +1.27d | ≥ +0.5d | ✅ (2차 KPI, 2.53배, v13 미해소 → v14 완전 해소) |
| K5 사망 — 절망 | 110 → 224 (peak 405 → 224) | ↓ | ⚠️ peak 회수 44.7% (R10-1 단계적 해소) |
| K5 사망 — 아사 | 555 → 373 | ↓ | ✅ |

---

## 5곳 등록 룰 (협의서 v5 §16.3, 시뮬 정합 트랙 표준 운영 정의)

신규 자원 추가 시 다음 5곳 모두 등록 의무. 미등록 시 시뮬 K3 효과 0.
1. `js/data/items_misc.js` (또는 items_base 등) — 아이템 정의
2. `js/data/stackConfig.js` — 스택 룰
3. `js/factories/CardFactory.js` CARD_IMAGES — 이미지 매핑
4. `js/data/characters.js` startingItems — 시작 인벤토리
5. `tools/sim/v2/playerAI.mjs:130~133 actEat candidates` — 시뮬 효과 발현 (5곳째 신규)

**첫 적용 검증:** PR17 (`chef_meal_kit`·`hearty_stew`) — baseline v14에서 100/100 runs 완전 소비. actEat candidates 등록이 시뮬 K3 효과 발현의 필요·충분 조건 단언.

---

## 트랙 정체성 (협의서 v5 §15, 2026-05-12 단정)

**본 시뮬레이션 데이터는 "시뮬 정합 게임 데이터 작성" 트랙의 KPI 측정.** baseline KPI(K1·K3·K5·chef 격차)는 *시뮬 K1 마지노선*. 게임 본체 K1과의 매핑은 M4+ 텔레메트리 트랙으로 분리. 모든 R/KPI 단언은 시뮬 도구 안에서 해석.

---

*문서 끝. 신규 baseline 측정 시 본 README 갱신.*
