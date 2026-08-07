// === 소음기 부착 무기 표시 이름 회귀 테스트 ===
// regression: 소음기 부착(inst._suppressor) 후에도 카드·전투 UI에
// 원래 무기 이름만 표시되어 부착 여부를 알 수 없던 문제.
import { describe, it, expect } from 'vitest';
import { formatInstanceName } from '../../js/systems/ItemEffectSystem.js';

describe('formatInstanceName', () => {
  const pistolDef = { id: 'pistol', name: '권총' };

  it('일반 무기는 기본 이름을 그대로 반환한다', () => {
    expect(formatInstanceName({ definitionId: 'pistol' }, pistolDef)).toBe('권총');
  });

  it('소음기가 부착된 무기는 이름 뒤에 (소음기)를 붙인다', () => {
    const inst = { definitionId: 'pistol', _suppressor: true, _noiseReduction: 0.5 };
    expect(formatInstanceName(inst, pistolDef)).toBe('권총 (소음기)');
  });

  it('인스턴스가 없어도 정의 이름으로 안전하게 동작한다', () => {
    expect(formatInstanceName(null, pistolDef)).toBe('권총');
  });
});
