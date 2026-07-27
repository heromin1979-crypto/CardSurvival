function actionDefinitionFor(enemy, action) {
  if (action?.category === 'timed_threat') {
    return enemy?.timedThreat
      && enemy.timedThreat.id === action.actionId
      ? enemy.timedThreat
      : null;
  }

  if (enemy?.bossPattern) {
    if (action?.category === 'basic') {
      return (enemy.bossPattern.basicAttacks ?? []).find(definition =>
        (definition?.actionId ?? definition?.id) === action.actionId) ?? null;
    }
    if (action?.category === 'special') {
      const definition = enemy.bossPattern.specialSkill;
      return definition
        && (definition.actionId ?? definition.id) === action.actionId
        ? definition
        : null;
    }
    if (action?.category === 'ultimate') {
      const definition = enemy.bossPattern.ultimate;
      return definition
        && (definition.actionId ?? definition.id) === action.actionId
        ? definition
        : null;
    }
  }

  if (action?.category === 'special') {
    return (enemy?.specialSkills ?? []).find(skill =>
      (skill?.actionId ?? skill?.id) === action.actionId) ?? null;
  }

  const defaultAction = enemy?.patternProfile?.defaultAction ?? enemy?.defaultAction;
  if (defaultAction && (defaultAction.actionId ?? defaultAction.id ?? 'basic_attack') === action?.actionId) {
    return defaultAction;
  }
  return enemy?.attack ? { ...enemy.attack, actionId: action?.actionId ?? 'basic_attack' } : null;
}

function damageRangeFor(enemy, definition) {
  if (Array.isArray(definition?.damage)) return definition.damage;
  const damageEffect = (definition?.effects ?? []).find(effect => effect?.type === 'damage');
  if (Array.isArray(damageEffect?.value)) return damageEffect.value;
  if (Number.isFinite(damageEffect?.value)) return [damageEffect.value, damageEffect.value];
  if (Array.isArray(enemy?.attack?.damage)) return enemy.attack.damage;
  return [0, 0];
}

function rollDamage(range, random) {
  const min = Number.isFinite(range?.[0]) ? Math.floor(range[0]) : 0;
  const max = Number.isFinite(range?.[1]) ? Math.floor(range[1]) : min;
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  if (low === high) return Math.max(0, low);
  return Math.max(0, low + Math.floor(random() * (high - low + 1)));
}

function clampUnit(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
}

function statusFromEffect(effectDefinition) {
  const statusEffect = effectDefinition?.effect
    ? { ...effectDefinition.effect }
    : effectDefinition?.type === 'status' && Number.isFinite(effectDefinition.value)
      ? { [effectDefinition.id]: effectDefinition.value }
      : {};
  return {
    id: effectDefinition.id,
    name: effectDefinition.name ?? effectDefinition.id,
    duration: effectDefinition.duration ?? 1,
    ...(Number.isFinite(effectDefinition.remainingPlayerTurns)
      ? { remainingPlayerTurns: effectDefinition.remainingPlayerTurns }
      : {}),
    effect: statusEffect,
    ...(effectDefinition?.type !== 'status' && Number.isFinite(effectDefinition.value)
      ? { value: effectDefinition.value }
      : {}),
    ...(Number.isFinite(effectDefinition.chance)
      ? { chance: effectDefinition.chance }
      : {}),
  };
}

