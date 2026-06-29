import GameState from '../core/GameState.js';

const IMG = './assets/images/';

function state(src) {
  return { src: `${IMG}${src}`, frames: 1, fps: 1 };
}

function sprite(id, role, src, width, height, anchor = { x: 0.5, y: 1 }) {
  return {
    id,
    role,
    width,
    height,
    anchor,
    states: {
      idle: state(src),
      attack: null,
      hit: null,
      death: null,
    },
  };
}

function spriteWithAttack(id, role, src, attackSrc, width, height, anchor = { x: 0.5, y: 1 }) {
  const definition = sprite(id, role, src, width, height, anchor);
  definition.states.attack = state(attackSrc);
  return definition;
}

function spriteWithHit(id, role, src, hitSrc, width, height, anchor = { x: 0.5, y: 1 }) {
  const definition = sprite(id, role, src, width, height, anchor);
  definition.states.hit = state(hitSrc);
  return definition;
}

function spriteWithAttackAndHit(id, role, src, attackSrc, hitSrc, width, height, anchor = { x: 0.5, y: 1 }) {
  const definition = spriteWithAttack(id, role, src, attackSrc, width, height, anchor);
  definition.states.hit = state(hitSrc);
  return definition;
}

function equippedWeaponDefinition() {
  const instanceId = GameState.player?.equipped?.weapon_main
    ?? GameState.player?.equipped?.weapon_sub
    ?? null;
  if (!instanceId) return null;

  const card = GameState.cards?.[instanceId] ?? null;
  const definition = typeof GameState.getCardDef === 'function'
    ? GameState.getCardDef(instanceId)
    : null;

  return {
    instanceId,
    definitionId: definition?.id ?? card?.definitionId ?? instanceId,
    definition,
  };
}

function playerSpriteIdFromEquipment() {
  const equipped = equippedWeaponDefinition();
  if (!equipped) return 'player_unarmed';

  const definitionId = equipped.definitionId;
  const definition = equipped.definition ?? {};
  const subtype = definition.subtype;
  const weaponType = definition.weaponType;
  const tags = Array.isArray(definition.tags) ? definition.tags : [];

  if (definitionId === 'combat_scalpel' || definitionId === 'scalpel') return 'player_scalpel';
  if (
    definitionId === 'baseball_bat'
    || definitionId === 'reinforced_bat'
    || definitionId === 'ultra_reinforced_bat'
  ) return 'player_bat';
  if (
    definitionId === 'pipe_wrench'
    || definitionId === 'pipe_wrench_improved'
    || definitionId === 'master_wrench'
    || definitionId === 'wrench'
  ) return 'player_spanner';
  if (
    definitionId === 'knife'
    || definitionId === 'sharpened_knife'
    || definitionId === 'machete'
    || definitionId === 'master_blade'
    || definitionId === 'katana'
    || weaponType === 'blade'
  ) return 'player_knife';
  if (subtype === 'firearm' || subtype === 'ranged' || tags.includes('firearm')) return 'player_rifle';
  if (weaponType === 'blunt' || tags.includes('tool')) return 'player_spanner';

  return 'player_unarmed';
}

