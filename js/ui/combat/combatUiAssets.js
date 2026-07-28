import { COMBAT_MOTION_MANIFEST } from '../../data/combatMotionManifest.js';

// CombatUI 공용 상수 — 스프라이트시트/아이콘/모션·연출 클래스 테이블.
// CombatUI 본체와 CombatFxPlayer 믹스인이 공유한다.
// Combat Overhaul Phase 1 — 턴 큐 HUD 아이콘/라벨 매핑
export const INIT_TYPE_ICONS = {
  player:    '👤',
  companion: '🤝',
  enemy:     '👹',
};

// 동반자 표시 아이콘 (스테이지 스프라이트 · 패널 공용)
export const COMPANION_ICONS = {
  npc_dog: '🐕', npc_nurse: '👩‍⚕️', npc_soldier_deserter: '🪖', npc_soldier: '🪖',
  npc_child: '👧', npc_mechanic: '🔧', npc_trader: '🧳',
  npc_student: '📖', npc_old_survivor: '👴', npc_doctor: '🥼',
};

// FX 오버레이 이모지 (cv-fx-* 클래스와 페어)
function deriveCombatSpriteSheets(manifest) {
  return Object.fromEntries(Object.entries(manifest).map(([sheetKey, sheet]) => {
    const derivedSheet = {
      src: sheet.src,
      cols: sheet.cols,
      rows: sheet.rows,
      motions: { ...sheet.motions },
    };
    if (Array.isArray(sheet.frameDur)) {
      derivedSheet.frameDur = sheet.frameDur.map(row => (Array.isArray(row) ? [...row] : row));
    }
    return [sheetKey, derivedSheet];
  }));
}

export const COMBAT_SPRITE_SHEETS = deriveCombatSpriteSheets(COMBAT_MOTION_MANIFEST);

export function validateCombatSpriteManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['[combat sprite] manifest must be an object'];
  }

  for (const [fileName, meta] of Object.entries(manifest)) {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) continue;
    if (!meta.motions || typeof meta.motions !== 'object' || Array.isArray(meta.motions)) {
      continue;
    }
    for (const [motionKey, motion] of Object.entries(meta.motions)) {
      if (motion?.loop === true && motionKey !== 'idle') {
        errors.push(
          `[combat sprite/${fileName}/${motionKey}] loop:true is unsupported; action motions must return to idle after durationMs`,
        );
      }
    }
  }
  return errors;
}

export function applyCombatSpriteManifest(manifest) {
  const errors = validateCombatSpriteManifest(manifest);
  if (errors.length > 0) return { ok: false, errors };

  for (const key in COMBAT_SPRITE_SHEETS) {
    const sheet = COMBAT_SPRITE_SHEETS[key];
    const meta = manifest[sheet.src.split('/').pop()];
    if (!meta || typeof meta !== 'object') continue;

    if (Number.isInteger(meta.cols) && meta.cols > 0) sheet.cols = meta.cols;
    if (Number.isInteger(meta.rows) && meta.rows > 0) sheet.rows = meta.rows;
    if (Array.isArray(meta.frameDur) && meta.frameDur.length) {
      sheet.frameDur = meta.frameDur;
    }
    if (meta.motions && typeof meta.motions === 'object' && !Array.isArray(meta.motions)) {
      sheet.motions = { ...meta.motions };
    }
  }
  _injectSpriteKeyframes();
  return { ok: true, errors: [] };
}

