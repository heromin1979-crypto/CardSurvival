// === 스택 카드 소모는 낱개 단위다 ===
// regression: 상호작용·비밀조합의 consumeSrc/consumeTgt가 BoardManager.removeCard +
// removeCardInstance로 카드를 통째로 지워, 20개 스택을 재료로 쓰면 1개분 효과만 얻고
// 19개가 함께 사라졌다. 채집은 _gatherUses가 인스턴스 단위라 10개 스택도 3회만 쓰이고
// 소진 시 스택 전체가 삭제됐다.
// 추가 재료(additionalReq)가 주재료와 같은 아이템인 조합은 게이트가 추가분만 세어,
// 3개짜리 레시피가 2개로 완성되는 할인까지 있었다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import SlotResolver from '../../js/board/SlotResolver.js';
import SecretCombinationSystem from '../../js/systems/SecretCombinationSystem.js';
import GatherSystem from '../../js/systems/GatherSystem.js';
import CraftSystem from '../../js/systems/CraftSystem.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import ITEMS from '../../js/data/items.js';

function place(definitionId, quantity = 1, row = 'bottom') {
  const inst = GameState.createCardInstance(definitionId, { quantity });
  GameState.placeCardInRow(inst.instanceId, row);
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.discoveries = {
    foundCombinations: [], unlockedHints: [], lastCooldowns: {}, totalFound: 0,
  };
  GameState.player.skills = {
    crafting:    { level: 12, xp: 0 },
    weaponcraft: { level: 12, xp: 0 },
    medicine:    { level: 12, xp: 0 },
    melee:       { level: 12, xp: 0 },
    cooking:     { level: 12, xp: 0 },
  };
});

describe('비밀 조합 — 주재료는 스택에서 1개만 빠진다', () => {
  it('독버섯 20스택을 무기에 바르면 19개가 남는다', () => {
    const shroom = place('mushroom_toxic', 20);
    const weapon = place('crowbar');

    SlotResolver.resolveSecretCombo(shroom.instanceId, weapon.instanceId);

    expect(GameState.countOnBoard('mushroom_toxic')).toBe(19);
    expect(GameState.cards[weapon.instanceId]._poisonDamage).toBe(3);
  });

  // sc_wild_salad: source=wild_berry, target=dandelion, additionalReq=[wild_garlic×1]
  it('드랍 대상(target) 스택도 1개만 빠진다', () => {
    const berry     = place('wild_berry', 20);
    const dandelion = place('dandelion', 20);
    place('wild_garlic', 20);

    SlotResolver.resolveSecretCombo(berry.instanceId, dandelion.instanceId);

    expect(GameState.countOnBoard('wild_berry')).toBe(19);
    expect(GameState.countOnBoard('dandelion')).toBe(19);
    expect(GameState.countOnBoard('wild_garlic')).toBe(19);
    expect(GameState.countOnBoard('wild_salad')).toBe(1);
  });

  it('마지막 1개를 쓰면 카드가 사라진다', () => {
    const shroom = place('mushroom_toxic', 1);
    const weapon = place('crowbar');

    SlotResolver.resolveSecretCombo(shroom.instanceId, weapon.instanceId);

    expect(GameState.cards[shroom.instanceId]).toBeUndefined();
    expect(GameState.countOnBoard('mushroom_toxic')).toBe(0);
  });
});

describe('비밀 조합 — 추가 재료가 주재료와 같은 경우', () => {
  // sc_nettle_rope: source=nettle, target=stone_knife, additionalReq=[nettle×2]
  // 주재료 1 + 추가 2 = 총 3개가 설계값이다.
  it('쐐기풀 20스택이면 3개만 빠지고 로프 1개가 나온다', () => {
    const nettle = place('nettle', 20);
    const knife  = place('stone_knife');

    SlotResolver.resolveSecretCombo(nettle.instanceId, knife.instanceId);

    expect(GameState.countOnBoard('nettle')).toBe(17);
    expect(GameState.countOnBoard('rope')).toBe(1);
  });

  it('정확히 3개면 다 쓰고 로프 1개가 나온다', () => {
    const nettle = place('nettle', 3);
    const knife  = place('stone_knife');

    SlotResolver.resolveSecretCombo(nettle.instanceId, knife.instanceId);

    expect(GameState.countOnBoard('nettle')).toBe(0);
    expect(GameState.countOnBoard('rope')).toBe(1);
  });

  it('2개뿐이면 주재료 몫이 없어 차단된다', () => {
    place('nettle', 2);
    place('stone_knife');

    const check = SecretCombinationSystem.checkCombination(ITEMS.nettle, ITEMS.stone_knife);

    expect(check.reason).toBeTruthy();
    expect(check.reason).toContain('3');
  });
});

describe('상호작용 — 주재료는 스택에서 1개만 빠진다', () => {
  it('가죽 5스택으로 그립을 감으면 4개가 남는다', () => {
    const leather = place('leather', 5);
    const weapon  = place('crowbar');

    SlotResolver.resolveInteraction(leather.instanceId, weapon.instanceId);

    expect(GameState.countOnBoard('leather')).toBe(4);
  });
});

describe('채집 — 채집 횟수는 스택 1개당이다', () => {
  it('마른 풀 10스택은 3회 채집 후 9개가 남고 횟수가 되돌아온다', () => {
    const grass = place('dry_grass', 10);

    for (let i = 0; i < 3; i++) GatherSystem.gather(grass.instanceId);

    expect(GameState.countOnBoard('dry_grass')).toBe(9);
    expect(GatherSystem.remainingUses(grass.instanceId)).toBe(3);
    expect(GameState.countOnBoard('bait_worm') + GameState.countOnBoard('bait_insect')).toBe(3);
  });

  it('마지막 1개가 소진되면 카드가 사라진다', () => {
    const grass = place('dry_grass', 1);

    for (let i = 0; i < 3; i++) GatherSystem.gather(grass.instanceId);

    expect(GameState.cards[grass.instanceId]).toBeUndefined();
    expect(GameState.countOnBoard('dry_grass')).toBe(0);
  });
});

describe('청사진 제작 — 기존 동작 유지', () => {
  it('process_nettle은 쐐기풀 20스택에서 3개만 쓴다', () => {
    place('nettle', 20);
    place('campfire', 1, 'middle');

    CraftSystem._consumeStageItems(BLUEPRINTS.process_nettle.stages[0], false);

    expect(GameState.countOnBoard('nettle')).toBe(17);
  });
});
