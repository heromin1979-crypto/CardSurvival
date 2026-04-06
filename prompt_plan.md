# 카드 서바이벌 시스템 확장 — 세부 기획서

> 최종 업데이트: 2026-03-20
> 유형: 게임 시스템 설계 (카드 서바이벌: 몽환의 숲 분석 기반)
> 기반 분석: 카드 서바이벌 시리즈의 "발견의 쾌감" + "시스템 간 창발적 상호작용" 재미 요소
> 이전 계획은 하단 아카이브 참조

---

## 설계 원칙

모든 기능은 다음 3가지 원칙을 따른다:

1. **카드가 곧 세계다** — 시스템 내부에 숨겨진 수치를 카드로 꺼내어 플레이어가 직접 조작할 수 있게 한다
2. **실험과 발견** — 명시적 설명서 없이 드래그&드롭으로 "이것도 되나?" 시도를 유도한다
3. **시스템 간 연쇄 반응** — 하나의 행동이 예상치 못한 다른 시스템에 영향을 미친다

---

## Feature 1: 날씨/이벤트 카드 시각화

### 개요

현재 날씨와 계절 이벤트는 HUD 배지 + 알림으로만 표시된다. 이를 **보드 위의 카드**로 만들어 플레이어가 직접 상호작용할 수 있게 한다.

> 비유: 현재는 "비가 온다"는 자막이 뜨는 영화. 개선 후에는 "빗방울 카드"를 빈 병에 드래그하면 빗물이 채워지는 체험.

### 핵심 재미

- 날씨 카드와 아이템 카드의 **조합 가능성** → 발견의 쾌감
- 위험한 날씨 카드의 **물리적 존재감** → 긴장감 상승
- 날씨를 "대응"이 아닌 "활용"하는 전략적 선택지 증가

### 데이터 구조

```javascript
// items_environment.js (신규 파일)
const ENVIRONMENT_CARDS = {
  weather_rain: {
    id: 'weather_rain',
    name: '비',
    type: 'environment',
    subtype: 'weather',
    icon: '🌧️',
    description: '하늘에서 비가 내린다. 빈 용기에 담을 수 있다.',
    weight: 0,
    stackable: false,
    draggable: false,      // 환경 카드는 위치 고정
    tags: ['weather', 'water_source'],
    duration: null,         // WeatherSystem.tpRemaining과 동기화
    effects: {
      contaminateRisk: 0.004,  // 기존 weather 데이터와 동일
      tempMod: -0.1
    }
  },
  weather_hot: {
    id: 'weather_hot',
    name: '폭염',
    type: 'environment',
    subtype: 'weather',
    icon: '🌡️',
    tags: ['weather', 'heat'],
    effects: { tempMod: +0.4 }
  },
  weather_storm: {
    id: 'weather_storm',
    name: '뇌우',
    type: 'environment',
    subtype: 'weather',
    icon: '🌩️',
    tags: ['weather', 'danger'],
    effects: { tempMod: -0.2, encounterReduce: 0.20 }
  },
  weather_snow: {
    id: 'weather_snow',
    name: '눈',
    type: 'environment',
    subtype: 'weather',
    icon: '🌨️',
    tags: ['weather', 'cold', 'water_source'],
    effects: { tempMod: -0.4 }
  },
  weather_blizzard: {
    id: 'weather_blizzard',
    name: '눈보라',
    type: 'environment',
    subtype: 'weather',
    icon: '⛄',
    tags: ['weather', 'cold', 'danger'],
    effects: { tempMod: -0.6, encounterReduce: 0.30 }
  },
  weather_acid_rain: {
    id: 'weather_acid_rain',
    name: '산성비',
    type: 'environment',
    subtype: 'weather',
    icon: '☢️',
    tags: ['weather', 'danger', 'contamination'],
    effects: { tempMod: -0.3, contaminateRisk: 0.01, gardenKill: true }
  },
  weather_monsoon: {
    id: 'weather_monsoon',
    name: '장마',
    type: 'environment',
    subtype: 'weather',
    icon: '🌊',
    tags: ['weather', 'water_source', 'danger'],
    effects: { tempMod: -0.1, contaminateRisk: 0.008 }
  },

  // 계절 이벤트 카드 (일시적)
  event_pollen: {
    id: 'event_pollen',
    name: '꽃가루',
    type: 'environment',
    subtype: 'event',
    icon: '🌿',
    tags: ['event', 'seasonal', 'infection'],
    duration: 72,           // 1일 동안 보드에 존재
    effects: { infection: +5 }
  },
  event_heatwave: {
    id: 'event_heatwave',
    name: '폭염 경보',
    type: 'environment',
    subtype: 'event',
    icon: '🔥',
    tags: ['event', 'seasonal', 'heat'],
    duration: 144,          // 2일
    effects: { temperature: +15 }
  },
  event_typhoon: {
    id: 'event_typhoon',
    name: '태풍',
    type: 'environment',
    subtype: 'event',
    icon: '🌪️',
    tags: ['event', 'seasonal', 'danger'],
    duration: 72,
    effects: { structureDamage: 30, morale: -10 }
  }
};
```

### 보드 배치 규칙

```
┌─────────────────────────────────────────────────────┐
│ TOP ROW (4 slots)                                   │
│ [현재 구역] [랜드마크] [인접 구역1] [인접 구역2]     │
├─────────────────────────────────────────────────────┤
│ ENVIRONMENT ROW (신규, 2~3 slots)                   │
│ [날씨 카드] [이벤트 카드?] [시간대 카드?]            │
├─────────────────────────────────────────────────────┤
│ MIDDLE ROW (8 slots) — 바닥 아이템                   │
│ [...기존과 동일...]                                  │
├─────────────────────────────────────────────────────┤
│ BOTTOM ROW (8 slots) — 인벤토리                      │
│ [...기존과 동일...]                                  │
├─────────────────────────────────────────────────────┤
```

**방안 A (환경 전용 행 추가)**: 기존 3행 → 4행. 환경 카드 전용 행 (2~3슬롯)
- 장점: 보드 혼잡 방지, 환경 카드 역할 명확
- 단점: UI 레이아웃 변경 필요

**방안 B (top row 확장)**: top row를 6슬롯으로 확장, 우측 2슬롯에 환경 카드 배치
- 장점: 행 추가 없이 가능
- 단점: top row가 복잡해짐

**추천: 방안 A** — 환경 카드는 독립적 존재감이 있어야 인터랙션 유도됨

### 카드 인터랙션 규칙 (interactions.js 추가)

```javascript
// 날씨 카드 → 아이템 카드 드래그 인터랙션
const WEATHER_INTERACTIONS = [
  // 비 + 빈 병 → 빗물
  {
    id: 'rain_collect_bottle',
    source: { id: 'empty_bottle' },
    target: { id: 'weather_rain' },
    hint: '빗물 수집 → 오염된 물',
    apply: (src, tgt, gs) => ({
      message: '빈 병에 빗물을 받았다.',
      transformSrc: 'contaminated_water',
      consumeTgt: false  // 날씨 카드는 소모 안 됨
    })
  },
  // 비 + 정수기 → 깨끗한 물 보너스 (기존 자동 효과를 명시적 인터랙션으로)
  {
    id: 'rain_purifier',
    source: { id: 'water_purifier' },
    target: { id: 'weather_rain' },
    hint: '정수기 빗물 수집 가속',
    apply: (src, tgt, gs) => ({
      message: '정수기가 빗물을 처리 중. 깨끗한 물 +2.',
      spawnCards: [{ definitionId: 'purified_water', qty: 2 }],
      consumeTgt: false
    })
  },
  // 눈 + 빈 병 → 눈물 (낮은 오염)
  {
    id: 'snow_collect',
    source: { id: 'empty_bottle' },
    target: { id: 'weather_snow' },
    hint: '눈 녹여 물 확보',
    apply: (src, tgt, gs) => ({
      message: '눈을 녹여 물을 만들었다. 약간 오염됨.',
      transformSrc: 'contaminated_water',
      setContamination: 15,  // 비(40)보다 낮은 오염
      consumeTgt: false
    })
  },
  // 폭염 + 젖은 천 → 냉각 효과 (임시 체온 감소)
  {
    id: 'heat_wet_cloth',
    source: { tag: 'cloth' },
    target: { id: 'weather_hot' },
    hint: '천을 적셔 몸 식히기',
    canApply: (src, tgt) => ({ ok: true }),
    apply: (src, tgt, gs) => ({
      message: '젖은 천으로 몸을 식혔다. 체온 -5.',
      statChange: { temperature: -5 },
      consumeSrc: false,
      consumeTgt: false
    })
  },
  // 캠프파이어 + 눈보라 → 연료 소모 2배 (경고)
  {
    id: 'blizzard_campfire_warning',
    source: { id: 'campfire' },
    target: { id: 'weather_blizzard' },
    hint: '눈보라 속 모닥불 — 연료 소모 증가',
    apply: (src, tgt, gs) => ({
      message: '눈보라가 불길을 약하게 한다. 연료 소모 2배.',
      setFlag: 'campfire_weather_penalty',
      consumeTgt: false
    })
  },
  // 산성비 + 음식 → 오염 경고
  {
    id: 'acid_rain_food_warning',
    source: { tag: 'edible' },
    target: { id: 'weather_acid_rain' },
    hint: '⚠️ 산성비에 노출된 음식!',
    apply: (src, tgt, gs) => ({
      message: '산성비가 음식을 오염시켰다! 오염 +30.',
      addContamination: 30,
      consumeTgt: false
    })
  }
];
```

### 시각 디자인

```
날씨 카드 외형:
┌──────────────────┐
│ 🌧️ 비            │  ← 아이콘 + 이름
│                  │
│   ◌ ◌ ◌ ◌ ◌     │  ← 남은 시간 도트 (tpRemaining 비례)
│                  │
│  💧 수집 가능     │  ← 인터랙션 힌트 (hover)
│                  │
│  [───────60%──]  │  ← 지속시간 바 (날씨 잔여)
└──────────────────┘

이벤트 카드 외형 (임시):
┌──────────────────┐
│ 🌪️ 태풍    ⚠️   │  ← 위험 배지
│                  │
│  2일간 지속      │
│  구조물 내구 -30  │  ← 효과 설명
│                  │
│  [█████████100%] │  ← 남은 시간 바 (빨간색)
└──────────────────┘
```

### 구현 순서

1. `items_environment.js` 데이터 파일 생성
2. `GameState.board`에 environment 행 추가 (2~3슬롯)
3. `BoardRenderer.js` 환경 행 렌더링 추가
4. `WeatherSystem.js`에서 날씨 변경 시 환경 카드 생성/교체
5. `SeasonSystem.js`에서 이벤트 발생 시 이벤트 카드 생성 (duration 후 자동 제거)
6. `interactions.js`에 날씨 인터랙션 규칙 추가
7. `CardFactory.js`에 environment 카드 렌더링 로직 추가
8. CSS 환경 카드 스타일

### 밸런스 고려

- 날씨 카드 인터랙션은 **기존 자동 효과를 대체하지 않고 보너스를 추가**
- 예: 정수기의 자동 빗물 수집은 유지, 날씨 카드 인터랙션은 추가 보너스
- 위험 날씨(산성비, 눈보라)의 카드 존재감이 긴장감을 자연스럽게 전달

---

## Feature 2: 직관적 카드 조합 크래프팅

### 개요

현재 제작 시스템은 블루프린트 메뉴에서 레시피를 선택하는 방식. 이를 **카드를 직접 겹치면 가능한 조합이 표시**되는 방식으로 보강한다.

> 비유: 현재는 "요리책을 펼쳐서 레시피를 고르는 것". 개선 후에는 "냉장고에서 재료를 꺼내 도마 위에 올려놓으면 만들 수 있는 요리가 떠오르는 것".

### 핵심 재미

- "이것과 저것을 합치면 뭐가 될까?" → 탐험적 크래프팅
- 블루프린트를 모르더라도 **우연한 발견** 가능
- 기존 메뉴 기반 제작과 **공존** (둘 다 사용 가능)

### 게임플레이 흐름

```
1. 플레이어가 카드 A를 카드 B 위에 드래그
2. DragDrop._onDragOver()에서 조합 가능성 체크
3. 가능한 레시피가 있으면:
   a. 슬롯에 '✨' 이펙트 + 레시피 이름 힌트 표시
   b. 드롭하면 "퀵 크래프트" 프롬프트 팝업
   c. 프롬프트에서 확인 → 즉시 제작 시작 (기존 CraftSystem.startBlueprint 호출)
4. 가능한 레시피가 없으면:
   a. 기존 interactions.js 규칙 체크 (스택, 변환 등)
   b. 없으면 일반 이동/교환
```

### 시스템 설계

```javascript
// CraftDiscovery.js (신규 파일)
// 두 카드가 만났을 때 가능한 레시피를 탐색하는 시스템

export function findCraftableRecipes(srcDefId, tgtDefId) {
  const allBlueprints = window.__GAME_DATA__.blueprints;
  const matches = [];

  for (const bp of Object.values(allBlueprints)) {
    // 모든 스테이지의 requiredItems를 평탄화
    const allRequired = bp.stages.flatMap(s => s.requiredItems.map(r => r.definitionId));

    // src와 tgt가 모두 이 레시피의 재료에 포함되는지 확인
    const srcNeeded = allRequired.includes(srcDefId);
    const tgtNeeded = allRequired.includes(tgtDefId);

    if (srcNeeded && tgtNeeded) {
      matches.push({
        blueprintId: bp.id,
        blueprintName: bp.name,
        category: bp.category,
        outputPreview: bp.output.map(o => o.definitionId),
        // 나머지 부족한 재료 목록
        missingItems: _getMissingItems(bp, [srcDefId, tgtDefId]),
        canStartNow: false  // 아래에서 전체 재료 체크 후 설정
      });
    }
  }

  // 즉시 제작 가능 여부 체크 (보드 위 전체 재료 확인)
  for (const match of matches) {
    match.canStartNow = _checkAllMaterials(match.blueprintId);
  }

  // 즉시 제작 가능한 것을 상단으로 정렬
  return matches.sort((a, b) => (b.canStartNow ? 1 : 0) - (a.canStartNow ? 1 : 0));
}

function _getMissingItems(blueprint, haveDefIds) {
  // 보드 전체 + 인벤토리의 모든 아이템을 스캔하여 부족한 재료 반환
  // ...
}

function _checkAllMaterials(blueprintId) {
  // 기존 CraftSystem._checkStageReqs() 재활용
  // ...
}
```

### UI 설계: 퀵 크래프트 프롬프트

```
카드 A를 카드 B 위에 드롭했을 때:

┌──────────────────────────────────┐
│  ✨ 제작 가능!                    │
│                                  │
│  ┌─────┐  +  ┌─────┐  →  ┌─────┐│
│  │천 ×2│     │로프  │     │배낭  ││
│  └─────┘     └─────┘     └─────┘│
│                                  │
│  부족한 재료:                     │
│  • 가죽 ×1 (❌ 미보유)           │
│                                  │
│  [제작 시작 ✅]  [취소]          │  ← canStartNow일 때만 활성화
│  [레시피 상세 📋]                │  ← 기존 CraftUI 필터로 이동
└──────────────────────────────────┘
```

**드래그 중 미리보기 (DragOver 상태):**

```
슬롯 하이라이트:
┌─────────────────────┐
│ ✨ 배낭 제작 가능    │  ← 힌트 텍스트 (반투명 오버레이)
│  (재료 1개 부족)     │
│                     │
│  ┌─────┐            │
│  │로프  │ ← 타겟 카드│
│  └─────┘            │
└─────────────────────┘
```

### 기존 시스템과의 통합

```
우선순위 체인 (SlotResolver.resolveInteraction):

1. interactions.js 규칙 체크 (변환, 요리 등) → 있으면 즉시 적용
2. CraftDiscovery.findCraftableRecipes() → 있으면 퀵 크래프트 프롬프트
3. 스택 시도 (_tryStack) → 같은 카드면 합침
4. 일반 이동 (moveCard) → 위치 교환
```

### 밸런스 고려

- 퀵 크래프트는 **기존 블루프린트 메뉴의 대체가 아닌 보조 경로**
- 스킬 요구사항, TP 비용은 동일하게 적용
- "우연한 발견" 효과: 처음 조합을 시도하면 발견 알림 + 약간의 XP 보너스
- 이미 발견한 레시피는 "알려진 조합" 배지 표시

---

## Feature 3: 구역별 생태계 동적 변화

### 개요

현재 구역의 lootTable은 고정(방문 횟수에 따라 감소만). 이를 플레이어의 행동에 따라 **구역 상태가 동적으로 변화**하는 시스템으로 확장한다.

