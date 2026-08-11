// === 환경물 이동 차단 회귀 테스트 ===
// regression: 산개울·메마른 개울(type:'environment')이 휴대(bottom) 행으로 수납되던 문제.
// 차단이 CardFactory의 `el.draggable = false`(UI 레이어)에만 있어 draggable 속성을 보지 않는
// TouchDrag(터치·펜 롱프레스) 경로로 뚫렸다. 규칙 레이어인 validateDrop에서 막아야
// 입력 경로와 무관하게 한 곳에서 차단된다.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import SlotResolver from '../../js/board/SlotResolver.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const ENV_IDS = ['stream_spring', 'dry_stream'];

describe('환경물(type:environment) 이동 차단', () => {
  const originalGetCardDef = GameState.getCardDef;

  beforeEach(() => {
    GameState.getCardDef = instanceId => ITEMS[instanceId] ?? null;
  });

  afterEach(() => {
    GameState.getCardDef = originalGetCardDef;
  });

  it.each(ENV_IDS)('%s는 type이 environment로 정의되어 있다', id => {
    expect(ITEMS[id].type).toBe('environment');
  });

  it.each(ENV_IDS)('%s는 휴대(bottom) 행으로 옮길 수 없다', id => {
    expect(SlotResolver.validateDrop(id, 'bottom', 0).valid).toBe(false);
  });

  it.each(ENV_IDS)('%s는 바닥(middle) 행으로도 옮길 수 없다', id => {
    expect(SlotResolver.validateDrop(id, 'middle', 0).valid).toBe(false);
  });

  it.each(ENV_IDS)('%s 차단 사유는 안내 메시지를 담는다', id => {
    const { reason } = SlotResolver.validateDrop(id, 'bottom', 0);
    expect(typeof reason).toBe('string');
    expect(reason.length).toBeGreaterThan(0);
  });

  it('일반 아이템(빈 병)은 휴대 행으로 옮길 수 있다 — 차단이 과하게 걸리지 않는다', () => {
    expect(SlotResolver.validateDrop('empty_bottle', 'bottom', 0).valid).toBe(true);
  });

  it('일반 아이템(양동이)은 바닥 행으로 옮길 수 있다', () => {
    expect(SlotResolver.validateDrop('empty_bucket', 'middle', 0).valid).toBe(true);
  });
});
