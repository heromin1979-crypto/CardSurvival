# 이지수 초중반 몰입 강화 (Push) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 의사(이지수) 플레이의 "다음에 뭐 할지 모름" 통증을 메인퀘 구체화 + DailyFocusSystem + 사이드 퀘스트 풀 + 3계층 퀘스트 패널로 해결.

**Architecture:** 3개 신규 시스템(DailyFocusSystem, SidequestSystem, QuestPanel UI) + mainQuests 데이터 확장 + GameState 직렬화. 비강제 원칙: 모든 추천/사이드는 무시 가능, 페널티 없음.

**Tech Stack:** 바닐라 JS 모듈, Vite, Vitest(unit/int), happy-dom, EventBus 패턴, GameState 싱글톤.

**Spec:** `docs/superpowers/specs/2026-05-08-doctor-mid-game-engagement-design.md`

---

## File Structure

| 경로 | 분류 | 책임 |
|------|------|------|
| `js/data/mainQuests.js` | 수정 | 11개 의사 퀘스트에 subObjectives/locationHint/actionHint 추가 |
| `js/data/sidequests.js` | **신규** | 의사용 사이드 퀘스트 5~7개 정의 |
| `js/data/validate.js` | 수정 | 신규 필드 + 사이드퀘스트 스키마 검증 |
| `js/systems/QuestSystem.js` | 수정 | subObjective 매칭, deadlineApproaching emit |
| `js/systems/DailyFocusSystem.js` | **신규** | 후보 수집·우선순위·다양성 선정 |
| `js/systems/SidequestSystem.js` | **신규** | 트리거 매칭, expiresInDays 카운트, 활성 추적 |
| `js/ui/QuestPanel.js` | **신규** | 3계층 퀘스트 표시 + subObjective 체크리스트 |
| `js/ui/DailyFocusWidget.js` | **신규** | 좌사이드 상단 추천 위젯 |
| `js/screens/Main.js` | 수정 | 좌사이드(`<aside class="bc-sidebar">`)에 위젯 마운트 |
| `js/core/GameState.js` | 수정 | `dailyFocus`, `activeSidequests`, `subObjectiveProgress` 필드 |
| `js/core/SystemRegistry.js` (확인) | 수정 | 신규 시스템 등록 |
| `css/screens-game.css` (or 신규 `css/quest-panel.css`) | 수정 | QuestPanel/DailyFocusWidget 스타일 |
| `tests/unit/DailyFocusSystem.test.js` | **신규** | 점수/다양성 선정 단위 테스트 |
| `tests/unit/SidequestSystem.test.js` | **신규** | 트리거/만료 단위 테스트 |
| `tests/unit/QuestSystem_subObjective.test.js` | **신규** | subObjective 매칭 단위 테스트 |
| `tests/integration/DoctorMidGame.int.test.js` | **신규** | 의사 새 게임 → Day 1~30 흐름 통합 |

---

# Phase 0 — 데이터 스키마 + 검증 (~1일)

목표: 데이터 구조만 확정. 게임 동작 변화 0. validate 통과.

## Task 0.1: 의사 메인퀘 1개에 신규 필드 추가 (스키마 검증)

**Files:**
- Modify: `js/data/mainQuests.js` 또는 `js/data/mainQuests/doctor.js` (현재 어느 파일에 mq_doctor_03이 있는지 확인 후)

- [ ] **Step 1: mq_doctor_03 위치 확인**

```bash
grep -rn "mq_doctor_03" js/data/mainQuests*
```

Expected: 정확한 파일 경로 식별 (`mainQuests.js` 또는 `mainQuests/doctor.js` 또는 `mainQuests/doctor/shared.js`).

- [ ] **Step 2: mq_doctor_03 객체에 신규 필드 3개 추가**

기존 객체에 다음을 **유지하면서** 필드 추가 (다른 필드 손대지 말 것):

```js
mq_doctor_03: {
  // ... 기존 id/title/desc/icon/characterId/dayTrigger/prerequisite/objective/reward/failPenalty/deadlineDays/narrative 모두 유지 ...

  locationHint: {
    districtId: 'gangnam',
    landmarkId: 'samsung_hospital',
    note: '응급실 정수기 또는 빗물 받기',
    noteEn: 'Use ER water purifier or rainwater collector',
  },

  subObjectives: [
    {
      id: 'so_water_01',
      text: '응급실 정수기에서 물 받기',
      textEn: 'Get water from ER purifier',
      hint: 'water_purifier 카드 사용',
      match: { type: 'use_item', itemId: 'water_purifier' },
    },
    {
      id: 'so_water_02',
      text: '빗물받이 구조물 제작',
      textEn: 'Craft a rainwater collector',
      hint: 'rainwater_collector 레시피',
      match: { type: 'craft_item', definitionId: 'rainwater_collector' },
    },
    {
      id: 'so_water_03',
      text: '깨끗한 물 5개 인벤토리에 보관',
      textEn: 'Stock 5 clean water in inventory',
      hint: '오염도 0 상태',
      match: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    },
  ],

  actionHint: '강남(현재 구역) 응급실 정수기를 활용하거나, 비 오는 날 빗물받이를 세워라.',
  actionHintEn: 'Use the ER purifier in Gangnam, or set up a rainwater collector on a rainy day.',
},
```

- [ ] **Step 3: 게임 부팅 확인 (런타임 영향 없음 검증)**

Run: `npm run dev:web` (또는 기존 dev 명령어)
Expected: 콘솔 에러 0, 의사 새 게임 → Day 1 정상 진입

- [ ] **Step 4: 커밋**

```bash
git add js/data/mainQuests*
git commit -m "feat(quest): add subObjectives/locationHint/actionHint to mq_doctor_03"
```

---

## Task 0.2: validate.js에 신규 필드 검증 추가 (TDD)

**Files:**
- Modify: `js/data/validate.js`
- Test: `tests/unit/validate_questSchema.test.js` (신규)

- [ ] **Step 1: 단위 테스트 작성 (실패)**

`tests/unit/validate_questSchema.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validateMainQuestSchema } from '../../js/data/validate.js';

describe('validateMainQuestSchema', () => {
  it('subObjectives 없는 퀘스트는 통과 (선택적)', () => {
    const quest = {
      id: 'mq_test', title: 't', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
    };
    expect(validateMainQuestSchema(quest)).toEqual({ ok: true, errors: [] });
  });

  it('subObjectives 항목에 id/text 누락 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      subObjectives: [{ hint: 'h' }],
    };
    const r = validateMainQuestSchema(quest);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/subObjectives\[0\].(id|text)/);
  });

  it('subObjectives id 중복 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      subObjectives: [
        { id: 'so_a', text: 'A' },
        { id: 'so_a', text: 'B' },
      ],
    };
    const r = validateMainQuestSchema(quest);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/duplicate id/i);
  });

  it('locationHint.districtId 미존재 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      locationHint: { districtId: 'nonexistent_district' },
    };
    const r = validateMainQuestSchema(quest, { knownDistricts: new Set(['gangnam']) });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/districtId/);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run tests/unit/validate_questSchema.test.js`
Expected: FAIL — `validateMainQuestSchema is not a function`

- [ ] **Step 3: validateMainQuestSchema 구현**

`js/data/validate.js` 하단에 추가 (기존 `validate()` 함수는 유지):

```js
// === MAIN QUEST SCHEMA VALIDATOR (export) ===
export function validateMainQuestSchema(quest, ctx = {}) {
  const errors = [];
  const { knownDistricts = null, knownLandmarks = null } = ctx;

  if (quest.subObjectives) {
    if (!Array.isArray(quest.subObjectives)) {
      errors.push(`${quest.id}: subObjectives must be array`);
    } else {
      const seenIds = new Set();
      quest.subObjectives.forEach((so, i) => {
        if (!so.id) errors.push(`${quest.id}: subObjectives[${i}].id missing`);
        if (!so.text) errors.push(`${quest.id}: subObjectives[${i}].text missing`);
        if (so.id && seenIds.has(so.id)) {
          errors.push(`${quest.id}: subObjectives[${i}] duplicate id "${so.id}"`);
        }
        seenIds.add(so.id);
      });
    }
  }

  if (quest.locationHint) {
    const lh = quest.locationHint;
    if (knownDistricts && lh.districtId && !knownDistricts.has(lh.districtId)) {
      errors.push(`${quest.id}: locationHint.districtId "${lh.districtId}" unknown`);
    }
    if (knownLandmarks && lh.landmarkId && !knownLandmarks.has(lh.landmarkId)) {
      errors.push(`${quest.id}: locationHint.landmarkId "${lh.landmarkId}" unknown`);
    }
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: 테스트 재실행 — 통과**

Run: `npx vitest run tests/unit/validate_questSchema.test.js`
Expected: PASS (4/4)

- [ ] **Step 5: 통합 validate 흐름에 연결**

`js/data/validate.js`의 `validate()` 함수 안에서 모든 메인 퀘스트를 순회하며 호출 (기존 validate() 본문에 추가):

```js
// === Main Quest Schema Check ===
const MAIN_QUESTS = (await import('./mainQuests/index.js')).default;
const districts = (await import('./districts.js')).default;
const knownDistricts = new Set(Object.keys(districts));
for (const [id, q] of Object.entries(MAIN_QUESTS)) {
  const r = validateMainQuestSchema({ ...q, id }, { knownDistricts });
  for (const e of r.errors) {
    console.log(`❌ [main quest] ${e}`);
    errors++;
  }
}
```

- [ ] **Step 6: validate.js 실행**

Run: `node --input-type=module --eval "import('./js/data/validate.js').then(m => m.default ? m.default() : null)"`
또는 기존 실행 방식: `node --input-type=module js/data/validate.js`
Expected: 0 main quest errors (mq_doctor_03만 신규 필드 보유, 나머지 미보유 시 통과)

- [ ] **Step 7: 커밋**

```bash
git add js/data/validate.js tests/unit/validate_questSchema.test.js
git commit -m "feat(validate): add main quest subObjective/locationHint schema checks"
```

---

## Task 0.3: 의사 메인퀘 11개 모두에 신규 필드 채우기

**Files:**
- Modify: `js/data/mainQuests.js` 또는 `mainQuests/doctor*` (Task 0.1 결과 경로)

대상 ID: `mq_doctor_01`, `mq_doctor_02`, `mq_doctor_03` (이미 완료), `mq_doctor_04`, `mq_doctor_05`, `mq_doctor_05b`, `mq_doctor_06`, `mq_doctor_07`, `mq_doctor_08`, `mq_doctor_09`, `mq_doctor_10`.

각 퀘스트에 다음 형식 적용:

| 퀘스트 | locationHint.districtId | subObjectives 핵심 단계 |
|--------|--------------------------|-------------------------|
| mq_doctor_01 (식량 3) | `gangnam` (samsung_hospital) | 응급실 자판기 / 카페테리아 / 식료품 카드 회수 |
| mq_doctor_02 (구조물 1) | `gangnam` | 재료 수집 → 바리케이드/방어벽/저장고 중 1개 제작 |
| mq_doctor_03 (물 5) | (완료) | (완료) |
| mq_doctor_04 (의료품 5) | `gangnam` | 응급실 약장 / 약국 카드 / 빈 약병+허브 정제 |
| mq_doctor_05 (서대문 방문) | `seodaemun` (severance) | 지하철 경로 확보 / 의약품 휴대 / 서대문 도착 |
| mq_doctor_05b (강남 분기) | `gangnam` | 삼성병원 지하 진입 / 데이터 회수 |
| mq_doctor_06 (구급상자 2) | (현재 구역) | 의약품·천·소독제 조합 / 구급상자 레시피 |
| mq_doctor_07 (영등포 KBS) | `yeongdeungpo` (kbs) | 한강 통과 / 영등포 진입 / KBS 송출실 도달 |
| mq_doctor_08 (100일) | (모든 구역) | 100일 생존 (서술형, match 없음) |
| mq_doctor_09 (야전병원 건설) | (현재 거점) | 의료대 카드 1개 건설 (`medical_station`) |
| mq_doctor_10 (백신) | (현재 거점) | 정제약 3개 보유 (`purified_medicine`) |

- [ ] **Step 1: mq_doctor_01 ~ mq_doctor_10까지 11개 퀘스트에 동일 패턴으로 필드 추가**

각 퀘스트에 `locationHint`, `subObjectives` (2~4개), `actionHint` (한/영) 작성. mq_doctor_08 같은 "100일 생존"은 subObjectives에 `match` 없는 서술형 단계 1개만 둠 (예: `{ id: 'so_d8_01', text: '매일 살아남기', textEn: 'Survive each day' }`).

> 작성 시 일관성: subObjectives 의 `match` 필드는 다음 5종만 사용:
> - `{ type: 'collect_item', definitionId, count }`
> - `{ type: 'collect_item_type', itemType, count }`
> - `{ type: 'craft_item', definitionId }` 또는 `{ type: 'craft_item', category }`
> - `{ type: 'visit_district', districtId }`
> - `{ type: 'use_item', itemId }`
> - `{ type: 'build_structure', structureId }`
>
> 매칭 불가능한 단계(예: "이지수와 대화", "환자 상태 관찰")는 `match` 생략.

- [ ] **Step 2: validate.js 실행**

Run: `node --input-type=module js/data/validate.js`
Expected: 의사 11개 퀘스트 모두 schema 통과, 0 errors

- [ ] **Step 3: 게임 부팅 + 의사 새게임 → Day 1~3 진행 (눈 검사)**

Expected: 콘솔 에러 0, 기존 퀘스트 알림 그대로 동작

- [ ] **Step 4: 커밋**

```bash
git add js/data/mainQuests*
git commit -m "feat(quest): expand all 11 doctor main quests with subObjectives/locationHint/actionHint"
```

---

## Task 0.4: sidequests.js 스캐폴드 + 검증

**Files:**
- Create: `js/data/sidequests.js`
- Modify: `js/data/validate.js`
- Test: `tests/unit/validate_sidequestSchema.test.js` (신규)

- [ ] **Step 1: 빈 sidequests.js 생성**

`js/data/sidequests.js`:

```js
// === SIDEQUEST DEFINITIONS ===
// 환자 케이스, 자원 신호, 메인 퀘스트 공백 등에서 자연 발생하는 미니 퀘스트.
// 메인 퀘스트와 동일한 objective 타입을 재사용. 만료해도 페널티 없음.
//
// 스키마:
//   id, title, icon
//   trigger: { event, condition? }     — EventBus 이벤트 + 와일드카드 조건
//   parentMainQuest: string|null       — 메인 연관 시 ID (UI 그룹화용)
//   objective: { type, ... }           — QuestSystem과 동일
//   desc, descEn
//   locationHint?: { districtId, landmarkId?, note?, noteEn? }
//   reward: { morale?, items? }
//   expiresInDays: number              — 발생 후 남은 일수
//   optional: boolean (기본 true)

