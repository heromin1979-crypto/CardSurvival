// === 시스템 모듈 싱글톤 상태의 새 게임 리셋 회귀 테스트 ===
// regression: 시스템 내부 상태(_ 프리픽스)는 모듈 싱글톤이고 init()은 main.js에서
// 앱 부팅 시 한 번만 호출된다. 새 게임에서 재초기화되지 않아 이전 게임 값이 남았다.
// 특히 일자 캐시가 위험했다 — EndingSystem._lastCheckDay는 `day > _lastCheckDay`,
// SeasonSystem._lastEventDay는 `day <= _lastEventDay`, MentalSystem._lastWarningTP는
// `totalTP - _lastWarningTP >= 30`으로 비교해서, 이전 게임 일자가 남으면 새 게임에서
// 엔딩 체크·계절 이벤트·정신 경고가 수백 일간 차단된다.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

import QuestSystem         from '../../js/systems/QuestSystem.js';
import EndingSystem        from '../../js/systems/EndingSystem.js';
import SeasonSystem        from '../../js/systems/SeasonSystem.js';
import MentalSystem        from '../../js/systems/MentalSystem.js';
import PatientIntakeSystem from '../../js/systems/PatientIntakeSystem.js';
import GuardSystem         from '../../js/systems/GuardSystem.js';
import DispatchSystem      from '../../js/systems/DispatchSystem.js';
import HospitalSiegeSystem from '../../js/systems/HospitalSiegeSystem.js';
import NPCRelationSystem   from '../../js/systems/NPCRelationSystem.js';
import TrapSystem          from '../../js/systems/TrapSystem.js';
import SubwaySystem        from '../../js/systems/SubwaySystem.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';
import EcologySystem       from '../../js/systems/EcologySystem.js';
import ExploreSystem       from '../../js/systems/ExploreSystem.js';

// [시스템, 모듈, 오염 함수, 검증 함수]
const CASES = [
  ['QuestSystem', 'QuestSystem', QuestSystem,
    s => {
      s._progress.collected = { herb: 5 };
      s._progress.treatedNpcs.add('npc_x');
      s._progress.treatedNpcCount = 3;
      s._progress.craftedRecipes.push('bp_x');
      s._warnedDeadlines = { mq_doctor_1: true };
      s._lastDeadlineCheckDay = 300;
    },
    s => {
      expect(s._progress.collected).toEqual({});
      expect(s._progress.treatedNpcs.size).toBe(0);
      expect(s._progress.treatedNpcCount).toBe(0);
      expect(s._progress.craftedRecipes).toEqual([]);
      expect(s._warnedDeadlines).toEqual({});
      expect(s._lastDeadlineCheckDay).toBe(-1);
    }],

  ['EndingSystem', 'EndingSystem', EndingSystem,
    s => { s._lastCheckDay = 300; },
    s => { expect(s._lastCheckDay).toBe(0); }],

  ['SeasonSystem', 'SeasonSystem', SeasonSystem,
    s => { s._lastEventDay = 300; },
    s => { expect(s._lastEventDay).toBe(0); }],

  ['MentalSystem', 'MentalSystem', MentalSystem,
    s => { s._lastWarningTP = 20000; },
    s => { expect(s._lastWarningTP).toBe(0); }],

  ['PatientIntakeSystem', 'PatientIntakeSystem', PatientIntakeSystem,
    s => {
      s._admitted = ['npc_a'];
      s._patientMeta = { npc_a: {} };
      s._rescued = { npc_a: {} };
      s._pendingChoices = { npc_a: {} };
      s._admittedToday = 2;
      s._lastIntakeDay = 300;
      s._currentDay = 300;
    },
    s => {
      expect(s._admitted).toEqual([]);
      expect(s._patientMeta).toEqual({});
      expect(s._rescued).toEqual({});
      expect(s._pendingChoices).toEqual({});
      expect(s._admittedToday).toBe(0);
      expect(s._lastIntakeDay).toBe(-Infinity);
      expect(s._currentDay).toBe(-Infinity);
    }],

  ['GuardSystem', 'GuardSystem', GuardSystem,
    s => { s._entries = { npc_a: {} }; s._currentDay = 300; },
    s => { expect(s._entries).toEqual({}); expect(s._currentDay).toBe(-Infinity); }],

  ['DispatchSystem', 'DispatchSystem', DispatchSystem,
    s => { s._entries = { npc_a: {} }; s._currentDay = 300; },
    s => { expect(s._entries).toEqual({}); expect(s._currentDay).toBe(-Infinity); }],

  ['HospitalSiegeSystem', 'HospitalSiegeSystem', HospitalSiegeSystem,
    s => { s._activeSiegeId = 'siege_x'; s._currentDay = 300; },
    s => { expect(s._activeSiegeId).toBeNull(); expect(s._currentDay).toBe(-Infinity); }],

  ['NPCRelationSystem', 'NPCRelationSystem', NPCRelationSystem,
    s => { s._pendingMemories = [{ npcId: 'a' }]; },
    s => { expect(s._pendingMemories).toEqual([]); }],

  ['TrapSystem', 'TrapSystem', TrapSystem,
    s => { s._progress = { trap_a: 3 }; },
    s => { expect(s._progress).toEqual({}); }],

  ['SubwaySystem', 'SubwaySystem', SubwaySystem,
    s => { s._pendingTravel = { to: 'dobong' }; },
    s => { expect(s._pendingTravel).toBeNull(); }],

  ['HiddenElementSystem', 'HiddenElementSystem', HiddenElementSystem,
    s => { s._choiceResolverActive = true; },
    s => { expect(s._choiceResolverActive).toBe(false); }],

  ['EcologySystem', 'EcologySystem', EcologySystem,
    s => { s._lastMigrationDay = 300; },
    s => { expect(s._lastMigrationDay).toBe(0); }],

  ['ExploreSystem', 'ExploreSystem', ExploreSystem,
    s => { s._currentDayForDecay = 300; },
    s => { expect(s._currentDayForDecay).toBe(-Infinity); }],
];

