// === 3차 사문화 필드 배선 ===
// 데이터 전수 감사(2026-08-20)에서 나온 건들. 공통점은 "카드 설명문이 약속한 효과를
// 읽는 코드가 없었다"는 것이다. 경고도 에러도 없어 플레이 중에는 드러나지 않는다.
//
//   1. 목검 — damage가 combat 블록 밖에 있어 무기로 인식되지도 않았다
//   2. 장인 파이프렌치 — craftSpeedBonus로 선언, 시스템은 craftTimeReduction을 읽었다
//   3. 물 공급 구조물 — 수분 보급이 rain_collector id로 하드코딩돼 상위 3종이 무시됐다
//   4. 내화 방벽 — 방어 구조물인데 조우 감소가 없었다
//   5. 탈출 아이템 3종 — 엔딩을 약속하고도 어디에서도 참조되지 않았다
//   6. 보스 드롭·채집물 4종 — 사용 레시피가 하나도 없었다
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ITEMS from '../../js/data/items.js';
import BALANCE from '../../js/data/gameBalance.js';
import { ENDINGS } from '../../js/data/endings.js';
import BP from '../../js/data/blueprints.js';
import BPA from '../../js/data/blueprints_advanced.js';
import HR from '../../js/data/hiddenRecipes.js';
import GameState from '../../js/core/GameState.js';
import StatSystem from '../../js/systems/StatSystem.js';

const RECIPES = { ...BP, ...BPA, ...HR };
const producedBy = (id) => Object.values(RECIPES).filter(b => (b.output ?? []).some(o => o.definitionId === id));
const consumedBy = (id) => Object.values(RECIPES).filter(b => (b.stages ?? [])
  .some(s => (s.requiredItems ?? []).some(r => r.definitionId === id)));

function resetBoard() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.equipped = {};
  GameState.player.skills = {};
}

function place(definitionId, row = 'bottom') {
  const inst = GameState.createCardInstance(definitionId);
  GameState.placeCardInRow(inst.instanceId, row);
  return GameState.cards[inst.instanceId];
}

describe('1. 목검 — 무기 능력치', () => {
  it('combat 블록으로 옮겨졌다', () => {
    expect(ITEMS.wooden_sword.combat).toBeDefined();
    expect(ITEMS.wooden_sword.combat.damage).toEqual([2, 5]);
  });

  it('combat 밖에 damage가 남아 있지 않다', () => {
    expect(ITEMS.wooden_sword.damage).toBeUndefined();
  });

  it('전투가 읽는 필드를 모두 갖췄다', () => {
    const c = ITEMS.wooden_sword.combat;
    expect(typeof c.accuracy).toBe('number');
    expect(typeof c.noiseOnUse).toBe('number');
    expect(typeof c.durabilityLoss).toBe('number');
  });

  it('type:weapon인 아이템에 combat이 빠진 것이 없다', () => {
    const missing = Object.values(ITEMS)
      .filter(d => d.type === 'weapon' && !d.combat)
      .map(d => `${d.name}(${d.id})`);
    expect(missing, `combat 누락: ${missing.join(', ')}`).toEqual([]);
  });

  it('최상위 damage를 들고 있는 아이템이 없다', () => {
    const stray = Object.values(ITEMS).filter(d => d.damage !== undefined).map(d => d.id);
    expect(stray).toEqual([]);
  });
});

describe('2. 장인 파이프렌치 — 제작 시간 단축', () => {
  beforeEach(resetBoard);

  it('시스템이 읽는 키로 선언되어 있다', () => {
    expect(ITEMS.pipe_wrench_master.onUse.craftTimeReduction).toBe(0.2);
    expect(ITEMS.pipe_wrench_master.onUse.craftSpeedBonus).toBeUndefined();
  });

  it('보드에 두면 제작 시간이 실제로 줄어든다', () => {
    expect(StatSystem.applyCraftTime(10)).toBe(10);
    place('pipe_wrench_master');
    expect(StatSystem.getToolEffects().craftTimeReduction).toBe(0.2);
    expect(StatSystem.applyCraftTime(10)).toBe(8);
  });
});