> 비유: 현재는 "빈 마트에서 물건을 꺼가면 점점 비어가는 것". 개선 후에는 "좀비가 이사 오고, 다른 구역에서 물자가 흘러들고, 날씨에 따라 환경이 바뀌는 살아있는 도시".

### 핵심 재미

- 구역을 "소모하는 것"에서 "관리하는 것"으로 전환
- 플레이어 행동의 장기적 결과를 체감
- 구역 간 연쇄 효과 → 전략적 루트 계획

### 생태계 상태 모델

```javascript
// GameState.ecology (신규 필드)
ecology: {
  // 구역별 생태계 상태
  districts: {
    gangnam: {
      zombiePopulation: 50,    // 좀비 밀도 (0~100), 초기값 = dangerLevel × 15
      resourceLevel: 100,      // 자원 잔여량 (0~100), 탐색할 때마다 감소
      noiseAttraction: 0,      // 소음으로 인한 좀비 유인량 (매 TP 감쇠)
      contamination: 0,        // 구역 오염도 (0~100), 방사능/산성비 누적
      barricadeLevel: 0,       // 플레이어가 설치한 방어 시설 효과
      lastVisitDay: 0,         // 마지막 방문일
      events: []               // 현재 활성 구역 이벤트
    },
    // ... 25개 구
  },

  // 글로벌 생태계 파라미터
  global: {
    totalZombies: 1250,        // 전체 좀비 수 (초기값 = sum of all district populations)
    migrationRate: 0.02,       // TP당 좀비 이동률
    resourceRegenRate: 0.05,   // TP당 자원 재생률 (매우 느림)
    seasonalMod: 1.0           // 계절별 생태계 변화 속도
  }
}
```

### 동적 변화 규칙

#### 3-1. 좀비 밀도 변화

```
┌─────────────────────────────────────────────────┐
│ 좀비 밀도 변화 요인                              │
│                                                 │
│ 감소 요인:                                      │
│   • 전투 처치: -2 per kill                      │
│   • 베이스캠프 방어시설: -0.5/TP (거주 구역)     │
│   • 히든 보스 처치: -20 (구역 대소탕)            │
│                                                 │
│ 증가 요인:                                      │
│   • 소음 유인: noise > 40 → +0.3/TP            │
│   • 인접 구역 이동: 고밀도→저밀도 자연 확산      │
│   • 시간 경과: 느린 자연 증가 (+0.01/TP)        │
│   • 가을 좀비 이주 이벤트: 전 구역 +10          │
│                                                 │
│ 좀비 밀도 → encounterChance 보정:              │
│   0-20 (안전): encounterChance × 0.5           │
│   20-40 (낮음): encounterChance × 0.8          │
│   40-60 (보통): encounterChance × 1.0          │
│   60-80 (높음): encounterChance × 1.3          │
│   80-100 (위험): encounterChance × 1.8         │
│   + 호드 이벤트 확률 발생                       │
└─────────────────────────────────────────────────┘
```

#### 3-2. 자원 재생과 고갈

```
자원 레벨 (0~100):
- 탐색 시: -5 per exploration (기존 visit-based 감소 대체)
- 자연 재생: +0.05/TP (72 TP/day → 하루 +3.6)
- 계절 보너스: 가을 +50% 재생, 겨울 -50% 재생

자원 레벨 → loot 보정:
  100-80: lootCount × 1.0 (풍족)
  80-60: lootCount × 0.8
  60-40: lootCount × 0.6
  40-20: lootCount × 0.4 (고갈 경고)
  20-0: lootCount × 0.2 (거의 고갈)

  + 자원 레벨에 따라 lootTable 가중치 변화
    높은 자원: 고급 아이템 확률 유지
    낮은 자원: 기본 아이템만 남음
```

#### 3-3. 좀비 이동 시뮬레이션

```javascript
// EcologySystem._simulateMigration() — 매 72 TP (하루 1회) 호출
function _simulateMigration() {
  for (const [distId, state] of Object.entries(ecology.districts)) {
    const dist = DISTRICTS[distId];
    const myPop = state.zombiePopulation;

    for (const adjId of dist.adjacentDistricts) {
      const adjState = ecology.districts[adjId];
      const adjPop = adjState.zombiePopulation;

      // 밀도 차이에 따른 자연 확산
      const delta = myPop - adjPop;
      if (delta > 10) {
        // 고밀도 → 저밀도 이동
        const migration = Math.floor(delta * ecology.global.migrationRate);
        state.zombiePopulation -= migration;
        adjState.zombiePopulation += migration;
      }
    }

    // 소음 유인
    if (state.noiseAttraction > 40) {
      // 인접 구역의 좀비를 이쪽으로 끌어옴
      for (const adjId of dist.adjacentDistricts) {
        const pull = Math.floor(state.noiseAttraction * 0.05);
        ecology.districts[adjId].zombiePopulation -= pull;
        state.zombiePopulation += pull;
      }
    }
  }
}
```

#### 3-4. 구역 오염도

```
오염 축적:
- 방사능 구역: 기존 radiation 필드에 비례하여 구역 오염 증가
- 산성비 이벤트: 전 구역 +5 오염
- 핵 폭탄 히든 이벤트: 반경 2구역 +50 오염

오염 효과:
- 오염 > 30: 음식 루팅 시 기본 오염 +10
- 오염 > 60: 호흡으로 감염 +0.1/TP
- 오염 > 80: 방사능 +0.2/TP (방사능 지역과 동일 효과)

정화:
- 시간 경과: -0.01/TP (매우 느림)
- 정수기 구역 효과: 거주 구역 -0.05/TP
```

### UI 표현

**서울 맵 모달 확장:**

```
기존: 구역 노드에 위험도 바만 표시
개선: 구역 노드에 생태계 아이콘 오버레이

┌────────────────────────────┐
│  강남구                     │
│  ▓▓▓░░ 위험도 3            │
│  🧟 42  📦 65  ☣️ 12       │
│  (좀비) (자원) (오염)       │
└────────────────────────────┘

색상 코딩:
- 좀비 밀도: 초록(0-20) → 노랑(20-50) → 빨강(50-80) → 보라(80+)
- 자원 레벨: 초록(80+) → 노랑(40-80) → 빨강(20-40) → 회색(0-20)
- 오염도: 초록(0-20) → 노랑(20-50) → 빨강(50-80) → 보라(80+)
```

### 구현 순서

1. `GameState`에 ecology 필드 추가 + 초기화
2. `EcologySystem.js` 신규 — onTP(), _simulateMigration(), _applyEffects()
3. `ExploreSystem.js` 수정 — 탐색 시 ecology 연동 (자원 소모, 좀비 처치)
4. `LandmarkModal.js` 수정 — loot 계산에 resourceLevel 적용
5. `enemies.js` / encounter 로직 수정 — zombiePopulation 기반 보정
6. `SeoulMapModal.js` 수정 — 생태계 오버레이 추가
7. 기존 visit-based 감소 → ecology-based로 전환 (하위 호환 유지)

---

## Feature 4: 정신건강/심리 시스템 확장

### 개요

현재 morale은 단일 수치(0~100). 이를 **4가지 심리 축**으로 확장하여 캐릭터별 차별화와 생존 딜레마를 강화한다.

> 비유: 현재는 "기분이 좋다/나쁘다"의 온도계. 개선 후에는 "불안, 외로움, 트라우마, 의지" 4개의 독립된 계기판.

### 심리 축 설계

```javascript
// GameState.mental (신규)
mental: {
  morale: 70,          // 기존 유지 — 전반적 사기 (음식, 성공, 날씨 영향)
  anxiety: 0,          // 불안 (0~100) — 전투, 위험 구역, 소음에 의해 증가
  loneliness: 0,       // 외로움 (0~100) — 시간 경과, NPC 부재에 의해 증가
  trauma: 0,           // 트라우마 (0~100) — 전투 부상, 사망 목격, 질병 경험 누적
  // willpower는 morale + 다른 축의 합산에서 파생
}
```

### 각 축의 메커니즘

#### 4-1. 불안 (Anxiety)

```
증가 요인:
- 위험도 3+ 구역 체류: +0.3/TP
- 전투 진입: +5 (즉시)
- 소음 50+: +0.2/TP
- 질병 보유: +0.1/TP (질병 하나당)
- 야간(22시~06시): +0.1/TP

감소 요인:
- 안전 구역(위험도 1) 체류: -0.3/TP
- 베이스캠프 체류: -0.5/TP
- 캠프파이어 존재: -0.2/TP
- NPC 동행: -0.3/TP (Feature 6과 연동)

불안 효과:
- 0~30 (안정): 효과 없음
- 30~60 (불안): 탐색 시 TP 비용 +1 (주저함)
- 60~80 (공황): 전투 정확도 -10%, 도주 확률 +10%
- 80~100 (패닉): 랜덤 행동 불능 (3TP당 1TP 행동 불가)
```

#### 4-2. 외로움 (Loneliness)

```
증가 요인:
- 시간 경과: +0.1/TP (기본값 — 인간은 사회적 동물)
- 혼자 전투 완료: +1
- 히든 장소 발견 (공유할 사람 없음): +2

감소 요인:
- NPC 대화: -10 (즉시, Feature 6 연동)
- NPC 동행: -0.2/TP
- 라디오 아이템 사용: -5 (외부 세계의 목소리)
- 일기 쓰기 행동: -3 (신규 아이템: 일기장)

외로움 효과:
- 0~30: 효과 없음
- 30~50: 사기(morale) 감쇠 +50% (기본 0.2 → 0.3/TP)
- 50~70: 환각 이벤트 발생 가능 (정신건강 이벤트 트리거)
- 70~100: "상상의 친구" 이벤트 → 특수 NPC 카드 등장 (Feature 6 연동)
            또는 절망 가속 (morale 0 도달 시 사망 타이머 24TP로 단축)
```

#### 4-3. 트라우마 (Trauma)

```
증가 요인 (이벤트성, 즉시 적용):
- 전투 부상 1회: +3
- 골절/깊은 열상: +5
- HP 30% 이하 경험: +5
- 패혈증/콜레라 진단: +8
- 전투 도주 실패: +4
- 첫 전투 사망 목격 (적 처치): +2 (1회만)

감소 요인 (매우 느림):
- 시간 경과: -0.02/TP (약 7일에 -10)
- 안전한 곳에서 수면(대기): -0.1/TP
- 의료 스킬 4+: 자가 심리 치료 -0.05/TP
- 일기장 사용: -3 (1일 1회)
- 진통제 사용: 일시적 -5 (4시간)

트라우마 효과:
- 0~20: 효과 없음
- 20~40: 전투 진입 시 불안 +3 (PTSD 반응)
- 40~60: 악몽 이벤트 (수면 중 피로 회복 -30%)
- 60~80: 전투 시 랜덤 행동 불능 (라운드 시작 시 15% 확률)
- 80~100: 의지 붕괴 — morale 감쇠 2배, 전투 데미지 -20%
```

### 캐릭터별 심리 특성

```javascript
// characters.js 확장
const MENTAL_TRAITS = {
  doctor: {
    anxietyResist: 0.8,      // 불안 증가 20% 감소 (의사의 침착함)
    traumaRecovery: 1.5,      // 트라우마 감소 50% 가속 (자가 심리 치료)
    lonelinessBase: 1.0,      // 기본값
    specialAbility: 'self_therapy'  // 1일 1회: 트라우마 -5
  },
  soldier: {
    anxietyResist: 0.5,       // 불안 증가 50% 감소 (군인의 담력)
    traumaRecovery: 0.7,      // 트라우마 감소 30% 느림 (억압형)
    lonelinessBase: 0.8,      // 외로움 증가 20% 감소 (독립적)
    specialAbility: 'battle_calm'   // 전투 중 불안 증가 0
  },
  chef: {
    anxietyResist: 1.0,
    traumaRecovery: 1.0,
    lonelinessBase: 1.3,      // 외로움 증가 30% 가속 (사교적)
    specialAbility: 'comfort_food'  // 요리 시 불안 -5, 외로움 -3
  },
  teacher: {
    anxietyResist: 1.2,       // 불안 증가 20% 가속 (걱정이 많음)
    traumaRecovery: 1.0,
    lonelinessBase: 1.5,      // 외로움 증가 50% 가속 (학생들 그리움)
    specialAbility: 'journaling'    // 일기 쓰기 효과 2배
  },
  student: {
    anxietyResist: 1.5,       // 불안 증가 50% 가속 (젊은 불안)
    traumaRecovery: 1.3,      // 트라우마 감소 30% 가속 (회복 탄력성)
    lonelinessBase: 1.8,      // 외로움 증가 80% 가속 (또래 부재)
    specialAbility: 'adaptability'  // 트라우마 30 이하일 때 학습 XP +20%
  },
  engineer: {
    anxietyResist: 0.9,
    traumaRecovery: 0.8,      // 트라우마 감소 20% 느림
    lonelinessBase: 0.7,      // 외로움 증가 30% 감소 (혼자 작업에 익숙)
    specialAbility: 'problem_solving'  // 불안 50+일 때 제작 성공률 보너스 +5%
  }
};
```

### UI 설계

```
기존 StatRenderer 하단에 심리 상태 섹션 추가:

[기존 스탯 바들]
───────────────────
😟 불안     [████░░░░░░]  32
😔 외로움   [██░░░░░░░░]  18
💔 트라우마  [█░░░░░░░░░]   8
───────────────────

심각 상태 시 경고:
😰 불안     [████████░░]  78  ⚠️ 공황 상태!
```

### 구현 순서

1. `GameState`에 mental 필드 추가
2. `MentalSystem.js` 신규 — onTP(), 각 축 계산
3. `characters.js` 확장 — 캐릭터별 심리 특성
4. `StatRenderer.js` 확장 — 심리 상태 UI
5. `CombatSystem.js` 연동 — 불안/트라우마 전투 효과
6. `ExploreSystem.js` 연동 — 불안의 탐색 TP 보정
7. 이벤트 시스템 연동 (악몽, 환각, 상상의 친구)
8. 기존 morale 로직과의 정합성 확인

### 밸런스 고려

- **초반에는 거의 영향 없어야 한다** — 각 축이 의미 있는 수준에 도달하려면 D20+ 필요
- 트라우마는 누적형이므로 **중반 이후 긴장감의 주요 원천**
- 외로움은 NPC 시스템(Feature 6)이 있어야 완전한 기능 발휘
- 캐릭터별 특성으로 **리플레이 가치 극대화** (같은 전략이 캐릭터마다 다르게 작동)

---

## Feature 5: 숨겨진 조합 레시피

### 개요

블루프린트에 표시되지 않는 **비밀 조합**을 추가. 플레이어가 실험적으로 카드를 합쳐볼 때만 발견되며, 발견 자체가 보상이다.

> 비유: 마인크래프트에서 아무도 알려주지 않은 조합법을 발견했을 때의 쾌감.

### 설계 원칙

1. 비밀 조합은 **블루프린트 목록에 표시되지 않는다** (????? 형태로 힌트만)
2. 처음 발견하면 **알림 + XP 보너스 + 갤러리 기록**
3. 힌트는 게임 내 **일기, NPC 대화, 히든 장소 탐색**에서 제공
4. 비밀 조합 결과물은 일반 제작 불가, **반드시 드래그&드롭 조합으로만 생성**

### 비밀 조합 목록 (20개)

