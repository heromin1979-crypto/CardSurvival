import BALANCE from '../../data/gameBalance.js';

const ALL_RANKS = [1, 2, 3, 4];
const FRONT_RANKS = [1, 2];

function cloneArray(value, fallback = []) {
  return Array.isArray(value) ? [...value] : [...fallback];
}

function normalizeStartRank(enemy) {
  const explicitRank = enemy?.combatProfile?.startRank;
  if (Number.isInteger(explicitRank) && explicitRank >= 1 && explicitRank <= 4) {
    return explicitRank;
  }
  return (enemy?.row ?? enemy?.position) === 'back' ? 3 : 1;
}

function normalizeSpeed(value) {
  return Number.isFinite(value) ? value : BALANCE.combat.defaultEnemySpeed;
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

export function decideEnemyIntent(context, enemyId) {
  const profile = context?.enemyProfiles?.[enemyId];
  if (!profile) return null;

  const candidates = context.getUsableEnemySkills?.(enemyId, profile) ?? [];
  const skill = context.pickSkill?.(profile.ai, candidates);
  if (!skill || typeof skill.id !== 'string' || skill.id.length === 0) return null;

  const target = context.pickTarget?.(profile.ai, enemyId, skill);
  const targetId = typeof target === 'string'
    ? target
    : target?.id ?? target?.combatantId ?? null;

  return targetId ? { enemyId, skillId: skill.id, targetId } : null;
}
