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
import { moveCombatant, getRank } from '../../js/systems/combat/FormationSystem.js';

function makeEnemy(overrides = {}) {
  return {
    id: 'test_e', name: '테스트적', icon: '👹',
    currentHp: 60, maxHp: 60,
    aiPattern: 'normal',
    specialActionChance: 1,
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
  it('legacy telegraph intent는 저장된 특수 행동으로 이행해 실행한다', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ specialSkills: [SLAM] })] });
    const enemy = combat.enemies[0];
    enemy._enemyActionState = { committedAction: null };
    enemy._telegraph = {
      skillId: 'slam',
      remaining: 1,
      targetRank: getRank(combat.formations, 'player'),
    };
    enemy._nextIntent = {
      action: 'telegraph',
      skillId: 'slam',
      targetType: 'player',
      targetId: null,
      countdown: 1,
      iconEmoji: '⚠️',
      label: '강타 준비 중!',
    };
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0);

    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    expect(GameState.player.hp.current).toBe(80);
    expect(enemy._skillCooldowns.slam).toBe(3);
    expect(enemy._telegraph).toBeNull();
  });

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

describe('F2 — 위치 공격 (forcedMove)', () => {
  it('charger 강타 발동 시 플레이어가 후열로 밀려난다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({
        timedThreat: { id: 'charge_strike', chargeTurns: 1 },
        _chargeRemaining: 0,
      })],
    });
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    CombatSystem._runSingleEnemyTurn(0);
    rand.mockRestore();

    const rank = getRank(combat.formations, 'player');
    expect(rank).toBe(2);
    expect(GameState.player.hp.current).toBeLessThan(100);
  });

  it('4랭크 벽에 막힌 밀치기는 이동 대신 충돌 고정 피해', () => {
    const combat = setupCombat({ enemies: [makeEnemy()] });
    combat.formations.ally = ['player', null, null, null];
    const hpBefore = GameState.player.hp.current;

    CombatSystem._forceMoveAlly('player', 1, combat.enemies[0]);

    expect(getRank(combat.formations, 'player')).toBe(4);
    expect(GameState.player.hp.current).toBe(hpBefore - 4);
  });

  it('acid_lash는 후열 플레이어를 전열로 끌어온다', () => {
    const combat = setupCombat({ enemies: [makeEnemy()] });
    combat.formations.ally = [null, 'player', null, null];
    expect(getRank(combat.formations, 'player')).toBe(3);

    CombatSystem._applyEnemySkillEffect(
      combat.enemies[0],
      { id: 'acid_lash', effect: { forcedMove: -2 } },
      8,
    );

    expect(getRank(combat.formations, 'player')).toBe(1);
  });

  it('강제 이동 후에도 진형 불변식(4칸, 유효 슬롯)이 유지된다', () => {
    const combat = setupCombat({ enemies: [makeEnemy()], companions: true });
    CombatSystem._forceMoveAlly('player', 1, combat.enemies[0]);
    CombatSystem._forceMoveAlly('player', -1, combat.enemies[0]);

    expect(combat.formations.ally).toHaveLength(4);
    const occupied = combat.formations.ally.filter(Boolean);
    expect(new Set(occupied).size).toBe(occupied.length);
    expect(occupied).toContain('player');
  });
});

describe('F2 — reposition auto 방향', () => {
  it('넉백당해 근접 스킬이 잠긴 랭크에서는 전방으로 복귀한다', () => {
    const combat = setupCombat({ enemies: [makeEnemy()] });
    combat.formations.ally = [null, 'player', null, null];
    const player = combat.combatants.player;
    combat.skillsById.test_melee = {
      id: 'test_melee', usableFrom: [1, 2], target: { side: 'enemy', ranks: [1, 2] },
      effects: [{ type: 'damage', value: [5, 5] }],
    };
    player.skillIds = ['test_melee'];

    CombatSystem._applyRankedEffect({ type: 'move', distance: 'auto' }, player, player);

    expect(getRank(combat.formations, 'player')).toBe(2);
  });

  it('모든 공격 스킬이 사용 가능하면 기존처럼 후열(+1)로 이동한다', () => {
    const combat = setupCombat({ enemies: [makeEnemy()] });
    const player = combat.combatants.player;
    combat.skillsById.test_any = {
      id: 'test_any', usableFrom: [1, 2, 3, 4], target: { side: 'enemy', ranks: [1, 2, 3, 4] },
      effects: [{ type: 'damage', value: [5, 5] }],
    };
    player.skillIds = ['test_any'];
    const before = getRank(combat.formations, 'player');

    CombatSystem._applyRankedEffect({ type: 'move', distance: 'auto' }, player, player);

    expect(getRank(combat.formations, 'player')).toBe(before + 1);
  });
});

