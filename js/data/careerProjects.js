// 각 공정의 투입은 되돌려 받지 않는다. 설비는 해당 구에 남고 운영 결과는 재사용된다.
const items = entries => Object.entries(entries).map(([definitionId, qty]) => ({ definitionId, qty }));
const action = (id, label, inputs, facilities = []) => ({ id, label, items: items(inputs), facilities });
const install = (inputs, facilities = []) => action('install', '설비 설치', inputs, facilities);
const stock = inputs => action('stock', '운영 물자 투입', inputs);
const serve = (count = 1) => ({ id: 'serve', label: '조리한 식사 제공', items: [], foodCount: count });
const power = () => action('power', '전원 연결', { battery: 1 });
const water = { label: '정수 설비 운영', costs: items({ contaminated_water: 2 }), items: items({ purified_water: 2 }), cooldownTP: 18, tpCost: 2 };
const supply = { label: '보급 요청', costs: items({ scrap_metal: 2 }), items: items({ canned_food: 1, bandage: 1 }), cooldownTP: 72, tpCost: 2 };
const kitchen = { label: '급식 재료 교환', costs: items({ scrap_metal: 2 }), items: items({ rice: 2, salt: 1 }), cooldownTP: 72, tpCost: 2 };
const workshop = { label: '회수 부품 정비', costs: items({ scrap_metal: 3, wire: 1 }), items: items({ electronic_parts: 1 }), cooldownTP: 36, tpCost: 3 };
const garden = { label: '재배 수확', seasonal: true, costs: items({ purified_water: 2 }), items: items({ vegetable: 2, herb: 1 }), cooldownTP: 72, tpCost: 3,
  seasonalFallback: { label: '재배 중단기 식재료 교환', costs: items({ scrap_metal: 3, salt: 1 }), items: items({ vegetable: 2, herb: 1 }), cooldownTP: 72, tpCost: 3 } };
const generation = { label: '연료 발전 재가동', costs: items({ fuel_can: 1 }), items: [], powerOutput: 3, cooldownTP: 18, tpCost: 2 };
const poweredWater = { ...water, powerCost: 1 };
const clinic = { label: '의료 물자 교환', costs: items({ herb: 3, cloth: 1 }), items: items({ bandage: 2, antiseptic: 1 }), cooldownTP: 72, tpCost: 3 };
function project(id, questId, name, districtId, actions, options = {}) {
  return { id, questId, name, districtId, stageId: 'commissioned', actions, tpCost: 2,
    hint: '재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.', ...options };
}

