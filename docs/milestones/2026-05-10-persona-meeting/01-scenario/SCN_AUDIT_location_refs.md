# 시나리오 — `loc_*` / `lm_*` 참조 감사

> 작성: 시나리오 한도연 / 2026-05-10
> 대상: 메인 퀘스트·시스템·UI에서 location/landmark 카드 ID 직접 참조 현황
> 결정: 통과 — 마이그레이션 영향 트리거는 doctor·soldier·engineer 3계열로 한정, 마이그레이션 시 회귀 우선순위 1.

---

## 1. 감사 범위

`(loc_|lm_)[a-z_]+` 패턴으로 `js/` 전체 grep. 정의처(`items.js` 27행~492행, `landmarks.js`)와 사용처를 분리해 사용처만 정리한다.

---

## 2. 사용처 파일 (grep 결과)

| 파일 | 분류 | 비고 |
|------|------|------|
| `js\data\items.js` | 정의처 | 25 location + 25 landmark 정의 |
| `js\data\landmarks.js` | 정의처 | 랜드마크 세부장소 (`subLocations`) |
| `js\data\districts.js` | 정의처 | districts.{id}.landmark 키로 ID 참조 |
| `js\data\stackConfig.js` | 정의처 | location/landmark 카드 stack 설정 |
| `js\data\items_misc.js` | 정의처 | 환경 오브젝트 |
| `js\data\npcs.js` | 사용처 | NPC `spawnLandmark` 필드에서 lm_* 참조 |
| `js\data\locales.js` | 사용처 | 한/영 라벨 |
| `js\screens\CharCreate.js` | 사용처 | 시작 위치 선택 |
| `js\ui\CardFactory.js` | 사용처 | CARD_IMAGES 매핑 |
| `js\systems\QuestSystem.js` | 사용처 | objective.landmarkId 매칭 |
| `js\systems\ExploreSystem.js` | 사용처 | 탐색 진입 |
| `js\systems\HospitalSiegeSystem.js` | 사용처 | `lm_boramae_hospital` 고정 참조 |
| `js\data\mainQuests\doctor\shared.js` | 사용처 | objective.landmarkId 9건 |
| `js\data\mainQuests\soldier\shared.js` | 사용처 | objective.landmarkId 3건 |
| `js\data\mainQuests\engineer\branch_b.js` | 사용처 | objective.landmarkId 3건 |

---

## 3. 메인 퀘스트 직접 참조 (마이그레이션 영향 0순위)

### 3.1 doctor/shared.js (9건)
- `landmarkId: 'lm_boramae_hospital'` × 8 (line 30, 73, 114, 149, 193, 228, 285, 348)
- `landmarkId: 'lm_dongjak'` × 1 (line 487)

특이사항: `lm_boramae_hospital`은 동작구 안의 두 번째 랜드마크. `districts.dongjak.landmark`는 `lm_dongjak`(국립현충원) 단일이므로, 보라매병원은 **별도 랜드마크 ID**로 관리되고 있다 — `items.js` 356~364행에 `districtId: 'dongjak'` 명시.

### 3.2 soldier/shared.js (3건)
- `lm_raider_camp_small` (line 211)
- `lm_raider_camp_medium` (line 235)
- `lm_raider_camp_large` (line 261)

특이사항: 위 3개 ID는 25개 구 정식 랜드마크가 아닌 **이벤트 전용 랜드마크**. `items.js` `ITEMS_LANDMARK`에 정의 여부 확인 필요(현재 grep 결과 미노출 → 정의 누락 가능성).

### 3.3 engineer/branch_b.js (3건)
- `lm_power_station` (line 110)
- `lm_water_plant` (line 132)
- `lm_comms_tower` (line 154)

특이사항: 위 3개도 25개 구 정식 랜드마크 외. 인프라 시설 이벤트 전용 랜드마크. 정의 검사 필요.

---

## 4. 이벤트 전용 랜드마크 정의 누락 의심

`soldier/shared.js`의 `lm_raider_camp_small/medium/large` 3종, `engineer/branch_b.js`의 `lm_power_station` `lm_water_plant` `lm_comms_tower` 3종 — 총 6개 ID는 `js\data\items.js`의 `ITEMS_LANDMARK`(258~492행)에 명시적으로 보이지 않는다.

가능성 3가지.
1. **별도 등록처가 있다.** `landmarks.js`의 `LANDMARK_DATA` 또는 동적 생성. 실제 게임에서 quest 진행 시 발화 여부로 검증 필요.
2. **정의 누락.** quest objective는 작성됐지만 랜드마크가 게임에 없어 무한 미달성. 시스템 백승호 검토.
3. **다른 ID로 매핑된다.** `lm_raider_camp_*`가 `lm_yongsan` 같은 정식 랜드마크에 동적으로 부착될 수 있다.

→ 시나리오 페르소나 후속: 위 6개 ID를 `objective.landmarkId` 매칭이 일어나는 `QuestSystem.js`에서 어떻게 해석하는지 추가 grep. 필요 시 시스템 백승호에 정의 누락 PR 요청.

---

## 5. 마이그레이션 영향 (이슈 4 — 팩토리 통합)

`SYS_DESIGN_location_card_factory.md` 시점 회귀 우선순위.

| 우선순위 | 대상 | 사유 |
|---------|------|------|
| **0** | doctor/shared.js | 9건 — 의사 메인 퀘스트 거의 전체 트리거 |
| **0** | soldier/shared.js | 3건 — 정의 누락 의심까지 겹침 |
| **0** | engineer/branch_b.js | 3건 — 분기 b 핵심 트리거 |
| 1 | npcs.js `spawnLandmark` | NPC 등장 분기 |
| 1 | HospitalSiegeSystem.js | `lm_boramae_hospital` 고정 |
| 2 | locales.js | 라벨 누락은 i18n 워커 트랙 |

마이그레이션 시 팩토리는 기존 `lm_*`/`loc_*` 카드 ID를 **반드시 보존**해야 한다. ID 자체를 derive 키로 사용 → quest objective 매칭 깨지지 않게.

---

## 6. 결론·권고

1. 팩토리 마이그레이션은 **카드 ID 불변** 전제로 설계 — 시스템 백승호에 명시 위임.
2. 이벤트 전용 랜드마크 6종(`lm_raider_camp_*`, `lm_power_station`, `lm_water_plant`, `lm_comms_tower`) 정의 누락 검사 후속 P1.
3. 메인 퀘스트의 `landmarkId` 직접 문자열 사용은 그대로 유지 가능. 팩토리는 정의 단계만 통합한다.

---

*문서 끝. 시스템 백승호 후속(이벤트 랜드마크 정의 검사) 위임.*
