const FOUR_ROW_MOTIONS = Object.freeze({
  idle: Object.freeze({ row: 0, loop: true, durationMs: 900, locomotion: 'stationary' }),
  basic_attack: Object.freeze({ row: 1, loop: false, durationMs: 720, locomotion: 'approach' }),
  hit: Object.freeze({ row: 2, loop: false, durationMs: 420, locomotion: 'stationary' }),
  death: Object.freeze({
    row: 3,
    loop: false,
    durationMs: 900,
    locomotion: 'stationary',
    holdLast: true,
  }),
});

function fourRowSheet(src) {
  return Object.freeze({
    src,
    cols: 6,
    rows: 4,
    motions: FOUR_ROW_MOTIONS,
  });
}

function companionSheet(src) {
  return Object.freeze({
    ...fourRowSheet(src),
    aliases: Object.freeze({ downed: 'death' }),
  });
}

const PLAYER_MOTIONS = Object.freeze({
  idle: Object.freeze({ row: 0, loop: true, durationMs: 900, locomotion: 'stationary' }),
  melee: Object.freeze({ row: 1, loop: false, durationMs: 720, locomotion: 'approach' }),
  ranged: Object.freeze({ row: 2, loop: false, durationMs: 680, locomotion: 'stationary' }),
  support: Object.freeze({ row: 3, loop: false, durationMs: 760, locomotion: 'stationary' }),
  guard: Object.freeze({ row: 4, loop: false, durationMs: 640, locomotion: 'stationary' }),
  move: Object.freeze({ row: 5, loop: false, durationMs: 650, locomotion: 'approach' }),
  hit: Object.freeze({ row: 6, loop: false, durationMs: 500, locomotion: 'stationary' }),
  death: Object.freeze({ row: 7, loop: false, durationMs: 1100, locomotion: 'stationary', holdLast: true }),
});

function playerSheet(src) {
  return Object.freeze({
    src,
    cols: 6,
    rows: 8,
    motions: PLAYER_MOTIONS,
    aliases: Object.freeze({
      basic_attack: 'melee',
      reposition: 'move',
      downed: 'death',
      victory: 'idle',
    }),
  });
}

function motionSheet(src, rows, motions, aliases) {
  return Object.freeze({
    src,
    cols: 6,
    rows,
    motions: Object.freeze(Object.fromEntries(
      Object.entries(motions).map(([key, value]) => [key, Object.freeze(value)]),
    )),
    ...(aliases ? { aliases: Object.freeze({ ...aliases }) } : {}),
  });
}

