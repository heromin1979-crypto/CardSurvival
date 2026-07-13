// === Track 0 — 전투 엔진 단일화 파이프라인 ===
// 검증:
//   - _resolveRankedHit: dodge/accuracy/focus 토큰 소비와 명중·치명 판정
//   - _applyRankedDamageEffect: 치명 배율 → 토큰 → 약점/저항 → 방어 → 적용 + fx/킬 컨텍스트
//   - _dealDamageToAlly: 회피/블록/취약 토큰 + 죽음의 문턱(플레이어)
//   - _onRoundStart: 랭크 상태이상 틱 + 이니셔티브 재정렬
//   - _consumeRankedCosts: 실제 스태미나(gs.stats)/탄약/내구도 소비
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState from '../../js/core/GameState.js';
import BALANCE from '../../js/data/gameBalance.js';

function makeEnemy(overrides = {}) {
  return {
    id: 'test_zombie',
    name: '테스트 좀비',
    type: 'zombie',
    currentHp: 30,
    maxHp: 30,
    defense: 0,
    xp: 5,
    attack: { damage: [5, 5], accuracy: 1 },
    specialSkills: [],
    _skillCooldowns: {},
    _statusEffects: [],
    lootTable: [],
    ...overrides,
  };
}

function makeCombatant(overrides = {}) {
  return {
    id: 'unit',
    side: 'ally',
    sourceType: 'companion',
    sourceId: 'npc_nurse',
    hp: 30,
    maxHp: 30,
    speed: 5,
    tokens: {},
    statusEffects: [],
    deathsDoor: false,
    deathResist: BALANCE.combat.deathsDoor.baseResist,
    dead: false,
    ...overrides,
  };
}

function setupRankedCombat({ enemies = [makeEnemy()] } = {}) {
  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.isAlive = true;
  GameState.stats = GameState.stats ?? {};
  GameState.stats.stamina = { current: 10, max: 10 };
  // 사기 normal 구간(dmgMult 1.0) 고정 — 사기 배율이 계산 검증을 흔들지 않도록
  GameState.stats.morale = { current: 50, max: 100 };
  GameState.companions = [];
  GameState.npcs = { states: {} };

  const playerCombatant = makeCombatant({
    id: 'player',
    sourceType: 'player',
    sourceId: 'player',
    hp: 100,
    maxHp: 100,
  });
  const enemyCombatants = Object.fromEntries(enemies.map((enemy, index) => [
    `enemy:${index}`,
    makeCombatant({
      id: `enemy:${index}`,
      side: 'enemy',
      sourceType: 'enemy',
      sourceId: enemy.id,
      enemyIndex: index,
      hp: enemy.currentHp,
      maxHp: enemy.maxHp,
      speed: 4,
    }),
  ]));

  GameState.combat = {
    active: true,
    enemies,
    targetIndex: 0,
    log: [],
    round: 0,
    playerStatus: [],
    enemyStatus: [],
    rewards: [],
    fxQueue: [],
    xpGained: 0,
    turnQueue: [
      { type: 'player', order: 0, combatantId: 'player' },
      ...enemies.map((_, index) => ({
        type: 'enemy', enemyIdx: index, order: index + 1, combatantId: `enemy:${index}`,
      })),
    ],
    activeIdx: 0,
    roundNumber: 1,
    combatants: { player: playerCombatant, ...enemyCombatants },
    formations: {
      ally: [null, null, null, 'player'],
      enemy: [
        ...enemies.map((_, index) => `enemy:${index}`),
        ...Array(4).fill(null),
      ].slice(0, 4),
    },
    skillsById: {},
    enemyProfiles: {},
    pendingIntentByEnemy: {},
    activeTurnIndex: 0,
    activeCombatantId: 'player',
  };
  return GameState.combat;
}

describe('_resolveRankedHit', () => {
  beforeEach(() => setupRankedCombat());

  it('아군 대상 스킬은 판정 없이 항상 명중', () => {
    const actor = makeCombatant();
    const target = makeCombatant({ id: 'other', tokens: { dodge: 1 } });
    const result = CombatSystem._resolveRankedHit(actor, target, { accuracy: 0, target: { side: 'ally' } }, () => 0.99);

    expect(result.hit).toBe(true);
    expect(target.tokens.dodge).toBe(1);
  });

  it('dodge 토큰을 가진 적은 명중 굴림 성공을 무효화하고 토큰을 소비한다', () => {
    const combat = GameState.combat;
    const actor = makeCombatant();
    const target = combat.combatants['enemy:0'];
    target.tokens.dodge = 1;

    const result = CombatSystem._resolveRankedHit(actor, target, { accuracy: 1, effects: [] }, () => 0);

    expect(result.hit).toBe(false);
    expect(result.dodged).toBe(true);
    expect(target.tokens.dodge).toBe(0);
  });

  it('focus 토큰은 치명타 확률 보정 후 소비된다', () => {
    const actor = makeCombatant({ tokens: { focus: 1 } });
    const target = GameState.combat.combatants['enemy:0'];
    const skill = { accuracy: 1, critChance: 0.05, effects: [{ type: 'damage', value: [3, 3] }] };
    // 굴림 0.1: 기본 0.05로는 실패, focus 보너스(+0.15) 포함 시 성공
    const result = CombatSystem._resolveRankedHit(actor, target, skill, () => 0.1);

    expect(result.crit).toBe(true);
    expect(actor.tokens.focus).toBe(0);
  });
});

