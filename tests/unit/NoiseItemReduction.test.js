// === NoiseSystem 아이템 소음 감쇠 회귀 테스트 ===
// regression: sound_dampener(onUse.noiseReduction)와 stealth_suit(onWear.noiseReduction)의
// 감쇠 플래그를 읽는 시스템이 없어 기능이 사장되어 있던 문제.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  noise: { level: 0 },
  player: { equipped: {}, isAlive: true },
  boardCards: [],
  defs: {},
  getBoardCards() { return this.boardCards; },
  getCardDef(instanceId) { return this.defs[instanceId] ?? null; },
}));

vi.mock('../../js/core/GameState.js', () => ({ default: mockState }));
vi.mock('../../js/core/EventBus.js', () => ({ default: { on: vi.fn(), emit: vi.fn() } }));
vi.mock('../../js/core/I18n.js', () => ({ default: { t: (k) => k } }));
vi.mock('../../js/core/StateMachine.js', () => ({ default: { transition: vi.fn() } }));
vi.mock('../../js/data/enemies.js', () => ({ rollEnemyGroup: vi.fn() }));
vi.mock('../../js/systems/TraitSystem.js', () => ({ default: { getTraitEffect: () => null } }));
vi.mock('../../js/systems/BasecampSystem.js', () => ({ default: {} }));

import NoiseSystem from '../../js/systems/NoiseSystem.js';

describe('NoiseSystem 아이템 소음 감쇠', () => {
  beforeEach(() => {
    mockState.noise.level = 0;
    mockState.player.equipped = {};
    mockState.boardCards = [];
    mockState.defs = {};
  });

  it('감쇠 아이템이 없으면 소음이 그대로 누적된다', () => {
    NoiseSystem.addNoise(10);
    expect(mockState.noise.level).toBe(10);
  });

  it('보드의 소음 감쇠기(onUse.noiseReduction 0.5)가 소음을 절반으로 줄인다', () => {
    mockState.boardCards = [{ instanceId: 'i1' }];
    mockState.defs.i1 = { onUse: { noiseReduction: 0.5 } };
    NoiseSystem.addNoise(10);
    expect(mockState.noise.level).toBe(5);
  });

  it('장착 아이템의 onWear.noiseReduction도 적용된다', () => {
    mockState.player.equipped = { body: 'e1' };
    mockState.defs.e1 = { onWear: { noiseReduction: 0.3 } };
    NoiseSystem.addNoise(10);
    expect(mockState.noise.level).toBe(7);
  });

  it('여러 감쇠원은 합산하지 않고 최댓값 하나만 적용한다', () => {
    mockState.boardCards = [{ instanceId: 'i1' }];
    mockState.defs.i1 = { onUse: { noiseReduction: 0.5 } };
    mockState.player.equipped = { body: 'e1' };
    mockState.defs.e1 = { onWear: { noiseReduction: 0.3 } };
    NoiseSystem.addNoise(10);
    expect(mockState.noise.level).toBe(5);
  });
});
