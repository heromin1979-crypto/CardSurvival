// @vitest-environment happy-dom
// === 엔딩 색 팔레트 테스트 ===
// 그라디언트가 직업이 아니라 "어두운 색" 하나로 수렴해 있었다. 완전히 같은
// 값이 한 쌍 있었고, 다른 직업 엔딩이 같은 직업 엔딩보다 가까운 경우도 있었다.
//
// 규칙: 직업 = 색상(hue), 분기 = 밝기. 두 축을 섞지 않는다.
// 어두운 배경끼리는 RGB 절대 거리가 태생적으로 좁으므로 거리 대신
// "색상이 갈리는가 + 밝기 단계가 구분되는가"로 판정한다.
import { describe, it, expect } from 'vitest';
import { ENDINGS } from '../../js/data/endings.js';

const midStop = (g) => g.match(/#[0-9a-f]{6}(?= 60%)/)?.[0];
const rgb = (hx) => [parseInt(hx.slice(1,3),16), parseInt(hx.slice(3,5),16), parseInt(hx.slice(5,7),16)];
const relLum = (hx) => { const [r,g,b] = rgb(hx); return (0.2126*r + 0.7152*g + 0.0722*b) / 255; };
const hue = (hx) => {
  const [R,G,B] = rgb(hx).map(v => v/255);
  const mx = Math.max(R,G,B), mn = Math.min(R,G,B), d = mx - mn;
  if (!d) return null;
  const h = mx === R ? ((G-B)/d) % 6 : mx === G ? (B-R)/d + 2 : (R-G)/d + 4;
  return (h*60 + 360) % 360;
};
const hueGap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 360 - d); };

const BY_CHAR = {};
for (const e of Object.values(ENDINGS)) {
  if (e.characterId) (BY_CHAR[e.characterId] ??= []).push(e);
}
const CHARS = Object.keys(BY_CHAR);

describe('직업 = 색상', () => {
  it.each(CHARS)('%s 의 엔딩이 한 색상 계열이다', (c) => {
    const hues = BY_CHAR[c].map(e => hue(midStop(e.gradient)));
    expect(hues.every(h => h !== null), '무채색 엔딩').toBe(true);
    const spread = Math.max(...hues.flatMap(x => hues.map(y => hueGap(x, y))));
    expect(spread, `${c} 색상 분산 ${spread.toFixed(0)}°`).toBeLessThanOrEqual(24);
  });

  it('서로 다른 직업은 색상이 갈린다', () => {
    for (let i = 0; i < CHARS.length; i++) {
      for (let j = i + 1; j < CHARS.length; j++) {
        const a = BY_CHAR[CHARS[i]].map(e => hue(midStop(e.gradient)));
        const b = BY_CHAR[CHARS[j]].map(e => hue(midStop(e.gradient)));
        const gap = Math.min(...a.flatMap(x => b.map(y => hueGap(x, y))));
        expect(gap, `${CHARS[i]}↔${CHARS[j]} 간격 ${gap.toFixed(0)}°`).toBeGreaterThanOrEqual(22);
      }
    }
  });
});

describe('분기 = 밝기', () => {
  it.each(CHARS)('%s 의 분기끼리 밝기 단계가 구분된다', (c) => {
    const lums = BY_CHAR[c].map(e => relLum(midStop(e.gradient))).sort((x, y) => x - y);
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i] / lums[i-1], `단계 차이 ${(lums[i]/lums[i-1]).toFixed(2)}배`).toBeGreaterThanOrEqual(1.20);
    }
  });

  it('폴백과 퀘스트 미진행 엔딩이 가장 어둡다', () => {
    // 밝기는 서사의 무게를 나타낸다. 이야기를 밟지 않은 결말이 가장 밝으면 뒤집힌다.
    for (const [c, list] of Object.entries(BY_CHAR)) {
      const lum = (e) => relLum(midStop(e.gradient));
      const base = list.filter(e => e.id.startsWith('char_') || e.id === `mq_${c}`);
      const branch = list.filter(e => !base.includes(e));
      if (!base.length || !branch.length) continue;
      expect(Math.max(...base.map(lum)), c).toBeLessThan(Math.min(...branch.map(lum)));
    }
  });
});

describe('서술문 대비를 해치지 않는다', () => {
  it('중간 정지점이 본문 색과 4.5:1 이상 대비를 유지한다', () => {
    const TEXT = 0.78;   // #d4c9a8 근사 휘도
    for (const list of Object.values(BY_CHAR)) {
      for (const e of list) {
        const ratio = (TEXT + 0.05) / (relLum(midStop(e.gradient)) + 0.05);
        expect(ratio, `${e.id} 대비 ${ratio.toFixed(1)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('완전히 같은 그라디언트가 없다', () => {
  it('승리 엔딩 전체', () => {
    const gs = Object.values(ENDINGS).filter(e => e.category !== 'death').map(e => e.gradient);
    expect(new Set(gs).size).toBe(gs.length);
  });
});
