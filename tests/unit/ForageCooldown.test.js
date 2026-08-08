// @vitest-environment happy-dom
// === 살살 채취 재생 쿨다운 테스트 ===
// regression: 잡초밭 등 forage 노드의 '살살 채취' 버튼이 재생 대기 중에도 계속
// 활성 상태로 보여 무한히 클릭할 수 있었다. canForage가 def.forage 존재 여부만 보고
// 인스턴스의 _forageCooldownTp를 읽지 않았다.
import { describe, it, expect, beforeEach } from 'vitest';
import DismantleSystem from '../../js/systems/DismantleSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const TP_PER_DAY = 72;

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

function placeWeedPatch() {
  const inst = GameState.createCardInstance('weed_patch');
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

describe('잡초밭 — forage 데이터 정의', () => {
  it('재생 일수와 수율 배율을 선언한다', () => {
    expect(ITEMS.weed_patch.forage).toEqual({ regrowDays: 3, yieldMult: 0.5 });
  });

  it('살살 채취 산출원이 될 dismantle 테이블이 있다', () => {
    expect(ITEMS.weed_patch.dismantle.length).toBeGreaterThan(0);
  });
});

describe('살살 채취 — 재생 쿨다운', () => {
  beforeEach(resetWorld);

  it('첫 채취는 성공하고 노드는 보드에 남는다', () => {
    const inst = placeWeedPatch();
    const result = DismantleSystem.forage(inst.instanceId);
    expect(result.success).toBe(true);
    expect(GameState.cards[inst.instanceId]).toBeDefined();
  });

  it('첫 채취가 재생 쿨다운을 건다', () => {
    const inst = placeWeedPatch();
    DismantleSystem.forage(inst.instanceId);
    expect(GameState.cards[inst.instanceId]._forageCooldownTp)
      .toBeGreaterThan(GameState.time.totalTP);
  });

  it('쿨다운 중 재채취는 막힌다', () => {
    const inst = placeWeedPatch();
    DismantleSystem.forage(inst.instanceId);
    expect(DismantleSystem.forage(inst.instanceId).success).toBe(false);
  });

  it('쿨다운 중에는 TP도 소모되지 않는다', () => {
    const inst = placeWeedPatch();
    DismantleSystem.forage(inst.instanceId);
    const tpAfterFirst = GameState.time.totalTP;
    DismantleSystem.forage(inst.instanceId);
    expect(GameState.time.totalTP).toBe(tpAfterFirst);
  });

  it('재생 일수가 지나면 다시 채취할 수 있다', () => {
    const inst = placeWeedPatch();
    DismantleSystem.forage(inst.instanceId);
    GameState.time.totalTP += ITEMS.weed_patch.forage.regrowDays * TP_PER_DAY;
    expect(DismantleSystem.forage(inst.instanceId).success).toBe(true);
  });
});

describe('살살 채취 — UI 활성 판정', () => {
  beforeEach(resetWorld);

  it('쿨다운이 없으면 채취 가능 상태다', () => {
    const inst = placeWeedPatch();
    expect(DismantleSystem.canForage(inst.instanceId).ok).toBe(true);
  });

  it('쿨다운 중에는 채취 불가 상태이고 남은 일수를 알려준다', () => {
    const inst = placeWeedPatch();
    DismantleSystem.forage(inst.instanceId);
    const status = DismantleSystem.canForage(inst.instanceId);
    expect(status.ok).toBe(false);
    expect(status.daysLeft).toBe(ITEMS.weed_patch.forage.regrowDays);
  });

  it('forage 노드가 아니면 채취 불가다', () => {
    const inst = GameState.createCardInstance('campfire');
    GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
    expect(DismantleSystem.canForage(inst.instanceId).ok).toBe(false);
  });
});
