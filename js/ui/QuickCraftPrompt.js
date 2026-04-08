// === QUICK CRAFT PROMPT ===
// 카드를 겹쳤을 때 가능한 제작 레시피를 보여주는 팝업.

import EventBus      from '../core/EventBus.js';
import CraftSystem   from '../systems/CraftSystem.js';
import CraftDiscovery from '../systems/CraftDiscovery.js';
import I18n          from '../core/I18n.js';

const QuickCraftPrompt = {
  _overlay: null,

  /**
   * 두 카드의 조합으로 가능한 레시피 프롬프트를 표시.
   * @param {string} srcDefId
   * @param {string} tgtDefId
   */
  show(srcDefId, tgtDefId) {
    const recipes = CraftDiscovery.findRecipes(srcDefId, tgtDefId)
      .filter(r => r.canStartNow);
    if (recipes.length === 0) return;

    this._removeOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'quick-craft-overlay';
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this._removeOverlay();
    });

    const panel = document.createElement('div');
    panel.className = 'quick-craft-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'qc-title-label');

    panel.innerHTML = `
      <div class="qc-title" id="qc-title-label">⚒ ${I18n.t('quickCraft.title')}</div>
      <div class="qc-recipes">
        ${recipes.map((r, i) => this._renderRecipe(r, i)).join('')}
      </div>
      <button class="qc-close-btn">${I18n.t('quickCraft.close')}</button>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this._overlay = overlay;

    // Escape 키로 닫기
    this._escHandler = (e) => { if (e.key === 'Escape') this._removeOverlay(); };
    document.addEventListener('keydown', this._escHandler);

    // 첫 번째 버튼에 포커스
    requestAnimationFrame(() => {
      const firstBtn = panel.querySelector('button:not([disabled])');
      if (firstBtn) firstBtn.focus();
    });

    // 이벤트 바인딩
    panel.querySelector('.qc-close-btn')
      .addEventListener('click', () => this._removeOverlay());

    panel.querySelectorAll('.qc-craft-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bpId = btn.dataset.bpId;
        const success = CraftSystem.startBlueprint(bpId);
        if (success) {
          this._removeOverlay();
        }
      });
    });

    // 레시피 상세 버튼 → CraftUI 필터로 이동
    panel.querySelectorAll('.qc-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._removeOverlay();
        EventBus.emit('openCraftFilter', { blueprintIds: [btn.dataset.bpId] });
      });
    });
  },

  _renderRecipe(recipe, index) {
    const output = recipe.outputPreview
      .map(o => `<span class="qc-output-item">${o.icon} ${o.name}${o.qty > 1 ? ` ×${o.qty}` : ''}</span>`)
      .join('');

    const missingHtml = recipe.missingItems.length > 0
      ? `<div class="qc-missing">
           <span class="qc-missing-label">${I18n.t('quickCraft.missingLabel')}</span>
           ${recipe.missingItems.map(m =>
             `<span class="qc-missing-item">${m.icon} ${m.name} (${m.have}/${m.need})</span>`
           ).join('')}
         </div>`
      : '';

    const canStart = recipe.canStartNow;
    const tpText = `${recipe.totalTP}TP`;

    return `
      <div class="qc-recipe${canStart ? ' qc-ready' : ''}">
        <div class="qc-recipe-header">
          <span class="qc-recipe-name">${recipe.blueprintName}</span>
          <span class="qc-recipe-tp">${tpText}</span>
        </div>
        <div class="qc-recipe-output">${output}</div>
        ${missingHtml}
        <div class="qc-recipe-actions">
          <button class="qc-craft-btn${canStart ? '' : ' disabled'}"
                  data-bp-id="${recipe.blueprintId}"
                  ${canStart ? '' : 'disabled'}>
            ${canStart ? I18n.t('quickCraft.start') : I18n.t('quickCraft.cantStart')}
          </button>
          <button class="qc-detail-btn" data-bp-id="${recipe.blueprintId}">
            ${I18n.t('quickCraft.detail')}
          </button>
        </div>
      </div>
    `;
  },

  _removeOverlay() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },
};

export default QuickCraftPrompt;
