import { describe, expect, it } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import SECRET_EVENTS from '../../js/data/secretEvents.js';

describe('EventBus.hasListener', () => {
  it('수신자가 없으면 false', () => {
    expect(EventBus.hasListener('__no_such_channel__')).toBe(false);
  });

  it('구독하면 true, 해제하면 false', () => {
    const off = EventBus.on('__probe__', () => {});
    expect(EventBus.hasListener('__probe__')).toBe(true);
    off();
    expect(EventBus.hasListener('__probe__')).toBe(false);
  });
});

describe('선택지 조건 판정', () => {
  it('조건이 없으면 항상 통과', () => {
    const r = HiddenElementSystem.evaluateChoiceConditions({ id: 'x' });
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it('requiredItems는 1개 이상 보유를 요구한다', () => {
    const choice = { conditions: { requiredItems: ['__absent_item__'] } };
    const r = HiddenElementSystem.evaluateChoiceConditions(choice);
    expect(r.ok).toBe(false);
    expect(r.missing[0]).toMatchObject({ id: '__absent_item__', need: 1, have: 0 });
  });

  it('requiredItemQty는 지정 수량을 요구한다', () => {
    const choice = { conditions: { requiredItemQty: [{ id: '__absent_item__', qty: 3 }] } };
    const r = HiddenElementSystem.evaluateChoiceConditions(choice);
    expect(r.ok).toBe(false);
    expect(r.missing[0]).toMatchObject({ id: '__absent_item__', need: 3, have: 0 });
  });

  it('보유 수량이 충분하면 통과한다', () => {
    const inst = GameState.createCardInstance('canned_food', { quantity: 5 });
    GameState.placeCardInRow(inst.instanceId, 'bottom');
    const choice = { conditions: { requiredItemQty: [{ id: 'canned_food', qty: 3 }] } };
    expect(HiddenElementSystem.evaluateChoiceConditions(choice).ok).toBe(true);
    GameState.removeCardInstance(inst.instanceId);
  });
});

describe('선택지 해결', () => {
  it('존재하지 않는 이벤트·선택지는 false', () => {
    expect(HiddenElementSystem.resolveSecretEventChoice('__nope__', 0)).toBe(false);
    expect(HiddenElementSystem.resolveSecretEventChoice(SECRET_EVENTS[0].id, 99)).toBe(false);
  });

  it('조건을 만족하지 못한 선택지는 거부한다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const idx = ev.choices.findIndex(c => c.id === 'trade');
    expect(HiddenElementSystem.resolveSecretEventChoice(ev.id, idx)).toBe(false);
  });

  it('조건 없는 선택지는 실행된다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const idx = ev.choices.findIndex(c => c.id === 'chat_trader');
    expect(HiddenElementSystem.resolveSecretEventChoice(ev.id, idx)).toBe(true);
  });
});

describe('UI 부재 시 자동 폴백', () => {
  it('조건을 만족하지 못하는 선택지를 건너뛴다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const picked = ev.choices.find(c => HiddenElementSystem.evaluateChoiceConditions(c).ok);
    expect(picked).toBeDefined();
    expect(picked.id).not.toBe('trade');
  });

  it('UI 리스너가 있으면 자동 처리를 건너뛴다', () => {
    GameState.flags.secretEventsTriggered = [];
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const off = EventBus.on('secretEventTriggered', () => {});
    const before = GameState.getBoardCards().length;
    HiddenElementSystem._triggerSecretEvent(ev);
    off();
    expect(GameState.getBoardCards().length).toBe(before);
  });
});
