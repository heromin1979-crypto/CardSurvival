# 제작창 이미지 자산 목록

## 완전성 기준

- 데이터 원본: `js/data/blueprints.js`, `js/data/blueprints_advanced.js`, `js/data/hiddenRecipes.js`
- 이미지 매핑: `js/ui/CardFactory.js`
- 제작 레시피: 346개
- 제작 결과물: 333종
- 요구 재료: 206종
- 결과물과 재료의 중복을 제거한 고유 아이템 이미지: 420종
- 실제 파일 존재 확인: 420/420
- 누락 이미지: 0종

## 카테고리별 사용량

| 카테고리 | 레시피 | 결과물 이미지 | 재료 이미지 | 대표 설계도 |
|---|---:|---:|---:|---|
| 방어구 | 20 | 20 | 24 | `assets/images/ui/crafting-blueprints/armor.png` |
| 소모품 | 7 | 7 | 17 | `assets/images/ui/crafting-blueprints/consumable.png` |
| 식량 | 70 | 68 | 46 | `assets/images/ui/crafting-blueprints/food.png` |
| 재료 | 63 | 58 | 59 | `assets/images/ui/crafting-blueprints/material.png` |
| 의료 | 45 | 45 | 47 | `assets/images/ui/crafting-blueprints/medical.png` |
| 시설 | 59 | 58 | 58 | `assets/images/ui/crafting-blueprints/structure.png` |
| 도구 | 41 | 41 | 43 | `assets/images/ui/crafting-blueprints/tool.png` |
| 개량 | 15 | 15 | 32 | `assets/images/ui/crafting-blueprints/upgrade.png` |
| 무기 | 26 | 25 | 35 | `assets/images/ui/crafting-blueprints/weapon.png` |

## 아이템 이미지 저장 위치

| 경로 | 제작창에서 사용하는 고유 이미지 수 |
|---|---:|
| `assets/images/armor` | 29 |
| `assets/images/bags` | 6 |
| `assets/images/debris` | 1 |
| `assets/images/food` | 100 |
| `assets/images/legendary` | 4 |
| `assets/images/materials` | 87 |
| `assets/images/medical` | 49 |
| `assets/images/special` | 2 |
| `assets/images/structures` | 58 |
| `assets/images/tools` | 42 |
| `assets/images/weapons` | 42 |

`CardFactory.images`의 아이템 ID별 매핑이 전체 420개 파일의 상세 인덱스다. 제작 리스트의 결과물 썸네일과 최대 3개의 요구 재료 썸네일은 이 매핑을 직접 사용한다.

## 중앙 아이템 설계 이미지

표시 우선순위:

1. 아이템별 Image 2.0 설계도 이미지
2. `CardFactory.images`에 등록된 실제 결과물 이미지
3. 카테고리 대표 설계도 이미지

전체 346개 레시피를 순회해 333종 결과물이 1번 또는 2번 경로로 표시되는 것을 테스트한다. 실제 결과물 이미지는 어두운 배경이 사라지도록 화면 합성하고, 흑백·세피아·구리색 필터를 적용해 설계 명세의 시각 톤을 유지한다.

| 결과물 | 설계도 ID | Image 2.0 파일 |
|---|---|---|
| 침전수 | `settle_water` | `assets/images/ui/crafting-blueprints/items/settled-water.png` |
| 장작 | `make_kindling` | `assets/images/ui/crafting-blueprints/items/kindling.png` |
| 천 조각 | `make_cloth_scrap` | `assets/images/ui/crafting-blueprints/items/cloth-scrap.png` |

세 이미지 모두 기존 아이템 이미지를 주제 참조로 사용해 형태와 재질을 보존하고, 따뜻한 호박색·구리색 제도 선화로 변환했다. 배경은 단색 `#00ff00`으로 생성한 뒤 로컬 크로마키 제거를 거쳐 투명 PNG로 저장했다.

```text
Convert the exact referenced survival item into a highly readable technical
blueprint illustration. Use precise warm amber and pale copper drafting lines,
layered material contours, restrained shadow accents, generous clear padding,
and a perfectly flat #00ff00 chroma-key background. Preserve the subject's
identity and proportions. No text, labels, arrows, dimensions, border, or shadow.
```

## 제작창 전용 아이콘

Image 2.0으로 생성한 4x4 투명 스프라이트 아틀라스:

- 최종 파일: `assets/images/ui/crafting-icons/crafting-ui-icons.png`

| 행 | 1열 | 2열 | 3열 | 4열 |
|---|---|---|---|---|
| 1 | 전체 설계도 | 무기 | 방어구 | 도구 |
| 2 | 시설 | 식량 | 의료 | 재료 |
| 3 | 개량 | 소모품 | 비밀 설계도 | 아이템 제작 |
| 4 | 완료 | 제작 불가 | 잠금 | 검색 |

## 생성 프롬프트

```text
4x4 sprite atlas for a post-apocalyptic survival game crafting workbench UI.
Row 1: all blueprints, weapon, armor, tool.
Row 2: structure, food, medical, crafting materials.
Row 3: upgrade, consumable, secret blueprint, craft action.
Row 4: completed, unavailable, locked, search.
Crisp technical game UI iconography, distressed industrial finish,
warm amber and muted steel gray, consistent cell size and stroke weight,
no text, no watermark, flat #00ff00 chroma-key background.
```

크로마키 제거 후 투명 픽셀은 926,344/1,572,516개이며, 가장자리 반투명 픽셀은 20,132개다.