// 현재 전투 화면에서 실제로 표시하는 기존 6×4 시트만 선언한다.
// 전용 roster 시트와 확장 모션은 해당 자산을 추가하는 후속 작업에서 함께 등록한다.
export const COMBAT_MOTION_MANIFEST = Object.freeze({
  doctor_f: playerSheet('/assets/images/combat/spritesheets/doctor_f_sheet.png'),
  soldier_m: playerSheet('/assets/images/combat/spritesheets/soldier_m_sheet.png'),
  firefighter_m: playerSheet('/assets/images/combat/spritesheets/firefighter_m_sheet.png'),
  homeless_m: playerSheet('/assets/images/combat/spritesheets/homeless_m_sheet.png'),
  chef_m: playerSheet('/assets/images/combat/spritesheets/chef_m_sheet.png'),
  engineer_m: playerSheet('/assets/images/combat/spritesheets/engineer_m_sheet.png'),
  soldier_companion: companionSheet('/assets/images/combat/spritesheets/soldier_companion_sheet.png'),
  nurse_companion: companionSheet('/assets/images/combat/spritesheets/nurse_companion_sheet.png'),
  zombie_patient_dormant: motionSheet(
    '/assets/images/combat/spritesheets/enemies/zombie_patient_dormant_sheet.png',
    5,
    {
      dormant: { row: 0, loop: true, durationMs: 1100, locomotion: 'stationary' },
      wake: { row: 1, loop: false, durationMs: 960, locomotion: 'stationary' },
      basic_attack: { row: 2, loop: false, durationMs: 720, locomotion: 'approach' },
      hit: { row: 3, loop: false, durationMs: 420, locomotion: 'stationary' },
      death: { row: 4, loop: false, durationMs: 900, locomotion: 'stationary', holdLast: true },
    },
    { idle: 'dormant', startled_lunge: 'basic_attack' },
  ),
  zombie_common: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_common_sheet.png'),
  zombie_runner: motionSheet('/assets/images/combat/spritesheets/enemies/zombie_runner_sheet.png', 6, {
    idle: { row: 0, loop: true, durationMs: 820, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 650, locomotion: 'approach' },
    telegraph: { row: 2, loop: false, durationMs: 700, locomotion: 'stationary' },
    runner_rush: { row: 3, loop: false, durationMs: 760, locomotion: 'approach' },
    hit: { row: 4, loop: false, durationMs: 420, locomotion: 'stationary' },
    death: { row: 5, loop: false, durationMs: 900, locomotion: 'stationary', holdLast: true },
  }),
  zombie_brute: motionSheet('/assets/images/combat/spritesheets/enemies/zombie_brute_sheet.png', 6, {
    idle: { row: 0, loop: true, durationMs: 980, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 760, locomotion: 'approach' },
    telegraph: { row: 2, loop: false, durationMs: 820, locomotion: 'stationary' },
    slam: { row: 3, loop: false, durationMs: 900, locomotion: 'approach' },
    hit: { row: 4, loop: false, durationMs: 460, locomotion: 'stationary' },
    death: { row: 5, loop: false, durationMs: 980, locomotion: 'stationary', holdLast: true },
  }),
  zombie_horde: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_horde_sheet.png'),
  rabid_dog: fourRowSheet('/assets/images/combat/spritesheets/enemies/rabid_dog_sheet.png'),
  zombie_acid: motionSheet('/assets/images/combat/spritesheets/enemies/zombie_acid_sheet.png', 5, {
    idle: { row: 0, loop: true, durationMs: 920, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 700, locomotion: 'stationary' },
    acid_lash: { row: 2, loop: false, durationMs: 820, locomotion: 'stationary' },
    hit: { row: 3, loop: false, durationMs: 440, locomotion: 'stationary' },
    death: { row: 4, loop: false, durationMs: 920, locomotion: 'stationary', holdLast: true },
  }),
  zombie_bloater: motionSheet('/assets/images/combat/spritesheets/enemies/zombie_bloater_sheet.png', 6, {
    idle: { row: 0, loop: true, durationMs: 1050, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 760, locomotion: 'approach' },
    charge: { row: 2, loop: false, durationMs: 860, locomotion: 'stationary' },
    self_destruct: { row: 3, loop: false, durationMs: 1100, locomotion: 'stationary', holdLast: true },
    hit: { row: 4, loop: false, durationMs: 460, locomotion: 'stationary' },
    death: { row: 5, loop: false, durationMs: 980, locomotion: 'stationary', holdLast: true },
  }),
  zombie_screamer: motionSheet('/assets/images/combat/spritesheets/enemies/zombie_screamer_sheet.png', 6, {
    idle: { row: 0, loop: true, durationMs: 920, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 700, locomotion: 'stationary' },
    charge: { row: 2, loop: false, durationMs: 860, locomotion: 'stationary' },
    summon_horde: { row: 3, loop: false, durationMs: 980, locomotion: 'stationary' },
    hit: { row: 4, loop: false, durationMs: 430, locomotion: 'stationary' },
    death: { row: 5, loop: false, durationMs: 920, locomotion: 'stationary', holdLast: true },
  }),
  zombie_charger: motionSheet('/assets/images/combat/spritesheets/enemies/zombie_charger_sheet.png', 6, {
    idle: { row: 0, loop: true, durationMs: 900, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 720, locomotion: 'approach' },
    charge: { row: 2, loop: false, durationMs: 820, locomotion: 'stationary' },
    charge_strike: { row: 3, loop: false, durationMs: 820, locomotion: 'approach' },
    hit: { row: 4, loop: false, durationMs: 440, locomotion: 'stationary' },
    death: { row: 5, loop: false, durationMs: 940, locomotion: 'stationary', holdLast: true },
  }),
  raider: motionSheet('/assets/images/combat/spritesheets/enemies/raider_sheet.png', 5, {
    idle: { row: 0, loop: true, durationMs: 920, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 620, locomotion: 'stationary' },
    reload: { row: 2, loop: false, durationMs: 900, locomotion: 'stationary' },
    hit: { row: 3, loop: false, durationMs: 420, locomotion: 'stationary' },
    death: { row: 4, loop: false, durationMs: 900, locomotion: 'stationary', holdLast: true },
  }),
  raider_elite: motionSheet('/assets/images/combat/spritesheets/enemies/raider_elite_sheet.png', 6, {
    idle: { row: 0, loop: true, durationMs: 940, locomotion: 'stationary' },
    basic_attack: { row: 1, loop: false, durationMs: 620, locomotion: 'stationary' },
    aim: { row: 2, loop: false, durationMs: 800, locomotion: 'stationary' },
    aimed_shot: { row: 3, loop: false, durationMs: 760, locomotion: 'stationary' },
    hit: { row: 4, loop: false, durationMs: 440, locomotion: 'stationary' },
    death: { row: 5, loop: false, durationMs: 940, locomotion: 'stationary', holdLast: true },
  }),
  boss_horde_mother: fourRowSheet('/assets/images/combat/spritesheets/enemies/boss_horde_mother_sheet.png'),
  boss_raider_warlord: fourRowSheet('/assets/images/combat/spritesheets/enemies/boss_raider_warlord_sheet.png'),
  boss_feral_dog_alpha: fourRowSheet('/assets/images/combat/spritesheets/enemies/boss_feral_dog_alpha_sheet.png'),
  boss_penthouse_survivor: fourRowSheet('/assets/images/combat/spritesheets/enemies/boss_penthouse_survivor_sheet.png'),
  boss_soldier_nemesis: fourRowSheet('/assets/images/combat/spritesheets/enemies/boss_soldier_nemesis_sheet.png'),
  boss_homeless_nemesis: fourRowSheet('/assets/images/combat/spritesheets/enemies/boss_homeless_nemesis_sheet.png'),
  food_raider: fourRowSheet('/assets/images/combat/spritesheets/enemies/food_raider_sheet.png'),
  food_warlord: fourRowSheet('/assets/images/combat/spritesheets/enemies/food_warlord_sheet.png'),
});

export const DISPLAYED_COMBAT_SHEET_KEYS = Object.freeze(Object.keys(COMBAT_MOTION_MANIFEST));

export function resolveCombatMotion(sheetKey, motionKey, manifest = COMBAT_MOTION_MANIFEST) {
  const sheet = manifest?.[sheetKey];
  if (!sheet || typeof motionKey !== 'string' || motionKey.length === 0) return null;

  const directMotion = sheet.motions?.[motionKey];
  if (directMotion) return directMotion;

  const aliasTarget = sheet.aliases?.[motionKey];
  if (typeof aliasTarget !== 'string' || aliasTarget.length === 0) return null;
  if (sheet.aliases?.[aliasTarget]) return null;

  return sheet.motions?.[aliasTarget] ?? null;
}

export function spriteRowPercent(row, rows) {
  if (!Number.isInteger(row) || !Number.isInteger(rows) || rows <= 0 || row < 0 || row >= rows) {
    return null;
  }
  return rows === 1 ? 0 : (row / (rows - 1)) * 100;
}
