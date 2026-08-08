import { describe, expect, it } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import SECRET_EVENTS from '../../js/data/secretEvents.js';

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
    const initialBoardIds = GameState.getBoardCards().map(c => c.instanceId);
    const initialTraderMet = GameState.flags.trader_met;
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const idx = ev.choices.findIndex(c => c.id === 'chat_trader');
    expect(HiddenElementSystem.resolveSecretEventChoice(ev.id, idx)).toBe(true);
    const finalBoardIds = GameState.getBoardCards().map(c => c.instanceId);
    for (const id of finalBoardIds) {
      if (!initialBoardIds.includes(id)) {
        GameState.removeCardInstance(id);
      }
    }
    GameState.flags.trader_met = initialTraderMet;
  });
});

describe('UI 부재 시 자동 폴백', () => {
  it('조건을 만족하지 못하는 선택지를 건너뛴다', () => {
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const picked = ev.choices.find(c => HiddenElementSystem.evaluateChoiceConditions(c).ok);
    expect(picked).toBeDefined();
    expect(picked.id).not.toBe('trade');
  });

  it('선택 처리 주체가 등록되면 자동 처리를 건너뛴다', () => {
    GameState.flags.secretEventsTriggered = [];
    GameState.flags.trader_robbed = false;
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    HiddenElementSystem.setChoiceResolverActive(true);
    try {
      HiddenElementSystem._triggerSecretEvent(ev);
    } finally {
      HiddenElementSystem.setChoiceResolverActive(false);
    }
    expect(GameState.flags.trader_robbed).toBe(false);
  });

  it('로깅 전용 구독자는 자동 처리를 막지 않는다', () => {
    GameState.flags.secretEventsTriggered = [];
    GameState.flags.trader_robbed = false;
    const initialBoardIds = GameState.getBoardCards().map(c => c.instanceId);
    const ev = SECRET_EVENTS.find(e => e.id === 'event_wandering_trader');
    const log = [];
    const off = EventBus.on('secretEventTriggered', d => log.push(d.event.id));
    HiddenElementSystem._triggerSecretEvent(ev);
    off();
    expect(log).toContain('event_wandering_trader');
    expect(GameState.flags.trader_robbed).toBe(true);
    GameState.flags.trader_robbed = false;
    const finalBoardIds = GameState.getBoardCards().map(c => c.instanceId);
    for (const id of finalBoardIds) {
      if (!initialBoardIds.includes(id)) {
        GameState.removeCardInstance(id);
      }
    }
  });
});

describe('선택지 조건과 실제 소모량 정합성', () => {
  it('조건에 명시된 수량이 결과의 최대 소모량 이상이다', () => {
    const gaps = [];
    for (const ev of SECRET_EVENTS) {
      for (const ch of ev.choices ?? []) {
        const need = new Map();
        for (const id of ch.conditions?.requiredItems ?? []) need.set(id, 1);
        for (const { id, qty } of ch.conditions?.requiredItemQty ?? []) {
          need.set(id, Math.max(need.get(id) ?? 0, qty ?? 1));
        }
        if (need.size === 0) continue;

        const spend = new Map();
        for (const out of ch.outcomes ?? []) {
          for (const r of out.effects?.removeItems ?? []) {
            spend.set(r.id, Math.max(spend.get(r.id) ?? 0, r.qty ?? 1));
          }
        }
        for (const [id, max] of spend) {
          if ((need.get(id) ?? 0) < max) {
            gaps.push(`${ev.id}/${ch.id}: ${id} 조건 ${need.get(id) ?? 0} < 소모 ${max}`);
          }
        }
      }
    }
    expect(gaps).toEqual([]);
  });
});
