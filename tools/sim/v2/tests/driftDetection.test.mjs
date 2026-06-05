// === driftDetection.test.mjs ===
// drift.mjs의 Proxy 기반 BALANCE 키 추적 검증.

import {
  TRACED_BALANCE,
  trackBalanceUsage,
  getBalanceDriftReport,
  resetDriftTracker,
  balanceFingerprint,
  balanceLeafHash,
  getCharactersDriftReport,
} from '../drift.mjs';
import BALANCE from '../../../../js/data/gameBalance.js';

let pass = 0, fail = 0;

function check(name, cond, detail = '') {
  if (cond) { pass += 1; }
  else      { fail += 1; console.error(`❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

// 1. 초기 상태
resetDriftTracker();
const initial = getBalanceDriftReport();
check('initial used is empty', initial.used.length === 0);
check('initial unused == total', initial.unused.length === initial.total);
check('BALANCE has 200+ leaf keys', initial.total >= 200, `got ${initial.total}`);

// 2. TRACED_BALANCE로 키 읽기 → 자동 추적
const h = TRACED_BALANCE.stats.hydrationDecayPerTP;
const a = TRACED_BALANCE.armor.damageReductionCap;
check('TRACED_BALANCE returns correct value (hydration)', h === 1);
check('TRACED_BALANCE returns correct value (armor cap)', a === 0.5);

const afterRead = getBalanceDriftReport();
check('after read, used has 2 entries', afterRead.used.length === 2, `got ${afterRead.used.length}`);
check('used includes stats.hydrationDecayPerTP', afterRead.used.includes('stats.hydrationDecayPerTP'));
check('used includes armor.damageReductionCap', afterRead.used.includes('armor.damageReductionCap'));

// 3. manual track
trackBalanceUsage('stats.nutritionDecayPerTP');
const afterManual = getBalanceDriftReport();
check('manual track adds key', afterManual.used.includes('stats.nutritionDecayPerTP'));

// 4. 의도적으로 미사용 키 검출 (drift detection 핵심)
const unused = afterManual.unused;
check('unused has many entries (drift detection working)', unused.length > 100,
      `got ${unused.length} (total ${afterManual.total})`);

// 5. coverage 계산
check('coverage in [0, 1]', afterManual.coverage >= 0 && afterManual.coverage <= 1);

// 6. reset
resetDriftTracker();
const afterReset = getBalanceDriftReport();
check('after reset, used is empty', afterReset.used.length === 0);

// 7. balanceFingerprint 결정성
const fp1 = balanceFingerprint();
const fp2 = balanceFingerprint();
check('balanceFingerprint deterministic', fp1 === fp2);
check('balanceFingerprint format', typeof fp1 === 'string' && fp1.startsWith('len'));

// 8. CHARACTERS drift report
const charReport = getCharactersDriftReport();
check('characters has many fields', charReport.totalFields > 10);
check('characters drift report has sampleKeys', Array.isArray(charReport.sampleKeys));

// 9. balanceLeafHash — 중첩 leaf 값 변경 탐지 (balanceFingerprint KEY 기반 한계 보완)
const lh1 = balanceLeafHash();
check('balanceLeafHash deterministic', lh1 === balanceLeafHash());
check('balanceLeafHash format', typeof lh1 === 'string' && lh1.startsWith('n'));

const fpBefore = balanceFingerprint();
const origLeaf  = BALANCE.stats.hydrationDecayPerTP;
BALANCE.stats.hydrationDecayPerTP = origLeaf + 0.123;
const lhAfter = balanceLeafHash();
const fpAfter = balanceFingerprint();
BALANCE.stats.hydrationDecayPerTP = origLeaf; // 복원
check('balanceLeafHash detects nested value change', lhAfter !== lh1, `${lh1} vs ${lhAfter}`);
check('balanceFingerprint MISSES nested value change (KEY 기반 한계 입증)', fpAfter === fpBefore);
check('balanceLeafHash restored after revert', balanceLeafHash() === lh1);

console.log(`\n=== driftDetection.test ===`);
console.log(`Pass: ${pass}, Fail: ${fail}`);
console.log(`BALANCE total leaves: ${afterReset.total}, fingerprint: ${fp1}, leafHash: ${lh1}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL PASS');
