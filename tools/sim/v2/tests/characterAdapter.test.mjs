// === characterAdapter.test.mjs ===
// 6직업 모두에 대해 buildCharacterConfig가 characters.js의 진리값과 일치하는지 검증.
// stamina 공식 = strength × endurance / 50 (CharCreate.js:227 정식)

import CHARACTERS from '../../../../js/data/characters.js';
import { buildCharacterConfig, listCharacterIds } from '../characterAdapter.mjs';

const EXPECTED_IDS = ['doctor', 'soldier', 'firefighter', 'homeless', 'chef', 'engineer'];

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

// 1. 6직업 모두 존재
const ids = listCharacterIds();
check('listCharacterIds returns 6 entries', ids.length === 6, `got ${ids.length}`);
for (const id of EXPECTED_IDS) {
  check(`includes "${id}"`, ids.includes(id));
}

// 2. 각 직업 buildCharacterConfig 일치
for (const id of EXPECTED_IDS) {
  const ch = CHARACTERS.find(c => c.id === id);
  if (!ch) {
    check(`characters.js has "${id}"`, false);
    continue;
  }

  const cfg = buildCharacterConfig(id);

  check(`${id}.id matches`,            cfg.id === ch.id);
  check(`${id}.name matches`,          cfg.name === ch.name);
  check(`${id}.maxHp matches`,         cfg.maxHp === ch.maxHp);
  check(`${id}.startDistrict matches`, cfg.startDistrict === ch.homeDist,
        `expected ${ch.homeDist}, got ${cfg.startDistrict}`);

  // stamina 공식 검증
  const expectedStamina = Math.round(ch.strength * ch.endurance / 50);
  check(`${id}.stamina = strength × endurance / 50`,
        cfg.stamina === expectedStamina,
        `expected ${expectedStamina} (= ${ch.strength} × ${ch.endurance} / 50), got ${cfg.stamina}`);

  // skills 키 일치
  const skillKeys = Object.keys(cfg.skills).sort();
  const expectedSkillKeys = Object.keys(ch.startingSkills ?? {}).sort();
  check(`${id}.skills keys`, JSON.stringify(skillKeys) === JSON.stringify(expectedSkillKeys));

  // startInv는 water_bottle 1개 + abilities startingItems 합산
  check(`${id}.startInv has water_bottle`, (cfg.startInv.water_bottle ?? 0) >= 1);

  // combat defaults 존재
  check(`${id}.combatDmgWeapon defined`, Array.isArray(cfg.combatDmgWeapon));
  check(`${id}.combatAcc in [0,1]`,      cfg.combatAcc > 0 && cfg.combatAcc <= 1);
}

// 3. 알 수 없는 직업은 throw
let threw = false;
try { buildCharacterConfig('unknown_id'); }
catch { threw = true; }
check('unknown character throws', threw);

console.log(`\n=== characterAdapter.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
