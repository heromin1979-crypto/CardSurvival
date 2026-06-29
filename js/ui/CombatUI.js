// === COMBAT UI (v4 — 3패널 레이아웃) ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import CombatSystem  from '../systems/CombatSystem.js';
import I18n          from '../core/I18n.js';
import NightSystem   from '../systems/NightSystem.js';
import { CHARACTERS } from '../data/characters.js';
import { DISTRICTS }  from '../data/districts.js';
import BALANCE        from '../data/gameBalance.js';
import { NPC_ITEMS }  from '../data/npcs.js';

const BATTLE_BG    = './assets/images/battle_bg.jpg';
const PLAYER_IMG_M = './assets/images/player_M.jpg';
const PLAYER_IMG_F = './assets/images/player_F.jpg';
const PLAYER_COMBAT_FALLBACK_M = './assets/images/combat/player_M_cutout.png';
const PLAYER_COMBAT_FALLBACK_F = './assets/images/combat/player_F_cutout.png';

const DANGER_LABEL = ['안전', '보통', '경계', '위험', '극위험', '극위험'];
const DANGER_COLOR = ['#449944', '#889933', '#cc8822', '#cc3333', '#881111', '#881111'];

const WEAKNESS_LABEL = { fire:'🔥약점', blade:'🗡️약점', bullet:'🔫약점', blunt:'💥약점', explosive:'💣약점', electric:'⚡약점' };
const RESIST_LABEL   = { fire:'🔥저항', blade:'🗡️저항', bullet:'🔫저항', blunt:'💥저항', explosive:'💣저항', electric:'⚡저항' };

// Combat Overhaul Phase 1 — 턴 큐 HUD 아이콘/라벨 매핑
const INIT_TYPE_ICONS = {
  player:    '👤',
  companion: '🤝',
  enemy:     '👹',
};

// 동반자 표시 아이콘 (스테이지 스프라이트 · 패널 공용)
const COMPANION_ICONS = {
  npc_dog: '🐕', npc_nurse: '👩‍⚕️', npc_soldier_deserter: '🪖', npc_soldier: '🪖',
  npc_child: '👧', npc_mechanic: '🔧', npc_trader: '🧳',
  npc_student: '📖', npc_old_survivor: '👴', npc_doctor: '🥼',
};

// FX 오버레이 이모지 (cv-fx-* 클래스와 페어)
const spriteSheet = (src) => ({ src, cols: 6, rows: 4 });

