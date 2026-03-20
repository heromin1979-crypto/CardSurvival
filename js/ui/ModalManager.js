// === MODAL MANAGER ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

const ModalManager = {
  _overlay: null,
  _box:     null,

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._box     = document.getElementById('modal-box');

    if (!this._overlay) return;

    // Close on overlay click
    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && GameState.ui.modalOpen) this.close();
    });

    EventBus.on('openCardInspect', ({ instanceId }) => this.showCardInspect(instanceId));
  },

  open(html, title = '') {
    if (!this._overlay) return;
    this._box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body">${html}</div>
    `;
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;
  },

  close() {
    if (!this._overlay) return;
    this._overlay.classList.remove('open');
    GameState.ui.modalOpen = false;
  },

  confirm(message, onConfirm, onCancel = null) {
    if (!this._overlay) { if (confirm(message)) onConfirm(); return; }
    const id = 'confirm-' + Date.now();
    this._box.innerHTML = `
      <div class="modal-title">${I18n.t('modal.confirm')}</div>
      <div class="modal-body">${message}</div>
      <div class="modal-actions">
        <button class="modal-btn" id="${id}-cancel">${I18n.t('modal.cancel')}</button>
        <button class="modal-btn confirm" id="${id}-ok">${I18n.t('modal.ok')}</button>
      </div>
    `;
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;

    document.getElementById(`${id}-ok`).onclick = () => { this.close(); onConfirm(); };
    document.getElementById(`${id}-cancel`).onclick = () => { this.close(); if (onCancel) onCancel(); };
  },

  showCardInspect(instanceId) {
    const inst = GameState.cards[instanceId];
    if (!inst) return;
    const def  = window.__GAME_DATA__.items[inst.definitionId];
    if (!def)  return;

    const stats = [];
    if (def.weight)             stats.push([I18n.t('modal.weight'), `${def.weight} kg`]);
    if (def.defaultDurability)  stats.push([I18n.t('modal.durability'), `${inst.durability}%`]);
    if (inst.contamination > 0) stats.push([I18n.t('modal.contamination'), `${inst.contamination}%`, 'danger']);
    if (def.onConsume?.hydration) stats.push([I18n.t('modal.hydration'), `+${def.onConsume.hydration}`]);
    if (def.onConsume?.nutrition) stats.push([I18n.t('modal.nutrition'), `+${def.onConsume.nutrition}`]);
    if (def.onConsume?.hp)        stats.push([I18n.t('modal.hpRestore'), `+${def.onConsume.hp}`]);
    if (def.combat) {
      const [dMin, dMax] = def.combat.damage;
      stats.push([I18n.t('modal.damage'), `${dMin}-${dMax}`]);
      stats.push([I18n.t('modal.accuracy'), `${Math.round(def.combat.accuracy * 100)}%`]);
      stats.push([I18n.t('modal.noise'), `+${def.combat.noiseOnUse}`]);
    }

    const statsHtml = stats.map(([k, v, cls]) =>
      `<div class="card-inspect-stat">
        <span>${k}</span>
        <span class="card-inspect-stat-val ${cls ?? ''}">${v}</span>
      </div>`
    ).join('');

    const canConsume  = def.type === 'consumable' && def.onConsume;
    const canDismantle = Array.isArray(def.dismantle) && def.dismantle.length > 0;

    // 분해 재료 미리보기
    let dismantleHtml = '';
    if (canDismantle) {
      const rows = def.dismantle.map(entry => {
        const matDef  = window.__GAME_DATA__.items[entry.definitionId];
        const matName = I18n.itemName(entry.definitionId, matDef?.name ?? entry.definitionId);
        const matIcon = matDef?.icon ?? '📦';
        const pct     = Math.round(entry.chance * 100);
        return `<div class="card-inspect-dismantle-row">
          <span>${matIcon} ${matName} ×${entry.qty}</span>
          <span class="card-inspect-dismantle-chance">${pct}%</span>
        </div>`;
      }).join('');
      dismantleHtml = `
        <div class="card-inspect-dismantle">
          <div class="card-inspect-dismantle-title">${I18n.t('modal.dismantleResult')}</div>
          ${rows}
        </div>`;
    }

    const hasActions = canConsume || canDismantle;

    const html = `
      <div class="card-inspect">
        <div class="card-inspect-art">${def.icon ?? '📦'}</div>
        <div class="card-inspect-info">
          <div class="card-inspect-name">${I18n.itemName(inst.definitionId, def.name)}</div>
          <div class="card-inspect-type">${def.type} · ${def.rarity}</div>
          <p style="font-size:11px;color:var(--text-secondary);margin:8px 0;">${def.description ?? ''}</p>
          <div class="card-inspect-stats">${statsHtml}</div>
          ${dismantleHtml}
          ${hasActions ? `
          <div class="card-inspect-actions">
            ${canConsume    ? `<button class="card-action-btn" id="modal-consume-${instanceId}">${I18n.t('modal.use')}</button>` : ''}
            ${canDismantle  ? `<button class="card-action-btn dismantle" id="modal-dismantle-${instanceId}">${I18n.t('modal.dismantle')}</button>` : ''}
          </div>` : ''}
        </div>
      </div>
    `;

    this.open(html, I18n.t('modal.cardInfo'));

    if (canConsume) {
      document.getElementById(`modal-consume-${instanceId}`)?.addEventListener('click', () => {
        this.close();
        import('../systems/StatSystem.js').then(m => {
          m.default.consumeCard(instanceId);
          EventBus.emit('boardChanged', {});
        });
      });
    }

    if (canDismantle) {
      document.getElementById(`modal-dismantle-${instanceId}`)?.addEventListener('click', () => {
        this.close();
        import('../systems/DismantleSystem.js').then(m => {
          m.default.dismantle(instanceId);
        });
      });
    }
  },
};

export default ModalManager;
