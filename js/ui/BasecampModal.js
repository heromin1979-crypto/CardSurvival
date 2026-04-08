// === BASECAMP MODAL ===
// 베이스캠프 3단계 건설 + 거점 강화 UI
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import I18n          from '../core/I18n.js';
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
      EventBus.on('basecampStageAdvanced', () => { if (this._overlay?.classList.contains('open')) this._render(); });
      EventBus.on('basecampBuilt',         () => { if (this._overlay?.classList.contains('open')) this._render(); });
      EventBus.on('basecampUpgraded',      () => { if (this._overlay?.classList.contains('open')) this._render(); });
      EventBus.on('languageChanged',       () => { if (this._overlay?.classList.contains('open')) this._render(); });
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

    if (!GameState.basecamp.built) {
      this._renderBuildScreen(box);
      return;
    }
    this._renderUpgradeScreen(box);
  },

  // ── 3단계 건설 화면 ────────────────────────────────────────
  _renderBuildScreen(box) {
    const stages    = BasecampSystem.getBuildStages();
    const curStage  = GameState.basecamp.buildStage;
    const day       = GameState.time.day;

    // 단계 진행 바
    const progressHtml = stages.map((s, i) => {
      let cls = 'bc-stage-dot';
      if (i < curStage)  cls += ' done';
      if (i === curStage) cls += ' active';
      return `<div class="${cls}" title="${s.label}">${i < curStage ? '✓' : i + 1}</div>`;
    }).join('<div class="bc-stage-line"></div>');

    const nextStage = stages[curStage];
    const locked    = nextStage && nextStage.minDay > 0 && day < nextStage.minDay;

    let contentHtml = '';
    if (curStage >= stages.length) {
      contentHtml = `<div class="bc-upg-maxed">🏕 건설 완료 — 랜드마크 등록됨</div>`;
    } else if (locked) {
      contentHtml = `<div class="bc-upg-no-effect">
        🔒 ${I18n.t('bcSys.stageLocked', { day: nextStage.minDay, current: day })}
      </div>`;
    } else {
      const check    = BasecampSystem.canAdvanceBuild();
      const costHtml = nextStage.cost.map(req => {
        const def  = window.__GAME_DATA__?.items[req.definitionId];
        const have = GameState.countOnBoard(req.definitionId);
        const ok   = have >= req.qty;
        return `<div class="bc-upg-cost-row${ok ? ' ok' : ' missing'}">
          <span>${def?.icon ?? '📦'} ${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)}</span>
          <span>${have}/${req.qty}</span>
        </div>`;
      }).join('');

      contentHtml = `
        <div class="bc-upg-next-title">${nextStage.icon} ${nextStage.label}</div>
        <div class="bc-upg-next-desc">${nextStage.desc}</div>
        <div class="bc-upg-cost-list">${costHtml}</div>
        <button class="bc-upg-btn${check.ok ? '' : ' disabled'}" id="bc-upg-btn"
          ${check.ok ? '' : 'disabled'}>
          ${check.ok
            ? I18n.t('bcModal.buildStageBtn', { stage: curStage + 1 })
            : I18n.t('bcModal.noMaterial', { reason: check.reason })
          }
        </button>
      `;
    }

    // 완공 후 효과 미리보기
    const previewHtml = `
      <div class="bc-upg-fx-row" style="margin-top:10px;opacity:0.75;font-size:0.82em;">
        ${I18n.t('bcModal.completionPreview')}
      </div>
    `;

    box.innerHTML = `
      <div class="bc-upg-header">
        <span class="bc-upg-title">${I18n.t('bcModal.buildTitle')}</span>
        <button class="bc-upg-close" id="bc-upg-close">✕</button>
      </div>
      <div class="bc-stage-progress">${progressHtml}</div>
      <div class="bc-upg-divider"></div>
      ${contentHtml}
      ${previewHtml}
    `;

    box.querySelector('#bc-upg-close')?.addEventListener('click', () => this.close());
    box.querySelector('#bc-upg-btn')?.addEventListener('click', () => {
      if (BasecampSystem.advanceBuild()) this._render();
    });
  },

  // ── 거점 강화 화면 (완공 후) ──────────────────────────────
  _renderUpgradeScreen(box) {
    const gs     = GameState;
    const level  = gs.basecamp.level;
    const maxLvl = 5;
    const next   = BasecampSystem.getNextUpgrade();
    const fx     = BasecampSystem.getEffects();

    const starsHtml = Array.from({ length: maxLvl }, (_, i) =>
      `<span class="bc-star${i < level ? ' filled' : ''}">${i < level ? '★' : '☆'}</span>`
    ).join('');

    const effectsHtml = `
      <div class="bc-upg-effects">
        <div class="bc-upg-effects-title">${I18n.t('bcModal.effects')}</div>
        ${fx.weatherProtection     ? `<div class="bc-upg-fx-row">🌦 ${I18n.t('bcModal.weatherProtection')}</div>` : ''}
        ${fx.contaminationShield   ? `<div class="bc-upg-fx-row">🛡 ${I18n.t('bcModal.contaminationShield')}</div>` : ''}
        ${fx.encounterReduct   > 0 ? `<div class="bc-upg-fx-row">${I18n.t('bcModal.encounterReduct', { pct: Math.round(fx.encounterReduct*100) })}</div>` : ''}
        ${fx.hpRegenPerTP      > 0 ? `<div class="bc-upg-fx-row">${I18n.t('bcModal.hpRegen', { val: fx.hpRegenPerTP })}</div>` : ''}
        ${fx.fatigueRegenBonus > 0 ? `<div class="bc-upg-fx-row">${I18n.t('bcModal.fatigueReduct', { val: fx.fatigueRegenBonus })}</div>` : ''}
        ${fx.moraleBonus       > 0 ? `<div class="bc-upg-fx-row">${I18n.t('bcModal.moraleBonus', { val: fx.moraleBonus })}</div>` : ''}
        ${fx.noiseDecayBonus   > 0 ? `<div class="bc-upg-fx-row">${I18n.t('bcModal.noiseDecay', { val: fx.noiseDecayBonus })}</div>` : ''}
        ${fx.tempBufferPerTP   > 0 ? `<div class="bc-upg-fx-row">🌡 ${I18n.t('bcModal.tempBuffer', { val: fx.tempBufferPerTP })}</div>` : ''}
      </div>
    `;

    const upgradeSection = level >= maxLvl
      ? `<div class="bc-upg-maxed">${I18n.t('bcModal.maxed')}</div>`
      : this._buildNextSection(next);

    box.innerHTML = `
      <div class="bc-upg-header">
        <span class="bc-upg-title">${I18n.t('bcModal.title')}</span>
        <button class="bc-upg-close" id="bc-upg-close">✕</button>
      </div>
      <div class="bc-upg-level-row">
        <span class="bc-upg-level-text">${I18n.t('bcModal.level', { level })}</span>
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
        <span>${def?.icon ?? '📦'} ${I18n.itemName(req.definitionId, def?.name ?? req.definitionId)}</span>
        <span>${have}/${req.qty}</span>
      </div>`;
    }).join('');

    const check = BasecampSystem.canUpgrade();

    return `
      <div class="bc-upg-next">
        <div class="bc-upg-next-title">${I18n.t('bcModal.next', { icon: next.icon, name: next.name })}</div>
        <div class="bc-upg-next-desc">${next.desc}</div>
        <div class="bc-upg-cost-list">${costHtml}</div>
        <button class="bc-upg-btn${check.ok ? '' : ' disabled'}" id="bc-upg-btn"
          ${check.ok ? '' : 'disabled'}>
          ${check.ok ? I18n.t('bcModal.upgrade') : I18n.t('bcModal.noMaterial', { reason: check.reason })}
        </button>
      </div>
    `;
  },
};

export default BasecampModal;
