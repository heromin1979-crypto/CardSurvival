// === DATA INTEGRITY VALIDATOR ===
// Run: node js/data/validate.js

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  CHARACTER_COMBAT_LOADOUTS,
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from './combatSkills.js';
import { COMPANION_TACTICS } from './companionTactics.js';
import { ENEMIES } from './enemies.js';
import { SECRET_ENEMIES } from './secretEnemies.js';
import {
  COMBAT_MOTION_MANIFEST,
  DISPLAYED_COMBAT_SHEET_KEYS,
} from './combatMotionManifest.js';
import { isResolvableImpactFx } from '../ui/combat/combatUiAssets.js';
import {
  COMPANION_STANCE_ROLES,
  COMPANION_TACTIC_WHEN,
  getCompanionSkillRole,
} from '../systems/combat/CompanionTactics.js';
import { buildEnemyProfile } from '../systems/combat/EnemyCombatAdapter.js';

const VALID_COMBAT_EFFECTS = new Set([
  'damage',
  'heal',
  'token',
  'status',
  'move',
  'stress',
  'guard',
  'flee',
]);

const VALID_BOSS_MOVEMENTS = new Set(['none', 'lunge', 'advance', 'retreat']);
const VALID_BOSS_EFFECTS = new Set([
  'damage',
  'status',
  'targetStatus',
  'move',
  'forcedMove',
  'selfHeal',
  'selfStatus',
  'summon',
  'consumeSummons',
  'partyDamage',
  'battlefieldStatus',
  'resource',
  'weaponLock',
  'noise',
]);
const VALID_ENEMY_STATUS_EFFECT_KEYS = new Set([
  'defenseIncrease',
  'evasionIncrease',
  'invulnerable',
  'incomingDamageReduction',
  'outgoingDamageIncrease',
]);
const VALID_BATTLEFIELD_EFFECT_KEYS = new Set([
  'radiationPerTurn',
  'hpLossPerRound',
  'status',
  'healingReduction',
  'guardedHealingReduction',
  'preventedHealingShieldConversion',
  'shieldDurationRounds',
]);
const VALID_COMBAT_MOTION_LOCOMOTION = new Set(['stationary', 'approach', 'retreat']);
const PROJECT_ROOT = process.cwd();

export function validateCombatMotionManifest(manifest = COMBAT_MOTION_MANIFEST) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['[combat motion] manifest must be an object'];
  }

  for (const [sheetKey, sheet] of Object.entries(manifest)) {
    const path = `[combat motion/${sheetKey}]`;
    if (!sheet || typeof sheet !== 'object' || Array.isArray(sheet)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    if (typeof sheet.src !== 'string' || !sheet.src.startsWith('/assets/')) {
      errors.push(`${path}.src must be an /assets path`);
    }
    if (!positiveInteger(sheet.cols)) errors.push(`${path}.cols must be a positive integer`);
    if (!positiveInteger(sheet.rows)) errors.push(`${path}.rows must be a positive integer`);

    const motions = sheet.motions;
    if (!motions || typeof motions !== 'object' || Array.isArray(motions)) {
      errors.push(`${path}.motions must be an object`);
      continue;
    }
    for (const requiredMotion of ['idle', 'hit', 'death']) {
      if (!motions[requiredMotion] && !motions[sheet.aliases?.[requiredMotion]]) {
        errors.push(`${path}.motions.${requiredMotion} is required`);
      }
    }
    for (const [motionKey, motion] of Object.entries(motions)) {
      const motionPath = `${path}.motions.${motionKey}`;
      if (!motion || typeof motion !== 'object' || Array.isArray(motion)) {
        errors.push(`${motionPath} must be an object`);
        continue;
      }
      if (!Number.isInteger(motion.row) || motion.row < 0 || motion.row >= sheet.rows) {
        errors.push(`${motionPath}.row must be within 0..${Math.max((sheet.rows ?? 0) - 1, 0)}`);
      }
      if (typeof motion.loop !== 'boolean') {
        errors.push(`${motionPath}.loop must be a boolean`);
      } else if (motion.loop && motionKey !== 'idle' && sheet.aliases?.idle !== motionKey) {
        errors.push(`${motionPath}.loop:true is only allowed for the idle motion`);
      }
      if (!Number.isFinite(motion.durationMs) || motion.durationMs <= 0) {
        errors.push(`${motionPath}.durationMs must be a positive number`);
      }
      if (!VALID_COMBAT_MOTION_LOCOMOTION.has(motion.locomotion)) {
        errors.push(`${motionPath}.locomotion must be stationary, approach, or retreat`);
      }
    }

    if (sheet.aliases !== undefined) {
      if (!sheet.aliases || typeof sheet.aliases !== 'object' || Array.isArray(sheet.aliases)) {
        errors.push(`${path}.aliases must be an object`);
      } else {
        for (const [aliasKey, targetKey] of Object.entries(sheet.aliases)) {
          const aliasPath = `${path}.aliases.${aliasKey}`;
          if (typeof targetKey !== 'string' || targetKey.length === 0) {
            errors.push(`${aliasPath} must target a motion key`);
          } else if (sheet.aliases[targetKey]) {
            errors.push(`${aliasPath} must resolve in one alias step`);
          } else if (!motions[targetKey]) {
            errors.push(`${aliasPath} targets unknown motion "${targetKey}"`);
          }
        }
      }
    }
  }

  const validatesDisplayedSheets = DISPLAYED_COMBAT_SHEET_KEYS.every(key => manifest[key]);
  if (validatesDisplayedSheets) {
    for (const sheetKey of DISPLAYED_COMBAT_SHEET_KEYS) {
      const src = manifest[sheetKey]?.src;
      if (typeof src !== 'string' || !src.startsWith('/assets/')) continue;
      const assetPath = resolve(PROJECT_ROOT, src.slice(1));
      if (!existsSync(assetPath)) {
        errors.push(`[combat motion/${sheetKey}] asset not found: ${src}`);
      }
    }
  }

  return errors;
}

function nonemptyObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length > 0;
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function validateBossEffect(effect, path) {
  const errors = [];
  if (!VALID_BOSS_EFFECTS.has(effect?.type)) {
    errors.push(`${path}.type "${effect?.type}" is unsupported`);
    return errors;
  }

  if (effect.type === 'selfStatus') {
    if (typeof effect.id !== 'string' || effect.id.length === 0) {
      errors.push(`${path}.id is required`);
    }
    if (!positiveInteger(effect.duration)) {
      errors.push(`${path}.duration must be a positive integer`);
    }
    if (!nonemptyObject(effect.effect)) {
      errors.push(`${path}.effect must be a non-empty typed object`);
    } else {
      for (const [key, value] of Object.entries(effect.effect)) {
        if (!VALID_ENEMY_STATUS_EFFECT_KEYS.has(key)) {
          errors.push(`${path}.effect.${key} is unsupported`);
        } else if (key === 'invulnerable' ? value !== true : !Number.isFinite(value)) {
          errors.push(`${path}.effect.${key} has an invalid value`);
        }
      }
    }
  }

  if (effect.type === 'battlefieldStatus') {
    if (typeof effect.id !== 'string' || effect.id.length === 0) {
      errors.push(`${path}.id is required`);
    }
    const hasRoundDuration = effect.duration !== undefined;
    const hasPlayerDuration = effect.remainingPlayerTurns !== undefined;
    if (hasRoundDuration === hasPlayerDuration) {
      errors.push(`${path} must declare exactly one duration clock`);
    } else {
      const duration = hasRoundDuration ? effect.duration : effect.remainingPlayerTurns;
      if (!positiveInteger(duration)) {
        errors.push(`${path} duration must be a positive integer`);
      }
    }
    if (!nonemptyObject(effect.effect)) {
      errors.push(`${path}.effect must be a non-empty typed object`);
    } else {
      for (const [key, value] of Object.entries(effect.effect)) {
        if (!VALID_BATTLEFIELD_EFFECT_KEYS.has(key)) {
          errors.push(`${path}.effect.${key} is unsupported`);
        } else if (key === 'status') {
          if (!nonemptyObject(value) || typeof value.id !== 'string') {
            errors.push(`${path}.effect.status must declare an id`);
          }
        } else if (key === 'shieldDurationRounds') {
          if (!positiveInteger(value)) {
            errors.push(`${path}.effect.shieldDurationRounds must be a positive integer`);
          }
        } else if (!Number.isFinite(value) || value < 0) {
          errors.push(`${path}.effect.${key} must be a nonnegative number`);
        } else if (
          [
            'healingReduction',
            'guardedHealingReduction',
            'preventedHealingShieldConversion',
          ].includes(key)
          && value > 1
        ) {
          errors.push(`${path}.effect.${key} must be at most 1`);
        }
      }
    }
  }

  if (effect.type === 'weaponLock') {
    if (typeof effect.tag !== 'string' || effect.tag.length === 0) {
      errors.push(`${path}.tag is required`);
    }
    if (!positiveInteger(effect.duration)) {
      errors.push(`${path}.duration must be a positive integer`);
    }
  }

  if (effect.type === 'consumeSummons') {
    if (typeof effect.enemyId !== 'string' || effect.enemyId.length === 0) {
      errors.push(`${path}.enemyId is required`);
    }
    for (const key of ['healPerSummon', 'strengthPerSummon']) {
      if (!Number.isFinite(effect[key]) || effect[key] < 0) {
        errors.push(`${path}.${key} must be a nonnegative number`);
      }
    }
    if (
      !nonemptyObject(effect.strengthStatus)
      || typeof effect.strengthStatus.id !== 'string'
      || effect.strengthStatus.id.length === 0
      || !positiveInteger(effect.strengthStatus.duration)
    ) {
      errors.push(`${path}.strengthStatus must declare id and positive duration`);
    }
  }

  return errors;
}

