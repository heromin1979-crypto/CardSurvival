# 빗물 아이템 삭제 + 양동이 집수 시스템

> **작성일:** 2026-06-14
> **유형:** context
> **상태:** 진행중 (계획 확정, 구현 전 — 사용자 승인 대기)

---

## 1. 배경

현재 빗물(`rainwater`)이 **구역 탐색 loot로 나오는** 비현실적 설정. 이를 삭제하고, **비 올 때 바닥에 둔 양동이가 차오르고 / 물 지역(한강·산개울)에서 떠 담는** 자연스러운 집수 시스템으로 교체한다.

### 1.1. 영향 분석 결과 (조사 완료)
- **퀘스트 안전**: 의사 퀘스트 `so_d04` 완료 조건은 `so_d04_03`의 "clean 태그 물 3개"(`match: collect_item_type, clean, 3`). "빗물 정수/끓이기"(`so_d04_02`)는 서술 가이드일 뿐. QuestSystem에 rainwater 하드코딩 없음 → 빗물 삭제해도 퀘스트 안 깨짐.
- **제작 안전**: 정식 레시피(`blueprints*.js`)에 rainwater input/output **0건**. 드래그 조합(interactions)만 빗물 사용.
- **clean 물 경로 유지**: 오염수 등 다른 물도 끓이기/정수 input이고 별도 제작 레시피(`blueprints.js:694/708`)도 있음.

### 1.2. 확정된 설계 결정
| # | 항목 | 결정 |
|---|------|------|
| 1 | 양동이 표현 | **빈 양동이 / 물 찬 양동이 2종** |
| 2 | 물 담는 방식 | **양동이 자체가 물을 담음** (rainwater 아이템 삭제) |
| 3 | clean 물 체인 | 양동이 물도 **끓이기·정수로 clean 물** 생성 가능 |
| 4 | 빗물 콘텐츠 | 퀘스트·이벤트 텍스트를 **양동이 맥락으로 수정** |
| 5 | 채우기 | ① 비 올 때 **3 TP마다 1/4씩** 차오름 → **4회 분할 음용** ② **물 지역(한강·산개울)에 드래그 시 가득** ③ 물 **오염도 = 매개 물의 오염도** |

---

## 2. 신규 설계

### 2.1. 아이템 2종 (`items_misc.js` 또는 `items_tools.js`)
- **`empty_bucket`** (빈 양동이): `type:'tool'`, 바닥(middle)에 배치. 내구도 있음(비스택).
- **`water_bucket`** (물 찬 양동이): 인스턴스 필드 `_fillLevel`(1~4) + `contamination`(매개 물 오염도). 비스택(개별 오염도·수위).
  - `onConsume`: 1회분 `hydration`(예: +25) + `contamination`(인스턴스 값 반영). 마시면 `_fillLevel--`, 0이면 `empty_bucket`으로 전환.

**등록 4곳** (CLAUDE.md §3): `items_*`, `stackConfig.js`(둘 다 false/1), `CardFactory.js` CARD_IMAGES, `locales.js`(한/영).

### 2.2. 채우기 — 비 (신규 로직, `WeatherSystem._onTP` 또는 `StatSystem._onTP` 양동이 블록)
- `rain_collector` onTick 패턴(`StatSystem.js:188-204`) 참고.
- 매 TP, 날씨가 비 계열(`gs.weather.id ∈ {rainy, monsoon, storm}`)이면 바닥의 양동이 인스턴스 `_rainTick++`. **3 TP마다** `_fillLevel++`(max 4). `empty_bucket`이면 `water_bucket`(level 1)으로 전환.
- `contamination`: 비 = 빗물 수준(기존 `rainwater` 30 계승), **산성비(`gardenKill===true`)면 오염도 높게 또는 집수 중단 + 경고**.

### 2.3. 채우기 — 물 지역 드래그 (`DragDrop._onDrop` 분기 + `interactions.js`)
- 양동이를 **water_source 환경 오브젝트**(`stream_spring` 등, `subtype:'water_source'`)에 드래그 → `_fillLevel=4`(가득), `contamination = 오브젝트 contam`(산개울 0=깨끗).
- **한강 등 물 랜드마크**: 현재 드래그 대상 카드 없음 → **한강 sublocation에 water_source 오브젝트 배치**(예: `river_water`, contam 설정) 추가 필요. (별도 작업으로 분리 가능)

### 2.4. 음용 분배 (`StatSystem.consumeCard` 수정)
- `water_bucket` 소비 시: `onConsume` 적용 후 `_fillLevel--`. `_fillLevel>0`이면 인스턴스 유지(수위만 감소), 0이면 `empty_bucket`으로 전환(removeCardInstance + empty_bucket 생성, 또는 definitionId 교체).
- 기존 `leaveOnConsume`(빈병) 대신 양동이 전용 처리 분기 추가.

