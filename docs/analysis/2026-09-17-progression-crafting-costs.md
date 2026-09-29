# 제작 체인의 정적 비용 확인

재생성: `node tools/analyze-progression-costs.mjs`.

이 표는 실제 플레이 기록이 아니다. 각 목표 1개를 만드는 청사진 재료 트리를 펼치고, 순환을 제외한 후보 중 명시된 제작 TP 합이 작은 경로를 선택한다. 도구 건설·이동·조우·숙련 상승·날씨·연료 유지비·비밀 조합·분해·거래는 비용에 포함하지 않는다. 부산물과 남은 중간재를 다른 분기에서 재사용하지 않아 전체 경제의 최적해도 아니다. 제작 경로가 없는 물품은 공급 경로가 필요한 말단으로 표시한다.

| 목표 | 최장 재료 가공 단계 | 제작 배치 | 명시 제작 TP | 스킬 상한 | 필요한 도구 |
|---|---:|---:|---:|---|---|
| 붕대 (bandage) | 계산 불가 | - | - | {} |  |
| 멸균 키트 (sterile_kit) | 계산 불가 | - | - | {} |  |
| 수술용 마취제 (surgical_anesthetic) | 4 | 12 | 33 | {"medicine":8,"crafting":2,"cooking":5} | workbench, medical_station, garden_bed_herb, campfire |
| 광범위 항생제 (broad_antibiotic) | 4 | 6 | 18 | {"medicine":6,"crafting":2} | workbench, medical_station, campfire, garden_bed_herb |
| 정제 약 (purified_medicine) | 4 | 15 | 41 | {"medicine":7,"cooking":5} | workbench, garden_bed_herb, campfire |
| 역병 백신 (plague_vaccine) | 계산 불가 | - | - | {} |  |
| 정수 필터 (water_filter) | 0 | 0 | 0 | {} |  |
| 구리 코일 (copper_coil) | 2 | 2 | 4 | {"crafting":5} | workbench |
| 회로 모듈 (circuit_module) | 2 | 2 | 8 | {"crafting":6} | workbench |
| 전기 모터 (electric_motor) | 3 | 5 | 13 | {"crafting":8} | field_forge, workbench |
| 발전기 코어 (generator_core) | 4 | 16 | 55 | {"crafting":10} | field_forge, workbench, coal_furnace, campfire |
| 강화 천 (reinforced_fabric) | 계산 불가 | - | - | {} |  |

## 붕대

경로: 청사진 없음/계산 불가

외부 공급이 필요한 말단: 

자동 계산 제외 사유(실제 공급 불가능을 뜻하지 않음):
- 순환 재료: bandage → cloth_scrap → cloth → thread → cloth_scrap
- 순환 재료: bandage → cloth_scrap → cloth → large_cloth → cloth

## 멸균 키트

경로: 청사진 없음/계산 불가

외부 공급이 필요한 말단: 

자동 계산 제외 사유(실제 공급 불가능을 뜻하지 않음):
- 순환 재료: sterile_kit → gauze → cloth_scrap → cloth → thread → cloth_scrap
- 순환 재료: sterile_kit → gauze → cloth_scrap → cloth → large_cloth → cloth

## 수술용 마취제

경로: make_surgical_anesthetic → make_anesthetic → grind_herb_medical → harvest_herb → make_alcohol_solution → distill_water → make_boiled_water

외부 공급이 필요한 말단: 주류 (alcohol_drink) ×4, 오염수 (contaminated_water) ×2, 빈병 (empty_bottle) ×1

## 광범위 항생제

경로: synth_broad_antibiotic → concentrate_serum → brew_herbal_extract → harvest_herb → make_boiled_water → make_alcohol_solution

외부 공급이 필요한 말단: 오염수 (contaminated_water) ×1, 주류 (alcohol_drink) ×2, 항생제 (antibiotics) ×1

## 정제 약

경로: purify_medicine → make_crude_medicine → grind_herb_medical → harvest_herb → make_boiled_water → make_charcoal → make_kindling_from_log → distill_water

외부 공급이 필요한 말단: 오염수 (contaminated_water) ×4, 통나무 (tree_log) ×2, 빈병 (empty_bottle) ×1

## 역병 백신

경로: 청사진 없음/계산 불가

외부 공급이 필요한 말단: 

자동 계산 제외 사유(실제 공급 불가능을 뜻하지 않음):
- 순환 재료: plague_vaccine → purified_water → charcoal_filter → cloth_scrap → cloth → thread → cloth_scrap
- 순환 재료: plague_vaccine → purified_water → charcoal_filter → cloth_scrap → cloth → large_cloth → cloth

## 정수 필터

경로: 청사진 없음/계산 불가

외부 공급이 필요한 말단: 정수 필터 (water_filter) ×1

## 구리 코일

경로: wind_copper_coil → extract_copper_wire

외부 공급이 필요한 말단: 회로기판 (circuit_board) ×1, 고철 (scrap_metal) ×1

## 회로 모듈

경로: assemble_circuit_module → extract_microchip

외부 공급이 필요한 말단: 회로기판 (circuit_board) ×2, 유리파편 (glass_shard) ×1, 철사 (wire) ×2, 플라스틱 (plastic) ×1

## 전기 모터

경로: build_electric_motor → wind_copper_coil → extract_copper_wire

외부 공급이 필요한 말단: 회로기판 (circuit_board) ×2, 고철 (scrap_metal) ×5, 철사 (wire) ×2, 스프링 (spring) ×1

## 발전기 코어

경로: build_generator_core → build_electric_motor → wind_copper_coil → extract_copper_wire → assemble_circuit_module → extract_microchip → smelt_refined_metal → make_charcoal → make_kindling_from_log

외부 공급이 필요한 말단: 회로기판 (circuit_board) ×4, 고철 (scrap_metal) ×11, 철사 (wire) ×4, 스프링 (spring) ×1, 유리파편 (glass_shard) ×1, 플라스틱 (plastic) ×1, 통나무 (tree_log) ×4

## 강화 천

경로: 청사진 없음/계산 불가

외부 공급이 필요한 말단: 

자동 계산 제외 사유(실제 공급 불가능을 뜻하지 않음):
- 순환 재료: reinforced_fabric → woven_fabric → thread → cloth_scrap → cloth → thread
- 순환 재료: reinforced_fabric → woven_fabric → thread → cloth_scrap → cloth → large_cloth → cloth
