import BALANCE from '../../data/gameBalance.js';
import { consumeToken } from './CombatStatusSystem.js';

// 공격 판정 수학 전용 순수 모듈.
// GameState를 직접 읽지 않고 호출자(CombatSystem)가 보정값을 주입한다 —
// 아군 스킬과 적 공격이 같은 함수를 지나야 토큰이 진영과 무관하게 일관 동작한다.

const ATTACK_BOOST_TOKENS = ['strength', 'power', 'improvised'];

function tokenBalance() {
  return BALANCE.combat.tokens;
}

function hasToken(target, tokenId) {
  return Number.isFinite(target?.tokens?.[tokenId]) && target.tokens[tokenId] > 0;
}

function normalizeDamage(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roll(random) {
  if (typeof random !== 'function') return 0;
  try {
    const value = random();
    if (!Number.isFinite(value)) return 0;
    return Math.min(1 - Number.EPSILON, Math.max(0, value));
  } catch {
    return 0;
  }
}

export function composeAccuracy(base, modifiers = {}) {
  const safeBase = Number.isFinite(base) ? base : 0.7;
  const sum = Object.values(modifiers)
    .filter(Number.isFinite)
    .reduce((total, value) => total + value, safeBase);
  return Math.min(1, Math.max(0.05, sum));
}

export function resolveHitRoll({ attacker, defender, accuracy, random = Math.random }) {
  let effective = composeAccuracy(accuracy);
  if (hasToken(attacker, 'accuracy')) {
    consumeToken(attacker, 'accuracy', 1);
    effective = Math.min(1, effective + tokenBalance().accuracyBonus);
  }

  if (roll(random) >= effective) {
    return { hit: false, dodged: false, accuracy: effective };
  }

  if (hasToken(defender, 'dodge')) {
    consumeToken(defender, 'dodge', 1);
    return { hit: false, dodged: true, accuracy: effective };
  }

  // 토큰과 별개인 상시 회피 스탯 — 소비되지 않는 확률 굴림
  const baseDodge = Number.isFinite(defender?.dodge) ? Math.max(0, defender.dodge) : 0;
  if (baseDodge > 0 && roll(random) < Math.min(0.9, baseDodge)) {
    return { hit: false, dodged: true, accuracy: effective };
  }

  return { hit: true, dodged: false, accuracy: effective };
}

export function rollCrit({ attacker, critChance, critMultiplier, random = Math.random }) {
  let chance = Number.isFinite(critChance) ? Math.max(0, critChance) : 0;
  if (hasToken(attacker, 'focus')) {
    consumeToken(attacker, 'focus', 1);
    chance += tokenBalance().focusCritBonus;
  }

  const multiplier = Number.isFinite(critMultiplier) && critMultiplier > 0
    ? critMultiplier
    : BALANCE.combat.defaultCritMultiplier;

  if (chance <= 0) return { crit: false, multiplier };
  return { crit: roll(random) < Math.min(1, chance), multiplier };
}

export function modifyOutgoingDamage(damage, attacker) {
  let result = normalizeDamage(damage);

  // 공격 강화 계열은 중첩 남용 방지를 위해 공격당 1개만 소비한다
  const boostToken = ATTACK_BOOST_TOKENS.find(tokenId => hasToken(attacker, tokenId));
  if (boostToken) {
    consumeToken(attacker, boostToken, 1);
    result = Math.floor(result * tokenBalance().strengthDamageMult);
  }

  if (hasToken(attacker, 'hesitation')) {
    consumeToken(attacker, 'hesitation', 1);
    result = Math.floor(result * tokenBalance().hesitationDamageMult);
  }

  // 죽음의 문턱에 몰린 채로는 온전한 힘을 내지 못한다 (상태 기반 — 소비 없음)
  if (attacker?.deathsDoor === true) {
    result = Math.floor(result * BALANCE.combat.deathsDoor.outgoingDamageMult);
  }

  return result;
}

export function modifyIncomingDamage(damage, defender) {
  let result = normalizeDamage(damage);

  if (hasToken(defender, 'vulnerable')) {
    consumeToken(defender, 'vulnerable', 1);
    result = Math.floor(result * tokenBalance().vulnerableDamageMult);
  }

  if (hasToken(defender, 'marked')) {
    consumeToken(defender, 'marked', 1);
    result = Math.floor(result * tokenBalance().markedDamageMult);
  }

  return result;
}

export function weaponAffinityMult(weaponType, enemyLike) {
  if (typeof weaponType !== 'string' || weaponType.length === 0) return 1;
  if (enemyLike?.weaknesses?.includes?.(weaponType)) {
    return BALANCE.combat.weaponWeaknessMult;
  }
  if (enemyLike?.resistances?.includes?.(weaponType)) {
    return BALANCE.combat.weaponResistanceMult;
  }
  return 1;
}