describe('F3 — 셋업→페이오프 스킬 연결', () => {
  it('soldier_tactical_shift는 이동과 함께 focus 토큰을 준다', async () => {
    const { COMBAT_SKILLS } = await import('../../js/data/combatSkills.js');
    const skill = COMBAT_SKILLS.soldier_tactical_shift;
    expect(skill.effects.some(e => e.type === 'move')).toBe(true);
    expect(skill.effects.some(e => e.type === 'token' && e.token === 'focus')).toBe(true);
  });

  it('firefighter_force_advance는 전진과 함께 strength 토큰을 준다', async () => {
    const { COMBAT_SKILLS } = await import('../../js/data/combatSkills.js');
    const skill = COMBAT_SKILLS.firefighter_force_advance;
    expect(skill.effects.some(e => e.type === 'move' && e.distance === -1)).toBe(true);
    expect(skill.effects.some(e => e.type === 'token' && e.token === 'strength')).toBe(true);
  });

  it('chef_knife_flurry는 DoT 걸린 대상에 1.5배 피해 (bonusVs)', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ currentHp: 60, maxHp: 60, defense: 0 })] });
    const target = combat.combatants['enemy:0'];
    target.statusEffects = [{ id: 'burn', duration: 2, effect: { hpLossPerRound: 3 } }];

    const skill = {
      id: 'chef_knife_flurry', nameKey: 'combat.skill.chef_knife_flurry',
      bonusVs: { statusIds: ['burn'], mult: 1.5 },
      effects: [{ type: 'damage', value: [10, 10] }],
    };
    CombatSystem._applyRankedDamageEffect(
      skill.effects[0], combat.combatants.player, target, () => 0,
      { hit: true, crit: false, skill },
    );

    // 기본 10 → bonusVs x1.5 = 15 (도터 미보유 대조군은 10)
    expect(60 - target.hp).toBeGreaterThanOrEqual(15);
  });

  it('engineer_wrench_strike는 제어 상태 대상에 치명 확정 (bonusVs critAuto)', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ currentHp: 60, maxHp: 60, defense: 0 })] });
    const target = combat.combatants['enemy:0'];
    target.statusEffects = [{ id: 'shock', duration: 1, effect: {} }];

    const skill = {
      id: 'engineer_wrench_strike', nameKey: 'combat.skill.engineer_wrench_strike',
      bonusVs: { statusIds: ['shock', 'rooted', 'stun'], critAuto: true },
      effects: [{ type: 'damage', value: [10, 10] }],
    };
    CombatSystem._applyRankedDamageEffect(
      skill.effects[0], combat.combatants.player, target, () => 0,
      { hit: true, crit: false, critMultiplier: 2, skill },
    );

    expect(60 - target.hp).toBeGreaterThanOrEqual(20);
    expect(combat.lastHit.isCrit).toBe(true);
  });

  it('상태이상이 없으면 bonusVs가 발동하지 않는다 (대조군)', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ currentHp: 60, maxHp: 60, defense: 0 })] });
    const target = combat.combatants['enemy:0'];

    const skill = {
      id: 'chef_knife_flurry', nameKey: 'combat.skill.chef_knife_flurry',
      bonusVs: { statusIds: ['burn'], mult: 1.5 },
      effects: [{ type: 'damage', value: [10, 10] }],
    };
    CombatSystem._applyRankedDamageEffect(
      skill.effects[0], combat.combatants.player, target, () => 0,
      { hit: true, crit: false, skill },
    );

    expect(60 - target.hp).toBeLessThan(15);
  });
});

describe('F4 — 약점 발견·표기', () => {
  it('약점 무기로 첫 타격 시 enemyWeaknessSeen에 기록된다', () => {
    const combat = setupCombat({
      enemies: [makeEnemy({ id: 'zombie_common', weaknesses: ['blade'] })],
    });
    delete GameState.flags.enemyWeaknessSeen;
    const target = combat.combatants['enemy:0'];
    const weaponId = 'w1';
    GameState.cards = { [weaponId]: { instanceId: weaponId, definitionId: 'knife' } };
    GameState.getCardDef = () => ({ id: 'knife', weaponType: 'blade', combat: {} });

    CombatSystem._applyRankedDamageEffect(
      { type: 'damage', value: [5, 5] },
      combat.combatants.player, target, () => 0,
      { hit: true, crit: false, skill: { id: 's', equipmentInstanceId: weaponId, effects: [] } },
    );

    expect(GameState.flags.enemyWeaknessSeen.zombie_common).toBe(true);
  });

  it('발견 전에는 약점 배지가 없고, 발견 후에는 표시된다', async () => {
    const CombatUI = (await import('../../js/ui/CombatUI.js')).default;
    CombatUI._screen = document.getElementById('screen-combat');
    setupCombat({ enemies: [makeEnemy({ id: 'zombie_common', weaknesses: ['blade', 'fire'] })] });
    GameState.flags.enemyWeaknessSeen = {};

    CombatUI.render();
    expect(document.querySelector('.combat-weakness')).toBeNull();

    GameState.flags.enemyWeaknessSeen.zombie_common = true;
    CombatUI.render();
    const badge = document.querySelector('.combat-weakness');
    expect(badge).not.toBeNull();
    expect(badge.getAttribute('title')).toContain('blade');
  });

  it('발견 기록은 세이브 직렬화에 포함된다', () => {
    GameState.flags.enemyWeaknessSeen = { zombie_brute: true };
    const parsed = JSON.parse(GameState.serialize());
    expect(parsed.flags.enemyWeaknessSeen.zombie_brute).toBe(true);
  });
});