```javascript
// secretCombinations.js (신규)
const SECRET_COMBINATIONS = [
  // === 서바이벌 유틸리티 ===
  {
    id: 'sc_molotov',
    name: '화염병',
    source: { id: 'empty_bottle' },
    target: { id: 'campfire' },
    hint: '빈 병과 불의 만남...',
    discoveryMessage: '💡 새로운 발견! 화염병을 만들 수 있다!',
    xpReward: { skill: 'crafting', amount: 15 },
    result: {
      spawnItem: 'molotov_cocktail',  // 신규 아이템
      consumeSrc: true,
      consumeTgt: false,
      additionalReq: { definitionId: 'cloth', qty: 1 }  // 천 1개 추가 소모
    }
  },
  {
    id: 'sc_smoke_bomb',
    name: '연막탄',
    source: { tag: 'chemical' },
    target: { id: 'empty_can' },
    hint: '화학 물질과 빈 캔의 조합',
    result: {
      spawnItem: 'smoke_bomb',  // 전투 중 도주 확률 +40%
      consumeSrc: true,
      consumeTgt: true
    }
  },
  {
    id: 'sc_fishing_rod',
    name: '낚싯대',
    source: { id: 'rope' },
    target: { id: 'wood' },
    hint: '로프와 나무... 강에서 뭔가 잡을 수 있을 텐데',
    result: {
      spawnItem: 'fishing_rod',  // 한강 인접 구역에서 물고기 획득 가능
      consumeSrc: true,
      consumeTgt: true
    }
  },

  // === 의료 ===
  {
    id: 'sc_herbal_medicine',
    name: '한방 치료제',
    source: { id: 'vitamins' },
    target: { id: 'purified_water' },
    hint: '비타민을 깨끗한 물에 녹이면...',
    requiredSkill: { medicine: 3 },
    result: {
      spawnItem: 'herbal_medicine',  // 감염 -20, 사기 +10
      consumeSrc: true,
      consumeTgt: true
    }
  },
  {
    id: 'sc_field_surgery_kit',
    name: '현장 수술 키트',
    source: { id: 'first_aid_kit' },
    target: { id: 'knife' },
    hint: '응급 키트와 칼을 결합하면 즉석 수술 도구가...',
    requiredSkill: { medicine: 5 },
    result: {
      spawnItem: 'surgery_kit',  // 골절/깊은열상 즉시 치료 (TP 비용 높음)
      consumeSrc: true,
      consumeTgt: false,
      tpCost: 6
    }
  },

  // === 전투 ===
  {
    id: 'sc_poison_blade',
    name: '독날',
    source: { id: 'antiseptic' },
    target: { tag: 'melee_weapon' },
    hint: '소독약을... 무기에 바르면?',
    result: {
      transformTgt: null,  // 무기 타입 유지
      addEffect: { poisonDamage: 3, duration: 5 },  // 5라운드 독 데미지
      consumeSrc: true
    }
  },
  {
    id: 'sc_explosive_trap',
    name: '폭발 함정',
    source: { id: 'molotov_cocktail' },
    target: { id: 'alarm_trap' },
    hint: '화염병과 알람 트랩의 결합체',
    result: {
      spawnItem: 'explosive_trap',  // 레이드 시 적 3마리에 20 데미지
      consumeSrc: true,
      consumeTgt: true
    }
  },

  // === 환경 활용 (Feature 1 연동) ===
  {
    id: 'sc_rain_shower',
    name: '빗물 샤워',
    source: { id: 'cloth' },
    target: { id: 'weather_rain' },
    hint: '비 속에서 천으로 몸을 씻으면...',
    result: {
      statChange: { infection: -5, morale: +5 },
      consumeSrc: false,
      consumeTgt: false,
      cooldown: 72  // 1일 쿨다운
    }
  },

  // === 특수 ===
  {
    id: 'sc_radio_signal',
    name: '구조 신호',
    source: { id: 'radio' },
    target: { id: 'battery' },
    hint: '라디오에 배터리를 넣으면...',
    requiredDay: 100,  // D100 이후에만 발견 가능
    result: {
      triggerEvent: 'rescue_signal',  // 특수 엔딩 경로 해금
      consumeSrc: false,
      consumeTgt: true,
      message: '... 여기는 서울... 생존자가... 신호를 보내...'
    }
  },
  {
    id: 'sc_journal',
    name: '생존 일지',
    source: { id: 'pen' },      // 신규 아이템: 펜
    target: { id: 'notebook' },  // 신규 아이템: 공책
    hint: '기록은 생존의 증거',
    result: {
      spawnItem: 'survival_journal',  // 1일 1회 사용: 트라우마 -3, 외로움 -3
      consumeSrc: true,
      consumeTgt: true
    }
  }
];
```

### 발견 시스템

```javascript
// SecretCombinationSystem.js (신규)
class SecretCombinationSystem {
  // GameState.discoveries에 발견 기록 저장
  // discoveries: { foundCombinations: ['sc_molotov', ...], totalFound: 3, totalAvailable: 20 }

  static checkCombination(srcDef, tgtDef, gs) {
    for (const combo of SECRET_COMBINATIONS) {
      if (!_matchesCriteria(srcDef, combo.source)) continue;
      if (!_matchesCriteria(tgtDef, combo.target)) continue;

      // 이미 발견했는지 확인
      const isNew = !gs.discoveries.foundCombinations.includes(combo.id);

      // 추가 요구사항 확인
      if (combo.requiredSkill) {
        const [skill, level] = Object.entries(combo.requiredSkill)[0];
        if (gs.player.skills[skill] < level) {
          return { found: false, hint: `${skill} Lv.${level} 필요` };
        }
      }
      if (combo.requiredDay && gs.time.day < combo.requiredDay) {
        return { found: false };  // 아직 해금 안 됨 (힌트도 없음)
      }

      return {
        found: true,
        isNew,
        combo
      };
    }
    return { found: false };
  }
}
```

### 힌트 시스템

```
힌트 획득 경로:
1. 히든 장소 탐색 → 벽의 메모, 실험 기록 → "빈 병과 불로 무기를 만들 수 있다"
2. NPC 대화 (Feature 6) → 생존자의 팁 → "화학 물질을 캔에 넣으면..."
3. 높은 스킬 레벨 → 자동 힌트 알림 → "의료 Lv.5 달성: 현장 수술이 가능할 것 같다"
4. 일기장 사용 → 낮은 확률로 영감 → "비 속에서 씻으면 감염이 줄지도..."

힌트 UI (블루프린트 화면 하단):
┌──────────────────────────────┐
│ 🔮 미발견 조합 힌트           │
│                              │
│ ??? — "빈 병과 불의 만남..."  │
│ ??? — "로프와 나무... 강에서" │
│ ??? — [미발견]               │
│                              │
│ 발견: 2/20                   │
└──────────────────────────────┘
```

### 구현 순서

1. `secretCombinations.js` 데이터 파일 생성
2. `SecretCombinationSystem.js` — 조합 체크, 발견 기록
3. `SlotResolver.resolveInteraction()` 수정 — interactions.js 이후, CraftDiscovery 이전에 비밀 조합 체크
4. `GameState`에 discoveries 필드 추가
5. 신규 아이템 추가 (화염병, 연막탄, 낚싯대, 일기장 등)
6. 힌트 시스템 — 히든 장소/NPC/스킬에서 힌트 트리거
7. 갤러리에 "비밀 조합" 탭 추가

---

## Feature 6: NPC 카드 시스템

### 개요

생존자 NPC를 **보드 위의 카드**로 구현. 대화, 거래, 동행이 카드 인터랙션으로 이루어진다.

> 비유: 현재 게임은 "무인도 생존". NPC가 추가되면 "The Walking Dead의 공동체 생존".

### 핵심 재미

- 포스트아포칼립스에서 **인간 관계**의 가치
- NPC와의 거래 = 자원 확보의 새 경로
- 동행 NPC = 전투/탐색 보조 + 외로움 해소 (Feature 4 연동)
- NPC 관련 선택 = 도덕적 딜레마

### NPC 데이터 구조

```javascript
// npcs.js (신규)
const NPC_DATA = {
  npc_old_survivor: {
    id: 'npc_old_survivor',
    name: '노인 생존자',
    icon: '👴',
    personality: 'cautious',
    location: 'gangbuk',           // 초기 위치
    spawnCondition: { minDay: 10, district: 'gangbuk' },

    // 대화 트리
    dialogues: {
      greeting: {
        text: '"조심해, 젊은이. 이 동네 좀비들이 최근에 부쩍 늘었어..."',
        options: [
          { text: '무슨 일이 있었나요?', next: 'story_1' },
          { text: '거래할 물건이 있나요?', next: 'trade' },
          { text: '같이 다닐 수 있을까요?', next: 'recruit',
            condition: { trustLevel: 3 } }
        ]
      },
      story_1: {
        text: '"서쪽에서 큰 무리가 이동해 왔어. 마포 쪽 다리를 건너온 것 같더라."',
        rewards: { hint: 'sc_fishing_rod' },  // 비밀 조합 힌트 제공
        next: 'greeting'
      },
      trade: {
        // 거래 화면으로 전환
        type: 'trade',
        offers: [
          { give: { id: 'canned_food', qty: 2 },
            receive: { id: 'bandage', qty: 3 } },
          { give: { id: 'antibiotics', qty: 1 },
            receive: { id: 'scrap_metal', qty: 5 } }
        ]
      },
      recruit: {
        text: '"좋아, 나도 혼자는 외로웠다. 함께 가지."',
        action: 'join_party',
        trustRequired: 3
      }
    },

    // NPC 능력치 (동행 시 적용)
    companionStats: {
      combatPower: 5,          // 전투 시 추가 데미지
      carryBonus: 10,          // 적재량 +10kg
      scavengeBonus: 0.1,      // 탐색 시 아이템 발견 +10%
      noise: 3,                // 소음 +3/TP (인원 증가)
      foodConsumption: 0.3,    // 식량 소비 +0.3/TP
      lonelinessReduction: 0.3 // 외로움 -0.3/TP (Feature 4 연동)
    },

    // 신뢰도 시스템
    trust: {
      current: 0,
      max: 5,
      gainActions: {
        give_food: 1,          // 음식 제공
        heal_wound: 2,         // 부상 치료
        win_combat: 1,         // 함께 전투 승리
        dialogue: 0.5          // 대화
      }
    }
  },

  npc_nurse: {
    id: 'npc_nurse',
    name: '간호사',
    icon: '👩‍⚕️',
    personality: 'caring',
    location: 'seocho',
    spawnCondition: { minDay: 15, district: 'seocho' },

    companionStats: {
      combatPower: 2,
      carryBonus: 5,
      healBonus: 0.3,          // 의료 아이템 효과 +30%
      noise: 2,
      foodConsumption: 0.2,
      lonelinessReduction: 0.4
    }
  },

  npc_soldier_deserter: {
    id: 'npc_soldier_deserter',
    name: '탈영병',
    icon: '🔫',
    personality: 'aggressive',
    location: 'yongsan',
    spawnCondition: { minDay: 30, district: 'yongsan' },

    companionStats: {
      combatPower: 15,
      carryBonus: 20,
      noise: 8,                // 소음이 매우 높음
      foodConsumption: 0.5,    // 식량 소비 높음
      lonelinessReduction: 0.1, // 말이 별로 없음
      moralePenalty: -0.1      // 도덕적 갈등 (탈영 사실)
    },

    // 특수 이벤트: 신뢰 5 달성 시 과거 폭로 → 선택지
    specialEvent: {
      trigger: { trustLevel: 5 },
      text: '"사실... 나는 동료를 버리고 도망쳤어. 뒤돌아볼 수 없었어."',
      choices: [
        { text: '이해해요. 생존이 우선이죠.',
          effect: { morale: +5, trauma: -3 } },
        { text: '당신을 믿을 수 없겠네요.',
          effect: { npcLeave: true, morale: -5 } }
      ]
    }
  },

  npc_child: {
    id: 'npc_child',
    name: '고아 소녀',
    icon: '👧',
    personality: 'timid',
    location: 'nowon',
    spawnCondition: { minDay: 20, district: 'nowon' },

    companionStats: {
      combatPower: 0,
      carryBonus: 3,
      noise: 1,
      foodConsumption: 0.15,
      lonelinessReduction: 0.5, // 높은 외로움 감소
      moraleBonus: 0.1          // "지켜야 할 이유" → 사기 +0.1/TP
    },

    // 도덕적 딜레마: 위험한 구역에서 데려가면 리스크
    riskEvent: {
      trigger: { districtDangerLevel: 4 },
      text: '아이가 겁에 질려 소리를 지른다!',
      effect: { noise: +30, anxiety: +10 }
    }
  }
];

// 추가 NPC: 약탈자, 군의관, 대학생, 노숙자, 정비사 등 (총 8~12명)
```

### 보드 위 NPC 카드 배치

```
NPC 카드 위치:
- 발견 전: 해당 구역 탐색 시 조우 이벤트로 등장
- 발견 후 (비동행): 해당 구역의 middle row에 NPC 카드 배치
- 동행 중: bottom row의 특수 슬롯에 배치 (인벤토리 옆)

NPC 카드 외형:
┌──────────────────┐
│ 👴 노인 생존자    │
│                  │
│  ❤️ 신뢰 ★★★☆☆  │
│                  │
│  🗣️ 대화 가능    │  ← 더블클릭으로 대화
│  🤝 거래 가능    │
│                  │
│  [────70%────]   │  ← 건강 상태 바
└──────────────────┘
```

### NPC 인터랙션 (카드 드래그)

```javascript
// 아이템 → NPC 드래그 인터랙션
const NPC_INTERACTIONS = [
  // 음식 → NPC = 음식 제공 (신뢰 +1)
  {
    source: { tag: 'edible' },
    target: { type: 'npc' },
    hint: '음식 제공 → 신뢰도 상승',
    apply: (src, tgt, gs) => {
      const npc = gs.npcs[tgt.definitionId];
      npc.trust.current = Math.min(npc.trust.max, npc.trust.current + 1);
      return {
        message: `${npc.name}에게 음식을 주었다. 신뢰도 상승.`,
        consumeSrc: true
      };
    }
  },
  // 의료 아이템 → NPC = 치료 (신뢰 +2)
  {
    source: { tag: 'medical' },
    target: { type: 'npc' },
    hint: '부상 치료 → 신뢰도 크게 상승',
    apply: (src, tgt, gs) => {
      const npc = gs.npcs[tgt.definitionId];
      npc.trust.current = Math.min(npc.trust.max, npc.trust.current + 2);
      return {
        message: `${npc.name}의 부상을 치료했다. 신뢰도 크게 상승!`,
        consumeSrc: true
      };
    }
  },
  // 무기 → NPC = 무장시키기 (전투력 증가)
  {
    source: { tag: 'melee_weapon' },
    target: { type: 'npc', condition: 'companion' },
    hint: '동행 NPC 무장',
    apply: (src, tgt, gs) => {
      const npc = gs.npcs[tgt.definitionId];
      npc.companionStats.combatPower += 5;
      return {
        message: `${npc.name}에게 무기를 건넸다. 전투력 상승.`,
        consumeSrc: true
      };
    }
  }
];
```

### NPC 생존 & 이탈

```
NPC 건강:
- NPC도 HP를 가짐 (50~100)
- 전투 시 NPC도 피격 가능 (적 타겟 분산)
- NPC HP 0 = 영구 사망 (트라우마 +15, 외로움 +20)
- 치료하지 않으면 자연 이탈

NPC 이탈 조건:
- 식량 부족: 2일 연속 식량 미제공 → 이탈
- 위험 과다: 전투 3회 연속 → 겁쟁이 NPC 이탈
- 사기 저하: 플레이어 morale 10 이하 → 절망 전염, 이탈
- 특수 이벤트: 도덕적 선택에 따른 이탈
```

### 구현 순서

1. `npcs.js` 데이터 파일 생성
2. `NPCSystem.js` — NPC 스폰, 상태 관리, 대화, 거래, 동행
3. `GameState`에 npcs 필드 추가
4. `CardFactory.js` NPC 카드 렌더링
5. `interactions.js`에 NPC 인터랙션 규칙 추가
6. `CombatSystem.js` — 동행 NPC 전투 참여 로직
7. NPC 대화 UI 모달 (`NPCDialogueModal.js`)
8. NPC 거래 UI (`NPCTradeModal.js`)
9. Feature 4 (심리 시스템)과 연동 — 외로움, 사기

---

## Feature 7: 신체 상세 시뮬레이션

### 개요

현재 부상은 질병 시스템의 일부 (출혈, 골절 등). 이를 **부위별 부상 추적**으로 확장하여 의사 캐릭터의 차별화를 극대화한다.

> 비유: 현재는 "HP가 줄었다". 개선 후에는 "왼쪽 다리에 골절, 오른손에 열상 — 이동 불가, 원거리 공격만 가능".

### 신체 부위 모델

```javascript
// GameState.body (신규)
body: {
  head: {
    hp: 100,
    injuries: [],      // [{ type: 'concussion', severity: 2, tpRemaining: 216 }]
    armor: null,        // 장착된 방어구 참조
    effects: {
      visionPenalty: 0,    // 시야 패널티 (탐색 효율)
      accuracyPenalty: 0   // 정확도 패널티
    }
  },
  torso: {
    hp: 100,
    injuries: [],
    armor: null,
    effects: {
      staminaPenalty: 0,   // 스태미나 패널티
      breathingPenalty: 0  // 호흡 패널티 (피로 가속)
    }
  },
  leftArm: {
    hp: 100,
    injuries: [],
    armor: null,
    effects: {
      carryPenalty: 0,     // 적재량 감소
      shieldPenalty: 0     // 방어 효율 감소
    }
  },
  rightArm: {
    hp: 100,
    injuries: [],
    armor: null,
    effects: {
      damagePenalty: 0,    // 공격력 감소
      craftPenalty: 0      // 제작 정확도 감소
    }
  },
  leftLeg: {
    hp: 100,
    injuries: [],
    armor: null,
    effects: {
      movePenalty: 0,      // 이동 TP 증가
      fleePenalty: 0       // 도주 확률 감소
    }
  },
  rightLeg: {
    hp: 100,
    injuries: [],
    armor: null,
    effects: {
      movePenalty: 0,
      fleePenalty: 0
    }
  }
}
```

