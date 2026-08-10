# 시각 에셋 복구 및 UI 아이콘 보강 설계

## 목표

게임 실행 중 실제로 끊어진 이미지 참조를 제거하고, 중요한 세부 장소의 이모지 폴백을 장면 일러스트로 대체한다. 동시에 항상 노출되는 UI에서 운영체제 컬러 이모지 의존도를 낮춰 `DESIGN.md`의 절제된 산업적 분위기와 일치시킨다.

## 확인된 문제와 범위

### 실제 끊어진 참조

1. `js/ui/CombatUI.js`의 기본 전투 배경 `./assets/images/subway_ruined.jpg`는 없다. 같은 목적의 실제 파일 `assets/images/combat_jongno_subway_clean_v2.png`가 있다.
2. `js/data/endingImages.js`의 Chef 이미지 여섯 개는 경로만 있고 파일이 없다. 현재 실제 엔딩 플래그에서 사용하는 것은 세 개다.
3. `ENDING_IMAGES`의 평면 키 `a1_vaccine`과 `b3_escape`는 중복 선언되어 마지막 Chef 항목이 앞의 Doctor/Firefighter 항목을 덮는다. 현재 `getEndingImage(subEndingCode)`는 캐릭터 맥락이 없으므로 올바른 엔딩 일러스트를 결정할 수 없다.

### 장소 장면 이미지

`LANDMARK_DATA`의 세부 장소는 213개다. 이 중 181개는 `assets/images/sublocations/<id>.png`와 일치한다. 나머지 32개는 `noSceneImage: true`로 설정되어 있어 의도적으로 이모지 폴백을 쓴다.

첫 제작 묶음은 보상·보스·탈출과 직접 연결되는 아래 8개다.

- `sl_jongno_royal_vault` — 지하 왕실 금고
- `sl_yongsan_armory` — 미군기지 무기고
- `sl_gwangjin_zoo_lab` — 동물 연구소
- `sl_seodaemun_p4_lab` — P4 연구실
- `sl_gwanak_reactor` — 연구용 원자로
- `sl_songpa_penthouse` — 123층 펜트하우스
- `sl_63_helipad` — 옥상 헬리패드
- `sl_gangseo_hangar` — 격납고

나머지 24개는 첫 묶음의 품질과 런타임 연결을 검증한 뒤 8개 단위로 만든다. 각 이미지가 추가된 위치에서만 `noSceneImage`를 제거한다.

## 구현 설계

### 1. 전투 배경 복구

`CombatUI.render()`의 `battleBg` 기본값을 기존 전투 배경 파일로 바꾼다. 새 파일을 복제하거나 새로 생성하지 않는다. 전투 장면 정의의 `backdrop`이 있을 때는 기존 우선순위를 보존한다.

### 2. 엔딩 이미지의 캐릭터별 매핑

`js/data/endingImages.js`를 다음 계약으로 전환한다.

```js
getEndingImage(characterId, subEndingCode)
```

엔딩 정의는 캐릭터 ID를 첫 번째 키로 하는 중첩 맵을 사용한다. Chef의 현재 플래그는 이미지 키로 명시적으로 별칭 처리한다.

| 캐릭터 | 런타임 플래그 | 이미지 파일 |
|---|---|---|
| chef | `a1_network` | `chef_a1_network.png` |
| chef | `a2_farm` | `chef_a2_farm.png` |
| chef | `b1_ascension` | `chef_b1_ascension.png` |

`Ending.js`와 `EndingGallery.js`는 이미 가지고 있는 `ending.characterId`를 함수에 전달한다. 기존 Doctor 및 Firefighter 경로는 새 중첩 맵에서 독립적으로 조회되므로 중복 키가 사라진다. 이미지가 로드되지 않을 때 감추는 기존 안전 폴백은 유지한다.

Chef 일러스트는 `assets/endings/`에 1376×768 PNG로 저장한다. 기존 엔딩 일러스트의 만화풍 외곽선, 어두운 폐허 서울, 따뜻한 주황 계열 조명은 유지한다. 이미지 안의 읽을 수 있는 문구·UI·간판은 넣지 않는다.

### 3. 세부 장소 이미지 묶음

이미지는 `assets/images/sublocations/<subLocationId>.png` 이름으로 저장한다. 기존 이미지와 같은 카드 크롭에 맞게 중앙 피사체를 유지하고, 카드 제목을 이미지에 넣지 않는다.

첫 8개는 다음 공통 제약을 따른다.

- 서울 도심 재난 이후, 현실적 재료와 조명
- 인물은 화면의 주제가 되지 않으며 로고·워터마크·읽을 수 있는 문구를 금지
- 산업적 다크 팔레트, 필요 시 위협을 드러내는 제한된 청록/주황 강조색
- 카드에서 잘리지 않는 중앙 70% 안에 핵심 단서를 둠

파일을 검수한 뒤 해당 `subLocation`의 `noSceneImage`만 제거한다. 생성 실패 시 플래그를 유지하므로 빈 카드나 404가 발생하지 않는다.

### 4. UI 아이콘 시스템 1차

새 SVG 아이콘은 `assets/images/ui/icons/`에 두고, 기존 Seoul 지도 아이콘과 마찬가지로 단색 SVG를 사용한다. 기본 색은 CSS의 `--text-secondary`, 위험과 상태는 이미 정의된 상태 색 토큰만 사용한다.

1차 교체 대상은 항상 보이는 보드/거점 UI다.

| 영역 | 대상 파일 | 대체할 이모지 역할 |
|---|---|---|
| 위치·시간·날씨 | `js/screens/Main.js`, `js/screens/Basecamp.js` | 위치, 지도, 계절, 온도, 탐색, 퀘스트 |
| 카드 폴백·환경 | `js/ui/CardFactory.js` | 장소, 날씨, 범용 상자, 부상 표식 |
| 공용 표시 | 관련 CSS | SVG의 크기·색·정렬 규칙 |

아이템의 실제 카드 아트와 데이터상의 `def.icon`은 이번 1차에서 일괄 제거하지 않는다. 화면 전반의 327개 이모지를 한 번에 바꾸면 데이터 표시와 게임 피드백의 의미가 바뀔 위험이 있기 때문이다. 전투·신체·장비 모달은 2차 대상으로 별도 검수한다.

## 검증

1. 정적 에셋 참조 검사에서 새로 참조하는 경로가 모두 존재해야 한다.
2. `node js/data/validate.js`가 오류 0건이어야 한다.
3. 엔딩 매핑 단위 테스트를 추가해 Doctor `a1_vaccine`, Firefighter `b3_escape`, Chef의 세 활성 플래그가 각각 다른 파일을 반환하는지 확인한다.
4. 기존 `CardImageMapping` 및 `CombatMotionManifest` 테스트를 실행한다.
5. 1920×1080 보드와 엔딩 갤러리에서 이미지 로드 실패, 깨진 카드, 이모지 기반 영구 UI가 남지 않았는지 시각 확인한다.

## 제외 범위

- 24개 남은 세부 장소 장면 이미지의 즉시 생성
- 전투·장비·신체·동료 모달 전체의 아이콘 교체
- 기존 아이템 카드 아트 자체의 스타일 재제작

이 항목들은 1차 결과와 품질 기준을 확인한 뒤 다음 묶음으로 진행한다.
