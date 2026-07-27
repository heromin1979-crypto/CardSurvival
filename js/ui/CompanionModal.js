// === COMPANION MODAL ===
// 좌측 사이드바 '동료' 버튼으로 여는 중앙 모달 (SkillModal 패턴).
// 좌측 동료 리스트 + 그룹 상태, 우측 상세 뷰. NPCSystem은 읽기 + 이벤트 구독만.

import EventBus       from '../core/EventBus.js';
import GameState      from '../core/GameState.js';
import SystemRegistry from '../core/SystemRegistry.js';
import I18n           from '../core/I18n.js';
import NPCSystem      from '../systems/NPCSystem.js';
import GameData       from '../data/GameData.js';
import { getCardImage } from './CardFactory.js';
import { NPC_ITEMS }  from '../data/npcs.js';
import { COMPANION_COMBAT_LOADOUTS, getCombatSkill } from '../data/combatSkills.js';
import { combatAssetManifest } from '../data/combatAssets.js';
import { SKILL_DEFS } from '../data/skillDefs.js';

const PERSONALITY_LABELS = {
  cautious:     '신중',
  brave:        '용감',
  stoic:        '과묵',
  timid:        '소심',
  neutral:      '무던',
  loyal:        '충직',
  guilt:        '죄책감',
  disciplined:  '절도',
  analytical:   '분석적',
  caring:       '다정',
  inventive:    '창의적',
  confident:    '자신감',
  enthusiastic: '열정적',
};

// NPCSystem._tierLabel과 동일 값 — 내부 메서드 의존 대신 로컬 사전 유지
const BOND_TIER_LABELS = {
  kindred:  '혈맹',
  bonded:   '친밀',
  friendly: '우호',
  baseline: '경계',
};

const EMOTION_ICONS = {
  calm:    { icon: '😌', label: '안정' },
  hopeful: { icon: '🌟', label: '희망' },
  anxious: { icon: '😰', label: '불안' },
  trauma:  { icon: '💔', label: '외상' },
};

// npcs.js skillBonus 키 중 SKILL_DEFS에 없는 것만 별도 라벨
const EXTRA_BONUS_LABELS = {
  combat:  '전투',
  medical: '의료',
};

function skillBonusLabel(key) {
  return SKILL_DEFS[key]?.name ?? EXTRA_BONUS_LABELS[key] ?? key;
}

