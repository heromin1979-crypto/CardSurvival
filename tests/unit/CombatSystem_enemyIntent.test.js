// === Combat Overhaul Phase 3 — 적 의도 결정 + aiPattern ===
// 검증:
//   - _getEligibleTargets: 플레이어 + 살아있는 동료만 포함
//   - _pickTargetByPattern: 5개 패턴 분기 + fallback
//   - _decideNextIntent: 적 스킬 쿨다운 0이면 skill action, 아니면 attack
//   - 죽은 적은 null 반환
import { describe, it, expect, beforeEach } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';

function makePlayer({ hp = 100, maxHp = 100, isRanged = false } = {}) {
  GameState.player.hp = { current: hp, max: maxHp };
  GameState.player.equipped = GameState.player.equipped ?? {};
  GameState.player.equipped.weapon_main = isRanged ? 'ranged_inst' : 'melee_inst';
  // Stub getCardDef
  GameState.cards = {
    ranged_inst: { definitionId: 'rifle' },
    melee_inst:  { definitionId: 'bat' },
  };
  GameState.getCardDef = (id) => {
    if (id === 'ranged_inst') return { combat: { requiresAmmo: 'bullet' } };
    if (id === 'melee_inst')  return { combat: {} };
    return null;
  };
}

function makeCombat({ playerStatus = [], enemies = [] } = {}) {
  GameState.combat = {
    active:       true,
    enemies,
    targetIndex:  0,
    log:          [],
    round:        0,
    playerStatus,
    enemyStatus:  [],
    turnQueue:    [],
    activeIdx:    0,
    roundNumber:  1,
  };
  return GameState.combat;
}

function makeEnemy({ aiPattern = 'normal', specialSkills = [], hp = 30, skillCooldowns = {} } = {}) {
  return {
    id: 'e', name: 'E', icon: '👹',
    currentHp: hp, maxHp: 30,
    aiPattern,
    specialSkills,
    _skillCooldowns: skillCooldowns,
  };
}

describe('_getEligibleTargets', () => {
  it('플레이어만 살아있을 때 player 엔트리 1개', () => {
    makePlayer({ hp: 50 });
    GameState.companions = [];
    const combat = makeCombat();
    const tgts = CombatSystem._getEligibleTargets(combat, GameState);
    expect(tgts.length).toBe(1);
    expect(tgts[0].type).toBe('player');
    expect(tgts[0].hp).toBe(50);
  });

  it('살아있는 동료 추가, 죽은 동료 제외', () => {
    makePlayer({ hp: 100 });
    GameState.companions = ['npc_a', 'npc_dead'];
    GameState.npcs = { states: {
      npc_a:    { hp: 30, maxHp: 50, isCompanion: true },
      npc_dead: { hp: 0,  maxHp: 50, isCompanion: true },
    }};
    const combat = makeCombat();
    const tgts = CombatSystem._getEligibleTargets(combat, GameState);
    expect(tgts.length).toBe(2);
    expect(tgts.find(t => t.type === 'player')).toBeDefined();
    expect(tgts.find(t => t.id === 'npc_a')).toBeDefined();
    expect(tgts.find(t => t.id === 'npc_dead')).toBeUndefined();
  });

  it('플레이어 사망 시 player 엔트리 없음', () => {
    makePlayer({ hp: 0 });
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 30, maxHp: 50, isCompanion: true } } };
    const combat = makeCombat();
    const tgts = CombatSystem._getEligibleTargets(combat, GameState);
    expect(tgts.length).toBe(1);
    expect(tgts[0].type).toBe('companion');
  });

  it('isHealer 플래그: npc_nurse / npc_doctor', () => {
    makePlayer({ hp: 100 });
    GameState.companions = ['npc_nurse', 'npc_doctor', 'npc_soldier'];
    GameState.npcs = { states: {
      npc_nurse:   { hp: 50, maxHp: 50, isCompanion: true },
      npc_doctor:  { hp: 50, maxHp: 50, isCompanion: true },
      npc_soldier: { hp: 50, maxHp: 50, isCompanion: true },
    }};
    const combat = makeCombat();
    const tgts = CombatSystem._getEligibleTargets(combat, GameState);
    expect(tgts.find(t => t.id === 'npc_nurse').isHealer).toBe(true);
    expect(tgts.find(t => t.id === 'npc_doctor').isHealer).toBe(true);
    expect(tgts.find(t => t.id === 'npc_soldier').isHealer).toBe(false);
  });
});

