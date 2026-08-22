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
import { DISTRICTS }         from '../data/districts.js';
import { getBaitCapacity }  from './baitable.js';

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

/** 구의 fishingQuality를 어획률 보정으로 환산. 미선언 구는 기준치로 본다. */
function _qualityBonus(districtId) {
  const q = DISTRICTS?.[districtId]?.fishingQuality ?? B.fishingQualityBase;
  return (q - B.fishingQualityBase) * B.qualityBonusPerStep;
}

/** 휴대(bottom)·바닥(middle)에 해당 도구가 있는지 */
function _hasTool(defId) {
  const gs = GameState;
  for (const row of [gs.board?.bottom ?? [], gs.board?.middle ?? []]) {
    for (const instId of row) {
      if (instId && gs.cards?.[instId]?.definitionId === defId) return true;
    }
  }
  return false;
}

/**
 * locationFloors 키에서 구 ID를 뽑는다. 키는 구 ID / 랜드마크 키 / 'sl:<구>:<세부장소>'
 * 세 가지가 섞여 있다. 랜드마크 키는 DISTRICTS에 없어 _qualityBonus의 기준치 폴백으로 떨어진다.
 */
function _floorDistrict(key) {
  return key.startsWith('sl:') ? key.split(':')[1] : key;
}

/**
 * 설치된 통발을 전부 수집한다. 현재 바닥(board.middle)을 먼저 훑고,
 * includeRemote면 다른 장소에 두고 온 바닥(locationFloors)까지 훑는다.
 * locationFloors에는 현재 장소의 스냅샷이 그대로 남아 있어(ExploreSystem은 복원 시
 * 키를 지우지 않는다) 같은 인스턴스가 두 번 잡힌다 — instanceId로 중복을 제거한다.
 */
function _findInstalledTraps(includeRemote) {
  const gs    = GameState;
  const found = new Map();
  const scan = (slots, ctx) => {
    for (const instId of slots ?? []) {
      if (!instId || found.has(instId)) continue;
      const inst = gs.cards?.[instId];
      if (inst?.definitionId === 'fish_trap' && inst._isInstalled) {
        found.set(instId, { instId, inst, ...ctx });
      }
    }
  };

  scan(gs.board?.middle, {
    isRemote:   false,
    floor:      null,
    districtId: gs.location?.currentDistrict,
  });

  if (includeRemote) {
    for (const [key, floor] of Object.entries(gs.locationFloors ?? {})) {
      if (Array.isArray(floor)) {
        scan(floor, { isRemote: true, floor, districtId: _floorDistrict(key) });
      }
    }
  }
  return [...found.values()];
}

/**
 * 두고 온 바닥에 물고기를 놓는다. 빈 칸이 없으면 false —
 * 호출부가 미끼를 소모하지 않고 다음 주기로 미룬다.
 */
