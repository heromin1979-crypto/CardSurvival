function actionDefinitionFor(enemy, action) {
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

function statusDefinitionsFor(enemy, definition) {
  const statuses = [];
  if (enemy?.statusInflict?.id) {
    const status = {
      ...enemy.statusInflict,
      effect: { ...(enemy.statusInflict.effect ?? {}) },
    };
    if (enemy._inflictEscalation && Number.isFinite(status.effect.hpLossPerRound)) {
      status.effect.hpLossPerRound += enemy._inflictEscalation;
    }
    statuses.push(status);
  }

  if (Number.isFinite(enemy?.infectionChance) && enemy.infectionChance > 0) {
    statuses.push({
      id: 'infection',
      name: '감염',
      duration: 1,
      effect: { infection: 10 },
      chance: enemy.infectionChance,
    });
  }

  for (const [effectId, value] of Object.entries(enemy?.onHitEffect ?? {})) {
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

  const hitCount = Number.isFinite(action.hitCount)
    ? Math.max(1, Math.floor(action.hitCount))
    : 1;
  const damageRange = damageRangeFor(enemy, definition);
  const accuracy = Number.isFinite(definition.accuracy)
    ? Math.max(0, Math.min(1, definition.accuracy))
    : Math.max(0, Math.min(1, enemy?.attack?.accuracy ?? 1));
  const statuses = statusDefinitionsFor(enemy, definition);
  const forcedMove = forcedMoveFor(definition);
  const affectedTargetIds = [];
  const hitPlan = enemy?.spreadAttacks === true && targetIds.length > 1
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
          actionId: action.actionId,
          motionKey: action.motionKey,
          hitIndex,
          miss: true,
        });
        services.addLog(`${enemy?.name ?? enemy?.id ?? '적'} → ${targetId}: 빗나감`);
        continue;
      }

      const amount = rollDamage(damageRange, random);
      const result = services.damageTarget(targetId, amount, {
        actionId: action.actionId,
        category: action.category,
        motionKey: action.motionKey,
        hitIndex,
        hitCount,
      });
      const succeeded = hitSucceeded(result);
      if (succeeded && !affectedTargetIds.includes(targetId)) {
        affectedTargetIds.push(targetId);
      }
      services.emitFx({
        kind: 'enemyAction',
        enemyId: enemy?.id ?? null,
        targetId,
        actionId: action.actionId,
        motionKey: action.motionKey,
        hitIndex,
        damage: succeeded ? (result?.damage ?? amount) : 0,
        miss: !succeeded,
      });
      services.addLog(succeeded
        ? `${enemy?.name ?? enemy?.id ?? '적'} → ${targetId}: ${result?.damage ?? amount} 피해`
        : `${enemy?.name ?? enemy?.id ?? '적'} → ${targetId}: 회피`);
  }

  for (const targetId of affectedTargetIds) {
    for (const status of statuses) {
      if (Number.isFinite(status.chance) && random() >= status.chance) continue;
      services.addStatus(targetId, {
        ...status,
        effect: { ...(status.effect ?? {}) },
      });
    }
    if (Number.isFinite(forcedMove) && forcedMove !== 0) {
      services.moveTarget(targetId, forcedMove);
    }
  }
}
