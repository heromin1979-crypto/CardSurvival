// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';
import {
  applyMultiTarget,
  throwableAction,
} from '../../js/systems/CombatActions.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import { buildEquipmentSkill } from '../../js/systems/combat/CombatSkillSystem.js';

const BASELINE_SAVE = GameState.serialize();

function setupBoss(bossId, {
  playerHp = 500,
  playerMaxHp = 500,
  companionIds = [],
} = {}) {
  const definition = structuredClone(SECRET_ENEMIES[bossId]);
  expect(definition, bossId).toBeDefined();

  document.body.innerHTML = '<div id="screen-combat"></div>';
  GameState.player.hp = { current: playerHp, max: playerMaxHp };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.player.healBonus = 1;
  GameState.player.xp = 0;
  GameState.cards = {};
  GameState.stats.stamina = { current: 100, max: 100, decayPerTP: 0 };
  GameState.stats.morale = { current: 70, max: 100, decayPerTP: 0.2 };
  GameState.stats.radiation = { current: 0, max: 100 };
  GameState.flags = {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  GameState.companions = [...companionIds];
  GameState.npcs = {
    states: Object.fromEntries(companionIds.map(npcId => [
      npcId,
      {
        hp: 500,
        maxHp: 500,
        isCompanion: true,
        statusEffects: [],
      },
    ])),
  };

  SystemRegistry.register('NPCSystem', {
    damageCompanion: (npcId, damage) => {
      const state = GameState.npcs.states[npcId];
      state.hp = Math.max(0, state.hp - damage);
    },
    getCompanionCombatBonus: () => 1,
    getNpcDef: () => null,
  });

  const enemy = CombatSystem._instantiateEnemyFromDefinition(definition);
  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 1,
    nodeId: `boss-final-fix-${bossId}`,
  });
  return {
    combat: GameState.combat,
    enemy: GameState.combat.enemies[0],
  };
}

function forceAction(enemy, definition, category, {
  state = 'ready',
  targetIds = ['player'],
  committed = {},
} = {}) {
  enemy._bossActionState = {
    committedAction: {
      actionId: definition.id,
      category,
      state,
      targetIds,
      remainingTelegraphTurns: state === 'telegraphing' ? 1 : 0,
      hitCount: Number.isFinite(definition.hitCount) ? definition.hitCount : 1,
      motionKey: definition.motionKey,
      ...committed,
    },
    ultimatePending: false,
    ultimateUsed: category === 'ultimate',
    lastBasicActionId: null,
  };
}

function damageBoss(enemy, amount) {
  const target = CombatSystem._rankCombatantForEnemy(enemy);
  const actor = {
    id: 'test:companion',
    side: 'ally',
    sourceType: 'companion',
    combatDamageMultiplier: 1,
    tokens: {},
  };
  const effect = { type: 'damage', value: [amount, amount], damageType: 'blunt' };
  return CombatSystem._applyRankedDamageEffect(
    effect,
    actor,
    target,
    () => 0,
    {
      hit: true,
      crit: false,
      skill: {
        id: 'final_fix_probe',
        damageType: 'blunt',
        effects: [effect],
      },
    },
  );
}

function actionFxCount(actionId) {
  return GameState.combat.fxQueue.filter(entry => (
    entry.kind === 'enemyAttack'
    && entry.actionId === actionId
    && entry.miss === false
  )).length;
}

function addCombatItem(definitionId, quantity = 2) {
  const instanceId = `final-fix-${definitionId}`;
  GameState.cards[instanceId] = {
    instanceId,
    definitionId,
    quantity,
    durability: 100,
    contamination: 0,
  };
  return instanceId;
}

function activateHungerDomination(enemy, targetIds = ['player']) {
  forceAction(enemy, enemy.bossPattern.ultimate, 'ultimate', { targetIds });
  CombatSystem._runSingleEnemyTurn(0);
  return GameState.combat.battlefieldStatuses?.find(status => (
    status.id === 'hunger_domination'
  ));
}

function arrangeTurnQueue(combat, combatantIds, activeCombatantId) {
  const entriesById = new Map(combat.turnQueue.map(entry => [
    entry.combatantId,
    entry,
  ]));
  combat.turnQueue = combatantIds.map((combatantId, order) => ({
    ...entriesById.get(combatantId),
    order,
  }));
  combat.activeIdx = combatantIds.indexOf(activeCombatantId);
  combat.activeTurnIndex = combat.activeIdx;
  combat.activeCombatantId = activeCombatantId;
  CombatSystem.beginActiveTurn();
}

