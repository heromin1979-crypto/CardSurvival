import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../js/data/combatSkills.js';
import { COMPANION_TACTICS } from '../js/data/companionTactics.js';
import ENEMIES, { instantiateEnemy } from '../js/data/enemies.js';
import GameState from '../js/core/GameState.js';
import SystemRegistry from '../js/core/SystemRegistry.js';
import CombatSystem from '../js/systems/CombatSystem.js';
import NPCSystem from '../js/systems/NPCSystem.js';
import { advanceEnemyAction } from '../js/systems/combat/EnemyActionPlanner.js';
import { weaponAffinityMult } from '../js/systems/combat/CombatResolution.js';

const DEFAULT_RUNS = 500;
const DEFAULT_SEED = 20260727;
const TURNS_PER_RUN = 3;
const HARNESS_HP = 1_000_000;
const MAX_ENEMY_STEPS = 10;

const EXPECTED_COMPANION_IDS = Object.freeze([
  'npc_old_survivor',
  'npc_nurse',
  'npc_soldier_deserter',
  'npc_child',
  'npc_mechanic',
  'npc_student',
  'npc_dog',
  'npc_former_colleague',
  'npc_minjun',
  'npc_sohee',
  'npc_jisu',
  'npc_yeongcheol',
  'npc_daehan',
  'npc_tower_security',
  'npc_tower_merchant',
  'npc_tower_cook',
  'npc_tower_engineer',
  'npc_tower_doctor',
  'npc_sous_chef',
  'npc_kitchen_helper',
]);

const EXPECTED_ENEMY_IDS = Object.freeze([
  'zombie_patient_dormant',
  'zombie_common',
  'zombie_runner',
  'zombie_brute',
  'raider',
  'raider_elite',
  'zombie_horde',
  'rabid_dog',
  'zombie_acid',
  'zombie_bloater',
  'zombie_screamer',
  'zombie_charger',
]);

const EXPECTED_UNIQUE_COMPANION_SKILLS = 60;
const GAMESTATE_SANDBOX_KEYS = Object.freeze([
  'player',
  'stats',
  'noise',
  'companions',
  'npcs',
  'cards',
  'flags',
  'location',
  'combat',
]);
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
  duplicateSupportWaste: '중복 지원 효과 낭비',
  nonHealerHealing: '치료 미보유 동료의 치유',
  intentActionIdMismatches: 'UI 의도/실행 행동 ID 불일치',
  intentTargetMismatches: 'UI 의도/실행 대상 불일치',
  companionMultiHitLoss: '동료 대상 연속 공격 횟수 손실',
  companionStatusLoss: '동료 대상 상태이상 손실',
  declaredButUnexecutedCounters: '선언됐지만 실행되지 않는 카운터',
  invalidMotionKeys: '유효하지 않은 motionKey',
  productionDefaultStanceMismatches: 'production 기본 동료 자세 불일치',
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

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sameMembers(actual, expected) {
  return JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected));
}

