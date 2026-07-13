// === COMBAT UI (v4 — 3패널 레이아웃) ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import CombatSystem  from '../systems/CombatSystem.js';
import I18n          from '../core/I18n.js';
import NightSystem   from '../systems/NightSystem.js';
import { CHARACTERS } from '../data/characters.js';
import { DISTRICTS }  from '../data/districts.js';
import BALANCE        from '../data/gameBalance.js';
import { NPC_ITEMS }  from '../data/npcs.js';
import { combatAssetManifest } from '../data/combatAssets.js';
import { getRank }   from '../systems/combat/FormationSystem.js';
import { CombatFxPlayer } from './combat/CombatFxPlayer.js';
import { COMPANION_ICONS, INIT_TYPE_ICONS } from './combat/combatUiAssets.js';

const PLAYER_IMG_M = './assets/images/player_M.jpg';
const PLAYER_IMG_F = './assets/images/player_F.jpg';
const PLAYER_COMBAT_FALLBACK_M = './assets/images/combat/player_M_cutout.png';
const PLAYER_COMBAT_FALLBACK_F = './assets/images/combat/player_F_cutout.png';

const SAMPLE_SKILL_LABELS = {
  basic_strike: '강타',
  guard: '방어',
  reposition: '이동',
  doctor_precise_cut: '정밀 절개',
  doctor_triage: '응급 처치',
  doctor_diagnose: '진단',
  dog_bite: '물기',
  dog_guard: '위협',
  dog_harry: '견제',
  soldier_burst_fire: '사격',
  soldier_suppressive_fire: '제압 사격',
  soldier_tactical_shift: '전술 이동',
};

const DANGER_LABEL = ['안전', '보통', '경계', '위험', '극위험', '극위험'];
const DANGER_COLOR = ['#449944', '#889933', '#cc8822', '#cc3333', '#881111', '#881111'];

