// === NPC STORY SYSTEM ===
// W-3: 생사 딜레마 (Sacrifice Dilemma)
// W-4: 역할 전속 (Role Lock — NPC 없으면 특정 행동 불가)
// W-7: NPC 개인 서사 완결 (Personal Story Arc)

import EventBus       from '../core/EventBus.js';
import GameState      from '../core/GameState.js';
import { DILEMMAS }   from '../data/npcDilemmas.js';
import { NPC_ITEMS }  from '../data/npcs.js';
import I18n           from '../core/I18n.js';

// ── Role Lock definitions ───────────────────────────────────────
// Maps action type → required NPC(s). Any one of the listed NPCs satisfies the lock.
const ROLE_LOCKS = {
  craft_advanced:  { required: ['npc_mechanic', 'npc_student'], message: '🔧 정비사나 학생이 있어야 고급 제작이 가능합니다.' },
  treat_disease:   { required: ['npc_nurse'],                   message: '💊 간호사 없이는 질병을 치료할 수 없습니다.' },
  trade_discount:  { required: ['npc_trader'],                  message: '🧳 상인이 있어야 할인 거래가 가능합니다.' },
  night_safe_explore: { required: ['npc_soldier_deserter', 'npc_dog'], message: '🌙 야간 탐색은 탈영병이나 개가 필요합니다.' },
  scent_track:     { required: ['npc_dog'],                     message: '🐕 개 없이는 냄새 추적을 할 수 없습니다.' },
  elder_wisdom:    { required: ['npc_old_survivor'],            message: '👴 노인의 지혜 없이는 고지식이 필요한 작업이 불가능합니다.' },
};

// Personal arc definitions (one per NPC)
const PERSONAL_ARCS = {
  npc_nurse: {
    id:    'arc_nurse_past',
    steps: [
      { type: 'day',     value: 10,  hint: '간호사와 함께 10일을 보내면 과거 이야기를 꺼낸다.' },
      { type: 'trust',   value: 3,   hint: '신뢰도 3 이상이 되면 진짜 속내를 털어놓는다.' },
      { type: 'event',   value: 'diseaseCured', hint: '질병 치료 후 그녀의 의지가 굳어진다.' },
    ],
    completionLine: '"이제 더 이상 도망치지 않을 거야. 살아남는 게 내 사명이야."',
    reward: { trust: 2, skillUnlock: { skillId: 'advanced_treatment', value: 0.2 } },
  },
  npc_soldier_deserter: {
    id:    'arc_soldier_redemption',
    steps: [
      { type: 'day',   value: 15, hint: '탈영병과 함께 15일.' },
      { type: 'event', value: 'combatEnd', hint: '전투 생존 후 과거를 털어놓는다.' },
      { type: 'trust', value: 4,  hint: '신뢰도 4 이상에서 본심을 드러낸다.' },
    ],
    completionLine: '"도망쳤던 게 아니야. 살아남아 속죄하려는 거야."',
    reward: { trust: 2, morale: 20, skillUnlock: { skillId: 'combat_focus', value: 0.15 } },
  },
  npc_old_survivor: {
    id:    'arc_old_memories',
    steps: [
      { type: 'day',   value: 20,  hint: '노인과 함께 20일을 보낸다.' },
      { type: 'trust', value: 3,   hint: '신뢰가 쌓이면 전쟁 이야기를 꺼낸다.' },
    ],
    completionLine: '"살아남는 게 승리야. 자네한테 그 비결을 가르쳐주겠네."',
    reward: { trust: 1, skillUnlock: { skillId: 'survival_instinct', value: 0.1 } },
  },
  npc_child: {
    id:    'arc_child_hope',
    steps: [
      { type: 'day',   value: 30, hint: '아이와 함께 30일을 보낸다.' },
      { type: 'trust', value: 4,  hint: '아이가 마음을 열었다.' },
    ],
    completionLine: '"아저씨랑 있으면 무섭지 않아요. 우리 가족이 된 것 같아요."',
    reward: { trust: 2, morale: 30 },
  },
  npc_dog: {
    id:    'arc_dog_loyalty',
    steps: [
      { type: 'day',   value: 14, hint: '개와 함께 2주를 보낸다.' },
    ],
    completionLine: '개가 꼬리를 힘차게 흔들며 눈을 마주쳤다. 이제 진짜 동반자다.',
    reward: { trust: 1, skillUnlock: { skillId: 'scent_tracking', value: 0.05 } },
  },
  npc_mechanic: {
    id:    'arc_mechanic_workshop',
    steps: [
      { type: 'event', value: 'craftCompleted', hint: '정비사와 함께 제작을 완료한다.' },
      { type: 'trust', value: 3,                hint: '신뢰 3에서 설계도를 공개한다.' },
    ],
    completionLine: '"이 설계도는 내 아버지한테 받은 거야. 자네한테 줄게."',
    reward: { trust: 1, items: [{ id: 'blueprint_adv', qty: 1 }] },
  },
  npc_student: {
    id:    'arc_student_thesis',
    steps: [
      { type: 'event', value: 'exploreCompleted', hint: '탐색을 5회 완료한다.' },
      { type: 'trust', value: 3,                  hint: '학생이 연구 노트를 꺼낸다.' },
    ],
    completionLine: '"이 데이터만 있으면 탈출 경로를 계산할 수 있어. 같이 해보자."',
    reward: { trust: 1, skillUnlock: { skillId: 'pathfinding', value: 0.1 } },
  },
  npc_trader: {
    id:    'arc_trader_network',
    steps: [
      { type: 'trust', value: 3, hint: '상인과 신뢰를 쌓는다.' },
    ],
    completionLine: '"내 연락망을 공유할게. 이제 더 좋은 조건으로 거래할 수 있어."',
    reward: { trust: 1, flags: { tradeNetworkUnlocked: true } },
  },
};

