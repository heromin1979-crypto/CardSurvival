# Card Survival: Ruined City — 문서 인덱스

> 프로젝트 기획·설계·분석 문서 마스터 인덱스.
> 시뮬레이션 데이터는 `/simulation-data/`에서 별도 관리.

---

## 디렉토리 구조

```
docs/
├── README.md                                # 본 문서 (마스터 인덱스)
├── analysis/                                # 일반 분석 문서
├── archive/                                 # 옛 prompt_plan 보관
├── superpowers/                             # superpowers skill 산출물 (specs/plans)
└── milestones/                              # 마일스톤 트랙별 산출물
    └── 2026-05-10-persona-meeting/          # 페르소나 회의 트랙 (M0~M3)
        ├── README.md                        # 마일스톤 인덱스
        ├── 00-decisions/                    # PD·DIR 의사결정·마감 보고 (14)
        ├── 01-scenario/                     # 시나리오 기획 (10)
        ├── 02-system/                       # 시스템 설계·PR·검증 (19)
        ├── 03-ad-ui/                        # AD/UI (2)
        ├── 04-lore/                         # 설정·글로서리 (1)
        └── 05-audits/                       # 일반 감사 (2)
```

```
simulation-data/                             # 시뮬레이션 데이터 (별도 root)
├── README.md
├── baselines/
│   ├── plans/                               # 측정 계획 (2)
│   ├── reports/                             # 측정 보고서 (13)
│   └── raw/                                 # raw JSON (13)
└── tuning/                                  # 튜닝 결정 (1)
```

---

## 주요 문서 빠른 접근

### 프로젝트 최상위
- [`/CLAUDE.md`](../CLAUDE.md) — 프로젝트 가이드, AI 행동 규칙, 보드 레이아웃 룰, 5곳 등록 룰
- [`/DESIGN.md`](../DESIGN.md) — 디자인 시스템 (폰트·색상·간격·미적 방향)
- [`/prompt_plan.md`](../prompt_plan.md) — 현재 진행 트랙 체크리스트 (M3 종결, M4 진입 대기)

### ★ 기획 현황 종합 (최신)
- [`PLANNING_STATE.md`](./PLANNING_STATE.md) — **2026-05-13 기준 기획 현황 전체 요약** (게임 정체성·7직업·5곳 등록 룰·KPI 추세·페르소나 분담·M4 진입 작업)
- [`LAUNCH_ROADMAP.md`](./LAUNCH_ROADMAP.md) ★ — **2026-06-05 기준 출시 로드맵** (현재 상태 실측·남은 작업 6영역·Phase 일정·블로커·사용자 결정 항목)

### 마일스톤
- [`milestones/2026-05-10-persona-meeting/README.md`](./milestones/2026-05-10-persona-meeting/README.md) — **M0~M3 종결 트랙 인덱스 (49 산출물)**
- [`milestones/2026-05-10-persona-meeting/00-decisions/PD_MILESTONE_M3_close.md`](./milestones/2026-05-10-persona-meeting/00-decisions/PD_MILESTONE_M3_close.md) ★ — M3 마감 보고서 (마지노선 7건 충족 단언)

### 시뮬레이션 데이터
- [`/simulation-data/README.md`](../simulation-data/README.md) — baseline v1~v14 측정 데이터 인덱스

### 분석 문서
- [`analysis/CRAFT_DIVERSITY_ANALYSIS.md`](./analysis/CRAFT_DIVERSITY_ANALYSIS.md) — 크래프트 다양성 분석
- [`analysis/VISUAL_TARGET_GAP_ANALYSIS.md`](./analysis/VISUAL_TARGET_GAP_ANALYSIS.md) — 비주얼 타겟 갭 분석

### Superpowers
- [`superpowers/specs/2026-05-08-doctor-mid-game-engagement-design.md`](./superpowers/specs/2026-05-08-doctor-mid-game-engagement-design.md)
- [`superpowers/specs/2026-05-09-pageable-rows-design.md`](./superpowers/specs/2026-05-09-pageable-rows-design.md)
- [`superpowers/plans/2026-05-08-doctor-mid-game-engagement.md`](./superpowers/plans/2026-05-08-doctor-mid-game-engagement.md)

### Archive (옛 trace)
- [`archive/prompt_plan.old.md`](./archive/prompt_plan.old.md) ~ `prompt_plan.old5.md` — 옛 plan trace (CST 패턴 등)

---

## 작성 규칙

### 문서 분류 (페르소나 prefix)
| Prefix | 페르소나 | 산출물 |
|--------|---------|--------|
| `PD_` | PD 김재훈 | 의사결정·협의서·마일스톤 마감 |
| `DIR_` | Director | 게이트·검수 |
| `BAL_` | Balance 권지나 | 시뮬 결과·튜닝 |
| `SCN_` | Scenario 한도연 | 감사·퀘스트·PR |
| `SYS_` | System 백승호 | 설계·PR·리뷰·검증 |
| `AD_` | AD 오은별 | UI 리뷰·검증 |
| `LORE_` | Lore 이수정 | 글로서리·세계관 |

### 파일명 패턴
- `PD_HOTFIX_*` / `PD_BAL_MEETING_*_decision.md` / `PD_MILESTONE_*_close.md`
- `DIR_GATE_*.md` / `DIR_VERIFY_*.md`
- `BAL_SIM_baseline_v{N}_report.md` + `_result.json`
- `SCN_AUDIT_*.md` / `SCN_QUEST_*.md` / `SCN_PR_*.md`
- `SYS_DESIGN_*.md` / `SYS_PR{N}_*.md` / `SYS_REVIEW_*.md` / `SYS_VERIFY_*.md`
- `AD_REVIEW_*.md` / `AD_VERIFY_*.md`

### 새 마일스톤 추가 시
1. `docs/milestones/YYYY-MM-DD-<track-name>/` 신규 생성
2. 카테고리 prefix 폴더 (`00-decisions/`, `01-scenario/`, ...) 분리
3. `README.md`에 산출물 인덱스 + 마지노선 단언
4. 본 마스터 인덱스 갱신

---

*문서 끝. 새 트랙 진입 또는 산출물 분류 변경 시 본 문서 우선 갱신.*
