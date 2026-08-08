// @vitest-environment happy-dom
// === 구조물 지속 효과(def.effect) 배선 회귀 테스트 ===
// regression: medical_structure 9종의 def.effect(infectionResist/restHealMult/
// infectionSpreadBlock/detectHiddenDisease)를 읽는 시스템이 없어 제작해도
// 아무 효과가 없던 문제. onTick만 처리하던 StatSystem으로는 지속 배율·차단을
// 표현할 수 없어 집계 전용 모듈을 신설했다.
import { describe, it, expect, beforeEach } from 'vitest';
import StructureEffectSystem from '../../js/systems/StructureEffectSystem.js';
import StatSystem from '../../js/systems/StatSystem.js';
import DiseaseSystem from '../../js/systems/DiseaseSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true,
    diseases: [],
    equipped: {},
    skills: {},
    hp: { current: 80, max: 100 },
    structureEffects: null,
    permanentInfectionImmunity: false,
    permanentDiseaseResist: 0,
    structureDurabilityBonus: 1.0,
  };
  GameState.stats = {
    hydration:   { current: 100, max: 200 },
    nutrition:   { current: 100, max: 200 },
    temperature: { current: 36,  max: 100 },
    morale:      { current: 50,  max: 100 },
    stamina:     { current: 50,  max: 100 },
    fatigue:     { current: 20,  max: 100 },
    radiation:   { current: 0,   max: 100 },
    infection:   { current: 0,   max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.flags = {};
  GameState.debug = {};
  StructureEffectSystem.refresh(GameState);
}

/** 구조물 카드를 보드(middle)에 올리고 인스턴스를 반환 */
function placeStructure(definitionId, overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  const slot = GameState.board.middle.indexOf(null);
  GameState.board.middle[slot] = inst.instanceId;
  StructureEffectSystem.refresh(GameState);
  return inst;
}

describe('StructureEffectSystem — 집계', () => {
  beforeEach(resetWorld);

  it('구조물이 없으면 중립값을 반환한다', () => {
    expect(StructureEffectSystem.get(GameState)).toEqual({
      infectionResist: 0,
      restHealMult: 1.0,
      surgeryHealMult: 1.0,
      medicalStorageSlots: 0,
      infectionSpreadBlock: false,
      detectHiddenDisease: false,
    });
  });

  it('방역 스테이션 1개는 감염 저항 0.2를 준다', () => {
    placeStructure('quarantine_station');
    expect(StructureEffectSystem.get(GameState).infectionResist).toBeCloseTo(0.2);
  });

  it('방역 스테이션 2개는 합산되어 0.4가 된다', () => {
    placeStructure('quarantine_station');
    placeStructure('quarantine_station');
    expect(StructureEffectSystem.get(GameState).infectionResist).toBeCloseTo(0.4);
  });

  it('감염 저항 합계는 밸런스 상한을 넘지 않는다', () => {
    for (let i = 0; i < 10; i++) placeStructure('quarantine_station');
    expect(StructureEffectSystem.get(GameState).infectionResist)
      .toBe(BALANCE.medicalStation.infectionResistCap);
  });

  it('내구도가 0인 구조물은 효과를 내지 않는다', () => {
    placeStructure('quarantine_station', { durability: 0 });
    expect(StructureEffectSystem.get(GameState).infectionResist).toBe(0);
  });

  it('의료 침대는 휴식 배율 1.5를 준다', () => {
    placeStructure('medical_bed');
    expect(StructureEffectSystem.get(GameState).restHealMult).toBe(1.5);
  });

  it('의료 침대 2개를 놓아도 배율은 곱해지지 않는다 (최대값 채택)', () => {
    placeStructure('medical_bed');
    placeStructure('medical_bed');
    expect(StructureEffectSystem.get(GameState).restHealMult).toBe(1.5);
  });

  it('격리 병동은 감염 전파 차단 플래그를 켠다', () => {
    placeStructure('isolation_ward');
    expect(StructureEffectSystem.get(GameState).infectionSpreadBlock).toBe(true);
  });

  it('X-ray 스테이션은 잠복 질병 탐지 플래그를 켠다', () => {
    placeStructure('xray_station');
    expect(StructureEffectSystem.get(GameState).detectHiddenDisease).toBe(true);
  });

  it('현재 구역에 설치된 구조물도 집계 대상이다', () => {
    GameState.location.installedStructures.junggoo = {
      id: 'quarantine_station', durability: 100, maxDurability: 100,
    };
    StructureEffectSystem.refresh(GameState);
    expect(StructureEffectSystem.get(GameState).infectionResist).toBeCloseTo(0.2);
  });

  it('다른 구역에 설치된 구조물은 집계되지 않는다', () => {
    GameState.location.installedStructures.dongjak = {
      id: 'quarantine_station', durability: 100, maxDurability: 100,
    };
    StructureEffectSystem.refresh(GameState);
    expect(StructureEffectSystem.get(GameState).infectionResist).toBe(0);
  });
});

describe('감염 저항 — GameState.modStat 연동', () => {
  beforeEach(resetWorld);

  it('방역 스테이션이 있으면 감염 증가분이 20% 줄어든다', () => {
    placeStructure('quarantine_station');
    GameState.modStat('infection', 10);
    expect(GameState.stats.infection.current).toBeCloseTo(8);
  });

  it('캐릭터 rateMultiplier와 곱연산으로 적용된다', () => {
    GameState.stats.infection.rateMultiplier = 0.65;  // 의사 -35%
    placeStructure('quarantine_station');
    GameState.modStat('infection', 10);
    expect(GameState.stats.infection.current).toBeCloseTo(10 * 0.65 * 0.8);
  });

  it('감염 감소(치료)에는 저항이 적용되지 않는다', () => {
    GameState.stats.infection.current = 50;
    placeStructure('quarantine_station');
    GameState.modStat('infection', -10);
    expect(GameState.stats.infection.current).toBeCloseTo(40);
  });

  it('구조물이 없으면 감염 증가분이 그대로 적용된다', () => {
    GameState.modStat('infection', 10);
    expect(GameState.stats.infection.current).toBeCloseTo(10);
  });
});

describe('휴식 회복 배율 — scaleRestRecovery', () => {
  beforeEach(resetWorld);

  it('구조물이 없으면 원본 수치를 그대로 돌려준다', () => {
    const effect = { fatigue: -40, stamina: 30, hp: 10 };
    expect(StructureEffectSystem.scaleRestRecovery(effect, GameState)).toEqual(effect);
  });

  it('의료 침대가 있으면 회복 수치 전체가 1.5배가 된다', () => {
    placeStructure('medical_bed');
    const scaled = StructureEffectSystem.scaleRestRecovery(
      { fatigue: -40, stamina: 30, hp: 10 }, GameState);
    expect(scaled).toEqual({ fatigue: -60, stamina: 45, hp: 15 });
  });

  it('명상의 사기 회복에도 배율이 적용된다', () => {
    placeStructure('medical_bed');
    const scaled = StructureEffectSystem.scaleRestRecovery(
      { morale: 20, fatigue: -10, stamina: 15 }, GameState);
    expect(scaled).toEqual({ morale: 30, fatigue: -15, stamina: 23 });
  });

  it('원본 객체를 변경하지 않는다', () => {
    placeStructure('medical_bed');
    const effect = { hp: 10 };
    StructureEffectSystem.scaleRestRecovery(effect, GameState);
    expect(effect.hp).toBe(10);
  });
});

describe('격리 병동 — 전염성 질병 발병 차단', () => {
  beforeEach(resetWorld);

  it('격리 병동이 있으면 전염성 질병에 걸리지 않는다', () => {
    placeStructure('isolation_ward');
    DiseaseSystem._contract(GameState, 'dysentery');
    expect(GameState.player.diseases).toHaveLength(0);
  });

  it('비전염성 질병(저체온증)은 격리 병동으로 막지 못한다', () => {
    placeStructure('isolation_ward');
    DiseaseSystem._contract(GameState, 'hypothermia');
    expect(GameState.player.diseases.map(d => d.id)).toContain('hypothermia');
  });

  it('격리 병동이 없으면 전염성 질병에 걸린다', () => {
    DiseaseSystem._contract(GameState, 'dysentery');
    expect(GameState.player.diseases.map(d => d.id)).toContain('dysentery');
  });
});

describe('X-ray 스테이션 — 잠복 질병 자동 진단', () => {
  beforeEach(resetWorld);

  it('잠복기가 끝난 미발견 질병을 매 TP 공개한다', () => {
    placeStructure('xray_station');
    GameState.player.diseases = [
      { id: 'dysentery', tpElapsed: 5, tpDuration: 300, fatalTp: null, incubationTp: 0, discovered: false },
    ];
    DiseaseSystem.onTP();
    expect(GameState.player.diseases[0].discovered).toBe(true);
  });

  it('잠복기가 남은 질병은 공개하지 않는다', () => {
    placeStructure('xray_station');
    GameState.player.diseases = [
      { id: 'dysentery', tpElapsed: 0, tpDuration: 300, fatalTp: null, incubationTp: 50, discovered: false },
    ];
    DiseaseSystem.onTP();
    expect(GameState.player.diseases[0].discovered).toBe(false);
  });

  it('X-ray가 없으면 미발견 상태가 유지된다', () => {
    GameState.player.diseases = [
      { id: 'dysentery', tpElapsed: 5, tpDuration: 300, fatalTp: null, incubationTp: 0, discovered: false },
    ];
    DiseaseSystem.onTP();
    expect(GameState.player.diseases[0].discovered).toBe(false);
  });
});

describe('medical_structure 내구도 소모', () => {
  beforeEach(resetWorld);

  it('효과를 내는 동안 내구도가 닳는다', () => {
    const inst = placeStructure('quarantine_station');
    const before = inst.durability;
    StatSystem._applyStructureEffects();
    expect(GameState.cards[inst.instanceId].durability)
      .toBeCloseTo(before - BALANCE.medicalStation.durabilityDecayPerTP);
  });

  it('내구도가 0이 되면 카드가 제거되어 효과가 사라진다', () => {
    const inst = placeStructure('quarantine_station', { durability: 0.05 });
    StatSystem._applyStructureEffects();
    expect(GameState.cards[inst.instanceId]).toBeUndefined();
    expect(StructureEffectSystem.get(GameState).infectionResist).toBe(0);
  });
});