export const COMBAT_ASSETS = {
  defaultSceneId: 'jongno_subway_ruin',
  scenes: {
    jongno_subway_ruin: {
      id: 'jongno_subway_ruin',
      backdrop: `${IMG}combat_empty_battlefield.png`,
      stagePlate: `${IMG}combat_empty_stage_plate.png`,
      cardFrame: `${IMG}combat_sample_card_frame_reference.png`,
    },
  },
  ui: {
    skillIcons: {
      strike: `${IMG}combat_sample_icon_fist.png`,
      punch: `${IMG}combat_sample_icon_fist.png`,
      blunt: `${IMG}combat_sample_icon_fist.png`,
      guard: `${IMG}combat_sample_icon_fist.png`,
      shot: `${IMG}combat_sample_icon_rifle.png`,
      rifle: `${IMG}combat_sample_icon_rifle.png`,
      knife: `${IMG}combat_sample_icon_knife.png`,
      blade: `${IMG}combat_sample_icon_knife.png`,
      move: `${IMG}combat_sample_icon_move.png`,
      med: `${IMG}combat_sample_icon_bag.png`,
      token: `${IMG}combat_sample_icon_bag.png`,
      heal: `${IMG}combat_sample_icon_bag.png`,
      item: `${IMG}combat_sample_icon_bag.png`,
      skill: `${IMG}combat_sample_icon_fist.png`,
    },
  },
  sprites: {
    player_knife: spriteWithAttackAndHit(
      'player_knife',
      'ally',
      'combat_generated_pose_knife_v1.png',
      'combat_generated_pose_knife_attack_female_anim_v2.png',
      'combat_generated_pose_female_hit_anim_v1.png',
      520,
      360,
    ),
    player_scalpel: spriteWithHit('player_scalpel', 'ally', 'combat_generated_pose_scalpel_v1.png', 'combat_generated_pose_female_hit_anim_v1.png', 390, 360),
    player_unarmed: spriteWithHit('player_unarmed', 'ally', 'combat_generated_pose_unarmed_v1.png', 'combat_generated_pose_female_hit_anim_v1.png', 390, 360),
    player_spanner: spriteWithHit('player_spanner', 'ally', 'combat_generated_pose_spanner_v1.png', 'combat_generated_pose_female_hit_anim_v1.png', 390, 360),
    player_bat: spriteWithHit('player_bat', 'ally', 'combat_generated_pose_bat_v1.png', 'combat_generated_pose_female_hit_anim_v1.png', 390, 360),
    player_rifle: spriteWithHit('player_rifle', 'ally', 'combat_generated_survivor_rifle_v1.png', 'combat_generated_pose_female_hit_anim_v1.png', 390, 360),
    ally_pistol: sprite('ally_pistol', 'ally', 'combat_generated_survivor_pistol_v1.png', 250, 320),
    dog: sprite('dog', 'ally', 'combat_generated_survival_dog_v1.png', 170, 185),

    enemy_zombie_patient_dormant: sprite('enemy_zombie_patient_dormant', 'enemy', 'combat_generated_enemy_zombie_patient_dormant_v1.png', 185, 320),
    enemy_zombie_common: sprite('enemy_zombie_common', 'enemy', 'combat_generated_enemy_zombie_common_v1.png', 185, 320),
    enemy_zombie_runner: sprite('enemy_zombie_runner', 'enemy', 'combat_generated_enemy_zombie_runner_v1.png', 205, 305),
    enemy_zombie_brute: sprite('enemy_zombie_brute', 'enemy', 'combat_generated_enemy_zombie_brute_v1.png', 255, 335),
    enemy_raider: sprite('enemy_raider', 'enemy', 'combat_generated_enemy_raider_v1.png', 210, 315),
    enemy_raider_elite: sprite('enemy_raider_elite', 'enemy', 'combat_generated_enemy_raider_elite_v1.png', 225, 320),
    enemy_zombie_horde: sprite('enemy_zombie_horde', 'enemy', 'combat_generated_enemy_zombie_horde_v1.png', 260, 315),
    enemy_rabid_dog: sprite('enemy_rabid_dog', 'enemy', 'combat_generated_enemy_rabid_dog_v1.png', 220, 180),
    enemy_zombie_acid: sprite('enemy_zombie_acid', 'enemy', 'combat_generated_enemy_zombie_acid_v1.png', 200, 320),
    enemy_zombie_bloater: sprite('enemy_zombie_bloater', 'enemy', 'combat_generated_enemy_zombie_bloater_v1.png', 230, 330),
    enemy_zombie_screamer: sprite('enemy_zombie_screamer', 'enemy', 'combat_generated_enemy_zombie_screamer_v1.png', 180, 330),
    enemy_zombie_charger: sprite('enemy_zombie_charger', 'enemy', 'combat_generated_enemy_zombie_charger_v1.png', 230, 300),

    boss_patient_zero: sprite('boss_patient_zero', 'enemy', 'combat_generated_secret_boss_patient_zero_v1.png', 215, 345),
    boss_radiation_colossus: sprite('boss_radiation_colossus', 'enemy', 'combat_generated_secret_boss_radiation_colossus_v1.png', 290, 380),
    boss_acid_queen: sprite('boss_acid_queen', 'enemy', 'combat_generated_secret_boss_acid_queen_v1.png', 245, 360),
    boss_horde_mother: sprite('boss_horde_mother', 'enemy', 'combat_generated_secret_boss_horde_mother_v1.png', 270, 375),
    boss_frozen_giant: sprite('boss_frozen_giant', 'enemy', 'combat_generated_secret_boss_frozen_giant_v1.png', 260, 370),
    boss_fire_mutant: sprite('boss_fire_mutant', 'enemy', 'combat_generated_secret_boss_fire_mutant_v1.png', 235, 355),
    boss_rainstorm_beast: sprite('boss_rainstorm_beast', 'enemy', 'combat_generated_secret_boss_rainstorm_beast_v1.png', 245, 355),
    boss_acid_rain_horror: sprite('boss_acid_rain_horror', 'enemy', 'combat_generated_secret_boss_acid_rain_monster_v1.png', 255, 360),
    boss_raider_warlord: sprite('boss_raider_warlord', 'enemy', 'combat_generated_secret_boss_raider_warlord_v1.png', 260, 360),
    boss_phantom_sniper: sprite('boss_phantom_sniper', 'enemy', 'combat_generated_secret_boss_ghost_sniper_v1.png', 260, 360),
    boss_cult_leader: sprite('boss_cult_leader', 'enemy', 'combat_generated_secret_boss_cult_leader_v1.png', 225, 360),
    boss_mutant_alpha_tiger: sprite('boss_mutant_alpha_tiger', 'enemy', 'combat_generated_secret_boss_mutant_tiger_v1.png', 320, 220),
    boss_sewer_king: sprite('boss_sewer_king', 'enemy', 'combat_generated_secret_boss_sewer_king_v1.png', 360, 240),
    boss_swarm_queen_bee: sprite('boss_swarm_queen_bee', 'enemy', 'combat_generated_secret_boss_mutant_queen_bee_v1.png', 260, 330),
    boss_feral_dog_alpha: sprite('boss_feral_dog_alpha', 'enemy', 'combat_generated_secret_boss_wild_dog_alpha_v1.png', 220, 190),
    boss_penthouse_survivor: sprite('boss_penthouse_survivor', 'enemy', 'combat_generated_secret_boss_mad_chaebol_v1.png', 245, 360),
    boss_train_conductor: sprite('boss_train_conductor', 'enemy', 'combat_generated_secret_subway_phantom_v1.png', 245, 360),
    boss_military_ai: sprite('boss_military_ai', 'enemy', 'combat_generated_secret_boss_military_ai_drone_v1.png', 230, 150),
    boss_escaped_experiment: sprite('boss_escaped_experiment', 'enemy', 'combat_generated_secret_experiment_x_v1.png', 225, 360),
    boss_summer_inferno: sprite('boss_summer_inferno', 'enemy', 'combat_generated_secret_boss_fire_mutant_v1.png', 235, 355),
    boss_monsoon_leviathan: sprite('boss_monsoon_leviathan', 'enemy', 'combat_generated_secret_boss_rainstorm_beast_v1.png', 245, 355),
    boss_blizzard_wraith: sprite('boss_blizzard_wraith', 'enemy', 'combat_generated_secret_blizzard_wraith_v1.png', 220, 350),
    boss_soldier_nemesis: sprite('boss_soldier_nemesis', 'enemy', 'combat_generated_secret_deserted_comrade_v1.png', 225, 350),
    boss_firefighter_nemesis: sprite('boss_firefighter_nemesis', 'enemy', 'combat_generated_secret_infected_lee_jaehoon_v1.png', 245, 355),
    boss_homeless_nemesis: sprite('boss_homeless_nemesis', 'enemy', 'combat_generated_secret_debt_collector_v1.png', 230, 345),
    boss_chef_nemesis: sprite('boss_chef_nemesis', 'enemy', 'combat_generated_secret_mutant_chef_v1.png', 240, 350),
    boss_doctor_nemesis: sprite('boss_doctor_nemesis', 'enemy', 'combat_generated_secret_infected_doctor_v1.png', 225, 350),
    boss_engineer_rival: sprite('boss_engineer_rival', 'enemy', 'combat_generated_secret_mad_mechanic_v1.png', 230, 350),
    food_raider: sprite('food_raider', 'enemy', 'combat_generated_secret_food_raider_v1.png', 235, 345),
    black_market_dealer: sprite('black_market_dealer', 'enemy', 'combat_generated_secret_black_market_broker_v1.png', 255, 350),
    food_warlord: sprite('food_warlord', 'enemy', 'combat_generated_secret_food_warlord_v1.png', 280, 370),
    acid_spitter_elite: sprite('acid_spitter_elite', 'enemy', 'combat_generated_secret_acid_spitter_elite_v1.png', 245, 345),
    elite_bodyguard_raider: sprite('elite_bodyguard_raider', 'enemy', 'combat_generated_secret_elite_bodyguard_raider_v1.png', 245, 350),
    mutated_crocodile_variant: sprite('mutated_crocodile_variant', 'enemy', 'combat_generated_secret_mutated_crocodile_variant_v1.png', 360, 240),
  },
  actorMap: {
    player: {
      default: 'player_unarmed',
    },
    companions: {
      npc_dog: 'dog',
      npc_nurse: 'ally_pistol',
      npc_doctor: 'ally_pistol',
      npc_soldier: 'player_rifle',
      npc_soldier_deserter: 'player_rifle',
    },
    enemies: {
      zombie_patient_dormant: 'enemy_zombie_patient_dormant',
      zombie_common: 'enemy_zombie_common',
      zombie_runner: 'enemy_zombie_runner',
      zombie_brute: 'enemy_zombie_brute',
      raider: 'enemy_raider',
      raider_elite: 'enemy_raider_elite',
      zombie_horde: 'enemy_zombie_horde',
      rabid_dog: 'enemy_rabid_dog',
      zombie_acid: 'enemy_zombie_acid',
      zombie_bloater: 'enemy_zombie_bloater',
      zombie_screamer: 'enemy_zombie_screamer',
      zombie_charger: 'enemy_zombie_charger',

      boss_patient_zero: 'boss_patient_zero',
      boss_radiation_colossus: 'boss_radiation_colossus',
      boss_acid_queen: 'boss_acid_queen',
      boss_horde_mother: 'boss_horde_mother',
      boss_frozen_giant: 'boss_frozen_giant',
      boss_raider_warlord: 'boss_raider_warlord',
      boss_phantom_sniper: 'boss_phantom_sniper',
      boss_cult_leader: 'boss_cult_leader',
      boss_mutant_alpha_tiger: 'boss_mutant_alpha_tiger',
      boss_sewer_king: 'boss_sewer_king',
      boss_swarm_queen_bee: 'boss_swarm_queen_bee',
      boss_feral_dog_alpha: 'boss_feral_dog_alpha',
      boss_penthouse_survivor: 'boss_penthouse_survivor',
      boss_train_conductor: 'boss_train_conductor',
      boss_military_ai: 'boss_military_ai',
      boss_escaped_experiment: 'boss_escaped_experiment',
      boss_summer_inferno: 'boss_summer_inferno',
      boss_monsoon_leviathan: 'boss_monsoon_leviathan',
      boss_blizzard_wraith: 'boss_blizzard_wraith',
      boss_acid_rain_horror: 'boss_acid_rain_horror',
      boss_soldier_nemesis: 'boss_soldier_nemesis',
      boss_firefighter_nemesis: 'boss_firefighter_nemesis',
      boss_homeless_nemesis: 'boss_homeless_nemesis',
      boss_chef_nemesis: 'boss_chef_nemesis',
      boss_doctor_nemesis: 'boss_doctor_nemesis',
      boss_engineer_rival: 'boss_engineer_rival',
      food_raider: 'food_raider',
      black_market_dealer: 'black_market_dealer',
      food_warlord: 'food_warlord',
    },
  },
  motionStates: ['idle', 'attack', 'hit', 'death'],
};

