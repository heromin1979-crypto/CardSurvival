import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import AutoSave from '../../js/persistence/AutoSave.js';
import SaveManager, { AUTOSAVE_SLOT } from '../../js/persistence/SaveManager.js';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import StatSystem from '../../js/systems/StatSystem.js';
import CareerProjects from '../../js/systems/CareerProjectSystem.js';

const defaultStats = structuredClone(GameState.stats);
let oldListeners;
let storage;
beforeEach(() => {
  oldListeners = EventBus._listeners;
  EventBus._listeners = {};
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  storage = new Map();
  vi.stubGlobal('localStorage', { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key) ?? null });
  vi.stubGlobal('document', { addEventListener: vi.fn() });
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  GameState.flags = createDefaultFlags();
  GameState.cards = {};
  GameState.pendingLoot = [];
  GameState.board = { top: Array(10).fill(null), environment: Array(10).fill(null), middle: Array(27).fill(null), bottom: Array(20).fill(null) };
  GameState.stats = structuredClone(defaultStats);
  GameState.stats.hydration.current = 100;
  GameState.player.isAlive = true;
  GameState.player.hp.current = 100;
  GameState.player.encumbrance.weightPct = 0;
  GameState.player.extraSlots = 0;
  GameState.player.middlePage3Unlocked = true;
  GameState.location.currentDistrict = 'gangdong';
  GameState.location.currentLandmark = null;
  GameState.ui.currentState = 'main';
  Object.assign(GameState.time, { totalTP: 9, tpInDay: 9, day: 1 });
  AutoSave._lastSaveTP = 0;
  AutoSave._lastSaveAt = 0;
  AutoSave.init();
});
afterEach(() => {
  EventBus._listeners = oldListeners;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function saved() { return JSON.parse(storage.get(`CARD_SURVIVAL_SAVE_v1_slot${AUTOSAVE_SLOT}`)); }

describe('공급 행동 자동저장 경계', () => {
  it('발전과 전동 정비의 연료·전력·운영 시간은 실제 자동저장에 함께 남는다', () => {
    GameState.location.currentDistrict = 'yongsan';
    GameState.quests = { active: [], completed: ['mq_eng_02', 'mq_eng_08'] };
    for (const id of ['engineer_power', 'engineer_workbench']) GameState.flags.careerProjects.projects[id] = { projectId: id, active: true, uses: 0 };
    for (const [id, quantity] of [['fuel_can', 1], ['scrap_metal', 3], ['wire', 1]]) {
      const c = GameState.createCardInstance(id, { quantity }); GameState.placeCardInRow(c.instanceId, 'bottom');
    }
    expect(CareerProjects.operate('engineer_power').ok).toBe(true);
    expect(saved().flags.careerProjects.districtPower.yongsan).toBe(3);
    expect(saved().time.totalTP).toBe(11);
    GameState.deserialize(JSON.stringify(saved()));
    expect(GameState.countOnBoard('fuel_can')).toBe(0);
    expect(CareerProjects.operate('engineer_workbench').ok).toBe(true);
    expect(saved().flags.careerProjects.districtPower.yongsan).toBe(2);
    expect(saved().time.totalTP).toBe(14);
    GameState.deserialize(JSON.stringify(saved()));
    expect(GameState.flags.careerProjects.districtPower.yongsan).toBe(2);
  });
  it('프로젝트 부분 투입 복원과 가동 TP 9→11을 최종 저장하며 재가동하지 않는다', () => {
    GameState.location.currentDistrict = 'yongsan';
    GameState.quests = { active: [{ id: 'mq_soldier_04', progress: 0, deadline: Infinity }], completed: [] };
    for (const [id, quantity] of [['electronic_parts', 2], ['wire', 1], ['battery', 1]]) {
      const c = GameState.createCardInstance(id, { quantity }); GameState.placeCardInRow(c.instanceId, 'bottom');
    }
    expect(CareerProjects.contribute('soldier_radio', 'restore').ok).toBe(true);
    GameState.deserialize(JSON.stringify(saved()));
    expect(CareerProjects.inspect('soldier_radio').actions.find(a => a.id === 'restore').installed).toBe(true);
    expect(GameState.countOnBoard('electronic_parts')).toBe(0);
    expect(CareerProjects.contribute('soldier_radio', 'power').ok).toBe(true);
    expect(CareerProjects.activate('soldier_radio').ok).toBe(true);
    expect(saved().time.totalTP).toBe(11);
    expect(saved().flags.careerProjects.projects.soldier_radio.active).toBe(true);
    GameState.deserialize(JSON.stringify(saved()));
    expect(CareerProjects.activate('soldier_radio').ok).toBe(false);
    expect(GameState.countOnBoard('battery')).toBe(0);
  });
  it('TP 9→12 공급과 각 생존 틱이 끝난 상태를 실제 자동저장 슬롯에 남긴다', () => {
    const ticks = [];
    EventBus.on('tpAdvance', () => {
      ticks.push(GameState.time.totalTP);
      StatSystem._applyNaturalDecay();
    });
    const saveSpy = vi.spyOn(SaveManager, 'save');
    expect(ExploreSystem.useSupply('garden_materials')).toEqual({ ok: true });
    expect(ticks).toEqual([10, 11, 12]);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const snapshot = saved();
    expect(snapshot.time.totalTP).toBe(12);
    expect(snapshot.stats.hydration.current).toBe(GameState.stats.hydration.current);
    expect(snapshot.stats.hydration.current).toBeLessThan(100);
    expect(snapshot.flags.explorationSupply.stocks.garden_materials.remaining).toBe(1);
    expect(Object.values(snapshot.cards).filter(card => card.definitionId === 'soil_bag').reduce((n, c) => n + c.quantity, 0)).toBe(3);
    GameState.deserialize(JSON.stringify(snapshot));
    expect(GameState.time.totalTP).toBe(12);
  });
  it('최근 저장 직후에도 행동 도중 요청은 완료 시점에 한 번 반영한다', () => {
    AutoSave._lastSaveAt = Date.now();
    expect(ExploreSystem.useSupply('garden_materials').ok).toBe(true);
    expect(saved().time.totalTP).toBe(12);
    expect(AutoSave._lastSaveTP).toBe(12);
  });
  it('중첩 경계와 force 요청은 최상위 완료까지 저장하지 않는다', () => {
    const saveSpy = vi.spyOn(SaveManager, 'save');
    const result = AutoSave.deferUntilComplete(() => {
      AutoSave._trySave({ force: true });
      expect(AutoSave.deferUntilComplete(() => { AutoSave._trySave(); return '내부'; })).toBe('내부');
      expect(saveSpy).not.toHaveBeenCalled();
      GameState.time.totalTP = 15;
      return '외부';
    });
    expect(result).toBe('외부');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saved().time.totalTP).toBe(15);
  });
  it('내부 예외를 외부에서 잡아도 부분 상태를 저장하지 않고 유예를 해제한다', () => {
    const saveSpy = vi.spyOn(SaveManager, 'save');
    AutoSave.deferUntilComplete(() => {
      try {
        AutoSave.deferUntilComplete(() => {
          AutoSave._trySave();
          throw new Error('테스트 예외');
        });
      } catch {}
    });
    expect(saveSpy).not.toHaveBeenCalled();
    expect(AutoSave._deferDepth).toBe(0);
    AutoSave._trySave();
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
  it('바깥 예외도 전파하고 이후 자동저장은 정상 재개한다', () => {
    expect(() => AutoSave.deferUntilComplete(() => {
      AutoSave._trySave({ force: true });
      throw new Error('실패');
    })).toThrow('실패');
    expect(storage.size).toBe(0);
    AutoSave._trySave();
    expect(saved().time.totalTP).toBe(9);
  });
  it('저장소 쓰기 실패는 유예나 스로틀 상태를 고착시키지 않는다', () => {
    const spy = vi.spyOn(SaveManager, 'save').mockReturnValueOnce(false);
    expect(ExploreSystem.useSupply('garden_materials').ok).toBe(true);
    expect(AutoSave._deferDepth).toBe(0);
    expect(AutoSave._lastSaveTP).toBe(0);
    AutoSave._trySave();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(saved().time.totalTP).toBe(12);
  });
  it('공급 거부는 비용·시간·저장 요청을 만들지 않는다', () => {
    GameState.location.currentDistrict = 'junggoo';
    const before = GameState.serialize();
    const spy = vi.spyOn(SaveManager, 'save');
    expect(ExploreSystem.useSupply('market_salt').ok).toBe(false);
    expect(GameState.serialize()).toBe(before);
    expect(spy).not.toHaveBeenCalled();
    expect(AutoSave._deferDepth).toBe(0);
  });
});
