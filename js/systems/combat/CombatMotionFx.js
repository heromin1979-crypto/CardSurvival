const LEGACY_ACTION_KINDS = new Set([
  'playerAttack',
  'companionAttack',
  'companionHeal',
  'companionBuff',
  'companionSkill',
  'enemyAttack',
  'enemyAttackCompanion',
  'explode',
  'summon',
]);

function entityIndex(entity, explicitIndex) {
  if (Number.isInteger(explicitIndex)) return explicitIndex;
  if (Number.isInteger(entity?.enemyIndex)) return entity.enemyIndex;
  if (Number.isInteger(entity?.index)) return entity.index;
  if (entity?.id === 'player') return 0;
  return null;
}

export function combatantActionIndex(entity, companionIds = []) {
  if (Number.isInteger(entity?.enemyIndex)) return entity.enemyIndex;
  if (entity?.sourceType === 'player' || entity?.id === 'player') return 0;
  if (entity?.sourceType === 'companion') {
    const index = companionIds.indexOf(entity.sourceId ?? entity.id);
    return index >= 0 ? index : null;
  }
  return entityIndex(entity);
}

function actionIdentity({ skill, action, skillId, actionId }) {
  const resolvedSkillId = skillId ?? skill?.id ?? null;
  if (resolvedSkillId) return { skillId: resolvedSkillId };

  const resolvedActionId = actionId ?? action?.actionId ?? action?.id ?? null;
  return resolvedActionId ? { actionId: resolvedActionId } : {};
}

export function createActionFx({
  actor,
  actorIndex,
  target,
  targetIndex,
  skill = null,
  action = null,
  skillId = null,
  actionId = null,
  motionKey = null,
  impactFx = null,
  damage = 0,
  healing = 0,
  crit = false,
  miss = false,
  killed = false,
  category,
  movement,
  camera,
  count,
} = {}) {
  return {
    kind: 'action',
    actorId: actor?.id ?? null,
    actorSide: actor?.side ?? null,
    actorIndex: entityIndex(actor, actorIndex),
    targetId: target?.id ?? null,
    targetSide: target?.side ?? null,
    targetIndex: entityIndex(target, targetIndex),
    ...actionIdentity({ skill, action, skillId, actionId }),
    motionKey: motionKey ?? skill?.motionKey ?? action?.motionKey ?? null,
    impactFx,
    damage: Number.isFinite(damage) ? damage : 0,
    healing: Number.isFinite(healing) ? healing : 0,
    crit: crit === true,
    miss: miss === true,
    killed: killed === true,
    ...(category !== undefined ? { category } : {}),
    ...(movement !== undefined ? { movement } : {}),
    ...(camera !== undefined ? { camera } : {}),
    ...(count !== undefined ? { count } : {}),
  };
}

function legacyParticipants(fx) {
  const enemyIndex = Number.isInteger(fx.enemyIdx)
    ? fx.enemyIdx
    : Number.isInteger(fx.actorIndex)
      ? fx.actorIndex
      : 0;
  const targetEnemyIndex = Number.isInteger(fx.targetIdx)
    ? fx.targetIdx
    : Number.isInteger(fx.targetIndex)
      ? fx.targetIndex
      : 0;
  const enemyActor = {
    id: fx.actorId ?? `enemy:${enemyIndex}`,
    side: 'enemy',
    enemyIndex,
  };
  const enemyTarget = {
    id: fx.targetId ?? `enemy:${targetEnemyIndex}`,
    side: 'enemy',
    enemyIndex: targetEnemyIndex,
  };
  const player = { id: 'player', side: 'ally', index: 0 };
  const companionActor = {
    id: fx.actorId ?? fx.npcId ?? null,
    side: 'ally',
    index: Number.isInteger(fx.actorIndex) ? fx.actorIndex : null,
  };
  const companionTarget = {
    id: fx.targetId ?? fx.npcId ?? null,
    side: 'ally',
    index: Number.isInteger(fx.targetIndex) ? fx.targetIndex : null,
  };

  switch (fx.kind) {
    case 'playerAttack':
      return { actor: player, target: enemyTarget };
    case 'companionAttack':
      return { actor: companionActor, target: enemyTarget };
    case 'companionHeal':
      return {
        actor: companionActor,
        target: fx.targetId && fx.targetId !== 'player' ? companionTarget : player,
      };
    case 'companionBuff':
    case 'companionSkill':
      return {
        actor: companionActor,
        target: fx.targetId === 'player'
          || fx.skillId === 'nurse_triage'
          ? player
          : companionActor,
      };
    case 'enemyAttack':
    case 'explode':
      return { actor: enemyActor, target: player };
    case 'enemyAttackCompanion':
      return { actor: enemyActor, target: companionTarget };
    case 'summon':
      return { actor: enemyActor, target: enemyActor };
    default:
      return { actor: null, target: null };
  }
}

