import BALANCE from '../../data/gameBalance.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeNonnegative(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeStacks(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function clamp(value, minimum, maximum) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function roll(random) {
  if (typeof random !== 'function') return 0;
  try {
    return clamp(random(), 0, 1);
  } catch {
    return 0;
  }
}

function ensureTokenBag(target) {
  if (!isObject(target)) return null;
  if (!isObject(target.tokens)) target.tokens = {};
  return target.tokens;
}

function maxHpFor(target) {
  const maxHp = Number.isFinite(target?.maxHp) && target.maxHp > 0
    ? target.maxHp
    : 1;
  return maxHp;
}

function currentHpFor(target) {
  return normalizeNonnegative(target?.hp);
}

function isAlly(target) {
  return target?.side === 'ally' || target?.sourceType === 'player' || target?.sourceType === 'companion';
}

function deathResistFor(target) {
  const configured = Number.isFinite(target?.deathResist)
    ? target.deathResist
    : BALANCE.combat.deathsDoor.baseResist;
  return clamp(configured, 0, 1);
}

function periodicDamageFor(status) {
  const effect = isObject(status?.effect) ? status.effect : null;
  if (!effect) return 0;

  if (Number.isFinite(effect.hpLossPerRound) && effect.hpLossPerRound > 0) {
    return effect.hpLossPerRound;
  }
  if (Number.isFinite(effect.hpPerRound) && effect.hpPerRound < 0) {
    return Math.abs(effect.hpPerRound);
  }
  return 0;
}

function shouldKeepUnprocessedStatus(status) {
  if (!isObject(status)) return false;
  if (typeof status.id !== 'string' || status.id.length === 0) return false;
  return !(Number.isFinite(status.duration) && status.duration <= 0);
}

function healingReceivedReductionFor(target) {
  const statuses = new Set([
    ...(Array.isArray(target?.statusEffects) ? target.statusEffects : []),
    ...(Array.isArray(target?._statusEffects) ? target._statusEffects : []),
  ]);
  let strongestReduction = 0;

  for (const status of statuses) {
    if (status?.id !== 'healing_received_down'
      || (Number.isFinite(status.duration) && status.duration <= 0)
      || !Number.isFinite(status.value)) {
      continue;
    }
    strongestReduction = Math.max(strongestReduction, status.value);
  }

  return clamp(strongestReduction, 0, 1);
}

function timedStatusIsActive(status, clock = 'remainingRounds') {
  if (!isObject(status)) return false;
  const remaining = Number.isFinite(status?.[clock])
    ? status[clock]
    : status?.duration;
  return !Number.isFinite(remaining) || remaining > 0;
}

function mergeEffectPreservingStrength(existingEffect, incomingEffect) {
  const merged = { ...(existingEffect ?? {}) };
  for (const [key, incomingValue] of Object.entries(incomingEffect ?? {})) {
    const existingValue = merged[key];
    if (Number.isFinite(incomingValue)) {
      merged[key] = Number.isFinite(existingValue)
        ? Math.max(existingValue, incomingValue)
        : incomingValue;
    } else if (incomingValue === true || incomingValue === false) {
      merged[key] = existingValue === true || incomingValue === true;
    } else if (isObject(incomingValue)) {
      merged[key] = mergeEffectPreservingStrength(
        isObject(existingValue) ? existingValue : {},
        incomingValue,
      );
    } else if (existingValue === undefined) {
      merged[key] = incomingValue;
    }
  }
  return merged;
}

function normalizedTimedStatus(status, clock) {
  if (!isObject(status) || typeof status.id !== 'string' || status.id.length === 0) {
    return null;
  }
  const fallbackRemaining = Number.isFinite(status.duration)
    ? status.duration
    : 1;
  const remaining = Number.isFinite(status[clock])
    ? status[clock]
    : fallbackRemaining;
  return {
    ...status,
    [clock]: Math.max(1, Math.floor(remaining)),
    ...(clock === 'remainingRounds' && Number.isFinite(status.duration)
      ? { duration: Math.max(1, Math.floor(remaining)) }
      : {}),
    effect: { ...(status.effect ?? {}) },
  };
}

