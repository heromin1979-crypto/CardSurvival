// @vitest-environment happy-dom
// === Phase 3 F1 — 적 텔레그래프-카운터 계약 ===
// 검증:
//   - 예고형 특수 스킬은 예고 턴에 행동하지 않고 다음 턴 발동
//   - 이동 회피(moveEvadeChance) / block 기절 무효 / 피격 시 조준 취소(cancelOnHit)
//   - 잠복(dormant) 적은 깨어나기 전 행동하지 않음
//   - 방치 비용(escalatePerTurn)으로 상태이상 피해 증가
//   - spreadAttacks: 전열 동료 존재 시 다중 타격 분산
//   - 인간 적 동요(wavering) 노출
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem   from '../../js/systems/CombatSystem.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import { moveCombatant } from '../../js/systems/combat/FormationSystem.js';

function makeEnemy(overrides = {}) {
  return {
    id: 'test_e', name: '테스트적', icon: '👹',
    currentHp: 60, maxHp: 60,
    aiPattern: 'normal',
    specialSkills: [],
    _skillCooldowns: {},
    _statusEffects: [],
    attack: { damage: [5, 8], accuracy: 1.0 },
    weaknesses: [], resistances: [],
    lootTable: [],
    ...overrides,
  };
}

const SLAM = {
  id: 'slam', name: '강타', damage: [20, 20], cooldown: 3, stunChance: 1,
  telegraph: { turns: 1, moveEvadeChance: 1, blockNegatesStun: true },
};

function setupCombat({ enemies, companions = false } = {}) {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.flags = GameState.flags ?? {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  if (companions) {
    GameState.companions = ['npc_a'];
    GameState.npcs = { states: { npc_a: { hp: 50, maxHp: 50, isCompanion: true } } };
  } else {
    GameState.companions = [];
    GameState.npcs = { states: {} };
  }
  CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'test' });
  return GameState.combat;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  SystemRegistry.register('NPCSystem', {
    damageCompanion: vi.fn((npcId, dmg) => {
      const st = GameState.npcs.states[npcId];
      if (st) st.hp = Math.max(0, st.hp - dmg);
    }),
    getCompanionCombatBonus: () => 1.0,
    getNpcDef: () => null,
  });
});

describe('텔레그래프 시작과 발동', () => {
  it('예고형 스킬은 예고 턴에 피해 없이 _telegraph만 세팅하고 인텐트로 노출한다', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [SLAM] })] });
    const enemy = combat.enemies[0];
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(enemy._telegraph).toMatchObject({ skillId: 'slam', remaining: 1 });
    expect(GameState.player.hp.current).toBe(100);

    const intent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(intent.action).toBe('telegraph');
    expect(intent.countdown).toBe(1);
  });

  it('다음 턴에 예고된 스킬이 발동한다 (같은 자리에 있으면 명중)', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [SLAM] })] });
    const enemy = combat.enemies[0];
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(enemy._telegraph).toBeNull();
    expect(GameState.player.hp.current).toBeLessThan(100);
    expect(enemy._skillCooldowns.slam).toBe(3);
  });
});

describe('카운터: 이동 회피', () => {
  it('예고 후 자리를 옮기면 발동이 빗나간다 (moveEvadeChance 1)', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [SLAM] })] });
    const enemy = combat.enemies[0];
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    expect(moveCombatant(combat.formations, 'player', 2)).toBe(true);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(GameState.player.hp.current).toBe(100);
    expect(enemy._telegraph).toBeNull();
    expect(enemy._skillCooldowns.slam).toBe(3);
  });
});

describe('카운터: block 기절 무효', () => {
  it('block 토큰으로 받아내면 피해는 절반, 기절은 무효', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [SLAM] })] });
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    combat.combatants.player.tokens.block = 1;
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    // stunChance 1 + random 0이면 기절 확정이어야 하지만 block이 무효화
    expect(combat.playerStatus.some(s => s.id === 'stun')).toBe(false);
    expect(GameState.player.hp.current).toBe(100 - 10);
    expect(combat.combatants.player.tokens.block).toBe(0);
  });

  it('block 없이 맞으면 기절한다 (대조군)', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [SLAM] })] });
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(combat.playerStatus.some(s => s.id === 'stun')).toBe(true);
  });
});

