// === OnboardingSystem — 의사 우선 튜토리얼 힌트 ===
// 검증:
//  - 의사 전용 힌트: npcHealed / npcSpawned(청진기 진단) / statChanged(감염도) /
//    patientCured·contributionChoiceNeeded / openingChoice
//  - 안내 모달 승격: patientAdmitted / diseaseContracted(잠복 발현) → ModalManager.open,
//    다른 모달이 열려 있으면 토스트 폴백
//  - 전 직업 힌트(DiseaseSystem 이관): diseaseContracted → 출혈 치료·감염 경고
//  - HospitalSiegeSystem 이관: siegeWarningDue → 경고 배너 notify
//  - 공통: onboarding_* 플래그로 1회만 표시, 비의사 직업 가드
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EventBus         from '../../js/core/EventBus.js';
import GameState        from '../../js/core/GameState.js';
import ModalManager     from '../../js/ui/ModalManager.js';
import OnboardingSystem from '../../js/systems/OnboardingSystem.js';

// ModalManager는 DOM 의존 — 모달 열림 상태만 흉내 내는 목으로 대체
vi.mock('../../js/ui/ModalManager.js', async () => {
  const { default: GameState } = await import('../../js/core/GameState.js');
  return {
    default: {
      open:  vi.fn(() => { GameState.ui.modalOpen = true; }),
      close: vi.fn(() => { GameState.ui.modalOpen = false; }),
    },
  };
});

// _openGuideModal의 확인 버튼 바인딩·오버레이 감지가 node 환경에서도 통과하도록 최소 스텁
globalThis.document ??= { getElementById: () => null, querySelector: () => null };
// _showBoardTooltip이 '이미 본 상태'로 조기 반환하도록 대체 (DOM 생성 경로 차단)
// node 22+는 localStorage 전역이 존재하지만 플래그 없이는 동작하지 않으므로 강제 스텁
vi.stubGlobal('localStorage', { getItem: () => '1', setItem() {} });

let notifications;

function resetWorld({ characterId = 'doctor', day = 3, totalTP = 150 } = {}) {
  EventBus._listeners = {};
  GameState.flags     = {};
  GameState.cards     = {};
  GameState.board     = {
    top:         Array(10).fill(null),
    environment: Array(3).fill(null),
    middle:      Array(20).fill(null),
    bottom:      Array(20).fill(null),
  };
  GameState.time  = { day, totalTP, tpInDay: 10 };
  GameState.stats = { infection: { current: 0, max: 100 } };
  GameState.ui    = { modalOpen: false };
  GameState.player.characterId = characterId;
  GameState.player.diseases    = [];
  GameState.player.extraSlots  = 0;
  GameState.player.encumbrance = { current: 0, max: 30, tier: 0, tpMult: 1.0, weightPct: 0 };

  notifications = [];
  EventBus.on('notify', (p) => notifications.push(p));
  ModalManager.open.mockClear();
  ModalManager.close.mockClear();
  OnboardingSystem.init();
}

beforeEach(() => resetWorld());
// 테스트 중간 실패 시 fake timer가 다음 테스트로 새지 않도록 안전망
afterEach(() => vi.useRealTimers());

