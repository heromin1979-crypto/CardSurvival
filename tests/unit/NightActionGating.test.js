// @vitest-environment happy-dom
// === 야간 광원 제한의 UI 노출 테스트 ===
// regression: dismantle()·forage()는 NightSystem.canActAtNight('dismantle')로 막고
// 있었지만 그 판정이 버튼에 반영되지 않아, 밤에 광원 없이도 분해·채취 버튼이 멀쩡히
// 활성 상태로 보였다. 판정을 canDismantleNow/canForage로 끌어내 UI와 공유한다.
import { describe, it, expect, beforeEach } from 'vitest';
import DismantleSystem from '../../js/systems/DismantleSystem.js';
import NightSystem from '../../js/systems/NightSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true,
    traits: [],
    diseases: [],
    equipped: {},
    hp: { current: 80, max: 100 },
    structureEffects: null,
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
    skills: { harvesting: { xp: 0, level: 1 }, crafting: { xp: 0, level: 1 } },
  };
  GameState.stats = {
    hydration: { current: 100, max: 200 }, nutrition: { current: 100, max: 200 },
    temperature: { current: 36, max: 100 }, morale: { current: 50, max: 100 },
    stamina: { current: 50, max: 100 }, fatigue: { current: 20, max: 100 },
    radiation: { current: 0, max: 100 },
    infection: { current: 0, max: 100, rateMultiplier: 1.0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12, isPaused: false };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.crafting = { activeQueue: [], maxQueueSize: 3, knownBlueprints: [] };
  GameState.flags = {};
  GameState.season = { current: 'spring' };
  GameState.weather = { id: 'sunny' };
  GameState.debug = {};
}

function place(definitionId, overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

const setNight = () => { GameState.time.hour = BALANCE.night.startHour; };

describe('야간 판정 전제', () => {
  beforeEach(resetWorld);

  it('정오는 야간이 아니다', () => {
    expect(NightSystem.isNight()).toBe(false);
  });

  it('야간 시작 시각은 야간이다', () => {
    setNight();
    expect(NightSystem.isNight()).toBe(true);
  });

  it('캠프파이어는 광원으로 인정된다', () => {
    setNight();
    expect(NightSystem.hasLightSource()).toBe(false);
    place('campfire');
    expect(NightSystem.hasLightSource()).toBe(true);
  });
});

describe('canDismantleNow — 분해 버튼 판정', () => {
  beforeEach(resetWorld);

  it('낮에는 분해할 수 있다', () => {
    const inst = place('weed_patch');
    expect(DismantleSystem.canDismantleNow(inst.instanceId).ok).toBe(true);
  });

  it('밤에 광원이 없으면 막히고 사유를 준다', () => {
    const inst = place('weed_patch');
    setNight();
    const status = DismantleSystem.canDismantleNow(inst.instanceId);
    expect(status.ok).toBe(false);
    expect(status.reason).toBeTruthy();
  });

  it('밤이어도 광원이 있으면 분해할 수 있다', () => {
    const inst = place('weed_patch');
    place('campfire');
    setNight();
    expect(DismantleSystem.canDismantleNow(inst.instanceId).ok).toBe(true);
  });

  it('분해 테이블이 없는 카드는 낮에도 분해 불가다', () => {
    const inst = place('scrap_metal');
    expect(DismantleSystem.canDismantleNow(inst.instanceId).ok).toBe(false);
  });

  it('실제 분해도 밤·무광원에서 막힌다', () => {
    const inst = place('weed_patch');
    setNight();
    expect(DismantleSystem.dismantle(inst.instanceId).success).toBe(false);
    expect(GameState.cards[inst.instanceId]).toBeDefined();
  });
});

describe('getTpStatus — 버튼 렌더러에 잠금 상태 노출', () => {
  beforeEach(resetWorld);

  it('낮에는 잠기지 않는다', () => {
    const inst = place('weed_patch');
    expect(DismantleSystem.getTpStatus(inst.instanceId).blocked).toBe(false);
  });

  it('밤·무광원이면 잠기고 사유를 함께 준다', () => {
    const inst = place('weed_patch');
    setNight();
    const status = DismantleSystem.getTpStatus(inst.instanceId);
    expect(status.blocked).toBe(true);
    expect(status.blockReason).toBeTruthy();
  });

  it('기존 TP 필드는 그대로 유지된다', () => {
    const inst = place('weed_patch');
    const status = DismantleSystem.getTpStatus(inst.instanceId, 1);
    expect(status.cost).toBe(1);
    expect(status.canDismantle).toBe(true);
    expect(status.crossesMidnight).toBe(false);
  });
});

describe('canForage — 야간 제한 반영', () => {
  beforeEach(resetWorld);

  it('밤에 광원이 없으면 채취 버튼이 잠긴다', () => {
    const inst = place('weed_patch');
    setNight();
    const status = DismantleSystem.canForage(inst.instanceId);
    expect(status.ok).toBe(false);
    expect(status.reason).toBeTruthy();
  });

  it('밤이어도 광원이 있으면 채취할 수 있다', () => {
    const inst = place('weed_patch');
    place('campfire');
    setNight();
    expect(DismantleSystem.canForage(inst.instanceId).ok).toBe(true);
  });

  it('재생 쿨다운이 야간 사유보다 먼저 안내된다', () => {
    const inst = place('weed_patch');
    DismantleSystem.forage(inst.instanceId);
    setNight();
    expect(DismantleSystem.canForage(inst.instanceId).daysLeft).toBeGreaterThan(0);
  });
});
