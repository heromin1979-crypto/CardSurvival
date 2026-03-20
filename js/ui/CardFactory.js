// === CARD FACTORY ===
// 카드 DOM 요소 생성. type='location' 카드는 별도 렌더링.
import GameState from '../core/GameState.js';
import StatSystem from '../systems/StatSystem.js';
import EventBus  from '../core/EventBus.js';
import I18n      from '../core/I18n.js';

// 위험도 색상
const DANGER_COLORS = ['#449944', '#889933', '#cc8822', '#cc3333', '#881111'];

const CardFactory = {
  build(instanceId) {
    const inst = GameState.cards[instanceId];
    if (!inst) return null;

    // ── 제작 진행 카드 ─────────────────────────────────────
    if (inst._crafting) {
      const def = window.__GAME_DATA__.items[inst.definitionId];
      const el = document.createElement('div');
      el.dataset.instanceId   = instanceId;
      el.dataset.definitionId = inst.definitionId;
      el.className = 'card crafting-card spawning';
      el.draggable = false;
      el.innerHTML = this._buildCraftingInner(inst, def ?? {});
      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    const def  = window.__GAME_DATA__.items[inst.definitionId];
    if (!def)  return null;

    const el = document.createElement('div');
    el.dataset.instanceId   = instanceId;
    el.dataset.definitionId = inst.definitionId;
    el.dataset.rarity = def.rarity ?? 'common';
    el.dataset.type   = def.type   ?? 'material';

    // ── 장소 카드 ────────────────────────────────────────────
    if (def.type === 'location') {
      // ── 세부 장소 카드 (랜드마크 내부 탐색 슬롯) ─────────
      if (def.sublocation) {
        el.className = 'card location-card sublocation-card spawning';
        el.draggable = false;
        el.style.cursor = 'pointer';
        el.innerHTML = this._buildSubLocationInner(def);
        el.addEventListener('click', () => {
          EventBus.emit('sublocationRequest', { districtId: def.districtId, subLocationId: def.subLocationId });
        });
        el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
        return el;
      }

      if (def.landmark) {
        const districtId = def.id?.replace(/^lm_/, '');
        const isCurrent  = GameState.location.currentDistrict === districtId;

        el.className = `card location-card landmark-card spawning${isCurrent ? ' is-current-loc' : ''}`;
        el.draggable = false;
        el.style.cursor = 'pointer';
        el.innerHTML = this._buildLandmarkInner(def, isCurrent);

        if (isCurrent) {
          // 현재 구 랜드마크 → 랜드마크 진입
          el.addEventListener('click', () => {
            if (districtId) EventBus.emit('landmarkRequest', { districtId });
          });
        } else {
          // 다른 구 랜드마크 → 해당 구로 이동 (travel card)
          el.addEventListener('click', () => {
            if (districtId) EventBus.emit('travelRequest', { nodeId: districtId });
          });
        }

        el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
        return el;
      }

      // 현재 위치 카드: 랜드마크 내부라면 귀환 버튼, 그 외 클릭 불가
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
        // 랜드마크 내부에서 현재 구 카드 클릭 → 귀환
        if (GameState.location.currentLandmark) {
          el.style.cursor = 'pointer';
          el.classList.add('landmark-return');
          el.addEventListener('click', () => {
            EventBus.emit('exitLandmarkRequest', {});
          });
        } else {
          el.style.cursor = 'default';
          // title 제거 — 브라우저 네이티브 툴팁이 hover 시 시각적 노이즈 유발
        }
      }

      el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
      return el;
    }

    // ── 일반 카드 ────────────────────────────────────────────
    el.title = def.description ?? '';  // 일반 카드만 설명 툴팁
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

  _buildLandmarkInner(def, isCurrent = false) {
    if (isCurrent) {
      // 현재 위치 → 탐색 UI (랜드마크 보너스 표시)
      return `
        <div class="lc-header lm-header">
          <span class="lm-badge">${I18n.t('card.landmark')}</span>
        </div>
        <div class="lc-icon">${def.icon ?? '📍'}</div>
        <div class="lc-name">${I18n.itemName(def.id, def.name)}</div>
        <div class="lm-bonus">${def.landmarkBonus ?? ''}</div>
      `;
    }

    // 다른 구 → 이동 UI (위험도·TP 표시)
    const districtId = def.id?.replace(/^lm_/, '');
    const district   = window.__GAME_DATA__?.districts?.[districtId];
    const danger     = district?.dangerLevel ?? 0;
    const color      = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const dangerDots = '●'.repeat(danger) + '○'.repeat(Math.max(0, 3 - danger));
    const costTP     = district?.travelCostTP ?? 2;
    const encPct     = district ? Math.round((district.encounterChance ?? 0) * 100) : 0;

    return `
      <div class="lc-header lm-header">
        <span class="lm-badge">${I18n.t('card.landmark')}</span>
      </div>
      <div class="lc-icon">${def.icon ?? '📍'}</div>
      <div class="lc-name">${I18n.itemName(def.id, def.name)}</div>
      <div class="lc-danger" style="color:${color};">${dangerDots}</div>
      <div class="lc-meta">
        <span>${costTP}TP</span>
        <span>${encPct > 0 ? I18n.t('card.encounter', { pct: encPct }) : I18n.t('card.safe')}</span>
      </div>
    `;
  },

  _buildLocationInner(def) {
    const gs         = GameState;
    const isCurrent  = (gs.location.currentDistrict ?? gs.location.currentNode) === def.nodeId;
    const isVisited  = gs.location.districtsVisited?.includes(def.nodeId) ?? gs.location.nodesVisited?.includes(def.nodeId);
    const danger     = def.dangerLevel ?? 0;
    const color      = DANGER_COLORS[Math.min(danger, DANGER_COLORS.length - 1)];
    const dangerDots = '●'.repeat(danger) + '○'.repeat(Math.max(0, 3 - danger));

    const isInLandmark = !!GameState.location.currentLandmark;
    const currentBadge = isCurrent
      ? `<span class="lc-current-badge">${isInLandmark ? I18n.t('card.goBack') : I18n.t('card.currentLoc')}</span>` : '';
    const visitedDot = isVisited && !isCurrent
      ? `<span class="lc-visited-dot">✓</span>` : '';
    const encounterText = def.encounterChance > 0
      ? I18n.t('card.encounter', { pct: Math.round(def.encounterChance * 100) }) : I18n.t('card.safe');
    const tpText = def.travelCostTP > 0
      ? `${def.travelCostTP}TP` : 'Free';

    return `
      <div class="lc-header" style="border-bottom-color:${color}22;">
        ${currentBadge}${visitedDot}
      </div>
      <div class="lc-icon">${def.icon ?? '📍'}</div>
      <div class="lc-name">${I18n.districtName(def.nodeId, def.name)}</div>
      <div class="lc-danger" style="color:${color};">
        ${dangerDots}
      </div>
      <div class="lc-meta">
        <span>${tpText}</span>
        <span>${encounterText}</span>
      </div>
    `;
  },

  // ── 세부 장소 카드 내부 HTML ─────────────────────────────

  _buildSubLocationInner(def) {
    const dangerPct   = Math.round((def.dangerMod ?? 0) * 100);
    const dangerColor = dangerPct <= 10 ? '#449944' : dangerPct <= 20 ? '#cc8822' : '#cc3333';
    return `
      <div class="lc-header">
        <span class="lm-badge">${I18n.t('card.interior')}</span>
      </div>
      <div class="lc-icon">${def.icon}</div>
      <div class="lc-name">${I18n.itemName(def.id ?? def.subLocationId, def.name)}</div>
      <div class="lc-danger" style="color:${dangerColor}; font-size:9px; margin-top:2px;">
        ${dangerPct > 0 ? I18n.t('card.dangerHigh', { pct: dangerPct }) : I18n.t('card.dangerLow')}
      </div>
      <div class="lc-meta">
        <span>${I18n.t('card.explore')}</span>
        <span>1TP</span>
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
      ? `<span class="card-contamination" title="${I18n.t('card.contamination', { pct: contam })}">☣</span>` : '';

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
        <span class="card-name">${I18n.itemName(def.id ?? inst.definitionId, def.name)}${nameRemainder ? ' ' : ''}${nameRemainder}</span>
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

  // ── 제작 진행 카드 내부 HTML ─────────────────────────────
  _buildCraftingInner(inst, def) {
    const ce = inst._craftEntry;
    if (!ce) return '';

    const consumed   = ce.completedTp + (ce.tpTotal - ce.tpRemaining);
    const overallPct = ce.totalTpAll > 0 ? (consumed / ce.totalTpAll * 100) : 0;

    const stageInfo = ce.totalStages > 1
      ? `${ce.stageIndex + 1}/${ce.totalStages} — ${ce.stageLabel}`
      : ce.stageLabel;

    return `
      <div class="card-header">
        <span class="card-icon">⚒️</span>
        <span class="card-name">${I18n.blueprintName(ce.blueprintId, ce.blueprintName)}</span>
      </div>
      <div class="card-body">
        <span class="card-type-badge">${I18n.t('card.crafting')}</span>
        <div class="card-art">${def?.icon ?? '📦'}</div>
        <div class="crafting-stage-label">${stageInfo}</div>
        <div class="craft-progress-track">
          <div class="craft-progress-fill" style="width:${overallPct.toFixed(1)}%"></div>
        </div>
      </div>
      <div class="card-footer">
        <span class="crafting-tp-label">${I18n.t('card.tpRemaining', { tp: ce.tpRemaining })}</span>
      </div>
    `;
  },

  _onDoubleClick(instanceId, def) {
    if (def.type === 'consumable' && def.onConsume) {
      const confirmed = confirm(I18n.t('card.useConfirm', { name: I18n.itemName(def.id ?? GameState.cards[instanceId]?.definitionId, def.name) }));
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

    if (inst._crafting) {
      const def = window.__GAME_DATA__.items[inst.definitionId];
      el.innerHTML = this._buildCraftingInner(inst, def ?? {});
      return;
    }

    const def = window.__GAME_DATA__.items[inst.definitionId];
    if (!def) return;

    if (def.type === 'location') {
      if (def.landmark) {
        const districtId = def.id?.replace(/^lm_/, '');
        const isCurrent  = GameState.location.currentDistrict === districtId;
        el.innerHTML = this._buildLandmarkInner(def, isCurrent);
        if (isCurrent) el.classList.add('is-current-loc');
        else            el.classList.remove('is-current-loc');
      } else {
        el.innerHTML = this._buildLocationInner(def);
      }
    } else {
      el.innerHTML = this._buildInner(inst, def);
    }
  },
};

export default CardFactory;