function validateRosterContract() {
  const companionIds = Object.keys(COMPANION_COMBAT_LOADOUTS);
  const enemyIds = Object.keys(ENEMIES);
  const skillIds = companionIds.flatMap(
    companionId => COMPANION_COMBAT_LOADOUTS[companionId] ?? [],
  );
  const uniqueSkillIds = new Set(skillIds);
  const failures = [];

  if (
    companionIds.length !== EXPECTED_COMPANION_IDS.length
    || !sameMembers(companionIds, EXPECTED_COMPANION_IDS)
  ) {
    failures.push(
      `동료 roster: expected=${EXPECTED_COMPANION_IDS.length} actual=${companionIds.length}`,
    );
  }
  if (
    enemyIds.length !== EXPECTED_ENEMY_IDS.length
    || !sameMembers(enemyIds, EXPECTED_ENEMY_IDS)
  ) {
    failures.push(
      `일반 적 roster: expected=${EXPECTED_ENEMY_IDS.length} actual=${enemyIds.length}`,
    );
  }
  if (
    skillIds.length !== EXPECTED_UNIQUE_COMPANION_SKILLS
    || uniqueSkillIds.size !== EXPECTED_UNIQUE_COMPANION_SKILLS
  ) {
    failures.push(
      `동료 기술: expected=${EXPECTED_UNIQUE_COMPANION_SKILLS} `
      + `entries=${skillIds.length} unique=${uniqueSkillIds.size}`,
    );
  }
  for (const companionId of companionIds) {
    const loadout = COMPANION_COMBAT_LOADOUTS[companionId];
    if (!Array.isArray(loadout) || loadout.length !== 3) {
      failures.push(`${companionId}: loadout은 정확히 3개여야 함`);
      continue;
    }
    for (const skillId of loadout) {
      if (!COMBAT_SKILLS[skillId]) {
        failures.push(`${companionId}: COMBAT_SKILLS에 없는 ${skillId}`);
      }
    }
  }
  for (const enemyId of enemyIds) {
    if (!ENEMIES[enemyId]?.id || ENEMIES[enemyId].id !== enemyId) {
      failures.push(`${enemyId}: 적 정의 ID 누락 또는 key 불일치`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`roster contract 실패:\n- ${failures.join('\n- ')}`);
  }

  return {
    companionCount: companionIds.length,
    uniqueCompanionSkillCount: uniqueSkillIds.size,
    enemyCount: enemyIds.length,
  };
}

function withGameStateSnapshot(callback) {
  const snapshot = Object.fromEntries(
    GAMESTATE_SANDBOX_KEYS.map(key => [key, GameState[key]]),
  );
  const originalRandom = Math.random;
  const originalNpcSystem = SystemRegistry.get('NPCSystem');
  try {
    SystemRegistry.register('NPCSystem', NPCSystem);
    return callback();
  } finally {
    for (const [key, value] of Object.entries(snapshot)) {
      GameState[key] = value;
    }
    SystemRegistry.register('NPCSystem', originalNpcSystem);
    Math.random = originalRandom;
  }
}

function snapshotAction(action) {
  if (!action) return null;
  return {
    actionId: action.actionId ?? null,
    category: action.category ?? null,
    state: action.state ?? null,
    targetIds: [...(action.targetIds ?? [])],
    remainingTelegraphTurns: action.remainingTelegraphTurns ?? null,
    hitCount: action.hitCount ?? 1,
    motionKey: action.motionKey ?? null,
  };
}

function snapshotIntent(intent) {
  if (!intent) return null;
  return {
    actionId: intent.actionId ?? null,
    category: intent.category ?? null,
    state: intent.state ?? null,
    targetIds: [...(intent.targetIds ?? [])],
    remainingTelegraphTurns: intent.remainingTelegraphTurns ?? null,
    hitCount: intent.hitCount ?? 1,
    motionKey: intent.motionKey ?? null,
  };
}

function freshPlayer() {
  return {
    name: 'Pattern QA',
    characterId: 'soldier',
    hp: { current: HARNESS_HP, max: HARNESS_HP },
    xp: 0,
    isAlive: true,
    deathCause: null,
    traits: [],
    diseases: [],
    skills: {
      unarmed: { xp: 0, level: 0 },
      melee: { xp: 0, level: 0 },
      ranged: { xp: 0, level: 0 },
      defense: { xp: 0, level: 0 },
    },
    equipped: {
      head: null,
      body: null,
      hands: null,
      face: null,
      weapon_main: null,
      weapon_sub: null,
      backpack: null,
      boots: null,
      belt: null,
      accessory: null,
    },
  };
}

function freshStats() {
  return {
    stamina: { current: 100, max: 100, decayPerTP: 0 },
    morale: { current: 100, max: 100, decayPerTP: 0 },
    infection: { current: 0, max: 100, decayPerTP: 0 },
    radiation: { current: 0, max: 100, decayPerTP: 0 },
    fatigue: { current: 0, max: 100, decayPerTP: 0 },
  };
}

function createProductionCombat(companionId, enemyId, random) {
  Math.random = random;
  GameState.player = freshPlayer();
  GameState.stats = freshStats();
  GameState.noise = {
    level: 0,
    decayPerTP: 1,
    influxThreshold: 60,
    influxTriggered: false,
  };
  GameState.companions = [companionId];
  GameState.npcs = {
    states: {
      [companionId]: {
        hp: HARNESS_HP,
        maxHp: HARNESS_HP,
        isCompanion: true,
        name: companionId,
        statusEffects: [],
        skillCooldowns: {},
      },
    },
  };
  GameState.cards = {};
  GameState.flags = {};
  GameState.location = {
    currentDistrict: 'pattern-qa',
    currentNode: 'pattern-qa',
  };
  GameState.combat = null;

  const enemy = instantiateEnemy(ENEMIES[enemyId]);
  enemy.currentHp = HARNESS_HP;
  enemy.maxHp = HARNESS_HP;
  enemy.lootTable = [];
  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 3,
    nodeId: 'pattern-qa',
  });

  const rankedEnemy = GameState.combat.combatants['enemy:0'];
  rankedEnemy.hp = HARNESS_HP;
  rankedEnemy.maxHp = HARNESS_HP;
  rankedEnemy.dead = false;
  return enemy;
}

function stanceForRole(role, fallback) {
  if (role === 'damage') return 'attack';
  if (role === 'heal') return 'heal';
  if (role === 'guard') return 'hold';
  if (['control', 'support', 'food', 'ration'].includes(role)) return 'support';
  return fallback;
}

