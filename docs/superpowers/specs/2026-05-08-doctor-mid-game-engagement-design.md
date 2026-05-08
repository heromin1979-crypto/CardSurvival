# 이지수(doctor) 초중반 몰입 강화 디자인

**작성일:** 2026-05-08
**대상 캐릭터:** 의사 (이지수)
**범위:** Day 1~70 의사 플레이 흐름의 목적 부여 강화 (Push)
**후속 작업 분리:** Pull 강화(세계 능동 이벤트), 다른 직업 사이드 퀘스트 풀, 환자 시스템과 메인 퀘스트 직접 연결은 별도 스코프

---

## 1. 진단

### 사용자가 보고한 통증
1. 초반 생존이 막막함 — "어떻게 살아남아야 할지 잘 모르겠음"
2. **응급실 환자 회복(특히 군인 환자) 직후부터 길을 잃은 느낌** — 가장 중요한 통증
3. 메인 퀘스트 설명이 추상적이라 "어떤 걸 어디서 어떻게 해야 하는지" 구체적 설명이 없어 목적 부여가 안 됨

### 코드 사실 확인
- 의사 메인 퀘스트 11개: Day 1(식량 3) → Day 3(거점) → Day 7(물 5) → Day 12(의료품 5) → Day 20(서대문) → Day 35(구급상자 2) → Day 55(영등포 KBS) → Day 70(100일 생존) → 야전병원 → 백신
- 메인 퀘스트 사이 간격이 큼 (Day 12 → 20 → 35 → 55) — 그 사이 행동을 견인할 사이드 목표 부재
- 퀘스트 desc는 문학적 묘사 위주 (예: `mq_doctor_03` "안전한 거점이 필요하다. 구조물을 세워야 한다") — **무엇을 어디서 어떻게**가 빠짐
- 별도 QuestPanel UI 파일 없음 — 활성화 알림이 토스트로만 나가고 영구 표시 영역 부재 (`js/ui` 디렉토리 그렙으로 확인)
- PatientIntakeSystem(Day 3+ 환자 유입)은 잘 작동하지만 메인 퀘스트와 직접 연결 로직 없음

### 진단 분기 (사용자와 합의)
- 통증의 정체 = "다음에 뭐 할지 모름" + "퀘스트 설명이 추상적이라 목적 부여가 안 됨" → **정보/UX + 콘텐츠 구체성 문제**
- 처방 방향 = **Push 강화 우선** (Pull 이벤트는 후속)
- 채택 안 = 안 B (텍스트 강화 + DailyFocusSystem + 사이드 퀘스트 풀 + 퀘스트 패널 3계층)

---

## 2. 시스템 아키텍처

### 핵심 컴포넌트 3개 + 데이터 확장