beforeEach(() => {
  vi.restoreAllMocks();
  GameState.deserialize(BASELINE_SAVE);
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

describe('Finding A - 동적 필살기 퍼즐', () => {
  it('critical_mass는 예고 중 선언 임계 피해를 누적하고 발동 피해와 방사선 수치를 절반으로 낮춘다', () => {
    const { combat, enemy } = setupBoss('boss_radiation_colossus');
    const ultimate = enemy.bossPattern.ultimate;
    expect(ultimate.telegraphDamageThreshold).toEqual({
      amount: 100,
      resolutionMultiplier: 0.5,
      statusMagnitudeKeys: ['radiation'],
    });
    enemy.defense = 0;
    forceAction(enemy, ultimate, 'ultimate', {
      state: 'telegraphing',
      targetIds: ['player'],
      committed: { telegraphDamageTaken: 0 },
    });

    damageBoss(enemy, 100);

    expect(enemy._bossActionState.committedAction.telegraphDamageTaken).toBe(100);
    enemy._bossActionState.committedAction = {
      ...enemy._bossActionState.committedAction,
      state: 'ready',
      remainingTelegraphTurns: 0,
    };
    combat.fxQueue = [];
    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(483);
    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'radiation_sickness',
      effect: expect.objectContaining({ radiation: 4 }),
    }));
  });

  it('critical_mass는 예고 중 피해가 임계치 미만이면 원래 피해와 방사선 수치를 유지한다', () => {
    const { combat, enemy } = setupBoss('boss_radiation_colossus');
    const ultimate = enemy.bossPattern.ultimate;
    forceAction(enemy, ultimate, 'ultimate', {
      committed: { telegraphDamageTaken: 99 },
    });

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(465);
    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'radiation_sickness',
      effect: expect.objectContaining({ radiation: 8 }),
    }));
  });

  it('critical_mass ready 창의 legacy direct 피해만 누적하고 닫힌 action state는 제외한다', () => {
    const { enemy } = setupBoss('boss_radiation_colossus');
    const ultimate = enemy.bossPattern.ultimate;
    enemy.defense = 0;
    forceAction(enemy, ultimate, 'ultimate', {
      state: 'ready',
      committed: { telegraphDamageTaken: 0 },
    });
    const committedAction = enemy._bossActionState.committedAction;

    CombatSystem._resolveDirectEnemyDamage(enemy, 100);

    expect(committedAction.telegraphDamageTaken).toBe(100);
    for (const state of ['executing', 'completed', 'cancelled']) {
      committedAction.state = state;
      CombatSystem._resolveDirectEnemyDamage(enemy, 1);
      expect(committedAction.telegraphDamageTaken).toBe(100);
    }
  });

  it('mother_feast는 자신이 소환한 살아 있는 좀비만 소비해 수만큼 회복·강화한다', () => {
    const { combat, enemy } = setupBoss('boss_horde_mother');
    expect(CombatSystem._summonEnemyById('zombie_common', 2, 'front', enemy)).toBe(2);
    const summoned = combat.enemies.slice(1);
    expect(summoned).toHaveLength(2);
    expect(summoned.every(entry => entry._summonedByEnemyId === enemy.id)).toBe(true);
    enemy.currentHp = enemy.maxHp - 100;
    combat.combatants['enemy:0'].hp = enemy.currentHp;
    forceAction(enemy, enemy.bossPattern.ultimate, 'ultimate');

    CombatSystem._runSingleEnemyTurn(0);

    expect(enemy.currentHp).toBe(enemy.maxHp - 60);
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'devoured_strength',
      effect: { outgoingDamageIncrease: 0.3 },
    }));
    expect(summoned.every(entry => entry.currentHp === 0 && entry._consumed === true))
      .toBe(true);
    expect(combat.formations.enemy).not.toContain('enemy:1');
    expect(combat.formations.enemy).not.toContain('enemy:2');
    expect(combat.turnQueue.some(entry => [1, 2].includes(entry.enemyIdx))).toBe(false);
  });

  it('mother_feast는 소환체 제거 뒤 현재 boss cursor와 원래 cyclic 다음 actor를 보존한다', () => {
    const { combat, enemy } = setupBoss('boss_horde_mother');
    expect(CombatSystem._summonEnemyById('zombie_common', 2, 'front', enemy)).toBe(2);
    expect(CombatSystem._summonEnemyById('zombie_common', 1, 'front')).toBe(1);
    const summoned = [combat.enemies[1], combat.enemies[2]];
    arrangeTurnQueue(
      combat,
      ['player', 'enemy:1', 'enemy:3', 'enemy:0', 'enemy:2'],
      'enemy:0',
    );
    const roundBefore = combat.roundNumber;
    forceAction(enemy, enemy.bossPattern.ultimate, 'ultimate');

    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.turnQueue.map(entry => entry.combatantId))
      .toEqual(['player', 'enemy:3', 'enemy:0']);
    expect(combat.activeIdx).toBe(2);
    expect(combat.activeTurnIndex).toBe(2);
    expect(combat.activeCombatantId).toBe('enemy:0');
    expect(summoned.every(entry => entry.currentHp === 0 && entry._consumed === true))
      .toBe(true);
    expect(combat.combatants['enemy:1']).toMatchObject({ hp: 0, dead: true });
    expect(combat.combatants['enemy:2']).toMatchObject({ hp: 0, dead: true });
    expect(combat.formations.enemy).not.toContain('enemy:1');
    expect(combat.formations.enemy).not.toContain('enemy:2');

    CombatSystem._advanceTurn(combat, GameState.npcs.states);
    CombatSystem._syncActiveTurnFromLegacy(combat);

    expect(combat.activeCombatantId).toBe('player');
    expect(combat.roundNumber).toBe(roundBefore + 1);
  });

  it('mother_feast는 소비할 소환 좀비가 없으면 회복과 강화를 전혀 얻지 않는다', () => {
    const { combat, enemy } = setupBoss('boss_horde_mother');
    enemy.currentHp = enemy.maxHp - 100;
    combat.combatants['enemy:0'].hp = enemy.currentHp;
    forceAction(enemy, enemy.bossPattern.ultimate, 'ultimate');

    CombatSystem._runSingleEnemyTurn(0);

    expect(enemy.currentHp).toBe(enemy.maxHp - 100);
    expect(enemy._statusEffects.map(status => status.id))
      .not.toContain('devoured_strength');
  });

  it.each([
    ['boss_raider_warlord', 'raider', 2, 'execution_order', 3],
    ['boss_feral_dog_alpha', 'rabid_dog', 3, 'alpha_hunt', 4],
  ])('%s 필살기는 살아 있는 %s 수를 발동 시점 타격 수에 반영한다', (
    bossId,
    minionId,
    minionCount,
    actionId,
    expectedHits,
  ) => {
    const { combat, enemy } = setupBoss(bossId);
    expect(CombatSystem._summonEnemyById(minionId, minionCount, 'front', enemy))
      .toBe(minionCount);
    const ultimate = enemy.bossPattern.ultimate;
    forceAction(enemy, ultimate, 'ultimate');
    combat.fxQueue = [];

    CombatSystem._runSingleEnemyTurn(0);

    expect(ultimate.hitCountRule).toMatchObject({
      type: 'livingMinions',
      enemyId: minionId,
      base: 1,
      perMinion: 1,
      min: 1,
      max: expectedHits,
    });
    expect(actionFxCount(actionId)).toBe(expectedHits);
  });

  it.each([
    ['boss_raider_warlord', 'execution_order'],
    ['boss_feral_dog_alpha', 'alpha_hunt'],
  ])('%s 필살기는 살아 있는 부하가 없으면 기본 1회만 타격한다', (bossId, actionId) => {
    const { combat, enemy } = setupBoss(bossId);
    forceAction(enemy, enemy.bossPattern.ultimate, 'ultimate');
    combat.fxQueue = [];

    CombatSystem._runSingleEnemyTurn(0);

    expect(actionFxCount(actionId)).toBe(1);
  });
});

