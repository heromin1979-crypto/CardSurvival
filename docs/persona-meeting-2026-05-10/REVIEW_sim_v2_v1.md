# 시뮬 v2 설계서 — 6 페르소나 합동 검토 v1

> 작성: PD 김재훈 주재 / 2026-05-10
> 대상: `SYS_DESIGN_sim_v2.md`
> 결정: **보완 후 재검토.** 핵심 원칙(단일 진리)을 설계서 자체가 부분 위반. 6건 필수 보완 후 게이트 재진입.

---

## 1. 종합 결정

| 항목 | 평가 |
|------|------|
| 디렉터리 구조 (§3) | 통과 |
| 7 설계 원칙 (§2) | 좋음 — 단 §4가 §1 자체 위반 |
| drift detection 개념 (§7) | 통과 |
| 출력 스키마 (§10) | 작은 보완만 |
| 7직업 정의 (§4) | **거절** — characters.js 단일 진리 위반 |
| 엔진 명세 (§5) | **보완** — 합성 시스템 누락 |
| PR 일정 (§13) | **보완** — PR1 단위 검사 모순 + PR4 비대 |
| v1↔v2 격차 기준 (§7.3) | **보완** — 격차는 alarm 아님 |
| Phase 1 부분 baseline 사용 정책 | **추가 명시 필요** |

**최종:** 보완 후 재검토. PD가 6건 필수 보완을 명시. 보완안 반영된 v2 설계서가 도착하면 Phase 0 spike 1일 후 PR1 진입.

---

## 2. 페르소나별 발견

### 2.1 밸런스 권지나 — KPI·신뢰

**B1 (P1).** §4 chef 정의가 `characters.js` 263~324행과 불일치.
- 시뮬v2 `maxHp: 90` ↔ characters.js `maxHp: 95`
- 시뮬v2 `stamina: 80` ↔ characters.js `endurance: 65 (→ stamina ≈ 85)` (주석 기반)
- 시뮬v2 skills `cooking: 4, crafting: 4` ↔ characters.js startingSkills `cooking: 4, harvesting: 3, melee: 2`
- 설계서 §1 "gameBalance.js 직접 import. 시뮬 측 BALANCE 키 하드코딩 0건"이 BALANCE 한정인 건 맞지만, **§2 원칙 1을 일반화하면 characters.js도 단일 진리여야 함.** 설계서가 자기 원칙을 부분 위반.

**B2 (P1).** §7.3 "v1↔v2 결과 ±5%p 초과 시 분석" 기준 잘못됨.
- v1은 `hydration 1.5` 환경(=구버전), v2는 `1.0` 환경(=현행). v2가 더 부드러워야 정상. **격차는 alarm이 아니라 예상되는 신호.**
- 기준 재정의: **격차 자체가 아니라 격차의 방향과 크기가 예상 모형과 일치하는가**가 검사 대상.

**B3 (P1).** §11 reachableContent KPI 표본 부족 의심.
- 직업당 100회로 발견 빈도 0.05 미만 콘텐츠(legendary 24, secretEnemy 26 일부)는 0~5건만 잡힘. 신뢰구간 너무 큼.
- 보완: legendary·secretEnemy·secretCombo 도달 빈도 측정은 별도 차수(직업당 200회 또는 통합 700회 합산) 검토.

**B4 (P3).** §10 `balanceFingerprint: "sha256:..."` 정의 모호.
- 파일 내용 sha256은 주석·공백 변경에 흔들림. 정렬된 BALANCE 객체 JSON.stringify의 sha256으로 정의 권고.

**결정:** 보완 후 재검토.

---

### 2.2 시스템 백승호 — 아키텍처 자기 비판

**S1 (P1).** §5.1 statTick과 게임 StatSystem 합성 누락.
- 게임 StatSystem은 BALANCE.stats만 쓰지 않는다. SeasonSystem(시즌 보정)·ContaminationSystem·DiseaseSystem·NightSystem(야간)의 합성 결과로 hydration/nutrition decay가 결정.
- 시뮬에서 statTick이 BALANCE.stats만 보면 K1이 게임과 어긋남 — 시즌별 폭염 +60%, 겨울 한파 -20% 등의 보정이 사라짐.
- 보완: statTick.mjs는 base decay만 계산, ctx에 SeasonSystem·NightSystem 결과 결합. 또는 각 엔진이 statTick의 입력을 갱신하는 chain 모델.

