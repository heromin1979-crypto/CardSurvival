// === COMBAT RESULT SCREEN ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import StateMachine    from '../core/StateMachine.js';
import I18n            from '../core/I18n.js';
import ExploreSystem   from '../systems/ExploreSystem.js';
import { NODES }       from '../data/nodes.js';
import { getLandmarkData } from '../data/landmarks.js';

const CombatResult = {
  _el:        null,
  _xpTimer:   null,   // setInterval 핸들 — 화면 전환 시 정리

  init() {
    this._el = document.getElementById('screen-combat-result');
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'combat_result') this._render(data);
    });
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _render(data = {}) {
    if (!this._el) return;
    // 이전 XP 애니메이션 타이머 정리
    if (this._xpTimer) { clearInterval(this._xpTimer); this._xpTimer = null; }
    const gs = GameState;
    const outcome = data.outcome ?? gs.combat.outcome ?? 'fled';

    // ── 복귀 장소 결정 (전투 발생 노드, 없으면 기지) ──
    const returnNodeId   = data.nodeId ?? GameState.location.currentDistrict ?? 'mapo';
    const landmarkId     = GameState.location.currentLandmark;
    const landmarkName   = landmarkId ? (getLandmarkData(landmarkId)?.name ?? landmarkId) : null;
    const rawLabel       = NODES[returnNodeId]?.name ?? I18n.t('combatResult.return');
    const btnLabel       = landmarkName ?? I18n.districtName(returnNodeId, rawLabel);

    const titles = {
      victory: I18n.t('combatResult.victory'),
      defeat:  I18n.t('combatResult.defeat'),
      fled:    I18n.t('combatResult.fled'),
    };
    const title  = titles[outcome] ?? I18n.t('combatResult.ended');

    const rewards  = gs.combat.rewards ?? [];
    const xpGained = gs.combat.xpGained ?? 0;
    const playerXp = gs.player.xp ?? 0;
    const lootHtml = rewards.length
      ? `<div class="result-loot-grid">
          ${rewards.map(id => {
            const def  = gs.getCardDef(id);
            const inst = gs.cards[id];
            return `<div class="result-loot-card" data-reward-id="${id}">
              <div class="result-loot-icon">${def?.icon ?? '📦'}</div>
              <div class="result-loot-name">${def?.name ?? I18n.t('combatResult.item')}</div>
              ${(inst?.quantity > 1) ? `<div class="result-loot-qty">x${inst.quantity}</div>` : ''}
            </div>`;
          }).join('')}
        </div>`
      : `<div class="combat-result-no-loot">${I18n.t('combatResult.noLoot')}</div>`;

    const xpHtml = (outcome === 'victory' && xpGained > 0)
      ? `<div class="result-xp-section">
          <div class="result-xp-label">${I18n.t('combatResult.xpLabel')}: <span id="xp-counter">0</span> / +${xpGained} XP</div>
          <progress class="result-xp-track" id="xp-fill" max="${xpGained}" value="0"></progress>
        </div>`
      : '';

    this._el.innerHTML = `
      <div class="combat-result-shell" data-outcome="${outcome}">
        <header class="combat-result-header">
          <div class="combat-result-header-rule" aria-hidden="true"></div>
          <h1 class="result-title">${title}</h1>
          <div class="combat-result-header-rule" aria-hidden="true"></div>
        </header>
        <div class="combat-result-content">
          <section class="combat-result-overview" aria-label="${title}">
            <div class="combat-result-stat">
              <span class="combat-result-stat-label">HP</span>
              <strong class="combat-result-stat-value">${Math.round(gs.player.hp.current)} / ${gs.player.hp.max}</strong>
            </div>
            <div class="combat-result-stat">
              <span class="combat-result-stat-label">${I18n.t('combatResult.totalXp')}</span>
              <strong class="combat-result-stat-value">${playerXp}</strong>
            </div>
          </section>
          <section class="combat-result-rewards">
            <div class="combat-result-section-label">${I18n.t('combatResult.loot')}</div>
            ${xpHtml}
            ${lootHtml}
          </section>
        </div>
        <footer class="combat-result-actions">
          <button class="toolbar-btn combat-result-return" id="res-continue">${I18n.t('combatResult.returnTo', { name: btnLabel })}</button>
        </footer>
      </div>
    `;

    if (outcome === 'victory' && xpGained > 0) this._animateXp(xpGained);

    this._el.querySelector('#res-continue')?.addEventListener('click', () => {
      ExploreSystem.arriveAfterCombat(returnNodeId);
      StateMachine.transition('main');
    });
  },

  _animateXp(gained) {
    const counter = this._el?.querySelector('#xp-counter');
    const fill    = this._el?.querySelector('#xp-fill');
    if (!counter || !fill) return;

    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      counter.textContent = gained;
      fill.value = gained;
      return;
    }

    let current = 0;
    const step  = Math.max(1, Math.ceil(gained / 30));
    this._xpTimer = setInterval(() => {
      current = Math.min(current + step, gained);
      counter.textContent = current;
      fill.value = current;
      if (current >= gained) { clearInterval(this._xpTimer); this._xpTimer = null; }
    }, 40);
  },
};

export default CombatResult;