const CompanionModal = {
  _el:            null,
  _box:           null,
  _selectedNpcId: null,
  _subscribed:    false,

  init() {
    this._el  = document.getElementById('companion-modal');
    this._box = this._el?.querySelector('.companion-modal-box');
    if (!this._el) return;

    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this.close();
    });

    if (this._subscribed) return;
    this._subscribed = true;

    const rerenderIfSelected = ({ npcId }) => {
      if (this._isOpen() && npcId === this._selectedNpcId) this.render();
    };
    EventBus.on('npcPanelUpdate',  rerenderIfSelected);
    EventBus.on('npcTrustChanged', rerenderIfSelected);
    EventBus.on('bondChanged',     rerenderIfSelected);
    EventBus.on('npcEmotionSet',   rerenderIfSelected);

    const refreshRoster = () => {
      if (this._isOpen()) this.render();
    };
    EventBus.on('npcRecruited', refreshRoster);
    EventBus.on('npcDismissed', refreshRoster);
  },

  _isOpen() {
    return this._el?.classList.contains('open') ?? false;
  },

  open(npcId = null) {
    if (!this._el) return;
    const companions = this._companionIds();
    this._selectedNpcId = npcId && companions.includes(npcId)
      ? npcId
      : companions[0] ?? null;
    this._el.classList.add('open');
    this.render();
  },

  close() {
    this._el?.classList.remove('open');
  },

  _companionIds() {
    return (GameState.companions ?? []).filter(id => NPCSystem.getNPCState(id));
  },

  // ── Render ──────────────────────────────────────────────────────

  render() {
    if (!this._box) return;
    const companions = this._companionIds();

    if (!companions.includes(this._selectedNpcId)) {
      this._selectedNpcId = companions[0] ?? null;
    }

    this._box.innerHTML = `
      <header class="npcd-header">
        <div class="npcd-title">
          <span class="npcd-marker"></span>
          <span>동료창</span>
          <span class="npcd-title-sub">· COMPANION</span>
        </div>
        <button class="npcd-close" aria-label="닫기">✕</button>
      </header>
      ${companions.length === 0
        ? this._renderEmpty()
        : `<div class="npcd-columns">
             <aside class="npcd-roster">
               ${companions.map(id => this._renderRosterItem(id)).join('')}
             </aside>
             <div class="npcd-detail">
               ${this._renderDetail(this._selectedNpcId)}
             </div>
           </div>`}
    `;

    this._bindEvents();
  },

  _renderEmpty() {
    return `
      <div class="npcd-empty">
        <div class="npcd-empty-icon">👥</div>
        <p>아직 동료가 없습니다.</p>
        <p class="npcd-empty-hint">NPC의 퀘스트를 완료해 신뢰도를 올리면 동행을 제안할 수 있습니다.</p>
      </div>
    `;
  },

  // ── 좌측: 동료 리스트 + 그룹 상태 ────────────────────────────────

  _renderRosterItem(npcId) {
    const itemDef = NPC_ITEMS[npcId];
    const npcDef  = NPCSystem.getNPCDef(npcId);
    const state   = NPCSystem.getNPCState(npcId);
    if (!itemDef || !state) return '';

    const name  = I18n.itemName(npcId, itemDef.name);
    const maxHp = npcDef?.maxHp ?? 50;
    const curHp = Math.max(0, state.hp ?? maxHp);
    const hpPct = Math.min(100, Math.round((curHp / maxHp) * 100));
    const hpCls = hpPct > 60 ? 'good' : hpPct > 30 ? 'warn' : 'crit';

    // 파견 중 D-day 배지 — DispatchSystem 배정 상태 기준
    let dispatchBadge = '';
    const assignment = SystemRegistry.get('DispatchSystem')?.getAssignment?.(npcId);
    if (assignment?.status === 'deployed' && assignment.returnDay != null) {
      const dDay = Math.max(0, assignment.returnDay - (GameState.time?.day ?? 0));
      dispatchBadge = `<span class="npcd-roster-dispatch">🎒 ${dDay === 0 ? '오늘 귀환' : `D-${dDay}`}</span>`;
    }

    const selected = npcId === this._selectedNpcId ? ' selected' : '';
    return `
      <button class="npcd-roster-item${selected}" data-npc-id="${npcId}">
        <span class="npcd-roster-icon">${itemDef.icon ?? '👤'}</span>
        <span class="npcd-roster-info">
          <span class="npcd-roster-name">${name}</span>
          <span class="npcd-roster-hp"><span class="npcd-roster-hp-fill ${hpCls}" style="width:${hpPct}%"></span></span>
        </span>
        ${dispatchBadge}
      </button>
    `;
  },

  // ── 우측: 상세 ──────────────────────────────────────────────────

  _renderDetail(npcId) {
    const itemDef = NPC_ITEMS[npcId];
    const npcDef  = NPCSystem.getNPCDef(npcId);
    const state   = NPCSystem.getNPCState(npcId);
    if (!itemDef || !npcDef || !state) return '';

    return `
      <div class="npcd-body">
        ${this._renderIdentity(npcId, itemDef, npcDef, state)}
        ${this._renderStatus(npcId, npcDef, state)}
        ${this._renderCombat(npcId, npcDef)}
        ${this._renderInventory(npcDef)}
      </div>
      <footer class="npcd-actions">
        <button class="npcd-btn confirm" id="npcd-talk-btn">대화</button>
        <button class="npcd-btn danger" id="npcd-dismiss-btn">동행 해제</button>
      </footer>
    `;
  },

  _renderIdentity(npcId, itemDef, npcDef, state) {
    const name        = I18n.itemName(npcId, itemDef.name);
    const personality = PERSONALITY_LABELS[npcDef.personality] ?? npcDef.personality ?? '';
    const emotion     = EMOTION_ICONS[state.emotion ?? 'calm'] ?? EMOTION_ICONS.calm;
    const status      = this._statusOf(state);

    return `
      <div class="npcd-identity-row">
        <div class="npcd-portrait">
          <span class="npcd-corner tl"></span>
          <span class="npcd-corner tr"></span>
          <span class="npcd-corner bl"></span>
          <span class="npcd-corner br"></span>
          <span class="npcd-portrait-scan"></span>
          <span class="npcd-portrait-icon">${itemDef.icon ?? '👤'}</span>
        </div>
        <div class="npcd-identity">
          <div class="npcd-name">${name}</div>
          <div class="npcd-meta-row">
            <span class="npcd-chip companion">동행 중</span>
            <span class="npcd-chip status-${status.cls}">${status.label}</span>
            <span class="npcd-chip">${emotion.icon} ${emotion.label}</span>
          </div>
          ${personality ? `<div class="npcd-tags"><span class="npcd-tag">#${personality}</span></div>` : ''}
        </div>
      </div>
    `;
  },

  _statusOf(state) {
    const woundLevel     = state.woundLevel     ?? 0;
    const infectionLevel = state.infectionLevel ?? 0;
    if (infectionLevel >= 1) return { cls: 'infect', label: '감염' };
    if (woundLevel >= 3)     return { cls: 'wound',  label: '부상' };
    if (woundLevel >= 1)     return { cls: 'stable', label: '안정' };
    return { cls: 'ok', label: '양호' };
  },

  _renderStatus(npcId, npcDef, state) {
    const maxHp = npcDef.maxHp ?? 50;
    const curHp = Math.max(0, state.hp ?? maxHp);
    const hpPct = Math.min(100, Math.round((curHp / maxHp) * 100));
    const hpCls = hpPct > 60 ? 'good' : hpPct > 30 ? 'warn' : 'crit';

    const trust = state.trust ?? 0;
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="npcd-star ${i < trust ? '' : 'empty'}">${i < trust ? '★' : '☆'}</span>`
    ).join('');

    const bond      = Math.max(0, Math.min(100, state.bond ?? 0));
    const tier      = NPCSystem.getBondTier(npcId);
    const tierLabel = BOND_TIER_LABELS[tier] ?? tier;

    const morale = Math.max(0, Math.min(100, state.morale ?? 70));

    const comp = npcDef.companion ?? {};
    const food  = comp.foodCostPerDay ?? 0;
    const noise = comp.noiseAdd ?? 0;

    return `
      <div class="npcd-section">
        <div class="npcd-section-header">상태 STATUS</div>
        <div class="npcd-stat-grid">
          <div class="npcd-stat">
            <div class="npcd-stat-head">
              <span class="npcd-stat-name">체력 HP</span>
              <span class="npcd-stat-value">${curHp} / ${maxHp}</span>
            </div>
            <div class="npcd-bar"><div class="npcd-bar-fill hp ${hpCls}" style="width:${hpPct}%"></div></div>
          </div>
          <div class="npcd-stat">
            <div class="npcd-stat-head">
              <span class="npcd-stat-name">신뢰도</span>
              <span class="npcd-stat-value npcd-stars">${stars}</span>
            </div>
          </div>
          <div class="npcd-stat">
            <div class="npcd-stat-head">
              <span class="npcd-stat-name">유대감 Bond</span>
              <span class="npcd-stat-value">${bond} <span class="npcd-tier">· ${tierLabel}</span></span>
            </div>
            <div class="npcd-bar"><div class="npcd-bar-fill bond" style="width:${bond}%"></div></div>
          </div>
          <div class="npcd-stat">
            <div class="npcd-stat-head">
              <span class="npcd-stat-name">사기 Morale</span>
              <span class="npcd-stat-value">${morale} / 100</span>
            </div>
            <div class="npcd-bar"><div class="npcd-bar-fill morale" style="width:${morale}%"></div></div>
          </div>
        </div>
        <div class="npcd-upkeep">
          <span class="npcd-upkeep-label">💰 유지 비용</span>
          <span>식량 ${food}/일</span>
          <span class="npcd-divider">·</span>
          <span>소음 +${noise}</span>
        </div>
      </div>
    `;
  },

  _renderCombat(npcId, npcDef) {
    const comp = npcDef.companion ?? {};

    const statParts = [];
    const dmg = comp.combatDmg ?? 0;
    if (dmg > 0) {
      statParts.push(dmg >= 1
        ? `<strong>공격 +${Math.round((dmg - 1) * 100)}%</strong>`
        : `<strong>공격 ×${dmg}</strong>`);
    }
    if ((comp.combatDmgReduce ?? 0) > 0) statParts.push(`피해 -${Math.round(comp.combatDmgReduce * 100)}%`);
    if ((comp.tauntChance ?? 0) > 0)     statParts.push(`도발 ${Math.round(comp.tauntChance * 100)}%`);
    const statLine = statParts.length
      ? `<div class="npcd-combat-line">${statParts.join('<span class="npcd-divider">·</span>')}</div>`
      : '';

    const skillIds = COMPANION_COMBAT_LOADOUTS[npcId] ?? [];
    const skillSlots = skillIds.map(id => {
      const skill = getCombatSkill(id);
      if (!skill) return '';
      const label   = I18n.t(skill.nameKey);
      const iconSrc = combatAssetManifest.skillIcon(skill.icon);
      const tooltip = this._skillTooltip(label, skill);
      return `
        <div class="npcd-skill-slot" title="${tooltip}">
          <div class="npcd-skill-icon">${iconSrc ? `<img src="${iconSrc}" alt="">` : '⚔️'}</div>
          <div class="npcd-skill-name">${label}</div>
        </div>`;
    }).join('');
    const skillsBlock = skillSlots
      ? `<div class="npcd-subheader">전투 스킬</div>
         <div class="npcd-skill-slots">${skillSlots}</div>`
      : '';

    const passiveParts = [];
    for (const [key, value] of Object.entries(comp.skillBonus ?? {})) {
      if (!value) continue;
      passiveParts.push(`${skillBonusLabel(key)} ${this._bonusText(value)}`);
    }
    const extras = [
      ['운반', comp.carryBonus],
      ['치료', comp.healBonus],
      ['제작', comp.craftBonus],
      ['사기', comp.moralBonus],
    ];
    for (const [label, value] of extras) {
      if ((value ?? 0) > 0) passiveParts.push(`${label} ${this._bonusText(value)}`);
    }
    const passiveLine = passiveParts.length
      ? `<div class="npcd-passive-line"><span class="npcd-passive-label">패시브</span>${
          passiveParts.join('<span class="npcd-divider">·</span>')}</div>`
      : '';

    if (!statLine && !skillsBlock && !passiveLine) return '';
    return `
      <div class="npcd-section">
        <div class="npcd-section-header">전투 COMBAT</div>
        ${statLine}
        ${skillsBlock}
        ${passiveLine}
      </div>
    `;
  },

  _bonusText(value) {
    return Math.abs(value) >= 1 ? `+${value}` : `+${Math.round(value * 100)}%`;
  },

  _skillTooltip(label, skill) {
    const parts = [label];
    for (const eff of skill.effects ?? []) {
      if (eff.type === 'damage' && Array.isArray(eff.value)) parts.push(`피해 ${eff.value[0]}~${eff.value[1]}`);
      if (eff.type === 'heal'   && Array.isArray(eff.value)) parts.push(`회복 ${eff.value[0]}~${eff.value[1]}`);
    }
    if ((skill.accuracy ?? 1) < 1) parts.push(`명중 ${Math.round(skill.accuracy * 100)}%`);
    return parts.join(' — ');
  },

  // ── Inventory — companion.gear (설정 정합용 장비, 최대 4) ────────

  _renderInventory(npcDef) {
    const gear = (npcDef.companion?.gear ?? []).slice(0, 4);
    const emptySlot = '<div class="npcd-inv-slot empty"><span class="npcd-inv-placeholder">—</span></div>';

    const filled = gear.map(entry => {
      const itemDef = GameData.items?.[entry.id];
      if (!itemDef) return '';
      const name    = I18n.itemName(entry.id, itemDef.name);
      const qty     = entry.qty ?? 1;
      const imgSrc  = getCardImage(entry.id);
      const visual  = imgSrc
        ? `<img class="npcd-inv-img" src="${imgSrc}" alt="">`
        : `<span class="npcd-inv-icon">${itemDef.icon ?? '📦'}</span>`;
      return `
        <div class="npcd-inv-slot filled" title="${this._gearTooltip(name, itemDef)}">
          ${qty > 1 ? `<span class="npcd-inv-qty">×${qty}</span>` : ''}
          ${visual}
          <span class="npcd-inv-name">${name}</span>
        </div>`;
    }).join('');

    return `
      <div class="npcd-section">
        <div class="npcd-section-header">소지 아이템 INVENTORY<span class="npcd-section-count">${gear.length} / 4</span></div>
        <div class="npcd-inv-slots">${filled}${emptySlot.repeat(Math.max(0, 4 - gear.length))}</div>
      </div>
    `;
  },

  _gearTooltip(name, itemDef) {
    const parts = [name];
    const dmg = itemDef.combat?.damage;
    if (Array.isArray(dmg)) parts.push(`피해 ${dmg[0]}~${dmg[1]}`);
    const reduce = itemDef.armor?.damageReduction ?? itemDef.onWear?.damageReduction;
    if (reduce) parts.push(`피해 감소 ${Math.round(reduce * 100)}%`);
    if (parts.length === 1 && itemDef.description) parts.push(itemDef.description);
    return parts.join(' — ');
  },

  // ── Events ──────────────────────────────────────────────────────

  _bindEvents() {
    this._box.querySelector('.npcd-close')
      ?.addEventListener('click', () => this.close());

    this._box.querySelectorAll('.npcd-roster-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selectedNpcId = btn.dataset.npcId;
        this.render();
      });
    });

    const npcId = this._selectedNpcId;
    if (!npcId) return;

    this._box.querySelector('#npcd-talk-btn')
      ?.addEventListener('click', () => {
        this.close();
        EventBus.emit('openNPCDialogue', { npcId });
      });
    this._box.querySelector('#npcd-dismiss-btn')
      ?.addEventListener('click', () => NPCSystem.dismiss(npcId));
  },
};

export default CompanionModal;
