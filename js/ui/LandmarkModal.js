// === LANDMARK MODAL ===
// 랜드마크 클릭 시 세부 장소 탐색 UI
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import TickEngine    from '../core/TickEngine.js';
import StateMachine  from '../core/StateMachine.js';
import { rollEnemyGroup } from '../data/enemies.js';
import LANDMARK_DATA, { rollLoot } from '../data/landmarks.js';

const LandmarkModal = {
  _initialized:  false,
  _overlay:      null,
  _districtId:   null,   // 현재 표시 중인 구 ID
  _isExploring:  false,  // 더블클릭 방어 플래그

  init() {
    this._overlay = document.getElementById('landmark-modal');
    if (!this._overlay) return;

    if (!this._initialized) {
      this._initialized = true;

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this._overlay?.classList.contains('open')) {
          this.close();
        }
      });

      // overlay 배경 클릭 — 최초 1회만 (document 레벨로 등록 시 DOM 재빌드에도 유효)
      document.addEventListener('click', e => {
        const overlay = document.getElementById('landmark-modal');
        if (e.target === overlay) this.close();
      });

      // EventBus를 통한 오픈 요청 (CardFactory → window 전역 의존 제거)
      EventBus.on('openLandmarkModal', ({ districtId }) => this.open(districtId));
    }
  },

  open(districtId) {
    if (!this._initialized) this.init();
    this._districtId = districtId;
    this._render();
    this._overlay?.classList.add('open');
  },

  close() {
    this._overlay?.classList.remove('open');
    this._districtId = null;
  },

  // ── 렌더링 ─────────────────────────────────────────────

  _render() {
    const box = this._overlay?.querySelector('.landmark-modal-box');
    if (!box) return;

    const data = LANDMARK_DATA[this._districtId];
    if (!data) {
      box.innerHTML = `<div style="color:var(--text-dim);padding:24px;">랜드마크 정보 없음</div>`;
      return;
    }

    const subLocHtml = data.subLocations.map(loc => this._renderSubLoc(loc)).join('');

    box.innerHTML = `
      <div class="lm-modal-header">
        <div class="lm-modal-icon">${data.icon}</div>
        <div class="lm-modal-title-wrap">
          <div class="lm-modal-title">${data.name}</div>
          <div class="lm-modal-desc">${data.desc}</div>
        </div>
        <button class="lm-modal-close" id="lm-close-btn">✕</button>
      </div>
      <div class="lm-modal-body">
        <div class="lm-subloc-grid">${subLocHtml}</div>
      </div>
      <div class="lm-modal-footer">
        <span class="lm-modal-tip">📌 장소를 클릭하면 탐색합니다 (1 TP 소모)</span>
      </div>
    `;

    box.querySelector('#lm-close-btn')?.addEventListener('click', () => this.close());
    this._bindSubLocEvents(box, data);
  },

  _renderSubLoc(loc) {
    const dangerPct   = Math.round(loc.dangerMod * 100);
    const dangerCls   = loc.dangerMod >= 0.35 ? 'high' : loc.dangerMod >= 0.20 ? 'mid' : 'low';
    const visitCount  = GameState.landmarkHistory[loc.id] ?? 0;
    const lootMult    = this._getLootMult(visitCount);
    const lootPct     = Math.round(lootMult * 100);
    const visitBadge  = visitCount > 0
      ? `<span class="lm-visit-badge">${visitCount}회 탐색 · 루팅 ${lootPct}%</span>`
      : `<span class="lm-visit-badge fresh">미탐색</span>`;
    const lootPreview = loc.lootTable.slice(0, 3)
      .map(e => {
        const def = window.__GAME_DATA__?.items[e.id];
        return def ? `<span title="${def.name}">${def.icon ?? '📦'}</span>` : '';
      }).join('');

    return `
      <div class="lm-subloc-card${visitCount > 0 ? ' visited' : ''}" data-subloc-id="${loc.id}">
        <div class="lm-subloc-icon">${loc.icon}</div>
        <div class="lm-subloc-info">
          <div class="lm-subloc-name">${loc.name}</div>
          <div class="lm-subloc-desc">${loc.desc}</div>
          <div class="lm-subloc-meta">
            <span class="lm-danger-badge ${dangerCls}">위험 +${dangerPct}%</span>
            <span class="lm-loot-preview">${lootPreview}</span>
          </div>
          <div class="lm-visit-row">${visitBadge}</div>
        </div>
      </div>
    `;
  },

  // 방문 횟수에 따른 루팅 배율 (1회=100%, 2회=70%, 3회=45%, 4+회=25%)
  _getLootMult(visitCount) {
    if (visitCount === 0) return 1.0;
    if (visitCount === 1) return 0.70;
    if (visitCount === 2) return 0.45;
    return 0.25;
  },

  _bindSubLocEvents(box, data) {
    box.querySelectorAll('.lm-subloc-card').forEach(el => {
      el.addEventListener('click', () => {
        if (this._isExploring) return;  // 중복 클릭 방어
        const locId = el.dataset.sublocId;
        const loc   = data.subLocations.find(l => l.id === locId);
        if (loc) this._explore(loc);
      });
    });
  },

  // ── 탐색 로직 ──────────────────────────────────────────

  _explore(loc) {
    const gs         = GameState;
    const districtId = this._districtId;
    if (!districtId) return;  // [L-3] null 가드

    this._isExploring = true;
    const tpCost = 1;

    // 조우 체크 (dangerMod 기반 추가 확률)
    const baseEncounter = 0.10;
    const encounterChance = Math.min(0.90, baseEncounter + loc.dangerMod);
    if (Math.random() < encounterChance) {
      EventBus.emit('notify', { message: `⚠️ ${loc.name}에서 적과 조우!`, type: 'danger' });
      TickEngine.skipTP(tpCost);
      this._isExploring = false;
      this.close();
      const DISTRICTS   = window.__GAME_DATA__?.districts ?? {};
      const dangerLevel = DISTRICTS[districtId]?.dangerLevel ?? 1;
      const noiseLevel  = gs.noise?.level ?? 0;
      const enemies     = rollEnemyGroup(dangerLevel, noiseLevel);
      StateMachine.transition('encounter', {
        nodeId:      districtId,
        enemies,
        enemy:       enemies[0],
        dangerLevel,
        sourceName:  loc.name,
      });
      return;
    }

    // 방문 기록 업데이트
    gs.landmarkHistory[loc.id] = (gs.landmarkHistory[loc.id] ?? 0) + 1;
    const visitCount = gs.landmarkHistory[loc.id];
    const lootMult   = this._getLootMult(visitCount - 1); // 이번 방문 전 횟수 기준

    // 루팅 (방문 이력에 따라 루팅량 감소)
    const [minCount, maxCount] = loc.lootCount;
    const rawCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    const count    = Math.max(0, Math.round(rawCount * lootMult));
    const defIds   = rollLoot(loc.lootTable, count);

    const items    = window.__GAME_DATA__?.items ?? {};
    const found    = [];
    let   overflow = 0;

    for (const defId of defIds) {
      if (!items[defId]) continue;
      const inst = gs.createCardInstance(defId);
      if (!inst) continue;
      const placed = gs.placeCardInRow(inst.instanceId, 'middle');
      if (placed) {
        found.push(`${items[defId].icon ?? ''} ${items[defId].name}`);
      } else {
        // 보드 꽉 참 → 바닥 행 시도
        const placed2 = gs.placeCardInRow(inst.instanceId, 'bottom');
        if (placed2) {
          found.push(`${items[defId].icon ?? ''} ${items[defId].name}`);
        } else {
          delete gs.cards[inst.instanceId];
          overflow++;
        }
      }
    }

    // TP 소모
    TickEngine.skipTP(tpCost);

    // 결과 알림
    if (found.length > 0) {
      EventBus.emit('notify', {
        message: `🔍 ${loc.name}: ${found.join(', ')} 획득`,
        type: 'success',
      });
    } else {
      EventBus.emit('notify', {
        message: `🔍 ${loc.name}: 아무것도 찾지 못했습니다.`,
        type: 'info',
      });
    }
    if (overflow > 0) {
      EventBus.emit('notify', {
        message: `⚠️ 보드가 꽉 찼습니다. ${overflow}개 아이템 손실.`,
        type: 'warn',
      });
    }

    EventBus.emit('boardChanged', {});
    this._isExploring = false;
    this.close();
  },
};

export default LandmarkModal;