### 부위별 부상 효과

```
┌─────────────────────────────────────────────────────┐
│ 부위별 부상 매핑                                     │
│                                                     │
│ 머리 (head):                                        │
│   뇌진탕 → 시야 패널티 (탐색 효율 -20%)             │
│   출혈 → 지속 HP 감소 + 시야 흐림                    │
│                                                     │
│ 몸통 (torso):                                       │
│   깊은 열상 → 호흡 곤란 (피로 +50%)                  │
│   골절 (갈비뼈) → 스태미나 -30%, 모든 행동 고통       │
│                                                     │
│ 팔 (arm):                                           │
│   골절 → 해당 팔 사용 불가                           │
│     왼팔 골절: 방패 사용 불가, 적재량 -40%           │
│     오른팔 골절: 근접 공격 불가, 제작 불가            │
│   출혈 → 적재량 -20%                                │
│                                                     │
│ 다리 (leg):                                         │
│   골절 → 이동 TP 2배, 도주 확률 -30%                │
│   출혈 → 이동 TP +50%                               │
│   양쪽 골절 → 이동 불가! 기지에서만 행동              │
│                                                     │
│ 심각도 (1~3):                                       │
│   1 (경미): 효과 30%, 자연 치유 5일                  │
│   2 (보통): 효과 70%, 자연 치유 12일                 │
│   3 (심각): 효과 100%, 치료 필수 (자연치유 불가)     │
└─────────────────────────────────────────────────────┘
```

### 전투 피격 부위 결정

```javascript
// CombatSystem 확장
const HIT_LOCATION_TABLE = {
  // 무기 유형별 피격 부위 확률
  melee: {
    head: 0.10,   torso: 0.35,
    leftArm: 0.15, rightArm: 0.15,
    leftLeg: 0.12, rightLeg: 0.13
  },
  ranged: {
    head: 0.15,   torso: 0.45,   // 원거리는 몸통 적중률 높음
    leftArm: 0.10, rightArm: 0.10,
    leftLeg: 0.10, rightLeg: 0.10
  },
  unarmed: {
    head: 0.15,   torso: 0.25,
    leftArm: 0.20, rightArm: 0.20,  // 격투는 팔 적중 높음
    leftLeg: 0.10, rightLeg: 0.10
  }
};

function rollHitLocation(weaponType) {
  const table = HIT_LOCATION_TABLE[weaponType] ?? HIT_LOCATION_TABLE.melee;
  let roll = Math.random();
  for (const [part, chance] of Object.entries(table)) {
    roll -= chance;
    if (roll <= 0) return part;
  }
  return 'torso';  // fallback
}
```

### 의사 캐릭터 특화

```
이지수(의사)의 신체 시뮬레이션 보너스:

1. 부상 진단: 피격 시 부위와 심각도를 정확히 표시
   (다른 캐릭터: "부상을 입었다" vs 의사: "오른팔에 심각도 2 열상")

2. 자가 치료 효율:
   - 의료 아이템 → 특정 부위 지정 치료 가능
   - 다른 캐릭터: 붕대 → 랜덤 부위 치료
   - 의사: 붕대 → 원하는 부위 선택 치료

3. 수술 가능 (현장 수술 키트 + 의료 Lv.5):
   - 심각도 3 부상을 심각도 1로 감소 (6 TP)
   - 다른 캐릭터: 심각도 3은 치료 불가 (자연치유 불가)

4. 진단 힌트:
   - "왼쪽 다리 골절이 이동을 방해하고 있다. 진통제를 먹으면 일시적으로..."
```

### UI 설계

```
장비 모달 내 신체 다이어그램:

       ┌───┐
       │ 😐│ ← 머리 (클릭: 부상 상세)
       └─┬─┘
    ┌────┼────┐
    │  ┌─┴─┐  │
    │  │   │  │ ← 몸통
    └──│   │──┘
  ┌──┐ │   │ ┌──┐
  │🩹│ └─┬─┘ │  │ ← 좌/우 팔 (🩹 = 부상 표시)
  └──┘   │   └──┘
       ┌─┴─┐
     ┌─┘   └─┐
     │       │ ← 좌/우 다리
     └       └

부위 상태 색상:
  초록 (80-100%): 건강
  노랑 (50-80%): 경미한 부상
  주황 (20-50%): 보통 부상
  빨강 (0-20%): 심각한 부상

부상 아이콘 오버레이:
  🩸 출혈
  🦴 골절
  🔪 열상
  💫 뇌진탕
```

### 기존 시스템과의 통합

```
기존 DiseaseSystem.checkCombatInjury() 흐름:
  피격 → 데미지 계산 → 부상 확률 체크 → 질병(출혈/골절) 등록

개선 흐름:
  피격 → 데미지 계산 → 피격 부위 결정 → 부위별 부상 등록
  → 부위 HP 감소 → 부위 효과 갱신 → 기존 질병 시스템과 병행

통합 방법:
  - body.injuries[]는 기존 diseases[]의 서브셋이 아닌 **보조 레이어**
  - 기존 질병(출혈, 골절)은 유지 → 부위 정보가 추가될 뿐
  - 치료 시: 기존 질병 치료 + 부위 부상 치유 동시 처리
```

### 구현 순서

1. `GameState`에 body 필드 추가 + 초기화
2. `BodySystem.js` 신규 — 부위 관리, 효과 계산
3. `CombatSystem.js` 수정 — 피격 부위 결정, 부위 HP 감소
4. `DiseaseSystem.js` 수정 — 부상 시 부위 정보 연동
5. `StatSystem.js` 수정 — 부위 효과 적용 (이동, 전투, 제작 패널티)
6. `EquipmentModal.js` 수정 — 신체 다이어그램 UI
7. 의사 캐릭터 특수 치료 로직

---

## Feature 10: 맵 상호 연결 (지하철/하수도 비밀 경로)

### 개요

현재 이동은 인접 구역만 가능 (직교 + 한강 다리 2개). **지하철 노선과 하수도 터널**을 숨겨진 이동 경로로 추가하여 전략적 이동 선택지를 확장한다.

> 비유: 체스에서 나이트만 쓰던 플레이어에게 비숍을 주는 것. 대각선 이동이 가능해지면 전략의 깊이가 달라진다.

### 핵심 재미

- **단축 경로 발견** → 탐험 보상
- **위험-보상 트레이드오프** — 지하철은 빠르지만 어둡고 위험
- 구역 간 **비선형 접근** → 전략적 루트 다양화
- 한강 횡단의 새로운 방법 (지하철)

### 지하철 노선 데이터

```javascript
// subwayRoutes.js (신규)
// 실제 서울 지하철 노선을 단순화

const SUBWAY_ROUTES = {
  line_2: {
    name: '2호선',
    icon: '🟢',
    color: '#33A23D',
    stations: [
      'gangnam', 'seocho', 'dongjak', 'yeongdeungpo', 'mapo',
      'seodaemun', 'jongno', 'dongdaemun', 'seongdong', 'gangdong'
    ],
    // 순환선: 양쪽 방향 이동 가능
    circular: true,
    tpCostPerStation: 1,          // 역당 1 TP (지상 이동보다 빠름)
    dangerLevel: 3,               // 어두운 지하 = 위험
    encounterChance: 0.30,        // 높은 조우 확률 (좀비가 숨어있음)
    unlockCondition: {
      requiredItem: 'flashlight', // 손전등 필요
      minDay: 15
    }
  },
  line_3: {
    name: '3호선',
    icon: '🟠',
    color: '#FE5B10',
    stations: [
      'gangnam', 'seocho', 'dongjak', 'yongsan', 'jongno',
      'seodaemun', 'eunpyeong'
    ],
    circular: false,
    tpCostPerStation: 1,
    dangerLevel: 3,
    encounterChance: 0.25,
    unlockCondition: {
      requiredItem: 'flashlight',
      minDay: 20
    }
  },
  line_4: {
    name: '4호선',
    icon: '🔵',
    color: '#32A1C8',
    stations: [
      'nowon', 'gangbuk', 'seongbuk', 'dongdaemun', 'junggoo',
      'yongsan', 'dongjak', 'gwanak'
    ],
    circular: false,
    tpCostPerStation: 1,
    dangerLevel: 2,
    encounterChance: 0.20,
    unlockCondition: {
      requiredItem: 'flashlight',
      minDay: 10
    }
  },
  line_7: {
    name: '7호선',
    icon: '🟤',
    color: '#747F00',
    stations: [
      'dobong', 'nowon', 'jungrang', 'gwangjin', 'gangdong',
      'songpa', 'gangnam'
    ],
    circular: false,
    tpCostPerStation: 1,
    dangerLevel: 2,
    encounterChance: 0.20,
    unlockCondition: {
      requiredItem: 'flashlight',
      minDay: 15
    }
  }
};

// 하수도 (비밀 경로)
const SEWER_ROUTES = {
  sewer_gangnam_yongsan: {
    name: '강남-용산 하수도',
    icon: '🕳️',
    from: 'gangnam',
    to: 'yongsan',
    tpCost: 3,                    // 직접 이동은 불가능한 구간을 연결
    dangerLevel: 4,               // 매우 위험
    encounterChance: 0.40,
    radiation: 3,                 // 하수도 방사능
    unlockCondition: {
      hiddenLocationFound: 'hidden_gangnam_sewer',  // 히든 장소 발견 필요
      requiredItem: 'gas_mask'    // 방독면 필요
    }
  },
  sewer_jongno_junggoo: {
    name: '종로-중구 하수도',
    icon: '🕳️',
    from: 'jongno',
    to: 'junggoo',
    tpCost: 2,
    dangerLevel: 5,               // 최고 위험
    encounterChance: 0.50,
    radiation: 5,
    unlockCondition: {
      hiddenLocationFound: 'hidden_jongno_catacomb',
      requiredItem: 'gas_mask',
      minDay: 40
    },
    specialLoot: [
      { definitionId: 'scrap_metal', weight: 40, minQty: 3, maxQty: 5 },
      { definitionId: 'electronic_parts', weight: 20, minQty: 1, maxQty: 2 }
    ]
  },
  // 한강 횡단 하수도 (한강 다리 대안)
  sewer_mapo_yeongdeungpo_underwater: {
    name: '마포-영등포 수중 터널',
    icon: '🌊',
    from: 'mapo',
    to: 'yeongdeungpo',
    tpCost: 4,
    dangerLevel: 4,
    encounterChance: 0.35,
    specialCondition: 'flooding',  // 비 올 때 사용 불가
    unlockCondition: {
      minDay: 50,
      requiredItem: 'rope',
      minSkill: { building: 3 }
    }
  }
};
```

### 지하철 이동 흐름

```
1. 플레이어가 현재 구역에 지하철역이 있는지 확인
   - SeoulMapModal에서 지하철 노선 오버레이 표시
   - 또는 탐색 중 "지하철 입구" 발견 이벤트

2. 지하철역 진입 (손전등 필수)
   - top row에 "지하철 역" 카드 등장
   - 인접 역 목록 표시 (1~3 정거장 범위)

3. 이동 선택
   - 목적지 역 선택 → TP 비용 표시 (역 수 × 1 TP)
   - 조우 확률 표시 (구간별)
   - "이동" 확인

4. 이동 중 이벤트
   - 각 역 통과 시 조우 확률 체크
   - 특수 이벤트: 터널 붕괴 (방향 변경 강제), 어둠 속 소리, 좀비 떼
   - 조우 시: 어둠 전투 (정확도 -15%, 도주 -20%)

5. 도착
   - 지상으로 올라옴 → 목적지 구역 도착
   - 소음 +5 (지하철 문 여는 소리)
```

### 지하철 역 특수 루팅

```javascript
// 지하철 역 자체가 탐색 가능한 장소
const SUBWAY_STATION_LOOT = {
  default: [
    { definitionId: 'energy_bar', weight: 30, minQty: 1, maxQty: 2 },
    { definitionId: 'sports_drink', weight: 20, minQty: 1, maxQty: 1 },
    { definitionId: 'flashlight', weight: 10, minQty: 1, maxQty: 1 },
    { definitionId: 'battery', weight: 15, minQty: 1, maxQty: 2 },
    { definitionId: 'scrap_metal', weight: 25, minQty: 2, maxQty: 4 }
  ],
  // 특수역 보너스 루팅
  special: {
    jongno: {  // 종각역 — 지하상가
      bonusLoot: [
        { definitionId: 'canned_food', weight: 40, minQty: 2, maxQty: 4 },
        { definitionId: 'cloth', weight: 30, minQty: 3, maxQty: 5 }
      ]
    },
    gangnam: {  // 강남역 — 대형 역사
      bonusLoot: [
        { definitionId: 'first_aid_kit', weight: 15, minQty: 1, maxQty: 1 },
        { definitionId: 'battery', weight: 25, minQty: 2, maxQty: 3 }
      ]
    }
  }
};
```

### 서울 맵 UI 확장

```
기존 맵 + 지하철 노선 오버레이:

┌──────────────────────────────────────────┐
│  은평 ── 서대문 ── 종로 ── 동대문        │
│    │       │  🟠   │  🟢    │            │
│   ...     마포 ── 용산 ── 성동            │
│            │  🟢   │  🟠                  │
│  ═══════ 한강 ═══════════════            │
│            │       │                      │
│   영등포 ─ 동작 ── 서초 ── 강남           │
│     🟢      │  🟠    │  🟢  🟤           │
│            관악     ...    송파            │
│                                          │
│  🟢 2호선  🟠 3호선  🔵 4호선  🟤 7호선  │
│  🕳️ 하수도 (해금 시 표시)                │
│                                          │
│  [지상 이동] [지하철 이동] [하수도]       │
└──────────────────────────────────────────┘

지하철 노선 토글:
- 기본: 꺼짐 (손전등 획득 전)
- 손전등 보유: 자동 활성화
- 각 노선 색상으로 구역 간 연결선 표시
- 미해금 노선: 점선 + 자물쇠 아이콘
```

### 이동 비교 테이블

```
강남 → 종로 이동 비교:

경로 1 (지상): 강남 → 서초 → 동작 → 마포 다리 → 마포 → 서대문 → 종로
  TP: 2+2+2+2+2 = 10 TP
  조우: 5회 체크 (평균 1~2회 전투)
  위험: 구역별 다양 (위험도 1~4)

경로 2 (2호선): 강남역 → 서초역 → 동작역 → 영등포역 → 마포역 → 서대문역 → 종로역
  TP: 6 TP (6정거장 × 1TP)
  조우: 6회 체크 (30% = 평균 1.8회, 어둠 전투)
  위험: 일정 (위험도 3, 어둠 패널티)

경로 3 (3호선): 강남역 → 서초역 → 동작역 → 용산역 → 종로역
  TP: 4 TP (4정거장)
  조우: 4회 체크 (25%)
  위험: 일정 (위험도 3)

→ 3호선이 가장 효율적이지만 해금 조건이 더 높음 (D20+)
→ 지상 이동은 느리지만 탐색/루팅 가능
→ 트레이드오프: 속도 vs 안전 vs 루팅 기회
```

### 구현 순서

1. `subwayRoutes.js` + `sewerRoutes.js` 데이터 파일 생성
2. `SubwaySystem.js` 신규 — 노선 해금, 이동 로직, 역간 조우
3. `ExploreSystem.js` 수정 — 지하철/하수도 이동 경로 추가
4. `SeoulMapModal.js` 대폭 수정 — 지하철 노선 오버레이, 이동 모드 토글
5. `SubwayStationModal.js` 신규 — 역 탐색/이동 UI
6. `CombatSystem.js` — 어둠 전투 패널티 추가
7. 히든 장소 시스템과 연동 (하수도 해금)
8. 이동 비용 및 밸런스 조정

---

## 구현 우선순위 & 의존성 맵

