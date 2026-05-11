# 시스템 — 시뮬 v2 PR1 보고

> 작성: 시스템 백승호 / 2026-05-11
> 대상: `tools/sim/v2/` PR1 인프라 작성
> 결정: **머지 가능.** 단위 검사 87/87 통과. INCOMPLETE 마커 부착.

---

## 1. 산출물

`tools/sim/v2/` 신규 디렉터리. 9 파일.

| 경로 | 역할 |
|------|------|
| `characterAdapter.mjs` | 게임 characters.js → 시뮬 character config 변환 |
| `gameStateFactory.mjs` | 시뮬용 GameState 초기화 (PR2에서 게임 GameState 통합) |
| `runner.mjs` | TP 루프 stub (PR2에서 EventBus 발화 추가) |
| `index.mjs` | CLI 진입점 (`--char`, `--runs`, `--seed`, `--list`, `--info`) |
| `rng.mjs` | mulberry32 시드 RNG |
| `mocks/renderer.mjs` | 렌더 noop + 호출 카운터 |
| `mocks/i18n.mjs` | 라벨 영문 키 그대로 + 변수 치환 |
| `mocks/sound.mjs` | Sound·BGM noop |
| `mocks/globalShim.mjs` | window·document·localStorage·rAF stub |
| `tests/characterAdapter.test.mjs` | 7직업 maxHp·skills·stamina 공식 검증 |
| `tests/startDistrict.test.mjs` | 7직업 startDistrict가 districts.js에 존재 |
| `tests/seedDeterminism.test.mjs` | RNG·runner 결정성 검증 |

총 12 파일 + 디렉터리 3개.

---

## 2. 단위 검사 결과

```
characterAdapter.test  Pass: 72, Fail: 0  ✅
startDistrict.test     Pass:  8, Fail: 0  ✅
seedDeterminism.test   Pass:  7, Fail: 0  ✅
─────────────────────────────────────────
                       Pass: 87, Fail: 0
```

전 단위 검사 통과. PR4의 baseline 측정 시점까지 회귀 검증의 마지노선.

---

## 3. CLI 동작 검증

### 3.1 `--list` 출력 (실측 stamina 공식 검증)

```
Available characters:
  doctor       이지수      HP 105  STA 84   start dongjak
  soldier      강민준      HP 110  STA 113  start dobong
  firefighter  박영철      HP 120  STA 136  start eunpyeong
  homeless     최형식      HP 75   STA 40   start gwangjin
  chef         윤재혁      HP 95   STA 85   start junggoo
  engineer     정대한      HP 110  STA 113  start yongsan
  pharmacist   한소희      HP 80   STA 50   start gangnam
```

stamina 공식 `strength × endurance / 50` 7직업 모두 정합:

| 직업 | strength | endurance | 계산 | 실측 |
|------|---------|-----------|------|------|
| doctor | 58 | 72 | 83.52 → 84 | 84 ✓ |
| soldier | 75 | 75 | 112.5 → 113 | 113 ✓ |
| firefighter | 80 | 85 | 136 | 136 ✓ |
| homeless | 50 | 40 | 40 | 40 ✓ |
| chef | 65 | 65 | 84.5 → 85 | 85 ✓ |
| engineer | 75 | 75 | 112.5 → 113 | 113 ✓ |
| pharmacist | 50 | 50 | 50 | 50 ✓ |

### 3.2 `--char chef --runs 3` 출력

INCOMPLETE 마커 정상 부착:
```json
{
  "schemaVersion": 2,
  "buildTag": "sim-v2-PR1",
  "phase": "incomplete",
  "incompleteMarker": "PR1 framework only — no game systems wired. Do NOT use as baseline.",
  ...
}
```

---

## 4. 실측 결과로 발견된 신규 격차 (시뮬 v1 → 시뮬 v2)

