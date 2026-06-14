// === 드랍 개편 Phase 2 — 계절 한정 채집 / 텃밭 자동 수확 / 살살 채취 ===
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DISTRICTS, generateDistrictLoot } from '../../js/data/districts.js';
import GameState from '../../js/core/GameState.js';
import GardenSystem from '../../js/systems/GardenSystem.js';
import DismantleSystem from '../../js/systems/DismantleSystem.js';

// ── (B) 계절 한정 채집 ──────────────────────────────────────────
const TID = '__test_season__';
function installDistrict(lootTable) {
  DISTRICTS[TID] = { id: TID, name: 'T', icon: '🧪', dangerLevel: 1, radiation: 0, adjacentDistricts: [], lootTable };
}
afterEach(() => { delete DISTRICTS[TID]; });

describe('generateDistrictLoot — 계절 한정(seasons) 필터', () => {
  it('entry.seasons가 현재 계절과 맞으면 추첨, 아니면 제외', () => {
    installDistrict([{ definitionId: 'acorn', weight: 100, minQty: 1, maxQty: 1, seasons: ['autumn'] }]);
    const fall = generateDistrictLoot(TID, { season: 'autumn' });
    expect(fall.length).toBeGreaterThan(0);
    const spring = generateDistrictLoot(TID, { season: 'spring' });
    expect(spring.length).toBe(0);  // 제철 아님 → 후보 없음
  });

  it('SEASONAL_ITEMS 큐레이션 기본값도 적용된다 (acorn=가을, seasons 미지정)', () => {
    installDistrict([{ definitionId: 'acorn', weight: 100, minQty: 1, maxQty: 1 }]);
    expect(generateDistrictLoot(TID, { season: 'spring' }).length).toBe(0);   // 큐레이션상 가을 한정
    expect(generateDistrictLoot(TID, { season: 'autumn' }).length).toBeGreaterThan(0);
  });

  it('season 미전달 시 계절 필터 비활성(하위호환)', () => {
    installDistrict([{ definitionId: 'acorn', weight: 100, minQty: 1, maxQty: 1, seasons: ['autumn'] }]);
    expect(generateDistrictLoot(TID).length).toBeGreaterThan(0);  // 필터 off
  });
});

// ── (A) 텃밭 자동 수확 ──────────────────────────────────────────
function resetGarden() {
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(10).fill(null), bottom: Array(10).fill(null) };
  GameState.pendingLoot = [];
  GameState.player = { ...(GameState.player ?? {}), skills: { harvesting: { xp: 0, level: 0 } } };
  GameState.weather = {};
  GameState.flags = GameState.flags ?? {};
}
function placeGardenBed(day, totalTP) {
  GameState.time = { day, totalTP, tpInDay: 0, hour: 12 };
  const inst = GameState.createCardInstance('garden_bed_veggie');
  GameState.board.middle[0] = inst.instanceId;
  inst._lastGrowTP = 0;
  inst._growthTp = 0;
  return inst;
}
function countCrop(itemId) {
  return GameState.board.middle
    .filter(Boolean)
    .map(id => GameState.cards[id]?.definitionId)
    .filter(d => d === itemId).length;
}

describe('GardenSystem — 텃밭 자동 수확', () => {
  beforeEach(resetGarden);

  it('봄에 수확 주기(5일=360TP) 경과 시 채소를 산출한다', () => {
    placeGardenBed(10, 360);  // 봄, 5일 경과분
    GardenSystem.tick();
    expect(countCrop('vegetable')).toBeGreaterThan(0);
  });

  it('겨울(gardenYieldMult 0)에는 자라지 않아 수확이 없다', () => {
    placeGardenBed(300, 360);  // 겨울
    GardenSystem.tick();
    expect(countCrop('vegetable')).toBe(0);
  });

  it('산성비(weather.gardenKill) 시 성장 정지', () => {
    placeGardenBed(10, 360);
    GameState.weather = { gardenKill: true };
    GardenSystem.tick();
    expect(countCrop('vegetable')).toBe(0);
  });

  it('수확 미달(1일분)이면 산출 없음', () => {
    placeGardenBed(10, 72);  // 1일분 < 5일
    GardenSystem.tick();
    expect(countCrop('vegetable')).toBe(0);
  });
});

// ── (C) 살살 채취(부분·재생) ────────────────────────────────────
function resetForage() {
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(10).fill(null), bottom: Array(10).fill(null) };
  GameState.pendingLoot = [];
  GameState.player = { ...(GameState.player ?? {}), skills: { harvesting: { xp: 0, level: 0 } } };
  GameState.time = { day: 10, totalTP: 100, tpInDay: 0, hour: 12 };
  GameState.flags = GameState.flags ?? {};
}

describe('DismantleSystem.forage — 살살 채취', () => {
  beforeEach(resetForage);

  it('노드를 소멸시키지 않고 재생 쿨다운을 설정한다', () => {
    const inst = GameState.createCardInstance('weed_patch');
    GameState.board.middle[0] = inst.instanceId;
    const r = DismantleSystem.forage(inst.instanceId);
    expect(r.success).toBe(true);
    expect(GameState.cards[inst.instanceId]).toBeDefined();          // 노드 유지
    expect(inst._forageCooldownTp).toBeGreaterThan(GameState.time.totalTP);  // 쿨다운 설정
  });

  it('쿨다운 중에는 재채취가 막힌다', () => {
    const inst = GameState.createCardInstance('weed_patch');
    GameState.board.middle[0] = inst.instanceId;
    DismantleSystem.forage(inst.instanceId);
    const r2 = DismantleSystem.forage(inst.instanceId);  // 즉시 재시도
    expect(r2.success).toBe(false);
  });

  it('forage 메타 없는 카드는 살살 채취 불가', () => {
    const inst = GameState.createCardInstance('cloth');
    GameState.board.middle[0] = inst.instanceId;
    const r = DismantleSystem.forage(inst.instanceId);
    expect(r.success).toBe(false);
  });
});
