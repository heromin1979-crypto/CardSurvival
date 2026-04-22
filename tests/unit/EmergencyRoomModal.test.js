// === EmergencyRoomModal — UI 단위 테스트 ===
// 검증: isAvailable / render 데이터 소스 / 탭 전환 / 액션 바인딩
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus       from '../../js/core/EventBus.js';
import GameState      from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import PATIENT_POOL   from '../../js/data/patientPool.js';
import EmergencyRoomModal from '../../js/ui/EmergencyRoomModal.js';

// ── 최소 DOM stub ─────────────────────────
class StubEl {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.listeners = {};
    this.classList = {
      classes: new Set(),
      add:    (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c),
    };
    this.innerHTML = '';
    this.dataset = {};
    this._className = '';
  }
  set className(v) { this._className = v; }
  get className() { return this._className; }

  addEventListener(ev, fn) {
    (this.listeners[ev] ||= []).push(fn);
  }
  querySelector(_sel) { return null; }
  querySelectorAll(_sel) { return []; }
  _fire(ev, payload) {
    (this.listeners[ev] || []).forEach(fn => fn(payload));
  }
}

function setupDom() {
  const overlay = new StubEl();
  const box     = new StubEl();
  overlay.querySelector = (sel) => sel === '.er-modal-box' ? box : null;
  box.querySelector = () => null;
  box.querySelectorAll = () => [];

  globalThis.document = {
    getElementById: (id) => id === 'emergency-room-modal' ? overlay : null,
    addEventListener: () => {},
  };
  return { overlay, box };
}

function resetWorld() {
  EventBus._listeners = {};
  GameState.time        = { totalTP: 0, day: 12, tpInDay: 0 };
  GameState.flags       = { er_unlocked: true, nextSiegeDay: 15, siegeCount: 1 };
  GameState.location    = { currentLandmark: null };
  GameState.hospital    = { stationedGuards: [], defenseRating: 0, siegeHistory: [] };
  GameState.pendingLoot = [];

  // Reset modal
  EmergencyRoomModal._el          = null;
  EmergencyRoomModal._box         = null;
  EmergencyRoomModal._initialized = false;
  EmergencyRoomModal._activeTab   = 'patients';
  EmergencyRoomModal._unsubscribes = [];

  // Clear SystemRegistry
  SystemRegistry._systems = {};
}

beforeEach(resetWorld);

describe('EmergencyRoomModal.isAvailable', () => {
  it('er_unlocked 플래그가 true면 true 반환', () => {
    GameState.flags.er_unlocked = true;
    expect(EmergencyRoomModal.isAvailable()).toBe(true);
  });

  it('er_unlocked 플래그가 false면 false 반환', () => {
    GameState.flags.er_unlocked = false;
    expect(EmergencyRoomModal.isAvailable()).toBe(false);
  });
});

describe('EmergencyRoomModal.init / open / close', () => {
  it('init 후 open하면 open 클래스 추가, close하면 제거', () => {
    const { overlay } = setupDom();
    EmergencyRoomModal.init();
    EmergencyRoomModal.open();
    expect(overlay.classList.contains('open')).toBe(true);
    EmergencyRoomModal.close();
    expect(overlay.classList.contains('open')).toBe(false);
  });

  it('DOM 엘리먼트가 없어도 init이 예외 없이 종료', () => {
    globalThis.document = {
      getElementById: () => null,
      addEventListener: () => {},
    };
    expect(() => EmergencyRoomModal.init()).not.toThrow();
  });
});

describe('EmergencyRoomModal._getNpcDisplay', () => {
  it('PATIENT_POOL에 있는 npc는 이름/아이콘 반환', () => {
    setupDom();
    const firstId = Object.keys(PATIENT_POOL)[0];
    const def = PATIENT_POOL[firstId];
    const { name, icon } = EmergencyRoomModal._getNpcDisplay(firstId);
    expect(name).toBe(def.name);
    expect(icon).toBe(def.portraitIcon);
  });

  it('미등록 npc는 fallback (id, 기본 아이콘) 반환', () => {
    setupDom();
    const { name, icon } = EmergencyRoomModal._getNpcDisplay('unknown_npc_xyz');
    expect(name).toBe('unknown_npc_xyz');
    expect(icon).toBe('👤');
  });
});