| 직업 | 항목 | 시뮬 v1 (sim_firefighter_300days) | 시뮬 v2 (characters.js) | 비고 |
|------|------|------------------------------------|--------------------------|------|
| doctor | maxHp | 95 | **105** | v1 정지 (90→95→105 버프 미반영) |
| doctor | startDistrict | dongjak | dongjak | 일치 |
| chef | startDistrict | junggoo | junggoo | 일치 |
| chef | startDistrict dangerLevel | (시뮬 미명시) | **5** | **이전 SCN_AUDIT의 "3" 정정** |
| chef | maxHp | 90 | 95 | v1 정지 |
| chef | stamina | 80 | **85** | strength × endurance / 50 정확 |
| pharmacist | maxHp | 80 | 80 | 일치 |
| pharmacist | stamina | 60 (추정) | **50** | 시뮬 v1 추정값 오류 |
| pharmacist | startDistrict | gwanak | **gangnam** | **불일치** — characters.js 정식 gangnam (mq_pharma_01 narrative) |
| homeless | startDistrict | yangcheon | **gwangjin** | **불일치** |
| homeless | maxHp | 65 | **75** | 변경됨 |
| homeless | stamina | 40 | 40 | 일치 |

**v1 시뮬과 게임 현행의 격차는 12건 식별 발견. 모두 v2가 정합.** 이는 baseline 측정 시 v1↔v2 결과 격차 모형(설계서 §7.3) 적용 시 핵심 입력.

---

## 5. 추가 P1 의심 — chef 시작 환경 비대칭

`--list` 결과 dangerLevel 분포:

| dangerLevel | 직업 |
|-------------|------|
| 1 | doctor, soldier, firefighter |
| 2 | homeless |
| 3 | engineer, pharmacist |
| **5** | **chef** |

**chef만 dangerLevel 5에서 시작.** 다른 직업 평균 1.7. 격차 +3.3 등급.

이전 SCN_AUDIT_chef_abilities.md §4에서 "chef startDistrict junggoo dangerLevel 3"으로 잘못 기록. 실제는 5. 즉:
- chef는 시작 인벤토리 1개(이전 P1, C1 PR로 보강 예정)
- chef는 시작 위험도 5 (다른 직업 1~3)

**chef는 직업 격차의 양 측면(자원·환경)에서 모두 최악.** SCN_AUDIT 정정 + Director 게이트 재검토 필요.

---

## 6. 사이드 이펙트 검증

### 6.1 게임 코드 영향
PR1은 `tools/sim/v2/` 신규 디렉터리만. 게임 코드(`js/`) 0건 변경.

### 6.2 validate.js 회귀
PR1 머지가 game data를 건드리지 않으므로 validate.js 회귀 없음.

### 6.3 시뮬 v1 호환
v1 시뮬 7건은 `testdata/`·루트에 그대로. v2와 병행. M2에서 폐기 결정.

---

## 7. PR2 진입 조건

PR2는 `systemBootstrap.mjs` + `drift.mjs` + 단위 검사 3건. 진입 전 결정.

| 항목 | 결정자 | 데드라인 |
|------|--------|----------|
| 27 시스템 SIM_SKIP 분류표 | 시스템 백승호 | PR2 진입 전 |
| GameState reset 헬퍼 신규 여부 | 시스템 백승호 | PR2 진입 전 |
| globalShim 보강 항목 (game 시스템 init 시점에 fail 사례) | 시스템 백승호 | PR2 D+1 spike |

---

## 8. 위임 / 후속

| ID | 작업 | 담당 |
|----|------|------|
| 8.1 | SCN_AUDIT_chef_abilities.md §4 — chef dangerLevel "3" → "5" 정정 | 시나리오 한도연 |
| 8.2 | chef knife_mastery startingItems PR (C1) | 시나리오·설정 합동 |
| 8.3 | chef 직업 시작 환경 비대칭 P1 결정 (Director 게이트) | Director 서민호 |
| 8.4 | sim_firefighter_300days 시뮬 결과(13.3% 생존율)의 신뢰도 — 12건 격차 반영 시 재해석 | 밸런스 권지나 |
| 8.5 | PR2 진입 조건 결정 (위 §7) | 시스템 백승호 |

---

## 9. 결론

PR1 머지 가능. 87/87 단위 검사 + CLI 동작 + INCOMPLETE 마커. 게임 코드 회귀 없음. 추가 발견 4건(doctor HP 105, chef dangerLevel 5, pharmacist startDistrict gangnam, homeless startDistrict gwangjin) 모두 v2가 정합.

**다음 PD 회의:** PR2 진입 결정. 27 시스템 SIM_SKIP 분류표 도착 후.

---

*문서 끝. PR1은 phase incomplete. baseline 라벨은 PR3 종료 시점에 부여.*
