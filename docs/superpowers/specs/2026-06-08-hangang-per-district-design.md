# 한강 랜드마크 구별 분리 — 설계 문서

> 작성일: 2026-06-08
> 목적: 현재 10개 구가 공유하는 단일 한강 랜드마크를 **구별로 분리·연결**하여, 추후 구별 전리품·분위기 차별화가 가능한 구조로 만든다.

---

## 1. 배경 — 현재 구조

한강 랜드마크는 단일 정의를 10개 구(`hasFishing:true`)가 공유한다.

- **카드 아이템**: `js/data/items_misc.js`의 `lm_hangang` 단일 정의 (`isHangang:true`)
- **랜드마크 데이터**: `js/data/landmarks.js`의 `hangang` 엔트리 (subLocations 2개 + lootTable)
- **구 연결**: `js/data/districts.js`의 `hasFishing:true` 플래그 (10개 구)
- **카드 배치**: `js/systems/ExploreSystem.js:137` — `hasFishing` 구에 `createCardInstance('lm_hangang')`
- **진입 발행**: `js/ui/CardFactory.js:812` — `def.isHangang`이면 클릭 시 `landmarkRequest { districtId:'hangang' }` 고정
- **상태 판정**: `enterLandmark`(ExploreSystem:615)가 `currentLandmark = 'hangang'` 저장 → `FishingSystem._isInHangang()`(`:21`)·`ModalManager`(`:295`)가 `=== 'hangang'` **리터럴**로 판정

결과: 모든 구의 한강이 동일 lootTable·분위기·sublocation을 쓰며, 낚싯대 첫 진입 보상은 `claimKey:'hangang_rod'` 공유로 전 구 1회만 지급된다.

### 확정된 결정 사항

| 항목 | 결정 |
|------|------|
| 작업 범위 | **구조 분리만** — lootTable·분위기 텍스트는 현재 공용값을 복제. 차별화는 이후 별도 작업 |
| 데이터 표현 | **공용 base + 구별 오버라이드 맵** (`locationCardFactory` derive 관습과 일치) |
| 낚싯대 보상 | **전 구 1회 공유 유지** (`claimKey:'hangang_rod'` 변경 없음) |

---

## 2. 설계

### 2.1 ID 체계

| 대상 | 형식 | 예 |
|------|------|-----|
| 카드 아이템 ID | `lm_hangang_<districtId>` | `lm_hangang_gangnam` |
| 랜드마크 데이터 키 | `hangang_<districtId>` | `hangang_gangnam` |
| sublocation ID | `hangang_fishing_spot_<districtId>` / `hangang_riverside_<districtId>` | `hangang_fishing_spot_gangnam` |

- `getLandmarkData`의 `lm_` 접두사 폴백으로 `lm_hangang_gangnam` → `hangang_gangnam` 자동 매칭.
- sublocation ID는 `registerSubLocationItems`가 `sl_<sub.id>`로 **전역 등록**하므로 구별 접미사로 유니크 보장.
- 코드(`js/`)에서 기존 sublocation id(`hangang_fishing_spot`/`hangang_riverside`)를 하드코딩 참조하는 곳은 정의부 외 **없음** → 접미사 변경 안전(확인 완료).

대상 10개 구: `gangnam, gangdong, gwangjin, mapo, seocho, seongdong, songpa, yeongdeungpo, yongsan, junggoo` (`districts.js`의 `hasFishing:true`와 일치).

### 2.2 `landmarks.js` — base + 오버라이드

```js
const HANGANG_DISTRICTS = ['gangnam','gangdong','gwangjin','mapo','seocho',
                           'seongdong','songpa','yeongdeungpo','yongsan','junggoo'];

const HANGANG_BASE = {
  name:'한강', icon:'🌊', isHangang:true, desc:'...',
  subLocations:[ /* 현재 hangang 엔트리의 2개 sublocation 정의를 그대로 복제,
                    claimKey:'hangang_rod' 유지 */ ],
};

const HANGANG_OVERRIDES = {};   // 차별화 시 { gangnam:{ desc, subLocations:[...] } } 추가

// HANGANG_DISTRICTS를 돌며:
//   - HANGANG_BASE 깊은 복제
//   - 각 sub.id 에 `_<districtId>` 접미사 부여
//   - HANGANG_OVERRIDES[<구>] 가 있으면 병합
//   → LANDMARK_DATA['hangang_<구>'] 10개 생성
```