function _injectSpriteKeyframes() {
  if (typeof document === 'undefined') return;
  let css = '';
  for (const key in COMBAT_SPRITE_SHEETS) {
    const sheet = COMBAT_SPRITE_SHEETS[key];
    if (!Array.isArray(sheet.frameDur) || !sheet.frameDur.length) continue;
    const cols = sheet.cols | 0;
    const rows = sheet.rows | 0;
    for (let row = 0; row < rows; row++) {
      const durations = Array.isArray(sheet.frameDur[row]) && sheet.frameDur[row].length
        ? sheet.frameDur[row]
        : new Array(cols).fill(1);
      const total = durations.reduce((sum, duration) => sum + (+duration || 0), 0) || 1;
      let elapsed = 0;
      let stops = '';
      for (let frame = 0; frame < durations.length; frame++) {
        const percent = (elapsed / total) * 100;
        const x = cols > 1 ? (frame / (cols - 1)) * 100 : 0;
        stops += `${percent.toFixed(4)}%{background-position-x:${x.toFixed(4)}%}`;
        elapsed += (+durations[frame] || 0);
      }
      stops += `100%{background-position-x:${cols > 1 ? 100 : 0}%}`;
      css += `@keyframes spriteanim_${key}_r${row}{${stops}}`;
    }
  }

  let style = document.getElementById('sprite-anim-keyframes');
  if (!css) {
    if (style) style.textContent = '';
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = 'sprite-anim-keyframes';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

_injectSpriteKeyframes();

// 직업×성별 → 플레이어 스프라이트시트 키. 신규 시트 제작 시 여기만 추가하면 된다.
export const PLAYER_SPRITE_KEYS = {
  'doctor:F': 'doctor_f',
};

export const COMPANION_SPRITE_KEYS = {
  npc_nurse: 'nurse_companion',
  npc_soldier: 'soldier_companion',
  npc_wounded_soldier: 'soldier_companion',
  npc_soldier_deserter: 'soldier_companion',
};

export const ENEMY_SPRITE_KEYS = {
  zombie_patient_dormant: 'zombie_patient_dormant',
  zombie_common: 'zombie_common',
  zombie_runner: 'zombie_runner',
  zombie_brute: 'zombie_brute',
  zombie_horde: 'zombie_horde',
  rabid_dog: 'rabid_dog',
  zombie_acid: 'zombie_acid',
  zombie_bloater: 'zombie_bloater',
  zombie_screamer: 'zombie_screamer',
  zombie_charger: 'zombie_charger',
  raider: 'raider',
  raider_elite: 'raider_elite',
  boss_horde_mother: 'boss_horde_mother',
  boss_raider_warlord: 'boss_raider_warlord',
  boss_feral_dog_alpha: 'boss_feral_dog_alpha',
  boss_penthouse_survivor: 'boss_penthouse_survivor',
  boss_soldier_nemesis: 'boss_soldier_nemesis',
  boss_homeless_nemesis: 'boss_homeless_nemesis',
  food_warlord: 'food_warlord',
};

// 실제 CSS/emoji 자산으로 표시 가능한 impact FX 키와 의미 보존 alias.
// 데이터 validator와 renderer가 이 단일 계약을 공유한다.
export const IMPACT_FX_KEYS = new Set([
  'acid',
  'blast',
  'blunt',
  'claw',
  'fire',
  'punch',
  'rupture',
  'scream',
  'shock',
  'shot',
  'skill',
  'slam',
  'slash',
  'spark',
]);

export const IMPACT_FX_ALIASES = Object.freeze({
  buff: 'skill',
  debuff: 'skill',
  frost: 'skill',
  heal: 'skill',
  radiation: 'rupture',
  shockwave: 'shock',
  summon: 'scream',
  toxic: 'acid',
});

export function isResolvableImpactFx(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  const key = value.trim();
  const resolved = IMPACT_FX_ALIASES[key] ?? key;
  return IMPACT_FX_KEYS.has(resolved);
}

export function normalizeImpactFx(value, fallback = 'skill') {
  const key = typeof value === 'string' ? value.trim() : '';
  const resolved = IMPACT_FX_ALIASES[key] ?? key;
  if (IMPACT_FX_KEYS.has(resolved)) return resolved;

  const fallbackKey = typeof fallback === 'string' ? fallback.trim() : 'skill';
  const resolvedFallback = IMPACT_FX_ALIASES[fallbackKey] ?? fallbackKey;
  return IMPACT_FX_KEYS.has(resolvedFallback) ? resolvedFallback : 'skill';
}

const NON_IMPACT_OVERLAY_KEYS = new Set(['death-burst', 'explode', 'muzzle']);

export function normalizeFxOverlay(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  if (key.startsWith('status-') || NON_IMPACT_OVERLAY_KEYS.has(key)) return key;
  return normalizeImpactFx(key);
}

export const FX_EMOJI = {
  blunt: '💥', fire: '🔥', spark: '⚡', blast: '💥', punch: '👊',
  explode: '💥', scream: '📣', muzzle: '✸', skill: '💢',
};

// 연출 종류별 재생 길이(ms) — 큐 간격이 실제 모션 길이를 따라가도록
export const FX_DURATIONS = {
  playerAttack: 820,
  enemyAttack: 820,
  companionAttack: 760,
  enemyAttackCompanion: 760,
  status: 420,
  guard: 320,
  useItem: 420,
  playerSkill: 560,
  companionHeal: 480,
  companionBuff: 520,
  companionSkill: 560,
  move: 360,
  rankSwap: 360,
  dodge: 320,
  advance: 480,
  explode: 920,
  summon: 860,
  playerDeath: 1100,
  downed: 620,
  victory: 700,
  defeat: 820,
  flee: 480,
};

export const CAMERA_CLASSES = [
  'camera-ally-strike',
  'camera-enemy-strike',
  'camera-ally-whiff',
  'camera-enemy-whiff',
  'camera-impact-heavy',
];

export const COMBAT_MOTION_CLASSES = [
  'motion-move-forward',
  'motion-move-back',
  'motion-rank-swap',
  'motion-melee-strike',
  'motion-knife-slash',
  'motion-blunt-strike',
  'motion-firearm-shot',
  'motion-whiff',
  'motion-dodge',
  'motion-player-hit',
  'motion-hit-light',
  'motion-hit-heavy',
  'motion-knockback',
  'motion-guard-brace',
  'motion-heal-pulse',
  'motion-buff-pulse',
  'motion-debuff-pulse',
  'motion-downed',
  'motion-player-death',
  'motion-victory',
  'motion-defeat',
  'motion-zombie-lunge',
  'motion-zombie-heavy',
  'motion-zombie-spit',
  'motion-zombie-hit',
  'motion-zombie-advance',
  'motion-zombie-scream',
  'motion-zombie-death',
];

export const STATUS_MOTION_CLASSES = [
  'motion-combat-ready',
  'motion-status-stun',
  'motion-status-bleed',
  'motion-status-infected',
  'motion-status-panic',
];