**S2 (P1).** Phase 1~2 분리의 함정.
- Phase 1 산출(4직업 + engines 3)의 K1은 quality·companion·fishing 미반영이라 **게임과 큰 격차.**
- 이 단계 결과가 baseline으로 외부에 인용되면 잘못된 데이터로 결정 발생.
- 보완: Phase 1 산출물에 "INCOMPLETE" 마커 의무. baseline 라벨은 Phase 2 완료 시점에만 부여.

**S3 (P1).** §3 mocks/eventBus.mjs noop 문제.
- HospitalSiegeSystem은 `EventBus.on('tpAdvance', ...)` 구독으로 동작 (`SYS_REVIEW_event_polling_audit.md` § 2.4 검증).
- mock이 noop이면 tpAdvance가 emit 안 되므로 HospitalSiegeSystem 한 번도 안 깨어남. **`hospitalSiege` 이벤트 시뮬 0건 발생** — 잘못된 baseline.
- 보완안 2가지:
  - (a) **in-memory EventBus**로 mock 대체 — 실제 게임의 `js/core/EventBus.js`를 그대로 import해서 시뮬 runner가 emit 직접 호출.
  - (b) eventCalendar.mjs가 hospitalSiege도 중앙에서 트리거, HospitalSiegeSystem 우회.
- 결정: (a) 권고. EventBus는 game-side에서 이미 모듈화돼 있음.

**S4 (P1).** §13 PR 일정 모순.
- "PR1 머지 시점에 § 9 단위 검사 첫 2건도 함께"이지만 PR1에 engines 없음 (engines는 PR2). statTick.test가 statTick.mjs 부재로 실행 불가.
- 보완: PR1+PR2 합치거나 단위 검사를 PR2로 이관.

**S5 (P3).** §7.1 drift detection Proxy 호환성.
- BALANCE를 Proxy로 감싸려면 모든 import 경로에서 Proxy 객체를 반환해야 함. 단순 wrapper로 안 됨. ESM dynamic import에서 호환성 검증 필요.
- Phase 0 spike 1일에 결정.

**결정:** 보완 후 재검토.

---

### 2.3 PD 김재훈 — 일정·트레이드오프

**P1 (P1).** §13 PR4 비대.
- 9 engines + 4 reporters + drift.mjs = 한 PR에 과다.
- 분할: PR4a (engines 9) D+8, PR4b (reporters 4 + drift) D+10.

**P2 (P1).** PR 의존 모순 (S4와 동일).

**P3 (P1).** Phase 1 부분 baseline 외부 인용 금지 명시 부재.
- 본 검토 §1 "보완" 등록.

**P4 (P2).** Phase 0 spike 1일 신설.
- §12 R3 (drift Proxy)·R5 (EventBus mock) 두 위험을 Phase 1 진입 전에 결정해야 일정 사고 방지. M1 D+0~D+1에 spike 할당 권고.

**결정:** 보완 후 재검토. 일정 분할·spike 신설로 12일 일정은 유지 가능.

---

### 2.4 Director 서민호 — 비전·게이트

**D1 (의견).** §4 chef privileges null은 정상.
- 6직업 비대칭 해소(이슈 2)는 시뮬 v2와 분리. 시뮬 v2는 chef privileges 없는 상태로 baseline 측정. 그 결과로 chef 격차가 5%p 초과면 이슈 2 작업의 근거 데이터로 사용.

**D2 (P2).** 카드 표현 일관성 측정 한계 명시 부족.
- §11 "카드 표현 일관성 (reporter eventOverlap의 카드 카테고리)"으로 위임됐지만 시뮬은 카드를 그리지 않으므로 측정 가능한 것은 "이벤트 카테고리별 발화 횟수"뿐. "한 카드가 너무 많은 의미를 운반하는가"는 측정 불가.
- 보완: §11 위임 문구를 "이벤트 카테고리별 발화 횟수만 시뮬 측정. 카드 시각·의미 태그 측면은 AD 트랙 별도"로 명확화.

**결정:** 통과 (D2 문구 보완 조건).

---

