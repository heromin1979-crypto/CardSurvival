// === COMBAT UI (v4 — 3패널 레이아웃) ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import CombatSystem  from '../systems/CombatSystem.js';
import I18n          from '../core/I18n.js';
import NightSystem   from '../systems/NightSystem.js';
import { CHARACTERS } from '../data/characters.js';
import { DISTRICTS }  from '../data/districts.js';
import BALANCE        from '../data/gameBalance.js';

const BATTLE_BG    = './assets/images/battle_bg.jpg';
const PLAYER_IMG_M = './assets/images/player_M.jpg';
const PLAYER_IMG_F = './assets/images/player_F.jpg';

const DANGER_LABEL = ['안전', '보통', '경계', '위험', '극위험', '극위험'];
const DANGER_COLOR = ['#449944', '#889933', '#cc8822', '#cc3333', '#881111', '#881111'];

const WEAKNESS_LABEL = { fire:'🔥약점', blade:'🗡️약점', bullet:'🔫약점', blunt:'💥약점', explosive:'💣약점', electric:'⚡약점' };
const RESIST_LABEL   = { fire:'🔥저항', blade:'🗡️저항', bullet:'🔫저항', blunt:'💥저항', explosive:'💣저항', electric:'⚡저항' };

// Combat Overhaul Phase 1 — 턴 큐 HUD 아이콘/라벨 매핑
const INIT_TYPE_ICONS = {
  player:    '👤',
  companion: '🤝',
  enemy:     '👹',
};

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

  /**
   * Combat Overhaul Phase 1 — 턴 순서 HUD 바.
   * 순수 문자열 반환 (testable). turnQueue 없을 경우 빈 문자열.
   */
  _renderInitiativeBar(combat, gs) {
    const queue = combat?.turnQueue;
    if (!Array.isArray(queue) || queue.length === 0) return '';
    const activeIdx = combat.activeIdx ?? 0;

    const slots = queue.map((entry, i) => {
      const isActive = i === activeIdx;
      let icon  = INIT_TYPE_ICONS[entry.type] ?? '·';
      let label = '—';
      let hpPct = 100;
      let dead = false;

      if (entry.type === 'player') {
        label = (gs.player?.name ?? '생존자').slice(0, 4);
        hpPct = Math.max(0, Math.min(100, ((gs.player?.hp?.current ?? 0) / (gs.player?.hp?.max ?? 1)) * 100));
        dead = (gs.player?.hp?.current ?? 0) <= 0;
      } else if (entry.type === 'enemy') {
        const e = combat.enemies?.[entry.enemyIdx];
        if (e) {
          icon  = e.icon ?? icon;
          label = (e.name ?? 'Enemy').slice(0, 4);
          hpPct = Math.max(0, Math.min(100, ((e.currentHp ?? 0) / (e.maxHp ?? 1)) * 100));
          dead  = (e.currentHp ?? 0) <= 0;
        }
      } else if (entry.type === 'companion') {
        const st = gs.npcs?.states?.[entry.id];
        if (st) {
          hpPct = Math.max(0, Math.min(100, ((st.hp ?? 0) / (st.maxHp ?? 50)) * 100));
          dead  = (st.hp ?? 0) <= 0;
        }
        // npcs.js 이름은 대형 dep이므로 id 축약만 사용 (Phase 2에서 정식 이름 매핑)
        label = (entry.id ?? '').replace(/^npc_/, '').slice(0, 4);
      }

      const cls = ['init-slot', entry.type];
      if (isActive) cls.push('active');
      if (dead)     cls.push('dead');

      return `
        <div class="${cls.join(' ')}" data-init-idx="${i}" data-init-type="${entry.type}">
          <span class="init-icon">${icon}</span>
          <span class="init-label">${label}</span>
          <div class="init-hp-bar"><div class="init-hp-fill" style="width:${hpPct.toFixed(0)}%"></div></div>
        </div>`;
    }).join('');

    return `
      <div class="initiative-bar" data-round="${combat.roundNumber ?? 1}">
        <span class="init-round-label">Round ${combat.roundNumber ?? 1}</span>
        <div class="init-slots">${slots}</div>
      </div>`;
  },

  render() {
    try {
      this._renderInternal();
    } catch (err) {
      console.error('[CombatUI] render 실패 — 원인:', err);
      console.error('[CombatUI] 상태:', {
        characterId: GameState.player?.characterId,
        enemies: GameState.combat?.enemies?.map(e => e?.id) ?? 'undefined',
        companions: GameState.companions,
      });
      // 최소한의 fallback 렌더 — 화면이 비지 않도록
      if (this._screen) {
        this._screen.innerHTML = `
          <div style="padding:20px;color:#e66;text-align:center;">
            <h2>전투 화면 렌더 오류</h2>
            <p>콘솔에서 상세 원인을 확인해 주세요.</p>
            <p>${String(err?.message ?? err)}</p>
            <button class="toolbar-btn" onclick="location.reload()">페이지 새로고침</button>
          </div>`;
      }
    }
  },

  _renderInternal() {
    const gs     = GameState;
    const combat = gs.combat;
    if (!combat?.enemies?.length || !this._screen) return;

    const isEntry    = combat._isNew === true;
    if (isEntry) combat._isNew = false;
    const isNewRound = combat.round !== this._lastRound;
    this._lastRound  = combat.round;

    // ── 플레이어 스탯 ──────────────────────────────────────────
    const hpPct      = (gs.player.hp.current / gs.player.hp.max) * 100;
    const hpClass    = hpPct < 25 ? 'crit' : hpPct < 50 ? 'low' : '';
    const isHpCrit   = hpPct < 25;
    const prevPHpPct = this._prevPlayerHp ?? hpPct;
    const stPct      = (gs.stats.stamina.current / gs.stats.stamina.max) * 100;
    const infPct     = (gs.stats.infection.current / gs.stats.infection.max) * 100;

    // ── 캐릭터 정보 ───────────────────────────────────────────
    const charDef   = CHARACTERS.find(c => c.id === gs.player.characterId) ?? {};
    const playerImg = gs.player.gender === 'F' ? PLAYER_IMG_F : PLAYER_IMG_M;

    // ── 장착 무기 ─────────────────────────────────────────────
    const weaponId   = gs.player.equipped?.weapon_main ?? gs.player.equipped?.weapon_sub;
    const weaponCard = weaponId ? gs.cards[weaponId] : null;
    const weaponDef  = weaponCard ? gs.getCardDef(weaponId) : null;
    const durPct     = weaponCard ? Math.round(weaponCard.durability ?? 100) : 0;
    const armorId    = gs.player.equipped?.body;
    const armorDef   = armorId ? gs.getCardDef(armorId) : null;

    let ammoCount = null;
    if (weaponDef?.combat?.requiresAmmo) {
      const ammoInst = gs.getBoardCards().find(c => c.definitionId === weaponDef.combat.requiresAmmo);
      ammoCount = ammoInst ? (ammoInst.quantity ?? 1) : 0;
    }

    // ── 상태이상 배지 ─────────────────────────────────────────
    const playerStatusHtml = combat.playerStatus.map(s =>
      `<span class="status-badge">${s.name}(${s.duration})</span>`
    ).join('');

    // ── 적 데이터 ─────────────────────────────────────────────
    const enemyCount  = combat.enemies.length;
    const aliveCount  = combat.enemies.filter(e => e.currentHp > 0).length;
    const playerWeaponType = weaponDef?.weaponType ?? null;
    const targetEnemy = combat.enemies[combat.targetIndex] ?? combat.enemies[0];

    // ── 적 스프라이트 HTML (중앙 시각 패널) ───────────────────
    const enemySpritesHtml = combat.enemies.map((enemy, i) => {
      const isDead   = enemy.currentHp <= 0;
      const wasAlive = enemy._wasAlive ?? !isDead;
      const justDied = wasAlive && isDead;
      const isTarget = i === combat.targetIndex && !isDead;
      const eHpPct   = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
      const eHpClass = eHpPct < 25 ? 'crit' : eHpPct < 50 ? 'low' : '';
      const ghostPct = Math.max(0, ((enemy._prevHp ?? enemy.currentHp) / enemy.maxHp) * 100);

      const spriteHtml = enemy.image
        ? `<img class="cv-enemy-img" src="${enemy.image}" alt="${enemy.name}">`
        : `<div class="cv-enemy-icon">${enemy.icon ?? '👾'}</div>`;

      const perEnemyStatus = (enemy._statusEffects ?? []).map(s =>
        `<span class="status-badge enemy">${s.name}(${s.duration})</span>`
      ).join('');

      let affinityHint = '';
      if (playerWeaponType && !isDead) {
        if (enemy.weaknesses?.includes(playerWeaponType))
          affinityHint = `<span class="affinity-badge weakness">${WEAKNESS_LABEL[playerWeaponType] ?? '⬆약점'}</span>`;
        else if (enemy.resistances?.includes(playerWeaponType))
          affinityHint = `<span class="affinity-badge resistance">${RESIST_LABEL[playerWeaponType] ?? '⬇저항'}</span>`;
      }

      const spriteClass = ['cv-enemy-sprite',
        isTarget ? 'is-target' : '', isDead ? 'is-dead' : '',
        justDied ? 'just-died' : '', isEntry ? 'entering' : '',
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

    // ── 환경 정보 ─────────────────────────────────────────────
    const isNight   = NightSystem.isNight();
    const noise     = gs.noise?.level ?? 0;
    const distText  = noise < 30 ? '🎯 원거리' : noise < 60 ? '🎯 중거리' : '🎯 근거리';
    const lightText = isNight ? '🌙 어둠' : '☀️ 보통';
    const noiseText = noise < 35 ? '🔇 낮음' : noise < 65 ? '🔈 보통' : '🔊 높음';
    const coverText = '🏠 부분';

    // ── 전투 로그 ─────────────────────────────────────────────
    const LOG_CLS = [
      [I18n.t('combat.logCrit'),     'crit'],
      [I18n.t('combat.logAttack'),   'hit'],
      [I18n.t('combat.logEnemyAtk'), 'dmg'],
      [I18n.t('combat.logBleed'),    'bleed'], [I18n.t('combat.logAcid'),  'bleed'],
      [I18n.t('combat.logStun'),     'warn'],  [I18n.t('combat.logSmash'), 'warn'],
      [I18n.t('combat.logItem'),     'heal'],
      [I18n.t('combat.logStealth'),  'info'],  [I18n.t('combat.logFlee'), 'info'],
    ];
    const getLogCls = l => (LOG_CLS.find(([p]) => l.startsWith(p)) ?? ['', 'info'])[1];
    const logHtml   = combat.log.slice(-10).map(l =>
      `<div class="combat-log-entry ${getLogCls(l)}">${l}</div>`
    ).join('');
    const lastLog = combat.log.length > 0 ? combat.log[combat.log.length - 1] : '';

    // ── 공격 미리보기 ──────────────────────────────────────────
    const preview = CombatSystem.previewAttack(weaponId ?? null);

    // ── 위치 / 시간 / 날씨 / 위험도 ──────────────────────────
    const districtName = DISTRICTS[gs.location?.currentDistrict]?.name ?? (gs.location?.currentDistrict ?? '알 수 없음');
    const gameHour     = String(gs.time?.hour ?? 0).padStart(2, '0');
    const weatherIcon  = gs.weather?.icon ?? '🌤';
    const weatherName  = gs.weather?.name ?? '';
    const dangerLv     = combat.dangerLevel ?? 2;
    const dangerText   = DANGER_LABEL[Math.min(dangerLv, 5)] ?? '위험';
    const dangerColor  = DANGER_COLOR[Math.min(dangerLv, 5)] ?? '#cc3333';

    // ── 아이템 / 투척물 / 동행 ────────────────────────────────
    const medicals   = CombatSystem.getAvailableMedicals();
    const throwables = CombatSystem.getAvailableThrowables();
    const companions = gs.companions ?? [];
    const atkCd      = combat._companionAttackCooldown ?? 0;
    const healCd     = combat._companionHealCooldown   ?? 0;
    const weapons    = CombatSystem.getAvailableWeapons();
    const guardActive = !!combat.playerGuard?.active;

    const medBtnsHtml = medicals.length > 0
      ? medicals.map(m => {
          const def  = gs.getCardDef(m.instanceId);
          const heal = def?.use?.hp ?? '';
          return `<button class="ac-item-btn" data-action="useItem" data-weapon="${m.instanceId}">
            ${def?.icon ?? '💊'} ${I18n.itemName(def?.id ?? m.definitionId, def?.name ?? 'item')}${heal ? ` <em>+${heal}HP</em>` : ''}
          </button>`;
        }).join('')
      : `<span class="ac-no-item">아이템 없음</span>`;

    // ── 보조 버튼 행 ──────────────────────────────────────────
    const extraWeaponBtns = weapons.slice(1).map(w => {
      const def = gs.getCardDef(w.instanceId);
      return `<button class="sec-btn" data-action="attack" data-weapon="${w.instanceId}">
        ${def?.icon ?? '⚔'} ${I18n.itemName(def?.id ?? w.definitionId, def?.name ?? '')}
      </button>`;
    }).join('');

    const throwBtns = throwables.map(t => {
      const def = gs.getCardDef(t.instanceId);
      return `<button class="sec-btn" data-action="throwable" data-weapon="${t.instanceId}">
        ${def?.icon ?? '💣'} ${I18n.itemName(def?.id ?? t.definitionId, def?.name ?? '')}
      </button>`;
    }).join('');

    const companionBtns = companions.length > 0 ? `
      <button class="sec-btn companion" data-action="companionAttack" ${atkCd > 0 ? 'disabled' : ''}>
        ⚔️ 동행 공격${atkCd > 0 ? ` (${atkCd})` : ''}
      </button>
      <button class="sec-btn companion" data-action="companionHeal" ${healCd > 0 ? 'disabled' : ''}>
        💉 동행 치료${healCd > 0 ? ` (${healCd})` : ''}
      </button>` : '';

    // ── 적 패널 (우측) ────────────────────────────────────────
    const tEnemy    = targetEnemy;
    const tHpPct    = tEnemy ? Math.max(0, (tEnemy.currentHp / tEnemy.maxHp) * 100) : 0;
    const tHpCls    = tHpPct < 25 ? 'crit' : tHpPct < 50 ? 'low' : '';
    const tGhostPct = tEnemy ? Math.max(0, ((tEnemy._prevHp ?? tEnemy.currentHp) / tEnemy.maxHp) * 100) : 0;

    const weaknessTags = (tEnemy?.weaknesses ?? []).map(w =>
      `<span class="trait-tag weak">${WEAKNESS_LABEL[w] ?? w}</span>`).join('');
    const resistTags = (tEnemy?.resistances ?? []).map(r =>
      `<span class="trait-tag resist">${RESIST_LABEL[r] ?? r}</span>`).join('');
    const skillTags = (tEnemy?.specialSkills ?? []).map(s =>
      `<span class="trait-tag special">⚡${s.name}</span>`).join('');

    const enemyListHtml = enemyCount > 1 ? `
      <div class="cep-enemy-list">
        ${combat.enemies.map((e, i) => {
          const dead   = e.currentHp <= 0;
          const active = i === combat.targetIndex;
          const hp     = Math.max(0, Math.round((e.currentHp / e.maxHp) * 100));
          return `<div class="cep-enemy-item ${active ? 'active' : ''} ${dead ? 'dead' : ''}" data-idx="${i}">
            <span>${e.icon ?? '👾'}</span>
            <span>${I18n.enemyName(e.id ?? e.definitionId, e.name)}</span>
            <span>${dead ? '💀' : hp + '%'}</span>
          </div>`;
        }).join('')}
      </div>` : '';

    // ══════════════════════════════════════════════════════════
    // HTML 조립
    // ══════════════════════════════════════════════════════════
    this._screen.innerHTML = `
      <div class="combat-wrap">

        <!-- ① 상단 바 ────────────────────────────────────── -->
        <header class="combat-top-bar">
          <span class="ctb-brand">SURVIVAL: SEOUL</span>
          <div class="ctb-center">
            <span class="ctb-chip">📍 ${districtName}</span>
            <span class="ctb-chip">⏱ ${gameHour}:00</span>
            <span class="ctb-chip">${weatherIcon} ${weatherName}</span>
            ${isNight ? '<span class="ctb-chip night">🌙 야간</span>' : ''}
          </div>
          <div class="ctb-right">
            <span class="ctb-chip${isNewRound ? ' pulse' : ''}">전투 턴 ${combat.round}</span>
            <span class="ctb-chip danger-chip" style="color:${dangerColor};border-color:${dangerColor}55">위험: ${dangerText}</span>
          </div>
        </header>

        <!-- ①-b Initiative 바 (Phase 1) ──────────────────── -->
        ${CombatUI._renderInitiativeBar(combat, gs)}

        <!-- ② 메인 3열 ──────────────────────────────────── -->
        <div class="combat-main">

          <!-- 좌: 플레이어 패널 ─────────────────────────── -->
          <aside class="combat-player-panel">
            <div class="cpp-portrait">
              <img class="cpp-img" src="${playerImg}" alt="${gs.player.name ?? ''}">
              <div class="cpp-name">${gs.player.name ?? '생존자'}</div>
              <div class="cpp-job">${charDef.portrait ?? ''} ${charDef.title ?? ''}</div>
            </div>

            <div class="cpp-stats">
              <div class="cpp-stat-row">
                <span class="cpp-label">HP</span>
                <div class="cpp-bar-wrap">
                  <div class="cpp-bar-ghost" style="width:${prevPHpPct.toFixed(1)}%"></div>
                  <div class="cpp-bar ${hpClass}" style="width:${hpPct.toFixed(1)}%"></div>
                </div>
                <span class="cpp-val ${hpClass}">${gs.player.hp.current}/${gs.player.hp.max}</span>
              </div>
              <div class="cpp-stat-row">
                <span class="cpp-label">스태미나</span>
                <div class="cpp-bar-wrap">
                  <div class="cpp-bar stamina" style="width:${stPct.toFixed(1)}%"></div>
                </div>
                <span class="cpp-val">${Math.round(gs.stats.stamina.current)}</span>
              </div>
              <div class="cpp-stat-row">
                <span class="cpp-label">감염</span>
                <div class="cpp-bar-wrap">
                  <div class="cpp-bar infection" style="width:${infPct.toFixed(1)}%"></div>
                </div>
                <span class="cpp-val">${Math.round(gs.stats.infection.current)}%</span>
              </div>
            </div>

            <div class="cpp-equipment">
              ${weaponDef ? `
                <div class="cpp-equip-item">
                  <span class="cpp-equip-icon">${weaponDef.icon ?? '⚔️'}</span>
                  <div class="cpp-equip-info">
                    <div class="cpp-equip-name">${I18n.itemName(weaponDef.id, weaponDef.name)}</div>
                    <div class="cpp-dur-wrap"><div class="cpp-dur-bar" style="width:${durPct}%"></div></div>
                    <div class="cpp-equip-sub">내구도 ${durPct}%${ammoCount !== null ? ` · 탄약 ${ammoCount}발` : ''}</div>
                  </div>
                </div>` : `<div class="cpp-equip-item"><span class="cpp-equip-icon">👊</span><div class="cpp-equip-name" style="font-size:10px;color:var(--text-secondary)">맨손</div></div>`}
              ${armorDef ? `
                <div class="cpp-equip-item">
                  <span class="cpp-equip-icon">${armorDef.icon ?? '🛡️'}</span>
                  <div class="cpp-equip-info">
                    <div class="cpp-equip-name">${I18n.itemName(armorDef.id, armorDef.name)}</div>
                  </div>
                </div>` : ''}
            </div>

            ${playerStatusHtml ? `<div class="cpp-status">${playerStatusHtml}</div>` : ''}
            ${this._renderCompanionsPanel(gs)}
          </aside>

          <!-- 중: 전투 장면 ──────────────────────────────── -->
          <div class="combat-visual${isHpCrit ? ' hp-crit' : ''}"
               style="background-image:url('${BATTLE_BG}')">
            ${isNight ? '<div class="combat-night-tint"></div>' : ''}

            <div class="cv-context-overlay">
              <span>${distText}</span>
              <span>${coverText}</span>
              <span>${lightText}</span>
              <span>${noiseText}</span>
            </div>

            <div class="cv-enemies count-${enemyCount}">
              ${enemySpritesHtml}
            </div>

            <div class="cv-player">
              <img class="cv-player-img" src="${playerImg}" alt="${gs.player.name ?? ''}">
            </div>

            ${lastLog ? `<div class="cv-log-overlay">${lastLog}</div>` : ''}
          </div>

          <!-- 우: 적 정보 패널 ───────────────────────────── -->
          <aside class="combat-enemy-panel">
            ${tEnemy ? `
              <div class="cep-header">
                <span class="cep-icon">${tEnemy.icon ?? '👾'}</span>
                <div class="cep-title">
                  <div class="cep-name">${I18n.enemyName(tEnemy.id ?? tEnemy.definitionId, tEnemy.name)}</div>
                  <div class="cep-type">${tEnemy.type === 'zombie' ? '🧟 감염자' : '⚔️ 인간'}</div>
                </div>
                <span class="cep-danger-badge" style="color:${dangerColor}">▲ 위험</span>
              </div>

              <div class="cep-hp-section">
                <div class="cep-hp-label">
                  <span>HP</span>
                  <span class="cep-hp-text ${tHpCls}">${Math.max(0, tEnemy.currentHp)} / ${tEnemy.maxHp}</span>
                </div>
                <div class="cv-hp-bar-track cep-hp-track">
                  <div class="cv-hp-bar-ghost cep-ghost" style="width:${tGhostPct.toFixed(1)}%"></div>
                  <div class="cv-hp-bar-fill ${tHpCls}" style="width:${tHpPct.toFixed(1)}%"></div>
                </div>
              </div>

              <div class="cep-stats-grid">
                <div class="cep-stat"><span>🛡 방어력</span><strong>${tEnemy.defense ?? 0}</strong></div>
                <div class="cep-stat"><span>🦠 감염확률</span><strong>${Math.round((tEnemy.infectionChance ?? 0) * 100)}%</strong></div>
                <div class="cep-stat"><span>⚔ 공격</span><strong>${tEnemy.attack?.damage?.[0] ?? 0}~${tEnemy.attack?.damage?.[1] ?? 0}</strong></div>
                <div class="cep-stat"><span>🎯 명중</span><strong>${Math.round((tEnemy.attack?.accuracy ?? 0.7) * 100)}%</strong></div>
              </div>

              ${(weaknessTags || resistTags || skillTags) ? `
                <div class="cep-traits">${weaknessTags}${resistTags}${skillTags}</div>` : ''}

              ${enemyListHtml}
            ` : ''}

            <div class="cep-log">
              <div class="cep-log-label">전투 기록 · <small>${I18n.t('combat.noiseEnemy', { noise: Math.round(noise), alive: aliveCount, total: enemyCount })}</small></div>
              <div class="combat-log" id="combat-log">${logHtml}</div>
            </div>
          </aside>

        </div><!-- .combat-main -->

        <!-- ③ 하단: 액션 카드 바 ───────────────────────── -->
        <footer class="combat-action-bar">

          <!-- 공격 카드 -->
          <div class="action-card primary" data-action="${weaponId ? 'attack' : 'unarmed'}" data-weapon="${weaponId ?? ''}">
            <div class="ac-header">
              <span class="ac-icon">${weaponDef?.icon ?? '👊'}</span>
              <div class="ac-title-group">
                <span class="ac-name">${weaponDef ? I18n.itemName(weaponDef.id, weaponDef.name) : '맨손'}</span>
                <span class="ac-sub">ATTACK</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>예상 피해</span><strong>${preview.dmgMin}~${preview.dmgMax}</strong></div>
              <div class="ac-row"><span>명중률</span><strong>${preview.accuracy}%</strong></div>
              ${preview.critChance > 0 ? `<div class="ac-row"><span>치명타</span><strong>${preview.critChance}%</strong></div>` : ''}
              ${preview.ammoLeft !== null ? `<div class="ac-row${preview.ammoLeft === 0 ? ' warn' : ''}"><span>탄약</span><strong>${preview.ammoLeft}발</strong></div>` : ''}
            </div>
          </div>

          <!-- 방어 카드 -->
          <div class="action-card${guardActive ? ' active' : ''}" data-action="guard">
            <div class="ac-header">
              <span class="ac-icon">🛡️</span>
              <div class="ac-title-group">
                <span class="ac-name">방어${guardActive ? ' ✓' : ''}</span>
                <span class="ac-sub">DEFEND</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>피해 감소</span><strong>-55%</strong></div>
              <div class="ac-row"><span>반격 보너스</span><strong>+30%</strong></div>
              ${guardActive ? '<div class="ac-row good"><span>상태</span><strong>방어 중</strong></div>' : ''}
            </div>
          </div>

          <!-- 아이템 카드 -->
          <div class="action-card items">
            <div class="ac-header">
              <span class="ac-icon">🎒</span>
              <div class="ac-title-group">
                <span class="ac-name">아이템 <small>(${medicals.length})</small></span>
                <span class="ac-sub">USE ITEM</span>
              </div>
            </div>
            <div class="ac-item-list">${medBtnsHtml}</div>
          </div>

          <!-- 도주 카드 -->
          <div class="action-card flee" data-action="flee">
            <div class="ac-header">
              <span class="ac-icon">🏃</span>
              <div class="ac-title-group">
                <span class="ac-name">도주</span>
                <span class="ac-sub">FLEE</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>성공률</span><strong>60%</strong></div>
              <div class="ac-row warn"><span>실패 시</span><strong>피해 ×1.5</strong></div>
            </div>
          </div>

        </footer>

        <!-- ④ 보조 액션 행 ──────────────────────────────── -->
        <div class="combat-sec-row">
          ${extraWeaponBtns}
          ${throwBtns}
          ${companionBtns}
          <button class="sec-btn" data-action="unarmed">👊 맨손</button>
          <button class="sec-btn secondary" data-action="stealth">🤫 은신</button>
        </div>

      </div><!-- .combat-wrap -->
    `;

    // ── ghost bar 애니메이션 (rAF) ─────────────────────────────
    requestAnimationFrame(() => {
      // 중앙 시각 패널 적 ghost bars
      this._screen.querySelectorAll('.cv-hp-bar-ghost[data-idx]').forEach(el => {
        const idx   = parseInt(el.dataset.idx, 10);
        const enemy = combat.enemies[idx];
        if (!enemy) return;
        const pct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
        el.style.width = pct.toFixed(1) + '%';
        enemy._prevHp = enemy.currentHp;
      });

      // 우측 패널 타겟 ghost bar
      const cepGhost = this._screen.querySelector('.cep-ghost');
      if (cepGhost && tEnemy) {
        cepGhost.style.width = (Math.max(0, (tEnemy.currentHp / tEnemy.maxHp) * 100)).toFixed(1) + '%';
      }

      // 좌측 패널 플레이어 ghost bar
      const ppGhost = this._screen.querySelector('.cpp-bar-ghost');
      if (ppGhost) {
        ppGhost.style.width = hpPct.toFixed(1) + '%';
        this._prevPlayerHp = hpPct;
      }

      for (const enemy of combat.enemies) enemy._wasAlive = enemy.currentHp > 0;
    });

    // ── 로그 스크롤 ───────────────────────────────────────────
    const logEl = this._screen.querySelector('#combat-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;

    // ── 적 스프라이트 클릭 (타겟 변경) ───────────────────────
    this._screen.querySelectorAll('.cv-enemy-sprite:not(.is-dead)').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (!Number.isNaN(idx)) { CombatSystem.setTarget(idx); this.render(); }
      });
    });

    // ── Phase 2 · 동료 stance 버튼 클릭 ──────────────────────
    this._screen.querySelectorAll('.stance-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const npcId = btn.dataset.npcId;
        const stance = btn.dataset.stance;
        if (!npcId || !stance) return;
        const st = GameState.npcs?.states?.[npcId];
        if (st) {
          st.stance = stance;
          this.render();
        }
      });
    });

    // ── 우측 패널 적 목록 클릭 ────────────────────────────────
    this._screen.querySelectorAll('.cep-enemy-item:not(.dead)').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (!Number.isNaN(idx)) { CombatSystem.setTarget(idx); this.render(); }
      });
    });

    // ── 액션 버튼 ────────────────────────────────────────────
    this._screen.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action   = btn.dataset.action;
        const wId      = btn.dataset.weapon || null;

        if (action === 'attack' && wId) {
          CombatSystem.resolveAction('shoot', wId);
        } else if (action === 'unarmed') {
          CombatSystem.resolveAction('melee', null);
        } else if (action === 'useItem' && wId) {
          CombatSystem.resolveAction('useItem', wId);
        } else if (action === 'throwable' && wId) {
          CombatSystem.resolveAction('throwable', wId);
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

  // Phase 2 — 동료 stance 셀렉터 + 클래스 스킬 쿨다운 배지
  _renderStanceSelector(npcId, state) {
    const stances = [
      { key: 'attack',  icon: '🗡', label: '공격' },
      { key: 'heal',    icon: '💉', label: '치료' },
      { key: 'support', icon: '⚙',  label: '지원' },
      { key: 'hold',    icon: '🛡', label: '방어' },
      { key: 'manual',  icon: '✋', label: '대기' },
    ];
    const active = state?.stance ?? 'attack';

    const btnHtml = stances.map(s => {
      const sel = s.key === active ? ' active' : '';
      return `<button class="stance-btn${sel}" data-stance="${s.key}" data-npc-id="${npcId}" title="${s.label}">${s.icon}</button>`;
    }).join('');

    // 클래스 스킬 쿨다운 배지
    const skill = BALANCE.combat?.companionAuto?.classSkills?.[npcId];
    let skillHtml = '';
    if (skill) {
      const cd = state?.skillCooldowns?.[skill.id] ?? 0;
      const ready = cd === 0;
      skillHtml = `<span class="skill-cd-badge${ready ? ' ready' : ''}" title="${skill.name}">
          ${ready ? '✨' : `⏳${cd}`} ${skill.name}
        </span>`;
    }

    return `<div class="cpp-stance-row" style="margin-top:5px;display:flex;gap:3px;align-items:center;flex-wrap:wrap;">
      ${btnHtml}
      ${skillHtml}
    </div>`;
  },

  /** 동반자(NPC) 전투 상태 패널 — 플레이어 패널 하단에 표시 */
  _renderCompanionsPanel(gs) {
    const companions = gs.companions ?? [];
    if (companions.length === 0) return '';
    const foragingToday = gs.npcs?._foragingToday ?? {};
    const rows = companions.map(npcId => {
      const state = gs.npcs?.states?.[npcId];
      if (!state) return '';
      const iconMap = {
        npc_dog: '🐕', npc_nurse: '👩‍⚕️', npc_soldier_deserter: '🪖',
        npc_child: '👧', npc_mechanic: '🔧', npc_trader: '🧳',
        npc_student: '📖', npc_old_survivor: '👴',
      };
      const icon = iconMap[npcId] ?? '👤';
      const name = I18n.itemName(npcId, state.name ?? npcId);
      const hp = state.hp ?? 50;
      const maxHp = state.maxHp ?? 50;
      const hpPct = Math.max(0, (hp / maxHp) * 100);
      const foraging = foragingToday[npcId];
      const statusTag = foraging
        ? '<span style="color:var(--text-warn);font-size:10px;">🌿 탐색중</span>'
        : '<span style="color:var(--text-good);font-size:10px;">⚔ 전투 가능</span>';

      // 유대감(bond) 표시: 군견뿐 아니라 bond 값이 존재하면 모든 동반자에게 렌더
      const bond = state.bond ?? 0;
      const tier = bond >= 91 ? 'kindred'
                 : bond >= 61 ? 'bonded'
                 : bond >= 31 ? 'friendly'
                 : 'baseline';
      const tierLabel = tier === 'kindred' ? '혈맹'
                      : tier === 'bonded' ? '친밀'
                      : tier === 'friendly' ? '우호'
                      : '경계';
      const tierColor = tier === 'kindred' ? '#f4c861'
                      : tier === 'bonded' ? '#6dd36d'
                      : tier === 'friendly' ? '#d9c54a'
                      : '#888';
      const showBond = npcId === 'npc_dog' || bond > 0;
      const bondHtml = showBond ? `
          <div class="cpp-bar-wrap" style="margin-top:3px;background:rgba(255,255,255,0.06);height:4px;border-radius:2px;overflow:hidden;">
            <div style="width:${bond}%;height:100%;background:${tierColor};"></div>
          </div>
          <div style="font-size:10px;color:${tierColor};">유대 ${bond}/100 (${tierLabel})</div>` : '';

      const tierBadge = showBond
        ? `<span style="font-size:10px;color:${tierColor};margin-left:4px;">[${tierLabel}]</span>`
        : '';

      // Phase 2 — stance selector
      const stanceHtml = CombatUI._renderStanceSelector(npcId, state);

      return `
        <div class="cpp-companion-row" style="margin-top:8px;padding:6px;background:rgba(255,255,255,0.04);border-radius:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;">${icon} <strong>${name}</strong>${tierBadge}</span>
            ${statusTag}
          </div>
          <div class="cpp-bar-wrap" style="margin-top:4px;">
            <div class="cpp-bar ${hpPct < 30 ? 'low' : ''}" style="width:${hpPct.toFixed(1)}%;"></div>
          </div>
          <div style="font-size:10px;color:var(--text-dim);">HP ${hp}/${maxHp}</div>
          ${bondHtml}
          ${stanceHtml}
        </div>`;
    }).join('');
    return `<div class="cpp-companions" style="margin-top:10px;border-top:1px solid var(--border-dim);padding-top:8px;">
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">👥 동반자</div>
      ${rows}
    </div>`;
  },
};

export default CombatUI;
