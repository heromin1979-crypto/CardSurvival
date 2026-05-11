# 시스템 — 27 시스템 SIM_SKIP 분류표

> 작성: 시스템 백승호 / 2026-05-11
> 대상: 시뮬 v2 PR2 진입 전 사전 산출 (`SYS_DESIGN_sim_v2_v2_1.md` §11 R1)
> 결정: **3 카테고리로 분류.** PR2는 BOOTSTRAP-READY 14개만 시도. UNCERTAIN 13개는 PR2.5에서 spike 후 결정. SKIP은 영구.

---

## 1. 분류 정의

| 카테고리 | 정의 |
|----------|------|
| **BOOTSTRAP** | 시뮬에서 즉시 init 가능. GameState만 변경, UI 의존 없음. PR2에서 활성화. |
| **UNCERTAIN** | DOM·window·Renderer·외부 카드 정의 의존 의심. 개별 spike 필요. PR2.5에서 결정. |
| **SKIP** | UI/오디오/튜토리얼 전용. 시뮬 baseline에 의미 없음. 영구 SKIP. |

---

## 2. 분류표 (27 + α 시스템)

`main.js:120~169`의 init 순서 기반.

| 라인 | 시스템 | 분류 | 사유 |
|------|--------|------|------|
| 120 | EndingSystem | BOOTSTRAP | tpAdvance 구독. 사망·엔딩 트리거. 시뮬 핵심 |
| 121 | StatSystem | BOOTSTRAP | 모든 스탯 decay. 핵심 중 핵심 |
| 122 | SeasonSystem | BOOTSTRAP | 시즌 보정값 제공 (StatSystem 의존) |
| 123 | DiseaseSystem | BOOTSTRAP | 감염 진행 |
| 124 | WeatherSystem | BOOTSTRAP | 날씨 → 시즌 효과 |
| 125 | NoiseSystem | BOOTSTRAP | 4 이벤트(raidEvents·hordeWaves·raiderEvents) 통합 진입점 |
| 126 | EcologySystem | UNCERTAIN | 자원 재생성. districts.js 의존 — UI 트리거 여부 검증 필요 |
| 128 | NPCSystem | UNCERTAIN | NPC 영입·trust. companions 배열 GameState 의존 |
| 129 | NPCRelationSystem | UNCERTAIN | trust·relations 갱신 |
| 130 | NPCGroupSystem | UNCERTAIN | NPC 그룹 동작 |
| 131 | NPCStorySystem | UNCERTAIN | NPC 스토리 분기 |
| 134 | OnboardingSystem | **SKIP** | UI 튜토리얼 전용. 시뮬에서 무의미 |
| 136 | DispatchSystem | UNCERTAIN | dispatch 환자 패시브 자원 — 응급실 의존 |
| 137 | GuardSystem | UNCERTAIN | 수비대 시뮬 — 응급실 의존, GameState 의존 |
| 140 | PatientIntakeSystem | UNCERTAIN | 응급실 환자 — flags.er_unlocked 의존 |
| 145 | HospitalSiegeSystem | BOOTSTRAP | tpAdvance·siegeResolved 구독. _unsubscribeAll 검증됨 |
| 147 | MentalSystem | UNCERTAIN | 정신 시스템. UI dialog 트리거 가능성 |
| 148 | BodySystem | BOOTSTRAP | 부상·체력 |
| 150 | ContaminationSystem | BOOTSTRAP | 오염 자원 처리 |
| 151 | EncumbranceSystem | UNCERTAIN | 적재 — board·inv 의존 |
| 152 | CraftSystem | UNCERTAIN | 제작 — board·UI dialog 의존 |
| 153 | CombatSystem | UNCERTAIN | 전투 — 전투 화면(Combat.js) 의존? 또는 자체 동작? |
| 154 | FishingSystem | BOOTSTRAP | 낚시. tpAdvance 구독, districts hasFishing 의존 |
| 155 | ExploreSystem | UNCERTAIN | 탐색 — board·UI 의존 |
| 156 | SkillSystem | BOOTSTRAP | 스킬 XP. 순수 GameState 변경 |
| 157 | BasecampSystem | UNCERTAIN | 베이스캠프 — UI·구조물 의존 |
| 158 | QuestSystem | BOOTSTRAP | 일반 퀘스트 진행 |
| 160 | SoundSystem | **SKIP** | 오디오 |
| 161 | BGMSystem | **SKIP** | 배경음 |
| 162 | HiddenElementSystem | UNCERTAIN | 히든 로케이션 발견 — board·UI 의존 |
| 163 | TrapSystem | BOOTSTRAP | 함정 |
| 168 | SubwaySystem | UNCERTAIN | 지하철 이동 — UI 의존 |
| 169 | NightSystem | BOOTSTRAP | 야간 처리 (sleep quality 등) |
| 189 | NPCQuestSystem | UNCERTAIN | NPC 퀘스트 진행 |
| — | CinematicScene | **SKIP** | UI 컷씬 |

