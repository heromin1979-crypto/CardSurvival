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
export const spriteSheet = (src, cols = 6, rows = 4) => ({ src, cols, rows });

export const COMBAT_SPRITE_SHEETS = {
  doctor_f: spriteSheet('/assets/images/combat/spritesheets/doctor_f_sheet.png'),
  soldier_companion: spriteSheet('/assets/images/combat/spritesheets/soldier_companion_sheet.png'),
  nurse_companion: spriteSheet('/assets/images/combat/spritesheets/nurse_companion_sheet.png'),
  zombie_patient_dormant: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_patient_dormant_sheet.png'),
  zombie_common: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_common_sheet.png'),
  zombie_runner: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_runner_sheet.png'),
  zombie_brute: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_brute_sheet.png'),
  zombie_horde: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_horde_sheet.png'),
  rabid_dog: spriteSheet('/assets/images/combat/spritesheets/enemies/rabid_dog_sheet.png'),
  zombie_acid: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_acid_sheet.png'),
  zombie_bloater: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_bloater_sheet.png'),
  zombie_screamer: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_screamer_sheet.png'),
  zombie_charger: spriteSheet('/assets/images/combat/spritesheets/enemies/zombie_charger_sheet.png'),
  raider: spriteSheet('/assets/images/combat/spritesheets/enemies/raider_sheet.png'),
  raider_elite: spriteSheet('/assets/images/combat/spritesheets/enemies/raider_elite_sheet.png'),
  boss_horde_mother: spriteSheet('/assets/images/combat/spritesheets/enemies/boss_horde_mother_sheet.png'),
  boss_raider_warlord: spriteSheet('/assets/images/combat/spritesheets/enemies/boss_raider_warlord_sheet.png'),
  boss_feral_dog_alpha: spriteSheet('/assets/images/combat/spritesheets/enemies/boss_feral_dog_alpha_sheet.png'),
  boss_penthouse_survivor: spriteSheet('/assets/images/combat/spritesheets/enemies/boss_penthouse_survivor_sheet.png'),
  boss_soldier_nemesis: spriteSheet('/assets/images/combat/spritesheets/enemies/boss_soldier_nemesis_sheet.png'),
  boss_homeless_nemesis: spriteSheet('/assets/images/combat/spritesheets/enemies/boss_homeless_nemesis_sheet.png'),
  food_warlord: spriteSheet('/assets/images/combat/spritesheets/enemies/food_warlord_sheet.png'),
};

// Per-sheet frame counts (cols) live in a manifest the sprite-anim-editor tool writes.
// If absent, every sheet stays the legacy 6×4 — so this is a zero-regression enhancement.
async function _loadSpriteManifest() {
  // vitest(jsdom)에는 정적 서버가 없어 상대 경로 fetch가 실제 소켓 연결(ECONNREFUSED 노이즈)을
  // 시도한다. 매니페스트는 선택적 리소스이므로 테스트에서는 6×4 기본값을 그대로 쓴다.
  if (typeof process !== 'undefined' && process.env?.VITEST) return;
  try {
    const res = await fetch('/assets/images/combat/spritesheets/manifest.json', { cache: 'no-store' });
    if (!res.ok) return;
    const manifest = await res.json();
    for (const key in COMBAT_SPRITE_SHEETS) {
      const sheet = COMBAT_SPRITE_SHEETS[key];
      const meta = manifest[sheet.src.split('/').pop()];
      if (meta && meta.cols) {
        sheet.cols = meta.cols | 0;
        if (meta.rows) sheet.rows = meta.rows | 0;
        if (Array.isArray(meta.frameDur) && meta.frameDur.length) {
          sheet.frameDur = meta.frameDur;
        }
      }
    }
    _injectSpriteKeyframes();
  } catch (e) { /* manifest optional → keep 6×4 defaults */ }
}

function _injectSpriteKeyframes() {
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

_loadSpriteManifest();

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