describe('3. 물 공급 구조물 — 수분 보급', () => {
  let gained;

  beforeEach(() => {
    resetBoard();
    gained = 0;
    GameState.flags = { ...(GameState.flags ?? {}) };
    vi.spyOn(GameState, 'modStat').mockImplementation((stat, value) => {
      if (stat === 'hydration') gained += value;
    });
  });

  const runWith = (weather) => {
    GameState.weather = weather;
    StatSystem._applyWaterSupply(GameState);
    return gained;
  };

  it('빗물 수집기 계열은 날씨 배율을 탄다', () => {
    place('rain_collector', 'middle');
    // 비 ×2.0 → 0.3 * 2.0
    expect(runWith({ id: 'rainy' })).toBeCloseTo(0.6, 5);
  });

  it('개량 빗물 수집기가 더 이상 무시되지 않는다', () => {
    place('rain_collector_improved', 'middle');
    expect(runWith({ id: 'rainy' })).toBeCloseTo(1.0, 5);
  });

  it('급수탑·배관 시스템·물 재활용기는 날씨와 무관하게 공급한다', () => {
    place('water_tower', 'middle');
    // 맑음이어도 선언값 그대로
    expect(runWith({ id: 'sunny' })).toBeCloseTo(0.15, 5);
  });

  it('상시 급수 계열은 산성비에도 멈추지 않는다', () => {
    place('plumbing_system', 'middle');
    expect(runWith({ id: 'acid_rain', gardenKill: true })).toBeCloseTo(0.2, 5);
  });

  it('상시 급수 3종을 다 지어도 갈증 소모에 못 미친다 — 물통이 계속 필요하다', () => {
    place('water_tower', 'middle');
    place('plumbing_system', 'middle');
    place('water_recycler', 'middle');
    const always = runWith({ id: 'sunny' });
    expect(always).toBeCloseTo(0.65, 5);
    expect(always).toBeLessThan(BALANCE.stats.hydrationDecayPerTP);
  });

  it('빗물 수집 계열은 산성비에 멈춘다', () => {
    place('rain_collector', 'middle');
    expect(runWith({ id: 'acid_rain', gardenKill: true })).toBe(0);
  });

  it('여러 대를 세우면 합산되되 상한을 넘지 않는다', () => {
    place('rain_collector', 'middle');
    place('rain_collector_improved', 'middle');
    place('water_recycler', 'middle');
    place('water_tower', 'middle');
    place('plumbing_system', 'middle');
    const total = runWith({ id: 'monsoon' });
    expect(total).toBe(BALANCE.waterSupply.maxHydrationPerTP);
  });

  it('상한을 넘겨 수분이 차오르지는 않는다', () => {
    expect(BALANCE.waterSupply.maxHydrationPerTP)
      .toBeLessThanOrEqual(BALANCE.stats.hydrationDecayPerTP);
  });

  it('내구도가 0이면 공급하지 않는다', () => {
    const inst = place('rain_collector', 'middle');
    inst.durability = 0;
    expect(runWith({ id: 'rainy' })).toBe(0);
  });

  it('상시 급수 계열이 빗물 계열보다 천천히 닳는다', () => {
    expect(BALANCE.waterSupply.supplyDecayPerTP)
      .toBeLessThan(BALANCE.waterSupply.rainCatchDecayPerTP);
  });

  it('선언은 있는데 subtype이 water가 아닌 물 구조물이 없다', () => {
    const stray = Object.values(ITEMS)
      .filter(d => d.onTick?.hydration > 0 && d.subtype !== 'water')
      .map(d => d.id);
    expect(stray).toEqual([]);
  });
});

describe('4. 방어 구조물 — 조우 감소 티어', () => {
  const reduct = (id) => ITEMS[id].onTick?.encounterReduction ?? 0;

  it('내화 방벽에 효과가 붙었다', () => {
    expect(reduct('fireproof_barricade')).toBe(0.15);
  });

  it('건축 난이도 순으로 단조 증가한다', () => {
    expect(reduct('barricade')).toBeLessThan(reduct('fireproof_barricade'));
    expect(reduct('fireproof_barricade')).toBeLessThan(reduct('reinforced_wall'));
    expect(reduct('reinforced_wall')).toBeLessThan(reduct('watchtower'));
  });

  it('전부 지어도 구조물 상한을 넘지 않는다', () => {
    const total = ['barricade', 'fireproof_barricade', 'reinforced_wall', 'watchtower']
      .reduce((sum, id) => sum + reduct(id), 0);
    expect(total).toBeLessThanOrEqual(BALANCE.encounter.structureReductCap);
  });

  it('감시탑에 읽는 코드가 없던 earlyWarning이 남아 있지 않다', () => {
    expect(ITEMS.watchtower.onTick.earlyWarning).toBeUndefined();
  });
});