export class CombatSpriteManifest {
  constructor(manifest) {
    this.manifest = manifest;
  }

  scene(sceneId) {
    return this.manifest.scenes[sceneId]
      ?? this.manifest.scenes[this.manifest.defaultSceneId];
  }

  skillIcon(iconId, fallbackId = 'item') {
    return this.manifest.ui.skillIcons[iconId]
      ?? this.manifest.ui.skillIcons[fallbackId]
      ?? null;
  }

  sprite(spriteId) {
    return this.manifest.sprites[spriteId] ?? null;
  }

  playerSprite() {
    return this.sprite(playerSpriteIdFromEquipment())
      ?? this.sprite(this.manifest.actorMap.player.default);
  }

  companionSprite(npcId) {
    return this.sprite(this.manifest.actorMap.companions[npcId]);
  }

  enemySprite(enemy) {
    const enemyId = enemy?.id ?? enemy?.definitionId ?? enemy?.sourceId;
    const mapped = this.manifest.actorMap.enemies[enemyId]
      ?? (enemy?.type === 'zombie' ? 'enemy_zombie_common' : null);
    return this.sprite(mapped);
  }

  state(sprite, stateId = 'idle') {
    if (!sprite) return null;
    return sprite.states?.[stateId] ?? sprite.states?.idle ?? null;
  }
}

export const combatAssetManifest = new CombatSpriteManifest(COMBAT_ASSETS);