describe('카운터: 피격 시 조준 취소 (cancelOnHit)', () => {
  it('조준 중인 적을 때리면 예고가 취소되고 쿨다운으로 넘어간다', () => {
    const AIMED = {
      id: 'aimed_shot', name: '정조준', damage: [25, 25], cooldown: 3,
      telegraph: { turns: 1, moveEvadeChance: 0.7, cancelOnHit: true },
    };
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [AIMED] })] });
    const enemy = combat.enemies[0];
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);
    CombatSystem._runSingleEnemyTurn(0);
    expect(enemy._telegraph).not.toBeNull();

    CombatSystem._applyRankedDamageEffect(
      { type: 'damage', value: [8, 8] },
      combat.combatants.player,
      combat.combatants['enemy:0'],
      () => 0,
      { hit: true, crit: false, skill: { id: 'basic_strike', effects: [] } },
    );
    rand.mockRestore();

    expect(enemy._telegraph).toBeNull();
    expect(enemy._skillCooldowns.aimed_shot).toBe(3);
  });
});

describe('runner_rush — 연속타 발동', () => {
  it('발동 시 본타+후속타(multiHit 2)로 두 배 피해가 들어간다', () => {
    const RUSH = {
      id: 'runner_rush', name: '돌진', damage: [10, 10], cooldown: 3,
      telegraph: { turns: 1, moveEvadeChance: 1 },
      effect: { multiHit: 2 },
    };
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [RUSH] })] });
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(GameState.player.hp.current).toBe(100 - 20);
  });
});

describe('잠복(dormant) — 기습 무효 창', () => {
  it('잠복 중에는 행동하지 않고, 깨어난 다음 턴부터 공격한다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({ _dormantRemaining: 1, attack: { damage: [7, 7], accuracy: 1 } })],
    });
    const enemy = combat.enemies[0];

    const dormantIntent = CombatSystem._decideNextIntent(enemy, combat, GameState);
    expect(dormantIntent.action).toBe('dormant');

    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(100);
    expect(enemy._dormantRemaining).toBe(0);

    rand.mockReturnValue(0.6);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();
    expect(GameState.player.hp.current).toBeLessThan(100);
  });
});

describe('방치 비용 — statusInflict 축적', () => {
  it('생존한 턴마다 상태이상 피해가 escalatePerTurn만큼 커진다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({
        attack: { damage: [5, 5], accuracy: 1 },
        statusInflict: {
          id: 'acid_burn', name: '산성 화상', duration: 2, escalatePerTurn: 1,
          effect: { hpLossPerRound: 5 },
        },
      })],
    });
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.6);

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    const status = combat.playerStatus.find(s => s.id === 'acid_burn');
    expect(status).toBeDefined();
    expect(status.effect.hpLossPerRound).toBe(5 + 2);
  });
});

describe('spreadAttacks — 무리 타겟 분산', () => {
  it('전열 동료가 있으면 2연타가 플레이어/동료로 나뉜다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({
        attack: { damage: [6, 6], accuracy: 1 },
        attacksPerRound: 2,
        spreadAttacks: true,
      })],
      companions: true,
    });
    // 동료 조준 우회(20% companionTarget)와 명중 굴림을 결정적으로
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.6);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(GameState.player.hp.current).toBeLessThan(100);
    expect(GameState.npcs.states.npc_a.hp).toBeLessThan(50);
    expect(combat.combatants.npc_a.hp).toBeLessThan(50);
  });

  it('동료가 없으면 기존처럼 플레이어 집중 2연타', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({
        attack: { damage: [6, 6], accuracy: 1 },
        attacksPerRound: 2,
        spreadAttacks: true,
      })],
    });
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.6);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(GameState.player.hp.current).toBe(100 - 12);
  });
});

describe('인간 적 동요(wavering) 노출', () => {
  it('HP 50% 이하 인간 적의 인텐트에 동요가 표시된다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({ type: 'human', currentMorale: 80, currentHp: 25, maxHp: 60 })],
    });
    const intent = CombatSystem._decideNextIntent(combat.enemies[0], combat, GameState);
    expect(intent.wavering).toBe(true);
    expect(intent.label).toContain('동요');
  });

  it('HP가 충분한 인간 적은 동요하지 않는다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({ type: 'human', currentMorale: 80, currentHp: 60, maxHp: 60 })],
    });
    const intent = CombatSystem._decideNextIntent(combat.enemies[0], combat, GameState);
    expect(intent.wavering).toBe(false);
  });
});
