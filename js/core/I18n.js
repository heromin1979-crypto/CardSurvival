// === I18N (Internationalization) ===
// Template-based translation system with data name overrides
import EventBus from './EventBus.js';
import SettingsManager from './SettingsManager.js';
import { ko, en } from '../data/locales.js';

const translations = { ko, en };
let _lang = 'ko';

const I18n = {
  init() {
    _lang = SettingsManager.get('language') ?? 'ko';
    EventBus.on('settingsChanged', ({ key, value }) => {
      if (key === 'language') {
        _lang = value;
        EventBus.emit('languageChanged', { language: value });
      }
    });
  },

  /** Translate UI string with optional template params: t('key', { name: 'value' }) */
  t(key, params) {
    const dict = translations[_lang] ?? translations.ko;
    let str = dict[key] ?? translations.ko[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, v ?? '');
      }
    }
    return str;
  },

  /** Get item display name — uses en override if available, else Korean fallback */
  itemName(id, koName) {
    if (_lang !== 'ko') {
      const val = translations[_lang]?.[`_item.${id}`];
      if (val) return val;
    }
    return koName ?? id;
  },

  /** Get district display name */
  districtName(id, koName) {
    if (_lang !== 'ko') {
      const val = translations[_lang]?.[`_district.${id}`];
      if (val) return val;
    }
    return koName ?? id;
  },

  /** Get character display name */
  characterName(id, koName) {
    if (_lang !== 'ko') {
      const val = translations[_lang]?.[`_character.${id}`];
      if (val) return val;
    }
    return koName ?? id;
  },

  /** Get enemy display name */
  enemyName(id, koName) {
    if (_lang !== 'ko') {
      const val = translations[_lang]?.[`_enemy.${id}`];
      if (val) return val;
    }
    return koName ?? id;
  },

  /** Get blueprint display name */
  blueprintName(id, koName) {
    if (_lang !== 'ko') {
      const val = translations[_lang]?.[`_blueprint.${id}`];
      if (val) return val;
    }
    return koName ?? id;
  },

  getLang() { return _lang; },
};

export default I18n;
