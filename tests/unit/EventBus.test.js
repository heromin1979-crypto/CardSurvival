import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus from '../../js/core/EventBus.js';

beforeEach(() => {
  // 싱글턴 상태 리셋
  EventBus._listeners = {};
});

describe('EventBus.on / emit', () => {
  it('등록된 핸들러가 emit 시 호출된다', () => {
    const handler = vi.fn();
    EventBus.on('test', handler);
    EventBus.emit('test', { value: 42 });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('emit 데이터가 핸들러에 그대로 전달된다', () => {
    const received = [];
    EventBus.on('data', (d) => received.push(d));
    EventBus.emit('data', { x: 1 });
    EventBus.emit('data', { x: 2 });
    expect(received).toEqual([{ x: 1 }, { x: 2 }]);
  });

  it('미등록 이벤트 emit은 에러 없이 무시된다', () => {
    expect(() => EventBus.emit('noop', {})).not.toThrow();
  });

  it('다중 핸들러가 모두 호출된다', () => {
    const a = vi.fn();
    const b = vi.fn();
    EventBus.on('multi', a);
    EventBus.on('multi', b);
    EventBus.emit('multi', null);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('핸들러 예외가 다른 핸들러 실행을 막지 않는다', () => {
    const bad  = () => { throw new Error('boom'); };
    const good = vi.fn();
    EventBus.on('err', bad);
    EventBus.on('err', good);
    expect(() => EventBus.emit('err', null)).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
  });
});

describe('EventBus.on unsubscribe', () => {
  it('on() 반환 함수 호출 시 핸들러가 해제된다', () => {
    const handler = vi.fn();
    const unsub = EventBus.on('unsub', handler);
    unsub();
    EventBus.emit('unsub', null);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('EventBus.off', () => {
  it('off()로 특정 핸들러만 제거된다', () => {
    const a = vi.fn();
    const b = vi.fn();
    EventBus.on('off', a);
    EventBus.on('off', b);
    EventBus.off('off', a);
    EventBus.emit('off', null);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it('미등록 이벤트 off는 에러 없이 무시된다', () => {
    expect(() => EventBus.off('ghost', () => {})).not.toThrow();
  });
});

describe('EventBus.once', () => {
  it('once 핸들러는 정확히 한 번만 호출된다', () => {
    const handler = vi.fn();
    EventBus.once('once', handler);
    EventBus.emit('once', null);
    EventBus.emit('once', null);
    expect(handler).toHaveBeenCalledOnce();
  });
});