function addOrRefreshTimedStatus(statuses, status, clock) {
  if (!Array.isArray(statuses)) return null;
  const incoming = normalizedTimedStatus(status, clock);
  if (!incoming) return null;

  const incomingSource = incoming.sourceEnemyId ?? null;
  const existing = statuses.find(entry => (
    entry?.id === incoming.id
    && (entry.sourceEnemyId ?? null) === incomingSource
  ));
  if (!existing) {
    statuses.push(incoming);
    return incoming;
  }

  existing[clock] = Math.max(
    Number.isFinite(existing[clock]) ? existing[clock] : existing.duration ?? 0,
    incoming[clock],
  );
  if (clock === 'remainingRounds' && Number.isFinite(incoming.duration)) {
    existing.duration = existing[clock];
  }
  existing.effect = mergeEffectPreservingStrength(existing.effect, incoming.effect);
  if (incoming.name) existing.name = incoming.name;
  if (incoming._skipNextRoundTick === true) existing._skipNextRoundTick = true;
  return existing;
}

export function addOrRefreshEnemyStatus(enemy, status) {
  if (!isObject(enemy)) return null;
  if (!Array.isArray(enemy._statusEffects)) enemy._statusEffects = [];
  return addOrRefreshTimedStatus(enemy._statusEffects, status, 'remainingRounds');
}

export function enemyStatusModifiers(enemy) {
  const modifiers = {
    defenseIncrease: 0,
    evasionIncrease: 0,
    incomingDamageReduction: 0,
    outgoingDamageIncrease: 0,
    invulnerable: false,
  };

  const strongestById = new Map();
  for (const status of enemy?._statusEffects ?? []) {
    if (!timedStatusIsActive(status, 'remainingRounds')) continue;
    const effect = status?.effect ?? {};
    const key = status?.id ?? status;
    const strongest = strongestById.get(key) ?? {
      defenseIncrease: 0,
      evasionIncrease: 0,
      incomingDamageReduction: 0,
      outgoingDamageIncrease: 0,
      invulnerable: false,
    };
    if (Number.isFinite(effect.defenseIncrease)) {
      strongest.defenseIncrease = Math.max(
        strongest.defenseIncrease,
        Math.max(0, effect.defenseIncrease),
      );
    }
    if (Number.isFinite(effect.evasionIncrease)) {
      strongest.evasionIncrease = Math.max(
        strongest.evasionIncrease,
        Math.max(0, effect.evasionIncrease),
      );
    }
    if (Number.isFinite(effect.incomingDamageReduction)) {
      strongest.incomingDamageReduction = Math.max(
        strongest.incomingDamageReduction,
        Math.max(0, effect.incomingDamageReduction),
      );
    }
    if (Number.isFinite(effect.outgoingDamageIncrease)) {
      strongest.outgoingDamageIncrease = Math.max(
        strongest.outgoingDamageIncrease,
        Math.max(0, effect.outgoingDamageIncrease),
      );
    }
    if (effect.invulnerable === true) strongest.invulnerable = true;
    strongestById.set(key, strongest);
  }

  for (const strongest of strongestById.values()) {
    modifiers.defenseIncrease += strongest.defenseIncrease;
    modifiers.evasionIncrease += strongest.evasionIncrease;
    modifiers.incomingDamageReduction += strongest.incomingDamageReduction;
    modifiers.outgoingDamageIncrease += strongest.outgoingDamageIncrease;
    if (strongest.invulnerable) modifiers.invulnerable = true;
  }

  modifiers.evasionIncrease = clamp(modifiers.evasionIncrease, 0, 0.95);
  modifiers.incomingDamageReduction = clamp(modifiers.incomingDamageReduction, 0, 1);
  return modifiers;
}

export function addEnemyDamageShield(
  enemy,
  {
    sourceEnemyId,
    amount,
    remainingRounds = 1,
    id = 'temporary_damage_shield',
    name = id,
    skipNextRoundTick = false,
  } = {},
) {
  const shieldAmount = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  if (!isObject(enemy) || shieldAmount <= 0) return null;
  if (!Array.isArray(enemy._statusEffects)) enemy._statusEffects = [];

  const existing = enemy._statusEffects.find(status => (
    status?.id === id && status?.sourceEnemyId === sourceEnemyId
  ));
  if (existing) {
    existing.remainingRounds = Math.max(
      existing.remainingRounds ?? existing.duration ?? 0,
      Math.max(1, Math.floor(remainingRounds)),
    );
    existing.effect = {
      ...(existing.effect ?? {}),
      damageShield: Math.max(0, existing.effect?.damageShield ?? 0) + shieldAmount,
    };
    if (skipNextRoundTick) existing._skipNextRoundTick = true;
    return existing;
  }

  const status = {
    id,
    name,
    sourceEnemyId: sourceEnemyId ?? enemy.id ?? null,
    remainingRounds: Math.max(1, Math.floor(remainingRounds)),
    effect: { damageShield: shieldAmount },
    ...(skipNextRoundTick ? { _skipNextRoundTick: true } : {}),
  };
  enemy._statusEffects.push(status);
  return status;
}

