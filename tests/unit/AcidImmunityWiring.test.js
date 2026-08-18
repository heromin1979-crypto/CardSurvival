// === 산성 면역(onWear.acidImmunity) 배선 ===
// regression: 내산성 망토의 acidImmunity는 ItemEffectSystem의 툴팁 문자열 한 줄에서만
// 참조되고 어떤 판정도 읽지 않아 완전히 사문화돼 있었다. 산성비 역시 보드의 음식 오염만
// 올릴 뿐 캐릭터에게는 아무 영향이 없었다.
// 이제 산성비는 TP당 HP·감염을 깎고, acidImmunity 장비가 그 노출과 전투의 산성
// 상태이상을 무효화한다. 동료와 직접 피해는 면역 대상이 아니다.
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import StatSystem from '../../js/systems/StatSystem.js';
import EquipmentSystem from '../../js/systems/EquipmentSystem.js';
import DiseaseSystem from '../../js/systems/DiseaseSystem.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import BALANCE from '../../js/data/gameBalance.js';
import { isAcidStatusId } from '../../js/systems/combat/CombatStatusSystem.js';

function resetBoard() {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.equipped = {
    head: null, face: null, body: null, hands: null, backpack: null,
    weapon_main: null, weapon_sub: null, boots: null, accessory: null, belt: null,
  };
  GameState.player.skills = {};
}

function wearCloak() {
  const inst = GameState.createCardInstance('acid_resistant_cloak');
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  expect(EquipmentSystem.equip(inst.instanceId, 'body'), '내산성 망토 장착 실패').toBeTruthy();
  return inst;
}

describe('getArmorEffects — acidImmunity 집계', () => {
  beforeEach(resetBoard);

  it('기본값은 false다', () => {
    expect(StatSystem.getArmorEffects().acidImmunity).toBe(false);
  });

  it('내산성 망토를 입으면 true가 된다', () => {
    wearCloak();
    expect(StatSystem.getArmorEffects().acidImmunity).toBe(true);
  });
});

describe('산성비 노출 — _applyAcidRainExposure', () => {
  let infectionGain;
  let notices;
  const onNotify = ({ message }) => notices.push(message);

  beforeEach(() => {
    resetBoard();
    infectionGain = 0;
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.infectionResistUntilTP = 0;
    GameState.player.permanentInfectionResist = 0;
    GameState.time = { ...(GameState.time ?? {}), totalTP: 10 };
    GameState.flags = { ...(GameState.flags ?? {}), _acidRainWarnedTP: null, _acidRainBlockedNotified: false };
    GameState.basecamp = { buildStage: 0 };
    GameState.ui = { currentState: 'main' };
    GameState.weather = { id: 'acid_rain', name: '산성비', gardenKill: true };
    vi.spyOn(GameState, 'modStat').mockImplementation((stat, value) => {
      if (stat === 'infection') infectionGain += value;
    });
    notices = [];
    EventBus.on('notify', onNotify);
  });

  afterEach(() => {
    EventBus.off('notify', onNotify);
    vi.restoreAllMocks();
  });

  it('산성비를 맞으면 TP당 HP와 감염이 깎인다', () => {
    StatSystem._applyAcidRainExposure();
    expect(GameState.player.hp.current).toBe(100 - BALANCE.acidRain.hpLossPerTP);
    expect(infectionGain).toBe(BALANCE.acidRain.infectionGainPerTP);
  });

  it('내산성 망토를 입으면 HP도 감염도 변하지 않는다', () => {
    wearCloak();
    StatSystem._applyAcidRainExposure();
    expect(GameState.player.hp.current).toBe(100);
    expect(infectionGain).toBe(0);
  });

  it('산성비가 아니면 아무 일도 없다', () => {
    GameState.weather = { id: 'rainy', name: '비' };
    StatSystem._applyAcidRainExposure();
    expect(GameState.player.hp.current).toBe(100);
    expect(infectionGain).toBe(0);
  });

  it('안전 지대(베이스캠프 완공 + 메인 화면)에서는 면제된다', () => {
    GameState.basecamp = { buildStage: 3 };
    StatSystem._applyAcidRainExposure();
    expect(GameState.player.hp.current).toBe(100);
    expect(infectionGain).toBe(0);
  });

  it('노출 경고는 warnIntervalTP마다 다시 뜬다', () => {
    const interval = BALANCE.acidRain.warnIntervalTP;
    const exposedNotices = () => notices.filter(m => m.includes('산성비가 드러난 살')).length;

    GameState.time.totalTP = 100;
    StatSystem._applyAcidRainExposure();
    expect(exposedNotices()).toBe(1);

    // 간격 이전에는 조용히 피해만 들어간다
    GameState.time.totalTP = 100 + interval - 1;
    StatSystem._applyAcidRainExposure();
    expect(exposedNotices()).toBe(1);

    GameState.time.totalTP = 100 + interval;
    StatSystem._applyAcidRainExposure();
    expect(exposedNotices()).toBe(2);
  });

  it('비가 그치면 경고 타이머가 초기화된다', () => {
    GameState.time.totalTP = 100;
    StatSystem._applyAcidRainExposure();
    GameState.weather = { id: 'sunny', name: '맑음' };
    StatSystem._applyAcidRainExposure();
    expect(GameState.flags._acidRainWarnedTP).toBeNull();

    GameState.weather = { id: 'acid_rain', name: '산성비', gardenKill: true };
    GameState.time.totalTP = 101;  // 간격이 지나지 않았어도 새 비는 다시 알린다
    StatSystem._applyAcidRainExposure();
    expect(notices.filter(m => m.includes('산성비가 드러난 살')).length).toBe(2);
  });

  it('망토 착용 시 무피해 알림은 비 한 번에 한 번만 뜬다', () => {
    wearCloak();
    GameState.time.totalTP = 100;
    StatSystem._applyAcidRainExposure();
    GameState.time.totalTP = 100 + BALANCE.acidRain.warnIntervalTP * 3;
    StatSystem._applyAcidRainExposure();
    expect(notices.filter(m => m.includes('타고 흘러내린다')).length).toBe(1);
  });

  // 선언만 있고 호출되지 않으면 조용히 죽는다 — TP 훅에 실제로 물려 있는지 본다
  it('onTP가 산성비 노출을 호출한다', () => {
    vi.spyOn(DiseaseSystem, 'onTP').mockImplementation(() => {});  // DOM HUD 갱신 회피
    const spy = vi.spyOn(StatSystem, '_applyAcidRainExposure');
    StatSystem.onTP();
    expect(spy).toHaveBeenCalled();
  });
});

