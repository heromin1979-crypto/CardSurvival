import {
  advanceEnemyAction,
  commitEnemyActionDefinition,
} from './EnemyActionPlanner.js';

export function createBossActionState() {
  return {
    committedAction: null,
    ultimatePending: false,
    ultimateUsed: false,
    lastBasicActionId: null,
  };
}

export function normalizeBossActionState(value) {
  return {
    committedAction: value?.committedAction ?? null,
    ultimatePending: value?.ultimatePending === true,
    ultimateUsed: value?.ultimateUsed === true,
    lastBasicActionId: typeof value?.lastBasicActionId === 'string'
      ? value.lastBasicActionId
      : null,
  };
}

function hpRatioFor(enemy, context) {
  if (Number.isFinite(context?.hpRatio)) return context.hpRatio;

  const currentHp = context?.currentHp
    ?? enemy?.currentHp
    ?? enemy?.hp?.current
    ?? enemy?.hp;
  const maxHp = context?.maxHp
    ?? enemy?.maxHp
    ?? enemy?.hp?.max;
  if (!Number.isFinite(currentHp) || !Number.isFinite(maxHp) || maxHp <= 0) {
    return null;
  }
  return currentHp / maxHp;
}

function statusId(status) {
  return typeof status === 'string'
    ? status
    : status?.id ?? status?.statusId ?? status?.type ?? null;
}

function statusIdsFor(enemy, context) {
  const sources = [
    enemy?._statusEffects,
    enemy?.statusEffects,
    context?.selfStatuses,
    context?.statusEffects,
  ];
  const ids = new Set();

  for (const source of sources) {
    if (source instanceof Set) {
      for (const status of source) ids.add(statusId(status));
    } else if (Array.isArray(source)) {
      for (const status of source) ids.add(statusId(status));
    } else if (source && typeof source === 'object') {
      for (const [id, value] of Object.entries(source)) {
        if (value) ids.add(id);
      }
    }
  }

  ids.delete(null);
  return ids;
}

function meetsActionConditions(definition, enemy, context) {
  if (!definition?.id && !definition?.actionId) return false;

  const hpRatio = hpRatioFor(enemy, context);
  if (Number.isFinite(definition.minHpRatio)
    && (hpRatio === null || hpRatio < definition.minHpRatio)) {
    return false;
  }
  if (Number.isFinite(definition.maxHpRatio)
    && (hpRatio === null || hpRatio > definition.maxHpRatio)) {
    return false;
  }
  if (Number.isFinite(definition.maxSummons)
    && !(Number(context?.activeSummons ?? 0) < definition.maxSummons)) {
    return false;
  }

  const requiredAbsent = Array.isArray(definition.requiresStatusAbsent)
    ? definition.requiresStatusAbsent
    : [definition.requiresStatusAbsent].filter(Boolean);
  const selfStatuses = statusIdsFor(enemy, context);
  return requiredAbsent.every(id => !selfStatuses.has(id));
}

function randomChoice(values, random) {
  if (values.length <= 1) return values[0] ?? null;
  const roll = Number(random());
  const normalizedRoll = Number.isFinite(roll)
    ? Math.max(0, Math.min(roll, 0.9999999999999999))
    : 0;
  return values[Math.floor(normalizedRoll * values.length)];
}

function commitDefinition({
  state,
  enemy,
  definition,
  category,
  candidates,
  random,
}) {
  const { committedAction } = commitEnemyActionDefinition({
    enemy,
    definition,
    category,
    candidates,
    random,
  });
  return {
    ...state,
    committedAction,
  };
}

export function reserveUltimateAfterDamage({
  state,
  hpBefore,
  hpAfter,
  maxHp,
  threshold = 0.3,
}) {
  const normalized = normalizeBossActionState(state);
  if (normalized.ultimatePending || normalized.ultimateUsed
    || !Number.isFinite(hpBefore) || !Number.isFinite(hpAfter)
    || !Number.isFinite(maxHp) || maxHp <= 0
    || !Number.isFinite(threshold)
    || hpAfter <= 0
    || hpBefore / maxHp <= threshold
    || hpAfter / maxHp > threshold) {
    return normalized;
  }

  return {
    ...normalized,
    committedAction: normalized.committedAction?.state === 'telegraphing'
      ? normalized.committedAction
      : null,
    ultimatePending: true,
  };
}

export function commitNextBossAction({
  state,
  enemy,
  candidates = [],
  context = {},
  cooldowns = enemy?._skillCooldowns,
  random = Math.random,
}) {
  const normalized = normalizeBossActionState(state);
  if (normalized.committedAction || !enemy?.bossPattern) return normalized;

  const { ultimate, specialSkill, basicAttacks = [] } = enemy.bossPattern;
  if (normalized.ultimatePending && !normalized.ultimateUsed && ultimate) {
    return {
      ...commitDefinition({
        state: normalized,
        enemy,
        definition: ultimate,
        category: 'ultimate',
        candidates,
        random,
      }),
      ultimatePending: false,
      ultimateUsed: true,
    };
  }

  const specialReady = meetsActionConditions(specialSkill, enemy, context)
    && (cooldowns?.[specialSkill.id] ?? 0) <= 0;
  if (specialReady && random() < 0.3) {
    return commitDefinition({
      state: normalized,
      enemy,
      definition: specialSkill,
      category: 'special',
      candidates,
      random,
    });
  }

  const eligibleBasics = basicAttacks.filter(definition =>
    meetsActionConditions(definition, enemy, context));
  const nonRepeatingBasics = eligibleBasics.filter(definition =>
    (definition.id ?? definition.actionId) !== normalized.lastBasicActionId);
  const definition = randomChoice(
    nonRepeatingBasics.length > 0 ? nonRepeatingBasics : eligibleBasics,
    random,
  );
  if (!definition) return normalized;

  return {
    ...commitDefinition({
      state: normalized,
      enemy,
      definition,
      category: 'basic',
      candidates,
      random,
    }),
    lastBasicActionId: definition.id ?? definition.actionId,
  };
}

export function advanceBossAction({ state, stunned = false }) {
  const normalized = normalizeBossActionState(state);
  const advanced = advanceEnemyAction({ state: normalized, stunned });
  return {
    ...normalized,
    committedAction: advanced.committedAction,
  };
}

export function completeBossAction({ state }) {
  return {
    ...normalizeBossActionState(state),
    committedAction: null,
  };
}
