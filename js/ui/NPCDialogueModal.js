// === NPC DIALOGUE MODAL ===
// Shows NPC dialogue, trust level, trade interface, and recruit/dismiss buttons.
// Opened via EventBus 'openNPCDialogue' event (fired by CardFactory on dblclick of NPC cards).

import EventBus        from '../core/EventBus.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import NPCSystem       from '../systems/NPCSystem.js';
import NPCQuestSystem, { isNpcQuestStepComplete } from '../systems/NPCQuestSystem.js';
import SkillSystem     from '../systems/SkillSystem.js';
import { NPC_ITEMS }   from '../data/npcs.js';
import GameData        from '../data/GameData.js';
import { getNPCPortrait } from './npcPortraits.js';
import { COMPANION_SPRITE_KEYS, COMBAT_SPRITE_SHEETS } from './combat/combatUiAssets.js';
import { getLandmarkData, normalizeLandmarkKey } from '../data/landmarks.js';

const FOCUSABLE = 'button:not(:disabled), [href], [tabindex="0"]';

function readableDialogue(line) {
  return line && !/^npc\.[\w.]+$/.test(line) ? line : '';
}

const EMOTION_LABELS = {
  calm:    '😌 안정',
  hopeful: '🌟 희망',
  anxious: '😰 불안',
  trauma:  '💔 외상',
};

