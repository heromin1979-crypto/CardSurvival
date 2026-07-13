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

export function healCombatant(target, amount) {
  const result = {
    ok: isObject(target),
    amount: normalizeNonnegative(amount),
    healed: 0,
    hpBefore: isObject(target) ? currentHpFor(target) : 0,
    hpAfter: isObject(target) ? currentHpFor(target) : 0,
    deathsDoorCleared: false,
    dead: Boolean(target?.dead),
  };

  if (!isObject(target) || target.dead === true) return result;

  const maxHp = maxHpFor(target);
  const nextRaw = Math.min(maxHp, result.hpBefore + result.amount);
  target.hp = result.amount > 0 && nextRaw > 0
    ? Math.max(1, nextRaw)
    : nextRaw;

  if (target.hp > 0 && target.deathsDoor === true) {
    target.deathsDoor = false;
    result.deathsDoorCleared = true;
  }

  result.hpAfter = target.hp;
  result.healed = Math.max(0, result.hpAfter - result.hpBefore);
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