const definitions = [
  project('homeless_guard_care', 'mq_homeless_side_01', '타워 경비대 구급 지원', 'songpa', [stock({ bandage: 2, boiled_water: 1 })], { operation: clinic }),
  project('soldier_radio', 'mq_soldier_04', '용산 무전기 복원', 'yongsan', [action('restore', '수신 계통 수리', { electronic_parts: 2, wire: 1 }, ['radio']), power()], { operation: supply }),
  project('soldier_relay', 'mq_soldier_10', '광화문 전진 통신', 'jongno', [install({ circuit_board: 1, copper_coil: 1, wire: 2 }, ['radio_transmitter']), power()], { recovery: ['circuit_board', 'copper_coil'], requires: ['soldier_radio'], operation: supply }),
  project('soldier_rescue', 'mq_soldier_a_13', '서대문 구조 거점', 'seodaemun', [install({ blanket: 2, storage_box: 1 }, ['medical_bed', 'storage_box']), stock({ bandage: 3 })], { requires: ['soldier_relay'], operation: clinic }),
  project('soldier_rations', 'mq_soldier_a_14', '구조자 배식', 'seodaemun', [serve(3)], { requires: ['soldier_rescue'], operation: kitchen }),
  project('soldier_network_test', 'mq_soldier_a_15', '구조망 연락 시험', 'seodaemun', [stock({ battery: 1, bandage: 2 })], { requires: ['soldier_rations'], operation: supply }),
  project('soldier_rescue_network', 'mq_soldier_end_a1', '서울 구조망 인계', 'seodaemun', [install({ military_radio_kit: 1 }, ['military_radio_kit']), stock({ canned_food: 3, purified_water: 3 })], { recovery: ['military_radio_kit'], requires: ['soldier_network_test'], operation: supply }),
  project('soldier_forward', 'mq_soldier_b_12', '여의도 전진 거점', 'yeongdeungpo', [install({ blanket: 2, storage_box: 1 }, ['medical_bed', 'storage_box']), power()], { requires: ['soldier_relay'], operation: supply }),
  project('soldier_broadcast', 'mq_soldier_b_15', 'KBS 비상 송출 시험', 'yeongdeungpo', [install({ radio_transmitter: 1 }, ['radio_transmitter']), power()], { recovery: ['radio_transmitter'], requires: ['soldier_forward'], operation: supply }),
  project('soldier_national', 'mq_soldier_end_b1', '전국 통신망 송출', 'yeongdeungpo', [install({ circuit_module: 1, copper_coil: 2 }), power()], { recovery: ['circuit_module', 'copper_coil'], requires: ['soldier_broadcast'], operation: supply }),
  project('soldier_landing', 'mq_soldier_end_b2', '헬리패드 유도 착륙', 'yeongdeungpo', [install({ military_radio_kit: 1, flashlight: 2 }), action('power', '유도등 전원 연결', { battery: 4 })], { recovery: ['military_radio_kit'], requires: ['soldier_broadcast'], operation: supply }),
  project('soldier_departure', 'mq_soldier_end_b3', '수원 이동 보급 인계', 'yeongdeungpo', [stock({ canned_food: 4, purified_water: 2 })], { requires: ['soldier_broadcast'], operation: supply }),

  project('fire_relief', 'mq_fire_02', '소방서 임시 구호소', 'yongsan', [install({ wood: 3, cloth: 2, rope: 1 }, ['medical_bed']), stock({ purified_water: 1 })], { operation: clinic }),
  project('fire_access', 'mq_fire_04', '구조 접근 장비', 'yongsan', [install({ rope_ladder: 1, crowbar: 1 }, ['rope_ladder', 'crowbar'])], { requires: ['fire_relief'], operation: workshop }),
  project('fire_station', 'mq_fire_07', '소방서 출입구와 급수', 'yongsan', [install({ barricade: 1, rain_collector: 1 }, ['barricade', 'rain_collector']), stock({ water_filter: 1 })], { requires: ['fire_access'], operation: water }),
  project('fire_family', 'mq_fire_a_13', '은평 가족 거처', 'eunpyeong', [action('entrance', '출입구 보강', { wood: 4, nail: 4 }, ['barricade']), action('roof', '지붕 방수', { cloth: 3, rubber: 2, duct_tape: 1 }, ['medical_bed'])], { requires: ['fire_station'], operation: clinic }),
  project('fire_family_care', 'mq_fire_a_14', '가족 회복 지원', 'eunpyeong', [stock({ bandage: 3, purified_water: 2 }), serve()], { requires: ['fire_family'], operation: clinic }),
  project('fire_family_handover', 'mq_fire_a_15', '가족 대피소 운영 시험', 'eunpyeong', [install({ water_filter: 1, rain_collector: 1 }, ['rain_collector']), stock({ purified_water: 2 })], { requires: ['fire_family_care'], operation: water }),
  project('fire_shelter', 'mq_fire_end_a1', '은평 대피소 인계', 'eunpyeong', [install({ medical_bed: 1, storage_box: 1 }, ['medical_bed', 'storage_box']), serve(3)], { recovery: ['medical_bed'], requires: ['fire_family_handover'], operation: clinic }),
  project('fire_memorial', 'mq_fire_end_a3', '이재훈 구조 연결망', 'eunpyeong', [install({ rope_ladder: 2, radio: 1 }), power()], { requires: ['fire_family_handover'], operation: supply }),
  project('fire_large', 'mq_fire_b_13', '성수 대형 대피소', 'seongdong', [install({ reinforced_shelter: 1, storage_box: 1 }, ['reinforced_shelter', 'storage_box']), stock({ purified_water: 2 })], { recovery: ['reinforced_shelter'], requires: ['fire_station'], operation: clinic }),
  project('fire_power', 'mq_fire_b_14', '대피소 전력 가동', 'seongdong', [install({ portable_generator: 1, wire: 2 }, ['portable_generator']), stock({ fuel_can: 1 })], { recovery: ['portable_generator'], requires: ['fire_large'], powerOutput: 3, operation: generation }),
  project('fire_handover', 'mq_fire_b_15', '대피소 급수와 운영 인계', 'seongdong', [install({ water_filter: 1, electric_motor: 1 }), serve(3)], { recovery: ['electric_motor'], requires: ['fire_power'], powerCost: 1, operation: poweredWater }),
  project('fire_departure', 'mq_fire_end_b3', '탈출 전 보급 인계', 'seongdong', [stock({ canned_food: 4, purified_water: 3 })], { requires: ['fire_handover'], operation: supply }),

  project('chef_first_meal', 'mq_chef_06', '남대문 첫 배식', 'junggoo', [serve()], { operation: kitchen }),
  project('chef_pantry', 'mq_chef_07', '손질과 저장 작업장', 'junggoo', [install({ kitchen_knife: 1, storage_box: 1 }, ['kitchen_knife', 'storage_box']), stock({ salt: 2 })], { requires: ['chef_first_meal'], operation: kitchen }),
  project('chef_regular', 'mq_chef_10', '남대문 정기 급식', 'junggoo', [serve(3), stock({ purified_water: 2 })], { requires: ['chef_pantry'], operation: kitchen }),
  project('chef_gangnam', 'mq_chef_a_14', '강남 두 번째 급식소', 'gangnam', [install({ iron_pot: 1, storage_box: 1 }, ['iron_pot', 'storage_box']), serve()], { requires: ['chef_regular'], operation: kitchen }),
  project('chef_two_kitchens', 'mq_chef_a_15', '두 급식소 공동 배식', 'gangnam', [serve(3), stock({ salt: 2 })], { requires: ['chef_gangnam'], operation: kitchen }),
  project('chef_water', 'mq_chef_a_16', '강남 급식소 급수', 'gangnam', [install({ water_filter: 1, rain_collector: 1 }, ['rain_collector']), stock({ purified_water: 2 })], { requires: ['chef_two_kitchens'], operation: water }),
  project('chef_expansion', 'mq_chef_a_19', '급식소 확장 검증', 'gangnam', [serve(3)], { requires: ['chef_water'], operation: kitchen }),
  project('chef_market_network', 'mq_chef_a1_prep', '마트 공급망 첫 교환', 'gangnam', [stock({ scrap_metal: 4, salt: 2 })], { requires: ['chef_expansion'], operation: kitchen, output: items({ rice: 3 }) }),
  project('chef_network', 'mq_chef_end_a1', '서울 급식망 인계', 'gangnam', [serve(4), stock({ purified_water: 3 })], { requires: ['chef_market_network'], operation: kitchen }),
  project('chef_farm', 'mq_chef_a2_prep', '가락 옥상 재배', 'songpa', [install({ soil_bag: 3, vegetable_seed: 2, wood: 3 }, ['garden_bed_veggie']), stock({ purified_water: 2 })], { requires: ['chef_expansion'], operation: garden }),
  project('chef_self_sufficient', 'mq_chef_end_a2', '가락 자급 급식', 'songpa', [serve(3)], { requires: ['chef_farm'], operated: ['chef_farm'], operation: garden }),
  project('chef_professional', 'mq_chef_b_13', '용산 전문 주방', 'yongsan', [install({ iron_pot: 1, water_filter: 1, storage_box: 1 }, ['iron_pot', 'storage_box']), stock({ purified_water: 2 }), serve()], { requires: ['chef_regular'], operation: kitchen }),
  project('chef_menu', 'mq_chef_b_15', '셰프 특선 제공', 'yongsan', [action('serve', '특선 메뉴 제공', { chef_meal_kit: 1, hearty_stew: 1 })], { requires: ['chef_professional'], operation: kitchen }),
  project('chef_dining', 'mq_chef_b_18', '다이닝 식사 경험', 'yongsan', [install({ wood: 4, cloth: 2 }, ['storage_box']), serve(2)], { requires: ['chef_menu'], operation: kitchen }),
  project('chef_herb_garden', 'mq_chef_b_19', '주방 허브 정원', 'yongsan', [install({ soil_bag: 3, herb_seed: 2 }, ['garden_bed_herb']), stock({ purified_water: 2 })], { requires: ['chef_dining'], operation: garden }),
  project('chef_restoration', 'mq_chef_end_b1', '미식 복원 첫 만찬', 'yongsan', [action('serve', '복원 만찬 제공', { chef_meal_kit: 2, recovery_stew: 1 })], { requires: ['chef_herb_garden'], operated: ['chef_herb_garden'], operation: kitchen }),

  project('engineer_workbench', 'mq_eng_02', '용산 작업대 설치', 'yongsan', [install({ workbench: 1 }, ['workbench'])], { crafted: 'workbench', operation: { ...workshop, label: '전동 작업대 정비', powerCost: 1 } }),
  project('engineer_power', 'mq_eng_08', '용산 발전 계통 복원', 'yongsan', [install({ circuit_board: 1, copper_coil: 1, electric_motor: 1 }, ['portable_generator']), stock({ fuel_can: 1 })], { crafted: 'electric_motor', requires: ['engineer_workbench'], powerOutput: 3, operation: generation }),
  project('engineer_vehicle_frame', 'mq_eng_a_12', '구로 탈출 차량 골격', 'guro', [install({ refined_metal: 4, wood: 3, rubber: 2 })], { requires: ['engineer_power'], operation: workshop }),
  project('engineer_vehicle_power', 'mq_eng_a_13', '차량 전기 동력 설치', 'guro', [install({ circuit_module: 1, electric_motor: 1, copper_coil: 1 }), power()], { crafted: 'circuit_module', requires: ['engineer_vehicle_frame'], operation: workshop }),
  project('engineer_vehicle_controls', 'mq_eng_a_14', '차량 조향 조립', 'guro', [install({ spring: 2, wire: 2, rope: 2 })], { requires: ['engineer_vehicle_power'], operation: workshop }),
  project('engineer_vehicle_test', 'mq_eng_a_15', '차량 주행 시험', 'guro', [stock({ battery: 2, rubber: 1 })], { requires: ['engineer_vehicle_controls'], operation: workshop }),
  project('engineer_escape_prep', 'mq_eng_a1_prep', '탈출 차량 보강', 'guro', [install({ refined_metal: 2, duct_tape: 2 }), stock({ canned_food: 3 })], { requires: ['engineer_vehicle_test'], operation: supply }),
  project('engineer_escape', 'mq_eng_end_a1', '차량 출발', 'guro', [stock({ canned_food: 4, purified_water: 3 })], { requires: ['engineer_escape_prep'], operation: supply }),
  project('engineer_factory', 'mq_eng_a3_prep', '구로 생산 거점', 'guro', [install({ workbench: 1, storage_box: 1 }, ['workbench', 'storage_box']), stock({ fuel_can: 2 })], { requires: ['engineer_vehicle_test'], operation: workshop }),
  project('engineer_factory_handover', 'mq_eng_end_a3', '구로 공장 운영 인계', 'guro', [stock({ canned_food: 3, purified_water: 3 })], { requires: ['engineer_factory'], operated: ['engineer_factory'], operation: workshop }),
  project('engineer_grid', 'mq_eng_b_13', '은평 발전·배전 설치', 'eunpyeong', [install({ generator_core: 1, circuit_module: 1, wire: 3 }, ['portable_generator']), stock({ fuel_can: 2 })], { crafted: 'generator_core', requires: ['engineer_power'], powerOutput: 6, operation: generation }),
  project('engineer_pump', 'mq_eng_b_14', '은평 수도 펌프', 'eunpyeong', [install({ electric_motor: 1, water_filter: 1, copper_coil: 1 }), stock({ contaminated_water: 2 })], { requires: ['engineer_grid'], powerCost: 1, operation: poweredWater, output: items({ purified_water: 2 }) }),
  project('engineer_infrastructure_test', 'mq_eng_b_15', '전력·수도 연동 시험', 'eunpyeong', [stock({ wire: 1, battery: 1 })], { requires: ['engineer_pump'], operated: ['engineer_pump'], powerCost: 1, operation: { ...workshop, powerCost: 1 } }),
  project('engineer_city', 'mq_eng_end_b1', '도시 기반시설 최종 가동', 'eunpyeong', [install({ radio_transmitter: 1, circuit_module: 1 }, ['radio_transmitter']), power()], { requires: ['engineer_infrastructure_test'], operation: supply }),
  project('engineer_hover', 'mq_eng_b3_9', '헬기 연료 장착·호버링', 'seongdong', [install({ helicopter: 1 }, ['helicopter']), stock({ avgas_drum: 2 }), power()], { crafted: 'helicopter', requires: ['engineer_infrastructure_test'], operation: workshop }),
  project('engineer_flight', 'mq_eng_end_b3', '헬기 탈출 출발', 'seongdong', [stock({ canned_food: 4, purified_water: 3 })], { requires: ['engineer_hover'], operation: supply }),

  project('homeless_reclaim', 'mq_homeless_03', '거리 회수품 재생', 'gwangjin', [action('reclaim', '회수 고철 선별', { scrap_metal: 3, cloth: 1 })], { output: items({ nail: 4, wire: 2 }), operation: workshop }),
  project('homeless_trade', 'mq_homeless_06', '광진 첫 물물교환', 'gwangjin', [stock({ scrap_metal: 3 })], { requires: ['homeless_reclaim'], output: items({ canned_food: 1, salt: 1 }), operation: supply, hint: '낚시꾼 공동체의 공급 교환입니다. NPC 개인 거래와 별개로 재고는 72TP마다 보충됩니다.' }),
  project('homeless_storage', 'mq_homeless_07', '한강 운반·저장 거점', 'gwangjin', [install({ storage_box: 1, rope: 2 }, ['storage_box']), stock({ wood: 3 })], { requires: ['homeless_trade'], operation: workshop }),
  project('homeless_crossing', 'mq_homeless_08', '잠실대교 운반 발판', 'songpa', [install({ wood: 4, rope: 2, nail: 4 }, ['rope_ladder'])], { requires: ['homeless_storage'], operation: supply }),
  project('homeless_clinic', 'mq_homeless_a_12', '강남 공동 치료소', 'gangnam', [install({ medical_bed: 1, storage_box: 1 }, ['medical_bed', 'storage_box']), stock({ antiseptic: 2 })], { recovery: ['medical_bed'], requires: ['homeless_crossing'], operation: clinic }),
  project('homeless_clinic_service', 'mq_homeless_a_14', '공동 치료소 운영', 'gangnam', [stock({ bandage: 3, purified_medicine: 1 })], { recovery: ['purified_medicine'], requires: ['homeless_clinic'], operation: clinic }),
  project('homeless_clinic_handover', 'mq_homeless_a_15', '마을 운영 인계', 'gangnam', [serve(2), stock({ purified_water: 2 })], { requires: ['homeless_clinic_service'], operated: ['homeless_clinic'], operation: clinic }),
  project('homeless_migration', 'mq_homeless_end_a3', '공동 이주 보급', 'gangnam', [stock({ canned_food: 3, purified_water: 2 })], { requires: ['homeless_clinic_handover'], operation: supply }),
  project('homeless_tower', 'mq_homeless_b_12', '타워 보강·저장소', 'songpa', [install({ barricade: 1, storage_box: 1 }, ['barricade', 'storage_box']), stock({ rope: 2 })], { requires: ['homeless_crossing'], operation: workshop }),
  project('homeless_external_route', 'mq_homeless_b_13', '강남 외부 교환망', 'gangnam', [stock({ scrap_metal: 4, bandage: 2 })], { requires: ['homeless_tower'], output: items({ rice: 3, salt: 2 }), operation: kitchen }),
  project('homeless_tower_service', 'mq_homeless_b_15', '타워 공동체 운영 검증', 'songpa', [serve(3), stock({ purified_water: 2 })], { requires: ['homeless_external_route'], operated: ['homeless_external_route'], operation: supply }),
  project('homeless_autonomy', 'mq_homeless_end_b1', '타워 자치 시설 인계', 'songpa', [install({ water_filter: 1, rain_collector: 1, medical_bed: 1 }, ['rain_collector', 'medical_bed']), stock({ antiseptic: 2 })], { recovery: ['medical_bed'], requires: ['homeless_tower_service'], operation: water }),
  project('homeless_broker', 'mq_homeless_end_b3', '서울 중개망 순환 완료', 'jongno', [stock({ salt: 2, electronic_parts: 1, bandage: 2 })], { requires: ['homeless_tower_service'], operated: ['homeless_trade', 'homeless_external_route'], output: items({ canned_food: 2, battery: 1 }), operation: supply }),

  project('doctor_research', 'mq_doctor_a_13', '관악 공동 연구실', 'gwanak', [install({ field_laboratory: 1 }, ['field_laboratory', 'medical_station', 'workbench']), stock({ concentrated_serum: 2, purified_medicine: 1 })], { crafted: 'purified_medicine', operation: clinic, unlockRecipes: ['vaccine'], output: items({ virus_sample: 1 }), hint: '공동 연구실에서 검증된 표본과 일반 백신 설계 정보를 받습니다. 0번 환자 표본은 단독 연구용입니다.' }),
  project('doctor_vaccine', 'mq_doctor_end_a1', '공동 백신 검증', 'gwanak', [action('validate', '직접 합성한 백신 투입', { vaccine: 1 })], { requires: ['doctor_research'], clinicalCount: 3, crafted: 'vaccine', operation: clinic }),
  project('doctor_notes', 'mq_doctor_end_a3', '임상 연구 기록 인계', 'gwanak', [stock({ newspaper_bundle: 3, purified_medicine: 1 })], { requires: ['doctor_research'], clinicalCount: 3, operation: clinic }),
  project('doctor_military', 'mq_doctor_b_13', '용산 군 의무실', 'yongsan', [install({ medical_station: 1, medical_bed: 1 }, ['medical_station', 'medical_bed']), stock({ antiseptic: 2 })], { clinicalCount: 3, operation: clinic }),
  project('doctor_field_care', 'mq_doctor_b_14', '군 야전 처치 운영', 'yongsan', [stock({ anesthetic: 2, sterile_kit: 1 })], { requires: ['doctor_military'], clinicalProfile: 'complex_trauma', clinicalAlternativeCount: 3, operation: clinic }),
  project('doctor_military_handover', 'mq_doctor_b_15', '군 의무실 운영 검증', 'yongsan', [stock({ purified_medicine: 2, bandage: 2 })], { requires: ['doctor_field_care'], operated: ['doctor_military'], operation: clinic }),
  project('doctor_surgery', 'mq_doctor_end_b1', '군 의료본부 수술실', 'yongsan', [install({ field_surgery_station: 1 }, ['field_surgery_station']), stock({ surgical_anesthetic: 1, sterile_kit: 1 })], { requires: ['doctor_military_handover'], clinicalProfile: 'complex_trauma', clinicalAlternativeCount: 3, clinicalCount: 3, operation: clinic }),
  project('doctor_isolation', 'mq_doctor_side_04', '중구 격리 거점', 'junggoo', [install({ cloth: 3, wood: 3 }, ['medical_bed']), stock({ antiseptic: 3 })], { operation: clinic }),
  project('doctor_hospital', 'mq_doctor_side_06', '중구 야전병원', 'junggoo', [install({ field_surgery_station: 1, medical_bed: 1 }, ['field_surgery_station', 'medical_bed']), stock({ antiseptic: 2 })], { requires: ['doctor_isolation'], operation: clinic }),
  project('doctor_plague', 'mq_doctor_side_end', '0번 환자 단독 연구 완료', 'junggoo', [action('validate', '직접 합성한 역병 백신 투입', { plague_vaccine: 1 })], { requires: ['doctor_hospital'], crafted: 'plague_vaccine', bossId: 'boss_patient_zero', clinicalCount: 3, operation: clinic }),
];

