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

// 현재 전투 화면에서 실제로 표시하는 기존 6×4 시트만 선언한다.
// 전용 roster 시트와 확장 모션은 해당 자산을 추가하는 후속 작업에서 함께 등록한다.
export const COMBAT_MOTION_MANIFEST = Object.freeze({
  doctor_f: fourRowSheet('/assets/images/combat/spritesheets/doctor_f_sheet.png'),
  soldier_companion: fourRowSheet('/assets/images/combat/spritesheets/soldier_companion_sheet.png'),
  nurse_companion: fourRowSheet('/assets/images/combat/spritesheets/nurse_companion_sheet.png'),
  zombie_patient_dormant: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_patient_dormant_sheet.png'),
  zombie_common: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_common_sheet.png'),
  zombie_runner: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_runner_sheet.png'),
  zombie_brute: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_brute_sheet.png'),
  zombie_horde: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_horde_sheet.png'),
  rabid_dog: fourRowSheet('/assets/images/combat/spritesheets/enemies/rabid_dog_sheet.png'),
  zombie_acid: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_acid_sheet.png'),
  zombie_bloater: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_bloater_sheet.png'),
  zombie_screamer: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_screamer_sheet.png'),
  zombie_charger: fourRowSheet('/assets/images/combat/spritesheets/enemies/zombie_charger_sheet.png'),
  raider: fourRowSheet('/assets/images/combat/spritesheets/enemies/raider_sheet.png'),
  raider_elite: fourRowSheet('/assets/images/combat/spritesheets/enemies/raider_elite_sheet.png'),
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