function configureProductionTacticalSituation(companionId, desiredSkillId) {
  const combat = GameState.combat;
  const desiredSkill = COMBAT_SKILLS[desiredSkillId];
  const player = combat.combatants.player;
  const companion = combat.combatants[companionId];
  const enemy = combat.combatants['enemy:0'];
  const npcState = GameState.npcs.states[companionId];

  combat.formations.ally = [null, null, companionId, 'player'];
  combat.formations.enemy = ['enemy:0', null, null, null];
  player.hp = HARNESS_HP;
  player.maxHp = HARNESS_HP;
  player.stress = 0;
  player.dead = false;
  player.tokens = {};
  player.statusEffects = [];
  companion.hp = HARNESS_HP;
  companion.maxHp = HARNESS_HP;
  companion.stress = 0;
  companion.dead = false;
  companion.tokens = {};
  companion.statusEffects = [];
  enemy.tokens = {};
  enemy.statusEffects = [];
  GameState.player.hp = { current: HARNESS_HP, max: HARNESS_HP };
  npcState.hp = HARNESS_HP;
  npcState.maxHp = HARNESS_HP;
  npcState.statusEffects = [];

  const declaredSkillIds = COMPANION_COMBAT_LOADOUTS[companionId];
  npcState.skillCooldowns = Object.fromEntries(
    [...declaredSkillIds, 'guard', 'reposition']
      .map(skillId => [skillId, skillId === desiredSkillId ? 0 : 2]),
  );

  if (['heal', 'guard'].includes(desiredSkill?.tacticalRole)) {
    player.hp = Math.floor(HARNESS_HP * 0.45);
    GameState.player.hp.current = player.hp;
  }
  if (['support', 'food', 'ration'].includes(desiredSkill?.tacticalRole)) {
    player.stress = 10;
  }

  return desiredSkill;
}