describe('F5 — 스트레스 동요·붕괴·도주', () => {
  it('스트레스 7+ 동요는 명중을 떨어뜨린다', () => {
    const combat = setupCombat({ enemies: [makeEnemy()] });
    const player = combat.combatants.player;
    const skill = {
      id: 's', accuracy: 0.7, usableFrom: [1, 2, 3, 4],
      target: { side: 'enemy', ranks: [1, 2, 3, 4] },
      effects: [{ type: 'damage', value: [5, 5] }],
    };
    player.stress = 0;
    const calm = CombatSystem._rankedAimProfile(player, skill).accuracy;
    player.stress = 7;
    const shaken = CombatSystem._rankedAimProfile(player, skill).accuracy;

    expect(calm - shaken).toBeCloseTo(0.05, 5);
  });

  it('붕괴 시 공격 스킬 하나가 다음 라운드까지 잠긴다', () => {
    const combat = setupCombat({ enemies: [makeEnemy()] });
    const player = combat.combatants.player;
    combat.skillsById.lockme = {
      id: 'lockme', nameKey: 'combat.skill.basic_strike', usableFrom: [1, 2, 3, 4],
      target: { side: 'enemy', ranks: [1, 2, 3, 4] },
      effects: [{ type: 'damage', value: [5, 5] }],
    };
    player.skillIds = ['lockme'];
    player.stress = 9;
    combat.roundNumber = 2;
    combat.activeCombatantId = 'player';
    combat.phase = 'await_ally_input';

    // random 0.5 ≥ resolveChance 0.10 → 붕괴 확정
    CombatSystem._applyStressWithFeedback(player, 2, () => 0.5);

    expect(player._skillLock).toMatchObject({ skillId: 'lockme', untilRound: 3 });
    expect(CombatSystem.selectSkill('lockme')).toBe(false);

    combat.roundNumber = 4;
    expect(CombatSystem.selectSkill('lockme')).toBe(true);
  });

  it('도주 성공률은 상황에 따라 오르고 상한 0.9에 캡된다', () => {
    const combat = setupCombat({ enemies: [makeEnemy({ row: 'back', position: 'back' })] });
    combat.enemies[0].row = 'back';
    combat.combatants.player.tokens.speed = 1;
    combat.enemies[0]._statusEffects = [{ id: 'stun' }];

    // base 0.5 + 전열 공백 0.2 + speed 0.15 + 전원 무력화 0.15 = 1.0 → cap 0.9
    expect(CombatSystem._situationalFleeChance()).toBeCloseTo(0.9, 5);
  });

  it('아무 이점 없는 도주는 base 확률만 적용된다', () => {
    setupCombat({ enemies: [makeEnemy()] });
    expect(CombatSystem._situationalFleeChance()).toBeCloseTo(0.5, 5);
  });
});

describe('C3 — 토큰 배지·상태이상 잔여 턴 표시', () => {
  it('토큰은 아이콘+스택+한글 툴팁으로 렌더된다', async () => {
    const CombatUI = (await import('../../js/ui/CombatUI.js')).default;
    CombatUI._screen = document.getElementById('screen-combat');
    const combat = setupCombat({ enemies: [makeEnemy()] });
    combat.combatants.player.tokens = { focus: 2 };

    CombatUI.render();

    const badge = document.querySelector('.combat-token');
    expect(badge).not.toBeNull();
    expect(badge.getAttribute('title')).toBe('집중 ×2');
    expect(badge.textContent).toContain('2');
    expect(badge.textContent).not.toContain('focus');
  });

  it('전장 유닛의 상태이상 오브에 잔여 턴이 표기된다', async () => {
    const CombatUI = (await import('../../js/ui/CombatUI.js')).default;
    CombatUI._screen = document.getElementById('screen-combat');
    const combat = setupCombat({ enemies: [makeEnemy()] });
    combat.combatants['enemy:0'].statusEffects = [
      { id: 'bleed', name: '출혈', duration: 3, effect: { hpLossPerRound: 3 } },
    ];

    CombatUI.render();

    const orbs = document.querySelector('[data-combatant-id="enemy:0"] .combat-status-orbs');
    expect(orbs).not.toBeNull();
    expect(orbs.textContent).toContain('출혈(3)');
  });
});
