// === BASECAMP MODAL ===
// 거점 강화 UI
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import BasecampSystem from '../systems/BasecampSystem.js';

const BasecampModal = {
  _initialized: false,
  _overlay:     null,

  init() {
    this._overlay = document.getElementById('basecamp-upgrade-modal');
    if (!this._overlay) return;

    if (!this._initialized) {
      this._initialized = true;
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this._overlay?.classList.contains('open')) this.close();
      });
      EventBus.on('basecampUpgraded', () => {
        if (this._overlay?.classList.contains('open')) this._render();
      });
    }

    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });
  },

  open() {
    if (!this._initialized) this.init();
    this._render();
    this._overlay?.classList.add('open');
  },

  close() {
    this._overlay?.classList.remove('open');
  },

  _render() {
    const box = this._overlay?.querySelector('.bc-upgrade-modal-box');
    if (!box) return;

    const gs     = GameState;
    const level  = gs.basecamp.level;
    const maxLvl = 5;
    const next   = BasecampSystem.getNextUpgrade();
    const fx     = BasecampSystem.getEffects();

    const starsHtml = Array.from({ length: maxLvl }, (_, i) =>
      `<span class="bc-star${i < level ? ' filled' : ''}">${i < level ? '★' : '☆'}</span>`
    ).join('');

    const effectsHtml = level > 0 ? `
      <div class="bc-upg-effects">
        <div class="bc-upg-effects-title">현재 효과</div>
        ${fx.encounterReduct   > 0 ? `<div class="bc-upg-fx-row">⚔ 조우 확률 <span>-${Math.round(fx.encounterReduct*100)}%</span></div>` : ''}
        ${fx.hpRegenPerTP      > 0 ? `<div class="bc-upg-fx-row">❤ HP 재생 <span>+${fx.hpRegenPerTP}/TP</span></div>` : ''}
        ${fx.fatigueRegenBonus > 0 ? `<div class="bc-upg-fx-row">💤 피로 감소 <span>-${fx.fatigueRegenBonus}/TP</span></div>` : ''}
        ${fx.moraleBonus       > 0 ? `<div class="bc-upg-fx-row">😊 사기 <span>+${fx.moraleBonus}/TP</span></div>` : ''}
        ${fx.noiseDecayBonus   > 0 ? `<div class="bc-upg-fx-row">🔇 소음 감쇠 <span>+${fx.noiseDecayBonus}/TP</span></div>` : ''}
      </div>
    ` : '<div class="bc-upg-no-effect">거점 강화를 시작하세요.</div>';

    const upgradeSection = level >= maxLvl
      ? `<div class="bc-upg-maxed">🏰 완전 요새화 달성!</div>`
      : this._buildNextSection(next);

    box.innerHTML = `
      <div class="bc-upg-header">
        <span class="bc-upg-title">🏕 거점 강화</span>
        <button class="bc-upg-close" id="bc-upg-close">✕</button>
      </div>
      <div class="bc-upg-level-row">
        <span class="bc-upg-level-text">거점 등급 Lv.${level}</span>
        <div class="bc-stars">${starsHtml}</div>
      </div>
      ${effectsHtml}
      <div class="bc-upg-divider"></div>
      ${upgradeSection}
    `;

    box.querySelector('#bc-upg-close')?.addEventListener('click', () => this.close());
    box.querySelector('#bc-upg-btn')?.addEventListener('click', () => {
      BasecampSystem.upgrade();
    });
  },

  _buildNextSection(next) {
    const costHtml = next.cost.map(req => {
      const def  = window.__GAME_DATA__?.items[req.definitionId];
      const have = GameState.countOnBoard(req.definitionId);
      const ok   = have >= req.qty;
      return `<div class="bc-upg-cost-row${ok ? ' ok' : ' missing'}">
        <span>${def?.icon ?? '📦'} ${def?.name ?? req.definitionId}</span>
        <span>${have}/${req.qty}</span>
      </div>`;
    }).join('');

    const check = BasecampSystem.canUpgrade();

    return `
      <div class="bc-upg-next">
        <div class="bc-upg-next-title">${next.icon} 다음: ${next.name}</div>
        <div class="bc-upg-next-desc">${next.desc}</div>
        <div class="bc-upg-cost-list">${costHtml}</div>
        <button class="bc-upg-btn${check.ok ? '' : ' disabled'}" id="bc-upg-btn"
          ${check.ok ? '' : 'disabled'}>
          ${check.ok ? '거점 강화' : `재료 부족: ${check.reason}`}
        </button>
      </div>
    `;
  },
};

export default BasecampModal;
