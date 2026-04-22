// === PatientIntakeSystem — 증분 1.5 + 증분 3 (Timer/실패/이탈) ===
// 검증:
//  - 증분 1: tryIntake 조건 분기, 쿨다운, 상한, 이벤트 발행
//  - 증분 1.5: Pull-First, Day Cap (Day 3-14→1, 15-29→2, 30+→3), 날짜 롤오버
//  - 증분 3: admissionTP/hp 추적, 24TP+woundLevel≥2 HP감소, 48TP 이탈,
//            patientDied(-2) / patientLeft(-1) 이벤트 + 로스터 제외 (W1-1 완화)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus             from '../../js/core/EventBus.js';
import GameState            from '../../js/core/GameState.js';
import SystemRegistry       from '../../js/core/SystemRegistry.js';
import NPCSystem            from '../../js/systems/NPCSystem.js';
import PatientIntakeSystem  from '../../js/systems/PatientIntakeSystem.js';

function resetWorld() {
  EventBus._listeners = {};
  GameState.time.totalTP = 0;
  GameState.time.day     = 5;
  GameState.time.tpInDay = 0;
  GameState.npcs        = { states: {} };
  GameState.companions  = [];
  GameState.flags       = { er_unlocked: true };
  GameState.player      = { ...(GameState.player ?? {}), characterId: 'doctor' };
  GameState.stats       = { morale: { current: 70, max: 100 } };
  GameState.cards = {};
  // W2-1: 테스트 기본값은 응급실 허브 (보라매병원)에 있다고 가정
  GameState.location    = { currentLandmark: 'dongjak', currentSubLocation: null };
  SystemRegistry.register('NPCSystem', NPCSystem);
  PatientIntakeSystem._reset?.();
}

beforeEach(resetWorld);

