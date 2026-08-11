// @vitest-environment happy-dom
// === 이지수·최형식 분기별 엔딩 테스트 ===
// 이지수는 분기 4개가 mq_doctor 하나로, 최형식은 3개가 mq_homeless 하나로
// 수렴했다. 백신을 완성한 결말과 군 의료본부를 세운 결말이 같은 문장을 읽었다.
// 강민준(SoldierEndingBranches)과 같은 구조로 분기마다 엔딩을 붙인다.
import { describe, it, expect } from 'vitest';
import { ENDINGS } from '../../js/data/endings.js';
import DOCTOR_QUESTS from '../../js/data/mainQuests/doctor/index.js';
import HOMELESS_QUESTS from '../../js/data/mainQuests/homeless/index.js';

/** 퀘스트 보상이 심는 <직업>_ending 값을 모은다 */
function branchFlags(quests, key) {
  return [...new Set(Object.values(quests)
    .map(q => q?.reward?.flags?.[key])
    .filter(Boolean))];
}

function endingsFor(characterId, key, value, day = 150) {
  const gs = {
    player: { characterId },
    time:   { day },
    flags:  { [`mainQuestComplete_${characterId}`]: true, [key]: value },
    quests: { completed: [] },
  };
  return Object.values(ENDINGS)
    .filter(e => typeof e.condition === 'function')
    .filter(e => { try { return e.condition(gs); } catch { return false; } })
    .map(e => e.id);
}

const CASES = [
  { id: 'doctor',   key: 'doctor_ending',   quests: DOCTOR_QUESTS,   fallback: 'mq_doctor',   count: 4 },
  { id: 'homeless', key: 'homeless_ending', quests: HOMELESS_QUESTS, fallback: 'mq_homeless', count: 3 },
];

describe.each(CASES)('$id — 분기마다 다른 엔딩', ({ id, key, quests, fallback, count }) => {
  const flags = branchFlags(quests, key);

  it('분기 수가 데이터와 일치한다', () => {
    expect(flags).toHaveLength(count);
  });

  it.each(flags)('%s 는 정확히 하나의 엔딩을 연다', (flag) => {
    // 히든 C루트는 D55에 완료되므로 판정일을 넉넉히 잡는다
    expect(endingsFor(id, key, flag)).toHaveLength(1);
  });

  it('분기끼리 엔딩이 겹치지 않는다', () => {
    const ids = flags.map(f => endingsFor(id, key, f)[0]);
    expect(new Set(ids).size, `수렴: ${ids.join(', ')}`).toBe(flags.length);
  });

  it('폴백이 분기를 가로채지 않는다', () => {
    for (const f of flags) {
      expect(endingsFor(id, key, f), `${f}가 ${fallback}로 샌다`).not.toContain(fallback);
    }
  });

  it('분기 플래그가 없는 세이브는 여전히 엔딩을 본다', () => {
    expect(endingsFor(id, key, undefined)).toEqual([fallback]);
  });
});

describe('히든 루트는 완료 시점에 바로 열린다', () => {
  it('c_vaccine은 D55에 판정된다', () => {
    // 보라매 단독 연구는 mq_doctor_side_end(dayTrigger 55)로 끝난다.
    // 조건이 D100이면 완료하고도 45일을 기다려야 한다.
    expect(endingsFor('doctor', 'doctor_ending', 'c_vaccine', 55)).toEqual(['mq_doctor_plague_end']);
  });
});

describe('문체 규칙 준수 — docs/story/VOICE_GUIDE.md', () => {
  const NEW = [
    'mq_doctor_vaccine', 'mq_doctor_data', 'mq_doctor_military', 'mq_doctor_plague_end',
    'mq_homeless_journey', 'mq_homeless_kingdom', 'mq_homeless_broker',
  ];

  it.each(NEW)('%s 첫 줄이 날짜로 시작하지 않는다', (id) => {
    expect(ENDINGS[id].narrative[0]).not.toMatch(/^(100일|D\+|\d+일)/);
  });

  it.each(NEW)('%s 가 갤러리 필드를 갖춘다', (id) => {
    const e = ENDINGS[id];
    expect(e.category).toBe('character');
    expect(e.characterId).toBeTruthy();
    expect(e.subtitle).toBeTruthy();
    expect(e.gradient).toMatch(/^linear-gradient/);
    expect(e.narrative.length).toBeGreaterThanOrEqual(5);
  });

  it('무게가 다른 결말은 길이도 다르다', () => {
    // 협력자 없이 역병을 끝낸 히든 결말이 가장 길고, 폴백이 가장 짧다.
    expect(ENDINGS.mq_doctor_plague_end.narrative.length)
      .toBeGreaterThan(ENDINGS.mq_doctor_data.narrative.length);
    expect(ENDINGS.mq_doctor.narrative.length)
      .toBeLessThan(ENDINGS.mq_doctor_military.narrative.length);
  });

  it('직업 어휘가 서술문에 살아 있다', () => {
    const doctorText = ['mq_doctor_vaccine','mq_doctor_data','mq_doctor_military','mq_doctor_plague_end']
      .map(id => ENDINGS[id].narrative.join(' ')).join(' ');
    expect(doctorText).toMatch(/투여|처치|병상|항생제|혈청|임상/);
    const homelessText = ['mq_homeless_journey','mq_homeless_kingdom','mq_homeless_broker']
      .map(id => ENDINGS[id].narrative.join(' ')).join(' ');
    expect(homelessText).toMatch(/장부|자산|부채|목록|담보/);
  });
});

describe('엔딩 화면 제목이 서로 겹치지 않는다', () => {
  it.each(['doctor', 'homeless'])('%s', (characterId) => {
    const titles = Object.values(ENDINGS)
      .filter(e => e.characterId === characterId)
      .map(e => `${e.title}|${e.subtitle}`);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
