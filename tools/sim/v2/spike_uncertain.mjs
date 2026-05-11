// === PR2.5 spike — UNCERTAIN 17 시스템 일괄 검증 ===
// 4단계: import / init / tpAdvance / classify
// 결과: BOOTSTRAP 승급 / SKIP 강등 분류

import { installGlobalShim } from './mocks/globalShim.mjs';
installGlobalShim();

import EventBus from '../../../js/core/EventBus.js';

const UNCERTAIN_SYSTEMS = [
  ['EcologySystem',      '../../../js/systems/EcologySystem.js'],
  ['NPCSystem',          '../../../js/systems/NPCSystem.js'],
  ['NPCRelationSystem',  '../../../js/systems/NPCRelationSystem.js'],
  ['NPCGroupSystem',     '../../../js/systems/NPCGroupSystem.js'],
  ['NPCStorySystem',     '../../../js/systems/NPCStorySystem.js'],
  ['DispatchSystem',     '../../../js/systems/DispatchSystem.js'],
  ['GuardSystem',        '../../../js/systems/GuardSystem.js'],
  ['PatientIntakeSystem','../../../js/systems/PatientIntakeSystem.js'],
  ['MentalSystem',       '../../../js/systems/MentalSystem.js'],
  ['EncumbranceSystem',  '../../../js/systems/EncumbranceSystem.js'],
  ['CraftSystem',        '../../../js/systems/CraftSystem.js'],
  ['CombatSystem',       '../../../js/systems/CombatSystem.js'],
  ['ExploreSystem',      '../../../js/systems/ExploreSystem.js'],
  ['BasecampSystem',     '../../../js/systems/BasecampSystem.js'],
  ['HiddenElementSystem','../../../js/systems/HiddenElementSystem.js'],
  ['SubwaySystem',       '../../../js/systems/SubwaySystem.js'],
  ['NPCQuestSystem',     '../../../js/systems/NPCQuestSystem.js'],
];

const results = [];

for (const [name, path] of UNCERTAIN_SYSTEMS) {
  const r = { name, importOK: false, hasInit: false, initOK: false, tpAdvanceOK: false, error: null };

  // Step 1: import
  let mod = null;
  try {
    mod = (await import(path)).default;
    r.importOK = true;
  } catch (e) {
    r.error = `IMPORT: ${e.message}`;
    results.push(r);
    continue;
  }

  // Step 2: init() 존재 + 호출
  if (typeof mod?.init === 'function') {
    r.hasInit = true;
    try {
      mod.init();
      r.initOK = true;
    } catch (e) {
      r.error = `INIT: ${e.message}`;
      results.push(r);
      continue;
    }
  } else {
    r.error = 'no init() method';
    results.push(r);
    continue;
  }

  // Step 3: single tpAdvance emit
  try {
    EventBus.emit('tpAdvance', { totalTP: 0 });
    r.tpAdvanceOK = true;
  } catch (e) {
    r.error = `TP_ADVANCE: ${e.message}`;
  }

  // Cleanup
  EventBus._listeners = {};

  results.push(r);
}

// Output
console.log('\n=== UNCERTAIN 17 spike results ===\n');

const promote = [];   // BOOTSTRAP 승급 후보
const conditional = []; // globalShim 또는 GameState reset 보강 후 가능
const demote = [];    // SKIP 강등

for (const r of results) {
  const ok = r.importOK && r.initOK && r.tpAdvanceOK;
  const partial = r.importOK && r.initOK && !r.tpAdvanceOK;
  const fail = !r.importOK || !r.initOK;

  let status = '';
  if (ok)        { status = '✅ BOOTSTRAP'; promote.push(r.name); }
  else if (partial) { status = '⚠️  CONDITIONAL'; conditional.push(r.name); }
  else           { status = '❌ SKIP';       demote.push(r.name); }

  console.log(`${status.padEnd(20)} ${r.name.padEnd(22)} ${r.error ?? ''}`);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Promote to BOOTSTRAP: ${promote.length}`);
console.log(`Conditional (reset/shim 보강 필요): ${conditional.length}`);
console.log(`Demote to SKIP:       ${demote.length}`);
console.log(`Total:                ${results.length}`);

console.log(`\n--- Promote list ---`);
for (const n of promote) console.log(`  ${n}`);
console.log(`\n--- Conditional list ---`);
for (const n of conditional) console.log(`  ${n}`);
console.log(`\n--- Demote list ---`);
for (const n of demote) console.log(`  ${n}`);
