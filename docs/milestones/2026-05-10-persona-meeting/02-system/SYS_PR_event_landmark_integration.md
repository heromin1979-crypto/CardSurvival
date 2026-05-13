# 시스템 — 이벤트 랜드마크 6종 items.js 통합 PR

> 작성: 시스템 백승호 / 2026-05-11
> 결정: 머지. items.js에 lm_raider_camp_*/lm_power_station/lm_water_plant/lm_comms_tower 6종 등록.

## 1. 변경

`js/data/locationCardFactory.js`:
- `EVENT_LANDMARK_META` 정적 메타 추가 (6종 name/icon/desc)
- `buildEventLandmarkCard()` 신규
- `buildAllEventLandmarkCards()` export

`js/data/items.js`:
- `buildAllEventLandmarkCards` import
- `ITEMS_LANDMARK = { ...buildAllLandmarkCards(), ...buildAllEventLandmarkCards(), basecamp_landmark }`

## 2. 순환 의존 회피

`landmarks.js`는 `GameData.js → items.js → locationCardFactory.js → landmarks.js` 순환 가능. 따라서 `landmarks.js`에서 동적 derive 대신 **정적 메타 복사**로 회피.

trade-off:
- ⚠️ 단일 진리 약간 위반 (landmarks.js의 description 변경 시 본 메타 수동 동기화)
- ✅ 순환 의존 0
- ✅ items.js 카드 시스템 정상

## 3. 검증

- ✅ validate.js: Errors: 0
- ✅ items 등록 6/6: 모두 정상

```
lm_raider_camp_small  ✓ 소규모 약탈자 캠프
lm_raider_camp_medium ✓ 중규모 약탈자 캠프
lm_raider_camp_large  ✓ 대규모 약탈자 캠프
lm_power_station      ✓ 구로 발전소
lm_water_plant        ✓ 은평 정수장
lm_comms_tower        ✓ 통신 중계탑
```

## 4. 영향

- soldier/shared.js (`mq_*_rescue_*`) — `lm_raider_camp_*` 3종 quest objective 매칭 정상 (이전 landmarks.js만 의존 → 이제 items.js 카드 시스템도 호환)
- engineer/branch_b.js — `lm_power_station/water_plant/comms_tower` 3종 동일
- 카드 시스템 UI에서 이벤트 랜드마크 표시 가능

## 5. 후속

- `landmarks.js`의 description 변경 시 `locationCardFactory.js`의 `EVENT_LANDMARK_META` 동기화 (수동, P3 백로그)
- 또는 GameData.js의 순환 의존 구조 자체 정리 PR (P2, 별도)

---

*문서 끝.*
