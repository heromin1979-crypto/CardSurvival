// @vitest-environment happy-dom
// === 엔딩 서술문 형식 테스트 ===
// 승리 엔딩 34개가 예외 없이 정확히 5줄이었고, 7개가 "100일."이라는 같은
// 단어로 시작했다. 9단계를 밟은 헬기 탈출과 폴백 엔딩이 같은 분량을 받았다.
// docs/story/VOICE_GUIDE.md: 길이는 결말의 무게를 나타낸다.
import { describe, it, expect } from 'vitest';
import { ENDINGS } from '../../js/data/endings.js';
import DOCTOR from '../../js/data/mainQuests/doctor/index.js';
import SOLDIER from '../../js/data/mainQuests/soldier/index.js';
import ENGINEER from '../../js/data/mainQuests/engineer/index.js';
import CHEF from '../../js/data/mainQuests/chef/index.js';
import FIREFIGHTER from '../../js/data/mainQuests/firefighter/index.js';
import HOMELESS from '../../js/data/mainQuests/homeless/index.js';

const QUESTS = { doctor: DOCTOR, soldier: SOLDIER, engineer: ENGINEER,
                 chef: CHEF, firefighter: FIREFIGHTER, homeless: HOMELESS };
const VICTORY = Object.values(ENDINGS).filter(e => e.category !== 'death');

/** 그 엔딩에 닿기까지 밟는 퀘스트 체인의 깊이.
 *  캠페인 길이를 전 직업 D205로 정규화한 뒤로 dayTrigger는 변별력이 없다. */
const DEPTH = {};
for (const [c, quests] of Object.entries(QUESTS)) {
  const depth = (id) => { let d = 0, cur = quests[id]; const seen = new Set();
    while (cur && !seen.has(cur.id)) { seen.add(cur.id); d++; cur = quests[cur.prerequisite]; } return d; };
  for (const q of Object.values(quests)) {
    const f = q?.reward?.flags ?? {};
    const k = Object.keys(f).find(x => x.endsWith('_ending'));
    if (k) DEPTH[`${c}:${f[k]}`] = depth(q.id);
  }
}
const flagOf = (e) => String(e.condition).match(/_ending === '([^']+)'/)?.[1] ?? null;
const depthOf = (e) => e.characterId ? (DEPTH[`${e.characterId}:${flagOf(e)}`] ?? null) : null;

describe('길이가 결말의 무게를 나타낸다', () => {
  it('한 가지 길이로 수렴하지 않는다', () => {
    const counts = {};
    for (const e of VICTORY) counts[e.narrative.length] = (counts[e.narrative.length] ?? 0) + 1;
    expect(Object.keys(counts).length, `분포: ${JSON.stringify(counts)}`).toBeGreaterThanOrEqual(4);
    // 어느 한 길이가 전체의 절반을 넘지 않는다
    expect(Math.max(...Object.values(counts))).toBeLessThan(VICTORY.length / 2);
  });

  it('폴백과 퀘스트 미진행 엔딩이 짧다', () => {
    const short = VICTORY.filter(e =>
      e.id.startsWith('char_') || (e.characterId && e.id === `mq_${e.characterId}`));
    for (const e of short) {
      expect(e.narrative.length, `${e.id}`).toBeLessThanOrEqual(4);
    }
  });

  it('마일스톤은 짧다', () => {
    for (const e of VICTORY.filter(e => e.category === 'milestone')) {
      expect(e.narrative.length, `${e.id}`).toBeLessThanOrEqual(4);
    }
  });

  // 7줄은 "특별히 무거운 결말"에만 준다. 근거를 여기 적어두어야
  // 나중에 아무 엔딩이나 길어지는 것을 막을 수 있다.
  const HEAVY = {
    mq_engineer_heli:     '9단계 헬기 조립 — 전 직업 최심 체인',
    mq_chef_network:      '9단계 보급망 확장',
    mq_chef_farm:         '9단계 자급 농장',
    mq_chef_ascension:    '9단계 미식 복원',
    mq_doctor_plague_end: '협력자·보급·경계 없이 역병의 원인을 끊은 히든 루트',
  };

  it('7줄 이상인 엔딩은 무게가 명시된 것뿐이다', () => {
    const long = VICTORY.filter(e => e.narrative.length >= 7).map(e => e.id);
    expect(long.sort()).toEqual(Object.keys(HEAVY).sort());
  });

  it('전 직업 최심 체인 엔딩이 가장 길다', () => {
    const deepest = VICTORY
      .filter(e => depthOf(e) !== null)
      .sort((a, b) => depthOf(b) - depthOf(a))[0];
    expect(deepest.id).toBe('mq_engineer_heli');
    expect(deepest.narrative.length)
      .toBeGreaterThanOrEqual(Math.max(...VICTORY.map(e => e.narrative.length)));
  });

  it('분기 엔딩이 폴백보다 길다', () => {
    for (const [c, quests] of Object.entries(QUESTS)) {
      void quests;
      const list = VICTORY.filter(e => e.characterId === c);
      const base = list.filter(e => e.id.startsWith('char_') || e.id === `mq_${c}`);
      const branch = list.filter(e => !base.includes(e));
      if (!base.length || !branch.length) continue;
      expect(Math.max(...base.map(e => e.narrative.length)), c)
        .toBeLessThanOrEqual(Math.min(...branch.map(e => e.narrative.length)));
    }
  });
});

describe('첫 줄이 상투구로 시작하지 않는다', () => {
  it('날짜로 여는 엔딩이 없다', () => {
    const bad = VICTORY.filter(e => /^(100일|D\+|\d+일이? )/.test(e.narrative[0]));
    expect(bad.map(e => e.id), '날짜는 subtitle로 보낸다').toEqual([]);
  });

  it('첫 줄이 서로 겹치지 않는다', () => {
    const firsts = VICTORY.map(e => e.narrative[0]);
    expect(new Set(firsts).size).toBe(firsts.length);
  });
});

describe('문장이 다른 엔딩과 겹치지 않는다', () => {
  const toks = (s) => new Set(s.replace(/[.,"'—·]/g, ' ').split(/\s+/).filter(x => x.length > 1));
  const jaccard = (a, b) => {
    const A = toks(a), B = toks(b);
    let inter = 0; for (const x of A) if (B.has(x)) inter++;
    return inter / (A.size + B.size - inter);
  };

  it('유사도 0.45 이상인 문장 쌍이 없다', () => {
    const hits = [];
    for (let i = 0; i < VICTORY.length; i++) {
      for (let j = i + 1; j < VICTORY.length; j++) {
        for (const a of VICTORY[i].narrative) {
          for (const b of VICTORY[j].narrative) {
            if (jaccard(a, b) >= 0.45) hits.push(`${VICTORY[i].id}↔${VICTORY[j].id}`);
          }
        }
      }
    }
    expect([...new Set(hits)]).toEqual([]);
  });
});