### 2.5 시나리오 한도연 — 분기·NPC

**N1 (P1).** §4 chef startInv 추정값 사용.
- 시뮬v2 `canned_food: 2, water_bottle: 1, knife: 1` 임의 채움. characters.js chef abilities effect에 startingItems 명시 없음 — 다른 5직업(doctor, soldier, firefighter, homeless, engineer)과 다른 패턴.
- 보완: characters.js chef의 startingItems 정식 정의가 어디 있는지 확인 (CharCreate.js 또는 게임 시작 로직). 없으면 시나리오·설정 합동으로 정식 정의 후 시뮬 import.

**N2 (P2).** 메인 퀘스트 trigger 모델링 부재.
- §5에 questSystem 엔진 없음. baseline에서 chef는 메인 퀘스트 39개 진행 trace 없이 단순 생존만 측정.
- chef 정체성 "남대문 급식소"는 메인 퀘스트로 표현되는데 시뮬에서 빠짐. K1만으로 평가하면 chef 직업의 진짜 가치는 측정 불가.
- 보완: questSystem 엔진을 Phase 2에 추가하거나, 명시적으로 "퀘스트 trace는 시뮬 v2 범위 외, 별도 트랙"을 §11 위험에 등록.

**N3 (P2).** §10 schema deathCause만 trace.
- 게임의 24 엔딩 중 death 10·milestone·escape·character 4 카테고리. 100일 시뮬은 character·escape 엔딩 도달 시간 부족할 가능성.
- 보완: schema에 `endingCategory: 'death' | 'milestone' | 'escape' | 'character' | null` 필드 명시. null이면 100일 도달했지만 엔딩 트리거 미충족.

**결정:** 보완 후 재검토.

---

### 2.6 설정 이수정 — 어휘 톤

**L1 (P1).** 7직업 한국어 이름 글로서리 미등록.
- 시뮬v2 §4와 sim_firefighter_300days.mjs §1에 박영철·이지수·강민준·최형식·한소희·정대한·윤재혁 7명 사용.
- `LORE_GLOSSARY.md` v0.1 §3는 직업 코드 ID와 한국어 직책만 등록. **인물 이름 7개 미등록.** 본 페르소나 신념 §1(등록 안 된 어휘 본문 사용 거절)을 시뮬 v2 설계서 자체가 위반.
- 보완: `LORE_GLOSSARY.md` v0.2에 §3.5 "정식 캐릭터 이름" 추가. characters.js와 sim 양쪽 검수.

**L2 (확인).** chef 이름 "윤재혁" — characters.js 266행과 일치. ✓

**결정:** 보완 후 재검토 (L1 글로서리 갱신 후 통과).

---

### 2.7 레벨 조윤성 — 25구·이동

**V1 (P1).** §4 chef startDistrict junggoo (dangerLevel 3) 격차.
- 7직업 시작 dangerLevel 분포:
  - eunpyeong 1 (firefighter)
  - dongjak 2 (doctor) — 하지만 보라매병원·국립현충원이 있는 구
  - dobong 1 (soldier)
  - yangcheon 1 (homeless)
  - gwanak 2 (pharmacist)
  - nowon 2 (engineer)
  - **junggoo 3 (chef) — 유일하게 3등급 시작**
- 다른 직업과 시작 환경 비대칭. K1 격차 5%p 사수에 직접 영향. chef는 같은 능력치라도 시작 위험도가 더 높아 사망률 상승.
- 보완안 3가지:
  - (a) characters.js의 chef.homeDist를 다른 구로 변경 (게임 변경 필요 — 큰 결정).
  - (b) 시뮬 baseline에서 chef startDistrict를 다르게 세팅 (게임과 어긋남, 권장 안 함).
  - (c) 그대로 유지하고 K1 격차 표에 "chef는 시작 위험도 +1" 주석. 격차 5%p 초과 시 이 점을 분석에 반영.
- 권고: (c). 게임 정체성("남대문 급식소" 출발)이 우선. 단 baseline 보고서에 시작 환경 격차를 KPI 표기.

**V2 (P3).** §13 PR3 "characters 7직업"에 startDistrict 검증 항목 없음.
- 보완: 7직업 startDistrict가 districts.js에 존재하는지 단위 검사 추가.

