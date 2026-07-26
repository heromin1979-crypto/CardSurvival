function candidateId(candidate) {
  if (typeof candidate === 'string') return candidate;
  return candidate?.id ?? candidate?.targetId ?? candidate?.type ?? null;
}

function candidateHp(candidate) {
  const hp = candidate?.hp?.current ?? candidate?.hp ?? candidate?.currentHp;
  return Number.isFinite(hp) ? hp : null;
}

function candidateMaxHp(candidate) {
  const maxHp = candidate?.hp?.max ?? candidate?.maxHp;
  return Number.isFinite(maxHp) && maxHp > 0 ? maxHp : 1;
}

function isAlive(candidate) {
  const hp = candidateHp(candidate);
  return candidate?.dead !== true && (hp === null || hp > 0);
}

function readMetadata(action) {
  return {
    targetPolicy: action?.targetPolicy ?? 'ally',
    targetCount: action?.targetCount ?? 1,
  };
}

function withMetadata(action, { targetPolicy, targetCount }) {
  Object.defineProperties(action, {
    targetPolicy: { value: targetPolicy, enumerable: false },
    targetCount: { value: targetCount, enumerable: false },
  });
  return action;
}

function copyAction(action, changes = {}) {
  return withMetadata({ ...action, ...changes }, readMetadata(action));
}

function telegraphTurns(action) {
  const value = action?.telegraph?.turns ?? action?.telegraph ?? 0;
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function hitCount(action, enemy) {
  const value = action?.hitCount
    ?? action?.effect?.multiHit
    ?? action?.effects?.find(effect => effect?.multiHit)?.multiHit
    ?? enemy?.attacksPerRound
    ?? 1;
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function targetPolicyFor(enemy, action) {
  return action?.targetPolicy
    ?? action?.target?.policy
    ?? enemy?.patternProfile?.targetPolicy
    ?? enemy?.patternProfile?.defaultAction?.target?.side
    ?? 'ally';
}

function targetCountFor(action) {
  const value = action?.targetCount ?? action?.target?.count ?? 1;
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function eligibleCandidates(candidates, targetPolicy) {
  const alive = (candidates ?? []).filter(candidate => candidateId(candidate) && isAlive(candidate));
  if (!['ally', 'enemy', 'self'].includes(targetPolicy)) return alive;
  return alive.filter(candidate => candidate?.side === targetPolicy);
}

function candidatesByPolicy(candidates, targetPolicy, random) {
  const ordered = [...eligibleCandidates(candidates, targetPolicy)];
  const byHealth = () => ordered.sort((a, b) =>
    (candidateHp(a) ?? candidateMaxHp(a)) / candidateMaxHp(a)
    - (candidateHp(b) ?? candidateMaxHp(b)) / candidateMaxHp(b));

  switch (targetPolicy) {
    case 'player':
      return ordered.sort((a, b) => Number(candidateId(b) === 'player') - Number(candidateId(a) === 'player'));
    case 'frontmost':
      return ordered.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    case 'lowest_hp':
    case 'opportunist':
      return byHealth();
    case 'healer':
    case 'sniper':
      return ordered.sort((a, b) => Number(b.isHealer === true) - Number(a.isHealer === true));
    case 'predator':
      return ordered.sort((a, b) => Number((b.statusEffects ?? []).length > 0) - Number((a.statusEffects ?? []).length > 0));
    case 'random':
      return ordered.sort(() => random() - 0.5);
    default:
      return ordered;
  }
}

function selectTargetIds(candidates, targetPolicy, targetCount, random) {
  const ordered = candidatesByPolicy(candidates, targetPolicy, random);
  const limit = targetPolicy === 'all' ? ordered.length : targetCount;
  return ordered.slice(0, limit).map(candidateId);
}

function selectAction(enemy, cooldowns, random) {
  const specialChance = enemy?.patternProfile?.specialActionChance
    ?? enemy?.specialActionChance
    ?? 0.5;

  for (const skill of (enemy?.specialSkills ?? [])) {
    if ((cooldowns?.[skill.id] ?? 0) <= 0 && random() < specialChance) {
      return { ...skill, category: 'special' };
    }
  }

  return {
    ...(enemy?.patternProfile?.defaultAction ?? enemy?.defaultAction),
    actionId: enemy?.patternProfile?.defaultAction?.actionId
      ?? enemy?.defaultAction?.actionId
      ?? 'basic_attack',
    category: 'basic',
  };
}

export function createEnemyActionState() {
  return { committedAction: null };
}

export function commitEnemyAction({
  enemy,
  candidates,
  cooldowns = enemy?._skillCooldowns,
  random = Math.random,
}) {
  const selected = selectAction(enemy, cooldowns, random);
  const actionId = selected.actionId ?? selected.id ?? 'basic_attack';
  const targetPolicy = targetPolicyFor(enemy, selected);
  const targetCount = targetCountFor(selected);
  const remainingTelegraphTurns = telegraphTurns(selected);

  const committedAction = withMetadata({
    actionId,
    category: selected.category ?? 'basic',
    state: remainingTelegraphTurns > 0 ? 'telegraphing' : 'ready',
    targetIds: selectTargetIds(candidates, targetPolicy, targetCount, random),
    remainingTelegraphTurns,
    hitCount: hitCount(selected, enemy),
    motionKey: selected.motionKey ?? actionId,
  }, { targetPolicy, targetCount });

  return { committedAction };
}

export function advanceEnemyAction({ state, stunned = false }) {
  const action = state?.committedAction;
  if (!action) return createEnemyActionState();
  if (stunned || action.remainingTelegraphTurns <= 0) {
    return { committedAction: copyAction(action) };
  }

  const remainingTelegraphTurns = action.remainingTelegraphTurns - 1;
  return {
    committedAction: copyAction(action, {
      remainingTelegraphTurns,
      state: remainingTelegraphTurns === 0 ? 'ready' : 'telegraphing',
    }),
  };
}

export function retargetCommittedAction({ action, candidates }) {
  if (!action) return null;

  const currentTargetsAreAlive = (action.targetIds ?? []).every(targetId =>
    (candidates ?? []).some(candidate => candidateId(candidate) === targetId && isAlive(candidate)),
  );
  if (currentTargetsAreAlive) return action;

  const { targetPolicy, targetCount } = readMetadata(action);
  return copyAction(action, {
    targetIds: selectTargetIds(candidates, targetPolicy, targetCount, () => 0),
  });
}