function repeatedSupportEffectIds(skill) {
  const ids = [];
  for (const effect of skill?.effects ?? []) {
    if (effect.type === 'guard') ids.push('block');
    if (effect.type === 'token' && NON_STACKING_SUPPORT_IDS.has(effect.token)) {
      ids.push(effect.token);
    }
    if (
      effect.type === 'status'
      && NON_STACKING_SUPPORT_IDS.has(effect.status?.id ?? effect.id)
    ) {
      ids.push(effect.status?.id ?? effect.id);
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

function allyHpTotal(companionId) {
  const combat = GameState.combat;
  return (combat.combatants.player?.hp ?? 0)
    + (combat.combatants[companionId]?.hp ?? 0);
}

function activateCompanion(companionId) {
  const combat = GameState.combat;
  const companionIndex = combat.turnQueue.findIndex(entry => (
    entry.type === 'companion' && entry.id === companionId
  ));
  combat.roundNumber = (combat.roundNumber ?? 0) + 1;
  combat.activeIdx = companionIndex;
  combat.activeTurnIndex = companionIndex;
  CombatSystem.beginActiveTurn();
}

function runProductionCompanionTurn({
  companionId,
  desiredSkillId,
  metrics,
  distribution,
}) {
  const desiredSkill = configureProductionTacticalSituation(
    companionId,
    desiredSkillId,
  );
  const npcState = GameState.npcs.states[companionId];
  const stance = stanceForRole(
    desiredSkill?.tacticalRole,
    COMPANION_TACTICS[companionId]?.preferredStance ?? 'attack',
  );

  activateCompanion(companionId);
  CombatSystem._prepareCompanionTurn(companionId);
  const plan = CombatSystem._planCompanionAction(companionId, stance);
  if (!plan) {
    distribution.noPlan++;
    return { plan: null, result: null };
  }

  const skill = GameState.combat.skillsById[plan.skillId];
  const target = GameState.combat.combatants[plan.targetId];
  distribution.plannedCommands++;
  if (Object.hasOwn(distribution.skills, plan.skillId)) {
    distribution.skills[plan.skillId]++;
  } else {
    distribution.otherSkills[plan.skillId]
      = (distribution.otherSkills[plan.skillId] ?? 0) + 1;
  }

  if (!skill || !target) {
    categorizeCommandFailure(metrics, !skill ? 'invalid_skill' : 'invalid_target');
    return { plan, result: null };
  }
  if (!COMPANION_MOTION_KEYS.has(skill.motionKey)) {
    metrics.invalidMotionKeys++;
  }
  if (supportWouldBeWasted(skill, target)) {
    metrics.duplicateSupportWaste++;
  }

  const hpBefore = allyHpTotal(companionId);
  const hasHealingSkill = COMPANION_COMBAT_LOADOUTS[companionId]
    .map(skillId => COMBAT_SKILLS[skillId])
    .some(candidate => candidate.effects?.some(effect => effect.type === 'heal'));
  const result = CombatSystem._executePlannedCompanionAction(plan);
  if (result?.ok !== true) {
    categorizeCommandFailure(metrics, result?.reason ?? 'unknown');
  } else {
    distribution.executedCommands++;
  }
  if (!hasHealingSkill && allyHpTotal(companionId) > hpBefore) {
    metrics.nonHealerHealing++;
  }

  npcState.stance = stance;
  return { plan, result };
}

function isExecutableIntent(intent) {
  return (
    typeof intent?.actionId === 'string'
    && Array.isArray(intent.targetIds)
    && intent.targetIds.length > 0
  );
}

function prepareDisplayedIntent(enemy) {
  for (let step = 0; step < MAX_ENEMY_STEPS; step++) {
    const intent = snapshotIntent(enemy._nextIntent);
    if (isExecutableIntent(intent)) return intent;
    CombatSystem._runSingleEnemyTurn(0);
    if (enemy.currentHp <= 0 || GameState.combat?.active === false) break;
  }
  return snapshotIntent(enemy._nextIntent);
}

function enemyActionDefinition(enemy, action) {
  if (action?.category === 'timed_threat') return enemy.timedThreat;
  if (action?.category === 'special') {
    return enemy.specialSkills?.find(skill => (
      (skill.actionId ?? skill.id) === action.actionId
    ));
  }
  return enemy.patternProfile?.defaultAction ?? enemy.defaultAction;
}

function damageRangeOf(enemy, definition) {
  const effect = definition?.effects?.find(candidate => candidate.type === 'damage');
  return effect?.value ?? definition?.damage ?? enemy.attack?.damage ?? [0, 0];
}

function expectedAttemptsByTarget(enemy, action, definition) {
  const damageRange = damageRangeOf(enemy, definition);
  if (!damageRange.some(value => Number.isFinite(value) && value > 0)) {
    return new Map();
  }
  const targets = action.targetIds ?? [];
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

function expectedStatusIds(enemy, definition, category) {
  const ids = [];
  if (category !== 'timed_threat' && enemy.statusInflict?.id) {
    ids.push(enemy.statusInflict.id);
  }
  if (definition?.statusInflict?.id) ids.push(definition.statusInflict.id);
  if (definition?.effect?.status?.id) ids.push(definition.effect.status.id);
  if (definition?.effect?.bleed) ids.push('bleed');
  if (definition?.effect?.poison) ids.push('poison');
  if (definition?.effect?.stun || (definition?.stunChance ?? 0) > 0) {
    ids.push('stun');
  }
  for (const effect of definition?.effects ?? []) {
    if (effect.type === 'status' && (effect.status?.id ?? effect.id)) {
      ids.push(effect.status?.id ?? effect.id);
    }
  }
  return [...new Set(ids)];
}

function allyStatusIds(targetId) {
  if (targetId === 'player') {
    return new Set([
      ...(GameState.combat.playerStatus ?? []).map(status => status.id),
      ...(GameState.combat.combatants.player?.statusEffects ?? [])
        .map(status => status.id),
    ]);
  }
  return new Set([
    ...(GameState.combat.combatants[targetId]?.statusEffects ?? [])
      .map(status => status.id),
    ...(GameState.npcs.states[targetId]?.statusEffects ?? [])
      .map(status => status.id),
  ]);
}

function observeProductionEnemyExecution(enemy, displayedIntent) {
  const calls = [];
  const originalExecute = CombatSystem._executeEnemyCommittedAction;
  CombatSystem._executeEnemyCommittedAction = function observedExecution(
    observedEnemy,
    action,
  ) {
    const result = originalExecute.call(this, observedEnemy, action);
    calls.push({
      action: snapshotAction(action),
      result: result ? structuredClone(result) : result,
    });
    return result;
  };

  try {
    for (let step = 0; step < MAX_ENEMY_STEPS && calls.length === 0; step++) {
      CombatSystem._runSingleEnemyTurn(0);
      if (enemy.currentHp <= 0 && calls.length === 0) break;
    }
  } finally {
    CombatSystem._executeEnemyCommittedAction = originalExecute;
  }

  return {
    displayedIntent,
    execution: calls[0] ?? null,
  };
}

function inspectProductionEnemyExecution({
  companionId,
  enemy,
  observation,
  statusesBefore,
  blocksBefore,
  metrics,
  distribution,
}) {
  const intent = observation.displayedIntent;
  const execution = observation.execution;
  if (!execution?.action) {
    metrics.intentActionIdMismatches++;
    return;
  }

  const action = execution.action;
  const result = execution.result;
  distribution[action.actionId] = (distribution[action.actionId] ?? 0) + 1;
  if (action.actionId !== intent?.actionId) {
    metrics.intentActionIdMismatches++;
  }
  if (JSON.stringify(action.targetIds) !== JSON.stringify(intent?.targetIds ?? [])) {
    metrics.intentTargetMismatches++;
  }

  const definition = enemyActionDefinition(enemy, action);
  if (
    !ENEMY_MOTION_KEYS.has(action.motionKey)
    || action.motionKey !== definition?.motionKey
  ) {
    metrics.invalidMotionKeys++;
  }

  const expectedAttempts = expectedAttemptsByTarget(enemy, action, definition);
  const actualAttempts = new Map();
  for (const damage of result?.damageResults ?? []) {
    actualAttempts.set(
      damage.targetId,
      (actualAttempts.get(damage.targetId) ?? 0) + 1,
    );
  }
  const expectedCompanionAttempts = expectedAttempts.get(companionId) ?? 0;
  const actualCompanionAttempts = actualAttempts.get(companionId) ?? 0;
  if (actualCompanionAttempts !== expectedCompanionAttempts) {
    metrics.companionMultiHitLoss += Math.abs(
      expectedCompanionAttempts - actualCompanionAttempts,
    );
  }

  if (action.targetIds.includes(companionId)) {
    const observedStatuses = allyStatusIds(companionId);
    const expectedDamageAttempts = expectedAttempts.get(companionId) ?? 0;
    const companionWasHit = (result?.damageResults ?? []).some(entry => (
      entry.targetId === companionId
      && entry.result?.dodged !== true
      && entry.result?.missed !== true
    ));
    const onHitEffectsWereEvaded = (
      expectedDamageAttempts > 0
      && !companionWasHit
    );
    const blockNegatesStun = definition?.telegraph?.blockNegatesStun === true
      && (blocksBefore.get(companionId) ?? 0) > 0;
    for (const statusId of expectedStatusIds(enemy, definition, action.category)) {
      if (onHitEffectsWereEvaded) continue;
      if (statusId === 'stun' && blockNegatesStun) continue;
      if (
        !statusesBefore.get(companionId)?.has(statusId)
        && !observedStatuses.has(statusId)
      ) {
        metrics.companionStatusLoss++;
      }
    }
  }
}

function runProductionEnemyTurn({
  companionId,
  enemy,
  displayedIntent,
  metrics,
  distribution,
}) {
  if (!isExecutableIntent(displayedIntent)) {
    metrics.intentActionIdMismatches++;
    return;
  }
  const targetIds = displayedIntent.targetIds ?? [];
  const statusesBefore = new Map(
    targetIds.map(targetId => [targetId, allyStatusIds(targetId)]),
  );
  const blocksBefore = new Map(
    targetIds.map(targetId => [
      targetId,
      GameState.combat.combatants[targetId]?.tokens?.block ?? 0,
    ]),
  );
  const observation = observeProductionEnemyExecution(enemy, displayedIntent);
  inspectProductionEnemyExecution({
    companionId,
    enemy,
    observation,
    statusesBefore,
    blocksBefore,
    metrics,
    distribution,
  });
}

function setupKillProbe(enemyDefinition, killContext) {
  const enemy = structuredClone(enemyDefinition);
  enemy.currentHp = 0;
  enemy.maxHp = Math.max(1, enemy.hp?.max ?? 50);
  enemy.lootTable = [];
  enemy.infectionChance = 0;
  delete enemy._killProcessed;

  GameState.player = {
    ...freshPlayer(),
    hp: { current: 100, max: 100 },
  };
  GameState.stats = freshStats();
  GameState.cards = {};
  GameState.flags = {};
  GameState.location = { currentDistrict: 'pattern-counter-probe' };
  GameState.noise = { level: 0 };
  GameState.companions = [];
  GameState.npcs = { states: {} };
  GameState.combat = {
    active: true,
    enemies: [enemy],
    log: [],
    fxQueue: [],
    rewards: [],
    xpGained: 0,
    lastHit: null,
    _lastKillContext: killContext,
  };

  CombatSystem._onEnemyKilled(enemy);
  return {
    hp: GameState.player.hp.current,
    noise: GameState.noise.level,
  };
}

function probeProductionStunDelay(enemyId, declaredValue) {
  const enemy = createProductionCombat('npc_nurse', enemyId, () => 0);
  const before = snapshotAction(enemy._enemyActionState?.committedAction);
  const normalAdvance = advanceEnemyAction({
    state: enemy._enemyActionState,
    stunned: false,
  });
  const normalAfter = snapshotAction(normalAdvance.committedAction);
  const normalDecreases = (
    Number.isFinite(before?.remainingTelegraphTurns)
    && before.remainingTelegraphTurns > 0
    && normalAfter?.remainingTelegraphTurns
      === before.remainingTelegraphTurns - 1
  );

  const applied = CombatSystem._applyEnemyStatusInflict(enemy, {
    id: 'stun',
    name: 'stun',
    duration: 1,
    effect: { skipTurn: true },
  }, 0);
  CombatSystem._runSingleEnemyTurn(0);
  const productionStun = snapshotAction(
    enemy._enemyActionState?.committedAction,
  );
  const committedActionPreserved = (
    productionStun?.actionId === before?.actionId
    && JSON.stringify(productionStun?.targetIds)
      === JSON.stringify(before?.targetIds)
    && productionStun?.remainingTelegraphTurns
      === before?.remainingTelegraphTurns
  );
  const stunConsumed = !(enemy._statusEffects ?? []).some(
    status => status.id === 'stun',
  );
  const ok = (
    declaredValue === true
    && normalDecreases
    && applied === true
    && committedActionPreserved
    && stunConsumed
  );

  return {
    ok,
    detail: `normal ${before?.remainingTelegraphTurns}→${normalAfter?.remainingTelegraphTurns}, `
      + `production stun ${before?.remainingTelegraphTurns}→`
      + `${productionStun?.remainingTelegraphTurns}, action=${before?.actionId}`,
  };
}

function probeDeclaredCounters() {
  return withGameStateSnapshot(() => {
    const rows = [];
    const failures = [];
    Math.random = () => 0;

    for (const [enemyId, enemy] of Object.entries(ENEMIES)) {
      for (const [counter, value] of Object.entries(
        enemy.timedThreat?.counters ?? {},
      )) {
        let probe = { ok: false, detail: `지원되지 않는 카운터: ${JSON.stringify(value)}` };
        if (counter === 'stunDelays') {
          probe = probeProductionStunDelay(enemyId, value);
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
          probe = {
            ok: affinityWorks && clean.hp === 100 && dirty.hp < clean.hp,
            detail: `counter HP ${clean.hp}, non-counter HP ${dirty.hp}`,
          };
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
          probe = {
            ok: quiet.noise === 0 && loud.noise > quiet.noise,
            detail: `quiet noise ${quiet.noise}, loud noise ${loud.noise}`,
          };
        }
        rows.push({ enemyId, counter, ...probe });
        if (!probe.ok) failures.push(`${enemyId}.${counter}`);
      }
    }

    return { rows, failures };
  });
}

function collectWarnings(companionIds, companionDistributions) {
  const warnings = [];
  for (const companionId of companionIds) {
    const distribution = companionDistributions[companionId];
    for (const [skillId, count] of Object.entries(distribution.skills)) {
      if (count === 0) {
        warnings.push({
          type: 'zero_use',
          companionId,
          skillId,
          detail: '관찰 시나리오에서 선택되지 않음',
        });
      }
    }
    if (distribution.noPlan > 0) {
      warnings.push({
        type: 'no_plan',
        companionId,
        skillId: '-',
        detail: `production planner가 ${distribution.noPlan}회 계획을 만들지 못함`,
      });
    }
  }
  return warnings;
}

function probeProductionDefaultStances(seed, companionIds) {
  return companionIds.map(companionId => {
    createProductionCombat(
      companionId,
      'zombie_common',
      randomFor(seed, companionId, 'production-default-stance'),
    );
    const state = GameState.npcs.states[companionId];
    const expected = COMPANION_TACTICS[companionId]?.preferredStance ?? 'attack';
    const actual = CombatSystem._getCompanionStance(companionId);
    return {
      companionId,
      expected,
      actual,
      stateHasExplicitStance: Object.hasOwn(state, 'stance'),
      ok: !Object.hasOwn(state, 'stance') && actual === expected,
    };
  });
}

function simulate({ runs, seed }, roster) {
  return withGameStateSnapshot(() => {
    const companionIds = [...EXPECTED_COMPANION_IDS];
    const enemyIds = [...EXPECTED_ENEMY_IDS];
    const metrics = emptyMetrics();
    const companionDistributions = Object.fromEntries(
      companionIds.map(companionId => [
        companionId,
        {
          skills: Object.fromEntries(
            COMPANION_COMBAT_LOADOUTS[companionId]
              .map(skillId => [skillId, 0]),
          ),
          otherSkills: {},
          plannedCommands: 0,
          executedCommands: 0,
          noPlan: 0,
        },
      ]),
    );
    const enemyDistributions = Object.fromEntries(
      enemyIds.map(enemyId => [enemyId, {}]),
    );
    const combos = [];
    const defaultStanceProbe = probeProductionDefaultStances(seed, companionIds);
    metrics.productionDefaultStanceMismatches = defaultStanceProbe
      .filter(row => !row.ok)
      .length;

    for (const companionId of companionIds) {
      for (const enemyId of enemyIds) {
        const comboMetrics = emptyMetrics();
        let enemy = null;
        for (let runIndex = 0; runIndex < runs; runIndex++) {
          enemy = createProductionCombat(
            companionId,
            enemyId,
            randomFor(seed, companionId, enemyId, runIndex, 'setup'),
          );
          for (let turnIndex = 0; turnIndex < TURNS_PER_RUN; turnIndex++) {
            if (
              enemy.currentHp <= 0
              || GameState.combat?.active === false
            ) {
              enemy = createProductionCombat(
                companionId,
                enemyId,
                randomFor(
                  seed,
                  companionId,
                  enemyId,
                  runIndex,
                  turnIndex,
                  'reset',
                ),
              );
            }

            const displayedIntent = prepareDisplayedIntent(enemy);
            const desiredSkillId = COMPANION_COMBAT_LOADOUTS[companionId][
              (runIndex + turnIndex) % 3
            ];
            Math.random = randomFor(
              seed,
              companionId,
              enemyId,
              runIndex,
              turnIndex,
              'companion',
            );
            runProductionCompanionTurn({
              companionId,
              desiredSkillId,
              metrics: comboMetrics,
              distribution: companionDistributions[companionId],
            });

            const enemyRandom = randomFor(
              seed,
              companionId,
              enemyId,
              runIndex,
              turnIndex,
              'enemy',
            );
            Math.random = () => enemyRandom() * 0.1;
            runProductionEnemyTurn({
              companionId,
              enemy,
              displayedIntent,
              metrics: comboMetrics,
              distribution: enemyDistributions[enemyId],
            });
          }
        }
        addMetrics(metrics, comboMetrics);
        combos.push({
          companionId,
          enemyId,
          representative: REPRESENTATIVE_COMBOS.has(
            `${companionId}/${enemyId}`,
          ),
          metrics: comboMetrics,
        });
      }
    }

    const counters = probeDeclaredCounters();
    metrics.declaredButUnexecutedCounters = counters.failures.length;
    const warnings = collectWarnings(
      companionIds,
      companionDistributions,
    );

    return {
      roster,
      companionIds,
      enemyIds,
      metrics,
      companionDistributions,
      enemyDistributions,
      combos,
      counters,
      warnings,
      defaultStanceProbe,
    };
  });
}

function markdownCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function percent(value, total) {
  return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%';
}

function renderReport(result, options) {
  const {
    roster,
    companionIds,
    enemyIds,
    metrics,
    companionDistributions,
    enemyDistributions,
    combos,
    counters,
    warnings,
    defaultStanceProbe,
  } = result;
  const lines = [
    '# 동료·일반 몬스터 패턴 통합 QA',
    '',
    `> 명령: \`node tools/simulate_companion_monster_patterns.mjs --runs ${options.runs} --seed ${options.seed} --out ${markdownCell(options.out)}\``,
    `> 범위: 동료 ${companionIds.length}종 × 일반 몬스터 ${enemyIds.length}종 = ${combos.length}조합, 조합당 ${options.runs}회 × ${TURNS_PER_RUN}행동`,
    `> 결정적 seed: \`${options.seed}\``,
    '',
    '## 데이터 계약',
    '',
    '| 계약 | 기대 | 실제 | 결과 |',
    '|---|---:|---:|---|',
    `| 동료 roster | 20 | ${roster.companionCount} | PASS |`,
    `| 고유 동료 기술 ID | 60 | ${roster.uniqueCompanionSkillCount} | PASS |`,
    `| 일반 몬스터 roster | 12 | ${roster.enemyCount} | PASS |`,
    '',
    'roster 수, ID 완전성, 동료별 3개 loadout, 기술 정의 존재 여부는 시뮬레이션 전에 hard fail로 검사한다.',
    '',
    '## Production 기본 동료 자세 smoke',
    '',
    '| 동료 | profile 기본 | production 기본 | state stance 미설정 | 결과 |',
    '|---|---|---|---|---|',
    ...defaultStanceProbe.map(row => (
      `| \`${row.companionId}\` | \`${row.expected}\` | \`${row.actual}\` | `
      + `${row.stateHasExplicitStance ? '아니오' : '예'} | ${row.ok ? 'PASS' : 'FAIL'} |`
    )),
    '',
    '## 판정',
    '',
    `**${totalViolations(metrics) === 0 ? 'PASS' : 'FAIL'}** — 허용 기준은 모든 오류 지표 0이다.`,
    '',
    '| 지표 | 관측 | 허용 | 결과 |',
    '|---|---:|---:|---|',
  ];
  for (const [metric, label] of Object.entries(METRIC_LABELS)) {
    lines.push(
      `| ${label} | ${metrics[metric]} | 0 | `
      + `${metrics[metric] === 0 ? 'PASS' : 'FAIL'} |`,
    );
  }

  lines.push(
    '',
    '## 동료별 production 기술 사용 분포',
    '',
    '| 동료 | 기술 1 | 기술 2 | 기술 3 | 계획 | 실행 | no-plan |',
    '|---|---:|---:|---:|---:|---:|---:|',
  );
  for (const companionId of companionIds) {
    const distribution = companionDistributions[companionId];
    const skillCells = COMPANION_COMBAT_LOADOUTS[companionId].map(skillId => {
      const count = distribution.skills[skillId];
      return `\`${skillId}\` ${count} (${percent(count, distribution.plannedCommands)})`;
    });
    lines.push(
      `| \`${companionId}\` | ${skillCells.join(' | ')} | `
      + `${distribution.plannedCommands} | ${distribution.executedCommands} | `
      + `${distribution.noPlan} |`,
    );
  }

  lines.push(
    '',
    '## 일반 몬스터 production 실행 분포',
    '',
    '| 몬스터 | `_executeEnemyCommittedAction`에서 관찰한 행동 |',
    '|---|---|',
  );
  for (const enemyId of enemyIds) {
    const cells = Object.entries(enemyDistributions[enemyId])
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([actionId, count]) => `\`${actionId}\` ${count}`)
      .join(', ');
    lines.push(`| \`${enemyId}\` | ${cells || '-'} |`);
  }

  lines.push(
    '',
    '## 20×12 조합 오류 매트릭스',
    '',
    '각 셀은 해당 조합의 오류 지표 합계이며, ★는 브라우저 대표 조합이다.',
    '',
    `| 동료 \\ 몬스터 | ${enemyIds.map(enemyId => `\`${enemyId}\``).join(' | ')} |`,
    `|---|${enemyIds.map(() => '---:').join('|')}|`,
  );
  for (const companionId of companionIds) {
    const cells = enemyIds.map(enemyId => {
      const combo = combos.find(entry => (
        entry.companionId === companionId && entry.enemyId === enemyId
      ));
      return `${combo.representative ? '★' : ''}${totalViolations(combo.metrics)}`;
    });
    lines.push(`| \`${companionId}\` | ${cells.join(' | ')} |`);
  }

  lines.push(
    '',
    '## 선언 카운터 production probe',
    '',
    '| 몬스터 | 카운터 | 실행 근거 | 결과 |',
    '|---|---|---|---|',
  );
  for (const row of counters.rows) {
    lines.push(
      `| \`${row.enemyId}\` | \`${row.counter}\` | `
      + `${markdownCell(row.detail)} | ${row.ok ? 'PASS' : 'FAIL'} |`,
    );
  }

  lines.push(
    '',
    '## 관찰 경고 (비차단)',
    '',
    'zero-use와 no-plan은 오류를 숨기지 않기 위해 별도 경고로 보고한다. 이는 production 전술 우선순위·위치·포화 회피 때문에 현재 fixture에서 선택 경로가 없을 수 있다는 뜻이며, 기술 무효를 자동으로 뜻하지 않는다.',
    '',
  );
  if (warnings.length === 0) {
    lines.push('- 없음');
  } else {
    lines.push(
      '| 유형 | 동료 | 기술 | 해석 |',
      '|---|---|---|---|',
    );
    for (const warning of warnings) {
      lines.push(
        `| \`${warning.type}\` | \`${warning.companionId}\` | `
        + `\`${warning.skillId}\` | ${markdownCell(warning.detail)} |`,
      );
    }
  }

  lines.push(
    '',
    '## 계측 경계',
    '',
    '- 동료는 production `_setupCombat()` 뒤 `_prepareCompanionTurn()` → `_planCompanionAction()` → `_executePlannedCompanionAction()`으로만 계획·실행한다. simulator는 효과 adapter를 재구현하지 않는다.',
    '- simulator의 동료 state에는 `stance`를 주입하지 않으며, 별도 smoke가 `CombatSystem._getCompanionStance()`의 production 기본값을 20종 `preferredStance`와 대조한다.',
    '- 몬스터는 UI가 읽는 `enemy._nextIntent`를 값 snapshot으로 보존하고, 그 사이에 동료 행동을 삽입한 뒤 production `_runSingleEnemyTurn()`을 진행한다.',
    '- 실제 행동·대상·다중타격은 `_executeEnemyCommittedAction()` 호출을 observation wrapper로 관찰한다. wrapper는 production 결과를 바꾸지 않고 즉시 복원된다.',
    '- `stunDelays`는 `advanceEnemyAction()` 정상 진행이 1 감소하는 negative control, 선언값 `true`, production stun 부여 후 `_runSingleEnemyTurn()`에서 같은 committed action과 countdown이 보존되는지를 모두 요구한다.',
    '- 카운터 probe와 전체 simulator는 변경한 `GameState` top-level 참조, `Math.random`, `SystemRegistry` 등록을 `finally`에서 복원한다.',
  );

  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const roster = validateRosterContract();
  const result = simulate(options, roster);
  const report = renderReport(result, options);
  const outputPath = path.resolve(options.out);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, 'utf8');

  const violations = totalViolations(result.metrics);
  console.log(
    `companion-monster-patterns: ${violations === 0 ? 'PASS' : 'FAIL'} `
    + `companions=${result.companionIds.length} `
    + `skills=${result.roster.uniqueCompanionSkillCount} `
    + `enemies=${result.enemyIds.length} `
    + `combinations=${result.combos.length} runs=${options.runs} `
    + `warnings=${result.warnings.length} violations=${violations}`,
  );
  console.log(`report=${outputPath}`);
  if (violations > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
});