describe('_pickTargetByPattern', () => {
  const mkTargets = () => [
    { type: 'player', hp: 50, maxHp: 100, isRanged: false },
    { type: 'companion', id: 'npc_nurse', hp: 40, maxHp: 50, isHealer: true },
    { type: 'companion', id: 'npc_soldier', hp: 10, maxHp: 50, isHealer: false },
  ];

  it('aggressive: HP ratio 최저 (npc_soldier 10/50 = 0.2)', () => {
    const t = CombatSystem._pickTargetByPattern('aggressive', mkTargets(), {});
    expect(t.id).toBe('npc_soldier');
  });

  it('defensive: 원거리 무기 들면 플레이어 우선, 없으면 일반 플레이어', () => {
    const ranged = CombatSystem._pickTargetByPattern('defensive', [
      { type: 'player', hp: 80, maxHp: 100, isRanged: true },
      { type: 'companion', id: 'npc_a', hp: 10, maxHp: 50 },
    ], {});
    expect(ranged.type).toBe('player');

    const noRanged = CombatSystem._pickTargetByPattern('defensive', [
      { type: 'player', hp: 80, maxHp: 100, isRanged: false },
      { type: 'companion', id: 'npc_a', hp: 10, maxHp: 50 },
    ], {});
    expect(noRanged.type).toBe('player');
  });

  it('normal: 항상 플레이어 우선', () => {
    const t = CombatSystem._pickTargetByPattern('normal', mkTargets(), {});
    expect(t.type).toBe('player');
  });

  it('horde: 셋 중 하나 (무작위, 결과는 세 중 하나)', () => {
    const picked = new Set();
    for (let i = 0; i < 50; i++) {
      const t = CombatSystem._pickTargetByPattern('horde', mkTargets(), {});
      picked.add(t.type === 'player' ? 'player' : t.id);
    }
    // 50회 중 최소 2종 타입은 나올 확률이 매우 높음
    expect(picked.size).toBeGreaterThanOrEqual(2);
  });

  it('sniper: 힐러 동료 우선, 없으면 플레이어', () => {
    const healer = CombatSystem._pickTargetByPattern('sniper', mkTargets(), {});
    expect(healer.id).toBe('npc_nurse');

    const noHealer = CombatSystem._pickTargetByPattern('sniper', [
      { type: 'player', hp: 80, maxHp: 100 },
      { type: 'companion', id: 'npc_soldier', hp: 10, maxHp: 50, isHealer: false },
    ], {});
    expect(noHealer.type).toBe('player');
  });

  it('predator: 상태이상 있는 타겟 우선', () => {
    const wounded = CombatSystem._pickTargetByPattern('predator', [
      { type: 'player', hp: 80, maxHp: 100, statusEffects: [] },
      { type: 'companion', id: 'npc_a', hp: 40, maxHp: 50, statusEffects: [{ id: 'bleed' }] },
    ], {});
    expect(wounded.id).toBe('npc_a');
  });

  it('predator: 상태이상 아무도 없으면 플레이어 폴백', () => {
    const none = CombatSystem._pickTargetByPattern('predator', [
      { type: 'player', hp: 80, maxHp: 100, statusEffects: [] },
      { type: 'companion', id: 'npc_a', hp: 40, maxHp: 50, statusEffects: [] },
    ], {});
    expect(none.type).toBe('player');
  });

  it('알 수 없는 패턴 → normal fallback (플레이어 우선)', () => {
    const t = CombatSystem._pickTargetByPattern('unknown_pattern', mkTargets(), {});
    expect(t.type).toBe('player');
  });

  it('빈 targets → null', () => {
    expect(CombatSystem._pickTargetByPattern('aggressive', [], {})).toBeNull();
  });
});

describe('_decideNextIntent', () => {
  beforeEach(() => {
    makePlayer({ hp: 100 });
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 40, maxHp: 50, isCompanion: true } } };
  });

  it('스킬 없으면 action=attack, 아이콘 🗡', () => {
    const combat = makeCombat();
    const enemy = makeEnemy({ aiPattern: 'normal' });
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.action).toBe('attack');
    expect(intent.iconEmoji).toBe('🗡');
    expect(intent.targetType).toBe('player');
  });

  it('스킬 쿨다운 0이면 action=skill, 아이콘 💢, skillId 포함', () => {
    const combat = makeCombat();
    const enemy = makeEnemy({
      aiPattern: 'normal',
      specialSkills: [{ id: 'bite', name: '깨물기', damage: [5, 10], cooldown: 3 }],
      skillCooldowns: { bite: 0 },
    });
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.action).toBe('skill');
    expect(intent.skillId).toBe('bite');
    expect(intent.iconEmoji).toBe('💢');
  });

  it('스킬 쿨다운 > 0 이면 attack fallback', () => {
    const combat = makeCombat();
    const enemy = makeEnemy({
      aiPattern: 'normal',
      specialSkills: [{ id: 'bite', name: '깨물기', damage: [5, 10], cooldown: 3 }],
      skillCooldowns: { bite: 2 },
    });
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.action).toBe('attack');
  });

  it('죽은 적 → null', () => {
    const combat = makeCombat();
    const enemy = makeEnemy({ aiPattern: 'aggressive', hp: 0 });
    expect(CombatSystem._decideNextIntent(enemy, combat, GameState)).toBeNull();
  });

  it('aggressive: 낮은 HP 동료 타겟 반영', () => {
    GameState.npcs.states.npc_a.hp = 5;   // 10% HP
    const combat = makeCombat();
    const enemy = makeEnemy({ aiPattern: 'aggressive' });
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.targetType).toBe('companion');
    expect(intent.targetId).toBe('npc_a');
  });

  it('sniper: 힐러 동료 타겟 반영', () => {
    GameState.companions = ['npc_soldier', 'npc_nurse'];
    GameState.npcs = { states: {
      npc_soldier: { hp: 50, maxHp: 50, isCompanion: true },
      npc_nurse:   { hp: 50, maxHp: 50, isCompanion: true },
    }};
    const combat = makeCombat();
    const enemy = makeEnemy({ aiPattern: 'sniper' });
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.targetId).toBe('npc_nurse');
  });

  it('label에 타겟 이름 포함', () => {
    const combat = makeCombat();
    const enemy = makeEnemy({ aiPattern: 'normal' });
    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.label).toContain('플레이어');
  });
});
