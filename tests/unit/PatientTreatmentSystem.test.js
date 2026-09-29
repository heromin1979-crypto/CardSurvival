import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import TickEngine from '../../js/core/TickEngine.js';
import SkillSystem from '../../js/systems/SkillSystem.js';
import NPCSystem from '../../js/systems/NPCSystem.js';
import Intake from '../../js/systems/PatientIntakeSystem.js';
import Treatment from '../../js/systems/PatientTreatmentSystem.js';
import NPCS from '../../js/data/npcs.js';
import POOL from '../../js/data/patientPool.js';
import PROFILES from '../../js/data/treatmentProfiles.js';
import DragDrop from '../../js/board/DragDrop.js';
import TouchDrag from '../../js/board/TouchDrag.js';
import GameData from '../../js/data/GameData.js';
import { validateTreatmentProfiles } from '../../js/data/validate.js';

let seq;
function card(definitionId, quantity = 1, durability = 100) {
  const instanceId = `test_${seq++}`;
  const c = { instanceId, definitionId, quantity, durability };
  GameState.cards[instanceId] = c;
  GameState.board.middle.push(instanceId);
  return c;
}
function admit(npcId) {
  const state = { spawned: true, dismissed: false, woundLevel: NPCS[npcId].woundLevel, trust: 0, hp: 100 };
  GameState.npcs.states[npcId] = state;
  if (POOL[npcId]) {
    Intake._admitted.push(npcId);
    Intake._patientMeta[npcId] = { admissionTP: 0, hp: 100 };
  }
  return state;
}
beforeEach(() => {
  seq = 0;
  EventBus._listeners = {};
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: [], bottom: [] };
  GameState.pendingLoot = [];
  GameState.npcs = { states: {} };
  GameState.companions = [];
  GameState.location = { currentDistrict: 'dongjak', currentLandmark: 'dongjak', installedStructures: {} };
  GameState.time = { day: 21, totalTP: 0, tpInDay: 0 };
  GameState.stats = { morale: { current: 50, max: 100 } };
  GameState.flags = {};
  GameState.player.characterId = 'doctor';
  Intake._reset(); Intake.init();
  SystemRegistry.register('PatientIntakeSystem', Intake);
  SystemRegistry.register('NPCSystem', NPCSystem);
  vi.spyOn(SkillSystem, 'gainXp').mockImplementation(() => {});
  vi.spyOn(TickEngine, 'skipTP').mockImplementation(n => { GameState.time.totalTP += n; EventBus.emit('tpAdvance', {}); });
  vi.spyOn(GameState, '_compactRow').mockImplementation(() => {});
  vi.spyOn(GameState, '_updateEncumbrance').mockImplementation(() => {});
  vi.spyOn(GameState, 'flushPendingLoot').mockImplementation(() => {});
});
afterEach(() => { Intake._reset(); vi.restoreAllMocks(); });

