import { describe, it, expect } from 'vitest';
import ITEMS from '../../js/data/items.js';

const ALLOWED = new Set(['fire', 'blade', 'bullet', 'blunt', 'explosive', 'electric', 'utility']);

describe('weaponType 어휘 정규화', () => {
  it('모든 무기 weaponType이 정규 어휘에 속한다', () => {
    const offenders = [];
    for (const [id, def] of Object.entries(ITEMS)) {
      if (def?.weaponType && !ALLOWED.has(def.weaponType)) {
        offenders.push(`${id}:${def.weaponType}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
