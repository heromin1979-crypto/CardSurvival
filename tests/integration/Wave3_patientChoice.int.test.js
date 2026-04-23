// === W3-1 통합 테스트 — 환자 기여 선택권 end-to-end ===
// 목적: 실제 EventBus 이벤트 전파 + SystemRegistry 연결부 검증.
//   - npcHealed 이벤트 → PatientIntakeSystem._onNpcHealed
//   - altContributions 있는 환자 → contributionChoiceNeeded 이벤트 발행
//   - chooseContribution(npcId, index) → _rescued 이동 + 외부 시스템(DispatchSystem/GuardSystem) register 호출
//   - primary vs alt 선택 시 type 분기 확인
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import SystemRegistry      from '../../js/core/SystemRegistry.js';
import PatientIntakeSystem from '../../js/systems/PatientIntakeSystem.js';

const TEST_NPC_ID = 'patient_lee_junho_16';  // primary=dispatch, alt[0]=sponsor

function resetEventBus() {
  EventBus._listeners = {};
}

function resetSystemRegistry() {
  // SystemRegistry 내부는 module-level const이므로 직접 리셋 불가
  // register는 덮어쓰기 가능 → 각 테스트가 필요한 stub만 덮어쓴다
}

function resetGameState() {
  GameState.time.day   = 1;
  GameState.time.totalTP = 0;
  GameState.pendingLoot = [];
}

function setupPatientAdmitted(npcId) {
  PatientIntakeSystem._admitted = [npcId];
  PatientIntakeSystem._patientMeta = {
    [npcId]: { admissionTP: 0, hp: 60 },
  };
  PatientIntakeSystem._rescued = {};
  PatientIntakeSystem._pendingChoices = {};
}

