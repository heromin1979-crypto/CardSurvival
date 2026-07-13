// === COMBAT SYSTEM ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import StateMachine    from '../core/StateMachine.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import NoiseSystem  from './NoiseSystem.js';
import StatSystem   from './StatSystem.js';
import EndingSystem from './EndingSystem.js';
import SkillSystem  from './SkillSystem.js';
import NPCSystem     from './NPCSystem.js';
import { rollEnemyGroup } from '../data/enemies.js';
import { NPC_ITEMS } from '../data/npcs.js';
import BALANCE from '../data/gameBalance.js';
import CharDialogue from '../data/charDialogues.js';
import NightSystem from './NightSystem.js';
import GameData from '../data/GameData.js';
import { getCharacterCombatEffects } from '../data/characters.js';
import {
  guardAction, consumeGuard,
  throwableAction,
  applyMultiTarget,
  companionAttack, companionHeal,
  tickCompanionCooldowns, tickEnemyStatusEffects,
} from './CombatActions.js';
import {
  buildCombatants,
  syncCombatantsToGameState,
} from './combat/CombatantAdapter.js';
import {
  buildAllyLoadout,
  executeSkillCommand,
  useCombatItem as useCombatItemCommand,
} from './combat/CombatSkillSystem.js';
import {
  compactEnemyFormation,
  createFormations,
  getRank,
  validateSkillPosition,
} from './combat/FormationSystem.js';
import { consumeToken, tickStatusEffects } from './combat/CombatStatusSystem.js';
import { buildInitiativeQueue } from './combat/InitiativeSystem.js';
import { resolveRelationshipReaction } from './combat/RelationshipCombatSystem.js';
import { buildEnemyProfile, decideEnemyIntent } from './combat/EnemyCombatAdapter.js';
import { CombatAiTurns } from './combat/CombatAiTurns.js';
import { CombatRankedEffects } from './combat/CombatRankedEffects.js';