### 2.5. clean 물 체인 (`interactions.js`)
- 기존 빗물 끓이기/정수(T7/T8/T11/T12)를 **양동이 물 기반으로 교체**:
  - `water_bucket` + 캠프파이어 → 끓인 물 1개 + 양동이 `_fillLevel--`
  - `water_bucket` + 숯 필터 → 정수된 물 1개 + 양동이 `_fillLevel--`

---

## 3. 빗물(`rainwater`) 제거 및 참조 정리

| 위치 | 조치 |
|------|------|
| `items_base.js` rainwater 정의 | 삭제 |
| `stackConfig.js` rainwater | 삭제 |
| `CardFactory.js:148` 이미지 | 삭제 |
| `locales.js` `_item.rainwater` 등 | 삭제 |
| `districts.js` 10개 구역 loot | rainwater 항목 제거 |
| `gameBalance.js` seasonal(봄/여름/가을) | rainwater 제거 (대체 없음 or 다른 자원) |
| `secretEvents.js` `collect_rainwater` | 양동이 맥락으로 수정 (빈병→빗물 대신 양동이 집수 안내) |
| `interactions.js` T7/T8/T11/T12/T15/T16 | 양동이 물 기반으로 교체, rainwater 참조 제거 |
| `mainQuests/doctor/shared.js` so_d04_02 text/hint, locationHint | 양동이 맥락으로 문구 수정 (완료조건 불변) |

---

## 4. 관련 파일

| 파일 | 변경 성격 |
|------|-----------|
| `js/data/items_misc.js`(or tools) | empty_bucket·water_bucket 신규 |
| `js/data/stackConfig.js` | 양동이 등록 + rainwater 제거 |
| `js/ui/CardFactory.js` | 양동이 이미지 + rainwater 제거 |
| `js/data/locales.js` | 양동이 이름 + rainwater 제거 |
| `js/data/items_base.js` | rainwater 정의 삭제 |
| `js/data/districts.js` | rainwater loot 제거 |
| `js/data/gameBalance.js` | seasonal rainwater 제거 |
| `js/systems/WeatherSystem.js` (또는 StatSystem) | 비 집수 로직 |
| `js/board/DragDrop.js` | 양동이↔water_source 드래그 |
| `js/data/interactions.js` | 빗물→양동이 물 체인 교체 |
| `js/systems/StatSystem.js` | consumeCard 양동이 수위 처리 |
| `js/data/secretEvents.js` | collect_rainwater 수정 |
| `js/data/mainQuests/doctor/shared.js` | 퀘스트 텍스트 수정 |

---

## 5. 구현 순서

1. **양동이 아이템 2종 신규 + 4곳 등록** (validate 통과 기준)
2. **consumeCard 양동이 수위 음용** (4회 분할 + empty 전환)
3. **비 집수 로직** (3 TP/1단계, 산성비 처리)
4. **물 지역 드래그 집수** (water_source 오브젝트, 오염도 매개)
5. **clean 물 체인** (양동이 물 끓이기/정수)
6. **rainwater 제거 + 전 참조 정리** (loot·interactions·메타)
7. **퀘스트/이벤트 텍스트 수정**

---

## 6. 검증 방법

- **데이터**: `node js/data/validate.js` → Errors 0 (없는 id 참조 없음 확인)
- **헤드리스**: 양동이 음용 4회 분할 → empty 전환, 비 집수 3TP/단계, water_source 드래그 가득, 오염도 매개 확인
- **브라우저**: ?debug=1로 양동이 지급 → 비 날씨 강제 → 차오름 / 산개울 드래그 / 음용 시각 확인
- **회귀**: 의사 퀘스트 so_d04 (clean 물 3개) 달성 가능, validate 통과

---

## 7. 리스크 / 미해결

- **한강 물 지역 드래그**: 한강은 랜드마크라 드래그 대상 카드가 없음. water_source 오브젝트(`river_water` 등)를 한강 sublocation에 배치하는 추가 작업 필요 → **1차는 산개울(stream_spring) 드래그만, 한강은 후속 분리** 가능.
- **`_fillLevel` 인스턴스 필드**: 세이브 직렬화에 포함되는지 확인 (GameState.cards 저장 시 커스텀 필드 유지). 구버전 세이브엔 양동이 없으므로 마이그레이션 불필요.
- **밸런스**: 빗물 loot 제거로 초반 물 공급↓. 양동이 획득 경로(제작? loot?) 확보 필요 — empty_bucket을 어떻게 얻는지 별도 결정.
- **gameBalance seasonal**: 빗물 제거 후 빈자리에 다른 자원 넣을지.

---

## 8. 구현 전 확인 필요

1. **양동이 획득법**: empty_bucket을 제작(레시피)·loot 중 어디서? (시스템 진입점)
2. **한강 드래그**: 1차에서 산개울만, 한강은 후속으로 분리할지?
3. **비 집수 음용량**: 1회분 hydration 수치 (예: +25 × 4회 = 100)?
4. **gameBalance seasonal 빈자리**: 빗물 제거 후 대체 자원 둘지?