export const CAREER_PROJECTS = Object.fromEntries(definitions.map(def => [def.id, def]));
// 타 분야 전문 설비는 폐설비 회수팀과 교환할 수 있다. 필요 수량까지만 확보하며 투입·가동은 별도다.
export const PROJECT_RECOVERY = {
  circuit_board: { scrap_metal: 3, wire: 1 },
  copper_coil: { scrap_metal: 3, wire: 2 },
  circuit_module: { scrap_metal: 6, wire: 3, battery: 1 },
  electric_motor: { scrap_metal: 6, wire: 3 },
  generator_core: { scrap_metal: 8, wire: 4, battery: 2 },
  portable_generator: { scrap_metal: 10, wire: 4, fuel_can: 2 },
  radio_transmitter: { scrap_metal: 6, wire: 3, battery: 2 },
  military_radio_kit: { scrap_metal: 8, wire: 4, battery: 2 },
  reinforced_shelter: { wood: 10, scrap_metal: 8, rope: 3 },
  medical_bed: { wood: 5, cloth: 4, scrap_metal: 3 },
  medical_station: { wood: 4, cloth: 3, antiseptic: 2 },
  purified_medicine: { herb: 6, antiseptic: 2 },
};
export const createCareerProjectState = () => ({ version: 1, districtPower: {}, projects: {}, crafted: {}, trades: {}, supplies: {} });