```
┌─────────────────────────────────────────────────────────────┐
│  DailyFocusSystem (신규) — 매일 추천 행동 1~2개 생성        │
│   ├─ 입력: 활성 메인퀘스트.subObjectives, 환자 상태,         │
│   │        자원 부족 신호, 진행 중 사이드퀘스트              │
│   ├─ 우선순위: 임박 데드라인 > 막힌 메인퀘 > 환자 위험 …    │
│   └─ 출력: GameState.dailyFocus = [{ text, source, action }] │
│                                                              │
│  SidequestSystem (신규) — 환자 케이스 등에서 자연 발생       │
│   ├─ 트리거: PatientIntakeSystem.npcAdmitted/npcHealed 등    │
│   ├─ 풀: data/sidequests.js (의사용 5~7개 시작)              │
│   └─ 메인 퀘스트와 동일한 objective 타입 재사용              │
│                                                              │
│  QuestPanel UI (신규) — 3계층 표시                           │
│   ├─ 현재 활성 (1~2): 펼침 + subObjectives 체크리스트        │
│   ├─ 다음 예정 (1~2): 접힘 + 트리거 조건 미리보기            │
│   └─ 잠긴 미래 (3~4): 흐릿 + 제목/아이콘만                   │
│                                                              │
│  데이터 확장:                                                │
│   ├─ mainQuests.js: subObjectives, locationHint, actionHint │
│   └─ sidequests.js (신규): 사이드 퀘스트 정의                │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 설계 원칙
- **비강제:** DailyFocus는 추천일 뿐. 무시해도 페널티 없음 (sandbox 매력 유지)
- **메인 우선:** 사이드 퀘스트는 메인 퀘스트와 자원/위치/시점 충돌 회피. 가끔 메인 진행 보조
- **데이터 모델 일관:** 메인/사이드/DailyFocus 모두 `objective.type` 같은 매칭 모델 공유

### 파일 변경 범위
- 신규: `js/systems/DailyFocusSystem.js`, `js/systems/SidequestSystem.js`, `js/data/sidequests.js`, `js/ui/QuestPanel.js`, `js/ui/DailyFocusWidget.js`
- 수정: `js/data/mainQuests.js`, `js/data/mainQuests/doctor.js` (+ shared/branch_a/branch_b/index), `js/data/validate.js`, 좌사이드바 컴포넌트, `js/core/GameState.js` (dailyFocus 필드)

---

## 3. 데이터 구조

### 3.1 mainQuest 스키마 확장

기존 필드(`id, title, desc, icon, characterId, dayTrigger, prerequisite, objective, reward, failPenalty, deadlineDays, narrative`)는 모두 유지. 아래 3개 필드를 **선택적**으로 추가.

```js
mq_doctor_03: {
  // ... 기존 필드 유지 ...

  locationHint: {
    districtId: 'gangnam',
    landmarkId: 'samsung_hospital',  // 선택
    note: '응급실 정수기 또는 빗물 받기'
  },

  subObjectives: [
    { id: 'so_01', text: '응급실 정수기에서 물 받기', hint: 'water_purifier 카드 사용' },
    { id: 'so_02', text: '빗물받이 구조물 제작', hint: 'rainwater_collector 레시피' },
    { id: 'so_03', text: '깨끗한 물 5개 인벤토리에 보관', hint: '오염도 0 상태' }
  ],

  actionHint: '강남(현재 구역) 응급실 정수기를 활용하거나, 비 오는 날 빗물받이를 세워라.'
}
```

**subObjective 자동 체크 매칭 규칙:**
- 모든 `objective.type` (`collect_item`, `collect_item_type`, `craft_item`, `visit_district`, `survive_days`, `build_structure`)에 대해 진행도가 변할 때 매칭되는 subObjective 자동 체크
- 타입별 매칭 함수는 `js/systems/QuestSystem.js`에 `_matchSubObjective(subObj, objective, state)` 디스패처로 추가
- 매칭 키는 subObjective의 선택적 `match` 필드(예: `{ type: 'craft', recipeId: 'rainwater_collector' }`). 없으면 자동 체크 안 함, 표시만

### 3.2 sidequest 스키마 (신규)

```js
sq_patient_family: {
  id: 'sq_patient_family',
  title: '환자의 부탁',
  icon: '💌',

  trigger: {
    event: 'npcHealed',                     // PatientIntakeSystem이 emit하는 이벤트
    condition: { patientType: 'soldier_*' } // 와일드카드 매칭
  },

  parentMainQuest: null,                    // 메인 연관 시 ID 지정
  objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },

  desc: '치료받은 군인이 가족 안부를 부탁한다. 용산 미군기지에 다녀와라.',
  locationHint: { districtId: 'yongsan', note: '미군기지 게시판 확인' },

  reward: { morale: 8, items: [{ definitionId: 'military_ration', qty: 2 }] },
  expiresInDays: 7,
  optional: true   // 만료해도 페널티 없음
}
```

### 3.3 GameState.dailyFocus 형식

```js
[
  {
    text: '깨끗한 물 5개 비축 (2/5)',
    source: 'mq_doctor_03',
    sourceType: 'main',          // main | patient | resource | sidequest
    priority: 75,
    action: 'craft:rainwater_collector'  // 클릭 시 자동 라우팅용 (선택)
  }
]
```

### 3.4 i18n
- `subObjectives[].text`, `subObjectives[].hint`, `actionHint`, `locationHint.note` 모두 한글 기본 + 영문 페어(`textEn`, `hintEn` 등)
- 사이드 퀘스트 정의도 동일

### 3.5 검증 (`js/data/validate.js`)
- 신규 필드 스키마 검증
- 사이드 퀘스트의 `parentMainQuest` 참조 무결성
- `trigger.event`가 EventBus에 등록된 이벤트인지 검증
- subObjective ID 중복 검증

---

## 4. DailyFocusSystem 우선순위 알고리즘

### 4.1 호출 시점
- 매일 아침 (수면 종료 → 새 day 시작 직후, `dayStarted` 이벤트)
- 즉시 재계산 트리거: `mainQuestActivated`, `mainQuestCompleted`, `npcAdmitted`, `npcHealed`, `patientDied`, `deadlineApproaching`
- (선택) 사이드바 새로고침 버튼 — 다음 후순위 1개로 교체

### 4.2 입력 신호 5종

| 신호 | 출처 | 산출 |
|------|------|------|
| 활성 메인 퀘스트의 미완료 subObjective | QuestSystem | 각 subObj당 priority candidate |
| 진행 중 사이드 퀘스트의 진행도 | SidequestSystem | priority candidate |
| 응급실 환자 상태 (HP, 잔여 TP) | PatientIntakeSystem | 위험도별 candidate |
| 자원 부족 (식량/물/체온/사기) | StatSystem + 인벤토리 | 임계 미만일 때 candidate |
| 데드라인 임박 (D-3 이내) | QuestSystem.deadlineDays | priority +30 보너스 |

### 4.3 우선순위 점수

```
priority = basePriority + urgencyBonus + recencyBonus + jobBonus
```

| 카테고리 | basePriority |
|----------|--------------|
| 메인 퀘스트 데드라인 D-1 | 95 |
| 환자 HP < 30 또는 곧 사망 | 90 |
| 메인 퀘스트 데드라인 D-3 | 80 |
| 활성 메인 퀘스트 다음 subObj | 70 |
| 자원 임계 (식량 < 2일분 등) | 65 |
| 환자 입원 중 (덜 위급) | 55 |
| 사이드 퀘스트 다음 단계 | 50 |
| 장기 준비 (다음 메인 트리거 D-2) | 40 |

- **urgencyBonus:** 데드라인까지 일 수에 반비례 (D-2 → +20, D-5 → +10, D-10 → +0)
- **recencyBonus:** 같은 항목이 어제도 추천됐고 진행도 변화 없으면 -10
- **jobBonus:** 자기 직업 특화 신호에 +5 (의사 → 환자 신호 +5)

### 4.4 선정 규칙
- 최대 2개 표시
- 다양성 강제: 1개는 메인 계열, 1개는 비메인(환자/자원/사이드) 우선. 단 priority ≥ 90이면 다양성 무시 (긴급 우선)
- 동률은 메인 > 환자 > 자원 > 사이드 순

### 4.5 구현 윤곽

```js
// js/systems/DailyFocusSystem.js
const DailyFocusSystem = {
  _focus: [],
  init() {
    EventBus.on('dayStarted', () => this.recompute());
    EventBus.on('mainQuestActivated', () => this.recompute());
    EventBus.on('npcAdmitted', () => this.recompute());
    EventBus.on('npcHealed', () => this.recompute());
    EventBus.on('patientDied', () => this.recompute());
    EventBus.on('patientLeft', () => this.recompute());
    EventBus.on('deadlineApproaching', () => this.recompute());  // QuestSystem이 신규 emit
  },
  recompute() {
    const candidates = [
      ...this._collectMainQuestCandidates(),
      ...this._collectPatientCandidates(),
      ...this._collectResourceCandidates(),
      ...this._collectSidequestCandidates(),
    ];
    this._focus = this._selectTopWithDiversity(candidates, 2);
    GameState.dailyFocus = this._focus;
    EventBus.emit('dailyFocusChanged', { focus: this._focus });
  },
  // ...
};
```

---

## 5. UI

### 5.1 화면 레이아웃 (1920×1080)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HeaderBar — 시간/날짜/온도/날씨 (기존 유지)                               │
├──────────┬───────────────────────────────────────────────┬───────────────┤
│          │                                                │               │
│ 좌사이드 │           BoardRenderer (보드 본체)            │  우사이드바   │
│   바     │                                                │   (NPCPanel)  │
│ ┌─────┐  │                                                │               │
│ │📌 추천│  │   ★ 신규 DailyFocusWidget                     │               │
│ └─────┘  │                                                │               │
│ ┌─────┐  │                                                │               │
│ │🎯퀘스트│  │   ★ 신규 QuestPanel                          │               │
│ └─────┘  │                                                │               │
│  Stat HUD                                                  │               │
└──────────┴───────────────────────────────────────────────┴───────────────┘
```

