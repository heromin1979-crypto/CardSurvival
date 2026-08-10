// @vitest-environment happy-dom
// === 강민준 분기별 엔딩 테스트 ===
// 분기는 넷(a1_rescue / b1_network / b2_helicopter / b3_suwon)인데 엔딩은
// 둘뿐이었다. mq_soldier가 soldier_ending !== 'b2_helicopter'로 나머지 셋을
// 통째로 받아, 수원까지 걸어간 플레이어와 전국 통신망을 세운 플레이어가
// 같은 화면("서울 집결 좌표 — KBS 방송 수신 확인")을 봤다.
import { describe, it, expect } from 'vitest';
import { ENDINGS } from '../../js/data/endings.js';
import SOLDIER_BRANCH_A from '../../js/data/mainQuests/soldier/branch_a.js';
import SOLDIER_BRANCH_B from '../../js/data/mainQuests/soldier/branch_b.js';

/** 퀘스트 보상이 심는 soldier_ending 플래그 값을 모두 모은다 */
const BRANCH_FLAGS = [...new Set(
  [...Object.values(SOLDIER_BRANCH_A), ...Object.values(SOLDIER_BRANCH_B)]
    .map(q => q?.reward?.flags?.soldier_ending)
    .filter(Boolean))];

function endingsFor(flagValue) {
  const gs = {
    player: { characterId: 'soldier' },
    time:   { day: 150 },
    flags:  { mainQuestComplete_soldier: true, soldier_ending: flagValue },
    quests: { completed: [] },
  };
  return Object.values(ENDINGS)
    .filter(e => typeof e.condition === 'function')
    .filter(e => { try { return e.condition(gs); } catch { return false; } })
    .map(e => e.id);
}

describe('분기 데이터', () => {
  it('네 갈래가 서로 다른 플래그를 남긴다', () => {
    expect(BRANCH_FLAGS).toHaveLength(4);
    expect(BRANCH_FLAGS).toEqual(expect.arrayContaining(
      ['a1_rescue', 'b1_network', 'b2_helicopter', 'b3_suwon']));
  });
});

describe('분기마다 다른 엔딩에 도달한다', () => {
  it.each(BRANCH_FLAGS)('%s 는 정확히 하나의 엔딩을 연다', (flag) => {
    expect(endingsFor(flag)).toHaveLength(1);
  });

  it('네 분기가 서로 다른 엔딩으로 간다', () => {
    const ids = BRANCH_FLAGS.map(f => endingsFor(f)[0]);
    expect(new Set(ids).size, `수렴: ${ids.join(', ')}`).toBe(BRANCH_FLAGS.length);
  });

  it('63빌딩 분기는 군인 전용 헬기 엔딩으로 간다', () => {
    expect(endingsFor('b2_helicopter')).toEqual(['escape_helicopter']);
  });
});

describe('mq_soldier — 예외 경로만 맡는다', () => {
  it('분기 플래그가 있으면 열리지 않는다', () => {
    for (const flag of BRANCH_FLAGS) {
      expect(endingsFor(flag), `${flag}가 mq_soldier로 샌다`).not.toContain('mq_soldier');
    }
  });

  it('분기 플래그가 없는 구버전 세이브는 여전히 엔딩을 본다', () => {
    // 조건을 좁히면서 폴백까지 없애면 완주하고도 엔딩이 안 뜬다.
    expect(endingsFor(undefined)).toEqual(['mq_soldier']);
  });
});

describe('신규 엔딩 데이터 정합성', () => {
  const NEW = ['mq_soldier_rescue', 'mq_soldier_network', 'mq_soldier_suwon'];

  it.each(NEW)('%s 가 갤러리에 필요한 필드를 갖춘다', (id) => {
    const e = ENDINGS[id];
    expect(e).toBeDefined();
    expect(e.characterId).toBe('soldier');
    expect(e.category).toBe('character');   // EndingSystem의 승리 카테고리
    expect(e.title).toBeTruthy();
    expect(e.subtitle).toBeTruthy();
    expect(e.gradient).toBeTruthy();
    expect(e.narrative.length).toBeGreaterThanOrEqual(3);
  });

  it('제목이 서로 겹치지 않는다', () => {
    const soldierEndings = Object.values(ENDINGS).filter(e => e.characterId === 'soldier');
    const titles = soldierEndings.map(e => `${e.title}|${e.subtitle}`);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