describe('W3-1 통합 — npcHealed → contributionChoiceNeeded 이벤트 전파', () => {
  beforeEach(() => {
    resetEventBus();
    resetGameState();
    PatientIntakeSystem.init();
    setupPatientAdmitted(TEST_NPC_ID);
  });

  it('altContributions가 있는 환자 → contributionChoiceNeeded 이벤트가 발행된다', () => {
    const listener = vi.fn();
    EventBus.on('contributionChoiceNeeded', listener);

    EventBus.emit('npcHealed', { npcId: TEST_NPC_ID });

    expect(listener).toHaveBeenCalledTimes(1);
    const payload = listener.mock.calls[0][0];
    expect(payload.npcId).toBe(TEST_NPC_ID);
    expect(payload.options).toBeInstanceOf(Array);
    expect(payload.options.length).toBe(2);   // primary + 1 alt
    expect(payload.options[0].type).toBe('dispatch');  // primary
    expect(payload.options[1].type).toBe('sponsor');   // alt[0]
  });

  it('pendingChoice 상태로 전환되고 _admitted에는 남아있다 (rescue 지연)', () => {
    EventBus.emit('npcHealed', { npcId: TEST_NPC_ID });

    expect(PatientIntakeSystem.getPendingChoice(TEST_NPC_ID)).toBeDefined();
    expect(PatientIntakeSystem._admitted).toContain(TEST_NPC_ID);
    expect(PatientIntakeSystem._rescued[TEST_NPC_ID]).toBeUndefined();
  });

  it('비환자 NPC npcHealed는 무시된다 (no-op)', () => {
    const listener = vi.fn();
    EventBus.on('contributionChoiceNeeded', listener);

    EventBus.emit('npcHealed', { npcId: 'unknown_npc_999' });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('W3-1 통합 — chooseContribution 외부 시스템 등록', () => {
  let dispatchRegister, guardRegister;

  beforeEach(() => {
    resetEventBus();
    resetGameState();

    // SystemRegistry에 stub 등록
    dispatchRegister = vi.fn();
    guardRegister    = vi.fn();
    SystemRegistry.register('DispatchSystem', { register: dispatchRegister });
    SystemRegistry.register('GuardSystem',    { register: guardRegister });

    PatientIntakeSystem.init();
    setupPatientAdmitted(TEST_NPC_ID);
    EventBus.emit('npcHealed', { npcId: TEST_NPC_ID });
  });

  it('index=0 (primary) 선택 → dispatch type → DispatchSystem.register 호출', () => {
    const ok = PatientIntakeSystem.chooseContribution(TEST_NPC_ID, 0);
    expect(ok).toBe(true);

    const rescued = PatientIntakeSystem._rescued[TEST_NPC_ID];
    expect(rescued).toBeDefined();
    expect(rescued.type).toBe('dispatch');
    expect(rescued.assignment?.status).toBe('idle');

    expect(dispatchRegister).toHaveBeenCalledTimes(1);
    expect(dispatchRegister.mock.calls[0][0]).toBe(TEST_NPC_ID);

    // _admitted에서 제거되어야 함
    expect(PatientIntakeSystem._admitted).not.toContain(TEST_NPC_ID);
    // pending choice 소거
    expect(PatientIntakeSystem.getPendingChoice(TEST_NPC_ID)).toBeNull();
  });

  it('index=1 (alt) 선택 → sponsor type → recurring 스케줄링', () => {
    const ok = PatientIntakeSystem.chooseContribution(TEST_NPC_ID, 1);
    expect(ok).toBe(true);

    const rescued = PatientIntakeSystem._rescued[TEST_NPC_ID];
    expect(rescued.type).toBe('sponsor');
    expect(rescued.recurring).toBeDefined();
    expect(rescued.recurring.intervalDays).toBe(4);
    expect(rescued.recurring.maxCount).toBe(5);
    expect(rescued.recurring.remaining).toBe(5);

    // sponsor는 DispatchSystem/GuardSystem 미호출
    expect(dispatchRegister).not.toHaveBeenCalled();
    expect(guardRegister).not.toHaveBeenCalled();
  });

  it('잘못된 index (9) 선택 → 실패 반환, _rescued 변화 없음', () => {
    const ok = PatientIntakeSystem.chooseContribution(TEST_NPC_ID, 9);
    expect(ok).toBe(false);
    expect(PatientIntakeSystem._rescued[TEST_NPC_ID]).toBeUndefined();
    // pending은 아직 남아있음
    expect(PatientIntakeSystem.getPendingChoice(TEST_NPC_ID)).toBeDefined();
  });

  it('pending choice 없는 npcId에 chooseContribution → false 반환', () => {
    const ok = PatientIntakeSystem.chooseContribution('no_such_npc', 0);
    expect(ok).toBe(false);
  });
});

describe('W3-1 통합 — patientCured 이벤트 발행', () => {
  beforeEach(() => {
    resetEventBus();
    resetGameState();
    SystemRegistry.register('DispatchSystem', { register: vi.fn() });
    PatientIntakeSystem.init();
    setupPatientAdmitted(TEST_NPC_ID);
    EventBus.emit('npcHealed', { npcId: TEST_NPC_ID });
  });

  it('chooseContribution 완료 시 patientCured 이벤트가 발행된다', () => {
    const listener = vi.fn();
    EventBus.on('patientCured', listener);

    PatientIntakeSystem.chooseContribution(TEST_NPC_ID, 0);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].npcId).toBe(TEST_NPC_ID);
    expect(listener.mock.calls[0][0].type).toBe('dispatch');
  });

  it('immediate 아이템이 pendingLoot에 추가된다 (herb_seed × 1)', () => {
    const before = GameState.pendingLoot.length;
    PatientIntakeSystem.chooseContribution(TEST_NPC_ID, 1);  // alt sponsor

    expect(GameState.pendingLoot.length).toBeGreaterThan(before);
    const hasHerbSeed = GameState.pendingLoot.some(p => p.definitionId === 'herb_seed');
    expect(hasHerbSeed).toBe(true);
  });
});
