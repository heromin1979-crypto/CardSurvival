import { describe, expect, it } from 'vitest';
import GameState, { createDefaultFlags } from '../../js/core/GameState.js';

// 시스템이 진입 가드로 검사하는 필드들. 하나라도 빠지면 해당 시스템이 통째로 죽는다.
const GUARDED = [
  'hiddenLocationsDiscovered',
  'secretEventsTriggered',
  'mapFragments',
  'bossesKilled',
  'legendaryItemsFound',
  'hiddenRecipesUnlocked',
  'eventChainProgress',
  'firstEnterRewardsClaimed',
];

describe('새 게임 flags 기본값', () => {
  it('시스템 가드 필드를 모두 포함한다', () => {
    const f = createDefaultFlags();
    for (const key of GUARDED) {
      expect(f, key).toHaveProperty(key);
    }
  });

  it('배열·객체 필드는 호출마다 새 인스턴스를 반환한다', () => {
    const a = createDefaultFlags();
    const b = createDefaultFlags();
    expect(a).not.toBe(b);
    expect(a.hiddenLocationsDiscovered).not.toBe(b.hiddenLocationsDiscovered);
    expect(a.eventChainProgress).not.toBe(b.eventChainProgress);
    a.hiddenLocationsDiscovered.push('x');
    expect(b.hiddenLocationsDiscovered).toEqual([]);
  });

  it('GameState의 초기 flags와 키 집합이 일치한다', () => {
    expect(Object.keys(createDefaultFlags()).sort())
      .toEqual(Object.keys(GameState.flags).sort());
  });
});