function legacyImpactFx(fx) {
  if (fx.impactFx ?? fx.fx) return fx.impactFx ?? fx.fx;
  if (fx.kind === 'companionHeal') return 'heal';
  if (fx.kind === 'companionBuff' || fx.kind === 'companionSkill') return 'buff';
  if (fx.kind === 'explode') return 'explode';
  if (fx.kind === 'summon') return 'summon';
  return null;
}

export function normalizeLegacyActionFx(fx) {
  if (!fx || fx.kind === 'action' || !LEGACY_ACTION_KINDS.has(fx.kind)) return fx;

  const { actor, target } = legacyParticipants(fx);
  return createActionFx({
    actor,
    actorIndex: fx.actorIndex,
    target,
    targetIndex: fx.targetIndex,
    skillId: fx.skillId,
    actionId: fx.actionId,
    motionKey: fx.motionKey,
    impactFx: legacyImpactFx(fx),
    damage: fx.damage ?? fx.dmg ?? 0,
    healing: fx.healing ?? fx.amount ?? 0,
    crit: fx.crit,
    miss: fx.miss,
    killed: fx.killed,
    category: fx.category,
    movement: fx.movement,
    camera: fx.camera,
    count: fx.count,
  });
}

export function actionFxToPresentationFx(fx) {
  if (!fx || fx.kind !== 'action') return fx;

  const shared = {
    ...fx,
    fx: fx.impactFx,
    dmg: fx.damage,
    amount: fx.healing,
  };

  if (fx.actorSide === 'ally') {
    if (fx.healing > 0) {
      if (fx.actorId === 'player') {
        return {
          ...shared,
          kind: 'useItem',
          label: `+${fx.healing}`,
        };
      }
      return {
        ...shared,
        kind: 'companionHeal',
        npcId: fx.actorId,
      };
    }
    const supportive = fx.damage === 0
      && fx.miss !== true
      && ['buff', 'debuff', 'support'].includes(fx.impactFx);
    if (supportive) {
      if (fx.actorId !== 'player') {
        return {
          ...shared,
          kind: 'companionSkill',
          npcId: fx.actorId,
        };
      }
      return {
        ...shared,
        kind: 'useItem',
        label: 'ITEM',
      };
    }
    if (fx.targetSide === 'enemy') {
      return fx.actorId === 'player'
        ? {
            ...shared,
            kind: 'playerAttack',
            targetIdx: fx.targetIndex,
          }
        : {
            ...shared,
            kind: 'companionAttack',
            npcId: fx.actorId,
            targetIdx: fx.targetIndex,
          };
    }
    if (fx.actorId !== 'player') {
      return {
        ...shared,
        kind: 'companionSkill',
        npcId: fx.actorId,
      };
    }
    return {
      ...shared,
      kind: 'useItem',
      label: fx.healing > 0 ? `+${fx.healing}` : 'ITEM',
    };
  }

  if (fx.actorSide === 'enemy') {
    if (fx.impactFx === 'explode') {
      return {
        ...shared,
        kind: 'explode',
        enemyIdx: fx.actorIndex,
      };
    }
    if (fx.impactFx === 'summon') {
      return {
        ...shared,
        kind: 'summon',
        enemyIdx: fx.actorIndex,
      };
    }
    if (fx.targetId !== 'player') {
      return {
        ...shared,
        kind: 'enemyAttackCompanion',
        enemyIdx: fx.actorIndex,
        npcId: fx.targetId,
      };
    }
    return {
      ...shared,
      kind: 'enemyAttack',
      enemyIdx: fx.actorIndex,
    };
  }

  return fx;
}