---

## 3. 카테고리 통계

| 카테고리 | 수 | 시스템 |
|----------|----|----|
| **BOOTSTRAP** (즉시 활성화) | **14** | EndingSystem, StatSystem, SeasonSystem, DiseaseSystem, WeatherSystem, NoiseSystem, HospitalSiegeSystem, BodySystem, ContaminationSystem, FishingSystem, SkillSystem, QuestSystem, TrapSystem, NightSystem |
| **UNCERTAIN** (spike 후 결정) | **17** | EcologySystem, NPCSystem, NPCRelationSystem, NPCGroupSystem, NPCStorySystem, DispatchSystem, GuardSystem, PatientIntakeSystem, MentalSystem, EncumbranceSystem, CraftSystem, CombatSystem, ExploreSystem, BasecampSystem, HiddenElementSystem, SubwaySystem, NPCQuestSystem |
| **SKIP** (영구) | **4** | OnboardingSystem, SoundSystem, BGMSystem, CinematicScene |

분류표 §2 총 35 항목 중 BOOTSTRAP 14 + UNCERTAIN 17 + SKIP 4 = 35. ✓

---

## 4. PR2 진입 결정

### 4.1 PR2 범위 (조정)
**BOOTSTRAP 14개만 활성화.** systemBootstrap.mjs의 1차 버전.

UNCERTAIN 16개는 PR2.5 spike에서 시스템별 개별 검증.

### 4.2 위험 (Risk)
- **R1.** BOOTSTRAP 14개도 GameState reset 헬퍼 없이는 회차 사이 누수 가능. PR2에서 reset 헬퍼 신설.
- **R2.** HospitalSiegeSystem은 flags.er_unlocked 의존 — 시뮬 GameState에 flags 초기값 보강 필요.
- **R3.** FishingSystem은 districts.hasFishing 의존 — districts.js 그대로 import. 검증 통과 예상.

### 4.3 baseline 결과 신뢰도
PR2 종료 시점 baseline은 BOOTSTRAP 14개 기준. UNCERTAIN 16개 모델링 누락 시 **K1 격차 발생 가능.** PR3 진입 전 UNCERTAIN 분류 해소 권고.

---

## 5. PR2.5 spike 절차 (UNCERTAIN 16개)

각 UNCERTAIN 시스템에 대해 다음 절차.

1. **import 시도** — 시뮬 환경에서 module load 성공 여부.
2. **init() 호출** — DOM·window 의존성 fail 여부.
3. **단일 TP emit** — tpAdvance 1회 발화 후 GameState 정상 변경 여부.
4. **회차 사이 reset** — _unsubscribeAll() 등 cleanup 메서드 존재 여부.

결과:
- 4단계 모두 통과 → BOOTSTRAP으로 승급. systemBootstrap.mjs 추가.
- 3단계 통과(reset 메서드 부재) → BOOTSTRAP 가능하나 globalShim 보강 또는 시뮬 측 reset 신설.
- 1~2단계 fail → SKIP으로 강등. baseline 신뢰도에 명시.

---

## 6. 후속

| 작업 | 담당 | 데드라인 |
|------|------|----------|
| systemBootstrap.mjs (BOOTSTRAP 14개) | 시스템 백승호 | PR2 D+2 |
| drift.mjs (Proxy spike 코드 그대로) | 시스템 백승호 | PR2 D+2 |
| 단위 검사 3건 | 시스템 백승호 | PR2 D+3 |
| PR2.5 — UNCERTAIN 16개 spike | 시스템 백승호 | PR3 진입 전 |

---

*문서 끝. PR2 보고서에서 BOOTSTRAP 14개 init 실측 결과 보고.*