const COMBAT_SPRITE_SHEETS = {
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

const COMPANION_SPRITE_KEYS = {
  npc_nurse: 'nurse_companion',
  npc_soldier: 'soldier_companion',
  npc_wounded_soldier: 'soldier_companion',
  npc_soldier_deserter: 'soldier_companion',
};

const ENEMY_SPRITE_KEYS = {
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

const FX_EMOJI = {
  blunt: '💥', fire: '🔥', spark: '⚡', blast: '💥', punch: '👊',
  explode: '💥', scream: '📣', muzzle: '✸', skill: '💢',
};

const CAMERA_CLASSES = [
  'camera-ally-strike',
  'camera-enemy-strike',
  'camera-ally-whiff',
  'camera-enemy-whiff',
  'camera-impact-heavy',
];

const COMBAT_MOTION_CLASSES = [
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

const STATUS_MOTION_CLASSES = [
  'motion-combat-ready',
  'motion-status-stun',
  'motion-status-bleed',
  'motion-status-infected',
  'motion-status-panic',
];

const CombatUI = {
  _screen:       null,
  _lastRound:    -1,
  _prevPlayerHp: null,

  init() {
    this._screen = document.getElementById('screen-combat');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'combat') {
        this._lastRound    = -1;
        this._prevPlayerHp = null;
        this.render();
      }
    });
  },

  // ── 전투 연출 재생 (CombatSystem.fxQueue → 순차 재생) ──

  _playFxQueue() {
    const combat = GameState.combat;
    const queue  = combat?.fxQueue;
    if (!Array.isArray(queue) || queue.length === 0) return;
    combat.fxQueue = [];
    let delay = 80;
    for (const fx of queue) {
      setTimeout(() => this._playFx(fx), delay);
      delay += 300;
    }
  },

  _enemySpriteEl(idx) { return this._screen?.querySelector(`.cv-enemy-sprite[data-idx="${idx}"]`); },
  _playerSpriteEl()   { return this._screen?.querySelector('.cv-player'); },
  _allyEl(npcId) {
    return this._screen?.querySelector(`.cv-ally[data-companion-id="${npcId}"]`)
        ?? this._screen?.querySelector(`[data-companion-id="${npcId}"]`);
  },

  _playerSpriteSheetKey(gs = GameState) {
    return gs.player?.characterId === 'doctor' && gs.player?.gender === 'F'
      ? 'doctor_f'
      : null;
  },

  _companionSpriteSheetKey(npcId) {
    return COMPANION_SPRITE_KEYS[npcId] ?? null;
  },

  _enemySpriteSheetKey(enemy) {
    const id = String(enemy?.id ?? enemy?.definitionId ?? '');
    if (ENEMY_SPRITE_KEYS[id]) return ENEMY_SPRITE_KEYS[id];
    if (id.includes('dog') || enemy?.type === 'animal') return 'rabid_dog';
    if (id.includes('raider') || enemy?.type === 'human') return 'raider';
    if (id.includes('zombie') || enemy?.type === 'zombie') return 'zombie_common';
    return null;
  },

  _spriteSheetStyle(sheetKey) {
    const sheet = COMBAT_SPRITE_SHEETS[sheetKey];
    if (!sheet) return '';
    return [
      `--sprite-url: url('${sheet.src}')`,
      `--sprite-cols: ${sheet.cols}`,
      `--sprite-rows: ${sheet.rows}`,
    ].join('; ');
  },

  _renderCombatSpriteSheet(sheetKey, className, label = '') {
    const style = this._spriteSheetStyle(sheetKey);
    if (!style) return '';
    return `<span class="${className}" role="img" aria-label="${label}" style="${style}"></span>`;
  },

  _renderCompanionBodySprite(npcId, label = '') {
    const sheetKey = this._companionSpriteSheetKey(npcId);
    if (sheetKey) {
      return this._renderCombatSpriteSheet(sheetKey, 'cv-ally-icon combat-sprite-sheet cv-companion-sheet', label);
    }
    return `<span class="cv-ally-icon">${COMPANION_ICONS[npcId] ?? '?뫀'}</span>`;
  },

  _playFx(fx) {
    if (!this._screen || !fx) return;
    switch (fx.kind) {
      case 'playerAttack': {
        const player = this._playerSpriteEl();
        const target = this._enemySpriteEl(fx.targetIdx);
        this._animate(player, 'attacking');
        this._motion(player, ['motion-move-forward', this._playerAttackMotion(fx)], 780);
        if (fx.fx === 'shot') this._spawnFxOverlay(player, 'muzzle');
        this._cameraWork(fx.miss ? 'ally-whiff' : 'ally-strike', fx.crit ? 760 : 640);
        if (fx.miss) {
          this._motion(player, ['motion-move-forward', 'motion-whiff'], 720);
          this._spawnFloatText(target, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(target, fx.fx ?? 'blunt');
        this._motion(target, ['motion-zombie-hit', this._hitReactionMotion(fx)], 560);
        this._animate(target, 'hit');
        this._spawnFloatText(target, `-${fx.dmg}`, fx.crit ? 'crit' : 'dmg');
        if (fx.crit || fx.killed) this._shakeVisual();
        break;
      }
      case 'enemyAttack': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        const player  = this._playerSpriteEl();
        this._animate(enemyEl, 'lunging');
        this._motion(enemyEl, ['motion-move-forward', this._enemyAttackMotion(fx)], 780);
        this._cameraWork(fx.miss ? 'enemy-whiff' : 'enemy-strike', fx.crit ? 760 : 650);
        if (fx.miss) {
          this._motion(enemyEl, ['motion-move-forward', 'motion-whiff'], 720);
          this._spawnFloatText(player, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(player, fx.fx ?? 'claw');
        this._motion(player, ['motion-player-hit', this._hitReactionMotion(fx)], 620);
        this._animate(player, 'hit');
        this._spawnFloatText(player, `-${fx.dmg}`, fx.crit ? 'crit' : 'dmg');
        if (fx.crit) this._shakeVisual();
        break;
      }
      case 'enemyAttackCompanion': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        this._animate(enemyEl, 'lunging');
        this._motion(enemyEl, ['motion-move-forward', this._enemyAttackMotion(fx)], 780);
        this._cameraWork('enemy-strike', 650);
        const ally = this._allyEl(fx.npcId);
        this._spawnFxOverlay(ally, fx.fx ?? 'claw');
        this._motion(ally, ['motion-player-hit', this._hitReactionMotion(fx)], 620);
        this._animate(ally, 'hit');
        this._spawnFloatText(ally, `-${fx.dmg}`, 'dmg');
        break;
      }
      case 'companionAttack': {
        const ally   = this._allyEl(fx.npcId);
        const target = this._enemySpriteEl(fx.targetIdx);
        this._animate(ally, 'attacking');
        this._motion(ally, ['motion-move-forward', this._allyAttackMotion(fx)], 780);
        this._cameraWork(fx.miss ? 'ally-whiff' : 'ally-strike', 620);
        if (fx.miss) {
          this._motion(ally, ['motion-move-forward', 'motion-whiff'], 720);
          this._spawnFloatText(target, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(target, fx.fx ?? 'slash');
        this._motion(target, ['motion-zombie-hit', this._hitReactionMotion(fx)], 560);
        this._animate(target, 'hit');
        this._spawnFloatText(target, `-${fx.dmg}`, 'dmg');
        break;
      }
      case 'companionHeal': {
        this._animate(this._allyEl(fx.npcId), 'glowing');
        this._motion(this._allyEl(fx.npcId), 'motion-heal-pulse', 700);
        this._motion(this._playerSpriteEl(), 'motion-heal-pulse', 700);
        this._spawnFloatText(this._playerSpriteEl(), `+${fx.amount}`, 'heal');
        break;
      }
      case 'companionBuff':
      case 'companionSkill': {
        this._animate(this._screen.querySelector('.combat-visual'), 'skill-flash', 500);
        this._animate(this._allyEl(fx.npcId), 'glowing');
        const skillMotion = fx.skillId === 'soldier_suppress'
          ? 'motion-firearm-shot'
          : fx.skillId === 'nurse_triage'
            ? 'motion-heal-pulse'
            : 'motion-buff-pulse';
        this._motion(this._allyEl(fx.npcId), skillMotion, 760);
        if (fx.skillId === 'nurse_triage') this._motion(this._playerSpriteEl(), 'motion-heal-pulse', 760);
        break;
      }
      case 'advance': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        this._animate(enemyEl, 'advancing', 600);
        this._motion(enemyEl, ['motion-zombie-advance', 'motion-move-forward'], 620);
        break;
      }
      case 'guard': {
        this._motion(this._playerSpriteEl(), 'motion-guard-brace', 640);
        break;
      }
      case 'useItem': {
        const motion = fx.fx === 'heal' ? 'motion-heal-pulse' : 'motion-buff-pulse';
        this._motion(this._playerSpriteEl(), motion, 720);
        this._spawnFloatText(this._playerSpriteEl(), fx.label ?? 'ITEM', fx.fx === 'heal' ? 'heal' : 'dmg');
        break;
      }
      case 'flee': {
        const player = this._playerSpriteEl();
        this._motion(player, fx.success ? 'motion-move-back' : 'motion-dodge', 680);
        this._cameraWork(fx.success ? 'ally-whiff' : 'enemy-whiff', 620);
        break;
      }
      case 'move':
      case 'rankSwap': {
        const actor = this._actorEl(fx);
        const motion = fx.kind === 'rankSwap'
          ? 'motion-rank-swap'
          : fx.direction === 'back'
            ? 'motion-move-back'
            : 'motion-move-forward';
        this._motion(actor, motion, 650);
        break;
      }
      case 'dodge': {
        this._motion(this._actorEl(fx), 'motion-dodge', 560);
        break;
      }
      case 'status': {
        const actor = this._actorEl(fx);
        this._motion(actor, this._statusTransientMotion(fx.statusId), 760);
        break;
      }
      case 'downed': {
        this._motion(this._actorEl(fx) ?? this._playerSpriteEl(), 'motion-downed', 900);
        break;
      }
      case 'playerDeath': {
        this._motion(this._playerSpriteEl(), 'motion-player-death', 1100);
        break;
      }
      case 'victory': {
        this._motion(this._playerSpriteEl(), 'motion-victory', 900);
        break;
      }
      case 'defeat': {
        this._motion(this._playerSpriteEl(), 'motion-defeat', 1000);
        break;
      }
      case 'explode': {
        const el = this._enemySpriteEl(fx.enemyIdx);
        this._spawnFxOverlay(el, 'explode');
        this._motion(this._playerSpriteEl(), ['motion-hit-heavy', 'motion-knockback'], 720);
        this._cameraWork('impact-heavy', 720);
        this._shakeVisual();
        if (fx.dmg) this._spawnFloatText(this._playerSpriteEl(), `-${fx.dmg}`, 'crit');
        break;
      }
      case 'summon': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        this._spawnFxOverlay(enemyEl, 'scream');
        this._motion(enemyEl, 'motion-zombie-scream', 780);
        this._cameraWork('impact-heavy', 720);
        this._shakeVisual();
        break;
      }
    }
  },

  // CSS 애니메이션 클래스 재시작 헬퍼
  _animate(el, cls, dur = 450) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), dur);
  },

  _motion(el, cls, dur = 560) {
    if (!el || !cls) return;
    const classes = Array.isArray(cls) ? cls.filter(Boolean) : [cls];
    if (classes.length === 0) return;
    const persistentBefore = new Set(classes.filter(c => STATUS_MOTION_CLASSES.includes(c) && el.classList.contains(c)));
    el.classList.remove(...COMBAT_MOTION_CLASSES);
    void el.offsetWidth;
    el.classList.add(...classes);
    setTimeout(() => {
      const removable = classes.filter(c => !persistentBefore.has(c));
      if (removable.length) el.classList.remove(...removable);
    }, dur);
  },

  _playerAttackMotion(fx) {
    if (fx?.fx === 'shot') return 'motion-firearm-shot';
    if (fx?.fx === 'slash') return 'motion-knife-slash';
    if (fx?.fx === 'blunt') return 'motion-blunt-strike';
    return 'motion-melee-strike';
  },

  _allyAttackMotion(fx) {
    if (fx?.fx === 'shot') return 'motion-firearm-shot';
    if (fx?.fx === 'slash') return 'motion-knife-slash';
    if (fx?.fx === 'blunt') return 'motion-blunt-strike';
    return 'motion-melee-strike';
  },

  _enemyAttackMotion(fx) {
    if (fx?.fx === 'shot' || fx?.fx === 'acid') return 'motion-zombie-spit';
    if (fx?.fx === 'slam' || fx?.fx === 'shock' || fx?.fx === 'rupture') return 'motion-zombie-heavy';
    return 'motion-zombie-lunge';
  },

  _hitReactionMotion(fx) {
    if (fx?.crit || (fx?.dmg ?? 0) >= 18 || fx?.fx === 'shock' || fx?.fx === 'explode') {
      return 'motion-hit-heavy';
    }
    return 'motion-hit-light';
  },

  _actorEl(fx) {
    if (!fx) return null;
    if (fx.target === 'enemy' || fx.enemyIdx != null) return this._enemySpriteEl(fx.enemyIdx ?? fx.targetIdx);
    if (fx.target === 'ally' || fx.npcId) return this._allyEl(fx.npcId);
    return this._playerSpriteEl();
  },

  _statusTransientMotion(statusId) {
    switch (statusId) {
      case 'stun': return 'motion-status-stun';
      case 'bleed':
      case 'bleeding':
      case 'laceration': return 'motion-status-bleed';
      case 'infected':
      case 'infection':
      case 'poison':
      case 'burn': return 'motion-status-infected';
      case 'panic':
      case 'fear':
      case 'stress': return 'motion-status-panic';
      default: return 'motion-debuff-pulse';
    }
  },

  _statusMotionClasses(statuses = []) {
    const ids = statuses.map(s => s?.id).filter(Boolean);
    const classes = ['motion-combat-ready'];
    if (ids.includes('stun')) classes.push('motion-status-stun');
    if (ids.some(id => ['bleed', 'bleeding', 'laceration'].includes(id))) classes.push('motion-status-bleed');
    if (ids.some(id => ['infected', 'infection', 'poison', 'burn'].includes(id))) classes.push('motion-status-infected');
    if (ids.some(id => ['panic', 'fear', 'stress'].includes(id))) classes.push('motion-status-panic');
    return classes.join(' ');
  },

  _shakeVisual() {
    this._animate(this._screen?.querySelector('.combat-visual'), 'shake', 400);
  },

  // 타격 이펙트 오버레이 (슬래시 궤적/이모지 버스트)
  _cameraWork(kind, dur = 650) {
    const visual = this._screen?.querySelector('.combat-visual');
    if (!visual) return;
    const cls = `camera-${kind}`;
    const token = `${Date.now()}-${Math.random()}`;
    visual.classList.remove(...CAMERA_CLASSES, 'camera-work-active');
    void visual.offsetWidth;
    visual.dataset.cameraWorkToken = token;
    visual.classList.add('camera-work-active', cls);
    setTimeout(() => {
      if (visual.dataset.cameraWorkToken !== token) return;
      visual.classList.remove(cls, 'camera-work-active');
      delete visual.dataset.cameraWorkToken;
    }, dur);
  },

  _spawnFxOverlay(anchor, type) {
    if (!anchor) return;
    const fx = document.createElement('div');
    fx.className = `cv-fx cv-fx-${type}`;
    if (FX_EMOJI[type]) fx.textContent = FX_EMOJI[type];
    const prevPos = getComputedStyle(anchor).position;
    if (prevPos === 'static') anchor.style.position = 'relative';
    anchor.appendChild(fx);
    setTimeout(() => fx.remove(), 700);
  },

  // 헬퍼: 타겟 엘리먼트 위에 짧은 플로팅 텍스트 생성
  _spawnFloatText(anchor, text, variant = 'dmg') {
    if (!anchor) return;
    const popup = document.createElement('div');
    popup.className = `dmg-popup ${variant}`;
    popup.textContent = text;
    // 앵커에 append (position:relative 가정)
    const prevPos = getComputedStyle(anchor).position;
    if (prevPos === 'static') anchor.style.position = 'relative';
    anchor.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
  },

  /**
   * Combat Overhaul Phase 1 — 턴 순서 HUD 바.
   * 순수 문자열 반환 (testable). turnQueue 없을 경우 빈 문자열.
   */
  _renderInitiativeBar(combat, gs) {
    const queue = combat?.turnQueue;
    if (!Array.isArray(queue) || queue.length === 0) return '';
    const activeIdx = combat.activeIdx ?? 0;

    const slots = queue.map((entry, i) => {
      const isActive = i === activeIdx;
      let icon  = INIT_TYPE_ICONS[entry.type] ?? '·';
      let label = '—';
      let hpPct = 100;
      let dead = false;

      let intentIcon = '';
      let intentLabel = '';
      let countdown = null;

      if (entry.type === 'player') {
        label = (gs.player?.name ?? '생존자').slice(0, 4);
        hpPct = Math.max(0, Math.min(100, ((gs.player?.hp?.current ?? 0) / (gs.player?.hp?.max ?? 1)) * 100));
        dead = (gs.player?.hp?.current ?? 0) <= 0;
      } else if (entry.type === 'enemy') {
        const e = combat.enemies?.[entry.enemyIdx];
        if (e) {
          icon  = e.icon ?? icon;
          label = (e.name ?? 'Enemy').slice(0, 4);
          hpPct = Math.max(0, Math.min(100, ((e.currentHp ?? 0) / (e.maxHp ?? 1)) * 100));
          dead  = (e.currentHp ?? 0) <= 0;
          // Phase 3 — 의도 아이콘
          if (!dead && e._nextIntent) {
            intentIcon = e._nextIntent.iconEmoji ?? '';
            intentLabel = e._nextIntent.label ?? '';
            countdown = e._nextIntent.countdown ?? null;
          }
        }
      } else if (entry.type === 'companion') {
        const st = gs.npcs?.states?.[entry.id];
        if (st) {
          hpPct = Math.max(0, Math.min(100, ((st.hp ?? 0) / (st.maxHp ?? 50)) * 100));
          dead  = (st.hp ?? 0) <= 0;
        }
        // 이슈 #8 — NPC 한글 이름 (I18n.itemName 통해 NPC_ITEMS name 조회)
        const npcItem = NPC_ITEMS?.[entry.id];
        const fullName = I18n.itemName
          ? I18n.itemName(entry.id, npcItem?.name ?? entry.id)
          : (npcItem?.name ?? entry.id);
        // 한글 3자/영어 4자 축약
        label = fullName.slice(0, 4);
      }

      const cls = ['init-slot', entry.type];
      if (isActive) cls.push('active');
      if (dead)     cls.push('dead');
      if (countdown != null && countdown <= 1) cls.push('charging');

      const intentHtml = intentIcon
        ? `<span class="init-intent" title="${intentLabel}">${intentIcon}</span>`
        : '';

      const countdownHtml = countdown != null
        ? `<span class="init-countdown">${countdown}</span>`
        : '';

      return `
        <div class="${cls.join(' ')}" data-init-idx="${i}" data-init-type="${entry.type}">
          <span class="init-icon">${icon}</span>
          <span class="init-label">${label}</span>
          <div class="init-hp-bar"><div class="init-hp-fill" style="width:${hpPct.toFixed(0)}%"></div></div>
          ${intentHtml}${countdownHtml}
        </div>`;
    }).join('');

    return `
      <div class="initiative-bar" data-round="${combat.roundNumber ?? 1}">
        <span class="init-round-label"><b>${combat.roundNumber ?? 1}</b><em>ROUND</em></span>
        <div class="init-slots">${slots}</div>
      </div>`;
  },

  render() {
    try {
      this._renderInternal();
    } catch (err) {
      console.error('[CombatUI] render 실패 — 원인:', err);
      console.error('[CombatUI] 상태:', {
        characterId: GameState.player?.characterId,
        enemies: GameState.combat?.enemies?.map(e => e?.id) ?? 'undefined',
        companions: GameState.companions,
      });
      // 최소한의 fallback 렌더 — 화면이 비지 않도록
      if (this._screen) {
        this._screen.innerHTML = `
          <div style="padding:20px;color:#e66;text-align:center;">
            <h2>전투 화면 렌더 오류</h2>
            <p>콘솔에서 상세 원인을 확인해 주세요.</p>
            <p>${String(err?.message ?? err)}</p>
            <button class="toolbar-btn" onclick="location.reload()">페이지 새로고침</button>
          </div>`;
      }
    }
  },

  _renderInternal() {
    const gs     = GameState;
    const combat = gs.combat;
    if (!combat?.enemies?.length || !this._screen) return;

    const isEntry    = combat._isNew === true;
    if (isEntry) combat._isNew = false;
    const isNewRound = combat.round !== this._lastRound;
    this._lastRound  = combat.round;

    // ── 플레이어 스탯 ──────────────────────────────────────────
    const hpPct      = (gs.player.hp.current / gs.player.hp.max) * 100;
    const hpClass    = hpPct < 25 ? 'crit' : hpPct < 50 ? 'low' : '';
    const isHpCrit   = hpPct < 25;
    const prevPHpPct = this._prevPlayerHp ?? hpPct;
    const stPct      = (gs.stats.stamina.current / gs.stats.stamina.max) * 100;
    const infPct     = (gs.stats.infection.current / gs.stats.infection.max) * 100;

    // ── 캐릭터 정보 ───────────────────────────────────────────
    const charDef    = CHARACTERS.find(c => c.id === gs.player.characterId) ?? {};
    const genderImg  = gs.player.gender === 'F' ? PLAYER_IMG_F : PLAYER_IMG_M;
    const playerSpriteSheetKey = this._playerSpriteSheetKey(gs);
    const combatFallbackImg = gs.player.gender === 'F' ? PLAYER_COMBAT_FALLBACK_F : PLAYER_COMBAT_FALLBACK_M;
    const playerImg  = playerSpriteSheetKey ? (charDef.portraitFull ?? combatFallbackImg) : combatFallbackImg;
    const portraitImg = charDef.portraitSmall ?? genderImg;

    // ── 장착 무기 (미장착 시 보드 첫 무기로 폴백 — 주 공격 카드와 일치) ──
    const equippedId = gs.player.equipped?.weapon_main ?? gs.player.equipped?.weapon_sub;
    const weaponId   = equippedId ?? CombatSystem.getAvailableWeapons()[0]?.instanceId ?? null;
    const weaponCard = weaponId ? gs.cards[weaponId] : null;
    const weaponDef  = weaponCard ? gs.getCardDef(weaponId) : null;
    const durPct     = weaponCard ? Math.round(weaponCard.durability ?? 100) : 0;
    const armorId    = gs.player.equipped?.body;
    const armorDef   = armorId ? gs.getCardDef(armorId) : null;

    let ammoCount = null;
    if (weaponDef?.combat?.requiresAmmo) {
      const ammoInst = gs.getBoardCards().find(c => c.definitionId === weaponDef.combat.requiresAmmo);
      ammoCount = ammoInst ? (ammoInst.quantity ?? 1) : 0;
    }

    // ── 상태이상 배지 ─────────────────────────────────────────
    const playerStatusHtml = combat.playerStatus.map(s =>
      `<span class="status-badge">${s.name}(${s.duration})</span>`
    ).join('');
    const playerStatusMotionClass = this._statusMotionClasses(combat.playerStatus);

    // ── 적 데이터 ─────────────────────────────────────────────
    const enemyCount  = combat.enemies.length;
    const aliveCount  = combat.enemies.filter(e => e.currentHp > 0).length;
    const playerWeaponType = weaponDef?.weaponType ?? null;
    const isRangedWeapon   = CombatSystem.weaponReachIsRanged(weaponDef);
    const targetEnemy = combat.enemies[combat.targetIndex] ?? combat.enemies[0];

    // ── 적 스프라이트 (전열/후열 진형 — Darkest Dungeon식) ────
    const renderEnemySprite = (enemy, i, visualFront = false) => {
      const isDead   = enemy.currentHp <= 0;
      const wasAlive = enemy._wasAlive ?? !isDead;
      const justDied = wasAlive && isDead;
      const isTarget = i === combat.targetIndex && !isDead;
      const eHpPct   = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
      const eHpClass = eHpPct < 25 ? 'crit' : eHpPct < 50 ? 'low' : '';
      const ghostPct = Math.max(0, ((enemy._prevHp ?? enemy.currentHp) / enemy.maxHp) * 100);
      const visualRow = visualFront ? 'front' : CombatSystem.rowOf(enemy);
      const unreachable = !isDead && !CombatSystem.isEnemyReachable(enemy, isRangedWeapon);

      const enemyLabel = I18n.enemyName(enemy.id ?? enemy.definitionId, enemy.name);
      const enemySheetKey = this._enemySpriteSheetKey(enemy);
      const spriteHtml = enemySheetKey
        ? `${this._renderCombatSpriteSheet(enemySheetKey, 'cv-enemy-img combat-sprite-sheet cv-enemy-sheet', enemyLabel)}
           <div class="cv-enemy-icon img-fallback">${enemy.icon ?? '?뫞'}</div>`
        : enemy.image
        ? `<img class="cv-enemy-img" src="${enemy.image}" alt="${enemy.name}"
              onerror="this.style.display='none';var f=this.parentElement.querySelector('.cv-enemy-icon');if(f)f.style.display='flex';">
           <div class="cv-enemy-icon img-fallback">${enemy.icon ?? '👾'}</div>`
        : `<div class="cv-enemy-icon">${enemy.icon ?? '👾'}</div>`;

      const perEnemyStatus = (enemy._statusEffects ?? []).map(s =>
        `<span class="status-badge enemy">${s.name}(${s.duration})</span>`
      ).join('');
      const enemyStatusMotionClass = this._statusMotionClasses(enemy._statusEffects ?? []);

      let affinityHint = '';
      if (playerWeaponType && !isDead) {
        if (enemy.weaknesses?.includes(playerWeaponType))
          affinityHint = `<span class="affinity-badge weakness">${WEAKNESS_LABEL[playerWeaponType] ?? '⬆약점'}</span>`;
        else if (enemy.resistances?.includes(playerWeaponType))
          affinityHint = `<span class="affinity-badge resistance">${RESIST_LABEL[playerWeaponType] ?? '⬇저항'}</span>`;
      }

      // 의도 예고 배지 — 머리 위에 [행동 아이콘][카운트다운]➤[타겟 아이콘]
      let intentHtml = '';
      const intent = enemy._nextIntent;
      if (!isDead && intent) {
        const cd = intent.countdown != null ? `<b class="cvi-cd">${intent.countdown}</b>` : '';
        const tgtIcon = intent.targetType === 'companion'
          ? (COMPANION_ICONS[intent.targetId] ?? '🤝')
          : '👤';
        // 전진 의도는 타겟 연계 화살표 없이 아이콘만 표시
        const linkHtml = intent.action === 'advance'
          ? ''
          : `<span class="cvi-arrow">➤</span><span class="cvi-target">${tgtIcon}</span>`;
        const imminent = intent.countdown != null && intent.countdown <= 1;
        intentHtml = `
          <div class="cv-intent${imminent ? ' imminent' : ''}" title="${intent.label ?? ''}">
            <span class="cvi-icon">${intent.iconEmoji ?? '🗡'}</span>${cd}${linkHtml}
          </div>`;
      }

      const rowBadge = visualRow === 'back' && !isDead
        ? `<span class="cv-row-badge">${I18n.t('combat.rankBack')}${unreachable ? ' 🚫' : ''}</span>`
        : '';

      const enemyKindClass = enemy.type === 'zombie' || String(enemy.id ?? enemy.definitionId ?? '').includes('zombie')
        ? 'enemy-zombie motion-zombie-idle'
        : 'enemy-human';

      const spriteClass = ['cv-enemy-sprite',
        enemyKindClass,
        enemyStatusMotionClass,
        isTarget ? 'is-target' : '', isDead ? 'is-dead' : '',
        justDied ? 'just-died motion-zombie-death' : '', isEntry ? 'entering' : '',
        unreachable ? 'unreachable' : '',
      ].filter(Boolean).join(' ');

      return `
        <div class="${spriteClass}" data-idx="${i}">
          ${intentHtml}
          ${spriteHtml}
          ${affinityHint}
          ${rowBadge}
          <div class="cv-hp-overlay">
            <div class="cv-hp-name">${I18n.enemyName(enemy.id ?? enemy.definitionId, enemy.name)}${isDead ? ' 💀' : isTarget ? ' ◀' : ''}</div>
            <div class="cv-hp-bar-track">
              <div class="cv-hp-bar-ghost" data-idx="${i}" style="width:${ghostPct.toFixed(1)}%"></div>
              <div class="cv-hp-bar-fill ${eHpClass}" style="width:${eHpPct.toFixed(1)}%"></div>
            </div>
            <div class="cv-hp-text">${Math.max(0, enemy.currentHp)} / ${enemy.maxHp}</div>
            ${perEnemyStatus ? `<div class="cv-status-row">${perEnemyStatus}</div>` : ''}
          </div>
        </div>`;
    };

    const frontEnemies = combat.enemies.map((e, i) => ({ e, i })).filter(x => CombatSystem.rowOf(x.e) === 'front');
    const backEnemies  = combat.enemies.map((e, i) => ({ e, i })).filter(x => CombatSystem.rowOf(x.e) === 'back');
    const frontRankHtml = frontEnemies.map(x => renderEnemySprite(x.e, x.i)).join('');
    const backRankHtml  = backEnemies.map(x => renderEnemySprite(x.e, x.i)).join('');
    const aliveEnemyEntries = combat.enemies
      .map((e, i) => ({ e, i }))
      .filter(x => (x.e.currentHp ?? 0) > 0);
    const hasLivingFrontEnemy = aliveEnemyEntries.some(x => CombatSystem.rowOf(x.e) === 'front');
    const stageEnemyEntries = aliveEnemyEntries.map(x => ({
      ...x,
      visualFront: !hasLivingFrontEnemy && CombatSystem.rowOf(x.e) === 'back',
    }));

    // ── 아군 횡렬 진형 (동료 최대 2 + 플레이어) ───────────────
    const stageCompanions = (gs.companions ?? []).slice(0, 2);
    const companionUnitsHtml = stageCompanions.map((npcId, rankIdx) => {
      const st = gs.npcs?.states?.[npcId];
      const hp = st?.hp ?? 0;
      const maxHp = st?.maxHp ?? 50;
      const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
      const name = I18n.itemName(npcId, st?.name ?? npcId);
      return `
        <div class="cv-ally cv-ally-unit companion-unit${hp <= 0 ? ' is-dead' : ''}" data-companion-id="${npcId}" title="${name}">
          <div class="cv-rank-token">A${rankIdx + 1}</div>
          <div class="cv-unit-body">
            ${this._companionSpriteSheetKey(npcId)
              ? this._renderCombatSpriteSheet(this._companionSpriteSheetKey(npcId), 'cv-ally-icon combat-sprite-sheet cv-companion-sheet', name)
              : ''}
            <span class="cv-ally-icon">${COMPANION_ICONS[npcId] ?? '👤'}</span>
          </div>
          <div class="cv-unit-plate">
            <div class="cv-unit-name">${name}</div>
            <div class="cv-hp-bar-track">
              <div class="cv-hp-bar-fill" style="width:${pct.toFixed(0)}%"></div>
            </div>
            <div class="cv-hp-text">HP ${hp}/${maxHp}</div>
          </div>
        </div>`;
    }).join('');

    const playerGenderClass = gs.player.gender === 'F' ? 'player-female' : 'player-male';
    const playerRank = CombatSystem.playerRankOf(combat);
    const playerRankLabel = playerRank === 'back' ? I18n.t('combat.rankBack') : I18n.t('combat.rankFront');
    const nextPlayerRankLabel = playerRank === 'back' ? I18n.t('combat.rankFront') : I18n.t('combat.rankBack');
    const playerUnitHtml = `
      <div class="cv-player cv-ally-unit player-unit player-rank-${playerRank} ${playerGenderClass} motion-idle ${playerStatusMotionClass}">
        <div class="cv-rank-token">P-${playerRankLabel}</div>
        <div class="cv-unit-body">
          ${playerSpriteSheetKey
            ? this._renderCombatSpriteSheet(playerSpriteSheetKey, 'cv-player-img combat-sprite-sheet cv-player-sheet', gs.player.name ?? '')
            : ''}
          <img class="cv-player-img cv-player-fallback-img" src="${playerImg}" alt="${gs.player.name ?? ''}"
               onerror="if(this.src.indexOf('${genderImg.replace('./', '')}')<0){this.src='${genderImg}';}">
        </div>
        <div class="cv-unit-plate">
          <div class="cv-unit-name">${gs.player.name ?? '생존자'}</div>
          <div class="cv-hp-bar-track">
            <div class="cv-hp-bar-ghost cpp-bar-ghost" style="width:${prevPHpPct.toFixed(1)}%"></div>
            <div class="cv-hp-bar-fill ${hpClass}" style="width:${hpPct.toFixed(1)}%"></div>
          </div>
          <div class="cv-unit-meta">HP ${gs.player.hp.current}/${gs.player.hp.max} · STA ${Math.round(gs.stats.stamina.current)}</div>
          ${playerStatusHtml ? `<div class="cv-status-row">${playerStatusHtml}</div>` : ''}
        </div>
      </div>`;

    // ── 환경 정보 ─────────────────────────────────────────────
    const isNight   = NightSystem.isNight();
    const noise     = gs.noise?.level ?? 0;
    const distText  = noise < 30 ? '🎯 원거리' : noise < 60 ? '🎯 중거리' : '🎯 근거리';
    const lightText = isNight ? '🌙 어둠' : '☀️ 보통';
    const noiseText = noise < 35 ? '🔇 낮음' : noise < 65 ? '🔈 보통' : '🔊 높음';
    const coverText = '🏠 부분';

    // ── 전투 로그 ─────────────────────────────────────────────
    const LOG_CLS = [
      [I18n.t('combat.logCrit'),     'crit'],
      [I18n.t('combat.logAttack'),   'hit'],
      [I18n.t('combat.logEnemyAtk'), 'dmg'],
      [I18n.t('combat.logBleed'),    'bleed'], [I18n.t('combat.logAcid'),  'bleed'],
      [I18n.t('combat.logStun'),     'warn'],  [I18n.t('combat.logSmash'), 'warn'],
      [I18n.t('combat.logItem'),     'heal'],
      [I18n.t('combat.logStealth'),  'info'],  [I18n.t('combat.logFlee'), 'info'],
    ];
    const getLogCls = l => (LOG_CLS.find(([p]) => l.startsWith(p)) ?? ['', 'info'])[1];
    const logHtml   = combat.log.slice(-10).map(l =>
      `<div class="combat-log-entry ${getLogCls(l)}">${l}</div>`
    ).join('');
    const lastLog = combat.log.length > 0 ? combat.log[combat.log.length - 1] : '';

    // ── 공격 미리보기 ──────────────────────────────────────────
    const preview = CombatSystem.previewAttack(weaponId ?? null);

    // ── 위치 / 시간 / 날씨 / 위험도 ──────────────────────────
    const districtName = DISTRICTS[gs.location?.currentDistrict]?.name ?? (gs.location?.currentDistrict ?? '알 수 없음');
    const gameHour     = String(gs.time?.hour ?? 0).padStart(2, '0');
    const weatherIcon  = gs.weather?.icon ?? '🌤';
    const weatherName  = gs.weather?.name ?? '';
    const dangerLv     = combat.dangerLevel ?? 2;
    const dangerText   = DANGER_LABEL[Math.min(dangerLv, 5)] ?? '위험';
    const dangerColor  = DANGER_COLOR[Math.min(dangerLv, 5)] ?? '#cc3333';

    // ── 아이템 / 투척물 / 동행 ────────────────────────────────
    const medicals   = CombatSystem.getAvailableMedicals();
    const throwables = CombatSystem.getAvailableThrowables();
    const companions = gs.companions ?? [];
    const atkCd      = combat._companionAttackCooldown ?? 0;
    const healCd     = combat._companionHealCooldown   ?? 0;
    const weapons    = CombatSystem.getAvailableWeapons();
    const guardActive = !!combat.playerGuard?.active;
    const currentEntry = CombatSystem.currentEntry(combat);
    const manualCompanionTurn = currentEntry?.type === 'companion'
      && CombatSystem.isManualCompanionTurn(combat);
    const activeCompanionId = manualCompanionTurn ? currentEntry.id : null;
    const canPlayerAct = CombatSystem.canPlayerAct(combat);

    const medBtnsHtml = medicals.length > 0
      ? medicals.map(m => {
          const def  = gs.getCardDef(m.instanceId);
          const heal = def?.use?.hp ?? '';
          return `<button class="ac-item-btn" data-action="useItem" data-weapon="${m.instanceId}">
            ${def?.icon ?? '💊'} ${I18n.itemName(def?.id ?? m.definitionId, def?.name ?? 'item')}${heal ? ` <em>+${heal}HP</em>` : ''}
          </button>`;
        }).join('')
      : `<span class="ac-no-item">아이템 없음</span>`;

    // ── 보조 버튼 행 ──────────────────────────────────────────
    const extraWeaponBtns = weapons.slice(1).map(w => {
      const def = gs.getCardDef(w.instanceId);
      return `<button class="sec-btn" data-action="attack" data-weapon="${w.instanceId}">
        ${def?.icon ?? '⚔'} ${I18n.itemName(def?.id ?? w.definitionId, def?.name ?? '')}
      </button>`;
    }).join('');

    const throwBtns = throwables.map(t => {
      const def = gs.getCardDef(t.instanceId);
      return `<button class="sec-btn" data-action="throwable" data-weapon="${t.instanceId}">
        ${def?.icon ?? '💣'} ${I18n.itemName(def?.id ?? t.definitionId, def?.name ?? '')}
      </button>`;
    }).join('');

    const activeCompanionName = activeCompanionId
      ? I18n.itemName(activeCompanionId, gs.npcs?.states?.[activeCompanionId]?.name ?? activeCompanionId)
      : '';
    const companionActionCardsHtml = manualCompanionTurn ? `
          <div class="action-card companion-action-card primary" data-action="manualCompanionAttack" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">⚔</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 공격</span>
                <span class="ac-sub">COMPANION ATTACK</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>대상</span><strong>${I18n.enemyName(targetEnemy?.id ?? targetEnemy?.definitionId, targetEnemy?.name ?? '')}</strong></div>
              <div class="ac-row"><span>행동</span><strong>선택 적 공격</strong></div>
            </div>
          </div>
          <div class="action-card companion-action-card" data-action="manualCompanionHeal" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">✚</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 치료</span>
                <span class="ac-sub">COMPANION HEAL</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>대상</span><strong>플레이어</strong></div>
              <div class="ac-row good"><span>조건</span><strong>HP 낮을 때 효과</strong></div>
            </div>
          </div>
          <div class="action-card companion-action-card" data-action="manualCompanionSupport" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">2</span>
            <div class="ac-header">
              <span class="ac-icon">✦</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 지원</span>
                <span class="ac-sub">COMPANION SKILL</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>스킬</span><strong>직업 지원</strong></div>
              <div class="ac-row"><span>쿨다운</span><strong>가능 시 사용</strong></div>
            </div>
          </div>
          <div class="action-card companion-action-card" data-action="manualCompanionHold" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">◼</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 대기</span>
                <span class="ac-sub">COMPANION HOLD</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>효과</span><strong>피해 감소</strong></div>
              <div class="ac-row good"><span>턴</span><strong>동료 행동 종료</strong></div>
            </div>
          </div>` : '';
    const companionBtns = manualCompanionTurn ? `
      <button class="sec-btn companion manual" data-action="manualCompanionAttack" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 공격
      </button>
      <button class="sec-btn companion manual" data-action="manualCompanionHeal" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 치료
      </button>
      <button class="sec-btn companion manual" data-action="manualCompanionSupport" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 지원
      </button>
      <button class="sec-btn companion manual secondary" data-action="manualCompanionHold" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 대기
      </button>` : false ? `
      <button class="sec-btn companion" data-action="companionAttack" ${atkCd > 0 ? 'disabled' : ''}>
        ⚔️ 동행 공격${atkCd > 0 ? ` (${atkCd})` : ''}
      </button>
      <button class="sec-btn companion" data-action="companionHeal" ${healCd > 0 ? 'disabled' : ''}>
        💉 동행 치료${healCd > 0 ? ` (${healCd})` : ''}
      </button>` : '';

    // ── 적 패널 (우측) ────────────────────────────────────────
    const tEnemy    = targetEnemy;
    const tHpPct    = tEnemy ? Math.max(0, (tEnemy.currentHp / tEnemy.maxHp) * 100) : 0;
    const tHpCls    = tHpPct < 25 ? 'crit' : tHpPct < 50 ? 'low' : '';
    const tGhostPct = tEnemy ? Math.max(0, ((tEnemy._prevHp ?? tEnemy.currentHp) / tEnemy.maxHp) * 100) : 0;

    const weaknessTags = (tEnemy?.weaknesses ?? []).map(w =>
      `<span class="trait-tag weak">${WEAKNESS_LABEL[w] ?? w}</span>`).join('');
    const resistTags = (tEnemy?.resistances ?? []).map(r =>
      `<span class="trait-tag resist">${RESIST_LABEL[r] ?? r}</span>`).join('');
    const skillTags = (tEnemy?.specialSkills ?? []).map(s =>
      `<span class="trait-tag special">⚡${s.name}</span>`).join('');

    const enemyListHtml = enemyCount > 1 ? `
      <div class="cep-enemy-list">
        ${combat.enemies.map((e, i) => {
          const dead   = e.currentHp <= 0;
          const active = i === combat.targetIndex;
          const hp     = Math.max(0, Math.round((e.currentHp / e.maxHp) * 100));
          const rowTag = CombatSystem.rowOf(e) === 'back' ? ` <small>[${I18n.t('combat.rankBack')}]</small>` : '';
          return `<div class="cep-enemy-item ${active ? 'active' : ''} ${dead ? 'dead' : ''}" data-idx="${i}">
            <span>${e.icon ?? '👾'}</span>
            <span>${I18n.enemyName(e.id ?? e.definitionId, e.name)}${rowTag}</span>
            <span>${dead ? '💀' : hp + '%'}</span>
          </div>`;
        }).join('')}
      </div>` : '';

    // ══════════════════════════════════════════════════════════
    // HTML 조립
    // ══════════════════════════════════════════════════════════
    this._screen.innerHTML = `
      <div class="combat-wrap${canPlayerAct ? '' : ' actor-locked'}${manualCompanionTurn ? ' manual-companion-turn' : ''}">

        <!-- ① 상단 바 ────────────────────────────────────── -->
        <header class="combat-top-bar">
          <span class="ctb-brand">SURVIVAL: SEOUL</span>
          <div class="ctb-center">
            <span class="ctb-chip">📍 ${districtName}</span>
            <span class="ctb-chip">⏱ ${gameHour}:00</span>
            <span class="ctb-chip">${weatherIcon} ${weatherName}</span>
            ${isNight ? '<span class="ctb-chip night">🌙 야간</span>' : ''}
          </div>
          <div class="ctb-right">
            <span class="ctb-chip${isNewRound ? ' pulse' : ''}">전투 턴 ${combat.round}</span>
            <span class="ctb-chip danger-chip" style="color:${dangerColor};border-color:${dangerColor}55">위험: ${dangerText}</span>
          </div>
        </header>

        <!-- ①-b Initiative 바 (Phase 1) ──────────────────── -->
        ${CombatUI._renderInitiativeBar(combat, gs)}

        <!-- ② 메인 전장 ─────────────────────────────────── -->
        <div class="combat-main">
          <div class="combat-visual${isHpCrit ? ' hp-crit' : ''}"
               style="background-image:url('${BATTLE_BG}')">
            ${isNight ? '<div class="combat-night-tint"></div>' : ''}

            <div class="cv-context-overlay">
              <span>${distText}</span>
              <span>${coverText}</span>
              <span>${lightText}</span>
              <span>${noiseText}</span>
            </div>

            <div class="combat-stage-lineup cv-stage">
              <div class="cv-ally-line">
                ${companionUnitsHtml}
                ${playerUnitHtml}
              </div>
              <div class="cv-lineup-gap">
                <div class="cv-range-label">${distText.replace('🎯 ', '')}</div>
              </div>
              <div class="cv-enemy-line count-${Math.min(stageEnemyEntries.length || 1, 4)}${!hasLivingFrontEnemy ? ' is-front-filled' : ''}">
                ${stageEnemyEntries.map(({ e, i, visualFront }) => renderEnemySprite(e, i, visualFront)).join('')}
              </div>
            </div>

            ${lastLog ? `<div class="cv-log-overlay">${lastLog}</div>` : ''}
          </div>

        </div><!-- .combat-main -->

        <!-- ③ 하단: 액션 카드 바 ───────────────────────── -->
        <footer class="combat-action-bar">
          ${companionActionCardsHtml}

          <!-- 공격 카드 -->
          <div class="action-card primary" data-action="${weaponId ? 'attack' : 'unarmed'}" data-weapon="${weaponId ?? ''}">
            <span class="ac-cost">${weaponDef?.combat?.requiresAmmo ? 2 : 1}</span>
            <div class="ac-header">
              <span class="ac-icon">${weaponDef?.icon ?? '👊'}</span>
              <div class="ac-title-group">
                <span class="ac-name">${weaponDef ? I18n.itemName(weaponDef.id, weaponDef.name) : '맨손'}</span>
                <span class="ac-sub">ATTACK</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>예상 피해</span><strong>${preview.dmgMin}~${preview.dmgMax}</strong></div>
              <div class="ac-row"><span>명중률</span><strong>${preview.accuracy}%</strong></div>
              ${preview.critChance > 0 ? `<div class="ac-row"><span>치명타</span><strong>${preview.critChance}%</strong></div>` : ''}
              ${preview.ammoLeft !== null ? `<div class="ac-row${preview.ammoLeft === 0 ? ' warn' : ''}"><span>탄약</span><strong>${preview.ammoLeft}발</strong></div>` : ''}
            </div>
          </div>

          <!-- 방어 카드 -->
          <div class="action-card${guardActive ? ' active' : ''}" data-action="guard">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">🛡️</span>
              <div class="ac-title-group">
                <span class="ac-name">방어${guardActive ? ' ✓' : ''}</span>
                <span class="ac-sub">DEFEND</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>피해 감소</span><strong>-55%</strong></div>
              <div class="ac-row"><span>반격 보너스</span><strong>+30%</strong></div>
              ${guardActive ? '<div class="ac-row good"><span>상태</span><strong>방어 중</strong></div>' : ''}
            </div>
          </div>

          <!-- 아이템 카드 -->
          <div class="action-card items">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">🎒</span>
              <div class="ac-title-group">
                <span class="ac-name">아이템 <small>(${medicals.length})</small></span>
                <span class="ac-sub">USE ITEM</span>
              </div>
            </div>
            <div class="ac-item-list">${medBtnsHtml}</div>
          </div>

          <!-- 이동 카드 -->
          <div class="action-card move" data-action="move">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">👣</span>
              <div class="ac-title-group">
                <span class="ac-name">이동</span>
                <span class="ac-sub">MOVE</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>현재</span><strong>${playerRankLabel}</strong></div>
              <div class="ac-row good"><span>이동</span><strong>${nextPlayerRankLabel}</strong></div>
            </div>
          </div>

          <!-- 도주 카드 -->
          <div class="action-card flee" data-action="flee">
            <span class="ac-cost">2</span>
            <div class="ac-header">
              <span class="ac-icon">🏃</span>
              <div class="ac-title-group">
                <span class="ac-name">도주</span>
                <span class="ac-sub">FLEE</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>성공률</span><strong>60%</strong></div>
              <div class="ac-row warn"><span>실패 시</span><strong>피해 ×1.5</strong></div>
            </div>
          </div>

        </footer>

        <!-- ④ 보조 액션 행 ──────────────────────────────── -->
        <div class="combat-sec-row">
          ${extraWeaponBtns}
          ${throwBtns}
          ${companionBtns}
          <button class="sec-btn" data-action="unarmed">👊 맨손</button>
          <button class="sec-btn secondary" data-action="stealth">🤫 은신</button>
        </div>

      </div><!-- .combat-wrap -->
    `;

    // ── ghost bar 애니메이션 (rAF) ─────────────────────────────
    requestAnimationFrame(() => {
      // 중앙 시각 패널 적 ghost bars
      this._screen.querySelectorAll('.cv-hp-bar-ghost[data-idx]').forEach(el => {
        const idx   = parseInt(el.dataset.idx, 10);
        const enemy = combat.enemies[idx];
        if (!enemy) return;
        const pct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
        el.style.width = pct.toFixed(1) + '%';
        enemy._prevHp = enemy.currentHp;
      });

      // 우측 패널 타겟 ghost bar
      const cepGhost = this._screen.querySelector('.cep-ghost');
      if (cepGhost && tEnemy) {
        cepGhost.style.width = (Math.max(0, (tEnemy.currentHp / tEnemy.maxHp) * 100)).toFixed(1) + '%';
      }

      // 좌측 패널 플레이어 ghost bar
      const ppGhost = this._screen.querySelector('.cpp-bar-ghost');
      if (ppGhost) {
        ppGhost.style.width = hpPct.toFixed(1) + '%';
        this._prevPlayerHp = hpPct;
      }

      for (const enemy of combat.enemies) enemy._wasAlive = enemy.currentHp > 0;
    });

    // ── 로그 스크롤 ───────────────────────────────────────────
    const logEl = this._screen.querySelector('#combat-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;

    if (manualCompanionTurn) {
      this._syncManualCompanionActionUi(activeCompanionId);
    }

    // ── 적 스프라이트 클릭 (타겟 변경) ───────────────────────
    this._screen.querySelectorAll('.cv-enemy-sprite:not(.is-dead)').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (!Number.isNaN(idx)) { CombatSystem.setTarget(idx); this.render(); }
      });
    });

    // ── Phase 2 · 동료 stance 버튼 클릭 ──────────────────────
    this._screen.querySelectorAll('.stance-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const npcId = btn.dataset.npcId;
        const stance = btn.dataset.stance;
        if (!npcId || !stance) return;
        const st = GameState.npcs?.states?.[npcId];
        if (st) {
          st.stance = stance;
          this.render();
        }
      });
    });

    // ── 우측 패널 적 목록 클릭 ────────────────────────────────
    this._screen.querySelectorAll('.cep-enemy-item:not(.dead)').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (!Number.isNaN(idx)) { CombatSystem.setTarget(idx); this.render(); }
      });
    });

    // ── 액션 버튼 ────────────────────────────────────────────
    this._screen.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        const action   = btn.dataset.action;
        const wId      = btn.dataset.weapon || null;

        if (action === 'manualCompanionAttack') {
          CombatSystem.resolveManualCompanionAction('attack', btn.dataset.companionId);
        } else if (action === 'manualCompanionHeal') {
          CombatSystem.resolveManualCompanionAction('heal', btn.dataset.companionId);
        } else if (action === 'manualCompanionSupport') {
          CombatSystem.resolveManualCompanionAction('support', btn.dataset.companionId);
        } else if (action === 'manualCompanionHold') {
          CombatSystem.resolveManualCompanionAction('hold', btn.dataset.companionId);
        } else if (!CombatSystem.canPlayerAct(GameState.combat)) {
          return;
        } else if (action === 'attack' && wId) {
          CombatSystem.resolveAction('shoot', wId);
        } else if (action === 'unarmed') {
          CombatSystem.resolveAction('melee', null);
        } else if (action === 'useItem' && wId) {
          CombatSystem.resolveAction('useItem', wId);
        } else if (action === 'throwable' && wId) {
          CombatSystem.resolveAction('throwable', wId);
        } else {
          CombatSystem.resolveAction(action);
        }

        if (GameState.combat.active) {
          this.render();
        }
      });
    });

    // ── 연출 큐 재생 (행동 결과 → 순차 애니메이션) ───────────
    this._playFxQueue();
  },

  _companionClassSkill(npcId) {
    return BALANCE.combat?.companionAuto?.classSkills?.[npcId] ?? null;
  },

  _syncManualCompanionActionUi(npcId) {
    if (!this._screen || !npcId) return;

    const actionBar = this._screen.querySelector('.combat-action-bar');
    if (actionBar) {
      actionBar.querySelectorAll('.action-card:not(.companion-action-card)')
        .forEach(el => el.remove());
    }

    const secRow = this._screen.querySelector('.combat-sec-row');
    if (secRow) {
      secRow.querySelectorAll('[data-action]').forEach(el => {
        if (!String(el.dataset.action ?? '').startsWith('manualCompanion')) el.remove();
      });
    }

    const supportCard = this._screen.querySelector('.companion-action-card[data-action="manualCompanionSupport"]');
    if (!supportCard) return;

    const skill = this._companionClassSkill(npcId);
    const state = GameState.npcs?.states?.[npcId];
    const npcName = I18n.itemName(npcId, state?.name ?? npcId);
    const nameEl = supportCard.querySelector('.ac-name');
    const subEl = supportCard.querySelector('.ac-sub');
    const previewEl = supportCard.querySelector('.ac-preview');

    if (!skill) {
      supportCard.classList.add('disabled');
      supportCard.setAttribute('aria-disabled', 'true');
      if (nameEl) nameEl.textContent = `${npcName} 지원 없음`;
      if (subEl) subEl.textContent = 'NO CLASS SKILL';
      if (previewEl) {
        previewEl.innerHTML = `
          <div class="ac-row warn"><span>스킬</span><strong>설정된 전투 스킬 없음</strong></div>
          <div class="ac-row"><span>대체</span><strong>공격/치료/대기 사용</strong></div>`;
      }
      return;
    }

    const cooldown = state?.skillCooldowns?.[skill.id] ?? 0;
    const ready = cooldown <= 0;
    supportCard.classList.toggle('disabled', !ready);
    supportCard.setAttribute('aria-disabled', ready ? 'false' : 'true');
    supportCard.dataset.skillId = skill.id;
    if (nameEl) nameEl.textContent = `${npcName} ${skill.name}`;
    if (subEl) subEl.textContent = skill.id;
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="ac-row"><span>스킬</span><strong>${skill.name}</strong></div>
        <div class="ac-row ${ready ? 'good' : 'warn'}"><span>상태</span><strong>${ready ? '사용 가능' : `쿨다운 ${cooldown}턴`}</strong></div>
        <div class="ac-row"><span>행동</span><strong>동료 고유 스킬</strong></div>`;
    }
  },

  // Phase 2 — 동료 stance 셀렉터 + 클래스 스킬 쿨다운 배지
  _renderStanceSelector(npcId, state) {
    const stances = [
      { key: 'attack',  icon: '🗡', label: '공격' },
      { key: 'heal',    icon: '💉', label: '치료' },
      { key: 'support', icon: '⚙',  label: '지원' },
      { key: 'hold',    icon: '🛡', label: '방어' },
      { key: 'manual',  icon: '✋', label: '대기' },
    ];
    const active = state?.stance ?? 'attack';

    const btnHtml = stances.map(s => {
      const sel = s.key === active ? ' active' : '';
      return `<button class="stance-btn${sel}" data-stance="${s.key}" data-npc-id="${npcId}" title="${s.label}">${s.icon}</button>`;
    }).join('');

    // 클래스 스킬 쿨다운 배지
    const skill = BALANCE.combat?.companionAuto?.classSkills?.[npcId];
    let skillHtml = '';
    if (skill) {
      const cd = state?.skillCooldowns?.[skill.id] ?? 0;
      const ready = cd === 0;
      skillHtml = `<span class="skill-cd-badge${ready ? ' ready' : ''}" title="${skill.name}">
          ${ready ? '✨' : `⏳${cd}`} ${skill.name}
        </span>`;
    }

    return `<div class="cpp-stance-row" style="margin-top:5px;display:flex;gap:3px;align-items:center;flex-wrap:wrap;">
      ${btnHtml}
      ${skillHtml}
    </div>`;
  },

  /** 동반자(NPC) 전투 상태 패널 — 플레이어 패널 하단에 표시 */
  _renderCompanionsPanel(gs) {
    const companions = gs.companions ?? [];
    if (companions.length === 0) return '';
    const foragingToday = gs.npcs?._foragingToday ?? {};
    const rows = companions.map(npcId => {
      const state = gs.npcs?.states?.[npcId];
      if (!state) return '';
      const iconMap = {
        npc_dog: '🐕', npc_nurse: '👩‍⚕️', npc_soldier_deserter: '🪖',
        npc_child: '👧', npc_mechanic: '🔧', npc_trader: '🧳',
        npc_student: '📖', npc_old_survivor: '👴',
      };
      const icon = iconMap[npcId] ?? '👤';
      const name = I18n.itemName(npcId, state.name ?? npcId);
      const hp = state.hp ?? 50;
      const maxHp = state.maxHp ?? 50;
      const hpPct = Math.max(0, (hp / maxHp) * 100);
      const foraging = foragingToday[npcId];
      const statusTag = foraging
        ? '<span style="color:var(--text-warn);font-size:10px;">🌿 탐색중</span>'
        : '<span style="color:var(--text-good);font-size:10px;">⚔ 전투 가능</span>';

      // 유대감(bond) 표시: 군견뿐 아니라 bond 값이 존재하면 모든 동반자에게 렌더
      const bond = state.bond ?? 0;
      const tier = bond >= 91 ? 'kindred'
                 : bond >= 61 ? 'bonded'
                 : bond >= 31 ? 'friendly'
                 : 'baseline';
      const tierLabel = tier === 'kindred' ? '혈맹'
                      : tier === 'bonded' ? '친밀'
                      : tier === 'friendly' ? '우호'
                      : '경계';
      const tierColor = tier === 'kindred' ? '#f4c861'
                      : tier === 'bonded' ? '#6dd36d'
                      : tier === 'friendly' ? '#d9c54a'
                      : '#888';
      const showBond = npcId === 'npc_dog' || bond > 0;
      const bondHtml = showBond ? `
          <div class="cpp-bar-wrap" style="margin-top:3px;background:rgba(255,255,255,0.06);height:4px;border-radius:2px;overflow:hidden;">
            <div style="width:${bond}%;height:100%;background:${tierColor};"></div>
          </div>
          <div style="font-size:10px;color:${tierColor};">유대 ${bond}/100 (${tierLabel})</div>` : '';

      const tierBadge = showBond
        ? `<span style="font-size:10px;color:${tierColor};margin-left:4px;">[${tierLabel}]</span>`
        : '';

      // Phase 2 — stance selector
      const stanceHtml = CombatUI._renderStanceSelector(npcId, state);

      return `
        <div class="cpp-companion-row" data-companion-id="${npcId}" style="margin-top:8px;padding:6px;background:rgba(255,255,255,0.04);border-radius:4px;position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;">${icon} <strong>${name}</strong>${tierBadge}</span>
            ${statusTag}
          </div>
          <div class="cpp-bar-wrap" style="margin-top:4px;">
            <div class="cpp-bar ${hpPct < 30 ? 'low' : ''}" style="width:${hpPct.toFixed(1)}%;"></div>
          </div>
          <div style="font-size:10px;color:var(--text-dim);">HP ${hp}/${maxHp}</div>
          ${bondHtml}
          ${stanceHtml}
        </div>`;
    }).join('');
    return `<div class="cpp-companions" style="margin-top:10px;border-top:1px solid var(--border-dim);padding-top:8px;">
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">👥 동반자</div>
      ${rows}
    </div>`;
  },
};

export default CombatUI;
