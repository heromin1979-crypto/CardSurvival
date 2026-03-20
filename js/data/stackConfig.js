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
  ['first_aid_kit'           , true,  3 ],
  ['antiseptic'              , true,  8 ],
  ['painkiller'              , true, 12 ],
  ['antibiotics'             , true,  8 ],
  ['rad_blocker'             , true,  5 ],
  ['splint'                  , true,  5 ],
  ['surgery_kit'             , true,  2 ],
  ['antidote'                , true,  5 ],
  ['stimulant'               , true,  5 ],

  // ── 근접 무기 ─────────────────────────────────────────────────
  ['iron_pipe'               , true,  2 ],
  ['knife'                   , true,  3 ],
  ['crowbar'                 , true,  2 ],
  ['baseball_bat'            , true,  2 ],
  ['reinforced_bat'          , true,  2 ],
  ['spiked_pipe'             , true,  2 ],
  ['machete'                 , true,  2 ],
  ['spear'                   , false, 1 ],
  ['stun_gun'                , true,  2 ],
  ['hand_axe'                , true,  2 ],

  // ── 원거리/투척 ───────────────────────────────────────────────
  ['pistol'                  , true,  2 ],
  ['shotgun'                 , false, 1 ],
  ['crossbow'                , false, 1 ],
  ['pistol_ammo'             , true, 20 ],
  ['shotgun_ammo'            , true, 15 ],
  ['crossbow_bolt'           , true, 20 ],
  ['molotov_cocktail'        , true,  5 ],
  ['nail_bomb'               , true,  3 ],
  ['smoke_bomb'              , true,  5 ],

  // ── 도구 ──────────────────────────────────────────────────────
  ['flashlight'              , true,  2 ],
  ['water_filter'            , true,  3 ],
  ['pipe_wrench'             , true,  2 ],
  ['lockpick'                , true,  5 ],
  ['gas_mask'                , false, 1 ],
  ['binoculars'              , true,  2 ],
  ['radio'                   , true,  2 ],
  ['lighter'                 , true,  5 ],
  ['compass'                 , true,  2 ],
  ['whetstone'               , true,  3 ],
  ['rope_ladder'             , true,  2 ],

  // ── 구조물 ────────────────────────────────────────────────────
  ['campfire'                , true,  2 ],
  ['water_purifier'          , true,  2 ],
  ['barricade'               , true,  2 ],
  ['alarm_trap'              , true,  3 ],
  ['spike_trap'              , true,  3 ],
  ['medical_station'         , false, 1 ],
  ['workbench'               , false, 1 ],
  ['storage_box'             , true,  3 ],

  // ── 의복/방어구 ───────────────────────────────────────────────
  ['raincoat'                , true,  2 ],
  ['tactical_vest'           , false, 1 ],
  ['helmet'                  , false, 1 ],
  ['work_gloves'             , true,  2 ],
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
