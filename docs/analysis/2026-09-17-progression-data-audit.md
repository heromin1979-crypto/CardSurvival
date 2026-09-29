# 제작·지역 수급 전수 데이터 — 2026-09-17

> 재생성: `node tools/audit-progression-planning.mjs`。 현재 데이터 스냅샷이며 개선안과 구분한다. 제작 가능 항목은 원재료가 아니라는 뜻이 아니며, 수급 확률은 실제 조우·고갈·보너스를 합산한 실측값이 아니다.

청사진 366개 / 의료 카테고리 47개 / 지역 25개.

## 25개 구의 일반 드랍과 확정 보상

| 지역·위험도 | 일반 드랍 (가중치) | 30% | 60% | 100% |
|---|---|---|---|---|
| 강남구 / 3 | 천 (cloth):25、천 조각 (cloth_scrap):25、알코올 용액 (alcohol_solution):20、가죽 (leather):20、소화기 (old_fire_extinguisher):5、무너진 선반 (collapsed_shelf):5、교통 신호등 (traffic_light):5、에어컨 실외기 (old_ac_unit):5 | 천 조각 (cloth_scrap) ×4、알코올 용액 (alcohol_solution) ×1 | 고무 (rubber) ×2、유리파편 (glass_shard) ×2 | 플라스틱 (plastic) ×3、알코올 용액 (alcohol_solution) ×2 |
| 강동구 / 2 | 천 (cloth):25、정수 물병 (water_bottle):25、통조림 (canned_food):20、플라스틱 (plastic):20、부서진 가로등 (broken_lamp):5、녹슨 공구함 (rusted_toolbox):5、버려진 냉장고 (abandoned_fridge):5、잔해 자전거 (wrecked_bicycle):5 | 돌멩이 (pebble) ×4、모래 (sand) ×2 | 흙 주머니 (soil_bag) ×4、채소 씨앗 (vegetable_seed) ×2 | 곡물 씨앗 (grain_seed) ×3、흙 주머니 (soil_bag) ×5 |
| 강북구 / 2 | 목재 (wood):35、약초 (herb):25、야생 베리 (wild_berry):20、정수 물병 (water_bottle):25、지렁이 미끼 (bait_worm):8、산개울 (stream_spring):12、낡은 우체통 (old_mailbox):5、말라비틀어진 나무 (withered_tree):10、나무 (가로수) (tree_env):10 | 목재 (wood) ×3、약초 (herb) ×3 | 약초 씨앗 (herb_seed) ×2、흙 주머니 (soil_bag) ×3 | 약초 (herb) ×6、쐐기풀 (nettle) ×4 |
| 강서구 / 2 | 고철 (scrap_metal):40、철사 (wire):30、덕테이프 (duct_tape):20、로프 (rope):25、소화기 (old_fire_extinguisher):5、녹슨 공구함 (rusted_toolbox):5、고장난 세탁기 (broken_washing_machine):5、잔해 자전거 (wrecked_bicycle):5 | 고철 (scrap_metal) ×5、고무 (rubber) ×2 | 철사 (wire) ×3、스프링 (spring) ×2 | 회로기판 (circuit_board) ×1、고철 (scrap_metal) ×5 |
| 관악구 / 1 | 약초 (herb):25、유리파편 (glass_shard):25、플라스틱 (plastic):20、알코올 용액 (alcohol_solution):15、지렁이 미끼 (bait_worm):8、산개울 (stream_spring):12、부서진 의자 (broken_chair):5、잡초밭 (weed_patch):10、말라비틀어진 나무 (withered_tree):10 | 숯 (charcoal) ×2、천 조각 (cloth_scrap) ×2 | 유리파편 (glass_shard) ×2、빈병 (empty_bottle) ×2 | 약초 씨앗 (herb_seed) ×2、흙 주머니 (soil_bag) ×3 |
| 광진구 / 2 | 천 (cloth):25、정수 물병 (water_bottle):25、야생 베리 (wild_berry):20、로프 (rope):25、지렁이 미끼 (bait_worm):8、포장마차 잔해 (street_vendor_cart):5、잡초밭 (weed_patch):10、나무 (가로수) (tree_env):10、잔해 자전거 (wrecked_bicycle):5 | 로프 (rope) ×2、목재 (wood) ×3 | 소금 (salt) ×2、빈병 (empty_bottle) ×2 | 채소 씨앗 (vegetable_seed) ×2、흙 주머니 (soil_bag) ×4 |
| 구로구 / 2 | 고철 (scrap_metal):35、전자부품 (electronic_parts):25、철사 (wire):30、고무 (rubber):18、고장난 라디오 (broken_radio):5、녹슨 공구함 (rusted_toolbox):5、자판기 잔해 (vending_machine):5、고장난 세탁기 (broken_washing_machine):5 | 고철 (scrap_metal) ×5、스프링 (spring) ×2 | 회로기판 (circuit_board) ×1、철사 (wire) ×3 | 회로기판 (circuit_board) ×2、고무 (rubber) ×2 |
| 금천구 / 2 | 고철 (scrap_metal):40、못 (nail):30、철사 (wire):30、스프링 (spring):15、자갈 더미 (gravel_pile):10、녹슨 공구함 (rusted_toolbox):5、자판기 잔해 (vending_machine):5、무너진 선반 (collapsed_shelf):5 | 고철 (scrap_metal) ×6、못 (nail) ×4 | 숯 (charcoal) ×3、고철 (scrap_metal) ×4 | 고철 (scrap_metal) ×8、스프링 (spring) ×3 |
| 노원구 / 1 | 천 (cloth):25、정수 물병 (water_bottle):25、빈캔 (empty_can):25、통조림 (canned_food):20、지렁이 미끼 (bait_worm):8、산개울 (stream_spring):12、부서진 가로등 (broken_lamp):5、낡은 우체통 (old_mailbox):5、버려진 냉장고 (abandoned_fridge):5 | 천 조각 (cloth_scrap) ×4、플라스틱 (plastic) ×2 | 빈병 (empty_bottle) ×2、목재 (wood) ×3 | 채소 씨앗 (vegetable_seed) ×2、흙 주머니 (soil_bag) ×4 |
| 도봉구 / 1 | 목재 (wood):35、약초 (herb):25、식용 버섯 (mushroom_edible):20、생가죽 (hide):15、지렁이 미끼 (bait_worm):8、산개울 (stream_spring):12、자갈 더미 (gravel_pile):10、녹슨 공구함 (rusted_toolbox):5、나무 (가로수) (tree_env):10 | 목재 (wood) ×3、돌멩이 (pebble) ×4 | 약초 (herb) ×4、쐐기풀 (nettle) ×3 | 생가죽 (hide) ×2、약초 씨앗 (herb_seed) ×2 |
| 동대문구 / 2 | 천 (cloth):35、실 (thread):25、가죽 (leather):20、천 조각 (cloth_scrap):10、포장마차 잔해 (street_vendor_cart):5、부서진 가로등 (broken_lamp):5、무너진 선반 (collapsed_shelf):5、공중전화 부스 (telephone_booth):5 | 천 (cloth) ×3、실 (thread) ×2 | 천 (cloth) ×4、가죽 (leather) ×2 | 실 (thread) ×5、천 (cloth) ×5 |
| 동작구 / 1 | 약초 (herb):10、천 (cloth):25、정수 물병 (water_bottle):25、천 조각 (cloth_scrap):20、목재 (wood):25、부서진 가로등 (broken_lamp):5、고장난 라디오 (broken_radio):5、소화기 (old_fire_extinguisher):5、나무 (가로수) (tree_env):10 | 천 조각 (cloth_scrap) ×4、약초 (herb) ×2 | 알코올 용액 (alcohol_solution) ×2、빈병 (empty_bottle) ×2 | 약초 씨앗 (herb_seed) ×2、흙 주머니 (soil_bag) ×3 |
| 마포구 / 3 | 천 (cloth):20、빈병 (empty_bottle):25、고무 (rubber):20、철사 (wire):25、포장마차 잔해 (street_vendor_cart):5、자판기 잔해 (vending_machine):5、버려진 냉장고 (abandoned_fridge):5、매점 잔해 (destroyed_kiosk):5 | 빈병 (empty_bottle) ×3、고무 (rubber) ×2 | 회로기판 (circuit_board) ×1、철사 (wire) ×3 | 배터리 (battery) ×1、회로기판 (circuit_board) ×2 |
| 서대문구 / 4 | 천 조각 (cloth_scrap):25、유리파편 (glass_shard):25、알코올 용액 (alcohol_solution):20、약초 (herb):15、무너진 선반 (collapsed_shelf):5、고장난 세탁기 (broken_washing_machine):5、폐발전기 (old_generator):5、에어컨 실외기 (old_ac_unit):5 | 알코올 용액 (alcohol_solution) ×2、천 조각 (cloth_scrap) ×6 | 고무 (rubber) ×3、유리파편 (glass_shard) ×3 | 회로기판 (circuit_board) ×2、알코올 용액 (alcohol_solution) ×3 |
| 서초구 / 4 | 고철 (scrap_metal):35、천 (cloth):20、로프 (rope):25、탄피 (빈) (empty_cartridge):15、교통 신호등 (traffic_light):5、공중전화 부스 (telephone_booth):5、매점 잔해 (destroyed_kiosk):5、폐차 (wrecked_car):5 | 고철 (scrap_metal) ×6、철사 (wire) ×3 | 고무 (rubber) ×3、플라스틱 (plastic) ×3 | 회로기판 (circuit_board) ×2、배터리 (battery) ×1 |
| 성동구 / 3 | 고철 (scrap_metal):40、철사 (wire):30、못 (nail):30、숯 (charcoal):15、자갈 더미 (gravel_pile):10、고장난 세탁기 (broken_washing_machine):5、교통 신호등 (traffic_light):5、폐발전기 (old_generator):5 | 고철 (scrap_metal) ×6、못 (nail) ×6 | 숯 (charcoal) ×4、스프링 (spring) ×3 | 회로기판 (circuit_board) ×2、고철 (scrap_metal) ×8 |
| 성북구 / 2 | 천 (cloth):25、로프 (rope):25、통조림 (canned_food):20、실 (thread):20、부서진 의자 (broken_chair):5、고장난 라디오 (broken_radio):5、자판기 잔해 (vending_machine):5、무너진 선반 (collapsed_shelf):5 | 천 (cloth) ×3、실 (thread) ×3 | 목재 (wood) ×4、로프 (rope) ×2 | 약초 씨앗 (herb_seed) ×2、흙 주머니 (soil_bag) ×3 |
| 송파구 / 5 | 고철 (scrap_metal):30、로프 (rope):25、유리파편 (glass_shard):25、배터리 (battery):12、교통 신호등 (traffic_light):5、잔해 자전거 (wrecked_bicycle):5、폐차 (wrecked_car):5、무너진 비계 (collapsed_scaffold):5、버스 잔해 (wrecked_bus):5 | 로프 (rope) ×3、고철 (scrap_metal) ×6 | 고무 (rubber) ×3、철사 (wire) ×4 | 회로기판 (circuit_board) ×2、배터리 (battery) ×2 |
| 양천구 / 1 | 천 (cloth):25、정수 물병 (water_bottle):25、못 (nail):27、통조림 (canned_food):20、부서진 의자 (broken_chair):5、고장난 라디오 (broken_radio):5、자갈 더미 (gravel_pile):10、고장난 세탁기 (broken_washing_machine):5 | 목재 (wood) ×3、못 (nail) ×4 | 천 (cloth) ×3、로프 (rope) ×2 | 채소 씨앗 (vegetable_seed) ×2、흙 주머니 (soil_bag) ×4 |
| 영등포구 / 4 | 고철 (scrap_metal):35、전자부품 (electronic_parts):25、탄피 (빈) (empty_cartridge):15、회로기판 (circuit_board):12、공중전화 부스 (telephone_booth):5、버려진 냉장고 (abandoned_fridge):5、무너진 초소 (collapsed_guard_post):5、지하철 개찰구 (subway_gate):5 | 철사 (wire) ×4、고철 (scrap_metal) ×6 | 회로기판 (circuit_board) ×2、고무 (rubber) ×2 | 회로기판 (circuit_board) ×3、배터리 (battery) ×2 |
| 용산구 / 3 | 전자부품 (electronic_parts):30、철사 (wire):30、배터리 (battery):12、회로기판 (circuit_board):10、고장난 라디오 (broken_radio):5、공중전화 부스 (telephone_booth):5、교통 신호등 (traffic_light):5、지하철 개찰구 (subway_gate):5 | 철사 (wire) ×3、회로기판 (circuit_board) ×1 | 회로기판 (circuit_board) ×2、고무 (rubber) ×2 | 회로기판 (circuit_board) ×3、배터리 (battery) ×1 |
| 은평구 / 1 | 약초 (herb):30、목재 (wood):30、통나무 (tree_log):20、쐐기풀 (nettle):20、지렁이 미끼 (bait_worm):8、소화기 (old_fire_extinguisher):5、잡초밭 (weed_patch):10、낡은 우체통 (old_mailbox):5、말라비틀어진 나무 (withered_tree):10 | 목재 (wood) ×3、돌멩이 (pebble) ×4 | 쐐기풀 (nettle) ×4、천 (cloth) ×2 | 약초 씨앗 (herb_seed) ×2、흙 주머니 (soil_bag) ×3 |
| 종로구 / 5 | 고철 (scrap_metal):35、못 (nail):25、탄피 (빈) (empty_cartridge):15、유황 (sulfur):12、말라비틀어진 나무 (withered_tree):10、공중전화 부스 (telephone_booth):5、무너진 초소 (collapsed_guard_post):5、버스 잔해 (wrecked_bus):5、폐차 (wrecked_car):5 | 고철 (scrap_metal) ×6、철사 (wire) ×3 | 탄피 (빈) (empty_cartridge) ×4、천 (cloth) ×3 | 회로기판 (circuit_board) ×2、배터리 (battery) ×2 |
| 중구 / 5 | 천 (cloth):30、실 (thread):18、빈병 (empty_bottle):20、가죽 (leather):15、자판기 잔해 (vending_machine):5、매점 잔해 (destroyed_kiosk):5、지하철 개찰구 (subway_gate):5、무너진 비계 (collapsed_scaffold):5、에어컨 실외기 (old_ac_unit):5 | 소금 (salt) ×3、빈병 (empty_bottle) ×3 | 소금 (salt) ×3、천 (cloth) ×4 | 채소 씨앗 (vegetable_seed) ×2、흙 주머니 (soil_bag) ×4 |
| 중랑구 / 2 | 약초 (herb):25、쐐기풀 (nettle):25、목재 (wood):30、야생 베리 (wild_berry):20、지렁이 미끼 (bait_worm):8、포장마차 잔해 (street_vendor_cart):5、자갈 더미 (gravel_pile):10、잔해 자전거 (wrecked_bicycle):5、말라비틀어진 나무 (withered_tree):10 | 쐐기풀 (nettle) ×4、목재 (wood) ×3 | 채소 씨앗 (vegetable_seed) ×2、흙 주머니 (soil_bag) ×4 | 모래 (sand) ×4、숯 (charcoal) ×3 |