describe('Finding B - source-aware 적/전장/무기 상태 소비', () => {
  it('ice_armor의 defenseIncrease는 ranked incoming damage를 실제로 줄인다', () => {
    const { combat, enemy } = setupBoss('boss_frozen_giant');
    enemy.defense = 0;
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');
    CombatSystem._runSingleEnemyTurn(0);
    const hpBefore = enemy.currentHp;

    damageBoss(enemy, 20);

    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'ice_armor',
      sourceEnemyId: enemy.id,
      remainingRounds: 3,
      effect: { defenseIncrease: 5 },
    }));
    expect(enemy.currentHp).toBe(hpBefore - 15);
    expect(combat.combatants['enemy:0'].hp).toBe(hpBefore - 15);
  });

  it('camouflage의 evasionIncrease는 ranked hit/dodge 판정에 참여한다', () => {
    const { combat, enemy } = setupBoss('boss_phantom_sniper');
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');
    CombatSystem._runSingleEnemyTurn(0);
    const actor = combat.combatants.player;
    const target = combat.combatants['enemy:0'];
    const skill = {
      id: 'accuracy_probe',
      accuracy: 1,
      target: { side: 'enemy' },
      effects: [{ type: 'damage', value: [1, 1] }],
    };

    const result = CombatSystem._resolveRankedHit(actor, target, skill, () => 0.75);

    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'camouflage',
      effect: { evasionIncrease: 0.5 },
    }));
    expect(result).toMatchObject({ hit: false, dodged: true });
  });

  it('finite invulnerable은 남은 round 동안만 피해를 막고 tick 후 만료된다', () => {
    const { enemy } = setupBoss('boss_sewer_king');
    enemy.defense = 0;
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');
    CombatSystem._runSingleEnemyTurn(0);
    const hpBefore = enemy.currentHp;

    damageBoss(enemy, 20);
    expect(enemy.currentHp).toBe(hpBefore);

    CombatSystem._tickStatusEffects();
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'submerged',
      remainingRounds: 1,
    }));
    CombatSystem._tickStatusEffects();
    expect(enemy._statusEffects.map(status => status.id)).not.toContain('submerged');

    damageBoss(enemy, 20);
    expect(enemy.currentHp).toBe(hpBefore - 20);
  });

  it('per-enemy DoT는 무적을 존중하고 로그에 실제 HP 피해 0을 기록한다', () => {
    const { combat, enemy } = setupBoss('boss_sewer_king');
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'invulnerable_dot_probe',
      name: '무적 DoT 시험',
      sourceEnemyId: 'player',
      remainingRounds: 2,
      effect: { hpLossPerRound: 10 },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'dot_invulnerable',
      name: 'DoT 무적',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { invulnerable: true },
    }, 0);
    const hpBefore = enemy.currentHp;
    const logBefore = combat.log.length;

    CombatSystem._tickStatusEffects();

    expect(enemy.currentHp).toBe(hpBefore);
    const statusLog = combat.log.slice(logBefore)
      .find(entry => entry.includes('무적 DoT 시험'));
    expect(statusLog).toContain('0');
  });

  it('per-enemy DoT는 base defense를 우회하고 감쇠·shield 뒤 실제 피해만 ready 창에 누적한다', () => {
    const { combat, enemy } = setupBoss('boss_radiation_colossus');
    enemy.defense = 99;
    forceAction(enemy, enemy.bossPattern.ultimate, 'ultimate', {
      state: 'ready',
      committed: { telegraphDamageTaken: 0 },
    });
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'reduced_dot_probe',
      name: '감쇠 DoT 시험',
      sourceEnemyId: 'player',
      remainingRounds: 2,
      effect: { hpLossPerRound: 20 },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'dot_reduction',
      name: 'DoT 감쇠',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { incomingDamageReduction: 0.25 },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'dot_shield',
      name: 'DoT 보호막',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { damageShield: 12 },
    }, 0);
    const hpBefore = enemy.currentHp;
    const logBefore = combat.log.length;

    CombatSystem._tickStatusEffects();

    expect(enemy.currentHp).toBe(hpBefore - 3);
    expect(enemy._statusEffects.map(status => status.id)).not.toContain('dot_shield');
    expect(enemy._bossActionState.committedAction.telegraphDamageTaken).toBe(3);
    expect(combat.combatants['enemy:0']).toMatchObject({
      hp: hpBefore - 3,
      dead: false,
    });
    expect(combat.combatants['enemy:0'].statusEffects).toEqual(enemy._statusEffects);
    const statusLog = combat.log.slice(logBefore)
      .find(entry => entry.includes('감쇠 DoT 시험'));
    expect(statusLog).toContain('3');
  });

  it('legacy enemyStatus DoT도 실제 HP 피해와 ranked death state를 동기화한다', () => {
    const { combat, enemy } = setupBoss('boss_sewer_king');
    enemy.defense = 99;
    enemy.currentHp = 5;
    combat.combatants['enemy:0'].hp = 5;
    combat.enemyStatus = [{
      id: 'legacy_dot_probe',
      name: 'legacy DoT 시험',
      duration: 1,
      effect: { hpLossPerRound: 10 },
    }];
    const logBefore = combat.log.length;

    CombatSystem._tickStatusEffects();

    expect(enemy.currentHp).toBe(0);
    expect(combat.combatants['enemy:0']).toMatchObject({ hp: 0, dead: true });
    const statusLog = combat.log.slice(logBefore)
      .find(entry => entry.includes('legacy DoT 시험'));
    expect(statusLog).toContain('5');
  });

  it('outgoingDamageIncrease는 enemy action 피해에 적용된다', () => {
    const { combat, enemy } = setupBoss('boss_horde_mother');
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'strength_probe',
      name: '강화 시험',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { outgoingDamageIncrease: 0.3 },
    }, 0);
    const action = enemy.bossPattern.basicAttacks[0];
    forceAction(enemy, action, 'basic');

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(474);
    expect(combat.fxQueue).toContainEqual(expect.objectContaining({
      actionId: action.id,
      dmg: 26,
    }));
  });

  it('같은 ID refresh는 더 강한 magnitude와 더 긴 remainingRounds를 약화시키지 않는다', () => {
    const { enemy } = setupBoss('boss_frozen_giant');
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'refresh_probe',
      name: '갱신 시험',
      sourceEnemyId: 'strong_source',
      remainingRounds: 3,
      effect: { defenseIncrease: 5 },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'refresh_probe',
      name: '갱신 시험',
      sourceEnemyId: 'weak_source',
      remainingRounds: 1,
      effect: { defenseIncrease: 2 },
    }, 0);

    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'refresh_probe',
      sourceEnemyId: 'strong_source',
      remainingRounds: 3,
      effect: { defenseIncrease: 5 },
    }));

    CombatSystem._tickStatusEffects();
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'refresh_probe',
      remainingRounds: 2,
    }));
  });

  it('fallout_zone은 source와 remainingRounds를 보존하고 라운드마다 방사선을 한 번 적용한다', () => {
    const { combat, enemy } = setupBoss('boss_radiation_colossus');
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');
    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.battlefieldStatuses).toContainEqual(expect.objectContaining({
      id: 'fallout_zone',
      sourceEnemyId: enemy.id,
      remainingRounds: 3,
      effect: { radiationPerTurn: 8 },
    }));

    CombatSystem._onRoundStart(combat);

    expect(GameState.stats.radiation.current).toBe(8);
    expect(combat.battlefieldStatuses).toContainEqual(expect.objectContaining({
      id: 'fallout_zone',
      remainingRounds: 2,
    }));
  });

  it.each([
    ['boss_acid_queen', 'acid_pool', 6],
    ['boss_chef_nemesis', 'boiling_oil', 5],
  ])('%s의 %s은 라운드마다 모든 아군에게 선언 피해를 한 번 적용한다', (
    bossId,
    statusId,
    damage,
  ) => {
    const { combat, enemy } = setupBoss(bossId, {
      companionIds: ['npc_nurse'],
    });
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');
    CombatSystem._runSingleEnemyTurn(0);
    const playerHpBeforeRound = GameState.player.hp.current;
    const companionHpBeforeRound = GameState.npcs.states.npc_nurse.hp;

    CombatSystem._onRoundStart(combat);

    expect(GameState.player.hp.current).toBe(playerHpBeforeRound - damage);
    expect(GameState.npcs.states.npc_nurse.hp).toBe(companionHpBeforeRound - damage);
    expect(combat.battlefieldStatuses).toContainEqual(expect.objectContaining({
      id: statusId,
      remainingRounds: 2,
    }));
  });

  it('battlefield status payload는 라운드마다 아군에게 적용되고 만료된다', () => {
    const { combat, enemy } = setupBoss('boss_acid_queen');
    CombatSystem._addBattlefieldStatus({
      id: 'status_field_probe',
      name: '상태 장판 시험',
      sourceEnemyId: enemy.id,
      remainingRounds: 1,
      effect: {
        status: {
          id: 'field_slow',
          name: '둔화',
          duration: 1,
          effect: { speedPenalty: 1 },
        },
      },
    });

    CombatSystem._onRoundStart(combat);

    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'field_slow',
    }));
    expect(combat.battlefieldStatuses.map(status => status.id))
      .not.toContain('status_field_probe');
  });

  it('weapon freeze는 tagged ranked skill을 막고 정상 오류를 남긴 뒤 player action 두 번에 만료된다', () => {
    const { combat, enemy } = setupBoss('boss_blizzard_wraith');
    const weaponId = addCombatItem('baseball_bat', 1);
    GameState.player.equipped.weapon_main = weaponId;
    const weaponSkill = buildEquipmentSkill(
      weaponId,
      GameState.getCardDef(weaponId),
    );
    combat.skillsById[weaponSkill.id] = weaponSkill;
    combat.combatants.player.skillIds.push(weaponSkill.id);
    forceAction(enemy, enemy.bossPattern.basicAttacks[0], 'basic');
    CombatSystem._runSingleEnemyTurn(0);

    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      sourceEnemyId: enemy.id,
      remainingPlayerTurns: 2,
      effect: { weaponLock: 'weapon' },
    }));
    expect(CombatSystem.selectSkill(weaponSkill.id)).toBe(false);
    expect(combat.lastActionFailure).toBe('weapon_locked');
    expect(combat.log.at(-1)).toContain('동결');

    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});
    CombatSystem.resolveAction('guard');
    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      effect: { weaponLock: 'weapon' },
      remainingPlayerTurns: 1,
    }));
    CombatSystem.resolveAction('guard');
    expect(combat.playerStatus.some(status => status.effect?.weaponLock)).toBe(false);
    combat.phase = 'await_ally_input';
    expect(CombatSystem.selectSkill(weaponSkill.id)).toBe(true);
  });

  it('source-aware enemy, battlefield, weapon 상태는 save/load 뒤 수명과 효과를 보존한다', () => {
    const { enemy } = setupBoss('boss_blizzard_wraith');
    forceAction(enemy, enemy.bossPattern.basicAttacks[0], 'basic');
    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'save_enemy_status',
      sourceEnemyId: enemy.id,
      remainingRounds: 3,
      effect: { defenseIncrease: 4 },
    }, 0);
    CombatSystem._addBattlefieldStatus({
      id: 'save_battlefield_status',
      sourceEnemyId: enemy.id,
      remainingRounds: 3,
      effect: { radiationPerTurn: 7 },
    });

    GameState.ui.currentState = 'main';
    GameState.deserialize(GameState.serialize());
    const restoredCombat = GameState.combat;
    const restoredEnemy = restoredCombat.enemies[0];

    expect(restoredEnemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'save_enemy_status',
      sourceEnemyId: enemy.id,
      remainingRounds: 3,
      effect: { defenseIncrease: 4 },
    }));
    expect(restoredCombat.battlefieldStatuses).toContainEqual(expect.objectContaining({
      id: 'save_battlefield_status',
      sourceEnemyId: enemy.id,
      remainingRounds: 3,
      effect: { radiationPerTurn: 7 },
    }));
    expect(restoredCombat.playerStatus).toContainEqual(expect.objectContaining({
      sourceEnemyId: enemy.id,
      remainingPlayerTurns: 2,
      effect: { weaponLock: 'weapon' },
    }));
  });
  it('라운드 마지막에 적용된 duration 1 selfStatus도 다음 라운드 대응 전에는 만료되지 않는다', () => {
    const { combat, enemy } = setupBoss('boss_sewer_king');
    arrangeTurnQueue(combat, ['player', 'enemy:0'], 'enemy:0');
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem.advanceTurn();

    expect(combat.activeCombatantId).toBe('player');
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'submerged',
      remainingRounds: 1,
      effect: { invulnerable: true },
    }));

    CombatSystem._tickStatusEffects();
    expect(enemy._statusEffects.map(status => status.id)).not.toContain('submerged');
  });

  it('legacy 순서에서 duration 1 selfStatus는 다음 player action 하나만 막고 만료한다', () => {
    const { combat, enemy } = setupBoss('boss_sewer_king');
    enemy.defense = 0;
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');

    CombatSystem.resolveAction('guard');

    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'submerged',
      remainingRounds: 1,
    }));
    const hpBefore = enemy.currentHp;
    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});

    CombatSystem.resolveAction('melee');

    expect(enemy.currentHp).toBe(hpBefore);
    expect(enemy._statusEffects.map(status => status.id)).not.toContain('submerged');

    CombatSystem.resolveAction('melee');
    expect(enemy.currentHp).toBeLessThan(hpBefore);
  });

  it('ranked enemy 뒤 ally action이 남으면 selfStatus tick을 추가 유예하지 않는다', () => {
    const { combat, enemy } = setupBoss('boss_sewer_king', {
      companionIds: ['npc_nurse'],
    });
    arrangeTurnQueue(combat, ['player', 'enemy:0', 'npc_nurse'], 'enemy:0');
    forceAction(enemy, enemy.bossPattern.specialSkill, 'special');

    CombatSystem._runSingleEnemyTurn(0);
    CombatSystem.advanceTurn();

    expect(combat.activeCombatantId).toBe('npc_nurse');
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'submerged',
      remainingRounds: 1,
    }));

    CombatSystem.advanceTurn();

    expect(enemy._statusEffects.map(status => status.id)).not.toContain('submerged');
  });

  it('같은 ID라도 source가 다르면 약한 상태가 강한 상태의 효과나 수명을 오염시키지 않는다', () => {
    const { enemy } = setupBoss('boss_frozen_giant');
    enemy.defense = 0;
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'source_probe',
      sourceEnemyId: 'strong_source',
      remainingRounds: 1,
      effect: { defenseIncrease: 5 },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'source_probe',
      sourceEnemyId: 'weak_source',
      remainingRounds: 9,
      effect: { defenseIncrease: 2 },
    }, 0);

    expect(enemy._statusEffects.filter(status => status.id === 'source_probe'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({
          sourceEnemyId: 'strong_source',
          remainingRounds: 1,
          effect: { defenseIncrease: 5 },
        }),
        expect.objectContaining({
          sourceEnemyId: 'weak_source',
          remainingRounds: 9,
          effect: { defenseIncrease: 2 },
        }),
      ]));

    const hpBefore = enemy.currentHp;
    damageBoss(enemy, 20);
    expect(enemy.currentHp).toBe(hpBefore - 15);
  });

  it('다른 source의 긴 보조 메타데이터가 강한 치료 방해 source를 교체하지 않는다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    activateHungerDomination(enemy);
    const weakSource = {
      id: 'long_weak_source',
      currentHp: 100,
      maxHp: 100,
      _statusEffects: [],
    };
    combat.enemies.push(weakSource);
    CombatSystem._addBattlefieldStatus({
      id: 'hunger_domination',
      sourceEnemyId: weakSource.id,
      remainingPlayerTurns: 9,
      effect: {
        healingReduction: 0.25,
        guardedHealingReduction: 0.1,
        preventedHealingShieldConversion: 0.5,
        shieldDurationRounds: 4,
      },
    });

    const result = CombatSystem._healCombatant(combat.combatants.player, 20);

    expect(result).toMatchObject({
      multiplier: 0.5,
      interferenceSourceEnemyId: enemy.id,
    });
    expect(combat.battlefieldStatuses.filter(status => status.id === 'hunger_domination'))
      .toHaveLength(2);
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'hunger_domination_shield',
      remainingRounds: 2,
      effect: { damageShield: 5 },
    }));
    expect(weakSource._statusEffects).toEqual([]);
  });

  it('legacy direct 공격도 typed 무적과 피해 보호막을 소비한다', () => {
    const { enemy } = setupBoss('boss_sewer_king');
    enemy.defense = 0;
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'direct_invulnerable',
      sourceEnemyId: enemy.id,
      remainingRounds: 1,
      effect: { invulnerable: true },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'direct_shield',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { damageShield: 99 },
    }, 0);
    const hpBefore = enemy.currentHp;

    CombatSystem._attackAction('melee', null, enemy);
    expect(enemy.currentHp).toBe(hpBefore);
    expect(enemy._statusEffects.find(status => status.id === 'direct_shield')
      ?.effect.damageShield).toBe(99);

    enemy._statusEffects = enemy._statusEffects.filter(status => (
      status.id !== 'direct_invulnerable'
    ));
    CombatSystem._attackAction('melee', null, enemy);

    expect(enemy.currentHp).toBe(hpBefore);
    expect(enemy._statusEffects.find(status => status.id === 'direct_shield')
      ?.effect.damageShield).toBeLessThan(99);
  });

  it('legacy direct 공격도 typed defenseIncrease를 최종 방어 계산에 반영한다', () => {
    const { enemy } = setupBoss('boss_frozen_giant');
    enemy.defense = 0;
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'direct_defense',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { defenseIncrease: 2 },
    }, 0);
    const hpBefore = enemy.currentHp;

    CombatSystem._attackAction('melee', null, enemy);

    expect(hpBefore - enemy.currentHp).toBe(1);
  });

  it('legacy direct 장비 공격도 weaponLock에서 정상 validation 실패한다', () => {
    const { combat, enemy } = setupBoss('boss_blizzard_wraith');
    const weaponId = addCombatItem('baseball_bat', 1);
    GameState.player.equipped.weapon_main = weaponId;
    CombatSystem._addAllyStatus('player', {
      id: 'direct_weapon_lock',
      sourceEnemyId: enemy.id,
      remainingPlayerTurns: 2,
      effect: { weaponLock: 'weapon' },
    });
    const hpBefore = enemy.currentHp;
    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});

    const result = CombatSystem.resolveAction('melee', weaponId);

    expect(result).toBe(false);
    expect(combat.lastActionFailure).toBe('weapon_locked');
    expect(combat.log.at(-1)).toContain('동결');
    expect(enemy.currentHp).toBe(hpBefore);
    expect(combat.playerStatus).toContainEqual(expect.objectContaining({
      id: 'direct_weapon_lock',
      remainingPlayerTurns: 2,
    }));
  });

  it('throwable AoE도 typed 무적과 피해 보호막을 공통 피해 경계에서 소비한다', () => {
    const { enemy } = setupBoss('boss_sewer_king');
    const throwableId = addCombatItem('molotov_cocktail', 1);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'throwable_invulnerable',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { invulnerable: true },
    }, 0);
    CombatSystem._applyEnemyStatusInflict(enemy, {
      id: 'throwable_shield',
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { damageShield: 99 },
    }, 0);
    const hpBefore = enemy.currentHp;

    throwableAction(throwableId, CombatSystem);

    expect(enemy.currentHp).toBe(hpBefore);
    expect(enemy._statusEffects.find(status => status.id === 'throwable_shield')
      ?.effect.damageShield).toBe(99);
  });

  it('legacy direct throwable도 weaponLock에서 아이템 소비 전 validation 실패한다', () => {
    const { combat, enemy } = setupBoss('boss_blizzard_wraith');
    const throwableId = addCombatItem('molotov_cocktail', 1);
    CombatSystem._addAllyStatus('player', {
      id: 'throwable_weapon_lock',
      sourceEnemyId: enemy.id,
      remainingPlayerTurns: 2,
      effect: { weaponLock: 'weapon' },
    });
    const cardBefore = structuredClone(GameState.cards[throwableId]);
    const hpBefore = enemy.currentHp;

    const result = CombatSystem.resolveAction('throwable', throwableId);

    expect(result).toBe(false);
    expect(combat.lastActionFailure).toBe('weapon_locked');
    expect(GameState.cards[throwableId]).toEqual(cardBefore);
    expect(enemy.currentHp).toBe(hpBefore);
  });

  it('multiTarget 추가 대상도 대상별 typed 무적과 피해 보호막을 소비한다', () => {
    const { combat, enemy } = setupBoss('boss_raider_warlord');
    expect(CombatSystem._summonEnemyById('raider', 1, 'front', enemy)).toBe(1);
    const extra = combat.enemies[1];
    CombatSystem._applyEnemyStatusInflict(extra, {
      id: 'splash_invulnerable',
      sourceEnemyId: extra.id,
      remainingRounds: 2,
      effect: { invulnerable: true },
    }, 1);
    CombatSystem._applyEnemyStatusInflict(extra, {
      id: 'splash_shield',
      sourceEnemyId: extra.id,
      remainingRounds: 2,
      effect: { damageShield: 99 },
    }, 1);
    const hpBefore = extra.currentHp;

    applyMultiTarget(20, { multiTarget: 2 }, 0, CombatSystem, false);

    expect(extra.currentHp).toBe(hpBefore);
    expect(extra._statusEffects.find(status => status.id === 'splash_shield')
      ?.effect.damageShield).toBe(99);
  });
});

