import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../js/data/combatSkills.js';
import { COMPANION_TACTICS } from '../js/data/companionTactics.js';
import ENEMIES from '../js/data/enemies.js';
import CombatSystem from '../js/systems/CombatSystem.js';
import GameState from '../js/core/GameState.js';
import {
  advanceEnemyAction,
  commitEnemyAction,
  commitTimedThreatAction,
} from '../js/systems/combat/EnemyActionPlanner.js';
import { executeEnemyAction } from '../js/systems/combat/EnemyActionExecutor.js';
import {
  executeSkillCommand,
  validateSkillCommand,
} from '../js/systems/combat/CombatSkillSystem.js';
import { planCompanionTurn } from '../js/systems/combat/CompanionTactics.js';
import {
  getRank,
  moveCombatant,
  validateSkillPosition,
} from '../js/systems/combat/FormationSystem.js';
import {
  addStress,
  addToken,
  applyDamage,
  healCombatant,
} from '../js/systems/combat/CombatStatusSystem.js';
import {
  resolveHitRoll,
  weaponAffinityMult,
} from '../js/systems/combat/CombatResolution.js';

const DEFAULT_RUNS = 500;
const DEFAULT_SEED = 20260727;
const TURNS_PER_RUN = 3;
const NON_STACKING_SUPPORT_IDS = new Set([
  'block',
  'focus',
  'marked',
  'vulnerable',
  'rooted',
]);
const COMPANION_MOTION_KEYS = new Set([
  'melee',
  'ranged',
  'guard',
  'support',
  'move',
]);
const ENEMY_MOTION_KEYS = new Set([
  'basic_attack',
  'startled_lunge',
  'runner_rush',
  'slam',
  'aimed_shot',
  'acid_lash',
  'self_destruct',
  'summon_horde',
  'charge_strike',
]);
const REPRESENTATIVE_COMBOS = new Set([
  'npc_nurse/zombie_acid',
  'npc_soldier_deserter/raider_elite',
  'npc_child/rabid_dog',
  'npc_yeongcheol/zombie_charger',
  'npc_mechanic/zombie_bloater',
  'npc_dog/zombie_horde',
]);
const METRIC_LABELS = {
  invalidSkillSelections: '무효 기술 선택',
  invalidTargetSelections: '무효 대상 선택',
  invalidPositionSelections: '무효 위치 선택',
  duplicateSupportWaste: '중복 지원기 낭비',
  nonHealerHealing: '치료 미보유 동료의 치유',
  intentActionIdMismatches: '의도/실행 행동 ID 불일치',
  intentTargetMismatches: '의도/실행 대상 불일치',
  companionMultiHitLoss: '동료 대상 연속공격 타격 소실',
  companionStatusLoss: '동료 대상 상태이상 소실',
  declaredButUnexecutedCounters: '선언됐지만 실행되지 않는 카운터',
  invalidMotionKeys: '유효하지 않은 실행 motionKey',
};

function parseArgs(argv) {
  const options = {
    runs: DEFAULT_RUNS,
    seed: DEFAULT_SEED,
    out: 'docs/analysis/COMPANION_MONSTER_PATTERN_QA.md',
  };

  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (!['--runs', '--seed', '--out'].includes(flag)) {
      throw new Error(`지원하지 않는 인자: ${flag}`);
    }
    const value = argv[++index];
    if (value === undefined) throw new Error(`${flag} 값이 필요합니다.`);
    if (flag === '--out') {
      options.out = value;
      continue;
    }
    const number = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(number) || number <= 0) {
      throw new Error(`${flag}는 1 이상의 정수여야 합니다: ${value}`);
    }
    options[flag.slice(2)] = number;
  }

  return options;
}

function emptyMetrics() {
  return Object.fromEntries(
    Object.keys(METRIC_LABELS).map(metric => [metric, 0]),
  );
}

function addMetrics(target, source) {
  for (const metric of Object.keys(METRIC_LABELS)) {
    target[metric] += source[metric] ?? 0;
  }
}