const WEAKNESS_LABEL = { fire:'🔥약점', blade:'🗡️약점', bullet:'🔫약점', blunt:'💥약점', explosive:'💣약점', electric:'⚡약점' };
const RESIST_LABEL   = { fire:'🔥저항', blade:'🗡️저항', bullet:'🔫저항', blunt:'💥저항', explosive:'💣저항', electric:'⚡저항' };


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

  // 연출 재생/모션/스프라이트시트 헬퍼 — CombatFxPlayer 믹스인
  ...CombatFxPlayer,


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

      let intentIcon = '';
      let intentLabel = '';
      let countdown = null;

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
          // Phase 3 — 의도 아이콘
          if (!dead && e._nextIntent) {
            intentIcon = e._nextIntent.iconEmoji ?? '';
            intentLabel = e._nextIntent.label ?? '';
            countdown = e._nextIntent.countdown ?? null;
          }
        }
      } else if (entry.type === 'companion') {
        const st = gs.npcs?.states?.[entry.id];
        if (st) {
          hpPct = Math.max(0, Math.min(100, ((st.hp ?? 0) / (st.maxHp ?? 50)) * 100));
          dead  = (st.hp ?? 0) <= 0;
        }
        // 이슈 #8 — NPC 한글 이름 (I18n.itemName 통해 NPC_ITEMS name 조회)
        const npcItem = NPC_ITEMS?.[entry.id];
        const fullName = I18n.itemName
          ? I18n.itemName(entry.id, npcItem?.name ?? entry.id)
          : (npcItem?.name ?? entry.id);
        // 한글 3자/영어 4자 축약
        label = fullName.slice(0, 4);
      }

      const cls = ['init-slot', entry.type];
      if (isActive) cls.push('active');
      if (dead)     cls.push('dead');
      if (countdown != null && countdown <= 1) cls.push('charging');

      const intentHtml = intentIcon
        ? `<span class="init-intent" title="${intentLabel}">${intentIcon}</span>`
        : '';

      const countdownHtml = countdown != null
        ? `<span class="init-countdown">${countdown}</span>`
        : '';

      // 육각 초상화 (샘플 UI) — 랭크 combatant가 있으면 초상 이미지, 없으면 아이콘 폴백
      const combatantId = entry.combatantId
        ?? (entry.type === 'player' ? 'player' : entry.type === 'companion' ? entry.id : `enemy:${entry.enemyIdx}`);
      const combatant = combat.combatants?.[combatantId] ?? null;
      const portrait = combatant ? this._combatantImage(combatant) : null;
      const portraitHtml = portrait
        ? `<span class="init-portrait"><img src="${this._escape(portrait)}" alt="" onerror="this.remove();"></span>`
        : `<span class="init-portrait init-portrait-fallback"><span class="init-icon">${icon}</span></span>`;

      return `
        <div class="${cls.join(' ')}" data-init-idx="${i}" data-init-type="${entry.type}">
          ${portraitHtml}
          <span class="init-label">${label}</span>
          <div class="init-hp-bar"><div class="init-hp-fill" style="width:${hpPct.toFixed(0)}%"></div></div>
          ${intentHtml}${countdownHtml}
        </div>`;
    }).join('');

    return `
      <div class="initiative-bar" data-round="${combat.roundNumber ?? 1}">
        <span class="init-round-label"><b>${combat.roundNumber ?? 1}</b><em>ROUND</em></span>
        <div class="init-slots">${slots}</div>
      </div>`;
  },

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _combatScene() {
    return combatAssetManifest.scene(GameState.combat?.sceneId);
  },

  _combatAssetStyle() {
    const scene = this._combatScene();
    const parts = [
      `--combat-bg-image:url('${scene.backdrop}')`,
      `--combat-stage-image:url('${scene.stagePlate ?? scene.backdrop}')`,
    ];
    if (scene.cardFrame) parts.push(`--combat-card-frame-image:url('${scene.cardFrame}')`);
    return parts.join(';');
  },

  _enemyForCombatant(combatant) {
    if (!combatant || combatant.sourceType !== 'enemy') return null;
    const enemies = GameState.combat?.enemies ?? [];
    const index = this._enemyIndexForCombatant(combatant);
    if (index !== null) return enemies[index] ?? null;
    return enemies.find(enemy => (enemy.id ?? enemy.definitionId) === (combatant.sourceId ?? combatant.id)) ?? null;
  },

  _enemyIndexForCombatant(combatant) {
    if (!combatant || combatant.sourceType !== 'enemy') return null;
    if (Number.isInteger(combatant.enemyIndex)) return combatant.enemyIndex;
    const parsed = /^enemy:(\d+)$/.exec(combatant.id ?? '');
    if (parsed) return Number(parsed[1]);
    const enemyId = combatant.sourceId ?? combatant.id;
    const found = (GameState.combat?.enemies ?? [])
      .findIndex(enemy => (enemy.id ?? enemy.definitionId) === enemyId);
    return found >= 0 ? found : null;
  },

  _combatantSprite(combatant) {
    if (!combatant) return null;
    if (combatant.id === 'player') return combatAssetManifest.playerSprite();
    if (combatant.sourceType === 'companion') {
      return combatAssetManifest.companionSprite(combatant.sourceId ?? combatant.id);
    }
    if (combatant.sourceType === 'enemy') {
      return combatAssetManifest.enemySprite(this._enemyForCombatant(combatant));
    }
    return null;
  },

  _spriteImage(sprite, state = 'idle') {
    return combatAssetManifest.state(sprite, state)?.src ?? null;
  },

  _spriteStyle(sprite) {
    if (!sprite) return '';
    const vars = [];
    if (sprite.width) vars.push(`--combat-sprite-w:${sprite.width}px`);
    if (sprite.height) vars.push(`--combat-sprite-h:${sprite.height}px`);
    return vars.length ? ` style="${vars.join(';')}"` : '';
  },

  _spriteStateAttrs(sprite) {
    if (!sprite) return '';
    return ['idle', 'attack', 'hit', 'death']
      .map(stateId => {
        const state = sprite.states?.[stateId];
        return state?.src ? ` data-motion-src-${stateId}="${this._escape(state.src)}"` : '';
      })
      .join('');
  },

  _setMotionState(el, stateId) {
    if (!el?.dataset?.spriteId) return;
    const attr = `motionSrc${stateId[0].toUpperCase()}${stateId.slice(1)}`;
    const src = el.dataset[attr];
    const img = el.querySelector('img');
    if (img && src && img.getAttribute('src') !== src) img.setAttribute('src', src);
    el.dataset.motionState = stateId;
  },

  _combatantLabel(combatant) {
    if (!combatant) return '';
    if (combatant.id === 'player') return GameState.player?.name ?? 'player';
    if (combatant.sourceType === 'companion') {
      return I18n.itemName(combatant.sourceId ?? combatant.id, NPC_ITEMS?.[combatant.sourceId ?? combatant.id]?.name ?? combatant.id);
    }
    const enemy = GameState.combat?.enemies?.[combatant.enemyIndex];
    return I18n.enemyName(enemy?.id, enemy?.name ?? combatant.id);
  },

  _combatantIcon(combatant) {
    if (!combatant) return '•';
    if (combatant.id === 'player') return '👤';
    if (combatant.sourceType === 'companion') return COMPANION_ICONS[combatant.sourceId ?? combatant.id] ?? '🤝';
    const enemy = GameState.combat?.enemies?.[combatant.enemyIndex];
    return enemy?.icon ?? '☣';
  },

  _combatantImage(combatant) {
    if (!combatant) return null;
    const spriteImage = this._spriteImage(this._combatantSprite(combatant));
    if (spriteImage) return spriteImage;
    if (combatant.id === 'player') {
      const charDef = CHARACTERS.find(c => c.id === GameState.player?.characterId) ?? {};
      return charDef.portraitFull ?? charDef.portraitSmall ?? (GameState.player?.gender === 'F' ? PLAYER_IMG_F : PLAYER_IMG_M);
    }
    if (combatant.sourceType === 'enemy') {
      return GameState.combat?.enemies?.[combatant.enemyIndex]?.image ?? null;
    }
    return null;
  },

  _skillLabel(skill) {
    if (!skill) return '';
    if (SAMPLE_SKILL_LABELS[skill.id]) return SAMPLE_SKILL_LABELS[skill.id];
    if (skill.fallbackName) return skill.fallbackName;
    const translated = skill.nameKey ? I18n.t(skill.nameKey) : '';
    if (translated && translated !== skill.nameKey) return translated;
    return String(skill.id ?? '').replace(/^combat\.skill\./, '').replaceAll('_', ' ');
  },

  _skillIconHtml(icon, isAttack = false) {
    const key = icon ?? (isAttack ? 'strike' : 'item');
    const src = combatAssetManifest.skillIcon(key, isAttack ? 'strike' : 'item');
    return `<img class="skill-icon-img" src="${this._escape(src)}" alt="">`;
  },

  _renderTopHud(combat, gs) {
    const districtName = DISTRICTS[gs.location?.currentDistrict]?.name ?? (gs.location?.currentDistrict ?? '종로3가역 승강장');
    const gameHour = String(gs.time?.hour ?? 1).padStart(2, '0');
    const weatherName = gs.weather?.name ?? '어둡고 비';
    const dangerLv = combat.dangerLevel ?? 3;
    const dangerText = DANGER_LABEL[Math.min(dangerLv, 5)] ?? '위험';
    return `
      <header class="combat-top-bar combat-focused-top">
        <div class="ctb-left">
          <span class="ctb-brand">서울 생존 · <b>전투</b></span>
          <span class="ctb-divider"></span>
          <span class="ctb-chip">${combat.roundNumber ?? 1} 라운드</span>
        </div>
        <div class="ctb-right">
          <span class="ctb-chip">지역 ${this._escape(districtName)}</span>
          <span class="ctb-chip">시간 ${gameHour}:42</span>
          <span class="ctb-chip">날씨 ${this._escape(weatherName)}</span>
          <span class="ctb-chip danger-chip">위험 레벨 <b>${this._escape(dangerText)}</b></span>
          <button class="ctb-chip fx-speed-toggle" type="button" title="전투 연출 배속 (빈 전장 클릭 = 연출 스킵)">연출 ×${this._fxSpeed}</button>
        </div>
      </header>`;
  },

  _renderFormationSide(side, combat) {
    const slots = Array.isArray(combat?.formations?.[side])
      ? combat.formations[side]
      : [null, null, null, null];
    return `
      <section class="combat-formation ${side}" data-side="${side}" aria-label="${side === 'ally' ? '아군 대열' : '적 대열'}">
        ${slots.map((combatantId, index) => `
          <div class="formation-slot ${side}${combatantId ? ' occupied' : ' empty'}"
               data-side="${side}"
               data-rank="${side === 'ally' ? 4 - index : index + 1}">
            ${combatantId ? this._renderCombatant(combatantId, combat) : '<div class="formation-empty">EMPTY</div>'}
          </div>`).join('')}
      </section>`;
  },

  _renderCombatant(combatantId, combat) {
    const combatant = combat?.combatants?.[combatantId];
    if (!combatant) return '';
    const hp = Math.max(0, combatant.hp ?? 0);
    const maxHp = Math.max(1, combatant.maxHp ?? 1);
    const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const tokens = Object.entries(combatant.tokens ?? {})
      .filter(([, stacks]) => stacks > 0)
      .map(([token, stacks]) => `<span class="combat-token">${this._escape(token)} ${stacks}</span>`)
      .join('');
    const isEnemy = combatant.side === 'enemy';
    // 의도 표시 단일 소스: 실행 경로(_runSingleEnemyTurn)가 소비하는 _nextIntent만 사용 —
    // 별도 계산된 의도를 표시하면 실제 행동과 어긋날 수 있다
    const legacyEnemy = isEnemy ? this._enemyForCombatant(combatant) : null;
    const intent = legacyEnemy?._nextIntent ?? null;
    let intentHtml = '';
    if (intent && !combatant.dead) {
      const countdownHtml = intent.countdown != null
        ? `<span class="intent-count">${this._escape(intent.countdown)}</span>`
        : '';
      intentHtml = `
        <div class="combat-intent${intent.countdown != null && intent.countdown <= 1 ? ' imminent' : ''}"
             title="${this._escape(intent.label ?? '')}">
          <span class="intent-icon">${intent.iconEmoji ?? '🗡'}</span>${countdownHtml}
        </div>`;
    }
    // 발견한 약점만 표시 — 첫 약점 타격 전에는 미지의 정보
    let weaknessHtml = '';
    if (legacyEnemy && !combatant.dead
        && GameState.flags?.enemyWeaknessSeen?.[legacyEnemy.id]
        && (legacyEnemy.weaknesses ?? []).length > 0) {
      const WEAKNESS_ICONS = { blade: '🔪', fire: '🔥', bullet: '🔫', blunt: '🔨', explosive: '💥' };
      const icons = legacyEnemy.weaknesses
        .map(type => WEAKNESS_ICONS[type] ?? '⚔')
        .join('');
      weaknessHtml = `
        <div class="combat-weakness" title="약점: ${this._escape(legacyEnemy.weaknesses.join(', '))}">${icons}</div>`;
    }
    const rank = getRank(combat?.formations, combatantId);
    const image = this._combatantImage(combatant);
    const statuses = [
      ...Object.entries(combatant.tokens ?? {})
        .filter(([, stacks]) => stacks > 0)
        .map(([token, stacks]) => `${token} ${stacks}`),
      ...(combatant.statusEffects ?? []).map(status => status.name ?? status.id ?? 'status'),
    ];
    const anchorCls = isEnemy
      ? 'cv-enemy-sprite'
      : combatant.id === 'player'
        ? 'cv-player'
        : 'cv-ally';
    const enemyIndex = this._enemyIndexForCombatant(combatant);
    const anchorAttrs = [
      isEnemy && enemyIndex !== null ? `data-idx="${this._escape(enemyIndex)}"` : '',
      combatant.sourceType === 'companion' ? `data-companion-id="${this._escape(combatant.sourceId ?? combatant.id)}"` : '',
    ].filter(Boolean).join(' ');
    const sprite = this._combatantSprite(combatant);
    const spriteAttrs = sprite
      ? ` data-sprite-id="${this._escape(sprite.id)}" data-motion-state="${combatant.dead ? 'death' : 'idle'}"${this._spriteStateAttrs(sprite)}`
      : '';
    const cls = [
      'combatant-piece',
      combatant.side,
      anchorCls,
      sprite ? 'combat-sprite' : '',
      sprite ? `combat-sprite-${sprite.role}` : '',
      combat.activeCombatantId === combatantId ? 'is-active' : '',
      combatant.deathsDoor ? 'is-deaths-door' : '',
      combatant.dead ? 'is-dead' : '',
      this._targetableIds ? (this._targetableIds.has(combatantId) ? 'targetable' : 'not-targetable') : '',
    ].filter(Boolean).join(' ');

    return `
      <button class="${cls}" data-combatant-id="${this._escape(combatantId)}"${spriteAttrs} ${anchorAttrs}${this._spriteStyle(sprite)}>
        ${intentHtml}${weaknessHtml}
        <span class="combatant-rank-badge">${rank ?? '-'}</span>
        <span class="combatant-portrait" aria-hidden="true">
          ${image
            ? `<img src="${this._escape(image)}" alt="" onerror="this.remove();this.parentElement.dataset.fallback='1';">`
            : ''}
          <span class="combatant-icon">${this._escape(this._combatantIcon(combatant))}</span>
        </span>
        <span class="combatant-name">${this._escape(this._combatantLabel(combatant))}</span>
        ${statuses.length > 0 ? `<span class="combat-status-orbs">${statuses.slice(0, 3).map(status => `<i>${this._escape(status)}</i>`).join('')}</span>` : ''}
        <span class="combatant-hp-bar"><span style="width:${hpPct.toFixed(0)}%"></span></span>
        <span class="combatant-hp">${hp}/${maxHp}</span>
        ${combatant.deathsDoor ? '<span class="deaths-door-label">DEATHS DOOR</span>' : ''}
        ${tokens ? `<span class="combat-token-row">${tokens}</span>` : ''}
      </button>`;
  },

  _renderStatusPanels(side, combat) {
    const slots = Array.isArray(combat?.formations?.[side]) ? combat.formations[side] : [];
    const cards = slots
      .map((combatantId) => combatantId ? combat.combatants?.[combatantId] : null)
      .filter(Boolean)
      .map((combatant) => {
        const hp = Math.max(0, combatant.hp ?? 0);
        const maxHp = Math.max(1, combatant.maxHp ?? 1);
        const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        const secondary = combatant.id === 'player'
          ? GameState.stats?.stamina ?? { current: 0, max: 100 }
          : { current: combatant.stress ?? 0, max: 10 };
        const secPct = Math.max(0, Math.min(100, ((secondary.current ?? 0) / Math.max(1, secondary.max ?? 1)) * 100));
        return `
          <button class="combat-status-card ${combatant.side}" data-combatant-id="${this._escape(combatant.id)}">
            <span class="status-rank">${getRank(combat.formations, combatant.id) ?? '-'}</span>
            <strong>${this._escape(this._combatantLabel(combatant))}</strong>
            <span class="status-bar hp"><i style="width:${hpPct.toFixed(0)}%"></i></span>
            <em>${hp}/${maxHp}</em>
            <span class="status-bar aux"><i style="width:${secPct.toFixed(0)}%"></i></span>
            <em>${secondary.current ?? 0}/${secondary.max ?? 10}</em>
          </button>`;
      }).join('');
    return `<div class="combat-status-panels ${side}">${cards}</div>`;
  },

  _renderSkillBar(activeCombatant, combat) {
    const skillIds = activeCombatant?.skillIds ?? [];
    const activeRank = getRank(combat?.formations, activeCombatant?.id);
    return `
      <div class="combat-skill-bar">
        ${skillIds.slice(0, 5).map(skillId => {
          const skill = combat.skillsById?.[skillId] ?? { id: skillId };
          const selected = combat.selectedSkillId === skillId ? ' selected' : '';
          const label = this._skillLabel(skill);
          const isAttack = (skill.effects ?? []).some(effect => effect?.type === 'damage');
          const rangeLabel = skill.target?.side === 'ally' ? '보조' : (skill.target?.ranks?.length >= 4 ? '원거리' : '근접');
          const costLabel = skill.costs?.ammo ? '탄약 1' : skill.costs?.stamina ? `스태미나 ${skill.costs.stamina}` : '행동 1';
          const dmg = (skill.effects ?? []).find(effect => effect?.type === 'damage')?.value;
          const preview = CombatSystem.previewRankedSkill?.(skillId);
          const invalidOrigin = Array.isArray(skill.usableFrom)
            && activeRank !== null
            && !skill.usableFrom.includes(activeRank);
          const disabled = invalidOrigin || combat.phase !== 'await_ally_input';
          const title = invalidOrigin
            ? `현재 위치(rank ${activeRank})에서는 사용할 수 없습니다.`
            : '';
          const statRows = [];
          if (dmg) statRows.push(`<span class="skill-stat">피해 ${dmg[0]}-${dmg[1]}</span>`);
          if (isAttack && preview && !preview.supportive) {
            statRows.push(`<span class="skill-stat">명중 ${preview.accuracy}%</span>`);
            if (preview.critChance > 0) statRows.push(`<span class="skill-stat crit">치명타 ${preview.critChance}%</span>`);
          }
          if (!dmg) statRows.push(`<span class="skill-stat">${this._escape(costLabel)}</span>`);
          return `
            <button class="combat-skill-button combat-action-card${selected}${invalidOrigin ? ' disabled' : ''}"
                    data-skill-id="${this._escape(skillId)}"
                    title="${this._escape(title)}"
                    ${disabled ? 'disabled' : ''}>
              <span class="action-cost">${skill.costs?.stamina ?? 1}</span>
              <span class="skill-name">${this._escape(label)}</span>
              <span class="skill-range">${this._escape(rangeLabel)}</span>
              <span class="skill-icon">${this._skillIconHtml(skill.icon, isAttack)}</span>
              <span class="skill-detail skill-stats">${statRows.join('')}</span>
              ${invalidOrigin ? '<span class="skill-lock">(위치 변경 필요)</span>' : ''}
            </button>`;
        }).join('')}
      </div>`;
  },

  _firstCombatItemId() {
    const item = [
      ...(CombatSystem.getAvailableMedicals?.() ?? []),
      ...(CombatSystem.getAvailableThrowables?.() ?? []),
    ][0];
    return item?.instanceId ?? null;
  },

  _renderCombatItemSlot(activeCombatant) {
    const itemId = this._firstCombatItemId();
    const disabled = activeCombatant?.itemUsedThisTurn || !itemId;
    return `<button class="combat-item-slot combat-action-card${disabled ? ' disabled' : ''}"
                    data-command="item"
                    data-item-id="${this._escape(itemId ?? '')}"
                    ${disabled ? 'disabled' : ''}>
              <span class="action-cost">1</span>
              <span class="skill-name">아이템 사용</span>
              <span class="skill-range">보조</span>
              <span class="skill-icon">${this._skillIconHtml('item')}</span>
              <span class="skill-detail">아이템을 사용합니다</span>
            </button>`;
  },

  _renderDetailPopover(combatantId, combat) {
    const combatant = combat?.combatants?.[combatantId];
    if (!combatant) return '';
    const statuses = (combatant.statusEffects ?? [])
      .map(status => this._escape(status.id ?? status.name ?? 'status'))
      .join(', ');
    return `
      <aside class="combat-detail-popover" data-popover-for="${this._escape(combatantId)}">
        <strong>${this._escape(this._combatantLabel(combatant))}</strong>
        <span>${this._escape(combatantId)}</span>
        <span>HP ${combatant.hp ?? 0}/${combatant.maxHp ?? 0}</span>
        <span>Stress ${combatant.stress ?? 0}</span>
        ${statuses ? `<span>${statuses}</span>` : ''}
      </aside>`;
  },

  _renderEventTicker(combat) {
    const inspected = combat?.inspectedCombatantId
      ? `대상: ${combat.inspectedCombatantId}`
      : null;
    const latest = [
      inspected,
      ...(combat?.log ?? []).slice(-2),
    ].filter(Boolean).map(entry => this._escape(entry)).join(' / ');
    return `<div class="combat-event-ticker">${latest}</div>`;
  },

  _renderFocusedInternal(combat, gs) {
    const active = combat.combatants?.[combat.activeCombatantId];
    const canMove = CombatSystem.findActiveSkillByEffect?.('move') !== null;
    const commandDisabled = combat.phase !== 'await_ally_input';
    const scene = this._combatScene();

    // 타겟 선택 단계: 선택한 스킬로 실제 지정 가능한 대상을 미리 계산해 하이라이트
    this._targetableIds = null;
    if (combat.phase === 'select_target' && combat.selectedSkillId) {
      const selectedSkill = combat.skillsById?.[combat.selectedSkillId];
      if (selectedSkill && combat.activeCombatantId) {
        this._targetableIds = new Set(Object.values(combat.combatants ?? {})
          .filter(c => c.dead !== true && (c.hp ?? 0) > 0)
          .filter(c => CombatSystem._validateRankedSkillPosition?.(combat.activeCombatantId, c.id, selectedSkill)?.ok === true)
          .map(c => c.id));
      }
    }
    this._screen.innerHTML = `
      <div class="combat-wrap combat-focused" data-combat-scene="${this._escape(scene.id)}" style="${this._combatAssetStyle()}">
        ${this._renderTopHud(combat, gs)}
        <div class="combat-round-track">
          ${this._renderInitiativeBar(combat, gs)}
          <div class="combat-round-medallion"><span>${combat.roundNumber ?? 1}</span></div>
        </div>
        <main class="combat-battlefield combat-visual">
          <div class="combat-stage-floor" aria-hidden="true"><span>1</span><span>2</span><span>3</span></div>
          <div class="combat-focused-lineup">
            <div class="combat-line-zone combat-line-zone-ally">
              ${this._renderFormationSide('ally', combat)}
            </div>
            <div class="combat-rank-divider" aria-hidden="true">
              <span>VS</span>
            </div>
            <div class="combat-line-zone combat-line-zone-enemy">
              ${this._renderFormationSide('enemy', combat)}
            </div>
          </div>
          <div class="combat-status-board">
            ${this._renderStatusPanels('ally', combat)}
            ${this._renderStatusPanels('enemy', combat)}
          </div>
          <div class="combat-stage-center">${this._renderEventTicker(combat)}</div>
        </main>
        <footer class="combat-command-deck">
          ${this._renderSkillBar(active, combat)}
          ${this._renderCombatItemSlot(active)}
          <button class="combat-common-command combat-action-card${canMove ? '' : ' disabled'}"
                  data-command="move"
                  ${(!canMove || commandDisabled) ? 'disabled' : ''}>
            <span class="action-cost">1</span>
            <span class="skill-name">이동</span>
            <span class="skill-range">기동</span>
            <span class="skill-icon">${this._skillIconHtml('move')}</span>
            <span class="skill-detail">위치 변경</span>
          </button>
          <button class="combat-common-command combat-action-card"
                  data-command="flee"
                  ${commandDisabled ? 'disabled' : ''}>
            <span class="action-cost">1</span>
            <span class="skill-name">도주</span>
            <span class="skill-range">탈출</span>
            <span class="skill-icon">${this._skillIconHtml('move')}</span>
            <span class="skill-detail">전투 이탈 시도</span>
          </button>
        </footer>
      </div>`;
    this._bindFocusedCombatEvents(combat);
  },

  _bindFocusedCombatEvents(combat) {
    this._screen.querySelectorAll('.combat-skill-button').forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        if (CombatSystem.selectSkill(button.dataset.skillId)) this.render();
      });
    });

    this._screen.querySelectorAll('[data-combatant-id]').forEach(button => {
      button.addEventListener('click', () => {
        const combatantId = button.dataset.combatantId;
        if (combat.selectedSkillId) {
          if (CombatSystem.selectTarget(combatantId)) {
            CombatSystem.confirmAction();
          }
        } else {
          combat.inspectedCombatantId = combat.inspectedCombatantId === combatantId ? null : combatantId;
        }
        if (GameState.combat?.active) this.render();
      });
    });

    this._screen.querySelector('.combat-item-slot')?.addEventListener('click', () => {
      const itemId = this._screen.querySelector('.combat-item-slot')?.dataset.itemId;
      if (itemId) CombatSystem.useCombatItem(itemId);
      if (GameState.combat?.active) this.render();
    });

    this._screen.querySelectorAll('.combat-common-command').forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        if (button.dataset.command === 'move') {
          CombatSystem.useActiveSkillByEffect('move');
        } else if (button.dataset.command === 'flee') {
          CombatSystem.attemptFlee();
        }
        if (GameState.combat?.active) this.render();
      });
    });

    this._screen.querySelector('.fx-speed-toggle')?.addEventListener('click', () => {
      this.toggleFxSpeed();
      const toggle = this._screen.querySelector('.fx-speed-toggle');
      if (toggle) toggle.textContent = `연출 ×${this._fxSpeed}`;
    });

    // 빈 전장 클릭 = 진행 중인 연출 스킵 (combatant 클릭은 타겟 지정이므로 제외)
    this._screen.querySelector('.combat-battlefield')?.addEventListener('click', (event) => {
      if (!event.target.closest('[data-combatant-id]')) this.skipFxQueue();
    });
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

    if (combat.combatants && combat.formations) {
      this._renderFocusedInternal(combat, gs);
      this._playFxQueue();
      return;
    }

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
    const charDef    = CHARACTERS.find(c => c.id === gs.player.characterId) ?? {};
    const genderImg  = gs.player.gender === 'F' ? PLAYER_IMG_F : PLAYER_IMG_M;
    const playerSpriteSheetKey = this._playerSpriteSheetKey(gs);
    const combatFallbackImg = gs.player.gender === 'F' ? PLAYER_COMBAT_FALLBACK_F : PLAYER_COMBAT_FALLBACK_M;
    const playerImg  = playerSpriteSheetKey ? (charDef.portraitFull ?? combatFallbackImg) : combatFallbackImg;
    const portraitImg = charDef.portraitSmall ?? genderImg;
    const battleBg = this._combatScene().backdrop ?? './assets/images/subway_ruined.jpg';

    // ── 장착 무기 (미장착 시 보드 첫 무기로 폴백 — 주 공격 카드와 일치) ──
    const equippedId = gs.player.equipped?.weapon_main ?? gs.player.equipped?.weapon_sub;
    const weaponId   = equippedId ?? CombatSystem.getAvailableWeapons()[0]?.instanceId ?? null;
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
    const playerStatusMotionClass = this._statusMotionClasses(combat.playerStatus);

    // ── 적 데이터 ─────────────────────────────────────────────
    const enemyCount  = combat.enemies.length;
    const aliveCount  = combat.enemies.filter(e => e.currentHp > 0).length;
    const playerWeaponType = weaponDef?.weaponType ?? null;
    const isRangedWeapon   = CombatSystem.weaponReachIsRanged(weaponDef);
    const targetEnemy = combat.enemies[combat.targetIndex] ?? combat.enemies[0];

    // ── 적 스프라이트 (전열/후열 진형 — Darkest Dungeon식) ────
    const renderEnemySprite = (enemy, i, visualFront = false) => {
      const isDead   = enemy.currentHp <= 0;
      const wasAlive = enemy._wasAlive ?? !isDead;
      const justDied = wasAlive && isDead;
      const isTarget = i === combat.targetIndex && !isDead;
      const eHpPct   = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
      const eHpClass = eHpPct < 25 ? 'crit' : eHpPct < 50 ? 'low' : '';
      const ghostPct = Math.max(0, ((enemy._prevHp ?? enemy.currentHp) / enemy.maxHp) * 100);
      const visualRow = visualFront ? 'front' : CombatSystem.rowOf(enemy);
      const unreachable = !isDead && !CombatSystem.isEnemyReachable(enemy, isRangedWeapon);

      const enemyLabel = I18n.enemyName(enemy.id ?? enemy.definitionId, enemy.name);
      const manifestSprite = combatAssetManifest.enemySprite(enemy);
      const enemyImage = this._spriteImage(manifestSprite);
      const enemySheetKey = this._enemySpriteSheetKey(enemy);
      const spriteHtml = enemySheetKey
        ? `${this._renderCombatSpriteSheet(enemySheetKey, 'cv-enemy-img combat-sprite-sheet cv-enemy-sheet', enemyLabel)}
           <div class="cv-enemy-icon img-fallback">${enemy.icon ?? '👾'}</div>`
        : enemyImage
        ? `<img class="cv-enemy-img combat-sprite-img" src="${enemyImage}" alt="${enemyLabel}"
             onerror="this.style.display='none';var f=this.parentElement.querySelector('.cv-enemy-icon');if(f)f.style.display='flex';">
           <div class="cv-enemy-icon img-fallback">${enemy.icon ?? '👾'}</div>`
        : enemy.image
        ? `<img class="cv-enemy-img" src="${enemy.image}" alt="${enemyLabel}"
             onerror="this.style.display='none';var f=this.parentElement.querySelector('.cv-enemy-icon');if(f)f.style.display='flex';">
           <div class="cv-enemy-icon img-fallback">${enemy.icon ?? '👾'}</div>`
        : `<div class="cv-enemy-icon">${enemy.icon ?? '👾'}</div>`;

      const perEnemyStatus = (enemy._statusEffects ?? []).map(s =>
        `<span class="status-badge enemy">${s.name}(${s.duration})</span>`
      ).join('');
      const enemyStatusMotionClass = this._statusMotionClasses(enemy._statusEffects ?? []);

      let affinityHint = '';
      if (playerWeaponType && !isDead) {
        if (enemy.weaknesses?.includes(playerWeaponType))
          affinityHint = `<span class="affinity-badge weakness">${WEAKNESS_LABEL[playerWeaponType] ?? '⬆약점'}</span>`;
        else if (enemy.resistances?.includes(playerWeaponType))
          affinityHint = `<span class="affinity-badge resistance">${RESIST_LABEL[playerWeaponType] ?? '⬇저항'}</span>`;
      }

      // 의도 예고 배지 — 머리 위에 [행동 아이콘][카운트다운]➤[타겟 아이콘]
      let intentHtml = '';
      const intent = enemy._nextIntent;
      if (!isDead && intent) {
        const cd = intent.countdown != null ? `<b class="cvi-cd">${intent.countdown}</b>` : '';
        const tgtIcon = intent.targetType === 'companion'
          ? (COMPANION_ICONS[intent.targetId] ?? '🤝')
          : '👤';
        // 전진 의도는 타겟 연계 화살표 없이 아이콘만 표시
        const linkHtml = intent.action === 'advance'
          ? ''
          : `<span class="cvi-arrow">➤</span><span class="cvi-target">${tgtIcon}</span>`;
        const imminent = intent.countdown != null && intent.countdown <= 1;
        intentHtml = `
          <div class="cv-intent${imminent ? ' imminent' : ''}" title="${intent.label ?? ''}">
            <span class="cvi-icon">${intent.iconEmoji ?? '🗡'}</span>${cd}${linkHtml}
          </div>`;
      }

      const rowBadge = visualRow === 'back' && !isDead
        ? `<span class="cv-row-badge">${I18n.t('combat.rankBack')}${unreachable ? ' 🚫' : ''}</span>`
        : '';

      const enemyKindClass = enemy.type === 'zombie' || String(enemy.id ?? enemy.definitionId ?? '').includes('zombie')
        ? 'enemy-zombie motion-zombie-idle'
        : 'enemy-human';

      const spriteClass = ['cv-enemy-sprite',
        enemyKindClass,
        enemyStatusMotionClass,
        manifestSprite ? 'combat-sprite combat-sprite-enemy' : '',
        isTarget ? 'is-target' : '', isDead ? 'is-dead' : '',
        justDied ? 'just-died motion-zombie-death' : '', isEntry ? 'entering' : '',
        unreachable ? 'unreachable' : '',
      ].filter(Boolean).join(' ');
      const spriteAttrs = manifestSprite
        ? ` data-sprite-id="${this._escape(manifestSprite.id)}" data-motion-state="${isDead ? 'death' : 'idle'}"${this._spriteStateAttrs(manifestSprite)}${this._spriteStyle(manifestSprite)}`
        : '';

      return `
        <div class="${spriteClass}" data-idx="${i}"${spriteAttrs}>
          ${intentHtml}
          ${spriteHtml}
          ${affinityHint}
          ${rowBadge}
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
    };

    const frontEnemies = combat.enemies.map((e, i) => ({ e, i })).filter(x => CombatSystem.rowOf(x.e) === 'front');
    const backEnemies  = combat.enemies.map((e, i) => ({ e, i })).filter(x => CombatSystem.rowOf(x.e) === 'back');
    const frontRankHtml = frontEnemies.map(x => renderEnemySprite(x.e, x.i)).join('');
    const backRankHtml  = backEnemies.map(x => renderEnemySprite(x.e, x.i)).join('');
    const aliveEnemyEntries = combat.enemies
      .map((e, i) => ({ e, i }))
      .filter(x => (x.e.currentHp ?? 0) > 0);
    const hasLivingFrontEnemy = aliveEnemyEntries.some(x => CombatSystem.rowOf(x.e) === 'front');
    const stageEnemyEntries = aliveEnemyEntries.map(x => ({
      ...x,
      visualFront: !hasLivingFrontEnemy && CombatSystem.rowOf(x.e) === 'back',
    }));

    // ── 아군 횡렬 진형 (동료 최대 2 + 플레이어) ───────────────
    const stageCompanions = (gs.companions ?? []).slice(0, 2);
    const companionUnitsHtml = stageCompanions.map((npcId, rankIdx) => {
      const st = gs.npcs?.states?.[npcId];
      const hp = st?.hp ?? 0;
      const maxHp = st?.maxHp ?? 50;
      const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
      const name = I18n.itemName(npcId, st?.name ?? npcId);
      return `
        <div class="cv-ally cv-ally-unit companion-unit${hp <= 0 ? ' is-dead' : ''}" data-companion-id="${npcId}" title="${name}">
          <div class="cv-rank-token">A${rankIdx + 1}</div>
          <div class="cv-unit-body">
            ${this._companionSpriteSheetKey(npcId)
              ? this._renderCombatSpriteSheet(this._companionSpriteSheetKey(npcId), 'cv-ally-icon combat-sprite-sheet cv-companion-sheet', name)
              : ''}
            <span class="cv-ally-icon">${COMPANION_ICONS[npcId] ?? '👤'}</span>
          </div>
          <div class="cv-unit-plate">
            <div class="cv-unit-name">${name}</div>
            <div class="cv-hp-bar-track">
              <div class="cv-hp-bar-fill" style="width:${pct.toFixed(0)}%"></div>
            </div>
            <div class="cv-hp-text">HP ${hp}/${maxHp}</div>
          </div>
        </div>`;
    }).join('');

    const playerGenderClass = gs.player.gender === 'F' ? 'player-female' : 'player-male';
    const playerRank = CombatSystem.playerRankOf(combat);
    const playerRankLabel = playerRank === 'back' ? I18n.t('combat.rankBack') : I18n.t('combat.rankFront');
    const nextPlayerRankLabel = playerRank === 'back' ? I18n.t('combat.rankFront') : I18n.t('combat.rankBack');
    const playerUnitHtml = `
      <div class="cv-player cv-ally-unit player-unit player-rank-${playerRank} ${playerGenderClass} motion-idle ${playerStatusMotionClass}">
        <div class="cv-rank-token">P-${playerRankLabel}</div>
        <div class="cv-unit-body">
          ${playerSpriteSheetKey
            ? this._renderCombatSpriteSheet(playerSpriteSheetKey, 'cv-player-img combat-sprite-sheet cv-player-sheet', gs.player.name ?? '')
            : ''}
          <img class="cv-player-img cv-player-fallback-img" src="${playerImg}" alt="${gs.player.name ?? ''}"
               onerror="if(this.src.indexOf('${genderImg.replace('./', '')}')<0){this.src='${genderImg}';}">
        </div>
        <div class="cv-unit-plate">
          <div class="cv-unit-name">${gs.player.name ?? '생존자'}</div>
          <div class="cv-hp-bar-track">
            <div class="cv-hp-bar-ghost cpp-bar-ghost" style="width:${prevPHpPct.toFixed(1)}%"></div>
            <div class="cv-hp-bar-fill ${hpClass}" style="width:${hpPct.toFixed(1)}%"></div>
          </div>
          <div class="cv-unit-meta">HP ${gs.player.hp.current}/${gs.player.hp.max} · STA ${Math.round(gs.stats.stamina.current)}</div>
          ${playerStatusHtml ? `<div class="cv-status-row">${playerStatusHtml}</div>` : ''}
        </div>
      </div>`;

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
    const currentEntry = CombatSystem.currentEntry(combat);
    const manualCompanionTurn = currentEntry?.type === 'companion'
      && CombatSystem.isManualCompanionTurn(combat);
    const activeCompanionId = manualCompanionTurn ? currentEntry.id : null;
    const canPlayerAct = CombatSystem.canPlayerAct(combat);

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

    const activeCompanionName = activeCompanionId
      ? I18n.itemName(activeCompanionId, gs.npcs?.states?.[activeCompanionId]?.name ?? activeCompanionId)
      : '';
    const companionActionCardsHtml = manualCompanionTurn ? `
          <div class="action-card companion-action-card primary" data-action="manualCompanionAttack" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">⚔</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 공격</span>
                <span class="ac-sub">COMPANION ATTACK</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>대상</span><strong>${I18n.enemyName(targetEnemy?.id ?? targetEnemy?.definitionId, targetEnemy?.name ?? '')}</strong></div>
              <div class="ac-row"><span>행동</span><strong>선택 적 공격</strong></div>
            </div>
          </div>
          <div class="action-card companion-action-card" data-action="manualCompanionHeal" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">✚</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 치료</span>
                <span class="ac-sub">COMPANION HEAL</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>대상</span><strong>플레이어</strong></div>
              <div class="ac-row good"><span>조건</span><strong>HP 낮을 때 효과</strong></div>
            </div>
          </div>
          <div class="action-card companion-action-card" data-action="manualCompanionSupport" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">2</span>
            <div class="ac-header">
              <span class="ac-icon">✦</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 지원</span>
                <span class="ac-sub">COMPANION SKILL</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>스킬</span><strong>직업 지원</strong></div>
              <div class="ac-row"><span>쿨다운</span><strong>가능 시 사용</strong></div>
            </div>
          </div>
          <div class="action-card companion-action-card" data-action="manualCompanionHold" data-companion-id="${activeCompanionId}">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">◼</span>
              <div class="ac-title-group">
                <span class="ac-name">${activeCompanionName} 대기</span>
                <span class="ac-sub">COMPANION HOLD</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>효과</span><strong>피해 감소</strong></div>
              <div class="ac-row good"><span>턴</span><strong>동료 행동 종료</strong></div>
            </div>
          </div>` : '';
    const companionBtns = manualCompanionTurn ? `
      <button class="sec-btn companion manual" data-action="manualCompanionAttack" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 공격
      </button>
      <button class="sec-btn companion manual" data-action="manualCompanionHeal" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 치료
      </button>
      <button class="sec-btn companion manual" data-action="manualCompanionSupport" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 지원
      </button>
      <button class="sec-btn companion manual secondary" data-action="manualCompanionHold" data-companion-id="${activeCompanionId}">
        ${activeCompanionName} 대기
      </button>` : false ? `
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
          const rowTag = CombatSystem.rowOf(e) === 'back' ? ` <small>[${I18n.t('combat.rankBack')}]</small>` : '';
          return `<div class="cep-enemy-item ${active ? 'active' : ''} ${dead ? 'dead' : ''}" data-idx="${i}">
            <span>${e.icon ?? '👾'}</span>
            <span>${I18n.enemyName(e.id ?? e.definitionId, e.name)}${rowTag}</span>
            <span>${dead ? '💀' : hp + '%'}</span>
          </div>`;
        }).join('')}
      </div>` : '';

    // ══════════════════════════════════════════════════════════
    // HTML 조립
    // ══════════════════════════════════════════════════════════
    this._screen.innerHTML = `
      <div class="combat-wrap${canPlayerAct ? '' : ' actor-locked'}${manualCompanionTurn ? ' manual-companion-turn' : ''}"
           data-combat-scene="${this._escape(this._combatScene().id)}" style="${this._combatAssetStyle()}">

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

        <!-- ② 메인 전장 ─────────────────────────────────── -->
        <div class="combat-main">
          <div class="combat-visual${isHpCrit ? ' hp-crit' : ''}"
               style="background-image:url('${battleBg}')">
            ${isNight ? '<div class="combat-night-tint"></div>' : ''}

            <div class="cv-context-overlay">
              <span>${distText}</span>
              <span>${coverText}</span>
              <span>${lightText}</span>
              <span>${noiseText}</span>
            </div>

            <div class="combat-stage-lineup cv-stage">
              <div class="cv-ally-line">
                ${companionUnitsHtml}
                ${playerUnitHtml}
              </div>
              <div class="cv-lineup-gap">
                <div class="cv-range-label">${distText.replace('🎯 ', '')}</div>
              </div>
              <div class="cv-enemy-line count-${Math.min(stageEnemyEntries.length || 1, 4)}${!hasLivingFrontEnemy ? ' is-front-filled' : ''}">
                ${stageEnemyEntries.map(({ e, i, visualFront }) => renderEnemySprite(e, i, visualFront)).join('')}
              </div>
            </div>

            ${lastLog ? `<div class="cv-log-overlay">${lastLog}</div>` : ''}
          </div>

        </div><!-- .combat-main -->

        <!-- ③ 하단: 액션 카드 바 ───────────────────────── -->
        <footer class="combat-action-bar">
          ${companionActionCardsHtml}

          <!-- 공격 카드 -->
          <div class="action-card primary" data-action="${weaponId ? 'attack' : 'unarmed'}" data-weapon="${weaponId ?? ''}">
            <span class="ac-cost">${weaponDef?.combat?.requiresAmmo ? 2 : 1}</span>
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
            <span class="ac-cost">1</span>
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
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">🎒</span>
              <div class="ac-title-group">
                <span class="ac-name">아이템 <small>(${medicals.length})</small></span>
                <span class="ac-sub">USE ITEM</span>
              </div>
            </div>
            <div class="ac-item-list">${medBtnsHtml}</div>
          </div>

          <!-- 이동 카드 -->
          <div class="action-card move" data-action="move">
            <span class="ac-cost">1</span>
            <div class="ac-header">
              <span class="ac-icon">👣</span>
              <div class="ac-title-group">
                <span class="ac-name">이동</span>
                <span class="ac-sub">MOVE</span>
              </div>
            </div>
            <div class="ac-preview">
              <div class="ac-row"><span>현재</span><strong>${playerRankLabel}</strong></div>
              <div class="ac-row good"><span>이동</span><strong>${nextPlayerRankLabel}</strong></div>
            </div>
          </div>

          <!-- 도주 카드 -->
          <div class="action-card flee" data-action="flee">
            <span class="ac-cost">2</span>
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

    if (manualCompanionTurn) {
      this._syncManualCompanionActionUi(activeCompanionId);
    }

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
        if (btn.getAttribute('aria-disabled') === 'true') return;
        const action   = btn.dataset.action;
        const wId      = btn.dataset.weapon || null;

        if (action === 'manualCompanionAttack') {
          CombatSystem.resolveManualCompanionAction('attack', btn.dataset.companionId);
        } else if (action === 'manualCompanionHeal') {
          CombatSystem.resolveManualCompanionAction('heal', btn.dataset.companionId);
        } else if (action === 'manualCompanionSupport') {
          CombatSystem.resolveManualCompanionAction('support', btn.dataset.companionId);
        } else if (action === 'manualCompanionHold') {
          CombatSystem.resolveManualCompanionAction('hold', btn.dataset.companionId);
        } else if (!CombatSystem.canPlayerAct(GameState.combat)) {
          return;
        } else if (action === 'attack' && wId) {
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
        }
      });
    });

    // ── 연출 큐 재생 (행동 결과 → 순차 애니메이션) ───────────
    this._playFxQueue();
  },

  _companionClassSkill(npcId) {
    return BALANCE.combat?.companionAuto?.classSkills?.[npcId] ?? null;
  },

  _syncManualCompanionActionUi(npcId) {
    if (!this._screen || !npcId) return;

    const actionBar = this._screen.querySelector('.combat-action-bar');
    if (actionBar) {
      actionBar.querySelectorAll('.action-card:not(.companion-action-card)')
        .forEach(el => el.remove());
    }

    const secRow = this._screen.querySelector('.combat-sec-row');
    if (secRow) {
      secRow.querySelectorAll('[data-action]').forEach(el => {
        if (!String(el.dataset.action ?? '').startsWith('manualCompanion')) el.remove();
      });
    }

    const supportCard = this._screen.querySelector('.companion-action-card[data-action="manualCompanionSupport"]');
    if (!supportCard) return;

    const skill = this._companionClassSkill(npcId);
    const state = GameState.npcs?.states?.[npcId];
    const npcName = I18n.itemName(npcId, state?.name ?? npcId);
    const nameEl = supportCard.querySelector('.ac-name');
    const subEl = supportCard.querySelector('.ac-sub');
    const previewEl = supportCard.querySelector('.ac-preview');

    if (!skill) {
      supportCard.classList.add('disabled');
      supportCard.setAttribute('aria-disabled', 'true');
      if (nameEl) nameEl.textContent = `${npcName} 지원 없음`;
      if (subEl) subEl.textContent = 'NO CLASS SKILL';
      if (previewEl) {
        previewEl.innerHTML = `
          <div class="ac-row warn"><span>스킬</span><strong>설정된 전투 스킬 없음</strong></div>
          <div class="ac-row"><span>대체</span><strong>공격/치료/대기 사용</strong></div>`;
      }
      return;
    }

    const cooldown = state?.skillCooldowns?.[skill.id] ?? 0;
    const ready = cooldown <= 0;
    supportCard.classList.toggle('disabled', !ready);
    supportCard.setAttribute('aria-disabled', ready ? 'false' : 'true');
    supportCard.dataset.skillId = skill.id;
    if (nameEl) nameEl.textContent = `${npcName} ${skill.name}`;
    if (subEl) subEl.textContent = skill.id;
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="ac-row"><span>스킬</span><strong>${skill.name}</strong></div>
        <div class="ac-row ${ready ? 'good' : 'warn'}"><span>상태</span><strong>${ready ? '사용 가능' : `쿨다운 ${cooldown}턴`}</strong></div>
        <div class="ac-row"><span>행동</span><strong>동료 고유 스킬</strong></div>`;
    }
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
        <div class="cpp-companion-row" data-companion-id="${npcId}" style="margin-top:8px;padding:6px;background:rgba(255,255,255,0.04);border-radius:4px;position:relative;">
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