## 확정 보상별 제작·소비처

| 지역·탐색도 | 보상 | 제작 경로 | 청사진 소비처 |
|---|---|---|---|
| 강남구 30% | 천 조각 (cloth_scrap) ×4 | make_cloth_scrap | make_charcoal_filter, craft_thread, make_gauze, wrap_bandage, make_sling, make_tourniquet, molotov, practice_bandage, build_medical_bed |
| 강남구 30% | 알코올 용액 (alcohol_solution) ×1 | make_alcohol_solution | make_stamina_tonic, molotov, brew_antiseptic, synthesize_detonator_cap, synthesize_poison, rad_blocker_craft, refine_avgas, craft_reinforced_bandage, craft_stabilizer_shot, craft_painkiller_field, build_quarantine_station, make_anesthetic, concentrate_serum, combat_stimulant, synth_plague_vaccine, queen_pheromone |
| 강남구 60% | 고무 (rubber) ×2 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 강남구 60% | 유리파편 (glass_shard) ×2 | 청사진 없음 | make_thermometer, build_chemistry_bench, craft_avionics_module, craft_fuselage_frame, upgrade_binoculars, build_xray_station, build_incubator, build_analysis_lab, extract_microchip, build_spotlight, make_spotlight_flashlight, build_solar_panel, make_night_vision |
| 강남구 100% | 플라스틱 (plastic) ×3 | 청사진 없음 | assemble_water_filter, make_hazmat_boots, make_flashlight, upgrade_binoculars, craft_iv_saline, build_isolation_ward, build_quarantine_station, craft_bucket, assemble_circuit_module, preserve_ration |
| 강남구 100% | 알코올 용액 (alcohol_solution) ×2 | make_alcohol_solution | make_stamina_tonic, molotov, brew_antiseptic, synthesize_detonator_cap, synthesize_poison, rad_blocker_craft, refine_avgas, craft_reinforced_bandage, craft_stabilizer_shot, craft_painkiller_field, build_quarantine_station, make_anesthetic, concentrate_serum, combat_stimulant, synth_plague_vaccine, queen_pheromone |
| 강동구 30% | 돌멩이 (pebble) ×4 | 청사진 없음 | campfire, wind_stove, build_field_forge, build_coal_furnace, make_stone_knife, make_mortar_pestle, make_mortar_mix |
| 강동구 30% | 모래 (sand) ×2 | 청사진 없음 | assemble_water_filter, make_mortar_mix |
| 강동구 60% | 흙 주머니 (soil_bag) ×4 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 강동구 60% | 채소 씨앗 (vegetable_seed) ×2 | 청사진 없음 | build_garden_bed_veggie |
| 강동구 100% | 곡물 씨앗 (grain_seed) ×3 | 청사진 없음 | build_garden_bed_grain |
| 강동구 100% | 흙 주머니 (soil_bag) ×5 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 강북구 30% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 강북구 30% | 약초 (herb) ×3 | harvest_herb | brew_antiseptic, synthesize_poison, grind_herb, practice_bandage, rad_blocker_craft, gourmet_steak, traditional_feast, craft_field_antidote, craft_vitamin_complex, craft_infection_serum, craft_adrenaline_shot, craft_herbal_tonic, cook_soybean_stew, cook_bibimbap_chef, cook_cream_soup, cook_garden_salad, cook_hangover_soup, cook_hot_pot, cook_meat_stew, brew_rice_wine, make_pickled_food, make_sandwich, grind_herb_medical, brew_herbal_extract, make_dye, survivors_feast |
| 강북구 60% | 약초 씨앗 (herb_seed) ×2 | 청사진 없음 | build_garden_bed_herb |
| 강북구 60% | 흙 주머니 (soil_bag) ×3 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 강북구 100% | 약초 (herb) ×6 | harvest_herb | brew_antiseptic, synthesize_poison, grind_herb, practice_bandage, rad_blocker_craft, gourmet_steak, traditional_feast, craft_field_antidote, craft_vitamin_complex, craft_infection_serum, craft_adrenaline_shot, craft_herbal_tonic, cook_soybean_stew, cook_bibimbap_chef, cook_cream_soup, cook_garden_salad, cook_hangover_soup, cook_hot_pot, cook_meat_stew, brew_rice_wine, make_pickled_food, make_sandwich, grind_herb_medical, brew_herbal_extract, make_dye, survivors_feast |
| 강북구 100% | 쐐기풀 (nettle) ×4 | 청사진 없음 | process_nettle, make_nettle_stew |
| 강서구 30% | 고철 (scrap_metal) ×5 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 강서구 30% | 고무 (rubber) ×2 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 강서구 60% | 철사 (wire) ×3 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 강서구 60% | 스프링 (spring) ×2 | 청사진 없음 | make_crossbow, craft_rat_trap, build_ammo_bench, craft_piston_engine, craft_tail_rotor_assembly, upgrade_crossbow, upgrade_pipe_wrench, build_electric_motor, make_pipe_shotgun, make_fishing_rod_advanced, electric_blade, auto_turret, assemble_warlord_rifle |
| 강서구 100% | 회로기판 (circuit_board) ×1 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 강서구 100% | 고철 (scrap_metal) ×5 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 관악구 30% | 숯 (charcoal) ×2 | make_charcoal | make_charcoal_filter, smelt_refined_metal, smelt_steel_plate, smelt_lead_ingot, smelt_brass, forge_ax_head, forge_shovel_head, forge_hammer_head, forge_bolt_tip, synthesize_black_powder, rad_blocker_craft, craft_aviation_alloy, craft_field_antidote, craft_rad_blocker_plus, cook_dark_chocolate, make_brick, make_detox, purify_medicine, make_dye, smelt_alloy_ingot, forge_master_blade |
| 관악구 30% | 천 조각 (cloth_scrap) ×2 | make_cloth_scrap | make_charcoal_filter, craft_thread, make_gauze, wrap_bandage, make_sling, make_tourniquet, molotov, practice_bandage, build_medical_bed |
| 관악구 60% | 유리파편 (glass_shard) ×2 | 청사진 없음 | make_thermometer, build_chemistry_bench, craft_avionics_module, craft_fuselage_frame, upgrade_binoculars, build_xray_station, build_incubator, build_analysis_lab, extract_microchip, build_spotlight, make_spotlight_flashlight, build_solar_panel, make_night_vision |
| 관악구 60% | 빈병 (empty_bottle) ×2 | 청사진 없음 | rain_collector, make_stamina_tonic, molotov, break_bottle, build_chemistry_bench, synthesize_poison, build_blood_bank, distill_water, queen_pheromone |
| 관악구 100% | 약초 씨앗 (herb_seed) ×2 | 청사진 없음 | build_garden_bed_herb |
| 관악구 100% | 흙 주머니 (soil_bag) ×3 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 광진구 30% | 로프 (rope) ×2 | twist_rope | water_purifier, barricade, workbench, garden, rain_collector, make_sling, make_tourniquet, make_spiked_pipe, make_spear, make_crossbow, make_warm_clothes, make_hiking_boots, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_shield, make_hand_axe, build_tanning_rack, craft_shovel, craft_hammer, craft_improved_fishing_rod, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, build_fermentation_pot, build_root_cellar, build_bee_hive, wooden_sword, cloth_guard, craft_fuselage_frame, upgrade_spear, upgrade_crossbow, build_water_tower, make_fishing_net, acid_whip, reinforced_shelter, fireproof_barricade, street_snare_trap, build_watchtower, craft_tiger_fang_necklace |
| 광진구 30% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 광진구 60% | 소금 (salt) ×2 | 청사진 없음 | tan_hide, make_cooked_ration, build_fermentation_pot, dry_meat, dry_fish, grill_fish, make_berry_jam, make_vegetable_stew, ferment_kimchi, gourmet_steak, craft_iv_saline, cook_kimchi_stew, cook_soybean_stew, cook_galbi_jjim, cook_cold_noodles, cook_tomato_pasta, cook_grilled_steak, cook_cream_soup, cook_garden_salad, cook_hard_bread, cook_sponge_cake, cook_fish_cake_stew, cook_hot_pot, cook_rice_porridge, salt_meat, survivors_feast, wild_salt_cure, pickle_bamboo_shoot |
| 광진구 60% | 빈병 (empty_bottle) ×2 | 청사진 없음 | rain_collector, make_stamina_tonic, molotov, break_bottle, build_chemistry_bench, synthesize_poison, build_blood_bank, distill_water, queen_pheromone |
| 광진구 100% | 채소 씨앗 (vegetable_seed) ×2 | 청사진 없음 | build_garden_bed_veggie |
| 광진구 100% | 흙 주머니 (soil_bag) ×4 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 구로구 30% | 고철 (scrap_metal) ×5 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 구로구 30% | 스프링 (spring) ×2 | 청사진 없음 | make_crossbow, craft_rat_trap, build_ammo_bench, craft_piston_engine, craft_tail_rotor_assembly, upgrade_crossbow, upgrade_pipe_wrench, build_electric_motor, make_pipe_shotgun, make_fishing_rod_advanced, electric_blade, auto_turret, assemble_warlord_rifle |
| 구로구 60% | 회로기판 (circuit_board) ×1 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 구로구 60% | 철사 (wire) ×3 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 구로구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 구로구 100% | 고무 (rubber) ×2 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 금천구 30% | 고철 (scrap_metal) ×6 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 금천구 30% | 못 (nail) ×4 | 청사진 없음 | barricade, spike_trap, workbench, storage_box, make_spiked_pipe, make_nail_bomb, craft_alley_pit_trap, build_field_forge, build_ammo_bench, build_carpentry_bench, build_tanning_rack, craft_shovel, craft_hammer, make_iron_pot, build_drying_rack, build_cooking_pot_stand, build_root_cellar, craft_fuselage_frame, upgrade_bat, build_medical_cabinet, make_pipe_shotgun, reinforced_shelter |
| 금천구 60% | 숯 (charcoal) ×3 | make_charcoal | make_charcoal_filter, smelt_refined_metal, smelt_steel_plate, smelt_lead_ingot, smelt_brass, forge_ax_head, forge_shovel_head, forge_hammer_head, forge_bolt_tip, synthesize_black_powder, rad_blocker_craft, craft_aviation_alloy, craft_field_antidote, craft_rad_blocker_plus, cook_dark_chocolate, make_brick, make_detox, purify_medicine, make_dye, smelt_alloy_ingot, forge_master_blade |
| 금천구 60% | 고철 (scrap_metal) ×4 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 금천구 100% | 고철 (scrap_metal) ×8 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 금천구 100% | 스프링 (spring) ×3 | 청사진 없음 | make_crossbow, craft_rat_trap, build_ammo_bench, craft_piston_engine, craft_tail_rotor_assembly, upgrade_crossbow, upgrade_pipe_wrench, build_electric_motor, make_pipe_shotgun, make_fishing_rod_advanced, electric_blade, auto_turret, assemble_warlord_rifle |
| 노원구 30% | 천 조각 (cloth_scrap) ×4 | make_cloth_scrap | make_charcoal_filter, craft_thread, make_gauze, wrap_bandage, make_sling, make_tourniquet, molotov, practice_bandage, build_medical_bed |
| 노원구 30% | 플라스틱 (plastic) ×2 | 청사진 없음 | assemble_water_filter, make_hazmat_boots, make_flashlight, upgrade_binoculars, craft_iv_saline, build_isolation_ward, build_quarantine_station, craft_bucket, assemble_circuit_module, preserve_ration |
| 노원구 60% | 빈병 (empty_bottle) ×2 | 청사진 없음 | rain_collector, make_stamina_tonic, molotov, break_bottle, build_chemistry_bench, synthesize_poison, build_blood_bank, distill_water, queen_pheromone |
| 노원구 60% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 노원구 100% | 채소 씨앗 (vegetable_seed) ×2 | 청사진 없음 | build_garden_bed_veggie |
| 노원구 100% | 흙 주머니 (soil_bag) ×4 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 도봉구 30% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 도봉구 30% | 돌멩이 (pebble) ×4 | 청사진 없음 | campfire, wind_stove, build_field_forge, build_coal_furnace, make_stone_knife, make_mortar_pestle, make_mortar_mix |
| 도봉구 60% | 약초 (herb) ×4 | harvest_herb | brew_antiseptic, synthesize_poison, grind_herb, practice_bandage, rad_blocker_craft, gourmet_steak, traditional_feast, craft_field_antidote, craft_vitamin_complex, craft_infection_serum, craft_adrenaline_shot, craft_herbal_tonic, cook_soybean_stew, cook_bibimbap_chef, cook_cream_soup, cook_garden_salad, cook_hangover_soup, cook_hot_pot, cook_meat_stew, brew_rice_wine, make_pickled_food, make_sandwich, grind_herb_medical, brew_herbal_extract, make_dye, survivors_feast |
| 도봉구 60% | 쐐기풀 (nettle) ×3 | 청사진 없음 | process_nettle, make_nettle_stew |
| 도봉구 100% | 생가죽 (hide) ×2 | butcher_stray_carcass | tan_hide |
| 도봉구 100% | 약초 씨앗 (herb_seed) ×2 | 청사진 없음 | build_garden_bed_herb |
| 동대문구 30% | 천 (cloth) ×3 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 동대문구 30% | 실 (thread) ×2 | craft_thread | craft_cloth_from_thread, craft_large_cloth, make_warm_clothes, craft_blanket, craft_sleeping_bag, make_raincoat, upgrade_vest, upgrade_gloves, weave_fabric, make_ghillie_suit, make_ballistic_weave, make_fishing_net, extreme_cold_suit, stealth_suit, forge_katana, upgrade_stealth_suit, crew_pass, warding_charm |
| 동대문구 60% | 천 (cloth) ×4 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 동대문구 60% | 가죽 (leather) ×2 | tan_hide | make_warm_clothes, craft_sleeping_bag, make_helmet, make_tactical_vest, make_hiking_boots, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_shield, make_machete, craft_axe, craft_improved_crossbow_bolt, upgrade_knife, upgrade_vest, upgrade_boots, upgrade_gloves, upgrade_pipe_wrench, improve_pipe_wrench, forge_armor_plate, acid_whip, dragon_scale_vest, extreme_cold_suit, stealth_suit, forge_katana, forge_alloy_armor_plate, make_master_lure, forge_crocodile_scale_armor, fireproof_suit, crew_pass, warding_charm |
| 동대문구 100% | 실 (thread) ×5 | craft_thread | craft_cloth_from_thread, craft_large_cloth, make_warm_clothes, craft_blanket, craft_sleeping_bag, make_raincoat, upgrade_vest, upgrade_gloves, weave_fabric, make_ghillie_suit, make_ballistic_weave, make_fishing_net, extreme_cold_suit, stealth_suit, forge_katana, upgrade_stealth_suit, crew_pass, warding_charm |
| 동대문구 100% | 천 (cloth) ×5 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 동작구 30% | 천 조각 (cloth_scrap) ×4 | make_cloth_scrap | make_charcoal_filter, craft_thread, make_gauze, wrap_bandage, make_sling, make_tourniquet, molotov, practice_bandage, build_medical_bed |
| 동작구 30% | 약초 (herb) ×2 | harvest_herb | brew_antiseptic, synthesize_poison, grind_herb, practice_bandage, rad_blocker_craft, gourmet_steak, traditional_feast, craft_field_antidote, craft_vitamin_complex, craft_infection_serum, craft_adrenaline_shot, craft_herbal_tonic, cook_soybean_stew, cook_bibimbap_chef, cook_cream_soup, cook_garden_salad, cook_hangover_soup, cook_hot_pot, cook_meat_stew, brew_rice_wine, make_pickled_food, make_sandwich, grind_herb_medical, brew_herbal_extract, make_dye, survivors_feast |
| 동작구 60% | 알코올 용액 (alcohol_solution) ×2 | make_alcohol_solution | make_stamina_tonic, molotov, brew_antiseptic, synthesize_detonator_cap, synthesize_poison, rad_blocker_craft, refine_avgas, craft_reinforced_bandage, craft_stabilizer_shot, craft_painkiller_field, build_quarantine_station, make_anesthetic, concentrate_serum, combat_stimulant, synth_plague_vaccine, queen_pheromone |
| 동작구 60% | 빈병 (empty_bottle) ×2 | 청사진 없음 | rain_collector, make_stamina_tonic, molotov, break_bottle, build_chemistry_bench, synthesize_poison, build_blood_bank, distill_water, queen_pheromone |
| 동작구 100% | 약초 씨앗 (herb_seed) ×2 | 청사진 없음 | build_garden_bed_herb |
| 동작구 100% | 흙 주머니 (soil_bag) ×3 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 마포구 30% | 빈병 (empty_bottle) ×3 | 청사진 없음 | rain_collector, make_stamina_tonic, molotov, break_bottle, build_chemistry_bench, synthesize_poison, build_blood_bank, distill_water, queen_pheromone |
| 마포구 30% | 고무 (rubber) ×2 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 마포구 60% | 회로기판 (circuit_board) ×1 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 마포구 60% | 철사 (wire) ×3 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 마포구 100% | 배터리 (battery) ×1 | 청사진 없음 | smelt_lead_ingot, make_power_cell, build_solar_charger, military_radio_kit |
| 마포구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 서대문구 30% | 알코올 용액 (alcohol_solution) ×2 | make_alcohol_solution | make_stamina_tonic, molotov, brew_antiseptic, synthesize_detonator_cap, synthesize_poison, rad_blocker_craft, refine_avgas, craft_reinforced_bandage, craft_stabilizer_shot, craft_painkiller_field, build_quarantine_station, make_anesthetic, concentrate_serum, combat_stimulant, synth_plague_vaccine, queen_pheromone |
| 서대문구 30% | 천 조각 (cloth_scrap) ×6 | make_cloth_scrap | make_charcoal_filter, craft_thread, make_gauze, wrap_bandage, make_sling, make_tourniquet, molotov, practice_bandage, build_medical_bed |
| 서대문구 60% | 고무 (rubber) ×3 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 서대문구 60% | 유리파편 (glass_shard) ×3 | 청사진 없음 | make_thermometer, build_chemistry_bench, craft_avionics_module, craft_fuselage_frame, upgrade_binoculars, build_xray_station, build_incubator, build_analysis_lab, extract_microchip, build_spotlight, make_spotlight_flashlight, build_solar_panel, make_night_vision |
| 서대문구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 서대문구 100% | 알코올 용액 (alcohol_solution) ×3 | make_alcohol_solution | make_stamina_tonic, molotov, brew_antiseptic, synthesize_detonator_cap, synthesize_poison, rad_blocker_craft, refine_avgas, craft_reinforced_bandage, craft_stabilizer_shot, craft_painkiller_field, build_quarantine_station, make_anesthetic, concentrate_serum, combat_stimulant, synth_plague_vaccine, queen_pheromone |
| 서초구 30% | 고철 (scrap_metal) ×6 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 서초구 30% | 철사 (wire) ×3 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 서초구 60% | 고무 (rubber) ×3 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 서초구 60% | 플라스틱 (plastic) ×3 | 청사진 없음 | assemble_water_filter, make_hazmat_boots, make_flashlight, upgrade_binoculars, craft_iv_saline, build_isolation_ward, build_quarantine_station, craft_bucket, assemble_circuit_module, preserve_ration |
| 서초구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 서초구 100% | 배터리 (battery) ×1 | 청사진 없음 | smelt_lead_ingot, make_power_cell, build_solar_charger, military_radio_kit |
| 성동구 30% | 고철 (scrap_metal) ×6 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 성동구 30% | 못 (nail) ×6 | 청사진 없음 | barricade, spike_trap, workbench, storage_box, make_spiked_pipe, make_nail_bomb, craft_alley_pit_trap, build_field_forge, build_ammo_bench, build_carpentry_bench, build_tanning_rack, craft_shovel, craft_hammer, make_iron_pot, build_drying_rack, build_cooking_pot_stand, build_root_cellar, craft_fuselage_frame, upgrade_bat, build_medical_cabinet, make_pipe_shotgun, reinforced_shelter |
| 성동구 60% | 숯 (charcoal) ×4 | make_charcoal | make_charcoal_filter, smelt_refined_metal, smelt_steel_plate, smelt_lead_ingot, smelt_brass, forge_ax_head, forge_shovel_head, forge_hammer_head, forge_bolt_tip, synthesize_black_powder, rad_blocker_craft, craft_aviation_alloy, craft_field_antidote, craft_rad_blocker_plus, cook_dark_chocolate, make_brick, make_detox, purify_medicine, make_dye, smelt_alloy_ingot, forge_master_blade |
| 성동구 60% | 스프링 (spring) ×3 | 청사진 없음 | make_crossbow, craft_rat_trap, build_ammo_bench, craft_piston_engine, craft_tail_rotor_assembly, upgrade_crossbow, upgrade_pipe_wrench, build_electric_motor, make_pipe_shotgun, make_fishing_rod_advanced, electric_blade, auto_turret, assemble_warlord_rifle |
| 성동구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 성동구 100% | 고철 (scrap_metal) ×8 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 성북구 30% | 천 (cloth) ×3 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 성북구 30% | 실 (thread) ×3 | craft_thread | craft_cloth_from_thread, craft_large_cloth, make_warm_clothes, craft_blanket, craft_sleeping_bag, make_raincoat, upgrade_vest, upgrade_gloves, weave_fabric, make_ghillie_suit, make_ballistic_weave, make_fishing_net, extreme_cold_suit, stealth_suit, forge_katana, upgrade_stealth_suit, crew_pass, warding_charm |
| 성북구 60% | 목재 (wood) ×4 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 성북구 60% | 로프 (rope) ×2 | twist_rope | water_purifier, barricade, workbench, garden, rain_collector, make_sling, make_tourniquet, make_spiked_pipe, make_spear, make_crossbow, make_warm_clothes, make_hiking_boots, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_shield, make_hand_axe, build_tanning_rack, craft_shovel, craft_hammer, craft_improved_fishing_rod, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, build_fermentation_pot, build_root_cellar, build_bee_hive, wooden_sword, cloth_guard, craft_fuselage_frame, upgrade_spear, upgrade_crossbow, build_water_tower, make_fishing_net, acid_whip, reinforced_shelter, fireproof_barricade, street_snare_trap, build_watchtower, craft_tiger_fang_necklace |
| 성북구 100% | 약초 씨앗 (herb_seed) ×2 | 청사진 없음 | build_garden_bed_herb |
| 성북구 100% | 흙 주머니 (soil_bag) ×3 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 송파구 30% | 로프 (rope) ×3 | twist_rope | water_purifier, barricade, workbench, garden, rain_collector, make_sling, make_tourniquet, make_spiked_pipe, make_spear, make_crossbow, make_warm_clothes, make_hiking_boots, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_shield, make_hand_axe, build_tanning_rack, craft_shovel, craft_hammer, craft_improved_fishing_rod, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, build_fermentation_pot, build_root_cellar, build_bee_hive, wooden_sword, cloth_guard, craft_fuselage_frame, upgrade_spear, upgrade_crossbow, build_water_tower, make_fishing_net, acid_whip, reinforced_shelter, fireproof_barricade, street_snare_trap, build_watchtower, craft_tiger_fang_necklace |
| 송파구 30% | 고철 (scrap_metal) ×6 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 송파구 60% | 고무 (rubber) ×3 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 송파구 60% | 철사 (wire) ×4 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 송파구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 송파구 100% | 배터리 (battery) ×2 | 청사진 없음 | smelt_lead_ingot, make_power_cell, build_solar_charger, military_radio_kit |
| 양천구 30% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 양천구 30% | 못 (nail) ×4 | 청사진 없음 | barricade, spike_trap, workbench, storage_box, make_spiked_pipe, make_nail_bomb, craft_alley_pit_trap, build_field_forge, build_ammo_bench, build_carpentry_bench, build_tanning_rack, craft_shovel, craft_hammer, make_iron_pot, build_drying_rack, build_cooking_pot_stand, build_root_cellar, craft_fuselage_frame, upgrade_bat, build_medical_cabinet, make_pipe_shotgun, reinforced_shelter |
| 양천구 60% | 천 (cloth) ×3 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 양천구 60% | 로프 (rope) ×2 | twist_rope | water_purifier, barricade, workbench, garden, rain_collector, make_sling, make_tourniquet, make_spiked_pipe, make_spear, make_crossbow, make_warm_clothes, make_hiking_boots, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_shield, make_hand_axe, build_tanning_rack, craft_shovel, craft_hammer, craft_improved_fishing_rod, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, build_fermentation_pot, build_root_cellar, build_bee_hive, wooden_sword, cloth_guard, craft_fuselage_frame, upgrade_spear, upgrade_crossbow, build_water_tower, make_fishing_net, acid_whip, reinforced_shelter, fireproof_barricade, street_snare_trap, build_watchtower, craft_tiger_fang_necklace |
| 양천구 100% | 채소 씨앗 (vegetable_seed) ×2 | 청사진 없음 | build_garden_bed_veggie |
| 양천구 100% | 흙 주머니 (soil_bag) ×4 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 영등포구 30% | 철사 (wire) ×4 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 영등포구 30% | 고철 (scrap_metal) ×6 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 영등포구 60% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 영등포구 60% | 고무 (rubber) ×2 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 영등포구 100% | 회로기판 (circuit_board) ×3 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 영등포구 100% | 배터리 (battery) ×2 | 청사진 없음 | smelt_lead_ingot, make_power_cell, build_solar_charger, military_radio_kit |
| 용산구 30% | 철사 (wire) ×3 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 용산구 30% | 회로기판 (circuit_board) ×1 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 용산구 60% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 용산구 60% | 고무 (rubber) ×2 | 청사진 없음 | make_stethoscope, make_raincoat, make_hazmat_suit, make_hiking_boots, make_hazmat_boots, craft_piston_engine, craft_tail_rotor_assembly, craft_fuselage_frame, upgrade_helmet, upgrade_boots, upgrade_raincoat, build_plumbing_system, reinforce_fabric, improve_rain_collector, silenced_pistol, stealth_suit, field_transfusion_kit, solar_generator, emergency_generator, directional_mine, build_portable_generator, make_powered_drill, weave_acid_resistant_cloak, fireproof_suit |
| 용산구 100% | 회로기판 (circuit_board) ×3 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 용산구 100% | 배터리 (battery) ×1 | 청사진 없음 | smelt_lead_ingot, make_power_cell, build_solar_charger, military_radio_kit |
| 은평구 30% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 은평구 30% | 돌멩이 (pebble) ×4 | 청사진 없음 | campfire, wind_stove, build_field_forge, build_coal_furnace, make_stone_knife, make_mortar_pestle, make_mortar_mix |
| 은평구 60% | 쐐기풀 (nettle) ×4 | 청사진 없음 | process_nettle, make_nettle_stew |
| 은평구 60% | 천 (cloth) ×2 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 은평구 100% | 약초 씨앗 (herb_seed) ×2 | 청사진 없음 | build_garden_bed_herb |
| 은평구 100% | 흙 주머니 (soil_bag) ×3 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 종로구 30% | 고철 (scrap_metal) ×6 | 청사진 없음 | wind_stove, water_purifier, workbench, medical_clinic, field_hospital, make_fire_by_flint, make_sharp_blade, make_iron_pipe, make_thermometer, make_stethoscope, reinforced_bat, make_crossbow, make_crossbow_bolt, make_helmet, make_tactical_vest, make_makeshift_shield, craft_rat_trap, make_shield, make_hand_axe, make_machete, build_field_forge, build_coal_furnace, build_chemistry_bench, build_ammo_bench, build_carpentry_bench, smelt_refined_metal, forge_hammer_head, forge_bolt_tip, make_mortar_pestle, make_trowel, make_sickle, make_kitchen_knife, make_iron_pot, build_cooking_pot_stand, fishing_rod_improved, training_shield, craft_aviation_alloy, craft_piston_engine, craft_tail_rotor_assembly, upgrade_iron_pipe, upgrade_bat, upgrade_spear, upgrade_vest, upgrade_helmet, upgrade_pipe_wrench, craft_rad_blocker_plus, build_medical_bed, build_surgical_table, build_isolation_ward, build_medical_cabinet, build_blood_bank, build_quarantine_station, build_xray_station, build_incubator, build_analysis_lab, craft_bucket, wind_copper_coil, build_electric_motor, make_concrete_block, build_brick_furnace, make_plate_carrier, make_lockpick_set, silenced_pistol, ultra_reinforced_bat, dragon_scale_vest, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, fireproof_barricade, street_snare_trap, make_radio_transmitter, assemble_warlord_rifle |
| 종로구 30% | 철사 (wire) ×3 | 청사진 없음 | barricade, make_stethoscope, make_spear, craft_rat_trap, make_lockpick, make_flashlight, build_coal_furnace, build_chemistry_bench, build_ammo_bench, smelt_brass, forge_fishing_hook, craft_axe, make_fish_trap, build_cooking_pot_stand, fishing_rod_improved, craft_piston_engine, craft_avionics_module, assemble_helicopter, upgrade_flashlight, assemble_circuit_module, build_electric_motor, make_pipe_assembly, build_reinforced_wall, make_scalpel, build_spotlight, make_lockpick_set, make_crab_trap, explosive_bolt, electric_blade, ultra_reinforced_bat, auto_turret, reinforced_shelter, solar_generator, emergency_generator, directional_mine, street_snare_trap, build_portable_generator, build_solar_charger, build_electric_fence, make_electronic_lockpick, make_automated_fish_trap |
| 종로구 60% | 탄피 (빈) (empty_cartridge) ×4 | forge_empty_cartridge | craft_pistol_ammo, craft_rifle_ammo |
| 종로구 60% | 천 (cloth) ×3 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 종로구 100% | 회로기판 (circuit_board) ×2 | 청사진 없음 | extract_copper_wire, extract_microchip |
| 종로구 100% | 배터리 (battery) ×2 | 청사진 없음 | smelt_lead_ingot, make_power_cell, build_solar_charger, military_radio_kit |
| 중구 30% | 소금 (salt) ×3 | 청사진 없음 | tan_hide, make_cooked_ration, build_fermentation_pot, dry_meat, dry_fish, grill_fish, make_berry_jam, make_vegetable_stew, ferment_kimchi, gourmet_steak, craft_iv_saline, cook_kimchi_stew, cook_soybean_stew, cook_galbi_jjim, cook_cold_noodles, cook_tomato_pasta, cook_grilled_steak, cook_cream_soup, cook_garden_salad, cook_hard_bread, cook_sponge_cake, cook_fish_cake_stew, cook_hot_pot, cook_rice_porridge, salt_meat, survivors_feast, wild_salt_cure, pickle_bamboo_shoot |
| 중구 30% | 빈병 (empty_bottle) ×3 | 청사진 없음 | rain_collector, make_stamina_tonic, molotov, break_bottle, build_chemistry_bench, synthesize_poison, build_blood_bank, distill_water, queen_pheromone |
| 중구 60% | 소금 (salt) ×3 | 청사진 없음 | tan_hide, make_cooked_ration, build_fermentation_pot, dry_meat, dry_fish, grill_fish, make_berry_jam, make_vegetable_stew, ferment_kimchi, gourmet_steak, craft_iv_saline, cook_kimchi_stew, cook_soybean_stew, cook_galbi_jjim, cook_cold_noodles, cook_tomato_pasta, cook_grilled_steak, cook_cream_soup, cook_garden_salad, cook_hard_bread, cook_sponge_cake, cook_fish_cake_stew, cook_hot_pot, cook_rice_porridge, salt_meat, survivors_feast, wild_salt_cure, pickle_bamboo_shoot |
| 중구 60% | 천 (cloth) ×4 | craft_cloth_from_thread, dismantle_large_cloth | medical_station, medical_clinic, medical_ward, field_hospital, garden, rain_collector, make_cloth_scrap, craft_large_cloth, make_smoke_bomb, make_warm_clothes, make_helmet, make_raincoat, make_tactical_vest, make_small_bag, make_backpack, make_duffel_bag, make_messenger_bag, make_military_bag, make_gas_mask_filter, cloth_guard, upgrade_helmet, build_medical_bed, make_dye, make_camo_cloth, extreme_cold_suit, stealth_suit, weave_acid_resistant_cloak, fireproof_suit |
| 중구 100% | 채소 씨앗 (vegetable_seed) ×2 | 청사진 없음 | build_garden_bed_veggie |
| 중구 100% | 흙 주머니 (soil_bag) ×4 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 중랑구 30% | 쐐기풀 (nettle) ×4 | 청사진 없음 | process_nettle, make_nettle_stew |
| 중랑구 30% | 목재 (wood) ×3 | make_kindling_from_log | barricade, spike_trap, workbench, storage_box, medical_station, medical_clinic, garden, make_kindling, make_wood_plank, make_charcoal, make_spear, make_crossbow, make_crossbow_bolt, make_makeshift_shield, craft_pigeon_snare, craft_alley_pit_trap, make_rope_ladder, make_hand_axe, build_carpentry_bench, build_tanning_rack, craft_hammer, make_trowel, make_fish_trap, make_sickle, make_kitchen_knife, build_drying_rack, fishing_rod_improved, upgrade_crossbow, make_pipe_shotgun, reinforced_shelter, fireproof_barricade |
| 중랑구 60% | 채소 씨앗 (vegetable_seed) ×2 | 청사진 없음 | build_garden_bed_veggie |
| 중랑구 60% | 흙 주머니 (soil_bag) ×4 | 청사진 없음 | make_mortar_pestle, make_clay_pot, build_fermentation_pot, build_garden_bed_veggie, build_garden_bed_herb, build_garden_bed_grain |
| 중랑구 100% | 모래 (sand) ×4 | 청사진 없음 | assemble_water_filter, make_mortar_mix |
| 중랑구 100% | 숯 (charcoal) ×3 | make_charcoal | make_charcoal_filter, smelt_refined_metal, smelt_steel_plate, smelt_lead_ingot, smelt_brass, forge_ax_head, forge_shovel_head, forge_hammer_head, forge_bolt_tip, synthesize_black_powder, rad_blocker_craft, craft_aviation_alloy, craft_field_antidote, craft_rad_blocker_plus, cook_dark_chocolate, make_brick, make_detox, purify_medicine, make_dye, smelt_alloy_ingot, forge_master_blade |

