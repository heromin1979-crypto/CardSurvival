import { describe, it, expect } from 'vitest';
import StatSystem from '../../js/systems/StatSystem.js';

describe('StatSystem._getWeightMult — 스태미나 소모 배율은 과적(>100%)에서만', () => {
  it('100% 이하는 전 구간 배율 없음', () => {
    expect(StatSystem._getWeightMult(0)).toBe(1.0);
    expect(StatSystem._getWeightMult(0.6)).toBe(1.0);
    expect(StatSystem._getWeightMult(0.9)).toBe(1.0);
    expect(StatSystem._getWeightMult(1.0)).toBe(1.0);
  });

  it('100% 초과는 ×1.2', () => {
    expect(StatSystem._getWeightMult(1.01)).toBe(1.2);
    expect(StatSystem._getWeightMult(1.5)).toBe(1.2);
    expect(StatSystem._getWeightMult(2.5)).toBe(1.2);
  });
});
