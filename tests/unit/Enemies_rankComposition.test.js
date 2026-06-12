// === 적 그룹 진형 보정 — 후열-only 굴림 방지 (호위 규칙) ===
// 검증:
//   - ensureFrontRank: 후열로만 구성된 그룹은 첫 적이 전열로 강등
//   - rollEnemyGroup: 어떤 소음/위험도 조합에서도 전열이 최소 1마리 보장
import { describe, it, expect } from 'vitest';
import { ensureFrontRank, rollEnemyGroup } from '../../js/data/enemies.js';

describe('ensureFrontRank', () => {
  it('후열로만 구성된 그룹은 첫 적이 전열로 내려온다', () => {
    const group = [{ id: 'a', row: 'back' }, { id: 'b', row: 'back' }];
    ensureFrontRank(group);
    expect(group[0].row).toBe('front');
    expect(group[1].row).toBe('back');
  });

  it('전열이 이미 있으면 변경하지 않는다', () => {
    const group = [{ id: 'a', row: 'back' }, { id: 'b', row: 'front' }];
    ensureFrontRank(group);
    expect(group[0].row).toBe('back');
    expect(group[1].row).toBe('front');
  });

  it('후열 단독 스폰은 전열로 강등된다', () => {
    const group = [{ id: 'a', row: 'back' }];
    ensureFrontRank(group);
    expect(group[0].row).toBe('front');
  });

  it('빈 그룹은 그대로 반환한다', () => {
    expect(ensureFrontRank([])).toEqual([]);
  });
});

describe('rollEnemyGroup 진형 불변식', () => {
  it('모든 소음/위험도 조합에서 전열이 최소 1마리 존재한다', () => {
    for (const dangerLevel of [1, 2, 3, 4, 5]) {
      for (const noise of [0, 40, 80]) {
        for (let i = 0; i < 60; i++) {
          const group = rollEnemyGroup(dangerLevel, noise);
          expect(group.length).toBeGreaterThan(0);
          expect(group.some(e => e.row === 'front')).toBe(true);
        }
      }
    }
  });
});
