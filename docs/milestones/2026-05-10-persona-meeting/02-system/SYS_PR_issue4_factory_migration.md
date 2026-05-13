# 시스템 — 이슈 4 location/landmark 팩토리 마이그레이션 보고

> 작성: 시스템 백승호 / 2026-05-11
> 결정: **머지 완료.** districts.js 단일 진리 확립. items.js 518→84줄.

---

## 1. 산출물

| 파일 | 변경 |
|------|------|
| `js/data/locationCardFactory.js` | 신규 — buildLocationCard / buildLandmarkCard / buildAllLocationCards / buildAllLandmarkCards |
| `js/data/locationCardMeta.js` | 신규 — LOCATION_CARD_META (25 구) + LANDMARK_CARD_META (27) |
| `js/data/items.js` | ITEMS_LOCATION (227행) + ITEMS_LANDMARK (235행) → 팩토리 호출 + basecamp_landmark 단독 |

`items.js` 줄 수: 518 → 84 (-434줄, -84%).

## 2. 단일 진리 확립 — dangerLevel 12건 불일치 해소

패리티 검증에서 발견된 items.js ↔ districts.js dangerLevel 격차 12건:

| 구 | items.js (구) | districts.js (신) |
|---|---|---|
| gangbuk | 1 | 2 |
| gwanak / nowon / dongjak | 2 | 1 |
| mapo / seongdong | 2 | 3 |
| seodaemun / seocho / yeongdeungpo | 3 | 4 |
| jongno | 4 | 5 |
| **junggoo** | **3** | **5** |
| **songpa** | **3** | **5** |

→ ExploreSystem이 districts.js의 dangerLevel을 사용 (items.js 값은 dead). 마이그레이션 후 표시·런타임 모두 districts.js 값.

**부수 발견:** chef startDistrict `junggoo`의 실제 dangerLevel = 5 (Director 게이트 회의록·PR1 보고서와 일치, items.js의 3은 오류).

## 3. 회귀 검증

- ✅ `validate.js`: Errors: 0 / Total items: 577 / ALL CLEAR
- ✅ 시뮬 v2 단위 검사 6/6: 147/147
- ✅ 카드 ID 불변 (loc_*, lm_*) — quest objective·NPC spawnLandmark·HospitalSiegeSystem 호환

## 4. 미해결

- 이벤트 전용 랜드마크 6종(lm_raider_camp_*, lm_power_station, lm_water_plant, lm_comms_tower) — `landmarks.js`의 `LANDMARK_DATA`만 보유. items.js의 ITEMS_LANDMARK에는 없음. 게임 quest 트리거는 정상 (objective.landmarkId 직접 문자열 매칭).
- `loc_*.encounterChance` — items.js 값이 dead value이지만 외부 표시용 UI가 있다면 잘못된 값 보일 가능성. UI 확인 후속.

## 5. PR 정리

| 영역 | 변경 |
|------|------|
| 신규 파일 | locationCardFactory.js, locationCardMeta.js |
| 수정 파일 | items.js |
| 영향 시스템 | 없음 (런타임 동작 변경 없음) |
| 디스크 절약 | ~434줄 |

---

*문서 끝. 다음 마이그레이션 후보 — 이벤트 랜드마크 6종을 items.js에도 통합 또는 landmarks.js 단일 진리 결정.*
