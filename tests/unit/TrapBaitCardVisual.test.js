// @vitest-environment happy-dom
// === 미끼 상태 카드 표현 테스트 ===
// 미끼 유무는 카드 테두리가 아니라 아트 영역에 그린다 — 테두리와 코너 브래킷은
// 희귀도가 이미 쓰고 있어 덮어쓰면 등급 정보가 사라진다.
//
// 함께 고정하는 두 가지:
//   - 가시 트랩은 subtype만 'trap'이고 trapData가 없어 진행도 슬롯 0/0이 그려졌다.
//   - refreshCard는 emit만 있고 받는 쪽이 없어 미끼를 넣어도 카드가 갱신되지 않았다.
import { describe, it, expect, beforeEach } from 'vitest';
import CardFactory from '../../js/ui/CardFactory.js';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import ITEMS from '../../js/data/items.js';
import { getBaitCapacity } from '../../js/systems/baitable.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = {
    top: Array(10).fill(null), environment: Array(3).fill(null),
    middle: Array(20).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, structureDurabilityBonus: 1.0,
  };
  document.body.innerHTML = '';
}

/** 카드 DOM을 만들어 문서에 붙이고 반환 */
function renderCard(definitionId, patch = {}) {
  const inst = GameState.createCardInstance(definitionId);
  Object.assign(inst, patch);
  const el = CardFactory.build(inst.instanceId);
  document.body.appendChild(el);
  return { inst, el };
}

describe('미끼 상태 — 아트 영역 표현', () => {
  beforeEach(resetWorld);

  it('미끼가 없으면 아트에 is-unbaited가 붙는다', () => {
    const { el } = renderCard('rat_trap');
    expect(el.querySelector('.card-art').classList.contains('is-unbaited')).toBe(true);
  });

  it('미끼가 있으면 아트에 is-baited가 붙는다', () => {
    const { el } = renderCard('rat_trap', { _baitCharges: 4 });
    expect(el.querySelector('.card-art').classList.contains('is-baited')).toBe(true);
  });

  it('희귀도 테두리를 건드리지 않는다 — 상태는 아트 안쪽에만 그린다', () => {
    const { el } = renderCard('rat_trap', { _baitCharges: 4 });
    expect(el.dataset.rarity).toBe(ITEMS.rat_trap.rarity);
    expect(el.classList.contains('is-baited')).toBe(false);
  });

  it('남은 횟수를 배지로 보여준다', () => {
    const { el } = renderCard('rat_trap', { _baitCharges: 3 });
    const badge = el.querySelector('.card-bait-badge');
    expect(badge.textContent).toContain('3');
    expect(badge.classList.contains('loaded')).toBe(true);
  });

  it('미끼를 받지 않는 카드에는 배지가 없다', () => {
    const { el } = renderCard('scrap_metal');
    expect(el.querySelector('.card-bait-badge')).toBeNull();
    expect(el.querySelector('.card-art').classList.contains('is-unbaited')).toBe(false);
  });

  it('통발도 덫과 같은 표현을 쓴다', () => {
    expect(getBaitCapacity(ITEMS.fish_trap)).toBeGreaterThan(0);
    const { el } = renderCard('fish_trap', { _baitCharges: 5 });
    expect(el.querySelector('.card-art').classList.contains('is-baited')).toBe(true);
    expect(el.querySelector('.card-bait-badge').textContent).toContain('5');
  });
});

describe('미끼 상태 — 카드 이미지 교체', () => {
  beforeEach(resetWorld);

  const BAITABLE = ['rat_trap', 'pigeon_snare', 'alley_pit_trap', 'fish_trap'];

  it.each(BAITABLE)('%s는 미끼 유무에 따라 다른 이미지를 쓴다', (id) => {
    const empty  = renderCard(id).el.querySelector('.card-img').getAttribute('src');
    resetWorld();
    const loaded = renderCard(id, { _baitCharges: 2 }).el.querySelector('.card-img').getAttribute('src');
    expect(loaded).not.toBe(empty);
    expect(loaded).toContain('_baited');
  });

  // 에셋이 아직 없는 도구는 기본 이미지로 떨어져야 한다 — 없는 경로를 물리면 404가 난다.
  // 지금은 네 종 모두 에셋이 있어, 키를 잠시 걷어내 폴백 분기를 실제로 태운다.
  it('_baited 에셋이 없으면 기본 이미지를 그대로 쓴다', () => {
    const saved = CardFactory.images.rat_trap_baited;
    delete CardFactory.images.rat_trap_baited;
    try {
      const { el } = renderCard('rat_trap', { _baitCharges: 2 });
      expect(el.querySelector('.card-img').getAttribute('src'))
        .toBe(CardFactory.images.rat_trap);
    } finally {
      CardFactory.images.rat_trap_baited = saved;
    }
  });
});

describe('진행도 슬롯', () => {
  beforeEach(resetWorld);

  it('발동 규칙이 있는 덫에만 그린다', () => {
    const { el } = renderCard('rat_trap');
    expect(el.querySelector('.card-trap-slot')).not.toBeNull();
  });

  it('가시 트랩에는 0/0 슬롯을 그리지 않는다', () => {
    expect(ITEMS.spike_trap.subtype).toBe('trap');
    expect(ITEMS.spike_trap.trapData).toBeUndefined();
    const { el } = renderCard('spike_trap');
    expect(el.querySelector('.card-trap-slot')).toBeNull();
  });

  it('미끼가 차면 슬롯이 대기 상태로 바뀐다', () => {
    const { el } = renderCard('rat_trap', { _baitCharges: 4 });
    expect(el.querySelector('.card-trap-slot').classList.contains('baited')).toBe(true);
  });
});

describe('refreshCard 구독', () => {
  beforeEach(resetWorld);

  it('미끼를 채우고 refreshCard를 쏘면 카드가 다시 그려진다', () => {
    const { inst, el } = renderCard('rat_trap');
    expect(el.querySelector('.card-art').classList.contains('is-unbaited')).toBe(true);

    inst._baitCharges = 4;
    EventBus.emit('refreshCard', { instanceId: inst.instanceId });

    const after = document.querySelector(`[data-instance-id="${inst.instanceId}"]`);
    expect(after.querySelector('.card-art').classList.contains('is-baited')).toBe(true);
  });
});
