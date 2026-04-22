// === HospitalSiegeSystem × 의사 대피 미니게임 — W3-3 ===
// 검증:
//  1) calculateEvacuationScore — 조합별 점수 계산
//  2) getEvacuationOutcome — threshold 경계 분기
//  3) _countTrustedNpcs — NPCSystem 구조 의존
//  4) partial_victory outcome 처리 — 환자 사망 0, 사기 +5, 구조물 피해 ×0.5
//  5) partial_victory 이벤트 발행 (hospitalDamaged partialVictory=true)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HospitalSiegeSystem from '../../js/systems/HospitalSiegeSystem.js';
import GameState           from '../../js/core/GameState.js';
import EventBus            from '../../js/core/EventBus.js';
import BALANCE             from '../../js/data/gameBalance.js';

function resetState() {
  GameState.flags = GameState.flags ?? {};
  GameState.flags.siegeWinStreak = 0;
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0.2 };
  GameState.npcs = null;
}

describe('calculateEvacuationScore', () => {
  const { baseScore, stageWeights, skillMult, trustMult } = BALANCE.hospitalSiege.doctorEvacuation;

  it('최악 조합 A+C·skill 0·trust 0 → baseScore + 8 + 5 = 13', () => {
    const score = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'C', medicineLevel: 0, trustedNpcCount: 0,
    });
    expect(score).toBe(baseScore + stageWeights.stage1.A + stageWeights.stage2.C);
  });

  it('최상 조합 A+D·skill 0·trust 0 → baseScore + 8 + 8 = 16', () => {
    const score = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: 0, trustedNpcCount: 0,
    });
    expect(score).toBe(baseScore + stageWeights.stage1.A + stageWeights.stage2.D);
  });

  it('medicine skill 보너스가 skillMult만큼 가산된다', () => {
    const base  = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: 0, trustedNpcCount: 0,
    });
    const skill = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: 3, trustedNpcCount: 0,
    });
    expect(skill - base).toBe(3 * skillMult);
  });

  it('신뢰 NPC 보너스가 trustMult만큼 가산된다', () => {
    const base  = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: 0, trustedNpcCount: 0,
    });
    const trust = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: 0, trustedNpcCount: 2,
    });
    expect(trust - base).toBe(2 * trustMult);
  });

  it('음수 스킬/신뢰는 0으로 클램프', () => {
    const neg = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: -5, trustedNpcCount: -3,
    });
    const zero = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'A', choice2: 'D', medicineLevel: 0, trustedNpcCount: 0,
    });
    expect(neg).toBe(zero);
  });

  it('잘못된 choice 키는 0 가중치', () => {
    const score = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: 'X', choice2: 'Y', medicineLevel: 0, trustedNpcCount: 0,
    });
    expect(score).toBe(baseScore);
  });

  it('인자 없이 호출 시 baseScore 반환 (안전가드)', () => {
    expect(HospitalSiegeSystem.calculateEvacuationScore()).toBe(baseScore);
  });
});

describe('getEvacuationOutcome — threshold 분기', () => {
  const { threshold } = BALANCE.hospitalSiege.doctorEvacuation;

  it('score ≥ threshold → partial_victory', () => {
    expect(HospitalSiegeSystem.getEvacuationOutcome(threshold)).toBe('partial_victory');
    expect(HospitalSiegeSystem.getEvacuationOutcome(threshold + 10)).toBe('partial_victory');
  });

  it('score < threshold → defeat', () => {
    expect(HospitalSiegeSystem.getEvacuationOutcome(threshold - 1)).toBe('defeat');
    expect(HospitalSiegeSystem.getEvacuationOutcome(0)).toBe('defeat');
  });
});

describe('_countTrustedNpcs', () => {
  beforeEach(resetState);

  it('npcs 없으면 0', () => {
    GameState.npcs = null;
    expect(HospitalSiegeSystem._countTrustedNpcs()).toBe(0);
  });

  it('recruited + trust ≥ 1 NPC 수를 반환', () => {
    GameState.npcs = {
      recruited: ['a', 'b', 'c'],
      trust:     { a: 2, b: 0, c: 1 },
    };
    expect(HospitalSiegeSystem._countTrustedNpcs()).toBe(2);
  });

  it('recruited 비어있으면 0', () => {
    GameState.npcs = { recruited: [], trust: { a: 5 } };
    expect(HospitalSiegeSystem._countTrustedNpcs()).toBe(0);
  });
});

describe('_applyPartialVictory — outcome 처리', () => {
  beforeEach(() => {
    resetState();
    HospitalSiegeSystem._initialized = true;
  });

  it('사기가 partialVictoryMorale만큼 증가한다', () => {
    const before = GameState.stats.morale.current;
    HospitalSiegeSystem._applyPartialVictory(BALANCE.hospitalSiege);
    const gain = BALANCE.hospitalSiege.doctorEvacuation.partialVictoryMorale;
    expect(GameState.stats.morale.current).toBe(before + gain);
  });

  it('siegeWinStreak은 0으로 리셋된다', () => {
    GameState.flags.siegeWinStreak = 5;
    HospitalSiegeSystem._applyPartialVictory(BALANCE.hospitalSiege);
    expect(GameState.flags.siegeWinStreak).toBe(0);
  });

  it('hospitalDamaged 이벤트가 partialVictory=true로 발행된다', () => {
    const listener = vi.fn();
    const unsub = EventBus.on('hospitalDamaged', listener);
    HospitalSiegeSystem._applyPartialVictory(BALANCE.hospitalSiege);
    unsub();
    expect(listener).toHaveBeenCalledTimes(1);
    const payload = listener.mock.calls[0][0];
    expect(payload.partialVictory).toBe(true);
    expect(payload.isTutorial).toBe(false);
  });

  it('structureDamage가 기본 × partialVictoryStructureMult로 감경된다', () => {
    const listener = vi.fn();
    const unsub = EventBus.on('structureDamage', listener);
    HospitalSiegeSystem._applyPartialVictory(BALANCE.hospitalSiege);
    unsub();
    const mult = BALANCE.hospitalSiege.doctorEvacuation.partialVictoryStructureMult;
    const expected = BALANCE.hospitalSiege.structureDamage * mult;
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].damagePercent).toBeCloseTo(expected, 5);
  });

  it('patientDied 이벤트는 발행되지 않는다 (환자 사망 0)', () => {
    const listener = vi.fn();
    const unsub = EventBus.on('patientDied', listener);
    HospitalSiegeSystem._applyPartialVictory(BALANCE.hospitalSiege);
    unsub();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('_onSiegeResolved — partial_victory 분기', () => {
  beforeEach(() => {
    resetState();
    HospitalSiegeSystem._initialized = true;
  });

  it('outcome=partial_victory → _applyPartialVictory 경로', () => {
    const before = GameState.stats.morale.current;
    HospitalSiegeSystem._onSiegeResolved({ outcome: 'partial_victory' });
    const gain = BALANCE.hospitalSiege.doctorEvacuation.partialVictoryMorale;
    expect(GameState.stats.morale.current).toBe(before + gain);
  });

  it('outcome=defeat/victory는 여전히 기존 경로를 탄다', () => {
    // victory → streak 증가
    HospitalSiegeSystem._onSiegeResolved({ outcome: 'victory' });
    expect(GameState.flags.siegeWinStreak).toBe(1);
  });

  it('알 수 없는 outcome은 no-op', () => {
    const before = GameState.stats.morale.current;
    HospitalSiegeSystem._onSiegeResolved({ outcome: 'unknown' });
    expect(GameState.stats.morale.current).toBe(before);
  });
});