const NPCStorySystem = {

  init() {
    // W-3: Listen for dilemma trigger events
    this._initDilemmaListeners();

    // W-7: Listen for arc-step events
    this._initArcListeners();

    // Per-TP checks
    EventBus.on('tpAdvance', () => this._onTP());
  },

  // ── W-3: Sacrifice Dilemma ─────────────────────────────────────

  _initDilemmaListeners() {
    const triggers = new Set(DILEMMAS.map(d => d.trigger));
    for (const ev of triggers) {
      EventBus.on(ev, (payload) => this._checkDilemmas(ev, payload));
    }
  },

  _checkDilemmas(triggerEvent, _payload) {
    const gs = GameState;
    for (const dilemma of DILEMMAS) {
      if (dilemma.trigger !== triggerEvent) continue;

      // Cooldown check
      const cooldownFlag = `dilemma_cooldown_${dilemma.id}`;
      const lastDay      = gs.flags?.[cooldownFlag] ?? 0;
      if ((gs.time?.day ?? 0) - lastDay < dilemma.cooldownDays) continue;

      // One-time flag
      if (dilemma.setFlag && gs.flags?.[dilemma.setFlag]) continue;

      // Condition check
      if (!dilemma.condition(gs)) continue;

      // Get context (NPC names, etc.)
      const ctx = dilemma.getContext(gs);
      this._showDilemma(dilemma, ctx);

      // Set cooldown
      if (!gs.flags) gs.flags = {};
      gs.flags[cooldownFlag] = gs.time?.day ?? 0;
      break; // Only one dilemma per event
    }
  },

  _showDilemma(dilemma, ctx) {
    const gs   = GameState;
    const npcId = ctx.npcId;
    const npcName = npcId
      ? (I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) ?? npcId)
      : '동반자';

    const body = dilemma.body.replace(/\{npcName\}/g, npcName);
    const choices = dilemma.choices.map(c => ({
      ...c,
      label: c.label.replace(/\{npcName\}/g, npcName),
    }));

    EventBus.emit('showDilemma', {
      dilemmaId: dilemma.id,
      title:     dilemma.title,
      body,
      choices,
      npcId,
      onChoice:  (choiceId) => this._applyDilemmaChoice(dilemma, choiceId, ctx),
    });
  },

  _applyDilemmaChoice(dilemma, choiceId, ctx) {
    const gs     = GameState;
    const choice = dilemma.choices.find(c => c.id === choiceId);
    if (!choice) return;

    const eff    = choice.effect ?? {};
    const npcId  = ctx.npcId;
    const state  = npcId ? gs.npcs?.states?.[npcId] : null;

    if (eff.playerHeal)        gs.modStat?.('hp', eff.playerHeal);
    if (eff.npcHeal && state)  state.hp = Math.min(100, (state.hp ?? 0) + eff.npcHeal);
    if (eff.playerNutrition)   gs.modStat?.('nutrition', eff.playerNutrition);
    if (eff.playerMorale)      gs.modStat?.('morale', eff.playerMorale);
    if (eff.playerHpDelta)     gs.modStat?.('hp', eff.playerHpDelta);
    if (eff.npcNutrition && state) state.hp = Math.min(100, (state.hp ?? 0) + eff.npcNutrition);
    if (eff.groupMoraleDelta)  gs.modStat?.('morale', eff.groupMoraleDelta);

    if (eff.npcTrustDelta && state) {
      state.trust = Math.max(0, Math.min(5, (state.trust ?? 0) + eff.npcTrustDelta));
      EventBus.emit('npcTrustChanged', { npcId, trust: state.trust });
    }
    if (eff.npcEmotion && state) {
      state.emotion = eff.npcEmotion;
      EventBus.emit('npcEmotionSet', { npcId, emotion: eff.npcEmotion });
    }
    if (eff.giveItems) {
      for (const item of eff.giveItems) {
        EventBus.emit('addItemToBoard', { itemId: item.id, qty: item.qty });
      }
    }

    // Special: companion_vs_stranger
    if (eff.saveNpc === 'first' || eff.saveNpc === 'second') {
      const companions = gs.companions ?? [];
      const idx        = eff.saveNpc === 'first' ? 0 : 1;
      const otherIdx   = idx === 0 ? 1 : 0;
      const otherId    = companions[otherIdx];
      if (otherId) {
        const otherState = gs.npcs?.states?.[otherId];
        if (otherState) otherState.hp = Math.max(0, (otherState.hp ?? 50) + eff.otherNpcHpDelta);
      }
    }

    if (dilemma.setFlag && gs.flags) gs.flags[dilemma.setFlag] = true;

    EventBus.emit('dilemmaResolved', { dilemmaId: dilemma.id, choiceId });
  },

  // ── W-4: Role Lock ────────────────────────────────────────────

  /**
   * Check if a role-locked action can be performed.
   * @param {string} actionType — key from ROLE_LOCKS
   * @returns {{ allowed: boolean, reason?: string }}
   */
  canPerformAction(actionType) {
    const lock = ROLE_LOCKS[actionType];
    if (!lock) return { allowed: true };

    const companions = GameState.companions ?? [];
    // Check if any required NPC is present and not dispatched
    for (const npcId of lock.required) {
      const state = GameState.npcs?.states?.[npcId];
      if (companions.includes(npcId) && state && !state.dispatched) {
        return { allowed: true };
      }
    }
    return { allowed: false, reason: lock.message };
  },

  /** Get which NPCs are unlocking which actions */
  getActiveRoleLocks() {
    const companions = GameState.companions ?? [];
    const result = {};
    for (const [action, lock] of Object.entries(ROLE_LOCKS)) {
      const active = lock.required.filter(id =>
        companions.includes(id) && !GameState.npcs?.states?.[id]?.dispatched
      );
      result[action] = { ...lock, activeNpcs: active };
    }
    return result;
  },

  // ── W-7: Personal Story Arc ────────────────────────────────────

  _initArcListeners() {
    // Listen for events that may complete arc steps
    const arcEvents = new Set();
    for (const arc of Object.values(PERSONAL_ARCS)) {
      for (const step of arc.steps) {
        if (step.type === 'event') arcEvents.add(step.value);
      }
    }
    for (const ev of arcEvents) {
      EventBus.on(ev, () => this._checkArcStep('event', ev));
    }
  },

  _onTP() {
    // Check day-based arc steps
    const day = GameState.time?.day ?? 0;
    this._checkArcStep('day', day);
    // Check trust-based arc steps
    for (const npcId of (GameState.companions ?? [])) {
      const trust = GameState.npcs?.states?.[npcId]?.trust ?? 0;
      this._checkArcStep('trust', trust, npcId);
    }
  },

  _checkArcStep(type, value, specificNpcId = null) {
    const gs         = GameState;
    const companions = gs.companions ?? [];

    for (const npcId of companions) {
      if (specificNpcId && npcId !== specificNpcId) continue;

      const arc = PERSONAL_ARCS[npcId];
      if (!arc) continue;

      const arcState = this._ensureArcState(npcId, arc);
      if (arcState.completed) continue;

      const currentStep = arcState.currentStep;
      if (currentStep >= arc.steps.length) continue;

      const step = arc.steps[currentStep];
      if (step.type !== type) continue;

      // Check step condition
      let met = false;
      if (type === 'day')   met = value >= step.value;
      if (type === 'trust') {
        const trust = gs.npcs?.states?.[npcId]?.trust ?? 0;
        met = trust >= step.value;
      }
      if (type === 'event') met = step.value === value;

      if (!met) continue;

      arcState.currentStep += 1;

      // All steps completed?
      if (arcState.currentStep >= arc.steps.length) {
        this._completeArc(npcId, arc, arcState);
      } else {
        // Hint for next step
        const next = arc.steps[arcState.currentStep];
        if (next?.hint) {
          EventBus.emit('notify', {
            message: `📖 ${I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) ?? npcId}: ${next.hint}`,
            type: 'info',
          });
        }
      }
    }
  },

  _completeArc(npcId, arc, arcState) {
    arcState.completed = true;
    const gs    = GameState;
    const state = gs.npcs?.states?.[npcId];
    const name  = I18n.itemName(npcId, NPC_ITEMS[npcId]?.name) ?? npcId;

    EventBus.emit('notify', {
      message: `✨ ${name}의 이야기가 완결됐다: ${arc.completionLine}`,
      type: 'good',
    });
    EventBus.emit('npcArcCompleted', { npcId, arcId: arc.id });

    if (!state) return;
    const reward = arc.reward ?? {};
    if (reward.trust)  { state.trust = Math.min(5, (state.trust ?? 0) + reward.trust); }
    if (reward.morale) gs.modStat?.('morale', reward.morale);
    if (reward.items)  {
      for (const item of reward.items) {
        EventBus.emit('addItemToBoard', { itemId: item.id, qty: item.qty });
      }
    }
    if (reward.skillUnlock) {
      if (!gs.skills) gs.skills = {};
      const { skillId, value } = reward.skillUnlock;
      gs.skills[skillId] = (gs.skills[skillId] ?? 0) + value;
    }
    if (reward.flags) {
      Object.assign(gs.flags ?? {}, reward.flags);
    }
  },

  _ensureArcState(npcId, arc) {
    const gs = GameState;
    if (!gs.npcArcs) gs.npcArcs = {};
    if (!gs.npcArcs[npcId]) {
      gs.npcArcs[npcId] = { arcId: arc.id, currentStep: 0, completed: false };
    }
    return gs.npcArcs[npcId];
  },

  /** Get arc progress for display in dialogue modal */
  getArcProgress(npcId) {
    const arc = PERSONAL_ARCS[npcId];
    if (!arc) return null;
    const state = this._ensureArcState(npcId, arc);
    return {
      arc,
      currentStep: state.currentStep,
      completed:   state.completed,
      hint: state.completed ? arc.completionLine : (arc.steps[state.currentStep]?.hint ?? ''),
    };
  },
};

export default NPCStorySystem;