const NPCDialogueModal = {
  _overlay: null,
  _box:     null,
  _view: 'main',
  _npcId: null,
  _keyHandler: null,
  _previousFocus: null,
  _previousModalOpen: false,
  _subscriptions: [],

  init() {
    this._overlay = document.getElementById('npc-dialogue-overlay');
    if (!this._overlay) {
      this._overlay = document.createElement('div');
      this._overlay.id = 'npc-dialogue-overlay';
      this._overlay.className = 'npc-scene-overlay';
      this._overlay.innerHTML = '<section class="npc-scene" role="dialog" aria-modal="true" aria-labelledby="npc-scene-name"></section>';
      (document.getElementById('app') ?? document.body).appendChild(this._overlay);
    }
    this._box = this._overlay.querySelector('.npc-scene');
    this._overlay.onclick = e => { if (e.target === this._overlay) this._close(); };

    this._subscriptions.forEach(unsubscribe => unsubscribe());
    this._subscriptions = [
      EventBus.on('openNPCDialogue', ({ npcId }) => this.show(npcId)),
      EventBus.on('showDilemma', opts => this._showDilemma(opts)),
    ];
  },

  show(npcId) {
    if (!this._overlay || !this._box) return;

    const npcDef  = NPCSystem.getNPCDef(npcId);
    let npcState = NPCSystem.getNPCState(npcId);
    // NPC가 스폰되지 않은 상태에서 패널에 표시될 경우 → 즉시 초기화
    if (!npcDef) return;
    if (!npcState) {
      NPCSystem.ensureInitialized();
      if (!GameState.npcs.states[npcId]) {
        GameState.npcs.states[npcId] = {
          spawned: true, dismissed: false, trust: 0,
          isCompanion: false, hp: npcDef.maxHp ?? 50,
          neglectDays: 0, companionSince: null, bond: 0, lastTreatDay: -1,
        };
      }
      npcState = GameState.npcs.states[npcId];
    }

    if (!this._overlay.classList.contains('open')) {
      this._previousFocus = document.activeElement;
      this._previousModalOpen = GameState.ui.modalOpen;
    }
    this._npcId = npcId;
    this._view = 'main';
    // 대화 진입 때만 방치 일수를 초기화한다. 메뉴 탐색과 재그리기는 상태를 변경하지 않는다.
    NPCSystem.talkTo(npcId);
    this._overlay.classList.add('open');
    GameState.ui.modalOpen = true;
    if (!this._keyHandler) {
      this._keyHandler = e => {
        if (document.getElementById('dilemma-overlay')) return;
        this._handleKeys(e, this._box, () => this._close());
      };
      document.addEventListener('keydown', this._keyHandler, true);
    }
    this._render(npcId);
  },

  _render(npcId = this._npcId) {
    const npcDef = NPCSystem.getNPCDef(npcId);
    const npcState = NPCSystem.getNPCState(npcId);
    if (!npcDef || !npcState) return;
    const focusedId = this._box.contains(document.activeElement) ? document.activeElement.id : null;
    const itemDef = NPC_ITEMS[npcId];
    const name    = I18n.itemName(npcId, itemDef?.name ?? npcId);
    const icon    = itemDef?.icon ?? '👤';
    const trust   = npcState.trust;

    const greeting = readableDialogue(NPCSystem.getDialogue(npcId, 'greet'));
    const hint     = readableDialogue(NPCSystem.getDialogue(npcId, 'hint'));

    // Trust bar
    const trustDots = Array.from({ length: 5 }, (_, i) =>
      `<span class="npc-trust-dot ${i < trust ? 'filled' : ''}">${i < trust ? '★' : '☆'}</span>`
    ).join('');

    // Companion status
    const isCompanion = npcState.isCompanion;
    const canRecruit  = NPCSystem.canRecruit(npcId);
    const comp        = npcDef.companion;

    // Companion stats section
    let companionHtml = '';
    if (comp?.canRecruit) {
      const statsRows = [];
      if (comp.combatDmg > 0)           statsRows.push([I18n.t('npc.statCombat'),   `+${Math.round((comp.combatDmg - 1) * 100)}%`]);
      if (comp.healBonus > 0)            statsRows.push([I18n.t('npc.statHeal'),     `+${Math.round((comp.healBonus - 1) * 100)}%`]);
      if (comp.craftBonus > 0)           statsRows.push([I18n.t('npc.statCraft'),    `+${Math.round((comp.craftBonus - 1) * 100)}%`]);
      if (comp.carryBonus > 0)           statsRows.push([I18n.t('npc.statCarry'),    `+${comp.carryBonus}kg`]);
      if (comp.moralBonus > 0)           statsRows.push([I18n.t('npc.statMorale'),   `+${comp.moralBonus}/TP`]);
      if (comp.lonelinessReduction > 0)  statsRows.push([I18n.t('npc.statLonely'),   `-${comp.lonelinessReduction}/TP`]);
      if (comp.noiseAdd > 0)             statsRows.push([I18n.t('npc.statNoise'),    `+${comp.noiseAdd}`]);
      if (comp.foodCostPerDay > 0)       statsRows.push([I18n.t('npc.statFood'),     `${comp.foodCostPerDay}/TP`]);

      const statsHtml = statsRows.map(([k, v]) =>
        `<div class="npc-comp-stat"><span>${k}</span><span>${v}</span></div>`
      ).join('');

      const recruitTrustNeeded = comp.recruitTrust;
      const recruitLabel = isCompanion
        ? I18n.t('npc.dismiss')
        : canRecruit
          ? I18n.t('npc.recruit')
          : I18n.t('npc.trustNeeded', { trust: recruitTrustNeeded });

      companionHtml = `
        <div class="npc-companion-section">
          <div class="npc-section-title">${I18n.t('npc.companionStats')}</div>
          <div class="npc-comp-stats">${statsHtml}</div>
          <button class="npc-action-btn ${isCompanion ? 'dismiss' : canRecruit ? 'recruit' : 'disabled'}"
                  id="npc-recruit-btn" ${!isCompanion && !canRecruit ? 'disabled' : ''}>
            ${recruitLabel}
          </button>
        </div>`;
    }

    // Trade section
    let tradeHtml = '';
    const trades = NPCSystem.getAvailableTrades(npcId);
    if (trades.length > 0) {
      const tradeRows = trades.map((trade, idx) => {
        const giveDef    = GameData.items[trade.give.id];
        const receiveDef = GameData.items[trade.receive.id];
        const giveName   = I18n.itemName(trade.give.id, giveDef?.name);
        const recvName   = I18n.itemName(trade.receive.id, receiveDef?.name);
        const haveQty    = GameState.countOnBoard(trade.give.id);
        const canTrade   = haveQty >= trade.give.qty;

        return `
          <div class="npc-trade-row">
            <span class="npc-trade-give">${giveDef?.icon ?? '📦'} ${giveName} x${trade.give.qty}<small>보유: ${haveQty}${canTrade ? '' : ` · ${trade.give.qty - haveQty}개 부족`}</small></span>
            <span class="npc-trade-arrow">→</span>
            <span class="npc-trade-recv">${receiveDef?.icon ?? '📦'} ${recvName} x${trade.receive.qty}</span>
            <button id="npc-trade-${idx}" class="npc-trade-btn ${canTrade ? '' : 'disabled'}" data-trade-idx="${idx}"
                    ${canTrade ? '' : 'disabled'}>
              ${I18n.t('npc.trade')}
            </button>
          </div>`;
      }).join('');

      tradeHtml = `
        <div class="npc-trade-section">
          <div class="npc-section-title">${I18n.t('npc.tradeTitle')}</div>
          ${tradeRows}
        </div>`;
    }

    // Active quest section
    const activeQuest = NPCQuestSystem.getActiveQuest(npcId);
    let questHtml = '';
    if (activeQuest) {
      const stepDescs = activeQuest.steps.map(s => {
        const done = isNpcQuestStepComplete(s);
        const mark = done ? '✅' : '⬜';
        const cls  = done ? 'done' : '';
        if (s.type === 'collect' || s.type === 'offer_item') {
          const have = GameState.countOnBoard?.(s.itemId) ?? 0;
          const itemDef = GameData?.items[s.itemId];
          const iname   = I18n.itemName(s.itemId, itemDef?.name);
          const suffix  = s.type === 'offer_item' ? ' 건네기' : '';
          return `<div class="npc-quest-step ${cls}">${mark} ${iname} ${have}/${s.qty}${suffix} — <em>${s.hint}</em></div>`;
        }
        if (s.type === 'visit') {
          const targetId    = s.districtId ?? s.locationId;
          const districtDef = GameData?.districts?.[targetId];
          const label       = I18n.districtName(targetId, districtDef?.name ?? targetId);
          return `<div class="npc-quest-step ${cls}">${mark} ${label} 방문 — <em>${s.hint}</em></div>`;
        }
        return `<div class="npc-quest-step ${cls}">${mark} ${s.hint ?? (s.type === 'day' ? `${s.minDay}일 생존` : '의뢰 목표')}</div>`;
      }).join('');
      questHtml = `
        <div class="npc-quest-section">
          <div class="npc-section-title">❗ 진행 중 의뢰: ${activeQuest.title}</div>
          <div class="npc-quest-steps">${stepDescs}</div>
        </div>`;
    }

    // W-2: Emotion state display
    const emotion = npcState.emotion ?? 'calm';
    const emotionLabel = EMOTION_LABELS[emotion] ?? EMOTION_LABELS.calm;
    const emotionHtml = isCompanion
      ? `<div class="npc-emotion-badge emotion-${emotion}">${emotionLabel}</div>`
      : '';

    // W-7: Personal story arc progress
    const storySystem = SystemRegistry.get('NPCStorySystem');
    const arcProgress = storySystem?.getArcProgress(npcId);
    let arcHtml = '';
    if (arcProgress && isCompanion) {
      arcHtml = `
        <div class="npc-arc-section">
          <div class="npc-arc-title">📖 개인 서사</div>
          ${arcProgress.completed
            ? `<div class="npc-arc-complete">✨ ${arcProgress.arc.completionLine}</div>`
            : `<div class="npc-arc-hint">${arcProgress.hint}</div>`
          }
        </div>`;
    }

    // W-6: Dispatch button (companions only)
    let dispatchHtml = '';
    if (isCompanion) {
      const dispatched = npcState.dispatched ?? false;
      dispatchHtml = `
        <div class="npc-heal-section" style="margin-top:8px">
          <button class="npc-action-btn dispatch ${dispatched ? 'active disabled' : ''}"
                  id="npc-dispatch-btn" ${dispatched ? 'disabled' : ''}>
            ${dispatched ? '🎒 파견 중...' : '🎒 자원 수집 파견'}
          </button>
        </div>`;
    }

    // Companion heal section (V-5)
    let healHtml = '';
    if (isCompanion) {
      const npcDef = NPCSystem.getNPCDef(npcId);
      const maxHp  = npcDef?.maxHp ?? 50;
      const curHp  = npcState.hp ?? maxHp;
      const hpPct  = Math.round((curHp / maxHp) * 100);
      const hpCls  = hpPct > 60 ? 'good' : hpPct > 30 ? 'warn' : 'crit';
      const canHeal = GameState.countOnBoard?.('bandage') > 0 || GameState.countOnBoard?.('first_aid_kit') > 0;
      if (curHp < maxHp) {
        healHtml = `
          <div class="npc-heal-section">
            <div class="npc-section-title">❤️ HP 상태: ${curHp}/${maxHp}</div>
            <div class="npc-hp-bar-wide"><div class="npc-hp-bar ${hpCls}" style="width:${hpPct}%"></div></div>
            <button class="npc-action-btn heal ${canHeal ? '' : 'disabled'}" id="npc-heal-btn" ${canHeal ? '' : 'disabled'}>
              ${canHeal ? '붕대로 치료하기 (붕대/응급키트 소모)' : '치료 아이템 없음'}
            </button>
          </div>`;
      }
    }

    // 부상 군인 치료 섹션
    let woundHealHtml = '';
    const woundLevel = npcState.woundLevel ?? 0;
    const npcDefFull = NPCSystem.getNPCDef(npcId);
    if (woundLevel > 0 && npcDefFull?.woundHealItem) {
      const healItemId = npcDefFull.woundHealItem;
      const healQty    = npcDefFull.woundHealQty ?? 2;
      const healItemDef = GameData.items[healItemId];
      const haveHealItem = GameState.countOnBoard?.(healItemId) ?? 0;
      const canWoundHeal = haveHealItem >= healQty;
      woundHealHtml = `
        <div class="npc-heal-section">
          <div class="npc-section-title">🩹 부상 단계: ${woundLevel}/3</div>
          <div class="npc-treatment-note">
            치료 재료: ${healItemDef?.icon ?? '📦'} ${healItemDef?.name ?? healItemId} ×${healQty} (보유: ${haveHealItem})
          </div>
          <button class="npc-action-btn heal ${canWoundHeal ? '' : 'disabled'}"
                  id="npc-wound-heal-btn" ${canWoundHeal ? '' : 'disabled'}>
            🩹 부상 치료 (${woundLevel}단계 → ${woundLevel - 1}단계)
          </button>
        </div>`;
    } else if (woundLevel === 0 && npcDefFull?.woundHealItem && !isCompanion) {
      woundHealHtml = `
        <div class="npc-heal-section">
          <div class="npc-treatment-note healed">✅ 부상이 완치되었습니다. 이제 친밀도를 쌓을 수 있습니다.</div>
        </div>`;
    }

    const views = [
      { id: 'quest', label: '의뢰', html: questHtml },
      { id: 'info', label: '정보', html: hint ? `<p class="npc-hint">${hint}</p>` : '' },
      { id: 'trade', label: '거래', html: tradeHtml },
      { id: 'companion', label: isCompanion ? '동료 관리' : '동행 제안', html: companionHtml + healHtml + dispatchHtml + arcHtml },
      { id: 'heal', label: '부상 치료', html: woundHealHtml },
    ].filter(view => view.html);
    const currentView = views.find(view => view.id === this._view);
    const standalone = getNPCPortrait(npcId, { full: true });
    const sprite = standalone ? null : COMBAT_SPRITE_SHEETS[COMPANION_SPRITE_KEYS[npcId]];
    const portrait = standalone ?? sprite?.src?.replace(/^\//, '');
    const districtId = GameState.location?.currentDistrict;
    const district = GameData.districts?.[districtId];
    const landmarkKey = normalizeLandmarkKey(GameState.location?.currentLandmark);
    const landmark = getLandmarkData(landmarkKey);
    const subLocation = landmark?.subLocations?.find(sub => sub.id === GameState.location?.currentSubLocation);
    const locationName = subLocation?.name ?? landmark?.name ?? I18n.districtName(districtId, district?.name ?? '서울');
    const neutralBackground = 'assets/images/locations/urban.png';
    const background = subLocation ? `assets/images/sublocations/${subLocation.id}.png`
      : landmarkKey === 'basecamp' ? 'assets/images/landmarks/basecamp.png'
      : district ? `assets/images/landmarks/lm_${landmarkKey || districtId}.png` : neutralBackground;
    this._box.innerHTML = `
      <div class="npc-scene-stage">
        <img class="npc-scene-background" src="${background}" alt="">
        <div class="npc-scene-location">${locationName} <span>생존자와의 대화</span></div>
        <div class="npc-scene-person ${sprite ? 'has-sheet' : 'has-portrait'}">
          <span class="npc-scene-fallback" ${portrait ? 'hidden' : ''} aria-label="${name}">${icon}</span>
          ${portrait ? `<img class="npc-scene-character" src="${portrait}" alt="${name}" ${sprite ? `style="width:${sprite.cols * 100}%;height:${sprite.rows * 100}%;top:-${(sprite.motions.idle?.row ?? 0) * 100}%"` : ''}>` : ''}
        </div>
        <div class="npc-scene-caption">${name}<span>${isCompanion ? '함께 생존하는 동료' : '폐허에서 만난 생존자'}</span></div>
      </div>
      <div class="npc-scene-panel">
        <header class="npc-scene-header">
          <div class="npc-scene-eyebrow">대화</div>
          <h2 id="npc-scene-name">${name}</h2>
          <div class="npc-trust" aria-label="친밀도 ${trust}/5">${trustDots}</div>
          ${emotionHtml}
        </header>
        <p class="npc-greeting">${greeting ? `“${greeting}”` : itemDef?.description ?? ''}</p>
        <nav class="npc-scene-choices" aria-label="대화 주제">
          ${views.map(view => `<button id="npc-view-${view.id}" data-dialogue-view="${view.id}" aria-pressed="${this._view === view.id}" aria-controls="npc-scene-detail">${view.label}<span aria-hidden="true">›</span></button>`).join('')}
        </nav>
        <section id="npc-scene-detail" class="npc-scene-detail" aria-label="${currentView?.label ?? '대화 상세'}" ${currentView ? '' : 'hidden'}>
          ${currentView ? `<div class="npc-scene-detail-heading"><h3>${currentView.label}</h3><button id="npc-back-btn">접기</button></div>${currentView.html}` : ''}
        </section>
        <button id="npc-leave-btn" class="npc-scene-leave">대화를 마친다 <span>Esc</span></button>
      </div>`;
    const image = this._box.querySelector('.npc-scene-character');
    if (image) image.onerror = () => {
      image.hidden = true;
      this._box.querySelector('.npc-scene-fallback').hidden = false;
    };
    const bg = this._box.querySelector('.npc-scene-background');
    bg.onerror = () => {
      if (bg.getAttribute('src') !== neutralBackground) bg.src = neutralBackground;
      else bg.hidden = true;
    };
    this._bindEvents(npcId);
    const focusTarget = focusedId && this._box.querySelector(`#${focusedId}:not(:disabled)`);
    (focusTarget || this._box.querySelector(FOCUSABLE))?.focus();
  },

  _bindEvents(npcId) {
    this._box.querySelectorAll('[data-dialogue-view]').forEach(btn => {
      btn.onclick = () => { this._view = btn.dataset.dialogueView; this._render(npcId); };
    });
    this._box.querySelector('#npc-leave-btn').onclick = () => this._close();
    const back = this._box.querySelector('#npc-back-btn');
    if (back) back.onclick = () => { this._view = 'main'; this._render(npcId); };
    // Recruit/Dismiss button
    const recruitBtn = document.getElementById('npc-recruit-btn');
    if (recruitBtn) {
      recruitBtn.addEventListener('click', () => {
        const state = NPCSystem.getNPCState(npcId);
        if (state?.isCompanion) {
          NPCSystem.dismiss(npcId);
        } else {
          NPCSystem.recruit(npcId);
        }
        this._close();
      });
    }

    // Trade buttons
    const tradeBtns = document.querySelectorAll('.npc-trade-btn:not(.disabled)');
    for (const btn of tradeBtns) {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.tradeIdx, 10);
        NPCSystem.executeTrade(npcId, idx);
        // Refresh modal to update trade availability
        this._render(npcId);
      });
    }

    // W-6: Dispatch button
    const dispatchBtn = document.getElementById('npc-dispatch-btn');
    if (dispatchBtn) {
      dispatchBtn.addEventListener('click', () => {
        EventBus.emit('npcDispatchForage', { npcId });
        this._close();
      });
    }

    // Heal companion button (V-5)
    const healBtn = document.getElementById('npc-heal-btn');
    if (healBtn) {
      healBtn.addEventListener('click', () => {
        // Prefer first_aid_kit (30hp), then bandage (15hp)
        const hasFAK    = (GameState.countOnBoard?.('first_aid_kit') ?? 0) > 0;
        const itemId    = hasFAK ? 'first_aid_kit' : 'bandage';
        const healAmt   = hasFAK ? 30 : 15;
        // Consume one unit
        const cards = GameState.getBoardCards?.() ?? [];
        for (const card of cards) {
          if (card.definitionId !== itemId) continue;
          if ((card.quantity ?? 1) <= 1) {
            GameState.removeCardInstance(card.instanceId);
          } else {
            card.quantity -= 1;
          }
          break;
        }
        NPCSystem.healCompanion(npcId, healAmt);
        EventBus.emit('boardChanged', {});
        this._render(npcId);
      });
    }

    // Wound heal button (부상 군인 치료)
    const woundHealBtn = document.getElementById('npc-wound-heal-btn');
    if (woundHealBtn) {
      woundHealBtn.addEventListener('click', () => {
        const state = NPCSystem.getNPCState(npcId);
        const npcDef = NPCSystem.getNPCDef(npcId);
        if (!state || !npcDef) return;
        const healItemId = npcDef.woundHealItem;
        const healQty    = npcDef.woundHealQty ?? 2;
        // 재료 소모
        let remaining = healQty;
        for (const card of (GameState.getBoardCards?.() ?? [])) {
          if (remaining <= 0) break;
          if (card.definitionId !== healItemId) continue;
          const qty = card.quantity ?? 1;
          if (qty <= remaining) {
            remaining -= qty;
            GameState.removeCardInstance(card.instanceId);
          } else {
            card.quantity = qty - remaining;
            remaining = 0;
          }
        }
        // 부상 단계 감소 + trust 증가
        state.woundLevel = Math.max(0, (state.woundLevel ?? 0) - 1);
        const oldTrust = state.trust ?? 0;
        state.trust = Math.min(5, oldTrust + 1);
        SkillSystem.gainXp('medicine', 3);
        EventBus.emit('npcTrustChanged', { npcId, oldTrust, newTrust: state.trust });
        EventBus.emit('boardChanged', {});
        if (state.woundLevel <= 0) {
          // 완치 → 동료 가능 상태로 변경
          state.healed = true;
          const comp = npcDef.companion;
          if (comp) comp.canRecruit = true;
          EventBus.emit('notify', { message: `🩹 ${I18n.itemName(npcId, NPC_ITEMS[npcId]?.name)}의 부상이 완치되었습니다!`, type: 'good' });
          // 간호사 퀘스트 진행 체크
          EventBus.emit('npcWoundHealed', { npcId });
          EventBus.emit('npcHealed',      { npcId });
        } else {
          EventBus.emit('notify', { message: `🩹 부상 치료 (${state.woundLevel + 1}단계 → ${state.woundLevel}단계)`, type: 'info' });
        }
        this._render(npcId);
      });
    }

  },

  _handleKeys(e, container, close) {
    // 공용 ModalManager의 키 처리까지 전달되면 뒤에 남은 모달도 닫히므로 capture 단계에서 소유한다.
    if (e.key !== 'Escape' && e.key !== 'Tab') return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') { e.preventDefault(); close?.(); return; }
    const elements = [...container.querySelectorAll(FOCUSABLE)];
    const first = elements[0];
    const last = elements.at(-1);
    if (!first) { e.preventDefault(); return; }
    if (!container.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) {
      e.preventDefault(); (e.shiftKey ? last : first).focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  },

  _close() {
    if (!this._overlay?.classList.contains('open')) return;
    this._overlay.classList.remove('open');
    this._box.innerHTML = '';
    document.removeEventListener('keydown', this._keyHandler, true);
    this._keyHandler = null;
    const dilemma = document.getElementById('dilemma-overlay');
    if (dilemma) {
      // 명령 실행으로 강제 선택이 열린 경우, 그 선택이 끝난 뒤 원래 화면으로 복귀시킨다.
      dilemma._previousModalOpen = this._previousModalOpen;
      dilemma._previousFocus = this._previousFocus;
    } else {
      this._previousFocus?.isConnected && this._previousFocus.focus();
    }
    GameState.ui.modalOpen = !!dilemma || this._previousModalOpen;
    this._previousFocus = null;
  },

  // ── W-3: Dilemma Modal ─────────────────────────────────────────

  _showDilemma({ dilemmaId, title, body, choices, onChoice }) {
    // Create overlay
    const existing = document.getElementById('dilemma-overlay');
    if (existing) { existing._cleanup?.(); existing.remove(); }
    const previousFocus = document.activeElement;
    const previousModalOpen = GameState.ui.modalOpen;
    GameState.ui.modalOpen = true;

    const overlay = document.createElement('div');
    overlay.id        = 'dilemma-overlay';
    overlay.className = 'dilemma-overlay';
    overlay._previousModalOpen = previousModalOpen;
    overlay._previousFocus = previousFocus;

    const choicesHtml = choices.map(c => `
      <button class="dilemma-choice-btn" data-choice="${c.id}">
        ${c.label}
        ${c.effect?.memo ? `<div class="dilemma-choice-memo">${c.effect.memo}</div>` : ''}
      </button>
    `).join('');

    overlay.innerHTML = `
      <div class="dilemma-modal" role="dialog" aria-modal="true" aria-labelledby="npc-dilemma-title">
        <div id="npc-dilemma-title" class="dilemma-title">⚠️ ${title}</div>
        <div class="dilemma-body">${body}</div>
        <div class="dilemma-choices">${choicesHtml}</div>
      </div>
    `;

    document.getElementById('app')?.appendChild(overlay);
    const keyHandler = e => this._handleKeys(e, overlay, null);
    document.addEventListener('keydown', keyHandler, true);
    overlay._cleanup = () => {
      document.removeEventListener('keydown', keyHandler, true);
      GameState.ui.modalOpen = overlay._previousModalOpen;
      if (overlay._previousFocus?.isConnected) overlay._previousFocus.focus();
    };
    overlay.querySelector('button')?.focus();

    // Bind choice buttons (no close-on-bg-click — must choose)
    overlay.querySelectorAll('.dilemma-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceId = btn.dataset.choice;
        overlay._cleanup();
        overlay.remove();
        onChoice?.(choiceId);
      });
    });
  },
};

export default NPCDialogueModal;