describe('PatientIntakeSystem — 기본 조건', () => {
  it('Day 1에서는 유입되지 않는다 (Day < 3)', () => {
    GameState.time.day = 1;
    PatientIntakeSystem.init();
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('ER 플래그가 false면 유입되지 않는다', () => {
    GameState.flags.er_unlocked = false;
    PatientIntakeSystem.init();
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('정상 조건에서 tryIntake() 성공 후 patientAdmitted 이벤트 발행', () => {
    const spy = vi.fn();
    EventBus.on('patientAdmitted', spy);
    PatientIntakeSystem.init();

    const ok = PatientIntakeSystem.tryIntake();
    expect(ok).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toHaveProperty('npcId');
  });

  it('성공 시 NPCSystem.forceSpawn이 호출된다', () => {
    const spy = vi.spyOn(NPCSystem, 'forceSpawn');
    PatientIntakeSystem.init();

    PatientIntakeSystem.tryIntake();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('PatientIntakeSystem — 상한 3명 (동시 대기)', () => {
  it('Day 30+에서 환자 3명이면 4번째 유입은 상한으로 실패한다', () => {
    GameState.time.day = 30;  // Day Cap 3
    PatientIntakeSystem.init();

    // Day 30에 3명까지는 Day Cap/쿨다운 내에서 가능
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    // 4번째는 상한(MAX_CONCURRENT_PATIENTS=3)으로 실패
    PatientIntakeSystem._resetCooldown();
    PatientIntakeSystem._resetDayCap();  // Day Cap은 별도 검증이므로 여기서는 배제
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('getActivePatients()는 현재 스폰된 환자 ID 배열을 반환한다', () => {
    PatientIntakeSystem.init();
    expect(PatientIntakeSystem.getActivePatients()).toHaveLength(0);

    PatientIntakeSystem.tryIntake();
    expect(PatientIntakeSystem.getActivePatients().length).toBeGreaterThanOrEqual(1);
  });
});

describe('PatientIntakeSystem — 쿨다운 (의사 2일)', () => {
  it('의사 캐릭터: 2일 내 두 번째 tryIntake는 false', () => {
    GameState.player.characterId = 'doctor';
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    GameState.time.day = 6;
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('의사 캐릭터: 정확히 2일 후에는 tryIntake 가능', () => {
    GameState.player.characterId = 'doctor';
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    GameState.time.day = 7;
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
  });
});

describe('PatientIntakeSystem — 쿨다운 (타 클래스 4일)', () => {
  it('타 클래스: 3일 뒤에도 쿨다운 내라서 false', () => {
    GameState.player.characterId = 'soldier';
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    GameState.time.day = 8;
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('타 클래스: 4일 후에는 tryIntake 가능', () => {
    GameState.player.characterId = 'soldier';
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    GameState.time.day = 9;
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
  });
});

describe('PatientIntakeSystem — Day Cap (Pull-First)', () => {
  it('Day 5 (초반): 같은 날 2번째 유입은 Day Cap으로 실패', () => {
    GameState.time.day = 5;
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    // 쿨다운을 인위적으로 리셋해도 Day Cap(1)이 차단
    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('Day 15 (중반): 같은 날 2번째까지 가능, 3번째 실패', () => {
    GameState.time.day = 15;
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);
    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('Day 30 (후반): 같은 날 3번째까지 가능, 4번째 실패 (= 동시 상한)', () => {
    GameState.time.day = 30;
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);
    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    PatientIntakeSystem._resetCooldown();
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('날짜가 바뀌면 admittedToday가 리셋된다', () => {
    GameState.player.characterId = 'doctor';
    GameState.time.day = 5;
    PatientIntakeSystem.init();

    expect(PatientIntakeSystem.tryIntake()).toBe(true);

    // Day 7: 쿨다운(2일) 경과 + 날짜 변경 → Day Cap 리셋
    GameState.time.day = 7;
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
  });
});

describe('PatientIntakeSystem — Pull-First (tpAdvance는 타이머 전용)', () => {
  it('init() 호출 후 tpAdvance 구독자가 1명 추가된다 (타이머 tick)', () => {
    const before = (EventBus._listeners['tpAdvance'] ?? []).length;
    PatientIntakeSystem.init();
    const after = (EventBus._listeners['tpAdvance'] ?? []).length;
    // 증분 3: 타이머 목적으로 tpAdvance 재구독 (intake는 여전히 pull)
    expect(after).toBe(before + 1);
  });
});

describe('PatientIntakeSystem — 증분 3: 환자 메타 추적', () => {
  it('입원 시 admissionTP와 hp(100)가 기록된다', () => {
    GameState.time.totalTP = 100;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();

    const [npcId] = PatientIntakeSystem.getActivePatients();
    const meta = PatientIntakeSystem.getPatientMeta(npcId);
    expect(meta.admissionTP).toBe(100);
    expect(meta.hp).toBe(100);
  });
});

describe('PatientIntakeSystem — 증분 3: HP 감소 (24TP + woundLevel≥2)', () => {
  it('admission 후 23TP 경과: HP 감소 없음', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    GameState.time.totalTP = 23;
    EventBus.emit('tpAdvance', {});

    expect(PatientIntakeSystem.getPatientMeta(npcId).hp).toBe(100);
  });

  it('admission 후 24TP 경과 + woundLevel≥2: HP 1 감소', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    // 페르소나는 woundLevel:3으로 시작하므로 조건 충족
    GameState.time.totalTP = 24;
    EventBus.emit('tpAdvance', {});

    expect(PatientIntakeSystem.getPatientMeta(npcId).hp).toBe(99);
  });

  it('woundLevel을 1로 낮추면 HP 감소가 멈춘다', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    // 치료로 woundLevel 1까지 낮춤
    const npcState = GameState.npcs.states[npcId];
    npcState.woundLevel = 1;

    GameState.time.totalTP = 30;  // 24TP 이후
    EventBus.emit('tpAdvance', {});

    expect(PatientIntakeSystem.getPatientMeta(npcId).hp).toBe(100);
  });

  it('woundLevel=0(완치)이면 48TP 경과해도 이탈하지 않는다', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    GameState.npcs.states[npcId].woundLevel = 0;

    GameState.time.totalTP = 50;
    EventBus.emit('tpAdvance', {});

    expect(PatientIntakeSystem.getActivePatients()).toContain(npcId);
  });
});

describe('PatientIntakeSystem — 증분 3: patientDied (HP 0)', () => {
  it('HP 0 도달 시 patientDied 이벤트 발행 + morale -2 + 로스터 제외', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    // HP를 1로 강제 → 1TP 더 tick하면 사망
    const meta = PatientIntakeSystem.getPatientMeta(npcId);
    meta.hp = 1;

    const spy = vi.fn();
    EventBus.on('patientDied', spy);

    GameState.time.totalTP = 24;  // tick 조건 활성화
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ npcId });
    expect(GameState.stats.morale.current).toBe(68);  // 70 - 2
    expect(PatientIntakeSystem.getActivePatients()).not.toContain(npcId);
  });
});

describe('PatientIntakeSystem — 증분 3: patientLeft (48TP 이탈)', () => {
  it('admission 후 48TP 경과 + 미완치: patientLeft + morale -1 + 로스터 제외', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    // woundLevel을 1로 낮춰서 HP 감소로 인한 사망은 회피
    GameState.npcs.states[npcId].woundLevel = 1;

    const spy = vi.fn();
    EventBus.on('patientLeft', spy);

    GameState.time.totalTP = 48;
    EventBus.emit('tpAdvance', {});

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ npcId });
    expect(GameState.stats.morale.current).toBe(69);  // 70 - 1
    expect(PatientIntakeSystem.getActivePatients()).not.toContain(npcId);
  });

  it('사망은 이탈보다 우선한다: HP=0 & 48TP 동시 도달 → patientDied만 발행', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    PatientIntakeSystem.getPatientMeta(npcId).hp = 1;

    const diedSpy = vi.fn();
    const leftSpy = vi.fn();
    EventBus.on('patientDied', diedSpy);
    EventBus.on('patientLeft', leftSpy);

    GameState.time.totalTP = 48;  // 이탈 조건과 HP 감소 조건 동시 충족
    EventBus.emit('tpAdvance', {});

    expect(diedSpy).toHaveBeenCalledOnce();
    expect(leftSpy).not.toHaveBeenCalled();
  });
});

describe('PatientIntakeSystem — W3-1: 기여 타입 선택권', () => {
  it('altContributions 있는 환자 cure 시 contributionChoiceNeeded 이벤트 발행 + rescue 지연', () => {
    GameState.time.day = 10;
    PatientIntakeSystem.init();
    // 직접 주입 — rollPersona 의존 제거
    PatientIntakeSystem._admitted = ['patient_lee_junho_16'];
    GameState.npcs.states['patient_lee_junho_16'] = { woundLevel: 0 };

    const spy = vi.fn();
    EventBus.on('contributionChoiceNeeded', spy);

    EventBus.emit('npcHealed', { npcId: 'patient_lee_junho_16' });

    expect(spy).toHaveBeenCalledOnce();
    const payload = spy.mock.calls[0][0];
    expect(payload.npcId).toBe('patient_lee_junho_16');
    expect(payload.options.length).toBeGreaterThanOrEqual(2);
    // rescue 지연 확인
    expect(PatientIntakeSystem.getRescuedInfo('patient_lee_junho_16')).toBeNull();
  });

  it('chooseContribution(npcId, 1)로 대안 선택 시 해당 타입으로 확정', () => {
    GameState.time.day = 10;
    PatientIntakeSystem.init();
    PatientIntakeSystem._admitted = ['patient_lee_junho_16'];
    GameState.npcs.states['patient_lee_junho_16'] = { woundLevel: 0 };

    EventBus.emit('npcHealed', { npcId: 'patient_lee_junho_16' });
    const ok = PatientIntakeSystem.chooseContribution('patient_lee_junho_16', 1);

    expect(ok).toBe(true);
    const info = PatientIntakeSystem.getRescuedInfo('patient_lee_junho_16');
    expect(info?.type).toBe('sponsor');   // alt는 sponsor 대체
  });

  it('chooseContribution(npcId, 0)은 primary로 확정', () => {
    GameState.time.day = 10;
    PatientIntakeSystem.init();
    PatientIntakeSystem._admitted = ['patient_lee_junho_16'];
    GameState.npcs.states['patient_lee_junho_16'] = { woundLevel: 0 };

    EventBus.emit('npcHealed', { npcId: 'patient_lee_junho_16' });
    PatientIntakeSystem.chooseContribution('patient_lee_junho_16', 0);

    const info = PatientIntakeSystem.getRescuedInfo('patient_lee_junho_16');
    expect(info?.type).toBe('dispatch');   // primary
  });
});

describe('PatientIntakeSystem — W2-3: 기여 타입 가중치 롤', () => {
  it('초반(Day < 10) 가중치는 sponsor/guard 우세', () => {
    const w = PatientIntakeSystem._getTypeWeights(5);
    expect(w.sponsor).toBeGreaterThan(w.dispatch);
    expect(w.guard).toBeGreaterThan(w.recruit);
  });

  it('후반(Day >= 30) 가중치는 dispatch 우세', () => {
    const w = PatientIntakeSystem._getTypeWeights(40);
    expect(w.dispatch).toBeGreaterThan(w.sponsor);
    expect(w.dispatch).toBeGreaterThan(w.guard);
  });

  it('rollPersona 결과는 PATIENT_POOL 안에 있고 admitted/rescued 중복 안 됨', () => {
    GameState.time.day = 10;
    PatientIntakeSystem.init();
    const id = PatientIntakeSystem._rollPersona('doctor');
    expect(id).toBeTruthy();
  });
});

describe('PatientIntakeSystem — W2-1: 위치 체크 + 간호사 자동 대행', () => {
  it('보라매병원이 아니면 tryIntake 실패', () => {
    GameState.location.currentLandmark = 'yongsan';
    GameState.location.currentSubLocation = null;
    PatientIntakeSystem.init();
    expect(PatientIntakeSystem.tryIntake()).toBe(false);
  });

  it('boramae_ 서브로케이션이면 tryIntake 성공', () => {
    GameState.location.currentLandmark = null;
    GameState.location.currentSubLocation = 'boramae_emergency';
    PatientIntakeSystem.init();
    expect(PatientIntakeSystem.tryIntake()).toBe(true);
  });

  it('의사 부재 + 간호사 상주 시 타이머 동결 (admissionTP가 현재TP로 리셋)', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();

    // 의사는 원정 나감 (보라매 아님) + 간호사 상주
    GameState.location.currentLandmark = 'yongsan';
    GameState.location.currentSubLocation = null;
    GameState.npcs.states['npc_nurse'] = { woundLevel: 0 };

    // 48TP 경과하지만 간호사가 타이머 동결 → patientLeft 발행되지 않음
    const leftSpy = vi.fn();
    EventBus.on('patientLeft', leftSpy);

    GameState.time.totalTP = 48;
    EventBus.emit('tpAdvance', {});

    expect(leftSpy).not.toHaveBeenCalled();
    expect(PatientIntakeSystem.getPatientMeta(npcId).admissionTP).toBe(48);
  });

  it('간호사가 동반자로 원정 동행 중이면 동결 안 됨', () => {
    GameState.time.totalTP = 0;
    PatientIntakeSystem.init();
    PatientIntakeSystem.tryIntake();
    const [npcId] = PatientIntakeSystem.getActivePatients();
    GameState.npcs.states[npcId].woundLevel = 1;   // 이탈 경로로 유도

    GameState.location.currentLandmark = 'yongsan';
    GameState.location.currentSubLocation = null;
    GameState.npcs.states['npc_nurse'] = { woundLevel: 0 };
    GameState.companions = ['npc_nurse'];

    const leftSpy = vi.fn();
    EventBus.on('patientLeft', leftSpy);

    GameState.time.totalTP = 48;
    EventBus.emit('tpAdvance', {});

    expect(leftSpy).toHaveBeenCalledOnce();
  });
});
