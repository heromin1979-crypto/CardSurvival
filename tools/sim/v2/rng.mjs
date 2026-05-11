// === Seed-based RNG ===
// 결정성 보장: 동일 시드 → 동일 결과.
// mulberry32 알고리즘.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng, minInclusive, maxInclusive) {
  return Math.floor(rng() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

export function rngPick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
