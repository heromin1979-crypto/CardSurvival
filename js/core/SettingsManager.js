// === SETTINGS MANAGER ===
// 게임 설정(언어, 사운드) 관리 + localStorage 영속화
import EventBus from './EventBus.js';

const STORAGE_KEY = 'CARD_SURVIVAL_SETTINGS_v1';

const DEFAULTS = {
  language: 'ko',
  sound: { enabled: true, volume: 0.3 },
};

let _settings = { language: DEFAULTS.language, sound: { ...DEFAULTS.sound } };

const SettingsManager = {
  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        _settings = {
          language: saved.language ?? DEFAULTS.language,
          sound: {
            enabled: saved.sound?.enabled ?? DEFAULTS.sound.enabled,
            volume:  saved.sound?.volume  ?? DEFAULTS.sound.volume,
          },
        };
      } catch { /* corrupted → use defaults */ }
    }
  },

  get(key) {
    if (key === 'language')      return _settings.language;
    if (key === 'sound.enabled') return _settings.sound.enabled;
    if (key === 'sound.volume')  return _settings.sound.volume;
    return undefined;
  },

  set(key, value) {
    if (key === 'language')           _settings.language = value;
    else if (key === 'sound.enabled') _settings.sound.enabled = !!value;
    else if (key === 'sound.volume')  _settings.sound.volume = Math.max(0, Math.min(1, value));
    else return;

    this._save();
    EventBus.emit('settingsChanged', { key, value });
  },

  getAll() {
    return { language: _settings.language, sound: { ..._settings.sound } };
  },

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
  },
};

export default SettingsManager;