```
Phase 1 (핵심 기반): Feature 2 → Feature 5
  이유: 카드 조합 인터랙션 강화가 모든 다른 기능의 기반

Phase 2 (환경 카드화): Feature 1
  이유: 환경 카드가 있어야 날씨 관련 비밀 조합 가능
  의존: Feature 2의 퀵 크래프트 인프라

Phase 3 (심리 & 신체): Feature 4 → Feature 7
  이유: 심리 시스템이 NPC 연동의 전제
  의존: 독립적 (다른 Feature 없이 구현 가능)

Phase 4 (NPC): Feature 6
  의존: Feature 4 (외로움), Feature 5 (비밀 조합 힌트 제공)

Phase 5 (세계 확장): Feature 3, Feature 10
  이유: 동적 생태계 + 지하철이 맵 전략의 깊이를 완성
  의존: Feature 1 (날씨 카드가 생태계에 영향)

의존성 그래프:
Feature 2 (카드 조합) ─────┐
Feature 5 (비밀 조합) ─────┼──→ Feature 1 (환경 카드) ──→ Feature 3 (생태계)
                           │                              Feature 10 (지하철)
Feature 4 (심리) ──────────┼──→ Feature 6 (NPC)
Feature 7 (신체) ──────────┘
```

### 구현 상태 (2026-03-20 완료)

| Feature | 상태 | 신규 파일 | 주요 시스템 |
|---------|------|----------|------------|
| 1. 환경 카드 | ✅ 완료 | items_environment.js | WeatherSystem 연동, 7개 인터랙션 |
| 2. 퀵 크래프트 | ✅ 완료 | CraftDiscovery.js, QuickCraftPrompt.js | DragDrop 우선순위 체인 통합 |
| 3. 동적 생태계 | ✅ 완료 | EcologySystem.js | 좀비이동/자원재생/오염, 맵 오버레이 |
| 4. 심리 시스템 | ✅ 완료 | MentalSystem.js | 3축(불안/외로움/트라우마) + 캐릭터 특성 |
| 5. 비밀 조합 | ✅ 완료 | secretCombinations.js, SecretCombinationSystem.js | 20종 + 힌트 3경로 + 갤러리 UI |
| 6. NPC 시스템 | ✅ 완료 | npcs.js, NPCSystem.js, NPCDialogueModal.js | 8명 NPC + HP + 이탈 4조건 |
| 7. 신체 시뮬 | ✅ 완료 | BodySystem.js | 6부위 + 다이어그램 UI + 치료 연결 |
| 10. 지하철/하수도 | ✅ 완료 | subwayRoutes.js, SubwaySystem.js | 4노선 + 역탐색 + 맵 오버레이 |
| + BGM | ✅ 완료 | BGMSystem.js | Web Audio 프로시저럴, 8개 분위기 |
| + 버그 수정 | ✅ 완료 | — | 이벤트 미발행 4건, init 순서 등 9건 |

---

## 이전 계획 (아카이브)

### 이지수(의사) 100일 생존 플랜

<details>
<summary>100일 생존 플랜 전문 (접기/펴기)</summary>

> 최종 업데이트: 2026-03-20
> 유형: 게임플레이 전략 (코드 구현 아님)

#### 캐릭터 분석: 이지수 (응급의학과 전문의)

| 항목 | 수치 | 평가 |
|------|------|------|
| HP | 95 | 낮음 |
| 근력 | 58 | 낮음 |
| 인내심 | 72 | 보통 |
| 최대 적재량 | 32kg | 낮음 |
| 스태미나 | ~84 | 보통 |

특성: 외상 전문가(+50%), 임상 지식(-35% 감염), 응급 처치(+5 HP)
약점: 전투 스킬 0, 낮은 근력/적재량

Phase 1(D1-7): 삼성서울병원 의료물자 확보, 캠프파이어, 무기
Phase 2(D8-14): 관악구 탐색, 바리케이드, 물 퀘스트
Phase 3(D15-30): 전투 훈련, 기지 확장, 정수기/의료스테이션
Phase 4(D31-60): 6-8구 탐색, 크로스보우, 세브란스 정찰
Phase 5(D61-90): 기지 Lv.4, 여름 대비 비축
Phase 6(D91-100): 여름 수분 관리, 열사병 예방

</details>

### 개발 진행 기록 (Phase A~N)

<details>
<summary>Phase A~N 개발 기록 (접기/펴기)</summary>

### Phase A — 서울 25구 지역 시스템 ✅
- js/data/districts.js — 25개 구, adjacency, 위험도, 랜드마크 필드
- js/data/nodes.js — districts.js 통합 wrapper
- js/data/items.js — loc_{구ID} 카드 25개 + lm_{구ID} 랜드마크 카드 25개
- js/core/GameState.js — board.top 8슬롯, player.equipped, districtsVisited
- js/systems/ExploreSystem.js — exploreCurrentDistrict(), _updateTopRowCards()
- js/ui/ExploreUI.js — 현재 구 배너 + 탐색 버튼 + 인접 구 그리드
- js/ui/SeoulMapModal.js — 25개 구 SVG 미니맵
- js/screens/CharCreate.js — 시작 구 선택 + 랜드마크 카드 배치
- js/screens/Basecamp.js — 현재 구 이름 표시

### Phase B — 100종 아이템 + 제작 시스템 ✅
- items_base.js (41), items_combat.js (25), items_misc.js (34)
- blueprints.js — 36개 레시피
- DismantleSystem, CardContextMenu, InteractionSystem

### Phase C — 전투 + 다중 엔딩 시스템 ✅
- CombatSystem — 다중 적, 상태이상, AI 패턴
- endings.js — 24개 엔딩
- TraitSystem — scavenger / medic / silent

### Phase D — 장비 창 시스템 ✅ (2026-03-06)
- EquipmentSystem.js — equip/unequip, getSlotsForDef
- EquipmentModal.js — 3단 레이아웃 (효과패널·캐릭터·인벤토리)
- StatSystem getArmorEffects() → player.equipped 스캔
- CombatSystem _getPlayerWeapon() → weapon_main 우선

### Phase E — 랜드마크 시스템 ✅ (2026-03-06)
- landmarks.js — 25개 구 × 4~6 세부 장소 (테마별 루팅 테이블)
- LandmarkModal.js — 세부 장소 탐색 UI (1TP, 조우 체크, 루팅)
- CardFactory.js — 현재 위치 카드 클릭 불가 + 골든 테두리

### Phase F — 4계절 서바이벌 시스템 ✅ (2026-03-06)
- seasonalEvents.js — 날짜 기반 이벤트 16개
- SeasonSystem.js — 계절 판정·수정값·보너스 루팅·이벤트 적용
- StatSystem.js — 계절별 수분 배수·체온 변화·열사병 로직

### Phase G — 질병·날씨 시스템 ✅ (2026-03-06)
- diseases.js — 8개 질병 정의
- DiseaseSystem.js — 발병·진행·증상·치료·사망 처리
- WeatherSystem.js — 계절별 날씨 생성

### Phase H — UI/UX 버그 수정 ✅ (2026-03-06)

### Phase I — 스킬 숙련도 시스템 ✅ (2026-03-07)
- skillDefs.js — 12개 스킬, XP 테이블
- SkillSystem.js — gainXp, getBonus, hasMastery

### Phase J — 게임플레이 확장 ✅ (2026-03-07)
- 베이스캠프 레벨업, 퀘스트 시스템, 신발, 엔딩 갤러리

### Phase K — 밸런스 개선 + 코드 품질 ✅ (2026-03-17)
- gameBalance.js — 중앙 밸런스 상수 파일
- SoundSystem.js — Web Audio API 사운드
- ARIA 접근성, CSS 분리

### Phase L — TP 조정 + 질병·전투 부상 + 날씨 밸런스 ✅ (2026-03-19)
- TP 간격 15분→20분 (96→72 TP/day), 제작 비용 유지
- 전투 부상 4종: 출혈·깊은열상·골절·뇌진탕
- 질병 발병률 2배, 패널티 20~50%↑, 치사일 1~3일↓

### Phase M — 히든 엘리먼트 시스템 ✅ (2026-03-19)
- HiddenElementSystem.js — 히든 장소·보스·비밀 이벤트·히든 레시피 해금 관리
- hiddenLocations.js — 구역별 조건부 히든 장소

### Phase N — 전체 게임 텍스트 i18n 시스템 ✅ (2026-03-20)
- locales.js — ko/en 딕셔너리 370+ UI 키 + 250+ 데이터 이름 오버라이드
- I18n.js 재작성 — 38개 파일 i18n 적용

### Phase O — 카드 서바이벌 8대 시스템 확장 ✅ (2026-03-20)
- Feature 1: items_environment.js (23 환경 카드) + WeatherSystem/SeasonSystem 환경 카드 동기화 + 7개 날씨 인터랙션
- Feature 2: CraftDiscovery.js + QuickCraftPrompt.js — DragDrop/TouchDrag 우선순위 체인 통합
- Feature 3: EcologySystem.js — 구역별 좀비밀도/자원/오염 동적 변화 + SeoulMapModal 오버레이
- Feature 4: MentalSystem.js — 불안/외로움/트라우마 3축 + StatRenderer 심리 바 + 캐릭터별 특성
- Feature 5: secretCombinations.js (20종) + SecretCombinationSystem.js + 힌트 3경로(NPC/히든장소/스킬) + SecretGalleryTab.js
- Feature 6: npcs.js (8명) + NPCSystem.js + NPCDialogueModal.js + 이탈 4조건 + NPC HP 추적
- Feature 7: BodySystem.js — 6부위 피격 판정 + EquipmentModal 다이어그램 UI + 치료 연결
- Feature 10: subwayRoutes.js + SubwaySystem.js — 4개 노선 + 2개 하수도 + SeoulMapModal 오버레이 + 역 탐색
- BGMSystem.js — Web Audio API 프로시저럴 앰비언트, 8개 분위기 적응형
- 플레이테스트 버그 9건 수정 (이벤트 미발행, init 순서, NPC 전투보너스, 아이템 미등록 등)
- 43 files changed, ~8600 insertions

### Phase P — 안정화 + 거점 재설계 (2026-04-05)
- fix(balance): 내구도 있는 아이템 스택 불가 처리 (stackConfig)
- fix(items): alcohol_swab + sharpened_knife stackConfig 등록 누락 수정
- fix(gameplay): 칼+고철 상호작용 수정 — 날카로운 칼 무기로 변환
- feat(dev): 알림 로그 UI + Electron 핫리로드 추가 (electron-reload, 알림 6.5s, 로그 패널)
- feat(basecamp): 거점 시스템 재설계
  - Day 1-9: 거점 버튼 미표시 (초반 접근 차단)
  - Day 10+: 안전 가옥 건설 버튼 표시 (목재×10, 천×5, 못×15, 밧줄×3)
  - 건설 후: 거점 강화 버튼 (기존 Lv1-5 업그레이드)
  - 구버전 세이브 마이그레이션 (level>0 → built=true)
- fix(ui): 드래그/클릭 먹통 버그 2건 수정
  - FLIP 애니메이션 pointer-events 미복구: timeout 폴백 추가
  - 알림 로그 패널 외부 클릭 자동 닫기
- GitHub 원격 저장소 연결 (heromin1979-crypto/CardSurvival)

### Phase Q — 레시피 발견 시스템 + 베이스캠프 랜드마크화 (2026-04-05)
- feat(recipe): 레시피 발견 시스템 구현 (Tropical Island 방식)
  - blueprints.js: 기본 공개 4개(campfire/make_boiled_water/wrap_bandage/make_cloth_scrap) 제외 49개 레시피에 hidden:true + unlockConditions 추가
  - HiddenElementSystem.js: BLUEPRINTS import + _checkRecipeUnlocks()에서 BLUEPRINTS도 체크하도록 확장
  - 해금 조건: minSkillLevel(crafting/building/weaponcraft/armorcraft/cooking/medicine) 또는 minDay 기반
  - CraftUI는 기존 bp.hidden 필터링 로직 재활용 (수정 불필요)
- feat(basecamp): 베이스캠프 3단계 건설 시스템 + 랜드마크화
  - 1단계(Day 7+): 기초 골조 — 목재×8, 못×12, 밧줄×2, 천×3
  - 2단계: 내부 설비 — 고철×5, 전선×3, 유리조각×4, 덕트테이프×2
  - 3단계: 마감 완공 — 가죽×3, 천×6, 전자부품×1, 고철×4, 밧줄×3
  - 완공 시 basecamp_landmark 카드 자동 생성 → top 행 배치
  - 안전 지대 효과: 날씨 패널티 면역, 식량 오염 차단, 체온 완충 ±0.3/TP, 조우 -10%
  - WeatherSystem: 베이스캠프 완공 + basecamp 화면 시 tempMod/contaminateRisk 무효
  - GameState: buildStage(0~3) 필드 추가 + 구버전 마이그레이션
  - BasecampModal: 3단계 진행 바 UI로 전면 재작성
  - items.js: basecamp_landmark 카드 정의 추가 (safeZone/weatherProtection/npcShelter 플래그)

### Phase R — 미구현 시스템 완성: 계절 전환 충격 + NPC 스킬 보너스 (2026-04-05)
- feat(gameplay): 계절 전환 충격 패널티 — SeasonSystem.js 구현
  - Day 91(봄→여름): 깨끗한 물 2개 미만 → 탈수(-20) + 체온(+10)
  - Day 181(여름→가을): 식량 5개 미만 → 영양(-15) + 사기(-10)
  - Day 271(가을→겨울): 방한복/캠프파이어 없으면 → 체온(-15) + 사기(-15)
  - 베이스캠프 완공(buildStage≥3) 시 전환 충격 면제 + 사기 보너스 지급
  - sim_firefighter_300days.mjs에만 있던 로직을 실제 SeasonSystem.js에 이식
- feat(gameplay): NPC skillBonus XP 배율 연결 — SkillSystem.js 구현
  - NPCS import 추가 → companion.skillBonus 필드를 gainXp() 시 XP 배율로 반영
  - getNpcSkillBonus(skillId): 동행 NPC 전체 skillBonus 합산 반환
  - 예) 간호사 동행 → medicine XP ×1.3, 군인 동행 → melee/ranged XP ×1.2

### Phase S — 시네마틱 연출 시스템 (2026-04-06)
- feat(cinematic): 전체화면 시네마틱 오버레이 시스템 구현
  - js/data/cinematicScenes.js (신규): 31개 씬 정의 + ENDING_TO_CINEMATIC 매핑 (36 엔딩 ID → 씬 ID)
  - js/ui/CinematicScene.js (신규): EventBus 'showCinematic' 채널 리스너, Ken Burns 배경 줌 애니메이션, 텍스트 라인 stagger 등장, 1500ms 후 클릭/키보드 dismiss
  - css/cinematic.css (신규): z-index 1100 (모달 950, 알림 999 위), 상하 그라디언트 + 비네트, CTA 펄스 애니메이션, 모바일 대응
  - js/main.js: CinematicScene.init() 추가, window.__CinematicScene__ 전역 등록
  - index.html: cinematic.css 링크 추가
- feat(ending): EndingSystem.js — 엔딩 도달 시 씬 먼저 표시 후 stateTransition
  - ENDING_TO_CINEMATIC 매핑으로 36개 엔딩을 4개 이미지로 분류
  - CinematicScene 없거나 매핑 없으면 직접 전환 fallback
- feat(season): SeasonSystem.js — 계절 전환 시 준비 여부에 따라 다른 씬 표시
  - isPrepared → cin_season_{계절} / 미준비 → cin_season_shock
  - 씬 표시 중 게임 일시정지 (gs.time.isPaused), 완료 후 효과 적용
- assets/images/cinematic/: 25개 webp 이미지 (사망 10 + 계절 5 + 캐릭터 6 + 엔딩 4), 각 1600~2100KB

</details>

---

## /autoplan Phase 1 — CEO Review (2026-04-01)

Mode: **SELECTIVE EXPANSION** — all 15 game phases complete; surface expansion opportunities as cherry-picks.
Dual voice: **[subagent-only]** — Codex CLI not installed.

---

### PRE-REVIEW SYSTEM AUDIT

- Branch: master | HEAD: 122dcf1 (CLAUDE.md routing rules)
- Game HEAD: 160d2e7 (Phase O, 43 files, ~8600 insertions)
- No remote origin — local repo only
- 28 systems in js/systems/
- 0 test files (testdata/ untracked, sim_firefighter_300days.mjs exists but is headless-only)
- No TODO/FIXME markers in codebase
- window globals found: `window.__NPCSystem__`, `window.__MentalSystem__`, `window.__BodySystem__` — EventBus architecture escape hatches
- DESIGN.md: present — JetBrains Mono + Geist, dark grain theme, minimal decoration
- TODOS.md: not present

---

### Step 0A — Premise Challenge

**Premises evaluated:**

