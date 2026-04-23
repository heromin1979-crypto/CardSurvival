// @vitest-environment happy-dom
// === W3-3 통합 테스트 — 의사 대피 UI + HospitalSiegeSystem end-to-end ===
// 목적: Encounter 버튼 클릭 → 2-stage 체인 → siegeResolved emit → HospitalSiegeSystem 반응 검증.
//   - 의사+siege 조건에서만 #enc-evacuate 버튼 렌더
//   - stage1(A/B) → stage2(C/D) 전환
//   - 최종 선택 후 siegeResolved 이벤트 + 사기 변화
//   - outcome 분기: partial_victory (점수 ≥ 20) / defeat (< 20)
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus            from '../../js/core/EventBus.js';
import GameState           from '../../js/core/GameState.js';
import StateMachine        from '../../js/core/StateMachine.js';
import Encounter           from '../../js/screens/Encounter.js';
import HospitalSiegeSystem from '../../js/systems/HospitalSiegeSystem.js';
import BALANCE             from '../../js/data/gameBalance.js';

function setupDom() {
  document.body.innerHTML = `<div id="screen-encounter"></div>`;
}

function resetAll() {
  EventBus._listeners = {};
  setupDom();

  // GameState 초기 상태
  GameState.ui.currentState = 'main';
  GameState.location.currentLandmark = null;   // arriveAfterCombat 우회
  GameState.location.currentNode     = 'dongjak';
  GameState.location.currentDistrict = 'dongjak';
  GameState.location.nodesVisited    = ['dongjak'];
  GameState.player.skills = GameState.player.skills ?? {};
  GameState.player.skills.medicine = { xp: 0, level: 0 };
  GameState.npcs = null;
  GameState.stats.morale = { current: 50, max: 100, decayPerTP: 0.2 };
  GameState.flags = GameState.flags ?? {};
  GameState.flags.siegeWinStreak = 0;
  GameState.flags.lastSiegeWasTutorial = false;

  Encounter._el = null;
  Encounter._data = null;
  Encounter.init();

  // HospitalSiegeSystem.init은 내부 _initialized 가드가 없어 리스너 축적 우려
  // → siegeResolved 리스너를 직접 등록해 _onSiegeResolved를 트리거한다
  EventBus.on('siegeResolved', (p) => HospitalSiegeSystem._onSiegeResolved(p));
}

function triggerSiegeEncounter({ enemies, characterId = 'doctor', isSiege = true, siegeId = 'test_siege' } = {}) {
  GameState.player.characterId = characterId;
  StateMachine.transition('encounter', {
    nodeId: 'dongjak',
    enemies: enemies ?? [{ id: 'raider', name: '약탈자', icon: '👤', description: 'test', hp: { min: 30, max: 30 }, stealthDifficulty: 0.5, specialSkills: [] }],
    dangerLevel: 2,
    noiseLevel:  0,
    isSiege,
    siegeId,
  });
}

describe('W3-3 통합 — 버튼 렌더 조건', () => {
  beforeEach(resetAll);

  it('의사 + isSiege=true → #enc-evacuate 버튼 렌더', () => {
    triggerSiegeEncounter({ characterId: 'doctor', isSiege: true });
    const btn = document.querySelector('#enc-evacuate');
    expect(btn).not.toBeNull();
  });

  it('의사 + isSiege=false → 버튼 미렌더 (일반 조우)', () => {
    triggerSiegeEncounter({ characterId: 'doctor', isSiege: false });
    expect(document.querySelector('#enc-evacuate')).toBeNull();
  });

  it('비의사(soldier) + isSiege=true → 버튼 미렌더', () => {
    triggerSiegeEncounter({ characterId: 'soldier', isSiege: true });
    expect(document.querySelector('#enc-evacuate')).toBeNull();
  });

  it('기본 조우 버튼들(fight/stealth/flee)은 항상 존재', () => {
    triggerSiegeEncounter({ characterId: 'doctor', isSiege: true });
    expect(document.querySelector('#enc-fight')).not.toBeNull();
    expect(document.querySelector('#enc-stealth')).not.toBeNull();
    expect(document.querySelector('#enc-flee')).not.toBeNull();
  });
});