function validateTelegraphDamageThreshold(threshold, path) {
  if (threshold === undefined) return [];
  const errors = [];
  if (!nonemptyObject(threshold)) {
    return [`${path} must be an object`];
  }
  if (!Number.isFinite(threshold.amount) || threshold.amount <= 0) {
    errors.push(`${path}.amount must be positive`);
  }
  if (
    !Number.isFinite(threshold.resolutionMultiplier)
    || threshold.resolutionMultiplier <= 0
    || threshold.resolutionMultiplier > 1
  ) {
    errors.push(`${path}.resolutionMultiplier must be greater than 0 and at most 1`);
  }
  if (
    !Array.isArray(threshold.statusMagnitudeKeys)
    || threshold.statusMagnitudeKeys.length === 0
    || threshold.statusMagnitudeKeys.some(key => typeof key !== 'string' || key.length === 0)
  ) {
    errors.push(`${path}.statusMagnitudeKeys must contain strings`);
  }
  return errors;
}

function validateHitCountRule(rule, action, path) {
  if (rule === undefined) return [];
  const errors = [];
  if (!nonemptyObject(rule)) return [`${path} must be an object`];
  if (rule.type !== 'livingMinions') {
    errors.push(`${path}.type must be "livingMinions"`);
  }
  if (typeof rule.enemyId !== 'string' || rule.enemyId.length === 0) {
    errors.push(`${path}.enemyId is required`);
  }
  for (const key of ['base', 'perMinion', 'min', 'max']) {
    if (!Number.isSafeInteger(rule[key])) {
      errors.push(`${path}.${key} must be a safe integer`);
    }
  }
  if (Number.isSafeInteger(rule.base) && rule.base < 0) {
    errors.push(`${path}.base must be nonnegative`);
  }
  if (Number.isSafeInteger(rule.perMinion) && rule.perMinion < 0) {
    errors.push(`${path}.perMinion must be nonnegative`);
  }
  if (Number.isSafeInteger(rule.min) && rule.min < 1) {
    errors.push(`${path}.min must be at least 1`);
  }
  if (
    Number.isSafeInteger(rule.min)
    && Number.isSafeInteger(rule.max)
    && rule.max < rule.min
  ) {
    errors.push(`${path}.max must be at least min`);
  }
  if (Object.hasOwn(action ?? {}, 'hitCount')) {
    errors.push(`${path} cannot be combined with fixed hitCount`);
  }
  return errors;
}

function validateBossAction(action, expectedCategory, path) {
  const errors = [];

  if (typeof action?.id !== 'string' || action.id.trim().length === 0) {
    errors.push(`${path}.id is required`);
  }
  if (action?.category !== expectedCategory) {
    errors.push(`${path}.category must be "${expectedCategory}"`);
  }
  if (typeof action?.motionKey !== 'string' || action.motionKey.trim().length === 0) {
    errors.push(`${path}.motionKey is required`);
  }
  if (typeof action?.impactFx !== 'string' || action.impactFx.trim().length === 0) {
    errors.push(`${path}.impactFx is required`);
  } else if (!isResolvableImpactFx(action.impactFx)) {
    errors.push(`${path}.impactFx "${action.impactFx}" cannot resolve to a displayable UI asset`);
  }
  if (!VALID_BOSS_MOVEMENTS.has(action?.movement)) {
    errors.push(`${path}.movement must be none, lunge, advance, or retreat`);
  }
  if (!Array.isArray(action?.effects)) {
    errors.push(`${path}.effects must be an array`);
  } else {
    for (const [index, effect] of action.effects.entries()) {
      errors.push(...validateBossEffect(effect, `${path}.effects[${index}]`));
    }
  }
  if (action?.damage !== undefined) {
    const hasAscendingDamageRange = Array.isArray(action.damage)
      && action.damage.length === 2
      && Number.isFinite(action.damage[0])
      && Number.isFinite(action.damage[1])
      && action.damage[0] <= action.damage[1];
    if (!hasAscendingDamageRange) {
      errors.push(`${path}.damage must be an ascending [minimum, maximum] range`);
    }
  }
  errors.push(...validateTelegraphDamageThreshold(
    action?.telegraphDamageThreshold,
    `${path}.telegraphDamageThreshold`,
  ));
  errors.push(...validateHitCountRule(
    action?.hitCountRule,
    action,
    `${path}.hitCountRule`,
  ));

  return errors;
}

function basicIdentitySignature(action) {
  const safeAction = action ?? {};
  const effects = Array.isArray(safeAction.effects) ? safeAction.effects : [];

  return JSON.stringify({
    targetPolicy: safeAction.targetPolicy ?? 'frontmost',
    targetCount: safeAction.targetCount ?? 1,
    hitCount: safeAction.hitCount ?? 1,
    statusEffects: effects
      .filter(effect => effect?.type === 'targetStatus')
      .map(effect => effect.id)
      .sort(),
    forcedMoves: effects
      .filter(effect => effect?.type === 'forcedMove')
      .map(effect => effect.distance),
  });
}

export function validateBossPatternSchema(bosses = {}) {
  const errors = [];

  for (const [bossId, boss] of Object.entries(bosses)) {
    const path = `[boss/${bossId}] bossPattern`;
    const pattern = boss?.bossPattern;
    const basicAttacks = pattern?.basicAttacks;

    if (!Array.isArray(basicAttacks) || basicAttacks.length !== 2) {
      errors.push(`${path}.basicAttacks must contain exactly two actions`);
    } else {
      for (const [index, action] of basicAttacks.entries()) {
        errors.push(...validateBossAction(action, 'basic', `${path}.basicAttacks[${index}]`));
      }
      if (basicIdentitySignature(basicAttacks[0]) === basicIdentitySignature(basicAttacks[1])) {
        errors.push(`${path}.basicAttacks must have distinct combat identities`);
      }
    }

    if (Object.hasOwn(pattern ?? {}, 'normalSkills')) {
      errors.push(`${path}.normalSkills is not supported`);
    }

    errors.push(...validateBossAction(pattern?.specialSkill, 'special', `${path}.specialSkill`));
    errors.push(...validateBossAction(pattern?.ultimate, 'ultimate', `${path}.ultimate`));

    if (pattern?.specialSkill?.chance !== 0.3) {
      errors.push(`${path}.specialSkill.chance must be 0.3`);
    }
    if (pattern?.ultimate?.hpThreshold !== 0.3) {
      errors.push(`${path}.ultimate.hpThreshold must be 0.3`);
    }
    if (pattern?.ultimate?.telegraphTurns !== 1) {
      errors.push(`${path}.ultimate.telegraphTurns must be 1`);
    }
    if (pattern?.ultimate?.oncePerCombat !== true) {
      errors.push(`${path}.ultimate.oncePerCombat must be true`);
    }
  }

  return errors;
}

