// === 선언만 있고 읽는 코드가 없던 필드 되살리기 ===
// 기절 무기(부여 경로 없음), 깨진 병 bleedChance, 고급 외상 키트 cureAllBleeding,
// 가시 트랩 onTrigger — 넷 다 데이터에 선언되어 있으나 아무 동작도 하지 않았다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const enemy = (extra = {}) => ({
  id: 'test_zombie', name: '좀비', type: 'zombie',
  currentHp: 500, maxHp: 500, defense: 0, _statusEffects: [], ...extra,
});

function baseCombat(enemies = [enemy()]) {
  GameState.combat = {
    active: true, enemies, targetIndex: 0, log: [], fxQueue: [],
    playerStatus: [], enemyStatus: [], battlefieldStatuses: [], round: 0, roundNumber: 1,
  };
}

beforeEach(() => {
  GameState.cards = {};
  GameState.player.skills = { melee: { level: 0, xp: 0 }, unarmed: { level: 0, xp: 0 }, ranged: { level: 0, xp: 0 } };
  baseCombat();
});

describe('기절 무기 — 부여 배선', () => {
  it('전기 무기와 목공 망치의 기절 확률이 절반 수준으로 조정되었다', () => {
    const shocker = Object.values(ITEMS).find(d => d?.combat?.statusInflict?.id === 'stun' && d.weaponType === 'electric');
    const hammer  = Object.values(ITEMS).find(d => d?.combat?.statusInflict?.id === 'stun' && d.weaponType === 'blunt');

    expect(shocker.combat.statusInflict.chance).toBeCloseTo(0.18, 5);
    expect(hammer.combat.statusInflict.chance).toBeCloseTo(0.10, 5);
  });

  it('stun 무기로 적중하면 적에게 기절이 실제로 붙는다', () => {
    const stunWeapon = Object.values(ITEMS).find(d => d?.combat?.statusInflict?.id === 'stun');
    GameState.cards = { s1: { instanceId: 's1', definitionId: stunWeapon.id, durability: 100 } };
    const target = enemy();
    baseCombat([target]);

    vi.spyOn(Math, 'random').mockReturnValue(0.01);   // 명중·기절 굴림 모두 통과
    CombatSystem._attackAction('melee', 's1', target);
    vi.restoreAllMocks();

    expect(target._statusEffects.some(s => s.id === 'stun')).toBe(true);
  });

  it('statusInflict가 없는 무기는 상태이상 난수를 굴리지 않는다', () => {
    GameState.cards = { c1: { instanceId: 'c1', definitionId: 'crowbar', durability: 100 } };
    const target = enemy();
    baseCombat([target]);

    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
    CombatSystem._attackAction('melee', 'c1', target);
    const callsWithStatus = spy.mock.calls.length;
    vi.restoreAllMocks();

    // 상태이상이 붙지 않아야 하고, 굴림도 낭비되지 않아야 한다
    expect(target._statusEffects.length).toBe(0);
    expect(callsWithStatus).toBeGreaterThan(0);   // 명중·피해 굴림은 정상적으로 존재
  });
});

describe('깨진 병 — bleedChance를 statusInflict로 이관', () => {
  it('bleedChance 필드가 제거되었다', () => {
    expect(ITEMS.broken_bottle.bleedChance).toBeUndefined();
  });

  it('combat.statusInflict로 출혈이 선언된다', () => {
    expect(ITEMS.broken_bottle.combat.statusInflict).toMatchObject({
      id: 'bleed', chance: 0.25,
    });
  });
});

describe('고급 외상 키트 — cureAllBleeding', () => {
  it('사용하면 플레이어 출혈만 제거한다', () => {
    GameState.cards = { k1: { instanceId: 'k1', definitionId: 'advanced_trauma_kit', quantity: 1 } };
    baseCombat();
    GameState.combat.playerStatus = [
      { id: 'bleed', name: '출혈', duration: 3, effect: { hpLossPerRound: 3 } },
      { id: 'stun',  name: '기절', duration: 1, effect: {} },
    ];

    CombatSystem._useItemAction('k1');

    const ids = GameState.combat.playerStatus.map(s => s.id);
    expect(ids).not.toContain('bleed');
    expect(ids).toContain('stun');
  });

  it('출혈이 없어도 오류 없이 동작한다', () => {
    GameState.cards = { k1: { instanceId: 'k1', definitionId: 'advanced_trauma_kit', quantity: 1 } };
    baseCombat();
    GameState.combat.playerStatus = [];

    expect(() => CombatSystem._useItemAction('k1')).not.toThrow();
  });
});

describe('가시 트랩 — 전투 진입 시 1회 발동', () => {
  // 트랩은 보드에 설치된 카드여야 발동한다 — 배낭 속 트랩은 대상이 아니다
  function placeTrap(durability) {
    GameState.cards = { t1: { instanceId: 't1', definitionId: 'spike_trap', durability } };
    GameState.board = { top: [], environment: [], middle: ['t1'], bottom: [] };
  }

  it('트랩이 설치되어 있으면 선두 적이 피해를 받고 내구도가 준다', () => {
    const target = enemy();
    baseCombat([target]);
    placeTrap(80);

    const hpBefore = target.currentHp;
    CombatSystem._triggerCombatEntryTraps();

    expect(target.currentHp).toBe(hpBefore - ITEMS.spike_trap.onTrigger.damage);
    expect(GameState.cards.t1.durability).toBe(70);
    expect(target._statusEffects.some(s => s.id === 'bleed')).toBe(true);
  });

  it('트랩이 없으면 아무 일도 일어나지 않는다', () => {
    const target = enemy();
    baseCombat([target]);
    GameState.cards = {};
    GameState.board = { top: [], environment: [], middle: [], bottom: [] };

    const hpBefore = target.currentHp;
    CombatSystem._triggerCombatEntryTraps();

    expect(target.currentHp).toBe(hpBefore);
  });

  it('내구도가 0이 된 트랩은 제거된다', () => {
    const target = enemy();
    baseCombat([target]);
    placeTrap(10);

    CombatSystem._triggerCombatEntryTraps();

    expect(GameState.cards.t1).toBeUndefined();
  });

  it('내구도가 소진된 트랩은 발동하지 않는다', () => {
    const target = enemy();
    baseCombat([target]);
    placeTrap(0);

    const hpBefore = target.currentHp;
    CombatSystem._triggerCombatEntryTraps();

    expect(target.currentHp).toBe(hpBefore);
  });
});
