// === FISHING SYSTEM ===
// 한강 랜드마크 내부에서만 낚시/통발 사용 가능.
// 통발: board.middle에 배치 시 자동 설치, 미끼 필수 (3~4회 소진 후 비활성).
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import SkillSystem from './SkillSystem.js';
import TickEngine  from '../core/TickEngine.js';
import { SKILL_DEFS } from '../data/skillDefs.js';
import BALANCE     from '../data/gameBalance.js';
import GameData    from '../data/GameData.js';

const B = BALANCE.fishing;

const WEATHER_MOD = {
  rainy: 0.05, cloudy: 0.03, monsoon: 0.08,
  sunny: 0,    hot: -0.10,   snow: -0.05, blizzard: -0.15,
};

/** 한강 랜드마크 내부 여부 확인 */
function _isInHangang() {
  return GameState.location?.currentLandmark === 'hangang';
}

/** board.middle + board.bottom에서 definitionId가 일치하는 첫 인스턴스 반환 */
function _findInBoard(defId) {
  const gs   = GameState;
  const rows = [...(gs.board?.middle ?? []), ...(gs.board?.bottom ?? [])];
  for (const instId of rows) {
    if (!instId) continue;
    const inst = gs.cardInstances?.[instId];
    if (inst?.definitionId === defId) return { instId, inst };
  }
  return null;
}

/** board에서 bait 태그를 가진 첫 아이템 반환 */
function _findBaitInBoard() {
  const gs   = GameState;
  const rows = [...(gs.board?.bottom ?? []), ...(gs.board?.middle ?? [])];
  for (const instId of rows) {
    if (!instId) continue;
    const inst = gs.cardInstances?.[instId];
    if (!inst) continue;
    const def = GameData?.items?.[inst.definitionId];
    if (def?.tags?.includes('bait')) return { instId, inst, def };
  }
  return null;
}

/** 낚싯대 definitionId 반환 (개량 > 기본 우선, 미장착 포함) */
function _getRodId() {
  const gs = GameState;
  for (const row of [gs.board?.bottom ?? [], gs.board?.middle ?? []]) {
    for (const instId of row) {
      if (!instId) continue;
      const inst = gs.cardInstances?.[instId];
      const def  = GameData?.items?.[inst?.definitionId];
      if (def?.subtype === 'fishing' && def.id !== 'fish_trap') return def.id;
    }
  }
  return null;
}

/** board.middle에서 설치된 통발 인스턴스 반환 */
function _findInstalledTrap() {
  const gs = GameState;
  for (const instId of gs.board?.middle ?? []) {
    if (!instId) continue;
    const inst = gs.cardInstances?.[instId];
    if (inst?.definitionId === 'fish_trap' && inst._isInstalled) return { instId, inst };
  }
  return null;
}