export function consumeEnemyDamageShield(enemy, rawDamage) {
  let remainingDamage = normalizeNonnegative(rawDamage);
  let absorbed = 0;
  if (!isObject(enemy) || remainingDamage <= 0) {
    return { damage: remainingDamage, absorbed };
  }

  for (const status of enemy._statusEffects ?? []) {
    if (!timedStatusIsActive(status, 'remainingRounds')) continue;
    const available = Math.max(0, Math.floor(status?.effect?.damageShield ?? 0));
    if (available <= 0) continue;
    const used = Math.min(available, remainingDamage);
    status.effect.damageShield = available - used;
    remainingDamage -= used;
    absorbed += used;
    if (remainingDamage <= 0) break;
  }
  enemy._statusEffects = (enemy._statusEffects ?? []).filter(status => (
    !Object.hasOwn(status?.effect ?? {}, 'damageShield')
    || (status.effect.damageShield ?? 0) > 0
  ));
  return { damage: remainingDamage, absorbed };
}

export function addOrRefreshBattlefieldStatus(combat, status) {
  if (!isObject(combat)) return null;
  if (!Array.isArray(combat.battlefieldStatuses)) combat.battlefieldStatuses = [];
  const clock = Number.isFinite(status?.remainingPlayerTurns)
    ? 'remainingPlayerTurns'
    : 'remainingRounds';
  return addOrRefreshTimedStatus(combat.battlefieldStatuses, status, clock);
}

export function tickPlayerActionStatuses(statuses) {
  if (!Array.isArray(statuses)) return [];
  const expired = [];
  for (const status of statuses) {
    if (!Number.isFinite(status?.remainingPlayerTurns)) continue;
    status.remainingPlayerTurns -= 1;
    if (status.remainingPlayerTurns <= 0) expired.push(status);
  }
  for (let index = statuses.length - 1; index >= 0; index--) {
    if (Number.isFinite(statuses[index]?.remainingPlayerTurns)
        && statuses[index].remainingPlayerTurns <= 0) {
      statuses.splice(index, 1);
    }
  }
  return expired;
}

function battlefieldHealingInterference(options, target) {
  const statuses = Array.isArray(options?.battlefieldStatuses)
    ? options.battlefieldStatuses
    : [];
  let strongest = null;
  for (const status of statuses) {
    if (!timedStatusIsActive(status, 'remainingPlayerTurns')) continue;
    const baseReduction = status?.effect?.healingReduction;
    if (!Number.isFinite(baseReduction)) continue;
    const guardedReduction = status?.effect?.guardedHealingReduction;
    const reduction = options?.guarded === true && Number.isFinite(guardedReduction)
      ? guardedReduction
      : baseReduction;
    if (!strongest || reduction > strongest.reduction) {
      strongest = {
        reduction: clamp(reduction, 0, 1),
        status,
        sourceEnemyId: status.sourceEnemyId ?? null,
      };
    }
  }
  return strongest;
}

export function addToken(target, tokenId, stacks = 1) {
  const tokens = ensureTokenBag(target);
  const amount = normalizeStacks(stacks);
  if (!tokens || typeof tokenId !== 'string' || tokenId.length === 0) {
    return { tokenId, stacks: tokens?.[tokenId] ?? 0, added: 0 };
  }

  const current = normalizeStacks(tokens[tokenId]);
  if (amount <= 0) {
    tokens[tokenId] = current;
    return { tokenId, stacks: tokens[tokenId], added: 0 };
  }

  tokens[tokenId] = current + amount;

  return { tokenId, stacks: tokens[tokenId], added: amount };
}