function totalViolations(metrics) {
  return Object.keys(METRIC_LABELS)
    .reduce((total, metric) => total + (metrics[metric] ?? 0), 0);
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomFor(seed, ...parts) {
  return mulberry32((seed ^ fnv1a(parts.join('/'))) >>> 0);
}

function rollRange(range, random) {
  const [minimum, maximum] = Array.isArray(range) ? range : [0, 0];
  const low = Number.isFinite(minimum) ? minimum : 0;
  const high = Number.isFinite(maximum) ? maximum : low;
  return low + Math.floor(random() * (high - low + 1));
}

function cloneStatus(status) {
  return {
    ...status,
    effect: { ...(status?.effect ?? {}) },
  };
}

function isAlive(combatant) {
  return combatant?.dead !== true && (combatant?.hp ?? 0) > 0;
}

function createRunState(companionId, enemyId, runIndex) {
  const hasHealingSkill = COMPANION_COMBAT_LOADOUTS[companionId]
    .map(skillId => COMBAT_SKILLS[skillId])
    .some(skill => skill.effects.some(effect => effect.type === 'heal'));
  const playerStatuses = runIndex % 5 === 0
    ? [{ id: 'bleed', duration: 2, effect: { hpLossPerRound: 2 } }]
    : [];
  const combatants = {
    player: {
      id: 'player',
      side: 'ally',
      sourceType: 'player',
      hp: 1000,
      maxHp: 1000,
      stress: 0,
      dodge: 0,
      tokens: {},
      statusEffects: playerStatuses,
      dead: false,
    },
    [companionId]: {
      id: companionId,
      side: 'ally',
      sourceType: 'companion',
      sourceId: companionId,
      hp: 1000,
      maxHp: 1000,
      stress: 0,
      dodge: 0,
      tokens: {},
      statusEffects: [],
      dead: false,
      skillIds: [...COMPANION_COMBAT_LOADOUTS[companionId]],
    },
    'enemy:0': {
      id: 'enemy:0',
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: enemyId,
      hp: 100000,
      maxHp: 100000,
      stress: 0,
      dodge: 0,
      tokens: {},
      statusEffects: [],
      dead: false,
    },
  };

  return {
    companionId,
    enemyId,
    hasHealingSkill,
    combatants,
    formations: {
      ally: [null, null, companionId, 'player'],
      enemy: ['enemy:0', null, null, null],
    },
    skillsById: Object.fromEntries(
      COMPANION_COMBAT_LOADOUTS[companionId]
        .map(skillId => [skillId, COMBAT_SKILLS[skillId]]),
    ),
    enemyCooldowns: {},
  };
}

function stanceForRole(role, preferredStance) {
  if (role === 'damage') return 'attack';
  if (role === 'heal') return 'heal';
  if (role === 'guard') return 'hold';
  if (['control', 'support', 'food', 'ration'].includes(role)) return 'support';
  return preferredStance;
}

function configureTacticalSituation(state, desiredSkill, turnIndex) {
  const player = state.combatants.player;
  const companion = state.combatants[state.companionId];
  player.hp = Math.max(player.hp, 800);
  companion.hp = Math.max(companion.hp, 800);
  player.stress = 0;
  companion.stress = 0;

  if (['heal', 'guard'].includes(desiredSkill?.tacticalRole)) {
    const wounded = turnIndex % 2 === 0 ? player : companion;
    wounded.hp = 500;
  }
  if (['support', 'food', 'ration'].includes(desiredSkill?.tacticalRole)) {
    player.stress = 8;
  }
}

function addOrRefreshStatus(target, status) {
  target.statusEffects ??= [];
  const existing = target.statusEffects.find(entry => entry.id === status.id);
  if (existing) {
    existing.duration = Math.max(existing.duration ?? 0, status.duration ?? 1);
    existing.effect = { ...(existing.effect ?? {}), ...(status.effect ?? {}) };
  } else {
    target.statusEffects.push(cloneStatus(status));
  }
}

function commandContext(state, events) {
  return {
    activeCombatantId: state.companionId,
    combatants: state.combatants,
    skillsById: state.skillsById,
    validatePosition: (actorId, targetId, skill) => (
      validateSkillPosition(state.formations, actorId, targetId, skill)
    ),
    getStamina: () => Number.MAX_SAFE_INTEGER,
    getDurability: () => Number.MAX_SAFE_INTEGER,
    consumeCosts: () => ({ ok: true }),
    resolveHit: (actor, target, skill, random) => {
      if (actor.side === target.side) {
        return { hit: true, dodged: false, crit: false, skill };
      }
      return {
        ...resolveHitRoll({
          attacker: actor,
          defender: target,
          accuracy: skill.accuracy,
          random,
        }),
        crit: false,
        skill,
      };
    },
    applyEffect: (effect, actor, target, random) => {
      events.push({
        type: 'companionEffect',
        effectType: effect?.type ?? null,
        skillId: events.skillId,
        targetId: target.id,
      });
      if (effect?.type === 'damage') {
        applyDamage(target, rollRange(effect.value, random), random);
      } else if (effect?.type === 'heal') {
        healCombatant(target, rollRange(effect.value, random));
        const removable = new Set(effect.removeStatus ?? []);
        target.statusEffects = target.statusEffects
          .filter(status => !removable.has(status.id));
      } else if (effect?.type === 'token') {
        addToken(target, effect.token, effect.stacks ?? 1);
      } else if (effect?.type === 'status') {
        const status = effect.status;
        if (status?.chance == null || random() < status.chance) {
          addOrRefreshStatus(target, status);
        }
      } else if (effect?.type === 'move') {
        const rank = getRank(state.formations, target.id);
        const distance = effect.distance === 'auto' ? 1 : (effect.distance ?? 0);
        const destination = Math.max(1, Math.min(4, (rank ?? 1) + distance));
        if (destination !== rank
            && !moveCombatant(state.formations, target.id, destination)) {
          return { ok: false, reason: 'invalid_position' };
        }
      } else if (effect?.type === 'stress') {
        addStress(target, effect.value ?? 0, random);
      } else if (effect?.type === 'guard') {
        addToken(target, 'block', 1);
      } else if (effect?.type !== 'flee') {
        return { ok: false, reason: 'invalid_effect' };
      }
      return { ok: true };
    },
  };
}

function repeatedSupportEffectIds(skill) {
  const ids = [];
  for (const effect of skill?.effects ?? []) {
    if (effect.type === 'guard') ids.push('block');
    if (effect.type === 'token' && NON_STACKING_SUPPORT_IDS.has(effect.token)) {
      ids.push(effect.token);
    }
    if (effect.type === 'status'
        && NON_STACKING_SUPPORT_IDS.has(effect.status?.id)) {
      ids.push(effect.status.id);
    }
  }
  return ids;
}

function supportWouldBeWasted(skill, target) {
  if (['damage', 'heal'].includes(skill?.tacticalRole)) return false;
  return repeatedSupportEffectIds(skill).some(effectId => (
    (target?.tokens?.[effectId] ?? 0) > 0
    || target?.statusEffects?.some(status => status.id === effectId)
  ));
}

function categorizeCommandFailure(metrics, reason) {
  metrics.invalidSkillSelections++;
  if (['invalid_target', 'invalid_target_side'].includes(reason)) {
    metrics.invalidTargetSelections++;
  }
  if ([
    'invalid_actor',
    'invalid_origin_rank',
    'invalid_target_rank',
    'invalid_position',
  ].includes(reason)) {
    metrics.invalidPositionSelections++;
  }
}

function enemyCandidates(state) {
  return ['player', state.companionId]
    .map(id => state.combatants[id])
    .filter(isAlive)
    .map(combatant => ({
      id: combatant.id,
      side: 'ally',
      hp: combatant.hp,
      maxHp: combatant.maxHp,
      rank: getRank(state.formations, combatant.id),
      isHealer: combatant.id === state.companionId
        ? state.hasHealingSkill
        : false,
      isDefended: (combatant.tokens?.block ?? 0) > 0
        || (combatant.tokens?.dodge ?? 0) > 0,
      isExposed: (combatant.tokens?.vulnerable ?? 0) > 0
        || (combatant.tokens?.marked ?? 0) > 0,
      statusEffects: combatant.statusEffects ?? [],
    }));
}

function enemyActionDefinition(enemy, action) {
  if (action.category === 'timed_threat') return enemy.timedThreat;
  if (action.category === 'special') {
    return enemy.specialSkills.find(skill => (
      (skill.actionId ?? skill.id) === action.actionId
    ));
  }
  return enemy.patternProfile.defaultAction;
}

function damageRangeOf(enemy, definition) {
  const effect = definition?.effects?.find(candidate => candidate.type === 'damage');
  return effect?.value ?? definition?.damage ?? enemy.attack?.damage ?? [0, 0];
}

function forcedMoveOf(definition) {
  return definition?.effects?.find(effect => (
    effect.type === 'move' || effect.type === 'forcedMove'
  ))?.distance ?? definition?.effect?.forcedMove ?? null;
}

function expectedStatusIds(enemy, definition, category) {
  const ids = [];
  const includeDefaults = category !== 'timed_threat';
  if (includeDefaults && enemy.statusInflict?.id) ids.push(enemy.statusInflict.id);
  if (includeDefaults && (enemy.infectionChance ?? 0) > 0) ids.push('infection');
  if (includeDefaults) {
    for (const [effectId, value] of Object.entries(enemy.onHitEffect ?? {})) {
      if (Number.isFinite(value) && value !== 0) ids.push(`${effectId}_exposure`);
    }
  }
  if (definition?.statusInflict?.id) ids.push(definition.statusInflict.id);
  if (definition?.effect?.status?.id) ids.push(definition.effect.status.id);
  if (definition?.effect?.dot || definition?.effect?.bleed) {
    ids.push(definition.effect.bleed
      ? 'bleed'
      : `${definition.id ?? definition.actionId}_dot`);
  }
  if (definition?.effect?.poison) ids.push('poison');
  if (definition?.effect?.stun) ids.push('stun');
  if ((definition?.stunChance ?? 0) > 0) ids.push('stun');
  for (const effect of definition?.effects ?? []) {
    if (effect.type === 'status' && effect.id) ids.push(effect.id);
  }
  return [...new Set(ids)];
}

function enemyExecutionServices(state, action, events) {
  return {
    damageTarget: (targetId, amount, metadata) => {
      const target = state.combatants[targetId];
      events.push({ type: 'damage', targetId, amount, metadata });
      if (!target) return { missed: true, damage: 0 };
      return applyDamage(target, amount, () => 0);
    },
    addStatus: (targetId, status) => {
      events.push({ type: 'status', targetId, status: cloneStatus(status) });
      const target = state.combatants[targetId];
      if (target) addOrRefreshStatus(target, status);
      return !!target;
    },
    moveTarget: (targetId, distance) => {
      events.push({ type: 'move', targetId, distance });
      const rank = getRank(state.formations, targetId);
      if (rank === null) return false;
      const destination = Math.max(1, Math.min(4, rank + distance));
      return destination === rank
        || moveCombatant(state.formations, targetId, destination);
    },
    summonEnemy: (enemyId, count, row) => {
      events.push({ type: 'summon', enemyId, count, row });
      return count;
    },
    addNoise: value => {
      events.push({ type: 'noise', value });
    },
    emitFx: payload => {
      events.push({ type: 'fx', ...payload });
    },
    addLog: message => {
      events.push({ type: 'log', message });
    },
  };
}

function expectedAttemptsByTarget(enemy, action, definition) {
  const damageRange = damageRangeOf(enemy, definition);
  if (!damageRange.some(value => Number.isFinite(value) && value > 0)) {
    return new Map();
  }
  const targets = action.targetIds;
  const result = new Map(targets.map(targetId => [targetId, 0]));
  if (enemy.spreadAttacks === true && targets.length > 1) {
    for (let hitIndex = 0; hitIndex < action.hitCount; hitIndex++) {
      const targetId = targets[hitIndex % targets.length];
      result.set(targetId, (result.get(targetId) ?? 0) + 1);
    }
    return result;
  }
  for (const targetId of targets) result.set(targetId, action.hitCount);
  return result;
}

function inspectEnemyExecution({
  state,
  enemy,
  intent,
  action,
  definition,
  events,
  result,
  metrics,
}) {
  const plannedTargets = new Set(intent.targetIds);
  const targetedEvents = events.filter(event => (
    ['damage', 'status', 'move', 'fx'].includes(event.type) && event.targetId
  ));
  const targetEffectsExist = damageRangeOf(enemy, definition)
    .some(value => Number.isFinite(value) && value > 0)
    || expectedStatusIds(enemy, definition, action.category).length > 0
    || Number.isFinite(forcedMoveOf(definition));

  if (
    targetedEvents.some(event => !plannedTargets.has(event.targetId))
    || (targetEffectsExist
      && intent.targetIds.some(targetId => (
        !targetedEvents.some(event => event.targetId === targetId)
      )))
  ) {
    metrics.intentTargetMismatches++;
  }

  const actionEvents = events.filter(event => (
    event.type === 'damage' || event.type === 'fx'
  ));
  if (
    action.actionId !== intent.actionId
    || actionEvents.some(event => (
      (event.metadata?.actionId ?? event.actionId) !== intent.actionId
    ))
    || (targetEffectsExist && result === undefined)
  ) {
    metrics.intentActionIdMismatches++;
  }

  if (
    !ENEMY_MOTION_KEYS.has(action.motionKey)
    || action.motionKey !== definition?.motionKey
    || events.some(event => event.type === 'fx'
      && event.motionKey !== action.motionKey)
  ) {
    metrics.invalidMotionKeys++;
  }

  if (!action.targetIds.every(targetId => isAlive(state.combatants[targetId]))) {
    metrics.invalidTargetSelections++;
  }

  const attempts = expectedAttemptsByTarget(enemy, action, definition);
  const companionId = state.companionId;
  if (attempts.has(companionId)) {
    const observedAttempts = events.filter(event => (
      event.type === 'fx' && event.targetId === companionId
    )).length;
    if (observedAttempts !== attempts.get(companionId)) {
      metrics.companionMultiHitLoss += Math.abs(
        attempts.get(companionId) - observedAttempts,
      );
    }
  }

  const companionWasAffected = events.some(event => (
    event.targetId === companionId
    && ['damage', 'status', 'move'].includes(event.type)
  ));
  if (companionWasAffected) {
    const expectedStatuses = expectedStatusIds(enemy, definition, action.category);
    const observedStatuses = new Set(events
      .filter(event => event.type === 'status' && event.targetId === companionId)
      .map(event => event.status.id));
    metrics.companionStatusLoss += expectedStatuses
      .filter(statusId => !observedStatuses.has(statusId))
      .length;
  }
}

function runCompanionTurn({
  state,
  desiredSkill,
  random,
  metrics,
  distribution,
}) {
  const tactic = COMPANION_TACTICS[state.companionId];
  const stance = stanceForRole(desiredSkill?.tacticalRole, tactic.preferredStance);
  const skills = COMPANION_COMBAT_LOADOUTS[state.companionId]
    .map(skillId => COMBAT_SKILLS[skillId]);
  const events = [];
  const context = commandContext(state, events);
  const plan = planCompanionTurn({
    npcId: state.companionId,
    stance,
    skills,
    allies: [state.combatants.player, state.combatants[state.companionId]],
    enemies: [state.combatants['enemy:0']],
    canUse: (skill, target) => validateSkillCommand(context, {
      actorId: state.companionId,
      skillId: skill.id,
      targetId: target.id,
    }).ok,
  });

  if (!plan) {
    distribution.noPlan++;
    return;
  }

  const skill = state.skillsById[plan.skillId];
  const target = state.combatants[plan.targetId];
  distribution.skills[plan.skillId]++;
  distribution.commands++;

  if (!COMPANION_MOTION_KEYS.has(skill?.motionKey)) {
    metrics.invalidMotionKeys++;
  }
  if (supportWouldBeWasted(skill, target)) {
    metrics.duplicateSupportWaste++;
  }

  const validation = validateSkillCommand(context, {
    actorId: state.companionId,
    skillId: plan.skillId,
    targetId: plan.targetId,
  });
  if (!validation.ok) {
    categorizeCommandFailure(metrics, validation.reason);
    return;
  }

  events.skillId = plan.skillId;
  const result = executeSkillCommand(context, {
    actorId: state.companionId,
    skillId: plan.skillId,
    targetId: plan.targetId,
  }, random);
  if (!result.ok) {
    categorizeCommandFailure(metrics, result.reason);
    return;
  }

  const healingEffects = events.filter(event => (
    event.type === 'companionEffect' && event.effectType === 'heal'
  )).length;
  if (!state.hasHealingSkill && healingEffects > 0) {
    metrics.nonHealerHealing += healingEffects;
  }
}

function runEnemyTurn({
  state,
  enemy,
  random,
  executionRandom,
  runIndex,
  turnIndex,
  metrics,
  distribution,
}) {
  for (const skillId of Object.keys(state.enemyCooldowns)) {
    state.enemyCooldowns[skillId] = Math.max(
      0,
      state.enemyCooldowns[skillId] - 1,
    );
  }
  const candidates = enemyCandidates(state);
  const useTimedThreat = !!enemy.timedThreat
    && (runIndex + turnIndex) % 5 === 0;
  let actionState = useTimedThreat
    ? commitTimedThreatAction({
        enemy: { ...enemy, _chargeRemaining: 0 },
        candidates,
        random,
      })
    : commitEnemyAction({
        enemy,
        candidates,
        cooldowns: state.enemyCooldowns,
        random,
      });
  const intent = {
    actionId: actionState.committedAction.actionId,
    targetIds: [...actionState.committedAction.targetIds],
    motionKey: actionState.committedAction.motionKey,
  };

  while (actionState.committedAction?.state === 'telegraphing') {
    actionState = advanceEnemyAction({ state: actionState });
  }
  const action = actionState.committedAction;
  const definition = enemyActionDefinition(enemy, action);
  distribution[action.actionId] = (distribution[action.actionId] ?? 0) + 1;
  const events = [];
  const result = executeEnemyAction({
    enemy,
    action,
    services: enemyExecutionServices(state, action, events),
    random: executionRandom,
  });

  inspectEnemyExecution({
    state,
    enemy,
    intent,
    action,
    definition,
    events,
    result,
    metrics,
  });

  if (action.category === 'special') {
    state.enemyCooldowns[action.actionId] = definition?.cooldown ?? 0;
  }
}

function setupKillProbe(enemy, killContext) {
  const probeEnemy = structuredClone(enemy);
  probeEnemy.currentHp = 0;
  probeEnemy.maxHp = Math.max(1, probeEnemy.hp?.max ?? 50);
  probeEnemy.lootTable = [];
  probeEnemy.infectionChance = 0;
  delete probeEnemy._killProcessed;
  GameState.player = {
    ...(GameState.player ?? {}),
    hp: { current: 100, max: 100 },
    xp: 0,
    characterId: 'soldier',
    equipped: {},
  };
  GameState.cards = {};
  GameState.flags = {};
  GameState.location = {
    ...(GameState.location ?? {}),
    currentDistrict: 'pattern-simulator',
  };
  GameState.noise = { level: 0 };
  GameState.combat = {
    active: true,
    enemies: [probeEnemy],
    log: [],
    fxQueue: [],
    rewards: [],
    xpGained: 0,
    lastHit: null,
    _lastKillContext: killContext,
  };
  CombatSystem._onEnemyKilled(probeEnemy);
  return {
    hp: GameState.player.hp.current,
    noise: GameState.noise.level,
  };
}

function probeDeclaredCounters() {
  const rows = [];
  const failures = [];
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    for (const [enemyId, enemy] of Object.entries(ENEMIES)) {
      for (const [counter, value] of Object.entries(
        enemy.timedThreat?.counters ?? {},
      )) {
        let ok = false;
        let detail = '';
        if (counter === 'stunDelays') {
          const state = commitTimedThreatAction({
            enemy: {
              ...enemy,
              _chargeRemaining: enemy.timedThreat.chargeTurns,
            },
            candidates: [{ id: 'player', side: 'ally', hp: 100, maxHp: 100 }],
            random: () => 0,
          });
          const delayed = advanceEnemyAction({ state, stunned: true });
          ok = delayed.committedAction.remainingTelegraphTurns
            === state.committedAction.remainingTelegraphTurns;
          detail = `stun ${state.committedAction.remainingTelegraphTurns}→${delayed.committedAction.remainingTelegraphTurns}`;
        } else if (counter === 'weakness' && Array.isArray(value)) {
          const affinityWorks = value.every(weaponType => (
            enemy.weaknesses.includes(weaponType)
            && weaponAffinityMult(weaponType, enemy) > 1
          ));
          const clean = setupKillProbe(enemy, {
            weaponType: value[0],
            isSilent: false,
            isMelee: true,
          });
          const dirty = setupKillProbe(enemy, {
            weaponType: 'unarmed',
            isSilent: false,
            isMelee: true,
          });
          ok = affinityWorks && clean.hp === 100 && dirty.hp < clean.hp;
          detail = `clean HP ${clean.hp}, non-counter HP ${dirty.hp}`;
        } else if (counter === 'quietKill' && value === true) {
          const quiet = setupKillProbe(enemy, {
            weaponType: 'blade',
            isSilent: true,
            isMelee: true,
          });
          const loud = setupKillProbe(enemy, {
            weaponType: 'blade',
            isSilent: false,
            isMelee: true,
          });
          ok = quiet.noise === 0 && loud.noise > quiet.noise;
          detail = `quiet noise ${quiet.noise}, loud noise ${loud.noise}`;
        } else {
          detail = `지원되지 않는 카운터 값 ${JSON.stringify(value)}`;
        }
        rows.push({ enemyId, counter, ok, detail });
        if (!ok) failures.push(`${enemyId}.${counter}`);
      }
    }
  } finally {
    Math.random = originalRandom;
  }
  return { rows, failures };
}

