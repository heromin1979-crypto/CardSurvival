# CST 패턴 도입 — Trap + Cloth Chain + Carcass 분해

> 시작일: 2026-04-27
> 완료일: 2026-04-28
> 상태: **✅ 전 sub-spec 머지 + UI 통합 + 이미지 적용 마감** (master `4305c0c`)
> 선행: Discovery Phase 2 (2A/2B/2C) + Phase 1 Track A 머지 완료 (master `d80e739` 이후)
> 이전 계획: `docs/archive/prompt_plan.old4.md` (Combat System Overhaul, Phase 5-7 재평가 대기)
>
> **이번 세션 전체 PR 목록**:
> - PR #5 — CST 패턴 도입 (Sub-spec 1/2/3 통합, master `8ad329d`)
> - PR #6 — 트랙 G+ nameEn 일괄 (master `11937ac`)
> - PR #7 — 트랙 E+ 카드 타입 시각 (master `b815d29`)
> - PR #8 — 트랙 H Trap UI (master `0f792f4`)
> - PR #9 — 결함 #1 가이드 + #6 캡 라벨 (master `7bbf391`)
> - PR #10 — 결함 #1 14 이미지 적용 (master `4305c0c`)

## 배경

`docs/CRAFT_DIVERSITY_ANALYSIS.md` 작성 중 발견: 데이터 다양성은 CST를 능가(scrap_metal 70 vs 코코넛 8-10)하나, 일부 chain은 약하거나 출처가 불명확. CST의 검증된 3가지 패턴을 한국 폐허 도시 setting에 적응:

1. **Cloth Chain 단계화** — `cloth_scrap → thread → cloth → large_cloth` 명확화
2. **Carcass 멀티 분해** — 적 처치 시 다양한 자원 산출, leather 출처 확정
3. **Trap 시스템** — 도시 적응형 (쥐/비둘기/떠돌이 동물) live-capture 도입

## 확정된 설계 결정 (사용자 합의)

| 결정 | 선택 |
|------|------|
| Sub-spec 1 스킬 | `armorcraft` 재활용 (tailoring 신설 X) |
| Sub-spec 1 large_cloth 결과물 | blanket / sleeping_bag / winter_coat 3개 |
| Sub-spec 2 carcass 접근 | 대안 B — human_corpse 카드 없이 enemy.lootTable 직접 확장 |
| Sub-spec 2 무두질 재료 | salt (alcohol_solution X) |
| Sub-spec 3 trap 동작 | Option II — bait 필요 |
| Sub-spec 3 카테고리 | 기존 `tool` 카테고리 안에 포함 (신규 `trap` 카테고리 X) |
| Sub-spec 3 시스템 | 신규 `js/systems/TrapSystem.js` 생성 (TickEngine 직접 통합 X) |

## 진행 순서

순차 PR 머지: **Sub-spec 1 → Sub-spec 2 → Sub-spec 3**.

| Sub-spec | 복잡도 | CC 시간 | LoC | 영향 파일 |
|----------|--------|---------|-----|-----------|
| 1. Cloth Chain | LOW | 1-2h | ~150 | 5 |
| 2. Carcass 분해 | LOW-MED | 2-3h | ~120 | 4-5 |
| 3. Trap System | MED-HIGH | 4-8h | ~400 | 8-10 |
| **합계** | **MEDIUM** | **7-13h** | **~670** | **17-20** |

---

## Sub-spec 1: Progressive Cloth Chain

### 목표
`cloth_scrap → thread → cloth → large_cloth` 계단 명확화. `armorcraft` 스킬 게이팅.

### 변경 지점

**A. 신규 아이템 4개** (`js/data/items_base.js`):

```js
large_cloth: {
  id: 'large_cloth', name: '큰 천', type: 'material', subtype: 'textile',
  rarity: 'uncommon', weight: 0.4,
  defaultDurability: 100, defaultContamination: 0,
  icon: '🧶', description: '담요·침구·대형 의류 제작 재료.',
  tags: ['material', 'textile', 'crafted'],
  dismantle: [{ definitionId: 'cloth', qty: 2, chance: 1.0 }],
},
blanket: { /* 체온 회복 아이템 */ },
sleeping_bag: { /* 휴식 보너스 구조물 */ },
winter_coat: { /* 방한 의류 — 장비 슬롯 body */ },
```

