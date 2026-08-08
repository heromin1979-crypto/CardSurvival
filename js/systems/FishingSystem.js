// === FISHING SYSTEM ===
// hasFishing 랜드마크(한강 등) 내부에서만 낚시/통발 사용 가능.
// 통발: board.middle에 배치 시 자동 설치, 미끼 필수 (3~4회 소진 후 비활성).
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import SkillSystem from './SkillSystem.js';
import TickEngine  from '../core/TickEngine.js';
import I18n        from '../core/I18n.js';
import { SKILL_DEFS } from '../data/skillDefs.js';
import BALANCE     from '../data/gameBalance.js';
import GameData    from '../data/GameData.js';
import { landmarkHasFishing } from '../data/landmarks.js';

const B = BALANCE.fishing;

const WEATHER_MOD = {
  rainy: 0.05, cloudy: 0.03, monsoon: 0.08,
  sunny: 0,    hot: -0.10,   snow: -0.05, blizzard: -0.15,
};

/** 낚시 가능 랜드마크(hasFishing) 내부 여부 확인 */
function _isInFishingLandmark() {
  return landmarkHasFishing(GameState.location?.currentLandmark);
}

/** board.middle + board.bottom에서 definitionId가 일치하는 첫 인스턴스 반환 */
function _findInBoard(defId) {
  const gs   = GameState;
  const rows = [...(gs.board?.middle ?? []), ...(gs.board?.bottom ?? [])];
  for (const instId of rows) {
    if (!instId) continue;
    const inst = gs.cards?.[instId];
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
    const inst = gs.cards?.[instId];
    if (!inst) continue;
    const def = GameData?.items?.[inst.definitionId];
    if (def?.tags?.includes('bait')) return { instId, inst, def };
  }
  return null;
}

// 티어별 어획 보너스. 하드코딩 분기 대신 표로 두어 신규 낚싯대가 추가돼도
// 여기 한 줄만 늘리면 된다.
const ROD_BONUS = {
  fishing_rod:          B.rodBasicBonus,
  fishing_rod_improved: B.rodImprovedBonus,
  fishing_rod_advanced: B.rodAdvancedBonus,
};

/**
 * 낚싯대 판정. subtype:'fishing'은 통발·투망·게 통발·루어까지 포함하는 낚시 도구
 * 전체라서 낚싯대를 가려낼 수 없다. 명시적인 'rod' 태그로 본다.
 */
export function isFishingRod(def) {
  return !!def?.tags?.includes('rod');
}

/** board.middle에서 설치된 통발 인스턴스 반환 */
function _findInstalledTrap() {
  const gs = GameState;
  for (const instId of gs.board?.middle ?? []) {
    if (!instId) continue;
    const inst = gs.cards?.[instId];
    if (inst?.definitionId === 'fish_trap' && inst._isInstalled) return { instId, inst };
  }
  return null;
}