function simulate({ runs, seed }) {
  const companionIds = Object.keys(COMPANION_COMBAT_LOADOUTS);
  const enemyIds = Object.keys(ENEMIES);
  const metrics = emptyMetrics();
  const companionDistributions = Object.fromEntries(companionIds.map(companionId => [
    companionId,
    {
      skills: Object.fromEntries(
        COMPANION_COMBAT_LOADOUTS[companionId].map(skillId => [skillId, 0]),
      ),
      commands: 0,
      noPlan: 0,
    },
  ]));
  const enemyDistributions = Object.fromEntries(
    enemyIds.map(enemyId => [enemyId, {}]),
  );
  const combos = [];

  for (const companionId of companionIds) {
    for (const enemyId of enemyIds) {
      const comboMetrics = emptyMetrics();
      const enemy = ENEMIES[enemyId];
      for (let runIndex = 0; runIndex < runs; runIndex++) {
        const state = createRunState(companionId, enemyId, runIndex);
        for (let turnIndex = 0; turnIndex < TURNS_PER_RUN; turnIndex++) {
          const desiredSkillId = COMPANION_COMBAT_LOADOUTS[companionId][
            (runIndex + turnIndex) % 3
          ];
          const desiredSkill = COMBAT_SKILLS[desiredSkillId];
          configureTacticalSituation(state, desiredSkill, turnIndex);
          const actionRandom = randomFor(
            seed,
            companionId,
            enemyId,
            runIndex,
            turnIndex,
            'action',
          );
          const executionRandom = () => actionRandom() * 0.19;
          runCompanionTurn({
            state,
            desiredSkill,
            random: executionRandom,
            metrics: comboMetrics,
            distribution: companionDistributions[companionId],
          });
          runEnemyTurn({
            state,
            enemy,
            random: actionRandom,
            executionRandom,
            runIndex,
            turnIndex,
            metrics: comboMetrics,
            distribution: enemyDistributions[enemyId],
          });
        }
      }
      addMetrics(metrics, comboMetrics);
      combos.push({
        companionId,
        enemyId,
        representative: REPRESENTATIVE_COMBOS.has(`${companionId}/${enemyId}`),
        metrics: comboMetrics,
      });
    }
  }

  const counters = probeDeclaredCounters();
  metrics.declaredButUnexecutedCounters = counters.failures.length;

  return {
    companionIds,
    enemyIds,
    metrics,
    companionDistributions,
    enemyDistributions,
    combos,
    counters,
  };
}

function markdownCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function percent(value, total) {
  return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%';
}

function renderReport(result, options) {
  const {
    companionIds,
    enemyIds,
    metrics,
    companionDistributions,
    enemyDistributions,
    combos,
    counters,
  } = result;
  const lines = [
    '# 동료·일반 몬스터 패턴 통합 QA',
    '',
    `> 명령: \`node tools/simulate_companion_monster_patterns.mjs --runs ${options.runs} --seed ${options.seed} --out ${markdownCell(options.out)}\``,
    `> 범위: 동료 ${companionIds.length}종 × 일반 몬스터 ${enemyIds.length}종 = ${combos.length}조합, 조합당 ${options.runs}회, 회당 ${TURNS_PER_RUN}개 행동 라운드`,
    `> 결정성: seed \`${options.seed}\`; 같은 데이터·Node 버전·인자로 실행하면 같은 분포를 생성한다.`,
    '',
    '## 판정',
    '',
    `**${totalViolations(metrics) === 0 ? 'PASS' : 'FAIL'}** — 허용 기준은 모든 오류 지표 0이다.`,
    '',
    '| 지표 | 관측 | 허용 | 결과 |',
    '|---|---:|---:|---|',
  ];
  for (const [metric, label] of Object.entries(METRIC_LABELS)) {
    lines.push(`| ${label} | ${metrics[metric]} | 0 | ${metrics[metric] === 0 ? 'PASS' : 'FAIL'} |`);
  }

  lines.push(
    '',
    '## 동료별 실제 기술 사용 분포',
    '',
    '| 동료 | 기술 1 | 기술 2 | 기술 3 | 실행 명령 | 계획 없음 |',
    '|---|---:|---:|---:|---:|---:|',
  );
  for (const companionId of companionIds) {
    const distribution = companionDistributions[companionId];
    const skillCells = COMPANION_COMBAT_LOADOUTS[companionId].map(skillId => {
      const count = distribution.skills[skillId];
      return `\`${skillId}\` ${count} (${percent(count, distribution.commands)})`;
    });
    lines.push(`| \`${companionId}\` | ${skillCells.join(' | ')} | ${distribution.commands} | ${distribution.noPlan} |`);
  }

  lines.push(
    '',
    '## 일반 몬스터 실제 행동 분포',
    '',
    '| 몬스터 | 실행 행동 분포 |',
    '|---|---|',
  );
  for (const enemyId of enemyIds) {
    const cells = Object.entries(enemyDistributions[enemyId])
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([actionId, count]) => `\`${actionId}\` ${count}`)
      .join(', ');
    lines.push(`| \`${enemyId}\` | ${cells} |`);
  }

  lines.push(
    '',
    '## 20×12 조합 오류 매트릭스',
    '',
    '각 셀은 해당 조합의 모든 허용 기준 위반 합계다. `★`는 브라우저 E2E 대표 조합이다.',
    '',
    `| 동료 \\ 몬스터 | ${enemyIds.map(enemyId => `\`${enemyId}\``).join(' | ')} |`,
    `|---|${enemyIds.map(() => '---:').join('|')}|`,
  );
  for (const companionId of companionIds) {
    const cells = enemyIds.map(enemyId => {
      const combo = combos.find(entry => (
        entry.companionId === companionId && entry.enemyId === enemyId
      ));
      return `${combo.representative ? '★ ' : ''}${totalViolations(combo.metrics)}`;
    });
    lines.push(`| \`${companionId}\` | ${cells.join(' | ')} |`);
  }

  lines.push(
    '',
    '## 선언 카운터 실행 프로브',
    '',
    '| 몬스터 | 카운터 | 실제 실행 프로브 | 결과 |',
    '|---|---|---|---|',
  );
  for (const row of counters.rows) {
    lines.push(`| \`${row.enemyId}\` | \`${row.counter}\` | ${markdownCell(row.detail)} | ${row.ok ? 'PASS' : 'FAIL'} |`);
  }

  lines.push(
    '',
    '## 계측 계약',
    '',
    '- 동료 선택은 실제 `COMPANION_TACTICS`와 60개 로드아웃을 `planCompanionTurn()`에 넣고, 선택 결과를 `validateSkillCommand()`와 `executeSkillCommand()`로 실행했다.',
    '- 대상·위치 검증은 실제 `validateSkillPosition()`을 사용하며, 지원 중복은 런타임이 비중첩으로 취급하는 `block`, `focus`, `marked`, `vulnerable`, `rooted` 상태를 실행 직전에 관측했다.',
    '- 적 행동은 실제 데이터에서 `commitEnemyAction()` 또는 `commitTimedThreatAction()`으로 한 번 예약하고, 예고 상태를 `advanceEnemyAction()`으로 진행한 뒤 같은 객체를 `executeEnemyAction()`에 전달했다.',
    '- 타격, 상태이상, 강제 이동, FX의 실제 콜백 인자에서 행동 ID·대상·타격 수·`motionKey`를 비교했다. 결과 숫자는 하드코딩하지 않는다.',
    '- `weakness`, `quietKill`, `stunDelays`는 각각 실제 약점 배율/사망 처리, 소음 처리, committed-action 지연 동작을 행동 프로브로 검증했다.',
  );
  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = simulate(options);
  const report = renderReport(result, options);
  const outputPath = path.resolve(options.out);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, 'utf8');

  const violations = totalViolations(result.metrics);
  console.log(
    `companion-monster-patterns: ${violations === 0 ? 'PASS' : 'FAIL'} `
    + `companions=${result.companionIds.length} enemies=${result.enemyIds.length} `
    + `combinations=${result.combos.length} runs=${options.runs} `
    + `violations=${violations}`,
  );
  console.log(`report=${outputPath}`);
  if (violations > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
});
