// @vitest-environment happy-dom
// === 헬기 조립·가동 테스트 ===
// 엔지니어 B3 라인은 부품 5종을 모으게 하면서도 소비하는 청사진이 없어 완성된
// 헬기가 존재하지 않았다. 부품은 퀘스트 완료 후에도 인벤토리에 영구히 남았고,
// 롯데타워에서 얻는 helicopter_key는 쓸 곳이 없었다.
//
// 조립(제작) 경로와 발견 경로가 같은 helicopter 카드를 쓰고, 가동 상태는 카드
// 변환이 아니라 인스턴스 플래그(_fuelDrums/_keyed)로 둔다 — 통발 _baitCharges 방식.
import { describe, it, expect, beforeEach } from 'vitest';
import SlotResolver from '../../js/board/SlotResolver.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';

const PARTS = ['fuselage_frame', 'piston_engine', 'rotor_blade', 'tail_rotor_assembly', 'avionics_module'];

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.pendingLoot = [];
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, structureDurabilityBonus: 1.0,
    encumbrance: { current: 0, max: 999, tier: 0, tpMult: 1.0, weightPct: 0 },
  };
  GameState.time = { day: 300, totalTP: 21600, tpInDay: 0, hour: 12 };
  GameState.location = { currentDistrict: 'junggoo', installedStructures: {} };
  GameState.flags = {};
  GameState.debug = {};
}

function place(definitionId, row = 'middle') {
  const inst = GameState.createCardInstance(definitionId);
  GameState.board[row][GameState.board[row].indexOf(null)] = inst.instanceId;
  return inst;
}

describe('헬기 아이템 정의', () => {
  const d = () => ITEMS.helicopter;

  it('헬기 카드가 존재한다', () => {
    expect(d()).toBeDefined();
  });

  it('바닥 고정이라 배낭에 넣을 수 없다', () => {
    expect(d().tags).toContain('immovable');
  });

  it('이륙 조건을 데이터로 선언한다', () => {
    expect(d().flight.fuelDrums).toBe(2);
  });

  it('시동 열쇠를 요구하지 않는다 (직접 조립한 기체)', () => {
    expect(d().flight.needsKey).toBeUndefined();
  });

  it('이미지 미제작 상태라 아이콘으로 표시된다', async () => {
    const { getCardImage } = await import('../../js/ui/CardFactory.js');
    expect(getCardImage('helicopter')).toBeNull();
    expect(d().icon).toBeTruthy();
  });
});

describe('조립 청사진 — 부품 소비', () => {
  it('부품 5종을 모두 소비한다', () => {
    const bp = BLUEPRINTS.assemble_helicopter;
    expect(bp).toBeDefined();
    const used = bp.stages.flatMap(s => s.requiredItems.map(r => r.definitionId));
    for (const p of PARTS) expect(used, `${p} 미소비`).toContain(p);
  });

  it('로터 블레이드는 4개가 필요하다', () => {
    const req = BLUEPRINTS.assemble_helicopter.stages
      .flatMap(s => s.requiredItems).find(r => r.definitionId === 'rotor_blade');
    expect(req.qty).toBe(4);
  });

  it('헬기를 산출한다', () => {
    expect(BLUEPRINTS.assemble_helicopter.output[0].definitionId).toBe('helicopter');
  });

  it('부품에 소비처가 생겨 인벤토리에 영구히 남지 않는다', () => {
    const all = Object.values(BLUEPRINTS);
    for (const p of PARTS) {
      const consumers = all.filter(b => b.stages?.some(s => s.requiredItems?.some(r => r.definitionId === p)));
      expect(consumers.length, `${p} 소비처 없음`).toBeGreaterThan(0);
    }
  });
});

describe('연료 주입 — 상호작용', () => {
  beforeEach(resetWorld);

  it('드럼 1개를 넣으면 1/2가 된다', () => {
    const heli = place('helicopter');
    const drum = place('avgas_drum');
    expect(SlotResolver.resolveInteraction(drum.instanceId, heli.instanceId)).toBe(true);
    expect(GameState.cards[heli.instanceId]._fuelDrums).toBe(1);
  });

  it('드럼은 주입 시 소모된다', () => {
    const heli = place('helicopter');
    const drum = place('avgas_drum');
    SlotResolver.resolveInteraction(drum.instanceId, heli.instanceId);
    expect(GameState.cards[drum.instanceId]).toBeUndefined();
  });

  it('2개까지 채워진다', () => {
    const heli = place('helicopter');
    SlotResolver.resolveInteraction(place('avgas_drum').instanceId, heli.instanceId);
    SlotResolver.resolveInteraction(place('avgas_drum').instanceId, heli.instanceId);
    expect(GameState.cards[heli.instanceId]._fuelDrums).toBe(2);
  });

  it('가득 차면 더 넣을 수 없다', () => {
    const heli = place('helicopter');
    for (let i = 0; i < 2; i++) SlotResolver.resolveInteraction(place('avgas_drum').instanceId, heli.instanceId);
    const extra = place('avgas_drum');
    SlotResolver.resolveInteraction(extra.instanceId, heli.instanceId);
    expect(GameState.cards[heli.instanceId]._fuelDrums).toBe(2);
    expect(GameState.cards[extra.instanceId]).toBeDefined();  // 낭비되지 않는다
  });

  it('방향이 반대여도 주입된다', () => {
    const heli = place('helicopter');
    const drum = place('avgas_drum');
    SlotResolver.resolveInteraction(heli.instanceId, drum.instanceId);
    expect(GameState.cards[heli.instanceId]._fuelDrums).toBe(1);
  });
});

describe('헬기는 잔해처럼 배낭에 들어가지 않는다', () => {
  beforeEach(resetWorld);

  it('휴대 칸으로 옮길 수 없다', () => {
    const heli = place('helicopter');
    expect(SlotResolver.validateDrop(heli.instanceId, 'bottom', 0).valid).toBe(false);
  });
});