describe('Finding C - hunger_domination 치료 간섭', () => {
  it('item heal은 가장 강한 battlefield 배율을 쓰고 차단량 일부를 source shield로 전환한다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    const itemId = addCombatItem('first_aid_kit');
    combat._identityFirstMedicalUsed = true;
    const cardBefore = structuredClone(GameState.cards[itemId]);
    const effect = activateHungerDomination(enemy);
    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});

    CombatSystem.resolveAction('useItem', itemId);

    expect(effect).toMatchObject({
      id: 'hunger_domination',
      sourceEnemyId: enemy.id,
      remainingPlayerTurns: 1,
      effect: {
        healingReduction: 0.5,
        guardedHealingReduction: 0.25,
        preventedHealingShieldConversion: 0.5,
        shieldDurationRounds: 2,
      },
    });
    expect(GameState.player.hp.current).toBe(65);
    expect(GameState.cards[itemId]).toMatchObject({
      quantity: cardBefore.quantity - 1,
      contamination: cardBefore.contamination,
    });
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'hunger_domination_shield',
      remainingRounds: 2,
      effect: { damageShield: 12 },
    }));
  });

  it('turn을 소비하지 않는 ranked item heal은 미래 round tick을 추가 유예하지 않는다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    const itemId = addCombatItem('bandage');
    activateHungerDomination(enemy);
    arrangeTurnQueue(combat, ['enemy:0', 'player'], 'player');

    const result = CombatSystem.useCombatItem(itemId);

    expect(result).toMatchObject({ ok: true, turnConsumed: false });
    const shield = enemy._statusEffects.find(status => (
      status.id === 'hunger_domination_shield'
    ));
    expect(shield).toMatchObject({
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
    });

    CombatSystem.advanceTurn();

    expect(shield.remainingRounds).toBe(1);
  });

  it('player heal skill은 50% 간섭을 받고 성공한 player command 뒤 수명을 한 번 줄인다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    activateHungerDomination(enemy);
    vi.spyOn(CombatSystem, 'advanceTurn').mockReturnValue(true);
    vi.spyOn(CombatSystem, 'processUntilAllyTurn').mockReturnValue(true);
    expect(CombatSystem.selectSkill('doctor_triage')).toBe(true);
    expect(CombatSystem.selectTarget('player')).toBe(true);

    const result = CombatSystem.confirmAction();

    expect(result.ok).toBe(true);
    expect(GameState.player.hp.current).toBe(44);
    expect(combat.battlefieldStatuses).toContainEqual(expect.objectContaining({
      id: 'hunger_domination',
      remainingPlayerTurns: 1,
    }));
  });

  it.each([
    ['healer가 wrap 직전인 경우', ['enemy:0', 'player'], true],
    ['healer 뒤 living ally가 남는 경우', ['enemy:0', 'player', 'npc_nurse'], false],
  ])('ranked heal shield는 %s에도 선언된 두 round 기회를 보존한다', (
    _label,
    queueIds,
    wrapsImmediately,
  ) => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
      companionIds: ['npc_nurse'],
    });
    activateHungerDomination(enemy);
    arrangeTurnQueue(combat, queueIds, 'player');
    vi.spyOn(CombatSystem, 'processUntilAllyTurn').mockReturnValue(true);
    expect(CombatSystem.selectSkill('doctor_triage')).toBe(true);
    expect(CombatSystem.selectTarget('player')).toBe(true);

    const result = CombatSystem.confirmAction();

    expect(result.ok).toBe(true);
    const shield = enemy._statusEffects.find(status => (
      status.id === 'hunger_domination_shield'
    ));
    expect(shield).toMatchObject({
      sourceEnemyId: enemy.id,
      remainingRounds: 2,
      effect: { damageShield: 2 },
    });
    if (!wrapsImmediately) {
      expect(combat.activeCombatantId).toBe('npc_nurse');
      CombatSystem.advanceTurn();
      expect(shield.remainingRounds).toBe(1);
    }
  });

  it('companion heal도 같은 배율을 쓰지만 player-turn 수명은 줄이지 않는다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
      companionIds: ['npc_nurse'],
    });
    activateHungerDomination(enemy, ['player', 'npc_nurse']);
    const companionQueueIndex = combat.turnQueue.findIndex(entry => (
      entry.type === 'companion' && entry.id === 'npc_nurse'
    ));
    combat.activeIdx = companionQueueIndex;
    CombatSystem.beginActiveTurn();
    vi.spyOn(CombatSystem, 'advanceTurn').mockReturnValue(true);
    vi.spyOn(CombatSystem, 'processUntilAllyTurn').mockReturnValue(true);
    expect(CombatSystem.selectSkill('nurse_triage')).toBe(true);
    expect(CombatSystem.selectTarget('player')).toBe(true);

    const result = CombatSystem.confirmAction();

    expect(result.ok).toBe(true);
    expect(GameState.player.hp.current).toBe(44);
    expect(combat.battlefieldStatuses).toContainEqual(expect.objectContaining({
      id: 'hunger_domination',
      remainingPlayerTurns: 2,
    }));
  });

  it('guarded target은 50% 대신 25%만 감소하고 death door 최소 회복을 유지한다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 1,
      playerMaxHp: 100,
    });
    activateHungerDomination(enemy);
    const player = combat.combatants.player;
    player.hp = 0;
    player.dead = false;
    player.deathsDoor = true;
    GameState.player.hp.current = 0;
    combat.playerGuard = { active: true, damageReduce: 0.5 };

    const result = CombatSystem._healCombatant(player, 1);

    expect(result).toMatchObject({
      multiplier: 0.75,
      healed: 1,
      deathsDoorCleared: true,
      interferenceSourceEnemyId: enemy.id,
    });
    expect(GameState.player.hp.current).toBe(1);
  });

  it('나중의 약한 source는 강한 source를 덮지 않고 차단 shield도 강한 source에만 준다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
    });
    activateHungerDomination(enemy);
    const weakSource = {
      id: 'weaker_healing_blocker',
      currentHp: 100,
      maxHp: 100,
      _statusEffects: [],
    };
    combat.enemies.push(weakSource);
    CombatSystem._addBattlefieldStatus({
      id: 'hunger_domination',
      name: '약한 치료 간섭',
      sourceEnemyId: weakSource.id,
      remainingPlayerTurns: 2,
      effect: {
        healingReduction: 0.25,
        guardedHealingReduction: 0.1,
        preventedHealingShieldConversion: 0.5,
        shieldDurationRounds: 2,
      },
    });

    const result = CombatSystem._healCombatant(combat.combatants.player, 20);

    expect(result).toMatchObject({
      multiplier: 0.5,
      prevented: 10,
      interferenceSourceEnemyId: enemy.id,
    });
    expect(enemy._statusEffects).toContainEqual(expect.objectContaining({
      id: 'hunger_domination_shield',
      effect: { damageShield: 5 },
    }));
    expect(weakSource._statusEffects).toEqual([]);
  });

  it('정확히 두 번의 player action 뒤 만료하며 item/companion/automatic heal은 별도 수명을 깎지 않는다', () => {
    const { combat, enemy } = setupBoss('food_warlord', {
      playerHp: 40,
      playerMaxHp: 100,
      companionIds: ['npc_nurse'],
    });
    const effect = activateHungerDomination(enemy, ['player', 'npc_nurse']);
    const itemId = addCombatItem('bandage');

    CombatSystem.useCombatItem(itemId);
    CombatSystem._healCombatant(combat.combatants.player, 2);
    expect(effect.remainingPlayerTurns).toBe(2);

    vi.spyOn(CombatSystem, '_allEnemiesAttack').mockImplementation(() => {});
    CombatSystem.resolveAction('guard');
    expect(effect.remainingPlayerTurns).toBe(1);
    CombatSystem.resolveAction('guard');
    expect(combat.battlefieldStatuses.map(status => status.id))
      .not.toContain('hunger_domination');
  });
});
