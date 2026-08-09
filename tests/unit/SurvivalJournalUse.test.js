// @vitest-environment happy-dom
// === 생존 일지 사용 테스트 ===
// 설명은 "매일 사용하면 트라우마·외로움 감소"였지만 onUse도, 읽는 코드도 없어
// 카드를 열어도 버튼이 하나도 붙지 않았다(무게만 차지). 하루 1회·1TP·영구 사용
// 도구로 배선한다.
import { describe, it, expect, beforeEach } from 'vitest';
import MentalSystem from '../../js/systems/MentalSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, characterId: 'engineer',
    hp: { current: 100, max: 100 },
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: {}, diseases: [],
  };
  GameState.stats = {
    hydration: { current: 100, max: 200 }, nutrition: { current: 100, max: 200 },
    temperature: { current: 36, max: 100 }, morale: { current: 60, max: 100 },
    stamina: { current: 50, max: 100 }, fatigue: { current: 20, max: 100 },
    radiation: { current: 0, max: 100 },
    infection: { current: 0, max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.weather = { id: 'sunny' };
  GameState.mental = { anxiety: 40, loneliness: 50, trauma: 30 };
  GameState.companions = [];
  GameState.flags = {};
  GameState.debug = {};
  GameState.ui = { currentState: 'explore' };
}

function carry(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board.bottom[GameState.board.bottom.indexOf(null)] = inst.instanceId;
  return inst;
}

describe('생존 일지 데이터 — 사용 가능 선언', () => {
  const d = () => ITEMS.survival_journal;

  it('일일 사용 설정을 선언한다', () => {
    expect(d().dailyUse).toBeDefined();
  });

  it('트라우마와 외로움을 낮춘다 (설명과 일치)', () => {
    expect(d().dailyUse.trauma).toBeLessThan(0);
    expect(d().dailyUse.loneliness).toBeLessThan(0);
  });

  it('1TP를 소모한다', () => {
    expect(d().dailyUse.tpCost).toBe(1);
  });

  it('영구 사용 도구다 — 분해 산출물도 소모 설정도 없다', () => {
    expect(d().dailyUse.consume).toBeFalsy();
    expect(d().stackable).toBe(false);
  });
});

describe('canUseDaily — 사용 가능 판정', () => {
  beforeEach(resetWorld);

  it('처음에는 사용할 수 있다', () => {
    const inst = carry('survival_journal');
    expect(MentalSystem.canUseDaily(inst.instanceId).ok).toBe(true);
  });

  it('일일 사용 설정이 없는 아이템은 대상이 아니다', () => {
    const inst = carry('compass');
    expect(MentalSystem.canUseDaily(inst.instanceId).ok).toBe(false);
  });

  it('같은 날 두 번째는 막히고 사유를 준다', () => {
    const inst = carry('survival_journal');
    MentalSystem.useDailyItem(inst.instanceId);
    const status = MentalSystem.canUseDaily(inst.instanceId);
    expect(status.ok).toBe(false);
    expect(status.reason).toBeTruthy();
  });

  it('다음 날이 되면 다시 사용할 수 있다', () => {
    const inst = carry('survival_journal');
    MentalSystem.useDailyItem(inst.instanceId);
    GameState.time.day += 1;
    expect(MentalSystem.canUseDaily(inst.instanceId).ok).toBe(true);
  });
});

describe('useDailyItem — 실제 효과', () => {
  beforeEach(resetWorld);

  it('트라우마와 외로움이 선언된 만큼 줄어든다', () => {
    const inst = carry('survival_journal');
    const cfg = ITEMS.survival_journal.dailyUse;
    const before = { ...GameState.mental };

    expect(MentalSystem.useDailyItem(inst.instanceId).ok).toBe(true);
    expect(GameState.mental.trauma).toBeCloseTo(before.trauma + cfg.trauma);
    expect(GameState.mental.loneliness).toBeCloseTo(before.loneliness + cfg.loneliness);
  });

  it('불안은 건드리지 않는다 (설명에 없다)', () => {
    const inst = carry('survival_journal');
    const before = GameState.mental.anxiety;
    MentalSystem.useDailyItem(inst.instanceId);
    expect(GameState.mental.anxiety).toBe(before);
  });

  it('수치가 0 아래로 내려가지 않는다', () => {
    const inst = carry('survival_journal');
    GameState.mental.trauma = 0.5;
    GameState.mental.loneliness = 1;
    MentalSystem.useDailyItem(inst.instanceId);
    expect(GameState.mental.trauma).toBe(0);
    expect(GameState.mental.loneliness).toBe(0);
  });

  it('사용해도 일지가 사라지지 않는다 (영구 사용)', () => {
    const inst = carry('survival_journal');
    MentalSystem.useDailyItem(inst.instanceId);
    expect(GameState.cards[inst.instanceId]).toBeDefined();
  });

  it('사용해도 내구도가 닳지 않는다', () => {
    const inst = carry('survival_journal');
    const before = GameState.cards[inst.instanceId].durability;
    MentalSystem.useDailyItem(inst.instanceId);
    expect(GameState.cards[inst.instanceId].durability).toBe(before);
  });

  it('TP를 소모한다', () => {
    const inst = carry('survival_journal');
    const before = GameState.time.totalTP;
    MentalSystem.useDailyItem(inst.instanceId);
    expect(GameState.time.totalTP).toBe(before + ITEMS.survival_journal.dailyUse.tpCost);
  });

  it('쿨다운 중 재사용은 효과도 TP도 없다', () => {
    const inst = carry('survival_journal');
    MentalSystem.useDailyItem(inst.instanceId);
    const mental = { ...GameState.mental };
    const tp = GameState.time.totalTP;

    expect(MentalSystem.useDailyItem(inst.instanceId).ok).toBe(false);
    expect(GameState.mental).toEqual(mental);
    expect(GameState.time.totalTP).toBe(tp);
  });
});

describe('밸런스 — 언커먼 등급 규모', () => {
  const cfg = () => ITEMS.survival_journal.dailyUse;

  it('외로움 완화가 하루 자연 증가(+7.2)를 넘지 않는다', () => {
    expect(Math.abs(cfg().loneliness)).toBeLessThan(7.2);
  });

  it('외로움 완화가 라디오 패시브(하루 -3.6)를 넘지 않는다', () => {
    // 라디오는 rare이고 소지만으로 작동한다. uncommon 능동 아이템이 그보다
    // 세면 등급 위계가 뒤집힌다.
    expect(Math.abs(cfg().loneliness)).toBeLessThanOrEqual(3.6);
  });

  it('트라우마 완화가 중증 질병 1회분(+8)보다 작다', () => {
    expect(Math.abs(cfg().trauma)).toBeLessThan(8);
  });
});