**B. 신규 레시피 7개** (`js/data/blueprints.js`, 모두 hidden=false 공개):

| ID | 입력 | 출력 | requiredSkills |
|----|------|------|----------------|
| `craft_thread` | cloth_scrap × 2 | thread × 1 | armorcraft: 1 |
| `craft_cloth_from_thread` | thread × 3 | cloth × 1 | armorcraft: 2 |
| `craft_large_cloth` | cloth × 2 + thread × 2 | large_cloth × 1 | armorcraft: 4 |
| `dismantle_large_cloth` | large_cloth × 1 | cloth × 2 | (없음) |
| `craft_blanket` | large_cloth × 1 + thread × 2 | blanket × 1 | armorcraft: 3 |
| `craft_sleeping_bag` | large_cloth × 2 + thread × 3 + leather × 1 | sleeping_bag × 1 | armorcraft: 5 |
| `craft_winter_coat` | large_cloth × 2 + leather × 1 | winter_coat × 1 | armorcraft: 5 |

> 주의: `craft_cloth`라는 ID가 기존에 있는지 확인 필요. 충돌 시 `craft_cloth_from_thread`로 disambiguate.

**C. 등록 누락 방지** (CLAUDE.md 7장 규칙):
- `js/data/stackConfig.js` — large_cloth, blanket, sleeping_bag, winter_coat 4개 추가
- `js/data/CardFactory.js` CARD_IMAGES — 4개 매핑 (이모지 fallback 가능)
- `js/data/districts.js` lootTable — 변경 없음 (raw 재료 신규 없음)

### Acceptance Criteria

