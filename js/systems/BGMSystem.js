// === BGM SYSTEM ===
// 외부 음원 파일(assets/audio/)을 루프 재생하는 배경음 시스템.
// 설정(sound.enabled / bgm.enabled / sound.volume)과 연동되며,
// 브라우저 자동재생 정책 때문에 첫 유저 인터랙션에서 재생을 시작한다.

import EventBus        from '../core/EventBus.js';
import SettingsManager from '../core/SettingsManager.js';

// 교체 시 이 경로만 바꾸면 된다.
const BGM_TRACK = 'assets/audio/theme_remix.mp3';

const BGMSystem = {
  _audio: null,
  _enabled: true,
  _bgmVolume: 0.15,
  _settingsBound: false,
  _starterBound: false,

  init() {
    const bgmEnabled   = SettingsManager.get('bgm.enabled')   ?? true;
    const soundEnabled = SettingsManager.get('sound.enabled') ?? true;
    this._enabled = bgmEnabled && soundEnabled;
    this._bgmVolume = (SettingsManager.get('sound.volume') ?? 0.3) * 0.5; // BGM은 SFX의 50%

    if (!this._audio) {
      this._audio = new Audio(BGM_TRACK);
      this._audio.loop = true;
      this._audio.preload = 'auto';
    }
    this._audio.volume = this._bgmVolume;

    this._bindSettings();
    this._bindStarter();

    if (this._enabled) this._tryStart();
  },

  stop() {
    try { this._audio?.pause(); } catch { /* 무시 */ }
  },

  // ── 내부 ─────────────────────────────────────────────────

  _tryStart() {
    if (!this._enabled || !this._audio) return;
    // 자동재생이 차단되면 첫 인터랙션 핸들러가 다시 시도한다.
    const p = this._audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  },

  _bindSettings() {
    if (this._settingsBound) return;
    this._settingsBound = true;

    EventBus.on('settingsChanged', ({ key, value }) => {
      if (key === 'sound.enabled' || key === 'bgm.enabled') {
        const bgm = SettingsManager.get('bgm.enabled')   ?? true;
        const snd = SettingsManager.get('sound.enabled') ?? true;
        this._enabled = bgm && snd;
        if (!this._enabled) this.stop(); else this._tryStart();
      }
      if (key === 'sound.volume') {
        this._bgmVolume = Math.max(0, Math.min(1, value)) * 0.5;
        if (this._audio) this._audio.volume = this._bgmVolume;
      }
    });

    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'game_over') this.stop();
    });
  },

  _bindStarter() {
    if (this._starterBound) return;
    this._starterBound = true;

    const starter = () => {
      this._tryStart();
      document.removeEventListener('click', starter);
      document.removeEventListener('touchstart', starter);
    };
    document.addEventListener('click', starter);
    document.addEventListener('touchstart', starter);
  },
};

export default BGMSystem;
