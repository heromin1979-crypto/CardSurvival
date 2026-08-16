// === 부착물 제작 조합 — 무기를 재료로 갈아 넣지 않는다 ===
// regression: 조준경·탄약 개조 키트 조합이 target을 { tag: 'ranged' }로 잡아
// 원거리 무기 자체를 재료 자리에 세웠다. 부착물은 재료로만 만들고,
// 완성된 부착물을 무기에 장착하는 2단계로 분리한다.
import { describe, it, expect } from 'vitest';
import SECRET_COMBINATIONS from '../../js/data/secretCombinations.js';
import ITEMS from '../../js/data/items.js';
import { SKILL_HINTS } from '../../js/systems/SecretCombinationSystem.js';

const byId = id => SECRET_COMBINATIONS.find(c => c.id === id);

describe('부착물 제작 조합은 재료만 사용한다', () => {
  it.each(['sc_ammo_mod', 'sc_weapon_scope'])('%s는 무기 태그를 재료 조건으로 쓰지 않는다', comboId => {
    const combo = byId(comboId);
    expect(combo.source.tag).toBeUndefined();
    expect(combo.target.tag).toBeUndefined();
  });

  it('탄약 개조 키트는 고철 + 스프링으로 만든다', () => {
    const combo = byId('sc_ammo_mod');
    expect(combo.source).toEqual({ id: 'scrap_metal' });
    expect(combo.target).toEqual({ id: 'spring' });
    expect(combo.result).toMatchObject({
      spawnItem: 'ammo_mod',
      consumeSrc: true,
      consumeTgt: true,
    });
  });

  it('조준경은 유리파편 + 철파이프 + 철사로 만든다', () => {
    const combo = byId('sc_weapon_scope');
    expect(combo.source).toEqual({ id: 'glass_shard' });
    expect(combo.target).toEqual({ id: 'iron_pipe' });
    expect(combo.additionalReq).toEqual([{ id: 'wire', qty: 1 }]);
    expect(combo.result).toMatchObject({
      spawnItem: 'weapon_scope',
      consumeSrc: true,
      consumeTgt: true,
      consumeExtra: true,
    });
  });

  it('제작 재료가 모두 실제 아이템으로 존재한다', () => {
    for (const comboId of ['sc_ammo_mod', 'sc_weapon_scope']) {
      const combo = byId(comboId);
      expect(ITEMS[combo.source.id]).toBeTruthy();
      expect(ITEMS[combo.target.id]).toBeTruthy();
      for (const req of combo.additionalReq ?? []) expect(ITEMS[req.id]).toBeTruthy();
    }
  });
});

describe('확장 탄창 조합 흡수', () => {
  // sc_extended_mag는 consumeTgt:true라 applyCombination의 addEffect 블록이 통째로 스킵되고
  // ammoCapacity 키도 처리되지 않아, 재료만 잃고 아무 효과가 없는 조합이었다.
  // 컨셉·재료(고철+스프링)를 sc_ammo_mod가 물려받으므로 중복 조합을 남기지 않는다.
  it('sc_extended_mag가 제거되었다', () => {
    expect(byId('sc_extended_mag')).toBeUndefined();
  });

  it('스킬 힌트 해금 테이블이 실제 존재하는 조합만 가리킨다', () => {
    const known = new Set(SECRET_COMBINATIONS.map(c => c.id));
    for (const [skill, tiers] of Object.entries(SKILL_HINTS)) {
      for (const [level, hintIds] of Object.entries(tiers)) {
        for (const hintId of hintIds) {
          expect(known.has(hintId), `${skill} Lv.${level} 힌트 ${hintId}가 조합 목록에 없다`).toBe(true);
        }
      }
    }
  });
});

describe('조합 재료 쌍 충돌 없음', () => {
  it('id 쌍이 같은 조합이 둘 이상 존재하지 않는다', () => {
    const seen = new Map();
    for (const combo of SECRET_COMBINATIONS) {
      if (combo.triggerOnly) continue;
      if (!combo.source?.id || !combo.target?.id) continue;
      const key = [combo.source.id, combo.target.id].sort().join('+');
      expect(seen.has(key), `${key} 쌍이 ${seen.get(key)}와 ${combo.id}에 중복 선언됨`).toBe(false);
      seen.set(key, combo.id);
    }
  });
});