- [x] `node --input-type=module js/data/validate.js` → ALL CLEAR
- [x] 회귀: 415/415 통과 (master 기준, +12 신규 테스트 포함)
- [x] 신규 craft 레시피 6개 데이터 검증 (PR #5 — winter_coat은 기존 warm_clothes 중복으로 제외)
- [x] cloth_scrap 분기율 +1 (thread 추가)
- [x] thread 분기율 +2 (cloth/large_cloth 결과물)
- [x] cloth 분기율 +2 (large_cloth/dismantle)
- [x] large_cloth 분기율 ≥2 (blanket/sleeping_bag — winter_coat 제외)

### 영향 파일 (5)
1. `js/data/items_base.js` — 신규 아이템 4개
2. `js/data/blueprints.js` — 신규 레시피 7개
3. `js/data/stackConfig.js` — 4개 등록
4. `js/data/CardFactory.js` — 이미지 4개 매핑
5. `testdata/cloth-chain.test.mjs` (신규) — chain 동작 단위 테스트

---

## Sub-spec 2: Carcass 멀티 분해

### 목표
적 처치 lootTable 확장 + leather 출처 확정 (`tan_hide` 레시피).

### 변경 지점

**A. 신규 아이템 2개** (`js/data/items_base.js`):

```js
hide: {
  id: 'hide', name: '생가죽', type: 'material', subtype: 'natural',
  rarity: 'uncommon', weight: 0.4,
  defaultDurability: 100, defaultContamination: 30,
  icon: '🐾', description: '무두질하면 가죽이 된다.',
  tags: ['material', 'organic'],
  dismantle: [],
},
bone: {
  id: 'bone', name: '뼈', type: 'material', subtype: 'natural',
  rarity: 'common', weight: 0.2,
  defaultDurability: 100, defaultContamination: 0,
  icon: '🦴', description: '도구·바늘·국물 재료.',
  tags: ['material', 'organic'],
  dismantle: [],
},
```

**B. 신규 레시피 1개 — leather 출처 확정** (`js/data/blueprints.js`):

| ID | 입력 | 출력 | requiredSkills |
|----|------|------|----------------|
| `tan_hide` | hide × 1 + salt × 1 | leather × 1 | crafting: 2 |

> hidden=false (공개). 사용자 결정: 무두질에 salt 사용 (alcohol_solution 대신).

**C. 기존 enemy lootTable 확장** (`js/data/enemies.js`):

> 위치 확인 필요. CombatSystem.js:1141의 `enemy.lootTable` 참조 — 데이터 위치는 enemies.js 또는 enemies_*.js 시리즈 추정.

- **인간형 적** (zombie/raider 등) lootTable에 추가:
  - `cloth_scrap × 1-3` (chance 0.5) — 의류 약탈 컨셉
  - `leather × 0-1` (chance 0.2) — 가죽 옷 입은 적 한정
  - `bone × 0-1` (chance 0.3)
- **동물형 적** (zombie_dog 등 — 있다면) lootTable에 추가:
  - `hide × 1` (chance 0.7)
  - `bone × 1-2` (chance 0.6)
  - `raw_meat × 1-2` (chance 0.8) — 기존 유지

> 정확한 적 ID/카테고리는 데이터 탐색 후 결정.

**D. 등록**:
- stackConfig.js — hide, bone 추가
- CardFactory.js — 2개 이미지 매핑
- districts.js — 변경 없음

### Acceptance Criteria
- [x] `validate.js` ALL CLEAR
- [x] 회귀: 0
- [x] 적 처치 시 lootTable 다중 산출 동작 (enemies.js 9/9 적 lootTable 확장 PR #5)
- [x] hide 분기율 ≥ 1 (`tan_hide`)
- [x] leather 출처 명시 — `tan_hide` 한 경로 확정
- [x] bone 분기율 ≥ 1 (Sub-spec 3 butcher_* 분해 레시피로 확장)

### 영향 파일 (5)
1. `js/data/items_base.js` — 신규 아이템 2개
2. `js/data/blueprints.js` — `tan_hide` 1개
3. `js/data/enemies.js` — lootTable 확장
4. `js/data/stackConfig.js` — 2개 등록
5. `js/data/CardFactory.js` — 2개 매핑
6. `testdata/carcass-loot.test.mjs` (신규)

---

## Sub-spec 3: Trap System (도시 적응형)

### 목표
정적 trap 카드 → bait 드롭 → 일정 TP 후 산 동물 산출 → 도살 → carcass → 분해 chain. **bait 필요(Option II)**, **tool 카테고리** 안에 포함, **신규 TrapSystem.js** 생성.

### 변경 지점

**A. 신규 trap 도구 3개** (`js/data/items_tools.js`):

```js
rat_trap: {
  id: 'rat_trap', name: '쥐덫', type: 'tool', subtype: 'trap',
  rarity: 'common', weight: 0.5,
  defaultDurability: 100, defaultContamination: 0,
  icon: '🪤', description: '쥐를 산 채로 잡는 덫. bait 필요.',
  tags: ['tool', 'trap', 'small'],
  trapData: {
    targetCard: 'live_rat',
    baitTags: ['food', 'grain'],   // rice, wild_berry 등 허용
    tpToTrigger: 8,                 // 8 TP 경과 후 발동
    successRate: 0.65,
    consumesBait: true,
  },
  dismantle: [
    { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
    { definitionId: 'wire', qty: 1, chance: 0.5 },
  ],
},
pigeon_snare: {
  id: 'pigeon_snare', name: '비둘기 올가미', type: 'tool', subtype: 'trap',
  rarity: 'common', weight: 0.3,
  trapData: { targetCard: 'live_pigeon', baitTags: ['food', 'grain'], tpToTrigger: 6, successRate: 0.55, consumesBait: true },
  /* ... */
},
alley_pit_trap: {
  id: 'alley_pit_trap', name: '골목 함정', type: 'tool', subtype: 'trap',
  rarity: 'uncommon', weight: 2.0,
  trapData: { targetCard: 'live_stray_animal', baitTags: ['food', 'meat'], tpToTrigger: 12, successRate: 0.45, consumesBait: true },
  /* ... */
},
```

> 기존 `tool` 카테고리 + 새 `subtype: 'trap'` 분류. `trapData` 필드는 신규.

**B. 신규 동물(산 채로) 카드 3개** (`js/data/items_misc.js`):
- `live_rat` — 산 채로 잡힌 쥐, weight 0.3, slaughter 도구 필요
- `live_pigeon` — 산 채로 잡힌 비둘기, weight 0.2
- `live_stray_animal` — 떠돌이 동물 (개/고양이), weight 8

**C. 신규 carcass 카드 3개** (`js/data/items_misc.js`):
- `rat_carcass` / `pigeon_carcass` / `stray_animal_carcass`

**D. 신규 trap 제작 레시피 3개** (`js/data/blueprints.js`):

| ID | 입력 | 출력 | requiredSkills |
|----|------|------|----------------|
| `craft_rat_trap` | scrap_metal × 2 + wire × 2 + spring × 1 | rat_trap × 1 | crafting: 2 |
| `craft_pigeon_snare` | rope × 2 + wood × 1 | pigeon_snare × 1 | crafting: 1 |
| `craft_alley_pit_trap` | wood × 4 + rope × 3 + nail × 4 | alley_pit_trap × 1 | crafting: 3, building: 2 |

**E. 신규 도살 레시피 3개** (`js/data/blueprints.js`, 도구 `sharp_blade` 또는 `knife` 필요):

| ID | 입력 | 출력 |
|----|------|------|
| `slaughter_rat` | live_rat × 1 | rat_carcass × 1 |
| `slaughter_pigeon` | live_pigeon × 1 | pigeon_carcass × 1 |
| `slaughter_stray_animal` | live_stray_animal × 1 | stray_animal_carcass × 1 |

**F. 신규 분해 레시피 3개** (`js/data/blueprints.js`):

| ID | 입력 | 출력 |
|----|------|------|
| `butcher_rat_carcass` | rat_carcass × 1 | raw_meat × 1, bone × 1, hide × 1 (chance 0.3) |
| `butcher_pigeon_carcass` | pigeon_carcass × 1 | raw_meat × 1, bone × 1 (chance 0.5) |
| `butcher_stray_carcass` | stray_animal_carcass × 1 | raw_meat × 3, hide × 2, bone × 2 |

> 다중 output은 기존 blueprints의 `output` 배열 패턴 따름.

**G. 신규 시스템: `js/systems/TrapSystem.js`**:

핵심 메서드:
- `init()` — `EventBus.on('tpAdvance', ...)` 청취
- `_processActiveTraps()` — 매 TP마다 환경 행의 trap 카드 순회, 각 trap 옆에 bait 카드 있는지 확인
- `_tryTrigger(trapInst, baitInst)` — trap의 `tpToTrigger` 카운트 증가, 도달 시 `successRate` 굴려 `targetCard` 생성 + bait 소모 + trap 내구도 감소(또는 일회용)
- `_findAdjacentBait(trapInst)` — environment 행에서 같은 슬롯 또는 인접 슬롯의 bait 검색
- `_state` — trap별 진행도 추적 (instance 데이터 또는 별도 GameState 슬롯)

EventBus 신규 emit:
- `trapTriggered` — `{ trapId, targetId, location }`
- `trapMissed` — `{ trapId }` (성공률 실패)

**H. SystemRegistry 통합** (`js/core/SystemRegistry.js` 또는 game init):
- `TrapSystem.init()` 호출 추가 — 기존 `HiddenElementSystem.init()` / `EcologySystem.init()` 패턴 따름

**I. CraftUI 영향 없음**: `tool` 카테고리 안에 포함되므로 기존 `craft.tab.tool` 그대로 사용. 별도 탭 추가 안 함.

**J. 등록**:
- stackConfig.js — 9개 (도구 3 + 산 동물 3 + carcass 3)
- CardFactory.js — 9개 매핑
- districts.js — 변경 없음 (trap은 craft만)
- locales.js — 한국어/영어 이름 토큰 (선택, items_*.js name 필드로 충분할 수도)

### Acceptance Criteria
- [x] `validate.js` ALL CLEAR
- [x] 회귀: 0
- [x] Trap 설치 + bait → tpToTrigger 후 산 동물 산출 단위 테스트
- [x] Bait 부족 시 trap 작동 안 함 검증
- [x] 도살 → carcass → 분해 chain 통합 테스트
- [x] TrapSystem 신규 단위 테스트 12건 (목표 5+ 초과 달성, PR #5 8건 + PR #8 4건)
- [x] CraftUI tool 탭에 신규 trap 레시피 노출 (subtype trap, 시각 캡 라벨 LIVE/CARCASS/TRAP — PR #9)

### 영향 파일 (10)
1. `js/data/items_tools.js` — trap 도구 3개
2. `js/data/items_misc.js` — 산 동물 + carcass 6개
3. `js/data/blueprints.js` — 신규 레시피 9개 (craft 3 + 도살 3 + 분해 3)
4. `js/systems/TrapSystem.js` (신규) — ~100-150 LoC
5. `js/core/SystemRegistry.js` 또는 main init — 1-2줄
6. `js/data/stackConfig.js` — 9개 등록
7. `js/data/CardFactory.js` — 9개 이미지
8. `js/data/locales.js` — trap 관련 토큰 (선택)
9. `testdata/trap-system.test.mjs` (신규) — 단위/통합 테스트
10. `testdata/trap-craft-chain.test.mjs` (신규) — end-to-end

---

## 의존성 그래프

```
Sub-spec 1 (Cloth Chain) ─── 독립

Sub-spec 2 (Carcass) ─────── leather 출처 확정 (Sub-spec 1과 약한 연결: leather가 sleeping_bag/winter_coat 입력)
                          ─── hide 신설로 cloth chain과 연결 (tan_hide → leather → cloth 결과물)

Sub-spec 3 (Trap) ────────── live_animal/carcass 패턴 = Sub-spec 2 carcass 패턴 재사용
                          ─── 분해 craft 패턴 확장 (Sub-spec 2의 tan_hide 패턴 따름)
```

권장: **순차 진행**. Sub-spec 1 머지 후 본인 플레이 분기율 체감 검증 → Sub-spec 2 진입.

---

## Risks

| Risk | 등급 | 완화 |
|------|------|------|
| `armorcraft` 재활용이 tailoring 본질 흐림 | LOW | 향후 tailoring 분리 별도 spec |
| 인간 적 lootTable 확장 — 톤 불일치 우려 | LOW-MED | 의류 약탈 컨셉으로 정당화, hide 미포함 |
| Sub-spec 3 TrapSystem 신규 시스템 → init 통합 회귀 | MED | 기존 HiddenElementSystem/EcologySystem 패턴 참조 |
| 신규 아이템 등록 누락 (stackConfig/CardFactory) | LOW | validate.js + 체크리스트 |
| Bait 메커니즘 — 식량 소모로 게임 어려움 증가 | LOW-MED | tpToTrigger/successRate 밸런스 조정으로 해결 |
| trap 환경 행 점유 — 한정 슬롯 압박 | MED | 환경 행 슬롯 수 (3개) 한계 → bait + trap 동시 배치 시 보드 공간 검토 필요 |

---

## 진행 순서 체크리스트

- [x] Sub-spec 1 진입 (Cloth Chain) — PR #5
  - [x] 신규 아이템 3개 (large_cloth/blanket/sleeping_bag) + 레시피 6개 데이터 추가
  - [x] stackConfig + CardFactory 등록
  - [x] 단위 테스트
  - [x] validate.js + 회귀
  - [x] PR + 머지
  - [ ] 본인 플레이 분기율 체감 검증 (잔여)
- [x] Sub-spec 2 진입 (Carcass) — PR #5
  - [x] hide/bone 아이템 + tan_hide 레시피
  - [x] enemy.lootTable 확장 (9/9 적)
  - [x] 단위/통합 테스트
  - [x] PR + 머지
- [x] Sub-spec 3 진입 (Trap) — PR #5
  - [x] trap 도구 3개 + 산 동물 3개 + carcass 3개
  - [x] craft/도살/분해 9 레시피
  - [x] TrapSystem.js 신규 + SystemRegistry 통합 (PR #8)
  - [x] 테스트 12건 (단위 8 + UI 4)
  - [x] CraftUI tool 탭 시각 확인 (PR #7/#9)
  - [x] PR + 머지

## UI 통합 (`AD_GUIDE_CST_INTEGRATION.md` 6 결함)

- [x] #1 이미지 fallback → 14 PNG 적용 (PR #10)
- [x] #2 이중 언어 일관성 → nameEn 일괄 (PR #6 트랙 G+)
- [x] #3 Trap 진행도 시각 신호 → 게이지 + bait 마커 (PR #8 트랙 H)
- [x] #4 신규 카드 타입 패턴 → live/carcass/trap 시각 차별 (PR #7 트랙 E+)
- [x] #5 액션 힌트 부재 → 도살/분해/미끼 힌트 (PR #7 트랙 E+)
- [x] #6 카테고리 라벨 → LIVE/CARCASS/TRAP 캡 (PR #9)

## 측정 검증 (memory Assignment 연계)

각 Sub-spec 머지 후 사용자 본인 플레이로 잔여 검증:
- [ ] 분기율 체감 카운트 (Sub-spec 1)
- [ ] 적 처치 시 산출 자원 다양성 카운트 (Sub-spec 2)
- [ ] 발견 모먼트 카운트 (Sub-spec 3 — trap 첫 성공 시 ✨ 알림)
- [ ] 카타나(depth 7) 직접 만들기 + 발견 모먼트 카운트 (memory Assignment)
