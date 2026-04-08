import { describe, it, expect } from 'vitest';
import GameState from '../../js/core/GameState.js';

// GameState는 싱글턴이므로 초기값 읽기 테스트에 집중한다.
// (mutate 테스트는 TickEngine.test.js에서 격리 환경으로 진행)

describe('GameState 초기 구조 — time', () => {
  it('totalTP 초기값은 0이다', () => {
    expect(GameState.time.totalTP).toBe(0);
  });

  it('day 초기값은 1이다', () => {
    expect(GameState.time.day).toBe(1);
  });

  it('isPaused 초기값은 false다', () => {
    expect(GameState.time.isPaused).toBe(false);
  });
});

describe('GameState 초기 구조 — stats', () => {
  it('hydration current 초기값은 200이다', () => {
    expect(GameState.stats.hydration.current).toBe(200);
  });

  it('모든 stat에 current/max/decayPerTP 필드가 있다', () => {
    const statKeys = ['hydration', 'nutrition', 'temperature', 'morale',
                      'radiation', 'infection', 'fatigue', 'stamina'];
    for (const key of statKeys) {
      expect(GameState.stats[key]).toHaveProperty('current');
      expect(GameState.stats[key]).toHaveProperty('max');
      expect(GameState.stats[key]).toHaveProperty('decayPerTP');
    }
  });
});

describe('GameState 초기 구조 — player', () => {
  it('isAlive 초기값은 true다', () => {
    expect(GameState.player.isAlive).toBe(true);
  });

  it('hp에 current/max 필드가 있다', () => {
    expect(GameState.player.hp).toHaveProperty('current');
    expect(GameState.player.hp).toHaveProperty('max');
  });

  it('traits 초기값은 빈 배열이다', () => {
    expect(Array.isArray(GameState.player.traits)).toBe(true);
  });

  it('skills 객체에 12개 스킬이 정의되어 있다', () => {
    const skillKeys = Object.keys(GameState.player.skills);
    expect(skillKeys.length).toBe(12);
  });

  it('각 skill에 xp/level 필드가 있다', () => {
    for (const skill of Object.values(GameState.player.skills)) {
      expect(skill).toHaveProperty('xp');
      expect(skill).toHaveProperty('level');
    }
  });
});
