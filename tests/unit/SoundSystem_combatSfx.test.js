// @vitest-environment happy-dom
// === Phase 3 C1 — 전투 타격 사운드 결선 ===
// combatSfx 이벤트가 SoundSystem에 구독되고, kind별 분기가 예외 없이 동작하는지 고정.
// 실제 합성음 재생은 AudioContext 부재 시 조용히 무시되는 기존 계약(try/catch)을 따른다.
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import SoundSystem from '../../js/systems/SoundSystem.js';

describe('SoundSystem combatSfx 결선', () => {
  it('init 시 combatSfx 채널을 구독한다', () => {
    const onSpy = vi.spyOn(EventBus, 'on');
    SoundSystem.init();
    const channels = onSpy.mock.calls.map(([channel]) => channel);
    expect(channels).toContain('combatSfx');
    onSpy.mockRestore();
  });

  it('모든 전투 연출 kind에 대해 예외 없이 처리한다', () => {
    const kinds = [
      { kind: 'playerAttack' },
      { kind: 'playerAttack', fx: 'shot' },
      { kind: 'playerAttack', crit: true },
      { kind: 'playerAttack', miss: true },
      { kind: 'playerAttack', killed: true },
      { kind: 'enemyAttack' },
      { kind: 'companionAttack' },
      { kind: 'enemyAttackCompanion' },
      { kind: 'companionSkill' },
      { kind: 'explode' },
      { kind: 'status' },
      { kind: 'guard' },
      { kind: 'companionHeal' },
      { kind: 'companionBuff' },
      { kind: 'useItem' },
      { kind: 'move' },
      { kind: 'rankSwap' },
      { kind: 'advance' },
      { kind: 'summon' },
      { kind: 'flee' },
      { kind: 'victory' },
      { kind: 'defeat' },
      { kind: 'playerDeath' },
      null,
      {},
    ];
    for (const fx of kinds) {
      expect(() => SoundSystem._playCombatSfx(fx)).not.toThrow();
    }
  });

  it('EventBus 경유로도 동작한다 (구독 라우팅)', () => {
    const spy = vi.spyOn(SoundSystem, '_playCombatSfx');
    EventBus.emit('combatSfx', { kind: 'playerAttack', crit: true });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ kind: 'playerAttack', crit: true }));
    spy.mockRestore();
  });
});

describe('playerSkill combatSfx 라우팅', () => {
  const playedFrequencies = [];
  let previousListeners;

  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
      this.sampleRate = 44100;
    }

    createOscillator() {
      return {
        type: 'sine',
        frequency: {
          setValueAtTime: (frequency) => playedFrequencies.push(frequency),
        },
        connect() {},
        start() {},
        stop() {},
      };
    }

    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      };
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    playedFrequencies.length = 0;
    previousListeners = EventBus._listeners;
    EventBus._listeners = {};
    window.AudioContext = FakeAudioContext;
    SoundSystem.init();
    SoundSystem.setEnabled(true);
    SoundSystem.setVolume(0.3);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    delete window.AudioContext;
    EventBus._listeners = previousListeners;
  });

  it.each([
    ['heal', { kind: 'playerSkill', fx: 'heal', healing: 10 }],
    ['support', { kind: 'playerSkill', fx: 'debuff', healing: 0 }],
  ])('%s playerSkill event는 support/heal 상승음을 재생한다', (_label, fx) => {
    EventBus.emit('combatSfx', fx);
    vi.advanceTimersByTime(70);

    expect(playedFrequencies).toEqual([660, 880]);
  });
});