describe('_applyRankedDamageEffect', () => {
  it('치명타 배율·취약 토큰·방어 차감이 순서대로 적용되고 fx가 push된다', () => {
    const combat = setupRankedCombat({ enemies: [makeEnemy({ defense: 2 })] });
    const actor = combat.combatants.player;
    const target = combat.combatants['enemy:0'];
    target.tokens.vulnerable = 1;

    const hitInfo = { hit: true, crit: true, critMultiplier: 2, skill: { id: 'basic_strike', effects: [] } };
    // 기본 10 → 치명 ×2 = 20 → 방어 -2 = 18 → 취약 ×1.3 = 23
    CombatSystem._applyRankedDamageEffect({ type: 'damage', value: [10, 10] }, actor, target, () => 0, hitInfo);

    expect(target.hp).toBe(30 - 23);
    expect(combat.enemies[0].currentHp).toBe(30 - 23);
    expect(target.tokens.vulnerable).toBe(0);
    const fx = combat.fxQueue.find(f => f.kind === 'playerAttack');
    expect(fx).toMatchObject({ dmg: 23, crit: true, killed: false });
  });

  it('처치 시 _lastKillContext를 기록하고 killed fx를 남긴다', () => {
    const combat = setupRankedCombat({ enemies: [makeEnemy({ currentHp: 5, maxHp: 5 })] });
    const actor = combat.combatants.player;
    const target = combat.combatants['enemy:0'];
    target.hp = 5;

    CombatSystem._applyRankedDamageEffect(
      { type: 'damage', value: [10, 10] },
      actor,
      target,
      () => 0,
      { hit: true, crit: false, skill: { id: 'basic_strike', effects: [] } },
    );

    expect(target.dead).toBe(true);
    expect(combat.enemies[0].currentHp).toBe(0);
    expect(combat._lastKillContext).toMatchObject({ weaponType: 'unarmed', isMelee: true });
    expect(combat.fxQueue.at(-1)).toMatchObject({ kind: 'playerAttack', killed: true });
  });
});

describe('_dealDamageToAlly', () => {
  it('dodge 토큰으로 적 공격을 회피하고 토큰을 소비한다', () => {
    const combat = setupRankedCombat();
    combat.combatants.player.tokens.dodge = 1;

    const result = CombatSystem._dealDamageToAlly({ rawDamage: 12 });

    expect(result.dodged).toBe(true);
    expect(GameState.player.hp.current).toBe(100);
    expect(combat.combatants.player.tokens.dodge).toBe(0);
  });

  it('block 토큰은 피해를 절반으로 줄인다', () => {
    const combat = setupRankedCombat();
    combat.combatants.player.tokens.block = 1;

    const result = CombatSystem._dealDamageToAlly({ rawDamage: 10 });

    expect(result.damage).toBe(5);
    expect(GameState.player.hp.current).toBe(95);
  });

  it('플레이어는 HP 0에서 즉사하지 않고 죽음의 문턱에 진입한다', () => {
    const combat = setupRankedCombat();
    combat.combatants.player.hp = 5;
    GameState.player.hp.current = 5;

    const result = CombatSystem._dealDamageToAlly({ rawDamage: 50 });

    expect(result.dead).toBe(false);
    expect(GameState.player.hp.current).toBe(0);
    expect(combat.combatants.player.deathsDoor).toBe(true);
    expect(CombatSystem._isPlayerDefeated()).toBe(false);
  });
});

describe('_onRoundStart', () => {
  it('랭크 상태이상(DoT)을 틱하고 지속시간을 줄인다', () => {
    const combat = setupRankedCombat();
    const enemyCombatant = combat.combatants['enemy:0'];
    enemyCombatant.statusEffects = [
      { id: 'bleed', duration: 2, effect: { hpLossPerRound: 4 } },
    ];

    CombatSystem._onRoundStart(combat);

    expect(enemyCombatant.hp).toBe(26);
    expect(combat.enemies[0].currentHp).toBe(26);
    expect(enemyCombatant.statusEffects[0].duration).toBe(1);
  });

  it('speed 토큰을 소비하고 턴 순서를 재구성한다 (멤버십 보존)', () => {
    const combat = setupRankedCombat({ enemies: [makeEnemy(), makeEnemy({ id: 'z2' })] });
    combat.combatants.player.tokens.speed = 2;
    const beforeIds = combat.turnQueue.map(e => e.combatantId).sort();

    CombatSystem._onRoundStart(combat);

    expect(combat.combatants.player.tokens.speed).toBe(0);
    expect(combat.turnQueue.map(e => e.combatantId).sort()).toEqual(beforeIds);
    expect(combat.turnQueue.map(e => e.order)).toEqual([0, 1, 2]);
    expect(combat.activeIdx).toBeGreaterThanOrEqual(0);
  });
});

