// === COMBAT UI (v3 — 비주얼 강화) ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import CombatSystem from '../systems/CombatSystem.js';
import I18n        from '../core/I18n.js';
import NightSystem from '../systems/NightSystem.js';

const BATTLE_BG    = './assets/images/battle_bg.jpg';
const PLAYER_IMG_M = './assets/images/player_M.jpg';
const PLAYER_IMG_F = './assets/images/player_F.jpg';

const CombatUI = {
  _screen:       null,
  _lastRound:    -1,
  _prevPlayerHp: null,

  init() {
    this._screen = document.getElementById('screen-combat');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'combat') {
        this._lastRound    = -1;
        this._prevPlayerHp = null;
        this.render();
      }
    });
  },

  render() {
    const gs     = GameState;
    const combat = gs.combat;
    if (!combat.enemies?.length || !this._screen) return;

    // ── 진입 여부 감지 (첫 렌더링) ──
    const isEntry = combat._isNew === true;
    if (isEntry) combat._isNew = false;

    // ── 라운드 펄스 감지 ──
    const isNewRound = combat.round !== this._lastRound;
    this._lastRound  = combat.round;

    // ── 플레이어 HP ──
    const hpPct        = (gs.player.hp.current / gs.player.hp.max) * 100;
    const hpClass      = hpPct < 25 ? 'crit' : hpPct < 50 ? 'low' : '';
    const isHpCrit     = hpPct < 25;
    const prevPHpPct   = this._prevPlayerHp ?? hpPct;

    // ── 상태이상 배지 ──
    const playerStatusHtml = combat.playerStatus.map(s =>
      `<span class="status-badge">${s.name}(${s.duration})</span>`
    ).join('');

    // ── 장착 무기 타입 (약점 힌트) ──
    const equippedWeaponId  = gs.player.equipped?.weapon_main ?? gs.player.equipped?.weapon_sub;
    const equippedWeaponDef = equippedWeaponId ? gs.getCardDef(equippedWeaponId) : null;
    const playerWeaponType  = equippedWeaponDef?.weaponType ?? null;

    const WEAKNESS_LABEL = { fire:'🔥약점', blade:'🗡️약점', bullet:'🔫약점', blunt:'💥약점', explosive:'💣약점', electric:'⚡약점' };
    const RESIST_LABEL   = { fire:'🔥저항', blade:'🗡️저항', bullet:'🔫저항', blunt:'💥저항', explosive:'💣저항', electric:'⚡저항' };

    // ── 적 스프라이트 ──
    const enemyCount    = combat.enemies.length;
    const aliveCount    = combat.enemies.filter(e => e.currentHp > 0).length;

    const enemySpritesHtml = combat.enemies.map((enemy, i) => {
      const isDead    = enemy.currentHp <= 0;
      const wasAlive  = enemy._wasAlive ?? !isDead;
      const justDied  = wasAlive && isDead;
      const isTarget  = i === combat.targetIndex && !isDead;
      const eHpPct    = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
      const eHpClass  = eHpPct < 25 ? 'crit' : eHpPct < 50 ? 'low' : '';
      const ghostPct  = Math.max(0, ((enemy._prevHp ?? enemy.currentHp) / enemy.maxHp) * 100);

      const spriteHtml = enemy.image
        ? `<img class="cv-enemy-img" src="${enemy.image}" alt="${enemy.name}">`
        : `<div class="cv-enemy-icon">${enemy.icon ?? '👾'}</div>`;

      // 상태이상 배지 (per-enemy)
      const perEnemyStatus = (enemy._statusEffects ?? []).map(s =>
        `<span class="status-badge enemy">${s.name}(${s.duration})</span>`
      ).join('');

      // 약점/저항 힌트
      let affinityHint = '';
      if (playerWeaponType && !isDead) {
        if (enemy.weaknesses?.includes(playerWeaponType)) {
          affinityHint = `<span class="affinity-badge weakness">${WEAKNESS_LABEL[playerWeaponType] ?? '⬆약점'}</span>`;
        } else if (enemy.resistances?.includes(playerWeaponType)) {
          affinityHint = `<span class="affinity-badge resistance">${RESIST_LABEL[playerWeaponType] ?? '⬇저항'}</span>`;
        }
      }

      // 클래스 조합
      const spriteClass = [
        'cv-enemy-sprite',
        isTarget  ? 'is-target'  : '',
        isDead    ? 'is-dead'    : '',
        justDied  ? 'just-died'  : '',
        isEntry   ? 'entering'   : '',
      ].filter(Boolean).join(' ');

      return `
        <div class="${spriteClass}" data-idx="${i}">
          ${spriteHtml}
          ${affinityHint}
          <div class="cv-hp-overlay">
            <div class="cv-hp-name">${I18n.enemyName(enemy.id ?? enemy.definitionId, enemy.name)}${isDead ? ' 💀' : isTarget ? ' ◀' : ''}</div>
            <div class="cv-hp-bar-track">
              <div class="cv-hp-bar-ghost" data-idx="${i}" style="width:${ghostPct.toFixed(1)}%"></div>
              <div class="cv-hp-bar-fill ${eHpClass}" style="width:${eHpPct.toFixed(1)}%"></div>
            </div>
            <div class="cv-hp-text">${Math.max(0, enemy.currentHp)} / ${enemy.maxHp}</div>
            ${perEnemyStatus ? `<div class="cv-status-row">${perEnemyStatus}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    // ── 무기 버튼 ──
    const weapons    = CombatSystem.getAvailableWeapons();
    const weaponBtns = weapons.map(w => {
      const def     = gs.getCardDef(w.instanceId);
      const critStr = def?.combat?.critChance
        ? `<span class="btn-sub">${I18n.t('combat.crit', { pct: Math.round(def.combat.critChance * 100) })}</span>`
        : '';
      return `<button class="combat-action-btn" data-action="attack" data-weapon="${w.instanceId}">
        ${def?.icon ?? '⚔'} ${I18n.itemName(def?.id ?? gs.cards[w.instanceId]?.definitionId, def?.name ?? I18n.t('combat.weapon'))} ${critStr}
      </button>`;
    }).join('');

    // ── 투척 무기 버튼 ──
    const throwables    = CombatSystem.getAvailableThrowables();
    const throwableBtns = throwables.map(t => {
      const def = gs.getCardDef(t.instanceId);
      return `<button class="combat-action-btn throwable" data-action="throwable" data-weapon="${t.instanceId}">
        ${def?.icon ?? '💣'} ${I18n.itemName(def?.id ?? gs.cards[t.instanceId]?.definitionId, def?.name ?? I18n.t('combat.throwable'))}
      </button>`;
    }).join('');

    // ── 의료 버튼 ──
    const medicals    = CombatSystem.getAvailableMedicals();
    const medicalBtns = medicals.map(m => {
      const def = gs.getCardDef(m.instanceId);
      return `<button class="combat-action-btn medical" data-action="useItem" data-weapon="${m.instanceId}">
        ${def?.icon ?? '💊'} ${I18n.itemName(def?.id ?? gs.cards[m.instanceId]?.definitionId, def?.name ?? I18n.t('combat.item'))}
      </button>`;
    }).join('');

    // ── 방어 버튼 ──
    const isGuarding = !!combat.playerGuard?.active;
    const guardBtn = `<button class="combat-action-btn guard${isGuarding ? ' active' : ''}" data-action="guard">
      🛡️ ${I18n.t('combat.guard')}${isGuarding ? ' ✓' : ''}
    </button>`;

    // ── 야간 경고 ──
    const isNight = NightSystem.isNight();
    const nightWarning = isNight
      ? `<div class="combat-night-warning">🌙 ${I18n.t('combat.nightPenalty')}</div>`
      : '';

    // ── NPC 동행 버튼 ──
    const companions = gs.companions ?? [];
    const atkCd  = combat._companionAttackCooldown ?? 0;
    const healCd = combat._companionHealCooldown   ?? 0;
    const companionBtns = companions.length > 0 ? `
      <button class="combat-action-btn companion" data-action="companionAttack" ${atkCd > 0 ? 'disabled' : ''}>
        ⚔️ ${I18n.t('combat.companionAtk')}${atkCd > 0 ? ` (${atkCd})` : ''}
      </button>
      <button class="combat-action-btn companion" data-action="companionHeal" ${healCd > 0 ? 'disabled' : ''}>
        💉 ${I18n.t('combat.companionHeal')}${healCd > 0 ? ` (${healCd})` : ''}
      </button>` : '';

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

    // ── 플레이어 ghost HP bar ──
    const playerGhostPct = Math.max(0, Math.min(100, prevPHpPct));

    // ── HTML 조립 ──
    this._screen.innerHTML = `
      <div class="combat-wrap">

        <!-- ① 왼쪽: 시각 필드 -->
        <div class="combat-visual${isHpCrit ? ' hp-crit' : ''}"
             style="background-image:url('${BATTLE_BG}')">

          <!-- 야간 색조 -->
          ${isNight ? '<div class="combat-night-tint"></div>' : ''}

          <!-- 적 스프라이트 -->
          <div class="cv-enemies count-${enemyCount}">
            ${enemySpritesHtml}
          </div>

          <!-- 플레이어 -->
          <div class="cv-player">
            <img class="cv-player-img"
                 src="${gs.player.gender === 'F' ? PLAYER_IMG_F : PLAYER_IMG_M}"
                 alt="${gs.player.name}">
            <div class="cv-player-info">
              <div class="cv-hp-name">${gs.player.name}</div>
              <div class="cv-hp-bar-track cv-player-hp-track">
                <div class="cv-hp-bar-ghost cv-player-hp-ghost" style="width:${playerGhostPct.toFixed(1)}%"></div>
                <div class="cv-hp-bar-fill ${hpClass}" style="width:${hpPct.toFixed(1)}%"></div>
              </div>
              <div class="cv-hp-text ${hpClass}">${gs.player.hp.current} / ${gs.player.hp.max}</div>
              ${playerStatusHtml ? `<div class="cp-status-row" style="margin-top:3px;">${playerStatusHtml}</div>` : ''}
            </div>
          </div>

        </div><!-- .combat-visual -->

        <!-- ② 오른쪽: 전투 패널 -->
        <div class="combat-panel">

          <!-- 헤더 -->
          <div class="cp-header">
            <span class="cp-title${isNewRound ? ' round-pulse' : ''}">${I18n.t('combat.round', { round: combat.round })}</span>
            <span class="cp-noise">${I18n.t('combat.noiseEnemy', { noise: Math.round(gs.noise.level), alive: aliveCount, total: enemyCount })}</span>
          </div>

          <!-- 야간 경고 -->
          ${nightWarning}

          <!-- 행동 -->
          <div class="cp-section">
            <div class="cp-section-label">${I18n.t('combat.actions')}</div>
            <div class="cp-action-grid">
              ${weaponBtns}
              <button class="combat-action-btn" data-action="unarmed">${I18n.t('combat.unarmed')}</button>
              ${guardBtn}
              ${throwableBtns}
              ${medicalBtns}
              ${companionBtns}
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

    // ── ghost bar 애니메이션 트리거 (rAF) ──
    // 렌더 후 ghost bar를 현재 HP로 전환 → CSS transition이 부드럽게 줄임
    requestAnimationFrame(() => {
      // 적 ghost bars
      this._screen.querySelectorAll('.cv-hp-bar-ghost[data-idx]').forEach(el => {
        const idx   = parseInt(el.dataset.idx, 10);
        const enemy = combat.enemies[idx];
        if (!enemy) return;
        const pct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
        el.style.width = pct.toFixed(1) + '%';
        enemy._prevHp = enemy.currentHp;
      });

      // 플레이어 ghost bar
      const pg = this._screen.querySelector('.cv-player-hp-ghost');
      if (pg) {
        pg.style.width = hpPct.toFixed(1) + '%';
        this._prevPlayerHp = hpPct;
      }

      // _wasAlive 갱신
      for (const enemy of combat.enemies) {
        enemy._wasAlive = enemy.currentHp > 0;
      }
    });

    // ── 로그 스크롤 하단 고정 ──
    const logEl = this._screen.querySelector('#combat-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;

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
        } else if (action === 'throwable' && weaponId) {
          CombatSystem.resolveAction('throwable', weaponId);
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

    // 피격 플래시
    targetEl.classList.remove('hit');
    void targetEl.offsetWidth;
    targetEl.classList.add('hit');
    setTimeout(() => targetEl.classList.remove('hit'), 350);

    // 크리티컬 히트 → 화면 흔들기
    if (lastHit.isCrit) {
      const visual = this._screen.querySelector('.combat-visual');
      if (visual) {
        visual.classList.remove('shake');
        void visual.offsetWidth;
        visual.classList.add('shake');
        setTimeout(() => visual.classList.remove('shake'), 400);
      }
    }
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
