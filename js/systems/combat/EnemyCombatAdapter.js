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
  const explicitRank = enemy?.combatProfile?.startRank;
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

export function buildEnemyProfile(enemy = {}) {
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

