// === STAT SYSTEM ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import TraitSystem  from './TraitSystem.js';
import EndingSystem from './EndingSystem.js';

const StatSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  onTP() {
    const gs = GameState;
    if (!gs.player.isAlive) return;

    // Apply decay for each stat
    for (const [key, s] of Object.entries(gs.stats)) {
      if (s.decayPerTP === 0) continue;

      // direction: hydration/nutrition/morale/temperature decay DOWN
      //            radiation/infection/fatigue accumulate UP
      const isAccumulator = ['radiation', 'infection', 'fatigue'].includes(key);
      if (!isAccumulator) {
        gs.modStat(key, -s.decayPerTP);
      }
      // accumulators increase via systems (NoiseSystem, ContaminationSystem, etc.)
    }

    // Fatigue natural increase
    gs.modStat('fatigue', gs.stats.fatigue.decayPerTP);

    // Temperature management
    this._applyTemperatureLogic();

    // Structure passive effects (medical_station, barricade 등)
    this._applyStructureEffects();

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

  _applyTemperatureLogic() {
    const gs = GameState;
    const temp = gs.stats.temperature.current;

    // Structures on board affect temp
    const campfireSlot = Object.values(gs.cards).find(c => c.definitionId === 'campfire');
    if (campfireSlot) {
      const onBoard = GameState.getBoardCards().some(c => c.definitionId === 'campfire');
      if (onBoard) gs.modStat('temperature', 2);
    }

    // Cold: morale drop if temp low
    if (temp < 20) {
      gs.modStat('morale', -1.0);
    } else if (temp < 10) {
      gs.modStat('morale', -2.0);
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

    // medic 특성: 의료 태그 아이템 회복량 50% 증가
    const isMedical = def.tags?.includes('medical') ?? false;
    const healMult  = isMedical
      ? (TraitSystem.getTraitEffect('medic', 'healMultiplier') ?? 1.0)
      : 1.0;

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
    }

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