좌사이드 선택 이유: 우사이드 NPCPanel은 동반자 UI로 무거워지고, 헤더는 기존 정보로 포화. 좌사이드가 비교적 여유.

### 5.2 DailyFocus 위젯

```
┌─────────────────────────────────┐
│ 📌 오늘의 추천            ⓧ  ⟳ │
├─────────────────────────────────┤
│ ★ 깨끗한 물 5개 비축 (2/5)      │  메인, 노란점
│   응급실 정수기 활용             │
├─────────────────────────────────┤
│ ⚠ 환자 김OO HP 65 — 해열제      │  환자, 빨간점
│   해열제 카드를 환자에게         │
└─────────────────────────────────┘
```

- 항목 클릭 → 관련 모달/카드 자동 포커스
- 색 코드: D-1 빨강 / D-3 주황 / 일반 노랑 / 사이드 회색
- 항목별 X 버튼 → 오늘은 숨김 (다음 날 재등장)

### 5.3 퀘스트 패널 3계층

```
┌─────────────────────────────────┐
│ 🎯 퀘스트                       │
├─────────────────────────────────┤
│ ▼ 무전의 신호  📻  D+18 (7일후) │  현재 활성 (펼침)
│   안전한 거점에서 신호를 잡았다.│
│   다음 행동:                     │
│   ☑ 응급실 정수기 활용 (1회 완료)│
│   ☐ 빗물받이 제작                │
│   ☐ 깨끗한 물 5개 보관 (2/5)    │
│   📍 강남 / 응급실               │
│                                  │
│ ▶ 환자의 부탁 [사이드] D+5      │  사이드 (접힘)
├─────────────────────────────────┤
│ 다음                             │
│ · 여정의 준비  💊  Day 12 시작  │  prerequisite 충족 직전
├─────────────────────────────────┤
│ 잠긴 미래 (3개) ⌄                │  클릭 시 흐릿 카드 펼침
└─────────────────────────────────┘
```

