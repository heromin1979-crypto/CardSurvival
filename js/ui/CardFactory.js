// === CARD FACTORY ===
// 카드 DOM 요소 생성. type='location' 카드는 별도 렌더링.
import GameState       from '../core/GameState.js';
import StatSystem      from '../systems/StatSystem.js';
import EventBus        from '../core/EventBus.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import I18n      from '../core/I18n.js';
import GameData  from '../data/GameData.js';

// 위험도 색상
const DANGER_COLORS = ['#449944', '#889933', '#cc8822', '#cc3333', '#881111'];

// 품질 등급 레이블 및 데미지 배율
const QUALITY_LABELS = { good: '양호', excellent: '우수', masterwork: '걸작' };
const QUALITY_MULT   = { normal: 1.00, good: 1.15, excellent: 1.30, masterwork: 1.50 };

// 랜드마크 카드 개별 이미지 (assets/images/landmarks/)
const LANDMARK_IMAGES = {
  lm_gangnam:      'assets/images/landmarks/lm_gangnam.png',
  lm_gangdong:     'assets/images/landmarks/lm_gangdong.png',
  lm_gangbuk:      'assets/images/landmarks/lm_gangbuk.png',
  lm_gangseo:      'assets/images/landmarks/lm_gangseo.png',
  lm_gwanak:       'assets/images/landmarks/lm_gwanak.png',
  lm_gwangjin:     'assets/images/landmarks/lm_gwangjin.png',
  lm_guro:         'assets/images/landmarks/lm_guro.png',
  lm_geumcheon:    'assets/images/landmarks/lm_geumcheon.png',
  lm_nowon:        'assets/images/landmarks/lm_nowon.png',
  lm_dobong:       'assets/images/landmarks/lm_dobong.png',
  lm_dongdaemun:   'assets/images/landmarks/lm_dongdaemun.png',
  lm_dongjak:      'assets/images/landmarks/lm_dongjak.png',
  lm_mapo:         'assets/images/landmarks/lm_mapo.png',
  lm_seodaemun:    'assets/images/landmarks/lm_seodaemun.png',
  lm_seocho:       'assets/images/landmarks/lm_seocho.png',
  lm_seongdong:    'assets/images/landmarks/lm_seongdong.png',
  lm_seongbuk:     'assets/images/landmarks/lm_seongbuk.png',
  lm_songpa:       'assets/images/landmarks/lm_songpa.png',
  lm_yangcheon:    'assets/images/landmarks/lm_yangcheon.png',
  lm_yeongdeungpo: 'assets/images/landmarks/lm_yeongdeungpo.png',
  lm_yongsan:      'assets/images/landmarks/lm_yongsan.png',
  lm_eunpyeong:    'assets/images/landmarks/lm_eunpyeong.png',
  lm_jongno:       'assets/images/landmarks/lm_jongno.png',
  lm_junggoo:      'assets/images/landmarks/lm_junggoo.png',
  lm_jungrang:     'assets/images/landmarks/lm_jungrang.png',
  basecamp_landmark: 'assets/images/landmarks/basecamp.png',
};

// 지역 카드 서브타입별 이미지 (assets/images/locations/)
const LOCATION_IMAGES = {
  urban:      'assets/images/locations/urban.png',
  industrial: 'assets/images/locations/industrial.png',
  medical:    'assets/images/locations/medical.png',
  safe:       'assets/images/locations/safe.png',
  warzone:    'assets/images/locations/warzone.png',
};

