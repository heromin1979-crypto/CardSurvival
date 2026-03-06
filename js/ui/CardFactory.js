// === CARD FACTORY ===
// 카드 DOM 요소 생성. type='location' 카드는 별도 렌더링.
import GameState from '../core/GameState.js';
import StatSystem from '../systems/StatSystem.js';
import EventBus  from '../core/EventBus.js';

// 위험도 색상
const DANGER_COLORS = ['#449944', '#889933', '#cc8822', '#cc3333', '#881111'];

const CardFactory = {
  build(instanceId) {
    const inst = GameState.cards[instanceId];
    if (!inst) return null;
    const def  = window.__GAME_DATA__.items[inst.definitionId];
    if (!def)  return null;

    const el = document.createElement('div');
    el.dataset.instanceId   = instanceId;
    el.dataset.definitionId = inst.definitionId;
    el.dataset.rarity = def.rarity ?? 'common';
    el.dataset.type   = def.type   ?? 'material';
    el.title = def.description ?? '';

    // ── 장소 카드 ────────────────────────────────────────────
    if (def.type === 'location') {
      if (def.landmark) {
        // 랜드마크 카드 — 클릭 시 LandmarkModal 오픈
        el.className = 'card location-card landmark-card spawning';
        el.draggable = false;
        el.style.cursor = 'pointer';
        el.innerHTML = this._buildLandmarkInner(def);
        el.addEventListener('click', () => {
          // districtId = lm_{id} → id 추출 후 EventBus 경유
          const districtId = def.id?.replace(/^lm_/, '');
          if (districtId) EventBus.emit('openLandmarkModal', { districtId });
        });
        el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
        return el;
      }

      // 현재 위치 카드: 클릭 불가, 강조 테두리
      const isCurrent = GameState.location.currentDistrict === def.nodeId;
      el.className = `card location-card spawning${isCurrent ? ' is-current-loc' : ''}`;
      el.draggable = false;
      el.innerHTML = this._buildLocationInner(def);

      if (!isCurrent) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          EventBus.emit('travelRequest', { nodeId: def.nodeId });
        });
      } else {
        el.style.cursor = 'default';
        el.title = '현재 위치';
      }

      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    // ── 일반 카드 ────────────────────────────────────────────
    el.className = 'card spawning';
    el.draggable = true;
    el.innerHTML = this._buildInner(inst, def);

    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      this._onDoubleClick(instanceId, def);
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      this._onRightClick(instanceId, def, e);
    });

    el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
    return el;
  },

  // ── 장소 카드 내부 HTML ──────────────────────────────────

  _buildLandmarkInner(def) {
    return `
      <div class="lc-header lm-header">
        <span class="lm-badge">랜드마크</span>
      </div>
      <div class="lc-icon">${def.icon ?? '📍'}</div>
      <div class="lc-name">${def.name}</div>
      <div class="lm-bonus">${def.landmarkBonus ?? ''}</div>
    `;
  },

  _buildLocationInner(def) {
    const gs         = GameState;
    const isCurrent  = (gs.location.currentDistrict ?? gs.location.currentNode) === def.nodeId;
    const isVisited  = gs.location.districtsVisited?.includes(def.nodeId) ?? gs.location.nodesVisited?.includes(def.nodeId);
    const danger     = def.dangerLevel ?? 0;
    const color      = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const dangerDots = '●'.repeat(danger) + '○'.repeat(Math.max(0, 3 - danger));

    const currentBadge = isCurrent
      ? `<span class="lc-current-badge">현재 위치</span>` : '';
    const visitedDot = isVisited && !isCurrent
      ? `<span class="lc-visited-dot" title="방문함">✓</span>` : '';
    const encounterText = def.encounterChance > 0
      ? `조우 ${Math.round(def.encounterChance * 100)}%` : '안전';
    const tpText = def.travelCostTP > 0
      ? `${def.travelCostTP}TP` : 'Free';

    return `
      <div class="lc-header" style="border-bottom-color:${color}22;">
        ${currentBadge}${visitedDot}
      </div>
      <div class="lc-icon">${def.icon ?? '📍'}</div>
      <div class="lc-name">${def.name}</div>
      <div class="lc-danger" style="color:${color};" title="위험도 ${danger}/3">
        ${dangerDots}
      </div>
      <div class="lc-meta">
        <span>${tpText}</span>
        <span>${encounterText}</span>
      </div>
    `;
  },

  // ── 일반 카드 내부 HTML ──────────────────────────────────

  _buildInner(inst, def) {
    const durPct   = Math.round(inst.durability ?? 100);
    const durClass = durPct > 50 ? '' : durPct > 25 ? 'low' : 'crit';
    const hasDur   = def.defaultDurability != null && def.type !== 'consumable';
    const qty      = inst.quantity ?? 1;

    // ── 이름 옆 남은 표시 ──────────────────────────────────
    // 소모품: 스택 수량 (×N)
    // 내구도 아이템: 내구도% (< 100일 때만)
    let nameRemainder = '';
    if (def.type === 'consumable' && def.stackable) {
      // 스택 가능 소모품: 항상 수량 표시 (×1 포함)
      nameRemainder = `<span class="card-name-qty">×${qty}</span>`;
    } else if (hasDur && durPct < 100) {
      nameRemainder = `<span class="card-name-dur ${durClass}">${durPct}%</span>`;
    }

    const contam = inst.contamination ?? 0;
    const contamBadge = contam > 0
      ? `<span class="card-contamination" title="오염도 ${contam}%">☣</span>` : '';

    // 스택 배지: 소모품이 아닌 stackable (수량 뱃지가 이름에 없는 경우)
    const stackBadge = (def.stackable && qty > 1 && def.type !== 'consumable')
      ? `<span class="card-stack">×${qty}</span>` : '';

    const weightBadge = def.weight
      ? `<span class="card-weight">${def.weight}kg</span>` : '';

    const durBar = hasDur ? `
      <div class="card-durability">
        <div class="card-durability-fill ${durClass}" style="width:${durPct}%"></div>
      </div>` : '';

    let statsHtml = '';
    if (def.onConsume) {
      const e = def.onConsume;
      const parts = [];
      if (e.hydration > 0) parts.push(`💧+${e.hydration}`);
      if (e.nutrition  > 0) parts.push(`🥗+${e.nutrition}`);
      if (e.hp         > 0) parts.push(`❤️+${e.hp}`);
      if (e.fatigue    < 0) parts.push(`😴${e.fatigue}`);
      if (parts.length) statsHtml = `<div class="card-stats">${parts.map(p => `<span class="card-stat">${p}</span>`).join('')}</div>`;
    }
    if (def.combat) {
      const [dMin, dMax] = def.combat.damage ?? [0, 0];
      statsHtml = `<div class="card-stats"><span class="card-stat">⚔${dMin}-${dMax}</span><span class="card-stat">🔊${def.combat.noiseOnUse}</span></div>`;
    }

    return `
      <div class="card-header">
        <span class="card-icon">${def.icon ?? '📦'}</span>
        <span class="card-name">${def.name}${nameRemainder ? ' ' : ''}${nameRemainder}</span>
        ${contamBadge}
      </div>
      <div class="card-body">
        <span class="card-type-badge">${def.subtype ?? def.type}</span>
        <div class="card-art">${def.icon ?? '📦'}</div>
        ${statsHtml}
        ${durBar}
      </div>
      <div class="card-footer">
        ${weightBadge}
        ${stackBadge}
      </div>
    `;
  },

  _onDoubleClick(instanceId, def) {
    if (def.type === 'consumable' && def.onConsume) {
      const confirmed = confirm(`"${def.name}" 사용할까요?`);
      if (confirmed) {
        StatSystem.consumeCard(instanceId);
        EventBus.emit('boardChanged', {});
      }
    } else {
      EventBus.emit('openCardInspect', { instanceId });
    }
  },

  _onRightClick(instanceId, def, e) {
    EventBus.emit('openCardInspect', { instanceId });
  },

  update(instanceId) {
    const el = document.querySelector(`[data-instance-id="${instanceId}"]`);
    if (!el) return;
    const inst = GameState.cards[instanceId];
    if (!inst) { el.remove(); return; }
    const def = window.__GAME_DATA__.items[inst.definitionId];
    if (!def) return;

    if (def.type === 'location') {
      el.innerHTML = this._buildLocationInner(def);
    } else {
      el.innerHTML = this._buildInner(inst, def);
    }
  },
};

export default CardFactory;