const FishingSystem = {

  /**
   * 보유 중인 낚싯대 중 어획 보너스가 가장 높은 것의 definitionId.
   * 먼저 찾은 것을 쓰면 배치 순서에 따라 즉석 낚싯대(0%)가 강화 낚싯대(25%)를
   * 밀어내므로 전부 훑어 최고 티어를 고른다.
   */
  getRodId() {
    const gs = GameState;
    let bestId = null;
    let bestBonus = -Infinity;
    for (const row of [gs.board?.bottom ?? [], gs.board?.middle ?? []]) {
      for (const instId of row) {
        if (!instId) continue;
        const def = GameData?.items?.[gs.cards?.[instId]?.definitionId];
        if (!isFishingRod(def)) continue;
        const bonus = this.getRodBonus(def.id);
        if (bonus > bestBonus) { bestBonus = bonus; bestId = def.id; }
      }
    }
    return bestId;
  },

  /** 낚싯대 티어별 어획률 보너스 */
  getRodBonus(rodId) {
    return ROD_BONUS[rodId] ?? 0;
  },

  /** 낚시 가능 여부 확인 (hasFishing 랜드마크 내부) */
  canFish() {
    if (!_isInFishingLandmark()) {
      EventBus.emit('notify', { message: '낚시 가능한 랜드마크(한강 등) 안에서만 낚시를 할 수 있습니다.', type: 'warning' });
      return false;
    }
    return true;
  },

  /** 낚시 실행 (2 TP 소모) */
  fish() {
    if (!this.canFish()) return;

    const gs        = GameState;
    const rodId     = this.getRodId();
    const baitEntry = _findBaitInBoard();

    // 미끼 필수 확인
    if (!baitEntry) {
      EventBus.emit('notify', { message: '🪱 미끼가 없습니다. 지렁이나 벌레를 인벤토리에 넣어주세요.', type: 'warning' });
      return;
    }

    // 낚싯대 종류 알림
    const rodDef  = rodId ? GameData?.items?.[rodId] : null;
    const rodName = rodDef ? I18n.itemName(rodDef.id, rodDef.name) : '맨손';
    const baitName = baitEntry.def.id === 'bait_worm' ? '지렁이' : '벌레';

    // 미끼 소비
    let baitBonus = baitEntry.def.id === 'bait_worm' ? B.baitWormBonus : B.baitInsectBonus;
    const { instId, inst } = baitEntry;
    if ((inst.quantity ?? 1) > 1) {
      inst.quantity = inst.quantity - 1;
    } else {
      gs.removeCardInstance(instId);
    }

    // 어획 확률 계산
    const fishingLevel = SkillSystem.getLevel('fishing');
    const bonuses      = SKILL_DEFS.fishing?.getBonuses?.(fishingLevel) ?? { catchChance: B.baseCatchChance, rareFishChance: 0, catchQtyBonus: 0 };
    let catchChance    = bonuses.catchChance;

    catchChance += this.getRodBonus(rodId);
    catchChance += baitBonus;

    const weather = gs.weather?.id ?? 'sunny';
    catchChance  += WEATHER_MOD[weather] ?? 0;
    catchChance   = Math.min(0.90, Math.max(0.05, catchChance));
    const pct = Math.round(catchChance * 100);

    // TP 소비
    TickEngine.skipTP(B.tpCostPerCast, I18n.t('tick.reasonFishing'));

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
    const fishId = isRare ? 'fish_large' : (Math.random() < (BALANCE.fishing.nonRareSmallChance ?? 0.45) ? 'fish_small' : 'fish_medium');
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
    const inst = gs.cards?.[instanceId];
    if (!inst || inst.definitionId !== 'fish_trap') return;
    if (inst._isInstalled) return; // 이미 설치됨

    if (!_isInFishingLandmark()) {
      EventBus.emit('notify', { message: '통발은 낚시 가능한 랜드마크(한강 등) 안에서만 설치할 수 있습니다.', type: 'warning' });
      return;
    }

    inst._isInstalled = true;
    inst._baitCharges = 0;
    EventBus.emit('notify', { message: '🪤 통발이 설치되었습니다. 미끼(지렁이/벌레)를 통발에 놓으세요.', type: 'info' });
    EventBus.emit('refreshCard', { instanceId });
  },

  /**
   * 미끼를 통발에 추가 (interactions.js에서 호출)
   * baitCharges를 3~4 증가.
   */
  addBaitToTrap(trapInstId, baitInstId) {
    const gs        = GameState;
    const trapInst  = gs.cards?.[trapInstId];
    const baitInst  = gs.cards?.[baitInstId];
    if (!trapInst || !baitInst) return;
    if (!trapInst._isInstalled) {
      EventBus.emit('notify', { message: '통발이 설치되어 있지 않습니다.', type: 'warning' });
      return;
    }

    const baitDef = GameData?.items?.[baitInst.definitionId];
    const addedCharges = baitDef?.id === 'bait_worm' ? 4 : 3;
    const newCharges   = (trapInst._baitCharges ?? 0) + addedCharges;

    trapInst._baitCharges = newCharges;

    // 미끼 소비 (1개 차감)
    if ((baitInst.quantity ?? 1) > 1) {
      baitInst.quantity = baitInst.quantity - 1;
    } else {
      gs.removeCardInstance(baitInstId);
    }

    EventBus.emit('notify', { message: `🪱 미끼를 통발에 넣었습니다. 남은 사용 횟수: ${newCharges}회`, type: 'info' });
    EventBus.emit('refreshCard', { instanceId: trapInstId });
    EventBus.emit('saveGame');
  },

  /** 통발 패시브 수확 — trapCheckIntervalTP마다 호출 */
  checkFishTrap() {
    if (!_isInFishingLandmark()) return;

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
        inst._noMikeWarnTP = GameState.time?.totalTP ?? 0;
      }
      return;
    }

    // 어획 확률 계산
    const weather    = gs.weather?.id ?? 'sunny';
    let baseChance   = B.trapBaseCatch;
    baseChance      += WEATHER_MOD[weather] ?? 0;
    baseChance       = Math.min(B.trapMaxCatch, Math.max(0.10, baseChance));

    if (Math.random() < baseChance) {
      const fishId = Math.random() < (BALANCE.fishing.trapMediumChance ?? 0.3) ? 'fish_medium' : 'fish_small';
      const caught = gs.createCardInstance(fishId, { quantity: 1 });
      if (caught) {
        gs.placeCardInRow(caught.instanceId, 'middle');
        SkillSystem.gainXp('fishing', B.xpPerTrapHarvest);
        EventBus.emit('notify', { message: '🪤 통발에 물고기가 걸렸습니다!', type: 'good' });
      }
    }

    // 미끼 소진 (수확 시도마다 1회 차감)
    const newCharges = charges - 1;
    inst._baitCharges = newCharges;

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