export function consumeToken(target, tokenId, stacks = 1) {
  const tokens = ensureTokenBag(target);
  const amount = normalizeStacks(stacks);
  if (!tokens || typeof tokenId !== 'string' || tokenId.length === 0) {
    return { tokenId, stacks: tokens?.[tokenId] ?? 0, consumed: 0 };
  }

  const current = normalizeStacks(tokens[tokenId]);
  if (amount <= 0) {
    tokens[tokenId] = current;
    return { tokenId, stacks: tokens[tokenId], consumed: 0 };
  }

  const consumed = Math.min(current, amount);
  tokens[tokenId] = current - consumed;

  return { tokenId, stacks: tokens[tokenId], consumed };
}

export function applyDamage(target, rawDamage, random = Math.random) {
  const damageBeforeBlock = normalizeNonnegative(rawDamage);
  const result = {
    ok: isObject(target),
    rawDamage: damageBeforeBlock,
    damage: 0,
    blocked: false,
    hpBefore: isObject(target) ? currentHpFor(target) : 0,
    hpAfter: isObject(target) ? currentHpFor(target) : 0,
    deathsDoorEntered: false,
    deathResistCheck: false,
    deathResistSuccess: null,
    deathResistBefore: null,
    deathResistAfter: null,
    dead: Boolean(target?.dead),
  };

  if (!isObject(target) || target.dead === true) return result;

  if (damageBeforeBlock <= 0) return result;

  let damage = damageBeforeBlock;
  if (normalizeStacks(target.tokens?.block) > 0) {
    consumeToken(target, 'block', 1);
    damage = Math.ceil(damage * BALANCE.combat.tokens.blockDamageMult);
    result.blocked = true;
  }

  result.damage = normalizeNonnegative(damage);
  target.hp = Math.max(0, currentHpFor(target) - result.damage);
  result.hpAfter = target.hp;

  if (result.damage <= 0 || target.hp > 0) {
    result.dead = target.dead === true;
    return result;
  }

  if (!isAlly(target)) {
    target.dead = true;
    result.dead = true;
    return result;
  }

  if (target.deathsDoor === true) {
    const resist = deathResistFor(target);
    const minimum = BALANCE.combat.deathsDoor.minimumResist;
    const nextResist = Math.max(
      minimum,
      resist - BALANCE.combat.deathsDoor.resistLossPerCheck,
    );
    const success = roll(random) < resist;

    result.deathResistCheck = true;
    result.deathResistBefore = resist;
    result.deathResistSuccess = success;

    if (success) {
      target.deathResist = nextResist;
      result.deathResistAfter = target.deathResist;
      result.dead = false;
      return result;
    }

    target.dead = true;
    result.deathResistAfter = resist;
    result.dead = true;
    return result;
  }

  target.deathsDoor = true;
  target.dead = false;
  if (!Number.isFinite(target.deathResist)) {
    target.deathResist = BALANCE.combat.deathsDoor.baseResist;
  }
  result.deathsDoorEntered = true;
  result.dead = false;
  return result;
}

export function healCombatant(target, amount, options = {}) {
  const rawAmount = normalizeNonnegative(amount);
  const localReduction = isObject(target)
    ? healingReceivedReductionFor(target)
    : 0;
  const battlefieldInterference = battlefieldHealingInterference(options, target);
  const battlefieldReduction = battlefieldInterference?.reduction ?? 0;
  const strongestReduction = Math.max(localReduction, battlefieldReduction);
  const activeInterference = battlefieldReduction >= localReduction
    ? battlefieldInterference
    : null;
  const multiplier = clamp(1 - strongestReduction, 0, 1);
  const effectiveAmount = rawAmount * multiplier;
  const hpBefore = isObject(target) ? currentHpFor(target) : 0;
  const maxHp = isObject(target) ? maxHpFor(target) : 0;
  const missingHp = Math.max(0, maxHp - hpBefore);
  const prevented = Math.max(
    0,
    Math.min(rawAmount, missingHp) - Math.min(effectiveAmount, missingHp),
  );
  const result = {
    ok: isObject(target),
    amount: rawAmount,
    rawAmount,
    multiplier,
    prevented,
    healed: 0,
    hpBefore,
    hpAfter: hpBefore,
    deathsDoorCleared: false,
    dead: Boolean(target?.dead),
    interferenceSourceEnemyId: activeInterference?.sourceEnemyId ?? null,
  };

  if (!isObject(target) || target.dead === true) return result;

  const nextRaw = Math.min(maxHp, result.hpBefore + effectiveAmount);
  target.hp = effectiveAmount > 0 && nextRaw > 0
    ? Math.max(1, nextRaw)
    : nextRaw;

  if (target.hp > 0 && target.deathsDoor === true) {
    target.deathsDoor = false;
    result.deathsDoorCleared = true;
  }

  result.hpAfter = target.hp;
  result.healed = Math.max(0, result.hpAfter - result.hpBefore);
  if (
    result.prevented > 0
    && activeInterference
    && typeof options?.onHealingPrevented === 'function'
  ) {
    options.onHealingPrevented({
      prevented: result.prevented,
      status: activeInterference.status,
      sourceEnemyId: activeInterference.sourceEnemyId,
      target,
    });
  }
  return result;
}

