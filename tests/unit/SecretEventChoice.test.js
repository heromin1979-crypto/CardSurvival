import { describe, expect, it } from 'vitest';
import EventBus from '../../js/core/EventBus.js';

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