## 의료 제작 전체

| 청사진 | 출력 | 투입 | 설비 | 스킬 |
|---|---|---|---|---|
| wrap_bandage | 붕대 (bandage) ×2 | 천 조각 (cloth_scrap) ×2 |  | {} |
| make_thermometer | 체온계 (thermometer) ×1 | 유리파편 (glass_shard) ×1、고철 (scrap_metal) ×1 |  | {"medicine":1} |
| make_stethoscope | 청진기 (stethoscope) ×1 | 고무 (rubber) ×1、고철 (scrap_metal) ×2、철사 (wire) ×1 |  | {"medicine":3} |
| make_diagnostic_kit | 진단 키트 (diagnostic_kit) ×1 | 체온계 (thermometer) ×1、청진기 (stethoscope) ×1、소독약 (antiseptic) ×1 | workbench | {"medicine":5} |
| make_sling | 삼각건 (sling) ×1 | 천 조각 (cloth_scrap) ×3、로프 (rope) ×1 |  | {"medicine":2} |
| make_head_bandage | 두부 압박붕대 (head_bandage) ×1 | 붕대 (bandage) ×1、거즈 (gauze) ×2 |  | {"medicine":2} |
| make_tourniquet | 지혈대 (tourniquet) ×1 | 로프 (rope) ×1、천 조각 (cloth_scrap) ×2 |  | {"medicine":4} |
| make_first_aid_kit | 구급키트 (first_aid_kit) ×1 | 붕대 (bandage) ×2、소독약 (antiseptic) ×1、거즈 (gauze) ×2 |  | {"crafting":2,"medicine":1} |
| make_emergency_kit | 비상키트 (emergency_kit) ×1 | 구급키트 (first_aid_kit) ×1、소독약 (antiseptic) ×1、부목 (splint) ×1、진통제 (painkiller) ×2、항생제 (antibiotics) ×1、거즈 (gauze) ×2 | workbench | {"crafting":3,"medicine":2} |
| brew_herbal_tea | 허브차 (herbal_tea) ×2 | 비타민 (vitamins) ×1、끓인 물 (boiled_water) ×1 | campfire | {"cooking":1,"medicine":1} |
| make_stamina_tonic | 활력 강장제 (stamina_tonic) ×1 | 허브차 (herbal_tea) ×2、알코올 용액 (alcohol_solution) ×1、빈병 (empty_bottle) ×1 |  | {"crafting":3,"medicine":1} |
| make_battle_ration | 전투 식량팩 (battle_ration) ×1 | 활력 강장제 (stamina_tonic) ×1、에너지바 (energy_bar) ×2、건육 (dried_meat) ×1 | workbench | {"cooking":3,"crafting":3} |
| brew_antiseptic | 소독약 (antiseptic) ×2 | 알코올 용액 (alcohol_solution) ×1、약초 (herb) ×1 |  | {"cooking":1} |
| practice_bandage | 연습용 붕대 (practice_bandage) ×1 | 천 조각 (cloth_scrap) ×1、약초 (herb) ×1 |  | {"medicine":1} |
| rad_blocker_craft | 방사선차단제 (rad_blocker) ×1 | 숯 (charcoal) ×2、약초 (herb) ×3、알코올 용액 (alcohol_solution) ×1 | medical_station | {"medicine":3,"crafting":2} |
| craft_reinforced_bandage | 강화 붕대 (reinforced_bandage) ×1 | 붕대 (bandage) ×2、알코올 용액 (alcohol_solution) ×1 | medical_station | {"medicine":2} |
| craft_field_antidote | 야전 해독제 (field_antidote) ×1 | 약초 (herb) ×3、숯 (charcoal) ×1 | medical_station | {"medicine":3} |
| craft_vitamin_complex | 비타민 복합제 (vitamin_complex) ×2 | 약초 (herb) ×4、야생 베리 (wild_berry) ×2 | medical_station | {"medicine":2} |
| craft_iv_saline | 생리식염수 IV (iv_saline) ×1 | 정수된 물 (purified_water) ×2、소금 (salt) ×2、플라스틱 (plastic) ×1 | medical_station | {"medicine":3} |
| craft_stabilizer_shot | 안정제 주사 (stabilizer_shot) ×1 | 진통제 (painkiller) ×1、알코올 용액 (alcohol_solution) ×1、붕대 (bandage) ×1 | medical_station | {"medicine":4} |
| craft_infection_serum | 감염 혈청 (infection_serum) ×1 | 항생제 (antibiotics) ×2、약초 (herb) ×4 | medical_station | {"medicine":5} |
| craft_rad_blocker_plus | 강화 방사선 차단제 (rad_blocker_plus) ×1 | 방사선차단제 (rad_blocker) ×1、숯 (charcoal) ×3、고철 (scrap_metal) ×1 | medical_station | {"medicine":4} |
| craft_painkiller_field | 야전 진통제 (painkiller_field) ×1 | 진통제 (painkiller) ×2、알코올 용액 (alcohol_solution) ×1 | medical_station | {"medicine":3} |
| craft_adrenaline_shot | 아드레날린 주사 (adrenaline_shot) ×1 | 각성제 (stimulant) ×2、약초 (herb) ×3 | medical_station | {"medicine":5} |
| craft_herbal_tonic | 약초 강장제 (herbal_tonic) ×1 | 약초 (herb) ×4、정수된 물 (purified_water) ×1 | medical_station | {"medicine":2} |
| grind_herb_medical | 약초 가루 (herb_powder) ×3 | 약초 (herb) ×2 | medical_station | {"medicine":3} |
| make_crude_medicine | 조제 약 (crude_medicine) ×1 | 약초 가루 (herb_powder) ×2、끓인 물 (boiled_water) ×1 |  | {"medicine":4} |
| make_scalpel | 수술용 메스 (scalpel) ×1 | 날카로운 날 (sharp_blade) ×1、철사 (wire) ×1 | workbench | {"medicine":4} |
| make_anesthetic | 마취제 (anesthetic) ×1 | 약초 가루 (herb_powder) ×3、알코올 용액 (alcohol_solution) ×1 | medical_station | {"medicine":5} |
| make_detox | 해독 물약 (detox_potion) ×1 | 약초 가루 (herb_powder) ×2、숯 (charcoal) ×1、정수된 물 (purified_water) ×1 |  | {"medicine":5} |
| brew_herbal_extract | 약초 추출액 (herbal_extract) ×2 | 약초 (herb) ×2、끓인 물 (boiled_water) ×1 | campfire | {"medicine":2} |
| concentrate_serum | 농축 혈청 (concentrated_serum) ×1 | 약초 추출액 (herbal_extract) ×2、알코올 용액 (alcohol_solution) ×1 | medical_station | {"medicine":4} |
| synth_broad_antibiotic | 광범위 항생제 (broad_antibiotic) ×1 | 농축 혈청 (concentrated_serum) ×1、항생제 (antibiotics) ×1 | workbench | {"medicine":6} |
| make_sterile_kit | 멸균 키트 (sterile_kit) ×1 | 수술용 메스 (scalpel) ×1、거즈 (gauze) ×2、소독약 (antiseptic) ×1 |  | {"medicine":6} |
| purify_medicine | 정제 약 (purified_medicine) ×1 | 조제 약 (crude_medicine) ×2、숯 (charcoal) ×1、증류수 (distilled_water) ×1 | workbench | {"medicine":7} |
| vaccine | 백신 (vaccine) ×1 | 바이러스 샘플 (virus_sample) ×1、항생제 (antibiotics) ×3、소독약 (antiseptic) ×2、정수된 물 (purified_water) ×2 | workbench, medical_station | {"crafting":5,"medicine":6} |
| advanced_trauma_kit | 고급 외상 키트 (advanced_trauma_kit) ×1 | 구급키트 (first_aid_kit) ×1、항생제 (antibiotics) ×1、소독약 (antiseptic) ×2、거즈 (gauze) ×5 | medical_station | {"crafting":4,"medicine":6} |
| combat_stimulant | 전투 자극제 (combat_stimulant) ×1 | 활력 강장제 (stamina_tonic) ×2、알코올 용액 (alcohol_solution) ×1、진통제 (painkiller) ×1、거즈 (gauze) ×1 | campfire | {"crafting":4,"medicine":3} |
| field_transfusion_kit | 야전 수혈 키트 (field_transfusion_kit) ×1 | 구급키트 (first_aid_kit) ×1、거즈 (gauze) ×3、정수된 물 (purified_water) ×1、고무 (rubber) ×1 | medical_station | {"crafting":3,"medicine":5} |
| enhanced_antiviral | 완성형 항바이러스 (completed_antiviral) ×1 | 변이 조제법 (mutant_formula) ×1、항생제 (antibiotics) ×2、소독약 (antiseptic) ×2、정수된 물 (purified_water) ×1 | medical_station | {"crafting":5,"medicine":5} |
| immunity_serum | 면역 혈청 (immunity_serum) ×1 | 제로 변이주 (zero_strain) ×1、항생제 (antibiotics) ×2、비타민 (vitamins) ×3 | medical_station | {"crafting":6,"medicine":6} |
| synthesize_antibiotics | 합성 항생제 (synthetic_antibiotics) ×1 | 정제 약 (purified_medicine) ×2、증류수 (distilled_water) ×1、약초 가루 (herb_powder) ×3 | workbench | {"medicine":10} |
| make_surgical_anesthetic | 수술용 마취제 (surgical_anesthetic) ×1 | 마취제 (anesthetic) ×2、증류수 (distilled_water) ×1 | workbench | {"medicine":8} |
| synth_plague_vaccine | 역병 백신 (plague_vaccine) ×1 | 감염 혈액 표본 (infected_blood_sample) ×1、알코올 용액 (alcohol_solution) ×1、광범위 항생제 (broad_antibiotic) ×1、농축 혈청 (concentrated_serum) ×2、정수된 물 (purified_water) ×1 | workbench | {"medicine":12} |
| brew_universal_cure | 만병통치약 (universal_cure) ×1 | 합성 항생제 (synthetic_antibiotics) ×2、정제 약 (purified_medicine) ×1、멸균수 (sterile_water) ×1 | workbench | {"medicine":15} |
| queen_pheromone | 여왕 페로몬 (queen_pheromone) ×1 | 무리 지배자의 관 (horde_crown) ×1、알코올 용액 (alcohol_solution) ×1、빈병 (empty_bottle) ×1 | chemistry_bench | {"medicine":5} |
| surgical_grade_kit | 외과전문 수술키트 (surgical_grade_kit) ×1 | 군의관 배지 (doctor_badge) ×1、수술키트 (surgery_kit) ×1、소독약 (antiseptic) ×2、거즈 (gauze) ×2 | medical_station | {"medicine":7} |

