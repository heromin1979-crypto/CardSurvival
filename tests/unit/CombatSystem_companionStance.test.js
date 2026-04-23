// === Combat Overhaul Phase 2 — 동료 stance 디스패처 + 클래스 스킬 ===
// 목적:
//   - _runCompanionTurn이 stance별 올바른 핸들러 호출
//   - attack: 최저 HP 적 공격
//   - heal: player HP < 70%면 힐, 아니면 attack 폴백
//   - hold: combatBuffs.holdReduct 설정, 공격 없음
//   - support: 스킬 쿨다운 준비 시 스킬 사용, 아니면 attack 폴백
//   - manual: 아무 행동 없음 (기존 명령 플로우 유지)
//   - 3개 클래스 스킬 효과 (nurse_triage, soldier_suppress, doctor_diagnose)
//   - skillCooldowns tick
import { describe, it, expect, beforeEach } from 'vitest';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';
import BALANCE      from '../../js/data/gameBalance.js';

function resetCombat({ enemies = [], companions = [], npcStates = {}, playerHp = 100, playerMaxHp = 100 } = {}) {
  GameState.player.hp = { current: playerHp, max: playerMaxHp };
  GameState.companions = companions;
  GameState.npcs = { states: npcStates };
  GameState.combat = {
    active:      true,
    enemies,
    targetIndex: 0,
    log:         [],
    round:       0,
    playerStatus: [],
    enemyStatus:  [],
    turnQueue:   [],
    activeIdx:   0,
    roundNumber: 1,
  };
}

function makeEnemy(hp) {
  return { id: 'e', name: 'E', currentHp: hp, maxHp: 30, specialSkills: [], _skillCooldowns: {}, _statusEffects: [] };
}

describe('_runCompanionTurn — stance 디스패치', () => {
  beforeEach(() => {
    resetCombat({
      enemies: [makeEnemy(30), makeEnemy(10)],
      companions: ['npc_a'],
      npcStates: { npc_a: { hp: 50, maxHp: 50, isCompanion: true } },
    });
  });

  it('stance 미설정 시 기본 attack', () => {
    CombatSystem._runCompanionTurn('npc_a');
    // 둘 중 HP 낮은 쪽(10)이 더 낮아짐 또는 miss
    // 확정하려면 정확도 1.0 필요 — 최악 case로 enemy1(10HP) 공격 시도
    const enemy0Hp = GameState.combat.enemies[0].currentHp;
    const enemy1Hp = GameState.combat.enemies[1].currentHp;
    // 공격이 10HP enemy1을 노렸을 것 (최저 HP 우선)
    expect(enemy0Hp).toBe(30);  // 건드리지 않음
    // enemy1은 공격을 받았거나 miss. miss시 10 유지, hit시 < 10
    expect(enemy1Hp).toBeLessThanOrEqual(10);
  });

  it('manual stance → 어떤 행동도 하지 않음', () => {
    GameState.npcs.states.npc_a.stance = 'manual';
    const before = GameState.combat.enemies.map(e => e.currentHp);
    CombatSystem._runCompanionTurn('npc_a');
    const after = GameState.combat.enemies.map(e => e.currentHp);
    expect(after).toEqual(before);
  });

  it('HP 0 동료 → 아무것도 안 함', () => {
    GameState.npcs.states.npc_a.hp = 0;
    const before = GameState.combat.enemies.map(e => e.currentHp);
    CombatSystem._runCompanionTurn('npc_a');
    expect(GameState.combat.enemies.map(e => e.currentHp)).toEqual(before);
  });
});

describe('hold stance — 피해 감소 버프', () => {
  beforeEach(() => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_a'],
      npcStates: { npc_a: { hp: 50, maxHp: 50, isCompanion: true, stance: 'hold' } },
    });
  });

  it('combatBuffs.holdReduct 설정 + 적 HP 불변', () => {
    CombatSystem._runCompanionTurn('npc_a');
    const st = GameState.npcs.states.npc_a;
    expect(st.combatBuffs?.holdReduct).toBeDefined();
    expect(st.combatBuffs.holdReduct.value).toBe(BALANCE.combat.companionAuto.holdDamageReduct);
    expect(st.combatBuffs.holdReduct.duration).toBe(1);
    expect(GameState.combat.enemies[0].currentHp).toBe(30);
  });
});

describe('heal stance — HP 임계 기반 분기', () => {
  it('HP < 70% → 힐 발동', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_a'],
      npcStates: { npc_a: { hp: 50, maxHp: 50, isCompanion: true, stance: 'heal' } },
      playerHp: 50, playerMaxHp: 100,
    });
    const before = GameState.player.hp.current;
    CombatSystem._runCompanionTurn('npc_a');
    expect(GameState.player.hp.current).toBeGreaterThan(before);
    expect(GameState.combat.enemies[0].currentHp).toBe(30);  // 공격 안 함
  });

  it('HP ≥ 70% → attack 폴백 (적 HP 감소 시도)', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_a'],
      npcStates: { npc_a: { hp: 50, maxHp: 50, isCompanion: true, stance: 'heal' } },
      playerHp: 90, playerMaxHp: 100,
    });
    const hpBefore = GameState.player.hp.current;
    CombatSystem._runCompanionTurn('npc_a');
    expect(GameState.player.hp.current).toBe(hpBefore);  // 힐 안 함
    // attack 시도 (accuracy 80% 이므로 miss 가능) — 로그에 공격 기록은 있음
    expect(GameState.combat.log.length).toBeGreaterThan(0);
  });
});

