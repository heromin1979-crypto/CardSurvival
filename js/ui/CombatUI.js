// === COMBAT UI ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import CombatSystem from '../systems/CombatSystem.js';

const BATTLE_BG  = '../../GameImg/전투씬2.jpg';
const PLAYER_IMG = '../../GameImg/캐릭터2.jpg';

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

    // ── 배경 이미지 ──
    this._screen.style.backgroundImage    = `url('${BATTLE_BG}')`;
    this._screen.style.backgroundSize     = 'cover';
    this._screen.style.backgroundPosition = 'center center';

    const hpPct   = (gs.player.hp.current / gs.player.hp.max) * 100;
    const hpClass = hpPct < 25 ? 'crit' : hpPct < 50 ? 'low' : '';

    // ── 상태이상 배지 ──
    const playerStatusHtml = combat.playerStatus.map(s =>
      `<span class="status-badge">${s.name}(${s.duration})</span>`
    ).join('');
    const enemyStatusHtml = combat.enemyStatus.map(s =>
      `<span class="status-badge enemy">${s.name}(${s.duration})</span>`
    ).join('');

    // ── 적 그룹 HTML ──
    const enemyCount  = combat.enemies.length;
    const enemiesHtml = combat.enemies.map((enemy, i) => {
      const isDead   = enemy.currentHp <= 0;
      const isTarget = i === combat.targetIndex && !isDead;
      const eHpPct   = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
      const eHpClass = eHpPct < 25 ? 'crit' : eHpPct < 50 ? 'low' : '';

      const spriteHtml = enemy.image
        ? `<img class="enemy-card-img" src="${enemy.image}" alt="${enemy.name}">`
        : `<div class="enemy-card-icon">${enemy.icon ?? '👾'}</div>`;

      return `
        <div class="enemy-card${isTarget ? ' is-target' : ''}${isDead ? ' is-dead' : ''}"
             data-idx="${i}" id="enemy-card-${i}">
          <div class="enemy-card-sprite">${spriteHtml}</div>
          <div class="enemy-card-info">
            <div class="enemy-card-name">${enemy.name}</div>
            <div class="enemy-card-hp-track">
              <div class="enemy-card-hp-fill ${eHpClass}" style="width:${eHpPct.toFixed(1)}%"></div>
            </div>
            <div class="enemy-card-hp-text">${Math.max(0, enemy.currentHp)} / ${enemy.maxHp}</div>
          </div>
        </div>`;
    }).join('');

    // ── 무기 버튼 ──
    const weapons    = CombatSystem.getAvailableWeapons();
    const weaponBtns = weapons.map(w => {
      const def     = GameState.getCardDef(w.instanceId);
      const critStr = def?.combat?.critChance
        ? ` <span style="font-size:9px;opacity:0.65;">(치명 ${Math.round(def.combat.critChance * 100)}%)</span>`
        : '';
      return `<button class="combat-action-btn" data-action="attack" data-weapon="${w.instanceId}">
        ${def?.icon ?? '⚔'} ${def?.name ?? '무기'}${critStr}
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

    // ── 로그 색상 매핑 ──
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

    const logHtml = combat.log.slice(-6).map(l =>
      `<div class="combat-log-entry ${getLogCls(l)}">${l}</div>`
    ).join('');

    // ── 생존 적 수 표시 ──
    const aliveCount = combat.enemies.filter(e => e.currentHp > 0).length;
    const enemyLabel = aliveCount < enemyCount
      ? `적 ${aliveCount}/${enemyCount}마리 생존 · 타겟 클릭으로 전환`
      : enemyCount > 1 ? `적 ${enemyCount}마리 · 타겟 클릭으로 전환` : '';

    // ══════════════════════════════════════════
    this._screen.innerHTML = `

      <!-- ① HUD 상단 바 -->
      <div class="combat-hud-bar">
        <span class="combat-hud-title">⚔ 전투 · 라운드 ${combat.round}</span>
        <span class="combat-hud-info">소음 ${Math.round(gs.noise.level)} &nbsp;|&nbsp; HP ${gs.player.hp.current}/${gs.player.hp.max}</span>
      </div>

      <!-- ② 전투 필드 -->
      <div class="combat-field">
        <div class="combat-field-overlay top"></div>

        <!-- 적 영역 -->
        <div class="combat-entity-zone enemy-zone" id="enemy-side">
          <div class="status-badges">${enemyStatusHtml}</div>
          <div class="enemy-group count-${enemyCount}" id="enemy-group">
            ${enemiesHtml}
          </div>
          ${enemyLabel ? `<div class="enemy-group-hint">${enemyLabel}</div>` : ''}
        </div>

        <!-- 중앙 구분선 -->
        <div class="combat-center-divider"></div>

        <!-- 플레이어 영역 -->
        <div class="combat-entity-zone player-zone" id="player-side">
          <img class="combat-player-img" src="${PLAYER_IMG}" alt="${gs.player.name}">
          <div class="combat-entity-stat-card">
            <div class="combat-entity-name">${gs.player.name}</div>
            <div class="combat-hp-track">
              <div class="combat-hp-fill ${hpClass}" style="width:${hpPct.toFixed(1)}%"></div>
            </div>
            <div class="combat-entity-hp-text">${gs.player.hp.current} / ${gs.player.hp.max}</div>
          </div>
          <div class="status-badges">${playerStatusHtml}</div>
        </div>

        <div class="combat-field-overlay bottom"></div>
      </div>

      <!-- ③ 하단 액션 패널 -->
      <div class="combat-bottom-panel">
        <div class="combat-actions">
          ${weaponBtns}
          <button class="combat-action-btn" data-action="unarmed">👊 맨손</button>
          ${medicalBtns}
          <button class="combat-action-btn secondary" data-action="stealth">🌑 은신</button>
          <button class="combat-action-btn secondary" data-action="flee">🏃 도주</button>
        </div>
        <div class="combat-log" id="combat-log">${logHtml}</div>
      </div>
    `;

    // ── 적 카드 클릭 → 타겟 변경 ──
    this._screen.querySelectorAll('.enemy-card:not(.is-dead)').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        if (!Number.isNaN(idx)) {
          CombatSystem.setTarget(idx);
          this.render();
        }
      });
    });

    // ── 액션 버튼 이벤트 ──
    this._screen.querySelectorAll('[data-action]').forEach(btn => {
      // enemy-card는 data-action 없으므로 충돌 없음; 추가 방어
      if (btn.classList.contains('enemy-card')) return;
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
      targetEl = this._screen.querySelector('#player-side');
    } else {
      // 플레이어가 공격한 적 카드 (enemyIndex 포함)
      const idx = lastHit.enemyIndex ?? GameState.combat.targetIndex;
      targetEl = this._screen.querySelector(`#enemy-card-${idx}`);
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
      side = this._screen.querySelector('#player-side');
    } else {
      const idx = lastHit.enemyIndex ?? GameState.combat.targetIndex;
      side = this._screen.querySelector(`#enemy-card-${idx}`);
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
