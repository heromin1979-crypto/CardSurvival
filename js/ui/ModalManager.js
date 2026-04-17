// === MODAL MANAGER ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import CardFactory     from './CardFactory.js';
import GameData        from '../data/GameData.js';
import NPCSystem       from '../systems/NPCSystem.js';

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const ModalManager = {
  _overlay:         null,
  _box:             null,
  _prevFocus:       null,
  _nonDismissible:  false,

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._box     = document.getElementById('modal-box');

    if (!this._overlay) return;

    // Close on overlay click (분기 선택 중에는 닫힘 방지)
    this._overlay.addEventListener('click', e => {
      if (this._nonDismissible) return;
      if (e.target === this._overlay) this.close();
    });

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && GameState.ui.modalOpen) {
        if (this._nonDismissible) return;
        this.close(); return;
      }

      // 포커스 트랩: Tab 키를 모달 내부 focusable 요소 사이에서 순환
      if (e.key === 'Tab' && GameState.ui.modalOpen) {
        const focusable = [...this._box.querySelectorAll(FOCUSABLE)];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    });

    EventBus.on('openCardInspect', ({ instanceId }) => this.showCardInspect(instanceId));
    EventBus.on('branchChoice',    ({ options, questId }) => this.showBranchChoice(options, questId));
    EventBus.on('openStructureRepair', ({ districtId }) => this.showStructureRepair(districtId));
  },

  open(html, title = '') {
    if (!this._overlay) return;
    this._prevFocus = document.activeElement;
    this._box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body">${html}</div>
    `;
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;
    // 첫 번째 focusable 요소로 포커스 이동
    requestAnimationFrame(() => {
      const first = this._box.querySelector(FOCUSABLE);
      if (first) first.focus();
      else { this._box.setAttribute('tabindex', '-1'); this._box.focus(); }
    });
  },

  close() {
    if (!this._overlay) return;
    this._nonDismissible = false;
    this._overlay.classList.remove('open');
    GameState.ui.modalOpen = false;
    // 이전 포커스 복원
    if (this._prevFocus?.focus) {
      this._prevFocus.focus();
      this._prevFocus = null;
    }
  },

  /** 스토리 분기 선택 모달 — 닫기 불가 */
  showBranchChoice(options, questId) {
    if (!this._overlay) return;
    this._nonDismissible = true;
    this._prevFocus = document.activeElement;

    const btns = options.map((opt, i) => {
      const npcBadge = opt.recruitNpc
        ? `<div class="branch-npc-badge">👤 동반자 합류</div>`
        : '';
      const warnBadge = opt.warning
        ? `<div class="branch-warning-badge" style="color:var(--text-warn);margin-top:6px;font-size:0.85em;">⚠️ ${opt.warning}</div>`
        : '';
      return `
        <button class="branch-choice-btn" id="branch-opt-${i}">
          <div class="branch-choice-title">${opt.label}</div>
          <div class="branch-choice-desc">${opt.desc ?? ''}</div>
          ${npcBadge}
          ${warnBadge}
        </button>`;
    }).join('');

    this._box.innerHTML = `
      <div class="modal-title">⚡ 선택의 갈림길</div>
      <div class="modal-body branch-choice-body">
        <p class="branch-choice-hint">이 선택은 이후 스토리를 결정합니다.</p>
        <div class="branch-choice-options">${btns}</div>
      </div>
    `;
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;

    options.forEach((opt, i) => {
      document.getElementById(`branch-opt-${i}`).onclick = () => {
        // 플래그 설정
        GameState.flags[opt.setsFlag] = true;
        // NPC 강제 영입
        if (opt.recruitNpc) {
          NPCSystem.forceRecruit(opt.recruitNpc);
        }
        this.close();
        EventBus.emit('branchChosen', { setsFlag: opt.setsFlag });
      };
    });

    requestAnimationFrame(() => {
      const first = this._box.querySelector('.branch-choice-btn');
      if (first) first.focus();
    });
  },

  confirm(message, onConfirm, onCancel = null) {
    if (!this._overlay) { if (confirm(message)) onConfirm(); return; }
    const id = 'confirm-' + Date.now();
    this._box.innerHTML = `
      <div class="modal-title">${I18n.t('modal.confirm')}</div>
      <div class="modal-body">${message}</div>
      <div class="modal-actions">
        <button class="modal-btn" id="${id}-cancel">${I18n.t('modal.cancel')}</button>
        <button class="modal-btn confirm" id="${id}-ok">${I18n.t('modal.ok')}</button>
      </div>
    `;
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;

    document.getElementById(`${id}-ok`).onclick = () => { this.close(); onConfirm(); };
    document.getElementById(`${id}-cancel`).onclick = () => { this.close(); if (onCancel) onCancel(); };
  },

  showCardInspect(instanceId) {
    const inst = GameState.cards[instanceId];
    if (!inst) return;
    const def  = GameData.items[inst.definitionId];
    if (!def)  return;

    const stats = [];
    if (def.weight)             stats.push([I18n.t('modal.weight'), `${def.weight} kg`]);
    if (def.defaultDurability)  stats.push([I18n.t('modal.durability'), `${inst.durability}%`]);
    if (inst.contamination > 0) stats.push([I18n.t('modal.contamination'), `${inst.contamination}%`, 'danger']);
    if (def.onConsume?.hydration) stats.push([I18n.t('modal.hydration'), `+${def.onConsume.hydration}`]);
    if (def.onConsume?.nutrition) stats.push([I18n.t('modal.nutrition'), `+${def.onConsume.nutrition}`]);
    if (def.onConsume?.hp)        stats.push([I18n.t('modal.hpRestore'), `+${def.onConsume.hp}`]);
    if (def.combat) {
      const [dMin, dMax] = def.combat.damage;
      stats.push([I18n.t('modal.damage'), `${dMin}-${dMax}`]);
      stats.push([I18n.t('modal.accuracy'), `${Math.round(def.combat.accuracy * 100)}%`]);
      stats.push([I18n.t('modal.noise'), `+${def.combat.noiseOnUse}`]);
    }

    const statsHtml = stats.map(([k, v, cls]) =>
      `<div class="card-inspect-stat">
        <span>${k}</span>
        <span class="card-inspect-stat-val ${cls ?? ''}">${v}</span>
      </div>`
    ).join('');

    const canConsume   = def.type === 'consumable' && def.onConsume;
    const canDismantle = Array.isArray(def.dismantle) && def.dismantle.length > 0;
    const equipSlots   = EquipmentSystem.getSlotsForDef(def);
    const canEquip     = equipSlots.length > 0;

    // 낚싯대 여부
    const isFishingRod = def.subtype === 'fishing' && def.id !== 'fish_trap';
    let fishBtnHtml = '';
    let fishBtnReason = '';
    if (isFishingRod) {
      const inHangang = GameState.location?.currentLandmark === 'hangang';
      const hasBait   = [...(GameState.board?.bottom ?? []), ...(GameState.board?.middle ?? [])]
        .some(id => {
          if (!id) return false;
          const d = GameData.items[GameState.cards[id]?.definitionId];
          return d?.tags?.includes('bait');
        });
      const fishOk = inHangang && hasBait;
      if (!inHangang)    fishBtnReason = '한강 랜드마크 안에서만 낚시할 수 있습니다.';
      else if (!hasBait) fishBtnReason = '미끼(지렁이 또는 벌레)가 필요합니다.';
      fishBtnHtml = `<button class="card-action-btn fish-btn${fishOk ? '' : ' disabled'}"
        id="modal-fish-${instanceId}" ${fishOk ? '' : 'disabled'}
        title="${fishBtnReason}">
        🎣 낚시하기
      </button>`;
    }

    // 분해 재료 미리보기
    let dismantleHtml = '';
    if (canDismantle) {
      const rows = def.dismantle.map(entry => {
        const matDef  = GameData.items[entry.definitionId];
        const matName = I18n.itemName(entry.definitionId, matDef?.name ?? entry.definitionId);
        const matIcon = matDef?.icon ?? '📦';
        const pct     = Math.round(entry.chance * 100);
        return `<div class="card-inspect-dismantle-row">
          <span>${matIcon} ${matName} ×${entry.qty}</span>
          <span class="card-inspect-dismantle-chance">${pct}%</span>
        </div>`;
      }).join('');
      dismantleHtml = `
        <div class="card-inspect-dismantle">
          <div class="card-inspect-dismantle-title">${I18n.t('modal.dismantleResult')}</div>
          ${rows}
        </div>`;
    }

    // 의료 구조물 수리 버튼
    const isMedicalStructure = def.type === 'structure' && def.subtype === 'medical' && def.repairRecipe;
    let repairBtnHtml = '';
    let repairBtnReason = '';
    if (isMedicalStructure) {
      const boardCards = GameState.getBoardCards();
      const materialStatus = def.repairRecipe.map(req => {
        const have = boardCards
          .filter(c => c.definitionId === req.definitionId)
          .reduce((sum, c) => sum + (c.quantity ?? 1), 0);
        return { ...req, have, enough: have >= req.qty };
      });
      const needsRepair = (inst.durability ?? 0) < (def.defaultDurability ?? 100);
      const canRepair = needsRepair && materialStatus.every(m => m.enough);
      if (!needsRepair) repairBtnReason = '내구도가 최대입니다.';
      else if (!materialStatus.every(m => m.enough)) {
        const missing = materialStatus.filter(m => !m.enough).map(m => {
          const mDef = GameData.items[m.definitionId];
          return `${mDef?.name ?? m.definitionId}(${m.have}/${m.qty})`;
        });
        repairBtnReason = `재료 부족: ${missing.join(', ')}`;
      }
      repairBtnHtml = `<button class="card-action-btn${canRepair ? '' : ' disabled'}"
        id="modal-repair-${instanceId}" ${canRepair ? '' : 'disabled'}
        title="${repairBtnReason}">
        🔧 수리 (+${def.repairAmount ?? 0})
      </button>`;
    }

    const hasActions = canConsume || canDismantle || canEquip || isFishingRod || isMedicalStructure;

    // 장착 슬롯 버튼 목록 (슬롯이 여럿이면 각각 버튼 생성)
    const slotLabels = {
      head: '머리', face: '얼굴', body: '몸통', offhand: '보조손',
      hands: '장갑', backpack: '배낭', weapon_main: '주무기', weapon_sub: '보조무기',
      belt: '벨트', accessory: '장신구', boots: '신발',
    };
    const equipBtnsHtml = canEquip
      ? equipSlots.map(slotId =>
          `<button class="card-action-btn equip" id="modal-equip-${instanceId}-${slotId}">
            ⚙️ ${slotLabels[slotId] ?? slotId} 장착
          </button>`
        ).join('')
      : '';

    const inspectImgSrc = CardFactory.images[inst.definitionId] ?? null;
    const inspectArt = inspectImgSrc
      ? `<div class="card-inspect-art card-inspect-art--img"><img class="card-inspect-img" src="${inspectImgSrc}" alt="${def.name ?? ''}"></div>`
      : `<div class="card-inspect-art">${def.icon ?? '📦'}</div>`;

    const html = `
      <div class="card-inspect">
        ${inspectArt}
        <div class="card-inspect-info">
          <div class="card-inspect-name">${I18n.itemName(inst.definitionId, def.name)}</div>
          <div class="card-inspect-type">${def.type} · ${def.rarity}</div>
          <p style="font-size:11px;color:var(--text-secondary);margin:8px 0;">${def.description ?? ''}</p>
          <div class="card-inspect-stats">${statsHtml}</div>
          ${dismantleHtml}
          ${hasActions ? `
          <div class="card-inspect-actions">
            ${canConsume    ? `<button class="card-action-btn" id="modal-consume-${instanceId}">${I18n.t('modal.use')}</button>` : ''}
            ${equipBtnsHtml}
            ${repairBtnHtml}
            ${canDismantle  ? `<button class="card-action-btn dismantle" id="modal-dismantle-${instanceId}">${I18n.t('modal.dismantle')}</button>` : ''}
            ${fishBtnHtml}
          </div>` : ''}
        </div>
      </div>
    `;

    this.open(html, I18n.t('modal.cardInfo'));

    if (canConsume) {
      document.getElementById(`modal-consume-${instanceId}`)?.addEventListener('click', () => {
        this.close();
        import('../systems/StatSystem.js').then(m => {
          m.default.consumeCard(instanceId);
          EventBus.emit('boardChanged', {});
        });
      });
    }

    if (canEquip) {
      for (const slotId of equipSlots) {
        document.getElementById(`modal-equip-${instanceId}-${slotId}`)?.addEventListener('click', () => {
          const ok = EquipmentSystem.equip(instanceId, slotId);
          this.close();
          if (ok) EventBus.emit('boardChanged', {});
        });
      }
    }

    if (isMedicalStructure) {
      document.getElementById(`modal-repair-${instanceId}`)?.addEventListener('click', () => {
        // 재료 소모
        for (const req of def.repairRecipe) {
          let remaining = req.qty;
          for (const card of GameState.getBoardCards()) {
            if (remaining <= 0) break;
            if (card.definitionId !== req.definitionId) continue;
            const qty = card.quantity ?? 1;
            if (qty <= remaining) {
              remaining -= qty;
              GameState.removeCardInstance(card.instanceId);
            } else {
              card.quantity = qty - remaining;
              remaining = 0;
            }
          }
        }
        const maxDur = def.defaultDurability ?? 100;
        inst.durability = Math.min(maxDur, (inst.durability ?? 0) + (def.repairAmount ?? 0));
        EventBus.emit('notify', { message: `🔧 ${def.name} 수리 완료 (+${def.repairAmount})`, type: 'good' });
        EventBus.emit('boardChanged', {});
        this.close();
      });
    }

    if (canDismantle) {
      document.getElementById(`modal-dismantle-${instanceId}`)?.addEventListener('click', () => {
        this.close();
        import('../systems/DismantleSystem.js').then(m => {
          m.default.dismantle(instanceId);
        });
      });
    }

    if (isFishingRod) {
      document.getElementById(`modal-fish-${instanceId}`)?.addEventListener('click', () => {
        this.close();
        EventBus.emit('fishAction', { rodInstanceId: instanceId });
      });
    }
  },

  showStructureRepair(districtId) {
    const installed = GameState.location.installedStructures?.[districtId];
    if (!installed?.id) return;

    const def = GameData.items[installed.id];
    if (!def) return;

    const dur = Math.max(0, installed.durability);
    const maxDur = installed.maxDurability || 100;
    const durPct = Math.min(100, (dur / maxDur) * 100);
    const durCls = durPct < 20 ? 'danger' : durPct < 50 ? 'warn' : '';

    // 효과 텍스트
    const tick = def.onTick ?? {};
    const effects = [];
    if (tick.hp)        effects.push(`HP+${tick.hp}/TP`);
    if (tick.infection) effects.push(`감염${tick.infection}/TP`);
    if (tick.morale)    effects.push(`사기+${tick.morale}/TP`);
    if (tick.fatigue)   effects.push(`피로${tick.fatigue}/TP`);
    const effectText = effects.join(', ');

    // 수리 재료 확인
    const repairRecipe = def.repairRecipe ?? [];
    const repairAmount = def.repairAmount ?? 0;
    const boardCards = GameState.getBoardCards();
    const materialStatus = repairRecipe.map(req => {
      const matDef = GameData.items[req.definitionId];
      const have = boardCards
        .filter(c => c.definitionId === req.definitionId)
        .reduce((sum, c) => sum + (c.quantity ?? 1), 0);
      return {
        id: req.definitionId,
        name: matDef?.name ?? req.definitionId,
        icon: matDef?.icon ?? '📦',
        need: req.qty,
        have,
        enough: have >= req.qty,
      };
    });
    const canRepair = repairRecipe.length > 0 && materialStatus.every(m => m.enough) && dur < maxDur;
    const needsRepair = dur < maxDur;

    const materialsHtml = repairRecipe.length > 0
      ? materialStatus.map(m => {
          const cls = m.enough ? '' : 'style="color:var(--text-danger,#c44)"';
          return `<span ${cls}>${m.icon} ${m.name} ×${m.need} (보유: ${m.have})</span>`;
        }).join(', ')
      : '수리 불가';

    // 분해 재료 미리보기
    const dismantleItems = def.dismantle ?? [];
    const dismantleHtml = dismantleItems.length > 0
      ? dismantleItems.map(entry => {
          const matDef = GameData.items[entry.definitionId];
          return `${matDef?.icon ?? '📦'} ${matDef?.name ?? entry.definitionId} ×${entry.qty} (${Math.round(entry.chance * 100)}%)`;
        }).join(', ')
      : '';

    const html = `
      <div class="card-inspect">
        <div class="card-inspect-art">${def.icon ?? '⛺'}</div>
        <div class="card-inspect-info">
          <div class="card-inspect-name">${def.name}</div>
          <div style="margin:8px 0;">
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">내구도: ${Math.round(dur)}/${maxDur}</div>
            <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
              <div class="${durCls}" style="width:${durPct}%;height:100%;background:${durPct < 20 ? 'var(--text-danger,#c44)' : durPct < 50 ? 'var(--text-warn,#ca3)' : 'var(--text-good,#4a8)'};border-radius:4px;transition:width 0.3s;"></div>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">효과: ${effectText || '없음'}</div>
          <hr style="border-color:rgba(255,255,255,0.1);margin:8px 0;">
          ${needsRepair ? `<div style="font-size:11px;margin-bottom:8px;">수리 재료: ${materialsHtml} → +${repairAmount} 내구도</div>` : '<div style="font-size:11px;color:var(--text-good);margin-bottom:8px;">내구도가 최대입니다.</div>'}
          ${dismantleHtml ? `<div style="font-size:10px;color:var(--text-dim);margin-bottom:8px;">분해 시: ${dismantleHtml}</div>` : ''}
          <div class="card-inspect-actions">
            <button class="card-action-btn${canRepair ? '' : ' disabled'}" id="modal-struct-repair" ${canRepair ? '' : 'disabled'}>🔧 수리</button>
            <button class="card-action-btn dismantle" id="modal-struct-dismantle">분해</button>
            <button class="card-action-btn" id="modal-struct-close">${I18n.t('modal.cancel')}</button>
          </div>
        </div>
      </div>
    `;

    this.open(html, '구조물 관리');

    // 수리 버튼
    document.getElementById('modal-struct-repair')?.addEventListener('click', () => {
      // 재료 소모
      for (const req of repairRecipe) {
        let remaining = req.qty;
        for (const card of GameState.getBoardCards()) {
          if (remaining <= 0) break;
          if (card.definitionId !== req.definitionId) continue;
          const qty = card.quantity ?? 1;
          if (qty <= remaining) {
            remaining -= qty;
            GameState.removeCardInstance(card.instanceId);
          } else {
            card.quantity = qty - remaining;
            remaining = 0;
          }
        }
      }
      // 내구도 회복
      installed.durability = Math.min(maxDur, dur + repairAmount);
      EventBus.emit('notify', { message: `🔧 ${def.name} 수리 완료 (+${repairAmount})`, type: 'good' });
      EventBus.emit('boardChanged', {});
      this.close();
    });

    // 분해 버튼
    document.getElementById('modal-struct-dismantle')?.addEventListener('click', () => {
      this.close();
      this.confirm(`${def.name}을(를) 분해하시겠습니까?`, () => {
        // 확률적 재료 반환
        for (const entry of dismantleItems) {
          if (Math.random() < entry.chance) {
            const inst = GameState.createCardInstance(entry.definitionId, { quantity: entry.qty });
            if (inst) GameState.placeCardInRow(inst.instanceId, 'middle');
          }
        }
        delete GameState.location.installedStructures[districtId];
        EventBus.emit('notify', { message: `${def.name} 분해 완료`, type: 'info' });
        EventBus.emit('boardChanged', {});
      });
    });

    // 닫기 버튼
    document.getElementById('modal-struct-close')?.addEventListener('click', () => {
      this.close();
    });
  },
};

export default ModalManager;