function statusDefinitionsFor(enemy, definition, { includeEnemyDefaults = true } = {}) {
  const statuses = [];
  if (includeEnemyDefaults && enemy?.statusInflict?.id) {
    const status = {
      ...enemy.statusInflict,
      effect: { ...(enemy.statusInflict.effect ?? {}) },
    };
    if (enemy._inflictEscalation && Number.isFinite(status.effect.hpLossPerRound)) {
      status.effect.hpLossPerRound += enemy._inflictEscalation;
    }
    statuses.push(status);
  }

  if (includeEnemyDefaults && Number.isFinite(enemy?.infectionChance) && enemy.infectionChance > 0) {
    statuses.push({
      id: 'infection',
      name: '감염',
      duration: 1,
      effect: { infection: 10 },
      chance: enemy.infectionChance,
    });
  }

  for (const [effectId, value] of Object.entries(
    includeEnemyDefaults ? enemy?.onHitEffect ?? {} : {},
  )) {
    if (!Number.isFinite(value) || value === 0) continue;
    statuses.push({
      id: `${effectId}_exposure`,
      name: effectId === 'infection' ? '감염 노출' : effectId === 'radiation' ? '방사선 노출' : effectId,
      duration: 1,
      effect: { [effectId]: value },
    });
  }

  if (definition?.statusInflict?.id) {
    statuses.push({
      ...definition.statusInflict,
      effect: { ...(definition.statusInflict.effect ?? {}) },
    });
  }

  const effect = definition?.effect;
  if (effect?.status?.id) statuses.push({ ...effect.status, effect: { ...(effect.status.effect ?? {}) } });

  const dot = effect?.dot ?? effect?.bleed;
  if (dot) {
    const id = effect.bleed ? 'bleed' : `${definition.id ?? definition.actionId}_dot`;
    statuses.push({
      id,
      name: dot.name ?? id,
      duration: dot.duration ?? effect.duration ?? 2,
      effect: { hpLossPerRound: dot.hpLossPerRound ?? dot.hpPerRound ?? 0 },
    });
  }
  if (effect?.poison) {
    statuses.push({
      id: 'poison',
      name: 'poison',
      duration: effect.duration ?? effect.dot?.duration ?? 3,
      effect: { hpLossPerRound: effect.dot?.hpLossPerRound ?? 4 },
    });
  }
  if (effect?.stun) {
    statuses.push({ id: 'stun', name: 'stun', duration: effect.stun, effect: {} });
  }
  if (Number.isFinite(definition?.stunChance) && definition.stunChance > 0) {
    statuses.push({
      id: 'stun',
      name: 'stun',
      duration: 1,
      effect: { skipTurn: true },
      chance: definition.stunChance,
    });
  }

  for (const effectDefinition of (definition?.effects ?? [])) {
    if (!['status', 'targetStatus'].includes(effectDefinition?.type)
      || !effectDefinition.id) {
      continue;
    }
    statuses.push(statusFromEffect(effectDefinition));
  }

  return statuses;
}

function forcedMoveFor(definition) {
  if (Number.isFinite(definition?.effect?.forcedMove)) return definition.effect.forcedMove;
  const moveEffect = (definition?.effects ?? []).find(effect =>
    effect?.type === 'move' || effect?.type === 'forcedMove');
  return Number.isFinite(moveEffect?.distance) ? moveEffect.distance : null;
}

function hitSucceeded(result) {
  return result?.dodged !== true && result?.missed !== true;
}

function rollCount(value, random) {
  if (Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (!Array.isArray(value)) return 0;
  const min = Number.isFinite(value[0]) ? Math.floor(value[0]) : 0;
  const max = Number.isFinite(value[1]) ? Math.floor(value[1]) : min;
  const low = Math.max(0, Math.min(min, max));
  const high = Math.max(low, Math.max(min, max));
  return low === high ? low : low + Math.floor(random() * (high - low + 1));
}

function actionModifiersFor(definition) {
  const armorPiercing = clampUnit(
    definition?.armorPiercing ?? definition?.effect?.armorPiercing,
  );
  const executeThreshold = clampUnit(
    definition?.executeThreshold ?? definition?.effect?.executeThreshold,
  );
  const executeBonusMultiplier = definition?.executeBonusMultiplier
    ?? definition?.effect?.executeBonusMultiplier;
  const damageType = definition?.damageType ?? definition?.effect?.damageType;

  return {
    ...(armorPiercing !== null ? { armorPiercing } : {}),
    ...(executeThreshold !== null ? { executeThreshold } : {}),
    ...(Number.isFinite(executeBonusMultiplier)
      ? { executeBonusMultiplier }
      : {}),
    ...(typeof damageType === 'string' && damageType.length > 0
      ? { damageType }
      : {}),
  };
}

function hasTargetScopedTypedEffect(definition) {
  return (definition?.effects ?? []).some(effect =>
    ['targetStatus', 'forcedMove', 'resource', 'weaponLock'].includes(effect?.type));
}

function resolvedTargetEffect(type, affectedTargetIds) {
  return {
    type,
    skipped: false,
    targetIds: [...affectedTargetIds],
  };
}

function partyDamageOutcomes(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result?.targets)) return result.targets;
  return [];
}

