import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus   from '../../js/core/EventBus.js';
import GameState  from '../../js/core/GameState.js';
import TickEngine from '../../js/core/TickEngine.js';

function resetState() {
  GameState.time.totalTP  = 0;
  GameState.time.day      = 1;
  GameState.time.tpInDay  = 0;
  GameState.time.hour     = 6;
  GameState.time.isPaused = false;
  EventBus._listeners     = {};
}

beforeEach(resetState);

describe('TickEngine.skipTP — 기본 진행', () => {
  it('skipTP(1)은 totalTP를 1 증가시킨다', () => {
    TickEngine.skipTP(1);
    expect(GameState.time.totalTP).toBe(1);
  });

  it('skipTP(1)은 tpInDay를 1 증가시킨다', () => {
    TickEngine.skipTP(1);
    expect(GameState.time.tpInDay).toBe(1);
  });

  it('skipTP(5)는 totalTP를 5 증가시킨다', () => {
    TickEngine.skipTP(5);
    expect(GameState.time.totalTP).toBe(5);
  });
});

describe('TickEngine.skipTP — 날짜 전환', () => {
  it('tpInDay가 72에 도달하면 day가 1 증가하고 tpInDay가 리셋된다', () => {
    TickEngine.skipTP(72);
    expect(GameState.time.day).toBe(2);
    expect(GameState.time.tpInDay).toBe(0);
  });

  it('tpInDay가 72를 넘으면 나머지가 다음 날로 이어진다', () => {
    TickEngine.skipTP(73);
    expect(GameState.time.day).toBe(2);
    expect(GameState.time.tpInDay).toBe(1);
  });
});

describe('TickEngine.skipTP — 이벤트 발행', () => {
  it('tpAdvance 이벤트가 n번 emit된다', () => {
    const handler = vi.fn();
    EventBus.on('tpAdvance', handler);
    TickEngine.skipTP(3);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('tpAdvance 이벤트에 totalTP가 포함된다', () => {
    const events = [];
    EventBus.on('tpAdvance', (d) => events.push(d));
    TickEngine.skipTP(2);
    expect(events[0]).toHaveProperty('totalTP');
    expect(events[1]).toHaveProperty('totalTP');
  });

  it('notify 이벤트가 최소 1번 emit된다', () => {
    const handler = vi.fn();
    EventBus.on('notify', handler);
    TickEngine.skipTP(1);
    expect(handler).toHaveBeenCalled();
  });
});

describe('TickEngine.setPaused', () => {
  it('setPaused(true)는 isPaused를 true로 설정한다', () => {
    TickEngine.setPaused(true);
    expect(GameState.time.isPaused).toBe(true);
  });

  it('setPaused(false)는 isPaused를 false로 복원한다', () => {
    GameState.time.isPaused = true;
    TickEngine.setPaused(false);
    expect(GameState.time.isPaused).toBe(false);
  });
});
