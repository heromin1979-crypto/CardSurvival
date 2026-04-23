// @vitest-environment happy-dom
// === Combat Overhaul Phase 3 — 적 의도 예고 UI + 실행 통합 ===
// 목적:
//   - _setupCombat 후 모든 적에 _nextIntent 필드 생성
//   - initiative bar에 의도 아이콘 렌더
//   - 살아있는 적만 의도 표시 (죽은 적은 스킵)
//   - _runSingleEnemyTurn 후 다음 intent 재결정
//   - companion 타겟일 때 damageCompanion 라우팅
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatUI       from '../../js/ui/CombatUI.js';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';

function setupDom() {
  document.body.innerHTML = `<div id="screen-combat"></div>`;
  CombatUI._screen = document.getElementById('screen-combat');
}

function makeEnemy({ aiPattern = 'normal', hp = 30, attack = { damage: [5, 8], accuracy: 0.8 } } = {}) {
  return {
    id: 'test_e', name: '테스트적', icon: '👹',
    currentHp: hp, maxHp: 30,
    aiPattern,
    specialSkills: [],
    _skillCooldowns: {},
    attack,
    weaknesses: [], resistances: [],
  };
}

describe('_setupCombat + intent 초기화 통합', () => {
  beforeEach(() => {
    setupDom();
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.characterId = 'doctor';
    GameState.player.diseases = [];
    GameState.player.equipped = {};
    GameState.companions = [];
    GameState.npcs = null;
    GameState.ui = { ...GameState.ui, currentState: 'combat' };
    GameState.flags = GameState.flags ?? {};
  });

  it('전투 시작 시 모든 적에 _nextIntent 필드 세팅', () => {
    const enemies = [
      makeEnemy({ aiPattern: 'normal' }),
      makeEnemy({ aiPattern: 'aggressive' }),
    ];
    CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'dongjak' });
    for (const e of GameState.combat.enemies) {
      expect(e._nextIntent).toBeDefined();
      expect(e._nextIntent.action).toBeDefined();
      expect(e._nextIntent.targetType).toBeDefined();
    }
  });

  it('aggressive 패턴 적 + 낮은 HP 동료 → 동료 타겟', () => {
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 5, maxHp: 50, isCompanion: true } } };
    const enemies = [makeEnemy({ aiPattern: 'aggressive' })];
    CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'dongjak' });
    expect(GameState.combat.enemies[0]._nextIntent.targetType).toBe('companion');
    expect(GameState.combat.enemies[0]._nextIntent.targetId).toBe('npc_a');
  });

  it('sniper 패턴 + 힐러 존재 → 힐러 타겟', () => {
    GameState.companions = ['npc_nurse'];
    GameState.npcs = { states: { npc_nurse: { hp: 50, maxHp: 50, isCompanion: true } } };
    const enemies = [makeEnemy({ aiPattern: 'sniper' })];
    CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'dongjak' });
    expect(GameState.combat.enemies[0]._nextIntent.targetId).toBe('npc_nurse');
  });
});

describe('initiative bar — 의도 아이콘 표시', () => {
  it('enemy 슬롯에 init-intent span 포함 + 의도 label', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [{
        id: 'e', name: '좀비', icon: '🧟',
        currentHp: 30, maxHp: 30,
        _nextIntent: { iconEmoji: '🗡', label: '플레이어 공격' },
      }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toContain('class="init-intent"');
    expect(html).toContain('🗡');
    expect(html).toContain('title="플레이어 공격"');
  });

  it('_nextIntent 없으면 init-intent span 미렌더', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [{ id: 'e', name: '좀비', icon: '🧟', currentHp: 30, maxHp: 30 }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).not.toContain('init-intent');
  });

  it('죽은 적은 의도 표시 안 함', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [{
        id: 'e', name: '좀비', icon: '🧟',
        currentHp: 0, maxHp: 30,
        _nextIntent: { iconEmoji: '🗡', label: '플레이어 공격' },
      }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).not.toContain('init-intent');
  });
});

describe('_runSingleEnemyTurn — intent 기반 실행', () => {
  let damageFn;

  beforeEach(() => {
    damageFn = vi.fn((npcId, dmg) => {
      const st = GameState.npcs.states[npcId];
      if (st) st.hp = Math.max(0, st.hp - dmg);
    });
    SystemRegistry.register('NPCSystem', { damageCompanion: damageFn, getCompanionCombatBonus: () => 1.0 });

    GameState.player.hp = { current: 100, max: 100 };
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 50, maxHp: 50, isCompanion: true } } };
    GameState.combat = {
      active: true,
      enemies: [{
        id: 'e', name: 'E', icon: '👹',
        currentHp: 30, maxHp: 30,
        aiPattern: 'normal',
        specialSkills: [],
        _skillCooldowns: {},
        attack: { damage: [5, 8], accuracy: 1.0 },   // accuracy 1.0 → 항상 히트
        weaknesses: [], resistances: [],
      }],
      log: [],
      round: 0,
      playerStatus: [],
      enemyStatus: [],
      turnQueue: [],
      activeIdx: 0,
      roundNumber: 1,
      targetIndex: 0,
    };
    // intent: companion 타겟
    GameState.combat.enemies[0]._nextIntent = {
      action: 'attack', targetType: 'companion', targetId: 'npc_a',
      iconEmoji: '🗡', label: 'npc_a 공격', pattern: 'aggressive',
    };
  });

  it('intent.targetType === companion 일 때 damageCompanion 호출 + npc HP 감소', () => {
    const before = GameState.npcs.states.npc_a.hp;
    CombatSystem._runSingleEnemyTurn(0);
    expect(damageFn).toHaveBeenCalledTimes(1);
    expect(GameState.npcs.states.npc_a.hp).toBeLessThan(before);
  });

  it('플레이어는 공격받지 않음 (intent가 companion)', () => {
    const hpBefore = GameState.player.hp.current;
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(hpBefore);
  });

  it('턴 실행 후 다음 intent 재결정 (_nextIntent 갱신)', () => {
    const before = GameState.combat.enemies[0]._nextIntent;
    CombatSystem._runSingleEnemyTurn(0);
    const after = GameState.combat.enemies[0]._nextIntent;
    expect(after).toBeDefined();
    // 같은 객체 참조 아님
    expect(after).not.toBe(before);
  });

  it('hold stance companion 피해 경감', () => {
    GameState.npcs.states.npc_a.combatBuffs = { holdReduct: { value: 0.3, duration: 1 } };
    const before = GameState.npcs.states.npc_a.hp;
    CombatSystem._runSingleEnemyTurn(0);
    const dmg = before - GameState.npcs.states.npc_a.hp;
    // 기본 5-8 피해 → hold 30% 경감 적용되어 더 낮은 범위
    expect(dmg).toBeLessThanOrEqual(6);  // 느슨한 상한
  });
});