// 아이템 카드 이미지 매핑 (assets/images/materials/)
const CARD_IMAGES = {
  scrap_metal:      'assets/images/materials/scrap_metal.png',
  cloth:            'assets/images/materials/cloth.png',
  rope:             'assets/images/materials/rope.png',
  duct_tape:        'assets/images/materials/duct_tape.png',
  wood:             'assets/images/materials/wood.png',
  nail:             'assets/images/materials/nail.png',
  wire:             'assets/images/materials/wire.png',
  plastic:          'assets/images/materials/plastic.png',
  glass_shard:      'assets/images/materials/glass_shard.png',
  rubber:           'assets/images/materials/rubber.png',
  leather:          'assets/images/materials/leather.png',
  empty_bottle:     'assets/images/materials/empty_bottle.png',
  empty_can:        'assets/images/materials/empty_can.png',
  electronic_parts: 'assets/images/materials/electronic_parts.png',
  spring:           'assets/images/materials/spring.png',
  tree_log:         'assets/images/materials/tree_log.png',
  herb:             'assets/images/materials/herb.png',
  sharp_blade:      'assets/images/materials/sharp_blade.png',
  charcoal:         'assets/images/materials/charcoal.png',
  charcoal_filter:  'assets/images/materials/charcoal_filter.png',
  cloth_scrap:      'assets/images/materials/cloth_scrap.png',
  gauze:            'assets/images/materials/gauze.png',
  alcohol_solution: 'assets/images/materials/alcohol_solution.png',
  gunpowder:        'assets/images/materials/gunpowder.png',
  thread:           'assets/images/materials/thread.png',

  // 음식/음료
  boiled_water:          'assets/images/food/boiled_water.png',
  purified_water:        'assets/images/food/purified_water.png',
  contaminated_water:    'assets/images/food/contaminated_water.png',
  rainwater:             'assets/images/food/rainwater.png',
  pristine_spring_water: 'assets/images/food/pristine_spring_water.png',
  sports_drink:          'assets/images/food/sports_drink.png',
  coffee:                'assets/images/food/coffee.png',
  herbal_tea:            'assets/images/food/herbal_tea.png',
  water_bottle:          'assets/images/food/water_bottle.png',
  alcohol_drink:         'assets/images/food/alcohol_drink.png',
  cooked_rice:           'assets/images/food/cooked_rice.png',
  cooked_noodles:        'assets/images/food/cooked_noodles.png',
  dried_meat:            'assets/images/food/dried_meat.png',
  raw_meat:              'assets/images/food/raw_meat.png',
  canned_food:           'assets/images/food/canned_food.png',
  instant_noodles:       'assets/images/food/instant_noodles.png',
  energy_bar:            'assets/images/food/energy_bar.png',
  battle_ration:         'assets/images/food/battle_ration.png',
  military_ration:       'assets/images/food/military_ration.png',
  premium_ration:        'assets/images/food/premium_ration.png',
  salt:                  'assets/images/food/salt.png',
  rice:                  'assets/images/food/rice.png',
  survivors_feast:       'assets/images/food/survivors_feast.png',

  // 의약품
  bandage:               'assets/images/medical/bandage.png',
  painkiller:            'assets/images/medical/painkiller.png',
  strong_painkiller:     'assets/images/medical/strong_painkiller.png',
  antibiotics:           'assets/images/medical/antibiotics.png',
  antidote:              'assets/images/medical/antidote.png',
  first_aid_kit:         'assets/images/medical/first_aid_kit.png',
  emergency_kit:         'assets/images/medical/emergency_kit.png',
  antiseptic:            'assets/images/medical/antiseptic.png',
  herbal_medicine:       'assets/images/medical/herbal_medicine.png',
  vitamins:              'assets/images/medical/vitamins.png',
  splint:                'assets/images/medical/splint.png',
  surgery_kit:           'assets/images/medical/surgery_kit.png',
  surgical_grade_kit:    'assets/images/medical/surgical_grade_kit.png',
  stamina_tonic:         'assets/images/medical/stamina_tonic.png',
  rad_blocker:           'assets/images/medical/rad_blocker.png',
  radiation_cleanser:    'assets/images/medical/radiation_cleanser.png',
  mutant_formula:        'assets/images/medical/mutant_formula.png',
  hermit_elixir:         'assets/images/medical/hermit_elixir.png',
  universal_antidote:    'assets/images/medical/universal_antidote.png',
  veterinary_tranquilizer: 'assets/images/medical/veterinary_tranquilizer.png',
  combat_stimulant:      'assets/images/medical/combat_stimulant.png',
  experimental_antiviral: 'assets/images/medical/experimental_antiviral.png',
  completed_antiviral:   'assets/images/medical/completed_antiviral.png',
  advanced_trauma_kit:   'assets/images/medical/advanced_trauma_kit.png',
  field_transfusion_kit: 'assets/images/medical/field_transfusion_kit.png',
  immunity_serum:        'assets/images/medical/immunity_serum.png',
  vaccine:               'assets/images/medical/vaccine.png',
  alcohol_swab:          'assets/images/medical/alcohol_swab.png',
  stimulant:             'assets/images/medical/stimulant.png',

  // 무기
  knife:                 'assets/images/weapons/knife.png',
  sharpened_knife:       'assets/images/weapons/sharpened_knife.png',
  machete:               'assets/images/weapons/machete.png',
  hand_axe:              'assets/images/weapons/hand_axe.png',
  spear:                 'assets/images/weapons/spear.png',
  iron_pipe:             'assets/images/weapons/iron_pipe.png',
  spiked_pipe:           'assets/images/weapons/spiked_pipe.png',
  sling:                 'assets/images/weapons/sling.png',
  crossbow:              'assets/images/weapons/crossbow.png',
  crossbow_bolt:         'assets/images/weapons/crossbow_bolt.png',
  explosive_bolt:        'assets/images/weapons/explosive_bolt.png',
  fire_bolt:             'assets/images/weapons/fire_bolt.png',
  pistol:                'assets/images/weapons/pistol.png',
  pistol_ammo:           'assets/images/weapons/pistol_ammo.png',
  shotgun:               'assets/images/weapons/shotgun.png',
  shotgun_ammo:          'assets/images/weapons/shotgun_ammo.png',
  rifle_ammo:            'assets/images/weapons/rifle_ammo.png',
  silenced_pistol:       'assets/images/weapons/silenced_pistol.png',
  confiscated_sniper:    'assets/images/weapons/confiscated_sniper.png',
  warlord_rifle:         'assets/images/weapons/warlord_rifle.png',
  baseball_bat:          'assets/images/weapons/baseball_bat.png',
  reinforced_bat:        'assets/images/weapons/reinforced_bat.png',
  ultra_reinforced_bat:  'assets/images/weapons/ultra_reinforced_bat.png',
  torch:                 'assets/images/weapons/torch.png',
  stun_gun:              'assets/images/weapons/stun_gun.png',
  molotov_cocktail:      'assets/images/weapons/molotov_cocktail.png',
  nail_bomb:             'assets/images/weapons/nail_bomb.png',
  flashbang:             'assets/images/weapons/flashbang.png',
  smoke_bomb:            'assets/images/weapons/smoke_bomb.png',
  directional_mine:      'assets/images/weapons/directional_mine.png',
  electric_blade:        'assets/images/weapons/electric_blade.png',
  frost_blade:           'assets/images/weapons/frost_blade.png',
  acid_whip:             'assets/images/weapons/acid_whip.png',
  acid_crystal:          'assets/images/weapons/acid_crystal.png',
  royal_katana:          'assets/images/weapons/royal_katana.png',
  spike_trap:            'assets/images/weapons/spike_trap.png',
  alarm_trap:            'assets/images/weapons/alarm_trap.png',

  // 방어구
  helmet:                'assets/images/armor/helmet.png',
  combat_boots:          'assets/images/armor/combat_boots.png',
  hiking_boots:          'assets/images/armor/hiking_boots.png',
  running_shoes:         'assets/images/armor/running_shoes.png',
  raincoat:              'assets/images/armor/raincoat.png',
  warm_clothes:          'assets/images/armor/warm_clothes.png',
  work_gloves:           'assets/images/armor/work_gloves.png',
  hazmat_boots:          'assets/images/armor/hazmat_boots.png',
  fireproof_suit:        'assets/images/armor/fireproof_suit.png',
  extreme_cold_suit:     'assets/images/armor/extreme_cold_suit.png',
  stealth_suit:          'assets/images/armor/stealth_suit.png',
  crocodile_scale_armor: 'assets/images/armor/crocodile_scale_armor.png',
  dragon_scale_vest:     'assets/images/armor/dragon_scale_vest.png',
  acid_resistant_cloak:  'assets/images/armor/acid_resistant_cloak.png',
  tactical_vest:         'assets/images/armor/tactical_vest.png',
  kevlar_fabric:         'assets/images/armor/kevlar_fabric.png',
  makeshift_shield:      'assets/images/armor/makeshift_shield.png',
  reinforced_shield:     'assets/images/weapons/reinforced_shield.png',
  m4_carbine:            'assets/images/weapons/m4_carbine.png',
  shield:                'assets/images/armor/shield.png',
  ghillie_suit:          'assets/images/armor/ghillie_suit.png',
  hazmat_suit:           'assets/images/armor/hazmat_suit.png',

  // 도구
  flashlight:            'assets/images/tools/flashlight.png',
  compass:               'assets/images/tools/compass.png',
  fishing_rod:           'assets/images/tools/fishing_rod.png',
  binoculars:            'assets/images/tools/binoculars.png',
  lockpick:              'assets/images/tools/lockpick.png',
  lighter:               'assets/images/tools/lighter.png',
  oil_lamp:              'assets/images/tools/oil_lamp.png',
  crowbar:               'assets/images/tools/crowbar.png',
  pipe_wrench:           'assets/images/tools/pipe_wrench.png',
  whetstone:             'assets/images/tools/whetstone.png',
  radio:                 'assets/images/tools/radio.png',
  military_radio_kit:    'assets/images/tools/military_radio_kit.png',
  gas_mask:              'assets/images/tools/gas_mask.png',
  gas_mask_filter:       'assets/images/tools/gas_mask_filter.png',
  water_filter:          'assets/images/tools/water_filter.png',
  sniper_scope:          'assets/images/tools/sniper_scope.png',
  sound_dampener:        'assets/images/tools/sound_dampener.png',
  map_fragment:          'assets/images/tools/map_fragment.png',
  survival_journal:      'assets/images/tools/survival_journal.png',
  survivor_note:         'assets/images/tools/survivor_note.png',
  rope_ladder:           'assets/images/tools/rope_ladder.png',
  battery:               'assets/images/tools/battery.png',
  nuclear_battery:       'assets/images/tools/nuclear_battery.png',
  broadcast_equipment:   'assets/images/tools/broadcast_equipment.png',
  master_toolkit:        'assets/images/tools/master_toolkit.png',

  // 잔해/오브젝트
  broken_chair:           'assets/images/debris/broken_chair.png',
  broken_lamp:            'assets/images/debris/broken_lamp.png',
  broken_radio:           'assets/images/debris/broken_radio.png',
  broken_washing_machine: 'assets/images/debris/broken_washing_machine.png',
  abandoned_fridge:       'assets/images/debris/abandoned_fridge.png',
  old_ac_unit:            'assets/images/debris/old_ac_unit.png',
  old_fire_extinguisher:  'assets/images/debris/old_fire_extinguisher.png',
  old_mailbox:            'assets/images/debris/old_mailbox.png',
  wrecked_bicycle:        'assets/images/debris/wrecked_bicycle.png',
  wrecked_bus:            'assets/images/debris/wrecked_bus.png',
  wrecked_car:            'assets/images/debris/wrecked_car.png',
  destroyed_kiosk:        'assets/images/debris/destroyed_kiosk.png',
  traffic_light:          'assets/images/debris/traffic_light.png',
  collapsed_guard_post:   'assets/images/debris/collapsed_guard_post.png',
  collapsed_scaffold:     'assets/images/debris/collapsed_scaffold.png',
  collapsed_shelf:        'assets/images/debris/collapsed_shelf.png',
  telephone_booth:        'assets/images/debris/telephone_booth.png',
  street_vendor_cart:     'assets/images/debris/street_vendor_cart.png',
  vending_machine:        'assets/images/debris/vending_machine.png',
  subway_gate:            'assets/images/debris/subway_gate.png',
  rusted_toolbox:         'assets/images/debris/rusted_toolbox.png',

  // 가방
  backpack:              'assets/images/bags/backpack.png',
  small_bag:             'assets/images/bags/small_bag.png',
  duffel_bag:            'assets/images/bags/duffel_bag.png',
  messenger_bag:         'assets/images/bags/messenger_bag.png',
  military_bag:          'assets/images/bags/military_bag.png',
  waterproof_container:  'assets/images/bags/waterproof_container.png',
  storage_box:           'assets/images/bags/storage_box.png',
  fuel_can:              'assets/images/bags/fuel_can.png',

  // 구조물
  campfire:              'assets/images/structures/campfire.png',
  medical_station:       'assets/images/structures/medical_station.png',
  workbench:             'assets/images/structures/workbench.png',
  barricade:             'assets/images/structures/barricade.png',
  fireproof_barricade:   'assets/images/structures/fireproof_barricade.png',
  reinforced_shelter:    'assets/images/structures/reinforced_shelter.png',
  garden:                'assets/images/structures/garden.png',
  field_laboratory:      'assets/images/structures/field_laboratory.png',
  solar_generator:       'assets/images/structures/solar_generator.png',
  emergency_generator:   'assets/images/structures/emergency_generator.png',
  old_generator:         'assets/images/structures/old_generator.png',
  rain_collector:        'assets/images/structures/rain_collector.png',
  water_purifier:        'assets/images/structures/water_purifier.png',
  ammo_press:            'assets/images/structures/ammo_press.png',
  auto_turret:           'assets/images/structures/auto_turret.png',
  thorn_wire:            'assets/images/structures/thorn_wire.png',
  water_trap:            'assets/images/structures/water_trap.png',
  master_forge:          'assets/images/structures/master_forge.png',
  industrial_purifier:   'assets/images/structures/industrial_purifier.png',

  // 특수
  engineer_gear:         'assets/images/special/engineer_gear.png',
  soldier_dogtag:        'assets/images/special/soldier_dogtag.png',
  crew_pass:             'assets/images/special/crew_pass.png',
  debt_ledger:           'assets/images/special/debt_ledger.png',
  civil_defense_cache:   'assets/images/special/civil_defense_cache.png',
  cult_talisman:         'assets/images/special/cult_talisman.png',
  doctor_badge:          'assets/images/special/doctor_badge.png',
  firefighter_badge:     'assets/images/special/firefighter_badge.png',
  seoul_emergency_plan:  'assets/images/special/seoul_emergency_plan.png',
  virus_sample:          'assets/images/special/virus_sample.png',
  aircraft_parts:        'assets/images/special/aircraft_parts.png',
  river_boat:            'assets/images/special/river_boat.png',
  survivors_cache:       'assets/images/special/survivors_cache.png',
  helicopter_key:        'assets/images/special/helicopter_key.png',
  conductor_key:         'assets/images/special/conductor_key.png',
  gold_watch:            'assets/images/special/gold_watch.png',
  gold_watch_raw:        'assets/images/special/gold_watch_raw.png',
  mothers_necklace:      'assets/images/special/mothers_necklace.png',
  warlord_medal:         'assets/images/special/warlord_medal.png',

  // 전설 아이템 (보스 드롭 재료 & 소모품)
  colossus_core:         'assets/images/legendary/colossus_core.png',
  cryo_core:             'assets/images/legendary/cryo_core.png',
  inferno_core:          'assets/images/legendary/inferno_core.png',
  wraith_essence:        'assets/images/legendary/wraith_essence.png',
  horde_crown:           'assets/images/legendary/horde_crown.png',
  acid_gland:            'assets/images/legendary/acid_gland.png',
  alpha_fang:            'assets/images/legendary/alpha_fang.png',
  tiger_fang:            'assets/images/legendary/tiger_fang.png',
  tiger_fang_necklace:   'assets/images/legendary/tiger_fang_necklace.png',
  leviathan_scale:       'assets/images/legendary/leviathan_scale.png',
  sewer_scale:           'assets/images/legendary/sewer_scale.png',
  queen_pheromone:       'assets/images/legendary/queen_pheromone.png',
  mutant_heart:          'assets/images/legendary/mutant_heart.png',
  ai_chip:               'assets/images/legendary/ai_chip.png',
  royal_jelly_medicine:  'assets/images/legendary/royal_jelly_medicine.png',
  zero_strain:           'assets/images/legendary/zero_strain.png',

  // 환경 카드
  env_sunny:                   'assets/images/environment/env_sunny.png',
  env_cloudy:                  'assets/images/environment/env_cloudy.png',
  env_rainy:                   'assets/images/environment/env_rainy.png',
  env_foggy:                   'assets/images/environment/env_foggy.png',
  env_snow:                    'assets/images/environment/env_snow.png',
  env_storm:                   'assets/images/environment/env_storm.png',
  env_overcast:                'assets/images/environment/env_overcast.png',
  env_hot:                     'assets/images/environment/env_hot.png',
  env_windy:                   'assets/images/environment/env_windy.png',
  env_monsoon:                 'assets/images/environment/env_monsoon.png',
  env_clear:                   'assets/images/environment/env_clear.png',
  env_blizzard:                'assets/images/environment/env_blizzard.png',
  env_acid_rain:               'assets/images/environment/env_acid_rain.png',
  env_event_heatwave:          'assets/images/environment/env_event_heatwave.png',
  env_event_extreme_cold:      'assets/images/environment/env_event_extreme_cold.png',
  env_event_drought:           'assets/images/environment/env_event_drought.png',
  env_event_frost:             'assets/images/environment/env_event_frost.png',
  env_event_monsoon_heavy:     'assets/images/environment/env_event_monsoon_heavy.png',
  env_event_typhoon:           'assets/images/environment/env_event_typhoon.png',
  env_event_pollen:            'assets/images/environment/env_event_pollen.png',
  env_event_spring_rain:       'assets/images/environment/env_event_spring_rain.png',
  env_event_warmth:            'assets/images/environment/env_event_warmth.png',
  env_event_zombie_migration:  'assets/images/environment/env_event_zombie_migration.png',
};