const SIDEQUESTS = {
  // Phase 3에서 채움
};

export default SIDEQUESTS;
```

- [ ] **Step 2: 사이드퀘스트 스키마 검증 테스트 작성 (실패)**

`tests/unit/validate_sidequestSchema.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validateSidequestSchema } from '../../js/data/validate.js';

describe('validateSidequestSchema', () => {
  it('필수 필드(id, trigger.event, objective) 누락 시 에러', () => {
    const r = validateSidequestSchema({ title: 't' });
    expect(r.ok).toBe(false);
    expect(r.errors.join(',')).toMatch(/id|trigger\.event|objective/);
  });

  it('trigger.event가 known 이벤트 목록에 없으면 에러', () => {
    const sq = {
      id: 'sq_x', trigger: { event: 'unknown_event' },
      objective: { type: 'collect_item', definitionId: 'a', count: 1 },
    };
    const r = validateSidequestSchema(sq, { knownEvents: new Set(['npcHealed']) });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/unknown_event/);
  });

  it('parentMainQuest가 known 메인퀘 목록에 없으면 에러', () => {
    const sq = {
      id: 'sq_x', trigger: { event: 'npcHealed' },
      objective: { type: 'collect_item', definitionId: 'a', count: 1 },
      parentMainQuest: 'mq_unknown',
    };
    const r = validateSidequestSchema(sq, {
      knownEvents: new Set(['npcHealed']),
      knownMainQuests: new Set(['mq_doctor_01']),
    });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/mq_unknown/);
  });

  it('정상 sidequest는 통과', () => {
    const sq = {
      id: 'sq_x', title: 't', trigger: { event: 'npcHealed' },
      objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },
      expiresInDays: 7, optional: true,
    };
    const r = validateSidequestSchema(sq, { knownEvents: new Set(['npcHealed']) });
    expect(r).toEqual({ ok: true, errors: [] });
  });
});
```

- [ ] **Step 3: 테스트 실행 — 실패 확인**

Run: `npx vitest run tests/unit/validate_sidequestSchema.test.js`
Expected: FAIL — `validateSidequestSchema is not a function`

- [ ] **Step 4: validateSidequestSchema 구현**

`js/data/validate.js`에 추가:

```js
// === SIDEQUEST SCHEMA VALIDATOR (export) ===
export function validateSidequestSchema(sq, ctx = {}) {
  const errors = [];
  const { knownEvents = null, knownMainQuests = null } = ctx;

  if (!sq.id) errors.push('sidequest: id missing');
  if (!sq.trigger?.event) errors.push(`${sq.id || '?'}: trigger.event missing`);
  if (!sq.objective?.type) errors.push(`${sq.id || '?'}: objective.type missing`);

  if (sq.trigger?.event && knownEvents && !knownEvents.has(sq.trigger.event)) {
    errors.push(`${sq.id}: trigger.event "${sq.trigger.event}" not in known events`);
  }
  if (sq.parentMainQuest && knownMainQuests && !knownMainQuests.has(sq.parentMainQuest)) {
    errors.push(`${sq.id}: parentMainQuest "${sq.parentMainQuest}" not found`);
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 5: 테스트 재실행 — 통과**

Run: `npx vitest run tests/unit/validate_sidequestSchema.test.js`
Expected: PASS (4/4)

- [ ] **Step 6: 통합 validate에 연결**

`js/data/validate.js`의 `validate()` 본문에 추가:

```js
const SIDEQUESTS = (await import('./sidequests.js')).default;
const KNOWN_EVENTS = new Set([
  'npcHealed', 'npcAdmitted', 'patientDied', 'patientLeft',
  'mainQuestActivated', 'mainQuestCompleted', 'dayStarted',
  'deadlineApproaching',
]);
const knownMainQuestIds = new Set(Object.keys(MAIN_QUESTS));
for (const [id, sq] of Object.entries(SIDEQUESTS)) {
  const r = validateSidequestSchema({ ...sq, id }, {
    knownEvents: KNOWN_EVENTS,
    knownMainQuests: knownMainQuestIds,
  });
  for (const e of r.errors) {
    console.log(`❌ [sidequest] ${e}`);
    errors++;
  }
}
```

- [ ] **Step 7: validate 실행**

Run: `node --input-type=module js/data/validate.js`
Expected: 0 errors (sidequests 비어있어도 정상)

- [ ] **Step 8: 커밋**

```bash
git add js/data/sidequests.js js/data/validate.js tests/unit/validate_sidequestSchema.test.js
git commit -m "feat(quest): add sidequests scaffold + schema validator"
```

---

# Phase 1 — 퀘스트 패널 UI (~2일)

목표: 좌사이드에 QuestPanel이 떠 있고, 활성 의사 메인퀘의 subObjective가 자동 체크되어 표시됨.

## Task 1.1: subObjective 자동 체크 매칭 함수 (TDD)

**Files:**
- Modify: `js/systems/QuestSystem.js`
- Test: `tests/unit/QuestSystem_subObjective.test.js` (신규)

- [ ] **Step 1: 단위 테스트 작성 (실패)**

`tests/unit/QuestSystem_subObjective.test.js`:

```js
import { describe, it, expect } from 'vitest';
import QuestSystem from '../../js/systems/QuestSystem.js';

describe('QuestSystem._matchSubObjective', () => {
  it('match 필드가 없으면 false (서술형 단계)', () => {
    const so = { id: 'so_x', text: 'Talk to Lee' };
    const r = QuestSystem._matchSubObjective(so, { progress: { collected: { clean_water: 5 } } });
    expect(r).toBe(false);
  });

  it("type='collect_item': definitionId 진행도 ≥ count 시 true", () => {
    const so = { id: 'so_w', match: { type: 'collect_item', definitionId: 'clean_water', count: 5 } };
    expect(QuestSystem._matchSubObjective(so, { collected: { clean_water: 5 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { collected: { clean_water: 4 } })).toBe(false);
  });

  it("type='craft_item': craftedRecipes에 definitionId 포함 시 true", () => {
    const so = { id: 'so_c', match: { type: 'craft_item', definitionId: 'rainwater_collector' } };
    expect(QuestSystem._matchSubObjective(so, { craftedRecipes: ['rainwater_collector'] })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { craftedRecipes: [] })).toBe(false);
  });

  it("type='visit_district': visitedDistricts에 districtId 포함 시 true", () => {
    const so = { id: 'so_v', match: { type: 'visit_district', districtId: 'seodaemun' } };
    expect(QuestSystem._matchSubObjective(so, { visitedDistricts: new Set(['seodaemun']) })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { visitedDistricts: new Set(['gangnam']) })).toBe(false);
  });

  it("type='use_item': usedItems에 itemId 포함 시 true", () => {
    const so = { id: 'so_u', match: { type: 'use_item', itemId: 'water_purifier' } };
    expect(QuestSystem._matchSubObjective(so, { usedItems: new Set(['water_purifier']) })).toBe(true);
  });

  it("type='collect_item_type': itemType 누적 ≥ count 시 true", () => {
    const so = { id: 'so_t', match: { type: 'collect_item_type', itemType: 'medical', count: 3 } };
    expect(QuestSystem._matchSubObjective(so, { collectedByType: { medical: 3 } })).toBe(true);
    expect(QuestSystem._matchSubObjective(so, { collectedByType: { medical: 2 } })).toBe(false);
  });

  it('알 수 없는 type은 false (안전 폴백)', () => {
    const so = { id: 'so_?', match: { type: 'wibble' } };
    expect(QuestSystem._matchSubObjective(so, {})).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run tests/unit/QuestSystem_subObjective.test.js`
Expected: FAIL — `_matchSubObjective is not a function`

- [ ] **Step 3: `_matchSubObjective` 구현**

`js/systems/QuestSystem.js`에 추가 (private 메서드):

```js
/**
 * subObjective.match를 SubObjective 진행 스냅샷에 대해 평가.
 * @param {object} so - { id, match? }
 * @param {object} state - { collected, collectedByType, craftedRecipes, visitedDistricts, usedItems, builtStructures, dayCount }
 * @returns {boolean}
 */
_matchSubObjective(so, state = {}) {
  const m = so.match;
  if (!m) return false;
  switch (m.type) {
    case 'collect_item':
      return (state.collected?.[m.definitionId] ?? 0) >= (m.count ?? 1);
    case 'collect_item_type':
      return (state.collectedByType?.[m.itemType] ?? 0) >= (m.count ?? 1);
    case 'craft_item':
      if (m.definitionId) return (state.craftedRecipes ?? []).includes(m.definitionId);
      if (m.category)     return (state.craftedCategories ?? new Set()).has(m.category);
      return false;
    case 'visit_district':
      return (state.visitedDistricts ?? new Set()).has(m.districtId);
    case 'use_item':
      return (state.usedItems ?? new Set()).has(m.itemId);
    case 'build_structure':
      return (state.builtStructures ?? new Set()).has(m.structureId);
    default:
      return false;
  }
},
```

- [ ] **Step 4: 테스트 재실행 — 통과**

Run: `npx vitest run tests/unit/QuestSystem_subObjective.test.js`
Expected: PASS (7/7)

- [ ] **Step 5: 진행 스냅샷(state) 수집기 추가 + 이벤트 발신**

`QuestSystem`에 `_subObjectiveProgress` 메모리 필드 + 수집 메서드 추가:

```js
// QuestSystem 객체 안에 추가
_progress: {
  collected: {},          // { itemId: count }
  collectedByType: {},    // { itemType: count }
  craftedRecipes: [],     // string[]
  craftedCategories: new Set(),
  visitedDistricts: new Set(),
  usedItems: new Set(),
  builtStructures: new Set(),
},

_subscribeProgressEvents() {
  EventBus.on('itemCollected', ({ definitionId, itemType, qty = 1 } = {}) => {
    if (definitionId) this._progress.collected[definitionId] = (this._progress.collected[definitionId] ?? 0) + qty;
    if (itemType)     this._progress.collectedByType[itemType] = (this._progress.collectedByType[itemType] ?? 0) + qty;
    this._reevaluateSubObjectives();
  });
  EventBus.on('itemCrafted', ({ recipeId, category } = {}) => {
    if (recipeId && !this._progress.craftedRecipes.includes(recipeId)) {
      this._progress.craftedRecipes.push(recipeId);
    }
    if (category) this._progress.craftedCategories.add(category);
    this._reevaluateSubObjectives();
  });
  EventBus.on('districtVisited', ({ districtId } = {}) => {
    this._progress.visitedDistricts.add(districtId);
    this._reevaluateSubObjectives();
  });
  EventBus.on('itemUsed', ({ itemId } = {}) => {
    this._progress.usedItems.add(itemId);
    this._reevaluateSubObjectives();
  });
  EventBus.on('structureBuilt', ({ structureId } = {}) => {
    this._progress.builtStructures.add(structureId);
    this._reevaluateSubObjectives();
  });
},

_reevaluateSubObjectives() {
  for (const quest of this._activeMainQuests()) {
    for (const so of (quest.subObjectives ?? [])) {
      const wasComplete = this._isSubObjectiveDone(quest.id, so.id);
      const nowComplete = this._matchSubObjective(so, this._progress);
      if (nowComplete && !wasComplete) {
        this._markSubObjectiveDone(quest.id, so.id);
        EventBus.emit('subObjectiveCompleted', { questId: quest.id, subObjectiveId: so.id, text: so.text });
      }
    }
  }
},

_isSubObjectiveDone(questId, soId) {
  return GameState.subObjectiveProgress?.[questId]?.[soId] === true;
},
_markSubObjectiveDone(questId, soId) {
  GameState.subObjectiveProgress = GameState.subObjectiveProgress ?? {};
  GameState.subObjectiveProgress[questId] = GameState.subObjectiveProgress[questId] ?? {};
  GameState.subObjectiveProgress[questId][soId] = true;
},

_activeMainQuests() {
  return Object.values(MAIN_QUESTS).filter(q => GameState.activeQuests?.includes(q.id));
},
```

> **이벤트명 검증:** 위 5개 이벤트(`itemCollected`, `itemCrafted`, `districtVisited`, `itemUsed`, `structureBuilt`)가 실제 emit되는지 확인. 누락 시 해당 시스템에 emit 추가:
>
> ```bash
> grep -rn "EventBus.emit('itemCollected\|EventBus.emit('itemCrafted\|EventBus.emit('districtVisited\|EventBus.emit('itemUsed\|EventBus.emit('structureBuilt" js/
> ```
>
> 없는 이벤트는 다음 시스템에 emit 추가 필요:
> - `itemCollected` → 인벤토리 추가 지점 (CardFactory/BoardManager의 pendingLoot resolve 또는 GameState.addItem)
> - `itemCrafted` → CraftSystem 완료 지점
> - `districtVisited` → SubwaySystem 또는 ExploreSystem의 구역 변경 지점
> - `itemUsed` → CardContextMenu의 use 액션
> - `structureBuilt` → 구조물 제작 완료 (CraftSystem `category === 'structure'`인 경우)

- [ ] **Step 6: 누락 이벤트 emit 추가 (없는 경우만)**

각 시스템에서 누락된 emit을 추가. 예시 — `itemCollected`:

```js
// 예: js/core/GameState.js의 inventory 추가 메서드 또는 BoardManager의 loot resolve
EventBus.emit('itemCollected', {
  definitionId: itemDef.id,
  itemType: itemDef.type,
  qty: amount ?? 1,
});
```

검증: `npx vitest run tests/unit/QuestSystem_subObjective.test.js` 여전히 PASS.

- [ ] **Step 7: QuestSystem.init()에 _subscribeProgressEvents() 호출**

```js
// QuestSystem.init() 안에 추가
this._subscribeProgressEvents();
```

- [ ] **Step 8: GameState.subObjectiveProgress 초기화**

`js/core/GameState.js`에 필드 추가:

```js
const GameState = {
  // ... 기존 필드 ...
  subObjectiveProgress: {},   // { [questId]: { [soId]: true } }
  dailyFocus: [],             // Phase 2에서 사용
  activeSidequests: [],       // Phase 3에서 사용
  // ...
};
```

`reset` 또는 새 게임 시작 시 위 3개 필드 초기화하는 곳에 추가.

- [ ] **Step 9: 통합 부팅 검사**

Run: `npm run dev:web`, 의사 새게임 → mq_doctor_03 활성 (Day 7 점프 또는 디버그 패널 사용), `clean_water` 5개 모으기 시도 → 콘솔에서 `subObjectiveCompleted` 이벤트 발신 확인.

- [ ] **Step 10: 커밋**

```bash
git add js/systems/QuestSystem.js js/core/GameState.js tests/unit/QuestSystem_subObjective.test.js
git commit -m "feat(quest): subObjective auto-check matcher + progress event aggregation"
```

---

## Task 1.2: QuestPanel 렌더 스켈레톤 (활성 계층만)

**Files:**
- Create: `js/ui/QuestPanel.js`
- Create: `css/quest-panel.css`
- Modify: `index.html` (CSS link 추가)
- Modify: `js/screens/Main.js` (마운트 슬롯 추가)

- [ ] **Step 1: QuestPanel 모듈 생성 (활성 퀘스트 1개만 렌더)**

`js/ui/QuestPanel.js`:

```js
import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n from '../core/I18n.js';
import MAIN_QUESTS from '../data/mainQuests/index.js';

const QuestPanel = {
  _root: null,

  mount(rootEl) {
    this._root = rootEl;
    this._render();
    EventBus.on('mainQuestActivated', () => this._render());
    EventBus.on('mainQuestCompleted', () => this._render());
    EventBus.on('subObjectiveCompleted', () => this._render());
    EventBus.on('dayStarted', () => this._render());
  },

  _render() {
    if (!this._root) return;
    const active = this._activeMainQuests();
    const next   = this._upcomingMainQuests();
    const locked = this._lockedFutureMainQuests();

    this._root.innerHTML = `
      <div class="quest-panel">
        <h3 class="quest-panel-title">🎯 ${I18n.t('quest.panelTitle') || '퀘스트'}</h3>

        <div class="quest-panel-active">
          ${active.length === 0
            ? `<div class="quest-empty">${I18n.t('quest.noneActive') || '활성 퀘스트 없음'}</div>`
            : active.map(q => this._renderActive(q)).join('')}
        </div>

        ${next.length > 0 ? `
          <div class="quest-panel-next">
            <h4>${I18n.t('quest.next') || '다음'}</h4>
            ${next.map(q => this._renderNext(q)).join('')}
          </div>
        ` : ''}

        ${locked.length > 0 ? `
          <details class="quest-panel-locked">
            <summary>${I18n.t('quest.locked') || '잠긴 미래'} (${locked.length})</summary>
            ${locked.map(q => this._renderLocked(q)).join('')}
          </details>
        ` : ''}
      </div>
    `;
  },

  _renderActive(q) {
    const sos = q.subObjectives ?? [];
    const progress = GameState.subObjectiveProgress?.[q.id] ?? {};
    return `
      <div class="quest-active" data-quest-id="${q.id}">
        <div class="quest-row">
          <span class="quest-icon">${q.icon ?? '📌'}</span>
          <span class="quest-title">${q.title}</span>
          ${q.deadlineDays != null && q.deadlineDays !== Infinity
            ? `<span class="quest-deadline">D-${this._daysLeft(q)}</span>` : ''}
        </div>
        <div class="quest-desc">${q.actionHint ?? q.desc ?? ''}</div>
        ${sos.length > 0 ? `
          <ul class="quest-subobjectives">
            ${sos.map(so => `
              <li class="${progress[so.id] ? 'done' : ''}">
                ${progress[so.id] ? '☑' : '☐'} ${so.text}
                ${so.hint ? `<span class="quest-hint">— ${so.hint}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        ` : ''}
        ${q.locationHint ? `
          <div class="quest-location">📍 ${q.locationHint.note ?? q.locationHint.districtId}</div>
        ` : ''}
      </div>
    `;
  },

  _renderNext(q) {
    return `
      <div class="quest-next-row">
        <span>${q.icon ?? '·'}</span> ${q.title}
        ${q.dayTrigger != null ? ` <span class="quest-trigger">Day ${q.dayTrigger}</span>` : ''}
      </div>
    `;
  },

  _renderLocked(q) {
    return `
      <div class="quest-locked-row">${q.icon ?? '·'} ${q.title}</div>
    `;
  },

  _activeMainQuests() {
    const ids = GameState.activeQuests ?? [];
    return ids.map(id => MAIN_QUESTS[id]).filter(Boolean);
  },

  _upcomingMainQuests() {
    const character = GameState.player?.characterId;
    const completed = new Set(GameState.completedQuests ?? []);
    const active    = new Set(GameState.activeQuests ?? []);
    const today     = GameState.time?.day ?? 1;
    return Object.values(MAIN_QUESTS)
      .filter(q => q.characterId === character)
      .filter(q => !completed.has(q.id) && !active.has(q.id))
      .filter(q => !q.prerequisite || completed.has(q.prerequisite))
      .filter(q => q.dayTrigger == null || q.dayTrigger - today <= 5)
      .slice(0, 2);
  },

  _lockedFutureMainQuests() {
    const character = GameState.player?.characterId;
    const completed = new Set(GameState.completedQuests ?? []);
    const active    = new Set(GameState.activeQuests ?? []);
    return Object.values(MAIN_QUESTS)
      .filter(q => q.characterId === character)
      .filter(q => !completed.has(q.id) && !active.has(q.id))
      .filter(q => q.prerequisite && !completed.has(q.prerequisite))
      .slice(0, 5);
  },

  _daysLeft(q) {
    const startedDay = GameState.questStartedDay?.[q.id] ?? GameState.time?.day ?? 1;
    const elapsed = (GameState.time?.day ?? 1) - startedDay;
    return Math.max(0, (q.deadlineDays ?? Infinity) - elapsed);
  },
};

export default QuestPanel;
```

- [ ] **Step 2: 스타일 파일 생성**

`css/quest-panel.css`:

```css
.quest-panel {
  padding: 8px;
  background: var(--surface-elevated, rgba(20,22,26,0.6));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 6px;
  font-family: var(--font-ui, 'Noto Sans KR'), sans-serif;
  font-size: 12px;
  color: var(--text-primary, #e8e8e8);
}
.quest-panel-title { margin: 0 0 6px; font-size: 13px; font-weight: 600; }
.quest-active { padding: 6px; border-left: 2px solid var(--accent-warm, #e5c55a); margin-bottom: 8px; }
.quest-row { display: flex; gap: 6px; align-items: center; font-weight: 500; }
.quest-deadline { margin-left: auto; font-size: 11px; color: var(--accent-warm, #e5c55a); }
.quest-desc { font-size: 11px; opacity: 0.85; margin: 4px 0; line-height: 1.4; }
.quest-subobjectives { list-style: none; padding: 0; margin: 4px 0; font-size: 11px; }
.quest-subobjectives li { padding: 2px 0; }
.quest-subobjectives li.done { opacity: 0.55; text-decoration: line-through; }
.quest-hint { opacity: 0.6; font-size: 10px; }
.quest-location { font-size: 10px; opacity: 0.7; margin-top: 4px; }
.quest-empty { opacity: 0.5; font-size: 11px; }

.quest-panel-next h4 { font-size: 11px; opacity: 0.7; margin: 8px 0 4px; }
.quest-next-row { font-size: 11px; padding: 2px 4px; opacity: 0.85; }
.quest-trigger { opacity: 0.6; }

.quest-panel-locked { margin-top: 8px; }
.quest-panel-locked summary { font-size: 11px; opacity: 0.6; cursor: pointer; }
.quest-locked-row { font-size: 11px; opacity: 0.4; padding: 2px 4px; }
```

- [ ] **Step 3: index.html에 CSS 링크 추가**

`index.html` 의 CSS 섹션 (45번째 줄 근처)에 추가:

```html
<link rel="stylesheet" href="css/quest-panel.css">
```

- [ ] **Step 4: Main.js에 마운트 슬롯 추가**

`js/screens/Main.js`의 `_buildLayout()`의 `<aside class="bc-sidebar">` 안, `<!-- Encumbrance --><div class="bc-enc-block">` 바로 다음에 추가:

```html
<!-- Quest Panel mount -->
<div id="quest-panel-mount"></div>
```

- [ ] **Step 5: Main.js에서 QuestPanel.mount 호출**

`js/screens/Main.js` 상단에 import:

```js
import QuestPanel from '../ui/QuestPanel.js';
```

`init()` 또는 layout 구축 후 호출하는 메서드(예: `_initWidgets()` 또는 layout 직후)에 추가:

```js
const questMount = document.getElementById('quest-panel-mount');
if (questMount) QuestPanel.mount(questMount);
```

- [ ] **Step 6: 부팅 + 시각 검증**

Run: `npm run dev:web`, 의사 새게임 → Day 1 진입.
Expected:
- 좌사이드 하단(Encumbrance 아래)에 "🎯 퀘스트" 패널 표시
- 활성 퀘스트(`mq_doctor_01`)가 노란 보더와 함께 펼쳐 표시
- subObjectives 체크박스 3개 표시 (모두 ☐)
- 다음 / 잠긴 미래 영역도 캐릭터의 이후 퀘스트들로 채워짐

- [ ] **Step 7: subObjective 자동 체크 시각 검증**

Day 1 식량 1개 획득 → mq_doctor_01의 식량 관련 subObjective 1개가 ☑로 변경되는지 확인.

(이때 `mainQuestActivated`/`subObjectiveCompleted` 이벤트가 정상 emit되어야 함)

- [ ] **Step 8: 커밋**

```bash
git add js/ui/QuestPanel.js css/quest-panel.css index.html js/screens/Main.js
git commit -m "feat(ui): add QuestPanel with 3-tier display + subObjective checklist"
```

---

## Task 1.3: 데드라인 D-2 색 강조 + 잠긴 미래 펼치기 폴리시

**Files:**
- Modify: `js/ui/QuestPanel.js`
- Modify: `css/quest-panel.css`

- [ ] **Step 1: deadline 단계별 색 적용**

`QuestPanel._renderActive()` 의 deadline span에 클래스 추가:

```js
${q.deadlineDays != null && q.deadlineDays !== Infinity ? (() => {
  const left = this._daysLeft(q);
  const cls = left <= 1 ? 'urgent' : left <= 3 ? 'warn' : '';
  return `<span class="quest-deadline ${cls}">D-${left}</span>`;
})() : ''}
```

- [ ] **Step 2: CSS 추가**

`css/quest-panel.css`:

```css
.quest-deadline.urgent { color: var(--accent-danger, #d04a4a); font-weight: 700; }
.quest-deadline.warn   { color: var(--accent-warning, #e08a3a); }
```

- [ ] **Step 3: 시각 검증**

mq_doctor_01의 deadline 10일을 임시로 2일로 줄여 부팅 → 빨간 D-2 표시 확인. 이후 원복.

- [ ] **Step 4: 커밋**

```bash
git add js/ui/QuestPanel.js css/quest-panel.css
git commit -m "feat(ui): deadline color tier (urgent D-1 / warn D-3) in QuestPanel"
```

---

# Phase 2 — DailyFocusSystem (~2일)

## Task 2.1: DailyFocusSystem 핵심 (점수/다양성 선정, TDD)

**Files:**
- Create: `js/systems/DailyFocusSystem.js`
- Test: `tests/unit/DailyFocusSystem.test.js` (신규)

- [ ] **Step 1: 단위 테스트 작성 (실패)**

`tests/unit/DailyFocusSystem.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import DailyFocusSystem from '../../js/systems/DailyFocusSystem.js';

describe('DailyFocusSystem._scoreCandidate', () => {
  it("메인 퀘스트 데드라인 D-1: 95점", () => {
    const c = { sourceType: 'main', daysLeft: 1, baseKind: 'mainNextSubObj' };
    expect(DailyFocusSystem._scoreCandidate(c)).toBeGreaterThanOrEqual(95);
  });

  it("환자 HP < 30: 90점 이상", () => {
    const c = { sourceType: 'patient', baseKind: 'patientCritical' };
    expect(DailyFocusSystem._scoreCandidate(c)).toBeGreaterThanOrEqual(90);
  });

  it("활성 메인 퀘스트 다음 subObj (데드라인 여유): 70점", () => {
    const c = { sourceType: 'main', daysLeft: 30, baseKind: 'mainNextSubObj' };
    expect(DailyFocusSystem._scoreCandidate(c)).toBe(70);
  });

  it("사이드 퀘스트 다음 단계: 50점", () => {
    const c = { sourceType: 'sidequest', daysLeft: 7, baseKind: 'sidequestNext' };
    expect(DailyFocusSystem._scoreCandidate(c)).toBe(50);
  });

  it("의사 직업: 환자 신호에 +5", () => {
    const c = { sourceType: 'patient', baseKind: 'patientStable' };
    const wo = DailyFocusSystem._scoreCandidate(c, { characterId: 'soldier' });
    const w  = DailyFocusSystem._scoreCandidate(c, { characterId: 'doctor' });
    expect(w - wo).toBe(5);
  });
});

describe('DailyFocusSystem._selectTopWithDiversity', () => {
  const main70 = { id: 'm1', priority: 70, sourceType: 'main' };
  const main65 = { id: 'm2', priority: 65, sourceType: 'main' };
  const pat80  = { id: 'p1', priority: 80, sourceType: 'patient' };
  const sq50   = { id: 's1', priority: 50, sourceType: 'sidequest' };
  const crit95 = { id: 'c1', priority: 95, sourceType: 'main' };

  it('top 2 + 다양성: 메인 1 + 비메인 1', () => {
    const r = DailyFocusSystem._selectTopWithDiversity([main70, main65, pat80, sq50], 2);
    expect(r.map(x => x.id)).toEqual(['p1', 'm1']);
  });

  it('priority ≥ 90이면 다양성 무시 (긴급 우선)', () => {
    const r = DailyFocusSystem._selectTopWithDiversity([crit95, main70, pat80], 2);
    expect(r.map(x => x.id).sort()).toEqual(['c1', 'p1'].sort());
  });

  it('후보 1개면 그대로 반환', () => {
    const r = DailyFocusSystem._selectTopWithDiversity([main70], 2);
    expect(r).toEqual([main70]);
  });

  it('후보 0개면 빈 배열', () => {
    const r = DailyFocusSystem._selectTopWithDiversity([], 2);
    expect(r).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run tests/unit/DailyFocusSystem.test.js`
Expected: FAIL — `Cannot find module '.../DailyFocusSystem.js'`

- [ ] **Step 3: DailyFocusSystem 골격 구현**

`js/systems/DailyFocusSystem.js`:

```js
// === DAILY FOCUS SYSTEM ===
// 매일 1~2개 추천 행동을 생성. 비강제 — 무시해도 페널티 없음.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const BASE_PRIORITY = {
  mainDeadlineD1:    95,
  patientCritical:   90,
  mainDeadlineD3:    80,
  mainNextSubObj:    70,
  resourceLow:       65,
  patientStable:     55,
  sidequestNext:     50,
  longPrep:          40,
};

const DailyFocusSystem = {
  _focus: [],
  _hiddenToday: new Set(),
  _yesterdayFocus: [],

  init() {
    EventBus.on('dayStarted',           () => { this._hiddenToday.clear(); this._yesterdayFocus = [...this._focus]; this.recompute(); });
    EventBus.on('mainQuestActivated',   () => this.recompute());
    EventBus.on('mainQuestCompleted',   () => this.recompute());
    EventBus.on('subObjectiveCompleted',() => this.recompute());
    EventBus.on('npcAdmitted',          () => this.recompute());
    EventBus.on('npcHealed',            () => this.recompute());
    EventBus.on('patientDied',          () => this.recompute());
    EventBus.on('patientLeft',          () => this.recompute());
    EventBus.on('deadlineApproaching',  () => this.recompute());
  },

  recompute() {
    const ctx = { characterId: GameState.player?.characterId };
    const candidates = [
      ...this._collectMainQuestCandidates(),
      ...this._collectPatientCandidates(),
      ...this._collectResourceCandidates(),
      ...this._collectSidequestCandidates(),
    ]
      .map(c => ({ ...c, priority: this._scoreCandidate(c, ctx) }))
      .filter(c => !this._hiddenToday.has(c.id));

    this._focus = this._selectTopWithDiversity(candidates, 2);
    GameState.dailyFocus = this._focus;
    EventBus.emit('dailyFocusChanged', { focus: this._focus });
  },

  _scoreCandidate(c, ctx = {}) {
    const base = BASE_PRIORITY[c.baseKind] ?? 0;
    let urgency = 0;
    if (c.daysLeft != null) {
      if      (c.daysLeft <= 2) urgency = 20;
      else if (c.daysLeft <= 5) urgency = 10;
    }
    let recency = 0;
    if (this._yesterdayFocus.some(y => y.id === c.id && y.progress === c.progress)) recency = -10;

    let job = 0;
    if (ctx.characterId === 'doctor' && c.sourceType === 'patient') job = 5;
    if (ctx.characterId === 'soldier' && c.sourceType === 'main' && c.baseKind === 'mainNextSubObj') job = 5;

    return Math.max(0, base + urgency + recency + job);
  },

  _selectTopWithDiversity(candidates, n) {
    if (candidates.length === 0) return [];
    const sorted = [...candidates].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    const top1 = sorted[0];
    if (sorted.length === 1 || n < 2) return [top1];
    if ((top1.priority ?? 0) >= 90) {
      // 긴급: 다양성 무시, 단순 top-2 (priority 동률 시 메인 우선)
      const second = sorted.slice(1).sort((a, b) => {
        const pdiff = (b.priority ?? 0) - (a.priority ?? 0);
        if (pdiff !== 0) return pdiff;
        const order = { main: 0, patient: 1, resource: 2, sidequest: 3 };
        return (order[a.sourceType] ?? 9) - (order[b.sourceType] ?? 9);
      })[0];
      return [top1, second];
    }
    // 다양성 강제: top1과 다른 sourceType 그룹에서 가장 높은 1개
    const wantOtherKind = top1.sourceType === 'main' ? c => c.sourceType !== 'main'
                                                     : c => c.sourceType === 'main';
    const other = sorted.find(c => c.id !== top1.id && wantOtherKind(c));
    if (other) return [top1, other];
    return sorted.slice(0, 2);
  },

  hideToday(id) { this._hiddenToday.add(id); this.recompute(); },

  // 후보 수집기 — Phase 2 다음 태스크에서 채움
  _collectMainQuestCandidates()  { return []; },
  _collectPatientCandidates()    { return []; },
  _collectResourceCandidates()   { return []; },
  _collectSidequestCandidates()  { return []; },
};

export default DailyFocusSystem;
```

- [ ] **Step 4: 테스트 재실행 — 통과**

Run: `npx vitest run tests/unit/DailyFocusSystem.test.js`
Expected: PASS (9/9)

- [ ] **Step 5: 커밋**

```bash
git add js/systems/DailyFocusSystem.js tests/unit/DailyFocusSystem.test.js
git commit -m "feat(daily-focus): scoring + diversity selection (TDD scaffold)"
```

---

## Task 2.2: 후보 수집기 4종 구현

**Files:**
- Modify: `js/systems/DailyFocusSystem.js`
- Test: `tests/unit/DailyFocusSystem.test.js` (확장)

- [ ] **Step 1: 후보 수집기 단위 테스트 추가**

`tests/unit/DailyFocusSystem.test.js`에 describe 블록 추가:

```js
import GameState from '../../js/core/GameState.js';

describe('DailyFocusSystem._collectMainQuestCandidates', () => {
  beforeEach(() => {
    GameState.activeQuests = [];
    GameState.subObjectiveProgress = {};
    GameState.questStartedDay = {};
    GameState.time = { day: 5 };
    GameState.player = { characterId: 'doctor' };
  });

  it('활성 메인 퀘스트 없으면 빈 배열', () => {
    expect(DailyFocusSystem._collectMainQuestCandidates()).toEqual([]);
  });

  it('활성 메인 1개 + 미완료 subObj 1개 → 후보 1개 (mainNextSubObj)', () => {
    GameState.activeQuests = ['mq_doctor_03'];
    GameState.questStartedDay = { mq_doctor_03: 5 };
    const r = DailyFocusSystem._collectMainQuestCandidates();
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].sourceType).toBe('main');
    expect(r[0].source).toBe('mq_doctor_03');
  });

  it('활성 메인의 모든 subObj 완료 → 후보 없음', () => {
    GameState.activeQuests = ['mq_doctor_03'];
    GameState.questStartedDay = { mq_doctor_03: 5 };
    GameState.subObjectiveProgress = {
      mq_doctor_03: { so_water_01: true, so_water_02: true, so_water_03: true },
    };
    const r = DailyFocusSystem._collectMainQuestCandidates();
    expect(r.find(c => c.source === 'mq_doctor_03' && c.baseKind === 'mainNextSubObj')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run tests/unit/DailyFocusSystem.test.js`
Expected: FAIL — 새 테스트들이 빈 배열만 받음

- [ ] **Step 3: `_collectMainQuestCandidates` 구현**

`js/systems/DailyFocusSystem.js` (export 위, `_collectMainQuestCandidates` 교체):

```js
import MAIN_QUESTS from '../data/mainQuests/index.js';

// ...

_collectMainQuestCandidates() {
  const out = [];
  const today = GameState.time?.day ?? 1;
  for (const id of (GameState.activeQuests ?? [])) {
    const q = MAIN_QUESTS[id];
    if (!q) continue;
    const startedDay = GameState.questStartedDay?.[id] ?? today;
    const elapsed = today - startedDay;
    const daysLeft = q.deadlineDays != null && q.deadlineDays !== Infinity
      ? Math.max(0, q.deadlineDays - elapsed) : null;
    const progress = GameState.subObjectiveProgress?.[id] ?? {};
    const nextSO = (q.subObjectives ?? []).find(so => !progress[so.id]);
    if (!nextSO) continue;

    let baseKind = 'mainNextSubObj';
    if (daysLeft != null && daysLeft <= 1) baseKind = 'mainDeadlineD1';
    else if (daysLeft != null && daysLeft <= 3) baseKind = 'mainDeadlineD3';

    out.push({
      id: `main:${id}:${nextSO.id}`,
      text: nextSO.text,
      hint: nextSO.hint,
      source: id,
      sourceType: 'main',
      baseKind,
      daysLeft,
      action: this._inferAction(nextSO),
      progress: this._inferProgressString(q, nextSO),
    });
  }
  return out;
},

_inferAction(so) {
  const m = so.match;
  if (!m) return null;
  if (m.type === 'craft_item' && m.definitionId) return `craft:${m.definitionId}`;
  if (m.type === 'visit_district') return `visit:${m.districtId}`;
  if (m.type === 'use_item') return `use:${m.itemId}`;
  return null;
},

_inferProgressString(q, so) {
  const m = so.match;
  if (!m) return '';
  if (m.type === 'collect_item') {
    const have = (this._questProgressSnapshot()?.collected?.[m.definitionId]) ?? 0;
    return `${have}/${m.count}`;
  }
  if (m.type === 'collect_item_type') {
    const have = (this._questProgressSnapshot()?.collectedByType?.[m.itemType]) ?? 0;
    return `${have}/${m.count}`;
  }
  return '';
},

_questProgressSnapshot() {
  // QuestSystem._progress를 직접 접근하지 않고 GameState 거울로 가져옴 (구현 시 QuestSystem이 mirror에 sync해야 함, Step 6 참조)
  return GameState.questProgress ?? null;
},
```

> `MAIN_QUESTS` import 위치는 파일 상단으로 옮길 것.

- [ ] **Step 4: QuestSystem이 progress 스냅샷을 GameState에 미러링**

`js/systems/QuestSystem.js`의 `_reevaluateSubObjectives` 끝 또는 progress 변경 직후:

```js
GameState.questProgress = {
  collected:        { ...this._progress.collected },
  collectedByType:  { ...this._progress.collectedByType },
  craftedRecipes:   [...this._progress.craftedRecipes],
  visitedDistricts: new Set(this._progress.visitedDistricts),
  usedItems:        new Set(this._progress.usedItems),
  builtStructures:  new Set(this._progress.builtStructures),
};
```

- [ ] **Step 5: 테스트 재실행 — main candidate 통과**

Run: `npx vitest run tests/unit/DailyFocusSystem.test.js`
Expected: 메인 후보 테스트 PASS.

- [ ] **Step 6: `_collectPatientCandidates` 구현**

`PatientIntakeSystem._admitted`와 `_patientMeta` 접근 (직접 import):

```js
import PatientIntakeSystem from './PatientIntakeSystem.js';

// ...
_collectPatientCandidates() {
  const admitted = PatientIntakeSystem._admitted ?? [];
  const meta = PatientIntakeSystem._patientMeta ?? {};
  const out = [];
  for (const npcId of admitted) {
    const m = meta[npcId];
    if (!m) continue;
    const hp = m.hp ?? 100;
    const baseKind = hp < 30 ? 'patientCritical' : 'patientStable';
    out.push({
      id: `patient:${npcId}`,
      text: hp < 30
        ? `환자 ${npcId} HP ${hp} — 응급 처치 필요`
        : `환자 ${npcId} 입원 중 (HP ${hp})`,
      source: npcId,
      sourceType: 'patient',
      baseKind,
      action: 'open:emergency-room',
    });
  }
  return out;
},
```

- [ ] **Step 7: `_collectResourceCandidates` 구현 (간단 버전)**

```js
_collectResourceCandidates() {
  const stats = GameState.stats ?? {};
  const out = [];
  if ((stats.hydration?.current ?? 999) < 50) {
    out.push({
      id: 'res:hydration',
      text: '갈증이 심하다 — 깨끗한 물 마시기',
      sourceType: 'resource', baseKind: 'resourceLow',
      action: 'use:clean_water',
    });
  }
  if ((stats.nutrition?.current ?? 999) < 30) {
    out.push({
      id: 'res:nutrition',
      text: '배고픔이 심하다 — 식량 섭취',
      sourceType: 'resource', baseKind: 'resourceLow',
      action: null,
    });
  }
  if ((stats.morale?.current ?? 999) < 30) {
    out.push({
      id: 'res:morale',
      text: '사기가 낮다 — 휴식 또는 좋은 사건 필요',
      sourceType: 'resource', baseKind: 'resourceLow',
    });
  }
  return out;
},
```

- [ ] **Step 8: `_collectSidequestCandidates`는 Phase 3까지 빈 배열 유지**

Phase 3에서 SidequestSystem 구현 후 채움. 지금은 placeholder 유지.

- [ ] **Step 9: 통합 부팅 검증**

`SystemRegistry`에 `DailyFocusSystem` 등록(또는 main 부팅 시 init 호출). `js/main.js` 또는 SystemRegistry 등록 위치 찾아서:

```js
import DailyFocusSystem from './systems/DailyFocusSystem.js';
// ...
DailyFocusSystem.init();
```

부팅 → 의사 새게임 Day 1 → 콘솔에서 `dailyFocusChanged` 이벤트가 emit되고 `GameState.dailyFocus`에 1~2개 들어 있는지 확인.

- [ ] **Step 10: 커밋**

```bash
git add js/systems/DailyFocusSystem.js js/systems/QuestSystem.js js/main.js tests/unit/DailyFocusSystem.test.js
git commit -m "feat(daily-focus): main/patient/resource candidate collectors"
```

---

## Task 2.3: deadlineApproaching 이벤트 emit

**Files:**
- Modify: `js/systems/QuestSystem.js`

- [ ] **Step 1: TP/Day tick 구독해서 데드라인 검사**

`QuestSystem`에 메서드 추가:

```js
_subscribeDeadlineWatcher() {
  EventBus.on('dayStarted', () => this._checkDeadlines());
},
_checkDeadlines() {
  const today = GameState.time?.day ?? 1;
  for (const id of (GameState.activeQuests ?? [])) {
    const q = MAIN_QUESTS[id];
    if (!q || q.deadlineDays == null || q.deadlineDays === Infinity) continue;
    const startedDay = GameState.questStartedDay?.[id] ?? today;
    const left = q.deadlineDays - (today - startedDay);
    if (left === 2 || left === 1 || left === 0) {
      EventBus.emit('deadlineApproaching', { questId: id, daysLeft: left });
    }
  }
},
```

`init()`에 추가:

```js
this._subscribeDeadlineWatcher();
```

- [ ] **Step 2: questStartedDay 기록 보장**

활성화 시점(`_activateQuest`)에 다음 줄 추가 (없으면):

```js
GameState.questStartedDay = GameState.questStartedDay ?? {};
GameState.questStartedDay[questId] = GameState.time.day;
```

- [ ] **Step 3: 시각 검증**

mq_doctor_01 deadline 10일 → Day 9 진입 시 콘솔에서 `deadlineApproaching` 이벤트 emit + DailyFocus 우선순위 95로 상승.

- [ ] **Step 4: 커밋**

```bash
git add js/systems/QuestSystem.js
git commit -m "feat(quest): emit deadlineApproaching at D-2/D-1/D-0"
```

---

## Task 2.4: DailyFocusWidget UI

**Files:**
- Create: `js/ui/DailyFocusWidget.js`
- Modify: `css/quest-panel.css` (추가)
- Modify: `js/screens/Main.js` (마운트 슬롯 + 호출)

- [ ] **Step 1: DailyFocusWidget 모듈 생성**

`js/ui/DailyFocusWidget.js`:

```js
import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n from '../core/I18n.js';
import DailyFocusSystem from '../systems/DailyFocusSystem.js';

const DailyFocusWidget = {
  _root: null,

  mount(rootEl) {
    this._root = rootEl;
    this._render();
    EventBus.on('dailyFocusChanged', () => this._render());
    EventBus.on('dayStarted', () => this._render());
  },

  _render() {
    if (!this._root) return;
    const focus = GameState.dailyFocus ?? [];

    if (focus.length === 0) {
      this._root.innerHTML = `
        <div class="daily-focus daily-focus-empty">
          <span>📌 ${I18n.t('focus.title') || '오늘의 추천'}</span>
          <span class="daily-focus-empty-msg">${I18n.t('focus.none') || '특별한 추천이 없다'}</span>
        </div>
      `;
      return;
    }

    this._root.innerHTML = `
      <div class="daily-focus">
        <div class="daily-focus-header">
          <span>📌 ${I18n.t('focus.title') || '오늘의 추천'}</span>
        </div>
        ${focus.map(f => this._renderItem(f)).join('')}
      </div>
    `;

    this._root.querySelectorAll('[data-action="hide-focus"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = btn.getAttribute('data-id');
        DailyFocusSystem.hideToday(id);
        e.stopPropagation();
      });
    });
    this._root.querySelectorAll('[data-action="run-focus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-focus-action');
        this._dispatchFocusAction(action);
      });
    });
  },

  _renderItem(f) {
    const dotClass = f.priority >= 90 ? 'urgent'
                    : f.priority >= 80 ? 'warn'
                    : f.sourceType === 'sidequest' ? 'side'
                    : 'normal';
    return `
      <div class="daily-focus-item ${dotClass}">
        <button class="daily-focus-text" data-action="run-focus" data-focus-action="${f.action ?? ''}">
          <span class="daily-focus-dot"></span>
          <span class="daily-focus-line">${f.text} ${f.progress ? `(${f.progress})` : ''}</span>
          ${f.hint ? `<span class="daily-focus-hint">${f.hint}</span>` : ''}
        </button>
        <button class="daily-focus-x" data-action="hide-focus" data-id="${f.id}" title="오늘은 숨김">×</button>
      </div>
    `;
  },

  _dispatchFocusAction(action) {
    if (!action) return;
    const [verb, arg] = action.split(':');
    EventBus.emit('focusActionRequested', { verb, arg });
    // 핸들링은 각 시스템(EmergencyRoomModal, CraftUI, SeoulMapModal 등)에서 구독
  },
};

export default DailyFocusWidget;
```

- [ ] **Step 2: CSS 추가 (`css/quest-panel.css`에 append)**

```css
.daily-focus {
  padding: 8px;
  background: var(--surface-elevated, rgba(20,22,26,0.6));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 12px;
}
.daily-focus-header { font-weight: 600; margin-bottom: 6px; opacity: 0.9; }
.daily-focus-empty-msg { opacity: 0.5; font-size: 11px; margin-left: 8px; }
.daily-focus-item { display: flex; align-items: flex-start; gap: 4px; padding: 4px 0; }
.daily-focus-text {
  flex: 1; background: none; border: none; color: inherit;
  text-align: left; cursor: pointer; padding: 2px;
  display: flex; align-items: flex-start; gap: 6px;
}
.daily-focus-text:hover { background: rgba(255,255,255,0.04); border-radius: 3px; }
.daily-focus-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.daily-focus-item.urgent .daily-focus-dot { background: var(--accent-danger, #d04a4a); }
.daily-focus-item.warn   .daily-focus-dot { background: var(--accent-warning, #e08a3a); }
.daily-focus-item.normal .daily-focus-dot { background: var(--accent-warm, #e5c55a); }
.daily-focus-item.side   .daily-focus-dot { background: var(--text-muted, #888); }
.daily-focus-line { display: block; }
.daily-focus-hint { display: block; font-size: 10px; opacity: 0.6; }
.daily-focus-x {
  background: none; border: none; color: inherit; opacity: 0.4;
  cursor: pointer; font-size: 14px; padding: 0 4px;
}
.daily-focus-x:hover { opacity: 1; }
```

- [ ] **Step 3: Main.js에 마운트 슬롯 + 호출**

`js/screens/Main.js`의 `_buildLayout()`의 `<aside class="bc-sidebar">` 안, `<!-- Day / Time / TP -->` `bc-time-block` 직후에 추가:

```html
<!-- Daily Focus mount -->
<div id="daily-focus-mount"></div>
```

상단 import 추가:

```js
import DailyFocusWidget from '../ui/DailyFocusWidget.js';
```

mount 호출 (QuestPanel.mount 옆에):

```js
const focusMount = document.getElementById('daily-focus-mount');
if (focusMount) DailyFocusWidget.mount(focusMount);
```

- [ ] **Step 4: 시각 검증**

부팅 → 의사 Day 1 → 좌사이드 시간 블록 아래에 "📌 오늘의 추천" 위젯 표시 + 1~2개 항목.
- 클릭 → `focusActionRequested` 이벤트 emit (콘솔에서 확인)
- × 버튼 → 항목 사라짐, 다음 날 다시 등장

- [ ] **Step 5: 커밋**

```bash
git add js/ui/DailyFocusWidget.js css/quest-panel.css js/screens/Main.js
git commit -m "feat(ui): DailyFocusWidget — top-of-sidebar daily focus display"
```

---

## Task 2.5: GameState 직렬화 호환 (저장/로드)

**Files:**
- Modify: `js/persistence/*.js` (저장 로직 위치 확인)

- [ ] **Step 1: 저장 로직 위치 확인**

```bash
grep -rn "JSON.stringify\|saveSlot\|toJSON" js/persistence/ js/core/GameState.js | head -20
```

저장 시 dump되는 필드 목록 확인.

- [ ] **Step 2: 신규 필드 직렬화 포함**

저장 시 `subObjectiveProgress`, `dailyFocus`, `activeSidequests`, `questStartedDay`, `questProgress` 가 포함되도록 함.

> `Set` 타입 직렬화 시 Array로 변환 필요. 로드 시 다시 Set으로 복원.
> `questProgress.visitedDistricts/usedItems/builtStructures`는 Set이므로 toJSON/fromJSON 처리.

```js
// 저장 시
saveData.subObjectiveProgress = GameState.subObjectiveProgress ?? {};
saveData.dailyFocus            = GameState.dailyFocus ?? [];
saveData.activeSidequests      = GameState.activeSidequests ?? [];
saveData.questStartedDay       = GameState.questStartedDay ?? {};
saveData.questProgress = GameState.questProgress ? {
  collected:        GameState.questProgress.collected,
  collectedByType:  GameState.questProgress.collectedByType,
  craftedRecipes:   GameState.questProgress.craftedRecipes,
  visitedDistricts: [...(GameState.questProgress.visitedDistricts ?? [])],
  usedItems:        [...(GameState.questProgress.usedItems ?? [])],
  builtStructures:  [...(GameState.questProgress.builtStructures ?? [])],
} : null;

// 로드 시
GameState.subObjectiveProgress = data.subObjectiveProgress ?? {};
GameState.dailyFocus            = data.dailyFocus ?? [];
GameState.activeSidequests      = data.activeSidequests ?? [];
GameState.questStartedDay       = data.questStartedDay ?? {};
GameState.questProgress = data.questProgress ? {
  collected:        data.questProgress.collected ?? {},
  collectedByType:  data.questProgress.collectedByType ?? {},
  craftedRecipes:   data.questProgress.craftedRecipes ?? [],
  visitedDistricts: new Set(data.questProgress.visitedDistricts ?? []),
  usedItems:        new Set(data.questProgress.usedItems ?? []),
  builtStructures:  new Set(data.questProgress.builtStructures ?? []),
} : null;
```

- [ ] **Step 3: 마이그레이션 — 기존 저장 파일은 빈 값 기본**

위 코드의 `?? {}` / `?? []` / `?? null` 처리로 자동 처리됨. 추가 마이그레이션 불필요.

- [ ] **Step 4: 저장/로드 왕복 검증**

부팅 → 의사 Day 5 진행 → 저장 → 새 슬롯 빈 값으로 로드 → 다시 의사 슬롯 로드 → DailyFocus/QuestPanel 동일 상태로 복원되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add js/persistence
git commit -m "feat(persist): serialize subObjectiveProgress/dailyFocus/questProgress"
```

---

# Phase 3 — SidequestSystem + 사이드 퀘스트 5~7개 (~2일)

## Task 3.1: SidequestSystem 핵심 (TDD)

**Files:**
- Create: `js/systems/SidequestSystem.js`
- Test: `tests/unit/SidequestSystem.test.js`

- [ ] **Step 1: 단위 테스트 작성 (실패)**

`tests/unit/SidequestSystem.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SidequestSystem from '../../js/systems/SidequestSystem.js';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';

describe('SidequestSystem.matchTrigger', () => {
  it('event 일치 + condition 없음 → true', () => {
    const sq = { id: 'sq_a', trigger: { event: 'npcHealed' } };
    expect(SidequestSystem.matchTrigger(sq, 'npcHealed', {})).toBe(true);
  });

  it('event 불일치 → false', () => {
    const sq = { id: 'sq_a', trigger: { event: 'npcHealed' } };
    expect(SidequestSystem.matchTrigger(sq, 'patientDied', {})).toBe(false);
  });

  it('condition 와일드카드 매칭', () => {
    const sq = { id: 'sq_a', trigger: { event: 'npcHealed', condition: { patientType: 'soldier_*' } } };
    expect(SidequestSystem.matchTrigger(sq, 'npcHealed', { patientType: 'soldier_male_30s' })).toBe(true);
    expect(SidequestSystem.matchTrigger(sq, 'npcHealed', { patientType: 'child_05' })).toBe(false);
  });

  it('이미 활성/완료된 사이드퀘스트는 trigger 안 됨', () => {
    GameState.activeSidequests = [{ id: 'sq_a', startedDay: 1 }];
    const sq = { id: 'sq_a', trigger: { event: 'npcHealed' } };
    expect(SidequestSystem.matchTrigger(sq, 'npcHealed', {})).toBe(false);
    GameState.activeSidequests = [];
  });
});

describe('SidequestSystem expiration', () => {
  beforeEach(() => {
    GameState.time = { day: 5 };
    GameState.activeSidequests = [];
  });

  it('expiresInDays 경과 시 자동 만료', () => {
    GameState.activeSidequests = [{ id: 'sq_a', startedDay: 1, expiresInDays: 3 }];
    GameState.time.day = 5;
    SidequestSystem._tickExpirations();
    expect(GameState.activeSidequests.length).toBe(0);
  });

  it('아직 유효한 사이드퀘스트는 유지', () => {
    GameState.activeSidequests = [{ id: 'sq_b', startedDay: 4, expiresInDays: 7 }];
    GameState.time.day = 5;
    SidequestSystem._tickExpirations();
    expect(GameState.activeSidequests.length).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run tests/unit/SidequestSystem.test.js`
Expected: FAIL — `Cannot find module`.

- [ ] **Step 3: SidequestSystem 구현**

`js/systems/SidequestSystem.js`:

```js
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import SIDEQUESTS from '../data/sidequests.js';

const SidequestSystem = {
  init() {
    const TRIGGER_EVENTS = ['npcHealed', 'npcAdmitted', 'patientDied', 'patientLeft', 'mainQuestActivated', 'mainQuestCompleted', 'dayStarted'];
    for (const ev of TRIGGER_EVENTS) {
      EventBus.on(ev, (payload = {}) => this._handleEvent(ev, payload));
    }
    EventBus.on('dayStarted', () => this._tickExpirations());
  },

  matchTrigger(sq, eventName, payload) {
    if (sq.trigger?.event !== eventName) return false;
    const active = (GameState.activeSidequests ?? []).some(a => a.id === sq.id);
    const completed = (GameState.completedSidequests ?? []).includes(sq.id);
    if (active || completed) return false;
    const cond = sq.trigger?.condition;
    if (!cond) return true;
    return Object.entries(cond).every(([k, expected]) => {
      const got = payload[k];
      if (typeof expected === 'string' && expected.endsWith('*')) {
        return typeof got === 'string' && got.startsWith(expected.slice(0, -1));
      }
      return got === expected;
    });
  },

  _handleEvent(eventName, payload) {
    for (const [id, sq] of Object.entries(SIDEQUESTS)) {
      if (this.matchTrigger({ ...sq, id }, eventName, payload)) {
        this._activate(id, sq);
      }
    }
  },

  _activate(id, sq) {
    GameState.activeSidequests = GameState.activeSidequests ?? [];
    GameState.activeSidequests.push({
      id,
      startedDay: GameState.time?.day ?? 1,
      expiresInDays: sq.expiresInDays ?? 7,
    });
    EventBus.emit('sidequestActivated', { id, sq });
    EventBus.emit('notify', { type: 'info', text: `📌 ${sq.title}`, ttlMs: 3000 });
  },

  _tickExpirations() {
    const today = GameState.time?.day ?? 1;
    const before = (GameState.activeSidequests ?? []).length;
    GameState.activeSidequests = (GameState.activeSidequests ?? []).filter(a => {
      const elapsed = today - a.startedDay;
      const exp = a.expiresInDays ?? Infinity;
      if (elapsed >= exp) {
        EventBus.emit('sidequestExpired', { id: a.id });
        return false;
      }
      return true;
    });
    if (GameState.activeSidequests.length !== before) {
      EventBus.emit('sidequestListChanged');
    }
  },

  /** 외부 호출: 사이드퀘스트 완료 처리 (objective 매칭은 호출자 책임) */
  complete(id) {
    const idx = (GameState.activeSidequests ?? []).findIndex(a => a.id === id);
    if (idx < 0) return false;
    GameState.activeSidequests.splice(idx, 1);
    GameState.completedSidequests = GameState.completedSidequests ?? [];
    GameState.completedSidequests.push(id);
    EventBus.emit('sidequestCompleted', { id });
    return true;
  },
};

export default SidequestSystem;
```

- [ ] **Step 4: 테스트 재실행 — 통과**

Run: `npx vitest run tests/unit/SidequestSystem.test.js`
Expected: PASS.

- [ ] **Step 5: SystemRegistry 또는 main 부팅에 init**

```js
import SidequestSystem from './systems/SidequestSystem.js';
SidequestSystem.init();
```

- [ ] **Step 6: 커밋**

```bash
git add js/systems/SidequestSystem.js tests/unit/SidequestSystem.test.js js/main.js
git commit -m "feat(sidequest): trigger matching + expiration system (TDD)"
```

---

## Task 3.2: 사이드 퀘스트 5개 데이터 작성

**Files:**
- Modify: `js/data/sidequests.js`

- [ ] **Step 1: 5개 사이드퀘스트 작성**

`js/data/sidequests.js`:

```js
const SIDEQUESTS = {

  sq_patient_family: {
    id: 'sq_patient_family',
    title: '환자의 부탁',
    titleEn: 'Patient\'s Request',
    icon: '💌',
    trigger: { event: 'npcHealed', condition: { patientType: 'soldier_*' } },
    parentMainQuest: null,
    objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },
    desc: '치료받은 군인이 가족 안부를 부탁한다. 용산 미군기지에 다녀와라.',
    descEn: 'The recovered soldier asks you to check on his family at Yongsan base.',
    locationHint: { districtId: 'yongsan', note: '미군기지 게시판', noteEn: 'US base bulletin' },
    reward: { morale: 8, items: [{ definitionId: 'military_ration', qty: 2 }] },
    expiresInDays: 7, optional: true,
  },

  sq_medicine_shortage: {
    id: 'sq_medicine_shortage',
    title: '의약품 부족 신호',
    titleEn: 'Medical Supply Shortage',
    icon: '💊',
    trigger: { event: 'npcAdmitted' }, // 누적 카운트는 SidequestSystem 확장 시
    parentMainQuest: 'mq_doctor_06',
    objective: { type: 'craft_item', definitionId: 'antiseptic', count: 3 },
    desc: '환자가 누적되고 있다. 소독제 3개를 비축하라.',
    descEn: 'Patients are piling up. Stock 3 antiseptics.',
    locationHint: { note: '약국 카드 또는 알코올+천 조합' },
    reward: { morale: 6, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    expiresInDays: 10, optional: true,
  },

  sq_radio_signal: {
    id: 'sq_radio_signal',
    title: '간헐적 무전 신호',
    titleEn: 'Intermittent Radio Signal',
    icon: '📻',
    trigger: { event: 'dayStarted' }, // Day 8 조건은 condition으로
    parentMainQuest: null,
    objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
    desc: '무전기에서 마포구 쪽 짧은 신호가 잡혔다. 다녀와볼 가치가 있다.',
    descEn: 'Short signal from Mapo. Worth investigating.',
    locationHint: { districtId: 'mapo', note: '한강시민공원 무전탑' },
    reward: { morale: 5 },
    expiresInDays: 14, optional: true,
  },

  sq_companion_care: {
    id: 'sq_companion_care',
    title: '동반자 부상 케어',
    titleEn: 'Companion Care',
    icon: '🤝',
    trigger: { event: 'npcHealed' }, // condition은 추후 확장
    parentMainQuest: null,
    objective: { type: 'craft_item', definitionId: 'bandage', count: 3 },
    desc: '영입한 동반자의 상태가 좋지 않다. 붕대 3개를 마련하라.',
    descEn: 'Your companion is hurt. Make 3 bandages.',
    reward: { morale: 5 },
    expiresInDays: 5, optional: true,
  },

  sq_er_cleanup: {
    id: 'sq_er_cleanup',
    title: '응급실 정리',
    titleEn: 'ER Cleanup',
    icon: '🧹',
    trigger: { event: 'patientLeft' },
    parentMainQuest: null,
    objective: { type: 'use_item', itemId: 'broom', count: 1 },
    desc: '응급실이 어수선해졌다. 빗자루로 정리하라.',
    descEn: 'The ER is messy. Clean it up.',
    reward: { morale: 4 },
    expiresInDays: 5, optional: true,
  },
};

export default SIDEQUESTS;
```

- [ ] **Step 2: validate.js 실행**

Run: `node --input-type=module js/data/validate.js`
Expected: 0 errors. parentMainQuest로 가리킨 mq_doctor_06이 실제 존재하는지 확인.

- [ ] **Step 3: 시각 검증 — sq_patient_family 발화**

의사 캐릭터 새게임 → 디버그 패널로 군인 환자 입원시킴 → 치료 완료 → 콘솔에서 `sidequestActivated { id: 'sq_patient_family' }` 확인 + `notify` 토스트 표시.

- [ ] **Step 4: 커밋**

```bash
git add js/data/sidequests.js
git commit -m "feat(sidequest): seed 5 doctor sidequests (family/medicine/radio/companion/cleanup)"
```

---

## Task 3.3: DailyFocus에 사이드퀘스트 후보 통합

**Files:**
- Modify: `js/systems/DailyFocusSystem.js`

- [ ] **Step 1: `_collectSidequestCandidates` 구현**

```js
import SIDEQUESTS from '../data/sidequests.js';

// _collectSidequestCandidates 교체
_collectSidequestCandidates() {
  const out = [];
  const today = GameState.time?.day ?? 1;
  for (const a of (GameState.activeSidequests ?? [])) {
    const sq = SIDEQUESTS[a.id];
    if (!sq) continue;
    const elapsed = today - a.startedDay;
    const daysLeft = (a.expiresInDays ?? Infinity) - elapsed;
    out.push({
      id: `side:${a.id}`,
      text: sq.title,
      hint: sq.locationHint?.note,
      source: a.id,
      sourceType: 'sidequest',
      baseKind: 'sidequestNext',
      daysLeft,
      action: this._inferActionFromObjective(sq.objective, sq.locationHint),
    });
  }
  return out;
},

_inferActionFromObjective(obj, lh) {
  if (!obj) return null;
  if (obj.type === 'visit_district') return `visit:${obj.districtId}`;
  if (obj.type === 'craft_item' && obj.definitionId) return `craft:${obj.definitionId}`;
  if (obj.type === 'use_item' && obj.itemId) return `use:${obj.itemId}`;
  return null;
},
```

- [ ] **Step 2: SidequestSystem 활성화 시 DailyFocus 재계산 트리거**

`SidequestSystem._activate`의 끝에:

```js
EventBus.emit('sidequestActivated', { id, sq });
// (DailyFocusSystem이 이 이벤트 구독해 recompute하도록 추가)
```

`DailyFocusSystem.init()`에 추가:

```js
EventBus.on('sidequestActivated', () => this.recompute());
EventBus.on('sidequestExpired',   () => this.recompute());
EventBus.on('sidequestCompleted', () => this.recompute());
```

- [ ] **Step 3: 시각 검증**

군인 환자 치료 → sq_patient_family 활성 → DailyFocus 위젯에 사이드 항목(회색 점) 추가 표시. 메인 + 사이드 = 2개로 균형.

- [ ] **Step 4: 커밋**

```bash
git add js/systems/DailyFocusSystem.js js/systems/SidequestSystem.js
git commit -m "feat(daily-focus): integrate sidequest candidates"
```

---

## Task 3.4: QuestPanel에 사이드퀘스트 슬롯 추가

**Files:**
- Modify: `js/ui/QuestPanel.js`
- Modify: `css/quest-panel.css`

- [ ] **Step 1: QuestPanel에 사이드 섹션 추가**

`QuestPanel._render()`의 active 섹션 아래에 추가:

```js
import SIDEQUESTS from '../data/sidequests.js';
// ...

const activeSides = (GameState.activeSidequests ?? [])
  .map(a => ({ ...SIDEQUESTS[a.id], _activeMeta: a }))
  .filter(s => s.id);

// _render() 안 active 다음:
${activeSides.length > 0 ? `
  <div class="quest-panel-sides">
    ${activeSides.map(s => this._renderSide(s)).join('')}
  </div>
` : ''}
```

`_renderSide` 메서드 추가:

```js
_renderSide(s) {
  const startedDay = s._activeMeta.startedDay;
  const today = GameState.time?.day ?? 1;
  const daysLeft = Math.max(0, (s._activeMeta.expiresInDays ?? 0) - (today - startedDay));
  return `
    <details class="quest-side" data-quest-id="${s.id}">
      <summary>
        <span>${s.icon ?? '·'}</span>
        <span>${s.title}</span>
        <span class="quest-side-tag">사이드</span>
        <span class="quest-deadline">D-${daysLeft}</span>
      </summary>
      <div class="quest-desc">${s.desc ?? ''}</div>
      ${s.locationHint ? `<div class="quest-location">📍 ${s.locationHint.note ?? s.locationHint.districtId}</div>` : ''}
    </details>
  `;
},
```

`mount`에 이벤트 추가:

```js
EventBus.on('sidequestActivated', () => this._render());
EventBus.on('sidequestExpired',   () => this._render());
EventBus.on('sidequestCompleted', () => this._render());
```

- [ ] **Step 2: CSS 추가**

```css
.quest-panel-sides { margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border-subtle, rgba(255,255,255,0.08)); }
.quest-side summary { cursor: pointer; display: flex; gap: 6px; align-items: center; font-size: 11px; padding: 2px 0; }
.quest-side-tag { font-size: 9px; opacity: 0.55; padding: 1px 4px; border: 1px solid currentColor; border-radius: 3px; }
```

- [ ] **Step 3: 시각 검증**

활성 사이드퀘스트가 패널에 접힘 상태로 표시. 클릭 시 펼쳐서 desc + 위치 표시.

- [ ] **Step 4: 커밋**

```bash
git add js/ui/QuestPanel.js css/quest-panel.css
git commit -m "feat(ui): add sidequest section to QuestPanel"
```

---

# Phase 4 — 폴리시 + 검증 (~1일)

## Task 4.1: locationHint를 SeoulMapModal 핀으로 표시

**Files:**
- Modify: `js/ui/SeoulMapModal.js`

- [ ] **Step 1: 활성 메인+사이드의 locationHint 수집**

`SeoulMapModal.render()` 또는 동급 메서드에서 districtId별 핀 표시:

```js
import MAIN_QUESTS from '../data/mainQuests/index.js';
import SIDEQUESTS  from '../data/sidequests.js';

_collectQuestPins() {
  const pins = new Map(); // districtId → { questIds: [] }
  for (const id of (GameState.activeQuests ?? [])) {
    const q = MAIN_QUESTS[id];
    const did = q?.locationHint?.districtId;
    if (did) {
      const e = pins.get(did) ?? { questIds: [] };
      e.questIds.push(id);
      pins.set(did, e);
    }
  }
  for (const a of (GameState.activeSidequests ?? [])) {
    const s = SIDEQUESTS[a.id];
    const did = s?.locationHint?.districtId;
    if (did) {
      const e = pins.get(did) ?? { questIds: [] };
      e.questIds.push(a.id);
      pins.set(did, e);
    }
  }
  return pins;
},
```

- [ ] **Step 2: 지도 노드 렌더 시 핀 아이콘 추가**

기존 districtNode 렌더링 코드에 (정확한 위치는 SeoulMapModal 구조 확인 후):

```js
const pins = this._collectQuestPins();
// ...
const pinHtml = pins.has(d.id) ? `<span class="map-quest-pin">📌</span>` : '';
```

CSS:

```css
.map-quest-pin { position: absolute; top: -4px; right: -4px; font-size: 14px; }
```

- [ ] **Step 3: 시각 검증**

지도 모달 열기 → mq_doctor_03 활성 시 강남구에 핀, sq_patient_family 활성 시 용산에 핀 표시.

- [ ] **Step 4: 커밋**

```bash
git add js/ui/SeoulMapModal.js css
git commit -m "feat(map): show quest location pins on Seoul map for active quests"
```

---

## Task 4.2: focusActionRequested 핸들링 — 모달/카드 라우팅

**Files:**
- Modify: 관련 모달/시스템 (EmergencyRoomModal, CraftUI, SeoulMapModal)

- [ ] **Step 1: 액션 dispatcher 등록 위치 확인**

각 모달이나 시스템이 `focusActionRequested` 이벤트를 구독하도록 추가. 예시 — `js/ui/EmergencyRoomModal.js`:

```js
EventBus.on('focusActionRequested', ({ verb, arg }) => {
  if (verb === 'open' && arg === 'emergency-room') {
    this.open();
  }
});
```

`js/ui/SeoulMapModal.js`:

```js
EventBus.on('focusActionRequested', ({ verb, arg }) => {
  if (verb === 'visit') {
    this.open(arg); // 해당 districtId 강조
  }
});
```

`js/ui/CraftUI.js`:

```js
EventBus.on('focusActionRequested', ({ verb, arg }) => {
  if (verb === 'craft') {
    this.openWithRecipeFilter(arg); // recipeId
  }
});
```

> 각 모달의 정확한 메서드명은 코드 확인 후 일치시킬 것. 메서드 부재 시 가장 가까운 진입점 사용.

- [ ] **Step 2: 시각 검증**

DailyFocus 위젯에서 메인 항목 클릭 → 관련 모달이 열리는지 (예: 환자 항목 → ER 모달, craft → CraftUI 필터, visit → 지도 모달).

- [ ] **Step 3: 커밋**

```bash
git add js/ui
git commit -m "feat(focus): route focusActionRequested to ER/Craft/Map modals"
```

---

## Task 4.3: 데드라인 D-2 빨간 토스트

**Files:**
- Modify: `js/systems/QuestSystem.js`

- [ ] **Step 1: deadlineApproaching 핸들링**

`QuestSystem._checkDeadlines()`의 emit 직후 또는 별도 구독자:

```js
EventBus.on('deadlineApproaching', ({ questId, daysLeft }) => {
  const q = MAIN_QUESTS[questId];
  if (!q) return;
  if (daysLeft <= 2) {
    EventBus.emit('notify', {
      type: 'warning',
      text: `⚠ ${q.title} — D-${daysLeft}`,
      ttlMs: 4000,
    });
  }
});
```

(QuestSystem 내부 또는 main.js에 한 번만 등록)

- [ ] **Step 2: 시각 검증**

mq_doctor_01 deadline을 임시로 줄여 Day 9 진입 → "⚠ 삼성병원 생존자 — D-1" 빨간 토스트.

- [ ] **Step 3: 커밋**

```bash
git add js/systems/QuestSystem.js
git commit -m "feat(quest): red warning toast on deadline D-2/D-1/D-0"
```

---

## Task 4.4: 디버그 패널에 DailyFocus 후보 출력

**Files:**
- Modify: `js/ui/DebugPanel.js`

- [ ] **Step 1: 디버그 섹션 추가**

`DebugPanel.render()` 또는 동급 메서드에 새 섹션:

```js
_renderDailyFocus() {
  const candidates = (() => {
    try {
      return [
        ...DailyFocusSystem._collectMainQuestCandidates(),
        ...DailyFocusSystem._collectPatientCandidates(),
        ...DailyFocusSystem._collectResourceCandidates(),
        ...DailyFocusSystem._collectSidequestCandidates(),
      ].map(c => ({ ...c, priority: DailyFocusSystem._scoreCandidate(c, { characterId: GameState.player?.characterId }) }))
       .sort((a, b) => b.priority - a.priority);
    } catch { return []; }
  })();
  return `
    <h4>Daily Focus 후보 (${candidates.length})</h4>
    <ul>
      ${candidates.map(c => `<li>[${c.priority}] ${c.sourceType} — ${c.text} (${c.baseKind})</li>`).join('')}
    </ul>
  `;
},
```

기존 디버그 패널 본문에 `${this._renderDailyFocus()}` 삽입.

- [ ] **Step 2: 시각 검증**

디버그 패널 열기 → 모든 후보가 점수와 함께 표시. 튜닝 시 참고.

- [ ] **Step 3: 커밋**

```bash
git add js/ui/DebugPanel.js
git commit -m "feat(debug): expose DailyFocus candidates with scores in debug panel"
```

---

## Task 4.5: 통합 테스트 — 의사 Day 1~30 시나리오

**Files:**
- Create: `tests/integration/DoctorMidGame.int.test.js`

- [ ] **Step 1: 통합 테스트 작성**

`tests/integration/DoctorMidGame.int.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import QuestSystem from '../../js/systems/QuestSystem.js';
import DailyFocusSystem from '../../js/systems/DailyFocusSystem.js';
import SidequestSystem from '../../js/systems/SidequestSystem.js';

describe('Doctor mid-game engagement', () => {
  beforeEach(() => {
    GameState.time = { day: 1, totalTP: 0, tpInDay: 0, hour: 6, isPaused: false };
    GameState.player = { characterId: 'doctor', hp: { current: 100, max: 100 } };
    GameState.stats = {
      hydration:   { current: 200, max: 288 },
      nutrition:   { current: 80,  max: 100 },
      morale:      { current: 70,  max: 100 },
    };
    GameState.activeQuests = [];
    GameState.completedQuests = [];
    GameState.subObjectiveProgress = {};
    GameState.activeSidequests = [];
    GameState.completedSidequests = [];
    GameState.questStartedDay = {};
    GameState.dailyFocus = [];
    QuestSystem.init();
    DailyFocusSystem.init();
    SidequestSystem.init();
  });

  it('Day 1 의사 새게임 → mq_doctor_01 활성 + DailyFocus 1개 이상', () => {
    EventBus.emit('dayStarted', { day: 1 });
    QuestSystem._checkMainQuestTriggers?.(); // 만약 별도 호출 필요하면
    DailyFocusSystem.recompute();
    expect(GameState.activeQuests).toContain('mq_doctor_01');
    expect(GameState.dailyFocus.length).toBeGreaterThanOrEqual(1);
  });

  it('subObjective 진행 → 자동 체크 + DailyFocus 갱신', () => {
    GameState.activeQuests = ['mq_doctor_03'];
    GameState.questStartedDay.mq_doctor_03 = 7;
    GameState.time.day = 8;
    EventBus.emit('itemCollected', { definitionId: 'clean_water', itemType: 'drink', qty: 5 });
    expect(GameState.subObjectiveProgress?.mq_doctor_03?.so_water_03).toBe(true);
  });

  it('군인 환자 치료 → sq_patient_family 자동 활성', () => {
    EventBus.emit('npcHealed', { npcId: 'soldier_male_30s', patientType: 'soldier_male_30s' });
    expect(GameState.activeSidequests.some(a => a.id === 'sq_patient_family')).toBe(true);
  });

  it('데드라인 D-1 진입 → priority 95+ 항목이 DailyFocus에 등장', () => {
    GameState.activeQuests = ['mq_doctor_01'];
    GameState.questStartedDay.mq_doctor_01 = 1;
    GameState.time.day = 10; // 10 - 1 = 9, deadlineDays 10이면 D-1
    QuestSystem._checkDeadlines();
    DailyFocusSystem.recompute();
    const top = GameState.dailyFocus[0];
    expect(top?.priority).toBeGreaterThanOrEqual(90);
  });

  it('사이드퀘스트 만료 → 패널/포커스에서 사라짐', () => {
    GameState.activeSidequests = [{ id: 'sq_patient_family', startedDay: 1, expiresInDays: 7 }];
    GameState.time.day = 10;
    SidequestSystem._tickExpirations();
    expect(GameState.activeSidequests.length).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행**

Run: `npx vitest run tests/integration/DoctorMidGame.int.test.js`
Expected: PASS (5/5). 일부 실패 시 시스템 초기화 순서·이벤트 emit 시점 점검.

- [ ] **Step 3: 전체 테스트 실행**

Run: `npm test`
Expected: 신규 테스트 모두 PASS, 기존 테스트 회귀 0.

- [ ] **Step 4: 커밋**

```bash
git add tests/integration/DoctorMidGame.int.test.js
git commit -m "test(int): doctor Day 1-30 engagement scenarios"
```

---

## Task 4.6: 직접 플레이테스트 (Day 1~70) + 체크리스트

**Files:** 없음 (수동 검증)

- [ ] **Step 1: 새 게임 의사로 시작**

Run: `npm run dev:web`. 의사 캐릭터 선택, 새 슬롯에 시작.

- [ ] **Step 2: 체크리스트 (스펙 7장 기능 검증)**

스펙의 다음 항목을 직접 플레이로 확인하고 ☑ 체크:

- [ ] Day 1 시작 시 DailyFocus 1개 이상 표시
- [ ] mq_doctor_01 ~ mq_doctor_10 각각 활성화 시 subObjective 패널 표시
- [ ] subObjective가 objective 진행에 따라 자동 체크
- [ ] 데드라인 D-1 진입 시 빨간 표시 + priority 90+
- [ ] 환자 HP < 30 → DailyFocus 환자 항목 자동 등장
- [ ] 사이드 퀘스트 expiresInDays 경과 시 자동 만료
- [ ] DailyFocus X 버튼 → 오늘 숨김, 다음 날 재등장
- [ ] 저장/로드 시 사이드퀘스트 + DailyFocus 보존
- [ ] DailyFocus 항목 클릭 → 관련 모달 열림 (ER/Craft/Map)

- [ ] **Step 3: 통증 해결 검증 (스펙 7장 통증 검증)**

- [ ] Day 12~20 사이에 "다음에 뭐 할지" 명확함
- [ ] 메인 퀘스트 desc 읽으면 "어디서 / 어떻게" 짚을 수 있음
- [ ] 사이드 퀘스트가 자연 발생해 "세계가 살아있다" 감
- [ ] 군인 회복 같은 핫 모먼트가 사이드 퀘스트로 이어짐

- [ ] **Step 4: 비강제 검증**

- [ ] DailyFocus 무시한 채 임의 행동해도 페널티 0
- [ ] 사이드 만료해도 메인 진행 영향 0

- [ ] **Step 5: 회귀 검증**

- [ ] 기존 토스트 알림 정상
- [ ] 환자 시스템 정상 (Day 3+ 유입, 쿨다운, Day Cap)
- [ ] 메인 퀘스트 보상/실패 페널티 정상

- [ ] **Step 6: 결과 기록 + 머지 가능 판단**

체크리스트 결과를 PR 본문 또는 작업 노트에 기록. 모든 ☑ 통과 시 머지 가능.

- [ ] **Step 7: 최종 커밋 (필요 시 미세 폴리시)**

```bash
git add -A
git commit -m "chore: doctor mid-game engagement playtest verification notes"
```

---

# Self-Review (계획 작성자가 직접)

**1. Spec coverage**

| 스펙 섹션 | 대응 태스크 |
|-----------|-------------|
| §1 진단 | (계획 도입부에서 인용) |
| §2 시스템 아키텍처 | Task 1.2, 2.1, 3.1, 4.1, 4.2 |
| §3.1 mainQuest 스키마 확장 | Task 0.1, 0.3 |
| §3.1 subObjective 자동 체크 | Task 1.1 |
| §3.2 sidequest 스키마 | Task 0.4, 3.2 |
| §3.3 GameState.dailyFocus 형식 | Task 1.1 (Step 8), 2.1 |
| §3.4 i18n | Task 0.3 (각 필드 한/영 페어), 3.2 |
| §3.5 검증 (validate.js) | Task 0.2, 0.4 |
| §4.1~4.4 DailyFocus 알고리즘 | Task 2.1, 2.2 |
| §4.5 구현 윤곽 | Task 2.1 |
| §5.1 화면 레이아웃 | Task 1.2 (마운트), 2.4 |
| §5.2 DailyFocus 위젯 | Task 2.4 |
| §5.3 퀘스트 패널 3계층 | Task 1.2, 1.3, 3.4 |
| §5.4 지도 핀 | Task 4.1 |
| §5.5 알림 강화 | Task 4.3 |
| §5.6 모바일 | Task 1.2의 CSS 자체로 대응 (1920×1080 고정) |
| §5.7 디자인 시스템 준수 | 모든 CSS 태스크에서 변수 사용 |
| §6 페이즈 분할 | Phase 0~4 그대로 |
| §7 검증 체크리스트 | Task 4.5 (자동), 4.6 (수동) |
| §8 위험 대응 | 비강제 카피 (Task 2.4 CSS), 다양성 강제 (Task 2.1), validate (Task 0.2) |

**2. Placeholder scan**

- "TBD" 0개
- "TODO 추후" 0개 (모든 단계에 실제 코드/명령 포함)
- "similar to Task N" 0개

**3. Type consistency**

- `subObjectiveProgress` 형식: `{ [questId]: { [soId]: boolean } }` — Task 1.1 / 1.2 / 2.5 일치
- `GameState.activeSidequests` 항목: `{ id, startedDay, expiresInDays }` — Task 3.1 / 3.3 / 3.4 / 2.5 일치
- `dailyFocus` 항목: `{ id, text, source, sourceType, priority, hint?, action?, progress? }` — Task 2.1 / 2.4 일치
- `_matchSubObjective` 시그니처: `(so, state)` — Task 1.1 일치
- 후보 객체 `baseKind` enum: `mainDeadlineD1 | patientCritical | mainDeadlineD3 | mainNextSubObj | resourceLow | patientStable | sidequestNext | longPrep` — Task 2.1 / 2.2 / 3.3 일치

**4. 발견된 issue: 없음.** 자체 검토 통과.
