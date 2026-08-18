// === 소비재 특수 효과 배선 ===
// regression: cureAllDiseases·cureAllPoisons·cureDespair·trauma·infectionResist·removeStatus는
// ItemEffectSystem의 문구 생성 코드(223~234행)에만 등장했다. 툴팁에는 "모든 질병 치료"라고
// 떴지만 StatSystem.consumeCard가 그 키를 읽지 않아 실제로는 아무 일도 없었다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import StatSystem from '../../js/systems/StatSystem.js';
import DiseaseSystem from '../../js/systems/DiseaseSystem.js';
import MentalSystem from '../../js/systems/MentalSystem.js';

function consume(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  return StatSystem.consumeCard(inst.instanceId);
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.skills = {};
  GameState.player.equipped = {};
  GameState.player.diseases = [];
  GameState.player.despairTicks = 0;
  GameState.player.infectionResistUntilTP = 0;
  GameState.player.infectionResistAmount = 0;
  GameState.player.permanentInfectionResist = 0;
  GameState.player.statusEffects = [];
  GameState.player.hp.current = GameState.player.hp.max;
  GameState.time.totalTP = 100;
  MentalSystem.ensureInitialized();
  GameState.mental.trauma = 20;
  for (const k of ['nutrition', 'hydration', 'morale', 'infection']) {
    const s = GameState.stats[k];
    if (s) s.current = Math.floor(s.max / 2);
  }
});

describe('트라우마 회복', () => {
  it('도토리묵을 먹으면 트라우마가 3 줄어든다', () => {
    consume('acorn_jelly');
    expect(GameState.mental.trauma).toBe(17);
  });

  it('베리 발효주는 5 줄인다', () => {
    consume('berry_wine');
    expect(GameState.mental.trauma).toBe(15);
  });

  it('0 아래로 내려가지 않는다', () => {
    GameState.mental.trauma = 2;
    consume('berry_wine');
    expect(GameState.mental.trauma).toBe(0);
  });
});

describe('질병·독 치료', () => {
  it('외과전문 수술키트는 모든 질병을 낫게 한다', () => {
    DiseaseSystem._contract(GameState, 'influenza');
    DiseaseSystem._contract(GameState, 'poisoning');
    expect(GameState.player.diseases.length).toBe(2);

    consume('surgical_grade_kit');

    expect(GameState.player.diseases.length).toBe(0);
  });

  it('만능 해독제는 중독을 낫게 한다', () => {
    DiseaseSystem._contract(GameState, 'poisoning');
    consume('universal_antidote');
    expect(GameState.player.diseases.map(d => d.id)).not.toContain('poisoning');
  });
});

describe('절망 해소', () => {
  it('원기 회복탕은 절망 누적을 지운다', () => {
    GameState.player.despairTicks = 12;
    consume('special_soup');
    expect(GameState.player.despairTicks).toBe(0);
  });
});

describe('감염 저항 버프', () => {
  it('보양식은 지속시간이 있는 감염 저항을 남긴다', () => {
    consume('recovery_stew');
    expect(GameState.player.infectionResistAmount).toBeCloseTo(0.1);
    expect(GameState.player.infectionResistUntilTP).toBe(120);
  });

  it('송로 리조또는 buff 객체 형태도 처리한다', () => {
    consume('truffle_risotto');
    expect(GameState.player.infectionResistAmount).toBeCloseTo(0.1);
    expect(GameState.player.infectionResistUntilTP).toBe(103);
  });

  it('완성형 항바이러스는 영구 저항을 남긴다', () => {
    consume('completed_antiviral');
    expect(GameState.player.permanentInfectionResist).toBeCloseTo(0.5);
  });

  it('저항이 걸린 동안 감염 상승이 줄어든다', () => {
    const before = GameState.stats.infection.current;
    StatSystem.addInfection(20);
    const plain = GameState.stats.infection.current - before;

    GameState.stats.infection.current = before;
    GameState.player.infectionResistAmount = 0.5;
    GameState.player.infectionResistUntilTP = 200;
    StatSystem.addInfection(20);

    expect(GameState.stats.infection.current - before).toBeLessThan(plain);
  });
});

describe('상태이상 제거', () => {
  it('해장국은 지정한 상태를 없앤다', () => {
    GameState.player.statusEffects = [{ id: 'nausea' }, { id: 'stun' }];
    consume('hangover_soup');
    expect(GameState.player.statusEffects.map(s => s.id)).toEqual(['stun']);
  });
});
