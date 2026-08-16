import {
  CHARACTER_COMBAT_LOADOUTS,
  COMMON_COMBAT_LOADOUT,
  COMPANION_COMBAT_LOADOUTS,
  getCombatSkill,
} from '../../data/combatSkills.js';
import { weaponSlotForDefinition } from '../WeaponSlotPolicy.js';

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]),
  );
}

function clamp(value, minimum, maximum, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function nonnegative(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function isPlainObject(value) {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
  );
}

function asObject(value) {
  return value !== null && typeof value === 'object' ? value : null;
}

function commandFailure(reason) {
  return { ok: false, reason };
}

function preExecutionFailure(reason) {
  return {
    ok: false,
    reason,
    turnConsumed: false,
    costsConsumed: false,
    partialApplied: false,
    effectsApplied: 0,
  };
}

function postCostFailure(reason, effectsApplied) {
  return {
    ok: false,
    reason,
    turnConsumed: true,
    costsConsumed: true,
    partialApplied: effectsApplied > 0,
    effectsApplied,
  };
}

function executeWithCommandFinalizer(context, execute) {
  let result;
  try {
    result = execute();
  } catch {
    result = postCostFailure('execution_error', 0);
  }

  if (typeof context.finalizeCommand !== 'function') return result;
  try {
    context.finalizeCommand(result);
  } catch {
    return postCostFailure('execution_error', result?.effectsApplied ?? 0);
  }
  return result;
}

function lookupById(collection, id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  if (!collection) return null;

  if (collection instanceof Map) {
    return collection.get(id) ?? null;
  }
  if (Array.isArray(collection)) {
    return collection.find((entry) => entry?.id === id) ?? null;
  }
  if (typeof collection === 'object') {
    return Object.hasOwn(collection, id) ? collection[id] : null;
  }

  return null;
}

function collectionValues(collection) {
  if (collection instanceof Map) return [...collection.values()];
  if (Array.isArray(collection)) return collection;
  if (collection && typeof collection === 'object') return Object.values(collection);
  return [];
}

function combatantHp(combatant) {
  if (Number.isFinite(combatant?.currentHp)) return combatant.currentHp;
  if (Number.isFinite(combatant?.hp)) return combatant.hp;
  if (Number.isFinite(combatant?.hp?.current)) return combatant.hp.current;
  return null;
}

function isDeadCombatant(combatant, { allowDeathsDoor = false } = {}) {
  if (!combatant || typeof combatant !== 'object') return true;
  if (combatant.dead === true || combatant.isDead === true) return true;

  const hp = combatantHp(combatant);
  if (hp !== null && hp <= 0) {
    return !(allowDeathsDoor && combatant.deathsDoor === true);
  }

  return false;
}

function positiveCost(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function availableFrom(callback, fallbackArgs) {
  if (typeof callback !== 'function') return 0;
  try {
    const value = callback(...fallbackArgs);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function normalizeAccuracy(value) {
  if (!Number.isFinite(value)) return 0.7;
  return Math.min(1, Math.max(0, value));
}

function normalizeRoll(value) {
  if (!Number.isFinite(value)) return null;
  return Math.min(1 - Number.EPSILON, Math.max(0, value));
}

function normalizeDamage(damage) {
  if (
    Array.isArray(damage)
    && damage.length === 2
    && damage.every(Number.isFinite)
    && damage[0] <= damage[1]
  ) {
    return [...damage];
  }
  return [1, 2];
}

function selectCommandTargets(context, actor, primaryTarget, skill) {
  const count = Number.isInteger(skill?.target?.count) && skill.target.count > 0
    ? skill.target.count
    : 1;
  if (count === 1) return [primaryTarget];

  const selected = [primaryTarget];
  for (const candidate of collectionValues(context.combatants)) {
    if (
      selected.length >= count
      || candidate === primaryTarget
      || candidate?.id === primaryTarget?.id
      || candidate?.side !== skill?.target?.side
      || isDeadCombatant(candidate, { allowDeathsDoor: true })
    ) {
      continue;
    }

    try {
      if (context.validatePosition(actor.id, candidate.id, skill)?.ok) {
        selected.push(candidate);
      }
    } catch {
      continue;
    }
  }
  return selected;
}

function executeMultiTargetEffects({
  context,
  actor,
  targets,
  skill,
  effects,
  randomFn,
  usePipeline,
}) {
  let effectsApplied = 0;
  const targetResults = [];

  for (const target of targets) {
    let hitInfo;
    if (usePipeline) {
      try {
        hitInfo = context.resolveHit(actor, target, skill, randomFn);
      } catch {
        return postCostFailure('execution_error', effectsApplied);
      }
    } else {
      let roll;
      try {
        roll = normalizeRoll(randomFn());
      } catch {
        return postCostFailure('execution_error', effectsApplied);
      }
      hitInfo = { hit: roll !== null && roll < normalizeAccuracy(skill.accuracy) };
    }

    const targetResult = {
      targetId: target.id,
      hit: hitInfo?.hit === true,
      effectsApplied: 0,
    };
    if (usePipeline) {
      targetResult.dodged = hitInfo?.dodged === true;
      targetResult.crit = hitInfo?.crit === true;
    }

    if (hitInfo?.hit === true) {
      for (const effect of effects) {
        let effectResult;
        try {
          effectResult = usePipeline
            ? context.applyEffect(effect, actor, target, randomFn, hitInfo)
            : context.applyEffect(effect, actor, target, randomFn);
        } catch {
          return postCostFailure('execution_error', effectsApplied);
        }
        if (effectResult?.ok === false) {
          return postCostFailure(effectResult.reason ?? 'execution_error', effectsApplied);
        }
        effectsApplied++;
        targetResult.effectsApplied++;
      }
    }
    targetResults.push(targetResult);
  }

  const hits = targetResults.filter(result => result.hit);
  const result = {
    ok: true,
    hit: hits.length > 0,
    turnConsumed: true,
    costsConsumed: true,
    effectsApplied,
    partialApplied: false,
    targetResults,
  };
  if (usePipeline) {
    result.dodged = hits.length === 0
      && targetResults.some(targetResult => targetResult.dodged);
    result.crit = hits.some(targetResult => targetResult.crit);
  }
  return result;
}

// instance를 함께 받는 이유: 부착물이 남긴 개조 효과는 카드 인스턴스에 있어
// 정의만 보면 조준경·톱니 개조 같은 효과가 랭크 스킬 경로에서 통째로 사라진다.
export function buildEquipmentSkill(instanceId, definition, instance = null) {
  if (
    typeof instanceId !== 'string'
    || instanceId.length === 0
    || !definition
    || typeof definition !== 'object'
    || Array.isArray(definition)
    || !definition.combat
    || typeof definition.combat !== 'object'
    || Array.isArray(definition.combat)
  ) {
    return null;
  }

  const combat = definition.combat;
  const ammoId = typeof combat.requiresAmmo === 'string'
    && combat.requiresAmmo.length > 0
    ? combat.requiresAmmo
    : null;
  const ranged = ammoId !== null;
  const effects = [{
    type: 'damage',
    value: normalizeDamage(combat.damage),
  }];

  // 부착물(톱니 개조 키트)이 심은 값이 정의값을 이긴다 — 상태이상은 하나만 실린다
  const statusInflict = isPlainObject(instance?._statusInflict)
    ? instance._statusInflict
    : combat.statusInflict;
  if (isPlainObject(statusInflict)) {
    effects.push({
      type: 'status',
      status: cloneValue(statusInflict),
    });
  }

  return {
    id: `equipment:${instanceId}`,
    nameKey: null,
    fallbackName: definition.name ?? definition.id ?? instanceId,
    icon: typeof definition.icon === 'string' && definition.icon.length > 0
      ? definition.icon
      : 'weapon',
    source: 'equipment',
    equipmentInstanceId: instanceId,
    ammoDefinitionId: ammoId,
    weaponType: typeof definition.weaponType === 'string' ? definition.weaponType : null,
    usableFrom: ranged ? [2, 3, 4] : [1, 2],
    target: {
      side: 'enemy',
      ranks: ranged ? [1, 2, 3, 4] : [1, 2],
      count: Number.isInteger(definition.multiTarget)
        && definition.multiTarget > 0
        ? definition.multiTarget
        : 1,
    },
    costs: {
      magazineRound: ranged ? 1 : 0,
      durability: nonnegative(combat.durabilityLoss),
      noise: nonnegative(combat.noiseOnUse),
    },
    accuracy: clamp(combat.accuracy, 0, 1, 0.7),
    critChance: clamp(combat.critChance, 0, 1, 0),
    critMultiplier: Number.isFinite(combat.critMultiplier)
      && combat.critMultiplier > 0
      ? combat.critMultiplier
      : 1.5,
    effects,
  };
}

function getCharacterSkillIds(combatant, gs) {
  if (combatant?.sourceType === 'player') {
    const characterId = gs?.player?.characterId;
    return Object.hasOwn(CHARACTER_COMBAT_LOADOUTS, characterId)
      ? CHARACTER_COMBAT_LOADOUTS[characterId]
      : COMMON_COMBAT_LOADOUT;
  }
  if (combatant?.sourceType === 'companion') {
    return Object.hasOwn(COMPANION_COMBAT_LOADOUTS, combatant.sourceId)
      ? COMPANION_COMBAT_LOADOUTS[combatant.sourceId]
      : COMMON_COMBAT_LOADOUT;
  }
  return COMMON_COMBAT_LOADOUT;
}

function isAttackSkill(skill) {
  return (skill?.effects ?? []).some(effect => effect?.type === 'damage');
}

function buildPlayerAttackSkills(gs) {
  const fallback = () => [getCombatSkill('basic_strike')]
    .filter(Boolean)
    .map(cloneValue);
  if (typeof gs?.getCardDef !== 'function') return fallback();

  const mainId = gs?.player?.equipped?.weapon_main;
  const subId = gs?.player?.equipped?.weapon_sub;
  let mainDefinition;
  let subDefinition;
  try {
    mainDefinition = typeof mainId === 'string' ? gs.getCardDef(mainId) : null;
    subDefinition = typeof subId === 'string' ? gs.getCardDef(subId) : null;
  } catch {
    return fallback();
  }

  const attacks = [];
  if (weaponSlotForDefinition(mainDefinition) === 'weapon_main') {
    const ranged = buildEquipmentSkill(mainId, mainDefinition, gs?.cards?.[mainId]);
    if (ranged) attacks.push(ranged);
  }
  if (weaponSlotForDefinition(subDefinition) === 'weapon_sub') {
    const melee = buildEquipmentSkill(subId, subDefinition, gs?.cards?.[subId]);
    if (melee) attacks.push(melee);
  } else {
    const unarmed = getCombatSkill('basic_strike');
    if (unarmed) attacks.push(cloneValue(unarmed));
  }
  return attacks;
}

export function buildAllyLoadout(combatant, gs) {
  if (combatant?.sourceType === 'companion') {
    const characterSkills = getCharacterSkillIds(combatant, gs)
      .map(getCombatSkill)
      .filter(Boolean)
      .map(cloneValue);

    // 동료도 진형 구성원 — 스왑/넉백/끌기로 밀려난 랭크에서 복귀·방어할 수단이 없으면
    // 근접 스킬이 잠긴 채 유효 행동이 사라진다 (플레이어의 reposition 갭과 동일)
    const commonUtilitySkills = ['guard', 'reposition']
      .map(getCombatSkill)
      .filter(Boolean)
      .map(cloneValue);

    return [...characterSkills, ...commonUtilitySkills];
  }

  if (combatant?.sourceType !== 'player') {
    return getCharacterSkillIds(combatant, gs)
      .map(getCombatSkill)
      .filter(Boolean)
      .map(cloneValue);
  }

  const characterUtilitySkills = getCharacterSkillIds(combatant, gs)
    .map(getCombatSkill)
    .filter(Boolean)
    .filter(skill => !isAttackSkill(skill))
    .map(cloneValue);

  const attackSkills = buildPlayerAttackSkills(gs);

  return [...attackSkills, ...characterUtilitySkills];
}

export function validateSkillCommand(context, command) {
  const ctx = asObject(context);
  const cmd = asObject(command);
  if (
    !ctx
    || !cmd
    || !ctx.combatants
    || !ctx.skillsById
    || typeof cmd.actorId !== 'string'
    || cmd.actorId.length === 0
    || typeof cmd.targetId !== 'string'
    || cmd.targetId.length === 0
    || typeof cmd.skillId !== 'string'
    || cmd.skillId.length === 0
  ) {
    return commandFailure('invalid_context');
  }

  const actor = lookupById(ctx.combatants, cmd.actorId);
  if (isDeadCombatant(actor)) {
    return commandFailure('invalid_actor');
  }
  if (ctx.activeCombatantId !== cmd.actorId) {
    return commandFailure('not_active_actor');
  }

  const target = lookupById(ctx.combatants, cmd.targetId);
  if (isDeadCombatant(target, { allowDeathsDoor: true })) {
    return commandFailure('invalid_target');
  }

  const skill = lookupById(ctx.skillsById, cmd.skillId);
  if (!skill) {
    return commandFailure('invalid_skill');
  }
  if (typeof ctx.validateEligibility === 'function') {
    let eligibility;
    try {
      eligibility = ctx.validateEligibility(actor, skill);
    } catch {
      return commandFailure('invalid_context');
    }
    if (!eligibility?.ok) {
      return commandFailure(eligibility?.reason ?? 'invalid_skill');
    }
  }
  if (skill?.target?.selfOnly === true && cmd.targetId !== cmd.actorId) {
    return commandFailure('invalid_target');
  }

  if (typeof ctx.validatePosition !== 'function') {
    return commandFailure('invalid_position');
  }
  try {
    const position = ctx.validatePosition(cmd.actorId, cmd.targetId, skill);
    if (!position?.ok) {
      return position?.reason ? position : commandFailure('invalid_position');
    }
  } catch {
    return commandFailure('invalid_position');
  }

  const staminaCost = positiveCost(skill.costs?.stamina);
  if (
    staminaCost > 0
    && availableFrom(ctx.getStamina, [actor]) < staminaCost
  ) {
    return commandFailure('insufficient_stamina');
  }

  const magazineRoundCost = positiveCost(skill.costs?.magazineRound);
  if (magazineRoundCost > 0) {
    if (typeof ctx.canFireWeapon !== 'function') {
      return commandFailure('invalid_context');
    }
    let fireCheck;
    try {
      fireCheck = ctx.canFireWeapon(actor, skill);
    } catch {
      return commandFailure('invalid_context');
    }
    if (!fireCheck?.ok) {
      return commandFailure(fireCheck?.reason ?? 'empty_magazine');
    }
  }

  const durabilityCost = positiveCost(skill.costs?.durability);
  if (
    durabilityCost > 0
    && availableFrom(ctx.getDurability, [skill.equipmentInstanceId]) < durabilityCost
  ) {
    return commandFailure('insufficient_durability');
  }

  return {
    ok: true,
    actor,
    target,
    skill,
  };
}

/**
 * Executes a validated combat skill through context callbacks.
 * If an effect callback throws after costs were consumed, this returns
 * execution_error and intentionally does not roll those costs back.
 */
export function executeSkillCommand(context, command, random = Math.random) {
  const validation = validateSkillCommand(context, command);
  if (!validation.ok) return validation;

  const { actor, target, skill } = validation;
  const targets = selectCommandTargets(context, actor, target, skill);
  const effects = Array.isArray(skill.effects) ? skill.effects : [];
  if (typeof context.consumeCosts !== 'function') {
    return preExecutionFailure('execution_error');
  }
  if (effects.length > 0 && typeof context.applyEffect !== 'function') {
    return preExecutionFailure('execution_error');
  }

  let consumeResult;
  try {
    consumeResult = context.consumeCosts(actor, skill);
  } catch {
    return preExecutionFailure('execution_error');
  }
  if (consumeResult?.ok === false) {
    return preExecutionFailure(consumeResult.reason ?? 'execution_error');
  }

  const randomFn = typeof random === 'function' ? random : Math.random;
  // resolveHit 주입 시 판정(명중 보정·회피/치명 토큰)을 호출자에게 위임한다.
  // 미주입 컨텍스트는 기존 단일 명중 굴림 계약을 그대로 유지한다.
  const usePipeline = typeof context.resolveHit === 'function';
  return executeWithCommandFinalizer(context, () => {
    if (targets.length > 1) {
      return executeMultiTargetEffects({
        context,
        actor,
        targets,
        skill,
        effects,
        randomFn,
        usePipeline,
      });
    }

    let hitInfo = null;
    if (usePipeline) {
      try {
        hitInfo = context.resolveHit(actor, target, skill, randomFn);
      } catch {
        return postCostFailure('execution_error', 0);
      }
    } else {
      let roll;
      try {
        roll = normalizeRoll(randomFn());
      } catch {
        return postCostFailure('execution_error', 0);
      }
      hitInfo = { hit: roll !== null && roll < normalizeAccuracy(skill.accuracy) };
    }

    if (hitInfo?.hit !== true) {
      const missResult = {
        ok: true,
        hit: false,
        turnConsumed: true,
        costsConsumed: true,
        effectsApplied: 0,
        partialApplied: false,
      };
      if (usePipeline) missResult.dodged = hitInfo?.dodged === true;
      return missResult;
    }

    let effectsApplied = 0;
    for (const effect of effects) {
      let effectResult;
      try {
        effectResult = usePipeline
          ? context.applyEffect(effect, actor, target, randomFn, hitInfo)
          : context.applyEffect(effect, actor, target, randomFn);
      } catch {
        return postCostFailure('execution_error', effectsApplied);
      }

      if (effectResult?.ok === false) {
        return postCostFailure(effectResult.reason ?? 'execution_error', effectsApplied);
      }

      effectsApplied++;
    }

    const hitResult = {
      ok: true,
      hit: true,
      turnConsumed: true,
      costsConsumed: true,
      effectsApplied,
      partialApplied: false,
    };
    if (usePipeline) {
      hitResult.dodged = false;
      hitResult.crit = hitInfo?.crit === true;
    }
    return hitResult;
  });
}

export function useCombatItem(context, actorId, itemInstanceId) {
  const ctx = asObject(context);
  if (!ctx || !ctx.combatants) {
    return commandFailure('invalid_actor');
  }

  const actor = lookupById(ctx.combatants, actorId);
  if (isDeadCombatant(actor)) {
    return commandFailure('invalid_actor');
  }
  if (ctx.activeCombatantId !== actorId) {
    return commandFailure('not_active_actor');
  }
  if (actor.itemUsedThisTurn === true) {
    return commandFailure('item_already_used');
  }
  if (typeof ctx.consumeCombatItem !== 'function') {
    return commandFailure('item_unavailable');
  }

  let result;
  try {
    result = ctx.consumeCombatItem(itemInstanceId, actor);
  } catch {
    return commandFailure('item_error');
  }

  if (result?.ok !== true) {
    if (result?.ok === false && result.reason) return result;
    return commandFailure('item_unavailable');
  }

  actor.itemUsedThisTurn = true;
  return {
    ok: true,
    turnConsumed: false,
    effects: result?.effects ?? [],
  };
}