- "다음" 영역: prerequisite 충족 + dayTrigger 임박한 퀘스트 1~2개 미리보기 (제목/아이콘/시작일만)
- "잠긴 미래": 캐릭터의 모든 메인 퀘스트 중 prerequisite 미충족 — 제목과 아이콘만 흐리게 (스포일러 방지: desc는 가림)
- subObjective는 체크박스. 완료 시 자동 체크 (objective 매칭). 매칭 불가 단계는 자동 체크 없음

### 5.4 지도/위치 힌트
- `locationHint.districtId` → SeoulMapModal에 핀 아이콘 표시
- LandmarkModal 진입 시 메인 퀘스트의 `locationHint.landmarkId`와 일치하면 "관련 퀘스트" 배지

### 5.5 알림 (기존 토스트 유지 + 강화)
- 퀘스트 활성화: 기존 토스트 + 좌사이드 퀘스트 영역에 노란 점 펄스 (3초)
- subObjective 완료: 1줄 토스트 ("☑ 빗물받이 제작 완료")
- 데드라인 D-2 진입: 빨간 토스트 + DailyFocus 자동 갱신

### 5.6 모바일 (Capacitor)
- 1920×1080 고정 스케일이라 그대로 동작
- 좌사이드 좁아지면 DailyFocus 1개 + "더 보기" 토글

### 5.7 디자인 시스템 준수
- 색·타이포·간격은 `DESIGN.md` + `css/variables.css` 토큰 사용
- 신규 컴포넌트: `js/ui/DailyFocusWidget.js`, `js/ui/QuestPanel.js`
- 좌사이드바 기존 슬롯 구조에 삽입 (사이드바 페르소나 가이드 준수)

---

## 6. 페이즈 분할 (~8일)

각 페이즈 끝에서 머지 가능한 단위.

### Phase 0 — 데이터 스키마 + 검증 (1일)
- 의사 11개 메인 퀘스트에 `subObjectives`, `locationHint`, `actionHint` 채움
- `js/data/sidequests.js` 스키마 정의 (데이터는 Phase 3)
- `js/data/validate.js` 검증 추가
- **머지 기준:** validate 통과, 게임 동작 변화 0

### Phase 1 — 퀘스트 패널 UI (2일)
- `js/ui/QuestPanel.js` 신규 — 3계층 렌더링
- subObjective 체크리스트 자동 체크 (objective.type별 매칭)
- 좌사이드바 슬롯에 마운트
- **머지 기준:** 의사 새 게임 → Day 1~12 진행 → 활성 퀘스트와 subObjective 정확히 표시, 진행 시 체크박스 자동 토글

### Phase 2 — DailyFocusSystem (2일)
- `js/systems/DailyFocusSystem.js` 신규
- 후보 수집 4종(메인/환자/자원/사이드 placeholder), 우선순위 + 다양성
- `js/ui/DailyFocusWidget.js`
- `GameState.dailyFocus` 직렬화 (저장/로드 호환)
- **머지 기준:** Day 1~30 의사 플레이에서 항상 1~2개 표시, 데드라인 D-2 진입 시 자동 우선순위 상승

