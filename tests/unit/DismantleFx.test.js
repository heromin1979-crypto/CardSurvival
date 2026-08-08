// @vitest-environment happy-dom
// === 분해 연출 테스트 ===
// 분해는 TP를 최대 4까지 쓰는데도 카드가 소리 없이 사라져 즉시 완료로 보였다.
// 제작 카드(.crafting-card)와 달리 중간 상태가 없어, 원본 카드에 짧은 연출을
// 입힌 뒤 실제 분해를 실행한다. 게임 로직(DismantleSystem)은 그대로 둔다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playDismantleFx, DISMANTLE_FX_MS } from '../../js/ui/dismantleFx.js';
import ModalManager from '../../js/ui/ModalManager.js';
import GameState from '../../js/core/GameState.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, skills: {}, diseases: [],
    hp: { current: 80, max: 100 },
    structureEffects: null,
    structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 30, tier: 0, tpMult: 1.0, weightPct: 0 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.ui = { ...(GameState.ui ?? {}), modalOpen: false };
  GameState.flags = {};
  GameState.debug = {};
}

function placeCard(definitionId) {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

/** 보드에 렌더된 카드 DOM을 흉내낸다 (BoardRenderer가 붙이는 data-instance-id) */
function renderCardEl(instanceId) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.instanceId = instanceId;
  document.body.appendChild(el);
  return el;
}

describe('playDismantleFx', () => {
  beforeEach(() => {
    resetWorld();
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('카드에 dismantling 클래스를 즉시 붙인다', () => {
    const inst = placeCard('wrecked_bus');
    const el = renderCardEl(inst.instanceId);
    playDismantleFx(inst.instanceId);
    expect(el.classList.contains('dismantling')).toBe(true);
  });

  it('연출이 끝나면 클래스를 걷어내고 완료된다', async () => {
    const inst = placeCard('wrecked_bus');
    const el = renderCardEl(inst.instanceId);
    const done = vi.fn();
    playDismantleFx(inst.instanceId).then(done);

    await vi.advanceTimersByTimeAsync(DISMANTLE_FX_MS + 10);
    expect(done).toHaveBeenCalled();
    expect(el.classList.contains('dismantling')).toBe(false);
  });

  it('연출 도중에는 아직 완료되지 않는다', async () => {
    const inst = placeCard('wrecked_bus');
    renderCardEl(inst.instanceId);
    const done = vi.fn();
    playDismantleFx(inst.instanceId).then(done);

    await vi.advanceTimersByTimeAsync(DISMANTLE_FX_MS - 50);
    expect(done).not.toHaveBeenCalled();
  });

  it('렌더된 카드가 없어도 오류 없이 완료된다', async () => {
    const done = vi.fn();
    playDismantleFx('c-없는카드').then(done);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });
});

describe('모달 분해 — 연출 후 실제 분해', () => {
  beforeEach(() => {
    resetWorld();
    document.body.innerHTML = '<div id="modal-overlay"><div id="modal-box"></div></div>';
    ModalManager.init();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('클릭 직후에는 카드가 남아 있고 연출만 시작된다', () => {
    const inst = placeCard('wrecked_bus');
    const el = renderCardEl(inst.instanceId);
    ModalManager.showCardInspect(inst.instanceId);
    document.getElementById(`modal-dismantle-${inst.instanceId}`).click();

    expect(el.classList.contains('dismantling')).toBe(true);
    expect(GameState.cards[inst.instanceId]).toBeDefined();
    expect(GameState.time.tpInDay).toBe(0);
  });

  it('연출이 끝나면 분해가 실행되어 TP가 소모된다', async () => {
    const inst = placeCard('wrecked_bus');
    renderCardEl(inst.instanceId);
    ModalManager.showCardInspect(inst.instanceId);
    document.getElementById(`modal-dismantle-${inst.instanceId}`).click();

    await vi.advanceTimersByTimeAsync(DISMANTLE_FX_MS + 10);
    expect(GameState.cards[inst.instanceId]).toBeUndefined();
    expect(GameState.time.tpInDay).toBe(4);
  });
});