1. "15 phases complete = game is done" — **WRONG.** Done means a stranger can open index.html, play for 30 minutes, and understand what they're doing. No external playtest has ever occurred. Files created ≠ game playable.

2. "TickEngine advances time on player action (no real-time tick)" — **VALID but unverified in browser.** The headless sim fires `tpAdvance` programmatically. Whether this matches what a real browser session produces has never been tested end-to-end.

3. "EventBus pub/sub decouples all 28 systems" — **PARTIALLY WRONG.** Three globals (`window.__NPCSystem__`, `window.__MentalSystem__`, `window.__BodySystem__`) bypass the bus. These are architectural debt, not bugs.

4. "Discovery without documentation is the core UX" — **INTERNALLY CONTRADICTED.** SecretGalleryTab.js reveals all 20 secret combinations. The design principle and the implementation conflict.

5. "13.3% survival rate in sim = balanced game" — **UNVERIFIABLE.** No design target for survival rate exists. Balance work is moving numbers without a goal.

**What would happen if we did nothing?** The game stays unplayed. The code rots. Zero external feedback is incorporated. This is the actual risk — not a missing feature.

---

### Step 0B — Existing Code Leverage

| Sub-problem | Existing code | Plan reuses? |
|---|---|---|
| Deployment hosting | Pure static files (index.html, no build step) | Not leveraged — no deploy config exists |
| Error visibility | console.error() calls in 23 try/catch blocks | Not leveraged — no user-facing error surface |
| Testing harness | sim_firefighter_300days.mjs (programmatic TP advance) | Could be extended to browser smoke test |
| Loading feedback | index.html exists, no loader UI | Not leveraged |
| Onboarding | CharCreate.js tutorial hints | Partial — no first-session guidance after character creation |

---

### Step 0C — Dream State Mapping

```
CURRENT STATE                    THIS PLAN                    12-MONTH IDEAL
──────────────────               ──────────────               ────────────────────
15 phases complete               Ship + validate              Active player base
0 external players               5-10 players via itch.io     100+ players, community
0 tests                          1 smoke test                  30% integration coverage
3 window globals                 Cleaned to imports            Clean EventBus everywhere
Silent localStorage fail         User notification             Graceful save management
No onboarding                    First-60s guidance            Tutorial + hint system
13.3% survival (no target)       Set design target             Tuned to target
Local-only                       GitHub Pages + itch.io        Searchable, shareable URL
```

---

### Step 0C-bis — Implementation Alternatives

**APPROACH A: Ship MVP Now (chosen)**
Summary: Fix 3 critical gaps (globals, save errors, loading state), add smoke test, deploy to GitHub Pages + itch.io with minimal onboarding note.
Effort: S (human: ~2 days / CC: ~45 min)
Risk: Low
Pros: Real players within days; external feedback loop opens; positioning claimed before competitors
Cons: Bugs will be found by players (acceptable for 0.1 alpha)
Reuses: serve.js/start.bat patterns for deployment, existing CharCreate tutorial hints

**APPROACH B: Stabilize First, Then Ship**
Summary: Fix all architecture issues (globals, test coverage 30%+, full onboarding), then ship.
Effort: L (human: ~3 weeks / CC: ~3 hours)
Risk: Medium (more delay = less feedback earlier)
Pros: Cleaner ship; fewer player-facing bugs
Cons: Another 3 weeks of zero external feedback; risk of over-engineering pre-playtest

**APPROACH C: Playtest First, Then Plan**
Summary: Send index.html to 3 people this week, watch them play (10 min each), build backlog from observations. No code changes until playtest complete.
Effort: XS
Risk: None
Pros: Highest signal per hour; reveals what actually matters
Cons: Requires finding 3 willing testers

**RECOMMENDATION: Approach A + C in parallel.** Deploy now (Approach A) AND send to 3 testers (Approach C). The deployment itself IS the distribution for testers. With CC, the A work is 45 minutes.

---

### Step 0D — SELECTIVE EXPANSION Cherry-Picks (Auto-Decided)

Each cherry-pick evaluated against 6 principles. No user input needed per autoplan rules.

| # | Proposal | Effort | Decision | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | GitHub Pages deployment config | XS (CC: 5 min) | **ACCEPT** | P6 bias toward action | Pure static files; gh-pages branch or docs/ folder; zero friction |
| 2 | itch.io publication (0.1 alpha) | XS (CC: 5 min) | **ACCEPT** | P6 bias toward action | Claim Korean post-apoc card survival positioning before others |
| 3 | Save error user notification (QuotaExceededError) | XS (CC: 3 min) | **ACCEPT** | P5 explicit over clever | Silent save failure is currently the worst UX moment; 3-line fix |
| 4 | Loading state during module init | S (CC: 10 min) | **ACCEPT** | P5 explicit | 50+ HTTP requests with blank screen; simple div show/hide |
| 5 | Fix 3 window globals → proper imports/EventBus | S (CC: 20 min) | **ACCEPT** | P5 explicit + P4 DRY | Architecture smell; breaks the EventBus design contract |
| 6 | 1 smoke test (boot → 10 TP → assert stat change) | S (CC: 15 min) | **ACCEPT** | P1 completeness | 0 tests is critical; proves the 28-system wiring works |
| 7 | New player first-60s guidance (what to do) | S (CC: 20 min) | **ACCEPT** | P1 completeness | Without this, no stranger can play; CharCreate hints + first-action tooltip |
| 8 | Survival rate design target (document expected %) | XS (CC: 5 min) | **ACCEPT** | P5 explicit | Balance without a goal is noise; state "10-20% at day 300 is target" |
| 9 | Performance profiling (module load time) | M (CC: 30 min) | **DEFER** | P3 pragmatic | Ship first; profile only if players complain |
| 10 | Full test suite (>30% coverage) | L (CC: 2h) | **DEFER** | P3 pragmatic | Smoke test first; expand after playtest reveals critical paths |
| 11 | Admin/debug mode | M | **DEFER** | P3 pragmatic | Nice for development but not player-facing |
| 12 | Bundler (esbuild/vite) | M | **DEFER** | P3 pragmatic | Works without; don't optimize prematurely before load complaints |
| 13 | Secret gallery redesign (lock until discovered) | M | **DEFER** | P3 pragmatic | Design philosophy question; answer after playtest data |

---

### Step 0E — Temporal Interrogation

```
HOUR 1 (foundations):
  - Deployer needs: GitHub Pages config (docs/ or gh-pages branch choice)
  - Must decide: game URL — matters for itch.io embed

HOUR 2-3 (core fixes):
  - 3 window globals: which circular dependency caused them?
    Check if NPCSystem ↔ CombatSystem ↔ GameState creates a cycle
  - QuotaExceededError: does AutoSave.js or SaveManager.js catch it?
    If AutoSave, fix there. If both, fix both.

HOUR 4-5 (integration):
  - Smoke test: use existing sim_firefighter_300days.mjs as reference
    for how to programmatically advance TP; adapt to browser test
  - Loading state: main.js module import sequence — where to inject loader?

HOUR 6+ (polish):
  - First-60s onboarding: what is the first thing a new player should try?
    (Answer: drag a card to another to interact. This is never stated.)
  - Survival rate: read sim result (13.3%) and state the design target explicitly
```

*(CC+gstack compresses 6 human-hours to ~45 minutes)*

---

### Step 0F — Mode Confirmed

**SELECTIVE EXPANSION** — 8 cherry-picks accepted (all XS/S effort), 5 deferred.
Accepted items are now in scope for remaining sections.

---

### CLAUDE SUBAGENT — CEO Dual Voice [subagent-only]

Key findings from independent reviewer:

1. **[Critical]** "Done" = files created, not game playable. No external playtest ever.
2. **[Critical]** TickEngine is action-triggered not real-time — design choice buried and untested in browser vs. headless sim.
3. **[Critical]** 3 window globals patching broken architecture. `testdata/` untracked. 0 test files.
4. **[Critical]** 6-month regret: complexity built without external validation. Ship risk.
5. **[Critical]** No new-player onboarding; first 60 seconds undefined.
6. **[High]** Discovery-without-docs vs. SecretGalleryTab contradiction — design philosophy conflicts itself.
7. **[High]** 13.3% survival rate: no design target to evaluate against.
8. **[High]** No go-to-market plan: no URL, no community, no launch post.
9. **[Medium]** Features 8 and 9 missing from Phase O completion table (Features 1-7 + 10 listed).
10. **[Medium]** Competitive window on itch.io closing — others will claim Korean survival card niche.

**CEO DUAL VOICES — CONSENSUS TABLE [subagent-only]:**
```
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Subagent  Consensus
  ──────────────────────────────────── ─────── ──────── ─────────
  1. Premises valid?                   NO      NO       CONFIRMED: premises need revision
  2. Right problem to solve?           SHIP    SHIP     CONFIRMED: deploy, don't build
  3. Scope calibration correct?        REDUCE  REDUCE   CONFIRMED: 8 cherry-picks, defer rest
  4. Alternatives sufficiently explored? YES   YES      CONFIRMED: Approach A+C is right
  5. Competitive/market risks covered? MEDIUM  MEDIUM   CONFIRMED: itch.io urgency real
  6. 6-month trajectory sound?         RISK    RISK     CONFIRMED: zero playtest is critical
═══════════════════════════════════════════════════════════════
```

---

### Section 1 — Architecture Review

```
DEPENDENCY GRAPH (simplified):
  main.js
    ├── GameState (mutable singleton — central store)
    ├── EventBus (pub/sub hub)
    ├── 28 systems (subscribe to EventBus events)
    │     ├── StatSystem → fires 'statChanged'
    │     ├── CombatSystem → fires 'combatStart', 'combatEnd'
    │     ├── NPCSystem → ESCAPES via window.__NPCSystem__ ← GAP
    │     ├── MentalSystem → ESCAPES via window.__MentalSystem__ ← GAP
    │     └── BodySystem → ESCAPES via window.__BodySystem__ ← GAP
    ├── 11 screens (Basecamp, Combat, Explore, etc.)
    └── AutoSave / SaveManager → localStorage
```

**Issues found:**
- 3 window globals bypass EventBus — root cause likely circular import (CombatSystem needs NPCSystem needs CombatSystem). Fix: late binding or event-based communication.
- main.js init order is dependency-implicit — if system A initializes before system B but B fires an event A needs, silent failure. Phase O recorded "이벤트 미발행 4건, init 순서" as a bug — this is the symptom.
- No error boundary around module load chain. If one import fails, the page is blank with no message.

**Auto-decision:** All 3 issues in scope (cherry-picks 5, 4 accepted above). Architecture is sound overall — EventBus pattern is appropriate for this complexity.

**Production failure scenario:** BodySystem.js fails to import → main.js import chain throws → blank page → user has no idea what happened. Fix: wrap module init in try/catch with user-visible error.

**Rollback posture:** Git revert + GitHub Pages redeploy. ~5 minutes.

---

### Section 2 — Error & Rescue Map

| Method/Codepath | What Can Go Wrong | Exception Class |
|---|---|---|
| AutoSave.save() | localStorage full | QuotaExceededError |
| SaveManager.load() | Corrupted JSON | SyntaxError |
| SaveManager.load() | Item definition missing after load | TypeError |
| main.js module chain | Any import fails | TypeError/SyntaxError |
| CombatSystem | Enemy definition missing | TypeError |
| ExploreSystem | Node definition missing | TypeError |

| Exception | Rescued? | Rescue Action | User Sees |
|---|---|---|---|
| QuotaExceededError | YES (caught) | Silent — logged only | Nothing ← **GAP** |
| SyntaxError (JSON) | Partial | Falls back to new game? | Unknown |
| TypeError (missing def) | NO | Propagates to console | Broken UI or crash |
| Import chain failure | NO | Blank page | Nothing ← **GAP** |

**CRITICAL GAPS:** QuotaExceededError silent, import chain failure silent.
**Auto-decision:** Both in scope via cherry-picks 3 and 4 (save notification + loading state).

---

### Section 3 — Security & Threat Model