// 구버전 완료 이력은 선행 접근만 복구한다. 설치물·운영 결과·보상은 소급 지급하지 않는다.
export function migrateCareerProjects(gs) {
  const state = gs.flags.careerProjects?.version === 1 ? gs.flags.careerProjects : createCareerProjectState();
  state.districtPower ??= {};
  for (const def of definitions) {
    const completed = gs.quests?.completed?.includes(def.questId);
    if (completed && !state.projects[def.id]) {
      state.projects[def.id] = { projectId: def.id, stageId: def.stageId, installedInputs: {}, active: true, legacy: true, uses: 0 };
    }
    // 접근권은 보상과 다르다. 이미 완료한 연구를 다시 설치하도록 강제하지 않는다.
    if (completed || state.projects[def.id]?.active) for (const recipe of def.unlockRecipes ?? []) {
      gs.flags.hiddenRecipesUnlocked ??= [];
      if (!gs.flags.hiddenRecipesUnlocked.includes(recipe)) gs.flags.hiddenRecipesUnlocked.push(recipe);
    }
  }
  gs.flags.careerProjects = state;
}

export function getCareerFacilities(gs) {
  return Object.values(gs.flags?.careerProjects?.projects ?? {}).flatMap(state => {
    const def = CAREER_PROJECTS[state.projectId];
    if (!def || !state.active || state.legacy || def.districtId !== gs.location?.currentDistrict) return [];
    return def.actions.flatMap(a => (a.facilities ?? []).map(definitionId => ({ definitionId, durability: 100, projectId: def.id })));
  });
}

export default CAREER_PROJECTS;