describe('_consumeRankedCosts', () => {
  it('플레이어 스태미나는 gs.stats.stamina에서 차감된다', () => {
    setupRankedCombat();
    const actor = GameState.combat.combatants.player;

    CombatSystem._consumeRankedCosts(actor, { costs: { stamina: 3 } });

    expect(GameState.stats.stamina.current).toBe(7);
  });

  it('탄약을 보드에서 실제로 차감한다', () => {
    setupRankedCombat();
    const ammo = { instanceId: 'ammo_1', definitionId: 'pistol_ammo', quantity: 2 };
    GameState.getBoardCards = () => [ammo];

    const result = CombatSystem._consumeRankedCosts(
      GameState.combat.combatants.player,
      { costs: { ammo: 'pistol_ammo' } },
    );

    expect(result.ok).toBe(true);
    expect(ammo.quantity).toBe(1);
  });
});

describe('Track 1 — 상시 스트레스 축적', () => {
  it('강타 피격(임계 이상)은 스트레스를 축적한다', () => {
    const combat = setupRankedCombat();
    combat.combatants.player.stress = 0;

    CombatSystem._dealDamageToAlly({
      rawDamage: BALANCE.combat.stress.heavyHitThreshold,
    });

    expect(combat.combatants.player.stress)
      .toBe(BALANCE.combat.stress.heavyHitStress);
  });

  it('죽음의 문턱 진입은 더 큰 스트레스를 준다', () => {
    const combat = setupRankedCombat();
    combat.combatants.player.hp = 3;
    GameState.player.hp.current = 3;
    combat.combatants.player.stress = 0;

    CombatSystem._dealDamageToAlly({ rawDamage: 10 });

    expect(combat.combatants.player.deathsDoor).toBe(true);
    expect(combat.combatants.player.stress)
      .toBe(BALANCE.combat.stress.deathsDoorStress);
  });

  it('야간 라운드는 광원이 없으면 아군 전원에게 스트레스를 준다', () => {
    const combat = setupRankedCombat();
    GameState.time = { hour: 2, day: 1 };
    GameState.getBoardCards = () => [];
    combat.combatants.player.stress = 0;

    CombatSystem._onRoundStart(combat);

    expect(combat.combatants.player.stress)
      .toBe(BALANCE.combat.stress.nightRoundStress);
    GameState.time = { hour: 12, day: 1 };
  });
});

describe('Track 1 — 위치 시너지', () => {
  it('최전방(1랭크) 근접 공격은 피해 보너스를 받는다', () => {
    const combat = setupRankedCombat({ enemies: [makeEnemy({ defense: 0 })] });
    const actor = combat.combatants.player;
    combat.formations.ally = ['player', null, null, null]; // ally rank 1 = index 3? rankToIndex ally: 4-rank
    combat.formations.ally = [null, null, null, 'player'];

    const skill = {
      id: 'basic_strike',
      usableFrom: [1, 2],
      target: { side: 'enemy', ranks: [1, 2] },
      effects: [{ type: 'damage', value: [10, 10] }],
    };
    CombatSystem._applyRankedDamageEffect(
      { type: 'damage', value: [10, 10] },
      actor,
      combat.combatants['enemy:0'],
      () => 0,
      { hit: true, crit: false, skill },
    );

    const expected = Math.floor(10 * BALANCE.combat.position.frontlineMeleeDamageMult);
    expect(combat.enemies[0].currentHp).toBe(30 - expected);
  });
});

describe('관계 반응 결선 (RelationshipCombatSystem)', () => {
  it('유대 높은 동료가 있으면 행동 후 지원 반응으로 스트레스가 줄어든다', () => {
    const combat = setupRankedCombat();
    combat.combatants.npc_nurse = makeCombatant({
      id: 'npc_nurse',
      sourceId: 'npc_nurse',
      bond: 80,
    });
    combat.combatants.player.stress = 5;

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const reaction = CombatSystem._resolveRelationshipAfterAction('player');
    randomSpy.mockRestore();

    expect(reaction).toMatchObject({ type: 'support', sourceId: 'npc_nurse', targetId: 'player' });
    expect(combat.combatants.player.stress)
      .toBe(5 - BALANCE.combat.relationship.supportStressHeal);
    expect(combat.relationshipEvents).toHaveLength(1);
  });

  it('같은 actionSequence에서는 반응이 중복 발동하지 않는다', () => {
    const combat = setupRankedCombat();
    combat.combatants.npc_nurse = makeCombatant({
      id: 'npc_nurse',
      sourceId: 'npc_nurse',
      bond: 80,
    });
    combat.actionSequence = 3;

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const first = CombatSystem._resolveRelationshipAfterAction('player');
    const second = CombatSystem._resolveRelationshipAfterAction('player');
    randomSpy.mockRestore();

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });
});
