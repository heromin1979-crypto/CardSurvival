import { describe, expect, it } from 'vitest';
import CHARACTERS from '../../js/data/characters.js';
import GameData from '../../js/data/GameData.js';

// 시작 음식(subtype 'food')은 최대 3개 — "첫 끼니"(food 3개 확보) 퀘스트가
// 시작 재고만으로 목표를 크게 초과하지 않도록 유지하는 밸런스 상한.

function startingFoodCount(char) {
  return char.abilities
    .flatMap(a => a.effect?.startingItems ?? [])
    .filter(id => GameData.items[id]?.subtype === 'food')
    .length;
}

describe('캐릭터 시작 음식 개수', () => {
  it('모든 시작 아이템이 실제 아이템 정의를 가진다', () => {
    for (const char of CHARACTERS) {
      for (const id of char.abilities.flatMap(a => a.effect?.startingItems ?? [])) {
        expect(GameData.items[id], `${char.id}: ${id}`).toBeDefined();
      }
    }
  });

  it('의사는 음식 3개로 시작한다', () => {
    const doctor = CHARACTERS.find(c => c.id === 'doctor');
    expect(startingFoodCount(doctor)).toBe(3);
  });

  it('셰프는 음식 3개로 시작한다 (전용템: 향신료·도시락·스튜)', () => {
    const chef = CHARACTERS.find(c => c.id === 'chef');
    expect(startingFoodCount(chef)).toBe(3);
    const items = chef.abilities.flatMap(a => a.effect?.startingItems ?? []);
    expect(items).toContain('spice_blend');
    expect(items).toContain('chef_meal_kit');
    expect(items).toContain('hearty_stew');
  });

  it('어떤 직업도 음식 3개를 초과해 시작하지 않는다', () => {
    for (const char of CHARACTERS) {
      expect(startingFoodCount(char), char.id).toBeLessThanOrEqual(3);
    }
  });
});
