// === COMPANION SIDE PANEL ===
// 메인 화면 우측 컬럼(#bc-companion). 동행 중인 동료의 요약만 상시 노출한다.
// 대화·해제·상세 수치는 기존 동료 모달(CompanionModal)이 맡고, 카드를 누르면 그쪽을 연다.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import NPCSystem from '../systems/NPCSystem.js';
import StatSystem from '../systems/StatSystem.js';
import GameData  from '../data/GameData.js';
import CompanionModal from './CompanionModal.js';
import Gauge     from './components/Gauge.js';
import { getCardImage } from './CardFactory.js';
import { getNPCPortrait } from './npcPortraits.js';
import { NPC_ITEMS }    from '../data/npcs.js';
import { COMPANION_COMBAT_LOADOUTS, getCombatSkill } from '../data/combatSkills.js';
import { combatAssetManifest } from '../data/combatAssets.js';
import { dataIcon } from './DataIcon.js';

// 목표 이미지의 Equipped 칸 수. npcDef.companion.gear 앞에서부터 채운다.
const GEAR_SLOTS = 3;

// 사기 구간 라벨과 한 줄 효과 — 구간 경계와 효과는 gameBalance.moraleTiers가 정한다.
// 여기서는 그 값이 뜻하는 바만 옮긴다 (accBonus·craftFailMult·blockExplore).
const MORALE_TIERS = {
  high:    { label: '높음', note: '명중·제작 유리' },
  normal:  { label: '보통', note: '보정 없음' },
  low:     { label: '낮음', note: '명중·제작 불리' },
  despair: { label: '절망', note: '탐색 불가' },
};

// NPCSystem._tierLabel과 동일 값 — CompanionModal과 같은 이유로 내부 메서드 대신 로컬 사전
const BOND_TIER_LABELS = {
  kindred:  '혈맹',
  bonded:   '친밀',
  friendly: '우호',
  baseline: '경계',
};

// CompanionModal._statusOf와 같은 판정 — 폭이 좁아 라벨만 쓰고 배지는 생략한다
function statusOf(state) {
  if ((state.infectionLevel ?? 0) >= 1) return { cls: 'infect', label: '감염' };
  if ((state.woundLevel     ?? 0) >= 3) return { cls: 'wound',  label: '부상' };
  if ((state.woundLevel     ?? 0) >= 1) return { cls: 'stable', label: '안정' };
  return { cls: 'ok', label: '양호' };
}