- 오버라이드 맵이 비어 있으므로 현 시점 10개 엔트리는 base와 동일(= 콘텐츠 복제 충족).
- 향후 차별화는 `HANGANG_OVERRIDES`에 구 항목만 추가하면 된다(단일 편집 지점).

**한강 판정 헬퍼** — 리터럴 비교 제거:

```js
export function isHangangLandmark(key) { return !!getLandmarkData(key)?.isHangang; }
```

### 2.3 카드 아이템 — 팩토리로 전환

- `locationCardFactory.js`에 `buildAllHangangCards()` 추가: `HANGANG_DISTRICTS`를 돌며 `lm_hangang_<구>` 카드 10개 생성 (`isHangang:true`, `districtId:<구>`, base 아이콘·설명 복제).
- `items.js`의 `ITEMS_LANDMARK`에 `...buildAllHangangCards()` 병합.
- `items_misc.js`의 단일 `lm_hangang` 정의 **제거** → 단일 진리 일원화.

### 2.4 카드 이미지

- `CardFactory.js:46` `CARD_IMAGES`에 구별 10개를 모두 기존 `assets/images/landmarks/lm_hangang.png`로 매핑(이미지 공유). `HANGANG_DISTRICTS` import 후 루프 등록.

### 2.5 진입 흐름 변경 — 4지점

| 파일·위치 | 현재 | 변경 |
|----------|------|------|
| `ExploreSystem.js:137-139` | `items['lm_hangang']` / `createCardInstance('lm_hangang')` | `lm_hangang_${districtId}` (함수가 `districtId` 인자 보유) |
| `CardFactory.js:821,826` | `landmarkRequest { districtId:'hangang' }` | `{ districtId: def.id }` (`lm_hangang_<구>`→`hangang_<구>` 폴백) |
| `FishingSystem.js:21` | `currentLandmark === 'hangang'` | `isHangangLandmark(currentLandmark)` |
| `ModalManager.js:295` | `currentLandmark === 'hangang'` | `isHangangLandmark(currentLandmark)` |

- `CardFactory.js:812` `def.isHangang` 렌더 분기는 유지(구별 카드도 `isHangang:true`). 발행 키만 구별 `def.id`로 바뀌어 `enterLandmark`가 `currentLandmark='hangang_<구>'`로 저장 → 그 구의 sublocation 카드가 깔린다.

### 2.6 부수 정리

- `items_misc.js`·`locationCardMeta.js:186`의 "단일 정의" 주석 갱신.

---

## 3. 검증

1. `node js/data/validate.js` — 신규 sublocation 아이템 20개(`sl_hangang_*_<구>`)·카드 10개와 lootTable 참조 무결성.
2. `node tools/editor/check-help-coverage.mjs` — 에디터 필드 도움말 누락 검사(신규 필드 없음 → 통과 예상).
3. **동작 동일성**: 콘텐츠 복제이므로 분리 전후 게임플레이가 동일해야 한다.
   - 한강 진입 시 낚시터/강변 카드 표시
   - 낚싯대 전 구 1회 지급(claimKey 공유)
   - 낚시 가능 판정 동작
   이 셋이 기존과 같은지 확인.

---

## 4. 영향 범위

### 변경 없음 (비영향)

- 낚시 메커닉 로직(`FishingSystem`) — 한강 판정 방식만 헬퍼 교체, 낚시 계산 불변
- 전투·다른 랜드마크·25구 정식 랜드마크
- lootTable 내용·낚싯대 보상 정책

### 구현 단계 점검 필요

- `tools/sim/v2/playerAI.mjs` — 시뮬이 `lm_hangang`/`'hangang'` 하드코딩 참조 시 구별 ID 갱신
- `tools/editor/editor.js` — 한강 특수 취급 여부
- `js/data/locales.js` — 한강 카드 i18n(이중언어 라벨) 키 영향

### 전체 변경 파일 (8 + 점검 3)

`landmarks.js`, `locationCardFactory.js`, `items.js`, `items_misc.js`, `CardFactory.js`, `ExploreSystem.js`, `FishingSystem.js`, `ModalManager.js`
점검: `playerAI.mjs`, `editor.js`, `locales.js`