describe('W3-3 통합 — 2단계 체인 전환', () => {
  beforeEach(resetAll);

  it('#enc-evacuate 클릭 → Stage 1 마크업 교체 (evac-a/evac-b 등장)', () => {
    triggerSiegeEncounter();
    document.querySelector('#enc-evacuate').click();

    expect(document.querySelector('#enc-evacuate')).toBeNull();  // 원래 버튼 사라짐
    expect(document.querySelector('#evac-a')).not.toBeNull();
    expect(document.querySelector('#evac-b')).not.toBeNull();
    expect(document.body.innerHTML).toContain('환자 대피 지휘 · 1/2');
  });

  it('Stage 1 → Stage 2 (evac-a 클릭 시 evac-c/evac-d 등장)', () => {
    triggerSiegeEncounter();
    document.querySelector('#enc-evacuate').click();
    document.querySelector('#evac-a').click();

    expect(document.querySelector('#evac-a')).toBeNull();
    expect(document.querySelector('#evac-c')).not.toBeNull();
    expect(document.querySelector('#evac-d')).not.toBeNull();
    expect(document.body.innerHTML).toContain('환자 대피 지휘 · 2/2');
    expect(document.body.innerHTML).toContain('약품 캐비닛');   // Stage1 선택 라벨
  });
});

describe('W3-3 통합 — 최종 outcome 분기', () => {
  beforeEach(resetAll);

  it('A + D + medicine 2 (score 20) → partial_victory → 사기 +5', () => {
    GameState.player.skills.medicine = { xp: 0, level: 2 };
    const moraleBefore = GameState.stats.morale.current;

    triggerSiegeEncounter();
    document.querySelector('#enc-evacuate').click();
    document.querySelector('#evac-a').click();
    document.querySelector('#evac-d').click();

    // score = 0 + 8 + 8 + 2×2 = 20 → threshold 충족 → partial_victory
    const gain = BALANCE.hospitalSiege.doctorEvacuation.partialVictoryMorale;
    expect(GameState.stats.morale.current).toBe(moraleBefore + gain);
    expect(GameState.ui.currentState).toBe('main');   // 전환 확인
  });

  it('B + C + skill 0 + trust 0 (score 11) → defeat → 사기 큰 감소', () => {
    const moraleBefore = GameState.stats.morale.current;

    triggerSiegeEncounter();
    document.querySelector('#enc-evacuate').click();
    document.querySelector('#evac-b').click();
    document.querySelector('#evac-c').click();

    // score = 0 + 6 + 5 + 0 + 0 = 11 → defeat (의사 특권 사기 ×0.75 적용됨)
    expect(GameState.stats.morale.current).toBeLessThan(moraleBefore);
    expect(GameState.ui.currentState).toBe('main');
  });

  it('A + D + trust 3 (score 25) → partial_victory + siegeResolved 이벤트 발행', () => {
    GameState.npcs = {
      recruited: ['a','b','c'],
      trust:     { a: 1, b: 1, c: 1 },
    };
    const events = [];
    EventBus.on('siegeResolved', (p) => events.push(p));

    triggerSiegeEncounter();
    document.querySelector('#enc-evacuate').click();
    document.querySelector('#evac-a').click();
    document.querySelector('#evac-d').click();

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].outcome).toBe('partial_victory');
    expect(events[0].siegeId).toBe('test_siege');
  });
});

describe('W3-3 통합 — 중복 클릭 방어', () => {
  beforeEach(resetAll);

  it('Stage 2에서 같은 버튼을 두 번 클릭해도 한 번만 처리 (siegeResolved 1회만)', () => {
    GameState.player.skills.medicine = { xp: 0, level: 3 };
    const listener = [];
    EventBus.on('siegeResolved', (p) => listener.push(p));

    triggerSiegeEncounter();
    document.querySelector('#enc-evacuate').click();
    document.querySelector('#evac-a').click();
    const finalBtn = document.querySelector('#evac-d');
    finalBtn.click();
    finalBtn.click();   // 재클릭 — 이미 state=main으로 전환되었으므로 버튼 DOM이 남아있어도 무시

    expect(listener.length).toBe(1);
  });
});
