// === COMPANION SIDE PANEL ===
// 메인 화면 우측 컬럼(#bc-companion). 동행 중인 동료의 요약만 상시 노출한다.
// 대화·해제·상세 수치는 기존 동료 모달(CompanionModal)이 맡고, 카드를 누르면 그쪽을 연다.

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import NPCSystem from '../systems/NPCSystem.js';
import GameData  from '../data/GameData.js';
import CompanionModal from './CompanionModal.js';
import { getCardImage } from './CardFactory.js';
import { NPC_ITEMS }    from '../data/npcs.js';
import { COMPANION_COMBAT_LOADOUTS, getCombatSkill } from '../data/combatSkills.js';
import { combatAssetManifest } from '../data/combatAssets.js';
import { dataIcon } from './DataIcon.js';

// 목표 이미지의 Equipped 칸 수. npcDef.companion.gear 앞에서부터 채운다.
const GEAR_SLOTS = 3;

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
    el.innerHTML = `
      <div class="bc-comp-header">동료</div>
      ${companions.length === 0
        ? this._renderEmpty()
        : companions.map(id => this._renderCard(id)).join('')}
    `;

    el.querySelectorAll('.bc-comp-card').forEach(card => {
      card.addEventListener('click', () => CompanionModal.open(card.dataset.npcId));
    });
  },

  _renderEmpty() {
    return `
      <div class="bc-comp-empty">
        <span class="bc-comp-empty-icon">👥</span>
        동행 중인 동료 없음
        <span class="bc-comp-empty-hint">NPC 의뢰를 끝내 신뢰를 쌓으면 동행을 제안할 수 있다.</span>
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
    const imgSrc = getCardImage(npcId);

    return `
      <div class="bc-comp-card" data-npc-id="${npcId}" title="${name} — 동료창 열기">
        <div class="bc-comp-portrait">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="">`
            : `<span class="bc-comp-portrait-icon">${dataIcon(itemDef.icon ?? '👤')}</span>`}
        </div>
        <div class="bc-comp-name">${name}</div>
        <div class="bc-comp-meta">
          <span class="bc-comp-hp ${hpCls}">HP ${hpPct}%</span>
          <span class="bc-comp-status">상태: <span class="bc-comp-status-value ${status.cls}">${status.label}</span></span>
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