describe('EmergencyRoomModal 탭 렌더', () => {
  it('환자 탭: 입원 없음 → er-empty 메시지 포함', () => {
    SystemRegistry.register('PatientIntakeSystem', {
      getActivePatients: () => [],
      getRescuedRoster:  () => [],
      getPatientMeta:    () => null,
      getRescuedInfo:    () => null,
    });
    const html = EmergencyRoomModal._renderPatientsTab();
    expect(html).toMatch(/er-empty/);
    expect(html).toMatch(/치료 중인 환자가 없습니다/);
  });

  it('환자 탭: 입원자 HP 바 렌더', () => {
    const firstId = Object.keys(PATIENT_POOL)[0];
    SystemRegistry.register('PatientIntakeSystem', {
      getActivePatients: () => [firstId],
      getPatientMeta:    () => ({ hp: 75 }),
    });
    const html = EmergencyRoomModal._renderPatientsTab();
    expect(html).toMatch(/er-hp-fill/);
    expect(html).toMatch(/75HP/);
    expect(html).toContain(PATIENT_POOL[firstId].name);
  });

  it('구원자 탭: 완치 로스터 기여 타입 배지 표시', () => {
    const firstId = Object.keys(PATIENT_POOL)[0];
    SystemRegistry.register('PatientIntakeSystem', {
      getRescuedRoster: () => [firstId],
      getRescuedInfo:   () => ({ type: 'sponsor' }),
    });
    const html = EmergencyRoomModal._renderRescuedTab();
    expect(html).toMatch(/후원/);
    expect(html).toContain(PATIENT_POOL[firstId].name);
  });

  it('수비대 탭: 등록자 없으면 empty 메시지', () => {
    SystemRegistry.register('GuardSystem', {
      getRegistered: () => [],
      getStationed:  () => [],
      getGuardDef:   () => null,
    });
    const html = EmergencyRoomModal._renderGuardsTab();
    expect(html).toMatch(/er-empty/);
  });

  it('수비대 탭: 상주자에게 해제 버튼, 미상주자에게 배치 버튼', () => {
    const guardId = Object.keys(PATIENT_POOL).find(id =>
      PATIENT_POOL[id]?.contributionOnCure?.type === 'guard'
    );
    SystemRegistry.register('GuardSystem', {
      getRegistered: () => [guardId],
      getStationed:  () => [],
      getGuardDef:   () => ({ combatDmg: 14, foodCostPerDay: 1 }),
    });
    const htmlIdle = EmergencyRoomModal._renderGuardsTab();
    expect(htmlIdle).toMatch(/data-guard-station=/);
    expect(htmlIdle).not.toMatch(/data-guard-dismiss=/);

    SystemRegistry.register('GuardSystem', {
      getRegistered: () => [guardId],
      getStationed:  () => [guardId],
      getGuardDef:   () => ({ combatDmg: 14, foodCostPerDay: 1 }),
    });
    const htmlStationed = EmergencyRoomModal._renderGuardsTab();
    expect(htmlStationed).toMatch(/data-guard-dismiss=/);
    expect(htmlStationed).toMatch(/상주/);
  });

  it('파견 탭: idle 상태는 파견 버튼, deployed 상태는 복귀 버튼', () => {
    const dispatchId = Object.keys(PATIENT_POOL).find(id =>
      PATIENT_POOL[id]?.contributionOnCure?.type === 'dispatch'
    );
    SystemRegistry.register('DispatchSystem', {
      getDispatchable: () => [dispatchId],
      getDeployed:     () => [],
      getAssignment:   () => ({ status: 'idle' }),
    });
    const htmlIdle = EmergencyRoomModal._renderDispatchTab();
    expect(htmlIdle).toMatch(/data-dispatch-deploy=/);

    SystemRegistry.register('DispatchSystem', {
      getDispatchable: () => [],
      getDeployed:     () => [dispatchId],
      getAssignment:   () => ({ status: 'deployed', deployedTo: 'yongsan', returnDay: 20 }),
    });
    const htmlDeployed = EmergencyRoomModal._renderDispatchTab();
    expect(htmlDeployed).toMatch(/data-dispatch-recall=/);
    expect(htmlDeployed).toMatch(/파견중/);
  });
});

describe('EmergencyRoomModal._renderHero', () => {
  it('nextSiegeDay - day = D-day 계산', () => {
    GameState.time.day = 12;
    GameState.flags.nextSiegeDay = 15;
    SystemRegistry.register('GuardSystem', {
      getDefenseRating: () => 50,
      getStationed:     () => ['a', 'b'],
    });
    const html = EmergencyRoomModal._renderHero();
    expect(html).toMatch(/D-3/);
    expect(html).toMatch(/50/);         // 방어력
    expect(html).toMatch(/2명/);        // 상주 수
  });

  it('nextSiegeDay === day → "오늘" 표시 + danger 클래스', () => {
    GameState.time.day = 15;
    GameState.flags.nextSiegeDay = 15;
    SystemRegistry.register('GuardSystem', null);
    const html = EmergencyRoomModal._renderHero();
    expect(html).toMatch(/오늘/);
    expect(html).toMatch(/er-hero-card danger/);
  });

  it('nextSiegeDay 미설정 시 dash 표시', () => {
    GameState.flags.nextSiegeDay = null;
    SystemRegistry.register('GuardSystem', null);
    const html = EmergencyRoomModal._renderHero();
    expect(html).toMatch(/—/);
  });
});
