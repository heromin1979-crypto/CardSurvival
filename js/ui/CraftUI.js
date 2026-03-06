// === CRAFT UI ===
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import CraftSystem from '../systems/CraftSystem.js';
import BLUEPRINTS  from '../data/blueprints.js';

const CraftUI = {
  _panel: null,
  _selectedBp: null,

  _listenersRegistered: false,

  init() {
    if (!this._listenersRegistered) {
      this._listenersRegistered = true;
      EventBus.on('tpAdvance',    () => { if (GameState.ui.basecampMode === 'CRAFT') this.renderQueue(); });
      EventBus.on('craftComplete',() => this.render());
      EventBus.on('craftStarted', () => this.renderQueue());
      EventBus.on('boardChanged', () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('cardPlaced',   () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
      EventBus.on('cardRemoved',  () => { if (GameState.ui.basecampMode === 'CRAFT') this.render(); });
    }
    // Panel is set from Basecamp when opening the craft modal
    // Do not auto-render here; render() guard checks basecampMode
  },

  render() {
    if (!this._panel) return;
    if (GameState.ui.basecampMode !== 'CRAFT') return;

    this._panel.innerHTML = `
      <div class="craft-panel">
        <div style="font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
          블루프린트
        </div>
        ${this._renderBlueprintList()}
        ${this._renderQueue()}
      </div>
    `;

    // Attach click handlers
    this._panel.querySelectorAll('.blueprint-item').forEach(el => {
      el.addEventListener('click', () => {
        this._selectedBp = el.dataset.bpId;
        this.render();
      });
    });

    const startBtn = this._panel.querySelector('#craft-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (this._selectedBp) {
          CraftSystem.startBlueprint(this._selectedBp);
          this.render();
        }
      });
    }
  },

  _renderBlueprintList() {
    return Object.values(BLUEPRINTS).map(bp => {
      const isSelected = this._selectedBp === bp.id;
      const check      = CraftSystem.canStartBlueprint(bp.id);

      const reqs = bp.stages[0].requiredItems.map(req => {
        const def   = window.__GAME_DATA__.items[req.definitionId];
        const count = GameState.countOnBoard(req.definitionId);
        const met   = count >= req.qty;
        return `<div class="blueprint-req ${met ? 'met' : 'unmet'}">
          ${def?.name ?? req.definitionId} ×${req.qty}
          <span>${count}/${req.qty}</span>
        </div>`;
      }).join('');

      return `
        <div class="blueprint-item ${isSelected ? 'selected' : ''}" data-bp-id="${bp.id}">
          <div class="blueprint-name">${bp.name}</div>
          <div class="blueprint-cost">${bp.stages.map(s => `${s.label} (${s.tpCost}TP)`).join(' → ')}</div>
          ${isSelected ? `
            <div class="blueprint-req-list">${reqs}</div>
            ${check.ok
              ? `<button class="toolbar-btn" id="craft-start-btn" style="margin-top:6px;width:100%">제작 시작</button>`
              : `<div style="font-size:9px;color:var(--text-danger);margin-top:4px;">${check.reason}</div>`
            }
          ` : ''}
        </div>
      `;
    }).join('');
  },

  _renderQueue() {
    const queue = GameState.crafting.activeQueue;
    if (!queue.length) return `<div class="craft-queue-label" style="margin-top:12px;">작업 큐 비어 있음</div>`;

    const items = queue.map((entry, i) => {
      const bp      = BLUEPRINTS[entry.blueprintId];
      const stage   = bp?.stages[entry.stageIndex];
      const pct     = CraftSystem.getQueueProgress(entry) * 100;

      return `
        <div class="craft-queue-item">
          <div class="craft-queue-item-name">
            ${bp?.name ?? entry.blueprintId}
            <span style="color:var(--text-dim);font-size:9px;"> — ${stage?.label ?? ''}</span>
          </div>
          <div class="craft-progress-track">
            <div class="craft-progress-fill" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <div style="font-size:9px;color:var(--text-dim);margin-top:2px;">
            ${entry.tpRemaining} TP 남음
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="craft-queue" style="margin-top:12px;">
        <div class="craft-queue-label">작업 큐 (${queue.length}/${GameState.crafting.maxQueueSize})</div>
        ${items}
      </div>
    `;
  },

  renderQueue() {
    // Lightweight update: just re-render the queue part
    const queueEl = this._panel?.querySelector('.craft-queue');
    if (queueEl) queueEl.outerHTML = this._renderQueue();
    else this.render();
  },
};

export default CraftUI;
