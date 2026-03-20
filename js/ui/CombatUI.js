// === COMBAT UI (v2 — 좌: 시각 / 우: 패널) ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import CombatSystem from '../systems/CombatSystem.js';
import I18n        from '../core/I18n.js';

const BATTLE_BG    = './assets/images/battle_bg.jpg';
const PLAYER_IMG_M = './assets/images/player_M.jpg';
const PLAYER_IMG_F = './assets/images/player_F.jpg';

const CombatUI = {
  _screen: null,

  init() {
    this._screen = document.getElementById('screen-combat');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'combat') this.render();
    });
  },

  render() {
    const gs     = GameState;
    const combat = gs.combat;
    if (!combat.enemies?.length || !this._screen) return;

    const hpPct   = (gs.player.hp.current / gs.player.hp.max) * 100;
    const hpClass = hpPct < 25 ? 'crit' : hpPct < 50 ? 'low' : '';

    // ── 상태이상 배지 ──
    const playerStatusHtml = combat.playerStatus.map(s =>
      `<span class="status-badge">${s.name}(${s.duration})</span>`
    ).join('');
    const enemyStatusHtml = combat.enemyStatus.map(s =>
      `<span class="status-badge enemy">${s.name}(${s.duration})</span>`
    ).join('');

    // ── 왼쪽: 적 스프라이트 (HP 오버레이 포함) ──
    const enemyCount       = combat.enemies.length;
    const aliveCount       = combat.enemies.filter(e => e.currentHp > 0).length;
    const enemySpritesHtml = combat.enemies.map((enemy, i) => {
      const isDead   = enemy.currentHp <= 0;
      const isTarget = i === combat.targetIndex && !isDead;
      const eHpPct   = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
      const eHpClass = eHpPct < 25 ? 'crit' : eHpPct < 50 ? 'low' : '';

      const spriteHtml = enemy.image
        ? `<img class="cv-enemy-img" src="${enemy.image}" alt="${enemy.name}">`
        : `<div class="cv-enemy-icon">${enemy.icon ?? '👾'}</div>`;

      return `
        <div class="cv-enemy-sprite${isTarget ? ' is-target' : ''}${isDead ? ' is-dead' : ''}"
             data-idx="${i}">
          ${spriteHtml}
          <div class="cv-hp-overlay">
            <div class="cv-hp-name">${I18n.enemyName(enemy.id ?? enemy.definitionId, enemy.name)}${isDead ? ' 💀' : isTarget ? ' ◀' : ''}</div>
            <div class="cv-hp-bar-track">
              <div class="cv-hp-bar-fill ${eHpClass}" style="width:${eHpPct.toFixed(1)}%"></div>
            </div>
            <div class="cv-hp-text">${Math.max(0, enemy.currentHp)} / ${enemy.maxHp}</div>
          </div>
        </div>`;
    }).join('');

    // ── 무기 버튼 ──
    const weapons    = CombatSystem.getAvailableWeapons();
    const weaponBtns = weapons.map(w => {
      const def     = GameState.getCardDef(w.instanceId);
      const critStr = def?.combat?.critChance
        ? `<span class="btn-sub">${I18n.t('combat.crit', { pct: Math.round(def.combat.critChance * 100) })}</span>`
        : '';
      return `<button class="combat-action-btn" data-action="attack" data-weapon="${w.instanceId}">
        ${def?.icon ?? '⚔'} ${I18n.itemName(def?.id ?? GameState.cards[w.instanceId]?.definitionId, def?.name ?? I18n.t('combat.weapon'))} ${critStr}
      </button>`;
    }).join('');

    // ── 의료 버튼 ──
    const medicals    = CombatSystem.getAvailableMedicals();
    const medicalBtns = medicals.map(m => {
      const def = GameState.getCardDef(m.instanceId);
      return `<button class="combat-action-btn medical" data-action="useItem" data-weapon="${m.instanceId}">
        ${def?.icon ?? '💊'} ${I18n.itemName(def?.id ?? GameState.cards[m.instanceId]?.definitionId, def?.name ?? I18n.t('combat.item'))}
      </button>`;
    }).join('');

    // ── 전투 로그 ──
    const LOG_CLS = [
      [I18n.t('combat.logCrit'),     'crit'],
      [I18n.t('combat.logAttack'),   'hit'],
      [I18n.t('combat.logEnemyAtk'), 'dmg'],
      [I18n.t('combat.logBleed'),    'bleed'], [I18n.t('combat.logAcid'),  'bleed'],
      [I18n.t('combat.logStun'),     'warn'],  [I18n.t('combat.logSmash'), 'warn'],
      [I18n.t('combat.logItem'),     'heal'],
      [I18n.t('combat.logStealth'),  'info'],  [I18n.t('combat.logFlee'), 'info'],
    ];
    const getLogCls = l => (LOG_CLS.find(([prefix]) => l.startsWith(prefix)) ?? ['', 'info'])[1];
    const logHtml   = combat.log.slice(-10).map(l =>
      `<div class="combat-log-entry ${getLogCls(l)}">${l}</div>`
    ).join('');

    // ══════════════════════════════════════════
    this._screen.innerHTML = `
      <div class="combat-wrap">

        <!-- ① 왼쪽: 시각 필드 (적·플레이어 HP 포함) -->
        <div class="combat-visual" style="background-image:url('${BATTLE_BG}')">
          <!-- 적 스프라이트 + HP 오버레이 -->
          <div class="cv-enemies count-${enemyCount}">
            ${enemySpritesHtml}
          </div>
          <!-- 플레이어 스프라이트 + HP -->
          <div class="cv-player">
            <div class="cv-player-info">
              <div class="cv-hp-name">${gs.player.name}</div>
              <div class="cv-hp-bar-track">
                <div class="cv-hp-bar-fill ${hpClass}" style="width:${hpPct.toFixed(1)}%"></div>
              </div>
              <div class="cv-hp-text ${hpClass}">${gs.player.hp.current} / ${gs.player.hp.max}</div>
              ${playerStatusHtml ? `<div class="cp-status-row" style="margin-top:3px;">${playerStatusHtml}</div>` : ''}
            </div>
            <img class="cv-player-img" src="${gs.player.gender === 'F' ? PLAYER_IMG_F : PLAYER_IMG_M}" alt="${gs.player.name}">
          </div>
        </div>

        <!-- ② 오른쪽: 전투 패널 (행동 + 로그) -->
        <div class="combat-panel">

          <!-- 헤더 -->
          <div class="cp-header">
            <span class="cp-title">${I18n.t('combat.round', { round: combat.round })}</span>
            <span class="cp-noise">${I18n.t('combat.noiseEnemy', { noise: Math.round(gs.noise.level), alive: aliveCount, total: enemyCount })}</span>
          </div>

          <!-- 행동 -->
          <div class="cp-section">
            <div class="cp-section-label">${I18n.t('combat.actions')}</div>
            <div class="cp-action-grid">
              ${weaponBtns}
              <button class="combat-action-btn" data-action="unarmed">${I18n.t('combat.unarmed')}</button>
              ${medicalBtns}
              <button class="combat-action-btn secondary" data-action="stealth">${I18n.t('combat.stealth')}</button>
              <button class="combat-action-btn secondary" data-action="flee">${I18n.t('combat.flee')}</button>
            </div>
          </div>

          <!-- 전투 기록 -->
          <div class="cp-section cp-log-section">
            <div class="cp-section-label">${I18n.t('combat.log')}</div>
            <div class="combat-log" id="combat-log">${logHtml}</div>
          </div>

        </div><!-- .combat-panel -->
      </div><!-- .combat-wrap -->
    `;

    // ── 적 스프라이트 클릭 → 타겟 변경 ──
    this._screen.querySelectorAll('.cv-enemy-sprite:not(.is-dead)').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (!Number.isNaN(idx)) { CombatSystem.setTarget(idx); this.render(); }
      });
    });

    // ── 액션 버튼 ──
    this._screen.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action   = btn.dataset.action;
        const weaponId = btn.dataset.weapon ?? null;

        if (action === 'attack' && weaponId) {
          CombatSystem.resolveAction('shoot', weaponId);
        } else if (action === 'unarmed') {
          CombatSystem.resolveAction('melee', null);
        } else if (action === 'useItem' && weaponId) {
          CombatSystem.resolveAction('useItem', weaponId);
        } else {
          CombatSystem.resolveAction(action);
        }

        if (GameState.combat.active) {
          this.render();
          this._triggerHitFlash();
          this._spawnDmgPopup();
        }
      });
    });
  },

  _triggerHitFlash() {
    const lastHit = GameState.combat.lastHit;
    if (!lastHit) return;

    let targetEl;
    if (lastHit.target === 'player') {
      targetEl = this._screen.querySelector('.cv-player');
    } else {
      const idx = lastHit.enemyIndex ?? GameState.combat.targetIndex;
      targetEl  = this._screen.querySelector(`.cv-enemy-sprite[data-idx="${idx}"]`);
    }
    if (!targetEl) return;

    targetEl.classList.remove('hit');
    void targetEl.offsetWidth;
    targetEl.classList.add('hit');
    setTimeout(() => targetEl.classList.remove('hit'), 350);
  },

  _spawnDmgPopup() {
    const lastHit = GameState.combat.lastHit;
    if (!lastHit) return;

    let side;
    if (lastHit.target === 'player') {
      side = this._screen.querySelector('.cv-player');
    } else {
      const idx = lastHit.enemyIndex ?? GameState.combat.targetIndex;
      side = this._screen.querySelector(`.cv-enemy-sprite[data-idx="${idx}"]`);
    }
    if (!side) return;

    const popup = document.createElement('div');
    popup.className = 'dmg-popup' + (lastHit.isCrit ? ' crit' : '');
    popup.textContent = `-${lastHit.damage}`;
    side.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
  },
};

export default CombatUI;
