// CombatSystem 믹스인 — 동료 턴 준비 + 적 의도/AI/공격/타이밍 위협.
// 메서드는 CombatSystem 객체에 스프레드되어 this=CombatSystem으로 실행된다.
import EventBus       from '../../core/EventBus.js';
import GameState      from '../../core/GameState.js';
import I18n           from '../../core/I18n.js';
import SystemRegistry from '../../core/SystemRegistry.js';
import NoiseSystem    from '../NoiseSystem.js';
import StatSystem     from '../StatSystem.js';
import SkillSystem    from '../SkillSystem.js';
import DiseaseSystem  from '../DiseaseSystem.js';
import BodySystem     from '../BodySystem.js';
import { NPC_ITEMS }  from '../../data/npcs.js';
import BALANCE        from '../../data/gameBalance.js';
import GameData       from '../../data/GameData.js';
import { applyDamage, consumeToken } from './CombatStatusSystem.js';
import { modifyIncomingDamage, modifyOutgoingDamage } from './CombatResolution.js';
import { buildEnemyProfile } from './EnemyCombatAdapter.js';
import { executeEnemyAction } from './EnemyActionExecutor.js';
import {
  advanceEnemyAction,
  commitEnemyAction,
  commitTimedThreatAction,
  createEnemyActionState,
  retargetCommittedAction,
} from './EnemyActionPlanner.js';
import { getRank, moveCombatant } from './FormationSystem.js';
import {
  COMPANION_COMBAT_LOADOUTS,
  getCombatSkill,
} from '../../data/combatSkills.js';