function resolvedHitCount(definition, action, services) {
  const rule = definition?.hitCountRule;
  if (rule?.type === 'livingMinions' && typeof rule.enemyId === 'string') {
    const livingMinions = Math.max(
      0,
      Math.floor(services.countLivingEnemies?.(rule.enemyId) ?? 0),
    );
    const base = Number.isFinite(rule.base) ? Math.floor(rule.base) : 1;
    const perMinion = Number.isFinite(rule.perMinion)
      ? Math.floor(rule.perMinion)
      : 1;
    const minimum = Number.isFinite(rule.min) ? Math.floor(rule.min) : 1;
    const maximum = Number.isFinite(rule.max)
      ? Math.max(minimum, Math.floor(rule.max))
      : Number.MAX_SAFE_INTEGER;
    return Math.max(minimum, Math.min(maximum, base + livingMinions * perMinion));
  }
  return Number.isFinite(action.hitCount)
    ? Math.max(1, Math.floor(action.hitCount))
    : 1;
}

function resolutionThresholdFor(definition, action) {
  const threshold = definition?.telegraphDamageThreshold;
  if (!threshold
      || !Number.isFinite(threshold.amount)
      || (action?.telegraphDamageTaken ?? 0) < threshold.amount) {
    return {
      multiplier: 1,
      statusMagnitudeKeys: new Set(),
    };
  }
  return {
    multiplier: Number.isFinite(threshold.resolutionMultiplier)
      ? Math.max(0, threshold.resolutionMultiplier)
      : 1,
    statusMagnitudeKeys: new Set(threshold.statusMagnitudeKeys ?? []),
  };
}

function scaleStatusForResolution(status, resolution) {
  if (resolution.multiplier === 1 || resolution.statusMagnitudeKeys.size === 0) {
    return status;
  }
  const effect = { ...(status.effect ?? {}) };
  for (const key of resolution.statusMagnitudeKeys) {
    if (Number.isFinite(effect[key])) {
      effect[key] *= resolution.multiplier;
    }
  }
  return { ...status, effect };
}

