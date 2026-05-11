# 시스템 — location/landmark 카드 팩토리 설계

> 작성: 시스템 백승호 / 2026-05-10
> 대상: `js\data\items.js` `ITEMS_LOCATION` (25 카드, 27~253행) + `ITEMS_LANDMARK` (25 카드 + basecamp, 258~492행)와 `js\data\districts.js`의 정보 중복 제거
> 결정: 통과 — M2 마일스톤 마이그레이션. 카드 ID 불변.

---

## 1. 문제 정의

`ITEMS_LOCATION.loc_gangnam`과 `DISTRICTS.gangnam`이 동일 값을 보유.

| 필드 | items.js (loc_gangnam) | districts.js (gangnam) |
|------|------------------------|------------------------|
| `dangerLevel` | 3 | 3 |
| `encounterChance` | 0.35 | 0.15 (※ 값이 다르다) |
| `travelCostTP` | 2 | 2 |
| `description` | "의료 인프라가 집중된 지역. 삼성서울병원이 최대 물자 보고지만…" | "의료 인프라가 집중된 지역. 삼성서울병원이 최대 물자 보고지만…" |

**실측 발견:** `encounterChance`가 두 파일에서 **다른 값**을 갖는다 (loc_gangnam 0.35 vs districts.gangnam 0.15). 단일 진리 부재로 이미 일관성이 깨져 있다. 어느 값이 게임 런타임에 쓰이는지 시스템 페르소나의 추가 grep 필요.

---

## 2. 설계 목표

1. **단일 진리:** `districts.js`를 진리로, `items.js`는 derive.
2. **카드 ID 불변:** `loc_*` `lm_*` 식별자는 그대로. 모든 quest objective·NPC `spawnLandmark`·`HospitalSiegeSystem`의 고정 참조가 깨지지 않게.
3. **카드 고유 메타 보존:** `tags`(특히 `radiation` `military` `medical`), `subtype`, `rarity`, `icon`은 카드 정의에서만 의미가 있으므로 derive 입력에 명시.

---

## 3. 팩토리 시그니처

`js\data\locationCardFactory.js` 신규 파일.

```js
import DISTRICTS from './districts.js';

// districts.js의 단일 진리에서 location 카드 1장을 생성한다.
// cardMeta: 카드 고유 메타(아이콘·rarity·subtype·tags). districts에는 없는 정보.
export function buildLocationCard(districtId, cardMeta) {
  const d = DISTRICTS[districtId];
  if (!d) throw new Error(`[locationCardFactory] unknown district: ${districtId}`);

  return {
    id: `loc_${districtId}`,
    name: d.name,
    type: 'location',
    subtype: cardMeta.subtype,
    rarity: cardMeta.rarity,
    weight: 0,
    stackable: false,
    maxStack: 1,
    defaultDurability: 100,
    defaultContamination: 0,
    icon: cardMeta.icon ?? d.icon,
    description: d.description,
    nodeId: districtId,
    districtId,
    dangerLevel: d.dangerLevel,
    encounterChance: d.encounterChance,
    travelCostTP: d.travelCostTP,
    tags: cardMeta.tags,
    requiresSlot: 'top',
    dismantle: [],
  };
}

// landmark 카드는 districts.{id}.landmark가 가리키는 정식 1개를 derive.
// 이벤트 전용 랜드마크(lm_raider_camp_*, lm_power_station 등)는 별도 정의 유지.
export function buildLandmarkCard(districtId, cardMeta) {
  const d = DISTRICTS[districtId];
  if (!d) throw new Error(`[locationCardFactory] unknown district: ${districtId}`);
  if (!d.landmark) throw new Error(`[locationCardFactory] no landmark: ${districtId}`);

  return {
    id: d.landmark,
    name: cardMeta.name,
    type: 'location',
    subtype: 'landmark',
    rarity: cardMeta.rarity,
    weight: 0,
    stackable: false,
    maxStack: 1,
    defaultDurability: 100,
    defaultContamination: 0,
    landmark: true,
    icon: cardMeta.icon,
    description: cardMeta.description,
    landmarkBonus: cardMeta.landmarkBonus,
    tags: cardMeta.tags,
    requiresSlot: 'top',
    dismantle: [],
  };
}
```

---

## 4. cardMeta 정의 위치

`js\data\locationCardMeta.js` 신규.

```js
export const LOCATION_CARD_META = {
  gangnam:   { subtype: 'medical',  rarity: 'rare',     icon: '🏥', tags: ['location', 'medical'] },
  gangdong:  { subtype: 'urban',    rarity: 'uncommon', icon: '🏘️', tags: ['location'] },
  // ... 25개 구
};

export const LANDMARK_CARD_META = {
  gangnam: {
    name: '삼성서울병원', icon: '🏥', rarity: 'rare',
    description: '강남구 최대 의료시설. 의약품·수술키트가 대량 비축되어 있으나 좀비 밀도가 극히 높다.',
    landmarkBonus: '탐색 시 의료 아이템 발견 확률 +20%',
    tags: ['location', 'landmark', 'medical'],
  },
  // ... 25개 구 + basecamp
};
```

