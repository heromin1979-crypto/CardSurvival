// === SECRET GALLERY TAB ===
// Displays discovered secret combinations, hints, and unknown combos.

import EventBus                from '../core/EventBus.js';
import GameState               from '../core/GameState.js';
import I18n                    from '../core/I18n.js';
import SecretCombinationSystem from '../systems/SecretCombinationSystem.js';
import SECRET_COMBINATIONS     from '../data/secretCombinations.js';
import GameData                from '../data/GameData.js';

const SecretGalleryTab = {
  _overlay: null,

  init() {
    EventBus.on('openSecretGallery', () => this.open());
  },

  open() {
    if (this._overlay) this._close();

    this._overlay = document.createElement('div');
    this._overlay.className = 'modal-overlay open';
    this._overlay.id = 'secret-gallery-modal';
    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this._close();
    });

    const box = document.createElement('div');
    box.className = 'modal-box secret-gallery-box';
    box.innerHTML = this._render();
    this._overlay.appendChild(box);
    document.body.appendChild(this._overlay);

    // Close button
    box.querySelector('#secret-gallery-close')?.addEventListener('click', () => this._close());

    // Escape key
    this._escHandler = e => { if (e.key === 'Escape') this._close(); };
    document.addEventListener('keydown', this._escHandler);
  },

  _close() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  _render() {
    const progress = SecretCombinationSystem.getProgress();
    const hints = SecretCombinationSystem.getUnlockedHints();
    const found = GameState.discoveries?.foundCombinations ?? [];
    const hintIds = (GameState.discoveries?.unlockedHints ?? []);
    const items = GameData?.items ?? {};

    const pct = progress.total > 0 ? Math.round((progress.found / progress.total) * 100) : 0;

    // Build combo list
    const comboListHtml = SECRET_COMBINATIONS.map(combo => {
      const isFound = found.includes(combo.id);
      const hasHint = hintIds.includes(combo.id);

      if (isFound) {
        // Discovered — show full info
        const srcDef = items[combo.source?.id];
        const tgtDef = items[combo.target?.id];
        const resultDef = combo.result?.spawnItem ? items[combo.result.spawnItem] : null;
        const icon = resultDef?.icon ?? '?';
        const srcName = srcDef ? I18n.itemName(srcDef.id, srcDef.name) : (combo.source?.tag ?? '?');
        const tgtName = tgtDef ? I18n.itemName(tgtDef.id, tgtDef.name) : (combo.target?.tag ?? '?');
        return `
          <div class="sg-combo-card sg-found">
            <div class="sg-combo-icon">${icon}</div>
            <div class="sg-combo-info">
              <div class="sg-combo-name">${combo.name}</div>
              <div class="sg-combo-recipe">${srcName} + ${tgtName}</div>
            </div>
            <div class="sg-combo-badge sg-badge-found">${I18n.t('secret.discovered')}</div>
          </div>`;
      }

      if (hasHint) {
        // Hint unlocked but not yet discovered
        const hintEntry = hints.find(h => h.id === combo.id);
        return `
          <div class="sg-combo-card sg-hint">
            <div class="sg-combo-icon">?</div>
            <div class="sg-combo-info">
              <div class="sg-combo-name">???</div>
              <div class="sg-combo-hint">${hintEntry?.hint ?? combo.hint}</div>
            </div>
            <div class="sg-combo-badge sg-badge-hint">${I18n.t('secret.hintOnly')}</div>
          </div>`;
      }

      // Unknown
      return `
        <div class="sg-combo-card sg-unknown">
          <div class="sg-combo-icon">?</div>
          <div class="sg-combo-info">
            <div class="sg-combo-name">???</div>
          </div>
          <div class="sg-combo-badge sg-badge-unknown">${I18n.t('secret.unknown')}</div>
        </div>`;
    }).join('');

    return `
      <div class="sg-header">
        <span class="sg-title">${I18n.t('secret.galleryTitle')}</span>
        <button class="equip-modal-close" id="secret-gallery-close">${I18n.t('equip.close')}</button>
      </div>
      <div class="sg-progress">
        <span>${I18n.t('secret.progress', { found: progress.found, total: progress.total })}</span>
        <div class="sg-progress-bar">
          <div class="sg-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="sg-combo-list">
        ${comboListHtml}
      </div>
    `;
  },
};

export default SecretGalleryTab;