**결정:** 통과 (V1 (c) 채택, V2 단위 검사 추가).

---

## 3. 횡단 발견 (PD 종합)

세 페르소나 이상이 짚는 항목.

| 발견 | 짚은 페르소나 | 분류 | 1차 책임 |
|------|---------------|------|----------|
| **§4가 characters.js 단일 진리 위반** | Balance(B1)·Scenario(N1)·Lore(L1)·Level(V1) 합산 4 | **P1** | 시스템 (설계서 §4 derive 패턴으로 재작성) |
| **§5 statTick + 합성 시스템 누락** | Balance(B2)·System(S1)·Scenario(N2) 3 | **P1** | 시스템 (엔진 chain 또는 ctx 보완) |
| **PR 일정 모순·비대** | System(S4)·PD(P1·P2) 2 | **P1** | 시스템·PD (일정 분할) |
| **EventBus mock 결정** | System(S3) 1 | **P1** | Phase 0 spike (D+0~D+1) |
| **글로서리 캐릭터 이름 미등록** | Lore(L1)·Scenario(N1) 2 | **P2** | 설정 이수정 (글로서리 v0.2) |
| **v1↔v2 격차 기준 재정의** | Balance(B2) 1 | **P2** | 밸런스 권지나 (기준 재작성) |

---

## 4. 필수 보완 6건 (PD 결정)

설계서가 v2로 재진입하려면 다음을 보완.

1. **§4 characters.js derive로 재작성.** 7직업 정의는 `import CHARACTERS from '../../js/data/characters.js'` 후 derive. 시뮬 측 maxHp·skills·startingItems 하드코딩 0건. 직업 고유 보정만 시뮬 보유 (예: `combatDmgWeapon`이 characters.js에 없으면 시뮬 default).
2. **§5 엔진 chain 모델 명시.** statTick·season·night·contamination·disease 합성 순서 명세. 또는 statTick의 ctx 매개변수에 합성 결과 입력.
3. **§13 PR 일정 분할.** PR1+PR2 합치거나 단위 검사 PR2 이관. PR4를 PR4a(engines)+PR4b(reporters+drift)로 분할. Phase 0 spike(D+0~D+1) 신설.
4. **§3 EventBus mock → in-memory bus.** 게임 `js/core/EventBus.js` 직접 import. mock noop 폐기.
5. **§7.3 v1↔v2 격차 기준 재정의.** 격차의 방향·크기가 예상 모형과 일치하는가 검사. 격차 자체는 alarm 아님.
6. **§10 + Phase 1 마커.** Phase 1 산출물에 "INCOMPLETE" 마커. baseline 라벨은 Phase 2 완료 시점에만. schema에 `endingCategory` 필드 추가.

---

## 5. 통과 가능 항목 (보완 후)

- 디렉터리 구조 (§3) — 그대로
- 7 설계 원칙 (§2) — 그대로
- drift detection 개념 (§7) — Proxy 호환성 spike 후 결정
- 출력 스키마 (§10) — `endingCategory` 필드만 추가
- chef startDistrict junggoo 그대로 — Level (c) 안 채택
- chef privileges null — 이슈 2 작업 별도

---

## 6. 후속 액션

| 작업 | 담당 | 데드라인 |
|------|------|----------|
| 시뮬 v2 설계서 v2 (보완 6건 반영) | 시스템 백승호 | M1 D+1 |
| `LORE_GLOSSARY.md` v0.2 (캐릭터 이름 7명 추가) | 설정 이수정 | M1 D+1 |
| Phase 0 spike (drift Proxy + EventBus 결정) | 시스템 백승호 | M1 D+0~D+1 |
| 재검토 회의 | PD 김재훈 주재 | M1 D+2 |

재검토 통과 시 PR1 진입. 미통과 시 v3 보완.

---

## 7. 최종 한 줄

설계서는 좋은 골격을 갖췄지만, **"단일 진리"라는 자기 원칙을 §4에서 부분 위반했고, EventBus mock noop이 hospitalSiege 이벤트를 통째로 누락시키며, PR 일정에 의존 모순이 있다.** 6건 보완 후 재진입.

---

*문서 끝. 보완안 v2 도착 시 본 검토 § 4 항목별 충족 여부만 재확인.*