describe('단일 환자 치료 실행', () => {
  it.each(Object.keys(POOL))('실제 풀 %s는 정의 보정 없이 치료 경로가 있다', npcId => {
    expect(POOL[npcId].woundHealItem).toBeUndefined();
    admit(npcId);
    expect(Treatment.inspect(npcId).actions.length).toBeGreaterThan(0);
    expect(NPCSystem.getDialogue(npcId)).toBe(POOL[npcId].admissionDialogue);
  });
  it.each(Object.keys(POOL).filter(id => !POOL[id].treatmentProfile))('기존 풀 %s의 붕대 폴백을 실제로 완치한다', npcId => {
    const state = admit(npcId);
    card('bandage', state.woundLevel);
    const completed = vi.fn(); EventBus.on('npcWoundHealed', completed);
    while (state.woundLevel > 0) expect(Treatment.treat(npcId, 'bandage').ok).toBe(true);
    expect(completed).toHaveBeenCalledOnce();
    expect(GameState.countOnBoard('bandage')).toBe(0);
  });
  it('환자 데이터 검증은 없는 사례·물품과 잘못된 단계 순서를 거부한다', () => {
    expect(validateTreatmentProfiles(PROFILES, POOL, GameData.items)).toEqual([]);
    const invalid = JSON.parse(JSON.stringify(PROFILES));
    invalid.dehydration.stages[0].id = 'unknown';
    invalid.dehydration.stages[1].actions[0].items[0].definitionId = 'missing_item';
    const errors = validateTreatmentProfiles(invalid, { test: { treatmentProfile: 'missing' } }, GameData.items);
    expect(errors).toHaveLength(3);
  });
  it('풀 환자는 병원에 있을 때 표시·치료되며 외부에서는 진료할 수 없다', () => {
    const id = 'patient_kim_minseo_11'; admit(id); card('bandage', 3);
    expect(NPCSystem.getVisibleNPCs().map(n => n.npcId)).toContain(id);
    GameState.location.currentLandmark = null; GameState.location.currentDistrict = 'junggoo';
    expect(Treatment.treat(id, 'bandage').ok).toBe(false);
    expect(GameState.countOnBoard('bandage')).toBe(3);
    expect(NPCSystem.getVisibleNPCs().map(n => n.npcId)).not.toContain(id);
  });
  it('간호사 대행은 기존 입원 타이머를 계속 보호한다', () => {
    const id = 'patient_kim_minseo_11'; admit(id);
    GameState.location.currentLandmark = null;
    GameState.npcs.states.npc_nurse = { spawned: true };
    GameState.time.totalTP = 100; Intake._tickTimers();
    expect(Intake.getPatientMeta(id)).toEqual({ admissionTP: 100, hp: 100 });
    expect(Intake.getActivePatients()).toContain(id);
  });
  it('조회와 실패는 상태·재료·시간을 바꾸지 않는다', () => {
    admit('npc_wounded_soldier');
    const before = JSON.stringify([GameState.npcs, GameState.cards, GameState.time]);
    Treatment.inspect('npc_wounded_soldier'); Treatment.inspect('npc_wounded_soldier');
    expect(Treatment.treat('npc_wounded_soldier', 'bandage').ok).toBe(false);
    expect(JSON.stringify([GameState.npcs, GameState.cards, GameState.time])).toBe(before);
    expect(TickEngine.skipTP).not.toHaveBeenCalled();
  });
  it.each([DragDrop, TouchDrag])('입력 어댑터가 첫 군인을 붕대 3개로 완치한다', adapter => {
    const state = admit('npc_wounded_soldier');
    const target = card('npc_wounded_soldier');
    const bandage = card('bandage', 3);
    const complete = vi.fn(); const hpHeal = vi.fn();
    EventBus.on('npcWoundHealed', complete); EventBus.on('npcHealed', hpHeal);
    for (let i = 0; i < 3; i++) expect(adapter._tryWoundHeal(bandage.instanceId, target.instanceId)).toBe(true);
    expect(state.healed).toBe(true); expect(state.trust).toBe(3);
    expect(complete).toHaveBeenCalledOnce(); expect(hpHeal).not.toHaveBeenCalled();
    expect(Treatment.treat('npc_wounded_soldier', 'bandage').ok).toBe(false);
    expect(complete).toHaveBeenCalledOnce(); expect(TickEngine.skipTP).not.toHaveBeenCalled();
  });
  it('초기 경상 풀 환자는 붕대 치료로 기여를 한 번 지급한다', () => {
    const id = Object.keys(POOL).find(id => !POOL[id].treatmentProfile && !POOL[id].altContributions?.length);
    const state = admit(id); card('bandage', state.woundLevel);
    const cured = vi.fn(); EventBus.on('patientCured', cured);
    while (!state.healed) expect(Treatment.treat(id, 'bandage').ok).toBe(true);
    expect(Intake.getRescuedRoster()).toContain(id); expect(cured).toHaveBeenCalledOnce();
    expect(Treatment.treat(id, 'bandage').ok).toBe(false);
  });
  it('분할 스택을 합산하고 안정화 후 48TP 퇴원·악화를 멈춘다', () => {
    const id = 'patient_yoon_taehyun_27'; admit(id);
    expect(Treatment.treat(id, 'diagnose').ok).toBe(true);
    card('bandage'); card('bandage');
    expect(Treatment.treat(id, 'stabilize').ok).toBe(true);
    expect(GameState.countOnBoard('bandage')).toBe(0);
    GameState.time.totalTP = 100; Intake._tickTimers();
    expect(Intake.getActivePatients()).toContain(id);
    expect(Intake.getPatientMeta(id).hp).toBe(100);
  });
  it('수술대 처치는 파손·다른 구역 설비를 거부하고 현재 구역 정상 설비에서만 소비한다', () => {
    const id = 'patient_yoon_taehyun_27'; const state = admit(id);
    state.treatment = { stageIndex: 2, stabilized: true };
    card('surgical_anesthetic'); card('gauze');
    const facility = card('field_surgery_station', 1, 0);
    GameState.location.installedStructures.junggoo = { id: 'field_surgery_station', durability: 100 };
    expect(Treatment.treat(id, 'surgery').ok).toBe(false);
    expect(GameState.countOnBoard('surgical_anesthetic')).toBe(1);
    facility.durability = 100;
    expect(Treatment.treat(id, 'surgery').stage).toBe('recovery');
    expect(GameState.countOnBoard('surgical_anesthetic')).toBe(0);
    expect(GameState.countOnBoard('sterile_kit')).toBe(0);
  });
  it.each(['sterile_kit', 'surgery_kit'])('현장 대안은 %s 도구를 보존하고 마취제를 소비한다', tool => {
    const id = 'patient_yoon_taehyun_27'; const state = admit(id);
    state.treatment = { stageIndex: 2, stabilized: true };
    card('medical_station'); card(tool); card('anesthetic'); card('antiseptic', 2);
    expect(Treatment.treat(id, tool === 'sterile_kit' ? 'field_surgery' : 'emergency_surgery').ok).toBe(true);
    expect(GameState.countOnBoard(tool)).toBe(1); expect(GameState.countOnBoard('anesthetic')).toBe(0);
  });
  it.each(['broad_antibiotic', 'purified_medicine'])('제작 약품 %s를 실제 감염 사례에서 소비한다', definitionId => {
    const id = 'patient_park_jiyoung_42'; const state = admit(id);
    state.treatment = { stageIndex: 2, stabilized: true };
    card('medical_station'); card(definitionId);
    if (definitionId === 'purified_medicine') card('gauze');
    const used = vi.fn(); EventBus.on('itemUsed', used);
    expect(Treatment.treat(id, definitionId).stage).toBe('recovery');
    expect(GameState.countOnBoard(definitionId)).toBe(0);
    expect(used).toHaveBeenCalledWith({ definitionId, qty: 1, npcId: id });
    expect(state.healed).not.toBe(true);
  });
  it.each(['patient_lee_junho_16', 'patient_park_jiyoung_42', 'patient_yoon_taehyun_27'])('%s는 회복 확인 전 완치 이벤트를 내지 않는다', id => {
    const state = admit(id); const cured = vi.fn(); EventBus.on('npcWoundHealed', cured);
    const profile = PROFILES[POOL[id].treatmentProfile];
    for (const stage of profile.stages) {
      const action = stage.actions[0];
      for (const item of action.items) card(item.definitionId, item.qty);
      if (action.facilities.length) card(action.facilities[0]);
      for (const tool of action.tools) card(tool);
      expect(Treatment.treat(id, action.id).ok).toBe(true);
      if (stage.id !== 'recovery') expect(cured).not.toHaveBeenCalled();
    }
    expect(state.healed).toBe(true); expect(cured).toHaveBeenCalledOnce();
  });
  it('퇴장·사망 환자는 남은 상태로 치료하거나 재등장하지 못한다', () => {
    for (const [id, remove] of [['patient_lee_junho_16', '_departPatient'], ['patient_yoon_taehyun_27', '_killPatient']]) {
      admit(id); card(id); Intake[remove](id);
      expect(Treatment.inspect(id).ok).toBe(false); expect(NPCSystem.forceSpawn(id)).toBe(false);
      expect(GameState.countOnBoard(id)).toBe(0);
    }
  });
  it('초반 직업 모두 고급 사례가 무작위 유입되지 않는다', () => {
    GameState.time.day = 3;
    for (const career of ['doctor', 'soldier', 'chef']) for (let i = 0; i < 50; i++) {
      expect(POOL[Intake._rollPersona(career)].treatmentProfile).toBeUndefined();
    }
  });
  it('HP 회복 이벤트는 입원 기여를 지급하지 않는다', () => {
    const id = 'patient_kim_minseo_11'; admit(id);
    EventBus.emit('npcHealed', { npcId: id });
    expect(Intake.getActivePatients()).toContain(id); expect(Intake.getRescuedRoster()).toEqual([]);
  });
  it('저장 복원으로 치료 단계와 첫 군인의 영입 자격을 보존한다', () => {
    const id = 'patient_lee_junho_16'; admit(id); Treatment.treat(id, 'diagnose');
    const soldier = admit('npc_wounded_soldier'); card('bandage', 3);
    for (let i = 0; i < 3; i++) Treatment.treat('npc_wounded_soldier', 'bandage');
    const original = NPCS.npc_wounded_soldier.companion.canRecruit;
    const snapshot = GameState.serialize();
    Intake._reset(); Intake.init();
    GameState.npcs.states = {}; GameState.deserialize(snapshot);
    expect(Treatment.inspect(id).stage).toBe('stabilization');
    expect(Intake.getActivePatients()).toContain(id);
    expect(Intake.getPatientMeta(id)).toEqual({ admissionTP: 0, hp: 100 });
    expect(NPCSystem.canRecruit('npc_wounded_soldier')).toBe(true);
    expect(NPCS.npc_wounded_soldier.companion.canRecruit).toBe(original);
    expect(soldier.healed).toBe(true);
  });
  it('완치 기여 선택 대기와 후원 지급 횟수는 새 시스템 초기화 후 복원된다', () => {
    const id = 'patient_lee_junho_16'; const state = admit(id);
    state.treatment = { stageIndex: 3, stabilized: true }; card('medical_station');
    Treatment.treat(id, 'recover');
    const save = GameState.serialize(); Intake._reset(); Intake.init(); GameState.deserialize(save);
    expect(Intake.getPendingChoice(id)).toBeTruthy();
    expect(Intake.chooseContribution(id, 1)).toBe(true);
    const remaining = Intake.getRescuedInfo(id).recurring.remaining;
    const afterChoice = GameState.serialize(); Intake._reset(); Intake.init(); GameState.deserialize(afterChoice);
    expect(Intake.getRescuedInfo(id).recurring.remaining).toBe(remaining);
    expect(Intake.chooseContribution(id, 1)).toBe(false);
    expect(Treatment.treat(id, 'recover').ok).toBe(false);
  });
  it('구버전은 살아 있는 부상자만 복원하고 완치·사망 보상을 다시 지급하지 않는다', () => {
    admit('patient_kim_minseo_11');
    const recovered = admit('patient_lee_junho_16'); recovered.healed = true; recovered.woundLevel = 0;
    const departed = admit('patient_yoon_taehyun_27'); departed.dismissed = true;
    const dead = admit('patient_park_jiyoung_42'); dead.patientUnavailable = true;
    const save = JSON.parse(GameState.serialize()); delete save.patientIntake;
    Intake._reset(); Intake.init(); GameState.deserialize(JSON.stringify(save));
    expect(Intake.getActivePatients()).toEqual(['patient_kim_minseo_11']);
    expect(Intake.getRescuedRoster()).toEqual(['patient_lee_junho_16']);
    expect(GameState.pendingLoot).toEqual([]);
  });
  it('외부 습격 사망 이벤트도 진료 자격을 제거하고 새 게임은 저장 상태를 비운다', () => {
    const id = 'patient_kim_minseo_11'; admit(id);
    EventBus.emit('patientDied', { npcId: id });
    expect(Treatment.inspect(id).ok).toBe(false); expect(Intake.getActivePatients()).toEqual([]);
    admit('patient_lee_junho_16');
    GameState.resetForNewGame();
    const saved = JSON.parse(GameState.serialize());
    expect(saved.patientIntake.admitted).toEqual([]);
    expect(saved.patientIntake.rescued).toEqual({});
    expect(saved.patientIntake.pendingChoiceIds).toEqual([]);
  });
});