export function validateCompanionPatternData({
  loadouts = {},
  skills = {},
  tactics = {},
  expectedCompanionIds = null,
} = {}) {
  const errors = [];
  const hasEffect = (skill, type) => skill?.effects?.some(effect => effect?.type === type);

  if (Array.isArray(expectedCompanionIds)) {
    for (const companionId of expectedCompanionIds) {
      if (!Object.hasOwn(tactics, companionId)) {
        errors.push(`[companion tactic/${companionId}] profile is required`);
      }
    }
    for (const companionId of Object.keys(tactics)) {
      if (!expectedCompanionIds.includes(companionId)) {
        errors.push(`[companion tactic/${companionId}] profile is not in companion roster`);
      }
    }
  }

  for (const [skillId, skill] of Object.entries(skills)) {
    if (skill?.target?.selfOnly === true && skill.target.side !== 'ally') {
      errors.push(`[companion skill/${skillId}] selfOnly target.side must be ally`);
    }
    if (skill?.tacticalRole === 'heal' && !hasEffect(skill, 'heal')) {
      errors.push(`[companion skill/${skillId}] heal tacticalRole must include a heal effect`);
    }
    if (
      ['food', 'ration'].includes(skill?.tacticalRole)
      && hasEffect(skill, 'heal')
    ) {
      errors.push(
        `[companion skill/${skillId}] ${skill.tacticalRole} tacticalRole must not include a heal effect`,
      );
    }
  }

  for (const [companionId, tactic] of Object.entries(tactics)) {
    const loadoutSkillIds = Array.isArray(loadouts[companionId])
      ? loadouts[companionId]
      : [];
    const hasLoadoutRole = (role) => loadoutSkillIds.some(
      skillId => getCompanionSkillRole(skills[skillId]) === role,
    );

    const stanceRoles = COMPANION_STANCE_ROLES[tactic?.preferredStance]
      ?? [tactic?.preferredStance];
    if (
      tactic?.preferredStance
      && !stanceRoles.some(role => hasLoadoutRole(role))
    ) {
      errors.push(
        `[companion tactic/${companionId}] preferredStance role "${tactic.preferredStance}" not found in loadout`,
      );
    }
    for (const [priorityIndex, priority] of (tactic?.priorities ?? []).entries()) {
      if (
        priority?.when !== undefined
        && !COMPANION_TACTIC_WHEN.includes(priority.when)
      ) {
        errors.push(
          `[companion tactic/${companionId}] priorities[${priorityIndex}] when "${priority.when}" is not supported`,
        );
      }
      if (priority?.role && !hasLoadoutRole(priority.role)) {
        errors.push(
          `[companion tactic/${companionId}] priorities[${priorityIndex}] role "${priority.role}" not found in loadout`,
        );
      }
    }
  }

  return errors;
}

export function validateNormalEnemyPatternData(enemies = {}) {
  const errors = [];
  const allowedTimedThreatCounters = new Set(['stunDelays', 'quietKill', 'weakness']);

  for (const [enemyId, enemy] of Object.entries(enemies)) {
    const patternProfile = enemy?.patternProfile;
    const targetPolicy = patternProfile?.targetPolicy;
    const defaultAction = patternProfile?.defaultAction;

    if (typeof targetPolicy !== 'string' || targetPolicy.length === 0) {
      errors.push(`[normal enemy/${enemyId}] patternProfile.targetPolicy is required`);
    }
    if (typeof defaultAction?.motionKey !== 'string' || defaultAction.motionKey.length === 0) {
      errors.push(`[normal enemy/${enemyId}] patternProfile.defaultAction.motionKey is required`);
    }
    if (
      typeof targetPolicy === 'string'
      && targetPolicy.length > 0
      && defaultAction?.target?.side !== targetPolicy
    ) {
      errors.push(
        `[normal enemy/${enemyId}] patternProfile.targetPolicy must match defaultAction.target.side`,
      );
    }
    for (const counterKey of Object.keys(enemy?.timedThreat?.counters ?? {})) {
      if (!allowedTimedThreatCounters.has(counterKey)) {
        errors.push(
          `[normal enemy/${enemyId}] timedThreat.counters.${counterKey} is not allowed`,
        );
      }
    }
  }

  return errors;
}

export function validateCombatSkillContracts(
  combatSkills = COMBAT_SKILLS,
  characterLoadouts = CHARACTER_COMBAT_LOADOUTS,
  companionLoadouts = COMPANION_COMBAT_LOADOUTS,
  options = {},
) {
  const contractErrors = [];
  const reportCombatError = (message) => {
    contractErrors.push(message);
  };

  for (const [id, skill] of Object.entries(combatSkills)) {
    if (skill?.id !== id) {
      reportCombatError(`[combat skill/${id}] id must match object key`);
    }
    if (typeof skill?.nameKey !== 'string' || skill.nameKey.length === 0) {
      reportCombatError(`[combat skill/${id}] nameKey must be non-empty string`);
    }
    if (
      typeof skill?.icon !== 'string'
      || skill.icon.length === 0
      || !/^[\x20-\x7E]+$/.test(skill.icon)
    ) {
      reportCombatError(`[combat skill/${id}] icon must be ASCII symbolic string`);
    }
    if (skill?.source !== 'character') {
      reportCombatError(`[combat skill/${id}] source must be "character"`);
    }
    if (
      !Array.isArray(skill?.usableFrom)
      || skill.usableFrom.length === 0
      || skill.usableFrom.some(rank => (
        !Number.isInteger(rank) || rank < 1 || rank > 4
      ))
    ) {
      reportCombatError(`[combat skill/${id}] usableFrom must contain ranks 1~4`);
    }
    if (!['ally', 'enemy'].includes(skill?.target?.side)) {
      reportCombatError(`[combat skill/${id}] target.side must be ally or enemy`);
    }
    if (
      !Array.isArray(skill?.target?.ranks)
      || skill.target.ranks.length === 0
      || skill.target.ranks.some(rank => (
        !Number.isInteger(rank) || rank < 1 || rank > 4
      ))
    ) {
      reportCombatError(`[combat skill/${id}] target.ranks must contain ranks 1~4`);
    }
    if (
      !Number.isInteger(skill?.target?.count)
      || skill.target.count <= 0
    ) {
      reportCombatError(`[combat skill/${id}] target.count must be positive integer`);
    }
    if (
      !skill?.costs
      || typeof skill.costs !== 'object'
      || Array.isArray(skill.costs)
    ) {
      reportCombatError(`[combat skill/${id}] costs must be object`);
    }
    if (
      !Number.isFinite(skill?.accuracy)
      || skill.accuracy < 0
      || skill.accuracy > 1
    ) {
      reportCombatError(`[combat skill/${id}] accuracy must be between 0 and 1`);
    }
    if (!Array.isArray(skill?.effects) || skill.effects.length === 0) {
      reportCombatError(`[combat skill/${id}] effects must be non-empty array`);
      continue;
    }
    for (const [effectIndex, effect] of skill.effects.entries()) {
      if (!VALID_COMBAT_EFFECTS.has(effect?.type)) {
        reportCombatError(
          `[combat skill/${id}] effects[${effectIndex}] has invalid type "${effect?.type}"`,
        );
      }
      if (
        ['damage', 'heal'].includes(effect?.type)
        && (
          !Array.isArray(effect.value)
          || effect.value.length !== 2
          || effect.value.some(value => !Number.isFinite(value))
          || effect.value[0] > effect.value[1]
        )
      ) {
        reportCombatError(
          `[combat skill/${id}] effects[${effectIndex}].value must be [min, max]`,
        );
      }
      if (effect?.type === 'token') {
        if (!Number.isInteger(effect.stacks) || effect.stacks <= 0) {
          reportCombatError(
            `[combat skill/${id}] effects[${effectIndex}].stacks must be positive integer`,
          );
        }
        if (Object.hasOwn(effect, 'amount')) {
          reportCombatError(
            `[combat skill/${id}] effects[${effectIndex}].amount is not allowed for token effects`,
          );
        }
      }
    }
  }

  const validateCombatLoadouts = (label, loadouts, expectedCount) => {
    const entries = Object.entries(loadouts);
    if (expectedCount != null && entries.length !== expectedCount) {
      reportCombatError(
        `[${label}] expected ${expectedCount} mappings, got ${entries.length}`,
      );
    }
    for (const [ownerId, skillIds] of entries) {
      if (!Array.isArray(skillIds) || skillIds.length !== 3) {
        reportCombatError(`[${label}/${ownerId}] loadout must contain exactly 3 skills`);
        continue;
      }
      if (new Set(skillIds).size !== skillIds.length) {
        reportCombatError(`[${label}/${ownerId}] loadout contains duplicate skill IDs`);
      }
      for (const skillId of skillIds) {
        if (!combatSkills[skillId]) {
          reportCombatError(
            `[${label}/${ownerId}] skill "${skillId}" not found in COMBAT_SKILLS`,
          );
        }
      }
    }
  };

  validateCombatLoadouts(
    'character combat loadout',
    characterLoadouts,
    options.expectedCharacterCount,
  );
  validateCombatLoadouts(
    'companion combat loadout',
    companionLoadouts,
    options.expectedCompanionCount,
  );

  return { ok: contractErrors.length === 0, errors: contractErrors };
}