## 직업별 퀘스트 목표 분포

| 직업 | 퀘스트 수 | 목표 유형 |
|---|---|---|
| doctor | 35 | {"treat_npc":6,"npc_quest_complete":1,"collect_item_type":1,"collect_item":3,"craft_item":3,"visit_district":4,"visit_landmark":1,"survive_infection":1,"trigger_combo":1,"track_infected":2,"career_project":10,"discover_location":2} |
| soldier | 30 | {"collect_item":8,"craft_item":1,"collect_item_type":3,"career_project":11,"visit_district":2,"rescue_npc":3,"discover_location":2} |
| firefighter | 24 | {"collect_item_type":6,"career_project":12,"collect_item":2,"visit_district":3,"discover_location":1} |
| chef | 41 | {"collect_item_type":7,"craft_item":3,"collect_item":7,"career_project":16,"visit_district":4,"track_infected":2,"discover_location":2} |
| engineer | 47 | {"collect_item":16,"career_project":16,"visit_district":7,"craft_item":2,"rescue_npc":3,"discover_location":3} |
| homeless | 30 | {"collect_item_type":6,"craft_item":3,"career_project":14,"visit_landmark":1,"npc_trade":1,"treat_npc":1,"visit_district":2,"discover_location":2} |

## 랜드마크·세부장소 드랍 전체

