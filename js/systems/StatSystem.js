// === STAT SYSTEM ===
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import I18n         from '../core/I18n.js';
import TraitSystem  from './TraitSystem.js';
import EndingSystem from './EndingSystem.js';
import SeasonSystem  from './SeasonSystem.js';
import DiseaseSystem from './DiseaseSystem.js';
import SkillSystem   from './SkillSystem.js';
import NPCSystem     from './NPCSystem.js';
import BALANCE       from '../data/gameBalance.js';
import CharDialogue  from '../data/charDialogues.js';
import GameData      from '../data/GameData.js';

const StatSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  // ── 사기 구간별 효과 조회 ─────────────────────────────────────
  getMoraleTier() {
    const morale = GameState.stats.morale?.current ?? 50;
    const tiers  = BALANCE.moraleTiers;
    if (morale >= tiers.high.threshold)   return { id: 'high',    ...tiers.high };
    if (morale >= tiers.normal.threshold) return { id: 'normal',  ...tiers.normal };
    if (morale >= tiers.low.threshold)    return { id: 'low',     ...tiers.low };
    return { id: 'despair', ...tiers.despair };
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
        // BALANCE 상수에서 수분/영양/사기 감소율 오버라이드
        if (key === 'hydration') {
          decay = BALANCE.stats.hydrationDecayPerTP;
          decay *= (seasonMod.hydrationDecayMult ?? 1.0);
        } else if (key === 'nutrition') {
          decay = BALANCE.stats.nutritionDecayPerTP;
        } else if (key === 'morale') {
          decay = BALANCE.stats.moraleDecayPerTP;
        }
        gs.modStat(key, -decay);
      }
      // accumulators increase via systems (NoiseSystem, ContaminationSystem, etc.)
    }

    // Fatigue natural increase (사기 구간별 가속)
    const moraleTier = this.getMoraleTier();
    gs.modStat('fatigue', gs.stats.fatigue.decayPerTP * (moraleTier.fatigueGainMult ?? 1.0));

    // 스태미나 자연 회복 / 과적 소모
    this._updateStamina();
    // 과적·저스태미나·저사기 경고
    this._checkWeightWarning();
    this._checkStaminaWarning();
    this._checkMoraleWarning(moraleTier);

    // 계절 체온 변화 적용
    this._applySeasonalTemperature(seasonMod);

    // Temperature management
    this._applyTemperatureLogic();

    // Structure passive effects (medical_station, barricade 등)
    this._applyStructureEffects();

    // 식량 부패 체크 (여름 foodSpoilChance)
    const spoilChance = seasonMod.foodSpoilChance ?? 0;
    if (spoilChance > 0) {
      this._checkFoodSpoilage(spoilChance);
    }

    // 질병 진행 및 증상 적용
    DiseaseSystem.onTP();

    // Death checks
    this._checkDeaths();
  },

  _applyStructureEffects() {
    const gs = GameState;
    let encounterReduction = 0;

    // ── 구역 고정 구조물 효과 (현재 구역에 설치된 구조물) ──
    const currentDistrict = gs.location.currentDistrict;
    const installed = gs.location.installedStructures?.[currentDistrict];
    if (installed?.id) {
      const { items } = GameData;
      const installedDef = items?.[installed.id];
      const tick = installedDef?.onTick;
      if (tick) {
        if (tick.hp && tick.hp > 0) {
          const healed = Math.min(tick.hp, gs.player.hp.max - gs.player.hp.current);
          if (healed > 0) {
            gs.player.hp.current += healed;
            EventBus.emit('statChanged', { stat: 'hp', oldVal: gs.player.hp.current - healed, newVal: gs.player.hp.current });
          }
        }
        if (tick.infection && tick.infection < 0) {
          gs.modStat('infection', tick.infection);
        }
        if (tick.morale && tick.morale > 0) {
          gs.modStat('morale', tick.morale);
        }
        if (tick.fatigue && tick.fatigue < 0) {
          gs.modStat('fatigue', tick.fatigue);
        }
        if (tick.encounterReduction && tick.encounterReduction > 0) {
          encounterReduction += tick.encounterReduction;
        }
      }

      // 내구도 감소 (현재 구역에 있을 때만)
      installed.durability -= BALANCE.medicalStation.durabilityDecayPerTP;
      if (installed.durability <= 0) {
        delete gs.location.installedStructures[currentDistrict];
        EventBus.emit('notify', {
          message: `⚠️ ${installedDef?.name ?? '구조물'}이(가) 노후화로 붕괴했습니다!`,
          type: 'danger',
        });
      }
    }

    // ── 보드 카드 구조물 효과 (바리케이드, 의무거점 등) ──
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

      // 사기 증가 (medical_ward, field_hospital 등)
      if (tick.morale && tick.morale > 0) {
        gs.modStat('morale', tick.morale);
      }

      // 피로 감소 (field_hospital)
      if (tick.fatigue && tick.fatigue < 0) {
        gs.modStat('fatigue', tick.fatigue);
      }

      // 조우 확률 감소 (barricade)
      if (tick.encounterReduction && tick.encounterReduction > 0) {
        encounterReduction += tick.encounterReduction;
      }

      // 의료 구조물 내구도 감소
      if (def.subtype === 'medical' && def.type === 'structure') {
        const inst = gs.cards[card.instanceId];
        if (inst && (inst.durability ?? 0) > 0) {
          inst.durability = Math.max(0, inst.durability - BALANCE.medicalStation.durabilityDecayPerTP);
          if (inst.durability <= 0) {
            gs.removeCardInstance(card.instanceId);
            EventBus.emit('cardRemoved', { instanceId: card.instanceId });
            EventBus.emit('notify', {
              message: `⚠️ ${def.name ?? '의료 구조물'}이(가) 노후화로 붕괴했습니다!`,
              type: 'danger',
            });
          }
        }
      }
    }

    // 빗물 수집기: 날씨 연동 수분 보급 + 내구도 소모
    // 비/장마/눈 → 수집량 증가, 맑음/흐림 → 감소, 산성비 → 중단+경고
    const collectorCard = gs.getBoardCards().find(c => c.definitionId === 'rain_collector');
    if (collectorCard && gs.cards[collectorCard.instanceId]) {
      const cInst = gs.cards[collectorCard.instanceId];
      if ((cInst.durability ?? 0) > 0) {
        const cDef = gs.getCardDef(collectorCard.instanceId);
        const baseHydration = cDef?.onTick?.hydration ?? 0.3;
        const cWeather = gs.weather;
        const cWeatherId = cWeather?.id ?? 'sunny';
        const cIsAcidRain = cWeather?.gardenKill === true;

        // 날씨별 수집 배율
        const COLLECTOR_WEATHER_MULT = {
          rainy: 2.0, monsoon: 2.5, storm: 1.5,  // 비/장마/폭풍: 대량 수집
          snow: 0.5, blizzard: 0.3,               // 눈/폭설: 눈 녹인 물 (소량)
          cloudy: 0.3, overcast: 0.3, foggy: 0.2, // 흐림/안개: 이슬 수준
          sunny: 0.1, clear: 0.1, hot: 0.0,       // 맑음/폭염: 거의 없음
          windy: 0.1,                              // 바람: 증발
        };
        const weatherMult = cIsAcidRain ? 0 : (COLLECTOR_WEATHER_MULT[cWeatherId] ?? 0.1);

        const hydrationGain = baseHydration * weatherMult;
        if (hydrationGain > 0) {
          gs.modStat('hydration', hydrationGain);
        }

        // 산성비 경고 (수집기 전용)
        if (cIsAcidRain && !gs.flags._collectorAcidWarned) {
          gs.flags._collectorAcidWarned = true;
          EventBus.emit('notify', {
            message: I18n.t('statSys.acidRainCollector'),
            type: 'danger',
          });
        } else if (!cIsAcidRain) {
          gs.flags._collectorAcidWarned = false;
        }

        // 산성비가 아닐 때만 내구도 소모 (닫혀있으면 마모 없음)
        if (!cIsAcidRain) {
          cInst.durability = Math.max(0, cInst.durability - BALANCE.campfire.fuelConsumePerTP);
          if (cInst.durability <= 0) {
            EventBus.emit('notify', { message: I18n.t('statSys.collectorBroken'), type: 'warn' });
          }
        }
      }
    }

    // 텃밭: 영양 보급 + 내구도 소모 (계절 + 날씨 gardenYieldMult 적용)
    const gardenCard = gs.getBoardCards().find(c => c.definitionId === 'garden');
    if (gardenCard && gs.cards[gardenCard.instanceId]) {
      const inst = gs.cards[gardenCard.instanceId];
      if ((inst.durability ?? 0) > 0) {
        const gardenDef = gs.getCardDef(gardenCard.instanceId);
        const baseNutrition = gardenDef?.onTick?.nutrition ?? 0.4;
        const seasonMod = SeasonSystem.getModifiers();

        // 산성비 시 텃밭 수확 무효화
        const weather = gs.weather;
        const isAcidRain = weather?.gardenKill === true;
        const yieldMult = isAcidRain ? 0 : (seasonMod.gardenYieldMult ?? 1.0);

        const nutritionGain = baseNutrition * yieldMult;
        if (nutritionGain > 0) {
          gs.modStat('nutrition', nutritionGain);
        }
        inst.durability = Math.max(0, inst.durability - BALANCE.campfire.fuelConsumePerTP);
        if (inst.durability <= 0) {
          EventBus.emit('notify', { message: I18n.t('statSys.gardenWilted'), type: 'warn' });
        }

        // 산성비 경고 (acid rain 전용)
        if (isAcidRain && !gs.flags._gardenAcidWarned) {
          gs.flags._gardenAcidWarned = true;
          EventBus.emit('notify', {
            message: I18n.t('statSys.acidRainGarden'),
            type: 'danger',
          });
        } else if (!isAcidRain) {
          gs.flags._gardenAcidWarned = false;
        }

        // 겨울 완전 정지 알림 (gardenYieldMult === 0)
        if ((seasonMod.gardenYieldMult ?? 1.0) <= 0 && !gs.flags._gardenFrozenWarned) {
          gs.flags._gardenFrozenWarned = true;
          EventBus.emit('notify', { message: I18n.t('statSys.gardenFrozen'), type: 'danger' });
        } else if ((seasonMod.gardenYieldMult ?? 1.0) > 0) {
          gs.flags._gardenFrozenWarned = false;
        }
      }
    }

    // encounterRateReduct을 player에 저장 (ExploreSystem에서 참조)
    gs.player.encounterRateReduct = Math.min(BALANCE.encounter.structureReductCap, encounterReduction);
  },

  // ── 식량 부패 (여름 계절 효과) ──────────────────────────────────

  _checkFoodSpoilage(spoilChance) {
    const gs = GameState;
    for (const card of gs.getBoardCards()) {
      const def = gs.getCardDef(card.instanceId);
      if (!def) continue;
      // food 타입 소모품만 대상
      if (def.type !== 'consumable' || (def.subtype !== 'food' && def.subtype !== 'drink')) continue;
      if (Math.random() >= spoilChance) continue;

      const inst = gs.cards[card.instanceId];
      if (!inst) continue;
      inst.contamination = Math.min(100, (inst.contamination ?? 0) + 25);
      if (inst.contamination >= 100) {
        EventBus.emit('notify', {
          message: I18n.t('statSys.foodSpoiled', { name: I18n.itemName(def.id, def.name) }),
          type: 'danger',
        });
      }
    }
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

    // Structures on board affect temp — 연료(내구도) 소모
    const campfireCard = GameState.getBoardCards().find(c => c.definitionId === 'campfire');
    if (campfireCard && gs.cards[campfireCard.instanceId]) {
      const inst = gs.cards[campfireCard.instanceId];
      if ((inst.durability ?? 0) > 0) {
        gs.modStat('temperature', BALANCE.campfire.tempBoostPerTP);
        inst.durability = Math.max(0, inst.durability - BALANCE.campfire.fuelConsumePerTP);
        if (inst.durability <= 0) {
          EventBus.emit('notify', { message: I18n.t('statSys.campfireEmpty'), type: 'warn' });
        }
      }
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
        this._killPlayer(I18n.t('statSys.deathDespair'));
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
      this._killPlayer(I18n.t('statSys.deathDehydration'));
    } else if (nutrition.current <= 0) {
      this._killPlayer(I18n.t('statSys.deathStarvation'));
    } else if (radiation.current >= 100) {
      this._killPlayer(I18n.t('statSys.deathRadiation'));
    } else if (infection.current >= 100) {
      this._killPlayer(I18n.t('statSys.deathInfection'));
    } else if (fatigue.current >= 100) {
      this._forceCollapse();
    }

    // HP death
    if (gs.player.hp.current <= 0) {
      this._killPlayer(I18n.t('combatSys.deathCause'));
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
      this._killPlayer(I18n.t('statSys.deathFatigue'));
      return;
    }

    gs.stats.fatigue.current = 95;
    EventBus.emit('notify', { message: I18n.t('statSys.collapse'), type: 'danger' });
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
    if      (pct <= 1.0) delta =  BALANCE.stats.staminaRegenPerTP;
    else if (pct <= 1.5) delta = -0.5;
    else if (pct <= 2.0) delta = -1.0;
    else                 delta = -2.0;
    // 사기 구간별 스태미나 회복 배율 (회복일 때만 적용, 소모에는 미적용)
    if (delta > 0) {
      const tier = this.getMoraleTier();
      delta *= (tier.staminaRegenMult ?? 1.0);
    }
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
      EventBus.emit('notify', { message: I18n.t('statSys.severeOverload', { pct: pctStr }), type: 'danger' });
    } else {
      EventBus.emit('notify', { message: I18n.t('statSys.moderateOverload', { pct: pctStr }), type: 'warn' });
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
        EventBus.emit('notify', { message: I18n.t('statSys.noStamina'), type: 'danger' });
      }
    } else {
      if (gs.flags._staminaZeroWarned) gs.flags._staminaZeroWarned = false;
      if (stPct < 0.3) {
        const now      = Math.floor(gs.time.totalTP ?? 0);
        const lastWarn = gs.flags._staminaLowWarnTP ?? -999;
        if (now - lastWarn >= 15) {
          gs.flags._staminaLowWarnTP = now;
          EventBus.emit('notify', { message: I18n.t('statSys.lowStamina', { pct: Math.round(stPct * 100) }), type: 'warn' });
        }
      }
    }
  },

  /**
   * 사기 저하 경고: 구간 변경 시 알림 (30TP마다 반복)
   */
  _checkMoraleWarning(tier) {
    const gs  = GameState;
    if (tier.id === 'high' || tier.id === 'normal') {
      gs.flags._moraleLowWarnTP = undefined;
      return;
    }
    const now      = Math.floor(gs.time.totalTP ?? 0);
    const lastWarn = gs.flags._moraleLowWarnTP ?? -999;
    if (now - lastWarn < 30) return;
    gs.flags._moraleLowWarnTP = now;

    if (tier.id === 'despair') {
      EventBus.emit('notify', {
        message: I18n.t('statSys.despair'),
        type: 'danger',
      });
    } else {
      EventBus.emit('notify', {
        message: I18n.t('statSys.lowMorale'),
        type: 'warn',
      });
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
    // 상한 클램핑: BALANCE 상수 기반
    result.damageReduction = Math.min(BALANCE.armor.damageReductionCap, result.damageReduction);
    result.critReduction   = Math.min(BALANCE.armor.critReductionCap, result.critReduction);
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
    // 감염 감소 효과 (치료제 등 infection < 0)
    if (eff.infection < 0) {
      const reduction = Math.round(eff.infection * (isMedical ? healMult : 1.0));
      gs.modStat('infection', reduction);
    }
    if (eff.radiation < 0) gs.modStat('radiation', eff.radiation);
    if (eff.hp) {
      // 의사 능력: 붕대 사용 시 bandageHpBonus 추가 회복
      const isBandage = def.tags?.includes('bandage') ?? false;
      const bandageBonus = (isBandage && isMedical) ? (gs.player.bandageHpBonus ?? 0) : 0;
      const healed = Math.round(eff.hp * healMult) + bandageBonus;
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + healed);
      EventBus.emit('statChanged', { stat: 'hp', oldVal: gs.player.hp.current - healed, newVal: gs.player.hp.current });
    }

    // contamination effects (medicine 스킬 Lv15+ poisonResist, Lv20 poisonImmune 적용)
    const contam = eff.contamination === 'inherit' ? inst.contamination : (eff.contamination ?? 0);
    if (contam > 0) {
      const armor    = this.getArmorEffects();
      const poisonImmune = SkillSystem.getBonus('medicine', 'poisonImmune');
      const poisonResist = SkillSystem.getBonus('medicine', 'poisonResist') ?? 0;
      const medMult = poisonImmune ? 0 : (1 - poisonResist);
      const radGain  = Math.round((eff.radiation  ?? Math.floor(contam / 10)) * armor.radiationMult * medMult);
      const infGain  = Math.round((eff.infection  ?? Math.floor(contam / 8))  * armor.contaminationMult * medMult);
      gs.modStat('radiation', radGain);
      gs.modStat('infection', infGain);
      if (contam > 50 && !poisonImmune) {
        EventBus.emit('notify', { message: I18n.t('statSys.contamConsumed'), type: 'danger' });
      }
      // 오염 음식/물 → 질병 발병 체크 (면역 시 건너뜀)
      if (!poisonImmune) DiseaseSystem.checkContaminatedConsume(def, inst.contamination, gs);
    }

    // 아이템 사용 → 질병 치료 체크
    DiseaseSystem.onConsume(def, gs);

    // 스킬 XP: 의료 아이템 사용 (붕대/진통제/항생제/구급상자 등 모두)
    if (isMedical) SkillSystem.gainXp('medicine', 3);
    // 스킬 XP: 음식 섭취 — 직접 제작한 음식 +2, 수집한 음식도 +1 (감별 경험)
    if (isFood) SkillSystem.gainXp('cooking', isCrafted ? 2 : 1);
    // 군견 유대감: 식사를 함께한 동반자와 유대감 상승 (+3, 프리미엄 식품은 +5)
    if (isFood) NPCSystem.onPlayerConsumedFood(def.id);
    // 스킬 XP: 물 정수/음용 — 요리 기초 (끓임 여부 관계없이 +1)
    if (def.subtype === 'water' || def.tags?.includes('water')) {
      SkillSystem.gainXp('cooking', 1);
    }

    // 캐릭터 반응 대사
    const charId = gs.player.characterId;
    if (charId && isMedical) {
      const ctx = def.id === 'bandage' ? 'use_bandage'
        : def.id === 'antiseptic'      ? 'use_antiseptic'
        : def.id === 'first_aid_kit'   ? 'use_first_aid_kit'
        : 'use_medicine';
      CharDialogue.emit(charId, ctx);
    }

    // stackable 아이템: 수량 1개만 소모, 0이 되면 제거
    // 약사 능력: 의료 아이템 medicalUsesBonus 확률로 소모 건너뜀
    const medUsesBonus = (isMedical && (gs.player.medicalUsesBonus ?? 0) > 0)
      ? Math.random() < (gs.player.medicalUsesBonus / 3)  // 1회 보너스 → 약 33% 절약
      : false;
    const qty = inst.quantity ?? 1;
    if (medUsesBonus) {
      EventBus.emit('notify', { message: '약사의 절약 투약 — 아이템이 소모되지 않았다.', type: 'good' });
    } else if (def.stackable && qty > 1) {
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
            EventBus.emit('notify', { message: I18n.t('statSys.boardFullLeftover'), type: 'warn' });
          }
        }
        EventBus.emit('boardChanged', {});
      }
    }
    return true;
  },
};

export default StatSystem;
