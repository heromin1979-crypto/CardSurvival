// === COMBAT UI (v2 — 좌: 시각 / 우: 패널) ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import CombatSystem from '../systems/CombatSystem.js';

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
            <div class="cv-hp-name">${enemy.name}${isDead ? ' 💀' : isTarget ? ' ◀' : ''}</div>
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
        ? `<span class="btn-sub">치명 ${Math.round(def.combat.critChance * 100)}%</span>`
        : '';
      return `<button class="combat-action-btn" data-action="attack" data-weapon="${w.instanceId}">
        ${def?.icon ?? '⚔'} ${def?.name ?? '무기'} ${critStr}
      </button>`;
    }).join('');

    // ── 의료 버튼 ──
    const medicals    = CombatSystem.getAvailableMedicals();
    const medicalBtns = medicals.map(m => {
      const def = GameState.getCardDef(m.instanceId);
      return `<button class="combat-action-btn medical" data-action="useItem" data-weapon="${m.instanceId}">
        ${def?.icon ?? '💊'} ${def?.name ?? '아이템'}
      </button>`;
    }).join('');

    // ── 전투 로그 ──
    const LOG_CLS = [
      ['[크리티컬', 'crit'],
      ['[공격]',    'hit'],
      ['[적 공격]', 'dmg'],
      ['[출혈]',    'bleed'], ['[산성',  'bleed'],
      ['[기절]',    'warn'],  ['[강타]', 'warn'],
      ['[아이템]',  'heal'],
      ['[은신]',    'info'],  ['[도주]', 'info'],
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
            <span class="cp-title">⚔ 라운드 ${combat.round}</span>
            <span class="cp-noise">소음 ${Math.round(gs.noise.level)} · 적 ${aliveCount}/${enemyCount}</span>
          </div>

          <!-- 행동 -->
          <div class="cp-section">
            <div class="cp-section-label">행동</div>
            <div class="cp-action-grid">
              ${weaponBtns}
              <button class="combat-action-btn" data-action="unarmed">👊 맨손</button>
              ${medicalBtns}
              <button class="combat-action-btn secondary" data-action="stealth">🌑 은신</button>
              <button class="combat-action-btn secondary" data-action="flee">🏃 도주</button>
            </div>
          </div>

          <!-- 전투 기록 -->
          <div class="cp-section cp-log-section">
            <div class="cp-section-label">전투 기록</div>
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
