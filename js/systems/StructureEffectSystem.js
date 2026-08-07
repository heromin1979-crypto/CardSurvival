// === STRUCTURE EFFECT SYSTEM ===
// 구조물 def.effect(지속 배율·차단)를 집계해 소비처에 제공한다.
// onTick은 매 TP 스탯을 더하는 값이라 StatSystem 루프에서 직접 처리하지만,
// effect는 "감염 증가분 -20%"처럼 다른 계산에 곱해지는 값이라 조회형으로 분리했다.
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData  from '../data/GameData.js';
import BALANCE   from '../data/gameBalance.js';

const NEUTRAL = {
  infectionResist:      0,
  restHealMult:         1.0,
  surgeryHealMult:      1.0,
  medicalStorageSlots:  0,
  infectionSpreadBlock: false,
  detectHiddenDisease:  false,
};

const StructureEffectSystem = {

  init() {
    for (const event of ['boardChanged', 'cardRemoved', 'saveLoaded']) {
      EventBus.on(event, () => this.refresh());
    }
    this.refresh();
  },

  /** 집계값 조회. 미계산 상태면 중립값(효과 없음)을 반환한다. */
  get(gs = GameState) {
    return gs.player?.structureEffects ?? NEUTRAL;
  },

  /** 보드·설치 구조물을 다시 훑어 집계값을 갱신한다. */
  refresh(gs = GameState) {
    if (!gs.player) return NEUTRAL;
    const totals = { ...NEUTRAL };

    for (const { def, effect } of this._activeStructures(gs)) {
      if (typeof effect.infectionResist === 'number') {
        totals.infectionResist += effect.infectionResist;
      }
      // 배율은 합산·곱연산 없이 최대값만 채택 — 침대 여러 개로 무한 증폭 방지
      if (typeof effect.restHealMult === 'number') {
        totals.restHealMult = Math.max(totals.restHealMult, effect.restHealMult);
      }
      if (typeof effect.surgeryHealMult === 'number') {
        totals.surgeryHealMult = Math.max(totals.surgeryHealMult, effect.surgeryHealMult);
      }
      // 보관 용량은 시설을 늘린 만큼 늘어난다
      if (typeof def.storageCapacity === 'number') {
        totals.medicalStorageSlots += def.storageCapacity;
      }
      if (effect.infectionSpreadBlock) totals.infectionSpreadBlock = true;
      if (effect.detectHiddenDisease)  totals.detectHiddenDisease  = true;
    }

    totals.infectionResist = Math.min(
      totals.infectionResist,
      BALANCE.medicalStation.infectionResistCap,
    );

    const prevSlots = gs.player.structureEffects?.medicalStorageSlots ?? 0;
    gs.player.structureEffects = totals;
    // 보관 용량이 바뀌면 적재량 산출 결과도 달라진다
    if (prevSlots !== totals.medicalStorageSlots) gs._updateEncumbrance?.();
    return totals;
  },

  /**
   * 휴식 회복 수치에 구조물 배율을 적용한 새 객체를 반환.
   * 회복 방향(피로는 음수, 나머지는 양수)만 배율 대상이다.
   */
  scaleRestRecovery(effect, gs = GameState) {
    const mult = this.get(gs).restHealMult;
    if (mult === 1.0) return effect;

    const scaled = {};
    for (const [key, val] of Object.entries(effect)) {
      const isRecovery = key === 'fatigue' ? val < 0 : val > 0;
      scaled[key] = isRecovery ? Math.round(val * mult) : val;
    }
    return scaled;
  },

  // 효과를 내는 구조물 목록 — 내구도가 남아 있어야 한다.
  _activeStructures(gs) {
    const found = [];

    for (const card of gs.getBoardCards()) {
      const def = GameData.items[card.definitionId];
      if (!this._hasPassive(def)) continue;
      if ((card.durability ?? 0) <= 0) continue;
      found.push({ def, effect: def.effect ?? {} });
    }

    const installed = gs.location?.installedStructures?.[gs.location?.currentDistrict];
    if (installed?.id && (installed.durability ?? 0) > 0) {
      const def = GameData.items[installed.id];
      if (this._hasPassive(def)) found.push({ def, effect: def.effect ?? {} });
    }

    return found;
  },

  _hasPassive(def) {
    return !!(def?.effect || typeof def?.storageCapacity === 'number');
  },
};

export default StructureEffectSystem;
