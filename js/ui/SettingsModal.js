// === SETTINGS MODAL ===
import EventBus        from '../core/EventBus.js';
import SettingsManager from '../core/SettingsManager.js';
import I18n            from '../core/I18n.js';
import SoundSystem     from '../systems/SoundSystem.js';

const SettingsModal = {
  _el: null,

  init() {
    this._el = document.getElementById('settings-modal');
    if (!this._el) return;

    // 배경 클릭으로 닫기
    this._el.addEventListener('click', e => {
      if (e.target === this._el) this.close();
    });

    // 언어 변경 시 모달 내부 재렌더
    EventBus.on('languageChanged', () => {
      if (this._el.classList.contains('active')) this._render();
    });
  },

  open() {
    this._render();
    this._el.classList.add('active');
  },

  close() {
    this._el.classList.remove('active');
  },

  _render() {
    const t       = k => I18n.t(k);
    const lang    = SettingsManager.get('language');
    const sndOn   = SettingsManager.get('sound.enabled');
    const vol     = Math.round(SettingsManager.get('sound.volume') * 100);

    this._el.innerHTML = `
      <div class="settings-box">
        <div class="settings-header">
          <span class="settings-title">${t('settings.title')}</span>
          <button class="settings-close-btn" id="settings-close">✕</button>
        </div>

        <div class="settings-section">
          <div class="settings-label">${t('settings.language')}</div>
          <div class="settings-lang-toggle">
            <button class="settings-lang-btn${lang === 'ko' ? ' active' : ''}" data-lang="ko">한국어</button>
            <button class="settings-lang-btn${lang === 'en' ? ' active' : ''}" data-lang="en">English</button>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">${t('settings.sound')}</div>
          <div class="settings-sound-row">
            <span class="settings-sound-label">${t('settings.mute')}</span>
            <button class="settings-toggle-btn${sndOn ? '' : ' active'}" id="settings-mute">
              ${sndOn ? t('settings.off') : t('settings.on')}
            </button>
          </div>
          <div class="settings-sound-row">
            <span class="settings-sound-label">${t('settings.volume')}</span>
            <input type="range" class="settings-volume-slider" id="settings-volume"
                   min="0" max="100" value="${vol}" ${sndOn ? '' : 'disabled'}>
            <span class="settings-volume-val" id="settings-vol-val">${vol}%</span>
          </div>
        </div>

        <button class="settings-done-btn" id="settings-done">${t('settings.close')}</button>
      </div>
    `;

    this._bind();
  },

  _bind() {
    // 닫기
    this._el.querySelector('#settings-close')?.addEventListener('click', () => this.close());
    this._el.querySelector('#settings-done')?.addEventListener('click', () => this.close());

    // 언어 토글
    this._el.querySelectorAll('.settings-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SettingsManager.set('language', btn.dataset.lang);
      });
    });

    // 음소거 토글
    this._el.querySelector('#settings-mute')?.addEventListener('click', () => {
      const current = SettingsManager.get('sound.enabled');
      SettingsManager.set('sound.enabled', !current);
      SoundSystem.setEnabled(!current);
      this._render();
    });

    // 볼륨 슬라이더
    const slider = this._el.querySelector('#settings-volume');
    const valEl  = this._el.querySelector('#settings-vol-val');
    slider?.addEventListener('input', () => {
      const v = parseInt(slider.value, 10) / 100;
      SettingsManager.set('sound.volume', v);
      SoundSystem.setVolume(v);
      if (valEl) valEl.textContent = slider.value + '%';
    });
  },
};

export default SettingsModal;