export function addStress(target, amount, random = Math.random) {
  const result = {
    ok: isObject(target),
    amount: Number.isFinite(amount) ? amount : 0,
    stressBefore: isObject(target) ? clamp(target.stress ?? 0, 0, 10) : 0,
    stressAfter: isObject(target) ? clamp(target.stress ?? 0, 0, 10) : 0,
    threshold: false,
    resolved: false,
    meltdown: false,
    tokenId: null,
    roll: null,
  };

  if (!isObject(target)) return result;

  target.stress = clamp(result.stressBefore + result.amount, 0, 10);
  result.stressAfter = target.stress;

  if (target.stress < 10 || result.amount <= 0) return result;

  result.threshold = true;
  result.roll = roll(random);

  if (result.roll < BALANCE.combat.stress.resolveChance) {
    target.stress = BALANCE.combat.stress.afterResolve;
    addToken(target, 'strength', 1);
    result.resolved = true;
    result.tokenId = 'strength';
  } else {
    target.stress = BALANCE.combat.stress.afterMeltdown;
    addToken(target, 'vulnerable', 1);
    result.meltdown = true;
    result.tokenId = 'vulnerable';
  }

  result.stressAfter = target.stress;
  return result;
}

export function tickStatusEffects(target, random = Math.random) {
  if (!isObject(target)) return [];

  const statuses = Array.isArray(target.statusEffects) ? target.statusEffects : [];
  const remaining = [];
  const events = [];

  let stoppedByDeath = false;
  for (const status of statuses) {
    if (stoppedByDeath) {
      if (shouldKeepUnprocessedStatus(status)) remaining.push(status);
      continue;
    }

    if (!isObject(status)) continue;

    const hasFiniteDuration = Number.isFinite(status.duration);
    if (hasFiniteDuration && status.duration <= 0) continue;

    const damage = periodicDamageFor(status);
    const damageResult = damage > 0
      ? applyDamage(target, damage, random)
      : {
        rawDamage: 0,
        damage: 0,
        blocked: false,
        hpBefore: currentHpFor(target),
        hpAfter: currentHpFor(target),
        dead: Boolean(target.dead),
        deathsDoorEntered: false,
        deathResistCheck: false,
        deathResistSuccess: null,
        deathResistBefore: null,
        deathResistAfter: null,
      };

    const nextDuration = hasFiniteDuration ? status.duration - 1 : status.duration;
    events.push({
      statusId: status.id ?? null,
      rawDamage: damage,
      damage: damageResult.damage,
      blocked: damageResult.blocked,
      hpBefore: damageResult.hpBefore,
      hpAfter: damageResult.hpAfter,
      dead: damageResult.dead,
      deathsDoorEntered: damageResult.deathsDoorEntered,
      deathResistCheck: damageResult.deathResistCheck,
      deathResistSuccess: damageResult.deathResistSuccess,
      deathResistBefore: damageResult.deathResistBefore,
      deathResistAfter: damageResult.deathResistAfter,
      expired: hasFiniteDuration ? nextDuration <= 0 : false,
    });

    if (!hasFiniteDuration || nextDuration > 0) {
      remaining.push(hasFiniteDuration
        ? { ...status, duration: nextDuration }
        : status);
    }

    if (target.dead === true) {
      stoppedByDeath = true;
    }
  }

  target.statusEffects = remaining;
  return events;
}