export function executeEnemyAction({
  enemy,
  action,
  services,
  random = Math.random,
}) {
  if (!action || action.state !== 'ready') return;
  const targetIds = Array.isArray(action.targetIds) ? action.targetIds.filter(Boolean) : [];
  if (targetIds.length === 0) return;

  const definition = actionDefinitionFor(enemy, action);
  if (!definition) return;

  const hitCount = resolvedHitCount(definition, action, services);
  const resolution = resolutionThresholdFor(definition, action);
  const damageRange = damageRangeFor(enemy, definition);
  const effects = definition.effects ?? [];
  const accuracy = Number.isFinite(definition.accuracy)
    ? Math.max(0, Math.min(1, definition.accuracy))
    : Math.max(0, Math.min(1, enemy?.attack?.accuracy ?? 1));
  const canDealDirectDamage = damageRange
    .some(value => Number.isFinite(value) && value > 0);
  const canDealPartyDamage = effects.some(effect => (
    effect?.type === 'partyDamage'
    && (Array.isArray(effect.value) ? effect.value : [effect.value])
      .some(value => Number.isFinite(value) && value > 0)
  ));
  const canDealDamage = canDealDirectDamage || canDealPartyDamage;
  const statuses = statusDefinitionsFor(enemy, definition, {
    includeEnemyDefaults: action.category !== 'timed_threat' && canDealDamage,
  });
  const forcedMove = forcedMoveFor(definition);
  const hasTargetEffects = statuses.length > 0
    || (Number.isFinite(forcedMove) && forcedMove !== 0)
    || hasTargetScopedTypedEffect(definition);
  const hasPartyDamage = effects.some(effect => effect?.type === 'partyDamage');
  const affectedTargetIds = !canDealDirectDamage && hasTargetEffects && !hasPartyDamage
    ? [...new Set(targetIds)]
    : [];
  const damageResults = [];
  const actionMetadata = {
    actionId: action.actionId,
    category: action.category,
    motionKey: action.motionKey,
    ...actionModifiersFor(definition),
  };
  const actionPresentation = {
    actionId: action.actionId,
    category: action.category,
    motionKey: action.motionKey,
    impactFx: definition?.impactFx,
    movement: definition?.movement,
    camera: definition?.camera,
  };
  const hitPlan = !canDealDirectDamage
    ? []
    : enemy?.spreadAttacks === true && targetIds.length > 1
    ? Array.from({ length: hitCount }, (_, hitIndex) => ({
        targetId: targetIds[hitIndex % targetIds.length],
        hitIndex,
      }))
    : targetIds.flatMap(targetId =>
        Array.from({ length: hitCount }, (_, hitIndex) => ({ targetId, hitIndex }))
      );

  for (const { targetId, hitIndex } of hitPlan) {
      const hit = random() < accuracy;
      if (!hit) {
        services.emitFx({
          kind: 'enemyAction',
          enemyId: enemy?.id ?? null,
          targetId,
          ...actionPresentation,
          hitIndex,
          miss: true,
        });
        services.addLog(`${enemy?.name ?? enemy?.id ?? '적'} → ${targetId}: 빗나감`);
        continue;
      }

      const amount = rollDamage(damageRange, random);
      const result = services.damageTarget(targetId, amount, {
        ...actionMetadata,
        hitIndex,
        hitCount,
      });
      damageResults.push({ targetId, amount: result?.damage ?? amount, result });
      const succeeded = hitSucceeded(result);
      if (succeeded && !affectedTargetIds.includes(targetId)) {
        affectedTargetIds.push(targetId);
      }
      services.emitFx({
        kind: 'enemyAction',
        enemyId: enemy?.id ?? null,
        targetId,
        ...actionPresentation,
        hitIndex,
        damage: succeeded ? (result?.damage ?? amount) : 0,
        miss: !succeeded,
      });
      services.addLog(succeeded
        ? `${enemy?.name ?? enemy?.id ?? '적'} → ${targetId}: ${result?.damage ?? amount} 피해`
        : `${enemy?.name ?? enemy?.id ?? '적'} → ${targetId}: 회피`);
  }

  const partyDamageResolutions = new Map();
  for (const effect of effects) {
    if (effect?.type !== 'partyDamage') continue;
    const rolledAmount = rollDamage(
      Array.isArray(effect.value) ? effect.value : [effect.value, effect.value],
      random,
    );
    const amount = Math.floor(rolledAmount * resolution.multiplier);
    const result = services.damageParty?.(amount, actionMetadata);
    for (const outcome of partyDamageOutcomes(result)) {
      const targetId = outcome?.targetId;
      const damageResult = outcome?.result ?? outcome;
      if (!targetId) continue;
      const succeeded = hitSucceeded(damageResult);
      if (succeeded && !affectedTargetIds.includes(targetId)) {
        affectedTargetIds.push(targetId);
      }
      services.emitFx({
        kind: 'enemyAction',
        enemyId: enemy?.id ?? null,
        targetId,
        ...actionPresentation,
        damage: succeeded ? (damageResult?.damage ?? amount) : 0,
        miss: !succeeded,
      });
    }
    partyDamageResolutions.set(effect, { type: 'partyDamage', amount, result });
  }

  for (const targetId of affectedTargetIds) {
    for (const status of statuses) {
      if (Number.isFinite(status.chance) && random() >= status.chance) continue;
      const resolvedStatus = scaleStatusForResolution(status, resolution);
      services.addStatus(targetId, {
        ...resolvedStatus,
        effect: { ...(resolvedStatus.effect ?? {}) },
      });
    }
    if (Number.isFinite(forcedMove) && forcedMove !== 0) {
      services.moveTarget(targetId, forcedMove);
    }
  }

  const resolvedEffects = [];
  for (const effect of effects) {
    switch (effect?.type) {
      case 'damage':
        resolvedEffects.push(resolvedTargetEffect('damage', affectedTargetIds));
        break;
      case 'status':
      case 'targetStatus':
        resolvedEffects.push(resolvedTargetEffect(effect.type, affectedTargetIds));
        break;
      case 'move':
      case 'forcedMove':
        resolvedEffects.push(resolvedTargetEffect(effect.type, affectedTargetIds));
        break;
      case 'selfHeal': {
        const amount = rollDamage(
          Array.isArray(effect.value) ? effect.value : [effect.value, effect.value],
          random,
        );
        const healed = services.healSelf?.(amount);
        resolvedEffects.push({ type: 'selfHeal', amount, healed });
        break;
      }
      case 'selfStatus': {
        const status = statusFromEffect(effect);
        services.addSelfStatus?.(status);
        resolvedEffects.push({ type: 'selfStatus', status });
        break;
      }
      case 'summon': {
        if (typeof effect.enemyId !== 'string') {
          resolvedEffects.push({
            type: effect.type,
            skipped: true,
            reason: 'unsupported',
          });
          break;
        }
        const count = rollCount(effect.count, random);
        const spawned = services.summonEnemy?.(
          effect.enemyId,
          count,
          effect.row ?? 'front',
        ) ?? 0;
        resolvedEffects.push({
          type: 'summon',
          enemyId: effect.enemyId,
          count,
          spawned,
        });
        break;
      }
      case 'consumeSummons': {
        const consumed = Math.max(
          0,
          Math.floor(services.consumeSummons?.(effect.enemyId) ?? 0),
        );
        let healed = 0;
        let strength = 0;
        if (consumed > 0) {
          const healPerSummon = Number.isFinite(effect.healPerSummon)
            ? Math.max(0, effect.healPerSummon)
            : 0;
          const strengthPerSummon = Number.isFinite(effect.strengthPerSummon)
            ? Math.max(0, effect.strengthPerSummon)
            : 0;
          healed = services.healSelf?.(consumed * healPerSummon) ?? 0;
          strength = consumed * strengthPerSummon;
          if (strength > 0 && effect.strengthStatus?.id) {
            services.addSelfStatus?.({
              id: effect.strengthStatus.id,
              name: effect.strengthStatus.name ?? effect.strengthStatus.id,
              duration: effect.strengthStatus.duration ?? 1,
              effect: { outgoingDamageIncrease: strength },
            });
          }
        }
        resolvedEffects.push({
          type: 'consumeSummons',
          enemyId: effect.enemyId,
          consumed,
          healed,
          strength,
        });
        break;
      }
      case 'partyDamage': {
        resolvedEffects.push(partyDamageResolutions.get(effect));
        break;
      }
      case 'battlefieldStatus': {
        const status = statusFromEffect(effect);
        services.setBattlefieldStatus?.(status);
        resolvedEffects.push({ type: 'battlefieldStatus', status });
        break;
      }
      case 'resource':
        for (const targetId of affectedTargetIds) {
          services.modifyResource?.(targetId, effect.resource, effect.value);
        }
        resolvedEffects.push(resolvedTargetEffect('resource', affectedTargetIds));
        break;
      case 'weaponLock':
        for (const targetId of affectedTargetIds) {
          services.lockWeapon?.(targetId, effect.tag, effect.duration);
        }
        resolvedEffects.push(resolvedTargetEffect('weaponLock', affectedTargetIds));
        break;
      case 'noise':
        if (Number.isFinite(effect.value)) {
          services.addNoise?.(effect.value);
          resolvedEffects.push({ type: 'noise', value: effect.value });
        } else {
          resolvedEffects.push({
            type: effect.type,
            skipped: true,
            reason: 'unsupported',
          });
        }
        break;
      default:
        resolvedEffects.push({
          type: effect?.type,
          skipped: true,
          reason: 'unsupported',
        });
    }
  }

  return { affectedTargetIds, damageResults, resolvedEffects };
}

export function resolveEnemyDamageResponsePassives({
  enemy,
  attackerId,
  damageType,
  isCounter = false,
  services,
}) {
  const resolvedPassives = [];

  for (const passive of (enemy?.bossPattern?.passives ?? [])) {
    if (passive?.type === 'counterAttack'
      && isCounter !== true
      && typeof passive.actionId === 'string'
      && attackerId) {
      services?.queueCounterAction?.(
        passive.actionId,
        attackerId,
        passive.maxPerRound,
      );
      resolvedPassives.push({
        type: 'counterAttack',
        actionId: passive.actionId,
        attackerId,
        maxPerRound: passive.maxPerRound,
      });
    } else if (passive?.type === 'resistanceShift'
      && passive.source === 'lastDamageType'
      && damageType) {
      services?.setResistanceShift?.(
        damageType,
        passive.duration,
        passive.value,
      );
      resolvedPassives.push({
        type: 'resistanceShift',
        damageType,
        duration: passive.duration,
        value: passive.value,
      });
    }
  }

  return { resolvedPassives };
}
