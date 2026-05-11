// === drift.mjs ===
// BALANCE 및 CHARACTERS 키 사용 추적. Proxy 기반.
// Phase 0 spike에서 ESM dynamic import 호환성 검증 완료.

import BALANCE from '../../../js/data/gameBalance.js';
import CHARACTERS from '../../../js/data/characters.js';

const usedBalance = new Set();
const usedCharacterFields = new Set();

function makeProxy(obj, path = '', tracker = usedBalance) {
  return new Proxy(obj, {
    get(target, key) {
      if (typeof key === 'symbol') return target[key];
      const fullPath = path ? `${path}.${String(key)}` : String(key);
      const val = target[key];
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Function)) {
        return makeProxy(val, fullPath, tracker);
      }
      tracker.add(fullPath);
      return val;
    },
  });
}

// BALANCE를 시뮬에서 사용할 때 이걸 import 권장 (단 PR2에서는 게임 시스템이 자체 BALANCE를 사용하므로 추후 진정한 trace는 module-level patching이 필요)
export const TRACED_BALANCE = makeProxy(BALANCE);

function enumLeaves(obj, path = '', acc = []) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return acc;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = path ? `${path}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Function)) {
      enumLeaves(v, p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

export function trackBalanceUsage(path) {
  usedBalance.add(path);
}

export function getBalanceDriftReport() {
  const all = enumLeaves(BALANCE);
  return {
    used: [...usedBalance].sort(),
    unused: all.filter(p => !usedBalance.has(p)).sort(),
    total: all.length,
    coverage: all.length === 0 ? 0 : usedBalance.size / all.length,
  };
}

export function resetDriftTracker() {
  usedBalance.clear();
  usedCharacterFields.clear();
}

export function getCharactersDriftReport() {
  const allCharFields = new Set();
  for (const ch of CHARACTERS) {
    for (const k of Object.keys(ch)) allCharFields.add(k);
  }
  return {
    totalFields: allCharFields.size,
    sampleKeys: [...allCharFields].sort().slice(0, 10),
  };
}

// 빌드 fingerprint — 정렬된 BALANCE 객체의 JSON sha256-like hash
// (Node crypto 없이 결정성 있는 단순 해시. spike B4 권고 따라 정렬 키 사용)
export function balanceFingerprint() {
  const sorted = JSON.stringify(BALANCE, Object.keys(BALANCE).sort());
  let h = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    h = (h * 31 + sorted.charCodeAt(i)) | 0;
  }
  return `len${sorted.length}-h${(h >>> 0).toString(16)}`;
}
