import GameState from '../core/GameState.js';
import { getCareerFacilities } from '../data/careerProjects.js';
import EventBus from '../core/EventBus.js';
import SystemRegistry from '../core/SystemRegistry.js';
import TickEngine from '../core/TickEngine.js';
import AutoSave from '../persistence/AutoSave.js';
import SkillSystem from './SkillSystem.js';
import NPCS from '../data/npcs.js';
import PATIENT_POOL from '../data/patientPool.js';
import PROFILES from '../data/treatmentProfiles.js';
import GameData from '../data/GameData.js';
import { providesTool } from './toolProvision.js';

const name = id => GameData.items[id]?.name ?? id;
const PatientTreatmentSystem = {
  inspect(npcId) {
    const state = GameState.npcs?.states?.[npcId];
    const def = NPCS[npcId];
    const invalid = reason => ({ ok: false, reason, actions: [], stage: state?.healed ? 'healed' : null });
    if (!def || !state || !state.spawned || state.dismissed || state.patientUnavailable) return invalid('진료 가능한 환자가 아닙니다.');
    if (state.healed || (state.woundLevel ?? 0) <= 0) return invalid('이미 완치되었습니다.');
    if (!PATIENT_POOL[npcId] && !def.woundHealItem) return invalid('치료 대상이 아닙니다.');
    const intake = SystemRegistry.get('PatientIntakeSystem');
    if (PATIENT_POOL[npcId] && intake && !intake.getActivePatients().includes(npcId)) return invalid('입원 중인 환자가 아닙니다.');
    if (PATIENT_POOL[npcId] && intake && !intake._isAtHospital()) return invalid('환자가 입원한 보라매병원에서 진료하세요.');
    const profile = PROFILES[def.treatmentProfile];
    const index = state.treatment?.stageIndex ?? 0;
    const phase = profile?.stages[index];
    if (profile && !phase) return invalid('치료 단계가 유효하지 않습니다.');
    const stage = phase?.id ?? 'treatment';
    const rawActions = phase?.actions ?? [{ id: 'bandage', label: '부상 치료', items: [{ definitionId: def.woundHealItem ?? 'bandage', qty: def.woundHealQty ?? 1 }], facilities: [], tools: [], tpCost: 0 }];
    const board = [...GameState.getBoardCards(), ...getCareerFacilities(GameState)];
    const installed = GameState.location?.installedStructures?.[GameState.location?.currentDistrict];
    const available = [...board, ...(installed?.id ? [{ definitionId: installed.id, durability: installed.durability }] : [])];
    const working = id => available.some(c => (c.durability ?? 100) > 0 && providesTool(c.definitionId, id));
    const actions = rawActions.map(action => {
      const missing = action.items.filter(r => GameState.countOnBoard(r.definitionId) < r.qty).map(r => `${name(r.definitionId)} ×${r.qty}`);
      if (action.facilities.length && !action.facilities.some(working)) missing.push(`설비: ${action.facilities.map(name).join(' / ')}`);
      for (const tool of action.tools) if (!working(tool)) missing.push(`도구: ${name(tool)}`);
      return { ...action, ok: missing.length === 0, missing, reason: missing.length ? `필요: ${missing.join(', ')}` : null };
    });
    return { ok: true, stage, stageLabel: phase?.label ?? '부상 치료', profile: def.treatmentProfile ?? null, actions };
  },

  actionForItem(npcId, definitionId) {
    return this.inspect(npcId).actions.find(a => a.items.some(r => r.definitionId === definitionId))?.id ?? null;
  },

  treat(npcId, actionId) {
    const inspection = this.inspect(npcId);
    if (!inspection.ok) return { ok: false, reason: inspection.reason };
    const action = inspection.actions.find(a => a.id === actionId);
    if (!action || !action.ok) return { ok: false, reason: action?.reason ?? '현재 단계에서 할 수 없는 처치입니다.' };
    return AutoSave.deferUntilComplete(() => {
      const state = GameState.npcs.states[npcId];
      const def = NPCS[npcId];
      // 모든 입력 경로가 사전 검증 후 같은 보드 스택을 소비한다.
      const cards = GameState.getBoardCards();
      for (const req of action.items) {
        let remaining = req.qty;
        for (const card of cards) {
          if (!remaining || card.definitionId !== req.definitionId) continue;
          const used = Math.min(remaining, card.quantity ?? 1);
          remaining -= used;
          card.quantity = (card.quantity ?? 1) - used;
          if (card.quantity === 0) GameState.removeCardInstanceSilent(card.instanceId);
        }
      }
      const previousStage = inspection.stage;
      let stage;
      if (inspection.profile) {
        const stageIndex = (state.treatment?.stageIndex ?? 0) + 1;
        state.treatment = { stageIndex, stabilized: stageIndex >= 2 };
        state.woundDiscovered = true;
        const next = PROFILES[inspection.profile].stages[stageIndex];
        stage = next?.id ?? 'healed';
        state.woundLevel = next ? Math.min(state.woundLevel, Math.max(1, 4 - stageIndex)) : 0;
      } else {
        state.woundLevel = Math.max(0, state.woundLevel - 1);
        stage = state.woundLevel === 0 ? 'healed' : 'treatment';
      }
      // 드래그와 모달 모두 처치당 신뢰 +1, 최대 5로 통일한다.
      const oldTrust = state.trust ?? 0;
      state.trust = Math.min(5, oldTrust + 1);
      if (stage === 'healed') state.healed = true;
      SkillSystem.gainXp('medicine', 3);
      for (const req of action.items) EventBus.emit('itemUsed', { definitionId: req.definitionId, qty: req.qty, npcId });
      EventBus.emit('npcTrustChanged', { npcId, oldTrust, newTrust: state.trust });
      if (previousStage === 'diagnosis') EventBus.emit('npcDiagnosed', { npcId, woundLevel: state.woundLevel });
      EventBus.emit('patientTreatmentChanged', { npcId, actionId, previousStage, stage });
      // HP 회복 이벤트(npcHealed)와 완치 전이를 분리하여 기여·퀘스트 중복을 막는다.
      if (stage === 'healed') EventBus.emit('npcWoundHealed', { npcId, profileId: def.treatmentProfile ?? null });
      if (action.tpCost) TickEngine.skipTP(action.tpCost, '환자 치료');
      GameState.flushPendingLoot();
      EventBus.emit('boardChanged', {});
      EventBus.emit('saveGame');
      return { ok: true, previousStage, stage };
    });
  },
};
export default PatientTreatmentSystem;