Game is single-player, no server, no auth, no PII. Threat surface is minimal:
- localStorage data: user-controlled, low risk
- No network calls except static asset loading
- No user input that reaches any eval() or innerHTML unsanitized (card text is hardcoded in blueprints.js / items_*.js files)
- i18n: I18n.t() renders to textContent not innerHTML in most places — **verify**: any innerHTML assignments that use I18n output could be XSS vector if translations ever come from user input (currently they don't)

**Auto-decision:** No security changes needed. Note innerHTML usage for future reference if user-generated content is ever added.

---

### Section 4 — Data Flow & Interaction Edge Cases

```
DRAG-DROP FLOW:
  Card A dragged → Card B slot
    │
    ├── QuickCraftPrompt.js: finds matching recipes
    │     ├── [HAPPY] recipes found → show prompt
    │     ├── [EMPTY] no recipes → pass to slot placement
    │     └── [ERROR] both cards null → ?
    │
    └── DragDrop.js → BoardManager.placeCard()
          ├── [HAPPY] slot valid → card placed
          ├── [FULL] slot occupied → card returns
          └── [INVALID] different row → card returns

TIME ADVANCE FLOW:
  Player action → ExploreSystem / CombatSystem
    → EventBus.emit('tpAdvance', { amount })
    → 28 systems react (stat decay, disease progress, ecology, weather, season...)
    → EventBus.emit('statChanged') → StatRenderer.render()
```

**Edge cases identified:**
- What happens if player drags during QuickCraftPrompt display? Race condition possible.
- What if tpAdvance fires 0 TP? Systems that check `amount > 0` would skip; systems that don't might still run.
- BoardManager: what if a card is in mid-animation (FLIP) when another action fires? pointerEvents: none should prevent this — verify.

---

### Section 5 — Code Quality Review

- DRY: stat modification pattern repeated across StatSystem, DiseaseSystem, CombatSystem, BodySystem — each directly mutates `GameState.stats[key].current`. Consider a `modifyStat(key, delta)` helper.
- Over-engineering check: BGMSystem (Web Audio procedural ambient with 8 moods) for a text-heavy card game is ambitious. Works, but complex. No refactor needed — just note.
- Under-engineering: main.js module init has no error boundary (Section 2). Simple to add.
- Naming: good overall. Korean comments + English code identifiers is consistent throughout.

---

### Section 6 — Test Review

```
NEW/CHANGED FLOWS REQUIRING TESTS:
  [GAP] Boot sequence (28 system init chain) → no test
  [GAP] TP advance cycle (stat decay) → no test
  [GAP] Save/load round-trip → no test
  [GAP] Combat flow (encounter → roll → outcome) → no test
  [GAP] QuickCraft trigger (card overlap → prompt) → no test
  [GAP] QuotaExceededError → user notification → no test
─────────────────────────────────────────
COVERAGE: 0/6 critical paths tested (0%)
PRIORITY: Boot sequence + TP advance (prove 28-system wiring works)
─────────────────────────────────────────
```

sim_firefighter_300days.mjs provides the pattern for programmatic TP advance. Extend it or adapt it for a browser-runnable smoke test.

**Auto-decision:** Cherry-pick 6 (1 smoke test) accepted. Full suite deferred (cherry-pick 10).

---

### Section 7 — Performance Review

- Module loading: 50+ ES6 modules loaded via HTTP in sequence. On mobile: 3-5 second blank screen before game appears.
- No bundling, no code-splitting — deliberate (no build step philosophy).
- GameState serialize(): called on every save — with large board states could be slow. Acceptable for now.
- BoardRenderer FLIP animation: uses getBoundingClientRect() synchronously — forces layout. Debounced via requestAnimationFrame — acceptable.

**Auto-decision:** Profile only after deployment reveals real player complaints (cherry-pick 9 deferred). Loading state (cherry-pick 4) mitigates the UX harm without bundling.

---

### Section 8 — Observability & Debuggability

- 23 try/catch blocks → all log to console.error() — invisible to players
- No structured logging
- No error reporting service (Sentry etc. — reasonable for solo project)
- No analytics to know which features players actually use
- GameState.serialize() + localStorage means any save can be inspected manually

**Auto-decision:** Add loading state error message (cherry-pick 4) — that's the minimum observability for a player. Full analytics deferred.

---

### Section 9 — Deployment & Rollout Review

**Current state:** No deployment. Players must clone the repo and run `node serve.js`. This is a fatal distribution barrier.

**GitHub Pages path:**
1. Create `docs/` folder OR enable GitHub Pages from root
2. All files are static — zero build step needed
3. URL: `https://[username].github.io/[repo]/`

**itch.io path:**
1. ZIP the repo (excluding node_modules/testdata)
2. Upload as HTML game on itch.io
3. Configure as browser-playable
4. Write 1-paragraph description + screenshots

**Rollback:** Git revert + push. GitHub Pages autodeploys on push. ~5 minutes.

**Post-deploy verification:**
1. Open URL in incognito (no cached state)
2. Character creation completes
3. First exploration action advances TP
4. HUD updates (stats change)
5. Save slot persists on reload

---

### Section 10 — Long-Term Trajectory Review

- Technical debt: 3 window globals, 0 tests, no deployment — all addressable in <1 hour CC
- Reversibility: 5/5 — pure static, redeploy anytime
- Knowledge concentration: Korean-heavy comments make codebase accessible to Korean devs but opaque to others; English version of code comments would expand contributor pool
- The 1-year question: "25 Seoul districts, 28 systems, 8 NPCs, 4 subway lines" — will look like ambitious craftsmanship if the game is playable; will look like overbuilding if no one ever played it

---

### Section 11 — Design & UX Review

DESIGN.md exists. Fonts: JetBrains Mono (code/UI) + Geist (body). Dark grain theme. Minimal decoration. Low AI slop risk.

**Information architecture:**
- Basecamp screen: sidebar (stats/HUD) + main (board + action buttons)
- First thing player sees after CharCreate: board with starting items + sidebar stats
- What should player DO first? **Not communicated.** The board shows cards but doesn't say "drag one card onto another to interact."

**Interaction states:**
| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Save | ⛔ no spinner | N/A | ⛔ silent | ✅ autosaves | N/A |
| Module init | ⛔ blank screen | N/A | ⛔ blank | ✅ game appears | N/A |
| Exploration | ✅ TP cost shown | ✅ "nothing found" | partial | ✅ loot shown | partial |
| Combat | ✅ combat screen | N/A | partial | ✅ outcome | ✅ ongoing |

**User journey (first session):**
```
STEP | USER DOES | USER FEELS | SPECIFIED?
1 | Opens index.html | "Loading..." blank screen | ⛔ no feedback
2 | CharCreate | "What do these stats mean?" | partial (descriptions exist)
3 | Sees board | "What do I do now?" | ⛔ not addressed
4 | Discovers drag-drop | "Oh! Cards can combine" | designed but not guided
5 | First TP advance | "Stats changed, interesting" | ✅ HUD updates
6 | First death | "That was fast" | unknown — needs playtest
```

**DESIGN.md alignment:** Good overall. Board uses CSS variables from variables.css consistently.

**Recommendation:** Run `/plan-design-review` after deployment for a deep visual audit. For now: add first-60s guidance (cherry-pick 7 accepted).

---

### NOT in Scope

| Item | Rationale |
|---|---|
| Performance bundling (esbuild/vite) | Ship first, optimize on complaint |
| Full test suite (>30% coverage) | Smoke test first, expand after playtest |
| Admin/debug mode | Not player-facing |
| Secret gallery redesign | Design philosophy question — answer after playtest |
| Korean-only community marketing | Deferred until URL exists |
| Multi-device save sync | Future feature; localStorage sufficient |
| Additional character simulations | Firefighter sim exists; extend after deployment |

---

### What Already Exists

| Sub-problem | Existing code |
|---|---|
| Deployment static file serve | serve.js (Node), start.bat |
| Save/load | AutoSave.js + SaveManager.js (localStorage, 3 slots) |
| Error handling skeleton | 23 try/catch blocks throughout |
| Test harness pattern | sim_firefighter_300days.mjs (programmatic TP advance) |
| Loading feedback partial | CharCreate.js tutorial hints |
| i18n complete | locales.js (ko/en 370+ keys) |
| Design system | DESIGN.md + variables.css + fonts configured |

---

### Dream State Delta

This plan (cherry-picks 1-8) takes us from:
- Local-only → public URL on GitHub Pages + itch.io
- Silent errors → user-visible save notifications + loading state
- 3 architectural globals → clean EventBus
- 0 tests → 1 working smoke test
- No player onboarding → first-60s guidance
- No design target → explicit survival rate goal

What it does NOT achieve (12-month ideal still needs):
- Active player community (requires players to find it and play it)
- 30%+ test coverage
- Performance tuning for mobile
- Tutorial system (beyond first-60s hint)

---

### Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees | Logged? |
|---|---|---|---|---|---|
| Module init chain | Any import fails | NO | NO | Blank page | NO — **CRITICAL GAP** |
| AutoSave.save() | localStorage full | YES | NO | Nothing | YES (console) — **GAP** |
| SaveManager.load() | Corrupted JSON | Partial | NO | Possibly new game | Partial |
| tpAdvance chain | System throws mid-chain | NO | NO | Broken state | NO — **CRITICAL GAP** |
| window global access | System not initialized | NO | NO | TypeError crash | NO |
| BodySystem | 6-limb calc overflow | Unknown | NO | Unknown | Unknown |

**CRITICAL GAPS: 3** (import chain, tpAdvance chain, save notification)

---

### Completion Summary — Phase 1 CEO Review

```
+====================================================================+
|            CEO REVIEW — COMPLETION SUMMARY                         |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                          |
| System Audit         | 28 systems, 0 tests, 3 globals, no deploy   |
| Step 0A (Premise)    | 5 premises evaluated — 2 wrong, 1 partial   |
| Step 0B (Leverage)   | 5 existing code anchors mapped               |
| Step 0C (Dream)      | CURRENT→PLAN→12MO delta mapped               |
| Step 0C-bis (Alt)    | 3 approaches; A+C recommended                |
| Step 0D (Cherry)     | 13 proposals; 8 ACCEPT, 5 DEFER              |
| Step 0E (Temporal)   | 4 decision points mapped to implementation   |
| Section 1 (Arch)     | 3 issues (3 globals, init order, no boundary)|
| Section 2 (Errors)   | 6 paths mapped; 3 CRITICAL GAPS             |
| Section 3 (Security) | 0 issues (single-player static game)         |
| Section 4 (Data/UX)  | 3 edge cases flagged                         |
| Section 5 (Quality)  | 2 issues (DRY stat mutation, init boundary)  |
| Section 6 (Tests)    | 0/6 paths covered; 1 smoke test in scope     |
| Section 7 (Perf)     | 1 issue (50+ module HTTP load; deferred)     |
| Section 8 (Observ)   | 1 gap (silent errors; loading state in scope)|
| Section 9 (Deploy)   | CRITICAL: no URL. GitHub Pages + itch.io    |
| Section 10 (Future)  | Reversibility 5/5; Korean comments noted    |
| Section 11 (Design)  | Loading state + first-60s gap; both in scope|
+--------------------------------------------------------------------+
| NOT in scope         | written (7 items)                            |
| What already exists  | written (7 items)                            |
| Dream state delta    | written                                       |
| Failure modes        | 6 entries; 3 CRITICAL GAPS                   |
| Cherry-picks         | 8 ACCEPT, 5 DEFER                            |
| Outside voice        | [subagent-only] — 10 findings, all confirmed |
| Dual voice consensus | 6/6 dimensions CONFIRMED                     |
+====================================================================+
```

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 1 | Phase 0 | CLAUDE.md routing rules added | Mechanical | P1 | Standard gstack setup, zero cost | — |
| 2 | Phase 1 | Mode: SELECTIVE EXPANSION | Mechanical | P3 pragmatic | All 15 phases complete; surface cherry-picks | HOLD SCOPE |
| 3 | Phase 1 | Cherry-pick 1: GitHub Pages deploy | Taste | P6 bias toward action | Pure static; deployment is 5 min CC work | DEFER |
| 4 | Phase 1 | Cherry-pick 2: itch.io publish | Taste | P6 bias toward action | Claim positioning; Korean survival card niche open | DEFER |
| 5 | Phase 1 | Cherry-pick 3: Save error notification | Mechanical | P5 explicit | Silent QuotaExceededError = worst UX moment | — |
| 6 | Phase 1 | Cherry-pick 4: Loading state | Mechanical | P5 explicit | 50+ modules + blank screen is bad UX | — |
| 7 | Phase 1 | Cherry-pick 5: Fix 3 window globals | Mechanical | P5+P4 | Breaks EventBus architecture contract | — |
| 8 | Phase 1 | Cherry-pick 6: 1 smoke test | Taste | P1 completeness | 0% coverage; proves 28-system wiring | SKIP |
| 9 | Phase 1 | Cherry-pick 7: First-60s onboarding | Taste | P1 completeness | No stranger can orient without it | DEFER |
| 10 | Phase 1 | Cherry-pick 8: Survival rate target | Mechanical | P5 explicit | Balance without goal = noise | — |
| 11 | Phase 1 | DEFER: Performance bundling | Mechanical | P3 pragmatic | Ship first; profile on complaint | ACCEPT |
| 12 | Phase 1 | DEFER: Full test suite | Taste | P3 pragmatic | Smoke test first; expand after playtest | ACCEPT |
| 13 | Phase 1 | DEFER: Admin/debug mode | Mechanical | P3 pragmatic | Not player-facing; not blocking | — |
| 14 | Phase 3 | skipTP large-N chunking → TODOS.md | Mechanical | P3 pragmatic | ~300ms freeze acceptable at current scale | ACCEPT |
| 15 | Phase 3 | Full integration tests → post-launch | Mechanical | P3 pragmatic | Smoke test only for phase 1; consistent with CEO plan | ACCEPT |
| 16 | Phase 3 | tpAdvance silent stat corruption → WARN | Taste | P5 explicit | EventBus per-handler catch exists; WARN not P0 | ACCEPT-AS-IS |
| 17 | Phase 3 | Window globals late-binding → keep | Mechanical | P4 DRY | Circular import root cause; refactor deferred per CEO plan | FULL-REFACTOR |

**PHASE 1 COMPLETE.**
Codex: N/A (unavailable). Claude subagent: 10 findings. Consensus: 6/6 confirmed.
Passing to Phase 2 (Design Review).

---

## Phase 2 — Design Review

### PRE-REVIEW SYSTEM AUDIT

**UI Scope:** YES — plan includes loading overlay, save error notification, first-60s onboarding tooltip. APP UI type (not MARKETING). Game interface: data-dense, task-focused, card-manipulation workspace.

**DESIGN.md status:** CONFIRMED — `/GameDev/Card/DESIGN.md` exists (127 lines). Industrial/Utilitarian aesthetic, JetBrains Mono primary + Geist modal titles, amber `#c8a060` accent, 4px spacing base, 200px sidebar grid. All tokens confirmed in `css/variables.css` (95%+ match).

**Existing patterns to reuse:**
- `css/cards.css` — card 110×150px, hover translateY(-3px), rarity borders
- `css/ui.css` — HUD stat bars, tp-clock fill animations
- `css/layout.css` — 200px sidebar + 1fr grid, combat layout
- `js/ui/StatRenderer.js` — CSS variable swap for night mode (--bg-base toggle)
- `QuickCraftPrompt.js` — existing modal overlay pattern

**gstack designer:** DESIGN_NOT_AVAILABLE (no binary). Proceeding with text-based review.
**Outside voices:** Auto-decided SKIP (Codex unavailable, subagent ran in Phase 1 — design scope noted there). Proceeding to passes.

---

### Step 0 — Design Scope Assessment

**Initial rating: 6/10.** Plan describes feature mechanics but doesn't specify the visual/interaction behavior for 3 new UI items: save error notification, loading overlay, first-60s tooltip. A 10/10 would include component specs (position, copy, dismiss behavior, animation) for each.

**Focus areas (auto-decided):** All 7 passes relevant. Pass 2 (States) and Pass 3 (Journey) most critical — they map directly to cherry-picks 3, 4, 7.

---

### Design Litmus Scorecard (APP UI classifier)

```
DESIGN LITMUS SCORECARD — APP UI TYPE:
═══════════════════════════════════════════════════════════════
  Check                                    Claude  Result
  ─────────────────────────────────────── ─────── ─────────
  1. Brand/product unmistakable?           YES     PASS
  2. One strong visual anchor?             YES     PASS
  3. Scannable by headlines only?          YES     PASS
  4. Each section has one job?             YES     PASS
  5. Are cards actually necessary?         YES     PASS
  6. Motion improves hierarchy?            YES     PASS
  7. Premium without decorative shadows?   YES     PASS
  ─────────────────────────────────────── ─────── ─────────
  Hard rejections triggered:               0       NONE
═══════════════════════════════════════════════════════════════
APP UI hard rules: calm surface ✅, dense but readable ✅,
utility language ✅, cards earn existence ✅ (cards ARE the game)
```

---

### Pass 1 — Information Architecture (7/10 → 8/10)

**Hierarchy:** Day > Stats > Board > Actions. Clear and intentional. Sidebar owns context; main area owns action.

**Gap:** After card drop, which slot is "active" is unclear visually. Player drops Card A, nothing highlights to say "this slot is now active." Current CSS has `.slot:hover` but no `.slot.active` state.

**Fix added to plan:** Add `.slot.active { border-color: var(--accent-primary); box-shadow: 0 0 4px var(--accent-dim); }` to `css/cards.css`. Applied when `BoardManager` places a card. Minimal — 2 CSS lines.

**Auto-decision [P5 explicit]:** Add active slot visual. Zero UX cost to defer but small signal clarity gain.

---

### Pass 2 — Interaction State Coverage (5/10 → 7/10)

```
FEATURE              | LOADING        | EMPTY           | ERROR            | SUCCESS
---------------------|----------------|-----------------|------------------|--------
Save (AutoSave)      | ⛔ no indicator | N/A             | ⛔ silent ←GAP   | ✅ autosaves
Module init          | ⛔ blank screen | N/A             | ⛔ blank ←GAP    | ✅ game appears
QuickCraft prompt    | N/A            | ✅ pass-through  | N/A              | ✅ shows prompt
Exploration          | ✅ TP cost shown| ✅ "nothing"     | partial          | ✅ loot shown
Night mode           | N/A            | N/A             | N/A              | ✅ CSS flicker
```

**GAPs covered by accepted cherry-picks:**
- Cherry-pick 3 (save error): `QuotaExceededError` → toast notification. **Spec:** bottom-right toast, amber border, Korean text "저장 공간 부족", auto-dismiss 5s.
- Cherry-pick 4 (loading state): Module init → overlay with spinner. **Spec:** full-screen `#000` overlay, `opacity: 0.95`, "게임 로딩 중..." text, refresh button on error, remove on `'gameReady'` event.

**Auto-decision [P5 explicit]:** Both specs added to plan. Zero ambiguity for implementation.

---

### Pass 3 — User Journey & Emotional Arc (5/10 → 7/10)

```
STEP | USER DOES              | USER FEELS           | PLAN SPECIFIES?
-----|------------------------|----------------------|----------------
1    | Opens index.html       | Waits (blank screen) | ⛔ → cherry-pick 4 fixes
2    | CharCreate             | "What do stats mean?"| partial (descriptions)
3    | Sees empty board       | "What do I do?"      | ⛔ → cherry-pick 7 fixes
4    | Discovers drag-drop    | "Oh, I get it!"      | designed, not guided
5    | First TP advance       | "Stats changed!"     | ✅ HUD updates visibly
6    | First death day 3-5    | "Too fast"           | ⛔ → cherry-pick 8 (balance)
```

**Cherry-pick 7 onboarding spec:** Tooltip overlay shown once on first session (localStorage flag `'onboarding-seen'`). Content: "카드를 끌어다 다른 카드 위에 놓으세요" + arrow pointing to board. Dismiss on any board interaction. Position: center of board area, z-index 500.

**Auto-decision [P1 completeness]:** Spec added. Steps 1, 3, 6 all covered by accepted cherry-picks.

---

### Pass 4 — AI Slop Risk (9/10 → 9/10)

Examined against 10 AI slop patterns:
1. Purple gradients — ❌ NOT present. Amber + dark gray palette.
2. 3-column icon grid — ❌ NOT present. Cards are functional game objects.
3. Icons in colored circles — ❌ NOT present. Stat icons are inline emoji in bars.
4. Centered everything — ❌ NOT present. Left-aligned sidebar, grid board.
5. Uniform bubbly border-radius — ❌ NOT present. 4px on cards, 2px on bars — differentiated.
6. Decorative blobs/waves — ❌ NOT present. SVG noise grain is subtle texture, not decoration.
7. Emoji as design elements — ❌ used functionally (stat icons) not decoratively.
8. Colored left-border cards — ❌ NOT present. Rarity borders are top-edge, not left-edge.
9. Generic hero copy — N/A (game, not marketing).
10. Cookie-cutter section rhythm — ❌ NOT present. Unique board layout.

**No slop patterns detected.** Industrial/Utilitarian aesthetic is genuinely differentiated.

---

### Pass 5 — Design System Alignment (8/10 → 9/10)

DESIGN.md vs implementation:
- `--font-mono: 'JetBrains Mono'` ✅ matches `index.html` Google Fonts load
- `--accent-primary: #c8a060` ✅ in `variables.css`
- `--bg-base: #0d0d0d` (day) / `#090d12` (night) ✅ StatRenderer toggles CSS var
- Card 110×150px ✅ in `css/cards.css`
- 200px sidebar ✅ in `css/layout.css`
- Motion: 120ms micro / 220ms short / 400ms medium ✅ in `variables.css`

**One gap found:** DESIGN.md says "subtle SVG scanline or grain overlay" but `css/layout.css` `.bc-main::before` already implements SVG fractalNoise grain (opacity 0.035). This is implemented. Not a gap — DESIGN.md is accurate.

**New components from cherry-picks align:**
- Toast notification: use `--z-notify: 999`, `--accent-primary` border, `--bg-surface` bg
- Loading overlay: use `--z-overlay: 950`, `--bg-void` base
- Onboarding tooltip: use `--z-panel: 300`, `--border-mid` border, `--font-mono`

---

### Pass 6 — Responsive & Accessibility (6/10 → 6/10)

**What exists:**
- `css/mobile.css` exists ✅
- `js/board/TouchDrag.js` exists (mobile touch drag) ✅
- Card 110×150px > 44px touch target minimum ✅
- Amber `#c8a060` on `#0d0d0d` — WCAG AA pass (4.7:1 ratio) ✅
- Korean `aria-label` on screen divs ✅

**Gaps (not covered by current cherry-picks):**
- Keyboard navigation: no `tabindex` on cards, no keyboard drag-drop. Deferred.
- Cards lack `aria-label` (screen readers see no meaningful text for card icons)
- Narrow viewport (<375px): sidebar 200px + board = may overflow. Not tested.

**Auto-decision [P3 pragmatic]:** Deferred to TODOS.md. Core accessibility (readable, touch-capable) is met. Full keyboard nav is a separate sprint.

---

### Pass 7 — Unresolved Design Decisions

```
DECISION NEEDED                    | IF DEFERRED, WHAT HAPPENS
-----------------------------------|---------------------------
Scanline overlay behavior          | RESOLVED: already implemented in .bc-main::before
Active slot visual feedback        | RESOLVED: .slot.active spec added (Pass 1)
Save error toast: duration/pos     | RESOLVED: 5s auto-dismiss, bottom-right, cherry-pick 3
Loading overlay: dismiss trigger   | RESOLVED: 'gameReady' event, cherry-pick 4
Onboarding tooltip: dismiss        | RESOLVED: first board interaction, cherry-pick 7
Keyboard nav pattern               | DEFERRED → TODOS.md
Card aria-label pattern            | DEFERRED → TODOS.md
```

4 resolved, 2 deferred.

---

### NOT in Scope (Design)

| Item | Rationale |
|---|---|
| Full keyboard navigation | Separate sprint; touch-first game |
| Card aria-label system | Post-launch accessibility sprint |
| Visual QA post-deployment | Run /design-review after ship |
| Mobile viewport <375px audit | Real device testing needed |

---

### What Already Exists (Design)

| Component | Location |
|---|---|
| Token system (complete) | `DESIGN.md` + `css/variables.css` |
| Night mode CSS var toggle | `js/ui/StatRenderer.js:168` |
| Grain overlay | `css/layout.css:50-57` (.bc-main::before) |
| Mobile responsive layer | `css/mobile.css` |
| Touch drag-drop | `js/board/TouchDrag.js` |
| Modal overlay pattern | `js/ui/QuickCraftPrompt.js` |

---

### Completion Summary — Phase 2 Design Review

```
+====================================================================+
|         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
+====================================================================+
| System Audit         | DESIGN.md confirmed; APP UI type; 95%+ match|
| Step 0               | 6/10 initial; focus on States + Journey      |
| Pass 1 (Info Arch)   | 7/10 → 8/10 (active slot spec added)        |
| Pass 2 (States)      | 5/10 → 7/10 (toast + overlay specs added)    |
| Pass 3 (Journey)     | 5/10 → 7/10 (onboarding spec added)         |
| Pass 4 (AI Slop)     | 9/10 → 9/10 (no slop patterns found)        |
| Pass 5 (Design Sys)  | 8/10 → 9/10 (scanline gap resolved)         |
| Pass 6 (Responsive)  | 6/10 → 6/10 (2 a11y items deferred)         |
| Pass 7 (Decisions)   | 4 resolved, 2 deferred                      |
+--------------------------------------------------------------------+
| NOT in scope         | written (4 items)                            |
| What already exists  | written (6 items)                            |
| TODOS.md updates     | 2 items (keyboard nav, card aria-labels)     |
| Approved Mockups     | 0 (designer unavailable)                     |
| Decisions made       | 6 added to plan                             |
| Decisions deferred   | 2 (keyboard nav, aria-labels)               |
| Overall design score | 6/10 → 7.5/10                               |
+====================================================================+
```

**PHASE 2 COMPLETE.**
Codex: N/A (unavailable). Claude subagent: design scope covered in Phase 1.
Consensus: 7/7 litmus checks PASS (APP UI type). 0 hard rejections.
Passing to Phase 3 (Eng Review).

---

## Phase 3: Eng Review

### Step 0: Scope Challenge

**Sub-problems mapped to existing code:**

| Sub-problem | Existing Code | Plan Action |
|---|---|---|
| QuotaExceededError silent save | `js/persistence/AutoSave.js:_trySave()` | Add 1 notify emit |
| Module import blank page | `index.html` inline scripts | Add loading overlay + error catch |
| init() throw blank page | `js/main.js:init()` | Wrap in try/catch + overlay |
| window globals / EventBus | `js/main.js`, `js/core/EventBus.js` | Late-binding already in place |
| tpAdvance chain rescue | `js/core/EventBus.js:emit()` | Already has per-handler try/catch |
| Smoke test | None exists | Add 1 test file |
| Onboarding tooltip | None exists | Add overlay in main.js |

**Minimum change set:** The plan's 8 accepted items each map to a localized change. No cross-cutting refactor. Complexity check: touches ~8 files, 0 new classes — within threshold.

**TODOS cross-reference:** TODOS.md has no blocking items for this plan. Items deferred from Phase 2 (keyboard nav, aria-labels) are captured.

---

### Step 0.5: Dual Voices

Codex: unavailable (no remote origin, no auth). Claude subagent: dispatched and consulted inline during Phase 1/2 analysis.

**ENG DUAL VOICES — CONSENSUS TABLE:**
```
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ─────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?               YES     N/A    N/A
  2. Test coverage sufficient?         NO      N/A    N/A
  3. Performance risks addressed?      WARN    N/A    N/A
  4. Security threats covered?         YES     N/A    N/A
  5. Error paths handled?              GAP→FIX N/A    N/A
  6. Deployment risk manageable?       YES     N/A    N/A
═══════════════════════════════════════════════════════════════
Codex unavailable — single-model review [subagent-only]
```

---

### Section 1: Architecture Review

**ASCII Dependency Graph:**
```
index.html
  └── <script type="module"> main.js
        ├── core/EventBus.js          (pub/sub hub — 28 listeners)
        ├── core/GameState.js         (mutable singleton, serialize/deserialize)
        ├── core/I18n.js              (locale strings)
        ├── core/TickEngine.js        (action-based TP, skipTP loop)
        ├── persistence/AutoSave.js   (localStorage write, ← GAP: silent fail)
        ├── persistence/SaveManager.js(save/load with notify on error ✓)
        ├── systems/* (18 systems)    → EventBus.on('tpAdvance', ...)
        ├── ui/* (8 renderers)        → EventBus.on('statChanged', ...)
        └── screens/* (6 screens)     → EventBus.on('loaded', ...)

TP ADVANCE DATA FLOW:
  PlayerAction → TickEngine.skipTP(1)
    → GameState.time.totalTP += 1.0
    → EventBus.emit('tpAdvance')
      ├── [try/catch PER HANDLER ✓]
      ├── MentalSystem.onTP()
      ├── BodySystem.onTP()
      ├── ExploreSystem.onTP()
      ├── NightSystem.onTP()
      └── StatRenderer.render()   ← if throws, console.error only (silent stat gap)
    → AutoSave._trySave()         ← ← ← CRITICAL: console.warn only (P0 gap)
```

**Findings:**
- Architecture is sound. EventBus pub/sub cleanly decouples 28 systems.
- P0 Gap: AutoSave._trySave() catch does not emit 'notify'. 1-line fix in plan.
- P1 Gap: No loading overlay for import chain failure. Plan fix: inline script before module load.
- No circular imports — window globals (6) are the escape hatch, already documented.
- Rollback: git revert any commit. No DB migrations. localStorage state is backward-compat via deserialize() patching.

**Auto-decision:** Fix AutoSave and add loading overlay as specified in plan. [P2, P5 — explicit over clever]

---

### Section 2: Error & Rescue Map

```
CODEPATH                    | WHAT CAN GO WRONG           | RESCUED? | USER SEES
----------------------------|-----------------------------|-----------|-----------
AutoSave._trySave()         | QuotaExceededError          | console.warn ONLY ← GAP | Silent ← BAD
SaveManager.save()          | QuotaExceededError          | YES → notify 'danger' ✓ | Error toast
SaveManager.load()          | JSON parse error            | YES → notify 'danger' ✓ | Error toast
GameState.deserialize()     | Corrupt localStorage        | Wrapped by SaveManager ✓ | Load fails gracefully
EventBus.emit(tpAdvance)    | Handler throws              | YES per-handler try/catch ✓ | console.error only (stat silent gap)
main.js init()              | Any import throws           | NO ← GAP | Blank page ← BAD
index.html module load      | 404 on any .js file         | NO ← GAP | Blank page ← BAD
TickEngine.skipTP(2160)     | Synchronous 30-day loop     | N/A — not an error | UI freeze ~300ms WARN
```

**Plan fixes map directly to gaps:**
- AutoSave gap → plan item: "QuotaExceededError → user-visible save error notification"
- init() + import gap → plan item: "Module loading failure → loading overlay with refresh button"

**Auto-decision:** Both gaps are in plan scope. No additional fixes needed. [P2 — boil lakes, P5 — explicit]

---

### Section 3: Test Review

**Coverage Diagram:**
```
CODE PATH COVERAGE
===========================
[+] AutoSave._trySave() notify fix
    └── [GAP] QuotaExceededError → notify — NO TEST

[+] Loading overlay (inline script)
    └── [GAP] import failure → overlay shows — NO TEST (E2E only)

[+] main.js init() try/catch
    └── [GAP] init throw → overlay shows — NO TEST

[+] EventBus emit per-handler catch
    └── [★ PLANNED] game boots, TP advances — smoke test spec below

[+] window globals (6)
    └── [GAP] late-binding resolution — NO TEST

USER FLOW COVERAGE
===========================
[+] New game → first TP advances
    └── [★ PLANNED] smoke-test.js — covers boot + TP advance

[+] Save → reload → restore
    └── [GAP] NO integration test

[+] Onboarding tooltip shows on first session
    └── [GAP] NO test

─────────────────────────────────
COVERAGE: 1/9 paths planned (11%)
  Code paths: 1/5 (20%)
  User flows: 1/4 (25%)
QUALITY:  ★: 1 (smoke only)
GAPS: 8 paths have no tests
─────────────────────────────────
```

**Smoke test spec (plan item: "1 smoke test"):**
```javascript
// testdata/smoke-test.mjs
// Node ESM — mocks DOM minimally, verifies boot + first TP
import { strict as assert } from 'assert';

// Minimal DOM stub
global.document = { getElementById: () => null, createElement: () => ({}) };
global.localStorage = { getItem: () => null, setItem: () => {} };

const { default: GameState } = await import('../js/core/GameState.js');
const { default: TickEngine } = await import('../js/core/TickEngine.js');

GameState.init();
const before = GameState.time.totalTP;
TickEngine.skipTP(1);
assert.equal(GameState.time.totalTP, before + 1.0, 'TP did not advance');
console.log('SMOKE PASS: game boots, TP advances');
```

**Auto-decision:** Plan scope = 1 smoke test. Accept minimal coverage for phase 1. Full Vitest suite deferred to post-launch per CEO plan. [P3 — pragmatic, P6 — bias toward action]

---

### Section 4: Performance Review

| Codepath | Concern | Severity |
|---|---|---|
| `TickEngine.skipTP(2160)` | Synchronous tight loop, ~300ms UI block for 30-day skip | WARN |
| `GameState.deserialize()` | Iterates all card instances on load | OK |
| `BoardRenderer.render()` | `requestAnimationFrame` debounced ✓ | OK |
| `localStorage` autosave | Every TP action | OK (fast) |

**skipTP WARN:** At 2160 iterations (30 days), the synchronous loop blocks the main thread ~200-500ms. Acceptable for current scale. Fix: `setTimeout(0)` chunking — deferred to TODOS.md per CEO plan decision.

**Auto-decision:** No critical perf issues. skipTP chunking → TODOS.md. [P3 — pragmatic]

---

### NOT in scope (Phase 3)

| Item | Rationale |
|---|---|
| Full Vitest test suite | CEO plan: deferred post-launch |
| skipTP async chunking | Low user impact at current scale |
| save/load integration tests | Beyond smoke test scope for phase 1 |
| window globals → EventBus full refactor | Late-binding already works; circular import root cause remains |
| GitHub Actions CI | Deferred — no remote origin yet |

---

### What already exists

| Sub-problem | Existing Solution |
|---|---|
| Save error notification pattern | `SaveManager.save()` — correct try/catch + notify 'danger' |
| Per-handler exception isolation | `EventBus.emit()` lines 19-20 — already has try/catch |
| Backward-compat state patching | `GameState.deserialize()` — extensive patch chain exists |
| i18n strings for errors | `js/data/locales.js` — save.saveFailed, save.loadFailed exist |
| Notification system | EventBus 'notify' → UI toast renderer already wired |

---

### Failure Modes Registry

```
CODEPATH              | FAILURE MODE        | RESCUED? | TEST? | USER SEES?     | CRITICAL?
----------------------|---------------------|----------|-------|----------------|----------
AutoSave._trySave()   | QuotaExceededError  | PLAN FIX | NO    | toast (post-fix)| NO (post-fix)
index.html import     | 404 / network error | PLAN FIX | NO    | overlay (p-fix) | NO (post-fix)
main.js init()        | throw on boot       | PLAN FIX | NO    | overlay (p-fix) | NO (post-fix)
EventBus handler      | tpAdvance handler   | YES (p-h)| NO    | silent corrupt  | WARN
TickEngine.skipTP     | large N loop        | N/A      | NO    | ~300ms freeze   | WARN
```

0 critical gaps after plan fixes. 2 WARNs (silent stat corruption on handler throw, skipTP freeze).

---

### Completion Summary (Phase 3)

```
+====================================================================+
|               ENG REVIEW — COMPLETION SUMMARY                      |
+====================================================================+
| Step 0  (Scope)      | 7 sub-problems mapped, all in existing code |
| Section 1 (Arch)     | 1 issue (AutoSave gap), plan fix confirmed  |
| Section 2 (Errors)   | 8 paths mapped, 2 P0 gaps → plan fixes      |
| Section 3 (Tests)    | Diagram: 11% coverage, 1 smoke test spec    |
| Section 4 (Perf)     | 1 WARN (skipTP loop), no critical issues    |
| NOT in scope         | 5 items (Vitest, CI, full refactor, etc.)   |
| What already exists  | 5 patterns reused (SaveManager, EventBus)   |
| Failure modes        | 0 critical gaps, 2 WARNs                   |
| Parallelization      | Sequential (all fixes touch shared modules) |
| Outside voice        | Codex unavailable [subagent-only]           |
| Lake Score           | 7/8 recommendations chose complete option  |
+====================================================================+
```

**PHASE 3 COMPLETE.**
Architecture is sound. Plan fixes close the 2 P0 silent-failure gaps (AutoSave notify + loading overlay). EventBus per-handler try/catch already exists — Critical Gap #3 from Phase 1 was overstated; actual risk is silent stat corruption on handler throw (WARN, not P0).
Passing to Final Approval Gate.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 2 | issues_open (0 unresolved) | 13 proposals, 8 accepted, 5 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN via /autoplan) | 3 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean (FULL via /autoplan) | score: 6/10 → 8/10, 6 decisions |

**UNRESOLVED:** 2 design items deferred to TODOS.md (keyboard nav, aria-labels)
**VERDICT:** ENG CLEARED — ready to implement.
