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
import { COMBAT_SKILLS } from '../../js/data/combatSkills.js';
import { getRank } from '../../js/systems/combat/FormationSystem.js';

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

describe('_applyRankedEffect heal', () => {
  it('removeStatus에 지정한 상태만 치유와 함께 제거한다', () => {
    setupRankedCombat();
    const actor = makeCombatant({ id: 'npc_jisu', sourceId: 'npc_jisu' });
    const target = makeCombatant({
      id: 'npc_patient',
      sourceId: 'npc_patient',
      hp: 10,
      statusEffects: [
        { id: 'bleed', duration: 2 },
        { id: 'marked', duration: 1 },
      ],
    });

    const result = CombatSystem._applyRankedEffect(
      {
        type: 'heal',
        value: [5, 5],
        removeStatus: ['bleed'],
      },
      actor,
      target,
      () => 0,
    );

    expect(result).toEqual({ ok: true });
    expect(target.hp).toBe(15);
    expect(target.statusEffects).toEqual([
      { id: 'marked', duration: 1 },
    ]);
  });

  it('플레이어 치료는 playerStatus를 정리하고 combatant mirror를 동기화한다', () => {
    const combat = setupRankedCombat();
    const actor = makeCombatant({ id: 'npc_tower_doctor', sourceId: 'npc_tower_doctor' });
    const target = combat.combatants.player;
    combat.playerStatus = [
      { id: 'bleed', duration: 2 },
      { id: 'burn', duration: 1 },
      { id: 'poison', duration: 3 },
      { id: 'marked', duration: 1 },
    ];
    target.statusEffects = [
      { id: 'bleed', duration: 2 },
      { id: 'burn', duration: 1 },
      { id: 'poison', duration: 3 },
      { id: 'marked', duration: 1 },
    ];

    const result = CombatSystem._applyRankedEffect(
      {
        type: 'heal',
        value: [5, 5],
        removeStatus: ['bleed', 'burn', 'poison'],
      },
      actor,
      target,
      () => 0,
    );

    expect(result).toEqual({ ok: true });
    expect(combat.playerStatus).toEqual([
      { id: 'marked', duration: 1 },
    ]);
    expect(target.statusEffects).toEqual([
      { id: 'marked', duration: 1 },
    ]);
  });

  it('동료 치료는 combatant와 영속 NPC 상태를 함께 정리한다', () => {
    setupRankedCombat();
    const actor = makeCombatant({ id: 'npc_jisu', sourceId: 'npc_jisu' });
    const target = makeCombatant({
      id: 'npc_patient',
      sourceId: 'npc_patient',
      hp: 10,
      statusEffects: [
        { id: 'bleed', duration: 2 },
        { id: 'marked', duration: 1 },
      ],
    });
    GameState.npcs.states.npc_patient = {
      hp: 10,
      maxHp: 30,
      statusEffects: [
        { id: 'bleed', duration: 2 },
        { id: 'marked', duration: 1 },
      ],
    };

    const result = CombatSystem._applyRankedEffect(
      {
        type: 'heal',
        value: [5, 5],
        removeStatus: ['bleed'],
      },
      actor,
      target,
      () => 0,
    );

    expect(result).toEqual({ ok: true });
    expect(target.statusEffects).toEqual([
      { id: 'marked', duration: 1 },
    ]);
    expect(GameState.npcs.states.npc_patient.statusEffects).toEqual([
      { id: 'marked', duration: 1 },
    ]);
  });
});

