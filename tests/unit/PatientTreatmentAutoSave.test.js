// @vitest-environment happy-dom
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import Registry from '../../js/core/SystemRegistry.js';
import AutoSave from '../../js/persistence/AutoSave.js';
import { AUTOSAVE_SLOT } from '../../js/persistence/SaveManager.js';
import Intake from '../../js/systems/PatientIntakeSystem.js';
import Treatment from '../../js/systems/PatientTreatmentSystem.js';

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(100000);
  const storage = new Map();
  vi.stubGlobal('localStorage', { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) });
  EventBus._listeners = {}; GameState.resetForNewGame();
  GameState.npcs = { states: {} };
  GameState.ui.currentState = 'main';
  GameState.location.currentDistrict = 'dongjak';
  GameState.location.currentLandmark = 'lm_boramae_hospital';
  GameState.player.skills.medicine = { level: 0, xp: 5 };
  Registry.register('PatientIntakeSystem', Intake); Intake.init();
  AutoSave._lastSaveAt = 0; AutoSave._lastSaveTP = 0; AutoSave.init();
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('치료 레벨업 자동저장은 완치 선택·TP까지 저장하고 로드 후 기여를 선택할 수 있다', () => {
  const id = 'patient_lee_junho_16';
  GameState.npcs.states[id] = { spawned: true, woundLevel: 1, treatment: { stageIndex: 3 }, trust: 0 };
  Intake._admitted.push(id); Intake._patientMeta[id] = { hp: 100, admissionTP: 0 };
  const bed = GameState.createCardInstance('medical_bed');
  GameState.placeCardInRow(bed.instanceId, 'bottom');
  const before = GameState.time.totalTP;
  expect(Treatment.treat(id, 'recover').ok).toBe(true);
  expect(GameState.player.skills.medicine.level).toBe(1);
  const saved = JSON.parse(localStorage.getItem(`CARD_SURVIVAL_SAVE_v1_slot${AUTOSAVE_SLOT}`));
  expect(saved.time.totalTP).toBe(before + 1);
  expect(saved.patientIntake.pendingChoiceIds).toContain(id);
  Intake.init(); GameState.deserialize(JSON.stringify(saved));
  expect(Intake.getPendingChoice(id)).toBeTruthy();
  expect(Intake.chooseContribution(id, 1)).toBe(true);
  expect(Intake.getRescuedRoster()).toContain(id);
  expect(Intake.chooseContribution(id, 1)).toBe(false);
});