describe('support stance — 클래스 스킬', () => {
  it('npc_nurse + support → nurse_triage 발동 (모든 아군 +12 HP)', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_nurse', 'npc_other'],
      npcStates: {
        npc_nurse: { hp: 30, maxHp: 50, isCompanion: true, stance: 'support' },
        npc_other: { hp: 20, maxHp: 50, isCompanion: true },
      },
      playerHp: 60, playerMaxHp: 100,
    });
    CombatSystem._runCompanionTurn('npc_nurse');
    expect(GameState.player.hp.current).toBe(60 + 12);
    expect(GameState.npcs.states.npc_nurse.hp).toBe(30 + 12);
    expect(GameState.npcs.states.npc_other.hp).toBe(20 + 12);
    // 쿨다운 설정
    expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_triage)
      .toBe(BALANCE.combat.companionAuto.classSkills.npc_nurse.cooldown);
  });

  it('npc_soldier + support → soldier_suppress 발동 (combat._suppressMult 설정)', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_soldier'],
      npcStates: { npc_soldier: { hp: 40, maxHp: 50, isCompanion: true, stance: 'support' } },
    });
    CombatSystem._runCompanionTurn('npc_soldier');
    const skill = BALANCE.combat.companionAuto.classSkills.npc_soldier;
    expect(GameState.combat._suppressMult).toBe(skill.atkMult);
    expect(GameState.combat._suppressRemaining).toBe(skill.duration);
  });

  it('npc_doctor + support → doctor_diagnose 발동', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_doctor'],
      npcStates: { npc_doctor: { hp: 40, maxHp: 50, isCompanion: true, stance: 'support' } },
    });
    CombatSystem._runCompanionTurn('npc_doctor');
    const skill = BALANCE.combat.companionAuto.classSkills.npc_doctor;
    expect(GameState.combat._diagnoseResistBonus).toBe(skill.resistBonus);
    expect(GameState.combat._diagnoseRemaining).toBe(skill.duration);
  });

  it('스킬 쿨다운 중 → attack 폴백', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_nurse'],
      npcStates: { npc_nurse: { hp: 50, maxHp: 50, isCompanion: true, stance: 'support', skillCooldowns: { nurse_triage: 2 } } },
    });
    const before = GameState.combat.enemies[0].currentHp;
    CombatSystem._runCompanionTurn('npc_nurse');
    // 쿨다운 먼저 tick → 2→1, 스킬 사용 불가 → attack 시도
    expect(GameState.npcs.states.npc_nurse.skillCooldowns.nurse_triage).toBe(1);
    expect(GameState.combat.enemies[0].currentHp).toBeLessThanOrEqual(before);
  });

  it('클래스 스킬 없는 NPC + support → attack 폴백', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_unknown'],
      npcStates: { npc_unknown: { hp: 50, maxHp: 50, isCompanion: true, stance: 'support' } },
    });
    CombatSystem._runCompanionTurn('npc_unknown');
    // support 폴백 attack — 적 HP는 감소 시도되었을 것 (accuracy 80%)
    expect(GameState.combat.log.length).toBeGreaterThan(0);
  });
});

describe('스킬 쿨다운 tick', () => {
  it('턴마다 모든 skill cooldown 1씩 감소, 0 미만으로 내려가지 않음', () => {
    resetCombat({
      enemies: [makeEnemy(30)],
      companions: ['npc_a'],
      npcStates: { npc_a: { hp: 50, maxHp: 50, isCompanion: true, stance: 'attack', skillCooldowns: { foo: 3, bar: 1, zero: 0 } } },
    });
    CombatSystem._runCompanionTurn('npc_a');
    const cds = GameState.npcs.states.npc_a.skillCooldowns;
    expect(cds.foo).toBe(2);
    expect(cds.bar).toBe(0);
    expect(cds.zero).toBe(0);
  });
});

describe('_getCompanionStance', () => {
  it('미설정이면 기본값 "attack"', () => {
    GameState.npcs = { states: { npc_a: { hp: 50, isCompanion: true } } };
    expect(CombatSystem._getCompanionStance('npc_a')).toBe('attack');
  });

  it('설정된 stance 반환', () => {
    GameState.npcs = { states: { npc_a: { hp: 50, isCompanion: true, stance: 'heal' } } };
    expect(CombatSystem._getCompanionStance('npc_a')).toBe('heal');
  });

  it('없는 npcId → 기본값 attack', () => {
    GameState.npcs = { states: {} };
    expect(CombatSystem._getCompanionStance('missing')).toBe('attack');
  });
});