describe('복합 이동 기술의 경계 rank 실행', () => {
  it('rank 4 재배치는 이동 no-op 뒤 dodge를 적용하고 비용과 쿨다운을 한 번 처리한다', () => {
    const combat = setupRankedCombat();
    const actorId = 'npc_soldier_deserter';
    const skillId = 'deserter_reposition';
    const actor = makeCombatant({
      id: actorId,
      sourceId: actorId,
      skillIds: [skillId],
    });
    const skill = {
      ...COMBAT_SKILLS[skillId],
      cooldown: 2,
      costs: { ...COMBAT_SKILLS[skillId].costs },
      target: { ...COMBAT_SKILLS[skillId].target },
      effects: COMBAT_SKILLS[skillId].effects.map(effect => ({ ...effect })),
    };
    combat.combatants[actorId] = actor;
    combat.formations.ally = [actorId, null, null, 'player'];
    combat.skillsById[skillId] = skill;
    combat.activeCombatantId = actorId;
    GameState.npcs.states[actorId] = {
      hp: 30,
      maxHp: 30,
      isCompanion: true,
      skillCooldowns: {},
    };
    const consumeCosts = vi.spyOn(CombatSystem, '_consumeRankedCosts');

    try {
      const result = CombatSystem._executePlannedCompanionAction({
        skillId,
        targetId: actorId,
        reason: 'support_ally',
      });

      expect(result).toMatchObject({
        ok: true,
        costsConsumed: true,
        effectsApplied: 2,
      });
      expect(consumeCosts).toHaveBeenCalledTimes(1);
      expect(GameState.npcs.states[actorId].skillCooldowns[skillId]).toBe(2);
      expect(getRank(combat.formations, actorId)).toBe(4);
      expect(actor.tokens.dodge).toBe(1);
    } finally {
      consumeCosts.mockRestore();
    }
  });

  it('rank 1 경호는 이동 no-op 뒤 guard를 적용하고 비용과 쿨다운을 한 번 처리한다', () => {
    const combat = setupRankedCombat();
    const actorId = 'npc_dog';
    const skillId = 'dog_guard';
    const actor = makeCombatant({
      id: actorId,
      sourceId: actorId,
      skillIds: [skillId],
    });
    const skill = {
      ...COMBAT_SKILLS[skillId],
      cooldown: 2,
      costs: { ...COMBAT_SKILLS[skillId].costs },
      target: { ...COMBAT_SKILLS[skillId].target },
      effects: COMBAT_SKILLS[skillId].effects.map(effect => ({ ...effect })),
    };
    combat.combatants[actorId] = actor;
    combat.formations.ally = [null, null, actorId, 'player'];
    combat.skillsById[skillId] = skill;
    combat.activeCombatantId = actorId;
    GameState.npcs.states[actorId] = {
      hp: 30,
      maxHp: 30,
      isCompanion: true,
      skillCooldowns: {},
    };
    const consumeCosts = vi.spyOn(CombatSystem, '_consumeRankedCosts');

    try {
      const result = CombatSystem._executePlannedCompanionAction({
        skillId,
        targetId: 'player',
        reason: 'guard_ally',
      });

      expect(result).toMatchObject({
        ok: true,
        costsConsumed: true,
        effectsApplied: 2,
      });
      expect(consumeCosts).toHaveBeenCalledTimes(1);
      expect(GameState.npcs.states[actorId].skillCooldowns[skillId]).toBe(2);
      expect(getRank(combat.formations, 'player')).toBe(1);
      expect(combat.combatants.player.tokens.block).toBe(1);
    } finally {
      consumeCosts.mockRestore();
    }
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

  it('플레이어 원거리 명령 비용은 장착 무기의 탄창에서 한 발을 소비한다', () => {
    setupRankedCombat();
    GameState.cards = {
      pistol_1: {
        instanceId: 'pistol_1',
        definitionId: 'pistol',
        loadedAmmo: 2,
        durability: 100,
      },
    };
    GameState.player.equipped = { weapon_main: 'pistol_1', weapon_sub: null };

    const result = CombatSystem._consumeRankedCosts(
      GameState.combat.combatants.player,
      {
        equipmentInstanceId: 'pistol_1',
        costs: { magazineRound: 1, durability: 0, noise: 0 },
      },
    );

    expect(result.ok).toBe(true);
    expect(GameState.cards.pistol_1.loadedAmmo).toBe(1);
  });

  it('빈 탄창 비용 실패는 스태미나와 소음을 먼저 소비하지 않는다', () => {
    setupRankedCombat();
    GameState.cards = {
      pistol_1: {
        instanceId: 'pistol_1',
        definitionId: 'pistol',
        loadedAmmo: 0,
        durability: 100,
      },
    };

    const result = CombatSystem._consumeRankedCosts(
      GameState.combat.combatants.player,
      {
        equipmentInstanceId: 'pistol_1',
        costs: { magazineRound: 1, stamina: 3, noise: 40 },
      },
    );

    expect(result).toMatchObject({ ok: false, reason: 'empty_magazine' });
    expect(GameState.stats.stamina.current).toBe(10);
  });
});

describe('동료 개별 공격력과 비용', () => {
  it('동료 자신의 combatDamageMultiplier를 고정 스킬 피해에 한 번만 적용한다', () => {
    const combat = setupRankedCombat({ enemies: [makeEnemy({ defense: 0 })] });
    const actor = makeCombatant({
      sourceType: 'companion',
      combatDamageMultiplier: 1.4,
    });
    const target = combat.combatants['enemy:0'];

    CombatSystem._applyRankedDamageEffect(
      { type: 'damage', value: [10, 10] },
      actor,
      target,
      () => 0,
      { hit: true, crit: false, skill: { id: 'deserter_rifle_shot' } },
    );

    expect(target.hp).toBe(16);
  });

  it('NPC 고정 스킬 비용은 플레이어 탄창과 탄약 팩을 변경하지 않는다', () => {
    setupRankedCombat();
    GameState.cards = {
      pistol_1: {
        instanceId: 'pistol_1', definitionId: 'pistol', loadedAmmo: 2, durability: 100,
      },
      ammo_1: {
        instanceId: 'ammo_1', definitionId: 'pistol_ammo', quantity: 3,
      },
    };
    const actor = makeCombatant({
      sourceType: 'companion',
      sourceId: 'npc_soldier_deserter',
    });

    const result = CombatSystem._consumeRankedCosts(actor, {
      id: 'deserter_rifle_shot',
      costs: { noise: 10 },
    });

    expect(result.ok).toBe(true);
    expect(GameState.cards.pistol_1.loadedAmmo).toBe(2);
    expect(GameState.cards.ammo_1.quantity).toBe(3);
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

describe('processUntilAllyTurn — 적 자기 턴 사망 결선', () => {
  // 자폭(bloater)·사기 격파(rout)처럼 적이 자기 턴에 죽는 경로는 플레이어 공격
  // 경로의 승리 판정을 거치지 않는다. 결선 누락 시 phase가 resolve_enemy_intent에
  // 갇혀 전투가 영원히 active로 남는 회귀(시뮬 stuck guard_exceeded)를 방지한다.
  it('적이 자기 턴에 죽으면 승리를 결선하고 랭크 combatant를 동기화한다', () => {
    const combat = setupRankedCombat();
    combat.activeIdx = 1;
    combat.activeTurnIndex = 1;
    combat.activeCombatantId = 'enemy:0';
    combat.phase = 'resolve_enemy_intent';

    const selfDestruct = vi.spyOn(CombatSystem, '_runSingleEnemyTurn')
      .mockImplementation(() => { GameState.combat.enemies[0].currentHp = 0; });
    const victory = vi.spyOn(CombatSystem, '_resolveVictory')
      .mockImplementation(() => {
        GameState.combat.active = false;
        GameState.combat.outcome = 'victory';
      });

    const progressed = CombatSystem.processUntilAllyTurn();

    expect(progressed).toBe(true);
    expect(victory).toHaveBeenCalledTimes(1);
    expect(combat.combatants['enemy:0'].dead).toBe(true);
    expect(combat.combatants['enemy:0'].hp).toBe(0);
    expect(combat.outcome).toBe('victory');

    selfDestruct.mockRestore();
    victory.mockRestore();
  });
});

describe('_applyEnemyDefense — 방어 관통 바닥', () => {
  it('정액 방어가 원피해의 defenseFloorRatio 아래로 깎지 못한다', () => {
    const ratio = BALANCE.combat.defenseFloorRatio;
    expect(CombatSystem._applyEnemyDefense(30, 100)).toBe(Math.ceil(30 * ratio));
    expect(CombatSystem._applyEnemyDefense(30, 10)).toBe(20);
    expect(CombatSystem._applyEnemyDefense(2, 50)).toBe(1);
  });
});

describe('previewRankedSkill — 프리뷰 정직성', () => {
  // 스킬 카드에 표기되는 명중/치명이 실제 판정(_resolveRankedHit)과 같은
  // _rankedAimProfile 계산을 쓰는지 고정한다 — 표기와 실판정의 драйф 방지
  it('프리뷰 수치는 실판정 프로필과 일치하고, 경계 굴림 결과가 프로필 명중률을 따른다', () => {
    const combat = setupRankedCombat();
    GameState.time = { ...(GameState.time ?? {}), hour: 12 };
    const skill = {
      id: 'test_strike',
      accuracy: 0.5,
      critChance: 0.1,
      usableFrom: [1, 2, 3, 4],
      target: { side: 'enemy', ranks: [1, 2, 3, 4], count: 1 },
      effects: [{ type: 'damage', value: [5, 7] }],
    };
    combat.skillsById.test_strike = skill;
    combat.combatants.player.skillIds = ['test_strike'];
    combat.activeCombatantId = 'player';

    const profile = CombatSystem._rankedAimProfile(combat.combatants.player, skill);
    const preview = CombatSystem.previewRankedSkill('test_strike');

    expect(preview.accuracy).toBe(Math.round(profile.accuracy * 100));
    expect(preview.critChance).toBe(Math.round(Math.min(1, profile.critChance) * 100));
    expect(preview.dmgMin).toBe(5);
    expect(preview.dmgMax).toBe(7);

    const enemy = combat.combatants['enemy:0'];
    const justUnder = CombatSystem._resolveRankedHit(
      combat.combatants.player, enemy, skill, () => profile.accuracy - 0.001,
    );
    expect(justUnder.hit).toBe(true);

    const justOver = CombatSystem._resolveRankedHit(
      combat.combatants.player, enemy, skill, () => Math.min(0.999, profile.accuracy + 0.001),
    );
    expect(justOver.hit).toBe(false);
  });
});

describe('상태이상 저장소 분리 — 라운드당 단일 틱', () => {
  it('랭크 저장소에만 있는 플레이어 DoT는 라운드당 정확히 1회 틱된다', () => {
    const combat = setupRankedCombat();
    combat.combatants.player.statusEffects = [
      { id: 'bleed', duration: 2, effect: { hpLossPerRound: 5 } },
    ];

    CombatSystem._onRoundStart(combat);

    expect(combat.combatants.player.hp).toBe(95);
    expect(GameState.player.hp.current).toBe(95);
  });

  it('레거시 playerStatus에만 있는 DoT도 라운드당 정확히 1회 틱된다', () => {
    const combat = setupRankedCombat();
    combat.playerStatus = [
      { id: 'bleed', name: '출혈', duration: 2, effect: { hpLossPerRound: 5 } },
    ];

    CombatSystem._onRoundStart(combat);

    expect(GameState.player.hp.current).toBe(95);
    expect(combat.combatants.player.hp).toBe(95);
  });
});