describe('5. 탈출 탈것', () => {
  let EscapeVehicleSystem;
  let EndingSystem;

  beforeEach(async () => {
    resetBoard();
    EscapeVehicleSystem = (await import('../../js/systems/EscapeVehicleSystem.js')).default;
    EndingSystem = (await import('../../js/systems/EndingSystem.js')).default;
    GameState.location = { ...(GameState.location ?? {}), currentSubLocation: null };
    GameState.time = { ...(GameState.time ?? {}), day: 1 };
    vi.restoreAllMocks();
  });

  it.each(['river_boat', 'aircraft_parts', 'radio_transmitter'])(
    '%s 가 실재하는 엔딩을 가리킨다', (id) => {
      const spec = ITEMS[id].escapeVehicle;
      expect(spec?.endingId).toBeTruthy();
      expect(ENDINGS[spec.endingId]).toBeDefined();
      expect(ENDINGS[spec.endingId].category).toBe('escape');
    });

  it('신설 엔딩은 일일 자동 검사에 걸리지 않는다 — 멋대로 끝나면 안 된다', () => {
    for (const id of ['escape_river_boat', 'escape_light_aircraft', 'escape_rescue_signal']) {
      expect(typeof ENDINGS[id].condition).not.toBe('function');
    }
  });

  it('준비물이 없으면 출발할 수 없다', () => {
    const boat = place('river_boat');
    const res = EscapeVehicleSystem.canLaunch(boat.instanceId);
    expect(res.ok).toBe(false);
    expect(res.missing.map(m => m.definitionId)).toContain('fuel_can');
  });

  it('준비물을 보드에 모으면 출발할 수 있다', () => {
    const boat = place('river_boat');
    place('fuel_can'); place('fuel_can');
    expect(EscapeVehicleSystem.canLaunch(boat.instanceId).ok).toBe(true);
  });

  it('출발하면 준비물을 소모하고 엔딩이 발동한다', () => {
    const spy = vi.spyOn(EndingSystem, 'triggerEnding').mockImplementation(() => {});
    const boat = place('river_boat');
    place('fuel_can'); place('fuel_can');
    const res = EscapeVehicleSystem.launch(boat.instanceId);
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalledWith('escape_river_boat', GameState);
    expect(GameState.countOnBoard('fuel_can')).toBe(0);
  });

  it('실패하면 준비물이 소모되지 않는다', () => {
    const spy = vi.spyOn(EndingSystem, 'triggerEnding').mockImplementation(() => {});
    const boat = place('river_boat');
    place('fuel_can');           // 2개 필요한데 1개뿐
    const res = EscapeVehicleSystem.launch(boat.instanceId);
    expect(res.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(GameState.countOnBoard('fuel_can')).toBe(1);
  });

  it('경비행기는 격납고 안에서만 뜬다', () => {
    const parts = place('aircraft_parts');
    place('avgas_drum'); place('avgas_drum');
    place('aviation_alloy'); place('aviation_alloy');
    expect(EscapeVehicleSystem.canLaunch(parts.instanceId).ok).toBe(false);

    GameState.location.currentSubLocation = 'sl_gangseo_hangar';
    expect(EscapeVehicleSystem.canLaunch(parts.instanceId).ok).toBe(true);
  });

  it('구조 신호는 날짜 하한을 지킨다', () => {
    const tx = place('radio_transmitter');
    place('battery'); place('battery');
    GameState.time.day = 10;
    expect(EscapeVehicleSystem.canLaunch(tx.instanceId).ok).toBe(false);

    GameState.time.day = 200;
    expect(EscapeVehicleSystem.canLaunch(tx.instanceId).ok).toBe(true);
  });

  it('무선 송신기에 획득 경로가 생겼다', () => {
    expect(producedBy('radio_transmitter').length).toBeGreaterThan(0);
  });

  it('탈출 스펙의 준비물이 실재하는 아이템이다', () => {
    for (const def of Object.values(ITEMS)) {
      for (const req of def.escapeVehicle?.requires ?? []) {
        expect(ITEMS[req.definitionId], `${def.id} → ${req.definitionId}`).toBeDefined();
      }
    }
  });
});

describe('6. 사용처 없던 재료들', () => {
  it.each([
    ['nettle_fiber',   '쐐기풀 섬유'],
    ['wraith_essence', '유령 변이체 잔류물'],
    ['soldier_dogtag', '전우의 인식표'],
    ['bamboo_shoot',   '죽순'],
  ])('%s(%s)를 쓰는 레시피가 있다', (id) => {
    expect(consumedBy(id).length).toBeGreaterThan(0);
  });

  it('로프를 자급할 수 있다', () => {
    const recipes = producedBy('rope');
    expect(recipes.length).toBeGreaterThan(0);
    const inputs = recipes.flatMap(b => b.stages.flatMap(s => s.requiredItems.map(r => r.definitionId)));
    expect(inputs).toContain('nettle_fiber');
  });

  it('흙 주머니를 자갈 더미에서 얻을 수 있다', () => {
    const drops = ITEMS.gravel_pile.dismantle.map(d => d.definitionId);
    expect(drops).toContain('soil_bag');
  });

  it('신설 레시피의 재료·산출물이 모두 실재한다', () => {
    const NEW = ['twist_rope', 'upgrade_stealth_suit', 'forge_comrade_armor',
                 'pickle_bamboo_shoot', 'make_radio_transmitter'];
    for (const id of NEW) {
      const bp = RECIPES[id];
      expect(bp, `${id} 없음`).toBeDefined();
      for (const o of bp.output) expect(ITEMS[o.definitionId], `${id} 산출 ${o.definitionId}`).toBeDefined();
      for (const s of bp.stages) {
        for (const r of s.requiredItems) expect(ITEMS[r.definitionId], `${id} 재료 ${r.definitionId}`).toBeDefined();
      }
      for (const t of bp.requiredTools ?? []) expect(ITEMS[t], `${id} 도구 ${t}`).toBeDefined();
    }
  });

  it('히든 레시피는 unlockConditions를 갖는다', () => {
    const NEW_HIDDEN = ['upgrade_stealth_suit', 'forge_comrade_armor',
                        'pickle_bamboo_shoot', 'make_radio_transmitter'];
    for (const id of NEW_HIDDEN) {
      expect(RECIPES[id].hidden).toBe(true);
      expect(RECIPES[id].unlockConditions, `${id} unlockConditions 누락`).toBeDefined();
    }
  });
});
