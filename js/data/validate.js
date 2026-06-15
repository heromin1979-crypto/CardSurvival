// === DATA INTEGRITY VALIDATOR ===
// Run: node js/data/validate.js

import { pathToFileURL } from 'node:url';

import {
  CHARACTER_COMBAT_LOADOUTS,
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from './combatSkills.js';
import { ENEMIES } from './enemies.js';
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
        && !Number.isFinite(explicitProfile.speed)
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.speed must be finite number`);
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
        explicitProfile.ai != null
        && (typeof explicitProfile.ai !== 'string' || explicitProfile.ai.length === 0)
      ) {
        reportEnemyError(`[enemy/${enemyId}] combatProfile.ai must be non-empty string`);
      }
    }

    const profile = buildEnemyProfile(enemy);
    if (!Number.isFinite(profile.speed)) {
      reportEnemyError(`[enemy/${enemyId}] profile.speed must be finite number`);
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

  let mqChecked = 0;
  for (const [id, q] of Object.entries(MAIN_QUESTS)) {
    const r = validateMainQuestSchema({ ...q, id }, { knownDistricts, knownLandmarks });
    for (const e of r.errors) {
      console.log(`\u274C [main quest] ${e}`);
      errors++;
    }
    mqChecked++;
  }
  console.log(`  \uAC80\uC0AC\uD55C \uD018\uC2A4\uD2B8: ${mqChecked}`);

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

  // 14. 숨은 장소(hiddenLocations) — 구 참조·보상/루팅 아이템 참조 검증
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
  const { knownDistricts = null, knownLandmarks = null } = ctx;

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