> 구 탐색도와 별도 경로. 랜드마크 로비와 세부장소의 재고 처리는 서로 다르다.

| 장소 키 | 계층 | 드랍 (가중치) |
|---|---|---|
| jongno | 랜드마크 | 목재 (wood):30、천 (cloth):25、부싯돌 (firestone):15、약초 (herb):20 |
| jongno_gwanghwamun | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):3、못 (nail):3、권총 탄약 (pistol_ammo):3 |
| sl_jongno_royal_vault | 세부장소 | 천 (cloth):4、지도 조각 (map_fragment):2、소독약 (antiseptic):3 |
| jongno_geunjeongjeon | 세부장소 | 붕대 (bandage):3、목재 (wood):4、로프 (rope):2、진통제 (painkiller):1 |
| jongno_gyeonghoeru | 세부장소 | 오염수 (contaminated_water):3、정수된 물 (purified_water):1、로프 (rope):2、목재 (wood):2 |
| jongno_storage | 세부장소 | 철사 (wire):3、전자부품 (electronic_parts):2、손전등 (flashlight):2、방사선차단제 (rad_blocker):2 |
| jongno_folklore | 세부장소 | 소독약 (antiseptic):2、붕대 (bandage):3、천 (cloth):3、가죽 (leather):1 |
| junggoo | 랜드마크 | 천 (cloth):35、통조림 (canned_food):20、가죽 (leather):15、빈병 (empty_bottle):20 |
| junggu_market_gate | 세부장소 | 천 (cloth):35、빈병 (empty_bottle):25、통조림 (canned_food):20 |
| sl_junggoo_cold_storage | 세부장소 | 해독제 (antidote):5、항생제 (antibiotics):5、방사선차단제 (rad_blocker):4、수술키트 (surgery_kit):4 |
| sl_junggoo_hotel_pantry | 세부장소 | 약초 (herb):6、소금 (salt):6、비타민 (vitamins):4、알코올 용액 (alcohol_solution):4 |
| sl_junggoo_city_hall_safe | 세부장소 | 생존자 메모 (survivor_note):6、지도 조각 (map_fragment):5、비상키트 (emergency_kit):3 |
| junggu_food | 세부장소 | 통조림 (canned_food):5、건육 (dried_meat):4、정수된 물 (purified_water):2、진통제 (painkiller):1 |
| junggu_clothing | 세부장소 | 천 (cloth):5、가죽 (leather):2、로프 (rope):2、작업장갑 (work_gloves):1 |
| junggu_electronics | 세부장소 | 전자부품 (electronic_parts):4、철사 (wire):3、손전등 (flashlight):2、플라스틱 (plastic):2 |
| junggu_underground | 세부장소 | 고철 (scrap_metal):3、플라스틱 (plastic):3、로프 (rope):2、쇠지렛대 (crowbar):1 |
| junggu_subway | 세부장소 | 쇠지렛대 (crowbar):3、손전등 (flashlight):3、철파이프 (iron_pipe):3、고철 (scrap_metal):2 |
| yongsan | 랜드마크 | 고철 (scrap_metal):30、탄피 (빈) (empty_cartridge):18、덕테이프 (duct_tape):20、케블라 직물 (kevlar_fabric):6 |
| yongsan_front_gate | 세부장소 | 고철 (scrap_metal):35、천 (cloth):25、덕테이프 (duct_tape):20 |
| sl_yongsan_armory | 세부장소 | 권총 탄약 (pistol_ammo):6、산탄 실탄 (shotgun_ammo):4、군용 식량 (military_ration):4、섬광탄 (flashbang):3 |
| yongsan_outdoor | 세부장소 | 고철 (scrap_metal):5、철파이프 (iron_pipe):2、철사 (wire):2、못 (nail):3 |
| yongsan_history | 세부장소 | 붕대 (bandage):4、진통제 (painkiller):2、소독약 (antiseptic):2、천 (cloth):2 |
| yongsan_weapons | 세부장소 | 칼 (knife):2、야구배트 (baseball_bat):2、철파이프 (iron_pipe):3、쇠지렛대 (crowbar):1 |
| yongsan_bunker | 세부장소 | 구급키트 (first_aid_kit):3、붕대 (bandage):3、통조림 (canned_food):3、전술조끼 (tactical_vest):2 |
| yongsan_arsenal | 세부장소 | 마체테 (machete):3、칼 (knife):3、권총 탄약 (pistol_ammo):3、화염병 (molotov_cocktail):2 |
| seongdong | 랜드마크 | 고철 (scrap_metal):35、철사 (wire):25、못 (nail):25、정제 금속판 (refined_metal):12 |
| seongdong_gateway | 세부장소 | 고철 (scrap_metal):35、못 (nail):25、철사 (wire):22 |
| sl_seongdong_master_workshop | 세부장소 | 고철 (scrap_metal):5、파이프렌치 (pipe_wrench):4、덕테이프 (duct_tape):5、스프링 (spring):4 |
| sl_seongdong_bridge_shelter | 세부장소 | 고철 (scrap_metal):7、천 (cloth):6、빈병 (empty_bottle):6、로프 (rope):4 |
| seongdong_metal | 세부장소 | 고철 (scrap_metal):5、못 (nail):4、철사 (wire):3、철파이프 (iron_pipe):2 |
| seongdong_leather | 세부장소 | 가죽 (leather):5、천 (cloth):3、작업장갑 (work_gloves):2、로프 (rope):2 |
| seongdong_chemical | 세부장소 | 소독약 (antiseptic):3、방사선차단제 (rad_blocker):1、고무 (rubber):3、플라스틱 (plastic):3 |
| seongdong_warehouse | 세부장소 | 목재 (wood):3、로프 (rope):3、플라스틱 (plastic):3、고철 (scrap_metal):3 |
| seongdong_workshop | 세부장소 | 숫돌 (whetstone):15、못 (nail):4、철사 (wire):3、덕테이프 (duct_tape):2 |
| gwangjin | 랜드마크 | 야생 베리 (wild_berry):25、약초 (herb):25、목재 (wood):25、로프 (rope):20 |
| gwangjin_gate | 세부장소 | 야구배트 (baseball_bat):2、손전등 (flashlight):2、붕대 (bandage):3、고철 (scrap_metal):2 |
| sl_gwangjin_zoo_lab | 세부장소 | 소독약 (antiseptic):4、생가죽 (hide):5、뼈 (bone):5 |
| gwangjin_zoo | 세부장소 | 로프 (rope):4、가죽 (leather):3、붕대 (bandage):2、죽순 (bamboo_shoot):18 |
| gwangjin_botanical | 세부장소 | 비타민 (vitamins):5、소독약 (antiseptic):2、정수된 물 (purified_water):2、산딸기 (wild_strawberry):22 |
| gwangjin_kiosk | 세부장소 | 통조림 (canned_food):4、진통제 (painkiller):2、붕대 (bandage):2、정수된 물 (purified_water):2 |
| gwangjin_rides | 세부장소 | 고철 (scrap_metal):4、플라스틱 (plastic):3、철사 (wire):2、고무 (rubber):2 |
| dongdaemun | 랜드마크 | 붕대 (bandage):30、소독약 (antiseptic):22、진통제 (painkiller):15、알코올 용액 (alcohol_solution):12 |
| dongdaemun_lobby | 세부장소 | 붕대 (bandage):30、천 (cloth):28、플라스틱 (plastic):22 |
| sl_dongdaemun_workshop | 세부장소 | 천 (cloth):6、실 (thread):6、큰 천 (large_cloth):3 |
| dongdaemun_er | 세부장소 | 붕대 (bandage):5、구급키트 (first_aid_kit):2、소독약 (antiseptic):3、진통제 (painkiller):2 |
| dongdaemun_pharmacy | 세부장소 | 항생제 (antibiotics):3、진통제 (painkiller):4、방사선차단제 (rad_blocker):1、소독약 (antiseptic):3 |
| dongdaemun_or | 세부장소 | 수술키트 (surgery_kit):1、소독약 (antiseptic):3、붕대 (bandage):3、부목 (splint):2 |
| dongdaemun_icu | 세부장소 | 각성제 (stimulant):2、구급키트 (first_aid_kit):2、항생제 (antibiotics):2、붕대 (bandage):3 |
| dongdaemun_records | 세부장소 | 항생제 (antibiotics):3、진통제 (painkiller):3、각성제 (stimulant):2、소독약 (antiseptic):2 |
| dongdaemun_basement | 세부장소 | 고철 (scrap_metal):3、덕테이프 (duct_tape):3、손전등 (flashlight):2、파이프렌치 (pipe_wrench):2 |
| jungrang | 랜드마크 | 고철 (scrap_metal):30、플라스틱 (plastic):25、스프링 (spring):15、천 (cloth):25 |
| jungnang_ticket | 세부장소 | 진통제 (painkiller):2、붕대 (bandage):3、손전등 (flashlight):2、플라스틱 (plastic):2 |
| sl_jungrang_water_control | 세부장소 | 정수된 물 (purified_water):8、정수 필터 (water_filter):5、전자부품 (electronic_parts):4 |
| jungnang_ferris | 세부장소 | 고철 (scrap_metal):5、철사 (wire):3、고무 (rubber):2、철파이프 (iron_pipe):2 |
| jungnang_ride_storage | 세부장소 | 전자부품 (electronic_parts):3、고무 (rubber):3、고철 (scrap_metal):3、플라스틱 (plastic):2 |
| jungnang_control | 세부장소 | 손전등 (flashlight):2、철사 (wire):4、전자부품 (electronic_parts):3、플라스틱 (plastic):2 |
| jungnang_boiler | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):3、고무 (rubber):2、철사 (wire):2 |
| seongbuk | 랜드마크 | 유리파편 (glass_shard):28、플라스틱 (plastic):25、실 (thread):20、알코올 용액 (alcohol_solution):12 |
| seongbuk_main_gate | 세부장소 | 천 (cloth):30、플라스틱 (plastic):25、실 (thread):20 |
| sl_seongbuk_research_bunker | 세부장소 | 항생제 (antibiotics):4、소독약 (antiseptic):5、전자부품 (electronic_parts):4 |
| seongbuk_medschool | 세부장소 | 구급키트 (first_aid_kit):2、소독약 (antiseptic):3、수술키트 (surgery_kit):1、항생제 (antibiotics):2 |
| seongbuk_sports | 세부장소 | 붕대 (bandage):4、로프 (rope):3、가죽 (leather):2、작업장갑 (work_gloves):2 |
| seongbuk_law | 세부장소 | 진통제 (painkiller):3、붕대 (bandage):2、통조림 (canned_food):2、손전등 (flashlight):2 |
| seongbuk_dorm | 세부장소 | 통조림 (canned_food):3、붕대 (bandage):2、천 (cloth):3、정수된 물 (purified_water):2 |
| seongbuk_cafeteria | 세부장소 | 통조림 (canned_food):5、정수된 물 (purified_water):3、칼 (knife):2、비타민 (vitamins):2 |
| gangbuk | 랜드마크 | 목재 (wood):30、약초 (herb):25、생가죽 (hide):15、부싯돌 (firestone):15 |
| gangbuk_gate | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):3、못 (nail):3、목재 (wood):2 |
| sl_gangbuk_hidden_spring | 세부장소 | 정수된 물 (purified_water):8、산물 (mountain_water):6 |
| gangbuk_beacon | 세부장소 | 목재 (wood):5、로프 (rope):3、잣 (pine_nut):20、약초 (herb):2 |
| gangbuk_barracks | 세부장소 | 통조림 (canned_food):4、칼 (knife):3、붕대 (bandage):3、야생 뿌리 (wild_root):20 |
| gangbuk_well | 세부장소 | 오염수 (contaminated_water):3、정수된 물 (purified_water):2、비타민 (vitamins):2 |
| gangbuk_arsenal | 세부장소 | 마체테 (machete):1、철파이프 (iron_pipe):3、못 (nail):4、고철 (scrap_metal):3 |
| dobong | 랜드마크 | 목재 (wood):30、약초 (herb):25、식용 버섯 (mushroom_edible):20、야생 베리 (wild_berry):20 |
| dobong_entrance | 세부장소 | 목재 (wood):5、로프 (rope):3、비타민 (vitamins):3、붕대 (bandage):1 |
| sl_dobong_hermit_cave | 세부장소 | 약초 (herb):6、허브차 (herbal_tea):4、천 (cloth):3 |
| dobong_lodge | 세부장소 | 붕대 (bandage):3、통조림 (canned_food):3、밤 (chestnut):22、진통제 (painkiller):2 |
| dobong_shelter | 세부장소 | 머루 (wild_grape):20、진통제 (painkiller):3、부목 (splint):2、붕대 (bandage):3 |
| dobong_valley | 세부장소 | 정수된 물 (purified_water):4、비타민 (vitamins):4、오염수 (contaminated_water):1、도토리 (acorn):22 |
| dobong_cliff | 세부장소 | 로프 (rope):4、가죽 (leather):2、붕대 (bandage):2、솔방울 (pine_cone):22 |
| nowon | 랜드마크 | 천 (cloth):30、통조림 (canned_food):22、덕테이프 (duct_tape):18、로프 (rope):20 |
| nowon_main_gate | 세부장소 | 천 (cloth):30、통조림 (canned_food):22、로프 (rope):20 |
| sl_nowon_hidden_depot | 세부장소 | 통조림 (canned_food):5、정수 물병 (water_bottle):5、붕대 (bandage):4 |
| nowon_gym | 세부장소 | 붕대 (bandage):4、가죽 (leather):3、로프 (rope):3、작업장갑 (work_gloves):2 |
| nowon_pool | 세부장소 | 오염수 (contaminated_water):3、정수된 물 (purified_water):2、로프 (rope):2、플라스틱 (plastic):2 |
| nowon_dorm | 세부장소 | 통조림 (canned_food):4、천 (cloth):3、붕대 (bandage):2、정수된 물 (purified_water):2 |
| nowon_medical | 세부장소 | 붕대 (bandage):4、소독약 (antiseptic):3、부목 (splint):3、구급키트 (first_aid_kit):2 |
| nowon_cafeteria | 세부장소 | 통조림 (canned_food):5、비타민 (vitamins):4、건육 (dried_meat):3、정수된 물 (purified_water):3 |
| nowon_field | 세부장소 | 로프 (rope):4、고철 (scrap_metal):3、붕대 (bandage):2 |
| eunpyeong | 랜드마크 | 약초 (herb):35、목재 (wood):25、천 (cloth):20、민들레 (dandelion):15 |
| eunpyeong_iljumun | 세부장소 | 약초 (herb):35、목재 (wood):25、천 (cloth):20 |
| sl_eunpyeong_fire_station | 세부장소 | 로프 (rope):7、철사 (wire):6、고철 (scrap_metal):6、붕대 (bandage):4 |
| eunpyeong_main_hall | 세부장소 | 천 (cloth):4、약초 (herb):3、로프 (rope):2、라이터 (lighter):1 |
| eunpyeong_storage | 세부장소 | 통조림 (canned_food):3、정수된 물 (purified_water):3、목재 (wood):3、야생 사과 (apple_wild):20 |
| eunpyeong_quarters | 세부장소 | 붕대 (bandage):3、진통제 (painkiller):2、천 (cloth):3、정수된 물 (purified_water):2 |
| eunpyeong_dining | 세부장소 | 통조림 (canned_food):4、건육 (dried_meat):3、정수된 물 (purified_water):3、채소 (vegetable):20 |
| eunpyeong_herb | 세부장소 | 비타민 (vitamins):7、소독약 (antiseptic):3、해독제 (antidote):3、솔잎 (pine_needle):25 |
| seodaemun | 랜드마크 | 붕대 (bandage):30、소독약 (antiseptic):22、진통제 (painkiller):15、유리파편 (glass_shard):20 |
| seodaemun_lobby | 세부장소 | 붕대 (bandage):30、유리파편 (glass_shard):25、천 (cloth):22 |
| sl_seodaemun_p4_lab | 세부장소 | 항생제 (antibiotics):5、방사선차단제 (rad_blocker):4、구급키트 (first_aid_kit):5、소독약 (antiseptic):5 |
| seodaemun_er | 세부장소 | 붕대 (bandage):5、구급키트 (first_aid_kit):2、소독약 (antiseptic):4、진통제 (painkiller):2 |
| seodaemun_pharmacy | 세부장소 | 항생제 (antibiotics):3、진통제 (painkiller):3、각성제 (stimulant):2、방사선차단제 (rad_blocker):1 |
| seodaemun_or | 세부장소 | 수술키트 (surgery_kit):2、소독약 (antiseptic):4、부목 (splint):2、붕대 (bandage):3 |
| seodaemun_lab | 세부장소 | 방사선차단제 (rad_blocker):2、해독제 (antidote):2、소독약 (antiseptic):3、항생제 (antibiotics):2 |
| seodaemun_morgue | 세부장소 | 붕대 (bandage):3、소독약 (antiseptic):3、해독제 (antidote):1、부목 (splint):2 |
| seodaemun_basement | 세부장소 | 손전등 (flashlight):3、덕테이프 (duct_tape):3、붕대 (bandage):3、철사 (wire):2 |
| mapo | 랜드마크 | 빈병 (empty_bottle):30、천 (cloth):25、플라스틱 (plastic):22、배터리 (battery):8 |
| mapo_street_entry | 세부장소 | 빈병 (empty_bottle):35、천 (cloth):25、플라스틱 (plastic):22 |
| sl_mapo_club_basement | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):5、천 (cloth):4 |
| mapo_club | 세부장소 | 각성제 (stimulant):2、진통제 (painkiller):3、붕대 (bandage):2、플라스틱 (plastic):2 |
| mapo_convenience | 세부장소 | 통조림 (canned_food):5、정수된 물 (purified_water):4、성냥개비 (matches):18、붕대 (bandage):3 |
| mapo_underground | 세부장소 | 고철 (scrap_metal):3、철사 (wire):3、플라스틱 (plastic):3、로프 (rope):2 |
| mapo_parking | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):2、쇠지렛대 (crowbar):2、고무 (rubber):2 |
| mapo_cafe | 세부장소 | 통조림 (canned_food):3、정수된 물 (purified_water):3、붕대 (bandage):2、진통제 (painkiller):1 |
| yangcheon | 랜드마크 | 천 (cloth):30、플라스틱 (plastic):25、로프 (rope):20、통조림 (canned_food):20 |
| yangcheon_ticket_gate | 세부장소 | 천 (cloth):30、플라스틱 (plastic):25、로프 (rope):20 |
| sl_yangcheon_civil_shelter | 세부장소 | 통조림 (canned_food):8、정수 물병 (water_bottle):7、붕대 (bandage):5 |
| yangcheon_stands | 세부장소 | 고철 (scrap_metal):4、야구배트 (baseball_bat):1、플라스틱 (plastic):3、로프 (rope):2 |
| yangcheon_locker | 세부장소 | 붕대 (bandage):4、진통제 (painkiller):3、작업장갑 (work_gloves):2、소독약 (antiseptic):2 |
| yangcheon_mechanical | 세부장소 | 고철 (scrap_metal):4、철사 (wire):3、전자부품 (electronic_parts):2、고무 (rubber):2 |
| yangcheon_concession | 세부장소 | 통조림 (canned_food):4、진통제 (painkiller):2、정수된 물 (purified_water):3、붕대 (bandage):1 |
| yangcheon_parking | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):3、고무 (rubber):2、철사 (wire):2 |
| gangseo | 랜드마크 | 고철 (scrap_metal):30、덕테이프 (duct_tape):22、철사 (wire):22、황동 조각 (brass_fragment):10 |
| gangseo_terminal_entry | 세부장소 | 고철 (scrap_metal):30、덕테이프 (duct_tape):25、천 (cloth):22 |
| sl_gangseo_hangar | 세부장소 | 고철 (scrap_metal):6、전자부품 (electronic_parts):5、로프 (rope):4、연료통 (fuel_can):3 |
| gangseo_departure | 세부장소 | 통조림 (canned_food):3、붕대 (bandage):3、손전등 (flashlight):2、진통제 (painkiller):2 |
| gangseo_cargo | 세부장소 | 고철 (scrap_metal):3、플라스틱 (plastic):3、고무 (rubber):2、로프 (rope):3 |
| gangseo_hangar | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、고철 (scrap_metal):4、덕테이프 (duct_tape):3 |
| gangseo_dutyfree | 세부장소 | 진통제 (painkiller):3、소독약 (antiseptic):3、비타민 (vitamins):3、각성제 (stimulant):2 |
| gangseo_tower | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、손전등 (flashlight):2 |
| gangseo_fuel | 세부장소 | 고무 (rubber):3、플라스틱 (plastic):3、화염병 (molotov_cocktail):4、철사 (wire):2 |
| guro | 랜드마크 | 전자부품 (electronic_parts):30、철사 (wire):25、플라스틱 (plastic):22、구리 코일 (copper_coil):10 |
| guro_complex_entry | 세부장소 | 전자부품 (electronic_parts):28、철사 (wire):25、플라스틱 (plastic):25 |
| sl_guro_secret_forge | 세부장소 | 고철 (scrap_metal):6、숯 (charcoal):5、날카로운 날 (sharp_blade):3 |
| guro_office | 세부장소 | 전자부품 (electronic_parts):4、철사 (wire):3、플라스틱 (plastic):2、손전등 (flashlight):1 |
| guro_server | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、손전등 (flashlight):2 |
| guro_warehouse | 세부장소 | 고철 (scrap_metal):3、플라스틱 (plastic):4、로프 (rope):2、철사 (wire):2 |
| guro_parts_store | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、못 (nail):2、플라스틱 (plastic):2 |
| guro_parking | 세부장소 | 고철 (scrap_metal):4、쇠지렛대 (crowbar):2、고무 (rubber):3、철파이프 (iron_pipe):2 |
| geumcheon | 랜드마크 | 고철 (scrap_metal):35、못 (nail):25、스프링 (spring):15、정제 금속판 (refined_metal):12 |
| geumcheon_front_gate | 세부장소 | 고철 (scrap_metal):35、못 (nail):25、철사 (wire):22 |
| sl_geumcheon_secret_factory | 세부장소 | 권총 탄약 (pistol_ammo):7、화약 (gunpowder):5、고철 (scrap_metal):6 |
| geumcheon_metal | 세부장소 | 고철 (scrap_metal):5、못 (nail):4、철파이프 (iron_pipe):3、철사 (wire):2 |
| geumcheon_chemical | 세부장소 | 고무 (rubber):3、플라스틱 (plastic):3、소독약 (antiseptic):2、방사선차단제 (rad_blocker):1 |
| geumcheon_warehouse_complex | 세부장소 | 고철 (scrap_metal):4、목재 (wood):3、로프 (rope):3、플라스틱 (plastic):2 |
| geumcheon_waste | 세부장소 | 고무 (rubber):4、플라스틱 (plastic):3、오염수 (contaminated_water):3、고철 (scrap_metal):2 |
| geumcheon_power | 세부장소 | 철사 (wire):5、전자부품 (electronic_parts):3、고철 (scrap_metal):3、고무 (rubber):2 |
| yeongdeungpo | 랜드마크 | 천 (cloth):30、통조림 (canned_food):22、플라스틱 (plastic):22、빈캔 (empty_can):20 |
| yeongdeungpo_mall_gate | 세부장소 | 천 (cloth):30、통조림 (canned_food):22、빈캔 (empty_can):22 |
| yeongdeungpo_food | 세부장소 | 통조림 (canned_food):6、건육 (dried_meat):3、진통제 (painkiller):2、정수된 물 (purified_water):3 |
| yeongdeungpo_clothing | 세부장소 | 천 (cloth):5、가죽 (leather):2、작업장갑 (work_gloves):2、로프 (rope):2 |
| yeongdeungpo_electronics | 세부장소 | 전자부품 (electronic_parts):4、철사 (wire):3、손전등 (flashlight):2、플라스틱 (plastic):2 |
| yeongdeungpo_rooftop | 세부장소 | 비타민 (vitamins):3、정수된 물 (purified_water):3、약초 (herb):2、허브차 (herbal_tea):2 |
| yeongdeungpo_storage | 세부장소 | 고철 (scrap_metal):3、로프 (rope):3、플라스틱 (plastic):3、덕테이프 (duct_tape):2 |
| yeongdeungpo_parking_tower | 세부장소 | 고철 (scrap_metal):4、쇠지렛대 (crowbar):2、철파이프 (iron_pipe):3、고무 (rubber):2 |
| lm_kbs | 랜드마크 | 전자부품 (electronic_parts):30、구리 코일 (copper_coil):15、철사 (wire):25、배터리 (battery):10 |
| sl_kbs_lobby | 세부장소 | 천 (cloth):6、배터리 (battery):5、손전등 (flashlight):3 |
| sl_yeongdeungpo_kbs_studio | 세부장소 | 전자부품 (electronic_parts):6、철사 (wire):5、무전기 (radio):3、손전등 (flashlight):4 |
| sl_kbs_newsroom | 세부장소 | 생존자 메모 (survivor_note):6、전자부품 (electronic_parts):4、장작 (kindling):4 |
| sl_kbs_antenna | 세부장소 | 철사 (wire):7、고철 (scrap_metal):5、구리선 (copper_wire):3 |
| lm_63_building | 랜드마크 | 유리파편 (glass_shard):30、천 (cloth):25、고철 (scrap_metal):25、배터리 (battery):8 |
| sl_63_lobby | 세부장소 | 천 (cloth):5、플라스틱 (plastic):4、유리파편 (glass_shard):4、통조림 (canned_food):3 |
| sl_63_observatory | 세부장소 | 쌍안경 (binoculars):4、전자부품 (electronic_parts):4、유리파편 (glass_shard):5 |
| sl_63_helipad | 세부장소 | 배터리 (battery):4、전자부품 (electronic_parts):4、철사 (wire):5 |
| lm_boramae_hospital | 랜드마크 | 붕대 (bandage):30、소독약 (antiseptic):22、진통제 (painkiller):15、알코올 용액 (alcohol_solution):12 |
| boramae_desk | 세부장소 | 소독약 (antiseptic):3、거즈 (gauze):1 |
| boramae_emergency | 세부장소 | 붕대 (bandage):6、알코올 솜 (alcohol_swab):4、천 (cloth):3、진통제 (painkiller):3 |
| boramae_surgery | 세부장소 | 수술용 메스 (scalpel):3、소독약 (antiseptic):3、메스 (combat_scalpel):6、구급키트 (first_aid_kit):2 |
| boramae_pharmacy | 세부장소 | 항생제 (antibiotics):4、진통제 (painkiller):4、비타민 (vitamins):3、각성제 (stimulant):2 |
| boramae_morgue | 세부장소 | 오염수 (contaminated_water):4、거적대기 (tattered_rags):4、생리식염수 IV (iv_saline):2、강화 붕대 (reinforced_bandage):2 |
| boramae_rooftop | 세부장소 | 약초 (herb):6、허브차 (herbal_tea):2、말라비틀어진 나무 (withered_tree):3、천 (cloth):2 |
| boramae_cafeteria | 세부장소 | 통조림 (canned_food):30、쌀 (rice):25、라면 (건조) (instant_noodles):20、정수 물병 (water_bottle):15 |
| lm_dongjak | 랜드마크 | 천 (cloth):28、목재 (wood):25、약초 (herb):22、탄피 (빈) (empty_cartridge):12 |
| dongjak_hyeonchungmun | 세부장소 | 천 (cloth):28、목재 (wood):25、약초 (herb):22 |
| dongjak_memorial | 세부장소 | 붕대 (bandage):3、진통제 (painkiller):2、천 (cloth):2、로프 (rope):1 |
| dongjak_hall | 세부장소 | 붕대 (bandage):4、소독약 (antiseptic):2、구급키트 (first_aid_kit):2、진통제 (painkiller):2 |
| dongjak_storage | 세부장소 | 고철 (scrap_metal):3、목재 (wood):4、못 (nail):3、파이프렌치 (pipe_wrench):1 |
| dongjak_office | 세부장소 | 파이프렌치 (pipe_wrench):2、손전등 (flashlight):2、붕대 (bandage):2、진통제 (painkiller):2 |
| dongjak_forest | 세부장소 | 비타민 (vitamins):4、로프 (rope):3、목재 (wood):4、정수된 물 (purified_water):1 |
| dongjak_bunker | 세부장소 | 권총 탄약 (pistol_ammo):4、군용 식량 (military_ration):4、붕대 (bandage):4、무전기 (radio):2 |
| gwanak | 랜드마크 | 유리파편 (glass_shard):28、플라스틱 (plastic):25、알코올 용액 (alcohol_solution):15、숯 필터 (charcoal_filter):10 |
| gwanak_main_plaza | 세부장소 | 유리파편 (glass_shard):28、플라스틱 (plastic):25、천 (cloth):22 |
| sl_gwanak_reactor | 세부장소 | 전자부품 (electronic_parts):6、방사선차단제 (rad_blocker):4、고철 (scrap_metal):5、철사 (wire):4 |
| gwanak_medschool | 세부장소 | 구급키트 (first_aid_kit):2、소독약 (antiseptic):3、수술키트 (surgery_kit):1、항생제 (antibiotics):2 |
| gwanak_chemlab | 세부장소 | 방사선차단제 (rad_blocker):2、해독제 (antidote):2、소독약 (antiseptic):4、플라스틱 (plastic):2 |
| gwanak_eng_storage | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、고철 (scrap_metal):3、못 (nail):2 |
| gwanak_dorm | 세부장소 | 통조림 (canned_food):4、붕대 (bandage):3、천 (cloth):3、정수된 물 (purified_water):2 |
| gwanak_lib_basement | 세부장소 | 손전등 (flashlight):3、전자부품 (electronic_parts):2、붕대 (bandage):2、진통제 (painkiller):2 |
| gwanak_main_lib | 세부장소 | 진통제 (painkiller):3、붕대 (bandage):3、손전등 (flashlight):2、소독약 (antiseptic):1 |
| seocho | 랜드마크 | 천 (cloth):30、큰 천 (large_cloth):12、실 (thread):22、플라스틱 (plastic):25 |
| seocho_plaza | 세부장소 | 천 (cloth):30、플라스틱 (plastic):25、실 (thread):20 |
| sl_seocho_evidence_vault | 세부장소 | 권총 탄약 (pistol_ammo):6、자물쇠따개 (lockpick):4、생존자 메모 (survivor_note):4 |
| seocho_opera | 세부장소 | 천 (cloth):4、가죽 (leather):2、로프 (rope):3、붕대 (bandage):1 |
| seocho_backstage | 세부장소 | 로프 (rope):4、목재 (wood):3、고철 (scrap_metal):3、철사 (wire):2 |
| seocho_dressing | 세부장소 | 소독약 (antiseptic):3、진통제 (painkiller):2、천 (cloth):3、붕대 (bandage):2 |
| seocho_gallery | 세부장소 | 손전등 (flashlight):2、붕대 (bandage):2、진통제 (painkiller):2、천 (cloth):3 |
| seocho_basement | 세부장소 | 고철 (scrap_metal):4、철사 (wire):3、플라스틱 (plastic):3、로프 (rope):2 |
| gangnam | 랜드마크 | 붕대 (bandage):30、소독약 (antiseptic):22、진통제 (painkiller):15、유리파편 (glass_shard):20 |
| gangnam_front_gate | 세부장소 | 붕대 (bandage):30、유리파편 (glass_shard):25、천 (cloth):22 |
| sl_gangnam_sealed_pharmacy | 세부장소 | 구급키트 (first_aid_kit):5、항생제 (antibiotics):4、수술키트 (surgery_kit):3、진통제 (painkiller):5 |
| gangnam_er | 세부장소 | 붕대 (bandage):5、구급키트 (first_aid_kit):3、소독약 (antiseptic):4、진통제 (painkiller):3 |
| gangnam_pharmacy | 세부장소 | 항생제 (antibiotics):4、진통제 (painkiller):3、각성제 (stimulant):2、방사선차단제 (rad_blocker):2 |
| gangnam_or | 세부장소 | 수술키트 (surgery_kit):3、소독약 (antiseptic):4、부목 (splint):2、붕대 (bandage):3 |
| gangnam_lab | 세부장소 | 해독제 (antidote):2、방사선차단제 (rad_blocker):2、항생제 (antibiotics):3、소독약 (antiseptic):3 |
| gangnam_morgue | 세부장소 | 소독약 (antiseptic):4、부목 (splint):2、해독제 (antidote):2、붕대 (bandage):3 |
| gangnam_vip | 세부장소 | 구급키트 (first_aid_kit):4、각성제 (stimulant):3、항생제 (antibiotics):3、수술키트 (surgery_kit):2 |
| songpa | 랜드마크 | 유리파편 (glass_shard):28、고철 (scrap_metal):25、천 (cloth):25、배터리 (battery):8 |
| songpa_lobby | 세부장소 | 붕대 (bandage):3、손전등 (flashlight):2、고철 (scrap_metal):3、천 (cloth):2 |
| sl_songpa_survivor_fort | 세부장소 | 통조림 (canned_food):7、붕대 (bandage):6、배터리 (battery):4、로프 (rope):4 |
| sl_songpa_penthouse | 세부장소 | 군용 식량 (고급) (premium_ration):4、구급키트 (first_aid_kit):4、각성제 (stimulant):3 |
| songpa_mall_basement | 세부장소 | 통조림 (canned_food):6、건육 (dried_meat):3、진통제 (painkiller):3、붕대 (bandage):3 |
| songpa_hotel | 세부장소 | 정수된 물 (purified_water):3、붕대 (bandage):3、천 (cloth):2、진통제 (painkiller):3 |
| songpa_observatory | 세부장소 | 구급키트 (first_aid_kit):3、전자부품 (electronic_parts):3、전술조끼 (tactical_vest):2、권총 탄약 (pistol_ammo):2 |
| songpa_stairs | 세부장소 | 쇠지렛대 (crowbar):2、로프 (rope):3、고철 (scrap_metal):3、붕대 (bandage):2 |
| songpa_generator | 세부장소 | 철사 (wire):5、전자부품 (electronic_parts):5、고철 (scrap_metal):3、고무 (rubber):2 |
| gangdong | 랜드마크 | 부싯돌 (firestone):18、뼈 (bone):22、목재 (wood):28、약초 (herb):22 |
| gangdong_ticket_office | 세부장소 | 목재 (wood):30、뼈 (bone):22、약초 (herb):22 |
| sl_gangdong_secret_dock | 세부장소 | 로프 (rope):6、플라스틱 (plastic):5、연료통 (fuel_can):3 |
| gangdong_pithouses | 세부장소 | 목재 (wood):5、로프 (rope):3、천 (cloth):3、흙 주머니 (soil_bag):18 |
| gangdong_museum | 세부장소 | 붕대 (bandage):3、구급키트 (first_aid_kit):2、소독약 (antiseptic):2、손전등 (flashlight):2 |
| gangdong_artifact_storage | 세부장소 | 고철 (scrap_metal):3、가죽 (leather):3、목재 (wood):3、철사 (wire):2 |
| gangdong_riverside | 세부장소 | 정수된 물 (purified_water):3、오염수 (contaminated_water):3、모래 (sand):22、비타민 (vitamins):2 |
| gangdong_excavation | 세부장소 | 가죽 (leather):3、고철 (scrap_metal):3、날카로운 날 (sharp_blade):3、야생 밀 (wild_wheat):20 |
| hangang_gangnam | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_gangnam | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_gangnam | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_gangdong | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_gangdong | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_gangdong | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_gwangjin | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_gwangjin | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_gwangjin | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_mapo | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_mapo | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_mapo | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_seocho | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_seocho | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_seocho | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_seongdong | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_seongdong | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_seongdong | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_songpa | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_songpa | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_songpa | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_yeongdeungpo | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_yeongdeungpo | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_yeongdeungpo | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_yongsan | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_yongsan | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_yongsan | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| hangang_junggoo | 랜드마크 | 날생선 (raw_fish):25、정수 물병 (water_bottle):28、목재 (wood):25、로프 (rope):20 |
| hangang_fishing_spot_junggoo | 세부장소 | 오염수 (contaminated_water):4、돌멩이 (pebble):3、로프 (rope):2、지렁이 미끼 (bait_worm):3 |
| hangang_riverside_junggoo | 세부장소 | 야생 마늘 (wild_garlic):4、돌멩이 (pebble):4、곤충 미끼 (bait_insect):10、마른 풀 뭉치 (dry_grass):3 |
| lm_raider_camp_small | 랜드마크 | 천 (cloth):28、통조림 (canned_food):25、로프 (rope):22、탄피 (빈) (empty_cartridge):15 |
| raider_small_gate | 세부장소 | 천 (cloth):30、로프 (rope):25、통조림 (canned_food):22 |
| raider_small_search | 세부장소 | 통조림 (canned_food):4、붕대 (bandage):3、고철 (scrap_metal):3、날카로운 칼 (sharpened_knife):2 |
| raider_small_hostage | 세부장소 | 붕대 (bandage):3、진통제 (painkiller):2、통조림 (canned_food):2、천 (cloth):2 |
| lm_raider_camp_medium | 랜드마크 | 고철 (scrap_metal):28、통조림 (canned_food):22、덕테이프 (duct_tape):20、탄피 (빈) (empty_cartridge):18 |
| raider_medium_perimeter | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):3、권총 탄약 (pistol_ammo):3、로프 (rope):2 |
| raider_medium_armory | 세부장소 | 권총 탄약 (pistol_ammo):5、산탄 실탄 (shotgun_ammo):3、전투용 칼 (combat_knife):12、산탄총 (shotgun):2 |
| raider_medium_prison | 세부장소 | 붕대 (bandage):4、진통제 (painkiller):3、구급키트 (first_aid_kit):2、통조림 (canned_food):2 |
| lm_power_station | 랜드마크 | 구리 코일 (copper_coil):18、철사 (wire):28、고철 (scrap_metal):28、전기 모터 (electric_motor):6 |
| power_station_perimeter | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):3、권총 탄약 (pistol_ammo):3、철사 (wire):3 |
| power_station_cooling | 세부장소 | 오염수 (contaminated_water):4、고무 (rubber):3、고철 (scrap_metal):3、전자부품 (electronic_parts):2 |
| power_station_control | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、권총 탄약 (pistol_ammo):3、회로기판 (circuit_board):2 |
| power_station_generator | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):4、고철 (scrap_metal):4、고무 (rubber):3 |
| lm_water_plant | 랜드마크 | 숯 필터 (charcoal_filter):15、플라스틱 (plastic):28、철사 (wire):25、정수 물병 (water_bottle):25 |
| water_plant_gate | 세부장소 | 플라스틱 (plastic):30、철사 (wire):25、정수 물병 (water_bottle):25 |
| water_plant_pump | 세부장소 | 고철 (scrap_metal):4、철파이프 (iron_pipe):4、고무 (rubber):3、철사 (wire):3 |
| water_plant_reservoir | 세부장소 | 오염수 (contaminated_water):4、천 (cloth):3、정수 필터 (water_filter):2、고무 (rubber):2 |
| water_plant_chemistry | 세부장소 | 소독약 (antiseptic):3、숯 (charcoal):3、정수된 물 (purified_water):2、정수 필터 (water_filter):2 |
| water_plant_admin | 세부장소 | 붕대 (bandage):3、통조림 (canned_food):3、손전등 (flashlight):2、진통제 (painkiller):2 |
| lm_comms_tower | 랜드마크 | 전자부품 (electronic_parts):28、구리 코일 (copper_coil):15、철사 (wire):25、배터리 (battery):10 |
| comms_tower_approach | 세부장소 | 전자부품 (electronic_parts):28、철사 (wire):25、고철 (scrap_metal):22 |
| comms_tower_stairs | 세부장소 | 고철 (scrap_metal):3、철파이프 (iron_pipe):3、로프 (rope):3、못 (nail):3 |
| comms_tower_observation | 세부장소 | 유리파편 (glass_shard):4、천 (cloth):3、나침반 (compass):6、통조림 (canned_food):2 |
| comms_tower_antenna | 세부장소 | 전자부품 (electronic_parts):5、철사 (wire):5、회로기판 (circuit_board):3、고철 (scrap_metal):3 |
| comms_tower_broadcast | 세부장소 | 전자부품 (electronic_parts):4、철사 (wire):3、덕테이프 (duct_tape):3、구급키트 (first_aid_kit):2 |
| lm_raider_camp_large | 랜드마크 | 고철 (scrap_metal):26、탄피 (빈) (empty_cartridge):22、흑색 화약 (black_powder):10、케블라 직물 (kevlar_fabric):6 |
| raider_large_gate | 세부장소 | 고철 (scrap_metal):4、권총 탄약 (pistol_ammo):4、소총 탄약 (rifle_ammo):3、철파이프 (iron_pipe):3 |
| raider_large_barracks | 세부장소 | 통조림 (canned_food):4、방독면 (gas_mask):8、붕대 (bandage):3、권총 탄약 (pistol_ammo):3 |
| raider_large_vault | 세부장소 | 소총 탄약 (rifle_ammo):4、산탄 실탄 (shotgun_ammo):4、구급키트 (first_aid_kit):3、군용 식량 (military_ration):2 |
| raider_large_holding | 세부장소 | 붕대 (bandage):4、진통제 (painkiller):3、통조림 (canned_food):3、천 (cloth):3 |
