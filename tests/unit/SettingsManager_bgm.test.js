// P0-1 회귀 — bgm.enabled가 SettingsManager에서 조용히 무시되어
// SettingsModal의 BGM 토글이 무동작이던 버그 방지.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsManager from '../../js/core/SettingsManager.js';
import EventBus from '../../js/core/EventBus.js';

describe('SettingsManager bgm.enabled', () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    });
    SettingsManager.init();
    SettingsManager.set('bgm.enabled', true);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('기본값 true를 반환한다', () => {
    expect(SettingsManager.get('bgm.enabled')).toBe(true);
  });

  it('set이 값을 저장하고 settingsChanged를 발행한다', () => {
    const events = [];
    const off = EventBus.on('settingsChanged', (e) => events.push(e));

    SettingsManager.set('bgm.enabled', false);

    expect(SettingsManager.get('bgm.enabled')).toBe(false);
    expect(events).toContainEqual({ key: 'bgm.enabled', value: false });
    off();
  });

  it('localStorage 왕복 후에도 유지된다', () => {
    SettingsManager.set('bgm.enabled', false);
    SettingsManager.init();
    expect(SettingsManager.get('bgm.enabled')).toBe(false);
  });
});