describe('전투 산성 상태이상 차단', () => {
  const ACID = { id: 'acid_burn', name: '산성 화상', duration: 2, effect: { hpLossPerRound: 5 } };

  beforeEach(() => {
    resetBoard();
    GameState.npcs = { states: {} };
    GameState.combat = {
      playerStatus: [],
      battlefieldStatuses: [],
      fxQueue: [],
      log: [],
      combatants: {
        player: { id: 'player', side: 'ally', sourceType: 'player', statusEffects: [] },
        npc_a:  { id: 'npc_a',  side: 'ally', sourceType: 'npc',    statusEffects: [] },
      },
    };
  });

  it('산성 상태이상 목록이 적·보스·전설 무기 선언을 모두 덮는다', () => {
    expect(isAcidStatusId('acid_burn')).toBe(true);       // zombie_acid
    expect(isAcidStatusId('acid_corrosion')).toBe(true);  // 산성 여왕 기본기·산성 채찍
    expect(isAcidStatusId('armor_corrosion')).toBe(true); // 산성 여왕 궁극기
    expect(isAcidStatusId('acid_pool')).toBe(true);       // 산성 웅덩이 장판
    expect(isAcidStatusId('bleed')).toBe(false);
  });

  it('망토가 없으면 플레이어에게 산성 화상이 붙는다', () => {
    expect(CombatSystem._addAllyStatus('player', ACID)).toBe(true);
    expect(GameState.combat.playerStatus.map(s => s.id)).toContain('acid_burn');
  });

  it('망토를 입으면 플레이어에게 붙지 않는다', () => {
    wearCloak();
    expect(CombatSystem._addAllyStatus('player', ACID)).toBe(false);
    expect(GameState.combat.playerStatus).toHaveLength(0);
  });

  it('산성이 아닌 상태이상은 망토를 입어도 그대로 붙는다', () => {
    wearCloak();
    const bleed = { id: 'bleed', name: '출혈', duration: 2, effect: { hpLossPerRound: 4 } };
    expect(CombatSystem._addAllyStatus('player', bleed)).toBe(true);
    expect(GameState.combat.playerStatus.map(s => s.id)).toContain('bleed');
  });

  it('동료는 플레이어의 망토로 보호되지 않는다', () => {
    wearCloak();
    expect(CombatSystem._addAllyStatus('npc_a', ACID)).toBe(true);
    expect(GameState.combat.combatants.npc_a.statusEffects.map(s => s.id)).toContain('acid_burn');
  });
});

describe('산성 웅덩이 장판 — _tickBattlefieldStatuses', () => {
  let hits;

  beforeEach(() => {
    resetBoard();
    hits = [];
    GameState.npcs = { states: {} };
    GameState.combat = {
      playerStatus: [],
      fxQueue: [],
      log: [],
      combatants: {
        player: { id: 'player', side: 'ally', sourceType: 'player', statusEffects: [] },
        npc_a:  { id: 'npc_a',  side: 'ally', sourceType: 'npc',    statusEffects: [] },
      },
      battlefieldStatuses: [{
        id: 'acid_pool', name: '산성 웅덩이', remainingRounds: 3, effect: { hpLossPerRound: 6 },
      }],
    };
    vi.spyOn(CombatSystem, '_dealDamageToAlly').mockImplementation(({ npcId }) => {
      hits.push(npcId ?? 'player');
    });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('망토가 없으면 플레이어도 동료도 장판을 밟는다', () => {
    CombatSystem._tickBattlefieldStatuses();
    expect(hits).toEqual(['player', 'npc_a']);
  });

  it('망토를 입으면 플레이어만 비껴가고 동료는 그대로 맞는다', () => {
    wearCloak();
    CombatSystem._tickBattlefieldStatuses();
    expect(hits).toEqual(['npc_a']);
  });

  it('산성이 아닌 장판은 망토를 입어도 그대로 맞는다', () => {
    wearCloak();
    GameState.combat.battlefieldStatuses = [{
      id: 'burning_ground', name: '불바다', remainingRounds: 2, effect: { hpLossPerRound: 4 },
    }];
    CombatSystem._tickBattlefieldStatuses();
    expect(hits).toEqual(['player', 'npc_a']);
  });
});
