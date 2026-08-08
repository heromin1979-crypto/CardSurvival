// @vitest-environment happy-dom
// === 분해 TP 비용 표기·자정 이월 테스트 ===
// regression 1: 모달 분해 버튼에 비용 표기가 없어 4TP 소모가 즉시 완료로 보였다.
// regression 2: 하루 남은 TP가 모자라면 분해가 아예 차단됐다. 제작·이동은 자정을
// 넘기는데 분해만 막혀 있었고, 막히는 구간(tpInDay 69~71)은 05시대라 야간도
// 아니었다. 이제 자정을 넘길 때만 확인창을 거쳐 진행한다.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DismantleSystem from '../../js/systems/DismantleSystem.js';
import ModalManager from '../../js/ui/ModalManager.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

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

function placeCard(definitionId, overrides = {}) {
  const inst = GameState.createCardInstance(definitionId, overrides);
  GameState.board.middle[GameState.board.middle.indexOf(null)] = inst.instanceId;
  return inst;
}

describe('DismantleSystem.getTpStatus — 단일 판정 지점', () => {
  beforeEach(resetWorld);

  it('비용은 dismantleTP × 개수다', () => {
    const inst = placeCard('wrecked_bus');
    expect(ITEMS.wrecked_bus.dismantleTP).toBe(4);
    expect(DismantleSystem.getTpStatus(inst.instanceId, 1).cost).toBe(4);
    expect(DismantleSystem.getTpStatus(inst.instanceId, 3).cost).toBe(12);
  });

  it('하루가 시작될 때는 여유가 충분하다', () => {
    const inst = placeCard('wrecked_bus');
    const status = DismantleSystem.getTpStatus(inst.instanceId, 1);
    expect(status.remainTP).toBe(72);
    expect(status.crossesMidnight).toBe(false);
  });

  it('남은 TP가 비용과 같으면 자정을 넘기지 않는다', () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 68;  // 남은 4TP
    expect(DismantleSystem.getTpStatus(inst.instanceId, 1).crossesMidnight).toBe(false);
  });

  it('남은 TP가 비용보다 적으면 자정을 넘기는 것으로 표시한다', () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 69;  // 남은 3TP
    const status = DismantleSystem.getTpStatus(inst.instanceId, 1);
    expect(status.remainTP).toBe(3);
    expect(status.crossesMidnight).toBe(true);
  });

  it('1TP짜리는 하루의 마지막 1TP에 딱 맞는다', () => {
    const inst = placeCard('broken_radio');
    GameState.time.tpInDay = 71;
    const status = DismantleSystem.getTpStatus(inst.instanceId, 1);
    expect(status.cost).toBe(1);
    expect(status.crossesMidnight).toBe(false);
  });

  it('TP 비용이 없는 아이템은 자정을 넘길 일이 없다', () => {
    const inst = placeCard('cloth');
    GameState.time.tpInDay = 71;
    const status = DismantleSystem.getTpStatus(inst.instanceId, 1);
    expect(status.cost).toBe(0);
    expect(status.crossesMidnight).toBe(false);
  });

  it('분해 불가 아이템은 canDismantle이 false다', () => {
    const inst = placeCard('purified_water');
    expect(DismantleSystem.getTpStatus(inst.instanceId, 1).canDismantle).toBe(false);
  });
});

describe('자정 이월 — 분해가 다음 날로 넘어간다', () => {
  beforeEach(resetWorld);

  it('남은 TP가 모자라도 분해가 성공하고 날짜가 넘어간다', () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 70;  // 남은 2TP, 비용 4TP
    const before = GameState.time.day;
    const result = DismantleSystem.dismantle(inst.instanceId, 1);
    expect(result.success).toBe(true);
    expect(GameState.time.day).toBe(before + 1);
    expect(GameState.time.tpInDay).toBe(2);  // 4TP 중 2TP가 다음 날로 이월
  });

  it('이월 중 사망하면 재료를 배치하지 않는다', () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 70;
    GameState.player.isAlive = false;  // skipTP 도중 사망한 상황을 모사
    const result = DismantleSystem.dismantle(inst.instanceId, 1);
    expect(result.success).toBe(false);
    expect(GameState.countOnBoard('scrap_metal')).toBe(0);
  });
});

describe('카드 정보 모달 — 분해 버튼 표시', () => {
  beforeEach(() => {
    resetWorld();
    document.body.innerHTML = '<div id="modal-overlay"><div id="modal-box"></div></div>';
    ModalManager.init();
  });

  it('버튼 라벨에 TP 비용을 표기한다', () => {
    const inst = placeCard('wrecked_bus');
    ModalManager.showCardInspect(inst.instanceId);
    const btn = document.getElementById(`modal-dismantle-${inst.instanceId}`);
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('4TP');
  });

  it('자정을 넘기는 경우에도 버튼은 활성 상태다', () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 70;  // 남은 2TP
    ModalManager.showCardInspect(inst.instanceId);
    const btn = document.getElementById(`modal-dismantle-${inst.instanceId}`);
    expect(btn.disabled).toBe(false);
    expect(btn.title).toContain('다음 날');
  });

  it('자정을 넘길 때는 곧바로 분해하지 않고 확인을 받는다', () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 70;
    ModalManager.showCardInspect(inst.instanceId);
    document.getElementById(`modal-dismantle-${inst.instanceId}`).click();
    // 확인창이 뜬 상태 — 아직 시간도 카드도 그대로다
    expect(GameState.time.tpInDay).toBe(70);
    expect(GameState.cards[inst.instanceId]).toBeDefined();
    expect(document.getElementById('modal-box').textContent).toContain('다음 날');
  });

  // 분해는 카드 연출(playDismantleFx) 뒤에 실행되므로 결과는 다음 마이크로태스크에 나온다.
  it('확인창에서 승인하면 분해가 진행된다', async () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 70;
    const beforeDay = GameState.time.day;
    ModalManager.showCardInspect(inst.instanceId);
    document.getElementById(`modal-dismantle-${inst.instanceId}`).click();
    document.querySelector('.modal-btn.confirm').click();
    await vi.waitFor(() => expect(GameState.cards[inst.instanceId]).toBeUndefined());
    expect(GameState.time.day).toBe(beforeDay + 1);
  });

  it('자정을 넘기지 않으면 확인 없이 바로 분해한다', async () => {
    const inst = placeCard('wrecked_bus');
    GameState.time.tpInDay = 60;  // 남은 12TP
    ModalManager.showCardInspect(inst.instanceId);
    document.getElementById(`modal-dismantle-${inst.instanceId}`).click();
    await vi.waitFor(() => expect(GameState.cards[inst.instanceId]).toBeUndefined());
    expect(GameState.time.tpInDay).toBe(64);
  });

  it('TP 비용이 0인 아이템에는 TP 표기를 붙이지 않는다', () => {
    const inst = placeCard('cloth');
    ModalManager.showCardInspect(inst.instanceId);
    const btn = document.getElementById(`modal-dismantle-${inst.instanceId}`);
    if (btn) expect(btn.textContent).not.toContain('TP');
  });
});
