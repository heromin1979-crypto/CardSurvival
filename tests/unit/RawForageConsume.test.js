// === 채집 원물 생식 — onUse 대신 onConsume이어야 적용된다 ===
// regression: 도토리·쐐기풀 등 10종이 type:'material' + onUse로 선언돼 있어
// getConsumableEffect(ItemEffectSystem.js:53)가 null을 돌려줬다. ModalManager의
// canConsume이 false가 되어 설명문("날것으로도 먹을 수 있다")과 달리 섭취 버튼조차
// 뜨지 않았다. 재료여도 onConsume이 있으면 섭취 가능한 것이 프로젝트 관례다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import StatSystem from '../../js/systems/StatSystem.js';
import { getConsumableEffect } from '../../js/systems/ItemEffectSystem.js';
import ITEMS from '../../js/data/items.js';

const RAW_FORAGE = [
  'mushroom_toxic', 'acorn', 'wild_root', 'dandelion', 'wild_garlic',
  'nettle', 'pine_needle', 'bamboo_shoot', 'fish_fillet', 'vegetable',
];

function place(definitionId, quantity = 1) {
  const inst = GameState.createCardInstance(definitionId, { quantity });
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  // 배율이 끼면 기대값이 흐려진다 — 스킬·특성 보정을 모두 1배로 둔다
  GameState.player.skills = {};
  GameState.player.equipped = {};
  GameState.player.traits = [];
  GameState.player.hp.current = GameState.player.hp.max;
  for (const key of ['nutrition', 'hydration', 'stamina', 'morale', 'infection']) {
    const s = GameState.stats[key];
    if (s) s.current = Math.floor(s.max / 2);
  }
});

describe('섭취 판정', () => {
  it('10종 모두 섭취 효과를 돌려준다', () => {
    const dead = RAW_FORAGE.filter(id => !getConsumableEffect(ITEMS[id]));
    expect(dead).toEqual([]);
  });

  it('효과 수치는 원래 정의값을 유지한다', () => {
    expect(getConsumableEffect(ITEMS.acorn)).toMatchObject({ nutrition: 5, morale: -3 });
    expect(getConsumableEffect(ITEMS.nettle)).toMatchObject({ hp: -5, infection: 10 });
    expect(getConsumableEffect(ITEMS.fish_fillet)).toMatchObject({ nutrition: 15, infection: 25 });
    expect(getConsumableEffect(ITEMS.wild_root)).toMatchObject({ nutrition: 8, stamina: -5 });
  });
});

describe('실제 섭취 효과', () => {
  it('도토리 — 영양 +5, 사기 -3', () => {
    const inst = place('acorn');
    const nutrition = GameState.stats.nutrition.current;
    const morale    = GameState.stats.morale.current;

    expect(StatSystem.consumeCard(inst.instanceId)).toBe(true);

    expect(GameState.stats.nutrition.current).toBe(nutrition + 5);
    expect(GameState.stats.morale.current).toBe(morale - 3);
  });

  it('쐐기풀 생식 — HP -5, 감염 +10', () => {
    const inst = place('nettle');
    const hp        = GameState.player.hp.current;
    const infection = GameState.stats.infection.current;

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.player.hp.current).toBe(hp - 5);
    expect(GameState.stats.infection.current).toBe(infection + 10);
  });

  it('생선 필레 생식 — 영양 +15, 감염 +25', () => {
    const inst = place('fish_fillet');
    const nutrition = GameState.stats.nutrition.current;
    const infection = GameState.stats.infection.current;

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.stats.nutrition.current).toBe(nutrition + 15);
    expect(GameState.stats.infection.current).toBe(infection + 25);
  });

  it('독버섯 — HP가 0 아래로 내려가지 않는다', () => {
    GameState.player.hp.current = 8;
    const inst = place('mushroom_toxic');

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.player.hp.current).toBe(0);
  });
});

describe('스택 소모', () => {
  it('20스택에서 1개만 먹는다', () => {
    const inst = place('acorn', 20);

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.countOnBoard('acorn')).toBe(19);
  });
});
