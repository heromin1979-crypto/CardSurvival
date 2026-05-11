// === i18n mock ===
// 시뮬에서 라벨은 영문 키 그대로 반환. 실제 게임 I18n.t의 인자 패턴 재현.

export const I18nMock = {
  t(key, vars) {
    if (!vars) return key;
    let out = key;
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  },

  characterName(_id, fallback) {
    return fallback ?? '';
  },

  setLocale(_locale) {
    // noop
  },

  getLocale() {
    return 'ko';
  },
};

export default I18nMock;
