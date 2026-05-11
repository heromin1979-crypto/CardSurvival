// === startDistrict.test.mjs ===
// 7직업 모두의 startDistrict가 districts.js에 존재하는 정식 구 ID인지 검증.

import { listCharacterIds, buildCharacterConfig } from '../characterAdapter.mjs';
import { DISTRICTS } from '../../../../js/data/districts.js';

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

const districtIds = new Set(Object.keys(DISTRICTS));

check('districts.js has at least 25 districts', districtIds.size >= 25, `got ${districtIds.size}`);

for (const charId of listCharacterIds()) {
  const cfg = buildCharacterConfig(charId);
  const startDistrict = cfg.startDistrict;
  check(
    `${charId} startDistrict "${startDistrict}" is a valid district`,
    districtIds.has(startDistrict),
    `not in districts.js`
  );
}

// 시작 위험도 분포 정보 출력 (참고용)
console.log('\n=== Start District Danger Distribution ===');
for (const charId of listCharacterIds()) {
  const cfg = buildCharacterConfig(charId);
  const district = DISTRICTS[cfg.startDistrict];
  if (district) {
    console.log(`  ${charId.padEnd(12)} ${cfg.startDistrict.padEnd(14)} dangerLevel ${district.dangerLevel}`);
  }
}

console.log(`\n=== startDistrict.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
