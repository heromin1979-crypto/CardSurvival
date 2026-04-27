# 카드 이미지 생성 프롬프트 — CST 통합 누락분 (나노 바나나 / Genspark)

> 작성: 2026-04-28
> 대상: PR #5 (CST 패턴 도입) 머지 후 추가된 14 신규 아이템
> 현재 상태: `cloth.png` / `leather.png` / `scrap_metal.png` 재활용 중 (fallback)
> 권장 해상도: **512×512**
> 이미지 생성 후 `js/ui/CardFactory.js`의 CARD_IMAGES 매핑 갱신 필요 (하단 참조)

---

## 공통 스타일 접두어 (모든 프롬프트 앞에 붙이기)

```
post-apocalyptic survival game item card art, centered object on dark black background,
dramatic rim lighting from above, worn weathered texture, muted desaturated color palette,
photorealistic detailed illustration, no text, no watermark, square format
```

---

## 그룹 1: 직물 chain — `assets/images/materials/`

### `large_cloth.png`
```
folded large piece of off-white linen cloth, hand-woven texture visible,
loose threads on edges, scavenged fabric for crafting, military canvas tone,
dark background, rim lighting from above
```

### `hide.png`
```
raw animal hide stretched flat, fresh skin side up showing veins and fat traces,
fur partially visible at edges, slightly bloodstained,
post-apocalyptic survival material, dark wooden surface, dim lighting
```

### `bone.png`
```
clean bleached animal bone, single femur or rib bone shape,
weathered texture, scavenged from carcass, slight earth stains,
dark background, dramatic side lighting
```

---

## 그룹 2: 직물 가공품 — `assets/images/armor/`

### `blanket.png`
```
folded thick wool blanket in muted gray-green color,
army surplus style, worn frayed edges, post-apocalyptic comfort item,
dark background, soft warm rim lighting
```

### `sleeping_bag.png`
```
rolled up military sleeping bag in olive drab canvas exterior,
straps and buckles visible, slightly worn fabric, ground sleeping gear,
dark background, dramatic side lighting
```

---

## 그룹 3: 트랩 도구 — `assets/images/tools/`

### `rat_trap.png`
```
small wooden snap-trap with metal spring and trigger plate,
rusty wire mechanism, primitive scavenged construction,
post-apocalyptic vermin trap, dark background, sharp rim lighting
```

### `pigeon_snare.png`
```
hand-tied rope snare loop attached to bent wooden stick,
simple noose trap mechanism, scavenged twine and branch,
primitive bird trap, dark background, soft warm lighting
```

### `alley_pit_trap.png`
```
wooden pit cover with sharpened nails pointing inward,
rope-and-stick deadfall mechanism above, scavenged urban materials,
large animal trap for narrow alley, dark background, ominous lighting
```

---

## 그룹 4: 산 채로 잡힌 동물 — `assets/images/food/`

### `live_rat.png`
```
city rat caught in trap, dark gray fur with patches,
beady wet eyes glinting, slightly malnourished urban vermin,
post-apocalyptic Seoul scavenging, dark background, rim lighting
```

### `live_pigeon.png`
```
captured city pigeon with worn dirty feathers, gray and white plumage,
visible leg ring still intact, beady eyes alert, urban survivor bird,
post-apocalyptic Seoul, dark background, soft side lighting
```

### `live_stray_animal.png`
```
gaunt stray dog or cat huddled in trap pit, matted fur,
ribs visible through coat, wary eyes glinting in low light,
post-apocalyptic Seoul abandoned pet, dark background, dim atmospheric lighting
```

---

## 그룹 5: 시체 (도살 후) — `assets/images/food/`

### `rat_carcass.png`
```
dead city rat lying on dark concrete, fresh kill from trap,
small bloodstain underneath, fur slightly matted, eyes closed,
post-apocalyptic survival food source, unsettling, dark background, cold lighting
```

### `pigeon_carcass.png`
```
dead pigeon on rough cloth, gray feathers slightly disheveled,
neck broken from snare trap, small puddle of blood,
post-apocalyptic survival food, dark background, cold rim lighting
```

### `stray_animal_carcass.png`
```
butchered stray animal carcass on stone slab, fur partially removed,
exposed flesh visible, large kill from pit trap,
post-apocalyptic survival food source, bloody but processed,
dark background, harsh side lighting, unsettling
```

---

## 생성 후 CardFactory.js 매핑 갱신

이미지 파일 생성 완료 후 `js/ui/CardFactory.js`의 CARD_IMAGES 객체에서 fallback을 정확한 경로로 교체:

```js
// Before (fallback 재활용)
large_cloth:      'assets/images/materials/cloth.png',
blanket:          'assets/images/materials/cloth.png',
sleeping_bag:     'assets/images/materials/cloth.png',
hide:             'assets/images/materials/leather.png',
bone:             'assets/images/materials/leather.png',
rat_trap:         'assets/images/materials/scrap_metal.png',
pigeon_snare:     'assets/images/materials/cloth_scrap.png',
alley_pit_trap:   'assets/images/materials/scrap_metal.png',
live_rat:         'assets/images/materials/leather.png',
live_pigeon:      'assets/images/materials/leather.png',
live_stray_animal: 'assets/images/materials/leather.png',
rat_carcass:      'assets/images/materials/leather.png',
pigeon_carcass:   'assets/images/materials/leather.png',
stray_animal_carcass: 'assets/images/materials/leather.png',

// After (전용 아트)
large_cloth:           'assets/images/materials/large_cloth.png',
blanket:               'assets/images/armor/blanket.png',
sleeping_bag:          'assets/images/armor/sleeping_bag.png',
hide:                  'assets/images/materials/hide.png',
bone:                  'assets/images/materials/bone.png',
rat_trap:              'assets/images/tools/rat_trap.png',
pigeon_snare:          'assets/images/tools/pigeon_snare.png',
alley_pit_trap:        'assets/images/tools/alley_pit_trap.png',
live_rat:              'assets/images/food/live_rat.png',
live_pigeon:           'assets/images/food/live_pigeon.png',
live_stray_animal:     'assets/images/food/live_stray_animal.png',
rat_carcass:           'assets/images/food/rat_carcass.png',
pigeon_carcass:        'assets/images/food/pigeon_carcass.png',
stray_animal_carcass:  'assets/images/food/stray_animal_carcass.png',
```

---

## 톤 가이드 (DESIGN.md 정렬)

- **무드**: 폐허가 된 서울. 군용 매뉴얼 + 한국 공공기관 서류 톤.
- **색감**: 채도 낮춤. 앰버(낮)와 청색(밤) 이분법. 보라/마젠타/네온 그린 금지.
- **조명**: rim lighting from above, 또는 dramatic side lighting. 어두운 배경 + 객체 강조.
- **질감**: worn weathered texture (마모된 질감). 깨끗한 신품 X.
- **도덕적 톤**:
  - 산 동물(live_*) — 측은하지만 식량으로 정당화되는 시각
  - 시체(carcass) — 처리된 식량, 과도한 잔혹성 회피 (피범벅 X, 처리 단계 명확)

---

*프롬프트 끝. 이미지 생성 후 카드 슬롯에 1-2회 시각 검수 권장.*