describe('OnboardingSystem — 의사 전용 힌트', () => {
  it('npcHealed 최초 1회에만 의료 스킬 안내', () => {
    EventBus.emit('npcHealed', { npcId: 'npc_wounded_soldier' });
    EventBus.emit('npcHealed', { npcId: 'npc_wounded_soldier' });

    const hints = notifications.filter(n => n.message.includes('medicine'));
    expect(hints).toHaveLength(1);
    expect(GameState.flags.onboarding_doctor_skill).toBe(true);
  });

  it('비의사 직업은 npcHealed에 반응하지 않음', () => {
    resetWorld({ characterId: 'soldier' });
    EventBus.emit('npcHealed', { npcId: 'npc_x' });
    expect(notifications).toHaveLength(0);
  });

  it('청진기 보유 + 부상 NPC 스폰 시 진단 안내', () => {
    const inst = GameState.createCardInstance('stethoscope');
    GameState.placeCardInRow(inst.instanceId, 'bottom');
    notifications = [];

    EventBus.emit('npcSpawned', { npcId: 'npc_er_patient_child' });

    expect(notifications.some(n => n.message.includes('청진기'))).toBe(true);
    expect(GameState.flags.onboarding_doctor_diagnose).toBe(true);
  });

  it('청진기 미보유 시 진단 안내 없음', () => {
    EventBus.emit('npcSpawned', { npcId: 'npc_er_patient_child' });
    expect(notifications).toHaveLength(0);
  });

  it('부상 없는 NPC 스폰은 진단 안내 대상이 아님', () => {
    const inst = GameState.createCardInstance('stethoscope');
    GameState.placeCardInRow(inst.instanceId, 'bottom');
    notifications = [];

    EventBus.emit('npcSpawned', { npcId: 'npc_nurse' });
    expect(notifications).toHaveLength(0);
  });

  it('게임 시작 시점(totalTP 0) 스폰은 오프닝과 겹치므로 제외', () => {
    resetWorld({ day: 1, totalTP: 0 });
    const inst = GameState.createCardInstance('stethoscope');
    GameState.placeCardInRow(inst.instanceId, 'bottom');
    notifications = [];

    EventBus.emit('npcSpawned', { npcId: 'npc_wounded_soldier' });
    expect(notifications).toHaveLength(0);
  });

  it('감염도 30 돌파 시 1회 안내', () => {
    GameState.stats.infection.current = 25;
    EventBus.emit('statChanged', {});
    expect(notifications).toHaveLength(0);

    GameState.stats.infection.current = 35;
    EventBus.emit('statChanged', {});
    EventBus.emit('statChanged', {});
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('감염도');
  });

  it('patientAdmitted 시 응급실 안내 모달을 1회만 표시 (지연)', () => {
    vi.useFakeTimers();
    EventBus.emit('patientAdmitted', { npcId: 'npc_er_patient_child' });
    expect(ModalManager.open).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(ModalManager.open).toHaveBeenCalledTimes(1);
    expect(ModalManager.open.mock.calls[0][1]).toBe('응급실 환자 관리');

    GameState.ui.modalOpen = false;
    EventBus.emit('patientAdmitted', { npcId: 'npc_er_patient_elder' });
    vi.runAllTimers();
    expect(ModalManager.open).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('다른 모달이 열려 있으면 응급실 안내는 토스트로 폴백', () => {
    vi.useFakeTimers();
    GameState.ui.modalOpen = true;
    EventBus.emit('patientAdmitted', { npcId: 'npc_er_patient_child' });
    vi.runAllTimers();

    expect(ModalManager.open).not.toHaveBeenCalled();
    expect(notifications.some(n => n.message.includes('환자'))).toBe(true);
    vi.useRealTimers();
  });

  it('contributionChoiceNeeded가 patientCured보다 먼저 와도 기여 안내는 1회', () => {
    EventBus.emit('contributionChoiceNeeded', { npcId: 'x', options: [] });
    EventBus.emit('patientCured', { npcId: 'x', type: 'sponsor' });

    const hints = notifications.filter(n => n.message.includes('보답'));
    expect(hints).toHaveLength(1);
  });

  it('대안 기여 없는 환자(patientCured 단독)도 기여 안내 표시', () => {
    EventBus.emit('patientCured', { npcId: 'x', type: 'sponsor' });

    expect(notifications.filter(n => n.message.includes('보답'))).toHaveLength(1);
    expect(GameState.flags.onboarding_doctor_contribution).toBe(true);
  });

  it('오프닝 치료 선택 시 붕대 드래그 안내, 탈출 선택 시 없음', () => {
    EventBus.emit('openingChoice', { characterId: 'doctor', choice: 'escape' });
    expect(notifications).toHaveLength(0);

    EventBus.emit('openingChoice', { characterId: 'doctor', choice: 'treat' });
    expect(notifications.some(n => n.message.includes('박상훈'))).toBe(true);
  });
});

describe('OnboardingSystem — 전 직업 질병 안내 (DiseaseSystem 이관)', () => {
  it('잠복기 발현(미진단) 질병이면 진단 안내 모달 표시', () => {
    vi.useFakeTimers();
    GameState.player.diseases = [{ id: 'influenza', discovered: false }];
    EventBus.emit('diseaseContracted', { diseaseId: 'influenza' });
    vi.runAllTimers();

    expect(ModalManager.open).toHaveBeenCalledTimes(1);
    expect(ModalManager.open.mock.calls[0][1]).toBe('질병 진단');
    vi.useRealTimers();
  });

  it('즉시 발견된 질병은 진단 안내 모달 제외', () => {
    vi.useFakeTimers();
    GameState.player.diseases = [{ id: 'hypothermia', discovered: true }];
    EventBus.emit('diseaseContracted', { diseaseId: 'hypothermia' });
    vi.runAllTimers();

    expect(ModalManager.open).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('출혈 발생 시 치료법 안내 — 비의사 직업에도 표시', () => {
    resetWorld({ characterId: 'chef' });
    vi.useFakeTimers();
    GameState.player.diseases = [{ id: 'bleeding', discovered: true }];
    EventBus.emit('diseaseContracted', { diseaseId: 'bleeding' });
    vi.runAllTimers();

    expect(notifications.some(n => n.message.includes('출혈'))).toBe(true);
    expect(GameState.flags.onboarding_bleeding_treat).toBe(true);
    vi.useRealTimers();
  });

  it('깊은 열상 또는 감염도 20 초과 시 감염 경고 (type: warn)', () => {
    vi.useFakeTimers();
    GameState.player.diseases = [{ id: 'deep_laceration', discovered: true }];
    EventBus.emit('diseaseContracted', { diseaseId: 'deep_laceration' });
    vi.runAllTimers();

    const warn = notifications.find(n => n.message.includes('감염 경고'));
    expect(warn).toBeTruthy();
    expect(warn.type).toBe('warn');
    vi.useRealTimers();
  });
});

describe('OnboardingSystem — 감염 안내 상호 소모', () => {
  it('의사 전용 감염 힌트가 뜨면 전 직업 감염 안내도 소모', () => {
    vi.useFakeTimers();
    GameState.stats.infection.current = 35;
    EventBus.emit('statChanged', {});
    expect(GameState.flags.onboarding_doctor_infection).toBe(true);
    expect(GameState.flags.onboarding_infection_treat).toBe(true);

    notifications = [];
    GameState.player.diseases = [{ id: 'deep_laceration', discovered: true }];
    EventBus.emit('diseaseContracted', { diseaseId: 'deep_laceration' });
    vi.runAllTimers();
    expect(notifications).toHaveLength(0);
  });

  it('전 직업 감염 안내가 뜨면 의사 전용 힌트도 소모', () => {
    vi.useFakeTimers();
    GameState.player.diseases = [{ id: 'deep_laceration', discovered: true }];
    EventBus.emit('diseaseContracted', { diseaseId: 'deep_laceration' });
    vi.runAllTimers();
    expect(GameState.flags.onboarding_infection_treat).toBe(true);
    expect(GameState.flags.onboarding_doctor_infection).toBe(true);

    notifications = [];
    GameState.stats.infection.current = 35;
    EventBus.emit('statChanged', {});
    expect(notifications).toHaveLength(0);
  });
});

describe('OnboardingSystem — 세이브 호환 (loaded)', () => {
  it('진행 중 세이브(day 2+) 로드 시 상태 기반 힌트를 시딩해 폭주 방지', () => {
    resetWorld({ day: 15, totalTP: 1000 });
    EventBus.emit('loaded', { slot: 1 });

    EventBus.emit('statChanged', { stat: 'noise', oldVal: 0, newVal: 55 });
    EventBus.emit('districtChanged', {});
    EventBus.emit('boardReinit', {});
    expect(notifications).toHaveLength(0);
  });

  it('day 1 로드는 시딩하지 않아 힌트가 정상 동작', () => {
    resetWorld({ day: 1, totalTP: 10 });
    EventBus.emit('loaded', { slot: 1 });

    EventBus.emit('districtChanged', {});
    expect(notifications.some(n => n.message.includes('인접 구역'))).toBe(true);
  });

  it('구 가이드 플래그(siegeTutorialWarned 등)를 onboarding_* 키로 이관', () => {
    vi.useFakeTimers();
    GameState.flags.siegeTutorialWarned = true;
    GameState.flags.bleedingGuideShown  = true;
    EventBus.emit('loaded', { slot: 1 });

    EventBus.emit('siegeWarningDue', { day: 7 });
    GameState.player.diseases = [{ id: 'bleeding', discovered: true }];
    EventBus.emit('diseaseContracted', { diseaseId: 'bleeding' });
    vi.runAllTimers();
    expect(notifications).toHaveLength(0);
  });
});

describe('OnboardingSystem — Day 7 습격 예고 (HospitalSiegeSystem 이관)', () => {
  it('siegeWarningDue 수신 시 경고 배너 notify 1회', () => {
    EventBus.emit('siegeWarningDue', { day: 7 });
    EventBus.emit('siegeWarningDue', { day: 7 });

    const warnings = notifications.filter(n => n.message.includes('발소리'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('warning');
    expect(warnings[0].persistent).toBe(true);
    expect(GameState.flags.onboarding_siege_warning).toBe(true);
  });
});

describe('OnboardingSystem — 공통 힌트 (Phase 4)', () => {
  it('시작 아이템 배치(totalTP 0)에는 pickup 힌트가 소모되지 않고, 첫 실제 획득 시 표시', () => {
    resetWorld({ day: 1, totalTP: 0 });
    EventBus.emit('cardPlaced', { instanceId: 'x', row: 'bottom', slot: 0 });
    expect(notifications.some(n => n.message.includes('드래그해 인벤토리'))).toBe(false);
    expect(GameState.flags.onboarding_pickup).toBeUndefined();

    GameState.time.totalTP = 3;
    EventBus.emit('cardPlaced', { instanceId: 'x', row: 'bottom', slot: 1 });
    expect(notifications.some(n => n.message.includes('드래그해 인벤토리'))).toBe(true);
  });

  it('첫 메인 진입(Day 1) 시 보드 3열 구조 안내 (지연 표시)', () => {
    resetWorld({ day: 1, totalTP: 0 });
    vi.useFakeTimers();
    EventBus.emit('stateTransition', { to: 'main' });
    vi.runAllTimers();

    expect(notifications.some(n => n.message.includes('보드는 세 줄'))).toBe(true);
    vi.useRealTimers();
  });

  it('Day 1 이후의 메인 진입은 보드 구조 안내 제외', () => {
    vi.useFakeTimers();
    EventBus.emit('stateTransition', { to: 'main' });
    vi.runAllTimers();

    expect(notifications.some(n => n.message.includes('보드는 세 줄'))).toBe(false);
    vi.useRealTimers();
  });

  it('바닥 2페이지 슬롯(10 이상)에 카드 배치 시 페이저 안내', () => {
    EventBus.emit('cardPlaced', { instanceId: 'x', row: 'middle', slot: 12 });
    expect(notifications.some(n => n.message.includes('페이지'))).toBe(true);

    notifications = [];
    EventBus.emit('cardPlaced', { instanceId: 'x', row: 'middle', slot: 15 });
    expect(notifications).toHaveLength(0);
  });

  it('바닥 1페이지 슬롯 배치는 페이저 안내 제외', () => {
    EventBus.emit('cardPlaced', { instanceId: 'x', row: 'middle', slot: 5 });
    expect(notifications.some(n => n.message.includes('페이지'))).toBe(false);
  });

  it('가방 장착(extraSlots>0) 후 boardReinit 시 가방 칸 안내', () => {
    GameState.player.extraSlots = 3;
    EventBus.emit('boardReinit', {});
    expect(notifications.some(n => n.message.includes('가방'))).toBe(true);
  });

  it('가방 없이 boardReinit만 오면 안내 없음', () => {
    EventBus.emit('boardReinit', {});
    expect(notifications).toHaveLength(0);
  });

  it('장착 가능한 아이템을 휴대하면 장비 창 안내, 소모품은 제외', () => {
    const knife = GameState.createCardInstance('knife');
    GameState.placeCardInRow(knife.instanceId, 'bottom');
    expect(notifications.some(n => n.message.includes('장비 창'))).toBe(true);

    resetWorld();
    const bandage = GameState.createCardInstance('bandage');
    GameState.placeCardInRow(bandage.instanceId, 'bottom');
    expect(notifications.some(n => n.message.includes('장비 창'))).toBe(false);
  });

  it('게임 시작 시점(totalTP 0)의 시작 아이템 배치는 장비 안내 제외', () => {
    resetWorld({ day: 1, totalTP: 0 });
    const knife = GameState.createCardInstance('knife');
    GameState.placeCardInRow(knife.instanceId, 'bottom');
    expect(notifications.some(n => n.message.includes('장비 창'))).toBe(false);
  });

  it('무게 75% 도달 시 경고 힌트 1회 (재계산 이후 판정)', () => {
    vi.useFakeTimers();
    GameState.player.encumbrance.weightPct = 0.8;
    EventBus.emit('cardPlaced', { instanceId: 'none', row: 'bottom', slot: 0 });
    vi.runAllTimers();

    const warn = notifications.find(n => n.message.includes('무게'));
    expect(warn).toBeTruthy();
    expect(warn.type).toBe('warn');

    notifications = [];
    EventBus.emit('cardMoved', {});
    vi.runAllTimers();
    expect(notifications).toHaveLength(0);
    vi.useRealTimers();
  });

  it('무게 75% 미만이면 힌트 없음', () => {
    vi.useFakeTimers();
    GameState.player.encumbrance.weightPct = 0.5;
    EventBus.emit('cardPlaced', { instanceId: 'none', row: 'bottom', slot: 0 });
    vi.runAllTimers();
    expect(notifications).toHaveLength(0);
    vi.useRealTimers();
  });

  it('소음 40 도달 시 경고 힌트, 미만이면 없음', () => {
    EventBus.emit('statChanged', { stat: 'noise', oldVal: 0, newVal: 20 });
    expect(notifications).toHaveLength(0);

    EventBus.emit('statChanged', { stat: 'noise', oldVal: 0, newVal: 45 });
    const warn = notifications.find(n => n.message.includes('소음'));
    expect(warn).toBeTruthy();
    expect(warn.type).toBe('warn');

    notifications = [];
    EventBus.emit('statChanged', { stat: 'noise', oldVal: 0, newVal: 70 });
    expect(notifications).toHaveLength(0);
  });
});
