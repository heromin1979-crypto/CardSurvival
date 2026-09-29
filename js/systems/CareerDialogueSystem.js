import GameState from '../core/GameState.js';
import EventBus from '../core/EventBus.js';
import TickEngine from '../core/TickEngine.js';
import AutoSave from '../persistence/AutoSave.js';
import GameData from '../data/GameData.js';
import TOPICS from '../data/careerDialogues.js';
import { NEXT_CAREER_STEPS } from '../data/careerRoutes.js';
import NPCSystem from './NPCSystem.js';
import { SERVABLE_FOOD } from './CareerProjectSystem.js';

const memory = () => GameState.flags.careerDialogues ??= { version: 1, topics: {}, introduced: false, pendingTopic: null };
const stateFor = id => memory().topics[id] ??= { status: 'new', choiceId: null, evidence: false };
const missing = costs => Object.entries(costs).filter(([id, qty]) => GameState.countOnBoard(id) < qty)
  .map(([id, qty]) => `${GameData.items[id]?.name ?? id} ${qty - GameState.countOnBoard(id)}개 부족`);
const unavailable = id => {
  if (id === 'npc_wounded_soldier' && GameState.flags.abandoned_soldier) return true;
  const state = GameState.npcs?.states?.[id];
  return !state?.spawned || state.dismissed || state.hp <= 0 || state.patientUnavailable;
};
function consume(costs) {
  for (const [id, qty] of Object.entries(costs)) {
    let remaining = qty;
    for (const card of GameState.getBoardCards()) {
      if (card.definitionId !== id || !remaining) continue;
      const used = Math.min(remaining, card.quantity ?? 1);
      card.quantity = (card.quantity ?? 1) - used; remaining -= used;
      if (!card.quantity) GameState.removeCardInstanceSilent(card.instanceId);
    }
  }
  GameState._updateEncumbrance();
}
const CareerDialogueSystem = {
  _offs: [],
  init() {
    this._offs.forEach(off => off());
    this._offs = ['patientTreatmentChanged', 'npcWoundHealed', 'craftComplete', 'careerProjectCompleted']
      .map(event => EventBus.on(event, data => this.record(event, data)));
  },
  list() { return Object.values(TOPICS).filter(t => t.characterId === GameState.player.characterId).map(t => ({ ...t, status: memory().topics[t.id]?.status ?? 'new' })); },
  inspect(id) {
    const def = TOPICS[id];
    if (!def || def.characterId !== GameState.player.characterId) return { ok: false, reason: '이 직업의 대화가 아닙니다.' };
    const state = stateFor(id), choice = def.choices.find(c => c.id === state.choiceId);
    const dogAbsent = def.characterId === 'soldier' && unavailable('npc_dog');
    let reason = '';
    if (!GameState.player.isAlive || GameState.combat?.active || ['combat', 'encounter'].includes(GameState.ui.currentState)) reason = '위험 상황을 먼저 마무리하세요.';
    else if (GameState.location.currentDistrict !== def.districtId) reason = `${GameData.districts[def.districtId]?.name ?? def.districtId}에서 이어갈 수 있습니다.`;
    const costs = { ...(state.paid ? {} : choice?.costs) };
    if (def.evidence === 'food' && state.foodId) costs[state.foodId] = (costs[state.foodId] ?? 0) + 1;
    let actionReason = reason || (!choice ? '해결 방법을 먼저 선택하세요.' : state.status === 'completed' ? '이미 마친 약속입니다.' : '');
    if (!actionReason && def.evidence && !state.evidence && !(def.evidence === 'rescueTreatment' && !state.rescued)) actionReason = def.hint;
    if (!actionReason) actionReason = missing(costs).join(', ');
    const speakerPresent = !def.speakerId || !unavailable(def.speakerId);
    return { ok: !reason, reason, def, state, choice, costs, actionReason, speakerPresent, dogAbsent,
      patientAbsent: def.evidence === 'treatment' && unavailable('npc_wounded_soldier') };
  },
  choose(id, choiceId) {
    const info = this.inspect(id);
    if (choiceId === 'later' && info.def) { memory().pendingTopic = null; if (info.state.status !== 'completed') info.state.status = 'deferred'; EventBus.emit('saveGame'); return { ok: true }; }
    if (!info.ok) return { ok: false, reason: info.reason };
    const { def, state } = info;
    if (choiceId === 'ask') { state.asked = true; EventBus.emit('saveGame'); return { ok: true, message: def.hint }; }
    if (choiceId === 'later') { memory().pendingTopic = null; if (state.status !== 'completed') state.status = 'deferred'; EventBus.emit('saveGame'); return { ok: true }; }
    if (state.status === 'completed' || state.paid) return { ok: false, reason: '이미 실행한 선택입니다. 남은 처치를 이어가세요.' };
    const choice = def.choices.find(c => c.id === choiceId);
    if (!choice) return { ok: false, reason: '존재하지 않는 선택입니다.' };
    state.choiceId = choiceId; state.status = 'waiting';
    if (def.evidence === 'project' && GameState.flags.careerProjects?.projects?.[def.projectId]?.active) state.evidence = true;
    memory().pendingTopic = id; EventBus.emit('saveGame');
    return { ok: true, message: `${choice.label}. ${def.evidence ? def.hint : '준비되면 아래 실행 버튼으로 실제 작업을 진행하세요.'}` };
  },
  record(event, payload = {}) {
    for (const def of this.list()) {
      const state = memory().topics[def.id];
      if (!state?.choiceId || state.status === 'completed') continue;
      // 구조 주민 부재 시에는 환자가 있는 구역에서 치료하고 은평으로 돌아와 보고한다.
      const remoteRescueTreatment = def.evidence === 'rescueTreatment' && state.rescued
        && unavailable('npc_early_resident') && event === 'npcWoundHealed';
      if (GameState.location.currentDistrict !== def.districtId && !remoteRescueTreatment) continue;
      let matched = false;
      if (def.evidence === 'treatment' && event === 'npcWoundHealed') {
        matched = payload.npcId === 'npc_wounded_soldier' || unavailable('npc_wounded_soldier') || GameState.npcs.states.npc_wounded_soldier?.healed;
        if (matched) state.patientId = payload.npcId;
      }
      if (def.evidence === 'rescueTreatment' && state.rescued && event === 'npcWoundHealed') {
        matched = payload.npcId === 'npc_early_resident' || unavailable('npc_early_resident');
        if (matched) state.patientId = payload.npcId;
      }
      if (event === 'craftComplete' && ['food', 'water'].includes(def.evidence)) {
        // 스택 합치기로 새 instanceId가 사라져도 성공 제작의 정의는 유지된다.
        const card = (GameData.blueprints[payload.blueprintId]?.output ?? []).find(c => def.evidence === 'food' ? SERVABLE_FOOD.includes(c.definitionId) : c.definitionId === 'boiled_water');
        if (card) { matched = true; if (def.evidence === 'food') state.foodId = card.definitionId; }
      }
      if (def.evidence === 'project' && event === 'careerProjectCompleted') matched = payload.projectId === def.projectId;
      if (matched) { state.evidence = true; EventBus.emit('careerDialogueReady', { topicId: def.id }); EventBus.emit('saveGame'); }
    }
  },
  perform(id) {
    const info = this.inspect(id);
    if (!info.ok || info.actionReason) return { ok: false, reason: info.actionReason || info.reason };
    return AutoSave.deferUntilComplete(() => {
      const { def, state, choice, costs } = info;
      if (!state.paid) {
        consume(costs); state.paid = true;
        if (def.evidence === 'rescueTreatment') {
          state.rescued = true; state.status = 'waiting';
          NPCSystem.forceSpawn('npc_early_resident');
          TickEngine.skipTP(choice.tp, choice.label);
          EventBus.emit('boardChanged'); EventBus.emit('saveGame');
          return { ok: true, message: '주민 김도윤을 출구로 옮겼습니다. 주민 카드에서 붕대로 처치하세요. 주민이 떠났다면 다른 부상자의 실제 치료로 구조 지원을 이어갈 수 있습니다.' };
        }
      }
      state.status = 'completed'; state.completedAt = GameState.time.totalTP;
      memory().pendingTopic = null;
      GameState.pendingLoot.push(...Object.entries(choice.output ?? {}).map(([definitionId, quantity]) => ({ definitionId, quantity, contamination: 0 })));
      GameState.flushPendingLoot();
      if (!state.rescued) TickEngine.skipTP(choice.tp, choice.label);
      let resultText = def.evidence === 'rescueTreatment' && state.patientId !== 'npc_early_resident'
        ? '구조 주민을 다시 만날 수 없어 다른 부상자를 치료하며 구조 지원을 이어갔습니다. 용산 집결 정보가 다음 단서입니다.' : choice.result;
      if (info.dogAbsent && def.characterId === 'soldier') resultText = def.kind === 'core' ? '군견 없이 직접 주변을 살펴 주민을 안전한 통로로 안내했습니다. 용산의 통신 복원이 다음 목표입니다.' : '군견이 없는 경계를 주민과 나누었습니다. 준비한 물자와 시간을 집결지 경계에 썼습니다.';
      if (def.evidence === 'treatment' && state.patientId !== 'npc_wounded_soldier') resultText = '새로 만난 환자에게 실제 처치를 시행했습니다. 다음 소모품은 동작에서 마련하세요.';
      state.resultText = resultText;
      EventBus.emit('careerDialogueCompleted', { topicId: id, characterId: def.characterId, kind: def.kind, choiceId: choice.id, districtId: def.districtId, nextDistrict: def.nextDistrict, resultText, nextHint: NEXT_CAREER_STEPS[def.characterId] });
      EventBus.emit('boardChanged'); EventBus.emit('saveGame');
      return { ok: true, message: resultText };
    });
  },
};
export default CareerDialogueSystem;
