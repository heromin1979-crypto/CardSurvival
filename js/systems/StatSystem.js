// === STAT SYSTEM ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import TraitSystem  from './TraitSystem.js';
import EndingSystem from './EndingSystem.js';
import SeasonSystem  from './SeasonSystem.js';
import DiseaseSystem from './DiseaseSystem.js';
import SkillSystem   from './SkillSystem.js';

const StatSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  onTP() {
    const gs = GameState;
    if (!gs.player.isAlive) return;

    // 계절 보정값
    const seasonMod = SeasonSystem.getModifiers();

    // Apply decay for each stat (with seasonal multipliers)
    for (const [key, s] of Object.entries(gs.stats)) {
      if (s.decayPerTP === 0) continue;

      // direction: hydration/nutrition/morale/temperature decay DOWN
      //            radiation/infection/fatigue accumulate UP
      const isAccumulator = ['radiation', 'infection', 'fatigue'].includes(key);
      if (!isAccumulator) {
        let decay = s.decayPerTP;
        if (key === 'hydration') decay *= (seasonMod.hydrationDecayMult ?? 1.0);
        gs.modStat(key, -decay);
      }
      // accumulators increase via systems (NoiseSystem, ContaminationSystem, etc.)
    }

    // Fatigue natural increase
    gs.modStat('fatigue', gs.stats.fatigue.decayPerTP);

    // 스태미나 자연 회복 / 과적 소모
    this._updateStamina();
    // 과적·저스태미나 경고
    this._checkWeightWarning();
    this._checkStaminaWarning();

    // 계절 체온 변화 적용
    this._applySeasonalTemperature(seasonMod);

    // Temperature management
    this._applyTemperatureLogic();

    // Structure passive effects (medical_station, barricade 등)
    this._applyStructureEffects();

    // 질병 진행 및 증상 적용
    DiseaseSystem.onTP();

    // Death checks
    this._checkDeaths();
  },

  _applyStructureEffects() {
    const gs = GameState;
    let encounterReduction = 0;

    for (const card of gs.getBoardCards()) {
      const def  = gs.getCardDef(card.instanceId);
      const tick = def?.onTick;
      if (!tick) continue;

      // HP 재생 (medical_station 등)
      if (tick.hp && tick.hp > 0) {
        const healed = Math.min(tick.hp, gs.player.hp.max - gs.player.hp.current);
        if (healed > 0) {
          gs.player.hp.current += healed;
          EventBus.emit('statChanged', { stat: 'hp', oldVal: gs.player.hp.current - healed, newVal: gs.player.hp.current });
        }
      }

      // 감염 감소 (medical_station)
      if (tick.infection && tick.infection < 0) {
        gs.modStat('infection', tick.infection);
      }

      // 조우 확률 감소 (barricade)
      if (tick.encounterReduction && tick.encounterReduction > 0) {
        encounterReduction += tick.encounterReduction;
      }
    }

    // encounterRateReduct을 player에 저장 (ExploreSystem에서 참조)
    gs.player.encounterRateReduct = Math.min(0.70, encounterReduction);
  },

  // ── 계절별 체온 효과 ────────────────────────────────────────────

  _applySeasonalTemperature(seasonMod) {
    const gs = GameState;

    // 체온 하강 (가을/겨울)
    if (seasonMod.tempDecayPerTP < 0) {
      gs.modStat('temperature', seasonMod.tempDecayPerTP);
    }

    // 체온 상승 (여름 — 열사병 위험)
    if (seasonMod.tempRisePerTP > 0) {
      const temp = gs.stats.temperature.current;
      // 열사병: 체온 80 초과 시 상승 억제 & 사기 감소
      if (temp < 85) {
        gs.modStat('temperature', seasonMod.tempRisePerTP);
      }
      if (temp > 80) {
        gs.modStat('morale', -1);
        if (temp > 85) {
          gs.modStat('hydration', -3); // 열사병 추가 탈수
        }
      }
    }
  },

  _applyTemperatureLogic() {
    const gs = GameState;
    const temp = gs.stats.temperature.current;

    // Structures on board affect temp
    const campfireSlot = Object.values(gs.cards).find(c => c.definitionId === 'campfire');
    if (campfireSlot) {
      const onBoard = GameState.getBoardCards().some(c => c.definitionId === 'campfire');
      if (onBoard) gs.modStat('temperature', 2);
    }

    // Cold: morale drop if temp low (severe first)
    if (temp < 10) {
      gs.modStat('morale', -2.0);
    } else if (temp < 20) {
      gs.modStat('morale', -1.0);
    }

    // Extreme cold death tick
    if (temp <= 0) {
      gs.modStat('hydration', -5); // hypothermia increases dehydration sim
    }
  },

  _checkDeaths() {
    const gs = GameState;
    if (!gs.player.isAlive) return;

    const { hydration, nutrition, radiation, infection, fatigue, morale } = gs.stats;

    // 절망: 사기 0 연속 48 TP 이상 → 의지 상실사
    if (morale.current <= 0) {
      gs.flags.despairTicks = (gs.flags.despairTicks ?? 0) + 1;
      if (gs.flags.despairTicks >= 48) {
        this._killPlayer('절망');
        return;
      }
    } else {
      gs.flags.despairTicks = 0;
    }

    // 감염 회복 추적 (50 이상에서 0으로)
    if (infection.current <= 0 && (gs.flags._infectionWasHigh ?? false)) {
      gs.flags.infectionCured = true;
      gs.flags._infectionWasHigh = false;
    }
    if (infection.current >= 50) gs.flags._infectionWasHigh = true;

    if (hydration.current <= 0) {
      this._killPlayer('탈수');
    } else if (nutrition.current <= 0) {
      this._killPlayer('아사');
    } else if (radiation.current >= 100) {
      this._killPlayer('방사선 중독');
    } else if (infection.current >= 100) {
      this._killPlayer('감염 쇼크');
    } else if (fatigue.current >= 100) {
      this._forceCollapse();
    }

    // HP death
    if (gs.player.hp.current <= 0) {
      this._killPlayer('부상 과다');
    }
  },

  _killPlayer(cause) {
    const gs = GameState;
    if (!gs.player.isAlive) return; // prevent double-death
    gs.player.isAlive    = false;
    gs.player.deathCause = cause;
    EndingSystem.triggerDeathEnding(cause, gs);
  },

  _forceCollapse() {
    const gs = GameState;
    gs.flags.collapseCount = (gs.flags.collapseCount ?? 0) + 1;

    // 두 번째 붕괴는 사망
    if (gs.flags.collapseCount >= 2) {
      this._killPlayer('극도 피로');
      return;
    }

    gs.stats.fatigue.current = 95;
    EventBus.emit('notify', { message: '극도의 피로로 쓰러졌다! 즉시 휴식 필요.', type: 'danger' });
    if (gs.ui.currentState !== 'rest') {
      const from = gs.ui.currentState;
      gs.ui.currentState = 'rest';
      EventBus.emit('stateTransition', { from, to: 'rest', data: { forced: true } });
    }
  },

  /**
   * 방사선을 방어구 배율 적용 후 증가
   * @param {number} amount 원본 방사선량
   */
  applyRadiation(amount) {
    if (amount <= 0) return;
    const armor    = this.getArmorEffects();
    const actual   = Math.round(amount * armor.radiationMult);
    GameState.modStat('radiation', actual);
  },

  // ── 스태미나 관련 ────────────────────────────────────────────

  /**
   * 무게 비율에 따른 스태미나 소모 배율 반환
   * ≤50% → 1.0, ≤75% → 1.3, ≤100% → 1.7, ≤150% → 2.5, ≤200% → 3.5, >200% → 4.0
   */
  _getWeightMult(weightPct) {
    if (weightPct <= 0.50) return 1.0;
    if (weightPct <= 0.75) return 1.3;
    if (weightPct <= 1.00) return 1.7;
    if (weightPct <= 1.50) return 2.5;
    if (weightPct <= 2.00) return 3.5;
    return 4.0;
  },

  /**
   * TP마다 호출: 스태미나 자연 회복 / 과적 시 추가 소모
   * ≤100% capacity: +1.5/TP (자연 회복)
   * 100~150%: -0.5/TP (과적 소모)
   * 150~200%: -1.0/TP
   * >200%:    -2.0/TP (심각한 과적)
   */
  _updateStamina() {
    const gs = GameState;
    const st = gs.stats.stamina;
    if (!st) return;
    const pct = gs.player.encumbrance.weightPct ?? 0;
    let delta;
    if      (pct <= 1.0) delta =  1.5;
    else if (pct <= 1.5) delta = -0.5;
    else if (pct <= 2.0) delta = -1.0;
    else                 delta = -2.0;
    gs.modStat('stamina', delta);
  },

  /**
   * 외부(ExploreSystem)에서 이동 시 스태미나 소모 호출
   * @param {number} amount 소모량 (양수)
   */
  drainStamina(amount) {
    if (amount <= 0) return;
    const gs = GameState;
    if (!gs.stats.stamina) return;
    gs.modStat('stamina', -amount);
    this._checkStaminaWarning();
  },

  /**
   * 과적 경고 메시지 (10TP마다 1회, 150% 초과 시 5TP마다)
   */
  _checkWeightWarning() {
    const gs  = GameState;
    const pct = gs.player.encumbrance.weightPct ?? 0;
    if (pct <= 1.0) return;

    const now      = Math.floor(gs.time.totalTP ?? 0);
    const lastWarn = gs.flags._overloadWarnTP ?? -999;
    const interval = pct > 1.5 ? 5 : 10;
    if (now - lastWarn < interval) return;

    gs.flags._overloadWarnTP = now;
    const pctStr = Math.round(pct * 100);
    if (pct > 1.5) {
      EventBus.emit('notify', { message: `⚠ 짐이 너무 무겁습니다! (${pctStr}%) 스태미나가 빠르게 소모됩니다.`, type: 'danger' });
    } else {
      EventBus.emit('notify', { message: `🎒 무거운 짐으로 스태미나가 소모됩니다. (${pctStr}%)`, type: 'warn' });
    }
  },

  /**
   * 스태미나 저하 경고: 30% 미만 시 15TP마다, 0% 시 즉시
   */
  _checkStaminaWarning() {
    const gs = GameState;
    const st = gs.stats.stamina;
    if (!st) return;
    const stPct = st.current / st.max;

    if (st.current <= 0) {
      if (!gs.flags._staminaZeroWarned) {
        gs.flags._staminaZeroWarned = true;
        EventBus.emit('notify', { message: '💀 기력이 다해 이동할 수 없습니다. 먼저 휴식이 필요합니다.', type: 'danger' });
      }
    } else {
      if (gs.flags._staminaZeroWarned) gs.flags._staminaZeroWarned = false;
      if (stPct < 0.3) {
        const now      = Math.floor(gs.time.totalTP ?? 0);
        const lastWarn = gs.flags._staminaLowWarnTP ?? -999;
        if (now - lastWarn >= 15) {
          gs.flags._staminaLowWarnTP = now;
          EventBus.emit('notify', { message: `😮‍💨 몸을 움직이기 힘들어집니다. (스태미나 ${Math.round(stPct * 100)}%)`, type: 'warn' });
        }
      }
    }
  },

  /**
   * 장착된 방어구의 onWear 효과를 집산하여 반환 (player.equipped 스캔)
   * @returns {{ damageReduction: number, critReduction: number, radiationMult: number, contaminationMult: number, infectionMult: number }}
   */
  getArmorEffects() {
    const result = {
      damageReduction:   0,
      critReduction:     0,
      radiationMult:     1.0,
      contaminationMult: 1.0,
      infectionMult:     1.0,
    };
    const equipped = GameState.player.equipped;
    if (!equipped) return result;

    for (const instanceId of Object.values(equipped)) {
      if (!instanceId) continue;
      const w = GameState.getCardDef(instanceId)?.onWear;
      if (!w) continue;
      if (w.damageReduction)   result.damageReduction   += w.damageReduction;
      if (w.critReduction)     result.critReduction     += w.critReduction;
      if (w.radiationMult)     result.radiationMult     *= w.radiationMult;
      if (w.contaminationMult) result.contaminationMult *= w.contaminationMult;
      if (w.infectionMult)     result.infectionMult     *= w.infectionMult;
    }
    // 상한 클램핑: 피해 감소 75%, 크리티컬 감소 90%
    result.damageReduction = Math.min(0.75, result.damageReduction);
    result.critReduction   = Math.min(0.90, result.critReduction);
    return result;
  },

  // Apply consume effect of a card
  consumeCard(instanceId) {
    const gs    = GameState;
    const inst  = gs.cards[instanceId];
    if (!inst) return false;
    const def   = gs.getCardDef(instanceId);
    if (!def) return false;

    const eff = def.onConsume;
    if (!eff) return false;

    // medic 특성 + 의료 스킬: 의료 태그 아이템 회복량 배율
    const isMedical  = def.tags?.includes('medical') ?? false;
    const isCrafted  = inst._crafted ?? false;  // 제작된 음식 여부
    const isFood     = def.subtype === 'food' || def.subtype === 'drink';
    const traitMult  = isMedical ? (TraitSystem.getTraitEffect('medic', 'healMultiplier') ?? 1.0) : 1.0;
    const medSkill   = isMedical ? SkillSystem.getBonus('medicine', 'healMult') : 1.0;
    const cookSkill  = isFood    ? SkillSystem.getBonus('cooking',  'foodEffectMult') : 1.0;
    const healMult   = traitMult * (isMedical ? medSkill : (isFood ? cookSkill : 1.0));

    if (eff.hydration)    gs.modStat('hydration',  eff.hydration * healMult);
    if (eff.nutrition)    gs.modStat('nutrition',   eff.nutrition * healMult);
    if (eff.morale)       gs.modStat('morale',      eff.morale);
    if (eff.fatigue)      gs.modStat('fatigue',     eff.fatigue);
    if (eff.hp) {
      const healed = Math.round(eff.hp * healMult);
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + healed);
      EventBus.emit('statChanged', { stat: 'hp', oldVal: gs.player.hp.current - healed, newVal: gs.player.hp.current });
    }

    // contamination effects
    const contam = eff.contamination === 'inherit' ? inst.contamination : (eff.contamination ?? 0);
    if (contam > 0) {
      const armor    = this.getArmorEffects();
      const radGain  = Math.round((eff.radiation  ?? Math.floor(contam / 10)) * armor.radiationMult);
      const infGain  = Math.round((eff.infection  ?? Math.floor(contam / 8))  * armor.contaminationMult);
      gs.modStat('radiation', radGain);
      gs.modStat('infection', infGain);
      if (contam > 50) {
        EventBus.emit('notify', { message: '오염 물질을 섭취했다! 방사선·감염 위험.', type: 'danger' });
      }
      // 오염 음식/물 → 질병 발병 체크
      DiseaseSystem.checkContaminatedConsume(def, inst.contamination, gs);
    }

    // 아이템 사용 → 질병 치료 체크
    DiseaseSystem.onConsume(def, gs);

    // 스킬 XP: 의료 아이템 사용
    if (isMedical) SkillSystem.gainXp('medicine', 3);
    // 스킬 XP: 제작한 음식 섭취
    if (isFood && isCrafted) SkillSystem.gainXp('cooking', 2);

    // stackable 아이템: 수량 1개만 소모, 0이 되면 제거
    const qty = inst.quantity ?? 1;
    if (def.stackable && qty > 1) {
      inst.quantity = qty - 1;
      gs._updateEncumbrance();
      EventBus.emit('boardChanged', {});
    } else {
      const leave = def.leaveOnConsume;
      gs.removeCardInstance(instanceId);
      EventBus.emit('cardRemoved', { instanceId });

      // 소비 후 남는 용기 (빈병, 빈캔 등) 보드에 배치
      if (leave) {
        const leftover = gs.createCardInstance(leave.definitionId, { quantity: leave.qty ?? 1 });
        if (leftover) {
          const placed = gs.placeCardInRow(leftover.instanceId);
          if (!placed) {
            gs.removeCardInstance(leftover.instanceId);
            EventBus.emit('notify', { message: '보드가 꽉 차 빈 용기를 놓을 수 없습니다.', type: 'warn' });
          }
        }
        EventBus.emit('boardChanged', {});
      }
    }
    return true;
  },
};

export default StatSystem;
