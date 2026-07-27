// CombatUI 믹스인 — 전투 연출 재생(fx 큐/모션/카메라/스프라이트시트 헬퍼).
// 메서드는 CombatUI 객체에 스프레드되어 this=CombatUI로 실행된다.
import EventBus     from '../../core/EventBus.js';
import GameState    from '../../core/GameState.js';
import CombatSystem from '../../systems/CombatSystem.js';
import {
  CAMERA_CLASSES,
  COMBAT_MOTION_CLASSES,
  COMBAT_SPRITE_SHEETS,
  COMPANION_ICONS,
  COMPANION_SPRITE_KEYS,
  ENEMY_SPRITE_KEYS,
  FX_DURATIONS,
  FX_EMOJI,
  PLAYER_SPRITE_KEYS,
  STATUS_MOTION_CLASSES,
} from './combatUiAssets.js';

export const CombatFxPlayer = {
  // ── 전투 연출 재생 (CombatSystem.fxQueue → 순차 재생) ──

  _fxSpeed: 1,
  _fxTimers: [],

  _playFxQueue() {
    const combat = GameState.combat;
    const queue  = combat?.fxQueue;
    if (!Array.isArray(queue) || queue.length === 0) return;
    combat.fxQueue = [];
    const speed = this._fxSpeed > 0 ? this._fxSpeed : 1;
    let delay = 80;
    for (const fx of queue) {
      this._fxTimers.push(setTimeout(() => this._playFx(fx), Math.round(delay / speed)));
      delay += FX_DURATIONS[fx.kind] ?? 300;
    }
  },

  // 진행 중인 연출을 건너뛴다 — 상태는 이미 반영돼 있으므로 잔여 코스메틱만 취소
  skipFxQueue() {
    if (this._fxTimers.length === 0) return false;
    this._fxTimers.forEach(clearTimeout);
    this._fxTimers = [];
    return true;
  },

  toggleFxSpeed() {
    this._fxSpeed = this._fxSpeed >= 2 ? 1 : 2;
    return this._fxSpeed;
  },

  _enemySpriteEl(idx) { return this._screen?.querySelector(`.cv-enemy-sprite[data-idx="${idx}"]`); },
  _playerSpriteEl()   { return this._screen?.querySelector('.cv-player'); },
  _combatantEl(combatantId) {
    if (typeof combatantId !== 'string' || combatantId.length === 0) return null;
    const safeId = globalThis.CSS?.escape
      ? globalThis.CSS.escape(combatantId)
      : combatantId.replace(/["\\]/g, '\\$&');
    return this._screen?.querySelector(`[data-combatant-id="${safeId}"]`);
  },
  _allyEl(npcId) {
    return this._screen?.querySelector(`.cv-ally[data-companion-id="${npcId}"]`)
        ?? this._screen?.querySelector(`[data-companion-id="${npcId}"]`);
  },

  _playerSpriteSheetKey(gs = GameState) {
    const key = PLAYER_SPRITE_KEYS[`${gs.player?.characterId ?? ''}:${gs.player?.gender ?? ''}`];
    return key && COMBAT_SPRITE_SHEETS[key] ? key : null;
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
    // steps(N, jump-none) walks the 0→100% ramp onto exactly N columns. Works for any N
    // (≤6 or >6); jump-none needs ≥2 steps, so clamp. Overrides the stylesheet's linear inline.
    const parts = [
      `--sprite-url: url('${sheet.src}')`,
      `--sprite-cols: ${sheet.cols}`,
      `--sprite-rows: ${sheet.rows}`,
    ];
    if (Array.isArray(sheet.frameDur) && sheet.frameDur.length) {
      const defaultDurations = [920, 620, 760, 820];
      parts.push('animation-timing-function: step-end');
      for (let row = 0; row < (sheet.rows | 0); row++) {
        const durations = sheet.frameDur[row];
        const total = Array.isArray(durations) && durations.length
          ? durations.reduce((sum, duration) => sum + (+duration || 0), 0)
          : (defaultDurations[row] || 800);
        parts.push(`--anim-r${row}: spriteanim_${sheetKey}_r${row}`);
        parts.push(`--sprite-dur-r${row}: ${Math.round(total)}ms`);
      }
    } else {
      const steps = Math.max(2, sheet.cols | 0);
      parts.push(`animation-timing-function: steps(${steps}, jump-none)`);
    }
    return parts.join('; ');
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
    // 사운드 시스템 결선 지점 — 오디오 도입 시 이 이벤트만 구독하면 된다
    EventBus.emit('combatSfx', {
      kind: fx.kind,
      fx: fx.fx ?? null,
      crit: fx.crit === true,
      miss: fx.miss === true,
      killed: fx.killed === true,
    });
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
        this._hitstop(fx.crit ? 120 : 70);
        if (fx.crit) this._critFlash();
        if (fx.killed) this._deathBurst(target);
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
        this._hitstop(fx.crit ? 120 : 70);
        if (fx.crit) { this._critFlash(); this._shakeVisual(); }
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
        this._spawnFloatText(target, `-${fx.dmg}`, fx.crit ? 'crit' : 'dmg');
        this._hitstop(fx.crit ? 120 : 70);
        if (fx.crit) this._critFlash();
        if (fx.killed) this._deathBurst(target);
        break;
      }
      case 'companionHeal': {
        this._animate(this._allyEl(fx.npcId), 'glowing');
        this._motion(this._allyEl(fx.npcId), 'motion-heal-pulse', 700);
        this._motion(this._playerSpriteEl(), 'motion-heal-pulse', 700);
        this._spawnFloatText(this._playerSpriteEl(), `+${fx.amount}`, 'heal');
        break;
      }
      case 'status': {
        const target = this._combatantEl(fx.targetId) ?? this._actorEl(fx);
        this._spawnFxOverlay(target, `status-${fx.statusId ?? 'effect'}`);
        this._animate(target, 'glowing', 650);
        this._motion(target, this._statusTransientMotion(fx.statusId), 760);
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

  // 히트스톱: 타격 순간 전장 애니메이션을 짧게 정지시켜 타격감을 만든다
  _hitstop(ms = 70) {
    const visual = this._screen?.querySelector('.combat-visual');
    if (!visual) return;
    visual.classList.add('hitstop');
    setTimeout(() => visual.classList.remove('hitstop'), ms);
  },

  _critFlash() {
    this._animate(this._screen?.querySelector('.combat-visual'), 'crit-flash', 300);
  },

  // 사망 순간: 붕괴 모션 + 파편 파티클
  _deathBurst(el) {
    if (!el) return;
    this._animate(el, 'just-died', 950);
    this._spawnFxOverlay(el, 'death-burst');
  },

  // CSS 애니메이션 클래스 재시작 헬퍼
  _animate(el, cls, dur = 450) {
    if (!el) return;
    if (cls === 'hit' && dur === 450) dur = 520;
    const motionState = {
      attacking: 'attack',
      lunging: 'attack',
      hit: 'hit',
      'just-died': 'death',
    }[cls];
    if (motionState) this._setMotionState(el, motionState);
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => {
      el.classList.remove(cls);
      if (motionState && el.dataset?.spriteId && !el.classList.contains('is-dead')) {
        this._setMotionState(el, 'idle');
      }
    }, dur);
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
};