장점: 카드 고유 메타만 50~70행 단일 파일. `description` 같은 텍스트는 설정 이수정 글로서리에서 끌어올 수도 있으나 **랜드마크 description은 districts와 구분이 필요해 cardMeta 보존**(예: `lm_seocho` "예술의전당 — 문화예술 복합시설. 생존자 기록…"은 구 description "법조타운·예술의전당. 고급 주거지였으나…"와 다름).

---

## 5. items.js 통합

```js
// 기존 ITEMS_LOCATION (27~253행) → 삭제, 대체.
const ITEMS_LOCATION = Object.fromEntries(
  Object.entries(LOCATION_CARD_META).map(
    ([id, meta]) => [`loc_${id}`, buildLocationCard(id, meta)]
  )
);

// 정식 25 랜드마크
const ITEMS_LANDMARK_REGULAR = Object.fromEntries(
  Object.entries(LANDMARK_CARD_META)
    .filter(([id]) => id !== 'basecamp')
    .map(([id, meta]) => [DISTRICTS[id].landmark, buildLandmarkCard(id, meta)])
);

// basecamp + 이벤트 전용 랜드마크 (lm_boramae_hospital, lm_raider_camp_*, lm_power_station 등)는 별도 정의 유지
const ITEMS_LANDMARK_SPECIAL = {
  basecamp_landmark: { /* 기존 정의 그대로 */ },
  lm_boramae_hospital: { /* 기존 정의 그대로, districtId: 'dongjak' */ },
  // 이벤트 전용 랜드마크 정의 누락 의심 6종 별도 검토 (SCN_AUDIT_location_refs.md §4)
};

const ITEMS_LANDMARK = { ...ITEMS_LANDMARK_REGULAR, ...ITEMS_LANDMARK_SPECIAL };
```

---

## 6. 단일 진리 충돌 해결

마이그레이션 시 `districts.js`와 `items.js`의 불일치 값(예: `encounterChance` gangnam 0.35 vs 0.15) 처리.

- 1순위: 게임 런타임에서 실제 사용되는 값 식별. `ExploreSystem.js` `EncounterSystem` 같은 곳에서 어느 파일을 참조하는지 grep.
- 2순위: 사용되는 값을 `districts.js` 정식 값으로 채택. 다른 파일 값은 폐기.
- 3순위: 마이그레이션 머지 직전 밸런스 권지나 시뮬 1회 — 값 일원화로 인한 회귀 여부 확인.

---

## 7. 회귀 영향 (시나리오 한도연 감사 결과 반영)

`SCN_AUDIT_location_refs.md` 우선순위 0 항목:
- `doctor/shared.js` 9건 `lm_boramae_hospital` `lm_dongjak` 참조 → 카드 ID 불변이므로 영향 없음.
- `soldier/shared.js` 3건 / `engineer/branch_b.js` 3건 → **이벤트 전용 랜드마크 정의 누락 의심**. 마이그레이션 전 정의 누락 검사 P1.
- `npcs.js` `spawnLandmark` → 카드 ID 불변이므로 영향 없음.
- `HospitalSiegeSystem.js` `lm_boramae_hospital` 고정 참조 → 영향 없음.

---

## 8. 마이그레이션 순서 (M2)

1. `locationCardFactory.js` `locationCardMeta.js` 신규 작성. 단위 검사: 25개 구 derive 결과 = 기존 정의(불일치 값은 districts 우선).
2. `items.js` `ITEMS_LOCATION` 블록 교체. 회귀: `validate.js` 통과 + 25 location 카드 키 모두 존재.
3. `items.js` `ITEMS_LANDMARK` 정식 25 블록 교체. 특수 랜드마크 4종+α는 그대로 유지.
4. 이벤트 전용 랜드마크 6종 정의 누락 검사 (시스템 별도 PR).
5. 밸런스 100회 회귀 시뮬 1회.
6. 머지.

---

## 9. 결론·권고

- 카드 ID 불변 전제로 마이그레이션 가능. quest objective 회귀 위험 0.
- `encounterChance` 같은 데이터 불일치는 마이그레이션의 **부수적 이득** — 단일 진리 확립.
- 이벤트 전용 랜드마크 6종은 분리 PR. 본 마이그레이션과 묶지 않음.

---

*문서 끝. M2 진입 시 시스템 백승호 PR 1·2·3, 시스템 별도 PR 4, 밸런스 회귀 5 분담.*
