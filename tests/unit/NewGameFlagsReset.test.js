import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createDefaultFlags } from '../../js/core/GameState.js';

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

  it('CharCreate가 flags를 직접 만들지 않고 기본값 함수를 쓴다', async () => {
    const src = await readFile(
      new URL('../../js/screens/CharCreate.js', import.meta.url),
      'utf8',
    );
    expect(src).toMatch(/gs\.flags\s*=\s*createDefaultFlags\(\)/);
    // 손으로 나열한 객체 리터럴로 되돌아가면 필드가 다시 누락된다
    expect(src).not.toMatch(/gs\.flags\s*=\s*\{/);
  });
});