const CardFactory = {
  images: CARD_IMAGES,
  locationImages: LOCATION_IMAGES,

  build(instanceId) {
    const inst = GameState.cards[instanceId];
    if (!inst) return null;

    // ── 제작 진행 카드 ─────────────────────────────────────
    if (inst._crafting) {
      const def = GameData.items[inst.definitionId];
      const el = document.createElement('div');
      el.dataset.instanceId   = instanceId;
      el.dataset.definitionId = inst.definitionId;
      el.className = 'card crafting-card spawning';
      el.draggable = false;
      el.innerHTML = this._buildCraftingInner(inst, def ?? {});
      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    const def  = GameData.items[inst.definitionId];
    if (!def)  return null;

    const el = document.createElement('div');
    el.dataset.instanceId   = instanceId;
    el.dataset.definitionId = inst.definitionId;
    el.dataset.rarity = def.rarity ?? 'common';
    el.dataset.type   = def.type   ?? 'material';

    // ── 장소 카드 ────────────────────────────────────────────
    if (def.type === 'location') {
      // ── 세부 장소 카드 (랜드마크 내부 탐색 슬롯) ─────────
      if (def.sublocation) {
        el.className = 'card location-card sublocation-card spawning';
        el.draggable = false;
        el.style.cursor = 'pointer';
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${def.name ?? ''} 세부 장소`);
        el.innerHTML = this._buildSubLocationInner(def);
        el.addEventListener('click', () => {
          EventBus.emit('sublocationRequest', { districtId: def.districtId, subLocationId: def.subLocationId });
        });
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            EventBus.emit('sublocationRequest', { districtId: def.districtId, subLocationId: def.subLocationId });
          }
        });
        el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
        return el;
      }

      if (def.landmark) {
        const districtId = def.id?.replace(/^lm_/, '');
        const isCurrent  = GameState.location.currentDistrict === districtId;

        el.className = `card location-card landmark-card spawning${isCurrent ? ' is-current-loc' : ''}`;
        el.draggable = false;
        el.style.cursor = 'pointer';
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${def.name ?? ''} 랜드마크${isCurrent ? ' (현재 위치)' : ''}`);
        el.innerHTML = this._buildLandmarkInner(def, isCurrent);

        if (isCurrent) {
          // 현재 구 랜드마크 → 랜드마크 진입
          el.addEventListener('click', () => {
            if (districtId) EventBus.emit('landmarkRequest', { districtId });
          });
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (districtId) EventBus.emit('landmarkRequest', { districtId });
            }
          });
        } else {
          // 다른 구 랜드마크 → 해당 구로 이동 (travel card)
          el.addEventListener('click', () => {
            if (districtId) EventBus.emit('travelRequest', { nodeId: districtId });
          });
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (districtId) EventBus.emit('travelRequest', { nodeId: districtId });
            }
          });
        }

        el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
        return el;
      }

      // 현재 위치 카드: 랜드마크 내부라면 귀환 버튼, 그 외 클릭 불가
      const isCurrent = GameState.location.currentDistrict === def.nodeId;
      el.className = `card location-card spawning${isCurrent ? ' is-current-loc' : ''}`;
      el.draggable = false;
      el.innerHTML = this._buildLocationInner(def);

      if (!isCurrent) {
        el.style.cursor = 'pointer';
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${def.name ?? ''} 위치로 이동`);
        el.addEventListener('click', () => {
          EventBus.emit('travelRequest', { nodeId: def.nodeId });
        });
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            EventBus.emit('travelRequest', { nodeId: def.nodeId });
          }
        });
      } else {
        // 랜드마크 내부에서 현재 구 카드 클릭 → 귀환
        if (GameState.location.currentLandmark) {
          el.style.cursor = 'pointer';
          el.classList.add('landmark-return');
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', `${def.name ?? ''} — 귀환`);
          el.addEventListener('click', () => {
            EventBus.emit('exitLandmarkRequest', {});
          });
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              EventBus.emit('exitLandmarkRequest', {});
            }
          });
        } else {
          el.style.cursor = 'default';
          el.setAttribute('role', 'img');
          el.setAttribute('aria-label', `${def.name ?? ''} (현재 위치)`);
        }
      }

      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    // ── 환경 카드 (날씨 / 이벤트) ─────────────────────────────
    if (def.type === 'environment') {
      el.className = `card environment-card env-${def.subtype ?? 'weather'} spawning`;
      el.draggable = false;
      el.style.cursor = 'default';
      el.title = def.description ?? '';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', `${I18n.itemName(inst.definitionId, def.name)} 환경 효과`);
      el.innerHTML = this._buildEnvironmentInner(inst, def);
      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    // ── NPC 카드 ─────────────────────────────────────────────────
    if (def.type === 'npc') {
      el.className = 'card npc-card spawning';
      el.draggable = false;
      el.style.cursor = 'pointer';
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${I18n.itemName(inst.definitionId, def.name)} NPC — 대화`);
      el.innerHTML = this._buildNPCInner(inst, def);
      el.addEventListener('dblclick', e => {
        e.stopPropagation();
        EventBus.emit('openNPCDialogue', { npcId: inst.definitionId });
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          EventBus.emit('openNPCDialogue', { npcId: inst.definitionId });
        }
      });
      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    // ── 일반 카드 ────────────────────────────────────────────
    el.title = def.description ?? '';  // 일반 카드만 설명 툴팁
    el.className = 'card spawning';
    el.draggable = true;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${I18n.itemName(inst.definitionId, def.name)} 카드`);
    if (inst._quality && inst._quality !== 'normal') {
      el.dataset.quality = inst._quality;
    }
    el.innerHTML = this._buildInner(inst, def);

    // 이미지 로드 실패 시 이모지 폴백
    const cardImg = el.querySelector('.card-img');
    if (cardImg) {
      cardImg.onerror = () => {
        const art = cardImg.closest('.card-art--img');
        if (art) {
          art.className = 'card-art';
          art.textContent = def.icon ?? '📦';
        }
      };
    }

    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      this._onDoubleClick(instanceId, def);
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      this._onRightClick(instanceId, def, e);
    });

    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this._onDoubleClick(instanceId, def);
      }
    });

    el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
    return el;
  },

  // ── 장소 카드 내부 HTML ──────────────────────────────────

  _buildLandmarkInner(def, isCurrent = false) {
    const lmImg = LANDMARK_IMAGES[def.id] ?? null;
    const lmBg  = lmImg ? `style="background-image:url('${lmImg}');background-size:cover;background-position:center;"` : '';

    if (isCurrent) {
      return `
        <div class="lc-header lm-header">
          <span class="lm-badge">${I18n.t('card.landmark')}</span>
        </div>
        <div class="lc-scene" ${lmBg}></div>
        <div class="lc-name">${I18n.itemName(def.id, def.name)}</div>
        <div class="lm-bonus">${def.landmarkBonus ?? ''}</div>
      `;
    }

    const districtId = def.id?.replace(/^lm_/, '');
    const district   = GameData?.districts?.[districtId];
    const danger     = district?.dangerLevel ?? 0;
    const color      = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const dangerDots = '●'.repeat(danger) + '○'.repeat(Math.max(0, 3 - danger));
    const costTP     = district?.travelCostTP ?? 2;
    const encPct     = district ? Math.round((district.encounterChance ?? 0) * 100) : 0;

    return `
      <div class="lc-header lm-header">
        <span class="lm-badge">${I18n.t('card.landmark')}</span>
      </div>
      <div class="lc-scene" ${lmBg}></div>
      <div class="lc-name">${I18n.itemName(def.id, def.name)}</div>
      <div class="lc-danger" style="color:${color};">${dangerDots}</div>
      <div class="lc-meta">
        <span>${costTP}TP</span>
        <span>${encPct > 0 ? I18n.t('card.encounter', { pct: encPct }) : I18n.t('card.safe')}</span>
      </div>
    `;
  },

  _buildLocationInner(def) {
    const gs         = GameState;
    const isCurrent  = (gs.location.currentDistrict ?? gs.location.currentNode) === def.nodeId;
    const isVisited  = gs.location.districtsVisited?.includes(def.nodeId) ?? gs.location.nodesVisited?.includes(def.nodeId);
    const danger     = def.dangerLevel ?? 0;
    const color      = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const dangerDots = '●'.repeat(danger) + '○'.repeat(Math.max(0, 3 - danger));

    const isInLandmark = !!GameState.location.currentLandmark;
    const currentBadge = isCurrent
      ? `<span class="lc-current-badge">${isInLandmark ? I18n.t('card.goBack') : I18n.t('card.currentLoc')}</span>` : '';
    const visitedDot = isVisited && !isCurrent
      ? `<span class="lc-visited-dot">✓</span>` : '';
    const encounterText = def.encounterChance > 0
      ? I18n.t('card.encounter', { pct: Math.round(def.encounterChance * 100) }) : I18n.t('card.safe');
    const tpText = def.travelCostTP > 0
      ? `${def.travelCostTP}TP` : 'Free';

    const locImg = LOCATION_IMAGES[def.subtype] ?? null;
    const locBg  = locImg ? `style="background-image:url('${locImg}');background-size:cover;background-position:center;"` : '';

    return `
      <div class="lc-header" style="border-bottom-color:${color}22;">
        ${currentBadge}${visitedDot}
      </div>
      <div class="lc-scene" ${locBg}></div>
      <div class="lc-name">${I18n.districtName(def.nodeId, def.name)}</div>
      <div class="lc-danger" style="color:${color};">
        ${dangerDots}
      </div>
      <div class="lc-meta">
        <span>${tpText}</span>
        <span>${encounterText}</span>
      </div>
    `;
  },

  // ── 세부 장소 카드 내부 HTML ─────────────────────────────

  _buildSubLocationInner(def) {
    const dangerPct   = Math.round((def.dangerMod ?? 0) * 100);
    const dangerColor = dangerPct <= 10 ? '#449944' : dangerPct <= 20 ? '#cc8822' : '#cc3333';
    return `
      <div class="lc-header">
        <span class="lm-badge">${I18n.t('card.interior')}</span>
      </div>
      <div class="lc-icon">${def.icon}</div>
      <div class="lc-name">${I18n.itemName(def.id ?? def.subLocationId, def.name)}</div>
      <div class="lc-danger" style="color:${dangerColor}; font-size:9px; margin-top:2px;">
        ${dangerPct > 0 ? I18n.t('card.dangerHigh', { pct: dangerPct }) : I18n.t('card.dangerLow')}
      </div>
      <div class="lc-meta">
        <span>${I18n.t('card.explore')}</span>
        <span>1TP</span>
      </div>
    `;
  },

  // ── 환경 카드 내부 HTML ─────────────────────────────────

  _buildEnvironmentInner(inst, def) {
    const isEvent   = def.subtype === 'event';
    const isDanger  = def.tags?.includes('danger');
    const remaining = inst._envTpRemaining ?? 0;
    const total     = inst._envTpTotal ?? 1;
    const pct       = total > 0 ? Math.round((remaining / total) * 100) : 0;

    // 이벤트 카드: 남은 시간 바 표시
    const durationBar = isEvent
      ? `<div class="env-duration">
           <div class="env-duration-fill${isDanger ? ' env-danger' : ''}" style="width:${pct}%"></div>
         </div>
         <div class="env-remaining">${Math.ceil(remaining / 72)}${I18n.t('env.daysLeft')}</div>`
      : '';

    // 날씨 카드: 인터랙션 힌트
    const hintTags = [];
    if (def.tags?.includes('water_source')) hintTags.push(I18n.t('env.waterCollect'));
    if (def.tags?.includes('heat'))         hintTags.push(I18n.t('env.heatWarning'));
    if (def.tags?.includes('cold'))         hintTags.push(I18n.t('env.coldWarning'));
    if (def.tags?.includes('contamination')) hintTags.push(I18n.t('env.contamWarning'));

    const hintHtml = hintTags.length > 0
      ? `<div class="env-hints">${hintTags.map(h => `<span class="env-hint-tag">${h}</span>`).join('')}</div>`
      : '';

    return `
      <div class="env-header${isDanger ? ' env-header-danger' : ''}">
        <span class="env-type-badge">${isEvent ? I18n.t('env.event') : I18n.t('env.weather')}</span>
      </div>
      <div class="env-icon">${def.icon ?? '🌤'}</div>
      <div class="env-name">${I18n.itemName(def.id, def.name)}</div>
      ${hintHtml}
      ${durationBar}
    `;
  },

  // ── NPC 카드 내부 HTML ───────────────────────────────────

  _buildNPCInner(inst, def) {
    // Lazy-read NPC state for companion badge
    const npcState = SystemRegistry.get('NPCSystem')?.getNPCState?.(inst.definitionId);
    const isCompanion = npcState?.isCompanion ?? false;
    const trust = npcState?.trust ?? 0;
    const trustStars = '★'.repeat(trust) + '☆'.repeat(Math.max(0, 5 - trust));

    // NPC HP bar (for companions)
    const npcDef = SystemRegistry.get('NPCSystem')?.getNPCDef?.(inst.definitionId);
    const maxHp = npcDef?.maxHp ?? 50;
    const currentHp = npcState?.hp ?? maxHp;
    const hpPct = Math.round((currentHp / maxHp) * 100);
    const hpCls = hpPct > 60 ? 'hp-good' : hpPct > 30 ? 'hp-warn' : 'hp-crit';
    const hpBar = isCompanion
      ? `<div class="npc-card-hp"><div class="npc-hp-bar ${hpCls}" style="width:${hpPct}%"></div><span class="npc-hp-text">${currentHp}/${maxHp}</span></div>`
      : '';

    return `
      <div class="npc-card-header">
        <span class="npc-type-badge">${I18n.t('npc.badge')}</span>
        ${isCompanion ? `<span class="npc-companion-tag">${I18n.t('npc.companionBadge')}</span>` : ''}
      </div>
      <div class="npc-card-icon">${def.icon ?? '👤'}</div>
      <div class="npc-card-name">${I18n.itemName(def.id, def.name)}</div>
      <div class="npc-card-trust">${trustStars}</div>
      ${hpBar}
      <div class="npc-card-hint">${I18n.t('npc.clickHint')}</div>
    `;
  },

  // ── 일반 카드 내부 HTML ──────────────────────────────────

  _buildInner(inst, def) {
    const durPct   = Math.round(inst.durability ?? 100);
    const durClass = durPct > 50 ? '' : durPct > 25 ? 'low' : 'crit';
    const hasDur   = def.defaultDurability != null && def.type !== 'consumable';
    const qty      = inst.quantity ?? 1;

    // ── 이름 옆 남은 표시 ──────────────────────────────────
    // 소모품: 스택 수량 (×N)
    // 내구도 아이템: 내구도% (< 100일 때만)
    let nameRemainder = '';
    if (def.type === 'consumable' && def.stackable) {
      // 스택 가능 소모품: 항상 수량 표시 (×1 포함)
      nameRemainder = `<span class="card-name-qty">×${qty}</span>`;
    } else if (hasDur && durPct < 100) {
      nameRemainder = `<span class="card-name-dur ${durClass}">${durPct}%</span>`;
    }

    const contam = inst.contamination ?? 0;
    const contamBadge = contam > 0
      ? `<span class="card-contamination" title="${I18n.t('card.contamination', { pct: contam })}">☣</span>` : '';

    const quality = inst._quality;
    const qualityBadge = (quality && quality !== 'normal' && QUALITY_LABELS[quality])
      ? `<span class="card-quality-badge quality-${quality}">${QUALITY_LABELS[quality]}</span>`
      : '';

    // 스택 배지: 소모품이 아닌 stackable (수량 뱃지가 이름에 없는 경우)
    const stackBadge = (def.stackable && qty > 1 && def.type !== 'consumable')
      ? `<span class="card-stack">×${qty}</span>` : '';

    const weightBadge = def.weight
      ? `<span class="card-weight">${def.weight}kg</span>` : '';

    const durBar = hasDur ? `
      <div class="card-durability">
        <div class="card-durability-fill ${durClass}" style="width:${durPct}%"></div>
      </div>` : '';

    let statsHtml = '';
    if (def.onConsume) {
      const e = def.onConsume;
      const parts = [];
      if (e.hydration > 0) parts.push(`💧+${e.hydration}`);
      if (e.nutrition  > 0) parts.push(`🥗+${e.nutrition}`);
      if (e.hp         > 0) parts.push(`❤️+${e.hp}`);
      if (e.fatigue    < 0) parts.push(`😴${e.fatigue}`);
      if (parts.length) statsHtml = `<div class="card-stats">${parts.map(p => `<span class="card-stat">${p}</span>`).join('')}</div>`;
    }
    if (def.combat) {
      const [dMin, dMax] = def.combat.damage ?? [0, 0];
      const qMult = QUALITY_MULT[inst._quality] ?? 1.0;
      const adjMin = Math.round(dMin * qMult);
      const adjMax = Math.round(dMax * qMult);
      statsHtml = `<div class="card-stats"><span class="card-stat">⚔${adjMin}-${adjMax}</span><span class="card-stat">🔊${def.combat.noiseOnUse}</span></div>`;
    }

    const imgSrc = CARD_IMAGES[inst.definitionId] ?? null;
    const artHtml = imgSrc
      ? `<div class="card-art card-art--img"><img class="card-img" src="${imgSrc}" alt="${def.name ?? ''}"></div>`
      : `<div class="card-art">${def.icon ?? '📦'}</div>`;

    return `
      <div class="card-header">
        <span class="card-icon">${def.icon ?? '📦'}</span>
        <span class="card-name">${I18n.itemName(def.id ?? inst.definitionId, def.name)}${nameRemainder ? ' ' : ''}${nameRemainder}</span>
        ${qualityBadge}${contamBadge}
      </div>
      <div class="card-body">
        <div class="card-type-row">
          <span class="card-type-badge">${def.subtype ?? def.type}</span>
          ${statsHtml}
        </div>
        ${artHtml}
        ${durBar}
      </div>
      <div class="card-footer">
        ${weightBadge}
        ${stackBadge}
      </div>
    `;
  },

  // ── 제작 진행 카드 내부 HTML ─────────────────────────────
  _buildCraftingInner(inst, def) {
    const ce = inst._craftEntry;
    if (!ce) return '';

    const consumed   = ce.completedTp + (ce.tpTotal - ce.tpRemaining);
    const overallPct = ce.totalTpAll > 0 ? (consumed / ce.totalTpAll * 100) : 0;

    const stageInfo = ce.totalStages > 1
      ? `${ce.stageIndex + 1}/${ce.totalStages} — ${ce.stageLabel}`
      : ce.stageLabel;

    return `
      <div class="card-header">
        <span class="card-icon">⚒️</span>
        <span class="card-name">${I18n.blueprintName(ce.blueprintId, ce.blueprintName)}</span>
      </div>
      <div class="card-body">
        <span class="card-type-badge">${I18n.t('card.crafting')}</span>
        <div class="card-art">${def?.icon ?? '📦'}</div>
        <div class="crafting-stage-label">${stageInfo}</div>
        <div class="craft-progress-track">
          <div class="craft-progress-fill" style="width:${overallPct.toFixed(1)}%"></div>
        </div>
      </div>
      <div class="card-footer">
        <span class="crafting-tp-label">${I18n.t('card.tpRemaining', { tp: ce.tpRemaining })}</span>
      </div>
    `;
  },

  _onDoubleClick(instanceId, def) {
    // 소비 아이템이든 장착 아이템이든 항상 커스텀 모달로 통일
    EventBus.emit('openCardInspect', { instanceId });
  },

  _onRightClick(instanceId, def, e) {
    EventBus.emit('openCardInspect', { instanceId });
  },

  update(instanceId) {
    const el = document.querySelector(`[data-instance-id="${instanceId}"]`);
    if (!el) return;
    const inst = GameState.cards[instanceId];
    if (!inst) { el.remove(); return; }

    if (inst._crafting) {
      const def = GameData.items[inst.definitionId];
      el.innerHTML = this._buildCraftingInner(inst, def ?? {});
      return;
    }

    const def = GameData.items[inst.definitionId];
    if (!def) return;

    if (def.type === 'location') {
      if (def.landmark) {
        const districtId = def.id?.replace(/^lm_/, '');
        const isCurrent  = GameState.location.currentDistrict === districtId;
        el.innerHTML = this._buildLandmarkInner(def, isCurrent);
        if (isCurrent) el.classList.add('is-current-loc');
        else            el.classList.remove('is-current-loc');
      } else {
        el.innerHTML = this._buildLocationInner(def);
      }
    } else if (def.type === 'npc') {
      el.innerHTML = this._buildNPCInner(inst, def);
    } else {
      // 품질 data 속성 동기화
      if (inst._quality && inst._quality !== 'normal') el.dataset.quality = inst._quality;
      else delete el.dataset.quality;
      el.innerHTML = this._buildInner(inst, def);
    }
  },
};

export default CardFactory;