const CombatSystem = {
  init() {
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'combat') {
        try {
          this._setupCombat(data);
        } catch (err) {
          console.error('[CombatSystem] _setupCombat 실패:', err);
          console.error('[CombatSystem] data:', data);
          // 최소한의 combat 객체 생성 — render 에러 방지
          GameState.combat = {
            active: true, enemies: data?.enemies ?? [], targetIndex: 0,
            playerAction: null, log: ['⚠️ 전투 초기화 오류: ' + (err?.message ?? err)],
            outcome: null, rewards: [], nodeId: data?.nodeId ?? null,
            dangerLevel: data?.dangerLevel ?? 2, round: 0, xpGained: 0,
            lastHit: null, playerStatus: [], enemyStatus: [], fxQueue: [],
            playerRank: 'front',
            _encounterData: data ?? {}, _isNew: true, _ambushFailed: false,
          };
          EventBus.emit('combatStarted', {});
        }
      }
    });
  },

  _setupCombat(data) {
    const gs          = GameState;
    const dangerLevel = data.dangerLevel ?? 2;
    const noiseLevel  = gs.noise?.level ?? 0;

    // enemies 배열: 전달받거나 소음 기반으로 새로 생성
    const enemies = data.enemies?.length
      ? data.enemies
      : rollEnemyGroup(dangerLevel, noiseLevel);

    // 습격/약탈자 전투 정보 보존
    const encounterLabel = data.isHordeWave
      ? I18n.t('combatSys.hordeWave', { wave: data.hordeWaveNum, count: enemies.length })
      : data.isRaiderAttack
        ? I18n.t('combatSys.raiderAttack', { count: enemies.length })
        : I18n.t('combatSys.combatStart', { count: enemies.length });

    // 캐릭터 전투 시작 대사
    CharDialogue.emit(gs.player.characterId, 'combat_start');

    gs.combat = {
      active:       true,
      enemies,
      targetIndex:  0,
      playerAction: null,
      log:          [encounterLabel],
      outcome:      null,
      rewards:      [],
      nodeId:       data.nodeId ?? null,
      dangerLevel:  dangerLevel,
      round:        0,
      xpGained:     0,
      lastHit:      null,
      playerStatus: [],
      enemyStatus:  [],
      playerRank:   data.playerRank ?? 'front',
      fxQueue:      [],   // 연출 이벤트 큐 — CombatUI가 렌더 후 순차 재생
      // Phase 1: 턴 큐 필드
      turnQueue:    [],
      activeIdx:    0,
      roundNumber:  1,
      _encounterData: data,
      _isNew:       true,   // 첫 렌더링 진입 애니메이션 트리거용
      _ambushFailed: data.ambushFailed === true,  // 선제 제압 실패 플래그
    };
    // 전투 시작 시 큐 구성 (player → 살아있는 companions → enemies)
    const companions = (GameState.companions ?? []).filter(id => {
      const st = GameState.npcs?.states?.[id];
      return st?.isCompanion && (st.hp ?? 0) > 0;
    });
    gs.combat.turnQueue = this._buildTurnQueue(gs.combat, companions);
    gs.combat.activeIdx = Math.max(0, gs.combat.turnQueue.findIndex(entry =>
      entry.type === 'player'
      || (entry.type === 'companion' && this._getCompanionStance(entry.id) === 'manual')
    ));
    this._attachCombatantIds(gs.combat);
    this._setupRankedCombatState(gs.combat, gs, enemies);
    this.beginActiveTurn();

    // Phase 3 — 전투 시작 시 모든 적의 초기 의도 결정 (Into the Breach 방식 가시성)
    for (const e of gs.combat.enemies) {
      e._nextIntent = this._decideNextIntent(e, gs.combat, gs);
    }

    EventBus.emit('combatStarted', {});

    // 선제 제압 실패: 첫 번째 플레이어 행동 전에 적이 선제 공격
    if (data.ambushFailed) {
      gs.combat.log.push('⚡ 적이 선제 반응! 첫 행동 전에 공격을 받습니다.');
    }

    // death_horde 엔딩 조건 추적: 이 전투의 적 수 기록
    gs.flags.lastEnemyCount = enemies.length;
  },

  // ── Combat Overhaul Phase 1 · 턴 큐 ─────────────────────
  // 큐 구조: [{type:'player'|'companion'|'enemy', id?, enemyIdx?, order}]
  // activeIdx: 큐 내 현재 턴 위치
  // roundNumber: 큐 한 바퀴 = 1 라운드 (랩어라운드 시 증가)

  _buildTurnQueue(combat, companions = []) {
    const queue = [];
    let order = 0;
    queue.push({ type: 'player', order: order++ });
    for (const id of companions) {
      queue.push({ type: 'companion', id, order: order++ });
    }
    const enemies = combat.enemies ?? [];
    for (let i = 0; i < enemies.length; i++) {
      queue.push({ type: 'enemy', enemyIdx: i, order: order++ });
    }
    return queue
      .map(entry => ({ entry, score: this._initiativeScore(entry, combat) }))
      .sort((a, b) => (b.score - a.score) || (a.entry.order - b.entry.order))
      .map((item, idx) => ({ ...item.entry, order: idx }));
  },

  _initiativeScore(entry, combat = GameState.combat) {
    if (!entry) return 0;
    if (entry.type === 'player') {
      const st = GameState.stats?.stamina;
      const staminaPct = st?.max ? (st.current ?? 0) / st.max : 1;
      const explicit = GameState.player?.actionSpeed ?? GameState.player?.speed ?? GameState.player?.initiative;
      return Number.isFinite(explicit) ? explicit : 80 + Math.round(staminaPct * 20);
    }
    if (entry.type === 'companion') {
      const st = GameState.npcs?.states?.[entry.id];
      const hpPct = st?.maxHp ? (st.hp ?? 0) / st.maxHp : 1;
      const explicit = st?.actionSpeed ?? st?.speed ?? st?.initiative;
      return Number.isFinite(explicit) ? explicit : 65 + Math.round(hpPct * 10);
    }
    if (entry.type === 'enemy') {
      const enemy = combat?.enemies?.[entry.enemyIdx];
      const explicit = enemy?.actionSpeed ?? enemy?.speed ?? enemy?.initiative;
      if (Number.isFinite(explicit)) return explicit;
      return 45 + Math.max(0, (enemy?.attacksPerRound ?? 1) - 1) * 15;
    }
    return 0;
  },

  _combatantIdForEntry(entry) {
    if (!entry) return null;
    if (typeof entry.combatantId === 'string' && entry.combatantId.length > 0) {
      return entry.combatantId;
    }
    if (entry.type === 'player') return 'player';
    if (entry.type === 'companion') return entry.id ?? null;
    if (entry.type === 'enemy') return Number.isInteger(entry.enemyIdx)
      ? `enemy:${entry.enemyIdx}`
      : null;
    return null;
  },

  _attachCombatantIds(combat) {
    if (!Array.isArray(combat?.turnQueue)) return;
    combat.turnQueue = combat.turnQueue.map(entry => ({
      ...entry,
      combatantId: this._combatantIdForEntry(entry),
    }));
  },

  _setupRankedCombatState(combat, gs, enemies) {
    const combatants = buildCombatants(gs, enemies);
    const allyIds = Object.values(combatants)
      .filter(combatant => combatant.side === 'ally')
      .map(combatant => combatant.id);
    const enemyEntries = Object.values(combatants)
      .filter(combatant => combatant.side === 'enemy')
      .map(combatant => ({
        combatantId: combatant.id,
        row: enemies[combatant.enemyIndex]?.row ?? enemies[combatant.enemyIndex]?.position ?? 'front',
      }));
    const formations = createFormations(allyIds, enemyEntries);
    const skillsById = {};

    for (const combatant of Object.values(combatants)) {
      combatant.rank = getRank(formations, combatant.id);
      if (combatant.side !== 'ally') continue;
      const loadout = buildAllyLoadout(combatant, gs);
      combatant.skillIds = loadout.map(skill => skill.id);
      for (const skill of loadout) {
        skillsById[skill.id] = skill;
      }
    }

    const enemyProfiles = {};
    enemies.forEach((enemy, index) => {
      const enemyId = `enemy:${index}`;
      const profile = buildEnemyProfile(enemy);
      enemyProfiles[enemyId] = profile;
      for (const skill of profile.skills ?? []) {
        skillsById[skill.id] = skill;
      }
    });

    combat.phase = 'round_start';
    combat.combatants = combatants;
    combat.formations = formations;
    combat.skillsById = skillsById;
    combat.enemyProfiles = enemyProfiles;
    combat.activeTurnIndex = combat.activeIdx ?? 0;
    combat.activeCombatantId = this._combatantIdForEntry(combat.turnQueue?.[combat.activeTurnIndex]);
    combat.selectedSkillId = null;
    combat.selectedTargetId = null;
    combat.pendingIntentByEnemy = {};
    combat.relationshipEvents = [];
    combat.actionSequence = 0;
  },

  _syncActiveTurnFromLegacy(combat) {
    if (!combat) return null;
    combat.activeTurnIndex = combat.activeIdx ?? 0;
    combat.activeCombatantId = this._combatantIdForEntry(combat.turnQueue?.[combat.activeTurnIndex]);
    return combat.activeCombatantId;
  },

  beginActiveTurn() {
    const combat = GameState.combat;
    if (!combat?.active) return false;

    const activeId = this._syncActiveTurnFromLegacy(combat);
    const active = combat.combatants?.[activeId];
    combat.selectedSkillId = null;
    combat.selectedTargetId = null;

    if (!active || active.dead === true) {
      combat.phase = 'turn_advance';
      return false;
    }

    combat.phase = active.side === 'ally'
      ? 'await_ally_input'
      : 'resolve_enemy_intent';

    if (active.side === 'enemy') {
      combat.pendingIntentByEnemy[activeId] = decideEnemyIntent(this._enemyIntentContext(), activeId);
    }

    return true;
  },

  selectSkill(skillId) {
    const combat = GameState.combat;
    const active = combat?.combatants?.[combat.activeCombatantId];
    if (
      combat?.phase !== 'await_ally_input'
      || active?.side !== 'ally'
      || typeof skillId !== 'string'
      || !active.skillIds?.includes(skillId)
      || !combat.skillsById?.[skillId]
    ) {
      return false;
    }
    combat.selectedSkillId = skillId;
    combat.selectedTargetId = null;
    combat.phase = 'select_target';
    return true;
  },

  selectTarget(targetId) {
    const combat = GameState.combat;
    if (
      combat?.phase !== 'select_target'
      || typeof targetId !== 'string'
      || !combat.combatants?.[targetId]
    ) {
      return false;
    }
    combat.selectedTargetId = targetId;
    combat.phase = 'confirm_action';
    return true;
  },

  cancelSelection() {
    const combat = GameState.combat;
    if (!combat?.active) return false;
    combat.selectedSkillId = null;
    combat.selectedTargetId = null;
    combat.phase = 'await_ally_input';
    return true;
  },

  _enemyIntentContext() {
    const combat = GameState.combat;
    return {
      enemyProfiles: combat?.enemyProfiles ?? {},
      getUsableEnemySkills: (_enemyId, profile) => {
        if (Array.isArray(profile?.skills)) return profile.skills;
        return (profile?.skillIds ?? [])
          .map(skillId => combat.skillsById?.[skillId])
          .filter(Boolean);
      },
      pickSkill: (_ai, candidates) => {
        if (!Array.isArray(candidates) || candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
      },
      pickTarget: (ai, _enemyId, skill) => {
        const targetSide = skill?.target?.side ?? 'ally';
        const pool = Object.values(combat?.combatants ?? {})
          .filter(combatant => (
            combatant.side === targetSide
            && combatant.dead !== true
            && (combatant.hp ?? 0) > 0
          ));
        if (pool.length === 0) return null;
        if (targetSide !== 'ally') return pool[0]?.id ?? null;

        const taunted = pool.find(c => (c.tokens?.taunted ?? 0) > 0);
        if (taunted) return taunted.id;
        return this._pickRankTargetByPattern(ai, pool)?.id ?? null;
      },
    };
  },

  // 레거시 _pickTargetByPattern의 6패턴을 랭크 combatant 풀에 적용 (의도 표시용)
  _pickRankTargetByPattern(pattern, pool) {
    const gs = GameState;
    const player = pool.find(c => c.sourceType === 'player');
    const hasDot = c => {
      const statuses = c.sourceType === 'player'
        ? (gs.combat?.playerStatus ?? [])
        : (c.statusEffects ?? []);
      return statuses.some(s => ['bleed', 'infection', 'burn', 'acid_burn'].includes(s?.id));
    };

    switch (pattern) {
      case 'aggressive':
        return [...pool].sort((a, b) =>
          ((a.hp ?? 0) / (a.maxHp || 1)) - ((b.hp ?? 0) / (b.maxHp || 1)))[0];
      case 'defensive': {
        const weaponId = gs.player?.equipped?.weapon_main ?? gs.player?.equipped?.weapon_sub;
        const isRanged = weaponId ? !!gs.getCardDef?.(weaponId)?.combat?.requiresAmmo : false;
        return (isRanged && player) ? player : (player ?? pool[0]);
      }
      case 'horde':
        return pool[Math.floor(Math.random() * pool.length)];
      case 'sniper':
        return pool.find(c => ['npc_nurse', 'npc_doctor', 'npc_tower_doctor', 'npc_jisu'].includes(c.sourceId))
          ?? player ?? pool[0];
      case 'predator':
        return pool.find(hasDot) ?? player ?? pool[0];
      case 'normal':
      default:
        return player ?? pool[0];
    }
  },

  _commandContext() {
    const combat = GameState.combat;
    return {
      activeCombatantId: combat?.activeCombatantId,
      combatants: combat?.combatants,
      skillsById: combat?.skillsById,
      validatePosition: (actorId, targetId, skill) => (
        this._validateRankedSkillPosition(actorId, targetId, skill)
      ),
      // 스태미나 실소스는 gs.stats.stamina — 동료는 스태미나 자원이 없어 항상 통과
      getStamina: (actor) => (
        actor?.sourceType === 'player'
          ? (GameState.stats?.stamina?.current ?? 0)
          : Number.MAX_SAFE_INTEGER
      ),
      resolveHit: (actor, target, skill, random) => (
        this._resolveRankedHit(actor, target, skill, random)
      ),
      getAmmo: (ammoId) => {
        if (typeof ammoId !== 'string' || ammoId.length === 0) return 0;
        return (GameState.getBoardCards?.() ?? [])
          .filter(card => card.definitionId === ammoId)
          .reduce((sum, card) => sum + (card.quantity ?? 1), 0);
      },
      getDurability: (instanceId) => (
        Number.isFinite(GameState.cards?.[instanceId]?.durability)
          ? GameState.cards[instanceId].durability
          : 999
      ),
      consumeCosts: (actor, skill) => this._consumeRankedCosts(actor, skill),
      applyEffect: (effect, actor, target, random, hitInfo) => (
        this._applyRankedEffect(effect, actor, target, random, hitInfo)
      ),
      consumeCombatItem: (itemInstanceId, actor) => this._consumeRankedCombatItem(actor, itemInstanceId),
    };
  },

  ...CombatRankedEffects,

  _rankedFailureMessage(reason) {
    const messages = {
      invalid_origin_rank: '현재 위치에서는 이 전투 행동을 사용할 수 없습니다. 이동으로 위치를 바꾸세요.',
      invalid_target_rank: '대상의 위치가 이 전투 행동의 사거리 밖입니다.',
      invalid_target_side: '이 전투 행동으로는 해당 대상을 지정할 수 없습니다.',
      insufficient_stamina: '스태미나가 부족합니다.',
      insufficient_ammo: '탄약이 부족합니다.',
      insufficient_durability: '장비 내구도가 부족합니다.',
      invalid_skill: '사용할 수 없는 전투 행동입니다.',
      invalid_target: '대상을 다시 선택해야 합니다.',
      invalid_actor: '현재 행동할 수 없는 전투원입니다.',
    };
    return messages[reason] ?? `전투 행동을 실행하지 못했습니다: ${reason ?? 'unknown'}`;
  },

  _pushCombatLog(entry) {
    const combat = GameState.combat;
    if (!combat?.log || typeof entry !== 'string' || entry.length === 0) return;
    combat.log.push(entry);
    if (combat.log.length > BALANCE.combat.combatLogMaxEntries) {
      combat.log.splice(0, combat.log.length - BALANCE.combat.combatLogMaxEntries);
    }
  },

  _rankedCombatantLabel(combatant) {
    if (!combatant) return '대상';
    if (combatant.sourceType === 'player') return GameState.player?.name ?? '생존자';
    if (combatant.sourceType === 'companion') {
      return I18n.itemName(
        combatant.sourceId ?? combatant.id,
        NPC_ITEMS?.[combatant.sourceId ?? combatant.id]?.name ?? combatant.id,
      );
    }
    if (combatant.sourceType === 'enemy') {
      const enemy = GameState.combat?.enemies?.[combatant.enemyIndex];
      return I18n.enemyName(enemy?.id, enemy?.name ?? combatant.id);
    }
    return combatant.id ?? '대상';
  },

  _rankedSkillLabel(skill) {
    if (skill?.nameKey) {
      const translated = I18n.t(skill.nameKey);
      if (translated && translated !== skill.nameKey) return translated;
    }
    return skill?.fallbackName ?? skill?.id ?? '전투 행동';
  },

  _rankedActionMessage(skill, target, result, targetHpBefore) {
    const skillLabel = this._rankedSkillLabel(skill);
    const targetLabel = this._rankedCombatantLabel(target);
    if (result?.hit === false) {
      return result?.dodged === true
        ? `${skillLabel}: ${targetLabel}이(가) 회피!`
        : `${skillLabel}: 빗나감`;
    }
    if (result?.crit === true && Number.isFinite(targetHpBefore) && Number.isFinite(target?.hp)) {
      const critDelta = targetHpBefore - target.hp;
      if (critDelta > 0) return `${skillLabel}: 치명타! ${targetLabel}에게 ${critDelta} 피해`;
    }

    const targetHpAfter = target?.hp;
    if (Number.isFinite(targetHpBefore) && Number.isFinite(targetHpAfter)) {
      const delta = targetHpBefore - targetHpAfter;
      if (delta > 0) return `${skillLabel}: ${targetLabel}에게 ${delta} 피해`;
      if (delta < 0) return `${skillLabel}: ${targetLabel} ${Math.abs(delta)} 회복`;
    }

    const effectTypes = new Set((skill?.effects ?? []).map(effect => effect?.type));
    if (effectTypes.has('move')) return `${skillLabel}: 위치 이동`;
    if (effectTypes.has('guard')) return `${skillLabel}: 방어 태세`;
    if (effectTypes.has('flee')) return `${skillLabel}: 도주 시도`;
    return `${skillLabel}: 실행`;
  },

  findActiveSkillByEffect(effectType) {
    const combat = GameState.combat;
    const active = combat?.combatants?.[combat.activeCombatantId];
    if (
      combat?.phase !== 'await_ally_input'
      || active?.side !== 'ally'
      || typeof effectType !== 'string'
    ) {
      return null;
    }

    return (active.skillIds ?? [])
      .map(skillId => combat.skillsById?.[skillId])
      .find(skill => (skill?.effects ?? []).some(effect => effect?.type === effectType))
      ?? null;
  },

  _autoTargetForSkill(skill, active) {
    const combat = GameState.combat;
    if (!skill || !active) return null;
    const targetSide = skill.target?.side ?? 'enemy';
    const ranks = Array.isArray(skill.target?.ranks) ? skill.target.ranks : [];

    const candidates = Object.values(combat?.combatants ?? {})
      .filter(combatant => (
        combatant?.side === targetSide
        && combatant.dead !== true
        && (combatant.hp ?? 0) > 0
        && ranks.includes(getRank(combat?.formations, combatant.id))
      ));

    if (targetSide === active.side) {
      return candidates.find(combatant => combatant.id === active.id)?.id
        ?? candidates[0]?.id
        ?? null;
    }

    return candidates[0]?.id ?? null;
  },

  useActiveSkillByEffect(effectType) {
    const combat = GameState.combat;
    const active = combat?.combatants?.[combat.activeCombatantId];
    const skill = this.findActiveSkillByEffect(effectType);
    if (!skill || !active) {
      this._pushCombatLog('현재 사용할 수 있는 해당 전투 행동이 없습니다.');
      return { ok: false, reason: 'invalid_skill' };
    }

    const targetId = this._autoTargetForSkill(skill, active);
    if (!targetId) {
      this._pushCombatLog(this._rankedFailureMessage('invalid_target'));
      return { ok: false, reason: 'invalid_target' };
    }

    if (!this.selectSkill(skill.id) || !this.selectTarget(targetId)) {
      this.cancelSelection();
      return { ok: false, reason: 'invalid_context' };
    }

    return this.confirmAction();
  },

  _syncRankedCombatants() {
    const combat = GameState.combat;
    if (combat?.combatants) {
      syncCombatantsToGameState(GameState, combat.combatants);
      this._compactRankedEnemyFormation();
    }
  },

  _compactRankedEnemyFormation() {
    const combat = GameState.combat;
    if (!combat?.formations || !combat?.combatants) return false;

    const changed = compactEnemyFormation(combat.formations, combat.combatants);
    if (!changed) return false;

    for (const combatantId of combat.formations.enemy ?? []) {
      const combatant = combat.combatants?.[combatantId];
      if (!combatant || combatant.sourceType !== 'enemy') continue;
      const enemy = combat.enemies?.[combatant.enemyIndex];
      if (!enemy) continue;
      const rank = getRank(combat.formations, combatantId);
      enemy.row = rank !== null && rank <= 2 ? 'front' : 'back';
    }

    return true;
  },

  _validateRankedSkillPosition(actorId, targetId, skill) {
    this._compactRankedEnemyFormation();
    return validateSkillPosition(GameState.combat?.formations, actorId, targetId, skill);
  },

  _syncRankedTargetToLegacy(target) {
    if (!target) return;
    if (target.sourceType === 'player') {
      GameState.player.hp.current = Math.max(0, target.hp ?? GameState.player.hp.current);
      return;
    }
    if (target.sourceType === 'companion') {
      const state = GameState.npcs?.states?.[target.sourceId];
      if (state) state.hp = Math.max(0, target.hp ?? state.hp ?? 0);
      return;
    }
    if (target.sourceType === 'enemy') {
      const enemy = GameState.combat?.enemies?.[target.enemyIndex];
      if (enemy) enemy.currentHp = Math.max(0, target.hp ?? enemy.currentHp ?? 0);
      this._compactRankedEnemyFormation();
    }
  },

  _syncLegacyAlliesToRankedCombatants() {
    const combatants = GameState.combat?.combatants;
    if (!combatants) return;

    const player = combatants.player;
    if (player && GameState.player?.hp) {
      player.hp = Math.max(0, GameState.player.hp.current ?? player.hp ?? 0);
      player.maxHp = GameState.player.hp.max ?? player.maxHp;
      this._reconcileAllyVitals(player);
    }

    for (const combatant of Object.values(combatants)) {
      if (combatant?.sourceType !== 'companion') continue;
      const state = GameState.npcs?.states?.[combatant.sourceId];
      if (!state) continue;
      combatant.hp = Math.max(0, state.hp ?? combatant.hp ?? 0);
      combatant.maxHp = state.maxHp ?? combatant.maxHp;
      this._reconcileAllyVitals(combatant);
    }
  },

  // HP 역동기화 시 죽음의 문턱 판정을 보존한다 — HP 0이어도 deathsDoor면 생존,
  // 실제 사망은 applyDamage의 저항 굴림 실패만이 결정한다
  _reconcileAllyVitals(combatant) {
    if (combatant.hp > 0) {
      combatant.dead = false;
      if (combatant.deathsDoor === true) combatant.deathsDoor = false;
      return;
    }
    if (combatant.deathsDoor !== true) combatant.dead = true;
  },

  confirmAction() {
    const combat = GameState.combat;
    if (!combat?.active || !combat.selectedSkillId || !combat.selectedTargetId) {
      return { ok: false, reason: 'invalid_context' };
    }

    const skill = combat.skillsById?.[combat.selectedSkillId];
    const target = combat.combatants?.[combat.selectedTargetId];
    const targetHpBefore = target?.hp;
    const result = executeSkillCommand(this._commandContext(), {
      actorId: combat.activeCombatantId,
      skillId: combat.selectedSkillId,
      targetId: combat.selectedTargetId,
    });

    if (result.ok) {
      this._pushCombatLog(this._rankedActionMessage(skill, target, result, targetHpBefore));
      combat.actionSequence = (combat.actionSequence ?? 0) + 1;
      if (result.hit === false && target?.sourceType === 'enemy') {
        const actor = combat.combatants?.[combat.activeCombatantId];
        this._fx({
          kind: actor?.sourceType === 'companion' ? 'companionAttack' : 'playerAttack',
          npcId: actor?.sourceType === 'companion' ? actor.sourceId : undefined,
          fx: this._weaponFx(this._rankedSkillWeaponDef(skill)),
          targetIdx: target.enemyIndex,
          miss: true,
        });
      }
      this._processRankedKills();
      if (this._allEnemiesDead()) {
        this._resolveVictory();
        return result;
      }
      if (this._isPlayerDefeated()) {
        this._resolveDefeat();
        return result;
      }
      this._resolveRelationshipAfterAction(combat.activeCombatantId);
      this.advanceTurn();
      this.processUntilAllyTurn();
    } else {
      combat.lastActionFailure = result.reason ?? null;
      this._pushCombatLog(this._rankedFailureMessage(result.reason));
      if (result.turnConsumed) {
        this.advanceTurn();
        this.processUntilAllyTurn();
      } else {
        this.cancelSelection();
      }
    }

    return result;
  },

  // 아군 행동 직후 관계 반응(지원/간섭) — 유대 높은 동료는 독려, 낮은 동료는 불평
  _resolveRelationshipAfterAction(actorId) {
    const combat = GameState.combat;
    const actor = combat?.combatants?.[actorId];
    if (!actor || actor.side !== 'ally') return null;
    if (!(combat._relationshipPhases instanceof Set)) combat._relationshipPhases = new Set();

    const context = {
      actionSequence: combat.actionSequence ?? 0,
      resolvedRelationshipPhases: combat._relationshipPhases,
      random: Math.random,
      getAlliesExcept: (id) => Object.values(combat.combatants)
        .filter(c => c.side === 'ally' && c.id !== id),
      // 유대는 동료 쪽 상태에만 있으므로 반응 주체(동료) 우선, 행동자(동료) 폴백
      getBond: (bondActorId, allyId) => (
        combat.combatants[allyId]?.bond ?? combat.combatants[bondActorId]?.bond ?? null
      ),
      applyRelationshipReaction: (reaction) => {
        const source = combat.combatants[reaction.sourceId];
        const target = combat.combatants[reaction.targetId];
        if (!source || !target) return { ok: false };
        this._applyStressWithFeedback(target, reaction.effect?.value ?? 0);
        this._pushCombatLog(reaction.type === 'support'
          ? `${this._rankedCombatantLabel(source)}이(가) ${this._rankedCombatantLabel(target)}을(를) 독려한다.`
          : `${this._rankedCombatantLabel(source)}이(가) ${this._rankedCombatantLabel(target)}에게 불평한다…`);
        this._fx({
          kind: 'status',
          targetId: reaction.targetId,
          statusId: reaction.type === 'support' ? 'resolve' : 'panic',
        });
        if (!Array.isArray(combat.relationshipEvents)) combat.relationshipEvents = [];
        combat.relationshipEvents.push(reaction);
        return { ok: true };
      },
    };

    return resolveRelationshipReaction(context, {
      actorId,
      phase: 'after',
      actionSequence: combat.actionSequence ?? 0,
    });
  },

  useCombatItem(itemInstanceId) {
    const result = useCombatItemCommand(
      this._commandContext(),
      GameState.combat?.activeCombatantId,
      itemInstanceId,
    );
    if (result.ok && result.turnConsumed) this.advanceTurn();
    return result;
  },

  attemptFlee() {
    const combat = GameState.combat;
    const active = combat?.combatants?.[combat.activeCombatantId];
    if (combat?.phase !== 'await_ally_input' || active?.side !== 'ally') {
      return { ok: false, reason: 'not_active_actor' };
    }

    combat.selectedSkillId = null;
    combat.selectedTargetId = null;
    this._fleeAction();
    this._syncLegacyAlliesToRankedCombatants();
    if (combat.active) this.beginActiveTurn();
    return { ok: true, turnConsumed: true, outcome: combat.outcome ?? null };
  },

  advanceTurn() {
    const combat = GameState.combat;
    if (!combat?.active) return false;
    this._advanceTurn(combat, GameState.npcs?.states);
    if (combat._roundWrapped) {
      combat._roundWrapped = false;
      if (combat.combatants) this._onRoundStart(combat);
      if (!combat.active) return false;
    }
    return this.beginActiveTurn();
  },

  _isPlayerDefeated() {
    const combat = GameState.combat;
    // 랭크 모드에서는 죽음의 문턱(HP 0, 생존)이 존재하므로 dead 플래그가 판정 기준
    if (combat?.combatants?.player) return combat.combatants.player.dead === true;
    return (GameState.player?.hp?.current ?? 0) <= 0;
  },

  _processRankedKills() {
    const combat = GameState.combat;
    if (!combat) return;
    for (const enemy of combat.enemies ?? []) {
      if ((enemy.currentHp ?? 0) <= 0 && !enemy._killProcessed) {
        this._onEnemyKilled(enemy);
      }
    }
  },

  // 라운드 경계: 상태이상 틱(레거시+랭크) → 사망/승패 정리 → 이니셔티브 재굴림
  _onRoundStart(combat) {
    this._tickStatusEffects();
    this._syncLegacyAlliesToRankedCombatants();
    this._syncLegacyEnemiesToRanked(combat);

    for (const combatant of Object.values(combat.combatants ?? {})) {
      if (combatant.dead === true) continue;
      const events = tickStatusEffects(combatant, Math.random);
      for (const event of events) {
        if (event.damage > 0) {
          this._pushCombatLog(
            `${this._rankedCombatantLabel(combatant)}: ${event.statusId ?? '상태이상'}으로 ${event.damage} 피해`,
          );
        }
        if (event.deathsDoorEntered) {
          this._pushCombatLog(`${this._rankedCombatantLabel(combatant)}이(가) 죽음의 문턱에 몰렸다!`);
        }
      }
      if (events.length > 0) this._syncRankedTargetToLegacy(combatant);
    }

    this._processRankedKills();
    if (this._allEnemiesDead()) {
      this._resolveVictory();
      return;
    }
    if (this._isPlayerDefeated()) {
      this._resolveDefeat();
      return;
    }

    // 야간 전투의 심리 압박 — 광원이 있으면 완화
    if (NightSystem.isNight()) {
      const gs = GameState;
      const hasLight = gs.getBoardCards().some(c =>
        gs.getCardDef(c.instanceId)?.tags?.includes('light_source') && (c.durability ?? 100) > 0);
      const nightStress = hasLight
        ? BALANCE.combat.stress.nightLitRoundStress
        : BALANCE.combat.stress.nightRoundStress;
      if (nightStress > 0) {
        for (const ally of Object.values(combat.combatants ?? {})) {
          if (ally.side !== 'ally' || ally.dead === true) continue;
          this._applyStressWithFeedback(ally, nightStress);
        }
      }
    }

    this._rebuildTurnOrder(combat);
  },

  _syncLegacyEnemiesToRanked(combat) {
    for (const combatant of Object.values(combat?.combatants ?? {})) {
      if (combatant.sourceType !== 'enemy') continue;
      const enemy = combat.enemies?.[combatant.enemyIndex];
      if (!enemy) continue;
      combatant.hp = Math.max(0, enemy.currentHp ?? combatant.hp ?? 0);
      combatant.dead = combatant.hp <= 0;
    }
  },

  // 라운드마다 속도+랜덤 굴림으로 턴 순서를 다시 정한다 (다키스트 던전식) —
  // speed 토큰은 이번 굴림에 보정치를 더하고 소비된다
  _rebuildTurnOrder(combat) {
    if (!combat?.combatants || !Array.isArray(combat.turnQueue) || combat.turnQueue.length === 0) return;

    const boosted = {};
    for (const [id, combatant] of Object.entries(combat.combatants)) {
      const speedStacks = combatant.tokens?.speed ?? 0;
      if (speedStacks > 0) {
        consumeToken(combatant, 'speed', speedStacks);
        boosted[id] = {
          ...combatant,
          speed: (combatant.speed ?? 0) + speedStacks * BALANCE.combat.tokens.speedInitiativeBonus,
        };
      } else {
        boosted[id] = combatant;
      }
    }

    const order = buildInitiativeQueue(boosted, Math.random, BALANCE.combat.initiativeRollMax);
    if (order.length === 0) return;
    const orderIndex = new Map(order.map((slot, index) => [slot.combatantId, index]));

    combat.turnQueue = [...combat.turnQueue]
      .sort((a, b) => (
        (orderIndex.get(a.combatantId) ?? Number.MAX_SAFE_INTEGER)
        - (orderIndex.get(b.combatantId) ?? Number.MAX_SAFE_INTEGER)
      ))
      .map((entry, index) => ({ ...entry, order: index }));

    const firstAlive = combat.turnQueue.findIndex(entry =>
      this._isEntryAlive(entry, combat, GameState.npcs?.states));
    combat.activeIdx = firstAlive >= 0 ? firstAlive : 0;
  },

  // 기절 상태의 아군 턴을 소비 — 랭크 statusEffects와 레거시 playerStatus 양쪽을 지원
  _consumeAllyStun(combatant) {
    const combat = GameState.combat;
    let stunned = false;

    if (combatant.sourceType === 'player' && Array.isArray(combat?.playerStatus)) {
      const stunIdx = combat.playerStatus.findIndex(s => s.id === 'stun');
      if (stunIdx !== -1) {
        combat.playerStatus.splice(stunIdx, 1);
        stunned = true;
      }
    }
    if (!stunned && Array.isArray(combatant.statusEffects)) {
      const stunIdx = combatant.statusEffects.findIndex(s =>
        s?.id === 'stun' || s?.effect?.skipTurn === true);
      if (stunIdx !== -1) {
        combatant.statusEffects.splice(stunIdx, 1);
        stunned = true;
      }
    }

    if (stunned) {
      this._pushCombatLog(`${this._rankedCombatantLabel(combatant)}은(는) 기절해서 움직일 수 없다!`);
      this._fx({ kind: 'status', targetId: combatant.id, statusId: 'stun' });
    }
    return stunned;
  },

  processUntilAllyTurn() {
    const combat = GameState.combat;
    if (!combat?.active) return false;
    this.beginActiveTurn();

    const maxIterations = (combat.turnQueue?.length ?? 0) * 2 + 2;
    for (let i = 0; i < maxIterations; i++) {
      const active = combat.combatants?.[combat.activeCombatantId];
      if (!active || active.side === 'ally') {
        if (active && this._consumeAllyStun(active)) {
          this.advanceTurn();
          if (!combat.active) return true;
          continue;
        }
        combat.phase = 'await_ally_input';
        return true;
      }

      const entry = combat.turnQueue?.[combat.activeTurnIndex ?? combat.activeIdx ?? 0];
      if (entry?.type === 'enemy') {
        this._runSingleEnemyTurn(entry.enemyIdx);
        this._syncLegacyAlliesToRankedCombatants();
        if (this._isPlayerDefeated()) {
          this._resolveDefeat();
          return true;
        }
        this._processRankedKills();
        // 적이 자기 턴에 죽는 경로(자폭·사기 격파·상태이상)는 플레이어 공격 경로의
        // 승리 판정을 거치지 않는다 — 레거시 hp를 랭크 combatant로 동기화하고
        // 여기서 직접 결선하지 않으면 phase가 resolve_enemy_intent에 갇힌다.
        this._syncLegacyEnemiesToRanked(combat);
        if (this._allEnemiesDead()) {
          if (combat.active) this._resolveVictory();
          return true;
        }
        if (!combat.active) return true;
      }
      this.advanceTurn();
      if (!combat.active) return true;
    }

    return false;
  },

  _currentEntry(combat) {
    const q = combat?.turnQueue;
    if (!q || q.length === 0) return null;
    return q[combat.activeIdx] ?? null;
  },

  currentEntry(combat = GameState.combat) {
    return this._currentEntry(combat);
  },

  canPlayerAct(combat = GameState.combat) {
    const entry = this._currentEntry(combat);
    return !entry || entry.type === 'player';
  },

  isManualCompanionTurn(combat = GameState.combat) {
    const entry = this._currentEntry(combat);
    return entry?.type === 'companion';
  },

  _isEntryAlive(entry, combat, npcStates) {
    if (!entry) return false;
    if (entry.type === 'player') {
      return (GameState.player?.hp?.current ?? 0) > 0;
    }
    if (entry.type === 'enemy') {
      const e = combat?.enemies?.[entry.enemyIdx];
      return !!e && (e.currentHp ?? 0) > 0;
    }
    if (entry.type === 'companion') {
      const st = npcStates?.[entry.id];
      return !!st && (st.hp ?? 0) > 0;
    }
    return false;
  },

  _advanceTurn(combat, npcStates) {
    const q = combat?.turnQueue;
    if (!q || q.length === 0) return;
    const n = q.length;
    const startIdx = combat.activeIdx;
    for (let step = 1; step <= n; step++) {
      const next = (startIdx + step) % n;
      if (next === 0 || (next < startIdx)) {
        // 큐 한 바퀴 돌았음을 감지 (첫 번째 랩어라운드 시점만 roundNumber 증가)
        if (next <= startIdx) {
          combat.roundNumber = (combat.roundNumber ?? 1) + 1;
          // 라운드 경계 후처리(상태이상 틱·이니셔티브 재굴림)는 호출자가 소비
          combat._roundWrapped = true;
        }
      }
      combat.activeIdx = next;
      const entry = q[next];
      if (this._isEntryAlive(entry, combat, npcStates)) return;
    }
    // 모두 죽어 한 바퀴 돌아도 못 찾음 — activeIdx는 startIdx로 복귀해 무한루프 방지
    combat.activeIdx = startIdx;
  },

  // ── 타겟 헬퍼 ──────────────────────────────────────────

  _getTarget() {
    const { enemies, targetIndex } = GameState.combat;
    return enemies[targetIndex] ?? null;
  },

  getAliveEnemies() {
    return GameState.combat.enemies.filter(e => e.currentHp > 0);
  },

  _allEnemiesDead() {
    return GameState.combat.enemies.every(e => e.currentHp <= 0);
  },

  // ── 전열/후열 (Darkest Dungeon식 랭크) ─────────────────
  // row: 'front' | 'back'. 근접 무기는 전열만 타격 가능,
  // 전열이 전멸하면 후열에 도달할 수 있다. 원거리/투척은 열 무시.

  // instantiateEnemy를 거치지 않은 레거시 생성 경로(row 미설정)는 position으로 폴백
  rowOf(enemy) {
    return enemy?.row ?? enemy?.position ?? 'front';
  },

  getReachableEnemies(isRanged = false) {
    const alive = this.getAliveEnemies();
    if (isRanged) return alive;
    const front = alive.filter(e => this.rowOf(e) === 'front');
    return front.length > 0 ? front : alive;
  },

  isEnemyReachable(enemy, isRanged = false) {
    if (!enemy || enemy.currentHp <= 0) return false;
    if (isRanged) return true;
    if (this.rowOf(enemy) === 'front') return true;
    return !this.getAliveEnemies().some(e => this.rowOf(e) === 'front');
  },

  // 탄약이 있어야 원거리 사거리로 취급 — 빈 총은 근접 폴백 타격이므로 전열 규칙을 따른다
  weaponReachIsRanged(def) {
    if (!def?.combat?.requiresAmmo) return false;
    return GameState.getBoardCards().some(c => c.definitionId === def.combat.requiresAmmo);
  },

  // 플레이어의 현재 무기가 원거리인지 (장착 → 보드 순)
  isPlayerWeaponRanged() {
    return this.weaponReachIsRanged(this._getPlayerWeapon()?.def);
  },

  // 연출 이벤트 큐에 push — CombatUI._playFxQueue가 렌더 후 순차 재생
  _fx(payload) {
    const combat = GameState.combat;
    if (!combat) return;
    if (!Array.isArray(combat.fxQueue)) combat.fxQueue = [];
    combat.fxQueue.push(payload);
  },

  playerRankOf(combat = GameState.combat) {
    return combat?.playerRank === 'back' ? 'back' : 'front';
  },

  _movePlayerRank() {
    const combat = GameState.combat;
    const next = this.playerRankOf(combat) === 'front' ? 'back' : 'front';
    combat.playerRank = next;
    this._fx({ kind: 'move', target: 'player', direction: next === 'back' ? 'back' : 'forward' });
    return I18n.t('combatSys.playerMove', { rank: next === 'back' ? '후열' : '전열' });
  },

  _normalizeStatusInflict(statusDef) {
    if (!statusDef?.id) return null;
    const effect = { ...(statusDef.effect ?? {}) };
    if (effect.hpLossPerRound == null && effect.hpPerRound != null) {
      effect.hpLossPerRound = Math.abs(effect.hpPerRound);
      delete effect.hpPerRound;
    }
    return {
      ...statusDef,
      duration: statusDef.duration ?? 1,
      effect,
    };
  },

  _applyEnemyStatusInflict(enemy, statusDef, enemyIdx = null) {
    const status = this._normalizeStatusInflict(statusDef);
    if (!enemy || !status) return false;
    if (!enemy._statusEffects) enemy._statusEffects = [];

    const existing = enemy._statusEffects.find(s => s.id === status.id);
    if (existing) {
      existing.duration = Math.max(existing.duration ?? 0, status.duration ?? 1);
      existing.effect = { ...(existing.effect ?? {}) };
      if (status.effect?.hpLossPerRound != null) {
        existing.effect.hpLossPerRound = Math.max(existing.effect.hpLossPerRound ?? 0, status.effect.hpLossPerRound);
      }
      for (const [key, val] of Object.entries(status.effect ?? {})) {
        if (key !== 'hpLossPerRound' && existing.effect[key] == null) existing.effect[key] = val;
      }
    } else {
      enemy._statusEffects.push({
        id: status.id,
        name: status.name ?? status.id,
        duration: status.duration ?? 1,
        effect: { ...(status.effect ?? {}) },
      });
    }

    const idx = enemyIdx ?? GameState.combat?.enemies?.indexOf(enemy);
    this._fx({ kind: 'status', target: 'enemy', enemyIdx: idx, statusId: status.id });
    return true;
  },

  // 무기 속성 → 연출 종류 매핑
  _weaponFx(weaponDef) {
    if (!weaponDef) return 'punch';
    if (weaponDef.combat?.requiresAmmo) return 'shot';
    switch (weaponDef.weaponType) {
      case 'blade':     return 'slash';
      case 'blunt':     return 'blunt';
      case 'fire':      return 'fire';
      case 'electric':  return 'spark';
      case 'explosive': return 'blast';
      default:          return 'blunt';
    }
  },

  _characterCombatEffects() {
    return getCharacterCombatEffects(GameState.player?.characterId);
  },

  _isFirearmWeapon(weaponDef) {
    return !!weaponDef?.combat?.requiresAmmo;
  },

  _isBladeWeapon(weaponDef) {
    return weaponDef?.weaponType === 'blade'
      || weaponDef?.tags?.includes('blade')
      || weaponDef?.tags?.includes('knife')
      || weaponDef?.subtype === 'knife';
  },

  _isMedicalItem(def) {
    return def?.tags?.includes('medical') || def?.type === 'medical';
  },

  _applyCharacterAimIdentity({ accuracy, critChance, weaponDef, skillId = null }) {
    const effects = this._characterCombatEffects();
    const usesLoadedFirearm = this._isFirearmWeapon(weaponDef) && (skillId == null || skillId === 'ranged');
    if (usesLoadedFirearm) {
      accuracy = Math.min(1, accuracy + (effects.firearmAccBonus ?? 0));
      critChance = Math.min(1, critChance + (effects.firearmCritBonus ?? 0));
    }
    return { accuracy, critChance };
  },

  _applyCharacterDamageIdentity(damage, weaponId, weaponDef) {
    const effects = this._characterCombatEffects();
    if (weaponId && GameState.cards?.[weaponId]?._crafted && effects.craftedWeaponDmgBonus) {
      damage = Math.floor(damage * (1 + effects.craftedWeaponDmgBonus));
    }
    return damage;
  },

  _applyCharacterOnHitIdentity(enemy, weaponDef) {
    const effects = this._characterCombatEffects();
    if (!enemy || !this._isBladeWeapon(weaponDef) || !effects.bladeBleedChance) return false;
    if (Math.random() >= effects.bladeBleedChance) return false;

    if (!enemy._statusEffects) enemy._statusEffects = [];
    const bleed = {
      id: 'bleed',
      name: '출혈',
      duration: effects.bladeBleedDuration ?? 2,
      effect: { hpLossPerRound: effects.bladeBleedDmgPerRound ?? 3 },
    };
    const existing = enemy._statusEffects.find(s => s.id === 'bleed');
    if (existing) {
      existing.duration = Math.max(existing.duration, bleed.duration);
      existing.effect.hpLossPerRound = Math.max(existing.effect.hpLossPerRound ?? 0, bleed.effect.hpLossPerRound);
    } else {
      enemy._statusEffects.push(bleed);
    }
    return true;
  },

  _getEnemyAccuracyAgainstPlayer(baseAccuracy) {
    const effects = this._characterCombatEffects();
    const hp = GameState.player?.hp;
    if (!hp?.max || !effects.lowHpEnemyAccuracyPenalty) return baseAccuracy;
    const threshold = effects.lowHpThreshold ?? 0.30;
    if ((hp.current / hp.max) > threshold) return baseAccuracy;
    return Math.max(0.1, baseAccuracy - effects.lowHpEnemyAccuracyPenalty);
  },

  _getMedicalHealMultiplier(def) {
    let healMult = GameState.player?.healBonus ?? 1.0;
    const effects = this._characterCombatEffects();
    if (this._isMedicalItem(def) && !GameState.combat?._identityFirstMedicalUsed) {
      healMult += effects.firstMedicalItemHealBonus ?? 0;
    }
    return healMult;
  },

  _markMedicalIdentityUse(def) {
    const effects = this._characterCombatEffects();
    if (!effects.firstMedicalItemHealBonus || !this._isMedicalItem(def) || !GameState.combat) return;
    GameState.combat._identityFirstMedicalUsed = true;
  },

  // 죽은 타겟 → 닿을 수 있는 적 우선으로 자동 전환, 없으면 -1
  _autoAdvanceTarget() {
    const { enemies } = GameState.combat;
    const isRanged = this.isPlayerWeaponRanged();
    let next = enemies.findIndex(e => e.currentHp > 0 && this.isEnemyReachable(e, isRanged));
    if (next < 0) next = enemies.findIndex(e => e.currentHp > 0);
    GameState.combat.targetIndex = next >= 0 ? next : 0;
    return next;
  },

  // 플레이어가 직접 타겟 변경 — 근접 무기로는 전열 생존 시 후열 선택 불가
  setTarget(index) {
    const { enemies } = GameState.combat;
    const enemy = enemies[index];
    if (!enemy || enemy.currentHp <= 0) return false;
    if (!this.isEnemyReachable(enemy, this._currentActorCanTargetBackRow())) {
      EventBus.emit('notify', { message: I18n.t('combatSys.blockedByFront'), type: 'warn' });
      return false;
    }
    GameState.combat.targetIndex = index;
    return true;
  },

  // ── 행동 처리 ──────────────────────────────────────────

  _currentActorCanTargetBackRow(combat = GameState.combat) {
    const entry = this._currentEntry(combat);
    if (entry?.type === 'companion') {
      return (BALANCE.combat.companionAuto.rangedCompanions ?? []).includes(entry.id);
    }
    return this.isPlayerWeaponRanged();
  },

  resolveAction(action, weaponInstanceId = null) {
    const gs = GameState;
    if (!gs.combat.active) return;

    let target = this._getTarget();
    if (!target) return;

    // 근접 공격이 후열을 노리고 있으면 닿는 적으로 자동 재조준
    if (action === 'melee' || action === 'shoot') {
      const wDef = (weaponInstanceId && gs.cards[weaponInstanceId]) ? gs.getCardDef(weaponInstanceId) : null;
      const isRanged = this.weaponReachIsRanged(wDef);
      if (!this.isEnemyReachable(target, isRanged)) {
        const reachable = this.getReachableEnemies(isRanged);
        if (reachable.length === 0) return;
        gs.combat.targetIndex = gs.combat.enemies.indexOf(reachable[0]);
        target = this._getTarget();
        gs.combat.log.push(I18n.t('combatSys.meleeRetarget', {
          name: I18n.enemyName(target.id, target.name),
        }));
      }
    }

    gs.combat.round++;
    gs.combat.lastHit = null;

    // 선제 제압 실패: 첫 행동 전 적 선제 공격
    if (gs.combat._ambushFailed) {
      gs.combat._ambushFailed = false;
      if (gs.combat.active) this._allEnemiesAttack();
      if (!gs.combat.active) return; // 즉사 처리
    }

    // 기절 체크 — 이번 턴 행동 불가
    const stunIdx = gs.combat.playerStatus.findIndex(s => s.id === 'stun');
    if (stunIdx !== -1) {
      gs.combat.playerStatus.splice(stunIdx, 1);
      gs.combat.log.push(I18n.t('combatSys.stunned'));
      this._tickStatusEffects();
      if (gs.combat.active) this._allEnemiesAttack();
      return;
    }

    let logEntry = '';

    switch (action) {
      case 'melee':
      case 'shoot':
        logEntry = this._attackAction(action, weaponInstanceId, target);
        break;
      case 'guard':
        guardAction();
        this._fx({ kind: 'guard' });
        logEntry = I18n.t('combatSys.guardStart');
        break;
      case 'move':
        logEntry = this._movePlayerRank();
        break;
      case 'throwable':
        logEntry = throwableAction(weaponInstanceId, this);
        if (!gs.combat.active) return; // smoke bomb fled
        break;
      case 'companionAttack':
        logEntry = companionAttack(this);
        break;
      case 'companionHeal':
        logEntry = companionHeal(this);
        break;
      case 'stealth':
        logEntry = this._stealthAction();
        return;
      case 'flee':
        logEntry = this._fleeAction();
        return;
      case 'useItem':
        logEntry = this._useItemAction(weaponInstanceId);
        break;
      default:
        return;
    }

    gs.combat.log.push(logEntry);

    // 전투 로그 크기 제한
    if (gs.combat.log.length > BALANCE.combat.combatLogMaxEntries) {
      gs.combat.log.splice(0, gs.combat.log.length - BALANCE.combat.combatLogMaxEntries);
    }

    // 타겟 사망 처리
    if (target.currentHp <= 0) {
      this._onEnemyKilled(target);
      if (this._allEnemiesDead()) {
        this._resolveVictory();
        return;
      }
      this._autoAdvanceTarget();
      gs.combat.log.push(I18n.t('combatSys.nextTarget', { name: I18n.enemyName(this._getTarget()?.id, this._getTarget()?.name) }));
    }

    // 상태이상 틱
    this._tickStatusEffects();
    if (this._allEnemiesDead()) { this._resolveVictory(); return; }
    if (this._isPlayerDefeated()) { this._resolveDefeat(); return; }

    // 살아있는 모든 적 공격
    if (gs.combat.active) this._allEnemiesAttack();
  },

  // ── 개별 행동 ──────────────────────────────────────────

  _attackAction(type, weaponId, enemy) {
    const gs = GameState;
    let damage = 0, accuracy = BALANCE.combat.baseUnarmedAccuracy ?? 0.70, noise = 5, durLoss = 0;
    let critChance = 0, critMultiplier = BALANCE.combat.defaultCritMultiplier ?? 1.5;
    let weaponName = I18n.t('combatSys.unarmed');
    let isCrit = false;
    let skillId = 'unarmed';  // 사용 스킬 (XP 훅용)
    let isRanged = false;

    if (weaponId && gs.cards[weaponId]) {
      const weaponInst = gs.cards[weaponId];
      const def = gs.getCardDef(weaponId);
      if (def?.combat) {
        const [dMin, dMax] = def.combat.damage;
        const rawDmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
        const qualityMult = BALANCE.quality.tiers[weaponInst?._quality]?.mult ?? 1.0;
        damage         = Math.round(rawDmg * qualityMult) + (weaponInst.damageBonus ?? 0);
        accuracy       = def.combat.accuracy + (weaponInst.accuracyBonus ?? 0);
        noise          = def.combat.noiseOnUse;
        durLoss        = def.combat.durabilityLoss ?? 0;
        critChance     = def.combat.critChance     ?? 0;
        critMultiplier = def.combat.critMultiplier ?? (BALANCE.combat.defaultCritMultiplier ?? 1.5);
        weaponName     = I18n.itemName(def.id, def.name);
        isRanged       = !!(def.combat.requiresAmmo);
        skillId        = isRanged ? 'ranged' : 'melee';

        if (isRanged) {
          if (weaponInst._suppressor) {
            noise = Math.max(0, Math.round(noise * (1 - Math.min(1, weaponInst._noiseReduction ?? 0.5))));
          }
          // 원거리: 명중률·치명타 스킬 보너스 적용
          accuracy   = Math.min(1, accuracy   + SkillSystem.getBonus('ranged', 'accBonus'));
          critChance = Math.min(1, critChance + SkillSystem.getBonus('ranged', 'critBonus'));

          const ammoInst = gs.getBoardCards().find(c => c.definitionId === def.combat.requiresAmmo);
          if (!ammoInst) {
            EventBus.emit('notify', { message: I18n.t('combatSys.noAmmo'), type: 'warn' });
            const [nMin, nMax] = BALANCE.combat.noAmmoMeleeDamage ?? [5, 10];
            damage = nMin + Math.floor(Math.random() * (nMax - nMin + 1));
            accuracy = BALANCE.combat.noAmmoAccuracy ?? 0.65; noise = BALANCE.combat.noAmmoNoise ?? 3; skillId = 'melee';
          } else {
            // 마스터리: 20% 확률 탄약 미소모
            const ammoSave = SkillSystem.hasMastery('ranged') && Math.random() < BALANCE.combat.ammoSaveChance;
            if (!ammoSave) {
              ammoInst.quantity = (ammoInst.quantity ?? 1) - 1;
              if (ammoInst.quantity <= 0) {
                gs.removeCardInstance(ammoInst.instanceId);
                EventBus.emit('cardRemoved', { instanceId: ammoInst.instanceId });
              } else {
                EventBus.emit('boardChanged', {}); // 탄약 수량 변경 UI 동기화
              }
            }
          }
        }

        if (durLoss > 0 && gs.cards[weaponId]) {
          // 근접무기 내구도 절약 (스킬 durSaveChance)
          const durSave = skillId === 'melee'
            ? Math.random() < SkillSystem.getBonus('melee', 'durSaveChance')
            : false;
          if (!durSave) {
            gs.cards[weaponId].durability = Math.max(0, gs.cards[weaponId].durability - durLoss);
            if (gs.cards[weaponId].durability <= 0) {
              EventBus.emit('notify', { message: I18n.t('combatSys.weaponBroken', { name: weaponName }), type: 'warn' });
              gs.removeCardInstance(weaponId);
              EventBus.emit('cardRemoved', { instanceId: weaponId });
            }
          }
        }
      }
    } else {
      // 맨손: BALANCE 기반 데미지 + 스킬 dmgMult 적용
      const unarmedMult = SkillSystem.getBonus('unarmed', 'dmgMult');
      const [uMin, uMax] = BALANCE.combat.unarmedBaseDmg;
      damage = Math.floor((uMin + Math.floor(Math.random() * (uMax - uMin + 1))) * unarmedMult);
    }

    NoiseSystem.addNoise(noise);

    // 사기 구간별 명중률 보정
    const moraleTierAcc = StatSystem.getMoraleTier();
    accuracy = Math.max(0.1, Math.min(1, accuracy + (moraleTierAcc.accBonus ?? 0)));

    // 야간 전투 명중률 패널티
    if (NightSystem.isNight()) {
      const hasLight = gs.getBoardCards().some(c => gs.getCardDef(c.instanceId)?.tags?.includes('light_source') && (c.durability ?? 100) > 0);
      accuracy = Math.max(0.1, accuracy - (hasLight ? BALANCE.combat.nightLitPenalty : BALANCE.combat.nightAccuracyPenalty));
    }
    ({ accuracy, critChance } = this._applyCharacterAimIdentity({
      accuracy,
      critChance,
      weaponDef: weaponId && gs.cards[weaponId] ? gs.getCardDef(weaponId) : null,
      skillId,
    }));

    const evasion = enemy._combatBuffs?.evasion;
    if (evasion && (evasion.duration ?? 0) > 0) {
      accuracy = Math.max(0.05, accuracy * (1 - (evasion.value ?? 0)));
    }

    const hit = Math.random() < accuracy;
    if (hit) {
      const effectiveCritChance = Math.min(1, critChance + (gs.player.critBonus ?? 0));
      if (Math.random() < effectiveCritChance) { isCrit = true; damage = Math.floor(damage * critMultiplier); }

      // 근접/원거리 스킬 dmgMult 적용 (무기 있는 경우)
      if (skillId === 'melee') {
        damage = Math.floor(damage * SkillSystem.getBonus('melee', 'dmgMult'));
      } else if (skillId === 'ranged') {
        // 원거리 dmgMult는 별도 보너스 없음 (명중률·치명타로 대체)
      }

      damage = Math.floor(damage * (gs.player.combatDmgBonus ?? 1.0));
      damage = this._applyCharacterDamageIdentity(damage, weaponId, weaponId && gs.cards[weaponId] ? gs.getCardDef(weaponId) : null);
      // 셰프 나이프/칼 무기 보너스
      if (gs.player.knifeDmgBonus && weaponId) {
        const wDef = gs.getCardDef(weaponId);
        if (wDef?.tags?.includes('blade') || wDef?.tags?.includes('knife') || wDef?.subtype === 'knife') {
          damage = Math.floor(damage * gs.player.knifeDmgBonus);
        }
      }
      // NPC 동행 전투 보너스
      const npcCombatMult = SystemRegistry.get('NPCSystem')?.getCompanionCombatBonus?.() ?? 1.0;
      damage = Math.floor(damage * npcCombatMult);
      // 사기 구간별 데미지 배율
      const moraleTier = StatSystem.getMoraleTier();
      damage = Math.floor(damage * (moraleTier.dmgMult ?? 1.0));

      // 약점/저항 배율 + 방어 반격 보너스
      if (weaponId && gs.cards[weaponId]) {
        const wType = gs.getCardDef(weaponId)?.weaponType;
        if (wType && enemy.weaknesses?.includes(wType)) {
          damage = Math.floor(damage * BALANCE.combat.weaponWeaknessMult);
          gs.combat.log.push(I18n.t('combatSys.weakness', { type: wType }));
        } else if (wType && enemy.resistances?.includes(wType)) {
          damage = Math.floor(damage * BALANCE.combat.weaponResistanceMult);
          gs.combat.log.push(I18n.t('combatSys.resistance', { type: wType }));
        }
      }
      if (gs.combat.playerGuard?.active) {
        damage = Math.floor(damage * (1 + gs.combat.playerGuard.counterBonus));
        gs.combat.playerGuard = null;
      }

      let finalDmg = this._applyEnemyDefense(damage, enemy.defense);
      if ((enemy._combatBuffs?.invulnerable?.duration ?? 0) > 0) finalDmg = 0;
      const poisonDmg = Math.max(0, Math.floor(gs.cards[weaponId]?._poisonDamage ?? 0));
      if (poisonDmg > 0 && finalDmg > 0) {
        finalDmg += poisonDmg;
        gs.combat.log.push(`독 피해 +${poisonDmg}`);
      }
      enemy.currentHp = Math.max(0, enemy.currentHp - finalDmg);

      if (enemy.currentHp <= 0) {
        const wDef = (weaponId && gs.cards[weaponId]) ? gs.getCardDef(weaponId) : null;
        gs.combat._lastKillContext = {
          weaponType: wDef?.weaponType ?? 'unarmed',
          isSilent:   !!wDef?.tags?.includes('silent'),
          isMelee:    !wDef?.combat?.requiresAmmo,
        };
      }

      // 무기 기절 부여 + 충전 적 인터럽트
      const wInst = (weaponId && gs.cards[weaponId]) ? gs.getCardDef(weaponId) : null;
      const stunDef = wInst?.combat?.statusInflict;
      if (stunDef?.id === 'stun' && enemy.currentHp > 0 && Math.random() < (stunDef.chance ?? 1)) {
        if ((enemy._chargeRemaining ?? null) !== null && enemy.timedThreat?.counters?.stunDelays) {
          enemy._chargeRemaining = enemy.timedThreat.id === 'charge_strike'
            ? enemy.timedThreat.chargeTurns
            : enemy._chargeRemaining + 1;
          enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
          gs.combat.log.push(I18n.t('combatSys.chargeInterrupt', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
        }
      }
      if (stunDef?.id !== 'stun' && enemy.currentHp > 0 && Math.random() < (stunDef?.chance ?? 1)) {
        this._applyEnemyStatusInflict(enemy, stunDef, gs.combat.targetIndex);
      }
      if (enemy.currentHp > 0) {
        this._applyCharacterOnHitIdentity(enemy, wInst);
      }

      if (isCrit && enemy.type === 'human' && enemy.currentMorale != null) {
        enemy.currentMorale = Math.max(0, enemy.currentMorale - BALANCE.combat.moraleBreak.critMoraleDmg);
      }

      // 다중 타겟 (창/산탄총)
      if (weaponId && gs.cards[weaponId]) {
        const mDef = gs.getCardDef(weaponId);
        if (mDef?.multiTarget > 1) {
          const extraLogs = applyMultiTarget(finalDmg, mDef, gs.combat.targetIndex, this);
          for (const el of extraLogs) gs.combat.log.push(el);
        }
      }
      gs.combat.lastHit = { target: 'enemy', damage: finalDmg, isCrit, enemyIndex: gs.combat.targetIndex };
      this._fx({
        kind:      'playerAttack',
        fx:        this._weaponFx((weaponId && gs.cards[weaponId]) ? gs.getCardDef(weaponId) : null),
        targetIdx: gs.combat.targetIndex,
        dmg:       finalDmg,
        crit:      isCrit,
        killed:    enemy.currentHp <= 0,
      });

      // XP 획득
      SkillSystem.gainXp(skillId, isCrit ? 4 : 2);

      // 맨손 마스터리: 기절 확률 + 추가 데미지
      if (skillId === 'unarmed' && SkillSystem.hasMastery('unarmed')) {
        if (Math.random() < BALANCE.combat.unarmedStunChance && !gs.combat.enemyStatus.some(s => s.id === 'stun')) {
          const stunDmg = BALANCE.combat.unarmedStunDmg;
          enemy.currentHp = Math.max(0, enemy.currentHp - stunDmg);
          gs.combat.enemyStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: 1, effect: {} });
          this._fx({ kind: 'status', target: 'enemy', enemyIdx: gs.combat.targetIndex, statusId: 'stun' });
          gs.combat.log.push(I18n.t('combatSys.unarmedMastery', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: stunDmg }));
        }
      }

      const eName = I18n.enemyName(enemy.id, enemy.name);
      if (isCrit) return I18n.t('combatSys.critHit', { weapon: weaponName, enemy: eName, dmg: finalDmg });
      return I18n.t('combatSys.normalHit', { weapon: weaponName, enemy: eName, dmg: finalDmg, hp: enemy.currentHp, maxHp: enemy.maxHp });
    }
    this._fx({
      kind:      'playerAttack',
      fx:        this._weaponFx((weaponId && gs.cards[weaponId]) ? gs.getCardDef(weaponId) : null),
      targetIdx: gs.combat.targetIndex,
      miss:      true,
    });
    return I18n.t('combatSys.miss', { weapon: weaponName });
  },

  _useItemAction(itemId) {
    const gs = GameState;
    if (!itemId || !gs.cards[itemId]) return I18n.t('combatSys.itemUnavail');
    const def = gs.getCardDef(itemId);
    if (!def?.onConsume) return I18n.t('combatSys.itemNoEffect');

    const { hp, infection, morale } = def.onConsume;
    const msgs = [];
    let healedAmount = 0;
    if (hp) {
      const healMult = this._getMedicalHealMultiplier(def);
      const healed = Math.round(hp * healMult);
      healedAmount = healed;
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + healed);
      msgs.push(I18n.t('combatSys.hpHeal', { val: healed }));
    }
    if (infection) { gs.modStat('infection', infection); msgs.push(I18n.t('combatSys.infectionChange', { val: `${infection > 0 ? '+' : ''}${infection}` })); }
    if (morale)    { gs.modStat('morale', morale);    msgs.push(I18n.t('combatSys.moraleUp', { val: morale })); }

    const inst = gs.cards[itemId];
    inst.quantity = (inst.quantity ?? 1) - 1;
    if (inst.quantity <= 0) { gs.removeCardInstance(itemId); EventBus.emit('cardRemoved', { instanceId: itemId }); }
    this._markMedicalIdentityUse(def);
    this._fx({
      kind: 'useItem',
      fx: hp ? 'heal' : 'buff',
      label: hp ? `+${healedAmount}` : 'ITEM',
    });

    return I18n.t('combatSys.itemUsed', { name: I18n.itemName(def.id, def.name), effects: msgs.join(', ') });
  },

  _stealthAction() {
    const gs      = GameState;
    const alive   = this.getAliveEnemies();
    // 그룹 은신 난이도: 살아있는 적 중 최고값
    const maxDiff = Math.max(...alive.map(e => e.stealthDifficulty ?? (BALANCE.combat.defaultStealthDifficulty ?? 0.5)));
    const success = Math.random() > maxDiff;
    if (success) {
      this._stabilizePlayerAfterCombat();
      gs.combat.active  = false;
      gs.combat.outcome = 'fled';
      EventBus.emit('combatEnd', { outcome: 'fled' });
      StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
    } else {
      gs.combat.log.push(I18n.t('combatSys.stealthFail'));
      if (gs.combat.active) this._allEnemiesAttack();
    }
  },

  _fleeAction() {
    const gs      = GameState;
    const data    = gs.combat._encounterData ?? {};
    const fleeBonus = gs.player.fleeBonus ?? 0;
    const success = Math.random() < (BALANCE.combat.fleeChance + fleeBonus);
    NoiseSystem.addNoise(10);
    if (success) {
      this._fx({ kind: 'flee', success: true });
      this._stabilizePlayerAfterCombat();
      gs.combat.active  = false;
      gs.combat.outcome = 'fled';
      gs.modStat('fatigue', 10);

      // 좀비 습격 도주: 구조물 내구도 25% 감소 + 사기 패널티
      if (data.isHordeWave) {
        this._applyStructureDamage(BALANCE.hordeWaves.structureDamage);
        gs.modStat('morale', BALANCE.hordeWaves.defeatMorale);
        EventBus.emit('notify', {
          message: I18n.t('combatSys.hordeFleeDmg'),
          type: 'danger',
        });
      }

      EventBus.emit('combatEnd', { outcome: 'fled' });
      // 보라매병원 습격 도주 — 패배로 간주, HospitalSiegeSystem이 후처리
      if (data.isSiege) {
        EventBus.emit('siegeResolved', {
          outcome:       'defeat',
          casualties:    0,
          defenseRating: 0,
          threat:        0,
          siegeId:       data.siegeId ?? null,
        });
      }
      StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
    } else {
      // 도주 실패: 모든 적이 강화 공격 (1.5배 데미지)
      this._fx({ kind: 'flee', success: false });
      gs.combat.log.push(I18n.t('combatSys.fleeFail'));
      gs.combat._fleeFailed = true;
      if (gs.combat.active) this._allEnemiesAttack();
      gs.combat._fleeFailed = false;
    }
  },

  // ── 적 행동 ────────────────────────────────────────────

  /**
   * Phase 1 호환 엔트리포인트. 과거 "모든 적 일괄 공격" 의미론을
   * 턴 큐 기반 `_processAiTurns`로 위임한다. 외부 call site 변경 없음.
   */
  _allEnemiesAttack() {
    this._processAiTurns();
  },

  /**
   * Phase 1: 턴 큐 순서대로 AI 엔티티(동료/적) 턴을 플레이어 차례 전까지 실행.
   *   - activeIdx를 advance → entry type 분기 → 실행 → 승/패 판정 루프
   *   - 동료 턴은 Phase 1에서 stub (Phase 2에서 stance 기반 자율 행동 구현)
   *   - 최대 iter 제한(큐 길이×2)으로 무한루프 방지
   */
  _processAiTurns() {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat?.active || !combat.turnQueue?.length) return;

    const npcStates = gs.npcs?.states ?? {};
    const maxIter = combat.turnQueue.length * 2 + 2;
    let iter = 0;

    while (combat.active && iter++ < maxIter) {
      this._advanceTurn(combat, npcStates);
      // 레거시 폴백 루프에서는 라운드 경계 후처리를 쓰지 않는다 (resolveAction이 직접 틱)
      combat._roundWrapped = false;
      const entry = this._currentEntry(combat);
      if (!entry) return;
      if (entry.type === 'player') return;   // 플레이어 차례로 복귀

      if (entry.type === 'companion') {
        return;
      } else if (entry.type === 'enemy') {
        this._runSingleEnemyTurn(entry.enemyIdx);
        if (this._isPlayerDefeated()) { this._resolveDefeat(); return; }
      }

      if (this._allEnemiesDead()) { this._resolveVictory(); return; }
    }
  },

  ...CombatAiTurns,

  // ── 상태이상 틱 ────────────────────────────────────────

  _tickStatusEffects() {
    const gs = GameState;

    gs.combat.playerStatus = (gs.combat.playerStatus ?? []).filter(s => {
      if (s.effect.hpLossPerRound) {
        gs.player.hp.current = Math.max(0, gs.player.hp.current - s.effect.hpLossPerRound);
        gs.combat.log.push(I18n.t('combatSys.statusTick', { name: s.name, dmg: s.effect.hpLossPerRound, hp: gs.player.hp.current }));
      }
      if (s.effect.infection) gs.modStat('infection', s.effect.infection);
      s.duration--;
      return s.duration > 0;
    });

    // per-enemy 상태이상 틱 (AoE 투척 효과 포함)
    for (const enemy of this.getAliveEnemies()) {
      tickEnemyStatusEffects(enemy, msg => gs.combat.log.push(msg));
    }

    // 레거시 enemyStatus 틱 (단일 타겟용 하위호환)
    const target = this._getTarget();
    if (target) {
      gs.combat.enemyStatus = (gs.combat.enemyStatus ?? []).filter(s => {
        if (s.effect.hpLossPerRound) {
          target.currentHp = Math.max(0, target.currentHp - s.effect.hpLossPerRound);
          gs.combat.log.push(I18n.t('combatSys.statusTickEnemy', { name: s.name, target: I18n.enemyName(target.id, target.name), dmg: s.effect.hpLossPerRound }));
        }
        s.duration--;
        return s.duration > 0;
      });
    }

    // 동행 쿨다운 틱
    tickCompanionCooldowns();

    // 방어 상태 만료
    if (gs.combat.playerGuard?.active) consumeGuard();
  },

  // ── 적 사망 처리 (개별) ────────────────────────────────

  _onEnemyKilled(enemy) {
    if (!enemy || enemy._killProcessed) return;
    enemy._killProcessed = true;
    const gs  = GameState;
    const killCtx = gs.combat._lastKillContext ?? {};
    gs.combat._lastKillContext = null;

    if (enemy.timedThreat?.id === 'self_destruct') {
      const cleanKill = (enemy.weaknesses ?? []).includes(killCtx.weaponType);
      if (!cleanKill && killCtx.isMelee) {
        const [bMin, bMax] = BALANCE.combat.timedThreats.bloater.corpseBurst;
        const burst = bMin + Math.floor(Math.random() * (bMax - bMin + 1));
        gs.player.hp.current = Math.max(0, gs.player.hp.current - burst);
        gs.combat.lastHit = { target: 'player', damage: burst, isCrit: false };
        EventBus.emit('playerHit', { damage: burst });
        gs.combat.log.push(I18n.t('combatSys.bloaterCorpseBurst', { dmg: burst }));
      }
    }
    if (enemy.timedThreat?.id === 'summon_horde' && killCtx.weaponType && !killCtx.isSilent) {
      NoiseSystem.addNoise(BALANCE.combat.timedThreats.screamer.summonNoise);
      gs.combat.log.push(I18n.t('combatSys.screamerDeathCry'));
    }

    if (enemy.type === 'human') {
      const mb = BALANCE.combat.moraleBreak;
      for (const other of gs.combat.enemies) {
        if (other !== enemy && other.type === 'human' && other.currentHp > 0 && other.currentMorale != null) {
          other.currentMorale = Math.max(0, other.currentMorale - mb.allyDeathMoraleDmg);
        }
      }
    }

    const xp  = enemy.xp ?? 0;
    gs.player.xp     = (gs.player.xp ?? 0) + xp;
    gs.combat.xpGained += xp;
    gs.combat.log.push(I18n.t('combatSys.kill', { enemy: I18n.enemyName(enemy.id, enemy.name), xp }));

    // 숨겨진 요소 추적: 킬 카운터 갱신
    gs.flags.totalKills = (gs.flags.totalKills ?? 0) + 1;
    // 생태계: 좀비 밀도 감소 + 퀘스트 추적(enemyId/enemyType 전달)
    EventBus.emit('enemyKilled', {
      districtId: gs.location.currentDistrict,
      enemyId: enemy.id,
      enemyType: enemy.type,
    });

    // 처치 시 사용 무기 스킬 XP
    const weapMain = gs.player.equipped?.weapon_main;
    const weapSub  = gs.player.equipped?.weapon_sub;
    const weapInst = weapMain ? gs.cards[weapMain] : (weapSub ? gs.cards[weapSub] : null);
    const weapDef  = weapInst ? gs.getCardDef(weapInst.instanceId) : null;
    const killSkill = weapDef?.combat?.requiresAmmo ? 'ranged' : (weapDef ? 'melee' : 'unarmed');
    SkillSystem.gainXp(killSkill, 5);

    // 근접 킬/은신 킬 추적
    if (killSkill === 'melee' || killSkill === 'unarmed') {
      gs.flags.meleeKills = (gs.flags.meleeKills ?? 0) + 1;
    }
    if (weapDef?.tags?.includes('silent') && gs.combat.lastHit?.isCrit) {
      gs.flags.stealthKills = (gs.flags.stealthKills ?? 0) + 1;
    }

    for (const lootEntry of (enemy.lootTable ?? [])) {
      const dropChance = enemy._routed
        ? BALANCE.combat.enemyDropChance * BALANCE.combat.moraleBreak.routLootMult
        : BALANCE.combat.enemyDropChance;
      if (Math.random() < dropChance) {
        const qty  = lootEntry.minQty + Math.floor(Math.random() * (lootEntry.maxQty - lootEntry.minQty + 1));
        const inst = gs.createCardInstance(lootEntry.definitionId, { quantity: qty });
        if (inst) {
          const placed = gs.placeCardInRow(inst.instanceId, 'middle');
          if (placed) {
            const actualId = placed.instanceId ?? inst.instanceId;
            if (gs.cards[actualId] && !gs.combat.rewards.includes(actualId)) {
              gs.combat.rewards.push(actualId);
            }
          } else {
            // 바닥/가방 모두 차면 pendingLoot에 보관
            gs.pendingLoot = [...(gs.pendingLoot ?? []), {
              definitionId:  lootEntry.definitionId,
              quantity:      qty,
              contamination: 0,
            }];
            gs.removeCardInstanceSilent(inst.instanceId);
          }
        }
      }
    }

    // 의사(doctor) 전용: 좀비 처치 시 30% 확률로 의료 아이템 추가 드롭
    const charId = gs.player.characterId ?? '';
    if (charId === 'doctor' && enemy.infectionChance > 0) {
      if (Math.random() < (BALANCE.combat.doctorZombieMedDropChance ?? 0.30)) {
        const medPool = ['bandage', 'gauze', 'antiseptic'];
        const medId   = medPool[Math.floor(Math.random() * medPool.length)];
        const medInst = gs.createCardInstance(medId, { quantity: 1 });
        if (medInst) {
          const placed = gs.placeCardInRow(medInst.instanceId, 'middle');
          if (placed) {
            const actualId = placed.instanceId ?? medInst.instanceId;
            if (gs.cards[actualId] && !gs.combat.rewards.includes(actualId)) {
              gs.combat.rewards.push(actualId);
            }
          } else {
            gs.pendingLoot = [...(gs.pendingLoot ?? []), {
              definitionId:  medId,
              quantity:      1,
              contamination: 0,
            }];
            gs.removeCardInstanceSilent(medInst.instanceId);
          }
          gs.combat.log.push(I18n.t('combatSys.doctorBonus'));
        }
      }
    }
  },

  // ── 전투 종료 ──────────────────────────────────────────

  // 죽음의 문턱(HP 0 생존) 상태로 전투가 끝나면 HP 1로 안정화 —
  // 전투 밖 시스템들은 HP 0을 사망으로 간주하기 때문
  _stabilizePlayerAfterCombat() {
    const gs = GameState;
    const player = gs.combat?.combatants?.player;
    if (player?.dead === true) return;
    if ((gs.player?.hp?.current ?? 1) <= 0) {
      gs.player.hp.current = 1;
      if (player) {
        player.hp = 1;
        player.deathsDoor = false;
      }
      gs.combat?.log?.push('가까스로 목숨은 건졌다…');
    }
  },

  _resolveVictory() {
    const gs   = GameState;
    const data = gs.combat._encounterData ?? {};
    this._syncRankedCombatants();
    this._stabilizePlayerAfterCombat();
    gs.combat.active  = false;
    gs.combat.outcome = 'victory';

    // 좀비 습격 승리: 추가 사기 보너스
    if (data.isHordeWave) {
      const hw = BALANCE.hordeWaves;
      gs.modStat('morale', hw.victoryMorale);
      gs.modStat('fatigue', 15);
      EventBus.emit('notify', {
        message: I18n.t('combatSys.hordeVictory', { wave: data.hordeWaveNum, morale: hw.victoryMorale }),
        type: 'success',
      });
    } else {
      gs.modStat('morale', 10);
      gs.modStat('fatigue', 10);
    }

    // ── 전투 소음 재조우 타이머 ──────────────────────────
    const noise  = gs.noise.level;
    const nodeId = gs.combat.nodeId;
    if (noise >= 35 && nodeId) {
      const delayTP = noise >= 65 ? 3 : noise >= 50 ? 4 : 5;
      gs.combatRespawn.active      = true;
      gs.combatRespawn.tpRemaining = delayTP;
      gs.combatRespawn.nodeId      = nodeId;
      gs.combatRespawn.dangerLevel = gs.combat.dangerLevel;
      EventBus.emit('notify', {
        message: I18n.t('combatSys.respawnWarn', { delay: delayTP }),
        type: 'warn',
      });
    } else {
      gs.combatRespawn.active = false;
    }

    // 캐릭터 전투 승리 대사
    CharDialogue.emit(gs.player.characterId, 'combat_win');
    this._fx({ kind: 'victory' });
    // 군견 유대감: 함께 싸워 이긴 동반자에게 +3 bond
    NPCSystem.onCombatVictory();
    EventBus.emit('combatEnd', { outcome: 'victory', rewards: gs.combat.rewards });
    // 보라매병원 습격 — HospitalSiegeSystem이 후처리하도록 siegeResolved 발행
    if (data.isSiege) {
      EventBus.emit('siegeResolved', {
        outcome:       'victory',
        casualties:    0,
        defenseRating: 0,
        threat:        0,
        siegeId:       data.siegeId ?? null,
      });
    }
    StateMachine.transition('combat_result', {
      outcome: 'victory',
      rewards: gs.combat.rewards,
      nodeId:  gs.combat.nodeId,
    });
  },

  _resolveDefeat() {
    const gs   = GameState;
    const data = gs.combat._encounterData ?? {};
    this._syncRankedCombatants();
    gs.combat.active       = false;
    gs.combat.outcome      = 'defeat';

    // 좀비 습격 패배: 구조물 내구도 25% 감소
    if (data.isHordeWave) {
      this._applyStructureDamage(BALANCE.hordeWaves.structureDamage);
      gs.modStat('morale', BALANCE.hordeWaves.defeatMorale);
    }

    gs.player.isAlive      = false;
    gs.player.deathCause   = I18n.t('combatSys.deathCause');
    this._fx({ kind: 'playerDeath' });
    this._fx({ kind: 'defeat' });
    EventBus.emit('combatEnd', { outcome: 'defeat' });
    // 보라매병원 습격 패배 — HospitalSiegeSystem이 구조물/환자/dangerMod 후처리
    if (data.isSiege) {
      EventBus.emit('siegeResolved', {
        outcome:       'defeat',
        casualties:    0,
        defenseRating: 0,
        threat:        0,
        siegeId:       data.siegeId ?? null,
      });
    }
    // EndingSystem 경유: death_combat 또는 death_horde 엔딩 결정
    EndingSystem.triggerDeathEnding(I18n.t('combatSys.deathCause'), gs);
  },

  // ── 구조물 피해 (습격 패배/도주) ──────────────────────

  _applyStructureDamage(damagePercent) {
    const gs    = GameState;
    const items = GameData?.items ?? {};
    for (const card of gs.getBoardCards()) {
      const def = items[card.definitionId] ?? gs.getCardDef(card.instanceId);
      if (!def) continue;
      if (def.subtype !== I18n.t('combatSys.structure') && !def.tags?.includes('structure')) continue;
      const inst = gs.cards[card.instanceId];
      if (!inst || (inst.durability ?? 0) <= 0) continue;
      const loss = Math.ceil(inst.durability * (damagePercent / 100));
      inst.durability = Math.max(0, inst.durability - loss);
      if (inst.durability <= 0) {
        EventBus.emit('notify', {
          message: I18n.t('combatSys.structDestroyed', { name: I18n.itemName(def.id, def.name) }),
          type: 'danger',
        });
      }
    }
    EventBus.emit('boardChanged', {});
  },

  // ── 유틸 ──────────────────────────────────────────────

  getAvailableWeapons() {
    const gs     = GameState;
    const result = [];
    const seen   = new Set();

    // 장착 무기 우선 (weapon_main → weapon_sub)
    for (const slot of ['weapon_main', 'weapon_sub']) {
      const id = gs.player.equipped?.[slot];
      if (id && gs.cards[id]) {
        const def = gs.getCardDef(id);
        if (def?.combat) { result.push(gs.cards[id]); seen.add(id); }
      }
    }

    // 보드 무기 (장착되지 않은 것, 장소/랜드마크 제외)
    for (const card of gs.getBoardCards()) {
      if (seen.has(card.instanceId)) continue;
      const def = gs.getCardDef(card.instanceId);
      if (def?.type === 'weapon') result.push(card);
    }

    return result;
  },

  _getPlayerWeapon() {
    const gs = GameState;
    for (const slot of ['weapon_main', 'weapon_sub']) {
      const id = gs.player.equipped?.[slot];
      if (id && gs.cards[id]) {
        const def = gs.getCardDef(id);
        if (def?.combat) return { instanceId: id, def };
      }
    }
    for (const card of gs.getBoardCards()) {
      const def = gs.getCardDef(card.instanceId);
      if (def?.combat) return { instanceId: card.instanceId, def };
    }
    return null;
  },

  getAvailableMedicals() {
    return GameState.getBoardCards().filter(c => {
      const def = GameState.getCardDef(c.instanceId);
      if (!def || def.type === 'location') return false;
      return def.tags?.includes('medical');
    });
  },

  getAvailableThrowables() {
    return GameState.getBoardCards().filter(c => {
      const def = GameState.getCardDef(c.instanceId);
      if (!def) return false;
      return def.subtype === 'throwable' || def.tags?.includes('throwable');
    });
  },

  // ── 공격 미리보기 (UI 표시용 — 랜덤 없이 범위만 계산) ──────
  previewAttack(weaponId = null) {
    const gs    = GameState;
    const enemy = gs.combat.enemies?.[gs.combat.targetIndex];
    if (!enemy) return { dmgMin: 0, dmgMax: 0, accuracy: 70, critChance: 0, ammoLeft: null };

    let dmgMin = 0, dmgMax = 0, accuracy = 0.70, critChance = 0, ammoLeft = null;

    if (weaponId && gs.cards[weaponId]) {
      const def = gs.getCardDef(weaponId);
      if (def?.combat) {
        const [dMin, dMax] = def.combat.damage;
        const qualMult = BALANCE.quality.tiers[gs.cards[weaponId]?._quality]?.mult ?? 1.0;
        dmgMin     = this._applyEnemyDefense(Math.round(dMin * qualMult), enemy.defense);
        dmgMax     = this._applyEnemyDefense(Math.round(dMax * qualMult), enemy.defense);
        accuracy   = def.combat.accuracy;
        critChance = def.combat.critChance ?? 0;

        if (def.combat.requiresAmmo) {
          accuracy   = Math.min(1, accuracy + SkillSystem.getBonus('ranged', 'accBonus'));
          critChance = Math.min(1, critChance + SkillSystem.getBonus('ranged', 'critBonus'));
          const ammoInst = gs.getBoardCards().find(c => c.definitionId === def.combat.requiresAmmo);
          ammoLeft = ammoInst ? (ammoInst.quantity ?? 1) : 0;
        }
      }
    } else {
      const [uMin, uMax] = BALANCE.combat.unarmedBaseDmg;
      const mult = SkillSystem.getBonus('unarmed', 'dmgMult');
      dmgMin = this._applyEnemyDefense(Math.floor(uMin * mult), enemy.defense);
      dmgMax = this._applyEnemyDefense(Math.floor(uMax * mult), enemy.defense);
      accuracy = 0.80;
    }

    if (NightSystem.isNight()) {
      const hasLight = gs.getBoardCards().some(c =>
        gs.getCardDef(c.instanceId)?.tags?.includes('light_source') && (c.durability ?? 100) > 0
      );
      accuracy = Math.max(0.10, accuracy -
        (hasLight ? BALANCE.combat.nightLitPenalty : BALANCE.combat.nightAccuracyPenalty));
    }

    const moraleTier = StatSystem.getMoraleTier();
    accuracy = Math.max(0.10, Math.min(1, accuracy + (moraleTier.accBonus ?? 0)));

    const weaponDef = weaponId && gs.cards[weaponId] ? gs.getCardDef(weaponId) : null;
    const previewSkillId = weaponDef?.combat?.requiresAmmo && ammoLeft !== 0 ? 'ranged' : null;
    ({ accuracy, critChance } = this._applyCharacterAimIdentity({
      accuracy,
      critChance,
      weaponDef,
      skillId: previewSkillId,
    }));

    return {
      dmgMin,
      dmgMax,
      accuracy:   Math.round(accuracy * 100),
      critChance: Math.round(Math.min(1, critChance + (gs.player.critBonus ?? 0)) * 100),
      ammoLeft,
    };
  },
};

export default CombatSystem;