function _placeOnFloor(floor, fishId) {
  const gs      = GameState;
  const maxSize = gs.board?.middle?.length ?? 10;
  let slot = floor.findIndex(v => !v);
  if (slot < 0) {
    if (floor.length >= maxSize) return false;
    slot = floor.length;
  }
  const caught = gs.createCardInstance(fishId, { quantity: 1 });
  if (!caught) return false;
  floor[slot] = caught.instanceId;
  return true;
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
    catchChance += _qualityBonus(gs.location?.currentDistrict);

    const weather = gs.weather?.id ?? 'sunny';
    catchChance  += WEATHER_MOD[weather] ?? 0;
    // 상한은 두 개다. B.skillCatchChanceCap(0.70)은 스킬 곡선이 Lv.20에
    // 도달하는 값이고, 여기서 쓰는 것은 장비·미끼·날씨까지 더한 최종 상한이다.
    // 0.70으로 자르면 Lv.20 이후 낚싯대와 미끼가 통째로 무의미해진다.
    catchChance   = Math.min(B.hardCatchChanceCap, Math.max(B.minCatchChance, catchChance));
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

    // 어종 결정 — 명인의 루어는 희귀어 확률을, 투망은 마릿수를 올린다
    const rareChance = (bonuses.rareFishChance ?? 0)
                     + (_hasTool('master_angler_lure') ? B.lureRareBonus : 0);
    const isRare = Math.random() < rareChance;
    const fishId = isRare ? 'fish_large' : (Math.random() < (BALANCE.fishing.nonRareSmallChance ?? 0.45) ? 'fish_small' : 'fish_medium');
    const fishDef = GameData?.items?.[fishId];
    const fishName = fishDef?.name ?? '물고기';
    const qty    = 1 + (bonuses.catchQtyBonus ?? 0)
                     + (_hasTool('fishing_net') ? B.netQtyBonus : 0);
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
    // 상한을 넘겨 넣으면 미끼만 사라진다 — def의 baitCapacity로 자른다.
    const capacity     = getBaitCapacity(GameData?.items?.[trapInst.definitionId]);
    const newCharges   = Math.min(capacity, (trapInst._baitCharges ?? 0) + addedCharges);

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

  /**
   * 통발 패시브 수확 — trapCheckIntervalTP마다 호출.
   * 설치된 통발을 전부 독립 처리한다. 자동 포획 장치를 소지하면 낚시터를 떠나 있어도
   * 두고 온 통발까지 돌고, 잡힌 물고기는 그 통발이 있는 바닥에 쌓인다.
   */
  checkFishTrap() {
    const gs   = GameState;
    const here = _isInFishingLandmark();
    const auto = _hasTool('automated_fish_trap');
    if (!here && !auto) return;

    const traps = _findInstalledTraps(auto);
    if (!traps.length) return;

    const ctx = {
      weather:   gs.weather?.id ?? 'sunny',
      crabBonus: _hasTool('crab_trap') ? B.crabTrapBonus : 0,
      auto,
    };
    let touched = false;
    for (const trap of traps) {
      if (this._harvestTrap(trap, ctx)) touched = true;
    }
    if (touched) EventBus.emit('saveGame');
  },

  /** 통발 1기 수확 판정. 상태가 바뀌었으면 true */
  _harvestTrap(trap, ctx) {
    const gs = GameState;
    const { instId, inst, isRemote, floor, districtId } = trap;
    const charges = inst._baitCharges ?? 0;

    if (charges <= 0) {
      // 미끼 없음 → 알림 (중복 방지: 마지막 알림 TP 기록). 두고 온 통발은 조용히 넘긴다.
      if (!isRemote) {
        const lastWarnTP = inst._noMikeWarnTP ?? -999;
        if ((gs.time?.totalTP ?? 0) - lastWarnTP > B.trapCheckIntervalTP * 3) {
          EventBus.emit('notify', { message: '🪤 통발의 미끼가 없습니다. 미끼를 보충하세요.', type: 'warning' });
          inst._noMikeWarnTP = gs.time?.totalTP ?? 0;
        }
      }
      return false;
    }

    // 어획 확률 = 기본 + 날씨 + 구 fishingQuality + 게 통발
    let chance = B.trapBaseCatch;
    chance += WEATHER_MOD[ctx.weather] ?? 0;
    chance += _qualityBonus(districtId);
    chance += ctx.crabBonus;
    chance  = Math.min(B.trapMaxCatch, Math.max(0.10, chance));

    if (Math.random() < chance) {
      const fishId = Math.random() < (B.trapMediumChance ?? 0.3) ? 'fish_medium' : 'fish_small';
      let placed;
      if (isRemote) {
        placed = _placeOnFloor(floor, fishId);
      } else {
        const caught = gs.createCardInstance(fishId, { quantity: 1 });
        placed = !!caught && !!gs.placeCardInRow(caught.instanceId, 'middle');
      }
      // 놓을 자리가 없으면 미끼를 태우지 않고 다음 주기로 미룬다
      if (!placed) return false;

      SkillSystem.gainXp('fishing', B.xpPerTrapHarvest);
      if (!isRemote) {
        EventBus.emit('notify', { message: '🪤 통발에 물고기가 걸렸습니다!', type: 'good' });
      }
    }

    // 미끼 소진 (수확 시도마다 1회). 자동 포획 장치는 절반 확률로 소모를 건너뛴다.
    if (!(ctx.auto && Math.random() < B.autoTrapBaitSave)) {
      inst._baitCharges = charges - 1;
      if (inst._baitCharges <= 0 && !isRemote) {
        EventBus.emit('notify', { message: '🪤 통발 미끼가 모두 소진되었습니다. 다시 미끼를 보충하세요.', type: 'warning' });
      }
    }

    EventBus.emit('refreshCard', { instanceId: instId });
    return true;
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