describe.each(CASES)('%s.resetForNewGame', (label, fileName, system, pollute, verify) => {
  it('메서드를 노출한다', () => {
    expect(typeof system.resetForNewGame).toBe('function');
  });

  it('오염된 상태를 초기값으로 되돌린다', () => {
    pollute(system);
    system.resetForNewGame();
    verify(system);
  });

  it('newGameStarted 이벤트를 init에서 구독한다 — 배선 누락 차단', () => {
    const src = fs.readFileSync(`js/systems/${fileName}.js`, 'utf8');
    expect(src).toContain('newGameStarted');
  });
});

describe('newGameStarted 전파 통합', () => {
  // 개별 링크(메서드 동작·소스에 구독 존재·main.js의 init 호출)를 따로 검증했더라도
  // 실제 전파가 끊겨 있으면 아무 일도 일어나지 않는다. 체인 전체를 한 번 확인한다.
  it('init 후 GameState.resetForNewGame이 시스템 내부 상태까지 되돌린다', async () => {
    const GameState = (await import('../../js/core/GameState.js')).default;

    EndingSystem.init();
    SeasonSystem.init();
    QuestSystem.init();

    EndingSystem._lastCheckDay = 300;
    SeasonSystem._lastEventDay = 300;
    QuestSystem._lastDeadlineCheckDay = 300;
    QuestSystem._progress.collected = { herb: 9 };

    GameState.resetForNewGame();

    expect(EndingSystem._lastCheckDay).toBe(0);
    expect(SeasonSystem._lastEventDay).toBe(0);
    expect(QuestSystem._lastDeadlineCheckDay).toBe(-1);
    expect(QuestSystem._progress.collected).toEqual({});
  });
});

describe('구독 해제 핸들·초기화 플래그는 리셋 대상이 아니다', () => {
  // _unsubscribeXXX나 _initialized를 함께 비우면 EventBus 구독이 끊기거나
  // init이 다시 돌아 리스너가 중복 등록된다. 리셋은 게임 진행 상태만 건드려야 한다.
  it('PatientIntakeSystem은 _initialized·_unsubscribe 핸들을 유지한다', () => {
    PatientIntakeSystem._initialized = true;
    PatientIntakeSystem._unsubscribeTP = () => {};
    PatientIntakeSystem.resetForNewGame();
    expect(PatientIntakeSystem._initialized).toBe(true);
    expect(typeof PatientIntakeSystem._unsubscribeTP).toBe('function');
  });

  it('GuardSystem·DispatchSystem도 초기화 플래그를 유지한다', () => {
    GuardSystem._initialized = true;
    DispatchSystem._initialized = true;
    GuardSystem.resetForNewGame();
    DispatchSystem.resetForNewGame();
    expect(GuardSystem._initialized).toBe(true);
    expect(DispatchSystem._initialized).toBe(true);
  });
});
