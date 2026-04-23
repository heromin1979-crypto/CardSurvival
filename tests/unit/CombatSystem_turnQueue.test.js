// === Combat Overhaul Phase 1 — 턴 큐 인프라 ===
// 순수 헬퍼 단위 테스트. GameState 전역 의존 최소화.
//  - _buildTurnQueue(combatLike, companions): player → companions → enemies 순서
//  - _currentEntry(combatLike): activeIdx 위치 entry
//  - _isEntryAlive(entry, combatLike, npcStates): type별 생존 판정
//  - _advanceTurn(combatLike, npcStates): 다음 살아있는 entry로 이동, roundNumber 증가
import { describe, it, expect } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';

function makeCombat({ enemies = [], ...rest } = {}) {
  return {
    active: true,
    enemies,
    turnQueue: [],
    activeIdx: 0,
    roundNumber: 1,
    ...rest,
  };
}

function makeEnemy(hp = 30) {
  return { id: 'test_enemy', name: 'E', currentHp: hp, maxHp: 30, specialSkills: [], _skillCooldowns: {}, _statusEffects: [] };
}

describe('CombatSystem._buildTurnQueue', () => {
  it('플레이어만 있을 때 (동료/적 없음) 큐 길이 = 1', () => {
    const combat = makeCombat({ enemies: [] });
    const q = CombatSystem._buildTurnQueue(combat, []);
    expect(q.length).toBe(1);
    expect(q[0].type).toBe('player');
  });

  it('순서: player → companion → companion → enemy → enemy', () => {
    const combat = makeCombat({ enemies: [makeEnemy(), makeEnemy()] });
    const q = CombatSystem._buildTurnQueue(combat, ['npc_a', 'npc_b']);
    expect(q.length).toBe(5);
    expect(q[0].type).toBe('player');
    expect(q[1].type).toBe('companion'); expect(q[1].id).toBe('npc_a');
    expect(q[2].type).toBe('companion'); expect(q[2].id).toBe('npc_b');
    expect(q[3].type).toBe('enemy'); expect(q[3].enemyIdx).toBe(0);
    expect(q[4].type).toBe('enemy'); expect(q[4].enemyIdx).toBe(1);
  });

  it('빈 companions, 단일 적 → [player, enemy]', () => {
    const combat = makeCombat({ enemies: [makeEnemy()] });
    const q = CombatSystem._buildTurnQueue(combat, []);
    expect(q).toEqual([
      { type: 'player', order: 0 },
      { type: 'enemy', enemyIdx: 0, order: 1 },
    ]);
  });
});

describe('CombatSystem._isEntryAlive', () => {
  it('player: gs.player.hp.current > 0', () => {
    // _isEntryAlive는 GameState.player를 참조
    const combat = makeCombat();
    expect(CombatSystem._isEntryAlive({ type: 'player' }, combat, {})).toBe(true);
  });

  it('enemy: combat.enemies[enemyIdx].currentHp > 0', () => {
    const combat = makeCombat({ enemies: [makeEnemy(0), makeEnemy(10)] });
    expect(CombatSystem._isEntryAlive({ type: 'enemy', enemyIdx: 0 }, combat, {})).toBe(false);
    expect(CombatSystem._isEntryAlive({ type: 'enemy', enemyIdx: 1 }, combat, {})).toBe(true);
  });

  it('enemy: 잘못된 enemyIdx → false', () => {
    const combat = makeCombat({ enemies: [makeEnemy(10)] });
    expect(CombatSystem._isEntryAlive({ type: 'enemy', enemyIdx: 99 }, combat, {})).toBe(false);
  });

  it('companion: npcStates[id].hp > 0', () => {
    const combat = makeCombat();
    const npcStates = { npc_nurse: { hp: 30 }, npc_dead: { hp: 0 } };
    expect(CombatSystem._isEntryAlive({ type: 'companion', id: 'npc_nurse' }, combat, npcStates)).toBe(true);
    expect(CombatSystem._isEntryAlive({ type: 'companion', id: 'npc_dead' }, combat, npcStates)).toBe(false);
  });

  it('companion: npcStates 없음 또는 해당 id 없음 → false', () => {
    const combat = makeCombat();
    expect(CombatSystem._isEntryAlive({ type: 'companion', id: 'missing' }, combat, {})).toBe(false);
    expect(CombatSystem._isEntryAlive({ type: 'companion', id: 'x' }, combat, null)).toBe(false);
  });
});

describe('CombatSystem._advanceTurn', () => {
  it('다음 entry로 activeIdx 이동', () => {
    const combat = makeCombat({
      enemies: [makeEnemy(30)],
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0,
    });
    CombatSystem._advanceTurn(combat, {});
    expect(combat.activeIdx).toBe(1);
  });

  it('큐 끝에서 0으로 랩어라운드 + roundNumber 증가', () => {
    const combat = makeCombat({
      enemies: [makeEnemy(30)],
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 1,
      roundNumber: 1,
    });
    CombatSystem._advanceTurn(combat, {});
    expect(combat.activeIdx).toBe(0);
    expect(combat.roundNumber).toBe(2);
  });

  it('죽은 entry는 건너뛴다 (중간 적 사망)', () => {
    const combat = makeCombat({
      enemies: [makeEnemy(0), makeEnemy(30)],   // enemy0 사망
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
        { type: 'enemy', enemyIdx: 1, order: 2 },
      ],
      activeIdx: 0,
    });
    CombatSystem._advanceTurn(combat, {});
    // enemy0 skip → enemy1로 진행
    expect(combat.activeIdx).toBe(2);
  });

  it('죽은 companion 스킵', () => {
    const combat = makeCombat({
      enemies: [makeEnemy(30)],
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'companion', id: 'npc_a', order: 1 },
        { type: 'enemy', enemyIdx: 0, order: 2 },
      ],
      activeIdx: 0,
    });
    const npcStates = { npc_a: { hp: 0 } };
    CombatSystem._advanceTurn(combat, npcStates);
    expect(combat.activeIdx).toBe(2);  // npc_a 스킵 → enemy
  });

  it('모든 엔티티 사망 시 한 바퀴 돌고 현재 위치 유지 (무한루프 방지)', () => {
    const combat = makeCombat({
      enemies: [makeEnemy(0)],
      turnQueue: [
        { type: 'enemy', enemyIdx: 0, order: 0 },
      ],
      activeIdx: 0,
    });
    CombatSystem._advanceTurn(combat, {});
    // 유일한 엔티티가 죽었으므로 한 바퀴 돌고 멈춰야 함
    expect(combat.activeIdx).toBe(0);
  });
});

describe('CombatSystem._currentEntry', () => {
  it('activeIdx 위치의 entry 반환', () => {
    const combat = makeCombat({
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 1,
    });
    expect(CombatSystem._currentEntry(combat).type).toBe('enemy');
  });

  it('빈 큐 → null', () => {
    const combat = makeCombat({ turnQueue: [], activeIdx: 0 });
    expect(CombatSystem._currentEntry(combat)).toBeNull();
  });
});
