// CombatUI 믹스인 — 전투 연출 재생(fx 큐/모션/카메라/스프라이트시트 헬퍼).
// 메서드는 CombatUI 객체에 스프레드되어 this=CombatUI로 실행된다.
import EventBus     from '../../core/EventBus.js';
import GameState    from '../../core/GameState.js';
import CombatSystem from '../../systems/CombatSystem.js';
import { resolveCombatMotion, spriteRowPercent } from '../../data/combatMotionManifest.js';
import {
  actionFxToPresentationFx,
  normalizeLegacyActionFx,
} from '../../systems/combat/CombatMotionFx.js';
import {
  CAMERA_CLASSES,
  COMBAT_MOTION_CLASSES,
  COMBAT_SPRITE_SHEETS,
  COMPANION_ICONS,
  COMPANION_SPRITE_KEYS,
  ENEMY_SPRITE_KEYS,
  FX_DURATIONS,
  FX_EMOJI,
  normalizeFxOverlay,
  normalizeImpactFx,
  PLAYER_SPRITE_KEYS,
  STATUS_MOTION_CLASSES,
} from './combatUiAssets.js';

export const CombatFxPlayer = {
  // ── 전투 연출 재생 (CombatSystem.fxQueue → 순차 재생) ──

  _fxSpeed: 1,
  _fxTimers: [],
  _actorMotionRecords: new WeakMap(),
  _activeMotionActors: new Set(),

  _effectiveFxDuration(duration) {
    const speed = this._fxSpeed > 0 ? this._fxSpeed : 1;
    return Math.max(0, Math.round((Number(duration) || 0) / speed));
  },

  _scheduleFxTimer(callback, delay) {
    const ownerScreen = this._screen;
    const ownerContent = ownerScreen?.firstElementChild ?? null;
    const requireConnected = ownerScreen?.isConnected === true;
    let timer = null;
    timer = setTimeout(() => {
      this._fxTimers = this._fxTimers.filter(activeTimer => activeTimer !== timer);
      if (ownerScreen !== this._screen) return;
      if (requireConnected && !ownerScreen?.isConnected) return;
      if (ownerContent && ownerScreen?.firstElementChild !== ownerContent) return;
      callback();
    }, Math.max(0, Math.round(delay)));
    this._fxTimers.push(timer);
    return timer;
  },

  _playFxQueue() {
    const combat = GameState.combat;
    const queue  = combat?.fxQueue;
    if (!Array.isArray(queue) || queue.length === 0) return;
    combat.fxQueue = [];
    const speed = this._fxSpeed > 0 ? this._fxSpeed : 1;
    let delay = 80;
    for (const queuedFx of queue) {
      const fx = normalizeLegacyActionFx(queuedFx);
      const presentationKind = actionFxToPresentationFx(fx)?.kind;
      this._scheduleFxTimer(() => this._playFx(fx), Math.round(delay / speed));
      delay += FX_DURATIONS[presentationKind] ?? 300;
    }
  },

  // 진행 중인 연출을 건너뛴다 — 상태는 이미 반영돼 있으므로 잔여 코스메틱만 취소
  skipFxQueue() {
    const actorElements = new Set(this._activeMotionActors);
    this._screen?.querySelectorAll(
      '.cv-player, .cv-ally, .cv-enemy-sprite, [data-combatant-id]',
    ).forEach(element => actorElements.add(element));
    const hadPending = this._fxTimers.length > 0 || [...actorElements].some(element => {
      const record = this._actorMotionRecords.get(element);
      return Boolean(record?.animate?.timer || record?.motionClass?.timer || record?.sprite?.timer);
    });
    this._fxTimers.forEach(clearTimeout);
    this._fxTimers = [];
    for (const element of actorElements) {
      this._cancelActorMotionSlot(element, 'animate');
      this._cancelActorMotionSlot(element, 'motionClass');
      this._cancelActorMotionSlot(element, 'sprite');
      this._restoreCurrentActorMotion(element);
    }
    this._screen?.querySelectorAll('.cv-fx, .dmg-popup').forEach(element => element.remove());
    const visual = this._screen?.querySelector('.combat-visual');
    visual?.classList.remove('hitstop', 'shake', 'crit-flash', 'skill-flash', ...CAMERA_CLASSES, 'camera-work-active');
    if (visual?.dataset) delete visual.dataset.cameraWorkToken;
    return hadPending;
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

  _companionId(fx) {
    if (typeof fx?.npcId === 'string' && fx.npcId.length > 0) return fx.npcId;
    if (fx?.target === 'ally' && typeof fx.targetId === 'string' && fx.targetId.length > 0) {
      return fx.targetId;
    }
    return null;
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

  _materializeCombatSpriteSheet(element, motion) {
    if (!element || !motion?.sheetKey || !motion?.sheet) return null;
    if (COMBAT_SPRITE_SHEETS[motion.sheetKey] !== motion.sheet) return null;
    const style = this._spriteSheetStyle(motion.sheetKey);
    if (!style) return null;

    const existing = element.querySelector('.combat-sprite-sheet');
    if (existing && existing.dataset.motionMaterialized !== 'true') return existing;
    if (existing?.dataset.spriteSheetKey === motion.sheetKey) return existing;

    const portrait = element.querySelector('.combatant-portrait');
    if (!portrait) return null;
    const sprite = existing ?? document.createElement('span');
    const roleClass = element.matches?.('.cv-player')
      ? 'cv-player-img cv-player-sheet'
      : element.matches?.('.cv-ally')
        ? 'cv-ally-icon cv-companion-sheet'
        : 'cv-enemy-img cv-enemy-sheet';
    sprite.className = `combat-sprite-sheet combat-motion-sheet ${roleClass}`;
    sprite.dataset.motionMaterialized = 'true';
    sprite.dataset.spriteSheetKey = motion.sheetKey;
    sprite.setAttribute('role', 'img');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.setAttribute('style', style);
    if (!existing) portrait.insertBefore(sprite, portrait.firstChild);
    return sprite;
  },

  _playFx(queuedFx) {
    if (!this._screen || !queuedFx) return;
    const fx = actionFxToPresentationFx(normalizeLegacyActionFx(queuedFx));
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
        const presentation = this._playActorActionMotion(
          player,
          this._playerSpriteSheetKey(),
          fx,
          780,
        );
        this._animate(player, presentation.movementClass ? 'attacking' : 'attacking-stationary');
        this._motion(player, [presentation.movementClass, this._playerAttackMotion(fx)], 780);
        if (fx.fx === 'shot') this._spawnFxOverlay(player, 'muzzle');
        this._cameraWork(fx.miss ? 'ally-whiff' : 'ally-strike', fx.crit ? 760 : 640);
        if (fx.miss) {
          this._motion(player, [presentation.movementClass, 'motion-whiff'], 720);
          this._spawnFloatText(target, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(target, fx.fx ?? 'blunt');
        this._playSpriteMotion(
          target,
          this._enemySpriteSheetKey(GameState.combat?.enemies?.[fx.targetIdx]),
          'hit',
          560,
        );
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
        const presentation = this._playEnemyActionMotion(enemyEl, fx, 780);
        this._cameraWork(
          this._enemyActionCamera(fx, presentation.manifestMotion),
          fx.crit ? 760 : 650,
        );
        if (fx.miss) {
          this._motion(enemyEl, [presentation.movementClass, 'motion-whiff'], 720);
          this._spawnFloatText(player, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(player, fx.impactFx ?? fx.fx ?? 'claw');
        this._playSpriteMotion(player, this._playerSpriteSheetKey(), 'hit', 620);
        this._motion(player, ['motion-player-hit', this._hitReactionMotion(fx)], 620);
        this._animate(player, 'hit');
        this._spawnFloatText(player, `-${fx.dmg}`, fx.crit ? 'crit' : 'dmg');
        this._hitstop(fx.crit ? 120 : 70);
        if (fx.crit) { this._critFlash(); this._shakeVisual(); }
        break;
      }
      case 'enemyAttackCompanion': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        const ally = this._allyEl(fx.npcId);
        const presentation = this._playEnemyActionMotion(enemyEl, fx, 780);
        this._cameraWork(
          this._enemyActionCamera(fx, presentation.manifestMotion),
          650,
        );
        if (fx.miss) {
          this._motion(enemyEl, [presentation.movementClass, 'motion-whiff'], 720);
          this._spawnFloatText(ally, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(ally, fx.impactFx ?? fx.fx ?? 'claw');
        this._playSpriteMotion(ally, this._companionSpriteSheetKey(fx.npcId), 'hit', 620);
        this._motion(ally, ['motion-player-hit', this._hitReactionMotion(fx)], 620);
        this._animate(ally, 'hit');
        this._spawnFloatText(ally, `-${fx.dmg}`, 'dmg');
        break;
      }
      case 'companionAttack': {
        const ally   = this._allyEl(fx.npcId);
        const target = this._enemySpriteEl(fx.targetIdx);
        const presentation = this._playActorActionMotion(
          ally,
          this._companionSpriteSheetKey(fx.npcId),
          fx,
          780,
        );
        this._animate(ally, presentation.movementClass ? 'attacking' : 'attacking-stationary');
        this._motion(ally, [presentation.movementClass, this._allyAttackMotion(fx)], 780);
        this._cameraWork(fx.miss ? 'ally-whiff' : 'ally-strike', 620);
        if (fx.miss) {
          this._motion(ally, [presentation.movementClass, 'motion-whiff'], 720);
          this._spawnFloatText(target, 'MISS', 'miss');
          break;
        }
        this._spawnFxOverlay(target, fx.fx ?? 'slash');
        this._playSpriteMotion(
          target,
          this._enemySpriteSheetKey(GameState.combat?.enemies?.[fx.targetIdx]),
          'hit',
          560,
        );
        this._motion(target, ['motion-zombie-hit', this._hitReactionMotion(fx)], 560);
        this._animate(target, 'hit');
        this._spawnFloatText(target, `-${fx.dmg}`, fx.crit ? 'crit' : 'dmg');
        this._hitstop(fx.crit ? 120 : 70);
        if (fx.crit) this._critFlash();
        if (fx.killed) this._deathBurst(target);
        break;
      }
      case 'companionHeal': {
        const actor = this._allyEl(fx.npcId);
        const target = fx.targetId && fx.targetId !== 'player'
          ? this._combatantEl(fx.targetId) ?? this._allyEl(fx.targetId)
          : this._playerSpriteEl();
        this._animate(actor, 'glowing');
        this._playActorActionMotion(actor, this._companionSpriteSheetKey(fx.npcId), fx, 700);
        this._motion(actor, 'motion-heal-pulse', 700);
        this._motion(target, 'motion-heal-pulse', 700);
        this._spawnFloatText(target, `+${fx.amount}`, 'heal');
        break;
      }
      case 'playerSkill': {
        const player = this._playerSpriteEl();
        const target = this._combatantEl(fx.targetId)
          ?? (fx.targetSide === 'enemy'
            ? this._enemySpriteEl(fx.targetIndex)
            : fx.targetId === 'player'
              ? player
              : this._allyEl(fx.targetId));
        this._animate(this._screen.querySelector('.combat-visual'), 'skill-flash', 500);
        this._animate(player, 'glowing');
        this._playActorActionMotion(player, this._playerSpriteSheetKey(), fx, 760);
        this._motion(
          player,
          fx.healing > 0 || fx.impactFx === 'heal'
            ? 'motion-heal-pulse'
            : 'motion-buff-pulse',
          760,
        );
        if (fx.healing > 0) {
          this._motion(target, 'motion-heal-pulse', 700);
          this._spawnFloatText(target, `+${fx.healing}`, 'heal');
        } else if (target && fx.impactFx) {
          this._spawnFxOverlay(target, fx.impactFx);
        }
        break;
      }
      case 'status': {
        const target = this._combatantEl(fx.targetId) ?? this._actorEl(fx);
        if (target && fx.target === 'enemy' && typeof fx.motionKey === 'string') {
          const enemy = GameState.combat?.enemies?.[fx.enemyIdx];
          this._playSpriteMotion(target, this._enemySpriteSheetKey(enemy), fx.motionKey, 760);
        }
        this._spawnFxOverlay(target, `status-${fx.statusId ?? 'effect'}`);
        this._animate(target, 'glowing', 650);
        this._motion(target, this._statusTransientMotion(fx.statusId), 760);
        break;
      }
      case 'enemyMotion': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        const enemy = GameState.combat?.enemies?.[fx.enemyIdx];
        this._playSpriteMotion(
          enemyEl,
          this._enemySpriteSheetKey(enemy),
          fx.motionKey,
          fx.durationMs ?? 760,
        );
        break;
      }
      case 'companionBuff':
      case 'companionSkill': {
        this._animate(this._screen.querySelector('.combat-visual'), 'skill-flash', 500);
        this._animate(this._allyEl(fx.npcId), 'glowing');
        this._playActorActionMotion(
          this._allyEl(fx.npcId),
          this._companionSpriteSheetKey(fx.npcId),
          fx,
          760,
        );
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
        const player = this._playerSpriteEl();
        this._playSpriteMotion(player, this._playerSpriteSheetKey(), 'guard', 640);
        this._motion(player, 'motion-guard-brace', 640);
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
        if (actor === this._playerSpriteEl()) {
          this._playSpriteMotion(actor, this._playerSpriteSheetKey(), 'move', 650);
        }
        this._motion(actor, motion, 650);
        break;
      }
      case 'dodge': {
        this._motion(this._actorEl(fx), 'motion-dodge', 560);
        break;
      }
      case 'downed': {
        const actor = this._actorEl(fx) ?? this._playerSpriteEl();
        this._enterTerminalMotion(actor, 'downed');
        break;
      }
      case 'playerDeath': {
        const player = this._playerSpriteEl();
        this._enterTerminalMotion(player, 'death');
        break;
      }
      case 'victory': {
        const player = this._playerSpriteEl();
        this._enterTerminalMotion(player, 'victory');
        break;
      }
      case 'defeat': {
        const player = this._playerSpriteEl();
        this._enterTerminalMotion(player, 'defeat');
        break;
      }
      case 'explode': {
        const el = this._enemySpriteEl(fx.enemyIdx);
        const isSelfDestruct = fx.actionId === 'self_destruct'
          || fx.motionKey === 'self_destruct';
        if (isSelfDestruct) {
          const enemy = GameState.combat?.enemies?.[fx.enemyIdx];
          const motion = this._playSpriteMotion(
            el,
            this._enemySpriteSheetKey(enemy),
            'self_destruct',
            1100,
          );
          const bodyDuration = motion?.durationMs ?? 1100;
          this._scheduleFxTimer(() => {
            this._spawnFxOverlay(el, 'explode');
            this._cameraWork('impact-heavy', 720);
            this._shakeVisual();
          }, this._effectiveFxDuration(bodyDuration * 0.58));
          this._scheduleFxTimer(() => el?.remove(), this._effectiveFxDuration(bodyDuration + 180));
        } else {
          this._spawnFxOverlay(el, 'explode');
          this._cameraWork('impact-heavy', 720);
          this._shakeVisual();
        }
        if (fx.dmg) {
          this._motion(this._playerSpriteEl(), ['motion-hit-heavy', 'motion-knockback'], 720);
          this._spawnFloatText(this._playerSpriteEl(), `-${fx.dmg}`, 'crit');
        }
        break;
      }
      case 'summon': {
        const enemyEl = this._enemySpriteEl(fx.enemyIdx);
        const enemy = GameState.combat?.enemies?.[fx.enemyIdx];
        this._playSpriteMotion(
          enemyEl,
          this._enemySpriteSheetKey(enemy),
          fx.motionKey ?? 'summon_horde',
          980,
        );
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
    this._scheduleFxTimer(() => visual.classList.remove('hitstop'), this._effectiveFxDuration(ms));
  },

  _critFlash() {
    this._animate(this._screen?.querySelector('.combat-visual'), 'crit-flash', 300);
  },

  // 사망 순간: 붕괴 모션 + 파편 파티클
  _deathBurst(el) {
    if (!el) return;
    const terminal = this._currentActorTerminalState(el);
    if (terminal === 'death') this._enterTerminalMotion(el, 'death');
    this._animate(el, 'just-died', 950);
    this._spawnFxOverlay(el, 'death-burst');
  },

  _actorMotionRecord(el) {
    if (!el) return null;
    let record = this._actorMotionRecords.get(el);
    if (!record) {
      record = { animate: null, motionClass: null, sprite: null, terminal: null };
      this._actorMotionRecords.set(el, record);
    }
    return record;
  },

  _syncActiveMotionActor(el, record = this._actorMotionRecords.get(el)) {
    const hasTimer = Boolean(record?.animate?.timer || record?.motionClass?.timer || record?.sprite?.timer);
    if (hasTimer) this._activeMotionActors.add(el);
    else this._activeMotionActors.delete(el);
  },

  _cancelActorMotionSlot(el, slotName, runCleanup = true) {
    const record = this._actorMotionRecords.get(el);
    const owner = record?.[slotName];
    if (!owner) return false;
    if (owner.timer != null) clearTimeout(owner.timer);
    record[slotName] = null;
    if (runCleanup) (owner.cancelCleanup ?? owner.cleanup)?.();
    this._syncActiveMotionActor(el, record);
    return true;
  },

  _scheduleActorMotionSlot(el, slotName, duration, cleanup, cancelCleanup = cleanup) {
    const record = this._actorMotionRecord(el);
    this._cancelActorMotionSlot(el, slotName);
    const ownerScreen = this._screen;
    const owner = { timer: null, cleanup, cancelCleanup };
    owner.timer = setTimeout(() => {
      const current = this._actorMotionRecords.get(el);
      if (current?.[slotName] !== owner) return;
      current[slotName] = null;
      this._syncActiveMotionActor(el, current);
      if (ownerScreen !== this._screen || !el.isConnected || !ownerScreen?.contains(el)) return;
      cleanup?.();
    }, this._effectiveFxDuration(duration));
    record[slotName] = owner;
    this._syncActiveMotionActor(el, record);
    return owner;
  },

  _actorSheetKey(el) {
    if (!el) return null;
    if (el.matches?.('.cv-player')) return this._playerSpriteSheetKey();
    const companionId = el.dataset?.companionId;
    if (companionId) return this._companionSpriteSheetKey(companionId);
    const enemyIdx = Number.parseInt(el.dataset?.idx, 10);
    if (!Number.isNaN(enemyIdx)) {
      return this._enemySpriteSheetKey(GameState.combat?.enemies?.[enemyIdx]);
    }
    return null;
  },

  _actorCombatant(el) {
    const combat = GameState.combat;
    if (!el || !combat) return null;
    const combatantId = el.dataset?.combatantId;
    if (combatantId && combat.combatants?.[combatantId]) return combat.combatants[combatantId];
    const companionId = el.dataset?.companionId;
    if (companionId && combat.combatants?.[companionId]) return combat.combatants[companionId];
    const enemyIdx = Number.parseInt(el.dataset?.idx, 10);
    if (!Number.isNaN(enemyIdx)) return combat.combatants?.[`enemy:${enemyIdx}`] ?? null;
    return null;
  },

  _currentActorTerminalState(el) {
    if (!el) return null;
    const combat = GameState.combat;
    const combatant = this._actorCombatant(el);
    const isPlayer = el.matches?.('.cv-player');
    const isCompanion = el.matches?.('.cv-ally');
    const enemyIdx = Number.parseInt(el.dataset?.idx, 10);
    const enemy = Number.isNaN(enemyIdx) ? null : combat?.enemies?.[enemyIdx];

    if (isPlayer && combat?.outcome === 'victory') return 'victory';
    if (isPlayer && combat?.outcome === 'defeat') return 'defeat';
    if (combatant?.deathsDoor === true || el.classList.contains('is-deaths-door')) return 'downed';
    const playerDead = isPlayer && (
      combatant?.dead === true
      || GameState.player?.isAlive === false
    );
    const companionDowned = isCompanion && combatant?.dead === true;
    const enemyDead = enemy && (enemy.currentHp ?? 0) <= 0;
    if (playerDead || enemyDead || (!isCompanion && combatant?.dead === true) || el.classList.contains('is-dead')) {
      return 'death';
    }
    if (companionDowned) return 'downed';
    return null;
  },

  _clearSpritePlayback(sprite) {
    if (!sprite) return;
    sprite.style.removeProperty('--sprite-row-y');
    sprite.style.removeProperty('--sprite-duration');
    sprite.style.removeProperty('animation-name');
    sprite.style.removeProperty('animation-iteration-count');
    sprite.style.removeProperty('animation-fill-mode');
  },

  _clearActorTerminal(el) {
    const record = this._actorMotionRecord(el);
    record.terminal = null;
    if (el.dataset) delete el.dataset.motionTerminal;
    el.classList.remove('motion-downed', 'motion-player-death', 'motion-victory', 'motion-defeat', 'motion-zombie-death');
  },

  _restoreActorIdle(el) {
    if (!el || this._currentActorTerminalState(el)) return false;
    this._clearActorTerminal(el);
    if (el.dataset?.spriteId) this._setMotionState(el, 'idle');
    const idle = this._resolveSpriteMotion(this._actorSheetKey(el), 'idle');
    if (!idle) return false;
    this._playResolvedSpriteMotion(el, idle, idle.durationMs, { allowTerminal: true });
    return true;
  },

  _prepareActorTransientMotion(el) {
    const record = this._actorMotionRecord(el);
    if (!record?.terminal) return true;
    if (this._currentActorTerminalState(el)) return false;
    return this._restoreActorIdle(el);
  },

  _enterTerminalMotion(el, terminalState) {
    if (!el) return false;
    this._cancelActorMotionSlot(el, 'animate');
    this._cancelActorMotionSlot(el, 'motionClass');
    this._cancelActorMotionSlot(el, 'sprite');
    this._clearActorTerminal(el);
    const record = this._actorMotionRecord(el);
    record.terminal = terminalState;
    el.dataset.motionTerminal = terminalState;

    const spriteMotionKey = terminalState === 'victory' ? 'idle' : 'death';
    const resolved = this._resolveSpriteMotion(this._actorSheetKey(el), spriteMotionKey);
    if (resolved) {
      this._playResolvedSpriteMotion(el, {
        ...resolved,
        loop: false,
        holdLast: true,
      }, resolved.durationMs, { allowTerminal: true });
    }
    if (el.dataset?.spriteId) this._setMotionState(el, terminalState === 'victory' ? 'idle' : 'death');

    const terminalClass = terminalState === 'victory'
      ? 'motion-victory'
      : terminalState === 'downed'
        ? 'motion-downed'
        : terminalState === 'defeat'
          ? 'motion-defeat'
        : el.matches?.('.cv-enemy-sprite')
          ? 'motion-zombie-death'
          : 'motion-player-death';
    el.classList.remove(...COMBAT_MOTION_CLASSES);
    el.classList.add(terminalClass);
    return true;
  },

  _restoreCurrentActorMotion(el) {
    const terminalState = this._currentActorTerminalState(el);
    if (terminalState) return this._enterTerminalMotion(el, terminalState);
    this._clearActorTerminal(el);
    el.classList.remove(...COMBAT_MOTION_CLASSES);
    return this._restoreActorIdle(el);
  },

  // CSS 애니메이션 클래스 재시작 헬퍼
  _animate(el, cls, dur = 450) {
    if (!el) return;
    const record = this._actorMotionRecord(el);
    if (record.terminal && cls !== 'just-died' && !this._prepareActorTransientMotion(el)) return;
    if (cls === 'hit' && dur === 450) dur = 520;
    const motionState = {
      attacking: 'attack',
      'attacking-stationary': 'attack',
      lunging: 'attack',
      hit: 'hit',
      'just-died': 'death',
    }[cls];
    if (motionState) this._setMotionState(el, motionState);
    this._cancelActorMotionSlot(el, 'animate');
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    this._scheduleActorMotionSlot(el, 'animate', dur, () => {
      el.classList.remove(cls);
      if (motionState && el.dataset?.spriteId && !this._currentActorTerminalState(el)) {
        this._setMotionState(el, 'idle');
      }
    });
  },

  _motion(el, cls, dur = 560) {
    if (!el || !cls) return;
    if (!this._prepareActorTransientMotion(el)) return;
    const classes = Array.isArray(cls) ? cls.filter(Boolean) : [cls];
    if (classes.length === 0) return;
    const persistentBefore = new Set(classes.filter(c => STATUS_MOTION_CLASSES.includes(c) && el.classList.contains(c)));
    this._cancelActorMotionSlot(el, 'motionClass');
    el.classList.remove(...COMBAT_MOTION_CLASSES);
    void el.offsetWidth;
    el.classList.add(...classes);
    this._scheduleActorMotionSlot(el, 'motionClass', dur, () => {
      const removable = classes.filter(c => !persistentBefore.has(c));
      if (removable.length) el.classList.remove(...removable);
    });
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

  _resolveSpriteMotion(sheetKey, motionKey) {
    if (typeof sheetKey !== 'string' || typeof motionKey !== 'string') return null;
    const sheet = COMBAT_SPRITE_SHEETS[sheetKey];
    const motion = resolveCombatMotion(sheetKey, motionKey, COMBAT_SPRITE_SHEETS);
    const rowPercent = spriteRowPercent(motion?.row, sheet?.rows);
    if (!sheet || !motion || rowPercent == null) return null;
    return { ...motion, sheetKey, sheet, rowPercent };
  },

  _playResolvedSpriteMotion(element, motion, dur, { allowTerminal = false } = {}) {
    const sprite = element?.querySelector('.combat-sprite-sheet')
      ?? this._materializeCombatSpriteSheet(element, motion);
    if (!sprite || !motion) return null;
    const record = this._actorMotionRecord(element);
    if (record.terminal && !allowTerminal) {
      const terminalState = this._currentActorTerminalState(element);
      if (terminalState) return null;
      this._clearActorTerminal(element);
    }
    const sourceDuration = Number.isFinite(motion.durationMs) && motion.durationMs > 0
      ? motion.durationMs
      : dur;
    const duration = this._effectiveFxDuration(sourceDuration);
    this._cancelActorMotionSlot(element, 'sprite');
    sprite.style.setProperty('--sprite-row-y', `${motion.rowPercent.toFixed(4)}%`);
    sprite.style.setProperty('--sprite-duration', `${Math.round(duration)}ms`);
    const animationName = `var(--anim-r${motion.row}, combatSpriteSheetFrames)`;
    sprite.style.animationName = 'none';
    void sprite.offsetWidth;
    sprite.style.animationName = animationName;
    sprite.style.animationIterationCount = motion.loop === true ? 'infinite' : '1';
    sprite.style.animationFillMode = motion.holdLast === true ? 'forwards' : '';
    if (motion.loop === true || motion.holdLast === true) {
      record.sprite = {
        timer: null,
        cleanup: () => this._clearSpritePlayback(sprite),
      };
      return motion;
    }
    this._scheduleActorMotionSlot(element, 'sprite', sourceDuration, () => {
      this._clearSpritePlayback(sprite);
      this._restoreActorIdle(element);
    }, () => this._clearSpritePlayback(sprite));
    return motion;
  },

  _playSpriteMotion(element, sheetKey, motionKey, dur = 0) {
    const resolved = this._resolveSpriteMotion(sheetKey, motionKey);
    const motion = resolved;
    return this._playResolvedSpriteMotion(
      element,
      motion,
      dur,
    );
  },

  _enemyManifestMotion(fx) {
    const enemy = GameState.combat?.enemies?.[fx.enemyIdx];
    const motionKey = typeof fx?.motionKey === 'string' && fx.motionKey.length > 0
      ? fx.motionKey
      : 'basic_attack';
    return this._resolveSpriteMotion(this._enemySpriteSheetKey(enemy), motionKey);
  },

  _applyEnemyManifestMotion(enemyEl, motion, dur) {
    return this._playResolvedSpriteMotion(enemyEl, motion, dur) !== null;
  },

  _enemyMovementClass(fx, manifestMotion) {
    if (manifestMotion?.locomotion === 'approach') return 'motion-move-forward';
    if (manifestMotion?.locomotion === 'retreat') return 'motion-move-back';
    return null;
  },

  _playActorActionMotion(element, sheetKey, fx, dur) {
    const requestedMotionKey = fx?.motionKey ?? 'basic_attack';
    let motion = this._playSpriteMotion(element, sheetKey, requestedMotionKey, dur);
    if (!motion && requestedMotionKey !== 'basic_attack') {
      motion = this._playSpriteMotion(element, sheetKey, 'basic_attack', dur);
    }
    return {
      motion,
      movementClass: motion?.locomotion === 'approach'
        ? 'motion-move-forward'
        : motion?.locomotion === 'retreat'
          ? 'motion-move-back'
          : null,
    };
  },

  _enemyActionCamera(fx, manifestMotion) {
    if (fx?.miss) return 'enemy-whiff';
    const camera = manifestMotion?.camera ?? fx?.camera;
    const kind = typeof camera === 'string' && camera.startsWith('camera-')
      ? camera.slice('camera-'.length)
      : camera;
    return CAMERA_CLASSES.includes(`camera-${kind}`) ? kind : 'enemy-strike';
  },

  _playEnemyActionMotion(enemyEl, fx, dur) {
    const manifestMotion = this._enemyManifestMotion(fx);
    const movementClass = this._enemyMovementClass(fx, manifestMotion);
    this._animate(enemyEl, movementClass ? 'lunging' : 'attacking');

    const usedManifest = this._applyEnemyManifestMotion(enemyEl, manifestMotion, dur);
    const motionClasses = [
      movementClass,
      usedManifest ? null : this._enemyAttackMotion(fx),
    ].filter(Boolean);
    if (motionClasses.length > 0) {
      this._motion(enemyEl, motionClasses, dur);
    } else if (enemyEl) {
      enemyEl.classList.remove(...COMBAT_MOTION_CLASSES);
    }
    return { manifestMotion: usedManifest ? manifestMotion : null, movementClass };
  },

  _enemyAttackMotion(fx) {
    const impactFx = normalizeImpactFx(fx?.impactFx ?? fx?.fx, 'claw');
    if (impactFx === 'shot' || impactFx === 'acid') return 'motion-zombie-spit';
    if (impactFx === 'slam' || impactFx === 'shock' || impactFx === 'rupture') return 'motion-zombie-heavy';
    return 'motion-zombie-lunge';
  },

  _hitReactionMotion(fx) {
    const impactFx = normalizeImpactFx(fx?.impactFx ?? fx?.fx);
    if (fx?.crit || (fx?.dmg ?? 0) >= 18 || impactFx === 'shock' || fx?.fx === 'explode') {
      return 'motion-hit-heavy';
    }
    return 'motion-hit-light';
  },

  _actorEl(fx) {
    if (!fx) return null;
    if (fx.target === 'enemy' || fx.enemyIdx != null) return this._enemySpriteEl(fx.enemyIdx ?? fx.targetIdx);
    const companionId = this._companionId(fx);
    if (companionId) return this._allyEl(companionId);
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
    this._scheduleFxTimer(() => {
      if (visual.dataset.cameraWorkToken !== token) return;
      visual.classList.remove(cls, 'camera-work-active');
      delete visual.dataset.cameraWorkToken;
    }, this._effectiveFxDuration(dur));
  },

  _spawnFxOverlay(anchor, type) {
    if (!anchor) return;
    const displayType = normalizeFxOverlay(type);
    const fx = document.createElement('div');
    fx.className = `cv-fx cv-fx-${displayType}`;
    if (FX_EMOJI[displayType]) fx.textContent = FX_EMOJI[displayType];
    const prevPos = getComputedStyle(anchor).position;
    if (prevPos === 'static') anchor.style.position = 'relative';
    anchor.appendChild(fx);
    this._scheduleFxTimer(() => fx.remove(), this._effectiveFxDuration(700));
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
    this._scheduleFxTimer(() => popup.remove(), this._effectiveFxDuration(900));
  },
};