### Phase 3 — SidequestSystem + 사이드 퀘스트 5~7개 (2일)
- `js/systems/SidequestSystem.js` 신규
- 의사 사이드 퀘스트 5~7개 작성:
  1. 환자 가족 안부 (군인 환자 치료 후, 용산 방문)
  2. 의약품 부족 신호 (환자 2명 누적 후, 항생제 3개 제작)
  3. 응급실 폐기물 처리 (Day 10+, 보드 정리)
  4. 무전 신호 추적 (Day 8 자동, 새 구역 노출)
  5. 부상 동반자 케어 (NPC 영입 + HP < 50)
  6~7. 메인 공백 채우기 (Day 14, Day 25 트리거)
- 퀘스트 패널에 사이드 슬롯 추가
- **머지 기준:** Day 1~30 의사 플레이에서 사이드 2~4개 자연 발생, 메인 진행을 가리지 않음

### Phase 4 — 폴리시 + 검증 (1일)
- `locationHint.districtId` → SeoulMapModal 핀
- 데드라인 D-2 빨간 토스트 + DailyFocus 갱신
- 디버그 패널에 DailyFocus 후보/점수 출력 (튜닝용)
- 의사 캐릭터 Day 1~70 풀 플레이테스트 1회
- **머지 기준:** 검증 체크리스트 통과

---

## 7. 검증 체크리스트

### 기능 검증
- [ ] 의사 새 게임 → Day 1 시작 시 DailyFocus 1개 이상 표시
- [ ] 메인 퀘스트 11개 각각 활성화 시 subObjective 패널에 표시
- [ ] subObjective가 objective 진행에 따라 자동 체크
- [ ] 데드라인 D-1 진입 시 priority 90+로 상승, 빨간 표시
- [ ] 환자 HP < 30 → DailyFocus에 환자 항목 자동 등장
- [ ] 사이드 퀘스트 expiresInDays 경과 시 자동 만료, 패널에서 사라짐
- [ ] DailyFocus X 버튼 → 오늘은 숨김, 다음 날 재등장
- [ ] 저장/로드 시 활성 사이드 퀘스트 + DailyFocus 상태 보존

### 통증 해결 검증 (직접 플레이)
- [ ] Day 12~20 사이에 "다음에 뭐 할지" 명확함 (DailyFocus가 항상 답을 줌)
- [ ] 메인 퀘스트 desc 읽으면 "어디서 / 어떻게" 짚을 수 있음 (locationHint + actionHint)
- [ ] 사이드 퀘스트가 자연스럽게 발생해 "세계가 살아있다" 감 부여
- [ ] 군인 회복 같은 핫 모먼트가 사이드 퀘스트로 이어져 동기 지속

### 데이터 검증
- [ ] `node --input-type=module js/data/validate.js` 통과
- [ ] 기존 저장 파일 호환 (마이그레이션: dailyFocus = [] 기본값)

### 비강제 원칙 검증
- [ ] DailyFocus 무시한 채 임의 행동해도 페널티 없음
- [ ] 사이드 퀘스트 만료해도 메인 진행 영향 없음

---

## 8. 위험과 대응

| 위험 | 완화책 |
|------|--------|
| DailyFocus가 강요처럼 느껴짐 | 카피 "추천", X 버튼, 무시 시 페널티 0. Phase 4에서 직접 플레이로 체감 검증 |
| 사이드 퀘스트가 메인 가림 | 다양성 강제(메인 1 + 비메인 1), 사이드 base 50 → 메인 base 70 보장 |
| subObjective 자동 체크 오작동 | objective.type별 매칭 함수 분리 + validate.js 검증 |
| 콘텐츠 작성 부하 폭주 | Phase 3에서 사이드는 의사 5~7개로 제한. 다른 직업은 별도 후속 |
| 좌사이드 영역 부족 | DailyFocus 최대 2 + 활성 퀘스트 1만 펼침. 잠긴 미래는 접힘 기본 |

---

## 9. 후속 단계 (별도 스코프)

- 다른 5개 직업(soldier/firefighter/homeless/chef/engineer)의 사이드 퀘스트 풀 (각 5~7개)
- Pull 강화 — 무작위 이벤트, NPC 동반자 자발 코멘트
- 메인 퀘스트와 환자 시스템의 직접 연결 (특정 환자 치료가 메인 퀘스트 진행에 카운트)
- DailyFocus 점수 상수 튜닝 (Phase 4 디버그 출력 기반)
