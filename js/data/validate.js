// === DATA INTEGRITY VALIDATOR ===
// Run: node --input-type=module js/data/validate.js

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

  // Summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total items: ${allItemIds.size}`);
  console.log(`Total blueprints: ${Object.keys(allBlueprints).length}`);
  console.log(`Total secret combos: ${secret.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  console.log(errors === 0 ? '\u2705 ALL CLEAR' : '\u274C FIX ERRORS ABOVE');
}

validate().catch(e => console.error('Validation failed:', e));