const CompanionPanel = {
  _subscribed: false,

  init() {
    if (!this._subscribed) {
      this._subscribed = true;
      const refresh = () => {
        if (GameState.ui.currentState === 'main') this.render();
      };
      EventBus.on('npcRecruited',   refresh);
      EventBus.on('npcDismissed',   refresh);
      EventBus.on('npcPanelUpdate', refresh);
      EventBus.on('npcHealed',      refresh);

      // 사기는 TP마다 자연 감소한다 — 전체 재렌더는 초상화·장비 이미지를 매 TP 다시 물린다
      const refreshStatus = () => {
        if (GameState.ui.currentState === 'main') this.renderStatus();
      };
      EventBus.on('statChanged', ({ stat }) => { if (stat === 'morale') refreshStatus(); });
      EventBus.on('bondChanged', refreshStatus);
    }
    this.render();
  },

  _companionIds() {
    return (GameState.companions ?? []).filter(id => NPCSystem.getNPCState(id));
  },

  render() {
    // 패널 노드는 Main._buildLayout이 매번 새로 만든다 — 참조를 캐시하지 않는다
    const el = document.getElementById('bc-companion');
    if (!el) return;

    const companions = this._companionIds();
    // 동료 목록만 스크롤한다 — 사기·유대 블록은 컬럼 아래에 고정이라 동료가 늘어도 밀리지 않는다
    el.innerHTML = `
      <div class="bc-comp-list">
        <div class="bc-comp-header">동료</div>
        ${companions.length === 0
          ? this._renderEmpty()
          : companions.map(id => this._renderCard(id)).join('')}
      </div>
      <div class="bc-comp-status" id="bc-comp-status">${this._statusHtml(companions)}</div>
    `;

    el.querySelectorAll('.bc-comp-card').forEach(card => {
      card.addEventListener('click', () => CompanionModal.open(card.dataset.npcId));
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        CompanionModal.open(card.dataset.npcId);
      });
      const portrait = card.querySelector('.bc-comp-portrait img');
      if (portrait) portrait.onerror = () => {
        const fallback = document.createElement('span');
        fallback.className = 'bc-comp-portrait-icon';
        fallback.innerHTML = dataIcon(NPC_ITEMS[card.dataset.npcId]?.icon ?? '👤');
        portrait.replaceWith(fallback);
      };
    });
  },

  /** 사기·유대 블록만 갱신 — 동료 카드는 그대로 둔다 */
  renderStatus() {
    const box = document.getElementById('bc-comp-status');
    if (!box) return;
    box.innerHTML = this._statusHtml(this._companionIds());
  },

  _renderEmpty() {
    return `
      <div class="bc-comp-empty">
        <span class="bc-comp-empty-icon">👥</span>
        동료 없음
        <span class="bc-comp-empty-hint">NPC 의뢰를 끝내면 동행을 제안할 수 있다.</span>
      </div>
    `;
  },

  // 레퍼런스는 사기와 유대를 한 블록에 묶어 놨지만 둘은 범위가 다르다 —
  // 사기는 플레이어 한 명의 전역 수치, 유대는 동료마다 따로 쌓인다.
  // 그래서 사기는 게이지 하나, 유대는 동료 수만큼 이름표를 단 게이지로 나눈다.
  _statusHtml(companions) {
    return `
      <div class="bc-comp-status-header">동료 상태</div>
      <div class="bc-comp-status-caption">사기는 나 전체 · 유대는 동료마다</div>
      ${this._moraleHtml()}
      ${this._bondHtml(companions)}
    `;
  },

  _moraleHtml() {
    const stat = GameState.stats?.morale ?? { current: 0, max: 100 };
    const cur  = Math.round(stat.current ?? 0);
    const max  = stat.max ?? 100;
    const tier = MORALE_TIERS[StatSystem.getMoraleTier().id] ?? MORALE_TIERS.normal;

    return `
      <div class="bc-comp-stat">
        <div class="bc-comp-stat-head">
          <span class="bc-comp-stat-name">사기 <span class="bc-comp-stat-en">(MORALE)</span></span>
          <span class="bc-comp-stat-value">${cur}/${max}</span>
        </div>
        ${Gauge.html({ value: cur, max, color: 'morale' })}
        <div class="bc-comp-stat-note">
          <span class="bc-comp-scope">나</span>${tier.label} — ${tier.note}
        </div>
      </div>
    `;
  },

  _bondHtml(companions) {
    const rows = companions.map(npcId => {
      const itemDef = NPC_ITEMS[npcId];
      const state   = NPCSystem.getNPCState(npcId);
      if (!itemDef || !state) return '';

      const name  = I18n.itemName(npcId, itemDef.name);
      const bond  = Math.max(0, Math.min(100, state.bond ?? 0));
      const tier  = BOND_TIER_LABELS[NPCSystem.getBondTier(npcId)] ?? '';

      return `
        <div class="bc-comp-bond">
          <div class="bc-comp-stat-head">
            <span class="bc-comp-scope" title="${name}">${name}</span>
            <span class="bc-comp-stat-value">${bond} · ${tier}</span>
          </div>
          ${Gauge.html({ value: bond, max: 100, color: 'morale', size: 'sm' })}
        </div>
      `;
    }).join('');

    return `
      <div class="bc-comp-stat">
        <div class="bc-comp-stat-head">
          <span class="bc-comp-stat-name">유대 <span class="bc-comp-stat-en">(BOND)</span></span>
        </div>
        ${rows || '<div class="bc-comp-bond empty">동행 중인 동료 없음</div>'}
        <div class="bc-comp-stat-note">동행·전투로 오른다</div>
      </div>
    `;
  },

  _renderCard(npcId) {
    const itemDef = NPC_ITEMS[npcId];
    const npcDef  = NPCSystem.getNPCDef(npcId);
    const state   = NPCSystem.getNPCState(npcId);
    if (!itemDef || !npcDef || !state) return '';

    const name   = I18n.itemName(npcId, itemDef.name);
    const maxHp  = npcDef.maxHp ?? 50;
    const curHp  = Math.max(0, state.hp ?? maxHp);
    const hpPct  = Math.min(100, Math.round((curHp / maxHp) * 100));
    const hpCls  = hpPct > 60 ? 'good' : hpPct > 30 ? 'warn' : 'crit';
    const status = statusOf(state);
    const imgSrc = getNPCPortrait(npcId);

    return `
      <div class="bc-comp-card" role="button" tabindex="0" aria-label="${name} — 동료창 열기" data-npc-id="${npcId}" title="${name} — 동료창 열기">
        <div class="bc-comp-portrait">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="">`
            : `<span class="bc-comp-portrait-icon">${dataIcon(itemDef.icon ?? '👤')}</span>`}
        </div>
        <div class="bc-comp-name">${name}</div>
        <div class="bc-comp-meta">
          <span class="bc-comp-hp ${hpCls}">HP ${hpPct}%</span>
        </div>
        <div class="bc-comp-meta">
          상태: <span class="bc-comp-status-value ${status.cls}">${status.label}</span>
        </div>
        <div class="bc-comp-section">Equipped</div>
        <div class="bc-comp-slots">${this._renderGear(npcDef)}</div>
        <div class="bc-comp-section">Active Skill</div>
        ${this._renderSkill(npcId)}
      </div>
    `;
  },

  _renderGear(npcDef) {
    const gear = (npcDef.companion?.gear ?? []).slice(0, GEAR_SLOTS);

    const filled = gear.map(entry => {
      const itemDef = GameData.items?.[entry.id];
      if (!itemDef) return '';
      const name   = I18n.itemName(entry.id, itemDef.name);
      const qty    = entry.qty ?? 1;
      const imgSrc = getCardImage(entry.id);
      return `
        <div class="bc-comp-slot" title="${name}">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="">`
            : `<span class="bc-comp-slot-icon">${dataIcon(itemDef.icon ?? '📦')}</span>`}
          ${qty > 1 ? `<span class="bc-comp-slot-qty">${qty}</span>` : ''}
        </div>`;
    }).join('');

    const emptyCount = Math.max(0, GEAR_SLOTS - gear.length);
    const empty = `<div class="bc-comp-slot empty"><span class="bc-comp-slot-empty-mark">—</span></div>`;
    return filled + empty.repeat(emptyCount);
  },

  _renderSkill(npcId) {
    const skillId = (COMPANION_COMBAT_LOADOUTS[npcId] ?? [])[0];
    const skill   = skillId ? getCombatSkill(skillId) : null;
    if (!skill) {
      return `<div class="bc-comp-skill empty"><span class="bc-comp-skill-name">전투 스킬 없음</span></div>`;
    }

    const label   = I18n.t(skill.nameKey);
    const iconSrc = combatAssetManifest.skillIcon(skill.icon);
    return `
      <div class="bc-comp-skill" title="${label}">
        <span class="bc-comp-skill-icon">${iconSrc ? `<img src="${iconSrc}" alt="">` : '⚔️'}</span>
        <span class="bc-comp-skill-name">${label}</span>
      </div>
    `;
  },
};

export default CompanionPanel;
