// ================================================================
// 카드 스택 설정 (Stack Configuration)
// ================================================================
// id        : items.js 의 카드 ID
// stackable : true = 겹치기 가능 / false = 겹치기 불가
// maxStack  : 한 슬롯에 최대 몇 개까지 쌓을 수 있는가
// ================================================================

//                              id                         stackable  maxStack
const STACK_ROWS = [
  // ── 기초 재료 ─────────────────────────────────────────────────
  ['scrap_metal'             , true,  8 ],
  ['cloth'                   , true, 10 ],
  ['rope'                    , true,  5 ],
  ['duct_tape'               , true,  3 ],
  ['wood'                    , true,  8 ],
  ['nail'                    , true, 30 ],
  ['wire'                    , true,  8 ],
  ['plastic'                 , true, 10 ],
  ['glass_shard'             , true, 10 ],
  ['rubber'                  , true,  5 ],
  ['leather'                 , true,  5 ],
  ['empty_bottle'            , true, 10 ],
  ['empty_can'               , true, 15 ],
  ['electronic_parts'        , true, 10 ],
  ['spring'                  , true,  8 ],
  ['tree_log'                , true,  3 ],
  ['herb'                    , true, 10 ],

  // ── 가공 재료 ─────────────────────────────────────────────────
  ['sharp_blade'             , true,  5 ],
  ['charcoal'                , true, 10 ],
  ['charcoal_filter'         , true,  5 ],
  ['cloth_scrap'             , true, 20 ],
  ['gauze'                   , true, 15 ],
  ['alcohol_solution'        , true,  5 ],
  ['gunpowder'               , true,  5 ],
  ['thread'                  , true, 20 ],

  // ── 수분 ──────────────────────────────────────────────────────
  ['water_bottle'            , true,  5 ],
  ['contaminated_water'      , true,  5 ],
  ['rainwater'               , true,  5 ],
  ['boiled_water'            , true,  5 ],
  ['purified_water'          , true,  5 ],
  ['sports_drink'            , true,  5 ],
  ['alcohol_drink'           , true,  5 ],
  ['coffee'                  , true,  8 ],

  // ── 식량 ──────────────────────────────────────────────────────
  ['canned_food'             , true,  5 ],
  ['energy_bar'              , true,  8 ],
  ['instant_noodles'         , true, 10 ],
  ['cooked_noodles'          , true,  5 ],
  ['rice'                    , true,  8 ],
  ['cooked_rice'             , true,  5 ],
  ['dried_meat'              , true,  8 ],
  ['military_ration'         , true,  5 ],
  ['vitamins'                , true, 15 ],
  ['salt'                    , true, 10 ],

  // ── 의료 ──────────────────────────────────────────────────────
  ['bandage'                 , true, 10 ],
  ['alcohol_swab'            , true, 20 ],
  ['first_aid_kit'           , true,  3 ],
  ['antiseptic'              , true,  8 ],
  ['painkiller'              , true, 12 ],
  ['antibiotics'             , true,  8 ],
  ['rad_blocker'             , true,  5 ],
  ['splint'                  , true,  5 ],
  ['surgery_kit'             , true,  2 ],
  ['antidote'                , true,  5 ],
  ['stimulant'               , true,  5 ],
  ['practice_bandage'        , true,  5 ],

  // ── 근접 무기 (내구도 있음 → 스택 불가) ────────────────────────
  ['iron_pipe'               , false, 1 ],
  ['wooden_sword'            , false, 1 ],
  ['knife'                   , false, 1 ],
  ['sharpened_knife'         , false, 1 ],
  ['crowbar'                 , false, 1 ],
  ['baseball_bat'            , false, 1 ],
  ['reinforced_bat'          , false, 1 ],
  ['spiked_pipe'             , false, 1 ],
  ['machete'                 , false, 1 ],
  ['spear'                   , false, 1 ],
  ['stun_gun'                , false, 1 ],
  ['hand_axe'                , false, 1 ],

  // ── 원거리 무기 (내구도 있음 → 스택 불가) / 소모성 투척 → 스택 가능
  ['pistol'                  , false, 1 ],
  ['shotgun'                 , false, 1 ],
  ['crossbow'                , false, 1 ],
  ['pistol_ammo'             , true, 20 ],
  ['shotgun_ammo'            , true, 15 ],
  ['crossbow_bolt'           , true, 20 ],
  ['molotov_cocktail'        , true,  5 ],
  ['nail_bomb'               , true,  3 ],
  ['smoke_bomb'              , true,  5 ],

  // ── 도구 (내구도 있음 → 스택 불가 / 소모성 도구 → 스택 가능) ──
  ['flashlight'              , false, 1 ],
  ['water_filter'            , false, 1 ],
  ['pipe_wrench'             , false, 1 ],
  ['lockpick'                , true,  5 ],
  ['gas_mask'                , false, 1 ],
  ['binoculars'              , false, 1 ],
  ['radio'                   , false, 1 ],
  ['lighter'                 , false, 1 ],
  ['compass'                 , false, 1 ],
  ['whetstone'               , false, 1 ],
  ['rope_ladder'             , false, 1 ],

  // ── 구조물 (내구도 있음 → 스택 불가) ────────────────────────────
  ['campfire'                , false, 1 ],
  ['water_purifier'          , false, 1 ],
  ['barricade'               , false, 1 ],
  ['alarm_trap'              , false, 1 ],
  ['spike_trap'              , false, 1 ],
  ['medical_station'         , false, 1 ],
  ['workbench'               , false, 1 ],
  ['storage_box'             , false, 1 ],

  // ── 의복/방어구 (내구도 있음 → 스택 불가) ───────────────────────
  ['cloth_guard'             , false, 1 ],
  ['training_shield'         , false, 1 ],
  ['raincoat'                , false, 1 ],
  ['warm_clothes'            , false, 1 ],
  ['tactical_vest'           , false, 1 ],
  ['helmet'                  , false, 1 ],
  ['work_gloves'             , false, 1 ],
  ['gas_mask_filter'         , true,  5 ],
  ['shield'                  , false, 1 ],
  ['hazmat_suit'             , false, 1 ],

  // ── 특수 ──────────────────────────────────────────────────────
  ['fuel_can'                , true,  3 ],
  ['map_fragment'            , true, 10 ],
  ['survivor_note'           , true, 15 ],
  ['emergency_kit'           , true,  2 ],
  ['flashbang'               , true,  3 ],
  ['premium_ration'          , true,  3 ],

  // ── 신규: 크래프팅 체인 확장 ─────────────────────────────────────

  // — 기초·가공 원자재 (stackable) —
  ['circuit_board'             , true, 10 ],
  ['copper_wire'               , true, 10 ],
  ['copper_coil'               , true, 10 ],
  ['sand'                      , true, 10 ],
  ['mortar_mix'                , true, 10 ],
  ['concrete_block'            , true, 10 ],
  ['brick'                     , true, 10 ],
  ['alloy_ingot'               , true, 10 ],
  ['woven_fabric'              , true, 10 ],
  ['reinforced_fabric'         , true, 10 ],
  ['dye'                       , true, 10 ],
  ['herb_powder'               , true, 10 ],
  ['wild_wheat'                , true, 10 ],
  ['flour'                     , true, 10 ],
  ['bread_dough'               , true, 10 ],
  ['worm'                      , true, 10 ],
  ['fishing_bait'              , true, 10 ],
  ['microchip'                 , true, 10 ],

  // — 식량 (stackable, maxStack 5) —
  ['baked_bread'               , true,  5 ],
  ['sandwich'                  , true,  5 ],
  ['rice_wine'                 , true,  5 ],
  ['vinegar'                   , true,  5 ],
  ['pickled_food'              , true,  5 ],
  ['meat_stew'                 , true,  5 ],
  ['bibimbap'                  , true,  5 ],
  ['salted_meat'               , true,  5 ],
  ['smoked_meat'               , true,  5 ],
  ['preserved_ration'          , true,  5 ],
  ['smoked_fish'               , true,  5 ],

  // — 수분 (stackable, maxStack 5) —
  ['settled_water'             , true,  5 ],
  ['distilled_water'           , true,  5 ],
  ['sterile_water'             , true,  5 ],

  // — 의료 소모품 (stackable, maxStack 5) —
  ['crude_medicine'            , true,  5 ],
  ['purified_medicine'         , true,  5 ],
  ['anesthetic'                , true,  5 ],
  ['detox_potion'              , true,  5 ],
  ['rad_flush'                 , true,  5 ],

  // — 강화 소모품 (stackable, maxStack 3) —
  ['knuckle_wrap'              , true,  3 ],
  ['combat_gloves'             , true,  3 ],
  ['weapon_oil'                , true,  3 ],
  ['serrated_mod'              , true,  3 ],
  ['defense_salve'             , true,  3 ],
  ['ammo_mod'                  , true,  3 ],

  // — 테크 컴포넌트 (stackable, maxStack 5) —
  ['circuit_module'            , true,  5 ],
  ['electric_motor'            , true,  5 ],
  ['power_cell'                , true,  5 ],
  ['generator_core'            , true,  5 ],

  // — 노숙자 전용 아이템 —
  ['battered_can'              , false, 1 ],
  ['old_blanket'               , false, 1 ],
  ['newspaper_bundle'          , true,  5 ],
  ['box_cutter'                , false, 1 ],
  ['broken_bottle'             , true,  3 ],

  // — 헬기 제작 전용 부품 (기계공 B3 엔딩) —
  ['aviation_alloy'            , true,  5 ],
  ['rotor_blade'               , false, 1 ],
  ['piston_engine'             , false, 1 ],
  ['avionics_module'           , false, 1 ],
  ['tail_rotor_assembly'       , false, 1 ],
  ['fuselage_frame'            , false, 1 ],
  ['avgas_drum'                , false, 1 ],

  // — 무기 (non-stackable) —
  ['pipe_shotgun'              , false, 1 ],
  ['master_blade'              , false, 1 ],
  ['katana'                    , false, 1 ],
  ['pipe_wrench_improved'      , false, 1 ],
  ['master_wrench'             , false, 1 ],

  // — 방어구 (non-stackable) —
  ['armor_plate'               , false, 1 ],
  ['alloy_armor_plate'         , false, 1 ],
  ['plate_carrier'             , false, 1 ],
  ['composite_armor'           , false, 1 ],
  ['powered_exosuit'           , false, 1 ],
  ['ballistic_weave'           , false, 1 ],
  ['camo_cloth'                , false, 1 ],
  ['ghillie_suit'              , false, 1 ],

  // — 레전더리 의료 (non-stackable) —
  ['synthetic_antibiotics'     , false, 1 ],
  ['universal_cure'            , false, 1 ],
  ['surgical_anesthetic'       , false, 1 ],

  // — 도구 (non-stackable) —
  ['scalpel'                   , false, 1 ],
  ['steel_tool_head'           , false, 1 ],
  ['spotlight_flashlight'      , false, 1 ],
  ['night_vision_goggles'      , false, 1 ],
  ['lockpick_set'              , false, 1 ],
  ['electronic_lockpick'       , false, 1 ],
  ['fishing_rod_advanced'      , false, 1 ],
  ['automated_fish_trap'       , false, 1 ],
  ['fishing_net'               , false, 1 ],
  ['crab_trap'                 , false, 1 ],
  ['master_angler_lure'        , false, 1 ],
  ['sterile_kit'               , false, 1 ],
  ['radio_transmitter'         , false, 1 ],
  ['powered_drill'             , false, 1 ],

  // — 구조물 (non-stackable) —
  ['portable_generator'        , false, 1 ],
  ['solar_panel'               , false, 1 ],
  ['electric_fence'            , false, 1 ],
  ['spotlight'                 , false, 1 ],
  ['solar_charger'             , false, 1 ],
  ['pipe_assembly'             , false, 1 ],
  ['water_tower'               , false, 1 ],
  ['plumbing_system'           , false, 1 ],
  ['reinforced_wall'           , false, 1 ],
  ['watchtower'                , false, 1 ],
  ['brick_furnace'             , false, 1 ],
  ['rain_collector_improved'   , false, 1 ],
  ['water_recycler'            , false, 1 ],
  ['field_surgery_station'     , false, 1 ],

  // — 특수 (non-stackable) —
  ['iron_gauntlet'             , false, 1 ],
  ['weapon_scope'              , false, 1 ],
  ['suppressor'                , false, 1 ],
  ['poison'                    , false, 1 ],
  ['guard_stance_kit'          , false, 1 ],

  // ── 베이스캠프 랜드마크 — 겹치기 불가 ──────────────────────────
  ['basecamp_landmark'       , false, 1 ],

  // ── 장소 카드 (25개 구) — 겹치기 불가 ─────────────────────────
  ['loc_gangnam'       , false, 1 ],
  ['loc_gangdong'      , false, 1 ],
  ['loc_gangbuk'       , false, 1 ],
  ['loc_gangseo'       , false, 1 ],
  ['loc_gwanak'        , false, 1 ],
  ['loc_gwangjin'      , false, 1 ],
  ['loc_guro'          , false, 1 ],
  ['loc_geumcheon'     , false, 1 ],
  ['loc_nowon'         , false, 1 ],
  ['loc_dobong'        , false, 1 ],
  ['loc_dongdaemun'    , false, 1 ],
  ['loc_dongjak'       , false, 1 ],
  ['loc_mapo'          , false, 1 ],
  ['loc_seodaemun'     , false, 1 ],
  ['loc_seocho'        , false, 1 ],
  ['loc_seongdong'     , false, 1 ],
  ['loc_seongbuk'      , false, 1 ],
  ['loc_songpa'        , false, 1 ],
  ['loc_yangcheon'     , false, 1 ],
  ['loc_yeongdeungpo'  , false, 1 ],
  ['loc_yongsan'       , false, 1 ],
  ['loc_eunpyeong'     , false, 1 ],
  ['loc_jongno'        , false, 1 ],
  ['loc_junggoo'       , false, 1 ],
  ['loc_jungrang'      , false, 1 ],
];

const STACK_CONFIG = Object.fromEntries(
  STACK_ROWS.map(([id, stackable, maxStack]) => [id, { stackable, maxStack }])
);

export default STACK_CONFIG;