export function validateEnemyCombatProfiles(enemies = ENEMIES) {
  const errors = [];
  const reportEnemyError = (message) => {
    errors.push(message);
  };
  const validRanks = ranks => Array.isArray(ranks)
    && ranks.length > 0
    && ranks.every(rank => Number.isInteger(rank) && rank >= 1 && rank <= 4);

  for (const [enemyId, enemy] of Object.entries(enemies ?? {})) {
    const explicitProfile = enemy?.combatProfile;
    if (explicitProfile != null) {
      if (
        typeof explicitProfile !== 'object'
        || Array.isArray(explicitProfile)
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile must be object`);
        continue;
      }
      if (
        explicitProfile.speed != null
        && (
          !Number.isSafeInteger(explicitProfile.speed)
          || explicitProfile.speed < 0
        )
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.speed must be non-negative safe integer`);
      }
      if (
        explicitProfile.startRank != null
        && (
          !Number.isInteger(explicitProfile.startRank)
          || explicitProfile.startRank < 1
          || explicitProfile.startRank > 4
        )
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.startRank must be 1~4`);
      }
      if (
        !Array.isArray(explicitProfile.skillIds)
        || explicitProfile.skillIds.length === 0
        || explicitProfile.skillIds.some(skillId => (
          typeof skillId !== 'string' || skillId.length === 0
        ))
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.skillIds must be non-empty strings`);
      }
      if (
        Array.isArray(explicitProfile.skillIds)
        && new Set(explicitProfile.skillIds).size !== explicitProfile.skillIds.length
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.skillIds must not contain duplicates`);
      }
      if (!Array.isArray(explicitProfile.skills) || explicitProfile.skills.length === 0) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.skills must be non-empty array`);
      } else if (Array.isArray(explicitProfile.skillIds)) {
        const skillMap = new Map(explicitProfile.skills.map(skill => [skill?.id, skill]));
        for (const skillId of explicitProfile.skillIds) {
          if (!skillMap.has(skillId)) {
            reportEnemyError(`[enemy/${enemyId}] combatProfile skill "${skillId}" not found in skills`);
          }
        }
      }
      if (
        explicitProfile.ai != null
        && (typeof explicitProfile.ai !== 'string' || explicitProfile.ai.length === 0)
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.ai must be non-empty string`);
      }
    }

    const profile = buildEnemyProfile(enemy);
    if (!Number.isSafeInteger(profile.speed) || profile.speed < 0) {
      reportEnemyError(`[enemy/${enemyId}] profile.speed must be non-negative safe integer`);
    }
    if (
      !Number.isInteger(profile.startRank)
      || profile.startRank < 1
      || profile.startRank > 4
    ) {
      reportEnemyError(`[enemy/${enemyId}] profile.startRank must be 1~4`);
    }
    if (typeof profile.ai !== 'string' || profile.ai.length === 0) {
      reportEnemyError(`[enemy/${enemyId}] profile.ai must be non-empty string`);
    }

    for (const [skillIndex, skill] of (profile.skills ?? []).entries()) {
      if (typeof skill?.id !== 'string' || skill.id.length === 0) {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].id must be non-empty string`);
      }
      if (skill?.source !== 'enemy') {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].source must be enemy`);
      }
      if (!validRanks(skill?.usableFrom)) {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].usableFrom must contain ranks 1~4`);
      }
      if (skill?.target?.side !== 'ally') {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].target.side must be ally`);
      }
      if (!validRanks(skill?.target?.ranks)) {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].target.ranks must contain ranks 1~4`);
      }
      if (!Number.isInteger(skill?.target?.count) || skill.target.count <= 0) {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].target.count must be positive integer`);
      }
      if (!Number.isFinite(skill?.accuracy) || skill.accuracy < 0 || skill.accuracy > 1) {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].accuracy must be between 0 and 1`);
      }
      if (!Array.isArray(skill?.effects) || skill.effects.length === 0) {
        reportEnemyError(`[enemy/${enemyId}] skills[${skillIndex}].effects must be non-empty array`);
        continue;
      }
      for (const [effectIndex, effect] of skill.effects.entries()) {
        if (effect?.type !== 'damage') {
          reportEnemyError(
            `[enemy/${enemyId}] skills[${skillIndex}].effects[${effectIndex}].type must be damage`,
          );
        }
        if (
          !Array.isArray(effect?.value)
          || effect.value.length !== 2
          || effect.value.some(value => !Number.isFinite(value))
          || effect.value[0] > effect.value[1]
        ) {
          reportEnemyError(
            `[enemy/${enemyId}] skills[${skillIndex}].effects[${effectIndex}].value must be [min, max]`,
          );
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

async function validate() {
  const items = {
    ...(await import('./items_base.js')).default,
    ...(await import('./items_combat.js')).default,
    ...(await import('./items_misc.js')).default,
    ...(await import('./items_tech.js')).default,
    ...(await import('./items_medical.js')).default,
    ...(await import('./items_tools.js')).default,
    ...(await import('./items_structures.js')).default,
    ...(await import('./legendaryItems.js')).default,
  };

  const bp = (await import('./blueprints.js')).default;
  const bpAdv = (await import('./blueprints_advanced.js')).default;
  const hidden = (await import('./hiddenRecipes.js')).default;
  const secret = (await import('./secretCombinations.js')).default;
  const stack = (await import('./stackConfig.js')).default;
  const patientPool = (await import('./patientPool.js')).default;

  const allBlueprints = { ...bp, ...bpAdv, ...hidden };
  const allItemIds = new Set(Object.keys(items));
  let errors = 0;
  let warnings = 0;

  console.log('=== DATA INTEGRITY CHECK ===\n');

  // 1. Check all blueprint inputs/outputs reference existing items
  for (const [id, recipe] of Object.entries(allBlueprints)) {
    // Check outputs
    const outputs = Array.isArray(recipe.output) ? recipe.output : [recipe.output];
    for (const out of outputs) {
      if (out?.definitionId && !allItemIds.has(out.definitionId)) {
        console.log(`\u274C [${id}] output "${out.definitionId}" not found in items`);
        errors++;
      }
    }
    // Check stage inputs
    for (const stage of (recipe.stages || [])) {
      for (const req of (stage.requiredItems || [])) {
        if (!allItemIds.has(req.definitionId)) {
          console.log(`\u274C [${id}] input "${req.definitionId}" not found in items`);
          errors++;
        }
      }
    }
    // Check requiredTools reference valid structures/tools
    for (const tool of (recipe.requiredTools || [])) {
      if (!allItemIds.has(tool)) {
        console.log(`\u26A0\uFE0F [${id}] tool "${tool}" not found in items`);
        warnings++;
      }
    }
  }

  // 2. Check secret combinations reference existing items
  for (const combo of secret) {
    if (combo.source?.id && !allItemIds.has(combo.source.id)) {
      console.log(`\u274C [${combo.id}] source "${combo.source.id}" not found`);
      errors++;
    }
    if (combo.target?.id && !allItemIds.has(combo.target.id)) {
      console.log(`\u274C [${combo.id}] target "${combo.target.id}" not found`);
      errors++;
    }
    if (combo.result?.spawnItem && !allItemIds.has(combo.result.spawnItem)) {
      console.log(`\u274C [${combo.id}] spawnItem "${combo.result.spawnItem}" not found`);
      errors++;
    }
  }

  // 3. Check blueprint ID collisions
  const bpIds = Object.keys(bp);
  const advIds = Object.keys(bpAdv);
  const hiddenIds = Object.keys(hidden);
  for (const id of advIds) {
    if (bpIds.includes(id)) { console.log(`\u274C ID collision: "${id}" in both blueprints.js and blueprints_advanced.js`); errors++; }
  }
  for (const id of hiddenIds) {
    if (bpIds.includes(id)) { console.log(`\u274C ID collision: "${id}" in both blueprints.js and hiddenRecipes.js`); errors++; }
    if (advIds.includes(id)) { console.log(`\u274C ID collision: "${id}" in both blueprints_advanced.js and hiddenRecipes.js`); errors++; }
  }

  // 4. Check stackConfig covers all items
  const unstacked = Object.keys(items).filter(id => !stack[id] && items[id].type !== 'location');
  if (unstacked.length > 0) {
    console.log(`\n\u26A0\uFE0F ${unstacked.length} items missing from stackConfig.js:`);
    unstacked.forEach(id => console.log(`   - ${id} (${items[id].type}/${items[id].subtype})`));
    warnings += unstacked.length;
  }

  // 5. Skill gate distribution
  console.log('\n=== SKILL GATE DISTRIBUTION ===');
  const skillDist = {};
  for (const recipe of Object.values(allBlueprints)) {
    for (const [skill, level] of Object.entries(recipe.requiredSkills || {})) {
      if (!skillDist[skill]) skillDist[skill] = {};
      if (!skillDist[skill][level]) skillDist[skill][level] = 0;
      skillDist[skill][level]++;
    }
  }
  for (const [skill, levels] of Object.entries(skillDist).sort()) {
    const dist = Object.entries(levels).sort((a, b) => a[0] - b[0]).map(([lv, ct]) => `Lv${lv}:${ct}`).join(' ');
    console.log(`  ${skill}: ${dist}`);
  }

  // 6. Dead-end check (items that are crafted but never used as input)
  console.log('\n=== DEAD-END CHECK ===');
  const craftedItems = new Set();
  const usedAsInput = new Set();
  for (const recipe of Object.values(allBlueprints)) {
    const outputs = Array.isArray(recipe.output) ? recipe.output : [recipe.output];
    outputs.forEach(o => { if (o?.definitionId) craftedItems.add(o.definitionId); });
    for (const stage of (recipe.stages || [])) {
      (stage.requiredItems || []).forEach(r => usedAsInput.add(r.definitionId));
    }
  }
  const deadEnds = [...craftedItems].filter(id => !usedAsInput.has(id));
  // Filter out final products (weapons, armor, structures, consumables) - these are expected dead-ends
  const realDeadEnds = deadEnds.filter(id => {
    const item = items[id];
    if (!item) return true;
    if (['weapon', 'armor', 'structure'].includes(item.type)) return false;
    if (item.type === 'consumable') return false;
    if (item.type === 'tool') return false;
    return true; // materials that are crafted but never used
  });
  if (realDeadEnds.length > 0) {
    console.log(`\u26A0\uFE0F ${realDeadEnds.length} material dead-ends (crafted but never used as input):`);
    realDeadEnds.forEach(id => console.log(`   - ${id}`));
  } else {
    console.log('\u2705 No material dead-ends');
  }

  // 7. PATIENT_POOL 스키마 검증 (응급실 허브)
  console.log('\n=== PATIENT_POOL CHECK ===');
  const AGE_BRACKETS  = new Set(['child', 'youth', 'adult', 'middle', 'elder']);
  const CONTRIB_TYPES = new Set(['sponsor', 'guard', 'dispatch', 'recruit']);
  const FRAGMENT_STAGES = ['wound3to2', 'wound2to1', 'wound1to0'];
  const REQUIRED_FIELDS = ['id', 'name', 'age', 'gender', 'ageBracket', 'woundLevel', 'hiddenBackground', 'contributionOnCure'];

  let patientCount = 0;
  let herbSeedTotal = 0;
  for (const [pid, p] of Object.entries(patientPool)) {
    patientCount++;

    // 필수 필드
    for (const f of REQUIRED_FIELDS) {
      if (p[f] === undefined || p[f] === null) {
        console.log(`\u274C [patient/${pid}] missing field "${f}"`); errors++;
      }
    }
    if (typeof p.age !== 'number') {
      console.log(`\u274C [patient/${pid}] age must be number`); errors++;
    }
    // ageBracket enum
    if (!AGE_BRACKETS.has(p.ageBracket)) {
      console.log(`\u274C [patient/${pid}] invalid ageBracket "${p.ageBracket}"`); errors++;
    }
    // woundLevel 범위
    if (typeof p.woundLevel !== 'number' || p.woundLevel < 1 || p.woundLevel > 3) {
      console.log(`\u274C [patient/${pid}] woundLevel must be 1~3, got ${p.woundLevel}`); errors++;
    }
    // storyFragments 3단계 × 3~5줄
    const frags = p.hiddenBackground?.storyFragments ?? [];
    const fragStages = frags.map(f => f.stage);
    for (const stage of FRAGMENT_STAGES) {
      const frag = frags.find(f => f.stage === stage);
      if (!frag) {
        console.log(`\u274C [patient/${pid}] missing storyFragment stage "${stage}"`); errors++;
        continue;
      }
      if (!Array.isArray(frag.lines) || frag.lines.length < 3 || frag.lines.length > 5) {
        console.log(`\u274C [patient/${pid}] storyFragment "${stage}" lines length ${frag.lines?.length} (expect 3~5)`); errors++;
      }
    }
    // contributionOnCure.type enum + itemId 참조
    const c = p.contributionOnCure;
    if (!c || !CONTRIB_TYPES.has(c.type)) {
      console.log(`\u274C [patient/${pid}] invalid contributionOnCure.type "${c?.type}"`); errors++;
    } else {
      const checkItems = (arr, where) => {
        for (const it of (arr ?? [])) {
          if (!allItemIds.has(it.id)) {
            console.log(`\u274C [patient/${pid}] ${where} itemId "${it.id}" not in items`); errors++;
          }
          if (it.id === 'herb_seed') herbSeedTotal += (it.qty ?? 0);
        }
      };
      // immediate는 모든 타입 공통
      checkItems(c.immediate, `${c.type}.immediate`);

      if (c.type === 'sponsor') {
        checkItems(c.recurring?.items,   'sponsor.recurring.items');
      }
      if (c.type === 'dispatch') {
        const d = c.dispatch;
        if (!d) {
          console.log(`\u274C [patient/${pid}] dispatch type requires dispatch block`); errors++;
        } else {
          if (typeof d.targetDistrict !== 'string') {
            console.log(`\u274C [patient/${pid}] dispatch.targetDistrict must be string`); errors++;
          }
          if (typeof d.intervalDays !== 'number' || d.intervalDays <= 0) {
            console.log(`\u274C [patient/${pid}] dispatch.intervalDays must be >0 number`); errors++;
          }
          if (typeof d.maxRuns !== 'number' || d.maxRuns <= 0) {
            console.log(`\u274C [patient/${pid}] dispatch.maxRuns must be >0 number`); errors++;
          }
          checkItems(d.yield, 'dispatch.yield');
        }
      }
      if (c.type === 'guard') {
        const g = c.guard;
        if (!g) {
          console.log(`\u274C [patient/${pid}] guard type requires guard block`); errors++;
        } else {
          for (const f of ['combatDmg', 'safetyAdd', 'foodCostPerDay']) {
            if (typeof g[f] !== 'number') {
              console.log(`\u274C [patient/${pid}] guard.${f} must be number`); errors++;
            }
          }
        }
      }
    }
  }
  console.log(`  총 페르소나: ${patientCount}`);
  console.log(`  herb_seed 공급 누적 (immediate + 회당 recurring qty): ${herbSeedTotal}`);

  // 8. \uBA54\uC778 \uD018\uC2A4\uD2B8 \uC2A4\uD0A4\uB9C8 \uAC80\uC99D (subObjectives, locationHint)
  console.log('\n=== MAIN QUEST SCHEMA CHECK ===');
  const MAIN_QUESTS = (await import('./mainQuests/index.js')).default;
  const districtsMod = await import('./districts.js');
  const knownDistricts = new Set(Object.keys(districtsMod.DISTRICTS ?? {}));

  let knownLandmarks = null;
  try {
    const landmarksMod = await import('./landmarks.js');
    const lmData = landmarksMod.default ?? landmarksMod.LANDMARK_DATA;
    if (lmData) knownLandmarks = new Set(Object.keys(lmData));
  } catch { /* landmarks.js \uBBF8\uC874\uC7AC/\uD3EC\uB9F7 \uBCC0\uACBD \uC2DC ID \uAC80\uC99D\uC740 \uAC74\uB108\uB700 */ }

  const npcsMod = await import('./npcs.js');
  const npcQuestStepCounts = {};
  for (const [npcId, npcDef] of Object.entries(npcsMod.default ?? {})) {
    for (const nq of npcDef?.quests ?? []) {
      npcQuestStepCounts[`${npcId}:${nq.id}`] = (nq.steps ?? []).length;
    }
  }

  let mqChecked = 0;
  let mqItemRefBad = 0;
  for (const [id, q] of Object.entries(MAIN_QUESTS)) {
    const r = validateMainQuestSchema({ ...q, id }, { knownDistricts, knownLandmarks, npcQuestStepCounts });
    for (const e of r.errors) {
      console.log(`\u274C [main quest] ${e}`);
      errors++;
    }
    // \uBCF4\uC0C1\u00B7\uC218\uC9D1 \uBAA9\uD45C \uC544\uC774\uD15C \uCC38\uC870 \uAC80\uC99D (\uBBF8\uC815\uC758 \uC544\uC774\uD15C\uC740 \uC9C0\uAE09 \uC2DC \uC870\uC6A9\uD788 \uC99D\uBC1C)
    for (const [ri, it] of (q.reward?.items ?? []).entries()) {
      const itemId = it.definitionId ?? it.id;
      if (!itemId || !allItemIds.has(itemId)) {
        console.log(`\u274C [main quest/${id}] reward.items[${ri}] "${itemId}" not found in items`);
        errors++; mqItemRefBad++;
      }
    }
    const objectives = Array.isArray(q.objectives) ? q.objectives : (q.objective ? [q.objective] : []);
    for (const [oi, obj] of objectives.entries()) {
      if (obj?.type === 'collect_item' && obj.definitionId && !allItemIds.has(obj.definitionId)) {
        console.log(`\u274C [main quest/${id}] objectives[${oi}] collect_item "${obj.definitionId}" not found in items`);
        errors++; mqItemRefBad++;
      }
    }
    mqChecked++;
  }
  console.log(`  \uAC80\uC0AC\uD55C \uD018\uC2A4\uD2B8: ${mqChecked}, \uC544\uC774\uD15C \uCC38\uC870 \uC624\uB958: ${mqItemRefBad}`);

  // 9. 6\uC9C1\uC5C5 \uBA54\uC778 \uD018\uC2A4\uD2B8 \uC778\uB371\uC2A4 \uB4F1\uB85D \uAC80\uC99D
  // \uC9C1\uC5C5\uBCC4 \uD3F4\uB354 index.js\uC758 quest \uD0A4\uAC00 mainQuests/index.js \uBCD1\uD569 \uACB0\uACFC\uC5D0 \uBAA8\uB450 \uD3EC\uD568\uB418\uB294\uC9C0 \uD655\uC778.
  // \uB204\uB77D \uC2DC \uD574\uB2F9 \uC9C1\uC5C5 \uBA54\uC778 \uD018\uC2A4\uD2B8\uAC00 \uAC8C\uC784 \uB7F0\uD0C0\uC784\uC5D0 \uB3C4\uB2EC\uD558\uC9C0 \uC54A\uB294 P0 \uACB0\uD568.
  console.log('\n=== JOB QUEST INDEX REGISTRATION CHECK ===');
  const JOBS = ['doctor', 'soldier', 'firefighter', 'homeless', 'chef', 'engineer'];
  const mainQuestKeys = new Set(Object.keys(MAIN_QUESTS));
  for (const job of JOBS) {
    try {
      const jobMod = await import(`./mainQuests/${job}/index.js`);
      const jobQuests = jobMod.default;
      const jobKeys = Object.keys(jobQuests);
      if (jobKeys.length === 0) {
        console.log(`\u26A0\uFE0F  ${job}: index.js exports empty quest object`);
        warnings++;
        continue;
      }
      const missing = jobKeys.filter(k => !mainQuestKeys.has(k));
      if (missing.length > 0) {
        console.log(`\u274C ${job}: ${missing.length} quest(s) not registered in mainQuests/index.js`);
        missing.slice(0, 5).forEach(k => console.log(`   - ${k}`));
        if (missing.length > 5) console.log(`   ... and ${missing.length - 5} more`);
        errors++;
      } else {
        console.log(`  ${job}: ${jobKeys.length} quests registered`);
      }
    } catch (e) {
      console.log(`\u274C ${job}: failed to load mainQuests/${job}/index.js \u2014 ${e.message}`);
      errors++;
    }
  }

  // 10. 구 lootTable 자원 클래스(cls)·계절(seasons) + 탐사도 임계값(explorationYields) 검증
  console.log('\n=== DISTRICT LOOT CLASS/SEASON/EXPLORATION CHECK ===');
  const VALID_CLS = new Set(['surface', 'expedition']);  // 광물은 explorationYields로 이관됨
  const VALID_SEASON = new Set(['spring', 'summer', 'autumn', 'winter']);
  let clsChecked = 0, clsBad = 0;
  for (const [id, d] of Object.entries(districtsMod.DISTRICTS ?? {})) {
    for (const [i, entry] of (d.lootTable ?? []).entries()) {
      clsChecked++;
      if (entry.cls != null && !VALID_CLS.has(entry.cls)) {
        console.log(`❌ [${id}] lootTable[${i}] (${entry.definitionId}) invalid cls "${entry.cls}" — surface/expedition 중 하나여야 함`);
        errors++; clsBad++;
      }
      if (entry.seasons != null) {
        if (!Array.isArray(entry.seasons) || entry.seasons.some(s => !VALID_SEASON.has(s))) {
          console.log(`❌ [${id}] lootTable[${i}] (${entry.definitionId}) invalid seasons "${JSON.stringify(entry.seasons)}" — spring/summer/autumn/winter 배열`);
          errors++; clsBad++;
        }
      }
      if (entry.definitionId && !allItemIds.has(entry.definitionId)) {
        console.log(`⚠️  [${id}] lootTable[${i}] "${entry.definitionId}" not found in items`);
        warnings++;
      }
    }
    // explorationYields: at 0~100, items.definitionId 존재
    for (const [yi, y] of (d.explorationYields ?? []).entries()) {
      if (typeof y.at !== 'number' || y.at < 1 || y.at > 100) {
        console.log(`❌ [${id}] explorationYields[${yi}].at "${y.at}" — 1~100 숫자여야 함`);
        errors++; clsBad++;
      }
      for (const [ii, it] of (y.items ?? []).entries()) {
        if (!it.definitionId || !allItemIds.has(it.definitionId)) {
          console.log(`❌ [${id}] explorationYields[${yi}].items[${ii}] "${it.definitionId}" not found in items`);
          errors++; clsBad++;
        }
      }
    }
  }
  console.log(`  검사한 드랍 항목: ${clsChecked}, 잘못된 cls/seasons/exploration: ${clsBad}`);

  // 11. 구조물 harvest(텃밭 자동수확)·forage(살살 채취) 산출 아이템 참조 검증
  console.log('\n=== STRUCTURE HARVEST/FORAGE CHECK ===');
  let hfChecked = 0, hfBad = 0;
  for (const [id, def] of Object.entries(items)) {
    if (def?.harvest) {
      hfChecked++;
      if (!def.harvest.itemId || !allItemIds.has(def.harvest.itemId)) {
        console.log(`❌ [${id}] harvest.itemId "${def.harvest.itemId}" not found in items`);
        errors++; hfBad++;
      }
    }
    if (def?.forage) {
      hfChecked++;
      // forage는 dismantle 테이블을 산출원으로 쓰므로 dismantle 존재만 확인
      if (!Array.isArray(def.dismantle) || def.dismantle.length === 0) {
        console.log(`❌ [${id}] forage 설정이 있으나 dismantle 테이블이 없습니다(살살 채취 산출원 부재)`);
        errors++; hfBad++;
      }
    }
    // 아이템 상자(containedItems) — 내용물 아이템 참조·수량 검증
    for (const [ci, c] of (def.containedItems ?? []).entries()) {
      hfChecked++;
      if (!c.definitionId || !allItemIds.has(c.definitionId)) {
        console.log(`❌ [${id}] containedItems[${ci}] "${c.definitionId}" not found in items`);
        errors++; hfBad++;
      }
      if (typeof c.qty !== 'number' || c.qty <= 0) {
        console.log(`❌ [${id}] containedItems[${ci}].qty "${c.qty}" — 0보다 큰 숫자여야 함`);
        errors++; hfBad++;
      }
    }
    // Phase 4 부패 필드 타입 검사
    if (def?.spoilDays != null && (typeof def.spoilDays !== 'number' || def.spoilDays <= 0)) {
      console.log(`❌ [${id}] spoilDays "${def.spoilDays}" — 0보다 큰 숫자여야 함`);
      errors++; hfBad++;
    }
    if (def?.preserved != null && typeof def.preserved !== 'boolean') {
      console.log(`❌ [${id}] preserved "${def.preserved}" — 불리언이어야 함`);
      errors++; hfBad++;
    }
    if (def?.immovable != null && typeof def.immovable !== 'boolean') {
      console.log(`❌ [${id}] immovable "${def.immovable}" — 불리언이어야 함`);
      errors++; hfBad++;
    }
  }
  console.log(`  검사한 harvest/forage: ${hfChecked}, 문제: ${hfBad}`);

  // 12. 도난 둥지 카드(animal_nest) 존재 확인 (TheftSystem 의존)
  if (!allItemIds.has('animal_nest')) {
    console.log('❌ animal_nest 아이템이 없습니다 — TheftSystem 둥지 생성 실패');
    errors++;
  }

  // 12-1. NPC 아이템 참조 검증 — gear/gifts/trades/forage/치료/보상 전반
  //        (combat_knife 미정의 사고 재발 방지: 보상 지급은 정의 누락 시 조용히 증발)
  console.log('\n=== NPC ITEM REFS CHECK ===');
  const NPCS_DATA = (await import('./npcs.js')).default;
  let npcRefChecked = 0, npcRefBad = 0;
  for (const [npcId, npc] of Object.entries(NPCS_DATA)) {
    const checkId = (where, id) => {
      npcRefChecked++;
      if (!id || !allItemIds.has(id)) {
        console.log(`❌ [npc/${npcId}] ${where} "${id}" not found in items`);
        errors++; npcRefBad++;
      }
    };

    // companion.gear — 최대 4개 + qty 정수
    const gear = npc?.companion?.gear;
    if (gear != null) {
      if (!Array.isArray(gear) || gear.length === 0 || gear.length > 4) {
        console.log(`❌ [npc/${npcId}] gear must be array of 1~4 entries, got ${Array.isArray(gear) ? gear.length : typeof gear}`);
        errors++; npcRefBad++;
      } else {
        for (const [gi, entry] of gear.entries()) {
          checkId(`gear[${gi}]`, entry?.id);
          if (entry?.qty != null && (!Number.isInteger(entry.qty) || entry.qty <= 0)) {
            console.log(`❌ [npc/${npcId}] gear[${gi}].qty "${entry.qty}" — 1 이상 정수여야 함`);
            errors++; npcRefBad++;
          }
        }
      }
    }

    for (const [gi, g] of (npc.gifts ?? []).entries()) {
      checkId(`gifts[${gi}]`, g.itemId ?? g.definitionId);
    }
    for (const [ti, tr] of (npc.trades ?? []).entries()) {
      const giveId    = typeof tr.give    === 'string' ? tr.give    : tr.give?.id;
      const receiveId = typeof tr.receive === 'string' ? tr.receive : tr.receive?.id;
      checkId(`trades[${ti}].give`, giveId);
      checkId(`trades[${ti}].receive`, receiveId);
    }
    for (const [fi, f] of (npc.forageItems ?? []).entries()) {
      checkId(`forageItems[${fi}]`, f.id);
    }
    if (npc.woundHealItem) checkId('woundHealItem', npc.woundHealItem);
    for (const evt of (npc.trustEvents ?? [])) {
      for (const [ii, it] of (evt.effect?.giveItems ?? []).entries()) {
        checkId(`trustEvents(${evt.id}).giveItems[${ii}]`, it.id);
      }
    }
    for (const q of (npc.quests ?? [])) {
      for (const [ri, it] of (q.reward?.items ?? []).entries()) {
        checkId(`quests(${q.id}).reward.items[${ri}]`, it.id ?? it.definitionId);
      }
      for (const [si, step] of (q.steps ?? []).entries()) {
        if (step.type === 'collect') checkId(`quests(${q.id}).steps[${si}]`, step.itemId);
      }
    }
  }
  console.log(`  검사한 NPC 아이템 참조: ${npcRefChecked}, 오류: ${npcRefBad}`);

  // 13. Data-driven combat skill and loadout contracts
  console.log('\n=== COMBAT SKILL DATA CHECK ===');
  const VALID_COMBAT_EFFECTS = new Set([
    'damage',
    'heal',
    'token',
    'status',
    'move',
    'stress',
    'guard',
    'flee',
  ]);
  let combatSkillErrors = 0;
  const reportCombatError = (message) => {
    console.log(`❌ ${message}`);
    errors++;
    combatSkillErrors++;
  };

  for (const [id, skill] of Object.entries(COMBAT_SKILLS)) {
    if (skill?.id !== id) {
      reportCombatError(`[combat skill/${id}] id must match object key`);
    }
    if (typeof skill?.nameKey !== 'string' || skill.nameKey.length === 0) {
      reportCombatError(`[combat skill/${id}] nameKey must be non-empty string`);
    }
    if (
      typeof skill?.icon !== 'string'
      || skill.icon.length === 0
      || !/^[\x20-\x7E]+$/.test(skill.icon)
    ) {
      reportCombatError(`[combat skill/${id}] icon must be ASCII symbolic string`);
    }
    if (skill?.source !== 'character') {
      reportCombatError(`[combat skill/${id}] source must be "character"`);
    }
    if (
      !Array.isArray(skill?.usableFrom)
      || skill.usableFrom.length === 0
      || skill.usableFrom.some(rank => (
        !Number.isInteger(rank) || rank < 1 || rank > 4
      ))
    ) {
      reportCombatError(`[combat skill/${id}] usableFrom must contain ranks 1~4`);
    }
    if (!['ally', 'enemy'].includes(skill?.target?.side)) {
      reportCombatError(`[combat skill/${id}] target.side must be ally or enemy`);
    }
    if (
      !Array.isArray(skill?.target?.ranks)
      || skill.target.ranks.length === 0
      || skill.target.ranks.some(rank => (
        !Number.isInteger(rank) || rank < 1 || rank > 4
      ))
    ) {
      reportCombatError(`[combat skill/${id}] target.ranks must contain ranks 1~4`);
    }
    if (
      !Number.isInteger(skill?.target?.count)
      || skill.target.count <= 0
    ) {
      reportCombatError(`[combat skill/${id}] target.count must be positive integer`);
    }
    if (
      !skill?.costs
      || typeof skill.costs !== 'object'
      || Array.isArray(skill.costs)
    ) {
      reportCombatError(`[combat skill/${id}] costs must be object`);
    }
    if (
      !Number.isFinite(skill?.accuracy)
      || skill.accuracy < 0
      || skill.accuracy > 1
    ) {
      reportCombatError(`[combat skill/${id}] accuracy must be between 0 and 1`);
    }
    if (!Array.isArray(skill?.effects) || skill.effects.length === 0) {
      reportCombatError(`[combat skill/${id}] effects must be non-empty array`);
      continue;
    }
    for (const [effectIndex, effect] of skill.effects.entries()) {
      if (!VALID_COMBAT_EFFECTS.has(effect?.type)) {
        reportCombatError(
          `[combat skill/${id}] effects[${effectIndex}] has invalid type "${effect?.type}"`,
        );
      }
      if (
        ['damage', 'heal'].includes(effect?.type)
        && (
          !Array.isArray(effect.value)
          || effect.value.length !== 2
          || effect.value.some(value => !Number.isFinite(value))
          || effect.value[0] > effect.value[1]
        )
      ) {
        reportCombatError(
          `[combat skill/${id}] effects[${effectIndex}].value must be [min, max]`,
        );
      }
      if (effect?.type === 'token') {
        if (!Number.isInteger(effect.stacks) || effect.stacks <= 0) {
          reportCombatError(
            `[combat skill/${id}] effects[${effectIndex}].stacks must be positive integer`,
          );
        }
        if (Object.hasOwn(effect, 'amount')) {
          reportCombatError(
            `[combat skill/${id}] effects[${effectIndex}].amount is not allowed for token effects`,
          );
        }
      }
    }
  }

  const validateCombatLoadouts = (label, loadouts, expectedCount) => {
    const entries = Object.entries(loadouts);
    if (entries.length !== expectedCount) {
      reportCombatError(
        `[${label}] expected ${expectedCount} mappings, got ${entries.length}`,
      );
    }
    for (const [ownerId, skillIds] of entries) {
      if (!Array.isArray(skillIds) || skillIds.length !== 3) {
        reportCombatError(`[${label}/${ownerId}] loadout must contain exactly 3 skills`);
        continue;
      }
      if (new Set(skillIds).size !== skillIds.length) {
        reportCombatError(`[${label}/${ownerId}] loadout contains duplicate skill IDs`);
      }
      for (const skillId of skillIds) {
        if (!COMBAT_SKILLS[skillId]) {
          reportCombatError(
            `[${label}/${ownerId}] skill "${skillId}" not found in COMBAT_SKILLS`,
          );
        }
      }
    }
  };

  validateCombatLoadouts(
    'character combat loadout',
    CHARACTER_COMBAT_LOADOUTS,
    6,
  );
  validateCombatLoadouts(
    'companion combat loadout',
    COMPANION_COMBAT_LOADOUTS,
    20,
  );
  for (const message of validateCompanionPatternData({
    loadouts: COMPANION_COMBAT_LOADOUTS,
    skills: COMBAT_SKILLS,
    tactics: COMPANION_TACTICS,
    expectedCompanionIds: Object.keys(COMPANION_COMBAT_LOADOUTS),
  })) {
    reportCombatError(message);
  }
  console.log(
    `  Skills: ${Object.keys(COMBAT_SKILLS).length}, errors: ${combatSkillErrors}`,
  );

  // 14. Enemy combat profile contracts
  console.log('\n=== ENEMY COMBAT PROFILE CHECK ===');
  const enemyCombatReport = validateEnemyCombatProfiles(ENEMIES);
  for (const error of enemyCombatReport.errors) {
    console.log(`ERROR ${error}`);
    errors++;
  }
  console.log(
    `  Enemies: ${Object.keys(ENEMIES).length}, errors: ${enemyCombatReport.errors.length}`,
  );

  // 15. Final boss roster and boss pattern contracts
  console.log('\n=== BOSS PATTERN CHECK ===');
  const finalBosses = Object.values(SECRET_ENEMIES).filter(enemy => enemy?.isBoss === true);
  if (finalBosses.length !== 21) {
    console.log(`ERROR [boss roster] expected 21 final bosses, found ${finalBosses.length}`);
    errors++;
  }
  const bossPatternErrors = validateBossPatternSchema(SECRET_ENEMIES);
  for (const error of bossPatternErrors) {
    console.log(`ERROR ${error}`);
    errors++;
  }
  console.log(
    `  Bosses: ${finalBosses.length}, errors: ${bossPatternErrors.length + (finalBosses.length === 21 ? 0 : 1)}`,
  );

  // 16. 현재 전투 화면에 표시되는 sprite sheet의 모션·자산 계약
  console.log('\n=== COMBAT MOTION MANIFEST CHECK ===');
  const combatMotionErrors = validateCombatMotionManifest();
  for (const error of combatMotionErrors) {
    console.log(`ERROR ${error}`);
    errors++;
  }
  console.log(
    `  Displayed sheets: ${DISPLAYED_COMBAT_SHEET_KEYS.length}, errors: ${combatMotionErrors.length}`,
  );

  // 17. 숨은 장소(hiddenLocations) — 구 참조·보상/루팅 아이템 참조 검증
  console.log('\n=== HIDDEN LOCATIONS CHECK ===');
  let hlChecked = 0, hlBad = 0;
  try {
    const hlMod = await import('./hiddenLocations.js');
    const HL = hlMod.default ?? hlMod.HIDDEN_LOCATIONS ?? {};
    const VALID_SEASON_HL = new Set(['spring', 'summer', 'autumn', 'winter']);
    for (const [id, loc] of Object.entries(HL)) {
      hlChecked++;
      if (loc.district && !knownDistricts.has(loc.district)) {
        console.log(`❌ [hidden ${id}] district "${loc.district}" — 존재하지 않는 구`); errors++; hlBad++;
      }
      const uc = loc.unlockConditions ?? {};
      if (uc.explorationThreshold != null && (typeof uc.explorationThreshold !== 'number' || uc.explorationThreshold < 0 || uc.explorationThreshold > 100)) {
        console.log(`❌ [hidden ${id}] explorationThreshold "${uc.explorationThreshold}" — 0~100`); errors++; hlBad++;
      }
      if (uc.season && !VALID_SEASON_HL.has(uc.season)) {
        console.log(`❌ [hidden ${id}] unlockConditions.season "${uc.season}" — spring/summer/autumn/winter`); errors++; hlBad++;
      }
      for (const it of (loc.rewards ?? [])) {
        if (it.definitionId && !allItemIds.has(it.definitionId)) { console.log(`⚠️  [hidden ${id}] rewards "${it.definitionId}" not in items`); warnings++; }
      }
      for (const r of (loc.lootTable ?? [])) {
        if (r.definitionId && !allItemIds.has(r.definitionId)) { console.log(`⚠️  [hidden ${id}] lootTable "${r.definitionId}" not in items`); warnings++; }
      }
    }
    console.log(`  검사한 숨은 장소: ${hlChecked}, 오류: ${hlBad}`);
  } catch (e) {
    console.log(`⚠️  hiddenLocations.js 로드 실패 — ${e.message}`);
    warnings++;
  }

  // Summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total items: ${allItemIds.size}`);
  console.log(`Total blueprints: ${Object.keys(allBlueprints).length}`);
  console.log(`Total secret combos: ${secret.length}`);
  console.log(`Total patients: ${patientCount}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  console.log(errors === 0 ? '\u2705 ALL CLEAR' : '\u274C FIX ERRORS ABOVE');
}

// === MAIN QUEST SCHEMA VALIDATOR (export) ===
// subObjectives: id/text \uD544\uC218, id \uC911\uBCF5 \uAE08\uC9C0
// locationHint: districtId/landmarkId\uAC00 ctx\uC5D0 \uC8FC\uC5B4\uC9C4 Set\uC5D0 \uC874\uC7AC\uD558\uB294\uC9C0 \uD655\uC778 (Set \uBBF8\uC8FC\uC785 \uC2DC \uAC80\uC99D \uC0DD\uB7B5)
export function validateMainQuestSchema(quest, ctx = {}) {
  const errors = [];
  const { knownDistricts = null, knownLandmarks = null, npcQuestStepCounts = null } = ctx;

  // 크로스오버 퀘스트의 체크리스트는 대상 NPC 의뢰 step을 미러링한다.
  // npcStep이 실제 step 범위를 벗어나면 그 줄은 영원히 미완료로 남는다.
  const crossover = quest.objective?.type === 'npc_quest_complete';
  const stepCount = crossover && npcQuestStepCounts
    ? npcQuestStepCounts[`${quest.objective.npcId}:${quest.objective.questId}`]
    : null;
  if (crossover && npcQuestStepCounts && stepCount == null) {
    errors.push(`${quest.id}: objective npc quest "${quest.objective.npcId}/${quest.objective.questId}" unknown`);
  }

  if (quest.subObjectives !== undefined) {
    if (!Array.isArray(quest.subObjectives)) {
      errors.push(`${quest.id}: subObjectives must be array`);
    } else {
      const seenIds = new Set();
      quest.subObjectives.forEach((so, i) => {
        if (!so.id) errors.push(`${quest.id}: subObjectives[${i}].id missing`);
        if (!so.text) errors.push(`${quest.id}: subObjectives[${i}].text missing`);
        if (so.id && seenIds.has(so.id)) {
          errors.push(`${quest.id}: subObjectives[${i}] duplicate id "${so.id}"`);
        }
        if (so.id) seenIds.add(so.id);

        if (so.npcStep != null) {
          if (!crossover) {
            errors.push(`${quest.id}: subObjectives[${i}].npcStep requires objective.type "npc_quest_complete"`);
          } else if (!Number.isInteger(so.npcStep) || so.npcStep < 0) {
            errors.push(`${quest.id}: subObjectives[${i}].npcStep must be a non-negative integer`);
          } else if (stepCount != null && so.npcStep >= stepCount) {
            errors.push(`${quest.id}: subObjectives[${i}].npcStep ${so.npcStep} out of range (steps: ${stepCount})`);
          }
          if (so.match) {
            errors.push(`${quest.id}: subObjectives[${i}] has both npcStep and match — pick one`);
          }
        }
      });
    }
  }

  if (quest.locationHint) {
    const lh = quest.locationHint;
    if (knownDistricts && lh.districtId && !knownDistricts.has(lh.districtId)) {
      errors.push(`${quest.id}: locationHint.districtId "${lh.districtId}" unknown`);
    }
    if (knownLandmarks && lh.landmarkId && !knownLandmarks.has(lh.landmarkId)) {
      errors.push(`${quest.id}: locationHint.landmarkId "${lh.landmarkId}" unknown`);
    }
  }

  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validate().catch((e) => {
    console.error('Validation failed:', e);
    process.exitCode = 1;
  });
}
