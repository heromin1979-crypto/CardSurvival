import BALANCE from '../../data/gameBalance.js';

const ALL_RANKS = [1, 2, 3, 4];
const FRONT_RANKS = [1, 2];

function cloneArray(value, fallback = []) {
  return Array.isArray(value) ? [...value] : [...fallback];
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]),
  );
}

function normalizeStartRank(enemy) {
  const explicitRank = enemy?.startRank ?? enemy?.combatProfile?.startRank;
  if (Number.isInteger(explicitRank) && explicitRank >= 1 && explicitRank <= 4) {
    return explicitRank;
  }
  return (enemy?.row ?? enemy?.position) === 'back' ? 3 : 1;
}

function normalizeSpeed(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? value
    : BALANCE.combat.defaultEnemySpeed;
}

function normalizeDamage(value) {
  return Array.isArray(value) && value.length === 2
    ? [...value]
    : [...BALANCE.combat.enemyDefaultDamage];
}

function normalizeAccuracy(value) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : BALANCE.combat.enemyBaseAccuracy;
}

function buildLegacyBasicAttack(enemy) {
  const ranged = enemy?.attackType === 'ranged';
  const ranks = ranged ? ALL_RANKS : FRONT_RANKS;

  return {
    id: `enemy:${enemy?.id ?? 'unknown'}:basic_attack`,
    source: 'enemy',
    usableFrom: [...ranks],
    target: {
      side: 'ally',
      ranks: [...ranks],
      count: 1,
    },
    accuracy: normalizeAccuracy(enemy?.attack?.accuracy),
    effects: [{
      type: 'damage',
      value: normalizeDamage(enemy?.attack?.damage),
    }],
  };
}

function actionIdForProfile(enemy, action) {
  const actionId = action?.actionId ?? action?.id ?? 'basic_attack';
  if (typeof action?.rankSkillId === 'string' && action.rankSkillId.length > 0) {
    return action.rankSkillId;
  }
  return actionId === 'basic_attack'
    ? `enemy:${enemy?.id ?? 'unknown'}:basic_attack`
    : actionId;
}

function buildActionSkill(enemy, action) {
  const ranged = enemy?.attackType === 'ranged';
  const usableFrom = cloneArray(action?.usableFrom, ranged ? ALL_RANKS : FRONT_RANKS);
  const targetRanks = cloneArray(action?.target?.ranks, ranged ? ALL_RANKS : FRONT_RANKS);
  const damageEffects = cloneArray(action?.effects)
    .filter(effect => effect?.type === 'damage')
    .map(cloneValue);

  return {
    id: actionIdForProfile(enemy, action),
    source: 'enemy',
    usableFrom,
    target: {
      side: 'ally',
      ranks: targetRanks,
      count: Number.isInteger(action?.target?.count) && action.target.count > 0
        ? action.target.count
        : 1,
    },
    accuracy: normalizeAccuracy(action?.accuracy ?? enemy?.attack?.accuracy),
    effects: damageEffects.length > 0
      ? damageEffects
      : [{ type: 'damage', value: normalizeDamage(enemy?.attack?.damage) }],
    targetPolicy: action?.targetPolicy ?? enemy?.patternProfile?.targetPolicy ?? 'frontmost',
    hitCount: Number.isInteger(action?.hitCount) && action.hitCount > 0 ? action.hitCount : 1,
    telegraph: cloneValue(action?.telegraph ?? { turns: 0 }),
    motionKey: action?.motionKey ?? action?.actionId ?? action?.id ?? 'basic_attack',
    ...(action?.nameKey ? { nameKey: action.nameKey } : {}),
    ...(action?.name ? { fallbackName: action.name } : {}),
  };
}

function buildActionSkills(enemy) {
  const defaultAction = enemy?.patternProfile?.defaultAction;
  if (!defaultAction) return [];

  return [
    defaultAction,
    ...(enemy?.specialSkills ?? []),
    ...(enemy?.timedThreat ? [enemy.timedThreat] : []),
  ].map(action => buildActionSkill(enemy, action));
}

export function buildEnemyProfile(enemy = {}) {
  const actionSkills = buildActionSkills(enemy);
  if (actionSkills.length > 0) {
    return {
      speed: normalizeSpeed(enemy?.combatProfile?.speed ?? enemy?.speed),
      startRank: normalizeStartRank(enemy),
      skillIds: actionSkills.map(skill => skill.id),
      skills: actionSkills,
      ai: enemy?.patternProfile?.role ?? enemy?.aiPattern ?? 'normal',
    };
  }

  if (enemy?.combatProfile) {
    const combatProfile = enemy.combatProfile;
    return {
      speed: normalizeSpeed(combatProfile.speed ?? enemy.speed),
      startRank: normalizeStartRank(enemy),
      skillIds: cloneArray(combatProfile.skillIds),
      skills: cloneArray(combatProfile.skills).map(cloneValue),
      ai: combatProfile.ai ?? enemy.aiPattern ?? 'normal',
    };
  }

  return {
    speed: normalizeSpeed(enemy?.speed),
    startRank: normalizeStartRank(enemy),
    ai: enemy?.aiPattern ?? 'normal',
    skills: [buildLegacyBasicAttack(enemy)],
  };
}