export const CombatAiTurns = {
  _companionTurnKey(npcId) {
    const combat = GameState.combat;
    return `${combat?.roundNumber ?? 1}:${combat?.activeIdx ?? 0}:${npcId}`;
  },

  _prepareCompanionTurn(npcId) {
    const combat = GameState.combat;
    if (!combat?.active || typeof npcId !== 'string') return false;
    const turnKey = this._companionTurnKey(npcId);
    if (combat._preparedCompanionTurnKey === turnKey) return false;
    this._compactRankedEnemyFormation();
    combat._preparedCompanionTurnKey = turnKey;
    this._tickCompanionSkillCooldowns(npcId);
    return true;
  },

  _tickCompanionSkillCooldowns(npcId) {
    const st = GameState.npcs?.states?.[npcId];
    if (!st?.skillCooldowns) return;
    for (const id of Object.keys(st.skillCooldowns)) {
      if (st.skillCooldowns[id] > 0) st.skillCooldowns[id]--;
    }
  },

  // NPC 라벨 — ui·log 공용 (한글 name 우선, 없으면 id 축약)
  _npcLabel(npcId) {
    if (!npcId) return '';
    const npcItem = NPC_ITEMS?.[npcId];
    if (npcItem?.name) return I18n.itemName ? I18n.itemName(npcId, npcItem.name) : npcItem.name;
    return npcId.replace(/^npc_/, '');
  },

  // ── Combat Overhaul Phase 3 · 적 의도 예고 + aiPattern ──
  // Into the Breach 방식: 적의 다음 턴 행동을 결정적으로 미리 결정/표시.
  // `enemy._nextIntent = { action, targetType, targetId?, iconEmoji, label }`
  //
  // aiPattern 분기 (5종):
  //   aggressive → HP 최저 타겟 (플레이어+동료 중)
  //   defensive  → 원거리 무기 들고있는 플레이어 우선
  //   horde      → 무작위 타겟
  //   normal     → 플레이어 고정
  //   sniper     → 힐러 클래스 동료 우선, 없으면 플레이어
  //   predator   → bleed/infection/burn 상태이상 타겟 우선

  _getEligibleTargets(combat, gs) {
    const targets = [];
    if ((gs?.player?.hp?.current ?? 0) > 0) {
      const weapon = gs.player.equipped?.weapon_main ?? gs.player.equipped?.weapon_sub;
      const wDef = weapon ? gs.getCardDef?.(weapon) : null;
      const isRanged = !!wDef?.combat?.requiresAmmo;
      const statusEffects = combat?.playerStatus ?? [];
      const combatant = combat?.combatants?.player;
      const tokens = combatant?.tokens ?? {};
      targets.push({
        id: 'player',
        side: 'ally',
        type: 'player',
        hp: gs.player.hp.current,
        maxHp: gs.player.hp.max,
        rank: getRank(combat?.formations, 'player'),
        isRanged,
        isDefended: (tokens.block ?? 0) > 0
          || (tokens.dodge ?? 0) > 0
          || combat?.playerGuard?.active === true,
        isExposed: (tokens.vulnerable ?? 0) > 0 || (tokens.marked ?? 0) > 0,
        statusEffects,
      });
    }
    const companions = gs?.companions ?? [];
    for (const id of companions) {
      const st = gs.npcs?.states?.[id];
      if (!st || (st.hp ?? 0) <= 0) continue;
      const combatant = combat?.combatants?.[id];
      const tokens = combatant?.tokens ?? {};
      const isHealer = (COMPANION_COMBAT_LOADOUTS[id] ?? []).some(skillId => {
        const skill = combat?.skillsById?.[skillId] ?? getCombatSkill(skillId);
        return (skill?.effects ?? []).some(effect => effect?.type === 'heal');
      });
      targets.push({
        side: 'ally',
        type: 'companion',
        id,
        hp: st.hp,
        maxHp: st.maxHp ?? 50,
        rank: getRank(combat?.formations, id),
        isHealer,
        isDefended: (tokens.block ?? 0) > 0
          || (tokens.dodge ?? 0) > 0,
        isExposed: (tokens.vulnerable ?? 0) > 0 || (tokens.marked ?? 0) > 0,
        statusEffects: st.statusEffects ?? [],
      });
    }
    return targets;
  },

  _pickTargetByPattern(pattern, targets, enemy) {
    if (!targets || targets.length === 0) return null;
    const hasStatus = t => (t.statusEffects ?? []).some(s =>
      s.id === 'bleed' || s.id === 'infection' || s.id === 'burn' || s.id === 'acid_burn'
    );

    switch (pattern) {
      case 'aggressive': {
        // HP 최저 (ratio 기준으로 fair)
        const sorted = [...targets].sort((a, b) =>
          (a.hp / (a.maxHp || 1)) - (b.hp / (b.maxHp || 1))
        );
        return sorted[0];
      }
      case 'defensive': {
        // 원거리 무기 들고있는 플레이어 우선
        const ranged = targets.find(t => t.type === 'player' && t.isRanged);
        if (ranged) return ranged;
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
      case 'horde': {
        return targets[Math.floor(Math.random() * targets.length)];
      }
      case 'sniper': {
        // 힐러 클래스 동료 우선, 없으면 플레이어, 아니면 첫 번째
        const healer = targets.find(t => t.type === 'companion' && t.isHealer);
        if (healer) return healer;
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
      case 'predator': {
        // 상태이상 있는 대상 우선 (약한 먹잇감)
        const wounded = targets.find(hasStatus);
        if (wounded) return wounded;
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
      case 'normal':
      default: {
        // 플레이어 고정
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
    }
  },

  // taunted 토큰을 가진 아군이 있으면 패턴과 무관하게 그쪽을 노린다 (도발)
  _tauntedTargetOf(targets, combat) {
    const combatants = combat?.combatants;
    if (!combatants) return null;
    return targets.find(t => {
      const combatant = combatants[t.type === 'player' ? 'player' : t.id];
      return (combatant?.tokens?.taunted ?? 0) > 0 && combatant.dead !== true;
    }) ?? null;
  },

  _enemyForActionPlanning(enemy) {
    const legacyPolicy = {
      aggressive: 'lowest_hp',
      defensive: 'player',
      horde: 'random',
      sniper: 'healer',
      predator: 'predator',
      normal: 'player',
    }[enemy?.aiPattern ?? 'normal'] ?? 'player';
    const targetPolicy = enemy?.patternProfile?.targetPolicy ?? legacyPolicy;
    const targetCount = enemy?.patternProfile?.defaultAction?.target?.count
      ?? (enemy?.spreadAttacks ? Math.max(2, enemy.attacksPerRound ?? 2) : 1);
    const defaultAction = enemy?.patternProfile?.defaultAction ?? enemy?.defaultAction ?? {
      actionId: 'basic_attack',
      motionKey: enemy?.attackType === 'ranged' ? 'ranged' : 'melee',
      target: { side: targetPolicy, count: targetCount },
    };

    return {
      ...enemy,
      specialActionChance: enemy?.patternProfile?.specialActionChance
        ?? enemy?.specialActionChance
        ?? BALANCE.combat.enemySpecialSkillChance
        ?? 0.5,
      patternProfile: {
        ...(enemy?.patternProfile ?? {}),
        targetPolicy,
        defaultAction: {
          ...defaultAction,
          target: {
            ...(defaultAction.target ?? {}),
            side: defaultAction.target?.side ?? targetPolicy,
            count: defaultAction.target?.count ?? targetCount,
          },
        },
      },
    };
  },

  _commitEnemyAction(enemy, combat, gs) {
    const targets = this._getEligibleTargets(combat, gs);
    const taunted = this._tauntedTargetOf(targets, combat);
    const firstActionId = enemy?._firstActionPendingId;
    const firstAction = firstActionId
      ? (enemy.specialSkills ?? []).find(action =>
          (action.actionId ?? action.id) === firstActionId)
      : null;
    const planningEnemy = this._enemyForActionPlanning(enemy);
    const repeatableSpecialSkills = enemy?.dormant?.consumeFirstAction === true
      ? (planningEnemy.specialSkills ?? []).filter(action =>
          (action.actionId ?? action.id) !== enemy.dormant.firstActionId)
      : planningEnemy.specialSkills;
    enemy._enemyActionState = commitEnemyAction({
      enemy: firstAction
        ? {
            ...planningEnemy,
            specialActionChance: 1,
            specialSkills: [firstAction],
          }
        : {
            ...planningEnemy,
            specialSkills: repeatableSpecialSkills,
          },
      candidates: taunted ? [taunted] : targets,
      cooldowns: enemy._skillCooldowns,
      random: firstAction ? () => 0 : Math.random,
    });
    return enemy._enemyActionState.committedAction;
  },

  _commitChargingAction(enemy, combat, gs) {
    const committedAction = enemy._chargingActionState?.committedAction;
    if (committedAction?.category === 'basic') return committedAction;

    const targets = this._getEligibleTargets(combat, gs);
    const taunted = this._tauntedTargetOf(targets, combat);
    const planningEnemy = this._enemyForActionPlanning(enemy);
    enemy._chargingActionState = commitEnemyAction({
      enemy: {
        ...planningEnemy,
        specialSkills: [],
        specialActionChance: 0,
        patternProfile: {
          ...(planningEnemy.patternProfile ?? {}),
          specialActionChance: 0,
        },
      },
      candidates: taunted ? [taunted] : targets,
      cooldowns: {},
      random: Math.random,
    });
    return enemy._chargingActionState.committedAction;
  },

  _intentFromCommittedAction(enemy, action, combat, gs) {
    if (!action) return null;
    const targetIds = [...(action.targetIds ?? [])];
    const targetNames = targetIds.map(targetId =>
      targetId === 'player'
        ? (I18n.getLang?.() === 'ko' ? '플레이어' : 'Player')
        : this._npcLabel(targetId)
    );
    const primaryTargetId = targetIds[0] ?? null;
    const targetType = primaryTargetId === 'player'
      ? 'player'
      : primaryTargetId
        ? 'companion'
        : null;
    const definition = action.category === 'special'
      ? (enemy.specialSkills ?? []).find(skill =>
          (skill.actionId ?? skill.id) === action.actionId)
      : enemy.patternProfile?.defaultAction ?? enemy.defaultAction ?? enemy.attack;
    const actionName = definition?.name ?? action.actionId;
    const compatibilityTelegraph = action.category === 'special' && enemy._telegraph;
    const isTelegraphing = action.state === 'telegraphing' || compatibilityTelegraph;
    const countdown = isTelegraphing
      ? (enemy._telegraph?.remaining ?? action.remainingTelegraphTurns)
      : null;
    const targetLabel = targetNames.join(', ');
    const detailLabels = [];

    if (targetIds.length > 1) {
      detailLabels.push(I18n.t('combat.intent.multi_target', { targets: targetLabel }));
    }
    if (action.hitCount > 1) {
      detailLabels.push(I18n.t('combat.intent.multi_hit', { count: action.hitCount }));
    }
    detailLabels.push(I18n.t(isTelegraphing ? 'combat.intent.charging' : 'combat.intent.ready'));

    const baseLabel = action.category === 'special'
      ? `${targetLabel}에 ${actionName} 사용`
      : `${targetLabel} 공격`;
    const wavering = enemy.type === 'human'
      && enemy.currentMorale != null
      && (enemy.currentHp / (enemy.maxHp || 1)) <= 0.5;
    const taunted = this._tauntedTargetOf(this._getEligibleTargets(combat, gs), combat);

    return {
      actionId: action.actionId,
      category: action.category,
      state: action.state,
      targetIds,
      remainingTelegraphTurns: action.remainingTelegraphTurns,
      hitCount: action.hitCount,
      motionKey: action.motionKey,
      action: compatibilityTelegraph ? 'telegraph' : action.category === 'special' ? 'skill' : 'attack',
      targetType,
      targetId: targetType === 'companion' ? primaryTargetId : null,
      targetNames,
      skillId: action.category === 'special' ? action.actionId : null,
      countdown,
      iconEmoji: isTelegraphing ? '⚠️' : action.category === 'special' ? '💢' : '🗡',
      label: `${baseLabel} · ${detailLabels.join(' · ')}${wavering ? ' · 동요' : ''}`,
      pattern: enemy.aiPattern ?? 'normal',
      viaTaunt: !!taunted && targetIds.includes(taunted.id),
      wavering,
    };
  },

  _decideNextIntent(enemy, combat, gs) {
    if (!enemy || (enemy.currentHp ?? 0) <= 0) return null;
    enemy._timedThreatIntent = null;
    const targets = this._getEligibleTargets(combat, gs);
    const pattern = enemy.aiPattern ?? 'normal';
    const taunted = this._tauntedTargetOf(targets, combat);
    const target = taunted ?? this._pickTargetByPattern(pattern, targets, enemy);
    if (!target) return null;

    // 잠복: 깨어나기 전에는 위협이 아니다 — 이 창에 처치하면 기습 무효
    if ((enemy._dormantRemaining ?? 0) > 0) {
      return {
        action: 'dormant',
        countdown: enemy._dormantRemaining,
        targetType: 'self',
        targetId: null,
        iconEmoji: '💤',
        label: `${I18n.t('combat.intent.wake')} — ${enemy._dormantRemaining}`,
        pattern,
      };
    }

    // 기존 저장 데이터의 예고 상태는 committed action으로 이행되기 전까지만 호환한다.
    if (enemy._telegraph && !enemy._enemyActionState?.committedAction) {
      const tgSkill = (enemy.specialSkills ?? []).find(s => s.id === enemy._telegraph.skillId);
      return {
        action: 'telegraph',
        skillId: enemy._telegraph.skillId,
        countdown: enemy._telegraph.remaining,
        targetType: target?.type ?? 'player',
        targetId: target?.id ?? null,
        iconEmoji: '⚠️',
        label: `${tgSkill?.name ?? '강습'} 준비 중!`,
        pattern,
      };
    }

    // 예약 위협은 실행할 현재 행동과 별도로 유지해야 충전 중 기본 공격을 정직하게 예고할 수 있다.
    if ((enemy._chargeRemaining ?? null) !== null && enemy.timedThreat) {
      const previousAction = enemy._enemyActionState?.committedAction;
      const eligibleTargetIds = targets.map(candidate =>
        candidate?.type === 'player' ? 'player' : candidate?.id
      ).filter(Boolean);
      const previousTargetIds = previousAction?.category === 'timed_threat'
        && previousAction.actionId === enemy.timedThreat.id
        ? previousAction.targetIds.filter(targetId => eligibleTargetIds.includes(targetId))
        : [];
      enemy._enemyActionState = commitTimedThreatAction({
        enemy,
        candidates: taunted && enemy.timedThreat.targetPolicy !== 'all'
          ? [taunted]
          : targets,
        targetIds: previousTargetIds.length > 0
          ? previousTargetIds
          : null,
      });
      const action = enemy._enemyActionState.committedAction;
      const icon = enemy.timedThreat.id === 'self_destruct' ? '💥'
                 : enemy.timedThreat.id === 'summon_horde'  ? '📣'
                 : '⚡';
      const chargingLabelMap = {
        self_destruct: `${action.remainingTelegraphTurns}턴 후 자폭`,
        summon_horde: `${action.remainingTelegraphTurns}턴 후 증원 소환 · ${I18n.t('combat.intent.quiet_kill_counter')}`,
        charge_strike: `${action.remainingTelegraphTurns}턴 후 돌진`,
      };
      const readyLabelMap = {
        self_destruct: '다음 행동에 자폭',
        summon_horde: `다음 행동에 증원 소환 · ${I18n.t('combat.intent.quiet_kill_counter')}`,
        charge_strike: '다음 행동에 돌진',
      };
      const primaryTargetId = action.targetIds[0] ?? null;
      const targetType = primaryTargetId === 'player'
        ? 'player'
        : primaryTargetId ? 'companion' : null;
      const threatIntent = {
        actionId: action.actionId,
        category: action.category,
        state: action.state,
        targetIds: [...action.targetIds],
        remainingTelegraphTurns: action.remainingTelegraphTurns,
        hitCount: action.hitCount,
        motionKey: action.motionKey,
        action: 'timed_threat',
        threatId: enemy.timedThreat.id,
        countdown: action.state === 'telegraphing'
          ? action.remainingTelegraphTurns
          : null,
        targetType,
        targetId: targetType === 'companion' ? primaryTargetId : null,
        iconEmoji: icon,
        label: action.state === 'ready'
          ? readyLabelMap[enemy.timedThreat.id] ?? I18n.t('combat.intent.ready')
          : chargingLabelMap[enemy.timedThreat.id] ?? I18n.t('combat.intent.charging'),
        pattern: enemy.aiPattern ?? 'normal',
      };
      enemy._timedThreatIntent = threatIntent;

      if (enemy._chargeRemaining > 0 && enemy.timedThreat.chargingAttacks) {
        const chargingAction = this._commitChargingAction(enemy, combat, gs);
        return this._intentFromCommittedAction(enemy, chargingAction, combat, gs);
      }

      enemy._chargingActionState = createEnemyActionState();
      return threatIntent;
    }
    enemy._chargingActionState = createEnemyActionState();

    // 후열 근접 적: 다음 턴은 공격이 아니라 전열로 전진
    if (this.rowOf(enemy) === 'back' && (enemy.attackType ?? 'melee') === 'melee') {
      return {
        action: 'advance',
        targetType: 'self',
        targetId: null,
        iconEmoji: '👣',
        label: I18n.t('combat.rankFront') + ' 전진',
        pattern,
      };
    }

    const action = enemy._enemyActionState?.committedAction
      ?? this._commitEnemyAction(enemy, combat, gs);
    return this._intentFromCommittedAction(enemy, action, combat, gs);
  },

  /**
   * 큐 엔트리 기반 단일 적 턴 실행.
   * UI가 표시한 committed action을 예고 진행·대상 재선정 후 공용 실행기에 전달한다.
   */
  _runSingleEnemyTurn(enemyIdx) {
    const gs = GameState;
    const enemy = gs.combat.enemies?.[enemyIdx];
    if (!enemy || enemy.currentHp <= 0) return;

    // 잠복 상태: 깨어나기 전에는 행동하지 않는다 — 이 사이 처치하면 기습 무효
    if ((enemy._dormantRemaining ?? 0) > 0) {
      enemy._dormantRemaining -= 1;
      const enemyName = I18n.enemyName(enemy.id, enemy.name);
      gs.combat.log.push(enemy._dormantRemaining > 0
        ? I18n.t('combatSys.dormantStir', { enemy: enemyName })
        : I18n.t('combatSys.dormantWake', { enemy: enemyName }));
      if (
        enemy._dormantRemaining === 0
        && typeof enemy.dormant?.firstActionId === 'string'
      ) {
        enemy._firstActionPendingId = enemy.dormant.firstActionId;
      }
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    // 산성 축적 등 방치 비용: 생존한 자기 턴마다 상태이상 피해가 커진다
    if (enemy.statusInflict?.escalatePerTurn) {
      enemy._inflictEscalation = (enemy._inflictEscalation ?? 0) + enemy.statusInflict.escalatePerTurn;
      gs.combat.log.push(I18n.t('combatSys.inflictEscalate', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        status: enemy.statusInflict.name,
        stacks: enemy._inflictEscalation,
      }));
    }

    const stunIdx = (enemy._statusEffects ?? []).findIndex(s =>
      s?.id === 'stun' || s?.effect?.skipTurn === true);
    if (stunIdx !== -1) {
      const [stun] = enemy._statusEffects.splice(stunIdx, 1);
      const enemyName = I18n.enemyName(enemy.id, enemy.name);
      gs.combat.log.push(`${enemyName}은(는) ${stun?.name ?? I18n.t('combatSys.stun')} 상태라 행동하지 못했다.`);
      this._fx({ kind: 'status', target: 'enemy', enemyIdx, statusId: 'stun' });
      if (enemy._enemyActionState?.committedAction) {
        enemy._enemyActionState = advanceEnemyAction({
          state: enemy._enemyActionState,
          stunned: true,
        });
      }
      this._syncLegacyEnemiesToRanked(gs.combat);
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }
    this._applyEnemyTurnStartTraits(enemy);

    // 사기 격파: 사기 소진 시 도주(rout)
    if (enemy.type === 'human' && enemy.currentMorale != null
        && enemy.currentMorale <= BALANCE.combat.moraleBreak.routThreshold) {
      enemy._routed = true;
      enemy.currentHp = 0;
      gs.combat.log.push(I18n.t('combatSys.enemyRout', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      return;
    }

    // 후열 근접 적: 공격 대신 전열로 전진 (1턴 소모)
    if (this.rowOf(enemy) === 'back' && (enemy.attackType ?? 'melee') === 'melee') {
      enemy.row = 'front';
      gs.combat.log.push(I18n.t('combatSys.enemyAdvance', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      this._fx({ kind: 'advance', enemyIdx });
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    // 타이밍 압박: 충전 중/발동 처리
    if ((enemy._chargeRemaining ?? null) !== null) {
      if (enemy._chargeRemaining > 0) {
        if (enemy.timedThreat?.chargingAttacks) {
          let action = enemy._chargingActionState?.committedAction
            ?? this._commitChargingAction(enemy, gs.combat, gs);
          action = retargetCommittedAction({
            action,
            candidates: this._getEligibleTargets(gs.combat, gs),
          });
          enemy._chargingActionState = { committedAction: action };

          const intent = this._intentFromCommittedAction(enemy, action, gs.combat, gs);
          if (intent?.viaTaunt) {
            for (const targetId of action?.targetIds ?? []) {
              const tauntedCombatant = gs.combat.combatants?.[targetId];
              if ((tauntedCombatant?.tokens?.taunted ?? 0) > 0) {
                consumeToken(tauntedCombatant, 'taunted', 1);
                break;
              }
            }
          }

          this._executeEnemyCommittedAction(enemy, action);
          enemy._chargingActionState = createEnemyActionState();
          if (this._isPlayerDefeated()) return;
        }
        enemy._chargeRemaining -= 1;
        enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
        return;
      }
      let action = enemy._enemyActionState?.committedAction;
      const hasReadyTimedAction = action?.category === 'timed_threat'
        && action.actionId === enemy.timedThreat?.id
        && action.state === 'ready'
        && action.remainingTelegraphTurns === 0;
      if (!hasReadyTimedAction) {
        enemy._enemyActionState = commitTimedThreatAction({
          enemy,
          candidates: this._getEligibleTargets(gs.combat, gs),
          targetIds: action?.category === 'timed_threat'
            ? action.targetIds
            : null,
        });
        action = enemy._enemyActionState.committedAction;
      }
      this._resolveTimedThreat(enemy, action);
      enemy._chargeRemaining = enemy.timedThreat?.chargeTurns ?? null;
      if (enemy.currentHp > 0) enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    let action = enemy._enemyActionState?.committedAction;
    if (!action && enemy._nextIntent) {
      const legacySkillId = enemy._telegraph?.skillId ?? enemy._nextIntent.skillId;
      const legacySkill = (enemy.specialSkills ?? []).find(candidate =>
        (candidate.actionId ?? candidate.id) === legacySkillId);
      const legacyTargetId = enemy._nextIntent.targetType === 'player'
        ? 'player'
        : enemy._nextIntent.targetId;
      const category = enemy._nextIntent.action === 'skill'
        || (enemy._nextIntent.action === 'telegraph' && legacySkill)
        ? 'special'
        : 'basic';
      action = {
        actionId: category === 'special'
          ? legacySkillId
          : 'basic_attack',
        category,
        state: 'ready',
        targetIds: legacyTargetId ? [legacyTargetId] : [],
        remainingTelegraphTurns: 0,
        hitCount: legacySkill?.hitCount
          ?? legacySkill?.effect?.multiHit
          ?? enemy.attacksPerRound
          ?? 1,
        motionKey: category === 'special'
          ? legacySkill?.motionKey ?? legacySkillId
          : 'basic_attack',
      };
      enemy._enemyActionState = { committedAction: action };
    }
    if (!action) {
      this._decideNextIntent(enemy, gs.combat, gs);
      action = enemy._enemyActionState?.committedAction;
    }
    if (!action) return;

    if (action.state === 'telegraphing') {
      const skill = (enemy.specialSkills ?? []).find(candidate =>
        (candidate.actionId ?? candidate.id) === action.actionId);
      enemy._telegraph = {
        skillId: action.actionId,
        remaining: action.remainingTelegraphTurns,
        targetRank: getRank(gs.combat.formations, action.targetIds[0] ?? 'player'),
        targetRanks: Object.fromEntries((action.targetIds ?? []).map(targetId => [
          targetId,
          getRank(gs.combat.formations, targetId),
        ])),
      };
      gs.combat.log.push(I18n.t('combatSys.telegraphStart', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        skill: skill?.name ?? action.actionId,
      }));
      this._fx({
        kind: 'status',
        target: 'enemy',
        enemyIdx,
        statusId: 'telegraph',
      });
      enemy._enemyActionState = advanceEnemyAction({
        state: enemy._enemyActionState,
      });
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    action = retargetCommittedAction({
      action,
      candidates: this._getEligibleTargets(gs.combat, gs),
    });
    enemy._enemyActionState = { committedAction: action };
    const skill = action.category === 'special'
      ? (enemy.specialSkills ?? []).find(candidate =>
          (candidate.actionId ?? candidate.id) === action.actionId)
      : null;
    const telegraph = skill?.telegraph;
    const cancelledByHit = telegraph?.cancelOnHit === true
      && !enemy._telegraph
      && (enemy._skillCooldowns?.[action.actionId] ?? 0) > 0;
    const movedTarget = enemy._telegraph && telegraph?.moveEvadeChance
      ? (action.targetIds ?? []).find(targetId => {
          const before = enemy._telegraph.targetRanks?.[targetId]
            ?? (targetId === action.targetIds[0] ? enemy._telegraph.targetRank : null);
          const current = getRank(gs.combat.formations, targetId);
          return before !== null && current !== before;
        })
      : null;
    const evadedByMove = !!movedTarget && Math.random() < telegraph.moveEvadeChance;

    const intent = this._intentFromCommittedAction(enemy, action, gs.combat, gs);
    if (intent?.viaTaunt) {
      for (const targetId of action.targetIds ?? []) {
        const tauntedCombatant = gs.combat.combatants?.[targetId];
        if ((tauntedCombatant?.tokens?.taunted ?? 0) > 0) {
          consumeToken(tauntedCombatant, 'taunted', 1);
          break;
        }
      }
    }

    if (evadedByMove) {
      gs.combat.log.push(I18n.t('combatSys.telegraphEvaded', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        skill: skill?.name ?? action.actionId,
      }));
      this._fx({ kind: 'enemyAttack', enemyIdx, miss: true });
    } else if (!cancelledByHit) {
      this._executeEnemyCommittedAction(enemy, action);
    }

    if (enemy._skillCooldowns) {
      for (const candidate of (enemy.specialSkills ?? [])) {
        if ((enemy._skillCooldowns[candidate.id] ?? 0) > 0) {
          enemy._skillCooldowns[candidate.id] -= 1;
        }
      }
    }
    if (skill) {
      enemy._skillCooldowns = enemy._skillCooldowns ?? {};
      enemy._skillCooldowns[skill.id] = skill.cooldown ?? 0;
    }
    enemy._telegraph = null;
    enemy._enemyActionState = createEnemyActionState();
    if (
      enemy.dormant?.consumeFirstAction === true
      && enemy._firstActionPendingId === action.actionId
    ) {
      enemy._firstActionPendingId = null;
    }

    if (gs.combat.log.length > BALANCE.combat.combatLogMaxEntries) {
      gs.combat.log.splice(0, gs.combat.log.length - BALANCE.combat.combatLogMaxEntries);
    }

    // 다음 턴 intent 재결정 (죽었을 수도 있으므로 null 허용)
    enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
  },

  _executeEnemyCommittedAction(enemy, action) {
    const gs = GameState;
    const combat = gs.combat;
    const enemyIdx = combat?.enemies?.indexOf(enemy) ?? -1;
    const impactFx = this._monsterImpactFx(enemy);
    const definition = action?.category === 'special'
      ? (enemy?.specialSkills ?? []).find(skill =>
          (skill?.actionId ?? skill?.id) === action.actionId)
      : action?.category === 'timed_threat'
        ? enemy?.timedThreat
      : null;
    const blockedTargets = new Set();

    return executeEnemyAction({
      enemy,
      action,
      random: Math.random,
      services: {
        damageTarget: (targetId, amount) => {
          const npcId = targetId === 'player' ? null : targetId;
          let damage = modifyOutgoingDamage(amount, this._rankCombatantForEnemy(enemy));

          if (!npcId) {
            const armor = StatSystem.getArmorEffects();
            const defSkillBonus = SkillSystem.getBonus('defense', 'damageReduction');
            const totalReduct = Math.min(
              BALANCE.armor.damageReductionCap,
              armor.damageReduction + defSkillBonus,
            );
            if (totalReduct > 0) damage = Math.max(1, Math.floor(damage * (1 - totalReduct)));
            if (combat?.playerGuard?.active) {
              damage = Math.max(1, Math.floor(damage * (1 - combat.playerGuard.damageReduce)));
            }
          }

          const result = this._dealDamageToAlly({
            npcId,
            rawDamage: damage,
            canBeDodged: !(action.category === 'timed_threat'
              && action.actionId === 'self_destruct'),
          });
          if (result.blocked) blockedTargets.add(targetId);
          if (result.dodged) return result;

          if (npcId) {
            combat.lastHit = { target: 'companion', damage: result.damage, npcId, isCrit: false };
            EventBus.emit('enemyAttackCompanion', { enemyId: enemy.id, npcId, damage: result.damage });
          } else {
            combat.lastHit = { target: 'player', damage: result.damage, isCrit: false };
            EventBus.emit('playerHit', { damage: result.damage });
            DiseaseSystem.checkCombatInjury(result.damage, gs);
            BodySystem.onCombatHit(result.damage, enemy);
            if (action.category === 'basic') SkillSystem.gainXp('defense', 1);
          }
          return result;
        },
        addStatus: (targetId, status) => {
          if (status?.id === 'stun'
              && definition?.telegraph?.blockNegatesStun === true
              && blockedTargets.has(targetId)) {
            return false;
          }
          return this._addAllyStatus(targetId, status);
        },
        moveTarget: (targetId, distance) => this._forceMoveAlly(targetId, distance, enemy),
        summonEnemy: (enemyId, count, row) => {
          const spawned = this._summonEnemyById(enemyId, count, row, enemy);
          if (spawned > 0) {
            combat.log.push(I18n.t('combatSys.screamerSummon', {
              enemy: I18n.enemyName(enemy.id, enemy.name),
              count: spawned,
            }));
          }
          return spawned;
        },
        addNoise: amount => NoiseSystem.addNoise(amount),
        emitFx: payload => {
          const companionTarget = payload.targetId !== 'player';
          this._fx({
            kind: companionTarget ? 'enemyAttackCompanion' : 'enemyAttack',
            enemyIdx,
            ...(companionTarget ? { npcId: payload.targetId } : {}),
            fx: impactFx,
            dmg: payload.damage,
            miss: payload.miss,
          });
        },
        addLog: message => {
          if (Array.isArray(combat?.log)) combat.log.push(message);
        },
      },
    });
  },

  _enemyAttackCompanion(enemy, npcId, { hitCount = enemy?.attacksPerRound ?? 1 } = {}) {
    return this._executeEnemyCommittedAction(enemy, {
      actionId: 'basic_attack',
      category: 'basic',
      state: 'ready',
      targetIds: npcId ? [npcId] : [],
      remainingTelegraphTurns: 0,
      hitCount,
      motionKey: 'basic_attack',
    });
  },

  _monsterImpactFx(enemy) {
    if ((enemy?.attackType ?? 'melee') === 'ranged') return 'shot';

    const id = String(enemy?.id ?? enemy?.definitionId ?? '').toLowerCase();
    const name = String(enemy?.name ?? '').toLowerCase();
    const key = `${id} ${name}`;

    if (key.includes('acid') || key.includes('poison') || key.includes('부식')) return 'acid';
    if (key.includes('charger') || key.includes('돌진')) return 'shock';
    if (key.includes('brute') || key.includes('horde') || key.includes('tiger') || key.includes('거대')) return 'slam';
    if (key.includes('bloater') || key.includes('radiation') || key.includes('폭발') || key.includes('방사')) return 'rupture';

    return 'claw';
  },

  _addAllyStatus(targetId, status) {
    if (!status?.id) return false;
    const gs = GameState;
    const combat = gs.combat;
    const isPlayer = targetId === 'player';
    const combatant = combat?.combatants?.[targetId];
    if (!isPlayer && !combatant) return false;

    if (isPlayer && !Array.isArray(combat.playerStatus)) combat.playerStatus = [];
    if (!isPlayer && !Array.isArray(combatant.statusEffects)) combatant.statusEffects = [];
    const statuses = isPlayer ? combat.playerStatus : combatant.statusEffects;
    const existing = statuses.find(s => s.id === status.id);
    if (existing) {
      existing.duration = Math.max(existing.duration ?? 0, status.duration ?? 1);
      existing.effect = { ...(existing.effect ?? {}), ...(status.effect ?? {}) };
    } else {
      statuses.push({
        id: status.id,
        name: status.name ?? status.id,
        duration: status.duration ?? 1,
        effect: { ...(status.effect ?? {}) },
      });
    }
    if (!isPlayer) {
      const state = gs.npcs?.states?.[targetId];
      if (state) {
        state.statusEffects = statuses.map(entry => ({
          ...entry,
          effect: { ...(entry.effect ?? {}) },
        }));
      }
    }
    this._fx({
      kind: 'status',
      target: isPlayer ? 'player' : 'companion',
      ...(isPlayer ? {} : { targetId, npcId: targetId }),
      statusId: status.id,
    });
    return true;
  },

  _addPlayerStatus(status) {
    return this._addAllyStatus('player', status);
  },

  _instantiateEnemyFromDefinition(def) {
    if (!def) return null;
    const hpDef = def.hp ?? { min: def.maxHp ?? 1, max: def.maxHp ?? 1 };
    const hp = hpDef.min + Math.floor(Math.random() * (hpDef.max - hpDef.min + 1));
    return {
      ...def,
      currentHp: hp,
      maxHp: hp,
      row: def.position ?? def.row ?? 'front',
      _skillCooldowns: {},
      _statusEffects: [],
      _chargeRemaining: def.timedThreat?.chargeTurns ?? null,
      _dormantRemaining: def.dormant?.wakeTurns ?? null,
      currentMorale: def.type === 'human' ? (def.morale?.max ?? 100) : null,
    };
  },

  _summonEnemyById(enemyId, count = 1, row = 'front', sourceEnemy = null) {
    const gs = GameState;
    const def = GameData?.enemies?.[enemyId];
    if (!def || count <= 0) return 0;
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const add = this._instantiateEnemyFromDefinition(def);
      if (!add) continue;
      if (!this._spawnEnemyMidCombat(add, row)) break;
      spawned++;
    }
    if (spawned > 0) {
      this._fx({
        kind: 'summon',
        enemyIdx: sourceEnemy ? gs.combat.enemies.indexOf(sourceEnemy) : -1,
        count: spawned,
      });
    }
    return spawned;
  },

  // 전투 중 적 증원의 단일 진입점 — 레거시 enemies/turnQueue와 랭크 combatants/formations를
  // 함께 등록한다. 랭크 모드에서 포메이션(최대 4칸)이 꽉 차면 증원을 억제한다.
  _spawnEnemyMidCombat(enemyObj, row = 'front') {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat || !enemyObj) return false;
    enemyObj.row = row;

    if (combat.combatants && combat.formations) {
      this._compactRankedEnemyFormation();
      const preferredRanks = row === 'back' ? [3, 4, 1, 2] : [1, 2, 3, 4];
      const slotRank = preferredRanks.find(rank => combat.formations.enemy?.[rank - 1] == null);
      if (slotRank === undefined) {
        this._pushCombatLog('증원이 들어설 자리가 없다!');
        return false;
      }

      combat.enemies.push(enemyObj);
      const index = combat.enemies.length - 1;
      const combatantId = `enemy:${index}`;
      combat.formations.enemy[slotRank - 1] = combatantId;
      combat.combatants[combatantId] = {
        id: combatantId,
        side: 'enemy',
        sourceType: 'enemy',
        sourceId: enemyObj.id ?? enemyObj.definitionId,
        enemyIndex: index,
        hp: enemyObj.currentHp,
        maxHp: enemyObj.maxHp,
        speed: enemyObj.speed ?? BALANCE.combat.defaultEnemySpeed,
        dodge: enemyObj.dodge ?? 0,
        rank: slotRank,
        tokens: {},
        statusEffects: [...(enemyObj._statusEffects ?? [])],
        dead: (enemyObj.currentHp ?? 0) <= 0,
      };
      const profile = buildEnemyProfile(enemyObj);
      combat.enemyProfiles[combatantId] = profile;
      for (const skill of profile.skills ?? []) {
        combat.skillsById[skill.id] = skill;
      }
      combat.turnQueue?.push({
        type: 'enemy',
        enemyIdx: index,
        order: combat.turnQueue.length,
        combatantId,
      });
    } else {
      combat.enemies.push(enemyObj);
      combat.turnQueue?.push({
        type: 'enemy',
        enemyIdx: combat.enemies.length - 1,
        order: combat.turnQueue.length,
      });
    }

    enemyObj._nextIntent = this._decideNextIntent(enemyObj, combat, gs);
    return true;
  },

  _applyEnemyTemporaryBuff(enemy, id, value, duration) {
    if (!enemy || !id || !duration) return;
    if (!enemy._combatBuffs) enemy._combatBuffs = {};
    enemy._combatBuffs[id] = { value, duration };
  },

  _tickEnemyTemporaryBuffs(enemy) {
    if (!enemy?._combatBuffs) return;
    for (const [id, buff] of Object.entries(enemy._combatBuffs)) {
      buff.duration = (buff.duration ?? 1) - 1;
      if (buff.duration <= 0) {
        if (id === 'defenseBoost') enemy.defense = Math.max(0, (enemy.defense ?? 0) - (buff.value ?? 0));
        delete enemy._combatBuffs[id];
      }
    }
  },

  _applyEnemyTurnStartTraits(enemy) {
    if (!enemy || enemy.currentHp <= 0) return;
    this._tickEnemyTemporaryBuffs(enemy);
    this._applyBossPhaseTriggers(enemy);
    if (enemy.regeneration && enemy.currentHp < enemy.maxHp) {
      const before = enemy.currentHp;
      enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + enemy.regeneration);
      const healed = enemy.currentHp - before;
      if (healed > 0) {
        GameState.combat.log.push(`${enemy.name ?? enemy.id} regenerates ${healed} HP`);
        this._fx({ kind: 'status', target: 'enemy', enemyIdx: GameState.combat.enemies.indexOf(enemy), statusId: 'regeneration' });
      }
    }
  },

  _applyEnemyAoeAttack(enemy, aoeAttack) {
    if (!aoeAttack || Math.random() >= (aoeAttack.chance ?? 1)) return 0;
    const gs = GameState;
    const [dMin, dMax] = aoeAttack.damage ?? [0, 0];
    const struck = this._dealDamageToAlly({
      rawDamage: dMin + Math.floor(Math.random() * (dMax - dMin + 1)),
      canBeDodged: false,
    });
    const dmg = struck.damage;
    gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
    EventBus.emit('playerHit', { damage: dmg });

    for (const id of (gs.companions ?? [])) {
      const st = gs.npcs?.states?.[id];
      if (st && (st.hp ?? 0) > 0) {
        this._dealDamageToAlly({ npcId: id, rawDamage: dmg, canBeDodged: false });
      }
    }

    if (aoeAttack.effect) {
      this._applyEnemySkillEffect(enemy, { id: 'aoe_attack', effect: aoeAttack.effect }, dmg);
    }
    this._fx({ kind: 'enemyAttack', enemyIdx: gs.combat.enemies.indexOf(enemy), fx: 'skill', dmg, crit: true });
    return dmg;
  },

  _applyBossPhaseTriggers(enemy) {
    if (!enemy?.phaseThresholds?.length || !enemy.maxHp) return;
    if (!enemy._triggeredPhaseThresholds) enemy._triggeredPhaseThresholds = [];
    const ratio = enemy.currentHp / enemy.maxHp;
    const thresholds = [...enemy.phaseThresholds].sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (ratio > threshold || enemy._triggeredPhaseThresholds.includes(threshold)) continue;
      enemy._triggeredPhaseThresholds.push(threshold);
      if (enemy._skillCooldowns) {
        for (const skill of (enemy.specialSkills ?? [])) enemy._skillCooldowns[skill.id] = 0;
      }
      if (enemy.summon?.enemyId) {
        this._summonEnemyById(enemy.summon.enemyId, enemy.summon.count ?? 1, 'front', enemy);
      }
      if (enemy.aoeAttack) this._applyEnemyAoeAttack(enemy, enemy.aoeAttack);
      GameState.combat.log.push(`${enemy.name ?? enemy.id} enters phase ${threshold}`);
    }
  },

  _applyEnemySkillEffect(enemy, skill, damageDealt = 0) {
    const effect = skill?.effect;
    if (!effect) return [];
    const gs = GameState;
    const logs = [];

    if (Number.isFinite(effect.forcedMove) && effect.forcedMove !== 0) {
      this._forceMoveAlly('player', effect.forcedMove, enemy);
    }

    if (effect.selfHeal) {
      const before = enemy.currentHp ?? 0;
      enemy.currentHp = Math.min(enemy.maxHp ?? before, before + effect.selfHeal);
      logs.push(`${enemy.name ?? enemy.id} heals ${enemy.currentHp - before} HP`);
    }

    if (effect.summon?.enemyId) {
      const count = effect.summon.count ?? 1;
      const spawned = this._summonEnemyById(effect.summon.enemyId, count, 'front', enemy);
      if (spawned > 0) logs.push(`${enemy.name ?? enemy.id} summons ${spawned} reinforcements`);
    }

    const dot = effect.dot ?? effect.bleed;
    if (dot) {
      const statusId = effect.bleed ? 'bleed' : `${skill.id}_dot`;
      this._addPlayerStatus({
        id: statusId,
        name: dot.name ?? statusId,
        duration: dot.duration ?? effect.duration ?? 2,
        effect: { hpLossPerRound: dot.hpLossPerRound ?? dot.hpPerRound ?? 0 },
      });
    }

    if (effect.poison) {
      this._addPlayerStatus({
        id: 'poison',
        name: 'poison',
        duration: effect.duration ?? effect.dot?.duration ?? 3,
        effect: { hpLossPerRound: effect.dot?.hpLossPerRound ?? 4 },
      });
    }

    if (effect.infection) gs.modStat?.('infection', effect.infection);
    if (effect.radiation) gs.modStat?.('radiation', effect.radiation);
    if (effect.bodyTemp) gs.modStat?.('temperature', effect.bodyTemp);

    if (effect.staminaDrain && gs.stats?.stamina) {
      gs.stats.stamina.current = Math.max(0, (gs.stats.stamina.current ?? 0) - effect.staminaDrain);
    }
    if (effect.moraleDrain && gs.stats?.morale) {
      gs.stats.morale.current = Math.max(0, (gs.stats.morale.current ?? 0) - effect.moraleDrain);
    }

    if (effect.stun) {
      this._addPlayerStatus({ id: 'stun', name: I18n.t('combatSys.stun'), duration: effect.stun, effect: {} });
    }

    if (effect.defenseBoost) {
      enemy.defense = (enemy.defense ?? 0) + effect.defenseBoost;
      this._applyEnemyTemporaryBuff(enemy, 'defenseBoost', effect.defenseBoost, effect.duration ?? 2);
    }
    if (effect.evasion) this._applyEnemyTemporaryBuff(enemy, 'evasion', effect.evasion, effect.duration ?? 2);
    if (effect.invulnerable) this._applyEnemyTemporaryBuff(enemy, 'invulnerable', 1, effect.invulnerable);

    if (effect.multiHit && damageDealt > 0) {
      const extraHits = Math.max(0, (effect.multiHit ?? 1) - 1);
      // 후속타는 본타에 이미 명중한 연계 — 회피 재판정 없이 적용
      const extra = this._dealDamageToAlly({ rawDamage: damageDealt * extraHits, canBeDodged: false });
      if (extra.damage > 0) logs.push(`${enemy.name ?? enemy.id} follows up for ${extra.damage} damage`);
    }

    if (effect.doubleShot && damageDealt > 0) {
      const extra = this._dealDamageToAlly({ rawDamage: damageDealt, canBeDodged: false });
      logs.push(`${enemy.name ?? enemy.id} fires again for ${extra.damage} damage`);
    }

    if (effect.aoe && damageDealt > 0) {
      for (const id of (gs.companions ?? [])) {
        const st = gs.npcs?.states?.[id];
        if (st && (st.hp ?? 0) > 0) {
          this._dealDamageToAlly({ npcId: id, rawDamage: damageDealt, canBeDodged: false });
        }
      }
    }

    return logs;
  },

  _runEnemyAI(enemy) {
    const gs   = GameState;
    const logs = [];

    // 예고된 스킬이 있으면 이번 턴은 그 발동이다 (이동 회피/블록 카운터 판정 포함)
    if (enemy._telegraph) {
      return this._resolveTelegraphedSkill(enemy);
    }

    for (const skill of (enemy.specialSkills ?? [])) {
      const cd = enemy._skillCooldowns?.[skill.id] ?? 0;
      if (cd > 0) { enemy._skillCooldowns[skill.id]--; continue; }
      if (Math.random() < (BALANCE.combat.enemySpecialSkillChance ?? 0.5)) {
        // 예고형 스킬: 이번 턴은 준비 동작만 — 플레이어에게 대응할 1턴을 준다
        if (skill.telegraph) {
          enemy._telegraph = {
            skillId: skill.id,
            remaining: skill.telegraph.turns ?? 1,
            targetRank: getRank(gs.combat.formations, 'player'),
          };
          logs.push(I18n.t('combatSys.telegraphStart', {
            enemy: I18n.enemyName(enemy.id, enemy.name),
            skill: skill.name ?? skill.id,
          }));
          this._fx({
            kind: 'status',
            target: 'enemy',
            enemyIdx: gs.combat.enemies.indexOf(enemy),
            statusId: 'telegraph',
          });
          return logs;
        }
        logs.push(...this._executeEnemySpecialSkill(enemy, skill));
        return logs;
      }
    }

    // 무리 패턴(spreadAttacks): 전열(1~2랭크) 동료가 있으면 다중 타격을 분산한다 —
    // 전열이 무너져 혼자 남으면 전 타격이 집중되므로 전열 유지가 카운터가 된다
    const rounds = enemy.attacksPerRound ?? 1;
    const spreadTargets = enemy.spreadAttacks && rounds >= 2 ? this._frontlineCompanionIds() : [];
    for (let i = 0; i < rounds; i++) {
      if (spreadTargets.length > 0 && i % 2 === 1) {
        this._enemyAttackCompanion(
          enemy,
          spreadTargets[Math.floor((i - 1) / 2) % spreadTargets.length],
          { hitCount: 1 },
        );
      } else {
        logs.push(this._enemyAttack(enemy));
      }
      if (this._isPlayerDefeated()) break;
    }
    return logs;
  },

  // 적의 강제 이동(넉백/끌기) — 아군 랭크 기준(1=최전방), 양수는 후열로 밀고 음수는 전열로 끈다.
  // 4랭크 벽에 막힌 밀치기는 이동 대신 충돌 고정 피해. 인접 아군이 막은 끌기는 무산된다.
  _forceMoveAlly(combatantId, distance, _enemy) {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat?.formations || !Number.isFinite(distance) || distance === 0) return false;
    const rank = getRank(combat.formations, combatantId);
    if (rank === null) return false;
    const destination = Math.max(1, Math.min(4, rank + distance));
    const label = this._rankedCombatantLabel(combat.combatants?.[combatantId]) ?? combatantId;

    if (destination === rank || !moveCombatant(combat.formations, combatantId, destination)) {
      const wallDmg = BALANCE.combat.position.knockbackWallDamage ?? 0;
      if (distance > 0 && wallDmg > 0) {
        this._dealDamageToAlly({
          npcId: combatantId === 'player' ? null : combatantId,
          rawDamage: wallDmg,
          canBeDodged: false,
        });
        combat.log.push(I18n.t('combatSys.knockbackWall', { target: label, dmg: wallDmg }));
      }
      return false;
    }
    combat.log.push(I18n.t(distance > 0 ? 'combatSys.knockback' : 'combatSys.pulledIn', { target: label }));
    this._fx({ kind: 'rankSwap', targetId: combatantId });
    return true;
  },

  _frontlineCompanionIds() {
    const combat = GameState.combat;
    return Object.values(combat?.combatants ?? {})
      .filter(c => c.side === 'ally' && c.sourceType === 'companion' && c.dead !== true && (c.hp ?? 0) > 0)
      .filter(c => {
        const rank = getRank(combat.formations, c.id);
        return rank !== null && rank <= 2;
      })
      .map(c => c.sourceId ?? c.id);
  },

  _resolveTelegraphedSkill(enemy) {
    const gs = GameState;
    const logs = [];
    const tg = enemy._telegraph;
    const skill = (enemy.specialSkills ?? []).find(s => s.id === tg?.skillId);
    if (!skill) {
      enemy._telegraph = null;
      return logs;
    }
    if (tg.remaining > 1) {
      tg.remaining -= 1;
      logs.push(I18n.t('combatSys.telegraphHold', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        skill: skill.name ?? skill.id,
      }));
      return logs;
    }
    enemy._telegraph = null;
    if (!enemy._skillCooldowns) enemy._skillCooldowns = {};
    const cfg = skill.telegraph ?? {};

    // 예고 시점 위치에서 벗어난 대상은 회피 기회를 얻는다 — 이동이 유효한 카운터
    const currentRank = getRank(gs.combat.formations, 'player');
    if (cfg.moveEvadeChance
        && tg.targetRank !== null
        && currentRank !== tg.targetRank
        && Math.random() < cfg.moveEvadeChance) {
      enemy._skillCooldowns[skill.id] = skill.cooldown;
      logs.push(I18n.t('combatSys.telegraphEvaded', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        skill: skill.name ?? skill.id,
      }));
      this._fx({ kind: 'enemyAttack', enemyIdx: gs.combat.enemies.indexOf(enemy), miss: true });
      return logs;
    }

    logs.push(...this._executeEnemySpecialSkill(enemy, skill, {
      blockNegatesStun: cfg.blockNegatesStun === true,
    }));
    return logs;
  },

  _executeEnemySpecialSkill(enemy, skill, counters = {}) {
    const gs = GameState;
    const logs = [];
    const [dMin, dMax] = skill.damage;
    let dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));

    // 방어구 효과: 피해 감소 + 방어술 스킬 보너스
    const armor         = StatSystem.getArmorEffects();
    const defSkillBonus = SkillSystem.getBonus('defense', 'damageReduction');
    const totalReduct   = Math.min(BALANCE.armor.specialDmgReductCap, armor.damageReduction + defSkillBonus);
    if (totalReduct > 0) {
      dmg = Math.max(1, Math.floor(dmg * (1 - totalReduct)));
    }
    // critReduction: 스킬의 stunChance도 비례 감소
    const effectiveStunChance = skill.stunChance
      ? skill.stunChance * (1 - armor.critReduction)
      : 0;

    const struck = this._dealDamageToAlly({ rawDamage: dmg });
    if (!enemy._skillCooldowns) enemy._skillCooldowns = {};
    enemy._skillCooldowns[skill.id] = skill.cooldown;
    if (struck.dodged) {
      logs.push(`${I18n.enemyName(enemy.id, enemy.name)}의 ${skill.name ?? '스킬'}을 회피했다!`);
      return logs;
    }
    dmg = struck.damage;
    gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
    EventBus.emit('playerHit', { damage: dmg });
    this._fx({
      kind:     'enemyAttack',
      enemyIdx: gs.combat.enemies.indexOf(enemy),
      fx:       'skill',
      dmg,
      crit:     true,
    });
    DiseaseSystem.checkCombatInjury(dmg, gs);
    BodySystem.onCombatHit(dmg, enemy);
    // 예고를 블록으로 받아냈다면 기절은 통하지 않는다
    const stunNegated = counters.blockNegatesStun === true && struck.blocked === true;
    if (effectiveStunChance > 0 && !stunNegated && Math.random() < effectiveStunChance) {
      if (!gs.combat.playerStatus.some(s => s.id === 'stun')) {
        gs.combat.playerStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: 1, effect: {} });
      }
      logs.push(I18n.t('combatSys.enemySkillStun', { skill: skill.name, enemy: I18n.enemyName(enemy.id, enemy.name), dmg, hp: gs.player.hp.current }));
    } else {
      if (stunNegated) {
        logs.push(I18n.t('combatSys.telegraphBlocked', { skill: skill.name ?? skill.id }));
      }
      logs.push(I18n.t('combatSys.enemySkill', { skill: skill.name, enemy: I18n.enemyName(enemy.id, enemy.name), dmg, hp: gs.player.hp.current }));
    }
    logs.push(...this._applyEnemySkillEffect(enemy, skill, dmg));
    return logs;
  },

  // ── 타이밍 압박 트리거 발동 ─────────────────────────────
  _resolveTimedThreat(enemy, committedAction = null) {
    const gs = GameState;
    const action = committedAction?.category === 'timed_threat'
      ? committedAction
      : commitTimedThreatAction({
          enemy,
          candidates: this._getEligibleTargets(gs.combat, gs),
        }).committedAction;
    if (!action || action.state !== 'ready') return;

    const result = this._executeEnemyCommittedAction(enemy, action);
    if (action.actionId === 'self_destruct') {
      const damage = result?.damageResults?.find(entry => entry.targetId === 'player')?.amount
        ?? result?.damageResults?.[0]?.amount
        ?? 0;
      enemy.currentHp = 0;
      gs.combat.log.push(I18n.t('combatSys.bloaterExplode', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        dmg: damage,
      }));
      this._fx({
        kind: 'explode',
        enemyIdx: gs.combat.enemies.indexOf(enemy),
        dmg: damage,
      });
    }
    return result;

  },

  _rankCombatantForEnemy(enemy) {
    const combat = GameState.combat;
    if (!combat?.combatants || !enemy) return null;
    const index = combat.enemies?.indexOf(enemy);
    if (index == null || index < 0) return null;
    return combat.combatants[`enemy:${index}`] ?? null;
  },

  // 아군 피해 단일 초크 포인트 — 적의 모든 공격 경로가 여기를 지나야
  // 회피/블록/취약 토큰과 죽음의 문턱이 진영과 무관하게 일관 동작한다.
  // npcId 없으면 플레이어 대상. 동료는 사망 이벤트 유지를 위해 damageCompanion을 경유한다.
  _dealDamageToAlly({ npcId = null, rawDamage, canBeDodged = true }) {
    const gs = GameState;
    const combat = gs.combat;
    const combatantId = npcId ?? 'player';
    const combatant = combat?.combatants?.[combatantId] ?? null;
    let damage = Math.max(0, Math.floor(rawDamage ?? 0));

    if (combatant && canBeDodged && (combatant.tokens?.dodge ?? 0) > 0) {
      consumeToken(combatant, 'dodge', 1);
      this._pushCombatLog(`${this._rankedCombatantLabel(combatant)}이(가) 공격을 회피했다!`);
      return { dodged: true, damage: 0, dead: false, blocked: false };
    }
    if (combatant) damage = modifyIncomingDamage(damage, combatant);

    if (!npcId) {
      if (combatant) {
        const result = applyDamage(combatant, damage, Math.random);
        gs.player.hp.current = Math.max(0, combatant.hp);
        if (result.deathsDoorEntered) {
          this._pushCombatLog('죽음의 문턱! 다음 일격을 버티지 못하면 쓰러진다.');
          this._fx({ kind: 'status', target: 'player', statusId: 'deaths_door' });
          this._applyStressWithFeedback(combatant, BALANCE.combat.stress.deathsDoorStress);
        } else if (result.deathResistCheck) {
          this._pushCombatLog(result.deathResistSuccess
            ? '죽음의 문턱에서 가까스로 버텨냈다!'
            : '더 이상 버틸 수 없었다…');
        } else if (result.damage >= BALANCE.combat.stress.heavyHitThreshold) {
          this._applyStressWithFeedback(combatant, BALANCE.combat.stress.heavyHitStress);
        }
        return { dodged: false, damage: result.damage, dead: result.dead, blocked: result.blocked === true };
      }
      gs.player.hp.current = Math.max(0, gs.player.hp.current - damage);
      return { dodged: false, damage, dead: gs.player.hp.current <= 0, blocked: false };
    }

    // 동료: block 토큰만 수동 적용 후 damageCompanion 경유(NPC 사망 처리 보존)
    if (combatant && (combatant.tokens?.block ?? 0) > 0) {
      consumeToken(combatant, 'block', 1);
      damage = Math.ceil(damage * BALANCE.combat.tokens.blockDamageMult);
    }
    SystemRegistry.get('NPCSystem')?.damageCompanion?.(npcId, damage);
    if (combatant) {
      const state = gs.npcs?.states?.[npcId];
      combatant.hp = Math.max(0, state?.hp ?? combatant.hp ?? 0);
      combatant.dead = combatant.hp <= 0;
      if (!combatant.dead && damage >= BALANCE.combat.stress.heavyHitThreshold) {
        this._applyStressWithFeedback(combatant, BALANCE.combat.stress.heavyHitStress);
      }
      // 동료가 쓰러지는 것을 목격한 나머지 아군의 동요
      if (combatant.dead) {
        for (const ally of Object.values(combat?.combatants ?? {})) {
          if (ally.side !== 'ally' || ally.dead === true || ally.id === combatant.id) continue;
          this._applyStressWithFeedback(ally, BALANCE.combat.stress.allyDownStress);
        }
      }
    }
    return { dodged: false, damage, dead: combatant?.dead === true };
  },

  _enemyAttack(enemy) {
    const gs = GameState;
    const [dMin, dMax] = enemy.attack.damage;
    let   damage = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const hit    = Math.random() < this._getEnemyAccuracyAgainstPlayer(enemy.attack.accuracy);

    if (hit) {
      // 적 자신의 토큰(hesitation/strength 등) — 랭크 combatant에 기록된 것을 소비
      damage = modifyOutgoingDamage(damage, this._rankCombatantForEnemy(enemy));

      // 방어구 효과 + 방어술 스킬 감소
      const armor         = StatSystem.getArmorEffects();
      const defSkillBonus = SkillSystem.getBonus('defense', 'damageReduction');
      const totalReduct   = Math.min(BALANCE.armor.damageReductionCap, armor.damageReduction + defSkillBonus);
      if (totalReduct > 0) {
        damage = Math.max(1, Math.floor(damage * (1 - totalReduct)));
      }

      // 방어(Guard) 중: 피해 감소
      if (gs.combat.playerGuard?.active) {
        damage = Math.max(1, Math.floor(damage * (1 - gs.combat.playerGuard.damageReduce)));
      }

      // 간호사 동반자: 피해 감소 + 도발
      const npcSysRef = SystemRegistry.get('NPCSystem');
      const nurseActive = (gs.companions ?? []).includes('npc_nurse');
      if (nurseActive) {
        const nurseDef = npcSysRef?.getNpcDef?.('npc_nurse');
        const dmgReduce = nurseDef?.companion?.combatDmgReduce ?? 0;
        if (dmgReduce > 0) {
          damage = Math.max(1, Math.floor(damage * (1 - dmgReduce)));
        }
        const tauntChance = nurseDef?.companion?.tauntChance ?? 0;
        if (tauntChance > 0 && Math.random() < tauntChance) {
          npcSysRef.damageCompanion('npc_nurse', damage);
          this._fx({
            kind: 'enemyAttackCompanion',
            enemyIdx: gs.combat.enemies.indexOf(enemy),
            npcId: 'npc_nurse',
            fx: this._monsterImpactFx(enemy),
            dmg: damage,
          });
          const npcName = I18n.itemName('npc_nurse', GameData?.items?.npc_nurse?.name);
          return I18n.t('npc.hitInstead', { name: npcName, dmg: damage });
        }
      }

      // 도주 실패 시 1.5배 피해 (등을 보인 페널티)
      if (gs.combat._fleeFailed) {
        damage = Math.floor(damage * (BALANCE.combat.fleeFailedDamageMult ?? 1.5));
      }

      // 20% chance to target a companion instead of the player
      const companions = (gs.companions ?? []).filter(id => (gs.npcs?.states?.[id]?.hp ?? 0) > 0);
      if (companions.length > 0 && Math.random() < (BALANCE.combat.companionTargetChance ?? 0.20)) {
        const targetNpcId = companions[Math.floor(Math.random() * companions.length)];
        const redirect = this._dealDamageToAlly({ npcId: targetNpcId, rawDamage: damage });
        if (redirect.dodged) {
          return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
        }
        this._fx({
          kind: 'enemyAttackCompanion',
          enemyIdx: gs.combat.enemies.indexOf(enemy),
          npcId: targetNpcId,
          fx: this._monsterImpactFx(enemy),
          dmg: redirect.damage,
        });
        const npcName = I18n.itemName(targetNpcId, GameData?.items?.[targetNpcId]?.name);
        return I18n.t('npc.hitInstead', { name: npcName, dmg: redirect.damage });
      }

      const struck = this._dealDamageToAlly({ rawDamage: damage });
      if (struck.dodged) {
        this._fx({
          kind:     'enemyAttack',
          enemyIdx: gs.combat.enemies.indexOf(enemy),
          fx:       this._monsterImpactFx(enemy),
          miss:     true,
        });
        return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
      }
      damage = struck.damage;
      gs.combat.lastHit    = { target: 'player', damage, isCrit: false };
      EventBus.emit('playerHit', { damage });
      this._fx({
        kind:     'enemyAttack',
        enemyIdx: gs.combat.enemies.indexOf(enemy),
        fx:       this._monsterImpactFx(enemy),
        dmg:      damage,
      });

      // 전투 부상 체크 (출혈, 열상, 골절, 뇌진탕)
      DiseaseSystem.checkCombatInjury(damage, gs);
      // 신체 부위별 부상 판정
      BodySystem.onCombatHit(damage, enemy);

      // 방어술 XP
      SkillSystem.gainXp('defense', 1);

      // 방어술 마스터리: 15% 확률 반격
      if (SkillSystem.hasMastery('defense') && Math.random() < (BALANCE.combat.masteryCounterChance ?? 0.15)) {
        enemy.currentHp = Math.max(0, enemy.currentHp - (BALANCE.combat.masteryCounterDmg ?? 5));
        gs.combat.log.push(I18n.t('combatSys.defMastery', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      }

      if (enemy.onHitEffect) {
        if (enemy.onHitEffect.infection) gs.modStat('infection', enemy.onHitEffect.infection);
        if (enemy.onHitEffect.radiation) gs.modStat('radiation', enemy.onHitEffect.radiation);
      }
      if (enemy.statusInflict) {
        const inflict = { ...enemy.statusInflict, effect: { ...enemy.statusInflict.effect } };
        // 방치 비용: 축적된 만큼 상태이상 피해가 커진다 (zombie_acid 등)
        if (enemy._inflictEscalation && Number.isFinite(inflict.effect.hpLossPerRound)) {
          inflict.effect.hpLossPerRound += enemy._inflictEscalation;
        }
        const already = gs.combat.playerStatus.find(s => s.id === inflict.id);
        if (already) {
          already.duration = Math.max(already.duration, inflict.duration);
          if (Number.isFinite(inflict.effect.hpLossPerRound)) {
            already.effect.hpLossPerRound = Math.max(
              already.effect.hpLossPerRound ?? 0,
              inflict.effect.hpLossPerRound,
            );
          }
        } else {
          gs.combat.playerStatus.push(inflict);
          this._fx({ kind: 'status', target: 'player', statusId: inflict.id });
        }
      }
      if (enemy.infectionChance && Math.random() < enemy.infectionChance) {
        gs.modStat('infection', 10);
        return I18n.t('combatSys.enemyAtkInfect', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: damage, hp: gs.player.hp.current });
      }
      return I18n.t('combatSys.enemyAtk', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: damage, hp: gs.player.hp.current });
    }
    this._fx({
      kind:     'enemyAttack',
      enemyIdx: gs.combat.enemies.indexOf(enemy),
      fx:       this._monsterImpactFx(enemy),
      miss:     true,
    });
    return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
  },

};