const FishingSystem = {

  /** 낚시 가능 여부 확인 (한강 랜드마크 내부) */
  canFish() {
    if (!_isInHangang()) {
      EventBus.emit('notify', { message: '한강 랜드마크 안에서만 낚시를 할 수 있습니다.', type: 'warning' });
      return false;
    }
    return true;
  },

  /** 낚시 실행 (2 TP 소모) */
  fish() {
    if (!this.canFish()) return;

    const gs        = GameState;
    const rodId     = _getRodId();
    const baitEntry = _findBaitInBoard();

    // 미끼 필수 확인
    if (!baitEntry) {
      EventBus.emit('notify', { message: '🪱 미끼가 없습니다. 지렁이나 벌레를 인벤토리에 넣어주세요.', type: 'warning' });
      return;
    }

    // 낚싯대 종류 알림
    const rodName = rodId === 'fishing_rod_improved' ? '개량 낚싯대' : (rodId ? '기본 낚싯대' : '맨손');
    const baitName = baitEntry.def.id === 'bait_worm' ? '지렁이' : '벌레';

    // 미끼 소비
    let baitBonus = baitEntry.def.id === 'bait_worm' ? B.baitWormBonus : B.baitInsectBonus;
    const { instId, inst } = baitEntry;
    if ((inst.quantity ?? 1) > 1) {
      gs.cardInstances[instId] = { ...inst, quantity: inst.quantity - 1 };
    } else {
      delete gs.cardInstances[instId];
      const mIdx = gs.board.middle.indexOf(instId);
      if (mIdx !== -1) gs.board.middle[mIdx] = null;
      const bIdx = gs.board.bottom.indexOf(instId);
      if (bIdx !== -1) gs.board.bottom[bIdx] = null;
    }

    // 어획 확률 계산
    const fishingLevel = SkillSystem.getLevel('fishing');
    const bonuses      = SKILL_DEFS.fishing?.getBonuses?.(fishingLevel) ?? { catchChance: B.baseCatchChance, rareFishChance: 0, catchQtyBonus: 0 };
    let catchChance    = bonuses.catchChance;

    if (rodId === 'fishing_rod_improved') catchChance += B.rodImprovedBonus;
    catchChance += baitBonus;

    const weather = gs.weather?.current ?? 'sunny';
    catchChance  += WEATHER_MOD[weather] ?? 0;
    catchChance   = Math.min(0.90, Math.max(0.05, catchChance));
    const pct = Math.round(catchChance * 100);

    // TP 소비
    TickEngine.skipTP(B.tpCostPerCast, '낚시');

    // 낚시 XP (시도 자체)
    SkillSystem.gainXp('fishing', B.xpPerCast);

    EventBus.emit('notify', {
      message: `🎣 ${rodName}에 ${baitName} 미끼를 달고 낚싯줄을 드리웁니다... (성공률 ${pct}%)`,
      type: 'info',
    });

    if (Math.random() >= catchChance) {
      const failMsgs = [
        '🌊 낚시에 실패했습니다. 물고기가 미끼만 가져갔습니다.',
        '💨 입질이 없습니다. 다시 시도해보세요.',
        '🌀 낚싯줄이 엉켰습니다. 허탕이네요.',
      ];
      EventBus.emit('notify', { message: failMsgs[Math.floor(Math.random() * failMsgs.length)], type: 'info' });
      EventBus.emit('boardChanged', {});
      return;
    }

    // 어종 결정
    const isRare = Math.random() < (bonuses.rareFishChance ?? 0);
    const fishId = isRare ? 'fish_large' : (Math.random() < 0.45 ? 'fish_small' : 'fish_medium');
    const fishDef = GameData?.items?.[fishId];
    const fishName = fishDef?.name ?? '물고기';
    const qty    = 1 + (bonuses.catchQtyBonus ?? 0);
    const caught = gs.createCardInstance(fishId, { quantity: qty });
    if (caught) gs.placeCardInRow(caught.instanceId, 'middle');

    if (isRare) {
      SkillSystem.gainXp('fishing', B.xpPerRareFish);
      EventBus.emit('notify', { message: `🐠 대박! 희귀 대형 어류(${fishName})를 낚았습니다! ×${qty}`, type: 'good' });
    } else {
      EventBus.emit('notify', { message: `🐟 낚시 성공! ${fishName}을(를) 잡았습니다. ×${qty}`, type: 'good' });
    }

    EventBus.emit('boardChanged', {});
    EventBus.emit('saveGame');
  },

  /**
   * board.middle에 fish_trap이 놓였을 때 자동 설치
   * 아이템 배치 이벤트에서 호출됨.
   */
  onTrapPlaced(instanceId) {
    const gs   = GameState;
    const inst = gs.cardInstances?.[instanceId];
    if (!inst || inst.definitionId !== 'fish_trap') return;
    if (inst._isInstalled) return; // 이미 설치됨

    if (!_isInHangang()) {
      EventBus.emit('notify', { message: '통발은 한강 랜드마크 안에서만 설치할 수 있습니다.', type: 'warning' });
      return;
    }

    gs.cardInstances[instanceId] = { ...inst, _isInstalled: true, _baitCharges: 0 };
    EventBus.emit('notify', { message: '🪤 통발이 설치되었습니다. 미끼(지렁이/벌레)를 통발에 놓으세요.', type: 'info' });
    EventBus.emit('refreshCard', { instanceId });
  },

  /**
   * 미끼를 통발에 추가 (interactions.js에서 호출)
   * baitCharges를 3~4 증가.
   */
  addBaitToTrap(trapInstId, baitInstId) {
    const gs        = GameState;
    const trapInst  = gs.cardInstances?.[trapInstId];
    const baitInst  = gs.cardInstances?.[baitInstId];
    if (!trapInst || !baitInst) return;
    if (!trapInst._isInstalled) {
      EventBus.emit('notify', { message: '통발이 설치되어 있지 않습니다.', type: 'warning' });
      return;
    }

    const baitDef = GameData?.items?.[baitInst.definitionId];
    const addedCharges = baitDef?.id === 'bait_worm' ? 4 : 3;
    const newCharges   = (trapInst._baitCharges ?? 0) + addedCharges;

    gs.cardInstances[trapInstId] = { ...trapInst, _baitCharges: newCharges };

    // 미끼 소비 (1개 차감)
    if ((baitInst.quantity ?? 1) > 1) {
      gs.cardInstances[baitInstId] = { ...baitInst, quantity: baitInst.quantity - 1 };
    } else {
      delete gs.cardInstances[baitInstId];
      const mIdx = gs.board.middle.indexOf(baitInstId);
      if (mIdx !== -1) gs.board.middle[mIdx] = null;
      const bIdx = gs.board.bottom.indexOf(baitInstId);
      if (bIdx !== -1) gs.board.bottom[bIdx] = null;
    }

    EventBus.emit('notify', { message: `🪱 미끼를 통발에 넣었습니다. 남은 사용 횟수: ${newCharges}회`, type: 'info' });
    EventBus.emit('refreshCard', { instanceId: trapInstId });
    EventBus.emit('saveGame');
  },

  /** 통발 패시브 수확 — trapCheckIntervalTP마다 호출 */
  checkFishTrap() {
    if (!_isInHangang()) return;

    const gs         = GameState;
    const trapResult = _findInstalledTrap();
    if (!trapResult) return;

    const { instId, inst } = trapResult;
    const charges = inst._baitCharges ?? 0;

    if (charges <= 0) {
      // 미끼 없음 → 알림 (중복 방지: 마지막 알림 TP 기록)
      const lastWarnTP = inst._noMikeWarnTP ?? -999;
      if ((GameState.time?.totalTP ?? 0) - lastWarnTP > B.trapCheckIntervalTP * 3) {
        EventBus.emit('notify', { message: '🪤 통발의 미끼가 없습니다. 미끼를 보충하세요.', type: 'warning' });
        gs.cardInstances[instId] = { ...inst, _noMikeWarnTP: GameState.time?.totalTP ?? 0 };
      }
      return;
    }

    // 어획 확률 계산
    const weather    = gs.weather?.current ?? 'sunny';
    let baseChance   = B.trapBaseCatch;
    baseChance      += WEATHER_MOD[weather] ?? 0;
    baseChance       = Math.min(0.80, Math.max(0.10, baseChance));

    if (Math.random() < baseChance) {
      const fishId = Math.random() < 0.3 ? 'fish_medium' : 'fish_small';
      const caught = gs.createCardInstance(fishId, { quantity: 1 });
      if (caught) {
        gs.placeCardInRow(caught.instanceId, 'middle');
        SkillSystem.gainXp('fishing', B.xpPerTrapHarvest);
        EventBus.emit('notify', { message: '🪤 통발에 물고기가 걸렸습니다!', type: 'good' });
      }
    }

    // 미끼 소진 (수확 시도마다 1회 차감)
    const newCharges = charges - 1;
    gs.cardInstances[instId] = { ...inst, _baitCharges: newCharges };

    if (newCharges <= 0) {
      EventBus.emit('notify', { message: '🪤 통발 미끼가 모두 소진되었습니다. 다시 미끼를 보충하세요.', type: 'warning' });
    }

    EventBus.emit('refreshCard', { instanceId: instId });
    EventBus.emit('saveGame');
  },

  init() {
    // 낚시 액션 이벤트
    EventBus.on('fishAction', () => this.fish());

    // 아이템이 board.middle에 놓였을 때 통발 설치 체크
    EventBus.on('cardPlaced', ({ instanceId, row }) => {
      if (row === 'middle') this.onTrapPlaced(instanceId);
    });

    // 미끼 → 통발 드래그 인터랙션 (interactions.js에서 emit)
    EventBus.on('baitToTrap', ({ baitInstId, trapInstId }) => {
      this.addBaitToTrap(trapInstId, baitInstId);
    });

    // trapCheckIntervalTP마다 통발 체크
    EventBus.on('tpAdvance', ({ totalTP }) => {
      if (totalTP > 0 && totalTP % B.trapCheckIntervalTP === 0) this.checkFishTrap();
    });
  },
};

export default FishingSystem;
